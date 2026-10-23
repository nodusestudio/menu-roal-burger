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
        tel: String(raw.customerPhoneDigits || '').replace(/\D/g, ''),
        nombre: String(raw.customerName || '').trim(),
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

// ---------- Variantes, clientes, cupones, recetas ----------

// Etiqueta de variante de una línea: tamaño/sabor/combo (optionLabel) o, si no hay, el tipo de orden.
function etiquetaVariante(it) {
    const lab = String(it.optionLabel || '').trim();
    if (lab) return lab;
    const oo = it.orderOptions || {};
    const partes = [];
    if (oo.type && oo.type !== 'solo') partes.push(String(oo.type));
    if (oo.flavor) partes.push(String(oo.flavor));
    return partes.join(' / ') || 'sin variante';
}

function variantesVendidas(ventas, { producto, n = 8 } = {}) {
    const q = producto ? String(producto).trim().toLowerCase() : '';
    const prods = new Map();
    for (const v of ventas) {
        for (const it of v.items) {
            const nombre = String(it.productName || it.name || '').trim();
            if (!nombre || (q && !nombre.toLowerCase().includes(q))) continue;
            const cant = Number(it.quantity) || 0;
            if (cant <= 0) continue;
            const monto = Number(it.subtotal) || 0;
            const p = prods.get(nombre) || { cantidad: 0, monto: 0, vars: new Map() };
            p.cantidad += cant; p.monto += monto;
            const k = etiquetaVariante(it);
            const e = p.vars.get(k) || { cantidad: 0, monto: 0 };
            e.cantidad += cant; e.monto += monto;
            p.vars.set(k, e);
            prods.set(nombre, p);
        }
    }
    const lim = Math.min(Math.max(Math.trunc(Number(n)) || 8, 1), 20);
    const productos = [...prods.entries()]
        .sort((a, b) => b[1].cantidad - a[1].cantidad)
        .slice(0, q ? 10 : 12)
        .map(([nombre, p]) => ({
            producto: nombre, cantidad: p.cantidad, monto: redondear(p.monto),
            variantes: [...p.vars.entries()]
                .map(([variante, e]) => ({ variante, cantidad: e.cantidad, monto: redondear(e.monto), participacion_pct: Math.round((e.cantidad / p.cantidad) * 1000) / 10 }))
                .sort((a, b) => b.cantidad - a.cantidad).slice(0, lim)
        }));
    return { productos };
}

const MODOS_CLIENTES = ['top', 'recompra', 'inactivos', 'rfm'];

// Agrupa ventas por cliente (teléfono). Las ventas sin teléfono se cuentan aparte.
function agruparClientes(ventas) {
    const m = new Map();
    let sinTelefono = 0;
    for (const v of ventas) {
        if (!v.tel) { sinTelefono++; continue; }
        const c = m.get(v.tel) || { tel: v.tel, nombre: '', pedidos: 0, monto: 0, ultimo: 0 };
        c.pedidos++; c.monto += v.total;
        if (v.ms > c.ultimo) { c.ultimo = v.ms; if (v.nombre) c.nombre = v.nombre; }
        m.set(v.tel, c);
    }
    return { clientes: [...m.values()], sinTelefono };
}

const enmascarar = (tel) => (tel.length > 4 ? `***${tel.slice(-4)}` : tel);

function analisisClientes(ventas, { modo = 'top', n = 10, hastaMs = Date.now(), dias_inactivo = 45 } = {}) {
    const { clientes, sinTelefono } = agruparClientes(ventas);
    const lim = Math.min(Math.max(Math.trunc(Number(n)) || 10, 1), 30);
    const fila = (c) => ({
        cliente: c.nombre || enmascarar(c.tel), telefono: enmascarar(c.tel), pedidos: c.pedidos, monto: redondear(c.monto),
        dias_desde_ultima_compra: Math.floor((hastaMs - c.ultimo) / DAY_MS)
    });
    const base = { clientes_identificados: clientes.length, ventas_sin_telefono: sinTelefono };
    if (modo === 'recompra') {
        const rec = clientes.filter((c) => c.pedidos >= 2);
        return {
            ...base, modo,
            clientes_con_recompra: rec.length,
            tasa_recompra_pct: clientes.length ? Math.round((rec.length / clientes.length) * 1000) / 10 : null,
            pedidos_promedio_por_cliente: clientes.length ? Math.round((clientes.reduce((s, c) => s + c.pedidos, 0) / clientes.length) * 100) / 100 : null,
            distribucion: { '1_pedido': clientes.filter((c) => c.pedidos === 1).length, '2_pedidos': clientes.filter((c) => c.pedidos === 2).length, '3_o_mas': clientes.filter((c) => c.pedidos >= 3).length }
        };
    }
    if (modo === 'inactivos') {
        const umbral = Math.max(7, Math.trunc(Number(dias_inactivo)) || 45);
        const ina = clientes.filter((c) => (hastaMs - c.ultimo) / DAY_MS >= umbral && c.pedidos >= 2)
            .sort((a, b) => b.monto - a.monto);
        return { ...base, modo, dias_inactivo: umbral, criterio: 'clientes con 2+ pedidos en el rango que no compran hace el umbral; ordenados por monto histórico', total_inactivos_valiosos: ina.length, top: ina.slice(0, lim).map(fila) };
    }
    if (modo === 'rfm') {
        if (clientes.length < 5) return { ...base, modo, aviso: 'Muy pocos clientes identificados para segmentar.' };
        // 3 = tercil alto (más reciente / más frecuente / más gasto)
        const rank = (key) => {
            const s = [...clientes].sort((a, b) => b[key] - a[key]);
            const out = new Map();
            s.forEach((c, i) => out.set(c.tel, 3 - Math.min(2, Math.floor((i / s.length) * 3))));
            return out;
        };
        const rR = rank('ultimo');
        const rF = rank('pedidos');
        const rM = rank('monto');
        const seg = new Map();
        for (const c of clientes) {
            const r = rR.get(c.tel), f = rF.get(c.tel), mm = rM.get(c.tel);
            let nombre = 'Ocasionales';
            if (r === 3 && f === 3 && mm === 3) nombre = 'Campeones';
            else if (f >= 2 && mm >= 2 && r >= 2) nombre = 'Leales';
            else if (r === 3 && f === 1) nombre = 'Nuevos';
            else if (r === 1 && (f >= 2 || mm >= 2)) nombre = 'En riesgo de fuga';
            else if (r === 1) nombre = 'Perdidos';
            const e = seg.get(nombre) || { clientes: 0, monto: 0 };
            e.clientes++; e.monto += c.monto;
            seg.set(nombre, e);
        }
        return { ...base, modo, criterio: 'terciles de recencia, frecuencia y monto dentro del rango consultado', segmentos: [...seg.entries()].map(([segmento, e]) => ({ segmento, clientes: e.clientes, monto: redondear(e.monto) })).sort((a, b) => b.monto - a.monto) };
    }
    const top = [...clientes].sort((a, b) => b.monto - a.monto);
    const totalMonto = clientes.reduce((s, c) => s + c.monto, 0);
    const topN = top.slice(0, lim);
    return { ...base, modo: 'top', monto_clientes_identificados: redondear(totalMonto), participacion_top_pct: totalMonto ? Math.round((topN.reduce((s, c) => s + c.monto, 0) / totalMonto) * 1000) / 10 : null, top: topN.map(fila) };
}

