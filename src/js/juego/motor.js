'use strict';
/* Block ROAL — MOTOR del juego: una sola fuente para el celular Y para el servidor.
 * Es el reglamento completo: tablero 8x8, piezas, líneas, puntaje y el generador de piezas con semilla (siempre las mismas piezas para una semilla).
 * Se compila con `npm run build` a:
 *   - juega-motor.js            → lo carga el navegador (window.BlockRoalMotor)
 *   - functions/juegoMotor.js   → lo usa el servidor para REPETIR cada partida jugada por jugada y comprobar el puntaje (functions/juego.js)
 * No editar los archivos generados: se cambia este y se corre el build. */

const N = 8;
const MAX_PUNTOS_JUGADA = 150; // tope de puntos por jugada por líneas y combo (el bono de tablero limpio va aparte)
const BONO_TABLERO_LIMPIO = 100; // si tras limpiar líneas el tablero queda completamente vacío
const SHAPES = [
    [[1]], [[1, 1]], [[1], [1]], [[1, 1, 1]], [[1], [1], [1]], [[1, 1, 1, 1]], [[1], [1], [1], [1]],
    [[1, 1], [1, 1]], [[1, 1, 1], [1, 1, 1], [1, 1, 1]], [[1, 1, 1], [1, 1, 1]], [[1, 1], [1, 1], [1, 1]],
    [[1, 0], [1, 1]], [[0, 1], [1, 1]], [[1, 1], [1, 0]], [[1, 1], [0, 1]],
    [[1, 0, 0], [1, 0, 0], [1, 1, 1]], [[0, 0, 1], [0, 0, 1], [1, 1, 1]], [[1, 1, 1], [1, 0, 0], [1, 0, 0]], [[1, 1, 1], [0, 0, 1], [0, 0, 1]],
    [[0, 1, 0], [1, 1, 1]], [[1, 1, 1], [0, 1, 0]], [[1, 1, 1, 1, 1]], [[1], [1], [1], [1], [1]]
];
const INGREDIENTES = ['pan', 'carne', 'queso', 'tequeno', 'arepa'];

const nuevaGrilla = () => Array.from({ length: N }, () => Array(N).fill(-1));
const celdas = (shape) => shape.reduce((s, f) => s + f.reduce((a, v) => a + (v ? 1 : 0), 0), 0);

function puedeColocar(grilla, shape, r, c) {
    if (r < 0 || c < 0 || r + shape.length > N || c + shape[0].length > N) return false;
    for (let i = 0; i < shape.length; i++) for (let j = 0; j < shape[0].length; j++) {
        if (shape[i][j] && grilla[r + i][c + j] !== -1) return false;
    }
    return true;
}
function colocar(grilla, shape, r, c, ing) {
    for (let i = 0; i < shape.length; i++) for (let j = 0; j < shape[0].length; j++) if (shape[i][j]) grilla[r + i][c + j] = ing;
}
// Filas y columnas completas (se calculan antes de borrar, así una fila y una columna que se cruzan se borran juntas).
function lineasLlenas(grilla) {
    const filas = [], cols = [];
    for (let i = 0; i < N; i++) if (grilla[i].every((v) => v !== -1)) filas.push(i);
    for (let j = 0; j < N; j++) { let ok = true; for (let i = 0; i < N; i++) if (grilla[i][j] === -1) { ok = false; break; } if (ok) cols.push(j); }
    return { filas, cols };
}
function borrarLineas(grilla, l) {
    const borradas = [];
    l.filas.forEach((i) => { for (let j = 0; j < N; j++) borradas.push([i, j]); });
    l.cols.forEach((j) => { for (let i = 0; i < N; i++) borradas.push([i, j]); });
    borradas.forEach(([i, j]) => { grilla[i][j] = -1; });
    return borradas;
}
const tableroVacio = (grilla) => grilla.every((f) => f.every((v) => v === -1));
function hayJugada(grilla, shapes) {
    return shapes.some((s) => { for (let r = 0; r <= N - s.length; r++) for (let c = 0; c <= N - s[0].length; c++) if (puedeColocar(grilla, s, r, c)) return true; return false; });
}
// Puntos de una jugada: 1 por casilla colocada + bonus por líneas (10, 30, 60, 100, 150…) + combo (5 por cada jugada seguida que borra). Tope por jugada.
function puntosJugada({ casillas, lineas, combo }) {
    const bonusLineas = lineas > 0 ? Math.round(10 * lineas * (1 + 0.5 * (lineas - 1))) : 0;
    const bonusCombo = lineas > 0 ? 5 * Math.max(0, combo) : 0;
    return Math.min(MAX_PUNTOS_JUGADA, casillas + bonusLineas + bonusCombo);
}

