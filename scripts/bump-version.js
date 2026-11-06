/**
 * bump-version.js
 * Actualiza el CACHE_VER en sw.js y el ?v= en admin.html e index.html con la fecha+hora actual.
 * Corre automáticamente como primer paso de npm run dev y npm run build.
 */

const fs   = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

// Generar stamp con fecha local: YYYYMMDD-HHmm
const now  = new Date();
const pad  = (n) => String(n).padStart(2, '0');
const date = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}`;
const time = `${pad(now.getHours())}${pad(now.getMinutes())}`;
const stamp = `${date}-${time}`;   // ej. 20260628-2145

// ── 1. sw.js — CACHE_VER ─────────────────────────────────────────────────────
const swPath = path.join(ROOT, 'sw.js');
const swContent = fs.readFileSync(swPath, 'utf8');
const swUpdated = swContent.replace(
    /const CACHE_VER\s*=\s*'rb-[\w-]+'/,
    `const CACHE_VER    = 'rb-${stamp}'`
);
if (swUpdated !== swContent) {
    fs.writeFileSync(swPath, swUpdated, 'utf8');
    console.log(`[bump] sw.js        → rb-${stamp}`);
} else {
    console.log(`[bump] sw.js        sin cambios (ya es rb-${stamp}?)`);
}

// ── 2. admin.html — ?v= en admin.js y style.css ──────────────────────────────
const adminHtmlPath = path.join(ROOT, 'admin.html');
let adminHtml = fs.readFileSync(adminHtmlPath, 'utf8');

// admin.js?v=...
adminHtml = adminHtml.replace(
    /admin\.js\?v=[\w-]+/g,
    `admin.js?v=${stamp}`
);

// firebase-config.js?v=... -- sin esto, un cambio en este archivo (ej. una guarda nueva contra
// un SDK que no cargo) quedaba pegado para siempre en el navegador de quien ya lo tuviera en
// cache: es un .js suelto con Cache-Control immutable de 1 año (ver vercel.json) y sin ?v= la URL
// nunca cambiaba entre despliegues, asi que el navegador jamas volvia a pedirlo.
adminHtml = adminHtml.replace(
    /firebase-config\.js(\?v=[\w-]+)?(?=")/g,
    `firebase-config.js?v=${stamp}`
);

// src/js/caja/calculos.js?v=... (módulo de lógica de Caja, se sirve tal cual sin minificar)
adminHtml = adminHtml.replace(
    /caja\/calculos\.js\?v=[\w-]+/g,
    `caja/calculos.js?v=${stamp}`
);

// src/js/cupones/semaforo.js?v=... (semáforo de temporadas de Fuera del Menú, mismo patrón)
adminHtml = adminHtml.replace(
    /cupones\/semaforo\.js\?v=[\w-]+/g,
    `cupones/semaforo.js?v=${stamp}`
);

// style.css — agrega ?v= si no existe, o reemplaza la existente
adminHtml = adminHtml.replace(
    /href="style\.css(\?v=[\w-]+)?"/g,
    `href="style.css?v=${stamp}"`
);

fs.writeFileSync(adminHtmlPath, adminHtml, 'utf8');
console.log(`[bump] admin.html   → admin.js?v=${stamp}  firebase-config.js?v=${stamp}  style.css?v=${stamp}`);

// ── 3. index.html — ?v= en script-v2.js, tracking.js y style.css ─────────────
const indexHtmlPath = path.join(ROOT, 'index.html');
let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

indexHtml = indexHtml.replace(
    /script-v2\.js\?v=[\w-]+/g,
    `script-v2.js?v=${stamp}`
);
indexHtml = indexHtml.replace(
    /tracking\.js(\?v=[\w-]+)?(?=")/g,
    `tracking.js?v=${stamp}`
);
indexHtml = indexHtml.replace(
    /agent-chat\.js(\?v=[\w-]+)?(?=")/g,
    `agent-chat.js?v=${stamp}`
);
indexHtml = indexHtml.replace(
    /firebase-config\.js(\?v=[\w-]+)?(?=")/g,
    `firebase-config.js?v=${stamp}`
);
indexHtml = indexHtml.replace(
    /href="style\.css(\?v=[\w-]+)?"/g,
    `href="style.css?v=${stamp}"`
);

fs.writeFileSync(indexHtmlPath, indexHtml, 'utf8');
console.log(`[bump] index.html   → script-v2.js?v=${stamp}  tracking.js?v=${stamp}  agent-chat.js?v=${stamp}  firebase-config.js?v=${stamp}  style.css?v=${stamp}`);

// ── 4. cupon.html — ?v= en cupon.js y firebase-config.js (landing de Cupón Pana) ─────────────
// Mismo motivo que arriba: .js con Cache-Control immutable de 1 año; sin un ?v= nuevo en cada
// build, quien ya abrió /cupon seguiría con el cupon.js viejo para siempre.
const cuponHtmlPath = path.join(ROOT, 'cupon.html');
let cuponHtml = fs.readFileSync(cuponHtmlPath, 'utf8');
cuponHtml = cuponHtml.replace(
    /cupon\.js(\?v=[\w-]+)?(?=")/g,
    `cupon.js?v=${stamp}`
);
cuponHtml = cuponHtml.replace(
    /firebase-config\.js(\?v=[\w-]+)?(?=")/g,
    `firebase-config.js?v=${stamp}`
);
fs.writeFileSync(cuponHtmlPath, cuponHtml, 'utf8');
console.log(`[bump] cupon.html   → cupon.js?v=${stamp}  firebase-config.js?v=${stamp}`);

// ── 5. encuesta.html — ?v= en encuesta.js y firebase-config.js (encuesta de feedback) ─────────
// encuesta.html (Sabe a Quindío, vista previa de la Trifásica) y opinion.html (fidelización, vista previa con el logo): mismo script.
for (const nombre of ['encuesta.html', 'opinion.html']) {
    const htmlPath = path.join(ROOT, nombre);
    if (!fs.existsSync(htmlPath)) continue;
    let html = fs.readFileSync(htmlPath, 'utf8');
    html = html.replace(/encuesta\.js(\?v=[\w-]+)?(?=")/g, `encuesta.js?v=${stamp}`);
    html = html.replace(/firebase-config\.js(\?v=[\w-]+)?(?=")/g, `firebase-config.js?v=${stamp}`);
    fs.writeFileSync(htmlPath, html, 'utf8');
    console.log(`[bump] ${nombre} → encuesta.js?v=${stamp}  firebase-config.js?v=${stamp}`);
}

// ── 6. tv.html — ?v= en tv.js y firebase-config.js (pantalla de TV del local) ─────────────────
const tvHtmlPath = path.join(ROOT, 'tv.html');
let tvHtml = fs.readFileSync(tvHtmlPath, 'utf8');
tvHtml = tvHtml.replace(/tv\.js(\?v=[\w-]+)?(?=")/g, `tv.js?v=${stamp}`);
tvHtml = tvHtml.replace(/firebase-config\.js(\?v=[\w-]+)?(?=")/g, `firebase-config.js?v=${stamp}`);
tvHtml = tvHtml.replace(/qr-emv\.js(\?v=[\w-]+)?(?=")/g, `qr-emv.js?v=${stamp}`);
fs.writeFileSync(tvHtmlPath, tvHtml, 'utf8');
console.log(`[bump] tv.html      → tv.js?v=${stamp}  firebase-config.js?v=${stamp}`);

// ── 7. avisos.html — ?v= en avisos.js y firebase-config.js (activar avisos push en el celular) ──────
const avisosHtmlPath = path.join(ROOT, 'avisos.html');
let avisosHtml = fs.readFileSync(avisosHtmlPath, 'utf8');
avisosHtml = avisosHtml.replace(/avisos\.js(\?v=[\w-]+)?(?=")/g, `avisos.js?v=${stamp}`);
avisosHtml = avisosHtml.replace(/firebase-config\.js(\?v=[\w-]+)?(?=")/g, `firebase-config.js?v=${stamp}`);
fs.writeFileSync(avisosHtmlPath, avisosHtml, 'utf8');
console.log(`[bump] avisos.html  → avisos.js?v=${stamp}  firebase-config.js?v=${stamp}`);
