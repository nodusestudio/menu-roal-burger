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

// style.css — agrega ?v= si no existe, o reemplaza la existente
adminHtml = adminHtml.replace(
    /href="style\.css(\?v=[\w-]+)?"/g,
    `href="style.css?v=${stamp}"`
);

fs.writeFileSync(adminHtmlPath, adminHtml, 'utf8');
console.log(`[bump] admin.html   → admin.js?v=${stamp}  style.css?v=${stamp}`);

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
    /href="style\.css(\?v=[\w-]+)?"/g,
    `href="style.css?v=${stamp}"`
);

fs.writeFileSync(indexHtmlPath, indexHtml, 'utf8');
console.log(`[bump] index.html   → script-v2.js?v=${stamp}  tracking.js?v=${stamp}  style.css?v=${stamp}`);
