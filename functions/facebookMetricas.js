// Métricas de Facebook: de cada publicación de la página (post de foto o carrusel) y de la página en sí.
// Meta cambió los nombres en noviembre de 2025: "impressions" ya no existe; ahora son "views"
// (post_media_view / page_media_view) y el alcance es post_total_media_view_unique. Por eso, si Facebook
// rechaza una métrica (código 100), se pide de a una y se ignora la que no exista, igual que en Instagram.
//
// Las historias de la página NO se miden (Facebook no entrega insights de historias por esta API).
// Colecciones (las lee el admin, las escribe solo el servidor):
//   facebook_metricas/{fbPostId}   medición de cada publicación, 14 días con intervalo adaptativo
//   facebook_pagina_dias/{fecha}   seguidores y totales de la página, uno por día
// Todo recibe `db`, `fetchFn` y `nowMs` inyectados (tests/facebook-pagina.test.js, sin red).

const ig = require('./instagramHistorias');
const fb = require('./facebookPagina');
const cd = require('./codigoDia');

const METRICAS_COLLECTION = 'facebook_metricas';
const PAGINA_COLLECTION = 'facebook_pagina_dias';
const HORA_MS = 60 * 60 * 1000;
const VIGENCIA_MS = ig.METRICAS_POST_VIGENCIA_MS; // 14 días, igual que Instagram

// nombre en Facebook → nombre que usa el panel
const INSIGHTS_POST = { post_media_view: 'views', post_total_media_view_unique: 'reach', post_clicks: 'clicks' };
const INSIGHTS_PAGINA = { page_media_view: 'vistas28', page_total_media_view_unique: 'alcance28', page_post_engagements: 'interacciones28' };

const get = (fetchFn, c, ruta, query) => ig.llamarGraph(fetchFn, 'GET', `${fb.FB_GRAPH}/${ruta}?${new URLSearchParams({ ...query, access_token: c.pageToken })}`);

function numero(m) {
    const v = m?.total_value?.value ?? m?.values?.[m.values.length - 1]?.value;
    return Number.isFinite(Number(v)) && typeof v !== 'object' ? Number(v) : null;
}

// Pide una lista de métricas de insights; si el lote falla por una inexistente (100), de a una.
async function pedirInsights(fetchFn, c, ruta, nombres, extra = {}) {
    const salida = {};
    const pedir = (lista) => get(fetchFn, c, `${ruta}/insights`, { metric: lista.join(','), ...extra });
    try {
        for (const m of (await pedir(nombres)).data || []) salida[m.name] = numero(m);
    } catch (err) {
        if (!(err instanceof ig.GraphError) || err.code !== 100) throw err;
        for (const nombre of nombres) {
            try {
                for (const m of (await pedir([nombre])).data || []) salida[m.name] = numero(m);
            } catch (e) {
                if (!(e instanceof ig.GraphError) || e.code !== 100) throw e;
            }
        }
    }
    return salida;
}

// Una publicación: reacciones, comentarios y compartidas (campos, siempre disponibles) + vistas/alcance/clics.
async function leerPublicacion(fetchFn, c, fbPostId) {
    const campos = await get(fetchFn, c, fbPostId, { fields: 'reactions.summary(true).limit(0),comments.summary(true).limit(0),shares' });
    const reacciones = Number(campos.reactions?.summary?.total_count) || 0;
    const comentarios = Number(campos.comments?.summary?.total_count) || 0;
    const compartidas = Number(campos.shares?.count) || 0;
    const ultimo = { likes: reacciones, comments: comentarios, shares: compartidas, total_interactions: reacciones + comentarios + compartidas };
    try {
        const ins = await pedirInsights(fetchFn, c, fbPostId, Object.keys(INSIGHTS_POST));
        for (const [fbNombre, nombre] of Object.entries(INSIGHTS_POST)) if (ins[fbNombre] !== null && ins[fbNombre] !== undefined) ultimo[nombre] = ins[fbNombre];
    } catch (err) {
        // Sin el permiso read_insights igual quedan reacciones, comentarios y compartidas.
        if (ig.clasificarErrorInsights(err) !== 'sin_permiso') throw err;
        ultimo.sinInsights = true;
    }
    return ultimo;
}

