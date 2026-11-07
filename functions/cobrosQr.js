// Cobros con QR de Bancolombia (botón "Cobrar con QR" del POS + pantalla de la TV).
// El POS abre un cobro (cobros_bancolombia/{id}, estado 'abierto') con el total del pedido y muestra el QR en la TV
// (configuracion/tv_cobro, lectura pública). Cuando llega el correo del pago, bancoAviso llama a enlazarPago: si hay
// UN SOLO cobro abierto por ese valor exacto, lo marca 'pagado' y avisa a la TV; el POS (que lo está escuchando) registra
// el pago del pedido. Si hay varios cobros del mismo valor NO se adivina: queda para confirmar a mano ("Ya pagó").

const COBROS = 'cobros_bancolombia';
const TV_COBRO = ['configuracion', 'tv_cobro'];

/** Entre los cobros abiertos elige el que corresponde a un pago; null si no hay uno solo claro. */
function elegirCobro(cobros, monto, ahora) {
    const posibles = (cobros || []).filter((c) => c.estado === 'abierto' && Number(c.total) === Number(monto) && Number(c.expiraEn) > ahora);
    if (posibles.length === 1) return { cobro: posibles[0], motivo: 'unico' };
    return { cobro: null, motivo: posibles.length ? 'ambiguo' : 'sin-cobro' };
}

/**
 * Enlaza un pago recién llegado con un cobro abierto. pago: { id, nombre, monto }.
 * Nunca lanza: un fallo aquí no debe impedir que el pago se anuncie.
 */
async function enlazarPago(db, pago, ahora = Date.now()) {
    try {
        const { FieldValue } = require('firebase-admin/firestore');
        const { nombreCorto } = require('./bancoAviso');
        const snap = await db.collection(COBROS).where('estado', '==', 'abierto').where('total', '==', pago.monto).limit(10).get();
        const { cobro, motivo } = elegirCobro(snap.docs.map((d) => ({ id: d.id, ...d.data() })), pago.monto, ahora);
        if (!cobro) return { enlazado: false, motivo };
        const ref = db.collection(COBROS).doc(cobro.id);
        const resultado = await db.runTransaction(async (tx) => {
            const actual = await tx.get(ref);
            if (!actual.exists || actual.data().estado !== 'abierto') return false; // otro proceso lo cerró primero
            const creadoMs = actual.data().creadoEn && actual.data().creadoEn.toMillis ? actual.data().creadoEn.toMillis() : ahora;
            tx.update(ref, { estado: 'pagado', pagoId: pago.id, pagador: pago.nombre, pagadoEn: FieldValue.serverTimestamp(), esperaSeg: Math.max(0, Math.round((ahora - creadoMs) / 1000)) });
            return true;
        });
        if (!resultado) return { enlazado: false, motivo: 'ya-cerrado' };
        // La TV solo cambia si está mostrando ESTE cobro
        const tvRef = db.collection(TV_COBRO[0]).doc(TV_COBRO[1]);
        const tv = await tvRef.get();
        if (tv.exists && tv.data().cobroId === cobro.id) {
            await tvRef.update({ estado: 'pagado', pagador: nombreCorto(pago.nombre), pagadoMs: ahora, actualizado: FieldValue.serverTimestamp() });
        }
        await db.collection('avisos_banco').doc(pago.id).set({ cobroId: cobro.id }, { merge: true });
        return { enlazado: true, cobroId: cobro.id };
    } catch (err) {
        console.error('cobrosQr.enlazarPago:', err && err.message ? err.message : err);
        return { enlazado: false, motivo: 'error' };
    }
}


// ── "Ya pagó" del cajero: el cobro se confirma al instante (TV + voz) sin esperar el correo del banco ──
// El correo llega 30-60 s después: bancoAviso lo reconoce (buscarManualPendiente) y lo enlaza en silencio al mismo cobro, así
// no se vuelve a decir en voz alta ni queda como "plata sin pedido".
const VENTANA_MANUAL_MS = 20 * 60 * 1000;

/** Entre los cobros ya confirmados a mano y sin pago del banco, el que corresponde a un pago que acaba de llegar (el más antiguo). */
function elegirManualPendiente(cobros, monto, ahora) {
    const c = (cobros || []).filter((x) => x.estado === 'pagado' && x.manual === true && !x.pagoId
        && Number(x.total) === Number(monto) && ahora - Number(x.pagadoMs || 0) <= VENTANA_MANUAL_MS && Number(x.pagadoMs || 0) <= ahora + 60000);
    c.sort((a, b) => (a.pagadoMs || 0) - (b.pagadoMs || 0));
    return c[0] || null;
}

