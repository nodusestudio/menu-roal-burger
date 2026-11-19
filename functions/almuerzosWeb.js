// Almuerzo Ejecutivo en pedidos del menú público: el servidor revalida lo elegido contra el menú del día y le pone al
// pedido la copia de costos/consumos de ESE momento (el navegador no puede leer costos). El núcleo de cálculo es
// functions/almuerzosCore.js, GENERADO desde src/js/almuerzos/core.js (npm run build) — no se edita a mano.
const core = require('./almuerzosCore.js');
const { obtenerCostoPorMenuId } = require('./costosFuente');

const ALMUERZO_MENU_ID = 'almuerzo-ejecutivo'; // producto del menú al que se enlazan los 6 almuerzos de Costos (config.productoMenuId lo puede cambiar)
const COSTOS_TIMEOUT_MS = 3000; // el pedido web no espera a Costos más que esto: si tarda o falla, queda el costo viejo
const pct1 = (n) => Math.round(n * 10) / 10;

// Costo del almuerzo por la fuente única: con enlaces en Costos ("nuevo") usa el costo del plato (proteína) que eligió el cliente
// y, si no se sabe cuál, el MÁS ALTO de los almuerzos enlazados (para no subestimar). Sin enlace o si Costos falla: el viejo.
// Solo cambia los costos del snapshot; los consumos de insumos y las piezas quedan como los calculó el motor viejo.
async function conCostoPorFuente(db, snap, menuId, leerNuevo) {
    const proteina = (snap.componentes || []).find((c) => c.categoria === 'proteina');
    const r = await obtenerCostoPorMenuId(menuId, {
        db, leerNuevo, variante: proteina && proteina.nombre, timeoutMs: COSTOS_TIMEOUT_MS,
        costoViejo: () => ({ costo: snap.costoColchon, costoReal: snap.costoReal })
    });
    if (!r || r.fuente !== 'nuevo') return { ...snap, costoFuente: 'viejo' };
    const costo = Math.round(r.costo), precio = snap.precio;
    return {
        ...snap, costoReal: costo, costoColchon: costo, utilidadBruta: precio - costo,
        margenPct: precio ? pct1(((precio - costo) / precio) * 100) : null, foodCostPct: precio ? pct1((costo / precio) * 100) : null,
        costoFuente: 'nuevo', costoNuevo: { costosId: r.costosId, plato: r.nombre, criterio: r.criterio, candidatos: r.candidatos },
        costoViejo: { costoReal: snap.costoReal, costoColchon: snap.costoColchon }
    };
}

const CATS = ['proteina', 'contorno', 'ensalada', 'bebida'];
const mapa = (snap) => Object.fromEntries(snap.docs.map((d) => [d.id, { id: d.id, ...d.data() }]));

/**
 * items = líneas ya valoradas del pedido. Devuelve las mismas líneas; las de almuerzo ganan `almuerzo` (snapshot) y
 * `optionLabel` armado con los nombres reales. Lanza Error con mensaje para el cliente si algo ya no está disponible.
 */
async function enriquecerItemsAlmuerzo(db, items, opts = {}) {
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
    const leerNuevo = opts.leerNuevo || (process.env.COSTOS_SA_KEY ? () => require('./costosRoal').leerCostosRoal(process.env.COSTOS_SA_KEY) : undefined);
    const menuId = cfg.productoMenuId || ALMUERZO_MENU_ID;
    return Promise.all(lista.map(async (it) => {
        const sel = it && it.orderOptions && it.orderOptions.almuerzo;
        if (!sel) return it;
        const seleccion = {};
        for (const k of CATS) if (sel[k] && sel[k].id) seleccion[k] = String(sel[k].id);
        const r = core.armarCombinacion({
            config: { nombre: cfg.nombre || 'Almuerzo Ejecutivo', precio: Number(it.unitPrice) || core.ALMUERZO_PRECIO, manoObra: Number(cfg.manoObra) || 0, arroz: cfg.arroz || {} },
            componentes, seleccion, ctx, colchonPct
        });
        if (!r.ok) throw new Error(`Tu almuerzo ya no se puede preparar: ${r.errores[0]}`);
        const snapshot = await conCostoPorFuente(db, r.snapshot, menuId, leerNuevo);
        return { ...it, optionLabel: core.etiquetaCombinacion(r.snapshot), almuerzo: snapshot };
    }));
}

module.exports = { enriquecerItemsAlmuerzo };
