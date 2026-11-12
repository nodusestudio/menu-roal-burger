// Navegador real: la lista de clientes es UNA línea por cliente (con la función real renderClients) y la ventana «Unir duplicados» desplaza su contenido, no la página.
//   node tests/clientes-linea.e2e.mjs
import fs from 'node:fs'; import os from 'node:os'; import http from 'node:http'; import path from 'node:path'; import { fileURLToPath } from 'node:url'; import { chromium } from 'playwright';
const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const js = fs.readFileSync(path.join(raiz, 'src/js/admin.js'), 'utf8');
const corte = (ini, fin) => { const a = js.indexOf(ini); const b = js.indexOf(fin, a + ini.length); if (a < 0 || b < 0) throw new Error('No se encontró ' + ini); return js.slice(a, b); };
const SALTO = String.fromCharCode(10);
const filtros = corte('// SYNC:clientes-filtros:inicio', '// SYNC:clientes-filtros:fin') + SALTO + corte('function getFilteredClients() {', 'function formatExportDate') + SALTO + corte('function _renderClientsFiltros() {', 'function renderClients() {');
const codigo = filtros + SALTO + corte('function renderClients() {', '\n// Menú «⋯» de cada cliente') + '\n' + corte('// Menú «⋯» de cada cliente', 'function _renderClientsPagination');
const pagina = fs.readFileSync(path.join(raiz, 'admin.html'), 'utf8').replace(/<script[\s\S]*?<\/script>/g, '').replace('</body>', `<script>
document.body.classList.remove('admin-loading','admin-locked'); document.body.classList.add('admin-unlocked');
const p = document.querySelector('[data-tab-panel="clientes"]'); let n = p; while (n && n !== document.body) { n.hidden = false; if (getComputedStyle(n).display === 'none') n.style.display = 'block'; n = n.parentElement; }
const escapeHtml = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const formatMoney = (v) => '$ ' + Number(v || 0).toLocaleString('es-CO'); const formatOrderDate = (v) => v ? '10/11/2026' : '—';
const clientsList = document.getElementById('clientsList'), clientsCount = document.getElementById('clientsCount');
let _clientsPage = 0; const CLIENTS_PAGE_SIZE = 50; const expandedClientAddressIds = new Set();
const _renderClientsPagination = () => {};
const mk = (i) => ({ id: 'phone_30' + i, customerName: i % 3 ? 'Faberlandia de los Ríos Montoya ' + i : 'Hebert', customerPhone: '301 18063' + i, whatsappUser: i % 4 ? '' : 'hebert_wa', address: 'Mz 24 casa 12 puerto espejo barrio las americas armenia quindio', savedAddresses: i % 2 ? ['a', 'b', 'c'] : ['a'], firstOrderAt: 1, lastOrderAt: 2, totalOrders: i, totalSpent: 40500 * i, puntosDisponibles: i * 10, puntosAcumuladosTotal: i * 30, lastOrderCode: 'RB-35' + i, lastOrderTotal: 52000 });
let _clientsLoad = { estado: 'ok', error: '' }; window.__n = 12; window.setLoad = (e, m) => { _clientsLoad = { estado: e, error: m || '' }; };
let clientsState = Array.from({ length: 12 }, (_, i) => mk(i + 1)); let clientsSearchTerm = ''; let clientsFiltro = 'todos';
const normalizeCategoryKey = (x) => String(x || '').toLowerCase(); const clientUserMatches = () => false;
window.vaciar = () => { clientsState = []; }; window.setFiltro = (f) => { clientsFiltro = f; };
${codigo}
renderClients();
document.body.insertAdjacentHTML('beforeend', '<div id="ov" class="pos-note-modal-overlay"><div class="pos-note-modal-box cxc-box"><p class="pos-note-modal-title">Unir</p><div class="uc-cuerpo cxc-cuerpo">' + Array.from({ length: 40 }, (_, i) => '<div class="cxc-grupo"><div class="cxc-grupo-t">Grupo ' + i + '</div><label class="cxc-fila">fila</label><label class="cxc-fila">fila</label></div>').join('') + '</div><div class="cxc-pie"><button class="pos-note-cancel-btn">Cerrar</button></div></div></div>');
document.getElementById('ov').style.display = 'none';
</script></body>`);
const archivo = path.join(raiz, '__cl.html'); fs.writeFileSync(archivo, pagina);
const srv = http.createServer((req, res) => { const f = path.join(raiz, decodeURIComponent(req.url.split('?')[0])); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': f.endsWith('.css') ? 'text/css' : 'text/html' }); fs.createReadStream(f).pipe(res); }).listen(0);
const res = []; const ok = (c, m) => res.push(`${c ? '✅' : '❌'} ${m}`);
const nav = await chromium.launch();
try {
  const p = await nav.newPage({ viewport: { width: 1280, height: 800 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(`http://localhost:${srv.address().port}/__cl.html`);
  const filas = await p.evaluate(() => [...document.querySelectorAll('#clientsList tr.client-row')].map((r) => Math.round(r.getBoundingClientRect().height)));
  ok(filas.length === 12 && Math.max(...filas) <= 44, `LISTA DE CLIENTES: cada cliente es UNA línea (alto máximo ${Math.max(...filas)} px; antes ~300 px)`);
  const caben = await p.evaluate(() => { const w = document.querySelector('.clients-table-wrap'); return w.scrollWidth <= w.clientWidth + 1; });
  ok(caben, 'la tabla cabe en el ancho sin desplazarse hacia los lados (ya se ven todas las acciones)');
  const cols = await p.evaluate(() => [...document.querySelectorAll('.clients-table thead th')].map((t) => t.textContent.trim()).filter(Boolean));
  ok(cols.join(',') === 'Cliente,Dirección,Última visita,Pedidos,Gasto total,Puntos,Último pedido', 'columnas: ' + cols.join(', '));
  await p.locator('.clients-table-wrap').screenshot({ path: path.join(os.tmpdir(), 'cl-1-lista.png') });
  await p.click('#clientsList tr.client-row:nth-child(1) details.client-more summary'); await p.waitForTimeout(150);
  const menu = await p.evaluate(() => { const m = document.querySelector('details.client-more[open] .client-more-menu'); const r = m.getBoundingClientRect(); return { estilo: m.getAttribute('style'), rect: [r.left, r.top, r.right, r.bottom, innerWidth, innerHeight].map(Math.round).join(','), visible: r.width > 0 && r.right <= innerWidth && r.bottom <= innerHeight, textos: [...m.querySelectorAll('button')].map((b) => b.textContent.trim()) }; });
  ok(menu.visible && menu.textos.length === 4, 'el menú «⋯» flota completo en pantalla con las 4 acciones: ' + menu.textos.join(' | ') + ' [' + menu.rect + '] ' + menu.estilo);
  await p.screenshot({ path: path.join(os.tmpdir(), 'cl-2-menu.png') });
  await p.mouse.click(5, 5);
  ok(await p.locator('details.client-more[open]').count() === 0, 'tocar fuera cierra el menú');
  await p.evaluate(() => { document.getElementById('ov').style.display = 'flex'; });
  const lock = await p.evaluate(() => ({ cuerpo: getComputedStyle(document.body).overflow, caja: Math.round(document.querySelector('#ov .pos-note-modal-box').getBoundingClientRect().height), lista: document.querySelector('.cxc-cuerpo').scrollHeight > document.querySelector('.cxc-cuerpo').clientHeight }));
  ok(lock.cuerpo === 'hidden', 'con la ventana abierta la página de atrás NO se desplaza (overflow: hidden)');
  ok(lock.caja <= 800 && lock.lista, `la ventana cabe en pantalla (${lock.caja} px) y su lista larga se desplaza por dentro`);
  const antes = await p.evaluate(() => window.scrollY); const cb = await p.locator('.cxc-cuerpo').boundingBox(); await p.mouse.move(cb.x + cb.width / 2, cb.y + cb.height / 2); await p.mouse.wheel(0, 600); await p.waitForTimeout(150);
  const mov = await p.evaluate((a) => ({ lista: document.querySelector('.cxc-cuerpo').scrollTop, pagina: window.scrollY - a }), antes);
  ok(mov.lista > 0 && mov.pagina === 0, `la rueda del ratón mueve la lista de la ventana (${mov.lista} px) y no la página (${mov.pagina} px)`);
  await p.evaluate(() => { document.getElementById('ov').style.display = 'none'; window.scrollTo(0, 0); });
  // Filtros y órdenes más usados (con el código real)
  const chips = await p.evaluate(() => [...document.querySelectorAll('#clientsFiltros [data-clientes-filtro]')].map((b) => b.textContent.replace(/\s+/g, ' ').trim()));
  ok(chips.length === 10 && /Últimos registrados/.test(chips.join('|')) && /Más compras/.test(chips.join('|')), 'FILTROS: 10 opciones (' + chips.join(' · ') + ')');
  await p.evaluate(() => document.querySelector('[data-clientes-filtro=\"mas_compras\"]').click());
  const orden = await p.evaluate(() => [...document.querySelectorAll('#clientsList tr.client-row .cl-num .client-metric-chip')].map((x) => Number(x.textContent)));
  ok(orden.length === 12 && orden[0] === 12 && orden[11] === 1, '«Más compras» ordena de más a menos pedidos (' + orden.join(',') + ')');
  await p.locator('#clientsFiltros').screenshot({ path: path.join(os.tmpdir(), 'cl-3-filtros.png') });
  ok(await p.locator('[data-clientes-filtro="mas_compras"].active').count() === 1, 'el filtro activo se marca en naranja');
  await p.evaluate(() => document.querySelector('[data-clientes-filtro=\"recurrentes\"]').click());
  const rec = await p.evaluate(() => document.querySelectorAll('#clientsList tr.client-row').length);
  ok(rec === 10, '«Recurrentes (3 o más)» deja solo a los de 3+ compras (' + rec + ' de 12)');
  await p.evaluate(() => document.querySelector('[data-clientes-filtro=\"todos\"]').click());
  // Estado de carga visible (antes: un «No hay clientes» mudo cuando la carga fallaba)
  await p.evaluate(() => { window.vaciar(); window.setLoad('cargando'); renderClients(); });
  ok(/Cargando clientes/.test(await p.locator('#clientsList').innerText()), 'mientras carga dice «Cargando clientes…»');
  await p.evaluate(() => { window.setLoad('error', 'resource-exhausted: Quota exceeded'); renderClients(); });
  const msg = await p.locator('#clientsList').innerText();
  ok(/No se pudieron cargar los clientes/.test(msg) && /resource-exhausted/.test(msg) && await p.locator('[data-clients-reintentar]').count() === 1, 'si falla, dice por qué («resource-exhausted…») y ofrece «Reintentar»: ' + msg.replace(/\s+/g, ' ').slice(0, 90));
  await p.evaluate(() => { window.setLoad('ok'); renderClients(); });
  ok(/No hay clientes que coincidan/.test(await p.locator('#clientsList').innerText()), 'con la carga bien y 0 resultados dice «No hay clientes que coincidan»');
  ok(errs.length === 0, 'sin errores de JavaScript' + (errs.length ? ': ' + errs.join(' | ') : ''));
} finally { await nav.close(); srv.close(); fs.unlinkSync(archivo); }
console.log(res.join('\n')); if (res.some((r) => r.startsWith('❌'))) process.exit(1);
