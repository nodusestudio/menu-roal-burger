#!/usr/bin/env node
/**
 * resync-cupones-publicos.js — deja al día cupones_campanas_publico/{id} para TODAS las campañas
 * de Fuera del Menú.
 *
 * Para qué: el trigger syncCampanaPublica (functions/cuponPana.js) solo corre cuando una campaña
 * se escribe. Cuando cambia QUÉ se copia a la vista pública (ej. 2026-10-04: la variante de cada
 * renglón de la composición), las campañas que nadie vuelva a guardar quedarían con la vista
 * vieja. Correr esto una vez después de desplegar syncCampanaPublica las deja al día.
 *
 * Dos modos (los dos sin --apply solo listan, no escriben):
 *
 *   node scripts/resync-cupones-publicos.js --via-trigger [--apply]
 *     Con la cuenta ACTIVA de gcloud (`gcloud auth print-access-token`, la misma que despliega).
 *     Hace una "actualización sin cambios" de cada campaña: solo escribe la marca
 *     vistaResincronizadaAt en cupones_campanas/{id}. Eso dispara el trigger REAL desplegado,
 *     que reconstruye la vista pública en el servidor. No toca ningún otro campo ni ningún cupón.
 *
 *   node scripts/resync-cupones-publicos.js [--apply]
 *     Con Admin SDK y credenciales por defecto (`gcloud auth application-default login` con una
 *     cuenta del proyecto): llama directo a syncCampanaPublica de functions/cuponPana.js.
 */
'use strict';

const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ID = 'roal-burger-menu';
const FUNCTIONS_DIR = path.join(__dirname, '..', 'functions');
const APPLY = process.argv.includes('--apply');
const VIA_TRIGGER = process.argv.includes('--via-trigger');
const DOCS_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

async function viaTrigger() {
    const token = execSync('gcloud auth print-access-token', { encoding: 'utf8' }).trim();
    const headers = { Authorization: `Bearer ${token}`, 'x-goog-user-project': PROJECT_ID, 'Content-Type': 'application/json' };
    const list = await fetch(`${DOCS_URL}/cupones_campanas?pageSize=300&mask.fieldPaths=titulo`, { headers }).then((r) => r.json());
    if (list.error) throw new Error(list.error.message);
    const docs = list.documents || [];
    console.log(`${docs.length} campaña(s). Modo: trigger desplegado · ${APPLY ? 'ESCRIBIR' : 'solo listar (usa --apply)'}`);
    for (const d of docs) {
        const id = d.name.split('/').pop();
        console.log(`- ${id} (${d.fields?.titulo?.stringValue || ''})`);
        if (!APPLY) continue;
        // currentDocument.exists=true: nunca crea una campaña nueva por error.
        const url = `${DOCS_URL}/cupones_campanas/${encodeURIComponent(id)}?updateMask.fieldPaths=vistaResincronizadaAt&currentDocument.exists=true`;
        const res = await fetch(url, { method: 'PATCH', headers, body: JSON.stringify({ fields: { vistaResincronizadaAt: { timestampValue: new Date().toISOString() } } }) });
        if (!res.ok) throw new Error(`${id}: ${(await res.json()).error?.message || res.status}`);
    }
    console.log(APPLY ? 'Listo: el trigger syncCampanaPublica reconstruye cada vista pública en unos segundos.' : 'Nada escrito.');
}

async function viaAdminSdk() {
    const { initializeApp, applicationDefault } = require(require.resolve('firebase-admin/app', { paths: [FUNCTIONS_DIR] }));
    const { getFirestore } = require(require.resolve('firebase-admin/firestore', { paths: [FUNCTIONS_DIR] }));
    initializeApp({ credential: applicationDefault(), projectId: PROJECT_ID });
    const cuponPana = require(path.join(FUNCTIONS_DIR, 'cuponPana.js'));
    const db = getFirestore();
    const snap = await db.collection(cuponPana.CUPONES_CAMPANAS_COLLECTION).get();
    console.log(`${snap.size} campaña(s). Modo: Admin SDK · ${APPLY ? 'ESCRIBIR' : 'solo listar (usa --apply)'}`);
    for (const doc of snap.docs) {
        console.log(`- ${doc.id} · composición → ${JSON.stringify(cuponPana.buildCampanaPublica(doc.data()).composicion)}`);
        if (APPLY) await cuponPana.syncCampanaPublica(db, doc.id);
    }
    console.log(APPLY ? 'Listo: vistas públicas reescritas.' : 'Nada escrito.');
}

(VIA_TRIGGER ? viaTrigger() : viaAdminSdk())
    // exitCode (no process.exit): en Windows, cortar con conexiones de fetch abiertas dispara un assert de libuv.
    .catch((err) => { console.error('Error:', err.message || err); process.exitCode = 1; });
