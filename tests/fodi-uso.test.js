const test = require('node:test');
const assert = require('node:assert');
const { gastoFodi } = require('../functions/fodiUso');

const mk = (filas) => ({ collection: () => ({ get: async () => ({ docs: filas.map(([id, d]) => ({ id, data: () => d })) }) }) });
const AHORA = Date.UTC(2026, 9, 24, 18, 0); // 24/10/2026 13:00 Bogotá

test('gasto de FODI: totales, promedio, modelos y días más caros', async () => {
    const db = mk([
        ['2026-10-24', { costoUsd: 0.5, consultas: 10, consultas_sonnet: 9, consultas_opus: 1, tokensIn: 1000, cacheReadTokens: 600 }],
        ['2026-10-23', { costoUsd: 1.5, consultas: 5, consultas_sonnet: 3, consultas_opus: 2, tokensIn: 1000, cacheReadTokens: 200 }],
        ['2026-10-01', { costoUsd: 9, consultas: 50 }], // fuera de la ventana
        ['basura', { costoUsd: 99 }]
    ]);
    const r = await gastoFodi(db, { dias: 7 }, AHORA);
    assert.strictEqual(r.total_usd, 2); assert.strictEqual(r.consultas, 15); assert.strictEqual(r.promedio_usd_por_consulta, 0.1333);
    assert.deepStrictEqual(r.por_modelo, [{ modelo: 'sonnet', consultas: 12 }, { modelo: 'opus', consultas: 3 }]);
    assert.strictEqual(r.porcentaje_tokens_desde_cache, 40); assert.strictEqual(r.dias_mas_caros[0].fecha, '2026-10-23');
    assert.strictEqual(r.por_dia.length, 2);
});

test('sin datos no falla', async () => {
    const r = await gastoFodi(mk([]), {}, AHORA);
    assert.strictEqual(r.total_usd, 0); assert.strictEqual(r.promedio_usd_por_consulta, 0);
});
