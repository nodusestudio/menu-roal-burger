// IA para las publicaciones de Instagram: PROPONE copys y hashtags y los deja como BORRADORES en el
// calendario; nada sale hasta que una persona los aprueba (regla del negocio).
//
// Flujo (generarBorradores):
//   1. Lee el menú real (productos activos con foto), las publicaciones recientes y los días ocupados.
//   2. Planifica los huecos (días y horas) según posts por semana, horarios y días de descanso.
//   3. Elige un producto por hueco (el que lleva más tiempo sin publicarse, alternando categorías).
//   4. Claude (claude-haiku-4-5, cliente inyectable para tests) escribe el texto y escoge hashtags DE LA
//      LISTA DE MARCA (no inventa tags). Se rechaza todo texto con precios, descuentos, promos o "gratis":
//      lo comercial lo decide el negocio, no la IA.
//   5. Crea borradores con la hora propuesta; la foto del producto la adjunta el panel en el navegador.
// Aprobar = programarPost con esa hora (si ya pasó, hay que elegir otra en el editor).
//
// Todo recibe `db`, `cliente` y `nowMs` inyectados (tests/instagram-ia.test.js, sin red).

const { HttpsError } = require('firebase-functions/v2/https');
const cd = require('./codigoDia');
const posts = require('./instagramPosts');

const CONFIG_COLLECTION = 'instagram_config';
const CONFIG_DOC = 'contenido';
const MODELO = 'claude-haiku-4-5';
const MAX_POR_LLAMADA = 31;
const DAY_MS = 24 * 60 * 60 * 1000;
const CONCURRENCIA = 3;

const DEFAULT_CONFIG = Object.freeze({
    marca: 'Roal Burger: comida rápida con acento venezolano en Armenia, Quindío (Colombia).',
    tono: 'Cercano, alegre y antojador, con acento venezolano-colombiano. Tuteo, frases cortas, 1 a 3 emojis.',
    llamadoAccion: 'Pídelo en roalburger.com 🍔',
    hashtagsMarca: ['roalburger', 'armenia', 'quindio', 'comidarapida', 'comidavenezolana', 'antojo'],
    hashtagsPorCategoria: {
        'BURGER PREMIUM': ['hamburguesas', 'burgerlovers', 'hamburguesagourmet'],
        'BURGER CLASICAS': ['hamburguesas', 'burgerlovers'],
        'PERROS CALIENTES': ['perroscalientes', 'hotdog'],
        'SALCHIPAPAS': ['salchipapas', 'salchipapa'],
        'PEPITOS VENEZOLANOS': ['pepito', 'pepitovenezolano']
    },
    horarios: ['12:30', '19:00'],
    postsPorSemana: 3,
    noRepetirDias: 14,
    categoriasExcluidas: ['BEBIDAS', 'BEBIDAS Y ADICIONALES'],
    productosExcluidos: [],
    maxHashtags: 12
});

// ── Configuración ────────────────────────────────────────────────────────────

function sanitizeConfig(raw) {
    const r = raw || {};
    const texto = (v, def, max) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : def);
    const entero = (v, min, max, def) => { const n = Math.round(Number(v)); return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : def; };
    const lista = (v, max) => (Array.isArray(v) ? v.map((x) => String(x || '').trim()).filter(Boolean).slice(0, max) : null);
    const tags = (v, max) => (v === undefined ? null : posts.normalizarHashtags(v).slice(0, max));
    const horarios = lista(r.horarios, 6)?.filter((h) => /^([01]?\d|2[0-3]):[0-5]\d$/.test(h)).map((h) => h.padStart(5, '0'));
    const porCategoria = {};
    if (r.hashtagsPorCategoria && typeof r.hashtagsPorCategoria === 'object') {
        for (const [cat, v] of Object.entries(r.hashtagsPorCategoria).slice(0, 30)) {
            const t = posts.normalizarHashtags(v).slice(0, 15);
            if (String(cat).trim() && t.length) porCategoria[String(cat).trim().toUpperCase().slice(0, 60)] = t;
        }
    }
    return {
        marca: texto(r.marca, DEFAULT_CONFIG.marca, 300),
        tono: texto(r.tono, DEFAULT_CONFIG.tono, 400),
        llamadoAccion: typeof r.llamadoAccion === 'string' ? r.llamadoAccion.trim().slice(0, 120) : DEFAULT_CONFIG.llamadoAccion,
        hashtagsMarca: tags(r.hashtagsMarca, 20) ?? DEFAULT_CONFIG.hashtagsMarca.slice(),
        hashtagsPorCategoria: Object.keys(porCategoria).length || r.hashtagsPorCategoria ? porCategoria : { ...DEFAULT_CONFIG.hashtagsPorCategoria },
        horarios: horarios && horarios.length ? horarios : DEFAULT_CONFIG.horarios.slice(),
        postsPorSemana: entero(r.postsPorSemana, 1, 14, DEFAULT_CONFIG.postsPorSemana),
        noRepetirDias: entero(r.noRepetirDias, 0, 90, DEFAULT_CONFIG.noRepetirDias),
        categoriasExcluidas: (lista(r.categoriasExcluidas, 30) ?? DEFAULT_CONFIG.categoriasExcluidas.slice()).map((c) => c.toUpperCase()),
        productosExcluidos: lista(r.productosExcluidos, 100) ?? [],
        maxHashtags: entero(r.maxHashtags, 3, 30, DEFAULT_CONFIG.maxHashtags)
    };
}

