// Vigilancia del aviso del banco: si el POS cobró por Bancolombia (transferencia/QR) y pasan unos minutos sin que llegue el aviso
// del banco, algo se cayó (Gmail, el script de Apps Script) o el cobro no fue real. Avisa por push y deja el estado en
// configuracion/vigilancia_banco (solo admin) para mostrarlo en la pestaña Pagos Bancolombia.
// Corre cada 10 min (functions/index.js → vigilarAvisosBanco). La comparación es la misma de la conciliación (conciliacionBanco.js).

const C = require('./conciliacionBanco');

const GRACIA_MS = 8 * 60 * 1000;          // el aviso suele tardar 30-60 s; pasados 8 min se considera que falta
const VENTANA_MS = 2 * 3600 * 1000;       // se mira lo cobrado en las últimas 2 horas
const REPETIR_MS = 60 * 60 * 1000;        // mientras siga la falla se recuerda como máximo cada hora
const DOC = ['configuracion', 'vigilancia_banco'];

/** Cobros Bancolombia recientes del POS que siguen sin su aviso del banco pasada la gracia. */
function evaluar(pagosPos, pagosBanco, ahora = Date.now()) {
    const desde = ahora - VENTANA_MS;
    const pos = (pagosPos || []).filter((p) => p.ms >= desde);
    const banco = (pagosBanco || []).filter((b) => b.ms >= desde - 30 * 60 * 1000);
    const r = C.concConciliar(banco, pos);
    const pendientes = r.pos_sin_banco.filter((p) => ahora - p.ms >= GRACIA_MS);
    return { alerta: pendientes.length > 0, pendientes, monto: pendientes.reduce((a, p) => a + (Number(p.monto) || 0), 0) };
}

/** Decide qué hacer con el estado anterior: avisar de la falla, avisar que volvió, o nada. */
function decidir(prev, ev, ahora = Date.now()) {
    const antes = prev && prev.alerta === true;
    if (ev.alerta) {
        const avisarOtraVez = !antes || ahora - Number(prev.avisadoMs || 0) >= REPETIR_MS;
        return { accion: avisarOtraVez ? 'alertar' : null, estado: { alerta: true, pendientes: ev.pendientes.length, monto: ev.monto, desdeMs: antes ? Number(prev.desdeMs) || ahora : ahora, avisadoMs: avisarOtraVez ? ahora : Number(prev.avisadoMs) || ahora } };
    }
    return { accion: antes ? 'recuperado' : null, estado: { alerta: false, pendientes: 0, monto: 0, desdeMs: 0, avisadoMs: 0 } };
}

async function revisar(db, ahora = Date.now(), deps = {}) {
    const { Timestamp, FieldValue } = require('firebase-admin/firestore');
    const desde = ahora - VENTANA_MS;
    const consulta = (col) => db.collection(col).where('paidAt', '>=', Timestamp.fromMillis(desde)).get().then((s) => s.docs.map((d) => ({ id: d.id, data: d.data() })));
    const [activos, archivados, avisos] = await Promise.all([
        consulta('pedidos'), consulta('pedidos_archivados'),
        db.collection('avisos_banco').where('creadoEn', '>=', Timestamp.fromMillis(desde - 30 * 60 * 1000)).orderBy('creadoEn', 'asc').limit(500).get()
    ]);
    const { pagos } = C.concExtraerPagosPos([...activos, ...archivados], desde, ahora + 60000);
    const banco = avisos.docs.map((d) => { const x = d.data(); return { id: d.id, nombre: String(x.nombre || ''), monto: Number(x.monto) || 0, ms: C.concMs(x.creadoEn), cobroId: x.cobroId || '', prueba: !!x.prueba }; }).filter((x) => !x.prueba);
    const ev = evaluar(pagos, banco, ahora);
    const ref = db.collection(DOC[0]).doc(DOC[1]);
    const prev = (await ref.get()).data() || {};
    const d = decidir(prev, ev, ahora);
    const cambio = d.accion || prev.alerta !== d.estado.alerta || Number(prev.pendientes) !== d.estado.pendientes;
    if (cambio) await ref.set({ ...d.estado, actualizado: FieldValue.serverTimestamp() });
    if (d.accion) {
        const enviar = deps.enviarPush || require('./pushAdmin').enviarPush;
        const plata = '$' + Number(ev.monto).toLocaleString('es-CO');
        if (d.accion === 'alertar') {
            await enviar(db, { title: '⚠️ Bancolombia: falta el aviso del banco', body: `${ev.pendientes.length} cobro${ev.pendientes.length === 1 ? '' : 's'} (${plata}) registrado${ev.pendientes.length === 1 ? '' : 's'} como Bancolombia sin pago del banco desde hace más de 8 min. Revisa que lleguen los correos (Gmail / script) o que el pago sea real.`, tag: 'roal-vigilancia-banco', url: '/fodexa', tipo: 'vigilancia_banco' });
        } else {
            await enviar(db, { title: '✅ Bancolombia: avisos del banco normales', body: 'Ya llegaron los avisos que faltaban.', tag: 'roal-vigilancia-banco', url: '/fodexa', tipo: 'vigilancia_banco' });
        }
    }
    return { ...ev, accion: d.accion };
}

module.exports = { GRACIA_MS, VENTANA_MS, REPETIR_MS, evaluar, decidir, revisar };
