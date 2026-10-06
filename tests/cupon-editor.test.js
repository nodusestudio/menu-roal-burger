// Editor de campañas Fuera del Menú (resumen de vigencia y avisos), mensaje de confirmación del POS
// para pedidos de cupón y la tarjeta del cupón sin QR. admin.js y cupon.js son scripts de navegador
// enormes: se extraen solo las funciones puras que se prueban (mismo enfoque que
// pos-burger-clasicas.test.js).

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const leer = (rel) => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8').replace(/\r\n/g, '\n');
const ADMIN = leer('src/js/admin.js');
const CUPON = leer('src/js/cupon.js');

function fn(src, nombre) {
    const m = new RegExp(`\\nfunction ${nombre}\\([^)]*\\) \\{[\\s\\S]*?\\n\\}\\n`).exec(src);
    assert.ok(m, `no se encontró ${nombre}`);
    return m[0];
}

const admin = new Function(`
    ${['_cpanaResumenVigencia', '_cpanaAvisosActivacion', '_cpanaRenglonCliente', '_cpanaDetalleCliente',
        '_cpanaSelecciones', '_cpanaPagoLineaConfirmacion', '_groupOrderItemsForDisplay', 'buildOrderConfirmationMessage'].map((n) => fn(ADMIN, n)).join('\n')}
    function getOrderGreetingName(o) { return o.customerName || ''; }
    function formatMoney(n) { return '$' + Number(n || 0).toLocaleString('es-CO'); }
    function getOrderDisplayTotal(o) { return Number(o.total || 0); }
    function getOrderPaymentLabel(o) { return o.paymentMethod; }
    return { _cpanaResumenVigencia, _cpanaAvisosActivacion, _cpanaDetalleCliente, buildOrderConfirmationMessage };
`)();

// ── Editor: vigencia ────────────────────────────────────────────────────────

test('resumen de vigencia: frase en vivo con días en orden lunes→domingo y cupos', () => {
    const r = admin._cpanaResumenVigencia({ fechaInicio: '2026-10-11', fechaFin: '2026-10-15', diasValidos: [4, 1, 2], cuposTotales: 51 });
    assert.equal(r.error, null);
    assert.equal(r.texto, 'Se puede reclamar del domingo 11 al jueves 15 de octubre · se canjea lunes, martes y jueves · 51 cupos');
    const mesCruzado = admin._cpanaResumenVigencia({ fechaInicio: '2026-09-28', fechaFin: '2026-10-04', diasValidos: [0, 6], cuposTotales: 0 });
    assert.equal(mesCruzado.texto, 'Se puede reclamar del lunes 28 de septiembre al domingo 4 de octubre · se canjea sábado y domingo');
});

test('resumen de vigencia: fecha final antes de la inicial → error', () => {
    const r = admin._cpanaResumenVigencia({ fechaInicio: '2026-10-15', fechaFin: '2026-10-11', diasValidos: [1], cuposTotales: 5 });
    assert.match(r.error, /anterior a la inicial/);
});

test('resumen de vigencia: ningún día válido dentro del rango → error; un día fuera del rango → solo aviso', () => {
    const sinDias = admin._cpanaResumenVigencia({ fechaInicio: '2026-10-09', fechaFin: '2026-10-11', diasValidos: [1, 2, 4], cuposTotales: 5 });
    assert.match(sinDias.error, /Ningún día válido \(lunes, martes y jueves\)/);
    const parcial = admin._cpanaResumenVigencia({ fechaInicio: '2026-10-11', fechaFin: '2026-10-13', diasValidos: [1, 4], cuposTotales: 5 });
    assert.equal(parcial.error, null);
    assert.deepEqual(parcial.diasFuera, [4]);
    assert.match(parcial.texto, /se canjea lunes ·/);
    assert.match(admin._cpanaResumenVigencia({ fechaInicio: '2026-10-11', fechaFin: '2026-10-15', diasValidos: [] }).error, /al menos un día/);
});

// ── Editor: avisos antes de activar ─────────────────────────────────────────

test('avisos (no bloquean): falta foto, falta precio de referencia, renglones sin nombre para el cliente', () => {
    const avisos = admin._cpanaAvisosActivacion({
        imagenUrl: '', precioReferencia: '',
        composicion: [{ nombre: 'Burger Normal', nombreCliente: '' }, { nombre: 'Papas' }, { nombre: 'Postobon', nombreCliente: 'Postobón de 1 litro' }]
    });
    assert.equal(avisos.length, 3);
    assert.match(avisos[0], /foto/);
    assert.match(avisos[1], /En el menú costaría/);
    assert.match(avisos[2], /2 renglones sin "Nombre para el cliente": Burger Normal, Papas/);
    assert.deepEqual(admin._cpanaAvisosActivacion({ imagenUrl: 'https://x/y.webp', precioReferencia: '58000', composicion: [{ nombre: 'A', nombreCliente: 'B' }] }), []);
});

