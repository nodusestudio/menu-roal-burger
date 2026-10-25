const test = require('node:test');
const assert = require('node:assert');
const { codigoFuente } = require('../functions/fodiCodigo');

// GitHub simulado: archivos en memoria, registra las escrituras
const mkGh = (archivos) => {
    const log = [];
    const fetchFn = async (url, init = {}) => {
        const m = (init.method || 'GET');
        const ruta = decodeURI(url.replace('https://api.github.com/repos/nodusestudio/menu-roal-burger', ''));
        log.push(`${m} ${ruta}`);
        const ok = (j) => ({ ok: true, json: async () => j, text: async () => (typeof j === 'string' ? j : JSON.stringify(j)) });
        const no = (s) => ({ ok: false, status: s, text: async () => 'x' });
        const c = ruta.match(/^\/contents\/([^?]+)/);
        if (c && m === 'GET') {
            const f = archivos[c[1]];
            if (f == null) return no(404);
            return /raw/.test(init.headers.Accept) ? ok(f) : ok({ sha: 'sha-' + c[1] });
        }
        if (ruta.startsWith('/git/ref/heads/main')) return ok({ object: { sha: 'base' } });
        if (ruta === '/git/refs') return ok({});
        if (c && (m === 'PUT' || m === 'DELETE')) return ok({});
        if (ruta === '/pulls' && m === 'POST') return ok({ html_url: 'https://github.com/x/pull/9', number: 9 });
        return no(500);
    };
    return { fetchFn, log, escrituras: () => log.filter((l) => /^(PUT|DELETE|POST)/.test(l)) };
};
const base = { 'src/a.js': 'const x = 1;\nconst y = 2;\n', 'src/b.html': '<div></div>', 'functions/f.js': 'module.exports = 1;\n' };

test('PR con reemplazo + archivo nuevo + eliminación', async () => {
    const gh = mkGh(base);
    const r = await codigoFuente({ accion: 'proponer_cambio', titulo: 'Agregar ventana de prueba', pruebas: 'Abrir la ventana', archivos: [
        { ruta: 'src/a.js', cambios: [{ buscar: 'const y = 2;', reemplazar: 'const y = 3;' }] },
        { ruta: 'src/nueva.js', crear: true, contenido: 'export const hola = () => 1;\n' },
        { ruta: 'src/b.html', eliminar: true },
        { ruta: 'functions/f.js', cambios: [{ buscar: '= 1', reemplazar: '= 2' }] }
    ] }, 't', gh.fetchFn);
    assert.strictEqual(r.ok, true); assert.strictEqual(r.requiere_deploy_functions, true);
    const w = gh.escrituras();
    assert.ok(w.some((l) => /^PUT \/contents\/src\/nueva\.js/.test(l))); assert.ok(w.some((l) => /^DELETE \/contents\/src\/b\.html/.test(l))); assert.ok(w.some((l) => l === 'POST /pulls'));
});

test('no escribe nada si algo no valida (sintaxis rota, archivo ya existente, texto ausente, duplicado)', async () => {
    for (const archivos of [
        [{ ruta: 'src/a.js', cambios: [{ buscar: 'const y = 2;', reemplazar: 'const y = ;' }] }],
        [{ ruta: 'src/a.js', crear: true, contenido: 'x' }],
        [{ ruta: 'src/a.js', cambios: [{ buscar: 'NO EXISTE', reemplazar: 'z' }] }],
        [{ ruta: 'src/a.js', cambios: [{ buscar: 'const', reemplazar: 'let' }] }],
        [{ ruta: 'src/nueva.js', crear: true, contenido: 'const = ;' }],
        [{ ruta: 'src/a.js', eliminar: true }, { ruta: 'src/a.js', cambios: [{ buscar: 'x', reemplazar: 'y' }] }],
        [{ ruta: '.github/workflows/a.yml', crear: true, contenido: 'a: 1' }],
        [{ ruta: 'src/fantasma.js', cambios: [{ buscar: 'a', reemplazar: 'b' }] }]
    ]) {
        const gh = mkGh(base);
        const r = await codigoFuente({ accion: 'proponer_cambio', titulo: 'Cambio de prueba', archivos }, 't', gh.fetchFn);
        assert.ok(r.error, JSON.stringify(archivos));
        assert.strictEqual(gh.escrituras().length, 0, 'no debe escribir: ' + JSON.stringify(archivos));
    }
});

test('mis_cambios y ver_cambio leen el resultado de los PR de FODI', async () => {
    const fetchFn = async (url) => {
        const ok = (j) => ({ ok: true, json: async () => j, text: async () => JSON.stringify(j) });
        if (/\/pulls\?state=all/.test(url)) return ok([
            { number: 3, title: '[FODI] A', state: 'closed', merged_at: '2026-10-20T00:00:00Z', head: { ref: 'fodi/a-1' }, html_url: 'u3', created_at: '2026-10-19T00:00:00Z' },
            { number: 2, title: 'otro', state: 'open', head: { ref: 'feature/x' } },
            { number: 1, title: '[FODI] B', state: 'closed', merged_at: null, closed_at: '2026-10-18T00:00:00Z', head: { ref: 'fodi/b-1' }, html_url: 'u1', created_at: '2026-10-17T00:00:00Z' }
        ]);
        if (/\/pulls\/1\/files/.test(url)) return ok([{ filename: 'src/a.js', status: 'modified', additions: 2, deletions: 1, patch: '@@ x' }]);
        if (/\/issues\/1\/comments/.test(url)) return ok([{ user: { login: 'nodusestudio', type: 'User' }, body: 'No, el botón va en la tarjeta' }, { user: { login: 'vercel[bot]', type: 'Bot' }, body: 'preview' }]);
        if (/\/pulls\/1\/comments/.test(url)) return ok([]);
        if (/\/pulls\/1$/.test(url)) return ok({ title: '[FODI] B', state: 'closed', merged_at: null, head: { ref: 'fodi/b-1' }, html_url: 'u1' });
        return { ok: false, status: 404, text: async () => '' };
    };
    const l = await codigoFuente({ accion: 'mis_cambios' }, 't', fetchFn);
    assert.strictEqual(l.total, 2); assert.match(l.cambios[0].estado, /UNIDO/); assert.match(l.cambios[1].estado, /CERRADO/);
    const v = await codigoFuente({ accion: 'ver_cambio', numero: 1 }, 't', fetchFn);
    assert.strictEqual(v.comentarios_del_dueno.length, 1); assert.match(v.comentarios_del_dueno[0].texto, /botón va en la tarjeta/); assert.strictEqual(v.archivos[0].ruta, 'src/a.js');
});
