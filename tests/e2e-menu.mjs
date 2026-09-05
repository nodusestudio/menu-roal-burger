// E2E del menú público ROAL BURGER — recorre "entrar → ver menú → carrito → checkout →
// medio de pago → enviar pedido" con Playwright y reporta errores de consola / pageerrors /
// requests fallidos y si la pantalla de confirmación aparece.
//
// NO es un *.test.js: no lo corre ningún runner automático, se lanza a mano.
//
// Requisitos: `npx playwright install chromium` una vez.
//
// ── Contra el emulador (seguro, no toca producción ni la cocina) ──
//   1. firebase emulators:start --only firestore,functions,auth,hosting --project roal-burger-menu
//   2. node scripts/seed-emulator.js
//   3. node tests/e2e-menu.mjs --base=http://localhost:5000 --mode=guest --shots=./_e2e-shots
//   (el emulador siembra horario 24h, así que el checkout no se bloquea por el reloj)
//
// ── Contra producción ──
//   Dry run (llena todo pero NO confirma el pedido):
//     node tests/e2e-menu.mjs --base=https://www.roalburger.com --mode=guest --dry
//   Registro real con OTP de WhatsApp (relevás el código escribiéndolo en el archivo --otp-file):
//     node tests/e2e-menu.mjs --base=https://www.roalburger.com --mode=register \
//       --phone=573001234567 --pin=123456 --name="Prueba" --otp-file=./_otp.txt
//   OJO: sin --dry en producción se crea un pedido REAL — cancelarlo desde el admin.
//   La tienda debe estar abierta (4:00–10:00 P.M. hora Colombia) o el flujo entra por
//   "pedido programado".
//
// Flags: --base --mode=guest|register --dry --headed --phone --pin --name --otp-file
//        --shots=<dir>  --cushion (agrega entrada de historial "colchón")
//        --freeze-history (diagnóstico: neutraliza el history.back() del flujo de éxito)
import { chromium } from 'playwright';
import fs from 'node:fs';

const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const m = a.match(/^--([^=]+)(?:=(.*))?$/); return m ? [m[1], m[2] ?? true] : [a, true];
}));
const BASE = args.base || 'http://localhost:5000';
const MODE = args.mode || 'guest';            // guest | register
const DRY  = Boolean(args.dry);               // no confirma el pedido final
const PHONE = String(args.phone || '3001234567').replace(/\D/g, '');
const PIN = String(args.pin || '123456');
const NAME = String(args.name || 'Prueba E2E');
const OTP_FILE = args['otp-file'] || null;
const SHOTS = args.shots || process.cwd();
const HEADED = Boolean(args.headed);

const log = (...a) => console.log(`[${new Date().toISOString().slice(11, 19)}]`, ...a);
const step = (n, t) => log(`\n━━━ PASO ${n}: ${t}`);
let shotN = 0;
const shot = async (page, name) => {
  const f = `${SHOTS}/e2e-${String(++shotN).padStart(2, '0')}-${name}.png`;
  await page.screenshot({ path: f, fullPage: false }).catch(() => {});
  log(`  📸 ${f}`);
};

const consoleErrors = [];
const pageErrors = [];
const failedReqs = [];

async function waitOtp(timeoutMs = 300000) {
  if (!OTP_FILE) throw new Error('Falta --otp-file para el modo register');
  log(`  ⏳ Esperando OTP en ${OTP_FILE} (hasta ${timeoutMs / 1000}s)…`);
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const v = fs.readFileSync(OTP_FILE, 'utf8').replace(/\D/g, '');
      if (v.length >= 4) { log(`  ✅ OTP recibido: ${v}`); return v; }
    } catch {}
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error('Timeout esperando el OTP');
}

