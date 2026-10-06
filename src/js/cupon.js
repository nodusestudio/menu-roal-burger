// Landing pública de "Fuera del Menú" (roalburger.com/cupon?k=<campanaId>). Internamente sigue
// llamándose "cupón pana" (colecciones/funciones): el cliente nunca ve esos nombres.
//
// Deliberadamente SIN el SDK de Firebase: esta página la abre gente que viene de un DM de
// Instagram con datos móviles, y el SDK completo pesa cientos de KB. Lo único que necesita es:
//   1. un GET de cupones_campanas_publico/{id} (API REST de Firestore; las reglas permiten get
//      anónimo y prohíben list), y
//   2. llamar al callable emitirCuponPana (protocolo HTTP de callables: POST {data} → {result}).
// Toda la validación real (cupos, unicidad, consentimiento, precio) la hace el servidor.
//
// El QR se genera aquí mismo (qrcode-generator empaquetado por esbuild, sin CDN) y el .ics y el
// PNG del cupón también se arman en el navegador: nada de esto pasa por el servidor.

import qrcode from 'qrcode-generator';

const CFG = window.FIREBASE_CONFIG || {};
const PROJECT_ID = CFG.projectId || 'roal-burger-menu';
const API_KEY = CFG.apiKey || '';
const RECAPTCHA_SITE_KEY = '6LdVXSotAAAAADkwGbDpxT8P8b24MEv62xTcAlu0';
const INSTAGRAM_URL = 'https://www.instagram.com/roalburgerarmenia/';
const POLL_MS = 20000;
const STORAGE_PREFIX = 'roal_cupon_pana_';
const BOGOTA_OFFSET_MS = -5 * 60 * 60 * 1000; // Colombia: UTC-5 fijo, sin horario de verano
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const CONDICIONES = [
    'Válido solo los días indicados.',
    'Una vez por persona.',
    'Presenta el código en caja o al pedir por WhatsApp.',
    'No acumulable con otras promociones.',
    'Sujeto a cupos disponibles.'
];

// En localhost se usa el emulador (mismo criterio que firebase-config.js); ?forceProd=1 lo evita.
const IS_LOCAL = ['localhost', '127.0.0.1'].includes(location.hostname) && !new URLSearchParams(location.search).has('forceProd');
const FIRESTORE_BASE = IS_LOCAL
    ? `http://127.0.0.1:8080/v1/projects/${PROJECT_ID}/databases/(default)/documents`
    : `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const FUNCTIONS_BASE = IS_LOCAL
    ? `http://127.0.0.1:5001/${PROJECT_ID}/us-central1`
    : `https://us-central1-${PROJECT_ID}.cloudfunctions.net`;

const params = new URLSearchParams(location.search);
const campanaId = String(params.get('k') || '').trim();
const fuente = String(params.get('utm_source') || 'instagram').slice(0, 40);

const app = document.getElementById('cuponApp');
let campana = null;
let pollTimer = null;
let selecciones = {}; // { grupoId: opcion }

// ── Utilidades ───────────────────────────────────────────────────────────────

function esc(v) {
    return String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function money(n) {
    return `$${Number(n || 0).toLocaleString('es-CO')}`;
}

function bogotaParts(ms) {
    const d = new Date(ms + BOGOTA_OFFSET_MS);
    return { y: d.getUTCFullYear(), m: d.getUTCMonth(), d: d.getUTCDate(), dow: d.getUTCDay(), hour: d.getUTCHours() };
}

function formatDias(dias) {
    const names = [1, 2, 3, 4, 5, 6, 0].filter((d) => (dias || []).includes(d)).map((d) => DIAS[d]);
    if (names.length <= 1) return names.join('');
    return `${names.slice(0, -1).join(', ')} y ${names[names.length - 1]}`;
}

function formatFecha(ms) {
    if (!ms) return '';
    const p = bogotaParts(ms);
    return `${p.d} de ${MESES[p.m]}`;
}

function storageGet(key) {
    try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (_) { return null; }
}

function storageSet(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) { /* modo privado: no pasa nada */ }
}

function storageDel(key) {
    try { localStorage.removeItem(key); } catch (_) { /* idem */ }
}

// Firestore REST devuelve valores tipados ({stringValue}, {integerValue}, …): se aplanan a JS.
function decodeValue(v) {
    if (!v || typeof v !== 'object') return null;
    if ('stringValue' in v) return v.stringValue;
    if ('integerValue' in v) return Number(v.integerValue);
    if ('doubleValue' in v) return Number(v.doubleValue);
    if ('booleanValue' in v) return v.booleanValue;
    if ('timestampValue' in v) return Date.parse(v.timestampValue);
    if ('nullValue' in v) return null;
    if ('arrayValue' in v) return (v.arrayValue.values || []).map(decodeValue);
    if ('mapValue' in v) return decodeFields(v.mapValue.fields || {});
    return null;
}

function decodeFields(fields) {
    const out = {};
    Object.keys(fields || {}).forEach((k) => { out[k] = decodeValue(fields[k]); });
    return out;
}

