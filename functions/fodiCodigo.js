// FODI · lectura y propuesta de cambios al CÓDIGO, a través de GitHub.
// Leer es libre (salvo archivos sensibles). Cambiar = abrir un Pull Request en una rama propia (fodi/...):
// FODI NUNCA toca main ni publica; el dueño revisa y aprueba el PR (Vercel solo publica lo que entra a main).
// Un PR puede: reemplazar texto exacto, CREAR archivos nuevos y ELIMINAR archivos. Antes de abrir la rama se
// valida la sintaxis de lo que se escribe (JS/JSON) para no proponer código que ni siquiera compila.
// "mis_cambios" / "ver_cambio" le permiten a FODI ver cómo terminaron sus PR (unidos, cerrados, comentarios del
// dueño) y aprender de eso.
// Token: secreto GITHUB_TOKEN (fine-grained, solo este repo: Contents RW + Pull requests RW).
//   node --test --test-concurrency=1 tests/fodi-codigo.test.js

const vm = require('vm');

const REPO = 'nodusestudio/menu-roal-burger';
const BASE = 'main';
const MAX_LINEAS = 300;
const MAX_CAMBIOS = 40;
const MAX_ARCHIVOS = 12;
const MAX_BYTES_ARCHIVO = 400 * 1024;
const BLOQUEADA = /(^|\/)(node_modules|\.git|\.github|\.vercel|\.claude)(\/|$)|serviceaccount|\.env|\.pem$|\.key$|secret|credential|package-lock\.json$/i;

const rutaOk = (r) => { const s = String(r || '').replace(/^\/+/, ''); return s && !s.includes('..') && !s.includes('\\') && s.length < 200 ? s : ''; };

async function gh(token, ruta, { metodo = 'GET', cuerpo, raw = false, fetchFn = fetch } = {}) {
    const res = await fetchFn(`https://api.github.com${ruta}`, {
        method: metodo,
        headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'fodi-asistente', 'X-GitHub-Api-Version': '2022-11-28', Accept: raw ? 'application/vnd.github.raw+json' : 'application/vnd.github+json', ...(cuerpo ? { 'Content-Type': 'application/json' } : {}) },
        body: cuerpo ? JSON.stringify(cuerpo) : undefined
    });
    if (!res.ok) { const t = await res.text().catch(() => ''); const e = new Error(`GitHub ${res.status}: ${t.slice(0, 200)}`); e.status = res.status; throw e; }
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

// Revisión de sintaxis. Devuelve null si está bien o no se puede comprobar, o un mensaje de error.
// Un módulo ES (import/export/await de nivel superior) no se puede comprobar como script: se omite.
function revisarSintaxis(ruta, texto) {
    if (/\.json$/i.test(ruta)) { try { JSON.parse(texto); return null; } catch (e) { return `${ruta}: JSON inválido (${e.message}).`; } }
    if (!/\.(c|m)?js$/i.test(ruta)) return null;
    try { new vm.Script(texto, { filename: ruta }); return null; } catch (e) {
        const m = String((e && e.message) || e);
        if (/import statement|export|await is only valid|Cannot use 'import\.meta'/i.test(m)) return null;
        const linea = String((e && e.stack) || '').match(/:(\d+)\n/);
        return `${ruta}: error de sintaxis${linea ? ' cerca de la línea ' + linea[1] : ''}: ${m}.`;
    }
}

const slug = (s) => String(s || 'cambio').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'cambio';

async function leerArchivo(token, ruta, o) {
    const meta = await gh(token, repo(`/contents/${encodeURI(ruta)}?ref=${BASE}`), o);
    const texto = await gh(token, repo(`/contents/${encodeURI(ruta)}?ref=${BASE}`), { ...o, raw: true });
    return { sha: meta.sha, texto };
}

