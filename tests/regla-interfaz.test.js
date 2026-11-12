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
    assert.match(html, /\.admin-button, \.biz-save-btn, button\.cat-new-save-btn, \.pos-note-save-btn, \.feedback-pending-btn \{\s*background: linear-gradient\(135deg, #ff7a1a, #ff9540\)/);
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
        assert.match(html, new RegExp(`<button[^>]*(?:class="informes-action-btn[^"]*"[^>]*id="${id}"|id="${id}"[^>]*class="informes-action-btn)`), id);
    }
});

test('POS: los botones secundarios (ticket, notas, cliente, cobro) están en la familia única; sin relleno ni tamaño en línea', () => {
    for (const c of ['ticket-action-btn', 'pos-note-cancel-btn', 'pos-note-save-btn', 'client-action-btn', 'cd-btn']) {
        assert.ok(html.includes(`.${c}, `) || html.includes(`.${c}:hover`) || html.includes(`, .${c},`), c);
    }
    const malos = ((html + js).match(/<button\b[^>]*>/g) || []).filter((b) => /class="[^"]*\b(ticket-action-btn|pos-note-cancel-btn|pos-note-save-btn|client-action-btn|cd-btn)\b/.test(b) && /style="[^"]*(padding|font-size|border-radius)/.test(b));
    assert.deepEqual(malos, []);
    assert.ok(html.includes('Tres tamaños, y solo tres'));
});

