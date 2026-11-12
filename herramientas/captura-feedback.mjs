// Dibuja Feedback (seguimiento y respuestas) con el MISMO marcado que usa el admin (copiado de _fbSeguimientoHtml / renderMetricasFeedback) y datos de muestra.
//   node herramientas/captura-feedback.mjs <carpeta> [ancho=1280]
import fs from 'node:fs'; import http from 'node:http'; import path from 'node:path'; import { fileURLToPath } from 'node:url'; import { chromium } from 'playwright';
const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = process.argv[2] || path.join(raiz, 'herramientas', 'capturas-config'); fs.mkdirSync(out, { recursive: true });
const ancho = +(process.argv[3] || 1280);
const fila = (i, estado) => {
  const boton = estado === 'sin_enviar' ? '<button type="button" class="feedback-pending-btn">Copiar mensaje</button>' : (estado === 'enviado' ? '<button type="button" class="ghost-button">Volver a copiar</button>' : '');
  return `<div class="met-user-row-v2"><div class="met-user-info-v2"><div class="met-user-name-v2">Cliente de prueba ${i} · RB-35${i}</div><div class="met-user-meta-v2"><button type="button" class="feedback-pending-phone">📋 31${i}2345678</button> · ${estado === 'respondio' ? '✅ Respondió' : estado === 'enviado' ? '📨 Enviado, sin respuesta' : '⏳ Sin enviar'}</div></div>${boton}</div>`;
};
const dia = (t, abierto) => `<details class="fb-dia"${abierto ? ' open' : ''} style="margin-top:8px"><summary style="cursor:pointer;font-weight:700;padding:6px 0;text-transform:capitalize">${t} <small style="font-weight:400;opacity:.7;text-transform:none">· 6 con 2×1 · ✅ 2 · 📨 2 · ⏳ 2</small></summary><div class="metrics-users-list">${['respondio', 'enviado', 'sin_enviar', 'respondio', 'enviado', 'sin_enviar'].map((e, i) => fila(i + 1, e)).join('')}</div></details>`;
const resp = (i) => `<div class="met-user-row-v2"><div class="met-avatar">😍</div><div class="met-user-info-v2"><div class="met-user-name-v2">Cliente ${i} · Muy bueno</div><div class="met-user-meta-v2">3112345678 · RB-35${i} · Se enteró por Instagram</div></div></div>`;
const html = `<div class="admin-tab-panel active" data-tab-panel="feedback"><div id="fbBody">
<div class="clients-filtros"><button class="date-preset-btn active">🏆 Sabe a Quindío (2×1)</button><button class="date-preset-btn">💛 Fidelización</button></div>
<article class="admin-card menu-section-card" style="padding-bottom:0"><nav class="menu-inner-tabs-nav" role="tablist"><button type="button" class="menu-inner-tab active" role="tab">📅 Seguimiento</button><button type="button" class="menu-inner-tab" role="tab">📊 Métricas</button><button type="button" class="menu-inner-tab" role="tab">💬 Respuestas</button><button type="button" class="menu-inner-tab" role="tab">⬇️ Descargas</button></nav></article>
<article class="admin-card"><div class="met-section-title">📅 Día por día — a quién se le pidió feedback</div>${dia('miércoles 11 de noviembre', true)}${dia('martes 10 de noviembre', true)}</article>
<article class="admin-card"><div class="met-section-title">💬 Respuestas</div><p class="met-empty-note" style="text-align:left;margin:0 0 6px">12 respuestas</p><div class="metrics-users-list">${Array.from({ length: 6 }, (_, i) => resp(i + 1)).join('')}</div></article>
</div></div>`;
const pagina = fs.readFileSync(path.join(raiz, 'admin.html'), 'utf8').replace(/<script[\s\S]*?<\/script>/g, '').replace('</body>', `<script>document.body.classList.remove('admin-loading','admin-locked'); document.body.classList.add('admin-unlocked');
const w = document.createElement('div'); w.id = '__fb'; w.style.cssText = 'padding:14px;background:#0b0f1d;max-width:1100px'; w.innerHTML = ${JSON.stringify(html)}; document.body.appendChild(w);
const p = w.querySelector('[data-tab-panel]'); p.style.display = 'block'; document.querySelectorAll('body > *:not(#__fb):not(script)').forEach((e) => { e.style.display = 'none'; });</script></body>`);
const archivo = path.join(raiz, '__fbk.html'); fs.writeFileSync(archivo, pagina);
const srv = http.createServer((req, res) => { const f = path.join(raiz, decodeURIComponent(req.url.split('?')[0])); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': f.endsWith('.css') ? 'text/css' : 'text/html' }); fs.createReadStream(f).pipe(res); }).listen(0);
const nav = await chromium.launch();
try {
  const p = await nav.newPage({ viewport: { width: ancho, height: 900 } });
  await p.goto(`http://localhost:${srv.address().port}/__fbk.html`);
  const m = await p.evaluate(() => ({ fila: Math.round(document.querySelector('#__fb .met-user-row-v2').getBoundingClientRect().height), filas: document.querySelectorAll('#__fb .met-user-row-v2').length }));
  console.log('alto de cada fila:', m.fila, 'px (' + m.filas + ' filas)');
  await p.locator('#__fb').screenshot({ path: path.join(out, 'feedback.png') });
} finally { await nav.close(); srv.close(); fs.unlinkSync(archivo); }
