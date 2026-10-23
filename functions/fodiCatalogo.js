// FODI · gestión del catálogo por chat: crear insumos, recetas, platos de costos, productos del menú y combos,
// y pausar/reanudar/desactivar/activar productos, combos y platos.
// Esta capa NUNCA escribe: valida, resuelve nombres a ids y devuelve una acción 'catalogo' que el
// administrador confirma con un botón; el panel (admin.js) es quien guarda, con las mismas rutas de siempre.
//   node --test --test-concurrency=1 tests/fodi-catalogo.test.js

const num = (v) => { const n = Number(v); return Number.isFinite(n) ? n : NaN; };
const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

const ENTIDADES = ['insumo', 'receta', 'plato', 'producto', 'combo'];
const ACCIONES = ['crear', 'pausar', 'reanudar', 'desactivar', 'activar', 'describir', 'foto', 'precio'];
const COL = { insumo: 'costos_insumos', receta: 'costos_recetas', plato: 'costos_platos', producto: 'productos', combo: 'combospacks' };
const ROTULO = { insumo: 'insumo', receta: 'receta', plato: 'plato de costos', producto: 'producto del menú', combo: 'combo' };

const TOOL = {
    name: 'gestionar_catalogo',
    description: 'CREA o CAMBIA el catálogo del negocio; NO ejecuta nada: el administrador verá una tarjeta con botón y debe confirmarla. entidad: "insumo" (ingrediente de la calculadora de costos), "receta" (preparación de insumos/otras recetas), "plato" (plato de costos: receta+precio, aún no vendido), "producto" (lo que se VENDE en el menú/POS: así se "agrega al menú") o "combo". accion "crear" necesita los datos de esa entidad; "pausar"/"reanudar" (producto o combo: salen/vuelven al menú), "desactivar"/"activar" (producto o combo: además POS; plato: activo en costos). accion "precio" (producto, combo o plato de costos): cambia el precio de venta (campo precio; en combo es su valor). accion "describir" (solo producto): cambia la descripción de un producto existente (campo descripcion). accion "foto" (solo producto): le pone como foto la imagen que el administrador adjuntó en ESTE mensaje (si no adjuntó ninguna, pídesela); al crear un producto puedes usar con_foto=true para que use esa imagen. Antes de crear una receta/plato, los insumos o recetas que use deben existir (si faltan, créalos primero y avisa). Si falta cualquier dato obligatorio, pídeselo al administrador; no inventes precios ni cantidades.',
    input_schema: {
        type: 'object',
        properties: {
            accion: { type: 'string', enum: ACCIONES },
            entidad: { type: 'string', enum: ENTIDADES },
            nombre: { type: 'string', description: 'Nombre del elemento (al crear: el nombre nuevo; en las demás acciones: el existente).' },
            unidad: { type: 'string', description: 'Solo insumo: unidad de uso (g, ml, und…). Por defecto "g".' },
            precio_compra: { type: 'number', description: 'Solo insumo: precio de compra del empaque, en pesos.' },
            peso_empaque: { type: 'number', description: 'Solo insumo: cantidad que trae el empaque, en la unidad (ej. 1000 g).' },
            merma_pct: { type: 'number', description: 'Solo insumo: % de merma real (0-100, por defecto 0).' },
            peso_total: { type: 'number', description: 'Solo receta: cuánto rinde la receta (en la misma unidad de sus insumos, por defecto 1).' },
            items: {
                type: 'array', maxItems: 40,
                description: 'Solo receta y plato: líneas de ingredientes. tipo "insumo" o "receta"; nombre como existe; cantidad en la unidad del insumo.',
                items: { type: 'object', properties: { tipo: { type: 'string', enum: ['insumo', 'receta'] }, nombre: { type: 'string' }, cantidad: { type: 'number' } }, required: ['tipo', 'nombre', 'cantidad'] }
            },
            mano_obra: { type: 'number', description: 'Solo plato: costo de mano de obra por unidad (por defecto 0).' },
            precio: { type: 'number', description: 'Plato, producto o combo: precio de venta en pesos (obligatorio con accion "precio").' },
            categoria: { type: 'string', description: 'Solo producto: categoría del menú (debe existir).' },
            descripcion: { type: 'string', description: 'Producto: descripción corta (máx. 700 caracteres). Obligatoria con accion "describir"; opcional al crear.' },
            con_foto: { type: 'boolean', description: 'Solo producto al crear: true para usar como foto la imagen adjunta en este mensaje.' },
            vender_pausado: { type: 'boolean', description: 'Solo producto: true para crearlo pausado (no visible aún).' },
            plato_costos: { type: 'string', description: 'Solo producto: nombre del plato de costos al que se enlaza (opcional).' },
            papas: { type: 'string', description: 'Solo combo: papas que incluye (texto, ej. "Papas medianas").' },
            valor: { type: 'number', description: 'Solo combo: valor del combo en pesos.' }
        },
        required: ['accion', 'entidad', 'nombre']
    }
};

