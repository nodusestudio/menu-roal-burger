// Navegador real: Mensajes con las funciones reales; conversaciones compactas y botones del encabezado de la familia única.
//   node tests/mensajes.e2e.mjs
import fs from 'node:fs'; import http from 'node:http'; import path from 'node:path'; import { fileURLToPath } from 'node:url'; import { chromium } from 'playwright';
const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = process.argv[2] || path.join(raiz, 'herramientas', 'capturas-config'); fs.mkdirSync(out, { recursive: true });
const ancho = +(process.argv[3] || 1280);
const js = fs.readFileSync(path.join(raiz, 'src/js/admin.js'), 'utf8');
const funcion = (nombre) => { const ini = js.indexOf('function ' + nombre + '('); if (ini < 0) return null; const m = /\r?\n}\r?\n/.exec(js.slice(ini)); return js.slice(ini, ini + m.index + m[0].length); };
const nombres = ['_tsMs', '_inboxThreadKey', '_inboxInitial', '_inboxGetTypeLabel', '_inboxBuildThreads', '_inboxFormatTime', 'renderMessages', 'openInboxDetail', 'formatOrderDate'];
const codigo = nombres.map(funcion).filter(Boolean).join('\n');
const pagina = fs.readFileSync(path.join(raiz, 'admin.html'), 'utf8').replace(/<script[\s\S]*?<\/script>/g, '').replace('</body>', `<script>
document.body.classList.remove('admin-loading','admin-locked'); document.body.classList.add('admin-unlocked');
const escapeHtml = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ahora = Date.now();
const mk = (i, tipo, extra) => Object.assign({ id: 'm' + i, customerName: ['Laura Gómez', 'Carlos Ruiz', 'Sofía Peña', 'Andrés Mora', 'Valentina Cardona', 'Juan Pérez'][i % 6], customerPhone: '31' + i + '2345678', customerPhoneDigits: '31' + i + '2345678', type: tipo, subject: tipo === 'password_reset_request' ? 'Olvidé mi contraseña' : 'No me llegó mi pedido a tiempo', body: 'Hola, quisiera saber qué pasó con mi pedido del viernes porque llegó frío y tarde.', status: i % 3 ? 'pending' : 'resolved', createdAt: ahora - i * 3600000, adminReply: i % 2 ? 'Hola, lamentamos lo ocurrido. Ya lo revisamos.' : '' }, extra || {});
const messagesState = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => mk(i, i === 2 ? 'password_reset_request' : 'general'));
let _inboxActiveId = null;
var messagesList, showNotice, _inboxTypeLabels;
messagesList = document.getElementById('messagesList');
const _formatOrderDate = (v) => '10/11/2026'; var formatOrderDate = _formatOrderDate;
${codigo}
try { renderMessages(); const t = _inboxBuildThreads(messagesState)[0]; openInboxDetail(t.key, false); } catch (e) { window.__err = e.message; }
const panel = document.querySelector('[data-tab-panel="mensajes"]'); let n = panel; while (n && n !== document.body) { n.hidden = false; if (getComputedStyle(n).display === 'none') n.style.display = 'block'; n = n.parentElement; }
panel.style.display = 'block'; document.querySelectorAll('body > *:not(.admin-shell):not(script)').forEach(() => {});
</script></body>`);
const archivo = path.join(raiz, '__msg.html'); fs.writeFileSync(archivo, pagina);
const srv = http.createServer((req, res) => { const f = path.join(raiz, decodeURIComponent(req.url.split('?')[0])); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': f.endsWith('.css') ? 'text/css' : 'text/html' }); fs.createReadStream(f).pipe(res); }).listen(0);
const nav = await chromium.launch();
try {
  const p = await nav.newPage({ viewport: { width: ancho, height: 900 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('http://localhost:' + srv.address().port + '/__msg.html');
  const ok = (c, m) => console.log((c ? '✅ ' : '❌ ') + m);
  const render = await p.evaluate(() => window.__err || 'ok');
  ok(render === 'ok' && errs.length === 0, 'MENSAJES: se dibuja con las funciones reales sin errores (' + render + ')');
  const m = await p.evaluate(() => ({ hilo: Math.round(document.querySelector('.inbox-thread-item').getBoundingClientRect().height), hilos: document.querySelectorAll('.inbox-thread-item').length, botones: [...document.querySelectorAll('.inbox-head-btn')].map((b) => { const c = getComputedStyle(b); return Math.round(b.getBoundingClientRect().height) + '/' + c.borderTopLeftRadius; }) }));
  ok(m.hilos === 10 && m.hilo <= 56, 'cada conversación mide ' + m.hilo + ' px (antes 61)');
  ok(m.botones.length === 2 && m.botones.every((x) => x === '32/9px'), 'los botones del encabezado (WhatsApp, Eliminar) miden 32 px con radio 9 px: ' + m.botones.join(' · '));
  if (render !== 'ok' || errs.length || m.hilo > 56 || !m.botones.every((x) => x === '32/9px')) process.exitCode = 1;
} finally { await nav.close(); srv.close(); fs.unlinkSync(archivo); }
