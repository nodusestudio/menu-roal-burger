// El panel (src/js/admin.js) pide el costo de los platos a costosFuente (window.CostosFuente): nuevo si hay enlace, viejo si no.
//   node --test tests/admin-costos-fuente-cliente.test.js
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { obtenerCostoPorMenuId, limpiarCache } = require('../functions/costosFuente');

const src = fs.readFileSync(path.join(__dirname, '..', 'src/js/admin.js'), 'utf8');
const i = src.indexOf('// ── Costos: fuente única (costosFuente.js');
const j = src.indexOf('async function _ensureCostosLoaded');
assert.ok(i > 0 && j > i, 'bloque de costosFuente en admin.js');

function armar({ enlaces, productosNuevos, costoNuevoFalla }) {
    const db = { collection: () => ({ where: (_c, _o, v) => ({ get: async () => ({ docs: enlaces.filter((e) => e.menuId === v).map((e) => ({ id: e.id, data: () => e })) }) }) }) };
    const ctx = {
        window: { CostosFuente: { obtenerCostoPorMenuId } },
        firebaseDb: db,
        firebaseFunctions: { httpsCallable: () => async () => { if (costoNuevoFalla) throw new Error('caído'); return { data: { productos: productosNuevos } }; } },
        _costos: { platos: [{ id: 'p1', productoMenuId: 'mA' }, { id: 'p2', productoMenuId: 'mB' }], cfg: { margenObjetivoPct: 50 } },
        _cNum: (v) => Number(v) || 0, _cPct1: (x) => Math.round(x * 10) / 10, Date, Math, Promise, Set
    };
    const fn = new Function(...Object.keys(ctx), `${src.slice(i, j)}; return { _cfPrecargar, _cfAjustar, _cfTag };`);
    return fn(...Object.values(ctx));
}
const fila = { precio: 20000, real: 5000, colch: 6500, fcReal: 25, fc: 32.5, margen: 67.5, sug: 13000, faltantes: [] };

test('con enlace la lista de platos usa el costo nuevo y lo marca; sin enlace queda el viejo', async () => {
    limpiarCache();
    const f = armar({ enlaces: [{ id: 'C1', menuId: 'mA', estado: 'enlazado' }], productosNuevos: [{ id: 'C1', costoCalculado: 8000 }] });
    await f._cfPrecargar(true);
    const a = f._cfAjustar({ productoMenuId: 'mA' }, fila), b = f._cfAjustar({ productoMenuId: 'mB' }, fila);
    assert.strictEqual(a.fuente, 'nuevo'); assert.strictEqual(a.colch, 8000); assert.strictEqual(a.margen, 60); assert.strictEqual(a.sug, 16000);
    assert.strictEqual(b.fuente, 'viejo'); assert.strictEqual(b.colch, 6500);
    assert.match(f._cfTag('nuevo'), /nuevo/); assert.match(f._cfTag('viejo'), /viejo/);
});

test('si Costos no responde, el panel sigue con el costo viejo sin romper', async () => {
    limpiarCache();
    const f = armar({ enlaces: [{ id: 'C1', menuId: 'mA', estado: 'enlazado' }], costoNuevoFalla: true });
    await f._cfPrecargar(true);
    assert.strictEqual(f._cfAjustar({ productoMenuId: 'mA' }, fila).fuente, 'viejo');
});
