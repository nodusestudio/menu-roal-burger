// FODI · feedback de clientes (encuesta de /encuesta). Solo LECTURA: resume las respuestas de
// encuestas_pedido, las sugerencias escritas, la tasa de respuesta y los feedback pendientes de pedir.
// Mismo criterio que la pestaña Métricas → Feedback del panel (src/js/admin.js).

const ETIQ_Q1 = { brutal: 'Brutal 10/10', muy_buena: 'Muy buena', normalita: 'Normalita', no_convencio: 'No me convenció' };
const ETIQ_Q2 = { instagram: 'Instagram', whatsapp: 'WhatsApp', amigo: 'Amigo', web: 'Web' };
const ETIQ_Q3 = { si: 'Sí instaló la app', no: 'No la instaló', no_sabia: 'No sabía de la app' };
const ETIQ_Q2_GEN = { excelente: 'Excelente', bien: 'Bien', mejorable: 'Se puede mejorar', mal: 'Mal' };
const ETIQ_Q3_GEN = { seguro: 'Seguro que vuelve', tal_vez: 'Tal vez', no: 'Creo que no' };
const { feedbackTipoDePedido, Q1D_FALLO, Q1D_GUSTO, Q2D_PROBLEMA } = require('./feedbackTipo');
const DOS_HORAS_MS = 2 * 3600e3;
const MAX_EDAD_PENDIENTE_MS = { quindio: 24 * 3600e3, general: 7 * 24 * 3600e3 }; // fidelización: hasta 7 días

const BAJO = ['normalita', 'no_convencio'];
const pct = (n, t) => (t ? Math.round((n / t) * 100) : 0);
const enmascarar = (tel) => { const t = String(tel || ''); return t.length > 4 ? `***${t.slice(-4)}` : t; };
const ms = (v) => (v && typeof v.toMillis === 'function' ? v.toMillis() : Number(v) || 0);
const fechaBogota = (t) => new Date(t - 5 * 3600e3).toISOString().slice(0, 16).replace('T', ' ');


function distribucion(filas, clave, etiquetas) {
    return Object.keys(etiquetas).map((k) => {
        const n = filas.filter((f) => f[clave] === k).length;
        return { opcion: etiquetas[k], respuestas: n, porcentaje: pct(n, filas.length) };
    });
}

// Cuántas respuestas marcaron cada motivo (pueden marcar varios), de mayor a menor.
function contarMotivos(filas, clave, etiquetas) {
    return Object.keys(etiquetas).map((k) => {
        const n = filas.filter((f) => Array.isArray(f[clave]) && f[clave].includes(k)).length;
        return { motivo: etiquetas[k], respuestas: n, porcentaje: pct(n, filas.length) };
    }).sort((a, b) => b.respuestas - a.respuestas);
}

