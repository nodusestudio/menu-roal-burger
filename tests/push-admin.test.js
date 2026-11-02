const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const P = require('../functions/pushAdmin');
const { avisosCelular } = require('../functions/fodiAvisos');
const A = require('../functions/adminAsistente');

// ── base de datos y mensajería simuladas ──
function dbCon(tokens = [], extra = {}) {
    const borrados = [], sets = [];
    const db = {
        borrados, sets,
        collection: (c) => ({
            get: async () => ({ docs: c === 'admin_fcm_tokens' ? tokens.map((t) => ({ id: t.id, data: () => t })) : [] }),
            doc: (id) => ({
                get: async () => {
                    if (c === 'admin_fcm_tokens') { const t = tokens.find((x) => x.id === id); return { exists: !!t, id, data: () => t }; }
                    const d = extra[c + '/' + id]; return { exists: !!d, data: () => d };
                },
                delete: async () => { borrados.push(c + '/' + id); },
                set: async (v) => { sets.push({ c, id, v }); }
            })
        })
    };
    return db;
}
const mensajeria = (resultados) => {
    const enviados = [];
    return { enviados, sendEachForMulticast: async (m) => { enviados.push(m); const responses = m.tokens.map((_, i) => resultados[i] || { success: true }); return { responses, successCount: responses.filter((r) => r.success).length, failureCount: responses.filter((r) => !r.success).length }; } };
};
const tk = (id, token) => ({ id, token: token || id.padEnd(30, 'x') });

test('enviarPush manda un mensaje de solo datos a todos los dispositivos, con acciones y datos como texto', async () => {
    const db = dbCon([tk('u1_a'), tk('u1_b')]);
    const m = mensajeria([]);
    const r = await P.enviarPush(db, { title: 'Hola', body: 'x'.repeat(300), tag: 't1', url: '/admin.html', actions: [{ action: 'agregar', title: 'Agregar a contactos' }], data: { clienteId: 'c9', numero: 5 }, tipo: 'cliente_nuevo' }, { messaging: m, nowMs: Date.parse('2026-11-02T12:00:00-05:00') });
    assert.strictEqual(r.enviados, 2);
    const msg = m.enviados[0];
    assert.strictEqual(msg.tokens.length, 2);
    assert.ok(!('notification' in msg), 'sin clave notification: el service worker arma el aviso');
    assert.strictEqual(msg.data.title, 'Hola');
    assert.strictEqual(msg.data.body.length, 140);
    assert.strictEqual(msg.data.clienteId, 'c9');
    assert.strictEqual(msg.data.numero, '5');
    assert.deepStrictEqual(JSON.parse(msg.data.acciones), [{ action: 'agregar', title: 'Agregar a contactos' }]);
    assert.ok(!('fcmOptions' in msg.webpush), 'sin link relativo');
    assert.strictEqual(msg.webpush.headers.Urgency, 'high');
    assert.ok(db.sets.some((s) => s.c === 'configuracion' && s.id === 'push_stats'), 'cuenta el envío');
});

test('enviarPush borra los dispositivos vencidos y respeta soloDoc y la lista vacía', async () => {
    const db = dbCon([tk('u1_a'), tk('u1_b')]);
    const m = mensajeria([{ success: true }, { success: false, error: { code: 'messaging/registration-token-not-registered' } }]);
    const r = await P.enviarPush(db, { title: 't', body: 'b', tag: 'x' }, { messaging: m });
    assert.deepStrictEqual([r.enviados, r.fallidos], [1, 1]);
    assert.deepStrictEqual(db.borrados, ['admin_fcm_tokens/u1_b']);

    const solo = await P.enviarPush(dbCon([tk('u1_a'), tk('u1_b')]), { title: 't', body: 'b', tag: 'x', soloDoc: 'u1_b' }, { messaging: m2() });
    function m2() { const mm = mensajeria([]); m2.ref = mm; return mm; }
    assert.strictEqual(solo.enviados, 1);
    assert.strictEqual(m2.ref.enviados[0].tokens.length, 1);

    const vacio = await P.enviarPush(dbCon([]), { title: 't', body: 'b', tag: 'x' }, { messaging: mensajeria([]) });
    assert.deepStrictEqual(vacio, { enviados: 0 });
});

test('aviso de cliente nuevo: lleva el botón y la dirección para el contacto; no avisa lo creado en el panel ni sin teléfono', () => {
    const a = P.armarAvisoClienteNuevo('phone_300', { customerName: 'Ana', customerPhone: '300 123 4567', whatsappUser: '@ana', source: 'public_web' });
    assert.strictEqual(a.title, '👤 Cliente nuevo');
    assert.strictEqual(a.body, 'Ana · 300 123 4567 · 💬 @ana');
    assert.strictEqual(a.actions[0].action, 'agregar');
    assert.strictEqual(a.data.clienteId, 'phone_300');
    assert.match(a.url, /agregarContacto=phone_300/);
    for (const origen of ['admin_import', 'import']) assert.strictEqual(P.armarAvisoClienteNuevo('x', { customerName: 'Z', customerPhone: '3', source: origen }), null);
    assert.strictEqual(P.armarAvisoClienteNuevo('x', { customerName: 'Z', customerPhone: '', source: 'web' }), null);
    assert.strictEqual(P.armarAvisoClienteNuevo('x', null), null);
});

