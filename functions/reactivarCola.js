'use strict';

// Reactivar inteligente · COLA DIARIA (Fase 1, semiautomática; decidido 2026-11-20).
// Cada día (6 a. m. Bogotá) el servidor escoge a los N clientes (10 por defecto) que más conviene reactivar:
//   · según SU PROPIO ritmo de compra (no un umbral fijo), priorizando a los que más valen;
//   · en la hora en que ese cliente más pide (si tiene <3 pedidos, la hora pico del local);
//   · ofreciéndole su producto favorito y un regalo de una escalera por días sin pedir, cuyo COSTO REAL no pasa del
//     tope (15 % del ticket habitual del cliente);
//   · aprendiendo: 80 % usa el regalo que más canjea, 20 % prueba otro (solo entre los que caben en el tope);
//   · con un grupo de control (10 % de los elegibles NO recibe mensaje) para medir si el mensaje de verdad suma.
// A la hora de cada uno llega un aviso push y el cajero envía el mensaje (ya armado) con un toque. NO envía solo:
// el cliente recibe el mensaje desde el WhatsApp del negocio, como hoy (ver project_whatsapp_cloud_api_pendiente).
// Guarda en fidelizacion_cola/{YYYY-MM-DD}. Las funciones puras no tocan Firestore (se prueban sin emulador).

