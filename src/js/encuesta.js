// Encuesta de feedback recompensada (roalburger.com/encuesta?orderId=…). El link lo manda el admin
// por WhatsApp unas horas después de entregar el pedido. Sin SDK de Firebase (la abre gente con datos
// móviles): solo habla con dos callables por HTTP — getOrderFeedbackStatus y submitOrderFeedback.
// Toda la validación (pedido entregado, link habilitado, una respuesta por pedido, puntos) la hace
// el servidor; aquí solo se pinta el flujo.

const CFG = window.FIREBASE_CONFIG || {};
const PROJECT_ID = CFG.projectId || 'roal-burger-menu';
const IS_LOCAL = ['localhost', '127.0.0.1'].includes(location.hostname) && !new URLSearchParams(location.search).has('forceProd');
const FUNCTIONS_BASE = IS_LOCAL
    ? `http://127.0.0.1:5001/${PROJECT_ID}/us-central1`
    : `https://us-central1-${PROJECT_ID}.cloudfunctions.net`;

const orderId = String(new URLSearchParams(location.search).get('orderId') || '').trim();
const app = document.getElementById('encuestaApp');

// Dos cuestionarios: el servidor decide cuál según el pedido (con 2×1 → Quindío; si no → fidelización general).
const PREGUNTAS_QUINDIO = [
    {
        key: 'q1', titulo: '¿Qué tal estuvo el sabor y la calidad de tu Burger Trifásica?',
        opciones: [['brutal', '🔥', 'Brutal 10/10'], ['muy_buena', '😋', 'Muy buena'], ['normalita', '😐', 'Normalita'], ['no_convencio', '😕', 'No me convenció']]
    },
    {
        key: 'q2', titulo: '¿Por dónde te enteraste de nuestra promo?',
        opciones: [['instagram', '📸', 'Instagram'], ['whatsapp', '💬', 'WhatsApp'], ['amigo', '🤝', 'Un amigo'], ['web', '🌐', 'Web']]
    },
    {
        key: 'q3', titulo: '¿Ya instalaste nuestra App en tu pantalla de inicio?',
        opciones: [['si', '✅', 'Sí'], ['no', '❌', 'No'], ['no_sabia', '🤔', 'No sabía']]
    }
];
const PREGUNTAS_GENERAL = [
    {
        key: 'q1', titulo: '¿Qué tal estuvo el sabor y la calidad de tu pedido?',
        opciones: [['brutal', '🔥', 'Brutal 10/10'], ['muy_buena', '😋', 'Muy buena'], ['normalita', '😐', 'Normalita'], ['no_convencio', '😕', 'No me convenció']]
    },
    {
        key: 'q2', titulo: '¿Y el servicio y la entrega?',
        opciones: [['excelente', '🌟', 'Excelente'], ['bien', '👍', 'Bien'], ['mejorable', '🤏', 'Se puede mejorar'], ['mal', '👎', 'Mal']]
    }
];
// Preguntas de seguimiento (solo fidelización): aparecen según lo que respondió antes. Varias opciones a la vez.
// Las claves deben coincidir con functions/feedbackTipo.js (el servidor descarta lo que no esté allí).
const SEG_Q1_FALLO = {
    key: 'q1d', multi: true, titulo: '¿Qué falló? (puedes marcar varias)',
    opciones: [['fria', '🥶', 'Llegó fría'], ['pequena', '🤏', 'Porción pequeña'], ['poco_sabor', '😶', 'Poco sabor'], ['presentacion', '🎨', 'Mala presentación'],
        ['grasosa', '🛢️', 'Muy grasosa o salada'], ['pan', '🍞', 'El pan'], ['carne', '🥩', 'La carne'], ['incompleto', '📦', 'Faltó algo del pedido']]
};
const SEG_Q1_GUSTO = {
    key: 'q1d', multi: true, titulo: '¡Qué bueno! ¿Qué fue lo que más te gustó? (puedes marcar varias)',
    opciones: [['carne', '🥩', 'La carne'], ['salsas', '🧴', 'Las salsas'], ['pan', '🍞', 'El pan'], ['papas', '🍟', 'Las papas'],
        ['tamano', '📏', 'El tamaño'], ['presentacion', '🎨', 'La presentación'], ['precio', '💰', 'El precio']]
};
const SEG_Q2_PROBLEMA = {
    key: 'q2d', multi: true, titulo: '¿Qué pasó con el servicio o la entrega? (puedes marcar varias)',
    opciones: [['demora', '⏱️', 'Se demoró'], ['incompleto', '📦', 'Llegó incompleto'], ['trato', '🙁', 'Trato del domiciliario'],
        ['sin_aviso', '📵', 'No avisó que llegaba'], ['costo_domicilio', '💸', 'Costo del domicilio'], ['error', '🔀', 'Se equivocaron en el pedido']]
};
const Q1_BAJO = ['normalita', 'no_convencio'];
const Q2_BAJO = ['mejorable', 'mal'];
let tipo = 'quindio';
let PREGUNTAS = PREGUNTAS_QUINDIO;

