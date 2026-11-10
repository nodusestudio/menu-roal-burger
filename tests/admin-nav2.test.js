// Menú principal nuevo (8 grupos): garantiza que NINGUNA pestaña se pierde y que todo elemento del menú nuevo
// apunta a un botón y a una pestaña interna que existen de verdad en admin.html.
//   node --test tests/admin-nav2.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const raiz = path.join(__dirname, '..');
const js = fs.readFileSync(path.join(raiz, 'src/js/admin.js'), 'utf8');
const html = fs.readFileSync(path.join(raiz, 'admin.html'), 'utf8');

const a = js.indexOf('// SYNC:nav2:inicio');
const b = js.indexOf('// SYNC:nav2:fin');
assert.ok(a > 0 && b > a, 'No se encontró el bloque nav2 en admin.js');
const GRUPOS = new Function(`${js.slice(a, b).split('const NAV2_STORAGE_KEY')[0]}\n return NAV2_GRUPOS;`)();

// Botones del menú de siempre (los viejos, que siguen en la página)
const nav = html.slice(html.indexOf('id="adminAccordionNav"'), html.indexOf('id="adminNotice"'));
const viejos = [...nav.matchAll(/class="admin-accordion-trigger[^"]*"[^>]*data-accordion-target="([a-z]+)"/g)].map((m) => m[1]);
const itemsTodos = GRUPOS.flatMap((g) => g.items.map((it) => ({ g: g.id, ...it })));
const seccionesInformes = [...html.matchAll(/data-section-tab="([a-z_-]+)" data-section-scope="informes"/g)].map((m) => m[1]);

test('hay exactamente 8 grupos', () => {
    assert.equal(GRUPOS.length, 8);
    assert.deepEqual(GRUPOS.map((g) => g.etiqueta), ['POS', 'Caja', 'Informes', 'Catálogo', 'Clientes', 'Comunicación', 'FODI', 'Configuración']);
});

test('ids de grupos y de elementos son únicos', () => {
    assert.equal(new Set(GRUPOS.map((g) => g.id)).size, GRUPOS.length);
    assert.equal(new Set(itemsTodos.map((i) => i.id)).size, itemsTodos.length);
});

test('el menú viejo tiene los 15 botones de siempre + el oculto de la TV', () => {
    assert.equal(viejos.length, 16, `botones viejos: ${viejos.join(', ')}`);
    assert.ok(viejos.includes('tv'));
});

test('todo botón viejo (menos TV, que vive en el pie) está cubierto por el menú nuevo', () => {
    const cubiertos = new Set(itemsTodos.map((i) => i.target));
    const huerfanos = viejos.filter((t) => t !== 'tv' && !cubiertos.has(t));
    assert.deepEqual(huerfanos, [], `pestañas que se perderían: ${huerfanos.join(', ')}`);
});

test('todo elemento del menú nuevo apunta a un botón viejo que existe', () => {
    const inexistentes = itemsTodos.filter((i) => !viejos.includes(i.target)).map((i) => i.id);
    assert.deepEqual(inexistentes, []);
});

test('las 5 pestañas internas de Informes están cubiertas, una sola vez cada una', () => {
    assert.deepEqual([...seccionesInformes].sort(), ['caja-diaria', 'gastos', 'historial', 'libro-contable', 'tickets']);
    const usadas = itemsTodos.filter((i) => i.seccion).map((i) => i.seccion);
    assert.deepEqual([...usadas].sort(), [...seccionesInformes].sort(), 'cada pestaña de Informes debe tener un elemento y solo uno');
    assert.equal(new Set(usadas).size, usadas.length);
});

test('un botón viejo sin pestaña interna no se repite en dos elementos', () => {
    const sinSeccion = itemsTodos.filter((i) => !i.seccion).map((i) => i.target);
    assert.equal(new Set(sinSeccion).size, sinSeccion.length);
});

test('el contenedor, el interruptor y los estilos existen en admin.html', () => {
    assert.ok(html.includes('id="nav2Host"'));
    assert.ok(html.includes('id="adminMenuSwitchBtn"'));
    assert.ok(html.includes('body.menu-nuevo #adminAccordionNav > .admin-accordion-trigger { display: none; }'));
});

test('activateAccordion solo ata los botones viejos (los nuevos no llevan data-accordion-target)', () => {
    assert.ok(js.includes(".admin-accordion-trigger[data-accordion-target]'));"));
    assert.ok(!/class="admin-accordion-trigger nav2-[a-z]+"[^>]*data-accordion-target/.test(js.slice(a, b)));
});
