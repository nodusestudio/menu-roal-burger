'use strict';
// Inteligencia extra de FODI: (1) rentabilidad real del menú (ventas × costos), (2) sugerencias que se
// registran y se EVALÚAN solas cuando vence su plazo (FODI aprende de lo que recomendó), (3) alertas
// proactivas diarias. Solo lectura sobre el negocio; escribe únicamente fodi_sugerencias y fodi_alertas.
const DAY_MS = 24 * 60 * 60 * 1000;
const A = () => require('./adminAsistente'); // carga perezosa: adminAsistente también requiere este módulo
const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const pct1 = (n) => Math.round(n * 10) / 10;

async function cargarCostos(db) {
    const lee = (c) => db.collection(c).get().then((sn) => sn.docs.map((d) => ({ ...d.data(), id: d.id })));
    const [insumos, recetas, platos, promos, cfgDoc, productos] = await Promise.all([
        lee('costos_insumos'), lee('costos_recetas'), lee('costos_platos'), lee('costos_promos'),
        db.collection('costos_ajustes').doc('config').get(), lee('productos')
    ]);
    const cfg = cfgDoc.exists ? cfgDoc.data() : {};
    const colchonPct = Number(cfg.colchonPct) || 0;
    const margenObjetivoPct = Number(cfg.margenObjetivoPct) || 0;
    const margenPromoPct = Number(cfg.margenPromoPct) || margenObjetivoPct;
    return { insumos, recetas, platos, promos, productos, colchonPct, margenObjetivoPct, margenPromoPct };
}

/** Costo y margen de cada plato y promo (misma lógica que la calculadora de costos del admin). */
function calcularMenu(c) {
    const { calcularPlatos } = require('./costos');
    const calc = calcularPlatos({ insumos: c.insumos, recetas: c.recetas, platos: c.platos }, { colchonPct: c.colchonPct, margenObjetivoPct: c.margenObjetivoPct });
    const porId = Object.fromEntries(calc.map((x) => [x.id, x]));
    const filasPlatos = calc.map((x) => ({ tipo: 'plato', id: x.id, nombre: x.plato, activo: x.activo, precio: x.precio, costo: x.costo, costoReal: x.costo_real, margenPct: x.margen_pct, objetivo: c.margenObjetivoPct, sugerido: x.precio_sugerido, alerta: x.alerta }));
    const filasPromos = c.promos.map((p) => {
        let costo = 0, real = 0, roto = false;
        for (const it of p.items || []) {
            const pl = it.tipo === 'plato' ? porId[it.id] : null;
            if (!pl) { roto = true; continue; }
            const q = Number(it.cantidad) || 1;
            costo += q * pl.costo; real += q * pl.costo_real;
        }
        const precio = Number(p.precio) || 0, m = c.margenPromoPct / 100;
        return {
            tipo: 'promo', id: p.id, nombre: p.nombre || p.id, activo: true, precio, costo: Math.round(costo), costoReal: Math.round(real),
            margenPct: precio && costo ? pct1(((precio - costo) / precio) * 100) : null, objetivo: c.margenPromoPct,
            sugerido: costo > 0 && m > 0 && m < 1 ? Math.ceil(costo / (1 - m) / 500) * 500 : null,
            alerta: roto ? 'referencias a platos inexistentes' : !costo ? 'sin costo' : undefined
        };
    });
    return [...filasPlatos, ...filasPromos];
}