async function proponerCambio(args, token, o) {
    const titulo = String(args.titulo || '').trim().slice(0, 100);
    const archivos = Array.isArray(args.archivos) ? args.archivos : [];
    if (titulo.length < 5) return { error: 'Falta un título claro para el cambio.' };
    if (!archivos.length || archivos.length > MAX_ARCHIVOS) return { error: `Indica entre 1 y ${MAX_ARCHIVOS} archivos.` };
    const totalCambios = archivos.reduce((s, a) => s + (Array.isArray(a.cambios) ? a.cambios.length : 0), 0);
    if (totalCambios > MAX_CAMBIOS) return { error: `Demasiados reemplazos (máx. ${MAX_CAMBIOS}); divide el trabajo en varios PR.` };

    // 1) Validar TODO antes de escribir nada
    const listos = [], vistos = new Set();
    for (const a of archivos) {
        const ruta = rutaOk(a.ruta);
        if (!ruta || BLOQUEADA.test(ruta)) return { error: `Ruta no permitida: ${a.ruta}` };
        if (vistos.has(ruta)) return { error: `El archivo ${ruta} aparece dos veces: junta sus cambios en una sola entrada.` };
        vistos.add(ruta);
        if (a.eliminar === true) {
            let f; try { f = await leerArchivo(token, ruta, o); } catch (e) { return { error: e.status === 404 ? `${ruta}: no existe, no hay nada que eliminar.` : e.message }; }
            listos.push({ ruta, accion: 'eliminar', sha: f.sha });
        } else if (typeof a.contenido === 'string' && a.crear === true) {
            if (a.contenido.length > MAX_BYTES_ARCHIVO) return { error: `${ruta}: archivo muy grande para crearlo por aquí.` };
            let existe = true; try { await gh(token, repo(`/contents/${encodeURI(ruta)}?ref=${BASE}`), o); } catch (e) { if (e.status === 404) existe = false; else return { error: e.message }; }
            if (existe) return { error: `${ruta} ya existe: usa reemplazos (cambios) en vez de crear.` };
            const err = revisarSintaxis(ruta, a.contenido); if (err) return { error: err };
            listos.push({ ruta, accion: 'crear', texto: a.contenido });
        } else {
            const cambios = Array.isArray(a.cambios) ? a.cambios : [];
            if (!cambios.length) return { error: `${ruta}: indica "cambios" (buscar/reemplazar), o "crear" con "contenido", o "eliminar".` };
            let f; try { f = await leerArchivo(token, ruta, o); } catch (e) { return { error: e.status === 404 ? `${ruta}: no existe (para un archivo nuevo usa crear:true y contenido).` : e.message }; }
            const r = aplicarCambios(f.texto, cambios, ruta);
            if (r.error) return r;
            const antes = revisarSintaxis(ruta, f.texto), despues = revisarSintaxis(ruta, r.texto);
            if (despues && !antes) return { error: `${despues} Tu cambio rompe el archivo; corrígelo antes de proponerlo.` };
            listos.push({ ruta, accion: 'editar', sha: f.sha, texto: r.texto });
        }
    }

    // 2) Rama + commits + PR
    const ref = await gh(token, repo(`/git/ref/heads/${BASE}`), o);
    const rama = `fodi/${slug(titulo)}-${Date.now().toString(36)}`;
    await gh(token, repo('/git/refs'), { ...o, metodo: 'POST', cuerpo: { ref: `refs/heads/${rama}`, sha: ref.object.sha } });
    for (const f of listos) {
        const msg = `fodi: ${titulo}\n\n${f.accion} ${f.ruta}`;
        if (f.accion === 'eliminar') await gh(token, repo(`/contents/${encodeURI(f.ruta)}`), { ...o, metodo: 'DELETE', cuerpo: { message: msg, sha: f.sha, branch: rama } });
        else await gh(token, repo(`/contents/${encodeURI(f.ruta)}`), { ...o, metodo: 'PUT', cuerpo: { message: msg, content: Buffer.from(f.texto, 'utf8').toString('base64'), ...(f.sha ? { sha: f.sha } : {}), branch: rama } });
    }
    const tocaFunctions = listos.some((f) => /^functions\//.test(f.ruta));
    const tocaWeb = listos.some((f) => !/^(functions|tests|docs)\//.test(f.ruta));
    const despliegue = [tocaWeb ? '• Web (menú y admin): se publica sola en Vercel al unir el PR a `main`.' : '', tocaFunctions ? '• Cloud Functions: tras unir el PR hay que desplegarlas (`firebase deploy --only functions:<nombre>`). FODI no puede hacerlo.' : ''].filter(Boolean).join('\n') || '• Solo pruebas/documentación: no requiere despliegue.';
    const cuerpo = `${String(args.descripcion || '').slice(0, 2500)}\n\n**Archivos:**\n${listos.map((f) => `- ${f.accion}: \`${f.ruta}\``).join('\n')}\n\n**Cómo probarlo:** ${String(args.pruebas || 'Revisa el diff y prueba la pantalla afectada.').slice(0, 800)}\n\n**Despliegue:**\n${despliegue}\n\n---\nPropuesto por FODI. Vercel genera una vista previa de esta rama. No se publica hasta que se una a \`${BASE}\`.`;
    const pr = await gh(token, repo('/pulls'), { ...o, metodo: 'POST', cuerpo: { title: `[FODI] ${titulo}`, head: rama, base: BASE, body: cuerpo } });
    return { ok: true, pr_url: pr.html_url, pr_numero: pr.number, rama, requiere_deploy_functions: tocaFunctions, nota: 'Pull Request creado. NO está publicado: el dueño debe revisarlo y aprobarlo en GitHub. Dile el enlace, cómo probarlo y si necesita desplegar functions. Registra con lecciones lo que aprendas cuando veas cómo termina.' };
}

async function misCambios(token, o) {
    const prs = await gh(token, repo('/pulls?state=all&per_page=40&sort=created&direction=desc'), o);
    const fodi = (Array.isArray(prs) ? prs : []).filter((p) => String(p.head && p.head.ref).startsWith('fodi/'));
    return { total: fodi.length, cambios: fodi.slice(0, 15).map((p) => ({ numero: p.number, titulo: p.title, estado: p.merged_at ? 'UNIDO (aprobado)' : p.state === 'open' ? 'abierto (pendiente de revisión)' : 'CERRADO sin unir (rechazado)', url: p.html_url, creado: String(p.created_at || '').slice(0, 10), cerrado: String(p.closed_at || '').slice(0, 10) || undefined })), nota: 'Los UNIDOS salieron bien; los CERRADOS sin unir fueron rechazados: mira con ver_cambio qué comentó el dueño y aprende (registra una lección).' };
}

