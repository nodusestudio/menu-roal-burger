// FODI · finanzas de Sabe a Quindío (Burger Trifásica): ventas, costo de producción, utilidad y reparto de la
// utilidad (sueldos / reserva / libre), TOTAL y DÍA POR DÍA (cuánto toca guardar cada día y el acumulado). Solo LECTURA.
// Mismo criterio que Métricas → 💰 Finanzas del panel: costo = plato "Burger TRIFASICA" de Costos y recetas (con
// colchón), un 2×1 cuenta 2 hamburguesas, y el reparto se redondea POR DÍA (los totales son la suma de los días).

const { costoPlato } = require('./costos');

const BURGERS_POR_RECETA = 2; // la receta "Burger TRIFASICA" lleva 2 panes y 300 g de carne (150 g c/u): rinde 2 hamburguesas
const INICIO_MS = Date.parse('2026-10-30T00:00:00-05:00');
const DIA_MS = 86400000;
const norm = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const aMapa = (arr) => Object.fromEntries(arr.map((x) => [x.id, x]));
const lista = async (db, col) => (await db.collection(col).get()).docs.map((d) => ({ id: d.id, ...d.data() }));
const esTrifasica = (it) => norm(it.productName).includes('trifasica');
const es2x1 = (it) => { const o = it.orderOptions || {}; return o.promo2x1 === true || /2\s*[x×]\s*1/i.test(String(o.promoLabel || it.optionLabel || '')); };
const diaBogota = (ms) => new Date(ms).toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
const msDe = (c) => (c && typeof c.toMillis === 'function' ? c.toMillis() : (c && (c.seconds || c._seconds) ? (c.seconds || c._seconds) * 1000 : Number(c) || 0));

