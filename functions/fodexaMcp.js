'use strict';

// Conector MCP de FODEXA para Claude (solo reels de Roal Burger) con inicio de sesión OAuth 2.1 (PKCE).
//
// Una sola función HTTP (`fodexaMcp` en index.js) con estas rutas:
//   GET  /.well-known/oauth-protected-resource[...]   dónde está el servidor de login
//   GET  /.well-known/oauth-authorization-server      datos del login (descubrimiento)
//   POST /register                                    registro dinámico del cliente (Claude)
//   GET/POST /authorize                               pantalla de login: correo + contraseña de FODEXA
//   POST /token                                       canje del código por token (y renovación)
//   POST /mcp                                         el conector (JSON-RPC: initialize, tools/list, tools/call)
//
// Seguridad: solo entra la cuenta ALLOWED_EMAIL y solo si además es administradora (`admins/{uid}`). Los códigos
// y tokens se guardan SOLO como hash (sha256) en Firestore (colecciones `mcp_*`, que las reglas no exponen).
// Todo recibe `deps` (db, verificar contraseña, reloj) para probarlo sin red.

const crypto = require('crypto');
const reelsApi = require('./reelsApi');

const ALLOWED_EMAIL = (process.env.MCP_ALLOWED_EMAIL || 'roalburgerdomicilios@gmail.com').toLowerCase();
const PUBLIC_BASE = process.env.MCP_PUBLIC_BASE || 'https://roalburger.com';
const FUNCTION_BASE = process.env.MCP_FUNCTION_BASE || `https://us-central1-${process.env.GCLOUD_PROJECT || 'roal-burger-menu'}.cloudfunctions.net/fodexaMcp`;
const FIREBASE_API_KEY = process.env.FIREBASE_WEB_API_KEY || 'AIzaSyCinNZVhxL4ijOoZGsvoIvCgR7bHzsl668'; // clave pública del cliente web (firebase-config.js)

const COL_CLIENTES = 'mcp_oauth_clientes';
const COL_CODIGOS = 'mcp_oauth_codigos';
const COL_TOKENS = 'mcp_oauth_tokens';
const COL_INTENTOS = 'mcp_oauth_intentos';
const CODIGO_VIDA_MS = 5 * 60 * 1000;
const ACCESO_VIDA_MS = 60 * 60 * 1000;
const REFRESCO_VIDA_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_CLIENTES = 200;
const MAX_FALLOS = 8;
const VENTANA_FALLOS_MS = 15 * 60 * 1000;
const VERSIONES = ['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05'];

const sha = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');
const aleatorio = (n = 32) => crypto.randomBytes(n).toString('base64url');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Solo Claude (web/escritorio/móvil) y programas locales (Claude Code): nada más puede registrarse.
function redirectPermitido(u) {
    let x;
    try { x = new URL(String(u)); } catch { return false; }
    if (x.username || x.password || x.hash) return false;
    if (x.protocol === 'https:') return x.hostname === 'claude.ai' || x.hostname === 'claude.com' || x.hostname.endsWith('.claude.ai') || x.hostname.endsWith('.claude.com');
    return x.protocol === 'http:' && (x.hostname === 'localhost' || x.hostname === '127.0.0.1' || x.hostname === '[::1]');
}

