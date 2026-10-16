'use strict';
// Base de conocimiento de FODI (RAG ligero, sin dependencias ni claves): documentos que pega el dueño
// (políticas, FAQ, proveedores, apuntes) + los módulos académicos. Se parten en trozos y se buscan con BM25
// sobre palabras normalizadas (sin tildes, raíz simple y sinónimos). Las consultas sin resultado se registran
// para saber qué documento falta cargar.
const MAX_DOCS = 100;
const MAX_TEXTO = 8000;
const CHUNK_PALABRAS = 170;

const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9ñ]+/g, ' ').trim();
const STOP = new Set('a al algo ante con contra cual cuales cuando de del desde donde el ella ellos en entre es esa ese eso esta este esto la las le les lo los me mi mis mucho muy nos o para pero por que se si sin sobre su sus te tu tus un una uno unos y ya como hay son ser fue cuanto cuantos cuanta cuantas puedo debo quiero tengo dime dame hacer'.split(' '));
// Grupos de sinónimos: cualquier palabra del grupo expande a todas
const SINONIMOS = [
    ['demora', 'tardanza', 'tarde', 'retraso', 'tardo', 'demoro', 'lento'], ['queja', 'reclamo', 'molesto', 'inconformidad', 'disgusto'],
    ['precio', 'valor', 'tarifa', 'costo', 'cobro', 'cuesta'], ['domicilio', 'entrega', 'envio', 'despacho', 'domiciliario'],
    ['devolucion', 'reembolso', 'compensacion', 'reponer', 'reposicion'], ['empleado', 'personal', 'trabajador', 'colaborador', 'equipo'],
    ['impuesto', 'iva', 'inc', 'dian', 'tributario'], ['cliente', 'comprador', 'consumidor', 'usuario'], ['promo', 'promocion', 'descuento', 'combo', 'oferta'],
    ['proveedor', 'surtidor', 'distribuidor'], ['horario', 'hora', 'abrir', 'cerrar', 'apertura', 'cierre'], ['pago', 'pagar', 'transferencia', 'nequi', 'daviplata', 'efectivo'],
    ['ganancia', 'utilidad', 'margen', 'rentabilidad'], ['inventario', 'stock', 'existencias', 'insumo']
];
const SIN_MAPA = new Map();
for (const g of SINONIMOS) for (const w of g) SIN_MAPA.set(stem(w), g.map(stem));
function stem(w) { return w.length > 4 ? w.replace(/(es|s)$/, '') : w; }

function tokens(texto, expandir = false) {
    const out = [];
    for (const w of norm(texto).split(' ')) {
        if (!w || w.length < 2 || STOP.has(w)) continue;
        const s = stem(w);
        out.push(s);
        if (expandir && SIN_MAPA.has(s)) for (const x of SIN_MAPA.get(s)) if (x !== s) out.push(x);
    }
    return out;
}

/** Parte un texto en trozos de ~CHUNK_PALABRAS palabras respetando párrafos y viñetas. */
function trocear(texto) {
    const bloques = String(texto || '').split(/\n{2,}|\n(?=\s*[-•*\d]+[.)]?\s)/).map((b) => b.trim()).filter(Boolean);
    const trozos = []; let actual = [];
    const n = (arr) => arr.join(' ').split(/\s+/).length;
    for (const b of bloques) {
        if (actual.length && n(actual) + b.split(/\s+/).length > CHUNK_PALABRAS) { trozos.push(actual.join('\n')); actual = []; }
        actual.push(b);
    }
    if (actual.length) trozos.push(actual.join('\n'));
    return trozos;
}

/** Trozos de los módulos académicos (una viñeta = un trozo). */
function trozosAcademicos() {
    const { AREAS } = require('./fodiConocimiento');
    const out = [];
    for (const [id, a] of Object.entries(AREAS)) for (const linea of a.texto.split('\n').filter((l) => l.trim())) out.push({ fuente: `Módulo académico: ${a.titulo}`, tipo: 'academico', texto: linea.replace(/^-\s*/, '').trim() });
    return out;
}

let _cache = { ms: 0, trozos: null };
async function cargarTrozos(db, fresco = false) {
    if (!fresco && _cache.trozos && Date.now() - _cache.ms < 60000) return _cache.trozos;
    const sn = await db.collection('fodi_base').get();
    const propios = [];
    for (const d of sn.docs) {
        const x = d.data();
        for (const t of trocear(x.texto)) propios.push({ fuente: `Tu base: ${x.titulo}`, tipo: 'propio', texto: t });
    }
    _cache = { ms: Date.now(), trozos: [...propios, ...trozosAcademicos()] };
    return _cache.trozos;
}