async function finanzasFestival(db, ahora = Date.now()) {
    const [productos, insumos, recetas, platos, ajustes, cfgFin, a, b] = await Promise.all([
        lista(db, 'productos'), lista(db, 'costos_insumos'), lista(db, 'costos_recetas'), lista(db, 'costos_platos'),
        db.collection('costos_ajustes').doc('config').get(), db.collection('configuracion').doc('finanzas_festival').get(),
        db.collection('pedidos').where('createdAt', '>=', new Date(INICIO_MS)).get(),
        db.collection('pedidos_archivados').where('createdAt', '>=', new Date(INICIO_MS)).get()
    ]);
    const porId = new Map();
    [...a.docs, ...b.docs].forEach((d) => porId.set(d.id, d.data()));
    const pedidos = [...porId.values()].filter((o) => !o.anulado && !o.voided);

    // Un renglón por día desde el 30 de octubre hasta hoy (los días sin ventas salen en cero).
    const porDia = new Map();
    for (let t = INICIO_MS + 3600000; diaBogota(t) <= diaBogota(ahora); t += DIA_MS) porDia.set(diaBogota(t), { dia: diaBogota(t), unidades: 0, hamburguesas: 0, ventas: 0 });
    let regaladas = 0;
    for (const o of pedidos) {
        const k = diaBogota(msDe(o.createdAt) || INICIO_MS);
        if (!porDia.has(k)) porDia.set(k, { dia: k, unidades: 0, hamburguesas: 0, ventas: 0 });
        const d = porDia.get(k);
        for (const it of (o.items || [])) {
            if (!esTrifasica(it)) continue;
            const q = Number(it.quantity || 0);
            if (q <= 0) continue;
            const burgers = es2x1(it) ? q * 2 : q;
            d.unidades += q; d.hamburguesas += burgers; d.ventas += Number(it.subtotal || 0);
            if (it.cortesia === true) regaladas += burgers;
        }
    }
    const dias = [...porDia.values()].sort((x, y) => (x.dia < y.dia ? -1 : 1));
    const unidades = dias.reduce((s, d) => s + d.unidades, 0), hamburguesas = dias.reduce((s, d) => s + d.hamburguesas, 0), ventas = dias.reduce((s, d) => s + d.ventas, 0);

    const prod = productos.find((p) => { const n = norm(p.nombre); return n.includes('trifasica') && !n.includes('mini'); });
    const plato = prod ? platos.find((p) => p.productoMenuId === prod.id) : null;
    const colchonPct = Number(ajustes.exists ? ajustes.data().colchonPct : 30) || 30;
    const cfg = cfgFin.exists ? cfgFin.data() : {};
    const sueldosPct = Number.isFinite(Number(cfg.sueldosPct)) ? Number(cfg.sueldosPct) : 30;
    const reservaPct = Number.isFinite(Number(cfg.reservaPct)) ? Number(cfg.reservaPct) : 20;
    const guardados = cfg.guardados && typeof cfg.guardados === 'object' ? cfg.guardados : {};

    const base = { desde: '2026-10-30', trifasicas_vendidas: unidades, hamburguesas_entregadas: hamburguesas, hamburguesas_de_cortesia: regaladas, ventas_trifasica: ventas };
    if (!plato) return { ...base, aviso: 'No hay costo: en Costos y recetas falta vincular el plato "Burger TRIFASICA" con su producto del menú, así que no se puede calcular costo ni utilidad.' };

    const c = costoPlato(plato, { insumos: aMapa(insumos), recetas: aMapa(recetas) }, colchonPct);
    const costoBurger = c.costo / BURGERS_POR_RECETA, costoBurgerReal = c.costo_real / BURGERS_POR_RECETA;
    const libresPct = Math.max(0, 100 - sueldosPct - reservaPct);
    let acumulado = 0, costo = 0, utilidad = 0, vs = 0, vr = 0, vd = 0, yaGuardado = 0, pendiente = 0;
    const diasPendientes = [];
    const por_dia = dias.map((d) => {
        const costoDia = Math.round(costoBurger * d.hamburguesas);
        const util = d.ventas - costoDia, positiva = Math.max(0, util);
        const sueldos = Math.round(positiva * sueldosPct / 100), reserva = Math.round(positiva * reservaPct / 100), libre = Math.round(positiva * libresPct / 100);
        const aGuardar = sueldos + reserva, ok = guardados[d.dia] === true;
        acumulado += aGuardar; costo += costoDia; utilidad += util; vs += sueldos; vr += reserva; vd += libre;
        if (ok) yaGuardado += aGuardar; else if (aGuardar > 0) { pendiente += aGuardar; diasPendientes.push(d.dia); }
        return { dia: d.dia, trifasicas: d.unidades, hamburguesas: d.hamburguesas, ventas: d.ventas, costo_con_colchon: costoDia, utilidad: util, para_sueldos: sueldos, para_reserva: reserva, a_guardar: aGuardar, acumulado_a_guardar: acumulado, ya_guardado: ok };
    });
    const costoReal = Math.round(costoBurgerReal * hamburguesas);
    return {
        ...base,
        costo_por_hamburguesa_con_colchon: Math.round(costoBurger), costo_por_hamburguesa_real: Math.round(costoBurgerReal), costo_receta_completa_con_colchon: c.costo, costo_receta_completa_real: c.costo_real, hamburguesas_por_receta: BURGERS_POR_RECETA,
        costo_total_con_colchon: costo, costo_total_real: costoReal,
        utilidad, utilidad_con_costo_real: ventas - costoReal,
        margen_pct: ventas > 0 ? Math.round((utilidad / ventas) * 1000) / 10 : 0,
        reparto_utilidad: { sueldos_pct: sueldosPct, sueldos: vs, reserva_pct: reservaPct, reserva: vr, libre_pct: libresPct, libre: vd },
        a_guardar: { total_sueldos_mas_reserva: vs + vr, ya_guardado: yaGuardado, pendiente_por_guardar: pendiente, dias_pendientes: diasPendientes },
        por_dia,
        faltantes_en_receta: c.faltantes,
        nota: 'Solo la Trifásica (sin combos, bebidas ni empaque del 2×1). No resta costos fijos. Los % de reparto se editan en Métricas → Finanzas, donde también se marca qué días ya se guardaron. El reparto se redondea por día, así que los totales son la suma de los días. El día de hoy es parcial. Con pocos pedidos no es concluyente: dilo.'
    };
}

const TOOL = {
    name: 'finanzas_festival',
    description: 'FINANZAS de Sabe a Quindío / Burger Trifásica desde el 30 de octubre: cuántas se vendieron, ventas, costo de producción, utilidad, margen y cómo se reparte la utilidad (sueldos del equipo, reserva y libre), en total y DÍA POR DÍA (cuánto toca guardar cada día, el acumulado, qué días ya se marcaron como guardados y cuánto queda pendiente). Úsala para "¿cuánto hemos ganado con la Trifásica?", "¿cuánto toca guardar de ayer?", "¿cuánto llevo pendiente por guardar?" y el informe final del festival.',
    input_schema: { type: 'object', properties: {} }
};

module.exports = { finanzasFestival, TOOL };
