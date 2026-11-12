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

// Segundos nombres frecuentes: sirven para decidir si, en un nombre de 3 palabras, la segunda es otro nombre o el primer apellido.
const SEGUNDOS_NOMBRES = new Set(['carlos', 'andres', 'david', 'eduardo', 'fernando', 'alberto', 'jose', 'antonio', 'felipe', 'camilo', 'alejandro',
    'javier', 'enrique', 'ricardo', 'arturo', 'mauricio', 'esteban', 'ernesto', 'humberto', 'rafael', 'fabian', 'steven', 'stiven', 'yesid', 'albeiro',
    'maria', 'fernanda', 'alejandra', 'camila', 'paola', 'isabel', 'lucia', 'cristina', 'patricia', 'andrea', 'carolina', 'viviana', 'milena', 'juliana',
    'catalina', 'eugenia', 'johana', 'yolanda', 'liliana', 'marcela', 'natalia', 'valentina', 'vanessa', 'jimena', 'daniela', 'sofia', 'luz', 'del', 'rosa']);
const PARTICULAS = new Set(['de', 'del', 'la', 'las', 'los', 'y', 'san', 'santa']);
const ES_EMPRESA = /(^|\s)(sas|s\.a\.s\.?|s\.a\.?|ltda|cia|compania|compañia|empresa|fundacion|asociacion|corporacion|inversiones|comercializadora|restaurante|club|iglesia|cooperativa)(?=\s|$)/i;

/** "Johan Eduardo Rojas Albornoz" → "Johan Rojas": un solo nombre y un solo apellido. Las empresas se dejan completas. */
function nombreCorto(nombre) {
    const completo = String(nombre || '').trim().replace(/\s+/g, ' ');
    if (!completo || ES_EMPRESA.test(completo)) return completo;
    // "de la Cruz", "del Carmen"…: la partícula pertenece a la palabra que sigue
    const t = [];
    let pendiente = '';
    for (const w of completo.split(' ')) {
        if (PARTICULAS.has(w.toLowerCase())) { pendiente += (pendiente ? ' ' : '') + w; continue; }
        t.push(pendiente ? `${pendiente} ${w}` : w); pendiente = '';
    }
    if (pendiente) t.push(pendiente);
    if (t.length <= 2) return t.join(' ');
    if (t.length === 3) return SEGUNDOS_NOMBRES.has(t[1].toLowerCase()) ? `${t[0]} ${t[2]}` : `${t[0]} ${t[1]}`;
    return `${t[0]} ${t[2]}`;
}

const { montoEnPalabras } = require('./vozMontos');

// Lo oyen los clientes en caja: agradece, confirma el pago y despide.
function frasePago(nombre, monto) {
    const n = nombreCorto(nombre);
    // El dinero SIEMPRE en palabras y en pesos colombianos (las voces del sistema leen mal «27500»): «veintisiete mil quinientos pesos».
    return `Muchas gracias${n ? ' ' + n : ''} por tu pago de ${montoEnPalabras(monto)}. Ya ha sido confirmado. Que vuelvas pronto.`;
}

module.exports = { REMITENTE_OK, parsearMonto, nombrePropio, leerPagoRecibido, nombreCorto, frasePago };
