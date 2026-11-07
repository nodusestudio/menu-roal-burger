// Atajos del flujo de cobro del POS (src/js/admin.js): billetes rápidos de efectivo.
//   node --test tests/pos-flujo.test.js
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const assert = require('node:assert/strict');

const SRC = fs.readFileSync(path.join(__dirname, '..', 'src', 'js', 'admin.js'), 'utf8').replace(/\r\n/g, '\n');
const m = SRC.match(/function _pfCashSuggestions\([^)]*\) \{[\s\S]*?\n\}/);
assert.ok(m, 'no se encontró _pfCashSuggestions');
const { _pfCashSuggestions } = new Function(`${m[0]}\nreturn { _pfCashSuggestions };`)();

test('billetes rápidos: el redondo más cercano y los billetes grandes', () => {
    assert.deepEqual(_pfCashSuggestions(23000), [25000, 30000, 50000, 100000]);
    assert.deepEqual(_pfCashSuggestions(18500), [20000, 50000, 100000]);
});

test('billetes rápidos: nunca sugiere algo menor o igual al total', () => {
    [1000, 9999, 10000, 49999, 50000, 99500, 100000, 230000].forEach((t) => {
        _pfCashSuggestions(t).forEach((v) => assert.ok(v > t, `${v} no supera ${t}`));
    });
    assert.deepEqual(_pfCashSuggestions(0).length > 0, true);
});
