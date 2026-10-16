// Motor de costos de FODEXA (reemplaza a CostoX): núcleo puro, sin Firestore.
//   node --test --test-concurrency=1 tests/costos.test.js
//
// Todo se RECALCULA en vivo desde los precios de los insumos. Los totales que guardaba CostoX
// (totalCost, foodCostPercent, ...) eran fotos viejas (7 de 16 recetas y casi todos los platos
// desfasados) y no se importan.
//
// Dos números por plato (decisión del dueño, 2026-10-16):
//   costo_real      = lo que cuesta de verdad (precio de compra + merma real de cada insumo + mano de obra)
//   costo (colchón) = ingredientes × (1 + colchón%) + mano de obra. El colchón es el sello de prudencia
//                     del negocio (30 %, antes llamado "merma" en CostoX): cubre alzas y eventualidades.
//                     Alertas, margen y precio sugerido se miden sobre este costo.
//
// "activo": solo los platos con activo === true se venden (o se venderán); el resto son ideas en estudio de
// costos. Ausente = idea. El importador NUNCA escribe este campo, así que reimportar no desactiva lo activado.
// "productoMenuId": enlace progresivo al producto del menú (null = aún sin conectar).
//
// Esquema (colecciones costos_*): insumo {nombre, unidad, precioCompra, pesoEmpaque, mermaPct, costoRespaldo},
// receta {nombre, pesoTotal, items[{tipo:'insumo'|'receta', id, cantidad}]}, plato {nombre, precio, manoObra, items[...]}.

const num = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const redondear = (v) => Math.round(num(v));
const pct1 = (v) => Math.round(num(v) * 10) / 10;

// Costo por unidad de uso, SIN colchón (con la merma real del insumo).
function costoUnitarioInsumo(ing) {
    if (!ing) return 0;
    const peso = num(ing.pesoEmpaque);
    if (num(ing.precioCompra) > 0 && peso > 0) return (num(ing.precioCompra) * (1 + num(ing.mermaPct) / 100)) / peso;
    return num(ing.costoRespaldo); // insumo sin precio de compra: usar el costo base guardado
}

// ctx = { insumos: {id: insumo}, recetas: {id: receta} }. Devuelve {total, porUnidad, faltantes[]} (sin colchón).
function costoReceta(id, ctx, pila = []) {
    const r = ctx.recetas[id];
    if (!r) return { total: 0, porUnidad: 0, faltantes: [`receta:${id}`] };
    if (pila.includes(id)) return { total: 0, porUnidad: 0, faltantes: [`ciclo:${r.nombre || id}`] };
    const faltantes = [];
    let total = 0;
    for (const it of r.items || []) {
        const q = num(it.cantidad);
        if (it.tipo === 'receta') {
            const sub = costoReceta(it.id, ctx, [...pila, id]);
            total += q * sub.porUnidad;
            faltantes.push(...sub.faltantes);
        } else if (ctx.insumos[it.id]) {
            total += q * costoUnitarioInsumo(ctx.insumos[it.id]);
        } else faltantes.push(`insumo:${it.id || '(vacío)'}`);
    }
    return { total, porUnidad: total / (num(r.pesoTotal) || 1), faltantes };
}

function costoPlato(plato, ctx, colchonPct = 0) {
    const faltantes = [];
    const f = 1 + num(colchonPct) / 100;
    let ingredientes = 0;
    const lineas = [];
    for (const it of plato.items || []) {
        const q = num(it.cantidad);
        let costo = 0;
        if (it.tipo === 'receta') {
            const r = costoReceta(it.id, ctx);
            costo = q * r.porUnidad;
            faltantes.push(...r.faltantes);
        } else if (ctx.insumos[it.id]) costo = q * costoUnitarioInsumo(ctx.insumos[it.id]);
        else faltantes.push(`insumo:${it.id || '(vacío)'}`);
        ingredientes += costo;
        lineas.push({ nombre: it.nombre || it.id, tipo: it.tipo, cantidad: q, costo_real: redondear(costo), costo: redondear(costo * f) });
    }
    const manoObra = num(plato.manoObra);
    const precio = num(plato.precio);
    const real = ingredientes + manoObra, conColchon = ingredientes * f + manoObra;
    return {
        id: plato.id, plato: String(plato.nombre || '').trim(), activo: plato.activo === true, precio,
        costo_ingredientes_real: redondear(ingredientes), mano_obra: redondear(manoObra),
        costo_real: redondear(real), fc_real_pct: precio ? pct1((real / precio) * 100) : null,
        costo: redondear(conColchon), fc_pct: precio ? pct1((conColchon / precio) * 100) : null,
        margen: precio - redondear(conColchon),
        margen_pct: precio ? pct1(((precio - conColchon) / precio) * 100) : null,
        margen_real: precio - redondear(real),
        faltantes: [...new Set(faltantes)], lineas
    };
}

