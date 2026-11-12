const test = require('node:test');
const assert = require('node:assert');
const Cob = require('../functions/cobrosQr');
const V = require('../functions/vigilanciaBanco');
const B = require('../functions/bancoAviso');

const AHORA = 1_800_000_000_000;
const min = (n) => n * 60000;

// ── "Ya pagó" y el correo que llega después ──
const manual = (id, total, extra = {}) => ({ id, estado: 'pagado', manual: true, total, pagadoMs: AHORA - min(1), ...extra });

test('el correo que llega tras un "Ya pagó" se enlaza a ese cobro (en silencio)', () => {
    assert.strictEqual(Cob.elegirManualPendiente([manual('c1', 45000)], 45000, AHORA).id, 'c1');
});

test('no se enlaza si ya tiene pago, es de otro valor, es viejo o no fue manual', () => {
    assert.strictEqual(Cob.elegirManualPendiente([manual('c1', 45000, { pagoId: 'x' })], 45000, AHORA), null);
    assert.strictEqual(Cob.elegirManualPendiente([manual('c1', 45000)], 40000, AHORA), null);
    assert.strictEqual(Cob.elegirManualPendiente([manual('c1', 45000, { pagadoMs: AHORA - min(30) })], 45000, AHORA), null);
    assert.strictEqual(Cob.elegirManualPendiente([manual('c1', 45000, { manual: false })], 45000, AHORA), null);
});

test('con dos "Ya pagó" del mismo valor se enlaza primero el más antiguo', () => {
    const r = Cob.elegirManualPendiente([manual('nuevo', 20000, { pagadoMs: AHORA - min(1) }), manual('viejo', 20000, { pagadoMs: AHORA - min(5) })], 20000, AHORA);
    assert.strictEqual(r.id, 'viejo');
});

test('la frase funciona sin nombre', () => {
    assert.strictEqual(B.frasePago('', 45000), 'Muchas gracias por tu pago de cuarenta y cinco mil pesos. Ya ha sido confirmado. Que vuelvas pronto.');
    assert.strictEqual(B.frasePago('Johan Eduardo Rojas Albornoz', 45000), 'Muchas gracias Johan Rojas por tu pago de cuarenta y cinco mil pesos. Ya ha sido confirmado. Que vuelvas pronto.');
});

function dbConfirmar(cobro, tv) {
    const escritos = { cobro: [], tv: [], anuncios: [] };
    const db = {
        escritos,
        collection(col) {
            return { doc: (id) => ({
                id,
                async get() { if (col === 'configuracion') return { exists: !!tv, data: () => tv }; return { exists: !!cobro, data: () => cobro }; },
                async update(v) { escritos.tv.push(v); },
                async set(v) { escritos.anuncios.push({ id, ...v }); }
            }) };
        },
        async runTransaction(fn) {
            return fn({ async get() { return { exists: !!cobro, data: () => cobro }; }, update(_r, v) { escritos.cobro.push(v); } });
        }
    };
    return db;
}

test('confirmarManual: cierra el cobro, avisa a la TV y crea el anuncio de voz', async () => {
    const db = dbConfirmar({ estado: 'abierto', total: 45000, pedidoTotal: 45000, cliente: 'Johan Eduardo Rojas Albornoz', creadoEn: { toMillis: () => AHORA - 40000 } }, { cobroId: 'c1', estado: 'esperando' });
    const r = await Cob.confirmarManual(db, 'c1', 'uid1', AHORA);
    assert.deepStrictEqual(r, { ok: true, estado: 'pagado' });
    assert.strictEqual(db.escritos.cobro[0].manual, true);
    assert.strictEqual(db.escritos.cobro[0].esperaSeg, 40);
    assert.strictEqual(db.escritos.tv[0].estado, 'pagado');
    assert.strictEqual(db.escritos.tv[0].pagador, 'Johan Rojas');
    assert.strictEqual(db.escritos.anuncios[0].frase, 'Muchas gracias Johan Rojas por tu pago de cuarenta y cinco mil pesos. Ya ha sido confirmado. Que vuelvas pronto.');
});

test('confirmarManual: un cobro que ya no está abierto no se confirma dos veces', async () => {
    const db = dbConfirmar({ estado: 'pagado', total: 45000 }, null);
    const r = await Cob.confirmarManual(db, 'c1', 'uid1', AHORA);
    assert.deepStrictEqual(r, { ok: false, estado: 'pagado' });
    assert.strictEqual(db.escritos.anuncios.length, 0);
});

// ── Vigilancia del aviso del banco ──
const pos = (id, monto, haceMin, extra = {}) => ({ pedidoId: id, monto, ms: AHORA - min(haceMin), incierto: false, ...extra });
const ban = (id, monto, haceMin) => ({ id, monto, ms: AHORA - min(haceMin), nombre: 'X' });

test('vigilancia: un cobro con aviso del banco no alerta; uno sin aviso pasada la gracia sí', () => {
    assert.strictEqual(V.evaluar([pos('a', 10000, 20)], [ban('p1', 10000, 19)], AHORA).alerta, false);
    const ev = V.evaluar([pos('a', 10000, 20), pos('b', 33000, 15)], [ban('p1', 10000, 19)], AHORA);
    assert.strictEqual(ev.alerta, true);
    assert.deepStrictEqual(ev.pendientes.map((x) => x.pedidoId), ['b']);
    assert.strictEqual(ev.monto, 33000);
});

test('vigilancia: dentro de los primeros 8 minutos todavía no alerta; los pagos divididos no alertan', () => {
    assert.strictEqual(V.evaluar([pos('a', 10000, 3)], [], AHORA).alerta, false);
    assert.strictEqual(V.evaluar([pos('a', 7000, 30, { incierto: true })], [], AHORA).alerta, false);
});

test('vigilancia: avisa una vez, repite cada hora y avisa cuando se recupera', () => {
    const ev = { alerta: true, pendientes: [{}], monto: 1000 };
    const d1 = V.decidir({}, ev, AHORA);
    assert.strictEqual(d1.accion, 'alertar');
    assert.strictEqual(V.decidir(d1.estado, ev, AHORA + min(10)).accion, null);
    assert.strictEqual(V.decidir(d1.estado, ev, AHORA + min(61)).accion, 'alertar');
    const ok = V.decidir(d1.estado, { alerta: false, pendientes: [], monto: 0 }, AHORA + min(15));
    assert.strictEqual(ok.accion, 'recuperado');
    assert.strictEqual(V.decidir(ok.estado, { alerta: false, pendientes: [], monto: 0 }, AHORA + min(25)).accion, null);
});

test('mesa: "Mesa 5" no es el nombre de quien paga (la voz espera al nombre del banco)', () => {
    assert.strictEqual(Cob.esNombreDeMesa('Mesa 5'), true);
    assert.strictEqual(Cob.esNombreDeMesa('  mesa 12'), true);
    assert.strictEqual(Cob.esNombreDeMesa('Mesa'), true);
    assert.strictEqual(Cob.esNombreDeMesa('Johan Rojas'), false);
    assert.strictEqual(Cob.esNombreDeMesa('Mesalina Pérez'), false);
    assert.strictEqual(Cob.esNombreDeMesa(''), false);
});
