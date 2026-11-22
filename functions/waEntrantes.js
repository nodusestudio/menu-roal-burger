// WhatsApp Web → FODEXA (extensión de Brave «wa-nuevos-ROAL»). La extensión lee la lista de chats de WhatsApp Web y manda
// SOLO los chats de números sin guardar como contacto (el título del chat es un teléfono). Aquí se guarda el estado en
// wa_entrantes/{10 dígitos}; «Nuevo cliente» (fodiNuevoCliente.js y el panel) lo lee igual que a las conversaciones del agente.
// Los tiempos los pone el SERVIDOR (la extensión no sabe a qué hora llegó cada mensaje): primeroAt = la primera vez que se vio el chat,
// ultimoAt = la última vez que cambió el texto del último mensaje del cliente.

const MAX_CHATS = 60;
const llave = (v) => String(v || '').replace(/\D/g, '').slice(-10);
const limpiar = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n);

/** Normaliza lo que manda la extensión. Descarta lo que no es un número de celular colombiano de 10 dígitos. */
function normalizarChats(chats) {
    const vistos = new Set();
    return (Array.isArray(chats) ? chats : []).slice(0, MAX_CHATS).map((c) => {
        const tel = String((c && c.tel) || '').replace(/\D/g, '');
        const k = llave(tel);
        return { k, tel: tel.length >= 10 ? tel : '', nombre: limpiar(c && c.nombre, 80), texto: limpiar(c && c.texto, 160), mio: !!(c && c.mio) };
    }).filter((c) => c.tel && /^3\d{9}$/.test(c.k) && !vistos.has(c.k) && vistos.add(c.k));
}

/** Decide el nuevo estado de un chat a partir del anterior (puro, para pruebas). */
function siguienteEstado(prev, c, ahora) {
    if (!prev) return { telefono: c.tel, k: c.k, nombre: c.nombre, texto: c.texto, primeroAt: ahora, ultimoAt: ahora, respondido: c.mio, ...(c.mio ? { respondidoAt: ahora } : {}) };
    const sig = { ...prev, nombre: c.nombre || prev.nombre || '' };
    if (c.mio) { // el último mensaje es del local: ya lo atendió una persona
        if (!prev.respondido) sig.respondidoAt = ahora;
        sig.respondido = true;
        return sig;
    }
    if (prev.respondido || c.texto !== prev.texto) { sig.texto = c.texto; sig.ultimoAt = ahora; sig.respondido = false; } // el cliente volvió a escribir
    return sig;
}

async function procesar(db, chats, ahora = Date.now()) {
    const lista = normalizarChats(chats);
    if (!lista.length) return { recibidos: 0, escritos: 0 };
    const refs = lista.map((c) => db.collection('wa_entrantes').doc(c.k));
    const snaps = await db.getAll(...refs);
    const batch = db.batch();
    let escritos = 0;
    lista.forEach((c, i) => {
        const prev = snaps[i].exists ? snaps[i].data() : null;
        const sig = siguienteEstado(prev, c, ahora);
        if (prev && JSON.stringify(prev) === JSON.stringify(sig)) return;
        batch.set(refs[i], sig); escritos++;
    });
    if (escritos) await batch.commit();
    return { recibidos: lista.length, escritos };
}

/** Forma que ya entienden «Nuevo cliente» y el panel (como una conversación de WhatsApp). Un chat que ya respondió el local queda con humanControl. */
function comoConversacion(e) {
    return {
        id: `wa_${e.k || llave(e.telefono)}`, channel: 'whatsapp', fuente: 'whatsapp_web', humanControl: e.respondido === true,
        customerInfo: { phone: String(e.telefono || ''), name: String(e.nombre || '') },
        lastMessageText: String(e.texto || ''), updatedAt: Number(e.ultimoAt) || 0
    };
}

module.exports = { normalizarChats, siguienteEstado, procesar, comoConversacion, MAX_CHATS };