async function verCambio(args, token, o) {
    const n = parseInt(args.numero, 10);
    if (!(n > 0)) return { error: 'Indica el número del PR.' };
    const [pr, files, comentarios, revisiones] = await Promise.all([
        gh(token, repo(`/pulls/${n}`), o),
        gh(token, repo(`/pulls/${n}/files?per_page=30`), o),
        gh(token, repo(`/issues/${n}/comments?per_page=30`), o),
        gh(token, repo(`/pulls/${n}/comments?per_page=30`), o)
    ]);
    if (!String(pr.head && pr.head.ref).startsWith('fodi/')) return { error: 'Ese PR no es de FODI.' };
    return {
        numero: n, titulo: pr.title, estado: pr.merged_at ? 'UNIDO' : pr.state === 'open' ? 'abierto' : 'CERRADO sin unir', url: pr.html_url,
        archivos: files.slice(0, 12).map((f) => ({ ruta: f.filename, cambio: f.status, mas: f.additions, menos: f.deletions, diff: String(f.patch || '').slice(0, 1200) })),
        comentarios_del_dueno: [...comentarios, ...revisiones].filter((c) => c.user && c.user.type !== 'Bot').slice(0, 20).map((c) => ({ de: c.user.login, texto: String(c.body || '').slice(0, 500) }))
    };
}

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
        if (args.accion === 'proponer_cambio') return await proponerCambio(args, token, o);
        if (args.accion === 'mis_cambios') return await misCambios(token, o);
        if (args.accion === 'ver_cambio') return await verCambio(args, token, o);
        return { error: 'accion debe ser listar, buscar, leer, proponer_cambio, mis_cambios o ver_cambio.' };
    } catch (e) {
        return { error: String((e && e.message) || e).slice(0, 300) };
    }
}

const TOOL = {
    name: 'codigo_fuente',
    description: 'CÓDIGO de la app (repositorio GitHub): para PROGRAMAR. "listar" carpeta, "buscar" texto, "leer" archivo por tramos de hasta 300 líneas (usa desde/hasta; src/js/admin.js y src/js/script-v2.js tienen decenas de miles de líneas: busca primero), "proponer_cambio" abre un PULL REQUEST que puede (a) reemplazar texto exacto (buscar → reemplazar, fragmento único y copiado tal cual de "leer"), (b) CREAR archivos nuevos (crear:true + contenido) y (c) ELIMINAR archivos (eliminar:true): sirve para cambiar o agregar funciones, ventanas, botones y pestañas, y quitar o editar lo que ya existe. Valida la sintaxis y NUNCA publica ni toca main: el dueño aprueba el PR. "mis_cambios" lista tus PR anteriores y cómo terminaron (unido / rechazado); "ver_cambio" muestra el diff y los comentarios del dueño: úsalos para APRENDER. Antes de programar: consulta tus lecciones, lee el código relacionado completo, imita su estilo (panel: tarjetas `admin-card`, vidrio `liquid-glass`; sin blanco puro), haz cambios pequeños y enfocados, incluye tests si tocas lógica en functions/ y explica cómo probarlo (campo pruebas). Archivos sensibles bloqueados. Si tocas functions/, avisa que requiere desplegar.',
    input_schema: { type: 'object', properties: {
        accion: { type: 'string', enum: ['listar', 'buscar', 'leer', 'proponer_cambio', 'mis_cambios', 'ver_cambio'] },
        ruta: { type: 'string', description: 'listar/leer: ruta relativa (ej. "functions/fodiCatalogo.js").' },
        texto: { type: 'string', description: 'buscar: texto a buscar en el código.' },
        desde: { type: 'integer' }, hasta: { type: 'integer' },
        numero: { type: 'integer', description: 'ver_cambio: número del Pull Request.' },
        titulo: { type: 'string', description: 'proponer_cambio: título corto del cambio.' },
        descripcion: { type: 'string', description: 'proponer_cambio: qué cambia y por qué.' },
        pruebas: { type: 'string', description: 'proponer_cambio: cómo probar el cambio (pasos concretos).' },
        archivos: { type: 'array', maxItems: 12, description: 'proponer_cambio: archivos a tocar.', items: { type: 'object', properties: {
            ruta: { type: 'string' },
            cambios: { type: 'array', description: 'Editar: reemplazos exactos.', items: { type: 'object', properties: { buscar: { type: 'string' }, reemplazar: { type: 'string' } }, required: ['buscar', 'reemplazar'] } },
            crear: { type: 'boolean', description: 'true para crear un archivo nuevo (con contenido).' },
            contenido: { type: 'string', description: 'Contenido completo del archivo nuevo.' },
            eliminar: { type: 'boolean', description: 'true para eliminar el archivo.' }
        }, required: ['ruta'] } }
    }, required: ['accion'] }
};

module.exports = { codigoFuente, aplicarCambios, revisarSintaxis, BLOQUEADA, TOOL, REPO };
