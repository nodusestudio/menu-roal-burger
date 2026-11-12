/**
 * reset-movimientos.js   —   ⚠️  BORRA el historial de dinero de PRODUCCIÓN
 *
 * Reinicia SOLO las colecciones de movimientos, informes y métricas (cierres de caja, gastos, tickets, pedidos…).
 * NO toca: clientes, proveedores, productos, categorías ni catálogo.
 *
 * SEGURIDAD (el negocio ya vende de verdad: los totales y historiales son intocables):
 *   · Por defecto NO borra nada: solo muestra CUÁNTOS documentos hay en cada colección (ensayo).
 *   · Para borrar hay que pasar --ejecutar Y escribir a mano «BORRAR TODO» cuando lo pida.
 *   · Ya NO usa un archivo de llave (serviceAccountKey.json): toma las credenciales de tu sesión de Google Cloud
 *     (gcloud auth application-default login) o de GOOGLE_APPLICATION_CREDENTIALS. En el repo no queda ninguna llave.
 *
 * Uso:
 *   cd functions
 *   node reset-movimientos.js              ← ensayo: cuenta, no borra
 *   node reset-movimientos.js --ejecutar   ← borra (pide confirmación escrita)
 */

const admin = require('firebase-admin');
const readline = require('readline');

const PROJECT_ID = 'roal-burger-menu';
const EJECUTAR = process.argv.includes('--ejecutar');

admin.initializeApp({ projectId: PROJECT_ID }); // credenciales de la sesión (ADC), sin archivo de llave
const db = admin.firestore();

// ── Colecciones a borrar completamente ───────────────────────────────
const CLEAR_COLLECTIONS = [
  'gastos_caja',    // movimientos de caja (egresos)
  'cierres_caja',   // arqueos / cierres de jornada
  'resumen_ventas', // resúmenes estadísticos por jornada
  'estadisticas',   // métricas generales
  'pos_tickets',    // tickets POS generados
];

// ── Helpers ──────────────────────────────────────────────────────────
async function contar(name) {
  const r = await db.collection(name).count().get();
  return r.data().count;
}

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

function preguntar(texto) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(texto, (r) => { rl.close(); resolve(r); }));
}

// ── Main ─────────────────────────────────────────────────────────────
async function main() {
  console.log('\n══════════════════════════════════════════════════════');
  console.log('   REINICIO DE MOVIMIENTOS, INFORMES Y MÉTRICAS');
  console.log(`   Proyecto: ${PROJECT_ID}   ·   modo: ${EJECUTAR ? '⚠️  BORRAR' : 'ensayo (no borra)'}`);
  console.log('══════════════════════════════════════════════════════\n');
  console.log('✅ SIN CAMBIOS EN: clientes · proveedores · productos');
  console.log('                   categorías · bebidas · combos · config\n');

  try {
    // Siempre se muestra primero lo que hay
    const conteos = {};
    for (const col of [...CLEAR_COLLECTIONS, 'pedidos']) {
      conteos[col] = await contar(col);
      console.log(`  ${col.padEnd(18)} ${String(conteos[col]).padStart(7)} documentos`);
    }

    if (!EJECUTAR) {
      console.log('\nEnsayo terminado: NO se borró nada. Para borrar de verdad: node reset-movimientos.js --ejecutar\n');
      process.exit(0);
    }

    const resp = await preguntar('\n⚠️  Esto BORRA todo lo de arriba en PRODUCCIÓN y no se puede deshacer.\nEscribe exactamente  BORRAR TODO  para continuar: ');
    if (resp.trim() !== 'BORRAR TODO') {
      console.log('\nCancelado: no se borró nada.\n');
      process.exit(0);
    }

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

    console.log('\n   ✅  REINICIO COMPLETADO\n');

  } catch (err) {
    console.error('\n❌  Error durante el reinicio:', err.message);
    console.error(err);
    process.exit(1);
  }

  process.exit(0);
}

main();