async function leerConfigContenido(db) {
    const snap = await db.collection(CONFIG_COLLECTION).doc(CONFIG_DOC).get();
    return sanitizeConfig(snap.exists ? snap.data() : {});
}

async function guardarConfigContenido(db, raw, uid) {
    const config = sanitizeConfig(raw);
    await db.collection(CONFIG_COLLECTION).doc(CONFIG_DOC).set({ ...config, actualizadoPor: uid || null, actualizadoAtMs: Date.now() });
    return config;
}

// ── Planificación (puras) ────────────────────────────────────────────────────

const diaSemanaLunes = (fecha) => (cd.dowDe(fecha) + 6) % 7; // 0 = lunes … 6 = domingo

// Huecos { fecha, hora } para los próximos `dias`: `porSemana` por semana (lunes a domingo), repartidos
// parejo entre los días disponibles (sin días de descanso ni días que ya tienen publicación), rotando horarios.
function planificarSlots({ desde, dias, porSemana, horarios, diasCerrados = [], ocupados = new Set(), nowMs }) {
    const hoy = cd.bogotaParts(nowMs).dateKey;
    const inicio = desde < hoy ? hoy : desde;
    const fin = cd.addDays(inicio, Math.max(1, dias) - 1);
    const semanas = new Map();
    for (let f = inicio; f <= fin; f = cd.addDays(f, 1)) {
        const lunes = cd.addDays(f, -diaSemanaLunes(f));
        if (!semanas.has(lunes)) semanas.set(lunes, []);
        semanas.get(lunes).push(f);
    }
    const slots = [];
    let rot = 0;
    for (const dias7 of semanas.values()) {
        const candidatos = dias7.filter((f) => !diasCerrados.includes(cd.dowDe(f)) && !ocupados.has(f));
        const n = Math.min(porSemana, candidatos.length);
        const elegidos = [];
        for (let i = 0; i < n; i++) {
            const idx = n === 1 ? Math.floor((candidatos.length - 1) / 2) : Math.round(i * (candidatos.length - 1) / (n - 1));
            if (!elegidos.includes(candidatos[idx])) elegidos.push(candidatos[idx]);
        }
        for (const fecha of elegidos) {
            const hora = horarios[rot % horarios.length];
            rot += 1;
            const ms = cd.dateKeyToMs(fecha) + cd.horaAMinutos(hora) * 60 * 1000;
            if (ms < nowMs + 60 * 60 * 1000) continue; // hoy solo si faltan más de 1 h
            slots.push({ fecha, hora, ms });
        }
    }
    return slots.sort((a, b) => a.ms - b.ms);
}

