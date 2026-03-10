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
let allCategoryMeta = [];
let buttonConfigsMap = new Map();
let selectedCategoryKey = '';
let featuredCarouselAutoPlayTimer = null;
let featuredCarouselResumeTimer = null;
let featuredCarouselUserPaused = false;

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
    primaryColor: '#2f6fdd',
    secondaryColor: '#5f95ea',
    accentColor: '#43c09c',
    template: 'fodexa',
    bgColor: '#0e1420',
    buttonBorderColor: '#8ca9da',
    fontFamily: 'Roboto, sans-serif',
    fontSizeBase: 16,
    interactionVolume: 0.1,
    animationSpeed: 1
};

const BRANDING_THEMES = ['fodexa', 'slate', 'ivory', 'cobalt', 'ember', 'mono'];
let globalInteractionVolume = DEFAULT_BRANDING.interactionVolume;

const LOCAL_PRODUCT_IMAGE_FILES = [
    'bebidas y adicionales.png',
    'BURGER CLASICAS.png',
    'BURGER PREMIUM.png',
    'COMBOS BURGER.png',
    'COMBOS DE PERROS Y EXPRESS.png',
    'COMBOS DE TEMPORADAS.png',
    'COMBOS FAMILIARES.png',
    'CORDILLERA.png',
    'empanadas.png',
    'entradas.png',
    'menu combo emparejado.png',
    'PEPITOS VENEZOLANOS.png',
    'PERROS CALIENTES Y SALCHIPAPAS.png',
    'PLUS.png'
];

const LOCAL_PRODUCT_IMAGE_MAP = LOCAL_PRODUCT_IMAGE_FILES.reduce((acc, fileName) => {
    const base = fileName.replace(/\.png$/i, '');
    const key = normalizeCategoryKey(base).replace(/[^a-z0-9]+/g, '');
    if (key) {
        acc.set(key, fileName);
    }
    return acc;
}, new Map());

const CATEGORY_BUTTON_PRIORITY = [
    'burger premium',
    'burger clasicas',
    'burger clasica',
    'pepitos venezolanos',
    'pepitos',
    'perros y salchipapas',
    'perros calientes y salchipapas',
    'entradas',
    'combos burger',
    'combos perros',
    'combos perros y express',
    'combos de perros y express',
    'combos familiares',
    'combos de temporada',
    'combos de temporadas',
    'bebidas y adicionales',
    'adicionales'
];

const FORCED_CATEGORY_BUTTONS = [
    { key: 'pepitos venezolanos', name: 'PEPITOS VENEZOLANOS' },
    { key: 'combos burger', name: 'COMBOS BURGER' },
    { key: 'combos perros', name: 'COMBOS PERROS' },
    { key: 'combos familiares', name: 'COMBOS FAMILIARES' },
    { key: 'combos de temporada', name: 'COMBOS DE TEMPORADA' },
    { key: 'bebidas y adicionales', name: 'BEBIDAS Y ADICIONALES' }
];

const CATEGORY_IMAGE_ALIASES = {
    burgerclasica: 'BURGER CLASICAS.png',
    burgerclasicas: 'BURGER CLASICAS.png',
    burgerpremium: 'BURGER PREMIUM.png',
    pepitos: 'PEPITOS VENEZOLANOS.png',
    pepitosvenezolanos: 'PEPITOS VENEZOLANOS.png',
    perrosysalchipapas: 'PERROS CALIENTES Y SALCHIPAPAS.png',
    perroscalientesysalchipapas: 'PERROS CALIENTES Y SALCHIPAPAS.png',
    entradas: 'entradas.png',
    combosburger: 'COMBOS BURGER.png',
    combosperros: 'PERROS CALIENTES Y SALCHIPAPAS.png',
    combosperrosyexpress: 'COMBOS DE PERROS Y EXPRESS.png',
    combosdeperrosyexpress: 'COMBOS DE PERROS Y EXPRESS.png',
    combosfamiliares: 'COMBOS FAMILIARES.png',
    combosdetemporada: 'COMBOS DE TEMPORADAS.png',
    combosdetemporadas: 'COMBOS DE TEMPORADAS.png',
    bebidasyadicionales: 'bebidas y adicionales.png',
    adicionales: 'bebidas y adicionales.png'
};

