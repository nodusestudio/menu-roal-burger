// Consistencia de clientes y direcciones del panel (src/js/admin.js): celular normalizado como en la web/servidor y rótulos
// ("Sin direccion registrada", "Recoge en el local"…) que nunca deben tratarse como una dirección real.
// Se extraen las funciones del código fuente: no necesita emulador.
//   node --test tests/clientes-direcciones.test.js

const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const assert = require('node:assert/strict');

const SRC = fs.readFileSync(path.join(__dirname, '..', 'src', 'js', 'admin.js'), 'utf8').replace(/\r\n/g, '\n');
const extraer = (nombre) => {
    const m = SRC.match(new RegExp(`function ${nombre}\\([^)]*\\) \\{[\\s\\S]*?\\n\\}`));
    assert.ok(m, `no se encontró ${nombre} en admin.js`);
    return m[0];
};
const { normalizePhoneDigits, esRotuloDireccion, normalizeClientSavedAddresses } = new Function(
    `${extraer('normalizePhoneDigits')}\n${extraer('esRotuloDireccion')}\n${extraer('normalizeClientSavedAddresses')}\n`
    + 'return { normalizePhoneDigits, esRotuloDireccion, normalizeClientSavedAddresses };'
)();

test('celular: con o sin indicativo es el mismo cliente (igual que la web y el servidor)', () => {
    assert.equal(normalizePhoneDigits('+57 300 1234567'), '3001234567');
    assert.equal(normalizePhoneDigits('573001234567'), '3001234567');
    assert.equal(normalizePhoneDigits('300 123 4567'), '3001234567');
    assert.equal(normalizePhoneDigits('(300) 123-4567'), '3001234567');
});

test('celular: no recorta lo que no es un celular con indicativo', () => {
    assert.equal(normalizePhoneDigits('6061234567'), '6061234567');   // fijo
    assert.equal(normalizePhoneDigits('571234567890'), '571234567890'); // 12 dígitos pero no es 57 + celular
    assert.equal(normalizePhoneDigits(''), '');
    assert.equal(normalizePhoneDigits(null), '');
});

test('rótulos que no son direcciones', () => {
    ['Sin direccion registrada', 'Sin dirección registrada', 'Recoge en el local', 'Come en el local', 'No registrado', ' recoge en el local '].forEach((t) => {
        assert.equal(esRotuloDireccion(t), true, t);
    });
    ['Cl 22 # 29-59', 'Barrio Las Américas', 'Local 3 centro comercial', ''].forEach((t) => {
        assert.equal(esRotuloDireccion(t), false, t);
    });
});

test('direcciones guardadas: los rótulos no cuentan y se quitan duplicados', () => {
    assert.deepEqual(normalizeClientSavedAddresses(['Sin direccion registrada', 'Cl 5 # 3-2', 'cl 5 # 3-2'], 'Recoge en el local'), ['Cl 5 # 3-2']);
    assert.deepEqual(normalizeClientSavedAddresses([], 'Sin direccion registrada'), []);
});

test('direcciones guardadas: acepta texto y objetos con coordenadas', () => {
    const r = normalizeClientSavedAddresses([{ address: 'Cl 1 # 2-3', latitude: 4.5, longitude: -75.6, primary: true }, 'Cr 7 # 8-9'], '');
    assert.deepEqual(r, ['Cl 1 # 2-3', 'Cr 7 # 8-9']);
});

test('enlace de WhatsApp: celular guardado sin 57 abre el chat con indicativo', () => {
    const { buildWhatsAppUrl } = new Function(`${extraer('buildWhatsAppUrl')}\nreturn { buildWhatsAppUrl };`)();
    assert.equal(buildWhatsAppUrl('3001234567'), 'https://api.whatsapp.com/send?phone=573001234567');
    assert.equal(buildWhatsAppUrl('573001234567', 'Hola'), 'https://api.whatsapp.com/send?phone=573001234567&text=Hola');
    assert.equal(buildWhatsAppUrl('6061234567'), 'https://api.whatsapp.com/send?phone=6061234567'); // fijo: no se toca
});
