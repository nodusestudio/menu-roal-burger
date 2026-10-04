'use strict';

// ─────────────────────────────────────────────────────────────
// FUERA DEL MENÚ (antes "Cupón Pana") — cupones semanales exclusivos para seguidores de Instagram.
// Los identificadores internos (cuponPana*, cupones_pana, …) conservan el nombre viejo a
// propósito: renombrarlos obligaría a migrar colecciones y funciones ya desplegadas sin ningún
// beneficio para el cliente, que nunca los ve. Solo cambia el texto visible.
//
// Mecánica: post en Instagram → el usuario comenta la palabra clave → InstantDM (externo) le
// manda por DM el link roalburger.com/cupon?k=<campanaId> → en esa landing (cupon.html) deja sus
// datos y recibe un código ÚNICO de 6 caracteres que canjea en el POS de FODEXA (o al pedir por
// WhatsApp, donde el cajero lo valida en el mismo POS).
//
// Toda la lógica de dinero/cupos/estados vive acá, en el servidor, con transacciones de
// Firestore -- el navegador nunca escribe estas colecciones (firestore.rules: write false). Las
// funciones de este módulo reciben `db` y `nowMs` por parámetro (en vez de leerlos solos) para
// poder probarlas contra el emulador con un reloj controlado (ej. "hoy es miércoles en Bogotá").
// Los wrappers onCall/onSchedule/onDocumentWritten viven en index.js, igual que el resto.
// ─────────────────────────────────────────────────────────────

const crypto = require('crypto');
const { FieldValue, Timestamp } = require('firebase-admin/firestore');
const { HttpsError } = require('firebase-functions/v2/https');
const { normalizeColombianPhoneDigits, isValidColombianMobile } = require('./phoneUtils');

const CUPONES_CAMPANAS_COLLECTION         = 'cupones_campanas';
const CUPONES_CAMPANAS_PUBLICO_COLLECTION = 'cupones_campanas_publico';
const CUPONES_PANA_COLLECTION             = 'cupones_pana';
const CUPONES_PANA_INDEX_COLLECTION       = 'cupones_pana_index';
const CODIGOS_CUPON_COLLECTION            = 'codigos_cupon'; // cupones de la app (otro sistema)
const PRODUCTS_COLLECTION                 = 'productos';
const COMBOS_ESPECIALES_COLLECTION        = 'combos_especiales';
const ADMINS_COLLECTION                   = 'admins';
const MESEROS_COLLECTION                  = 'meseros';
// Mismo almacén de contadores que el agente (orchestrator.js: checkRateLimit) -- ya está
// cerrado al cliente en firestore.rules, así que no hace falta una colección ni regla nueva.
const RATE_LIMITS_COLLECTION              = 'agent_rate_limits';

// 6 caracteres para reutilizar el input del POS (maxlength 6). Sin O/0/I/1: se confunden al
// dictarlo por teléfono o al leerlo de una captura borrosa, y el cajero lo teclea a mano.
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;
const CODE_REGEX = /^[A-HJ-NP-Z2-9]{6}$/;
const CODE_GENERATION_ATTEMPTS = 6;

// Ventana corta y techo bajo: una persona real reclama UN cupón (y quizá reintenta un par de
// veces si se equivocó en un dato). El de IP es más alto porque un wifi compartido (o el NAT de
// un operador móvil) junta a muchas personas reales detrás de la misma dirección.
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_PER_PHONE = 6;
const RATE_LIMIT_MAX_PER_IP = 30;

// Colombia no tiene horario de verano desde 1993: UTC-5 fijo todo el año. Un offset fijo es más
// predecible (y testeable) que depender de los datos de zona horaria del runtime.
const BOGOTA_OFFSET_MS = -5 * 60 * 60 * 1000;

const CONSENTIMIENTO_DATOS_VERSION = 'v1';
const DIAS_SEMANA = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

const ESTADOS = Object.freeze({
    EMITIDO: 'emitido',
    ACTIVO: 'activo',
    CANJEADO: 'canjeado',
    VENCIDO: 'vencido'
});

// Motivos de "no canjeable" -- el POS los muestra tal cual (texto) y la UI usa la clave.
const MOTIVOS = Object.freeze({
    no_existe: 'Código no encontrado',
    sin_activar: 'El cliente aún no activó el cupón por WhatsApp',
    canjeado: 'Este cupón ya fue canjeado',
    vencido: 'Cupón vencido',
    dia_no_valido: 'Hoy no es un día válido para este cupón',
    campana_inactiva: 'La campaña de este cupón está inactiva',
    antes_de_inicio: 'La campaña aún no ha empezado'
});

// ── Fechas en Bogotá ─────────────────────────────────────────────────────────

