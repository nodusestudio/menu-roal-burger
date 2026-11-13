// ─────────────────────────────────────────────────────────────────────────
// ALMUERZOS CONFIGURABLES — núcleo puro (sin DOM, sin Firestore).
//   node --test --test-concurrency=1 tests/almuerzos.test.js
//
// Un solo producto ("Almuerzo Ejecutivo", $19.000) con arroz fijo y 4 componentes elegibles
// (proteína, contorno, ensalada, bebida). Cada componente apunta a una receta (o insumo) de la
// calculadora de costos (colecciones costos_*): NO se duplica ninguna receta ni ningún insumo.
//
// Costos: las fórmulas de costoUnitarioInsumo / costo de receta son un ESPEJO de functions/costos.js
// (mismas cuentas; tests/almuerzos.test.js verifica la paridad). Si cambian allá, cambiar aquí.
//
// Histórico inmutable: cada venta guarda un "snapshot" (armarCombinacion) con costos y cantidades
// de ESE momento. Los reportes leen solo el snapshot, nunca las recetas actuales.
// ─────────────────────────────────────────────────────────────────────────

export const ALMUERZO_PRODUCTO_ID = 'almuerzo-ejecutivo';
export const ALMUERZO_CATEGORIA = 'ALMUERZOS';
export const ALMUERZO_PRECIO = 19000;

/** Orden en que se eligen y se muestran. porcion = estándar por defecto (cada componente puede afinarla). */
export const CATEGORIAS = {
    proteina: { id: 'proteina', label: 'Proteína', plural: 'Proteínas', icono: '🍗', porcion: 150, unidad: 'g' },
    contorno: { id: 'contorno', label: 'Contorno', plural: 'Contornos', icono: '🍟', porcion: 100, unidad: 'g' },
    ensalada: { id: 'ensalada', label: 'Ensalada', plural: 'Ensaladas', icono: '🥗', porcion: 100, unidad: 'g' },
    bebida: { id: 'bebida', label: 'Bebida', plural: 'Bebidas', icono: '🥤', porcion: 500, unidad: 'ml' }
};
export const ORDEN_CATEGORIAS = ['proteina', 'contorno', 'ensalada', 'bebida'];
export const ARROZ_DEFECTO = { porcion: 200, unidad: 'g' };

const num = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const redondear = (v) => Math.round(num(v));
const pct1 = (v) => Math.round(num(v) * 10) / 10;
const r3 = (v) => Math.round(num(v) * 1000) / 1000;

// ── Costos (espejo de functions/costos.js) ──────────────────────────────

export function costoUnitarioInsumo(ing) {
    if (!ing) return 0;
    const peso = num(ing.pesoEmpaque);
    if (num(ing.precioCompra) > 0 && peso > 0) return (num(ing.precioCompra) * (1 + num(ing.mermaPct) / 100)) / peso;
    return num(ing.costoRespaldo);
}

/** Costo por unidad de uso de una receta (sin colchón). ctx = { insumos:{id:insumo}, recetas:{id:receta} }. */
export function costoRecetaPorUnidad(id, ctx, pila = []) {
    const r = ctx.recetas[id];
    if (!r) return { porUnidad: 0, faltantes: [`receta:${id}`] };
    if (pila.includes(id)) return { porUnidad: 0, faltantes: [`ciclo:${r.nombre || id}`] };
    const faltantes = [];
    let total = 0;
    for (const it of r.items || []) {
        const q = num(it.cantidad);
        if (it.tipo === 'receta') {
            const sub = costoRecetaPorUnidad(it.id, ctx, [...pila, id]);
            total += q * sub.porUnidad;
            faltantes.push(...sub.faltantes);
        } else if (ctx.insumos[it.id]) total += q * costoUnitarioInsumo(ctx.insumos[it.id]);
        else faltantes.push(`insumo:${it.id || '(vacío)'}`);
    }
    return { porUnidad: total / (num(r.pesoTotal) || 1), faltantes };
}

/**
 * Insumos que gasta `cantidad` unidades de una receta (g, ml…), bajando por las sub-recetas.
 * Devuelve { insumoId: cantidad } en la unidad de uso de cada insumo.
 */
export function consumoDeReceta(id, cantidad, ctx, pila = [], acc = {}) {
    const r = ctx.recetas[id];
    if (!r || pila.includes(id)) return acc;
    const factor = num(cantidad) / (num(r.pesoTotal) || 1);
    for (const it of r.items || []) {
        const q = num(it.cantidad) * factor;
        if (it.tipo === 'receta') consumoDeReceta(it.id, q, ctx, [...pila, id], acc);
        else if (ctx.insumos[it.id]) acc[it.id] = (acc[it.id] || 0) + q;
    }
    return acc;
}

