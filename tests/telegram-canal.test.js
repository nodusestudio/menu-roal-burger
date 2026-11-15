// Canal de Telegram: validaciones y conexión con Telegram simulado (sin red ni Firestore real).
//   node --test --test-concurrency=1 tests/telegram-canal.test.js

const path = require('node:path');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const tg = require(path.join(__dirname, '..', 'functions', 'telegramCanal.js'));

const TOKEN = '123456789:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw0';

function dbFalsa() {
    const docs = {};
    const ref = (k) => ({ set: async (d, o) => { docs[k] = o?.merge ? { ...(docs[k] || {}), ...d } : { ...d }; }, get: async () => ({ exists: !!docs[k], data: () => docs[k] }), delete: async () => { delete docs[k]; } });
    return { docs, collection: (c) => ({ doc: (id) => ref(`${c}/${id}`) }) };
}

function fetchFalso(respuestas) {
    const llamadas = [];
    const fn = async (url, init) => {
        const metodo = url.split('/').pop();
        llamadas.push({ metodo, body: JSON.parse(init.body) });
        const r = respuestas[metodo];
        return { status: 200, json: async () => (typeof r === 'function' ? r(JSON.parse(init.body)) : r) };
    };
    fn.llamadas = llamadas;
    return fn;
}

test('limpiarToken y limpiarChat validan el formato', () => {
    assert.equal(tg.limpiarToken(` ${TOKEN} `), TOKEN);
    assert.throws(() => tg.limpiarToken('hola'));
    assert.equal(tg.limpiarChat('@roalburger'), '@roalburger');
    assert.equal(tg.limpiarChat('-1001234567890'), '-1001234567890');
    assert.throws(() => tg.limpiarChat('roalburger'));
});

test('conectar guarda la conexión y el estado público no incluye el token', async () => {
    const db = dbFalsa();
    const f = fetchFalso({
        getMe: { ok: true, result: { id: 42, username: 'roal_bot' } },
        getChat: { ok: true, result: { id: -1001, type: 'channel', title: 'Roal Burger', username: 'roalburger' } },
        getChatMember: { ok: true, result: { status: 'administrator', can_post_messages: true } }
    });
    const estado = await tg.conectar(db, { token: TOKEN, chat: '@roalburger' }, 'uid1', { fetchFn: f });
    assert.equal(estado.conectado, true);
    assert.equal(estado.activo, false);
    assert.equal(estado.chatTitle, 'Roal Burger');
    assert.ok(!JSON.stringify(estado).includes(TOKEN));
    assert.equal(db.docs['telegram_config/conexion'].botToken, TOKEN);
});

test('conectar rechaza si el bot no es administrador', async () => {
    const db = dbFalsa();
    const f = fetchFalso({
        getMe: { ok: true, result: { id: 42, username: 'roal_bot' } },
        getChat: { ok: true, result: { id: -1001, type: 'channel', title: 'X' } },
        getChatMember: { ok: true, result: { status: 'member' } }
    });
    await assert.rejects(tg.conectar(db, { token: TOKEN, chat: '@roalburger' }, 'u', { fetchFn: f }), /administrador/);
    assert.equal(db.docs['telegram_config/conexion'], undefined);
});

test('conectar muestra el error de Telegram si el token es inválido', async () => {
    const db = dbFalsa();
    const f = fetchFalso({ getMe: { ok: false, description: 'Unauthorized' } });
    await assert.rejects(tg.conectar(db, { token: TOKEN, chat: '@roalburger' }, 'u', { fetchFn: f }), /Unauthorized/);
});

test('textoHistoria cambia según normal o agotado', () => {
    assert.match(tg.textoHistoria('agotado'), /Se acabaron/);
    assert.match(tg.textoHistoria('normal', { palabra: 'FUEGO', productoNombre: 'Roal Doble' }), /FUEGO[\s\S]*|Roal Doble/);
});
