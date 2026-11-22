// Block ROAL: lógica pura (rachas, niveles, tope diario, plausibilidad, tope de crédito). Sin emulador:
//   node --test tests/juego.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const J = require('../functions/juego.js');

const cfg = J.normalizarConfig({});
const base = { estado: {}, cfg };

test('config por defecto: 1 pt = $1, tope 300, meta 500*N, 7 %, bonus 3/7/14', () => {
    assert.equal(cfg.valorPunto, 1);
    assert.equal(cfg.topeDiario, 300);
    assert.equal(J.metaNivel(3, cfg), 1500);
    assert.equal(cfg.topeCreditoPct, 7);
    assert.deepEqual(cfg.rachaBonus, { 3: 50, 7: 150, 14: 400 });
});

test('config: valores locos se acotan (porcentaje, negativos, basura)', () => {
    const c = J.normalizarConfig({ topeCreditoPct: 900, topeDiario: -5, valorPunto: 'x', metaBase: 0 });
    assert.equal(c.topeCreditoPct, 100);
    assert.equal(c.topeDiario, 0);
    assert.equal(c.valorPunto, 1);
    assert.equal(c.metaBase, 1);
});

test('metas por nivel configurables sobrescriben 500*N', () => {
    const c = J.normalizarConfig({ metasNivel: { 2: 900 } });
    assert.equal(J.metaNivel(1, c), 500);
    assert.equal(J.metaNivel(2, c), 900);
});

test('día de Bogotá: 23:30 del 21 sigue siendo 21 aunque en UTC ya sea 22', () => {
    const ms = Date.UTC(2026, 10, 22, 4, 30); // 23:30 del 21 en Bogotá (UTC-5)
    assert.equal(J.diaBogota(ms), '2026-11-21');
    assert.equal(J.diaAnterior('2026-03-01'), '2026-02-28');
});

test('tope diario: nunca acredita más de 300 pts de juego al día', () => {
    let r = J.calcularResultado({ ...base, puntaje: 5000, dia: '2026-11-21' });
    assert.equal(r.puntosOtorgados, 300);
    r = J.calcularResultado({ estado: { juegoHoyDia: '2026-11-21', juegoHoyPts: 250 }, cfg, puntaje: 400, dia: '2026-11-21' });
    assert.equal(r.puntosOtorgados, 50);
    r = J.calcularResultado({ estado: { juegoHoyDia: '2026-11-21', juegoHoyPts: 300 }, cfg, puntaje: 400, dia: '2026-11-21' });
    assert.equal(r.puntosOtorgados, 0);
    // al día siguiente el contador reinicia
    r = J.calcularResultado({ estado: { juegoHoyDia: '2026-11-21', juegoHoyPts: 300 }, cfg, puntaje: 400, dia: '2026-11-22' });
    assert.equal(r.puntosOtorgados, 300);
});

test('racha: primer día 1; consecutivo suma; mismo día no suma; saltar un día reinicia en 1', () => {
    let r = J.calcularResultado({ ...base, puntaje: 100, dia: '2026-11-21' });
    assert.equal(r.racha, 1);
    r = J.calcularResultado({ estado: { rachaJuego: 1, ultimoDiaJuego: '2026-11-21' }, cfg, puntaje: 100, dia: '2026-11-22' });
    assert.equal(r.racha, 2);
    r = J.calcularResultado({ estado: { rachaJuego: 2, ultimoDiaJuego: '2026-11-22' }, cfg, puntaje: 100, dia: '2026-11-22' });
    assert.equal(r.racha, 2);
    assert.equal(r.bonusRacha, 0);
    r = J.calcularResultado({ estado: { rachaJuego: 9, ultimoDiaJuego: '2026-11-19' }, cfg, puntaje: 100, dia: '2026-11-22' });
    assert.equal(r.racha, 1);
});

test('bonus de racha: 3 días +50, 7 días +150, 14 días +400, una sola vez por día', () => {
    const dia = '2026-11-22';
    const ayer = '2026-11-21';
    assert.equal(J.calcularResultado({ estado: { rachaJuego: 2, ultimoDiaJuego: ayer }, cfg, puntaje: 0, dia }).bonusRacha, 50);
    assert.equal(J.calcularResultado({ estado: { rachaJuego: 6, ultimoDiaJuego: ayer }, cfg, puntaje: 0, dia }).bonusRacha, 150);
    assert.equal(J.calcularResultado({ estado: { rachaJuego: 13, ultimoDiaJuego: ayer }, cfg, puntaje: 0, dia }).bonusRacha, 400);
    assert.equal(J.calcularResultado({ estado: { rachaJuego: 3, ultimoDiaJuego: ayer }, cfg, puntaje: 0, dia }).bonusRacha, 0); // racha 4
    // segunda partida del mismo día: no repite el bonus
    assert.equal(J.calcularResultado({ estado: { rachaJuego: 3, ultimoDiaJuego: dia }, cfg, puntaje: 10, dia }).bonusRacha, 0);
});

