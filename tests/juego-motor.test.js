// Block ROAL: motor del tablero (colocar, líneas, game over, puntaje). Sin navegador ni emulador:
//   node --test tests/juego-motor.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const M = require('../juega.js');

test('tablero 8x8 vacío; una pieza cabe dentro y no se sale de los bordes', () => {
    const g = M.nuevaGrilla();
    assert.equal(g.length, 8); assert.equal(g[0].length, 8);
    const l3 = [[1, 1, 1]];
    assert.equal(M.puedeColocar(g, l3, 0, 5), true);
    assert.equal(M.puedeColocar(g, l3, 0, 6), false);
    assert.equal(M.puedeColocar(g, l3, -1, 0), false);
    assert.equal(M.puedeColocar(g, l3, 8, 0), false);
});

test('no se puede colocar encima de otra pieza; las celdas vacías de la matriz no estorban', () => {
    const g = M.nuevaGrilla();
    M.colocar(g, [[1]], 3, 3, 2);
    assert.equal(M.puedeColocar(g, [[1, 1]], 3, 2), false);
    assert.equal(M.puedeColocar(g, [[1, 0], [1, 1]], 3, 2), true); // la esquina vacía de la pieza cae sobre la celda ocupada (3,3) y no estorba
});

test('llenar una fila la elimina; una fila y una columna cruzadas se borran juntas', () => {
    const g = M.nuevaGrilla();
    for (let j = 0; j < 7; j++) M.colocar(g, [[1]], 0, j, 0);
    assert.deepEqual(M.lineasLlenas(g), { filas: [], cols: [] });
    M.colocar(g, [[1]], 0, 7, 0);
    const l = M.lineasLlenas(g);
    assert.deepEqual(l.filas, [0]);
    M.borrarLineas(g, l);
    assert.ok(g.every((f) => f.every((v) => v === -1)));

    const h = M.nuevaGrilla();
    for (let k = 0; k < 8; k++) { M.colocar(h, [[1]], 2, k, 1); M.colocar(h, [[1]], k, 5, 1); }
    const l2 = M.lineasLlenas(h);
    assert.deepEqual([l2.filas, l2.cols], [[2], [5]]);
    assert.equal(M.borrarLineas(h, l2).length, 16); // 8 + 8 (el cruce se cuenta dos veces pero se borra una)
    assert.ok(h.every((f) => f.every((v) => v === -1)));
});

test('fin del juego: ninguna pieza cabe', () => {
    const g = M.nuevaGrilla();
    for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) if ((i + j) % 2 === 0) g[i][j] = 0; // ajedrez: no cabe nada de 2+
    assert.equal(M.hayJugada(g, [[[1, 1]], [[1], [1]], [[1, 1], [1, 1]]]), false);
    assert.equal(M.hayJugada(g, [[[1]]]), true);
});

test('puntaje: casillas + bonus por líneas + combo, con tope por jugada que el servidor también exige', () => {
    assert.equal(M.puntosJugada({ casillas: 4, lineas: 0, combo: 0 }), 4);
    assert.equal(M.puntosJugada({ casillas: 4, lineas: 1, combo: 0 }), 14);
    assert.equal(M.puntosJugada({ casillas: 4, lineas: 2, combo: 0 }), 34);
    assert.equal(M.puntosJugada({ casillas: 4, lineas: 2, combo: 3 }), 49);   // combo suma 5 por cada jugada seguida
    assert.equal(M.puntosJugada({ casillas: 9, lineas: 6, combo: 9 }), M.MAX_PUNTOS_JUGADA);
    assert.ok(M.MAX_PUNTOS_JUGADA <= 150, 'debe coincidir con functions/juego.js maxPuntosPorJugada');
});

test('3 piezas por turno, con al menos una jugable cuando el tablero lo permite', () => {
    const g = M.nuevaGrilla();
    for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) g[i][j] = 0;
    g[7][7] = -1; g[7][6] = -1; // solo caben piezas de 1 o 2 en horizontal
    for (let k = 0; k < 30; k++) {
        const p = M.nuevasPiezas(g);
        assert.equal(p.length, 3);
        assert.ok(M.hayJugada(g, p.map((x) => x.shape)));
    }
});

test('cinco ingredientes ROAL', () => {
    assert.deepEqual(M.INGREDIENTES, ['pan', 'carne', 'queso', 'tequeno', 'arepa']);
});
