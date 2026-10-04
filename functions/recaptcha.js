'use strict';

// Verificación server-side de un token reCAPTCHA v3. Extraída de verifyRecaptcha (index.js)
// para que emitirCuponPana use exactamente el mismo criterio (score >= 0.5) en vez de una
// segunda copia que se pueda desincronizar. Lanza HttpsError con los mismos mensajes de siempre.
const { HttpsError } = require('firebase-functions/v2/https');

const RECAPTCHA_MIN_SCORE = 0.5;

async function assertRecaptchaToken(secret, token) {
    if (!token) {
        throw new HttpsError('invalid-argument', 'Token de reCAPTCHA requerido.');
    }
    if (!secret) {
        throw new HttpsError('failed-precondition', 'Servicio de verificacion no configurado.');
    }

    const resp = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method:  'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body:    `secret=${encodeURIComponent(secret)}&response=${encodeURIComponent(token)}`
    });

    if (!resp.ok) {
        throw new HttpsError('internal', 'No se pudo contactar el servicio de verificacion.');
    }

    const data = await resp.json();

    if (!data.success || data.score < RECAPTCHA_MIN_SCORE) {
        throw new HttpsError('failed-precondition', 'Verificacion de seguridad fallida.');
    }
    return data;
}

module.exports = { assertRecaptchaToken, RECAPTCHA_MIN_SCORE };
