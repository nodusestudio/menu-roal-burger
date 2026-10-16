// Asistente de IA del admin: núcleo puro (sin Firestore).
//   node --test --test-concurrency=1 tests/admin-asistente.test.js

const path = require('node:path');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const a = require(path.join(__dirname, '..', 'functions', 'adminAsistente.js'));

const ms = (key, h = 12) => a.dateKeyToMs(key) + h * 3600 * 1000; // hora Bogotá del día
const pedido = (over) => ({ paymentMethod: 'efectivo', status: 'entregado', total: 10000, paidAt: ms('2026-08-10'), items: [], ...over });
const lista = (...ps) => ps.map((p, i) => ({ id: p.id || `p${i}`, data: p }));
const R = (d, h) => a.parseRango(d, h);

test('parseRango: valida formato, orden y tope de días', () => {
  assert.ok(R('2026-8-1', '2026-08-02').error);
  assert.ok(R('2026-08-05', '2026-08-01').error);
  assert.ok(R('2026-02-30', '2026-03-01').error);
  assert.ok(R('2025-01-01', '2026-12-31').error);
  const ok = R('2026-08-01', '2026-08-31');
  assert.equal(ok.dias, 31);
  assert.equal(ok.hastaMs - ok.desdeMs, 31 * 86400000);
});

test('borde Bogotá: venta 11 p. m. cuenta ese día; 00:30 UTC es el día anterior', () => {
  assert.equal(a.bogotaDateKey(ms('2026-08-10', 23)), '2026-08-10');
  assert.equal(a.bogotaDateKey(Date.UTC(2026, 7, 11, 0, 30)), '2026-08-10');
  const r = R('2026-08-10', '2026-08-10');
  const v = a.unirVentas([lista(
    pedido({ id: 'a', paidAt: ms('2026-08-10', 23) }),
    pedido({ id: 'b', paidAt: Date.UTC(2026, 7, 11, 0, 30) }),
    pedido({ id: 'c', paidAt: ms('2026-08-11', 0.1) })
  )], r.desdeMs, r.hastaMs);
  assert.deepEqual(v.map((x) => x.id).sort(), ['a', 'b']);
});

test('unión pedidos + archivados deduplica por id', () => {
  const r = R('2026-08-01', '2026-08-31');
  const v = a.unirVentas([lista(pedido({ id: 'x' })), lista(pedido({ id: 'x' }), pedido({ id: 'y' }))], r.desdeMs, r.hastaMs);
  assert.equal(v.length, 2);
});

test('excluye anulados, cancelados y sin pagar', () => {
  const r = R('2026-08-01', '2026-08-31');
  const v = a.unirVentas([lista(
    pedido({ id: '1' }),
    pedido({ id: '2', voided: true }),
    pedido({ id: '3', anulado: true }),
    pedido({ id: '4', status: 'cancelado' }),
    pedido({ id: '5', paymentMethod: 'pendiente', paidAt: null, status: 'pendiente' }),
    pedido({ id: '6', paidAt: null, status: 'nuevo', paymentMethod: 'nequi' })
  )], r.desdeMs, r.hastaMs);
  assert.deepEqual(v.map((x) => x.id), ['1']);
});

test('fecha de venta: paidAt || deliveredAt || createdAt y soporta Timestamp-like', () => {
  const t = { toMillis: () => ms('2026-08-05') };
  assert.equal(a.fechaVentaMs({ paidAt: t }), ms('2026-08-05'));
  assert.equal(a.fechaVentaMs({ deliveredAt: 5, createdAt: 9 }), 5);
  assert.equal(a.fechaVentaMs({ createdAt: { _seconds: 10, _nanoseconds: 0 } }), 10000);
});

test('total: usa total o subtotal + deliveryFee', () => {
  assert.equal(a.totalPedido({ total: 0, subtotal: 20000, deliveryFee: 3000 }), 23000);
  assert.equal(a.totalPedido({ total: 15000, subtotal: 1 }), 15000);
});

test('split: reparte por método y cuadra con el total', () => {
  const r = R('2026-08-01', '2026-08-31');
  const v = a.unirVentas([lista(
    pedido({ id: 's', paymentMethod: 'split', total: 30000, paymentSplit: [{ method: 'efectivo', amount: 10000 }, { method: 'bancolombia', amount: 20000 }] }),
    pedido({ id: 'n', paymentMethod: 'bancolombia', total: 5000 })
  )], r.desdeMs, r.hastaMs);
  const m = a.ventasPorMetodo(v);
  assert.equal(m.total, 35000);
  assert.deepEqual(m.metodos.find((x) => x.metodo === 'bancolombia'), { metodo: 'bancolombia', monto: 25000, pedidos: 2 });
  assert.equal(m.metodos.find((x) => x.metodo === 'efectivo').monto, 10000);
});

