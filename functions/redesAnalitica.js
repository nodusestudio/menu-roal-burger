'use strict';

// ANALÍTICA DE REDES para el conector de Claude (y reutilizable por FODI): une las métricas de Instagram y de Facebook
// de cada publicación y responde "¿cuál pegó?", "¿qué serie / día / hora rinde más?" y "¿cómo crecen las cuentas?".
// Solo LEE (excepto guardarResumenSemanal, que deja un histórico para que las cifras no se pierdan a los 14 días).
//
// Fuentes (todas ya las llenan los crons de métricas):
//   instagram_metricas/{mediaId}   { postId, tipo, publicadaAtMs, ultimo: {reach, views, likes, …} }
//   facebook_metricas/{fbPostId}   { postId, tipo, publicadaAtMs, ultimo: {reach, views, likes, …} }  (solo foto/carrusel)
//   instagram_posts/{id}           texto, serieId, titulo
//   series/{id}                    nombre
//   instagram_seguidores/{fecha}, facebook_pagina_dias/{fecha}
// Las cuentas (calcular*) son funciones puras: se prueban sin base de datos.

const { HttpsError } = require('firebase-functions/v2/https');

const IG_METRICAS = 'instagram_metricas';
const FB_METRICAS = 'facebook_metricas';
const IG_SEGUIDORES = 'instagram_seguidores';
const FB_PAGINA_DIAS = 'facebook_pagina_dias';
const POSTS = 'instagram_posts';
const SERIES = 'series';
const RESUMEN_COLLECTION = 'redes_resumen_semanal';

const BOGOTA_MS = 5 * 3600 * 1000;
const HORA_MS = 3600 * 1000;
const DAY_MS = 24 * HORA_MS;
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const ORDENES = { alcance: 'alcance', vistas: 'vistas', interacciones: 'interacciones', guardados: 'guardados', compartidos: 'compartidos', tasa: 'tasa' };
const MUESTRA_MINIMA = 3; // con menos publicaciones el promedio no es confiable

// ── Fechas (hora de Colombia) ────────────────────────────────────────────────

const partes = (ms) => { const d = new Date(ms - BOGOTA_MS); return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate(), dow: d.getUTCDay(), h: d.getUTCHours() }; };
const dosDig = (n) => String(n).padStart(2, '0');
const claveFecha = (ms) => { const p = partes(ms); return `${p.y}-${dosDig(p.m)}-${dosDig(p.d)}`; };
const inicioDiaMs = (clave) => Date.parse(`${clave}T00:00:00-05:00`);

function validarClave(v, nombre) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(v || '')) || !Number.isFinite(inicioDiaMs(v))) throw new HttpsError('invalid-argument', `"${nombre}" debe ser una fecha YYYY-MM-DD.`);
    return String(v);
}

// periodo: ultimos_7 (por defecto) | semana_pasada (lunes a domingo anterior) | ultimos_30 | este_mes. desde/hasta mandan sobre periodo.
function resolverRango({ periodo, desde, hasta } = {}, nowMs = Date.now()) {
    const hoy = claveFecha(nowMs);
    let d; let h;
    if (desde || hasta) {
        d = desde ? validarClave(desde, 'desde') : claveFecha(inicioDiaMs(hoy) - 6 * DAY_MS);
        h = hasta ? validarClave(hasta, 'hasta') : hoy;
    } else if (periodo === 'semana_pasada') {
        const dow = partes(nowMs).dow; // 0 = domingo
        const diasDesdeLunes = dow === 0 ? 6 : dow - 1;
        const lunesEsta = inicioDiaMs(hoy) - diasDesdeLunes * DAY_MS;
        d = claveFecha(lunesEsta - 7 * DAY_MS);
        h = claveFecha(lunesEsta - DAY_MS);
    } else if (periodo === 'ultimos_30') {
        d = claveFecha(inicioDiaMs(hoy) - 29 * DAY_MS); h = hoy;
    } else if (periodo === 'este_mes') {
        d = `${hoy.slice(0, 8)}01`; h = hoy;
    } else {
        d = claveFecha(inicioDiaMs(hoy) - 6 * DAY_MS); h = hoy;
    }
    if (d > h) throw new HttpsError('invalid-argument', '"desde" no puede ser posterior a "hasta".');
    const dias = Math.round((inicioDiaMs(h) - inicioDiaMs(d)) / DAY_MS) + 1;
    if (dias > 120) throw new HttpsError('invalid-argument', 'El rango máximo es de 120 días.');
    return { desde: d, hasta: h, dias, desdeMs: inicioDiaMs(d), hastaMs: inicioDiaMs(h) + DAY_MS };
}

