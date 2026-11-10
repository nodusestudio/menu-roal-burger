// Prueba en navegador real (Playwright) del menú principal nuevo: usa el HTML y los estilos REALES de admin.html y el bloque
// nav2 REAL de src/js/admin.js, sin Firebase. Uso:  node tests/admin-nav2.e2e.mjs   (sale con código 1 si algo falla)
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';

import os from 'node:os';
import { fileURLToPath } from 'node:url';
const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = os.tmpdir(); // las capturas de la prueba van a la carpeta temporal
const js = fs.readFileSync(path.join(raiz, 'src/js/admin.js'), 'utf8');
let html = fs.readFileSync(path.join(raiz, 'admin.html'), 'utf8');

const bloque = js.slice(js.indexOf('// SYNC:nav2:inicio'), js.indexOf('// SYNC:nav2:fin'));
html = html.replace(/<script[\s\S]*?<\/script>/g, '');
const stub = `
<script>
let activeAccordionSection = 'pedidos';
${bloque}
// Imita activateAccordion (mismo contrato) y las pestañas internas de Informes
const viejos = [...document.querySelectorAll('#adminAccordionNav > .admin-accordion-trigger[data-accordion-target]')];
function activar(target) {
  activeAccordionSection = target;
  viejos.forEach((b) => b.classList.toggle('active', b.dataset.accordionTarget === target));
  document.querySelectorAll('.admin-tab-panel').forEach((p) => p.classList.toggle('active', p.dataset.tabPanel === target));
  window.__llamadas = (window.__llamadas || []).concat([target]);
  _nav2Sync();
}
viejos.forEach((b) => b.addEventListener('click', () => activar(b.dataset.accordionTarget)));
document.querySelectorAll('[data-section-tab][data-section-scope="informes"]').forEach((t) => t.addEventListener('click', () => {
  document.querySelectorAll('[data-section-tab][data-section-scope="informes"]').forEach((x) => x.classList.toggle('active', x === t));
  document.querySelectorAll('[data-section-panel][data-section-scope="informes"]').forEach((p) => { const on = p.dataset.sectionPanel === t.dataset.sectionTab; p.hidden = !on; p.style.display = on ? '' : 'none'; p.classList.toggle('active', on); });
}));
document.body.classList.remove('admin-loading','admin-locked'); document.body.classList.add('admin-unlocked');
setupNav2();
activar('pedidos');
</script>`;
html = html.replace('</body>', stub + '</body>');
fs.writeFileSync(path.join(raiz, '__harness_nav2.html'), html);

