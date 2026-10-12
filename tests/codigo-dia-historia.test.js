// Test de las historias de Instagram del Código del día (src/js/admin.js, bloque
// <historia-codigo-dia>): se extrae el bloque autocontenido y se corre en Chromium (Playwright)
// para verificar que el PNG sale en 1080x1920, que la composición (réplica de la referencia
// docs/referencias/codigo-del-dia-ref.png) queda dentro de la franja y=230..1650 en el MISMO orden de la referencia,
// que el hueco del sticker de enlace (y=1650..1800) y el resto de las zonas libres no tienen
// contenido (solo el fondo con luces tenues), también con nombres/palabras largos, sin foto y en
// la versión de agotado.
//
// No necesita el emulador (corre igual dentro de `firebase emulators:exec`).

const path = require('node:path');
const fs = require('node:fs');
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const SRC = fs.readFileSync(path.join(__dirname, '..', 'src', 'js', 'admin.js'), 'utf8');
const BLOQUE = SRC.slice(SRC.indexOf('// <historia-codigo-dia>'), SRC.indexOf('// </historia-codigo-dia>'));

let browser;
let page;

before(async () => {
    assert.ok(BLOQUE.length > 1000, 'no se encontró el bloque <historia-codigo-dia> en admin.js');
    browser = await chromium.launch();
    page = await browser.newPage();
    await page.setContent('<!doctype html><html><body></body></html>');
    await page.addScriptTag({ content: `${BLOQUE}\nwindow.generarHistoriaCodigoDia = generarHistoriaCodigoDia; window.HISTORIA_CD = HISTORIA_CD;` });
});

after(async () => {
    if (browser) await browser.close();
});

// Genera la historia en la página y devuelve tamaño, cajas, zonas y el brillo máximo de cada zona.
async function generar(datos, conFoto = true) {
    return page.evaluate(async ({ datos, conFoto }) => {
        let fotoUrl = '';
        if (conFoto) {
            const c = document.createElement('canvas');
            c.width = 600; c.height = 600;
            const g = c.getContext('2d');
            g.fillStyle = '#d98b2b'; g.fillRect(0, 0, 600, 600);
            g.fillStyle = '#fff'; g.fillRect(150, 150, 300, 300); // zona muy clara: si se cuela a una franja libre, se nota
            fotoUrl = c.toDataURL('image/png');
        }
        const r = await window.generarHistoriaCodigoDia({ ...datos, fotoUrl });
        const ctx = r.canvas.getContext('2d');
        const brilloMax = (z) => {
            const d = ctx.getImageData(z.x, z.y, z.w, z.h).data;
            let max = 0;
            for (let i = 0; i < d.length; i += 4) {
                const l = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
                if (l > max) max = l;
            }
            return Math.round(max);
        };
        const png = r.canvas.toDataURL('image/png');
        return {
            w: r.canvas.width,
            h: r.canvas.height,
            cajas: r.cajas,
            zonas: r.zonas,
            brillo: { arriba: brilloMax(r.zonas.arriba), abajo: brilloMax(r.zonas.abajo), sticker: brilloMax(r.zonas.sticker) },
            pngInicio: png.slice(0, 22)
        };
    }, { datos, conFoto });
}

const BASE = {
    fechaTexto: 'LUNES 12 DE OCTUBRE',
    productoNombre: 'Burger Ranchera',
    precioNormal: 30000,
    precioDescuento: 21000,
    porcentaje: 30,
    palabra: 'CHAMO27',
    cupos: 10
};