const leer = async (db, col) => (await db.collection(col).get()).docs.map((d) => ({ id: d.id, ...d.data() }));

// Un solo elemento por nombre: exacto gana; si no, contiene; ambiguo o ausente => error.
function resolver(lista, nombre, campo, rotulo) {
    const q = norm(nombre);
    if (!q) return { error: `Falta el nombre del ${rotulo}.` };
    let h = lista.filter((x) => norm(x[campo]) === q);
    if (!h.length) h = lista.filter((x) => norm(x[campo]).includes(q));
    if (!h.length) return { error: `No hay ${rotulo} llamado "${nombre}".` };
    if (h.length > 1) return { error: `Hay varios ${rotulo}s que coinciden con "${nombre}": ${h.slice(0, 8).map((x) => x[campo]).join('; ')}. Pide al administrador que elija uno.` };
    return { item: h[0] };
}

async function resolverLineas(db, items) {
    if (!Array.isArray(items) || !items.length) return { error: 'Faltan los ingredientes (items).' };
    const [insumos, recetas] = await Promise.all([leer(db, COL.insumo), leer(db, COL.receta)]);
    const out = [], faltan = [];
    for (const it of items.slice(0, 40)) {
        const cant = num(it && it.cantidad);
        if (!(cant > 0)) return { error: `La cantidad de "${(it && it.nombre) || '?'}" debe ser mayor que 0.` };
        const tipo = it.tipo === 'receta' ? 'receta' : 'insumo';
        const r = resolver(tipo === 'receta' ? recetas : insumos, it.nombre, 'nombre', tipo);
        if (r.error) { if (/^No hay/.test(r.error)) { faltan.push(`${tipo} "${it.nombre}"`); continue; } return { error: r.error }; }
        out.push({ tipo, id: r.item.id, nombre: String(r.item.nombre || ''), cantidad: cant });
    }
    if (faltan.length) return { error: `No existen: ${faltan.join(', ')}. Créalos primero (como insumo o receta) y avisa al administrador, o corrige el nombre.` };
    return { items: out };
}