function bogotaParts(ms) {
    const d = new Date(Number(ms) + BOGOTA_OFFSET_MS);
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth() + 1;
    const day = d.getUTCDate();
    return {
        y, m, d: day,
        dow: d.getUTCDay(), // 0=domingo … 6=sábado
        hour: d.getUTCHours(),
        dateKey: `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    };
}

// 'YYYY-MM-DD' (fecha de calendario en Bogotá) → ms del inicio o del final de ese día en Bogotá.
// fechaInicio se guarda como 00:00:00.000 y fechaFin como 23:59:59.999: así "válido hasta el
// domingo" incluye todo el domingo, sin que el admin tenga que pensar en horas.
function bogotaDateKeyToMs(dateKey, endOfDay = false) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateKey || ''));
    if (!m) return null;
    const utcMidnight = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    if (!Number.isFinite(utcMidnight)) return null;
    const startMs = utcMidnight - BOGOTA_OFFSET_MS;
    return endOfDay ? startMs + 24 * 60 * 60 * 1000 - 1 : startMs;
}

function toMs(value) {
    if (!value) return null;
    if (typeof value.toMillis === 'function') return value.toMillis();
    if (value instanceof Date) return value.getTime();
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
}

function formatDiasValidos(dias) {
    // Orden de semana "humano" (lunes primero): "lunes, martes y jueves".
    const names = [1, 2, 3, 4, 5, 6, 0].filter((d) => (dias || []).includes(d)).map((d) => DIAS_SEMANA[d]);
    if (names.length <= 1) return names.join('');
    return `${names.slice(0, -1).join(', ')} y ${names[names.length - 1]}`;
}

// ── Normalización / validación de entradas ──────────────────────────────────

function normalizeCodigo(raw) {
    return String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, CODE_LENGTH);
}

function isValidCodigo(codigo) {
    return CODE_REGEX.test(String(codigo || ''));
}

// Reglas de Instagram para usuarios: 1-30 caracteres, letras/números/punto/guion bajo, sin
// punto al inicio/final ni dos puntos seguidos. Se guarda sin @ y en minúsculas porque IG no
// distingue mayúsculas -- sin esto "@Pana.Roal" y "pana.roal" serían dos "cuentas" distintas
// para el candado de unicidad.
function normalizeIgHandle(raw) {
    return String(raw || '').trim().replace(/^@+/, '').toLowerCase();
}

function isValidIgHandle(handle) {
    const h = String(handle || '');
    return /^[a-z0-9._]{1,30}$/.test(h) && !h.startsWith('.') && !h.endsWith('.') && !h.includes('..');
}

function normalizeNombre(raw) {
    return String(raw || '').replace(/\s+/g, ' ').trim();
}

function isValidCampanaId(id) {
    return /^[A-Za-z0-9_-]{2,40}$/.test(String(id || ''));
}

function generateCodigo() {
    let out = '';
    for (let i = 0; i < CODE_LENGTH; i++) out += CODE_ALPHABET[crypto.randomInt(CODE_ALPHABET.length)];
    return out;
}

function phoneIndexId(campanaId, telefono) {
    return `${campanaId}_${telefono}`;
}

function igIndexId(campanaId, igHandle) {
    return `${campanaId}_ig_${igHandle}`;
}

function waMeLink(numero, texto) {
    const digits = String(numero || '').replace(/\D/g, '');
    return `https://wa.me/${digits}?text=${encodeURIComponent(texto)}`;
}

function buildWaLink(campana, codigo) {
    if (campana.requiereActivacionWA === true) {
        return waMeLink(campana.waNumeroCupones, `Hola ROAL, activo mi cupón ${codigo}`);
    }
    return waMeLink(campana.waNumeroPrincipal, `Hola ROAL 👋 Tengo el cupón ${codigo} (${campana.titulo}) y quiero pedir`);
}

function cuposRestantesDe(campana) {
    return Math.max(0, Number(campana.cuposTotales || 0) - Number(campana.cuposEmitidos || 0));
}

// ── Grupos de opciones ("Extra a elegir", "Salsa", …) ──────────────────────────

const MAX_GRUPOS = 6;
const MAX_OPCIONES_POR_GRUPO = 10;
const GRUPO_LEGACY_ID = 'extra';

function slugId(value, max = 30) {
    return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, max);
}

// Fuente única de los grupos de una campaña. Las campañas creadas antes de los grupos solo
// tienen toppingsOpciones (un "Toque" único): se tratan como UN grupo "Extra" requerido, así la
// campaña TEST y los cupones ya emitidos siguen funcionando sin migrar nada.
function gruposDeCampana(campana) {
    const c = campana || {};
    if (Array.isArray(c.gruposOpciones) && c.gruposOpciones.length) {
        return c.gruposOpciones.map((g) => ({
            id: String(g.id || ''),
            nombre: String(g.nombre || ''),
            opciones: Array.isArray(g.opciones) ? g.opciones.map(String) : [],
            requerido: g.requerido !== false
        })).filter((g) => g.id && g.opciones.length);
    }
    const legacy = Array.isArray(c.toppingsOpciones) ? c.toppingsOpciones.map(String).filter(Boolean) : [];
    return legacy.length ? [{ id: GRUPO_LEGACY_ID, nombre: 'Extra', opciones: legacy, requerido: true }] : [];
}

// Valida lo que eligió el cliente contra los grupos REALES de la campaña (nunca contra lo que
// mande el navegador). Devuelve el mapa limpio y el detalle [{grupoId, grupo, opcion}] en el
// orden de los grupos. toppingLegacy: el campo "topping" del formato viejo, que va al primer grupo.
function resolverSelecciones(grupos, selecciones, toppingLegacy = '') {
    const elegidas = { ...(selecciones || {}) };
    if (toppingLegacy && grupos.length && !elegidas[grupos[0].id]) elegidas[grupos[0].id] = toppingLegacy;
    const mapa = {};
    const detalle = [];
    for (const g of grupos) {
        const opcion = String(elegidas[g.id] || '').trim();
        if (!opcion) {
            if (g.requerido) throw new HttpsError('invalid-argument', `Elige una opción en "${g.nombre}".`);
            continue;
        }
        if (!g.opciones.includes(opcion)) {
            throw new HttpsError('invalid-argument', `La opción "${opcion}" no está disponible en "${g.nombre}".`);
        }
        mapa[g.id] = opcion;
        detalle.push({ grupoId: g.id, grupo: g.nombre, opcion });
    }
    return { mapa, detalle };
}

// Para mostrar (POS, ticket, panel, WhatsApp): la foto que se guardó al emitir; un cupón viejo
// solo tiene "topping" y se muestra como el grupo "Extra".
function describirSelecciones(cupon) {
    if (Array.isArray(cupon?.seleccionesDetalle) && cupon.seleccionesDetalle.length) {
        return cupon.seleccionesDetalle.map((d) => ({ grupo: String(d.grupo || d.grupoId || ''), opcion: String(d.opcion || '') }));
    }
    return cupon?.topping ? [{ grupo: 'Extra', opcion: String(cupon.topping) }] : [];
}

// ── Rate limit (mismo patrón que orchestrator.js: checkRateLimit) ──────────────

async function checkRateLimit(db, key, maxHits, nowMs = Date.now()) {
    const ref = db.collection(RATE_LIMITS_COLLECTION).doc(key);
    return db.runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        const data = snap.exists ? snap.data() : null;
        if (!data || (nowMs - Number(data.windowStart || 0)) > RATE_LIMIT_WINDOW_MS) {
            tx.set(ref, { windowStart: nowMs, count: 1 });
            return true;
        }
        const nextCount = Number(data.count || 0) + 1;
        tx.set(ref, { windowStart: data.windowStart, count: nextCount }, { merge: true });
        return nextCount <= maxHits;
    });
}

// ── Autorización: admin o mesero con sesión real ─────────────────────────────