test('racha vigente: si pasó un día entero sin jugar vale 0', () => {
    assert.equal(J.rachaVigente({ rachaJuego: 5, ultimoDiaJuego: '2026-11-22' }, '2026-11-22'), 5);
    assert.equal(J.rachaVigente({ rachaJuego: 5, ultimoDiaJuego: '2026-11-21' }, '2026-11-22'), 5);
    assert.equal(J.rachaVigente({ rachaJuego: 5, ultimoDiaJuego: '2026-11-20' }, '2026-11-22'), 0);
    assert.equal(J.rachaVigente({}, '2026-11-22'), 0);
});

test('niveles: nivel N se supera con 500*N en una partida; solo sube de a uno', () => {
    let r = J.calcularResultado({ ...base, puntaje: 499, dia: '2026-11-21' });
    assert.equal(r.nivelSuperado, false);
    r = J.calcularResultado({ ...base, puntaje: 500, dia: '2026-11-21' });
    assert.equal(r.nuevoNivelMax, 1);
    r = J.calcularResultado({ estado: { nivelMaxJuego: 2 }, cfg, puntaje: 1499, dia: '2026-11-21' });
    assert.equal(r.nuevoNivelMax, 2);
    r = J.calcularResultado({ estado: { nivelMaxJuego: 2 }, cfg, puntaje: 9000, dia: '2026-11-21' });
    assert.equal(r.nuevoNivelMax, 3); // no salta niveles
});

test('crédito ganado = (puntos del día + bonus) * valorPunto, entero', () => {
    const c2 = J.normalizarConfig({ valorPunto: 0.5 });
    const r = J.calcularResultado({ estado: { rachaJuego: 2, ultimoDiaJuego: '2026-11-21' }, cfg: c2, puntaje: 101, dia: '2026-11-22' });
    assert.equal(r.puntosTotales, 151);
    assert.equal(r.creditoGanado, 75);
});

test('plausibilidad: rechaza partida corta, puntaje por segundo, por jugada, negativos y no enteros', () => {
    const ok = { puntaje: 400, duracionSeg: 90, jugadas: 20 };
    assert.equal(J.motivoImplausible(ok, cfg), null);
    assert.equal(J.motivoImplausible({ ...ok, duracionSeg: 5 }, cfg), 'partida-muy-corta');
    assert.equal(J.motivoImplausible({ puntaje: 5000, duracionSeg: 30, jugadas: 30 }, cfg), 'puntaje-por-segundo');
    assert.equal(J.motivoImplausible({ puntaje: 900, duracionSeg: 600, jugadas: 3 }, cfg), 'puntaje-por-jugada');
    assert.equal(J.motivoImplausible({ ...ok, jugadas: 1000 }, cfg), 'jugadas-imposibles');
    assert.equal(J.motivoImplausible({ ...ok, puntaje: -1 }, cfg), 'puntaje-invalido');
    assert.equal(J.motivoImplausible({ ...ok, puntaje: 10.5 }, cfg), 'puntaje-invalido');
    assert.equal(J.motivoImplausible({ ...ok, puntaje: NaN }, cfg), 'puntaje-invalido');
    assert.equal(J.motivoImplausible({ ...ok, puntaje: 999999 }, cfg), 'puntaje-invalido');
});

test('tope de crédito en el pedido: mín(solicitado, saldo, 7 % de los productos)', () => {
    const f = (solicitado, saldo, baseProductos, topePct = 7) => J.clampCreditoJuego({ solicitado, saldo, baseProductos, topePct });
    assert.equal(f(99999, 99999, 50000), 3500);     // 7 % de 50.000
    assert.equal(f(1000, 99999, 50000), 1000);      // pidió menos
    assert.equal(f(99999, 800, 50000), 800);        // saldo corto
    assert.equal(f(1000, 5000, 0), 0);              // sin compra no hay crédito
    assert.equal(f(-5, 5000, 50000), 0);            // negativos
    assert.equal(f(1000, 5000, 50000, 0), 0);       // admin lo apagó
    assert.equal(f('abc', 5000, 50000), 0);
    assert.equal(f(1000.9, 5000, 50000), 1000);     // siempre entero
});

test('config nueva: presupuesto 150.000, vigencia 30 días, pedido previo sí, 40 partidas; valores locos se acotan', () => {
    assert.equal(cfg.presupuestoDiario, 150000);
    assert.equal(cfg.creditoVigenciaDias, 30);
    assert.equal(cfg.requierePedidoPrevio, true);
    assert.equal(cfg.maxPartidasDia, 40);
    const c = J.normalizarConfig({ presupuestoDiario: -5, creditoVigenciaDias: 9999, requierePedidoPrevio: false, maxPartidasDia: 0 });
    assert.equal(c.presupuestoDiario, 0);
    assert.equal(c.creditoVigenciaDias, 365);
    assert.equal(c.requierePedidoPrevio, false);
    assert.equal(c.maxPartidasDia, 1);
});