async function resumenPuntos(db) {
    const snap = await db.collection('clientes').get();
    let disponibles = 0, acumulados = 0, conSaldo = 0;
    const lista = [];
    for (const d of snap.docs) {
        const c = d.data();
        const pd = Math.max(0, Number(c.puntosDisponibles) || 0);
        disponibles += pd; acumulados += Math.max(0, Number(c.puntosAcumuladosTotal) || 0);
        if (pd > 0) conSaldo++;
        lista.push({ cliente: String(c.nombre || c.name || '').trim() || 'sin nombre', puntos: pd });
    }
    lista.sort((a, b) => b.puntos - a.puntos);
    return {
        clientes_registrados: snap.size, clientes_con_saldo: conSaldo,
        puntos_disponibles_total: disponibles, puntos_acumulados_historico: acumulados,
        pasivo_estimado_cop: disponibles * 10, nota: '100 puntos = $1.000 (1 punto = $10).',
        top_saldos: lista.slice(0, 10)
    };
}

function usoPromos(ventas) {
    let lineas = 0, pedidos = 0, descuento = 0;
    const porTipo = new Map();
    for (const v of ventas) {
        let tuvo = false;
        for (const it of v.items) {
            const oo = it.orderOptions || {};
            let tipo = null;
            if (oo.recommendedDiscount) tipo = 'codigo_del_dia_o_recomendado';
            else if (oo.couponId) tipo = String(oo.couponId).startsWith('2x1') ? 'cupon_2x1' : 'cupon';
            else if (oo.promo2x1) tipo = 'promo_2x1';
            if (!tipo) continue;
            tuvo = true; lineas++;
            const orig = Number(it.originalUnitPrice);
            const ahorro = Number.isFinite(orig) && orig > 0 ? Math.max(0, (orig - (Number(it.unitPrice) || 0)) * (Number(it.quantity) || 0)) : 0;
            descuento += ahorro;
            const e = porTipo.get(tipo) || { lineas: 0, monto: 0 };
            e.lineas++; e.monto += Number(it.subtotal) || 0;
            porTipo.set(tipo, e);
        }
        if (tuvo) pedidos++;
    }
    return {
        pedidos_con_promo: pedidos, pedidos_total: ventas.length,
        pct_pedidos_con_promo: ventas.length ? Math.round((pedidos / ventas.length) * 1000) / 10 : null,
        lineas_con_promo: lineas, descuento_estimado_cop: redondear(descuento),
        por_tipo: [...porTipo.entries()].map(([tipo, e]) => ({ tipo, lineas: e.lineas, monto: redondear(e.monto) }))
    };
}

async function codigoDelDia(db, desde, hasta) {
    const snap = await db.collection('codigo_dia').get();
    const filas = [];
    for (const d of snap.docs) {
        if (d.id < desde || d.id > hasta) continue;
        const x = d.data();
        const cupos = Number(x.cupos) || 0, canjes = Number(x.canjes) || 0;
        filas.push({ fecha: d.id, producto: x.productoNombre || x.productoId || '', cupos, canjes, ocupacion_pct: cupos ? Math.round((canjes / cupos) * 100) : null });
    }
    filas.sort((a, b) => a.fecha.localeCompare(b.fecha));
    const tc = filas.reduce((s, f) => s + f.canjes, 0), tcu = filas.reduce((s, f) => s + f.cupos, 0);
    return { dias_con_codigo: filas.length, cupos_totales: tcu, canjes_totales: tc, ocupacion_pct: tcu ? Math.round((tc / tcu) * 100) : null, dias: filas.slice(-31) };
}