const run = async () => {
  log(`BASE=${BASE}  MODE=${MODE}  DRY=${DRY}`);
  const browser = await chromium.launch({ headless: !HEADED });
  const context = await browser.newContext({
    viewport: { width: 412, height: 915 },
    userAgent: 'Mozilla/5.0 (Linux; Android 12; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Mobile Safari/537.36',
    locale: 'es-CO',
  });
  const page = await context.newPage();

  page.on('console', (m) => {
    const tp = m.type();
    if (tp === 'error') { consoleErrors.push(m.text()); log(`  🔴 console.error: ${m.text().slice(0, 400)}`); }
    else if (tp === 'warning' && /fire|order|pedido|fail|error/i.test(m.text())) log(`  🟡 console.warn: ${m.text().slice(0, 250)}`);
  });
  page.on('pageerror', (e) => { pageErrors.push(String(e)); log(`  💥 pageerror: ${String(e).slice(0, 400)}`); });
  page.on('framenavigated', (f) => { if (f === page.mainFrame()) log(`  ↪️  navigated: ${f.url()}`); });
  page.on('crash', () => log('  ☠️  PAGE CRASHED'));
  page.on('requestfailed', (r) => {
    const u = r.url();
    if (/\.(png|jpg|jpeg|webp|svg|woff2?)($|\?)/.test(u)) return; // ignora assets
    failedReqs.push(`${r.failure()?.errorText} ${u}`);
    log(`  ⚠️  requestfailed: ${r.failure()?.errorText} ${u.slice(0, 160)}`);
  });

  // ─────────────────────────────────────────────────────────────
  step(1, 'Entrar al menú y esperar que cargue el catálogo');
  const t0 = Date.now();
  // --cushion deja una entrada de historial del mismo origen: el flujo de éxito hace un
  // history.back() de más y sin esto, en una pestaña recién abierta, cae en about:blank.
  if (args.cushion) await page.goto(BASE + '?e2e=1', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForFunction(() => window.__roalBooted === true, { timeout: 20000 })
    .then(() => log('  ✅ window.__roalBooted === true'))
    .catch(() => log('  ❌ __roalBooted NUNCA se puso en true (watchdog dispararía)'));

  await page.waitForSelector('.product-card-mobile:not(.skel-card)', { timeout: 25000 });
  const prodCount = await page.locator('.product-card-mobile:not(.skel-card)').count();
  const catCount = await page.locator('.combos-carousel-section').count();
  log(`  ✅ Menú cargado en ${Date.now() - t0}ms — ${catCount} secciones, ${prodCount} productos`);
  const bootFailVisible = await page.locator('#bootFailOverlay:not([hidden])').count();
  log(`  ${bootFailVisible ? '❌' : '✅'} Overlay de rescate ${bootFailVisible ? 'VISIBLE (mal)' : 'oculto (ok)'}`);
  await shot(page, 'menu-cargado');

  // ─────────────────────────────────────────────────────────────
  step(2, 'Agregar un producto al carrito');
  // Elegimos "Salchipapa" (categoría simple, menos ramas de modal)
  const card = page.locator('.product-card-mobile', { hasText: 'Salchipapa' }).first();
  const cardExists = await card.count();
  const targetCard = cardExists ? card : page.locator('.product-card-mobile:not(.skel-card)').first();
  const prodName = (await targetCard.locator('.combo-card-name').first().textContent().catch(() => '')) || '(?)';
  log(`  Producto objetivo: "${prodName.trim()}"`);
  await targetCard.locator('.pcm-add-btn').click();
  await page.waitForTimeout(1500);

  // Cualquier modal de producto (variantes, bebida, combo con papas, opciones de imagen…),
  // se pueden encadenar. El botón de confirmar suele estar deshabilitado hasta elegir
  // sabor/tamaño/etc. → clicamos "opciones" hasta que se habilite.
  const CONFIRM_RE = /^(agregar|añadir|lo quiero|confirmar|continuar|listo|aceptar|añadir al carrito)/i;
  const modalSels = ['#pubVariantesModal', '#pubBebModal', '#pubComboPapasModal', '#pubComboMixtoModal',
    '.image-option-modal', '.support-modal.is-open', '.modal.is-open', '[role="dialog"]'];

  async function visibleModal() {
    for (const s of modalSels) {
      const loc = page.locator(s).filter({ visible: true }).filter({ has: page.locator('button') });
      if (await loc.count()) return loc.first();
    }
    return null;
  }

  for (let round = 1; round <= 4; round++) {
    const modal = await visibleModal();
    if (!modal) { if (round === 1) log('  (Sin modal — el producto se agregó directo)'); break; }
    log(`  Modal de producto (ronda ${round}) — completando…`);
    await shot(page, `modal-${round}`);

    for (let i = 0; i < await modal.locator('select').count(); i++) {
      const s = modal.locator('select').nth(i);
      const v = await s.locator('option').evaluateAll((o) => { const x = o.find((e) => e.value && !e.disabled); return x ? x.value : null; }).catch(() => null);
      if (v) { await s.selectOption(v).catch(() => {}); await page.waitForTimeout(150); }
    }
    const seen = new Set();
    for (let i = 0; i < await modal.locator('input[type="radio"]').count(); i++) {
      const r = modal.locator('input[type="radio"]').nth(i);
      const n = await r.getAttribute('name').catch(() => '');
      if (n && seen.has(n)) continue; if (n) seen.add(n);
      await r.check().catch(() => {});
    }

    const confirm = modal.locator('button').filter({ hasText: CONFIRM_RE }).last();
    const hasConfirm = await confirm.count();
    // Clic en botones de opción (chips) hasta habilitar el confirmar (o agotar intentos)
    let guard = 0;
    while (hasConfirm && !(await confirm.isEnabled().catch(() => false)) && guard < 12) {
      const opts = modal.locator('button:enabled').filter({ hasNotText: CONFIRM_RE })
        .filter({ hasNotText: /^(×|✕|x|cerrar)$/i });
      const n = await opts.count();
      if (!n) break;
      await opts.nth(guard % n).click().catch(() => {});
      await page.waitForTimeout(250);
      guard++;
    }
    if (hasConfirm && await confirm.isEnabled().catch(() => false)) {
      await confirm.click(); log('  ✅ Confirmado');
    } else if (!hasConfirm) {
      const b = modal.locator('button:enabled').filter({ hasNotText: /^(×|✕|x|cerrar)$/i }).last();
      if (await b.count()) { await b.click(); log('  ⚠️ Clic en último botón del modal'); }
    } else {
      log('  ❌ No se pudo habilitar el botón de confirmar del modal');
      await shot(page, `modal-${round}-stuck`);
      const html = await modal.evaluate((el) => el.innerHTML.slice(0, 2000)).catch(() => '');
      log('  DOM: ' + html.replace(/\s+/g, ' ').slice(0, 1200));
      break;
    }
    await page.waitForTimeout(1500);
  }
  await page.keyboard.press('Escape').catch(() => {});
  await page.waitForTimeout(500);

  // ─────────────────────────────────────────────────────────────
  step(3, 'Abrir el carrito y verificar el ítem');
  await page.locator('#topCartBtn').click({ timeout: 15000 });
  await page.waitForTimeout(800);
  await page.waitForSelector('#cartItems', { timeout: 8000 });
  const cartItemsTxt = (await page.locator('#cartItems').textContent().catch(() => '')) || '';
  const cartCount = await page.locator('#cartItems > *').count();
  log(`  Carrito: ${cartCount} bloque(s). Texto: ${cartItemsTxt.replace(/\s+/g, ' ').trim().slice(0, 160)}`);
  await shot(page, 'carrito');
  if (!cartCount) { log('  ❌ Carrito vacío — no se pudo agregar el producto. Abortando.'); await finish(browser, false); return; }

  // ─────────────────────────────────────────────────────────────
  step(4, 'Ir al checkout y llenar datos');
  const avail = await page.evaluate(() => {
    try { return getOrderingAvailability(); } catch (e) { return { err: String(e) }; }
  });
  log(`  getOrderingAvailability(): ${JSON.stringify(avail)}`);
  await page.locator('#cartCheckoutBtn').click();
  await page.waitForTimeout(1500);
  await shot(page, 'post-checkout-click');

  let checkoutVisible = await page.locator('#checkoutCustomerName, #checkoutFulfillmentType').first().isVisible().catch(() => false);
  if (!checkoutVisible) {
    // Puede haber salido el diálogo "estamos cerrados, ¿quieres programar?" — aceptarlo
    const dlgTxt = (await page.locator('body').innerText().catch(() => '')) || '';
    log('  No apareció el checkout directo. Texto en pantalla: ' + dlgTxt.replace(/\s+/g, ' ').trim().slice(0, 300));
    const yes = page.locator('button', { hasText: /programar|s[ií]|continuar|aceptar|ok/i }).first();
    if (await yes.isVisible().catch(() => false)) {
      log('  Aceptando diálogo…');
      await yes.click().catch(() => {});
      await page.waitForTimeout(1500);
      checkoutVisible = await page.locator('#checkoutCustomerName, #checkoutFulfillmentType').first().isVisible().catch(() => false);
    }
  }
  if (!checkoutVisible) {
    await shot(page, 'checkout-no-aparece');
    log('  ❌ El modal de checkout no apareció. Abortando.');
    await finish(browser, false);
    return;
  }
  await page.waitForTimeout(500);

  if (MODE === 'register') {
    step('4a', 'Registro con OTP de WhatsApp');
    // Abrir el modal de registro desde el checkout (banner/botón de invitado)
    const regTriggers = ['#guestRegisterBannerBtn', 'text=Regístrate', 'text=Crear cuenta', 'text=Iniciar sesión'];
    for (const s of regTriggers) {
      const el = page.locator(s).first();
      if (await el.isVisible().catch(() => false)) { await el.click(); break; }
    }
    await page.waitForSelector('#regPhoneInput', { timeout: 8000 });
    await page.fill('#regPhoneInput', PHONE);
    await shot(page, 'reg-telefono');
    await page.locator('#regPhoneNext').click();
    await page.waitForSelector('#regOtpInput', { timeout: 20000 });
    log('  ✅ La Cloud Function sendWhatsAppOtp respondió — paso de OTP visible');
    const otp = await waitOtp();
    await page.fill('#regOtpInput', otp);
    await page.locator('#regOtpVerify').click();
    await page.waitForSelector('#customerRegisterName, #customerRegisterPin', { timeout: 15000 });
    log('  ✅ OTP verificado — paso de nombre + PIN visible');
    await page.fill('#customerRegisterName', NAME);
    await page.fill('#customerRegisterPin', PIN);
    await page.fill('#customerConfirmPin', PIN);
    const policy = page.locator('input[type="checkbox"]').first();
    if (await policy.isVisible().catch(() => false)) await policy.check().catch(() => {});
    await shot(page, 'reg-nombre-pin');
    await page.locator('#customerRegisterSave').click();
    await page.waitForTimeout(2500);
    log('  ✅ Perfil guardado (customerRegisterOrUpdateProfile)');
    await shot(page, 'reg-ok');
  }

  // Nombre (si no hay perfil que lo autocomplete)
  const nameField = page.locator('#checkoutCustomerName');
  if (await nameField.isVisible().catch(() => false) && !(await nameField.inputValue().catch(() => ''))) {
    await nameField.fill(NAME);
  }
  // Recoger en el local (evita mapa/zona de domicilio)
  await page.selectOption('#checkoutFulfillmentType', 'pickup').catch(() => {});
  const phoneField = page.locator('#checkoutCustomerPhone');
  if (await phoneField.isVisible().catch(() => false) && !(await phoneField.inputValue().catch(() => ''))) {
    await phoneField.fill(PHONE);
  }
  await page.waitForTimeout(400);
  await shot(page, 'checkout-lleno');
  const submitBtn = page.locator('#checkoutSubmitButton');
  const submitEnabled = await submitBtn.isEnabled().catch(() => false);
  log(`  Botón "Finalizar pedido" habilitado: ${submitEnabled ? '✅ sí' : '❌ no'}`);
  const feedbackTxt = (await page.locator('#checkoutInfoFeedback').textContent().catch(() => '')) || '';
  if (feedbackTxt.trim()) log(`  Mensaje del checkout: "${feedbackTxt.trim()}"`);

  // ─────────────────────────────────────────────────────────────
  step(5, 'Medio de pago y confirmación');
  await submitBtn.click();
  await page.waitForSelector('#paymentMethodSelect', { timeout: 10000 });
  await page.selectOption('#paymentMethodSelect', 'efectivo').catch(async () => {
    // fallback: primer valor no vacío
    const v = await page.locator('#paymentMethodSelect option').nth(1).getAttribute('value');
    await page.selectOption('#paymentMethodSelect', v);
  });
  await page.waitForTimeout(500);
  if (await page.locator('#paymentCashChoice').isVisible().catch(() => false)) {
    await page.selectOption('#paymentCashChoice', 'completo').catch(() => {});
  }
  await page.waitForTimeout(400);
  await shot(page, 'pago');
  const confirmBtn = page.locator('#paymentFlowModal .support-send-btn');

  if (DRY) {
    const canConfirm = await confirmBtn.isEnabled().catch(() => false);
    log(`  🟡 DRY-RUN: NO se confirma el pedido. Botón "Confirmar pedido" habilitado: ${canConfirm ? '✅ sí' : '❌ no'}`);
    await finish(browser, canConfirm);
    return;
  }

  if (args['freeze-history']) {
    // Diagnóstico: neutraliza el history.back() de más del flujo de éxito para ver si la
    // pantalla de confirmación aparece bien cuando no la tumba la navegación.
    await page.evaluate(() => {
      const orig = history.back.bind(history);
      let n = 0;
      history.back = () => { n++; console.log('[E2E] history.back() suprimido #' + n); };
      window.__restoreBack = () => { history.back = orig; };
    });
    log('  🧪 history.back() congelado para el diagnóstico');
  }
  await confirmBtn.click();
  log('  ⏳ Enviando pedido (submitPublicOrder)…');
  // Sondeo rápido (100 ms) para atrapar la pantalla de confirmación aunque dure poco
  let flashSeen = false;
  for (let i = 0; i < 120; i++) {
    const v = await page.evaluate(() => {
      const s = document.getElementById('orderConfirmScreen');
      return s && !s.hasAttribute('hidden') && s.offsetParent !== null;
    }).catch(() => false);
    if (v) { flashSeen = true; log(`  ⚡ orderConfirmScreen VISIBLE a los ~${i * 100}ms tras confirmar`); break; }
    await page.waitForTimeout(100);
  }
  if (!flashSeen) log('  (orderConfirmScreen no se hizo visible en los primeros 12s)');
  // Señales de éxito: pantalla de confirmación visible, o window.currentOrder con código,
  // o texto de "pedido recibido" en el body.
  let okConfirm = flashSeen, orderCode = '';
  for (let i = 0; i < 40; i++) {
    const st = await page.evaluate(() => {
      const scr = document.getElementById('orderConfirmScreen');
      const visible = scr && !scr.hasAttribute('hidden') && scr.offsetParent !== null;
      return {
        confirmVisible: !!visible,
        confirmText: scr ? (scr.innerText || '').trim() : '',
        currentOrder: window.currentOrder ? { code: window.currentOrder.code, id: window.currentOrder.id, total: window.currentOrder.total } : null,
        pmFeedback: (document.getElementById('paymentFlowFeedback')?.innerText || '').trim(),
        pmModalOpen: !!document.getElementById('paymentFlowModal'),
        bodyHasRecibido: /pedido recibido|pedido confirmado|te confirmamos|pedido #/i.test(document.body.innerText || ''),
      };
    });
    if (st.confirmVisible || st.currentOrder?.code || st.bodyHasRecibido) {
      okConfirm = true;
      orderCode = st.currentOrder?.code || (st.confirmText.match(/#\s*([\w-]+)/) || [])[1] || '';
      log(`  ✅ PEDIDO ENVIADO. code=${orderCode || '(?)'} total=${st.currentOrder?.total ?? '(?)'} confirmScreenVisible=${st.confirmVisible}`);
      log(`  Texto confirmación: ${(st.confirmText || '').replace(/\s+/g, ' ').slice(0, 240)}`);
      break;
    }
    if (st.pmFeedback) { log(`  ⚠️ Feedback del modal de pago: "${st.pmFeedback}"`); }
    await page.waitForTimeout(1000);
  }
  await page.waitForTimeout(500);
  await shot(page, 'confirmacion');
  if (!okConfirm) {
    const dump = await page.evaluate(() => ({
      url: location.href,
      htmlLen: document.documentElement.outerHTML.length,
      bodyChildren: document.body ? document.body.children.length : -1,
      bodyDisplay: document.body ? getComputedStyle(document.body).display : '?',
      bodyVis: document.body ? getComputedStyle(document.body).visibility : '?',
      bodyOpacity: document.body ? getComputedStyle(document.body).opacity : '?',
      screensHidden: [...document.querySelectorAll('[id$="Screen"]')].map((e) => e.id + '=' + (e.hasAttribute('hidden') ? 'hidden' : 'shown')),
      firstIds: [...document.querySelectorAll('body [id]')].slice(0, 20).map((e) => e.id),
      bodyText: (document.body?.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 300),
      bodyHTMLhead: (document.body?.innerHTML || '').replace(/\s+/g, ' ').slice(0, 600),
    }));
    log('  ❌ Sin confirmación. Estado del DOM:');
    log('  ' + JSON.stringify(dump, null, 1).replace(/\n/g, '\n  '));
  }
  await finish(browser, okConfirm);
};

async function finish(browser, ok) {
  log('\n════════ RESUMEN ════════');
  log(`console.error : ${consoleErrors.length}`);
  log(`pageerror     : ${pageErrors.length}`);
  log(`requests fail : ${failedReqs.length}`);
  if (consoleErrors.length) log('  ' + consoleErrors.slice(0, 8).join('\n  '));
  if (pageErrors.length) log('  ' + pageErrors.slice(0, 8).join('\n  '));
  if (failedReqs.length) log('  ' + failedReqs.slice(0, 8).join('\n  '));
  log(`\nRESULTADO: ${ok ? '✅ OK' : '❌ REVISAR'}`);
  await browser.close();
  process.exit(ok ? 0 : 1);
}

run().catch(async (e) => { console.error('FATAL', e); process.exit(2); });