// ── Cuentas puras ────────────────────────────────────────────────────────────

const num = (x) => (x === null || x === undefined || x === '' || !Number.isFinite(Number(x)) ? null : Number(x));
const redondear = (x, dec = 0) => (x === null ? null : Math.round(x * 10 ** dec) / 10 ** dec);
const suma = (xs) => xs.reduce((a, b) => a + b, 0);
const promedio = (xs, dec = 0) => { const v = xs.filter((x) => x !== null); return v.length ? redondear(suma(v) / v.length, dec) : null; };
const resumenTexto = (t, n = 90) => { const s = String(t || '').replace(/\s+/g, ' ').trim(); return s.length > n ? `${s.slice(0, n - 1)}…` : s; };

function metricasDe(m) {
    const u = m?.ultimo || {};
    const alcance = num(u.reach);
    const interacciones = num(u.total_interactions);
    return {
        alcance, vistas: num(u.views), meGusta: num(u.likes), comentarios: num(u.comments), compartidos: num(u.shares),
        guardados: num(u.saved), interacciones, visitasPerfil: num(u.profile_visits), seguidoresNuevos: num(u.follows),
        tiempoPromedioSegundos: num(u.ig_reels_avg_watch_time) === null ? null : redondear(num(u.ig_reels_avg_watch_time) / 1000, 1),
        tasaInteraccion: alcance && interacciones !== null ? redondear((interacciones / alcance) * 100, 1) : null,
        estadoMedicion: m?.estado || 'sin_medir'
    };
}

// Una fila por publicación (Instagram + Facebook juntos). Entradas ya leídas: no toca la base de datos.
function armarFilas({ igMetricas = [], fbMetricas = [], posts = [], series = [] }, nowMs = Date.now()) {
    const porPost = new Map(posts.map((p) => [p.id, p]));
    const nombreSerie = new Map(series.map((s) => [s.id, s.nombre]));
    const filas = new Map();
    const clave = (m) => m.postId || `ig:${m.mediaId || m.id}`;
    for (const m of igMetricas) {
        if (!m || m.tipo === 'historia') continue;
        const p = porPost.get(m.postId) || {};
        filas.set(clave(m), {
            id: m.postId || null, tipo: m.tipo || p.tipo || '', publicadaAtMs: Number(m.publicadaAtMs) || null,
            serie: p.serieId ? (nombreSerie.get(p.serieId) || 'Serie borrada') : 'Sin serie',
            titulo: String(p.titulo || '').trim(), texto: resumenTexto(p.caption),
            instagram: metricasDe(m), facebook: null
        });
    }
    for (const m of fbMetricas) {
        if (!m) continue;
        const k = m.postId || `fb:${m.fbPostId || m.id}`;
        const p = porPost.get(m.postId) || {};
        const f = filas.get(k) || {
            id: m.postId || null, tipo: m.tipo || p.tipo || '', publicadaAtMs: Number(m.publicadaAtMs) || null,
            serie: p.serieId ? (nombreSerie.get(p.serieId) || 'Serie borrada') : 'Sin serie',
            titulo: String(p.titulo || '').trim(), texto: resumenTexto(p.caption), instagram: null, facebook: null
        };
        f.facebook = metricasDe(m);
        filas.set(k, f);
    }
    return [...filas.values()].map((f) => {
        const p = f.publicadaAtMs ? partes(f.publicadaAtMs) : null;
        // Total entre redes: lo que Claude usa para ordenar sin importar dónde rindió.
        const tot = (k) => { const a = f.instagram?.[k] ?? null; const b = f.facebook?.[k] ?? null; return a === null && b === null ? null : (a || 0) + (b || 0); };
        const alcance = tot('alcance');
        const interacciones = tot('interacciones');
        return {
            ...f,
            fecha: f.publicadaAtMs ? claveFecha(f.publicadaAtMs) : '',
            dia: p ? DIAS[p.dow] : '',
            hora: p ? `${dosDig(p.h)}:00` : '',
            edadDias: f.publicadaAtMs ? redondear((nowMs - f.publicadaAtMs) / DAY_MS, 1) : null,
            total: {
                alcance, vistas: tot('vistas'), interacciones, guardados: tot('guardados'), compartidos: tot('compartidos'),
                tasa: alcance && interacciones !== null ? redondear((interacciones / alcance) * 100, 1) : null
            }
        };
    }).sort((a, b) => (b.publicadaAtMs || 0) - (a.publicadaAtMs || 0));
}

