// Test de las historias de Instagram del Código del día (src/js/admin.js, bloque
// <historia-codigo-dia>): se extrae el bloque autocontenido y se corre en Chromium (Playwright)
// para verificar que el PNG sale en 1080x1920, que los elementos quedan en las posiciones de las
// referencias v2 (docs/referencias/codigo-del-dia-ref-v2.png y codigo-del-dia-agotado-ref-v2.png,
// con la corrección pedida: nada baja de y=1650), que el rótulo y el código del ticket nunca se
// encima y que las zonas libres (arriba, hueco del sticker y franja inferior) solo tienen fondo.
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
    fechaTexto: 'MARTES 13 DE OCTUBRE',
    productoNombre: 'Burger Ranchera',
    precioNormal: 30000,
    precioDescuento: 21000,
    porcentaje: 30,
    palabra: 'CAIMANERA48',
    cupos: 10
};

function seCruzan(a, b) {
    return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}
const cajaDe = (r, n) => r.cajas.find((c) => c.nombre === n);
// Posición esperada (medida sobre la referencia v2 a 1080x1920) con tolerancia.
function cerca(valor, esperado, tol, etiqueta) {
    assert.ok(Math.abs(valor - esperado) <= tol, `${etiqueta}: ${valor} (esperado ${esperado} ± ${tol})`);
}

function verificarZonas(r, etiqueta) {
    assert.equal(r.w, 1080, `${etiqueta}: ancho`);
    assert.equal(r.h, 1920, `${etiqueta}: alto`);
    assert.equal(r.pngInicio, 'data:image/png;base64,');
    assert.deepEqual(r.zonas.sticker, { x: 240, y: 1650, w: 600, h: 150 });
    assert.deepEqual(r.zonas.abajo, { x: 0, y: 1800, w: 1080, h: 120 });
    for (const c of r.cajas) {
        for (const [nombre, z] of Object.entries(r.zonas)) {
            assert.ok(!seCruzan(c, z), `${etiqueta}: "${c.nombre}" invade la zona ${nombre} (${JSON.stringify(c)})`);
        }
        assert.ok(c.x >= 0 && c.x + c.w <= 1080, `${etiqueta}: "${c.nombre}" se sale del ancho (${JSON.stringify(c)})`);
        assert.ok(c.y + c.h <= 1650, `${etiqueta}: "${c.nombre}" baja de y=1650 (${JSON.stringify(c)})`);
    }
    // Zonas libres = solo el fondo oscuro con luces desenfocadas tenues (el texto crema ~230 y el
    // naranja de marca ~139 de luminancia quedan muy por encima de este tope).
    for (const z of ['arriba', 'abajo', 'sticker']) {
        assert.ok(r.brillo[z] < 110, `${etiqueta}: zona ${z} con contenido (brillo ${r.brillo[z]})`);
    }
}

function verificarTicket(r, etiqueta) {
    const rotulo = cajaDe(r, 'ticket-rotulo');
    const codigo = cajaDe(r, 'ticket-codigo');
    const ticket = cajaDe(r, 'ticket');
    assert.ok(rotulo && codigo && ticket, `${etiqueta}: faltan las cajas del ticket`);
    assert.ok(rotulo.y + rotulo.h + 12 <= codigo.y, `${etiqueta}: el rótulo y el código se tocan (${JSON.stringify(rotulo)} / ${JSON.stringify(codigo)})`);
    assert.ok(codigo.x >= ticket.x && codigo.x + codigo.w <= ticket.x + ticket.w, `${etiqueta}: el código se sale del ticket a lo ancho`);
    assert.ok(codigo.y + codigo.h <= ticket.y + ticket.h, `${etiqueta}: el código se sale del ticket por abajo`);
}