// Un producto por hueco: primero los que nunca se han publicado o llevan más tiempo, alternando categoría.
function elegirProductos(productos, { cantidad, recientes = new Map(), noRepetirMs = 0, nowMs, excluidosIds = [], categoriasExcluidas = [], rng = Math.random }) {
    const norm = (t) => String(t || '').toUpperCase().trim();
    const elegibles = productos.filter((p) => cdVendible(p)
        && String(p.image_url || '').trim()
        && !excluidosIds.includes(p.id)
        && !categoriasExcluidas.some((c) => norm(c) === norm(p.categoria)));
    const ultima = (p) => recientes.get(p.id) || 0;
    const usadosAqui = new Set();
    const elegidos = [];
    let categoriaPrevia = '';
    while (elegidos.length < cantidad && elegibles.length) {
        let pool = elegibles.filter((p) => !usadosAqui.has(p.id) && (!noRepetirMs || nowMs - ultima(p) >= noRepetirMs));
        if (!pool.length) pool = elegibles.filter((p) => !usadosAqui.has(p.id));
        if (!pool.length) { usadosAqui.clear(); continue; } // se acabaron: se empieza otra vuelta
        const otraCategoria = pool.filter((p) => norm(p.categoria) !== categoriaPrevia);
        if (otraCategoria.length) pool = otraCategoria;
        const masViejo = Math.min(...pool.map(ultima));
        const empatados = pool.filter((p) => ultima(p) === masViejo);
        const p = empatados[Math.floor(rng() * empatados.length) % empatados.length];
        usadosAqui.add(p.id);
        categoriaPrevia = norm(p.categoria);
        elegidos.push(p);
    }
    return elegidos;
}

function cdVendible(p) {
    return Boolean(String(p?.nombre || '').trim())
        && String(p?.estado || '').trim().toLowerCase() !== 'paused'
        && p?.paused !== true;
}

// ── Claude ───────────────────────────────────────────────────────────────────

// Lo comercial (precios, descuentos, promos, "gratis") lo decide el negocio: la IA no lo escribe.
const PROHIBIDO = /\$\s?\d|\d\s?%|\bcop\b|\bpesos\b|\bgratis\b|\b2\s?x\s?1\b|\bdescuentos?\b|\bpromo(?:ci[oó]n(?:es)?|s)?\b|\bofertas?\b|c[oó]digo del d[ií]a|\bcup[oó]n(?:es)?\b/i;

function bancoDeHashtags(config, categoria) {
    const cat = String(categoria || '').trim().toUpperCase();
    return [...new Set([...(config.hashtagsPorCategoria[cat] || []), ...config.hashtagsMarca])];
}

function construirPrompt(producto, config, { variacion = 0 } = {}) {
    const banco = bancoDeHashtags(config, producto.categoria);
    const system = `Eres el community manager de ${config.marca}
Escribes el texto (caption) de UNA publicación de Instagram sobre un producto del menú.
Tono: ${config.tono}
Reglas obligatorias:
- Español. Entre 120 y 450 caracteres. Máximo 3 emojis.
- Habla SOLO de lo que dice la descripción del producto o de lo evidente por su nombre; no inventes ingredientes, tamaños ni "el mejor de la ciudad".
- NO escribas precios, descuentos, promociones, ofertas, cupones, "gratis", ni horarios, direcciones o teléfonos.
- Usa el nombre del producto tal como te lo doy.${config.llamadoAccion ? `\n- Termina con este llamado a la acción, tal cual: "${config.llamadoAccion}"` : ''}
- Hashtags: elige entre 6 y ${config.maxHashtags} SOLO de la lista que te doy, escritos exactamente igual y sin el símbolo #.
Responde ÚNICAMENTE con JSON válido, sin texto extra ni bloques de código: {"caption": "...", "hashtags": ["..."]}`;
    const user = `Producto: ${producto.nombre}
Categoría: ${producto.categoria || 'sin categoría'}
Descripción: ${String(producto.descripcion || producto.description || '').trim() || '(sin descripción: habla solo de lo evidente por el nombre)'}
Hashtags disponibles: ${banco.join(', ')}${variacion ? `\nEsta es la versión ${variacion + 1}: cambia el enfoque, el gancho y las palabras respecto a las anteriores.` : ''}`;
    return { system, user, banco };
}

function extraerJson(texto) {
    const t = String(texto || '').trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
    const ini = t.indexOf('{');
    const fin = t.lastIndexOf('}');
    if (ini === -1 || fin <= ini) throw new Error('La IA no devolvió un JSON.');
    return JSON.parse(t.slice(ini, fin + 1));
}

