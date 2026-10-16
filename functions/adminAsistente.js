'use strict';

// Asistente de IA del admin (SOLO LECTURA). El modelo elige herramienta y redacta; las cifras
// las calcula este módulo. Núcleo puro (testeable sin Firestore) + cargadores con Admin SDK.
//
// Reglas de datos (ver memorias reference_consultas_ventas_produccion y saldos_historial_limite_500):
//  - Pedidos cerrados viven en `pedidos_archivados`: se unen con `pedidos` y se deduplica por id.
//  - Fecha de venta = paidAt || deliveredAt || createdAt, en hora Bogotá (UTC-5 fijo).
//  - NUNCA `limit` en consultas que alimentan totales; el rango se acota por fecha.

const BOGOTA_OFFSET_MS = 5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_RANGO_DIAS = 400;
// Un pedido se crea antes de cobrarse: se trae con createdAt desde N días antes del rango y
// luego se filtra por la fecha real de venta.
const MARGEN_CREACION_DIAS = 7;
const MAX_RESULT_CHARS = 6000;

// ---------- Fechas (Bogotá) ----------

function toMs(v) {
    if (v == null || v === '') return 0;
    if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
    if (typeof v.toMillis === 'function') return v.toMillis();
    if (typeof v.toDate === 'function') return v.toDate().getTime();
    if (typeof v === 'object' && typeof v._seconds === 'number') return v._seconds * 1000 + Math.floor((v._nanoseconds || 0) / 1e6);
    if (v instanceof Date) return v.getTime();
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
}

function bogotaDateKey(ms) {
    return new Date(ms - BOGOTA_OFFSET_MS).toISOString().slice(0, 10);
}

function dateKeyToMs(key) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(key || ''));
    if (!m) return null;
    const ms = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) + BOGOTA_OFFSET_MS;
    return bogotaDateKey(ms) === `${m[1]}-${m[2]}-${m[3]}` ? ms : null;
}

// { desdeMs (inicio día desde), hastaMs (fin exclusivo del día hasta), dias } o { error }
function parseRango(desde, hasta) {
    const a = dateKeyToMs(desde);
    const b = dateKeyToMs(hasta);
    if (a == null || b == null) return { error: 'Fechas inválidas: usa formato YYYY-MM-DD.' };
    if (b < a) return { error: '"hasta" es anterior a "desde".' };
    const dias = Math.round((b - a) / DAY_MS) + 1;
    if (dias > MAX_RANGO_DIAS) return { error: `Rango demasiado grande (${dias} días, máximo ${MAX_RANGO_DIAS}).` };
    return { desdeMs: a, hastaMs: b + DAY_MS, dias };
}

function claveGrupo(ms, agrupar) {
    const dia = bogotaDateKey(ms);
    if (agrupar === 'mes') return dia.slice(0, 7);
    if (agrupar === 'semana') {
        // lunes de la semana (Bogotá)
        const d = new Date(ms - BOGOTA_OFFSET_MS);
        const dow = (d.getUTCDay() + 6) % 7; // lunes=0
        return bogotaDateKey(ms - dow * DAY_MS);
    }
    return dia;
}

// ---------- Normalización de pedidos ----------

function totalPedido(o) {
    const t = Number(o.total);
    if (Number.isFinite(t) && t > 0) return t;
    return (Number(o.subtotal) || 0) + (Number(o.deliveryFee) || 0);
}

function fechaVentaMs(o) {
    return toMs(o.paidAt) || toMs(o.deliveredAt) || toMs(o.createdAt);
}

function esPagado(o) {
    const m = String(o.paymentMethod || '').toLowerCase();
    if (!m || m === 'pendiente') return false;
    if (o.paidAt) return true;
    if (o.status === 'entregado' || o.status === 'enviado') return true;
    return o.isAdminOrder === true || o.source === 'admin_pos';
}