const PINNED_CATEGORY_BUTTONS = [
    { key: 'burger premium', name: 'BURGER PREMIUM', matchKeys: ['burger premium'] },
    { key: 'burger clasicas', name: 'BURGER CLASICAS', matchKeys: ['burger clasicas', 'burger clasica'] },
    { key: 'pepitos venezolanos', name: 'PEPITOS VENEZOLANOS', matchKeys: ['pepitos venezolanos', 'pepitos'] },
    { key: 'perros y salchipapas', name: 'PERROS Y SALCHIPAPAS', matchKeys: ['perros y salchipapas', 'perros calientes y salchipapas'] },
    { key: 'entradas', name: 'ENTRADAS', matchKeys: ['entradas'] },
    { key: 'combos burger', name: 'COMBOS BURGER', matchKeys: ['combos burger', 'combo burger', 'combos de burger'] },
    { key: 'combos perros', name: 'COMBOS PERROS', matchKeys: ['combos perros', 'combos perros y express', 'combos de perros y express', 'combos de perros', 'combos express'] },
    { key: 'combos familiares', name: 'COMBOS FAMILIARES', matchKeys: ['combos familiares', 'combo familiar'] },
    { key: 'combos de temporada', name: 'COMBOS DE TEMPORADA', matchKeys: ['combos de temporada', 'combos de temporadas', 'combos temporada'] },
    { key: 'bebidas y adicionales', name: 'BEBIDAS Y ADICIONALES', matchKeys: ['bebidas y adicionales', 'adicionales', 'bebidas'] }
];

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

const HIDDEN_PRODUCT_KEYS = new Set(['de la casa', 'plus', 'burger plus']);
const HIDDEN_PRODUCT_NAME_PARTS = ['de la casa'];

