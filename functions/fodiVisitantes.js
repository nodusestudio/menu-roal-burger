'use strict';

// Herramienta de FODI: quién está AHORA en el menú público y qué tiene en el carrito (presencia/{sid}, la escribe tracking.js).
// Un visitante cuenta como "en línea" si su último latido (ts) tiene menos de 90 s. Solo lectura.

const VIGENCIA_MS = 90000;
const ETAPA = { pagando: 'pagando (ya en la ventana de confirmar pedido)', carrito: 'armando pedido (tiene productos en el carrito)', viendo: 'mirando el menú' };

function resumir(docs, ahora) {
    const vivos = docs.filter((d) => Number(d.ts) > ahora - VIGENCIA_MS);
    const visitantes = vivos.map((d) => ({
        etapa: d.lugar === 'juego' ? 'jugando Block ROAL' : (ETAPA[d.etapa] || d.etapa),
        registrado: !!d.cid,
        clienteId: d.cid || null,
        dispositivo: d.disp === 'movil' ? 'celular' : 'computador',
        origen: d.fuente || 'directo',
        minutosEnLaPagina: Math.max(0, Math.round((ahora - Number(d.inicio || d.ts)) / 60000)),
        carrito: (Array.isArray(d.items) ? d.items : []).map((i) => `${i.q}x ${i.n}${i.h ? ' (acompañante)' : ''}`),
        totalCarrito: Number(d.total) || 0
    })).sort((a, b) => (b.totalCarrito - a.totalCarrito));
    return {
        enLineaAhora: visitantes.length,
        conPedidoEnCarrito: visitantes.filter((v) => v.carrito.length).length,
        jugando: vivos.filter((d) => d.lugar === 'juego').length,
        registrados: vivos.filter((d) => d.cid).length,
        pagando: vivos.filter((d) => d.etapa === 'pagando').length,
        visitantes,
        nota: 'Es en vivo (últimos 90 segundos). Si registrado=true, clienteId es phone_<celular> (nombre en la colección clientes). El histórico por día y hora está en Informes › Tráfico.'
    };
}

async function visitantesEnVivo(db, ahora = Date.now()) {
    const snap = await db.collection('presencia').where('ts', '>', ahora - VIGENCIA_MS).limit(100).get();
    return resumir(snap.docs.map((d) => d.data()), ahora);
}

module.exports = { visitantesEnVivo, resumir };
