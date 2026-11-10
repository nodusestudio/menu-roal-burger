// Navegador real: formularios de Configuración en modo lectura (bloqueado) → Editar → Guardar/Cancelar → vuelve a bloqueado.
//   node tests/form-bloqueado.e2e.mjs
import fs from 'node:fs'; import os from 'node:os'; import http from 'node:http'; import path from 'node:path'; import { fileURLToPath } from 'node:url'; import { chromium } from 'playwright';
const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const js = fs.readFileSync(path.join(raiz, 'src/js/admin.js'), 'utf8');
const a = js.indexOf('// SYNC:form-bloqueado:inicio'), b = js.indexOf('// SYNC:form-bloqueado:fin'); if (a < 0 || b < a) throw new Error('sin bloque');
const pagina = fs.readFileSync(path.join(raiz, 'admin.html'), 'utf8').replace(/<script[\s\S]*?<\/script>/g, '').replace('</body>', `<script>
document.body.classList.remove('admin-loading','admin-locked'); document.body.classList.add('admin-unlocked');
const p = document.querySelector('[data-section-panel="negocio"][data-section-scope="configuracion"]'); let n = p; while (n && n !== document.body) { n.hidden = false; n.style.display = ''; if (getComputedStyle(n).display === 'none') n.style.display = 'block'; n = n.parentElement; }
const guardado = { restaurantName: 'ROAL BURGER', restaurantSlogan: 'Comida rapida con acento venezolano', restaurantWhatsappNumber: '573144689509', restaurantAddress: 'Cl. 22 #29-59, Armenia', restaurantInstagramLink: 'https://www.instagram.com/roalburger' };
const brandingForm = document.getElementById('brandingForm');
function render() { Object.keys(guardado).forEach((k) => { brandingForm.elements[k].value = guardado[k]; }); }
render();
window.cancelados = 0; window.guardados = 0;
${js.slice(a, b)}
window.lock = initFormBloqueado(brandingForm, { onCancel: () => { window.cancelados++; render(); } });
brandingForm.addEventListener('submit', (e) => { e.preventDefault(); guardado.restaurantName = brandingForm.elements.restaurantName.value; window.guardados++; render(); window.lock.lock(); });
</script></body>`);
const archivo = path.join(raiz, '__fb.html'); fs.writeFileSync(archivo, pagina);
const srv = http.createServer((req, res) => { const f = path.join(raiz, decodeURIComponent(req.url.split('?')[0])); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': f.endsWith('.css') ? 'text/css' : 'text/html' }); fs.createReadStream(f).pipe(res); }).listen(0);
const res = []; const ok = (c, m) => res.push(`${c ? '✅' : '❌'} ${m}`);
const nav = await chromium.launch();
try {
  const p = await nav.newPage({ viewport: { width: 1200, height: 800 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(`http://localhost:${srv.address().port}/__fb.html`);
  const nom = p.locator('#restaurantName'); const estado = () => p.locator('.lock-estado').innerText();
  ok(await nom.isDisabled() && await p.locator('#restaurantSlogan').isDisabled(), 'al abrir, la información está BLOQUEADA (campos de solo lectura)');
  ok(/Guardado/.test(await estado()) && await p.locator('[data-lock="editar"]').isVisible() && await p.locator('[data-lock="guardar"]').isHidden(), 'se ve «🔒 Guardado» con el botón «Editar» (sin Guardar ni Cancelar)');
  ok(await nom.inputValue() === 'ROAL BURGER' && await p.locator('#restaurantTiktokLink').getAttribute('placeholder') === 'Sin definir', 'los valores se muestran y lo vacío dice «Sin definir» (no el ejemplo del campo)');
  await p.locator('#brandingForm').screenshot({ path: path.join(os.tmpdir(), 'fb-1-bloqueado.png') });
  await p.click('[data-lock="editar"]');
  ok(await nom.isEnabled() && /Editando/.test(await estado()) && await p.locator('[data-lock="cancelar"]').isVisible() && await p.locator('[data-lock="editar"]').isHidden(), 'Editar → los campos se habilitan y aparecen Cancelar y Guardar cambios');
  ok(await p.locator('[data-lock="guardar"]').isDisabled(), '«Guardar cambios» está deshabilitado hasta que haya un cambio');
  ok(await p.locator('#restaurantTiktokLink').getAttribute('placeholder') === 'https://tiktok.com/@...', 'en edición vuelve el texto de ejemplo');
  await p.fill('#restaurantName', 'ROAL BURGER 2');
  ok(await p.locator('[data-lock="guardar"]').isEnabled(), 'al cambiar algo se habilita «Guardar cambios»');
  await p.locator('#brandingForm').screenshot({ path: path.join(os.tmpdir(), 'fb-2-editando.png') });
  await p.click('[data-lock="cancelar"]');
  ok(await nom.inputValue() === 'ROAL BURGER' && await nom.isDisabled() && await p.evaluate(() => window.cancelados) === 1, 'Cancelar descarta el cambio y vuelve a bloqueado con el valor guardado');
  await p.click('[data-lock="editar"]'); await p.fill('#restaurantName', 'ROAL BURGER 3'); await p.keyboard.press('Escape');
  ok(await nom.isDisabled() && await nom.inputValue() === 'ROAL BURGER', 'Esc también cancela');
  await p.click('[data-lock="editar"]'); await p.fill('#restaurantName', 'ROAL BURGER 4'); await p.click('[data-lock="guardar"]');
  ok(await p.evaluate(() => window.guardados) === 1 && await nom.isDisabled() && await nom.inputValue() === 'ROAL BURGER 4' && /Guardado/.test(await estado()), 'Guardar cambios guarda y vuelve al modo guardado (bloqueado)');
  ok(errs.length === 0, 'sin errores de JavaScript' + (errs.length ? ': ' + errs.join(' | ') : ''));
} finally { await nav.close(); srv.close(); fs.unlinkSync(archivo); }
console.log(res.join('\n')); if (res.some((r) => r.startsWith('❌'))) process.exit(1);
