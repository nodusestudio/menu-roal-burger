// Navegador real: todos los botones de las distintas familias miden y se ven igual (alto, relleno, radio, tipografía), y Configuración es compacta.
//   node tests/regla-interfaz.e2e.mjs
import fs from 'node:fs'; import http from 'node:http'; import path from 'node:path'; import { fileURLToPath } from 'node:url'; import { chromium } from 'playwright';
const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const pagina = fs.readFileSync(path.join(raiz, 'admin.html'), 'utf8').replace(/<script[\s\S]*?<\/script>/g, '').replace('</body>', `<script>
document.body.classList.remove('admin-loading','admin-locked'); document.body.classList.add('admin-unlocked');
const p = document.querySelector('[data-section-panel="negocio"][data-section-scope="configuracion"]'); let n = p; while (n && n !== document.body) { n.hidden = false; n.style.display = ''; if (getComputedStyle(n).display === 'none') n.style.display = 'block'; n = n.parentElement; }
const caja = document.createElement('div'); caja.id = 'banco'; caja.setAttribute('data-section-scope', 'configuracion');
caja.innerHTML = ['informes-action-btn','informes-action-btn informes-action-btn--primary','informes-action-btn informes-action-btn--danger-solid','section-action-btn','section-action-btn primary','admin-button','ghost-button','biz-save-btn','biz-pass-btn','cat-new-save-btn','ticket-bt-btn','mesero-action-btn','mesero-action-btn mesero-action-btn--del','cat-sub-add-btn','ticket-action-btn','pos-note-cancel-btn','pos-note-save-btn','client-action-btn','cd-btn']
  .map((c) => '<button type="button" class="' + c + '" data-fam="' + c + '">Acción</button>').join('');
p.appendChild(caja);
</script></body>`);
const archivo = path.join(raiz, '__ri.html'); fs.writeFileSync(archivo, pagina);
const srv = http.createServer((req, res) => { const f = path.join(raiz, decodeURIComponent(req.url.split('?')[0])); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': f.endsWith('.css') ? 'text/css' : 'text/html' }); fs.createReadStream(f).pipe(res); }).listen(0);
const res = []; const ok = (c, m) => res.push(`${c ? '✅' : '❌'} ${m}`);
const nav = await chromium.launch();
try {
  const p = await nav.newPage({ viewport: { width: 1200, height: 800 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(`http://localhost:${srv.address().port}/__ri.html`);
  const m = await p.evaluate(() => [...document.querySelectorAll('#banco button')].map((b) => { const c = getComputedStyle(b); const r = b.getBoundingClientRect(); return { f: b.dataset.fam, h: Math.round(r.height), pad: c.paddingLeft + '/' + c.paddingRight, rad: c.borderTopLeftRadius, fs: c.fontSize, fw: c.fontWeight, ff: c.fontFamily.split(',')[0], tt: c.textTransform }; }));
  const uniq = (k) => [...new Set(m.map((x) => x[k]))];
  ok(uniq('h').length === 1 && uniq('h')[0] === 32, `los ${m.length} botones de todas las familias miden lo mismo: alto ${uniq('h').join(',')} px`);
  ok(uniq('pad').length === 1 && uniq('rad').length === 1 && uniq('fs').length === 1 && uniq('fw').length === 1 && uniq('ff').length === 1 && uniq('tt').length === 1, `mismo relleno (${uniq('pad')}), radio (${uniq('rad')}), tamaño (${uniq('fs')}), grosor (${uniq('fw')}) y tipografía`);
  const col = await p.evaluate(() => { const g = (s) => getComputedStyle(document.querySelector(`#banco [data-fam="${s}"]`)).backgroundImage !== 'none'; return { a: g('admin-button'), b: g('biz-save-btn'), c: g('cat-new-save-btn'), d: g('section-action-btn primary'), e: g('informes-action-btn informes-action-btn--primary'), s: g('ghost-button'), s2: g('biz-pass-btn') }; });
  ok(col.a && col.b && col.c && col.d && col.e && !col.s && !col.s2, 'los botones de guardar son todos del rol principal (naranja) y los demás secundarios');
  const card = await p.evaluate(() => { const c = getComputedStyle(document.querySelector('[data-section-scope="configuracion"] .admin-card')); const f = document.querySelector('[data-section-scope="configuracion"] .admin-field input'); return { pad: c.paddingTop, h: Math.round(f.getBoundingClientRect().height) }; });
  ok(card.pad === '14px', 'las tarjetas de Configuración usan el relleno de 14 px (' + card.pad + ')');
  ok(card.h <= 36, `los campos son compactos (alto ${card.h} px)`);
  const alto = await p.evaluate(() => Math.round(document.querySelector('#brandingForm').getBoundingClientRect().height));
  ok(alto < 650, `la pestaña Negocio cabe sin tanto desplazamiento (formulario de ${alto} px; antes ~900)`);
  const fuera = await p.evaluate(() => { const c = [...document.querySelectorAll('.admin-card')].find((x) => !x.closest('[data-section-scope="configuracion"]')); return c ? getComputedStyle(c).paddingTop : 'sin tarjeta'; });
  ok(fuera === '14px', 'las tarjetas de las demás secciones también usan el relleno de 14 px (' + fuera + ')');
  const mini = await p.evaluate(() => { const b = document.createElement('button'); b.className = 'mini-btn'; b.textContent = 'x'; document.body.appendChild(b); const r = b.getBoundingClientRect(); return Math.round(r.height); });
  ok(mini === 24, 'el botón compacto (tablas y listas) mide 24 px: un solo tamaño pequeño');
  await p.setViewportSize({ width: 1280, height: 900 });
  const geo = await p.evaluate(() => {
    const panel = document.querySelector('[data-section-panel="botones"][data-section-scope="configuracion"]'); let n = panel; while (n && n !== document.body) { n.hidden = false; if (getComputedStyle(n).display === 'none') n.style.display = 'block'; n = n.parentElement; }
    const L = document.getElementById('buttonConfigList');
    L.innerHTML = '<div class="list-item"><div class="product-main"><span>📱 VER NUESTRO MENU DIGITAL</span></div><div class="muted">btn-menu | Menu modal | neon | xl</div><span class="state-pill visible">Activo</span><button class="mini-btn">Editar</button><button class="mini-btn">Pausar</button><button class="mini-btn remove">Ocultar</button><button class="mini-btn remove">Eliminar</button></div>';
    const row = L.firstElementChild; const bs = [...row.querySelectorAll('button')].map((b) => b.getBoundingClientRect());
    const hp = document.querySelector('[data-section-panel="horario"][data-section-scope="configuracion"]'); let m = hp; while (m && m !== document.body) { m.hidden = false; if (getComputedStyle(m).display === 'none') m.style.display = 'block'; m = m.parentElement; }
    const card = hp.querySelector('.admin-card'); card.querySelector('.card-body').classList.add('collapsed');
    return { fila: Math.round(row.getBoundingClientRect().height), ancho: Math.max(...bs.map((b) => Math.round(b.width))), alto: Math.max(...bs.map((b) => Math.round(b.height))), retraida: Math.round(card.getBoundingClientRect().height) };
  });
  ok(geo.fila <= 44, `Menú público: cada botón de la lista es UNA fila compacta (${geo.fila} px), no un bloque de varias líneas`);
  ok(geo.ancho < 120 && geo.alto <= 26, `…con botones pequeños de ${geo.ancho}×${geo.alto} px (no ocupan todo el ancho), también en ventanas de 1280 px`);
  ok(geo.retraida <= 56, `una tarjeta retraída ocupa solo ${geo.retraida} px (antes ~90)`);
  const formas = await p.evaluate(() => {
    const radios = {}; const trans = new Set();
    document.querySelectorAll('button, [role="tab"], .menu-inner-tab').forEach((b) => { if (b.closest('#fodiFlot') || b.classList.contains('ff-b')) return; const c = getComputedStyle(b); radios[c.borderTopLeftRadius] = (radios[c.borderTopLeftRadius] || 0) + 1; trans.add(c.transitionDuration.split(',')[0]); });
    return { radios, trans: [...trans] };
  });
  const clavesR = Object.keys(formas.radios).sort();
  ok(clavesR.every((r) => r === '9px' || r === '14px'), 'FORMA ÚNICA: todos los botones y pestañas tienen radio 9 px (o 14 px las fichas grandes): ' + JSON.stringify(formas.radios));
  ok(formas.trans.length === 1 && formas.trans[0] === '0.15s', 'una sola velocidad de animación (' + formas.trans.join(',') + ')');
  const esp = await p.evaluate(() => {
    const hp = document.querySelector('[data-section-panel="horario"][data-section-scope="configuracion"]'); hp.classList.add('active'); hp.style.display = ''; hp.querySelectorAll('.card-body.collapsed').forEach((b) => b.classList.remove('collapsed'));
    const cs = getComputedStyle(hp); const cards = [...hp.querySelectorAll(':scope > .admin-card')];
    const sep = Math.round(cards[1].getBoundingClientRect().top - cards[0].getBoundingClientRect().bottom);
    return { sep, pad: cs.paddingTop, margen: getComputedStyle(cards[0]).marginBottom, cab: getComputedStyle(cards[0].querySelector('.card-head')).marginBottom };
  });
  ok(esp.sep === 12, 'MÁRGENES: entre tarjetas siempre 12 px (' + esp.sep + ' px), puestos por el contenedor, sin margen propio (' + esp.margen + ')');
  ok(esp.pad === '14px' && esp.cab === '8px', 'relleno de panel 14 px y 8 px entre título y contenido (' + esp.pad + ' / ' + esp.cab + ')');
  ok(errs.length === 0, 'sin errores de JavaScript' + (errs.length ? ': ' + errs.join(' | ') : ''));
} finally { await nav.close(); srv.close(); fs.unlinkSync(archivo); }
console.log(res.join('\n')); if (res.some((r) => r.startsWith('❌'))) process.exit(1);
