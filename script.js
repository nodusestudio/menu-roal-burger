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
let featuredProductsUnsubscribe = null;
let categoriesUnsubscribe = null;
let latestProducts = [];
let activeCategories = null;
let activeCategoryMeta = [];

const SECTION_CATEGORY_KEYS = {
    'menu-burger-premium': 'burger premium',
    'menu-burger-clasicas': 'burger clasicas',
    'menu-perros-salchipapas': 'perros y salchipapas',
    'menu-entradas': 'entradas',
    'menu-combos-burger': 'combos',
    'menu-combos-perros': 'combos',
    'menu-combos-familiares': 'combos',
    'menu-combos-temporada': 'combos'
};

function normalizeCategoryKey(value) {
    return String(value || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
}

function applyCategoryVisibility() {
    if (!activeCategories) {
        return;
    }

    Object.entries(SECTION_CATEGORY_KEYS).forEach(([sectionId, categoryKey]) => {
        const section = document.getElementById(sectionId);
        const navLink = document.querySelector(`.menu-nav-link[data-target="${sectionId}"]`);
        const visible = activeCategories.has(categoryKey);

        if (section) {
            section.style.display = visible ? '' : 'none';
        }

        if (navLink) {
            navLink.style.display = visible ? '' : 'none';
        }
    });

    const activeLink = document.querySelector('.menu-nav-link.active');
    if (activeLink && activeLink.style.display === 'none') {
        const firstVisible = Array.from(document.querySelectorAll('.menu-nav-link')).find((link) => link.style.display !== 'none');
        if (firstVisible) {
            const targetId = firstVisible.dataset.target;
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                const sectionName = targetSection.dataset.sectionName || targetSection.querySelector('.menu-section-title')?.textContent?.trim() || 'PORTADA';
                updateDynamicWhatsAppLink(sectionName);
                setActiveMenuNavLink(targetId);
            }
        }
    }
}

function renderDynamicCategorySections() {
    const container = document.querySelector('.menu-images-container');
    if (!container || !activeCategories) {
        return;
    }

    container.querySelectorAll('.dynamic-category-section').forEach((node) => node.remove());

    const staticCategoryKeys = new Set(
        Object.values(SECTION_CATEGORY_KEYS).map((value) => normalizeCategoryKey(value))
    );

    const grouped = new Map();
    latestProducts.forEach((product) => {
        const nombre = product.nombre || product.name || 'Producto';
        const precio = Number(product.precio ?? product.price ?? 0);
        const categoria = product.categoria || product.category || '';
        const key = normalizeCategoryKey(categoria);
        if (!key || !activeCategories.has(key) || staticCategoryKeys.has(key)) {
            return;
        }

        if (!grouped.has(key)) {
            grouped.set(key, { displayName: categoria, products: [] });
        }

        grouped.get(key).products.push({
            nombre,
            precio,
            image_url: product.image_url || 'logo.png',
            estado: product.estado || (product.paused ? 'paused' : 'active')
        });
    });

    activeCategoryMeta
        .filter((category) => !staticCategoryKeys.has(category.key))
        .forEach((category) => {
            const data = grouped.get(category.key) || { displayName: category.name, products: [] };
            const section = document.createElement('section');
            section.className = 'menu-section dynamic-category-section';
            section.dataset.sectionName = category.name;

            const title = document.createElement('h3');
            title.className = 'menu-section-title';
            title.textContent = category.name;
            section.appendChild(title);

            if (!data.products.length) {
                const empty = document.createElement('p');
                empty.textContent = 'No hay productos cargados en esta categoria.';
                empty.style.color = '#b6b6b6';
                empty.style.fontSize = '0.95rem';
                section.appendChild(empty);
            } else {
                data.products
                    .filter((product) => product.estado !== 'paused')
                    .forEach((product) => {
                        const card = document.createElement('div');
                        card.style.display = 'grid';
                        card.style.gridTemplateColumns = '68px 1fr auto';
                        card.style.gap = '10px';
                        card.style.alignItems = 'center';
                        card.style.padding = '10px';
                        card.style.border = '1px solid rgba(255,255,255,0.12)';
                        card.style.borderRadius = '10px';
                        card.style.marginBottom = '10px';
                        card.style.background = 'rgba(0,0,0,0.22)';

                        const img = document.createElement('img');
                        img.src = product.image_url;
                        img.alt = product.nombre;
                        img.style.width = '68px';
                        img.style.height = '68px';
                        img.style.objectFit = 'cover';
                        img.style.borderRadius = '8px';

                        const name = document.createElement('div');
                        name.textContent = product.nombre;
                        name.style.fontWeight = '600';

                        const price = document.createElement('div');
                        price.textContent = `$ ${Number(product.precio).toLocaleString('es-CO')}`;
                        price.style.color = '#ffb27a';
                        price.style.fontWeight = '700';

                        card.appendChild(img);
                        card.appendChild(name);
                        card.appendChild(price);
                        section.appendChild(card);
                    });
            }

            container.appendChild(section);
        });
}

