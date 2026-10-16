#!/usr/bin/env node
/**
 * importar-costox.js — copia UNA VEZ los datos de CostoX (proyecto costox-52134) a las colecciones
 * costos_* de FODEXA (roal-burger-menu). Idempotente: usa el id original de CostoX como id del doc,
 * así que repetirlo solo actualiza (merge) y nunca duplica.
 *
 *   node scripts/importar-costox.js [volcado.json]            → SIMULA: lee CostoX, normaliza, imprime el resumen
 *                                                               y los 10 platos con más food cost. No escribe nada.
 *   node scripts/importar-costox.js [volcado.json] --apply    → ESCRIBE en roal-burger-menu.
 *
 * Sin volcado.json lo descarga de CostoX con la cuenta ACTIVA de gcloud (header x-goog-user-project:
 * nodus-marketing). Escribir en FODEXA usa el token de nodusestudio@gmail.com (--account), vía REST.
 * Colecciones: costos_insumos, costos_recetas, costos_platos, costos_promos, costos_categorias y el doc
 * costos_ajustes/config (colchón y margen objetivo). Todas solo-admin en firestore.rules.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { normalizarCostoX } = require(path.join(__dirname, '..', 'functions', 'costosImport.js'));
const { calcularPlatos } = require(path.join(__dirname, '..', 'functions', 'costos.js'));

const DEST = 'roal-burger-menu';
const ORIGEN = 'costox-52134';
const APPLY = process.argv.includes('--apply');
const archivo = process.argv.slice(2).find((a) => !a.startsWith('--'));
// Dos cuentas de gcloud: la que lee CostoX (la activa, dueña de ese proyecto) y la que escribe en FODEXA.
const CUENTA_DESTINO = 'nodusestudio@gmail.com';
const token = (cuenta) => execSync('gcloud auth print-access-token' + (cuenta ? ' --account=' + cuenta : ''), { encoding: 'utf8' }).trim();

const dec = (v) => {
    if ('stringValue' in v) return v.stringValue;
    if ('integerValue' in v) return Number(v.integerValue);
    if ('doubleValue' in v) return v.doubleValue;
    if ('booleanValue' in v) return v.booleanValue;
    if ('nullValue' in v) return null;
    if ('timestampValue' in v) return v.timestampValue;
    if ('arrayValue' in v) return (v.arrayValue.values || []).map(dec);
    if ('mapValue' in v) return Object.fromEntries(Object.entries(v.mapValue.fields || {}).map(([k, x]) => [k, dec(x)]));
    return v;
};
const enc = (v) => {
    if (v === null || v === undefined) return { nullValue: null };
    if (typeof v === 'string') return { stringValue: v };
    if (typeof v === 'boolean') return { booleanValue: v };
    if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
    if (Array.isArray(v)) return { arrayValue: { values: v.map(enc) } };
    return { mapValue: { fields: Object.fromEntries(Object.entries(v).map(([k, x]) => [k, enc(x)])) } };
};

async function descargarCostoX() {
    const H = { Authorization: `Bearer ${token()}`, 'x-goog-user-project': 'nodus-marketing' };
    const base = `https://firestore.googleapis.com/v1/projects/${ORIGEN}/databases/(default)/documents`;
    const out = {};
    for (const c of ['categories', 'categoriesProducts', 'categoriesPromotions', 'categoriesRecipes', 'config', 'ingredients', 'products', 'promotions', 'recipes']) {
        out[c] = []; let tok = '';
        do {
            const r = await (await fetch(`${base}/${c}?pageSize=300${tok ? '&pageToken=' + tok : ''}`, { headers: H })).json();
            if (r.error) throw new Error(`${c}: ${r.error.message}`);
            for (const d of r.documents || []) out[c].push({ id: d.name.split('/').pop(), ...Object.fromEntries(Object.entries(d.fields || {}).map(([k, v]) => [k, dec(v)])) });
            tok = r.nextPageToken || '';
        } while (tok);
    }
    return out;
}

async function escribir(coleccion, id, datos, H) {
    const url = `https://firestore.googleapis.com/v1/projects/${DEST}/databases/(default)/documents/${coleccion}/${encodeURIComponent(id)}`;
    const campos = { ...datos, importadoAt: new Date().toISOString() };
    const mask = Object.keys(campos).map((k) => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join('&');
    const res = await fetch(`${url}?${mask}`, { method: 'PATCH', headers: H, body: JSON.stringify({ fields: Object.fromEntries(Object.entries(campos).map(([k, v]) => [k, enc(v)])) }) });
    if (!res.ok) throw new Error(`${coleccion}/${id}: ${(await res.json()).error?.message || res.status}`);
}

(async () => {
    const volcado = archivo ? JSON.parse(fs.readFileSync(archivo, 'utf8')) : await descargarCostoX();
    const n = normalizarCostoX(volcado);
    console.log(`Origen: ${archivo || 'CostoX en vivo'} · Destino: ${DEST} · ${APPLY ? 'ESCRIBIR' : 'SIMULACIÓN (usa --apply para escribir)'}`);
    console.log(`insumos ${n.insumos.length} · recetas ${n.recetas.length} · platos ${n.platos.length} · promos ${n.promos.length} · categorías ${n.categorias.length}`);
    console.log(`config: colchón ${n.config.colchonPct}% · margen objetivo ${n.config.margenObjetivoPct}%`);
    if (n.avisos.length) { console.log(`\n${n.avisos.length} aviso(s) de datos:`); n.avisos.forEach((a) => console.log(' - ' + a)); }
    const calc = calcularPlatos(n, n.config);
    console.log('\nTop 10 food cost (con colchón → real):');
    calc.filter((f) => f.fc_pct).sort((a, b) => b.fc_pct - a.fc_pct).slice(0, 10).forEach((f) => console.log(` ${f.plato.padEnd(40)} ${String(f.fc_pct).padStart(5)}% → ${f.fc_real_pct}%  (precio ${f.precio})`));
    if (!APPLY) { console.log('\nNada escrito.'); return; }

    const H = { Authorization: `Bearer ${token(CUENTA_DESTINO)}`, 'x-goog-user-project': DEST, 'Content-Type': 'application/json' };
    const grupos = [['costos_insumos', n.insumos], ['costos_recetas', n.recetas], ['costos_platos', n.platos], ['costos_promos', n.promos], ['costos_categorias', n.categorias]];
    for (const [col, docs] of grupos) {
        for (const { id, ...datos } of docs) await escribir(col, id, datos, H);
        console.log(`✔ ${col}: ${docs.length}`);
    }
    await escribir('costos_ajustes', 'config', n.config, H);
    console.log('✔ costos_ajustes/config');
})().catch((err) => { console.error('Error:', err.message || err); process.exitCode = 1; });
