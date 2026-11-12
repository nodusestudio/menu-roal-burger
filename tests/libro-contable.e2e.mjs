// Prueba en navegador real (Playwright) del Libro Contable: usa el código REAL de _renderLcTable (src/js/admin.js).
// Garantiza que el Total Neto del Libro Contable es el MISMO que el del Historial de Cajas y que los Ajustes de saldo
// se ven en su propia línea (antes el Libro Contable los ignoraba y daba otro total para el mismo dinero).
//   node tests/libro-contable.e2e.mjs     (sale con código 1 si algo falla)
// Con la foto real del dinero (herramientas/baseline-dinero/crudo-ultimo.json) también comprueba las cifras de la pantalla.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const js = fs.readFileSync(path.join(raiz, 'src/js/admin.js'), 'utf8');
const corte = (desde, hasta) => {
  const a = js.indexOf(desde); const b = js.indexOf(hasta, a);
  if (a < 0 || b < 0) throw new Error(`No se encontró el bloque ${desde}`);
  return js.slice(a, b);
};
const ayudantes = corte('function _tsMs(value) {', '// ── HORA DE COLOMBIA') + corte('// SYNC:dias-bogota:inicio', '// SYNC:dias-bogota:fin')
  + corte('function _cierreDiaMs(c) {', '// Un pedido anulado puede venir');
const saldos = fs.readFileSync(path.join(raiz, 'src/js/caja/saldos.js'), 'utf8').replace(/^export /gm, '');
const render = corte('function _renderLcTable() {', '// Toggle detalle por día en libro contable');

const pagina = `<!doctype html><meta charset="utf-8"><body>
<table><thead id="lcHead"></thead><tbody id="lcBody"></tbody><tfoot id="lcFoot"></tfoot></table>
<script>
let _cierresCajaState = [], _gastosExternosState = [], _trasladosState = [], _ajustesSaldoState = [];
let _metodos = [];
const getPaymentMethods = () => _metodos;
const getCategoriasGastos = () => [];
const findPaymentMethodOrOtro = (k) => ({ label: k, icon: '' });
const formatMoney = (v) => '$ ' + Number(v || 0).toLocaleString('es-CO');
const escapeHtml = (s) => String(s);
(function () {
${saldos}
})();
window.erroresConsola = []; const _ce = console.error; console.error = (...a) => { window.erroresConsola.push(a.join(' ')); };
${ayudantes}
${render}
window.pintar = (d) => { _cierresCajaState = d.cierres; _gastosExternosState = d.gastos.filter((g) => g.tipo === 'externo'); _trasladosState = d.gastos.filter((g) => g.tipo === 'traslado'); _ajustesSaldoState = d.gastos.filter((g) => g.tipo === 'ajuste'); _metodos = d.metodos; _renderLcTable(); return { foot: document.getElementById('lcFoot').innerText, filas: document.querySelectorAll('#lcBody > tr:not(.lc-det-row)').length }; };
</script>`;
const archivo = path.join(raiz, '__lc_harness.html');
fs.writeFileSync(archivo, pagina);