test('resumen_ventas: ticket promedio y agrupación por día/semana/mes', () => {
  const r = R('2026-08-01', '2026-09-30');
  const v = a.unirVentas([lista(
    pedido({ id: '1', total: 10000, deliveryFee: 2000, paidAt: ms('2026-08-03') }), // lunes
    pedido({ id: '2', total: 20000, paidAt: ms('2026-08-09') }), // domingo, misma semana
    pedido({ id: '3', total: 30000, paidAt: ms('2026-09-01') })
  )], r.desdeMs, r.hastaMs);
  const d = a.resumenVentas(v, 'dia');
  assert.equal(d.total.ventas, 60000);
  assert.equal(d.total.ticket_promedio, 20000);
  assert.equal(d.total.domicilios_cobrados, 2000);
  assert.equal(d.por_periodo.length, 3);
  const s = a.resumenVentas(v, 'semana');
  assert.equal(s.por_periodo[0].periodo, '2026-08-03');
  assert.equal(s.por_periodo[0].pedidos, 2);
  const m = a.resumenVentas(v, 'mes');
  assert.deepEqual(m.por_periodo.map((x) => [x.periodo, x.ventas]), [['2026-08', 30000], ['2026-09', 30000]]);
});

test('top_productos: orden, categoría y tope n', () => {
  const r = R('2026-08-01', '2026-08-31');
  const it = (n, q, s, c) => ({ productName: n, quantity: q, subtotal: s, categoryName: c });
  const v = a.unirVentas([lista(
    pedido({ items: [it('Roal', 3, 30000, 'Hamburguesas'), it('Papas', 5, 15000, 'Acompañamientos')] }),
    pedido({ items: [it('Roal', 1, 10000, 'Hamburguesas')] })
  )], r.desdeMs, r.hastaMs);
  assert.equal(a.topProductos(v).top[0].producto, 'Papas');
  assert.equal(a.topProductos(v, { orden: 'monto' }).top[0].producto, 'Roal');
  assert.deepEqual(a.topProductos(v, { categoria: 'hamburguesas' }).top.map((x) => x.producto), ['Roal']);
  assert.equal(a.topProductos(v, { n: 1 }).top.length, 1);
});

test('origen y tipo', () => {
  const r = R('2026-08-01', '2026-08-31');
  const v = a.unirVentas([lista(
    pedido({ source: 'web', orderType: 'domicilio', total: 10000 }),
    pedido({ source: 'admin_pos', orderType: 'mesa', total: 20000 })
  )], r.desdeMs, r.hastaMs);
  const o = a.ventasPorOrigenTipo(v);
  assert.equal(o.por_origen[0].origen, 'admin_pos');
  assert.equal(o.por_tipo.length, 2);
});

test('gastos: traslado y ajuste NO cuentan; caja (sin tipo) y externo sí', () => {
  const r = R('2026-08-01', '2026-08-31');
  const g = (tipo, monto, extra = {}) => ({ tipo, monto, categoria: 'otros', paymentMethod: 'efectivo', registradoAt: ms('2026-08-10'), ...extra });
  const res = a.resumenGastos([g(undefined, 1000), g('caja', 2000), g('externo', 3000), g('traslado', 99999), g('ajuste', 88888), g('externo', 500, { registradoAt: ms('2026-09-10') })], r.desdeMs, r.hastaMs, 'metodo');
  assert.equal(res.total, 6000);
  assert.equal(res.registros, 3);
  assert.equal(res.detalle[0].metodo, 'efectivo');
});

test('cierres: filtra por closedAt (no por date UTC)', () => {
  const r = R('2026-08-10', '2026-08-10');
  const c = (closedAt, date) => ({ closedAt, date, ingresosTotal: 100, gastosTotal: 10, grandTotal: 90 });
  // cierre 9 p. m. del 10/08 Bogotá = 02:00 UTC del 11/08 (date queda 11)
  const res = a.resumenCierres([c(ms('2026-08-10', 21), '2026-08-11'), c(ms('2026-08-11', 21), '2026-08-12')], r.desdeMs, r.hastaMs);
  assert.equal(res.cierres, 1);
  assert.equal(res.neto, 90);
  assert.equal(res.detalle[0].fecha, '2026-08-10');
});

test('comparar_periodos: diferencia y porcentaje', () => {
  const c = a.compararResumenes({ ventas: 150, pedidos: 3, ticket_promedio: 50 }, { ventas: 100, pedidos: 4, ticket_promedio: 25 });
  assert.equal(c.diferencia.ventas, 50);
  assert.equal(c.diferencia.ventas_pct, 50);
  assert.equal(c.diferencia.pedidos, -1);
  assert.equal(a.compararResumenes({ ventas: 1, pedidos: 1, ticket_promedio: 1 }, { ventas: 0, pedidos: 0, ticket_promedio: 0 }).diferencia.ventas_pct, null);
});

