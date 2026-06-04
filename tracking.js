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
            item_list_name: 'Menu ROAL BURGER'
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

// Expose to global scope explicitly (for older browsers)
window.trackButtonClick = window.trackButtonClick || trackButtonClick;
window.trackProductInterest = window.trackProductInterest || trackProductInterest;
window.trackMenuModal = window.trackMenuModal || trackMenuModal;
