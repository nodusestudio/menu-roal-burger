// Prueba en navegador real (Playwright) de las ventanas de dinero: usa el código REAL de src/js/admin.js (Traslado, Ajustar saldos,
// «La caja está cerrada» y «Gastos pendientes») con los estilos reales de admin.html. Garantiza que TODAS comparten una sola
// estructura (vd-overlay / vd-card / vd-x / vd-title), que conservan sus ids y que se cierran igual (×, tocar fuera).
//   node tests/ventanas-dinero.e2e.mjs     (sale con código 1 si algo falla)
import fs from 'node:fs';
import os from 'node:os';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const js = fs.readFileSync(path.join(raiz, 'src/js/admin.js'), 'utf8');
// Texto de una función de nivel superior: desde su inicio hasta la siguiente función de nivel superior
const funcion = (inicio) => {
  const a = js.indexOf(inicio);
  if (a < 0) throw new Error('No se encontró ' + inicio);
  const m = /\r?\n(?:async )?function |\r?\n\/\/ ──/.exec(js.slice(a + inicio.length));
  return js.slice(a, a + inicio.length + (m ? m.index : 0));
};
const gp = js.slice(js.indexOf('// SYNC:gastos-pendientes:inicio'), js.indexOf('function openGastoModal(prefill) {'));
const traslado = funcion('function openTrasladoModal(');
const ajuste = funcion('async function openAjusteSaldosModal(');
const abrirCaja = funcion('async function _showAbrirCajaModal(');

let html = fs.readFileSync(path.join(raiz, 'admin.html'), 'utf8').replace(/<script[\s\S]*?<\/script>/g, '');
const stub = `<script>
document.body.classList.remove('admin-loading','admin-locked'); document.body.classList.add('admin-unlocked');
let cajaAperturaAt = 0; const SALES_DAY_STATE_COLLECTION = 'admin_estado';
const OTRO_PAYMENT_METHOD = { id: 'otro', label: 'Otro', icon: '🧾' };
const _metodos = [{ id: 'efectivo', label: 'Efectivo', icon: '💵' }, { id: 'bancolombia', label: 'Bancolombia/Breve', icon: '🏦' }, { id: 'nequi', label: 'Nequi', icon: '💜' }];
const getPaymentMethods = () => _metodos;
const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const formatMoney = (v) => '$ ' + Number(v || 0).toLocaleString('es-CO');
const _historicoSumMethod = { efectivo: 878700, bancolombia: 723325 }; const _cajaDiariaSumMethod = {};
const _computeHistoricoSumMethod = () => ({ efectivo: 878700, bancolombia: 723325, nequi: 0, otro: 0 });
const loadCierresCaja = async () => [];
const showNotice = () => {}; const showConfirmModal = async () => true;
const _bindOverlayClose = (ov, fn) => ov.addEventListener('click', (e) => { if (e.target === ov) fn(); });
const saveGasto = async () => {}; const firestoreNow = () => Date.now(); const getCurrentAdminIdentity = () => 'x';
const _store = {};
const firebaseDb = { collection: (c) => ({ doc: (d) => ({ __k: c + '/' + d, get: async () => ({ exists: !!_store[c + '/' + d], data: () => _store[c + '/' + d] }) }) }),
  runTransaction: async (fn) => fn({ get: async (r) => ({ exists: !!_store[r.__k], data: () => _store[r.__k] }), set: (r, v) => { _store[r.__k] = JSON.parse(JSON.stringify(v)); } }) };
const _ccApplyData = () => {}; const _ccTotal = () => 150000; const _acLoadNombresUsados = async () => {}; const CC_DOC_ID = 'caja_chica_actual'; let _acNombresUsados = []; const CC_BILLETES = [2000, 5000, 10000, 20000, 50000, 100000]; const CC_MONEDAS = [50, 100, 200, 500, 1000];
let _ccGuardadosBilletes = {}; let _ccGuardadasMonedas = {}; let _ccBilletes = {}; let _ccMonedas = {}; const _capitalizeWords = (x) => x; const closeGastoModal = () => {}; const openGastoModal = () => {}; const renderCajaDiaria = () => {}; const renderLibroCierres = async () => {}; const renderGastosInformes = () => {};
let _gastosCajaState = []; let _cierresCajaState = [];
${gp}
${traslado}
${ajuste}
${abrirCaja}
</script>`;
const archivo = path.join(raiz, '__vd_harness.html');
fs.writeFileSync(archivo, html.replace('</body>', stub + '</body>'));
const srv = http.createServer((req, res) => {
  const f = path.join(raiz, decodeURIComponent(req.url.split('?')[0]));
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': f.endsWith('.css') ? 'text/css' : 'text/html' });
  fs.createReadStream(f).pipe(res);
}).listen(0);
const port = srv.address().port;