// null si no es una venta real (anulado, cancelado, sin pagar)
function normalizarVenta(id, raw) {
    if (!raw) return null;
    if (raw.voided === true || raw.anulado === true) return null;
    if (raw.status === 'cancelado') return null;
    if (!esPagado(raw)) return null;
    const total = totalPedido(raw);
    const metodo = String(raw.paymentMethod || '').toLowerCase();
    let partes;
    if (metodo === 'split' && Array.isArray(raw.paymentSplit) && raw.paymentSplit.length) {
        partes = raw.paymentSplit
            .map((s) => ({ metodo: String(s.method || 'otro').toLowerCase(), monto: Number(s.amount) || 0 }))
            .filter((s) => s.monto > 0);
    }
    if (!partes || !partes.length) partes = [{ metodo: metodo === 'split' ? 'otro' : metodo, monto: total }];
    return {
        id,
        ms: fechaVentaMs(raw),
        total,
        domicilio: Number(raw.deliveryFee) || 0,
        metodo,
        partes,
        origen: String(raw.source || 'desconocido'),
        tipo: String(raw.orderType || 'sin_tipo'),
        items: Array.isArray(raw.items) ? raw.items : []
    };
}

// Une pedidos + pedidos_archivados (dedupe por id) y deja solo ventas reales con fecha en rango.
function unirVentas(listas, desdeMs, hastaMs) {
    const vistos = new Set();
    const out = [];
    for (const lista of listas) {
        for (const { id, data } of lista) {
            if (vistos.has(id)) continue;
            vistos.add(id);
            const v = normalizarVenta(id, data);
            if (v && v.ms >= desdeMs && v.ms < hastaMs) out.push(v);
        }
    }
    return out;
}

async function cargarPedidosRango(db, desdeMs, hastaMs) {
    const admin = require('firebase-admin');
    const Timestamp = admin.firestore.Timestamp;
    const ini = Timestamp.fromMillis(desdeMs - MARGEN_CREACION_DIAS * DAY_MS);
    const fin = Timestamp.fromMillis(hastaMs);
    const consulta = (col) => db.collection(col)
        .where('createdAt', '>=', ini)
        .where('createdAt', '<', fin)
        .get()
        .then((snap) => snap.docs.map((d) => ({ id: d.id, data: d.data() })));
    const [activos, archivados] = await Promise.all([consulta('pedidos'), consulta('pedidos_archivados')]);
    return unirVentas([activos, archivados], desdeMs, hastaMs);
}

// ---------- Cálculos ----------

const redondear = (n) => Math.round(n);

function resumenDe(ventas) {
    const total = ventas.reduce((s, v) => s + v.total, 0);
    const dom = ventas.reduce((s, v) => s + v.domicilio, 0);
    return {
        pedidos: ventas.length,
        ventas: redondear(total),
        ticket_promedio: ventas.length ? redondear(total / ventas.length) : 0,
        domicilios_cobrados: redondear(dom)
    };
}

function resumenVentas(ventas, agrupar) {
    const out = { total: resumenDe(ventas) };
    if (agrupar === 'dia' || agrupar === 'semana' || agrupar === 'mes') {
        const grupos = new Map();
        for (const v of ventas) {
            const k = claveGrupo(v.ms, agrupar);
            if (!grupos.has(k)) grupos.set(k, []);
            grupos.get(k).push(v);
        }
        out.por_periodo = [...grupos.keys()].sort().map((k) => ({ periodo: k, ...resumenDe(grupos.get(k)) }));
    }
    return out;
}

function ventasPorMetodo(ventas) {
    const m = new Map();
    for (const v of ventas) {
        for (const p of v.partes) {
            const e = m.get(p.metodo) || { monto: 0, pedidos: new Set() };
            e.monto += p.monto;
            e.pedidos.add(v.id);
            m.set(p.metodo, e);
        }
    }
    const metodos = [...m.entries()]
        .map(([metodo, e]) => ({ metodo, monto: redondear(e.monto), pedidos: e.pedidos.size }))
        .sort((a, b) => b.monto - a.monto);
    return { total: redondear(metodos.reduce((s, x) => s + x.monto, 0)), metodos };
}

