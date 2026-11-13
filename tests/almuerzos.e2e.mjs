// Navegador real: pestaña Almuerzos + selector de la caja + descuento/devolución de inventario (Firestore simulado en memoria).
//   node tests/almuerzos.e2e.mjs [carpeta-capturas] [ancho]
import fs from 'node:fs'; import http from 'node:http'; import path from 'node:path'; import { fileURLToPath } from 'node:url'; import { chromium } from 'playwright';
const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = process.argv[2] || path.join(raiz, '_qa-shots'); fs.mkdirSync(out, { recursive: true });
const ancho = +(process.argv[3] || 1280);
const js = fs.readFileSync(path.join(raiz, 'src/js/admin.js'), 'utf8');
const ini = js.indexOf("const ALM_COL = 'almuerzo_componentes';");
if (ini < 0) throw new Error('no está el bloque de almuerzos en admin.js');
const bloque = js.slice(ini);

const stubs = `
const escapeHtml = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const formatMoney = (v) => '$ ' + Math.round(Number(v || 0)).toLocaleString('es-CO');
const avisos = []; const showNotice = (t, k) => avisos.push((k || 'ok') + ': ' + t);
const showConfirmModal = async () => true; const showPromptModal = async () => '500';
const _sqDayKey = (ms) => new Date(ms - 5 * 3600000).toISOString().slice(0, 10);
const _tsMs = (v) => (v && typeof v.toMillis === 'function' ? v.toMillis() : Number(v || 0));
const firestoreNow = () => 'TS';
const normalizeCategoryKey = (v) => String(v || '').toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').trim();
const _cNorm = (t) => String(t || '').normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const _cParse = (v) => { const n = Number(String(v).replace(',', '.')); return Number.isFinite(n) ? n : 0; };
const _cCostoReceta = () => ({ porUnidad: 0 }); const _cCtx = () => ({});
const ORDERS_COLLECTION = 'pedidos', ORDERS_ARCHIVE_COLLECTION = 'pedidos_archivados';
const reloadDataAndRender = async () => {}; const fetchProducts = async () => {};
const renderPosOrderItems = () => {}; const renderPosTotals = () => {}; const renderPosBottomBar = () => {};
let internalOrderItems = [], _meseroSession = null, _editingOrderData = null, _editingItemsOnlyOrderId = null; const ordersState = [];
const PosCart = { addItem(id, nombre, precio, note, orig, opts) { const it = { itemKey: opts.forcedKey, productId: id, productName: nombre, quantity: 1, unitPrice: precio, subtotal: precio, almuerzo: opts.almuerzo, optionLabelOrig: opts.optionLabel }; internalOrderItems.push(it); return it; } };
const _rangoSel = {}; const rangoState = (k) => _rangoSel[k] || (_rangoSel[k] = { preset: 'todo' });
const rangoMs = () => ({ desde: 0, hasta: Infinity }); const rangoLabel = () => 'todo'; const onRango = () => {};
const rangoSelectorHtml = () => '<article class="admin-card rango-host"><div class="rango-bar">Hoy · Ayer</div></article>';
const attachRowSearch = () => {};
function applyInnerTabs(container, key, defs) { container.dataset.tabs = defs.map((d) => d.id).join(','); }
let _costos = { insumos: [], recetas: [], platos: [], promos: [], cfg: { colchonPct: 30, margenObjetivoPct: 30 } };
const _costosCargar = async () => {};
let _productos = [{ id: 'almuerzo-ejecutivo', nombre: 'Almuerzo Ejecutivo', precio: 19000, categoria: 'ALMUERZOS', almuerzoConfigurable: true }];
const _cProdMenu = () => _productos;
let _ordenesMetricas = []; const _loadMetricsOrders = async () => _ordenesMetricas;
// Firestore en memoria
const DB = {};
const col = (n) => (DB[n] = DB[n] || {});
let _auto = 0;
const docRef = (c, id) => ({ id, _c: c,
  async get() { const d = col(c)[id]; return { exists: !!d, id, data: () => (d ? JSON.parse(JSON.stringify(d)) : undefined) }; },
  async set(v, o) { const prev = (o && o.merge) ? (col(c)[id] || {}) : {}; const nuevo = { ...prev, ...v }; Object.keys(nuevo).forEach((k) => { if (nuevo[k] && nuevo[k].__borrar) delete nuevo[k]; }); col(c)[id] = nuevo; },
  async update(v) { const prev = col(c)[id]; if (!prev) throw new Error('not-found'); col(c)[id] = { ...prev, ...v }; },
  async delete() { delete col(c)[id]; } });
const firebaseDb = {
  collection(c) { return { doc: (id) => docRef(c, id || 'auto' + (++_auto)), async get() { return { docs: Object.entries(col(c)).map(([id, d]) => ({ id, data: () => JSON.parse(JSON.stringify(d)) })) }; } }; },
  batch() { const ops = []; return { set: (r, v, o) => ops.push(() => r.set(v, o)), async commit() { for (const f of ops) await f(); } }; },
  async runTransaction(fn) { const writes = []; const tx = { get: (r) => r.get(), update: (r, v) => writes.push(() => r.update(v)), set: (r, v) => writes.push(() => r.set(v)) }; await fn(tx); for (const w of writes) await w(); }
};
const firebase = { firestore: { FieldValue: { delete: () => ({ __borrar: true }) } } };
`;

