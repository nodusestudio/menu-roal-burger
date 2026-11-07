'use strict';

// Unir clientes duplicados (o mover un cliente a un teléfono nuevo): detección y fusión.
// La detección (detectarDuplicados) es pura y la usa FODI; el panel tiene la misma cuenta (admin.js → _clientesDuplicados): SYNC.
// La fusión real (unirClientes) corre con el Admin SDK porque los puntos y las credenciales no son escribibles desde el navegador.

const { normalizeColombianPhoneDigits } = require('./phoneUtils');

const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9ñ ]+/g, ' ').replace(/\s+/g, ' ').trim();
const GENERICOS = /^(cliente|cliente sin nombre|sin nombre|invitado|cliente rapido|mostrador|n a)$/;
const esGenerico = (n) => !norm(n) || GENERICOS.test(norm(n));
const digitosDe = (c) => normalizeColombianPhoneDigits(c.customerPhoneDigits || c.customerPhone || String(c.id || '').replace(/^phone_/, ''));
const num = (v) => Number(v) || 0;
const ms = (t) => (t && typeof t.toMillis === 'function' ? t.toMillis() : Number(t) || 0);

/**
 * Busca clientes que parecen la misma persona. clientes: [{ id, customerName, customerPhone, customerPhoneDigits, totalOrders, totalSpent, puntosDisponibles }].
 * Devuelve grupos { tipo: 'mismo_telefono' | 'mismo_nombre', clientes:[...], sugerido: id del que conviene conservar }.
 *  - mismo_telefono: el mismo celular guardado en dos fichas (p. ej. con y sin el 57): seguro.
 *  - mismo_nombre: mismo nombre completo (2+ palabras) con teléfonos distintos: solo una pista, hay que confirmarla.
 */
function detectarDuplicados(clientes) {
    const grupos = [];
    const usados = new Set();
    const porTel = new Map();
    clientes.forEach((c) => { const d = digitosDe(c); if (d.length >= 7) { if (!porTel.has(d)) porTel.set(d, []); porTel.get(d).push(c); } });
    porTel.forEach((lista) => {
        if (lista.length < 2) return;
        lista.forEach((c) => usados.add(c.id));
        grupos.push({ tipo: 'mismo_telefono', clientes: lista });
    });
    const porNombre = new Map();
    clientes.forEach((c) => {
        if (usados.has(c.id) || esGenerico(c.customerName)) return;
        const n = norm(c.customerName);
        if (n.split(' ').length < 2) return;
        if (!porNombre.has(n)) porNombre.set(n, []);
        porNombre.get(n).push(c);
    });
    porNombre.forEach((lista) => {
        const tels = new Set(lista.map(digitosDe));
        if (lista.length >= 2 && tels.size >= 2) grupos.push({ tipo: 'mismo_nombre', clientes: lista });
    });
    return grupos.map((g) => ({ ...g, sugerido: sugerirConservar(g.clientes) }));
}

// Conserva el de más pedidos; a igualdad, el que ya tiene el id canónico phone_<10 dígitos>; a igualdad, el más antiguo en la lista.
function sugerirConservar(lista) {
    const canon = (c) => (c.id === `phone_${digitosDe(c)}` ? 1 : 0);
    return [...lista].sort((a, b) => (num(b.totalOrders) - num(a.totalOrders)) || (canon(b) - canon(a)) || (num(b.puntosDisponibles) - num(a.puntosDisponibles)))[0].id;
}

const textoDir = (a) => String(typeof a === 'string' ? a : (a && (a.address || a.value || a.label)) || '').trim();

/**
 * Datos del cliente resultante (para escribir en el que se conserva). keep/otro: documentos de `clientes` (datos crudos).
 * Suma pedidos, gastado y puntos; une direcciones sin repetir; deja el nombre real y las fechas extremas.
 */
function fusionarClientes(keep, otro) {
    const k = keep || {}, o = otro || {};
    const dirs = [];
    const vistas = new Set();
    [...(Array.isArray(k.savedAddresses) ? k.savedAddresses : []), k.address, ...(Array.isArray(o.savedAddresses) ? o.savedAddresses : []), o.address].forEach((a) => {
        const t = textoDir(a);
        if (!t || vistas.has(t.toLowerCase())) return;
        vistas.add(t.toLowerCase());
        dirs.push(a);
    });
    const antiguo = [ms(k.firstOrderAt) || ms(k.createdAt), ms(o.firstOrderAt) || ms(o.createdAt)].filter(Boolean);
    const ultimoOtro = ms(o.lastOrderAt) > ms(k.lastOrderAt);
    const ult = ultimoOtro ? o : k;
    const nombre = !esGenerico(k.customerName) ? k.customerName : (!esGenerico(o.customerName) ? o.customerName : (k.customerName || o.customerName || ''));
    const r = {
        customerName: nombre,
        totalOrders: num(k.totalOrders) + num(o.totalOrders),
        totalSpent: num(k.totalSpent) + num(o.totalSpent),
        puntosDisponibles: num(k.puntosDisponibles) + num(o.puntosDisponibles),
        puntosAcumuladosTotal: num(k.puntosAcumuladosTotal) + num(o.puntosAcumuladosTotal),
        savedAddresses: dirs,
        ...(dirs.length ? { address: textoDir(dirs[0]) } : {}),
        ...(k.whatsappUser || o.whatsappUser ? { whatsappUser: k.whatsappUser || o.whatsappUser } : {}),
        ...((k.fechaCumple || o.fechaCumple) ? { fechaCumple: k.fechaCumple || o.fechaCumple } : {}),
        ...(ult.lastOrderCode ? { lastOrderCode: ult.lastOrderCode, lastOrderId: ult.lastOrderId || '', lastOrderTotal: num(ult.lastOrderTotal) } : {}),
        ...(ultimoOtro ? { lastOrderAt: o.lastOrderAt } : {})
    };
    return { datos: r, primerPedidoMs: antiguo.length ? Math.min(...antiguo) : 0 };
}

