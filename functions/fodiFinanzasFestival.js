// FODI · finanzas de Sabe a Quindío (Burger Trifásica): ventas, costo de producción, utilidad y reparto de la
// utilidad (sueldos / reserva / libre). Solo LECTURA. Mismo criterio que Métricas → 💰 Finanzas del panel:
// costo = plato "Burger TRIFASICA" de Costos y recetas (con colchón), un 2×1 cuenta 2 hamburguesas.

const { costoPlato } = require('./costos');

const INICIO_MS = Date.parse('2026-10-30T00:00:00-05:00');
const norm = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const aMapa = (arr) => Object.fromEntries(arr.map((x) => [x.id, x]));
const lista = async (db, col) => (await db.collection(col).get()).docs.map((d) => ({ id: d.id, ...d.data() }));
const esTrifasica = (it) => norm(it.productName).includes('trifasica');
const es2x1 = (it) => { const o = it.orderOptions || {}; return o.promo2x1 === true || /2\s*[x×]\s*1/i.test(String(o.promoLabel || it.optionLabel || '')); };

async function finanzasFestival(db) {
    const [productos, insumos, recetas, platos, ajustes, cfgFin, a, b] = await Promise.all([
        lista(db, 'productos'), lista(db, 'costos_insumos'), lista(db, 'costos_recetas'), lista(db, 'costos_platos'),
        db.collection('costos_ajustes').doc('config').get(), db.collection('configuracion').doc('finanzas_festival').get(),
        db.collection('pedidos').where('createdAt', '>=', new Date(INICIO_MS)).get(),
        db.collection('pedidos_archivados').where('createdAt', '>=', new Date(INICIO_MS)).get()
    ]);
    const porId = new Map();
    [...a.docs, ...b.docs].forEach((d) => porId.set(d.id, d.data()));
    const pedidos = [...porId.values()].filter((o) => !o.anulado && !o.voided);

    let unidades = 0, hamburguesas = 0, ventas = 0, regaladas = 0;
    for (const o of pedidos) {
        for (const it of (o.items || [])) {
            if (!esTrifasica(it)) continue;
            const q = Number(it.quantity || 0);
            if (q <= 0) continue;
            const burgers = es2x1(it) ? q * 2 : q;
            unidades += q; hamburguesas += burgers; ventas += Number(it.subtotal || 0);
            if (it.cortesia === true) regaladas += burgers;
        }
    }

    const prod = productos.find((p) => { const n = norm(p.nombre); return n.includes('trifasica') && !n.includes('mini'); });
    const plato = prod ? platos.find((p) => p.productoMenuId === prod.id) : null;
    const colchonPct = Number(ajustes.exists ? ajustes.data().colchonPct : 30) || 30;
    const sueldosPct = cfgFin.exists && Number.isFinite(Number(cfgFin.data().sueldosPct)) ? Number(cfgFin.data().sueldosPct) : 30;
    const reservaPct = cfgFin.exists && Number.isFinite(Number(cfgFin.data().reservaPct)) ? Number(cfgFin.data().reservaPct) : 20;

    const base = { desde: '2026-10-30', trifasicas_vendidas: unidades, hamburguesas_entregadas: hamburguesas, hamburguesas_de_cortesia: regaladas, ventas_trifasica: ventas };
    if (!plato) return { ...base, aviso: 'No hay costo: en Costos y recetas falta vincular el plato "Burger TRIFASICA" con su producto del menú, así que no se puede calcular costo ni utilidad.' };

    const c = costoPlato(plato, { insumos: aMapa(insumos), recetas: aMapa(recetas) }, colchonPct);
    const costo = c.costo * hamburguesas, costoReal = c.costo_real * hamburguesas;
    const utilidad = ventas - costo;
    const reparto = (pct) => Math.round(Math.max(0, utilidad) * pct / 100);
    return {
        ...base,
        costo_por_hamburguesa_con_colchon: c.costo, costo_por_hamburguesa_real: c.costo_real,
        costo_total_con_colchon: costo, costo_total_real: costoReal,
        utilidad, utilidad_con_costo_real: ventas - costoReal,
        margen_pct: ventas > 0 ? Math.round((utilidad / ventas) * 1000) / 10 : 0,
        reparto_utilidad: { sueldos_pct: sueldosPct, sueldos: reparto(sueldosPct), reserva_pct: reservaPct, reserva: reparto(reservaPct), libre_pct: Math.max(0, 100 - sueldosPct - reservaPct), libre: reparto(Math.max(0, 100 - sueldosPct - reservaPct)) },
        faltantes_en_receta: c.faltantes,
        nota: 'Solo la Trifásica (sin combos, bebidas ni empaque del 2×1). No resta costos fijos. Los % de reparto se editan en Métricas → Finanzas. Con pocos pedidos no es concluyente: dilo.'
    };
}

const TOOL = {
    name: 'finanzas_festival',
    description: 'FINANZAS de Sabe a Quindío / Burger Trifásica desde el 30 de octubre: cuántas se vendieron, ventas, costo de producción, utilidad, margen y cómo se reparte la utilidad (sueldos del equipo, reserva y libre). Úsala para "¿cuánto hemos ganado con la Trifásica?", "¿cuánto va para sueldos y reserva?" y el informe final del festival.',
    input_schema: { type: 'object', properties: {} }
};

module.exports = { finanzasFestival, TOOL };