// Costos y recetas propios de FODEXA (colecciones costos_*, motor puro en costos.js). Reemplaza a CostoX.
// Todo se recalcula en vivo; cada plato trae costo_real y costo con colchón (el que mide alertas/margen).
async function costoPorPlato(args = {}, db) {
    const admin = require('firebase-admin');
    const { calcularPlatos, alzasDePrecio } = require('./costos');
    db = db || admin.firestore();
    const lee = (c) => db.collection(c).get().then((sn) => sn.docs.map((d) => ({ ...d.data(), id: d.id })));
    let insumos, recetas, platos, promos, cfgDoc;
    try {
        [insumos, recetas, platos, promos, cfgDoc] = await Promise.all([
            lee('costos_insumos'), lee('costos_recetas'), lee('costos_platos'), lee('costos_promos'),
            db.collection('costos_ajustes').doc('config').get()
        ]);
    } catch (e) {
        return { registrado: false, error: 'No se pudo leer costos y recetas: ' + (e.message || e) };
    }
    const cfg = cfgDoc.exists ? cfgDoc.data() : {};
    const colchonPct = Number(cfg.colchonPct) || 0, margenObjetivoPct = Number(cfg.margenObjetivoPct) || 0;
    const margenPromoPct = Number(cfg.margenPromoPct) || margenObjetivoPct;
    const buscar = String(args.buscar || '').toLowerCase().trim();
    const filtra = (nombre) => !buscar || String(nombre).toLowerCase().includes(buscar);
    const parte = args.parte || 'platos';
    const fuente = 'Costos y recetas de FODEXA (en vivo)';
    if (parte === 'fijos') {
        const fj = await db.collection('configuracion').doc('costos_fijos').get();
        const d = fj.exists ? fj.data() : {};
        const items = (Array.isArray(d.items) ? d.items : []).map((i) => ({ nombre: String(i.nombre || ''), monto_mensual: Number(i.monto) || 0 }));
        return { fuente, costos_fijos: items, total_mensual: items.reduce((a, i) => a + i.monto_mensual, 0), colchon_pct: colchonPct, margen_objetivo_pct: margenObjetivoPct };
    }
    if (parte === 'alzas') {
        const dias = Math.min(Math.max(Number(args.dias) || 30, 1), 365);
        const alzas = alzasDePrecio({ insumos, recetas, platos }, { dias }).filter((a) => filtra(a.insumo));
        return { fuente, ventana_dias: dias, total: alzas.length, alzas, nota: 'Subidas del precio de compra de insumos registradas en su historial; platos_afectados son los platos activos que los usan.' };
    }
    if (parte === 'preparacion') {
        const nombreItem = (it) => { const o = it.tipo === 'receta' ? recetas.find((r) => r.id === it.id) : insumos.find((x) => x.id === it.id); return (o && o.nombre) || it.nombre || it.id; };
        const fila = (tipo, d) => ({ tipo, nombre: d.nombre || d.id, activo: tipo === 'plato' ? d.activo === true : undefined, ingredientes: (d.items || []).map((it) => ({ nombre: nombreItem(it), tipo: it.tipo, cantidad: Number(it.cantidad) || 0 })).slice(0, 40), preparacion: String(d.preparacion || '').slice(0, 2500) || null });
        const todo = [...platos.filter((p) => args.incluir_ideas || p.activo === true).map((d) => fila('plato', d)), ...recetas.map((d) => fila('receta', d))].filter((f) => filtra(f.nombre));
        return { fuente, total: todo.length, sin_preparacion: todo.filter((f) => !f.preparacion).length, items: todo.slice(0, 15), nota: 'preparacion = modo de preparación escrito por el administrador (null si no lo ha escrito). Úsalo para manuales de usuario/fichas; no inventes pasos que no estén.' };
    }
    const calc = calcularPlatos({ insumos, recetas, platos }, { colchonPct, margenObjetivoPct });
    const porId = Object.fromEntries(calc.map((c) => [c.id, c]));
    if (parte === 'promociones') {
        const filas = promos.map((p) => {
            let real = 0, costo = 0, roto = false;
            for (const it of p.items || []) {
                const pl = it.tipo === 'plato' ? porId[it.id] : null;
                if (!pl) { roto = true; continue; }
                real += (Number(it.cantidad) || 1) * pl.costo_real;
                costo += (Number(it.cantidad) || 1) * pl.costo;
            }
            const precio = Number(p.precio) || 0;
            const alerta = roto ? 'referencias a platos inexistentes' : !costo ? 'sin costo' : !precio ? 'sin precio' : costo >= precio ? 'costo con colchón ≥ precio' : undefined;
            const mP = margenPromoPct / 100, sugerido = costo > 0 && mP > 0 && mP < 1 ? Math.ceil(costo / (1 - mP) / 500) * 500 : null;
            return { id: p.id, promo: p.nombre || p.id, precio, costo_real: Math.round(real), costo: Math.round(costo), margen_pct: precio ? Math.round(((precio - costo) / precio) * 1000) / 10 : null, margen_objetivo_promos_pct: margenPromoPct, precio_sugerido: sugerido, alerta };
        }).filter((f) => filtra(f.promo));
        return { fuente, total: filas.length, promociones: filas.sort((a, b) => (a.margen_pct ?? 999) - (b.margen_pct ?? 999)) };
    }
    const activos = calc.filter((c) => c.activo).length;
    // Mientras ningún plato esté marcado activo, se muestran las ideas (si no, la respuesta saldría vacía).
    const todos = args.incluir_ideas === true || activos === 0;
    const filas = calc.filter((c) => (todos || c.activo) && filtra(c.plato)).map((c) => ({
        id: c.id, plato: c.plato, activo: c.activo, precio: c.precio,
        costo_real: c.costo_real, fc_real_pct: c.fc_real_pct, costo: c.costo, fc_pct: c.fc_pct,
        margen: c.margen, margen_pct: c.margen_pct, precio_sugerido: c.precio_sugerido, alerta: c.alerta
    }));
    return {
        fuente, colchon_pct: colchonPct, margen_objetivo_pct: margenObjetivoPct,
        aviso: activos === 0 ? 'Aún no hay platos marcados como activos: se muestran todos como ideas en estudio.' : undefined,
        total_platos: filas.length, platos_activos_en_total: activos, platos_ideas_en_total: calc.length - activos,
        con_alerta: filas.filter((f) => f.alerta).length,
        nota: 'costo_real = precio de compra + merma real + mano de obra. costo = ingredientes × (1+colchón) + mano de obra; fc_pct, margen y precio_sugerido se miden sobre ese costo con colchón. Por defecto solo platos ACTIVOS (los que se venden); incluir_ideas:true añade los que están en estudio. Ordenado de mayor a menor food cost.',
        platos: filas.sort((a, b) => (b.fc_pct ?? 999) - (a.fc_pct ?? 999))
    };
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

// ---------- Redes sociales ----------

function serieSeguidores(docs) {
    const s = docs.map((d) => ({ fecha: String(d.fecha || ''), n: Number(d.seguidores) })).filter((x) => x.fecha && Number.isFinite(x.n)).sort((a, b) => a.fecha.localeCompare(b.fecha));
    if (!s.length) return null;
    const primero = s[0];
    const ultimo = s[s.length - 1];
    return { primero: { fecha: primero.fecha, seguidores: primero.n }, ultimo: { fecha: ultimo.fecha, seguidores: ultimo.n }, cambio: ultimo.n - primero.n, dias_con_dato: s.length };
}

// Publicaciones medidas (Instagram y Facebook) del rango, ordenadas por alcance. `ventasDia` = { 'YYYY-MM-DD': total }.
function topPublicaciones(items, ventasDia = {}, n = 8) {
    const cifra = (u, k) => (Number.isFinite(Number(u?.[k])) && u[k] !== null ? Number(u[k]) : null);
    return items.map((m) => {
        const u = m.ultimo || {};
        const fecha = m.publicadaAtMs ? bogotaDateKey(m.publicadaAtMs) : String(m.fecha || '');
        return {
            red: m.red, tipo: m.tipo || '', fecha, alcance: cifra(u, 'reach'), vistas: cifra(u, 'views'),
            interacciones: cifra(u, 'total_interactions'), likes: cifra(u, 'likes'), comentarios: cifra(u, 'comments'), compartidas: cifra(u, 'shares'),
            guardados: cifra(u, 'saved'), ventas_ese_dia: ventasDia[fecha] ?? null, texto: m.texto || ''
        };
    }).sort((a, b) => (b.alcance ?? b.vistas ?? 0) - (a.alcance ?? a.vistas ?? 0)).slice(0, Math.max(1, Math.min(20, n)));
}

async function redesSociales(db, args, r, ventas) {
    const IG_NOTA = 'Las historias solo se miden 24 h; las publicaciones, 14 días.';
    const leer = async (col, campo, desde, hasta) => (await db.collection(col).where(campo, '>=', desde).where(campo, '<=', hasta).get()).docs.map((d) => ({ id: d.id, ...d.data() }));
    const [igSeg, fbSeg, igMet, fbMet] = await Promise.all([
        leer('instagram_seguidores', 'fecha', args.desde, args.hasta),
        leer('facebook_pagina_dias', 'fecha', args.desde, args.hasta),
        leer('instagram_metricas', 'publicadaAtMs', r.desdeMs, r.hastaMs - 1),
        leer('facebook_metricas', 'publicadaAtMs', r.desdeMs, r.hastaMs - 1)
    ]);
    const ventasDia = {};
    for (const v of ventas) { const k = bogotaDateKey(v.ms); ventasDia[k] = (ventasDia[k] || 0) + v.total; }
    const items = [
        ...igMet.filter((m) => m.tipo !== 'historia').map((m) => ({ ...m, red: 'instagram' })),
        ...fbMet.map((m) => ({ ...m, red: 'facebook' }))
    ];
    const top = topPublicaciones(items, ventasDia, args.n || 8);
    // Texto de las publicaciones destacadas (una lectura por cada una, máx. 8).
    for (const t of top) {
        const src = items.find((m) => m.red === t.red && (m.fecha === t.fecha || (m.publicadaAtMs && bogotaDateKey(m.publicadaAtMs) === t.fecha)) && !m._leido && (m.postId));
        if (!src) continue;
        src._leido = true;
        try { t.texto = String((await db.collection('instagram_posts').doc(src.postId).get()).data()?.caption || '').slice(0, 140); } catch (_) { /* sin texto */ }
    }
    const historias = igMet.filter((m) => m.tipo === 'historia');
    const sumaHist = historias.reduce((a, m) => a + (Number(m.ultimo?.reach) || 0), 0);
    return {
        rango: { desde: args.desde, hasta: args.hasta, dias: r.dias },
        seguidores_instagram: serieSeguidores(igSeg),
        seguidores_facebook: serieSeguidores(fbSeg),
        publicaciones_medidas: items.length,
        top_publicaciones: top,
        historias_instagram: { cantidad: historias.length, alcance_total: sumaHist },
        nota: IG_NOTA
    };
}

// ---------- Calculadora segura (sin eval) ----------

const FUNCIONES_CALC = { round: Math.round, floor: Math.floor, ceil: Math.ceil, abs: Math.abs, sqrt: Math.sqrt, min: Math.min, max: Math.max, ln: Math.log };

// Expresión aritmética: + - * / % ^ paréntesis, "12%" (=0,12), min/max/round/abs/sqrt/ceil/floor/ln. Devuelve { resultado } o { error }.
function calcular(expr) {
    const src = String(expr || '').replace(/[$\s]/g, '').trim();
    if (!src) return { error: 'Falta la expresión.' };
    if (src.length > 300) return { error: 'Expresión demasiado larga.' };
    const tokens = src.match(/\d+(?:\.\d+)?|[a-z]+|[-+*/%^(),]|\S/gi) || [];
    let i = 0;
    const peek = () => tokens[i];
    const eat = (t) => { if (tokens[i] !== t) throw new Error(`Se esperaba "${t}"`); i += 1; };
    function primario() {
        const t = tokens[i];
        if (t === undefined) throw new Error('Expresión incompleta');
        if (t === '(') { i += 1; const v = suma(); eat(')'); return v; }
        if (t === '-') { i += 1; return -potencia(); }
        if (t === '+') { i += 1; return potencia(); }
        if (/^\d/.test(t)) { i += 1; return Number(t); }
        if (/^[a-z]+$/i.test(t)) {
            const f = FUNCIONES_CALC[t.toLowerCase()];
            if (!f) throw new Error(`Función desconocida: ${t}`);
            i += 1; eat('(');
            const args = [];
            if (peek() !== ')') { args.push(suma()); while (peek() === ',') { i += 1; args.push(suma()); } }
            eat(')');
            return f(...args);
        }
        throw new Error(`Símbolo no válido: ${t}`);
    }
    function potencia() {
        let b = primario();
        while (peek() === '%' && (tokens[i + 1] === undefined || /^[-+*/%^),]$/.test(tokens[i + 1]))) { i += 1; b /= 100; }
        if (peek() === '^') { i += 1; return b ** potencia(); }
        return b;
    }
    function producto() {
        let v = potencia();
        while (peek() === '*' || peek() === '/' || peek() === '%') {
            const op = tokens[i]; i += 1;
            const d = potencia();
            if (op === '*') v *= d; else if (op === '/') v /= d; else v %= d;
        }
        return v;
    }
    function suma() {
        let v = producto();
        while (peek() === '+' || peek() === '-') { const op = tokens[i]; i += 1; const d = producto(); v = op === '+' ? v + d : v - d; }
        return v;
    }
    try {
        const v = suma();
        if (i < tokens.length) throw new Error(`Sobra: ${tokens.slice(i).join(' ')}`);
        if (!Number.isFinite(v)) return { error: 'El resultado no es un número finito (¿división por cero?).' };
        return { expresion: src, resultado: Math.round(v * 1e6) / 1e6 };
    } catch (err) {
        return { error: err.message };
    }
}

