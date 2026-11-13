// Almuerzo Ejecutivo en pedidos del menú público: el servidor revalida lo elegido contra el menú del día y le pone al
// pedido la copia de costos/consumos de ESE momento (el navegador no puede leer costos). El núcleo de cálculo es
// functions/almuerzosCore.js, GENERADO desde src/js/almuerzos/core.js (npm run build) — no se edita a mano.
const core = require('./almuerzosCore.js');

const CATS = ['proteina', 'contorno', 'ensalada', 'bebida'];
const mapa = (snap) => Object.fromEntries(snap.docs.map((d) => [d.id, { id: d.id, ...d.data() }]));

/**
 * items = líneas ya valoradas del pedido. Devuelve las mismas líneas; las de almuerzo ganan `almuerzo` (snapshot) y
 * `optionLabel` armado con los nombres reales. Lanza Error con mensaje para el cliente si algo ya no está disponible.
 */
async function enriquecerItemsAlmuerzo(db, items) {
    const lista = Array.isArray(items) ? items : [];
    if (!lista.some((i) => i && i.orderOptions && i.orderOptions.almuerzo)) return lista;
    const [comps, cfgDoc, insumos, recetas, ajustes] = await Promise.all([
        db.collection('almuerzo_componentes').get(), db.collection('almuerzo_config').doc('main').get(),
        db.collection('costos_insumos').get(), db.collection('costos_recetas').get(), db.collection('costos_ajustes').doc('config').get()
    ]);
    const componentes = Object.values(mapa(comps));
    const cfg = cfgDoc.exists ? cfgDoc.data() : {};
    const ctx = { insumos: mapa(insumos), recetas: mapa(recetas) };
    const colchonPct = Number((ajustes.exists ? ajustes.data() : {}).colchonPct) || 30;
    return lista.map((it) => {
        const sel = it && it.orderOptions && it.orderOptions.almuerzo;
        if (!sel) return it;
        const seleccion = {};
        for (const k of CATS) if (sel[k] && sel[k].id) seleccion[k] = String(sel[k].id);
        const r = core.armarCombinacion({
            config: { nombre: cfg.nombre || 'Almuerzo Ejecutivo', precio: Number(it.unitPrice) || core.ALMUERZO_PRECIO, manoObra: Number(cfg.manoObra) || 0, arroz: cfg.arroz || {} },
            componentes, seleccion, ctx, colchonPct
        });
        if (!r.ok) throw new Error(`Tu almuerzo ya no se puede preparar: ${r.errores[0]}`);
        return { ...it, optionLabel: core.etiquetaCombinacion(r.snapshot), almuerzo: r.snapshot };
    });
}

module.exports = { enriquecerItemsAlmuerzo };
