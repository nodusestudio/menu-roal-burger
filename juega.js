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
        try { const o = JSON.parse(localStorage.getItem('blockroal_snd') || '{}'); musicaOn = o.m !== false; sfxOn = o.s !== false; } catch (_) { /* sin almacenamiento */ }
        const guardar = () => { try { localStorage.setItem('blockroal_snd', JSON.stringify({ m: musicaOn, s: sfxOn })); } catch (_) { /* nada */ } };
        const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);

        function init() {
            if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
            const AC = window.AudioContext || window.webkitAudioContext;
            if (!AC) return;
            ctx = new AC();
            master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
            sfxG = ctx.createGain(); sfxG.gain.value = sfxOn ? 0.85 : 0; sfxG.connect(master);
            musG = ctx.createGain(); musG.gain.value = musicaOn ? 0.3 : 0; musG.connect(master);
            if (musicaOn) iniciarMusica();
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
        // Música ORIGINAL (no es ninguna canción existente): dembow de barrio a 96 bpm. El ritmo dembow (bombo cuadrado + caja "tun-ka-tun-ka") es del género,
        // no de nadie; la melodía, el bajo y el rasgueo de cuatro los compuse aquí. Maracas de 16avos al estilo llanero.
        const RAICES = [57, 55, 53, 55];                       // La menor – Sol – Fa – Sol (un acorde por compás)
        const TERCERA = [3, 4, 4, 4];
        const BAJO_PASOS = [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 0, 0];
        const RIFF_A = [0, -1, -1, 3, -1, 5, -1, -1, 7, -1, 5, -1, 3, -1, 0, -1];
        const RIFF_B = [0, -1, -1, 3, -1, 5, -1, -1, 10, -1, 7, -1, 5, -1, 3, -1];
        function agendar() {
            if (!ctx || !corriendo) return;
            const tp = 60 / 96 / 4;
            while (proxT < ctx.currentTime + 0.25) {
                const comp = Math.floor(paso / 16) % 4, k = paso % 16, raiz = RAICES[comp], t = proxT;
                if (k % 4 === 0) tono(130, t, 0.16, 'sine', 0.95, musG, 42);                                                  // bombo
                if (k === 3 || k === 6 || k === 11 || k === 14) { ruido(t, 0.09, 0.3, musG, 1800); tono(190, t, 0.07, 'triangle', 0.25, musG, 120); } // caja dembow
                ruido(t, 0.035, k % 4 === 0 ? 0.05 : (k % 2 ? 0.2 : 0.11), musG, 8000);                                       // maracas con acento
                if (BAJO_PASOS[k]) tono(hz(raiz - 24), t, tp * 2.6, 'sine', 0.85, musG, hz(raiz - 24) * 0.97);                 // bajo 808
                const riff = (comp % 2 ? RIFF_B : RIFF_A)[k];
                if (riff >= 0) tono(hz(raiz + 12 + riff), t, tp * 1.6, 'triangle', 0.16, musG);                                // riff
                if (k === 2 || k === 5 || k === 8 || k === 10 || k === 13) [0, TERCERA[comp], 7].forEach((s2, i) => tono(hz(raiz + 12 + s2), t + i * 0.012, tp * 0.9, 'sawtooth', 0.045, musG)); // rasgueo de cuatro
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
            get estadoAudio() { return ctx ? ctx.state : 'sin-iniciar'; }, get musicaCorriendo() { return corriendo; },
            get musicaOn() { return musicaOn; }, get sfxOn() { return sfxOn; },
            setMusica(v) { musicaOn = !!v; guardar(); if (musG) musG.gain.value = musicaOn ? 0.3 : 0; if (musicaOn) iniciarMusica(); else detenerMusica(); },
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
            warp() { // entrada al barrio: tres rociadas de spray + caída de 808 + rasgueo de cuatro
                if (!ctx) return; const t = ctx.currentTime;
                [0, 0.3, 0.62].forEach((d, i) => ruido(t + d, 0.28, 0.35, sfxG, 3500 + i * 1200));
                tono(48, t + 1.0, 0.9, 'sine', 0.95, sfxG, 30);
                ruido(t + 1.0, 0.25, 0.4, sfxG, 600);
                [0, 3, 7, 12, 15].forEach((s2, i) => tono(hz(57 + s2), t + 1.0 + i * 0.03, 1.2, 'sawtooth', 0.09, sfxG));
                [0, 7, 12, 19].forEach((s2, i) => tono(hz(69 + s2), t + 1.35 + i * 0.12, 0.5, 'triangle', 0.2, sfxG));
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
        $('stBonus').textContent = Object.keys(estado.rachaBonus || {}).map((d) => `${d} días +${estado.rachaBonus[d]}`).join(' · ');
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
        $('resTitulo').textContent = '¡Se acabó, mi pana!';
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
                if (x.nivelSuperado) { $('resTitulo').textContent = '¡Nivel superado, qué fino!'; partes.push(`🏆 Pasaste al nivel ${estado.nivelMax + 1}, ¡burda de bueno!`); Sonido.nivel(); if (escena) escena.confeti(); }
                else if (x.creditoGanado > 0) Sonido.monedas();
                if (x.creditoGanado > 0) partes.push(`Ganaste ${peso(x.creditoGanado)} en créditos ROAL`);
                $('resDetalle').textContent = partes.join('\n');
            }
        } catch (e) { $('resDetalle').textContent = e?.message || 'No se pudieron guardar tus puntos.'; }
        $('btnOtra').disabled = false;
    }

    function crearJuego() {
        const W = 360, H = 640, CELDA = 40, GX = 20, GY = 96, BANDEJA_Y = 480;
        // El barrio: pintura de spray vibrante sobre cemento y ladrillo; amarillo, azul y rojo de la bandera en la marquesina.
        const PAL = { pan: 0xff9a1f, carne: 0xe3212b, queso: 0xffd100, tequeno: 0x2fc46a, arepa: 0x3d7bff };
        const BANDERA = [0xffd100, 0x3d7bff, 0xe3212b];
        const NEON = [0xffd100, 0x3d7bff, 0xe3212b, 0xff9a1f, 0xffffff];
        const FUENTE_SPRAY = '"Rubik Spray Paint", Anton, sans-serif';
        const FUENTE_MARCADOR = '"Permanent Marker", Anton, cursive';

        class Escena extends Phaser.Scene {
            create() {
                escena = this;
                this.texturas();
                this.fondo();
                const cx = GX + (N * CELDA) / 2, cy = GY + (N * CELDA) / 2, lado = N * CELDA + 14;
                this.add.rectangle(cx + 3, cy + 5, lado, lado, 0x000000, 0.45);                                   // sombra de la losa
                this.add.rectangle(cx, cy, lado, lado, 0x2b2b30, 1).setStrokeStyle(2, 0x111114);                  // losa de cemento
                this.add.tileSprite(cx, cy, lado - 4, lado - 4, 'concreto').setAlpha(0.55);
                for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) this.add.rectangle(GX + j * CELDA + CELDA / 2, GY + i * CELDA + CELDA / 2, CELDA - 3, CELDA - 3, 0x1a1a1e, 0.9).setStrokeStyle(1, 0x3c3c44, 0.9);
                this.borde = this.add.graphics().setDepth(4);                      // borde animado (se redibuja en update)
                this.celdasImg = Array.from({ length: N }, () => Array(N).fill(null));
                this.txtPuntos = this.add.text(W / 2, 30, '0', { fontFamily: 'Anton', fontSize: '46px', color: '#ffd100', stroke: '#0a1a5c', strokeThickness: 7, padding: { x: 24, y: 18 } }).setOrigin(0.5);
                this.txtPuntos.setShadow(3, 3, '#e3212b', 0, true, true);
                this.txtMeta = this.add.text(W / 2, 68, '', { fontFamily: 'Montserrat', fontSize: '13px', fontStyle: '800', color: '#f2e6c8', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5);
                this.fantasma = this.add.graphics().setDepth(5);
                this.emisores = INGREDIENTES.map((n) => this.add.particles(0, 0, 'chispa', { speed: { min: 90, max: 300 }, angle: { min: 0, max: 360 }, scale: { start: 1, end: 0 }, lifespan: { min: 350, max: 750 }, gravityY: 380, tint: PAL[n], blendMode: 'ADD', emitting: false }).setDepth(30));
                this.polvo = this.add.particles(0, 0, 'chispa', { speed: { min: 30, max: 120 }, angle: { min: 0, max: 360 }, scale: { start: 0.9, end: 0 }, alpha: { start: 0.8, end: 0 }, lifespan: { min: 300, max: 600 }, tint: 0xd8d4cc, emitting: false }).setDepth(29);
                this.arcoiris = this.add.particles(0, 0, 'chispa', { speed: { min: 120, max: 420 }, angle: { min: 200, max: 340 }, scale: { start: 1.4, end: 0 }, lifespan: 1400, gravityY: 500, tint: NEON, blendMode: 'ADD', emitting: false }).setDepth(31);
                this.input.on('pointermove', (p) => this.arrastrar(p));
                this.input.on('pointerup', () => this.soltar());
                this.input.on('pointerupoutside', () => this.soltar());
                this.nueva();
            }
            fondo() {
                // Muro de ladrillo de todo el lienzo + luz de farola + manchas de pintura + tags y stickers + acera con cordón amarillo para las piezas.
                this.add.tileSprite(0, 0, W, H, 'muro').setOrigin(0);
                const luz = this.add.graphics(); luz.fillGradientStyle(0xffe9a8, 0xffe9a8, 0x000000, 0x000000, 0.32, 0.32, 0, 0); luz.fillRect(0, 0, W, 250);
                const sombra = this.add.graphics(); sombra.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0, 0.55, 0.55); sombra.fillRect(0, H - 220, W, 220);
                [[0xffd100, 318, 64, 78], [0x3d7bff, 30, 300, 86], [0xe3212b, 330, 440, 70]].forEach(([c, x, y, r]) => this.add.circle(x, y, r, c, 0.3));
                const tag = (txt, x, y, ang, col, tam, fam) => this.add.text(x, y, txt, { fontFamily: fam, fontSize: tam + 'px', color: col, stroke: '#000000', strokeThickness: 4, padding: { x: 10, y: 8 } }).setOrigin(0.5).setAngle(ang).setAlpha(0.92);
                tag('ROAL', 64, 452, -9, '#ffd100', 34, FUENTE_SPRAY);
                tag('PANA', 296, 454, 7, '#ffffff', 30, FUENTE_MARCADOR);
                tag('¡ÉPALE!', 70, 628, 4, '#ff5a5f', 26, FUENTE_MARCADOR);
                tag('SABOR DE MI TIERRA', 262, 626, -4, '#3d7bff', 15, FUENTE_MARCADOR);
                // Stickers en las esquinas de arriba
                const sticker = (x, y, ang, w, h, fondo, txt, col) => { const r = this.add.rectangle(x, y, w, h, fondo, 1).setStrokeStyle(2, 0xffffff, 1).setAngle(ang); const t = this.add.text(x, y, txt, { fontFamily: FUENTE_MARCADOR, fontSize: '12px', color: col, align: 'center' }).setOrigin(0.5).setAngle(ang); return [r, t]; };
                sticker(46, 36, -6, 70, 34, 0xffd100, 'ROAL\nBURGER', '#0a1a5c');
                sticker(314, 36, 5, 70, 34, 0x0a1a5c, 'DEL BARRIO\nPA\' TI', '#ffd100');
                // Bandera: tres franjas finas arriba del todo
                [0xffd100, 0x2b5fff, 0xe3212b].forEach((c, i) => this.add.rectangle(W / 2, 1.5 + i * 3, W, 3, c, 1).setDepth(50));
                // Acera: losa oscura con cordón amarillo y ranuras para las 3 piezas
                this.add.rectangle(W / 2, BANDEJA_Y + 80, W, 190, 0x17171b, 0.93);
                const cordon = this.add.graphics(); cordon.fillStyle(0xffd100, 1).fillRect(0, BANDEJA_Y - 12, W, 6); cordon.fillStyle(0x111111, 1); for (let x = 0; x < W; x += 24) cordon.fillRect(x, BANDEJA_Y - 12, 12, 6);
                for (let k = 0; k < 3; k++) this.add.rectangle(60 + k * 120, BANDEJA_Y + 60, 104, 112, 0x000000, 0.25).setStrokeStyle(2, 0xffd100, 0.35);
            }
            texturas() {
                const g = this.make.graphics({ x: 0, y: 0, add: false });
                const S = CELDA - 3;
                const alea = (a, b) => a + Math.random() * (b - a);
                // Muro de ladrillo (baldosa que se repite)
                g.fillStyle(0x2e2321, 1).fillRect(0, 0, 96, 48);
                const LAD = [0x8a4b38, 0x7a4030, 0x9a5a42, 0x6d392c, 0x84483a];
                for (let f = 0; f < 2; f++) for (let c = -1; c < 3; c++) {
                    const x = c * 48 + (f % 2 ? 24 : 0), y = f * 24;
                    g.fillStyle(LAD[Math.floor(Math.random() * LAD.length)], 1).fillRect(x + 2, y + 2, 44, 20);
                    g.fillStyle(0xffffff, 0.06).fillRect(x + 2, y + 2, 44, 3);
                    for (let n = 0; n < 6; n++) { g.fillStyle(0x000000, 0.13).fillRect(x + 2 + alea(0, 40), y + 2 + alea(0, 16), 2, 2); }
                }
                g.generateTexture('muro', 96, 48);
                // Cemento (baldosa para la losa)
                g.clear(); g.fillStyle(0x8c8c92, 1).fillRect(0, 0, 64, 64);
                for (let n = 0; n < 160; n++) { g.fillStyle(n % 2 ? 0x707076 : 0xa8a8ae, 1).fillRect(alea(0, 63), alea(0, 63), 1 + Math.random() * 2, 1 + Math.random() * 2); }
                g.generateTexture('concreto', 64, 64);
                // Bloques: cemento + parche de pintura en spray con el ingrediente + goteos
                INGREDIENTES.forEach((nombre) => {
                    g.clear();
                    const c = PAL[nombre];
                    g.fillStyle(0x8e8e93, 1).fillRoundedRect(0, 0, S, S, 4);
                    g.fillStyle(0xbcbcc2, 1).fillRect(2, 2, S - 4, 2); g.fillRect(2, 2, 2, S - 4);          // borde con luz
                    g.fillStyle(0x58585d, 1).fillRect(2, S - 4, S - 4, 2); g.fillRect(S - 4, 2, 2, S - 4);  // borde en sombra
                    for (let n = 0; n < 34; n++) { g.fillStyle(n % 2 ? 0x76767b : 0xa6a6ab, 1).fillRect(alea(3, S - 4), alea(3, S - 4), 1 + Math.random() * 1.5, 1 + Math.random() * 1.5); }
                    g.lineStyle(1, 0x4c4c50, 0.9).lineBetween(alea(6, 14), S - 3, alea(16, 26), alea(S - 12, S - 7)); // fisura
                    g.fillStyle(c, 0.25).fillCircle(S / 2, S / 2, S / 2 + 1);                              // sobre-rociado
                    g.fillStyle(c, 1).fillRoundedRect(5, 5, S - 10, S - 10, 7);                            // parche de pintura
                    g.fillStyle(0xffffff, 0.22).fillRoundedRect(7, 6, S - 14, 5, 3);                       // brillo de pintura fresca
                    g.save(); g.translateCanvas(5, 5); g.scaleCanvas((S - 10) / S, (S - 10) / S);
                    if (nombre === 'pan') {                                  // pan: domo con ajonjolí
                        g.fillStyle(0xffd27a, 1).fillRoundedRect(4, 4, S - 8, S / 2, 10);
                        g.fillStyle(0xffffff, 1); [[10, 9], [18, 7], [26, 10], [14, 16], [23, 16]].forEach(([x, y]) => g.fillEllipse(x, y, 4, 2.4));
                    } else if (nombre === 'carne') {                          // carne: parrilla
                        g.fillStyle(0x4a0a10, 0.85); [10, 19, 28].forEach((y) => g.fillRect(4, y, S - 8, 3));
                    } else if (nombre === 'queso') {                          // queso: huecos
                        g.fillStyle(0xb98600, 1); [[10, 10, 4], [25, 14, 3], [16, 25, 4], [28, 28, 2.5]].forEach(([x, y, r]) => g.fillCircle(x, y, r));
                    } else if (nombre === 'tequeno') {                        // tequeño: rollo dorado con tiras de masa
                        g.fillStyle(0xf7c35a, 1).fillRoundedRect(3, 10, S - 6, S - 20, 8);
                        g.lineStyle(2, 0xb87a1c, 1); for (let k = 6; k < S - 6; k += 8) g.lineBetween(k, 11, k + 6, S - 11);
                    } else {                                                  // arepa: redonda con tostado
                        g.fillStyle(0xf8ecd0, 1).fillCircle(S / 2, S / 2, S / 2 - 4);
                        g.fillStyle(0xc99a55, 1); [[12, 14, 3], [24, 20, 3.5], [16, 26, 2.5], [26, 10, 2]].forEach(([x, y, r]) => g.fillCircle(x, y, r));
                    }
                    g.restore();
                    [9, 18, 27].forEach((x) => { const l = 2 + Math.random() * 4; g.fillStyle(c, 1).fillRect(x, S - 8, 2.4, l); g.fillCircle(x + 1.2, S - 8 + l, 1.8); }); // goteos
                    g.lineStyle(2, 0x2c2c30, 1).strokeRoundedRect(0.5, 0.5, S - 1, S - 1, 4);
                    g.generateTexture('ing_' + nombre, S, S);
                });
                g.clear(); g.fillStyle(0xffffff, 1).fillCircle(5, 5, 5); g.generateTexture('chispa', 10, 10);
                g.destroy();
            }
            update(time, delta) {
                if (this.arrastrando && this.objetivo) { // la pieza sigue al dedo con suavidad (pegada, sin saltos)
                    const k = Math.min(1, 0.5 * ((delta || 16.6) / 16.6)), cn = this.arrastrando.cont;
                    cn.x += (this.objetivo.x - cn.x) * k; cn.y += (this.objetivo.y - cn.y) * k;
                }
                // Borde del tablero: marquesina de letrero de feria. Bombillos amarillo-azul-rojo que corren alrededor del marco, con resplandor.
                const x0 = GX - 9, y0 = GY - 9, w = N * CELDA + 18, h = N * CELDA + 18, per = 2 * (w + h), nb = 64;
                const pt = (t) => { let d = (t % 1) * per; if (d < w) return [x0 + d, y0]; d -= w; if (d < h) return [x0 + w, y0 + d]; d -= h; if (d < w) return [x0 + w - d, y0 + h]; d -= w; return [x0, y0 + h - d]; };
                const b = this.borde; b.clear();
                b.lineStyle(5, 0x101014, 1).strokeRect(x0, y0, w, h);
                const fase = Math.floor(time / 110);
                for (let k = 0; k < nb; k++) {
                    const p = pt(k / nb), idx = (((k - fase) % 3) + 3) % 3, col = BANDERA[idx], viva = idx === 0;
                    b.fillStyle(col, viva ? 0.3 : 0.1).fillCircle(p[0], p[1], 8);
                    b.fillStyle(col, viva ? 1 : 0.5).fillCircle(p[0], p[1], 3.4);
                    b.fillStyle(0xffffff, viva ? 0.95 : 0.25).fillCircle(p[0] - 0.9, p[1] - 0.9, 1.1);
                }
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
                this.txtMeta.setText(`Meta nivel ${estado ? estado.nivelMax + 1 : 1}: ${fmt(meta)} pts`);
                this.txtMeta.setColor(this.puntos >= meta ? '#ffd100' : '#f2e6c8');
            }
            repartir() {
                const datos = nuevasPiezas(this.grilla);
                this.piezas = datos.map((d, i) => this.crearPieza(d, i));
                this.piezas.forEach((p, i) => { p.cont.setAlpha(0).setScale(0.2); this.tweens.add({ targets: p.cont, alpha: 1, scale: p.home.esc, duration: 320, delay: i * 90, ease: 'Back.Out', onComplete: () => this.flotar(p) }); });
                if (!hayJugada(this.grilla, this.piezas.map((p) => p.shape))) this.terminar();
            }
            flotar(p) {
                if (p.usada || !p.cont.active) return;
                p.flota = this.tweens.add({ targets: p.cont, y: p.home.y - 5, duration: 900 + Math.random() * 400, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
            }
            crearPieza(d, idx) {
                const esc = 0.55, ancho = d.shape[0].length * CELDA, alto = d.shape.length * CELDA;
                const cx = 60 + idx * 120;
                const cont = this.add.container(cx - (ancho * esc) / 2, BANDEJA_Y + 60 - (alto * esc) / 2).setScale(esc);
                for (let i = 0; i < d.shape.length; i++) for (let j = 0; j < d.shape[0].length; j++) {
                    if (d.shape[i][j]) cont.add(this.add.image(j * CELDA + (CELDA - 3) / 2, i * CELDA + (CELDA - 3) / 2, 'ing_' + INGREDIENTES[d.ing]));
                }
                // Zona de toque propia, centrada en la ranura de la bandeja y generosa (116x136): se agarra desde cualquier parte, sin importar la forma.
                const zona = this.add.zone(cx, BANDEJA_Y + 60, 116, 136).setInteractive();
                const pieza = { cont, zona, shape: d.shape, ing: d.ing, usada: false, home: { x: cont.x, y: cont.y, esc }, ancho, alto };
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
                    pz.cont.setDepth(0); return;
                }
                this.aplicar(pz, r, c);
            }
            pintarCelda(i, j, ing) {
                const im = this.add.image(GX + j * CELDA + CELDA / 2, GY + i * CELDA + CELDA / 2, 'ing_' + INGREDIENTES[ing]).setScale(0.4);
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
                    const col = ['#ffd100', '#5b8dff', '#ff4a52', '#ff9a1f'][this.combo % 4];
                    const frase = this.combo > 1 ? `¡COMBO x${this.combo}!` : (nLineas > 2 ? '¡BURDA DE FINO!' : (nLineas > 1 ? '¡DOBLE, VALE!' : ''));
                    const t = this.add.text(W / 2, GY + (N * CELDA) / 2, `${frase}${frase ? '\n' : ''}+${gan}`, { fontFamily: FUENTE_SPRAY, fontSize: frase ? '32px' : '38px', color: col, align: 'center', stroke: '#000000', strokeThickness: 7, padding: { x: 30, y: 24 } }).setOrigin(0.5).setDepth(40).setScale(0.3);
                    t.setShadow(3, 3, '#0a1a5c', 0, true, true);
                    this.tweens.add({ targets: t, scale: 1.25, duration: 220, ease: 'Back.Out' });
                    this.tweens.add({ targets: t, y: t.y - 70, alpha: 0, duration: 800, delay: 450, onComplete: () => t.destroy() });
                    if (navigator.vibrate) try { navigator.vibrate(30 + nLineas * 10); } catch (_) { /* sin vibración */ }
                } else Sonido.colocar();
                this.txtPuntos.setText(fmt(this.puntos));
                this.tweens.add({ targets: this.txtPuntos, scale: { from: 1.3, to: 1 }, duration: 200, ease: 'Back.Out' });
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
        $('btnMusica').textContent = Sonido.musicaOn ? '🎵' : '🔇';
        $('btnMusica').setAttribute('aria-pressed', String(Sonido.musicaOn));
        $('btnSfx').textContent = Sonido.sfxOn ? '🔊' : '🔈';
        $('btnSfx').setAttribute('aria-pressed', String(Sonido.sfxOn));
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

    // Intro: el barrio de noche en canvas 2D (cerro de ranchos con ventanas que parpadean, banderines, estrellas, farola). Liviano: no necesita Phaser ni Firebase.
    function iniciarIntro() {
        const cv = $('warp'); if (!cv) return { acelerar() {}, parar() {} };
        const c = cv.getContext('2d'); let w = 0, h = 0, activo = true, vel = 0.4, zoom = 1, desp = 0, entrando = false;
        const FACHADAS = ['#e3212b', '#ffd100', '#2b5fff', '#ff9a1f', '#2fc46a', '#f2e6c8', '#c24a8a', '#18a0c8'];
        let capas = [], estrellas = [];
        const construir = () => {
            w = cv.width = window.innerWidth; h = cv.height = window.innerHeight;
            const ancho = w * 2.4;
            const capa = (par, base, hmin, hmax, colores, oscuro) => { const casas = []; let x = 0; while (x < ancho) { const cw = 46 + Math.random() * 54, ch = hmin + Math.random() * (hmax - hmin); casas.push({ x, w: cw, h: ch, col: colores[Math.floor(Math.random() * colores.length)], tanque: Math.random() < 0.3, ant: Math.random() < 0.2, vent: Array.from({ length: 40 }, () => Math.random()) }); x += cw + 2; } return { par, base, casas, ancho: x, oscuro }; };
            capas = [capa(0.25, h * 0.64, 70, 170, ['#14246e', '#1b2d80', '#101c5a'], true), capa(0.55, h * 0.78, 80, 190, ['#3a1d6e', '#5a2a7a', '#2c2070', '#7a2a4a'], true), capa(1, h * 1.0, 100, 230, FACHADAS, false)];
            estrellas = Array.from({ length: 70 }, () => ({ x: Math.random() * w, y: Math.random() * h * 0.5, r: Math.random() * 1.4 + 0.4, f: Math.random() * 6 }));
        };
        construir(); window.addEventListener('resize', construir);
        const t0 = performance.now();
        function dibujar() {
            if (!activo) return;
            const t = (performance.now() - t0) / 1000;
            if (entrando) { vel = Math.min(16, vel * 1.06 + 0.1); zoom = Math.min(2.4, zoom + 0.012); }
            desp += vel;
            c.setTransform(1, 0, 0, 1, 0, 0);
            const cielo = c.createLinearGradient(0, 0, 0, h); cielo.addColorStop(0, '#0a1a5c'); cielo.addColorStop(0.35, '#3b2a8a'); cielo.addColorStop(0.7, '#e3532b'); cielo.addColorStop(1, '#ffb300');
            c.fillStyle = cielo; c.fillRect(0, 0, w, h);
            c.setTransform(zoom, 0, 0, zoom, (w - w * zoom) / 2, (h - h * zoom) * 0.75); // al entrar: acercamiento hacia el barrio
            for (const e of estrellas) { c.globalAlpha = 0.35 + 0.65 * Math.abs(Math.sin(t * 1.6 + e.f)); c.fillStyle = '#fff'; c.fillRect(e.x, e.y, e.r, e.r); }
            c.globalAlpha = 1;
            const sol = c.createRadialGradient(w * 0.5, h * 0.7, 10, w * 0.5, h * 0.7, w * 0.8); sol.addColorStop(0, 'rgba(255,200,80,.55)'); sol.addColorStop(1, 'rgba(255,200,80,0)'); c.fillStyle = sol; c.fillRect(0, 0, w, h);
            for (const L of capas) {
                for (const k of L.casas) {
                    let x = ((k.x - desp * L.par) % L.ancho + L.ancho) % L.ancho - 80;
                    if (x > w + 80) continue;
                    const y = L.base - k.h;
                    c.fillStyle = k.col; c.fillRect(x, y, k.w, k.h + 4);
                    c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(x, y, k.w, 6);                      // techo / losa
                    if (k.tanque) { c.fillStyle = L.oscuro ? '#0b1240' : '#444'; c.fillRect(x + k.w * 0.3, y - 14, 16, 14); c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(x + k.w * 0.3, y - 14, 16, 3); }
                    if (k.ant) { c.strokeStyle = '#111'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x + k.w * 0.7, y); c.lineTo(x + k.w * 0.7, y - 22); c.moveTo(x + k.w * 0.7 - 6, y - 16); c.lineTo(x + k.w * 0.7 + 6, y - 16); c.stroke(); }
                    const cols = Math.max(1, Math.floor(k.w / 16)), filas = Math.max(1, Math.floor((k.h - 14) / 22));
                    for (let r = 0; r < filas; r++) for (let q = 0; q < cols; q++) {
                        const id = (r * cols + q) % 40, enc = k.vent[id] > 0.42 && (k.vent[id] > 0.97 ? Math.sin(t * 7 + id) > 0 : true);
                        c.fillStyle = enc ? (L.oscuro ? '#ffd75e' : '#fff1a8') : 'rgba(0,0,0,.45)';
                        c.fillRect(x + 6 + q * 16, y + 12 + r * 22, 8, 11);
                    }
                }
            }
            // Banderines de fiesta: amarillo, azul y rojo colgando de lado a lado
            c.setTransform(1, 0, 0, 1, 0, 0);
            [[0.07, 26], [0.16, 34]].forEach(([fy, caida], hilo) => {
                const y0 = h * fy; c.strokeStyle = 'rgba(0,0,0,.55)'; c.lineWidth = 1.5; c.beginPath();
                for (let x = 0; x <= w; x += 6) { const y = y0 + Math.sin((x / w) * Math.PI) * caida; x ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke();
                for (let x = 12, i = 0; x < w; x += 26, i++) {
                    const y = y0 + Math.sin((x / w) * Math.PI) * caida, bal = Math.sin(t * 2 + i + hilo) * 3;
                    c.fillStyle = ['#ffd100', '#2b5fff', '#e3212b'][(i + hilo) % 3]; c.beginPath(); c.moveTo(x - 9, y); c.lineTo(x + 9, y); c.lineTo(x + bal, y + 20); c.closePath(); c.fill();
                }
            });
            const vig = c.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h * 0.85); vig.addColorStop(0, 'rgba(0,0,0,0)'); vig.addColorStop(1, 'rgba(0,0,0,.45)'); c.fillStyle = vig; c.fillRect(0, 0, w, h);
            requestAnimationFrame(dibujar);
        }
        dibujar();
        return { acelerar() { entrando = true; }, parar() { activo = false; window.removeEventListener('resize', construir); } };
    }

    async function arrancar() {
        const intro = iniciarIntro();
        const phaserP = cargarPhaser();                       // se baja YA, en paralelo con Firebase y el servidor
        phaserP.catch(() => {});
        const fuentes = Promise.race([Promise.all([document.fonts.load('44px Anton'), document.fonts.load('600 14px Montserrat'), document.fonts.load('32px "Rubik Spray Paint"'), document.fonts.load('20px "Permanent Marker"')]), dormir(2500)]).catch(() => {});
        let listoOk; const listoP = new Promise((r) => { listoOk = r; });
        let entrando = false;

        // El navegador solo deja sonar el audio tras un toque del usuario: el toque de «ENTRAR» lo activa y arranca la música de una vez.
        async function entrar() {
            if (entrando) return; entrando = true;
            Sonido.init(); Sonido.warp(); intro.acelerar();
            if (navigator.vibrate) try { navigator.vibrate([30, 40, 60]); } catch (_) { /* sin vibración */ }
            $('btnEntrar').hidden = true; $('introEstado').textContent = '¡Entrando al barrio!';
            await dormir(1250);
            if (await Promise.race([listoP.then(() => true), dormir(900).then(() => false)]) === false) $('introEstado').textContent = 'Preparando tu partida…';
            await Promise.race([listoP, dormir(10000)]);
            $('app').classList.add('entrar'); $('intro').classList.add('salir');
            setTimeout(() => { intro.parar(); $('intro').hidden = true; }, 900);
        }
        $('btnEntrar').addEventListener('click', entrar);
        $('btnMusica').addEventListener('click', () => { Sonido.init(); Sonido.setMusica(!Sonido.musicaOn); pintarBotonesSonido(); });
        $('btnSfx').addEventListener('click', () => { Sonido.init(); Sonido.setSfx(!Sonido.sfxOn); pintarBotonesSonido(); Sonido.clic(); });
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
