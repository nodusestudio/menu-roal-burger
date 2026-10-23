// FODI · lectura y propuesta de cambios al CÓDIGO, a través de GitHub.
// Leer es libre (salvo archivos sensibles). Cambiar = abrir un Pull Request en una rama propia (fodi/...):
// FODI NUNCA toca main ni publica; el dueño revisa y aprueba el PR (Vercel solo publica lo que entra a main).
// Token: secreto GITHUB_TOKEN (fine-grained, solo este repo: Contents RW + Pull requests RW).
//   node --test --test-concurrency=1 tests/fodi-codigo.test.js

const REPO = 'nodusestudio/menu-roal-burger';
const BASE = 'main';
const MAX_LINEAS = 300;
const MAX_CAMBIOS = 12;
const BLOQUEADA = /(^|\/)(node_modules|\.git|\.github|\.vercel|\.claude)(\/|$)|serviceaccount|\.env|\.pem$|\.key$|secret|credential|package-lock\.json$/i;

const rutaOk = (r) => { const s = String(r || '').replace(/^\/+/, ''); return s && !s.includes('..') && !s.includes('\\') && s.length < 200 ? s : ''; };

async function gh(token, ruta, { metodo = 'GET', cuerpo, raw = false, fetchFn = fetch } = {}) {
    const res = await fetchFn(`https://api.github.com${ruta}`, {
        method: metodo,
        headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'fodi-asistente', 'X-GitHub-Api-Version': '2022-11-28', Accept: raw ? 'application/vnd.github.raw+json' : 'application/vnd.github+json', ...(cuerpo ? { 'Content-Type': 'application/json' } : {}) },
        body: cuerpo ? JSON.stringify(cuerpo) : undefined
    });
    if (!res.ok) { const t = await res.text().catch(() => ''); throw new Error(`GitHub ${res.status}: ${t.slice(0, 200)}`); }
    return raw ? res.text() : res.json();
}
const repo = (p) => `/repos/${REPO}${p}`;

// Aplica reemplazos exactos: cada "buscar" debe aparecer UNA sola vez. Devuelve { texto } o { error }.
function aplicarCambios(texto, cambios, ruta) {
    let out = texto;
    for (const c of cambios) {
        const b = String(c.buscar ?? ''), r = String(c.reemplazar ?? '');
        if (!b) return { error: `${ruta}: "buscar" vacío.` };
        const partes = out.split(b).length - 1;
        if (partes === 0) return { error: `${ruta}: no encontré el texto a reemplazar (copia el fragmento EXACTO, con espacios): "${b.slice(0, 80)}".` };
        if (partes > 1) return { error: `${ruta}: el texto aparece ${partes} veces; amplía "buscar" con más contexto para que sea único.` };
        out = out.replace(b, () => r);
    }
    return { texto: out };
}

const slug = (s) => String(s || 'cambio').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'cambio';

