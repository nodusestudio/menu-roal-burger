// El panel (src/js/admin.js) decide si una historia preparada sigue sirviendo comparando su "huella"
// con la del día; el servidor (functions/instagramHistorias.js huellaDe) hace la MISMA comparación
// antes de publicar. Si las dos calculan algo distinto, todas las historias saldrían "desactualizadas"
// (o, peor, una desactualizada pasaría). Este test corre el código real del panel en Node y lo
// compara con el del servidor.
//
// No necesita el emulador.

const path = require('node:path');
const fs = require('node:fs');
const vm = require('node:vm');
const { test } = require('node:test');
const assert = require('node:assert/strict');

const SRC = fs.readFileSync(path.join(__dirname, '..', 'src', 'js', 'admin.js'), 'utf8');
const INICIO = SRC.indexOf('// Lo que dibuja cada imagen. IDÉNTICO a huellaDe()');
const FIN = SRC.indexOf('async function _cdPrepararHistoria(');
assert.ok(INICIO > 0 && FIN > INICIO, 'no se encontró el bloque de huellas en admin.js');
const BLOQUE = SRC.slice(INICIO, FIN);

const ig = require(path.join(__dirname, '..', 'functions', 'instagramHistorias.js'));

function panel({ productos = [], config = {}, historias = {} } = {}) {
    const ctx = vm.createContext({
        productsState: productos,
        cdState: { config, historias },
        _cdHora: (ts) => (ts ? '12:00 p. m.' : '')
    });
    vm.runInContext(`${BLOQUE}\nthis._cdHuellaHistoria = _cdHuellaHistoria; this._cdMismaHuella = _cdMismaHuella; this._cdEstadoHistoria = _cdEstadoHistoria;`, ctx);
    return ctx;
}

const DIA = { id: '2026-10-13', productoId: 'bp-plus', productoNombre: 'Burger Plus', precioNormal: 30000, palabra: 'CHAMO27', cupos: 10 };
const PRODUCTO = { id: 'bp-plus', nombre: 'Burger Plus', precio: 30000 };

test('la huella del panel es idéntica a la del servidor (normal y agotado, con y sin producto en el catálogo)', () => {
    const casos = [
        { dia: DIA, producto: PRODUCTO, config: { porcentaje: 30 } },
        { dia: DIA, producto: { ...PRODUCTO, precio: '32000', nombre: ' Burger Plus XL ' }, config: { porcentaje: 25 } },
        { dia: { ...DIA, cupos: '15' }, producto: null, config: { porcentaje: 30 } },
        { dia: { ...DIA, palabra: 'MARIOJOSE', precioNormal: 0 }, producto: { id: 'bp-plus', nombre: 'Burger Plus' }, config: {} }
    ];
    for (const { dia, producto, config } of casos) {
        const p = panel({ productos: producto ? [producto] : [], config });
        for (const tipo of ['normal', 'agotado']) {
            const delPanel = JSON.parse(JSON.stringify(p._cdHuellaHistoria(dia, tipo === 'agotado')));
            const delServidor = ig.huellaDe(tipo, dia, config, producto);
            assert.ok(ig.mismaHuella(delPanel, delServidor), `${tipo}: panel ${JSON.stringify(delPanel)} ≠ servidor ${JSON.stringify(delServidor)}`);
            assert.ok(p._cdMismaHuella(delPanel, delServidor), `${tipo}: la comparación del panel no las iguala`);
        }
    }
});

test('estado por día en el panel: sin preparar, lista, rehacer, error y publicada', () => {
    const huella = (cambio = {}) => ({ palabra: 'CHAMO27', productoId: 'bp-plus', nombre: 'Burger Plus', precioNormal: 30000, cupos: 10, porcentaje: 30, ...cambio });
    const historias = {
        [DIA.id]: {
            normal: { estado: 'lista', huella: huella() },
            agotado: { estado: 'publicada', huella: { productoId: 'bp-plus' }, publicadaAt: { toMillis: () => 1 } }
        }
    };
    const p = panel({ productos: [PRODUCTO], config: { porcentaje: 30 }, historias });
    assert.deepEqual({ ...p._cdEstadoHistoria(DIA, 'normal') }, { clase: 'ok', texto: 'Lista', haceFalta: false });
    const publicada = p._cdEstadoHistoria(DIA, 'agotado');
    assert.equal(publicada.clase, 'ok');
    assert.match(publicada.texto, /^Publicada/);
    assert.equal(publicada.haceFalta, false, 'una publicada no se vuelve a preparar');

    // Cambió la palabra después de preparar → rehacer.
    const cambiado = p._cdEstadoHistoria({ ...DIA, palabra: 'OTRA55' }, 'normal');
    assert.equal(cambiado.clase, 'warn');
    assert.equal(cambiado.haceFalta, true);
    // Otro día sin nada → sin preparar.
    assert.deepEqual({ ...p._cdEstadoHistoria({ ...DIA, id: '2026-10-14' }, 'normal') }, { clase: '', texto: 'Sin preparar', haceFalta: true });
    // Error con la imagen vigente: se muestra el motivo y NO se rehace sola (el servidor reintenta).
    const conError = panel({ productos: [PRODUCTO], config: { porcentaje: 30 }, historias: { [DIA.id]: { normal: { estado: 'error', error: 'Instagram caído', huella: huella() } } } });
    const e = conError._cdEstadoHistoria(DIA, 'normal');
    assert.equal(e.clase, 'err');
    assert.match(e.texto, /Instagram caído/);
    assert.equal(e.haceFalta, false);
    // Error + el día cambió: sí hay que rehacerla.
    assert.equal(conError._cdEstadoHistoria({ ...DIA, cupos: 20 }, 'normal').haceFalta, true);
});
