/* Block ROAL — minijuego estilo Block Blast (Phaser 3). Archivo estático: no pasa por el build.
 * Dos partes:
 *   1) MOTOR puro (cuadrícula, piezas, líneas, puntaje): se prueba en tests/juego-motor.test.js.
 *   2) ESCENA Phaser + conexión con las Cloud Functions (juegoEstado / juegoIniciar / juegoEnviarPuntaje).
 * El navegador solo JUEGA: puntos, rachas, niveles y créditos los decide y guarda el servidor (functions/juego.js).
 */
(function (root) {
    'use strict';

    // ───────────────────────── 1) MOTOR ─────────────────────────
    const N = 8;
    const MAX_PUNTOS_JUGADA = 150; // el servidor rechaza partidas por encima de esto por jugada (config.maxPuntosPorJugada)
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
    function hayJugada(grilla, shapes) {
        return shapes.some((s) => { for (let r = 0; r <= N - s.length; r++) for (let c = 0; c <= N - s[0].length; c++) if (puedeColocar(grilla, s, r, c)) return true; return false; });
    }
    // Puntos de una jugada: 1 por casilla colocada + bonus por líneas (10, 30, 60, 100, 150…) + combo (5 por cada jugada seguida que borra). Tope por jugada.
    function puntosJugada({ casillas, lineas, combo }) {
        const bonusLineas = lineas > 0 ? Math.round(10 * lineas * (1 + 0.5 * (lineas - 1))) : 0;
        const bonusCombo = lineas > 0 ? 5 * Math.max(0, combo) : 0;
        return Math.min(MAX_PUNTOS_JUGADA, casillas + bonusLineas + bonusCombo);
    }
    // 3 piezas por turno. Intenta que al menos una quepa (evita un "game over" injusto con el tablero a medio llenar).
    function nuevasPiezas(grilla, rng) {
        const r = rng || Math.random;
        const arma = () => Array.from({ length: 3 }, () => ({ shape: SHAPES[Math.floor(r() * SHAPES.length)], ing: Math.floor(r() * INGREDIENTES.length) }));
        let piezas = arma();
        for (let k = 0; k < 40 && !hayJugada(grilla, piezas.map((p) => p.shape)); k++) piezas = arma();
        return piezas;
    }

    const Motor = { N, SHAPES, INGREDIENTES, MAX_PUNTOS_JUGADA, nuevaGrilla, celdas, puedeColocar, colocar, lineasLlenas, borrarLineas, hayJugada, puntosJugada, nuevasPiezas };
    if (typeof module !== 'undefined' && module.exports) { module.exports = Motor; return; }
    root.BlockRoalMotor = Motor;
    root.BlockRoalEscena = () => escena; // solo para depurar/probar en el navegador

    // ───────────────────────── 2) SONIDO + ESCENA + SERVIDOR ─────────────────────────
    const $ = (id) => document.getElementById(id);
    const fmt = (n) => Number(n || 0).toLocaleString('es-CO');
    const peso = (n) => '$' + fmt(n);

    // ── Sonido: todo sintetizado con Web Audio (sin archivos). Efectos + música en bucle. ──
    const Sonido = (function () {
        let ctx = null, master = null, sfxG = null, musG = null, timer = null, paso = 0, proxT = 0, corriendo = false;
        let musicaOn = true, sfxOn = true;
        const VOL_MUSICA = 0.4;
        let an = null, drum = null, mus = null, duck = null, comp = null, snareBus = null, leadBus = null, curvaSat = null;
        try { const o = JSON.parse(localStorage.getItem('blockroal_snd') || '{}'); musicaOn = o.m !== false; sfxOn = o.s !== false; } catch (_) { /* sin almacenamiento */ }
        const guardar = () => { try { localStorage.setItem('blockroal_snd', JSON.stringify({ m: musicaOn, s: sfxOn })); } catch (_) { /* nada */ } };
        const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);

        function init(sinMusica) {
            if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
            const AC = window.AudioContext || window.webkitAudioContext;
            if (!AC) return;
            ctx = new AC();
            master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
            sfxG = ctx.createGain(); sfxG.gain.value = sfxOn ? 0.85 : 0; sfxG.connect(master);
            musG = ctx.createGain(); musG.gain.value = musicaOn ? VOL_MUSICA : 0; musG.connect(master);
            an = ctx.createAnalyser(); an.fftSize = 512; master.connect(an);
            armarMezcla();
            if (musicaOn && !sinMusica) iniciarMusica();
        }
        function tono(f, t0, dur, tipo, vol, dest, f2) {
            if (!ctx) return;
            const o = ctx.createOscillator(), g = ctx.createGain();
            o.type = tipo; o.frequency.setValueAtTime(f, t0);
            if (f2) o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t0 + dur);
            g.gain.setValueAtTime(0.0001, t0);
            g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
            g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
            o.connect(g); g.connect(dest); o.start(t0); o.stop(t0 + dur + 0.03);
        }
        function ruido(t0, dur, vol, dest, fc) {
            if (!ctx) return;
            const n = Math.max(1, Math.floor(ctx.sampleRate * dur)), buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
            for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
            const s = ctx.createBufferSource(); s.buffer = buf;
            const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = fc || 6000;
            const g = ctx.createGain(); g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
            s.connect(f); f.connect(g); g.connect(dest); s.start(t0); s.stop(t0 + dur + 0.02);
        }
        // ── Música ORIGINAL: reggaetón urbano a 94 bpm (no es ninguna canción existente). El ritmo dembow es del género, no de nadie; el bajo, los acordes y la melodía son
        // de aquí. Mezcla con bombo de 808, caja con clap y eco, hi-hats con redobles, congas, bajo 808 saturado que se desliza, acordes de sintetizador tipo "stab"
        // (cadencia andaluza La–Sol–Fa–Mi), melodía de campana con eco, compresor y "sidechain" (la mezcla se aparta cuando pega el bombo). Ciclo de 8 compases con
        // arreglo por secciones: base → +acordes → +melodía → redoble y subida antes de volver a empezar.
        const BPM = 94;
        const RAICES = [57, 57, 55, 55, 53, 53, 52, 52];       // La, La, Sol, Sol, Fa, Fa, Mi, Mi
        const TERCERA = [3, 3, 4, 4, 4, 4, 4, 4];               // La menor; Sol, Fa y Mi mayores
        const BAJO_A = [[0, 5, 0], [3, 2, 0], [6, 3, 0], [10, 2, 0], [12, 3, 2]];      // [paso, largo en pasos, subida en semitonos]
        const BAJO_B = [[0, 5, 0], [3, 2, 0], [6, 2, 0], [8, 2, 0], [11, 2, 0], [14, 2, 3]];
        const LEAD_1 = [0, -1, -1, 0, -1, 3, -1, -1, 5, -1, 3, -1, 0, -1, -1, -1];
        const LEAD_2 = [7, -1, -1, 5, -1, 3, -1, -1, 5, -1, 3, -1, 0, -1, -1, -1];
        const LEAD_3 = [7, -1, 5, -1, 3, -1, 0, -1, 3, -1, 0, -1, -1, -1, -1, -1];
        function armarMezcla() {
            comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.knee.value = 12; comp.ratio.value = 4; comp.attack.value = 0.004; comp.release.value = 0.2; comp.connect(musG);
            drum = ctx.createGain(); drum.connect(comp);
            duck = ctx.createGain(); duck.connect(comp);                     // todo lo melódico pasa por aquí: baja cuando pega el bombo
            mus = ctx.createGain(); mus.connect(duck);
            const len = Math.floor(ctx.sampleRate * 1.1), ir = ctx.createBuffer(2, len, ctx.sampleRate);
            for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.4); }
            const rev = ctx.createConvolver(); rev.buffer = ir; const revG = ctx.createGain(); revG.gain.value = 0.55; rev.connect(revG); revG.connect(comp);
            const dly = ctx.createDelay(1); dly.delayTime.value = (60 / BPM) * 0.75; const fb = ctx.createGain(); fb.gain.value = 0.34; dly.connect(fb); fb.connect(dly); const dg = ctx.createGain(); dg.gain.value = 0.3; dly.connect(dg); dg.connect(comp);
            snareBus = ctx.createGain(); snareBus.connect(drum); const sr = ctx.createGain(); sr.gain.value = 0.4; snareBus.connect(sr); sr.connect(rev);
            leadBus = ctx.createGain(); leadBus.connect(duck); const ld = ctx.createGain(); ld.gain.value = 0.7; leadBus.connect(ld); ld.connect(dly); const lr = ctx.createGain(); lr.gain.value = 0.3; leadBus.connect(lr); lr.connect(rev);
            curvaSat = new Float32Array(256); for (let i = 0; i < 256; i++) { const x = i / 128 - 1; curvaSat[i] = Math.tanh(2.4 * x); }
        }
        function bombo(t) {
            tono(150, t, 0.24, 'sine', 1.0, drum, 40); ruido(t, 0.012, 0.35, drum, 2500);
            duck.gain.cancelScheduledValues(t); duck.gain.setValueAtTime(0.28, t); duck.gain.linearRampToValueAtTime(1, t + 0.2);
        }
        function caja(t, fuerte) { [0, 0.011, 0.022].forEach((o) => ruido(t + o, 0.08, fuerte ? 0.5 : 0.3, snareBus, 1400)); tono(210, t, 0.1, 'triangle', fuerte ? 0.4 : 0.22, snareBus, 150); }
        function bajo808(t, f, dur, subida) {
            const o = ctx.createOscillator(), ws = ctx.createWaveShaper(), g = ctx.createGain();
            ws.curve = curvaSat; o.type = 'sine';
            o.frequency.setValueAtTime(f * 1.7, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.035);
            if (subida) o.frequency.setValueAtTime(f, t + dur * 0.62), o.frequency.exponentialRampToValueAtTime(f * Math.pow(2, subida / 12), t + dur);
            g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.9, t + 0.01); g.gain.setValueAtTime(0.9, t + dur * 0.6); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
            o.connect(ws); ws.connect(g); g.connect(mus); o.start(t); o.stop(t + dur + 0.05);
        }
        function acorde(t, notas, dur) {
            notas.forEach((m) => {
                const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
                o.type = 'sawtooth'; o.frequency.value = hz(m); f.type = 'lowpass'; f.Q.value = 3; f.frequency.setValueAtTime(3400, t); f.frequency.exponentialRampToValueAtTime(520, t + dur);
                g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.07, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
                o.connect(f); f.connect(g); g.connect(mus); o.start(t); o.stop(t + dur + 0.03);
            });
        }
        function campana(t, f, dur) {
            [['triangle', f, 0.2], ['sine', f * 2.005, 0.1]].forEach(([tipo, fr, v]) => {
                const o = ctx.createOscillator(), g = ctx.createGain(); o.type = tipo; o.frequency.value = fr;
                g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
                o.connect(g); g.connect(leadBus); o.start(t); o.stop(t + dur + 0.03);
            });
        }
        function subida(t, dur) { // ruido que sube antes de volver a empezar
            const n = Math.floor(ctx.sampleRate * dur), buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
            for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
            const s2 = ctx.createBufferSource(); s2.buffer = buf; const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.setValueAtTime(600, t); f.frequency.exponentialRampToValueAtTime(9000, t + dur);
            const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.32, t + dur * 0.95); g.gain.linearRampToValueAtTime(0, t + dur);
            s2.connect(f); f.connect(g); g.connect(drum); s2.start(t); s2.stop(t + dur + 0.02);
        }
        function agendar() {
            if (!ctx || !corriendo || !drum) return;
            const tp = 60 / BPM / 4;
            while (proxT < ctx.currentTime + 0.25) {
                const compas = Math.floor(paso / 16) % 8, k = paso % 16, raiz = RAICES[compas], t = proxT;
                const ultimo = compas === 7, relleno = (compas === 3 || ultimo) && k >= 12;
                if (ultimo && k === 0) subida(t, tp * 16);
                if (!(ultimo && k === 15)) {                                                               // el último paso del ciclo queda en silencio (el "respiro")
                    if (k % 4 === 0 && !(ultimo && k >= 12)) bombo(t);                                     // bombo en cada tiempo
                    if (relleno) caja(t, k >= 14); else if (k === 3 || k === 6 || k === 11 || k === 14) caja(t, k === 6 || k === 14); // dembow 3-3-2 (y redoble en los rellenos)
                    if (k === 14 && compas % 2 === 1 && !ultimo) ruido(t, 0.2, 0.15, drum, 7000);          // hi-hat abierto
                    else if (k % 2 === 0 || (k % 4 === 3)) ruido(t, 0.03, k % 4 === 2 ? 0.2 : 0.11, drum, 8500); // hi-hats en 8vos + contratiempos
                    if (k === 5 || k === 9 || k === 13) tono(k === 9 ? 280 : 190, t, 0.12, 'sine', 0.3, drum, k === 9 ? 205 : 130);       // congas
                    (compas % 2 ? BAJO_B : BAJO_A).forEach(([p, l, sub]) => { if (p === k) bajo808(t, hz(raiz - 24), tp * l * 0.95, sub); }); // bajo 808
                    if (compas >= 2 && (k === 0 || k === 3 || k === 6 || k === 10)) acorde(t, [raiz + 12, raiz + 12 + TERCERA[compas], raiz + 19], tp * 1.6);  // acordes "stab"
                    if (compas >= 4) { const m = [LEAD_1, LEAD_2, LEAD_1, LEAD_3][compas - 4][k]; if (m >= 0) campana(t, hz(69 + m), tp * 3.2); } // melodía de campana
                }
                proxT += tp; paso++;
            }
        }
        function iniciarMusica() {
            if (!ctx || corriendo) return;
            corriendo = true; proxT = ctx.currentTime + 0.05; paso = 0;
            timer = setInterval(agendar, 60);
        }
        function detenerMusica() { corriendo = false; if (timer) { clearInterval(timer); timer = null; } }
        document.addEventListener('visibilitychange', () => {
            if (!ctx) return;
            if (document.hidden) { detenerMusica(); ctx.suspend(); } else { ctx.resume(); if (musicaOn) iniciarMusica(); }
        });

        const S = {
            init,
            // ¿Se pudo activar el audio sin un toque dentro de esta página? (sí, si el juego se abrió desde el toque en «Juega» del menú)
            async desbloquear() { init(true); if (!ctx) return false; try { await Promise.race([ctx.resume(), new Promise((r) => setTimeout(r, 350))]); } catch (_) { /* sigue suspendido */ } return ctx.state === 'running'; },
            arrancarMusica() { if (musicaOn) iniciarMusica(); },
            get estadoAudio() { return ctx ? ctx.state : 'sin-iniciar'; }, get pico() { if (!an) return 0; const d = new Uint8Array(an.fftSize); an.getByteTimeDomainData(d); let m = 0; for (const v of d) m = Math.max(m, Math.abs(v - 128)); return m / 128; }, get musicaCorriendo() { return corriendo; },
            get musicaOn() { return musicaOn; }, get sfxOn() { return sfxOn; },
            setMusica(v) { musicaOn = !!v; guardar(); if (musG) musG.gain.value = musicaOn ? VOL_MUSICA : 0; if (musicaOn) iniciarMusica(); else detenerMusica(); },
            setSfx(v) { sfxOn = !!v; guardar(); if (sfxG) sfxG.gain.value = sfxOn ? 0.85 : 0; },
            tomar() { if (!ctx) return; const t = ctx.currentTime; tono(520, t, 0.09, 'square', 0.22, sfxG, 880); },
            invalido() { if (!ctx) return; const t = ctx.currentTime; tono(180, t, 0.2, 'sawtooth', 0.28, sfxG, 70); },
            colocar() { if (!ctx) return; const t = ctx.currentTime; tono(120, t, 0.18, 'sine', 0.85, sfxG, 48); ruido(t, 0.09, 0.32, sfxG, 900); }, // bloque de cemento asentándose
            limpiar(lineas, combo) {
                if (!ctx) return; const t = ctx.currentTime, esc = [0, 4, 7, 12, 16, 19, 24, 28], n = Math.min(esc.length, 3 + lineas * 2), base = 72 + Math.min(combo, 6);
                for (let i = 0; i < n; i++) tono(hz(base + esc[i]), t + i * 0.055, 0.22, i % 2 ? 'triangle' : 'square', 0.3, sfxG);
                ruido(t, 0.55, 0.32, sfxG, 4500); // spray
                if (combo > 1) for (let i = 0; i < 4; i++) tono(hz(base + 36 + i * 4), t + n * 0.055 + i * 0.05, 0.25, 'sine', 0.28, sfxG);
            },
            nivel() {
                if (!ctx) return; const t = ctx.currentTime;
                [0, 4, 7, 12, 16, 19, 24].forEach((s, i) => tono(hz(72 + s), t + i * 0.09, 0.4, 'square', 0.26, sfxG));
                [0, 4, 7, 12].forEach((s) => tono(hz(60 + s), t + 0.7, 0.9, 'triangle', 0.3, sfxG));
            },
            fin() {
                if (!ctx) return; const t = ctx.currentTime;
                [67, 64, 60, 55].forEach((m, i) => tono(hz(m), t + i * 0.2, 0.34, 'sawtooth', 0.26, sfxG, hz(m) * 0.92));
                tono(80, t + 0.85, 0.7, 'sine', 0.6, sfxG, 40);
            },
            monedas() { if (!ctx) return; const t = ctx.currentTime; tono(hz(88), t, 0.12, 'square', 0.22, sfxG); tono(hz(95), t + 0.1, 0.4, 'square', 0.22, sfxG); },
            clic() { if (!ctx) return; tono(700, ctx.currentTime, 0.06, 'triangle', 0.25, sfxG, 1000); },
            warp() { // llegada al barrio: murmullo de calle, carro y moto que pasan, pitos, tres rociadas de spray y caída de 808 con rasgueo de cuatro
                if (!ctx) return; const t = ctx.currentTime;
                const banda = (t0, dur, vol, tipo, f0, f1, q) => {
                    const n = Math.floor(ctx.sampleRate * dur), buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
                    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
                    const s = ctx.createBufferSource(); s.buffer = buf; const f = ctx.createBiquadFilter(); f.type = tipo; f.Q.value = q || 1;
                    f.frequency.setValueAtTime(f0, t0); f.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
                    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + dur * 0.45); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
                    s.connect(f); f.connect(g); g.connect(sfxG); s.start(t0); s.stop(t0 + dur + 0.02);
                };
                banda(t, 3.0, 0.16, 'lowpass', 300, 700, 0.7);                       // murmullo del barrio
                banda(t + 0.2, 1.7, 0.5, 'bandpass', 250, 1100, 2.5);                // carro que se acerca…
                banda(t + 1.2, 1.4, 0.4, 'bandpass', 1100, 220, 2.5);                // …y se aleja (efecto Doppler)
                tono(70, t + 0.2, 2.2, 'sawtooth', 0.12, sfxG, 130); tono(130, t + 1.4, 1.2, 'sawtooth', 0.1, sfxG, 70);   // motor
                tono(hz(93), t + 0.5, 0.45, 'sawtooth', 0.05, sfxG, hz(100));        // moto a lo lejos
                [[0.9, 0.14], [1.12, 0.22]].forEach(([d, l]) => { tono(hz(81), t + d, l, 'square', 0.15, sfxG); tono(hz(85), t + d, l, 'square', 0.13, sfxG); }); // pito pi-piii
                [1.7, 2.0, 2.3].forEach((d, i) => ruido(t + d, 0.28, 0.32, sfxG, 3500 + i * 1200));                    // spray
                tono(48, t + 2.6, 0.9, 'sine', 0.95, sfxG, 30); ruido(t + 2.6, 0.25, 0.4, sfxG, 600);                  // caída de 808
                [0, 3, 7, 12, 15].forEach((s2, i) => tono(hz(57 + s2), t + 2.6 + i * 0.03, 1.2, 'sawtooth', 0.09, sfxG));
                [0, 7, 12, 19].forEach((s2, i) => tono(hz(69 + s2), t + 2.95 + i * 0.12, 0.5, 'triangle', 0.2, sfxG));
            }
        };
        return S;
    })();

    root.BlockRoalSonido = Sonido; // solo para depurar/probar en el navegador

    // ── Estado / servidor ──
    let estado = null;        // lo que devuelve juegoEstado (el servidor manda)
    let funciones = null;
    let juego = null;         // instancia Phaser
    let sesionId = null;
    let sesionPromesa = Promise.resolve();
    let escena = null;

    function mostrarEstado() {
        if (!estado) return;
        $('stNivel').textContent = estado.nivelMax + 1;
        $('stMeta').textContent = fmt(estado.metaSiguiente);
        $('stRacha').textContent = estado.racha;
        $('stCredito').textContent = peso(estado.creditoJuego);
        $('stHoy').textContent = `${fmt(estado.puntosHoy)} / ${fmt(estado.topeDiario)}`;
        $('stBonus').textContent = Object.keys(estado.rachaBonus || {}).map((d) => `${d}d +${estado.rachaBonus[d]}`).join(' · ');
        const cr = $('stCredito'); cr.style.fontSize = cr.textContent.length > 7 ? '34px' : (cr.textContent.length > 5 ? '44px' : '');
    }
    async function cargarEstado() {
        const r = await funciones.httpsCallable('juegoEstado')({});
        estado = r.data;
        mostrarEstado();
        return estado;
    }
    function aviso(msg, esError) { const e = $('avisoJuego'); e.textContent = msg || ''; e.className = 'aviso' + (esError ? ' err' : ''); e.hidden = !msg; }

    function iniciarPartida() {
        sesionId = null;
        sesionPromesa = (async () => {
            try { const r = await funciones.httpsCallable('juegoIniciar')({}); sesionId = r.data.sesionId; aviso(''); }
            catch (e) { aviso(e?.message || 'No se pudo iniciar la partida.', true); }
        })();
        return sesionPromesa;
    }

    async function terminarPartida(puntaje, jugadas) {
        const panel = $('resultado');
        panel.hidden = false;
        $('resTitulo').textContent = root.BlockRoalTema.FRASES.fin;
        $('resPuntaje').textContent = fmt(puntaje) + ' pts';
        $('resDetalle').textContent = 'Guardando tus puntos…';
        $('btnOtra').disabled = true;
        try {
            if (!sesionId) await sesionPromesa;
            if (!sesionId) throw new Error('La partida no se pudo registrar. Intenta de nuevo.');
            const r = await funciones.httpsCallable('juegoEnviarPuntaje')({ sesionId, puntaje, jugadas });
            if (!r.data.ok) { $('resDetalle').textContent = 'Esta partida no se pudo validar, así que no suma puntos.'; }
            else {
                estado = r.data.estado; mostrarEstado();
                const x = r.data.resultado, partes = [];
                partes.push(x.puntosOtorgados > 0 ? `+${fmt(x.puntosOtorgados)} puntos ROAL` : 'Hoy ya llegaste al tope de puntos');
                if (x.topeAlcanzado && x.puntosOtorgados > 0) partes.push('(llegaste al tope diario)');
                if (x.bonusRacha > 0) partes.push(`🔥 Bonus de racha +${x.bonusRacha}`);
                if (x.nivelSuperado) { $('resTitulo').textContent = root.BlockRoalTema.FRASES.nivel; partes.push(root.BlockRoalTema.FRASES.nivelDetalle(estado.nivelMax + 1)); Sonido.nivel(); if (escena) escena.confeti(); }
                else if (x.creditoGanado > 0) Sonido.monedas();
                if (x.creditoGanado > 0) partes.push(`Ganaste ${peso(x.creditoGanado)} en créditos ROAL`);
                $('resDetalle').textContent = partes.join('\n');
            }
        } catch (e) { $('resDetalle').textContent = e?.message || 'No se pudieron guardar tus puntos.'; }
        $('btnOtra').disabled = false;
    }

    function crearJuego() {
        const T = root.BlockRoalTema;                       // tema visual (juega-tema.js): aquí no se dibuja nada propio
        // GEOMETRÍA del tablero (no cambiar sin autorización): 8x8 casillas de 40 px. El lienzo (360x468) cubre el tablero y la bandeja de piezas.
        // CX_BANDEJA = centro de cada una de las 3 ranuras de piezas.
        const W = 360, H = 468, CELDA = 40, GX = 20, GY = 10, BANDEJA_Y = 340;
        const CX_BANDEJA = [60, 180, 300];
        const d = { W, H, CELDA, GX, GY, N, BANDEJA_Y, CX_BANDEJA, INGREDIENTES };
        const PAL = T.PAL;

        class Escena extends Phaser.Scene {
            preload() { T.cargar(this); }
            create() {
                escena = this;
                T.texturas(this, d);
                T.fondo(this, d);
                T.tablero(this, d);
                this.borde = this.add.graphics().setDepth(4);                      // marco animado (T.marco lo redibuja en update)
                this.celdasImg = Array.from({ length: N }, () => Array(N).fill(null));
                const cab = T.cabecera(this, d); this.txtPuntos = cab.puntos; this.txtMeta = cab.meta;
                this.fantasma = this.add.graphics().setDepth(7);
                this.emisores = INGREDIENTES.map((n) => this.add.particles(0, 0, 'chispa', { speed: { min: 90, max: 300 }, angle: { min: 0, max: 360 }, scale: { start: 1, end: 0 }, lifespan: { min: 350, max: 750 }, gravityY: 380, tint: PAL[n], blendMode: 'ADD', emitting: false }).setDepth(30));
                this.polvo = this.add.particles(0, 0, 'chispa', { speed: { min: 30, max: 120 }, angle: { min: 0, max: 360 }, scale: { start: 0.9, end: 0 }, alpha: { start: 0.8, end: 0 }, lifespan: { min: 300, max: 600 }, tint: 0xd8d4cc, emitting: false }).setDepth(29);
                this.arcoiris = this.add.particles(0, 0, 'chispa', { speed: { min: 120, max: 420 }, angle: { min: 200, max: 340 }, scale: { start: 1.4, end: 0 }, lifespan: 1400, gravityY: 500, tint: T.CONFETI, blendMode: 'ADD', emitting: false }).setDepth(31);
                this.input.on('pointermove', (p) => this.arrastrar(p));
                this.input.on('pointerup', () => this.soltar());
                this.input.on('pointerupoutside', () => this.soltar());
                this.nueva();
            }
            update(time, delta) {
                if (this.arrastrando && this.objetivo) { // la pieza sigue al dedo con suavidad (pegada, sin saltos)
                    const k = Math.min(1, 0.5 * ((delta || 16.6) / 16.6)), cn = this.arrastrando.cont;
                    cn.x += (this.objetivo.x - cn.x) * k; cn.y += (this.objetivo.y - cn.y) * k;
                }
                T.marco(this.borde, time, d);
            }
            nueva() {
                this.grilla = nuevaGrilla();
                this.puntos = 0; this.jugadas = 0; this.combo = 0; this.fin = false;
                this.celdasImg.forEach((f) => f.forEach((im) => im && im.destroy()));
                this.celdasImg = Array.from({ length: N }, () => Array(N).fill(null));
                (this.piezas || []).forEach((p) => { if (p) { p.cont.destroy(); if (p.zona) p.zona.destroy(); } });
                this.txtPuntos.setText('0');
                this.actualizarMeta();
                this.repartir();
            }
            actualizarMeta() {
                const meta = estado ? estado.metaSiguiente : 500;
                if (this.txtMeta.progreso) this.txtMeta.progreso(this.puntos, meta, estado ? estado.nivelMax + 1 : 1);
            }
            repartir() {
                const datos = nuevasPiezas(this.grilla);
                this.piezas = datos.map((dd, i) => this.crearPieza(dd, i));
                this.piezas.forEach((p, i) => { p.cont.setAlpha(0).setScale(0.2); this.tweens.add({ targets: p.cont, alpha: 1, scale: p.home.esc, duration: 320, delay: i * 90, ease: 'Back.Out', onComplete: () => this.flotar(p) }); });
                if (!hayJugada(this.grilla, this.piezas.map((p) => p.shape))) this.terminar();
            }
            flotar(p) {
                if (p.usada || !p.cont.active) return;
                p.flota = this.tweens.add({ targets: p.cont, y: p.home.y - 5, duration: 900 + Math.random() * 400, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
            }
            crearPieza(dd, idx) {
                const ancho = dd.shape[0].length * CELDA, alto = dd.shape.length * CELDA;
                const esc = Math.min(0.75, 100 / ancho, 90 / alto); // lo más grande que cabe en la ranura
                const cx = CX_BANDEJA[idx];
                const cont = this.add.container(cx - (ancho * esc) / 2, BANDEJA_Y + 60 - (alto * esc) / 2).setScale(esc).setDepth(8);
                for (let i = 0; i < dd.shape.length; i++) for (let j = 0; j < dd.shape[0].length; j++) {
                    if (dd.shape[i][j]) cont.add(this.add.image(j * CELDA + (CELDA - 3) / 2, i * CELDA + (CELDA - 3) / 2, 'ing_' + INGREDIENTES[dd.ing]));
                }
                // Zona de toque propia, centrada en la ranura de la bandeja y generosa (116x136): se agarra desde cualquier parte, sin importar la forma.
                const zona = this.add.zone(cx, BANDEJA_Y + 60, 120, 112).setInteractive();
                const pieza = { cont, zona, shape: dd.shape, ing: dd.ing, usada: false, home: { x: cont.x, y: cont.y, esc }, ancho, alto };
                zona.on('pointerdown', (p) => {
                    if (this.fin || pieza.usada || this.arrastrando) return;
                    Sonido.init(); Sonido.tomar();
                    if (navigator.vibrate) try { navigator.vibrate(18); } catch (_) { /* sin vibración */ }
                    if (pieza.flota) { pieza.flota.stop(); pieza.flota = null; }
                    this.arrastrando = pieza; this.ultCelda = '';
                    // "Se pega al dedo": crece con rebote, deja un anillo de luz y la sigue con suavidad.
                    this.tweens.killTweensOf(cont);
                    cont.setDepth(10);
                    this.tweens.add({ targets: cont, scale: 1, duration: 150, ease: 'Back.Out' });
                    const anillo = this.add.circle(p.x, p.y, 10, 0xffffff, 0).setStrokeStyle(3, PAL[INGREDIENTES[pieza.ing]], 1).setDepth(9);
                    this.tweens.add({ targets: anillo, radius: 46, alpha: 0, duration: 360, onComplete: () => anillo.destroy() });
                    this.arrastrar(p);
                });
                return pieza;
            }
            posicionSobreGrilla(p, pieza) {
                // La pieza se dibuja arriba del dedo para no taparla; la celda destino sale de la esquina superior izquierda.
                const x = p.x - pieza.ancho / 2, y = p.y - pieza.alto / 2 - 64;
                return { x, y, c: Math.round((x - GX) / CELDA), r: Math.round((y - GY) / CELDA) };
            }
            arrastrar(p) {
                const pz = this.arrastrando; if (!pz) return;
                const pos = this.posicionSobreGrilla(p, pz);
                this.objetivo = { x: pos.x, y: pos.y };
                this.fantasma.clear();
                if (puedeColocar(this.grilla, pz.shape, pos.r, pos.c)) {
                    const clave = pos.r + ',' + pos.c;
                    if (clave !== this.ultCelda) { this.ultCelda = clave; if (navigator.vibrate) try { navigator.vibrate(6); } catch (_) { /* sin vibración */ } }
                    this.fantasma.fillStyle(PAL[INGREDIENTES[pz.ing]], 0.4);
                    for (let i = 0; i < pz.shape.length; i++) for (let j = 0; j < pz.shape[0].length; j++) if (pz.shape[i][j]) this.fantasma.fillRoundedRect(GX + (pos.c + j) * CELDA, GY + (pos.r + i) * CELDA, CELDA - 3, CELDA - 3, 7);
                }
            }
            soltar() {
                const pz = this.arrastrando; if (!pz) return;
                this.arrastrando = null; this.fantasma.clear();
                const ob = this.objetivo || { x: pz.cont.x, y: pz.cont.y };
                const c = Math.round((ob.x - GX) / CELDA), r = Math.round((ob.y - GY) / CELDA);
                if (!puedeColocar(this.grilla, pz.shape, r, c)) {
                    Sonido.invalido();
                    this.tweens.add({ targets: pz.cont, x: pz.home.x, y: pz.home.y, scale: pz.home.esc, duration: 220, ease: 'Back.Out', onComplete: () => this.flotar(pz) });
                    pz.cont.setDepth(8); return;
                }
                this.aplicar(pz, r, c);
            }
            pintarCelda(i, j, ing) {
                const im = this.add.image(GX + j * CELDA + CELDA / 2, GY + i * CELDA + CELDA / 2, 'ing_' + INGREDIENTES[ing]).setScale(0.4).setDepth(6);
                this.tweens.add({ targets: im, scale: 1, duration: 230, ease: 'Back.Out' });
                this.celdasImg[i][j] = im; return im;
            }
            aplicar(pz, r, c) {
                colocar(this.grilla, pz.shape, r, c, pz.ing);
                for (let i = 0; i < pz.shape.length; i++) for (let j = 0; j < pz.shape[0].length; j++) if (pz.shape[i][j]) {
                    this.pintarCelda(r + i, c + j, pz.ing);
                    this.polvo.explode(3, GX + (c + j) * CELDA + CELDA / 2, GY + (r + i) * CELDA + CELDA / 2);
                }
                pz.usada = true; pz.cont.destroy(); if (pz.zona) pz.zona.destroy();
                const l = lineasLlenas(this.grilla);
                const nLineas = l.filas.length + l.cols.length;
                if (nLineas > 0) this.combo += 1; else this.combo = 0;
                const gan = puntosJugada({ casillas: celdas(pz.shape), lineas: nLineas, combo: this.combo - 1 });
                this.puntos += gan; this.jugadas += 1;
                if (nLineas > 0) {
                    Sonido.limpiar(nLineas, this.combo);
                    borrarLineas(this.grilla, l).forEach(([i, j]) => {
                        const im = this.celdasImg[i][j]; if (!im) return;
                        this.celdasImg[i][j] = null;
                        const x = im.x, y = im.y, ing = INGREDIENTES.findIndex((n) => im.texture.key === 'ing_' + n);
                        im.setTintFill(0xffffff);
                        this.emisores[Math.max(0, ing)].explode(7, x, y);
                        this.tweens.add({ targets: im, alpha: 0, scale: 1.7, angle: Phaser.Math.Between(-40, 40), duration: 300, delay: Phaser.Math.Between(0, 120), onComplete: () => im.destroy() });
                    });
                    this.cameras.main.shake(140 + nLineas * 40, Math.min(0.012, 0.0035 * nLineas));
                    if (this.combo > 1 || nLineas > 1) this.cameras.main.flash(140, 255, 255, 255, true);
                    const col = T.COLORES_POPUP[this.combo % T.COLORES_POPUP.length];
                    const frase = this.combo > 1 ? T.FRASES.combo(this.combo) : (nLineas > 2 ? T.FRASES.triple : (nLineas > 1 ? T.FRASES.doble : ''));
                    const t = this.add.text(W / 2, GY + (N * CELDA) / 2, `${frase}${frase ? '\n' : ''}+${gan}`, { ...T.estiloPopup(!!frase), color: col }).setOrigin(0.5).setDepth(40).setScale(0.3);
                    t.setShadow(3, 3, '#fb4b08', 0, true, true);
                    this.tweens.add({ targets: t, scale: 1.25, duration: 220, ease: 'Back.Out' });
                    this.tweens.add({ targets: t, y: t.y - 70, alpha: 0, duration: 800, delay: 450, onComplete: () => t.destroy() });
                    if (navigator.vibrate) try { navigator.vibrate(30 + nLineas * 10); } catch (_) { /* sin vibración */ }
                } else Sonido.colocar();
                this.txtPuntos.setText(fmt(this.puntos));
                if (this.txtPuntos.pulso) this.txtPuntos.pulso();
                this.actualizarMeta();
                const quedan = this.piezas.filter((p) => !p.usada);
                if (!quedan.length) this.repartir();
                else if (!hayJugada(this.grilla, quedan.map((p) => p.shape))) this.terminar();
            }
            confeti() {
                for (let k = 0; k < 5; k++) this.time.delayedCall(k * 160, () => this.arcoiris.explode(40, Phaser.Math.Between(40, W - 40), H * 0.55));
            }
            terminar() {
                if (this.fin) return;
                this.fin = true;
                Sonido.fin();
                this.cameras.main.shake(350, 0.008);
                this.tweens.add({ targets: this.celdasImg.flat().filter(Boolean), alpha: 0.35, duration: 500 });
                terminarPartida(this.puntos, this.jugadas);
            }
        }

        juego = new Phaser.Game({
            type: Phaser.AUTO, parent: 'juegoCanvas', width: W, height: H, transparent: true,
            scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
            input: { touch: { capture: true } }, scene: Escena, render: { antialias: true }
        });
    }

    async function jugarOtra() {
        Sonido.clic();
        $('resultado').hidden = true;
        await iniciarPartida();
        if (estado) { try { await cargarEstado(); } catch (_) { /* se queda con el estado anterior */ } }
        if (escena) escena.nueva();
    }

    function pintarBotonesSonido() {
        const on = Sonido.musicaOn || Sonido.sfxOn;
        $('btnSonido').classList.toggle('off', !on);
        $('btnSonido').textContent = on ? '🔊' : '🔇';
        $('btnSonido').setAttribute('aria-pressed', String(on));
    }

    const PHASER_URL = 'https://cdn.jsdelivr.net/npm/phaser@3.80.1/dist/phaser.min.js';
    const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
    function cargarPhaser() {
        if (window.Phaser) return Promise.resolve();
        return new Promise((ok, mal) => {
            const sc = document.createElement('script');
            sc.src = PHASER_URL; sc.onload = () => ok(); sc.onerror = () => mal(new Error('No se pudo cargar el motor del juego. Revisa tu conexión.'));
            document.head.appendChild(sc);
        });
    }

    async function arrancar() {
        const intro = root.BlockRoalTema.iniciarIntro($('warp'));
        const phaserP = cargarPhaser();                       // se baja YA, en paralelo con Firebase y el servidor
        phaserP.catch(() => {});
        const fuentes = Promise.race([Promise.all(root.BlockRoalTema.FUENTES_A_CARGAR.map((f) => document.fonts.load(f))), dormir(2500)]).catch(() => {});
        let listoOk; const listoP = new Promise((r) => { listoOk = r; });
        let entrando = false;

        // El navegador solo deja sonar el audio tras un toque del usuario: el toque de «ENTRAR» lo activa y arranca la música de una vez.
        async function entrar() {
            if (entrando) return; entrando = true;
            Sonido.init(true); Sonido.warp(); setTimeout(() => Sonido.arrancarMusica(), 2600); intro.acelerar();
            if (navigator.vibrate) try { navigator.vibrate([30, 40, 60]); } catch (_) { /* sin vibración */ }
            $('btnEntrar').hidden = true; $('introEstado').textContent = '¡Entrando al barrio!';
            await dormir(3300);
            if (await Promise.race([listoP.then(() => true), dormir(900).then(() => false)]) === false) $('introEstado').textContent = 'Preparando tu partida…';
            await Promise.race([listoP, dormir(10000)]);
            $('app').classList.add('entrar'); $('intro').classList.add('salir');
            setTimeout(() => { intro.parar(); $('intro').hidden = true; }, 900);
        }
        $('btnEntrar').addEventListener('click', entrar);
        // Abierto desde el menú (iframe): el toque en «Juega» ya autorizó el audio → entra solo, con el sonido de la calle desde el primer instante.
        // Si el navegador no lo permite, queda el botón «Toca pa' entrar».
        if (window.self !== window.top) Sonido.desbloquear().then((ok) => { if (ok) entrar(); });
        $('btnInfo').addEventListener('click', () => { $('info').hidden = false; });
        $('btnInfoCerrar').addEventListener('click', () => { $('info').hidden = true; });
        $('info').addEventListener('click', (e) => { if (e.target === $('info')) $('info').hidden = true; });
        document.querySelectorAll('[data-menu]').forEach((a) => a.addEventListener('click', (e) => { if (window.self !== window.top) { e.preventDefault(); window.parent.postMessage({ tipo: 'blockroal-cerrar' }, window.location.origin); } }));
        $('btnSonido').addEventListener('click', () => { Sonido.init(); const apagar = Sonido.musicaOn || Sonido.sfxOn; Sonido.setMusica(!apagar); Sonido.setSfx(!apagar); pintarBotonesSonido(); if (!apagar) Sonido.clic(); });
        pintarBotonesSonido();

        if (!window.firebase || !window.FIREBASE_CONFIG) { aviso('No se pudo cargar el servicio. Recarga la página.', true); $('intro').hidden = true; $('app').hidden = false; return; }
        // Solo app + auth + functions (esta página no carga Firestore): no se usa initFirebaseServices() porque exige el SDK de Firestore.
        if (!firebase.apps.length) firebase.initializeApp(window.FIREBASE_CONFIG);
        funciones = firebase.app().functions('us-central1');
        $('btnOtra').addEventListener('click', jugarOtra);
        firebase.auth().onAuthStateChanged((user) => {
            if (!user) { intro.parar(); $('intro').hidden = true; $('sinSesion').hidden = false; $('app').hidden = true; return; }
            $('sinSesion').hidden = true; $('app').hidden = false;
            // Todo en paralelo: estado del jugador, sesión de partida y el motor del juego (antes iba uno detrás de otro).
            const pEstado = cargarEstado().then(() => { if (!estado.activo) aviso('El juego está en pausa por ahora. ¡Vuelve pronto!', true); });
            iniciarPartida();
            const pJuego = Promise.all([phaserP, fuentes]).then(() => { if (!juego) crearJuego(); });
            Promise.all([pEstado, pJuego]).then(() => { if (escena) { escena.actualizarMeta(); } }).catch((e) => {
                aviso(e?.code === 'functions/not-found' ? 'Para jugar necesitas una cuenta ROAL. Crea una al hacer tu primer pedido.' : (e?.message || 'No se pudo cargar el juego.'), true);
            }).finally(() => listoOk());
        });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arrancar); else arrancar();
})(typeof window !== 'undefined' ? window : globalThis);