// Generador pseudoaleatorio con semilla (mulberry32): misma semilla = misma secuencia en el celular y en el servidor.
function crearRng(semilla) {
    let a = semilla >>> 0;
    return function () {
        a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
// Semilla de 32 bits a partir de un texto (FNV-1a): sirve para el reto del día ("2026-11-22" → siempre la misma).
function semillaDeTexto(txt) {
    let h = 0x811c9dc5;
    const s = String(txt);
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
    return h >>> 0;
}
// 3 piezas por turno. Intenta que al menos una quepa (evita un "game over" injusto con el tablero a medio llenar).
function nuevasPiezas(grilla, rng) {
    const r = rng || Math.random;
    const arma = () => Array.from({ length: 3 }, () => ({ shape: SHAPES[Math.floor(r() * SHAPES.length)], ing: Math.floor(r() * INGREDIENTES.length) }));
    let piezas = arma();
    for (let k = 0; k < 40 && !hayJugada(grilla, piezas.map((p) => p.shape)); k++) piezas = arma();
    return piezas;
}

// Una jugada = pieza (0-2) + fila + columna, codificada en un solo número 0-191: así el registro de una partida es una lista corta de enteros.
const codificarJugada = (pieza, fila, col) => pieza * 64 + fila * 8 + col;
// Revive: una «jugada» especial (código 192) que solo vale cuando ya no cabe ninguna pieza. Borra las 2 filas más llenas (sin dar puntos) y reparte 3 piezas nuevas.
// Cuántas se permiten lo decide el servidor (maxRevives); el motor solo comprueba que el registro no pase de ese número.
const REVIVE = 192;
function aplicarRevive(grilla, rng) {
    const filas = Array.from({ length: N }, (_, i) => ({ i, n: grilla[i].filter((v) => v !== -1).length })).sort((a, b) => b.n - a.n || a.i - b.i).slice(0, 2).map((f) => f.i).sort((a, b) => a - b);
    filas.forEach((i) => { for (let j = 0; j < N; j++) grilla[i][j] = -1; });
    return { filas, piezas: nuevasPiezas(grilla, rng) };
}
const decodificarJugada = (cod) => ({ pieza: Math.floor(cod / 64), fila: Math.floor((cod % 64) / 8), col: cod % 8 });

// REPRODUCIR una partida: mismas piezas (por la semilla), jugada por jugada, con las mismas reglas. Devuelve el ESTADO final (tablero, piezas, puntos) y el
// generador listo para seguir repartiendo piezas, o el motivo del rechazo. El celular lo usa para reanudar una partida guardada; el servidor, para comprobarla.
// `jugadas` = lista de números de codificarJugada.
function reproducirHasta({ semilla, jugadas, maxRevives }) {
    if (!Number.isInteger(semilla) || !Array.isArray(jugadas) || jugadas.length > 2000) return { ok: false, error: 'registro-invalido' };
    const rng = crearRng(semilla);
    const grilla = nuevaGrilla();
    const reparte = () => nuevasPiezas(grilla, rng).map((p) => ({ ...p, usada: false }));
    let piezas = reparte(), puntos = 0, combo = 0, hechas = 0, revives = 0;
    const stats = { lineas: 0, mejorCombo: 0, tablerosLimpios: 0, dobles: 0 };   // para las misiones del día
    for (const cod of jugadas) {
        if (!Number.isInteger(cod) || cod < 0 || cod > REVIVE) return { ok: false, error: 'jugada-invalida' };
        if (cod === REVIVE) {
            if (revives >= Math.max(0, Math.trunc(Number(maxRevives) || 0))) return { ok: false, error: 'revive-no-permitido' };
            if (hayJugada(grilla, piezas.filter((x) => !x.usada).map((x) => x.shape))) return { ok: false, error: 'revive-innecesario' };
            revives += 1; combo = 0;
            piezas = aplicarRevive(grilla, rng).piezas.map((x) => ({ ...x, usada: false }));
            continue;
        }
        const { pieza, fila, col } = decodificarJugada(cod);
        const p = piezas[pieza];
        if (!p || p.usada) return { ok: false, error: 'pieza-no-disponible' };
        if (!puedeColocar(grilla, p.shape, fila, col)) return { ok: false, error: 'jugada-imposible' };
        colocar(grilla, p.shape, fila, col, p.ing);
        const l = lineasLlenas(grilla);
        const nLineas = l.filas.length + l.cols.length;
        combo = nLineas > 0 ? combo + 1 : 0;
        puntos += puntosJugada({ casillas: celdas(p.shape), lineas: nLineas, combo: combo - 1 });
        if (nLineas > 0) {
            borrarLineas(grilla, l);
            stats.lineas += nLineas; if (nLineas >= 2) stats.dobles += 1; if (combo > stats.mejorCombo) stats.mejorCombo = combo;
            if (tableroVacio(grilla)) { puntos += BONO_TABLERO_LIMPIO; stats.tablerosLimpios += 1; }
        }
        p.usada = true; hechas += 1;
        if (piezas.every((x) => x.usada)) piezas = reparte();
    }
    return { ok: true, grilla, piezas, puntos, combo, hechas, revives, rng, stats };
}
// REPETIR una partida para comprobarla: devuelve el puntaje REAL y si terminó (ya no cabe ninguna pieza).
function repetirPartida(args) {
    const e = reproducirHasta(args);
    if (!e.ok) return e;
    const quedan = e.piezas.filter((p) => !p.usada);
    return { ok: true, puntaje: e.puntos, jugadas: e.hechas, revives: e.revives, terminada: !hayJugada(e.grilla, quedan.map((p) => p.shape)), stats: e.stats };
}

module.exports = {
    N, SHAPES, INGREDIENTES, MAX_PUNTOS_JUGADA, BONO_TABLERO_LIMPIO, tableroVacio, nuevaGrilla, celdas, puedeColocar, colocar, lineasLlenas, borrarLineas, hayJugada, puntosJugada,
    nuevasPiezas, crearRng, semillaDeTexto, codificarJugada, decodificarJugada, REVIVE, aplicarRevive, reproducirHasta, repetirPartida
};
