function trackButtonClick(buttonId, buttonName) {
    if (typeof gtag === 'function') {
        gtag('event', 'click', {
            event_category: 'engagement',
            event_label: buttonName,
            button_id: buttonId
        });
    }

    if (window.clarity) {
        try {
            window.clarity('set', 'button_interaction', buttonName);
            window.clarity('set', 'button_id', buttonId);
        } catch (e) {
            // ignore clarity errors
        }
    }
}

function trackProductInterest(productName, buttonId) {
    if (typeof gtag === 'function') {
        gtag('event', 'interes_producto', {
            event_category: 'ecommerce',
            event_label: productName,
            item_name: productName,
            button_location: buttonId,
            action: 'whatsapp_interest'
        });

        gtag('event', 'select_item', {
            item_list_name: 'Lo Mas Pedido',
            items: [{
                item_name: productName,
                item_category: 'Producto Principal'
            }]
        });
    }

    if (window.clarity) {
        try {
            window.clarity('set', 'producto_interes', productName);
            window.clarity('set', 'button_clicked', buttonId);
        } catch (e) {
            // ignore clarity errors
        }
    }

    trackButtonClick(buttonId, `Interes en ${productName}`);
}

function trackMenuModal() {
    if (typeof gtag === 'function') {
        gtag('event', 'view_item_list', {
            event_category: 'engagement',
            event_label: 'Menu Digital',
            item_list_name: 'Menu Roal Burger'
        });
    }

    if (window.clarity) {
        try {
            window.clarity('set', 'menu_modal', 'opened');
            window.clarity('set', 'user_action', 'view_menu');
        } catch (e) {
            // ignore clarity errors
        }
    }
}

function trackVisita(db) {
    try {
        if (!db) return;
        const now = new Date();
        const date = now.toISOString().slice(0, 10);
        const hour = now.getHours();
        const ref = document.referrer || '';
        const params = new URLSearchParams(window.location.search);
        const utm = params.get('utm_source');
        let source = 'directo';
        if (utm) { source = utm.toLowerCase(); }
        else if (ref.includes('instagram.com')) { source = 'instagram'; }
        else if (ref.includes('facebook.com') || ref.includes('fb.com') || ref.includes('fb.me')) { source = 'facebook'; }
        else if (ref.includes('tiktok.com')) { source = 'tiktok'; }
        // "whatsapp" cubre api.whatsapp.com / web.whatsapp.com (los enlaces propios ya no usan wa.me);
        // wa.me se mantiene para enlaces viejos o compartidos por terceros.
        else if (ref.includes('wa.me') || ref.includes('whatsapp')) { source = 'whatsapp'; }
        else if (ref.includes('google.')) { source = 'google'; }
        else if (ref) { source = 'otro'; }
        db.collection('visitas').add({ ts: Date.now(), date, hour, source });
    } catch(e) {}
}


// ── Presencia en vivo (admin: "En vivo" en la barra lateral) ─────────────────────────────────────────────────────
// Cada visitante con la página visible mantiene UN documento presencia/{sid} (sin datos personales: solo qué hay en su carrito).
// Se escribe solo cuando cambia algo (debounce) o cada 60 s como latido; con la pestaña oculta no se escribe nada. Al cerrar se borra.
function startPresencia(db) {
    try {
        if (!db || window.__roalPresencia) return;
        if (/[?&]nopresencia=1/.test(location.search)) return;
        window.__roalPresencia = true;
        let sid = '';
        // Estable por navegador (localStorage): varias pestañas o ir del menú al juego cuentan como UNA persona, no como varias.
        try { sid = localStorage.getItem('roal_vid') || sessionStorage.getItem('roal_sid') || ''; } catch (_) { /* sin storage */ }
        if (!sid) { sid = Date.now().toString(36) + Math.random().toString(36).slice(2, 10); }
        try { localStorage.setItem('roal_vid', sid); sessionStorage.setItem('roal_sid', sid); } catch (_) { /* sin storage */ }
        const ref = db.collection('presencia').doc(sid);
        const inicio = Date.now();
        const disp = /Mobi|Android|iPhone/i.test(navigator.userAgent) ? 'movil' : 'pc';
        const params = new URLSearchParams(location.search), rf = document.referrer || '';
        const fuente = (params.get('utm_source') || (rf.includes('instagram') ? 'instagram' : rf.includes('facebook') || rf.includes('fb.') ? 'facebook' : rf.includes('whatsapp') || rf.includes('wa.me') ? 'whatsapp' : rf.includes('google.') ? 'google' : rf.includes('tiktok') ? 'tiktok' : rf ? 'otro' : 'directo')).toLowerCase().slice(0, 20);
        let ultimaFirma = '', ultimoEnvio = 0;
        const leerCarrito = () => {
            try { const a = JSON.parse(localStorage.getItem('roalburger-cart-v1') || '[]'); return Array.isArray(a) ? a : []; } catch (_) { return []; }
        };
        const enviar = (forzar) => {
            if (document.visibilityState !== 'visible') return;
            const cart = leerCarrito().filter((i) => i && i.productName);
            const items = cart.slice(0, 15).map((i) => ({ n: String(i.productName).slice(0, 40), q: Math.max(1, Number(i.quantity) || 1), p: Math.round(Number(i.unitPrice) || 0), h: i.parentKey ? 1 : 0 }));
            const total = Math.round(cart.reduce((t, i) => t + (Number(i.unitPrice) || 0) * (Number(i.quantity) || 1), 0));
            const pagando = !!document.getElementById('checkout-info-modal');
            const etapa = pagando ? 'pagando' : (items.length ? 'carrito' : 'viendo');
            const firma = `${etapa}|${(window.__roalCid && window.__roalCid()) || ''}|${total}|${items.map((i) => i.n + i.q).join(',')}`;
            const ahora = Date.now();
            if (!forzar && firma === ultimaFirma && ahora - ultimoEnvio < 60000) return;
            ultimaFirma = firma; ultimoEnvio = ahora;
            let cid = ''; try { cid = String((window.__roalCid && window.__roalCid()) || '').slice(0, 40); } catch (_) { /* sin sesión */ }
            ref.set({ sid, ts: ahora, inicio, etapa, items, total, disp, fuente, cid, lugar: 'menu' }).catch(() => {});
        };
        enviar(true);
        setInterval(() => enviar(false), 5000); // revisa cambios (barato: solo lee localStorage); escribe únicamente si algo cambió o pasó 1 min
        document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') enviar(true); });
        window.addEventListener('pagehide', () => { try { ref.delete(); } catch (_) { /* mejor esfuerzo */ } });
    } catch (e) { /* la presencia nunca debe romper el menú */ }
}

// Expose to global scope explicitly (for older browsers)
window.trackButtonClick = window.trackButtonClick || trackButtonClick;
window.trackProductInterest = window.trackProductInterest || trackProductInterest;
window.trackMenuModal = window.trackMenuModal || trackMenuModal;
window.trackVisita = window.trackVisita || trackVisita;
window.startPresencia = window.startPresencia || startPresencia;