test('la activación de un dispositivo manda la prueba solo a ese dispositivo', async () => {
    const db = dbCon([tk('u1_a'), tk('u1_b')]);
    const m = mensajeria([]);
    // avisarActivacion usa el mensajero real: se prueba el armado con enviarPush y soloDoc
    const r = await P.enviarPush(db, { title: '✅ Avisos activados', body: 'ok', tag: 'roal-prueba', tipo: 'prueba', soloDoc: 'u1_a' }, { messaging: m });
    assert.strictEqual(r.enviados, 1);
    assert.strictEqual(m.enviados[0].data.tipo, 'prueba');
});

test('FODI: avisos_celular lista dispositivos y suma los últimos 7 días por tipo', async () => {
    const ahora = Date.parse('2026-11-02T12:00:00-05:00');
    const db = dbCon([{ id: 'u_1', token: 'x'.repeat(30), etiqueta: 'Android · Chrome (app instalada)', instalada: true }], {
        'configuracion/push_stats': { dias: { '2026-11-02': { cliente_nuevo: { enviados: 3, fallidos: 0 }, pedido_nuevo: { enviados: 5, fallidos: 1 } }, '2026-11-01': { cliente_nuevo: { enviados: 2, fallidos: 0 } }, '2026-10-01': { pedido_nuevo: { enviados: 99, fallidos: 0 } } } }
    });
    const r = await avisosCelular(db, ahora);
    assert.strictEqual(r.dispositivos_activados, 1);
    assert.strictEqual(r.dispositivos[0].dispositivo, 'Android · Chrome (app instalada)');
    assert.strictEqual(r.ultimos_7_dias.avisos_enviados, 10);   // el día viejo (hace más de 7) no cuenta
    assert.strictEqual(r.ultimos_7_dias.avisos_fallidos, 1);
    assert.strictEqual(r.ultimos_7_dias.por_tipo.find((t) => t.tipo === 'cliente nuevo').enviados, 5);
    const sin = await avisosCelular(dbCon([]), ahora);
    assert.strictEqual(sin.dispositivos_activados, 0);
    assert.match(sin.como_activar, /Avisos al celular/);
});

test('FODI: avisos_celular está registrada y ejecutable', async () => {
    assert.ok(A.TOOLS.some((t) => t.name === 'avisos_celular'));
    const r = await A.ejecutarHerramienta(dbCon([]), 'avisos_celular');
    assert.ok(!r.error);
    assert.strictEqual(r.dispositivos_activados, 0);
});

// ── tarjeta de contacto (.vcf) del panel: se prueba el texto real de src/js/admin.js ──
test('la tarjeta de contacto lleva nombre, teléfono con indicativo, dirección y usuario de WhatsApp', () => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'js', 'admin.js'), 'utf8');
    const a = src.indexOf('function _vcardEscape');
    const b = src.indexOf('function descargarContacto');
    assert.ok(a > 0 && b > a, 'no encontré las funciones de la tarjeta');
    const { construirVCard } = new Function(src.slice(a, b) + '; return { construirVCard };')();
    const v = construirVCard({ customerName: 'Ana, María', customerPhone: '300 123 4567', customerPhoneDigits: '3001234567', address: 'Cra 5 #10-20; Armenia', whatsappUser: '@ana.m' });
    assert.match(v, /^BEGIN:VCARD\r\nVERSION:3\.0\r\n/);
    assert.match(v, /FN:Ana\\, María/);
    assert.match(v, /TEL;TYPE=CELL:\+573001234567/);
    assert.match(v, /ADR;TYPE=HOME:;;Cra 5 #10-20\\; Armenia;;;;/);
    assert.match(v, /NOTE:Usuario de WhatsApp: @ana\.m/);
    assert.match(v, /END:VCARD\r\n$/);
    const sinDatos = construirVCard({ customerName: 'Cliente sin nombre', customerPhone: 'No registrado', address: 'Sin direccion registrada', whatsappUser: '@solo' });
    assert.match(sinDatos, /FN:@solo/);
    assert.ok(!/TEL;/.test(sinDatos) && !/ADR;/.test(sinDatos));
});

test('aviso de cierre de caja: resumen con ventas, métodos, gastos y neto, y sin datos no avisa', () => {
    const a = P.armarAvisoCierre('c1', { ingresosTotal: 1250000, transactionCount: 42, voidedCount: 1, ingresosMethod: { efectivo: 500000, nequi: 750000 }, gastosTotal: 200000, grandTotal: 1050000, aperturaBy: 'ANA' });
    assert.match(a.title, /Caja cerrada/);
    assert.match(a.body, /42 pedidos · 1 anulados/);
    assert.match(a.body, /Efectivo .*500\.000/);
    assert.match(a.body, /Neto .*1\.050\.000/);
    assert.match(a.body, /Abrió: ANA/);
    assert.strictEqual(a.tipo, 'cierre_caja');
    assert.strictEqual(P.armarAvisoCierre('x', null), null);
});