const srv = http.createServer((req, res) => {
  const f = path.join(raiz, decodeURIComponent(req.url.split('?')[0]));
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  const ext = path.extname(f);
  res.writeHead(200, { 'Content-Type': { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.webp': 'image/webp' }[ext] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}).listen(0);
const port = srv.address().port;

const navegador = await chromium.launch();
const resultados = [];
const ok = (c, m) => { resultados.push(`${c ? '✅' : '❌'} ${m}`); };
try {
  const pag = await navegador.newPage({ viewport: { width: 1280, height: 900 } });
  const errores = [];
  pag.on('pageerror', (e) => errores.push(e.message));
  await pag.goto(`http://localhost:${port}/__harness_nav2.html`);
  await pag.waitForSelector('#nav2Host button');

  ok(await pag.locator('#nav2Host > .nav2-grupo').count() === 8, '8 grupos visibles en el menú');
  ok(await pag.locator('#adminAccordionNav > .admin-accordion-trigger[data-accordion-target="pedidos"]').isHidden(), 'el botón viejo de POS está oculto');
  await pag.waitForTimeout(450); await pag.screenshot({ path: `${out}/nav2-1-pos.png` });

  await pag.locator('[data-nav2-grupo="caja"]').click();
  ok(await pag.evaluate(() => activeAccordionSection) === 'informes', 'Caja lleva a Informes (panel de siempre)');
  ok(await pag.locator('.nav2-sub[data-nav2-item="caja.hoy"]').evaluate((e) => e.classList.contains('active')), '«Caja de hoy» queda resaltado');
  ok(await pag.locator('[data-nav2-lista="caja"]').isVisible(), 'el grupo Caja muestra sus 5 elementos');
  await pag.waitForTimeout(450); await pag.screenshot({ path: `${out}/nav2-2-caja.png` });

  await pag.locator('.nav2-sub[data-nav2-item="caja.cierres"]').click();
  ok(await pag.evaluate(() => { const p = document.querySelector('[data-section-panel="historial"][data-section-scope="informes"]'); return !p.hidden && getComputedStyle(p).display !== 'none' && p.closest('.admin-tab-panel').classList.contains('active'); }), '«Cierres» abre el Historial de Cajas');
  ok(await pag.evaluate(() => { const p = document.querySelector('[data-section-panel="caja-diaria"][data-section-scope="informes"]'); return p.hidden || getComputedStyle(p).display === 'none'; }), 'y oculta Caja Diaria');
  ok(await pag.locator('nav[aria-label="Secciones de Informes"]').isHidden(), 'las pestañas internas de Informes quedan ocultas (están en el menú)');

  await pag.locator('.nav2-sub[data-nav2-item="caja.pagos"]').click();
  ok(await pag.evaluate(() => activeAccordionSection) === 'banco', '«Pagos digitales» abre el panel de Bancolombia');

  await pag.locator('[data-nav2-grupo="informes"]').click();
  ok(await pag.evaluate(() => activeAccordionSection) === 'informes', 'Informes → Ventas abre los tickets (panel informes)');
  ok(await pag.evaluate(() => { const p = document.querySelector('[data-section-panel="tickets"][data-section-scope="informes"]'); return !p.hidden && getComputedStyle(p).display !== 'none'; }), '…con la pestaña Tickets');

  // otro código pulsa un botón viejo (como FODI) y el menú lo refleja
  await pag.evaluate(() => document.querySelector('.admin-accordion-trigger[data-accordion-target="costos"]').click());
  ok(await pag.locator('.nav2-sub[data-nav2-item="catalogo.costos"]').evaluate((e) => e.classList.contains('active')), 'si FODI abre Costos, el menú resalta «Costos y recetas»');
  // otro código pulsa una pestaña interna de Informes
  await pag.evaluate(() => { document.querySelector('.admin-accordion-trigger[data-accordion-target="informes"]').click(); document.querySelector('[data-section-tab="libro-contable"][data-section-scope="informes"]').click(); });
  await pag.waitForTimeout(50);
  ok(await pag.locator('.nav2-sub[data-nav2-item="caja.movimientos"]').evaluate((e) => e.classList.contains('active')), 'si el código abre Libro Contable, resalta «Movimientos»');

  // insignias: el botón viejo de Mensajes marca 3 sin leer
  await pag.evaluate(() => { const b = document.querySelector('.admin-accordion-trigger[data-accordion-target="mensajes"]'); b.classList.add('has-unread'); b.dataset.unreadCount = '3'; });
  await pag.waitForTimeout(80);
  ok(await pag.locator('[data-nav2-item="comunicacion.mensajes"]').getAttribute('data-unread-count') === '3', 'la insignia de Mensajes (3) aparece en el menú nuevo');
  ok(await pag.locator('[data-nav2-grupo="comunicacion"]').getAttribute('data-unread-count') === '3', '…y suma en el grupo Comunicación');
  await pag.locator('[data-nav2-grupo="comunicacion"]').click();
  await pag.waitForTimeout(450); await pag.screenshot({ path: `${out}/nav2-3-insignia.png` });

  // interruptor al menú anterior
  await pag.locator('#adminMenuSwitchBtn').click();
  ok(await pag.locator('#adminAccordionNav > .admin-accordion-trigger[data-accordion-target="pedidos"]').isVisible(), 'el interruptor devuelve el menú anterior');
  ok(await pag.locator('#nav2Host').isHidden(), '…y oculta el nuevo');
  await pag.waitForTimeout(450); await pag.screenshot({ path: `${out}/nav2-4-clasico.png` });
  await pag.locator('#adminMenuSwitchBtn').click();

  // celular
  const cel = await navegador.newPage({ viewport: { width: 390, height: 844 } });
  await cel.goto(`http://localhost:${port}/__harness_nav2.html`);
  await cel.waitForSelector('#nav2Host button', { state: 'attached' });
  await cel.evaluate(() => document.querySelector('.admin-sidebar').classList.add('nav-open'));
  await cel.locator('[data-nav2-grupo="caja"]').click({ timeout: 5000 }).catch(() => {});
  await cel.waitForTimeout(450); await cel.screenshot({ path: `${out}/nav2-5-celular.png` });
  errores.length && resultados.push('⚠️ errores de página: ' + errores.join(' | '));
  ok(errores.length === 0, 'sin errores de JavaScript');
} finally {
  await navegador.close(); srv.close();
  fs.unlinkSync(path.join(raiz, '__harness_nav2.html'));
}
console.log(resultados.join('\n'));
