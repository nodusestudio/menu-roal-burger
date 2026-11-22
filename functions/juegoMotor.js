"use strict";
const N = 8;
const MAX_PUNTOS_JUGADA = 150;
const SHAPES = [
  [[1]],
  [[1, 1]],
  [[1], [1]],
  [[1, 1, 1]],
  [[1], [1], [1]],
  [[1, 1, 1, 1]],
  [[1], [1], [1], [1]],
  [[1, 1], [1, 1]],
  [[1, 1, 1], [1, 1, 1], [1, 1, 1]],
  [[1, 1, 1], [1, 1, 1]],
  [[1, 1], [1, 1], [1, 1]],
  [[1, 0], [1, 1]],
  [[0, 1], [1, 1]],
  [[1, 1], [1, 0]],
  [[1, 1], [0, 1]],
  [[1, 0, 0], [1, 0, 0], [1, 1, 1]],
  [[0, 0, 1], [0, 0, 1], [1, 1, 1]],
  [[1, 1, 1], [1, 0, 0], [1, 0, 0]],
  [[1, 1, 1], [0, 0, 1], [0, 0, 1]],
  [[0, 1, 0], [1, 1, 1]],
  [[1, 1, 1], [0, 1, 0]],
  [[1, 1, 1, 1, 1]],
  [[1], [1], [1], [1], [1]]
];
const INGREDIENTES = ["pan", "carne", "queso", "tequeno", "arepa"];
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
function lineasLlenas(grilla) {
  const filas = [], cols = [];
  for (let i = 0; i < N; i++) if (grilla[i].every((v) => v !== -1)) filas.push(i);
  for (let j = 0; j < N; j++) {
    let ok = true;
    for (let i = 0; i < N; i++) if (grilla[i][j] === -1) {
      ok = false;
      break;
    }
    if (ok) cols.push(j);
  }
  return { filas, cols };
}
function borrarLineas(grilla, l) {
  const borradas = [];
  l.filas.forEach((i) => {
    for (let j = 0; j < N; j++) borradas.push([i, j]);
  });
  l.cols.forEach((j) => {
    for (let i = 0; i < N; i++) borradas.push([i, j]);
  });
  borradas.forEach(([i, j]) => {
    grilla[i][j] = -1;
  });
  return borradas;
}
function hayJugada(grilla, shapes) {
  return shapes.some((s) => {
    for (let r = 0; r <= N - s.length; r++) for (let c = 0; c <= N - s[0].length; c++) if (puedeColocar(grilla, s, r, c)) return true;
    return false;
  });
}
function puntosJugada({ casillas, lineas, combo }) {
  const bonusLineas = lineas > 0 ? Math.round(10 * lineas * (1 + 0.5 * (lineas - 1))) : 0;
  const bonusCombo = lineas > 0 ? 5 * Math.max(0, combo) : 0;
  return Math.min(MAX_PUNTOS_JUGADA, casillas + bonusLineas + bonusCombo);
}
function crearRng(semilla) {
  let a = semilla >>> 0;
  return function() {
    a = a + 1831565813 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function semillaDeTexto(txt) {
  let h = 2166136261;
  const s = String(txt);
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function nuevasPiezas(grilla, rng) {
  const r = rng || Math.random;
  const arma = () => Array.from({ length: 3 }, () => ({ shape: SHAPES[Math.floor(r() * SHAPES.length)], ing: Math.floor(r() * INGREDIENTES.length) }));
  let piezas = arma();
  for (let k = 0; k < 40 && !hayJugada(grilla, piezas.map((p) => p.shape)); k++) piezas = arma();
  return piezas;
}
const codificarJugada = (pieza, fila, col) => pieza * 64 + fila * 8 + col;
const decodificarJugada = (cod) => ({ pieza: Math.floor(cod / 64), fila: Math.floor(cod % 64 / 8), col: cod % 8 });
function reproducirHasta({ semilla, jugadas }) {
  if (!Number.isInteger(semilla) || !Array.isArray(jugadas) || jugadas.length > 2e3) return { ok: false, error: "registro-invalido" };
  const rng = crearRng(semilla);
  const grilla = nuevaGrilla();
  const reparte = () => nuevasPiezas(grilla, rng).map((p) => ({ ...p, usada: false }));
  let piezas = reparte(), puntos = 0, combo = 0, hechas = 0;
  for (const cod of jugadas) {
    if (!Number.isInteger(cod) || cod < 0 || cod > 191) return { ok: false, error: "jugada-invalida" };
    const { pieza, fila, col } = decodificarJugada(cod);
    const p = piezas[pieza];
    if (!p || p.usada) return { ok: false, error: "pieza-no-disponible" };
    if (!puedeColocar(grilla, p.shape, fila, col)) return { ok: false, error: "jugada-imposible" };
    colocar(grilla, p.shape, fila, col, p.ing);
    const l = lineasLlenas(grilla);
    const nLineas = l.filas.length + l.cols.length;
    combo = nLineas > 0 ? combo + 1 : 0;
    puntos += puntosJugada({ casillas: celdas(p.shape), lineas: nLineas, combo: combo - 1 });
    if (nLineas > 0) borrarLineas(grilla, l);
    p.usada = true;
    hechas += 1;
    if (piezas.every((x) => x.usada)) piezas = reparte();
  }
  return { ok: true, grilla, piezas, puntos, combo, hechas, rng };
}
function repetirPartida(args) {
  const e = reproducirHasta(args);
  if (!e.ok) return e;
  const quedan = e.piezas.filter((p) => !p.usada);
  return { ok: true, puntaje: e.puntos, jugadas: e.hechas, terminada: !hayJugada(e.grilla, quedan.map((p) => p.shape)) };
}
module.exports = {
  N,
  SHAPES,
  INGREDIENTES,
  MAX_PUNTOS_JUGADA,
  nuevaGrilla,
  celdas,
  puedeColocar,
  colocar,
  lineasLlenas,
  borrarLineas,
  hayJugada,
  puntosJugada,
  nuevasPiezas,
  crearRng,
  semillaDeTexto,
  codificarJugada,
  decodificarJugada,
  reproducirHasta,
  repetirPartida
};
