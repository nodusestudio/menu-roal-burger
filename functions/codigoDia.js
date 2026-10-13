// CÓDIGO DEL DÍA (reemplaza el viejo "Recomendado del día" con 20% automático para cualquiera).
//
// Todos los días a las 12:00 m se publica en las historias de Instagram un código (palabra
// venezolana + 2 dígitos, ej. CHAMO27). Con ese código, los primeros N clientes (cuposPorDia)
// obtienen `porcentaje` % de descuento en el producto del día, SOLO por el menú web/app o en caja
// -- nunca por WhatsApp (ni el agente ni "Pegar pedido de WhatsApp" conocen este módulo).
//
// Colecciones (TODA escritura pasa por aquí, con Admin SDK; ver firestore.rules):
//   codigo_dia_config/general       configuración (porcentaje, cupos, categorías, hora, activo)
//   codigo_dia/{YYYY-MM-DD}         día programado: producto, palabra, cupos, canjes (contador)
//   codigo_dia_canjes/{fecha}_{tel} candado de un uso por celular por día + datos del canje
//   codigo_dia_publico/hoy          lo ÚNICO que lee el menú público -- NUNCA trae la palabra
//
// Las funciones reciben `db` y `nowMs` inyectados para poder probarlas contra el emulador sin
// pasar por los wrappers onCall/onSchedule de index.js (mismo patrón que cuponPana.js).
'use strict';

const { HttpsError } = require('firebase-functions/v2/https');
const { FieldPath, FieldValue, Timestamp } = require('firebase-admin/firestore');
const orderLogic = require('./agent/orderLogic');
const { normalizeColombianPhoneDigits, isValidColombianMobile } = require('./phoneUtils');
const { PALABRAS } = require('./codigoDiaPalabras');

const CONFIG_COLLECTION = 'codigo_dia_config';
const CONFIG_DOC = 'general';
const DIAS_COLLECTION = 'codigo_dia';
const CANJES_COLLECTION = 'codigo_dia_canjes';
const PUBLICO_COLLECTION = 'codigo_dia_publico';
const PUBLICO_DOC = 'hoy';
const PRODUCTS_COLLECTION = 'productos';

const DIAS_A_PROGRAMAR = 30;
const NO_REPETIR_PRODUCTO_DIAS = 7;
const NO_REPETIR_PALABRA_DIAS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;
const BOGOTA_OFFSET_MS = -5 * 60 * 60 * 1000; // Colombia no tiene horario de verano

// couponId de la línea del carrito (ver script-v2.js) -- no es desc_/ce_, así que no entra al
// bloqueo de 24h de cupones: su candado propio es codigo_dia_canjes.
const COUPON_ID = 'codigo_dia';

const DEFAULT_CONFIG = Object.freeze({
    porcentaje: 30,
    cuposPorDia: 10,
    // Nombres EXACTOS de las categorías del catálogo (colección `categorias`).
    categoriasElegibles: ['BURGER PREMIUM', 'PERROS CALIENTES', 'SALCHIPAPAS', 'PEPITOS VENEZOLANOS'],
    horaPublicacion: '12:00',
    // El código se ACEPTA (web y caja) hasta horaCierre. En redes se anuncia que termina a las 9 p. m.
    // (agotadoDesde): desde ahí, si no se agotó solo, sale la historia de "agotado" a una hora al azar
    // dentro de agotadoVentanaMin minutos. La gente que lo vio tarde aún puede usarlo hasta horaCierre.
    horaCierre: '22:00',
    agotadoDesde: '21:00',
    agotadoVentanaMin: 45,
    activo: true,
    // El restaurante cierra los miércoles (0=domingo … 6=sábado). Ese día no hay código.
    diasCerrados: [3]
});

const MOTIVOS = Object.freeze({
    INACTIVO: 'inactivo',
    ANTES_DE_HORA: 'antes_de_hora',
    INVALIDO: 'invalido',
    AGOTADO: 'agotado',
    PRODUCTO: 'producto',
    YA_USADO: 'ya_usado',
    SIN_TELEFONO: 'sin_telefono'
});

// ── Utilidades ───────────────────────────────────────────────────────────────

function normalizeText(value) {
    return String(value || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

// Para COMPARAR lo que escribe el cliente con la palabra del día: "chamo 27", "Chamo-27",
// "CHAMÓ27" y "CHAM027" → "CHAMO27". El 0 y el 1 se leen como O e I (se confunden en la historia);
// las palabras nunca llevan dígitos y los dígitos del código nunca son 0 ni 1, así que convertir
// los dos lados por igual no puede hacer coincidir dos códigos distintos.
function normalizarCodigo(raw) {
    return limpiarPalabra(raw).replace(/0/g, 'O').replace(/1/g, 'I');
}

// Mayúsculas, sin tildes ni espacios/símbolos -- SIN convertir dígitos (para guardar la palabra).
function limpiarPalabra(raw) {
    return String(raw || '')
        .toUpperCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^A-Z0-9]/g, '')
        .slice(0, 24);
}

