/* Block ROAL — minijuego estilo Block Blast (Phaser 3). Archivo estático: no pasa por el build.
 * El reglamento (tablero, piezas, puntaje, semilla) vive en el MOTOR compartido (src/js/juego/motor.js → juega-motor.js), el mismo que usa el servidor para
 * REPETIR cada partida jugada por jugada. Aquí: sonido, escena Phaser y conexión con las Cloud Functions (juegoEstado / juegoIniciar / juegoEnviarPuntaje /
 * juegoRanking). El navegador solo JUEGA: puntos, rachas, niveles, créditos y ranking los decide y guarda el servidor (functions/juego.js). */
(function (root) {
    'use strict';
    const { N, SHAPES, INGREDIENTES, nuevaGrilla, celdas, puedeColocar, colocar, lineasLlenas, borrarLineas, hayJugada, puntosJugada, nuevasPiezas, crearRng, codificarJugada, reproducirHasta } = root.BlockRoalMotor;
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
            warp(corta) { // llegada al barrio. corta = ya la oíste hoy: solo spray, caída de 808 y rasgueo (sin la calle)
                if (!ctx) return; const t = ctx.currentTime, off = corta ? 1.6 : 0;
                const en = (d, fn) => { if (d >= off - 0.01) fn(t + d - off); };
                const banda = (t0, dur, vol, tipo, f0, f1, q) => {
                    const n = Math.floor(ctx.sampleRate * dur), buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
                    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
                    const s = ctx.createBufferSource(); s.buffer = buf; const f = ctx.createBiquadFilter(); f.type = tipo; f.Q.value = q || 1;
                    f.frequency.setValueAtTime(f0, t0); f.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
                    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + dur * 0.45); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
                    s.connect(f); f.connect(g); g.connect(sfxG); s.start(t0); s.stop(t0 + dur + 0.02);
                };
                en(0, (x) => banda(x, 3.0, 0.16, 'lowpass', 300, 700, 0.7));                       // murmullo del barrio
                en(0.2, (x) => banda(x, 1.7, 0.5, 'bandpass', 250, 1100, 2.5));                    // carro que se acerca…
                en(1.2, (x) => banda(x, 1.4, 0.4, 'bandpass', 1100, 220, 2.5));                    // …y se aleja (efecto Doppler)
                en(0.2, (x) => tono(70, x, 2.2, 'sawtooth', 0.12, sfxG, 130)); en(1.4, (x) => tono(130, x, 1.2, 'sawtooth', 0.1, sfxG, 70)); // motor
                en(0.5, (x) => tono(hz(93), x, 0.45, 'sawtooth', 0.05, sfxG, hz(100)));            // moto a lo lejos
                [[0.9, 0.14], [1.12, 0.22]].forEach(([d, l]) => en(d, (x) => { tono(hz(81), x, l, 'square', 0.15, sfxG); tono(hz(85), x, l, 'square', 0.13, sfxG); })); // pito pi-piii
                [1.7, 2.0, 2.3].forEach((d, i) => en(d, (x) => ruido(x, 0.28, 0.32, sfxG, 3500 + i * 1200)));                                // spray
                en(2.6, (x) => { tono(48, x, 0.9, 'sine', 0.95, sfxG, 30); ruido(x, 0.25, 0.4, sfxG, 600); [0, 3, 7, 12, 15].forEach((s2, i) => tono(hz(57 + s2), x + i * 0.03, 1.2, 'sawtooth', 0.09, sfxG)); }); // caída de 808
                en(2.95, (x) => [0, 7, 12, 19].forEach((s2, i) => tono(hz(69 + s2), x + i * 0.12, 0.5, 'triangle', 0.2, sfxG)));
            }
        };
        return S;
    })();

    root.BlockRoalSonido = Sonido; // solo para depurar/probar en el navegador

    // ── Guardado local (localStorage; si no está disponible el juego sigue igual, solo que sin guardar) ──
    const Guardado = (function () {
        const K = { partida: 'blockroal_partida', pend: 'blockroal_pendiente', intro: 'blockroal_intro' };
        const leer = (k) => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (_) { return null; } };
        const poner = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) { /* sin almacenamiento */ } };
        const quitar = (k) => { try { localStorage.removeItem(k); } catch (_) { /* nada */ } };
        const hoy = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
        const MAX_MS = 100 * 60 * 1000; // la partida del servidor vive 2 h: se deja margen
        return {
            partida(v) { poner(K.partida, v); },
            leerPartida(uid) { const p = leer(K.partida); return p && p.uid === uid && p.sesionId && Number.isInteger(p.semilla) && Date.now() - p.ini < MAX_MS && Array.isArray(p.movs) ? p : null; },
            borrarPartida() { quitar(K.partida); },
            pendiente(v) { poner(K.pend, v); },
            leerPendiente(uid) { const p = leer(K.pend); return p && p.uid === uid && Date.now() - p.ini < MAX_MS ? p : null; },
            borrarPendiente() { quitar(K.pend); },
            introVistaHoy() { return leer(K.intro) === hoy(); },
            marcarIntro() { poner(K.intro, hoy()); }
        };
    })();

    // ── Estado / servidor ──
    let estado = null;        // lo que devuelve juegoEstado (el servidor manda)
    let funciones = null;
    let juego = null;         // instancia Phaser
    let sesionId = null;
    let semilla = null;        // semilla de las piezas de esta partida (la da el servidor)
    let modoActual = 'libre';  // 'libre' | 'reto'
    let sesionIni = 0;         // cuándo (reloj del celular) empezó la partida actual: sirve para saber si aún se puede reanudar o reenviar
    let sesionPromesa = Promise.resolve();
    let escena = null;
    let escenaOk = () => {};
    const escenaP = new Promise((r) => { escenaOk = r; });   // se cumple cuando Phaser ya creó la escena (create() corre un instante DESPUÉS de crear el juego)
    let uidActual = '';
    let restauro = null;       // partida guardada por restaurar al abrir
    let bloqueado = false;     // llegó al máximo de partidas del día
    let mensajeBloqueo = '';
    let ultimoResultado = null; // lo que se muestra en la tarjeta para compartir

    function mostrarEstado() {
        if (!estado) return;
        $('stNivel').textContent = estado.nivelMax + 1;
        $('stMeta').textContent = fmt(estado.metaSiguiente);
        $('stRacha').textContent = estado.racha;
        $('stCredito').textContent = peso(estado.creditoJuego);
        $('stHoy').textContent = `${fmt(estado.puntosHoy)} / ${fmt(estado.topeDiario)}`;
        $('stBonus').textContent = Object.keys(estado.rachaBonus || {}).map((d) => `${d}d +${estado.rachaBonus[d]}`).join(' · ');
        const cr = $('stCredito'); cr.style.fontSize = cr.textContent.length > 7 ? '34px' : (cr.textContent.length > 5 ? '44px' : '');
        const vence = $('stVence');
        if (vence) {
            vence.textContent = estado.creditoJuego > 0 ? (estado.creditoVence > 0 ? `${peso(estado.creditoJuego)} · vencen el ${new Date(estado.creditoVence).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}` : peso(estado.creditoJuego)) : '—';
            const av = $('stAviso'); if (av) av.hidden = !(estado.creditoJuego > 0 && estado.creditoActivo === false);
        }
    }
    async function cargarEstado() {
        const r = await funciones.httpsCallable('juegoEstado')({});
        estado = r.data;
        mostrarEstado();
        return estado;
    }
    // Invitado sin cuenta ROAL (el servidor responde not-found): se pide entrar desde el menú en vez de mostrar un error técnico.
    function sinCuenta(e) { if (/not-found/.test(String(e && e.code || ''))) { $('sinSesion').hidden = false; aviso(''); return true; } return false; }
    function aviso(msg, esError) { const e = $('avisoJuego'); e.textContent = msg || ''; e.className = 'aviso' + (esError ? ' err' : ''); e.hidden = !msg; }

    function iniciarPartida(modo) {
        sesionId = null; semilla = null;
        sesionPromesa = (async () => {
            try {
                const r = await funciones.httpsCallable('juegoIniciar')({ modo: modo === 'reto' ? 'reto' : 'libre' });
                sesionId = r.data.sesionId; semilla = r.data.semilla; modoActual = r.data.modo || 'libre'; sesionIni = Date.now(); aviso('');
            } catch (e) {
                if (/resource-exhausted/.test(String(e && e.code || ''))) { bloqueado = true; mensajeBloqueo = e.message || 'Llegaste al máximo de partidas de hoy. ¡Vuelve mañana!'; aviso(mensajeBloqueo, true); }
                else if (!sinCuenta(e)) { aviso(e?.message || 'No se pudo iniciar la partida.', true); if (modo === 'reto') setTimeout(() => aviso(''), 3500); }
            }
        })();
        return sesionPromesa;
    }

    // ¿El error es de conexión (se puede reintentar) o lo rechazó el servidor (no tiene caso reintentar)?
    function esErrorDeRed(e) {
        const c = String(e && e.code || ''), m = String(e && e.message || '');
        if (/expir/i.test(m)) return false;
        return /unavailable|internal|unknown|deadline-exceeded/.test(c) || /network|fetch|offline|failed to/i.test(m);
    }
    function mostrarResultado(data) {
        if (!data.ok) { $('resDetalle').textContent = 'Esta partida no se pudo validar, así que no suma puntos.'; return; }
        estado = { ...estado, ...data.estado }; mostrarEstado();
        const x = data.resultado, partes = [];
        $('btnVerRanking').hidden = !x.reto;
        $('btnCompartir').hidden = false;
        ultimoResultado = { puntaje: x.puntaje, reto: !!x.reto, nivel: estado.nivelMax + 1, racha: estado.racha, puesto: null };
        if (x.reto) { estado.retoHecho = true; estado.retoPuntaje = x.puntaje; pintarModos(); partes.push('🏆 Tu puntaje del reto ya está en el ranking de hoy.'); }
        partes.push(x.puntosOtorgados > 0 ? `+${fmt(x.puntosOtorgados)} puntos ROAL` : 'Hoy ya llegaste al tope de puntos');
        if (x.topeAlcanzado && x.puntosOtorgados > 0) partes.push('(llegaste al tope diario)');
        if (x.bonusRacha > 0) partes.push(`🔥 Bonus de racha +${x.bonusRacha}`);
        if (x.nivelSuperado) { $('resTitulo').textContent = root.BlockRoalTema.FRASES.nivel; partes.push(root.BlockRoalTema.FRASES.nivelDetalle(estado.nivelMax + 1)); Sonido.nivel(); if (escena) escena.confeti(); }
        else if (x.creditoGanado > 0) Sonido.monedas();
        if (x.creditoGanado > 0) partes.push(`Ganaste ${peso(x.creditoGanado)} en créditos ROAL`);
        if (x.presupuestoAgotado) partes.push('Los créditos de hoy ya se repartieron entre todos los jugadores. Mañana hay más.');
        $('resDetalle').textContent = partes.join('\n');
    }
    // Reenvía un puntaje que no alcanzó a llegar (sin internet, cierre del navegador…).
    async function enviarPendiente(avisarSiLlega) {
        const p = Guardado.leerPendiente(uidActual);
        if (!p || !funciones) return;
        try {
            const r = await funciones.httpsCallable('juegoEnviarPuntaje')({ sesionId: p.sesionId, puntaje: p.puntaje, movimientos: p.movimientos });
            Guardado.borrarPendiente();
            if (r.data.ok) { estado = { ...estado, ...r.data.estado }; mostrarEstado(); if (avisarSiLlega) { aviso(`Se guardó tu partida anterior (+${fmt(r.data.resultado.puntosOtorgados)} puntos).`); setTimeout(() => aviso(''), 4000); } }
        } catch (e) { if (!esErrorDeRed(e)) Guardado.borrarPendiente(); }
    }

    async function terminarPartida(puntaje, jugadas) {
        Guardado.borrarPartida();
        $('resultado').hidden = false;
        $('resTitulo').textContent = root.BlockRoalTema.FRASES.fin;
        $('resPuntaje').textContent = fmt(puntaje) + ' pts';
        $('resDetalle').textContent = 'Guardando tus puntos…';
        $('btnOtra').disabled = true; $('btnReintentar').hidden = true; $('btnCompartir').hidden = true;
        try {
            if (!sesionId) await sesionPromesa;
            if (!sesionId) throw new Error('La partida no se pudo registrar. Intenta de nuevo.');
            Guardado.pendiente({ uid: uidActual, sesionId, puntaje, movimientos: jugadas, ini: sesionIni || Date.now() }); // por si se corta el internet
            const r = await funciones.httpsCallable('juegoEnviarPuntaje')({ sesionId, puntaje, movimientos: jugadas });
            Guardado.borrarPendiente();
            mostrarResultado(r.data);
        } catch (e) {
            if (esErrorDeRed(e)) { $('resDetalle').textContent = 'No hay conexión. Guardamos tu puntaje en este celular y se envía solo cuando vuelva el internet.'; $('btnReintentar').hidden = false; }
            else { Guardado.borrarPendiente(); $('resDetalle').textContent = e?.message || 'No se pudieron guardar tus puntos.'; }
        }
        $('btnOtra').disabled = false;
    }
    async function reintentar() {
        const p = Guardado.leerPendiente(uidActual);
        if (!p) { $('btnReintentar').hidden = true; return; }
        $('btnReintentar').disabled = true; $('resDetalle').textContent = 'Enviando…';
        try {
            const r = await funciones.httpsCallable('juegoEnviarPuntaje')({ sesionId: p.sesionId, puntaje: p.puntaje, movimientos: p.movimientos });
            Guardado.borrarPendiente(); $('btnReintentar').hidden = true; mostrarResultado(r.data);
        } catch (e) {
            if (esErrorDeRed(e)) $('resDetalle').textContent = 'Sigue sin conexión. Tu puntaje está guardado en este celular; inténtalo de nuevo en un momento.';
            else { Guardado.borrarPendiente(); $('btnReintentar').hidden = true; $('resDetalle').textContent = e?.message || 'No se pudieron guardar tus puntos.'; }
        }
        $('btnReintentar').disabled = false;
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
                // La primera partida arranca con comenzar(): hay que esperar a que el servidor entregue la semilla de las piezas.
                escenaOk(this);
            }
            comenzar() { this.nueva(); }
            update(time, delta) {
                if (this.arrastrando && this.objetivo) { // la pieza sigue al dedo con suavidad (pegada, sin saltos)
                    const k = Math.min(1, 0.5 * ((delta || 16.6) / 16.6)), cn = this.arrastrando.cont;
                    cn.x += (this.objetivo.x - cn.x) * k; cn.y += (this.objetivo.y - cn.y) * k;
                }
                T.marco(this.borde, time, d);
            }
            // Guarda la partida tras cada jugada (solo la semilla y la lista de jugadas: con eso se reconstruye todo): si se cierra o recarga, sigue donde iba.
            guardarPartida() {
                if (this.fin || !sesionId || !uidActual || !Number.isInteger(semilla)) return;
                Guardado.partida({ uid: uidActual, sesionId, semilla, modo: modoActual, ini: sesionIni || Date.now(), movs: this.movs });
            }
            restaurar(g) {
                const e = reproducirHasta({ semilla: g.semilla, jugadas: g.movs });
                if (!e.ok) { Guardado.borrarPartida(); iniciarPartida('libre').then(() => this.nueva()); return; }
                this.grilla = e.grilla; this.rng = e.rng; this.movs = g.movs.slice();
                this.puntos = e.puntos; this.jugadas = e.hechas; this.combo = e.combo; this.fin = false;
                for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) if (this.grilla[i][j] !== -1) this.pintarCelda(i, j, this.grilla[i][j]);
                this.txtPuntos.setText(fmt(this.puntos));
                this.actualizarMeta();
                this.piezas = e.piezas.map((p, i) => this.crearPieza({ shape: p.shape, ing: p.ing }, i));
                this.piezas.forEach((p, i) => {
                    if (e.piezas[i].usada) { p.usada = true; p.cont.destroy(); if (p.zona) p.zona.destroy(); return; }
                    p.cont.setAlpha(0).setScale(0.2); this.tweens.add({ targets: p.cont, alpha: 1, scale: p.home.esc, duration: 320, delay: i * 90, ease: 'Back.Out', onComplete: () => this.flotar(p) });
                });
                const quedan = this.piezas.filter((p) => !p.usada);
                if (!quedan.length) this.repartir();
                else if (!hayJugada(this.grilla, quedan.map((p) => p.shape))) this.terminar();
            }
            nueva() {
                this.grilla = nuevaGrilla(); this.movs = [];
                this.rng = crearRng(Number.isInteger(semilla) ? semilla : Math.floor(Math.random() * 4294967296)); // la semilla del servidor: así la partida se puede repetir y comprobar
                this.puntos = 0; this.jugadas = 0; this.combo = 0; this.fin = false;
                this.celdasImg.forEach((f) => f.forEach((im) => im && im.destroy()));
                this.celdasImg = Array.from({ length: N }, () => Array(N).fill(null));
                (this.piezas || []).forEach((p) => { if (p) { p.cont.destroy(); if (p.zona) p.zona.destroy(); } });
                this.txtPuntos.setText('0');
                this.actualizarMeta();
                if (restauro) { const g = restauro; restauro = null; this.restaurar(g); return; }
                Guardado.borrarPartida();
                this.repartir();
                this.guardarPartida();
            }
            actualizarMeta() {
                const meta = estado ? estado.metaSiguiente : 500;
                if (this.txtMeta.progreso) this.txtMeta.progreso(this.puntos, meta, estado ? estado.nivelMax + 1 : 1);
            }
            repartir() {
                const datos = nuevasPiezas(this.grilla, this.rng);
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
                const pieza = { cont, zona, idx, shape: dd.shape, ing: dd.ing, usada: false, home: { x: cont.x, y: cont.y, esc }, ancho, alto };
                zona.on('pointerdown', (p) => {
                    if (bloqueado) { aviso(mensajeBloqueo, true); return; }
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
                this.movs.push(codificarJugada(pz.idx, r, c));      // registro de la partida: es lo que el servidor repite para comprobar el puntaje
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
                this.guardarPartida();
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
                terminarPartida(this.puntos, this.movs.slice());
            }
        }

        juego = new Phaser.Game({
            type: Phaser.AUTO, parent: 'juegoCanvas', width: W, height: H, transparent: true,
            scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
            input: { touch: { capture: true } }, scene: Escena, render: { antialias: true }
        });
    }

    // ── Compartir el puntaje: tarjeta en imagen (formato historia 1080x1920) + hoja de compartir del celular ──
    const URL_JUEGO = 'https://roalburger.com/juega';
    function cargarImagen(src) { return new Promise((ok) => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => ok(null); im.src = src; }); }
    async function construirTarjeta(d) {
        const W = 1080, H = 1920, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
        const c = cv.getContext('2d');
        try { await Promise.all([document.fonts.load('200px Anton'), document.fonts.load('800 40px Montserrat')]); } catch (_) { /* usa la fuente que haya */ }
        const [foto, logo] = await Promise.all([cargarImagen('juega-fondo.webp'), cargarImagen('isotipo.webp')]);
        // fondo: carbón, foto del local tenue, resplandor naranja y viñeta
        c.fillStyle = '#0e0e10'; c.fillRect(0, 0, W, H);
        if (foto) { const k = Math.max(W / foto.width, H / foto.height), w = foto.width * k, h = foto.height * k; c.globalAlpha = 0.28; c.drawImage(foto, (W - w) / 2, (H - h) / 2, w, h); c.globalAlpha = 1; }
        let g = c.createRadialGradient(W / 2, 140, 40, W / 2, 140, 900); g.addColorStop(0, 'rgba(251,75,8,.42)'); g.addColorStop(1, 'rgba(251,75,8,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
        g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(14,14,16,.2)'); g.addColorStop(0.55, 'rgba(14,14,16,.55)'); g.addColorStop(1, 'rgba(14,14,16,.92)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
        c.textAlign = 'center'; c.textBaseline = 'alphabetic';
        const pastilla = (txt, cx, cy, fondo, color, tam) => { c.font = `800 ${tam}px Montserrat, sans-serif`; const w = c.measureText(txt).width + 80, h = tam + 44; c.fillStyle = fondo; c.beginPath(); c.roundRect(cx - w / 2, cy - h / 2, w, h, h / 2); c.fill(); c.fillStyle = color; c.fillText(txt, cx, cy + tam * 0.35); };
        if (logo) c.drawImage(logo, W / 2 - 90, 130, 180, 180 * logo.height / logo.width);
        // título «BLOCK ROAL» inclinado
        c.save(); c.translate(W / 2, 470); c.transform(1, 0, -0.1, 1, 0, 0); c.font = '400 150px Anton, Impact, sans-serif'; c.lineJoin = 'round'; c.lineWidth = 14; c.strokeStyle = '#0e0e10';
        const a1 = c.measureText('BLOCK ').width, a2 = c.measureText('ROAL').width, x0 = -(a1 + a2) / 2; c.textAlign = 'left';
        c.strokeText('BLOCK ', x0, 0); c.fillStyle = '#fff'; c.fillText('BLOCK ', x0, 0); c.strokeText('ROAL', x0 + a1, 0); c.fillStyle = '#fb4b08'; c.fillText('ROAL', x0 + a1, 0); c.restore();
        pastilla(d.reto ? 'RETO DEL DÍA' : 'MI PARTIDA', W / 2, 600, d.reto ? '#fb4b08' : 'rgba(255,255,255,.14)', '#fff', 46);
        // puntaje enorme
        c.textAlign = 'center'; c.font = '400 430px Anton, Impact, sans-serif'; c.shadowColor = 'rgba(251,75,8,.85)'; c.shadowBlur = 70; c.fillStyle = '#fff'; c.fillText(String(d.puntaje), W / 2, 1020); c.shadowBlur = 0;
        c.font = '800 64px Montserrat, sans-serif'; c.fillStyle = 'rgba(246,235,217,.8)'; c.fillText('P U N T O S', W / 2, 1110);
        if (d.puesto) { c.font = '400 120px Anton, Impact, sans-serif'; c.fillStyle = '#ffc400'; c.fillText(`PUESTO #${d.puesto} DE HOY`, W / 2, 1290); }
        pastilla(`NIVEL ${d.nivel}`, W / 2 - 190, d.puesto ? 1420 : 1330, 'rgba(255,255,255,.14)', '#fff', 46);
        pastilla(`RACHA ${d.racha}`, W / 2 + 190, d.puesto ? 1420 : 1330, 'rgba(255,255,255,.14)', '#fff', 46);
        // llamado a la acción
        c.fillStyle = '#fff'; c.font = '400 150px Anton, Impact, sans-serif'; c.fillText('¿ME GANAS?', W / 2, 1640);
        c.font = '600 46px Montserrat, sans-serif'; c.fillStyle = 'rgba(246,235,217,.9)'; c.fillText('Juega gratis y gana créditos para tu pedido', W / 2, 1720);
        pastilla('roalburger.com/juega', W / 2, 1810, '#fb4b08', '#fff', 54);
        return new Promise((ok) => cv.toBlob((b) => ok(b), 'image/jpeg', 0.92));
    }
    async function compartirPuntaje() {
        if (!ultimoResultado) return;
        const btn = $('btnCompartir'); btn.disabled = true; const txtOriginal = btn.textContent; btn.textContent = 'Preparando…';
        try {
            // En el reto se muestra el puesto de hoy (se consulta al servidor; si falla, la tarjeta sale sin puesto).
            if (ultimoResultado.reto && !ultimoResultado.puesto && funciones) { try { const r = (await funciones.httpsCallable('juegoRanking')({ tipo: 'dia' })).data; if (r.yo) ultimoResultado.puesto = r.yo.pos; } catch (_) { /* sin puesto */ } }
            const blob = await construirTarjeta(ultimoResultado);
            const d = ultimoResultado;
            const texto = `Hice ${fmt(d.puntaje)} puntos en Block ROAL 🍔🔥${d.puesto ? ` (puesto #${d.puesto} del reto de hoy)` : ''} ¿Me ganas? Juega gratis: ${URL_JUEGO}`;
            const archivo = blob ? new File([blob], 'block-roal.jpg', { type: 'image/jpeg' }) : null;
            if (archivo && navigator.canShare && navigator.canShare({ files: [archivo] })) { await navigator.share({ files: [archivo], text: texto, title: 'Block ROAL' }); }
            else if (navigator.share) { await navigator.share({ text: texto, url: URL_JUEGO, title: 'Block ROAL' }); }
            else {
                // Sin hoja de compartir (computador): se descarga la imagen y se copia el texto.
                if (blob) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'block-roal.jpg'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); }
                try { await navigator.clipboard.writeText(texto); } catch (_) { /* sin portapapeles */ }
                aviso('Descargamos tu tarjeta y copiamos el texto. ¡Pégalos donde quieras!'); setTimeout(() => aviso(''), 4500);
            }
        } catch (e) { if (!e || e.name !== 'AbortError') { aviso('No se pudo compartir. Inténtalo de nuevo.', true); setTimeout(() => aviso(''), 3500); } }
        btn.disabled = false; btn.textContent = txtOriginal;
    }
    root.BlockRoalTarjeta = construirTarjeta; // solo para probar

    // ── Modos: libre (práctica) o reto del día (mismas piezas para todos, una sola oportunidad, ranking) ──
    function pintarModos() {
        const reto = $('modoReto'), libre = $('modoLibre');
        if (!reto || !libre) return;
        reto.classList.toggle('on', modoActual === 'reto'); libre.classList.toggle('on', modoActual !== 'reto');
        reto.textContent = estado && estado.retoHecho ? `🏆 Reto ✓ ${fmt(estado.retoPuntaje || 0)}` : '🏆 Reto del día';
        reto.hidden = !!(estado && estado.retoActivo === false);
    }
    async function cambiarModo(modo) {
        if (modo === modoActual) return;
        const enCurso = !!(escena && escena.movs && escena.movs.length > 0 && !escena.fin);
        if (modo === 'reto') {
            if (estado && estado.retoHecho) { aviso('Ya jugaste el reto de hoy. ¡Mañana hay otro!'); setTimeout(() => aviso(''), 3000); abrirRanking('dia'); return; }
            if (!window.confirm((enCurso ? 'Vas a dejar esta partida libre. ' : '') + 'El reto del día tiene UNA sola oportunidad y las mismas piezas para todos. ¿Empezar ahora?')) return;
        } else if (modoActual === 'reto' && enCurso && !window.confirm('Si dejas el reto ahora pierdes tu oportunidad de hoy. ¿Salir?')) return;
        Sonido.clic();
        await enviarPendiente(false);
        await iniciarPartida(modo);
        if (!sesionId && !bloqueado) await iniciarPartida('libre');   // el servidor no dejó empezar el reto: se sigue en libre
        if (estado) { try { await cargarEstado(); } catch (_) { /* se queda con el estado anterior */ } }
        pintarModos();
        if (bloqueado) { aviso(mensajeBloqueo, true); return; }
        if (escena) escena.nueva();
    }
    async function abrirRanking(tipo) {
        const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
        const quedoEn = tipo === 'semana' ? 'semana' : 'dia';
        $('ranking').hidden = false;
        document.querySelectorAll('[data-rank]').forEach((b) => b.classList.toggle('on', b.dataset.rank === quedoEn));
        $('rankTitulo').textContent = quedoEn === 'semana' ? 'Ranking de la semana' : 'Ranking de hoy';
        $('rankLista').innerHTML = '<li class="rk-vacio">Cargando…</li>'; $('rankPremio').hidden = true;
        try {
            const r = (await funciones.httpsCallable('juegoRanking')({ tipo: quedoEn })).data;
            const unidad = quedoEn === 'semana' ? 'pts' : '';
            $('rankLista').innerHTML = r.top.length ? r.top.map((x) => `<li class="${x.yo ? 'yo' : ''}"><span>${x.pos}</span><em>${esc(x.nombre)}</em><b>${fmt(x.valor)} ${unidad}</b></li>`).join('') : '<li class="rk-vacio">Aún no hay nadie. ¡Sé el primero con el reto del día!</li>';
            if (r.yo && !r.top.some((x) => x.yo)) $('rankLista').insertAdjacentHTML('beforeend', `<li class="yo"><span>${r.yo.pos}</span><em>Tú</em><b>${fmt(r.yo.valor)} ${unidad}</b></li>`);
            if (r.premio) { $('rankPremio').textContent = '🎁 ' + r.premio; $('rankPremio').hidden = false; }
        } catch (e) { $('rankLista').innerHTML = `<li class="rk-vacio">${esc(e && e.message || 'No se pudo cargar el ranking.')}</li>`; }
    }

    async function jugarOtra() {
        Sonido.clic();
        $('resultado').hidden = true; $('btnVerRanking').hidden = true; $('btnCompartir').hidden = true;
        await enviarPendiente(false);
        await iniciarPartida('libre');
        if (bloqueado) { $('resTitulo').textContent = 'Hasta mañana'; $('resPuntaje').textContent = ''; $('resDetalle').textContent = mensajeBloqueo; $('btnReintentar').hidden = true; $('resultado').hidden = false; return; }
        if (estado) { try { await cargarEstado(); } catch (_) { /* se queda con el estado anterior */ } }
        pintarModos();
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
        const corta = Guardado.introVistaHoy();                // ya viste la intro completa hoy: versión rápida
        if (corta) $('intro').classList.add('corta');
        let saltoOk; const saltoP = new Promise((r) => { saltoOk = r; });
        const esperar = (ms) => Promise.race([dormir(ms), saltoP]);

        // El navegador solo deja sonar el audio tras un toque del usuario: el toque de «ENTRAR» lo activa y arranca la música de una vez.
        async function entrar() {
            if (entrando) return; entrando = true;
            Sonido.init(true); Sonido.warp(corta); setTimeout(() => Sonido.arrancarMusica(), corta ? 1000 : 2600); intro.acelerar(); Guardado.marcarIntro();
            if (navigator.vibrate) try { navigator.vibrate([30, 40, 60]); } catch (_) { /* sin vibración */ }
            $('btnEntrar').hidden = true; $('introEstado').textContent = '¡Entrando al barrio!';
            await esperar(corta ? 1700 : 3300);
            if (await Promise.race([listoP.then(() => true), dormir(900).then(() => false)]) === false) $('introEstado').textContent = 'Preparando tu partida…';
            await Promise.race([listoP, dormir(10000)]);
            $('app').classList.add('entrar'); $('intro').classList.add('salir');
            setTimeout(() => { intro.parar(); $('intro').hidden = true; }, 900);
        }
        $('btnEntrar').addEventListener('click', entrar);
        $('btnSaltar').addEventListener('click', () => { Sonido.init(true); Sonido.arrancarMusica(); saltoOk(); if (!entrando) entrar(); });
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
        $('btnReintentar').addEventListener('click', reintentar);
        $('btnCompartir').addEventListener('click', compartirPuntaje);
        $('modoReto').addEventListener('click', () => cambiarModo('reto'));
        $('modoLibre').addEventListener('click', () => cambiarModo('libre'));
        $('btnRanking').addEventListener('click', () => abrirRanking('dia'));
        $('btnVerRanking').addEventListener('click', () => abrirRanking('dia'));
        document.querySelectorAll('[data-rank]').forEach((b) => b.addEventListener('click', () => abrirRanking(b.dataset.rank)));
        $('btnRankingCerrar').addEventListener('click', () => { $('ranking').hidden = true; });
        $('ranking').addEventListener('click', (e) => { if (e.target === $('ranking')) $('ranking').hidden = true; });
        window.addEventListener('online', () => enviarPendiente(true));
        firebase.auth().onAuthStateChanged((user) => {
            if (!user) { intro.parar(); $('intro').hidden = true; $('sinSesion').hidden = false; $('app').hidden = true; return; }
            $('sinSesion').hidden = true; $('app').hidden = false;
            if (uidActual === user.uid) return;        // Firebase puede repetir este aviso (renovación del token): no reiniciar nada
            uidActual = user.uid;
            // Todo en paralelo: estado del jugador, sesión de partida y el motor del juego (antes iba uno detrás de otro).
            const pEstado = cargarEstado().then(() => { if (!estado.activo) aviso('El juego está en pausa por ahora. ¡Vuelve pronto!', true); return enviarPendiente(true); });
            const guardada = Guardado.leerPartida(user.uid);
            if (guardada) { sesionId = guardada.sesionId; semilla = guardada.semilla; modoActual = guardada.modo === 'reto' ? 'reto' : 'libre'; sesionIni = guardada.ini; sesionPromesa = Promise.resolve(); restauro = guardada; }   // reanuda donde iba
            else iniciarPartida('libre');
            const pJuego = Promise.all([phaserP, fuentes]).then(() => { if (!juego) crearJuego(); });
            Promise.all([pEstado, pJuego, sesionPromesa, escenaP]).then(() => { pintarModos(); if (escena) escena.comenzar(); }).catch((e) => {
                if (sinCuenta(e)) return;
                aviso(e?.code === 'functions/not-found' ? 'Para jugar necesitas una cuenta ROAL. Crea una al hacer tu primer pedido.' : (e?.message || 'No se pudo cargar el juego.'), true);
            }).finally(() => listoOk());
        });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arrancar); else arrancar();
})(typeof window !== 'undefined' ? window : globalThis);