// Misma verificación que ya protege el POS en firestore.rules: admin = doc en admins/{uid};
// mesero = custom token de mintMeseroSessionToken (claims mesero/meseroToken) cuyo link
// meseros/{token} sigue existiendo (borrarlo revoca el acceso al instante, igual que en
// isMeseroToken() de las reglas).
async function ensureAdminOrMeseroCaller(db, request) {
    const auth = request.auth;
    if (!auth?.uid) {
        throw new HttpsError('unauthenticated', 'Debes iniciar sesión.');
    }
    if (auth.token?.mesero === true) {
        const meseroToken = String(auth.token.meseroToken || '');
        const snap = meseroToken ? await db.collection(MESEROS_COLLECTION).doc(meseroToken).get() : null;
        if (!snap || !snap.exists) {
            throw new HttpsError('permission-denied', 'Sesión de mesero no válida.');
        }
        return { uid: auth.uid, rol: 'mesero', meseroToken };
    }
    const adminDoc = await db.collection(ADMINS_COLLECTION).doc(auth.uid).get();
    if (!adminDoc.exists) {
        throw new HttpsError('permission-denied', 'No tienes permisos de administrador.');
    }
    return { uid: auth.uid, rol: 'admin' };
}

async function ensureAdmin(db, request) {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError('unauthenticated', 'Debes iniciar sesión.');
    // Rechazo explícito de la sesión de mesero, sin depender de que su uid (mesero_<token>)
    // nunca llegue a existir en admins/: lo que se protege aquí (campañas, reversas de canje) es
    // solo para administradores.
    if (request.auth.token?.mesero === true) throw new HttpsError('permission-denied', 'Solo un administrador puede hacer esto.');
    const adminDoc = await db.collection(ADMINS_COLLECTION).doc(uid).get();
    if (!adminDoc.exists) throw new HttpsError('permission-denied', 'No tienes permisos de administrador.');
    return uid;
}

// ── Vista pública de la campaña ──────────────────────────────────────────────

// Solo lo que la landing necesita mostrar -- nunca waNumeroCupones/cuposEmitidos crudos ni nada
// que no sea para el público (la landing lee esto con un get anónimo).
function buildCampanaPublica(c) {
    return {
        titulo: String(c.titulo || ''),
        descripcion: String(c.descripcion || ''),
        imagenUrl: String(c.imagenUrl || ''),
        precio: Number(c.precio || 0),
        composicion: (c.composicion || []).map((p) => ({ nombre: String(p.nombre || ''), cantidad: Number(p.cantidad || 1) })),
        gruposOpciones: gruposDeCampana(c),
        notaCocina: String(c.notaCocina || ''),
        extrasLocal: (c.extrasLocal || []).map((e) => ({ id: String(e.id || ''), nombre: String(e.nombre || ''), precio: Number(e.precio || 0) })),
        diasValidos: Array.isArray(c.diasValidos) ? c.diasValidos.map(Number) : [],
        fechaInicio: c.fechaInicio || null,
        fechaFin: c.fechaFin || null,
        cuposRestantes: cuposRestantesDe(c),
        activa: c.activa === true,
        requiereActivacionWA: c.requiereActivacionWA === true
    };
}

// Relee la campaña FRESCA en vez de usar el snapshot del evento: los triggers pueden llegar
// desordenados, y un evento viejo (cuposEmitidos=3) que se procese después de una emisión más
// nueva (cuposEmitidos=4) pisaría cuposRestantes con un número que ya no es real.
async function syncCampanaPublica(db, campanaId) {
    const ref = db.collection(CUPONES_CAMPANAS_COLLECTION).doc(campanaId);
    const pubRef = db.collection(CUPONES_CAMPANAS_PUBLICO_COLLECTION).doc(campanaId);
    const snap = await ref.get();
    if (!snap.exists) {
        await pubRef.delete().catch(() => {});
        return null;
    }
    const pub = buildCampanaPublica(snap.data());
    await pubRef.set({ ...pub, actualizadaAt: FieldValue.serverTimestamp() });
    return pub;
}

// ── Emisión ─────────────────────────────────────────────────────────────────

function validateEmitInput(raw) {
    const data = raw || {};
    const campanaId = String(data.campanaId || '').trim();
    const nombre = normalizeNombre(data.nombre);
    const telefono = normalizeColombianPhoneDigits(data.telefono);
    const igHandle = normalizeIgHandle(data.igHandle);
    // Formato nuevo: selecciones { grupoId: opcion }. "topping" queda solo para un cliente con el
    // cupon.js viejo en caché (se asigna al primer grupo). Se validan contra la campaña en la
    // transacción, que es donde están los grupos reales.
    const selecciones = {};
    if (data.selecciones && typeof data.selecciones === 'object' && !Array.isArray(data.selecciones)) {
        Object.entries(data.selecciones).slice(0, MAX_GRUPOS + 4).forEach(([k, v]) => {
            const key = String(k).slice(0, 30);
            const val = String(v ?? '').trim().slice(0, 60);
            if (key && val) selecciones[key] = val;
        });
    }
    const topping = String(data.topping || '').trim().slice(0, 60);
    const fuente = String(data.fuente || '').trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '').slice(0, 40) || 'instagram';

    if (!isValidCampanaId(campanaId)) throw new HttpsError('invalid-argument', 'Campaña inválida.');
    if (nombre.length < 2 || nombre.length > 40) throw new HttpsError('invalid-argument', 'Escribe tu nombre (2 a 40 caracteres).');
    if (!isValidColombianMobile(telefono)) throw new HttpsError('invalid-argument', 'Escribe un celular colombiano válido (10 dígitos, empieza en 3).');
    if (!isValidIgHandle(igHandle)) throw new HttpsError('invalid-argument', 'Escribe tu usuario de Instagram válido (ej. @tu.usuario).');
    // Habeas data (Ley 1581 de 2012): sin autorización expresa no se guarda ningún dato.
    if (data.aceptaDatos !== true) throw new HttpsError('invalid-argument', 'Debes autorizar el tratamiento de tus datos para recibir el cupón.');

    return {
        campanaId, nombre, telefono, igHandle, topping, selecciones, fuente,
        aceptaMarketing: data.aceptaMarketing === true
    };
}

function buildEmitResponse(campana, cupon, yaExistia) {
    return {
        codigo: cupon.codigo,
        estado: cupon.estado,
        nombre: cupon.nombre,
        topping: cupon.topping,
        selecciones: describirSelecciones(cupon),
        yaExistia: yaExistia === true,
        campana: {
            titulo: String(campana.titulo || ''),
            precio: Number(campana.precio || 0),
            notaCocina: String(campana.notaCocina || ''),
            diasValidos: Array.isArray(campana.diasValidos) ? campana.diasValidos : [],
            fechaInicio: toMs(campana.fechaInicio),
            fechaFin: toMs(campana.fechaFin),
            requiereActivacionWA: campana.requiereActivacionWA === true
        },
        waLink: buildWaLink(campana, cupon.codigo)
    };
}