const PESTANAS_NAVEGABLES =['pedidos', 'menu', 'informes', 'configuracion', 'clientes', 'mensajes', 'chatroal', 'metricas', 'finanzas', 'costos', 'cuponpana', 'redes'];
const VISTAS_COSTOS = ['platos', 'ideas', 'insumos', 'recetas', 'promos', 'conexion', 'pendientes'];

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
    },
    {
        name: 'variantes_vendidas',
        description: 'Desglose por variante/tamaño/sabor/combo de lo vendido (optionLabel de cada línea): responde "¿se vende más la normal, la pequeña o la mediana?". Puede filtrar por producto (texto). Muestra cantidad, monto y % de participación por variante.',
        input_schema: { type: 'object', properties: { ...FECHAS, producto: { type: 'string', description: 'Texto del nombre del producto (opcional).' }, n: { type: 'integer', description: 'Variantes por producto (1-20).' } }, required: ['desde', 'hasta'] }
    },
    {
        name: 'analisis_clientes',
        description: 'Análisis de clientes por teléfono en el rango: modo "top" (mejores clientes y concentración), "recompra" (tasa de recompra y distribución), "inactivos" (clientes valiosos que dejaron de comprar) o "rfm" (segmentos Campeones/Leales/Nuevos/En riesgo/Perdidos). Teléfonos enmascarados.',
        input_schema: { type: 'object', properties: { ...FECHAS, modo: { type: 'string', enum: MODOS_CLIENTES }, n: { type: 'integer' }, dias_inactivo: { type: 'integer', description: 'Umbral de inactividad en días (modo inactivos, por defecto 45).' } }, required: ['desde', 'hasta'] }
    },
    {
        name: 'puntos_lealtad',
        description: 'Programa de puntos: clientes registrados, con saldo, puntos disponibles y acumulados, pasivo estimado en pesos y mayores saldos.',
        input_schema: { type: 'object', properties: {} }
    },
    {
        name: 'cupones_y_codigo_del_dia',
        description: 'Uso de promociones en el rango: % de pedidos con cupón/2x1/código del día, descuento estimado, desglose por tipo, y ocupación de cupos del código del día por fecha.',
        input_schema: { type: 'object', properties: { ...FECHAS }, required: ['desde', 'hasta'] }
    },
    {
        name: 'costo_por_plato',
        description: 'Costo real y costo con colchón (ingredientes×1,30), food cost, margen y precio sugerido por plato y por promoción, calculados en vivo desde la calculadora de costos propia (insumos → recetas → platos). Por defecto solo platos activos (los que se venden). También costos fijos mensuales.',
        input_schema: { type: 'object', properties: {
            parte: { type: 'string', enum: ['platos', 'promociones', 'fijos', 'alzas', 'preparacion'], description: 'Qué traer (por defecto platos). "preparacion" = modo de preparación e ingredientes de platos y recetas (para manuales). "alzas" = insumos cuyo precio de compra subió y a qué platos activos afecta.' },
            dias: { type: 'number', description: 'Solo con parte "alzas": ventana en días (por defecto 30).' },
            buscar: { type: 'string', description: 'Filtra por texto en el nombre (ej. "empanada", "papuda").' },
            incluir_ideas: { type: 'boolean', description: 'true para incluir también los platos aún en estudio (no activos).' }
        } }
    },
    {
        name: 'armar_pedido',
        description: 'ARMA UN PEDIDO a partir de lo que el administrador pegó, dictó o adjuntó (captura de un chat de WhatsApp): extrae productos, cantidades, nombre, teléfono, tipo de entrega, dirección y pago, los compara con el menú real y, si queda completo, muestra un botón "Crear pedido" que él confirma (o dice "sí, créalo"). NUNCA crea nada por sí sola. Úsala siempre que el administrador quiera tomar/armar/montar/guardar un pedido. Si falta algún dato, pídeselo y vuelve a llamarla con TODO el texto del pedido junto.',
        input_schema: { type: 'object', properties: {
            texto: { type: 'string', description: 'Texto completo del pedido tal cual lo dijo/pegó el administrador (incluye los datos que ya te dio antes). Déjalo vacío si solo hay captura de pantalla.' },
            por_voz: { type: 'boolean', description: 'true si el texto viene de dictado por voz.' }
        } }
    },
    {
        name: 'buscar_conocimiento',
        description: 'Busca en la BASE DE CONOCIMIENTO: (1) lo que el dueño documentó (políticas, preguntas frecuentes, proveedores, apuntes) y (2) teoría de gerencia, marketing, finanzas, operaciones, personal, tributario Colombia, clientes y liderazgo. Úsala ANTES de aconsejar en esos temas o de responder sobre políticas/reglas del negocio. Devuelve los trozos más relevantes con su fuente; lo de "Tu base" manda sobre la teoría.',
        input_schema: { type: 'object', properties: { consulta: { type: 'string', description: 'Qué necesitas saber, con palabras clave (ej. "compensación por pedido tarde", "margen objetivo promos", "recargo nocturno").' }, max: { type: 'number', description: 'Trozos a devolver (1-6, por defecto 4).' } }, required: ['consulta'] }
    },
    {
        name: 'rentabilidad_menu',
        description: 'RENTABILIDAD REAL del menú: cruza lo que se VENDIÓ (unidades e ingresos) con el costo de cada plato/promo de Costos y recetas. Devuelve utilidad total y margen real por producto, ranking de aportes, productos bajo su margen objetivo, clasificación estrella/caballo/enigma/perro y productos vendidos sin costo asociado. Úsala para decidir qué empujar, subir de precio o retirar. Por defecto últimos 30 días.',
        input_schema: { type: 'object', properties: { desde: { type: 'string', description: 'YYYY-MM-DD (opcional).' }, hasta: { type: 'string', description: 'YYYY-MM-DD (opcional).' } } }
    },
    {
        name: 'registrar_sugerencia',
        description: 'Registra una recomendación CONCRETA y medible que acabas de dar al dueño (ej. subir el precio de un plato, lanzar una promo, empujar un producto) para evaluarla automáticamente tras el plazo y APRENDER de si funcionó. Llámala cada vez que recomiendes algo cuyo efecto se pueda medir en ventas totales o en un producto.',
        input_schema: { type: 'object', properties: {
            titulo: { type: 'string', description: 'Qué recomendaste, corto (ej. "Subir Burger Caracas a $28.000").' },
            detalle: { type: 'string', description: 'Contexto o razón (opcional).' },
            metrica: { type: 'string', enum: ['ventas_total', 'producto'], description: 'Qué se medirá: ventas totales del negocio o unidades de un producto.' },
            producto: { type: 'string', description: 'Nombre del producto si metrica es "producto".' },
            plazo_dias: { type: 'number', description: 'Días hasta evaluar (7-45, por defecto 14).' }
        }, required: ['titulo'] }
    },
    {
        name: 'sugerencias_fodi',
        description: 'Historial de tus propias sugerencias registradas: pendientes de evaluar y evaluadas con su resultado (mejoró / sin cambio / empeoró). Úsala para aprender de lo que funcionó y no repetir lo que no.',
        input_schema: { type: 'object', properties: { parte: { type: 'string', enum: ['pendientes', 'evaluadas', 'todas'] } } }
    },
    {
        name: 'alertas_fodi',
        description: 'Alertas proactivas del día: insumos que subieron, productos/promos con margen bajo, caída o alza de ventas de ayer y resultados de sugerencias evaluadas. "leer" trae las últimas guardadas; "recalcular" las vuelve a calcular ahora.',
        input_schema: { type: 'object', properties: { accion: { type: 'string', enum: ['leer', 'recalcular'] } } }
    },
    {
        name: 'redes_sociales',
        description: 'Redes sociales del rango: crecimiento de seguidores (Instagram y Facebook), publicaciones mejor medidas (alcance, vistas, interacciones, texto) cruzadas con las ventas de ese mismo día, y alcance de historias de Instagram. Úsala para "¿qué publicación funcionó?", "¿crecemos?", "¿las redes mueven ventas?".',
        input_schema: { type: 'object', properties: { ...FECHAS, n: { type: 'integer', description: 'Publicaciones a listar (1-20, por defecto 8).' } }, required: ['desde', 'hasta'] }
    },
    {
        name: 'calcular',
        description: 'Calculadora exacta para CUALQUIER operación aritmética (márgenes, punto de equilibrio, porcentajes, proyecciones, conversiones). Úsala siempre en vez de calcular de cabeza. Admite + - * / % (módulo) ^ paréntesis, "12%" (=0,12) y round/floor/ceil/abs/sqrt/min/max/ln. Números con punto decimal y sin separador de miles: "(48500-31200)/48500*100".',
        input_schema: { type: 'object', properties: { expresion: { type: 'string' } }, required: ['expresion'] }
    },
    {
        name: 'tarifa_domicilio',
        description: 'Cuánto cuesta el domicilio a un barrio o dirección. Busca (1) si es un barrio especial con tarifa fija configurada y (2) lo que se cobró en domicilios anteriores a ese lugar (valores, cuántas veces y la última vez). Úsala para "¿cuánto vale un domicilio a X?". Si no hay historial ni barrio especial, dilo: la tarifa depende de la zona GPS y no se puede inferir.',
        input_schema: { type: 'object', properties: { lugar: { type: 'string', description: 'Barrio o parte de la dirección (ej. "villa carolina").' }, dias: { type: 'integer', description: 'Días de historial a revisar (por defecto 180, máx. 365).' } }, required: ['lugar'] }
    },
    {
        name: 'recordar',
        description: 'Memoria permanente de FODI sobre el negocio y el dueño (metas, preferencias, contexto, decisiones). accion "guardar": guarda o actualiza un dato bajo un tema corto (ej. "meta_ventas_mes", "prioridad", "horario_pico"); accion "olvidar": borra el tema. Guarda SOLO hechos que el administrador te dijo o confirmó, nunca cifras de las herramientas (esas cambian). No es una acción sobre pedidos, caja ni dinero.',
        input_schema: { type: 'object', properties: {
            accion: { type: 'string', enum: ['guardar', 'olvidar'] },
            tema: { type: 'string', description: 'Etiqueta corta, minúsculas y guion bajo.' },
            texto: { type: 'string', description: 'Solo con "guardar": el dato (máx. 400 caracteres).' }
        }, required: ['accion', 'tema'] }
    },
    {
        name: 'proponer_accion',
        description: 'Propone una acción al administrador; NO la ejecuta: él la verá como un botón y debe confirmarla. tipo "navegar" lleva a una pestaña del panel (tab; en "costos" también vista). tipo "precio_insumo" propone cambiar el precio de compra de un insumo de la calculadora de costos (nombre + precio_nuevo, en pesos del empaque). Úsala solo cuando el administrador pida ir a algo o cambiar un precio, o cuando sea la siguiente acción natural.',
        input_schema: { type: 'object', properties: {
            tipo: { type: 'string', enum: ['navegar', 'precio_insumo'] },
            tab: { type: 'string', enum: PESTANAS_NAVEGABLES, description: 'Solo con tipo "navegar".' },
            vista: { type: 'string', enum: VISTAS_COSTOS, description: 'Solo con tab "costos".' },
            nombre: { type: 'string', description: 'Solo con tipo "precio_insumo": nombre del insumo (como en la pestaña Insumos).' },
            precio_nuevo: { type: 'number', description: 'Solo con tipo "precio_insumo": nuevo precio de compra del empaque.' }
        }, required: ['tipo'] }
    },
    require('./fodiCatalogo').TOOL
];