async function fetchCampana(id) {
    const url = `${FIRESTORE_BASE}/cupones_campanas_publico/${encodeURIComponent(id)}${API_KEY && !IS_LOCAL ? `?key=${API_KEY}` : ''}`;
    const resp = await fetch(url, { cache: 'no-store' });
    if (resp.status === 404 || resp.status === 403) return null;
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const json = await resp.json();
    return decodeFields(json.fields || {});
}

// Documentos públicos de configuración (configuracion/* es de lectura pública salvo el PIN):
// config_landing (dirección del local, si el negocio la guardó) y config_horario (etiqueta).
async function fetchConfigDoc(id) {
    try {
        const url = `${FIRESTORE_BASE}/configuracion/${encodeURIComponent(id)}${API_KEY && !IS_LOCAL ? `?key=${API_KEY}` : ''}`;
        const resp = await fetch(url, { cache: 'no-store' });
        if (!resp.ok) return null;
        return decodeFields((await resp.json()).fields || {});
    } catch (_) {
        return null;
    }
}

async function callFunction(name, data) {
    const resp = await fetch(`${FUNCTIONS_BASE}/${name}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data })
    });
    const json = await resp.json().catch(() => ({}));
    if (json.error) {
        const err = new Error(json.error.message || 'Error');
        err.status = json.error.status;
        throw err;
    }
    if (!resp.ok) throw new Error('No pudimos conectar. Revisa tu internet e intenta de nuevo.');
    return json.result;
}

// reCAPTCHA v3 invisible: se carga una sola vez, solo cuando hay formulario que enviar.
let recaptchaPromise = null;
function loadRecaptcha() {
    if (recaptchaPromise) return recaptchaPromise;
    recaptchaPromise = new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
        s.async = true;
        s.onload = () => window.grecaptcha.ready(() => resolve(window.grecaptcha));
        s.onerror = () => { recaptchaPromise = null; reject(new Error('No se pudo cargar la verificación de seguridad.')); };
        document.head.appendChild(s);
    });
    return recaptchaPromise;
}

async function getRecaptchaToken() {
    const g = await loadRecaptcha();
    return g.execute(RECAPTCHA_SITE_KEY, { action: 'cupon_pana' });
}

// La vista pública ya trae gruposOpciones; una vista vieja (antes de los grupos) solo tiene
// toppingsOpciones, que es un único grupo "Extra" (igual que gruposDeCampana en el servidor).
function gruposDe(c) {
    if (Array.isArray(c.gruposOpciones) && c.gruposOpciones.length) return c.gruposOpciones;
    return Array.isArray(c.toppingsOpciones) && c.toppingsOpciones.length
        ? [{ id: 'extra', nombre: 'Extra', opciones: c.toppingsOpciones, requerido: true }]
        : [];
}

// "2× Burger Normal (Mediana · 2 carnes)": mismo formato que el ticket de cocina y el panel
// (_cpanaRenglonTexto en admin.js). Un renglón sin variante se ve como siempre.
function renglonTexto(p) {
    const cant = Number(p?.cantidad || 1);
    const pre = cant > 1 ? `${cant}× ` : '';
    // "Nombre para el cliente" del panel, si existe (SYNC: renglonTexto en functions/cuponPana.js).
    if (p?.nombreCliente) return `${pre}${p.nombreCliente}`;
    return `${pre}${p?.nombre || ''}${p?.variante ? ` (${p.variante})` : ''}`;
}

function composicionTexto(composicion) {
    return (composicion || []).map(renglonTexto).filter(Boolean).join(' + ');
}

// Un cupón guardado en este navegador antes de los grupos solo trae "topping".
function seleccionesDe(r) {
    if (Array.isArray(r.selecciones) && r.selecciones.length) return r.selecciones;
    return r.topping ? [{ grupo: 'Extra', opcion: r.topping }] : [];
}

// ── Render ───────────────────────────────────────────────────────────────────

function setView(html) {
    app.innerHTML = html;
    app.setAttribute('aria-busy', 'false');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function heroHtml(c) {
    const img = c.imagenUrl ? `<img class="cp-hero-img" src="${esc(c.imagenUrl)}" alt="${esc(c.titulo)}" loading="eager">` : '';
    const comp = esc(composicionTexto(c.composicion));
    return `
        <section class="cp-hero liquid-glass">
            ${img}
            <div class="cp-hero-body">
                <p class="cp-kicker">🎟️ Fuera del Menú · exclusivo Instagram</p>
                <h1 class="cp-title">${esc(c.titulo)}</h1>
                ${comp ? `<p class="cp-comp">${comp}</p>` : ''}
                ${c.notaCocina ? `<p class="cp-nota">🧂 ${esc(c.notaCocina)}</p>` : ''}
                ${c.descripcion ? `<p class="cp-desc">${esc(c.descripcion)}</p>` : ''}
                <div class="cp-price-row">
                    <span class="cp-price">${money(c.precio)}</span>
                    <span class="cp-cupos" id="cpCupos"><span class="cp-dot"></span>Quedan ${Number(c.cuposRestantes || 0)}</span>
                </div>
                <p class="cp-days">📅 Válido ${esc(formatDias(c.diasValidos))}${c.fechaFin ? ` · hasta el ${esc(formatFecha(c.fechaFin))}` : ''}</p>
            </div>
        </section>`;
}

function renderFormulario(c) {
    // Un bloque de chips por grupo ("Extra a elegir", "Bebida", …), con su nombre como título.
    const gruposHtml = gruposDe(c).map((g) => `
            <fieldset class="cp-field cp-toppings" data-grupo="${esc(g.id)}">
                <legend>${esc(g.nombre)}${g.requerido === false ? ' <em class="cp-opcional">(opcional)</em>' : ''}</legend>
                <div class="cp-chips">${(g.opciones || []).map((o) => `
                    <button type="button" class="cp-chip" data-grupo="${esc(g.id)}" data-opcion="${esc(o)}" aria-pressed="false">${esc(o)}</button>`).join('')}</div>
            </fieldset>`).join('');
    setView(`
        ${heroHtml(c)}
        <form class="cp-card liquid-glass" id="cpForm" novalidate>
            <h2 class="cp-h2">¡Epa! Este cupón es pa' ti</h2>
            <p class="cp-sub">Déjanos tus datos y te damos tu código personal. Es intransferible, ¿ok?</p>

            <label class="cp-field">
                <span>Tu nombre</span>
                <input type="text" name="nombre" maxlength="40" autocomplete="given-name" placeholder="Ej. Andreína" required>
            </label>
            <label class="cp-field">
                <span>Tu usuario de Instagram</span>
                <input type="text" name="igHandle" maxlength="31" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="@tu.usuario" required>
            </label>
            <label class="cp-field">
                <span>Tu WhatsApp</span>
                <input type="tel" name="telefono" inputmode="numeric" maxlength="16" autocomplete="tel-national" placeholder="300 123 4567" required>
            </label>

${gruposHtml}

            <label class="cp-check">
                <input type="checkbox" name="aceptaDatos" required>
                <span>Autorizo a ROAL BURGER a tratar mis datos para emitir y gestionar este cupón, según la <a href="/politica-datos" target="_blank" rel="noopener">política de tratamiento de datos</a>. <em>(obligatorio)</em></span>
            </label>
            <label class="cp-check">
                <input type="checkbox" name="aceptaMarketing">
                <span>Quiero recibir promociones de ROAL BURGER por WhatsApp. <em>(opcional)</em></span>
            </label>

            <p class="cp-error" id="cpError" role="alert" hidden></p>
            <button type="submit" class="cp-btn cp-btn--primary" id="cpSubmit">QUIERO MI CUPÓN</button>
            <p class="cp-recaptcha-note">Protegido por reCAPTCHA de Google: aplican su <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">privacidad</a> y sus <a href="https://policies.google.com/terms" target="_blank" rel="noopener">términos</a>.</p>
        </form>
        ${condicionesHtml()}`);

    const form = document.getElementById('cpForm');
    form.querySelectorAll('.cp-chip').forEach((chip) => {
        chip.addEventListener('click', () => {
            const grupo = chip.dataset.grupo;
            // En un grupo opcional, tocar la opción ya elegida la quita.
            const opcional = gruposDe(c).find((g) => g.id === grupo)?.requerido === false;
            const quitar = opcional && selecciones[grupo] === chip.dataset.opcion;
            if (quitar) delete selecciones[grupo]; else selecciones[grupo] = chip.dataset.opcion;
            form.querySelectorAll(`.cp-chip[data-grupo="${CSS.escape(grupo)}"]`)
                .forEach((c2) => c2.setAttribute('aria-pressed', String(!quitar && c2 === chip)));
        });
    });
    form.addEventListener('submit', onSubmit);
    loadRecaptcha().catch(() => { /* se reintenta al enviar */ });
    startPolling();
}

function condicionesHtml() {
    return `
        <section class="cp-card cp-cond liquid-glass">
            <h3 class="cp-h3">Condiciones</h3>
            <ul>${CONDICIONES.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
        </section>`;
}

function showError(msg) {
    const el = document.getElementById('cpError');
    if (!el) return;
    el.textContent = msg;
    el.hidden = !msg;
    if (msg) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

async function onSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const btn = document.getElementById('cpSubmit');
    const fd = new FormData(form);
    const nombre = String(fd.get('nombre') || '').trim();
    const igHandle = String(fd.get('igHandle') || '').trim();
    const telefono = String(fd.get('telefono') || '').replace(/\D/g, '');

    // Chequeo rápido para no gastar un viaje al servidor; la validación que manda es la del servidor.
    if (nombre.length < 2) return showError('Escribe tu nombre.');
    if (!/^@?[A-Za-z0-9._]{1,30}$/.test(igHandle)) return showError('Escribe tu usuario de Instagram (ej. @tu.usuario).');
    if (!/^(57)?3\d{9}$/.test(telefono)) return showError('Escribe un celular colombiano válido (10 dígitos, empieza en 3).');
    const faltante = gruposDe(campana || {}).find((g) => g.requerido !== false && !selecciones[g.id]);
    if (faltante) return showError(`Elige una opción en "${faltante.nombre}" 🔥`);
    if (!fd.get('aceptaDatos')) return showError('Necesitamos tu autorización de datos para darte el cupón.');

    showError('');
    btn.disabled = true;
    btn.textContent = 'GENERANDO TU CUPÓN…';
    try {
        const recaptchaToken = await getRecaptchaToken();
        const result = await callFunction('emitirCuponPana', {
            campanaId, nombre, igHandle, telefono,
            selecciones,
            aceptaDatos: true,
            aceptaMarketing: Boolean(fd.get('aceptaMarketing')),
            recaptchaToken,
            fuente
        });
        storageSet(STORAGE_PREFIX + campanaId, { ...result, igHandle, telefono });
        stopPolling();
        renderCupon(result);
    } catch (err) {
        if (err.status === 'RESOURCE_EXHAUSTED' && /acabaron/i.test(err.message)) {
            stopPolling();
            renderAgotado();
            return;
        }
        showError(err.message || 'Algo salió mal. Intenta de nuevo.');
        btn.disabled = false;
        btn.textContent = 'QUIERO MI CUPÓN';
    }
}

// SVG del QR (vectorial, nítido en cualquier pantalla) a partir de la matriz de módulos.
function qrMatrix(text) {
    const qr = qrcode(0, 'M');
    qr.addData(text);
    qr.make();
    const n = qr.getModuleCount();
    const rows = [];
    for (let r = 0; r < n; r++) {
        const row = [];
        for (let c = 0; c < n; c++) row.push(qr.isDark(r, c));
        rows.push(row);
    }
    return rows;
}

function qrSvg(text) {
    const m = qrMatrix(text);
    const n = m.length;
    const quiet = 2;
    let path = '';
    m.forEach((row, r) => row.forEach((dark, c) => { if (dark) path += `M${c + quiet} ${r + quiet}h1v1h-1z`; }));
    const size = n + quiet * 2;
    return `<svg class="cp-qr" viewBox="0 0 ${size} ${size}" role="img" aria-label="Código QR del cupón" shape-rendering="crispEdges"><rect width="${size}" height="${size}" fill="#fff"/><path d="${path}" fill="#151515"/></svg>`;
}

function renderCupon(r) {
    const c = r.campana || {};
    const pendienteActivar = r.estado === 'emitido' && c.requiereActivacionWA;
    setView(`
        ${r.yaExistia ? '<p class="cp-banner">Ya tenías tu cupón 😉 Aquí está otra vez.</p>' : '<p class="cp-banner">¡Listo! 🎉 Este es tu cupón.</p>'}
        <article class="cp-ticket" id="cpTicket">
            <div class="cp-ticket-head">
                <img src="/isotipo.webp" alt="" width="40" height="40">
                <div>
                    <p class="cp-ticket-kicker">FUERA DEL MENÚ</p>
                    <p class="cp-ticket-title">${esc(c.titulo)}</p>
                </div>
                <span class="cp-ticket-price">${money(c.precio)}</span>
            </div>
            ${composicionTexto(c.composicion) ? `<p class="cp-ticket-comp">🍔 ${esc(composicionTexto(c.composicion))}</p>` : ''}
            <p class="cp-ticket-name">Para: <strong>${esc(r.nombre)}</strong></p>
            <div class="cp-ticket-code-row">
                <div>
                    <p class="cp-ticket-label">Tu código</p>
                    <p class="cp-ticket-code">${esc(r.codigo)}</p>
                    ${seleccionesDe(r).map((d) => `<p class="cp-ticket-label">${esc(d.grupo)}</p><p class="cp-ticket-val">🔥 ${esc(d.opcion)}</p>`).join('')}
                </div>
                ${qrSvg(r.codigo)}
            </div>
            ${c.notaCocina ? `<p class="cp-ticket-nota">🧂 ${esc(c.notaCocina)}</p>` : ''}
            <p class="cp-ticket-days">📅 Válido ${esc(formatDias(c.diasValidos))}${c.fechaFin ? ` · hasta el ${esc(formatFecha(c.fechaFin))}` : ''}</p>
            ${pendienteActivar ? '<p class="cp-ticket-warn">⚠️ Actívalo por WhatsApp desde el mismo número con el que lo pediste para poder usarlo.</p>' : ''}
            <p class="cp-ticket-legal">Personal e intransferible · una vez por persona · no acumulable</p>
        </article>

        ${pendienteActivar
        // Fase 2 (activación por el WhatsApp de cupones): primero activar; el pedido se arma después.
        ? `<div class="cp-actions"><a class="cp-btn cp-btn--wa" href="${esc(r.waLink)}" target="_blank" rel="noopener">ACTIVAR POR WHATSAPP</a></div>`
        : pedidoStepHtml(r)}
        <div class="cp-actions">
            <button type="button" class="cp-btn cp-btn--ghost" id="cpIcsBtn">⏰ RECORDÁRMELO</button>
            <button type="button" class="cp-btn cp-btn--ghost" id="cpPngBtn">⬇️ GUARDAR CUPÓN</button>
        </div>
        ${condicionesHtml()}
        <p class="cp-foot"><a href="#" id="cpOtroNumero">¿No eres tú? Reclamar con otro número</a></p>`);

    if (!pendienteActivar) wirePedidoStep(r);
    document.getElementById('cpIcsBtn').addEventListener('click', () => downloadIcs(r));
    document.getElementById('cpPngBtn').addEventListener('click', () => downloadPng(r).catch(() => alert('No pudimos generar la imagen. Toma una captura de pantalla 😉')));
    document.getElementById('cpOtroNumero').addEventListener('click', (e) => {
        e.preventDefault();
        storageDel(STORAGE_PREFIX + campanaId);
        init();
    });
}

// ── "¿Cómo lo quieres?" ─────────────────────────────────────────────────────

const MODALIDADES = {
    local: { label: '🍽️ COMER EN EL LOCAL' },
    recoger: { label: '🏃 RECOGER' },
    domicilio: { label: '🛵 DOMICILIO' }
};

function pedidoStepHtml(r) {
    return `
        <section class="cp-card cp-pedido liquid-glass" id="cpPedido">
            <h3 class="cp-h3">¿Cómo lo quieres?</h3>
            <div class="cp-modos" role="group" aria-label="Cómo lo quieres">
                ${Object.entries(MODALIDADES).map(([k, m]) => `<button type="button" class="cp-modo" data-modo="${k}" aria-pressed="false">${m.label}</button>`).join('')}
            </div>
            <div id="cpModoPanel"></div>
        </section>`;
}

function pagoChipsHtml(pago) {
    return `
        <fieldset class="cp-field cp-toppings">
            <legend>¿Cómo vas a pagar?</legend>
            <div class="cp-chips">
                ${[['efectivo', 'Efectivo'], ['transferencia', 'Transferencia']].map(([v, t]) => `<button type="button" class="cp-chip" data-pago="${v}" aria-pressed="${pago === v}">${t}</button>`).join('')}
            </div>
        </fieldset>`;
}

function telefonoFieldHtml(r) {
    return `
        <label class="cp-field">
            <span>Tu WhatsApp (el mismo con que reclamaste el cupón)</span>
            <input type="tel" name="telefono" inputmode="numeric" maxlength="16" autocomplete="tel-national" placeholder="300 123 4567" value="${esc(r.telefono || '')}" required>
        </label>`;
}

async function renderModoLocal(panel) {
    panel.innerHTML = `
        <p class="cp-modo-msg">Perfecto 🍔 Muestra este código en caja cuando llegues y lo preparamos al momento.</p>
        <div id="cpLocalInfo" class="cp-local-info"></div>`;
    // Dirección y horario SOLO de la configuración guardada; si no existen, no se inventan.
    const [landing, horario] = await Promise.all([fetchConfigDoc('config_landing'), fetchConfigDoc('config_horario')]);
    const info = document.getElementById('cpLocalInfo');
    if (!info) return;
    const direccion = String(landing?.address || '').trim();
    const etiqueta = String(horario?.etiquetaHorario || '').trim();
    info.innerHTML = [
        direccion ? `<p>📍 ${esc(direccion)}</p>` : '',
        etiqueta ? `<p>🕓 ${esc(etiqueta)}</p>` : ''
    ].join('');
}

function renderModoPedido(panel, r, modo) {
    const prev = r.pedidoPreparado && r.pedidoPreparado.modalidad === modo ? r.pedidoPreparado : {};
    const domicilio = modo === 'domicilio';
    panel.innerHTML = `
        <form id="cpPedidoForm" novalidate>
            ${domicilio ? `
            <label class="cp-field"><span>Dirección completa</span>
                <input type="text" name="direccion" maxlength="150" autocomplete="street-address" placeholder="Ej. Cra 14 #22-10 apto 301" value="${esc(prev.direccion || '')}" required></label>
            <label class="cp-field"><span>Barrio</span>
                <input type="text" name="barrio" maxlength="60" placeholder="Ej. Granada" value="${esc(prev.barrio || '')}" required></label>
            <label class="cp-field"><span>Referencias o indicaciones <em class="cp-opcional">(opcional)</em></span>
                <input type="text" name="referencias" maxlength="150" placeholder="Ej. portón negro, timbre 2" value="${esc(prev.referencias || '')}"></label>` : ''}
            ${telefonoFieldHtml(r)}
            ${pagoChipsHtml(prev.pago || '')}
            <p class="cp-modo-msg">${domicilio
                ? 'El valor del domicilio se suma al precio del cupón y te lo confirmamos por WhatsApp.'
                : 'Tu pedido estará listo 25 a 30 minutos después de que te confirmemos por WhatsApp.'}</p>
            <p class="cp-error" id="cpPedidoError" role="alert" hidden></p>
            <div id="cpPedidoAviso"></div>
            <button type="submit" class="cp-btn cp-btn--wa" id="cpPedidoBtn">ENVIAR PEDIDO POR WHATSAPP</button>
        </form>`;
    const form = document.getElementById('cpPedidoForm');
    let pago = prev.pago || '';
    form.querySelectorAll('[data-pago]').forEach((chip) => chip.addEventListener('click', () => {
        pago = chip.dataset.pago;
        form.querySelectorAll('[data-pago]').forEach((c2) => c2.setAttribute('aria-pressed', String(c2 === chip)));
    }));
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        enviarPedido(r, modo, form, pago);
    });
    // Un error viejo no debe quedarse en pantalla mientras el cliente ya lo está corrigiendo.
    form.addEventListener('input', () => pedidoError(''));
}

function pedidoError(msg) {
    const el = document.getElementById('cpPedidoError');
    if (!el) return;
    el.textContent = msg;
    el.hidden = !msg;
}

async function enviarPedido(r, modo, form, pago) {
    const fd = new FormData(form);
    const telefono = String(fd.get('telefono') || '').replace(/\D/g, '');
    const datos = {
        codigo: r.codigo, telefono, modalidad: modo, pago,
        direccion: String(fd.get('direccion') || '').trim(),
        barrio: String(fd.get('barrio') || '').trim(),
        referencias: String(fd.get('referencias') || '').trim()
    };
    // Chequeo rápido; el que manda es el servidor (prepararPedidoCupon).
    if (modo === 'domicilio' && datos.direccion.length < 5) return pedidoError('Escribe la dirección completa.');
    if (modo === 'domicilio' && datos.barrio.length < 2) return pedidoError('Escribe el barrio.');
    if (!/^(57)?3\d{9}$/.test(telefono)) return pedidoError('Escribe tu celular (10 dígitos, empieza en 3).');
    if (!pago) return pedidoError('Elige cómo vas a pagar.');
    pedidoError('');
    const btn = document.getElementById('cpPedidoBtn');
    btn.disabled = true;
    btn.textContent = 'PREPARANDO TU PEDIDO…';
    try {
        const recaptchaToken = await getRecaptchaToken();
        const res = await callFunction('prepararPedidoCupon', { ...datos, recaptchaToken });
        // Recordar lo enviado en este navegador (prellenar si vuelve a abrir el cupón).
        const guardado = storageGet(STORAGE_PREFIX + campanaId) || r;
        storageSet(STORAGE_PREFIX + campanaId, { ...guardado, telefono, pedidoPreparado: res.pedidoPreparado });
        r.telefono = telefono;
        r.pedidoPreparado = res.pedidoPreparado;
        mostrarListoParaEnviar(res);
    } catch (err) {
        pedidoError(err.message || 'No pudimos preparar tu pedido. Intenta de nuevo.');
    } finally {
        btn.disabled = false;
        btn.textContent = 'ENVIAR PEDIDO POR WHATSAPP';
    }
}

// Abierto y válido hoy → directo a WhatsApp. Cerrado (horario o cierre programado) o día no
// válido → se avisa ANTES de enviar y el cliente decide; nunca se bloquea.
function mostrarListoParaEnviar(res) {
    const aviso = document.getElementById('cpPedidoAviso');
    const avisos = [];
    if (res.horario && res.horario.abierto === false) {
        // La hora ya termina en punto ("4:00 p. m."): no duplicarlo.
        const cerrado = `Ahora estamos cerrados${res.horario.proximaApertura ? `; abrimos ${res.horario.proximaApertura}` : ''}`;
        avisos.push(`${cerrado}${cerrado.endsWith('.') ? '' : '.'} Puedes enviarlo y te respondemos apenas abramos.`);
    }
    if (res.cuponValidoHoy === false) {
        avisos.push(`Ojo: tu cupón es válido solo ${res.diasValidosTexto}. Hoy no se puede usar.`);
    }
    if (!avisos.length) {
        aviso.innerHTML = `<p class="cp-modo-msg">¡Listo! Abriendo WhatsApp… Si no se abre, toca el botón.</p>
            <a class="cp-btn cp-btn--wa" href="${esc(res.waLink)}" target="_blank" rel="noopener">ABRIR WHATSAPP</a>`;
        window.location.href = res.waLink;
        return;
    }
    aviso.innerHTML = `${avisos.map((t) => `<p class="cp-aviso">⚠️ ${esc(t)}</p>`).join('')}
        <a class="cp-btn cp-btn--wa" href="${esc(res.waLink)}" target="_blank" rel="noopener">ENVIAR DE TODOS MODOS POR WHATSAPP</a>`;
    aviso.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function wirePedidoStep(r) {
    const panel = document.getElementById('cpModoPanel');
    const elegir = (modo) => {
        document.querySelectorAll('.cp-modo').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.modo === modo)));
        if (modo === 'local') renderModoLocal(panel);
        else renderModoPedido(panel, r, modo);
    };
    document.querySelectorAll('.cp-modo').forEach((b) => b.addEventListener('click', () => elegir(b.dataset.modo)));
    // Si ya había preparado un pedido en este navegador, volver a mostrarlo para editarlo.
    if (r.pedidoPreparado && MODALIDADES[r.pedidoPreparado.modalidad]) elegir(r.pedidoPreparado.modalidad);
}

function renderAgotado() {
    setView(`
        <section class="cp-card cp-state liquid-glass">
            <p class="cp-state-emoji">🔥</p>
            <h1 class="cp-title">Se acabaron los cupones de esta semana</h1>
            <p class="cp-sub">Síguenos, el lunes sale uno nuevo.</p>
            <a class="cp-btn cp-btn--primary" href="${INSTAGRAM_URL}" target="_blank" rel="noopener">SEGUIR A @ROALBURGERARMENIA</a>
            <a class="cp-btn cp-btn--ghost" href="/">VER EL MENÚ</a>
        </section>`);
}

function renderInactiva() {
    setView(`
        <section class="cp-card cp-state liquid-glass">
            <p class="cp-state-emoji">🍔</p>
            <h1 class="cp-title">Este cupón ya no está disponible</h1>
            <p class="cp-sub">Tranquilo: en nuestro Instagram siempre sale algo nuevo. Mientras tanto, échale un ojo al menú.</p>
            <a class="cp-btn cp-btn--primary" href="/">VER EL MENÚ</a>
            <a class="cp-btn cp-btn--ghost" href="${INSTAGRAM_URL}" target="_blank" rel="noopener">IR A INSTAGRAM</a>
        </section>`);
}

function renderErrorCarga() {
    setView(`
        <section class="cp-card cp-state liquid-glass">
            <p class="cp-state-emoji">📶</p>
            <h1 class="cp-title">No pudimos cargar el cupón</h1>
            <p class="cp-sub">Revisa tu conexión e intenta de nuevo.</p>
            <button type="button" class="cp-btn cp-btn--primary" id="cpRetry">REINTENTAR</button>
        </section>`);
    document.getElementById('cpRetry').addEventListener('click', init);
}

// ── Contador en vivo ─────────────────────────────────────────────────────────

function startPolling() {
    stopPolling();
    pollTimer = setInterval(async () => {
        if (document.hidden) return;
        try {
            const fresh = await fetchCampana(campanaId);
            if (!fresh || !fresh.activa) return;
            campana = fresh;
            const el = document.getElementById('cpCupos');
            if (el) el.innerHTML = `<span class="cp-dot"></span>Quedan ${Number(fresh.cuposRestantes || 0)}`;
            if (Number(fresh.cuposRestantes || 0) <= 0) { stopPolling(); renderAgotado(); }
        } catch (_) { /* siguiente vuelta */ }
    }, POLL_MS);
}

function stopPolling() {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = null;
}

// ── Recordatorio .ics ────────────────────────────────────────────────────────

// Primer día válido desde hoy (hora Bogotá), dentro de las fechas de la campaña. Si hoy es
// válido pero ya pasaron las 4:00 pm, el recordatorio va para el siguiente día válido.
function primerDiaValidoMs(c) {
    const now = Date.now();
    const dias = c.diasValidos || [];
    for (let i = 0; i < 21; i++) {
        const p = bogotaParts(now + i * 86400000);
        const eventMs = Date.UTC(p.y, p.m, p.d, 16, 0, 0) - BOGOTA_OFFSET_MS; // 4:00 pm Bogotá
        if (!dias.includes(p.dow)) continue;
        if (eventMs <= now) continue;
        if (c.fechaInicio && eventMs < c.fechaInicio - 16 * 3600000) continue;
        if (c.fechaFin && eventMs > c.fechaFin) break;
        return eventMs;
    }
    return null;
}

function icsDate(ms) {
    return new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function icsEscape(s) {
    return String(s || '').replace(/[\\;,]/g, (m) => `\\${m}`).replace(/\n/g, '\\n');
}

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
}

function downloadIcs(r) {
    const c = r.campana || {};
    const start = primerDiaValidoMs(c);
    if (!start) {
        alert('Ya no quedan días válidos para este cupón.');
        return;
    }
    const elegido = seleccionesDe(r).map((d) => `${d.grupo}: ${d.opcion}`).join('\n');
    const desc = `Tu código: ${r.codigo}${elegido ? `\n${elegido}` : ''}${c.notaCocina ? `\n${c.notaCocina}` : ''}\nPreséntalo en caja o pide por WhatsApp: ${r.waLink}`;
    const ics = [
        'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//ROAL BURGER//Fuera del Menu//ES', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        `UID:cupon-${r.codigo}@roalburger.com`,
        `DTSTAMP:${icsDate(Date.now())}`,
        `DTSTART:${icsDate(start)}`,
        `DTEND:${icsDate(start + 3600000)}`,
        `SUMMARY:${icsEscape(`🍔 Usa tu cupón Fuera del Menú ${r.codigo} — ROAL BURGER`)}`,
        `DESCRIPTION:${icsEscape(desc)}`,
        'LOCATION:ROAL BURGER\\, Cl. 22 #29-59\\, Armenia',
        'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${icsEscape(`Hoy puedes usar tu cupón Fuera del Menú ${r.codigo}`)}`, 'TRIGGER:-PT3H', 'END:VALARM',
        'END:VEVENT', 'END:VCALENDAR'
    ].join('\r\n');
    downloadBlob(new Blob([ics], { type: 'text/calendar;charset=utf-8' }), `fuera-del-menu-${r.codigo}.ics`);
}

// ── PNG del cupón ────────────────────────────────────────────────────────────

function loadImage(src) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = src;
    });
}