test('recortarResultado: trunca filas, conserva totales y avisa', () => {
  const grande = { total: 123, detalle: Array.from({ length: 500 }, (_, i) => ({ k: `fila-${i}`, v: i })) };
  const out = JSON.parse(a.recortarResultado(grande));
  assert.equal(out.total, 123);
  assert.equal(out.truncado, true);
  assert.ok(out.detalle.length < 500 && out.detalle.length >= 1);
  assert.ok(JSON.stringify(out).length <= a.MAX_RESULT_CHARS);
  assert.equal(a.recortarResultado({ a: 1 }), '{"a":1}');
});

test('definición de herramientas: 15 y con esquema válido', () => {
  assert.equal(a.TOOLS.length, 15);
  for (const t of a.TOOLS) {
    assert.ok(t.name && t.description && t.input_schema.type === 'object');
  }
});

test('ventas por día de la semana y hora (Bogotá)', () => {
  // 2026-08-14 19:30 Bogotá = 2026-08-15 00:30 UTC, viernes
  const ms = Date.UTC(2026, 7, 15, 0, 30);
  const r = a.ventasPorDiaHora([{ ms, total: 30000 }, { ms, total: 20000 }]);
  assert.equal(r.por_dia_semana.find((d) => d.dia === 'viernes').pedidos, 2);
  assert.deepEqual(r.por_hora, [{ hora: '19:00', pedidos: 2, ventas: 50000 }]);
});

const venta = (id, tel, dia, total, items = []) => ({ id, tel, nombre: '', ms: ms(dia), total, items });

test('variantes vendidas: reparte por optionLabel con % de participación y filtra por producto', () => {
  const it = (name, label, q, sub) => ({ productName: name, optionLabel: label, quantity: q, subtotal: sub });
  const r = a.variantesVendidas([
    venta('a', '1', '2026-08-10', 1, [it('Salchipapa', 'Normal', 3, 30000), it('Salchipapa', 'Pequeña', 1, 8000), it('Perro', '', 2, 16000)]),
    venta('b', '2', '2026-08-11', 1, [it('Salchipapa', 'Normal', 1, 10000)])
  ], { producto: 'salchi' });
  assert.equal(r.productos.length, 1);
  assert.equal(r.productos[0].cantidad, 5);
  assert.deepEqual(r.productos[0].variantes[0], { variante: 'Normal', cantidad: 4, monto: 40000, participacion_pct: 80 });
});

test('etiquetaVariante: sin optionLabel usa tipo/sabor, si no "sin variante"', () => {
  assert.equal(a.etiquetaVariante({ orderOptions: { type: 'combo', flavor: 'Pepsi' } }), 'combo / Pepsi');
  assert.equal(a.etiquetaVariante({}), 'sin variante');
});

test('clientes: recompra, inactivos y top enmascaran el teléfono', () => {
  const ventas = [
    venta('1', '3001112233', '2026-06-01', 20000), venta('2', '3001112233', '2026-06-10', 30000),
    venta('3', '3009998877', '2026-08-10', 15000), venta('4', '', '2026-08-10', 9000)
  ];
  const rec = a.analisisClientes(ventas, { modo: 'recompra' });
  assert.equal(rec.clientes_identificados, 2);
  assert.equal(rec.tasa_recompra_pct, 50);
  assert.equal(rec.ventas_sin_telefono, 1);
  const ina = a.analisisClientes(ventas, { modo: 'inactivos', hastaMs: ms('2026-08-15'), dias_inactivo: 45 });
  assert.equal(ina.total_inactivos_valiosos, 1);
  assert.equal(ina.top[0].telefono, '***2233');
  const top = a.analisisClientes(ventas, { modo: 'top' });
  assert.equal(top.top[0].monto, 50000);
});

test('RFM: pocos clientes avisa; con suficientes devuelve segmentos que suman el total', () => {
  assert.ok(a.analisisClientes([venta('1', '1', '2026-08-01', 1)], { modo: 'rfm' }).aviso);
  const v = Array.from({ length: 9 }, (_, i) => venta(`x${i}`, `30000000${i}`, `2026-08-0${i + 1}`, (i + 1) * 1000));
  const r = a.analisisClientes(v, { modo: 'rfm' });
  assert.equal(r.segmentos.reduce((s, x) => s + x.clientes, 0), 9);
});

test('uso de promos: cuenta pedidos con cupón/2x1/código y descuento', () => {
  const r = a.usoPromos([
    venta('1', '1', '2026-08-01', 1, [{ quantity: 1, unitPrice: 8000, originalUnitPrice: 10000, subtotal: 8000, orderOptions: { recommendedDiscount: true } }]),
    venta('2', '1', '2026-08-01', 1, [{ quantity: 2, subtotal: 20000, orderOptions: {} }])
  ]);
  assert.equal(r.pedidos_con_promo, 1);
  assert.equal(r.pct_pedidos_con_promo, 50);
  assert.equal(r.descuento_estimado_cop, 2000);
});

test('normalizarVenta conserva teléfono y nombre', () => {
  const v = a.normalizarVenta('z', pedido({ customerPhoneDigits: '300 111', customerName: ' Ana ' }));
  assert.equal(v.tel, '300111');
  assert.equal(v.nombre, 'Ana');
});
