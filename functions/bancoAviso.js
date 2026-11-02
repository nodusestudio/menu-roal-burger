// Aviso por voz de pagos recibidos en Bancolombia.
// Flujo: Gmail (Apps Script, cada minuto) → función bancoAviso → documento avisos_banco/{id} → la página /banco lo dice en voz alta.
// Aquí vive la parte pura (sin Firebase): leer nombre y monto del correo, para poder probarla sin red.

const REMITENTE_OK = /notificacionesbancolombia\.com/i;

// "$27,500.00" → 27500 · "$27.500" → 27500 · "$1.250.000,50" → 1250000. Si los dos últimos dígitos van tras un
// separador se toman como centavos; cualquier otro separador es de miles.
function parsearMonto(texto) {
    let s = String(texto || '').replace(/[^\d.,]/g, '');
    if (!s) return null;
    s = s.replace(/[.,]\d{2}$/, '');
    s = s.replace(/[.,]/g, '');
    const n = parseInt(s, 10);
    return Number.isFinite(n) && n > 0 ? n : null;
}

function nombrePropio(texto) {
    return String(texto || '').trim().replace(/\s+/g, ' ').toLowerCase()
        .replace(/(^|\s)(\S)/g, (_, a, b) => a + b.toUpperCase());
}

const TIPO = '(?:un\\s+pago|una\\s+transferencia|un\\s+abono|una\\s+consignaci[oó]n)';
const FIN_NOMBRE = '(?=\\s+(?:en|a)\\s+tu\\s|\\s+conectad|\\s+el\\s+\\d|[.,]|$)';

/**
 * Lee un correo de Bancolombia y devuelve { nombre, monto } si es un pago/transferencia RECIBIDO; si no, null.
 * Formato conocido: "Bancolombia: ROAL BURGER, recibiste un pago de ESTEBAN NAIZAQUE SIERRA por $27,500.00 en tu cuenta *0491 …"
 */
function leerPagoRecibido(texto) {
    const t = String(texto || '').replace(/\s+/g, ' ');
    let m = new RegExp(`recibiste\\s+${TIPO}\\s+de\\s+(.+?)\\s+por\\s+\\$\\s*([\\d.,]+)`, 'i').exec(t);
    if (m) {
        const monto = parsearMonto(m[2]);
        return monto ? { nombre: nombrePropio(m[1]), monto } : null;
    }
    m = new RegExp(`recibiste\\s+${TIPO}\\s+por\\s+\\$\\s*([\\d.,]+)\\s+de\\s+(.+?)${FIN_NOMBRE}`, 'i').exec(t);
    if (m) {
        const monto = parsearMonto(m[1]);
        return monto ? { nombre: nombrePropio(m[2]), monto } : null;
    }
    return null;
}

function frasePago(nombre, monto) {
    return `Pago recibido de ${nombre} por ${monto} pesos`;
}

module.exports = { REMITENTE_OK, parsearMonto, nombrePropio, leerPagoRecibido, frasePago };
