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
    var REVISION_MS = Math.max(3, Number((/[?&]rev=(\d+)/.exec(location.search) || [])[1]) || 1800) * 1000; // cada cuánto se busca una versión nueva (?rev=segundos solo para pruebas)

    var stage = document.getElementById('stage');
    var panel = document.getElementById('panel');
    var barra = document.getElementById('barra');
    var fotos = [document.getElementById('fotoA'), document.getElementById('fotoB')];

    var state = { productos: [], categorias: [], promos: [], cfg: {} };

    // Configuración que se maneja desde el admin (FODEXA → Modo TV), en configuracion/tv_config. Sin ese documento
    // la pantalla se comporta como siempre: todo el menú, 8 s por producto.
    var CFG_BASE = { pausada: false, segundos: 8, modo: 'todo', categorias: [], productos: [], orden: 'menu', precio: true, ingredientes: true, etiquetas: true };
    var cfg = Object.assign({}, CFG_BASE);
    var semilla = String(Date.now()); // orden aleatorio estable mientras la pantalla esté abierta
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

    function aplicarCfg(d) {
        d = d || {};
        var seg = Number(d.segundos);
        var nuevo = {
            pausada: d.pausada === true,
            segundos: Math.min(300, Math.max(3, isFinite(seg) && seg > 0 ? seg : CFG_BASE.segundos)),
            modo: ['todo', 'categorias', 'productos', 'promos', 'destacados'].indexOf(d.modo) !== -1 ? d.modo : 'todo',
            categorias: Array.isArray(d.categorias) ? d.categorias.map(norm) : [],
            productos: Array.isArray(d.productos) ? d.productos.map(String) : [],
            orden: d.orden === 'aleatorio' ? 'aleatorio' : 'menu',
            precio: d.precio !== false,
            ingredientes: d.ingredientes !== false,
            etiquetas: d.etiquetas !== false
        };
        if (nuevo.orden === 'aleatorio' && cfg.orden !== 'aleatorio') semilla = String(Date.now());
        cfg = nuevo;
        state.cfg = d;
        ROTACION_MS = cfg.segundos * 1000;
        document.body.classList.toggle('en-pausa', cfg.pausada);
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
                if (raw.cfg) aplicarCfg(raw.cfg);
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
                ingredientes: (typeof p.ingredientes === 'string' && p.ingredientes.trim())
                    ? p.ingredientes.split(/[\n,;]+/).map(function (t) { t = t.trim(); return t ? t.charAt(0).toUpperCase() + t.slice(1) : ''; }).filter(Boolean).slice(0, 8)
                    : parseIngredientes(p.descripcion),
                img: resolverImg((es2x1 && p.promo2x1 && p.promo2x1.image_url) || img),
                imgBase: resolverImg(img),
                orden: Number.isFinite(Number(p.order)) ? Number(p.order) : 9999,
                categoria: norm(p.categoria),
                destacado: p.es_destacado === true
            });
        });
        out.sort(function (a, b) { return a.orden - b.orden || a.nombre.localeCompare(b.nombre, 'es'); });
        // Qué se muestra (admin → Modo TV → Contenido). Si el filtro no deja nada, se muestra todo: una TV nunca debe quedar vacía.
        var filtrada = out.filter(function (x) {
            if (cfg.modo === 'categorias') return cfg.categorias.indexOf(x.categoria) !== -1;
            if (cfg.modo === 'productos') return cfg.productos.indexOf(String(x.id)) !== -1;
            if (cfg.modo === 'promos') return x.es2x1;
            if (cfg.modo === 'destacados') return x.destacado;
            return true;
        });
        if (filtrada.length) out = filtrada;
        if (cfg.orden === 'aleatorio') {
            var clave = function (x) { return huella(semilla + x.id); };
            out.sort(function (a, b) { return clave(a) < clave(b) ? -1 : clave(a) > clave(b) ? 1 : 0; });
        }
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
        return (p.etiqueta && cfg.etiquetas ? '<div class="etq">' + esc(p.etiqueta) + '</div>' : '')
            + '<h1 class="nombre" style="font-size:' + tamanoNombre(p.nombre) + 'px">' + palabras + '</h1>'
            + (ings && cfg.ingredientes ? '<ul class="ings">' + ings + '</ul>' : '')
            + (cfg.precio ? precio : '');
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
        // En pausa se queda en el producto que está en pantalla (la primera vez sí muestra uno).
        if (cfg.pausada && actualId) { timer = setTimeout(avanzar, 2000); return; }
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
        db.collection('configuracion').doc('tv_config').onSnapshot(function (snap) {
            var estabaPausada = cfg.pausada, antes = JSON.stringify(cfg);
            aplicarCfg(snap.exists ? snap.data() : {});
            if (JSON.stringify(cfg) === antes) return;
            guardarCache();
            reconstruir();
            var actual = lista.filter(function (x) { return x.id === actualId; })[0];
            if (!actual && actualId) { actualId = null; avanzar(); return; } // el producto en pantalla quedó fuera del filtro: pasa al siguiente ya
            if (actual) pintar(actual, false); // repinta ya con los textos/precio que correspondan
            if (estabaPausada && !cfg.pausada) avanzar(); // al reanudar pasa al siguiente enseguida
            else if (!estabaPausada && !cfg.pausada && !enCurso) { clearTimeout(timer); timer = setTimeout(avanzar, ROTACION_MS); } // cambió el tiempo
        }, err('tv_config'));
        // El POS abre/cierra el cobro con QR aquí (en modo demo no se escucha, para no taparlo)
        if (!/[?&]cobro_demo=/.test(location.search)) db.collection('configuracion').doc('tv_cobro').onSnapshot(function (snap) { aplicarCobro(snap.exists ? snap.data() : null); }, err('tv_cobro'));
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

    // ── Pantalla completa ──
    // El navegador solo la permite tras un clic/toque en ESTA página. Por eso: un clic en cualquier parte la activa,
    // y hay un botón (esquina superior derecha) que aparece al mover el mouse o tocar y se oculta solo.
    var btnFs = document.getElementById('btnFs');
    var hint = document.getElementById('hint');
    var inactivoT = null;

    function esFs() { return !!(document.fullscreenElement || document.webkitFullscreenElement); }
    function entrarFs() {
        var el = document.documentElement;
        var p = el.requestFullscreen ? el.requestFullscreen({ navigationUI: 'hide' }) : (el.webkitRequestFullscreen ? el.webkitRequestFullscreen() : null);
        if (p && p.catch) p.catch(function () { /* el navegador la rechazó: se reintenta con el próximo clic */ });
    }
    function salirFs() {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    }
    function alternarFs() { if (esFs()) salirFs(); else entrarFs(); }

    function actividad() {
        document.body.classList.add('activo');
        clearTimeout(inactivoT);
        // Fuera de pantalla completa (configurando la TV) el mouse y el botón se quedan a la vista 15 s; ya en pantalla
        // completa se ocultan a los 3 s para que la TV quede limpia.
        inactivoT = setTimeout(function () { document.body.classList.remove('activo'); }, esFs() ? 3000 : 15000);
    }
    ['mousemove', 'mousedown', 'touchstart', 'keydown'].forEach(function (ev) { document.addEventListener(ev, actividad, { passive: true }); });

    function alCambiarFs() {
        document.body.classList.toggle('es-fs', esFs());
        if (esFs()) document.body.classList.remove('con-ayuda');
        actividad(); // al entrar o salir se muestra el mouse un momento (reinicia el temporizador con el tiempo que corresponde)
    }
    document.addEventListener('fullscreenchange', alCambiarFs);
    document.addEventListener('webkitfullscreenchange', alCambiarFs);

    actividad(); // al abrir la página el mouse y el botón se ven desde el primer momento
    if (btnFs) btnFs.addEventListener('click', function (e) { e.stopPropagation(); alternarFs(); });
    // Clic en cualquier parte: si no está en pantalla completa, entra (así basta un clic para dejar la TV lista).
    document.addEventListener('click', function () { if (!esFs()) entrarFs(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'f' || e.key === 'F') alternarFs(); });

    // Si se abrió desde el botón "Modo TV" del admin (?ctl=1) se muestra una ayuda unos segundos y se quita el parámetro.
    if (/[?&]ctl=1\b/.test(location.search)) {
        document.body.classList.add('con-ayuda');
        setTimeout(function () { document.body.classList.remove('con-ayuda'); }, 12000);
        try { history.replaceState(null, '', location.pathname); } catch (_) { /* sin history */ }
    }

    // ── Actualizaciones de la página SIN sacar a la TV de la pantalla completa ──
    // Recargar la página (location.reload) hace que el navegador salga de la pantalla completa, y no se puede volver a
    // entrar sin un clic. Antes se comparaba el ?v= de tv.js, pero el build lo cambia en CADA publicación (aunque la TV
    // no haya cambiado), así que a los ≤30 min de cualquier deploy la TV se recargaba y se "achicaba".
    // Ahora se compara el CONTENIDO (huella del HTML sin ?v= y del tv.js) y, si de verdad cambió:
    //   · en pantalla completa de la página → se espera a la madrugada (3–5 a. m., hora de Bogotá, local cerrado);
    //   · si no está en pantalla completa (o está en F11/kiosco, que sobrevive a la recarga) → se recarga ya.
    function huella(t) { var h = 2166136261; t = String(t || ""); for (var i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36) + ":" + t.length; }
    function sinVersion(t) { return String(t || "").replace(/\?v=[\w-]+/g, ""); }
    function leerPagina(sinCache) {
        var op = sinCache ? { cache: "no-store" } : {};
        return fetch(location.pathname, op).then(function (r) { return r.text(); }).then(function (html) {
            var m = /<script[^>]+src="([^"]*tv\.js[^"]*)"/.exec(html);
            return fetch(m ? m[1] : "tv.js", op).then(function (r) { return r.text(); }).then(function (js) { return huella(sinVersion(html)) + "|" + huella(js); });
        });
    }
    function esMadrugada(ms) {
        var h = Number(new Date(ms).toLocaleString("en-GB", { timeZone: "America/Bogota", hour: "2-digit", hourCycle: "h23" }));
        return h >= 3 && h < 5;
    }
    var huellaInicial = null, hayActualizacion = false;
    function aplicarActualizacion() {
        if (!hayActualizacion) return;
        if (!esFs() || esMadrugada(Date.now())) location.reload();
    }
    function revisarVersion() {
        if (!navigator.onLine || !window.fetch) return;
        if (hayActualizacion) { aplicarActualizacion(); return; }
        if (!huellaInicial) { leerPagina(false).then(function (h) { huellaInicial = h; }).catch(function () { /* se reintenta */ }); return; }
        leerPagina(true).then(function (h) { if (h !== huellaInicial) { hayActualizacion = true; aplicarActualizacion(); } }).catch(function () { /* sin red: se reintenta luego */ });
    }
    // La huella de partida se toma al abrir la página (con la misma caché que cargó esta versión).
    if (window.fetch) leerPagina(false).then(function (h) { huellaInicial = h; }).catch(function () { /* se toma en la primera revisión */ });
    setInterval(revisarVersion, REVISION_MS);



    // ── FODI (la mascota): MISMO dibujo, colores y expresiones que en el panel (src/js/admin.js, "FODI: mini pantalla con ojos y boca").
    // Aquí solo hay una cara, sin mouse ni voz: parpadea, flota y mira de lado. Solo se anima mientras el cobro está en pantalla. ──
    var FODI_BASE = {
        ehL: 1, ehR: 1, ew: 1, tilt: 0, eyeY: 42, arc: 0, gx: 0, gy: 0, gk: 1,
        mw: 6, mc: 1.2, mo: 0, mx: 0, my: 64, blush: 0, zzz: 0, stars: 0, bulb: 0, qm: 0, hearts: 0, bob: 0.5
    };
    var FODI_EX = {
        neutral: {},
        thinking: { ehL: 0.85, ehR: 0.85, tilt: -5, gx: 4, gy: -4, gk: 0, mw: 3.5, mc: -0.3, mx: 7, bob: 0.3 },
        talking: { mc: 0.9, mw: 6 },
        happy: { arc: 1, mw: 9, mc: 4, mo: 2, blush: 0.75 },
        surprised: { ehL: 1.35, ehR: 1.35, ew: 1.1, eyeY: 40, mw: 3.5, mc: 0, mo: 7, my: 66, bob: 0.2 },
        wink: { ehR: 0.08, mw: 7.5, mc: 3, mo: 1.5, blush: 0.4 },
        sad: { ehL: 0.8, ehR: 0.8, tilt: 14, eyeY: 44, gy: 2, mw: 5, mc: -3, my: 68, bob: 0.2 },
        confused: { ehR: 0.55, tilt: 4, gk: 0.3, mw: 5, mc: -0.8, mx: -3, qm: 1 },
        celebrating: { arc: 1, mw: 10, mc: 5, mo: 5, blush: 1, stars: 1, bob: 2.4 },
        sleeping: { ehL: 0.06, ehR: 0.06, eyeY: 46, gk: 0, mw: 3.5, mc: 0.2, mo: 1.2, my: 66, zzz: 1, bob: 0.4 },
        focused: { ehL: 0.55, ehR: 0.55, ew: 1.05, tilt: -9, mw: 5, mc: -0.2, my: 65, bob: 0.1 },
        love: { arc: 1, mw: 9, mc: 4.5, mo: 2.5, blush: 1, hearts: 1, bob: 1.6 },
        shy: { ehL: 0.9, ehR: 0.9, tilt: 7, gx: -4, gy: 3, gk: 0, mw: 4, mc: 2, blush: 1, bob: 0.9 },
        giggle: { arc: 1, mw: 8, mc: 4, mo: 3, blush: 0.9, stars: 0.6, bob: 2.2 },
        eureka: { ehL: 1.3, ehR: 1.3, ew: 1.05, eyeY: 41, gy: -3, mw: 6, mc: 3, mo: 4, bulb: 1, bob: 0.6 }
    };
    
    var FODI_SVG = '<svg class="fodi-svg" viewBox="0 0 100 100" aria-hidden="true">'
    + '<g class="f-head"><rect class="f-screen" x="5" y="13" width="90" height="74" rx="28"/>'
    + '<path class="f-gloss" d="M20 24 Q50 14 80 24 Q50 20 20 24Z"/>'
    + '<ellipse class="f-blush" cx="19" cy="61" rx="6" ry="3.4"/><ellipse class="f-blush" cx="81" cy="61" rx="6" ry="3.4"/>'
    + '<rect class="f-eye" rx="5" /><rect class="f-eye" rx="5" />'
    + '<path class="f-arc" /><path class="f-arc" />'
    + '<path class="f-mouth" />'
    + '<g class="f-zzz"><text x="70" y="30" font-size="10">z</text><text x="78" y="21" font-size="7">z</text></g>'
    + '<g class="f-stars"><path d="M16 26 l2 4 4 2 -4 2 -2 4 -2 -4 -4 -2 4 -2z"/><path d="M84 24 l1.6 3.2 3.2 1.6 -3.2 1.6 -1.6 3.2 -1.6 -3.2 -3.2 -1.6 3.2 -1.6z"/><path d="M50 8 l1.3 2.7 2.7 1.3 -2.7 1.3 -1.3 2.7 -1.3 -2.7 -2.7 -1.3 2.7 -1.3z"/></g>'
    + '<g class="f-hearts"><path transform="translate(10 18) scale(1.5)" d="M0 2 C0 -1 4 -1 4 2 C4 -1 8 -1 8 2 C8 5 4 8 4 9 C4 8 0 5 0 2Z"/><path transform="translate(76 14) scale(1.1)" d="M0 2 C0 -1 4 -1 4 2 C4 -1 8 -1 8 2 C8 5 4 8 4 9 C4 8 0 5 0 2Z"/></g>'
    + '<g class="f-bulb"><circle cx="50" cy="9" r="5"/><rect x="47.5" y="13" width="5" height="3" rx="1"/></g>'
    + '<text class="f-qm" x="76" y="30" font-size="14">?</text>'
    + '</g></svg>';
    var fodi = null, fodiRaf = 0, fodiUlt = 0, fodiTemp = 0;
    function fodiParams(n) { return Object.assign({}, FODI_BASE, FODI_EX[n] || {}); }
    function fodiPintar(f, p) {
        var e = f.els, gx = p.gx + f.deriva.x * p.gk, gy = p.gy + f.deriva.y * p.gk, ew = 13 * p.ew;
        function ojo(el, cx, eh, giro) {
            var h = Math.max(1.8, 20 * eh), cy = p.eyeY + gy;
            el.setAttribute('x', (cx + gx - ew / 2).toFixed(2)); el.setAttribute('y', (cy - h / 2).toFixed(2));
            el.setAttribute('width', ew.toFixed(2)); el.setAttribute('height', h.toFixed(2));
            el.setAttribute('rx', Math.min(ew, h) / 2 * 0.9);
            el.setAttribute('transform', 'rotate(' + giro.toFixed(1) + ' ' + (cx + gx).toFixed(2) + ' ' + cy.toFixed(2) + ')');
            el.style.opacity = (1 - p.arc).toFixed(2);
        }
        ojo(e.eyes[0], 32, p.ehL, -p.tilt); ojo(e.eyes[1], 68, p.ehR, p.tilt);
        function arco(el, cx) {
            var x = cx + gx, y = p.eyeY + gy + 3;
            el.setAttribute('d', 'M' + (x - 6.5).toFixed(1) + ' ' + y.toFixed(1) + ' Q' + x.toFixed(1) + ' ' + (y - 11).toFixed(1) + ' ' + (x + 6.5).toFixed(1) + ' ' + y.toFixed(1));
            el.style.opacity = p.arc.toFixed(2);
        }
        arco(e.arcs[0], 32); arco(e.arcs[1], 68);
        var cy = -p.mc, mid = p.mc, mw = Math.max(1.5, p.mw), mo = Math.max(0, p.mo), cu = 2 * mid - cy, cl = 2 * (mid + mo) - cy;
        var x0 = 50 + p.mx - mw, x1 = 50 + p.mx + mw, y = p.my;
        e.mouth.setAttribute('d', 'M' + x0.toFixed(2) + ' ' + (y + cy).toFixed(2) + ' Q' + (50 + p.mx).toFixed(2) + ' ' + (y + cu).toFixed(2) + ' ' + x1.toFixed(2) + ' ' + (y + cy).toFixed(2) + ' Q' + (50 + p.mx).toFixed(2) + ' ' + (y + cl).toFixed(2) + ' ' + x0.toFixed(2) + ' ' + (y + cy).toFixed(2) + 'Z');
        e.mouth.style.fillOpacity = Math.min(1, mo / 3).toFixed(2);
        e.blush.forEach(function (b) { b.style.opacity = p.blush.toFixed(2); });
        e.zzz.style.opacity = p.zzz.toFixed(2); e.stars.style.opacity = p.stars.toFixed(2); e.hearts.style.opacity = p.hearts.toFixed(2);
        e.hearts.setAttribute('transform', 'translate(0 ' + (-Math.abs(f.bobY) * 2).toFixed(2) + ')');
        e.bulb.style.opacity = p.bulb.toFixed(2); e.qm.style.opacity = p.qm.toFixed(2);
        e.head.setAttribute('transform', 'translate(0 ' + f.bobY.toFixed(2) + ')');
    }
    function fodiMontar() {
        if (fodi) return fodi;
        var host = document.getElementById('fodi');
        if (!host) return null;
        host.innerHTML = FODI_SVG;
        var svg = host.firstChild;
        fodi = {
            host: host, expr: 'neutral', cur: fodiParams('neutral'), proxParpadeo: performance.now() + 1500, parpadeoFin: 0, proxDeriva: 0,
            deriva: { x: 0, y: 0 }, derivaObj: { x: 0, y: 0 }, microMc: 0, bobY: 0,
            els: { head: svg.querySelector('.f-head'), eyes: [].slice.call(svg.querySelectorAll('.f-eye')), arcs: [].slice.call(svg.querySelectorAll('.f-arc')),
                mouth: svg.querySelector('.f-mouth'), blush: [].slice.call(svg.querySelectorAll('.f-blush')), zzz: svg.querySelector('.f-zzz'),
                stars: svg.querySelector('.f-stars'), hearts: svg.querySelector('.f-hearts'), bulb: svg.querySelector('.f-bulb'), qm: svg.querySelector('.f-qm') }
        };
        fodiPintar(fodi, fodi.cur);
        return fodi;
    }
    function fodiFrame(ahora) {
        var f = fodi; if (!f) { fodiRaf = 0; return; }
        var dt = Math.min(0.05, (ahora - fodiUlt) / 1000 || 0.016); fodiUlt = ahora;
        var obj = fodiParams(f.expr), t = ahora / 1000;
        if (f.expr === 'thinking') { obj.gx += Math.sin(t * 1.7) * 3; obj.gy += Math.cos(t * 1.1) * 1.5; }
        if (ahora > f.proxParpadeo) { f.parpadeoFin = ahora + 130; f.proxParpadeo = ahora + 2200 + Math.random() * 3800; }
        var parpadea = ahora < f.parpadeoFin;
        if (parpadea) { obj.ehL *= 0.08; obj.ehR *= 0.08; }
        if (ahora > f.proxDeriva) {
            f.derivaObj = { x: (Math.random() - 0.5) * 3.4, y: (Math.random() - 0.5) * 2.2 };
            f.proxDeriva = ahora + 900 + Math.random() * 2200;
            if (Math.random() < 0.25) f.microMc = (Math.random() - 0.5) * 0.9;
        }
        f.deriva.x += (f.derivaObj.x - f.deriva.x) * Math.min(1, dt * 4); f.deriva.y += (f.derivaObj.y - f.deriva.y) * Math.min(1, dt * 4);
        obj.mc += f.microMc || 0;
        f.bobY = Math.sin(t * (f.expr === 'celebrating' || f.expr === 'giggle' ? 9 : 2.2)) * obj.bob;
        var k = 1 - Math.exp(-dt * (parpadea ? 26 : 11));
        for (var clave in obj) f.cur[clave] += (obj[clave] - f.cur[clave]) * k;
        fodiPintar(f, f.cur);
        fodiRaf = requestAnimationFrame(fodiFrame);
    }
    function fodiArrancar() { if (!fodiMontar() || fodiRaf) return; fodiUlt = performance.now(); fodiRaf = requestAnimationFrame(fodiFrame); }
    function fodiParar() { if (fodiRaf) { cancelAnimationFrame(fodiRaf); fodiRaf = 0; } clearTimeout(fodiTemp); }
    // Cambia de expresión; con `ms` vuelve a `volverA` pasado ese tiempo
    function fodiExpr(nombre, ms, volverA) {
        if (!fodiMontar()) return;
        if (!FODI_EX[nombre]) nombre = 'neutral';
        if (fodi.expr === nombre && !ms) return;
        clearTimeout(fodiTemp); fodi.expr = nombre; fodiArrancar();
        if (ms) fodiTemp = setTimeout(function () { fodiExpr(volverA || 'neutral'); }, ms);
    }

    // ── Cobro con QR ──
    // El POS abre un cobro y escribe configuracion/tv_cobro { activo, cobroId, estado: 'esperando' | 'pagado', total, cliente,
    // pagador }. Mientras esté activo, la mitad derecha muestra el QR de Bancolombia y el total (la foto sigue rotando). Al llegar
    // el pago (estado 'pagado') FODI agradece unos segundos y la pantalla vuelve a la publicidad.
    // Prueba sin POS: /tv?cobro_demo=38000 (esperando 12 s y luego el agradecimiento). /tv?cobro_demo=1000&qrvalor=12 prueba el QR con valor.
    var infoEl = document.querySelector('.info');
    var cobroEl = document.getElementById('cobro');
    var qrJson = null;
    var ultimoCobro = null;
    var cobroPintado = '';
    var cobroVisto = {};      // cobroId → ms (reloj de ESTA pantalla) en que se vio por primera vez en cada estado
    var cobroFin = null;
    var cobroReloj = null;
    var CONFETI = ['#fb4b08', '#5e3d2c', '#2e9d5b', '#f5b800', '#1d2140'];

    function dinero(n) { return '$' + String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }

    function cargarQr() {
        function usar(j) { if (j && j.payload) { qrJson = j; cobroPintado = ''; if (ultimoCobro) aplicarCobro(ultimoCobro); } }
        var guardado = null;
        try { guardado = JSON.parse(localStorage.getItem('roal_tv_qr') || 'null'); } catch (_) { guardado = null; }
        if (guardado) usar(guardado);
        if (!window.fetch) return;
        fetch('qr-cobro.json?t=' + Date.now(), { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (j) {
            try { localStorage.setItem('roal_tv_qr', JSON.stringify(j)); } catch (_) { /* sin almacenamiento */ }
            usar(j);
        }).catch(function () { /* sin red: se usa el guardado */ });
    }

    // Texto que lleva el QR: el fijo del comercio; solo si se pidió (qrvalor=11|12 en la URL o "conValor" en qr-cobro.json) se prueba con el valor incluido.
    function textoQr(total) {
        if (!qrJson || !qrJson.payload) return '';
        var modo = (/[?&]qrvalor=(0|11|12)\b/.exec(location.search) || [])[1] || (qrJson.conValor === true || qrJson.conValor === '12' ? '12' : (qrJson.conValor === '11' ? '11' : ''));
        if (modo === '0') return qrJson.payload;
        if (modo && window.RoalQrEmv) { var q = window.RoalQrEmv.conMonto(qrJson.payload, total, modo); if (q) return q; }
        return qrJson.payload;
    }

    function dibujarQr(texto) {
        if (!window.qrcode || !texto) return '';
        try { var q = window.qrcode(0, 'L'); q.addData(texto, 'Byte'); q.make(); return q.createSvgTag({ cellSize: 1, margin: 0, scalable: true }); } catch (e) { console.warn('[TV] QR:', e && e.message); return ''; }
    }

    function ocultarCobro() {
        clearTimeout(cobroFin); clearInterval(cobroReloj); cobroFin = null; cobroReloj = null; fodiParar();
        infoEl.classList.remove('con-cobro'); cobroEl.classList.remove('pagado'); cobroPintado = '';
    }

    function mensajeEspera(seg) {
        var pts = '<span class="pts"><i>.</i><i>.</i><i>.</i></span>';
        if (seg < 30) return 'Esperando tu pago' + pts;
        if (seg < 100) return 'Ya casi… el banco está confirmando tu pago' + pts;
        return 'Sigo atento a tu pago' + pts;
    }

    function pintarEspera(d) {
        var clave = d.cobroId + ':' + d.total;
        if (cobroPintado !== clave) {
            cobroPintado = clave;
            if (!cobroVisto[d.cobroId + ':e']) cobroVisto[d.cobroId + ':e'] = Date.now();
            document.getElementById('cQr').innerHTML = dibujarQr(textoQr(d.total));
            document.getElementById('cTotal').textContent = dinero(d.total);
            var par = document.getElementById('cParcial');
            if (d.parcial && d.pedidoTotal) { par.hidden = false; par.textContent = 'Pago parcial · total del pedido ' + dinero(d.pedidoTotal); } else { par.hidden = true; }
            var conValor = !!qrJson && textoQr(d.total) !== qrJson.payload;
            document.getElementById('cAyuda').textContent = conValor ? 'Escanea con la app de tu banco y confirma el valor' : 'Escanea con la app de tu banco y paga este valor exacto';
            clearInterval(cobroReloj);
            var msg = document.getElementById('cMsg');
            var tic = function () {
                var seg = Math.round((Date.now() - cobroVisto[d.cobroId + ':e']) / 1000);
                if (seg > 32 * 60) { ocultarCobro(); return; } // el POS no lo cerró (se cerró la pestaña): la TV vuelve sola a la publicidad
                msg.innerHTML = mensajeEspera(seg);
                fodiExpr(seg < 6 ? 'happy' : seg < 30 ? 'thinking' : seg < 100 ? 'focused' : 'neutral');
            };
            tic();
            cobroReloj = setInterval(tic, 4000);
        }
        cobroEl.classList.remove('pagado');
        infoEl.classList.add('con-cobro');
        fodiArrancar();
    }

    function lanzarConfeti() {
        var c = document.getElementById('cConfeti'), h = '';
        for (var i = 0; i < 38; i++) {
            h += '<i style="left:' + Math.round(Math.random() * 100) + '%;background:' + CONFETI[i % CONFETI.length] + ';animation-delay:' + (Math.random() * 0.9).toFixed(2) + 's;animation-duration:' + (2.4 + Math.random() * 1.4).toFixed(2) + 's"></i>';
        }
        c.innerHTML = h;
        setTimeout(function () { c.innerHTML = ''; }, 5000);
    }

    function pintarGracias(d) {
        var clave = d.cobroId + ':pagado';
        if (cobroPintado !== clave) {
            cobroPintado = clave;
            clearInterval(cobroReloj); cobroReloj = null;
            document.getElementById('gNombre').textContent = d.pagador ? '¡Gracias, ' + d.pagador + '!' : '¡Gracias por tu pago!';
            document.getElementById('gDetalle').textContent = 'Tu pago de ' + dinero(d.total) + ' fue confirmado';
            document.getElementById('gAdios').textContent = d.parcial && d.pedidoTotal ? 'Resta ' + dinero(d.pedidoTotal - d.total) + ' por pagar' : '¡Que vuelvas pronto!';
            document.getElementById('cMsg').innerHTML = '¡Pago confirmado!';
            // se reinicia la animación del check al volver a mostrarla
            var chk = cobroEl.querySelector('.g-check'); if (chk) { var p = chk.parentNode; p.removeChild(chk); p.insertBefore(chk, p.firstChild); }
            lanzarConfeti();
            fodiExpr(d.parcial ? 'happy' : 'celebrating', 7000, 'happy');
        }
        cobroEl.classList.add('pagado');
        infoEl.classList.add('con-cobro');
    }

    function aplicarCobro(d) {
        ultimoCobro = d;
        if (!d || d.activo !== true || !d.cobroId) { ocultarCobro(); return; }
        if (d.estado === 'pagado') {
            var k = d.cobroId + ':p';
            if (!cobroVisto[k]) cobroVisto[k] = Date.now();
            var resta = 14000 - (Date.now() - cobroVisto[k]);
            if (resta <= 0) { ocultarCobro(); return; }
            pintarGracias(d);
            clearTimeout(cobroFin); cobroFin = setTimeout(ocultarCobro, resta);
            return;
        }
        if (d.estado === 'esperando') { pintarEspera(d); return; }
        ocultarCobro();
    }

    (function demoCobro() {
        var m = /[?&]cobro_demo=(\d+)/.exec(location.search);
        if (!m) return;
        var base = { activo: true, cobroId: 'demo' + Date.now(), total: Number(m[1]) || 38000, cliente: '', pagador: '' };
        var pt = Number((/[?&]pedido=(\d+)/.exec(location.search) || [])[1]) || 0;
        if (pt > base.total) { base.parcial = true; base.pedidoTotal = pt; }
        aplicarCobro(Object.assign({}, base, { estado: 'esperando' }));
        setTimeout(function () { aplicarCobro(Object.assign({}, base, { estado: 'pagado', pagador: 'Johan Rojas' })); }, 12000);
    })();
    cargarQr();

    cargarCache();
    reconstruir();
    suscribir();
})();