const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

// Valida y resuelve una propuesta. Devuelve { ok, accion } (para el cliente) o { error }. Nunca escribe.
async function proponerAccion(db, args = {}) {
    if (args.tipo === 'navegar') {
        if (!PESTANAS_NAVEGABLES.includes(args.tab)) return { error: `Pestaña desconocida. Opciones: ${PESTANAS_NAVEGABLES.join(', ')}.` };
        const vista = args.tab === 'costos' && VISTAS_COSTOS.includes(args.vista) ? args.vista : null;
        return { ok: true, accion: { tipo: 'navegar', tab: args.tab, vista } };
    }
    if (args.tipo === 'precio_insumo') {
        const nuevo = Number(args.precio_nuevo);
        if (!Number.isFinite(nuevo) || nuevo <= 0 || nuevo > 1e8) return { error: 'precio_nuevo debe ser un número mayor que 0.' };
        const q = norm(args.nombre);
        if (!q) return { error: 'Falta el nombre del insumo.' };
        const todos = (await db.collection('costos_insumos').get()).docs.map((d) => ({ id: d.id, ...d.data() }));
        let hallados = todos.filter((i) => norm(i.nombre) === q);
        if (!hallados.length) hallados = todos.filter((i) => norm(i.nombre).includes(q));
        if (!hallados.length) return { error: `No hay un insumo llamado "${args.nombre}".` };
        if (hallados.length > 1) return { error: `Hay varios insumos que coinciden: ${hallados.slice(0, 8).map((i) => i.nombre).join('; ')}. Pide al administrador que elija uno.` };
        const i = hallados[0];
        return { ok: true, accion: { tipo: 'precio_insumo', insumoId: i.id, nombre: String(i.nombre || ''), precioActual: Number(i.precioCompra) || 0, precioNuevo: Math.round(nuevo * 100) / 100 } };
    }
    return { error: 'tipo desconocido.' };
}

