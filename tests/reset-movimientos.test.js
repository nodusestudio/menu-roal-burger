// El script que borra el historial de dinero ya no usa un archivo de llave y, por defecto, NO borra nada.
//   node --test tests/reset-movimientos.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const src = fs.readFileSync(path.join(__dirname, '../functions/reset-movimientos.js'), 'utf8');

test('no usa archivo de llave (serviceAccountKey) ni credential.cert', () => {
    assert.ok(!/serviceAccountKey\.json'\)|KEY_PATH|credential\.cert/.test(src));
    assert.match(src, /admin\.initializeApp\(\{ projectId: PROJECT_ID \}\)/);
});
test('por defecto es un ensayo: borrar exige --ejecutar y escribir «BORRAR TODO»', () => {
    assert.match(src, /process\.argv\.includes\('--ejecutar'\)/);
    assert.match(src, /if \(!EJECUTAR\) \{[\s\S]*process\.exit\(0\)/);
    assert.match(src, /resp\.trim\(\) !== 'BORRAR TODO'/);
    // todo borrado queda DESPUÉS de la confirmación
    assert.ok(src.indexOf("resp.trim() !== 'BORRAR TODO'") < src.indexOf('await deleteCollection(col)'));
    assert.ok(src.indexOf('if (!EJECUTAR)') < src.indexOf('await deleteCollection(col)'));
});
test('antes de cualquier acción muestra cuántos documentos hay', () => {
    assert.ok(src.indexOf('await contar(col)') < src.indexOf('if (!EJECUTAR)'));
});
test('ningún archivo de llave queda versionado ni se despliega', () => {
    const gi = fs.readFileSync(path.join(__dirname, '../.gitignore'), 'utf8');
    assert.match(gi, /\*serviceAccountKey\*\.json/);
    assert.match(fs.readFileSync(path.join(__dirname, '../firebase.json'), 'utf8'), /serviceAccountKey/);
});
