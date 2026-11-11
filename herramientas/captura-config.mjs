// Capturas de las pestañas de Configuración con el admin.html REAL (sin sesión): node herramientas/captura-config.mjs [carpeta]
import fs from 'node:fs'; import http from 'node:http'; import path from 'node:path'; import { fileURLToPath } from 'node:url'; import { chromium } from 'playwright';
const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = process.argv[2] || path.join(raiz, 'herramientas', 'capturas-config'); fs.mkdirSync(out, { recursive: true });
const pagina = fs.readFileSync(path.join(raiz, 'admin.html'), 'utf8').replace(/<script[\s\S]*?<\/script>/g, '').replace('</body>', `<script>
document.body.classList.remove('admin-loading','admin-locked'); document.body.classList.add('admin-unlocked');
window.mostrar = (id) => { document.querySelectorAll('.menu-inner-panel').forEach((p) => { const on = p.dataset.sectionPanel === id && p.dataset.sectionScope === 'configuracion'; p.hidden = !on; p.style.display = on ? '' : 'none'; p.classList.toggle('active', on); });
  document.querySelectorAll('[data-section-tab][data-section-scope="configuracion"]').forEach((t) => t.classList.toggle('active', t.dataset.sectionTab === id));
  document.querySelectorAll('main > section, .admin-section, [data-panel]').forEach((s) => {}); };
</script></body>`);
const archivo = path.join(raiz, '__cap.html'); fs.writeFileSync(archivo, pagina);
const srv = http.createServer((req, res) => { const f = path.join(raiz, decodeURIComponent(req.url.split('?')[0])); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': f.endsWith('.css') ? 'text/css' : f.endsWith('.js') ? 'text/javascript' : 'text/html' }); fs.createReadStream(f).pipe(res); }).listen(0);
const nav = await chromium.launch();
try {
  const p = await nav.newPage({ viewport: { width: +(process.argv[3] || 1440), height: 900 } });
  await p.goto(`http://localhost:${srv.address().port}/__cap.html`);
  const ids = await p.evaluate(() => [...document.querySelectorAll('[data-section-tab][data-section-scope="configuracion"]')].map((t) => t.dataset.sectionTab));
  // asegurar que el contenedor de Configuración sea visible
  await p.evaluate(() => { const el = document.querySelector('[data-section-panel="negocio"][data-section-scope="configuracion"]'); let n = el; while (n && n !== document.body) { n.hidden = false; if (getComputedStyle(n).display === 'none') n.style.display = 'block'; n = n.parentElement; } });
  // aislar Configuración: ocultar todo lo que no esté en la cadena de ancestros
  await p.evaluate(() => { const el = document.querySelector('[data-section-panel="negocio"][data-section-scope="configuracion"]'); let n = el; while (n && n !== document.body) { [...n.parentElement.children].forEach((h) => { if (h !== n && !h.matches('script,style,link')) { if (h.matches('aside,nav,header') || h.id === 'adminSidebar') return; h.style.display = 'none'; } }); n = n.parentElement; } });
  // datos de muestra como los que dibuja el admin real (filas de Menú público; tarjetas retraídas)
  await p.evaluate(() => {
    const filas = [['📱', 'VER NUESTRO MENU DIGITAL', 'btn-menu | Menu modal | neon | xl'], ['📲', 'PIDE TU DOMICILIO AQUI', 'btn-whatsapp-main | Enlace | solid | lg'], ['🎵', 'SABOR REAL EN TIKTOK', 'btn-tiktok | Enlace | glass | md']];
    const L = document.getElementById('buttonConfigList');
    if (L) L.innerHTML = filas.map(([i, t, m]) => '<div class="list-item"><div class="product-main"><span>' + i + ' ' + t + '</span></div><div class="muted">' + m + '</div><span class="state-pill visible">Activo</span><button class="mini-btn">Editar</button><button class="mini-btn">Pausar</button><button class="mini-btn remove">Ocultar</button><button class="mini-btn remove">Eliminar</button></div>').join('');
    document.querySelectorAll('[data-section-panel="horario"] .card-body, [data-section-panel="barrios_especiales"] .card-body').forEach((b) => b.classList.add('collapsed'));
    document.querySelectorAll('[data-section-panel="horario"] .card-collapse-btn, [data-section-panel="barrios_especiales"] .card-collapse-btn').forEach((b) => { b.textContent = 'Desplegar'; });
  });
  for (const id of ids) {
    await p.evaluate((i) => window.mostrar(i), id);
    const h = await p.evaluate(() => document.documentElement.scrollHeight);
    await p.screenshot({ path: path.join(out, `config-${id}.png`), fullPage: true });
    const panel = p.locator(`[data-section-panel="${id}"][data-section-scope="configuracion"]`);
    await panel.screenshot({ path: path.join(out, `panel-${id}.png`) });
    console.log(id, h);
  }
} finally { await nav.close(); srv.close(); fs.unlinkSync(archivo); }