const json = (status, body, headers = {}) => ({ status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers }, body });
const html = (status, cuerpo) => ({ status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Frame-Options': 'DENY', 'Referrer-Policy': 'no-referrer' }, body: cuerpo });
const errOauth = (status, error, descripcion) => json(status, { error, error_description: descripcion });
const redirigir = (url) => ({ status: 302, headers: { Location: url, 'Cache-Control': 'no-store' }, body: '' });
const conParams = (base, params) => `${base}${base.includes('?') ? '&' : '?'}${new URLSearchParams(params)}`;
const paginaError = (texto) => html(400, `<!doctype html><meta charset="utf-8"><p style="font-family:sans-serif">${esc(texto)}</p>`);

// ── Descubrimiento ───────────────────────────────────────────────────────────

const metadatosRecurso = () => ({ resource: `${PUBLIC_BASE}/mcp`, authorization_servers: [PUBLIC_BASE], bearer_methods_supported: ['header'], scopes_supported: ['reels'] });
const metadatosServidor = () => ({
    issuer: PUBLIC_BASE,
    authorization_endpoint: `${FUNCTION_BASE}/authorize`,
    token_endpoint: `${FUNCTION_BASE}/token`,
    registration_endpoint: `${FUNCTION_BASE}/register`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    code_challenge_methods_supported: ['S256'],
    token_endpoint_auth_methods_supported: ['none'],
    scopes_supported: ['reels']
});

// ── Registro de clientes ─────────────────────────────────────────────────────

async function registrar(db, body, nowMs) {
    const uris = Array.isArray(body?.redirect_uris) ? body.redirect_uris.map(String) : [];
    if (!uris.length || uris.length > 10 || !uris.every(redirectPermitido)) return errOauth(400, 'invalid_redirect_uri', 'redirect_uri no permitido.');
    const total = (await db.collection(COL_CLIENTES).count().get()).data().count;
    if (total >= MAX_CLIENTES) return errOauth(429, 'temporarily_unavailable', 'Demasiados clientes registrados.');
    const clientId = `c_${aleatorio(18)}`;
    await db.collection(COL_CLIENTES).doc(clientId).set({ redirectUris: uris, nombre: String(body?.client_name || '').slice(0, 80), creadoAtMs: nowMs });
    return json(201, {
        client_id: clientId, client_id_issued_at: Math.floor(nowMs / 1000), redirect_uris: uris, client_name: String(body?.client_name || ''),
        token_endpoint_auth_method: 'none', grant_types: ['authorization_code', 'refresh_token'], response_types: ['code']
    });
}

async function validarPeticionAuth(db, q) {
    const clientId = String(q.client_id || '');
    const c = clientId ? (await db.collection(COL_CLIENTES).doc(clientId).get()).data() : null;
    if (!c) return { error: 'Cliente desconocido: vuelve a agregar el conector en Claude.' };
    const redirect = String(q.redirect_uri || '');
    if (!c.redirectUris.includes(redirect) || !redirectPermitido(redirect)) return { error: 'Dirección de regreso no permitida.' };
    // Desde aquí, los errores se pueden devolver al cliente.
    const state = q.state ? String(q.state) : '';
    if (q.response_type !== 'code') return { redirect, state, oauthError: 'unsupported_response_type' };
    if (!q.code_challenge || q.code_challenge_method !== 'S256') return { redirect, state, oauthError: 'invalid_request' };
    return { ok: true, clientId, redirect, state, challenge: String(q.code_challenge), scope: String(q.scope || 'reels') };
}

function pantallaLogin(p, mensaje = '', status = 200) {
    const oculto = (k, v) => `<input type="hidden" name="${k}" value="${esc(v)}">`;
    return html(status, `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>FODEXA · Conectar con Claude</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#15110d;color:#f3e9d8;font-family:system-ui,sans-serif}
main{width:min(92vw,380px);padding:28px;border:1px solid #3a3027;border-radius:9px;background:#1e1813}
h1{font-size:20px;margin:0 0 6px}p{margin:0 0 16px;font-size:14px;opacity:.85}label{display:block;font-size:13px;margin:12px 0 4px}
input[type=email],input[type=password]{width:100%;box-sizing:border-box;padding:10px;border-radius:9px;border:1px solid #4a3d31;background:#15110d;color:#f3e9d8;font-size:15px}
button{width:100%;margin-top:18px;padding:12px;border:0;border-radius:9px;background:#e8501b;color:#fff;font-size:15px;font-weight:600;cursor:pointer}
.err{background:#4a1d17;border-radius:9px;padding:10px;font-size:13px;margin-bottom:12px}</style></head><body><main>
<h1>Conectar Claude con FODEXA</h1><p>Claude podrá programar y revisar las publicaciones de Roal Burger (posts, carruseles, historias y reels). Entra con la cuenta de administrador.</p>
${mensaje ? `<div class="err">${esc(mensaje)}</div>` : ''}
<form method="post" action="${FUNCTION_BASE}/authorize">
${oculto('client_id', p.clientId)}${oculto('redirect_uri', p.redirect)}${oculto('state', p.state)}${oculto('code_challenge', p.challenge)}${oculto('code_challenge_method', 'S256')}${oculto('response_type', 'code')}${oculto('scope', p.scope)}
<label for="e">Correo</label><input id="e" name="email" type="email" autocomplete="username" required>
<label for="p">Contraseña</label><input id="p" name="password" type="password" autocomplete="current-password" required>
<button type="submit">Permitir acceso</button></form></main></body></html>`);
}

// ── Login (correo + contraseña de Firebase) ──────────────────────────────────

async function fallosRecientes(db, nowMs) {
    const d = (await db.collection(COL_INTENTOS).doc('login').get()).data() || {};
    return (d.fallos || []).filter((t) => nowMs - t < VENTANA_FALLOS_MS);
}

async function autorizar(db, q, deps, nowMs) {
    const p = await validarPeticionAuth(db, q);
    if (p.error) return paginaError(p.error);
    if (p.oauthError) return redirigir(conParams(p.redirect, { error: p.oauthError, ...(p.state ? { state: p.state } : {}) }));
    const fallos = await fallosRecientes(db, nowMs);
    if (fallos.length >= MAX_FALLOS) return pantallaLogin(p, 'Demasiados intentos fallidos. Espera 15 minutos.', 429);
    const email = String(q.email || '').trim().toLowerCase();
    let uid = null;
    // Mismo mensaje para todos los fallos: no revela si el correo existe.
    if (email === ALLOWED_EMAIL && q.password && deps.verificarClave) {
        const r = await deps.verificarClave(email, String(q.password)).catch(() => null);
        if (r?.uid && String(r.email || '').toLowerCase() === ALLOWED_EMAIL && (await db.collection('admins').doc(r.uid).get()).exists) uid = r.uid;
    }
    if (!uid) {
        await db.collection(COL_INTENTOS).doc('login').set({ fallos: [...fallos, nowMs].slice(-20) });
        return pantallaLogin(p, 'Correo o contraseña incorrectos, o esa cuenta no tiene acceso.');
    }
    const codigo = aleatorio(32);
    await db.collection(COL_CODIGOS).doc(sha(codigo)).set({ clientId: p.clientId, redirectUri: p.redirect, challenge: p.challenge, uid, scope: p.scope, venceAtMs: nowMs + CODIGO_VIDA_MS });
    return redirigir(conParams(p.redirect, { code: codigo, ...(p.state ? { state: p.state } : {}) }));
}

// ── Tokens ───────────────────────────────────────────────────────────────────

async function emitirTokens(db, { uid, clientId, scope }, nowMs) {
    const acceso = aleatorio(32);
    const refresco = aleatorio(32);
    await db.collection(COL_TOKENS).doc(sha(acceso)).set({ tipo: 'acceso', uid, clientId, scope, venceAtMs: nowMs + ACCESO_VIDA_MS });
    await db.collection(COL_TOKENS).doc(sha(refresco)).set({ tipo: 'refresco', uid, clientId, scope, venceAtMs: nowMs + REFRESCO_VIDA_MS });
    return json(200, { access_token: acceso, token_type: 'Bearer', expires_in: ACCESO_VIDA_MS / 1000, refresh_token: refresco, scope });
}

// Lee y borra un documento en una sola transacción: cada código / token de renovación sirve una sola vez.
const consumir = (db, ref) => db.runTransaction(async (tx) => {
    const s = await tx.get(ref);
    if (!s.exists) return null;
    tx.delete(ref);
    return s.data();
});

async function canjear(db, b, nowMs) {
    const clientId = String(b.client_id || '');
    if (b.grant_type === 'authorization_code') {
        const c = await consumir(db, db.collection(COL_CODIGOS).doc(sha(b.code || '')));
        if (!c || c.venceAtMs < nowMs || c.clientId !== clientId || c.redirectUri !== String(b.redirect_uri || '')) return errOauth(400, 'invalid_grant', 'Código inválido o vencido.');
        const calculado = crypto.createHash('sha256').update(String(b.code_verifier || '')).digest('base64url');
        if (!b.code_verifier || calculado !== c.challenge) return errOauth(400, 'invalid_grant', 'Verificación PKCE fallida.');
        return emitirTokens(db, c, nowMs);
    }
    if (b.grant_type === 'refresh_token') {
        const t = await consumir(db, db.collection(COL_TOKENS).doc(sha(b.refresh_token || '')));
        if (!t || t.tipo !== 'refresco' || t.venceAtMs < nowMs || t.clientId !== clientId) return errOauth(400, 'invalid_grant', 'Token de renovación inválido o vencido.');
        return emitirTokens(db, t, nowMs);
    }
    return errOauth(400, 'unsupported_grant_type', 'grant_type no soportado.');
}

async function autenticar(db, headers, nowMs) {
    const m = /^Bearer\s+(\S+)$/i.exec(String(headers.authorization || ''));
    if (!m) return null;
    const t = (await db.collection(COL_TOKENS).doc(sha(m[1])).get()).data();
    if (!t || t.tipo !== 'acceso' || t.venceAtMs < nowMs) return null;
    if (!(await db.collection('admins').doc(t.uid).get()).exists) return null;
    return t;
}

// ── Herramientas ─────────────────────────────────────────────────────────────

const STR = (d) => ({ type: 'string', description: d });
// Alias OCULTOS (siguen funcionando para chats viejos, pero ya no se listan: Claude usa las *_publicacion): programar_reel,
// listar_reels, editar_reel, cancelar_reel, estado_reel (= las de publicación con tipo reel) y agregar_imagen (= gestionar_imagenes agregar).
const HERRAMIENTAS = [
    {
        name: 'subir_video',
        description: 'Prepara un video para un reel de Roal Burger (MP4 vertical 9:16, 3 a 90 s, máx. 150 MB) y devuelve el id del reel y la dirección pública del video. Dos formas: (1) pasa "url" (https público del MP4) y el servidor lo baja y lo valida; (2) sin "url" devuelve una dirección de subida de un solo uso (PUT, 30 min): sube el MP4 con curl -T y luego usa programar_publicacion con el id. No publica nada.',
        inputSchema: { type: 'object', properties: { tipo: { type: 'string', enum: ['reel', 'historia'], description: 'Qué se va a publicar con este video: reel (por defecto) o historia (video vertical 9:16, hasta 60 s).' }, url: STR('Dirección https pública del MP4 (opcional).'), serie: STR('Serie a la que pertenece el reel (nombre o parte del nombre; ver listar_series). Queda al final de su cola y sale solo cuando tenga video y texto.'), titulo: STR('Nombre corto del video (opcional), p. ej. "Video 3"; se ve en el calendario.') } }
    },
    {
        name: 'crear_publicacion',
        description: 'Crea una publicación de CUALQUIER tipo en Instagram (y opcional Facebook): "post" (1 foto), "carrusel" (2 a 10 fotos), "historia" (1 imagen o 1 video vertical) o "reel" (video). Todo en un solo paso: pasa el contenido por dirección https pública (imagenes: lista de URLs de JPG/PNG/WebP; videoUrl: MP4). El servidor baja, convierte y ajusta las imágenes solo (historia 9:16, posts 4:5 a 1,91:1, ≤ 900 KB). Con "cuando" ("YYYY-MM-DD HH:mm", hora de Colombia) queda programada; sin "cuando" queda borrador (luego programar_publicacion). Las historias no llevan texto ni hashtags (Instagram no los admite por API). Si algo falla no deja nada a medias. Sin límite por tipo: es el mismo sistema del panel FODEXA → Redes.',
        inputSchema: { type: 'object', properties: { tipo: { type: 'string', enum: ['post', 'carrusel', 'historia', 'reel'], description: 'Tipo de publicación.' }, texto: STR('Texto (caption). Obligatorio en post, carrusel y reel; las historias no lo llevan. Máx. 2.200 caracteres.'), hashtags: { type: 'array', items: { type: 'string' }, description: 'Máx. 30, con o sin #.' }, imagenes: { type: 'array', items: { type: 'string' }, description: 'URLs https públicas de las imágenes (1 para post/historia, 2 a 10 para carrusel).' }, videoUrl: STR('MP4 público https (reel o historia en video).'), cuando: STR('Fecha y hora de Colombia, "YYYY-MM-DD HH:mm". Si la omites queda borrador.'), facebook: { type: 'boolean', description: 'También publicar en Facebook.' }, textoAlternativo: STR('Texto alternativo de la imagen (post), opcional.') }, required: ['tipo'] }
    },
    {
        name: 'programar_publicacion',
        description: 'Programa (o reprograma) cualquier publicación que ya existe (post, carrusel, historia o reel) para una fecha y hora de Colombia. Puede cambiar a la vez texto, hashtags y Facebook. Valida que esté completa (imágenes o video, texto).',
        inputSchema: { type: 'object', properties: { id: STR('Id de la publicación.'), cuando: STR('Fecha y hora de Colombia, "YYYY-MM-DD HH:mm".'), texto: STR('Texto nuevo (opcional).'), hashtags: { type: 'array', items: { type: 'string' } }, facebook: { type: 'boolean' } }, required: ['id', 'cuando'] }
    },
    {
        name: 'listar_publicaciones',
        description: 'Lista las publicaciones de Roal Burger de cualquier tipo (post, carrusel, historia, reel) con su estado, fecha, y métricas básicas de las publicadas.',
        inputSchema: { type: 'object', properties: { tipo: { type: 'string', enum: ['todos', 'post', 'carrusel', 'historia', 'reel'] }, estado: { type: 'string', enum: ['programado', 'publicado', 'error', 'borrador', 'cancelado'] }, limite: { type: 'integer' } } }
    },
    {
        name: 'estado_publicacion',
        description: 'Estado de cualquier publicación (post, carrusel, historia o reel): tipo, texto, fecha, imágenes o video, si falló el motivo y, si ya salió, sus métricas.',
        inputSchema: { type: 'object', properties: { id: STR('Id de la publicación.') }, required: ['id'] }
    },
    {
        name: 'editar_publicacion',
        description: 'Cambia el texto, los hashtags, Facebook o la fecha de una publicación (cualquier tipo) que todavía no se ha publicado.',
        inputSchema: { type: 'object', properties: { id: STR('Id de la publicación.'), texto: STR('Texto nuevo.'), hashtags: { type: 'array', items: { type: 'string' } }, cuando: STR('Fecha y hora nuevas de Colombia, "YYYY-MM-DD HH:mm".'), facebook: { type: 'boolean' } }, required: ['id'] }
    },
    {
        name: 'cancelar_publicacion',
        description: 'Cancela una publicación (cualquier tipo) programada o en borrador que todavía no se ha publicado. No se puede deshacer.',
        inputSchema: { type: 'object', properties: { id: STR('Id de la publicación.') }, required: ['id'] }
    },
    {
        name: 'agregar_a_cola',
        description: 'Pone un reel (con video y texto ya cargados) al final de la cola de una SERIE. La serie le asigna sola la fecha y hora que le toca según la semana fija (definir_semana) y lo publica en Instagram y Facebook sin que nadie haga nada. Si el reel ya estaba en otra serie, lo mueve a esta. Si ya estaba en la cola con error, pide otro intento. Devuelve el estado de todas las series.',
        inputSchema: { type: 'object', properties: { id: STR('Id del reel (de subir_video).'), serie: STR('Serie destino (nombre o parte del nombre). Opcional si el reel ya tiene serie o si solo existe una.'), titulo: STR('Nombre corto del video (opcional).') }, required: ['id'] }
    },
    {
        name: 'ver_cola',
        description: 'Muestra la semana fija (qué serie sale cada día), lo que sale cada uno de los próximos 14 días (con avisos si una serie está pausada o sin videos), y la cola de cada serie: orden, fecha y hora estimada (hora de Colombia), estado y motivo si hubo error.',
        inputSchema: { type: 'object', properties: {} }
    },
    {
        name: 'quitar_de_cola',
        description: 'Saca un reel de su serie. Vuelve a borrador (no se cancela ni se borra) y los demás se corren al horario libre.',
        inputSchema: { type: 'object', properties: { id: STR('Id del reel.') }, required: ['id'] }
    },
    {
        name: 'reordenar_cola',
        description: 'Cambia el orden de la cola de una serie. Dos formas: "orden" (lista de ids en el orden deseado; los no nombrados quedan después) o "id" + "posicion" (1 = el primero). Las fechas se recalculan solas.',
        inputSchema: { type: 'object', properties: { orden: { type: 'array', items: { type: 'string' }, description: 'Ids en el orden deseado.' }, serie: STR('Serie (solo si usas "orden" y quieres indicarla).'), id: STR('Id del reel a mover.'), posicion: { type: 'integer', description: 'Nueva posición (1 = primero).' } } }
    },
    {
        name: 'crear_serie',
        description: 'Crea una serie de reels (una carpeta con su propia cola, hora diaria y color). Después asígnale días con definir_semana y reels con agregar_a_cola.',
        inputSchema: { type: 'object', properties: { nombre: STR('Nombre de la serie.'), hora: STR('Hora diaria "HH:mm" (24 h, Colombia). Por defecto 18:00.'), color: STR('Color hexadecimal, p. ej. "#e11d48" (opcional).'), facebook: { type: 'boolean', description: 'Publicar también en Facebook (por defecto sí).' }, activa: { type: 'boolean', description: 'false la crea en pausa.' } }, required: ['nombre'] }
    },
    {
        name: 'listar_series',
        description: 'Lista las series con su hora, color, si están activas, los días de la semana que les tocan y cuántos reels tienen como borrador, programados y publicados.',
        inputSchema: { type: 'object', properties: {} }
    },
    {
        name: 'configurar_serie',
        description: 'Cambia una serie: nombre, color, hora diaria (hora de Colombia, "HH:mm"), si publica también en Facebook y si está activa (false = pausa: sus reels salen del calendario y ese día no sale nada). Solo cambia lo que indiques.',
        inputSchema: { type: 'object', properties: { serie: STR('Serie a cambiar (nombre o parte del nombre).'), nombre: STR('Nombre nuevo.'), color: STR('Color hexadecimal.'), hora: STR('Hora diaria "HH:mm".'), facebook: { type: 'boolean' }, activa: { type: 'boolean' } }, required: ['serie'] }
    },
    {
        name: 'gestionar_imagenes',
        description: 'Maneja las imágenes de un post, carrusel o historia que todavía no salió, por POSICIÓN (1 = la primera, como se ven en estado_publicacion): "agregar" (url https; se convierte y ajusta sola; ideal para armar un carrusel imagen por imagen), "quitar" (posicion), "ordenar" (orden: lista de posiciones en el orden nuevo, ej. [2,1,3]) o "reemplazar" (posicion + url https de la imagen nueva; se convierte y ajusta sola). Si estaba programada vuelve a borrador y lo avisa: reprograma con programar_publicacion.',
        inputSchema: { type: 'object', properties: { id: STR('Id de la publicación.'), accion: { type: 'string', enum: ['agregar', 'quitar', 'ordenar', 'reemplazar'] }, posicion: { type: 'integer', description: 'Posición de la imagen (1 = primera). Para quitar y reemplazar.' }, orden: { type: 'array', items: { type: 'integer' }, description: 'Para ordenar: todas las posiciones en el orden nuevo.' }, url: STR('Para agregar o reemplazar: https de la imagen.') }, required: ['id', 'accion'] }
    },
    {
        name: 'gestionar_publicacion',
        description: 'Acciones sobre una publicación (cualquier tipo): "desprogramar" (vuelve a borrador; no sirve para reels de una serie: usa quitar_de_cola), "reintentar" (si falló en Instagram o Facebook, lo vuelve a intentar en ~2 min), "duplicar" (copia a un borrador nuevo para reusar lo que pegó), "cambiar_video" (url https de un MP4 nuevo para un reel o historia; conserva su hora si seguía en el futuro), "borrar" (elimina un borrador, cancelada o con error con sus archivos; exige confirmar:true; NO borra lo ya publicado) y "publicar_ahora" (sale YA en Instagram y, si tiene la casilla, en Facebook; exige confirmar:true y solo cuando el usuario lo pidió).',
        inputSchema: { type: 'object', properties: { id: STR('Id de la publicación.'), accion: { type: 'string', enum: ['desprogramar', 'reintentar', 'duplicar', 'cambiar_video', 'borrar', 'publicar_ahora'] }, url: STR('Para cambiar_video: https del MP4 nuevo.'), confirmar: { type: 'boolean', description: 'Obligatorio en borrar y publicar_ahora.' } }, required: ['id', 'accion'] }
    },
    {
        name: 'ver_agenda',
        description: 'Todo lo que va a salir en los próximos días (por defecto 7, máx. 30): publicaciones programadas de cualquier tipo con su serie y hora, el cupo de Instagram de las últimas y próximas 24 h (límite 95), qué historias automáticas están activas (Código del día, días cerrados, abrir y cerrar caja) y avisos (cupo lleno, interruptor apagado, publicaciones atrasadas). Úsala antes de programar para no chocar con lo automático.',
        inputSchema: { type: 'object', properties: { dias: { type: 'integer', description: '1 a 30 (por defecto 7).' } } }
    },
    {
        name: 'facebook_estado',
        description: 'Estado de la página de Facebook de Roal Burger (conexión, seguidores, interruptor, último error) y de las publicaciones que van a Facebook con error o pendientes. Con "id" muestra el estado de Facebook de esa publicación. Para reintentar una con error usa gestionar_publicacion con accion "reintentar".',
        inputSchema: { type: 'object', properties: { id: STR('Id de una publicación (opcional).') } }
    },
    {
        name: 'rendimiento',
        description: 'ANALÍTICA: qué publicaciones pegaron en un periodo (Instagram y Facebook juntos). Devuelve las mejores (y las 3 peores si hay suficientes) con tipo, serie, texto, día y hora de publicación, alcance, vistas, interacciones, guardados, compartidos y tasa de interacción, más los totales del periodo. Úsala para "verifícame los reels de la semana pasada, ¿cuál pegó?". Las publicaciones con menos de 3 días siguen subiendo: el resultado lo avisa. Periodos: ultimos_7 (por defecto), semana_pasada (lunes a domingo anterior), ultimos_30, este_mes, o desde/hasta (YYYY-MM-DD, hora de Colombia, máx. 120 días).',
        inputSchema: { type: 'object', properties: { periodo: { type: 'string', enum: ['ultimos_7', 'semana_pasada', 'ultimos_30', 'este_mes'] }, desde: STR('Fecha inicial YYYY-MM-DD (opcional; manda sobre periodo).'), hasta: STR('Fecha final YYYY-MM-DD (opcional).'), ordenarPor: { type: 'string', enum: ['alcance', 'vistas', 'interacciones', 'guardados', 'compartidos', 'tasa'], description: 'Criterio para el ranking (por defecto alcance).' }, n: { type: 'integer', description: 'Cuántas mostrar (1 a 30, por defecto 10).' } } }
    },
    {
        name: 'resumen_series',
        description: 'ANALÍTICA: qué funciona mejor, agrupando las publicaciones del periodo por serie, por tipo (reel, carrusel, foto), por día de la semana y por franja horaria: promedio de alcance, vistas, interacciones, guardados, compartidos, tasa y tiempo de visualización, con cuántas publicaciones hay en cada grupo y si el promedio es confiable (3 o más). Incluye una sugerencia de la serie, tipo y franja con más alcance. Úsala para decidir qué seguir haciendo. Mismos periodos que rendimiento.',
        inputSchema: { type: 'object', properties: { periodo: { type: 'string', enum: ['ultimos_7', 'semana_pasada', 'ultimos_30', 'este_mes'] }, desde: STR('Fecha inicial YYYY-MM-DD (opcional).'), hasta: STR('Fecha final YYYY-MM-DD (opcional).') } }
    },
    {
        name: 'crecimiento',
        description: 'ANALÍTICA: seguidores de Instagram y de Facebook día por día en el periodo (inicio, fin y cambio) y el resumen de las historias de Instagram (cantidad, alcance, respuestas, visitas al perfil, clics, navegación: adelante, atrás, salidas). Las historias solo se miden mientras duran (24 h).',
        inputSchema: { type: 'object', properties: { periodo: { type: 'string', enum: ['ultimos_7', 'semana_pasada', 'ultimos_30', 'este_mes'] }, desde: STR('Fecha inicial YYYY-MM-DD (opcional).'), hasta: STR('Fecha final YYYY-MM-DD (opcional).') } }
    },
    {
        name: 'historico_semanal',
        description: 'ANALÍTICA: resúmenes semanales guardados (totales, mejor publicación y promedio por serie de cada semana), para comparar semanas y ver tendencias de meses, aunque Instagram ya no dé métricas de publicaciones viejas (se miden solo 14 días). "definitivo" = la semana ya cerró su medición.',
        inputSchema: { type: 'object', properties: { semanas: { type: 'integer', description: 'Cuántas semanas atrás (1 a 52, por defecto 8).' } } }
    },
    {
        name: 'definir_semana',
        description: 'Define la semana fija: qué serie sale cada día. "dias" es un objeto {lunes, martes, miercoles, jueves, viernes, sabado, domingo} con el nombre de la serie o null/"ninguna" para dejar el día libre; solo cambia los días que nombres. "saltarMiercoles" (por defecto false) hace que no salga nada los miércoles.',
        inputSchema: { type: 'object', properties: { dias: { type: 'object', description: 'Ejemplo: {"lunes":"Roal","martes":"Emprendimiento","domingo":null}', additionalProperties: true }, saltarMiercoles: { type: 'boolean' } } }
    }
];

async function llamarHerramienta(db, nombre, a, deps) {
    const opts = { baseUrl: deps.baseUrl, ...(deps.opts || {}) };
    const api = deps.api || reelsApi;
    const series = deps.series || require('./series');
    const so = { baseUrl: opts.baseUrl, ...(opts.nowMs ? { nowMs: opts.nowMs } : {}), ...(opts.almacen ? { almacen: opts.almacen } : {}) };
    if (nombre === 'subir_video') {
        // La serie se comprueba ANTES de bajar o preparar nada, para no dejar un borrador huérfano si el nombre está mal.
        const tipoVideo = a.tipo === 'historia' ? 'historia' : 'reel';
        if (tipoVideo === 'historia' && a.serie) throw new Error('Las series son solo de reels: una historia no lleva serie.');
        if (a.serie) series.resolverSerie(await series.leerSeries(db), a.serie);
        if (a.url) {
            const posts = require('./instagramPosts');
            const { id } = await posts.guardarPost(db, { tipo: tipoVideo, origen: 'manual' }, 'mcp');
            try { await api.importarVideoDesdeUrl(db, { id, url: a.url }, 'mcp', opts); } catch (err) { await posts.borrarPost(db, { id }).catch(() => {}); throw err; }
            if (a.serie) await series.asignar(db, { id, serie: a.serie, titulo: a.titulo }, 'mcp', so);
            return { ...(await api.estado(db, { id, baseUrl: opts.baseUrl, cualquiera: tipoVideo === 'historia' })), siguiente: tipoVideo === 'historia' ? 'Video de la historia listo. Llama a programar_publicacion con este id y la fecha.' : a.serie ? 'Video listo y en su serie. Ponle texto con editar_publicacion y saldrá solo en su día.' : 'Video listo. Llama a programar_publicacion con este id y el texto (o agregar_a_cola para ponerlo en una serie).' };
        }
        const r = await api.prepararSubida(db, { baseUrl: opts.baseUrl, firmar: deps.firmar, tipo: tipoVideo }, 'mcp');
        if (a.serie && r?.id) await series.asignar(db, { id: r.id, serie: a.serie, titulo: a.titulo }, 'mcp', so);
        return r;
    }
    const pub = deps.publicaciones || require('./publicaciones');
    if (nombre === 'crear_publicacion') return pub.crear(db, a, 'mcp', opts);
    if (nombre === 'agregar_imagen') return pub.agregarImagenDesdeUrl(db, { id: a.id, url: a.url }, 'mcp', opts);
    if (nombre === 'programar_publicacion') return pub.programar(db, a, 'mcp', opts);
    if (nombre === 'listar_publicaciones') return pub.listar(db, { tipo: a.tipo, estado: a.estado, limite: a.limite, baseUrl: opts.baseUrl });
    if (nombre === 'estado_publicacion') return pub.estado(db, { id: a.id, baseUrl: opts.baseUrl });
    if (nombre === 'editar_publicacion') return pub.editar(db, a, 'mcp', opts);
    if (nombre === 'cancelar_publicacion') return pub.cancelar(db, a, 'mcp', opts);
    if (nombre === 'programar_reel') return api.programar(db, a, 'mcp', opts);
    if (nombre === 'listar_reels') return api.listar(db, { estado: a.estado, limite: a.limite, baseUrl: opts.baseUrl });
    if (nombre === 'editar_reel') return api.editar(db, a, 'mcp', opts);
    if (nombre === 'cancelar_reel') return api.cancelar(db, a, 'mcp', opts);
    if (nombre === 'estado_reel') return api.estado(db, { id: a.id, baseUrl: opts.baseUrl });
    if (nombre === 'agregar_a_cola') return series.agregar(db, a, 'mcp', so);
    if (nombre === 'ver_cola') return series.ver(db, so);
    if (nombre === 'quitar_de_cola') return series.quitar(db, a, 'mcp', so);
    if (nombre === 'reordenar_cola') return series.reordenar(db, a, 'mcp', so);
    if (nombre === 'crear_serie') return series.crearSerie(db, a, 'mcp', so);
    if (nombre === 'listar_series') {
        const v = await series.ver(db, so);
        return { semana: v.semana, avisos: v.avisos, series: v.series.map((s) => ({ id: s.id, nombre: s.nombre, hora: s.hora, horaPorDefinir: s.horaPorDefinir, color: s.color, activa: s.activa, facebook: s.facebook, dias: s.dias, ...s.conteo })) };
    }
    if (nombre === 'configurar_serie') return series.configurarSerie(db, a, 'mcp', so);
    if (nombre === 'definir_semana') return series.definirSemana(db, a, 'mcp', so);
    if (['gestionar_imagenes', 'gestionar_publicacion', 'ver_agenda', 'facebook_estado'].includes(nombre)) {
        const ctl = deps.control || require('./redesControl');
        const co = { ...opts, ...(opts.nowMs ? { nowMs: opts.nowMs } : {}) };
        if (nombre === 'gestionar_imagenes') return ctl.imagenes(db, a, 'mcp', co);
        if (nombre === 'gestionar_publicacion') return ctl.gestionar(db, a, 'mcp', co);
        if (nombre === 'ver_agenda') return ctl.agenda(db, a, opts.nowMs ? { nowMs: opts.nowMs } : {});
        return ctl.facebookEstado(db, a);
    }
    if (['rendimiento', 'resumen_series', 'crecimiento', 'historico_semanal'].includes(nombre)) {
        const an = deps.analitica || require('./redesAnalitica');
        const o = opts.nowMs ? { nowMs: opts.nowMs } : {};
        if (nombre === 'rendimiento') return an.rendimiento(db, a, o);
        if (nombre === 'resumen_series') return an.resumenSeries(db, a, o);
        if (nombre === 'crecimiento') return an.crecimiento(db, a, o);
        return an.historico(db, a);
    }
    const e = new Error(`Herramienta desconocida: ${nombre}`);
    e.rpc = -32602;
    throw e;
}

const rpcOk = (id, result) => ({ jsonrpc: '2.0', id, result });
const rpcErr = (id, code, message) => ({ jsonrpc: '2.0', id, error: { code, message } });

async function procesarRpc(db, msg, deps) {
    const { id, method, params } = msg || {};
    if (id === undefined) return null; // notificación
    if (method === 'initialize') {
        const pedida = String(params?.protocolVersion || '');
        return rpcOk(id, { protocolVersion: VERSIONES.includes(pedida) ? pedida : VERSIONES[1], capabilities: { tools: {} }, serverInfo: { name: 'fodexa-reels', version: '1.0.0' }, instructions: 'Publicaciones de Roal Burger en Instagram y Facebook: posts, carruseles, historias y reels, sin restricción por tipo (crear_publicacion, agregar_imagen, programar_publicacion, listar_publicaciones, estado_publicacion, editar_publicacion, cancelar_publicacion; subir_video con tipo historia para video por PUT). Las fechas son hora de Colombia. Los reels viven en SERIES (carpetas con su cola, hora y color) y una semana fija dice qué serie sale cada día: sube el reel con subir_video (parámetro serie), ponle texto con editar_publicacion y la serie lo publica sola en orden. Herramientas: listar_series, crear_serie, configurar_serie, definir_semana, ver_cola, reordenar_cola, agregar_a_cola. CONTROL: gestionar_imagenes (agregar/quitar/ordenar/reemplazar imágenes por posición), gestionar_publicacion (desprogramar, reintentar, duplicar, cambiar_video, borrar y publicar_ahora; los dos últimos exigen confirmar:true y solo si el usuario lo pidió), ver_agenda (qué sale, cupo de Instagram e historias automáticas: úsala antes de programar) y facebook_estado. ANALÍTICA (solo lectura): rendimiento (qué publicaciones pegaron en un periodo, Instagram + Facebook), resumen_series (qué serie, tipo, día y hora rinde más), crecimiento (seguidores e historias) e historico_semanal (semanas anteriores guardadas). Para "cuál pegó la semana pasada" usa rendimiento con periodo semana_pasada y luego resumen_series; no concluyas con menos de 3 publicaciones por grupo.' });
    }
    if (method === 'ping') return rpcOk(id, {});
    if (method === 'tools/list') return rpcOk(id, { tools: HERRAMIENTAS });
    if (method === 'tools/call') {
        try {
            const r = await llamarHerramienta(db, String(params?.name || ''), params?.arguments || {}, deps);
            return rpcOk(id, { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] });
        } catch (err) {
            if (err.rpc) return rpcErr(id, err.rpc, err.message);
            return rpcOk(id, { isError: true, content: [{ type: 'text', text: String(err?.message || err).slice(0, 500) }] });
        }
    }
    return rpcErr(id, -32601, `Método no soportado: ${method}`);
}

// ── Entrada única ────────────────────────────────────────────────────────────

// req: { method, path, query, headers (minúsculas), body (objeto) } → { status, headers, body }
async function manejar(db, req, deps = {}) {
    const nowMs = deps.nowMs ?? Date.now();
    const ruta = String(req.path || '/').replace(/\/+$/, '') || '/';
    const metodo = String(req.method || 'GET').toUpperCase();
    try {
        if (metodo === 'OPTIONS') return { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type, mcp-protocol-version, mcp-session-id', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' }, body: '' };
        if (ruta.startsWith('/.well-known/oauth-protected-resource')) return json(200, metadatosRecurso());
        if (ruta.startsWith('/.well-known/oauth-authorization-server') || ruta.startsWith('/.well-known/openid-configuration')) return json(200, metadatosServidor());
        if (ruta === '/register' && metodo === 'POST') return await registrar(db, req.body || {}, nowMs);
        if (ruta === '/authorize' && metodo === 'GET') {
            const p = await validarPeticionAuth(db, req.query || {});
            if (p.error) return paginaError(p.error);
            if (p.oauthError) return redirigir(conParams(p.redirect, { error: p.oauthError, ...(p.state ? { state: p.state } : {}) }));
            return pantallaLogin(p);
        }
        if (ruta === '/authorize' && metodo === 'POST') return await autorizar(db, req.body || {}, deps, nowMs);
        if (ruta === '/token' && metodo === 'POST') return await canjear(db, req.body || {}, nowMs);
        if (ruta === '/mcp') {
            const t = await autenticar(db, req.headers || {}, nowMs);
            if (!t) return json(401, { error: 'unauthorized' }, { 'WWW-Authenticate': `Bearer resource_metadata="${FUNCTION_BASE}/.well-known/oauth-protected-resource"` });
            if (metodo !== 'POST') return json(405, { error: 'method_not_allowed' }, { Allow: 'POST' });
            const cuerpo = req.body;
            const lote = Array.isArray(cuerpo);
            const salidas = [];
            for (const m of (lote ? cuerpo : [cuerpo])) {
                const r = await procesarRpc(db, m, deps);
                if (r) salidas.push(r);
            }
            if (!salidas.length) return { status: 202, headers: {}, body: '' };
            return json(200, lote ? salidas : salidas[0]);
        }
        return json(404, { error: 'not_found' });
    } catch (err) {
        console.error('fodexaMcp:', err);
        return json(500, { error: 'server_error' });
    }
}

// Verifica correo+contraseña con Firebase Auth (REST). Devuelve { uid, email } o lanza.
async function verificarClaveFirebase(email, password, fetchFn = fetch) {
    const r = await fetchFn(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Referer: `${PUBLIC_BASE}/` },
        body: JSON.stringify({ email, password, returnSecureToken: false })
    });
    const d = await r.json();
    if (!r.ok || !d.localId) throw new Error(d?.error?.message || 'login_fallido');
    return { uid: d.localId, email: d.email };
}

module.exports = { manejar, verificarClaveFirebase, redirectPermitido, HERRAMIENTAS, ALLOWED_EMAIL, PUBLIC_BASE, FUNCTION_BASE, sha };
