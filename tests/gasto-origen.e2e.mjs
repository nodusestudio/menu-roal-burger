// Prueba en navegador real (Playwright) del panel «¿De dónde sale la plata?» del formulario de gasto, con el código REAL de admin.js
// y los números del caso real (hoy: efectivo $19.000 y Bancolombia $0; saldo anterior: efectivo $878.700, Bancolombia $723.325).
//   node tests/gasto-origen.e2e.mjs     (sale con código 1 si algo falla)
import fs from 'node:fs';
import os from 'node:os';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const js = fs.readFileSync(path.join(raiz, 'src/js/admin.js'), 'utf8');
const corte = (ini, fin) => { const a = js.indexOf(ini); const b = js.indexOf(fin, a + ini.length); if (a < 0 || b < 0) throw new Error('No se encontró ' + ini); return js.slice(a, b); };
const funcion = (inicio) => {
  const a = js.indexOf(inicio); if (a < 0) throw new Error('No se encontró ' + inicio);
  const m = /\r?\n(?:async )?function |\r?\n\/\/ ──|\r?\nlet |\r?\nconst /.exec(js.slice(a + inicio.length));
  return js.slice(a, a + inicio.length + (m ? m.index : 0));
};
const codigo = [corte('// SYNC:origen-gasto:inicio', 'function renderGastoMethodButtons() {'), funcion('function renderGastoMethodButtons() {'), funcion('function _gastoMontoTotal('), funcion('function _gastoSplitPartes(')].join('\n');

