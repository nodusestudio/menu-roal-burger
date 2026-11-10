// Prueba de la hora de Colombia del panel: los ayudantes de admin.js dan lo mismo aunque el computador esté en OTRA zona.
//   node src/js/caja/dias.test.js
// Se corre simulando un computador en España (UTC+1), que fue justo lo que corría los días y las horas.
process.env.TZ = 'Europe/Madrid';

import { readFileSync } from 'node:fs';

const fuente = readFileSync(new URL('../admin.js', import.meta.url), 'utf8');
const bloque = (nombre) => {
    const a = fuente.indexOf(`// SYNC:${nombre}:inicio`);
    const b = fuente.indexOf(`// SYNC:${nombre}:fin`);
    if (a < 0 || b < 0) throw new Error(`No se encontró el bloque ${nombre} en admin.js`);
    return fuente.slice(a, b);
};

// Sin parche: así se ve una hora en un computador de otra zona
const cierre = Date.parse('2026-11-10T02:56:00Z'); // 9-nov 9:56 p. m. en Colombia
const sinParche = new Date(cierre).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

const H = new Function(`${bloque('dias-bogota')}\n return { _diaBogota, _horaBogota, _diaSemanaBogota, _inicioDiaBogotaMs, _sumarDiasKey, _primerDiaMesKey };`)();
new Function(`${bloque('zona-colombia')}`)();

let fallos = 0;
const eq = (a, e, msg) => {
    const ok = JSON.stringify(a) === JSON.stringify(e);
    console.log(`${ok ? '✅' : '❌'} ${msg}`);
    if (!ok) { console.log('   esperado:', e, '\n   obtuvo:  ', a); fallos++; }
};

console.log(`(computador simulado en España: sin el parche, el cierre de las 9:56 p. m. se vería "${sinParche}")`);
eq(/03:56/.test(sinParche), true, 'sin parche, ese computador sí corre la hora (confirma el problema)');

eq(H._diaBogota(cierre), '2026-11-09', 'día en Colombia del cierre = 9 de noviembre (no el 10)');
eq(H._horaBogota(cierre), 21, 'hora en Colombia = 21');
eq(H._diaSemanaBogota(cierre), 1, 'día de la semana en Colombia = lunes');
eq(H._diaBogota(Date.parse('2026-11-10T04:59:59Z')), '2026-11-09', '11:59:59 p. m. sigue siendo el mismo día');
eq(H._diaBogota(Date.parse('2026-11-10T05:00:00Z')), '2026-11-10', 'medianoche en Colombia empieza el día siguiente');
eq(H._inicioDiaBogotaMs('2026-11-09'), Date.parse('2026-11-09T05:00:00Z'), 'el día empieza a las 05:00 UTC');
eq(H._sumarDiasKey('2026-03-01', -1), '2026-02-28', 'restar un día cruza el mes');
eq(H._sumarDiasKey('2026-12-31', 1), '2027-01-01', 'sumar un día cruza el año');
eq(H._primerDiaMesKey('2026-01-15', -1), '2025-12-01', 'mes anterior cruza el año');
eq(H._primerDiaMesKey('2026-11-10'), '2026-11-01', 'primer día del mes');
eq(H._primerDiaMesKey('2026-12-10', 1), '2027-01-01', 'mes siguiente cruza el año');

const horaCon = new Date(cierre).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
eq(/09:56/.test(horaCon), true, `con el parche, toLocaleTimeString muestra hora de Colombia (${horaCon})`);
eq(/09:56/.test(new Intl.DateTimeFormat('es-CO', { hour: '2-digit', minute: '2-digit' }).format(cierre)), true, 'Intl.DateTimeFormat también');
eq(new Date(cierre).toLocaleTimeString('en-GB', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit' }), '02:56', 'si el código pide una zona propia, se respeta');
eq(/9/.test(new Date(cierre).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })), true, 'la fecha larga también sale como 9 de noviembre');

console.log(fallos ? `\n❌ ${fallos} fallo(s)` : '\n✅ Todo en verde');
process.exit(fallos ? 1 : 0);
