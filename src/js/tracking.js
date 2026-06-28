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
        else if (ref.includes('wa.me') || ref.includes('whatsapp')) { source = 'whatsapp'; }
        else if (ref.includes('google.')) { source = 'google'; }
        else if (ref) { source = 'otro'; }
        db.collection('visitas').add({ ts: Date.now(), date, hour, source });
    } catch(e) {}
}

// Expose to global scope explicitly (for older browsers)
window.trackButtonClick = window.trackButtonClick || trackButtonClick;
window.trackProductInterest = window.trackProductInterest || trackProductInterest;
window.trackMenuModal = window.trackMenuModal || trackMenuModal;
window.trackVisita = window.trackVisita || trackVisita;
