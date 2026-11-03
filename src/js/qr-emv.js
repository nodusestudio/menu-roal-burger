// Utilidades del QR de pago de Bancolombia / Bre-B (formato EMV de comercio): leer sus campos, verificar su CRC y, SOLO
// como prueba opcional, armar una versión con el valor incluido (campo 54 + CRC nuevo). Sin dependencias; ES2017 para TV viejas.
// Se carga en /tv (RoalQrEmv) y en las pruebas de node.
(function (raiz, fabrica) {
    if (typeof module === 'object' && module.exports) module.exports = fabrica();
    else raiz.RoalQrEmv = fabrica();
})(this, function () {
    'use strict';

    // CRC-16/CCITT-FALSE (polinomio 0x1021, inicio 0xFFFF): el que usa el QR de pagos EMV al final ("6304" + 4 hex)
    function crc16(texto) {
        var c = 0xFFFF;
        for (var i = 0; i < texto.length; i++) {
            c ^= (texto.charCodeAt(i) & 0xFF) << 8;
            for (var b = 0; b < 8; b++) c = (c & 0x8000) ? ((c << 1) ^ 0x1021) & 0xFFFF : (c << 1) & 0xFFFF;
        }
        var h = c.toString(16).toUpperCase();
        return '0000'.slice(h.length) + h;
    }

    /** Lista de campos [{t, v}] del texto del QR; null si la estructura está rota. */
    function leer(payload) {
        var campos = [], i = 0, s = String(payload || '');
        while (i < s.length) {
            if (i + 4 > s.length) return null;
            var t = s.substr(i, 2), l = parseInt(s.substr(i + 2, 2), 10);
            if (!/^\d{2}$/.test(t) || isNaN(l) || i + 4 + l > s.length) return null;
            campos.push({ t: t, v: s.substr(i + 4, l) });
            i += 4 + l;
        }
        return campos;
    }

    /** true si el texto es un QR EMV íntegro: estructura válida y CRC correcto. */
    function esValido(payload) {
        var s = String(payload || '');
        if (s.length < 12 || s.slice(-8, -4) !== '6304') return false;
        return !!leer(s) && crc16(s.slice(0, -4)) === s.slice(-4).toUpperCase();
    }

    function armar(campos) {
        var cuerpo = campos.map(function (c) { return c.t + ('0' + c.v.length).slice(-2) + c.v; }).join('') + '6304';
        return cuerpo + crc16(cuerpo);
    }

    /**
     * PRUEBA: el mismo QR del comercio con el valor incluido. tipo '12' (dinámico) o '11' (se deja como fijo).
     * Devuelve null si el QR original no es válido o el valor no es un entero positivo. El comportamiento depende de cada
     * app bancaria: hay que comprobarlo con un celular antes de usarlo con clientes.
     */
    function conMonto(payload, monto, tipo) {
        var m = Math.round(Number(monto));
        if (!esValido(payload) || !(m > 0)) return null;
        var campos = leer(payload).filter(function (c) { return c.t !== '63' && c.t !== '54'; });
        campos.forEach(function (c) { if (c.t === '01') c.v = tipo === '11' ? '11' : '12'; });
        var i = 0;
        while (i < campos.length && Number(campos[i].t) < 54) i++;
        campos.splice(i, 0, { t: '54', v: String(m) });
        return armar(campos);
    }

    return { crc16: crc16, leer: leer, esValido: esValido, conMonto: conMonto };
});
