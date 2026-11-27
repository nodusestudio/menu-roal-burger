'use strict';

// Publicaciones de TODO tipo (post, carrusel, historia, reel) para el conector de Claude (fodexaMcp.js).
// Usa las mismas funciones y la misma colección (`instagram_posts`) que el panel FODEXA → Redes: lo que se cree aquí se ve
// y se edita igual en el panel, y lo publica el mismo cron (publicarPostsProgramados). Sin restricciones por tipo.

const { HttpsError } = require('firebase-functions/v2/https');
const posts = require('./instagramPosts');
const api = require('./reelsApi');

const TIPOS = Object.freeze(['foto', 'carrusel', 'historia', 'reel']);
// Nombres que se aceptan (y los que usa el panel): "post" = foto.
const ALIAS_TIPO = { post: 'foto', publicacion: 'foto', 'publicación': 'foto', foto: 'foto', imagen: 'foto', carrusel: 'carrusel', carousel: 'carrusel', historia: 'historia', story: 'historia', reel: 'reel' };
const MAX_IMAGEN_BYTES = 25 * 1024 * 1024; // lo que se baja (se reduce a ≤ 900 KB antes de guardarla)
const OBJETIVO_JPEG = 860 * 1024;

function normalizarTipo(t) {
    const k = String(t ?? '').trim().toLowerCase();
    const tipo = ALIAS_TIPO[k];
    if (!tipo) throw new HttpsError('invalid-argument', 'Elige el tipo: post (foto), carrusel, historia o reel.');
    return tipo;
}

// ── Imágenes ─────────────────────────────────────────────────────────────────

// Convierte cualquier imagen (JPG, PNG, WebP…) al JPEG que acepta Instagram, según el tipo:
//  · historia → 1080x1920 (9:16); si la foto no es vertical queda centrada sobre su propio fondo difuminado.
//  · post/carrusel → ratio entre 4:5 y 1,91:1 (se recorta lo mínimo) y ancho de hasta 1080.
async function imagenAJpeg(buffer, tipo, { sharp } = {}) {
    let S = sharp;
    if (!S) {
        try { S = require('sharp'); } catch { throw new HttpsError('failed-precondition', 'El servidor no puede convertir imágenes en este momento. Pasa un JPEG ya listo.'); }
    }
    let meta;
    try { meta = await S(buffer, { failOn: 'none' }).rotate().metadata(); } catch { throw new HttpsError('invalid-argument', 'Eso no es una imagen válida (usa JPG, PNG o WebP).'); }
    const ancho = meta.width || 0;
    const alto = meta.height || 0;
    if (!ancho || !alto) throw new HttpsError('invalid-argument', 'No se pudo leer el tamaño de la imagen.');
    if (ancho < 320) throw new HttpsError('invalid-argument', `La imagen es muy pequeña (${ancho} px de ancho; mínimo 320).`);

    const base = S(buffer, { failOn: 'none' }).rotate().flatten({ background: '#ffffff' });
    const comprimir = async (img) => {
        for (const q of [88, 80, 72, 64, 56, 48]) {
            const out = await img.clone().jpeg({ quality: q, mozjpeg: true }).toBuffer();
            if (out.length <= OBJETIVO_JPEG) return out;
        }
        throw new HttpsError('invalid-argument', 'No se pudo reducir la imagen al peso permitido (900 KB). Prueba con una más simple.');
    };

    if (tipo === 'historia') {
        const W = 1080, H = 1920;
        const ratio = ancho / alto;
        if (ratio >= 0.5 && ratio <= 0.7) return comprimir(base.resize(W, H, { fit: 'cover' }));
        const fondo = await base.clone().resize(W, H, { fit: 'cover' }).blur(40).modulate({ brightness: 0.7 }).toBuffer();
        const frente = await base.clone().resize(W, H, { fit: 'inside', withoutEnlargement: false }).toBuffer();
        return comprimir(S(fondo).composite([{ input: frente, gravity: 'centre' }]));
    }

    const ratio = ancho / alto;
    const MIN = 0.8, MAX = 1.91;
    const objetivo = Math.min(Math.max(ratio, MIN), MAX);
    const W = Math.min(ancho, 1080);
    const H = Math.round(W / objetivo);
    return comprimir(base.resize(W, H, { fit: ratio === objetivo ? 'fill' : 'cover', position: 'centre' }));
}

