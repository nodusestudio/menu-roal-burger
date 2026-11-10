// Gastos solo con la caja abierta + recordatorios: reglas puras y garantías de código.
//   node --test tests/gastos-pendientes.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const js = fs.readFileSync(path.join(__dirname, '../src/js/admin.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '../admin.html'), 'utf8');

const a = js.indexOf('// SYNC:gastos-pendientes:inicio');
const b = js.indexOf('// SYNC:gastos-pendientes:fin');
assert.ok(a > 0 && b > a, 'No se encontró el bloque gastos-pendientes en admin.js');
const { gpNormalizar, gpAgregarA, gpQuitarDe } = new Function(`${js.slice(a, b)}\n return { gpNormalizar, gpAgregarA, gpQuitarDe };`)();

test('normaliza: descarta lo vacío, recorta, redondea el monto y no inventa campos', () => {
    const r = gpNormalizar([
        { id: 'a', descripcion: '  Pollo  ', monto: '45000.7', creadoAt: 5, creadoPor: 'x' },
        { id: 'b', descripcion: '', monto: 10 },
        { descripcion: 'sin id', monto: 10 },
        null,
        { id: 'c', descripcion: 'Sin monto', monto: -3 }
    ]);
    assert.deepEqual(r, [
        { id: 'a', descripcion: 'Pollo', monto: 45001, creadoAt: 5, creadoPor: 'x' },
        { id: 'c', descripcion: 'Sin monto', monto: 0, creadoAt: 0, creadoPor: '' }
    ]);
});

test('normaliza entradas que no son lista', () => {
    assert.deepEqual(gpNormalizar(undefined), []);
    assert.deepEqual(gpNormalizar('x'), []);
});

test('agregar y quitar no tocan los demás recordatorios', () => {
    let l = gpAgregarA([], { id: 'gp_1', descripcion: 'Uno', monto: 1000 });
    l = gpAgregarA(l, { id: 'gp_2', descripcion: 'Dos', monto: 0 });
    assert.deepEqual(l.map((x) => x.id), ['gp_1', 'gp_2']);
    assert.deepEqual(gpQuitarDe(l, 'gp_1').map((x) => x.id), ['gp_2']);
    assert.deepEqual(gpQuitarDe(l, 'no_existe').map((x) => x.id), ['gp_1', 'gp_2']);
});

test('descripción de más de 100 caracteres se recorta', () => {
    const r = gpAgregarA([], { id: 'g', descripcion: 'x'.repeat(300) });
    assert.equal(r[0].descripcion.length, 100);
});

test('con la caja cerrada el formulario SÍ se abre: el efectivo queda bloqueado y las cuentas siguen disponibles', () => {
    const f = js.slice(js.indexOf('function openGastoModal(prefill) {'));
    assert.ok(!/openGastoCajaCerradaModal\(\); return;/.test(f.slice(0, 500)), 'ya no se desvía al recordatorio: las cuentas no dependen de la caja');
    assert.match(js, /const sinCaja = gastoEsEfectivo\(m\.id\) && !cajaAbierta;/);
    assert.match(js, /nota\.hidden = cajaAbierta;/);
    assert.match(js, /data-gasto-recordar/);
});

test('el tipo del gasto sale del método: efectivo → "caja" (turno abierto), cuentas → "externo" (sin depender de la caja)', () => {
    assert.match(js, /gastoTipoPorMetodo\(metodo\) === 'caja' \? \{ cajaAperturaAt, tipo: 'caja' \} : \{ cajaAperturaAt: null, tipo: 'externo' \}/);
    assert.ok(!js.includes('_gastoFromHistorial'));
    assert.ok(!js.includes('fromHistorial'));
});

test('se quitó el camino que reescribía un cierre ya cerrado y el botón "Gastos" del Historial', () => {
    assert.ok(!js.includes('openCierreGastoModal'));
    assert.ok(!js.includes('btn-gasto-cierre'));
    assert.ok(!html.includes('gastosHistorialBtn'));
    assert.ok(!/CIERRES_CAJA_COLLECTION\)\.doc\(cierre\.id\)\.update/.test(js), 'nadie debe editar un cierre ya hecho');
});

test('los tres botones de gasto que quedan abren el mismo modal', () => {
    assert.ok(js.includes("document.getElementById('gastosBtn')?.addEventListener('click', () => openGastoModal());"));
    assert.ok(js.includes("document.getElementById('gastosInformesNewBtn')?.addEventListener('click', () => openGastoModal());"));
});

test('el efectivo se re-valida contra la caja al guardar (por si se cerró desde otro equipo)', () => {
    assert.match(js, /La caja está cerrada: el efectivo solo se paga con la caja abierta\. Elige una cuenta/);
});

test('el recordatorio viaja con el estado de caja y se refresca al abrir/cerrar', () => {
    assert.match(js, /renderSalesDayBanner\(\);\r?\n\s+_gpAlCambiarCaja\(\);/);
    assert.ok(html.includes('id="gastosPendientesBanner"'));
});

test('el recordatorio no se mezcla con los saldos: vive en admin_estado, no en gastos_caja ni en cierres', () => {
    const bloque = js.slice(b, js.indexOf('function openGastoModal(prefill) {'));
    assert.ok(!bloque.includes('GASTOS_CAJA_COLLECTION'));
    assert.ok(!bloque.includes('CIERRES_CAJA_COLLECTION'));
    assert.match(bloque, /SALES_DAY_STATE_COLLECTION\)\.doc\(GASTOS_PENDIENTES_DOC_ID\)/);
});
