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
        // GEOMETRÍA del tablero (no cambiar sin autorización): 8x8 casillas de 40 px, lienzo de 360x640.
        const W = 360, H = 640, CELDA = 40, GX = 20, GY = 96, BANDEJA_Y = 480;
        const d = { W, H, CELDA, GX, GY, N, BANDEJA_Y, INGREDIENTES };
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
                this.txtMeta.setText(`Meta nivel ${estado ? estado.nivelMax + 1 : 1}: ${fmt(meta)} pts`);
                this.txtMeta.setColor(T.colorMeta(this.puntos >= meta));
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
                const esc = 0.55, ancho = dd.shape[0].length * CELDA, alto = dd.shape.length * CELDA;
                const cx = 60 + idx * 120;
                const cont = this.add.container(cx - (ancho * esc) / 2, BANDEJA_Y + 60 - (alto * esc) / 2).setScale(esc).setDepth(8);
                for (let i = 0; i < dd.shape.length; i++) for (let j = 0; j < dd.shape[0].length; j++) {
                    if (dd.shape[i][j]) cont.add(this.add.image(j * CELDA + (CELDA - 3) / 2, i * CELDA + (CELDA - 3) / 2, 'ing_' + INGREDIENTES[dd.ing]));
                }
                // Zona de toque propia, centrada en la ranura de la bandeja y generosa (116x136): se agarra desde cualquier parte, sin importar la forma.
                const zona = this.add.zone(cx, BANDEJA_Y + 60, 116, 136).setInteractive();
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
