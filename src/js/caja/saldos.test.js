// Test de la Fase 0: el módulo puro reproduce AL PESO lo que muestra el Historial de Cajas.
//   node src/js/caja/saldos.test.js
// Usa la foto real guardada por herramientas/baseline-dinero.mjs (carpeta ignorada por git: son datos reales).
// Si la foto no existe en este computador, solo corre los casos sintéticos.
process.env.TZ = 'America/Bogota';

import { readFileSync, existsSync } from 'node:fs';
import { calcularSaldosHistorial, cierreDescuadreSinMetodo, trasladoEnCierreCerrado, totalNetoLibroContable } from './saldos.js';

let fallos = 0;
const eq = (actual, esperado, msg) => {
    const ok = JSON.stringify(actual) === JSON.stringify(esperado);
    console.log(`${ok ? '✅' : '❌'} ${msg}`);
    if (!ok) { console.log('   esperado:', esperado, '\n   obtuvo:  ', actual); fallos++; }
};

// ── Casos sintéticos (reglas una por una) ──
const M = ['efectivo', 'bancolombia'];
eq(cierreDescuadreSinMetodo({ grandTotal: 1000, methodTotals: { efectivo: 1000 } }), 0, 'sin descuadre');
eq(cierreDescuadreSinMetodo({ grandTotal: 1006500, methodTotals: { efectivo: 1000000 } }), 6500, 'descuadre de 6.500 sobra en el total');
eq(cierreDescuadreSinMetodo({ grandTotal: 1000, methodTotals: { efectivo: 999.5 } }), 0, 'diferencia ≤ 1 se ignora');

const cierreA = { id: 'a', closedAt: 2000, aperturaAt: 1000, methodTotals: { efectivo: 900, bold: 100 }, ingresosTotal: 1100, gastosTotal: 100, grandTotal: 1000 };
let r = calcularSaldosHistorial({ cierres: [cierreA], gastos: [], methodKeys: M });
eq([r.porMetodo.efectivo, r.otro, r.totalNeto, r.ingresos, r.egresos], [900, 100, 1000, 1100, 100], 'método que ya no existe (bold) cae en "Otro"');

r = calcularSaldosHistorial({ cierres: [cierreA], methodKeys: M, gastos: [{ tipo: 'externo', paymentMethod: 'efectivo', monto: 200 }] });
eq([r.porMetodo.efectivo, r.totalNeto, r.egresos], [700, 800, 300], 'gasto externo resta del método, del total y suma a egresos');

r = calcularSaldosHistorial({ cierres: [cierreA], methodKeys: M, gastos: [{ tipo: 'externo', paymentMethod: '', monto: 200 }, { tipo: 'externo', paymentMethod: 'efectivo', monto: 0 }] });
eq([r.porMetodo.efectivo, r.totalNeto], [900, 1000], 'gasto sin método o en $0 se ignora (igual que el panel)');

const trasDentro = { tipo: 'traslado', methodFrom: 'efectivo', methodTo: 'bancolombia', monto: 50, registradoAt: 1500 };
const trasFuera = { tipo: 'traslado', methodFrom: 'efectivo', methodTo: 'bancolombia', monto: 50, registradoAt: 5000 };
eq(trasladoEnCierreCerrado(trasDentro, [cierreA]), true, 'traslado dentro de la ventana del cierre ya está horneado');
r = calcularSaldosHistorial({ cierres: [cierreA], methodKeys: M, gastos: [trasDentro, trasFuera] });
eq([r.porMetodo.efectivo, r.porMetodo.bancolombia, r.totalNeto], [850, 50, 1000], 'solo el traslado fuera de cierre mueve saldos; el total no cambia');

r = calcularSaldosHistorial({ cierres: [cierreA], methodKeys: M, gastos: [{ tipo: 'ajuste', porMetodo: { efectivo: 30, nequi: 20 } }] });
eq([r.porMetodo.efectivo, r.otro, r.totalNeto, r.egresos], [930, 120, 1050, 100], 'ajuste mueve saldo y total, no es ingreso ni egreso');
eq(totalNetoLibroContable({ cierres: [cierreA], gastos: [{ tipo: 'ajuste', porMetodo: { efectivo: 30 } }] }), 1000, 'Libro Contable (hoy) no suma ajustes');

