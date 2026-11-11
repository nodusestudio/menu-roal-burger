// REGLA ÚNICA DE INTERFAZ del admin: botones, espacios y vistas iguales. Garantías estáticas.
//   node --test tests/regla-interfaz.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '../admin.html'), 'utf8');
const js = fs.readFileSync(path.join(__dirname, '../src/js/admin.js'), 'utf8');
const ini = html.indexOf('data-section-panel="negocio" data-section-scope="configuracion"');
const fin = html.indexOf('<!-- Panel: Impresora', ini);
const config = html.slice(ini - 200, html.indexOf('</article>', html.indexOf('data-section-panel="impresora"')) + 12);
assert.ok(ini > 0 && fin > ini);

test('existe el bloque de la regla con sus variables de espacio y de botón', () => {
    assert.ok(html.includes('REGLA ÚNICA DE INTERFAZ'));
    for (const v of ['--ui-btn-h', '--ui-gap', '--ui-pad', '--ui-sec', '--ui-radius', '--ui-field-h']) assert.ok(html.includes(v + ':'), v);
});
test('Configuración: ningún botón lleva estilos pegados en línea', () => {
    const botones = config.match(/<button\b[^>]*>/g) || [];
    assert.ok(botones.length >= 15);
    assert.deepEqual(botones.filter((b) => /\sstyle=/.test(b)), []);
});
test('Configuración: las descripciones usan .card-desc, no estilos en línea', () => {
    assert.ok(!/<p style=/.test(config));
    assert.ok((config.match(/class="card-desc"/g) || []).length >= 8);
});
test('Configuración: los botones de acción usan el juego de roles (no clases sueltas)', () => {
    for (const id of ['buttonSaveBtn', 'bizSaveBarBtn', 'newCatGastoSaveBtn']) {
        assert.match(config, new RegExp(`<button[^>]*(?:id="${id}"[^>]*class="informes-action-btn informes-action-btn--primary"|class="informes-action-btn informes-action-btn--primary"[^>]*id="${id}")`), id);
    }
    for (const id of ['bizChangePasswordBtn', 'supervisorPinSaveBtn']) assert.match(config, new RegExp(`<button[^>]*class="informes-action-btn informes-action-btn--primary"[^>]*id="${id}"`), id);
});
test('los botones renderizados por JS en Configuración no llevan relleno/ancho/tamaño en línea', () => {
    const malos = (js.match(/<button\b[^>]*class="(?:ghost-button|admin-button)[^"]*"[^>]*>/g) || []).filter((b) => /style="[^"]*(padding|font-size|width:100%|grid-column|margin-top)/.test(b));
    assert.deepEqual(malos, []);
});
test('los botones de guardar son del rol principal (naranja) y no ocupan todo el ancho', () => {
    assert.match(html, /\.admin-button, \.biz-save-btn, button\.cat-new-save-btn \{\s*background: linear-gradient\(135deg, #ff7a1a, #ff9540\)/);
    assert.match(html, /cursor: pointer; white-space: nowrap; width: auto; grid-column: auto;/);
});

test('la compactación de tarjetas y campos aplica a TODO el admin (no solo a Configuración)', () => {
    assert.ok(html.includes('    .admin-card, .menu-inner-panel .admin-card { padding: var(--ui-pad); border-radius: 16px; }'));
    assert.match(html, /\n    \.admin-field input, \.admin-field select \{\s*min-height: var\(--ui-field-h\)/);
    assert.match(html, /\n    \.mini-btn \{ display: inline-flex;[^}]*min-height: 24px/);
});
test('los botones mini y de retraer no llevan tamaño de letra ni relleno en línea (en ningún lado)', () => {
    const todo = html + js;
    const malos = (todo.match(/<button\b[^>]*>/g) || []).filter((b) => /class="[^"]*\b(mini-btn|card-collapse-btn)\b/.test(b) && /style="[^"]*(padding|font-size)/.test(b));
    assert.deepEqual(malos, []);
});
test('los botones de la ventana del ticket de gasto usan los roles, no un fondo pegado a mano', () => {
    assert.match(html, /class="informes-action-btn informes-action-btn--primary" id="gastoTicketPreviewPrintBtn"/);
    assert.match(html, /class="informes-action-btn" id="gastoTicketPreviewCloseBtn2"/);
});

test('Configuración: Negocio y Horario se ven BLOQUEADOS con «Editar» y vuelven al modo guardado al guardar o cancelar', () => {
    assert.match(js, /function initFormBloqueado\(formEl, opts\)/);
    assert.match(js, /const brandingLock = initFormBloqueado\(brandingForm, \{ onCancel: \(\) => renderBrandingForm\(\) \}\);/);
    assert.match(js, /const horarioLock = initFormBloqueado\(horarioFormEl, \{ onCancel: \(\) => renderHorarioForm\(\) \}\);/);
    assert.match(js, /brandingLock\.lock\(\);/);
    assert.match(js, /horarioLock\.lock\(\);/);
    assert.ok(!/id="horarioSaveBtn"[^>]*class=/.test(html) && /id="horarioSaveBtn" hidden/.test(html), 'el botón viejo de guardar horario queda oculto (lo reemplaza «Guardar cambios»)');
    assert.ok(html.includes('.form-bloqueable.is-locked'));
});

test('Seguridad y Menú público: resumen + «Cambiar», y formulario tras «Agregar/Editar»', () => {
    assert.match(js, /function initSecCambiar\(clave\)/);
    assert.match(js, /const _secPass = initSecCambiar\('password'\);/);
    assert.match(js, /_secPass\.cerrar\(\);/);
    assert.match(js, /_secPin\.cerrar\(\);/);
    assert.ok(html.includes('id="buttonFormWrap" hidden') && html.includes('id="buttonAddBtn"'));
    assert.match(js, /_bfw\.hidden = true/);
    assert.match(js, /_bfw2\.hidden = false/);
});

test('los botones de texto del HTML ya no usan familias sueltas (filtros de gastos, cerrar/eliminar de campañas, guardar sueltos)', () => {
    const botones = html.match(/<button\b[^>]*>[^<]{2,30}<\/button>/g) || [];
    const sueltos = botones.filter((b) => /class="[^"]*\b(gi-filter-btn|cat-new-save-btn|pm-icon-btn)\b/.test(b));
    assert.deepEqual(sueltos, []);
    for (const id of ['gastosFilterBtn', 'gastosClearFilterBtn', 'cpanaEditorCloseBtn', 'cpanaDeleteBtn', 'margenMinimoSaveBtn', 'orderFieldEditSaveBtn', 'saveUpgradesConfigBtn']) {
        assert.match(html, new RegExp(`<button[^>]*class="informes-action-btn[^"]*"[^>]*id="${id}"`), id);
    }
});
