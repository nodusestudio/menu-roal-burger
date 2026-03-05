// Splash/video handling removed: main content shows immediately.

// ========== FUNCIONES DE TRACKING ==========

// Función principal para rastrear clics en botones
function trackButtonClick(buttonId, buttonName) {
    // Log para verificación
    console.log(`🎯 CLICK TRACKED: ${buttonName} (ID: ${buttonId}) - Timestamp: ${new Date().toISOString()}`);
    
    // Google Analytics 4 - ACTIVO
    if (typeof gtag === 'function') {
        gtag('event', 'click', {
            event_category: 'engagement',
            event_label: buttonName,
            button_id: buttonId
        });
    }
    
    // Microsoft Clarity tracking - ACTIVO
    if (window.clarity) {
        window.clarity("set", "button_interaction", buttonName);
        window.clarity("set", "button_id", buttonId);
    }
}

// Función específica para rastrear interés por productos
function trackProductInterest(productName, buttonId) {
    // Log detallado para productos
    console.log(`🍔 INTERÉS EN PRODUCTO: ${productName} (Botón: ${buttonId}) - Timestamp: ${new Date().toISOString()}`);
    
    // Google Analytics 4 - Evento de interés en producto - ACTIVO
    if (typeof gtag === 'function') {
        gtag('event', 'interes_producto', {
            event_category: 'ecommerce',
            event_label: productName,
            item_name: productName,
            button_location: buttonId,
            action: 'whatsapp_interest'
        });
        
        // También como evento de select_item para ecommerce
        gtag('event', 'select_item', {
            item_list_name: 'Lo Mas Pedido',
            items: [{
                item_name: productName,
                item_category: 'Producto Principal'
            }]
        });
    }
    
    // Microsoft Clarity tracking para productos - ACTIVO
    if (window.clarity) {
        window.clarity("set", "producto_interes", productName);
        window.clarity("set", "button_clicked", buttonId);
    }
    
    // Llamar también al tracking general
    trackButtonClick(buttonId, `Interés en ${productName}`);
}

// Función para rastrear apertura del modal del menú
function trackMenuModal() {
    console.log('🍔 MENÚ MODAL ABIERTO - Timestamp: ' + new Date().toISOString());
    
    // Google Analytics 4 - ACTIVO
    if (typeof gtag === 'function') {
        gtag('event', 'view_item_list', {
            event_category: 'engagement',
            event_label: 'Menu Digital',
            item_list_name: 'Menu ROAL BURGER'
        });
    }
    
    // Microsoft Clarity tracking del menú - ACTIVO
    if (window.clarity) {
        window.clarity("set", "menu_modal", "opened");
        window.clarity("set", "user_action", "view_menu");
    }
}

// ========== FUNCIONES ORIGINALES ACTUALIZADAS ==========

const WHATSAPP_BASE_URL = 'https://wa.me/573144689509';
let activeMenuSection = 'PORTADA';

function buildDynamicWhatsAppUrl(sectionName) {
    const message = `Hola ROAL BURGER, estoy interesado en uno de los productos de la sección ${sectionName}`;
    return `${WHATSAPP_BASE_URL}?text=${encodeURIComponent(message)}`;
}

function updateDynamicWhatsAppLink(sectionName) {
    if (sectionName) {
        activeMenuSection = sectionName;
    }

    const floatingButton = document.getElementById('btn-whatsapp-flotante');
    if (!floatingButton) {
        return;
    }

    floatingButton.href = buildDynamicWhatsAppUrl(activeMenuSection);
    floatingButton.setAttribute('data-section-name', activeMenuSection);
}

function setActiveMenuNavLink(targetId) {
    const navLinks = document.querySelectorAll('.menu-nav-link');
    navLinks.forEach((link) => {
        const isActive = link.dataset.target === targetId;
        link.classList.toggle('active', isActive);
    });
}

function openDrawerMenu() {
    const drawer = document.getElementById('menuDrawer');
    const overlay = document.getElementById('drawerOverlay');
    if (drawer) {
        drawer.classList.add('open');
    }
    if (overlay) {
        overlay.classList.add('show');
    }
}

function closeDrawerMenu() {
    const drawer = document.getElementById('menuDrawer');
    const overlay = document.getElementById('drawerOverlay');
    if (drawer) {
        drawer.classList.remove('open');
    }
    if (overlay) {
        overlay.classList.remove('show');
    }
}

