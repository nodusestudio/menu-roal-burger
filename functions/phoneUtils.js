'use strict';

// Extraído de index.js (sin cambios de comportamiento) para que cuponPana.js y
// cuponPanaWhatsapp.js validen el celular EXACTAMENTE igual que el registro de clientes -- un
// require de index.js desde esos módulos sería circular.

// El placeholder del campo de telefono en el registro ("+57 300 000 0000") invita a escribir el
// indicativo de pais, pero clientId siempre fue `phone_${phoneDigits}` sin normalizar eso -- sin
// esto, "+57 300 1234567" y "300 1234567" generaban DOS clientId distintos para el mismo numero
// real (phone_573001234567 vs phone_3001234567), duplicando la cuenta. Se quita el "57" solo
// cuando sobran exactamente esos 2 digitos y lo que queda es un celular valido.
function normalizeColombianPhoneDigits(raw) {
    const digits = String(raw || '').replace(/\D/g, '');
    if (digits.length === 12 && digits.startsWith('57') && digits[2] === '3') {
        return digits.slice(2);
    }
    return digits;
}

// Celular colombiano valido: exactamente 10 digitos y siempre empieza en 3 (300-350 aprox, todos
// los rangos moviles vigentes) -- un fijo (empieza en 1/4/5/6/7/8, con o sin indicativo) o
// cualquier otra cadena de 10 digitos (ej. "0000000000", un numero a medio escribir con ceros a
// la izquierda) pasaba el viejo chequeo generico de "al menos 10 digitos" sin ser un celular real
// capaz de recibir WhatsApp. Se espera que digits ya haya pasado por
// normalizeColombianPhoneDigits (o el normalizePhoneDigits del cliente, que hace lo mismo).
function isValidColombianMobile(digits) {
    return /^3\d{9}$/.test(String(digits || ''));
}

module.exports = { normalizeColombianPhoneDigits, isValidColombianMobile };
