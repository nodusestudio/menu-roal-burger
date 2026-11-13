var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var core_exports = {};
__export(core_exports, {
  ALMUERZO_CATEGORIA: () => ALMUERZO_CATEGORIA,
  ALMUERZO_PRECIO: () => ALMUERZO_PRECIO,
  ALMUERZO_PRODUCTO_ID: () => ALMUERZO_PRODUCTO_ID,
  ARROZ_DEFECTO: () => ARROZ_DEFECTO,
  CATEGORIAS: () => CATEGORIAS,
  ORDEN_CATEGORIAS: () => ORDEN_CATEGORIAS,
  armarCombinacion: () => armarCombinacion,
  calcularComponente: () => calcularComponente,
  componenteSeleccionable: () => componenteSeleccionable,
  componenteSinStock: () => componenteSinStock,
  consumoDeReceta: () => consumoDeReceta,
  consumosDePedido: () => consumosDePedido,
  costoRecetaPorUnidad: () => costoRecetaPorUnidad,
  costoUnitarioInsumo: () => costoUnitarioInsumo,
  deltaConsumos: () => deltaConsumos,
  etiquetaCombinacion: () => etiquetaCombinacion,
  insumoConStock: () => insumoConStock,
  itemsAlmuerzo: () => itemsAlmuerzo,
  opcionesPorCategoria: () => opcionesPorCategoria,
  reporteAlmuerzos: () => reporteAlmuerzos,
  validarStock: () => validarStock
});
module.exports = __toCommonJS(core_exports);
const ALMUERZO_PRODUCTO_ID = "almuerzo-ejecutivo";
const ALMUERZO_CATEGORIA = "ALMUERZOS";
const ALMUERZO_PRECIO = 19e3;
const CATEGORIAS = {
  proteina: { id: "proteina", label: "Prote\xEDna", plural: "Prote\xEDnas", icono: "\u{1F357}", porcion: 150, unidad: "g" },
  contorno: { id: "contorno", label: "Contorno", plural: "Contornos", icono: "\u{1F35F}", porcion: 100, unidad: "g" },
  ensalada: { id: "ensalada", label: "Ensalada", plural: "Ensaladas", icono: "\u{1F957}", porcion: 100, unidad: "g" },
  bebida: { id: "bebida", label: "Bebida", plural: "Bebidas", icono: "\u{1F964}", porcion: 500, unidad: "ml" }
};
const ORDEN_CATEGORIAS = ["proteina", "contorno", "ensalada", "bebida"];
const ARROZ_DEFECTO = { porcion: 200, unidad: "g" };
const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const redondear = (v) => Math.round(num(v));
const pct1 = (v) => Math.round(num(v) * 10) / 10;
const r3 = (v) => Math.round(num(v) * 1e3) / 1e3;
function costoUnitarioInsumo(ing) {
  if (!ing) return 0;
  const peso = num(ing.pesoEmpaque);
  if (num(ing.precioCompra) > 0 && peso > 0) return num(ing.precioCompra) * (1 + num(ing.mermaPct) / 100) / peso;
  return num(ing.costoRespaldo);
}
function costoRecetaPorUnidad(id, ctx, pila = []) {
  const r = ctx.recetas[id];
  if (!r) return { porUnidad: 0, faltantes: [`receta:${id}`] };
  if (pila.includes(id)) return { porUnidad: 0, faltantes: [`ciclo:${r.nombre || id}`] };
  const faltantes = [];
  let total = 0;
  for (const it of r.items || []) {
    const q = num(it.cantidad);
    if (it.tipo === "receta") {
      const sub = costoRecetaPorUnidad(it.id, ctx, [...pila, id]);
      total += q * sub.porUnidad;
      faltantes.push(...sub.faltantes);
    } else if (ctx.insumos[it.id]) total += q * costoUnitarioInsumo(ctx.insumos[it.id]);
    else faltantes.push(`insumo:${it.id || "(vac\xEDo)"}`);
  }
  return { porUnidad: total / (num(r.pesoTotal) || 1), faltantes };
}
function consumoDeReceta(id, cantidad, ctx, pila = [], acc = {}) {
  const r = ctx.recetas[id];
  if (!r || pila.includes(id)) return acc;
  const factor = num(cantidad) / (num(r.pesoTotal) || 1);
  for (const it of r.items || []) {
    const q = num(it.cantidad) * factor;
    if (it.tipo === "receta") consumoDeReceta(it.id, q, ctx, [...pila, id], acc);
    else if (ctx.insumos[it.id]) acc[it.id] = (acc[it.id] || 0) + q;
  }
  return acc;
}
function calcularComponente(comp, ctx, porcionDefecto = null) {
  const cat = CATEGORIAS[comp.categoria] || {};
  const porcion = num(comp.porcion) > 0 ? num(comp.porcion) : num(porcionDefecto?.porcion ?? cat.porcion);
  const unidad = String(comp.unidad || porcionDefecto?.unidad || cat.unidad || "g");
  const ref = comp.ref || {};
  let consumoMapa = {};
  let faltantes = [];
  if (ref.tipo === "insumo") {
    if (ctx.insumos[ref.id]) consumoMapa = { [ref.id]: porcion };
    else faltantes = [`insumo:${ref.id || "(vac\xEDo)"}`];
  } else if (ref.tipo === "receta") {
    faltantes = costoRecetaPorUnidad(ref.id, ctx).faltantes;
    consumoMapa = consumoDeReceta(ref.id, porcion, ctx);
  } else faltantes = ["sin receta vinculada"];
  const consumos = Object.entries(consumoMapa).map(([insumoId, cantidad]) => {
    const ins = ctx.insumos[insumoId];
    const costoUnit = costoUnitarioInsumo(ins);
    return { insumoId, nombre: ins?.nombre || insumoId, cantidad: r3(cantidad), unidad: ins?.unidad || "", costoUnit: r3(costoUnit), costo: r3(cantidad * costoUnit) };
  });
  const costoReal = consumos.reduce((s, c) => s + c.costo, 0);
  return {
    componenteId: comp.id || null,
    categoria: comp.categoria,
    nombre: String(comp.nombre || "").trim(),
    porcion: r3(porcion),
    unidad,
    costoReal: r3(costoReal),
    consumos,
    faltantes: [...new Set(faltantes)]
  };
}
const componenteSeleccionable = (c) => !!c && c.activo !== false && c.disponible === true;
function opcionesPorCategoria(componentes) {
  const out = {};
  for (const cat of ORDEN_CATEGORIAS) out[cat] = (componentes || []).filter((c) => c.categoria === cat && componenteSeleccionable(c));
  return out;
}
function armarCombinacion({ config = {}, componentes = [], seleccion = {}, ctx, colchonPct = 0, ahora = Date.now() }) {
  const errores = [];
  const porId = Object.fromEntries((componentes || []).map((c) => [c.id, c]));
  const piezas = [];
  const arrozCfg = config.arroz || {};
  const arroz = calcularComponente(
    { id: "arroz", categoria: "arroz", nombre: arrozCfg.nombre || "Arroz", ref: arrozCfg.ref, porcion: arrozCfg.porcion || ARROZ_DEFECTO.porcion, unidad: arrozCfg.unidad || ARROZ_DEFECTO.unidad },
    ctx
  );
  for (const cat of ORDEN_CATEGORIAS) {
    const id = seleccion[cat];
    const label = CATEGORIAS[cat].label.toLowerCase();
    if (!id) {
      errores.push(`Falta elegir ${cat === "bebida" || cat === "ensalada" || cat === "proteina" ? "la" : "el"} ${label}.`);
      continue;
    }
    const comp = porId[id];
    if (!comp || comp.categoria !== cat) {
      errores.push(`La opci\xF3n elegida de ${label} ya no existe.`);
      continue;
    }
    if (!componenteSeleccionable(comp)) {
      errores.push(`"${comp.nombre}" no est\xE1 disponible hoy.`);
      continue;
    }
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
  const consumos = {};
  for (const p of todas) for (const c of p.consumos) {
    const k = consumos[c.insumoId] || (consumos[c.insumoId] = { nombre: c.nombre, unidad: c.unidad, cantidad: 0 });
    k.cantidad = r3(k.cantidad + c.cantidad);
  }
  return {
    ok: true,
    errores: [],
    snapshot: {
      version: 1,
      producto: String(config.nombre || "Almuerzo Ejecutivo"),
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
      margenPct: precio ? pct1((precio - costoReal) / precio * 100) : null,
      foodCostPct: precio ? pct1(costoReal / precio * 100) : null,
      faltantes
    }
  };
}
function etiquetaCombinacion(snapshot) {
  if (!snapshot) return "";
  const nombres = (snapshot.componentes || []).map((c) => c.nombre).filter(Boolean);
  const arroz = snapshot.arroz ? `${snapshot.arroz.nombre || "Arroz"} ${snapshot.arroz.porcion}${snapshot.arroz.unidad}` : "";
  return [...nombres, arroz].filter(Boolean).join(" + ");
}
const itemsAlmuerzo = (items) => (items || []).filter((i) => i && i.almuerzo && typeof i.almuerzo === "object");
function consumosDePedido(items) {
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
function deltaConsumos(antes = {}, despues = {}) {
  const out = {};
  for (const id of /* @__PURE__ */ new Set([...Object.keys(antes), ...Object.keys(despues)])) {
    const d = r3(num(despues[id]?.cantidad) - num(antes[id]?.cantidad));
    if (d !== 0) out[id] = { nombre: despues[id]?.nombre || antes[id]?.nombre || id, unidad: despues[id]?.unidad || antes[id]?.unidad || "", cantidad: d };
  }
  return out;
}
const insumoConStock = (ins) => !!ins && ins.stockActual !== void 0 && ins.stockActual !== null && ins.stockActual !== "" && Number.isFinite(Number(ins.stockActual));
function validarStock(delta, insumos) {
  const faltan = [];
  for (const [id, c] of Object.entries(delta || {})) {
    if (!(c.cantidad > 0)) continue;
    const ins = insumos[id];
    if (!insumoConStock(ins)) continue;
    if (num(ins.stockActual) + 1e-9 < c.cantidad) faltan.push({ insumoId: id, nombre: ins.nombre || c.nombre, unidad: ins.unidad || c.unidad, necesita: r3(c.cantidad), hay: r3(num(ins.stockActual)) });
  }
  return faltan;
}
function componenteSinStock(comp, ctx) {
  const f = calcularComponente(comp, ctx, CATEGORIAS[comp.categoria]);
  const delta = Object.fromEntries(f.consumos.map((c) => [c.insumoId, { nombre: c.nombre, unidad: c.unidad, cantidad: c.cantidad }]));
  return validarStock(delta, ctx.insumos);
}
const pedidoValido = (o) => o && o.status !== "cancelado" && o.anulado !== true && o.voided !== true;
const rank = (m) => [...m.values()].sort((a, b) => b.cantidad - a.cantidad || b.utilidad - a.utilidad);
function reporteAlmuerzos(orders, { desdeMs = 0, hastaMs = Infinity } = {}) {
  const ms = (o) => {
    const v = o.createdAtMs ?? o.createdAt;
    return v && typeof v.toMillis === "function" ? v.toMillis() : num(v);
  };
  const cat = { proteina: /* @__PURE__ */ new Map(), contorno: /* @__PURE__ */ new Map(), ensalada: /* @__PURE__ */ new Map(), bebida: /* @__PURE__ */ new Map() };
  const combos = /* @__PURE__ */ new Map();
  const dias = /* @__PURE__ */ new Map();
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
      vendidos += q;
      ingresos += precio * q;
      costoReal += costo * q;
      if ((s.faltantes || []).length) sinCostoCompleto += q;
      for (const c of s.componentes || []) {
        const m = cat[c.categoria];
        if (!m) continue;
        const key = c.componenteId || c.nombre;
        const r = m.get(key) || { clave: key, nombre: c.nombre, cantidad: 0, costo: 0, utilidad: 0 };
        r.cantidad += q;
        r.costo += num(c.costoReal) * q;
        r.utilidad += utilidadUnidad * q;
        m.set(key, r);
      }
      const ckey = (s.componentes || []).map((c) => c.componenteId || c.nombre).join("|");
      const cb = combos.get(ckey) || { clave: ckey, nombre: (s.componentes || []).map((c) => c.nombre).join(" + "), cantidad: 0, costoUnidad: costo, utilidadUnidad, ingresos: 0, utilidad: 0 };
      cb.cantidad += q;
      cb.ingresos += precio * q;
      cb.utilidad += utilidadUnidad * q;
      cb.costoUnidad = costo;
      cb.utilidadUnidad = utilidadUnidad;
      combos.set(ckey, cb);
      const dia = t ? new Date(t - 5 * 36e5).toISOString().slice(0, 10) : "sin fecha";
      const d = dias.get(dia) || { dia, cantidad: 0, ingresos: 0, costo: 0 };
      d.cantidad += q;
      d.ingresos += precio * q;
      d.costo += costo * q;
      dias.set(dia, d);
    }
  }
  const utilidad = ingresos - costoReal;
  return {
    pedidos,
    vendidos,
    ingresos: redondear(ingresos),
    costoReal: redondear(costoReal),
    utilidadBruta: redondear(utilidad),
    margenPct: ingresos ? pct1(utilidad / ingresos * 100) : null,
    costoPromedio: vendidos ? redondear(costoReal / vendidos) : 0,
    utilidadPromedio: vendidos ? redondear(utilidad / vendidos) : 0,
    sinCostoCompleto,
    proteinas: rank(cat.proteina),
    contornos: rank(cat.contorno),
    ensaladas: rank(cat.ensalada),
    bebidas: rank(cat.bebida),
    combinaciones: rank(combos),
    porDia: [...dias.values()].sort((a, b) => a.dia.localeCompare(b.dia)).map((d) => ({ ...d, ingresos: redondear(d.ingresos), costo: redondear(d.costo) }))
  };
}
if (typeof window !== "undefined") {
  window.AlmuerzosCore = {
    ALMUERZO_PRODUCTO_ID,
    ALMUERZO_CATEGORIA,
    ALMUERZO_PRECIO,
    CATEGORIAS,
    ORDEN_CATEGORIAS,
    ARROZ_DEFECTO,
    costoUnitarioInsumo,
    costoRecetaPorUnidad,
    consumoDeReceta,
    calcularComponente,
    componenteSeleccionable,
    opcionesPorCategoria,
    armarCombinacion,
    etiquetaCombinacion,
    itemsAlmuerzo,
    consumosDePedido,
    deltaConsumos,
    insumoConStock,
    validarStock,
    componenteSinStock,
    reporteAlmuerzos
  };
}
