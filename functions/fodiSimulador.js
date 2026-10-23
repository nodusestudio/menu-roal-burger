// FODI · calculadora de simulaciones ("¿y si…?") sobre la calculadora de costos propia.
// Núcleo puro (sin Firestore): recibe { insumos, recetas, platos } y devuelve antes/después por plato.
//   node --test --test-concurrency=1 tests/fodi-simulador.test.js
const { calcularPlatos } = require('./costos');

const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
const n = (v) => { const x = Number(v); return Number.isFinite(x) ? x : NaN; };

function buscarUno(lista, nombre, rotulo) {
    const q = norm(nombre);
    if (!q) return { error: `Falta el nombre del ${rotulo}.` };
    let h = lista.filter((x) => norm(x.nombre) === q);
    if (!h.length) h = lista.filter((x) => norm(x.nombre).includes(q));
    if (!h.length) return { error: `No hay ${rotulo} llamado "${nombre}".` };
    if (h.length > 1) return { error: `Varios ${rotulo}s coinciden con "${nombre}": ${h.slice(0, 8).map((x) => x.nombre).join('; ')}.` };
    return { item: h[0] };
}

// cambios: { insumos:[{nombre, variacion_pct | precio_nuevo}], platos:[{nombre, precio_nuevo}] }
function simular({ insumos = [], recetas = [], platos = [] }, cfg = {}, cambios = {}) {
    const colchonPct = Number(cfg.colchonPct) || 0, margenObjetivoPct = Number(cfg.margenObjetivoPct) || 0;
    const insumos2 = insumos.map((i) => ({ ...i })), platos2 = platos.map((p) => ({ ...p }));
    const aplicados = [];
    for (const c of Array.isArray(cambios.insumos) ? cambios.insumos : []) {
        const r = buscarUno(insumos2, c.nombre, 'insumo'); if (r.error) return { error: r.error };
        const i = r.item, antes = n(i.precioCompra);
        const nuevo = c.precio_nuevo != null ? n(c.precio_nuevo) : (c.variacion_pct != null ? antes * (1 + n(c.variacion_pct) / 100) : NaN);
        if (!(nuevo > 0) || !(antes > 0)) return { error: `Para "${i.nombre}" falta precio_nuevo o variacion_pct, o el insumo no tiene precio de compra.` };
        i.precioCompra = nuevo;
        aplicados.push({ tipo: 'insumo', nombre: i.nombre, antes, despues: Math.round(nuevo * 100) / 100 });
    }
    for (const c of Array.isArray(cambios.platos) ? cambios.platos : []) {
        const r = buscarUno(platos2, c.nombre, 'plato'); if (r.error) return { error: r.error };
        const nuevo = n(c.precio_nuevo);
        if (!(nuevo >= 0)) return { error: `precio_nuevo de "${r.item.nombre}" no es válido.` };
        aplicados.push({ tipo: 'plato', nombre: r.item.nombre, antes: n(r.item.precio) || 0, despues: nuevo });
        r.item.precio = nuevo;
    }
    if (!aplicados.length) return { error: 'No hay cambios que simular (insumos o platos).' };
    const a = calcularPlatos({ insumos, recetas, platos }, { colchonPct, margenObjetivoPct });
    const b = calcularPlatos({ insumos: insumos2, recetas, platos: platos2 }, { colchonPct, margenObjetivoPct });
    const filas = [];
    b.forEach((d, k) => {
        const x = a[k];
        if (d.costo === x.costo && d.precio === x.precio) return;
        filas.push({ plato: d.plato, activo: d.activo === true, precio_antes: x.precio, precio_despues: d.precio, costo_antes: x.costo, costo_despues: d.costo, margen_pct_antes: x.margen_pct, margen_pct_despues: d.margen_pct, fc_pct_antes: x.fc_pct, fc_pct_despues: d.fc_pct, precio_sugerido_despues: d.precio_sugerido, alerta_despues: d.alerta });
    });
    filas.sort((p, q) => (p.margen_pct_despues ?? 999) - (q.margen_pct_despues ?? 999));
    return { cambios_aplicados: aplicados, platos_afectados: filas.length, platos: filas.slice(0, 40), nota: 'Simulación en memoria: no se guardó nada. costo incluye el colchón.' };
}

async function simularCostos(db, args = {}) {
    const lee = (c) => db.collection(c).get().then((sn) => sn.docs.map((d) => ({ ...d.data(), id: d.id })));
    const [insumos, recetas, platos, cfgDoc] = await Promise.all([lee('costos_insumos'), lee('costos_recetas'), lee('costos_platos'), db.collection('costos_ajustes').doc('config').get()]);
    const cfg = cfgDoc.exists ? cfgDoc.data() : {};
    const r = simular({ insumos, recetas, platos }, cfg, { insumos: args.insumos, platos: args.platos });
    if (r.error) return r;
    if (args.solo_activos !== false) { r.platos = r.platos.filter((p) => p.activo); r.platos_afectados = r.platos.length; }
    return { ...r, margen_objetivo_pct: Number(cfg.margenObjetivoPct) || null };
}

const TOOL = {
    name: 'simular_costos',
    description: 'CALCULADORA DE SIMULACIONES ("¿y si…?"): calcula cómo quedarían costo, food cost y margen de los platos si cambia el precio de compra de insumos (precio_nuevo o variacion_pct, ej. +10) y/o el precio de venta de platos. No guarda nada. Úsala para "¿qué pasa si sube la carne 10 %?", "¿a cuánto debo vender X para tener 30 % de margen?" (combínala con calcular). Por defecto solo platos activos.',
    input_schema: { type: 'object', properties: {
        insumos: { type: 'array', maxItems: 15, items: { type: 'object', properties: { nombre: { type: 'string' }, variacion_pct: { type: 'number', description: 'Cambio porcentual del precio de compra (+10, -5).' }, precio_nuevo: { type: 'number', description: 'Nuevo precio de compra del empaque, en pesos.' } }, required: ['nombre'] } },
        platos: { type: 'array', maxItems: 15, items: { type: 'object', properties: { nombre: { type: 'string' }, precio_nuevo: { type: 'number' } }, required: ['nombre', 'precio_nuevo'] } },
        solo_activos: { type: 'boolean', description: 'false para incluir también platos en estudio.' }
    } }
};

module.exports = { simular, simularCostos, TOOL };