async function tarifaDomicilio(db, args = {}) {
    const admin = require('firebase-admin');
    const lugar = norm(args.lugar).replace(/[^a-z0-9 ]+/g, ' ').trim();
    if (lugar.length < 3) return { error: 'Dime el barrio o la dirección (mínimo 3 letras).' };
    const dias = Math.min(Math.max(parseInt(args.dias, 10) || 180, 1), 365);
    const barriosDoc = (await db.collection('configuracion').doc('barrios_especiales').get().catch(() => null));
    const barrios = ((barriosDoc && barriosDoc.exists && barriosDoc.data().barrios) || []).filter((b) => b && b.activo !== false);
    const especial = barrios.filter((b) => { const n = norm(b.nombre); return n && (lugar.includes(n) || n.includes(lugar)); })
        .map((b) => ({ barrio: String(b.nombre || ''), tarifa_fija: Math.max(0, Number(b.tarifa) || 0), el_domiciliario_no_entra: true }));
    const T = admin.firestore.Timestamp;
    const ini = T.fromMillis(Date.now() - dias * DAY_MS);
    const lee = (col) => db.collection(col).where('createdAt', '>=', ini).get().then((sn) => sn.docs.map((d) => d.data()));
    const [a, b] = await Promise.all([lee('pedidos'), lee('pedidos_archivados')]);
    const dir = (o) => { const v = o.deliveryAddress || o.customerAddress || ''; return norm(typeof v === 'string' ? v : Object.values(v || {}).filter((x) => typeof x === 'string').join(' ')).replace(/[^a-z0-9 ]+/g, ' '); };
    const porTarifa = new Map();
    let revisados = 0;
    for (const o of [...a, ...b]) {
        const fee = Number(o.deliveryFee) || 0;
        if (!(fee > 0) || o.voided === true || o.status === 'cancelado' || !dir(o).includes(lugar)) continue;
        revisados++;
        const ms = toMs(o.createdAt);
        const e = porTarifa.get(fee) || { tarifa: fee, veces: 0, ultima: 0, ejemplo: '' };
        e.veces++;
        if (ms >= e.ultima) { e.ultima = ms; e.ejemplo = String(typeof (o.deliveryAddress || o.customerAddress) === 'string' ? (o.deliveryAddress || o.customerAddress) : '').slice(0, 80); }
        porTarifa.set(fee, e);
    }
    const historial = [...porTarifa.values()].sort((x, y) => y.ultima - x.ultima).map((e) => ({ tarifa: e.tarifa, veces: e.veces, ultima_vez: bogotaDateKey(e.ultima), direccion_ejemplo: e.ejemplo }));
    const probable = historial.length ? [...historial].sort((x, y) => y.veces - x.veces)[0].tarifa : null;
    return { lugar: args.lugar, dias_revisados: dias, barrio_especial: especial, domicilios_anteriores: revisados, historial, tarifa_mas_frecuente: probable, nota: historial.length || especial.length ? undefined : 'Sin barrio especial ni domicilios previos a ese lugar: no hay tarifa registrada; depende de la zona GPS.' };
}

