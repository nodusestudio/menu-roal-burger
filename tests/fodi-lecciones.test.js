const test = require('node:test');
const assert = require('node:assert');
const { lecciones, bloqueLecciones } = require('../functions/fodiLecciones');
const { revisarSintaxis } = require('../functions/fodiCodigo');

const mkDb = () => {
    const datos = new Map();
    const doc = (id) => ({ get: async () => ({ exists: datos.has(id), data: () => datos.get(id) }), set: async (v) => { datos.set(id, v); }, delete: async () => { datos.delete(id); } });
    return { datos, collection: () => ({ doc, get: async () => ({ size: datos.size, docs: [...datos].map(([id, v]) => ({ id, data: () => v })) }) }) };
};

test('registrar, actualizar, listar y olvidar lecciones', async () => {
    const db = mkDb();
    assert.ok((await lecciones(db, { accion: 'registrar', tema: 'x', leccion: 'corta' })).error);
    assert.ok((await lecciones(db, { accion: 'registrar', tema: 'tokens', leccion: 'el token de acceso es abc123 para usar' })).error);
    const r = await lecciones(db, { accion: 'registrar', tipo: 'codigo', tema: 'Botones del panel', leccion: 'Los botones del admin van dentro de un article.admin-card y usan la clase cat-new-save-btn.' });
    assert.strictEqual(r.guardada, 'botones_del_panel');
    await lecciones(db, { accion: 'registrar', tipo: 'correccion', tema: 'botones del panel', leccion: 'Actualizada: usar también el estado inline dentro de la tarjeta.' });
    assert.strictEqual(db.datos.size, 1); assert.strictEqual(db.datos.get('botones_del_panel').veces, 2);
    assert.strictEqual((await lecciones(db, { accion: 'listar' })).lecciones.length, 1);
    assert.match(await bloqueLecciones(db), /\[correccion\] botones del panel: Actualizada/);
    assert.strictEqual((await lecciones(db, { accion: 'olvidar', tema: 'botones del panel' })).ok, true);
    assert.strictEqual(await bloqueLecciones(db), '');
    assert.ok((await lecciones(db, { accion: 'olvidar', tema: 'no existe' })).error);
});

test('revisarSintaxis: detecta JS/JSON roto y no estorba con módulos ES', () => {
    assert.strictEqual(revisarSintaxis('a.js', 'const a = 1;'), null);
    assert.match(revisarSintaxis('a.js', 'const a = ;'), /sintaxis/);
    assert.strictEqual(revisarSintaxis('a.js', "import x from 'y'; export const z = 1;"), null);
    assert.match(revisarSintaxis('a.json', '{ "a": }'), /JSON inválido/);
    assert.strictEqual(revisarSintaxis('a.html', '<div>'), null);
});