// Baja una imagen pública (https) y la agrega a la publicación `id` (post: 1, historia: 1, carrusel: 2 a 10).
async function agregarImagenDesdeUrl(db, { id, url }, uid, { fetchFn = fetch, sharp } = {}) {
    const dir = api.urlExternaSegura(url);
    const post = await posts.leerPost(db, String(id || ''));
    if (post.tipo === 'reel') throw new HttpsError('failed-precondition', 'Un reel lleva un video, no imágenes.');
    const r = await fetchFn(dir, { redirect: 'follow' });
    if (!r.ok) throw new HttpsError('failed-precondition', `No se pudo bajar la imagen (respuesta ${r.status}).`);
    const largo = Number(r.headers.get('content-length')) || 0;
    if (largo > MAX_IMAGEN_BYTES) throw new HttpsError('invalid-argument', `La imagen pesa ${Math.round(largo / 1048576)} MB: el máximo es ${MAX_IMAGEN_BYTES / 1048576} MB.`);
    const buf = Buffer.from(await r.arrayBuffer());
    if (!buf.length) throw new HttpsError('invalid-argument', 'La imagen bajada está vacía.');
    if (buf.length > MAX_IMAGEN_BYTES) throw new HttpsError('invalid-argument', `La imagen pesa ${Math.round(buf.length / 1048576)} MB: el máximo es ${MAX_IMAGEN_BYTES / 1048576} MB.`);
    const jpeg = await imagenAJpeg(buf, post.tipo, { sharp });
    return posts.guardarImagen(db, { id: post.id, jpeg }, uid);
}

// ── Crear / programar ────────────────────────────────────────────────────────

function camposDe(a) {
    const c = {};
    if (a.texto !== undefined || a.caption !== undefined) c.caption = String(a.texto ?? a.caption ?? '');
    if (a.hashtags !== undefined) c.hashtags = a.hashtags;
    if (a.facebook !== undefined) c.facebook = a.facebook === true;
    if (a.textoAlternativo !== undefined) c.altText = String(a.textoAlternativo || '');
    return c;
}

// Crea una publicación completa de una vez: borrador + imágenes o video + (si traes "cuando") programada.
// Si algo falla, no deja un borrador a medias (cuando la creó esta llamada).
async function crear(db, a, uid, opts = {}) {
    const tipo = normalizarTipo(a.tipo);
    const imagenes = Array.isArray(a.imagenes) ? a.imagenes : (a.imagenes ? [a.imagenes] : []);
    const cuando = a.cuando ?? a.fecha;
    const ms = cuando === undefined || cuando === '' ? null : api.parseFecha(cuando);
    if (cuando !== undefined && cuando !== '' && !Number.isFinite(ms)) throw new HttpsError('invalid-argument', 'No entendí la fecha (ejemplo: "2026-12-05 18:30", hora de Colombia).');
    if (tipo === 'reel' && imagenes.length) throw new HttpsError('invalid-argument', 'Un reel lleva un video, no imágenes.');
    if (tipo !== 'reel' && tipo !== 'historia' && a.videoUrl) throw new HttpsError('invalid-argument', 'Solo los reels y las historias llevan video.');
    if (tipo === 'historia' && imagenes.length && a.videoUrl) throw new HttpsError('invalid-argument', 'Una historia lleva una imagen o un video, no los dos.');
    if (tipo === 'foto' && imagenes.length > 1) throw new HttpsError('invalid-argument', 'Un post lleva 1 imagen. Para varias usa tipo "carrusel".');
    if (tipo === 'carrusel' && (imagenes.length < 2 || imagenes.length > 10)) throw new HttpsError('invalid-argument', 'Un carrusel lleva de 2 a 10 imágenes.');
    if (tipo === 'historia' && imagenes.length > 1) throw new HttpsError('invalid-argument', 'Una historia lleva 1 imagen o 1 video.');

    const { id } = await posts.guardarPost(db, { tipo, origen: 'manual', ...camposDe(a) }, uid);
    try {
        for (const url of imagenes) await agregarImagenDesdeUrl(db, { id, url }, uid, opts);
        if (a.videoUrl) await api.importarVideoDesdeUrl(db, { id, url: a.videoUrl }, uid, opts);
        if (ms !== null) {
            if (tipo === 'reel' || (tipo === 'historia' && !imagenes.length)) await api.asegurarVideo(db, id, uid, opts);
            await posts.programarPost(db, { id, programadaAtMs: ms }, uid);
        }
    } catch (err) {
        await posts.borrarPost(db, { id }).catch(() => {});
        throw err;
    }
    const r = await estado(db, { id, baseUrl: opts.baseUrl });
    return ms === null ? { ...r, siguiente: tipo === 'reel' || tipo === 'historia' ? 'Borrador creado. Sube el video con subir_video/agregar_imagen según el tipo y luego programa con programar_publicacion.' : 'Borrador creado. Agrega las imágenes con agregar_imagen y luego programa con programar_publicacion.' } : r;
}