test('historia normal (v2): 1080x1920, elementos en las posiciones de la referencia y zonas libres', async () => {
    const r = await generar(BASE);
    verificarZonas(r, 'normal');
    verificarTicket(r, 'normal');
    const nombres = r.cajas.map((c) => c.nombre);
    for (const n of ['titulo', 'cinta', 'sello', 'nombre', 'precios', 'ticket', 'cupos', 'app']) {
        assert.ok(nombres.includes(n), `falta ${n}`);
    }
    assert.ok(!nombres.includes('logo'), 'la v2 no lleva logo');
    // Arriba, 1:1 con la referencia v2.
    const t = cajaDe(r, 'titulo');
    cerca(t.y, 198, 12, 'titulo.y (con la tilde, como la v2)');
    cerca(t.x, 125, 30, 'titulo.x');
    cerca(t.w, 854, 30, 'titulo.w');
    const c = cajaDe(r, 'cinta');
    cerca(c.x, 225, 10, 'cinta.x');
    cerca(c.y, 368, 10, 'cinta.y');
    cerca(c.w, 658, 10, 'cinta.w');
    // Abajo: referencia v2 subida (corrección pedida: "Pídelo en la app" termina en y=1650).
    const sello = cajaDe(r, 'sello');
    cerca(sello.x + sello.w / 2, 903, 15, 'sello.cx');
    cerca(sello.w / 2, 136, 10, 'sello.r');
    cerca(cajaDe(r, 'nombre').y, 976, 25, 'nombre.y');
    assert.ok(cajaDe(r, 'nombre').w <= 903 + 2);
    const tk = cajaDe(r, 'ticket');
    cerca(tk.x, 118, 5, 'ticket.x');
    cerca(tk.w, 863, 5, 'ticket.w');
    cerca(tk.h, 228, 5, 'ticket.h');
    cerca(cajaDe(r, 'cupos').w, 950, 5, 'cupos.w');
    const app = cajaDe(r, 'app');
    cerca(app.y + app.h, 1650, 2, 'app termina en 1650');
    // Orden de arriba a abajo.
    const orden = ['titulo', 'cinta', 'nombre', 'precios', 'ticket', 'cupos', 'app'];
    for (let i = 1; i < orden.length; i++) {
        assert.ok(cajaDe(r, orden[i]).y > cajaDe(r, orden[i - 1]).y, `${orden[i]} debe ir debajo de ${orden[i - 1]}`);
    }
});

test('historia de agotado (v2): AGOTADO POR HOY inclinado, sin código, precios ni píldora', async () => {
    const r = await generar({ ...BASE, agotado: true });
    verificarZonas(r, 'agotado');
    const nombres = r.cajas.map((c) => c.nombre);
    for (const n of ['titulo', 'cinta', 'sello-agotado', 'texto-agotado', 'texto-agotado-2']) {
        assert.ok(nombres.includes(n), `falta ${n}`);
    }
    for (const n of ['ticket', 'precios', 'cupos', 'sello', 'app']) {
        assert.ok(!nombres.includes(n), `la de agotado no lleva ${n}`);
    }
    cerca(cajaDe(r, 'titulo').y, 198, 12, 'titulo.y (con la tilde, como la v2)');
    const s = cajaDe(r, 'sello-agotado');
    cerca(s.x + s.w / 2, 567, 15, 'sello-agotado.cx');
    cerca(s.y + s.h / 2, 1012, 15, 'sello-agotado.cy');
    cerca(cajaDe(r, 'texto-agotado').y, 1258, 20, 'texto-agotado.y');
});

test('ticket: el rótulo y el código nunca se encima, con palabras de 11 o 12 caracteres', async () => {
    for (const palabra of ['CAIMANERA48', 'CHALEQUEAR99', 'MACUNDALES99', 'GUACHAFITA77', 'PILAS34']) {
        const r = await generar({ ...BASE, palabra });
        verificarTicket(r, palabra);
    }
});

test('nombres muy largos y sin foto: se achican y caben sin cortarse', async () => {
    const r = await generar({
        ...BASE,
        productoNombre: 'Salchipapa Súper Gigante Familiar con Todo Incluido Extra',
        palabra: 'CHALEQUEAR99',
        fechaTexto: 'MIÉRCOLES 30 DE SEPTIEMBRE',
        cupos: 25
    }, false);
    verificarZonas(r, 'largo');
    verificarTicket(r, 'largo');
});

test('JPEG para Instagram: la historia sale como JPEG real, sin píxeles transparentes (se verían negros) y cabe en 900 KB', async () => {
    for (const agotado of [false, true]) {
        const r = await page.evaluate(async (datos) => {
            const g = await window.generarHistoriaCodigoDia(datos);
            const ctx = g.canvas.getContext('2d');
            // Transparencia: un JPEG pinta de negro lo que sea transparente. Se revisa una malla fina.
            let transparentes = 0;
            const d = ctx.getImageData(0, 0, g.canvas.width, g.canvas.height).data;
            for (let i = 3; i < d.length; i += 4 * 37) if (d[i] < 255) transparentes++;
            const blob = await new Promise((res) => g.canvas.toBlob(res, 'image/jpeg', 0.92));
            const cabecera = Array.from(new Uint8Array(await blob.slice(0, 3).arrayBuffer()));
            return { tipo: blob.type, tamano: blob.size, cabecera, transparentes, w: g.canvas.width, h: g.canvas.height };
        }, { ...BASE, agotado });
        assert.equal(r.tipo, 'image/jpeg');
        assert.deepEqual(r.cabecera, [0xFF, 0xD8, 0xFF], 'cabecera JPEG');
        assert.equal(r.transparentes, 0, `agotado=${agotado}: hay píxeles transparentes`);
        assert.equal(`${r.w}x${r.h}`, '1080x1920');
        assert.ok(r.tamano < 900 * 1024, `agotado=${agotado}: pesa ${r.tamano} bytes`);
    }
});
