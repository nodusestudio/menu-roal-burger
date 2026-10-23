// FODI · ver pedidos entrantes (qué pidió el cliente), ver las fotos del menú y proponer ediciones de pedidos.
//   node --test --test-concurrency=1 tests/fodi-pedidos.test.js
//
// proponerEdicionPedido NUNCA escribe: valida contra el pedido real, calcula el efecto en el total por DELTA
// (total_nuevo = total_actual + Δsubtotal, o + Δdomicilio) para no romper puntos, 2x1 ni otros componentes, y
// devuelve una acción 'editar_pedido' que el administrador confirma con un botón. El panel vuelve a leer el
// pedido antes de guardar y aborta si cambió mientras tanto (baseTotal/baseItems).
// Quedan FUERA (se hacen desde el panel): pedidos cobrados/cerrados, combos con componentes y 2x1.

const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
const num = (v) => { const n = Number(v); return Number.isFinite(n) ? n : NaN; };
const CERRADOS = ['entregado', 'enviado', 'cancelado', 'anulado'];

const tsMs = (t) => (t && typeof t.toMillis === 'function' ? t.toMillis() : Number(t) || 0);
const bogota = (ms) => (ms ? new Date(ms - 5 * 3600e3).toISOString().replace('T', ' ').slice(0, 16) : '');

const cerrado = (o) => CERRADOS.includes(String(o.status || '').toLowerCase()) || o.voided === true || o.anulado === true;
// Cobrado de verdad: paidAt, o pedido de caja/POS con medio asignado (el medio que elige el cliente en la web NO cuenta)
const cobrado = (o) => {
    const m = String(o.paymentMethod || '').toLowerCase();
    if (!m || m === 'pendiente') return false;
    if (o.paidAt) return true;
    const src = String(o.source || '').toLowerCase();
    return !(src.includes('web') || src.includes('agent') || src.includes('whatsapp'));
};
const esDomicilio = (o) => o.orderType === 'domicilio' || o.fulfillmentType === 'delivery' || o.fulfillmentType === 'domicilio';

function resumenPedido(id, o) {
    return {
        id, codigo: o.code || o.orderCode || id, estado: o.status || '', origen: o.source || '', creado: bogota(tsMs(o.createdAt)),
        entrega: esDomicilio(o) ? 'domicilio' : (o.orderType || o.fulfillmentType || ''), mesa: o.mesaNumber || undefined,
        cliente: o.customerName || '', telefono: o.customerPhone || '', direccion: o.deliveryAddress || '',
        tarifa_domicilio: esDomicilio(o) ? (Number(o.deliveryFee) || 0) : undefined, barrio_especial: o.barrioEspecial ? (o.barrioEspecial.nombre || true) : undefined,
        pago: o.paymentMethod || '', cobrado: cobrado(o), editable: !cerrado(o) && !cobrado(o),
        subtotal: Number(o.subtotal) || 0, total: Number(o.total) || 0, puntos_canjeados_descuento: Number(o.pointsDiscountAmount) || undefined,
        items: (Array.isArray(o.items) ? o.items : []).map((it, i) => ({
            n: i + 1, cantidad: Number(it.quantity) || 0, producto: it.productName || '', opcion: it.optionLabel || undefined, nota: it.note && it.note !== it.optionLabel ? it.note : undefined,
            precio_unitario: Number(it.unitPrice) || 0, componente_de_combo: it.parentItemKey ? true : undefined
        })),
        notas: o.notes || o.customerNotes || o.observaciones || undefined
    };
}

