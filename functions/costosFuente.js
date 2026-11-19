'use strict';
// FUENTE ÚNICA de costos por producto del menú. Costos manda; la calculadora vieja (costos_platos) es el respaldo.
//   obtenerCostoPorMenuId(menuId, { db, leerNuevo, costoViejo })
//     - Si hay un enlace en `costos_enlaces` (estado "enlazado") -> costo de la app Costos ("nuevo"),
//       que se pide con `leerNuevo()` (p. ej. leerCostosRoal / obtenerCostosRoal) y se guarda 5 minutos en memoria.
//     - Si no hay enlace (o el nuevo no está disponible) -> `costoViejo(menuId)` ("viejo").
//     - Siempre devuelve { fuente: 'nuevo' | 'viejo', costo, costoReal, ... } o null si no hay ningún costo.
// Sin dependencias: sirve en functions (Admin SDK) y en el navegador (SDK compat); `db` solo necesita collection().where().get().
const TTL_MS = 5 * 60 * 1000;
let _cache = null; // { t, mapa }

const _norm = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

async function _costosNuevos(leerNuevo, ahora, timeoutMs) {
    if (_cache && ahora - _cache.t < TTL_MS) return _cache.mapa;
    const lectura = leerNuevo();
    // timeoutMs: en flujos críticos (pedidos web) Costos no puede demorar la respuesta; si tarda, cae al costo viejo.
    const lista = timeoutMs ? await Promise.race([lectura, new Promise((_, rej) => setTimeout(() => rej(new Error('costos_timeout')), timeoutMs))]) : await lectura;
    const mapa = new Map((lista || []).map((p) => [p.id, p]));
    _cache = { t: ahora, mapa };
    return mapa;
}

function limpiarCache() { _cache = null; }

// Un producto del menú puede tener VARIOS productos de Costos enlazados (p. ej. los 6 almuerzos -> "Almuerzo Ejecutivo").
async function _enlaces(db, menuId) {
    const snap = await db.collection('costos_enlaces').where('menuId', '==', menuId).get();
    return snap.docs.filter((d) => (d.data() || {}).estado === 'enlazado').map((d) => d.id);
}

// Con varios candidatos: si se sabe cuál (variante = nombre del plato elegido) usa el de ese plato; si no, el MÁS ALTO
// (para no subestimar el costo).
function _elegir(candidatos, variante) {
    if (candidatos.length === 1) return { p: candidatos[0], criterio: 'unico' };
    const v = _norm(variante);
    if (v) {
        const exacto = candidatos.find((p) => _norm(p.nombre) === v) || candidatos.find((p) => { const n = _norm(p.nombre); return n && (n.includes(v) || v.includes(n)); });
        if (exacto) return { p: exacto, criterio: 'plato' };
    }
    return { p: candidatos.reduce((a, b) => (Number(b.costoCalculado) > Number(a.costoCalculado) ? b : a)), criterio: 'mas_alto' };
}

async function obtenerCostoPorMenuId(menuId, { db, leerNuevo, costoViejo, ahora = Date.now(), variante, timeoutMs } = {}) {
    let motivoViejo = 'sin_enlace';
    if (menuId && db && typeof leerNuevo === 'function') {
        try {
            const ids = await _enlaces(db, menuId);
            if (ids.length) {
                const mapa = await _costosNuevos(leerNuevo, ahora, timeoutMs);
                const candidatos = ids.map((id) => mapa.get(id)).filter((p) => p && p.costoCalculado !== null && p.costoCalculado !== undefined && Number.isFinite(Number(p.costoCalculado)));
                if (candidatos.length) {
                    const { p, criterio } = _elegir(candidatos, variante);
                    const c = Number(p.costoCalculado);
                    return { fuente: 'nuevo', costo: c, costoReal: c, costosId: p.id, nombre: p.nombre || '', precioVenta: p.precioVenta ?? null, costoActualizadoEn: p.costoActualizadoEn || null, criterio, candidatos: candidatos.length };
                }
                motivoViejo = 'enlace_sin_costo';
            }
        } catch (err) {
            motivoViejo = 'nuevo_no_disponible';
        }
    } else if (menuId && db) {
        motivoViejo = 'nuevo_no_disponible';
    }
    const v = typeof costoViejo === 'function' ? await costoViejo(menuId) : null;
    if (!v) return null;
    return { ...v, fuente: 'viejo', motivo: motivoViejo };
}

module.exports = { obtenerCostoPorMenuId, limpiarCache, TTL_MS };