function renderFeaturedCards(carousel) {
    const featuredProducts = latestProducts
        .map((product) => {
            const estado = product.estado || (product.paused ? 'paused' : 'active');
            const esDestacado = product.es_destacado === true || product.featured === true;
            const categoria = product.categoria || product.category || '';
            return {
                id: product.id,
                nombre: product.nombre || product.name || 'Producto',
                image_url: product.image_url || 'logo.png',
                estado,
                es_destacado: esDestacado,
                categoria,
                updated_at: product.updated_at
            };
        })
        .filter((product) => {
            const categoryAllowed = !activeCategories || activeCategories.has(product.categoria);
            return product.es_destacado && product.estado !== 'paused' && categoryAllowed;
        })
        .sort((a, b) => {
            const aTs = a.updated_at && typeof a.updated_at.toMillis === 'function' ? a.updated_at.toMillis() : 0;
            const bTs = b.updated_at && typeof b.updated_at.toMillis === 'function' ? b.updated_at.toMillis() : 0;
            return bTs - aTs;
        })
        .slice(0, 5);

    if (!featuredProducts.length) {
        return;
    }

    carousel.innerHTML = '';

    for (let index = 0; index < featuredProducts.length; index += 1) {
        const product = featuredProducts[index];
        const safeName = String(product.nombre || 'Producto').trim() || 'Producto';
        const buttonId = `btn-featured-${index + 1}`;

        const card = document.createElement('div');
        card.className = 'product-card-mobile';

        const imageWrap = document.createElement('div');
        imageWrap.className = 'card-image-wrapper';

        const image = document.createElement('img');
        image.className = 'product-image-mobile';
        image.alt = safeName;
        image.src = product.image_url;

        const button = document.createElement('a');
        button.className = 'mobile-order-btn';
        button.id = buttonId;
        button.target = '_blank';
        button.rel = 'noopener noreferrer';
        button.href = `${WHATSAPP_BASE_URL}?text=${encodeURIComponent(`Hola ROAL BURGER! Me interesa ${safeName}`)}`;
        button.textContent = '¡Lo Quiero!';
        button.addEventListener('click', () => {
            trackProductInterest(safeName, buttonId);
        });

        imageWrap.appendChild(image);
        card.appendChild(imageWrap);
        card.appendChild(button);
        carousel.appendChild(card);
    }
}

async function renderPublicFeaturedFromAdmin() {
    const carousel = document.querySelector('.featured-section .mobile-carousel');
    if (!carousel) {
        return;
    }

    if (typeof initFirebaseServices !== 'function') {
        return;
    }

    let firebaseDb;
    try {
        firebaseDb = initFirebaseServices().db;
    } catch (error) {
        return;
    }

    if (featuredProductsUnsubscribe || categoriesUnsubscribe) {
        return;
    }

    featuredProductsUnsubscribe = firebaseDb.collection('productos').onSnapshot((snapshot) => {
        latestProducts = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        renderDynamicCategorySections();
        renderFeaturedCards(carousel);
    });

    categoriesUnsubscribe = firebaseDb.collection('categorias').onSnapshot((snapshot) => {
        const active = snapshot.docs
            .map((doc) => doc.data())
            .filter((category) => category.active !== false)
            .map((category) => ({
                name: category.name,
                key: normalizeCategoryKey(category.name)
            }));

        activeCategoryMeta = active;
        activeCategories = new Set(active.map((item) => item.key));
        applyCategoryVisibility();
        renderDynamicCategorySections();
        renderFeaturedCards(carousel);
    });
}

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

function goBackFromPublic() {
    trackButtonClick('btn-back', 'Volver Atras');

    if (window.history.length > 1) {
        window.history.back();
        return;
    }

    window.location.href = 'admin.html';
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
    renderPublicFeaturedFromAdmin();

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
