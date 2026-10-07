// Landing /cupon (src/js/cupon.js): aviso del estado real del cupón al abrirlo, botón del pedido
// en un día no válido y el campo de WhatsApp solo cuando el navegador no tiene la llave. Se
// extraen las funciones puras del archivo (es un módulo de navegador con efectos al cargar).
// El render completo (sello, formulario oculto) se verifica con Playwright en el reporte.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const SRC = fs.readFileSync(path.join(__dirname, '..', 'src', 'js', 'cupon.js'), 'utf8').replace(/\r\n/g, '\n');

function fn(nombre) {
    const m = new RegExp(`\\nfunction ${nombre}\\([^)]*\\) \\{[\\s\\S]*?\\n\\}\\n`).exec(SRC);
    assert.ok(m, `no se encontró ${nombre}`);
    return m[0];
}
function constante(nombre) {
    const m = new RegExp(`\\nconst ${nombre} = [^\\n]*\\n`).exec(SRC);
    assert.ok(m, `no se encontró ${nombre}`);
    return m[0];
}

const L = new Function(`
    ${['BOGOTA_OFFSET_MS', 'DIAS', 'MESES'].map(constante).join('')}
    ${['esc', 'bogotaParts', 'fechaLarga', 'avisoEstadoHtml', 'textoBotonPedido', 'telefonoFieldHtml'].map(fn).join('\n')}
    return { avisoEstadoHtml, textoBotonPedido, telefonoFieldHtml };
`)();

// Hora de Bogotá (UTC-5) → ms.
const bogota = (key, h = 12) => {
    const [y, m, d] = key.split('-').map(Number);
    return Date.UTC(y, m - 1, d, h + 5);
};

test('canjeado: aviso "Lo usaste el <fecha>" y la próxima clave el domingo', () => {
    const html = L.avisoEstadoHtml({ estadoActual: { estado: 'canjeado', canjeadoAt: bogota('2026-10-12', 20) } });
    assert.match(html, /cp-estado-aviso--usado/);
    assert.match(html, /Lo usaste el lunes 12 de octubre 🍔/);
    assert.match(html, /próxima clave el domingo/);
});

test('vencido: aviso "Este cupón venció el <fecha>"', () => {
    const html = L.avisoEstadoHtml({ estadoActual: { estado: 'vencido', vencioAt: bogota('2026-10-15', 23) } });
    assert.match(html, /Este cupón venció el jueves 15 de octubre/);
});

test('día no válido: aviso arriba con los días y el próximo día; el botón dice para cuándo queda listo', () => {
    const r = { estadoActual: { estado: 'activo', diaValidoHoy: false, diasValidosTexto: 'lunes, martes y jueves', proximoDiaValido: { ms: bogota('2026-10-12', 0), dateKey: '2026-10-12', dow: 1 } } };
    const html = L.avisoEstadoHtml(r);
    assert.match(html, /Se canjea lunes, martes y jueves\./);
    assert.match(html, /dejar tu pedido listo para el próximo día válido: <strong>lunes 12 de octubre<\/strong>/);
    assert.equal(L.textoBotonPedido(r), 'DEJAR LISTO PARA EL LUNES 12');
});

test('activo y día válido (o sin estado conocido): sin aviso y botón normal', () => {
    const r = { estadoActual: { estado: 'activo', diaValidoHoy: true } };
    assert.equal(L.avisoEstadoHtml(r), '');
    assert.equal(L.textoBotonPedido(r), 'ENVIAR PEDIDO POR WHATSAPP');
    assert.equal(L.avisoEstadoHtml({}), '');
});

test('WhatsApp: con llave no se pide; sin llave se pide con el texto de confirmar', () => {
    assert.equal(L.telefonoFieldHtml({ llave: 'abc', telefono: '3001112233' }), '');
    const sin = L.telefonoFieldHtml({ telefono: '3001112233' });
    assert.match(sin, /Confirma el WhatsApp con el que reclamaste el cupón/);
    assert.match(sin, /name="telefono"/);
});
