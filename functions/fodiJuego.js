'use strict';
// FODI: métricas del minijuego Block ROAL (solo lectura). Lee juego_partidas y juego_canjes (las escribe únicamente el servidor).
const J = require('./juego');

async function juegoMetricas(db, args = {}) {
    const hoy = J.diaBogota(Date.now());
    const valido = (d) => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d);
    const desde = valido(args.desde) ? args.desde : hoy;
    const hasta = valido(args.hasta) ? args.hasta : desde;
    const [pSnap, cSnap, cfgSnap] = await Promise.all([
        db.collection('juego_partidas').where('dia', '>=', desde).where('dia', '<=', hasta).get(),
        db.collection('juego_canjes').where('dia', '>=', desde).where('dia', '<=', hasta).get(),
        db.collection('configuracion').doc('juego').get()
    ]);
    const partidas = pSnap.docs.map((d) => d.data());
    const ok = partidas.filter((p) => p.aceptada === true);
    const canjes = cSnap.docs.map((d) => d.data());
    const porDia = {};
    ok.forEach((p) => { const r = (porDia[p.dia] = porDia[p.dia] || { jugadores: new Set(), partidas: 0 }); r.jugadores.add(p.uid); r.partidas += 1; });
    const cfg = J.normalizarConfig(cfgSnap.exists ? cfgSnap.data() : {});
    return {
        rango: { desde, hasta },
        jugadores_distintos: new Set(ok.map((p) => p.uid)).size,
        partidas_validas: ok.length,
        partidas_rechazadas: partidas.length - ok.length,
        puntos_entregados: ok.reduce((s, p) => s + (Number(p.puntosOtorgados) || 0) + (Number(p.bonusRacha) || 0), 0),
        creditos_entregados_cop: ok.reduce((s, p) => s + (Number(p.creditoGanado) || 0), 0),
        creditos_canjeados_cop: canjes.reduce((s, c) => s + (Number(c.monto) || 0), 0),
        pedidos_con_credito: canjes.length,
        por_dia: Object.keys(porDia).sort().map((d) => ({ dia: d, jugadores: porDia[d].jugadores.size, partidas: porDia[d].partidas })),
        reglas_actuales: { activo: cfg.activo, valor_punto_cop: cfg.valorPunto, tope_diario_pts: cfg.topeDiario, tope_credito_pct_del_pedido: cfg.topeCreditoPct, meta_base: cfg.metaBase, bonus_racha: cfg.rachaBonus },
        nota: 'Créditos canjeados = lo descontado en pedidos; si un pedido se anula el crédito vuelve al cliente pero este número no baja. Las reglas se cambian en Configuración → Juego.'
    };
}

const TOOL = {
    name: 'juego_metricas',
    description: 'Minijuego BLOCK ROAL (pestaña «Juega» del menú): cuántos jugadores y partidas hubo, puntos y créditos ROAL entregados, créditos canjeados en pedidos (dinero) y las reglas vigentes (valor del punto, tope diario, % máximo del pedido). Úsala para "¿cuánta gente juega?", "¿cuánto nos cuesta el juego?", "¿cuántos créditos se han canjeado?". Solo lectura.',
    input_schema: { type: 'object', properties: { desde: { type: 'string', description: 'YYYY-MM-DD (hora Colombia). Por defecto hoy.' }, hasta: { type: 'string', description: 'YYYY-MM-DD. Por defecto = desde.' } } }
};

module.exports = { juegoMetricas, TOOL };
