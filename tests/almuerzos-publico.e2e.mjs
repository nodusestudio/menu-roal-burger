// Navegador real: modal público del Almuerzo Ejecutivo (4 pasos, solo lo activo) y su opción en el carrito.
//   node tests/almuerzos-publico.e2e.mjs
import fs from 'node:fs'; import http from 'node:http'; import path from 'node:path'; import { fileURLToPath } from 'node:url'; import { chromium } from 'playwright';
const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const js = fs.readFileSync(path.join(raiz, 'src/js/script-v2.js'), 'utf8').replace(/\r\n/g, '\n');
const bloqueNorm = js.slice(js.indexOf('const ALMUERZO_CATS_PUB'), js.indexOf('function normalizeOrderOptions('));
const bloqueModal = js.slice(js.indexOf('const ALMUERZO_PASOS_PUB'), js.indexOf('// ── "Almuerzo de hoy"'));
const bloqueHoy = js.slice(js.indexOf('// ── "Almuerzo de hoy"'));
const etiqueta = js.slice(js.indexOf("    if (normalized.almuerzo) {"), js.indexOf("    if (normalized.promoLabel) {\n        optionLabel"));
const stubs = `
const escapeHtml = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const _pushGenericModal = () => {}; const _popGenericModal = () => {};
const carrito = [];
const addItemToCart = (n, c, o) => carrito.push({ n, c, o });
const COMP = [
 ['p1','proteina','Pollo a la plancha',true],['p2','proteina','Carne para Pepito',false],['p3','proteina','Chuleta de cerdo',true],
 ['c1','contorno','Papa francesa',true],['e1','ensalada','Ensalada tradicional',true],['b1','bebida','Té de limón',true]];
const normalizeCategoryKey = (v) => String(v || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
const formatCurrency = (v) => '$' + Number(v).toLocaleString('es-CO');
let latestProducts = [{ id: 'almuerzo-ejecutivo', nombre: 'Almuerzo Ejecutivo', precio: 19000, categoria: 'ALMUERZOS', almuerzoConfigurable: true, estado: 'active' }];
const getPublicFirebaseDb = () => ({ collection: () => ({ onSnapshot: (cb) => cb({ docs: COMP.map(([id, categoria, nombre, disponible]) => ({ id, data: () => ({ categoria, nombre, disponible, activo: true }) })) }), get: async () => ({ docs: COMP.map(([id, categoria, nombre, disponible]) => ({ id, data: () => ({ categoria, nombre, disponible, activo: true }) })) }) }) });
`;
const srvHtml = '<!doctype html><meta charset=utf-8><link rel=stylesheet href=/style.css><body style="background:#2a2f45;margin:0"><div><div id=categoryGrid></div></div><div id=categoryProductsPanel></div>';
const srv = http.createServer((req, res) => { const f = path.join(raiz, decodeURIComponent(req.url.split('?')[0])); if (req.url === '/') { res.writeHead(200, { 'Content-Type': 'text/html' }); return res.end(srvHtml); } if (!fs.existsSync(f)) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': f.endsWith('.css') ? 'text/css' : 'text/plain' }); fs.createReadStream(f).pipe(res); }).listen(0);
await new Promise((r) => srv.on('listening', r));
const nav = await chromium.launch(); let fallos = 0;
const ok = (c, m) => { console.log((c ? '✅ ' : '❌ ') + m); if (!c) fallos++; };
try {
    const p = await nav.newPage({ viewport: { width: 400, height: 800 } });
    const errs = []; p.on('pageerror', (e) => errs.push(e.message));
    await p.goto('http://localhost:' + srv.address().port + '/');
    await p.addScriptTag({ content: stubs + bloqueNorm + bloqueModal + bloqueHoy });
    const norm = await p.evaluate(() => [_normalizarAlmuerzoSel({ proteina: { id: 'a', nombre: 'b' }, basura: 1, bebida: { id: '' } }), _normalizarAlmuerzoSel(null), _normalizarAlmuerzoSel({})]);
    ok(JSON.stringify(norm) === JSON.stringify([{ proteina: { id: 'a', nombre: 'b' } }, null, null]), 'la selección se limpia: solo las 4 categorías con id y nombre');
    await p.evaluate(() => abrirModalAlmuerzo('Almuerzo Ejecutivo', 'x.webp', 'ALMUERZOS'));
    await p.waitForSelector('.alm-pub-o');
    let ops = await p.$$eval('.alm-pub-o', (b) => b.map((x) => x.textContent));
    ok(JSON.stringify(ops) === JSON.stringify(['Chuleta de cerdo', 'Pollo a la plancha']), 'paso 1 (proteína) ofrece solo las ACTIVAS (la apagada no sale): ' + ops.join(', '));
    await p.screenshot({ path: path.join(raiz, '_qa-shots', 'almuerzo-publico-paso1.png') });
    await p.click('.alm-pub-o:text("Pollo")');
    ok((await p.textContent('.alm-pub-q')).includes('contorno'), 'avanza al paso 2: contorno');
    await p.click('.alm-pub-b.sec');
    ok((await p.textContent('.alm-pub-q')).includes('proteína'), '"Atrás" vuelve al paso anterior');
    await p.click('.alm-pub-o:text("Pollo")'); await p.click('.alm-pub-o'); await p.click('.alm-pub-o'); await p.click('.alm-pub-o');
    ok((await p.textContent('.alm-pub-r')) === 'Pollo a la plancha + Papa francesa + Ensalada tradicional + Té de limón + Arroz', 'resumen final con las 4 elecciones + arroz');
    await p.screenshot({ path: path.join(raiz, '_qa-shots', 'almuerzo-publico-resumen.png') });
    await p.click('[data-add]');
    const c = await p.evaluate(() => carrito);
    ok(c.length === 1 && c[0].n === 'Almuerzo Ejecutivo' && c[0].c === 'ALMUERZOS' && c[0].o.almuerzo.bebida.nombre === 'Té de limón' && !(await p.$('#almuerzo-modal')), 'agrega UN ítem al carrito con la selección y cierra el modal');
    // Almuerzo de hoy: tarjeta, franja y apagado
    await p.evaluate(() => { _almPubIniciar(); renderAlmuerzosPublicPanel(document.getElementById('categoryProductsPanel')); });
    const hoy = await p.evaluate(() => ({ filas: [...document.querySelectorAll('.alm-hoy-f')].map((x) => x.textContent), boton: !!document.querySelector('[data-armar]'), franja: (document.getElementById('almuerzoHoyFranja') || {}).textContent || '' }));
    ok(hoy.filas.length === 4 && hoy.filas[0].includes('Pollo a la plancha') && hoy.filas[0].includes('Chuleta de cerdo') && !hoy.filas[0].includes('Pepito') && hoy.boton, 'tarjeta Almuerzo de hoy: 4 filas con SOLO lo activo y el botón Armar: ' + JSON.stringify(hoy.filas));
    ok(/Hoy hay almuerzo/.test(hoy.franja) && hoy.franja.includes("$19.000") && /Pollo a la plancha/.test(hoy.franja), 'franja superior con precio y proteínas: ' + hoy.franja);
    await p.screenshot({ path: path.join(raiz, '_qa-shots', 'almuerzo-hoy-menu.png') });
    await p.evaluate(() => { COMP.forEach((c) => { if (c[1] === 'ensalada') c[3] = false; }); _almPub.comps = COMP.map(([id, categoria, nombre, disponible]) => ({ id, categoria, nombre, disponible, activo: true })); _almPubRefrescar(); renderAlmuerzosPublicPanel(document.getElementById('categoryProductsPanel')); });
    const sin = await p.evaluate(() => ({ txt: document.getElementById('categoryProductsPanel').textContent, franja: !!document.getElementById('almuerzoHoyFranja'), boton: !!document.querySelector('[data-armar]') }));
    ok(/no hay almuerzo/.test(sin.txt) && !sin.franja && !sin.boton, 'si se apaga una categoría completa: dice que no hay almuerzo, sin franja ni botón');
    ok(errs.length === 0, 'sin errores de JavaScript' + errs.join('|'));
} finally { await nav.close(); srv.close(); }
process.exit(fallos ? 1 : 0);