function puntuar(trozos, consulta) {
    const q = [...new Set(tokens(consulta, true))];
    if (!q.length) return [];
    const docs = trozos.map((t) => ({ t, toks: tokens(`${t.fuente} ${t.texto}`) }));
    const N = docs.length, avg = docs.reduce((s, d) => s + d.toks.length, 0) / Math.max(1, N);
    const df = new Map();
    for (const w of q) df.set(w, docs.filter((d) => d.toks.includes(w)).length);
    const k1 = 1.4, b = 0.75;
    const res = docs.map(({ t, toks }) => {
        const tf = new Map(); for (const w of toks) tf.set(w, (tf.get(w) || 0) + 1);
        let s = 0;
        for (const w of q) {
            const f = tf.get(w) || 0; if (!f) continue;
            const idf = Math.log(1 + (N - df.get(w) + 0.5) / (df.get(w) + 0.5));
            s += idf * ((f * (k1 + 1)) / (f + k1 * (1 - b + b * (toks.length / avg))));
        }
        if (t.tipo === 'propio') s *= 1.25; // lo que el dueño escribió pesa más que la teoría general
        return { ...t, score: s };
    });
    return res.filter((r) => r.score > 0).sort((x, y) => y.score - x.score);
}

const UMBRAL = 1.2;
async function buscar(db, consulta, k = 4) {
    const q = String(consulta || '').trim().slice(0, 300);
    if (!q) return { error: 'Falta la consulta.' };
    const trozos = await cargarTrozos(db);
    const top = puntuar(trozos, q).slice(0, Math.min(Math.max(k, 1), 6));
    if (!top.length || top[0].score < UMBRAL) {
        const id = norm(q).slice(0, 80).replace(/ /g, '_');
        if (id) db.collection('fodi_busquedas_sin_resultado').doc(id).set({ consulta: q, veces: require('firebase-admin').firestore.FieldValue.increment(1), ultimaMs: Date.now() }, { merge: true }).catch(() => {});
        return { encontrados: 0, nota: 'No hay nada relevante en la base de conocimiento sobre esto. Responde con tu criterio general, dilo con claridad y sugiere al dueño documentar este tema en la base (queda registrado).' };
    }
    return { encontrados: top.length, resultados: top.map((r) => ({ fuente: r.fuente, texto: r.texto.slice(0, 900), relevancia: Math.round(r.score * 10) / 10 })), nota: 'Cita la fuente cuando uses un resultado ("según tu base: …"). Lo de "Tu base" son reglas del dueño y mandan sobre la teoría general.' };
}

// ───── CRUD para el panel del admin ─────
async function listar(db) {
    const sn = await db.collection('fodi_base').get();
    const docs = sn.docs.map((d) => ({ id: d.id, titulo: d.data().titulo, categoria: d.data().categoria || '', texto: d.data().texto, actualizadoMs: d.data().actualizadoMs || 0 })).sort((a, b) => b.actualizadoMs - a.actualizadoMs);
    const ss = await db.collection('fodi_busquedas_sin_resultado').orderBy('ultimaMs', 'desc').limit(15).get();
    return { docs, sinResultado: ss.docs.map((d) => ({ id: d.id, consulta: d.data().consulta, veces: d.data().veces || 1 })) };
}
async function guardar(db, d) {
    const titulo = String(d.titulo || '').trim().slice(0, 120), texto = String(d.texto || '').trim().slice(0, MAX_TEXTO);
    if (!titulo || texto.length < 20) return { error: 'Pon un título y un texto de al menos 20 caracteres.' };
    const col = db.collection('fodi_base');
    if (d.id) { await col.doc(String(d.id)).set({ titulo, texto, categoria: String(d.categoria || '').slice(0, 40), actualizadoMs: Date.now() }, { merge: true }); }
    else {
        if ((await col.get()).size >= MAX_DOCS) return { error: `Máximo ${MAX_DOCS} documentos.` };
        await col.add({ titulo, texto, categoria: String(d.categoria || '').slice(0, 40), creadaMs: Date.now(), actualizadoMs: Date.now() });
    }
    _cache = { ms: 0, trozos: null };
    return { ok: true };
}
async function borrar(db, id) {
    if (!id) return { error: 'Falta el documento.' };
    await db.collection('fodi_base').doc(String(id)).delete();
    _cache = { ms: 0, trozos: null };
    return { ok: true };
}
async function limpiarSinResultado(db, id) {
    if (id) await db.collection('fodi_busquedas_sin_resultado').doc(String(id)).delete();
    return { ok: true };
}

module.exports = { norm, tokens, trocear, trozosAcademicos, puntuar, buscar, listar, guardar, borrar, limpiarSinResultado, UMBRAL };
