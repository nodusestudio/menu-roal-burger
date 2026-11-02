// Pantalla /avisos: activa los avisos (push) en ESTE dispositivo. Se hace en una página aparte porque el panel
// (admin.html) no puede cargar firebase-messaging junto a firebase-functions: el SDK compat los acopla y rompe las
// llamadas a funciones (ver el comentario en admin.html, "REVERTIDO 2026-08-18"). Aquí NO se carga functions.
//
// Flujo: permiso del navegador → token FCM (el SDK registra su propio service worker en su scope, sin pisar sw.js)
// → documento admin_fcm_tokens/{uid}_{hash} (uno por dispositivo) → el servidor (notifyTokenActivado) manda un
// aviso de bienvenida que sirve de prueba. Requiere haber iniciado sesión en el panel en este mismo navegador/app.
(function () {
    'use strict';

    var VAPID_KEY = 'BEmwEIZ8fBu_-EkBGGyJcna1PEBymg21_HVDbjgaF5Wp0MAcqdpUTfv3-uOT-b3qt3fT0_viBMmLi83FfxXqGT8';
    var COL = 'admin_fcm_tokens';
    var CLAVE_DOC = 'roal_avisos_doc';

    var $ = function (id) { return document.getElementById(id); };
    var db = null, auth = null, user = null, activo = false, ocupado = false;

    function mostrar(msg, tipo) {
        var el = $('estado');
        el.textContent = msg;
        el.className = 'estado' + (tipo ? ' ' + tipo : '');
    }

    function esIphone() { return /iPhone|iPad|iPod/i.test(navigator.userAgent); }
    function instalada() { return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true; }

    function etiquetaDispositivo() {
        var ua = navigator.userAgent;
        var so = /Android/i.test(ua) ? 'Android' : /iPhone|iPad|iPod/i.test(ua) ? 'iPhone' : /Windows/i.test(ua) ? 'Windows' : /Mac/i.test(ua) ? 'Mac' : 'Dispositivo';
        var nav = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : /Firefox\//.test(ua) ? 'Firefox' : 'navegador';
        return so + ' · ' + nav + (instalada() ? ' (app instalada)' : '');
    }

    function sha(texto) {
        if (window.crypto && crypto.subtle && window.TextEncoder) {
            return crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto)).then(function (buf) {
                return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
            });
        }
        var h = 0; for (var i = 0; i < texto.length; i++) h = (h * 31 + texto.charCodeAt(i)) | 0;
        return Promise.resolve(String(Math.abs(h)) + texto.length);
    }

    function soportado() {
        return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window
            && window.firebase && typeof firebase.messaging === 'function' && (!firebase.messaging.isSupported || firebase.messaging.isSupported());
    }

    function pintar() {
        var ok = soportado();
        $('btnActivar').hidden = !(ok && user && !activo);
        $('btnProbar').hidden = !(ok && user && activo);
        $('btnLocal').hidden = !(ok && user && activo);
        $('btnDesactivar').hidden = !(ok && user && activo);
        $('btnActivar').disabled = $('btnProbar').disabled = $('btnDesactivar').disabled = ocupado;
        $('ayudaIphone').hidden = !(esIphone() && !instalada());
        $('sinSesion').hidden = !!user || !ok;
        if (!ok) mostrar(esIphone() && !instalada()
            ? 'En iPhone los avisos solo funcionan con la app instalada: toca Compartir → "Añadir a pantalla de inicio", abre la app desde su ícono y vuelve aquí.'
            : 'Este navegador no permite avisos. Prueba con Chrome (Android) o con la app instalada (iPhone).', 'malo');
        else if (!user) mostrar('Primero entra al panel con tu cuenta en este mismo navegador o app, y vuelve a esta pantalla.', 'aviso');
        else if (activo) mostrar('✅ Los avisos están activados en este dispositivo (' + etiquetaDispositivo() + ').', 'bueno');
        else if (Notification.permission === 'denied') mostrar('El permiso de notificaciones está bloqueado en este navegador. Actívalo en los ajustes del sitio y vuelve a intentar.', 'malo');
        else mostrar('Toca "Activar avisos" y acepta el permiso. Te mandaremos un aviso de prueba al instante.', '');
    }

    function mensajeError(e) {
        var m = String((e && (e.message || e.code)) || e);
        if (/push service error|token-subscribe-failed|Registration failed/i.test(m)) {
            var brave = !!(navigator.brave);
            return brave
                ? 'Brave bloquea los avisos de Google. En brave://settings/privacy activa "Usar los servicios de Google para mensajes push", reinicia Brave y vuelve a intentar.'
                : 'El navegador no pudo registrar los avisos (servicio de notificaciones no disponible). Revisa que las notificaciones y los servicios de Google estén activos, y vuelve a intentar.';
        }
        if (/permission|denied|blocked/i.test(m)) return 'El permiso de notificaciones está bloqueado. Actívalo en los ajustes del sitio.';
        return 'No se pudo activar: ' + m;
    }

    function activar() {
        if (ocupado || !user) return;
        ocupado = true; pintar(); mostrar('Activando…', '');
        Notification.requestPermission().then(function (perm) {
            if (perm !== 'granted') throw new Error('permission denied');
            return firebase.messaging().getToken({ vapidKey: VAPID_KEY });
        }).then(function (token) {
            if (!token) throw new Error('No se obtuvo el token del dispositivo.');
            return sha(token).then(function (h) {
                var id = user.uid + '_' + h.slice(0, 16);
                return db.collection(COL).doc(id).set({
                    token: token, uid: user.uid, etiqueta: etiquetaDispositivo(), instalada: instalada(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true }).then(function () { try { localStorage.setItem(CLAVE_DOC, id); } catch (_) { /* sin almacenamiento */ } return id; });
            });
        }).then(function () {
            activo = true; ocupado = false; pintar();
            mostrar('✅ Listo. En unos segundos te llega un aviso de prueba. Si no llega, toca "Enviar prueba".', 'bueno');
        }).catch(function (e) {
            ocupado = false; pintar(); mostrar(mensajeError(e), 'malo');
        });
    }

    // Con esta pantalla ABIERTA y visible, el sistema de avisos de Google no muestra la notificación: se la entrega a la
    // página (onMessage). Si la página no hace nada, parece que la prueba "no pasa nada". Aquí se muestra igual (con el
    // mismo service worker que usa el aviso con la pantalla bloqueada) y también como mensaje en pantalla.
    function mostrarEnPrimerPlano(payload) {
        var d = (payload && payload.data) || {}, n = (payload && payload.notification) || {};
        var titulo = n.title || d.title || 'Aviso';
        var acciones = []; try { acciones = JSON.parse(d.acciones || '[]'); } catch (_) { acciones = []; }
        var op = { body: n.body || d.body || '', icon: '/isotipo.png', badge: '/isotipo.png', tag: d.tag || 'roal-aviso', renotify: true, vibrate: [300, 120, 300], actions: (acciones || []).slice(0, 2), data: { url: d.url || '/admin.html', clienteId: d.clienteId || '', tipo: d.tipo || '' } };
        mostrar('📨 Llegó el aviso: ' + titulo + (op.body ? ' — ' + op.body : ''), 'bueno');
        return navigator.serviceWorker.getRegistration('/firebase-cloud-messaging-push-scope').then(function (reg) {
            if (reg && reg.showNotification) return reg.showNotification(titulo, op);
            return new Notification(titulo, { body: op.body, icon: op.icon, tag: op.tag });
        }).catch(function () { /* el mensaje en pantalla ya se mostró */ });
    }

    function probar() {
        var id = null; try { id = localStorage.getItem(CLAVE_DOC); } catch (_) { /* sin almacenamiento */ }
        if (!id || ocupado) return;
        ocupado = true; pintar();
        // Siempre se pide un token fresco y se guarda junto con la prueba: si el servidor borró el anterior por vencido,
        // un simple "probarAt" dejaría un documento sin token y la prueba nunca saldría.
        Promise.resolve(firebase.messaging().getToken({ vapidKey: VAPID_KEY }))
            .then(function (token) {
                if (!token) throw new Error('No se obtuvo el token del dispositivo.');
                return db.collection(COL).doc(id).set({ token: token, uid: user.uid, etiqueta: etiquetaDispositivo(), instalada: instalada(), updatedAt: firebase.firestore.FieldValue.serverTimestamp(), probarAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
            })
            .then(function () { mostrar('Prueba enviada. Con esta pantalla abierta lo verás aquí en unos segundos; para ver cómo llega de verdad, bloquea el celular o sal de la app y espera unos segundos.', 'bueno'); })
            .catch(function (e) { mostrar(mensajeError(e), 'malo'); })
            .then(function () { ocupado = false; pintar(); });
    }

    // Diagnóstico: muestra un aviso desde el propio service worker, SIN pasar por el servidor ni por Google. Si este sale y
    // el de "Enviar prueba" no, el celular puede mostrar avisos pero no está recibiendo los push (batería, red, datos).
    // Si ni este sale, Android está bloqueando la visualización de avisos de esta app.
    function probarLocal() {
        mostrar('Mostrando aviso local…', '');
        navigator.serviceWorker.getRegistrations().then(function (regs) {
            var info = regs.map(function (r) { return (r.scope || '').replace(location.origin, '') + (r.active ? ' [activo]' : r.installing ? ' [instalando]' : r.waiting ? ' [en espera]' : ' [sin sw]'); }).join(' · ') || 'ningún service worker';
            var reg = regs.filter(function (r) { return /firebase-cloud-messaging-push-scope/.test(r.scope) && r.active; })[0];
            if (!reg) { mostrar('No hay service worker de avisos activo (' + info + '). Toca "Desactivar" y luego "Activar avisos".', 'malo'); return; }
            return reg.showNotification('🔍 Prueba local', { body: 'Si ves esto, el celular sí puede mostrar avisos.', icon: '/isotipo.png', tag: 'roal-local' })
                .then(function () { mostrar('Se pidió el aviso local (' + info + '). Mira la barra de notificaciones: ¿salió "Prueba local"?', 'bueno'); });
        }).catch(function (e) { mostrar('El aviso local falló: ' + ((e && e.message) || e), 'malo'); });
    }

    function desactivar() {
        var id = null; try { id = localStorage.getItem(CLAVE_DOC); } catch (_) { /* sin almacenamiento */ }
        if (ocupado) return;
        ocupado = true; pintar();
        var borrarToken = function () { try { return firebase.messaging().deleteToken().catch(function () { return false; }); } catch (_) { return Promise.resolve(false); } };
        Promise.all([id ? db.collection(COL).doc(id).delete().catch(function () { return null; }) : null, borrarToken()]).then(function () {
            try { localStorage.removeItem(CLAVE_DOC); } catch (_) { /* sin almacenamiento */ }
            activo = false; ocupado = false; pintar(); mostrar('Avisos desactivados en este dispositivo.', '');
        });
    }

    function iniciar() {
        $('btnActivar').addEventListener('click', activar);
        $('btnProbar').addEventListener('click', probar);
        $('btnDesactivar').addEventListener('click', desactivar);
        $('btnLocal').addEventListener('click', probarLocal);
        // Salir de esta pantalla: volver a donde estabas (o al panel si se abrió directo)
        var salir = function (e) { e.preventDefault(); if (window.history.length > 1 && document.referrer && document.referrer.indexOf(location.origin) === 0) window.history.back(); else location.href = '/admin.html'; };
        $('btnAtras').addEventListener('click', salir);
        $('btnCerrar').addEventListener('click', salir);
        $('dispositivo').textContent = etiquetaDispositivo();
        pintar();
        if (!soportado()) return;
        try { var s = initFirebaseServices(); db = s.db; auth = s.auth; } catch (e) { mostrar('No se pudo conectar con el servidor: ' + (e.message || e), 'malo'); return; }
        if (!auth) { mostrar('No se pudo comprobar la sesión.', 'malo'); return; }
        try { firebase.messaging().onMessage(mostrarEnPrimerPlano); } catch (_) { /* sin messaging */ }
        auth.onAuthStateChanged(function (u) {
            user = u || null;
            var id = null; try { id = localStorage.getItem(CLAVE_DOC); } catch (_) { /* sin almacenamiento */ }
            if (!user || !id) { activo = false; pintar(); return; }
            // ¿Este dispositivo sigue registrado? (el servidor borra los tokens vencidos)
            db.collection(COL).doc(id).get().then(function (d) { activo = d.exists && !!(d.data() || {}).token && Notification.permission === 'granted'; pintar(); })
                .catch(function () { activo = false; pintar(); });
        });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