function ordenar(filas, por = 'alcance') {
    const k = ORDENES[por] || 'alcance';
    return [...filas].sort((a, b) => (b.total[k] ?? -1) - (a.total[k] ?? -1));
}

function calcularRendimiento(filas, { ordenarPor = 'alcance', n = 10 } = {}) {
    const tope = Math.max(1, Math.min(30, parseInt(n, 10) || 10));
    const medidas = filas.filter((f) => f.total.alcance !== null || f.total.vistas !== null);
    const ord = ordenar(medidas, ordenarPor);
    const vista = (f, pos) => ({
        puesto: pos, id: f.id, tipo: f.tipo, serie: f.serie, titulo: f.titulo || undefined, texto: f.texto,
        publicado: `${f.fecha} ${f.hora} (${f.dia})`, edadDias: f.edadDias,
        total: f.total, instagram: f.instagram, facebook: f.facebook
    });
    const avisos = [];
    const jovenes = medidas.filter((f) => f.edadDias !== null && f.edadDias < 3).length;
    if (jovenes) avisos.push(`${jovenes} publicación(es) tienen menos de 3 días: sus cifras todavía suben, no las compares de igual a igual con las más viejas.`);
    if (filas.length > medidas.length) avisos.push(`${filas.length - medidas.length} publicación(es) sin métricas todavía (Instagram no da datos con muy pocas vistas, o aún no se mide).`);
    return {
        ordenadoPor: ORDENES[ordenarPor] || 'alcance',
        publicaciones: filas.length, medidas: medidas.length,
        mejores: ord.slice(0, tope).map((f, i) => vista(f, i + 1)),
        // Las peores sirven para aprender qué NO repetir; solo si hay suficientes para que no se solapen con las mejores.
        peores: medidas.length >= tope + 3 ? ord.slice(-3).map((f, i) => vista(f, medidas.length - 2 + i)) : [],
        totales: {
            alcance: suma(medidas.map((f) => f.total.alcance || 0)), vistas: suma(medidas.map((f) => f.total.vistas || 0)),
            interacciones: suma(medidas.map((f) => f.total.interacciones || 0)), guardados: suma(medidas.map((f) => f.total.guardados || 0)),
            compartidos: suma(medidas.map((f) => f.total.compartidos || 0))
        },
        avisos
    };
}

function agrupar(filas, claveDe) {
    const grupos = new Map();
    for (const f of filas) {
        const k = claveDe(f);
        if (!k) continue;
        if (!grupos.has(k)) grupos.set(k, []);
        grupos.get(k).push(f);
    }
    return [...grupos.entries()].map(([nombre, fs]) => {
        const medidas = fs.filter((f) => f.total.alcance !== null || f.total.vistas !== null);
        const tiempos = fs.map((f) => f.instagram?.tiempoPromedioSegundos ?? null);
        return {
            nombre, publicaciones: fs.length, medidas: medidas.length,
            promedioAlcance: promedio(medidas.map((f) => f.total.alcance)), promedioVistas: promedio(medidas.map((f) => f.total.vistas)),
            promedioInteracciones: promedio(medidas.map((f) => f.total.interacciones), 1), promedioGuardados: promedio(medidas.map((f) => f.total.guardados), 1),
            promedioCompartidos: promedio(medidas.map((f) => f.total.compartidos), 1), tasaInteraccionPromedio: promedio(medidas.map((f) => f.total.tasa), 1),
            tiempoPromedioSegundos: promedio(tiempos, 1),
            confiable: medidas.length >= MUESTRA_MINIMA
        };
    }).sort((a, b) => (b.promedioAlcance ?? -1) - (a.promedioAlcance ?? -1));
}

function franja(f) {
    const h = Number(String(f.hora).slice(0, 2));
    if (!f.hora) return '';
    if (h < 12) return 'mañana (antes de 12:00)';
    if (h < 17) return 'tarde (12:00 a 16:59)';
    if (h < 20) return 'tarde-noche (17:00 a 19:59)';
    return 'noche (20:00 en adelante)';
}

