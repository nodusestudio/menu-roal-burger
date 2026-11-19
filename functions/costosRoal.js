'use strict';
// Costos (app aparte, proyecto Firebase "fodexa-costos") -> FODEXA. SOLO LECTURA: Costos manda.
// La clave de la cuenta de servicio (rol Cloud Datastore Viewer) vive en el secret COSTOS_SA_KEY, nunca en el repo.
const EMPRESA = 'ZFFMcNHmXEx8Kwp2Pyt9';
const PROYECTO_COSTOS = 'fodexa-costos';

function _num(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
}

function _fechaIso(v) {
    if (!v) return null;
    if (typeof v.toDate === 'function') return v.toDate().toISOString();
    if (typeof v.seconds === 'number') return new Date(v.seconds * 1000).toISOString();
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

// Puro (con test): une productos + categorías y deja solo los campos que muestra el admin.
function armarCostos(productos, categorias) {
    const catNombre = new Map((categorias || []).map(c => [c.id, String(c.nombre || '').trim()]));
    return (productos || []).map(p => ({
        id: String(p.id),
        nombre: String(p.nombre || '').trim(),
        categoria: catNombre.get(p.categoriaId) || 'Sin categoría',
        activo: p.activo !== false,
        costoCalculado: _num(p.costoCalculado),
        precioVenta: _num(p.precioVenta),
        costoPct: _num(p.costoPct),
        costoActualizadoEn: _fechaIso(p.costoActualizadoEn)
    })).sort((a, b) => a.categoria.localeCompare(b.categoria, 'es') || a.nombre.localeCompare(b.nombre, 'es'));
}

let _dbCostos = null;
function _db(claveJson) {
    if (_dbCostos) return _dbCostos;
    const { initializeApp, cert, getApps, getApp } = require('firebase-admin/app');
    const { getFirestore } = require('firebase-admin/firestore');
    const nombre = 'costos-lectura';
    const app = getApps().some(a => a.name === nombre)
        ? getApp(nombre)
        : initializeApp({ credential: cert(JSON.parse(claveJson)), projectId: PROYECTO_COSTOS }, nombre);
    _dbCostos = getFirestore(app);
    return _dbCostos;
}

// Solo .get(): ninguna escritura contra fodexa-costos.
async function leerCostosRoal(claveJson, db) {
    const base = (db || _db(claveJson)).collection('empresas').doc(EMPRESA);
    const [prods, cats] = await Promise.all([
        base.collection('productos').get(),
        base.collection('categoriasProductos').get()
    ]);
    const lista = s => s.docs.map(d => ({ id: d.id, ...d.data() }));
    return armarCostos(lista(prods), lista(cats));
}

module.exports = { armarCostos, leerCostosRoal, EMPRESA };