// input ya validado por validateEmitInput. Todo pasa en UNA transacción: los dos candados de
// unicidad (teléfono e Instagram), el contador de cupos y el cupón -- si dos personas reclaman el
// último cupo al mismo tiempo, Firestore reintenta la transacción perdedora, que ve el cupo ya
// tomado y falla con "agotado" en vez de sobrevender.
async function emitirCuponPanaTransaction(db, input, nowMs = Date.now()) {
    const { campanaId, telefono, igHandle } = input;
    const campRef = db.collection(CUPONES_CAMPANAS_COLLECTION).doc(campanaId);
    const pubRef = db.collection(CUPONES_CAMPANAS_PUBLICO_COLLECTION).doc(campanaId);
    const phoneIdxRef = db.collection(CUPONES_PANA_INDEX_COLLECTION).doc(phoneIndexId(campanaId, telefono));
    const igIdxRef = db.collection(CUPONES_PANA_INDEX_COLLECTION).doc(igIndexId(campanaId, igHandle));

    return db.runTransaction(async (tx) => {
        const [campSnap, phoneIdxSnap, igIdxSnap] = await Promise.all([
            tx.get(campRef), tx.get(phoneIdxRef), tx.get(igIdxRef)
        ]);
        if (!campSnap.exists) throw new HttpsError('not-found', 'Esta campaña no existe.');
        const campana = campSnap.data();

        // Mismo teléfono que vuelve (recargó la página, perdió la captura): se le devuelve SU
        // cupón, no un error. Pero solo si también trae la misma cuenta de Instagram -- si no,
        // bastaría con escribir el celular de otra persona para ver (y canjear) su código.
        if (phoneIdxSnap.exists) {
            const idx = phoneIdxSnap.data();
            if (idx.igHandle && idx.igHandle !== igHandle) {
                throw new HttpsError('already-exists', 'Este celular ya reclamó su cupón con otra cuenta de Instagram.');
            }
            const cuponSnap = await tx.get(db.collection(CUPONES_PANA_COLLECTION).doc(idx.codigo));
            if (cuponSnap.exists) return buildEmitResponse(campana, cuponSnap.data(), true);
        }
        if (igIdxSnap.exists) {
            throw new HttpsError('already-exists', 'Esta cuenta ya reclamó su cupón.');
        }

        if (campana.activa !== true) throw new HttpsError('failed-precondition', 'Esta campaña no está activa.');
        const finMs = toMs(campana.fechaFin);
        if (finMs !== null && nowMs > finMs) throw new HttpsError('failed-precondition', 'Esta campaña ya terminó.');
        const { mapa: selecciones, detalle: seleccionesDetalle } = resolverSelecciones(gruposDeCampana(campana), input.selecciones, input.topping);
        if (cuposRestantesDe(campana) <= 0) throw new HttpsError('resource-exhausted', 'Se acabaron los cupones de esta semana.');

        // El código no puede chocar con uno de cupones_pana NI con uno de codigos_cupon: el POS
        // busca primero en codigos_cupon, así que un choque haría que el cajero canjeara el
        // cupón equivocado.
        let codigo = null;
        for (let i = 0; i < CODE_GENERATION_ATTEMPTS && !codigo; i++) {
            const candidate = generateCodigo();
            const [a, b] = await Promise.all([
                tx.get(db.collection(CUPONES_PANA_COLLECTION).doc(candidate)),
                tx.get(db.collection(CODIGOS_CUPON_COLLECTION).doc(candidate))
            ]);
            if (!a.exists && !b.exists) codigo = candidate;
        }
        if (!codigo) throw new HttpsError('aborted', 'No se pudo generar el código. Intenta de nuevo.');

        const estado = campana.requiereActivacionWA === true ? ESTADOS.EMITIDO : ESTADOS.ACTIVO;
        const now = Timestamp.fromMillis(nowMs);
        const cupon = {
            codigo,
            campanaId,
            nombre: input.nombre,
            telefono,
            igHandle,
            selecciones,
            // Foto con los NOMBRES de los grupos al momento de emitir: si el admin renombra o
            // borra un grupo después, el cupón y el ticket siguen diciendo lo que el cliente eligió.
            seleccionesDetalle,
            topping: seleccionesDetalle.map((d) => d.opcion).join(' · '), // compatibilidad
            estado,
            consentimientoDatos: { aceptado: true, version: CONSENTIMIENTO_DATOS_VERSION, at: now },
            consentimientoMarketing: input.aceptaMarketing === true,
            emitidoAt: now,
            activadoAt: estado === ESTADOS.ACTIVO ? now : null,
            canjeadoAt: null,
            canjeadoPor: null,
            pedidoRef: null,
            waUltimoMensajeEntranteAt: null,
            recordatorioEnviadoAt: null,
            fuente: input.fuente || 'instagram'
        };
        const cuposEmitidos = Number(campana.cuposEmitidos || 0) + 1;

        tx.create(phoneIdxRef, { campanaId, codigo, telefono, igHandle, tipo: 'telefono', creadoAt: now });
        tx.create(igIdxRef, { campanaId, codigo, telefono, igHandle, tipo: 'ig', creadoAt: now });
        const campUpdate = { cuposEmitidos };
        // Momento exacto en que se agotó: alimenta el semáforo de temporadas del panel ("¿se agotó
        // antes del jueves?"). Solo la primera vez -- si luego suben los cupos, sigue valiendo.
        if (cuposEmitidos >= Number(campana.cuposTotales || 0) && !campana.agotadaAt) campUpdate.agotadaAt = now;
        tx.update(campRef, campUpdate);
        tx.set(pubRef, { cuposRestantes: Math.max(0, Number(campana.cuposTotales || 0) - cuposEmitidos) }, { merge: true });
        tx.create(db.collection(CUPONES_PANA_COLLECTION).doc(codigo), cupon);

        return buildEmitResponse({ ...campana, cuposEmitidos }, cupon, false);
    });
}

// ── Validación / canje en el POS ─────────────────────────────────────────────

// Fuente única de "¿se puede canjear HOY?" -- la usan validar (solo lectura) y canjear (dentro
// de la transacción), para que el POS nunca muestre "✅" y luego el canje lo rechace por una
// regla distinta.
function evaluarCanjeable(cupon, campana, nowMs) {
    if (!cupon) return 'no_existe';
    if (cupon.estado === ESTADOS.CANJEADO) return 'canjeado';
    if (cupon.estado === ESTADOS.VENCIDO) return 'vencido';
    if (!campana) return 'campana_inactiva';
    const finMs = toMs(campana.fechaFin);
    if (finMs !== null && nowMs > finMs) return 'vencido';
    if (campana.activa !== true) return 'campana_inactiva';
    const inicioMs = toMs(campana.fechaInicio);
    if (inicioMs !== null && nowMs < inicioMs) return 'antes_de_inicio';
    // "emitido" solo bloquea si la campaña HOY exige activación por WhatsApp: si el admin la
    // pasa de vuelta a fase manual, los emitidos pendientes no deben quedar atrapados.
    if (cupon.estado === ESTADOS.EMITIDO && campana.requiereActivacionWA === true) return 'sin_activar';
    const dias = Array.isArray(campana.diasValidos) ? campana.diasValidos.map(Number) : [];
    if (!dias.includes(bogotaParts(nowMs).dow)) return 'dia_no_valido';
    return null;
}