function ventasPorOrigenTipo(ventas) {
    const agrupar = (campo) => {
        const m = new Map();
        for (const v of ventas) {
            const e = m.get(v[campo]) || { monto: 0, pedidos: 0 };
            e.monto += v.total; e.pedidos += 1;
            m.set(v[campo], e);
        }
        return [...m.entries()].map(([k, e]) => ({ [campo]: k, monto: redondear(e.monto), pedidos: e.pedidos }))
            .sort((a, b) => b.monto - a.monto);
    };
    return { por_origen: agrupar('origen'), por_tipo: agrupar('tipo') };
}

function topProductos(ventas, { categoria, orden = 'cantidad', n = 10 } = {}) {
    const cat = categoria ? String(categoria).toLowerCase() : '';
    const m = new Map();
    for (const v of ventas) {
        for (const it of v.items) {
            const nombre = String(it.productName || it.name || '').trim();
            if (!nombre) continue;
            if (cat && String(it.categoryName || '').toLowerCase() !== cat) continue;
            const cant = Number(it.quantity) || 0;
            const monto = Number(it.subtotal) || 0;
            const e = m.get(nombre) || { cantidad: 0, monto: 0, categoria: it.categoryName || '' };
            e.cantidad += cant; e.monto += monto;
            m.set(nombre, e);
        }
    }
    const lim = Math.min(Math.max(Math.trunc(Number(n)) || 10, 1), 30);
    const key = orden === 'monto' ? 'monto' : 'cantidad';
    const filas = [...m.entries()]
        .map(([producto, e]) => ({ producto, categoria: e.categoria, cantidad: e.cantidad, monto: redondear(e.monto) }))
        .filter((r) => r.cantidad > 0)
        .sort((a, b) => b[key] - a[key]);
    return { orden: key, distintos: filas.length, top: filas.slice(0, lim) };
}

// Gasto real: sin tipo (gasto de caja), 'caja' o 'externo'. 'traslado' y 'ajuste' NO cuentan.
function esGastoReal(g) {
    const t = g && g.tipo;
    return t == null || t === '' || t === 'caja' || t === 'externo';
}

function resumenGastos(gastos, desdeMs, hastaMs, agrupar = 'categoria') {
    const campo = agrupar === 'proveedor' ? 'proveedor' : agrupar === 'metodo' ? 'paymentMethod' : 'categoria';
    const m = new Map();
    let total = 0, cantidad = 0;
    for (const g of gastos) {
        if (!esGastoReal(g)) continue;
        const ms = toMs(g.registradoAt);
        if (ms < desdeMs || ms >= hastaMs) continue;
        const monto = Number(g.monto) || 0;
        const k = String(g[campo] || '(sin dato)');
        const e = m.get(k) || { monto: 0, registros: 0 };
        e.monto += monto; e.registros += 1;
        m.set(k, e);
        total += monto; cantidad += 1;
    }
    const filas = [...m.entries()].map(([clave, e]) => ({ [agrupar === 'proveedor' || agrupar === 'metodo' ? agrupar : 'categoria']: clave, monto: redondear(e.monto), registros: e.registros }))
        .sort((a, b) => b.monto - a.monto);
    return { total: redondear(total), registros: cantidad, agrupado_por: agrupar, detalle: filas };
}

