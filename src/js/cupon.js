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
    const conFoto = Boolean(c.imagenUrl);
    // La foto del combo es lo primero que debe pintarse: eager + fetchpriority alta, con
    // width/height para que el navegador reserve el espacio (sin saltos). Sin foto, un fondo de
    // marca intencional (degradado carbón-naranja con el isotipo), nunca un hueco vacío.
    return `
        <header class="cp-hero${conFoto ? '' : ' cp-hero--marca'}" id="cpHero">
            ${conFoto
        ? `<img class="cp-hero-img" id="cpHeroImg" src="${esc(c.imagenUrl)}" alt="${esc(`Foto del combo ${c.titulo}`)}" width="1080" height="1350" loading="eager" fetchpriority="high" decoding="async">`
        : '<img class="cp-hero-logo-bg" src="/isotipo.webp" alt="" width="360" height="360" aria-hidden="true">'}
            <div class="cp-hero-shade"></div>
            <div class="cp-hero-top"><a href="/" aria-label="Ir al menú de ROAL BURGER"><img src="/logo.webp" alt="ROAL BURGER" width="140" height="46"></a></div>
            <div class="cp-hero-body">
                <span class="cp-sello">🔐 FUERA DEL MENÚ</span>
                <h1 class="cp-titulo">${esc(c.titulo)}</h1>
                ${c.descripcion ? `<p class="cp-desc">${esc(c.descripcion)}</p>` : ''}
            </div>
        </header>`;
}

// Si la foto no carga (URL rota, sin red), el hero cae al fondo de marca en vez de quedar negro.
function wireHero() {
    const img = document.getElementById('cpHeroImg');
    if (!img) return;
    img.addEventListener('error', () => {
        const hero = document.getElementById('cpHero');
        img.remove();
        if (!hero) return;
        hero.classList.add('cp-hero--marca');
        hero.insertAdjacentHTML('afterbegin', '<img class="cp-hero-logo-bg" src="/isotipo.webp" alt="" width="360" height="360" aria-hidden="true">');
    }, { once: true });
}

function vigenciaTexto(c) {
    return `Válido ${formatDias(c.diasValidos)}${c.fechaFin ? ` · hasta el ${formatFecha(c.fechaFin)}` : ''}`;
}

function precioHtml(c) {
    // Ancla de precio solo si el negocio la configuró y de verdad es mayor (el servidor ya lo exige).
    const ref = Number(c.precioReferencia) > Number(c.precio) ? Number(c.precioReferencia) : 0;
    return `
        <section class="cp-precio" aria-label="Precio del cupón">
            <p class="cp-precio-cupon">${money(c.precio)}</p>
            ${ref ? `<p class="cp-precio-ref">En el menú costaría <s>${money(ref)}</s></p>` : ''}
        </section>`;
}

const ICONOS = [
    [/burger|hamburg/i, '🍔'], [/papa|francesa/i, '🍟'], [/perro|hot ?dog/i, '🌭'], [/pepito/i, '🥖'],
    [/teque|queso/i, '🧀'], [/pollo|alita/i, '🍗'], [/salsa/i, '🥫'],
    [/coca|postob|gaseosa|bebida|jugo|pepsi|limonada|agua|kola|cola|manzana|ml\b|litro/i, '🥤']
];
function iconoDe(p) {
    const t = `${p.nombreCliente || ''} ${p.nombre || ''} ${p.variante || ''}`;
    return (ICONOS.find(([re]) => re.test(t)) || [null, '🍽️'])[1];
}

function incluyeHtml(c) {
    const comp = c.composicion || [];
    if (!comp.length && !c.notaCocina) return '';
    return `
        <section class="cp-card liquid-glass cp-incluye" aria-label="Qué incluye">
            <h2 class="cp-h2">Qué incluye</h2>
            ${comp.length ? `<ul>${comp.map((p) => `<li><span class="cp-ico" aria-hidden="true">${iconoDe(p)}</span><span>${esc(renglonTexto(p))}</span></li>`).join('')}</ul>` : ''}
            ${c.notaCocina ? `<p class="cp-exclusivo"><strong>★ Exclusivo:</strong> ${esc(c.notaCocina)}</p>` : ''}
        </section>`;
}

