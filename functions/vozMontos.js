// Dinero para la VOZ: siempre en pesos colombianos y en palabras («veintisiete mil quinientos pesos»), nunca dígitos sueltos.
// Las voces del sistema leen mal «27500» o «$27.500» (dígito a dígito, en inglés o con el símbolo). Esta función pura se usa en el servidor
// (frase de los avisos de pago) y se COPIA en src/js/admin.js (bloque SYNC:voz-montos); tests/voz-montos.test.js vigila que sean idénticas.

// SYNC:voz-montos:inicio
const _VM_N = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce', 'trece', 'catorce', 'quince',
    'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte', 'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis',
    'veintisiete', 'veintiocho', 'veintinueve'];
const _VM_D = ['', '', '', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
const _VM_C = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];
function _vmBajo100(n) { if (n < 30) return _VM_N[n]; const u = n % 10; return _VM_D[Math.floor(n / 10)] + (u ? ' y ' + _VM_N[u] : ''); }
function _vmMenor1000(n) { if (n === 100) return 'cien'; const c = Math.floor(n / 100), r = n % 100; return (c ? _VM_C[c] : '') + (c && r ? ' ' : '') + (r ? _vmBajo100(r) : ''); }
// «uno» / «veintiuno» al final se vuelven «un» / «veintiún» porque siempre les sigue un sustantivo (pesos, mil, millones).
function _vmApocopa(s) { return s.replace(/veintiuno$/, 'veintiún').replace(/uno$/, 'un'); }
function _vmEntero(n) {
    if (n === 0) return 'cero';
    const partes = [];
    const millones = Math.floor(n / 1e6), resto = n % 1e6, miles = Math.floor(resto / 1000), r = resto % 1000;
    if (millones) partes.push(millones === 1 ? 'un millón' : _vmApocopa(_vmEntero(millones)) + ' millones');
    if (miles) partes.push(miles === 1 ? 'mil' : _vmApocopa(_vmMenor1000(miles)) + ' mil');
    if (r) partes.push(_vmMenor1000(r));
    return partes.join(' ');
}
// 27500 → «veintisiete mil quinientos pesos» · 1 → «un peso» · 2000000 → «dos millones de pesos» · −5000 → «menos cinco mil pesos»
function montoEnPalabras(valor) {
    const n = Math.round(Math.abs(Number(valor) || 0));
    const neg = Number(valor) < 0 && n > 0;
    let txt;
    if (n === 1) txt = 'un peso';
    else if (n === 0) txt = 'cero pesos';
    else txt = _vmApocopa(_vmEntero(n)) + (n % 1e6 === 0 ? ' de pesos' : ' pesos');
    return (neg ? 'menos ' : '') + txt;
}
// Cambia, dentro de un texto, cada cantidad de dinero por sus palabras: «$ 27.500», «$27500», «COP 27.500», «27.500 pesos», «27500 pesos»…
// Solo toca cantidades con signo $ o seguidas de «pesos»/«COP»: no confunde teléfonos, fechas ni códigos de pedido.
function textoParaVoz(texto) {
    const aNum = (s) => Number(String(s).split('.').join(''));
    const signo = (neg) => (neg ? -1 : 1);
    return String(texto == null ? '' : texto)
        // «$ 27.500», «$27500», «COP $ 27.500», «−$ 5.000», «-$5.000», «menos $ 5.000» (con «pesos»/«COP» detrás o sin él)
        .replace(/(\s*)(−\s*|-(?=\$)|menos\s+)?(?:COP\s*)?\$\s*([0-9]{1,3}(?:[.][0-9]{3})+|[0-9]+)(?:,[0-9]{1,2})?(?:\s*(?:pesos|COP))?/gi,
            (m, lead, neg, num) => lead + montoEnPalabras(signo(neg) * aNum(num)))
        // «COP 27.500»
        .replace(/(\s*)(−\s*|menos\s+)?COP\s*([0-9]{1,3}(?:[.][0-9]{3})+|[0-9]+)(?:,[0-9]{1,2})?/gi,
            (m, lead, neg, num) => lead + montoEnPalabras(signo(neg) * aNum(num)))
        // «27.500 pesos», «27500 pesos» (solo si el número tiene separador de miles o 4 o más cifras)
        .replace(/(\s*)(−\s*|menos\s+)?([0-9]{1,3}(?:[.][0-9]{3})+|[0-9]{4,})(?:,[0-9]{1,2})?\s*(?:pesos|COP)(?![A-Za-z])/gi,
            (m, lead, neg, num) => lead + montoEnPalabras(signo(neg) * aNum(num)));
}
// SYNC:voz-montos:fin

module.exports = { montoEnPalabras, textoParaVoz };
