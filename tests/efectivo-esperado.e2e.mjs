// Navegador real: panel «Efectivo que debe haber en el cajón» y ventana de conteo al cerrar.
//   node tests/efectivo-esperado.e2e.mjs
import fs from 'node:fs';
import os from 'node:os';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const js = fs.readFileSync(path.join(raiz, 'src/js/admin.js'), 'utf8');
const corte = (ini, fin) => { const a = js.indexOf(ini); const b = js.indexOf(fin, a + ini.length); if (a < 0 || b < 0) throw new Error('No se encontró ' + ini); return js.slice(a, b); };
const funcion = (inicio) => { const a = js.indexOf(inicio); if (a < 0) throw new Error('No se encontró ' + inicio); const m = /\r?\n(?:async )?function |\r?\n\/\/ |\r?\ndocument\./.exec(js.slice(a + inicio.length)); return js.slice(a, a + inicio.length + (m ? m.index : 0)); };
const codigo = [corte('// SYNC:efectivo-esperado:inicio', '// SYNC:efectivo-esperado:fin'), corte('// SYNC:conteo-cierre:inicio', '// SYNC:conteo-cierre:fin'), funcion('function _renderEfectivoEsperado('), funcion('function _pedirConteoEfectivo(')].join('\n');
const pagina = fs.readFileSync(path.join(raiz, 'admin.html'), 'utf8').replace(/<script[\s\S]*?<\/script>/g, '').replace('</body>', `<script>
document.body.classList.remove('admin-loading','admin-locked'); document.body.classList.add('admin-unlocked');
const formatMoney = (v) => '$ ' + Number(v || 0).toLocaleString('es-CO');
const escapeHtml = (s) => String(s);
let cajaAperturaAt = 1700000000000, _cajaFondoInicial = 100000;
${codigo}
window.api = { caja: (v) => { cajaAperturaAt = v; }, panel: (s) => _renderEfectivoEsperado(s), pedir: (e) => { window.__r = 'pendiente'; _pedirConteoEfectivo(e).then((v) => { window.__r = v; }); } };
</script></body>`);
const archivo = path.join(raiz, '__ee_harness.html'); fs.writeFileSync(archivo, pagina);
const srv = http.createServer((req, res) => { const f = path.join(raiz, decodeURIComponent(req.url.split('?')[0])); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': f.endsWith('.css') ? 'text/css' : 'text/html' }); fs.createReadStream(f).pipe(res); }).listen(0);
const res = []; const ok = (c, m) => res.push(`${c ? '✅' : '❌'} ${m}`);
const nav = await chromium.launch();
try {
  const p = await nav.newPage({ viewport: { width: 900, height: 700 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(`http://localhost:${srv.address().port}/__ee_harness.html`);
  await p.evaluate(() => { document.getElementById('card-caja-diaria').closest('.menu-inner-panel')?.classList.add('active'); window.api.panel({ efectivo: 50000, bancolombia: 30000 }); });
  const t = await p.locator('#cajaEfectivoEsperado').innerText();
  ok(/\$ 150\.000/.test(t) && /Fondo \$ 100\.000/.test(t) && /\$ 50\.000/.test(t) && /\$ 30\.000.*no está en el cajón/.test(t), 'panel: esperado $150.000 = fondo $100.000 + efectivo $50.000; lo digital ($30.000) aparte');
  await p.evaluate(() => window.api.caja(0)); await p.evaluate(() => window.api.panel({}));
  ok(await p.locator('#cajaEfectivoEsperado').isHidden(), 'con la caja cerrada el panel se oculta');
  await p.evaluate(() => window.api.pedir(150000));
  ok(/\$ 150\.000/.test(await p.locator('#_conteoEfectivoOverlay .vd-text').innerText()), 'la ventana de conteo dice cuánto debe haber');
  await p.fill('#_ceMonto', '148000');
  ok(/Faltan \$ 2\.000/.test(await p.locator('#_ceDif').innerText()), '148.000 contados → «Faltan $ 2.000»');
  await p.fill('#_ceMonto', '151500');
  ok(/Sobran \$ 1\.500/.test(await p.locator('#_ceDif').innerText()), '151.500 → «Sobran $ 1.500»');
  await p.screenshot({ path: path.join(os.tmpdir(), 'ee-1-conteo.png') });
  await p.click('[data-ce-ok]');
  ok(await p.evaluate(() => window.__r) === 151500 && await p.locator('#_conteoEfectivoOverlay').count() === 0, 'registrar devuelve el monto contado y cierra la ventana');
  await p.evaluate(() => window.api.pedir(1000)); await p.click('[data-ce-skip]');
  ok(await p.evaluate(() => window.__r) === null, '«Cerrar sin contar» devuelve null (se puede omitir)');
  ok(errs.length === 0, 'sin errores de JavaScript' + (errs.length ? ': ' + errs.join(' | ') : ''));
} finally { await nav.close(); srv.close(); fs.unlinkSync(archivo); }
console.log(res.join('\n')); if (res.some((r) => r.startsWith('❌'))) process.exit(1);
