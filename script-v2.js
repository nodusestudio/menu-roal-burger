// Tracking functions moved to tracking.js

const WHATSAPP_BASE_URL = 'https://wa.me/573144689509';
const PAGE_URL_PARAMS = new URLSearchParams(window.location.search);
const IS_ADMIN_PREVIEW = PAGE_URL_PARAMS.get('adminPreview') === '1';
const ORDERING_SCHEDULE = {
    timeZone: 'America/Bogota',
    startMinutes: 16 * 60,
    endMinutes: 22 * 60,
    label: 'Lunes a Domingo: 4:00 P.M. a 10:00 P.M.',
    openMessage: 'Abierto ahora. Ya puedes hacer tu pedido.',
    closedMessage: 'Disculpa, en este momento estamos cerrados. Nuestro horario de pedidos es de 4:00 P.M. a 10:00 P.M.'
};
const ORDER_SENT_CONFIRMATION_MESSAGE = 'Recibimos tu pedido. Un asesor te escribira pronto con el total y el valor del domicilio.';
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
let featuredCarouselResumeTimer = null;
let featuredCarouselUserPaused = false;
let orderingStatusToastTimer = null;
let orderSentToastTimer = null;

function getCurrentOrderingMinutes(now = new Date()) {
    const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: ORDERING_SCHEDULE.timeZone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    }).formatToParts(now);
    const hour = Number(parts.find((part) => part.type === 'hour')?.value || 0);
    const minute = Number(parts.find((part) => part.type === 'minute')?.value || 0);
    return (hour * 60) + minute;
}

function getOrderingAvailability(now = new Date()) {
    const currentMinutes = getCurrentOrderingMinutes(now);
    const isOpen = currentMinutes >= ORDERING_SCHEDULE.startMinutes && currentMinutes < ORDERING_SCHEDULE.endMinutes;

    return {
        isOpen,
        scheduleLabel: ORDERING_SCHEDULE.label,
        statusLabel: isOpen ? ORDERING_SCHEDULE.openMessage : ORDERING_SCHEDULE.closedMessage
    };
}

function canPlaceOrdersNow() {
    return getOrderingAvailability().isOpen;
}

function showOrderingClosedMessage() {
    const availability = getOrderingAvailability();
    let toast = document.getElementById('orderingStatusToast');

    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'orderingStatusToast';
        toast.className = 'ordering-status-toast';
        document.body.appendChild(toast);
    }

    toast.textContent = availability.statusLabel;
    toast.classList.add('is-visible');

    if (orderingStatusToastTimer) {
        window.clearTimeout(orderingStatusToastTimer);
    }

    orderingStatusToastTimer = window.setTimeout(() => {
        toast.classList.remove('is-visible');
    }, 2600);
}

function showOrderSentMessage() {
    let toast = document.getElementById('orderSentToast');

    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'orderSentToast';
        toast.className = 'order-sent-toast';
        document.body.appendChild(toast);
    }

    toast.textContent = ORDER_SENT_CONFIRMATION_MESSAGE;
    toast.classList.add('is-visible');

    if (orderSentToastTimer) {
        window.clearTimeout(orderSentToastTimer);
    }

    orderSentToastTimer = window.setTimeout(() => {
        toast.classList.remove('is-visible');
    }, 3200);
}

function syncBusinessHoursStatus() {
    const availability = getOrderingAvailability();
    const hoursText = document.getElementById('businessHoursText');
    const statusText = document.getElementById('businessHoursStatus');

    if (hoursText) {
        hoursText.textContent = availability.scheduleLabel;
    }

    if (statusText) {
        statusText.textContent = availability.statusLabel;
        statusText.classList.toggle('is-open', availability.isOpen);
        statusText.classList.toggle('is-closed', !availability.isOpen);
    }
}

function setOrderControlAvailability(control) {
    if (!control) {
        return;
    }

    const availability = getOrderingAvailability();
    const openLabel = control.dataset.openLabel || control.textContent.trim();

    if (!control.dataset.openLabel) {
        control.dataset.openLabel = openLabel;
    }

    control.textContent = control.dataset.openLabel;
    control.classList.remove('is-ordering-closed');
    control.title = availability.isOpen ? '' : ORDERING_SCHEDULE.closedMessage;

    if (control.tagName === 'BUTTON') {
        control.disabled = control.classList.contains('cart-checkout-btn') ? !shoppingCart.length : false;
        return;
    }

    if (!control.dataset.orderHref && control.getAttribute('href')) {
        control.dataset.orderHref = control.getAttribute('href');
    }

    control.setAttribute('href', control.dataset.orderHref || '#');
    control.setAttribute('aria-disabled', 'false');
    control.tabIndex = 0;
}

function syncOrderingAvailabilityUI() {
    syncBusinessHoursStatus();
    document.querySelectorAll('.mobile-order-btn, .category-order-btn, .category-hero-order-btn, .cart-checkout-btn, .promo-btn-order').forEach((control) => {
        setOrderControlAvailability(control);
    });
}

function getSelectedCategoryName() {
    const categories = ensurePinnedExplorerCategories(ensureForcedExplorerCategories(getExplorerCategories()));
    const selectedCategory = categories.find((item) => item.key === selectedCategoryKey);
    return selectedCategory?.name || 'NUESTROS PRODUCTOS';
}

function buildProductWhatsAppUrl(productName, categoryName) {
    const safeProductName = String(productName || 'producto').trim() || 'producto';
    const safeCategoryName = String(categoryName || getSelectedCategoryName()).trim() || 'NUESTROS PRODUCTOS';
    return `${WHATSAPP_BASE_URL}?text=${encodeURIComponent(`PEDIDO\nProducto: ${safeProductName}\nCategoria: ${safeCategoryName}`)}`;
}

const COMBO_EXTRA_PRICE = 7000;
const COMBO_DRINK_OPTIONS = ['Pepsi Zero', 'Colombia', 'Manzana'];
const COMBO_MEAL_SMALL_DRINK_OPTIONS = ['Pepsi Zero', 'Colombia', 'Manzana'];
const COMBO_MEAL_LARGE_DRINK_OPTIONS = ['Pepsi Zero', 'Colombia', 'Manzana', 'Naranja', 'Uva', 'Toronja', 'Pepsi Original'];
const RECOMMENDED_DAY_FALLBACK_PRODUCT = {
    nombre: 'Caracas',
    categoria: 'BURGER PREMIUM',
    image_url: './burgerpremium/burgercaracas.png',
    estado: 'active'
};
const RECOMMENDED_DAY_DISCOUNT_RATE = 0.2;
const RECOMMENDED_DAY_EXCLUDED_CATEGORY_PARTS = ['bebidas y adicionales', 'adicionales', 'bebidas', 'nuestras salsas'];
const MANUAL_IMAGE_BASE_PRICES = {
    './burgerpremium/burgercaracas.png': 26000,
    './burgerpremium/burgercordillera.png': 34000,
    './burgerpremium/burgerpapuda.png': 20000,
    './burgerpremium/burgerplus.png': 30000,
    './burgerpremium/burgerranchera.png': 30000,
    './burgerpremium/burgertriplete.png': 29000,
    './burgerclasicas/burgersuper.png': 19000,
    './perroscalientes/perroespecial.png': 15000,
    './perroscalientes/perronormal.png': 12000,
    './perroscalientes/perrosuper.png': 16000,
    './pepitosvenezolanos/pepitomix.png': 29000,
    './pepitosvenezolanos/pepitoplus.png': 36000,
    './pepitosvenezolanos/pepitoranchero.png': 34000,
    './pepitosvenezolanos/pepitourbano.png': 30000,
    './salchipapas/salchinormal.png': 12000,
    './combosmixtos/delacasa.png': 49000,
    './combosmixtos/emparejados.png': 45000,
    './combosmixtos/familiar3.png': 48000,
    './combosmixtos/familiar4.png': 44000,
    './promodeldia/diadelahamburguesa.jpg': 21000
};
const COMBOS_CON_PAPAS_IMAGE_PRICES = {
    './combosconpapasybebidas/comboburgernormal.png': { 1: 21000, 2: 38000, 3: 57000, 4: 73000 },
    './combosconpapasybebidas/comboburgerpapuda.png': { 1: 27000, 2: 48000, 3: 70000, 4: 91000 },
    './combosconpapasybebidas/comboburgersuper.png': { 1: 26000, 2: 46000, 3: 68000, 4: 87000 },
    './combosconpapasybebidas/comboperronormal.png': { 1: 17000, 2: 25000, 3: 38000, 4: 49000 }
};

function normalizeImageAssetPath(value) {
    const normalized = String(value || '').trim().replace(/\\/g, '/');
    if (!normalized) {
        return '';
    }

    if (normalized.startsWith('./')) {
        return normalized;
    }

    return `./${normalized.replace(/^\.?\//, '')}`;
}

function buildParentRelativeImagePath(value) {
    const normalized = String(value || '').trim().replace(/\\/g, '/');
    if (!normalized || /^(https?:)?\/\//i.test(normalized) || normalized.startsWith('data:') || normalized.startsWith('blob:')) {
        return '';
    }

    if (normalized.startsWith('../')) {
        return `../${normalized}`;
    }

    if (normalized.startsWith('./')) {
        return `../${normalized.slice(2)}`;
    }

    if (normalized.startsWith('/')) {
        return `..${normalized}`;
    }

    return `../${normalized}`;
}

function applyImageFallback(imageElement) {
    if (!(imageElement instanceof HTMLImageElement)) {
        return;
    }

    const currentSource = imageElement.getAttribute('src') || '';
    const fallbackSource = buildParentRelativeImagePath(currentSource);

    if (!fallbackSource || fallbackSource === currentSource || imageElement.dataset.roalFallbackApplied === '1') {
        return;
    }

    imageElement.dataset.roalFallbackApplied = '1';
    imageElement.src = fallbackSource;
}

function installImageFallbackHandler() {
    if (window.__roalBurgerImageFallbackInstalled) {
        return;
    }

    window.__roalBurgerImageFallbackInstalled = true;

    document.addEventListener('error', (event) => {
        applyImageFallback(event.target);
    }, true);

    document.querySelectorAll('img').forEach((imageElement) => {
        if (imageElement.complete && imageElement.naturalWidth === 0) {
            applyImageFallback(imageElement);
        }
    });
}

installImageFallbackHandler();

function isCombosConPapasCategory(categoryName) {
    const normalizedCategory = normalizeCategoryKey(categoryName);
    return normalizedCategory.includes('combos con papas y bebida');
}

function isCombosMixtosCategory(categoryName) {
    const normalizedCategory = normalizeCategoryKey(categoryName);
    return normalizedCategory.includes('combos mixtos');
}

function isEntradasCategory(categoryName) {
    const normalizedCategory = normalizeCategoryKey(categoryName);
    return normalizedCategory.includes('entradas');
}

function isBebidasYAdicionalesCategory(categoryName) {
    const normalizedCategory = normalizeCategoryKey(categoryName);
    return normalizedCategory.includes('bebidas') || normalizedCategory.includes('adicionales');
}

function isComboCategory(categoryName) {
    const normalizedCategory = normalizeCategoryKey(categoryName);
    if (!normalizedCategory) {
        return false;
    }

    return normalizedCategory.includes('burger')
        || normalizedCategory.includes('pepito')
        || ((normalizedCategory.includes('perro') || normalizedCategory.includes('perros')) && !normalizedCategory.includes('salchipapa'));
}

function getComboButtonCopy(categoryName) {
    const normalizedCategory = normalizeCategoryKey(categoryName);

    if (normalizedCategory.includes('pepito')) {
        return {
            solo: 'Solo el pepito',
            combo: 'Lo quiero en combo'
        };
    }

    if (normalizedCategory.includes('burger')) {
        return {
            solo: 'Solo la burger',
            combo: 'La quiero en combo'
        };
    }

    if (normalizedCategory.includes('perro') || normalizedCategory.includes('perros')) {
        return {
            solo: 'Solo el perro',
            combo: 'Lo quiero en combo'
        };
    }

    return {
        solo: 'Producto solo',
        combo: 'Quiero combo'
    };
}

function buildOrderMessage(productName, categoryName, orderOptions = { type: 'solo' }) {
    const safeProductName = String(productName || 'producto').trim() || 'producto';
    const safeCategoryName = String(categoryName || getSelectedCategoryName()).trim() || 'NUESTROS PRODUCTOS';
    const detail = getWhatsAppOrderDetail(safeCategoryName, orderOptions);
    const messageLines = [
        'PEDIDO',
        `Producto: ${safeProductName}`,
        `Categoria: ${safeCategoryName}`
    ];

    if (detail) {
        messageLines.push(`Detalle: ${detail}`);
    }

    return appendCommentText(messageLines.join('\n'), orderOptions);
}