function buildCuponPosView(cupon, campana) {
    return {
        codigo: cupon.codigo,
        nombre: cupon.nombre || '',
        igHandle: cupon.igHandle || '',
        topping: cupon.topping || '',
        selecciones: describirSelecciones(cupon),
        notaCocina: String(campana?.notaCocina || ''),
        estado: cupon.estado,
        campanaId: cupon.campanaId,
        titulo: String(campana?.titulo || ''),
        precio: Number(campana?.precio || 0),
        composicion: (campana?.composicion || []).map((p) => ({
            productoId: String(p.productoId || ''), nombre: String(p.nombre || ''), cantidad: Number(p.cantidad || 1)
        })),
        extrasLocal: (campana?.extrasLocal || []).map((e) => ({ id: String(e.id), nombre: String(e.nombre), precio: Number(e.precio || 0) })),
        diasValidos: campana?.diasValidos || [],
        diasValidosTexto: formatDiasValidos(campana?.diasValidos || []),
        canjeadoAt: toMs(cupon.canjeadoAt)
    };
}

async function validarCuponPana(db, codigoRaw, nowMs = Date.now()) {
    const codigo = normalizeCodigo(codigoRaw);
    if (!isValidCodigo(codigo)) {
        return { canjeable: false, motivo: 'no_existe', motivoTexto: MOTIVOS.no_existe, cupon: null };
    }
    const cuponSnap = await db.collection(CUPONES_PANA_COLLECTION).doc(codigo).get();
    if (!cuponSnap.exists) {
        return { canjeable: false, motivo: 'no_existe', motivoTexto: MOTIVOS.no_existe, cupon: null };
    }
    const cupon = cuponSnap.data();
    const campSnap = await db.collection(CUPONES_CAMPANAS_COLLECTION).doc(cupon.campanaId).get();
    const campana = campSnap.exists ? campSnap.data() : null;
    const motivo = evaluarCanjeable(cupon, campana, nowMs);
    return {
        canjeable: !motivo,
        motivo: motivo || null,
        motivoTexto: motivo ? MOTIVOS[motivo] : null,
        cupon: buildCuponPosView(cupon, campana)
    };
}

// Re-valida TODO dentro de la transacción (el estado pudo cambiar entre "Validar" y "Agregar al
// ticket", o dos cajas pueden estar canjeando el mismo código a la vez: solo una gana). Devuelve
// el couponMeta con el precio del SERVIDOR -- el POS no recalcula nada, solo lo pinta.
async function canjearCuponPanaTransaction(db, codigoRaw, { uid, extrasIds = [] } = {}, nowMs = Date.now()) {
    const codigo = normalizeCodigo(codigoRaw);
    if (!isValidCodigo(codigo)) throw new HttpsError('not-found', MOTIVOS.no_existe);
    const cuponRef = db.collection(CUPONES_PANA_COLLECTION).doc(codigo);
    const wantedExtras = Array.isArray(extrasIds) ? extrasIds.map(String).slice(0, 10) : [];

    return db.runTransaction(async (tx) => {
        const cuponSnap = await tx.get(cuponRef);
        if (!cuponSnap.exists) throw new HttpsError('not-found', MOTIVOS.no_existe);
        const cupon = cuponSnap.data();
        const campSnap = await tx.get(db.collection(CUPONES_CAMPANAS_COLLECTION).doc(cupon.campanaId));
        const campana = campSnap.exists ? campSnap.data() : null;

        const motivo = evaluarCanjeable(cupon, campana, nowMs);
        if (motivo) throw new HttpsError('failed-precondition', MOTIVOS[motivo], { motivo });

        const extrasDisponibles = (campana.extrasLocal || []).map((e) => ({
            id: String(e.id), nombre: String(e.nombre), precio: Number(e.precio || 0)
        }));
        const extras = extrasDisponibles.filter((e) => wantedExtras.includes(e.id));

        tx.update(cuponRef, {
            estado: ESTADOS.CANJEADO,
            canjeadoAt: Timestamp.fromMillis(nowMs),
            canjeadoPor: String(uid || ''),
            extrasElegidos: extras.map((e) => e.id),
            // Bitácora del cupón: cada canje y cada reversa quedan registrados, con quién y cuándo.
            // Timestamp concreto (no serverTimestamp): Firestore no admite serverTimestamp dentro
            // de un arreglo.
            historial: FieldValue.arrayUnion({ accion: 'canje', uid: String(uid || ''), at: Timestamp.fromMillis(nowMs) })
        });

        const view = buildCuponPosView(cupon, campana);
        return {
            couponMeta: {
                type: 'pana',
                codigo,
                campanaId: cupon.campanaId,
                titulo: view.titulo,
                precio: view.precio,
                composicion: view.composicion,
                topping: view.topping,
                selecciones: view.selecciones,
                notaCocina: view.notaCocina,
                nombre: view.nombre,
                igHandle: view.igHandle,
                extras,
                extrasDisponibles
            }
        };
    });
}

// ── Reversa de canje (solo admin) ────────────────────────────────────────────

const REVERSA_MOTIVO_MIN = 5;
const REVERSA_MOTIVO_MAX = 120;

