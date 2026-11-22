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
        // Música: bajo + arpegio + bombo + hi-hat, 128 bpm, en bucle de 4 compases. Se agenda con anticipación.
        const BAJO = [0, 0, 0, 0, 3, 3, 3, 3, -2, -2, -2, -2, -4, -4, -4, -4]; // raíz por semicorchea (compás de 16)
        const ARP = [0, 4, 7, 12, 7, 4, 0, 4, 7, 12, 16, 12, 7, 4, 7, 12];
        const RAICES = [57, 53, 55, 52]; // La, Fa, Sol, Mi
        function agendar() {
            if (!ctx || !corriendo) return;
            const tp = 60 / 128 / 4;
            while (proxT < ctx.currentTime + 0.25) {
                const comp = Math.floor(paso / 16) % 4, k = paso % 16, raiz = RAICES[comp];
                if (k % 4 === 0) tono(120, proxT, 0.14, 'sine', 0.9, musG, 45);                    // bombo
                if (k % 2 === 1) ruido(proxT, 0.04, 0.16, musG, 7000);                              // hi-hat
                if (k === 4 || k === 12) ruido(proxT, 0.1, 0.22, musG, 2500);                       // caja
                if (k % 2 === 0) tono(hz(raiz - 24), proxT, tp * 1.8, 'triangle', 0.55, musG);       // bajo
                tono(hz(raiz + 12 + ARP[k]), proxT, tp * 0.9, 'square', 0.1, musG);                 // arpegio
                if (k === 0) tono(hz(raiz + 24), proxT, tp * 3, 'sine', 0.12, musG);                // brillo
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
            colocar() { if (!ctx) return; const t = ctx.currentTime; tono(240, t, 0.14, 'sine', 0.7, sfxG, 90); ruido(t, 0.05, 0.25, sfxG, 3000); },
            limpiar(lineas, combo) {
                if (!ctx) return; const t = ctx.currentTime, esc = [0, 4, 7, 12, 16, 19, 24, 28], n = Math.min(esc.length, 3 + lineas * 2), base = 72 + Math.min(combo, 6);
                for (let i = 0; i < n; i++) tono(hz(base + esc[i]), t + i * 0.055, 0.22, i % 2 ? 'triangle' : 'square', 0.3, sfxG);
                ruido(t, 0.35, 0.3, sfxG, 1500);
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
            warp() { // salto al hiperespacio: barrido de ruido que sube + tono que sube + acorde final
                if (!ctx) return; const t = ctx.currentTime;
                const n = Math.floor(ctx.sampleRate * 1.4), buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
                for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
                const s = ctx.createBufferSource(); s.buffer = buf;
                const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 2.5;
                f.frequency.setValueAtTime(250, t); f.frequency.exponentialRampToValueAtTime(7000, t + 1.2);
                const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.9, t + 1.0); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
                s.connect(f); f.connect(g); g.connect(sfxG); s.start(t); s.stop(t + 1.45);
                tono(60, t, 1.2, 'sawtooth', 0.32, sfxG, 1100);
                [57, 64, 69, 76].forEach((m, i) => tono(hz(m), t + 1.15, 1.1, i % 2 ? 'triangle' : 'square', 0.2, sfxG));
                tono(70, t + 1.15, 0.6, 'sine', 0.8, sfxG, 35);
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
        $('resTitulo').textContent = 'Fin de la partida';
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
                if (x.nivelSuperado) { $('resTitulo').textContent = '¡Nivel superado!'; partes.push(`🏆 Pasaste al nivel ${estado.nivelMax + 1}`); Sonido.nivel(); if (escena) escena.confeti(); }
                else if (x.creditoGanado > 0) Sonido.monedas();
                if (x.creditoGanado > 0) partes.push(`Ganaste ${peso(x.creditoGanado)} en créditos ROAL`);
                $('resDetalle').textContent = partes.join('\n');
            }
        } catch (e) { $('resDetalle').textContent = e?.message || 'No se pudieron guardar tus puntos.'; }
        $('btnOtra').disabled = false;
    }

    function crearJuego() {
        const W = 360, H = 640, CELDA = 40, GX = 20, GY = 96, BANDEJA_Y = 480;
        // Colores vibrantes ("otro mundo"): neón saturado sobre fondo cósmico.
        const PAL = { pan: 0xff9100, carne: 0xff2e7e, queso: 0xffe600, tequeno: 0x22ff8f, arepa: 0x1fd8ff };
        const NEON = [0xff2e7e, 0xff9100, 0xffe600, 0x22ff8f, 0x1fd8ff, 0x8a5cff];
        const CASILLA = 0x2a1660;
        const hsv = (h) => Phaser.Display.Color.HSVToRGB((h % 360) / 360, 0.85, 1).color;

        class Escena extends Phaser.Scene {
            create() {
                escena = this;
                this.texturas();
                this.fondo();
                this.add.rectangle(GX + (N * CELDA) / 2, GY + (N * CELDA) / 2, N * CELDA + 10, N * CELDA + 10, 0x0e0630, 0.82);
                for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) this.add.rectangle(GX + j * CELDA + CELDA / 2, GY + i * CELDA + CELDA / 2, CELDA - 3, CELDA - 3, CASILLA).setStrokeStyle(1, 0x4a2a9a, 0.6);
                this.borde = this.add.graphics().setDepth(4);                      // borde animado (se redibuja en update)
                this.celdasImg = Array.from({ length: N }, () => Array(N).fill(null));
                this.txtPuntos = this.add.text(W / 2, 30, '0', { fontFamily: 'Anton', fontSize: '46px', color: '#fff', stroke: '#ff2e7e', strokeThickness: 5, padding: { x: 24, y: 18 } }).setOrigin(0.5);
                this.txtPuntos.setShadow(0, 0, '#22ff8f', 10, true, true);
                this.txtMeta = this.add.text(W / 2, 68, '', { fontFamily: 'Montserrat', fontSize: '13px', fontStyle: '700', color: '#c9b8ff' }).setOrigin(0.5);
                this.fantasma = this.add.graphics().setDepth(5);
                this.emisores = INGREDIENTES.map((n) => this.add.particles(0, 0, 'chispa', { speed: { min: 90, max: 300 }, angle: { min: 0, max: 360 }, scale: { start: 1, end: 0 }, lifespan: { min: 350, max: 750 }, gravityY: 380, tint: PAL[n], blendMode: 'ADD', emitting: false }).setDepth(30));
                this.arcoiris = this.add.particles(0, 0, 'chispa', { speed: { min: 120, max: 420 }, angle: { min: 200, max: 340 }, scale: { start: 1.4, end: 0 }, lifespan: 1400, gravityY: 500, tint: NEON, blendMode: 'ADD', emitting: false }).setDepth(31);
                this.input.on('pointermove', (p) => this.arrastrar(p));
                this.input.on('pointerup', () => this.soltar());
                this.input.on('pointerupoutside', () => this.soltar());
                this.nueva();
            }
            fondo() {
                // Estrellas que titilan + nebulosas que flotan (sobre el degradado cósmico de la página).
                for (let k = 0; k < 46; k++) {
                    const s = this.add.circle(Phaser.Math.Between(0, W), Phaser.Math.Between(0, H), Phaser.Math.FloatBetween(0.8, 2.2), 0xffffff, 0.9).setBlendMode('ADD');
                    this.tweens.add({ targets: s, alpha: { from: 0.15, to: 1 }, duration: Phaser.Math.Between(700, 2200), yoyo: true, repeat: -1, delay: Phaser.Math.Between(0, 1500) });
                }
                [[0xff2e7e, 40, 120], [0x1fd8ff, 330, 380], [0x8a5cff, 60, 560]].forEach(([c, x, y], i) => {
                    const o = this.add.circle(x, y, 120, c, 0.16).setBlendMode('ADD');
                    this.tweens.add({ targets: o, x: x + (i % 2 ? -50 : 50), y: y + 40, scale: { from: 0.85, to: 1.25 }, duration: 5000 + i * 1200, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
                });
            }
            texturas() {
                const g = this.make.graphics({ x: 0, y: 0, add: false });
                const S = CELDA - 3;
                INGREDIENTES.forEach((nombre) => {
                    g.clear();
                    const c = PAL[nombre];
                    g.fillStyle(c, 1).fillRoundedRect(0, 0, S, S, 8);
                    g.fillStyle(0xffffff, 0.28).fillRoundedRect(2, 2, S - 4, S / 2.2, { tl: 6, tr: 6, bl: 2, br: 2 }); // brillo superior
                    if (nombre === 'pan') {                                  // pan: domo con ajonjolí
                        g.fillStyle(0xffd27a, 1).fillRoundedRect(4, 4, S - 8, S / 2, 10);
                        g.fillStyle(0xffffff, 1); [[10, 9], [18, 7], [26, 10], [14, 16], [23, 16]].forEach(([x, y]) => g.fillEllipse(x, y, 4, 2.4));
                    } else if (nombre === 'carne') {                          // carne: parrilla
                        g.fillStyle(0x5a0a2c, 0.85); [10, 19, 28].forEach((y) => g.fillRect(4, y, S - 8, 3));
                    } else if (nombre === 'queso') {                          // queso: huecos
                        g.fillStyle(0xc99a00, 1); [[10, 10, 4], [25, 14, 3], [16, 25, 4], [28, 28, 2.5]].forEach(([x, y, r]) => g.fillCircle(x, y, r));
                    } else if (nombre === 'tequeno') {                        // tequeño: rombos de masa
                        g.lineStyle(2, 0xd8ffe9, 0.9);
                        for (let k = -S; k < S * 2; k += 9) { g.lineBetween(k, 0, k + S, S); g.lineBetween(k, S, k + S, 0); }
                    } else {                                                  // arepa: redonda con tostado
                        g.fillStyle(0xe9fbff, 1).fillCircle(S / 2, S / 2, S / 2 - 4);
                        g.fillStyle(0x4aa6c4, 1); [[12, 14, 3], [24, 20, 3.5], [16, 26, 2.5], [26, 10, 2]].forEach(([x, y, r]) => g.fillCircle(x, y, r));
                    }
                    g.lineStyle(2, 0xffffff, 0.55).strokeRoundedRect(1, 1, S - 2, S - 2, 8);
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
                // Borde del tablero: arcoíris neón que gira alrededor del marco, con resplandor.
                const x0 = GX - 5, y0 = GY - 5, w = N * CELDA + 10, h = N * CELDA + 10, per = 2 * (w + h), seg = 96;
                const pt = (t) => { let d = (t % 1) * per; if (d < w) return [x0 + d, y0]; d -= w; if (d < h) return [x0 + w, y0 + d]; d -= h; if (d < w) return [x0 + w - d, y0 + h]; d -= w; return [x0, y0 + h - d]; };
                const b = this.borde; b.clear();
                for (let k = 0; k < seg; k++) {
                    const a = pt(k / seg), c = pt((k + 1.4) / seg), col = hsv(k * (360 / seg) + time * 0.12);
                    b.lineStyle(11, col, 0.18); b.lineBetween(a[0], a[1], c[0], c[1]);
                    b.lineStyle(4, col, 1); b.lineBetween(a[0], a[1], c[0], c[1]);
                }
                this.txtPuntos.setStroke(Phaser.Display.Color.IntegerToColor(hsv(time * 0.1)).rgba, 5);
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
                this.txtMeta.setColor(this.puntos >= meta ? '#22ff8f' : '#c9b8ff');
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
                    this.emisores[pz.ing].explode(2, GX + (c + j) * CELDA + CELDA / 2, GY + (r + i) * CELDA + CELDA / 2);
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
                    const col = ['#ff2e7e', '#ffe600', '#22ff8f', '#1fd8ff'][this.combo % 4];
                    const t = this.add.text(W / 2, GY + (N * CELDA) / 2, this.combo > 1 ? `¡COMBO x${this.combo}!\n+${gan}` : (nLineas > 1 ? `¡DOBLE!\n+${gan}` : `+${gan}`), { fontFamily: 'Anton', fontSize: '38px', color: col, align: 'center', stroke: '#14072e', strokeThickness: 7, padding: { x: 30, y: 24 } }).setOrigin(0.5).setDepth(40).setScale(0.3);
                    t.setShadow(0, 0, col, 10, true, true);
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

    // Intro: túnel de estrellas en el canvas 2D (liviano, no necesita Phaser ni Firebase: aparece al instante mientras todo lo demás carga).
    function iniciarIntro() {
        const cv = $('warp'); if (!cv) return { acelerar() {}, parar() {} };
        const c = cv.getContext('2d'); let w = 0, h = 0, est = [], vel = 1.2, activo = true;
        const reset = () => { w = cv.width = window.innerWidth; h = cv.height = window.innerHeight; est = Array.from({ length: 170 }, () => ({ x: (Math.random() - 0.5) * w * 1.4, y: (Math.random() - 0.5) * h * 1.4, z: Math.random() * w, col: Math.floor(Math.random() * 360) })); };
        reset(); window.addEventListener('resize', reset);
        (function dibujar() {
            if (!activo) return;
            c.fillStyle = 'rgba(18, 6, 46, 0.32)'; c.fillRect(0, 0, w, h);
            for (const e of est) {
                const zAnt = e.z; e.z -= vel * 4;
                if (e.z <= 2) { e.z = w; e.x = (Math.random() - 0.5) * w * 1.4; e.y = (Math.random() - 0.5) * h * 1.4; continue; }
                const k = 140 / e.z, k0 = 140 / zAnt, x = e.x * k + w / 2, y = e.y * k + h / 2, x0 = e.x * k0 + w / 2, y0 = e.y * k0 + h / 2;
                c.strokeStyle = `hsl(${e.col}, 100%, ${60 + (1 - e.z / w) * 30}%)`; c.lineWidth = Math.max(0.6, (1 - e.z / w) * 3.2);
                c.beginPath(); c.moveTo(x0, y0); c.lineTo(x, y); c.stroke();
            }
            requestAnimationFrame(dibujar);
        })();
        return { acelerar() { vel = 16; }, parar() { activo = false; window.removeEventListener('resize', reset); } };
    }

    async function arrancar() {
        const intro = iniciarIntro();
        const phaserP = cargarPhaser();                       // se baja YA, en paralelo con Firebase y el servidor
        phaserP.catch(() => {});
        const fuentes = Promise.race([Promise.all([document.fonts.load('44px Anton'), document.fonts.load('600 14px Montserrat')]), dormir(2500)]).catch(() => {});
        let listoOk; const listoP = new Promise((r) => { listoOk = r; });
        let entrando = false;

        // El navegador solo deja sonar el audio tras un toque del usuario: el toque de «ENTRAR» lo activa y arranca la música de una vez.
        async function entrar() {
            if (entrando) return; entrando = true;
            Sonido.init(); Sonido.warp(); intro.acelerar();
            if (navigator.vibrate) try { navigator.vibrate([30, 40, 60]); } catch (_) { /* sin vibración */ }
            $('btnEntrar').hidden = true; $('introEstado').textContent = '¡Entrando!';
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
