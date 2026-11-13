// Almuerzos configurables: núcleo puro (costos, combinación, inventario, reportes).
//   node --test --test-concurrency=1 tests/almuerzos.test.js

const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { test, before } = require('node:test');
const assert = require('node:assert/strict');
const costos = require(path.join(__dirname, '..', 'functions', 'costos.js'));

let A;
before(async () => { A = await import(pathToFileURL(path.join(__dirname, '..', 'src', 'js', 'almuerzos', 'core.js')).href); });

// Insumos en su unidad de uso (g / ml). Arroz: 2.000 por kg → 2 por g.
const insumos = [
    { id: 'arroz', nombre: 'Arroz crudo', unidad: 'g', precioCompra: 4000, pesoEmpaque: 2000, mermaPct: 0 },                // 2 por g
    { id: 'pollo', nombre: 'Pechuga cruda', unidad: 'g', precioCompra: 18000, pesoEmpaque: 1000, mermaPct: 10 },            // 19,8 por g
    { id: 'papa', nombre: 'Papa pastusa', unidad: 'g', precioCompra: 2000, pesoEmpaque: 1000, mermaPct: 20, stockActual: 500 }, // 2,4 por g
    { id: 'repollo', nombre: 'Repollo', unidad: 'g', precioCompra: 1500, pesoEmpaque: 1000, mermaPct: 0, stockActual: 90 },   // 1,5 por g
    { id: 'mora', nombre: 'Mora', unidad: 'g', precioCompra: 6000, pesoEmpaque: 1000, mermaPct: 0 },                         // 6 por g
    { id: 'agua', nombre: 'Agua', unidad: 'ml', costoRespaldo: 0.05 }
];
const recetas = [
    // Arroz cocido: 1000 g de arroz crudo rinden 2500 g cocidos → 0,8 de crudo por g servido
    { id: 'r-arroz', nombre: 'Arroz blanco', pesoTotal: 2500, items: [{ tipo: 'insumo', id: 'arroz', cantidad: 1000 }] },
    { id: 'r-pollo', nombre: 'Pollo a la plancha', pesoTotal: 800, items: [{ tipo: 'insumo', id: 'pollo', cantidad: 1000 }] },
    { id: 'r-papa', nombre: 'Papa francesa', pesoTotal: 600, items: [{ tipo: 'insumo', id: 'papa', cantidad: 1000 }] },
    { id: 'r-repollo', nombre: 'Ensalada de repollo', pesoTotal: 500, items: [{ tipo: 'insumo', id: 'repollo', cantidad: 500 }] },
    // Jugo = 300 g de mora + 4000 ml de agua rinden 4000 ml (anidado en una receta "base")
    { id: 'r-base-mora', nombre: 'Pulpa de mora', pesoTotal: 300, items: [{ tipo: 'insumo', id: 'mora', cantidad: 300 }] },
    { id: 'r-jugo', nombre: 'Jugo de mora', pesoTotal: 4000, items: [{ tipo: 'receta', id: 'r-base-mora', cantidad: 300 }, { tipo: 'insumo', id: 'agua', cantidad: 3700 }] }
];
const ctx = { insumos: Object.fromEntries(insumos.map((i) => [i.id, i])), recetas: Object.fromEntries(recetas.map((r) => [r.id, r])) };
const comp = (id, categoria, nombre, recetaId, extra = {}) => ({ id, categoria, nombre, ref: { tipo: 'receta', id: recetaId }, activo: true, disponible: true, ...extra });
const componentes = [
    comp('c-pollo', 'proteina', 'Pollo a la plancha', 'r-pollo'),
    comp('c-pepito', 'proteina', 'Carne para Pepito', 'r-pollo', { disponible: false }),
    comp('c-papa', 'contorno', 'Papa francesa', 'r-papa'),
    comp('c-repollo', 'ensalada', 'Ensalada de repollo y zanahoria', 'r-repollo'),
    comp('c-jugo', 'bebida', 'Jugo de mora', 'r-jugo')
];
const config = { nombre: 'Almuerzo Ejecutivo', precio: 19000, arroz: { nombre: 'Arroz', ref: { tipo: 'receta', id: 'r-arroz' }, porcion: 200, unidad: 'g' } };
const sel = { proteina: 'c-pollo', contorno: 'c-papa', ensalada: 'c-repollo', bebida: 'c-jugo' };