const DIA_MS = 86400000;
const ms = (t) => (t && typeof t.toMillis === 'function' ? t.toMillis() : (t instanceof Date ? t.getTime() : Number(t) || 0));
const llave = (v) => String(v || '').replace(/\D/g, '').slice(-10);
const horaBogota = (t) => Number(new Date(t).toLocaleString('en-GB', { timeZone: 'America/Bogota', hour: '2-digit', hourCycle: 'h23' }));
const diaBogota = (t) => new Date(t).toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
const mediana = (a) => { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const moda = (a) => { const c = new Map(); a.forEach((x) => c.set(x, (c.get(x) || 0) + 1)); let mejor = null; c.forEach((n, x) => { if (!mejor || n > mejor.n) mejor = { x, n }; }); return mejor ? mejor.x : null; };
const hash = (txt) => { let h = 0; String(txt).split('').forEach((ch) => { h = (h * 31 + ch.charCodeAt(0)) >>> 0; }); return h; };

// Costos reales de la calculadora (2026-11-20): queso tajado $55.000/82 = $671; carne molida 100 g = $2.100;
// papas Mydibel $7,16/g × ~150 g + bolsa = ~$1.100 (pequeñas) y ~$1.950 (medianas). Se pueden sobrescribir en configuracion/fidelizacion.costosRegalo.
const REGALOS = {
    queso: { tipo: 'queso', texto: 'un queso extra en tu hamburguesa', costo: 671 },
    papas: { tipo: 'papas', texto: 'unas papas pequeñas gratis con tu pedido', costo: 1100 },
    carne: { tipo: 'carne', texto: 'una doble carne gratis en tu hamburguesa', costo: 2100 },
    papas_medianas: { tipo: 'papas_medianas', texto: 'unas papas medianas gratis con tu pedido', costo: 1950 },
    carne_queso: { tipo: 'carne_queso', texto: 'doble carne y doble queso gratis en tu hamburguesa', costo: 2800 }
};
// Escalera: cuanto más lleva sin pedir, más fuerte el regalo (el primero es el predeterminado mientras no hay datos).
const ESCALERA = [
    { hasta: 45, opciones: ['queso', 'papas'] },
    { hasta: 90, opciones: ['carne', 'papas'] },
    { hasta: Infinity, opciones: ['carne_queso', 'papas_medianas', 'carne'] }
];

const CFG_DEF = { reactivarDiarios: 10, topeRegaloPct: 15, controlPct: 10, descansoDias: 45, reactivarDias: 21, exploracionPct: 20, minMuestras: 10, horaMin: 11, horaMax: 21, horaDefecto: 18, maxDias: 150 };
const cfgDe = (raw = {}) => {
    const n = (v, d) => (Number.isFinite(Number(v)) && String(v) !== '' && v != null ? Number(v) : d);
    return {
        reactivarDiarios: Math.min(30, Math.max(1, n(raw.reactivarDiarios, CFG_DEF.reactivarDiarios))),
        topeRegaloPct: Math.min(30, Math.max(3, n(raw.topeRegaloPct, CFG_DEF.topeRegaloPct))),
        controlPct: Math.min(50, Math.max(0, n(raw.controlPct, CFG_DEF.controlPct))),
        descansoDias: Math.min(180, Math.max(7, n(raw.descansoDias, CFG_DEF.descansoDias))),
        reactivarDias: Math.min(120, Math.max(7, n(raw.reactivarDias, CFG_DEF.reactivarDias))),
        exploracionPct: Math.min(50, Math.max(0, n(raw.exploracionPct, CFG_DEF.exploracionPct))),
        minMuestras: CFG_DEF.minMuestras, horaMin: CFG_DEF.horaMin, horaMax: CFG_DEF.horaMax, horaDefecto: CFG_DEF.horaDefecto, maxDias: CFG_DEF.maxDias,
        costosRegalo: raw.costosRegalo && typeof raw.costosRegalo === 'object' ? raw.costosRegalo : {}
    };
};
const regaloConCosto = (tipo, cfg) => { const r = REGALOS[tipo]; const c = Number(cfg.costosRegalo && cfg.costosRegalo[tipo]); return { ...r, costo: Number.isFinite(c) && c > 0 ? c : r.costo }; };

const esAnulado = (o) => !o || o.anulado === true || o.voided === true || /cancel/i.test(String(o.status || o.estado || ''));

// Agrupa los pedidos por cliente (llave = últimos 10 dígitos del teléfono). Sirve el favorito con la misma regla del panel:
// ignora cortesías, extras, bebidas, salsas y ajustes (los combos sí cuentan como plato).
function agruparClientes(pedidos) {
    const por = new Map(); const vistos = new Set();
    (pedidos || []).forEach((o) => {
        if (esAnulado(o)) return;
        if (o.id) { if (vistos.has(o.id)) return; vistos.add(o.id); }
        const k = llave(o.customerPhoneDigits || o.customerPhone);
        const t = ms(o.paidAt) || ms(o.createdAt);
        if (k.length < 10 || !t) return;
        let c = por.get(k);
        if (!c) { c = { k, telefono: '', nombre: '', n: 0, ultimo: 0, fechas: [], tickets: [], horas: [], prod: new Map() }; por.set(k, c); }
        c.n += 1; c.fechas.push(t); c.horas.push(horaBogota(t));
        const tk = Number(o.subtotal != null ? o.subtotal : o.total) || 0;
        if (tk > 0) c.tickets.push(tk);
        if (t >= c.ultimo) { c.ultimo = t; c.telefono = String(o.customerPhoneDigits || o.customerPhone || '').replace(/\D/g, ''); if (o.customerName) c.nombre = String(o.customerName); }
        (o.items || []).forEach((it) => {
            if (!it || it.parentItemKey || it.cortesia) return;
            const nom = String(it.productName || '').trim(); const cat = String(it.categoryName || '');
            const combo = /combo/i.test(`${nom} ${cat}`);
            if (!nom || nom === 'Producto' || (!combo && /bebida|gaseosa|jugo|adicion|extra|salsa|ajuste/i.test(cat))) return;
            const p = c.prod.get(nom) || { veces: 0, combo };
            p.veces += Number(it.quantity) || 1; c.prod.set(nom, p);
        });
    });
    return por;
}

function favoritoDe(c) {
    let mejor = null;
    c.prod.forEach((p, nombre) => { if (!mejor || p.veces > mejor.veces) mejor = { nombre, veces: p.veces, esCombo: p.combo }; });
    return mejor;
}

// Quiénes se excluyen por contactos recientes: dentro del descanso, o con 2+ mensajes seguidos sin que pidiera después de cada uno.
function excluidosPorEnvios(envios, ultimoPorK, ahora, descansoDias) {
    const por = new Map();
    (envios || []).forEach((e) => { if (e.descartado === true) return; const k = llave(e.telefono); if (k) { if (!por.has(k)) por.set(k, []); por.get(k).push(ms(e.creadoAt)); } });
    const fuera = new Set();
    por.forEach((ts, k) => {
        ts.sort((a, b) => b - a);
        if (ahora - ts[0] < descansoDias * DIA_MS) { fuera.add(k); return; }
        const ult = ultimoPorK.get(k) || 0;
        const sinRespuesta = ts.filter((t) => ult < t).length; // mensajes posteriores a su último pedido
        if (sinRespuesta >= 2) fuera.add(k);
    });
    return fuera;
}

function estadisticasRegalos(cupones) {
    const st = {};
    (cupones || []).forEach((c) => {
        if (c.motivo !== 'reactivar' || !c.regalo) return;
        const s = st[c.regalo] || (st[c.regalo] = { envios: 0, canjes: 0 });
        s.envios += 1; if (c.estado === 'canjeado') s.canjes += 1;
    });
    return st;
}

function elegirRegalo(dias, ticket, cfg, stats, rnd) {
    const tramo = ESCALERA.find((t) => dias < t.hasta) || ESCALERA[ESCALERA.length - 1];
    const cap = (cfg.topeRegaloPct / 100) * (ticket || 0);
    const todos = tramo.opciones.map((t) => regaloConCosto(t, cfg));
    let caben = todos.filter((r) => r.costo <= cap);
    if (!caben.length) caben = [regaloConCosto('queso', cfg)]; // ticket muy bajo: el regalo más barato de la escalera
    const probar = rnd() * 100 < cfg.exploracionPct && caben.length > 1;
    const conDatos = caben.filter((r) => ((stats[r.tipo] || {}).envios || 0) >= cfg.minMuestras)
        .sort((a, b) => (stats[b.tipo].canjes / stats[b.tipo].envios) - (stats[a.tipo].canjes / stats[a.tipo].envios));
    if (probar) return { regalo: caben[Math.floor(rnd() * caben.length)], modo: 'explora', cap };
    if (conDatos.length) return { regalo: conDatos[0], modo: 'mejor', cap };
    return { regalo: caben[0], modo: 'base', cap };
}

function mensajeReactivar(nombre, fav, regaloTexto) {
    const pila = String(nombre || '').trim().split(/\s+/)[0];
    const hola = pila && pila !== 'Cliente' ? ` ${pila}` : '';
    const lin = fav ? (fav.veces >= 2 ? `Me acordé de tu favorito, ${fav.nombre}: pocos lo piden tanto como tú.\n` : `Me acordé de tu pedido: ${fav.nombre}.\n`) : '';
    return `Hola${hola} 👋 Soy Johan, de Roal Burger. Hace rato no te veo por aquí y quería saber cómo vas. 🍔\n${lin}Cuando se te antoje, escríbeme y esa vez te regalo ${regaloTexto}. Te la tengo guardada hasta el *{VENCE}*, sin afán 🙌`;
}

/**
 * Arma la cola del día. Entradas: pedidos (activos + archivados recientes), envios (fidelizacion_envios), cupones (cupones_fidelizacion).
 * Devuelve { dia, entradas, control, resumen }.
 */
function construirCola({ pedidos, envios = [], cupones = [], cfg: cfgRaw = {}, ahora = Date.now(), rnd = Math.random }) {
    const cfg = cfgDe(cfgRaw);
    const dia = diaBogota(ahora);
    const clientes = agruparClientes(pedidos);
    const ultimoPorK = new Map(); clientes.forEach((c, k) => ultimoPorK.set(k, c.ultimo));
    const fuera = excluidosPorEnvios(envios, ultimoPorK, ahora, cfg.descansoDias);
    const conCuponActivo = new Set((cupones || []).filter((c) => c.estado === 'activo' && ms(c.venceAt) > ahora).map((c) => llave(c.telefono)));
    const stats = estadisticasRegalos(cupones);
    const horaPico = moda([].concat(...[...clientes.values()].map((c) => c.horas)).filter((h) => h >= cfg.horaMin && h <= cfg.horaMax)) || cfg.horaDefecto;

    const elegibles = [];
    clientes.forEach((c, k) => {
        if (fuera.has(k) || conCuponActivo.has(k)) return;
        const dias = Math.floor((ahora - c.ultimo) / DIA_MS);
        const fechas = [...c.fechas].sort((a, b) => a - b);
        const gaps = fechas.slice(1).map((t, i) => (t - fechas[i]) / DIA_MS).filter((g) => g > 0.5);
        const intervalo = c.n >= 3 ? mediana(gaps) : 0;
        const umbral = intervalo ? Math.min(120, Math.max(14, Math.round(intervalo * 1.5))) : cfg.reactivarDias;
        if (dias < umbral || dias > cfg.maxDias) return;
        const ticket = Math.round(c.tickets.length ? c.tickets.reduce((a, b) => a + b, 0) / c.tickets.length : 0);
        const score = (ticket || 15000) * Math.min(c.n, 8) * Math.min(2, dias / umbral);
        elegibles.push({ c, k, dias, intervalo, umbral, ticket, score });
    });
    elegibles.sort((a, b) => b.score - a.score);

    const esControl = (k) => cfg.controlPct > 0 && hash(`${dia}|${k}`) % 100 < cfg.controlPct;
    const control = elegibles.filter((x) => esControl(x.k));
    const candidatos = elegibles.filter((x) => !esControl(x.k)).slice(0, cfg.reactivarDiarios);

    const entradas = candidatos.map((x) => {
        const fav = favoritoDe(x.c);
        const { regalo, modo, cap } = elegirRegalo(x.dias, x.ticket, cfg, stats, rnd);
        const propias = x.c.n >= 3 ? x.c.horas : [];
        const horaPropia = moda(propias.filter((h) => h >= cfg.horaMin && h <= cfg.horaMax));
        return {
            k: x.k, telefono: x.c.telefono, nombre: x.c.nombre || 'Cliente', dias: x.dias, pedidos: x.c.n, ticket: x.ticket,
            ritmoDias: x.intervalo ? Math.round(x.intervalo) : null,
            favorito: fav ? fav.nombre : '', favoritoVeces: fav ? fav.veces : 0,
            hora: horaPropia != null ? horaPropia : horaPico, horaOrigen: horaPropia != null ? 'cliente' : 'local',
            regalo: regalo.tipo, regaloTexto: regalo.texto, costoRegalo: regalo.costo, topeCosto: Math.round(cap), modo,
            mensaje: mensajeReactivar(x.c.nombre, fav, regalo.texto),
            estado: 'pendiente'
        };
    }).sort((a, b) => a.hora - b.hora);

    return {
        dia, entradas,
        control: control.map((x) => ({ k: x.k, telefono: x.c.telefono, nombre: x.c.nombre || 'Cliente', dias: x.dias, ticket: x.ticket })),
        resumen: { elegibles: elegibles.length, horaPico, topeRegaloPct: cfg.topeRegaloPct, costoTotal: entradas.reduce((s, e) => s + e.costoRegalo, 0) }
    };
}

// ── Firestore ──────────────────────────────────────────────────────────────────────────────────────────────
const COLA = 'fidelizacion_cola';

async function leerDatos(db, ahora, diasAtras = 240) {
    const desde = new Date(ahora - diasAtras * DIA_MS);
    const [arc, act, env, cup, cfg] = await Promise.all([
        db.collection('pedidos_archivados').where('createdAt', '>=', desde).get(),
        db.collection('pedidos').get(),
        db.collection('fidelizacion_envios').where('motivo', '==', 'reactivar').get(),
        db.collection('cupones_fidelizacion').where('motivo', '==', 'reactivar').get(),
        db.collection('configuracion').doc('fidelizacion').get()
    ]);
    return {
        pedidos: [...arc.docs, ...act.docs].map((d) => ({ id: d.id, ...d.data() })),
        envios: env.docs.map((d) => ({ id: d.id, ...d.data() })),
        cupones: cup.docs.map((d) => ({ id: d.id, ...d.data() })),
        cfg: cfg.exists ? cfg.data() || {} : {}
    };
}

// Crea la cola de hoy si no existe (idempotente). { creada, entradas } .
async function generarCola(db, ahora = Date.now(), rnd = Math.random) {
    const dia = diaBogota(ahora);
    const ref = db.collection(COLA).doc(dia);
    if ((await ref.get()).exists) return { creada: false, dia };
    const datos = await leerDatos(db, ahora);
    const cola = construirCola({ ...datos, ahora, rnd });
    await ref.set({ ...cola, creadoAt: ahora });
    return { creada: true, dia, entradas: cola.entradas.length, control: cola.control.length, elegibles: cola.resumen.elegibles };
}

// Push a la hora de cada cliente: una sola vez por entrada. Corre cada 15 min entre las 10 y las 22 (Bogotá).
async function avisarCola(db, ahora = Date.now(), enviar = null) {
    const ref = db.collection(COLA).doc(diaBogota(ahora));
    const snap = await ref.get();
    if (!snap.exists) return { avisados: 0 };
    const doc = snap.data();
    const h = horaBogota(ahora);
    const vencidas = (doc.entradas || []).filter((e) => e.estado === 'pendiente' && !e.avisadoAt && e.hora <= h);
    if (!vencidas.length) return { avisados: 0 };
    const push = enviar || ((o) => require('./pushAdmin').enviarPush(db, o));
    const primero = vencidas[0];
    await push({
        title: vencidas.length === 1 ? '🔁 Es hora de reactivar a un cliente' : `🔁 Es hora de reactivar a ${vencidas.length} clientes`,
        body: vencidas.length === 1 ? `${primero.nombre} · ${primero.dias} días sin pedir${primero.favorito ? ` · le gusta ${primero.favorito}` : ''}. Su mensaje ya está listo.` : `${vencidas.slice(0, 3).map((e) => e.nombre.split(' ')[0]).join(', ')}${vencidas.length > 3 ? '…' : ''}. Entra a Feedback › Reactivar › Cola del día.`,
        tag: 'roal-reactivar-cola', url: '/admin.html', tipo: 'reactivar_cola'
    });
    const marca = new Set(vencidas.map((e) => e.k));
    await ref.update({ entradas: doc.entradas.map((e) => (marca.has(e.k) ? { ...e, avisadoAt: ahora } : e)) });
    return { avisados: vencidas.length };
}

/**
 * Resultados: ¿volvieron más los que recibieron mensaje que el grupo de control? "Volvió" = pedido pagado ≤ 14 días después del día de la cola.
 * También el canje y el retorno por tipo de regalo (lo que alimenta el aprendizaje).
 */
async function resultadosCola(db, dias = 30, ahora = Date.now()) {
    dias = Math.min(90, Math.max(7, Number(dias) || 30));
    const desdeDia = diaBogota(ahora - dias * DIA_MS);
    const snap = await db.collection(COLA).where('dia', '>=', desdeDia).get();
    const docs = snap.docs.map((d) => d.data());
    const datos = await leerDatos(db, ahora, dias + 30);
    const clientes = agruparClientes(datos.pedidos);
    const volvio = (k, desdeMs) => (clientes.get(k) || { fechas: [] }).fechas.some((t) => t > desdeMs && t <= desdeMs + 14 * DIA_MS && t <= ahora);
    const inicioDia = (dia) => new Date(`${dia}T00:00:00-05:00`).getTime();
    let msgs = 0; let msgsVolvio = 0; let ctl = 0; let ctlVolvio = 0; let sinEnviar = 0;
    const porRegalo = {};
    docs.forEach((d) => {
        const t0 = inicioDia(d.dia);
        (d.entradas || []).forEach((e) => {
            if (e.estado !== 'enviado') { sinEnviar += 1; return; }
            msgs += 1; const v = volvio(e.k, t0); if (v) msgsVolvio += 1;
            const r = porRegalo[e.regalo] || (porRegalo[e.regalo] = { enviados: 0, volvieron: 0 }); r.enviados += 1; if (v) r.volvieron += 1;
        });
        (d.control || []).forEach((e) => { ctl += 1; if (volvio(e.k, t0)) ctlVolvio += 1; });
    });
    const pct = (a, b) => (b ? Math.round((a / b) * 1000) / 10 : null);
    const st = estadisticasRegalos(datos.cupones);
    return {
        dias, colas: docs.length, mensajes_enviados: msgs, volvieron_con_mensaje: msgsVolvio, tasa_con_mensaje_pct: pct(msgsVolvio, msgs),
        grupo_control: ctl, volvieron_control: ctlVolvio, tasa_control_pct: pct(ctlVolvio, ctl), entradas_sin_enviar: sinEnviar,
        por_regalo: Object.entries(porRegalo).map(([regalo, v]) => ({ regalo, ...v, tasa_pct: pct(v.volvieron, v.enviados), cupones_canjeados: (st[regalo] || {}).canjes || 0, cupones_emitidos: (st[regalo] || {}).envios || 0 })),
        lectura: ctl < 15 || msgs < 30 ? 'Muestra todavía pequeña (menos de 30 mensajes o 15 de control): no concluyas aún.' : 'Compara tasa_con_mensaje_pct contra tasa_control_pct: la diferencia es lo que el mensaje aporta de verdad.'
    };
}

async function colaDeHoy(db, ahora = Date.now()) {
    const snap = await db.collection(COLA).doc(diaBogota(ahora)).get();
    if (!snap.exists) return { existe: false, nota: 'La cola de hoy se genera a las 6 a. m. (Bogotá). Si aún no existe, no hay clientes elegibles o la función no ha corrido.' };
    const d = snap.data();
    return {
        existe: true, dia: d.dia, resumen: d.resumen,
        entradas: (d.entradas || []).map((e) => ({ nombre: e.nombre, hora: `${e.hora}:00`, dias_sin_pedir: e.dias, favorito: e.favorito, regalo: e.regalo, costo_regalo: e.costoRegalo, estado: e.estado })),
        en_control_sin_mensaje: (d.control || []).length
    };
}

const TOOL = {
    name: 'reactivar_cola',
    description: 'REACTIVAR INTELIGENTE (Feedback › Reactivar › Cola del día): cada día el sistema elige 10 clientes inactivos según su propio ritmo, la hora en que más piden, su producto favorito y un regalo de costo ≤15 % de su ticket, y avisa al celular a esa hora. Con parte "hoy" dice la cola de hoy (a quién, a qué hora, qué regalo, estado); con parte "resultados" compara cuántos volvieron entre los que recibieron mensaje vs el grupo de control (sin mensaje) y por tipo de regalo. Úsala para "¿a quién reactivo hoy?", "¿está funcionando Reactivar?", "¿qué regalo conviene más?". Solo lectura.',
    input_schema: { type: 'object', properties: { parte: { type: 'string', enum: ['hoy', 'resultados'], description: 'hoy (por defecto) o resultados.' }, dias: { type: 'number', description: 'Ventana de resultados (7-90, por defecto 30).' } } }
};

async function reactivarCola(db, args = {}, ahora = Date.now()) {
    return args.parte === 'resultados' ? resultadosCola(db, args.dias, ahora) : colaDeHoy(db, ahora);
}

module.exports = { construirCola, agruparClientes, elegirRegalo, excluidosPorEnvios, estadisticasRegalos, generarCola, avisarCola, resultadosCola, reactivarCola, TOOL, REGALOS, ESCALERA, cfgDe };
