// Navegador real: menú público del Almuerzo Ejecutivo. Un solo selector: el menú del día, donde se toca 1 opción por bloque.
//   node tests/almuerzos-publico.e2e.mjs
import fs from 'node:fs'; import http from 'node:http'; import path from 'node:path'; import { fileURLToPath } from 'node:url'; import { chromium } from 'playwright';
const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const js = fs.readFileSync(path.join(raiz, 'src/js/script-v2.js'), 'utf8').replace(/\r\n/g, '\n');
const bloqueNorm = js.slice(js.indexOf('const ALMUERZO_CATS_PUB'), js.indexOf('function normalizeOrderOptions('));
const bloqueHoy = js.slice(js.indexOf('function abrirModalAlmuerzo()'));
const stubs = `
const escapeHtml = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const _pushGenericModal = () => {}; const _popGenericModal = () => {};
const carrito = []; const addItemToCart = (n, c, o) => carrito.push({ n, c, o });
const COMP = [['p1','proteina','Pollo a la plancha',true],['p2','proteina','Carne para Pepito',false],['p3','proteina','Chuleta de cerdo',true],['c1','contorno','Papa francesa',true],['e1','ensalada','Ensalada tradicional',true],['b1','bebida','Té de limón',true]];
const normalizeCategoryKey = (v) => String(v || '').toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').trim();
const formatCurrency = (v) => '$' + Number(v).toLocaleString('es-CO');
let latestProducts = [{ id: 'almuerzo-ejecutivo', nombre: 'Almuerzo Ejecutivo', precio: 19000, categoria: 'ALMUERZOS', almuerzoConfigurable: true, estado: 'active' }];
const getPublicFirebaseDb = () => ({ collection: () => ({ onSnapshot: (cb) => cb({ docs: COMP.map(([id, categoria, nombre, disponible]) => ({ id, data: () => ({ categoria, nombre, disponible, activo: true }) })) }) }) });
`;
const html = '<!doctype html><meta charset=utf-8><link rel=stylesheet href=/style.css><body style="background:#2a2f45;margin:0"><div><div id=categoryGrid></div></div>';
const srv = http.createServer((req, res) => {
    const f = path.join(raiz, decodeURIComponent(req.url.split('?')[0]));
    if (req.url === '/') { res.writeHead(200, { 'Content-Type': 'text/html' }); return res.end(html); }
    if (!fs.existsSync(f)) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': f.endsWith('.css') ? 'text/css' : 'text/plain' }); fs.createReadStream(f).pipe(res);
}).listen(0);
await new Promise((r) => srv.on('listening', r));
const nav = await chromium.launch(); let fallos = 0;
const ok = (c, m) => { console.log((c ? '✅ ' : '❌ ') + m); if (!c) fallos++; };
try {
    const p = await nav.newPage({ viewport: { width: 400, height: 800 } });
    const errs = []; p.on('pageerror', (e) => errs.push(e.message));
    await p.goto('http://localhost:' + srv.address().port + '/');
    await p.addScriptTag({ content: stubs + bloqueNorm + bloqueHoy });
    const norm = await p.evaluate(() => [_normalizarAlmuerzoSel({ proteina: { id: 'a', nombre: 'b' }, basura: 1, bebida: { id: '' } }), _normalizarAlmuerzoSel(null)]);
    ok(JSON.stringify(norm) === JSON.stringify([{ proteina: { id: 'a', nombre: 'b' } }, null]), 'la selección se limpia: solo las 4 categorías con id y nombre');
    await p.evaluate(() => { _almPubIniciar(); });
    const fr = await p.evaluate(() => (document.getElementById('almuerzoHoyFranja') || {}).textContent || '');
    ok(/Hoy hay almuerzo/.test(fr) && fr.includes('$19.000') && fr.includes('Pollo a la plancha'), 'franja superior con precio y proteínas: ' + fr);
    ok((await p.evaluate(() => _almPubResumenTexto())).includes('Toca para elegir'), 'la tarjeta del catálogo dice "Toca para elegir tu almuerzo"');

    // TODAS las rutas abren el mismo menú seleccionable
    await p.evaluate(() => abrirModalAlmuerzo());
    await p.waitForSelector('#almuerzo-menu-modal .alm-menu-op');
    const ini = await p.evaluate(() => ({ bloques: document.querySelectorAll('.alm-menu-sec').length, fichas: [...document.querySelectorAll('.alm-menu-op')].map((x) => x.textContent), deshab: document.querySelector('[data-add]').disabled, txt: document.querySelector('[data-add]').textContent }));
    ok(ini.bloques === 4 && ini.fichas.length === 5 && !ini.fichas.includes('Carne para Pepito') && ini.deshab && /Falta/.test(ini.txt), 'menú del día: 4 bloques, 5 fichas SOLO activas, agregar deshabilitado ("' + ini.txt + '")');
    await p.screenshot({ path: path.join(raiz, '_qa-shots', 'almuerzo-menu-dia.png') });
    await p.click('.alm-menu-op:text("Pollo a la plancha")');
    await p.click('.alm-menu-op:text("Chuleta de cerdo")');
    const un = await p.evaluate(() => [...document.querySelectorAll('.alm-menu-op.on')].map((x) => x.textContent));
    ok(un.length === 1 && un[0].includes('Chuleta'), 'solo una opción por bloque (al tocar otra, reemplaza)');
    await p.click('.alm-menu-op.on');
    ok((await p.evaluate(() => document.querySelectorAll('.alm-menu-op.on').length)) === 0, 'tocar la elegida la desmarca');
    await p.click('.alm-menu-op:text("Pollo a la plancha")');
    await p.click('.alm-menu-op:text("Papa francesa")'); await p.click('.alm-menu-op:text("Ensalada tradicional")');
    ok(await p.evaluate(() => document.querySelector('[data-add]').disabled), 'con 3 de 4 sigue deshabilitado');
    await p.click('.alm-menu-op:text("Té de limón")');
    const fin = await p.evaluate(() => ({ deshab: document.querySelector('[data-add]').disabled, txt: document.querySelector('[data-add]').textContent, res: (document.querySelector('.alm-menu-res') || {}).textContent }));
    ok(!fin.deshab && /Agregar al carrito/.test(fin.txt) && fin.res === 'Pollo a la plancha + Papa francesa + Ensalada tradicional + Té de limón + Arroz', 'con las 4 elegidas: resumen y "' + fin.txt + '"');
    await p.screenshot({ path: path.join(raiz, '_qa-shots', 'almuerzo-menu-elegido.png') });
    await p.click('[data-add]');
    const c = await p.evaluate(() => carrito);
    ok(c.length === 1 && c[0].c === 'ALMUERZOS' && c[0].o.almuerzo.bebida.nombre === 'Té de limón' && c[0].o.almuerzo.proteina.id === 'p1' && !(await p.$('#almuerzo-menu-modal')), 'agrega UN ítem al carrito con la selección y cierra el menú');

    // Si falta una categoría completa, no se puede pedir
    await p.evaluate(() => { COMP.forEach((x) => { if (x[1] === 'ensalada') x[3] = false; }); _almPub.comps = COMP.map(([id, categoria, nombre, disponible]) => ({ id, categoria, nombre, disponible, activo: true })); _almPubRefrescar(); _almPubMenuDia(); });
    const sin = await p.evaluate(() => ({ txt: document.getElementById('almuerzo-menu-modal').textContent, franja: !!document.getElementById('almuerzoHoyFranja'), add: !!document.querySelector('[data-add]') }));
    ok(/no hay almuerzo/i.test(sin.txt) && !sin.franja && !sin.add, 'si falta una categoría completa: "no hay almuerzo", sin franja ni botón de agregar');
    ok(errs.length === 0, 'sin errores de JavaScript ' + errs.join('|'));
} finally { await nav.close(); srv.close(); }
process.exit(fallos ? 1 : 0);
