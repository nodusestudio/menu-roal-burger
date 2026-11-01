// FODI · avisos al celular (push). Solo LECTURA: qué dispositivos están activados y cuántos avisos se enviaron por tipo
// en los últimos días (los cuenta functions/pushAdmin.js en configuracion/push_stats). Sirve para "¿me están llegando
// los avisos?" y para saber que un celular nuevo todavía no se activó (se activa en /avisos).

const DIA_MS = 86400000;
const TIPOS = {
    pedido_nuevo: 'pedido nuevo', chat_nuevo: 'chat nuevo', mensaje_red: 'mensaje de Instagram/Facebook',
    comentario_red: 'comentario en redes', cliente_nuevo: 'cliente nuevo', prueba: 'prueba de activación', otro: 'otros'
};
const diaBogota = (ms) => new Date(ms).toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });

async function avisosCelular(db, ahora = Date.now()) {
    const [tokens, statsDoc] = await Promise.all([
        db.collection('admin_fcm_tokens').get(),
        db.collection('configuracion').doc('push_stats').get()
    ]);
    const dispositivos = tokens.docs.map((d) => {
        const x = d.data();
        const u = x.updatedAt && typeof x.updatedAt.toDate === 'function' ? x.updatedAt.toDate().toISOString() : null;
        return { dispositivo: x.etiqueta || 'sin nombre (activado desde el panel anterior)', app_instalada: x.instalada === true, actualizado: u };
    });
    const dias = (statsDoc.exists ? statsDoc.data().dias : null) || {};
    const porTipo = {};
    let enviados = 0, fallidos = 0;
    for (let i = 0; i < 7; i++) {
        const d = dias[diaBogota(ahora - i * DIA_MS)];
        if (!d) continue;
        for (const [tipo, v] of Object.entries(d)) {
            const e = Number(v && v.enviados) || 0, f = Number(v && v.fallidos) || 0;
            const t = porTipo[tipo] || (porTipo[tipo] = { tipo: TIPOS[tipo] || tipo, enviados: 0, fallidos: 0 });
            t.enviados += e; t.fallidos += f; enviados += e; fallidos += f;
        }
    }
    return {
        dispositivos_activados: dispositivos.length,
        dispositivos,
        ultimos_7_dias: { avisos_enviados: enviados, avisos_fallidos: fallidos, por_tipo: Object.values(porTipo) },
        avisos_que_llegan: Object.values(TIPOS).filter((t) => t !== 'otros' && t !== 'prueba de activación'),
        como_activar: dispositivos.length ? 'Cada celular o computador se activa por separado en el panel → "🔔 Avisos al celular".' : 'Ningún dispositivo está activado: en el celular abre el panel → "🔔 Avisos al celular" → "Activar avisos" (en iPhone, con la app instalada en la pantalla de inicio).',
        nota: 'Los contadores solo incluyen los avisos enviados desde que se registran (no hay historial anterior). Un aviso "fallido" suele ser un celular que desinstaló la app: el sistema lo borra solo. Un aviso enviado no garantiza que se haya visto: depende del permiso del navegador en el celular.'
    };
}

const TOOL = {
    name: 'avisos_celular',
    description: 'AVISOS AL CELULAR (notificaciones push del panel): cuántos dispositivos están activados, cuáles, y cuántos avisos se enviaron en los últimos 7 días por tipo (pedido nuevo, chat, mensajes y comentarios de redes, cliente nuevo). Úsala para "¿me están llegando los avisos?", "¿mi celular está activado?" o "¿cuántos avisos mandó el sistema?". Para activarlo, el administrador entra al panel → "🔔 Avisos al celular".',
    input_schema: { type: 'object', properties: {} }
};

module.exports = { avisosCelular, TOOL };
