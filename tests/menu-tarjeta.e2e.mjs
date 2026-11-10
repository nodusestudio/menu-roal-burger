// Prueba en navegador real (Playwright) del ☰ de cada tarjeta de pedido: usa el código REAL de createOrderCard, del menú de acciones
// (buildOrderActionsMenuHtml) y del desplegable (_kocAbrirMenu…) con los estilos reales de admin.html. Las funciones de apoyo que no
// son parte de lo probado se simulan automáticamente.
//   node tests/menu-tarjeta.e2e.mjs      (sale con código 1 si algo falla)
import fs from 'node:fs';
import os from 'node:os';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const js = fs.readFileSync(path.join(raiz, 'src/js/admin.js'), 'utf8');
const bloque = (ini, fin) => { const a = js.indexOf(ini); const b = js.indexOf(fin, a + ini.length); if (a < 0 || b < 0) throw new Error('No se encontró ' + ini); return js.slice(a, b); };
const funcion = (inicio) => {
  const a = js.indexOf(inicio); if (a < 0) throw new Error('No se encontró ' + inicio);
  const m = /\r?\n(?:async )?function |\r?\n\/\/ ──|\r?\nconst [A-Z_]+ = /.exec(js.slice(a + inicio.length));
  return js.slice(a, a + inicio.length + (m ? m.index : 0));
};
const codigo = [
  funcion('function buildOrderActionsMenuHtml('),
  funcion('function createOrderCard('),
  bloque('let _kocMenuOrderId = null;', "if (orderTicketPanel) {")
].join('\n');

const pagina = fs.readFileSync(path.join(raiz, 'admin.html'), 'utf8').replace(/<script[\s\S]*?<\/script>/g, '')
  .replace('</body>', `<script>document.body.classList.remove('admin-loading','admin-locked');document.body.classList.add('admin-unlocked');
window.__src = ${JSON.stringify(codigo)};</script></body>`);
const archivo = path.join(raiz, '__mt_harness.html');
fs.writeFileSync(archivo, pagina);
const srv = http.createServer((req, res) => {
  const f = path.join(raiz, decodeURIComponent(req.url.split('?')[0]));
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': f.endsWith('.css') ? 'text/css' : 'text/html' });
  fs.createReadStream(f).pipe(res);
}).listen(0);
const port = srv.address().port;

