// Enlaces de WhatsApp en todo el sistema: api.whatsapp.com/send, nunca wa.me. La redirección de
// wa.me convierte los emojis de 4 bytes (👋 🍔 📦 …) en "�" (descubierto en f48942d). admin.js y
// script-v2.js son scripts clásicos sin imports, así que cada uno tiene su buildWhatsAppUrl: este
// test exige que las dos copias sean idénticas y que ningún enlace wa.me vuelva a colarse.
// No necesita emulador.

const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const assert = require('node:assert/strict');

const ROOT = path.join(__dirname, '..');
// Saltos de línea normalizados: en Windows la copia de trabajo puede tener CRLF en unos archivos y LF en otros.
const leer = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8').replace(/\r\n/g, '\n');

function extraerHelper(rel) {
    const m = leer(rel).match(/function buildWhatsAppUrl\(phoneDigits, text = ''\) \{[\s\S]*?\n\}/);
    assert.ok(m, `falta buildWhatsAppUrl en ${rel}`);
    return m[0];
}

test('buildWhatsAppUrl: idéntica en admin.js y script-v2.js', () => {
    assert.equal(extraerHelper('src/js/admin.js'), extraerHelper('src/js/script-v2.js'));
});

test('buildWhatsAppUrl: api.whatsapp.com/send, emojis intactos y sin texto = chat vacío', () => {
    const buildWhatsAppUrl = new Function(`${extraerHelper('src/js/admin.js')} return buildWhatsAppUrl;`)();
    const texto = 'Hola 👋 Recibimos tu pedido *A12*\n📋 2× Burger 🍔 · $31.900';
    const url = buildWhatsAppUrl('+57 314 468-9509', texto);
    assert.match(url, /^https:\/\/api\.whatsapp\.com\/send\?phone=573144689509&text=/);
    assert.equal(new URL(url).searchParams.get('text'), texto);
    assert.equal(buildWhatsAppUrl('573144689509'), 'https://api.whatsapp.com/send?phone=573144689509');
});

test('ningún enlace wa.me en el código del cliente ni en las páginas (solo comentarios y tracking)', () => {
    const archivos = ['src/js/admin.js', 'src/js/script-v2.js', 'src/js/cupon.js', 'src/js/agent-chat.js',
        'index.html', 'admin.html', 'cupon.html', 'eliminar-cuenta.html', 'politica-datos.html', 'functions/cuponPana.js'];
    const hallazgos = [];
    for (const rel of archivos) {
        leer(rel).split('\n').forEach((line, i) => {
            if (/wa\.me/.test(line) && !/^\s*(\/\/|\*|<!--)/.test(line)) hallazgos.push(`${rel}:${i + 1}: ${line.trim().slice(0, 100)}`);
        });
    }
    assert.deepEqual(hallazgos, []);
});

test('tracking.js: un referrer de api.whatsapp.com (o wa.me viejo) cuenta como origen "whatsapp"', () => {
    const src = leer('src/js/tracking.js');
    const m = src.match(/let source = 'directo';[\s\S]*?else if \(ref\) \{ source = 'otro'; \}/);
    assert.ok(m, 'no se encontró la detección de origen en tracking.js');
    const origen = new Function('ref', 'utm', `${m[0]} return source;`);
    assert.equal(origen('https://api.whatsapp.com/', null), 'whatsapp');
    assert.equal(origen('https://web.whatsapp.com/', null), 'whatsapp');
    assert.equal(origen('https://wa.me/573144689509', null), 'whatsapp');
    assert.equal(origen('https://l.instagram.com/', null), 'instagram');
    assert.equal(origen('', null), 'directo');
});
