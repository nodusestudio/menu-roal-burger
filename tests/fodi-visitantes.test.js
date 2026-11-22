const path = require('node:path');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { resumir } = require(path.join(__dirname, '..', 'functions', 'fodiVisitantes.js'));

test('visitantes en vivo: solo cuenta latidos de menos de 90 s y resume el carrito', () => {
    const ahora = 1_000_000_000_000;
    const docs = [
        { ts: ahora - 10000, inicio: ahora - 300000, etapa: 'carrito', disp: 'movil', fuente: 'instagram', items: [{ n: 'Pepito Mix', q: 2, p: 29000, h: 0 }], total: 58000 },
        { ts: ahora - 200000, inicio: ahora - 900000, etapa: 'viendo', disp: 'pc', fuente: 'directo', items: [], total: 0 }, // dejó de latir: no cuenta
        { ts: ahora - 5000, inicio: ahora - 60000, etapa: 'pagando', disp: 'pc', fuente: 'google', items: [{ n: 'Papas', q: 1, p: 9000, h: 1 }], total: 9000 }
    ];
    const r = resumir(docs, ahora);
    assert.equal(r.enLineaAhora, 2);
    assert.equal(r.conPedidoEnCarrito, 2);
    assert.equal(r.pagando, 1);
    assert.equal(r.visitantes[0].carrito[0], '2x Pepito Mix');
    assert.equal(r.visitantes[0].dispositivo, 'celular');
});
