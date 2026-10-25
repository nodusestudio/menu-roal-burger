// FODI · cuánto cuesta usarlo: lee el consumo diario que ya se registra (admin_ai_usage_daily) para que el dueño
// y FODI puedan ver el gasto en dólares, por día y por modelo, y decidir dónde ahorrar.
//   node --test --test-concurrency=1 tests/fodi-uso.test.js

const hoyBogota = (ms = Date.now()) => new Date(ms - 5 * 3600e3).toISOString().slice(0, 10);
const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const r4 = (n) => Math.round((Number(n) || 0) * 10000) / 10000;

async function gastoFodi(db, args = {}, ahora = Date.now()) {
    const dias = Math.min(Math.max(parseInt(args.dias, 10) || 7, 1), 90);
    const desde = hoyBogota(ahora - (dias - 1) * 86400000);
    const sn = await db.collection('admin_ai_usage_daily').get();
    const filas = sn.docs.map((d) => ({ fecha: d.id, ...d.data() })).filter((f) => /^\d{4}-\d{2}-\d{2}$/.test(f.fecha) && f.fecha >= desde).sort((a, b) => a.fecha.localeCompare(b.fecha));
    const suma = (k) => filas.reduce((s, f) => s + (Number(f[k]) || 0), 0);
    const total = suma('costoUsd'), consultas = suma('consultas');
    const porModelo = ['haiku', 'sonnet', 'opus'].map((m) => ({ modelo: m, consultas: suma(`consultas_${m}`) })).filter((x) => x.consultas > 0);
    const tokensIn = suma('tokensIn'), cacheLeido = suma('cacheReadTokens');
    const masCaros = [...filas].sort((a, b) => (b.costoUsd || 0) - (a.costoUsd || 0)).slice(0, 3).map((f) => ({ fecha: f.fecha, usd: r2(f.costoUsd), consultas: f.consultas || 0 }));
    return {
        desde, dias, dias_con_uso: filas.length, consultas, total_usd: r2(total), promedio_usd_por_consulta: consultas ? r4(total / consultas) : 0,
        promedio_usd_por_dia: r2(total / dias), por_modelo: porModelo,
        porcentaje_tokens_desde_cache: tokensIn ? Math.round((cacheLeido / tokensIn) * 100) : 0,
        dias_mas_caros: masCaros,
        por_dia: filas.map((f) => ({ fecha: f.fecha, usd: r2(f.costoUsd), consultas: f.consultas || 0 })),
        nota: 'Costo estimado en dólares (tarifas configuradas en el servidor), incluye el aprendizaje automático. El informe semanal y la generación de respuestas a clientes se cuentan aparte si usan su propio registro.'
    };
}

const TOOL = {
    name: 'gasto_fodi',
    description: 'CUÁNTO CUESTA usar a FODI (la IA): gasto en dólares por día y total del periodo, número de consultas, promedio por consulta, consultas por modelo (haiku/sonnet/opus), porcentaje servido desde caché y los días más caros. Úsala cuando pregunten por el costo/gasto de la IA o cómo ahorrar; da 2-3 recomendaciones concretas según los números (p. ej. si domina Opus, usar el modo profundo solo cuando haga falta).',
    input_schema: { type: 'object', properties: { dias: { type: 'integer', description: 'Días hacia atrás incluyendo hoy (1-90, por defecto 7).' } } }
};

module.exports = { gastoFodi, TOOL };