function setupMenuNavigation() {
    const modalContent = document.querySelector('#menuModal .modal-content');
    const navLinks = document.querySelectorAll('.menu-nav-link');
    const menuSections = document.querySelectorAll('.menu-section');
    const drawerToggle = document.getElementById('drawerToggle');
    const drawerClose = document.getElementById('drawerClose');
    const drawerOverlay = document.getElementById('drawerOverlay');

    if (!modalContent || navLinks.length === 0 || menuSections.length === 0) {
        return;
    }

    if (drawerToggle) {
        drawerToggle.addEventListener('click', openDrawerMenu);
    }

    if (drawerClose) {
        drawerClose.addEventListener('click', closeDrawerMenu);
    }

    if (drawerOverlay) {
        drawerOverlay.addEventListener('click', closeDrawerMenu);
    }

    navLinks.forEach((link) => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const targetId = link.dataset.target;
            const targetSection = document.getElementById(targetId);

            if (!targetSection) {
                return;
            }

            const sectionName = targetSection.dataset.sectionName || targetSection.querySelector('.menu-section-title')?.textContent?.trim() || 'PORTADA';
            updateDynamicWhatsAppLink(sectionName);
            setActiveMenuNavLink(targetId);
            closeDrawerMenu();

            targetSection.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        });
    });

    const firstSection = menuSections[0];
    if (firstSection) {
        const firstSectionName = firstSection.dataset.sectionName || 'PORTADA';
        updateDynamicWhatsAppLink(firstSectionName);
        setActiveMenuNavLink(firstSection.id);
    }

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) {
                    return;
                }

                const section = entry.target;
                const sectionName = section.dataset.sectionName || section.querySelector('.menu-section-title')?.textContent?.trim() || 'PORTADA';
                updateDynamicWhatsAppLink(sectionName);
                setActiveMenuNavLink(section.id);
            });
        }, {
            root: modalContent,
            threshold: 0.6
        });

        menuSections.forEach((section) => observer.observe(section));
    }

    const floatingButton = document.getElementById('btn-whatsapp-flotante');
    if (floatingButton) {
        floatingButton.addEventListener('click', () => {
            updateDynamicWhatsAppLink();
            trackButtonClick('btn-whatsapp-flotante', `WhatsApp Flotante - ${activeMenuSection}`);
        });
    }
}

// Función para abrir enlaces
function openLink(platform) {
    // Reproducir sonido de clic
    playClickSound();
    
    // Si es el menú, abrir modal en lugar de enlace externo
    if (platform === 'menu') {
        openMenuModal();
        trackMenuModal(); // Tracking del modal
        return;
    }
    
    const links = {
        whatsapp: 'https://wa.me/573144689509?text=Hola%20ROAL%20BURGER!%20Quisiera%20realizar%20un%20pedido%20por%20favor',
        instagram: 'https://www.instagram.com/roalburgerarmenia?igsh=cWE2eGRyNnlxaXgy&utm_source=qr',
        tiktok: 'https://www.tiktok.com/@roalburger',
        facebook: 'https://www.facebook.com/share/17ukpFaQz3/?mibextid=wwXIfr'
    };

    if (links[platform]) {
        window.open(links[platform], '_blank');
    }
}

// Función para abrir la modal del menú
function openMenuModal() {
    const modal = document.getElementById('menuModal');
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden'; // Prevenir scroll del body
    updateDynamicWhatsAppLink(activeMenuSection);
}

// Función para cerrar la modal del menú
function closeMenuModal() {
    const modal = document.getElementById('menuModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto'; // Restaurar scroll del body
    closeDrawerMenu();
}

// Cerrar modal al hacer clic fuera del contenido
window.onclick = function(event) {
    const modal = document.getElementById('menuModal');
    if (event.target === modal) {
        closeMenuModal();
    }
}

// Cerrar modal con la tecla ESC
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeMenuModal();
    }
});

// Función para reproducir sonido de clic
function playClickSound() {
    // Crear contexto de audio
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Crear oscilador para el sonido
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    // Conectar oscilador al gain y al destino
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Configurar sonido (frecuencia alta y breve)
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.type = 'sine';
    
    // Configurar volumen (muy bajo para ser sutil)
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    // Reproducir sonido muy breve
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
}

// Animación de entrada para los botones
document.addEventListener('DOMContentLoaded', function() {
    setupMenuNavigation();
    updateDynamicWhatsAppLink(activeMenuSection);

    const buttons = document.querySelectorAll('.link-button');
    const infoCard = document.querySelector('.info-card');
    
    // Animación de la tarjeta de información
    setTimeout(() => {
        infoCard.style.opacity = '0';
        infoCard.style.transform = 'translateY(20px)';
        infoCard.style.transition = 'all 0.6s ease';
        
        setTimeout(() => {
            infoCard.style.opacity = '1';
            infoCard.style.transform = 'translateY(0)';
        }, 100);
    }, 200);
    
    // Animación de los botones
    buttons.forEach((button, index) => {
        button.style.opacity = '0';
        button.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            button.style.transition = 'all 0.6s ease';
            button.style.opacity = '1';
            button.style.transform = 'translateY(0)';
        }, 300 + (index * 100));
    });
});

// Efecto de partículas al hacer hover (opcional)
document.querySelectorAll('.link-button').forEach(button => {
    button.addEventListener('mouseenter', function() {
        this.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    });
    
    button.addEventListener('mouseleave', function() {
        this.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    });
});

// Añadir efecto de ripple al hacer clic
document.querySelectorAll('.link-button').forEach(button => {
    button.addEventListener('click', function(e) {
        const ripple = document.createElement('span');
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.classList.add('ripple');
        
        this.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    });
});

// CSS para el efecto ripple
const style = document.createElement('style');
style.textContent = `
    .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.3);
        transform: scale(0);
        animation: ripple-animation 0.6s ease-out;
        pointer-events: none;
    }
    
    @keyframes ripple-animation {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
