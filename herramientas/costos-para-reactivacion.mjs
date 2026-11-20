// Solo LECTURA. Muestra costos de carne, queso, papas y bebidas de la calculadora para definir los regalos de Reactivar.
// Uso:  node herramientas/costos-para-reactivacion.mjs
import { execSync } from 'node:child_process';

const PROJECT = 'roal-burger-menu';
const token = execSync('gcloud auth print-access-token --account=nodusestudio@gmail.com', { encoding: 'utf8', shell: true }).trim();

const dec = (v) => {
  if (v == null) return null;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('timestampValue' in v) return v.timestampValue;
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(dec);
  if ('mapValue' in v) return Object.fromEntries(Object.entries(v.mapValue.fields || {}).map(([k, x]) => [k, dec(x)]));
  return null;
};

async function lee(col) {
  const out = [];
  let pageToken = '';
  do {
    const r = await fetch(`https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/${col}?pageSize=300${pageToken ? '&pageToken=' + pageToken : ''}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!r.ok) throw new Error(col + ' ' + r.status + ' ' + (await r.text()).slice(0, 200));
    const j = await r.json();
    (j.documents || []).forEach((d) => out.push({ id: d.name.split('/').pop(), ...dec({ mapValue: { fields: d.fields } }) }));
    pageToken = j.nextPageToken || '';
  } while (pageToken);
  return out;
}

const re = /carne|queso|papa|bebida|postob|coca|hit|agua|malta|frescolita|golden|tocineta|pollo|chorizo|chuleta|salchicha|huevo|pan\b|doble/i;
for (const col of ['costos_insumos', 'costos_platos']) {
  const docs = (await lee(col)).filter((d) => re.test(String(d.nombre || d.name || d.id)));
  console.log(`\n=== ${col} (${docs.length}) ===`);
  docs.forEach((d) => {
    const nums = Object.entries(d).filter(([, v]) => typeof v === 'number').map(([k, v]) => `${k}=${Math.round(v * 100) / 100}`).join(' ');
    console.log(`${d.nombre || d.name || d.id} | ${nums}`);
  });
}
