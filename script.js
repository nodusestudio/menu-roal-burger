function trackButtonClick(buttonId, buttonName) {
    if (typeof gtag === 'function') {
        gtag('event', 'click', {
            event_category: 'engagement',
            event_label: buttonName,
            button_id: buttonId
        });
    }

    if (window.clarity) {
        window.clarity('set', 'button_interaction', buttonName);
        window.clarity('set', 'button_id', buttonId);
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
        window.clarity('set', 'producto_interes', productName);
        window.clarity('set', 'button_clicked', buttonId);
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
        window.clarity('set', 'menu_modal', 'opened');
        window.clarity('set', 'user_action', 'view_menu');
    }
}

const WHATSAPP_BASE_URL = 'https://wa.me/573144689509';
let activeMenuSection = 'PORTADA';
let featuredProductsUnsubscribe = null;
let categoriesUnsubscribe = null;
let buttonsUnsubscribe = null;
let brandingUnsubscribe = null;
let latestProducts = [];
let activeCategories = null;
let activeCategoryMeta = [];
let buttonConfigsMap = new Map();

const DEFAULT_PUBLIC_BUTTONS = {
    'btn-menu': {
        id: 'btn-menu',
        label: 'VER NUESTRO MENU DIGITAL',
        icon: '📱',
        actionType: 'menu-modal',
        link: '',
        buttonType: 'neon',
        color: '#ff6000',
        size: 'xl',
        soundEnabled: true,
        volume: 0.1,
        estado: 'active',
        visible: true,
        order: 1
    },
    'btn-whatsapp-main': {
        id: 'btn-whatsapp-main',
        label: 'PIDE TU DOMICILIO AQUI',
        icon: '📱',
        actionType: 'external',
        link: 'https://wa.me/573144689509?text=Hola%20ROAL%20BURGER!%20Quisiera%20realizar%20un%20pedido%20por%20favor',
        buttonType: 'solid',
        color: '#25d366',
        size: 'lg',
        soundEnabled: true,
        volume: 0.1,
        estado: 'active',
        visible: true,
        order: 2
    },
    'btn-instagram': {
        id: 'btn-instagram',
        label: 'MOMENTOS ROAL EN INSTAGRAM',
        icon: '📷',
        actionType: 'external',
        link: 'https://www.instagram.com/roalburgerarmenia?igsh=cWE2eGRyNnlxaXgy&utm_source=qr',
        buttonType: 'glass',
        color: '#e1306c',
        size: 'md',
        soundEnabled: true,
        volume: 0.08,
        estado: 'active',
        visible: true,
        order: 3
    },
    'btn-tiktok': {
        id: 'btn-tiktok',
        label: 'SABOR REAL EN TIKTOK',
        icon: '🎵',
        actionType: 'external',
        link: 'https://www.tiktok.com/@roalburger',
        buttonType: 'glass',
        color: '#00f2ea',
        size: 'md',
        soundEnabled: true,
        volume: 0.08,
        estado: 'active',
        visible: true,
        order: 4
    },
    'btn-facebook': {
        id: 'btn-facebook',
        label: 'COMUNIDAD ROAL EN FACEBOOK',
        icon: '👥',
        actionType: 'external',
        link: 'https://www.facebook.com/share/17ukpFaQz3/?mibextid=wwXIfr',
        buttonType: 'minimal',
        color: '#1877f2',
        size: 'md',
        soundEnabled: false,
        volume: 0.05,
        estado: 'active',
        visible: true,
        order: 5
    }
};

const DEFAULT_BRANDING = {
    restaurantName: 'ROAL BURGER',
    slogan: 'Comida rapida con acento venezolano',
    logoUrl: 'logo.png',
    primaryColor: '#ff6000',
    secondaryColor: '#ff8533',
    accentColor: '#25d366',
    template: 'flame'
};

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

function normalizeButtonConfig(raw, id) {
    return {
        id: String(id || raw.id || '').trim(),
        label: String(raw.label || 'Boton').trim(),
        icon: String(raw.icon || '🔗').trim(),
        actionType: raw.actionType === 'menu-modal' ? 'menu-modal' : 'external',
        link: String(raw.link || '').trim(),
        buttonType: ['neon', 'solid', 'glass', 'minimal'].includes(raw.buttonType) ? raw.buttonType : 'neon',
        color: String(raw.color || '#ff6000').trim(),
        size: ['sm', 'md', 'lg', 'xl'].includes(raw.size) ? raw.size : 'md',
        soundEnabled: raw.soundEnabled !== false,
        volume: Number.isFinite(Number(raw.volume)) ? Math.max(0, Math.min(1, Number(raw.volume))) : 0.1,
        estado: raw.estado === 'paused' ? 'paused' : 'active',
        visible: raw.visible !== false,
        order: Number.isFinite(Number(raw.order)) ? Number(raw.order) : 99
    };
}