async function feedbackClientes(db, args = {}) {
    const parte = ['resumen', 'respuestas', 'sugerencias', 'pendientes', 'cumpleanos', 'fidelizacion'].includes(args.parte) ? args.parte : 'resumen';
    // 'quindio' = pedidos con 2×1; 'general' = fidelización (cualquier otro pedido). El tipo lo da el pedido.
    const tipo = args.tipo === 'general' ? 'general' : 'quindio';
    const E2 = tipo === 'general' ? ETIQ_Q2_GEN : ETIQ_Q2;
    const E3 = tipo === 'general' ? ETIQ_Q3_GEN : ETIQ_Q3;

    if (parte === 'fidelizacion') {
        // Metas de fidelización de una semana (lunes a domingo, hora de Bogotá): mensajes, cupones y respuestas contra las metas.
        const offset = Math.min(0, Math.max(-8, Math.trunc(Number(args.semanas_atras) * -1) || 0));
        const hoyKey = new Date(Date.now() - 5 * 3600e3).toISOString().slice(0, 10);
        const [y, mo, da] = hoyKey.split('-').map(Number);
        const dow = new Date(Date.UTC(y, mo - 1, da)).getUTCDay();
        const desde = Date.UTC(y, mo - 1, da - ((dow + 6) % 7)) + 5 * 3600e3 + offset * 7 * 86400e3;
        const hasta = desde + 7 * 86400e3;
        const TS = require('firebase-admin/firestore').Timestamp;
        const rango = (q, campo) => q.where(campo, '>=', TS.fromMillis(desde)).where(campo, '<', TS.fromMillis(hasta));
        const [envios, cupones, canjes, encuestas, cfgSnap] = await Promise.all([
            rango(db.collection('fidelizacion_envios'), 'creadoAt').get(),
            rango(db.collection('cupones_fidelizacion'), 'creadoAt').get(),
            rango(db.collection('cupones_fidelizacion'), 'canjeadoAt').get(),
            rango(db.collection('encuestas_pedido'), 'createdAt').get(),
            db.collection('configuracion').doc('fidelizacion').get()
        ]);
        const cfg = cfgSnap.exists ? cfgSnap.data() : {};
        const porMotivo = {};
        envios.docs.forEach((d) => { const m = d.data().motivo || 'otro'; porMotivo[m] = (porMotivo[m] || 0) + 1; });
        return {
            semana: `${new Date(desde).toISOString().slice(0, 10)} a ${new Date(hasta - 1).toISOString().slice(0, 10)}`,
            mensajes_registrados: envios.size, mensajes_por_motivo: porMotivo,
            cupones_emitidos: cupones.size, cupones_canjeados: canjes.docs.filter((d) => d.data().estado === 'canjeado').length,
            respuestas_encuestas: encuestas.size,
            metas: { mensajes: Number(cfg.metaMensajes) || 30, clientes_que_vuelven: Number(cfg.metaReactivados) || 8, cupones_canjeados: Number(cfg.metaCanjes) || 6, ventas: Number(cfg.metaVentas) || 500000, margen_pct: Number(cfg.margenPct) || 35 },
            nota: 'Aquí van mensajes, cupones y respuestas. Los clientes que volvieron y las ventas atribuidas se calculan en el panel (Feedback → Metas) porque cruzan todos los pedidos.'
        };
    }

    if (parte === 'cumpleanos') {
        // Próximos cumpleaños (día y mes que dejó el cliente en su perfil o en la encuesta de fidelización).
        const hoyKey = new Date(Date.now() - 5 * 3600e3).toISOString().slice(0, 10);
        const [y, mo, da] = hoyKey.split('-').map(Number);
        const hoy = Date.UTC(y, mo - 1, da);
        const bis = (yy) => (yy % 4 === 0 && yy % 100 !== 0) || yy % 400 === 0;
        const faltan = (mmdd) => {
            const m = Number(mmdd.slice(0, 2)); const d = Number(mmdd.slice(3, 5));
            const en = (yy) => Date.UTC(yy, m - 1, (m === 2 && d === 29 && !bis(yy)) ? 28 : d);
            let t = en(y); if (t < hoy) t = en(y + 1);
            return Math.round((t - hoy) / 86400000);
        };
        const dias = Math.min(366, Math.max(0, Number(args.dias) || 30));
        const snap = await db.collection('clientes').where('fechaCumple', '>', '').get();
        const lista = snap.docs.map((d) => ({ x: d.data() })).filter(({ x }) => /^\d{2}-\d{2}$/.test(String(x.fechaCumple || '')))
            .map(({ x }) => ({ cliente: x.customerName || 'Cliente', telefono: enmascarar(x.customerPhoneDigits), cumple: x.fechaCumple, en_dias: faltan(x.fechaCumple), saludado_este_anio: Number(x.cumpleSaludoAnio) === y }))
            .filter((c) => c.en_dias <= dias).sort((a, b) => a.en_dias - b.en_dias);
        return { clientes_con_cumpleanos: snap.size, en_los_proximos_dias: dias, total: lista.length, cumpleanos: lista.slice(0, 40), nota: 'Fecha en formato MM-DD. El saludo se copia desde Feedback → Cumpleaños.' };
    }

    if (parte === 'pendientes') {
        const ahora = Date.now();
        const snap = await db.collection('pedidos').where('status', 'in', ['enviado', 'entregado']).get();
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((o) => {
            const t = ms(o.enviadoAt) || ms(o.entregadoAt) || ms(o.deliveredAt);
            return t && !o.anulado && !o.feedbackRequestedAt && !o.feedbackAnsweredAt
                && String(o.customerPhoneDigits || '').replace(/\D/g, '').length >= 10
                && ahora - t >= DOS_HORAS_MS && ahora - t <= MAX_EDAD_PENDIENTE_MS[feedbackTipoDePedido(o)];
        }).map((o) => ({ tipo: feedbackTipoDePedido(o) === 'quindio' ? 'Sabe a Quindío (2×1)' : 'Fidelización', pedido: o.code || o.id, cliente: o.customerName || 'Cliente', telefono: enmascarar(o.customerPhoneDigits), despachado: fechaBogota(ms(o.enviadoAt) || ms(o.entregadoAt) || ms(o.deliveredAt)) }));
        return { total: items.length, pendientes: items.slice(0, 40), nota: 'Pedidos entregados hace 2 h o más (máx. 24 h los 2×1 y 7 días los demás) a los que aún no se les pidió el feedback. Los pedidos con 2×1 llevan la encuesta de Sabe a Quindío; los demás, la de fidelización. El botón "Copiar y abrir WhatsApp" está en Recepción de Pedidos. Solo cubre pedidos activos (los archivados al cerrar caja no se listan).' };
    }

    const snap = await db.collection('encuestas_pedido').orderBy('createdAt', 'desc').limit(2000).get();
    const filas = snap.docs.filter((d) => (d.data().tipo || 'quindio') === tipo).map((d) => {
        const x = d.data();
        return { pedido: x.orderCode || d.id, cliente: String(x.customerName || ''), tel: String(x.customerPhone || ''), q1: x.q1, q2: x.q2, q3: x.q3, q1d: Array.isArray(x.q1d) ? x.q1d : [], q2d: Array.isArray(x.q2d) ? x.q2d : [], q4: String(x.q4 || '').trim(), puntos: Number(x.pointsAwarded) || 0, t: ms(x.createdAt) };
    });

    if (parte === 'sugerencias') {
        const sugs = filas.filter((f) => f.q4);
        return { total: sugs.length, sugerencias: sugs.slice(0, 60).map((f) => ({ cliente: f.cliente || 'Cliente', pedido: f.pedido, sabor: ETIQ_Q1[f.q1] || f.q1, sugerencia: f.q4.slice(0, 300), fecha: fechaBogota(f.t) })) };
    }

    if (parte === 'respuestas') {
        return {
            total: filas.length,
            respuestas: filas.slice(0, 40).map((f) => ({ cliente: f.cliente || 'Cliente', telefono: enmascarar(f.tel), pedido: f.pedido, sabor_calidad: ETIQ_Q1[f.q1] || f.q1, [tipo === 'general' ? 'servicio' : 'se_entero_por']: E2[f.q2] || f.q2, ...(tipo === 'general' ? { que_fallo_o_gusto: (f.q1d || []).map((k) => (BAJO.includes(f.q1) ? Q1D_FALLO : Q1D_GUSTO)[k] || k).join(', '), problema_servicio: (f.q2d || []).map((k) => Q2D_PROBLEMA[k] || k).join(', ') } : { app: E3[f.q3] || f.q3 }), sugerencia: f.q4.slice(0, 200), fecha: fechaBogota(f.t) })),
            nota: filas.length > 40 ? 'Se muestran las 40 más recientes.' : undefined
        };
    }

    const [a, b] = await Promise.all(['pedidos', 'pedidos_archivados'].map((c) => db.collection(c).where('feedbackRequestedAt', '>=', new Date('2026-10-01T00:00:00-05:00')).get()));
    const solicitudes = new Set([...a.docs, ...b.docs].filter((d) => feedbackTipoDePedido(d.data()) === tipo).map((d) => d.id)).size;
    const positivas = filas.filter((f) => f.q1 === 'brutal' || f.q1 === 'muy_buena').length;
    const porCanal = Object.keys(E2).map((k) => {
        const g = filas.filter((f) => f.q2 === k);
        return { [tipo === 'general' ? 'servicio' : 'canal']: E2[k], respuestas: g.length, satisfechos_pct: pct(g.filter((f) => f.q1 === 'brutal' || f.q1 === 'muy_buena').length, g.length) };
    });
    return {
        respuestas: filas.length, solicitudes_enviadas: solicitudes, tasa_respuesta_pct: pct(filas.length, solicitudes),
        satisfaccion_pct: pct(positivas, filas.length), sugerencias_escritas: filas.filter((f) => f.q4).length,
        tipo: tipo === 'general' ? 'Fidelización (pedidos sin 2×1)' : 'Sabe a Quindío (pedidos con 2×1)',
        sabor_calidad: distribucion(filas, 'q1', ETIQ_Q1),
        ...(tipo === 'general'
            ? { servicio_entrega: distribucion(filas, 'q2', E2), motivos_que_fallaron: contarMotivos(filas.filter((f) => BAJO.includes(f.q1)), 'q1d', Q1D_FALLO), motivos_que_gustaron: contarMotivos(filas.filter((f) => !BAJO.includes(f.q1)), 'q1d', Q1D_GUSTO), problemas_de_servicio: contarMotivos(filas.filter((f) => f.q2 === 'mejorable' || f.q2 === 'mal'), 'q2d', Q2D_PROBLEMA), cumpleanos_recogidos: snap.docs.filter((d) => (d.data().tipo || 'quindio') === 'general' && d.data().cumple).length }
            : { como_se_enteraron: distribucion(filas, 'q2', E2), app_instalada: distribucion(filas, 'q3', E3) }),
        satisfaccion_por_grupo: porCanal,
        nota: 'Satisfacción = Brutal 10/10 + Muy buena. Con pocas respuestas los porcentajes no son concluyentes: dilo.'
    };
}

