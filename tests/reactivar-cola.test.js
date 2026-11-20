// Pruebas puras (sin emulador) de functions/reactivarCola.js: elección de clientes, hora, regalo con tope, aprendizaje y control.
//   node --test tests/reactivar-cola.test.js
const path = require('node:path');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const rc = require(path.join(__dirname, '..', 'functions', 'reactivarCola.js'));

const DIA = 86400000;
const AHORA = new Date('2026-11-20T11:00:00-05:00').getTime();
const hace = (d, hora = 19) => { const t = new Date(AHORA - d * DIA); t.setUTCHours(hora + 5, 0, 0, 0); return t.getTime(); }; // hora Bogotá = UTC-5
const ped = (id, tel, d, total = 28000, hora = 19, items = [{ productName: 'Burger Caracas', categoryName: 'Burgers', quantity: 1 }]) =>
    ({ id, customerPhoneDigits: tel, customerName: `Cli ${tel.slice(-2)}`, createdAt: hace(d, hora), subtotal: total, items });
const sinAzar = () => 0.99; // nunca explora

test('elige por ritmo propio: quien pide cada 10 días entra a los 16; quien pide cada 60 no', () => {
    const rapido = [ped('a1', '3001000001', 46), ped('a2', '3001000001', 36), ped('a3', '3001000001', 26), ped('a4', '3001000001', 16)]; // ritmo 10 → umbral 15 → 16 días ya
    const lento = [ped('b1', '3001000002', 200), ped('b2', '3001000002', 140), ped('b3', '3001000002', 80), ped('b4', '3001000002', 22)]; // ritmo 60 → umbral 90 → 22 días no
    // el rápido lleva 16 días: no llega al mínimo de 21 que se usaba antes, pero sí a su umbral (15)
    const r = rc.construirCola({ pedidos: [...rapido, ...lento], ahora: AHORA, cfg: { controlPct: 0 }, rnd: sinAzar });
    const k = r.entradas.map((e) => e.k);
    assert.ok(k.includes('3001000001'));
    assert.ok(!k.includes('3001000002'));
});

test('el regalo nunca cuesta más que el tope del ticket y baja de escalón si el ticket es bajo', () => {
    const pedidos = [ped('c1', '3002000001', 100, 15000), ped('c2', '3002000001', 95, 15000)]; // 95 días → tramo 3
    const r = rc.construirCola({ pedidos, ahora: AHORA, cfg: { controlPct: 0, topeRegaloPct: 15 }, rnd: sinAzar });
    const e = r.entradas[0];
    assert.ok(e.costoRegalo <= 15000 * 0.15 || e.regalo === 'queso', `costo ${e.costoRegalo} supera el tope`);
    assert.equal(e.topeCosto, 2250);
});

test('con ticket alto y mucho tiempo sin pedir ofrece el regalo más fuerte', () => {
    const pedidos = [ped('d1', '3003000001', 120, 40000), ped('d2', '3003000001', 110, 40000)];
    const e = rc.construirCola({ pedidos, ahora: AHORA, cfg: { controlPct: 0 }, rnd: sinAzar }).entradas[0];
    assert.equal(e.regalo, 'carne_queso');
});

test('hora ideal: la moda del cliente si tiene 3+ pedidos; si no, la hora pico del local', () => {
    const tres = [ped('e1', '3004000001', 60, 28000, 13), ped('e2', '3004000001', 50, 28000, 13), ped('e3', '3004000001', 40, 28000, 20)];
    const uno = [ped('f1', '3004000002', 40, 28000, 13)];
    const extra = [ped('g1', '3009000001', 5, 20000, 19), ped('g2', '3009000002', 6, 20000, 19), ped('g3', '3009000003', 7, 20000, 19)];
    const r = rc.construirCola({ pedidos: [...tres, ...uno, ...extra], ahora: AHORA, cfg: { controlPct: 0 }, rnd: sinAzar });
    const a = r.entradas.find((e) => e.k === '3004000001'); const b = r.entradas.find((e) => e.k === '3004000002');
    assert.equal(a.hora, 13); assert.equal(a.horaOrigen, 'cliente');
    assert.equal(b.horaOrigen, 'local');
});

test('descanso: quien recibió un mensaje hace menos de 45 días no entra; con 2 mensajes sin pedir tampoco', () => {
    const pedidos = [ped('h1', '3005000001', 40), ped('h2', '3005000002', 120), ped('h3', '3005000003', 40)];
    const envios = [
        { telefono: '3005000001', creadoAt: AHORA - 10 * DIA },
        { telefono: '3005000002', creadoAt: AHORA - 90 * DIA }, { telefono: '3005000002', creadoAt: AHORA - 60 * DIA }
    ];
    const k = rc.construirCola({ pedidos, envios, ahora: AHORA, cfg: { controlPct: 0 }, rnd: sinAzar }).entradas.map((e) => e.k);
    assert.deepEqual(k, ['3005000003']);
});

test('aprendizaje: con 10+ envíos usa el regalo que más canjea; con rnd bajo explora', () => {
    const cupones = [];
    for (let i = 0; i < 10; i += 1) { cupones.push({ motivo: 'reactivar', regalo: 'queso', estado: 'vencido' }); cupones.push({ motivo: 'reactivar', regalo: 'papas', estado: i < 4 ? 'canjeado' : 'vencido' }); }
    const stats = rc.estadisticasRegalos(cupones);
    const cfg = rc.cfgDe({ exploracionPct: 20 });
    assert.equal(rc.elegirRegalo(30, 28000, cfg, stats, () => 0.99).regalo.tipo, 'papas'); // papas canjea 40 % vs 0 %
    assert.equal(rc.elegirRegalo(30, 28000, cfg, stats, () => 0).modo, 'explora');
});

test('control: el 10 % de los elegibles queda sin mensaje y los mensajes son 10 como máximo', () => {
    const pedidos = [];
    for (let i = 0; i < 80; i += 1) { const tel = `31000000${String(i).padStart(2, '0')}`; pedidos.push(ped(`p${i}a`, tel, 60), ped(`p${i}b`, tel, 45)); }
    const r = rc.construirCola({ pedidos, ahora: AHORA, cfg: { controlPct: 10 }, rnd: sinAzar });
    assert.equal(r.entradas.length, 10);
    assert.ok(r.control.length > 0 && r.control.length < 20);
    const ctl = new Set(r.control.map((x) => x.k));
    assert.ok(r.entradas.every((e) => !ctl.has(e.k)));
});

test('el mensaje nombra el favorito y el regalo, y deja {VENCE} para el panel', () => {
    const pedidos = [ped('m1', '3006000001', 40), ped('m2', '3006000001', 50)];
    const e = rc.construirCola({ pedidos, ahora: AHORA, cfg: { controlPct: 0 }, rnd: sinAzar }).entradas[0];
    assert.match(e.mensaje, /Burger Caracas/);
    assert.match(e.mensaje, /te regalo un queso extra/);
    assert.match(e.mensaje, /\{VENCE\}/);
});
