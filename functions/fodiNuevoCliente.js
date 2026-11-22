// FODI · campaña "Nuevo cliente" (Feedback › Campañas): personas que escribieron por WhatsApp, NO están registradas y no pidieron.
// Solo LECTURA. SYNC: la misma regla vive en el panel (admin.js → _nuevoCandidatos); si cambias una, cambia la otra.
// Una persona entra a la lista si: conversación de WhatsApp, sin pedido, sin atención humana, no bloqueada, con ≥ espera min de silencio,
// dentro de las últimas 12 h, número que no existe en clientes ni en pedidos, y sin oferta «nuevo» en los últimos 30 días.

const DIA_MS = 86400000;
const MAX_HORAS = 12;
const VENTANA_COMPRA_MS = 24 * 3600000; // «compraron después» = pedido dentro de las 24 h siguientes a la oferta
const ms = (t) => (t && typeof t.toMillis === 'function' ? t.toMillis() : Number(t) || 0);
const llave = (v) => String(v || '').replace(/\D/g, '').slice(-10);

async function nuevoCliente(db, args = {}, ahora = Date.now()) {
    const dias = Math.min(90, Math.max(1, Number(args.dias) || 30));
    const cfgSnap = await db.collection('configuracion').doc('fidelizacion').get();
    const cfg = cfgSnap.exists ? cfgSnap.data() || {} : {};
    const espera = (Number(cfg.nuevoEsperaMin) || 30) * 60000;
    const desdeEnvios = ahora - dias * DIA_MS;

    const [convSnap, entSnap, cliSnap, envSnap, pedSnap, arcSnap] = await Promise.all([
        db.collection('agent_conversations').orderBy('updatedAt', 'desc').limit(500).get(),
        // Chats de WhatsApp Web que reporta la extensión del navegador (functions/waEntrantes.js): números sin guardar.
        db.collection('wa_entrantes').orderBy('ultimoAt', 'desc').limit(300).get(),
        db.collection('clientes').get(),
        db.collection('fidelizacion_envios').where('motivo', '==', 'nuevo').get(),
        db.collection('pedidos').get(),
        // Pedidos cerrados (archivados) del periodo: solo para contar «compraron después».
        db.collection('pedidos_archivados').where('createdAt', '>=', new Date(desdeEnvios)).get()
    ]);
    const registrados = new Set(cliSnap.docs.map((d) => { const x = d.data() || {}; return llave(x.customerPhoneDigits || x.customerPhone || x.telefono || d.id); }).filter(Boolean));
    const pedidos = pedSnap.docs.map((d) => d.data() || {}).filter((o) => !o.anulado && !o.voided);
    const conPedido = new Set(pedidos.map((o) => llave(o.customerPhoneDigits || o.customerPhone)).filter(Boolean));
    const envios = envSnap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((e) => e.descartado !== true);
    const yaOfrecido = new Set(envios.filter((e) => ahora - ms(e.creadoAt) < 30 * DIA_MS).map((e) => llave(e.telefono)));

    const conversaciones = convSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const ya = new Set(conversaciones.map((c) => c.id));
    const entrantes = entSnap.docs.map((d) => require('./waEntrantes').comoConversacion({ k: d.id, ...d.data() })).filter((c) => !ya.has(c.id));
    const lista = conversaciones.concat(entrantes).map((cv) => {
        const tel = String((cv.customerInfo && cv.customerInfo.phone) || String(cv.id).replace(/^wa_/, '')).replace(/\D/g, '');
        return { cv, tel, k: llave(tel), t: ms(cv.updatedAt) };
    }).filter((x) => x.k && String(x.cv.id).startsWith('wa_') && x.cv.channel !== 'web'
        && !x.cv.humanControl && !x.cv.blocked && !x.cv.lastOrderId && x.cv.status !== 'archived'
        && x.t && ahora - x.t >= espera && ahora - x.t <= MAX_HORAS * 3600000
        && !registrados.has(x.k) && !conPedido.has(x.k) && !yaOfrecido.has(x.k));

    const recientes = envios.filter((e) => ms(e.creadoAt) >= desdeEnvios);
    const compradores = pedidos.concat(arcSnap.docs.map((d) => d.data() || {}).filter((o) => !o.anulado && !o.voided));
    let compraron = 0; let ventas = 0;
    recientes.forEach((e) => {
        const k = llave(e.telefono); const t0 = ms(e.creadoAt);
        const ped = compradores.filter((o) => llave(o.customerPhoneDigits || o.customerPhone) === k && ms(o.createdAt) >= t0 && ms(o.createdAt) <= t0 + VENTANA_COMPRA_MS)
            .sort((a, b) => ms(a.createdAt) - ms(b.createdAt));
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
        nota: 'Los pedidos de «compraron_despues» cuentan pedidos activos y archivados hechos dentro de las 24 h siguientes a la oferta. El mensaje se copia a mano en el panel: Feedback › Campañas › Nuevo cliente. Para cambiar regalo/espera/vigencia: Feedback › Ajustes.'
    };
}

const TOOL = {
    name: 'nuevo_cliente',
    description: 'Campaña NUEVO CLIENTE (Feedback › Campañas): personas que escribieron por WhatsApp, no están registradas y no pidieron. Dice cuántas hay para escribirles ahora (con teléfono, hace cuánto escribieron y su último mensaje), cuántas ofertas exprés se enviaron, cuántas compraron después y las ventas recuperadas, más el regalo y la vigencia configurados. Úsala para "¿a cuántos puedo recuperar hoy?", "¿está funcionando la oferta a nuevos?". Solo lectura.',
    input_schema: { type: 'object', properties: { dias: { type: 'number', description: 'Ventana para ofertas enviadas/resultados (1-90, por defecto 30).' } } }
};

// Aviso push: cada vez que aparece alguien NUEVO en la lista «Para escribir ahora» (una sola vez por número).
// Estado en configuracion/nuevo_cliente_aviso { avisados: { <10 dígitos>: ms } }; se limpia lo de más de 2 días.
async function avisarNuevos(db, ahora = Date.now(), enviar = null) {
    const r = await nuevoCliente(db, {}, ahora);
    const ref = db.collection('configuracion').doc('nuevo_cliente_aviso');
    const snap = await ref.get();
    const prev = (snap.exists && snap.data().avisados) || {};
    const vigentes = {};
    Object.keys(prev).forEach((k) => { if (ahora - Number(prev[k]) < 2 * DIA_MS) vigentes[k] = prev[k]; });
    const nuevos = r.lista.filter((x) => !vigentes[llave(x.telefono)]);
    if (!nuevos.length) return { avisados: 0, lista: r.para_escribir_ahora };
    const push = enviar || ((o) => require('./pushAdmin').enviarPush(db, o));
    const primero = nuevos[0];
    await push({
        title: nuevos.length === 1 ? '🆕 Escribió y no pidió' : `🆕 ${nuevos.length} personas escribieron y no pidieron`,
        body: nuevos.length === 1 ? `${primero.nombre || primero.telefono} · hace ${primero.hace_min} min${primero.ultimo_mensaje ? ` · «${primero.ultimo_mensaje}»` : ''}. Envíale la oferta exprés.` : 'Entra a Feedback › Campañas › Nuevo cliente para enviarles la oferta.',
        tag: 'roal-nuevo-cliente',
        url: '/admin.html',
        tipo: 'nuevo_cliente_oferta'
    });
    nuevos.forEach((x) => { vigentes[llave(x.telefono)] = ahora; });
    await ref.set({ avisados: vigentes, actualizadoAt: ahora });
    return { avisados: nuevos.length, lista: r.para_escribir_ahora };
}

module.exports = { nuevoCliente, avisarNuevos, TOOL };