// Valida la respuesta de la IA. Lanza Error con el motivo si no sirve.
function validarCopy(json, banco, config) {
    const caption = String(json?.caption || '').trim();
    if (caption.length < 20) throw new Error('El texto de la IA salió vacío o muy corto.');
    if (caption.length > 900) throw new Error('El texto de la IA salió demasiado largo.');
    if (PROHIBIDO.test(caption)) throw new Error('El texto de la IA mencionaba precios, descuentos o promociones.');
    const porClave = new Map(banco.map((h) => [h.toLowerCase(), h]));
    const vistos = new Set();
    const hashtags = [];
    for (const h of Array.isArray(json?.hashtags) ? json.hashtags : []) {
        const limpio = posts.normalizarHashtags([h])[0];
        const canon = limpio && porClave.get(limpio.toLowerCase());
        if (canon && !vistos.has(canon)) { vistos.add(canon); hashtags.push(canon); }
    }
    for (const h of config.hashtagsMarca) { // completa con los de marca si la IA eligió pocos
        if (hashtags.length >= 6) break;
        if (!vistos.has(h)) { vistos.add(h); hashtags.push(h); }
    }
    return { caption, hashtags: hashtags.slice(0, config.maxHashtags) };
}

async function generarCopy(cliente, producto, config, { variacion = 0 } = {}) {
    const { system, user, banco } = construirPrompt(producto, config, { variacion });
    let ultimoError;
    for (let intento = 0; intento < 2; intento++) {
        try {
            const resp = await cliente.messages.create({
                model: MODELO, max_tokens: 700, system,
                messages: [{ role: 'user', content: intento ? `${user}\n\nIMPORTANTE: tu respuesta anterior no cumplió las reglas (${ultimoError.message}). Corrígelo.` : user }]
            });
            const texto = (resp.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('');
            return validarCopy(extraerJson(texto), banco, config);
        } catch (err) {
            ultimoError = err;
        }
    }
    throw ultimoError;
}

// ── Casos de uso ─────────────────────────────────────────────────────────────

async function enLotes(items, tarea) {
    const salida = new Array(items.length);
    let i = 0;
    await Promise.all(Array.from({ length: Math.min(CONCURRENCIA, items.length) }, async () => {
        while (i < items.length) { const idx = i++; salida[idx] = await tarea(items[idx], idx); }
    }));
    return salida;
}

async function generarBorradores(db, { desde, dias = 14, porSemana, cliente, rng = Math.random }, uid, { nowMs = Date.now() } = {}) {
    if (!cliente) throw new HttpsError('failed-precondition', 'La IA no está configurada.');
    const config = await leerConfigContenido(db);
    const cdConfig = await cd.leerConfig(db);
    const hoy = cd.bogotaParts(nowMs).dateKey;
    const inicio = /^\d{4}-\d{2}-\d{2}$/.test(String(desde || '')) ? String(desde) : hoy;
    const nDias = Math.min(31, Math.max(1, Math.round(Number(dias) || 14)));
    const nSemana = Math.min(14, Math.max(1, Math.round(Number(porSemana) || config.postsPorSemana)));

    const [prodSnap, postSnap] = await Promise.all([
        db.collection('productos').get(),
        db.collection(posts.POSTS_COLLECTION).orderBy('creadoAtMs', 'desc').limit(400).get()
    ]);
    const productos = prodSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const existentes = postSnap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((p) => p.estado !== 'cancelada');
    const ocupados = new Set(existentes
        .map((p) => (p.estado === 'publicada' ? p.publicadaAtMs : p.programadaAtMs))
        .filter(Boolean)
        .map((ms) => cd.bogotaParts(ms).dateKey));
    const recientes = new Map();
    for (const p of existentes) {
        if (!p.productoId) continue;
        const ms = Number(p.publicadaAtMs || p.programadaAtMs || p.creadoAtMs) || 0;
        if (ms > (recientes.get(p.productoId) || 0)) recientes.set(p.productoId, ms);
    }

    const slots = planificarSlots({ desde: inicio, dias: nDias, porSemana: nSemana, horarios: config.horarios, diasCerrados: cdConfig.diasCerrados, ocupados, nowMs });
    if (!slots.length) return { ok: true, creados: [], fallidos: [], mensaje: 'No hay días libres en ese rango (revisa los días de descanso y lo que ya tienes programado).' };
    const elegidos = elegirProductos(productos, {
        cantidad: Math.min(slots.length, MAX_POR_LLAMADA), recientes, noRepetirMs: config.noRepetirDias * DAY_MS, nowMs,
        excluidosIds: config.productosExcluidos, categoriasExcluidas: config.categoriasExcluidas, rng
    });
    if (!elegidos.length) throw new HttpsError('failed-precondition', 'No hay productos con foto y disponibles para publicar (revisa las categorías excluidas).');

    const creados = [];
    const fallidos = [];
    await enLotes(slots.slice(0, elegidos.length).map((slot, i) => ({ slot, producto: elegidos[i] })), async ({ slot, producto }) => {
        try {
            const copy = await generarCopy(cliente, producto, config);
            const { id } = await posts.crearBorrador(db, {
                tipo: 'foto', origen: 'ia', caption: copy.caption, hashtags: copy.hashtags, productoId: producto.id,
                notaIA: `IA · ${producto.nombre} · ${producto.categoria || ''}`, programadaAtMs: slot.ms
            }, uid, { nowMs });
            creados.push({ id, fecha: slot.fecha, hora: slot.hora, productoNombre: producto.nombre });
        } catch (err) {
            fallidos.push({ fecha: slot.fecha, producto: producto.nombre, error: String(err.message || err).slice(0, 200) });
        }
    });
    creados.sort((a, b) => `${a.fecha}${a.hora}`.localeCompare(`${b.fecha}${b.hora}`));
    return { ok: true, creados, fallidos, planificados: slots.length };
}

async function regenerarCopy(db, { id, cliente }, uid, { nowMs = Date.now() } = {}) {
    if (!cliente) throw new HttpsError('failed-precondition', 'La IA no está configurada.');
    const post = await posts.leerPost(db, id);
    if (['publicada', 'publicando'].includes(post.estado)) throw new HttpsError('failed-precondition', 'Esa publicación ya salió.');
    if (!post.productoId) throw new HttpsError('failed-precondition', 'Esta publicación no tiene producto: escribe el texto a mano.');
    const prod = await db.collection('productos').doc(post.productoId).get();
    if (!prod.exists) throw new HttpsError('not-found', 'El producto de esta publicación ya no existe.');
    const config = await leerConfigContenido(db);
    const veces = Number(post.regeneraciones || 0) + 1;
    const copy = await generarCopy(cliente, { id: prod.id, ...prod.data() }, config, { variacion: veces });
    await db.collection(posts.POSTS_COLLECTION).doc(id).set({
        caption: copy.caption, hashtags: copy.hashtags, regeneraciones: veces, actualizadoAtMs: nowMs,
        ...(post.estado === 'programada' || post.estado === 'error' ? { estado: 'borrador', error: '' } : {})
    }, { merge: true });
    return { ok: true, caption: copy.caption, hashtags: copy.hashtags };
}

// Aprobar = programar con la hora que propuso la IA (o la que se editó). Pide imagen y hora futura.
async function aprobarPost(db, { id }, uid, { nowMs = Date.now() } = {}) {
    const post = await posts.leerPost(db, id);
    if (!post.programadaAtMs) throw new HttpsError('failed-precondition', 'Elige primero la fecha y hora en el editor.');
    if (post.programadaAtMs < nowMs + 60 * 1000) throw new HttpsError('failed-precondition', 'La hora propuesta ya pasó: elige otra en el editor.');
    return posts.programarPost(db, { id, programadaAtMs: post.programadaAtMs }, uid, { nowMs });
}

async function aprobarVarios(db, { ids }, uid, { nowMs = Date.now() } = {}) {
    const resultados = [];
    for (const id of (Array.isArray(ids) ? ids : []).slice(0, 60)) {
        try {
            await aprobarPost(db, { id }, uid, { nowMs });
            resultados.push({ id, ok: true });
        } catch (err) {
            resultados.push({ id, ok: false, error: String(err.message || err).slice(0, 200) });
        }
    }
    return { ok: true, resultados, aprobadas: resultados.filter((r) => r.ok).length };
}

module.exports = {
    CONFIG_COLLECTION,
    CONFIG_DOC,
    MODELO,
    DEFAULT_CONFIG,
    PROHIBIDO,
    sanitizeConfig,
    leerConfigContenido,
    guardarConfigContenido,
    planificarSlots,
    elegirProductos,
    bancoDeHashtags,
    construirPrompt,
    extraerJson,
    validarCopy,
    generarCopy,
    generarBorradores,
    regenerarCopy,
    aprobarPost,
    aprobarVarios
};
