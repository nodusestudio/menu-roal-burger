// Prueba en navegador real (Playwright) de los recordatorios de gasto: usa el código REAL de src/js/admin.js
// (bloque «GASTOS: SOLO CON LA CAJA ABIERTA») con una base de datos simulada en memoria.
//   node tests/gastos-pendientes.e2e.mjs    (sale con código 1 si algo falla)
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const js = fs.readFileSync(path.join(raiz, 'src/js/admin.js'), 'utf8');
const ini = js.indexOf('// SYNC:gastos-pendientes:inicio');
const fin = js.indexOf('function openGastoModal(prefill) {');
const bloque = js.slice(ini, fin);

const pagina = `<!doctype html><meta charset="utf-8"><body style="background:#0b0d14;color:#fff;font-family:sans-serif">
<div id="gastosPendientesBanner" hidden></div>
<script>
let cajaAperturaAt = 0;
const SALES_DAY_STATE_COLLECTION = 'admin_estado';
const store = {};
const firebaseDb = {
  collection: (c) => ({ doc: (d) => ({ __k: c + '/' + d,
    get: async () => ({ exists: !!store[c + '/' + d], data: () => store[c + '/' + d] }) }) }),
  runTransaction: async (fn) => fn({ get: async (ref) => ({ exists: !!store[ref.__k], data: () => store[ref.__k] }), set: (ref, v) => { store[ref.__k] = JSON.parse(JSON.stringify(v)); } })
};
const firestoreNow = () => Date.now();
const notices = []; const showNotice = (t, k) => notices.push(k + ':' + t);
const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const formatMoney = (v) => '$ ' + Number(v || 0).toLocaleString('es-CO');
const getCurrentAdminIdentity = () => 'cajero@prueba';
const llamadas = { abrirCaja: 0, gasto: [] };
const _showAbrirCajaModal = () => { llamadas.abrirCaja++; };
let confirmar = true; const showConfirmModal = async () => confirmar;
function openGastoModal(p) { llamadas.gasto.push(p || null); }
${bloque}
</script>`;
const archivo = path.join(raiz, '__gp_harness.html');
fs.writeFileSync(archivo, pagina);

const navegador = await chromium.launch();
const res = [];
const ok = (c, m) => res.push(`${c ? '✅' : '❌'} ${m}`);
try {
  const p = await navegador.newPage();
  const errores = []; p.on('pageerror', (e) => errores.push(e.message));
  await p.goto('file:///' + archivo.replace(/\\/g, '/'));

  // Caja cerrada: se ofrece el recordatorio
  await p.evaluate(() => openGastoCajaCerradaModal());
  ok(await p.locator('#gastoCerradaModal').isVisible(), 'con la caja cerrada se muestra «La caja está cerrada»');
  ok(await p.locator('[data-gc="guardar"]').isDisabled(), 'el botón de guardar espera una descripción');
  await p.fill('#gcDesc', 'Pollo del proveedor');
  await p.fill('#gcMonto', '45000');
  ok((await p.inputValue('#gcMonto')) === '45.000', 'el monto se escribe con puntos de miles');
  await p.click('[data-gc="guardar"]');
  await p.waitForSelector('#gastoCerradaModal', { state: 'detached' });
  const guardado = await p.evaluate(() => store['admin_estado/gastos_pendientes']);
  ok(guardado && guardado.items.length === 1 && guardado.items[0].descripcion === 'Pollo del proveedor' && guardado.items[0].monto === 45000, 'el recordatorio queda guardado con su descripción y monto');
  ok(guardado.items[0].creadoPor === 'cajero@prueba', '…y quién lo dejó');
  ok(await p.locator('#gastosPendientesBanner').isHidden(), 'con la caja cerrada NO aparece el aviso de pendientes');
  ok(await p.evaluate(() => !Object.keys(store).some((k) => k.includes('gastos_caja') || k.includes('cierres_caja'))), 'no se tocó gastos_caja ni cierres (no cuenta en ningún saldo)');

  // "Abrir la caja ahora"
  await p.evaluate(() => openGastoCajaCerradaModal());
  await p.click('[data-gc="abrir"]');
  ok(await p.evaluate(() => llamadas.abrirCaja) === 1, '«Abrir la caja ahora» abre el flujo de apertura');

  // Se abre la caja: aparece el aviso
  await p.evaluate(async () => { cajaAperturaAt = 1700000000000; await _gpCargar(); _gpAvisar(); });
  ok(await p.locator('#gastosPendientesBanner').isVisible(), 'al abrir la caja aparece «Tienes 1 gasto pendiente»');
  ok((await p.locator('#gastosPendientesBanner').innerText()).includes('1 gasto pendiente'), 'con el conteo correcto');
  ok((await p.evaluate(() => notices)).some((n) => n.includes('Tienes 1 gasto pendiente')), 'y un aviso en pantalla');
  await p.evaluate(() => _gpAvisar());
  ok((await p.evaluate(() => notices)).filter((n) => n.includes('Tienes 1')).length === 1, 'el aviso no se repite en la misma apertura');

  // Ver → Registrar abre el formulario con los datos
  await p.click('#gastosPendientesVerBtn');
  ok(await p.locator('#gastosPendientesModal').isVisible(), '«Ver» lista los pendientes');
  await p.click('[data-gp="registrar"]');
  const abrio = await p.evaluate(() => llamadas.gasto[0]);
  ok(abrio && abrio.descripcion === 'Pollo del proveedor' && abrio.monto === 45000 && abrio.pendienteId, '«Registrar» abre el formulario de gasto con descripción, monto y el id del recordatorio');

  // Quitar el recordatorio tras registrar
  await p.evaluate(() => _gpQuitar(llamadas.gasto[0].pendienteId));
  ok(await p.evaluate(() => store['admin_estado/gastos_pendientes'].items.length) === 0, 'al registrarse el gasto, el recordatorio se quita');
  ok(await p.locator('#gastosPendientesBanner').isHidden(), 'y el aviso desaparece');

  // Descartar
  await p.evaluate(async () => { await _gpAgregar('Hielo', 0); });
  await p.evaluate(() => openGastosPendientesModal());
  await p.click('[data-gp="descartar"]');
  await p.waitForSelector('#gastosPendientesModal', { state: 'detached' });
  ok(await p.evaluate(() => store['admin_estado/gastos_pendientes'].items.length) === 0, '«Descartar» (con confirmación) quita el recordatorio');

  // Dos a la vez (otro equipo escribe al mismo tiempo): la transacción no pierde ninguno
  await p.evaluate(async () => { await Promise.all([_gpAgregar('A', 1), _gpAgregar('B', 2)]); });
  ok(await p.evaluate(() => store['admin_estado/gastos_pendientes'].items.length) === 2, 'dos recordatorios seguidos se conservan los dos');

  ok(errores.length === 0, 'sin errores de JavaScript' + (errores.length ? ': ' + errores.join(' | ') : ''));
} finally {
  await navegador.close();
  fs.unlinkSync(archivo);
}
console.log(res.join('\n'));
if (res.some((r) => r.startsWith('❌'))) process.exit(1);
