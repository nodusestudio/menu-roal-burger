const test = require('node:test');
const assert = require('node:assert');
const { codigoFuente, aplicarCambios, BLOQUEADA } = require('../functions/fodiCodigo');

test('archivos sensibles bloqueados', () => {
    for (const r of ['functions/serviceAccountKey.json', '.env', 'functions/.secret.local.example', '.github/workflows/x.yml', 'node_modules/a/b.js', 'clave.pem', 'package-lock.json']) assert.ok(BLOQUEADA.test(r), r);
    for (const r of ['src/js/admin.js', 'functions/fodiCatalogo.js', 'index.html']) assert.ok(!BLOQUEADA.test(r), r);
});
test('reemplazo exacto: debe existir y ser único', () => {
    assert.strictEqual(aplicarCambios('a b c', [{ buscar: 'b', reemplazar: 'X' }], 'f').texto, 'a X c');
    assert.match(aplicarCambios('a b b', [{ buscar: 'b', reemplazar: 'X' }], 'f').error, /2 veces/);
    assert.match(aplicarCambios('a', [{ buscar: 'z', reemplazar: 'X' }], 'f').error, /no encontré/);
});
test('sin token no hace nada; bloquea rutas y valida entradas sin tocar la red', async () => {
    const boom = () => { throw new Error('no debe llamar a la red'); };
    assert.match((await codigoFuente({ accion: 'leer', ruta: 'x' }, '')).error, /GITHUB_TOKEN/);
    assert.ok((await codigoFuente({ accion: 'leer', ruta: 'functions/serviceAccountKey.json' }, 't', boom)).error);
    assert.ok((await codigoFuente({ accion: 'leer', ruta: '../etc/passwd' }, 't', boom)).error);
    assert.ok((await codigoFuente({ accion: 'proponer_cambio', titulo: 'ok corto', archivos: [] }, 't', boom)).error);
    assert.ok((await codigoFuente({ accion: 'proponer_cambio', titulo: 'cambio válido', archivos: [{ ruta: '.github/workflows/a.yml', cambios: [{ buscar: 'a', reemplazar: 'b' }] }] }, 't', boom)).error);
});
test('proponer_cambio valida TODO antes de crear la rama (si el texto no existe, no escribe)', async () => {
    const llamadas = [];
    const fetchFn = async (url, init) => { llamadas.push((init.method || 'GET') + ' ' + url); return { ok: true, text: async () => 'hola mundo', json: async () => ({ sha: 's1' }) }; };
    const r = await codigoFuente({ accion: 'proponer_cambio', titulo: 'cambio válido', archivos: [{ ruta: 'index.html', cambios: [{ buscar: 'NOEXISTE', reemplazar: 'x' }] }] }, 't', fetchFn);
    assert.match(r.error, /no encontré/); assert.ok(llamadas.every((l) => l.startsWith('GET')));
});
