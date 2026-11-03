// FODI · estado de los avisos del banco: ¿están llegando? Solo LECTURA. Junta la vigilancia (configuracion/vigilancia_banco),
// el último aviso recibido y si el programa de voz de cada computador está reportándose.

const C = require('./conciliacionBanco');
const hace = (ms, ahora) => { const m = Math.round((ahora - ms) / 60000); return m < 1 ? 'hace menos de 1 min' : m < 90 ? `hace ${m} min` : `hace ${Math.round(m / 60)} h`; };

async function estadoAvisosBanco(db, args = {}, ahora = Date.now()) {
    const [vig, ultimo, equipos] = await Promise.all([
        db.collection('configuracion').doc('vigilancia_banco').get(),
        db.collection('avisos_banco').orderBy('creadoEn', 'desc').limit(6).get(),
        db.collection('banco_equipos').get()
    ]);
    const v = vig.exists ? vig.data() : {};
    const real = ultimo.docs.map((d) => d.data()).find((x) => !x.prueba);
    const ultimoMs = real ? C.concMs(real.creadoEn) : 0;
    return {
        alerta_activa: v.alerta === true,
        cobros_sin_aviso_del_banco: Number(v.pendientes) || 0,
        monto_sin_aviso: Number(v.monto) || 0,
        alerta_desde: v.alerta && v.desdeMs ? hace(Number(v.desdeMs), ahora) : null,
        ultimo_aviso_del_banco: ultimoMs ? hace(ultimoMs, ahora) : 'ninguno registrado',
        programas_de_voz: equipos.docs.map((d) => { const x = d.data(); const m = x.visto && x.visto.toMillis ? x.visto.toMillis() : 0; return { equipo: x.equipo || d.id, en_linea: m > 0 && ahora - m < 5 * 60000, ultima_senal: m ? hace(m, ahora) : 'nunca', silenciado: !!x.silenciado }; }),
        nota: 'La vigilancia revisa cada 10 min (de 9 a. m. a 11 p. m.) si hay cobros Bancolombia del POS sin su aviso del banco pasados 8 min. Que no haya avisos mucho rato puede ser normal si no hubo ventas por Bancolombia.'
    };
}

module.exports = { estadoAvisosBanco };
