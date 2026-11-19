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

async function _costosNuevos(leerNuevo, ahora) {
    if (_cache && ahora - _cache.t < TTL_MS) return _cache.mapa;
    const lista = await leerNuevo();
    const mapa = new Map((lista || []).map((p) => [p.id, p]));
    _cache = { t: ahora, mapa };
    return mapa;
}

function limpiarCache() { _cache = null; }

async function _enlace(db, menuId) {
    const snap = await db.collection('costos_enlaces').where('menuId', '==', menuId).get();
    const hit = snap.docs.find((d) => (d.data() || {}).estado === 'enlazado');
    return hit ? hit.id : null;
}

async function obtenerCostoPorMenuId(menuId, { db, leerNuevo, costoViejo, ahora = Date.now() } = {}) {
    let motivoViejo = 'sin_enlace';
    if (menuId && db && typeof leerNuevo === 'function') {
        try {
            const costosId = await _enlace(db, menuId);
            if (costosId) {
                const p = (await _costosNuevos(leerNuevo, ahora)).get(costosId);
                if (p && Number.isFinite(Number(p.costoCalculado)) && p.costoCalculado !== null) {
                    const c = Number(p.costoCalculado);
                    return { fuente: 'nuevo', costo: c, costoReal: c, costosId, nombre: p.nombre || '', precioVenta: p.precioVenta ?? null, costoActualizadoEn: p.costoActualizadoEn || null };
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
