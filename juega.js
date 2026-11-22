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

    // ───────────────────────── 2) ESCENA + SERVIDOR ─────────────────────────
    const $ = (id) => document.getElementById(id);
    const fmt = (n) => Number(n || 0).toLocaleString('es-CO');
    const peso = (n) => '$' + fmt(n);

    let estado = null;        // lo que devuelve juegoEstado (el servidor manda)
    let funciones = null;
    let juego = null;         // instancia Phaser
    let sesionId = null;
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

    async function iniciarPartida() {
        sesionId = null;
        try { const r = await funciones.httpsCallable('juegoIniciar')({}); sesionId = r.data.sesionId; aviso(''); }
        catch (e) { aviso(e?.message || 'No se pudo iniciar la partida.', true); }
    }

    async function terminarPartida(puntaje, jugadas) {
        const panel = $('resultado');
        panel.hidden = false;
        $('resTitulo').textContent = 'Fin de la partida';
        $('resPuntaje').textContent = fmt(puntaje) + ' pts';
        $('resDetalle').textContent = 'Guardando tus puntos…';
        $('btnOtra').disabled = true;
        try {
            if (!sesionId) throw new Error('La partida no se pudo registrar. Intenta de nuevo.');
            const r = await funciones.httpsCallable('juegoEnviarPuntaje')({ sesionId, puntaje, jugadas });
            if (!r.data.ok) { $('resDetalle').textContent = 'Esta partida no se pudo validar, así que no suma puntos.'; }
            else {
                estado = r.data.estado; mostrarEstado();
                const x = r.data.resultado, partes = [];
                partes.push(x.puntosOtorgados > 0 ? `+${fmt(x.puntosOtorgados)} puntos ROAL` : 'Hoy ya llegaste al tope de puntos');
                if (x.topeAlcanzado && x.puntosOtorgados > 0) partes.push('(llegaste al tope diario)');
                if (x.bonusRacha > 0) partes.push(`🔥 Bonus de racha +${x.bonusRacha}`);
                if (x.nivelSuperado) { $('resTitulo').textContent = '¡Nivel superado!'; partes.push(`🏆 Pasaste al nivel ${estado.nivelMax + 1}`); }
                if (x.creditoGanado > 0) partes.push(`Ganaste ${peso(x.creditoGanado)} en créditos ROAL`);
                $('resDetalle').textContent = partes.join('\n');
            }
        } catch (e) { $('resDetalle').textContent = e?.message || 'No se pudieron guardar tus puntos.'; }
        $('btnOtra').disabled = false;
    }

    function crearJuego() {
        const W = 360, H = 640, CELDA = 40, GX = 20, GY = 96, BANDEJA_Y = 480;
        const COLORES = { pan: 0xd98a2b, carne: 0x6b3a22, queso: 0xf2b705, tequeno: 0xc9791e, arepa: 0xe8d3a8 };
        const FONDO = 0x2a1810, TABLERO = 0x3a2418, CASILLA = 0x4a2e1e;

        class Escena extends Phaser.Scene {
            create() {
                escena = this;
                this.cameras.main.setBackgroundColor(FONDO);
                this.texturas();
                this.add.rectangle(GX + (N * CELDA) / 2, GY + (N * CELDA) / 2, N * CELDA + 8, N * CELDA + 8, TABLERO).setStrokeStyle(2, 0xff6b00);
                this.fondoCeldas = [];
                for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) this.add.rectangle(GX + j * CELDA + CELDA / 2, GY + i * CELDA + CELDA / 2, CELDA - 3, CELDA - 3, CASILLA);
                this.celdasImg = Array.from({ length: N }, () => Array(N).fill(null));
                this.txtPuntos = this.add.text(W / 2, 28, '0', { fontFamily: 'Anton', fontSize: '44px', color: '#ff8a1f' }).setOrigin(0.5);
                this.txtMeta = this.add.text(W / 2, 66, '', { fontFamily: 'Montserrat', fontSize: '13px', color: '#e8d3a8' }).setOrigin(0.5);
                this.fantasma = this.add.graphics().setDepth(5);
                this.input.on('pointermove', (p) => this.arrastrar(p));
                this.input.on('pointerup', () => this.soltar());
                this.input.on('pointerupoutside', () => this.soltar());
                this.nueva();
            }
            texturas() {
                const g = this.make.graphics({ x: 0, y: 0, add: false });
                const S = CELDA - 3;
                INGREDIENTES.forEach((nombre) => {
                    g.clear();
                    g.fillStyle(COLORES[nombre], 1).fillRoundedRect(0, 0, S, S, 7);
                    if (nombre === 'pan') {                                  // pan: domo con ajonjolí
                        g.fillStyle(0xf0b25a, 1).fillRoundedRect(3, 3, S - 6, S / 2, 9);
                        g.fillStyle(0xfff3d6, 1); [[10, 9], [18, 7], [26, 10], [14, 16], [23, 16]].forEach(([x, y]) => g.fillEllipse(x, y, 4, 2.4));
                    } else if (nombre === 'carne') {                          // carne: parrilla
                        g.fillStyle(0x3b1d10, 1); [9, 18, 27].forEach((y) => g.fillRect(4, y, S - 8, 3));
                        g.fillStyle(0x8c5033, 1).fillRect(5, 5, S - 10, 2);
                    } else if (nombre === 'queso') {                          // queso: huecos
                        g.fillStyle(0xffd84a, 1).fillRoundedRect(2, 2, S - 4, S - 4, 6);
                        g.fillStyle(0xc98a00, 1); [[10, 10, 4], [25, 14, 3], [16, 25, 4], [28, 28, 2.5]].forEach(([x, y, r]) => g.fillCircle(x, y, r));
                    } else if (nombre === 'tequeno') {                        // tequeño: masa frita en rombos
                        g.lineStyle(2, 0xf3b25c, 1);
                        for (let k = -S; k < S * 2; k += 9) { g.lineBetween(k, 0, k + S, S); g.lineBetween(k, S, k + S, 0); }
                        g.fillStyle(0x8a4a10, 0.5).fillRect(0, S - 5, S, 5);
                    } else {                                                  // arepa: redonda con tostado
                        g.fillStyle(0xf6e7c4, 1).fillCircle(S / 2, S / 2, S / 2 - 3);
                        g.fillStyle(0xc99a55, 1); [[12, 14, 3], [24, 20, 3.5], [16, 26, 2.5], [26, 10, 2]].forEach(([x, y, r]) => g.fillCircle(x, y, r));
                    }
                    g.lineStyle(1.5, 0x000000, 0.28).strokeRoundedRect(0.75, 0.75, S - 1.5, S - 1.5, 7);
                    g.generateTexture('ing_' + nombre, S, S);
                });
                g.destroy();
            }
            nueva() {
                this.grilla = nuevaGrilla();
                this.puntos = 0; this.jugadas = 0; this.combo = 0; this.fin = false;
                this.celdasImg.forEach((f) => f.forEach((im) => im && im.destroy()));
                this.celdasImg = Array.from({ length: N }, () => Array(N).fill(null));
                (this.piezas || []).forEach((p) => p && p.cont.destroy());
                this.txtPuntos.setText('0');
                this.actualizarMeta();
                this.repartir();
            }
            actualizarMeta() {
                const meta = estado ? estado.metaSiguiente : 500;
                this.txtMeta.setText(`Meta nivel ${estado ? estado.nivelMax + 1 : 1}: ${fmt(meta)} pts`);
                this.txtMeta.setColor(this.puntos >= meta ? '#7dffa1' : '#e8d3a8');
            }
            repartir() {
                const datos = nuevasPiezas(this.grilla);
                this.piezas = datos.map((d, i) => this.crearPieza(d, i));
                if (!hayJugada(this.grilla, this.piezas.map((p) => p.shape))) this.terminar();
            }
            crearPieza(d, idx) {
                const esc = 0.55, ancho = d.shape[0].length * CELDA, alto = d.shape.length * CELDA;
                const cx = 60 + idx * 120;
                const cont = this.add.container(cx - (ancho * esc) / 2, BANDEJA_Y + 60 - (alto * esc) / 2).setScale(esc);
                for (let i = 0; i < d.shape.length; i++) for (let j = 0; j < d.shape[0].length; j++) {
                    if (d.shape[i][j]) cont.add(this.add.image(j * CELDA + (CELDA - 3) / 2, i * CELDA + (CELDA - 3) / 2, 'ing_' + INGREDIENTES[d.ing]));
                }
                cont.setSize(ancho, alto).setInteractive(new Phaser.Geom.Rectangle(-10, -10, ancho + 20, alto + 20), Phaser.Geom.Rectangle.Contains);
                const pieza = { cont, shape: d.shape, ing: d.ing, usada: false, home: { x: cont.x, y: cont.y, esc }, ancho, alto };
                cont.on('pointerdown', (p) => { if (this.fin || pieza.usada) return; this.arrastrando = pieza; cont.setScale(1).setDepth(10); this.arrastrar(p); });
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
                pz.cont.setPosition(pos.x, pos.y);
                this.fantasma.clear();
                if (puedeColocar(this.grilla, pz.shape, pos.r, pos.c)) {
                    this.fantasma.fillStyle(0xff6b00, 0.35);
                    for (let i = 0; i < pz.shape.length; i++) for (let j = 0; j < pz.shape[0].length; j++) if (pz.shape[i][j]) this.fantasma.fillRoundedRect(GX + (pos.c + j) * CELDA, GY + (pos.r + i) * CELDA, CELDA - 3, CELDA - 3, 6);
                }
            }
            soltar() {
                const pz = this.arrastrando; if (!pz) return;
                this.arrastrando = null; this.fantasma.clear();
                const c = Math.round((pz.cont.x - GX) / CELDA), r = Math.round((pz.cont.y - GY) / CELDA);
                if (!puedeColocar(this.grilla, pz.shape, r, c)) {
                    this.tweens.add({ targets: pz.cont, x: pz.home.x, y: pz.home.y, scale: pz.home.esc, duration: 160 });
                    pz.cont.setDepth(0); return;
                }
                this.aplicar(pz, r, c);
            }
            pintarCelda(i, j, ing) {
                const im = this.add.image(GX + j * CELDA + CELDA / 2, GY + i * CELDA + CELDA / 2, 'ing_' + INGREDIENTES[ing]);
                this.celdasImg[i][j] = im; return im;
            }
            aplicar(pz, r, c) {
                colocar(this.grilla, pz.shape, r, c, pz.ing);
                for (let i = 0; i < pz.shape.length; i++) for (let j = 0; j < pz.shape[0].length; j++) if (pz.shape[i][j]) this.pintarCelda(r + i, c + j, pz.ing);
                pz.usada = true; pz.cont.destroy();
                const l = lineasLlenas(this.grilla);
                const nLineas = l.filas.length + l.cols.length;
                if (nLineas > 0) this.combo += 1; else this.combo = 0;
                const gan = puntosJugada({ casillas: celdas(pz.shape), lineas: nLineas, combo: this.combo - 1 });
                this.puntos += gan; this.jugadas += 1;
                if (nLineas > 0) {
                    borrarLineas(this.grilla, l).forEach(([i, j]) => { const im = this.celdasImg[i][j]; if (im) { this.celdasImg[i][j] = null; this.tweens.add({ targets: im, alpha: 0, scale: 1.5, duration: 220, onComplete: () => im.destroy() }); } });
                    const t = this.add.text(W / 2, GY + (N * CELDA) / 2, this.combo > 1 ? `¡COMBO x${this.combo}!\n+${gan}` : `+${gan}`, { fontFamily: 'Anton', fontSize: '34px', color: '#ffd84a', align: 'center', stroke: '#2a1810', strokeThickness: 5 }).setOrigin(0.5).setDepth(20);
                    this.tweens.add({ targets: t, y: t.y - 60, alpha: 0, duration: 900, onComplete: () => t.destroy() });
                    if (navigator.vibrate) try { navigator.vibrate(25); } catch (_) { /* sin vibración */ }
                }
                this.txtPuntos.setText(fmt(this.puntos));
                this.actualizarMeta();
                const quedan = this.piezas.filter((p) => !p.usada);
                if (!quedan.length) this.repartir();
                else if (!hayJugada(this.grilla, quedan.map((p) => p.shape))) this.terminar();
            }
            terminar() {
                if (this.fin) return;
                this.fin = true;
                terminarPartida(this.puntos, this.jugadas);
            }
        }

        juego = new Phaser.Game({
            type: Phaser.AUTO, parent: 'juegoCanvas', width: W, height: H, backgroundColor: '#2a1810',
            scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
            input: { touch: { capture: true } }, scene: Escena, render: { antialias: true }
        });
    }

    async function jugarOtra() {
        $('resultado').hidden = true;
        await iniciarPartida();
        if (estado) { try { await cargarEstado(); } catch (_) { /* se queda con el estado anterior */ } }
        if (escena) escena.nueva();
    }

    async function arrancar() {
        const fuentes = Promise.all([document.fonts.load('44px Anton'), document.fonts.load('600 14px Montserrat')]).catch(() => {});
        if (!window.firebase || !window.FIREBASE_CONFIG) { aviso('No se pudo cargar el servicio. Recarga la página.', true); return; }
        // Solo app + auth + functions (esta página no carga Firestore): no se usa initFirebaseServices() porque exige el SDK de Firestore.
        if (!firebase.apps.length) firebase.initializeApp(window.FIREBASE_CONFIG);
        funciones = firebase.app().functions('us-central1');
        $('btnOtra').addEventListener('click', jugarOtra);
        firebase.auth().onAuthStateChanged(async (user) => {
            if (!user) { $('sinSesion').hidden = false; $('app').hidden = true; return; }
            $('sinSesion').hidden = true; $('app').hidden = false;
            try {
                await cargarEstado();
                if (!estado.activo) { aviso('El juego está en pausa por ahora. ¡Vuelve pronto!', true); return; }
                await fuentes;
                if (!juego) crearJuego();
                await iniciarPartida();
            } catch (e) {
                aviso(e?.code === 'functions/not-found' ? 'Para jugar necesitas una cuenta ROAL. Crea una al hacer tu primer pedido.' : (e?.message || 'No se pudo cargar el juego.'), true);
            }
        });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arrancar); else arrancar();
})(typeof window !== 'undefined' ? window : globalThis);