function wrapLines(ctx, text, maxWidth) {
    const words = String(text).split(' ');
    const lines = [];
    let line = '';
    words.forEach((w) => {
        const test = line ? `${line} ${w}` : w;
        if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = w; } else { line = test; }
    });
    if (line) lines.push(line);
    return lines;
}

// Se dibuja a mano (no captura del DOM) para no depender de librerías ni de imágenes de otros
// dominios, que "ensucian" el canvas y bloquean toBlob(). Solo se usa el isotipo propio.
async function downloadPng(r) {
    const c = r.campana || {};
    try { await document.fonts.load('700 40px Oswald'); } catch (_) { /* fuente de respaldo */ }
    const W = 1080;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    const ctx = canvas.getContext('2d');
    const head = "'Oswald', 'Arial Narrow', sans-serif";
    // Las líneas de selecciones + nota se miden ANTES de fijar la altura (cambiar el tamaño del
    // canvas lo borra): con 3 grupos la tarjeta crece en vez de cortar texto.
    ctx.font = '500 36px Roboto, Arial, sans-serif';
    const detalle = [
        ...(composicionTexto(c.composicion) ? wrapLines(ctx, `🍔 ${composicionTexto(c.composicion)}`, W - 220) : []),
        ...seleccionesDe(r).flatMap((d) => wrapLines(ctx, `🔥 ${d.grupo}: ${d.opcion}`, W - 220)),
        ...(c.notaCocina ? wrapLines(ctx, `🧂 ${c.notaCocina}`, W - 220) : [])
    ];
    const H = 1340 + detalle.length * 46 + 150;
    canvas.height = H;

    ctx.fillStyle = '#f3e9d8';
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    roundRect(ctx, 60, 60, W - 120, H - 120, 48);
    ctx.clip(); // la franja naranja respeta las esquinas redondeadas de la tarjeta
    ctx.fillStyle = '#1c1c1e';
    ctx.fillRect(60, 60, W - 120, H - 120);
    ctx.fillStyle = '#FF6B00';
    ctx.fillRect(60, 60, W - 120, 18);
    ctx.restore();

    const logo = await loadImage('/isotipo.png');
    if (logo) ctx.drawImage(logo, 110, 130, 110, 110);
    ctx.fillStyle = '#FF6B00';
    ctx.font = `700 40px ${head}`;
    ctx.fillText('FUERA DEL MENÚ', 250, 175);
    ctx.fillStyle = '#ffffff';
    ctx.font = `700 52px ${head}`;
    wrapLines(ctx, String(c.titulo || '').toUpperCase(), 720).slice(0, 2).forEach((l, i) => ctx.fillText(l, 250, 240 + i * 60));

    ctx.fillStyle = '#FF6B00';
    ctx.font = `700 72px ${head}`;
    ctx.fillText(money(c.precio), 110, 420);

    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '400 34px Roboto, Arial, sans-serif';
    ctx.fillText(`Para: ${r.nombre}`, 110, 490);

    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = `600 30px ${head}`;
    ctx.fillText('TU CÓDIGO', 110, 590);
    ctx.fillStyle = '#ffffff';
    ctx.font = `700 120px ${head}`;
    ctx.fillText(r.codigo.split('').join(' '), 110, 720);

    // QR sobre blanco
    const m = qrMatrix(r.codigo);
    const qrSize = 360;
    const qx = (W - qrSize) / 2;
    const qy = 790;
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, qx - 24, qy - 24, qrSize + 48, qrSize + 48, 24);
    ctx.fill();
    const cell = qrSize / m.length;
    ctx.fillStyle = '#151515';
    m.forEach((row, ri) => row.forEach((dark, ci) => { if (dark) ctx.fillRect(qx + ci * cell, qy + ri * cell, Math.ceil(cell), Math.ceil(cell)); }));

    ctx.fillStyle = '#ffffff';
    ctx.font = '500 36px Roboto, Arial, sans-serif';
    detalle.forEach((l, i) => ctx.fillText(l, 110, 1270 + i * 46));
    const yDias = 1270 + detalle.length * 46 + 10;
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.font = '400 30px Roboto, Arial, sans-serif';
    wrapLines(ctx, `📅 Válido ${formatDias(c.diasValidos)}${c.fechaFin ? ` · hasta el ${formatFecha(c.fechaFin)}` : ''}`, W - 220)
        .slice(0, 2).forEach((l, i) => ctx.fillText(l, 110, yDias + i * 40));
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '400 24px Roboto, Arial, sans-serif';
    ctx.fillText('Personal e intransferible · una vez por persona · no acumulable · roalburger.com', 110, H - 110);

    const blob = await new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob'))), 'image/png'));
    downloadBlob(blob, `fuera-del-menu-${r.codigo}.png`);
}

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}

// ── Arranque ─────────────────────────────────────────────────────────────────

async function init() {
    stopPolling();
    selecciones = {};
    if (!/^[A-Za-z0-9_-]{2,40}$/.test(campanaId)) {
        renderInactiva();
        return;
    }
    // Comodidad por dispositivo: quien ya reclamó y vuelve a abrir el link ve su cupón directo.
    const saved = storageGet(STORAGE_PREFIX + campanaId);
    if (saved && saved.codigo) {
        renderCupon(saved);
        return;
    }
    try {
        campana = await fetchCampana(campanaId);
    } catch (_) {
        renderErrorCarga();
        return;
    }
    const now = Date.now();
    if (!campana || !campana.activa || (campana.fechaFin && now > campana.fechaFin)) {
        renderInactiva();
        return;
    }
    if (Number(campana.cuposRestantes || 0) <= 0) {
        renderAgotado();
        return;
    }
    renderFormulario(campana);
}

init();
