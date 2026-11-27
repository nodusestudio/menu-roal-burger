'use strict';

// Herramienta de FODI para los reels de Instagram: listar, ver estado y métricas, programar, editar y cancelar.
// Usa reelsApi.js (las mismas funciones del panel y del conector de Claude): nada sale a Instagram aquí, solo se
// programa; la publicación la hace el cron `publicarPostsProgramados` a la hora elegida.

const reelsApi = require('./reelsApi');

const baseUrl = () => process.env.HISTORIA_IMAGEN_URL
    || `https://us-central1-${process.env.GCLOUD_PROJECT || 'roal-burger-menu'}.cloudfunctions.net/historiaImagen`;

async function reels(db, args = {}) {
    const accion = String(args.accion || 'listar');
    const opts = { baseUrl: baseUrl() };
    try {
        if (accion === 'listar') return await reelsApi.listar(db, { estado: args.estado, limite: args.limite, baseUrl: opts.baseUrl });
        if (accion === 'estado') return await reelsApi.estado(db, { id: args.id, baseUrl: opts.baseUrl });
        if (accion === 'programar') return { ok: true, reel: await reelsApi.programar(db, args, 'fodi', opts) };
        if (accion === 'editar') return { ok: true, reel: await reelsApi.editar(db, args, 'fodi', opts) };
        if (accion === 'cancelar') return { ok: true, reel: await reelsApi.cancelar(db, args, 'fodi', opts) };
        return { error: 'accion desconocida.' };
    } catch (err) {
        return { error: String(err?.message || err).slice(0, 300) };
    }
}

module.exports = { reels, baseUrl };
