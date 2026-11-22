/* Block ROAL — TEMA VISUAL "Arcade urbano venezolano" (versión con el fondo ilustrado de ROAL).
 * TODO lo que se ve del juego vive aquí y en juega-tema.css: el fondo (juega-fondo.webp, la caricatura del local), los marcadores sobre esa imagen,
 * las baldosas, el marco animado, las frases y la intro. La lógica (tablero, piezas, puntos, créditos, rachas, servidor) está en juega.js y NO depende
 * de cómo se vea: para rediseñar se cambia la imagen / este archivo / el CSS, sin tocar el juego.
 *
 * Cómo está armada la escena: un "escenario" de 1024x1536 px de diseño (el tamaño de la imagen), escalado para caber en la pantalla. Sobre la imagen van
 * los marcadores (HTML) y un lienzo de Phaser que cubre SOLO el tablero y la bandeja de piezas, alineado con el marco dibujado en la imagen.
 * Contrato con juega.js: PAL, CONFETI, FRASES, FUENTES, FUENTES_A_CARGAR, estiloPopup(), colorMeta(), cargar(), texturas(), fondo(), tablero(), cabecera(),
 * marco(), ajustarEscena(), iniciarIntro(). La geometría (d = {W,H,CELDA,GX,GY,N,BANDEJA_Y,CX_BANDEJA}) la define juega.js y aquí solo se lee.
 */
