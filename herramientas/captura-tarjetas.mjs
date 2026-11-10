// Captura de tarjetas de TODO el admin (antes/después de una regla de estilo): node herramientas/captura-tarjetas.mjs salida.png [indice-inicial] [cantidad]
import fs from 'node:fs'; import http from 'node:http'; import path from 'node:path'; import { fileURLToPath } from 'node:url'; import { chromium } from 'playwright';
const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const [, , salida = 'tarjetas.png', ini = '0', cant = '8'] = process.argv;
const pagina = fs.readFileSync(path.join(raiz, 'admin.html'), 'utf8').replace(/<script[\s\S]*?<\/script>/g, '').replace('</body>', `<script>document.body.classList.remove('admin-loading','admin-locked'); document.body.classList.add('admin-unlocked');</script></body>`);
const archivo = path.join(raiz, '__tj.html'); fs.writeFileSync(archivo, pagina);
const srv = http.createServer((req, res) => { const f = path.join(raiz, decodeURIComponent(req.url.split('?')[0])); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': f.endsWith('.css') ? 'text/css' : 'text/html' }); fs.createReadStream(f).pipe(res); }).listen(0);
const nav = await chromium.launch();
try {
  const p = await nav.newPage({ viewport: { width: 1100, height: 900 } });
  await p.goto(`http://localhost:${srv.address().port}/__tj.html`);
  const n = await p.evaluate(({ ini, cant }) => {
    const cards = [...document.querySelectorAll('.admin-card')].filter((c) => !c.closest('.vd-card, #fodiFlot'));
    cards.forEach((c, i) => { let a = c; while (a && a !== document.body) { a.hidden = false; if (getComputedStyle(a).display === 'none') a.style.display = 'block'; a = a.parentElement; } });
    const sel = cards.slice(+ini, +ini + +cant);
    const wrap = document.createElement('div'); wrap.style.cssText = 'position:fixed;inset:0;overflow:auto;background:#0b0f1d;padding:12px;z-index:999999'; wrap.id = '__w';
    sel.forEach((c) => { const k = c.cloneNode(true); k.style.marginBottom = '12px'; k.style.display = 'block'; k.querySelectorAll('[hidden]').forEach((x) => { x.hidden = false; }); wrap.appendChild(k); });
    document.body.appendChild(wrap); return cards.length;
  }, { ini, cant });
  await p.locator('#__w').screenshot({ path: salida });
  console.log('tarjetas totales', n);
} finally { await nav.close(); srv.close(); fs.unlinkSync(archivo); }