// Cada 30 min: la página del día y cada publicación de los últimos 14 días que ya toque medir.
async function actualizarMetricasFacebook(db, { nowMs = Date.now(), fetchFn = fetch } = {}) {
    const c = await fb.leerConexion(db);
    if (!c?.pageToken) return { ok: false, motivo: 'sin_conexion', actualizadas: 0 };
    const resumen = { ok: true, actualizadas: 0, sinPermiso: 0, errores: 0, seguidores: null };
    const fecha = cd.bogotaParts(nowMs).dateKey;

    try {
        const p = await get(fetchFn, c, c.pageId, { fields: 'fan_count,followers_count' });
        const dia = { fecha, atMs: nowMs, fans: Number(p.fan_count) || 0, seguidores: Number(p.followers_count) || Number(p.fan_count) || 0 };
        resumen.seguidores = dia.seguidores;
        try {
            const ins = await pedirInsights(fetchFn, c, `${c.pageId}`, Object.keys(INSIGHTS_PAGINA), { period: 'days_28' });
            for (const [fbNombre, nombre] of Object.entries(INSIGHTS_PAGINA)) if (ins[fbNombre] !== null && ins[fbNombre] !== undefined) dia[nombre] = ins[fbNombre];
        } catch (err) {
            dia.sinInsights = true;
            resumen.errorPagina = String(err.message || err).slice(0, 200);
        }
        await db.collection(PAGINA_COLLECTION).doc(fecha).set(dia, { merge: true });
        await db.collection(fb.CONFIG_COLLECTION).doc(fb.CONFIG_DOC).set({ fans: dia.fans }, { merge: true });
    } catch (err) {
        resumen.errorPagina = String(err.message || err).slice(0, 200);
    }

    const snap = await db.collection(ig.POSTS_COLLECTION).where('facebook.estado', '==', 'publicada').get();
    for (const doc of snap.docs) {
        const d = doc.data();
        const fbPostId = d.facebook?.fbPostId;
        const publicadaAtMs = Number(d.facebook?.publicadaAtMs) || 0;
        if (!fbPostId || (d.tipo !== 'foto' && d.tipo !== 'carrusel') || !publicadaAtMs) continue;
        if (nowMs - publicadaAtMs > VIGENCIA_MS + HORA_MS) continue;
        const ref = db.collection(METRICAS_COLLECTION).doc(fbPostId);
        const previo = (await ref.get()).data() || {};
        if (nowMs - (Number(previo.actualizadoAtMs) || 0) < ig.intervaloMedicionPostMs(nowMs - publicadaAtMs)) continue;
        let patch;
        try {
            const v = await leerPublicacion(fetchFn, c, fbPostId);
            const ultimo = { ...(previo.ultimo || {}), ...v };
            const punto = { atMs: nowMs, reach: ultimo.reach ?? null, views: ultimo.views ?? null };
            const ant = (previo.serie || [])[(previo.serie || []).length - 1];
            const cambio = !ant || ant.reach !== punto.reach || ant.views !== punto.views;
            patch = { ultimo, estado: 'ok', error: '', actualizadoAtMs: nowMs, serie: cambio ? [...(previo.serie || []), punto].slice(-60) : (previo.serie || []) };
            resumen.actualizadas += 1;
        } catch (err) {
            const estado = ig.clasificarErrorInsights(err);
            patch = { estado, error: String(err.message || err).slice(0, 300), actualizadoAtMs: nowMs };
            if (estado === 'sin_permiso') resumen.sinPermiso += 1; else resumen.errores += 1;
        }
        await ref.set({ fbPostId, postId: doc.id, tipo: d.tipo, publicadaAtMs, expiraAtMs: publicadaAtMs + VIGENCIA_MS, ...patch }, { merge: true });
    }
    return resumen;
}

module.exports = { METRICAS_COLLECTION, PAGINA_COLLECTION, INSIGHTS_POST, INSIGHTS_PAGINA, leerPublicacion, actualizarMetricasFacebook };
