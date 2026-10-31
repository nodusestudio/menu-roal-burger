// FODI · cortesías del POS (botón 🎁). Solo LECTURA: platos regalados, su valor a precio de menú
// y si los clientes con cortesía volvieron a comprar. Mismo criterio que Métricas → Sabe a Quindío.

const INICIO_FESTIVAL_MS = Date.parse('2026-10-30T00:00:00-05:00');

const ms = (v) => (v && typeof v.toMillis === 'function' ? v.toMillis() : Number(v) || 0);
const fechaBogota = (t) => new Date(t - 5 * 3600e3).toISOString().slice(0, 16).replace('T', ' ');
const llaveTel = (o) => { let d = String(o.customerPhoneDigits || o.customerPhone || '').replace(/\D/g, ''); if (d.length === 12 && d.startsWith('57')) d = d.slice(2); return d.length >= 7 ? d : ''; };
const tsPedido = (o) => ms(o.createdAt) || ms(o.fecha) || 0;

async function cortesias(db, args = {}) {
    const desde = args.desde ? Date.parse(`${args.desde}T00:00:00-05:00`) || INICIO_FESTIVAL_MS : INICIO_FESTIVAL_MS;
    const lectura = await Promise.all(['pedidos', 'pedidos_archivados'].map((c) => db.collection(c).where('createdAt', '>=', new Date(desde)).get()));
    const porId = new Map();
    lectura.forEach((snap) => snap.docs.forEach((d) => porId.set(d.id, { id: d.id, ...d.data() })));
    const pedidos = [...porId.values()].filter((o) => !o.anulado && !o.voided);

    const items = [];
    for (const o of pedidos) {
        for (const it of (o.items || [])) {
            if (it.cortesia !== true) continue;
            const q = Number(it.quantity || 0);
            const unit = Number(it.cortesiaPrecio ?? it.originalUnitPrice ?? 0);
            if (q > 0 && unit > 0) items.push({ o, ts: tsPedido(o), producto: it.productName, q, valor: unit * q, tel: llaveTel(o) });
        }
    }
    const valor = items.reduce((s, c) => s + c.valor, 0);
    const ventas = pedidos.reduce((s, o) => s + Number(o.subtotal ?? o.total ?? 0), 0);

    const primera = new Map();
    items.filter((c) => c.tel).forEach((c) => { const p = primera.get(c.tel); if (!p || c.ts < p) primera.set(c.tel, c.ts); });
    let volvieron = 0, recuperado = 0;
    primera.forEach((t0, tel) => {
        const despues = pedidos.filter((o) => llaveTel(o) === tel && tsPedido(o) > t0 && Number(o.subtotal || 0) > 0);
        if (despues.length) { volvieron += 1; recuperado += despues.reduce((s, o) => s + Number(o.subtotal || 0), 0); }
    });

    const porProducto = {};
    items.forEach((c) => { porProducto[c.producto] = (porProducto[c.producto] || 0) + c.q; });

    return {
        desde: fechaBogota(desde).slice(0, 10),
        platos_de_cortesia: items.reduce((s, c) => s + c.q, 0),
        pedidos_con_cortesia: new Set(items.map((c) => c.o.id)).size,
        valor_regalado_precio_menu: valor,
        porcentaje_de_la_venta: (ventas + valor) ? Math.round((valor / (ventas + valor)) * 1000) / 10 : 0,
        clientes_con_cortesia: primera.size,
        clientes_que_volvieron: volvieron,
        vendido_despues_a_esos_clientes: recuperado,
        retorno_sobre_lo_regalado_pct: valor ? Math.round((recuperado / valor) * 100) : 0,
        cortesias_sin_telefono: items.filter((c) => !c.tel).length,
        por_producto: porProducto,
        ultimas: items.sort((a, b) => b.ts - a.ts).slice(0, 15).map((c) => ({ pedido: c.o.code || c.o.id, producto: c.producto, cantidad: c.q, valor: c.valor, fecha: fechaBogota(c.ts), cajero: c.o.cajero || '' })),
        nota: 'Valor a precio de menú, no costo de producción (lo realmente gastado es menos). "Vendido después" suma todo pedido posterior de esos clientes: no prueba causalidad. Con pocos datos no es concluyente: dilo.'
    };
}

const TOOL = {
    name: 'cortesias',
    description: 'CORTESÍAS del POS (platos regalados con el botón 🎁): cuántos, cuánto valen a precio de menú, qué % de la venta representan, qué clientes las recibieron y si volvieron a comprar (rentabilidad). Úsala para "¿cuánto hemos regalado?", "¿valió la pena regalar?" y para el informe del festival. Parámetro opcional desde = fecha AAAA-MM-DD (por defecto 30 de octubre de 2026).',
    input_schema: { type: 'object', properties: { desde: { type: 'string', description: 'Fecha inicial AAAA-MM-DD (hora Colombia).' } } }
};

module.exports = { cortesias, TOOL };