function calcularResumen(filas) {
    const orden = (arr, claves) => [...arr].sort((a, b) => claves.indexOf(a.nombre) - claves.indexOf(b.nombre));
    const porSerie = agrupar(filas, (f) => f.serie);
    const porTipo = agrupar(filas, (f) => f.tipo);
    const porDia = orden(agrupar(filas, (f) => f.dia), ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']);
    const porFranja = agrupar(filas, franja);
    const mejor = (arr) => arr.filter((g) => g.confiable)[0] || null; // arr ya viene por alcance descendente en porSerie/porTipo/porFranja
    const notas = [];
    if (filas.length < 8) notas.push('Hay pocas publicaciones en el rango: las diferencias entre grupos pueden ser casualidad. Amplía el rango antes de decidir.');
    notas.push(`Un promedio solo es confiable con ${MUESTRA_MINIMA} o más publicaciones medidas (campo "confiable").`);
    notas.push('El día y la hora son los de publicación (Colombia). El alcance cambia con la edad de la publicación.');
    return {
        publicaciones: filas.length,
        porSerie, porTipo, porDia, porFranja,
        sugerencias: {
            serieConMasAlcance: mejor(porSerie)?.nombre || null,
            tipoConMasAlcance: mejor(porTipo)?.nombre || null,
            franjaConMasAlcance: mejor(porFranja)?.nombre || null
        },
        notas
    };
}

function serieSeguidores(docs) {
    const s = docs.map((d) => ({ fecha: String(d.fecha || d.id || ''), n: num(d.seguidores) })).filter((x) => x.fecha && x.n !== null).sort((a, b) => a.fecha.localeCompare(b.fecha));
    if (!s.length) return null;
    const a = s[0]; const z = s[s.length - 1];
    return { inicio: { fecha: a.fecha, seguidores: a.n }, fin: { fecha: z.fecha, seguidores: z.n }, cambio: z.n - a.n, diasConDato: s.length, porDia: s.map((x) => ({ fecha: x.fecha, seguidores: x.n })) };
}

function calcularHistorias(metricas) {
    const hs = metricas.filter((m) => m.tipo === 'historia');
    const u = (m, k) => num(m.ultimo?.[k]);
    const alcances = hs.map((m) => u(m, 'reach'));
    const nav = { adelante: 0, atras: 0, salidas: 0, deslizamientos: 0 };
    for (const m of hs) {
        const n = m.ultimo?.navigation || {};
        nav.adelante += Number(n.tap_forward) || 0; nav.atras += Number(n.tap_back) || 0; nav.salidas += Number(n.tap_exit) || 0; nav.deslizamientos += Number(n.swipe_forward) || 0;
    }
    const conAlcance = alcances.filter((x) => x !== null);
    return {
        cantidad: hs.length, conMetricas: conAlcance.length,
        alcanceTotal: suma(conAlcance), alcancePromedio: promedio(alcances),
        respuestas: suma(hs.map((m) => u(m, 'replies') || 0)), compartidos: suma(hs.map((m) => u(m, 'shares') || 0)),
        visitasPerfil: suma(hs.map((m) => u(m, 'profile_visits') || 0)), clicsEnlace: suma(hs.map((m) => u(m, 'link_clicks') || 0)),
        navegacion: nav,
        nota: 'Instagram solo da las métricas de una historia durante sus 24 h, y no da datos con muy pocos espectadores.'
    };
}

// ── Lectura de la base ───────────────────────────────────────────────────────

const docs = (snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }));
const rango = (col, campo, a, b) => col.where(campo, '>=', a).where(campo, '<=', b);

async function leerFilas(db, r, nowMs = Date.now()) {
    const [igS, fbS, serS] = await Promise.all([
        rango(db.collection(IG_METRICAS), 'publicadaAtMs', r.desdeMs, r.hastaMs - 1).get(),
        rango(db.collection(FB_METRICAS), 'publicadaAtMs', r.desdeMs, r.hastaMs - 1).get(),
        db.collection(SERIES).get()
    ]);
    const igMetricas = docs(igS);
    const fbMetricas = docs(fbS);
    const ids = [...new Set([...igMetricas, ...fbMetricas].filter((m) => m.tipo !== 'historia').map((m) => m.postId).filter(Boolean))];
    const refs = ids.map((id) => db.collection(POSTS).doc(id));
    const postsSnap = refs.length ? await db.getAll(...refs) : [];
    const posts = postsSnap.filter((s) => s.exists).map((s) => ({ id: s.id, ...s.data() }));
    return { filas: armarFilas({ igMetricas, fbMetricas, posts, series: docs(serS) }, nowMs), igMetricas };
}

async function rendimiento(db, a = {}, { nowMs = Date.now() } = {}) {
    const r = resolverRango(a, nowMs);
    const { filas } = await leerFilas(db, r, nowMs);
    return { rango: { desde: r.desde, hasta: r.hasta, dias: r.dias }, ...calcularRendimiento(filas, { ordenarPor: a.ordenarPor, n: a.n }) };
}