// ── POS: mensaje "Recibimos tu pedido" de un pedido de cupón ───────────────

function pedidoCupon(pago, extra = {}) {
    const meta = {
        composicion: [
            { nombre: 'Burger Normal', cantidad: 2, variante: 'Mediana · 2 carnes', nombreCliente: 'Burger Normal Doble Carne (media libra)' },
            { nombre: 'Papas a la francesa pequeña', cantidad: 1, nombreCliente: 'Papas a la francesa para compartir' },
            { nombre: 'Postobon', cantidad: 1, variante: '1000ml' }
        ],
        selecciones: [{ grupo: 'Extra a elegir', opcion: 'Maduro' }]
    };
    return {
        code: 'P-123', customerName: 'Andrea', orderType: 'retiro', subtotal: 48000, total: 48000, paymentMethod: 'pendiente',
        items: [{
            itemKey: 'pana-ABC', productName: 'La Burda', categoryName: 'CUPONES EXCLUSIVOS', quantity: 1, unitPrice: 48000, subtotal: 48000,
            optionLabel: '2× Burger Normal (Mediana · 2 carnes) (Burger Normal Doble Carne (media libra)) + Papas a la francesa pequeña + Postobon (1000ml) + Extra a elegir: Maduro',
            note: 'igual que optionLabel',
            orderOptions: { cuponPanaCodigo: 'ABC123', cuponPanaDetalleCliente: admin._cpanaDetalleCliente(meta), ...(pago ? { cuponPanaPago: pago } : {}) }
        }],
        ...extra
    };
}

test('confirmación de pedido de cupón con efectivo: no pregunta cómo paga, pide con cuánto', () => {
    const msg = admin.buildOrderConfirmationMessage(pedidoCupon('efectivo'));
    assert.match(msg, /💵 \*Pago:\* Efectivo · ¿Con cuánto pagas para tenerte el cambio listo\?/);
    assert.doesNotMatch(msg, /¿Cómo vas a pagar\?/);
    // Detalle con los nombres para el cliente (no los de cocina) y sin la línea "Nota:".
    assert.match(msg, /↳ 2× Burger Normal Doble Carne \(media libra\) \+ Papas a la francesa para compartir \+ Postobon \(1000ml\) \+ Extra a elegir: Maduro/);
    assert.doesNotMatch(msg, /Nota:/);
});

test('confirmación de pedido de cupón con transferencia: menciona que se envían los datos', () => {
    const msg = admin.buildOrderConfirmationMessage(pedidoCupon('transferencia'));
    assert.match(msg, /💳 \*Pago:\* Transferencia · Te enviamos los datos para transferir\./);
    assert.doesNotMatch(msg, /¿Cómo vas a pagar\?/);
});

test('confirmación: un pedido normal (sin cupón) sigue igual', () => {
    const msg = admin.buildOrderConfirmationMessage({
        code: 'P-9', customerName: 'Luis', orderType: 'retiro', subtotal: 20000, total: 20000, paymentMethod: 'pendiente',
        items: [{ itemKey: 'a', productName: 'Burger', quantity: 1, unitPrice: 20000, subtotal: 20000, optionLabel: 'Sin cebolla', note: 'Bien cocida' }]
    });
    assert.match(msg, /¿Cómo vas a pagar\?/);
    assert.match(msg, /↳ Sin cebolla \| Nota: Bien cocida/);
});

// ── Landing: tarjeta del cupón sin QR, con foto opcional ───────────────────

test('cupon.js: sin QR (ni la librería) y la foto de la tarjeta no deja hueco si no hay', () => {
    assert.doesNotMatch(CUPON, /qrcode|qrSvg|qrMatrix/);
    const pkg = JSON.parse(leer('package.json'));
    assert.equal(pkg.dependencies?.['qrcode-generator'] ?? pkg.devDependencies?.['qrcode-generator'], undefined);
    const fotoTicketHtml = new Function(`${fn(CUPON, 'esc')}${fn(CUPON, 'fotoTicketHtml')} return fotoTicketHtml;`)();
    assert.equal(fotoTicketHtml(''), '');
    assert.match(fotoTicketHtml('https://firebasestorage.googleapis.com/x.webp'), /<img class="cp-ticket-foto" src="https:\/\/firebasestorage\.googleapis\.com\/x\.webp"/);
});
