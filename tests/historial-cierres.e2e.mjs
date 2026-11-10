// Prueba en navegador real (Playwright) del HISTORIAL DE CAJAS (Cierres): usa el código REAL de renderLibroCierres (src/js/admin.js)
// con los documentos reales de la foto del dinero. Comprueba las tarjetas y el pie TOTALES (lo que ve el dueño) al peso.
//   node tests/historial-cierres.e2e.mjs          (sale con código 1 si algo falla)
//   DUMP=ruta.json node tests/historial-cierres.e2e.mjs   guarda lo pintado, para comparar antes/después de un cambio
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const js = fs.readFileSync(path.join(raiz, 'src/js/admin.js'), 'utf8');
const corte = (desde, hasta) => {
  const a = js.indexOf(desde); const b = js.indexOf(hasta, a + desde.length);
  if (a < 0 || b < 0) throw new Error(`No se encontró el bloque ${desde}`);
  return js.slice(a, b);
};
const funcion = (inicio) => {
  const a = js.indexOf(inicio);
  if (a < 0) throw new Error('No se encontró ' + inicio);
  const m = /\r?\n(?:async )?function |\r?\n\/\/ ──|\r?\ndocument\.getElementById\(/.exec(js.slice(a + inicio.length));
  return js.slice(a, a + inicio.length + (m ? m.index : 0));
};
const ayudantes = corte('function _tsMs(value) {', '// ── HORA DE COLOMBIA') + corte('// SYNC:dias-bogota:inicio', '// SYNC:dias-bogota:fin')
  + corte('function _cierreDiaMs(c) {', '// Un pedido anulado puede venir');
const saldos = fs.readFileSync(path.join(raiz, 'src/js/caja/saldos.js'), 'utf8').replace(/^export /gm, '');
const piezas = [funcion('function _cierreDescuadreSinMetodo('), funcion('function _trasladoEnCierreCerrado('), funcion('function _getCierresFilterRange('),
  funcion('async function renderLibroCierres(')].join('\n');

const rutaCrudo = path.join(raiz, 'herramientas/baseline-dinero/crudo-ultimo.json');
if (!fs.existsSync(rutaCrudo)) { console.log('ℹ️ sin foto real del dinero en este computador: se omite esta prueba (genera una con herramientas/baseline-dinero.mjs)'); process.exit(0); }
const crudo = JSON.parse(fs.readFileSync(rutaCrudo, 'utf8'));

const pagina = `<!doctype html><meta charset="utf-8"><body>
<input id="cierresDateFrom"><input id="cierresDateTo">
<table><thead id="libroCierresHead"></thead><tbody id="libroCierresList"></tbody><tfoot id="libroCierresFoot"></tfoot></table><div id="cierresKpiGrid"></div>
<script>
let _cierresCajaState = [], _gastosExternosState = [], _trasladosState = [], _ajustesSaldoState = [], _metodos = [], cajaAperturaAt = 0;
const getPaymentMethods = () => _metodos;
const getCategoriasGastos = () => [];
const findPaymentMethodOrOtro = (k) => ({ label: k, icon: '' });
const formatMoney = (v) => '$ ' + Number(v || 0).toLocaleString('es-CO');
const escapeHtml = (s) => String(s);
const showNotice = () => {};
const OTRO_PAYMENT_METHOD = { id: 'otro', label: 'Otro', icon: '🧾' };
const loadCierresCaja = async () => _cierresCajaState;
const _computeHistoricoSumMethod = () => ({});
window.erroresConsola = []; console.error = (...a) => { window.erroresConsola.push(a.join(' ')); };
(function () {
${saldos}
})();
${ayudantes}
${piezas}
window.pintar = async (d, desde, hasta) => {
  _cierresCajaState = d.cierres; _gastosExternosState = d.gastos.filter((g) => g.tipo === 'externo'); _trasladosState = d.gastos.filter((g) => g.tipo === 'traslado'); _ajustesSaldoState = d.gastos.filter((g) => g.tipo === 'ajuste'); _metodos = d.metodos;
  document.getElementById('cierresDateFrom').value = desde || ''; document.getElementById('cierresDateTo').value = hasta || '';
  await renderLibroCierres();
  const t = (id) => document.getElementById(id).innerText.replace(/[ \\t]+/g, ' ').replace(/\\n+/g, '\\n').trim();
  return { kpi: t('cierresKpiGrid'), foot: t('libroCierresFoot'), cuerpo: t('libroCierresList') };
};
</script>`;
const archivo = path.join(raiz, '__hc_harness.html');
fs.writeFileSync(archivo, pagina);

const res = []; const ok = (c, m) => res.push(`${c ? '✅' : '❌'} ${m}`);
const navegador = await chromium.launch();
try {
  const p = await navegador.newPage();
  const errores = []; p.on('pageerror', (e) => errores.push(e.message));
  await p.goto('file:///' + archivo.replace(/\\/g, '/'));
  const datos = { cierres: crudo.cierres, gastos: crudo.gastos, metodos: crudo.metodos || [] };
  const todo = await p.evaluate((d) => window.pintar(d), datos);
  const k = todo.kpi.replace(/\s+/g, ' ').toLowerCase(); // (las etiquetas salen en mayúsculas por estilo)
  ok(/total neto[^$]*\$ 1\.602\.025/.test(k), 'HISTORIAL REAL: Total Neto $ 1.602.025');
  ok(/efectivo \$ 878\.700/.test(k), 'HISTORIAL REAL: Efectivo $ 878.700');
  ok(/bancolombia\/breve \$ 723\.325/.test(k), 'HISTORIAL REAL: Bancolombia/Breve $ 723.325');
  ok(/nequi \$0/.test(k) && /otro \$0/.test(k), 'HISTORIAL REAL: Nequi $0 y Otro $0');
  ok(/ingresos \$ 76\.832\.900/.test(k) && /egresos −\$ 77\.235\.120/.test(k), 'HISTORIAL REAL: Ingresos $ 76.832.900 y Egresos −$ 77.235.120');
  ok(k.indexOf('total neto') < k.indexOf('ingresos') && k.indexOf('ingresos') < k.indexOf('efectivo'), 'el Total Neto va primero, luego Ingresos y los métodos');
  ok(todo.foot.replace(/\s+/g, ' ').includes('$ 1.602.025'), 'el pie TOTALES muestra el mismo Total Neto');
  ok((await p.evaluate(() => window.erroresConsola)).length === 0, 'el candado en vivo no avisó diferencias');
  // Con un rango de fechas el Total Neto es solo el de ese rango (y el de todo sigue siendo el mismo)
  const ago = await p.evaluate((d) => window.pintar(d, '2026-08-01', '2026-08-31'), datos);
  ok(/total neto/i.test(ago.kpi) && ago.cuerpo.length > 0 && ago.kpi !== todo.kpi, 'con un rango de fechas el Historial muestra solo esos días');
  const otra = await p.evaluate((d) => window.pintar(d), datos);
  ok(otra.kpi === todo.kpi && otra.foot === todo.foot && otra.cuerpo === todo.cuerpo, 'volver a pintar todo da exactamente lo mismo (sin arrastrar el filtro)');
  if (process.env.DUMP) fs.writeFileSync(process.env.DUMP, JSON.stringify({ todo, ago }, null, 1));
  ok(errores.length === 0, 'sin errores de JavaScript' + (errores.length ? ': ' + errores.join(' | ') : ''));
} finally {
  await navegador.close();
  fs.unlinkSync(archivo);
}
console.log(res.join('\n'));
if (res.some((r) => r.startsWith('❌'))) process.exit(1);