async function resumenSeries(db, a = {}, { nowMs = Date.now() } = {}) {
    const r = resolverRango(a, nowMs);
    const { filas } = await leerFilas(db, r, nowMs);
    return { rango: { desde: r.desde, hasta: r.hasta, dias: r.dias }, ...calcularResumen(filas) };
}

async function crecimiento(db, a = {}, { nowMs = Date.now() } = {}) {
    const r = resolverRango(a, nowMs);
    const [igSeg, fbSeg, igMet] = await Promise.all([
        rango(db.collection(IG_SEGUIDORES), 'fecha', r.desde, r.hasta).get(),
        rango(db.collection(FB_PAGINA_DIAS), 'fecha', r.desde, r.hasta).get(),
        rango(db.collection(IG_METRICAS), 'publicadaAtMs', r.desdeMs, r.hastaMs - 1).get()
    ]);
    return {
        rango: { desde: r.desde, hasta: r.hasta, dias: r.dias },
        seguidoresInstagram: serieSeguidores(docs(igSeg)),
        seguidoresFacebook: serieSeguidores(docs(fbSeg)),
        historiasInstagram: calcularHistorias(docs(igMet))
    };
}

// ── Histórico semanal ────────────────────────────────────────────────────────

// Guarda (o actualiza) el resumen de una semana lunes–domingo. Documento: redes_resumen_semanal/{lunes}. `final` = la semana
// ya cumplió 14 días de medición completa (Instagram/Facebook dejan de actualizarla), así que queda como dato definitivo.
async function guardarResumenSemanal(db, { lunes, nowMs = Date.now() }) {
    const ini = inicioDiaMs(validarClave(lunes, 'lunes'));
    const domingo = claveFecha(ini + 6 * DAY_MS);
    const r = { desde: lunes, hasta: domingo, dias: 7, desdeMs: ini, hastaMs: ini + 7 * DAY_MS };
    const { filas } = await leerFilas(db, r, nowMs);
    const rend = calcularRendimiento(filas, { n: 10 });
    const res = calcularResumen(filas);
    const final = nowMs >= r.hastaMs + 14 * DAY_MS;
    const doc = {
        lunes, domingo, final, guardadoAtMs: nowMs,
        publicaciones: filas.length, totales: rend.totales,
        mejores: rend.mejores.map((m) => ({ id: m.id, tipo: m.tipo, serie: m.serie, texto: m.texto, publicado: m.publicado, total: m.total })),
        porSerie: res.porSerie, porTipo: res.porTipo, porDia: res.porDia, porFranja: res.porFranja
    };
    await db.collection(RESUMEN_COLLECTION).doc(lunes).set(doc);
    return { lunes, final, publicaciones: filas.length };
}

// Lunes del día de `nowMs` (Colombia) menos `semanasAtras` semanas.
function lunesDe(nowMs, semanasAtras = 0) {
    const dow = partes(nowMs).dow;
    const diasDesdeLunes = dow === 0 ? 6 : dow - 1;
    return claveFecha(inicioDiaMs(claveFecha(nowMs)) - diasDesdeLunes * DAY_MS - semanasAtras * 7 * DAY_MS);
}

// Cron semanal: la semana que acaba de terminar (provisional) y la de hace 2 semanas (ya definitiva).
async function guardarResumenesRecientes(db, { nowMs = Date.now() } = {}) {
    const out = [];
    for (const atras of [1, 2, 3]) out.push(await guardarResumenSemanal(db, { lunes: lunesDe(nowMs, atras), nowMs }));
    return out;
}

async function historico(db, { semanas = 8 } = {}) {
    const tope = Math.max(1, Math.min(52, parseInt(semanas, 10) || 8));
    const snap = await db.collection(RESUMEN_COLLECTION).orderBy('lunes', 'desc').limit(tope).get();
    return { semanas: docs(snap).map((d) => ({ lunes: d.lunes, domingo: d.domingo, definitivo: d.final === true, publicaciones: d.publicaciones, totales: d.totales, mejor: (d.mejores || [])[0] || null, porSerie: d.porSerie })) };
}

module.exports = {
    RESUMEN_COLLECTION, resolverRango, armarFilas, calcularRendimiento, calcularResumen, calcularHistorias, serieSeguidores,
    rendimiento, resumenSeries, crecimiento, guardarResumenSemanal, guardarResumenesRecientes, historico, lunesDe, claveFecha
};