function cuposMarkup(c) {
    const restantes = Number(c.cuposRestantes || 0);
    const totales = Number(c.cuposTotales || 0);
    // Una vista pública vieja (sin cuposTotales) muestra solo "Quedan N", sin barra.
    if (!totales) return `<p class="cp-cupos-txt"><span>Quedan <strong id="cpQuedan">${restantes}</strong> cupos</span></p>`;
    const pct = Math.max(0, Math.min(1, restantes / totales));
    return `
        <p class="cp-cupos-txt"><span>Quedan <strong id="cpQuedan">${restantes}</strong> de ${totales} cupos</span></p>
        <div class="cp-barra" role="progressbar" aria-label="Cupos restantes" aria-valuemin="0" aria-valuemax="${totales}" aria-valuenow="${restantes}" id="cpBarraWrap">
            <span id="cpBarra" style="transform:scaleX(${pct.toFixed(3)})"></span>
        </div>`;
}

function urgenciaHtml(c) {
    return `
        <section class="cp-card liquid-glass cp-urgencia" aria-label="Cupos y vigencia">
            <div id="cpCupos">${cuposMarkup(c)}</div>
            <p class="cp-vigencia">📅 ${esc(vigenciaTexto(c))}</p>
        </section>`;
}

function pasosHtml(activo) {
    const pasos = ['Tus datos', 'Tus extras', 'Tu cupón'];
    return `<ol class="cp-pasos" aria-label="Pasos">${pasos.map((t, i) => {
        const n = i + 1;
        const cls = n === activo ? 'is-activo' : (n < activo ? 'is-hecho' : '');
        return `<li class="${cls}"${n === activo ? ' aria-current="step"' : ''}><span>${n < activo ? '✓' : n}</span>${t}</li>`;
    }).join('')}</ol>`;
}

function campoHtml({ name, label, type = 'text', attrs = '' }) {
    return `
            <label class="cp-field">
                <span>${label}</span>
                <input type="${type}" name="${name}" id="cpIn-${name}" aria-describedby="cpErr-${name}" ${attrs}>
                <p class="cp-field-error" id="cpErr-${name}" aria-live="polite"></p>
            </label>`;
}

let pasoActual = 1;

function renderFormulario(c) {
    pasoActual = 1;
    // Un bloque de chips por grupo ("Extra a elegir", "Bebida", …), con su nombre como título.
    const gruposHtml = gruposDe(c).map((g) => `
            <fieldset class="cp-field cp-toppings" data-grupo="${esc(g.id)}">
                <legend>${esc(g.nombre)}${g.requerido === false ? ' <em class="cp-opcional">(opcional)</em>' : ''}</legend>
                <div class="cp-chips">${(g.opciones || []).map((o) => `
                    <button type="button" class="cp-chip" data-grupo="${esc(g.id)}" data-opcion="${esc(o)}" aria-pressed="false">${esc(o)}</button>`).join('')}</div>
                <p class="cp-field-error" id="cpErr-g-${esc(g.id)}" aria-live="polite"></p>
            </fieldset>`).join('');
    setView(`
        ${heroHtml(c)}
        <div class="cp-wrap">
            ${precioHtml(c)}
            ${incluyeHtml(c)}
            ${urgenciaHtml(c)}
            <form class="cp-card liquid-glass" id="cpForm" novalidate>
                <div id="cpPasos">${pasosHtml(1)}</div>
                <div class="cp-paso" data-paso="1">
                    <h2 class="cp-h2">¡Epa! Este cupón es pa' ti</h2>
                    <p class="cp-sub">Déjanos tus datos y te damos tu código personal. Es intransferible, ¿ok?</p>
                    ${campoHtml({ name: 'nombre', label: 'Tu nombre', attrs: 'maxlength="40" autocomplete="given-name" placeholder="Ej. Andreína" required' })}
                    ${campoHtml({ name: 'igHandle', label: 'Tu usuario de Instagram', attrs: 'maxlength="31" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="@tu.usuario" required' })}
                    ${campoHtml({ name: 'telefono', label: 'Tu WhatsApp', type: 'tel', attrs: 'inputmode="numeric" maxlength="16" autocomplete="tel-national" placeholder="300 123 4567" required' })}
                </div>
                <div class="cp-paso" data-paso="2" hidden>
                    <h2 class="cp-h2">Tus extras</h2>
                    <p class="cp-sub">Elige cómo lo quieres. Puedes cambiarlo antes de reclamar.</p>
${gruposHtml}
                    <label class="cp-check">
                        <input type="checkbox" name="aceptaDatos" id="cpIn-aceptaDatos" aria-describedby="cpErr-aceptaDatos" required>
                        <span>Autorizo a ROAL BURGER a tratar mis datos para emitir y gestionar este cupón, según la <a href="/politica-datos" target="_blank" rel="noopener">política de tratamiento de datos</a>. <em>(obligatorio)</em></span>
                    </label>
                    <p class="cp-field-error" id="cpErr-aceptaDatos" aria-live="polite"></p>
                    <label class="cp-check">
                        <input type="checkbox" name="aceptaMarketing">
                        <span>Quiero recibir promociones de ROAL BURGER por WhatsApp. <em>(opcional)</em></span>
                    </label>
                    <p class="cp-error" id="cpError" role="alert" hidden></p>
                    <button type="button" class="cp-btn cp-btn--ghost cp-btn--secundario" id="cpAtras">← Cambiar mis datos</button>
                </div>
                <p class="cp-recaptcha-note">Protegido por reCAPTCHA de Google: aplican su <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">privacidad</a> y sus <a href="https://policies.google.com/terms" target="_blank" rel="noopener">términos</a>.</p>
            </form>
            ${condicionesHtml()}
        </div>
        <div class="cp-cta">
            <button type="submit" form="cpForm" class="cp-btn cp-btn--primary" id="cpSubmit">QUIERO MI CUPÓN</button>
        </div>`);

    wireHero();
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
            campoError(`g-${grupo}`, '');
        });
    });
    // Validación en línea: al salir de un campo ya escrito se revisa; al escribir se limpia el error.
    ['nombre', 'igHandle', 'telefono'].forEach((name) => {
        const input = document.getElementById(`cpIn-${name}`);
        input.addEventListener('input', () => campoError(name, ''));
        input.addEventListener('blur', () => { if (input.value.trim()) validarCampo(name, input.value); });
    });
    document.getElementById('cpIn-aceptaDatos').addEventListener('change', () => campoError('aceptaDatos', ''));
    document.getElementById('cpAtras').addEventListener('click', () => irAPaso(1));
    form.addEventListener('submit', onSubmit);
    loadRecaptcha().catch(() => { /* se reintenta al enviar */ });
    startPolling();
}