// ───────── 1. Rentabilidad real del menú ─────────
async function rentabilidadMenu(db, args = {}) {
    const a = A();
    const hoy = a.bogotaDateKey(Date.now());
    const hasta = args.hasta || hoy;
    const desde = args.desde || a.bogotaDateKey(a.dateKeyToMs(hasta) - 29 * DAY_MS);
    const r = a.parseRango(desde, hasta);
    if (r.error) return { error: r.error };
    const [costos, ventas] = await Promise.all([cargarCostos(db), a.cargarPedidosRango(db, r.desdeMs, r.hastaMs)]);
    const menu = calcularMenu(costos);
    const nombreProd = Object.fromEntries(costos.productos.map((p) => [p.id, p.nombre]));
    const porClave = new Map();
    const docs = [...costos.platos.map((d) => ({ tipo: 'plato', d })), ...costos.promos.map((d) => ({ tipo: 'promo', d }))];
    for (const { tipo, d } of docs) {
        const fila = menu.find((m) => m.id === d.id && m.tipo === tipo);
        if (!fila || !(fila.costo > 0)) continue;
        for (const k of [norm(d.nombre), d.productoMenuId ? norm(nombreProd[d.productoMenuId]) : '']) if (k && !porClave.has(k)) porClave.set(k, fila);
    }
    const vendidos = new Map();
    for (const v of ventas) for (const it of v.items) {
        const n = String(it.productName || it.name || '').trim();
        if (!n) continue;
        const e = vendidos.get(n) || { cant: 0, monto: 0 };
        e.cant += Number(it.quantity) || 0; e.monto += Number(it.subtotal) || 0; vendidos.set(n, e);
    }
    const filas = [], sinCosto = [];
    for (const [n, e] of vendidos) {
        if (e.cant <= 0) continue;
        const f = porClave.get(norm(n));
        if (!f) { sinCosto.push({ producto: n, unidades: e.cant, ingresos: Math.round(e.monto) }); continue; }
        const precioProm = e.monto / e.cant;
        filas.push({
            producto: n, tipo: f.tipo, unidades: e.cant, ingresos: Math.round(e.monto), precio_promedio_real: Math.round(precioProm),
            costo_unitario: f.costo, margen_pct_real: precioProm ? pct1(((precioProm - f.costo) / precioProm) * 100) : null,
            utilidad_total: Math.round(e.monto - e.cant * f.costo), margen_objetivo_pct: f.objetivo
        });
    }
    const med = (arr) => { const s = [...arr].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : 0; };
    const mUni = med(filas.map((f) => f.unidades)), mMar = med(filas.map((f) => f.margen_pct_real ?? 0));
    for (const f of filas) {
        const pop = f.unidades >= mUni, mar = (f.margen_pct_real ?? 0) >= mMar;
        f.clase = pop && mar ? 'estrella' : pop ? 'caballo (vende mucho, deja poco)' : mar ? 'enigma (deja bien, vende poco)' : 'perro';
    }
    filas.sort((x, y) => y.utilidad_total - x.utilidad_total);
    const totIng = filas.reduce((s, f) => s + f.ingresos, 0), totUt = filas.reduce((s, f) => s + f.utilidad_total, 0);
    return {
        rango: { desde, hasta, dias: r.dias },
        cobertura: { productos_con_costo: filas.length, ingresos_cubiertos: totIng, utilidad_bruta_cubierta: totUt, margen_global_pct: totIng ? pct1((totUt / totIng) * 100) : null },
        mejores_aportes: filas.slice(0, 10), peores_aportes: filas.slice(-5).reverse(),
        bajo_objetivo: filas.filter((f) => f.margen_pct_real != null && f.margen_pct_real < f.margen_objetivo_pct).slice(0, 10),
        vendidos_sin_costo: sinCosto.sort((x, y) => y.ingresos - x.ingresos).slice(0, 12),
        nota: 'utilidad_total = ingresos − unidades × costo con colchón (sin gastos fijos). Los productos "vendidos_sin_costo" no tienen plato/promo con el mismo nombre en Costos y recetas (o no están vinculados en Conexión): sugiere vincularlos. Margen de promos medido contra su objetivo propio.'
    };
}

// ───────── 2. Sugerencias que FODI registra y evalúa ─────────
const SUG_MAX_PENDIENTES = 30;
async function valorMetrica(db, s, desdeMs, hastaMs) {
    const a = A();
    const ventas = await a.cargarPedidosRango(db, desdeMs, hastaMs);
    if (s.metrica === 'producto' && s.producto) {
        const k = norm(s.producto);
        let u = 0, m = 0;
        for (const v of ventas) for (const it of v.items) if (norm(it.productName || it.name).includes(k)) { u += Number(it.quantity) || 0; m += Number(it.subtotal) || 0; }
        return { unidades: u, ingresos: Math.round(m) };
    }
    const r = a.resumenDe(ventas);
    return { ventas: r.ventas, pedidos: r.pedidos };
}
const claveValor = (s) => (s.metrica === 'producto' ? 'unidades' : 'ventas');