// canjearCuponPana marca el cupón ANTES de que se guarde el pedido; si el cajero cancela el
// ticket o se equivocó de código, el cupón quedaba quemado sin salida. Esta reversa lo devuelve a
// "activo" con una auditoría completa en historial[]. Límites a propósito estrechos:
//   - solo el MISMO día (Bogotá) del canje: corregir un error de caja, no reabrir cupones viejos;
//   - campaña no vencida: un cupón reactivado fuera de fechas no se podría usar de todas formas;
//   - los cupos NO se tocan: la emisión ya contó este cupón, la reversa no crea uno nuevo.
async function revertirCanjeCuponPanaTransaction(db, codigoRaw, { uid, motivo } = {}, nowMs = Date.now()) {
    const codigo = normalizeCodigo(codigoRaw);
    const motivoLimpio = String(motivo || '').replace(/\s+/g, ' ').trim();
    if (motivoLimpio.length < REVERSA_MOTIVO_MIN || motivoLimpio.length > REVERSA_MOTIVO_MAX) {
        throw new HttpsError('invalid-argument', `Escribe el motivo de la reversa (${REVERSA_MOTIVO_MIN} a ${REVERSA_MOTIVO_MAX} caracteres).`);
    }
    if (!isValidCodigo(codigo)) throw new HttpsError('not-found', MOTIVOS.no_existe);
    const cuponRef = db.collection(CUPONES_PANA_COLLECTION).doc(codigo);

    return db.runTransaction(async (tx) => {
        const cuponSnap = await tx.get(cuponRef);
        if (!cuponSnap.exists) throw new HttpsError('not-found', MOTIVOS.no_existe);
        const cupon = cuponSnap.data();
        const campSnap = await tx.get(db.collection(CUPONES_CAMPANAS_COLLECTION).doc(cupon.campanaId));
        const campana = campSnap.exists ? campSnap.data() : null;

        // Con dos admins revirtiendo a la vez, el perdedor reintenta, ve "activo" y cae aquí.
        if (cupon.estado !== ESTADOS.CANJEADO) {
            throw new HttpsError('failed-precondition', 'Este cupón no está canjeado: no hay canje que revertir.');
        }
        const canjeMs = toMs(cupon.canjeadoAt);
        if (canjeMs === null || bogotaParts(canjeMs).dateKey !== bogotaParts(nowMs).dateKey) {
            throw new HttpsError('failed-precondition', 'Solo se puede revertir un canje hecho hoy.');
        }
        const finMs = toMs(campana?.fechaFin);
        if (!campana || (finMs !== null && nowMs > finMs)) {
            throw new HttpsError('failed-precondition', 'La campaña de este cupón ya venció: no se puede revertir.');
        }

        const at = Timestamp.fromMillis(nowMs);
        tx.update(cuponRef, {
            estado: ESTADOS.ACTIVO,
            canjeadoAt: null,
            canjeadoPor: null,
            historial: FieldValue.arrayUnion({
                accion: 'revertir_canje',
                uid: String(uid || ''),
                motivo: motivoLimpio,
                at,
                canjeadoPorAnterior: String(cupon.canjeadoPor || '')
            })
        });
        return { ok: true, codigo, estado: ESTADOS.ACTIVO };
    });
}

// ── Gestión de campañas desde FODEXA ─────────────────────────────────────────