async function pedidosActivos(db, args = {}) {
    const snap = await db.collection('pedidos').orderBy('createdAt', 'desc').limit(80).get();
    const q = norm(args.buscar);
    const est = norm(args.estado);
    let lista = snap.docs.map((d) => resumenPedido(d.id, d.data()));
    if (args.incluir_cerrados !== true) lista = lista.filter((p) => !CERRADOS.includes(norm(p.estado)));
    if (est) lista = lista.filter((p) => norm(p.estado) === est);
    if (q) lista = lista.filter((p) => norm(`${p.codigo} ${p.cliente} ${p.telefono} ${p.direccion}`).includes(q));
    const max = Math.min(Math.max(parseInt(args.max, 10) || 12, 1), 25);
    return { total: lista.length, pedidos: lista.slice(0, max), nota: lista.length > max ? `Se muestran ${max} de ${lista.length}; afina con buscar o estado.` : undefined };
}

// ---- Edición ----
async function buscarPedido(db, ref) {
    const q = norm(ref);
    if (!q) return { error: 'Falta el código o el cliente del pedido.' };
    const snap = await db.collection('pedidos').orderBy('createdAt', 'desc').limit(120).get();
    const todos = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    let h = todos.filter((o) => norm(o.code || o.orderCode) === q || o.id === ref);
    if (!h.length) h = todos.filter((o) => norm(o.code || o.orderCode).includes(q) || norm(o.customerName) === q);
    if (!h.length) h = todos.filter((o) => norm(`${o.customerName} ${o.customerPhone}`).includes(q) && !cerrado(o));
    if (!h.length) return { error: `No encontré un pedido activo con "${ref}".` };
    if (h.length > 1) return { error: `Hay ${h.length} pedidos que coinciden: ${h.slice(0, 6).map((o) => `${o.code || o.id} (${o.customerName || 's/n'})`).join('; ')}. Indica el código.` };
    return { pedido: h[0] };
}

const baseDe = (o) => ({ baseTotal: Number(o.total) || 0, baseItems: (Array.isArray(o.items) ? o.items : []).length, baseSubtotal: Number(o.subtotal) || 0 });
const sumaItems = (items) => items.reduce((s, it) => s + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), 0);
const tieneHijos = (items, it) => it.itemKey && items.some((x) => x.parentItemKey === it.itemKey);
const reindexar = (items) => items.map((it, i) => ({ ...it, index: i + 1, subtotal: (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0) }));

function resolverItem(items, ref) {
    const n = parseInt(ref, 10);
    if (Number.isInteger(n) && String(ref).trim() === String(n) && n >= 1 && n <= items.length) return { idx: n - 1 };
    const q = norm(ref);
    const h = items.map((it, i) => ({ it, i })).filter(({ it }) => norm(it.productName) === q);
    const h2 = h.length ? h : items.map((it, i) => ({ it, i })).filter(({ it }) => norm(it.productName).includes(q));
    if (!h2.length) return { error: `El pedido no tiene "${ref}". Productos: ${items.map((it, i) => `${i + 1}. ${it.productName}`).join('; ')}.` };
    if (h2.length > 1) return { error: `Hay varias líneas que coinciden con "${ref}": ${h2.map(({ it, i }) => `${i + 1}. ${it.productName}${it.optionLabel ? ' (' + it.optionLabel + ')' : ''}`).join('; ')}. Usa el número de línea.` };
    return { idx: h2[0].i };
}