const res = []; const ok = (c, m) => res.push(`${c ? '✅' : '❌'} ${m}`);
const navegador = await chromium.launch();
try {
  const p = await navegador.newPage({ viewport: { width: 1100, height: 820 } });
  const errores = []; p.on('pageerror', (e) => errores.push(e.message));
  p.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLA:', m.text()); });
  await p.goto(`http://localhost:${port}/__vd_harness.html`);

  const ventanas = [
    ['Traslado', 'trasladoMetodoModal', () => openTrasladoModal(), 'trasladoCloseBtn'],
    ['Ajustar saldos', 'ajusteSaldosModal', () => openAjusteSaldosModal(), 'ajusteSaldosClose'],
    ['Gasto con la caja cerrada', 'gastoCerradaModal', () => openGastoCajaCerradaModal(), null],
    ['Abrir caja', '_abrirCajaOverlay', () => _showAbrirCajaModal(), '_acCloseBtn', false],
    ['Gastos pendientes', 'gastosPendientesModal', async () => { await _gpAgregar('Pollo', 45000); openGastosPendientesModal(); }, null]
  ];
  for (const [nombre, id, abrir, idCerrar, cierraFuera = true] of ventanas) {
    await p.evaluate(abrir);
    await p.waitForSelector('#' + id);
    const info = await p.evaluate((i) => {
      const ov = document.getElementById(i), card = ov.firstElementChild, cs = getComputedStyle(card);
      return { ov: ov.className, card: card.className, x: !!ov.querySelector('.vd-x'), titulo: !!ov.querySelector('.vd-title'), radio: cs.borderRadius, fondo: cs.backgroundColor, inline: ov.getAttribute('style') || '' };
    }, id);
    ok(info.ov === 'vd-overlay' && info.card.startsWith('vd-card') && info.x && info.titulo, `${nombre}: usa la estructura común (overlay + tarjeta + × + título)`);
    ok(info.radio === '20px' && info.fondo === 'rgb(20, 23, 42)' && info.inline === '', `${nombre}: misma tarjeta (esquinas 20 px, fondo oscuro) y sin estilos pegados a mano`);
    await p.waitForTimeout(150);
    await p.screenshot({ path: path.join(os.tmpdir(), `vd-${id}.png`) });
    // cerrar con ×
    await p.click(`#${id} .vd-x`);
    await p.waitForSelector('#' + id, { state: 'detached' });
    ok(true, `${nombre}: se cierra con ×`);
    // y tocando fuera (Abrir caja NO: se está contando plata, un toque accidental fuera no debe perder el conteo)
    await p.evaluate(abrir); await p.waitForSelector('#' + id);
    await p.mouse.click(8, 8);
    if (cierraFuera) {
        await p.waitForSelector('#' + id, { state: 'detached' });
        ok(true, `${nombre}: se cierra tocando fuera`);
    } else {
        await p.waitForTimeout(200);
        ok(await p.locator('#' + id).count() === 1, `${nombre}: tocar fuera NO la cierra (protege el conteo de dinero); solo la ×`);
        await p.click(`#${id} .vd-x`); await p.waitForSelector('#' + id, { state: 'detached' });
    }
    if (idCerrar) { await p.evaluate(abrir); ok(await p.locator('#' + idCerrar).count() === 1, `${nombre}: conserva el id #${idCerrar}`); await p.click('#' + idCerrar); }
  }

  // Traslado: ids y roles de los controles
  await p.evaluate(() => openTrasladoModal());
  const ids = await p.evaluate(() => ['trasladoFrom', 'trasladoTo', 'trasladoMonto', 'trasladoConfirmBtn', 'trasladoFromBalance'].map((i) => !!document.getElementById(i)));
  ok(ids.every(Boolean), 'Traslado: conserva todos sus campos (origen, destino, monto, confirmar, saldo)');
  ok(await p.locator('#trasladoConfirmBtn').evaluate((e) => /--primary/.test(e.className)), 'Traslado: «Confirmar» usa el rol principal (naranja)');
  await p.click('#trasladoMetodoModal .vd-x');
  await p.evaluate(() => openAjusteSaldosModal()); await p.waitForSelector('#ajusteSaldosModal');
  ok(await p.locator('[data-ajuste-method]').count() === 4, 'Ajustar saldos: un campo por método (3 + Otro)');
  await p.fill('[data-ajuste-method="efectivo"]', '900000');
  ok((await p.locator('[data-ajuste-delta="efectivo"]').innerText()).includes('+$ 21.300'), 'Ajustar saldos: calcula la diferencia en vivo (+$ 21.300)');
  ok(await p.locator('#ajusteSaldosConfirm').evaluate((e) => /--primary/.test(e.className)), 'Ajustar saldos: «Guardar ajuste» usa el rol principal');
  ok(errores.length === 0, 'sin errores de JavaScript' + (errores.length ? ': ' + errores.join(' | ') : ''));
} finally {
  await navegador.close(); srv.close();
  if (!process.env.KEEP) fs.unlinkSync(archivo);
}
console.log(res.join('\n'));
if (res.some((r) => r.startsWith('❌'))) process.exit(1);