async function registrarSugerencia(db, args = {}) {
    const a = A();
    const titulo = String(args.titulo || '').trim().slice(0, 140);
    if (!titulo) return { error: 'Falta el título de la sugerencia.' };
    const metrica = args.metrica === 'producto' ? 'producto' : 'ventas_total';
    if (metrica === 'producto' && !String(args.producto || '').trim()) return { error: 'Para métrica "producto" indica el nombre del producto.' };
    const plazo = Math.min(Math.max(Math.trunc(Number(args.plazo_dias)) || 14, 7), 45);
    const pend = await db.collection('fodi_sugerencias').where('estado', '==', 'pendiente').get();
    if (pend.size >= SUG_MAX_PENDIENTES) return { error: 'Hay demasiadas sugerencias pendientes de evaluar.' };
    const ahora = Date.now(), dia = a.dateKeyToMs(a.bogotaDateKey(ahora));
    const s = { titulo, detalle: String(args.detalle || '').trim().slice(0, 500), metrica, producto: String(args.producto || '').trim().slice(0, 80), plazoDias: plazo };
    const base = await valorMetrica(db, s, dia - plazo * DAY_MS, dia);
    const ref = await db.collection('fodi_sugerencias').add({ ...s, estado: 'pendiente', creadaMs: ahora, fecha: a.bogotaDateKey(ahora), baseline: base, evaluarDesdeMs: dia + DAY_MS, evaluarHastaMs: dia + (1 + plazo) * DAY_MS });
    return { ok: true, id: ref.id, evaluara_el: a.bogotaDateKey(dia + (1 + plazo) * DAY_MS), nota: 'Registrada. Cuando venza el plazo, FODI compara automáticamente las ventas/unidades de las dos ventanas y aprende del resultado.' };
}

/** Evalúa las sugerencias vencidas (máx. 3 por llamada) y devuelve su resultado. */
async function evaluarVencidas(db, max = 3) {
    const a = A();
    const ahora = Date.now();
    const snap = await db.collection('fodi_sugerencias').where('estado', '==', 'pendiente').get();
    const vencidas = snap.docs.filter((d) => (d.data().evaluarHastaMs || Infinity) <= ahora).slice(0, max);
    const out = [];
    for (const d of vencidas) {
        const s = d.data();
        try {
            const despues = await valorMetrica(db, s, s.evaluarDesdeMs, s.evaluarHastaMs);
            const k = claveValor(s), antes = Number(s.baseline && s.baseline[k]) || 0, ahoraV = Number(despues[k]) || 0;
            const cambio = antes > 0 ? pct1(((ahoraV - antes) / antes) * 100) : null;
            const veredicto = cambio == null ? 'sin base para comparar' : cambio >= 10 ? 'mejoró' : cambio <= -10 ? 'empeoró' : 'sin cambio claro';
            const res = { metrica: k, antes, despues: ahoraV, cambio_pct: cambio, veredicto };
            await d.ref.update({ estado: 'evaluada', resultado: res, evaluadaMs: ahora });
            out.push({ titulo: s.titulo, fecha: s.fecha, plazo_dias: s.plazoDias, ...res });
        } catch (e) { console.error('evaluarVencidas', d.id, e && e.message); }
    }
    return out;
}

async function listarSugerencias(db, args = {}) {
    const snap = await db.collection('fodi_sugerencias').get();
    const todas = snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((x, y) => (y.creadaMs || 0) - (x.creadaMs || 0));
    const f = (x) => ({ titulo: x.titulo, fecha: x.fecha, metrica: x.metrica, producto: x.producto || undefined, plazo_dias: x.plazoDias, estado: x.estado, resultado: x.resultado });
    const pend = todas.filter((x) => x.estado === 'pendiente').map(f), eval_ = todas.filter((x) => x.estado === 'evaluada').map(f);
    const parte = args.parte === 'pendientes' ? { pendientes: pend } : args.parte === 'evaluadas' ? { evaluadas: eval_.slice(0, 15) } : { pendientes: pend, evaluadas: eval_.slice(0, 15) };
    return { ...parte, nota: 'Un cambio de ventas tras una sugerencia no prueba causalidad (estacionalidad, clima, quincena). Úsalo como pista.' };
}