const pagina = fs.readFileSync(path.join(raiz, 'admin.html'), 'utf8').replace(/<script[\s\S]*?<\/script>/g, '').replace('</body>', `<script>
document.body.classList.remove('admin-loading','admin-locked'); document.body.classList.add('admin-unlocked');
const OTRO_PAYMENT_METHOD = { id: 'otro', label: 'Otro', icon: '🧾' };
const _metodos = [{ id: 'efectivo', label: 'Efectivo', icon: '💵' }, { id: 'bancolombia', label: 'Bancolombia/Breve', icon: '🏦' }, { id: 'nequi', label: 'Nequi', icon: '💜' }];
const getEnabledPaymentMethods = () => _metodos;
const findPaymentMethodOrOtro = (k) => [..._metodos, OTRO_PAYMENT_METHOD].find((m) => m.id === k);
const formatMoney = (v) => '$ ' + Number(v || 0).toLocaleString('es-CO');
const escapeHtml = (s) => String(s);
let cajaAperturaAt = 1700000000000;
let _gastoSelectedMethod = null, _gastoSplitOn = false, _gastoSplitAmounts = {};
let _cajaDiariaSumMethod = { efectivo: 19000, bancolombia: 0, nequi: 0, otro: 0 };
let _historicoSumMethod = { efectivo: 878700, bancolombia: 723325, nequi: 0, otro: 0 };
${codigo}
window.api = { caja: (v) => { cajaAperturaAt = v; }, render: () => renderGastoMethodButtons(), elegir: (m, monto) => { _gastoSelectedMethod = m; document.getElementById('gastoMonto').value = monto; _gastoActualizarOrigen(); }, origen: () => gastoOrigen };
</script></body>`);
const archivo = path.join(raiz, '__go_harness.html');
fs.writeFileSync(archivo, pagina);
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
  const p = await navegador.newPage({ viewport: { width: 900, height: 820 } });
  const errores = []; p.on('pageerror', (e) => errores.push(e.message));
  await p.goto(`http://localhost:${port}/__go_harness.html`);
  await p.evaluate(() => { document.getElementById('gastoModal').removeAttribute('hidden'); document.getElementById('gastoStep1').hidden = true; document.getElementById('gastoStep2').hidden = false; window.api.render(); });
  const texto = () => p.locator('#gastoOrigenInfo').innerText();
  const clase = () => p.locator('#gastoOrigenInfo').getAttribute('class');

  ok(await p.locator('#gastoOrigenInfo').isHidden(), 'sin método ni monto, el panel no se muestra');
  const botones = await p.locator('#gastoMethodsGrid .dpm-method-btn').allInnerTexts();
  ok(botones.some((t) => /bancolombia/i.test(t) && /disp\. \$ 723\.325/i.test(t)), 'cada método muestra lo disponible (Bancolombia: Disp. $ 723.325)');
  ok(botones.some((t) => /efectivo/i.test(t) && /disp\. \$ 897\.700/i.test(t)), '…y el efectivo suma hoy + días anteriores (Disp. $ 897.700)');

  // El caso de la captura
  await p.evaluate(() => window.api.elegir('bancolombia', '10.209'));
  ok(/Hoy no ha entrado plata por/.test(await texto()) && /saldo de días anteriores \(\$ 723\.325\)/.test(await texto()), 'CASO REAL: Bancolombia, hoy $0 → «Hoy no ha entrado plata… sale del saldo de días anteriores ($ 723.325)»');
  ok(/gasto-origen--info/.test(await clase()), '…en tono informativo (azul), no de error');
  await p.screenshot({ path: path.join(os.tmpdir(), 'go-1-saldo-anterior.png') });

  await p.evaluate(() => window.api.elegir('efectivo', '10.000'));
  ok(/Sale de lo que entró hoy/.test(await texto()) && /gasto-origen--ok/.test(await clase()), 'efectivo $10.000 (hoy hay $19.000) → «Sale de lo que entró hoy» (verde)');
  await p.evaluate(() => window.api.elegir('efectivo', '30.000'));
  ok(/solo hay \$ 19\.000/.test(await texto()) && /\$ 11\.000 del saldo de días anteriores/.test(await texto()), 'efectivo $30.000 → parte de hoy ($19.000) y $11.000 del saldo anterior');
  await p.evaluate(() => window.api.elegir('nequi', '5.000'));
  ok(/No alcanza/.test(await texto()) && /−\$ 5\.000/.test(await texto()) && /gasto-origen--warn/.test(await clase()), 'Nequi $5.000 (no hay nada) → «No alcanza… quedaría en −$ 5.000» (ámbar)');
  await p.screenshot({ path: path.join(os.tmpdir(), 'go-2-no-alcanza.png') });
  await p.evaluate(() => window.api.elegir('bancolombia', ''));
  ok(await p.locator('#gastoOrigenInfo').isHidden(), 'sin monto el panel se oculta');
  await p.evaluate(() => window.api.render());
  ok(await p.locator('#gastoMethodsGrid .dpm-method-btn--active').count() === 1, 'al refrescar los saldos se conserva el método elegido');

  // Efectivo = cajón del turno (solo con la caja abierta) · cuentas = en cualquier momento
  const titulos = await p.locator('#gastoMethodsGrid .gasto-fuente-titulo').allInnerTexts();
  ok(titulos.length === 2 && /del cajón/i.test(titulos[0]) && /desde una cuenta/i.test(titulos[1]), 'los métodos van en dos grupos: «Del cajón (efectivo)» y «Desde una cuenta»');
  ok(await p.locator('#gastoMethodsGrid [data-gasto-method="efectivo"]').isEnabled() && await p.locator('#gastoFuenteNota').isHidden(), 'con la caja abierta el efectivo está disponible y no hay aviso');
  await p.evaluate(() => { window.api.caja(0); window.api.elegir('efectivo', '10.000'); window.api.render(); });
  ok(await p.locator('#gastoMethodsGrid [data-gasto-method="efectivo"]').isDisabled(), 'con la caja CERRADA el efectivo se bloquea');
  ok(await p.locator('#gastoMethodsGrid [data-gasto-method="bancolombia"]').isEnabled() && await p.locator('#gastoMethodsGrid [data-gasto-method="nequi"]').isEnabled(), '…pero Bancolombia y Nequi siguen disponibles (no dependen del cajón)');
  ok(/la caja está cerrada/i.test(await p.locator('#gastoFuenteNota').innerText()) && await p.locator('#gastoFuenteNota [data-gasto-recordar]').count() === 1, 'se explica por qué y se ofrece «Dejar recordatorio» para el efectivo');
  ok((await p.locator('#gastoMethodsGrid .dpm-method-btn--active').count()) === 0, 'un efectivo que estaba elegido se des-selecciona al cerrarse la caja');
  await p.screenshot({ path: path.join(os.tmpdir(), 'go-3-caja-cerrada.png') });
  await p.evaluate(() => { window.api.elegir('bancolombia', '10.209'); });
  ok(/saldo de días anteriores/.test(await texto()), 'con la caja cerrada se puede registrar desde Bancolombia y dice de dónde sale');
  await p.evaluate(() => window.api.caja(1700000000000));
  ok(errores.length === 0, 'sin errores de JavaScript' + (errores.length ? ': ' + errores.join(' | ') : ''));
} finally {
  await navegador.close(); srv.close();
  fs.unlinkSync(archivo);
}
console.log(res.join('\n'));
if (res.some((r) => r.startsWith('❌'))) process.exit(1);
