// Navegador real: Seguridad (contraseña y PIN) como resumen + «Cambiar», y Menú público con la lista primero y el formulario tras «Agregar».
//   node tests/seguridad-menu.e2e.mjs
import fs from 'node:fs'; import os from 'node:os'; import http from 'node:http'; import path from 'node:path'; import { fileURLToPath } from 'node:url'; import { chromium } from 'playwright';
const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const js = fs.readFileSync(path.join(raiz, 'src/js/admin.js'), 'utf8');
const a = js.indexOf('// SYNC:sec-cambiar:inicio'), b = js.indexOf('// SYNC:sec-cambiar:fin'); if (a < 0 || b < a) throw new Error('sin bloque');
const pagina = fs.readFileSync(path.join(raiz, 'admin.html'), 'utf8').replace(/<script[\s\S]*?<\/script>/g, '').replace('</body>', `<script>
document.body.classList.remove('admin-loading','admin-locked'); document.body.classList.add('admin-unlocked');
window.mostrar = (id) => { document.querySelectorAll('.menu-inner-panel').forEach((p) => { const on = p.dataset.sectionPanel === id && p.dataset.sectionScope === 'configuracion'; p.hidden = !on; p.style.display = on ? '' : 'none'; });
  const el = document.querySelector('[data-section-panel="' + id + '"][data-section-scope="configuracion"]'); let n = el; while (n && n !== document.body) { n.hidden = false; if (getComputedStyle(n).display === 'none') n.style.display = 'block'; n = n.parentElement; } };
${js.slice(a, b)}
window.pass = initSecCambiar('password'); window.pin = initSecCambiar('pin');
</script></body>`);
const archivo = path.join(raiz, '__sm.html'); fs.writeFileSync(archivo, pagina);
const srv = http.createServer((req, res) => { const f = path.join(raiz, decodeURIComponent(req.url.split('?')[0])); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': f.endsWith('.css') ? 'text/css' : 'text/html' }); fs.createReadStream(f).pipe(res); }).listen(0);
const res = []; const ok = (c, m) => res.push(`${c ? '✅' : '❌'} ${m}`);
const nav = await chromium.launch();
try {
  const p = await nav.newPage({ viewport: { width: 1200, height: 800 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(`http://localhost:${srv.address().port}/__sm.html`);
  await p.evaluate(() => window.mostrar('seguridad'));
  ok(await p.locator('[data-sec="password"]').isVisible() && await p.locator('[data-sec-editor="password"]').isHidden() && await p.locator('#bizCurrentPassword').isHidden(), 'Seguridad: la contraseña se ve como resumen («••••••••») y los campos están ocultos');
  ok(await p.locator('[data-sec="pin"]').isVisible() && await p.locator('#supervisorPinInput').isHidden(), 'el PIN también: resumen y campo oculto');
  await p.locator('.biz-section--security').first().screenshot({ path: path.join(os.tmpdir(), 'sm-1-resumen.png') });
  await p.click('[data-sec-abrir="password"]');
  ok(await p.locator('#bizCurrentPassword').isVisible() && await p.locator('#bizChangePasswordBtn').isVisible() && await p.locator('[data-sec="password"]').isHidden(), '«Cambiar contraseña» muestra los campos con «Actualizar contraseña» y «Cancelar»');
  await p.fill('#bizNewPassword', 'abc123');
  await p.click('[data-sec-cancelar="password"]');
  ok(await p.locator('#bizNewPassword').isHidden() && await p.inputValue('#bizNewPassword') === '' && await p.locator('[data-sec="password"]').isVisible(), 'Cancelar esconde los campos y borra lo escrito (la contraseña no queda en pantalla)');
  await p.click('[data-sec-abrir="pin"]'); await p.fill('#supervisorPinInput', '1234'); await p.keyboard.press('Escape');
  ok(await p.locator('#supervisorPinInput').isHidden() && await p.inputValue('#supervisorPinInput') === '', 'Esc cancela el cambio de PIN');
  await p.evaluate(() => window.mostrar('botones'));
  ok(await p.locator('#buttonFormWrap').isHidden() && await p.locator('#buttonAddBtn').isVisible(), 'Menú público: la lista va primero y el formulario está oculto; solo hay «+ Agregar botón»');
  ok(await p.evaluate(() => document.getElementById('buttonConfigList').compareDocumentPosition(document.getElementById('buttonFormWrap')) & Node.DOCUMENT_POSITION_FOLLOWING) > 0, 'la lista de botones queda ARRIBA del formulario');
  ok(errs.length === 0, 'sin errores de JavaScript' + (errs.length ? ': ' + errs.join(' | ') : ''));
} finally { await nav.close(); srv.close(); fs.unlinkSync(archivo); }
console.log(res.join('\n')); if (res.some((r) => r.startsWith('❌'))) process.exit(1);