// ───────── 3. Alertas proactivas ─────────
async function calcularAlertas(db) {
    const a = A();
    const { alzasDePrecio } = require('./costos');
    const costos = await cargarCostos(db);
    const alertas = [];
    // a) insumos que subieron de precio (7 días)
    const alzas = alzasDePrecio({ insumos: costos.insumos, recetas: costos.recetas, platos: costos.platos }, { dias: 7 });
    for (const z of alzas.slice(0, 5)) alertas.push({ tipo: 'alza_insumo', severidad: z.alza_pct >= 15 ? 'alta' : 'media', titulo: `Subió ${z.insumo}: +${z.alza_pct}%`, detalle: `De ${z.desde} a ${z.hasta}${z.platos_afectados && z.platos_afectados.length ? `. Afecta: ${z.platos_afectados.slice(0, 5).join(', ')}` : ''}. Revisa los precios de esos platos.` });
    // b) márgenes bajo el objetivo
    const menu = calcularMenu(costos);
    const bajos = menu.filter((m) => m.activo && m.margenPct != null && m.margenPct < m.objetivo).sort((x, y) => x.margenPct - y.margenPct);
    for (const m of bajos.slice(0, 5)) alertas.push({ tipo: 'margen_bajo', severidad: m.margenPct < m.objetivo - 15 ? 'alta' : 'media', titulo: `${m.tipo === 'promo' ? 'Promo' : 'Plato'} con margen bajo: ${m.nombre}`, detalle: `Margen ${m.margenPct}% vs objetivo ${m.objetivo}%. Precio ${m.precio}${m.sugerido ? `, sugerido ${m.sugerido}` : ''}.` });
    if (bajos.length > 5) alertas.push({ tipo: 'margen_bajo', severidad: 'media', titulo: `Hay ${bajos.length - 5} productos más con margen bajo`, detalle: 'Pídeme la lista completa de rentabilidad.' });
    // c) ventas de ayer vs mismo día de las últimas 4 semanas
    const hoyMs = a.dateKeyToMs(a.bogotaDateKey(Date.now())), ayer = hoyMs - DAY_MS;
    const ventas = await a.cargarPedidosRango(db, ayer - 28 * DAY_MS, hoyMs);
    const porDia = new Map();
    for (const v of ventas) { const k = a.bogotaDateKey(v.ms); porDia.set(k, (porDia.get(k) || 0) + v.total); }
    const totAyer = porDia.get(a.bogotaDateKey(ayer)) || 0;
    const previos = [7, 14, 21, 28].map((n) => porDia.get(a.bogotaDateKey(ayer - n * DAY_MS)) || 0).filter((x) => x > 0);
    if (previos.length >= 2) {
        const prom = previos.reduce((s, x) => s + x, 0) / previos.length, cambio = pct1(((totAyer - prom) / prom) * 100);
        if (cambio <= -25) alertas.push({ tipo: 'ventas_caida', severidad: cambio <= -40 ? 'alta' : 'media', titulo: `Ventas de ayer ${cambio}% vs un día igual normal`, detalle: `Ayer ${Math.round(totAyer)} vs promedio ${Math.round(prom)} de los últimos ${previos.length} mismos días. ¿Lluvia, cierre, falla de un canal?` });
        else if (cambio >= 30) alertas.push({ tipo: 'ventas_alza', severidad: 'info', titulo: `Ayer vendiste +${cambio}% sobre lo normal`, detalle: `Ayer ${Math.round(totAyer)} vs promedio ${Math.round(prom)}. Vale la pena entender qué funcionó.` });
    }
    // d) resultados de sugerencias recién evaluadas
    const evaluadas = await evaluarVencidas(db, 3);
    for (const e of evaluadas) alertas.push({ tipo: 'sugerencia_evaluada', severidad: e.veredicto === 'empeoró' ? 'media' : 'info', titulo: `Resultado de mi sugerencia: ${e.titulo}`, detalle: `${e.veredicto}: ${e.metrica} ${e.antes} → ${e.despues}${e.cambio_pct != null ? ` (${e.cambio_pct}%)` : ''} en ${e.plazo_dias} días.` });
    return alertas;
}

async function guardarAlertas(db) {
    const a = A();
    const items = await calcularAlertas(db);
    const fecha = a.bogotaDateKey(Date.now());
    await db.collection('fodi_alertas').doc(fecha).set({ fecha, creadaMs: Date.now(), items });
    return { fecha, items };
}

async function leerAlertas(db) {
    const sn = await db.collection('fodi_alertas').orderBy('creadaMs', 'desc').limit(1).get();
    return sn.empty ? null : sn.docs[0].data();
}

module.exports = { norm, cargarCostos, calcularMenu, rentabilidadMenu, registrarSugerencia, evaluarVencidas, listarSugerencias, calcularAlertas, guardarAlertas, leerAlertas };