async function proponerEdicionPedido(db, a = {}) {
    const r = await buscarPedido(db, a.pedido);
    if (r.error) return r;
    const o = r.pedido;
    const cod = o.code || o.orderCode || o.id;
    if (cerrado(o)) return { error: `El pedido ${cod} ya está ${o.status || 'cerrado'}: no se edita.` };
    if (cobrado(o)) return { error: `El pedido ${cod} ya está cobrado: no se edita desde aquí (el cajero debe hacerlo en el panel).` };
    const items = (Array.isArray(o.items) ? o.items : []).map((x) => ({ ...x }));
    const base = baseDe(o);
    const op = a.operacion;
    const out = { pedidoId: o.id, codigo: cod, operacion: op, ...base, patch: {}, resumen: [] };

    if (op === 'cambiar_direccion') {
        const dir = String(a.direccion || '').trim().slice(0, 200);
        if (dir.length < 5) return { error: 'Falta la dirección nueva (completa, con barrio).' };
        if (!esDomicilio(o)) return { error: `El pedido ${cod} no es a domicilio.` };
        out.patch = { deliveryAddress: dir }; out.resumen = [`Dirección: ${o.deliveryAddress || '(vacía)'} → ${dir}`, 'La tarifa de domicilio NO cambia sola: si el barrio es otro, dime la tarifa nueva.'];
        return { ok: true, accion: out };
    }
    if (op === 'cambiar_domicilio') {
        if (!esDomicilio(o)) return { error: `El pedido ${cod} no es a domicilio.` };
        const fee = num(a.tarifa);
        if (!(fee >= 0 && fee <= 200000) || a.tarifa == null) return { error: 'Falta la tarifa de domicilio nueva (en pesos).' };
        const antes = Number(o.deliveryFee) || 0;
        if (antes === fee) return { error: `El domicilio ya vale $${antes}.` };
        const total = Math.max(0, base.baseTotal - antes + fee);
        out.patch = { deliveryFee: fee, costoDomicilio: fee, total }; out.resumen = [`Domicilio: $${antes} → $${fee}`, `Total del pedido: $${base.baseTotal} → $${total}`];
        return { ok: true, accion: out };
    }
    if (!['agregar_item', 'quitar_item', 'cambiar_cantidad'].includes(op)) return { error: 'operacion debe ser cambiar_direccion, cambiar_domicilio, agregar_item, quitar_item o cambiar_cantidad.' };
    if (items.some((it) => it.orderOptions && it.orderOptions.promo2x1Incremento === true)) return { error: `El pedido ${cod} lleva una promo 2x1: edítalo desde el panel (el recargo de empaque se calcula allí).` };

    let nuevos = items;
    if (op === 'agregar_item') {
        const cant = Math.trunc(num(a.cantidad) || 1);
        if (!(cant >= 1 && cant <= 50)) return { error: 'cantidad debe estar entre 1 y 50.' };
        const prods = (await db.collection('productos').get()).docs.map((d) => ({ id: d.id, ...d.data() }));
        const q = norm(a.producto);
        let h = prods.filter((p) => norm(p.nombre) === q); if (!h.length) h = prods.filter((p) => norm(p.nombre).includes(q));
        if (!h.length) return { error: `No hay un producto llamado "${a.producto}" en el menú.` };
        if (h.length > 1) return { error: `Varios productos coinciden: ${h.slice(0, 8).map((p) => p.nombre).join('; ')}. Pide que elija uno.` };
        const p = h[0];
        if (String(p.estado || '') === 'paused') return { error: `"${p.nombre}" está pausado.` };
        let precio = Number(p.precio) || 0, opcion = '';
        const vars = (Array.isArray(p.variantes) ? p.variantes : []).filter((v) => v && (v.nombre || v.name));
        if (vars.length) {
            const vq = norm(a.variante);
            const v = vq ? (vars.find((x) => norm(x.nombre || x.name) === vq) || vars.find((x) => norm(x.nombre || x.name).includes(vq))) : null;
            if (!v) return { error: `"${p.nombre}" tiene variantes: ${vars.map((x) => `${x.nombre || x.name} ($${Number(x.precio ?? x.price) || 0})`).join('; ')}. Indica cuál (campo variante).` };
            precio = Number(v.precio ?? v.price) || 0; opcion = String(v.nombre || v.name);
            if (v.con_bebida === true) return { error: `La variante "${opcion}" incluye bebida a elegir: agrégala desde el panel.` };
        }
        if (!(precio > 0)) return { error: `"${p.nombre}" no tiene precio válido.` };
        const nota = String(a.nota || '').trim().slice(0, 120);
        nuevos = [...items, { itemKey: `fodi-${Date.now().toString(36)}`, parentItemKey: null, productId: p.id, productName: String(p.nombre), categoryName: String(p.categoria || ''), optionLabel: opcion || nota, note: nota, quantity: cant, unitPrice: precio }];
        out.resumen = [`Agregar ${cant} × ${p.nombre}${opcion ? ' (' + opcion + ')' : ''} a $${precio} c/u = $${cant * precio}`];
    } else {
        const rr = resolverItem(items, a.producto);
        if (rr.error) return rr;
        const it = items[rr.idx];
        if (it.parentItemKey) return { error: `"${it.productName}" es un componente de combo: edítalo desde el panel.` };
        if (tieneHijos(items, it)) return { error: `"${it.productName}" es un combo con componentes: edítalo desde el panel.` };
        if (op === 'quitar_item') {
            if (items.length === 1) return { error: 'Es el único producto del pedido: si quieres anularlo, cancélalo desde el panel.' };
            nuevos = items.filter((_, i) => i !== rr.idx);
            out.resumen = [`Quitar ${it.quantity} × ${it.productName}${it.optionLabel ? ' (' + it.optionLabel + ')' : ''} (−$${(Number(it.quantity) || 0) * (Number(it.unitPrice) || 0)})`];
        } else {
            const cant = Math.trunc(num(a.cantidad));
            if (!(cant >= 1 && cant <= 50)) return { error: 'cantidad debe estar entre 1 y 50 (para quitar usa quitar_item).' };
            if (cant === Number(it.quantity)) return { error: `Ya son ${cant}.` };
            nuevos = items.map((x, i) => (i === rr.idx ? { ...x, quantity: cant } : x));
            out.resumen = [`${it.productName}: ${it.quantity} → ${cant}`];
        }
    }
    const delta = sumaItems(nuevos) - sumaItems(items);
    const total = Math.max(0, base.baseTotal + delta);
    const fin = reindexar(nuevos);
    out.patch = { items: fin, itemCount: fin.length, totalItems: fin.reduce((s, x) => s + (Number(x.quantity) || 0), 0), subtotal: Math.max(0, base.baseSubtotal + delta), total };
    out.resumen.push(`Total del pedido: $${base.baseTotal} → $${total}`);
    return { ok: true, accion: out };
}

