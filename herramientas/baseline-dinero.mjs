// CANDADO DE DINERO — solo LECTURA. No escribe nada en Firestore.
// Saca una "foto" de todo el dinero registrado (cierres, gastos, traslados, ajustes, caja chica) y calcula
// los totales con sumas simples e independientes del panel, más una HUELLA (sha256) de cada colección.
//
// Uso:   node herramientas/baseline-dinero.mjs            → escribe herramientas/baseline-dinero/dinero-AAAA-MM-DD-HHMM.json
//        node herramientas/baseline-dinero.mjs comparar A.json B.json  → compara dos fotos y avisa qué cambió
//
// Cuándo correrlo: ANTES de cada fase de la reorganización y DESPUÉS. Si la huella de cierres_caja y gastos_caja
// es igual, ningún documento de historial cambió. Si los totales por método son iguales, el dinero se mantuvo.
import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';

const PROJECT = 'roal-burger-menu';
const DIR = new URL('./baseline-dinero/', import.meta.url);

const sha = (o) => createHash('sha256').update(JSON.stringify(o)).digest('hex').slice(0, 16);
const suma = (m, k, v) => { if (k) m[k] = Math.round(((m[k] || 0) + Number(v || 0)) * 100) / 100; };
const totalDe = (m) => Object.values(m).reduce((s, v) => s + v, 0);

// Orden estable de claves: así la huella no cambia por el orden en que Firestore devuelva los campos.
const canon = (v) => Array.isArray(v) ? v.map(canon)
  : (v && typeof v === 'object') ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, canon(v[k])])) : v;

if (process.argv[2] === 'comparar') {
  const [a, b] = [process.argv[3], process.argv[4]].map((f) => JSON.parse(readFileSync(f, 'utf8')));
  let difs = 0;
  const cmp = (ruta, x, y) => {
    if (x && y && typeof x === 'object' && typeof y === 'object') {
      for (const k of new Set([...Object.keys(x), ...Object.keys(y)])) cmp(`${ruta}.${k}`, x[k], y[k]);
    } else if (x !== y) { difs++; console.log(`  CAMBIÓ ${ruta}: ${x} → ${y}`); }
  };
  cmp('huellas', a.huellas, b.huellas); cmp('conteos', a.conteos, b.conteos); cmp('totales', a.totales, b.totales);
  console.log(difs ? `\n❌ ${difs} diferencia(s). Revisa cada una antes de seguir.` : '\n✅ Idéntico: el historial y los totales no cambiaron.');
  process.exit(difs ? 1 : 0);
}

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
const base = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;
async function coleccion(col) {
  const r = await fetch(`${base}:runQuery`, { method: 'POST', headers: H, body: JSON.stringify({ structuredQuery: { from: [{ collectionId: col }] } }) });
  if (!r.ok) throw new Error(`${col} ${r.status} ${(await r.text()).slice(0, 200)}`);
  return (await r.json()).filter((x) => x.document)
    .map((x) => ({ id: x.document.name.split('/').pop(), ...dec({ mapValue: { fields: x.document.fields } }) }))
    .sort((p, q) => (p.id < q.id ? -1 : 1));
}
async function documento(ruta) {
  const r = await fetch(`${base}/${ruta}`, { headers: H });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`${ruta} ${r.status}`);
  const j = await r.json();
  return dec({ mapValue: { fields: j.fields || {} } });
}

const [cierres, gastos, cajaChica, estadoCaja, metodosPago] = await Promise.all([
  coleccion('cierres_caja'), coleccion('gastos_caja'),
  documento('admin_estado/caja_chica_actual'), documento('configuracion/estado_caja'),
  documento('configuracion/metodos_pago')
]);

// ── Totales con sumas simples (sin la lógica del panel) ──
const porTipo = { caja: [], externo: [], traslado: [], ajuste: [], otros: [] };
gastos.forEach((g) => (porTipo[g.tipo] || porTipo.otros).push(g));

const cierresMetodo = {}, cierresIng = {}, cierresGas = {};
let grandTotal = 0, ingresosTotal = 0, gastosTotal = 0, descuadreCierres = 0;
const cierresConDescuadre = [];
cierres.forEach((c) => {
  Object.entries(c.methodTotals || {}).forEach(([k, v]) => suma(cierresMetodo, k, v));
  Object.entries(c.ingresosMethod || c.methodTotals || {}).forEach(([k, v]) => suma(cierresIng, k, v));
  Object.entries(c.gastosMethod || {}).forEach(([k, v]) => suma(cierresGas, k, v));
  grandTotal += Number(c.grandTotal || 0);
  ingresosTotal += Number(c.ingresosTotal ?? c.grandTotal ?? 0);
  gastosTotal += Number(c.gastosTotal || 0);
  const dif = Math.round((Number(c.grandTotal || 0) - totalDe(c.methodTotals || {})) * 100) / 100;
  if (dif !== 0) { descuadreCierres += dif; cierresConDescuadre.push({ id: c.id, diferencia: dif }); }
});
const externosMetodo = {}, trasladosNeto = {}, ajustesMetodo = {};
porTipo.externo.forEach((g) => suma(externosMetodo, g.paymentMethod, g.monto));
porTipo.traslado.forEach((t) => { suma(trasladosNeto, t.methodFrom, -Number(t.monto || 0)); suma(trasladosNeto, t.methodTo, Number(t.monto || 0)); });
porTipo.ajuste.forEach((a) => Object.entries(a.porMetodo || {}).forEach(([k, v]) => suma(ajustesMetodo, k, v)));

