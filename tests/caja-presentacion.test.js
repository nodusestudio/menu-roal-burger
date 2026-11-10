// Una sola directriz de presentación en el panel: ventanas propias (nada nativo), un solo formato de dinero y la
// jerarquía de las tarjetas del Historial. Pruebas de código (rápidas, sin navegador).
//   node --test tests/caja-presentacion.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const js = fs.readFileSync(path.join(__dirname, '../src/js/admin.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '../admin.html'), 'utf8');
const lineas = js.split(/\r?\n/);
const codigo = lineas.filter((l) => !/^\s*\/\//.test(l));

test('el panel no usa ventanas nativas del navegador (alert / confirm / prompt)', () => {
    // (la expresión regular _FODI_SI reconoce la palabra "confirmo" en el chat: no es una ventana)
    const malas = codigo.filter((l) => /(^|[^.\w'])(alert|confirm|prompt)\(/.test(l) && !l.includes('_FODI_SI'));
    assert.deepEqual(malas, [], 'usar showConfirmModal / showPromptModal / showNotice');
});

test('el dinero se escribe con un solo formato (formatMoney → «$ 1.000»), no armado a mano', () => {
    const manuales = codigo.filter((l) => /\$\$\{(Number\([^()]*\)|[A-Za-z_][A-Za-z0-9_.]*)\.toLocaleString\('es-CO'\)\}/.test(l));
    assert.deepEqual(manuales, []);
});

test('Historial: el Total Neto va primero y grande; los métodos en $0 se atenúan', () => {
    assert.match(js, /\$\{chipNet\}\$\{chipIng\}\$\{chipEgr\}\$\{chipMethod\}\$\{chipOtro\}/);
    assert.match(js, /font-size:1\.5rem;font-weight:800;color:\$\{ntColor\}/);
    assert.equal((js.match(/opacity:\$\{v === 0 \? '0\.5' : '1'\}/g) || []).length, 2, 'métodos y Otro atenuados cuando valen $0');
});

test('las acciones críticas de Caja usan un rol de botón, no estilos pegados a mano', () => {
    for (const id of ['gastosBtn', 'cerrarCajaBtn', 'cierreCajaConfirmBtn', 'cierreReprintBtn', 'gastosInformesNewBtn']) {
        const m = html.match(new RegExp(`<button[^>]*id="${id}"[^>]*>`));
        assert.ok(m, `no existe ${id}`);
        assert.match(m[0], /informes-action-btn--(primary|danger-solid)/, `${id} debe usar un rol`);
        assert.ok(!/style="[^"]*(background|border-radius|font-size)/.test(m[0]), `${id} no debe llevar estilos pegados a mano`);
    }
});

test('un nombre por acción: «Registrar gasto» y «Cerrar caja»', () => {
    assert.ok(!/Cerrar Caja/.test(js) || !/🔒 Cerrar Caja/.test(js));
    assert.ok(html.includes('💸 Registrar gasto</button>'));
    assert.ok(html.includes('🔒 Cerrar caja</button>'));
});

test('los menús desplegables conservan los ids de los botones (los manejadores siguen atados)', () => {
    for (const id of ['exportCierresExcelBtn', 'exportCierresPdfBtn', 'trasladoHistorialBtn', 'ajusteSaldosBtn']) {
        assert.ok(html.includes(`id="${id}"`), id);
        assert.ok(js.includes(`'${id}'`), `${id} debe seguir teniendo manejador`);
    }
});

test('el total de un pedido se lee de UNA sola forma en las sumas del panel (getOrderDisplayTotal)', () => {
    // Medido con los 1.298 pedidos reales: las dos formas daban exactamente lo mismo ($63.998.200); ahora no pueden separarse.
    // (única excepción: _posAjustesResumen, copia exacta de functions/fodiAjustes.js; tests/fodi-ajustes.test.js las compara)
    const sueltas = codigo.filter((l) => /Number\(o\.total ?\|\| ?0\)/.test(l) && !l.includes('ventaNeta +='));
    assert.deepEqual(sueltas, [], 'usar getOrderDisplayTotal(o)');
    assert.ok((js.match(/getOrderDisplayTotal\(o\)/g) || []).length >= 5);
});

test('una etiqueta de estado no se disfraza de botón (nada «disabled» con clase de botón de acción)', () => {
    const falsos = [...html.matchAll(/<button[^>]*class="[^"]*(section-save-btn|section-action-btn)[^"]*"[^>]*\bdisabled\b[^>]*>/g)].map((m) => m[0]);
    assert.deepEqual(falsos, [], 'usar <span class="status-chip">');
    assert.ok(html.includes('class="status-chip"'));
});

test('las familias de botones comparten forma y tipografía (un solo bloque de roles)', () => {
    assert.match(html, /\.section-action-btn, \.section-save-btn, \.preview-refresh-btn \{\s*border-radius: 9px;/);
    assert.match(html, /\.section-action-btn\.primary \{ background: linear-gradient\(135deg, #ff7a1a, #ff9540\)/);
    assert.match(html, /\.admin-button \{ font-family: 'Space Grotesk'/);
});

test('ningún botón de guardar es verde (el rol «principal» es naranja) y los campos de texto no quedan en blanco', () => {
    assert.match(html, /button\.cat-new-save-btn \{ background: linear-gradient\(135deg, #ff7a1a, #ff9540\)/);
    assert.match(html, /id="margenMinimoInput" class="admin-input"/);
});