async function codigoFuente(args = {}, token, fetchFn = fetch) {
    if (!token) return { error: 'El acceso a GitHub aún no está configurado (falta el secreto GITHUB_TOKEN). Avisa al dueño.' };
    const o = { fetchFn };
    try {
        if (args.accion === 'listar') {
            const ruta = rutaOk(args.ruta || '');
            if (ruta && BLOQUEADA.test(ruta)) return { error: 'Esa ruta está bloqueada.' };
            const r = await gh(token, repo(`/contents/${encodeURI(ruta)}?ref=${BASE}`), o);
            return { ruta: ruta || '/', entradas: (Array.isArray(r) ? r : [r]).filter((e) => !BLOQUEADA.test(e.path)).map((e) => ({ nombre: e.name, tipo: e.type, bytes: e.size })).slice(0, 200) };
        }
        if (args.accion === 'leer') {
            const ruta = rutaOk(args.ruta);
            if (!ruta || BLOQUEADA.test(ruta)) return { error: 'Ruta no válida o bloqueada (archivos sensibles).' };
            const texto = await gh(token, repo(`/contents/${encodeURI(ruta)}?ref=${BASE}`), { ...o, raw: true });
            const lineas = texto.split('\n');
            const desde = Math.max(1, parseInt(args.desde, 10) || 1);
            const hasta = Math.min(lineas.length, Math.max(desde, parseInt(args.hasta, 10) || desde + MAX_LINEAS - 1), desde + MAX_LINEAS - 1);
            return { ruta, total_lineas: lineas.length, desde, hasta, truncado: hasta < lineas.length, contenido: lineas.slice(desde - 1, hasta).map((l, k) => `${desde + k}: ${l}`).join('\n') };
        }
        if (args.accion === 'buscar') {
            const q = String(args.texto || '').trim();
            if (q.length < 3) return { error: 'Escribe al menos 3 caracteres a buscar.' };
            const res = await fetchFn(`https://api.github.com/search/code?q=${encodeURIComponent(q + ' repo:' + REPO)}&per_page=10`, { headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'fodi-asistente', Accept: 'application/vnd.github.text-match+json' } });
            if (!res.ok) return { error: `GitHub ${res.status} al buscar.` };
            const j = await res.json();
            return { total: j.total_count, resultados: (j.items || []).filter((i) => !BLOQUEADA.test(i.path)).map((i) => ({ ruta: i.path, fragmentos: (i.text_matches || []).map((m) => String(m.fragment || '').slice(0, 200)).slice(0, 2) })) };
        }
        if (args.accion === 'proponer_cambio') {
            const titulo = String(args.titulo || '').trim().slice(0, 100);
            const archivos = Array.isArray(args.archivos) ? args.archivos : [];
            if (titulo.length < 5) return { error: 'Falta un título claro para el cambio.' };
            const total = archivos.reduce((s, a) => s + (Array.isArray(a.cambios) ? a.cambios.length : 0), 0);
            if (!archivos.length || !total || total > MAX_CAMBIOS) return { error: `Indica los archivos con sus cambios (1 a ${MAX_CAMBIOS} reemplazos).` };
            const listos = [];
            for (const a of archivos) {
                const ruta = rutaOk(a.ruta);
                if (!ruta || BLOQUEADA.test(ruta)) return { error: `Ruta no permitida: ${a.ruta}` };
                const meta = await gh(token, repo(`/contents/${encodeURI(ruta)}?ref=${BASE}`), o);
                const texto = await gh(token, repo(`/contents/${encodeURI(ruta)}?ref=${BASE}`), { ...o, raw: true });
                const r = aplicarCambios(texto, Array.isArray(a.cambios) ? a.cambios : [], ruta);
                if (r.error) return { error: r.error };
                listos.push({ ruta, sha: meta.sha, texto: r.texto });
            }
            const ref = await gh(token, repo(`/git/ref/heads/${BASE}`), o);
            const rama = `fodi/${slug(titulo)}-${Date.now().toString(36)}`;
            await gh(token, repo('/git/refs'), { ...o, metodo: 'POST', cuerpo: { ref: `refs/heads/${rama}`, sha: ref.object.sha } });
            for (const f of listos) {
                await gh(token, repo(`/contents/${encodeURI(f.ruta)}`), { ...o, metodo: 'PUT', cuerpo: { message: `fodi: ${titulo}\n\n${f.ruta}`, content: Buffer.from(f.texto, 'utf8').toString('base64'), sha: f.sha, branch: rama } });
            }
            const pr = await gh(token, repo('/pulls'), { ...o, metodo: 'POST', cuerpo: { title: `[FODI] ${titulo}`, head: rama, base: BASE, body: `${String(args.descripcion || '').slice(0, 3000)}\n\n---\nPropuesto por FODI. Revisa el diff antes de aprobar; no se publica hasta que se una a \`${BASE}\`.` } });
            return { ok: true, pr_url: pr.html_url, pr_numero: pr.number, rama, nota: 'Pull Request creado. NO está publicado: el dueño debe revisarlo y aprobarlo en GitHub. Dile el enlace.' };
        }
        return { error: 'accion debe ser listar, buscar, leer o proponer_cambio.' };
    } catch (e) {
        return { error: String((e && e.message) || e).slice(0, 300) };
    }
}

const TOOL = {
    name: 'codigo_fuente',
    description: 'CÓDIGO de la app (repositorio GitHub). "listar" carpeta, "buscar" texto, "leer" archivo por tramos de hasta 300 líneas (usa desde/hasta; los archivos grandes como src/js/admin.js tienen decenas de miles de líneas: busca primero), "proponer_cambio" abre un PULL REQUEST con reemplazos exactos (buscar → reemplazar, el fragmento debe ser único y copiado tal cual de "leer"). NUNCA publica ni toca main: el dueño aprueba el PR en GitHub. Lee SIEMPRE el tramo antes de proponer; cambios pequeños y enfocados; no toques claves ni archivos de configuración sensibles (están bloqueados). Úsala cuando el administrador pida entender, corregir o cambiar algo de la app.',
    input_schema: { type: 'object', properties: {
        accion: { type: 'string', enum: ['listar', 'buscar', 'leer', 'proponer_cambio'] },
        ruta: { type: 'string', description: 'listar/leer: ruta relativa (ej. "functions/fodiCatalogo.js").' },
        texto: { type: 'string', description: 'buscar: texto a buscar en el código.' },
        desde: { type: 'integer' }, hasta: { type: 'integer' },
        titulo: { type: 'string', description: 'proponer_cambio: título corto del cambio.' },
        descripcion: { type: 'string', description: 'proponer_cambio: qué cambia y por qué.' },
        archivos: { type: 'array', maxItems: 5, description: 'proponer_cambio: archivos a modificar.', items: { type: 'object', properties: { ruta: { type: 'string' }, cambios: { type: 'array', items: { type: 'object', properties: { buscar: { type: 'string' }, reemplazar: { type: 'string' } }, required: ['buscar', 'reemplazar'] } } }, required: ['ruta', 'cambios'] } }
    }, required: ['accion'] }
};

module.exports = { codigoFuente, aplicarCambios, BLOQUEADA, TOOL, REPO };
