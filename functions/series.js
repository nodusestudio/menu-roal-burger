'use strict';

// SERIES de reels: carpetas de videos (cada una con su cola, su hora diaria y su color) + una SEMANA FIJA que dice
// qué serie sale cada día. Reemplaza a la cola única (colaReels.js).
//
// No publica nada por su cuenta: asigna a cada reel de la cola de una serie su fecha y hora (programadaAtMs) y deja
// que el mismo cron de siempre (publicarPostsProgramados, cada 10 min) los publique en Instagram y Facebook, con sus
// reintentos y el estado "error" con motivo. Como lo que se programa vive en `instagram_posts`, el calendario de
// Redes lo muestra solo; si una serie se pausa o la semana cambia, los reels vuelven a borrador y desaparecen de él.
//
// Datos:
//   series/{id}                    → { nombre, color, hora 'HH:mm', facebook, activa, horaPorDefinir, creadaAtMs }
//   configuracion/semana_reels     → { dias: { lunes: serieId|null, … domingo }, saltarMiercoles }
//   instagram_posts/{id}           → serieId, serieOrden (orden dentro de la serie), titulo (opcional)

const { HttpsError } = require('firebase-functions/v2/https');
const posts = require('./instagramPosts');

const SERIES_COLLECTION = 'series';
const CONFIG_COLLECTION = 'configuracion';
const SEMANA_DOC = 'semana_reels';
const SEMILLA_DOC = 'series_semilla';
const COLA_VIEJA_DOC = 'cola_reels';
const BOGOTA_MS = 5 * 3600 * 1000;
const MIN_MS = 60 * 1000;
const DAY_MS = 24 * 3600 * 1000;
const MARGEN_MS = 2 * MIN_MS; // un horario solo cuenta si falta al menos esto (programarPost exige > 1 min)
const HORIZONTE_DIAS = 120; // programarPost admite hasta 180 días
const DIAS_CLAVE = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado']; // índice = getUTCDay
const DIAS_ORDEN = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
const DIAS_NOMBRE = { domingo: 'domingo', lunes: 'lunes', martes: 'martes', miercoles: 'miércoles', jueves: 'jueves', viernes: 'viernes', sabado: 'sábado' };
const COLORES = ['#e11d48', '#0ea5e9', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
const SERIE_DEFAULTS = { nombre: '', color: COLORES[0], hora: '18:00', facebook: true, activa: true, horaPorDefinir: false };

const refSerie = (db, id) => db.collection(SERIES_COLLECTION).doc(String(id));
const refSemana = (db) => db.collection(CONFIG_COLLECTION).doc(SEMANA_DOC);
const refPost = (db, id) => db.collection(posts.POSTS_COLLECTION).doc(String(id));

// ── Utilidades puras ─────────────────────────────────────────────────────────

function horaAMinutos(h) {
    const m = /^(\d{1,2}):(\d{2})$/.exec(String(h || '').trim());
    if (!m) return NaN;
    const hh = Number(m[1]); const mm = Number(m[2]);
    return hh > 23 || mm > 59 ? NaN : hh * 60 + mm;
}
function horaNormal(h) {
    if (!Number.isFinite(horaAMinutos(h))) throw new HttpsError('invalid-argument', 'La hora debe ser "HH:mm" en formato 24 h (ejemplo: "18:30"), hora de Colombia.');
    const [a, b] = String(h).trim().split(':');
    return `${a.padStart(2, '0')}:${b}`;
}
function textoBogota(ms) {
    if (!Number.isFinite(Number(ms)) || !ms) return null;
    const d = new Date(Number(ms) - BOGOTA_MS).toISOString();
    return `${d.slice(0, 10)} ${d.slice(11, 16)} (hora de Colombia)`;
}
const fechaBogota = (ms) => new Date(Number(ms) - BOGOTA_MS).toISOString().slice(0, 10);
const claveDia = (ms) => DIAS_CLAVE[new Date(Number(ms) - BOGOTA_MS).getUTCDay()];
const sinTildes = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const colorValido = (c) => /^#[0-9a-f]{6}$/i.test(String(c || ''));
const medianoche = (nowMs) => Math.floor((nowMs - BOGOTA_MS) / DAY_MS) * DAY_MS + BOGOTA_MS; // 00:00 de hoy, hora de Bogotá

function claveDeNombreDia(v) {
    const k = sinTildes(v);
    return DIAS_ORDEN.includes(k) ? k : null;
}

// Semana por defecto: nada asignado y el miércoles NO se salta.
function semanaVacia() {
    return { dias: Object.fromEntries(DIAS_ORDEN.map((d) => [d, null])), saltarMiercoles: false };
}

// Horarios futuros de una serie según la semana fija (milisegundos, en orden). Pura: no toca la base.
function slotsDeSerie(serie, semana, nowMs, n = HORIZONTE_DIAS) {
    const base = horaAMinutos(serie.hora);
    const out = [];
    if (!Number.isFinite(base)) return out;
    const m0 = medianoche(nowMs);
    for (let dia = 0; out.length < n && dia < HORIZONTE_DIAS; dia += 1) {
        const t0 = m0 + dia * DAY_MS;
        const clave = claveDia(t0 + 12 * 3600 * 1000);
        if (semana.dias[clave] !== serie.id) continue;
        if (clave === 'miercoles' && semana.saltarMiercoles === true) continue;
        const t = t0 + base * MIN_MS;
        if (t >= nowMs + MARGEN_MS) out.push(t);
    }
    return out;
}

const listo = (p) => p.video?.estado === 'listo' && p.video.borrado !== true && String(p.caption || '').trim() !== '';

// Clasifica los reels de una serie (ya ordenados) según lo que se puede hacer con cada uno.
function clasificar(items, nowMs) {
    return items.map((p) => {
        if (p.estado === 'cancelada') return { p, tipo: 'cancelada' };
        if (p.estado === 'publicada') return { p, tipo: 'publicada' };
        if (p.estado === 'publicando') return { p, tipo: 'enCurso' };
        if (p.estado === 'error') return { p, tipo: 'error' };
        if (p.estado === 'programada' && Number(p.programadaAtMs) <= nowMs + MARGEN_MS) return { p, tipo: 'vencida' }; // la publica el cron en minutos
        return { p, tipo: listo(p) ? 'candidato' : 'incompleto' };
    });
}

// Reparte los horarios de la serie entre sus candidatos, en orden. `ignorarPausa` sirve para mostrar el horario
// estimado de una serie en pausa sin programar nada.
function planificar(serie, semana, clasif, nowMs, { ignorarPausa = false } = {}) {
    const candidatos = clasif.filter((c) => c.tipo === 'candidato');
    const slots = serie.activa === false && !ignorarPausa ? [] : slotsDeSerie(serie, semana, nowMs, candidatos.length);
    return clasif.map((c) => (c.tipo === 'candidato' ? { ...c, slotMs: slots[candidatos.indexOf(c)] ?? null } : c));
}

const ordenar = (lista) => [...lista].sort((a, b) => ((a.serieOrden ?? 1e9) - (b.serieOrden ?? 1e9)) || ((a.creadoAtMs || 0) - (b.creadoAtMs || 0)));

// ── Lectura de datos ─────────────────────────────────────────────────────────

async function leerSeries(db) {
    const snap = await db.collection(SERIES_COLLECTION).get();
    return snap.docs.map((d) => ({ ...SERIE_DEFAULTS, ...d.data(), id: d.id })).sort((a, b) => (a.creadaAtMs || 0) - (b.creadaAtMs || 0));
}

async function leerSemana(db) {
    const s = await refSemana(db).get();
    const d = s.exists ? s.data() : {};
    const base = semanaVacia();
    for (const k of DIAS_ORDEN) base.dias[k] = typeof d.dias?.[k] === 'string' && d.dias[k] ? d.dias[k] : null;
    base.saltarMiercoles = d.saltarMiercoles === true;
    return base;
}

async function leerReelsDeSeries(db) {
    const snap = await db.collection(posts.POSTS_COLLECTION).where('tipo', '==', 'reel').get();
    const porSerie = new Map();
    for (const d of snap.docs) {
        const p = { id: d.id, ...d.data() };
        if (!p.serieId) continue;
        if (!porSerie.has(p.serieId)) porSerie.set(p.serieId, []);
        porSerie.get(p.serieId).push(p);
    }
    for (const [k, v] of porSerie) porSerie.set(k, ordenar(v));
    return porSerie;
}

// Serie por id, por nombre exacto o por parte del nombre (sin tildes ni mayúsculas).
function resolverSerie(series, ref) {
    const r = sinTildes(ref);
    if (!r) throw new HttpsError('invalid-argument', `Indica la serie (${series.map((s) => `"${s.nombre}"`).join(', ') || 'aún no hay ninguna: crea una'}).`);
    const exacta = series.find((s) => s.id === String(ref).trim() || sinTildes(s.nombre) === r);
    if (exacta) return exacta;
    const parecidas = series.filter((s) => sinTildes(s.nombre).includes(r));
    if (parecidas.length === 1) return parecidas[0];
    if (parecidas.length > 1) throw new HttpsError('invalid-argument', `"${ref}" coincide con varias series: ${parecidas.map((s) => `"${s.nombre}"`).join(', ')}.`);
    throw new HttpsError('not-found', `No existe la serie "${ref}". Series: ${series.map((s) => `"${s.nombre}"`).join(', ') || 'ninguna todavía'}.`);
}

// ── Sincronizar ──────────────────────────────────────────────────────────────

// Deja todo al día: a cada reel listo de cada serie activa le asigna el horario que le toca según la semana fija.
// Series en pausa (o sin día en la semana): sus reels vuelven a borrador, y así salen del calendario.
async function sincronizar(db, { nowMs = Date.now() } = {}) {
    const [series, semana, porSerie] = await Promise.all([leerSeries(db), leerSemana(db), leerReelsDeSeries(db)]);
    const resumen = { programados: 0, desprogramados: 0, problemas: [] };
    const existentes = new Set(series.map((s) => s.id));
    for (const serie of series) {
        const slots = clasificar(porSerie.get(serie.id) || [], nowMs).filter((c) => c.tipo === 'candidato');
        // Los horarios se reparten en orden; un reel que ya no se puede programar (video borrado, texto vacío…) no
        // bloquea a los demás: se avisa y el siguiente toma su horario.
        const libres = serie.activa === false ? [] : slotsDeSerie(serie, semana, nowMs, slots.length);
        let i = 0;
        for (const c of slots) {
            const p = c.p;
            if (i >= libres.length) {
                if (p.estado === 'programada') { await posts.desprogramarPost(db, { id: p.id }, 'series', { nowMs }).then(() => { resumen.desprogramados += 1; }).catch(() => {}); }
                continue;
            }
            const slot = libres[i];
            if (p.estado === 'programada' && Number(p.programadaAtMs) === slot) { i += 1; continue; }
            try {
                await posts.programarPost(db, { id: p.id, programadaAtMs: slot }, 'series', { nowMs });
                resumen.programados += 1;
                i += 1;
            } catch (err) {
                resumen.problemas.push({ id: p.id, serie: serie.nombre, motivo: String(err.message || err).slice(0, 160) });
            }
        }
    }
    // Reels de una serie que ya no existe: quedan sueltos y, si estaban programados, vuelven a borrador.
    for (const [serieId, lista] of porSerie) {
        if (existentes.has(serieId)) continue;
        for (const p of lista) if (p.estado === 'programada' && Number(p.programadaAtMs) > nowMs + MARGEN_MS) await posts.desprogramarPost(db, { id: p.id }, 'series', { nowMs }).catch(() => {});
    }
    return resumen;
}

// ── Vista ────────────────────────────────────────────────────────────────────

const resumenTexto = (t) => { const s = String(t || '').replace(/\s+/g, ' ').trim(); return s.length > 90 ? `${s.slice(0, 89)}…` : s; };
const nombreDe = (p) => String(p.titulo || '').trim() || resumenTexto(p.caption).slice(0, 40) || 'Reel sin texto';

function vistaReel(c, serie, posicion, baseUrl) {
    const p = c.p;
    const cuando = c.tipo === 'candidato' ? c.slotMs : (p.estado === 'publicada' ? Number(p.publicadaAtMs) || null : Number(p.programadaAtMs) || null);
    let estado;
    if (c.tipo === 'publicada') estado = 'publicado';
    else if (c.tipo === 'enCurso') estado = 'publicando ahora';
    else if (c.tipo === 'error') estado = 'error';
    else if (c.tipo === 'vencida') estado = 'sale en minutos';
    else if (c.tipo === 'incompleto') estado = 'borrador (falta video o texto)';
    else if (serie.activa === false) estado = 'en pausa';
    else if (p.estado === 'programada') estado = 'programado';
    else estado = cuando ? 'por programar' : 'borrador (sin día en la semana)';
    const v = p.video && p.video.estado === 'listo' && p.video.borrado !== true ? p.video : null;
    return {
        posicion,
        id: p.id,
        nombre: nombreDe(p),
        estado,
        grupo: c.tipo === 'publicada' ? 'publicados' : (estado === 'programado' || estado === 'sale en minutos' || estado === 'publicando ahora' ? 'programados' : 'borradores'),
        estadoReel: p.estado,
        publicaEstimada: textoBogota(cuando),
        publicaEstimadaMs: cuando,
        dia: cuando ? DIAS_NOMBRE[claveDia(cuando)] : null,
        texto: resumenTexto(p.caption),
        error: p.error || '',
        intentos: p.intentos || 0,
        facebook: p.facebook?.publicar === true,
        videoUrl: v && baseUrl && p.imgToken ? require('./reels').urlVideo(baseUrl, p.id, p.imgToken) : null,
        duracionSegundos: v?.duracionS ?? null
    };
}

// Qué pasa los próximos días: cuál serie toca, si sale algo o si se salta (y por qué). Sirve para avisar en pantalla.
function proximosDias(series, semana, planes, nowMs, dias = 14) {
    const out = [];
    const m0 = medianoche(nowMs);
    for (let d = 0; d < dias; d += 1) {
        const t0 = m0 + d * DAY_MS;
        const clave = claveDia(t0 + 12 * 3600 * 1000);
        const fecha = fechaBogota(t0 + 12 * 3600 * 1000);
        const base = { fecha, dia: DIAS_NOMBRE[clave] };
        const serieId = semana.dias[clave];
        if (!serieId) { out.push({ ...base, estado: 'libre', detalle: 'Sin serie asignada.' }); continue; }
        const serie = series.find((s) => s.id === serieId);
        if (!serie) { out.push({ ...base, estado: 'sin_serie', detalle: 'La serie de ese día ya no existe.', aviso: true }); continue; }
        const info = { ...base, serieId: serie.id, serie: serie.nombre, color: serie.color, hora: serie.hora };
        if (clave === 'miercoles' && semana.saltarMiercoles === true) { out.push({ ...info, estado: 'cerrado', detalle: 'Miércoles saltado (cerrado).' }); continue; }
        const t = t0 + horaAMinutos(serie.hora) * MIN_MS;
        const plan = planes.get(serie.id) || [];
        const delDia = plan.find((c) => c.tipo !== 'cancelada' && c.tipo !== 'incompleto' && c.tipo !== 'error' && c.tipo !== 'candidato'
            && fechaBogota(c.tipo === 'publicada' ? c.p.publicadaAtMs : c.p.programadaAtMs) === fecha);
        if (delDia) { out.push({ ...info, estado: delDia.tipo === 'publicada' ? 'publicado' : 'sale', reelId: delDia.p.id, reel: nombreDe(delDia.p), detalle: `Sale a las ${serie.hora}.` }); continue; }
        if (t < nowMs + MARGEN_MS) { out.push({ ...info, estado: 'pasado', detalle: 'Ya pasó la hora de hoy.' }); continue; }
        if (serie.activa === false) { out.push({ ...info, estado: 'pausada', detalle: `La serie «${serie.nombre}» está en pausa: ese día no sale nada.`, aviso: true }); continue; }
        const asignado = plan.find((c) => c.tipo === 'candidato' && c.slotMs === t);
        if (asignado) { out.push({ ...info, estado: 'sale', reelId: asignado.p.id, reel: nombreDe(asignado.p), detalle: `Sale a las ${serie.hora}.` }); continue; }
        out.push({ ...info, estado: 'sin_videos', detalle: `A la serie «${serie.nombre}» no le quedan videos listos: ese día no sale nada.`, aviso: true });
    }
    return out;
}

// Cómo se ve todo ahora mismo (sin escribir nada).
async function vista(db, { baseUrl, nowMs = Date.now() } = {}) {
    const [series, semana, porSerie] = await Promise.all([leerSeries(db), leerSemana(db), leerReelsDeSeries(db)]);
    const planes = new Map();
    const salida = [];
    for (const s of series) {
        const plan = planificar(s, semana, clasificar(porSerie.get(s.id) || [], nowMs), nowMs, { ignorarPausa: true });
        // El horario estimado de una serie en pausa se muestra, pero la serie no programa nada (sincronizar lo deja en borrador).
        planes.set(s.id, plan);
        const vivos = plan.filter((c) => c.tipo !== 'cancelada' && c.tipo !== 'publicada');
        const cola = vivos.map((c, i) => vistaReel(c, s, i + 1, baseUrl));
        const publicados = plan.filter((c) => c.tipo === 'publicada').sort((a, b) => (Number(b.p.publicadaAtMs) || 0) - (Number(a.p.publicadaAtMs) || 0)).map((c, i) => vistaReel(c, s, i + 1, baseUrl));
        salida.push({
            id: s.id, nombre: s.nombre, color: s.color, hora: s.hora, horaPorDefinir: s.horaPorDefinir === true, facebook: s.facebook !== false, activa: s.activa !== false,
            dias: DIAS_ORDEN.filter((d) => semana.dias[d] === s.id).map((d) => DIAS_NOMBRE[d]),
            conteo: { borradores: cola.filter((r) => r.grupo === 'borradores').length, programados: cola.filter((r) => r.grupo === 'programados').length, publicados: publicados.length },
            cola,
            publicados: publicados.slice(0, 20)
        });
    }
    const proximos = proximosDias(series, semana, planes, nowMs);
    return {
        semana: { ...Object.fromEntries(DIAS_ORDEN.map((d) => [d, semana.dias[d] ? { serieId: semana.dias[d], serie: series.find((s) => s.id === semana.dias[d])?.nombre || null } : null])), saltarMiercoles: semana.saltarMiercoles },
        series: salida,
        proximos,
        avisos: proximos.filter((x) => x.aviso).map((x) => `${x.dia} ${x.fecha}: ${x.detalle}`)
    };
}

// Solo nombres y colores (para pintar el calendario); no sincroniza ni calcula nada más.
async function lista(db) {
    const [series, semana] = await Promise.all([leerSeries(db), leerSemana(db)]);
    return { series: series.map((s) => ({ id: s.id, nombre: s.nombre, color: s.color, hora: s.hora, activa: s.activa !== false })), semana };
}

async function ver(db, opts = {}) {
    await sincronizar(db, opts);
    return vista(db, opts);
}

// Para estado_reel: ¿en qué serie está y en qué lugar de su cola?
async function posicionDe(db, id, { nowMs = Date.now(), baseUrl } = {}) {
    const p = await posts.leerPost(db, String(id)).catch(() => null);
    if (!p || !p.serieId) return { enSerie: false };
    const v = await vista(db, { nowMs, baseUrl });
    const s = v.series.find((x) => x.id === p.serieId);
    const r = s?.cola.find((x) => x.id === p.id) || s?.publicados.find((x) => x.id === p.id);
    return s && r ? { enSerie: true, serie: s.nombre, serieId: s.id, posicion: r.posicion, deTotal: s.cola.length, publicaEstimada: r.publicaEstimada, estadoEnSerie: r.estado } : { enSerie: false };
}

// ── Operaciones ──────────────────────────────────────────────────────────────

async function crearSerie(db, a, uid, opts = {}) {
    const nombre = String(a.nombre || '').trim();
    if (!nombre) throw new HttpsError('invalid-argument', 'Falta el nombre de la serie.');
    if (nombre.length > 80) throw new HttpsError('invalid-argument', 'El nombre pasa de 80 caracteres.');
    const series = await leerSeries(db);
    if (series.some((s) => sinTildes(s.nombre) === sinTildes(nombre))) throw new HttpsError('already-exists', `Ya existe una serie llamada "${nombre}".`);
    const color = a.color !== undefined ? a.color : COLORES[series.length % COLORES.length];
    if (!colorValido(color)) throw new HttpsError('invalid-argument', 'El color debe ser un hexadecimal como "#e11d48".');
    const ref = db.collection(SERIES_COLLECTION).doc();
    await ref.set({
        nombre, color: String(color).toLowerCase(), hora: a.hora !== undefined ? horaNormal(a.hora) : SERIE_DEFAULTS.hora,
        facebook: a.facebook !== false, activa: a.activa !== false, horaPorDefinir: a.hora === undefined && a.horaPorDefinir === true,
        creadaAtMs: opts.nowMs || Date.now(), creadaPor: uid || null
    });
    await sincronizar(db, opts);
    return { id: ref.id, ...(await vista(db, opts)) };
}

async function configurarSerie(db, a, uid, opts = {}) {
    const series = await leerSeries(db);
    const s = resolverSerie(series, a.serie ?? a.id);
    const cambios = {};
    if (a.nombre !== undefined) {
        const n = String(a.nombre).trim();
        if (!n || n.length > 80) throw new HttpsError('invalid-argument', 'El nombre debe tener de 1 a 80 caracteres.');
        if (series.some((x) => x.id !== s.id && sinTildes(x.nombre) === sinTildes(n))) throw new HttpsError('already-exists', `Ya existe una serie llamada "${n}".`);
        cambios.nombre = n;
    }
    if (a.color !== undefined) { if (!colorValido(a.color)) throw new HttpsError('invalid-argument', 'El color debe ser un hexadecimal como "#e11d48".'); cambios.color = String(a.color).toLowerCase(); }
    if (a.hora !== undefined) { cambios.hora = horaNormal(a.hora); cambios.horaPorDefinir = false; }
    if (a.facebook !== undefined) cambios.facebook = a.facebook === true;
    if (a.activa !== undefined) cambios.activa = a.activa === true;
    if (!Object.keys(cambios).length) throw new HttpsError('invalid-argument', 'No indicaste nada que cambiar (nombre, color, hora, facebook o activa).');
    await refSerie(db, s.id).set(cambios, { merge: true });
    await sincronizar(db, opts);
    return vista(db, opts);
}

// dias: { lunes: "Nombre de la serie" | null, … }. Solo cambia los días que indiques. saltarMiercoles: true/false.
async function definirSemana(db, a, uid, opts = {}) {
    const series = await leerSeries(db);
    const semana = await leerSemana(db);
    const nuevos = {};
    for (const [k, v] of Object.entries(a.dias || {})) {
        const clave = claveDeNombreDia(k);
        if (!clave) throw new HttpsError('invalid-argument', `"${k}" no es un día (lunes, martes, miércoles, jueves, viernes, sábado o domingo).`);
        const vacio = v === null || v === '' || ['ninguna', 'ninguno', 'nada', 'libre'].includes(sinTildes(v));
        nuevos[clave] = vacio ? null : resolverSerie(series, v).id;
    }
    if (a.saltarMiercoles === undefined && !Object.keys(nuevos).length) throw new HttpsError('invalid-argument', 'No indicaste nada que cambiar (dias o saltarMiercoles).');
    await refSemana(db).set({ dias: { ...semana.dias, ...nuevos }, saltarMiercoles: a.saltarMiercoles === undefined ? semana.saltarMiercoles : a.saltarMiercoles === true }, { merge: true });
    await sincronizar(db, opts);
    return vista(db, opts);
}

async function siguienteOrden(db, serieId) {
    const lista = (await leerReelsDeSeries(db)).get(serieId) || [];
    return lista.reduce((m, p) => Math.max(m, Number(p.serieOrden) || 0), 0) + 1;
}

// Pone un reel (o lo mueve de otra serie) al final de la cola de una serie. No exige video ni texto: un reel
// incompleto queda como borrador y entra a la programación solo cuando esté listo.
async function asignar(db, a, uid, opts = {}) {
    const id = String(a.id || '');
    if (!id) throw new HttpsError('invalid-argument', 'Falta el id del reel.');
    const p = await posts.leerPost(db, id);
    if (p.tipo !== 'reel') throw new HttpsError('failed-precondition', 'Esa publicación no es un reel.');
    if (['publicada', 'cancelada', 'publicando'].includes(p.estado)) throw new HttpsError('failed-precondition', `Un reel ${p.estado} no puede entrar a una serie.`);
    const series = await leerSeries(db);
    const s = resolverSerie(series, a.serie);
    if (p.serieId === s.id && a.titulo === undefined) return vista(db, opts);
    const cambios = { serieId: s.id, actualizadoAtMs: opts.nowMs || Date.now() };
    if (p.serieId !== s.id) cambios.serieOrden = await siguienteOrden(db, s.id);
    if (a.titulo !== undefined) cambios.titulo = String(a.titulo || '').trim().slice(0, 80);
    await refPost(db, id).set(cambios, { merge: true });
    // Si estaba programado en otra serie, vuelve a borrador para que el nuevo horario lo asigne la sincronización.
    if (p.serieId !== s.id && p.estado === 'programada') await posts.desprogramarPost(db, { id }, uid, opts).catch(() => {});
    await sincronizar(db, opts);
    return vista(db, opts);
}

// Como asignar, pero exige que el reel esté listo (video y texto): es "ponlo en la cola y que salga solo".
async function agregar(db, a, uid, opts = {}) {
    const id = String(a.id || '');
    if (!id) throw new HttpsError('invalid-argument', 'Falta el id del reel.');
    let p = await posts.leerPost(db, id);
    if (p.tipo !== 'reel') throw new HttpsError('failed-precondition', 'Esa publicación no es un reel.');
    const series = await leerSeries(db);
    let ref = a.serie;
    if (!String(ref || '').trim()) ref = p.serieId || (series.length === 1 ? series[0].id : '');
    const s = resolverSerie(series, ref);
    if (p.serieId === s.id) {
        // Ya está: si había fallado, volver a agregarlo es pedir otro intento.
        if (p.estado === 'error') { await posts.desprogramarPost(db, { id }, uid, opts); await sincronizar(db, opts); }
        return { ya: true, ...(await vista(db, opts)) };
    }
    if (['publicada', 'cancelada', 'publicando'].includes(p.estado)) throw new HttpsError('failed-precondition', `Un reel ${p.estado} no puede entrar a una serie.`);
    const errVideo = await require('./reelsApi').ensamblarPendiente(db, p, uid, { almacen: opts.almacen });
    p = await posts.leerPost(db, id);
    if (p.video?.estado !== 'listo' || p.video.borrado) throw new HttpsError('failed-precondition', `Ese reel no tiene video listo${errVideo ? ` (${errVideo})` : ''}: súbelo primero.`);
    if (!String(p.caption || '').trim()) throw new HttpsError('failed-precondition', 'Ese reel no tiene texto (caption): escríbelo antes de ponerlo en una serie.');
    if (s.facebook !== false && p.facebook?.publicar !== true) await posts.guardarPost(db, { id, facebook: true }, uid, opts);
    return { ya: false, ...(await asignar(db, { id, serie: s.id, titulo: a.titulo }, uid, opts)) };
}

async function quitar(db, a, uid, opts = {}) {
    const id = String(a.id || '');
    const p = await posts.leerPost(db, id);
    if (!p.serieId) throw new HttpsError('not-found', 'Ese reel no está en ninguna serie.');
    // Sale de la serie y vuelve a borrador (no se cancela): así no se publica solo.
    if (p.estado === 'programada' && Number(p.programadaAtMs) > (opts.nowMs || Date.now())) await posts.desprogramarPost(db, { id }, uid, opts).catch(() => {});
    await refPost(db, id).set({ serieId: null, serieOrden: null }, { merge: true });
    await sincronizar(db, opts);
    return { quitado: id, ...(await vista(db, opts)) };
}

// Dos formas: orden = [ids…] (los nombrados pasan al frente en ese orden) o id + posicion (1 = el primero).
// Con "orden" hay que indicar la serie (o basta con que los ids sean de una sola).
async function reordenar(db, a, uid, opts = {}) {
    const porSerie = await leerReelsDeSeries(db);
    const series = await leerSeries(db);
    let serieId;
    if (a.id) {
        const p = await posts.leerPost(db, String(a.id));
        serieId = p.serieId;
    } else if (a.serie) serieId = resolverSerie(series, a.serie).id;
    else if (Array.isArray(a.orden) && a.orden.length) serieId = (await posts.leerPost(db, String(a.orden[0]))).serieId;
    if (!serieId) throw new HttpsError('invalid-argument', 'Indica el reel o la serie que quieres reordenar.');
    const vivos = (porSerie.get(serieId) || []).filter((p) => !['publicada', 'cancelada'].includes(p.estado));
    let ids = vivos.map((p) => p.id);
    if (Array.isArray(a.orden) && a.orden.length) {
        const pedido = a.orden.map(String);
        const desconocido = pedido.find((x) => !ids.includes(x));
        if (desconocido) throw new HttpsError('invalid-argument', `El reel ${desconocido} no está en la cola de esa serie.`);
        ids = [...new Set(pedido), ...ids.filter((x) => !pedido.includes(x))];
    } else if (a.id && a.posicion !== undefined) {
        const id = String(a.id);
        if (!ids.includes(id)) throw new HttpsError('not-found', 'Ese reel no está en la cola de su serie.');
        const pos = Math.min(Math.max(parseInt(a.posicion, 10) || 1, 1), ids.length);
        ids = ids.filter((x) => x !== id);
        ids.splice(pos - 1, 0, id);
    } else {
        throw new HttpsError('invalid-argument', 'Indica "orden" (lista de ids en el orden deseado) o "id" y "posicion".');
    }
    for (let i = 0; i < ids.length; i += 1) await refPost(db, ids[i]).set({ serieOrden: i + 1 }, { merge: true });
    await sincronizar(db, opts);
    return vista(db, opts);
}

// ── Semilla inicial (una sola vez) ───────────────────────────────────────────

const SEMILLA = {
    series: [
        { clave: 'roal', nombre: 'Esto no deberías saber de Roal', color: '#e11d48', hora: '18:00', activa: true, horaPorDefinir: false },
        { clave: 'emprendimiento', nombre: 'Emprendimiento', color: '#0ea5e9', hora: '18:00', activa: false, horaPorDefinir: true }
    ],
    semana: { lunes: 'roal', martes: 'emprendimiento', miercoles: 'roal', jueves: 'emprendimiento', viernes: 'roal', sabado: 'emprendimiento', domingo: 'roal' },
    reelsRoal: [['0Z8hhcJB2FDEBBUTo54K', 'Video 1'], ['rg74W3n6FNwnFxOwNpiy', 'Video 2']]
};

// Crea las dos series iniciales, la semana fija y asigna los dos primeros reels a la primera serie. Se ejecuta UNA vez
// (deja una marca en configuracion/series_semilla). No toca videos ni textos. Los reels que estaban en la cola vieja
// pasan, en su orden, a la serie de Roal.
async function sembrarIniciales(db, { nowMs = Date.now() } = {}) {
    const marca = db.collection(CONFIG_COLLECTION).doc(SEMILLA_DOC);
    if ((await marca.get()).exists) return { sembrada: false };
    if ((await leerSeries(db)).length) { await marca.set({ hecha: true, omitida: 'ya había series', atMs: nowMs }); return { sembrada: false }; }
    const ids = {};
    for (const [i, s] of SEMILLA.series.entries()) {
        const ref = db.collection(SERIES_COLLECTION).doc();
        await ref.set({ nombre: s.nombre, color: s.color, hora: s.hora, facebook: true, activa: s.activa, horaPorDefinir: s.horaPorDefinir, creadaAtMs: nowMs + i, creadaPor: 'semilla' });
        ids[s.clave] = ref.id;
    }
    await refSemana(db).set({ dias: Object.fromEntries(DIAS_ORDEN.map((d) => [d, ids[SEMILLA.semana[d]]])), saltarMiercoles: false });
    const vieja = await db.collection(CONFIG_COLLECTION).doc(COLA_VIEJA_DOC).get();
    const idsViejos = vieja.exists && Array.isArray(vieja.data().ids) ? vieja.data().ids.filter((x) => typeof x === 'string') : [];
    const nombres = new Map(SEMILLA.reelsRoal);
    const orden = [...SEMILLA.reelsRoal.map(([id]) => id), ...idsViejos.filter((x) => !nombres.has(x))];
    const asignados = [];
    let n = 0;
    for (const id of orden) {
        const s = await refPost(db, id).get();
        if (!s.exists || s.data().tipo !== 'reel' || ['publicada', 'cancelada'].includes(s.data().estado)) continue;
        n += 1;
        await refPost(db, id).set({ serieId: ids.roal, serieOrden: n, ...(nombres.has(id) && !String(s.data().titulo || '').trim() ? { titulo: nombres.get(id) } : {}) }, { merge: true });
        asignados.push(id);
    }
    await marca.set({ hecha: true, atMs: nowMs, series: ids, reelsAsignados: asignados });
    return { sembrada: true, series: ids, reelsAsignados: asignados };
}

module.exports = {
    SERIES_COLLECTION, SEMANA_DOC, DIAS_ORDEN, horaAMinutos, textoBogota, slotsDeSerie, clasificar, planificar, resolverSerie,
    leerSeries, leerSemana, sincronizar, vista, lista, ver, posicionDe, crearSerie, configurarSerie, definirSemana, asignar, agregar, quitar, reordenar, sembrarIniciales
};