async function buscarManualPendiente(db, monto, ahora = Date.now()) {
    try {
        const snap = await db.collection(COBROS).where('estado', '==', 'pagado').where('total', '==', monto).limit(10).get();
        return elegirManualPendiente(snap.docs.map((d) => ({ id: d.id, ...d.data() })), monto, ahora);
    } catch (err) {
        console.error('cobrosQr.buscarManualPendiente:', err && err.message ? err.message : err);
        return null;
    }
}

/** Un pedido de mesa se guarda a nombre de la mesa ("Mesa 5"): ese NO es el nombre de quien paga. */
function esNombreDeMesa(cliente) {
    return /^\s*mesa(?![a-záéíóúñ])/i.test(String(cliente || ''));
}

/** Marca el cobro manual como verificado por el banco (llegó el correo). */
async function enlazarManual(db, cobro, pago, ahora = Date.now()) {
    try {
        const { FieldValue } = require('firebase-admin/firestore');
        if (cobro.esperaNombre) {
            // Cobro de mesa: la TV aún no tenía nombre; ahora se pone el de quien hizo la transferencia.
            const { nombreCorto } = require('./bancoAviso');
            const tvRef = db.collection(TV_COBRO[0]).doc(TV_COBRO[1]);
            const tv = await tvRef.get();
            if (tv.exists && tv.data().cobroId === cobro.id) await tvRef.update({ pagador: nombreCorto(pago.nombre), actualizado: FieldValue.serverTimestamp() });
        }
        await db.collection(COBROS).doc(cobro.id).update({ pagoId: pago.id, pagador: pago.nombre, verificadoBanco: true, verificadoEn: FieldValue.serverTimestamp(), retrasoBancoSeg: Math.max(0, Math.round((ahora - Number(cobro.pagadoMs || ahora)) / 1000)) });
        return { enlazado: true, cobroId: cobro.id, manual: true };
    } catch (err) {
        console.error('cobrosQr.enlazarManual:', err && err.message ? err.message : err);
        return { enlazado: false, motivo: 'error' };
    }
}

/**
 * El cajero toca "Ya pagó": el cobro pasa a 'pagado' (manual), la TV agradece y se crea el anuncio de voz (anuncios_caja, que lee el
 * programa de Windows junto con los avisos del banco). Devuelve { ok, estado }.
 */
async function confirmarManual(db, cobroId, uid, ahora = Date.now()) {
    const { FieldValue } = require('firebase-admin/firestore');
    const { nombreCorto, frasePago } = require('./bancoAviso');
    const ref = db.collection(COBROS).doc(cobroId);
    let cobro = null;
    const abierto = await db.runTransaction(async (tx) => {
        const d = await tx.get(ref);
        if (!d.exists) return false;
        const x = d.data();
        if (x.estado !== 'abierto') { cobro = x; return false; }
        const creadoMs = x.creadoEn && x.creadoEn.toMillis ? x.creadoEn.toMillis() : ahora;
        tx.update(ref, { estado: 'pagado', manual: true, ...(esNombreDeMesa(x.cliente) ? { esperaNombre: true } : {}), pagadoEn: FieldValue.serverTimestamp(), pagadoMs: ahora, esperaSeg: Math.max(0, Math.round((ahora - creadoMs) / 1000)), confirmadoPor: uid || '' });
        cobro = x;
        return true;
    });
    if (!abierto) return { ok: false, estado: cobro ? cobro.estado : 'inexistente' };
    // Mesa: no se dice "Mesa 5". La voz y la TV esperan a que llegue el aviso del banco con el nombre de quien transfirió.
    const esMesa = esNombreDeMesa(cobro.cliente);
    const cliente = esMesa ? '' : String(cobro.cliente || '').trim();
    const total = Number(cobro.total) || 0;
    const tvRef = db.collection(TV_COBRO[0]).doc(TV_COBRO[1]);
    const tv = await tvRef.get();
    if (tv.exists && tv.data().cobroId === cobroId) {
        await tvRef.update({ estado: 'pagado', pagador: nombreCorto(cliente), pagadoMs: ahora, total, parcial: !!cobro.parcial, pedidoTotal: Number(cobro.pedidoTotal) || total, actualizado: FieldValue.serverTimestamp() });
    }
    // El cajero tiene al cliente enfrente: la voz agradece DE UNA VEZ (en mesa, sin nombre; cuando llegue el correo la TV pone el nombre real).
    await db.collection('anuncios_caja').doc(cobroId).set({ nombre: cliente || 'Cliente', monto: total, frase: frasePago(cliente, total), cobroId, creadoEn: FieldValue.serverTimestamp(), prueba: false });
    return { ok: true, estado: 'pagado' };
}

module.exports = { esNombreDeMesa, COBROS, elegirCobro, enlazarPago, elegirManualPendiente, buscarManualPendiente, enlazarManual, confirmarManual };
