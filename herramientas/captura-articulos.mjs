// Dibuja Artículos (lista de categorías y detalle con productos) con las funciones REALES del admin y datos de muestra.
//   node herramientas/captura-articulos.mjs <carpeta> [ancho=1280]
import fs from 'node:fs'; import http from 'node:http'; import path from 'node:path'; import { fileURLToPath } from 'node:url'; import { chromium } from 'playwright';
const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = process.argv[2] || path.join(raiz, 'herramientas', 'capturas-config'); fs.mkdirSync(out, { recursive: true });
const ancho = +(process.argv[3] || 1280);
const js = fs.readFileSync(path.join(raiz, 'src/js/admin.js'), 'utf8');
const funcion = (nombre) => { const ini = js.indexOf(`function ${nombre}(`); if (ini < 0) throw new Error('no está ' + nombre); const m = /\r?\n}\r?\n/.exec(js.slice(ini)); return js.slice(ini, ini + m.index + m[0].length); };
const codigo = ['createCategoryMasterItem', '_renderCategoryDetailPanel'].map(funcion).join('\n');
const pagina = fs.readFileSync(path.join(raiz, 'admin.html'), 'utf8').replace(/<script[\s\S]*?<\/script>/g, '').replace('</body>', `<script>
document.body.classList.remove('admin-loading','admin-locked'); document.body.classList.add('admin-unlocked');
const escapeHtml = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const formatMoney = (v) => '$ ' + Number(v || 0).toLocaleString('es-CO');
const categoriesState = ['BURGER CLASICAS', 'BURGER PREMIUM', 'PERROS CALIENTES', 'SALCHIPAPAS', 'BEBIDAS'].map((n, i) => ({ id: 'c' + i, name: n, active: i !== 4, order: i, parentCategory: i < 2 ? 'Burger' : '' }));
const productsState = Array.from({ length: 14 }, (_, i) => ({ id: 'p' + i, nombre: ['Clásica', 'Doble carne', 'Bacon', 'Pollo crispy', 'Veggie', 'La Casa', 'Papuda'][i % 7] + ' ' + (i + 1), categoria: 'BURGER CLASICAS', precio: 18000 + i * 1500, descripcion: 'Pan brioche, carne 150 g, queso cheddar, lechuga, tomate y salsa de la casa', order: i, activo: true, imagen_url: '' }));
let _selectedCategoryId = 'c0'; let _catGastosPanelBound = false;
const categoryDetailPanel = document.createElement('div'); categoryDetailPanel.id = 'categoryDetailPanel';
const showNotice = () => {}, showConfirmModal = async () => true, firebaseDb = { batch: () => ({ update() {}, commit: async () => {} }), collection: () => ({ doc: () => ({}) }) };
var _editingProductId, reloadDataAndRender, renderCategories, openCategoryProductsModal, openProductEditModal, openCategoryCreateModal, openProductCreateModal, firestoreNow, _carouselRefresh;
${codigo}
const lista = document.createElement('div'); lista.id = 'categoryList'; lista.className = 'upgrades-master-list';
categoriesState.forEach((c) => lista.appendChild(createCategoryMasterItem(c)));
const wrap = document.createElement('div'); wrap.className = 'upgrades-layout'; wrap.id = '__articulos'; wrap.style.cssText = 'display:grid;grid-template-columns:280px 1fr;gap:12px;padding:14px;background:#0b0f1d';
wrap.appendChild(lista); wrap.appendChild(categoryDetailPanel); document.body.appendChild(wrap);
try { _renderCategoryDetailPanel('c0'); } catch (e) { window.__err = e.message; }
</script></body>`);
const archivo = path.join(raiz, '__art.html'); fs.writeFileSync(archivo, pagina);
const srv = http.createServer((req, res) => { const f = path.join(raiz, decodeURIComponent(req.url.split('?')[0])); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': f.endsWith('.css') ? 'text/css' : 'text/html' }); fs.createReadStream(f).pipe(res); }).listen(0);
const nav = await chromium.launch();
try {
  const p = await nav.newPage({ viewport: { width: ancho, height: 900 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(`http://localhost:${srv.address().port}/__art.html`);
  console.log('errores de página:', errs.join(' | ') || 'ninguno', '| render:', await p.evaluate(() => window.__err || 'ok'));
  await p.evaluate(() => { document.querySelectorAll('body > *:not(#__articulos):not(script)').forEach((e) => { e.style.display = 'none'; }); });
  await p.locator('#__articulos').screenshot({ path: path.join(out, 'articulos.png') });
} finally { await nav.close(); srv.close(); fs.unlinkSync(archivo); }