function irAPaso(n) {
    pasoActual = n;
    document.querySelectorAll('#cpForm .cp-paso').forEach((p) => { p.hidden = Number(p.dataset.paso) !== n; });
    const pasos = document.getElementById('cpPasos');
    if (pasos) pasos.innerHTML = pasosHtml(n);
    document.getElementById('cpForm')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

function campoError(name, msg) {
    const el = document.getElementById(`cpErr-${name}`);
    if (el) el.textContent = msg;
    const input = document.getElementById(`cpIn-${name}`);
    if (input) input.setAttribute('aria-invalid', msg ? 'true' : 'false');
}

// Mismas reglas que antes (las del servidor mandan); solo cambia CÓMO se muestran: junto al campo
// y con un tono amable.
const MENSAJES = {
    nombre: 'Cuéntanos cómo te llamas (mínimo 2 letras) 🙂',
    igHandle: 'Escribe tu usuario de Instagram, por ejemplo @tu.usuario',
    telefono: 'Revisa tu WhatsApp: son 10 dígitos y empieza por 3',
    aceptaDatos: 'Necesitamos tu autorización para poder darte el cupón',
    grupo: 'Elige una opción aquí 🔥'
};

function validarCampo(name, valor) {
    let ok = true;
    if (name === 'nombre') ok = String(valor || '').trim().length >= 2;
    if (name === 'igHandle') ok = /^@?[A-Za-z0-9._]{1,30}$/.test(String(valor || '').trim());
    if (name === 'telefono') ok = /^(57)?3\d{9}$/.test(String(valor || '').replace(/\D/g, ''));
    campoError(name, ok ? '' : MENSAJES[name]);
    return ok;
}

function enfocar(el) {
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => el.focus({ preventScroll: true }), 300);
}

// Devuelve el primer elemento con problema del paso (y muestra TODOS los mensajes del paso).
function validarPaso1(form) {
    const fd = new FormData(form);
    let primero = null;
    ['nombre', 'igHandle', 'telefono'].forEach((name) => {
        if (!validarCampo(name, fd.get(name)) && !primero) primero = document.getElementById(`cpIn-${name}`);
    });
    return primero;
}