function seCruzan(a, b) {
    return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

function verificarZonas(r, etiqueta) {
    assert.equal(r.w, 1080, `${etiqueta}: ancho`);
    assert.equal(r.h, 1920, `${etiqueta}: alto`);
    assert.equal(r.pngInicio, 'data:image/png;base64,');
    assert.deepEqual(r.zonas.arriba, { x: 0, y: 0, w: 1080, h: 230 });
    assert.deepEqual(r.zonas.sticker, { x: 240, y: 1650, w: 600, h: 150 });
    assert.deepEqual(r.zonas.abajo, { x: 0, y: 1800, w: 1080, h: 120 });
    for (const c of r.cajas) {
        for (const [nombre, z] of Object.entries(r.zonas)) {
            assert.ok(!seCruzan(c, z), `${etiqueta}: "${c.nombre}" invade la zona ${nombre} (${JSON.stringify(c)})`);
        }
        assert.ok(c.x >= 0 && c.x + c.w <= 1080, `${etiqueta}: "${c.nombre}" se sale del ancho (${JSON.stringify(c)})`);
    }
    // Zonas libres = solo el fondo oscuro con luces desenfocadas tenues. El texto crema (~230) y el
    // naranja de marca (~139 de luminancia) quedan muy por encima de este tope.
    assert.ok(r.brillo.arriba < 110, `${etiqueta}: franja superior con contenido (brillo ${r.brillo.arriba})`);
    assert.ok(r.brillo.abajo < 110, `${etiqueta}: franja inferior con contenido (brillo ${r.brillo.abajo})`);
    assert.ok(r.brillo.sticker < 110, `${etiqueta}: zona del sticker con contenido (brillo ${r.brillo.sticker})`);
    // Toda la composición dentro de la franja 230..1650.
    for (const c of r.cajas) {
        assert.ok(c.y >= 230 && c.y + c.h <= 1650, `${etiqueta}: "${c.nombre}" fuera de la franja 230..1650 (${JSON.stringify(c)})`);
    }
}

test('historia normal: 1080x1920, PNG, con todos los elementos y las zonas de Instagram libres', async () => {
    const r = await generar(BASE);
    verificarZonas(r, 'normal');
    const nombres = r.cajas.map((c) => c.nombre);
    for (const n of ['logo', 'titulo', 'cinta', 'sello', 'nombre', 'precios', 'ticket', 'cupos', 'app']) {
        assert.ok(nombres.includes(n), `falta ${n}`);
    }
    // Mismo orden de arriba a abajo que la referencia.
    const y = (n) => r.cajas.find((c) => c.nombre === n).y;
    const orden = ['logo', 'titulo', 'cinta', 'nombre', 'precios', 'ticket', 'cupos', 'app'];
    for (let i = 1; i < orden.length; i++) {
        assert.ok(y(orden[i]) > y(orden[i - 1]), `${orden[i]} debe ir debajo de ${orden[i - 1]}`);
    }
    // El sello va a la derecha, entre la cinta y el nombre (sobre la foto).
    const sello = r.cajas.find((c) => c.nombre === 'sello');
    assert.ok(sello.x + sello.w / 2 > 540, 'sello a la derecha');
    assert.ok(sello.y > y('cinta') && sello.y < y('nombre'), 'sello a la altura de la foto');
    // El ticket con la palabra es el elemento más grande de la pieza.
    const area = (c) => c.w * c.h;
    const ticket = r.cajas.find((c) => c.nombre === 'ticket');
    assert.ok(r.cajas.every((c) => c === ticket || area(c) < area(ticket)), 'el ticket debe ser el elemento más grande');
    // "Pídelo en la app" es lo último y va por encima del hueco del sticker.
    const app = r.cajas.find((c) => c.nombre === 'app');
    assert.ok(app.y + app.h <= r.zonas.sticker.y);
});

test('historia de agotado: sin código ni precios, con sello "AGOTADO POR HOY" estilo ticket y las zonas libres', async () => {
    const r = await generar({ ...BASE, agotado: true });
    verificarZonas(r, 'agotado');
    const nombres = r.cajas.map((c) => c.nombre);
    assert.ok(nombres.includes('sello-agotado'));
    assert.ok(nombres.includes('texto-agotado'));
    assert.ok(!nombres.includes('ticket'), 'la de agotado no lleva el código');
    assert.ok(!nombres.includes('precios'));
    assert.ok(!nombres.includes('cupos'), 'la de agotado no lleva la píldora de cupos');
    assert.ok(!nombres.includes('sello'), 'la de agotado no lleva el -30%');
});

test('nombres y palabras muy largos se achican y caben sin cortarse; sin foto usa el fondo de marca', async () => {
    const r = await generar({
        ...BASE,
        productoNombre: 'Salchipapa Súper Gigante Familiar con Todo Incluido Extra',
        palabra: 'CHALEQUEAR99',
        fechaTexto: 'MIÉRCOLES 30 DE SEPTIEMBRE',
        cupos: 25
    }, false);
    verificarZonas(r, 'largo');
});
