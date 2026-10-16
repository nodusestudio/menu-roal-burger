// QA del admin con sesión persistente (smoke de FODI + revisión visual de Costos y recetas).
// NO es un *.test.js: se lanza a mano.  node tests/qa-admin.mjs [--base=https://www.roalburger.com] [--shots=./_qa-shots]
// Perfil persistente en ~/.fodexa-qa-profile: la PRIMERA vez se abre la ventana y el dueño inicia sesión
// como admin; las siguientes corridas reutilizan la sesión. Nunca guarda ni ve la contraseña.
import { chromium } from 'playwright';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const arg = (k, d) => (process.argv.find((a) => a.startsWith(`--${k}=`)) || '').split('=').slice(1).join('=') || d;
const base = arg('base', 'https://www.roalburger.com');
const shots = arg('shots', './_qa-shots');
const perfil = path.join(os.homedir(), '.fodexa-qa-profile');
fs.mkdirSync(shots, { recursive: true });

const ctx = await chromium.launchPersistentContext(perfil, { headless: false, viewport: { width: 1400, height: 900 } });
const page = ctx.pages()[0] || await ctx.newPage();
const errores = [];
page.on('pageerror', (e) => errores.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errores.push('console: ' + m.text()); });

await page.goto(`${base}/admin.html`, { waitUntil: 'domcontentloaded' });
console.log('Si ves el login, inicia sesión como admin en la ventana (esperando hasta 5 min)…');
await page.waitForSelector('[data-accordion-target="costos"]', { state: 'visible', timeout: 300000 });
console.log('Sesión admin lista.');

// ── Costos y recetas ──
await page.click('[data-accordion-target="costos"]');
await page.waitForSelector('#costosBody .cs-tab', { timeout: 30000 });
const vistas = await page.$$eval('#costosBody .cs-tab', (els) => els.map((e) => e.dataset.csVista));
for (const v of vistas) {
  await page.click(`#costosBody [data-cs-vista="${v}"]`);
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(shots, `costos-${v}.png`), fullPage: true });
  console.log('Costos →', v, 'ok');
}

// ── FODI ──
const preguntas = (arg('q', '') ? arg('q').split('|') : [
  '¿Cuánto vendimos en agosto de 2026 por Bancolombia y cuántos pedidos fueron?',
  '¿Qué variantes de producto se venden más?',
  '¿Qué clientes están en riesgo de dejar de pedir?',
]);
await page.click('[data-accordion-target="asistente"]');
await page.waitForSelector('#asistInput', { state: 'visible', timeout: 30000 });
for (const [i, q] of preguntas.entries()) {
  const antes = await page.$$eval('.asist-msg.bot', (e) => e.length);
  await page.fill('#asistInput', q);
  await page.press('#asistInput', 'Enter');
  await page.waitForFunction((n) => {
    const b = document.querySelectorAll('.asist-msg.bot');
    return b.length > n && !b[b.length - 1].querySelector('.asist-think');
  }, antes, { timeout: 120000 });
  const txt = await page.$$eval('.asist-msg.bot', (e) => e[e.length - 1].innerText);
  console.log(`\n── FODI P${i + 1}: ${q}\n${txt.slice(0, 900)}`);
  await page.screenshot({ path: path.join(shots, `fodi-${i + 1}.png`), fullPage: true });
}

console.log('\nErrores de consola/página:', errores.length ? '\n' + errores.slice(0, 15).join('\n') : 'ninguno');
await ctx.close();