const res = []; const ok = (c, m) => res.push(`${c ? '✅' : '❌'} ${m}`);
const navegador = await chromium.launch();
try {
  const p = await navegador.newPage({ viewport: { width: 1360, height: 860 } });
  const errores = []; p.on('pageerror', (e) => errores.push(e.message));
  await p.goto(`http://localhost:${port}/__mt_harness.html`);
  await p.evaluate(() => {
    // Todo lo que no es parte de lo probado se simula solo (cualquier nombre desconocido devuelve '' al llamarlo)
    const propios = { ordersState: [], selectedOrderId: null, _meseroSession: null, registro: [] };
    const real = (n) => n in window;
    const proxy = new Proxy(propios, {
      has: (t, k) => typeof k === 'string' && !['window', 'document', 'console', 'Element', 'Math', 'Number', 'String', 'Array', 'Object', 'JSON', 'setTimeout', 'HTMLElement', 'HTMLButtonElement', 'Date', 'Promise', 'Boolean', 'Symbol', 'parseInt', 'parseFloat', 'isNaN', 'encodeURIComponent'].includes(k),
      get: (t, k) => (k in t ? t[k] : (real(k) && k !== 'name' ? window[k] : (() => ''))),
      set: (t, k, v) => { t[k] = v; return true; }
    });
    Object.assign(propios, {
      escapeHtml: (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])),
      formatMoney: (v) => '$ ' + Number(v || 0).toLocaleString('es-CO'),
      getOrderDisplayTotal: (o) => Number(o.total || 0),
      getOrderDisplayCustomerName: (o) => o.customerName || 'Cliente',
      getOrderTypeLabel: (o) => (o.orderType === 'domicilio' ? 'Domicilio' : o.orderType === 'mesa' ? 'Mesa ' + o.mesaNumber : 'Para llevar'),
      formatElapsedTime: () => 'hace 1min', formatOrderTime: () => '03:52 p. m.', formatLiveDuration: () => '1:00',
      isOrderClosed: () => false, isOrderPaid: () => false, isOrderLockedForEdit: () => false, isMobileAdminViewport: () => false,
      _getOrderPromoTags: () => [], getPickupModeTag: () => '', getMeseroTag: () => '',
      buildWhatsAppUrl: (d, t) => 'https://wa.me/' + d + '?text=' + encodeURIComponent(t),
      buildOrderConfirmationMessage: () => 'Confirmación', buildOrderWhatsAppMessage: () => 'En preparación', buildDeliveredOrderMessage: () => 'Entregado', buildCourierRequestMessage: () => 'Domiciliario',
      copyTextToClipboard: async (t) => { propios.registro.push('copiado:' + t); }, showNotice: (t) => { propios.registro.push('aviso:' + t); },
      renderOrders: () => { propios.registro.push('renderOrders'); },
      renderOrderTicket: (o) => { propios.registro.push('ticket:' + o.id); },
      isMobileAdminViewport: () => false
    });
    window.__propios = propios;
    const f = new Function('__p', 'with (__p) { ' + window.__src + '\n return { createOrderCard, buildOrderActionsMenuHtml, _kocAbrirMenu, _kocCerrarMenu }; }');
    window.__api = f(proxy);
    // ticket "real" mínimo con la misma opción de menú, para ver que la acción de edición se ejecuta ahí
    const tp = document.getElementById('orderTicketPanel');
    tp.innerHTML = '<button class="ticket-msg-menu-item" data-order-ticket-action="edit-items">x</button><button class="ticket-msg-menu-item" data-order-ticket-action="edit-field" data-edit-field="customerPhone">t</button>';
    tp.addEventListener('click', (e) => { const b = e.target.closest('[data-order-ticket-action]'); if (b) propios.registro.push('accion:' + b.dataset.orderTicketAction + (b.dataset.editField ? ':' + b.dataset.editField : '')); });
    const pedidos = [
      { id: 'd1', code: 'RB-2051', orderType: 'domicilio', status: 'pendiente', customerName: 'Faber Andres', customerPhone: '3127833473', total: 26000, deliveryFee: 7000, deliveryAddress: 'Mz 24 casa 12 puerto espejo', paymentMethod: 'efectivo', createdAt: Date.now() },
      { id: 'r1', code: 'RB-2052', orderType: 'retiro', status: 'pendiente', customerName: 'Maria Perez', customerPhone: '3001112233', total: 38000, createdAt: Date.now() },
      { id: 'm1', code: 'RB-2053', orderType: 'mesa', mesaNumber: 3, status: 'pendiente', customerName: 'Mesa 3', total: 54500, createdAt: Date.now() }
    ];
    propios.ordersState.push(...pedidos);
    const carril = { d1: 'ordersColumnDelivery', r1: 'ordersColumnTakeaway', m1: 'ordersColumnTakeaway' };
    pedidos.forEach((o) => { const c = document.getElementById(carril[o.id]); if (o.id !== 'm1') c.innerHTML = ''; c.appendChild(window.__api.createOrderCard(o)); });
  });
  await p.waitForTimeout(300);

  for (const id of ['d1', 'r1', 'm1']) ok(await p.locator(`.kanban-order-card[data-order-id="${id}"] .koc-menu-btn`).count() === 1, `la tarjeta ${id} tiene su ☰`);
  // Compacto: el ☰ cabe dentro de la tarjeta y no se monta sobre el resto de la cabecera
  const geom = await p.evaluate(() => [...document.querySelectorAll('.kanban-order-card')].map((c) => {
    const cr = c.getBoundingClientRect(); const b = c.querySelector('.koc-menu-btn').getBoundingClientRect();
    const otros = [...c.querySelectorAll('.koc-body > *:not(.koc-menu-btn)')].map((e) => e.getBoundingClientRect()).filter((r) => r.width > 0);
    const choca = otros.some((r) => !(b.right <= r.left + 0.5 || b.left >= r.right - 0.5 || b.bottom <= r.top || b.top >= r.bottom));
    return { dentro: b.left >= cr.left && b.right <= cr.right + 0.5 && b.top >= cr.top && b.bottom <= cr.bottom, choca, w: Math.round(b.width), h: Math.round(b.height) };
  }));
  ok(geom.every((g) => g.dentro), 'el ☰ queda DENTRO de cada tarjeta (no se sale ni se corta)');
  ok(geom.every((g) => !g.choca), 'el ☰ NO se monta sobre el código, el tipo, las etiquetas ni la hora');
  ok(geom.every((g) => g.w <= 26 && g.h <= 26), 'el ☰ es compacto (24 px)');
  await p.screenshot({ path: path.join(os.tmpdir(), 'mt-1-tarjetas.png') });

  // Abrir el menú de la tarjeta de domicilio
  await p.click('.kanban-order-card[data-order-id="d1"] .koc-menu-btn');
  ok(await p.locator('#_kocMenuPop').isVisible(), 'al tocar el ☰ se abre el menú del pedido');
  const texto = await p.locator('#_kocMenuPop').innerText();
  ok(/mensajes al cliente/i.test(texto) && /agregar productos/i.test(texto) && /editar dirección/i.test(texto) && /pedir domiciliario/i.test(texto), 'trae lo mismo que el ticket: mensajes, edición, dirección y «Pedir domiciliario»');
  if (process.env.DEBUG) console.log('TEXTO MENU:', JSON.stringify(texto));
  const box = await p.locator('#_kocMenuPop').boundingBox();
  ok(box.x >= 0 && box.y >= 0 && box.x + box.width <= 1360 && box.y + box.height <= 860, 'el menú queda entero dentro de la pantalla');
  ok(await p.evaluate(() => !document.querySelector('.kanban-order-card.is-selected')), 'tocar el ☰ NO selecciona la tarjeta');
  await p.screenshot({ path: path.join(os.tmpdir(), 'mt-2-menu.png') });
  await p.keyboard.press('Escape');
  ok(await p.locator('#_kocMenuPop').count() === 0, 'Escape cierra el menú');

  // Acción de edición: selecciona el pedido y ejecuta la misma opción del ticket
  await p.click('.kanban-order-card[data-order-id="d1"] .koc-menu-btn');
  await p.locator('#_kocMenuPop .ticket-msg-menu-item', { hasText: 'Agregar productos' }).click();
  const reg = await p.evaluate(() => window.__propios.registro);
  if (process.env.DEBUG) console.log('REGISTRO:', JSON.stringify(reg));
  ok(reg.includes('ticket:d1') && reg.includes('accion:edit-items'), '«Agregar productos» abre el ticket de ESE pedido y ejecuta la edición');
  ok(await p.locator('#_kocMenuPop').count() === 0, 'y el menú se cierra');
  await p.click('.kanban-order-card[data-order-id="d1"] .koc-menu-btn');
  await p.locator('#_kocMenuPop .ticket-msg-menu-item', { hasText: 'Editar teléfono' }).click();
  ok((await p.evaluate(() => window.__propios.registro)).includes('accion:edit-field:customerPhone'), '«Editar teléfono» llega con su campo (customerPhone)');

  // Copiar mensaje
  await p.click('.kanban-order-card[data-order-id="d1"] .koc-menu-btn');
  await p.locator('#_kocMenuPop button[data-wa-copy]').first().click();
  await p.waitForTimeout(100);
  ok((await p.evaluate(() => window.__propios.registro)).some((x) => x.startsWith('copiado:')) && (await p.evaluate(() => window.__propios.registro)).some((x) => x.includes('Mensaje copiado')), 'copiar un mensaje funciona desde la tarjeta');

  // Cierre al tocar fuera y alternar con el mismo botón
  await p.click('.kanban-order-card[data-order-id="r1"] .koc-menu-btn');
  ok(await p.locator('#_kocMenuPop').count() === 1 && !/pedir domiciliario/i.test(await p.locator('#_kocMenuPop').innerText()), 'en un pedido para llevar el menú no ofrece «Pedir domiciliario»');
  await p.click('.kanban-order-card[data-order-id="r1"] .koc-menu-btn');
  ok(await p.locator('#_kocMenuPop').count() === 0, 'tocar otra vez el mismo ☰ lo cierra');
  await p.click('.kanban-order-card[data-order-id="m1"] .koc-menu-btn');
  await p.mouse.click(700, 760);
  ok(await p.locator('#_kocMenuPop').count() === 0, 'tocar fuera cierra el menú');
  // Mesa: opción de cambiar mesa
  await p.click('.kanban-order-card[data-order-id="m1"] .koc-menu-btn');
  ok(/cambiar mesa/i.test(await p.locator('#_kocMenuPop').innerText()), 'en una mesa el menú ofrece «Cambiar mesa»');
  await p.keyboard.press('Escape');

  // Estructura (la mesa del mapa y el tablero)
  ok(/mesa-tile-act--menu/.test(js) && /data-card-menu/.test(js), 'la mesa ocupada del mapa también lleva su ☰');
  ok(/if \(target\.closest\('\[data-card-menu\]'\)\) return;/.test(js), 'el clic en ☰ no pasa por la selección de tarjeta del tablero');
  ok(errores.length === 0, 'sin errores de JavaScript' + (errores.length ? ': ' + errores.join(' | ') : ''));
} finally {
  await navegador.close(); srv.close();
  if (!process.env.KEEP) fs.unlinkSync(archivo);
}
console.log(res.join('\n'));
if (res.some((r) => r.startsWith('❌'))) process.exit(1);