/**
 * Ficha de UN componente en su porción: costo real y consumo de insumos.
 * comp = { id, categoria, nombre, ref:{tipo:'receta'|'insumo', id}, porcion?, unidad? }
 */
export function calcularComponente(comp, ctx, porcionDefecto = null) {
    const cat = CATEGORIAS[comp.categoria] || {};
    const porcion = num(comp.porcion) > 0 ? num(comp.porcion) : num(porcionDefecto?.porcion ?? cat.porcion);
    const unidad = String(comp.unidad || porcionDefecto?.unidad || cat.unidad || 'g');
    const ref = comp.ref || {};
    let consumoMapa = {};
    let faltantes = [];
    if (ref.tipo === 'insumo') {
        if (ctx.insumos[ref.id]) consumoMapa = { [ref.id]: porcion };
        else faltantes = [`insumo:${ref.id || '(vacío)'}`];
    } else if (ref.tipo === 'receta') {
        faltantes = costoRecetaPorUnidad(ref.id, ctx).faltantes;
        consumoMapa = consumoDeReceta(ref.id, porcion, ctx);
    } else faltantes = ['sin receta vinculada'];
    const consumos = Object.entries(consumoMapa).map(([insumoId, cantidad]) => {
        const ins = ctx.insumos[insumoId];
        const costoUnit = costoUnitarioInsumo(ins);
        return { insumoId, nombre: ins?.nombre || insumoId, cantidad: r3(cantidad), unidad: ins?.unidad || '', costoUnit: r3(costoUnit), costo: r3(cantidad * costoUnit) };
    });
    const costoReal = consumos.reduce((s, c) => s + c.costo, 0);
    return {
        componenteId: comp.id || null, categoria: comp.categoria, nombre: String(comp.nombre || '').trim(),
        porcion: r3(porcion), unidad, costoReal: r3(costoReal), consumos, faltantes: [...new Set(faltantes)]
    };
}

// ── Disponibilidad y armado de una combinación ──────────────────────────

/** ¿Se puede ofrecer hoy? (activo en el catálogo y encendido en el menú del día). */
export const componenteSeleccionable = (c) => !!c && c.activo !== false && c.disponible === true;

/** Componentes elegibles por categoría: { proteina:[...], contorno:[...], ... } */
export function opcionesPorCategoria(componentes) {
    const out = {};
    for (const cat of ORDEN_CATEGORIAS) out[cat] = (componentes || []).filter((c) => c.categoria === cat && componenteSeleccionable(c));
    return out;
}

/**
 * Arma y valida una combinación. seleccion = { proteina:id, contorno:id, ensalada:id, bebida:id }.
 * config = { precio, manoObra?, arroz:{ nombre, ref, porcion, unidad } }.
 * Devuelve { ok, errores[], snapshot|null }. El snapshot es lo que se guarda con la venta.
 */
export function armarCombinacion({ config = {}, componentes = [], seleccion = {}, ctx, colchonPct = 0, ahora = Date.now() }) {
    const errores = [];
    const porId = Object.fromEntries((componentes || []).map((c) => [c.id, c]));
    const piezas = [];

    const arrozCfg = config.arroz || {};
    const arroz = calcularComponente(
        { id: 'arroz', categoria: 'arroz', nombre: arrozCfg.nombre || 'Arroz', ref: arrozCfg.ref, porcion: arrozCfg.porcion || ARROZ_DEFECTO.porcion, unidad: arrozCfg.unidad || ARROZ_DEFECTO.unidad },
        ctx
    );
    if (!arrozCfg.ref || !arrozCfg.ref.id) errores.push('El arroz fijo no tiene receta vinculada (Almuerzos → Configuración).');

    for (const cat of ORDEN_CATEGORIAS) {
        const id = seleccion[cat];
        const label = CATEGORIAS[cat].label.toLowerCase();
        if (!id) { errores.push(`Falta elegir ${cat === 'bebida' || cat === 'ensalada' || cat === 'proteina' ? 'la' : 'el'} ${label}.`); continue; }
        const comp = porId[id];
        if (!comp || comp.categoria !== cat) { errores.push(`La opción elegida de ${label} ya no existe.`); continue; }
        if (!componenteSeleccionable(comp)) { errores.push(`"${comp.nombre}" no está disponible hoy.`); continue; }
        piezas.push(calcularComponente(comp, ctx, CATEGORIAS[cat]));
    }
    if (errores.length) return { ok: false, errores, snapshot: null };

    const todas = [arroz, ...piezas];
    const faltantes = [...new Set(todas.flatMap((p) => p.faltantes))];
    const ingredientes = todas.reduce((s, p) => s + p.costoReal, 0);
    const manoObra = num(config.manoObra);
    const precio = num(config.precio) || ALMUERZO_PRECIO;
    const costoReal = ingredientes + manoObra;
    const costoColchon = ingredientes * (1 + num(colchonPct) / 100) + manoObra;

    // Consumo total de insumos de UNA unidad (arroz + 4 componentes), agrupado por insumo.
    const consumos = {};
    for (const p of todas) for (const c of p.consumos) {
        const k = consumos[c.insumoId] || (consumos[c.insumoId] = { nombre: c.nombre, unidad: c.unidad, cantidad: 0 });
        k.cantidad = r3(k.cantidad + c.cantidad);
    }

    return {
        ok: true, errores: [],
        snapshot: {
            version: 1,
            producto: String(config.nombre || 'Almuerzo Ejecutivo'),
            creadoAtMs: ahora,
            precio,
            arroz,
            componentes: piezas,
            consumos,
            costoIngredientes: redondear(ingredientes),
            manoObra: redondear(manoObra),
            costoReal: redondear(costoReal),
            costoColchon: redondear(costoColchon),
            utilidadBruta: precio - redondear(costoReal),
            margenPct: precio ? pct1(((precio - costoReal) / precio) * 100) : null,
            foodCostPct: precio ? pct1((costoReal / precio) * 100) : null,
            faltantes
        }
    };
}