const pagina = fs.readFileSync(path.join(raiz, 'admin.html'), 'utf8').replace(/<script[\s\S]*?<\/script>/g, '')
    .replace('</body>', `<script type="module" src="/src/js/almuerzos/core.js"></script></body>`);
const archivo = path.join(raiz, '__alm.html'); fs.writeFileSync(archivo, pagina);
const srv = http.createServer((req, res) => { const f = path.join(raiz, decodeURIComponent(req.url.split('?')[0])); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.webp': 'image/webp', '.png': 'image/png' }[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res); }).listen(0);
await new Promise((r) => srv.on('listening', r));
const nav = await chromium.launch();
let fallos = 0;
const ok = (c, m) => { console.log((c ? '✅ ' : '❌ ') + m); if (!c) fallos++; };
try {
    const p = await nav.newPage({ viewport: { width: ancho, height: 1000 } });
    const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
    await p.goto('http://localhost:' + srv.address().port + '/__alm.html');
    await p.waitForFunction(() => window.AlmuerzosCore);
    await p.addScriptTag({ content: stubs + bloque });
    await p.evaluate(() => {
        document.body.classList.remove('admin-loading', 'admin-locked'); document.body.classList.add('admin-unlocked');
        document.querySelectorAll('.admin-tab-panel').forEach((x) => x.classList.toggle('active', x.dataset.tabPanel === 'almuerzos'));
        _costos.insumos = [
            { id: 'arroz', nombre: 'Arroz crudo', unidad: 'g', precioCompra: 4000, pesoEmpaque: 2000, mermaPct: 0, stockActual: 5000 },
            { id: 'pollo', nombre: 'Pechuga cruda', unidad: 'g', precioCompra: 18000, pesoEmpaque: 1000, mermaPct: 10, stockActual: 400 },
            { id: 'papa', nombre: 'Papa pastusa', unidad: 'g', precioCompra: 2000, pesoEmpaque: 1000, mermaPct: 20 },
            { id: 'repollo', nombre: 'Repollo', unidad: 'g', precioCompra: 1500, pesoEmpaque: 1000, mermaPct: 0, stockActual: 250 },
            { id: 'mora', nombre: 'Mora', unidad: 'g', precioCompra: 6000, pesoEmpaque: 1000, mermaPct: 0 }
        ];
        _costos.recetas = [
            { id: 'r-arroz', nombre: 'Arroz blanco', pesoTotal: 2500, items: [{ tipo: 'insumo', id: 'arroz', cantidad: 1000 }] },
            { id: 'r-pollo', nombre: 'Pollo a la plancha', pesoTotal: 800, items: [{ tipo: 'insumo', id: 'pollo', cantidad: 1000 }] },
            { id: 'r-papa', nombre: 'Papa francesa', pesoTotal: 600, items: [{ tipo: 'insumo', id: 'papa', cantidad: 1000 }] },
            { id: 'r-rep', nombre: 'Ensalada de repollo', pesoTotal: 500, items: [{ tipo: 'insumo', id: 'repollo', cantidad: 500 }] },
            { id: 'r-jugo', nombre: 'Jugo de mora', pesoTotal: 4000, items: [{ tipo: 'insumo', id: 'mora', cantidad: 300 }] }
        ];
        const set = (id, v) => { col('almuerzo_componentes')[id] = v; };
        set('c1', { categoria: 'proteina', nombre: 'Pollo a la plancha', ref: { tipo: 'receta', id: 'r-pollo' }, activo: true, disponible: true });
        set('c2', { categoria: 'proteina', nombre: 'Carne para Pepito', ref: { tipo: 'receta', id: 'r-pollo' }, activo: true, disponible: false });
        set('c3', { categoria: 'contorno', nombre: 'Papa francesa', ref: { tipo: 'receta', id: 'r-papa' }, activo: true, disponible: true });
        set('c4', { categoria: 'ensalada', nombre: 'Ensalada de repollo', ref: { tipo: 'receta', id: 'r-rep' }, activo: true, disponible: true });
        set('c5', { categoria: 'bebida', nombre: 'Jugo de mora', ref: { tipo: 'receta', id: 'r-jugo' }, activo: true, disponible: true });
        col('almuerzo_config').main = { nombre: 'Almuerzo Ejecutivo', manoObra: 0, arroz: { nombre: 'Arroz', ref: { tipo: 'receta', id: 'r-arroz' }, porcion: 200, unidad: 'g' } };
    });
    await p.evaluate(() => _ensureAlmuerzosLoaded());
    await p.waitForTimeout(200);

    const tab = await p.evaluate(() => ({
        arts: document.querySelectorAll('#almuerzosBody > article').length, tabs: document.getElementById('almuerzosBody').dataset.tabs,
        hoy: [...document.querySelectorAll('[data-alm-hoy]')].length, encendidos: [...document.querySelectorAll('[data-alm-hoy]')].filter((c) => c.checked).length,
        texto: document.getElementById('almuerzosBody').innerText
    }));
    ok(tab.arts === 6 && tab.tabs === 'menu,comp,inv,rep,cfg', 'la pestaña pinta sus 6 tarjetas y 5 pestañas internas (' + tab.tabs + ')');
    ok(tab.hoy === 5 && tab.encendidos === 4, 'Menú de hoy: 5 componentes, 4 encendidos');
    ok(/combinaciones/.test(tab.texto) && /\$ 1\d\.\d{3}/.test(tab.texto), 'muestra combinaciones posibles y utilidad bruta');
    await p.screenshot({ path: path.join(out, 'almuerzos-menu.png') });

    // Encender la proteína apagada desde la casilla (guarda en Firestore)
    await p.evaluate(() => { const c = document.querySelector('[data-alm-hoy="c2"]'); c.checked = true; c.dispatchEvent(new Event('change', { bubbles: true })); });
    await p.waitForTimeout(200);
    ok(await p.evaluate(() => col('almuerzo_componentes').c2.disponible === true && col('almuerzo_config').main.menuActualizadoDia === _almDia()), 'encender un componente lo guarda y marca el menú como actualizado hoy');
    await p.evaluate(() => { const c = document.querySelector('[data-alm-hoy="c2"]'); c.checked = false; c.dispatchEvent(new Event('change', { bubbles: true })); });
    await p.waitForTimeout(150);

    // Selector de la caja
    await p.evaluate(() => openAlmuerzoPicker(_productos[0]));
    await p.waitForSelector('#almPickerModal .alm-box');
    ok(await p.evaluate(() => document.querySelectorAll('#almPickerModal [data-alm-pick]').length === 4), 'el selector solo ofrece lo encendido hoy (4 opciones; la apagada no aparece)');
    ok(await p.evaluate(() => document.querySelector('[data-alm-add]').disabled), 'no deja agregar hasta elegir las 4 categorías');
    for (const [cat, id] of [['proteina', 'c1'], ['contorno', 'c3'], ['ensalada', 'c4']]) await p.click(`[data-alm-pick="${cat}:${id}"]`);
    ok(await p.evaluate(() => document.querySelector('[data-alm-add]').disabled), 'con 3 de 4 sigue deshabilitado');
    await p.click('[data-alm-pick="bebida:c5"]');
    ok(await p.evaluate(() => !document.querySelector('[data-alm-add]').disabled), 'con las 4 elegidas se habilita');
    await p.click('.alm-costo summary');
    await p.screenshot({ path: path.join(out, 'almuerzos-selector.png') });
    await p.click('[data-alm-add]');
    await p.waitForTimeout(100);
    const item = await p.evaluate(() => internalOrderItems[0]);
    ok(internalOrderItemsOk(item), 'el carrito recibe UN producto con precio 19.000 y el detalle exacto de la combinación');
    function internalOrderItemsOk(i) { return i && i.productId === 'almuerzo-ejecutivo' && i.unitPrice === 19000 && i.almuerzo.componentes.length === 4 && i.almuerzo.arroz.porcion === 200 && /Pollo a la plancha \+ Papa francesa/.test(i.optionLabelOrig); }

    // Inventario: guardar el pedido descuenta; sin stock rechaza; anular devuelve
    // los insumos del arnés viven en _costos: se siembran en la base simulada para que las transacciones los vean
    await p.evaluate(() => { _costos.insumos.forEach((i) => { col('costos_insumos')[i.id] = JSON.parse(JSON.stringify(i)); }); });
    const r2 = await p.evaluate(async () => {
        const it = internalOrderItems[0];
        await _almGuardarPedido('P2', { id: 'P2', items: [{ ...it, quantity: 2 }] }, null);
        const s = (id) => col('costos_insumos')[id].stockActual;
        return { pollo: s('pollo'), repollo: s('repollo'), arroz: s('arroz'), papaSinControl: col('costos_insumos').papa.stockActual === undefined, pedido: !!col('pedidos').P2, consumo: col('pedidos').P2.almuerzoConsumos.pollo.cantidad };
    });
    ok(r2.pollo === 25 && r2.repollo === 50 && r2.arroz === 4840 && r2.papaSinControl && r2.pedido && r2.consumo === 375, 'vender 2 descuenta SOLO esos ingredientes (pollo 400→25, repollo 250→50, arroz 5000→4840) y no toca el que no tiene control: ' + JSON.stringify(r2));
    const r3 = await p.evaluate(async () => {
        const it = internalOrderItems[0];
        try { await _almGuardarPedido('P3', { id: 'P3', items: [{ ...it, quantity: 1 }] }, null); return { pasa: true }; }
        catch (e) { return { pasa: false, msg: e.message, pedido: !!col('pedidos').P3, pollo: col('costos_insumos').pollo.stockActual }; }
    });
    ok(r3.pasa === false && /Inventario insuficiente/.test(r3.msg) && /Pechuga/.test(r3.msg) && !r3.pedido && r3.pollo === 25, 'sin inventario suficiente NO se guarda el pedido ni se descuenta nada: ' + r3.msg);
    const r4 = await p.evaluate(async () => {
        const prev = col('pedidos').P2;
        const dev = await _almDevolverStock(prev);
        return { dev, pollo: col('costos_insumos').pollo.stockActual, arroz: col('costos_insumos').arroz.stockActual };
    });
    ok(r4.dev === true && r4.pollo === 400 && r4.arroz === 5000, 'anular devuelve el inventario completo (pollo 400, arroz 5000)');
    const r5 = await p.evaluate(async () => {
        const ped = { ...col('pedidos').P2, almuerzoStockDevuelto: true };
        return { otraVez: await _almDevolverStock(ped), pollo: col('costos_insumos').pollo.stockActual };
    });
    ok(r5.otraVez === false && r5.pollo === 400, 'no se devuelve dos veces');
    // Editar: pasar de 2 a 1 devuelve media tanda
    const r6 = await p.evaluate(async () => {
        const it = internalOrderItems[0];
        await _almGuardarPedido('P6', { id: 'P6', items: [{ ...it, quantity: 2 }] }, null);
        const antes = col('costos_insumos').pollo.stockActual;
        const prev = { ...col('pedidos').P6 };
        await _almGuardarPedido('P6', { id: 'P6', items: [{ ...it, quantity: 1 }] }, prev);
        return { antes, despues: col('costos_insumos').pollo.stockActual };
    });
    ok(r6.antes === 25 && r6.despues === 212.5, 'editar de 2 a 1 almuerzo devuelve la diferencia (pollo 25 → 212,5)');

    // Reportes sobre ventas con snapshot (costos de ese momento)
    await p.evaluate(() => {
        const it = internalOrderItems[0];
        const caro = JSON.parse(JSON.stringify(it.almuerzo)); caro.costoReal = 9999;
        _ordenesMetricas = [{ items: [{ ...it, quantity: 3, unitPrice: 19000 }], status: 'entregado', createdAt: Date.now() }, { items: [{ ...it, almuerzo: caro, quantity: 1, unitPrice: 19000 }], status: 'cancelado', createdAt: Date.now() }];
        _alm.ordenes = null; return _ensureAlmuerzosLoaded();
    });
    await p.waitForTimeout(300);
    const rep = await p.evaluate(() => document.getElementById('almuerzosBody').innerText);
    ok(/Almuerzos vendidos\s*3/.test(rep.replace(/\n+/g, ' ')) || /3\s*1 pedido/.test(rep.replace(/\n+/g, ' ')), 'el reporte cuenta 3 almuerzos (el pedido cancelado no suma)');
    ok(/Pollo a la plancha/.test(rep) && /Papa francesa/.test(rep) && /Jugo de mora/.test(rep), 'el reporte lista proteínas, contornos y bebidas vendidas');
    await (await p.$('#almuerzosBody')).screenshot({ path: path.join(out, 'almuerzos-pestana-completa.png') });

    // Mesero: no vende almuerzos
    const mes = await p.evaluate(async () => { _meseroSession = { id: 'm' }; const n = avisos.length; await openAlmuerzoPicker(_productos[0]); _meseroSession = null; return { aviso: avisos.slice(n).join('|'), modal: !!document.querySelector('#almPickerModal') && document.querySelectorAll('#almPickerModal').length }; });
    ok(/se cobran desde la caja/.test(mes.aviso), 'un mesero recibe el aviso en vez del selector');
    ok(errs.length === 0, 'sin errores de JavaScript' + (errs.length ? ': ' + errs.join(' | ') : ''));
} finally { await nav.close(); srv.close(); fs.unlinkSync(archivo); }
process.exit(fallos ? 1 : 0);