function validarPaso2(form) {
    let primero = null;
    gruposDe(campana || {}).forEach((g) => {
        const falta = g.requerido !== false && !selecciones[g.id];
        campoError(`g-${g.id}`, falta ? MENSAJES.grupo : '');
        if (falta && !primero) primero = form.querySelector(`.cp-chip[data-grupo="${CSS.escape(g.id)}"]`);
    });
    const acepta = new FormData(form).get('aceptaDatos');
    campoError('aceptaDatos', acepta ? '' : MENSAJES.aceptaDatos);
    if (!acepta && !primero) primero = document.getElementById('cpIn-aceptaDatos');
    return primero;
}

async function onSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const btn = document.getElementById('cpSubmit');
    // Paso 1 → 2 sin viaje al servidor; el envío real ocurre desde el paso 2.
    const malo1 = validarPaso1(form);
    if (malo1) {
        if (pasoActual !== 1) irAPaso(1);
        enfocar(malo1);
        return;
    }
    if (pasoActual === 1) {
        irAPaso(2);
        return;
    }
    const malo2 = validarPaso2(form);
    if (malo2) {
        enfocar(malo2);
        return;
    }
    const fd = new FormData(form);
    const nombre = String(fd.get('nombre') || '').trim();
    const igHandle = String(fd.get('igHandle') || '').trim();
    const telefono = String(fd.get('telefono') || '').replace(/\D/g, '');

    showError('');
    btn.disabled = true;
    btn.textContent = 'DESBLOQUEANDO TU CUPÓN…';
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
        renderCupon(result, { animar: true });
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

const CANDADO_SVG = `<svg viewBox="0 0 92 110" aria-hidden="true">
    <path class="cp-arco" d="M26 52V36a20 20 0 0 1 40 0v16" fill="none" stroke="#F5EBDD" stroke-width="9" stroke-linecap="round"/>
    <rect x="12" y="48" width="68" height="58" rx="12" fill="#FF6B00"/>
    <circle cx="46" cy="72" r="7" fill="#141414"/><rect x="43" y="74" width="6" height="15" rx="3" fill="#141414"/>
</svg>`;