/** Texto corto de la combinación para ticket / cocina. */
export function etiquetaCombinacion(snapshot) {
    if (!snapshot) return '';
    const nombres = (snapshot.componentes || []).map((c) => c.nombre).filter(Boolean);
    const arroz = snapshot.arroz ? `${snapshot.arroz.nombre || 'Arroz'} ${snapshot.arroz.porcion}${snapshot.arroz.unidad}` : '';
    return [...nombres, arroz].filter(Boolean).join(' + ');
}

// ── Pedido: consumo de inventario ───────────────────────────────────────

/** Ítems de un pedido que son almuerzos (con snapshot). */
export const itemsAlmuerzo = (items) => (items || []).filter((i) => i && i.almuerzo && typeof i.almuerzo === 'object');

/** Insumos que gasta TODO el pedido (suma snapshot.consumos × cantidad de cada línea). { insumoId:{nombre,unidad,cantidad} } */
export function consumosDePedido(items) {
    const out = {};
    for (const it of itemsAlmuerzo(items)) {
        const q = Math.max(0, num(it.quantity));
        for (const [id, c] of Object.entries(it.almuerzo.consumos || {})) {
            const k = out[id] || (out[id] = { nombre: c.nombre, unidad: c.unidad, cantidad: 0 });
            k.cantidad = r3(k.cantidad + num(c.cantidad) * q);
        }
    }
    return out;
}

/** Diferencia a aplicar al inventario al pasar de `antes` a `despues` (positivo = gastar más, negativo = devolver). */
export function deltaConsumos(antes = {}, despues = {}) {
    const out = {};
    for (const id of new Set([...Object.keys(antes), ...Object.keys(despues)])) {
        const d = r3(num(despues[id]?.cantidad) - num(antes[id]?.cantidad));
        if (d !== 0) out[id] = { nombre: despues[id]?.nombre || antes[id]?.nombre || id, unidad: despues[id]?.unidad || antes[id]?.unidad || '', cantidad: d };
    }
    return out;
}

/** ¿Hay insumo bajo seguimiento? Solo se controla el insumo que tiene `stockActual` numérico. */
export const insumoConStock = (ins) => !!ins && ins.stockActual !== undefined && ins.stockActual !== null && ins.stockActual !== '' && Number.isFinite(Number(ins.stockActual));

/** Lo que NO alcanza para un delta de consumo. insumos = { id: insumo }. Solo cuenta lo que se gasta (cantidad > 0). */
export function validarStock(delta, insumos) {
    const faltan = [];
    for (const [id, c] of Object.entries(delta || {})) {
        if (!(c.cantidad > 0)) continue;
        const ins = insumos[id];
        if (!insumoConStock(ins)) continue;
        if (num(ins.stockActual) + 1e-9 < c.cantidad) faltan.push({ insumoId: id, nombre: ins.nombre || c.nombre, unidad: ins.unidad || c.unidad, necesita: r3(c.cantidad), hay: r3(num(ins.stockActual)) });
    }
    return faltan;
}

/** Componentes que no se pueden hacer con el stock actual (para avisar en el selector antes de elegirlos). */
export function componenteSinStock(comp, ctx) {
    const f = calcularComponente(comp, ctx, CATEGORIAS[comp.categoria]);
    const delta = Object.fromEntries(f.consumos.map((c) => [c.insumoId, { nombre: c.nombre, unidad: c.unidad, cantidad: c.cantidad }]));
    return validarStock(delta, ctx.insumos);
}

