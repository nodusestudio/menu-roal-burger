// ─────────────────────────────────────────────────────────────────────────
// SALDOS DEL DINERO — sin DOM, sin Firestore. FASE 0 de la reorganización.
//
// Esta función es una COPIA EXACTA, sin correcciones, de la cuenta que hoy hace el panel en
// renderLibroCierres() (Historial de Cajas, "PASO 1") + _cierreDescuadreSinMetodo() +
// _trasladoEnCierreCerrado(). Todavía admin.js NO la usa: primero se prueba aquí que reproduce al
// peso los números que muestra la pantalla (saldos.test.js, contra una foto real del dinero) y
// solo después admin.js pasa a delegar en ella (Fase 1).
//
// Promesa: no cambia ningún total. Si un día difiere de la pantalla, el test lo dice.
// ─────────────────────────────────────────────────────────────────────────

const _tsMs = (v) => (v && typeof v.toMillis === 'function' ? v.toMillis() : Number(v || 0));
const _num = (v) => Number(v || 0);

/** Lo que el Total Neto de un cierre tiene de más (o de menos) frente a la suma de sus saldos por método. */
export function cierreDescuadreSinMetodo(c) {
    const methodSum = Object.values(c.methodTotals || {}).reduce((sum, v) => sum + _num(v), 0);
    const diff = _num(c.grandTotal) - methodSum;
    return Math.abs(diff) > 1 ? diff : 0;
}

/**
 * Un traslado hecho con la caja abierta queda horneado en el methodTotals del cierre de esa jornada;
 * sumarlo otra vez lo contaría dos veces. Se excluye el que cae dentro de [aperturaAt, closedAt] de un cierre.
 * Cierres antiguos sin aperturaAt: se aproxima por día de calendario (hora local, igual que el panel).
 */
export function trasladoEnCierreCerrado(t, cierres) {
    const tms = _tsMs(t.registradoAt);
    if (!tms) return false;
    return cierres.some((c) => {
        const closed = _tsMs(c.closedAt);
        if (!closed) return false;
        const open = _tsMs(c.aperturaAt);
        if (open) return tms >= open && tms <= closed;
        const d1 = new Date(tms), d2 = new Date(closed);
        return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
    });
}

/**
 * Saldos acumulados de toda la historia (sin filtro de fechas), con las reglas actuales del Historial de Cajas.
 * @param {object} p
 * @param {object[]} p.cierres            documentos de cierres_caja
 * @param {object[]} p.gastos             documentos de gastos_caja (cualquier tipo: aquí se separan)
 * @param {string[]} p.methodKeys         ids de los métodos de pago vigentes (Configuración → Tipos de Pago)
 * @returns {{porMetodo:object, otro:number, totalNeto:number, ingresos:number, egresos:number}}
 */
export function calcularSaldosHistorial({ cierres, gastos, methodKeys }) {
    const externos = gastos.filter((g) => g.tipo === 'externo');
    const traslados = gastos.filter((g) => g.tipo === 'traslado');
    const ajustes = gastos.filter((g) => g.tipo === 'ajuste');

    const porMetodo = {};
    methodKeys.forEach((k) => { porMetodo[k] = 0; });
    let otro = 0, totalNeto = 0, egresos = 0, ingresos = 0;
    const enLista = (k) => methodKeys.includes(k);

    cierres.forEach((c) => {
        const nM = c.methodTotals || {};
        methodKeys.forEach((k) => { porMetodo[k] += _num(nM[k]); });
        Object.entries(nM).forEach(([k, v]) => { if (!enLista(k)) otro += _num(v); });
        otro += cierreDescuadreSinMetodo(c);
        ingresos += _num(c.ingresosTotal ?? c.grandTotal ?? 0);
        egresos += _num(c.gastosTotal);
        totalNeto += _num(c.grandTotal);
    });

    externos.forEach((g) => {
        const mk = g.paymentMethod;
        const amt = _num(g.monto);
        if (!(mk && amt)) return; // el panel ignora un gasto sin método o en $0
        if (enLista(mk)) porMetodo[mk] -= amt; else otro -= amt;
        egresos += amt;
        totalNeto -= amt;
    });

    traslados.forEach((t) => {
        if (trasladoEnCierreCerrado(t, cierres)) return;
        const amt = _num(t.monto);
        if (enLista(t.methodFrom)) porMetodo[t.methodFrom] -= amt; else if (t.methodFrom) otro -= amt;
        if (enLista(t.methodTo)) porMetodo[t.methodTo] += amt; else if (t.methodTo) otro += amt;
    });

    ajustes.forEach((a) => {
        Object.entries(a.porMetodo || {}).forEach(([k, v]) => {
            const n = _num(v);
            if (enLista(k)) porMetodo[k] += n; else otro += n;
            totalNeto += n;
        });
    });

    return { porMetodo, otro, totalNeto, ingresos, egresos };
}

/**
 * Total Neto "estilo Libro Contable" (hoy): ingresos − egresos, SIN ajustes de saldo ni descuadres.
 * Se deja aquí solo para medir la diferencia con el Historial; la Fase 4 hace que ambos muestren el mismo
 * saldo y que el Libro Contable agregue una línea visible "Ajustes de saldo".
 */
export function totalNetoLibroContable({ cierres, gastos }) {
    const ing = cierres.reduce((s, c) => s + _num(c.ingresosTotal ?? 0), 0);
    const egr = cierres.reduce((s, c) => s + _num(c.gastosTotal ?? 0), 0);
    const ext = gastos.filter((g) => g.tipo === 'externo').reduce((s, g) => s + _num(g.monto), 0);
    return ing - (egr + ext);
}

// Puente para admin.js (script clásico): lo usa SOLO como verificación en vivo del Historial de Cajas
// (renderLibroCierres compara su cuenta con esta; si difieren, avisa en la consola). No pinta nada.
if (typeof window !== 'undefined') {
    window.CajaSaldos = { calcularSaldosHistorial, totalNetoLibroContable, cierreDescuadreSinMetodo, trasladoEnCierreCerrado };
}