function resumenCierres(cierres, desdeMs, hastaMs) {
    const filas = cierres
        .map((c) => ({ c, ms: toMs(c.closedAt) }))
        .filter((x) => x.ms >= desdeMs && x.ms < hastaMs)
        .sort((a, b) => a.ms - b.ms)
        .map(({ c, ms }) => ({
            fecha: bogotaDateKey(ms),
            ingresos: redondear(Number(c.ingresosTotal) || 0),
            gastos: redondear(Number(c.gastosTotal) || 0),
            neto: redondear(Number(c.grandTotal) || 0),
            transacciones: Number(c.transactionCount) || 0,
            anulados: Number(c.voidedCount) || 0,
            por_metodo: c.methodTotals || {}
        }));
    return {
        cierres: filas.length,
        ingresos: filas.reduce((s, f) => s + f.ingresos, 0),
        gastos: filas.reduce((s, f) => s + f.gastos, 0),
        neto: filas.reduce((s, f) => s + f.neto, 0),
        detalle: filas
    };
}

// Recorta el resultado de una herramienta para no inflar tokens; avisa si se truncó.
function recortarResultado(obj, max = MAX_RESULT_CHARS) {
    let texto = JSON.stringify(obj);
    if (texto.length <= max) return texto;
    const copia = JSON.parse(texto);
    for (const k of Object.keys(copia)) {
        if (Array.isArray(copia[k])) {
            while (copia[k].length > 1 && JSON.stringify(copia).length > max - 120) copia[k].pop();
        }
    }
    copia.truncado = true;
    copia.aviso = 'Resultado recortado por tamaño: hay más filas de las mostradas. Los totales sí son completos.';
    texto = JSON.stringify(copia);
    return texto.length > max ? texto.slice(0, max) : texto;
}

// ---------- Herramientas ----------

const FECHAS = {
    desde: { type: 'string', description: 'Fecha inicial YYYY-MM-DD (hora Bogotá), inclusive.' },
    hasta: { type: 'string', description: 'Fecha final YYYY-MM-DD (hora Bogotá), inclusive.' }
};


const DIAS_SEMANA = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
function ventasPorDiaHora(ventas) {
    const dias = DIAS_SEMANA.map((nombre) => ({ dia: nombre, pedidos: 0, ventas: 0 }));
    const horas = Array.from({ length: 24 }, (_, h) => ({ hora: `${String(h).padStart(2, '0')}:00`, pedidos: 0, ventas: 0 }));
    for (const v of ventas) {
        if (!v.ms) continue;
        const d = new Date(v.ms - BOGOTA_OFFSET_MS);
        const dd = dias[d.getUTCDay()];
        const hh = horas[d.getUTCHours()];
        dd.pedidos++; dd.ventas += v.total;
        hh.pedidos++; hh.ventas += v.total;
    }
    const fmt = (a) => a.map((x) => ({ ...x, ventas: redondear(x.ventas) }));
    return { por_dia_semana: fmt(dias), por_hora: fmt(horas).filter((x) => x.pedidos > 0) };
}

