// Manifiesto de la app del mesero: lleva el token en start_url para que la app instalada abra SU enlace.   node --test tests/mesero-manifest.test.js
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const handler = require('../api/mesero-manifest');

const llamar = (t) => {
    const r = { headers: {}, code: 0, body: '' };
    const res = { setHeader: (k, v) => { r.headers[k] = v; }, status: (c) => { r.code = c; return res; }, send: (b) => { r.body = b; } };
    handler({ query: t === undefined ? {} : { t } }, res);
    return r;
};

test('con un token válido el manifiesto arranca en el enlace del mesero y es una app propia', () => {
    const tok = '3f2b8c1e-9a4d-4e57-b6a0-1c2d3e4f5a6b';
    const r = llamar(tok);
    assert.equal(r.code, 200);
    assert.match(r.headers['Content-Type'], /manifest\+json/);
    const m = JSON.parse(r.body);
    assert.equal(m.start_url, `/fodexa?mesero=${tok}`);
    assert.equal(m.id, m.start_url);
    assert.equal(m.scope, '/fodexa');
    assert.equal(m.display, 'standalone');
    assert.ok(m.start_url.startsWith(m.scope)); // el inicio queda dentro del alcance de la app
    assert.ok(m.icons[0].src.startsWith('/')); // ruta absoluta: el manifiesto se sirve desde /mesero.webmanifest
});

test('un token raro o vacío se rechaza (no se refleja texto arbitrario en el manifiesto)', () => {
    for (const malo of [undefined, '', 'corto', '"><script>alert(1)</script>', 'a'.repeat(200), 'con espacio 1234567']) {
        const r = llamar(malo);
        assert.equal(r.code, 400, `debió rechazar ${JSON.stringify(malo)}`);
        assert.ok(!/script/.test(r.body));
    }
});

test('vercel.json sirve /mesero.webmanifest con la función y antes de las reglas generales del host del admin', () => {
    const v = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'vercel.json'), 'utf8'));
    const i = v.rewrites.findIndex((x) => x.source === '/mesero.webmanifest');
    assert.ok(i >= 0, 'falta el rewrite');
    assert.equal(v.rewrites[i].destination, '/api/mesero-manifest');
    const general = v.rewrites.findIndex((x) => x.source === '/(.*)');
    assert.ok(general < 0 || i < general, 'el rewrite debe ir antes del comodín del host admin-roal.vercel.app');
});

test('admin.html escribe el enlace al manifiesto desde el principio del head (iPhone no relee lo que cambia un script)', () => {
    const html = fs.readFileSync(path.join(__dirname, '..', 'admin.html'), 'utf8');
    const head = html.slice(0, html.indexOf('</head>'));
    // no hay un <link rel="manifest"> fijo fuera del <noscript>: el único que cuenta lo escribe el script según ?mesero=
    const sinNoscript = head.replace(/<noscript>[\s\S]*?<\/noscript>/g, '');
    assert.ok(!/<link[^>]+rel="manifest"/.test(sinNoscript.replace(/document\.write\([^)]*\)/g, '')), 'no debe quedar un link de manifiesto estático');
    assert.ok(head.includes("/mesero.webmanifest?t="));
    assert.ok(head.includes("document.write('<link rel=\"manifest\""));
    // se ejecuta ANTES de las hojas de estilo y demás: es lo primero que lee el navegador
    assert.ok(head.indexOf('document.write') < head.indexOf('style.css'));
    // ejecutado de verdad, con y sin token
    const bloque = head.match(/<script>\s*\(function \(\) \{[\s\S]*?\}\)\(\);\s*<\/script>/)[0].replace(/^<script>|<\/script>$/g, '');
    const correr = (search) => { let escrito = ''; new Function('window', 'document', bloque)({ location: { search } }, { write: (s) => { escrito = s; } }); return escrito; };
    assert.equal(correr(''), '<link rel="manifest" href="admin.webmanifest">');
    assert.equal(correr('?mesero=3f2b8c1e-9a4d-4e57-b6a0-1c2d3e4f5a6b'), '<link rel="manifest" href="/mesero.webmanifest?t=3f2b8c1e-9a4d-4e57-b6a0-1c2d3e4f5a6b"><meta name="apple-mobile-web-app-title" content="Mesero">');
    assert.ok(head.includes('name="apple-mobile-web-app-capable"'));
    assert.equal(correr('?mesero=x"><script>alert(1)</script>'), '<link rel="manifest" href="admin.webmanifest">'); // token raro: nada se refleja
});

test('admin.js cambia el manifiesto solo en modo mesero y valida el token', () => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'js', 'admin.js'), 'utf8');
    assert.ok(src.includes('/mesero.webmanifest?t='));
    assert.ok(/if \(_meseroLinkToken\) \{[\s\S]{0,900}mesero\.webmanifest/.test(src), 'el cambio de manifiesto debe estar dentro de if (_meseroLinkToken)');
});