const sumaExternos = totalDe(externosMetodo), sumaAjustes = totalDe(ajustesMetodo);
const foto = {
  generado: new Date().toISOString(),
  conteos: {
    cierres_caja: cierres.length,
    gastos_caja_total: gastos.length,
    gastos_caja_por_tipo: Object.fromEntries(Object.entries(porTipo).map(([k, v]) => [k, v.length]))
  },
  huellas: {
    cierres_caja: sha(canon(cierres)),
    gastos_caja: sha(canon(gastos)),
    gastos_externos: sha(canon(porTipo.externo)),
    traslados: sha(canon(porTipo.traslado)),
    ajustes: sha(canon(porTipo.ajuste)),
    caja_chica_actual: sha(canon(cajaChica)),
    estado_caja: sha(canon(estadoCaja))
  },
  totales: {
    cierres_methodTotals_por_metodo: cierresMetodo,
    cierres_ingresos_por_metodo: cierresIng,
    cierres_gastos_por_metodo: cierresGas,
    cierres_grandTotal: grandTotal,
    cierres_ingresosTotal: ingresosTotal,
    cierres_gastosTotal: gastosTotal,
    gastos_externos_por_metodo: externosMetodo,
    gastos_externos_total: sumaExternos,
    traslados_neto_por_metodo: trasladosNeto,
    ajustes_por_metodo: ajustesMetodo,
    ajustes_total: sumaAjustes,
    // Lo que debería mostrar cada pantalla si todo fuera coherente:
    saldo_total_estilo_Historial: grandTotal - sumaExternos + sumaAjustes,
    saldo_total_estilo_LibroContable: ingresosTotal - gastosTotal - sumaExternos,
    // Si estas dos no coinciden, ya hay una diferencia HOY entre las dos pantallas (anótala antes de reorganizar):
    diferencia_entre_pantallas: (grandTotal - sumaExternos + sumaAjustes) - (ingresosTotal - gastosTotal - sumaExternos),
    descuadre_interno_de_cierres: descuadreCierres,
    caja_chica_total_guardado: cajaChica?.total ?? null
  },
  cierres_con_descuadre_interno: cierresConDescuadre
};

mkdirSync(DIR, { recursive: true });
const t = new Date();
const nombre = `dinero-${t.toISOString().slice(0, 10)}-${String(t.getHours()).padStart(2, '0')}${String(t.getMinutes()).padStart(2, '0')}.json`;
writeFileSync(new URL(nombre, DIR), JSON.stringify(foto, null, 2));
// Documentos crudos para las pruebas automáticas (golden master). Carpeta ignorada por git: son datos reales.
writeFileSync(new URL('crudo-ultimo.json', DIR), JSON.stringify({ generado: foto.generado, cierres, gastos, metodos: (metodosPago && metodosPago.methods) || null }));

const m = (n) => '$' + Math.round(n).toLocaleString('es-CO');
console.log(`\n=== FOTO DEL DINERO (${foto.generado}) ===`);
console.log(`Cierres: ${cierres.length} | Gastos/movimientos: ${gastos.length}`, foto.conteos.gastos_caja_por_tipo);
console.log('\nSaldo por método según los cierres:');
Object.entries(cierresMetodo).forEach(([k, v]) => console.log(`  ${k.padEnd(16)} ${m(v)}`));
console.log(`\nSaldo total estilo Historial de Cajas : ${m(foto.totales.saldo_total_estilo_Historial)}`);
console.log(`Total neto estilo Libro Contable      : ${m(foto.totales.saldo_total_estilo_LibroContable)}`);
console.log(`Diferencia hoy entre esas dos pantallas: ${m(foto.totales.diferencia_entre_pantallas)}  (ajustes ${m(sumaAjustes)})`);
console.log(`Cierres con descuadre interno: ${cierresConDescuadre.length} (${m(descuadreCierres)})`);
console.log('\nHuellas:', foto.huellas);
console.log(`\nGuardado en herramientas/baseline-dinero/${nombre}`);
