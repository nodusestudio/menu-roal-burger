// Dibuja la lista de campañas de «Fuera del Menú» con la función REAL (renderCuponPanaCampanas) y datos de muestra.
//   node herramientas/captura-fuera-menu.mjs <carpeta> [ancho=1280]
import fs from 'node:fs'; import http from 'node:http'; import path from 'node:path'; import { fileURLToPath } from 'node:url'; import { chromium } from 'playwright';
const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = process.argv[2] || path.join(raiz, 'herramientas', 'capturas-config'); fs.mkdirSync(out, { recursive: true });
const ancho = +(process.argv[3] || 1280);
const js = fs.readFileSync(path.join(raiz, 'src/js/admin.js'), 'utf8');
const funcion = (nombre) => { const ini = js.indexOf('function ' + nombre + '('); if (ini < 0) throw new Error('no está ' + nombre); const m = /\r?\n}\r?\n/.exec(js.slice(ini)); return js.slice(ini, ini + m.index + m[0].length); };
const codigo = ['_cpanaDiasTexto', '_cpanaDateKey', '_cpanaFmtFecha', 'renderCuponPanaCampanas'].map(funcion).join('\n');
const pagina = fs.readFileSync(path.join(raiz, 'admin.html'), 'utf8').replace(/<script[\s\S]*?<\/script>/g, '').replace('</body>', `<script>
document.body.classList.remove('admin-loading','admin-locked'); document.body.classList.add('admin-unlocked');
const escapeHtml = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const formatMoney = (v) => '$ ' + Number(v || 0).toLocaleString('es-CO');
const CUPON_PANA_PUBLIC_BASE_URL = 'https://roalburger.com/cupon?k=';
const _cpanaCampanas = [
  { id: 'SEMANA41', titulo: 'La Burda', precio: 22000, temporada: 'T01 · La Burda', palabraClave: 'BURDA', fechaInicio: '2026-11-02', fechaFin: '2026-11-08', cuposEmitidos: 38, cuposTotales: 60, activa: true, requiereActivacionWA: true },
  { id: 'SEMANA40', titulo: 'Sabe a Quindío', precio: 19000, temporada: 'T01 · La Burda', palabraClave: 'QUINDIO', fechaInicio: '2026-10-26', fechaFin: '2026-11-01', cuposEmitidos: 60, cuposTotales: 60, activa: false, requiereActivacionWA: false, agotadaAt: 1793000000000 },
  { id: 'SEMANA42', titulo: 'Nueva sin completar', precio: 18000, cuposEmitidos: 0, cuposTotales: 40, activa: true, requiereActivacionWA: false }];
${codigo}
renderCuponPanaCampanas();
const host = document.getElementById('cpanaCampanasList'); const w = document.createElement('div'); w.id = '__fm'; w.style.cssText = 'padding:14px;background:#0b0f1d;max-width:1100px'; const card = document.createElement('article'); card.className = 'admin-card'; card.appendChild(host); w.appendChild(card); document.body.appendChild(w);
document.querySelectorAll('body > *:not(#__fm):not(script)').forEach((e) => { e.style.display = 'none'; });
</script></body>`);
const archivo = path.join(raiz, '__fm.html'); fs.writeFileSync(archivo, pagina);
const srv = http.createServer((req, res) => { const f = path.join(raiz, decodeURIComponent(req.url.split('?')[0])); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': f.endsWith('.css') ? 'text/css' : 'text/html' }); fs.createReadStream(f).pipe(res); }).listen(0);
const nav = await chromium.launch();
try {
  const p = await nav.newPage({ viewport: { width: ancho, height: 900 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('http://localhost:' + srv.address().port + '/__fm.html');
  const m = await p.evaluate(() => [...document.querySelectorAll('#__fm .cpana-camp')].map((c) => Math.round(c.getBoundingClientRect().height)));
  console.log('errores:', errs.join(' | ') || 'ninguno', '| alto de cada campaña:', m.join(', '), 'px');
  await p.locator('#__fm').screenshot({ path: path.join(out, 'fuera-menu.png') });
} finally { await nav.close(); srv.close(); fs.unlinkSync(archivo); }