const TOOLS = [
    {
        name: 'resumen_ventas',
        description: 'Ventas totales, número de pedidos, ticket promedio y domicilios cobrados de un rango; opcionalmente desglosado por día, semana (lunes) o mes.',
        input_schema: { type: 'object', properties: { ...FECHAS, agrupar: { type: 'string', enum: ['ninguno', 'dia', 'semana', 'mes'] } }, required: ['desde', 'hasta'] }
    },
    {
        name: 'ventas_por_metodo_pago',
        description: 'Ventas por método de pago (efectivo, bancolombia, nequi, etc.). Los pagos divididos se reparten por método.',
        input_schema: { type: 'object', properties: { ...FECHAS }, required: ['desde', 'hasta'] }
    },
    {
        name: 'top_productos',
        description: 'Productos más vendidos del rango, por cantidad o por monto. Puede filtrar por categoría exacta.',
        input_schema: { type: 'object', properties: { ...FECHAS, categoria: { type: 'string' }, orden: { type: 'string', enum: ['cantidad', 'monto'] }, n: { type: 'integer', description: 'Cuántos devolver (1-30, por defecto 10).' } }, required: ['desde', 'hasta'] }
    },
    {
        name: 'ventas_por_origen_tipo',
        description: 'Ventas por origen (web, agente WhatsApp, POS admin...) y por tipo de pedido (domicilio, mesa, para llevar).',
        input_schema: { type: 'object', properties: { ...FECHAS }, required: ['desde', 'hasta'] }
    },
    {
        name: 'gastos',
        description: 'Gastos reales (de caja y externos; excluye traslados y ajustes) del rango, agrupados por categoría, proveedor o método de pago.',
        input_schema: { type: 'object', properties: { ...FECHAS, agrupar: { type: 'string', enum: ['categoria', 'proveedor', 'metodo'] } }, required: ['desde', 'hasta'] }
    },
    {
        name: 'cierres_caja',
        description: 'Cierres de caja del rango (por fecha real de cierre, hora Bogotá): ingresos, gastos, neto por cierre.',
        input_schema: { type: 'object', properties: { ...FECHAS }, required: ['desde', 'hasta'] }
    },
    {
        name: 'catalogo_productos',
        description: 'Catálogo actual de productos (nombre, precio, categoría, estado). Opcionalmente filtra por texto.',
        input_schema: { type: 'object', properties: { buscar: { type: 'string' } } }
    },
    {
        name: 'ventas_por_dia_hora',
        description: 'Distribución de ventas por día de la semana y por hora del día (hora Bogotá): sirve para horas pico, días fuertes/flojos y turnos.',
        input_schema: { type: 'object', properties: { ...FECHAS }, required: ['desde', 'hasta'] }
    },
    {
        name: 'costos_fijos',
        description: 'Costos fijos mensuales configurados (arriendo, nómina, servicios...) y margen mínimo objetivo. Sirve para punto de equilibrio y rentabilidad.',
        input_schema: { type: 'object', properties: {} }
    },
    {
        name: 'comparar_periodos',
        description: 'Compara las ventas de dos rangos (A y B) con diferencia absoluta y porcentual.',
        input_schema: { type: 'object', properties: { a_desde: { type: 'string' }, a_hasta: { type: 'string' }, b_desde: { type: 'string' }, b_hasta: { type: 'string' } }, required: ['a_desde', 'a_hasta', 'b_desde', 'b_hasta'] }
    }
];

function pct(a, b) {
    return b ? Math.round(((a - b) / b) * 1000) / 10 : null;
}

function compararResumenes(ra, rb) {
    return {
        a: ra, b: rb,
        diferencia: {
            ventas: ra.ventas - rb.ventas,
            ventas_pct: pct(ra.ventas, rb.ventas),
            pedidos: ra.pedidos - rb.pedidos,
            pedidos_pct: pct(ra.pedidos, rb.pedidos),
            ticket_promedio: ra.ticket_promedio - rb.ticket_promedio
        }
    };
}

async function cargarGastos(db, desdeMs, hastaMs) {
    const admin = require('firebase-admin');
    const T = admin.firestore.Timestamp;
    // registradoAt puede ser número (Date.now()) o Timestamp según quién lo creó: se consultan ambos.
    const [num, ts] = await Promise.all([
        db.collection('gastos_caja').where('registradoAt', '>=', desdeMs).where('registradoAt', '<', hastaMs).get(),
        db.collection('gastos_caja').where('registradoAt', '>=', T.fromMillis(desdeMs)).where('registradoAt', '<', T.fromMillis(hastaMs)).get()
    ]);
    const vistos = new Map();
    for (const s of [num, ts]) for (const d of s.docs) vistos.set(d.id, d.data());
    return [...vistos.values()];
}

async function cargarCierres(db, desdeMs, hastaMs) {
    const admin = require('firebase-admin');
    const T = admin.firestore.Timestamp;
    const [num, ts] = await Promise.all([
        db.collection('cierres_caja').where('closedAt', '>=', desdeMs).where('closedAt', '<', hastaMs).get(),
        db.collection('cierres_caja').where('closedAt', '>=', T.fromMillis(desdeMs)).where('closedAt', '<', T.fromMillis(hastaMs)).get()
    ]);
    const vistos = new Map();
    for (const s of [num, ts]) for (const d of s.docs) vistos.set(d.id, d.data());
    return [...vistos.values()];
}