// Lista de pasos de un clic según las respuestas actuales (en fidelización cambia sobre la marcha).
function pasosActuales() {
    if (tipo !== 'general') return PREGUNTAS_QUINDIO;
    const lista = [PREGUNTAS_GENERAL[0]];
    if (respuestas.q1) lista.push(Q1_BAJO.includes(respuestas.q1) ? SEG_Q1_FALLO : SEG_Q1_GUSTO);
    lista.push(PREGUNTAS_GENERAL[1]);
    if (Q2_BAJO.includes(respuestas.q2)) lista.push(SEG_Q2_PROBLEMA);
    return lista;
}
// ¿Algo salió mal? Cambia la última pregunta: mejorar vs. agregar.
const huboQueja = () => Q1_BAJO.includes(respuestas.q1) || Q2_BAJO.includes(respuestas.q2);
const totalPasos = () => pasosActuales().length + 1; // pasos de un clic + sugerencia

const respuestas = {};
let paso = 0;

function esc(v) {
    return String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

async function callFunction(name, data) {
    let resp;
    try {
        resp = await fetch(`${FUNCTIONS_BASE}/${name}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data })
        });
    } catch (_) {
        throw new Error('No pudimos conectar. Revisa tu internet e intenta de nuevo.');
    }
    const json = await resp.json().catch(() => ({}));
    if (json.error) {
        const err = new Error(json.error.message || 'Error');
        err.status = json.error.status;
        throw err;
    }
    if (!resp.ok) throw new Error('No pudimos conectar. Revisa tu internet e intenta de nuevo.');
    return json.result;
}

function pintar(html) {
    app.innerHTML = html;
    app.setAttribute('aria-busy', 'false');
}

function estadoMensaje(emoji, titulo, texto, conBoton = true) {
    pintar(`<div class="en-centro">
        <div class="en-emoji" aria-hidden="true">${emoji}</div>
        <h1 class="en-h">${esc(titulo)}</h1>
        <p class="en-sub">${esc(texto)}</p>
        ${conBoton ? '<a class="en-btn" href="https://roalburger.com/">Ver el menú</a>' : ''}
    </div>`);
}

function progreso() {
    const total = totalPasos();
    return `<div class="en-progreso" aria-hidden="true">${Array.from({ length: total }, (_, i) => `<i class="${i <= paso ? 'on' : ''}"></i>`).join('')}</div>`;
}

function pintarPaso() {
    const pasos = pasosActuales();
    const TOTAL_PASOS = pasos.length + 1;
    if (paso < pasos.length) {
        const p = pasos[paso];
        const sel = Array.isArray(respuestas[p.key]) ? respuestas[p.key] : [respuestas[p.key]];
        pintar(`<div class="en-paso">
            ${progreso()}
            <p class="en-kicker">Pregunta ${paso + 1} de ${TOTAL_PASOS}${p.multi ? ' · opcional' : ''}</p>
            <h1 class="en-h">${esc(p.titulo)}</h1>
            <div class="en-opciones" role="group" aria-label="${esc(p.titulo)}">
                ${p.opciones.map(([val, em, label]) => `<button type="button" class="en-op${sel.includes(val) ? ' sel' : ''}" data-val="${val}"${p.multi ? ' aria-pressed="' + sel.includes(val) + '"' : ''}><span class="em" aria-hidden="true">${em}</span>${esc(label)}</button>`).join('')}
            </div>
            ${p.multi ? '<button type="button" class="en-btn" id="enSigue" style="margin-top:12px">Continuar →</button>' : ''}
            ${paso > 0 ? '<button type="button" class="en-atras" id="enAtras">← Volver</button>' : ''}
        </div>`);
        app.querySelectorAll('.en-op').forEach((btn) => btn.addEventListener('click', () => {
            if (p.multi) { // varias opciones: se marcan y desmarcan; avanza con «Continuar»
                const lista = Array.isArray(respuestas[p.key]) ? respuestas[p.key].slice() : [];
                const i = lista.indexOf(btn.dataset.val);
                if (i >= 0) lista.splice(i, 1); else lista.push(btn.dataset.val);
                respuestas[p.key] = lista;
                btn.classList.toggle('sel', i < 0);
                btn.setAttribute('aria-pressed', String(i < 0));
                return;
            }
            const anterior = respuestas[p.key];
            respuestas[p.key] = btn.dataset.val;
            // Si cambia la rama (de «me gustó» a «no me gustó» o al revés) se borra el detalle que ya no aplica.
            if (anterior && anterior !== btn.dataset.val) {
                if (p.key === 'q1' && Q1_BAJO.includes(anterior) !== Q1_BAJO.includes(btn.dataset.val)) delete respuestas.q1d;
                if (p.key === 'q2' && !Q2_BAJO.includes(btn.dataset.val)) delete respuestas.q2d;
            }
            btn.classList.add('sel');
            setTimeout(() => { paso += 1; pintarPaso(); }, 180); // un clic y avanza
        }));
        document.getElementById('enSigue')?.addEventListener('click', () => { paso += 1; pintarPaso(); });
        document.getElementById('enAtras')?.addEventListener('click', () => { paso -= 1; pintarPaso(); });
        return;
    }

    const general = tipo === 'general';
    const queja = general && huboQueja();
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const [cm, cd] = String(respuestas.cumple || '').split('-');
    pintar(`<div class="en-paso">
        ${progreso()}
        <p class="en-kicker">Pregunta ${totalPasos()} de ${totalPasos()} · opcional</p>
        <h1 class="en-h">${queja ? '¿Qué podríamos hacer para mejorar?' : general ? '¿Qué te gustaría que agregáramos o mejoráramos?' : '¿Qué le mejorarías a la Trifásica?'}</h1>
        <p class="en-sub">${queja ? 'Lamentamos que no haya sido perfecto. Cuéntanos y lo arreglamos.' : general ? 'Un producto, un sabor, el servicio… lo que quieras.' : 'Y si quieres, cuéntanos qué otro producto te gustaría ver en promo.'}</p>
        <textarea class="en-texto" id="enSugerencia" maxlength="500" placeholder="Escribe aquí (puedes dejarlo vacío)" aria-label="Sugerencias"></textarea>
        ${general ? `<p class="en-sub" style="margin-top:14px">📲 Muy pronto lanzamos nuestra App: <strong>descárgala</strong> y entra a premios y descuentos especiales.</p>
        <p class="en-sub" style="margin-top:6px">🎂 ¿Cuándo es tu cumpleaños? Déjanos tu fecha y te tendremos un detalle o descuento especial ese día (opcional).</p>
        <div style="display:flex;gap:8px;justify-content:center;margin-bottom:6px">
            <select id="enCumpleDia" class="en-texto" style="width:auto;min-height:0;padding:10px 12px" aria-label="Día de cumpleaños"><option value="">Día</option>${Array.from({ length: 31 }, (_, i) => `<option value="${String(i + 1).padStart(2, '0')}"${cd === String(i + 1).padStart(2, '0') ? ' selected' : ''}>${i + 1}</option>`).join('')}</select>
            <select id="enCumpleMes" class="en-texto" style="width:auto;min-height:0;padding:10px 12px" aria-label="Mes de cumpleaños"><option value="">Mes</option>${meses.map((m, i) => `<option value="${String(i + 1).padStart(2, '0')}"${cm === String(i + 1).padStart(2, '0') ? ' selected' : ''}>${m}</option>`).join('')}</select>
        </div>` : ''}
        <label class="en-consent" style="display:flex;gap:10px;align-items:flex-start;text-align:left;margin:14px 0 4px;font-size:0.88rem;line-height:1.4">
            <input type="checkbox" id="enConsent" style="margin-top:3px;flex:none" ${respuestas.consentimiento ? 'checked' : ''}>
            <span>Autorizo a ROAL BURGER a guardar mis respuestas y mis datos (nombre y teléfono) y a escribirme por WhatsApp con encuestas, novedades y beneficios. Puedo retirar esta autorización cuando quiera escribiéndoles. <strong>(obligatorio)</strong></span>
        </label>
        <div id="enError"></div>
        <button type="button" class="en-btn" id="enEnviar">Enviar mi opinión 🍔</button>
        <button type="button" class="en-atras" id="enAtras">← Volver</button>
    </div>`);
    const area = document.getElementById('enSugerencia');
    area.value = respuestas.q4 || '';
    // Cumpleaños: solo cuenta si eligió día Y mes.
    const leerCumple = () => {
        const d = document.getElementById('enCumpleDia')?.value || '';
        const m = document.getElementById('enCumpleMes')?.value || '';
        return d && m ? `${m}-${d}` : '';
    };
    document.getElementById('enAtras').addEventListener('click', () => { respuestas.q4 = area.value; respuestas.cumple = leerCumple(); respuestas.consentimiento = document.getElementById('enConsent').checked; paso -= 1; pintarPaso(); });
    document.getElementById('enEnviar').addEventListener('click', () => {
        respuestas.cumple = leerCumple();
        respuestas.consentimiento = document.getElementById('enConsent').checked;
        if (!respuestas.consentimiento) {
            document.getElementById('enError').innerHTML = '<p class="en-error" role="alert">Marca la casilla de autorización para poder enviar tu opinión.</p>';
            return;
        }
        enviar(area.value);
    });
}

async function enviar(sugerencia) {
    respuestas.q4 = sugerencia;
    const btn = document.getElementById('enEnviar');
    const err = document.getElementById('enError');
    btn.disabled = true;
    btn.textContent = 'Enviando…';
    err.innerHTML = '';
    try {
        const res = await callFunction('submitOrderFeedback', { orderId, ...respuestas });
        celebrar();
    } catch (e) {
        if (e.status === 'ALREADY_EXISTS') return estadoMensaje('🙌', '¡Ya nos contaste!', 'Esta encuesta ya fue respondida. ¡Gracias!');
        btn.disabled = false;
        btn.textContent = 'Enviar mi opinión 🍔';
        err.innerHTML = `<p class="en-error" role="alert">${esc(e.message || 'No pudimos enviar tus respuestas. Intenta de nuevo.')}</p>`;
    }
}

function celebrar() {
    pintar(`<div class="en-centro en-celebra">
        <div class="en-emoji pop" aria-hidden="true">🎉</div>
        <h1 class="en-h">¡Gracias!</h1>
        <p class="en-sub">${tipo === 'general' ? 'Tu opinión nos ayuda a mejorar cada pedido. ¡Nos vemos pronto!' : 'Tu opinión nos ayuda a mejorar la Trifásica. ¡Nos vemos pronto!'}</p>
        <a class="en-btn" href="https://roalburger.com/">Volver al menú</a>
    </div>`);
    const colores = ['#FF6B00', '#F5EBDD', '#FF9A3C', '#34d399', '#ffffff'];
    const caja = document.createElement('div');
    caja.className = 'en-confeti';
    caja.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < 40; i += 1) {
        const c = document.createElement('i');
        c.style.left = `${Math.random() * 100}%`;
        c.style.background = colores[i % colores.length];
        c.style.animationDuration = `${2.2 + Math.random() * 2}s`;
        c.style.animationDelay = `${Math.random() * 0.6}s`;
        caja.appendChild(c);
    }
    document.body.appendChild(caja);
    setTimeout(() => caja.remove(), 5500);
}

async function iniciar() {
    if (!orderId) return estadoMensaje('🔗', 'Link incompleto', 'Abre el link completo que te enviamos por WhatsApp.');
    try {
        const st = await callFunction('getOrderFeedbackStatus', { orderId });
        if (st.state === 'answered') return estadoMensaje('🙌', '¡Ya nos contaste!', 'Esta encuesta ya fue respondida. ¡Gracias por tu opinión!');
        if (st.state !== 'ok') return estadoMensaje('🍔', 'Encuesta no disponible', 'Este link no está activo. Si crees que es un error, escríbenos por WhatsApp.');
        tipo = st.tipo === 'general' ? 'general' : 'quindio';
        PREGUNTAS = tipo === 'general' ? PREGUNTAS_GENERAL : PREGUNTAS_QUINDIO;
        pintarPaso();
    } catch (e) {
        pintar(`<div class="en-centro">
            <div class="en-emoji" aria-hidden="true">📡</div>
            <h1 class="en-h">Sin conexión</h1>
            <p class="en-sub">${esc(e.message || 'No pudimos cargar la encuesta.')}</p>
            <button type="button" class="en-btn" id="enReintentar">Reintentar</button>
        </div>`);
        document.getElementById('enReintentar').addEventListener('click', iniciar);
    }
}

iniciar();