const MEMORIA_MAX_ITEMS = 60;
const MEMORIA_MAX_CHARS = 400;
const memoriaRef = (db) => db.collection('fodi_memoria').doc('principal');

async function leerMemoria(db) {
    const items = ((await memoriaRef(db).get()).data() || {}).items || {};
    return Object.entries(items).map(([tema, v]) => ({ tema, texto: String(v.texto || ''), actualizado: v.actualizado || '', fijo: v.fijo === true }));
}

async function recordar(db, args = {}) {
    const tema = norm(args.tema).replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40);
    if (!tema) return { error: 'Falta el tema.' };
    const ref = memoriaRef(db);
    const items = ((await ref.get()).data() || {}).items || {};
    // Lo que escribe el dueño (fijo) no lo pueden pisar ni borrar los aprendizajes automáticos
    if (items[tema] && items[tema].fijo === true && args.origen === 'auto') return { error: `"${tema}" está fijado por el dueño.` };
    if (args.accion === 'olvidar') {
        if (!(tema in items)) return { error: `No hay nada guardado bajo "${tema}".` };
        delete items[tema];
        await ref.set({ items });
        return { ok: true, olvidado: tema };
    }
    if (args.accion !== 'guardar') return { error: 'accion debe ser guardar u olvidar.' };
    const texto = String(args.texto || '').trim().slice(0, MEMORIA_MAX_CHARS);
    if (!texto) return { error: 'Falta el texto a guardar.' };
    if (!(tema in items) && Object.keys(items).length >= MEMORIA_MAX_ITEMS) return { error: `La memoria está llena (${MEMORIA_MAX_ITEMS} temas). Olvida alguno primero.` };
    items[tema] = { texto, actualizado: bogotaDateKey(Date.now()), ...(args.fijo === true ? { fijo: true } : {}) };
    await ref.set({ items });
    return { ok: true, guardado: tema };
}

// Aprendizaje automático: tras cada intercambio, un modelo barato decide qué vale la pena recordar
// (preferencias, decisiones, correcciones, lo que se hizo y lo que NO) y fusiona la memoria.
const APRENDER_PROMPT = `Eres el módulo de aprendizaje de FODI, asistente de ROAL BURGER (hamburguesería en Colombia). Recibes la MEMORIA actual, el último intercambio con el dueño y las acciones que FODI propuso. Decide qué hecho DURADERO conviene recordar para ayudarle mejor la próxima vez.
Guarda: metas y números que él da, preferencias de trato y de formato, decisiones tomadas, correcciones a FODI ("no, eso no"), cosas que pidió NO hacer, productos/clientes/procesos del negocio que mencione, y qué acciones aprobó o rechazó.
NO guardes: cifras que salen de las herramientas (ventas del día, etc.), saludos, preguntas sueltas sin enseñanza, claves/PINs/datos sensibles, ni lo que ya esté en la memoria.
Reglas: temas en snake_case cortos; cada texto máx. 350 caracteres, en español, concreto y fechado si hace falta. Si un tema ya existe y hay información nueva, reescríbelo fusionando (mismo tema). Si hay 50 o más temas, consolida antes de agregar. Para borrar algo que el dueño pidió olvidar o que quedó falso, ponlo en "olvidar".
Responde SOLO JSON: {"guardar":[{"tema":"...","texto":"..."}],"olvidar":["tema"]}. Si no hay nada que aprender: {"guardar":[],"olvidar":[]}.`;