function normalizeBranding(raw) {
    return {
        restaurantName: String(raw.restaurantName || DEFAULT_BRANDING.restaurantName),
        slogan: String(raw.slogan || DEFAULT_BRANDING.slogan),
        logoUrl: String(raw.logoUrl || DEFAULT_BRANDING.logoUrl),
        primaryColor: String(raw.primaryColor || DEFAULT_BRANDING.primaryColor),
        secondaryColor: String(raw.secondaryColor || DEFAULT_BRANDING.secondaryColor),
        accentColor: String(raw.accentColor || DEFAULT_BRANDING.accentColor),
        template: ['flame', 'ocean', 'forest', 'midnight', 'sunset'].includes(raw.template) ? raw.template : DEFAULT_BRANDING.template
    };
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

    const staticCategoryKeys = new Set(Object.values(SECTION_CATEGORY_KEYS).map((value) => normalizeCategoryKey(value)));

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

            const visibleProducts = data.products.filter((product) => product.estado !== 'paused');

            if (!visibleProducts.length) {
                const empty = document.createElement('p');
                empty.textContent = 'No hay productos cargados en esta categoria.';
                empty.style.color = '#b6b6b6';
                empty.style.fontSize = '0.95rem';
                section.appendChild(empty);
            } else {
                visibleProducts.forEach((product) => {
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
                    price.style.color = 'var(--brand-secondary, #ffb27a)';
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
            const categoryAllowed = !activeCategories || activeCategories.has(normalizeCategoryKey(product.categoria));
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

    featuredProducts.forEach((product, index) => {
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
        button.textContent = 'Lo Quiero';
        button.addEventListener('click', () => {
            trackProductInterest(safeName, buttonId);
        });

        imageWrap.appendChild(image);
        card.appendChild(imageWrap);
        card.appendChild(button);
        carousel.appendChild(card);
    });
}

function getButtonConfigByPlatform(platform) {
    if (platform === 'menu') {
        return buttonConfigsMap.get('btn-menu') || DEFAULT_PUBLIC_BUTTONS['btn-menu'];
    }
    if (platform === 'instagram') {
        return buttonConfigsMap.get('btn-instagram') || DEFAULT_PUBLIC_BUTTONS['btn-instagram'];
    }
    if (platform === 'tiktok') {
        return buttonConfigsMap.get('btn-tiktok') || DEFAULT_PUBLIC_BUTTONS['btn-tiktok'];
    }
    if (platform === 'facebook') {
        return buttonConfigsMap.get('btn-facebook') || DEFAULT_PUBLIC_BUTTONS['btn-facebook'];
    }
    if (platform === 'whatsapp') {
        return buttonConfigsMap.get('btn-whatsapp-main') || DEFAULT_PUBLIC_BUTTONS['btn-whatsapp-main'];
    }
    return null;
}

function playClickSound(volume = 0.1) {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.type = 'sine';

        const safeVolume = Math.max(0, Math.min(1, Number(volume) || 0.1));
        gainNode.gain.setValueAtTime(safeVolume, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
        // Ignore audio failures on restricted devices.
    }
}

function createOrGetPublicButton(buttonConfig) {
    const container = document.querySelector('.links-container');
    if (!container) {
        return null;
    }

    let button = document.getElementById(buttonConfig.id);
    if (!button) {
        button = document.createElement('a');
        button.id = buttonConfig.id;
        button.className = 'neon-button config-btn';

        const icon = document.createElement('span');
        icon.className = 'button-icon';

        const text = document.createElement('span');
        text.className = 'button-text';

        const border = document.createElement('div');
        border.className = 'neon-border';

        button.appendChild(icon);
        button.appendChild(text);
        button.appendChild(border);

        container.appendChild(button);
    }

    return button;
}

function applyButtonStyles(button, cfg) {
    button.classList.add('config-btn');
    button.classList.remove('btn-type-neon', 'btn-type-solid', 'btn-type-glass', 'btn-type-minimal');
    button.classList.remove('btn-size-sm', 'btn-size-md', 'btn-size-lg', 'btn-size-xl');
    button.classList.remove('pulse-animation', 'featured-button', 'whatsapp-button', 'instagram-button', 'tiktok-button', 'facebook-button', 'mega-button');

    button.classList.add(`btn-type-${cfg.buttonType}`);
    button.classList.add(`btn-size-${cfg.size}`);

    button.style.setProperty('--btn-custom-color', cfg.color || '#ff6000');
    button.style.opacity = cfg.estado === 'paused' ? '0.45' : '1';

    const iconEl = button.querySelector('.button-icon');
    const textEl = button.querySelector('.button-text');

    if (iconEl) {
        iconEl.textContent = cfg.icon || '🔗';
    }

    if (textEl) {
        textEl.textContent = cfg.label || 'BOTON';
    }
}

function bindButtonAction(button, cfg) {
    const clone = button.cloneNode(true);
    button.parentNode.replaceChild(clone, button);

    clone.removeAttribute('onclick');

    if (!cfg.visible) {
        clone.style.display = 'none';
        return clone;
    }

    clone.style.display = '';

    clone.addEventListener('click', (event) => {
        event.preventDefault();

        trackButtonClick(cfg.id, cfg.label || cfg.id);

        if (cfg.soundEnabled) {
            playClickSound(cfg.volume);
        }

        if (cfg.estado === 'paused') {
            return;
        }

        if (cfg.actionType === 'menu-modal') {
            openMenuModal();
            trackMenuModal();
            return;
        }

        const safeLink = cfg.link || '#';
        window.open(safeLink, '_blank', 'noopener');
    });

    return clone;
}

function renderConfiguredButtons() {
    const container = document.querySelector('.links-container');
    if (!container) {
        return;
    }

    const mergedButtons = new Map();
    Object.values(DEFAULT_PUBLIC_BUTTONS).forEach((item) => {
        mergedButtons.set(item.id, { ...item });
    });
    buttonConfigsMap.forEach((value, key) => {
        mergedButtons.set(key, { ...value });
    });

    const ordered = Array.from(mergedButtons.values()).sort((a, b) => a.order - b.order);

    ordered.forEach((cfg) => {
        const button = createOrGetPublicButton(cfg);
        if (!button) {
            return;
        }

        applyButtonStyles(button, cfg);
        const bound = bindButtonAction(button, cfg);
        container.appendChild(bound);
    });
}

function ensureBrandBanner() {
    const container = document.getElementById('main-menu');
    if (!container) {
        return null;
    }

    let banner = document.getElementById('brandBanner');
    if (!banner) {
        banner = document.createElement('div');
        banner.id = 'brandBanner';
        banner.className = 'brand-banner';

        const logo = document.createElement('img');
        logo.id = 'brandBannerLogo';
        logo.className = 'brand-banner-logo';

        const wrap = document.createElement('div');

        const title = document.createElement('h2');
        title.id = 'brandBannerTitle';

        const slogan = document.createElement('p');
        slogan.id = 'brandBannerSlogan';

        wrap.appendChild(title);
        wrap.appendChild(slogan);
        banner.appendChild(logo);
        banner.appendChild(wrap);

        container.insertBefore(banner, container.firstChild);
    }

    return banner;
}

function applyBrandingConfig(configRaw) {
    const config = normalizeBranding(configRaw || {});

    const root = document.documentElement;
    root.style.setProperty('--brand-primary', config.primaryColor);
    root.style.setProperty('--brand-secondary', config.secondaryColor);
    root.style.setProperty('--brand-accent', config.accentColor);

    document.body.dataset.theme = config.template;
    document.title = `${config.restaurantName} - Enlaces`;

    const footer = document.querySelector('.footer p');
    if (footer) {
        footer.textContent = `${config.restaurantName} - ${config.slogan}`;
    }

    const banner = ensureBrandBanner();
    if (banner) {
        const logo = document.getElementById('brandBannerLogo');
        const title = document.getElementById('brandBannerTitle');
        const slogan = document.getElementById('brandBannerSlogan');

        if (logo) {
            logo.src = config.logoUrl || 'logo.png';
            logo.alt = `Logo ${config.restaurantName}`;
        }

        if (title) {
            title.textContent = config.restaurantName;
        }

        if (slogan) {
            slogan.textContent = config.slogan;
        }
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

    if (featuredProductsUnsubscribe || categoriesUnsubscribe || buttonsUnsubscribe || brandingUnsubscribe) {
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

    buttonsUnsubscribe = firebaseDb.collection('botones').onSnapshot((snapshot) => {
        buttonConfigsMap = new Map();
        snapshot.docs.forEach((doc) => {
            buttonConfigsMap.set(doc.id, normalizeButtonConfig(doc.data(), doc.id));
        });
        renderConfiguredButtons();
    });

    brandingUnsubscribe = firebaseDb.collection('configuracion').doc('marca').onSnapshot((doc) => {
        applyBrandingConfig(doc.exists ? doc.data() : DEFAULT_BRANDING);
    });
}

function buildDynamicWhatsAppUrl(sectionName) {
    const message = `Hola ROAL BURGER, estoy interesado en uno de los productos de la seccion ${sectionName}`;
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

            targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

function openLink(platform) {
    const config = getButtonConfigByPlatform(platform);
    if (!config) {
        return;
    }

    if (config.soundEnabled) {
        playClickSound(config.volume);
    }

    if (config.estado === 'paused') {
        return;
    }

    if (config.actionType === 'menu-modal') {
        openMenuModal();
        trackMenuModal();
        return;
    }

    if (config.link) {
        window.open(config.link, '_blank', 'noopener');
    }
}

function openMenuModal() {
    const modal = document.getElementById('menuModal');
    if (!modal) {
        return;
    }

    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    updateDynamicWhatsAppLink(activeMenuSection);
}

function closeMenuModal() {
    const modal = document.getElementById('menuModal');
    if (!modal) {
        return;
    }

    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    closeDrawerMenu();
}

window.onclick = function(event) {
    const modal = document.getElementById('menuModal');
    if (event.target === modal) {
        closeMenuModal();
    }
};

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        closeMenuModal();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    setupMenuNavigation();
    updateDynamicWhatsAppLink(activeMenuSection);
    renderPublicFeaturedFromAdmin();

    applyBrandingConfig(DEFAULT_BRANDING);
    buttonConfigsMap = new Map(
        Object.values(DEFAULT_PUBLIC_BUTTONS).map((button) => [button.id, { ...button }])
    );
    renderConfiguredButtons();
});
