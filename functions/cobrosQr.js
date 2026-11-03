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

module.exports = { COBROS, elegirCobro, enlazarPago };
