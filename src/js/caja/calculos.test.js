// Test de regresión de la lógica de Caja. Corre con:
//   node src/js/caja/calculos.test.js
// Sin navegador, sin Firestore, sin levantar el panel admin.

import { getOrderDisplayTotal, computeDomicilioGastoVirtual } from './calculos.js';

let fallos = 0;
function assertEqual(actual, esperado, mensaje) {
    const ok = JSON.stringify(actual) === JSON.stringify(esperado);
    console.log(`${ok ? '✅' : '❌'} ${mensaje}`);
    if (!ok) {
        console.log('   esperado:', esperado);
        console.log('   obtuvo:  ', actual);
        fallos++;
    }
}

// ── getOrderDisplayTotal ──
assertEqual(getOrderDisplayTotal({ total: 25000 }), 25000, 'usa total cuando existe');
assertEqual(getOrderDisplayTotal({ subtotal: 20000, deliveryFee: 5000 }), 25000, 'arma total desde subtotal+domicilio si no hay total');
assertEqual(getOrderDisplayTotal({ total: 0, subtotal: 20000 }), 0, 'respeta un total de $0 real (no cae al subtotal) — el bug original de cerrarCaja()');
assertEqual(getOrderDisplayTotal({ subtotal: 15000 }), 15000, 'sin deliveryFee, usa solo el subtotal');

// ── computeDomicilioGastoVirtual — la duplicación real que causó el bug de esta sesión ──
const pedidosDeHoy = [
    { id: 'o1', orderType: 'domicilio', deliveryFee: 5000, voided: false },
    { id: 'o2', orderType: 'domicilio', deliveryFee: 3000, voided: true },   // anulado: no debe contar
    { id: 'o3', orderType: 'retiro', deliveryFee: 0, voided: false },
    { id: 'o4', fulfillmentType: 'delivery', deliveryFee: 4000, voided: false }, // variante de campo, también cuenta
];

assertEqual(
    computeDomicilioGastoVirtual(pedidosDeHoy, []),
    { hasReal: false, deliveryCount: 2, monto: 9000 },
    'suma domicilios pagados, excluye anulados, sin gasto real aún registrado'
);

assertEqual(
    computeDomicilioGastoVirtual(pedidosDeHoy, [{ id: 'gasto_domicilios_1700000000' }]),
    { hasReal: true, deliveryCount: 2, monto: 9000 },
    'detecta el gasto real ya registrado por su prefijo de id'
);

assertEqual(
    computeDomicilioGastoVirtual([], []),
    { hasReal: false, deliveryCount: 0, monto: 0 },
    'sin pedidos, no propone ningún gasto'
);

console.log(fallos ? `\n${fallos} prueba(s) fallaron.` : '\nTodo pasó — mismo comportamiento que hoy en producción.');
process.exitCode = fallos ? 1 : 0;