const FIELD_LIMIT = 400;
async function enLotes(db, refs, hacer) {
    for (let i = 0; i < refs.length; i += FIELD_LIMIT) {
        const batch = db.batch();
        refs.slice(i, i + FIELD_LIMIT).forEach((ref) => hacer(batch, ref));
        await batch.commit();
    }
}

/**
 * Une `otherId` dentro de `keepId` (o, si keepId no existe, mueve la ficha a ese id = cambio de teléfono). Con el Admin SDK.
 * Mueve: pedidos (activos y archivados) y ajustes de puntos (idempotente, se puede repetir) y, en UNA transacción, la ficha
 * (suma contadores y puntos, une direcciones), las credenciales (si keep no tiene) y el borrado de la ficha vieja: así nunca se suma dos veces.
 * Deja una copia en clientes_uniones por si hay que revisar.
 */
async function unirClientes(db, { keepId, otherId, customerPhone = '', adminUid = '' }, FieldValue, Timestamp) {
    if (!/^phone_\d{7,15}$/.test(String(keepId || '')) || !/^(phone_\d{7,15}|client_[a-z0-9_]+)$/.test(String(otherId || ''))) throw new Error('Identificadores de cliente no válidos.');
    if (keepId === otherId) throw new Error('Elige dos clientes distintos.');
    const refK = db.collection('clientes').doc(keepId), refO = db.collection('clientes').doc(otherId);
    const cK = db.collection('clientes_credenciales').doc(keepId), cO = db.collection('clientes_credenciales').doc(otherId);
    const so = await refO.get();
    if (!so.exists) throw new Error('El cliente que se va a unir ya no existe (¿ya se unió?).');
    const o = so.data();
    const digKeep = keepId.slice(6);

    // Copia de seguridad (sin credenciales) de lo que se va a absorber
    await db.collection('clientes_uniones').add({ keepId, otherId, otroCliente: o, por: adminUid, en: FieldValue.serverTimestamp() });

    // Historial: pedidos y ajustes de puntos apuntan a la ficha que se conserva
    const digOtro = digitosDe({ ...o, id: otherId });
    const sk0 = await refK.get();
    const telKeep = (sk0.exists && sk0.data().customerPhone) || String(customerPhone || '').trim() || digKeep;
    let pedidos = 0;
    for (const col of ['pedidos', 'pedidos_archivados']) {
        const docs = new Map();
        for (const d of [digOtro, o.customerPhoneDigits].filter(Boolean)) (await db.collection(col).where('customerPhoneDigits', '==', d).get()).docs.forEach((x) => docs.set(x.id, x));
        if (o.customerPhone) (await db.collection(col).where('customerPhone', '==', o.customerPhone).get()).docs.forEach((x) => docs.set(x.id, x));
        // los que ya apuntan al teléfono que se conserva (mismo celular guardado con y sin el 57) no hace falta tocarlos
        const refs = [...docs.values()].filter((x) => x.data().customerPhoneDigits !== digKeep).map((x) => x.ref);
        await enLotes(db, refs, (b, ref) => b.update(ref, { customerPhoneDigits: digKeep, customerPhone: telKeep }));
        pedidos += refs.length;
    }
    const ajustes = (await db.collection('ajustes_puntos_lealtad').where('clientId', '==', otherId).get()).docs.map((x) => x.ref);
    await enLotes(db, ajustes, (b, ref) => b.update(ref, { clientId: keepId }));

    // Ficha + credenciales + borrado, todo o nada
    const resumen = await db.runTransaction(async (tx) => {
        const [sk, sO, csK, csO] = await Promise.all([tx.get(refK), tx.get(refO), tx.get(cK), tx.get(cO)]);
        if (!sO.exists) throw new Error('El cliente que se va a unir ya no existe (¿ya se unió?).');
        const k = sk.exists ? sk.data() : null, otro = sO.data();
        const { datos, primerPedidoMs } = fusionarClientes(k || {}, otro);
        const base = k ? {} : { ...otro };
        delete base.puntosDisponibles; delete base.puntosAcumuladosTotal;
        const escribir = {
            ...base, ...datos,
            customerPhone: (k && k.customerPhone) || telKeep, customerPhoneDigits: digKeep,
            updatedAt: FieldValue.serverTimestamp(),
            ...(primerPedidoMs ? { firstOrderAt: Timestamp.fromMillis(primerPedidoMs) } : {}),
            ...(k ? {} : { createdAt: otro.createdAt || FieldValue.serverTimestamp() })
        };
        tx.set(refK, escribir, { merge: true });
        if (csO.exists && !csK.exists) tx.set(cK, csO.data());
        if (csO.exists) tx.delete(cO);
        tx.delete(refO);
        return { puntosDisponibles: escribir.puntosDisponibles, totalOrders: escribir.totalOrders, movido: !k, credencialesMovidas: csO.exists && !csK.exists };
    });
    return { ok: true, pedidosMovidos: pedidos, ajustesMovidos: ajustes.length, ...resumen };
}