const res = [];
const ok = (c, m) => res.push(`${c ? '✅' : '❌'} ${m}`);
const navegador = await chromium.launch();
try {
  const p = await navegador.newPage();
  const errores = []; p.on('pageerror', (e) => errores.push(e.message));
  await p.goto('file:///' + archivo.replace(/\\/g, '/'));

  // ── Caso sintético (reglas una por una) ──
  const base = Date.parse('2026-11-09T20:00:00Z');
  const cierre = { id: 'c1', aperturaAt: base - 6 * 3600000, closedAt: base, ingresosTotal: 1000, gastosTotal: 100, grandTotal: 900, methodTotals: { efectivo: 900 } };
  const externo = { id: 'g1', tipo: 'externo', paymentMethod: 'efectivo', monto: 50, registradoAt: base + 3600000 };
  const ajuste = { id: 'a1', tipo: 'ajuste', porMetodo: { efectivo: 30, nequi: 20 }, registradoAt: base + 7200000 };
  const metodos = [{ id: 'efectivo', label: 'Efectivo' }, { id: 'nequi', label: 'Nequi' }];
  let r = await p.evaluate((d) => window.pintar(d), { cierres: [cierre], gastos: [externo], metodos });
  ok(r.foot.includes('$ 850') && !r.foot.includes('AJUSTES'), 'sin ajustes: Total = ingresos − egresos (850) y no hay línea de ajustes');
  r = await p.evaluate((d) => window.pintar(d), { cierres: [cierre], gastos: [externo, ajuste], metodos });
  ok(r.foot.includes('AJUSTES DE SALDO') && r.foot.includes('+$ 50'), 'con un ajuste de +50: aparece la línea «Ajustes de saldo» (+$ 50)');
  ok(r.foot.includes('$ 900'), '…y el Total Neto = 850 + 50 = 900 (igual que el Historial)');
  ok(r.foot.includes('$ 1.000') && r.foot.includes('−$ 150'), '…sin tocar Ingresos (1.000) ni Egresos (−150): el ajuste no es ingreso ni egreso');

  // ── Dinero real ──

// Valores esperados: se leen de la ÚLTIMA foto independiente del dinero (herramientas/baseline-dinero.mjs), no de números fijos (el negocio sigue vendiendo).
const dirFotos = path.join(raiz, 'herramientas/baseline-dinero');
const ultimaFoto = fs.readdirSync(dirFotos).filter((f) => /^dinero-.*\.json$/.test(f)).sort().pop();
const T = JSON.parse(fs.readFileSync(path.join(dirFotos, ultimaFoto), 'utf8')).totales;
const fmtMonto = (n) => (n < 0 ? '−' : '') + '$ ' + Math.abs(Math.round(n)).toLocaleString('es-CO');
const montoDe = (texto, etiqueta) => { const m = new RegExp(etiqueta + ' *(−?)[$] ?([0-9.]+)', 'i').exec(texto); return m ? (m[1] ? -1 : 1) * Number(m[2].split('.').join('')) : NaN; };
  const ruta = path.join(raiz, 'herramientas/baseline-dinero/crudo-ultimo.json');
  if (fs.existsSync(ruta)) {
    const crudo = JSON.parse(fs.readFileSync(ruta, 'utf8'));
    const real = await p.evaluate((d) => window.pintar(d), { cierres: crudo.cierres, gastos: crudo.gastos, metodos: crudo.metodos || [] });
    const compacto = real.foot.replace(/\s+/g, ' ');
    ok(compacto.includes(fmtMonto(T.saldo_total_estilo_Historial)), 'DINERO REAL: Total Neto del Libro Contable = ' + fmtMonto(T.saldo_total_estilo_Historial) + ' (el mismo del Historial)');
    ok(compacto.includes('+' + fmtMonto(T.ajustes_total)), 'DINERO REAL: línea «Ajustes de saldo» = +' + fmtMonto(T.ajustes_total));
    const _montos = [...compacto.slice(compacto.indexOf('TOTAL HIST')).matchAll(/(−?)[$] ?([0-9.]+)/g)].map((m) => (m[1] ? -1 : 1) * Number(m[2].split('.').join('')));
    const _i = _montos[0], _e = _montos[1], _t = _montos[2];
    ok(_montos.length >= 3 && Math.round(_i + _e + T.ajustes_total) === T.saldo_total_estilo_Historial && _t === T.saldo_total_estilo_Historial, 'DINERO REAL: Ingresos ' + fmtMonto(_i) + ' + Egresos ' + fmtMonto(_e) + ' + Ajustes ' + fmtMonto(T.ajustes_total) + ' = Total Neto ' + fmtMonto(_t));
  } else {
    res.push('ℹ️ sin foto real en este computador: se omiten las comprobaciones con dinero real');
  }

  const mal = await p.evaluate(() => window.erroresConsola);
  ok(mal.length === 0, 'el candado en vivo no avisó diferencias con el módulo puro' + (mal.length ? ': ' + mal.join(' | ') : ''));
  ok(errores.length === 0, 'sin errores de JavaScript' + (errores.length ? ': ' + errores.join(' | ') : ''));
} finally {
  await navegador.close();
  fs.unlinkSync(archivo);
}
console.log(res.join('\n'));
if (res.some((r) => r.startsWith('❌'))) process.exit(1);