function cleanText(value, max) {
    return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function toPositiveInt(value) {
    const n = Number(value);
    return Number.isInteger(n) && n > 0 ? n : null;
}

// Valida y normaliza TODO lo que manda el panel -- el panel no escribe cupones_campanas directo
// (regla de "nada financiero escrito desde el cliente"), así que este es el único filtro.
async function validateCampanaPayload(db, raw) {
    const c = raw || {};
    const titulo = cleanText(c.titulo, 60);
    if (titulo.length < 2) throw new HttpsError('invalid-argument', 'El título es obligatorio.');
    // La palabra clave es la que se publica en el post y se configura en InstantDM: una campaña
    // sin ella no tiene cómo recibir tráfico (y una copia recién duplicada la trae vacía a propósito).
    const palabraClave = cleanText(c.palabraClave, 40);
    if (!palabraClave) throw new HttpsError('invalid-argument', 'La palabra clave es obligatoria.');

    const precio = toPositiveInt(c.precio);
    if (!precio || precio > 1000000) throw new HttpsError('invalid-argument', 'Precio inválido (entero en COP, mayor a 0).');

    const cuposTotales = toPositiveInt(c.cuposTotales);
    if (!cuposTotales || cuposTotales > 100000) throw new HttpsError('invalid-argument', 'Cupos totales inválidos.');

    const composicionRaw = Array.isArray(c.composicion) ? c.composicion : [];
    if (!composicionRaw.length || composicionRaw.length > 10) throw new HttpsError('invalid-argument', 'La composición debe tener entre 1 y 10 productos.');
    // Cada productoId debe existir de verdad (productos o combos especiales) y el nombre se toma
    // del catálogo, no del navegador -- es lo que se imprime en el ticket de cocina.
    const composicion = [];
    for (const item of composicionRaw) {
        const productoId = String(item?.productoId || '').trim();
        const cantidad = toPositiveInt(item?.cantidad);
        if (!productoId || productoId.includes('/') || !cantidad || cantidad > 20) {
            throw new HttpsError('invalid-argument', 'Producto de la composición inválido.');
        }
        let snap = await db.collection(PRODUCTS_COLLECTION).doc(productoId).get();
        if (!snap.exists) snap = await db.collection(COMBOS_ESPECIALES_COLLECTION).doc(productoId).get();
        if (!snap.exists) throw new HttpsError('invalid-argument', `El producto ${productoId} no existe en el catálogo.`);
        const d = snap.data() || {};
        composicion.push({ productoId, nombre: cleanText(d.nombre || d.titulo || item.nombre, 80), cantidad });
    }

    // Panel nuevo manda gruposOpciones; uno viejo (o un payload a mano) puede mandar solo
    // toppingsOpciones: se convierte al grupo "Extra" para no perder nada.
    const gruposRaw = Array.isArray(c.gruposOpciones) && c.gruposOpciones.length
        ? c.gruposOpciones
        : (Array.isArray(c.toppingsOpciones) && c.toppingsOpciones.length
            ? [{ id: GRUPO_LEGACY_ID, nombre: 'Extra', opciones: c.toppingsOpciones, requerido: true }]
            : []);
    if (!gruposRaw.length) throw new HttpsError('invalid-argument', 'Agrega al menos un grupo de opciones.');
    if (gruposRaw.length > MAX_GRUPOS) throw new HttpsError('invalid-argument', `Máximo ${MAX_GRUPOS} grupos de opciones.`);
    const gruposOpciones = [];
    for (const g of gruposRaw) {
        const nombreGrupo = cleanText(g?.nombre, 30);
        const id = slugId(g?.id || nombreGrupo);
        const opciones = [...new Set((Array.isArray(g?.opciones) ? g.opciones : []).map((o) => cleanText(o, 30)).filter(Boolean))];
        if (!nombreGrupo || !id) throw new HttpsError('invalid-argument', 'Cada grupo de opciones necesita un nombre.');
        if (!opciones.length || opciones.length > MAX_OPCIONES_POR_GRUPO) {
            throw new HttpsError('invalid-argument', `El grupo "${nombreGrupo}" debe tener entre 1 y ${MAX_OPCIONES_POR_GRUPO} opciones.`);
        }
        if (gruposOpciones.some((x) => x.id === id)) throw new HttpsError('invalid-argument', `Grupo repetido: "${nombreGrupo}".`);
        gruposOpciones.push({ id, nombre: nombreGrupo, opciones, requerido: g?.requerido !== false });
    }

    const extrasLocal = [];
    for (const e of (Array.isArray(c.extrasLocal) ? c.extrasLocal : []).slice(0, 5)) {
        const id = String(e?.id || '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 30);
        const nombre = cleanText(e?.nombre, 60);
        const precioExtra = Number(e?.precio);
        if (!id || !nombre || !Number.isInteger(precioExtra) || precioExtra < 0 || precioExtra > 1000000) {
            throw new HttpsError('invalid-argument', 'Extra del local inválido (id, nombre y precio entero).');
        }
        if (extrasLocal.some((x) => x.id === id)) throw new HttpsError('invalid-argument', `Extra repetido: ${id}.`);
        extrasLocal.push({ id, nombre, precio: precioExtra });
    }

    const diasValidos = [...new Set((Array.isArray(c.diasValidos) ? c.diasValidos : []).map(Number))]
        .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6).sort();
    if (!diasValidos.length) throw new HttpsError('invalid-argument', 'Elige al menos un día válido.');

    const inicioMs = bogotaDateKeyToMs(c.fechaInicio, false);
    const finMs = bogotaDateKeyToMs(c.fechaFin, true);
    if (inicioMs === null || finMs === null) throw new HttpsError('invalid-argument', 'Fechas inválidas (AAAA-MM-DD).');
    if (finMs < inicioMs) throw new HttpsError('invalid-argument', 'La fecha final debe ser igual o posterior a la inicial.');

    const waNumeroPrincipal = String(c.waNumeroPrincipal || '').replace(/\D/g, '');
    const waNumeroCupones = String(c.waNumeroCupones || '').replace(/\D/g, '');
    if (!/^573\d{9}$/.test(waNumeroPrincipal)) throw new HttpsError('invalid-argument', 'WhatsApp principal inválido (formato 573XXXXXXXXX).');
    if (waNumeroCupones && !/^57\d{10}$/.test(waNumeroCupones)) throw new HttpsError('invalid-argument', 'WhatsApp de cupones inválido (formato 57XXXXXXXXXX).');
    const requiereActivacionWA = c.requiereActivacionWA === true;
    // Sin número de cupones, el botón "Activar por WhatsApp" de la landing apuntaría a wa.me/
    // vacío y ningún cupón se podría activar nunca.
    if (requiereActivacionWA && !waNumeroCupones) {
        throw new HttpsError('invalid-argument', 'Para exigir activación por WhatsApp primero configura el número de cupones.');
    }

    const imagenUrl = String(c.imagenUrl || '').trim().slice(0, 500);
    if (imagenUrl && !/^https:\/\//i.test(imagenUrl) && !/^[a-z0-9_\-/]+\.(png|jpe?g|webp|avif)$/i.test(imagenUrl)) {
        throw new HttpsError('invalid-argument', 'La imagen debe ser una URL https o una ruta del sitio (ej. promociones/cupon.webp).');
    }

    return {
        titulo,
        palabraClave,
        temporada: cleanText(c.temporada, 40),
        descripcion: cleanText(c.descripcion, 300),
        notaCocina: cleanText(c.notaCocina, 120),
        imagenUrl,
        composicion,
        precio,
        gruposOpciones,
        extrasLocal,
        cuposTotales,
        diasValidos,
        fechaInicio: Timestamp.fromMillis(inicioMs),
        fechaFin: Timestamp.fromMillis(finMs),
        activa: c.activa === true,
        requiereActivacionWA,
        waNumeroPrincipal,
        waNumeroCupones
    };
}

// Un único callable para todo lo que el panel escribe sobre Cupón Pana (crear/editar/eliminar
// campaña y la marca manual de "ya le recordé por WhatsApp"): mantiene la regla de que el
// navegador nunca escribe estas colecciones sin sumar una función desplegada por cada botón.
async function guardarCampanaPana(db, data, adminUid, nowMs = Date.now()) {
    const accion = String(data?.accion || 'guardar');

    if (accion === 'marcar_recordatorio') {
        const codigo = normalizeCodigo(data?.codigo);
        if (!isValidCodigo(codigo)) throw new HttpsError('invalid-argument', 'Código inválido.');
        const ref = db.collection(CUPONES_PANA_COLLECTION).doc(codigo);
        const snap = await ref.get();
        if (!snap.exists) throw new HttpsError('not-found', MOTIVOS.no_existe);
        const marcar = data?.marcado !== false;
        await ref.update({
            recordatorioManualAt: marcar ? Timestamp.fromMillis(nowMs) : null,
            recordatorioManualPor: marcar ? adminUid : null
        });
        return { ok: true, codigo, marcado: marcar };
    }

    const campanaId = String(data?.campanaId || '').trim();
    if (!isValidCampanaId(campanaId)) {
        throw new HttpsError('invalid-argument', 'ID de campaña inválido (2-40 letras, números, - o _).');
    }
    const ref = db.collection(CUPONES_CAMPANAS_COLLECTION).doc(campanaId);

    if (accion === 'eliminar') {
        await db.runTransaction(async (tx) => {
            const snap = await tx.get(ref);
            if (!snap.exists) throw new HttpsError('not-found', 'La campaña no existe.');
            // Con cupones ya emitidos borrarla dejaría códigos en manos de clientes que el POS
            // ya no podría validar: en ese caso se desactiva, no se borra.
            if (Number(snap.data().cuposEmitidos || 0) > 0) {
                throw new HttpsError('failed-precondition', 'Esta campaña ya tiene cupones emitidos: desactívala en vez de eliminarla.');
            }
            tx.delete(ref);
        });
        return { ok: true, campanaId, eliminada: true };
    }

    if (accion === 'duplicar') {
        return duplicarCampana(db, ref, data?.nuevoId, adminUid, nowMs);
    }

    if (accion !== 'guardar') throw new HttpsError('invalid-argument', 'Acción inválida.');
    const campana = await validateCampanaPayload(db, data?.campana);
    const esNueva = data?.esNueva === true;
    const now = Timestamp.fromMillis(nowMs);

    await db.runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        if (esNueva && snap.exists) throw new HttpsError('already-exists', `Ya existe una campaña con el ID "${campanaId}".`);
        if (!esNueva && !snap.exists) throw new HttpsError('not-found', 'La campaña no existe.');
        const prev = snap.exists ? snap.data() : {};
        const cuposEmitidos = Number(prev.cuposEmitidos || 0);
        if (campana.cuposTotales < cuposEmitidos) {
            throw new HttpsError('invalid-argument', `Ya se emitieron ${cuposEmitidos} cupones: los cupos totales no pueden ser menos.`);
        }
        tx.set(ref, {
            ...campana,
            slug: campanaId,
            cuposEmitidos, // nunca desde el panel: solo la transacción de emisión lo mueve
            agotadaAt: prev.agotadaAt || null, // lo pone la emisión; el panel no lo toca
            creadaAt: prev.creadaAt || now,
            actualizadaAt: now,
            actualizadaPor: adminUid
        });
    });
    return { ok: true, campanaId };
}

