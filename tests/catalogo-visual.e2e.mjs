// Navegador real: cabecera de categoría, opciones y variantes del formulario de producto (Artículos).
//   node tests/catalogo-visual.e2e.mjs [carpeta] [ancho]
import fs from 'node:fs'; import http from 'node:http'; import path from 'node:path'; import { fileURLToPath } from 'node:url'; import { chromium } from 'playwright';
const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = process.argv[2] || path.join(raiz, '_qa-shots'); fs.mkdirSync(out, { recursive: true });
const ancho = +(process.argv[3] || 1280);
const js = fs.readFileSync(path.join(raiz, 'src/js/admin.js'), 'utf8').replace(/\r\n/g, '\n');
const a = js.indexOf('function _cpefRenderVariantesList()');
const ini = js.indexOf('function _renderCategoryDetailPanel(');
const fin = js.indexOf('\n}\n', ini) + 3;
const codigo = js.slice(a, fin);
const stubs = `
const escapeHtml = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const formatMoney = (v) => '$ ' + Math.round(Number(v || 0)).toLocaleString('es-CO');
const categoryDetailPanel = document.getElementById('categoryDetailPanel');
let _editingProductId = 'p1'; let _cpefVariantes = [{ nombre: 'x5 unidades', precio: 11000 }, { nombre: 'x10 unidades', precio: 20000, con_bebida: false }];
const bebidasState = []; const acompanantesState = [];
const firebaseDb = { batch: () => ({ update() {}, commit: async () => {} }), collection: () => ({ doc: () => ({}) }) };
const categoriesState = [{ id: 'c1', name: 'ENTRADAS', active: true, parentCategory: 'Otros', combos_pos: false, combos_menu: false }];
const productsState = [1,2,3,4,5,6,7,8].map((i) => ({ id: 'p' + i, nombre: i === 1 ? 'Tequeños' : 'Producto ' + i, categoria: 'ENTRADAS', precio: 11000, estado: i === 6 ? 'paused' : 'active', visible_pos: true, order: i, image_url: '', descripcion: 'El clásico venezolano: queso envuelto en masa doradita.', bebida_incluida: {}, promo2x1: {} }));
const _almPintarOpcionesEnFicha = () => {}; const attachRowSearch = () => {}; const _saveCategoryFromDetail = () => {};
const openProductCreateModal = () => {}; const showConfirmModal = async () => true; const showNotice = () => {}; const _saveProductInline = () => {};
const reloadDataAndRender = async () => {}; const _cpefInit = () => {}; const _cpefRenderBebidaConfig = () => {}; const _cpef2x1Render = () => {}; const _cpefRender2x1Config = () => {};
`;
const pagina = fs.readFileSync(path.join(raiz, 'admin.html'), 'utf8').replace(/<script[\s\S]*?<\/script>/g, '');
const archivo = path.join(raiz, '__cat.html'); fs.writeFileSync(archivo, pagina);
const srv = http.createServer((req, res) => { const f = path.join(raiz, decodeURIComponent(req.url.split('?')[0])); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': { '.css': 'text/css', '.html': 'text/html', '.webp': 'image/webp', '.png': 'image/png' }[path.extname(f)] || 'text/plain' }); fs.createReadStream(f).pipe(res); }).listen(0);
await new Promise((r) => srv.on('listening', r));
const nav = await chromium.launch(); let fallos = 0;
const ok = (c, m) => { console.log((c ? '✅ ' : '❌ ') + m); if (!c) fallos++; };
try {
    const p = await nav.newPage({ viewport: { width: ancho, height: 1100 } });
    const errs = []; p.on('pageerror', (e) => errs.push(e.message));
    await p.goto('http://localhost:' + srv.address().port + '/__cat.html');
    await p.evaluate(() => { document.body.classList.remove('admin-loading', 'admin-locked'); document.body.classList.add('admin-unlocked'); document.querySelectorAll('.admin-tab-panel').forEach((x) => x.classList.toggle('active', x.dataset.tabPanel === 'menu')); });
    await p.addScriptTag({ content: stubs + codigo + '\n_renderCategoryDetailPanel("c1"); _cpefRenderVariantesList();' });
    await p.waitForTimeout(300);
    const m = await p.evaluate(() => {
        const r = (s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) }; };
        return { nombre: r('#catDetailName'), parent: r('#catDetailParent'), add: r('#catDetailAddProductBtn'), vis: r('.cat-vis-panel'), opts: r('.cpef-opts'), form: r('#cpefForm'), bebida: r('#cpefBebidaActiva'), x2: r('#cpef2x1Activo') };
    });
    ok(m.nombre && m.parent && Math.abs(m.nombre.y - m.parent.y) < 8, 'nombre y categoría principal quedan en la MISMA fila: ' + JSON.stringify([m.nombre, m.parent]));
    ok(m.add && m.add.y < m.nombre.y + 40, '"+ Producto" queda en esa fila');
    ok(m.vis && m.vis.h < 80, 'el panel "Activar aquí" es una sola línea (' + (m.vis && m.vis.h) + ' px; antes ~170)');
    ok(m.bebida && m.x2 && Math.abs(m.bebida.y - m.x2.y) < 10, 'Incluye bebida y Activar 2×1 van en la misma fila');
    await p.screenshot({ path: path.join(out, 'catalogo-detalle.png'), fullPage: true });
    ok(errs.length === 0, 'sin errores de JavaScript ' + errs.join('|'));
} finally { await nav.close(); srv.close(); fs.unlinkSync(archivo); }
process.exit(fallos ? 1 : 0);