// Precio mínimo para lograr un margen objetivo sobre el precio (margen = (precio-costo)/precio).
function precioSugerido(costo, margenObjetivoPct, redondeo = 500) {
    const m = num(margenObjetivoPct) / 100;
    if (!(costo > 0) || m <= 0 || m >= 1) return null;
    return Math.ceil(costo / (1 - m) / redondeo) * redondeo;
}

function alertaPlato(f, margenObjetivoPct) {
    if (f.faltantes.length) return 'referencias rotas (insumo/receta borrados o vacíos)';
    if (!f.costo) return 'sin costo';
    if (!f.precio) return 'sin precio';
    if (f.costo >= f.precio) return 'costo ≥ precio';
    if (margenObjetivoPct && f.margen_pct < margenObjetivoPct) return `margen bajo el objetivo (${margenObjetivoPct}%)`;
    return undefined;
}

const aMapa = (arr) => Object.fromEntries((arr || []).map((x) => [x.id, x]));

// { insumos[], recetas[], platos[] } (cada uno con id) + { colchonPct, margenObjetivoPct }.
function calcularPlatos({ insumos = [], recetas = [], platos = [] }, { colchonPct = 0, margenObjetivoPct = 0 } = {}) {
    const ctx = { insumos: aMapa(insumos), recetas: aMapa(recetas) };
    return platos.map((p) => {
        const f = costoPlato(p, ctx, colchonPct);
        return { ...f, precio_sugerido: precioSugerido(f.costo, margenObjetivoPct), alerta: alertaPlato(f, margenObjetivoPct) };
    });
}

// Alzas de precio de compra en los últimos `dias` días (a partir de historialPrecios).
// Compara el precio anterior al primer cambio de la ventana contra el precio actual; solo reporta subidas.
// platos_afectados: platos ACTIVOS que usan el insumo (directo o por receta).
function alzasDePrecio({ insumos = [], recetas = [], platos = [] }, { dias = 30, ahora = Date.now() } = {}) {
    const desdeMs = ahora - dias * 86400000;
    const recetasPorId = aMapa(recetas);
    const usa = (items, insumoId, pila = []) => (items || []).some((it) => {
        if (it.tipo === 'insumo') return it.id === insumoId;
        if (it.tipo !== 'receta' || pila.includes(it.id)) return false;
        const r = recetasPorId[it.id];
        return !!r && usa(r.items, insumoId, [...pila, it.id]);
    });
    const out = [];
    for (const ins of insumos) {
        const h = (Array.isArray(ins.historialPrecios) ? ins.historialPrecios : [])
            .filter((e) => Date.parse(e.fecha) >= desdeMs);
        if (!h.length) continue;
        const desde = Number(h[0].anterior) || 0;
        const hasta = Number(h[h.length - 1].precio) || 0;
        if (!(desde > 0) || hasta <= desde) continue;
        out.push({
            id: ins.id, insumo: ins.nombre || ins.id, desde, hasta,
            alza_pct: Math.round(((hasta - desde) / desde) * 1000) / 10,
            fecha: h[h.length - 1].fecha,
            platos_afectados: platos.filter((p) => p.activo === true && usa(p.items, ins.id)).map((p) => p.nombre || p.id)
        });
    }
    return out.sort((a, b) => b.alza_pct - a.alza_pct);
}

module.exports = { costoUnitarioInsumo, costoReceta, costoPlato, precioSugerido, alertaPlato, calcularPlatos, alzasDePrecio };