test('paridad con functions/costos.js: mismo costo por unidad de insumo y de receta', () => {
    for (const i of insumos) assert.equal(A.costoUnitarioInsumo(i), costos.costoUnitarioInsumo(i));
    for (const r of recetas) assert.equal(A.costoRecetaPorUnidad(r.id, ctx).porUnidad, costos.costoReceta(r.id, ctx).porUnidad);
});

test('porción por categoría: 150 g proteína, 100 g contorno/ensalada, 500 ml bebida, arroz 200 g', () => {
    const { ok, snapshot } = A.armarCombinacion({ config, componentes, seleccion: sel, ctx });
    assert.ok(ok);
    const p = Object.fromEntries(snapshot.componentes.map((c) => [c.categoria, c]));
    assert.deepEqual([p.proteina.porcion, p.contorno.porcion, p.ensalada.porcion, p.bebida.porcion], [150, 100, 100, 500]);
    assert.equal(p.bebida.unidad, 'ml');
    assert.equal(snapshot.arroz.porcion, 200);
});

test('costo de la combinación = arroz + 4 componentes, y precio fijo $19.000 con utilidad variable', () => {
    const { snapshot: s } = A.armarCombinacion({ config, componentes, seleccion: sel, ctx });
    // arroz: 200/2500*1000 g crudos = 80 g × 2 = 160
    assert.equal(s.arroz.costoReal, 160);
    // pollo: 150/800*1000 = 187,5 g × 19,8 = 3712,5
    // papa: 100/600*1000 = 166,667 g × 2,4 = 400
    // repollo: 100/500*500 = 100 g × 1,5 = 150
    // jugo: 500/4000 = 0,125 → mora 300*0,125/300*300... = 37,5 g × 6 = 225 ; agua 3700*0,125 = 462,5 ml × 0,05 = 23,125
    const por = Object.fromEntries(s.componentes.map((c) => [c.categoria, c.costoReal]));
    assert.equal(por.proteina, 3712.5);
    assert.equal(por.contorno, 400);
    assert.equal(por.ensalada, 150);
    assert.equal(por.bebida, 248.125);
    assert.equal(s.costoReal, Math.round(160 + 3712.5 + 400 + 150 + 248.125));
    assert.equal(s.precio, 19000);
    assert.equal(s.utilidadBruta, 19000 - s.costoReal);
    // otra combinación (misma proteína, sin la papa → otra) cambia el costo pero no el precio
    const otra = A.armarCombinacion({ config, componentes: [...componentes, comp('c-yuca', 'contorno', 'Yuca frita', 'r-papa', { porcion: 200 })], seleccion: { ...sel, contorno: 'c-yuca' }, ctx });
    assert.ok(otra.snapshot.costoReal > s.costoReal);
    assert.equal(otra.snapshot.precio, 19000);
});

test('mano de obra y colchón se suman sin tocar el costo real de ingredientes', () => {
    const { snapshot: s } = A.armarCombinacion({ config: { ...config, manoObra: 1000 }, componentes, seleccion: sel, ctx, colchonPct: 30 });
    assert.equal(s.manoObra, 1000);
    assert.equal(s.costoReal, s.costoIngredientes + 1000);
    assert.equal(s.costoColchon, Math.round(s.costoIngredientes * 1.3 + 1000));
});

test('no deja armar con un componente apagado, inexistente o de otra categoría, ni con faltantes', () => {
    let r = A.armarCombinacion({ config, componentes, seleccion: { ...sel, proteina: 'c-pepito' }, ctx });
    assert.equal(r.ok, false);
    assert.match(r.errores.join(' '), /no está disponible hoy/);
    r = A.armarCombinacion({ config, componentes, seleccion: { ...sel, bebida: 'c-papa' }, ctx });
    assert.equal(r.ok, false);
    r = A.armarCombinacion({ config, componentes, seleccion: { proteina: 'c-pollo' }, ctx });
    assert.equal(r.ok, false);
    assert.equal(r.errores.length, 3);
    // sin receta de arroz o de un componente todavía se puede vender (aún no hay costos/inventario completos): queda marcado como incompleto
    r = A.armarCombinacion({ config: { ...config, arroz: {} }, componentes, seleccion: sel, ctx });
    assert.equal(r.ok, true);
    assert.ok(r.snapshot.faltantes.length > 0);
    r = A.armarCombinacion({ config, componentes: componentes.map((c) => (c.id === 'c-pollo' ? { ...c, activo: false } : c)), seleccion: sel, ctx });
    assert.equal(r.ok, false);
});