test('créditos vencidos valen 0; vigentes o sin vencimiento valen su saldo', () => {
    const ahora = Date.UTC(2026, 10, 22);
    assert.equal(J.creditoVigente({ creditoJuego: 500, creditoJuegoVence: ahora + 1000 }, ahora), 500);
    assert.equal(J.creditoVigente({ creditoJuego: 500, creditoJuegoVence: ahora - 1 }, ahora), 0);
    assert.equal(J.creditoVigente({ creditoJuego: 500 }, ahora), 500);            // sin vencimiento guardado
    assert.equal(J.creditoVigente({ creditoJuego: -20 }, ahora), 0);
    assert.equal(J.creditoVigente(null, ahora), 0);
    assert.equal(J.nuevoVencimiento(cfg, ahora), ahora + 30 * 86400000);
    assert.equal(J.nuevoVencimiento(J.normalizarConfig({ creditoVigenciaDias: 0 }), ahora), 0);
});

test('presupuesto diario: recorta al saldo del día; 0 = sin tope', () => {
    assert.deepEqual(J.aplicarPresupuesto({ creditoGanado: 300, emitidoHoy: 0, presupuesto: 1000 }), { credito: 300, recortado: false });
    assert.deepEqual(J.aplicarPresupuesto({ creditoGanado: 300, emitidoHoy: 900, presupuesto: 1000 }), { credito: 100, recortado: true });
    assert.deepEqual(J.aplicarPresupuesto({ creditoGanado: 300, emitidoHoy: 1000, presupuesto: 1000 }), { credito: 0, recortado: true });
    assert.deepEqual(J.aplicarPresupuesto({ creditoGanado: 300, emitidoHoy: 99999, presupuesto: 0 }), { credito: 300, recortado: false });
});

test('nombre público: primer nombre + inicial, nunca el apellido; lunes de la semana', () => {
    assert.equal(J.nombrePublico('Juan Pablo Pinzón'), 'Juan P.');
    assert.equal(J.nombrePublico('maria'), 'Maria');
    assert.equal(J.nombrePublico('   '), 'Jugador');
    assert.equal(J.nombrePublico(null), 'Jugador');
    assert.ok(J.nombrePublico('Supercalifragilisticoespialidoso Gómez').length <= 18);
    assert.equal(J.lunesDe('2026-11-22'), '2026-11-16');   // domingo → lunes anterior
    assert.equal(J.lunesDe('2026-11-16'), '2026-11-16');   // el lunes es su propio lunes
    assert.equal(J.lunesDe('2026-11-18'), '2026-11-16');
    assert.equal(J.lunesDe('2026-03-01'), '2026-02-23');
});

test('hora feliz: franja en hora de Bogotá, cruce de medianoche y tope extra', () => {
    const J2 = require('../functions/juego.js');
    const cfg = J2.normalizarConfig({ horaFelizActiva: true, horaFelizDesde: 15, horaFelizHasta: 17, horaFelizMult: 2, horaFelizTopeExtra: 150 });
    const bog = (h) => Date.UTC(2026, 10, 22, h + 5, 30);   // h:30 en Bogotá
    assert.equal(J2.horaFelizVigente(cfg, bog(14)), null);
    assert.equal(J2.horaFelizVigente(cfg, bog(15)).mult, 2);
    assert.equal(J2.horaFelizVigente(cfg, bog(17)), null);
    assert.equal(J2.horaFelizVigente({ ...cfg, horaFelizActiva: false }, bog(15)), null);
    const noche = { ...cfg, horaFelizDesde: 22, horaFelizHasta: 2 };
    assert.ok(J2.horaFelizVigente(noche, bog(23)) && J2.horaFelizVigente(noche, bog(1)) && !J2.horaFelizVigente(noche, bog(12)));
    const hf = J2.horaFelizVigente(cfg, bog(16));
    const base = J2.calcularResultado({ estado: {}, cfg, puntaje: 100, dia: '2026-11-22' });
    const feliz = J2.calcularResultado({ estado: {}, cfg, puntaje: 100, dia: '2026-11-22', horaFeliz: hf });
    assert.equal(base.puntosOtorgados, 100); assert.equal(feliz.puntosOtorgados, 200);
    const tope = J2.calcularResultado({ estado: { juegoHoyDia: '2026-11-22', juegoHoyPts: 400 }, cfg, puntaje: 500, dia: '2026-11-22', horaFeliz: hf });
    assert.equal(tope.puntosOtorgados, 50);   // tope 300 + 150 extra - 400 ya acreditados
});