// ── Reportes ────────────────────────────────────────────────────────────

const pedidoValido = (o) => o && o.status !== 'cancelado' && o.anulado !== true && o.voided !== true;
const rank = (m) => [...m.values()].sort((a, b) => b.cantidad - a.cantidad || b.utilidad - a.utilidad);

/**
 * Reporte sobre pedidos ya guardados. Lee SOLO los snapshots de las ventas (costos de ese momento).
 * orders: [{ items, createdAt|createdAtMs, status, anulado, voided }]. Rango opcional [desdeMs, hastaMs).
 */
export function reporteAlmuerzos(orders, { desdeMs = 0, hastaMs = Infinity } = {}) {
    const ms = (o) => { const v = o.createdAtMs ?? o.createdAt; return v && typeof v.toMillis === 'function' ? v.toMillis() : num(v); };
    const cat = { proteina: new Map(), contorno: new Map(), ensalada: new Map(), bebida: new Map() };
    const combos = new Map();
    const dias = new Map();
    let vendidos = 0, ingresos = 0, costoReal = 0, pedidos = 0, sinCostoCompleto = 0;

    for (const o of orders || []) {
        if (!pedidoValido(o)) continue;
        const t = ms(o);
        if (t && (t < desdeMs || t >= hastaMs)) continue;
        const lineas = itemsAlmuerzo(o.items);
        if (!lineas.length) continue;
        pedidos++;
        for (const it of lineas) {
            const q = Math.max(0, num(it.quantity));
            const s = it.almuerzo;
            const precio = num(it.unitPrice);
            const costo = num(s.costoReal);
            const utilidadUnidad = precio - costo;
            vendidos += q; ingresos += precio * q; costoReal += costo * q;
            if ((s.faltantes || []).length) sinCostoCompleto += q;
            for (const c of s.componentes || []) {
                const m = cat[c.categoria];
                if (!m) continue;
                const key = c.componenteId || c.nombre;
                const r = m.get(key) || { clave: key, nombre: c.nombre, cantidad: 0, costo: 0, utilidad: 0 };
                r.cantidad += q; r.costo += num(c.costoReal) * q; r.utilidad += utilidadUnidad * q;
                m.set(key, r);
            }
            const ckey = (s.componentes || []).map((c) => c.componenteId || c.nombre).join('|');
            const cb = combos.get(ckey) || { clave: ckey, nombre: (s.componentes || []).map((c) => c.nombre).join(' + '), cantidad: 0, costoUnidad: costo, utilidadUnidad, ingresos: 0, utilidad: 0 };
            cb.cantidad += q; cb.ingresos += precio * q; cb.utilidad += utilidadUnidad * q;
            cb.costoUnidad = costo; cb.utilidadUnidad = utilidadUnidad; // el último costo conocido de esa combinación
            combos.set(ckey, cb);
            const dia = t ? new Date(t - 5 * 3600000).toISOString().slice(0, 10) : 'sin fecha';
            const d = dias.get(dia) || { dia, cantidad: 0, ingresos: 0, costo: 0 };
            d.cantidad += q; d.ingresos += precio * q; d.costo += costo * q;
            dias.set(dia, d);
        }
    }
    const utilidad = ingresos - costoReal;
    return {
        pedidos, vendidos, ingresos: redondear(ingresos), costoReal: redondear(costoReal), utilidadBruta: redondear(utilidad),
        margenPct: ingresos ? pct1((utilidad / ingresos) * 100) : null,
        costoPromedio: vendidos ? redondear(costoReal / vendidos) : 0,
        utilidadPromedio: vendidos ? redondear(utilidad / vendidos) : 0,
        sinCostoCompleto,
        proteinas: rank(cat.proteina), contornos: rank(cat.contorno), ensaladas: rank(cat.ensalada), bebidas: rank(cat.bebida),
        combinaciones: rank(combos),
        porDia: [...dias.values()].sort((a, b) => a.dia.localeCompare(b.dia)).map((d) => ({ ...d, ingresos: redondear(d.ingresos), costo: redondear(d.costo) }))
    };
}

// Puente para admin.js (script clásico).
if (typeof window !== 'undefined') {
    window.AlmuerzosCore = {
        ALMUERZO_PRODUCTO_ID, ALMUERZO_CATEGORIA, ALMUERZO_PRECIO, CATEGORIAS, ORDEN_CATEGORIAS, ARROZ_DEFECTO,
        costoUnitarioInsumo, costoRecetaPorUnidad, consumoDeReceta, calcularComponente, componenteSeleccionable, opcionesPorCategoria,
        armarCombinacion, etiquetaCombinacion, itemsAlmuerzo, consumosDePedido, deltaConsumos, insumoConStock, validarStock, componenteSinStock, reporteAlmuerzos
    };
}