function renderCupon(r, { animar = false } = {}) {
    const c = r.campana || {};
    const pendienteActivar = r.estado === 'emitido' && c.requiereActivacionWA;
    const extras = seleccionesDe(r);
    const comp = composicionTexto(c.composicion);
    setView(`
        <div class="cp-wrap cp-wrap--sin-cta">
            <div class="cp-top-plano"><a href="/" aria-label="Ir al menú de ROAL BURGER"><img src="/logo.webp" alt="ROAL BURGER" width="140" height="46"></a></div>
            ${pasosHtml(3)}
            <p class="cp-banner">${r.yaExistia ? 'Ya tenías tu cupón 😉' : '¡Desbloqueado! 🔓'}<small>${r.yaExistia ? 'Aquí está otra vez.' : 'Este cupón es solo tuyo: preséntalo en caja o pídelo por WhatsApp.'}</small></p>
            <div class="cp-revelado${animar ? ' cp-revelado--anim' : ''}">
                <div class="cp-candado" aria-hidden="true">${CANDADO_SVG}</div>
                <article class="cp-ticket" id="cpTicket" aria-label="Tu cupón">
                    <div class="cp-ticket-top">
                        <div class="cp-ticket-head">
                            <img src="/isotipo.webp" alt="" width="44" height="44">
                            <div>
                                <p class="cp-ticket-kicker">🔐 FUERA DEL MENÚ</p>
                                <p class="cp-ticket-title">${esc(c.titulo)}</p>
                            </div>
                            <span class="cp-ticket-price">${money(c.precio)}</span>
                        </div>
                        <p class="cp-ticket-name">Para: <strong>${esc(r.nombre)}</strong></p>
                        ${comp ? `<p class="cp-ticket-comp">${esc(comp)}</p>` : ''}
                    </div>
                    <div class="cp-perforado" aria-hidden="true"></div>
                    <div class="cp-ticket-bottom">
                        <div class="cp-ticket-code-row">
                            <div>
                                <p class="cp-ticket-label">Tu código</p>
                                <p class="cp-ticket-code">${esc(r.codigo)}</p>
                            </div>
                            ${qrSvg(r.codigo)}
                        </div>
                        ${extras.length ? `<ul class="cp-ticket-extras">${extras.map((d) => `<li><span>${esc(d.grupo)}:</span> ${esc(d.opcion)}</li>`).join('')}</ul>` : ''}
                        ${c.notaCocina ? `<p class="cp-ticket-nota">★ Exclusivo: ${esc(c.notaCocina)}</p>` : ''}
                        <p class="cp-ticket-days">📅 ${esc(vigenciaTexto(c))}</p>
                        ${pendienteActivar ? '<p class="cp-ticket-warn">⚠️ Actívalo por WhatsApp desde el mismo número con el que lo pediste para poder usarlo.</p>' : ''}
                        <p class="cp-ticket-legal">Personal e intransferible · una vez por persona · no acumulable</p>
                    </div>
                </article>
            </div>

            ${pendienteActivar
        // Fase 2 (activación por el WhatsApp de cupones): primero activar; el pedido se arma después.
        ? `<div class="cp-actions"><a class="cp-btn cp-btn--wa" href="${esc(r.waLink)}" target="_blank" rel="noopener">ACTIVAR POR WHATSAPP</a></div>`
        : pedidoStepHtml(r)}
            <div class="cp-actions">
                <button type="button" class="cp-btn cp-btn--primary" id="cpHistoriaBtn">📸 COMPARTIR EN MI HISTORIA</button>
                <button type="button" class="cp-btn cp-btn--ghost" id="cpIcsBtn">⏰ RECORDÁRMELO</button>
                <button type="button" class="cp-btn cp-btn--ghost" id="cpPngBtn">⬇️ GUARDAR CUPÓN</button>
            </div>
            ${condicionesHtml()}
            <p class="cp-foot"><a href="#" id="cpOtroNumero">¿No eres tú? Reclamar con otro número</a></p>
        </div>`);

    if (!pendienteActivar) wirePedidoStep(r);
    const historiaBtn = document.getElementById('cpHistoriaBtn');
    historiaBtn.addEventListener('click', () => compartirHistoria(r, historiaBtn));
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

function estadoHtml({ emoji, titulo, sub, botones }) {
    return `
        <div class="cp-wrap cp-wrap--sin-cta">
            <section class="cp-estado">
                <a href="/" aria-label="Ir al menú de ROAL BURGER"><img class="cp-estado-logo" src="/logo.webp" alt="ROAL BURGER" width="140" height="46"></a>
                <p class="cp-estado-emoji" aria-hidden="true">${emoji}</p>
                <div><span class="cp-sello">🔐 FUERA DEL MENÚ</span></div>
                <h1 class="cp-titulo">${titulo}</h1>
                <p class="cp-sub">${sub}</p>
                ${botones}
            </section>
        </div>`;
}

function renderAgotado() {
    setView(estadoHtml({
        emoji: '🔥',
        titulo: 'Se acabaron los de esta semana',
        sub: 'El domingo sale la nueva clave. Síguenos para no perdértela.',
        botones: `<a class="cp-btn cp-btn--primary" href="${INSTAGRAM_URL}" target="_blank" rel="noopener">SEGUIR A @ROALBURGERARMENIA</a>
                <a class="cp-btn cp-btn--ghost" href="/">VER EL MENÚ</a>`
    }));
}

function renderInactiva() {
    setView(estadoHtml({
        emoji: '🔒',
        titulo: 'Esta clave ya no está activa',
        sub: 'Cada semana sale algo Fuera del Menú. Síguenos en Instagram para la próxima y, mientras tanto, échale un ojo al menú.',
        botones: `<a class="cp-btn cp-btn--primary" href="${INSTAGRAM_URL}" target="_blank" rel="noopener">IR A INSTAGRAM</a>
                <a class="cp-btn cp-btn--ghost" href="/">VER EL MENÚ</a>`
    }));
}

function renderErrorCarga() {
    setView(estadoHtml({
        emoji: '📶',
        titulo: 'No pudimos cargar la clave',
        sub: 'Revisa tu conexión e intenta de nuevo.',
        botones: '<button type="button" class="cp-btn cp-btn--primary" id="cpRetry">REINTENTAR</button>'
    }));
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
            if (el) el.innerHTML = cuposMarkup(fresh);
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

// ── PNG del cupón (ticket) e imagen para historias ───────────────────────────

// cors=true para fotos de otro dominio (Firebase Storage): sin CORS el navegador "ensucia" el
// canvas y toBlob() falla, así que si la foto no se puede usar se devuelve null y se dibuja el
// fondo de marca en su lugar.
function loadImage(src, cors = false) {
    return new Promise((resolve) => {
        const img = new Image();
        if (cors && /^https?:/i.test(src)) img.crossOrigin = 'anonymous';
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

function canvasToBlob(canvas) {
    return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob'))), 'image/png'));
}

async function cargarFuentes() {
    try { await Promise.all([document.fonts.load('700 40px Oswald'), document.fonts.load('500 36px Roboto')]); } catch (_) { /* fuente de respaldo */ }
}

const HEAD_FONT = "'Oswald', 'Arial Narrow', sans-serif";
const BODY_FONT = "Roboto, Arial, sans-serif";

// "GUARDAR CUPÓN": el mismo ticket físico de la pantalla (crema sobre carbón, muescas, línea
// perforada). Se dibuja a mano: sin librerías ni capturas del DOM. Solo el isotipo propio.
async function downloadPng(r) {
    const c = r.campana || {};
    await cargarFuentes();
    const W = 1080;
    const X = 80;
    const TW = W - 2 * X; // ancho del ticket
    const PAD = 60;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    const ctx = canvas.getContext('2d');

    // Medir todo lo variable ANTES de fijar la altura (cambiar el tamaño del canvas lo borra).
    ctx.font = `700 60px ${HEAD_FONT}`;
    const titulo = wrapLines(ctx, String(c.titulo || '').toUpperCase(), TW - 2 * PAD - 230).slice(0, 2);
    ctx.font = `500 34px ${BODY_FONT}`;
    const comp = composicionTexto(c.composicion) ? wrapLines(ctx, composicionTexto(c.composicion), TW - 2 * PAD) : [];
    const detalle = [
        ...seleccionesDe(r).flatMap((d) => wrapLines(ctx, `${d.grupo}: ${d.opcion}`, TW - 2 * PAD)),
        ...(c.notaCocina ? wrapLines(ctx, `★ Exclusivo: ${c.notaCocina}`, TW - 2 * PAD) : [])
    ];
    ctx.font = `400 30px ${BODY_FONT}`;
    const vig = wrapLines(ctx, vigenciaTexto(c), TW - 2 * PAD);
    ctx.font = `400 24px ${BODY_FONT}`;
    const legal = wrapLines(ctx, 'Personal e intransferible · una vez por persona · no acumulable · roalburger.com', TW - 2 * PAD);

    const top = 80;
    const headH = 150 + titulo.length * 66;
    const corteY = top + headH + 70 + comp.length * 44 + 40; // línea perforada
    const qr = 360;
    const fin = corteY + 70 + 150 + 60 + qr + 50 + detalle.length * 46 + 20 + vig.length * 40 + 30 + legal.length * 32 + 50;
    const H = fin + 80;
    canvas.height = H;

    ctx.fillStyle = '#141414';
    ctx.fillRect(0, 0, W, H);
    // Ticket con muescas: se dibuja el papel y luego se "recortan" los círculos con el color de fondo.
    ctx.save();
    roundRect(ctx, X, top, TW, fin - top, 40);
    ctx.clip();
    ctx.fillStyle = '#F5EBDD';
    ctx.fillRect(X, top, TW, fin - top);
    ctx.fillStyle = '#FF6B00';
    ctx.fillRect(X, top, TW, 18);
    ctx.restore();
    ctx.fillStyle = '#141414';
    [X, X + TW].forEach((cx) => { ctx.beginPath(); ctx.arc(cx, corteY, 28, 0, Math.PI * 2); ctx.fill(); });
    ctx.strokeStyle = 'rgba(30,30,30,0.3)';
    ctx.lineWidth = 5;
    ctx.setLineDash([18, 14]);
    ctx.beginPath(); ctx.moveTo(X + 50, corteY); ctx.lineTo(X + TW - 50, corteY); ctx.stroke();
    ctx.setLineDash([]);

    const L = X + PAD;
    const logo = await loadImage('/isotipo.webp');
    if (logo) ctx.drawImage(logo, L, top + 60, 100, 100);
    ctx.fillStyle = '#A84300';
    ctx.font = `700 34px ${HEAD_FONT}`;
    ctx.fillText('FUERA DEL MENÚ', L + 130, top + 98);
    ctx.fillStyle = '#1E1E1E';
    ctx.font = `700 60px ${HEAD_FONT}`;
    titulo.forEach((l, i) => ctx.fillText(l, L + 130, top + 162 + i * 66));
    ctx.fillStyle = '#A84300';
    ctx.font = `700 64px ${HEAD_FONT}`;
    ctx.textAlign = 'right';
    ctx.fillText(money(c.precio), X + TW - PAD, top + 132);
    ctx.textAlign = 'left';

    let y = top + headH + 40;
    ctx.fillStyle = '#4a4038';
    ctx.font = `400 34px ${BODY_FONT}`;
    ctx.fillText(`Para: ${r.nombre}`, L, y);
    ctx.fillStyle = '#2b241e';
    ctx.font = `500 34px ${BODY_FONT}`;
    comp.forEach((l, i) => ctx.fillText(l, L, y + 54 + i * 44));

    y = corteY + 80;
    ctx.fillStyle = '#6a5d50';
    ctx.font = `600 30px ${HEAD_FONT}`;
    ctx.fillText('TU CÓDIGO', L, y);
    ctx.fillStyle = '#141414';
    ctx.font = `700 128px ${HEAD_FONT}`;
    ctx.fillText(r.codigo.split('').join(' '), L, y + 140);

    const qx = (W - qr) / 2;
    const qy = y + 210;
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, qx - 22, qy - 22, qr + 44, qr + 44, 22);
    ctx.fill();
    const m = qrMatrix(r.codigo);
    const cell = qr / m.length;
    ctx.fillStyle = '#151515';
    m.forEach((row, ri) => row.forEach((dark, ci) => { if (dark) ctx.fillRect(qx + ci * cell, qy + ri * cell, Math.ceil(cell), Math.ceil(cell)); }));

    y = qy + qr + 80;
    ctx.fillStyle = '#1E1E1E';
    ctx.font = `500 34px ${BODY_FONT}`;
    detalle.forEach((l, i) => ctx.fillText(l, L, y + i * 46));
    y += detalle.length * 46 + 20;
    ctx.fillStyle = '#2b241e';
    ctx.font = `400 30px ${BODY_FONT}`;
    vig.forEach((l, i) => ctx.fillText(l, L, y + i * 40));
    ctx.fillStyle = '#6a5d50';
    ctx.font = `400 24px ${BODY_FONT}`;
    legal.forEach((l, i) => ctx.fillText(l, L, fin - 40 - (legal.length - 1 - i) * 32));

    downloadBlob(await canvasToBlob(canvas), `fuera-del-menu-${r.codigo}.png`);
}

function drawCover(ctx, img, x, y, w, h) {
    const s = Math.max(w / img.width, h / img.height);
    const dw = img.width * s;
    const dh = img.height * s;
    ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

// Imagen vertical 1080×1920 para historias: la foto del combo, "Ya desbloqueé <COMBO> 🔐" y la
// cuenta de Instagram. A propósito SIN código ni QR: lo que se comparte es la presunción, no el
// cupón (un código en una historia pública lo podría reclamar cualquiera en caja).
async function generarHistoria(r) {
    const c = { ...(r.campana || {}), ...(campana || {}) };
    await cargarFuentes();
    const W = 1080;
    const H = 1920;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#141414';
    ctx.fillRect(0, 0, W, H);

    const foto = c.imagenUrl ? await loadImage(c.imagenUrl, true) : null;
    if (foto) {
        drawCover(ctx, foto, 0, 0, W, 1500);
    } else {
        // Fondo de marca: degradado carbón-naranja con el isotipo grande.
        const g = ctx.createRadialGradient(W * 0.8, 260, 40, W * 0.8, 260, 1100);
        g.addColorStop(0, 'rgba(255,107,0,0.85)');
        g.addColorStop(1, 'rgba(20,20,20,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, 1500);
        const logoBg = await loadImage('/isotipo.webp');
        if (logoBg) { ctx.globalAlpha = 0.22; ctx.drawImage(logoBg, 300, 160, 720, 720); ctx.globalAlpha = 1; }
    }
    const sombra = ctx.createLinearGradient(0, 760, 0, 1400);
    sombra.addColorStop(0, 'rgba(20,20,20,0)');
    sombra.addColorStop(1, 'rgba(20,20,20,1)');
    ctx.fillStyle = sombra;
    ctx.fillRect(0, 760, W, 760);

    // Texto anclado al pie (por encima de la franja inferior que Instagram tapa con su barra):
    // cuenta → título (1 a 3 renglones) → "Ya desbloqueé" → sello, de abajo hacia arriba.
    ctx.font = `700 150px ${HEAD_FONT}`;
    const lineas = wrapLines(ctx, `${String(c.titulo || '').toUpperCase()} 🔐`, W - 180).slice(0, 3);
    const yCuenta = 1730;
    const yUltima = yCuenta - 110;
    const yPrimera = yUltima - (lineas.length - 1) * 150;
    const yYa = yPrimera - 160;

    ctx.save();
    ctx.translate(90, yYa - 190);
    ctx.rotate(-0.035);
    ctx.fillStyle = '#FF6B00';
    roundRect(ctx, 0, 0, 470, 82, 14);
    ctx.fill();
    ctx.fillStyle = '#141414';
    ctx.font = `700 44px ${HEAD_FONT}`;
    ctx.fillText('🔐 FUERA DEL MENÚ', 26, 58);
    ctx.restore();

    ctx.fillStyle = '#F5EBDD';
    ctx.font = `700 72px ${HEAD_FONT}`;
    ctx.fillText('YA DESBLOQUEÉ', 90, yYa);
    ctx.font = `700 150px ${HEAD_FONT}`;
    lineas.forEach((l, i) => ctx.fillText(l, 90, yPrimera + i * 150));
    ctx.fillStyle = 'rgba(237,230,220,0.9)';
    ctx.font = `500 46px ${BODY_FONT}`;
    ctx.fillText('Fuera del Menú · @roalburgerarmenia', 90, yCuenta);
    const logo = await loadImage('/isotipo.webp');
    if (logo) ctx.drawImage(logo, W - 90 - 110, 90, 110, 110);
    return canvasToBlob(canvas);
}

function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
        const fr = new FileReader();
        fr.onload = () => resolve(fr.result);
        fr.onerror = () => reject(fr.error);
        fr.readAsDataURL(blob);
    });
}

// Web Share con archivo (celular: abre el menú para compartir directo a Instagram). Si el
// navegador no lo permite (escritorio, navegador interno de Instagram), descarga el PNG y además
// muestra la imagen para guardarla con un toque largo, que es lo que funciona dentro de Instagram.
async function compartirHistoria(r, btn) {
    const texto = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'PREPARANDO TU HISTORIA…';
    try {
        const blob = await generarHistoria(r);
        const nombre = 'historia-fuera-del-menu.png';
        const file = typeof File === 'function' ? new File([blob], nombre, { type: 'image/png' }) : null;
        if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({ files: [file], title: 'Fuera del Menú · ROAL BURGER' });
                return;
            } catch (err) {
                if (err && err.name === 'AbortError') return; // el cliente cerró el menú de compartir
            }
        }
        downloadBlob(blob, nombre);
        mostrarVistaHistoria(await blobToDataUrl(blob), String((r.campana || campana || {}).titulo || ""));
    } catch (_) {
        alert('No pudimos generar la imagen. Toma una captura de pantalla 😉');
    } finally {
        btn.disabled = false;
        btn.textContent = texto;
    }
}

function mostrarVistaHistoria(dataUrl, titulo) {
    document.getElementById('cpHistoriaModal')?.remove();
    const modal = document.createElement('div');
    modal.className = 'cp-modal';
    modal.id = 'cpHistoriaModal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Imagen para tu historia');
    modal.innerHTML = `
        <div class="cp-modal-box">
            <img src="${dataUrl}" alt="Imagen para tu historia: Ya desbloqueé ${esc(titulo)}">
            <p>Si no se descargó sola, <strong>mantén presionada la imagen</strong> y elige guardarla. Súbela a tu historia y etiquétanos <strong>@roalburgerarmenia</strong> 🔥</p>
            <button type="button" class="cp-btn cp-btn--ghost" id="cpHistoriaCerrar">CERRAR</button>
        </div>`;
    document.body.appendChild(modal);
    const cerrar = () => modal.remove();
    modal.querySelector('#cpHistoriaCerrar').addEventListener('click', cerrar);
    modal.addEventListener('click', (e) => { if (e.target === modal) cerrar(); });
    modal.querySelector('#cpHistoriaCerrar').focus();
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
        // En segundo plano: la foto y los datos frescos de la campaña para la imagen de historia.
        fetchCampana(campanaId).then((c) => { if (c) campana = c; }).catch(() => {});
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