function openWhatsAppOrder(productName, categoryName, orderOptions = { type: 'solo' }) {
    if (!canPlaceOrdersNow()) {
        showOrderingClosedMessage();
        return;
    }

    const message = buildOrderMessage(productName, categoryName, orderOptions);
    window.open(`${WHATSAPP_BASE_URL}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
    showOrderSentMessage();
}

const CART_STORAGE_KEY = 'roalburger-cart-v1';
let shoppingCart = [];
let cartUI = null;
let supportUI = null;
let activeSupportTopic = '';
let checkoutInfoUI = null;
let cartToastTimeout = null;

function syncBodyScrollLock() {
    const menuModal = document.getElementById('menuModal');
    const promoModal = document.getElementById('promoModal');
    const supportModal = supportUI?.modal || document.getElementById('supportModal');
    const isMenuOpen = Boolean(menuModal && menuModal.style.display === 'block');
    const isPromoOpen = Boolean(promoModal && promoModal.classList.contains('is-open'));
    const isCartOpen = Boolean(cartUI && cartUI.drawer.classList.contains('is-open'));
    const isSupportOpen = Boolean(supportModal && supportModal.classList.contains('is-open'));
    document.body.style.overflow = isMenuOpen || isPromoOpen || isCartOpen || isSupportOpen ? 'hidden' : 'auto';
}

function normalizeOrderOptions(orderOptions = { type: 'solo' }) {
    return {
        type: String(orderOptions.type || 'solo'),
        drink: String(orderOptions.drink || '').trim(),
        flavor: String(orderOptions.flavor || '').trim(),
        drinks: Array.isArray(orderOptions.drinks) ? orderOptions.drinks.map((item) => String(item || '').trim()).filter(Boolean) : [],
        peopleCount: Number(orderOptions.peopleCount || 0),
        comment: String(orderOptions.comment || '').trim(),
        imagePath: normalizeImageAssetPath(orderOptions.imagePath || ''),
        recommendedDiscount: orderOptions.recommendedDiscount === true,
        discountRate: Number.isFinite(Number(orderOptions.discountRate)) ? Math.max(0, Math.min(1, Number(orderOptions.discountRate))) : 0,
        allowClosedOrder: orderOptions.allowClosedOrder === true
    };
}

function getCartItemKey(productName, categoryName, orderOptions = { type: 'solo' }) {
    const normalized = normalizeOrderOptions(orderOptions);
    return JSON.stringify({
        productName: String(productName || '').trim(),
        categoryName: String(categoryName || '').trim(),
        type: normalized.type,
        drink: normalized.drink,
        flavor: normalized.flavor,
        drinks: normalized.drinks,
        peopleCount: normalized.peopleCount,
        comment: normalized.comment,
        imagePath: normalized.imagePath,
        recommendedDiscount: normalized.recommendedDiscount,
        discountRate: normalized.discountRate,
        allowClosedOrder: normalized.allowClosedOrder
    });
}

function appendCommentText(baseText, orderOptions = { type: 'solo' }) {
    const comment = String(orderOptions.comment || '').trim();
    if (!comment) {
        return baseText;
    }
    return `${baseText}\nNota: ${comment}`;
}

function getWhatsAppOrderDetail(categoryName, orderOptions = { type: 'solo' }) {
    const normalized = normalizeOrderOptions(orderOptions);
    const parts = [];

    if (normalized.type === 'combo-mixed') {
        parts.push('Combo mixto');
        if (normalized.drink) {
            parts.push(`Bebida 1L: ${normalized.drink}`);
        }
    } else if (normalized.type === 'combo-meal') {
        const peopleCount = Number(normalized.peopleCount || 1);
        const drinkText = normalized.drinks.join(', ');
        parts.push(`${peopleCount} persona${peopleCount === 1 ? '' : 's'}`);
        if (drinkText) {
            parts.push(`Bebidas: ${drinkText}`);
        }
    } else if (normalized.type === 'combo') {
        parts.push('Combo');
        if (normalized.drink) {
            parts.push(`Bebida: ${normalized.drink}`);
        }
    }

    if (normalized.flavor) {
        parts.push(`Sabor: ${normalized.flavor}`);
    }

    if (normalized.recommendedDiscount) {
        const discountPercent = Math.round((normalized.discountRate || RECOMMENDED_DAY_DISCOUNT_RATE) * 100);
        parts.push(`Recomendado -${discountPercent}%`);
    }

    return parts.join(' | ');
}

function loadCartState() {
    try {
        const raw = window.localStorage.getItem(CART_STORAGE_KEY);
        shoppingCart = raw ? JSON.parse(raw) : [];
    } catch (error) {
        shoppingCart = [];
    }
}

function saveCartState() {
    try {
        window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(shoppingCart));
    } catch (error) {
        // Ignorar si el navegador bloquea storage.
    }
}

function getCartProductCount() {
    return shoppingCart.reduce((total, item) => total + Number(item.quantity || 0), 0);
}

function parseLocalizedPrice(value) {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }

    const digits = String(value || '').replace(/[^\d]/g, '');
    return digits ? Number(digits) : 0;
}

function formatCurrency(value) {
    return `$ ${Number(value || 0).toLocaleString('es-CO')}`;
}

function findLatestProductPrice(productName, categoryName) {
    const normalizedProductName = normalizeCategoryKey(productName);
    const normalizedCategoryName = normalizeCategoryKey(categoryName);

    const exactMatch = latestProducts.find((product) => {
        const productNameKey = normalizeCategoryKey(product.nombre || product.name || '');
        const categoryKey = normalizeCategoryKey(product.categoria || product.category || '');
        return productNameKey === normalizedProductName && categoryKey === normalizedCategoryName;
    });

    if (exactMatch) {
        return parseLocalizedPrice(exactMatch.precio ?? exactMatch.price ?? 0);
    }

    const fallbackByName = latestProducts.find((product) => {
        const productNameKey = normalizeCategoryKey(product.nombre || product.name || '');
        return productNameKey === normalizedProductName;
    });

    return fallbackByName ? parseLocalizedPrice(fallbackByName.precio ?? fallbackByName.price ?? 0) : 0;
}

function resolveStaticOptionPrice(productName, categoryName) {
    const normalizedCategoryName = normalizeCategoryKey(categoryName);
    const normalizedProductName = normalizeCategoryKey(productName);

    if (normalizedCategoryName.includes('entradas')) {
        const options = getEntradaOptions(productName);
        const matched = options.find((item) => normalizedProductName.includes(normalizeCategoryKey(item.label)));
        return matched ? parseLocalizedPrice(matched.price) : 0;
    }

    if (normalizedCategoryName.includes('bebidas') || normalizedCategoryName.includes('adicionales')) {
        const options = getBebidasYAdicionalesOptions(productName);
        const matched = options.find((item) => normalizedProductName.includes(normalizeCategoryKey(item.label)));
        return matched ? parseLocalizedPrice(matched.price) : 0;
    }

    return 0;
}

function getBurgerClasicasOptions(productName) {
    const normalizedProduct = normalizeCategoryKey(productName);

    if (!normalizedProduct || !normalizedProduct.includes('normal')) {
        return [];
    }

    return [
        { label: 'Pequena | 1 carne', price: '14.000' },
        { label: 'Pequena | 2 carne', price: '18.000' },
        { label: 'Mediana | 1 carne', price: '17.000' },
        { label: 'Mediana | 2 carne', price: '22.000' }
    ];
}

function getSalchipapaOptions(productName) {
    const normalizedProduct = normalizeCategoryKey(productName);

    if (!normalizedProduct || !normalizedProduct.includes('super')) {
        return [];
    }

    return [
        { label: 'Pequena', price: '19.000' },
        { label: 'Grande', price: '34.000' }
    ];
}

function resolveManualImagePrice(productName, orderOptions = { type: 'solo' }) {
    const normalizedOptions = normalizeOrderOptions(orderOptions);
    const imagePath = normalizedOptions.imagePath;
    if (!imagePath) {
        return 0;
    }

    const normalizedProductName = normalizeCategoryKey(productName);

    if (COMBOS_CON_PAPAS_IMAGE_PRICES[imagePath]) {
        const peopleCount = Number(normalizedOptions.peopleCount || 0);
        return Number(COMBOS_CON_PAPAS_IMAGE_PRICES[imagePath][peopleCount] || 0);
    }

    if (imagePath === './burgerclasicas/burgernormal.png') {
        if (normalizedProductName.includes('pequena') && normalizedProductName.includes('2 carne')) {
            return 18000;
        }
        if (normalizedProductName.includes('mediana') && normalizedProductName.includes('2 carne')) {
            return 22000;
        }
        if (normalizedProductName.includes('pequena')) {
            return 14000;
        }
        return 17000;
    }

    if (imagePath === './salchipapas/salchisuper.png') {
        if (normalizedProductName.includes('grande')) {
            return 34000;
        }
        return 19000;
    }

    return Number(MANUAL_IMAGE_BASE_PRICES[imagePath] || 0);
}

function resolveCartUnitPrice(productName, categoryName, orderOptions = { type: 'solo' }) {
    const normalizedOptions = normalizeOrderOptions(orderOptions);
    const manualImagePrice = resolveManualImagePrice(productName, normalizedOptions);
    const applyDiscount = (price) => {
        if (!normalizedOptions.recommendedDiscount) {
            return price;
        }

        const discountRate = normalizedOptions.discountRate || RECOMMENDED_DAY_DISCOUNT_RATE;
        return Math.round(Number(price || 0) * (1 - discountRate));
    };

    if (manualImagePrice > 0) {
        const resolvedPrice = normalizedOptions.type === 'combo' ? manualImagePrice + COMBO_EXTRA_PRICE : manualImagePrice;
        return applyDiscount(resolvedPrice);
    }

    const staticOptionPrice = resolveStaticOptionPrice(productName, categoryName);
    if (staticOptionPrice > 0) {
        return applyDiscount(staticOptionPrice);
    }

    const basePrice = findLatestProductPrice(productName, categoryName);

    if (normalizedOptions.type === 'combo') {
        return applyDiscount(basePrice + COMBO_EXTRA_PRICE);
    }

    return applyDiscount(basePrice);
}

function getCartItemUnitPrice(item) {
    const storedPrice = Number(item?.unitPrice || 0);
    if (storedPrice > 0) {
        return storedPrice;
    }

    return resolveCartUnitPrice(item?.productName, item?.categoryName, item?.orderOptions);
}

function getCartTotalAmount() {
    return shoppingCart.reduce((total, item) => total + (getCartItemUnitPrice(item) * Number(item.quantity || 0)), 0);
}

function getCartOptionLabel(categoryName, orderOptions = { type: 'solo' }, options = {}) {
    const normalized = normalizeOrderOptions(orderOptions);
    const includeComment = options.includeComment !== false;
    let optionLabel = 'Producto solo';

    if (normalized.type === 'combo-mixed') {
        optionLabel = `Combo mixto | Bebida 1 litro | ${normalized.drink}`;
    } else if (normalized.type === 'combo-meal') {
        const peopleCount = Number(normalized.peopleCount || 1);
        const drinkText = normalized.drinks.join(', ');
        optionLabel = `${peopleCount} persona${peopleCount === 1 ? '' : 's'} | ${peopleCount >= 3 ? '1 bebida 1000ML' : `${peopleCount} bebida${peopleCount === 1 ? '' : 's'} 250ML`} | ${drinkText}`;
    } else if (normalized.type === 'combo') {
        optionLabel = `${getComboButtonCopy(categoryName).combo} | ${normalized.drink}`;
    } else if (isComboCategory(categoryName)) {
        optionLabel = getComboButtonCopy(categoryName).solo;
    }

    if (normalized.recommendedDiscount) {
        const discountPercent = Math.round((normalized.discountRate || RECOMMENDED_DAY_DISCOUNT_RATE) * 100);
        optionLabel = `${optionLabel} | Recomendado del dia -${discountPercent}%`;
    }

    if (normalized.flavor) {
        optionLabel = `${optionLabel} | Sabor: ${normalized.flavor}`;
    }

    if (includeComment && normalized.comment) {
        return `${optionLabel} | Comentario: ${normalized.comment}`;
    }

    return optionLabel;
}

function buildCartCheckoutMessage(customerInfo = {}) {
    const header = 'PEDIDO';
    const customerName = String(customerInfo.name || '').trim();
    const deliveryAddress = String(customerInfo.address || '').trim();
    const lines = shoppingCart.map((item, index) => {
        const optionLabel = getWhatsAppOrderDetail(item.categoryName, item.orderOptions);
        const details = [
            `${index + 1}. ${item.productName} x${item.quantity}`,
            `   Categoria: ${item.categoryName}`
        ];
        if (optionLabel) {
            details.push(`   Detalle: ${optionLabel}`);
        }
        if (item.orderOptions?.comment) {
            details.push(`   Nota: ${item.orderOptions.comment}`);
        }
        return details.join('\n');
    });

    const customerDetails = [
        customerName ? `Cliente: ${customerName}` : '',
        deliveryAddress ? `Entrega: ${deliveryAddress}` : ''
    ].filter(Boolean);

    return `${header}\n${customerDetails.join('\n')}${customerDetails.length ? '\n' : ''}\n${lines.join('\n\n')}\n\nTotal items: ${getCartProductCount()}\nTotal: ${formatCurrency(getCartTotalAmount())}`;
}

function openCartDrawer() {
    if (!cartUI) {
        return;
    }
    cartUI.drawer.classList.add('is-open');
    cartUI.overlay.classList.add('is-open');
    syncBodyScrollLock();
}

function closeCartDrawer() {
    if (!cartUI) {
        return;
    }
    cartUI.drawer.classList.remove('is-open');
    cartUI.overlay.classList.remove('is-open');
    syncBodyScrollLock();
}

function updateCartItemQuantity(itemKey, delta) {
    const item = shoppingCart.find((entry) => entry.itemKey === itemKey);
    if (!item) {
        return;
    }

    item.quantity = Number(item.quantity || 0) + delta;
    shoppingCart = shoppingCart.filter((entry) => Number(entry.quantity || 0) > 0);
    saveCartState();
    renderCartUI();
}

function clearCart() {
    shoppingCart = [];
    saveCartState();
    renderCartUI();
}

function checkoutCart() {
    if (!shoppingCart.length) {
        return;
    }

    if (!canPlaceOrdersNow()) {
        showOrderingClosedMessage();
        return;
    }

    openCheckoutInfoModal();
}

function closeCheckoutInfoModal() {
    if (!checkoutInfoUI) {
        return;
    }

    checkoutInfoUI.modal.remove();
    checkoutInfoUI = null;
    syncBodyScrollLock();
}

function submitCheckoutInfo() {
    if (!checkoutInfoUI) {
        return;
    }

    if (!canPlaceOrdersNow()) {
        checkoutInfoUI.feedback.textContent = ORDERING_SCHEDULE.closedMessage;
        showOrderingClosedMessage();
        return;
    }

    const customerName = String(checkoutInfoUI.name.value || '').trim();
    const deliveryAddress = String(checkoutInfoUI.address.value || '').trim();

    if (!customerName) {
        checkoutInfoUI.feedback.textContent = 'Escribe el nombre de quien recibe el pedido.';
        checkoutInfoUI.name.focus();
        return;
    }

    if (!deliveryAddress) {
        checkoutInfoUI.feedback.textContent = 'Escribe la direccion del domicilio.';
        checkoutInfoUI.address.focus();
        return;
    }

    checkoutInfoUI.feedback.textContent = '';
    trackButtonClick('btn-cart-checkout', 'Checkout carrito');
    const message = buildCartCheckoutMessage({
        name: customerName,
        address: deliveryAddress
    });
    closeCheckoutInfoModal();
    window.open(`${WHATSAPP_BASE_URL}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
    showOrderSentMessage();
    clearCart();
    closeCartDrawer();
}

function openCheckoutInfoModal() {
    closeCheckoutInfoModal();

    const modal = document.createElement('div');
    modal.id = 'checkout-info-modal';
    modal.className = 'support-modal';
    modal.classList.add('is-open');
    modal.innerHTML = `
        <div class="support-modal-card liquid-glass" role="dialog" aria-modal="true" aria-label="Datos del domicilio">
            <button type="button" class="support-modal-close" aria-label="Cerrar datos del domicilio">&times;</button>
            <p class="support-modal-kicker">Antes de enviar</p>
            <h3 class="support-modal-title">Datos del domicilio</h3>
            <p class="support-modal-text">Necesitamos saber a nombre de quien va el pedido y para donde va el domicilio.</p>
            <label class="support-field">
                <span>Nombre de quien recibe</span>
                <input type="text" id="checkoutCustomerName" placeholder="Escribe el nombre">
            </label>
            <label class="support-field">
                <span>Direccion del domicilio</span>
                <textarea id="checkoutDeliveryAddress" rows="4" placeholder="Escribe la direccion completa"></textarea>
            </label>
            <p class="support-feedback" id="checkoutInfoFeedback"></p>
            <div class="support-actions">
                <button type="button" class="support-send-btn">Enviar pedido por WhatsApp</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    checkoutInfoUI = {
        modal,
        close: modal.querySelector('.support-modal-close'),
        name: modal.querySelector('#checkoutCustomerName'),
        address: modal.querySelector('#checkoutDeliveryAddress'),
        feedback: modal.querySelector('#checkoutInfoFeedback'),
        send: modal.querySelector('.support-send-btn')
    };

    checkoutInfoUI.close.addEventListener('click', closeCheckoutInfoModal);
    checkoutInfoUI.send.addEventListener('click', submitCheckoutInfo);

    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeCheckoutInfoModal();
        }
    });

    syncBodyScrollLock();
    checkoutInfoUI.name.focus();
}

function getProductToastCopy(categoryName, productName) {
    const safeCategoryName = String(categoryName || '').trim();
    const safeProductName = String(productName || 'producto').trim() || 'producto';
    const normalizedLabel = normalizeCategoryKey(`${safeCategoryName} ${safeProductName}`);
    const feminineTerms = [
        'burger',
        'hamburguesa',
        'salchipapa',
        'salchi',
        'bebida',
        'gaseosa',
        'postobon',
        'cocacola',
        'agua',
        'malta',
        'frescolita',
        'golden'
    ];

    const usesFeminine = feminineTerms.some((term) => normalizedLabel.includes(term));
    return {
        article: usesFeminine ? 'Una' : 'Un',
        adjective: usesFeminine ? 'agregada' : 'agregado'
    };
}

function showCartAddedToast(categoryName, productName) {
    const safeCategoryName = String(categoryName || '').trim();
    const safeProductName = String(productName || 'Producto').trim() || 'Producto';
    const toastCopy = getProductToastCopy(safeCategoryName, safeProductName);
    let toast = document.getElementById('cartAddedToast');

    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'cartAddedToast';
        toast.className = 'cart-added-toast';
        document.body.appendChild(toast);
    }

    const label = [safeCategoryName, safeProductName].filter(Boolean).join(' ');
    toast.textContent = `${toastCopy.article} ${label} ha sido ${toastCopy.adjective} a tu carrito`;
    toast.classList.add('is-visible');

    if (cartToastTimeout) {
        window.clearTimeout(cartToastTimeout);
    }

    cartToastTimeout = window.setTimeout(() => {
        toast.classList.remove('is-visible');
    }, 2000);
}

function addItemToCart(productName, categoryName, orderOptions = { type: 'solo' }, buttonId) {
    const normalizedOptions = normalizeOrderOptions(orderOptions);

    if (!canPlaceOrdersNow()) {
        showOrderingClosedMessage();
        return;
    }

    if (buttonId) {
        trackProductInterest(productName, buttonId);
    }

    const safeProductName = String(productName || 'producto').trim() || 'producto';
    const safeCategoryName = String(categoryName || getSelectedCategoryName()).trim() || 'NUESTROS PRODUCTOS';
    const unitPrice = resolveCartUnitPrice(safeProductName, safeCategoryName, normalizedOptions);
    const itemKey = getCartItemKey(safeProductName, safeCategoryName, normalizedOptions);
    const existingItem = shoppingCart.find((item) => item.itemKey === itemKey);

    if (existingItem) {
        existingItem.quantity = Number(existingItem.quantity || 0) + 1;
        existingItem.unitPrice = unitPrice;
    } else {
        shoppingCart.push({
            itemKey,
            productName: safeProductName,
            categoryName: safeCategoryName,
            orderOptions: normalizedOptions,
            unitPrice,
            quantity: 1
        });
    }

    saveCartState();
    renderCartUI();
    showCartAddedToast(safeCategoryName, safeProductName);
}

function renderCartUI() {
    if (!cartUI) {
        return;
    }

    const totalItems = getCartProductCount();
    cartUI.badge.textContent = String(totalItems);
    cartUI.badge.hidden = totalItems === 0;
    cartUI.list.innerHTML = '';

    if (!shoppingCart.length) {
        const empty = document.createElement('p');
        empty.className = 'cart-empty';
        empty.textContent = 'Todavia no has agregado productos al carrito.';
        cartUI.list.appendChild(empty);
        cartUI.summary.textContent = 'Tu carrito esta vacio.';
        cartUI.checkout.disabled = true;
        cartUI.clear.disabled = true;
        syncOrderingAvailabilityUI();
        return;
    }

    shoppingCart.forEach((item) => {
        const unitPrice = getCartItemUnitPrice(item);
        const subtotal = unitPrice * Number(item.quantity || 0);
        const row = document.createElement('div');
        row.className = 'cart-item';

        const info = document.createElement('div');
        info.className = 'cart-item-info';

        const title = document.createElement('strong');
        title.textContent = item.productName;

        const category = document.createElement('p');
        category.className = 'cart-item-category';
        category.textContent = item.categoryName;

        const option = document.createElement('p');
        option.className = 'cart-item-option';
        option.textContent = getCartOptionLabel(item.categoryName, item.orderOptions);

        const price = document.createElement('p');
        price.className = 'cart-item-option';
        price.textContent = `Precio: ${formatCurrency(unitPrice)} | Subtotal: ${formatCurrency(subtotal)}`;

        info.appendChild(title);
        info.appendChild(category);
        info.appendChild(option);
        info.appendChild(price);

        const controls = document.createElement('div');
        controls.className = 'cart-item-controls';

        const minus = document.createElement('button');
        minus.type = 'button';
        minus.className = 'cart-qty-btn';
        minus.textContent = '-';
        minus.addEventListener('click', () => {
            updateCartItemQuantity(item.itemKey, -1);
        });

        const quantity = document.createElement('span');
        quantity.className = 'cart-qty-value';
        quantity.textContent = String(item.quantity);

        const plus = document.createElement('button');
        plus.type = 'button';
        plus.className = 'cart-qty-btn';
        plus.textContent = '+';
        plus.addEventListener('click', () => {
            updateCartItemQuantity(item.itemKey, 1);
        });

        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'cart-remove-btn';
        remove.textContent = 'Quitar';
        remove.addEventListener('click', () => {
            updateCartItemQuantity(item.itemKey, -Number(item.quantity || 1));
        });

        controls.appendChild(minus);
        controls.appendChild(quantity);
        controls.appendChild(plus);
        controls.appendChild(remove);

        row.appendChild(info);
        row.appendChild(controls);
        cartUI.list.appendChild(row);
    });

    cartUI.summary.textContent = `${shoppingCart.length} referencia${shoppingCart.length === 1 ? '' : 's'} | ${totalItems} producto${totalItems === 1 ? '' : 's'} | Total ${formatCurrency(getCartTotalAmount())}`;
    cartUI.checkout.disabled = !shoppingCart.length;
    cartUI.clear.disabled = false;
    syncOrderingAvailabilityUI();
}

function initCartUI() {
    if (cartUI) {
        renderCartUI();
        return;
    }

    loadCartState();

    const fab = document.createElement('button');
    fab.type = 'button';
    fab.className = 'cart-fab';
    fab.innerHTML = '<span class="cart-fab-icon">🛒</span><span class="cart-fab-label">Carrito</span><span class="cart-fab-badge" hidden>0</span>';

    const overlay = document.createElement('div');
    overlay.className = 'cart-overlay';

    const drawer = document.createElement('aside');
    drawer.className = 'cart-drawer liquid-glass';
    drawer.innerHTML = `
        <div class="cart-drawer-header">
            <div>
                <h3 class="cart-drawer-title">Tu carrito</h3>
                <p class="cart-drawer-subtitle">Agrega productos y al final envia un solo pedido.</p>
            </div>
            <button type="button" class="cart-close-btn" aria-label="Cerrar carrito">&times;</button>
        </div>
        <div class="cart-items" id="cartItems"></div>
        <div class="cart-drawer-footer">
            <p class="cart-summary" id="cartSummary"></p>
            <button type="button" class="cart-continue-btn" id="cartContinueBtn">Seguir en el menu</button>
            <button type="button" class="cart-checkout-btn" id="cartCheckoutBtn">Hacer pedido por WhatsApp</button>
            <button type="button" class="cart-clear-btn" id="cartClearBtn">Vaciar carrito</button>
        </div>
    `;

    document.body.appendChild(fab);
    document.body.appendChild(overlay);
    document.body.appendChild(drawer);

    cartUI = {
        fab,
        badge: fab.querySelector('.cart-fab-badge'),
        overlay,
        drawer,
        close: drawer.querySelector('.cart-close-btn'),
        list: drawer.querySelector('#cartItems'),
        summary: drawer.querySelector('#cartSummary'),
        continue: drawer.querySelector('#cartContinueBtn'),
        checkout: drawer.querySelector('#cartCheckoutBtn'),
        clear: drawer.querySelector('#cartClearBtn')
    };

    fab.addEventListener('click', openCartDrawer);
    overlay.addEventListener('click', closeCartDrawer);
    cartUI.close.addEventListener('click', closeCartDrawer);
    cartUI.continue.addEventListener('click', closeCartDrawer);
    cartUI.checkout.addEventListener('click', checkoutCart);
    cartUI.clear.addEventListener('click', clearCart);

    renderCartUI();
}

function getSupportSocialEntries() {
    return [
        { label: 'Instagram', config: getButtonConfigByPlatform('instagram') },
        { label: 'TikTok', config: getButtonConfigByPlatform('tiktok') },
        { label: 'Facebook', config: getButtonConfigByPlatform('facebook') }
    ].filter((item) => item.config && item.config.visible !== false && item.config.estado !== 'paused' && item.config.link);
}

function buildSupportWhatsAppMessage(name, details, topicKey) {
    const safeName = String(name || '').trim();
    const safeDetails = String(details || '').trim();
    const topicLabelMap = {
        horario: 'Horario',
        direccion: 'Direccion',
        redes: 'Nuestras redes',
        reclamos: 'Quejas o reclamos'
    };
    const topicLabel = topicLabelMap[topicKey] || 'Ayuda general';
    return [
        'Hola ROAL BURGER! Necesito ayuda o informacion.',
        `Nombre: ${safeName}`,
        `Tema: ${topicLabel}`,
        `Consulta: ${safeDetails || `Quiero informacion sobre ${topicLabel.toLowerCase()}.`}`
    ].join('\n');
}

function renderSupportAnswer(topicKey) {
    if (!supportUI) {
        return;
    }

    const answer = supportUI.answer;
    answer.innerHTML = '';

    const title = document.createElement('h4');
    title.className = 'support-answer-title';
    const body = document.createElement('div');
    body.className = 'support-answer-body';

    if (topicKey === 'horario') {
        title.textContent = 'Horario de atencion';
        body.textContent = 'Lunes a Domingo: 4:00 P.M. a 10:00 P.M.';
    } else if (topicKey === 'direccion') {
        title.textContent = 'Direccion';
        body.textContent = 'Cl. 22 #29-59, Armenia, Quindio. Barrio Las Americas.';
    } else if (topicKey === 'redes') {
        title.textContent = 'Nuestras redes';
        const socials = getSupportSocialEntries();
        if (!socials.length) {
            body.textContent = 'En este momento nuestras redes no estan disponibles.';
        } else {
            const list = document.createElement('div');
            list.className = 'support-link-list';
            socials.forEach((item) => {
                const link = document.createElement('a');
                link.className = 'support-link-chip';
                link.href = item.config.link;
                link.target = '_blank';
                link.rel = 'noopener';
                link.textContent = item.label;
                list.appendChild(link);
            });
            body.appendChild(list);
        }
    } else if (topicKey === 'reclamos') {
        title.textContent = 'Quejas o reclamos';
        body.textContent = 'Escribenos tu queja, reclamo o novedad y la enviaremos directo por WhatsApp para darte respuesta.';
    } else {
        title.textContent = 'En que te podemos ayudar';
        body.textContent = 'Selecciona una pregunta frecuente o escribenos tu consulta y te la enviamos por WhatsApp.';
    }

    answer.appendChild(title);
    answer.appendChild(body);
}

function applySupportTopic(topicKey) {
    activeSupportTopic = topicKey;
    if (!supportUI) {
        return;
    }

    supportUI.topicButtons.forEach((button) => {
        button.classList.toggle('is-active', button.dataset.topic === topicKey);
    });

    const promptMap = {
        horario: 'Quiero informacion sobre el horario.',
        direccion: 'Quiero informacion sobre la direccion.',
        redes: 'Quiero conocer sus redes sociales.',
        reclamos: 'Quiero registrar una queja o reclamo.'
    };

    if (supportUI.details && promptMap[topicKey]) {
        supportUI.details.value = promptMap[topicKey];
    }

    renderSupportAnswer(topicKey);
}

function resetSupportState() {
    activeSupportTopic = '';
    if (!supportUI) {
        return;
    }

    supportUI.name.value = '';
    supportUI.details.value = '';
    supportUI.feedback.textContent = '';
    supportUI.topicButtons.forEach((button) => {
        button.classList.remove('is-active');
    });
    renderSupportAnswer('');
}

function closeSupportModal() {
    if (!supportUI) {
        return;
    }

    supportUI.modal.classList.remove('is-open');
    syncBodyScrollLock();
}

function sendSupportRequest() {
    if (!supportUI) {
        return;
    }

    const name = String(supportUI.name.value || '').trim();
    const details = String(supportUI.details.value || '').trim();

    if (!name) {
        supportUI.feedback.textContent = 'Escribe tu nombre para continuar.';
        supportUI.name.focus();
        return;
    }

    if (!details && !activeSupportTopic) {
        supportUI.feedback.textContent = 'Selecciona una pregunta frecuente o escribe tu mensaje.';
        supportUI.details.focus();
        return;
    }

    supportUI.feedback.textContent = '';
    trackButtonClick('btn-whatsapp-flotante-send', `Ayuda WhatsApp - ${activeSupportTopic || 'consulta libre'}`);
    const message = buildSupportWhatsAppMessage(name, details, activeSupportTopic);
    window.open(`${WHATSAPP_BASE_URL}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
    resetSupportState();
    closeSupportModal();
}

function openSupportModal() {
    if (!supportUI) {
        initSupportModal();
    }

    supportUI.feedback.textContent = '';
    supportUI.modal.classList.add('is-open');
    syncBodyScrollLock();
    if (!activeSupportTopic) {
        renderSupportAnswer('');
    }
    supportUI.name.focus();
}

function initSupportModal() {
    if (supportUI) {
        return;
    }

    const modal = document.createElement('div');
    modal.id = 'supportModal';
    modal.className = 'support-modal';
    modal.innerHTML = `
        <div class="support-modal-card liquid-glass" role="dialog" aria-modal="true" aria-label="Ayuda e informacion">
            <button type="button" class="support-modal-close" aria-label="Cerrar ayuda">&times;</button>
            <p class="support-modal-kicker">Ayuda e informacion</p>
            <h3 class="support-modal-title">En que te podemos ayudar</h3>
            <p class="support-modal-text">Responde rapido una duda frecuente o envianos tu consulta por WhatsApp.</p>
            <div class="support-topic-grid">
                <button type="button" class="support-topic-btn" data-topic="horario">Horario</button>
                <button type="button" class="support-topic-btn" data-topic="direccion">Direccion</button>
                <button type="button" class="support-topic-btn" data-topic="redes">Nuestras redes</button>
                <button type="button" class="support-topic-btn" data-topic="reclamos">Quejas o reclamos</button>
            </div>
            <div class="support-answer" id="supportAnswer"></div>
            <label class="support-field">
                <span>Tu nombre</span>
                <input type="text" id="supportName" placeholder="Escribe tu nombre">
            </label>
            <label class="support-field">
                <span>Tu mensaje</span>
                <textarea id="supportDetails" rows="4" placeholder="Cuentanos que necesitas"></textarea>
            </label>
            <p class="support-feedback" id="supportFeedback"></p>
            <div class="support-actions">
                <button type="button" class="support-send-btn">Enviar a WhatsApp</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    supportUI = {
        modal,
        close: modal.querySelector('.support-modal-close'),
        answer: modal.querySelector('#supportAnswer'),
        name: modal.querySelector('#supportName'),
        details: modal.querySelector('#supportDetails'),
        feedback: modal.querySelector('#supportFeedback'),
        send: modal.querySelector('.support-send-btn'),
        topicButtons: Array.from(modal.querySelectorAll('.support-topic-btn'))
    };

    supportUI.close.addEventListener('click', closeSupportModal);
    supportUI.send.addEventListener('click', sendSupportRequest);
    supportUI.topicButtons.forEach((button) => {
        button.addEventListener('click', () => {
            applySupportTopic(button.dataset.topic || '');
        });
    });

    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeSupportModal();
        }
    });

    renderSupportAnswer('');
}

function closeComboChoiceModal() {
    const modal = document.getElementById('combo-choice-modal');
    if (modal) {
        modal.remove();
    }
    document.body.style.overflow = 'auto';
}

function createOrderCommentField() {
    const wrap = document.createElement('label');
    wrap.style.display = 'flex';
    wrap.style.flexDirection = 'column';
    wrap.style.gap = '8px';

    const title = document.createElement('span');
    title.textContent = 'Comentario para tu pedido';
    title.style.color = '#5a3a1b';
    title.style.fontFamily = 'Oswald, sans-serif';
    title.style.fontSize = '0.98rem';

    const textarea = document.createElement('textarea');
    textarea.rows = 3;
    textarea.placeholder = 'Ej: sin salsas, sin cebolla, bien tostado';
    textarea.style.width = '100%';
    textarea.style.padding = '12px 14px';
    textarea.style.borderRadius = '12px';
    textarea.style.border = '1px solid rgba(140, 90, 44, 0.24)';
    textarea.style.background = '#fffdfa';
    textarea.style.color = '#4f311d';
    textarea.style.fontSize = '0.96rem';
    textarea.style.fontFamily = 'Roboto, sans-serif';
    textarea.style.resize = 'vertical';
    textarea.style.minHeight = '84px';

    wrap.appendChild(title);
    wrap.appendChild(textarea);

    return { wrap, textarea };
}

function openImageOptionModal(productName, categoryName, buttonId, extraOptions = {}, modalConfig = {}) {
    const optionItems = Array.isArray(modalConfig.optionItems) ? modalConfig.optionItems : [];
    if (!optionItems.length) {
        openProductCommentModal(productName, categoryName, buttonId, extraOptions);
        return;
    }

    closeComboChoiceModal();

    const modal = document.createElement('div');
    modal.id = 'combo-choice-modal';
    modal.style.position = 'fixed';
    modal.style.inset = '0';
    modal.style.zIndex = '100001';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.padding = '20px';
    modal.style.background = 'rgba(31, 18, 10, 0.76)';
    modal.style.backdropFilter = 'blur(8px)';
    modal.style.webkitBackdropFilter = 'blur(8px)';

    const card = document.createElement('div');
    card.style.width = 'min(92vw, 460px)';
    card.style.maxHeight = '86vh';
    card.style.overflowY = 'auto';
    card.style.position = 'relative';
    card.style.padding = '22px';
    card.style.borderRadius = '20px';
    card.style.background = 'linear-gradient(180deg, rgba(255,248,236,0.98), rgba(245,221,188,0.92))';
    card.style.boxShadow = '0 20px 48px rgba(67, 37, 23, 0.28)';
    card.style.border = '1px solid rgba(255, 180, 108, 0.55)';
    card.style.display = 'flex';
    card.style.flexDirection = 'column';
    card.style.gap = '14px';

    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.textContent = '×';
    closeButton.setAttribute('aria-label', 'Cerrar seleccion de opcion');
    closeButton.style.position = 'absolute';
    closeButton.style.top = '10px';
    closeButton.style.right = '10px';
    closeButton.style.width = '38px';
    closeButton.style.height = '38px';
    closeButton.style.border = 'none';
    closeButton.style.borderRadius = '999px';
    closeButton.style.background = 'rgba(90, 58, 27, 0.14)';
    closeButton.style.color = '#5a3a1b';
    closeButton.style.fontSize = '1.7rem';
    closeButton.style.cursor = 'pointer';
    closeButton.addEventListener('click', closeComboChoiceModal);

    const title = document.createElement('h3');
    title.textContent = productName;
    title.style.margin = '0';
    title.style.textAlign = 'center';
    title.style.fontFamily = 'Oswald, sans-serif';
    title.style.fontSize = '1.85rem';
    title.style.lineHeight = '1';
    title.style.textTransform = 'uppercase';
    title.style.color = '#5a3a1b';

    const description = document.createElement('p');
    description.textContent = modalConfig.description || 'Selecciona la opcion que quieres agregar a tu carrito.';
    description.style.margin = '0';
    description.style.textAlign = 'center';
    description.style.lineHeight = '1.45';
    description.style.color = '#4f311d';

    const optionButtons = document.createElement('div');
    optionButtons.style.display = 'grid';
    optionButtons.style.gridTemplateColumns = '1fr';
    optionButtons.style.gap = '10px';

    const commentField = createOrderCommentField();

    optionItems.forEach((optionItem) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = `${optionItem.label} - ${optionItem.price}`;
        button.style.minHeight = '50px';
        button.style.padding = '10px 14px';
        button.style.borderRadius = '12px';
        button.style.border = '1px solid rgba(140, 90, 44, 0.24)';
        button.style.background = 'rgba(255, 247, 235, 0.92)';
        button.style.color = '#5a3a1b';
        button.style.fontFamily = 'Oswald, sans-serif';
        button.style.fontSize = '0.95rem';
        button.style.lineHeight = '1.2';
        button.style.cursor = 'pointer';
        button.addEventListener('click', () => {
            closeComboChoiceModal();
            addItemToCart(`${productName} - ${optionItem.label}`, categoryName, {
                ...extraOptions,
                type: 'solo',
                comment: commentField.textarea.value
            }, buttonId);
        });
        optionButtons.appendChild(button);
    });

    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeComboChoiceModal();
        }
    });

    card.appendChild(closeButton);
    card.appendChild(title);
    card.appendChild(description);
    card.appendChild(optionButtons);
    card.appendChild(commentField.wrap);
    modal.appendChild(card);

    document.body.style.overflow = 'hidden';
    document.body.appendChild(modal);
}

function openProductCommentModal(productName, categoryName, buttonId, extraOptions = {}) {
    closeComboChoiceModal();

    const modal = document.createElement('div');
    modal.id = 'combo-choice-modal';
    modal.style.position = 'fixed';
    modal.style.inset = '0';
    modal.style.zIndex = '100001';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.padding = '20px';
    modal.style.background = 'rgba(31, 18, 10, 0.76)';
    modal.style.backdropFilter = 'blur(8px)';
    modal.style.webkitBackdropFilter = 'blur(8px)';

    const card = document.createElement('div');
    card.style.width = 'min(92vw, 430px)';
    card.style.position = 'relative';
    card.style.padding = '22px';
    card.style.borderRadius = '20px';
    card.style.background = 'linear-gradient(180deg, rgba(255,248,236,0.98), rgba(245,221,188,0.92))';
    card.style.boxShadow = '0 20px 48px rgba(67, 37, 23, 0.28)';
    card.style.border = '1px solid rgba(255, 180, 108, 0.55)';
    card.style.display = 'flex';
    card.style.flexDirection = 'column';
    card.style.gap = '14px';

    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.textContent = '×';
    closeButton.setAttribute('aria-label', 'Cerrar comentario del pedido');
    closeButton.style.position = 'absolute';
    closeButton.style.top = '10px';
    closeButton.style.right = '10px';
    closeButton.style.width = '38px';
    closeButton.style.height = '38px';
    closeButton.style.border = 'none';
    closeButton.style.borderRadius = '999px';
    closeButton.style.background = 'rgba(90, 58, 27, 0.14)';
    closeButton.style.color = '#5a3a1b';
    closeButton.style.fontSize = '1.7rem';
    closeButton.style.cursor = 'pointer';
    closeButton.addEventListener('click', closeComboChoiceModal);

    const title = document.createElement('h3');
    title.textContent = productName;
    title.style.margin = '0';
    title.style.textAlign = 'center';
    title.style.fontFamily = 'Oswald, sans-serif';
    title.style.fontSize = '1.85rem';
    title.style.lineHeight = '1';
    title.style.textTransform = 'uppercase';
    title.style.color = '#5a3a1b';

    const category = document.createElement('p');
    category.textContent = categoryName;
    category.style.margin = '-4px 0 0';
    category.style.textAlign = 'center';
    category.style.fontFamily = 'Oswald, sans-serif';
    category.style.fontSize = '0.95rem';
    category.style.letterSpacing = '0.08em';
    category.style.textTransform = 'uppercase';
    category.style.color = '#8b5527';

    const description = document.createElement('p');
    description.textContent = 'Si quieres, agrega una indicacion especial para este producto.';
    description.style.margin = '0';
    description.style.textAlign = 'center';
    description.style.lineHeight = '1.45';
    description.style.color = '#4f311d';

    const commentField = createOrderCommentField();

    const confirmButton = document.createElement('button');
    confirmButton.type = 'button';
    confirmButton.textContent = 'Enviar a mi carrito';
    confirmButton.style.minHeight = '52px';
    confirmButton.style.borderRadius = '14px';
    confirmButton.style.border = 'none';
    confirmButton.style.background = 'linear-gradient(135deg, #ff7a00, #ff5a00)';
    confirmButton.style.color = '#fff7ef';
    confirmButton.style.fontFamily = 'Oswald, sans-serif';
    confirmButton.style.fontSize = '1.02rem';
    confirmButton.style.cursor = 'pointer';
    confirmButton.addEventListener('click', () => {
        closeComboChoiceModal();
        addItemToCart(productName, categoryName, {
            ...extraOptions,
            type: 'solo',
            comment: commentField.textarea.value
        }, buttonId);
    });

    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeComboChoiceModal();
        }
    });

    card.appendChild(closeButton);
    card.appendChild(title);
    card.appendChild(category);
    card.appendChild(description);
    card.appendChild(commentField.wrap);
    card.appendChild(confirmButton);
    modal.appendChild(card);

    document.body.style.overflow = 'hidden';
    document.body.appendChild(modal);
}

function getEntradaOptions(productName) {
    const normalizedProduct = normalizeCategoryKey(productName);

    if (normalizedProduct.includes('papas')) {
        return [
            { label: 'Pequena (150 gr.)', price: '7.000' },
            { label: 'Mediana (300 gr.)', price: '11.000' },
            { label: 'Grande (450 gr.)', price: '16.000' }
        ];
    }

    if (normalizedProduct.includes('teque')) {
        return [
            { label: 'X5 unidades', price: '11.000' },
            { label: 'X10 unidades', price: '20.000' }
        ];
    }

    return [];
}

function getBebidasYAdicionalesOptions(productName) {
    const normalizedProduct = normalizeCategoryKey(productName);

    if (normalizedProduct.includes('adicion')) {
        return [
            { label: 'Carne de burger pequena', price: '6.000' },
            { label: 'Carne de burger mediana', price: '7.000' },
            { label: 'Filete de pollo mediano', price: '7.000' },
            { label: 'Chorizo de cerdo (porcion)', price: '5.000' },
            { label: 'Chuleta ahumada', price: '9.000' },
            { label: 'Salchicha americana', price: '4.000' },
            { label: 'Tocineta ahumada', price: '4.000' },
            { label: 'Queso tipo mozzarella', price: '3.000' },
            { label: 'Huevo de gallina', price: '2.000' },
            { label: 'Huevos de codorniz (5 und.)', price: '4.000' }
        ];
    }

    if (normalizedProduct.includes('bebida')) {
        return [
            { label: 'Postobon 250 ml.', price: '3.500' },
            { label: 'Postobon 450 ml.', price: '4.500' },
            { label: 'Postobon 1000 ml.', price: '7.000' },
            { label: 'Cocacola 250 ml.', price: '4.000' },
            { label: 'Cocacola 400 ml.', price: '5.500' },
            { label: 'Cocacola 1500 ml.', price: '9.000' },
            { label: 'Hit 500 ml.', price: '5.000' },
            { label: 'Hit 1000 ml.', price: '8.000' },
            { label: 'Agua 600 ml.', price: '3.500' },
            { label: 'Malta Polar 355 ml.', price: '8.000' },
            { label: 'Frescolita 355 ml.', price: '8.000' },
            { label: 'Golden 355 ml.', price: '8.000' }
        ];
    }

    return [];
}

function getBebidaFlavorOptions(optionLabel) {
    const normalizedOption = normalizeCategoryKey(optionLabel);

    if (normalizedOption.includes('postobon 250')) {
        return ['Pepsi Zero', 'Colombiana', 'Manzana'];
    }

    if (normalizedOption.includes('postobon 450')) {
        return ['Pepsi Original', 'Colombiana', 'Naranja', 'Manzana'];
    }

    if (normalizedOption.includes('postobon 1000')) {
        return ['Pepsi Original', 'Pepsi Zero', 'Colombiana', 'Naranja', 'Uva', 'Toronja', 'Manzana'];
    }

    if (normalizedOption.includes('hit 500') || normalizedOption.includes('hit 1000')) {
        return ['Naranja/Pina', 'Mora', 'Mango', 'Frutas tropicales', 'Lulo'];
    }

    if (normalizedOption.includes('golden 355')) {
        return ['Manzana'];
    }

    return [];
}

function openBebidasYAdicionalesOptionsModal(productName, categoryName, buttonId, extraOptions = {}) {
    closeComboChoiceModal();

    const productOptions = getBebidasYAdicionalesOptions(productName);
    if (!productOptions.length) {
        openProductCommentModal(productName, categoryName, buttonId);
        return;
    }

    const modal = document.createElement('div');
    modal.id = 'combo-choice-modal';
    modal.style.position = 'fixed';
    modal.style.inset = '0';
    modal.style.zIndex = '100001';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.padding = '20px';
    modal.style.background = 'rgba(31, 18, 10, 0.76)';
    modal.style.backdropFilter = 'blur(8px)';
    modal.style.webkitBackdropFilter = 'blur(8px)';

    const card = document.createElement('div');
    card.style.width = 'min(92vw, 460px)';
    card.style.maxHeight = '86vh';
    card.style.overflowY = 'auto';
    card.style.position = 'relative';
    card.style.padding = '22px';
    card.style.borderRadius = '20px';
    card.style.background = 'linear-gradient(180deg, rgba(255,248,236,0.98), rgba(245,221,188,0.92))';
    card.style.boxShadow = '0 20px 48px rgba(67, 37, 23, 0.28)';
    card.style.border = '1px solid rgba(255, 180, 108, 0.55)';
    card.style.display = 'flex';
    card.style.flexDirection = 'column';
    card.style.gap = '14px';

    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.textContent = '×';
    closeButton.setAttribute('aria-label', 'Cerrar seleccion de opcion');
    closeButton.style.position = 'absolute';
    closeButton.style.top = '10px';
    closeButton.style.right = '10px';
    closeButton.style.width = '38px';
    closeButton.style.height = '38px';
    closeButton.style.border = 'none';
    closeButton.style.borderRadius = '999px';
    closeButton.style.background = 'rgba(90, 58, 27, 0.14)';
    closeButton.style.color = '#5a3a1b';
    closeButton.style.fontSize = '1.7rem';
    closeButton.style.cursor = 'pointer';
    closeButton.addEventListener('click', closeComboChoiceModal);

    const title = document.createElement('h3');
    title.textContent = productName;
    title.style.margin = '0';
    title.style.textAlign = 'center';
    title.style.fontFamily = 'Oswald, sans-serif';
    title.style.fontSize = '1.85rem';
    title.style.lineHeight = '1';
    title.style.textTransform = 'uppercase';
    title.style.color = '#5a3a1b';

    const description = document.createElement('p');
    description.textContent = 'Selecciona la opcion que quieres agregar a tu carrito.';
    description.style.margin = '0';
    description.style.textAlign = 'center';
    description.style.lineHeight = '1.45';
    description.style.color = '#4f311d';

    const optionButtons = document.createElement('div');
    optionButtons.style.display = 'grid';
    optionButtons.style.gridTemplateColumns = '1fr';
    optionButtons.style.gap = '10px';

    const commentField = createOrderCommentField();

    function addBebidaOptionToCart(optionItem, flavor = '') {
        closeComboChoiceModal();
        addItemToCart(`${productName} - ${optionItem.label}`, categoryName, {
            ...extraOptions,
            type: 'solo',
            flavor,
            comment: commentField.textarea.value
        }, buttonId);
    }

    function createSelectionButton(label, onClick) {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = label;
        button.style.minHeight = '50px';
        button.style.padding = '10px 14px';
        button.style.borderRadius = '12px';
        button.style.border = '1px solid rgba(140, 90, 44, 0.24)';
        button.style.background = 'rgba(255, 247, 235, 0.92)';
        button.style.color = '#5a3a1b';
        button.style.fontFamily = 'Oswald, sans-serif';
        button.style.fontSize = '0.95rem';
        button.style.lineHeight = '1.2';
        button.style.cursor = 'pointer';
        button.addEventListener('click', onClick);
        return button;
    }

    function renderMainOptions() {
        optionButtons.innerHTML = '';
        description.textContent = 'Selecciona la opcion que quieres agregar a tu carrito.';

        productOptions.forEach((optionItem) => {
            const button = createSelectionButton(`${optionItem.label} - ${optionItem.price}`, () => {
                const flavors = getBebidaFlavorOptions(optionItem.label);
                if (!flavors.length) {
                    addBebidaOptionToCart(optionItem);
                    return;
                }

                renderFlavorOptions(optionItem, flavors);
            });
            optionButtons.appendChild(button);
        });
    }

    function renderFlavorOptions(optionItem, flavors) {
        optionButtons.innerHTML = '';
        description.textContent = `Selecciona el sabor para ${optionItem.label}.`;

        flavors.forEach((flavorName) => {
            const flavorButton = createSelectionButton(flavorName, () => {
                addBebidaOptionToCart(optionItem, flavorName);
            });
            optionButtons.appendChild(flavorButton);
        });

        const backButton = createSelectionButton('Volver a las bebidas', () => {
            renderMainOptions();
        });
        optionButtons.appendChild(backButton);
    }

    renderMainOptions();

    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeComboChoiceModal();
        }
    });

    card.appendChild(closeButton);
    card.appendChild(title);
    card.appendChild(description);
    card.appendChild(optionButtons);
    card.appendChild(commentField.wrap);
    modal.appendChild(card);

    document.body.style.overflow = 'hidden';
    document.body.appendChild(modal);
}

function openEntradasOptionsModal(productName, categoryName, buttonId, extraOptions = {}) {
    closeComboChoiceModal();

    const entradaOptions = getEntradaOptions(productName);
    if (!entradaOptions.length) {
        openProductCommentModal(productName, categoryName, buttonId);
        return;
    }

    const modal = document.createElement('div');
    modal.id = 'combo-choice-modal';
    modal.style.position = 'fixed';
    modal.style.inset = '0';
    modal.style.zIndex = '100001';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.padding = '20px';
    modal.style.background = 'rgba(31, 18, 10, 0.76)';
    modal.style.backdropFilter = 'blur(8px)';
    modal.style.webkitBackdropFilter = 'blur(8px)';

    const card = document.createElement('div');
    card.style.width = 'min(92vw, 430px)';
    card.style.position = 'relative';
    card.style.padding = '22px';
    card.style.borderRadius = '20px';
    card.style.background = 'linear-gradient(180deg, rgba(255,248,236,0.98), rgba(245,221,188,0.92))';
    card.style.boxShadow = '0 20px 48px rgba(67, 37, 23, 0.28)';
    card.style.border = '1px solid rgba(255, 180, 108, 0.55)';
    card.style.display = 'flex';
    card.style.flexDirection = 'column';
    card.style.gap = '14px';

    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.textContent = '×';
    closeButton.setAttribute('aria-label', 'Cerrar seleccion de entrada');
    closeButton.style.position = 'absolute';
    closeButton.style.top = '10px';
    closeButton.style.right = '10px';
    closeButton.style.width = '38px';
    closeButton.style.height = '38px';
    closeButton.style.border = 'none';
    closeButton.style.borderRadius = '999px';
    closeButton.style.background = 'rgba(90, 58, 27, 0.14)';
    closeButton.style.color = '#5a3a1b';
    closeButton.style.fontSize = '1.7rem';
    closeButton.style.cursor = 'pointer';
    closeButton.addEventListener('click', closeComboChoiceModal);

    const title = document.createElement('h3');
    title.textContent = productName;
    title.style.margin = '0';
    title.style.textAlign = 'center';
    title.style.fontFamily = 'Oswald, sans-serif';
    title.style.fontSize = '1.85rem';
    title.style.lineHeight = '1';
    title.style.textTransform = 'uppercase';
    title.style.color = '#5a3a1b';

    const description = document.createElement('p');
    description.textContent = 'Selecciona la opcion que quieres agregar a tu carrito.';
    description.style.margin = '0';
    description.style.textAlign = 'center';
    description.style.lineHeight = '1.45';
    description.style.color = '#4f311d';

    const optionButtons = document.createElement('div');
    optionButtons.style.display = 'grid';
    optionButtons.style.gridTemplateColumns = '1fr';
    optionButtons.style.gap = '10px';

    const commentField = createOrderCommentField();

    entradaOptions.forEach((optionItem) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = `${optionItem.label} - ${optionItem.price}`;
        button.style.minHeight = '50px';
        button.style.padding = '10px 14px';
        button.style.borderRadius = '12px';
        button.style.border = '1px solid rgba(140, 90, 44, 0.24)';
        button.style.background = 'rgba(255, 247, 235, 0.92)';
        button.style.color = '#5a3a1b';
        button.style.fontFamily = 'Oswald, sans-serif';
        button.style.fontSize = '0.95rem';
        button.style.lineHeight = '1.2';
        button.style.cursor = 'pointer';
        button.addEventListener('click', () => {
            closeComboChoiceModal();
            addItemToCart(`${productName} - ${optionItem.label}`, categoryName, {
                ...extraOptions,
                type: 'solo',
                comment: commentField.textarea.value
            }, buttonId);
        });
        optionButtons.appendChild(button);
    });

    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeComboChoiceModal();
        }
    });

    card.appendChild(closeButton);
    card.appendChild(title);
    card.appendChild(description);
    card.appendChild(optionButtons);
    card.appendChild(commentField.wrap);
    modal.appendChild(card);

    document.body.style.overflow = 'hidden';
    document.body.appendChild(modal);
}

function openCombosMixtosModal(productName, categoryName, buttonId, extraOptions = {}) {
    closeComboChoiceModal();

    const modal = document.createElement('div');
    modal.id = 'combo-choice-modal';
    modal.style.position = 'fixed';
    modal.style.inset = '0';
    modal.style.zIndex = '100001';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.padding = '20px';
    modal.style.background = 'rgba(31, 18, 10, 0.76)';
    modal.style.backdropFilter = 'blur(8px)';
    modal.style.webkitBackdropFilter = 'blur(8px)';

    const card = document.createElement('div');
    card.style.width = 'min(92vw, 430px)';
    card.style.position = 'relative';
    card.style.padding = '22px';
    card.style.borderRadius = '20px';
    card.style.background = 'linear-gradient(180deg, rgba(255,248,236,0.98), rgba(245,221,188,0.92))';
    card.style.boxShadow = '0 20px 48px rgba(67, 37, 23, 0.28)';
    card.style.border = '1px solid rgba(255, 180, 108, 0.55)';
    card.style.display = 'flex';
    card.style.flexDirection = 'column';
    card.style.gap = '14px';

    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.textContent = '×';
    closeButton.setAttribute('aria-label', 'Cerrar seleccion de bebida');
    closeButton.style.position = 'absolute';
    closeButton.style.top = '10px';
    closeButton.style.right = '10px';
    closeButton.style.width = '38px';
    closeButton.style.height = '38px';
    closeButton.style.border = 'none';
    closeButton.style.borderRadius = '999px';
    closeButton.style.background = 'rgba(90, 58, 27, 0.14)';
    closeButton.style.color = '#5a3a1b';
    closeButton.style.fontSize = '1.7rem';
    closeButton.style.cursor = 'pointer';
    closeButton.addEventListener('click', closeComboChoiceModal);

    const title = document.createElement('h3');
    title.textContent = productName;
    title.style.margin = '0';
    title.style.textAlign = 'center';
    title.style.fontFamily = 'Oswald, sans-serif';
    title.style.fontSize = '1.85rem';
    title.style.lineHeight = '1';
    title.style.textTransform = 'uppercase';
    title.style.color = '#5a3a1b';

    const category = document.createElement('p');
    category.textContent = categoryName;
    category.style.margin = '-4px 0 0';
    category.style.textAlign = 'center';
    category.style.fontFamily = 'Oswald, sans-serif';
    category.style.fontSize = '0.95rem';
    category.style.letterSpacing = '0.08em';
    category.style.textTransform = 'uppercase';
    category.style.color = '#8b5527';

    const description = document.createElement('p');
    description.textContent = 'Selecciona el sabor de la bebida de 1 litro que quieres para este combo.';
    description.style.margin = '0';
    description.style.textAlign = 'center';
    description.style.lineHeight = '1.45';
    description.style.color = '#4f311d';

    const drinkSelect = document.createElement('select');
    drinkSelect.style.minHeight = '48px';
    drinkSelect.style.padding = '0 14px';
    drinkSelect.style.borderRadius = '12px';
    drinkSelect.style.border = '1px solid rgba(140, 90, 44, 0.24)';
    drinkSelect.style.background = '#fffdfa';
    drinkSelect.style.color = '#4f311d';
    drinkSelect.style.fontSize = '0.98rem';

    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Elige sabor de 1 litro';
    drinkSelect.appendChild(placeholder);

    COMBO_MEAL_LARGE_DRINK_OPTIONS.forEach((drinkName) => {
        const option = document.createElement('option');
        option.value = drinkName;
        option.textContent = drinkName;
        drinkSelect.appendChild(option);
    });

    const commentField = createOrderCommentField();

    const confirmButton = document.createElement('button');
    confirmButton.type = 'button';
    confirmButton.textContent = 'Enviar a mi carrito';
    confirmButton.disabled = true;
    confirmButton.style.minHeight = '52px';
    confirmButton.style.borderRadius = '14px';
    confirmButton.style.border = 'none';
    confirmButton.style.background = 'linear-gradient(135deg, #ff7a00, #ff5a00)';
    confirmButton.style.color = '#fff7ef';
    confirmButton.style.fontFamily = 'Oswald, sans-serif';
    confirmButton.style.fontSize = '1.02rem';
    confirmButton.style.cursor = 'pointer';
    confirmButton.style.opacity = '0.5';

    drinkSelect.addEventListener('change', () => {
        const enabled = Boolean(drinkSelect.value);
        confirmButton.disabled = !enabled;
        confirmButton.style.opacity = enabled ? '1' : '0.5';
    });

    confirmButton.addEventListener('click', () => {
        if (!drinkSelect.value) {
            return;
        }
        closeComboChoiceModal();
        addItemToCart(productName, categoryName, {
            ...extraOptions,
            type: 'combo-mixed',
            drink: drinkSelect.value,
            comment: commentField.textarea.value
        }, buttonId);
    });

    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeComboChoiceModal();
        }
    });

    card.appendChild(closeButton);
    card.appendChild(title);
    card.appendChild(category);
    card.appendChild(description);
    card.appendChild(drinkSelect);
    card.appendChild(commentField.wrap);
    card.appendChild(confirmButton);
    modal.appendChild(card);

    document.body.style.overflow = 'hidden';
    document.body.appendChild(modal);
}

function openCombosConPapasModal(productName, categoryName, buttonId, extraOptions = {}) {
    closeComboChoiceModal();
    const normalizedProductName = normalizeCategoryKey(productName);
    const comboHeaderNote = normalizedProductName.includes('perro')
        ? 'Cada perro lleva un servicio de papas a la francesa de 75 gr.'
        : 'Cada burger lleva un servicio de papas a la francesa de 75 gr.';

    const modal = document.createElement('div');
    modal.id = 'combo-choice-modal';
    modal.style.position = 'fixed';
    modal.style.inset = '0';
    modal.style.zIndex = '100001';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.padding = '20px';
    modal.style.background = 'rgba(31, 18, 10, 0.76)';
    modal.style.backdropFilter = 'blur(8px)';
    modal.style.webkitBackdropFilter = 'blur(8px)';

    const card = document.createElement('div');
    card.style.width = 'min(92vw, 430px)';
    card.style.position = 'relative';
    card.style.padding = '22px';
    card.style.borderRadius = '20px';
    card.style.background = 'linear-gradient(180deg, rgba(255,248,236,0.98), rgba(245,221,188,0.92))';
    card.style.boxShadow = '0 20px 48px rgba(67, 37, 23, 0.28)';
    card.style.border = '1px solid rgba(255, 180, 108, 0.55)';
    card.style.display = 'flex';
    card.style.flexDirection = 'column';
    card.style.gap = '14px';

    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.textContent = '×';
    closeButton.setAttribute('aria-label', 'Cerrar seleccion de combo');
    closeButton.style.position = 'absolute';
    closeButton.style.top = '10px';
    closeButton.style.right = '10px';
    closeButton.style.width = '38px';
    closeButton.style.height = '38px';
    closeButton.style.border = 'none';
    closeButton.style.borderRadius = '999px';
    closeButton.style.background = 'rgba(90, 58, 27, 0.14)';
    closeButton.style.color = '#5a3a1b';
    closeButton.style.fontSize = '1.7rem';
    closeButton.style.cursor = 'pointer';
    closeButton.addEventListener('click', closeComboChoiceModal);

    const title = document.createElement('h3');
    title.textContent = productName;
    title.style.margin = '0';
    title.style.textAlign = 'center';
    title.style.fontFamily = 'Oswald, sans-serif';
    title.style.fontSize = '1.85rem';
    title.style.lineHeight = '1';
    title.style.textTransform = 'uppercase';
    title.style.color = '#5a3a1b';

    const category = document.createElement('p');
    category.textContent = categoryName;
    category.style.margin = '-4px 0 0';
    category.style.textAlign = 'center';
    category.style.fontFamily = 'Oswald, sans-serif';
    category.style.fontSize = '0.95rem';
    category.style.letterSpacing = '0.08em';
    category.style.textTransform = 'uppercase';
    category.style.color = '#8b5527';

    const topNote = document.createElement('p');
    topNote.textContent = comboHeaderNote;
    topNote.style.margin = '0';
    topNote.style.textAlign = 'center';
    topNote.style.lineHeight = '1.45';
    topNote.style.color = '#4f311d';
    topNote.style.fontWeight = '700';

    const peopleLabel = document.createElement('label');
    peopleLabel.textContent = 'Para cuantas personas';
    peopleLabel.style.color = '#5a3a1b';
    peopleLabel.style.fontFamily = 'Oswald, sans-serif';
    peopleLabel.style.fontSize = '1rem';

    const peopleButtonsWrap = document.createElement('div');
    peopleButtonsWrap.style.display = 'grid';
    peopleButtonsWrap.style.gridTemplateColumns = '1fr';
    peopleButtonsWrap.style.gap = '10px';

    let selectedPeopleCount = 0;
    const peopleButtons = [];

    function setPeopleSelection(nextCount) {
        selectedPeopleCount = Number(nextCount || 0);
        peopleButtons.forEach(({ count, button }) => {
            const isActive = count === selectedPeopleCount;
            button.style.background = isActive ? 'linear-gradient(135deg, #ff7a00, #ff5a00)' : 'rgba(255, 247, 235, 0.92)';
            button.style.color = isActive ? '#fff7ef' : '#5a3a1b';
            button.style.borderColor = isActive ? 'transparent' : 'rgba(140, 90, 44, 0.24)';
            button.style.boxShadow = isActive ? '0 12px 28px rgba(200, 75, 0, 0.18)' : 'none';
        });
        if (selectedPeopleCount) {
            peopleLabel.style.display = 'none';
            peopleButtonsWrap.style.display = 'none';
        }
        refreshDrinkSelectors(selectedPeopleCount);
    }

    [
        { count: 1, label: '1 PERSONA = 1 BEBIDA 250ML' },
        { count: 2, label: '2 PERSONAS = 2 BEBIDAS 250ML' },
        { count: 3, label: '3 PERSONAS = 1 BEBIDA 1000ML' },
        { count: 4, label: '4 PERSONAS = 1 BEBIDA 1000ML' }
    ].forEach((item) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = item.label;
        button.style.minHeight = '50px';
        button.style.padding = '10px 14px';
        button.style.borderRadius = '12px';
        button.style.border = '1px solid rgba(140, 90, 44, 0.24)';
        button.style.background = 'rgba(255, 247, 235, 0.92)';
        button.style.color = '#5a3a1b';
        button.style.fontFamily = 'Oswald, sans-serif';
        button.style.fontSize = '0.95rem';
        button.style.lineHeight = '1.2';
        button.style.cursor = 'pointer';
        button.addEventListener('click', () => {
            setPeopleSelection(item.count);
        });
        peopleButtons.push({ count: item.count, button });
        peopleButtonsWrap.appendChild(button);
    });

    const drinksWrap = document.createElement('div');
    drinksWrap.style.display = 'flex';
    drinksWrap.style.flexDirection = 'column';
    drinksWrap.style.gap = '10px';
    drinksWrap.style.padding = '14px';
    drinksWrap.style.borderRadius = '16px';
    drinksWrap.style.background = 'rgba(255, 253, 248, 0.7)';
    drinksWrap.style.border = '1px solid rgba(140, 90, 44, 0.16)';
    drinksWrap.hidden = true;

    const drinksTitle = document.createElement('p');
    drinksTitle.style.margin = '0';
    drinksTitle.style.color = '#5a3a1b';
    drinksTitle.style.fontFamily = 'Oswald, sans-serif';
    drinksTitle.style.fontSize = '0.98rem';

    const commentField = createOrderCommentField();

    const drinkSelectsContainer = document.createElement('div');
    drinkSelectsContainer.style.display = 'flex';
    drinkSelectsContainer.style.flexDirection = 'column';
    drinkSelectsContainer.style.gap = '10px';

    const confirmButton = document.createElement('button');
    confirmButton.type = 'button';
    confirmButton.textContent = 'Enviar a mi carrito';
    confirmButton.disabled = true;
    confirmButton.style.minHeight = '52px';
    confirmButton.style.borderRadius = '14px';
    confirmButton.style.border = 'none';
    confirmButton.style.background = 'linear-gradient(135deg, #ff7a00, #ff5a00)';
    confirmButton.style.color = '#fff7ef';
    confirmButton.style.fontFamily = 'Oswald, sans-serif';
    confirmButton.style.fontSize = '1.02rem';
    confirmButton.style.cursor = 'pointer';
    confirmButton.style.opacity = '0.5';

    function refreshDrinkSelectors(peopleCount) {
        const count = Number(peopleCount || 0);
        drinkSelectsContainer.innerHTML = '';
        drinksWrap.hidden = !count;
        drinksWrap.style.display = count ? 'flex' : 'none';
        confirmButton.disabled = true;
        confirmButton.style.opacity = '0.5';

        if (!count) {
            return;
        }

        const isLargeDrink = count >= 3;
        const requiredSelects = isLargeDrink ? 1 : count;
        const drinkOptions = isLargeDrink ? COMBO_MEAL_LARGE_DRINK_OPTIONS : COMBO_MEAL_SMALL_DRINK_OPTIONS;
        drinksTitle.textContent = isLargeDrink
            ? 'Selecciona el sabor de la bebida de 1 litro'
            : `Selecciona ${requiredSelects} bebida${requiredSelects === 1 ? '' : 's'} de 250 ml`;

        const selects = [];

        for (let index = 0; index < requiredSelects; index += 1) {
            const select = document.createElement('select');
            select.style.minHeight = '48px';
            select.style.padding = '0 14px';
            select.style.borderRadius = '12px';
            select.style.border = '1px solid rgba(140, 90, 44, 0.24)';
            select.style.background = '#fffdfa';
            select.style.color = '#4f311d';
            select.style.fontSize = '0.98rem';

            const placeholder = document.createElement('option');
            placeholder.value = '';
            placeholder.textContent = isLargeDrink ? 'Elige sabor de 1 litro' : `Elige bebida ${index + 1}`;
            select.appendChild(placeholder);

            drinkOptions.forEach((drinkName) => {
                const option = document.createElement('option');
                option.value = drinkName;
                option.textContent = drinkName;
                select.appendChild(option);
            });

            select.addEventListener('change', () => {
                const enabled = selects.every((item) => Boolean(item.value));
                confirmButton.disabled = !enabled;
                confirmButton.style.opacity = enabled ? '1' : '0.5';
            });

            selects.push(select);
            drinkSelectsContainer.appendChild(select);
        }

        confirmButton.onclick = () => {
            const drinkValues = selects.map((select) => select.value).filter(Boolean);
            if (drinkValues.length !== requiredSelects) {
                return;
            }

            if (buttonId) {
                trackProductInterest(`${productName} - ${count} personas - ${drinkValues.join(', ')}`, buttonId);
            }

            closeComboChoiceModal();
            addItemToCart(productName, categoryName, {
                ...extraOptions,
                type: 'combo-meal',
                peopleCount: count,
                drinks: drinkValues,
                comment: commentField.textarea.value
            }, buttonId);
        };
    }

    drinksWrap.appendChild(drinksTitle);
    drinksWrap.appendChild(drinkSelectsContainer);
    drinksWrap.appendChild(commentField.wrap);
    drinksWrap.appendChild(confirmButton);

    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeComboChoiceModal();
        }
    });

    card.appendChild(closeButton);
    card.appendChild(title);
    card.appendChild(category);
    card.appendChild(topNote);
    card.appendChild(peopleLabel);
    card.appendChild(peopleButtonsWrap);
    card.appendChild(drinksWrap);
    modal.appendChild(card);

    document.body.style.overflow = 'hidden';
    document.body.appendChild(modal);
}

function openComboChoiceModal(productName, categoryName, buttonId, extraOptions = {}) {
    closeComboChoiceModal();
    const buttonCopy = getComboButtonCopy(categoryName);

    const modal = document.createElement('div');
    modal.id = 'combo-choice-modal';
    modal.style.position = 'fixed';
    modal.style.inset = '0';
    modal.style.zIndex = '100001';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.padding = '20px';
    modal.style.background = 'rgba(31, 18, 10, 0.76)';
    modal.style.backdropFilter = 'blur(8px)';
    modal.style.webkitBackdropFilter = 'blur(8px)';

    const card = document.createElement('div');
    card.style.width = 'min(92vw, 430px)';
    card.style.position = 'relative';
    card.style.padding = '22px';
    card.style.borderRadius = '20px';
    card.style.background = 'linear-gradient(180deg, rgba(255,248,236,0.98), rgba(245,221,188,0.92))';
    card.style.boxShadow = '0 20px 48px rgba(67, 37, 23, 0.28)';
    card.style.border = '1px solid rgba(255, 180, 108, 0.55)';
    card.style.display = 'flex';
    card.style.flexDirection = 'column';
    card.style.gap = '14px';

    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.textContent = '×';
    closeButton.setAttribute('aria-label', 'Cerrar seleccion de combo');
    closeButton.style.position = 'absolute';
    closeButton.style.top = '10px';
    closeButton.style.right = '10px';
    closeButton.style.width = '38px';
    closeButton.style.height = '38px';
    closeButton.style.border = 'none';
    closeButton.style.borderRadius = '999px';
    closeButton.style.background = 'rgba(90, 58, 27, 0.14)';
    closeButton.style.color = '#5a3a1b';
    closeButton.style.fontSize = '1.7rem';
    closeButton.style.cursor = 'pointer';
    closeButton.addEventListener('click', closeComboChoiceModal);

    const title = document.createElement('h3');
    title.textContent = productName;
    title.style.margin = '0';
    title.style.textAlign = 'center';
    title.style.fontFamily = 'Oswald, sans-serif';
    title.style.fontSize = '1.85rem';
    title.style.lineHeight = '1';
    title.style.textTransform = 'uppercase';
    title.style.color = '#5a3a1b';

    const category = document.createElement('p');
    category.textContent = categoryName;
    category.style.margin = '-4px 0 0';
    category.style.textAlign = 'center';
    category.style.fontFamily = 'Oswald, sans-serif';
    category.style.fontSize = '0.95rem';
    category.style.letterSpacing = '0.08em';
    category.style.textTransform = 'uppercase';
    category.style.color = '#8b5527';

    const description = document.createElement('p');
    description.textContent = `Quieres este producto en combo por $${COMBO_EXTRA_PRICE.toLocaleString('es-CO')} adicional? Incluye 75 gr de papas a la francesa y una gaseosa de 250 ml.`;
    description.style.margin = '0';
    description.style.textAlign = 'center';
    description.style.lineHeight = '1.45';
    description.style.color = '#4f311d';

    const actionRow = document.createElement('div');
    actionRow.style.display = 'grid';
    actionRow.style.gridTemplateColumns = '1fr 1fr';
    actionRow.style.gap = '12px';

    const commentField = createOrderCommentField();

    const soloButton = document.createElement('button');
    soloButton.type = 'button';
    soloButton.textContent = buttonCopy.solo;
    soloButton.style.minHeight = '52px';
    soloButton.style.borderRadius = '14px';
    soloButton.style.border = '1px solid rgba(140, 90, 44, 0.24)';
    soloButton.style.background = 'rgba(255, 247, 235, 0.92)';
    soloButton.style.color = '#5a3a1b';
    soloButton.style.fontFamily = 'Oswald, sans-serif';
    soloButton.style.fontSize = '1.02rem';
    soloButton.style.cursor = 'pointer';
    soloButton.addEventListener('click', () => {
        closeComboChoiceModal();
        addItemToCart(productName, categoryName, {
            ...extraOptions,
            type: 'solo',
            comment: commentField.textarea.value
        }, buttonId);
    });

    const comboButton = document.createElement('button');
    comboButton.type = 'button';
    comboButton.textContent = buttonCopy.combo;
    comboButton.style.minHeight = '52px';
    comboButton.style.borderRadius = '14px';
    comboButton.style.border = 'none';
    comboButton.style.background = 'linear-gradient(135deg, #ff7a00, #ff5a00)';
    comboButton.style.color = '#fff7ef';
    comboButton.style.fontFamily = 'Oswald, sans-serif';
    comboButton.style.fontSize = '1.02rem';
    comboButton.style.cursor = 'pointer';

    actionRow.appendChild(soloButton);
    actionRow.appendChild(comboButton);

    const comboPanel = document.createElement('div');
    comboPanel.hidden = true;
    comboPanel.style.display = 'none';
    comboPanel.style.flexDirection = 'column';
    comboPanel.style.gap = '10px';
    comboPanel.style.padding = '14px';
    comboPanel.style.borderRadius = '16px';
    comboPanel.style.background = 'rgba(255, 253, 248, 0.7)';
    comboPanel.style.border = '1px solid rgba(140, 90, 44, 0.16)';

    const comboLabel = document.createElement('label');
    comboLabel.textContent = 'Selecciona el sabor de la bebida';
    comboLabel.style.color = '#5a3a1b';
    comboLabel.style.fontFamily = 'Oswald, sans-serif';
    comboLabel.style.fontSize = '0.98rem';

    const comboSelect = document.createElement('select');
    comboSelect.style.minHeight = '48px';
    comboSelect.style.padding = '0 14px';
    comboSelect.style.borderRadius = '12px';
    comboSelect.style.border = '1px solid rgba(140, 90, 44, 0.24)';
    comboSelect.style.background = '#fffdfa';
    comboSelect.style.color = '#4f311d';
    comboSelect.style.fontSize = '0.98rem';

    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Elige una bebida';
    comboSelect.appendChild(placeholder);

    COMBO_DRINK_OPTIONS.forEach((drinkName) => {
        const option = document.createElement('option');
        option.value = drinkName;
        option.textContent = drinkName;
        comboSelect.appendChild(option);
    });

    const comboHelp = document.createElement('p');
    comboHelp.textContent = 'Incluye 75 gr de papas a la francesa y una gaseosa de 250 ml.';
    comboHelp.style.margin = '0';
    comboHelp.style.textAlign = 'center';
    comboHelp.style.lineHeight = '1.45';
    comboHelp.style.color = '#4f311d';

    const comboConfirm = document.createElement('button');
    comboConfirm.type = 'button';
    comboConfirm.textContent = 'Enviar a mi carrito';
    comboConfirm.disabled = true;
    comboConfirm.style.minHeight = '52px';
    comboConfirm.style.borderRadius = '14px';
    comboConfirm.style.border = 'none';
    comboConfirm.style.background = 'linear-gradient(135deg, #ff7a00, #ff5a00)';
    comboConfirm.style.color = '#fff7ef';
    comboConfirm.style.fontFamily = 'Oswald, sans-serif';
    comboConfirm.style.fontSize = '1.02rem';
    comboConfirm.style.cursor = 'pointer';
    comboConfirm.style.opacity = '0.5';

    comboSelect.addEventListener('change', () => {
        const enabled = Boolean(comboSelect.value);
        comboConfirm.disabled = !enabled;
        comboConfirm.style.opacity = enabled ? '1' : '0.5';
    });

    comboButton.addEventListener('click', () => {
        comboPanel.hidden = false;
        comboPanel.style.display = 'flex';
        comboSelect.focus();
    });

    comboConfirm.addEventListener('click', () => {
        if (!comboSelect.value) {
            return;
        }
        closeComboChoiceModal();
        addItemToCart(productName, categoryName, {
            ...extraOptions,
            type: 'combo',
            drink: comboSelect.value,
            comment: commentField.textarea.value
        }, buttonId);
    });

    comboPanel.appendChild(comboLabel);
    comboPanel.appendChild(comboSelect);
    comboPanel.appendChild(comboHelp);
    comboPanel.appendChild(commentField.wrap);
    comboPanel.appendChild(comboConfirm);

    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeComboChoiceModal();
        }
    });

    card.appendChild(closeButton);
    card.appendChild(title);
    card.appendChild(category);
    card.appendChild(description);
    card.appendChild(commentField.wrap);
    card.appendChild(actionRow);
    card.appendChild(comboPanel);
    modal.appendChild(card);

    if (window.innerWidth <= 480) {
        actionRow.style.gridTemplateColumns = '1fr';
    }

    document.body.style.overflow = 'hidden';
    document.body.appendChild(modal);
}

function startProductOrderFlow(productName, categoryName, buttonId, extraOptions = {}) {
    if (!canPlaceOrdersNow()) {
        showOrderingClosedMessage();
        return;
    }

    const safeCategoryName = String(categoryName || getSelectedCategoryName()).trim() || 'NUESTROS PRODUCTOS';
    const normalizedOptions = normalizeOrderOptions(extraOptions);

    if (normalizeCategoryKey(safeCategoryName).includes('burger clasicas')) {
        const burgerOptions = getBurgerClasicasOptions(productName);
        if (burgerOptions.length) {
            openImageOptionModal(productName, safeCategoryName, buttonId, normalizedOptions, {
                optionItems: burgerOptions,
                description: 'Selecciona el tamano y la cantidad de carne que ves en la imagen.'
            });
            return;
        }
    }

    if (normalizeCategoryKey(safeCategoryName).includes('salchipapa')) {
        const salchipapaOptions = getSalchipapaOptions(productName);
        if (salchipapaOptions.length) {
            openImageOptionModal(productName, safeCategoryName, buttonId, normalizedOptions, {
                optionItems: salchipapaOptions,
                description: 'Selecciona el tamano que quieres agregar segun la imagen.'
            });
            return;
        }
    }

    if (isCombosConPapasCategory(safeCategoryName)) {
        openCombosConPapasModal(productName, safeCategoryName, buttonId, normalizedOptions);
        return;
    }

    if (isCombosMixtosCategory(safeCategoryName)) {
        openCombosMixtosModal(productName, safeCategoryName, buttonId, normalizedOptions);
        return;
    }

    if (isEntradasCategory(safeCategoryName)) {
        openEntradasOptionsModal(productName, safeCategoryName, buttonId, normalizedOptions);
        return;
    }

    if (isBebidasYAdicionalesCategory(safeCategoryName)) {
        openBebidasYAdicionalesOptionsModal(productName, safeCategoryName, buttonId, normalizedOptions);
        return;
    }

    if (!isComboCategory(safeCategoryName)) {
        openProductCommentModal(productName, safeCategoryName, buttonId, normalizedOptions);
        return;
    }

    openComboChoiceModal(productName, safeCategoryName, buttonId, normalizedOptions);
}
let featuredCarouselAnimationFrame = null;
let featuredCarouselLastTimestamp = 0;

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
    './bebidasyadicionales/bebidas.png',
    './bebidasyadicionales/adicionales.png',
    'BURGER CLASICAS.png',
    'BURGER PREMIUM.png',
    'COMBOS BURGER.png',
    'COMBOS DE PERROS Y EXPRESS.png',
    'COMBOS DE TEMPORADAS.png',
    'COMBOS FAMILIARES.png',
    './burgerpremium/burgercordillera.png',
    'empanadas.png',
    'entradas.png',
    'menu combo emparejado.png',
    'PEPITOS VENEZOLANOS.png',
    'PERROS CALIENTES Y SALCHIPAPAS.png'
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
    { key: 'bebidas y adicionales', name: 'BEBIDAS Y ADICIONALES' },
    { key: 'perros y salchipapas', name: 'PERROS CALIENTES' },
    { key: 'salchipapas', name: 'SALCHIPAPAS' },
    { key: 'salchipapa', name: 'SALCHIPAPA' }
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
    bebidasyadicionales: './bebidasyadicionales/bebidas.png',
    adicionales: './bebidasyadicionales/adicionales.png'
};

const PINNED_CATEGORY_BUTTONS = [
    { key: 'burger premium', name: 'BURGER PREMIUM', matchKeys: ['burger premium'] },
    { key: 'burger clasicas', name: 'BURGER CLASICAS', matchKeys: ['burger clasicas', 'burger clasica'] },
    { key: 'pepitos venezolanos', name: 'PEPITOS VENEZOLANOS', matchKeys: ['pepitos venezolanos', 'pepitos'] },
    { key: 'perros y salchipapas', name: 'PERROS CALIENTES', matchKeys: ['perros y salchipapas', 'perros calientes', 'perros calientes y salchipapas'] },
    { key: 'entradas', name: 'ENTRADAS', matchKeys: ['entradas'] },
    { key: 'combos burger', name: 'COMBOS BURGER', matchKeys: ['combos burger', 'combo burger', 'combos de burger'] },
    { key: 'combos perros', name: 'COMBOS PERROS', matchKeys: ['combos perros', 'combos perros y express', 'combos de perros y express', 'combos de perros', 'combos express'] },
    { key: 'combos familiares', name: 'COMBOS FAMILIARES', matchKeys: ['combos familiares', 'combo familiar'] },
    { key: 'salchipapas', name: 'SALCHIPAPAS', matchKeys: ['salchipapas', 'salchipapa'] },
    { key: 'combos con papas y bebida', name: 'COMBOS CON PAPAS Y BEBIDA', matchKeys: ['combos con papas y bebida'] },
    { key: 'combos mixtos', name: 'COMBOS MIXTOS', matchKeys: ['combos mixtos'] },
    { key: 'nuestras salsas', name: 'NUESTRAS SALSAS', matchKeys: ['nuestras salsas'] },
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

const HIDDEN_PRODUCT_KEYS = new Set(['de la casa', 'empanadas', 'empanada']);
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
    let productName = String(product?.nombre || product?.name || '').trim();
    let normalizedProductName = normalizeAssetLookup(productName);
    const categoryKey = normalizeCategoryKey(product?.categoria || product?.category || '');

    // Si es pepitos venezolanos, usar siempre la ruta directa y extensión real
    if (categoryKey === 'pepitosvenezolanos' || categoryKey === 'pepitos venezolanos') {
        if (normalizedProductName.includes('ranchero')) {
            return 'pepitosvenezolanos/pepitoranchero.png';
        }
        return `pepitosvenezolanos/pepito${normalizedProductName}.png`;
    }

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
    if (normalizedCategory === 'bebidasyadicionales') {
        // Siempre devolver la imagen correcta de la galería
        return './bebidasyadicionales/adicionales.png';
    }
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

            const categoriaSeleccionada = category.name;
            const catNormalizada = typeof categoriaSeleccionada === 'string' ? categoriaSeleccionada.trim().toUpperCase() : '';

            // --- SALCHIPAPAS ---
            if (catNormalizada.includes("SALCHIPAPA")) {
                const contenedorMenu = document.getElementById("products-container") || document.querySelector(".products-grid") || document.getElementById("categoryProductsPanel") || document.querySelector(".menu-images-container");
                if (contenedorMenu) {
                    contenedorMenu.innerHTML = ""; 
                }
                const galeriaHTML = `
                    <div class="bebidas-gallery-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; padding: 20px;">
                        <div class="card-pequena" style="cursor: pointer;" onclick="abrirModalBebida('Salchi Normal', './salchipapas/salchinormal.png')">
                            <img src="./salchipapas/salchinormal.png" style="width: 100%; border-radius: 8px;" alt="Salchi Normal">
                            <p style="text-align: center; font-weight: bold; margin-top: 5px; color: #000;">Salchi Normal</p>
                        </div>
                        <div class="card-pequena" style="cursor: pointer;" onclick="abrirModalBebida('Salchi Super', './salchipapas/salchisuper.png')">
                            <img src="./salchipapas/salchisuper.png" style="width: 100%; border-radius: 8px;" alt="Salchi Super">
                            <p style="text-align: center; font-weight: bold; margin-top: 5px; color: #000;">Salchi Super</p>
                        </div>
                    </div>
                `;
                if (contenedorMenu) {
                    contenedorMenu.insertAdjacentHTML("beforeend", galeriaHTML);
                }
                return; // Detiene la ejecución para que no se ruede a los perros
            }

            // --- BEBIDAS Y ADICIONALES ---
            if (catNormalizada.includes("BEBIDAS") || catNormalizada.includes("ADICIONALES")) {
                // 1. Limpiar el contenedor de raíz usando todos los selectores posibles
                const contenedorMenu = document.getElementById("products-container") || document.querySelector(".products-grid") || document.getElementById("categoryProductsPanel") || document.querySelector(".menu-images-container");
                if (contenedorMenu) {
                    contenedorMenu.innerHTML = ""; 
                }
                // 2. Inyectar la galería con el nombre de archivo REAL (adiciones.png)
                const galeriaHTML = `
                    <div class="bebidas-gallery-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; padding: 20px;">
                        <div class="card-pequena" style="cursor: pointer;" onclick="abrirModalBebida('Adicionales', './bebidasyadicionales/adiciones.png')">
                            <img src="./bebidasyadicionales/adiciones.png" style="width: 100%; border-radius: 8px;" alt="Adicionales">
                            <p style="text-align: center; font-weight: bold; margin-top: 5px; color: #000;">Adicionales</p>
                        </div>
                        <div class="card-pequena" style="cursor: pointer;" onclick="abrirModalBebida('Bebidas', './bebidasyadicionales/bebidas.png')">
                            <img src="./bebidasyadicionales/bebidas.png" style="width: 100%; border-radius: 8px;" alt="Bebidas">
                            <p style="text-align: center; font-weight: bold; margin-top: 5px; color: #000;">Bebidas</p>
                        </div>
                    </div>
                `;
                if (contenedorMenu) {
                    contenedorMenu.insertAdjacentHTML("beforeend", galeriaHTML);
                }
                return; // Bloquear cualquier renderizado viejo
            }

            // --- PERROS CALIENTES ---
            else if ((catNormalizada.includes("PERROS") || catNormalizada.includes("PERRO")) && !catNormalizada.includes("SALCHIPAPA")) {
                // Aquí va el renderizado de perros calientes, si existe
                // ...
            }
            // Modal para galería de bebidas/adicionales
            function openBebidasModal(imgSrc, title) {
                // Eliminar modal previo si existe
                const prev = document.getElementById('bebidas-modal');
                if (prev) prev.remove();

                const modalBg = document.createElement('div');
                modalBg.id = 'bebidas-modal';
                modalBg.style.position = 'fixed';
                modalBg.style.top = '0';
                modalBg.style.left = '0';
                modalBg.style.width = '100vw';
                modalBg.style.height = '100vh';
                modalBg.style.background = 'rgba(0,0,0,0.97)';
                modalBg.style.display = 'flex';
                modalBg.style.alignItems = 'center';
                modalBg.style.justifyContent = 'center';
                modalBg.style.zIndex = '99999';
                modalBg.style.width = '100vw';
                modalBg.style.height = '100vh';
                modalBg.style.top = '0';
                modalBg.style.left = '0';
                modalBg.style.position = 'fixed';

                const modalContent = document.createElement('div');
                modalContent.style.background = 'rgba(20,20,20,0.98)';
                modalContent.style.borderRadius = '16px';
                modalContent.style.padding = '24px 18px 18px 18px';
                modalContent.style.display = 'flex';
                modalContent.style.flexDirection = 'column';
                modalContent.style.alignItems = 'center';
                modalContent.style.maxWidth = '95vw';
                modalContent.style.maxHeight = '90vh';
                modalContent.style.boxShadow = '0 4px 32px 0 rgba(0,0,0,0.25)';

                const img = document.createElement('img');
                img.src = normalizeImageAssetPath(imgSrc);
                img.alt = title;
                img.style.maxWidth = '80vw';
                img.style.maxHeight = '55vh';
                img.style.borderRadius = '12px';
                img.style.marginBottom = '18px';
                img.style.boxShadow = '0 2px 12px 0 rgba(0,0,0,0.18)';

                const titleDiv = document.createElement('div');
                titleDiv.textContent = title;
                titleDiv.style.fontWeight = '700';
                titleDiv.style.fontSize = '1.25rem';
                titleDiv.style.color = '#fff';
                titleDiv.style.marginBottom = '18px';
                titleDiv.style.textAlign = 'center';

                // Botones
                const btnsRow = document.createElement('div');
                btnsRow.style.display = 'flex';
                btnsRow.style.gap = '18px';
                btnsRow.style.marginTop = '8px';

                // Botón Regresar
                const closeBtn = document.createElement('button');
                closeBtn.textContent = 'Regresar';
                closeBtn.style.background = '#222';
                closeBtn.style.color = '#fff';
                closeBtn.style.fontWeight = '600';
                closeBtn.style.fontSize = '1rem';
                closeBtn.style.border = 'none';
                closeBtn.style.borderRadius = '8px';
                closeBtn.style.padding = '10px 22px';
                closeBtn.style.cursor = 'pointer';
                closeBtn.style.boxShadow = '0 1px 4px 0 rgba(0,0,0,0.10)';
                closeBtn.onclick = () => {
                    modalBg.remove();
                };

                // Botón Pedir este producto
                const pedirBtn = document.createElement('button');
                const buttonId = `btn-gallery-${normalizeAssetLookup(title)}`;
                pedirBtn.type = 'button';
                pedirBtn.textContent = 'Pedir este producto';
                pedirBtn.style.background = '#ff6000';
                pedirBtn.style.color = '#fff';
                pedirBtn.style.fontWeight = '700';
                pedirBtn.style.fontSize = '1rem';
                pedirBtn.style.border = 'none';
                pedirBtn.style.borderRadius = '8px';
                pedirBtn.style.padding = '10px 22px';
                pedirBtn.style.cursor = 'pointer';
                pedirBtn.style.boxShadow = '0 1px 4px 0 rgba(0,0,0,0.10)';
                pedirBtn.addEventListener('click', () => {
                    modalBg.remove();
                    startProductOrderFlow(title, getSelectedCategoryName(), buttonId);
                });

                btnsRow.appendChild(closeBtn);
                btnsRow.appendChild(pedirBtn);

                modalContent.appendChild(img);
                modalContent.appendChild(titleDiv);
                modalContent.appendChild(btnsRow);
                modalBg.appendChild(modalContent);

                document.body.appendChild(modalBg);
            }
            // ...resto de categorías normales...
            if (!visibleProducts.length) {
                const empty = document.createElement('p');
                empty.textContent = 'No hay productos cargados en esta categoria.';
                empty.style.color = '#b6b6b6';
                empty.style.fontSize = '0.95rem';
                section.appendChild(empty);
            } else {
                visibleProducts.forEach((product) => {
                    // Intercept image path for pepitoranchero only
                    let rutaImagen = product.image_url || '';
                    if (rutaImagen.includes('pepitoranchero.png')) {
                        rutaImagen = './pepitosvenezolanos/pepitoranchero.png';
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
                    img.src = normalizeImageAssetPath(rutaImagen);
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

function renderFeaturedCards(carousel, items) {
        const featuredFallbackItems = [
            {
                name: 'Combo Burger Normal',
                src: './losmaspedidos/comboburgernormal.png',
                category: 'COMBOS CON PAPAS Y BEBIDA',
                orderImageSrc: './combosconpapasybebidas/comboburgernormal.png'
            },
            {
                name: 'Combo Burger Papuda',
                src: './losmaspedidos/comboburgerpapuda.png',
                category: 'COMBOS CON PAPAS Y BEBIDA',
                orderImageSrc: './combosconpapasybebidas/comboburgerpapuda.png'
            },
            {
                name: 'Combo Burger Super',
                src: './losmaspedidos/comboburgersuper.png',
                category: 'COMBOS CON PAPAS Y BEBIDA',
                orderImageSrc: './combosconpapasybebidas/comboburgersuper.png'
            },
            {
                name: 'Combo Perro Normal',
                src: './losmaspedidos/comboperronormal.png',
                category: 'COMBOS CON PAPAS Y BEBIDA',
                orderImageSrc: './combosconpapasybebidas/comboperronormal.png'
            },
            {
                name: 'De La Casa',
                src: './losmaspedidos/combodelacasa.png',
                category: 'COMBOS MIXTOS',
                orderImageSrc: './combosmixtos/delacasa.png'
            },
            {
                name: 'Emparejados',
                src: './losmaspedidos/comboemparejados.png',
                category: 'COMBOS MIXTOS',
                orderImageSrc: './combosmixtos/emparejados.png'
            },
            {
                name: 'Familiar 3',
                src: './losmaspedidos/combofamiliar3.png',
                category: 'COMBOS MIXTOS',
                orderImageSrc: './combosmixtos/familiar3.png'
            },
            {
                name: 'Familiar 4',
                src: './losmaspedidos/combofamiliar4.png',
                category: 'COMBOS MIXTOS',
                orderImageSrc: './combosmixtos/familiar4.png'
            }
        ];
        const featuredImageMap = {
            'comboburgernormal.png': './combosconpapasybebidas/comboburgernormal.png',
            'comboburgerpapuda.png': './combosconpapasybebidas/comboburgerpapuda.png',
            'comboburgersuper.png': './combosconpapasybebidas/comboburgersuper.png',
            'comboperronormal.png': './combosconpapasybebidas/comboperronormal.png',
            'combodelacasa.png': './combosmixtos/delacasa.png',
            'comboemparejados.png': './combosmixtos/emparejados.png',
            'combofamiliar3.png': './combosmixtos/familiar3.png',
            'combofamiliar4.png': './combosmixtos/familiar4.png'
        };
        const rawItems = Array.isArray(items) && items.length ? items : featuredFallbackItems;
        const resolvedItems = rawItems.map((item) => {
            const safeName = String(item?.nombre || item?.name || item?.title || '').trim() || 'Producto';
            const displaySrc = normalizeImageAssetPath(item?.src || item?.image_url || '');
            const explicitCategory = String(item?.category || item?.categoria || '').trim();
            const normalizedName = normalizeCategoryKey(safeName);
            const mappedOrderImage = displaySrc
                ? featuredImageMap[displaySrc.split('/').pop()] || ''
                : '';
            const safeCategory = explicitCategory
                || (displaySrc.includes('combosconpapasybebidas') || normalizedName.includes('combo burger') || normalizedName.includes('combo perro')
                    ? 'COMBOS CON PAPAS Y BEBIDA'
                    : 'COMBOS MIXTOS');
            const orderImageSrc = normalizeImageAssetPath(item?.orderImageSrc || item?.order_image_url || mappedOrderImage || displaySrc);

            return {
                name: safeName,
                src: displaySrc,
                category: safeCategory,
                orderImageSrc
            };
        }).filter((item) => item.src);
        carousel.innerHTML = '';
        resolvedItems.forEach((item, index) => {
            const safeName = item.name;
            const featuredCategoryName = item.category;
            const buttonId = `btn-featured-${index + 1}`;
            const card = document.createElement('div');
            card.className = 'product-card-mobile';
            const imageWrap = document.createElement('div');
            imageWrap.className = 'card-image-wrapper';
            imageWrap.style.cursor = 'zoom-in';
            const image = document.createElement('img');
            image.className = 'product-image-mobile';
            image.alt = safeName;
            image.src = item.src;
            imageWrap.addEventListener('click', () => {
                abrirModalBebida(safeName, item.src, featuredCategoryName, { orderImagePath: item.orderImageSrc });
            });
            const button = document.createElement('button');
            button.className = 'mobile-order-btn';
            button.id = buttonId;
            button.type = 'button';
            button.textContent = '¡Lo Quiero!';
            button.addEventListener('click', (event) => {
                event.preventDefault();
                startProductOrderFlow(safeName, featuredCategoryName, buttonId, { imagePath: item.orderImageSrc });
            });
            imageWrap.appendChild(image);
            card.appendChild(imageWrap);
            card.appendChild(button);
            carousel.appendChild(card);
        });
        carousel.scrollLeft = 0;
        syncOrderingAvailabilityUI();
        setupFeaturedCarouselAutoplay(carousel);
}

function stopFeaturedCarouselAutoplay() {
    const carousel = document.querySelector('.featured-section .mobile-carousel');
    if (carousel) {
        carousel.classList.remove('is-auto-playing');
    }

    if (featuredCarouselAnimationFrame) {
        cancelAnimationFrame(featuredCarouselAnimationFrame);
        featuredCarouselAnimationFrame = null;
    }

    featuredCarouselLastTimestamp = 0;
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
    carousel.classList.add('is-auto-playing');

    const isMobileViewport = window.matchMedia('(max-width: 768px)').matches;
    const speedPxPerSecond = isMobileViewport ? 24 : 34;

    const animate = (timestamp) => {
        if (featuredCarouselUserPaused) {
            stopFeaturedCarouselAutoplay();
            return;
        }

        const segmentWidth = carousel.scrollWidth / 3;
        if (!segmentWidth || segmentWidth <= carousel.clientWidth) {
            featuredCarouselAnimationFrame = requestAnimationFrame(animate);
            return;
        }

        if (!featuredCarouselLastTimestamp) {
            featuredCarouselLastTimestamp = timestamp;
        }

        const deltaSeconds = Math.max(0, (timestamp - featuredCarouselLastTimestamp) / 1000);
        featuredCarouselLastTimestamp = timestamp;

        const next = carousel.scrollLeft + (speedPxPerSecond * deltaSeconds);
        if (next >= segmentWidth * 2) {
            carousel.scrollLeft = next - segmentWidth;
        } else {
            carousel.scrollLeft = next;
        }

        featuredCarouselAnimationFrame = requestAnimationFrame(animate);
    };

    featuredCarouselAnimationFrame = requestAnimationFrame(animate);
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
        window.open(safeLink, '_blank', 'noopener,noreferrer');
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
    const sourceCategories = Array.isArray(activeCategoryMeta) && activeCategoryMeta.length
        ? activeCategoryMeta
        : allCategoryMeta;


    // Excluir combos de temporada, familiares, perros, burger y variantes
    const EXCLUDE_KEYS = new Set([
        'adicionales',
        'combos',
        'combos de temporada', 'combos de temporadas', 'combos temporada',
        'combos familiares', 'combo familiar',
        'combos perros', 'combos de perros', 'combos perros y express', 'combos de perros y express', 'combos express',
        'combos burger', 'combo burger', 'combos de burger'
    ]);

    sourceCategories.forEach((item) => {
        const name = item?.name;
        const cleanName = String(name || '').trim();
        const key = normalizeCategoryKey(cleanName);
        if (!cleanName || !key || keys.has(key) || EXCLUDE_KEYS.has(key)) {
            return;
        }
        keys.add(key);
        uniqueMap.set(key, { name: cleanName, key });
    });

    latestProducts.forEach((product) => {
        const name = product.categoria || product.category || '';
        const cleanName = String(name || '').trim();
        const key = normalizeCategoryKey(cleanName);
        if (!cleanName || !key || keys.has(key) || EXCLUDE_KEYS.has(key)) {
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

        if (!isCategoryAllowed(name)) {
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


    // Excluir combos de temporada, familiares, perros, burger de los forzados
    FORCED_CATEGORY_BUTTONS.forEach((item) => {
        const key = normalizeCategoryKey(item.key);
        const name = String(item.name || '').trim();
        if (!key || !name) {
            return;
        }
        if (!isCategoryAllowed(name)) {
            return;
        }
        if ([
            'combos de temporada', 'combos de temporadas', 'combos temporada',
            'combos familiares', 'combo familiar',
            'combos perros', 'combos de perros', 'combos perros y express', 'combos de perros y express', 'combos express',
            'combos burger', 'combo burger', 'combos de burger'
        ].includes(key)) {
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

    // Excluir combos de temporada, familiares, perros, burger de los pinneados
    PINNED_CATEGORY_BUTTONS.forEach((item) => {
        const key = normalizeCategoryKey(item.key);
        if (!key) {
            return;
        }
        if ([
            'combos de temporada', 'combos de temporadas', 'combos temporada',
            'combos familiares', 'combo familiar',
            'combos perros', 'combos de perros', 'combos perros y express', 'combos de perros y express', 'combos express',
            'combos burger', 'combo burger', 'combos de burger'
        ].includes(key)) {
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

function getCategoryProducts(category, options = {}) {
    const includePaused = options.includePaused === true;
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
            if (!includePaused && product.estado === 'paused') {
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

function renderManualCategoryGallery(panel, categoryName, cards, visibleProducts, allProducts) {
    if (!panel || !categoryName || !Array.isArray(cards)) {
        return false;
    }

    const visibleLookup = new Map(
        (visibleProducts || [])
            .map((product) => [normalizeAssetLookup(product?.nombre || ''), product])
            .filter(([key]) => Boolean(key))
    );
    const visibleNames = new Set(
        (visibleProducts || [])
            .map((product) => normalizeAssetLookup(product?.nombre || ''))
            .filter(Boolean)
    );
    const filteredCards = cards
        .filter((card) => visibleNames.has(normalizeAssetLookup(card?.name || '')))
        .map((card) => {
            const matchedProduct = visibleLookup.get(normalizeAssetLookup(card?.name || ''));
            const matchedImage = matchedProduct?.image_url || card.image;
            return {
                ...card,
                image: matchedImage,
                orderImagePath: matchedImage,
                fallbackImage: card.image
            };
        });
    const hasCatalogProducts = Array.isArray(allProducts) && allProducts.length > 0;
    const staticNames = new Set(cards.map((card) => normalizeAssetLookup(card?.name || '')).filter(Boolean));
    const extraCards = (visibleProducts || [])
        .filter((product) => !staticNames.has(normalizeAssetLookup(product?.nombre || '')))
        .map((product) => ({
            name: product.nombre,
            image: product.image_url || 'logo.png',
            orderImagePath: product.image_url || 'logo.png',
            fallbackImage: 'logo.png'
        }));

    if (hasCatalogProducts && !(visibleProducts || []).length) {
        panel.innerHTML = '<p class="category-empty">No hay productos cargados en esta categoria.</p>';
        return true;
    }

    const finalCards = filteredCards.length || extraCards.length
        ? [...filteredCards, ...extraCards]
        : cards;

    panel.innerHTML = '';

    const gallery = document.createElement('div');
    gallery.className = 'bebidas-gallery-grid';
    gallery.style.display = 'grid';
    gallery.style.gridTemplateColumns = finalCards.length === 1 ? '1fr' : '1fr 1fr';
    gallery.style.gap = '15px';
    gallery.style.padding = '20px';

    if (finalCards.length === 1) {
        gallery.style.maxWidth = '420px';
        gallery.style.margin = '0 auto';
    }

    finalCards.forEach((card) => {
        const item = document.createElement('div');
        item.className = 'card-pequena';
        item.style.cursor = 'pointer';
        item.addEventListener('click', () => {
            abrirModalBebida(card.name, card.image, categoryName, { orderImagePath: card.orderImagePath || card.image });
        });

        const image = document.createElement('img');
        const fallbackImage = card.fallbackImage || card.image || 'logo.png';
        image.src = card.image || fallbackImage;
        image.alt = card.name;
        image.style.width = '100%';
        image.style.borderRadius = '8px';
        image.addEventListener('error', () => {
            if (image.getAttribute('src') === fallbackImage) {
                image.src = 'logo.png';
                return;
            }

            image.src = fallbackImage;
        });

        const label = document.createElement('p');
        label.textContent = card.name;
        label.style.textAlign = 'center';
        label.style.fontWeight = 'bold';
        label.style.marginTop = '5px';
        label.style.color = '#000';

        item.appendChild(image);
        item.appendChild(label);
        gallery.appendChild(item);
    });

    panel.appendChild(gallery);
    return true;
}

function renderCategoryExplorer(nextKey, options = {}) {
    const grid = document.getElementById('categoryGrid');
    const panel = document.getElementById('categoryProductsPanel');
    if (!grid || !panel) {
        return;
    }

    const categories = ensurePinnedExplorerCategories(ensureForcedExplorerCategories(getExplorerCategories()))
        .filter((category) => isCategoryAllowed(category.name || category.key));
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

        const label = document.createElement('span');
        label.className = 'category-chip-label';
        label.textContent = category.name;

        button.appendChild(label);
        button.addEventListener('click', () => {
            selectedCategoryKey = category.key;
            renderCategoryExplorer(category.key, { fromUserClick: true });
        });
        grid.appendChild(button);
    });

    const selectedCategory = categories.find((item) => item.key === selectedCategoryKey) || categories[0];
    const products = getCategoryProducts(selectedCategory);
    const allCategoryProducts = getCategoryProducts(selectedCategory, { includePaused: true });

    // --- INICIO LÓGICA MANUAL BEBIDAS Y ADICIONALES Y OTRAS ---
    if (selectedCategory.name) {
        const catNorm = selectedCategory.name.trim().toUpperCase();
        // BEBIDAS Y ADICIONALES
        if (catNorm.includes('BEBIDAS') || catNorm.includes('ADICIONALES')) {
            renderManualCategoryGallery(panel, selectedCategory.name, [
                { name: 'Adicionales', image: './bebidasyadicionales/adiciones.png' },
                { name: 'Bebidas', image: './bebidasyadicionales/bebidas.png' }
            ], products, allCategoryProducts);
            return;
        }
        // BURGER CLASICAS
        if (catNorm.includes('CLASICAS')) {
            renderManualCategoryGallery(panel, selectedCategory.name, [
                { name: 'Normal', image: './burgerclasicas/burgernormal.png' },
                { name: 'Super', image: './burgerclasicas/burgersuper.png' }
            ], products, allCategoryProducts);
            return;
        }
        // BURGER PREMIUM
        if (catNorm.includes('PREMIUM')) {
            renderManualCategoryGallery(panel, selectedCategory.name, [
                { name: 'Caracas', image: './burgerpremium/burgercaracas.png' },
                { name: 'Cordillera', image: './burgerpremium/burgercordillera.png' },
                { name: 'Papuda', image: './burgerpremium/burgerpapuda.png' },
                { name: 'Plus', image: './burgerpremium/burgerplus.png' },
                { name: 'Ranchera', image: './burgerpremium/burgerranchera.png' },
                { name: 'Triplete', image: './burgerpremium/burgertriplete.png' }
            ], products, allCategoryProducts);
            return;
        }
        // ENTRADAS
        if (catNorm.includes('ENTRADAS')) {
            renderManualCategoryGallery(panel, selectedCategory.name, [
                { name: 'Papas a la Francesa', image: './entradas/papas.png' },
                { name: 'Tequeños', image: './entradas/tequenos.png' }
            ], products, allCategoryProducts);
            return;
        }
        // PEPTIOS VENEZOLANOS
        if (catNorm.includes('PEPITOS')) {
            renderManualCategoryGallery(panel, selectedCategory.name, [
                { name: 'Mix', image: './pepitosvenezolanos/pepitomix.png' },
                { name: 'Plus', image: './pepitosvenezolanos/pepitoplus.png' },
                { name: 'Ranchero', image: './pepitosvenezolanos/pepitoranchero.png' },
                { name: 'Urbano', image: './pepitosvenezolanos/pepitourbano.png' }
            ], products, allCategoryProducts);
            return;
        }
        // SALCHIPAPAS
        if (catNorm.includes('SALCHIPAPA')) {
            renderManualCategoryGallery(panel, selectedCategory.name, [
                { name: 'Salchi Normal', image: './salchipapas/salchinormal.png' },
                { name: 'Salchi Super', image: './salchipapas/salchisuper.png' }
            ], products, allCategoryProducts);
            return;
        }
        // PERROS CALIENTES
        if (catNorm.includes('PERROS') && !catNorm.includes('SALCHIPAPA')) {
            renderManualCategoryGallery(panel, selectedCategory.name, [
                { name: 'Especial', image: './perroscalientes/perroespecial.png' },
                { name: 'Normal', image: './perroscalientes/perronormal.png' },
                { name: 'Super', image: './perroscalientes/perrosuper.png' }
            ], products, allCategoryProducts);
            return;
        }
        // COMBOS CON PAPAS Y BEBIDA
        if (catNorm.includes('COMBOS CON PAPAS Y BEBIDA')) {
            renderManualCategoryGallery(panel, selectedCategory.name, [
                { name: 'Combo Burger Normal', image: './combosconpapasybebidas/comboburgernormal.png' },
                { name: 'Combo Burger Papuda', image: './combosconpapasybebidas/comboburgerpapuda.png' },
                { name: 'Combo Burger Super', image: './combosconpapasybebidas/comboburgersuper.png' },
                { name: 'Combo Perro Normal', image: './combosconpapasybebidas/comboperronormal.png' }
            ], products, allCategoryProducts);
            return;
        }
        // COMBOS MIXTOS
        if (catNorm.includes('COMBOS MIXTOS')) {
            renderManualCategoryGallery(panel, selectedCategory.name, [
                { name: 'De La Casa', image: './combosmixtos/delacasa.png' },
                { name: 'Emparejados', image: './combosmixtos/emparejados.png' },
                { name: 'Familiar 3', image: './combosmixtos/familiar3.png' },
                { name: 'Familiar 4', image: './combosmixtos/familiar4.png' }
            ], products, allCategoryProducts);
            return;
        }
        // NUESTRAS SALSAS
        if (catNorm.includes('NUESTRAS SALSAS')) {
            renderManualCategoryGallery(panel, selectedCategory.name, [
                { name: 'Salsas de la Casa', image: './nuestrassalsas/salsasdelacasa.png' }
            ], products, allCategoryProducts);
            return;
        }
        // NO combos de temporada
        if (catNorm.includes('COMBOS DE TEMPORADA') || catNorm.includes('COMBOS DE TEMPORADAS') || catNorm.includes('COMBOS TEMPORADA')) {
            // No mostrar nada especial para combos de temporada
            panel.innerHTML = '';
            panel.insertAdjacentHTML('beforeend', '<p class="category-empty">No hay productos cargados en esta categoria.</p>');
            return;
        }
    }

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

    const categoryOrderBtn = document.createElement('a');
    const categoryOrderBtnId = `btn-category-head-${selectedCategory.key || 'general'}`;
    categoryOrderBtn.className = 'category-hero-order-btn';
    categoryOrderBtn.href = `${WHATSAPP_BASE_URL}?text=${encodeURIComponent(`Hola ROAL BURGER! Quiero hacer un pedido de la categoria ${selectedCategory.name}`)}`;
    categoryOrderBtn.target = '_blank';
    categoryOrderBtn.rel = 'noopener noreferrer';
    categoryOrderBtn.textContent = 'Hacer pedido';
    categoryOrderBtn.addEventListener('click', (event) => {
        if (!canPlaceOrdersNow()) {
            event.preventDefault();
            showOrderingClosedMessage();
            return;
        }

        trackButtonClick(categoryOrderBtnId, `Pedido categoria ${selectedCategory.name}`);
    });

    const heroHead = document.createElement('div');
    heroHead.className = 'category-hero-head';
    heroHead.appendChild(heroTitle);
    heroHead.appendChild(categoryOrderBtn);

    heroWrap.appendChild(heroImage);
    heroWrap.appendChild(heroHead);

    if (!products.length || shouldHideCategoryList(selectedCategory)) {
        panel.innerHTML = '';
        panel.appendChild(heroWrap);

        if (options.fromUserClick) {
            panel.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
            panel.classList.remove('focus-highlight');
            void panel.offsetWidth;
            panel.classList.add('focus-highlight');
        }

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

        const orderBtn = document.createElement('button');
        const btnId = `btn-category-${selectedCategory.key}-${index + 1}`;
        orderBtn.type = 'button';
        orderBtn.className = 'category-order-btn';
        orderBtn.textContent = 'Pedir';
        orderBtn.addEventListener('click', (event) => {
            event.preventDefault();
            startProductOrderFlow(product.nombre, selectedCategory.name, btnId);
        });

        row.appendChild(thumb);
        row.appendChild(info);
        row.appendChild(orderBtn);
        list.appendChild(row);
    });

    panel.innerHTML = '';
    panel.appendChild(heroWrap);
    panel.appendChild(list);
    syncOrderingAvailabilityUI();

    if (options.fromUserClick) {
        panel.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        panel.classList.remove('focus-highlight');
        void panel.offsetWidth;
        panel.classList.add('focus-highlight');
    }
}
// --- FUNCIÓN GLOBAL MODAL BEBIDAS ---
function abrirModalBebida(nombre, ruta, categoria, options = {}) {
    const prev = document.getElementById('bebidas-modal');
    if (prev) prev.remove();

    const modal = document.createElement('div');
    modal.id = 'bebidas-modal';
    modal.className = 'bebidas-modal-overlay';

    const card = document.createElement('div');
    card.className = 'bebidas-modal-card liquid-glass';

    const image = document.createElement('img');
    image.className = 'bebidas-modal-image';
    image.src = ruta;
    image.alt = nombre;

    const title = document.createElement('div');
    title.className = 'bebidas-modal-title';
    title.textContent = nombre;

    const actions = document.createElement('div');
    actions.className = 'bebidas-modal-actions';

    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'bebidas-modal-btn bebidas-modal-btn-secondary';
    closeButton.textContent = 'Regresar';
    closeButton.addEventListener('click', () => {
        modal.remove();
    });

    const orderButton = document.createElement('button');
    const safeCategory = categoria || getSelectedCategoryName();
    const normalizedName = normalizeCategoryKey(nombre);
    const normalizedCategory = normalizeCategoryKey(safeCategory);
    const buttonId = `btn-modal-${normalizeAssetLookup(safeCategory)}-${normalizeAssetLookup(nombre)}`;
    orderButton.type = 'button';
    orderButton.className = 'bebidas-modal-btn bebidas-modal-btn-primary';
    orderButton.textContent = normalizedCategory.includes('combos mixtos') || normalizedCategory.includes('combos con papas y bebida')
        ? 'Seleccionar combo'
        : normalizedName.includes('adicion')
        ? 'Seleccionar adicion'
        : normalizedName.includes('bebida')
            ? 'Seleccionar bebida'
            : 'Pedir este producto';
    orderButton.addEventListener('click', () => {
        modal.remove();
        startProductOrderFlow(nombre, safeCategory, buttonId, { imagePath: options.orderImagePath || ruta });
    });

    actions.appendChild(closeButton);
    actions.appendChild(orderButton);

    card.appendChild(image);
    card.appendChild(title);
    card.appendChild(actions);
    modal.appendChild(card);

    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.remove();
        }
    });

    document.body.appendChild(modal);
}

function focusMenuSection(targetSection, targetId) {
    if (!targetSection) {
        return;
    }

    const sectionName = targetSection.dataset.sectionName || targetSection.querySelector('.menu-section-title')?.textContent?.trim() || 'PORTADA';
    updateDynamicWhatsAppLink(sectionName);
    setActiveMenuNavLink(targetId);

    targetSection.classList.remove('focus-highlight');
    void targetSection.offsetWidth;
    targetSection.classList.add('focus-highlight');
    targetSection.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
}

function ensureBrandBanner() {
    // Eliminado: No generar banner dinámico, solo usar el estático en el HTML
    return null;
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
    const carousel = document.getElementById('featured-carousel-dynamic');
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
        updatePromoModalContent();
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
        updatePromoModalContent();
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

    floatingButton.setAttribute('data-section-name', activeMenuSection);
    floatingButton.setAttribute('aria-label', `Ayuda e informacion sobre ${activeMenuSection}`);
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

            link.classList.remove('click-feedback');
            void link.offsetWidth;
            link.classList.add('click-feedback');
            closeDrawerMenu();
            focusMenuSection(targetSection, targetId);
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
        floatingButton.addEventListener('click', (event) => {
            event.preventDefault();
            updateDynamicWhatsAppLink();
            trackButtonClick('btn-whatsapp-flotante', `Ayuda e informacion - ${activeMenuSection}`);
            openSupportModal();
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
        window.open(config.link, '_blank', 'noopener,noreferrer');
    }
}

function openMenuModal() {
    const modal = document.getElementById('menuModal');
    if (!modal) {
        return;
    }

    modal.style.display = 'block';
    syncBodyScrollLock();
    updateDynamicWhatsAppLink(activeMenuSection);
}

function closeMenuModal() {
    const modal = document.getElementById('menuModal');
    if (!modal) {
        return;
    }

    modal.style.display = 'none';
    closeDrawerMenu();
    syncBodyScrollLock();
}



// ===== MODAL DE RECOMENDADO =====
const PROMO_DAY_NAME = 'Recomendado del dia';
let currentRecommendedProduct = null;

function getCurrentBogotaDateParts(now = new Date()) {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: ORDERING_SCHEDULE.timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).formatToParts(now);

    return {
        year: Number(parts.find((part) => part.type === 'year')?.value || 0),
        month: Number(parts.find((part) => part.type === 'month')?.value || 1),
        day: Number(parts.find((part) => part.type === 'day')?.value || 1)
    };
}

function isExcludedRecommendedCategory(categoryName) {
    const normalizedCategory = normalizeCategoryKey(categoryName);
    if (normalizedCategory.includes('combo')) {
        return true;
    }
    return RECOMMENDED_DAY_EXCLUDED_CATEGORY_PARTS.some((part) => normalizedCategory.includes(part));
}

function getRecommendedFallbackProduct() {
    return {
        nombre: RECOMMENDED_DAY_FALLBACK_PRODUCT.nombre,
        categoria: RECOMMENDED_DAY_FALLBACK_PRODUCT.categoria,
        image_url: normalizeImageAssetPath(RECOMMENDED_DAY_FALLBACK_PRODUCT.image_url),
        estado: 'active'
    };
}

function getEligibleRecommendedProducts() {
    const eligibleProducts = latestProducts
        .map((product) => {
            const nombre = String(product.nombre || product.name || '').trim();
            const categoria = String(product.categoria || product.category || '').trim();
            const estado = String(product.estado || (product.paused ? 'paused' : 'active')).toLowerCase();
            return {
                nombre,
                categoria,
                estado,
                image_url: normalizeImageAssetPath(resolveProductImage(product))
            };
        })
        .filter((product) => {
            if (!product.nombre || !product.categoria) {
                return false;
            }

            if (product.estado === 'paused') {
                return false;
            }

            if (shouldHideProductByName(product.nombre)) {
                return false;
            }

            if (isExcludedRecommendedCategory(product.categoria)) {
                return false;
            }

            if (!isCategoryAllowed(product.categoria)) {
                return false;
            }

            return Boolean(product.image_url);
        })

    const uniqueEligibleProducts = [];
    const seenRecommendedProducts = new Set();

    eligibleProducts.forEach((product) => {
        const signature = getRecommendedProductSignature(product);
        if (!signature || seenRecommendedProducts.has(signature)) {
            return;
        }

        seenRecommendedProducts.add(signature);
        uniqueEligibleProducts.push(product);
    });

    uniqueEligibleProducts.sort((a, b) => `${a.categoria} ${a.nombre}`.localeCompare(`${b.categoria} ${b.nombre}`, 'es'));

    return uniqueEligibleProducts.length ? uniqueEligibleProducts : [getRecommendedFallbackProduct()];
}

function getRecommendedProductSignature(product) {
    return `${normalizeCategoryKey(product?.categoria || '')}::${normalizeCategoryKey(product?.nombre || '')}`;
}

function createSeededRandom(seed) {
    let value = Math.abs(Number(seed || 1)) % 2147483647;
    if (!value) {
        value = 1;
    }

    return () => {
        value = (value * 48271) % 2147483647;
        return (value - 1) / 2147483646;
    };
}

function buildRecommendedCycleOrder(products, cycleIndex) {
    const orderedProducts = products.slice();
    const random = createSeededRandom((products.length * 97) + cycleIndex + 1);

    for (let index = orderedProducts.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(random() * (index + 1));
        const current = orderedProducts[index];
        orderedProducts[index] = orderedProducts[swapIndex];
        orderedProducts[swapIndex] = current;
    }

    if (cycleIndex > 0 && orderedProducts.length > 1) {
        const previousOrder = buildRecommendedCycleOrder(products, cycleIndex - 1);
        const previousLastSignature = getRecommendedProductSignature(previousOrder[previousOrder.length - 1]);
        const currentFirstSignature = getRecommendedProductSignature(orderedProducts[0]);

        if (previousLastSignature === currentFirstSignature) {
            const current = orderedProducts[0];
            orderedProducts[0] = orderedProducts[1];
            orderedProducts[1] = current;
        }
    }

    return orderedProducts;
}

function getRecommendedProductOfDay(now = new Date()) {
    const eligibleProducts = getEligibleRecommendedProducts();
    if (eligibleProducts.length === 1) {
        return eligibleProducts[0];
    }

    const { year, month, day } = getCurrentBogotaDateParts(now);
    const daySerial = Math.floor(Date.UTC(year, month - 1, day) / 86400000);
    const cycleLength = eligibleProducts.length;
    const cycleIndex = Math.floor(daySerial / cycleLength);
    const dayOffset = daySerial % cycleLength;
    const cycleOrder = buildRecommendedCycleOrder(eligibleProducts, cycleIndex);
    return cycleOrder[dayOffset];
}

function updatePromoModalContent() {
    const recommendedProduct = getRecommendedProductOfDay();
    currentRecommendedProduct = recommendedProduct;

    const modal = document.getElementById('promoModal');
    const image = document.getElementById('promoModalImage');
    const kicker = document.getElementById('promoModalKicker');
    const title = document.getElementById('promoModalTitle');
    const text = document.getElementById('promoModalText');
    const orderButton = document.getElementById('promoOrderButton');

    if (modal) {
        modal.setAttribute('aria-label', `${PROMO_DAY_NAME}: ${recommendedProduct.nombre}`);
    }

    if (image) {
        image.src = recommendedProduct.image_url || 'logo.png';
        image.alt = `Recomendado del dia: ${recommendedProduct.nombre}`;
    }

    if (kicker) {
        kicker.textContent = PROMO_DAY_NAME;
    }

    if (title) {
        title.textContent = recommendedProduct.nombre;
    }

    if (text) {
        const basePrice = resolveCartUnitPrice(recommendedProduct.nombre, recommendedProduct.categoria, {
            type: 'solo',
            imagePath: recommendedProduct.image_url
        });
        const discountPrice = resolveCartUnitPrice(recommendedProduct.nombre, recommendedProduct.categoria, {
            type: 'solo',
            imagePath: recommendedProduct.image_url,
            recommendedDiscount: true,
            discountRate: RECOMMENDED_DAY_DISCOUNT_RATE
        });
        text.textContent = `Hoy te recomendamos ${recommendedProduct.nombre} de la categoria ${recommendedProduct.categoria}. Tiene 20% de descuento: antes ${formatCurrency(basePrice)} y hoy ${formatCurrency(discountPrice)}.`;
    }

    if (orderButton) {
        orderButton.textContent = `Pedir ${recommendedProduct.nombre} con 20% OFF`;
    }
}

function initPromoModal() {
    if (IS_ADMIN_PREVIEW) {
        return;
    }

    setTimeout(function () {
        var modal = document.getElementById('promoModal');
        if (modal) {
            updatePromoModalContent();
            modal.classList.add('is-open');
            syncBodyScrollLock();
        }
    }, 2000);
}

function orderDailyRecommendation() {
    if (!canPlaceOrdersNow()) {
        showOrderingClosedMessage();
        return;
    }

    const recommendedProduct = currentRecommendedProduct || getRecommendedProductOfDay();
    trackButtonClick('btn-promo-dia-order', `${PROMO_DAY_NAME} - ${recommendedProduct.nombre}`);
    closePromoModal();
    addItemToCart(recommendedProduct.nombre, recommendedProduct.categoria, {
        type: 'solo',
        imagePath: recommendedProduct.image_url,
        recommendedDiscount: true,
        discountRate: RECOMMENDED_DAY_DISCOUNT_RATE
    }, 'btn-promo-dia-order');
}

function closePromoModal() {
    var modal = document.getElementById('promoModal');
    if (modal) {
        modal.classList.remove('is-open');
        syncBodyScrollLock();
    }
}
window.onclick = function(event) {
    const menuModal = document.getElementById('menuModal');
    if (event.target === menuModal) {
        closeMenuModal();
    }
    const promoModal = document.getElementById('promoModal');
    if (event.target === promoModal) {
        closePromoModal();
    }
};

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        closeMenuModal();
        closePromoModal();
        closeSupportModal();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    initCartUI();
    initSupportModal();
    initPromoModal();
    setupMenuNavigation();
    updateDynamicWhatsAppLink(activeMenuSection);
    syncOrderingAvailabilityUI();
    window.setInterval(syncOrderingAvailabilityUI, 60000);
    // Carrusel de destacados: fallback local inmediato, luego Firestore si responde
    const featuredCarousel = document.getElementById('featured-carousel-dynamic');
    // Array local con rutas en la raíz del proyecto
    const localFeatured = [
        { nombre: 'Combo Burger Normal', image_url: 'losmaspedidos/comboburgernormal.png', categoria: 'COMBOS CON PAPAS Y BEBIDA' },
        { nombre: 'Combo Burger Papuda', image_url: 'losmaspedidos/comboburgerpapuda.png', categoria: 'COMBOS CON PAPAS Y BEBIDA' },
        { nombre: 'Combo Burger Super', image_url: 'losmaspedidos/comboburgersuper.png', categoria: 'COMBOS CON PAPAS Y BEBIDA' },
        { nombre: 'Combo Perro Normal', image_url: 'losmaspedidos/comboperronormal.png', categoria: 'COMBOS CON PAPAS Y BEBIDA' },
        { nombre: 'De La Casa', image_url: 'losmaspedidos/combodelacasa.png', categoria: 'COMBOS MIXTOS' },
        { nombre: 'Emparejados', image_url: 'losmaspedidos/comboemparejados.png', categoria: 'COMBOS MIXTOS' },
        { nombre: 'Familiar 3', image_url: 'losmaspedidos/combofamiliar3.png', categoria: 'COMBOS MIXTOS' },
        { nombre: 'Familiar 4', image_url: 'losmaspedidos/combofamiliar4.png', categoria: 'COMBOS MIXTOS' }
    ];
    if (featuredCarousel) {
        renderFeaturedCards(featuredCarousel, localFeatured);
        // Este carrusel se controla con la galeria local de /losmaspedidos
        // para evitar que destacados antiguos de Firestore sobrescriban imagenes rotas.
    }

    applyBrandingConfig(DEFAULT_BRANDING);
    buttonConfigsMap = new Map(
        Object.values(DEFAULT_PUBLIC_BUTTONS).map((button) => [button.id, { ...button }])
    );
    renderPublicFeaturedFromAdmin();
    renderConfiguredButtons();
    renderCategoryExplorer();
});
