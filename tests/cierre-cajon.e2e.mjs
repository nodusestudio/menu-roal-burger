// Navegador real: el ticket de cierre separa el FONDO del cajón de las VENTAS (con las funciones reales del admin).
//   node tests/cierre-cajon.e2e.mjs
import fs from 'node:fs'; import os from 'node:os'; import http from 'node:http'; import path from 'node:path'; import { fileURLToPath } from 'node:url'; import { chromium } from 'playwright';
const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const js = fs.readFileSync(path.join(raiz, 'src/js/admin.js'), 'utf8');
const corte = (ini, fin) => { const a = js.indexOf(ini); const b = js.indexOf(fin, a + ini.length); if (a < 0 || b < 0) throw new Error('No se encontró ' + ini); return js.slice(a, b); };
const funcion = (nombre) => { const ini = js.indexOf('function ' + nombre + '('); if (ini < 0) throw new Error('no está ' + nombre); const m = /\r?\n}\r?\n/.exec(js.slice(ini)); return js.slice(ini, ini + m.index + m[0].length); };
const SALTO = String.fromCharCode(10);
const codigo = [corte('// SYNC:efectivo-esperado:inicio', '// SYNC:efectivo-esperado:fin'), corte('// SYNC:conteo-cierre:inicio', '// SYNC:conteo-cierre:fin'),
  funcion('_cajonCierreDatos'), funcion('_cajonCierreHtml'), funcion('_conteoCierreHtml'), funcion('_buildCierreTicketHtml')].join(SALTO);
const pagina = '<!doctype html><meta charset="utf-8"><body style="margin:0;background:#0b0f1d;padding:14px"><div id="t" style="max-width:380px;background:#1a1410;border-radius:14px;padding:16px;color:#f0ead8"></div><script>' + `
const formatMoney = (v) => '$ ' + Number(v || 0).toLocaleString('es-CO');
const escapeHtml = (s) => String(s == null ? '' : s);
const findPaymentMethodOrOtro = (k) => ({ efectivo: { icon: '💵', label: 'Efectivo' }, bancolombia: { icon: '🏦', label: 'Bancolombia' } }[k] || { icon: '', label: k });
const brandingState = { restaurantName: 'Roal Burger' };
${codigo}
window.pintar = (c) => { document.getElementById('t').innerHTML = _buildCierreTicketHtml(c, '12 de noviembre de 2026', '10:05 p. m.'); return document.getElementById('t').innerText.replace(/\\s+/g, ' '); };
` + '</scr' + 'ipt>';
const archivo = path.join(raiz, '__cc.html'); fs.writeFileSync(archivo, pagina);
const srv = http.createServer((req, res) => { const f = path.join(raiz, decodeURIComponent(req.url.split('?')[0])); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': 'text/html' }); fs.createReadStream(f).pipe(res); }).listen(0);
const res = []; const ok = (c, m) => res.push((c ? '✅ ' : '❌ ') + m);
const nav = await chromium.launch();
try {
  const p = await nav.newPage({ viewport: { width: 500, height: 900 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('http://localhost:' + srv.address().port + '/__cc.html');
  const base = { aperturaAt: Date.parse('2026-11-12T20:00:00Z'), aperturaBy: 'Johan', fondoInicial: 100000, transactionCount: 12, voidedCount: 0,
    ingresosMethod: { bancolombia: 290500, efectivo: 296000 }, ingresosTotal: 586500, gastosMethod: { efectivo: 37050 }, gastosTotal: 37050, gastosDetalle: [],
    methodTotals: { bancolombia: 290500, efectivo: 258950 }, grandTotal: 549450 };
  const t = await p.evaluate((c) => window.pintar(c), base);
  ok(/EFECTIVO EN EL CAJÓN/.test(t) && /Fondo con que se abrió \(no son ventas\) \$ 100\.000/.test(t), 'CIERRE: bloque «EFECTIVO EN EL CAJÓN» con el fondo marcado «no son ventas» ($ 100.000)');
  ok(/Efectivo de la jornada \(ventas − gastos\) \$ 258\.950/.test(t) && /Debe haber en el cajón \$ 358\.950/.test(t), 'fondo $100.000 + efectivo de la jornada $258.950 = debe haber $358.950');
  ok(/SALDO NETO CAJA ventas − gastos, sin el fondo \$ 549\.450/.test(t), 'el SALDO NETO ($549.450) NO incluye el fondo y lo dice');
  ok(!/Hora apertura[^$]*Fondo inicial/.test(t) && !/Fondo inicial/.test(t), 'el fondo ya no aparece mezclado con los datos de la cabecera');
  ok(/TOTAL INGRESOS \$ 586\.500/.test(t), 'los ingresos (ventas) siguen siendo $586.500: el fondo no suma');
  await p.locator('#t').screenshot({ path: path.join(os.tmpdir(), 'cc-1-ticket.png') });
  const conConteo = await p.evaluate((c) => window.pintar(c), { ...base, efectivoEsperado: 358950, efectivoContado: 356950, diferenciaEfectivo: -2000 });
  ok(/Debe haber en el cajón \$ 358\.950/.test(conConteo) && /Efectivo contado \$ 356\.950/.test(conConteo) && /Faltaron \$ 2\.000/.test(conConteo), 'con conteo: esperado $358.950, contado $356.950, faltaron $2.000');
  const sinFondo = await p.evaluate((c) => window.pintar(c), { ...base, fondoInicial: 0 });
  ok(!/Fondo con que se abrió/.test(sinFondo) && /Debe haber en el cajón \$ 258\.950/.test(sinFondo), 'sin fondo no se muestra esa fila y el esperado es solo el efectivo de la jornada');
  ok(errs.length === 0, 'sin errores de JavaScript' + (errs.length ? ': ' + errs.join(' | ') : ''));
} finally { await nav.close(); srv.close(); fs.unlinkSync(archivo); }
console.log(res.join(SALTO)); if (res.some((r) => r.startsWith('❌'))) process.exit(1);
