// FODI · campaña "Nuevo cliente" (Feedback › Campañas): personas que escribieron por WhatsApp, NO están registradas y no pidieron.
// Solo LECTURA. SYNC: la misma regla vive en el panel (admin.js → _nuevoCandidatos); si cambias una, cambia la otra.
// Una persona entra a la lista si: conversación de WhatsApp, sin pedido, sin atención humana, no bloqueada, con ≥ espera min de silencio,
// dentro de las últimas 12 h, número que no existe en clientes ni en pedidos, y sin oferta «nuevo» en los últimos 30 días.

const DIA_MS = 86400000;
const MAX_HORAS = 12;
const ms = (t) => (t && typeof t.toMillis === 'function' ? t.toMillis() : Number(t) || 0);
const llave = (v) => String(v || '').replace(/\D/g, '').slice(-10);

async function nuevoCliente(db, args = {}, ahora = Date.now()) {
    const dias = Math.min(90, Math.max(1, Number(args.dias) || 30));
    const cfgSnap = await db.collection('configuracion').doc('fidelizacion').get();
    const cfg = cfgSnap.exists ? cfgSnap.data() || {} : {};
    const espera = (Number(cfg.nuevoEsperaMin) || 30) * 60000;
    const desdeEnvios = ahora - dias * DIA_MS;

    const [convSnap, cliSnap, envSnap, pedSnap] = await Promise.all([
        db.collection('agent_conversations').orderBy('updatedAt', 'desc').limit(200).get(),
        db.collection('clientes').get(),
        db.collection('fidelizacion_envios').where('motivo', '==', 'nuevo').get(),
        db.collection('pedidos').get()
    ]);
    const registrados = new Set(cliSnap.docs.map((d) => { const x = d.data() || {}; return llave(x.customerPhoneDigits || x.customerPhone || x.telefono || d.id); }).filter(Boolean));
    const pedidos = pedSnap.docs.map((d) => d.data() || {}).filter((o) => !o.anulado && !o.voided);
    const conPedido = new Set(pedidos.map((o) => llave(o.customerPhoneDigits || o.customerPhone)).filter(Boolean));
    const envios = envSnap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((e) => e.descartado !== true);
    const yaOfrecido = new Set(envios.filter((e) => ahora - ms(e.creadoAt) < 30 * DIA_MS).map((e) => llave(e.telefono)));

    const lista = convSnap.docs.map((d) => ({ id: d.id, ...d.data() })).map((cv) => {
        const tel = String((cv.customerInfo && cv.customerInfo.phone) || String(cv.id).replace(/^wa_/, '')).replace(/\D/g, '');
        return { cv, tel, k: llave(tel), t: ms(cv.updatedAt) };
    }).filter((x) => x.k && String(x.cv.id).startsWith('wa_') && x.cv.channel !== 'web'
        && !x.cv.humanControl && !x.cv.blocked && !x.cv.lastOrderId && x.cv.status !== 'archived'
        && x.t && ahora - x.t >= espera && ahora - x.t <= MAX_HORAS * 3600000
        && !registrados.has(x.k) && !conPedido.has(x.k) && !yaOfrecido.has(x.k));

    const recientes = envios.filter((e) => ms(e.creadoAt) >= desdeEnvios);
    let compraron = 0; let ventas = 0;
    recientes.forEach((e) => {
        const k = llave(e.telefono); const t0 = ms(e.creadoAt);
        const ped = pedidos.filter((o) => llave(o.customerPhoneDigits || o.customerPhone) === k && ms(o.createdAt) >= t0);
        if (ped.length) { compraron++; ventas += Number(ped[0].subtotal != null ? ped[0].subtotal : ped[0].total) || 0; }
    });
    return {
        para_escribir_ahora: lista.length,
        lista: lista.slice(0, 10).map((x) => ({ telefono: x.tel, nombre: (x.cv.customerInfo && x.cv.customerInfo.name) || '', hace_min: Math.round((ahora - x.t) / 60000), ultimo_mensaje: String(x.cv.lastMessageText || '').slice(0, 90) })),
        ultimos_dias: dias,
        ofertas_enviadas: recientes.length,
        pendientes_de_confirmar_envio: recientes.filter((e) => e.pendiente === true).length,
        compraron_despues: compraron,
        ventas_recuperadas: ventas,
        oferta_actual: cfg.nuevoOferta || 'unas papas gratis con tu pedido',
        vigencia_horas: Number(cfg.nuevoHoras) || 3,
        espera_min: espera / 60000,
        nota: 'Los pedidos de «compraron_despues» se miran solo en los pedidos activos (no en archivados). El mensaje se copia a mano en el panel: Feedback › Campañas › Nuevo cliente. Para cambiar regalo/espera/vigencia: Feedback › Ajustes.'
    };
}

const TOOL = {
    name: 'nuevo_cliente',
    description: 'Campaña NUEVO CLIENTE (Feedback › Campañas): personas que escribieron por WhatsApp, no están registradas y no pidieron. Dice cuántas hay para escribirles ahora (con teléfono, hace cuánto escribieron y su último mensaje), cuántas ofertas exprés se enviaron, cuántas compraron después y las ventas recuperadas, más el regalo y la vigencia configurados. Úsala para "¿a cuántos puedo recuperar hoy?", "¿está funcionando la oferta a nuevos?". Solo lectura.',
    input_schema: { type: 'object', properties: { dias: { type: 'number', description: 'Ventana para ofertas enviadas/resultados (1-90, por defecto 30).' } } }
};

module.exports = { nuevoCliente, TOOL };