test('opcionesPorCategoria solo ofrece lo activo y encendido hoy', () => {
    const o = A.opcionesPorCategoria(componentes);
    assert.deepEqual(o.proteina.map((c) => c.id), ['c-pollo']);
    assert.equal(o.bebida.length, 1);
});

test('el consumo de inventario es solo el de esas 4 preparaciones + arroz, por insumo', () => {
    const { snapshot: s } = A.armarCombinacion({ config, componentes, seleccion: sel, ctx });
    assert.deepEqual(Object.keys(s.consumos).sort(), ['agua', 'arroz', 'mora', 'papa', 'pollo', 'repollo']);
    assert.equal(s.consumos.arroz.cantidad, 80);
    assert.equal(s.consumos.pollo.cantidad, 187.5);
    assert.equal(s.consumos.mora.cantidad, 37.5);
    assert.equal(s.consumos.agua.cantidad, 462.5);
});

test('la receta sub-anidada no se duplica ni se cicla', () => {
    const c2 = { insumos: ctx.insumos, recetas: { ...ctx.recetas, a: { id: 'a', nombre: 'A', pesoTotal: 1, items: [{ tipo: 'receta', id: 'a', cantidad: 1 }] } } };
    assert.deepEqual(A.consumoDeReceta('a', 10, c2), {});
});

test('consumos del pedido multiplican por cantidad y el delta sirve para editar/cancelar', () => {
    const { snapshot: s } = A.armarCombinacion({ config, componentes, seleccion: sel, ctx });
    const items = [{ productId: 'almuerzo-ejecutivo', quantity: 2, almuerzo: s }, { productId: 'otro', quantity: 5 }];
    const total = A.consumosDePedido(items);
    assert.equal(total.pollo.cantidad, 375);
    assert.deepEqual(A.consumosDePedido([{ quantity: 1 }]), {});
    const d = A.deltaConsumos(total, A.consumosDePedido([{ quantity: 1, almuerzo: s }]));
    assert.equal(d.pollo.cantidad, -187.5); // pasar de 2 a 1 devuelve media tanda
    assert.deepEqual(A.deltaConsumos(total, total), {});
    const cancel = A.deltaConsumos(total, {});
    assert.equal(cancel.pollo.cantidad, -375);
});

test('validarStock: solo controla insumos con stockActual; sin stock cargado nunca bloquea', () => {
    const { snapshot: s } = A.armarCombinacion({ config, componentes, seleccion: sel, ctx });
    const necesita = A.consumosDePedido([{ quantity: 1, almuerzo: s }]);
    const sinSeguimiento = Object.fromEntries(Object.entries(ctx.insumos).map(([id, i]) => [id, { ...i, stockActual: undefined }]));
    assert.deepEqual(A.validarStock(necesita, sinSeguimiento), []);
    const conCero = { ...sinSeguimiento, pollo: { ...sinSeguimiento.pollo, stockActual: 0 } };
    assert.equal(A.validarStock(necesita, conCero)[0].insumoId, 'pollo'); // stock en 0 SÍ bloquea (≠ sin seguimiento)
});

test('validarStock reporta el insumo que no alcanza, con lo que hay y lo que falta', () => {
    const { snapshot: s } = A.armarCombinacion({ config, componentes, seleccion: sel, ctx });
    const faltan = A.validarStock(A.consumosDePedido([{ quantity: 1, almuerzo: s }]), ctx.insumos);
    assert.equal(faltan.length, 1);
    assert.equal(faltan[0].insumoId, 'repollo');
    assert.equal(faltan[0].hay, 90);
    assert.equal(faltan[0].necesita, 100);
    // devolver stock (delta negativo) jamás cuenta como faltante
    assert.deepEqual(A.validarStock({ repollo: { cantidad: -50 } }, ctx.insumos), []);
});

