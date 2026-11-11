// Solo LECTURA. Compara un cierre de caja con los pedidos de su jornada, pedido por pedido.
// Uso:  node herramientas/auditar-cierre.mjs cierre_2026-07-31_1785467150802 [cierre_...]
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const PROJECT = 'roal-burger-menu';
const token = execSync('gcloud auth print-access-token --account=nodusestudio@gmail.com', { encoding: 'utf8', shell: true }).trim();
const H = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
const dec = (v) => {
  if (v == null) return null;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('timestampValue' in v) return Date.parse(v.timestampValue);
  if ('nullValue' in v) return null;
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(dec);
  if ('mapValue' in v) return Object.fromEntries(Object.entries(v.mapValue.fields || {}).map(([k, x]) => [k, dec(x)]));
  return null;
};
const doc = (x) => ({ id: x.name.split('/').pop(), ...dec({ mapValue: { fields: x.fields } }) });
const money = (n) => (n < 0 ? '−' : '') + '$' + Math.abs(Math.round(n)).toLocaleString('es-CO');
const hora = (ms) => new Date(ms).toLocaleString('es-CO', { timeZone: 'America/Bogota', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
const ms = (t) => (typeof t === 'number' ? t : 0);

async function porCreado(col, desde, hasta) {
  const r = await fetch(`https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents:runQuery`, {
    method: 'POST', headers: H,
    body: JSON.stringify({ structuredQuery: { from: [{ collectionId: col }], where: { compositeFilter: { op: 'AND', filters: [
      { fieldFilter: { field: { fieldPath: 'createdAt' }, op: 'GREATER_THAN_OR_EQUAL', value: { timestampValue: new Date(desde).toISOString() } } },
      { fieldFilter: { field: { fieldPath: 'createdAt' }, op: 'LESS_THAN_OR_EQUAL', value: { timestampValue: new Date(hasta).toISOString() } } }] } }, limit: 500 } }),
  });
  if (!r.ok) throw new Error(col + ' ' + r.status + ' ' + (await r.text()).slice(0, 200));
  return (await r.json()).filter((x) => x.document).map((x) => doc(x.document));
}
async function porId(col, id) {
  const r = await fetch(`https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/${col}/${id}`, { headers: H });
  return r.ok ? doc(await r.json()) : null;
}

for (const id of process.argv.slice(2)) {
  const c = await porId('cierres_caja', id);
  if (!c) { console.log('No existe', id); continue; }
  const ap = ms(c.aperturaAt), cl = ms(c.closedAt);
  console.log(`\n══ ${id} ══\nAbierta ${hora(ap)} → cerrada ${hora(cl)} · fondo ${money(c.fondoInicial)} · ${c.transactionCount} transacciones`);
  console.log(`Cierre dice: ingresos ${money(c.ingresosTotal)} (${Object.entries(c.ingresosMethod || {}).map(([k, v]) => k + ' ' + money(v)).join(', ')}) · gastos ${money(c.gastosTotal)} · neto ${money(c.grandTotal)}`);
  const [a, b] = await Promise.all([porCreado('pedidos_archivados', ap - 3 * 86400000, cl + 86400000), porCreado('pedidos', ap - 3 * 86400000, cl + 86400000)]);
  const mapa = new Map(); [...a, ...b].forEach((o) => mapa.set(o.id, o));
  const todos = [...mapa.values()];
  const cobro = (o) => ms(o.paidAt) || ms(o.deliveredAt) || ms(o.createdAt);
  const enVentana = todos.filter((o) => { const t = cobro(o); return t >= ap && t <= cl + 120000; }).sort((x, y) => cobro(x) - cobro(y));
  let suma = 0; const porM = {};
  console.log('\nPedidos cobrados en la ventana de la jornada:');
  for (const o of enVentana) {
    const pago = o.paymentMethod === 'split' ? 'split ' + (o.paymentSplit || []).map((s) => s.method + ' ' + s.amount).join('+') : o.paymentMethod;
    const marca = [o.voided || o.anulado ? 'ANULADO' : '', o.paymentStatus && o.paymentStatus !== 'pagado' ? 'pago:' + o.paymentStatus : '', o.status || o.estado || ''].filter(Boolean).join(' ');
    const val = Number(o.total || 0);
    if (!(o.voided || o.anulado)) { suma += val; porM[o.paymentMethod] = (porM[o.paymentMethod] || 0) + val; }
    console.log(`  ${hora(cobro(o))}  ${String(o.code || o.id).padEnd(12)} ${money(val).padStart(10)}  ${String(pago).padEnd(34)} ${marca}`);
  }
  console.log(`\nSuma de pedidos no anulados: ${money(suma)} (${Object.entries(porM).map(([k, v]) => k + ' ' + money(v)).join(', ')})  [${enVentana.length} pedidos]`);
  console.log(`Diferencia pedidos − cierre: ${money(suma - Number(c.ingresosTotal || 0))}`);
  // pedidos cercanos a la ventana (por si alguno se cobró justo fuera)
  const cerca = todos.filter((o) => { const t = cobro(o); return (t < ap && t >= ap - 3 * 3600000) || (t > cl + 120000 && t <= cl + 6 * 3600000); });
  if (cerca.length) { console.log('\nPedidos cobrados justo ANTES de abrir o DESPUÉS de cerrar (±3–6 h):'); cerca.forEach((o) => console.log(`  ${hora(cobro(o))}  ${String(o.code || o.id).padEnd(12)} ${money(Number(o.total || 0)).padStart(10)}  ${o.paymentMethod}`)); }
}