const TOOL = {
    name: 'feedback_clientes',
    description: 'FEEDBACK de clientes (encuesta que se manda por WhatsApp 2 h después de entregar): parte "resumen" = respuestas, tasa de respuesta, satisfacción, sabor/calidad, cómo se enteraron, app instalada y satisfacción por canal; "respuestas" = las últimas respuestas cliente por cliente; "sugerencias" = lo que escribieron en la pregunta abierta; "pendientes" = pedidos entregados a los que aún no se les pidió feedback. Úsala para "¿qué opinan los clientes?", "¿qué piden?", "¿quién falta por encuestar?" y para armar el informe de mejoras del festival (cruza con ventas y da acciones concretas).',
    input_schema: { type: 'object', properties: { parte: { type: 'string', enum: ['resumen', 'respuestas', 'sugerencias', 'pendientes', 'cumpleanos', 'fidelizacion'] }, semanas_atras: { type: 'number', description: 'Solo para fidelizacion: 0 = esta semana, 1 = la pasada, etc.' }, dias: { type: 'number', description: 'Solo para cumpleanos: cuántos días hacia adelante (por defecto 30).' }, tipo: { type: 'string', enum: ['quindio', 'general'], description: 'quindio = encuesta de pedidos con 2×1 (Sabe a Quindío); general = fidelización (pedidos sin 2×1). Por defecto quindio.' } } }
};

module.exports = { feedbackClientes, TOOL };