// ── Para FODI ──────────────────────────────────────────────────────────────────────────────────────
async function leerClientes(db) {
    const docs = [];
    let ultimo = null;
    for (;;) {
        let q = db.collection('clientes').limit(500);
        if (ultimo) q = q.startAfter(ultimo);
        const snap = await q.get();
        docs.push(...snap.docs);
        if (snap.docs.length < 500) break;
        ultimo = snap.docs[snap.docs.length - 1];
    }
    return docs.map((d) => { const x = d.data(); return { id: d.id, customerName: String(x.customerName || ''), customerPhone: String(x.customerPhone || ''), customerPhoneDigits: String(x.customerPhoneDigits || ''), totalOrders: num(x.totalOrders), totalSpent: num(x.totalSpent), puntosDisponibles: num(x.puntosDisponibles) }; });
}

async function clientesDuplicados(db) {
    const grupos = detectarDuplicados(await leerClientes(db));
    const fila = (c) => ({ id: c.id, nombre: c.customerName, telefono: c.customerPhone, pedidos: c.totalOrders, gastado: c.totalSpent, puntos: c.puntosDisponibles });
    return {
        grupos_encontrados: grupos.length,
        mismo_telefono: grupos.filter((g) => g.tipo === 'mismo_telefono').length,
        posibles_mismo_nombre: grupos.filter((g) => g.tipo === 'mismo_nombre').length,
        grupos: grupos.slice(0, 25).map((g) => ({ tipo: g.tipo === 'mismo_telefono' ? 'mismo teléfono (seguro)' : 'mismo nombre, otro teléfono (confirmar con el administrador)', conservar_sugerido: g.sugerido, clientes: g.clientes.map(fila) })),
        nota: 'Para unirlos usa proponer_accion con tipo unir_clientes (conservar = id o teléfono de la ficha que queda; unir = las demás). El administrador confirma con un botón. Unir suma pedidos y puntos y borra las otras fichas (queda copia de seguridad).'
    };
}

// Resuelve un id o un teléfono a un id de ficha: phone_<10 dígitos>, o el id tal cual si ya lo es.
const aId = (v) => { const t = String(v || '').trim(); if (/^(phone_\d{7,15}|client_[a-z0-9_]+)$/.test(t)) return t; const d = normalizeColombianPhoneDigits(t); return d.length >= 7 ? 'phone_' + d : ''; };

async function proponerUnion(db, args = {}) {
    const keepId = aId(args.conservar);
    const otros = [...new Set((Array.isArray(args.unir) ? args.unir : [args.unir]).map(aId).filter(Boolean))].filter((id) => id !== keepId);
    if (!/^phone_/.test(keepId)) return { error: 'conservar debe ser el id (phone_…) o el teléfono de la ficha que se queda.' };
    if (!otros.length) return { error: 'Falta unir: los ids o teléfonos de las fichas que se juntan con la que se queda.' };
    if (otros.length > 5) return { error: 'Máximo 5 fichas a la vez.' };
    const [sk, ...sos] = await Promise.all([db.collection('clientes').doc(keepId).get(), ...otros.map((id) => db.collection('clientes').doc(id).get())]);
    if (!sk.exists) return { error: 'La ficha que se queda (' + keepId + ') no existe.' };
    const faltan = otros.filter((id, i) => !sos[i].exists);
    if (faltan.length) return { error: 'No existe la ficha: ' + faltan.join(', ') + '.' };
    const fila = (id, d) => id + ' · ' + (d.customerName || 'sin nombre') + ' · ' + (d.customerPhone || '') + ' · ' + num(d.totalOrders) + ' pedidos · ' + num(d.puntosDisponibles) + ' pts';
    const todos = [sk.data(), ...sos.map((s) => s.data())];
    return {
        ok: true,
        accion: {
            tipo: 'unir_clientes', keepId, otherIds: otros,
            resumen: ['Se queda: ' + fila(keepId, sk.data()), ...otros.map((id, i) => 'Se une y se borra: ' + fila(id, sos[i].data()))],
            totalPedidos: todos.reduce((a, d) => a + num(d.totalOrders), 0), totalPuntos: todos.reduce((a, d) => a + num(d.puntosDisponibles), 0)
        }
    };
}

module.exports = { clientesDuplicados, proponerUnion, detectarDuplicados, sugerirConservar, fusionarClientes, unirClientes, esGenerico, digitosDe };