function normalizeCategoryKey(value) {
    return String(value || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
}

function normalizeAssetLookup(value) {
    return normalizeCategoryKey(value).replace(/[^a-z0-9]+/g, '');
}

function shouldHideProductByName(name) {
    const key = normalizeCategoryKey(name);
    if (!key) {
        return false;
    }

    if (HIDDEN_PRODUCT_KEYS.has(key)) {
        return true;
    }

    return HIDDEN_PRODUCT_NAME_PARTS.some((part) => key.includes(part));
}

function shouldHideCategoryList(category) {
    const key = normalizeCategoryKey(category?.key || category?.name || '');
    return key === 'bebidas y adicionales' || key === 'adicionales';
}

function resolveProductImage(product) {
    const productName = String(product?.nombre || product?.name || '').trim();
    const normalizedProductName = normalizeAssetLookup(productName);
    const localMatch = LOCAL_PRODUCT_IMAGE_MAP.get(normalizedProductName);

    if (localMatch) {
        return localMatch;
    }

    const remote = String(product?.image_url || '').trim();
    if (remote) {
        return remote;
    }

    return 'logo.png';
}

function resolveCategoryImage(categoryName) {
    const normalizedCategory = normalizeAssetLookup(categoryName);
    if (CATEGORY_IMAGE_ALIASES[normalizedCategory]) {
        return CATEGORY_IMAGE_ALIASES[normalizedCategory];
    }

    const localMatch = LOCAL_PRODUCT_IMAGE_MAP.get(normalizedCategory);
    return localMatch || 'logo.png';
}

function isCategoryAllowed(categoryName) {
    if (!activeCategories || !activeCategories.size) {
        return true;
    }

    const key = normalizeCategoryKey(categoryName);
    if (!key) {
        return true;
    }

    if (activeCategories.has(key)) {
        return true;
    }

    if (key.startsWith('combos') && activeCategories.has('combos')) {
        return true;
    }

    for (const activeKey of activeCategories) {
        if (key.includes(activeKey) || activeKey.includes(key)) {
            return true;
        }
    }

    return false;
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
    const normalizedFontSize = Number(raw.fontSizeBase);
    const normalizedInteraction = Number(raw.interactionVolume);
    const normalizedSpeed = Number(raw.animationSpeed);

    return {
        restaurantName: String(raw.restaurantName || DEFAULT_BRANDING.restaurantName),
        slogan: String(raw.slogan || DEFAULT_BRANDING.slogan),
        logoUrl: String(raw.logoUrl || DEFAULT_BRANDING.logoUrl),
        primaryColor: String(raw.primaryColor || DEFAULT_BRANDING.primaryColor),
        secondaryColor: String(raw.secondaryColor || DEFAULT_BRANDING.secondaryColor),
        accentColor: String(raw.accentColor || DEFAULT_BRANDING.accentColor),
        template: BRANDING_THEMES.includes(raw.template) ? raw.template : DEFAULT_BRANDING.template,
        bgColor: String(raw.bgColor || DEFAULT_BRANDING.bgColor),
        buttonBorderColor: String(raw.buttonBorderColor || DEFAULT_BRANDING.buttonBorderColor),
        fontFamily: String(raw.fontFamily || DEFAULT_BRANDING.fontFamily),
        fontSizeBase: Number.isFinite(normalizedFontSize) ? Math.max(14, Math.min(22, normalizedFontSize)) : DEFAULT_BRANDING.fontSizeBase,
        interactionVolume: Number.isFinite(normalizedInteraction) ? Math.max(0, Math.min(1, normalizedInteraction)) : DEFAULT_BRANDING.interactionVolume,
        animationSpeed: Number.isFinite(normalizedSpeed) ? Math.max(0.6, Math.min(1.8, normalizedSpeed)) : DEFAULT_BRANDING.animationSpeed
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
        if (shouldHideProductByName(nombre)) {
            return;
        }
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
            image_url: resolveProductImage(product),
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
                const isAdicionales = normalizeCategoryKey(category.name) === 'adicionales';

                visibleProducts.forEach((product) => {
                    if (isAdicionales) {
                        const image = document.createElement('img');
                        image.className = 'menu-image';
                        image.src = product.image_url;
                        image.alt = product.nombre;
                        section.appendChild(image);

                        const meta = document.createElement('div');
                        meta.style.display = 'flex';
                        meta.style.justifyContent = 'space-between';
                        meta.style.alignItems = 'center';
                        meta.style.margin = '8px 2px 14px';
                        meta.style.fontWeight = '700';
                        meta.style.fontSize = '1rem';
                        meta.style.color = '#fff';

                        const name = document.createElement('span');
                        name.textContent = product.nombre;

                        const price = document.createElement('span');
                        price.textContent = `$ ${Number(product.precio).toLocaleString('es-CO')}`;
                        price.style.color = 'var(--brand-secondary, #ffb27a)';

                        meta.appendChild(name);
                        meta.appendChild(price);
                        section.appendChild(meta);
                        return;
                    }

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
    const fixedFeaturedCards = [
        { nombre: 'COMBO DE LA CASA', image_url: 'DE LA CASA.jpeg', buttonId: 'btn-featured-combo-casa' },
        { nombre: 'BURGER PLUS', image_url: 'PLUS.png', buttonId: 'btn-featured-burger-plus' }
    ];

    const featuredProducts = latestProducts
        .map((product) => {
            const estado = product.estado || (product.paused ? 'paused' : 'active');
            const esDestacado = product.es_destacado === true || product.featured === true;
            const categoria = product.categoria || product.category || '';
            const nombre = product.nombre || product.name || 'Producto';
            return {
                id: product.id,
                nombre,
                image_url: resolveProductImage(product),
                estado,
                es_destacado: esDestacado,
                categoria,
                updated_at: product.updated_at
            };
        })
        .filter((product) => {
            const categoryAllowed = isCategoryAllowed(product.categoria);
            return product.es_destacado && product.estado !== 'paused' && categoryAllowed && !shouldHideProductByName(product.nombre);
        })
        .sort((a, b) => {
            const aTs = a.updated_at && typeof a.updated_at.toMillis === 'function' ? a.updated_at.toMillis() : 0;
            const bTs = b.updated_at && typeof b.updated_at.toMillis === 'function' ? b.updated_at.toMillis() : 0;
            return bTs - aTs;
        })
        .slice(0, 5);

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

    fixedFeaturedCards.forEach((fixedCard) => {
        const card = document.createElement('div');
        card.className = 'product-card-mobile';

        const imageWrap = document.createElement('div');
        imageWrap.className = 'card-image-wrapper';

        const image = document.createElement('img');
        image.className = 'product-image-mobile';
        image.alt = fixedCard.nombre;
        image.src = fixedCard.image_url;

        const button = document.createElement('a');
        button.className = 'mobile-order-btn';
        button.id = fixedCard.buttonId;
        button.target = '_blank';
        button.rel = 'noopener noreferrer';
        button.href = `${WHATSAPP_BASE_URL}?text=${encodeURIComponent(`Hola ROAL BURGER! Me interesa ${fixedCard.nombre}`)}`;
        button.textContent = 'Lo Quiero';
        button.addEventListener('click', () => {
            trackProductInterest(fixedCard.nombre, fixedCard.buttonId);
        });

        imageWrap.appendChild(image);
        card.appendChild(imageWrap);
        card.appendChild(button);
        carousel.appendChild(card);
    });

    setupFeaturedCarouselAutoplay(carousel);
}

function stopFeaturedCarouselAutoplay() {
    if (featuredCarouselAutoPlayTimer) {
        clearInterval(featuredCarouselAutoPlayTimer);
        featuredCarouselAutoPlayTimer = null;
    }
}

function updateFeaturedCarouselToggleLabel() {
    const toggle = document.getElementById('featuredCarouselToggle');
    if (!toggle) {
        return;
    }

    toggle.textContent = featuredCarouselUserPaused ? 'Reanudar carrusel' : 'Pausar carrusel';
    toggle.setAttribute('aria-pressed', featuredCarouselUserPaused ? 'true' : 'false');
}

function startFeaturedCarouselAutoplay(carousel) {
    if (!carousel || featuredCarouselUserPaused) {
        return;
    }

    const cards = carousel.querySelectorAll('.product-card-mobile');
    if (!cards.length) {
        return;
    }

    stopFeaturedCarouselAutoplay();
    featuredCarouselAutoPlayTimer = setInterval(() => {
        if (featuredCarouselUserPaused) {
            return;
        }

        const maxScrollLeft = Math.max(0, carousel.scrollWidth - carousel.clientWidth);
        if (!maxScrollLeft) {
            return;
        }

        const firstCard = cards[0];
        const step = Math.max(180, Math.round(firstCard?.offsetWidth || 220));
        const next = carousel.scrollLeft + step;

        if (next >= maxScrollLeft - 8) {
            carousel.scrollTo({ left: 0, behavior: 'smooth' });
            return;
        }

        carousel.scrollTo({ left: next, behavior: 'smooth' });
    }, 2600);
}

function setupFeaturedCarouselAutoplay(carousel) {
    const section = carousel?.closest('.featured-section');
    if (!section) {
        return;
    }

    let controls = section.querySelector('.featured-carousel-controls');
    if (!controls) {
        controls = document.createElement('div');
        controls.className = 'featured-carousel-controls';

        const toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.id = 'featuredCarouselToggle';
        toggle.className = 'featured-carousel-toggle';
        toggle.addEventListener('click', () => {
            featuredCarouselUserPaused = !featuredCarouselUserPaused;
            updateFeaturedCarouselToggleLabel();
            if (featuredCarouselUserPaused) {
                stopFeaturedCarouselAutoplay();
                return;
            }
            startFeaturedCarouselAutoplay(carousel);
        });

        controls.appendChild(toggle);
        carousel.insertAdjacentElement('afterend', controls);
    }

    updateFeaturedCarouselToggleLabel();

    if (carousel.dataset.autoplayBound !== 'true') {
        carousel.addEventListener('pointerenter', () => {
            stopFeaturedCarouselAutoplay();
        });

        carousel.addEventListener('pointerleave', () => {
            if (featuredCarouselUserPaused) {
                return;
            }
            stopFeaturedCarouselAutoplay();
            featuredCarouselResumeTimer = setTimeout(() => {
                startFeaturedCarouselAutoplay(carousel);
            }, 900);
        });

        carousel.addEventListener('touchstart', () => {
            stopFeaturedCarouselAutoplay();
            if (featuredCarouselResumeTimer) {
                clearTimeout(featuredCarouselResumeTimer);
                featuredCarouselResumeTimer = null;
            }
        }, { passive: true });

        carousel.addEventListener('touchend', () => {
            if (featuredCarouselUserPaused) {
                return;
            }
            if (featuredCarouselResumeTimer) {
                clearTimeout(featuredCarouselResumeTimer);
            }
            featuredCarouselResumeTimer = setTimeout(() => {
                startFeaturedCarouselAutoplay(carousel);
            }, 1200);
        }, { passive: true });

        carousel.dataset.autoplayBound = 'true';
    }

    startFeaturedCarouselAutoplay(carousel);
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

        const safeVolume = Math.max(0, Math.min(1, (Number(volume) || 0.1) * (Number(globalInteractionVolume) || 0.1)));
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
        renderSocialMiniLinks();
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

    const excludedButtons = new Set(['btn-menu', 'btn-whatsapp-main', 'btn-instagram', 'btn-tiktok', 'btn-facebook']);

    ordered.forEach((cfg) => {
        if (excludedButtons.has(cfg.id)) {
            return;
        }

        const button = createOrGetPublicButton(cfg);
        if (!button) {
            return;
        }

        applyButtonStyles(button, cfg);
        const bound = bindButtonAction(button, cfg);
        container.appendChild(bound);
    });

    renderSocialMiniLinks();
}

function renderSocialMiniLinks() {
    const map = {
        instagram: document.getElementById('social-instagram'),
        tiktok: document.getElementById('social-tiktok'),
        facebook: document.getElementById('social-facebook')
    };

    Object.entries(map).forEach(([platform, anchor]) => {
        if (!anchor) {
            return;
        }

        const cfg = getButtonConfigByPlatform(platform);
        if (!cfg || cfg.visible === false || cfg.estado === 'paused') {
            anchor.style.display = 'none';
            return;
        }

        anchor.style.display = '';
        anchor.href = cfg.link || '#';
    });
}

function getExplorerCategories() {
    const uniqueMap = new Map();
    const keys = new Set();

    allCategoryMeta.forEach((item) => {
        const name = item?.name;
        const cleanName = String(name || '').trim();
        const key = normalizeCategoryKey(cleanName);
        if (!cleanName || !key || keys.has(key) || key === 'adicionales' || key === 'combos') {
            return;
        }
        keys.add(key);
        uniqueMap.set(key, { name: cleanName, key });
    });

    latestProducts.forEach((product) => {
        const name = product.categoria || product.category || '';
        const cleanName = String(name || '').trim();
        const key = normalizeCategoryKey(cleanName);
        if (!cleanName || !key || keys.has(key) || key === 'adicionales' || key === 'combos') {
            return;
        }
        keys.add(key);
        uniqueMap.set(key, { name: cleanName, key });
    });

    FORCED_CATEGORY_BUTTONS.forEach((item) => {
        const key = normalizeCategoryKey(item.key);
        const name = String(item.name || '').trim();
        if (!key || !name) {
            return;
        }

        uniqueMap.set(key, { key, name });
    });

    const priorityIndex = new Map(CATEGORY_BUTTON_PRIORITY.map((item, index) => [item, index]));

    return Array.from(uniqueMap.values()).sort((a, b) => {
        const aPriority = priorityIndex.has(a.key) ? priorityIndex.get(a.key) : 999;
        const bPriority = priorityIndex.has(b.key) ? priorityIndex.get(b.key) : 999;

        if (aPriority !== bPriority) {
            return aPriority - bPriority;
        }

        return a.name.localeCompare(b.name, 'es');
    });
}

function ensureForcedExplorerCategories(categories) {
    const byKey = new Map(categories.map((item) => [normalizeCategoryKey(item.key), item]));

    FORCED_CATEGORY_BUTTONS.forEach((item) => {
        const key = normalizeCategoryKey(item.key);
        const name = String(item.name || '').trim();
        if (!key || !name) {
            return;
        }

        byKey.set(key, { key, name });
    });

    const priorityIndex = new Map(CATEGORY_BUTTON_PRIORITY.map((item, index) => [normalizeCategoryKey(item), index]));

    return Array.from(byKey.values()).sort((a, b) => {
        const aKey = normalizeCategoryKey(a.key);
        const bKey = normalizeCategoryKey(b.key);
        const aPriority = priorityIndex.has(aKey) ? priorityIndex.get(aKey) : 999;
        const bPriority = priorityIndex.has(bKey) ? priorityIndex.get(bKey) : 999;

        if (aPriority !== bPriority) {
            return aPriority - bPriority;
        }

        return a.name.localeCompare(b.name, 'es');
    });
}

function ensurePinnedExplorerCategories(categories) {
    const inputMap = new Map((categories || []).map((item) => [normalizeCategoryKey(item.key), item]));
    const pinnedList = [];

    PINNED_CATEGORY_BUTTONS.forEach((item) => {
        const key = normalizeCategoryKey(item.key);
        if (!key) {
            return;
        }

        const existing = inputMap.get(key);
        pinnedList.push({
            key,
            name: existing?.name || item.name,
            matchKeys: (item.matchKeys || [item.key]).map((value) => normalizeCategoryKey(value))
        });
    });

    return pinnedList;
}

function getCategoryProducts(category) {
    const selectedKeys = new Set((category?.matchKeys || [category?.key || '']).map((value) => normalizeCategoryKey(value)).filter(Boolean));

    return latestProducts
        .map((product) => {
            const nombre = product.nombre || product.name || 'Producto';
            const precio = Number(product.precio ?? product.price ?? 0);
            const estado = String(product.estado || (product.paused ? 'paused' : 'active')).toLowerCase();
            const categoria = String(product.categoria || product.category || '').trim();
            return {
                nombre,
                precio,
                categoria,
                image_url: resolveProductImage(product),
                estado
            };
        })
        .filter((product) => {
            if (product.estado === 'paused') {
                return false;
            }

            if (shouldHideProductByName(product.nombre)) {
                return false;
            }

            const key = normalizeCategoryKey(product.categoria);
            if (!key) {
                return false;
            }

            return selectedKeys.has(key);
        })
        .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

function renderCategoryExplorer(nextKey) {
    const grid = document.getElementById('categoryGrid');
    const panel = document.getElementById('categoryProductsPanel');
    if (!grid || !panel) {
        return;
    }

    const categories = ensurePinnedExplorerCategories(ensureForcedExplorerCategories(getExplorerCategories()));
    grid.innerHTML = '';

    if (!categories.length) {
        panel.innerHTML = '<p class="category-empty">No hay categorias disponibles por ahora.</p>';
        return;
    }

    if (nextKey) {
        selectedCategoryKey = nextKey;
    }

    if (!selectedCategoryKey || !categories.some((item) => item.key === selectedCategoryKey)) {
        selectedCategoryKey = categories[0].key;
    }

    categories.forEach((category) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `category-chip${category.key === selectedCategoryKey ? ' active' : ''}`;

        const thumb = document.createElement('img');
        thumb.className = 'category-chip-thumb';
        thumb.src = resolveCategoryImage(category.name);
        thumb.alt = category.name;
        thumb.loading = 'lazy';
        thumb.decoding = 'async';
        thumb.addEventListener('error', () => {
            thumb.src = 'logo.png';
        });

        const label = document.createElement('span');
        label.className = 'category-chip-label';
        label.textContent = category.name;

        button.appendChild(thumb);
        button.appendChild(label);
        button.addEventListener('click', () => {
            selectedCategoryKey = category.key;
            renderCategoryExplorer(category.key);
        });
        grid.appendChild(button);
    });

    const selectedCategory = categories.find((item) => item.key === selectedCategoryKey) || categories[0];
    const products = getCategoryProducts(selectedCategory);

    const heroWrap = document.createElement('div');
    heroWrap.className = 'category-hero-wrap';

    const heroImage = document.createElement('img');
    heroImage.className = 'category-hero-image';
    heroImage.alt = `Imagen de ${selectedCategory.name}`;
    heroImage.loading = 'lazy';
    heroImage.decoding = 'async';
    heroImage.src = resolveCategoryImage(selectedCategory.name);
    heroImage.addEventListener('error', () => {
        heroImage.src = resolveCategoryImage(selectedCategory.name);
    });

    const heroTitle = document.createElement('p');
    heroTitle.className = 'category-hero-title';
    heroTitle.textContent = selectedCategory.name;

    heroWrap.appendChild(heroImage);
    heroWrap.appendChild(heroTitle);

    if (!products.length || shouldHideCategoryList(selectedCategory)) {
        panel.innerHTML = '';
        panel.appendChild(heroWrap);
        return;
    }

    const list = document.createElement('div');
    list.className = 'category-products-list';

    products.forEach((product, index) => {
        const row = document.createElement('div');
        row.className = 'category-product-row';

        const thumb = document.createElement('img');
        thumb.className = 'category-product-thumb';
        thumb.src = product.image_url || 'logo.png';
        thumb.alt = product.nombre;
        thumb.loading = 'lazy';
        thumb.decoding = 'async';
        thumb.addEventListener('error', () => {
            thumb.src = 'logo.png';
        });

        const info = document.createElement('div');
        const title = document.createElement('strong');
        title.textContent = product.nombre;
        const price = document.createElement('div');
        price.className = 'muted';
        price.textContent = `$ ${Number(product.precio || 0).toLocaleString('es-CO')}`;
        info.appendChild(title);
        info.appendChild(price);

        const orderBtn = document.createElement('a');
        const btnId = `btn-category-${selectedCategory.key}-${index + 1}`;
        orderBtn.className = 'category-order-btn';
        orderBtn.href = `${WHATSAPP_BASE_URL}?text=${encodeURIComponent(`Hola ROAL BURGER! Me interesa ${product.nombre}`)}`;
        orderBtn.target = '_blank';
        orderBtn.rel = 'noopener noreferrer';
        orderBtn.textContent = 'Pedir';
        orderBtn.addEventListener('click', () => {
            trackProductInterest(product.nombre, btnId);
        });

        row.appendChild(thumb);
        row.appendChild(info);
        row.appendChild(orderBtn);
        list.appendChild(row);
    });

    panel.innerHTML = '';
    panel.appendChild(heroWrap);
    panel.appendChild(list);
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
    root.style.setProperty('--landing-bg-color', config.bgColor);
    root.style.setProperty('--landing-button-border-color', config.buttonBorderColor);
    root.style.setProperty('--landing-font-family', config.fontFamily);
    root.style.setProperty('--landing-font-size-base', `${config.fontSizeBase}px`);
    root.style.setProperty('--landing-animation-speed', String(config.animationSpeed));

    ensureLandingGoogleFont(config.fontFamily);

    globalInteractionVolume = config.interactionVolume;

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

function ensureLandingGoogleFont(fontFamily) {
    const family = String(fontFamily || '').toLowerCase();
    const familyParamMap = {
        roboto: 'Roboto:wght@300;400;500;700',
        manrope: 'Manrope:wght@400;500;700;800',
        'plus jakarta sans': 'Plus+Jakarta+Sans:wght@400;600;700',
        'space grotesk': 'Space+Grotesk:wght@400;500;700'
    };

    const key = Object.keys(familyParamMap).find((item) => family.includes(item));
    if (!key) {
        return;
    }

    let link = document.getElementById('dynamicLandingFont');
    if (!link) {
        link = document.createElement('link');
        link.id = 'dynamicLandingFont';
        link.rel = 'stylesheet';
        document.head.appendChild(link);
    }

    link.href = `https://fonts.googleapis.com/css2?family=${familyParamMap[key]}&display=swap`;
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
        renderCategoryExplorer();
    });

    categoriesUnsubscribe = firebaseDb.collection('categorias').onSnapshot((snapshot) => {
        allCategoryMeta = snapshot.docs
            .map((doc) => doc.data())
            .map((category) => ({
                name: category.name,
                key: normalizeCategoryKey(category.name)
            }))
            .filter((category) => category.name && category.key);

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
        renderCategoryExplorer();
    });

    buttonsUnsubscribe = firebaseDb.collection('botones').onSnapshot((snapshot) => {
        buttonConfigsMap = new Map();
        snapshot.docs.forEach((doc) => {
            buttonConfigsMap.set(doc.id, normalizeButtonConfig(doc.data(), doc.id));
        });
        renderConfiguredButtons();
    });

    brandingUnsubscribe = firebaseDb.collection('configuracion').doc('config_landing').onSnapshot((doc) => {
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
    renderCategoryExplorer();
});
