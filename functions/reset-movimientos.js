/**
 * reset-movimientos.js
 *
 * Reinicia SOLO las colecciones de movimientos, informes y métricas.
 * NO toca: clientes, proveedores, productos, categorías ni catálogo.
 *
 * Requiere: functions/serviceAccountKey.json (descargarlo desde Firebase Console)
 *
 * Uso:
 *   cd functions
 *   node reset-movimientos.js
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// ── Credenciales ──────────────────────────────────────────────────────────────
const KEY_PATH = path.join(__dirname, 'serviceAccountKey.json');

if (!fs.existsSync(KEY_PATH)) {
  console.error('\n❌  No se encontró serviceAccountKey.json en functions/');
  console.error('    → Ve a Firebase Console → Project Settings → Service Accounts');
  console.error('    → Clic en "Generate new private key"');
  console.error('    → Guarda el archivo como:  functions/serviceAccountKey.json');
  console.error('    → Vuelve a ejecutar este script.\n');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(require(KEY_PATH)),
  projectId: 'roal-burger-menu',
});

const db = admin.firestore();

// ── Colecciones a borrar completamente ───────────────────────────────────────
const CLEAR_COLLECTIONS = [
  'gastos_caja',    // movimientos de caja (egresos)
  'cierres_caja',   // arqueos / cierres de jornada
  'resumen_ventas', // resúmenes estadísticos por jornada
  'estadisticas',   // métricas generales
  'pos_tickets',    // tickets POS generados
];

// ── Helpers ───────────────────────────────────────────────────────────────────
async function deleteCollection(name) {
  const ref = db.collection(name);
  let total = 0;

  while (true) {
    const snap = await ref.limit(400).get();
    if (snap.empty) break;

    const batch = db.batch();
    snap.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    total += snap.size;

    if (snap.size < 400) break;
  }

  return total;
}

async function limpiarPedidos() {
  const ref = db.collection('pedidos');
  const META_ID = '_meta_order_sequence';
  let total = 0;

  while (true) {
    const snap = await ref.limit(400).get();
    if (snap.empty) break;

    const batch = db.batch();
    let count = 0;
    snap.docs.forEach(doc => {
      if (doc.id !== META_ID) {
        batch.delete(doc.ref);
        count++;
      }
    });

    if (count === 0) break; // Solo queda el meta doc
    await batch.commit();
    total += count;

    if (snap.size < 400) break;
  }

  // Resetear el contador de número de orden a 0
  await ref.doc(META_ID).set(
    { metaType: 'order_sequence', current: 0, updatedAt: admin.firestore.FieldValue.serverTimestamp() },
    { merge: false }
  );

  return total;
}

async function resetearJornada() {
  await db.collection('admin_estado').doc('jornada_ventas_actual').delete();
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n══════════════════════════════════════════════════════');
  console.log('   REINICIO DE MOVIMIENTOS, INFORMES Y MÉTRICAS');
  console.log('   Proyecto: roal-burger-menu');
  console.log('══════════════════════════════════════════════════════');
  console.log('');
  console.log('✅ SIN CAMBIOS EN: clientes · proveedores · productos');
  console.log('                   categorías · bebidas · combos · config');
  console.log('');

  try {
    // 1. Colecciones de informes/métricas
    for (const col of CLEAR_COLLECTIONS) {
      process.stdout.write(`  ⏳ ${col.padEnd(18)} → `);
      const n = await deleteCollection(col);
      console.log(`${n} docs eliminados`);
    }

    // 2. Pedidos de prueba + resetear contador
    process.stdout.write(`  ⏳ ${'pedidos'.padEnd(18)} → `);
    const nPedidos = await limpiarPedidos();
    console.log(`${nPedidos} pedidos eliminados · contador reseteado a 0`);

    // 3. Estado de jornada
    process.stdout.write(`  ⏳ ${'admin_estado'.padEnd(18)} → `);
    await resetearJornada();
    console.log('jornada_ventas_actual eliminado');

    console.log('');
    console.log('══════════════════════════════════════════════════════');
    console.log('   ✅  REINICIO COMPLETADO EXITOSAMENTE');
    console.log('   Todo listo para comenzar con ventas reales.');
    console.log('══════════════════════════════════════════════════════\n');

  } catch (err) {
    console.error('\n❌  Error durante el reinicio:', err.message);
    console.error(err);
    process.exit(1);
  }

  process.exit(0);
}

main();