// Ejecuta una herramienta. Devuelve siempre un objeto serializable (errores como { error }).
async function ejecutarHerramienta(db, nombre, args = {}) {
    try {
        if (nombre === 'catalogo_productos') {
            const snap = await db.collection('productos').get();
            const q = String(args.buscar || '').trim().toLowerCase();
            const prods = snap.docs.map((d) => {
                const p = d.data();
                return { nombre: p.nombre || '', precio: Number(p.precio) || 0, categoria: p.categoria || '', estado: String(p.estado || ''), en_menu: p.activo_menu !== false && String(p.estado || '').trim() !== 'paused' };
            }).filter((p) => p.nombre && (!q || `${p.nombre} ${p.categoria}`.toLowerCase().includes(q)));
            return { total: prods.length, productos: prods.slice(0, 60) };
        }
        if (nombre === 'costos_fijos') {
            const d = (await db.collection('configuracion').doc('costos_fijos').get()).data() || {};
            const items = (Array.isArray(d.items) ? d.items : []).map((i) => ({ nombre: String(i.nombre || ''), monto_mensual: Number(i.monto) || 0 }));
            return { items, total_mensual: items.reduce((a, i) => a + i.monto_mensual, 0), margen_minimo_pct: Number(d.margenMinimo) || null };
        }
        if (nombre === 'comparar_periodos') {
            const ra = parseRango(args.a_desde, args.a_hasta);
            const rb = parseRango(args.b_desde, args.b_hasta);
            if (ra.error || rb.error) return { error: ra.error || rb.error };
            const [va, vb] = await Promise.all([
                cargarPedidosRango(db, ra.desdeMs, ra.hastaMs),
                cargarPedidosRango(db, rb.desdeMs, rb.hastaMs)
            ]);
            return compararResumenes(resumenDe(va), resumenDe(vb));
        }
        const r = parseRango(args.desde, args.hasta);
        if (r.error) return { error: r.error };
        const rango = { desde: args.desde, hasta: args.hasta, dias: r.dias };
        if (nombre === 'gastos') {
            return { rango, ...resumenGastos(await cargarGastos(db, r.desdeMs, r.hastaMs), r.desdeMs, r.hastaMs, args.agrupar) };
        }
        if (nombre === 'cierres_caja') {
            return { rango, ...resumenCierres(await cargarCierres(db, r.desdeMs, r.hastaMs), r.desdeMs, r.hastaMs) };
        }
        const ventas = await cargarPedidosRango(db, r.desdeMs, r.hastaMs);
        if (nombre === 'resumen_ventas') return { rango, ...resumenVentas(ventas, args.agrupar) };
        if (nombre === 'ventas_por_metodo_pago') return { rango, ...ventasPorMetodo(ventas) };
        if (nombre === 'top_productos') return { rango, ...topProductos(ventas, args) };
        if (nombre === 'ventas_por_dia_hora') return { rango, ...ventasPorDiaHora(ventas) };
        if (nombre === 'ventas_por_origen_tipo') return { rango, ...ventasPorOrigenTipo(ventas) };
        return { error: `Herramienta desconocida: ${nombre}` };
    } catch (err) {
        return { error: `Falló la consulta: ${(err && err.message) || err}` };
    }
}

module.exports = {
    MAX_RANGO_DIAS, MAX_RESULT_CHARS, TOOLS,
    toMs, bogotaDateKey, dateKeyToMs, parseRango, claveGrupo,
    totalPedido, fechaVentaMs, esPagado, normalizarVenta, unirVentas, cargarPedidosRango,
    resumenDe, resumenVentas, ventasPorDiaHora, ventasPorMetodo, ventasPorOrigenTipo, topProductos,
    esGastoReal, resumenGastos, resumenCierres, compararResumenes, recortarResultado,
    ejecutarHerramienta
};