// ── Opciones que cubren los dos usos (Historial y modal de Traslado) ──
{
    const t1 = { tipo: 'traslado', methodFrom: 'efectivo', methodTo: 'bancolombia', monto: 50, registradoAt: 5000 };   // fuera de cierre, "jornada abierta"
    const t2 = { tipo: 'traslado', methodFrom: 'efectivo', methodTo: 'bancolombia', monto: 20, registradoAt: 3000 };   // fuera de cierre, anterior a la apertura
    let r1 = calcularSaldosHistorial({ cierres: [cierreA], methodKeys: M, gastos: [t1, t2] });
    eq([r1.porMetodo.efectivo, r1.porMetodo.bancolombia], [830, 70], 'sin opciones: cuentan todos los traslados que no están horneados en un cierre');
    r1 = calcularSaldosHistorial({ cierres: [cierreA], methodKeys: M, gastos: [t1, t2], trasladosDesdeMsExcluidos: 4000 });
    eq([r1.porMetodo.efectivo, r1.porMetodo.bancolombia], [880, 20], 'con la jornada abierta desde 4000: se ignora el traslado de la jornada abierta (ya cuenta en Caja de hoy)');
    // Con los cierres FILTRADOS por fechas, el traslado horneado en un cierre fuera del filtro no se debe volver a contar
    r1 = calcularSaldosHistorial({ cierres: [], todosLosCierres: [cierreA], methodKeys: M, gastos: [trasDentro] });
    eq([r1.porMetodo.efectivo, r1.porMetodo.bancolombia, r1.totalNeto], [0, 0, 0], 'con cierres filtrados, `todosLosCierres` evita contar dos veces un traslado ya horneado');
    r1 = calcularSaldosHistorial({ cierres: [], methodKeys: M, gastos: [trasDentro] });
    eq([r1.porMetodo.efectivo, r1.porMetodo.bancolombia], [-50, 50], 'sin `todosLosCierres` (cierres filtrados) SÍ se contaría: por eso el Historial pasa siempre todos los cierres');
}

// ── Golden master contra el dinero real (lo que se ve en pantalla) ──
const ruta = new URL('../../../herramientas/baseline-dinero/crudo-ultimo.json', import.meta.url);
if (existsSync(ruta)) {
    const crudo = JSON.parse(readFileSync(ruta, 'utf8'));
    const methodKeys = (crudo.metodos || []).map((m) => m.id);
    const s = calcularSaldosHistorial({ cierres: crudo.cierres, gastos: crudo.gastos, methodKeys });
    console.log(`\nFoto real del ${crudo.generado} · métodos: ${methodKeys.join(', ')}`);
    console.log('  calculado:', JSON.stringify({ ...s.porMetodo, otro: s.otro, totalNeto: s.totalNeto, ingresos: s.ingresos, egresos: s.egresos }));
    // Números que mostraba la pantalla Historial de Cajas el 10-nov-2026 (captura del dueño):
    eq(s.porMetodo.efectivo, 878700, 'PANTALLA: Efectivo $878.700');
    eq(s.porMetodo.bancolombia, 723325, 'PANTALLA: Bancolombia/Breve $723.325');
    eq(s.porMetodo.nequi, 0, 'PANTALLA: Nequi $0');
    eq(s.otro, 0, 'PANTALLA: Otro $0');
    eq(s.totalNeto, 1602025, 'PANTALLA: Total Neto $1.602.025');
    eq(s.ingresos, 76832900, 'PANTALLA: Ingresos $76.832.900');
    eq(s.egresos, 77235120, 'PANTALLA: Egresos $77.235.120');
    eq(totalNetoLibroContable({ cierres: crudo.cierres, gastos: crudo.gastos }), -402220, 'Libro Contable hoy: −$402.220');
    eq(Object.values(s.porMetodo).reduce((a, b) => a + b, 0) + s.otro, s.totalNeto, 'las tarjetas suman exactamente el Total Neto');
} else {
    console.log('\n(Sin foto real en este computador: se omite el golden master. Genera una con herramientas/baseline-dinero.mjs)');
}

console.log(fallos ? `\n❌ ${fallos} fallo(s)` : '\n✅ Todo en verde');
process.exit(fallos ? 1 : 0);