async function aprender(db, client, { modelo, memoria, pregunta, respuesta, acciones, extra }) {
    const q = String(pregunta || '').trim();
    if (q.length < 12) return { ok: true, guardados: 0 };
    const entrada = `MEMORIA ACTUAL:\n${memoria.length ? memoria.map((m) => `- ${m.tema}${m.fijo ? ' [FIJO: no lo modifiques]' : ''}: ${m.texto}`).join('\n') : '(vacía)'}\n\nDUEÑO DIJO:\n${q.slice(0, 1500)}\n\nFODI RESPONDIÓ:\n${String(respuesta || '').slice(0, 1500)}\n\nACCIONES PROPUESTAS: ${(acciones || []).map((a) => a.tipo + (a.nombre ? ' ' + a.nombre : '') + (a.tab ? ' ' + a.tab : '')).join('; ') || 'ninguna'}${extra ? `

${extra}
(Si hay resultados de sugerencias, guarda la LECCIÓN: qué tipo de recomendación funcionó o no.)` : ''}`;
    const r = await client.messages.create({ model: modelo, max_tokens: 700, system: APRENDER_PROMPT, messages: [{ role: 'user', content: entrada }] });
    const txt = (r.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('');
    const m = txt.match(/\{[\s\S]*\}/);
    if (!m) return { ok: true, guardados: 0, usage: r.usage };
    let j; try { j = JSON.parse(m[0]); } catch (_) { return { ok: true, guardados: 0, usage: r.usage }; }
    let n = 0;
    for (const t of Array.isArray(j.olvidar) ? j.olvidar.slice(0, 5) : []) { const x = await recordar(db, { accion: 'olvidar', tema: t, origen: 'auto' }); if (x.ok) n++; }
    for (const g of Array.isArray(j.guardar) ? j.guardar.slice(0, 4) : []) {
        if (!g || !g.tema || !g.texto || /pin|clave|contrase/i.test(String(g.tema))) continue;
        const x = await recordar(db, { accion: 'guardar', tema: g.tema, texto: g.texto, origen: 'auto' }); if (x.ok) n++;
    }
    return { ok: true, guardados: n, usage: r.usage };
}

/** Arma un borrador de pedido (texto y/o captura) y, si está completo, una acción 'crear_pedido' para confirmar. */
async function armarPedido(db, apiKey, args = {}, imagen = null) {
    const { buildWhatsAppOrderDraft } = require('./agent/whatsappOrderParser');
    const texto = String(args.texto || '').trim();
    if (!texto && !imagen) return { error: 'No hay texto ni captura del pedido.' };
    let d;
    try { d = await buildWhatsAppOrderDraft(db, apiKey, texto, { image: imagen, voz: args.por_voz === true }); } catch (e) { return { error: 'No pude armar el pedido: ' + (e.message || e) }; }
    const buenos = (d.items || []).filter((it) => !it.unmatched && it.productName && Number(it.unitPrice) > 0);
    const sinReconocer = (d.items || []).filter((it) => it.unmatched || !it.productName).map((it) => it.productNameGuess || '(sin nombre)');
    const subtotal = buenos.reduce((s, it) => s + (Math.max(1, Math.trunc(Number(it.quantity) || 1)) * Number(it.unitPrice)), 0);
    const faltan = [];
    if (!buenos.length) faltan.push('productos');
    if (sinReconocer.length) faltan.push('productos sin reconocer: ' + sinReconocer.join(', '));
    if (!d.fulfillmentType) faltan.push('tipo de entrega (domicilio, recoger o mesa)');
    if (d.fulfillmentType === 'delivery' && !String(d.address || '').trim()) faltan.push('dirección del domicilio');
    if (!String(d.paymentMethod || '').trim()) faltan.push('método de pago');
    const resumen = {
        lineas: buenos.map((it) => ({ cantidad: Math.max(1, Math.trunc(Number(it.quantity) || 1)), producto: it.productName, precio_unitario: Number(it.unitPrice), nota: it.note || undefined })),
        subtotal_productos: subtotal, cliente: d.customerName || null, telefono: d.customerPhone || null,
        entrega: d.fulfillmentType || null, direccion: d.address || null, pago: d.paymentMethod || null, paga_con: d.cashTenderAmount || null,
        cliente_conocido: d.matchedClient ? { pedidos: d.matchedClient.totalOrders, puntos: d.matchedClient.puntosDisponibles } : null
    };
    const res = { listo_para_crear: !faltan.length, faltan, resumen, nota: 'El domicilio y el total final los calcula el sistema al crear. ' + (faltan.length ? 'Pídele al administrador lo que falta y vuelve a llamar armar_pedido con TODO el texto junto.' : 'Resume en 1-3 líneas lo entendido y dile que lo confirme con el botón o diciendo "sí, créalo". No digas que ya está creado.') };
    if (faltan.length) return { resultado: res, accion: null };
    const pay = String(d.paymentMethod).trim().toLowerCase(), cash = Number(d.cashTenderAmount);
    return {
        resultado: res,
        accion: {
            tipo: 'crear_pedido', resumen,
            payload: {
                items: buenos.map((it) => ({ productName: it.productName, categoryName: it.categoryName || '', quantity: Math.max(1, Math.trunc(Number(it.quantity) || 1)), unitPrice: Number(it.unitPrice) || 0, note: it.note || '' })),
                customerName: String(d.customerName || '').trim(), customerPhone: String(d.customerPhone || '').trim(), fulfillmentType: d.fulfillmentType,
                address: String(d.address || '').trim(), paymentMethod: pay, cashChangeRequired: pay === 'efectivo' && Number.isFinite(cash) && cash > 0,
                cashTenderAmount: Number.isFinite(cash) && cash > 0 ? cash : null, pointsToRedeem: 0
            }
        }
    };
}

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
                return { nombre: p.nombre || '', precio: Number(p.precio) || 0, categoria: p.categoria || '', estado: String(p.estado || ''), en_menu: p.activo_menu !== false && String(p.estado || '').trim() !== 'paused', variantes: (Array.isArray(p.variantes) ? p.variantes : []).map((x) => ({ nombre: String((x && (x.nombre || x.name || x.label)) || ''), precio: Number(x && (x.precio ?? x.price)) || undefined })).filter((x) => x.nombre).slice(0, 8), sabores: (Array.isArray(p.sabores) ? p.sabores : []).map((x) => (typeof x === 'string' ? x : String((x && (x.nombre || x.name)) || ''))).filter(Boolean).slice(0, 12) };
            }).filter((p) => p.nombre && (!q || `${p.nombre} ${p.categoria}`.toLowerCase().includes(q)));
            return { total: prods.length, productos: prods.slice(0, 60) };
        }
        if (nombre === 'costos_fijos') {
            const d = (await db.collection('configuracion').doc('costos_fijos').get()).data() || {};
            const items = (Array.isArray(d.items) ? d.items : []).map((i) => ({ nombre: String(i.nombre || ''), monto_mensual: Number(i.monto) || 0 }));
            return { items, total_mensual: items.reduce((a, i) => a + i.monto_mensual, 0), margen_minimo_pct: Number(d.margenMinimo) || null };
        }
        if (nombre === 'calcular') return calcular(args.expresion);
        if (nombre === 'recordar') return await recordar(db, args);
        if (nombre === 'tarifa_domicilio') return await tarifaDomicilio(db, args);
        if (nombre === 'puntos_lealtad') return await resumenPuntos(db);
        if (nombre === 'costo_por_plato') return await costoPorPlato(args, db);
        if (nombre === 'buscar_conocimiento') return await require('./fodiBase').buscar(db, args.consulta, Number(args.max) || 4);
        if (nombre === 'rentabilidad_menu') return await require('./fodiInteligencia').rentabilidadMenu(db, args);
        if (nombre === 'registrar_sugerencia') return await require('./fodiInteligencia').registrarSugerencia(db, args);
        if (nombre === 'sugerencias_fodi') return await require('./fodiInteligencia').listarSugerencias(db, args);
        if (nombre === 'alertas_fodi') {
            const FI = require('./fodiInteligencia');
            if (args.accion === 'recalcular') return await FI.guardarAlertas(db);
            return (await FI.leerAlertas(db)) || { items: [], nota: 'Aún no hay alertas calculadas; usa accion "recalcular".' };
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
        if (nombre === 'cupones_y_codigo_del_dia') {
            const ventasP = await cargarPedidosRango(db, r.desdeMs, r.hastaMs);
            return { rango, promos: usoPromos(ventasP), codigo_del_dia: await codigoDelDia(db, args.desde, args.hasta) };
        }
        if (nombre === 'cierres_caja') {
            return { rango, ...resumenCierres(await cargarCierres(db, r.desdeMs, r.hastaMs), r.desdeMs, r.hastaMs) };
        }
        const ventas = await cargarPedidosRango(db, r.desdeMs, r.hastaMs);
        if (nombre === 'redes_sociales') return await redesSociales(db, args, r, ventas);
        if (nombre === 'resumen_ventas') return { rango, ...resumenVentas(ventas, args.agrupar) };
        if (nombre === 'ventas_por_metodo_pago') return { rango, ...ventasPorMetodo(ventas) };
        if (nombre === 'top_productos') return { rango, ...topProductos(ventas, args) };
        if (nombre === 'variantes_vendidas') return { rango, ...variantesVendidas(ventas, args) };
        if (nombre === 'analisis_clientes') return { rango, ...analisisClientes(ventas, { ...args, hastaMs: Math.min(r.hastaMs, Date.now()) }) };
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
    variantesVendidas, analisisClientes, usoPromos, etiquetaVariante,
    esGastoReal, resumenGastos, resumenCierres, compararResumenes, recortarResultado,
    ejecutarHerramienta, proponerAccion, leerMemoria, recordar, aprender, armarPedido, calcular, topPublicaciones, serieSeguidores, PESTANAS_NAVEGABLES, VISTAS_COSTOS
};