async function crear(db, a, ctx) {
    const nombre = String(a.nombre || '').trim().slice(0, 80);
    if (nombre.length < 2) return { error: 'El nombre es muy corto.' };
    const { entidad } = a;
    const existentes = await leer(db, COL[entidad]);
    const choca = (x) => norm(x.nombre) === norm(nombre) && (entidad !== 'producto' || norm(x.categoria) === norm(a.categoria));
    if (existentes.some(choca)) return { error: `Ya existe ${ROTULO[entidad]} "${nombre}"${entidad === 'producto' ? ' en esa categoría' : ''}. No lo dupliques.` };

    if (entidad === 'insumo') {
        const precio = num(a.precio_compra), peso = num(a.peso_empaque), merma = a.merma_pct == null ? 0 : num(a.merma_pct);
        if (!(precio > 0 && precio <= 1e8)) return { error: 'precio_compra debe ser mayor que 0.' };
        if (!(peso > 0)) return { error: 'peso_empaque debe ser mayor que 0 (cuánto trae el empaque).' };
        if (!(merma >= 0 && merma <= 100)) return { error: 'merma_pct debe estar entre 0 y 100.' };
        const unidad = String(a.unidad || 'g').trim().slice(0, 12) || 'g';
        return { payload: { nombre, unidad, precioCompra: precio, pesoEmpaque: peso, mermaPct: merma, costoRespaldo: 0 },
            resumen: [`Precio de compra: $${precio}`, `Empaque: ${peso} ${unidad}`, `Merma: ${merma}%`] };
    }
    if (entidad === 'receta' || entidad === 'plato') {
        const l = await resolverLineas(db, a.items);
        if (l.error) return l;
        if (entidad === 'receta') {
            const pt = a.peso_total == null ? 1 : num(a.peso_total);
            if (!(pt > 0)) return { error: 'peso_total debe ser mayor que 0.' };
            return { payload: { nombre, pesoTotal: pt, items: l.items }, resumen: [`Rinde: ${pt}`, ...l.items.map((i) => `${i.cantidad} × ${i.nombre} (${i.tipo})`)] };
        }
        const precio = a.precio == null ? 0 : num(a.precio), mo = a.mano_obra == null ? 0 : num(a.mano_obra);
        if (!(precio >= 0) || !(mo >= 0)) return { error: 'precio y mano_obra no pueden ser negativos.' };
        return { payload: { nombre, precio, manoObra: mo, items: l.items, activo: false },
            resumen: [`Precio: $${precio}`, `Mano de obra: $${mo}`, ...l.items.map((i) => `${i.cantidad} × ${i.nombre} (${i.tipo})`), 'Queda como idea en estudio (inactivo) hasta que lo actives.'] };
    }
    if (entidad === 'producto') {
        const precio = num(a.precio);
        if (!(precio >= 0 && precio <= 1e8) || a.precio == null) return { error: 'Falta el precio de venta del producto.' };
        const cats = await leer(db, 'categorias');
        const c = cats.find((x) => norm(x.name || x.nombre) === norm(a.categoria));
        if (!c) return { error: `La categoría "${a.categoria || ''}" no existe. Categorías: ${cats.map((x) => x.name || x.nombre).filter(Boolean).join(', ')}.` };
        const catNombre = String(c.name || c.nombre);
        let platoId = null, platoNombre = null;
        if (a.plato_costos) {
            const r = resolver(await leer(db, COL.plato), a.plato_costos, 'nombre', 'plato de costos');
            if (r.error) return r;
            platoId = r.item.id; platoNombre = String(r.item.nombre || '');
        }
        if (a.con_foto === true && !ctx.tieneImagen) return { error: 'No hay imagen adjunta en este mensaje. Pídele al administrador que la adjunte (📎) y vuelve a llamar.' };
        const estado = a.vender_pausado === true ? 'paused' : 'active';
        return { payload: { nombre, precio, categoria: catNombre, descripcion: String(a.descripcion || '').trim().slice(0, 700), estado, platoId, conFoto: a.con_foto === true },
            resumen: [`Categoría: ${catNombre}`, `Precio: $${precio}`, estado === 'paused' ? 'Se crea PAUSADO (no se ve en el menú).' : 'Visible en el menú al crearlo.', ...(a.descripcion ? [`Descripción: ${String(a.descripcion).trim().slice(0, 300)}`] : []), ...(a.con_foto === true ? ['Con la foto adjunta.'] : ['Sin foto (usa la imagen por defecto).']), ...(platoNombre ? [`Enlazado al plato de costos "${platoNombre}".`] : [])] };
    }
    // combo
    const valor = num(a.valor);
    if (!(valor > 0 && valor <= 1e8)) return { error: 'Falta el valor del combo.' };
    return { payload: { nombre, papas: String(a.papas || '').trim().slice(0, 80), valor }, resumen: [`Valor: $${valor}`, ...(a.papas ? [`Incluye: ${String(a.papas).trim()}`] : []), 'Visible en menú y POS (sin bebida; se la pones desde la pestaña Combos).'] };
}

