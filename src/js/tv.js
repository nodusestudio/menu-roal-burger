// Pantalla de TV del local (/tv). Solo LECTURA de productos, categorías y promos_2x1 (las mismas colecciones
// públicas que usa el menú). Rota un producto cada 8 s con foto, ingredientes y precio.
//
// Fase 1. Fase 2 (no implementada): videos entre productos y control desde el admin de qué sale, en qué orden
// y cuánto dura (hoy el orden es el campo `order` de cada producto y la duración es fija).
//
// Se mantiene en ES2017 (build con esbuild) porque los navegadores de las TV suelen ser viejos.
(function () {
    'use strict';

    var ROTACION_MS = 8000;
    // Mismo cierre que el Festival Sabe a Quindío en script-v2.js (FESTIVAL_TRIFASICA_HASTA).
    var FESTIVAL_HASTA = Date.parse('2026-11-08T23:59:59-05:00');
    var CACHE_KEY = 'roal_tv_cache_v1';
    var RECARGA_MS = 6 * 60 * 60 * 1000; // por si hay una versión nueva de la página

    var stage = document.getElementById('stage');
    var panel = document.getElementById('panel');
    var barra = document.getElementById('barra');
    var fotos = [document.getElementById('fotoA'), document.getElementById('fotoB')];

    var state = { productos: [], categorias: [], promos: [] };
    var lista = [];
    var actualId = null;
    var idx = -1;
    var capa = 0;
    var timer = null;
    var enCurso = false; // hay un producto cargando su foto: evita arrancar dos ciclos a la vez (los 3 listeners disparan reconstruir)
    var wakeLock = null;

    function norm(s) {
        return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    }

    // ── Escala 1920×1080 a cualquier pantalla (se centra con bandas negras si no es 16:9) ──
    function ajustar() {
        var s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
        var x = (window.innerWidth - 1920 * s) / 2;
        var y = (window.innerHeight - 1080 * s) / 2;
        stage.style.transform = 'translate(' + x + 'px,' + y + 'px) scale(' + s + ')';
    }
    window.addEventListener('resize', ajustar);
    ajustar();

    // ── Datos ──
    function slimProducto(d) {
        var p = d.promo2x1 || {};
        return {
            id: d.id, nombre: d.nombre, precio: d.precio, categoria: d.categoria, estado: d.estado,
            es_destacado: d.es_destacado === true, image_url: d.image_url, descripcion: d.descripcion,
            order: d.order, promo2x1: { activo: p.activo === true, image_url: p.image_url || '' }
        };
    }

    function guardarCache() {
        try { localStorage.setItem(CACHE_KEY, JSON.stringify(state)); } catch (_) { /* sin almacenamiento */ }
    }
    function cargarCache() {
        try {
            var raw = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
            if (raw && Array.isArray(raw.productos)) {
                state.productos = raw.productos;
                state.categorias = Array.isArray(raw.categorias) ? raw.categorias : [];
                state.promos = Array.isArray(raw.promos) ? raw.promos : [];
            }
        } catch (_) { /* cache dañado: se ignora */ }
    }

    function resolverImg(u) {
        var s = String(u || '').trim().replace(/\\/g, '/');
        if (!s) return '';
        if (/^(https?:)?\/\//i.test(s) || s.indexOf('data:') === 0 || s.indexOf('blob:') === 0) return s;
        return '/' + s.replace(/^\.?\//, '');
    }

    // La descripción es texto libre ("¼ lb de carne, queso, tocineta y salsa de la casa."): se parte en etiquetas.
    function parseIngredientes(texto) {
        var t = String(texto || '')
            .replace(/[\u2600-\u27BF\uFE0F]|[\uD83C-\uDBFF][\uDC00-\uDFFF]/g, ',') // emojis (check, pollo, etc.) como separador
            .replace(/[\r\n•·]+/g, ',')
            .replace(/\.\s+/g, ',')
            .replace(/[:()]/g, ',');
        var partes = t.split(',');
        var salida = [];
        for (var i = 0; i < partes.length; i++) {
            var items = partes[i].split(/\s+y\s+/i);
            for (var j = 0; j < items.length; j++) {
                var it = items[j].trim().replace(/^(incluye|lleva|con|y|acompa[nñ]ado de)\s+/i, '').replace(/[.;]+$/, '').trim();
                if (!it || it.length < 3 || it.length > 34) continue;
                if (/^(tama[nñ]o|tama[nñ]os|disponible|incluye|pan |salsas aparte|una |un |peque[nñ]a|mediana|grande|el cl[aá]sico|\d+\s*(gr|g|kg|ml|cm)\b)/i.test(it)) continue;
                it = it.charAt(0).toUpperCase() + it.slice(1);
                if (salida.indexOf(it) === -1) salida.push(it);
            }
        }
        return salida.slice(0, 8);
    }

    function categoriaInactiva(cat) {
        var k = norm(cat);
        if (!k) return false;
        for (var i = 0; i < state.categorias.length; i++) {
            if (norm(state.categorias[i].name) === k) return state.categorias[i].active === false;
        }
        return false;
    }

    function construirLista() {
        var festivalActivo = Date.now() <= FESTIVAL_HASTA;
        var out = [];
        state.productos.forEach(function (p) {
            if (String(p.estado || 'active').toLowerCase() === 'paused') return;
            var img = String(p.image_url || '').trim();
            if (!img || /(^|\/)(logo|isotipo|fondo|portada)\.[a-z]+$/i.test(img)) return; // solo con foto de producto
            if (categoriaInactiva(p.categoria)) return;
            var clave = norm(p.nombre);
            if (!clave || clave === 'empanadas' || clave === 'empanada') return;

            var es2x1 = (p.promo2x1 && p.promo2x1.activo === true) || state.promos.some(function (q) {
                return q.activo !== false && q.producto_id === p.id;
            });
            var esFestival = festivalActivo && clave.indexOf('trifasica') !== -1 && clave.indexOf('mini') === -1;
            var etiqueta = '';
            if (esFestival) etiqueta = es2x1 ? 'Sabe a Quindío · 2×1' : 'Sabe a Quindío';
            else if (es2x1) etiqueta = 'Promo 2×1';
            else if (p.es_destacado) etiqueta = 'Los más pedidos';

            var precio = Number(p.precio) || 0;
            out.push({
                id: p.id,
                nombre: String(p.nombre || '').replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim(),
                precio: precio,
                es2x1: es2x1,
                festival: esFestival,
                etiqueta: etiqueta,
                ingredientes: parseIngredientes(p.descripcion),
                img: resolverImg((es2x1 && p.promo2x1 && p.promo2x1.image_url) || img),
                imgBase: resolverImg(img),
                orden: Number.isFinite(Number(p.order)) ? Number(p.order) : 9999
            });
        });
        out.sort(function (a, b) { return a.orden - b.orden || a.nombre.localeCompare(b.nombre, 'es'); });
        // Durante el festival, su producto sale al inicio y otra vez a la mitad de cada vuelta (si no, caería de último).
        var fest = out.filter(function (x) { return x.festival; });
        if (fest.length) {
            var resto = out.filter(function (x) { return !x.festival; });
            var mitad = Math.ceil(resto.length / 2);
            out = fest.concat(resto.slice(0, mitad), fest, resto.slice(mitad));
        }
        return out;
    }

    function firma(p) { return p ? JSON.stringify([p.nombre, p.precio, p.es2x1, p.etiqueta, p.ingredientes, p.img]) : ''; }

    function reconstruir() {
        var previo = lista.filter(function (p) { return p.id === actualId; })[0];
        lista = construirLista();
        var pos = -1;
        if (lista[idx] && lista[idx].id === actualId) pos = idx; // (un producto puede estar repetido en la vuelta)
        else for (var i = 0; i < lista.length; i++) if (pos < 0 && lista[i].id === actualId) pos = i;
        // Si el producto en pantalla ya no está en la lista, se sigue desde la misma posición.
        idx = pos >= 0 ? pos : Math.min(idx, lista.length - 1);
        var nuevo = pos >= 0 ? lista[pos] : null;
        // Cambió el producto que está en pantalla (precio, nombre, 2×1…): se repinta ya.
        if (previo && nuevo && firma(previo) !== firma(nuevo)) pintar(nuevo, false);
        if (!timer && !enCurso && lista.length) avanzar();
    }

    // ── Pintado ──
    function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
    function fmtPrecio(n) { return '$' + Number(n).toLocaleString('es-CO'); }

    function tamanoNombre(n) {
        var l = n.length;
        return l <= 12 ? 168 : l <= 18 ? 138 : l <= 26 ? 108 : l <= 34 ? 88 : 72;
    }

    function htmlPanel(p) {
        var palabras = p.nombre.split(' ').map(function (w, i) {
            return '<span class="w" style="--i:' + i + '">' + esc(w) + '</span>';
        }).join(' ');
        var base = p.nombre.split(' ').length * 0.13;
        var ings = p.ingredientes.map(function (t, i) {
            return '<li style="--d:' + (0.45 + base + i * 0.1).toFixed(2) + 's">' + esc(t) + '</li>';
        }).join('');
        var dPrecio = (0.55 + base + p.ingredientes.length * 0.1).toFixed(2);
        var precio = p.es2x1
            ? '<div class="precio dos" style="--d:' + dPrecio + 's">2×1</div>'
            : (p.precio > 0 ? '<div class="precio" style="--d:' + dPrecio + 's"><small>$</small>' + esc(Number(p.precio).toLocaleString('es-CO')) + '</div>' : '');
        return (p.etiqueta ? '<div class="etq">' + esc(p.etiqueta) + '</div>' : '')
            + '<h1 class="nombre" style="font-size:' + tamanoNombre(p.nombre) + 'px">' + palabras + '</h1>'
            + (ings ? '<ul class="ings">' + ings + '</ul>' : '')
            + precio;
    }

    function pintar(p, conFoto) {
        actualId = p.id;
        if (conFoto !== false) {
            var nueva = fotos[capa ^ 1], vieja = fotos[capa];
            var im = nueva.firstChild;
            im.onerror = function () { if (p.imgBase && im.src.indexOf(p.imgBase) === -1) im.src = p.imgBase; };
            im.src = p.img;
            nueva.classList.remove('on', 'zoom');
            void nueva.offsetWidth;
            nueva.classList.add('on', 'zoom');
            vieja.classList.remove('on');
            capa ^= 1;
            // Barra de progreso: reinicia en cada producto.
            var fill = barra.firstChild;
            fill.style.animation = 'none';
            void fill.offsetWidth;
            fill.style.animation = 'prog ' + (ROTACION_MS / 1000) + 's linear forwards';
        }
        panel.classList.add('saliendo');
        var contenido = htmlPanel(p);
        setTimeout(function () {
            if (actualId !== p.id) return;
            panel.innerHTML = contenido;
            panel.classList.remove('saliendo');
        }, conFoto === false ? 0 : 280);
    }

    // Precarga la foto antes de mostrarla: si no carga (sin internet y sin caché) se salta ese producto.
    function cargarImagen(p, cb) {
        var im = new Image();
        var hecho = false;
        function fin(ok) { if (!hecho) { hecho = true; cb(ok); } }
        im.onload = function () { fin(true); };
        im.onerror = function () {
            if (p.imgBase && p.imgBase !== p.img) { // la foto del 2×1 falló: se prueba la del producto
                p.img = p.imgBase;
                var im2 = new Image();
                im2.onload = function () { fin(true); };
                im2.onerror = function () { fin(false); };
                im2.src = p.img;
            } else fin(false);
        };
        setTimeout(function () { fin(false); }, 7000);
        im.src = p.img;
    }

    function avanzar() {
        clearTimeout(timer);
        timer = null;
        if (enCurso) return;
        if (!lista.length) {
            panel.innerHTML = '<h1 class="nombre" style="font-size:96px"><span class="w" style="--i:0">Cargando</span> <span class="w" style="--i:1">el</span> <span class="w" style="--i:2">menú…</span></h1>';
            timer = setTimeout(avanzar, 5000);
            return;
        }
        enCurso = true;
        var intentos = 0;
        (function probar() {
            if (!lista.length) { enCurso = false; timer = setTimeout(avanzar, 5000); return; }
            idx = (idx + 1) % lista.length;
            var p = lista[idx];
            cargarImagen(p, function (ok) {
                if (ok) {
                    enCurso = false;
                    pintar(p, true);
                    timer = setTimeout(avanzar, ROTACION_MS);
                } else if (++intentos < lista.length) {
                    probar();
                } else {
                    enCurso = false;
                    timer = setTimeout(avanzar, 5000); // ninguna foto cargó (sin internet): se reintenta
                }
            });
        })();
    }

    // ── Firebase (solo lectura) ──
    function suscribir() {
        var db;
        try { db = initFirebaseServices().db; } catch (e) {
            // El SDK no cargó (sin internet al abrir): se sigue con lo guardado y se reintenta.
            setTimeout(suscribir, 15000);
            return;
        }
        function err(nombre) { return function (e) { console.warn('[TV] ' + nombre + ':', e && (e.code || e.message)); }; }
        db.collection('productos').onSnapshot(function (snap) {
            state.productos = snap.docs.map(function (d) { return slimProducto(Object.assign({ id: d.id }, d.data())); });
            guardarCache();
            reconstruir();
        }, err('productos'));
        db.collection('categorias').onSnapshot(function (snap) {
            state.categorias = snap.docs.map(function (d) { var c = d.data(); return { name: c.name, active: c.active }; });
            guardarCache();
            reconstruir();
        }, err('categorias'));
        db.collection('promos_2x1').onSnapshot(function (snap) {
            state.promos = snap.docs.map(function (d) { var q = d.data(); return { producto_id: q.producto_id, activo: q.activo }; });
            guardarCache();
            reconstruir();
        }, err('promos_2x1'));
    }

    // ── Pantalla siempre encendida (Wake Lock) ──
    function pedirWakeLock() {
        if (!('wakeLock' in navigator) || wakeLock) return;
        navigator.wakeLock.request('screen').then(function (l) {
            wakeLock = l;
            l.addEventListener('release', function () { wakeLock = null; });
        }).catch(function () { /* se reintenta luego */ });
    }
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') pedirWakeLock(); });
    setInterval(pedirWakeLock, 30000);
    pedirWakeLock();

    // Pantalla completa invisible: doble clic o tecla F (en modo kiosco no hace falta).
    function pantallaCompleta() {
        var el = document.documentElement;
        if (document.fullscreenElement) { if (document.exitFullscreen) document.exitFullscreen(); }
        else if (el.requestFullscreen) el.requestFullscreen().catch(function () {});
    }
    document.addEventListener('dblclick', pantallaCompleta);
    document.addEventListener('keydown', function (e) { if (e.key === 'f' || e.key === 'F') pantallaCompleta(); });

    // Una recarga cada 6 h (solo con internet) para tomar versiones nuevas de la página.
    setInterval(function () { if (navigator.onLine) location.reload(); }, RECARGA_MS);

    cargarCache();
    reconstruir();
    suscribir();
})();