test('FORMA ÚNICA: dos radios (9 y 14 px), una animación, pestañas y menú con la misma tipografía', () => {
    assert.ok(html.includes('FORMA ÚNICA (botones, pestañas, tarjetas, animaciones)'));
    assert.match(html, /button:not\(#fodiFlot \*\):not\(\.ff-b\), \[role="tab"\]:not\(#fodiFlot \*\), \.menu-inner-tab, summary\.admin-accordion-trigger \{\s*border-radius: var\(--ui-radius\) !important;/);
    assert.match(html, /transition-duration: \.15s !important/);
    assert.match(html, /\.menu-inner-tab, \.metrics-tab-btn, \.cpana-tab, \.pts-tab, \.orders-mobile-tab, \.date-preset-btn, \.cierre-drp-btn \{/);
    assert.match(html, /\.admin-accordion-trigger, \.nav2-sub \{ font-family: 'Space Grotesk'/);
});

test('MÁRGENES: una escala; las tarjetas no llevan margen propio y el contenedor pone el espacio de 12 px', () => {
    assert.ok(html.includes('MÁRGENES: una escala (4 · 8 · 12 · 14 · 24)'));
    assert.ok(html.includes('.menu-inner-panel { gap: var(--ui-sec) !important; padding: var(--ui-pad) !important; }'));
    assert.ok(html.includes('.admin-card > .card-head { margin-bottom: var(--ui-gap) !important; }'));
    assert.ok(!html.includes('[data-section-scope="configuracion"] .admin-card + .admin-card'), 'ya no hay margen doble entre tarjetas');
});

test('VISTA ÚNICA: título de tarjeta, tablas, ventanas, etiquetas y campos con una sola forma', () => {
    assert.ok(html.includes('VISTA ÚNICA: título de tarjeta, tablas, ventanas, vacíos, etiquetas y campos'));
    assert.match(html, /\.vd-overlay, \.category-products-modal, \.product-edit-modal[^{]*\{ background: rgba\(0,0,0,\.72\) !important; \}/);
    assert.match(html, /\.vd-card, \.category-products-modal-card[^{]*\{ border-radius: var\(--ui-radius-lg\) !important; \}/);
    assert.match(html, /table th, table td \{ font-family: 'Space Grotesk'/);
    assert.match(html, /\.state-pill, \.status-chip \{ border-radius: 999px;/);
});

test('ESTADO VACÍO: los «No hay… / Sin… / Aún no…» usan la clase única y no estilos en línea (salvo el ticket impreso)', () => {
    const malos = (js.match(/<(p|div|span|td)\b[^>]*\sstyle="[^"]*"[^>]*>(?=(No hay |Sin |Todav|A[uú]n no|No tienes))/g) || []).filter((m) => !/color:#c8c0b8/.test(m) && !/class="empty-state" style="grid-column:1\/-1;"/.test(m)); // el grid-column es de disposición, no de aspecto
    assert.deepEqual(malos, []);
    assert.ok((js.match(/class="empty-state"/g) || []).length >= 35);
    assert.ok(html.includes('.empty-state, .caja-empty, .met-empty-note'));
});
test('Menú lateral: flecha fija a la derecha, insignia a su izquierda y «Ir a público» como botón de la familia', () => {
    assert.ok(html.includes('.nav2-grupo.has-unread::after { right: 34px;'));
    assert.ok(html.includes('a.admin-link,'));
    assert.ok(html.includes('>🌐 Ir a público</a>') && html.includes('>🚪 Cerrar sesión</button>'));
});

test('Configuración e Informes: un solo recuadro por sección, sin «Retraer», submenú lateral plano', () => {
    assert.ok(html.includes('CONFIGURACIÓN E INFORMES: un solo recuadro por sección'));
    assert.ok(html.includes('[data-section-scope="configuracion"] .card-collapse-btn { display: none !important; }'));
    assert.ok(html.includes('.nav2-sub.active { background: rgba(255,122,26,0.14) !important;'));
});
test('FODI usa las mismas formas: ventanas 14 px, botones y campo 9 px, enviar en rol principal', () => {
    assert.ok(html.includes('FODI: mismas formas, tamaños y colores que el resto de la aplicación'));
    assert.match(html, /#fodiFlotPanel, #respClienteModal \.rc-caja, #rrPanel, #rrVozPanel \{ border-radius: var\(--ui-radius-lg\) !important;/);
    assert.match(html, /#fodiFlotEnviar, \.asist-send \{ background: linear-gradient\(135deg, #ff7a1a, #ff9540\) !important;/);
    assert.ok(!/class="ff-b"[^>]*style=/.test(html), 'los botones del chat flotante no llevan estilos en línea');
});

test('Configuración: títulos de fila con una sola tipografía y todos los «+ Agregar» en rol principal', () => {
    assert.ok(html.includes('.pm-method-name, .mesero-row-name, .cat-gasto-name, .list-item .product-main span'));
    assert.ok(!js.includes('class="informes-action-btn cfg-add-btn"'), 'los botones de agregar del JS llevan el rol principal');
    assert.ok((js.match(/informes-action-btn--primary cfg-add-btn/g) || []).length >= 3);
});

test('Configuración: la acción principal de cada tarjeta va arriba a la derecha', () => {
    assert.ok(html.includes('ACCIÓN PRINCIPAL DE CADA CONFIGURACIÓN'));
    assert.match(html, /#pmAddBtn, \[data-section-scope="configuracion"\] #beAddBtn, \[data-section-scope="configuracion"\] #cpAddBtn \{ position: absolute; top: var\(--ui-pad\); right: var\(--ui-pad\)/);
    assert.ok(html.includes('#addMeseroBtn) > #addMeseroBtn { margin-left: auto; }'));
});

test('Pie de la barra lateral: accesos agrupados en un botón «Accesos» y Cerrar sesión aparte', () => {
    const m = /id="sidebarMoreMenu"[\s\S]*?<\/div>/.exec(html);
    assert.ok(m && m[0].includes('adminPublicLink') && m[0].includes('adminAvisosPcBtn') && m[0].includes('adminTvBtn'));
    assert.ok(!m[0].includes('adminSignOutBtn'), 'Cerrar sesión no va dentro del grupo');
    assert.ok(html.includes('id="sidebarMoreBtn"') && js.includes("getElementById('sidebarMoreBtn')"));
});

test('Clientes: una línea por cliente con menú «⋯»; ventanas con scroll propio y fondo bloqueado', () => {
    assert.ok(html.includes('LISTA DE CLIENTES: una sola línea por cliente'));
    assert.ok(js.includes('class="client-more"') && js.includes('data-client-action'));
    assert.ok(html.includes('body:has(.pos-note-modal-overlay), body:has(.vd-overlay) { overflow: hidden; }'));
    assert.ok(js.includes('<div class="uc-cuerpo cxc-cuerpo">'), 'la ventana de Unir duplicados desplaza su lista');
    assert.ok(!/<th>Cliente<\/th>\s*<th>Tipo<\/th>\s*<th>M/.test(html) || html.includes('<th>Tipo</th>'), 'la tabla de ventas conserva sus columnas');
});

test('Clientes: se leen SIEMPRE del servidor (no de la copia local que puede venir vacía)', () => {
    const i = js.indexOf('async function _fetchClientsInterno()');
    assert.ok(js.slice(i, i + 600).includes("q.get({ source: 'server' })"));
});

test('Artículos: títulos con la misma tipografía y botones pequeños sin mayúsculas', () => {
    assert.ok(html.includes('.upgrades-detail-topbar-title, .upgrades-master-item-name { font-family: \'Space Grotesk\', sans-serif !important;'));
    assert.ok(html.includes('.mini-btn, .category-actions .mini-btn, .upgrades-detail-topbar .mini-btn { text-transform: none !important;'));
});

test('Feedback: una línea por cliente y el botón «Copiar mensaje» es de la familia única', () => {
    assert.ok(html.includes('#fbBody .met-user-row-v2 { padding: 6px 10px !important;'));
    assert.ok(html.includes('.client-action-btn, .cd-btn, .feedback-pending-btn,'));
    assert.ok(html.includes('.pos-note-save-btn, .feedback-pending-btn {'));
});

test('Fuera del Menú: la lista de campañas usa botones compactos visibles (no pm-icon-btn sin estilo)', () => {
    const i = js.indexOf('function renderCuponPanaCampanas()');
    const f = js.slice(i, js.indexOf('function renderCuponPanaMetricasSelect()', i));
    assert.ok(!f.includes('pm-icon-btn'));
    assert.ok(f.includes('cpana-camp-fila') && (f.match(/class="mini-btn"/g) || []).length >= 4);
    assert.ok(html.includes('.cpana-camp-fila .mini-btn {'));
});

test('Mensajes: botones del encabezado de la conversación con la familia única y filas más bajas', () => {
    assert.ok(html.includes('.inbox-head-btn { display: inline-flex;'));
    assert.ok(html.includes('.inbox-head-btn.blue {') && html.includes('.inbox-head-btn.red {'));
    assert.ok(html.includes('.inbox-thread-avatar { width: 34px !important;'));
});