// Copia una campaña para la semana siguiente. Copia todo MENOS lo que no puede heredarse:
// id nuevo, 0 cupos emitidos, inactiva, sin fechas ni palabra clave (cada post semanal tiene la
// suya, y guardarCampanaPana las exige antes de poder guardarla). Conserva la temporada.
async function duplicarCampana(db, origenRef, nuevoIdRaw, adminUid, nowMs) {
    const origenSnap = await origenRef.get();
    if (!origenSnap.exists) throw new HttpsError('not-found', 'La campaña a duplicar no existe.');
    const origen = origenSnap.data();

    let nuevoId = String(nuevoIdRaw || '').trim();
    if (nuevoId && !isValidCampanaId(nuevoId)) {
        throw new HttpsError('invalid-argument', 'ID de la copia inválido (2-40 letras, números, - o _).');
    }
    const candidatos = nuevoId ? [nuevoId] : Array.from({ length: 20 }, (_, i) => `${origenRef.id.slice(0, 34)}-C${i + 2}`);

    const now = Timestamp.fromMillis(nowMs);
    const copia = {
        titulo: `${String(origen.titulo || '').slice(0, 52)} (copia)`,
        palabraClave: '',
        temporada: String(origen.temporada || ''),
        descripcion: String(origen.descripcion || ''),
        notaCocina: String(origen.notaCocina || ''),
        imagenUrl: String(origen.imagenUrl || ''),
        composicion: origen.composicion || [],
        precio: Number(origen.precio || 0),
        gruposOpciones: gruposDeCampana(origen),
        extrasLocal: origen.extrasLocal || [],
        cuposTotales: Number(origen.cuposTotales || 0),
        cuposEmitidos: 0,
        agotadaAt: null,
        diasValidos: origen.diasValidos || [],
        fechaInicio: null,
        fechaFin: null,
        activa: false,
        requiereActivacionWA: origen.requiereActivacionWA === true,
        waNumeroPrincipal: String(origen.waNumeroPrincipal || ''),
        waNumeroCupones: String(origen.waNumeroCupones || ''),
        duplicadaDe: origenRef.id,
        creadaAt: now,
        actualizadaAt: now,
        actualizadaPor: adminUid
    };

    for (const id of candidatos) {
        const ref = db.collection(CUPONES_CAMPANAS_COLLECTION).doc(id);
        try {
            await ref.create({ ...copia, slug: id });
            return { ok: true, campanaId: id, duplicadaDe: origenRef.id };
        } catch (err) {
            const existe = err?.code === 6 || /already exists/i.test(String(err?.message || ''));
            if (!existe) throw err;
            if (nuevoId) throw new HttpsError('already-exists', `Ya existe una campaña con el ID "${id}".`);
        }
    }
    throw new HttpsError('aborted', 'No se encontró un ID libre para la copia: indícalo a mano.');
}

// ── Vencimiento diario ───────────────────────────────────────────────────────

// Pasa a "vencido" los cupones sin canjear de campañas cuya fechaFin ya pasó. Las campañas ya
// procesadas quedan marcadas (vencimientoProcesadoAt) para no recorrerlas cada noche para
// siempre; si el admin les extiende la fecha, guardarCampanaPana reescribe el doc sin esa marca.
async function vencerCuponesPana(db, nowMs = Date.now()) {
    const campSnap = await db.collection(CUPONES_CAMPANAS_COLLECTION)
        .where('fechaFin', '<', Timestamp.fromMillis(nowMs))
        .get();
    let vencidos = 0;
    for (const campDoc of campSnap.docs) {
        if (campDoc.data().vencimientoProcesadoAt) continue;
        // Solo el filtro por campaña: el de estado se resuelve en memoria (una campaña son, como
        // mucho, unos cientos de cupones) para no depender de un índice compuesto.
        const cuponesSnap = await db.collection(CUPONES_PANA_COLLECTION).where('campanaId', '==', campDoc.id).get();
        const pendientes = cuponesSnap.docs.filter((d) => [ESTADOS.EMITIDO, ESTADOS.ACTIVO].includes(d.data().estado));
        for (let i = 0; i < pendientes.length; i += 400) {
            const batch = db.batch();
            pendientes.slice(i, i + 400).forEach((d) => batch.update(d.ref, { estado: ESTADOS.VENCIDO, vencidoAt: Timestamp.fromMillis(nowMs) }));
            await batch.commit();
        }
        vencidos += pendientes.length;
        await campDoc.ref.update({ vencimientoProcesadoAt: Timestamp.fromMillis(nowMs) });
    }
    return { campanas: campSnap.size, vencidos };
}

module.exports = {
    CUPONES_CAMPANAS_COLLECTION,
    CUPONES_CAMPANAS_PUBLICO_COLLECTION,
    CUPONES_PANA_COLLECTION,
    CUPONES_PANA_INDEX_COLLECTION,
    ESTADOS,
    MOTIVOS,
    RATE_LIMIT_MAX_PER_PHONE,
    RATE_LIMIT_MAX_PER_IP,
    bogotaParts,
    bogotaDateKeyToMs,
    toMs,
    formatDiasValidos,
    normalizeCodigo,
    isValidCodigo,
    normalizeIgHandle,
    isValidIgHandle,
    waMeLink,
    buildWaLink,
    checkRateLimit,
    ensureAdminOrMeseroCaller,
    ensureAdmin,
    buildCampanaPublica,
    syncCampanaPublica,
    validateEmitInput,
    gruposDeCampana,
    resolverSelecciones,
    describirSelecciones,
    emitirCuponPanaTransaction,
    evaluarCanjeable,
    validarCuponPana,
    canjearCuponPanaTransaction,
    revertirCanjeCuponPanaTransaction,
    validateCampanaPayload,
    guardarCampanaPana,
    vencerCuponesPana
};
