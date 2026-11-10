// Prueba en navegador real (Playwright) de los botones de Caja: HTML y estilos REALES de admin.html + el bloque act-menu REAL
// de src/js/admin.js. Comprueba los roles de botón (sin estilos pegados a mano en las acciones críticas), que los menús
// «Exportar» y «Mover dinero» abren/cierran bien y que los botones conservan sus ids (los manejadores siguen funcionando).
//   node tests/caja-botones.e2e.mjs      (sale con código 1 si algo falla)
import fs from 'node:fs';
import os from 'node:os';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const js = fs.readFileSync(path.join(raiz, 'src/js/admin.js'), 'utf8');
const a = js.indexOf('// SYNC:act-menu:inicio'); const b = js.indexOf('// SYNC:act-menu:fin');
if (a < 0 || b < 0) throw new Error('No se encontró el bloque act-menu');
let html = fs.readFileSync(path.join(raiz, 'admin.html'), 'utf8').replace(/<script[\s\S]*?<\/script>/g, '');
const stub = `<script>
document.body.classList.remove('admin-loading','admin-locked'); document.body.classList.add('admin-unlocked');
document.querySelectorAll('.admin-tab-panel').forEach((p) => p.classList.toggle('active', p.dataset.tabPanel === 'informes'));
window.clics = [];
['exportCierresExcelBtn','exportCierresPdfBtn','trasladoHistorialBtn','ajusteSaldosBtn','gastosBtn','cerrarCajaBtn'].forEach((id) => document.getElementById(id)?.addEventListener('click', () => window.clics.push(id)));
window.verSeccion = (s) => document.querySelectorAll('[data-section-panel][data-section-scope="informes"]').forEach((p) => { const on = p.dataset.sectionPanel === s; p.hidden = !on; p.style.display = on ? '' : 'none'; p.classList.toggle('active', on); });
${js.slice(a, b)}
</script>`;
const archivoHtml = path.join(raiz, '__caja_botones.html');
fs.writeFileSync(archivoHtml, html.replace('</body>', stub + '</body>'));
const srv = http.createServer((req, res) => {
  const f = path.join(raiz, decodeURIComponent(req.url.split('?')[0]));
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  const ext = path.extname(f);
  res.writeHead(200, { 'Content-Type': { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.webp': 'image/webp' }[ext] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}).listen(0);
const port = srv.address().port;

const res = []; const ok = (c, m) => res.push(`${c ? '✅' : '❌'} ${m}`);
const navegador = await chromium.launch();
try {
  const p = await navegador.newPage({ viewport: { width: 1360, height: 900 } });
  const errores = []; p.on('pageerror', (e) => errores.push(e.message));
  await p.goto(`http://localhost:${port}/__caja_botones.html`);

  // Caja de hoy
  await p.evaluate(() => window.verSeccion('caja-diaria'));
  const rol = async (id) => p.evaluate((i) => { const e = document.getElementById(i); return { cls: e.className, inline: e.getAttribute('style') || '', txt: e.textContent.trim() }; }, id);
  const gasto = await rol('gastosBtn'); const cerrar = await rol('cerrarCajaBtn');
  ok(/--primary/.test(gasto.cls) && gasto.txt.includes('Registrar gasto'), 'Caja de hoy: «Registrar gasto» es la acción principal (rol primary)');
  ok(/--danger-solid/.test(cerrar.cls) && cerrar.inline === '' && cerrar.txt.includes('Cerrar caja'), 'Caja de hoy: «Cerrar caja» usa el rol de acción delicada, sin estilos pegados a mano');
  const conf = await rol('cierreCajaConfirmBtn');
  ok(/--danger-solid/.test(conf.cls) && conf.inline === '', 'el «Cerrar caja» del panel de vista previa usa el mismo rol');
  await p.waitForTimeout(300);
  await p.screenshot({ path: path.join(os.tmpdir(), 'caja-1-hoy.png') });

  // Cierres: menos botones sueltos
  await p.evaluate(() => window.verSeccion('historial'));
  const visibles = await p.evaluate(() => [...document.querySelectorAll('[data-section-panel="historial"] .card-head > button, [data-section-panel="historial"] .card-head > details > summary')].filter((e) => e.offsetParent).map((e) => e.textContent.trim()));
  ok(visibles.length === 3 && visibles[0].includes('Actualizar') && visibles[1].includes('Exportar') && visibles[2].includes('Mover dinero'), `Cierres: la barra tiene 3 controles en vez de 5 botones sueltos (${visibles.join(' · ')})`);
  ok(await p.locator('#exportCierresExcelBtn').isHidden(), 'Excel y PDF están dentro del menú Exportar (cerrado)');
  await p.click('#exportMenu > summary');
  ok(await p.locator('#exportCierresExcelBtn').isVisible() && await p.locator('#exportCierresPdfBtn').isVisible(), 'al abrir «Exportar» aparecen Excel y PDF');
  await p.click('#exportCierresExcelBtn');
  ok(await p.evaluate(() => window.clics.includes('exportCierresExcelBtn')), 'elegir Excel dispara su manejador (el id se conservó)');
  ok(await p.evaluate(() => !document.getElementById('exportMenu').open), '…y el menú se cierra solo');
  await p.click('#moverMenu > summary');
  await p.waitForTimeout(200);
  await p.screenshot({ path: path.join(os.tmpdir(), 'caja-2-cierres-menu.png') });
  ok(await p.locator('#trasladoHistorialBtn').isVisible() && await p.locator('#ajusteSaldosBtn').isVisible(), '«Mover dinero» muestra Traslado y Ajustar saldos');
  await p.click('#trasladoHistorialBtn');
  ok(await p.evaluate(() => window.clics.includes('trasladoHistorialBtn') && !document.getElementById('moverMenu').open), 'Traslado funciona y cierra el menú');
  await p.click('#moverMenu > summary');
  await p.mouse.click(40, 600); // fuera
  ok(await p.evaluate(() => !document.getElementById('moverMenu').open), 'tocar fuera cierra el menú');
  await p.click('#exportMenu > summary'); await p.click('#moverMenu > summary');
  ok(await p.evaluate(() => document.getElementById('exportMenu').open === false && document.getElementById('moverMenu').open), 'abrir un menú cierra el otro');

  // Gastos
  await p.evaluate(() => window.verSeccion('gastos'));
  const gi = await rol('gastosInformesNewBtn');
  ok(/--primary/.test(gi.cls) && gi.txt.includes('Registrar gasto'), 'Gastos: el botón también se llama «Registrar gasto» y usa el rol principal (un nombre por acción)');

  // Estructura
  ok(!/id="gastosHistorialBtn"/.test(html), 'ya no hay un segundo botón «Gastos» en Cierres');
  ok(errores.length === 0, 'sin errores de JavaScript' + (errores.length ? ': ' + errores.join(' | ') : ''));
} finally {
  await navegador.close(); srv.close();
  fs.unlinkSync(archivoHtml);
}
console.log(res.join('\n'));
if (res.some((r) => r.startsWith('❌'))) process.exit(1);
