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

const PREGUNTAS = [
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
const TOTAL_PASOS = PREGUNTAS.length + 1; // 3 de un clic + sugerencia

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
    return `<div class="en-progreso" aria-hidden="true">${Array.from({ length: TOTAL_PASOS }, (_, i) => `<i class="${i <= paso ? 'on' : ''}"></i>`).join('')}</div>`;
}

function pintarPaso() {
    if (paso < PREGUNTAS.length) {
        const p = PREGUNTAS[paso];
        pintar(`<div class="en-paso">
            ${progreso()}
            <p class="en-kicker">Pregunta ${paso + 1} de ${TOTAL_PASOS}</p>
            <h1 class="en-h">${esc(p.titulo)}</h1>
            <div class="en-opciones" role="group" aria-label="${esc(p.titulo)}">
                ${p.opciones.map(([val, em, label]) => `<button type="button" class="en-op${respuestas[p.key] === val ? ' sel' : ''}" data-val="${val}"><span class="em" aria-hidden="true">${em}</span>${esc(label)}</button>`).join('')}
            </div>
            ${paso > 0 ? '<button type="button" class="en-atras" id="enAtras">← Volver</button>' : ''}
        </div>`);
        app.querySelectorAll('.en-op').forEach((btn) => btn.addEventListener('click', () => {
            respuestas[p.key] = btn.dataset.val;
            btn.classList.add('sel');
            setTimeout(() => { paso += 1; pintarPaso(); }, 180); // un clic y avanza
        }));
        document.getElementById('enAtras')?.addEventListener('click', () => { paso -= 1; pintarPaso(); });
        return;
    }

    pintar(`<div class="en-paso">
        ${progreso()}
        <p class="en-kicker">Pregunta ${TOTAL_PASOS} de ${TOTAL_PASOS} · opcional</p>
        <h1 class="en-h">¿Qué le mejorarías a la Trifásica?</h1>
        <p class="en-sub">Y si quieres, cuéntanos qué otro producto te gustaría ver en promo.</p>
        <textarea class="en-texto" id="enSugerencia" maxlength="500" placeholder="Escribe aquí (puedes dejarlo vacío)" aria-label="Sugerencias"></textarea>
        <div id="enError"></div>
        <button type="button" class="en-btn" id="enEnviar">Enviar mi opinión 🍔</button>
        <button type="button" class="en-atras" id="enAtras">← Volver</button>
    </div>`);
    const area = document.getElementById('enSugerencia');
    area.value = respuestas.q4 || '';
    document.getElementById('enAtras').addEventListener('click', () => { respuestas.q4 = area.value; paso -= 1; pintarPaso(); });
    document.getElementById('enEnviar').addEventListener('click', () => enviar(area.value));
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
        <p class="en-sub">Tu opinión nos ayuda a mejorar la Trifásica. ¡Nos vemos pronto!</p>
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