// ---- Imágenes del menú (para que FODI las "vea") ----
const IMG_MAX_BYTES = 1.2 * 1024 * 1024;
async function imagenesProductos(db, args = {}, fetchFn = fetch) {
    const prods = (await db.collection('productos').get()).docs.map((d) => ({ id: d.id, ...d.data() }));
    const q = norm(args.buscar);
    const h = prods.filter((p) => p.nombre && (!q || norm(`${p.nombre} ${p.categoria}`).includes(q))).slice(0, 3);
    if (!h.length) return { error: `No hay productos que coincidan con "${args.buscar || ''}".` };
    const blocks = [], vistos = [], fallos = [];
    for (const p of h) {
        let url = String(p.image_url || '');
        if (!url) { fallos.push(`${p.nombre}: sin imagen`); continue; }
        if (url.startsWith('/')) url = 'https://roalburger.com' + url;
        try {
            let data, tipo;
            const dm = url.match(/^data:(image\/(?:jpeg|png|webp|gif));base64,(.+)$/);
            if (dm) { tipo = dm[1]; data = dm[2]; }
            else {
                if (!/^https:\/\//.test(url)) { fallos.push(`${p.nombre}: URL no válida`); continue; }
                const res = await fetchFn(url);
                if (!res.ok) { fallos.push(`${p.nombre}: HTTP ${res.status}`); continue; }
                const buf = Buffer.from(await res.arrayBuffer());
                if (buf.length > IMG_MAX_BYTES) { fallos.push(`${p.nombre}: imagen muy pesada`); continue; }
                tipo = (res.headers.get('content-type') || '').split(';')[0].trim();
                if (!/^image\/(jpeg|png|webp|gif)$/.test(tipo)) { fallos.push(`${p.nombre}: formato ${tipo || 'desconocido'}`); continue; }
                data = buf.toString('base64');
            }
            if (data.length > IMG_MAX_BYTES * 1.4) { fallos.push(`${p.nombre}: imagen muy pesada`); continue; }
            blocks.push({ type: 'text', text: `Imagen del producto "${p.nombre}" (${p.categoria || 'sin categoría'}, $${Number(p.precio) || 0}):` });
            blocks.push({ type: 'image', source: { type: 'base64', media_type: tipo, data } });
            vistos.push(p.nombre);
        } catch (e) { fallos.push(`${p.nombre}: ${(e && e.message) || e}`); }
    }
    if (!blocks.length) return { error: `No pude cargar imágenes: ${fallos.join('; ')}` };
    blocks.push({ type: 'text', text: `Productos mostrados: ${vistos.join(', ')}.${fallos.length ? ' No cargaron: ' + fallos.join('; ') : ''}` });
    return { __contenido: blocks };
}

const TOOLS = [
    {
        name: 'pedidos_activos',
        description: 'PEDIDOS ENTRANTES/ACTIVOS ahora (los que aún no están entregados ni cancelados): qué pidió cada cliente línea por línea (producto, opción/sabor, nota, cantidad, precio), cliente, teléfono, dirección, tarifa de domicilio, pago, si está cobrado y si es editable. Úsala cuando entre o se mencione un pedido, para "¿qué pidió?", "¿qué pedidos hay?", "revisa el pedido X". buscar = código, nombre, teléfono o dirección; incluir_cerrados=true para ver también los cerrados recientes.',
        input_schema: { type: 'object', properties: { buscar: { type: 'string' }, estado: { type: 'string', description: 'Ej. pendiente, preparando, listo.' }, incluir_cerrados: { type: 'boolean' }, max: { type: 'integer', description: '1-25, por defecto 12.' } } }
    },
    {
        name: 'ver_imagenes_productos',
        description: 'MIRA las fotos de productos del menú público (hasta 3 por llamada) para describir cómo se ve un producto, comparar o revisar si la foto sirve. buscar = parte del nombre o categoría (ej. "trifásica", "bebidas"). Úsala cuando pregunten cómo se ve algo, o para saber qué lleva visualmente un producto que vino en un pedido.',
        input_schema: { type: 'object', properties: { buscar: { type: 'string' } }, required: ['buscar'] }
    },
    {
        name: 'editar_pedido',
        description: 'PROPONE editar un pedido ACTIVO (no cobrado): agregar_item (producto del menú + cantidad, variante si la tiene, nota), quitar_item (producto o n° de línea), cambiar_cantidad, cambiar_direccion (domicilio) o cambiar_domicilio (tarifa nueva en pesos). NO ejecuta: el administrador confirma con un botón. El total se ajusta solo. Si el pedido está cobrado/cerrado, lleva promo 2x1 o combos con componentes, dilo y que lo haga desde el panel. Antes de editar, mira el pedido con pedidos_activos. Para saber cuánto cobrar de domicilio usa tarifa_domicilio.',
        input_schema: { type: 'object', properties: {
            pedido: { type: 'string', description: 'Código del pedido (ej. RB-00123), o nombre del cliente si es único.' },
            operacion: { type: 'string', enum: ['agregar_item', 'quitar_item', 'cambiar_cantidad', 'cambiar_direccion', 'cambiar_domicilio'] },
            producto: { type: 'string', description: 'agregar_item: producto del menú. quitar_item/cambiar_cantidad: producto del pedido o su n° de línea.' },
            variante: { type: 'string', description: 'agregar_item: variante si el producto la tiene.' },
            cantidad: { type: 'integer' },
            nota: { type: 'string', description: 'agregar_item: nota del ítem (opcional).' },
            direccion: { type: 'string' },
            tarifa: { type: 'number', description: 'cambiar_domicilio: tarifa nueva en pesos.' }
        }, required: ['pedido', 'operacion'] }
    }
];

module.exports = { pedidosActivos, proponerEdicionPedido, imagenesProductos, resumenPedido, cobrado, cerrado, TOOLS };
