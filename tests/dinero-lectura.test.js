// Las lecturas de dinero (cierres y gastos) vienen del SERVIDOR y, si fallan, no se vacían en silencio: se conserva lo último bueno y se avisa.
//   node --test tests/dinero-lectura.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const js = fs.readFileSync(path.join(__dirname, '../src/js/admin.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '../admin.html'), 'utf8');

const fa = js.indexOf('// SYNC:dinero-fallo:inicio'), fb = js.indexOf('// SYNC:dinero-fallo:fin');
assert.ok(fa > 0 && fb > fa);
const ga = js.indexOf('async function loadGastosCaja('), gb = js.indexOf('async function saveGasto(');
assert.ok(ga > 0 && gb > ga);

function montar(get) {
    const banners = [];
    const documento = {
        _el: null,
        getElementById() { return this._el; },
        createElement() { return { id: '', className: '', setAttribute() {}, remove() { documento._el = null; }, set innerHTML(v) { this._html = v; }, get innerHTML() { return this._html; } }; },
        querySelector() { return { insertBefore(el) { documento._el = el; banners.push(el); }, firstChild: null }; },
        body: null,
    };
    const fabrica = new Function('document', 'firebaseDb', 'GASTOS_CAJA_COLLECTION', `
        let _gastosCajaState = [{ id: 'viejo', monto: 1000 }];
        ${js.slice(fa, fb)}
        ${js.slice(ga, gb)}
        return { cargar: loadGastosCaja, estado: () => _gastosCajaState, fallo: () => _dineroFallo };
    `);
    const llamadas = [];
    const db = { collection: () => ({ orderBy() { const q = { limit: () => q, where: () => q, get: async (opt) => { llamadas.push(opt); return get(); } }; return q; } }) };
    return { ...fabrica(documento, db, 'gastos_caja'), llamadas, documento, banners };
}

test('la lectura de gastos pide SIEMPRE al servidor (no a la copia local)', async () => {
    const m = montar(() => ({ docs: [{ id: 'g1', data: () => ({ monto: 5000 }) }] }));
    await m.cargar();
    assert.deepEqual(m.llamadas, [{ source: 'server' }]);
    assert.deepEqual(m.estado(), [{ id: 'g1', monto: 5000 }]);
    assert.equal(m.fallo(), '');
});

test('si la lectura falla: NO se vacía la lista, se marca el fallo y aparece el aviso con «Reintentar»', async () => {
    const m = montar(() => { const e = new Error('Failed to get documents from server'); e.code = 'unavailable'; throw e; });
    await m.cargar();
    assert.deepEqual(m.estado(), [{ id: 'viejo', monto: 1000 }], 'conserva lo último leído bien');
    assert.match(m.fallo(), /No se pudieron leer los gastos de la jornada: unavailable/);
    assert.equal(m.banners.length, 1);
    assert.match(m.documento._el.innerHTML, /no se leyeron completos/);
    assert.match(m.documento._el.innerHTML, /data-dinero-reintentar/);
});

test('cuando la lectura vuelve a funcionar, el aviso se quita', async () => {
    let falla = true;
    const m = montar(() => { if (falla) throw new Error('sin red'); return { docs: [] }; });
    await m.cargar();
    assert.ok(m.documento._el);
    falla = false;
    await m.cargar();
    assert.equal(m.documento._el, null);
    assert.equal(m.fallo(), '');
});

test('cierres y gastos externos/traslados/ajustes también salen del servidor, y un fallo ya no los vacía en silencio', () => {
    const i = js.indexOf('async function loadCierresCaja()');
    const f = js.slice(i, i + 3200);
    assert.match(f, /\.get\(\{ source: 'server' \}\); \/\/ del servidor/);
    assert.match(f, /where\('tipo', 'in', \['externo', 'traslado', 'ajuste'\]\)\s*\.get\(\{ source: 'server' \}\)/);
    assert.ok(!/catch \(_\) \{\s*_gastosExternosState = \[\];/.test(f), 'ya no se ponen en [] al fallar');
    assert.match(f, /_dineroMarcarFallo\('No se pudieron leer los gastos externos y traslados', err\)/);
    assert.match(f, /_dineroMarcarFallo\('No se pudieron leer los cierres de caja', err\); throw err;/);
});

test('el aviso tiene estilo y el botón Reintentar vuelve a leer y a pintar', () => {
    assert.ok(html.includes('.dinero-fallo {'));
    assert.match(js, /closest\('\[data-dinero-reintentar\]'\)/);
    assert.match(js, /await loadCierresCaja\(\); await loadGastosCaja\(\);/);
});