// Programa (o reprograma) una publicación que ya existe; puede cambiar texto, hashtags y Facebook en el mismo paso.
async function programar(db, a, uid, opts = {}) {
    const id = String(a.id || '');
    const ms = api.parseFecha(a.cuando ?? a.fecha);
    if (!Number.isFinite(ms)) throw new HttpsError('invalid-argument', 'Falta la fecha y hora (ejemplo: "2026-12-05 18:30", hora de Colombia).');
    const p = await posts.leerPost(db, id);
    const campos = camposDe(a);
    if (Object.keys(campos).length) await posts.guardarPost(db, { id, ...campos }, uid);
    if (p.tipo === 'reel' || (p.tipo === 'historia' && !(p.imagenes || []).length)) await api.asegurarVideo(db, id, uid, opts);
    await posts.programarPost(db, { id, programadaAtMs: ms }, uid);
    return estado(db, { id, baseUrl: opts.baseUrl });
}

async function editar(db, a, uid, opts = {}) {
    const id = String(a.id || '');
    const p = await posts.leerPost(db, id);
    if (!['programada', 'borrador', 'error'].includes(p.estado)) throw new HttpsError('failed-precondition', `Una publicación ${api.NOMBRE_ESTADO?.[p.estado] || p.estado} no se puede editar.`);
    const campos = camposDe(a);
    const nueva = a.cuando ?? a.fecha;
    if (!Object.keys(campos).length && nueva === undefined) throw new HttpsError('invalid-argument', 'No indicaste nada que cambiar (texto, hashtags, Facebook o fecha).');
    const eraProgramada = p.estado === 'programada';
    if (Object.keys(campos).length) await posts.guardarPost(db, { id, ...campos }, uid);
    const ms = nueva !== undefined ? api.parseFecha(nueva) : (eraProgramada ? p.programadaAtMs : NaN);
    if (nueva !== undefined && !Number.isFinite(ms)) throw new HttpsError('invalid-argument', 'No entendí la fecha (ejemplo: "2026-12-05 18:30", hora de Colombia).');
    if (Number.isFinite(ms)) await posts.programarPost(db, { id, programadaAtMs: ms }, uid);
    return estado(db, { id, baseUrl: opts.baseUrl });
}

async function cancelar(db, { id }, uid, opts = {}) {
    const p = await posts.leerPost(db, String(id || ''));
    await posts.cancelarPost(db, { id: p.id }, uid);
    if (p.video) {
        await require('./reels').borrarVideo(p.id).catch(() => {});
        await db.collection('instagram_posts').doc(p.id).set({ video: { ...p.video, borrado: true } }, { merge: true });
    }
    return estado(db, { id: p.id, baseUrl: opts.baseUrl });
}

// ── Leer ─────────────────────────────────────────────────────────────────────

async function estado(db, { id, baseUrl }) {
    const p = await posts.leerPost(db, String(id || ''));
    const errVideo = await api.ensamblarPendiente(db, p);
    const base = await api.estado(db, { id: p.id, baseUrl, cualquiera: true });
    return { ...base, ...(errVideo ? { errorVideo: errVideo } : {}) };
}

async function listar(db, { tipo, estado: est, limite = 20, baseUrl } = {}) {
    const t = tipo && String(tipo).toLowerCase() !== 'todos' ? normalizarTipo(tipo) : null;
    const r = await api.listar(db, { estado: est, limite, baseUrl, tipo: t || 'todos' });
    return { total: r.total, publicaciones: r.reels };
}

module.exports = { TIPOS, normalizarTipo, imagenAJpeg, agregarImagenDesdeUrl, crear, programar, editar, cancelar, estado, listar };