(function (root) {
    'use strict';

    // ── Paleta ROAL ──
    const C = { naranja: 0xfb4b08, amarillo: 0xffc400, azul: 0x1f6bff, carbon: 0x121214, metal: 0x8a8f98, crema: 0xf6ebd9 };
    const PAL = { pan: 0xfb4b08, carne: 0xc1272d, queso: 0xffc400, tequeno: 0x19b36b, arepa: 0x1f6bff }; // color de cada baldosa (también de partículas y sombra de arrastre)
    const CONFETI = [C.naranja, C.amarillo, C.azul, C.crema, 0xffffff];
    const FUENTES = { titulo: 'Anton, Impact, sans-serif', marcador: '"Permanent Marker", Anton, cursive', texto: 'Montserrat, system-ui, sans-serif' };
    const FUENTES_A_CARGAR = ['44px Anton', '800 14px Montserrat', '20px "Permanent Marker"'];
    const FRASES = {
        doble: '¡DOBLE, VALE!', triple: '¡BURDA DE FINO!', combo: (n) => `¡COMBO x${n}!`,
        fin: '¡Se acabó, mi pana!', nivel: '¡Nivel superado, qué fino!', nivelDetalle: (n) => `🏆 Pasaste al nivel ${n}, ¡burda de bueno!`, otra: '¡Otra, vale!'
    };
    const COLORES_POPUP = ['#ffc400', '#6aa5ff', '#ff7a45', '#fff1c9'];
    const hex = (n) => '#' + n.toString(16).padStart(6, '0');

    const estiloPopup = (grande) => ({ fontFamily: FUENTES.titulo, fontSize: grande ? '40px' : '34px', align: 'center', stroke: '#121214', strokeThickness: 7, padding: { x: 30, y: 24 } });
    const colorMeta = (alcanzada) => (alcanzada ? '#0b6b3a' : '#121214');

    // ── Escenario: 1024x1536 de diseño, escalado para que el marco del tablero siempre entre completo (aunque se recorten los lados del fondo) ──
    const ESC = { w: 1024, h: 1536, anchoMarco: 720 };
    function ajustarEscena() {
        const st = document.getElementById('escena'); if (!st) return;
        const vw = window.innerWidth, vh = window.innerHeight;
        const s = Math.min(vh / ESC.h, vw / ESC.anchoMarco);
        st.style.transform = `translate(${(vw - ESC.w * s) / 2}px, ${Math.max(0, (vh - ESC.h * s) / 2)}px) scale(${s})`;
    }

    // ── Carga de imágenes del tema (la llama Escena.preload): el fondo va en HTML, aquí no hay nada que cargar ──
    function cargar() { /* sin imágenes de Phaser */ }

    // ── Baldosas arcade: cara de color con brillo, borde oscuro abajo e ícono del ingrediente ──
    function baldosa(g, S, col) {
        const oscuro = Phaser.Display.Color.IntegerToColor(col).darken(38).color;
        g.fillStyle(0x000000, 0.4).fillRoundedRect(1, 2, S - 1, S - 1, 8);
        g.fillStyle(oscuro, 1).fillRoundedRect(0, 0, S, S, 8);
        g.fillStyle(col, 1).fillRoundedRect(1.5, 1.5, S - 3, S - 5, 7);
        g.fillStyle(0xffffff, 0.3).fillRoundedRect(3, 3, S - 6, (S - 5) / 2.1, { tl: 6, tr: 6, bl: 3, br: 3 });
        g.lineStyle(1.5, 0x000000, 0.55).strokeRoundedRect(0.75, 0.75, S - 1.5, S - 1.5, 8);
    }
    const ICONOS = {
        pan(g, c) { // hamburguesa
            g.fillStyle(0xf1b24a, 1).fillRoundedRect(c - 12, c - 12, 24, 10, { tl: 11, tr: 11, bl: 2, br: 2 });
            g.fillStyle(0xfff3d6, 1); [[-6, -9], [0, -10], [6, -9], [-3, -6], [4, -6]].forEach(([x, y]) => g.fillEllipse(c + x, c + y, 3.4, 2));
            g.fillStyle(0x6ccf3a, 1).fillRoundedRect(c - 13, c - 2, 26, 3.4, 2);
            g.fillStyle(0x5a2a12, 1).fillRoundedRect(c - 12, c + 1.4, 24, 5, 2);
            g.fillStyle(0xf1b24a, 1).fillRoundedRect(c - 11, c + 6.6, 22, 5, { tl: 1, tr: 1, bl: 5, br: 5 });
        },
        carne(g, c) { // carne a la parrilla
            g.fillStyle(0x6b2d12, 1).fillCircle(c, c, 12);
            g.lineStyle(2.4, 0x2e1208, 1); [-6, 0, 6].forEach((o) => g.lineBetween(c - 10, c + o + 5, c + 10, c + o - 5));
            g.fillStyle(0xffffff, 0.22).fillEllipse(c - 4, c - 7, 10, 4);
        },
        queso(g, c) { // cuña de queso
            g.fillStyle(0xfff0a8, 1).fillTriangle(c - 13, c + 9, c + 13, c + 9, c + 13, c - 8);
            g.fillStyle(0xffe066, 1).fillTriangle(c - 13, c + 9, c + 13, c - 8, c - 13, c - 2);
            g.fillStyle(0xe0a800, 1); [[7, 3, 2.6], [1, 5, 2], [9, -3, 1.8]].forEach(([x, y, r]) => g.fillCircle(c + x, c + y, r));
        },
        tequeno(g, c) { // tres tequeños dorados
            [[-9, -10, 22], [-2.5, -12, 24], [4, -9, 21]].forEach(([x, y, l]) => {
                g.fillStyle(0xb87a1c, 1).fillRoundedRect(c + x - 1, y + c - 1, 7.6, l + 2, 3.4);
                g.fillStyle(0xf7c35a, 1).fillRoundedRect(c + x, y + c, 5.6, l, 2.8);
                g.fillStyle(0xffffff, 0.35).fillRect(c + x + 1, y + c + 2, 1.4, l - 4);
            });
        },
        arepa(g, c) { // arepa con tostado
            g.fillStyle(0xf6e6c4, 1).fillCircle(c, c, 12);
            g.fillStyle(0xc08a42, 1); [[-5, -4, 2.4], [4, -2, 2.8], [-2, 5, 2.2], [6, 6, 1.8], [-7, 4, 1.6]].forEach(([x, y, r]) => g.fillCircle(c + x, c + y, r));
            g.lineStyle(1.5, 0xd9b878, 1).strokeCircle(c, c, 12);
        }
    };

    function texturas(scene, d) {
        const g = scene.make.graphics({ x: 0, y: 0, add: false });
        const S = d.CELDA - 3;
        d.INGREDIENTES.forEach((n) => { g.clear(); baldosa(g, S, PAL[n]); ICONOS[n](g, S / 2); g.generateTexture('ing_' + n, S, S); });
        g.clear(); g.fillStyle(0xffffff, 1).fillCircle(5, 5, 5); g.generateTexture('chispa', 10, 10);
        g.destroy();
    }

    // ── Fondo: lo pone la imagen (HTML). Phaser va transparente; no dibuja nada aquí ──
    function fondo() { /* el fondo es juega-fondo.webp, debajo del lienzo */ }

    // ── Tablero y bandeja: tapan lo dibujado de ejemplo en la imagen con paneles oscuros y dibujan las casillas reales ──
    function tablero(scene, d) {
        const { GX, GY, N, CELDA, CX_BANDEJA, BANDEJA_Y } = d;
        scene.add.rectangle(187.5, 174.5, 340, 322, 0x0d0d10, 1).setDepth(1);                     // interior del tablero
        for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) scene.add.rectangle(GX + j * CELDA + CELDA / 2, GY + i * CELDA + CELDA / 2, CELDA - 3, CELDA - 3, 0x17171c, 1).setStrokeStyle(1, 0x2c2c34, 1).setDepth(1);
        CX_BANDEJA.forEach((cx) => {                                                                // ranuras de las 3 piezas
            const s = scene.add.graphics().setDepth(1);
            s.fillStyle(0x110e0c, 1).fillRoundedRect(cx - 54, BANDEJA_Y + 60 - 48, 108, 98, 12);
            s.fillStyle(0xffffff, 0.04).fillRoundedRect(cx - 50, BANDEJA_Y + 60 - 44, 100, 26, 9);
        });
    }

    // ── Marcador: puntaje y cinta de meta son HTML sobre la imagen. Devuelve objetos con la misma interfaz que usaba juega.js ──
    function cabecera() {
        const pEl = document.getElementById('uiPuntos'), mEl = document.getElementById('uiMeta');
        const nada = { setText() {}, setColor() {}, pulso() {} };
        if (!pEl || !mEl) return { puntos: nada, meta: nada };
        return {
            puntos: {
                setText(t) { pEl.textContent = t; const n = String(t).length; pEl.style.fontSize = n > 5 ? '54px' : (n > 4 ? '64px' : '80px'); },
                pulso() { pEl.classList.remove('pulso'); void pEl.offsetWidth; pEl.classList.add('pulso'); }
            },
            meta: { setText(t) { mEl.textContent = t; }, setColor(c) { mEl.style.color = c; } }
        };
    }

    // ── Marco animado: neón naranja que pulsa y un destello que le da la vuelta al marco dibujado en la imagen ──
    function marco(g, time, d) {
        const x0 = 2.5, y0 = 2.5, w = d.W - 5, h = 348, per = 2 * (w + h), r = 14;
        const pulso = 0.8 + 0.2 * Math.sin(time / 260);
        g.clear();
        [[12, 0.10], [7, 0.16], [4, 0.24]].forEach(([ancho, a]) => { g.lineStyle(ancho, C.naranja, a * pulso); g.strokeRoundedRect(x0, y0, w, h, r); });
        g.lineStyle(1.4, 0xffe2c2, 0.85 * pulso).strokeRoundedRect(x0, y0, w, h, r);
        const pt = (t) => { let s = (((t % 1) + 1) % 1) * per; if (s < w) return [x0 + s, y0]; s -= w; if (s < h) return [x0 + w, y0 + s]; s -= h; if (s < w) return [x0 + w - s, y0 + h]; s -= w; return [x0, y0 + h - s]; };
        const cab = (time / 2600) % 1;
        for (let k = 0; k < 16; k++) { const p = pt(cab - k * 0.006), q = pt(cab - (k + 1) * 0.006); g.lineStyle(4.5, 0xffd34d, 1 - k / 16); g.lineBetween(p[0], p[1], q[0], q[1]); }
    }

    // ── Intro: el barrio de noche (canvas 2D, liviano: no necesita Phaser ni Firebase) ──
    function iniciarIntro(cv) {
        if (!cv) return { acelerar() {}, parar() {} };
        const c = cv.getContext('2d'); let w = 0, h = 0, activo = true, vel = 0.4, zoom = 1, desp = 0, entrando = false;
        const FACHADAS = ['#fb4b08', '#ffc400', '#1f6bff', '#f6ebd9', '#c1272d', '#19b36b', '#ff8a3c', '#18a0c8'];
        let capas = [], estrellas = [];
        const construir = () => {
            w = cv.width = window.innerWidth; h = cv.height = window.innerHeight;
            const capa = (par, base, hmin, hmax, colores, oscuro) => { const casas = []; let x = 0; while (x < w * 2.4) { const cw = 46 + Math.random() * 54, ch = hmin + Math.random() * (hmax - hmin); casas.push({ x, w: cw, h: ch, col: colores[Math.floor(Math.random() * colores.length)], tanque: Math.random() < 0.3, ant: Math.random() < 0.2, vent: Array.from({ length: 40 }, () => Math.random()) }); x += cw + 2; } return { par, base, casas, ancho: x, oscuro }; };
            capas = [capa(0.25, h * 0.64, 70, 170, ['#14246e', '#1b2d80', '#101c5a'], true), capa(0.55, h * 0.78, 80, 190, ['#3a1d6e', '#5a2a7a', '#2c2070', '#7a2a4a'], true), capa(1, h * 1.0, 100, 230, FACHADAS, false)];
            estrellas = Array.from({ length: 70 }, () => ({ x: Math.random() * w, y: Math.random() * h * 0.5, r: Math.random() * 1.4 + 0.4, f: Math.random() * 6 }));
        };
        construir(); window.addEventListener('resize', construir);
        const t0 = performance.now();
        (function dibujar() {
            if (!activo) return;
            const t = (performance.now() - t0) / 1000;
            if (entrando) { vel = Math.min(16, vel * 1.06 + 0.1); zoom = Math.min(2.4, zoom + 0.012); }
            desp += vel;
            c.setTransform(1, 0, 0, 1, 0, 0);
            const cielo = c.createLinearGradient(0, 0, 0, h); cielo.addColorStop(0, '#0b1650'); cielo.addColorStop(0.4, '#2d2a86'); cielo.addColorStop(0.72, '#fb4b08'); cielo.addColorStop(1, '#ffb000');
            c.fillStyle = cielo; c.fillRect(0, 0, w, h);
            c.setTransform(zoom, 0, 0, zoom, (w - w * zoom) / 2, (h - h * zoom) * 0.75);
            for (const e of estrellas) { c.globalAlpha = 0.35 + 0.65 * Math.abs(Math.sin(t * 1.6 + e.f)); c.fillStyle = '#fff'; c.fillRect(e.x, e.y, e.r, e.r); }
            c.globalAlpha = 1;
            const sol = c.createRadialGradient(w * 0.5, h * 0.7, 10, w * 0.5, h * 0.7, w * 0.8); sol.addColorStop(0, 'rgba(255,200,80,.55)'); sol.addColorStop(1, 'rgba(255,200,80,0)'); c.fillStyle = sol; c.fillRect(0, 0, w, h);
            for (const L of capas) {
                for (const k of L.casas) {
                    const x = ((k.x - desp * L.par) % L.ancho + L.ancho) % L.ancho - 80;
                    if (x > w + 80) continue;
                    const y = L.base - k.h;
                    c.fillStyle = k.col; c.fillRect(x, y, k.w, k.h + 4);
                    c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(x, y, k.w, 6);
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
            c.setTransform(1, 0, 0, 1, 0, 0);
            [[0.07, 26], [0.16, 34]].forEach(([fy, caida], hilo) => { // banderines de fiesta
                const y0 = h * fy; c.strokeStyle = 'rgba(0,0,0,.55)'; c.lineWidth = 1.5; c.beginPath();
                for (let x = 0; x <= w; x += 6) { const y = y0 + Math.sin((x / w) * Math.PI) * caida; x ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke();
                for (let x = 12, i = 0; x < w; x += 26, i++) {
                    const y = y0 + Math.sin((x / w) * Math.PI) * caida, bal = Math.sin(t * 2 + i + hilo) * 3;
                    c.fillStyle = ['#ffc400', '#1f6bff', '#fb4b08'][(i + hilo) % 3]; c.beginPath(); c.moveTo(x - 9, y); c.lineTo(x + 9, y); c.lineTo(x + bal, y + 20); c.closePath(); c.fill();
                }
            });
            const vig = c.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h * 0.85); vig.addColorStop(0, 'rgba(0,0,0,0)'); vig.addColorStop(1, 'rgba(0,0,0,.45)'); c.fillStyle = vig; c.fillRect(0, 0, w, h);
            requestAnimationFrame(dibujar);
        })();
        return { acelerar() { entrando = true; }, parar() { activo = false; window.removeEventListener('resize', construir); } };
    }

    root.BlockRoalTema = { nombre: 'arcade-urbano-venezolano', C, PAL, CONFETI, FUENTES, FUENTES_A_CARGAR, FRASES, COLORES_POPUP, estiloPopup, colorMeta, cargar, texturas, fondo, tablero, cabecera, marco, ajustarEscena, iniciarIntro };
})(typeof window !== 'undefined' ? window : globalThis);
