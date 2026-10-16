// Normaliza el volcado de CostoX (colecciones categories, ingredients, recipes, products, promotions,
// config) al esquema de FODEXA (costos_*). Puro, sin Firestore. Lo usa scripts/importar-costox.js.
//
// Reglas de la migración (acordadas con el dueño, 2026-10-16):
//   - NO se importan totales guardados de CostoX: el motor recalcula todo.
//   - La "merma" de 30 % de CostoX era en realidad el colchón de seguridad: pasa a config.colchonPct (30)
//     y la merma real por insumo arranca en 0 para que se afine después. Los costos con colchón quedan
//     idénticos a los que mostraba CostoX con precios actuales.
//   - Tipos antiguos 'ingredient-receta' / 'ingredient-embalaje' eran insumos.

const num = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const slug = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function normalizarItems(items, avisos, donde) {
    return (items || []).map((it) => {
        const tipo = it.type === 'recipe' ? 'receta' : 'insumo';
        const cantidad = num(it.quantity);
        if (!it.id) avisos.push(`${donde}: línea sin referencia (${it.type || '?'}, cant ${cantidad}) — se importa vacía, el motor la marca como rota`);
        if (cantidad < 0) avisos.push(`${donde}: cantidad negativa (${cantidad}) en ${it.name || it.id}`);
        return { tipo, id: it.id || '', cantidad, nombre: it.name || '' };
    });
}

function normalizarCostoX(d) {
    const avisos = [];
    const cfg = (d.config || []).find((c) => c.id === 'global') || (d.config || [])[0] || {};
    const insumos = (d.ingredients || []).map((i) => {
        const base = num(i.costoPorGramo) / (1 + num(i.wastagePercent) / 100);
        return {
            id: i.id, nombre: i.name || '', unidad: i.unit || '', precioCompra: num(i.purchaseCost), pesoEmpaque: num(i.pesoEmpaqueTotal),
            mermaPct: 0, costoRespaldo: Math.round(base * 1000) / 1000, proveedor: i.supplierId || '', origen: 'costox'
        };
    });
    insumos.filter((i) => !(i.precioCompra > 0 && i.pesoEmpaque > 0)).forEach((i) => avisos.push(`insumo sin precio de compra/peso: ${i.nombre} (se usa costo base ${i.costoRespaldo})`));
    const recetas = (d.recipes || []).map((r) => ({
        id: r.id, nombre: r.name || '', categoriaId: r.categoryId || '', descripcion: r.description || '', pesoTotal: num(r.pesoTotal),
        items: normalizarItems(r.ingredients, avisos, `receta ${r.name}`), origen: 'costox'
    }));
    const platos = (d.products || []).map((p, idx) => ({
        id: p.id || `sinid-${slug(p.name) || idx}`, nombre: String(p.name || '').trim(), categoriaId: p.categoryId || '',
        precio: num(p.realSalePrice), manoObra: num(p.laborCost), orden: num(p.order), descripcion: p.description || '',
        tiempoPreparacionMin: num(p.preparationTimeMinutes), productoMenuId: null,
        items: normalizarItems(p.items, avisos, `plato ${String(p.name || '').trim()}`), origen: 'costox'
    }));
    const idsPlatos = new Set(platos.map((p) => p.id));
    const idsInsumos = new Set(insumos.map((i) => i.id));
    const idsRecetas = new Set(recetas.map((r) => r.id));
    const promos = (d.promotions || []).map((p) => {
        const items = (p.items || []).map((it) => {
            const tipo = it.type === 'product' ? 'plato' : it.type === 'recipe' ? 'receta' : 'insumo';
            const existe = tipo === 'plato' ? idsPlatos.has(it.id) : tipo === 'receta' ? idsRecetas.has(it.id) : idsInsumos.has(it.id);
            if (!existe) avisos.push(`promo ${p.name}: referencia inexistente (${tipo} "${it.nombre || ''}")`);
            return { tipo, id: it.id || '', cantidad: num(it.cantidad), nombre: it.nombre || '', precioVenta: num(it.precioVenta), precioOpcional: num(it.optionalPrice) };
        });
        return { id: p.id, nombre: p.name || '', categoriaId: p.categoryId || '', precio: num(p.promoPrice), precioRegular: num(p.pvpRegular), orden: num(p.order), items, origen: 'costox' };
    });
    const categorias = [
        ...(d.categoriesProducts || []).map((c) => ({ ...c, tipo: 'plato' })),
        ...(d.categoriesPromotions || []).map((c) => ({ ...c, tipo: 'promo' })),
        ...(d.categoriesRecipes || []).map((c) => ({ ...c, tipo: 'receta' })),
        ...(d.categories || []).map((c) => ({ ...c, tipo: 'insumo' }))
    ].map((c) => ({ id: `${c.tipo}-${c.id}`, idOriginal: c.id, nombre: c.name || '', tipo: c.tipo, origen: 'costox' }));
    // Las referencias categoriaId de recetas/platos/promos apuntan al id original; se reescriben al id con prefijo de tipo.
    const catDe = (tipo) => (id) => (id ? `${tipo}-${id}` : '');
    recetas.forEach((r) => { r.categoriaId = catDe('receta')(r.categoriaId); });
    platos.forEach((p) => { p.categoriaId = catDe('plato')(p.categoriaId); });
    promos.forEach((p) => { p.categoriaId = catDe('promo')(p.categoriaId); });
    const config = {
        colchonPct: num(cfg.globalWastagePercent) || 30,
        margenObjetivoPct: num(cfg.targetProfitMargin) || 30,
        importadoDeCostoX: { arriendo: num(cfg.rentCost), nomina: num(cfg.payrollCost), servicios: num(cfg.utilitiesCost), otros: num(cfg.otherFixedCosts), ventasMensualesEstimadas: num(cfg.estimatedMonthlySales), horasLaboralesMes: num(cfg.monthlyWorkHours) }
    };
    return { insumos, recetas, platos, promos, categorias, config, avisos };
}

module.exports = { normalizarCostoX };
