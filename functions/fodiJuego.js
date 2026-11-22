'use strict';
// FODI: métricas del minijuego Block ROAL (solo lectura). Lee juego_partidas y juego_canjes (las escribe únicamente el servidor).
const J = require('./juego');

// Une los mapas de jugadores únicos de varios días en un conteo.
function contarUnicos(docs, tipo) {
    const set = new Set();
    docs.filter((d) => d.tipo === tipo).forEach((d) => Object.keys(d.u || {}).forEach((k) => set.add(k)));
    return set.size;
}

async function juegoMetricas(db, args = {}) {
    const hoy = J.diaBogota(Date.now());
    const valido = (d) => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d);
    const desde = valido(args.desde) ? args.desde : hoy;
    const hasta = valido(args.hasta) ? args.hasta : desde;
    const semana = J.lunesDe(hoy);
    const [pSnap, cSnap, cfgSnap, presSnap, rankSnap, evSnap] = await Promise.all([
        db.collection('juego_partidas').where('dia', '>=', desde).where('dia', '<=', hasta).get(),
        db.collection('juego_canjes').where('dia', '>=', desde).where('dia', '<=', hasta).get(),
        db.collection('configuracion').doc('juego').get(),
        db.collection('juego_presupuesto').doc(J.diaBogota(Date.now())).get(),
        db.collection('juego_ranking_semana').doc(semana).collection('jugadores').orderBy('puntos', 'desc').limit(5).get(),
        db.collection('juego_eventos').where('dia', '>=', desde).where('dia', '<=', hasta).get()
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
        embudo_jugadores_unicos: (() => {
            const ev = evSnap.docs.map((d) => d.data());
            const unicos = (arr) => new Set(arr).size;
            return {
                abrieron_el_juego: contarUnicos(ev, 'abrir'), entraron: contarUnicos(ev, 'entrar'), iniciaron_partida: contarUnicos(ev, 'iniciar'),
                terminaron_partida_valida: unicos(ok.map((p) => p.uid)), ganaron_credito: unicos(ok.filter((p) => Number(p.creditoGanado) > 0).map((p) => p.uid)),
                canjearon_credito: unicos(canjes.map((c) => c.uid)), compartieron: contarUnicos(ev, 'compartir'), vieron_ranking: contarUnicos(ev, 'ranking'),
                jugaron_el_reto: unicos(ok.filter((p) => p.modo === 'reto').map((p) => p.uid))
            };
        })(),
        ventas_con_credito_cop: canjes.reduce((s, c) => s + (Number(c.totalPedido) || 0), 0),
        reto_ranking_semana: { desde: semana, top5: rankSnap.docs.map((d, i) => ({ pos: i + 1, nombre: d.data().nombre, puntos: Number(d.data().puntos) || 0, dias: Number(d.data().dias) || 0 })), premio: cfg.retoPremio },
        presupuesto_hoy: { emitido_cop: presSnap.exists ? Number(presSnap.data().emitido) || 0 : 0, presupuesto_cop: cfg.presupuestoDiario, agotado: presSnap.exists && presSnap.data().agotado === true },
        reglas_actuales: { vencimiento_creditos_dias: cfg.creditoVigenciaDias, requiere_pedido_previo: cfg.requierePedidoPrevio, partidas_max_por_dia: cfg.maxPartidasDia, activo: cfg.activo, valor_punto_cop: cfg.valorPunto, tope_diario_pts: cfg.topeDiario, tope_credito_pct_del_pedido: cfg.topeCreditoPct, meta_base: cfg.metaBase, bonus_racha: cfg.rachaBonus },
        nota: 'Créditos canjeados = lo descontado en pedidos; si un pedido se anula el crédito vuelve al cliente pero este número no baja. Las reglas se cambian en Configuración → Juego.'
    };
}

const TOOL = {
    name: 'juego_metricas',
    description: 'Minijuego BLOCK ROAL (pestaña «Juega» del menú): cuántos jugadores y partidas hubo, puntos y créditos ROAL entregados, créditos canjeados en pedidos (dinero) y las reglas vigentes (valor del punto, tope diario, % máximo del pedido). Úsala para "¿cuánta gente juega?", "¿cuánto nos cuesta el juego?", "¿cuántos créditos se han canjeado?". Solo lectura.',
    input_schema: { type: 'object', properties: { desde: { type: 'string', description: 'YYYY-MM-DD (hora Colombia). Por defecto hoy.' }, hasta: { type: 'string', description: 'YYYY-MM-DD. Por defecto = desde.' } } }
};

module.exports = { juegoMetricas, contarUnicos, TOOL };