function bogotaParts(ms) {
    const d = new Date(Number(ms) + BOGOTA_OFFSET_MS);
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth() + 1;
    const day = d.getUTCDate();
    return {
        dow: d.getUTCDay(),
        minutes: d.getUTCHours() * 60 + d.getUTCMinutes(),
        dateKey: `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    };
}

function dateKeyToMs(dateKey) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateKey || ''));
    if (!m) return null;
    return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) - BOGOTA_OFFSET_MS;
}

function addDays(dateKey, n) {
    return bogotaParts(dateKeyToMs(dateKey) + n * DAY_MS + 12 * 60 * 60 * 1000).dateKey;
}

function dowDe(dateKey) {
    return bogotaParts(dateKeyToMs(dateKey) + 12 * 60 * 60 * 1000).dow;
}

function horaAMinutos(hhmm) {
    const m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm || ''));
    if (!m) return 12 * 60;
    return Math.min(23, Number(m[1])) * 60 + Math.min(59, Number(m[2]));
}

function toMs(value) {
    if (!value) return null;
    if (typeof value.toMillis === 'function') return value.toMillis();
    if (value instanceof Date) return value.getTime();
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
}

function precioConDescuento(precio, porcentaje) {
    return Math.round(Number(precio || 0) * (1 - Number(porcentaje || 0) / 100));
}

// Solo URLs cortas: muchas fotos del catálogo son data-URLs base64 de cientos de KB; esas no se
// copian a la vista pública (el menú ya tiene la foto en memoria, la busca por productoId).
function fotoPublica(url) {
    const u = String(url || '').trim();
    return /^https?:\/\//i.test(u) && u.length < 2000 ? u : null;
}

function slug(value, max = 40) {
    return normalizeText(value).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, max);
}

// ── Configuración ────────────────────────────────────────────────────────────

function sanitizeConfig(raw) {
    const r = raw || {};
    const int = (v, min, max, def) => {
        const n = Math.round(Number(v));
        return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : def;
    };
    const categorias = Array.isArray(r.categoriasElegibles)
        ? r.categoriasElegibles.map((c) => String(c || '').trim()).filter(Boolean).slice(0, 12)
        : [];
    const dias = Array.isArray(r.diasCerrados)
        ? [...new Set(r.diasCerrados.map(Number).filter((d) => Number.isInteger(d) && d >= 0 && d <= 6))]
        : DEFAULT_CONFIG.diasCerrados.slice();
    const horaOk = (v, def) => (/^\d{1,2}:\d{2}$/.test(String(v || '')) ? String(v) : def);
    const hora = horaOk(r.horaPublicacion, DEFAULT_CONFIG.horaPublicacion);
    return {
        porcentaje: int(r.porcentaje, 1, 90, DEFAULT_CONFIG.porcentaje),
        cuposPorDia: int(r.cuposPorDia, 1, 500, DEFAULT_CONFIG.cuposPorDia),
        categoriasElegibles: categorias.length ? categorias : DEFAULT_CONFIG.categoriasElegibles.slice(),
        horaPublicacion: hora,
        horaCierre: horaOk(r.horaCierre, DEFAULT_CONFIG.horaCierre),
        agotadoDesde: horaOk(r.agotadoDesde, DEFAULT_CONFIG.agotadoDesde),
        agotadoVentanaMin: int(r.agotadoVentanaMin, 0, 180, DEFAULT_CONFIG.agotadoVentanaMin),
        activo: r.activo === undefined ? DEFAULT_CONFIG.activo : r.activo === true,
        diasCerrados: dias
    };
}

async function leerConfig(db, tx = null) {
    const ref = db.collection(CONFIG_COLLECTION).doc(CONFIG_DOC);
    const snap = tx ? await tx.get(ref) : await ref.get();
    return sanitizeConfig(snap.exists ? snap.data() : null);
}

function esCategoriaElegible(categoria, config) {
    const key = normalizeText(categoria);
    return Boolean(key) && config.categoriasElegibles.some((c) => normalizeText(c) === key);
}

function productoVendible(p) {
    return Boolean(String(p?.nombre || '').trim())
        && String(p?.estado || '').trim().toLowerCase() !== 'paused'
        && p?.paused !== true;
}

function vistaProducto(id, p) {
    return {
        id,
        nombre: String(p.nombre || '').trim(),
        categoria: String(p.categoria || '').trim(),
        precio: Number(p.precio) || 0,
        foto: fotoPublica(p.image_url)
    };
}

async function leerProductosElegibles(db, config) {
    const snap = await db.collection(PRODUCTS_COLLECTION).get();
    return snap.docs
        .map((doc) => ({ id: doc.id, data: doc.data() }))
        .filter(({ data }) => productoVendible(data) && esCategoriaElegible(data.categoria, config) && Number(data.precio) > 0)
        .map(({ id, data }) => vistaProducto(id, data));
}

// ── Días que no tienen código ────────────────────────────────────────────────

async function leerCierresProgramados(db) {
    const snap = await db.collection('configuracion').doc('config_horario').get();
    return orderLogic.parseCierresProgramados(snap.exists ? snap.data()?.cierresProgramados : []);
}

// Solo un cierre de día completo quita el código; uno por franja horaria deja abierto el resto.
function diaSaltado(dateKey, config, cierres) {
    if (config.diasCerrados.includes(dowDe(dateKey))) return true;
    return (cierres || []).some((c) => c.todoElDia && dateKey >= c.fechaInicio && dateKey <= c.fechaFin);
}

// ── Programación ─────────────────────────────────────────────────────────────

async function leerDiasEnRango(db, desdeKey, hastaKey) {
    const snap = await db.collection(DIAS_COLLECTION)
        .where(FieldPath.documentId(), '>=', desdeKey)
        .where(FieldPath.documentId(), '<=', hastaKey)
        .get();
    const out = {};
    snap.docs.forEach((doc) => { out[doc.id] = doc.data(); });
    return out;
}

const BASES_VALIDAS = new Set(PALABRAS.map((p) => p.palabra));

// Palabra de un día especial (solo se escribe a mano en el panel): solo letras, 4 a 15, sin dígitos.
// La generación automática sigue siendo palabra de la lista + 2 dígitos.
const PALABRA_ESPECIAL_RE = /^[A-Z]{4,15}$/;

// ¿La palabra del día está en la lista vigente y con dígitos 2-9? (las viejas, ej. HALLACA29 o
// VACILON12, no).
function palabraVigente(dia) {
    if (dia?.especial === true && PALABRA_ESPECIAL_RE.test(String(dia.palabra || ''))) return true;
    const m = /^([A-Z]+)(\d{2})$/.exec(String(dia?.palabra || ''));
    return Boolean(m) && BASES_VALIDAS.has(m[1]) && /^[2-9]{2}$/.test(m[2]);
}

function palabraBase(dia) {
    return String(dia?.palabraBase || String(dia?.palabra || '').replace(/\d+$/, '')).toUpperCase();
}

function generarPalabra(usadas, rng = Math.random) {
    const libres = PALABRAS.filter((p) => !usadas.has(p.palabra));
    const lista = libres.length ? libres : PALABRAS;
    const elegida = lista[Math.floor(rng() * lista.length) % lista.length];
    // Dígitos del 2 al 9: nunca 0 ni 1, que en la historia se confunden con la O y la I.
    const digito = () => 2 + (Math.floor(rng() * 8) % 8);
    const digitos = `${digito()}${digito()}`;
    return { palabra: `${elegida.palabra}${digitos}`, palabraBase: elegida.palabra, significado: elegida.significado };
}

// Rotación: nunca un producto usado en los NO_REPETIR_PRODUCTO_DIAS días anteriores, y la
// categoría que lleva MÁS tiempo sin salir gana (así se alterna burger premium → pepito → perro →
// salchipapa). `previos` = días anteriores en orden cronológico (el último es ayer).
function elegirProducto(pool, previos, rng = Math.random) {
    if (!pool.length) return null;
    const recientes = previos.slice(-NO_REPETIR_PRODUCTO_DIAS);
    const idsRecientes = new Set(recientes.map((d) => d.productoId));
    let candidatos = pool.filter((p) => !idsRecientes.has(p.id));
    if (!candidatos.length) {
        const ayerId = recientes.length ? recientes[recientes.length - 1].productoId : null;
        candidatos = pool.filter((p) => p.id !== ayerId);
        if (!candidatos.length) candidatos = pool.slice();
    }

    const ultimoUsoCategoria = (cat) => {
        for (let i = previos.length - 1; i >= 0; i--) {
            if (normalizeText(previos[i].categoria) === normalizeText(cat)) return i;
        }
        return -1;
    };
    const ayerCat = previos.length ? normalizeText(previos[previos.length - 1].categoria) : null;
    let categorias = [...new Set(candidatos.map((p) => p.categoria))];
    if (categorias.length > 1 && ayerCat) categorias = categorias.filter((c) => normalizeText(c) !== ayerCat);
    const minUso = Math.min(...categorias.map(ultimoUsoCategoria));
    const empatadas = categorias.filter((c) => ultimoUsoCategoria(c) === minUso);
    const categoria = empatadas[Math.floor(rng() * empatadas.length) % empatadas.length];

    const enCategoria = candidatos.filter((p) => p.categoria === categoria);
    return enCategoria[Math.floor(rng() * enCategoria.length) % enCategoria.length];
}

function construirDia(fecha, producto, palabra, config, nowMs) {
    return {
        fecha,
        productoId: producto.id,
        productoNombre: producto.nombre,
        categoria: producto.categoria,
        precioNormal: producto.precio,
        palabra: palabra.palabra,
        palabraBase: palabra.palabraBase,
        significado: palabra.significado,
        cupos: config.cuposPorDia,
        canjes: 0,
        agotadoAt: null,
        editadoManualmente: false,
        createdAt: Timestamp.fromMillis(nowMs),
        updatedAt: Timestamp.fromMillis(nowMs)
    };
}

// Asegura que existan los próximos DIAS_A_PROGRAMAR días con código (desde hoy, saltando
// miércoles y cierres programados de día completo). Nunca toca un día que ya existe, salvo un día
// FUTURO, automático y sin canjes cuyo producto dejó de ser elegible (pausado, borrado o de una
// categoría que ya no entra): ahí cambia SOLO el producto, la palabra se conserva.
async function programarProximosDias(db, { nowMs = Date.now(), rng = Math.random } = {}) {
    const [config, cierres] = await Promise.all([leerConfig(db), leerCierresProgramados(db)]);
    const pool = await leerProductosElegibles(db, config);
    const hoy = bogotaParts(nowMs).dateKey;
    const existentes = await leerDiasEnRango(db, addDays(hoy, -NO_REPETIR_PALABRA_DIAS), addDays(hoy, 60));

    const creados = [];
    const regenerados = [];
    const palabrasCambiadas = [];
    const programados = [];
    const usadasCerca = (f) => {
        const desde = addDays(f, -NO_REPETIR_PALABRA_DIAS);
        const hasta = addDays(f, NO_REPETIR_PALABRA_DIAS);
        return new Set(Object.keys(existentes).filter((k) => k !== f && k >= desde && k <= hasta).map((k) => palabraBase(existentes[k])));
    };

    // 1) Palabras fuera de la lista vigente (o con 0/1): se cambia SOLO la palabra en los días
    //    automáticos, sin canjes, que todavía no se publicaron (futuros, u hoy antes de la hora).
    const yaPublicadoHoy = bogotaParts(nowMs).minutes >= horaAMinutos(config.horaPublicacion);
    for (const f of Object.keys(existentes).filter((k) => k >= hoy).sort()) {
        const d = existentes[f];
        if (palabraVigente(d) || d.editadoManualmente || Number(d.canjes || 0) > 0) continue;
        if (f === hoy && yaPublicadoHoy) continue;
        const nueva = generarPalabra(usadasCerca(f), rng);
        const ref = db.collection(DIAS_COLLECTION).doc(f);
        const cambiado = await db.runTransaction(async (tx) => {
            const snap = await tx.get(ref);
            const actual = snap.data();
            if (!snap.exists || actual.editadoManualmente || Number(actual.canjes || 0) > 0) return null;
            const patch = { ...nueva, updatedAt: Timestamp.fromMillis(nowMs) };
            tx.update(ref, patch);
            return { ...actual, ...patch };
        });
        if (cambiado) { existentes[f] = cambiado; palabrasCambiadas.push(f); }
    }

    let fecha = hoy;
    for (let i = 0; programados.length < DIAS_A_PROGRAMAR && i < 60; i++, fecha = addDays(fecha, 1)) {
        if (diaSaltado(fecha, config, cierres)) continue;
        programados.push(fecha);

        const existente = existentes[fecha];
        const productoSigue = existente && pool.some((p) => p.id === existente.productoId);
        if (existente && (existente.editadoManualmente || productoSigue || fecha === hoy || Number(existente.canjes || 0) > 0)) continue;
        if (!pool.length) continue;

        const previos = Object.keys(existentes)
            .filter((k) => k < fecha && k >= addDays(fecha, -NO_REPETIR_PRODUCTO_DIAS))
            .sort()
            .map((k) => existentes[k]);
        const producto = elegirProducto(pool, previos, rng);
        const ref = db.collection(DIAS_COLLECTION).doc(fecha);

        if (existente) {
            const cambiado = await db.runTransaction(async (tx) => {
                const snap = await tx.get(ref);
                const d = snap.data();
                if (!snap.exists || d.editadoManualmente || Number(d.canjes || 0) > 0) return null;
                const patch = {
                    productoId: producto.id, productoNombre: producto.nombre, categoria: producto.categoria,
                    precioNormal: producto.precio, updatedAt: Timestamp.fromMillis(nowMs)
                };
                tx.update(ref, patch);
                return { ...d, ...patch };
            });
            if (cambiado) { existentes[fecha] = cambiado; regenerados.push(fecha); }
            continue;
        }

        const dia = construirDia(fecha, producto, generarPalabra(usadasCerca(fecha), rng), config, nowMs);
        try {
            await ref.create(dia);
            existentes[fecha] = dia;
            creados.push(fecha);
        } catch (err) {
            // Otra ejecución lo creó en el medio (código 6 = ALREADY_EXISTS): se respeta el suyo.
            if (err?.code !== 6) throw err;
            const snap = await ref.get();
            if (snap.exists) existentes[fecha] = snap.data();
        }
    }

    await actualizarPublicoHoy(db, nowMs);
    return { hoy, programados, creados, regenerados, palabrasCambiadas, sinProductos: !pool.length };
}

// ── Vista pública (codigo_dia_publico/hoy) ───────────────────────────────────

function vistaPublica({ fecha, config, dia, saltado, producto }) {
    if (!config.activo || !dia || saltado || (producto && producto.vendible === false)) {
        return { fecha, activo: false };
    }
    const precio = Number(producto?.precio) || Number(dia.precioNormal) || 0;
    const cupos = Number(dia.cupos) || 0;
    const canjes = Number(dia.canjes) || 0;
    return {
        fecha,
        activo: true,
        productoId: dia.productoId,
        productoNombre: producto?.nombre || dia.productoNombre,
        categoria: producto?.categoria || dia.categoria,
        foto: producto?.foto || null,
        precioNormal: precio,
        precioConDescuento: precioConDescuento(precio, config.porcentaje),
        porcentaje: config.porcentaje,
        cupos,
        cuposRestantes: Math.max(0, cupos - canjes),
        agotado: canjes >= cupos,
        horaPublicacion: config.horaPublicacion,
        horaCierre: config.horaCierre
    };
}

async function actualizarPublicoHoy(db, nowMs = Date.now()) {
    const fecha = bogotaParts(nowMs).dateKey;
    const [config, cierres, diaSnap] = await Promise.all([
        leerConfig(db),
        leerCierresProgramados(db),
        db.collection(DIAS_COLLECTION).doc(fecha).get()
    ]);
    const dia = diaSnap.exists ? diaSnap.data() : null;
    let producto = null;
    if (dia?.productoId) {
        const pSnap = await db.collection(PRODUCTS_COLLECTION).doc(dia.productoId).get();
        producto = pSnap.exists
            ? { ...vistaProducto(pSnap.id, pSnap.data()), vendible: productoVendible(pSnap.data()) }
            : { vendible: false };
    }
    const vista = vistaPublica({ fecha, config, dia, saltado: diaSaltado(fecha, config, cierres), producto });
    await db.collection(PUBLICO_COLLECTION).doc(PUBLICO_DOC).set({ ...vista, updatedAt: Timestamp.fromMillis(nowMs) });
    return vista;
}

// ── Validación ───────────────────────────────────────────────────────────────

function mensajeDe(motivo, extra = {}) {
    switch (motivo) {
        case MOTIVOS.INACTIVO: return 'Hoy no hay código del día.';
        case MOTIVOS.ANTES_DE_HORA: return `El código de hoy se publica a las ${extra.hora || '12:00'} en nuestras historias de Instagram 👀`;
        case MOTIVOS.INVALIDO: return 'Ese no es el código de hoy. Búscalo en nuestras historias de Instagram 👀';
        case MOTIVOS.AGOTADO: return 'Se acabaron los de hoy ✅ Mañana a las 12, nuevo código';
        case MOTIVOS.PRODUCTO: return extra.producto ? `El código de hoy solo aplica a ${extra.producto}.` : 'El código de hoy no aplica a ese producto.';
        case MOTIVOS.YA_USADO: return extra.porNombre
            ? 'Esa persona ya usó el código del día hoy. ¡La esperamos mañana!'
            : 'Este celular ya usó el código del día hoy. ¡Te esperamos mañana!';
        case MOTIVOS.SIN_TELEFONO: return 'Necesitamos un celular válido para aplicar el código del día.';
        default: return 'No se pudo aplicar el código del día.';
    }
}

// Reglas comunes (sin teléfono ni producto): activo, hora, código, cupos.
function evaluarCodigo({ codigo, config, dia, saltado, nowMs }) {
    if (!config.activo || !dia || saltado) return MOTIVOS.INACTIVO;
    if (bogotaParts(nowMs).minutes < horaAMinutos(config.horaPublicacion)) return MOTIVOS.ANTES_DE_HORA;
    if (!codigo || normalizarCodigo(codigo) !== normalizarCodigo(dia.palabra)) return MOTIVOS.INVALIDO;
    if (Number(dia.canjes || 0) >= Number(dia.cupos || 0)) return MOTIVOS.AGOTADO;
    // Pasada la hora de cierre el código ya no se acepta (mismo mensaje que agotado).
    if (bogotaParts(nowMs).minutes >= horaAMinutos(config.horaCierre)) return MOTIVOS.AGOTADO;
    return null;
}

async function leerEstadoDia(db, nowMs, tx = null) {
    const fecha = bogotaParts(nowMs).dateKey;
    const diaRef = db.collection(DIAS_COLLECTION).doc(fecha);
    const [config, cierres, diaSnap] = await Promise.all([
        leerConfig(db, tx),
        leerCierresProgramados(db),
        tx ? tx.get(diaRef) : diaRef.get()
    ]);
    return { fecha, diaRef, config, dia: diaSnap.exists ? diaSnap.data() : null, saltado: diaSaltado(fecha, config, cierres) };
}

// Callable validarCodigoDia: NO consume cupo, solo dice si el código sirve AHORA.
async function validarCodigoDia(db, codigoRaw, nowMs = Date.now()) {
    const { config, dia, saltado } = await leerEstadoDia(db, nowMs);
    const motivo = evaluarCodigo({ codigo: codigoRaw, config, dia, saltado, nowMs });
    if (motivo) {
        return { estado: motivo, mensaje: mensajeDe(motivo, { hora: config.horaPublicacion }) };
    }
    const precio = Number(dia.precioNormal) || 0;
    return {
        estado: 'valido',
        mensaje: `¡Código correcto! ${config.porcentaje}% de descuento en ${dia.productoNombre}.`,
        codigo: normalizarCodigo(codigoRaw),
        productoId: dia.productoId,
        productoNombre: dia.productoNombre,
        porcentaje: config.porcentaje,
        precioNormal: precio,
        precioConDescuento: precioConDescuento(precio, config.porcentaje),
        cuposRestantes: Math.max(0, Number(dia.cupos || 0) - Number(dia.canjes || 0))
    };
}

// Id del candado. En caja el cliente puede no dar el celular: ahí se usa el nombre.
function canjeId(fecha, telefono, nombre) {
    const tel = normalizeColombianPhoneDigits(telefono);
    if (isValidColombianMobile(tel)) return { id: `${fecha}_${tel}`, telefono: tel };
    const n = slug(nombre);
    return n ? { id: `${fecha}_n-${n}`, telefono: null } : null;
}

// Consume UN cupo en una transacción: re-verifica TODO (código de hoy, producto de hoy y de una
// categoría elegible, cupos, candado del celular) y aplica el porcentaje de la configuración --
// nunca uno que mande el cliente. Devuelve { ok:false, motivo, mensaje } en vez de lanzar, para
// que el llamador decida (el checkout avisa y cobra precio normal; la caja muestra el motivo).
//   canal: 'web' | 'caja'. En web el celular es obligatorio; en caja basta el nombre.
//   productoNombre / productoId: lo que el cliente quiere llevar (web manda el nombre).
async function consumirCodigoDia(db, {
    codigo, canal, telefono = '', nombre = '', productoNombre = '', productoId = '', uid = null
} = {}, nowMs = Date.now()) {
    const cierres = await leerCierresProgramados(db);
    const fecha = bogotaParts(nowMs).dateKey;
    const candado = canal === 'web'
        ? (isValidColombianMobile(normalizeColombianPhoneDigits(telefono)) ? canjeId(fecha, telefono, '') : null)
        : canjeId(fecha, telefono, nombre);
    if (!candado) return { ok: false, motivo: MOTIVOS.SIN_TELEFONO, mensaje: mensajeDe(MOTIVOS.SIN_TELEFONO) };

    const configRef = db.collection(CONFIG_COLLECTION).doc(CONFIG_DOC);
    const diaRef = db.collection(DIAS_COLLECTION).doc(fecha);
    const canjeRef = db.collection(CANJES_COLLECTION).doc(candado.id);
    const publicoRef = db.collection(PUBLICO_COLLECTION).doc(PUBLICO_DOC);

    return db.runTransaction(async (tx) => {
        const [configSnap, diaSnap, canjeSnap, publicoSnap] = await Promise.all([
            tx.get(configRef), tx.get(diaRef), tx.get(canjeRef), tx.get(publicoRef)
        ]);
        const config = sanitizeConfig(configSnap.exists ? configSnap.data() : null);
        const dia = diaSnap.exists ? diaSnap.data() : null;
        const fallo = (motivo, extra) => ({ ok: false, motivo, mensaje: mensajeDe(motivo, { hora: config.horaPublicacion, ...extra }) });

        const motivo = evaluarCodigo({ codigo, config, dia, saltado: diaSaltado(fecha, config, cierres), nowMs });
        if (motivo) return fallo(motivo);

        const productoSnap = await tx.get(db.collection(PRODUCTS_COLLECTION).doc(dia.productoId));
        const producto = productoSnap.exists ? productoSnap.data() : null;
        const nombreDia = String(producto?.nombre || dia.productoNombre || '').trim();
        const pideOtro = (productoId && productoId !== dia.productoId)
            || (productoNombre && normalizeText(productoNombre) !== normalizeText(nombreDia) && normalizeText(productoNombre) !== normalizeText(dia.productoNombre));
        if (!productoId && !productoNombre) return fallo(MOTIVOS.PRODUCTO, { producto: nombreDia });
        if (pideOtro) return fallo(MOTIVOS.PRODUCTO, { producto: nombreDia });
        if (!producto || !productoVendible(producto) || !esCategoriaElegible(producto.categoria, config)) {
            return fallo(MOTIVOS.INACTIVO);
        }
        if (canjeSnap.exists) return fallo(MOTIVOS.YA_USADO, { porNombre: !candado.telefono });

        const precioNormal = Number(producto.precio) || 0;
        const precioFinal = precioConDescuento(precioNormal, config.porcentaje);
        const canjes = Number(dia.canjes || 0) + 1;
        const cupos = Number(dia.cupos || 0);
        const at = Timestamp.fromMillis(nowMs);

        tx.update(diaRef, {
            canjes,
            agotadoAt: canjes >= cupos ? at : null,
            updatedAt: at
        });
        tx.set(canjeRef, {
            fecha,
            telefono: candado.telefono,
            nombre: String(nombre || '').trim().slice(0, 60) || null,
            canal: canal === 'caja' ? 'caja' : 'web',
            codigo: normalizarCodigo(codigo),
            productoId: dia.productoId,
            productoNombre: nombreDia,
            categoria: String(producto.categoria || ''),
            porcentaje: config.porcentaje,
            precioNormal,
            monto: precioFinal,
            descuento: precioNormal - precioFinal,
            pedidoRef: null,
            uid: uid || null,
            at
        });
        if (publicoSnap.exists && publicoSnap.data()?.fecha === fecha) {
            tx.set(publicoRef, { cuposRestantes: Math.max(0, cupos - canjes), agotado: canjes >= cupos, updatedAt: at }, { merge: true });
        }
        return {
            ok: true,
            fecha,
            canjeId: candado.id,
            porcentaje: config.porcentaje,
            productoId: dia.productoId,
            productoNombre: nombreDia,
            precioNormal,
            precioConDescuento: precioFinal,
            descuento: precioNormal - precioFinal,
            cuposRestantes: Math.max(0, cupos - canjes)
        };
    });
}

// Devuelve el cupo (quitar la línea del ticket en caja, o un pedido web que no se pudo crear).
async function revertirCanjeCodigoDia(db, canjeIdRaw, { uid = null, motivo = '' } = {}, nowMs = Date.now()) {
    const id = String(canjeIdRaw || '').trim();
    if (!/^\d{4}-\d{2}-\d{2}_[a-z0-9-]+$/.test(id)) throw new HttpsError('invalid-argument', 'Canje inválido.');
    const canjeRef = db.collection(CANJES_COLLECTION).doc(id);
    const publicoRef = db.collection(PUBLICO_COLLECTION).doc(PUBLICO_DOC);
    return db.runTransaction(async (tx) => {
        const canjeSnap = await tx.get(canjeRef);
        if (!canjeSnap.exists) return { revertido: false };
        const fecha = canjeSnap.data().fecha;
        const diaRef = db.collection(DIAS_COLLECTION).doc(fecha);
        const [diaSnap, publicoSnap] = await Promise.all([tx.get(diaRef), tx.get(publicoRef)]);
        const at = Timestamp.fromMillis(nowMs);
        tx.delete(canjeRef);
        if (diaSnap.exists) {
            const d = diaSnap.data();
            const canjes = Math.max(0, Number(d.canjes || 0) - 1);
            const cupos = Number(d.cupos || 0);
            tx.update(diaRef, {
                canjes,
                agotadoAt: canjes >= cupos ? (d.agotadoAt || at) : null,
                reversas: FieldValue.arrayUnion({ canjeId: id, uid: uid || null, motivo: String(motivo || '').slice(0, 120), at })
            });
            if (publicoSnap.exists && publicoSnap.data()?.fecha === fecha) {
                tx.set(publicoRef, { cuposRestantes: Math.max(0, cupos - canjes), agotado: canjes >= cupos, updatedAt: at }, { merge: true });
            }
        }
        return { revertido: true };
    });
}

async function adjuntarPedidoACanje(db, canjeIdValue, { pedidoRef, monto }) {
    if (!canjeIdValue) return;
    const patch = { pedidoRef: pedidoRef || null };
    if (Number.isFinite(Number(monto))) patch.monto = Number(monto);
    await db.collection(CANJES_COLLECTION).doc(canjeIdValue).update(patch);
}

// ── Checkout web: la línea con código ────────────────────────────────────────

// Busca la línea del carrito que trae el código (orderOptions.codigoDia). Solo cuenta UNA línea
// y UNA unidad por pedido: si la línea trae cantidad > 1, se parte en 1 con descuento + el resto
// a precio normal; cualquier otra línea con código pierde la marca (precio normal).
function extraerLineaCodigoDia(items) {
    const out = [];
    let lineIndex = -1;
    let codigo = '';
    const sinMarca = (item) => ({
        ...item,
        orderOptions: { ...(item.orderOptions || {}), codigoDia: '', recommendedDiscount: false, discountRate: 0, couponId: '' }
    });
    (Array.isArray(items) ? items : []).forEach((item) => {
        const cd = normalizarCodigo(item?.orderOptions?.codigoDia);
        if (!cd) { out.push(item); return; }
        if (lineIndex !== -1) { out.push(sinMarca(item)); return; }
        const qty = Math.max(0, Math.floor(Number(item.quantity || 0)));
        if (qty < 1) { out.push(sinMarca(item)); return; }
        codigo = cd;
        lineIndex = out.length;
        out.push({ ...item, quantity: 1, subtotal: Number(item.unitPrice || 0), orderOptions: { ...item.orderOptions, codigoDia: cd, couponId: COUPON_ID } });
        if (qty > 1) {
            const resto = sinMarca(item);
            const precioNormal = Number(item.originalUnitPrice || item.unitPrice || 0);
            out.push({ ...resto, quantity: qty - 1, unitPrice: precioNormal, subtotal: precioNormal * (qty - 1), discountAmount: 0 });
        }
    });
    return { items: out, lineIndex, codigo };
}

// Pre-chequeo SIN consumir (antes de calcular precios): la transacción real es consumirCodigoDia.
async function prevalidarLineaWeb(db, { codigo, telefono, productoNombre, item }, nowMs = Date.now()) {
    const { fecha, config, dia, saltado } = await leerEstadoDia(db, nowMs);
    const fallo = (motivo, extra) => ({ ok: false, motivo, mensaje: mensajeDe(motivo, { hora: config.horaPublicacion, ...extra }) });
    const motivo = evaluarCodigo({ codigo, config, dia, saltado, nowMs });
    if (motivo) return fallo(motivo);
    const oo = item?.orderOptions || {};
    const tipoOk = !item?.isComboEspecial && !oo.isComboChild && String(oo.type || 'solo') === 'solo';
    if (!tipoOk || normalizeText(productoNombre) !== normalizeText(dia.productoNombre)) {
        return fallo(MOTIVOS.PRODUCTO, { producto: dia.productoNombre });
    }
    const tel = normalizeColombianPhoneDigits(telefono);
    if (!isValidColombianMobile(tel)) return fallo(MOTIVOS.SIN_TELEFONO);
    const lock = await db.collection(CANJES_COLLECTION).doc(`${fecha}_${tel}`).get();
    if (lock.exists) return fallo(MOTIVOS.YA_USADO);
    return { ok: true, porcentaje: config.porcentaje, fecha };
}

// ── Panel FODEXA ─────────────────────────────────────────────────────────────

async function guardarConfig(db, raw, uid, nowMs = Date.now()) {
    const config = sanitizeConfig(raw);
    await db.collection(CONFIG_COLLECTION).doc(CONFIG_DOC).set({ ...config, updatedAt: Timestamp.fromMillis(nowMs), updatedBy: uid || null });
    await actualizarPublicoHoy(db, nowMs);
    return { ok: true, config };
}

// Edición manual de un día (hoy o futuro): producto, palabra y/o cupos. Queda
// editadoManualmente = true para que la programación automática no lo pise.
async function editarDia(db, raw, uid, nowMs = Date.now()) {
    const fecha = String(raw?.fecha || '');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) throw new HttpsError('invalid-argument', 'Fecha inválida.');
    const hoy = bogotaParts(nowMs).dateKey;
    if (fecha < hoy) throw new HttpsError('failed-precondition', 'No se pueden editar días pasados.');
    const config = await leerConfig(db);
    const patch = { editadoManualmente: true, updatedAt: Timestamp.fromMillis(nowMs), editadoPor: uid || null };

    if (raw.productoId !== undefined) {
        const pSnap = await db.collection(PRODUCTS_COLLECTION).doc(String(raw.productoId || '')).get();
        const p = pSnap.exists ? pSnap.data() : null;
        if (!p || !productoVendible(p) || !esCategoriaElegible(p.categoria, config)) {
            throw new HttpsError('invalid-argument', `El producto debe estar activo y ser de: ${config.categoriasElegibles.join(', ')}.`);
        }
        Object.assign(patch, {
            productoId: pSnap.id, productoNombre: String(p.nombre).trim(),
            categoria: String(p.categoria || '').trim(), precioNormal: Number(p.precio) || 0
        });
    }
    if (raw.palabra !== undefined) {
        const palabra = limpiarPalabra(raw.palabra);
        // Día especial: solo letras (ej. MARIOJOSE), de 4 a 15, sin dígitos. Se compara con
        // normalizarCodigo igual que las demás, así que "Mario Jose" o "mariojose" también valen.
        const especial = PALABRA_ESPECIAL_RE.test(palabra);
        if (!especial && !/^[A-Z]{3,14}[2-9]{2}$/.test(palabra)) {
            throw new HttpsError('invalid-argument', 'La palabra debe ser de 3 a 14 letras seguidas de 2 dígitos del 2 al 9 (ej. CHAMO27; sin 0 ni 1, que se confunden con O e I), o para un día especial solo letras: de 4 a 15, sin dígitos ni espacios (ej. MARIOJOSE).');
        }
        const base = especial ? palabra : palabra.replace(/\d+$/, '');
        const conocida = especial ? null : PALABRAS.find((p) => p.palabra === base);
        const significado = String(raw.significado || '').trim().slice(0, 60) || conocida?.significado || '';
        if (!significado && !especial) throw new HttpsError('invalid-argument', 'Escribe el significado de la palabra.');
        Object.assign(patch, { palabra, palabraBase: base, significado, especial });
    }
    if (raw.cupos !== undefined) {
        const cupos = Math.round(Number(raw.cupos));
        if (!Number.isFinite(cupos) || cupos < 1 || cupos > 500) throw new HttpsError('invalid-argument', 'Cupos entre 1 y 500.');
        patch.cupos = cupos;
    }

    const ref = db.collection(DIAS_COLLECTION).doc(fecha);
    await db.runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        const actual = snap.exists ? snap.data() : null;
        if (actual && Number(actual.canjes || 0) > 0 && patch.productoId && patch.productoId !== actual.productoId) {
            throw new HttpsError('failed-precondition', 'Ese día ya tiene canjes: no se puede cambiar el producto.');
        }
        if (actual && patch.cupos !== undefined && patch.cupos < Number(actual.canjes || 0)) {
            throw new HttpsError('failed-precondition', `Ya hay ${actual.canjes} canjes: los cupos no pueden ser menos.`);
        }
        if (!actual) {
            if (!patch.productoId || !patch.palabra) throw new HttpsError('invalid-argument', 'Para crear el día elige producto y palabra.');
            tx.set(ref, { fecha, cupos: config.cuposPorDia, canjes: 0, agotadoAt: null, createdAt: Timestamp.fromMillis(nowMs), ...patch });
            return;
        }
        const cupos = patch.cupos !== undefined ? patch.cupos : Number(actual.cupos || 0);
        patch.agotadoAt = Number(actual.canjes || 0) >= cupos ? (actual.agotadoAt || Timestamp.fromMillis(nowMs)) : null;
        tx.update(ref, patch);
    });
    if (fecha === hoy) await actualizarPublicoHoy(db, nowMs);
    const snap = await ref.get();
    return { ok: true, dia: snap.data() };
}

function sugerirPalabra(rng = Math.random, excluir = []) {
    return generarPalabra(new Set((excluir || []).map((p) => String(p || '').toUpperCase())), rng);
}

module.exports = {
    CONFIG_COLLECTION,
    CONFIG_DOC,
    DIAS_COLLECTION,
    CANJES_COLLECTION,
    PUBLICO_COLLECTION,
    PUBLICO_DOC,
    COUPON_ID,
    DEFAULT_CONFIG,
    MOTIVOS,
    DIAS_A_PROGRAMAR,
    NO_REPETIR_PRODUCTO_DIAS,
    NO_REPETIR_PALABRA_DIAS,
    normalizarCodigo,
    limpiarPalabra,
    palabraVigente,
    bogotaParts,
    dateKeyToMs,
    addDays,
    dowDe,
    precioConDescuento,
    sanitizeConfig,
    leerConfig,
    esCategoriaElegible,
    diaSaltado,
    elegirProducto,
    generarPalabra,
    programarProximosDias,
    actualizarPublicoHoy,
    vistaPublica,
    evaluarCodigo,
    validarCodigoDia,
    consumirCodigoDia,
    revertirCanjeCodigoDia,
    adjuntarPedidoACanje,
    extraerLineaCodigoDia,
    prevalidarLineaWeb,
    guardarConfig,
    editarDia,
    sugerirPalabra,
    toMs,
    mensajeDe,
    horaAMinutos,
    leerCierresProgramados
};
