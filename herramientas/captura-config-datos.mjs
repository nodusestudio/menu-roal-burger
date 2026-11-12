// Dibuja las listas de Configuración con las funciones REALES del admin y datos de muestra, y saca capturas a un ancho dado.
//   node herramientas/captura-config-datos.mjs <carpeta> [ancho=1280]
import fs from 'node:fs'; import http from 'node:http'; import path from 'node:path'; import { fileURLToPath } from 'node:url'; import { chromium } from 'playwright';
const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = process.argv[2] || path.join(raiz, 'herramientas', 'capturas-config'); fs.mkdirSync(out, { recursive: true });
const ancho = +(process.argv[3] || 1280);
const js = fs.readFileSync(path.join(raiz, 'src/js/admin.js'), 'utf8');
const funcion = (nombre) => { const ini = js.indexOf(`function ${nombre}(`); if (ini < 0) throw new Error('no está ' + nombre); const m = /\r?\n}\r?\n/.exec(js.slice(ini)); return js.slice(ini, ini + m.index + m[0].length); };
const codigo = ['renderPaymentConfigPanel', 'renderBarriosEspecialesPanel', 'renderMeserosPanel', 'renderCategoriasGastosPanel'].map(funcion).join('\n');
const pagina = fs.readFileSync(path.join(raiz, 'admin.html'), 'utf8').replace(/<script[\s\S]*?<\/script>/g, '').replace('</body>', `<script>
document.body.classList.remove('admin-loading','admin-locked'); document.body.classList.add('admin-unlocked');
const escapeHtml = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const formatMoney = (v) => '$ ' + Number(v || 0).toLocaleString('es-CO');
const _PM_SUB_LABELS = { transferencia: 'Transferencia', tarjeta: 'Tarjeta' };
const _PM_VISIBILITY_LABELS = { ambos: 'POS y menú', pos: 'Solo POS', menu: 'Solo menú' };
const getPaymentMethods = () => [
  { id: 'efectivo', label: 'Efectivo', icon: '💵', subs: [], enabled: true, visibility: 'ambos' },
  { id: 'bancolombia', label: 'Bancolombia/Breve', icon: '🏦', subs: ['transferencia'], enabled: true, visibility: 'ambos' },
  { id: 'nequi', label: 'Nequi', icon: '💜', subs: ['transferencia'], enabled: true, visibility: 'pos' },
  { id: 'bold', label: 'Bold', icon: '💳', subs: ['tarjeta'], enabled: false, visibility: 'pos' }];
const _barriosEspeciales = [{ nombre: 'Cañas Gordas', tarifa: 9000, activo: true }, { nombre: 'La Isabela', tarifa: 12000, activo: false }];
const _meserosState = [{ token: 'abc123', nombre: 'Laura', apellido: 'Gómez', celular: '3001234567', pinSet: true }, { token: 'def456', nombre: 'Carlos', apellido: '', celular: '', pinSet: false }];
const _buildMeseroLink = (t) => 'https://www.roalburger.com/?mesero=' + t + '-un-codigo-largo-de-ejemplo';
const getCategoriasGastos = () => [{ id: 'insumos', icon: '🥩', nombre: 'Insumos', subs: ['Carne', 'Pan', 'Salsas'] }, { id: 'servicios', icon: '💡', nombre: 'Servicios', subs: [] }, { id: 'otros', icon: '📦', nombre: 'Otros', subs: ['Varios'] }];
let _catGastosPanelBound = false;
const showNotice = () => {}, showConfirmModal = async () => true, copyTextToClipboard = async () => {}, normalizePhoneDigits = (x) => x, buildWhatsAppUrl = () => '', _pmSaveAndRefresh = async () => {}, _pmOpenForm = () => {}, deleteMesero = async () => {}, loadMeseros = async () => {}, _pmFormSave = () => {};
var _beFormSave, _beFormCancel, _beOpenForm, _pmFormCancel, _beSaveAndRefresh, _beGuardar, _catGuardar;
${codigo}
renderPaymentConfigPanel(); renderBarriosEspecialesPanel(); renderMeserosPanel(); renderCategoriasGastosPanel();
window.mostrar = (id) => { document.querySelectorAll('.menu-inner-panel').forEach((p) => { const on = p.dataset.sectionPanel === id && p.dataset.sectionScope === 'configuracion'; p.hidden = !on; p.style.display = on ? '' : 'none'; p.classList.toggle('active', on); });
  const el = document.querySelector('[data-section-panel="' + id + '"][data-section-scope="configuracion"]'); let n = el; while (n && n !== document.body) { n.hidden = false; if (getComputedStyle(n).display === 'none') n.style.display = 'block'; n = n.parentElement; } el.style.display = ''; el.classList.add('active'); };
</script></body>`);
const archivo = path.join(raiz, '__ccd.html'); fs.writeFileSync(archivo, pagina);
const srv = http.createServer((req, res) => { const f = path.join(raiz, decodeURIComponent(req.url.split('?')[0])); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': f.endsWith('.css') ? 'text/css' : 'text/html' }); fs.createReadStream(f).pipe(res); }).listen(0);
const nav = await chromium.launch();
try {
  const p = await nav.newPage({ viewport: { width: ancho, height: 900 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(`http://localhost:${srv.address().port}/__ccd.html`);
  if (errs.length) console.log('ERRORES DE PÁGINA:', errs.join(' | '));
  for (const id of ['metodos_pago', 'barrios_especiales', 'meseros', 'categorias_gastos']) {
    await p.evaluate((i) => window.mostrar(i), id);
    await p.locator(`[data-section-panel="${id}"][data-section-scope="configuracion"]`).screenshot({ path: path.join(out, `datos-${id}.png`) });
  }
  if (errs.length) console.log('ERRORES:', errs.join(' | ')); else console.log('ok');
} finally { await nav.close(); srv.close(); fs.unlinkSync(archivo); }