test('componenteSinStock avisa en el selector antes de elegir', () => {
    assert.equal(A.componenteSinStock(componentes[3], ctx).length, 1);
    assert.equal(A.componenteSinStock(componentes[0], ctx).length, 0);
});

test('el histórico no cambia aunque la receta suba de precio después', () => {
    const { snapshot: antes } = A.armarCombinacion({ config, componentes, seleccion: sel, ctx });
    const caro = { insumos: { ...ctx.insumos, pollo: { ...ctx.insumos.pollo, precioCompra: 36000 } }, recetas: ctx.recetas };
    const { snapshot: despues } = A.armarCombinacion({ config, componentes, seleccion: sel, ctx: caro });
    assert.ok(despues.costoReal > antes.costoReal);
    const rep = A.reporteAlmuerzos([{ createdAtMs: Date.UTC(2026, 10, 12, 17), status: 'entregado', items: [{ quantity: 1, unitPrice: 19000, almuerzo: JSON.parse(JSON.stringify(antes)) }] }]);
    assert.equal(rep.costoReal, antes.costoReal); // el reporte lee el snapshot, no las recetas
});

test('reporte: cantidades, rankings, costo real, utilidad y rentabilidad; excluye cancelados', () => {
    const base = A.armarCombinacion({ config, componentes, seleccion: sel, ctx }).snapshot;
    const yuca = [...componentes, comp('c-yuca', 'contorno', 'Yuca frita', 'r-papa', { porcion: 200 })];
    const alt = A.armarCombinacion({ config, componentes: yuca, seleccion: { ...sel, contorno: 'c-yuca' }, ctx }).snapshot;
    const t = Date.UTC(2026, 10, 12, 17);
    const orders = [
        { createdAtMs: t, status: 'entregado', items: [{ quantity: 2, unitPrice: 19000, almuerzo: base }] },
        { createdAtMs: t + 1000, status: 'pendiente', items: [{ quantity: 1, unitPrice: 19000, almuerzo: alt }, { quantity: 3, unitPrice: 15000 }] },
        { createdAtMs: t + 2000, status: 'cancelado', items: [{ quantity: 9, unitPrice: 19000, almuerzo: base }] },
        { createdAtMs: t + 3000, status: 'entregado', anulado: true, items: [{ quantity: 9, unitPrice: 19000, almuerzo: base }] },
        { createdAtMs: t - 99 * 86400000, status: 'entregado', items: [{ quantity: 4, unitPrice: 19000, almuerzo: base }] }
    ];
    const r = A.reporteAlmuerzos(orders, { desdeMs: t - 86400000, hastaMs: t + 86400000 });
    assert.equal(r.vendidos, 3);
    assert.equal(r.pedidos, 2);
    assert.equal(r.ingresos, 57000);
    assert.equal(r.costoReal, base.costoReal * 2 + alt.costoReal);
    assert.equal(r.utilidadBruta, 57000 - r.costoReal);
    assert.equal(r.proteinas[0].nombre, 'Pollo a la plancha');
    assert.equal(r.proteinas[0].cantidad, 3);
    assert.deepEqual(r.contornos.map((c) => [c.nombre, c.cantidad]), [['Papa francesa', 2], ['Yuca frita', 1]]);
    assert.equal(r.combinaciones.length, 2);
    assert.equal(r.combinaciones[0].cantidad, 2);
    assert.equal(r.porDia.length, 1);
    assert.equal(r.margenPct, Math.round((r.utilidadBruta / 57000) * 1000) / 10);
    assert.equal(A.reporteAlmuerzos([]).vendidos, 0);
});

test('etiqueta para ticket/cocina lista los 4 elegidos y el arroz', () => {
    const { snapshot: s } = A.armarCombinacion({ config, componentes, seleccion: sel, ctx });
    assert.equal(A.etiquetaCombinacion(s), 'Pollo a la plancha + Papa francesa + Ensalada de repollo y zanahoria + Jugo de mora + Arroz 200g');
});
