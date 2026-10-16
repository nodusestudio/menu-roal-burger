const test = require('node:test');
const assert = require('node:assert');
const { calcular, topPublicaciones, serieSeguidores, TOOLS } = require('../functions/adminAsistente');

test('calcular: aritmética, porcentajes y funciones', () => {
    assert.strictEqual(calcular('(48500-31200)/48500*100').resultado, 35.670103);
    assert.strictEqual(calcular('2+3*4').resultado, 14);
    assert.strictEqual(calcular('200000*12%').resultado, 24000);
    assert.strictEqual(calcular('10 % 3').resultado, 1);
    assert.strictEqual(calcular('2^3^2').resultado, 512);
    assert.strictEqual(calcular('-(4+1)*2').resultado, -10);
    assert.strictEqual(calcular('round(max(3,7.4,2))').resultado, 7);
    assert.strictEqual(calcular('$1500000/30').resultado, 50000);
});

test('calcular: rechaza lo no aritmético y la división por cero', () => {
    assert.ok(calcular('process.exit()').error);
    assert.ok(calcular('require("fs")').error);
    assert.ok(calcular('1/0').error);
    assert.ok(calcular('2+').error);
    assert.ok(calcular('').error);
    assert.ok(calcular('(1+2').error);
});

test('serieSeguidores: primero, último y cambio', () => {
    assert.strictEqual(serieSeguidores([]), null);
    const s = serieSeguidores([{ fecha: '2026-10-03', seguidores: 130 }, { fecha: '2026-10-01', seguidores: 100 }]);
    assert.strictEqual(s.cambio, 30);
    assert.strictEqual(s.primero.fecha, '2026-10-01');
});

test('topPublicaciones: ordena por alcance y cruza ventas del día', () => {
    const ms = Date.UTC(2026, 9, 5, 18);
    const top = topPublicaciones([
        { red: 'instagram', tipo: 'foto', publicadaAtMs: ms, ultimo: { reach: 50 } },
        { red: 'facebook', tipo: 'foto', publicadaAtMs: ms + 86400000, ultimo: { reach: 900, likes: 4 } }
    ], { '2026-10-05': 123000 }, 5);
    assert.strictEqual(top[0].red, 'facebook');
    assert.strictEqual(top[1].ventas_ese_dia, 123000);
});

test('las herramientas nuevas están registradas', () => {
    const nombres = TOOLS.map((t) => t.name);
    assert.ok(nombres.includes('redes_sociales') && nombres.includes('calcular'));
});