async function cambiarEstado(db, a) {
    const { entidad, accion } = a;
    if (entidad === 'insumo' || entidad === 'receta') return { error: `Un ${ROTULO[entidad]} no se pausa ni se desactiva; si ya no se usa, se borra desde Costos y recetas.` };
    const campo = 'nombre';
    const r = resolver(await leer(db, COL[entidad]), a.nombre, campo, ROTULO[entidad]);
    if (r.error) return r;
    const x = r.item, on = accion === 'reanudar' || accion === 'activar', full = accion === 'desactivar' || accion === 'activar';
    let patch, antes;
    if (entidad === 'plato') { patch = { activo: on }; antes = x.activo === true ? 'activo' : 'inactivo'; }
    else if (entidad === 'producto') {
        patch = { estado: on ? 'active' : 'paused', ...(full ? { visible_pos: on } : {}) };
        antes = x.estado === 'paused' ? 'pausado' : 'activo';
    } else {
        patch = { estado: on ? 'active' : 'paused', ...(full ? { activo_pos: on, activo_menu: on } : {}) };
        antes = x.estado === 'paused' ? 'pausado' : 'activo';
    }
    const yaEsta = entidad === 'plato' ? (x.activo === true) === on : ((x.estado === 'paused') === !on && (!full || (entidad === 'producto' ? (x.visible_pos !== false) === on : (x.activo_pos !== false && x.activo_menu !== false) === on)));
    if (yaEsta) return { error: `"${x.nombre}" ya está ${on ? 'activo' : (entidad === 'plato' ? 'inactivo' : 'pausado')}; no hay nada que cambiar.` };
    return { id: x.id, nombre: String(x.nombre), payload: patch, resumen: [`Estado actual: ${antes}.`] };
}

// Valida y resuelve la petición. Devuelve { ok, accion } (para el cliente) o { error }. Nunca escribe.
async function editarProducto(db, a, ctx) {
    if (a.entidad !== 'producto') return { error: 'Descripción y foto solo se pueden cambiar en productos del menú.' };
    const r = resolver(await leer(db, COL.producto), a.nombre, 'nombre', ROTULO.producto);
    if (r.error) return r;
    const x = r.item;
    if (a.accion === 'describir') {
        const d = String(a.descripcion || '').trim().slice(0, 700);
        if (d.length < 3) return { error: 'Falta la descripción (mínimo 3 letras).' };
        return { id: x.id, nombre: String(x.nombre), payload: { descripcion: d }, resumen: [`Descripción nueva: ${d}`, ...(x.descripcion ? [`Antes: ${String(x.descripcion).slice(0, 120)}`] : [])] };
    }
    if (!ctx.tieneImagen) return { error: 'No hay imagen adjunta en este mensaje. Pídele al administrador que la adjunte (📎) y vuelve a llamar.' };
    return { id: x.id, nombre: String(x.nombre), payload: { conFoto: true }, resumen: ['Se reemplaza la foto actual por la imagen que adjuntaste.'] };
}

async function cambiarPrecio(db, a) {
    if (!['producto', 'combo', 'plato'].includes(a.entidad)) return { error: 'El precio de venta se cambia en productos, combos o platos. Para insumos usa proponer_accion tipo precio_insumo.' };
    const nuevo = num(a.precio);
    if (a.precio == null || !(nuevo >= 0 && nuevo <= 1e8)) return { error: 'Falta el precio nuevo (en pesos).' };
    const r = resolver(await leer(db, COL[a.entidad]), a.nombre, 'nombre', ROTULO[a.entidad]);
    if (r.error) return r;
    const x = r.item, campo = a.entidad === 'combo' ? 'valor' : 'precio', antes = Number(x[campo]) || 0;
    if (antes === nuevo) return { error: `"${x.nombre}" ya tiene ese precio ($${antes}).` };
    return { id: x.id, nombre: String(x.nombre), payload: { [campo]: nuevo }, resumen: [`Precio: $${antes} → $${nuevo}`] };
}

async function proponerCatalogo(db, args = {}, ctx = {}) {
    if (!ACCIONES.includes(args.accion)) return { error: `accion debe ser una de: ${ACCIONES.join(', ')}.` };
    if (!ENTIDADES.includes(args.entidad)) return { error: `entidad debe ser una de: ${ENTIDADES.join(', ')}.` };
    const r = args.accion === 'crear' ? await crear(db, args, ctx) : args.accion === 'precio' ? await cambiarPrecio(db, args) : (args.accion === 'describir' || args.accion === 'foto') ? await editarProducto(db, args, ctx) : await cambiarEstado(db, args);
    if (r.error) return { error: r.error };
    return { ok: true, accion: { tipo: 'catalogo', operacion: args.accion, entidad: args.entidad, nombre: r.nombre || String(args.nombre).trim(), id: r.id || null, payload: r.payload, resumen: r.resumen || [] } };
}

module.exports = { TOOL, proponerCatalogo, ENTIDADES, ACCIONES };
