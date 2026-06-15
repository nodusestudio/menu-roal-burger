// Tracking functions moved to tracking.js

const WHATSAPP_BASE_URL = 'https://wa.me/573144689509';
const ORDERS_COLLECTION = 'pedidos';
const CLIENTS_COLLECTION = 'clientes';
const CUSTOMER_CONSENT_VERSION = '2026-06-05';
const CUSTOMER_CONSENT_COPY = 'He leido y acepto que ROAL BURGER use mis datos para gestionar mi cuenta, atender pedidos, contactarme por canales oficiales y enviarme promociones, novedades y publicidad propia.';
const CUSTOMER_CONSENT_POLICY_URL = 'politica-datos.html';
const MESSAGES_COLLECTION = 'mensajes';
const ORDER_SEQUENCE_DOC_ID = '_meta_order_sequence';
const ORDER_CODE_PREFIX = 'RB';
const ORDER_CODE_START = 2026;
const DELIVERY_FEE_AMOUNT = 6000;
const MAX_CUSTOMER_SAVED_ADDRESSES = 5;
const CUSTOMER_PROFILE_STORAGE_KEY = 'roalburger-customer-profile-v1';
const ALLOW_ORDERS_OUTSIDE_SCHEDULE_FOR_TESTS = false;
const TEMP_CLOSURE_ACTIVE = false;
const TEMP_CLOSURE_MESSAGE = 'Estamos cerrados momentáneamente por adecuaciones en el local. ¡Pronto volvemos con todo!';
const PAGE_URL_PARAMS = new URLSearchParams(window.location.search);
const IS_ADMIN_PREVIEW = PAGE_URL_PARAMS.get('adminPreview') === '1';
let ORDERING_SCHEDULE = {
    timeZone: 'America/Bogota',
    startMinutes: 16 * 60,
    endMinutes: 22 * 60,
    label: 'Lunes a Domingo: 4:00 P.M. a 10:00 P.M.',
    openMessage: 'Abierto ahora. Ya puedes hacer tu pedido.',
    closedMessage: 'Disculpa, en este momento estamos cerrados. Nuestro horario de pedidos es de 4:00 P.M. a 10:00 P.M.'
};
const ORDER_SENT_CONFIRMATION_MESSAGE = 'Tu pedido ha sido enviado exitosamente al restaurante. En un momento recibiras la confirmacion con tiempo aproximado de entrega.';
const TRANSFER_PAYMENT_CONFIRMATION_MESSAGE = 'En un momento uno de nuestros asesores se comunicara contigo por WhatsApp para pasarte la informacion de la cuenta.';
const CASH_PAYMENT_CONFIRMATION_MESSAGE = 'Tu pedido ya fue enviado al restaurante, manejamos un tiempo de entrega de 50 min aproximadamente, uno de nuestros asesores se comunicara contigo a la brevedad posible para confirmar el pedido.';
const DELIVERY_CENTER_COORDINATES = [4.5419, -75.6835];
const DELIVERY_GEOFENCE_ZONES = [
    {
        name: 'amarilla',
        fee: 5000,
        color: '#f6d743',
        label: '🟡 Zona Amarilla',
        polygon: [
            [4.5443, -75.6838],
            [4.5435, -75.6821],
            [4.5424, -75.6821],
            [4.5421, -75.6808],
            [4.5423, -75.6798],
            [4.5416, -75.6790],
            [4.5411, -75.6797],
            [4.5410, -75.6824],
            [4.5404, -75.6830],
            [4.5405, -75.6841],
            [4.5409, -75.6852],
            [4.5410, -75.6858],
            [4.5423, -75.6858],
            [4.5425, -75.6861],
            [4.5423, -75.6868],
            [4.5429, -75.6879],
            [4.5443, -75.6879],
            [4.5448, -75.6867]
        ]
    },
    {
        name: 'azul',
        fee: 6000,
        color: '#4aa1ff',
        label: '🔵 Zona Azul',
        polygon: [
            [4.5544, -75.6831],
            [4.5538, -75.6716],
            [4.5526, -75.6671],
            [4.5509, -75.6652],
            [4.5502, -75.6669],
            [4.5467, -75.6667],
            [4.5456, -75.6620],
            [4.5476, -75.6576],
            [4.5376, -75.6635],
            [4.5254, -75.6777],
            [4.5268, -75.6800],
            [4.5243, -75.6828],
            [4.5213, -75.6836],
            [4.5216, -75.6857],
            [4.5200, -75.6873],
            [4.5194, -75.6881],
            [4.5175, -75.6900],
            [4.5179, -75.6911],
            [4.5199, -75.6917],
            [4.5198, -75.6944],
            [4.5192, -75.6957],
            [4.5199, -75.6966],
            [4.5192, -75.6981],
            [4.5190, -75.7007],
            [4.5214, -75.7007],
            [4.5228, -75.6986],
            [4.5259, -75.6981],
            [4.5283, -75.7000],
            [4.5302, -75.7030],
            [4.5324, -75.7026],
            [4.5330, -75.7064],
            [4.5335, -75.7086],
            [4.5348, -75.7100],
            [4.5386, -75.7094],
            [4.5407, -75.7086],
            [4.5436, -75.7093],
            [4.5446, -75.6951],
            [4.5482, -75.6883]
        ]
    },
    {
        name: 'roja',
        fee: 7000,
        color: '#d32f2f',
        label: '🔴 Zona Roja',
        polygon: [
            [4.5568, -75.6839],
            [4.5558, -75.6741],
            [4.5606, -75.6667],
            [4.5614, -75.6603],
            [4.5687, -75.6552],
            [4.5712, -75.6517],
            [4.5730, -75.6494],
            [4.5754, -75.6476],
            [4.5767, -75.6501],
            [4.5798, -75.6497],
            [4.5762, -75.6365],
            [4.5699, -75.6401],
            [4.5678, -75.6412],
            [4.5647, -75.6421],
            [4.5632, -75.6429],
            [4.5584, -75.6452],
            [4.5553, -75.6482],
            [4.5498, -75.6499],
            [4.5443, -75.6534],
            [4.5388, -75.6586],
            [4.5346, -75.6614],
            [4.5304, -75.6656],
            [4.5279, -75.6670],
            [4.5283, -75.6706],
            [4.5301, -75.6704],
            [4.5282, -75.6728],
            [4.5262, -75.6748],
            [4.5249, -75.6767],
            [4.5254, -75.6787],
            [4.5247, -75.6810],
            [4.5232, -75.6826],
            [4.5207, -75.6825],
            [4.5203, -75.6842],
            [4.5203, -75.6858],
            [4.5173, -75.6878],
            [4.5132, -75.6864],
            [4.5108, -75.6873],
            [4.5069, -75.6887],
            [4.5052, -75.6900],
            [4.5045, -75.6915],
            [4.5024, -75.6929],
            [4.5024, -75.6940],
            [4.5024, -75.6955],
            [4.5023, -75.6959],
            [4.5020, -75.6972],
            [4.4994, -75.6988],
            [4.5001, -75.6997],
            [4.5034, -75.6990],
            [4.5038, -75.7008],
            [4.5050, -75.7014],
            [4.5050, -75.7014],
            [4.5056, -75.7017],
            [4.5067, -75.6983],
            [4.5088, -75.6981],
            [4.5103, -75.6960],
            [4.5109, -75.6998],
            [4.5095, -75.7020],
            [4.5093, -75.7038],
            [4.5097, -75.7042],
            [4.5097, -75.7052],
            [4.5094, -75.7055],
            [4.5113, -75.7025],
            [4.5120, -75.7044],
            [4.5128, -75.7087],
            [4.5132, -75.7115],
            [4.5134, -75.7131],
            [4.5117, -75.7137],
            [4.5112, -75.7164],
            [4.5136, -75.7173],
            [4.5122, -75.7193],
            [4.5137, -75.7216],
            [4.5244, -75.7190],
            [4.5260, -75.7171],
            [4.5285, -75.7168],
            [4.5290, -75.7182],
            [4.5317, -75.7178],
            [4.5338, -75.7177],
            [4.5350, -75.7165],
            [4.5380, -75.7119],
            [4.5485, -75.7106]
        ]
    },
    {
        name: 'negra',
        fee: 8000,
        color: '#bbbbbb',
        label: '⬛ Zona Negra',
        polygon: [
            [4.5638, -75.6656],
            [4.5739, -75.6533],
            [4.5828, -75.6527],
            [4.5856, -75.6440],
            [4.5815, -75.6299],
            [4.5504, -75.6464],
            [4.5352, -75.6566],
            [4.5268, -75.6672],
            [4.5226, -75.6758],
            [4.5104, -75.6851],
            [4.5021, -75.6890],
            [4.4966, -75.6922],
            [4.4982, -75.6949],
            [4.4944, -75.7042],
            [4.5038, -75.7072],
            [4.5043, -75.7135],
            [4.5090, -75.7124],
            [4.5090, -75.7187],
            [4.5129, -75.7232],
            [4.5134, -75.7282],
            [4.5144, -75.7286],
            [4.5163, -75.7282],
            [4.5172, -75.7250],
            [4.5182, -75.7217],
            [4.5250, -75.7219],
            [4.5309, -75.7211],
            [4.5381, -75.7156],
            [4.5491, -75.7142]
        ]
    }
];
// Rastrear origen del clic para evitar cierre de modales al arrastrar el mouse fuera
let _lastMousedownTarget = null;
document.addEventListener('mousedown', (e) => { _lastMousedownTarget = e.target; }, true);

let checkoutDeliveryZone = null;
let checkoutDeliveryFeeAmount = 0;
let checkoutDeliveryLocation = null;
let checkoutDeliveryLocationConfirmed = false;
let checkoutDeliveryFeePending = false;
let activeMenuSection = 'PORTADA';
let featuredProductsUnsubscribe = null;
let categoriesUnsubscribe = null;
let buttonsUnsubscribe = null;
let brandingUnsubscribe = null;
let recomendadoOverrideUnsubscribe = null;
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
let publicFirebaseDbInstance = null;
let orderSentConfirmationUI = null;
let publicUpgradesConfig = null;
let _publicUpgradePending = null;
let paymentFlowUI = null;
let _customerPaymentMethods = null;
let _latestBebidas = [];

// ── Historial para botón atrás de Android ──
let _modalHistoryDepth = 0;
let _skipNextPopstate  = false;
let _closingByBackBtn  = false;

// ── Gestión centralizada de pantallas secundarias ──
const _SECONDARY_SCREENS = ['searchScreen', 'navCategoriesScreen', 'promoScreen', 'categoryDetailScreen', 'perfilScreen', 'ayudaScreen'];
let _screenHistoryPushed = false;

function _pushModalState() {
    _modalHistoryDepth++;
    history.pushState({ roalModal: _modalHistoryDepth }, '');
}

function _popModalState() {
    if (_modalHistoryDepth > 0) {
        _modalHistoryDepth--;
        _skipNextPopstate = true;
        history.back();
    }
}
let activeCustomerProfile = null;
let customerAuthUI = null;
let customerRegisterUI = null;
let customerConsentDocumentUI = null;
let customerDeleteAccountUI = null;
let customerPasswordResetUI = null;
let customerOrdersUnsubscribe = null;
let customerMessagesUnsubscribe = null;
let customerProfileOrdersState = [];
let customerProfileMessagesState = [];

function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function normalizePhoneDigits(value) {
    return String(value || '').replace(/\D+/g, '');
}

function normalizeCustomerPin(value) {
    return String(value || '').replace(/\D+/g, '').slice(0, 6);
}

function normalizeCustomerSavedAddresses(rawAddresses = [], primaryAddress = '') {
    const normalizedAddresses = [];
    const seen = new Set();
    let primaryFound = false;

    const appendAddressEntry = (entry) => {
        const safeAddress = String(entry?.address || entry?.value || entry?.label || entry || '').trim();
        const normalizedKey = safeAddress.toLowerCase();
        if (!safeAddress || seen.has(normalizedKey)) {
            return;
        }

        seen.add(normalizedKey);
        const latitude = Number.isFinite(Number(entry?.latitude)) ? Number(entry.latitude) : null;
        const longitude = Number.isFinite(Number(entry?.longitude)) ? Number(entry.longitude) : null;
        const primary = Boolean(entry?.primary);

        if (primary) {
            primaryFound = true;
        }

        normalizedAddresses.push({
            address: safeAddress,
            latitude,
            longitude,
            primary
        });
    };

    if (primaryAddress) {
        appendAddressEntry({ address: primaryAddress, primary: true });
    }

    if (Array.isArray(rawAddresses)) {
        rawAddresses.forEach((entry) => appendAddressEntry(entry));
    }

    if (!primaryFound && normalizedAddresses.length > 0) {
        normalizedAddresses[0].primary = true;
    }

    return normalizedAddresses.slice(0, MAX_CUSTOMER_SAVED_ADDRESSES);
}

function getCustomerPrimarySavedAddress(profile = {}) {
    const addresses = getCustomerSavedAddresses(profile);
    return addresses.find((entry) => entry.primary) || addresses[0] || null;
}

function appendCustomerSavedAddress(rawAddresses = [], newAddress = '') {
    const addresses = normalizeCustomerSavedAddresses(rawAddresses);
    const newEntry = typeof newAddress === 'string'
        ? { address: String(newAddress || '').trim(), latitude: null, longitude: null, primary: false }
        : { address: String(newAddress?.address || newAddress?.value || newAddress?.label || '').trim(), latitude: Number.isFinite(Number(newAddress?.latitude)) ? Number(newAddress.latitude) : null, longitude: Number.isFinite(Number(newAddress?.longitude)) ? Number(newAddress.longitude) : null, primary: Boolean(newAddress?.primary) };

    if (!newEntry.address) {
        return addresses;
    }

    return normalizeCustomerSavedAddresses([...addresses, newEntry], addresses[0]?.address || newEntry.address);
}

function parseCustomerSavedAddressesInput(rawValue = '', primaryAddress = '') {
    const lines = String(rawValue || '')
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

    return normalizeCustomerSavedAddresses(lines, primaryAddress);
}

function getCustomerSavedAddresses(profile = {}) {
    return normalizeCustomerSavedAddresses(profile?.savedAddresses || profile?.addresses || [], profile?.address || profile?.deliveryAddress || '');
}

function getCustomerSavedAddressLabel(savedAddressEntry) {
    if (!savedAddressEntry) {
        return '';
    }
    return String(savedAddressEntry.address || savedAddressEntry || '').trim();
}

function getSelectedCheckoutSavedAddress() {
    if (!checkoutInfoUI || !Array.isArray(checkoutInfoUI.savedAddresses)) {
        return null;
    }

    const selectedOption = String(checkoutInfoUI.savedAddressChoice?.value || '').trim();
    if (!selectedOption.startsWith('saved:')) {
        return null;
    }

    const selectedIndex = Number(selectedOption.split(':')[1]);
    if (!Number.isFinite(selectedIndex) || selectedIndex < 0 || selectedIndex >= checkoutInfoUI.savedAddresses.length) {
        return null;
    }

    return checkoutInfoUI.savedAddresses[selectedIndex] || null;
}

function isValidCustomerPin(value) {
    return /^\d{6}$/.test(String(value || ''));
}

async function hashCustomerPin(pinValue) {
    const pin = normalizeCustomerPin(pinValue);
    if (!isValidCustomerPin(pin)) {
        throw new Error('La contrasena debe tener exactamente 6 digitos.');
    }

    if (!window.crypto?.subtle || typeof TextEncoder === 'undefined') {
        throw new Error('Tu navegador no permite validar la contrasena.');
    }

    const encoded = new TextEncoder().encode(`roalburger:${pin}`);
    const digest = await window.crypto.subtle.digest('SHA-256', encoded);
    return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function normalizeCustomerProfile(raw = {}, fallbackId = '') {
    const customerPhone = String(raw.customerPhone || raw.phone || '').trim();
    const customerPhoneDigits = normalizePhoneDigits(raw.customerPhoneDigits || customerPhone);
    const savedAddresses = getCustomerSavedAddresses(raw);
    const address = String(savedAddresses[0]?.address || raw.address || raw.deliveryAddress || '').trim();
    const customerName = String(raw.customerName || raw.name || '').trim();

    if (!customerPhoneDigits) {
        return null;
    }

    return {
        id: String(raw.id || fallbackId || `phone_${customerPhoneDigits}`).trim(),
        customerName,
        customerPhone,
        customerPhoneDigits,
        address,
        savedAddresses,
        passwordHash: String(raw.passwordHash || '').trim(),
        hasPassword: Boolean(raw.passwordHash),
        privacyConsentAccepted: Boolean(raw.privacyConsentAccepted),
        marketingConsentAccepted: Boolean(raw.marketingConsentAccepted),
        consentAcceptedAt: raw.consentAcceptedAt || null,
        consentVersion: String(raw.consentVersion || '').trim(),
        totalOrders: Number(raw.totalOrders || 0),
        totalSpent: Number(raw.totalSpent || 0),
        lastOrderCode: String(raw.lastOrderCode || '').trim(),
        lastOrderId: String(raw.lastOrderId || '').trim(),
        lastOrderTotal: Number(raw.lastOrderTotal || 0)
    };
}

function loadStoredCustomerProfile() {
    try {
        const raw = window.localStorage.getItem(CUSTOMER_PROFILE_STORAGE_KEY);
        if (!raw) {
            return null;
        }

        return normalizeCustomerProfile(JSON.parse(raw));
    } catch (error) {
        return null;
    }
}

function persistCustomerProfile(profile) {
    if (!profile) {
        window.localStorage.removeItem(CUSTOMER_PROFILE_STORAGE_KEY);
        return;
    }

    window.localStorage.setItem(CUSTOMER_PROFILE_STORAGE_KEY, JSON.stringify(profile));
}

function updateCustomerSessionUI() {
    const button = document.getElementById('customerSessionButton');
    const kicker = document.getElementById('customerSessionKicker');
    const label = document.getElementById('customerSessionLabel');
    const guestRegisterBanner = document.getElementById('guestRegisterBanner');
    const bottomAuthNav = document.getElementById('bottomAuthNav');

    if (!(button instanceof HTMLButtonElement) || !kicker || !label) {
        return;
    }

    if (activeCustomerProfile) {
        const firstName = String(activeCustomerProfile.customerName || 'Mi perfil').trim().split(/\s+/)[0] || 'Mi perfil';
        button.classList.add('is-authenticated');
        kicker.textContent = 'Perfil abierto';
        label.textContent = firstName;
        if (guestRegisterBanner instanceof HTMLElement) {
            guestRegisterBanner.hidden = true;
        }
        document.body.classList.remove('has-guest-register-banner');
        document.body.classList.add('has-auth-nav');
    } else {
        button.classList.remove('is-authenticated');
        kicker.textContent = 'Mi cuenta';
        label.textContent = 'Iniciar sesion';
        if (guestRegisterBanner instanceof HTMLElement) {
            guestRegisterBanner.hidden = false;
        }
        document.body.classList.add('has-guest-register-banner');
        document.body.classList.remove('has-auth-nav');
    }
}

function getDynamicGreeting() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return '¡Buenos días';
    if (hour >= 12 && hour < 18) return '¡Buenas tardes';
    return '¡Buenas noches';
}

function showWelcomeGreeting(profile) {
    if (!profile?.customerName) return;

    const firstName = profile.customerName.split(/\s+/)[0] || '';
    if (!firstName) return;

    const greeting = getDynamicGreeting();
    const emojis = ['🎉', '🔥', '👋', '✨', '🎊'];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];

    const toast = document.createElement('div');
    toast.id = 'welcomeGreetingToast';
    toast.style.cssText = `
        position: fixed;
        top: 18px;
        left: 50%;
        transform: translateX(-50%) translateY(-130%);
        z-index: 999999;
        background: linear-gradient(135deg, #ff7a00, #ff5a00);
        color: #fff7ef;
        padding: 13px 24px;
        border-radius: 40px;
        font-family: 'Oswald', sans-serif;
        font-size: 1rem;
        line-height: 1.4;
        box-shadow: 0 8px 28px rgba(255, 90, 0, 0.4), 0 0 0 1px rgba(255,255,255,0.15);
        text-align: center;
        width: min(90vw, 400px);
        opacity: 0;
        transition: opacity 0.28s ease, transform 0.32s cubic-bezier(0.34, 1.3, 0.64, 1);
        pointer-events: none;
        user-select: none;
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
    `;
    toast.innerHTML = `${randomEmoji} ${greeting}, <strong>${firstName}</strong>! Bienvenido a ROAL BURGER ${randomEmoji}`;

    document.body.appendChild(toast);

    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(-50%) translateY(0)';
    });

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(-130%)';
        setTimeout(() => toast.remove(), 400);
    }, 4000);
}

function setActiveCustomerProfile(profile) {
    activeCustomerProfile = profile ? normalizeCustomerProfile(profile) : null;
    persistCustomerProfile(activeCustomerProfile);
    if (activeCustomerProfile) {
        _chatFabSeenCount = _loadChatSeenCount();
    }
    updateCustomerSessionUI();
    syncCustomerProfileRealtimeStreams();
    renderCustomerOrdersPanel();
    renderCustomerMessagesPanel();
    updatePublicChatFab();
    if (activeCustomerProfile) {
        showWelcomeGreeting(activeCustomerProfile);
    }
}

function clearActiveCustomerProfile() {
    activeCustomerProfile = null;
    _chatFabSeenCount = 0;
    try { localStorage.removeItem(CHAT_SEEN_STORAGE_KEY); } catch {}
    persistCustomerProfile(null);
    updateCustomerSessionUI();
    syncCustomerProfileRealtimeStreams();
    customerProfileOrdersState = [];
    customerProfileMessagesState = [];
    renderCustomerOrdersPanel();
    updatePublicChatFab();
    renderCustomerMessagesPanel();
}

function getTimestampMillis(value) {
    if (value && typeof value.toMillis === 'function') {
        return value.toMillis();
    }
    if (value instanceof Date) {
        return value.getTime();
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }

    const parsed = Date.parse(String(value || ''));
    return Number.isFinite(parsed) ? parsed : 0;
}

function formatProfileDateTime(value) {
    const millis = getTimestampMillis(value);
    if (!millis) {
        return 'Sin fecha';
    }

    return new Intl.DateTimeFormat('es-CO', {
        dateStyle: 'medium',
        timeStyle: 'short'
    }).format(new Date(millis));
}

function getPublicOrderStatusMeta(status = '', fulfillmentType = '') {
    const normalized = String(status || '').trim().toLowerCase();
    switch (normalized) {
        case 'pendiente':
            return { label: 'Pedido recibido', detail: 'Tu pedido fue recibido por el restaurante.', className: 'pending' };
        case 'preparacion':
            return { label: 'En preparacion', detail: 'Estamos preparando tu pedido.', className: 'preparing' };
        case 'esperando_domiciliario':
            return { label: 'Esperando domiciliario', detail: 'Tu pedido esta listo y esperando repartidor.', className: 'waiting' };
        case 'camino':
            return { label: 'En camino', detail: 'Tu pedido va en camino.', className: 'on-route' };
        case 'listo_recoger':
            return { label: 'Pedido listo', detail: 'Tu pedido ya esta listo para recoger.', className: 'ready' };
        case 'entregado':
            return { label: 'Entregado', detail: fulfillmentType === 'pickup' ? 'Tu pedido fue entregado en el local.' : 'Tu pedido ya fue entregado.', className: 'delivered' };
        default:
            return { label: 'En proceso', detail: 'Estamos revisando tu pedido.', className: 'pending' };
    }
}

function unsubscribeCustomerProfileStreams() {
    if (typeof customerOrdersUnsubscribe === 'function') {
        customerOrdersUnsubscribe();
    }
    if (typeof customerMessagesUnsubscribe === 'function') {
        customerMessagesUnsubscribe();
    }
    customerOrdersUnsubscribe = null;
    customerMessagesUnsubscribe = null;
}

function syncCustomerProfileRealtimeStreams() {
    unsubscribeCustomerProfileStreams();

    if (!activeCustomerProfile?.customerPhoneDigits) {
        return;
    }

    const db = getPublicFirebaseDb();
    const phoneDigits = activeCustomerProfile.customerPhoneDigits;

    customerOrdersUnsubscribe = db.collection(ORDERS_COLLECTION)
        .where('customerPhoneDigits', '==', phoneDigits)
        .onSnapshot((snapshot) => {
            customerProfileOrdersState = snapshot.docs
                .map((doc) => ({ id: doc.id, ...doc.data() }))
                .sort((a, b) => getTimestampMillis(b.createdAt || b.updatedAt) - getTimestampMillis(a.createdAt || a.updatedAt));
            renderCustomerOrdersPanel();
        }, () => undefined);

    customerMessagesUnsubscribe = db.collection(MESSAGES_COLLECTION)
        .where('customerPhoneDigits', '==', phoneDigits)
        .onSnapshot((snapshot) => {
            customerProfileMessagesState = snapshot.docs
                .map((doc) => ({ id: doc.id, ...doc.data() }))
                .filter((message) => {
                    const type = String(message.type || '').trim();
                    return type === 'customer_direct_message' || type === 'admin_direct_reply';
                })
                .sort((a, b) => getTimestampMillis(a.createdAt || a.updatedAt) - getTimestampMillis(b.createdAt || b.updatedAt));
            renderCustomerMessagesPanel();
        }, () => undefined);
}

function renderCustomerOrdersPanel() {
    if (!customerAuthUI?.ordersCurrent || !customerAuthUI?.ordersHistory) {
        return;
    }

    const currentOrder = customerProfileOrdersState.find((order) => String(order.status || '').trim().toLowerCase() !== 'entregado');
    if (!currentOrder) {
        customerAuthUI.ordersCurrent.innerHTML = `
            <div class="customer-profile-empty-card">
                <strong>No tienes pedidos en curso.</strong>
                <p>Cuando hagas un pedido, aqui veras su estado actualizado en tiempo real.</p>
            </div>
        `;
    } else {
        const statusMeta = getPublicOrderStatusMeta(currentOrder.status, currentOrder.fulfillmentType);
        customerAuthUI.ordersCurrent.innerHTML = `
            <div class="customer-live-order-card ${escapeHtml(statusMeta.className)}">
                <div class="customer-live-order-head">
                    <div>
                        <strong>${escapeHtml(currentOrder.code || 'Pedido en curso')}</strong>
                        <span>${escapeHtml(formatProfileDateTime(currentOrder.createdAt || currentOrder.updatedAt))}</span>
                    </div>
                    <span class="customer-live-order-status ${escapeHtml(statusMeta.className)}">${escapeHtml(statusMeta.label)}</span>
                </div>
                <p>${escapeHtml(statusMeta.detail)}</p>
                <div class="customer-live-order-meta">
                    <span>${escapeHtml(currentOrder.fulfillmentType === 'pickup' ? 'Recoger en local' : currentOrder.fulfillmentType === 'mesa' ? 'Comer en el local' : 'Domicilio')}</span>
                    <span>${escapeHtml(formatCurrency(Number(currentOrder.total || 0)))}</span>
                    <span>${escapeHtml(`${Number(currentOrder.totalItems || currentOrder.itemCount || 0)} productos`)}</span>
                </div>
            </div>
        `;
    }

    if (!customerProfileOrdersState.length) {
        customerAuthUI.ordersHistory.innerHTML = `
            <div class="customer-profile-empty-card">
                <strong>Aun no tienes historial.</strong>
                <p>Tus pedidos anteriores apareceran aqui con su informacion completa.</p>
            </div>
        `;
        return;
    }

    customerAuthUI.ordersHistory.innerHTML = customerProfileOrdersState
        .map((order) => {
            const statusMeta = getPublicOrderStatusMeta(order.status, order.fulfillmentType);
            return `
                <article class="customer-order-history-card">
                    <div class="customer-order-history-head">
                        <strong>${escapeHtml(order.code || 'Pedido')}</strong>
                        <span class="customer-live-order-status ${escapeHtml(statusMeta.className)}">${escapeHtml(statusMeta.label)}</span>
                    </div>
                    <p>${escapeHtml(formatProfileDateTime(order.createdAt || order.updatedAt))}</p>
                    <div class="customer-order-history-meta">
                        <span>${escapeHtml(order.fulfillmentType === 'pickup' ? 'Recoger en local' : order.fulfillmentType === 'mesa' ? 'Comer en el local' : 'Domicilio')}</span>
                        <span>${escapeHtml(formatCurrency(Number(order.total || 0)))}</span>
                    </div>
                    <div class="customer-order-history-items">
                        ${(Array.isArray(order.items) ? order.items : []).map((item) => `<span>${escapeHtml(`${Number(item.quantity || 1)}x ${item.name || item.nombre || 'Producto'}`)}</span>`).join('')}
                    </div>
                </article>
            `;
        })
        .join('');
}

const CHAT_SEEN_STORAGE_KEY = 'roalburger-chat-seen-v1';
let _chatFabSeenCount = 0;

function _loadChatSeenCount() {
    if (!activeCustomerProfile?.id) return 0;
    try {
        const stored = localStorage.getItem(CHAT_SEEN_STORAGE_KEY);
        if (!stored) return 0;
        const parsed = JSON.parse(stored);
        return parsed?.profileId === activeCustomerProfile.id ? (Number(parsed.count) || 0) : 0;
    } catch { return 0; }
}

function _saveChatSeenCount(count) {
    if (!activeCustomerProfile?.id) return;
    try {
        localStorage.setItem(CHAT_SEEN_STORAGE_KEY, JSON.stringify({
            profileId: activeCustomerProfile.id,
            count
        }));
    } catch {}
}

function _markChatMessagesAsSeen() {
    const adminMessages = customerProfileMessagesState.filter(m =>
        String(m.type || '') === 'admin_direct_reply' ||
        (String(m.source || '') === 'admin_panel' && String(m.type || '') !== 'customer_direct_message')
    );
    _chatFabSeenCount = adminMessages.length;
    _saveChatSeenCount(_chatFabSeenCount);
    updatePublicChatFab();
}

function updatePublicChatFab() {
    const fab = document.getElementById('publicChatFab');
    const badge = document.getElementById('publicChatFabBadge');
    if (!fab) return;

    if (!activeCustomerProfile) {
        fab.hidden = true;
        return;
    }

    fab.hidden = false;

    // Contar mensajes del restaurante que llegaron después del último "visto"
    const adminMessages = customerProfileMessagesState.filter(m =>
        String(m.type || '') === 'admin_direct_reply' ||
        (String(m.source || '') === 'admin_panel' && String(m.type || '') !== 'customer_direct_message')
    );
    const unread = adminMessages.length - _chatFabSeenCount;

    if (badge) {
        if (unread > 0) {
            badge.textContent = unread;
            badge.hidden = false;
        } else {
            badge.hidden = true;
        }
    }
}

function openPublicChatTab() {
    _markChatMessagesAsSeen();

    if (!customerAuthUI) {
        openCustomerAuthModal();
        requestAnimationFrame(() => {
            requestAnimationFrame(() => activateCustomerProfileTab('mensajes'));
        });
    } else {
        activateCustomerProfileTab('mensajes');
    }
}

function renderCustomerMessagesPanel() {
    // Si el tab de mensajes está activo, marcar los nuevos mensajes como vistos
    if (customerAuthUI?.activeTab === 'mensajes') {
        _markChatMessagesAsSeen();
    } else {
        updatePublicChatFab();
    }

    if (!customerAuthUI?.messagesThread) {
        return;
    }

    if (!customerProfileMessagesState.length) {
        customerAuthUI.messagesThread.innerHTML = `
            <div class="customer-messages-empty">
                <span>💬</span>
                <p>Aún no hay mensajes.<br>Escríbenos y te responderemos aquí.</p>
            </div>
        `;
        return;
    }

    customerAuthUI.messagesThread.innerHTML = customerProfileMessagesState
        .map((message) => {
            const isAdminReply = String(message.type || '').trim() === 'admin_direct_reply' || String(message.source || '').trim() === 'admin_panel';
            const authorLabel = isAdminReply ? 'ROAL BURGER' : 'Tú';
            return `
                <article class="customer-message-bubble ${isAdminReply ? 'is-admin' : 'is-customer'}">
                    <strong>${escapeHtml(authorLabel)}</strong>
                    <p>${escapeHtml(message.body || 'Sin mensaje.')}</p>
                    <span>${escapeHtml(formatProfileDateTime(message.createdAt || message.updatedAt))}</span>
                </article>
            `;
        })
        .join('');

    customerAuthUI.messagesThread.scrollTop = customerAuthUI.messagesThread.scrollHeight;
}

async function submitCustomerDirectMessage() {
    if (!activeCustomerProfile?.customerPhoneDigits || !customerAuthUI?.messageInput || !customerAuthUI?.messageFeedback) {
        return;
    }

    const body = String(customerAuthUI.messageInput.value || '').trim();
    customerAuthUI.messageFeedback.textContent = '';
    if (body.length < 3) {
        customerAuthUI.messageFeedback.textContent = 'Escribe un mensaje corto para comunicarte con el restaurante.';
        return;
    }

    try {
        const db = getPublicFirebaseDb();
        await db.collection(MESSAGES_COLLECTION).add({
            type: 'customer_direct_message',
            status: 'pending',
            subject: 'Mensaje desde perfil del cliente',
            body,
            customerName: String(activeCustomerProfile.customerName || '').trim() || 'Cliente sin nombre',
            customerPhone: String(activeCustomerProfile.customerPhone || '').trim() || activeCustomerProfile.customerPhoneDigits,
            customerPhoneDigits: activeCustomerProfile.customerPhoneDigits,
            customerAddress: String(activeCustomerProfile.address || '').trim(),
            source: 'public_web',
            createdAt: getPublicServerTimestamp(),
            updatedAt: getPublicServerTimestamp()
        });
        customerAuthUI.messageInput.value = '';
        customerAuthUI.messageFeedback.textContent = 'Tu mensaje fue enviado al restaurante.';
    } catch (error) {
        customerAuthUI.messageFeedback.textContent = error.message || 'No se pudo enviar el mensaje.';
    }
}

function getCheckoutFulfillmentType(value) {
    const normalized = String(value || '').trim().toLowerCase();
    if (normalized === 'pickup') return 'pickup';
    if (normalized === 'delivery') return 'delivery';
    if (normalized === 'dine_in' || normalized === 'mesa') return 'mesa';
    return '';
}

function isPointInPolygon(point, polygon = []) {
    const [lat, lng] = point;
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const [yi, xi] = polygon[i];
        const [yj, xj] = polygon[j];
        const intersect = ((yi > lat) !== (yj > lat)) && (lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi);
        if (intersect) {
            inside = !inside;
        }
    }
    return inside;
}

function findDeliveryZoneForLocation(location = {}) {
    const { latitude, longitude } = location;
    if (!Number.isFinite(Number(latitude)) || !Number.isFinite(Number(longitude))) {
        return null;
    }

    const point = [Number(latitude), Number(longitude)];
    return DELIVERY_GEOFENCE_ZONES.find((zone) => isPointInPolygon(point, zone.polygon)) || null;
}

function getCheckoutDeliveryFee(fulfillmentType) {
    return getCheckoutFulfillmentType(fulfillmentType) === 'delivery'
        ? Math.max(0, Number.isFinite(checkoutDeliveryFeeAmount) ? checkoutDeliveryFeeAmount : 0)
        : 0;
}

function getCheckoutOrderTotal(fulfillmentType) {
    return getCartTotalAmount() + getCheckoutDeliveryFee(fulfillmentType);
}

function getCheckoutDiscountAmount() {
    return getCartDiscountTotalAmount();
}

function formatSequentialOrderCode(sequenceNumber) {
    return `${ORDER_CODE_PREFIX}-${String(sequenceNumber).padStart(4, '0')}`;
}

async function reserveNextOrderCode(db, orderRef, payload) {
    const sequenceRef = db.collection(ORDERS_COLLECTION).doc(ORDER_SEQUENCE_DOC_ID);
    const fallbackCode = () => `${ORDER_CODE_PREFIX}-${String(Date.now() % 100000).padStart(5, '0')}`;
    let reservedCode = '';

    try {
        const txPromise = db.runTransaction(async (transaction) => {
            const sequenceSnapshot = await transaction.get(sequenceRef);
            const currentSequence = Number(sequenceSnapshot.exists ? sequenceSnapshot.data()?.current : ORDER_CODE_START - 1);
            const nextSequence = Number.isFinite(currentSequence)
                ? Math.max(currentSequence + 1, ORDER_CODE_START)
                : ORDER_CODE_START;
            reservedCode = formatSequentialOrderCode(nextSequence);
            transaction.set(sequenceRef, {
                metaType: 'order_sequence',
                current: nextSequence,
                updatedAt: getPublicServerTimestamp()
            }, { merge: true });
            transaction.set(orderRef, { ...payload, code: reservedCode });
        });
        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000));
        await Promise.race([txPromise, timeout]);
        if (!reservedCode) reservedCode = fallbackCode();
    } catch (_e) {
        // Fallback: guardar el pedido con código por timestamp si Firestore falla (cuota/red)
        reservedCode = fallbackCode();
        await orderRef.set({ ...payload, code: reservedCode });
    }

    return reservedCode;
}

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
    if (TEMP_CLOSURE_ACTIVE) {
        return { isOpen: false, scheduleLabel: ORDERING_SCHEDULE.label, statusLabel: TEMP_CLOSURE_MESSAGE };
    }
    const currentMinutes = getCurrentOrderingMinutes(now);
    const isWithinSchedule = currentMinutes >= ORDERING_SCHEDULE.startMinutes && currentMinutes < ORDERING_SCHEDULE.endMinutes;
    const isOpen = ALLOW_ORDERS_OUTSIDE_SCHEDULE_FOR_TESTS ? true : isWithinSchedule;

    return {
        isOpen,
        scheduleLabel: ORDERING_SCHEDULE.label,
        statusLabel: isOpen
            ? (ALLOW_ORDERS_OUTSIDE_SCHEDULE_FOR_TESTS ? 'Modo pruebas activo. Puedes hacer pedidos fuera del horario.' : ORDERING_SCHEDULE.openMessage)
            : ORDERING_SCHEDULE.closedMessage
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

function closeOrderSentMessage() {
    if (!orderSentConfirmationUI) {
        return;
    }

    orderSentConfirmationUI.modal.remove();
    orderSentConfirmationUI = null;
    syncBodyScrollLock();
}

function showOrderSentMessage(message = ORDER_SENT_CONFIRMATION_MESSAGE) {
    closeOrderSentMessage();

    const modal = document.createElement('div');
    modal.id = 'orderSentConfirmationModal';
    modal.className = 'support-modal';
    modal.classList.add('is-open');
    modal.innerHTML = `
        <div class="support-modal-card liquid-glass" role="dialog" aria-modal="true" aria-label="Confirmacion de pedido enviado">
            <p class="support-modal-kicker">Pedido enviado</p>
            <h3 class="support-modal-title">Informacion importante</h3>
            <p class="support-modal-text">${message}</p>
            <div class="support-actions">
                <button type="button" class="support-send-btn">Entendido</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    orderSentConfirmationUI = {
        modal,
        accept: modal.querySelector('.support-send-btn')
    };

    orderSentConfirmationUI.accept.addEventListener('click', closeOrderSentMessage);
    modal.addEventListener('click', (event) => {
        if (event.target === modal && _lastMousedownTarget === modal) {
            closeOrderSentMessage();
        }
    });

    syncBodyScrollLock();
}

let _activeOrderUnsubscribe = null;
let _lastKnownOrderStatus = null;

const ORDER_STATUS_MESSAGES = {
    pendiente:              { icon: '⏳', text: 'Recibimos tu pedido, lo estamos revisando.' },
    preparacion:            { icon: '👨‍🍳', text: '¡Confirmado! Tu pedido está en cocina.' },
    esperando_domiciliario: { icon: '✅', text: '¡Listo! Buscando domiciliario para tu pedido.' },
    listo_recoger:          { icon: '✅', text: '¡Tu pedido está listo! Puedes venir a recogerlo.' },
    camino:                 { icon: '🛵', text: '¡Tu pedido está en camino! Ya casi llega.' },
    entregado:              { icon: '🎉', text: '¡Pedido entregado! Buen provecho 🍔' },
    cancelado:              { icon: '❌', text: 'Tu pedido fue cancelado. Contáctanos por WhatsApp.' },
};

async function requestOrderNotificationPermission() {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
        await Notification.requestPermission();
    }
}

function sendBrowserNotification(status, orderCode) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const info = ORDER_STATUS_MESSAGES[status];
    if (!info) return;

    const title = `${info.icon} ROAL BURGER — Pedido #${orderCode}`;
    const body  = info.text;
    const icon  = 'isotipo.png';

    try {
        if (navigator.serviceWorker && navigator.serviceWorker.controller) {
            navigator.serviceWorker.ready.then((reg) => {
                reg.showNotification(title, {
                    body,
                    icon,
                    badge: icon,
                    tag: `roal-order-${orderCode}`,
                    renotify: true,
                    vibrate: [200, 100, 200],
                });
            });
        } else {
            new Notification(title, { body, icon, tag: `roal-order-${orderCode}` });
        }
    } catch (_) {}
}

function showOrderStatusToast(status, orderCode) {
    const existing = document.getElementById('orderStatusToast');
    if (existing) existing.remove();

    const info = ORDER_STATUS_MESSAGES[status];
    if (!info) return;

    const toast = document.createElement('div');
    toast.id = 'orderStatusToast';
    toast.className = 'ost-toast' + (status === 'cancelado' ? ' ost-toast--cancel' : status === 'entregado' ? ' ost-toast--done' : '');
    toast.innerHTML = `
        <div class="ost-icon">${info.icon}</div>
        <div class="ost-body">
            <span class="ost-code">Pedido #${orderCode}</span>
            <span class="ost-msg">${info.text}</span>
        </div>
        <button class="ost-close" aria-label="Cerrar">✕</button>
    `;

    document.body.appendChild(toast);

    toast.querySelector('.ost-close').addEventListener('click', () => {
        toast.classList.add('ost-toast--out');
        setTimeout(() => toast.remove(), 350);
    });

    requestAnimationFrame(() => toast.classList.add('ost-toast--in'));

    if (status !== 'cancelado') {
        setTimeout(() => {
            if (toast.parentNode) {
                toast.classList.add('ost-toast--out');
                setTimeout(() => toast.remove(), 350);
            }
        }, 7000);
    }

    // Notificación del sistema (funciona con app en segundo plano)
    sendBrowserNotification(status, orderCode);
}

function subscribeToOrderStatusUpdates(orderId, orderCode) {
    if (_activeOrderUnsubscribe) {
        _activeOrderUnsubscribe();
        _activeOrderUnsubscribe = null;
    }
    _lastKnownOrderStatus = null;

    if (!orderId || typeof db === 'undefined') return;

    try {
        _activeOrderUnsubscribe = db.collection('pedidos').doc(orderId).onSnapshot((snap) => {
            if (!snap.exists) return;
            const data = snap.data();
            const rawStatus = String(data.status || '').trim().toLowerCase();

            let status = 'pendiente';
            if (rawStatus === 'esperando_domiciliario') status = 'esperando_domiciliario';
            else if (rawStatus === 'listo_recoger' || rawStatus === 'pedido_listo') status = 'listo_recoger';
            else if (rawStatus === 'preparacion' || rawStatus === 'confirmado' || rawStatus === 'cocina') status = 'preparacion';
            else if (rawStatus === 'camino' || rawStatus === 'en_camino') status = 'camino';
            else if (rawStatus === 'entregado') status = 'entregado';
            else if (rawStatus === 'cancelado') status = 'cancelado';

            if (status === _lastKnownOrderStatus) return;
            _lastKnownOrderStatus = status;

            showOrderStatusToast(status, orderCode);

            if (status === 'entregado' || status === 'cancelado') {
                if (_activeOrderUnsubscribe) {
                    _activeOrderUnsubscribe();
                    _activeOrderUnsubscribe = null;
                }
            }
        }, () => {});
    } catch (_) {}
}

function showOrderConfirmScreen(orderData = {}) {
    const screen = document.getElementById('orderConfirmScreen');
    if (!screen) return;

    const fmt = (n) => typeof window.formatCurrency === 'function' ? window.formatCurrency(n) : `$${Number(n).toLocaleString('es-CO')}`;

    // Código
    const ocCode = document.getElementById('ocOrderCode');
    if (ocCode) ocCode.textContent = String(orderData.code || orderData.id || '—');

    // Cliente
    const ocName = document.getElementById('ocCustomerName');
    if (ocName) ocName.textContent = String(orderData.customerName || '—');

    // Pago
    const ocPay = document.getElementById('ocPaymentMethod');
    if (ocPay) {
        const pm = String(orderData.paymentMethod || '').toLowerCase();
        const labels = { efectivo: 'Efectivo', nequi: 'Nequi', bancolombia: 'Bancolombia', daviplata: 'Daviplata', tarjeta: 'Tarjeta' };
        ocPay.textContent = labels[pm] || String(orderData.paymentMethod || '—');
    }

    // Dirección
    const ocAddrRow = document.getElementById('ocAddressRow');
    const ocAddr = document.getElementById('ocAddress');
    const ft = String(orderData.fulfillmentType || '').toLowerCase();
    const isPickup = ft.includes('pickup') || ft.includes('local') || ft === 'mesa';
    if (ocAddrRow) ocAddrRow.style.display = isPickup ? 'none' : '';
    if (ocAddr) ocAddr.textContent = String(orderData.address || '—');

    // Items
    const ocList = document.getElementById('ocItemsList');
    if (ocList) {
        const items = Array.isArray(orderData.items) ? orderData.items : [];
        if (items.length === 0) {
            ocList.innerHTML = '<p style="color:rgba(255,235,210,0.40);font-size:0.82rem;margin:0;">Sin detalle de productos.</p>';
        } else {
            const burgerEmojis = ['🍔', '🥩', '🍟', '🌭', '🥗', '🥤', '🍦'];
            ocList.innerHTML = items.map((item, i) => {
                const emoji = burgerEmojis[i % burgerEmojis.length];
                const optLabel = item.optionLabel ? `<span class="oc-item-sub">${item.optionLabel}</span>` : '';
                return `<div class="oc-item">
                    <div class="oc-item-left">
                        <span class="oc-item-emoji">${emoji}</span>
                        <div class="oc-item-info">
                            <span class="oc-item-name">${item.productName || '—'}</span>
                            ${optLabel}
                        </div>
                    </div>
                    <span class="oc-item-price">x${item.quantity} · ${fmt(item.subtotal || 0)}</span>
                </div>`;
            }).join('');
        }
    }

    // Totales
    const subtotal = Number(orderData.subtotal || 0);
    const deliveryFee = Number(orderData.deliveryFee || 0);
    const total = Number(orderData.total || (subtotal + deliveryFee));

    const ocSub = document.getElementById('ocSubtotal');
    if (ocSub) ocSub.textContent = fmt(subtotal);

    const ocDelRow = document.getElementById('ocDeliveryRow');
    const ocDel = document.getElementById('ocDeliveryFee');
    if (ocDelRow) ocDelRow.style.display = isPickup ? 'none' : '';
    if (ocDel) ocDel.textContent = deliveryFee > 0 ? fmt(deliveryFee) : 'Gratis';

    const ocTotal = document.getElementById('ocTotal');
    if (ocTotal) ocTotal.textContent = fmt(total);

    // Botón principal — confirma y abre WhatsApp
    const ocWaBtn = document.getElementById('ocWhatsAppBtn');
    if (ocWaBtn) {
        ocWaBtn.onclick = () => {
            openOrderConfirmationWhatsApp(orderData);
        };
    }

    // Botón volver al menú
    const ocClose = document.getElementById('ocCloseBtn');
    if (ocClose) {
        ocClose.onclick = () => {
            screen.hidden = true;
            syncBodyScrollLock();
        };
    }

    screen.hidden = false;
    screen.scrollTop = 0;
    syncBodyScrollLock();

    // Pedir permiso de notificaciones y activar listener de estado
    const orderId = String(orderData.id || '');
    const orderCode = String(orderData.code || orderData.id || '');
    if (orderId) {
        requestOrderNotificationPermission().finally(() => {
            subscribeToOrderStatusUpdates(orderId, orderCode);
        });
    }
}

function buildWhatsAppOrderConfirmationText(orderData = {}) {
    const orderCode = String(orderData.code || orderData.id || '').trim();
    const customerName = String(orderData.customerName || '').trim() || 'Cliente';
    const total = formatCurrency(Number(orderData.total || 0));

    return `¡Hola ROAL BURGER! Acabo de registrar mi pedido a través de la aplicación web. El número de mi pedido es [${orderCode}] a nombre de [${customerName}] por un total de [${total}]. Quedo atento a la confirmación. ¡Muchas gracias!`;
}

function openOrderConfirmationWhatsApp(orderData = {}) {
    const message = buildWhatsAppOrderConfirmationText(orderData);
    const url = `${WHATSAPP_BASE_URL}?text=${encodeURIComponent(message)}`;
    const whatsappWindow = window.open(url, '_blank', 'noopener,noreferrer');

    if (!whatsappWindow) {
        window.location.href = url;
    }
}

function requestDeliveryQuote() {
    if (!checkoutInfoUI) return;

    const lat = checkoutInfoUI.deliveryLatitude;
    const lng = checkoutInfoUI.deliveryLongitude;
    const address = String(checkoutInfoUI.address?.value || '').trim();
    const coordsPart = (Number.isFinite(Number(lat)) && Number.isFinite(Number(lng))) ? `Coordenadas: ${lat.toFixed(6)}, ${lng.toFixed(6)}` : '';
    const addressPart = address ? `Direccion: ${address}` : '';
    const text = `Hola ROAL BURGER, solicito cotizacion de domicilio. ${addressPart} ${coordsPart}`.trim();
    const url = `${WHATSAPP_BASE_URL}?text=${encodeURIComponent(text)}`;
    const w = window.open(url, '_blank', 'noopener,noreferrer');
    if (!w) window.location.href = url;
}

function getPublicFirebaseDb() {
    if (publicFirebaseDbInstance) {
        return publicFirebaseDbInstance;
    }

    if (typeof initFirebaseServices !== 'function') {
        throw new Error('Firebase no esta disponible para guardar pedidos.');
    }

    publicFirebaseDbInstance = initFirebaseServices().db;
    return publicFirebaseDbInstance;
}

async function loadPublicUpgradesConfig() {
    try {
        const db = getPublicFirebaseDb();
        const doc = await db.collection('configuracion').doc('acompañamientos').get();
        const DEFAULT = {
            activo: true,
            categorias_aplica: ['BURGER CLASICAS', 'BURGER PREMIUM', 'PEPITOS VENEZOLANOS', 'PERROS CALIENTES', 'SALCHIPAPAS'],
            opciones: []
        };
        const raw = doc.exists ? { ...DEFAULT, ...doc.data() } : { ...DEFAULT };
        raw.opciones = (raw.opciones || []).map((o) => ({
            tiene_variantes: false, variantes: [], activo_pos: true, activo_menu: true, ...o
        }));
        publicUpgradesConfig = raw;
    } catch (_e) {
        publicUpgradesConfig = null;
    }
}

function _normalizeBebidaPublic(raw) {
    const rawPres = Array.isArray(raw.presentaciones) ? raw.presentaciones : [];
    return {
        id: raw.id,
        marca: String(raw.marca || '').trim(),
        image_url: String(raw.image_url || '').trim(),
        presentaciones: rawPres.map((p, i) => ({
            id: p.id || `p${i}`,
            nombre: String(p.nombre || '').trim(),
            precio: Number(p.precio) || 0,
            sabores: Array.isArray(p.sabores)
                ? p.sabores.map((s) => String(s).trim()).filter(Boolean)
                : (typeof p.sabores === 'string'
                    ? p.sabores.split(',').map((s) => s.trim()).filter(Boolean)
                    : [])
        })).filter((p) => p.nombre),
        mostrar_categoria: raw.mostrar_categoria !== false,
        mostrar_acompanante: raw.mostrar_acompanante !== false,
        estado: raw.estado === 'paused' ? 'paused' : 'active',
        orden: raw.orden != null ? Number(raw.orden) : 99
    };
}

function loadBebidasPublic() {
    try {
        const db = getPublicFirebaseDb();
        db.collection('bebidas').onSnapshot((snap) => {
            _latestBebidas = snap.docs
                .map((doc) => _normalizeBebidaPublic({ id: doc.id, ...doc.data() }))
                .sort((a, b) => a.orden - b.orden || a.marca.localeCompare(b.marca, 'es'));
            renderCategoryExplorer();
        }, () => {
            _latestBebidas = [];
        });
    } catch (_) {
        _latestBebidas = [];
    }
}

async function loadHorarioConfig() {
    try {
        const db = getPublicFirebaseDb();
        const doc = await db.collection('configuracion').doc('config_horario').get();
        if (!doc.exists) return;
        const d = doc.data();
        const aH = Number.isFinite(Number(d.aperturaHora)) ? Number(d.aperturaHora) : 16;
        const aM = Number.isFinite(Number(d.aperturaMinuto)) ? Number(d.aperturaMinuto) : 0;
        const cH = Number.isFinite(Number(d.cierreHora)) ? Number(d.cierreHora) : 22;
        const cM = Number.isFinite(Number(d.cierreMinuto)) ? Number(d.cierreMinuto) : 0;
        ORDERING_SCHEDULE = {
            ...ORDERING_SCHEDULE,
            startMinutes: aH * 60 + aM,
            endMinutes: cH * 60 + cM,
            label: String(d.etiquetaHorario || ORDERING_SCHEDULE.label),
            closedMessage: String(d.mensajeCierre || ORDERING_SCHEDULE.closedMessage)
        };
        syncOrderingAvailabilityUI();
    } catch (_) {}
}

async function loadCustomerPaymentMethods() {
    try {
        const db = getPublicFirebaseDb();
        const doc = await db.collection('configuracion').doc('metodos_pago').get();
        if (doc.exists && Array.isArray(doc.data()?.methods)) {
            _customerPaymentMethods = doc.data().methods.filter((m) => m.enabled !== false);
        } else {
            _customerPaymentMethods = [
                { id: 'efectivo',    label: 'Efectivo',    icon: '💵' },
                { id: 'bancolombia', label: 'Bancolombia', icon: '🏦' },
                { id: 'nequi',       label: 'Nequi',       icon: '💜' },
                { id: 'bold',        label: 'Bold',        icon: '💳' },
            ];
        }
    } catch (_) {}
}

function _shouldShowPublicUpgrade(categoryName) {
    if (!publicUpgradesConfig?.activo) return false;
    const cat = String(categoryName || '').trim().toUpperCase();
    const eligible = (publicUpgradesConfig.categorias_aplica || []).map((c) => c.toUpperCase());
    const activeMenuOpts = (publicUpgradesConfig.opciones || [])
        .filter((o) => o.activo && o.activo_menu !== false);
    return eligible.includes(cat) && activeMenuOpts.length > 0;
}

function getPublicServerTimestamp() {
    if (window.firebase?.firestore?.FieldValue?.serverTimestamp) {
        return window.firebase.firestore.FieldValue.serverTimestamp();
    }

    return new Date();
}

function buildClientDocumentId(customerInfo = {}) {
    const phoneDigits = String(customerInfo.customerPhoneDigits || customerInfo.customerPhone || '').replace(/\D+/g, '');
    if (phoneDigits) {
        return `phone_${phoneDigits}`;
    }

    const nameKey = normalizeCategoryKey(customerInfo.customerName || 'cliente').replace(/[^a-z0-9]+/g, '_');
    const addressKey = normalizeCategoryKey(customerInfo.deliveryAddress || customerInfo.fulfillmentType || 'sin_direccion').replace(/[^a-z0-9]+/g, '_');
    return `client_${nameKey}_${addressKey}`.replace(/_+/g, '_');
}

async function upsertClientProfile(db, customerInfo = {}, orderInfo = {}) {
    const clientId = buildClientDocumentId(customerInfo);
    const clientRef = db.collection(CLIENTS_COLLECTION).doc(clientId);

    await db.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(clientRef);
        const previous = snapshot.exists ? snapshot.data() : {};
        const previousTotalOrders = Number(previous.totalOrders || 0);
        const previousTotalSpent = Number(previous.totalSpent || 0);
        const fallbackAddress = String(customerInfo.profileAddress || previous.address || customerInfo.deliveryAddress || (customerInfo.fulfillmentType === 'pickup' ? 'Recoge en el local' : customerInfo.fulfillmentType === 'mesa' ? 'Come en el local' : 'Sin direccion registrada')).trim();
        const savedAddresses = normalizeCustomerSavedAddresses(customerInfo.savedAddresses || previous.savedAddresses || [], fallbackAddress);
        const resolvedAddress = String(savedAddresses[0]?.address || fallbackAddress).trim();

        transaction.set(clientRef, {
            customerName: String(customerInfo.customerName || previous.customerName || '').trim(),
            customerPhone: String(customerInfo.customerPhone || previous.customerPhone || '').trim(),
            customerPhoneDigits: String(customerInfo.customerPhoneDigits || previous.customerPhoneDigits || '').replace(/\D+/g, ''),
            address: resolvedAddress,
            savedAddresses,
            lastOrderCode: String(orderInfo.code || previous.lastOrderCode || '').trim(),
            lastOrderId: String(orderInfo.id || previous.lastOrderId || '').trim(),
            lastOrderTotal: Number(orderInfo.total || previous.lastOrderTotal || 0),
            totalOrders: previousTotalOrders + 1,
            totalSpent: previousTotalSpent + Number(orderInfo.total || 0),
            source: 'web',
            firstOrderAt: previous.firstOrderAt || getPublicServerTimestamp(),
            createdAt: previous.createdAt || getPublicServerTimestamp(),
            updatedAt: getPublicServerTimestamp(),
            lastOrderAt: getPublicServerTimestamp()
        }, { merge: true });
    });
}

async function fetchClientProfileByPhone(phoneValue, pinValue = '') {
    const phoneDigits = normalizePhoneDigits(phoneValue);
    if (phoneDigits.length < 10) {
        throw new Error('Escribe un numero de WhatsApp valido.');
    }

    const pinHash = await hashCustomerPin(pinValue);

    const db = getPublicFirebaseDb();
    const directRef = db.collection(CLIENTS_COLLECTION).doc(`phone_${phoneDigits}`);
    const directSnapshot = await directRef.get();

    if (directSnapshot.exists) {
        const profile = normalizeCustomerProfile({ id: directSnapshot.id, ...directSnapshot.data() }, directSnapshot.id);
        if (!profile?.passwordHash) {
            const resetError = new Error('Tu contrasena fue reiniciada. Crea una nueva para volver a entrar.');
            resetError.code = 'PASSWORD_RESET_REQUIRED';
            resetError.profile = profile;
            throw resetError;
        }
        if (profile.passwordHash !== pinHash) {
            throw new Error('La contrasena no coincide con este perfil.');
        }
        return profile;
    }

    const fallbackSnapshot = await db.collection(CLIENTS_COLLECTION)
        .where('customerPhoneDigits', '==', phoneDigits)
        .limit(1)
        .get();

    if (!fallbackSnapshot.empty) {
        const doc = fallbackSnapshot.docs[0];
        const profile = normalizeCustomerProfile({ id: doc.id, ...doc.data() }, doc.id);
        if (!profile?.passwordHash) {
            const resetError = new Error('Tu contrasena fue reiniciada. Crea una nueva para volver a entrar.');
            resetError.code = 'PASSWORD_RESET_REQUIRED';
            resetError.profile = profile;
            throw resetError;
        }
        if (profile.passwordHash !== pinHash) {
            throw new Error('La contrasena no coincide con este perfil.');
        }
        return profile;
    }

    return null;
}

async function saveCustomerProfile(profileInput = {}) {
    const db = getPublicFirebaseDb();
    const customerName = String(profileInput.customerName || '').trim();
    const customerPhone = String(profileInput.customerPhone || '').trim();
    const customerPhoneDigits = normalizePhoneDigits(customerPhone);
    const pinValue = normalizeCustomerPin(profileInput.pin || '');
    const confirmPinValue = normalizeCustomerPin(profileInput.confirmPin || '');
    const acceptedDataPolicy = Boolean(profileInput.acceptedDataPolicy);

    if (!customerName) {
        throw new Error('Escribe tu nombre para guardar el perfil.');
    }

    if (customerPhoneDigits.length < 10) {
        throw new Error('Escribe un numero de WhatsApp valido.');
    }

    const clientId = `phone_${customerPhoneDigits}`;
    const clientRef = db.collection(CLIENTS_COLLECTION).doc(clientId);
    const snapshot = await clientRef.get();
    const previous = snapshot.exists ? snapshot.data() : {};
    const savedAddresses = normalizeCustomerSavedAddresses(profileInput.savedAddresses || previous.savedAddresses || [], String(profileInput.address || '').trim());
    const address = String(savedAddresses[0]?.address || '').trim();

    if (!address) {
        throw new Error('Escribe la direccion principal de tu perfil.');
    }

    let passwordHash = String(previous.passwordHash || '').trim();
    const hasPreviousConsent = Boolean(previous.privacyConsentAccepted) && Boolean(previous.marketingConsentAccepted);

    if (!acceptedDataPolicy && !hasPreviousConsent) {
        throw new Error('Debes aceptar el uso de tus datos y el envio de promociones de ROAL BURGER para crear tu perfil.');
    }

    if (pinValue || confirmPinValue || !passwordHash) {
        if (!isValidCustomerPin(pinValue)) {
            throw new Error('Crea una contrasena numerica de 6 digitos.');
        }

        if (pinValue !== confirmPinValue) {
            throw new Error('La confirmacion de la contrasena no coincide.');
        }

        passwordHash = await hashCustomerPin(pinValue);
    }

    await clientRef.set({
        customerName,
        customerPhone,
        customerPhoneDigits,
        address,
        savedAddresses,
        passwordHash,
        privacyConsentAccepted: acceptedDataPolicy || Boolean(previous.privacyConsentAccepted),
        marketingConsentAccepted: acceptedDataPolicy || Boolean(previous.marketingConsentAccepted),
        consentAcceptedAt: previous.consentAcceptedAt || getPublicServerTimestamp(),
        consentVersion: acceptedDataPolicy ? CUSTOMER_CONSENT_VERSION : String(previous.consentVersion || CUSTOMER_CONSENT_VERSION).trim(),
        totalOrders: Number(previous.totalOrders || 0),
        totalSpent: Number(previous.totalSpent || 0),
        lastOrderCode: String(previous.lastOrderCode || '').trim(),
        lastOrderId: String(previous.lastOrderId || '').trim(),
        lastOrderTotal: Number(previous.lastOrderTotal || 0),
        firstOrderAt: previous.firstOrderAt || null,
        lastOrderAt: previous.lastOrderAt || null,
        source: 'web_profile',
        createdAt: previous.createdAt || getPublicServerTimestamp(),
        updatedAt: getPublicServerTimestamp()
    }, { merge: true });

    return normalizeCustomerProfile({
        id: clientId,
        ...previous,
        customerName,
        customerPhone,
        customerPhoneDigits,
        address,
        savedAddresses,
        passwordHash,
        privacyConsentAccepted: acceptedDataPolicy || Boolean(previous.privacyConsentAccepted),
        marketingConsentAccepted: acceptedDataPolicy || Boolean(previous.marketingConsentAccepted),
        consentAcceptedAt: previous.consentAcceptedAt || new Date(),
        consentVersion: acceptedDataPolicy ? CUSTOMER_CONSENT_VERSION : String(previous.consentVersion || CUSTOMER_CONSENT_VERSION).trim()
    }, clientId);
}

function closeCustomerAuthModal() {
    closeCustomerConsentDocument();
    closeCustomerDeleteAccountModal();
    closeCustomerPasswordResetModal();

    if (!customerAuthUI) return;

    const screen  = document.getElementById('perfilScreen');
    const content = document.getElementById('perfilContent');
    if (screen)  { screen.classList.remove('is-open'); screen.hidden = true; }
    if (content) content.innerHTML = '';

    customerAuthUI = null;
    _exitScreen();
    syncBodyScrollLock();
}

function bindCustomerPinField(input) {
    if (!(input instanceof HTMLInputElement)) {
        return;
    }

    input.addEventListener('input', () => {
        const normalized = normalizeCustomerPin(input.value);
        if (input.value !== normalized) {
            input.value = normalized;
        }
    });
}

function getPasswordToggleIcon(isVisible = false) {
    return isVisible
        ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.28 2.22 2.22 3.28l4.1 4.1C4.33 8.83 2.86 10.79 2 12c2.73 3.84 6.68 6 10 6 1.94 0 3.82-.62 5.47-1.75l3.25 3.25 1.06-1.06ZM9.53 10.6l3.87 3.87A2.98 2.98 0 0 1 9.53 10.6Zm2.47-4.6c-1.2 0-2.39.24-3.49.68l1.65 1.65A2.98 2.98 0 0 1 15.67 14l1.73 1.73c1.75-1.08 3.39-2.73 4.6-4.43-2.73-3.84-6.68-5.3-10-5.3Z"/></svg>'
        : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5c-5 0-8.84 3.48-10 7 1.16 3.52 5 7 10 7s8.84-3.48 10-7c-1.16-3.52-5-7-10-7Zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm0-2.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"/></svg>';
}

function attachPasswordToggle(input) {
    if (!(input instanceof HTMLInputElement) || input.dataset.passwordToggleReady === '1') {
        return;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'support-password-wrap';
    input.parentNode?.insertBefore(wrapper, input);
    wrapper.appendChild(input);

    const toggleButton = document.createElement('button');
    toggleButton.type = 'button';
    toggleButton.className = 'support-password-toggle';
    toggleButton.setAttribute('aria-label', 'Mostrar contrasena');
    toggleButton.innerHTML = getPasswordToggleIcon(false);

    toggleButton.addEventListener('click', () => {
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        toggleButton.classList.toggle('is-visible', isPassword);
        toggleButton.innerHTML = getPasswordToggleIcon(isPassword);
        toggleButton.setAttribute('aria-label', isPassword ? 'Ocultar contrasena' : 'Mostrar contrasena');
    });

    wrapper.appendChild(toggleButton);
    input.dataset.passwordToggleReady = '1';
}

function getCustomerProfileFormUI() {
    if (customerRegisterUI) {
        return customerRegisterUI;
    }

    if (customerAuthUI?.name || customerAuthUI?.registerPhone) {
        return customerAuthUI;
    }

    return null;
}

function populateCustomerRegisterPanel(profile = {}) {
    const formUI = getCustomerProfileFormUI();
    if (!formUI) {
        return;
    }

    if (formUI.name) {
        formUI.name.value = String(profile.customerName || '').trim();
    }
    if (formUI.address) {
        formUI.address.value = String(profile.address || '').trim();
    }
    if (formUI.registerPhone) {
        formUI.registerPhone.value = String(profile.customerPhone || '').trim();
    }
    if (formUI.registerPin) {
        formUI.registerPin.value = '';
    }
    if (formUI.confirmPin) {
        formUI.confirmPin.value = '';
    }
    if (Array.isArray(formUI.savedAddressesData)) {
        formUI.savedAddressesData = getCustomerSavedAddresses(profile);
        formUI.selectedSavedAddressIndex = 0;
        renderCustomerRegisterSavedAddresses();
    }
    const hasConsent = Boolean(profile.privacyConsentAccepted) && Boolean(profile.marketingConsentAccepted);
    formUI.hasPreviousConsent = hasConsent;
    applyCustomerConsentState(hasConsent);
}

function closeCustomerRegisterModal() {
    closeCustomerConsentDocument();
    closeCustomerDeleteAccountModal();
    closeCustomerPasswordResetModal();
    closeCustomerSavedAddressMapModal();

    if (!customerRegisterUI) {
        return;
    }

    customerRegisterUI.modal.remove();
    customerRegisterUI = null;
    syncBodyScrollLock();
}

function closeCustomerConsentDocument() {
    if (!customerConsentDocumentUI) {
        return;
    }

    customerConsentDocumentUI.modal.remove();
    customerConsentDocumentUI = null;
    syncBodyScrollLock();
}

function applyCustomerConsentState(isAuthorized = false) {
    const formUI = getCustomerProfileFormUI();
    if (!formUI?.consent) {
        return;
    }

    const hasPreviousConsent = Boolean(formUI.hasPreviousConsent);
    const isApproved = Boolean(isAuthorized) || hasPreviousConsent;

    formUI.consent.checked = isApproved;
    formUI.consent.disabled = true;
    formUI.consentViewed = isApproved;

    if (formUI.consentStatus) {
        formUI.consentStatus.textContent = hasPreviousConsent
            ? 'Esta autorizacion ya fue registrada en tu perfil.'
            : (isApproved
                ? 'Documento revisado y autorizacion aceptada. Ya puedes continuar.'
                : 'Debes abrir y leer el documento antes de autorizar el manejo de tus datos.');
    }

    if (formUI.reviewConsentButton) {
        formUI.reviewConsentButton.textContent = hasPreviousConsent || isApproved
            ? 'Volver a ver autorizacion'
            : 'Leer autorizacion de tratamiento de datos';
    }

    if (formUI.save) {
        formUI.save.classList.toggle('is-disabled', !isApproved);
        formUI.save.setAttribute('aria-disabled', isApproved ? 'false' : 'true');
        formUI.save.title = isApproved ? '' : 'Primero debes leer y aceptar la autorizacion de tratamiento de datos.';
    }
}

function buildCustomerRegisterFormMarkup(profile = {}, saveLabel = 'Crear perfil') {
    const hasConsent = Boolean(profile.privacyConsentAccepted) && Boolean(profile.marketingConsentAccepted);
    const consentMarkup = `${escapeHtml(CUSTOMER_CONSENT_COPY)} <a href="${CUSTOMER_CONSENT_POLICY_URL}" target="_blank" rel="noopener noreferrer">Ver politica de tratamiento de datos personales</a>.`;

    return `
        <label class="support-field">
            <span>Nombre</span>
            <input type="text" id="customerRegisterName" value="${escapeHtml(profile.customerName || '')}" placeholder="Escribe tu nombre">
        </label>
        <div class="support-field">
            <span>Direcciones guardadas</span>
            <div id="customerRegisterSavedAddressesList" class="support-address-list"></div>
            <button type="button" class="support-secondary-btn" id="customerRegisterAddAddress">Agregar direccion</button>
            <p class="support-field-hint">Toca el icono del globo para abrir el mapa y anclar tu ubicación actual a esa dirección.</p>
        </div>
        <label class="support-field">
            <span>Numero de WhatsApp</span>
            <input type="tel" id="customerRegisterPhone" value="${escapeHtml(profile.customerPhone || '')}" placeholder="Escribe tu numero de WhatsApp">
        </label>
        <label class="support-field">
            <span>${saveLabel === 'Guardar perfil' ? 'Contrasena de 6 digitos' : 'Crear contrasena de 6 digitos'}</span>
            <input type="password" id="customerRegisterPin" inputmode="numeric" maxlength="6" placeholder="${saveLabel === 'Guardar perfil' ? 'Crea o actualiza tu contrasena' : 'Crea una contrasena numerica'}">
            <p class="support-field-hint">La usaras junto con tu WhatsApp para abrir tu perfil.</p>
        </label>
        <label class="support-field">
            <span>Confirmar contrasena</span>
            <input type="password" id="customerConfirmPin" inputmode="numeric" maxlength="6" placeholder="Confirma la contrasena">
        </label>
        <div class="support-consent-box">
            <button type="button" class="support-secondary-btn" id="customerReviewConsentButton">Leer autorizacion de tratamiento de datos</button>
            <p class="support-field-hint" id="customerConsentStatus">Debes abrir el documento antes de autorizar el manejo de tus datos.</p>
        </div>
        <label class="support-check" for="customerDataConsent">
            <input type="checkbox" id="customerDataConsent" ${hasConsent ? 'checked' : ''} disabled>
            <span>${consentMarkup}</span>
        </label>
        <button type="button" class="support-send-btn" id="customerRegisterSave">${saveLabel}</button>
    `;
}

function openCustomerRegisterModal(profile = {}, options = {}) {
    closeCustomerRegisterModal();

    const title = String(options.title || 'Crear cuenta').trim();
    const description = String(options.description || 'Completa tus datos para crear tu perfil y guardar tus proximos pedidos mas rapido.').trim();
    const saveLabel = String(options.saveLabel || 'Crear perfil').trim();

    const modal = document.createElement('div');
    modal.id = 'customerRegisterModal';
    modal.className = 'support-modal';
    modal.classList.add('is-open');
    modal.innerHTML = `
        <div class="support-modal-card liquid-glass" role="dialog" aria-modal="true" aria-label="${escapeHtml(title)}">
            <button type="button" class="support-modal-close" aria-label="Cerrar registro">&times;</button>
            <p class="support-modal-kicker">Mi cuenta</p>
            <h3 class="support-modal-title">${escapeHtml(title)}</h3>
            <p class="support-modal-text">${escapeHtml(description)}</p>
            ${buildCustomerRegisterFormMarkup(profile, saveLabel)}
            <p class="support-feedback" id="customerAuthFeedback"></p>
        </div>
    `;

    document.body.appendChild(modal);

    const hasConsent = Boolean(profile.privacyConsentAccepted) && Boolean(profile.marketingConsentAccepted);
    customerRegisterUI = {
        modal,
        close: modal.querySelector('.support-modal-close'),
        feedback: modal.querySelector('#customerAuthFeedback'),
        name: modal.querySelector('#customerRegisterName'),
        savedAddressesList: modal.querySelector('#customerRegisterSavedAddressesList'),
        addAddressButton: modal.querySelector('#customerRegisterAddAddress'),
        registerPhone: modal.querySelector('#customerRegisterPhone'),
        registerPin: modal.querySelector('#customerRegisterPin'),
        confirmPin: modal.querySelector('#customerConfirmPin'),
        reviewConsentButton: modal.querySelector('#customerReviewConsentButton'),
        consentStatus: modal.querySelector('#customerConsentStatus'),
        consent: modal.querySelector('#customerDataConsent'),
        save: modal.querySelector('#customerRegisterSave'),
        hasPreviousConsent: hasConsent,
        consentViewed: hasConsent,
        savedAddressesData: getCustomerSavedAddresses(profile),
        selectedSavedAddressIndex: 0,
        savedAddressMapModal: null,
        savedAddressMapUI: null
    };

    customerRegisterUI.close?.addEventListener('click', closeCustomerRegisterModal);
    customerRegisterUI.reviewConsentButton?.addEventListener('click', openCustomerConsentDocument);
    customerRegisterUI.save?.addEventListener('click', submitCustomerProfileForm);
    customerRegisterUI.addAddressButton?.addEventListener('click', () => {
        if (!customerRegisterUI) {
            return;
        }
        if (customerRegisterUI.savedAddressesData.length >= MAX_CUSTOMER_SAVED_ADDRESSES) {
            customerRegisterUI.feedback.textContent = `Ya puedes guardar hasta ${MAX_CUSTOMER_SAVED_ADDRESSES} direcciones.`;
            return;
        }
        customerRegisterUI.savedAddressesData.push({ address: '', latitude: null, longitude: null, primary: false });
        customerRegisterUI.selectedSavedAddressIndex = customerRegisterUI.savedAddressesData.length - 1;
        renderCustomerRegisterSavedAddresses();
    });
    customerRegisterUI.savedAddressUseLocationButton?.addEventListener('click', requestCustomerSavedAddressGeolocation);
    customerRegisterUI.savedAddressesList?.addEventListener('input', handleSavedAddressEditorInput);
    customerRegisterUI.savedAddressesList?.addEventListener('click', handleSavedAddressEditorAction);
    customerRegisterUI.savedAddressesList?.addEventListener('change', handleSavedAddressEditorChange);

    bindCustomerPinField(customerRegisterUI.registerPin);
    bindCustomerPinField(customerRegisterUI.confirmPin);
    attachPasswordToggle(customerRegisterUI.registerPin);
    attachPasswordToggle(customerRegisterUI.confirmPin);
    applyCustomerConsentState(hasConsent);
    renderCustomerRegisterSavedAddresses();
    initializeCustomerSavedAddressMap();

    modal.addEventListener('click', (event) => {
        if (event.target === modal && _lastMousedownTarget === modal) {
            closeCustomerRegisterModal();
        }
    });

    syncBodyScrollLock();
    customerRegisterUI.name?.focus();
}

function renderCustomerRegisterSavedAddresses() {
    if (!customerRegisterUI) {
        return;
    }

    const addresses = customerRegisterUI.savedAddressesData || [];
    if (addresses.length === 0) {
        customerRegisterUI.savedAddressesList.innerHTML = `
            <p class="support-field-hint">No hay direcciones guardadas. Agrega una para asignar ubicaciones y seleccionar una principal.</p>
        `;
        updateCustomerSavedAddressMap(null, null);
        return;
    }

    if (customerRegisterUI.selectedSavedAddressIndex < 0 || customerRegisterUI.selectedSavedAddressIndex >= addresses.length) {
        customerRegisterUI.selectedSavedAddressIndex = 0;
    }

    customerRegisterUI.savedAddressesList.innerHTML = addresses.map((entry, index) => {
        const isSelected = index === customerRegisterUI.selectedSavedAddressIndex;
        return `
            <div class="support-field support-address-entry ${isSelected ? 'is-active' : ''}" data-address-index="${index}">
                <label class="support-check">
                    <input type="radio" name="customerSavedAddressPrimary" value="${index}" ${entry.primary ? 'checked' : ''}>
                    <span>Principal</span>
                </label>
                <input type="text" class="customerSavedAddressInput" data-address-index="${index}" value="${escapeHtml(entry.address || '')}" placeholder="Direccion completa">
                <div class="support-field-actions">
                    <button type="button" class="support-secondary-btn customerSavedAddressSelectButton customer-address-icon-btn" aria-label="Agrega tu ubicación actual a esta dirección" title="Agrega tu ubicación actual a esta dirección" data-address-index="${index}">🌍</button>
                    <button type="button" class="support-secondary-btn customerSavedAddressRemoveButton customer-address-icon-btn" aria-label="Eliminar direccion" title="Eliminar direccion" data-address-index="${index}">✕</button>
                </div>
                <p class="support-field-hint">Lat: ${entry.latitude !== null ? entry.latitude : '---'} | Lng: ${entry.longitude !== null ? entry.longitude : '---'}</p>
            </div>
        `;
    }).join('');

    const selectedAddress = addresses[customerRegisterUI.selectedSavedAddressIndex];
    if (selectedAddress?.latitude !== null && selectedAddress?.longitude !== null) {
        updateCustomerSavedAddressMap(selectedAddress.latitude, selectedAddress.longitude);
    } else {
        updateCustomerSavedAddressMap(null, null);
    }
}

function getCustomerSavedAddressesFromEditor() {
    if (!customerRegisterUI) {
        return [];
    }

    return normalizeCustomerSavedAddresses(customerRegisterUI.savedAddressesData || []);
}

function getCustomerPrimarySavedAddressFromEditor() {
    const addresses = getCustomerSavedAddressesFromEditor();
    return addresses.find((entry) => entry.primary) || addresses[0] || null;
}

function setCustomerRegisterSelectedAddressIndex(index) {
    if (!customerRegisterUI) {
        return;
    }

    const addresses = customerRegisterUI.savedAddressesData || [];
    if (index < 0 || index >= addresses.length) {
        return;
    }

    customerRegisterUI.selectedSavedAddressIndex = index;
    renderCustomerRegisterSavedAddresses();
}

function createCustomerSavedAddressMapModal() {
    closeCustomerSavedAddressMapModal();

    if (!customerRegisterUI) {
        return;
    }

    const mapModal = document.createElement('div');
    mapModal.className = 'support-modal is-open';
    mapModal.innerHTML = `
        <div class="support-modal-card liquid-glass" role="dialog" aria-modal="true" aria-label="Ubicación del pedido">
            <button type="button" class="support-modal-close" aria-label="Cerrar mapa">&times;</button>
            <p class="support-modal-kicker">Ubicación</p>
            <h3 class="support-modal-title">Ancla tu ubicación actual</h3>
            <p class="support-modal-text" id="customerMapStatusText">Usa el botón de abajo para capturar tu ubicación GPS.</p>
            <div id="customerSavedAddressMapContainer" class="checkout-map-area" style="min-height:350px; margin:1rem 0;"></div>
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                <button type="button" class="support-secondary-btn" id="customerSavedAddressUseLocation">Capturar ubicacion GPS</button>
                <button type="button" class="support-send-btn" id="customerSavedAddressConfirmLocation" style="display: none;">Confirmar y guardar</button>
            </div>
            <p class="support-field-hint">Verifica que el marcador esté en la ubicación correcta antes de guardar.</p>
        </div>
    `;

    document.body.appendChild(mapModal);

    customerRegisterUI.savedAddressMapModal = mapModal;
    customerRegisterUI.savedAddressMapUI = {
        modal: mapModal,
        close: mapModal.querySelector('.support-modal-close'),
        mapContainer: mapModal.querySelector('#customerSavedAddressMapContainer'),
        statusText: mapModal.querySelector('#customerMapStatusText'),
        useLocationButton: mapModal.querySelector('#customerSavedAddressUseLocation'),
        confirmButton: mapModal.querySelector('#customerSavedAddressConfirmLocation'),
        savedAddressMap: null,
        capturedLatitude: null,
        capturedLongitude: null
    };

    customerRegisterUI.savedAddressMapUI.close.addEventListener('click', closeCustomerSavedAddressMapModal);
    customerRegisterUI.savedAddressMapUI.useLocationButton.addEventListener('click', handleSavedAddressUseLocation);
    customerRegisterUI.savedAddressMapUI.confirmButton.addEventListener('click', handleConfirmSavedAddressLocation);

    initializeCustomerSavedAddressMap();
    syncBodyScrollLock();
}

function openCustomerSavedAddressMapPanel(index = null) {
    if (!customerRegisterUI) {
        return;
    }

    if (Number.isFinite(index) && customerRegisterUI.savedAddressesData[index]) {
        customerRegisterUI.selectedSavedAddressIndex = index;
    }

    createCustomerSavedAddressMapModal();

    if (customerRegisterUI.savedAddressMapUI?.savedAddressMap && typeof customerRegisterUI.savedAddressMapUI.savedAddressMap.invalidateSize === 'function') {
        setTimeout(() => customerRegisterUI.savedAddressMapUI.savedAddressMap.invalidateSize(), 50);
    }
}

function closeCustomerSavedAddressMapModal() {
    if (!customerRegisterUI?.savedAddressMapModal) {
        return;
    }

    customerRegisterUI.savedAddressMapModal.remove();
    customerRegisterUI.savedAddressMapModal = null;
    customerRegisterUI.savedAddressMapUI = null;
    syncBodyScrollLock();
}

function handleSavedAddressEditorInput(event) {
    const target = event.target;
    if (!customerRegisterUI || !target.matches('.customerSavedAddressInput')) {
        return;
    }

    const index = Number(target.dataset.addressIndex);
    const addresses = customerRegisterUI.savedAddressesData || [];
    if (Number.isNaN(index) || !addresses[index]) {
        return;
    }

    addresses[index].address = String(target.value || '').trim();
}

function handleSavedAddressEditorAction(event) {
    if (!customerRegisterUI) {
        return;
    }

    const button = event.target.closest('button[data-address-index]');
    if (!button) {
        return;
    }

    const index = Number(button.dataset.addressIndex);
    const addresses = customerRegisterUI.savedAddressesData || [];
    if (Number.isNaN(index) || !addresses[index]) {
        return;
    }

    if (button.classList.contains('customerSavedAddressRemoveButton')) {
        addresses.splice(index, 1);
        if (customerRegisterUI.selectedSavedAddressIndex >= addresses.length) {
            customerRegisterUI.selectedSavedAddressIndex = Math.max(0, addresses.length - 1);
        }
        renderCustomerRegisterSavedAddresses();
        return;
    }

    if (button.classList.contains('customerSavedAddressSelectButton')) {
        openCustomerSavedAddressMapPanel(index);
        return;
    }
}

function handleSavedAddressEditorChange(event) {
    if (!customerRegisterUI) {
        return;
    }

    const target = event.target;
    if (target.name === 'customerSavedAddressPrimary') {
        const index = Number(target.value);
        const addresses = customerRegisterUI.savedAddressesData || [];
        if (Number.isNaN(index) || !addresses[index]) {
            return;
        }

        addresses.forEach((entry, entryIndex) => {
            entry.primary = entryIndex === index;
        });
        customerRegisterUI.selectedSavedAddressIndex = index;
        renderCustomerRegisterSavedAddresses();
    }
}

function initializeCustomerSavedAddressMap() {
    if (!customerRegisterUI || !customerRegisterUI.savedAddressMapUI || !customerRegisterUI.savedAddressMapUI.mapContainer) {
        return;
    }

    const mapContainer = customerRegisterUI.savedAddressMapUI.mapContainer;
    const map = L.map(mapContainer).setView([0, 0], 2);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    const marker = L.marker([0, 0], { draggable: false });
    marker.addTo(map);
    marker.remove();

    map.on('click', (event) => {
        setCustomerSavedAddressMapLocation(event.latlng.lat, event.latlng.lng);
    });

    customerRegisterUI.savedAddressMapUI.savedAddressMap = map;
    customerRegisterUI.savedAddressMapUI.savedAddressMarker = marker;
}

function updateCustomerSavedAddressMap(latitude, longitude) {
    if (!customerRegisterUI || !customerRegisterUI.savedAddressMapUI || !customerRegisterUI.savedAddressMapUI.savedAddressMap || !customerRegisterUI.savedAddressMapUI.savedAddressMarker) {
        return;
    }

    const map = customerRegisterUI.savedAddressMapUI.savedAddressMap;
    const marker = customerRegisterUI.savedAddressMapUI.savedAddressMarker;

    if (latitude === null || longitude === null) {
        marker.remove();
        map.setView([0, 0], 2);
        return;
    }

    marker.setLatLng([latitude, longitude]);
    if (!map.hasLayer(marker)) {
        marker.addTo(map);
    }
    map.flyTo([latitude, longitude], 16);
}

function setCustomerSavedAddressMapLocation(latitude, longitude) {
    if (!customerRegisterUI) {
        return;
    }

    const index = customerRegisterUI.selectedSavedAddressIndex;
    const addresses = customerRegisterUI.savedAddressesData || [];
    if (!addresses[index]) {
        return;
    }

    addresses[index].latitude = Number.isFinite(Number(latitude)) ? Number(latitude) : null;
    addresses[index].longitude = Number.isFinite(Number(longitude)) ? Number(longitude) : null;
    renderCustomerRegisterSavedAddresses();
}

function requestCustomerSavedAddressGeolocation() {
    if (!customerRegisterUI || !navigator.geolocation) {
        return;
    }

    navigator.geolocation.getCurrentPosition((position) => {
        setCustomerSavedAddressMapLocation(position.coords.latitude, position.coords.longitude);
    }, (error) => {
        if (customerRegisterUI) {
            customerRegisterUI.feedback.textContent = 'No se pudo obtener tu ubicacion. Asegurate de permitir el acceso al GPS.';
        }
    }, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
    });
}

function handleSavedAddressUseLocation() {
    if (!customerRegisterUI || !navigator.geolocation) {
        return;
    }

    navigator.geolocation.getCurrentPosition((position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        customerRegisterUI.savedAddressMapUI.capturedLatitude = lat;
        customerRegisterUI.savedAddressMapUI.capturedLongitude = lng;
        
        updateCustomerSavedAddressMap(lat, lng);
        
        customerRegisterUI.savedAddressMapUI.statusText.textContent = `✓ Ubicación capturada. Verifica que el marcador sea correcto y toca "Confirmar y guardar".`;
        customerRegisterUI.savedAddressMapUI.useLocationButton.style.display = 'none';
        customerRegisterUI.savedAddressMapUI.confirmButton.style.display = 'block';
    }, (error) => {
        customerRegisterUI.savedAddressMapUI.statusText.textContent = '❌ No se pudo obtener tu ubicación. Asegúrate de permitir el acceso al GPS.';
    }, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
    });
}

function handleConfirmSavedAddressLocation() {
    if (!customerRegisterUI || !customerRegisterUI.savedAddressMapUI) {
        return;
    }

    const lat = customerRegisterUI.savedAddressMapUI.capturedLatitude;
    const lng = customerRegisterUI.savedAddressMapUI.capturedLongitude;
    
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return;
    }
    
    setCustomerSavedAddressMapLocation(lat, lng);
    closeCustomerSavedAddressMapModal();
}

function closeCustomerDeleteAccountModal() {
    if (!customerDeleteAccountUI) {
        return;
    }

    customerDeleteAccountUI.modal.remove();
    customerDeleteAccountUI = null;
    syncBodyScrollLock();
}

function closeCustomerPasswordResetModal() {
    if (!customerPasswordResetUI) {
        return;
    }

    customerPasswordResetUI.modal.remove();
    customerPasswordResetUI = null;
    syncBodyScrollLock();
}

async function fetchClientProfileForRecovery(phoneValue = '') {
    const phoneDigits = normalizePhoneDigits(phoneValue);
    if (phoneDigits.length < 10) {
        throw new Error('Escribe un numero de WhatsApp valido.');
    }

    const db = getPublicFirebaseDb();
    const directSnapshot = await db.collection(CLIENTS_COLLECTION).doc(`phone_${phoneDigits}`).get();
    if (directSnapshot.exists) {
        return normalizeCustomerProfile({ id: directSnapshot.id, ...directSnapshot.data() }, directSnapshot.id);
    }

    const fallbackSnapshot = await db.collection(CLIENTS_COLLECTION)
        .where('customerPhoneDigits', '==', phoneDigits)
        .limit(1)
        .get();

    if (!fallbackSnapshot.empty) {
        const doc = fallbackSnapshot.docs[0];
        return normalizeCustomerProfile({ id: doc.id, ...doc.data() }, doc.id);
    }

    return null;
}

async function submitCustomerNewPassword() {
    if (!customerPasswordResetUI?.feedback) {
        return;
    }

    const profile = customerPasswordResetUI.profile;
    const pinValue = String(customerPasswordResetUI.pin?.value || '').trim();
    const confirmPinValue = String(customerPasswordResetUI.confirmPin?.value || '').trim();
    customerPasswordResetUI.feedback.textContent = '';

    try {
        const savedProfile = await saveCustomerProfile({
            customerName: profile?.customerName || '',
            customerPhone: profile?.customerPhone || profile?.customerPhoneDigits || '',
            address: profile?.address || '',
            pin: pinValue,
            confirmPin: confirmPinValue,
            acceptedDataPolicy: true
        });

        setActiveCustomerProfile(savedProfile);
        closeCustomerPasswordResetModal();
        closeCustomerAuthModal();
    } catch (error) {
        customerPasswordResetUI.feedback.textContent = error.message || 'No se pudo actualizar la contrasena.';
    }
}

function openCustomerPasswordResetModal(profile = {}) {
    closeCustomerPasswordResetModal();

    const resolvedProfile = normalizeCustomerProfile(profile, String(profile.id || ''));
    if (!resolvedProfile?.customerPhoneDigits) {
        return;
    }

    const modal = document.createElement('div');
    modal.id = 'customerPasswordResetModal';
    modal.className = 'support-modal';
    modal.classList.add('is-open');
    modal.innerHTML = `
        <div class="support-modal-card liquid-glass" role="dialog" aria-modal="true" aria-label="Crear nueva contrasena">
            <button type="button" class="support-modal-close" aria-label="Cerrar nueva contrasena">&times;</button>
            <p class="support-modal-kicker">Nueva contrasena</p>
            <h3 class="support-modal-title">Tu contrasena ya fue reiniciada</h3>
            <p class="support-modal-text">Crea una nueva contrasena para volver a entrar con tu numero de WhatsApp.</p>
            <label class="support-field">
                <span>Numero de WhatsApp</span>
                <input type="tel" id="customerResetPhone" value="${escapeHtml(resolvedProfile.customerPhone || resolvedProfile.customerPhoneDigits)}" readonly>
            </label>
            <label class="support-field">
                <span>Nueva contrasena de 6 digitos</span>
                <input type="password" id="customerResetPin" inputmode="numeric" maxlength="6" placeholder="Crea tu nueva contrasena">
            </label>
            <label class="support-field">
                <span>Confirmar nueva contrasena</span>
                <input type="password" id="customerResetConfirmPin" inputmode="numeric" maxlength="6" placeholder="Confirma tu nueva contrasena">
            </label>
            <p class="support-feedback" id="customerResetFeedback"></p>
            <div class="support-actions split">
                <button type="button" class="support-secondary-btn" id="customerResetCancelButton">Cancelar</button>
                <button type="button" class="support-send-btn" id="customerResetSaveButton">Guardar contrasena</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    customerPasswordResetUI = {
        modal,
        profile: resolvedProfile,
        close: modal.querySelector('.support-modal-close'),
        cancel: modal.querySelector('#customerResetCancelButton'),
        save: modal.querySelector('#customerResetSaveButton'),
        pin: modal.querySelector('#customerResetPin'),
        confirmPin: modal.querySelector('#customerResetConfirmPin'),
        feedback: modal.querySelector('#customerResetFeedback')
    };

    customerPasswordResetUI.close?.addEventListener('click', closeCustomerPasswordResetModal);
    customerPasswordResetUI.cancel?.addEventListener('click', closeCustomerPasswordResetModal);
    customerPasswordResetUI.save?.addEventListener('click', submitCustomerNewPassword);

    bindCustomerPinField(customerPasswordResetUI.pin);
    bindCustomerPinField(customerPasswordResetUI.confirmPin);
    attachPasswordToggle(customerPasswordResetUI.pin);
    attachPasswordToggle(customerPasswordResetUI.confirmPin);

    modal.addEventListener('click', (event) => {
        if (event.target === modal && _lastMousedownTarget === modal) {
            closeCustomerPasswordResetModal();
        }
    });

    syncBodyScrollLock();
    customerPasswordResetUI.pin?.focus();
}

async function createCustomerDeleteAccountRequest(reasonValue = '', profile = activeCustomerProfile) {
    const resolvedProfile = normalizeCustomerProfile(profile || activeCustomerProfile || {});
    if (!resolvedProfile?.customerPhoneDigits) {
        throw new Error('No encontramos un perfil valido para eliminar.');
    }

    const reason = String(reasonValue || '').trim();
    if (reason.length < 10) {
        throw new Error('Cuéntanos brevemente por que deseas eliminar la cuenta.');
    }

    const db = getPublicFirebaseDb();
    const body = [
        'El cliente solicito eliminar su cuenta desde la app web.',
        `Motivo: ${reason}`,
        `Nombre: ${resolvedProfile.customerName || 'Cliente sin nombre'}`,
        `WhatsApp: ${resolvedProfile.customerPhone || resolvedProfile.customerPhoneDigits}`,
        `Direccion: ${resolvedProfile.address || 'Sin direccion registrada'}`
    ].join('\n');

    await db.collection(MESSAGES_COLLECTION).add({
        type: 'account_delete_request',
        status: 'pending',
        subject: 'Solicitud de eliminacion de cuenta',
        body,
        customerName: String(resolvedProfile.customerName || '').trim() || 'Cliente sin nombre',
        customerPhone: String(resolvedProfile.customerPhone || '').trim() || resolvedProfile.customerPhoneDigits,
        customerPhoneDigits: resolvedProfile.customerPhoneDigits,
        customerAddress: String(resolvedProfile.address || '').trim(),
        source: 'public_web',
        createdAt: getPublicServerTimestamp(),
        updatedAt: getPublicServerTimestamp()
    });
}

async function submitCustomerDeleteAccountRequest() {
    if (!customerDeleteAccountUI?.feedback || !customerDeleteAccountUI?.reason) {
        return;
    }

    const profile = activeCustomerProfile ? { ...activeCustomerProfile } : null;
    const reasonValue = String(customerDeleteAccountUI.reason.value || '').trim();
    customerDeleteAccountUI.feedback.textContent = '';

    try {
        await createCustomerDeleteAccountRequest(reasonValue, profile);
        const db = getPublicFirebaseDb();
        await db.collection(CLIENTS_COLLECTION).doc(`phone_${profile?.customerPhoneDigits || ''}`).delete();
        clearActiveCustomerProfile();
        closeCustomerDeleteAccountModal();
        closeCustomerAuthModal();
        window.alert('Tu cuenta fue eliminada y la solicitud quedo registrada en ROAL BURGER.');
    } catch (error) {
        customerDeleteAccountUI.feedback.textContent = error.message || 'No se pudo eliminar la cuenta.';
    }
}

function openCustomerDeleteAccountModal() {
    closeCustomerDeleteAccountModal();

    const profile = activeCustomerProfile;
    if (!profile) {
        return;
    }

    const modal = document.createElement('div');
    modal.id = 'customerDeleteAccountModal';
    modal.className = 'support-modal';
    modal.classList.add('is-open');
    modal.innerHTML = `
        <div class="support-modal-card liquid-glass" role="dialog" aria-modal="true" aria-label="Eliminar cuenta">
            <button type="button" class="support-modal-close" aria-label="Cerrar eliminacion de cuenta">&times;</button>
            <p class="support-modal-kicker">Eliminar cuenta</p>
            <h3 class="support-modal-title">Antes de eliminar tu cuenta</h3>
            <p class="support-modal-text">Cuéntanos por que deseas eliminarla. Esta informacion llegara al centro de mensajes del admin.</p>
            <div class="customer-profile-summary">
                <strong>${escapeHtml(profile.customerName)}</strong>
                <span>WhatsApp: ${escapeHtml(profile.customerPhone)}</span>
                <p>${escapeHtml(profile.address || 'Sin direccion principal registrada')}</p>
            </div>
            <label class="support-field">
                <span>Motivo de eliminacion</span>
                <textarea id="customerDeleteReason" rows="5" placeholder="Cuéntanos por que deseas eliminar tu cuenta"></textarea>
            </label>
            <p class="support-feedback" id="customerDeleteFeedback"></p>
            <div class="support-actions split">
                <button type="button" class="support-secondary-btn" id="customerDeleteCancelButton">Cancelar</button>
                <button type="button" class="support-danger-btn" id="customerDeleteConfirmButton">Eliminar cuenta</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    customerDeleteAccountUI = {
        modal,
        close: modal.querySelector('.support-modal-close'),
        cancel: modal.querySelector('#customerDeleteCancelButton'),
        confirm: modal.querySelector('#customerDeleteConfirmButton'),
        reason: modal.querySelector('#customerDeleteReason'),
        feedback: modal.querySelector('#customerDeleteFeedback')
    };

    customerDeleteAccountUI.close?.addEventListener('click', closeCustomerDeleteAccountModal);
    customerDeleteAccountUI.cancel?.addEventListener('click', closeCustomerDeleteAccountModal);
    customerDeleteAccountUI.confirm?.addEventListener('click', submitCustomerDeleteAccountRequest);

    modal.addEventListener('click', (event) => {
        if (event.target === modal && _lastMousedownTarget === modal) {
            closeCustomerDeleteAccountModal();
        }
    });

    syncBodyScrollLock();
    customerDeleteAccountUI.reason?.focus();
}

function activateCustomerProfileTab(tabKey = 'info') {
    if (!customerAuthUI?.tabButtons?.length || !customerAuthUI?.tabPanels?.length) {
        return;
    }

    customerAuthUI.activeTab = tabKey;
    customerAuthUI.tabButtons.forEach((button) => {
        const isActive = button.dataset.profileTab === tabKey;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
    customerAuthUI.tabPanels.forEach((panel) => {
        panel.hidden = panel.dataset.profilePanel !== tabKey;
    });

    if (tabKey === 'mensajes') {
        _markChatMessagesAsSeen();
    }
}

function openCustomerConsentDocument() {
    closeCustomerConsentDocument();

    const modal = document.createElement('div');
    modal.id = 'customerConsentDocumentModal';
    modal.className = 'support-modal';
    modal.classList.add('is-open');
    modal.innerHTML = `
        <div class="support-modal-card liquid-glass support-consent-modal-card" role="dialog" aria-modal="true" aria-label="Autorizacion de tratamiento de datos">
            <button type="button" class="support-modal-close" aria-label="Cerrar autorizacion">&times;</button>
            <p class="support-modal-kicker">Autorizacion de datos</p>
            <h3 class="support-modal-title">Lee este documento antes de continuar</h3>
            <p class="support-modal-text">Para crear tu perfil debes conocer y autorizar expresamente el tratamiento de tus datos personales por parte de ROAL BURGER.</p>
            <div class="support-consent-document-frame-wrap">
                <iframe src="${CUSTOMER_CONSENT_POLICY_URL}" title="Politica de tratamiento de datos personales" class="support-consent-document-frame"></iframe>
            </div>
            <p class="support-field-hint">Si prefieres abrirlo aparte, <a href="${CUSTOMER_CONSENT_POLICY_URL}" target="_blank" rel="noopener noreferrer">puedes verlo en una pestaña nueva</a>.</p>
            <div class="support-actions split">
                <button type="button" class="support-secondary-btn" id="customerConsentCloseButton">Cerrar</button>
                <button type="button" class="support-send-btn" id="customerConsentAcceptButton">He leido y autorizo</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    customerConsentDocumentUI = {
        modal,
        close: modal.querySelector('.support-modal-close'),
        closeButton: modal.querySelector('#customerConsentCloseButton'),
        acceptButton: modal.querySelector('#customerConsentAcceptButton')
    };

    customerConsentDocumentUI.close?.addEventListener('click', closeCustomerConsentDocument);
    customerConsentDocumentUI.closeButton?.addEventListener('click', closeCustomerConsentDocument);
    customerConsentDocumentUI.acceptButton?.addEventListener('click', () => {
        applyCustomerConsentState(true);
        closeCustomerConsentDocument();
    });

    modal.addEventListener('click', (event) => {
        if (event.target === modal && _lastMousedownTarget === modal) {
            closeCustomerConsentDocument();
        }
    });

    syncBodyScrollLock();
}

async function requestPublicNotificationPermission() {
    const installHint = document.getElementById('installShortcutHint');
    if (typeof Notification === 'undefined') {
        if (installHint) {
            installHint.hidden = false;
            installHint.textContent = 'Tu navegador no permite activar notificaciones desde este dispositivo.';
        }
        return 'unsupported';
    }

    if (Notification.permission === 'granted') {
        if (installHint) {
            installHint.hidden = false;
            installHint.textContent = 'Notificaciones activadas para novedades y promociones de ROAL BURGER.';
        }
        return 'granted';
    }

    if (Notification.permission === 'denied') {
        if (installHint) {
            installHint.hidden = false;
            installHint.textContent = 'Las notificaciones estan bloqueadas. Si luego quieres activarlas, puedes hacerlo desde la configuracion del navegador.';
        }
        return 'denied';
    }

    try {
        const permission = await Notification.requestPermission();
        if (installHint) {
            installHint.hidden = false;
            installHint.textContent = permission === 'granted'
                ? 'Notificaciones activadas para novedades y promociones de ROAL BURGER.'
                : 'Puedes seguir usando la app sin notificaciones. Si cambias de opinion, podras activarlas mas adelante.';
        }
        return permission;
    } catch (error) {
        if (installHint) {
            installHint.hidden = false;
            installHint.textContent = 'No pudimos solicitar permisos de notificacion en este momento.';
        }
        return 'error';
    }
}

function buildCustomerPasswordResetMessage(phoneValue = '') {
    const phoneDigits = normalizePhoneDigits(phoneValue);
    return [
        'Hola ROAL BURGER, olvide la contrasena de mi perfil web.',
        phoneDigits ? `Mi numero de WhatsApp es: ${phoneDigits}` : 'Necesito ayuda para recuperar el acceso a mi cuenta.',
        'Por favor ayudame a restablecer mi contrasena.'
    ].join('\n');
}

async function createCustomerPasswordResetRequest(phoneValue = '') {
    const customerPhone = String(phoneValue || '').trim();
    const customerPhoneDigits = normalizePhoneDigits(customerPhone);

    if (customerPhoneDigits.length < 10) {
        throw new Error('Escribe tu numero de WhatsApp para solicitar el reinicio.');
    }

    const db = getPublicFirebaseDb();
    const messageBody = buildCustomerPasswordResetMessage(customerPhone);
    const existingProfile = await db.collection(CLIENTS_COLLECTION).doc(`phone_${customerPhoneDigits}`).get();
    const profileData = existingProfile.exists ? existingProfile.data() : {};

    await db.collection(MESSAGES_COLLECTION).add({
        type: 'password_reset_request',
        status: 'pending',
        subject: 'Solicitud de reinicio de contrasena',
        body: messageBody,
        customerName: String(profileData.customerName || '').trim() || 'Cliente sin nombre',
        customerPhone,
        customerPhoneDigits,
        customerAddress: String(profileData.address || '').trim(),
        source: 'public_web',
        createdAt: getPublicServerTimestamp(),
        updatedAt: getPublicServerTimestamp()
    });
}

async function requestCustomerPasswordReset() {
    if (!customerAuthUI?.feedback && !customerRegisterUI?.feedback) {
        return;
    }

    const feedbackTarget = customerAuthUI?.feedback || customerRegisterUI?.feedback;
    const phoneValue = String(customerAuthUI?.lookupPhone?.value || customerRegisterUI?.registerPhone?.value || customerAuthUI?.registerPhone?.value || '').trim();
    feedbackTarget.textContent = '';

    try {
        const profile = await fetchClientProfileForRecovery(phoneValue);
        if (profile && !profile.passwordHash) {
            openCustomerPasswordResetModal(profile);
            feedbackTarget.textContent = 'Tu contrasena ya fue reiniciada. Crea una nueva para continuar.';
            return;
        }

        await createCustomerPasswordResetRequest(phoneValue);
        feedbackTarget.textContent = 'Tu solicitud fue enviada al admin. En breve te contactaremos para reiniciar la contrasena.';
    } catch (error) {
        feedbackTarget.textContent = error.message || 'No se pudo enviar la solicitud.';
    }
}

async function submitCustomerLookup() {
    if (!customerAuthUI?.lookupPhone || !customerAuthUI?.lookupPin || !customerAuthUI?.feedback) {
        return;
    }

    const feedback   = customerAuthUI.feedback;
    const btn        = customerAuthUI.lookupButton;
    const phoneField = customerAuthUI.lookupPhone;
    const pinField   = customerAuthUI.lookupPin;

    const phoneValue = String(phoneField.value || '').trim();
    const pinValue   = String(pinField.value || '').trim();

    // Limpiar estado previo
    feedback.textContent = '';
    feedback.className = 'support-feedback';
    phoneField.closest('.support-field')?.classList.remove('support-field--error');
    pinField.closest('.support-field')?.classList.remove('support-field--error');

    // Helper de error (definido antes de usarlo)
    const _showError = (msg, field) => {
        feedback.textContent = msg;
        feedback.className = 'support-feedback support-feedback--error';
        void feedback.offsetWidth; // forzar reflow para reiniciar la animación
        feedback.classList.add('support-feedback--shake');
        feedback.addEventListener('animationend', () => feedback.classList.remove('support-feedback--shake'), { once: true });
        if (field) field.closest('.support-field')?.classList.add('support-field--error');
        feedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        if (btn) { btn.disabled = false; btn.textContent = 'Entrar'; }
    };

    // Validación local inmediata (evita round-trip al servidor)
    const phoneDigits = phoneValue.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
        _showError('Escribe un numero de WhatsApp valido (minimo 10 digitos).', phoneField);
        return;
    }
    if (!pinValue) {
        _showError('Escribe tu contrasena de 6 digitos.', pinField);
        return;
    }

    // Estado de carga — botón bloqueado mientras consulta Firebase
    if (btn) { btn.disabled = true; btn.textContent = 'Verificando…'; }

    try {
        const profile = await fetchClientProfileByPhone(phoneValue, pinValue);
        if (!profile) {
            _showError('No encontramos una cuenta con ese numero. Si no tienes cuenta, pulsa Registrarse.', phoneField);
            return;
        }
        setActiveCustomerProfile(profile);
        closeCustomerAuthModal();
    } catch (error) {
        if (error?.code === 'PASSWORD_RESET_REQUIRED') {
            if (btn) { btn.disabled = false; btn.textContent = 'Entrar'; }
            openCustomerPasswordResetModal(error.profile || { customerPhone: phoneValue });
            if (customerAuthUI?.feedback) {
                customerAuthUI.feedback.textContent = error.message || 'Debes crear una nueva contrasena para continuar.';
                customerAuthUI.feedback.className = 'support-feedback support-feedback--error';
            }
            return;
        }
        const isWrongPin = String(error.message || '').toLowerCase().includes('contrase');
        _showError(error.message || 'No se pudo abrir el perfil. Intentalo de nuevo.', isWrongPin ? pinField : phoneField);
    }
}

async function submitCustomerProfileForm() {
    const formUI = getCustomerProfileFormUI();
    if (!formUI?.feedback) {
        return;
    }

    if (!formUI.consentViewed && !formUI.hasPreviousConsent) {
        formUI.feedback.textContent = 'Primero debes leer y aceptar la autorizacion de tratamiento de datos.';
        formUI.reviewConsentButton?.focus();
        return;
    }

    const nameValue = String(formUI.name?.value || activeCustomerProfile?.customerName || '').trim();
    const savedAddressesValue = getCustomerSavedAddressesFromEditor();
    const primaryAddressEntry = getCustomerPrimarySavedAddressFromEditor();
    const addressValue = String(primaryAddressEntry?.address || activeCustomerProfile?.address || '').trim();
    const phoneValue = String(formUI.registerPhone?.value || activeCustomerProfile?.customerPhone || '').trim();
    const pinValue = String(formUI.registerPin?.value || '').trim();
    const confirmPinValue = String(formUI.confirmPin?.value || '').trim();
    const acceptedDataPolicy = Boolean(formUI.consent?.checked);

    formUI.feedback.textContent = '';

    if (!addressValue) {
        formUI.feedback.textContent = 'Debes registrar al menos una direccion principal en tu perfil.';
        return;
    }

    try {
        const profile = await saveCustomerProfile({
            customerName: nameValue,
            customerPhone: phoneValue,
            address: addressValue,
            savedAddresses: savedAddressesValue,
            pin: pinValue,
            confirmPin: confirmPinValue,
            acceptedDataPolicy
        });

        setActiveCustomerProfile(profile);
        closeCustomerRegisterModal();
        closeCustomerAuthModal();
    } catch (error) {
        formUI.feedback.textContent = error.message || 'No se pudo guardar el perfil.';
    }
}

function openCustomerAuthModal() {
    closeCustomerAuthModal();

    const screen  = document.getElementById('perfilScreen');
    const contentEl = document.getElementById('perfilContent');
    if (!screen || !contentEl) return;

    const profile = activeCustomerProfile;
    const savedAddresses = getCustomerSavedAddresses(profile);
    const hasConsent = Boolean(profile?.privacyConsentAccepted) && Boolean(profile?.marketingConsentAccepted);
    const consentMarkup = `${escapeHtml(CUSTOMER_CONSENT_COPY)} <a href="${CUSTOMER_CONSENT_POLICY_URL}" target="_blank" rel="noopener noreferrer">Ver politica de tratamiento de datos personales</a>.`;

    const titleEl = document.getElementById('perfilScreenTitle');
    if (titleEl) titleEl.textContent = profile ? 'Cuenta' : 'Mi Perfil';

    _enterScreen('perfilScreen');
    screen.hidden = false;
    screen.classList.add('is-open');

    const modal = contentEl;
    const _rawName  = String(profile?.customerName || '').trim();
    const _nameIsPhone = /^\d+$/.test(_rawName);
    const _name    = escapeHtml(_nameIsPhone || !_rawName ? 'Mi perfil' : _rawName);
    const _phone   = escapeHtml(profile?.customerPhone || '');
    const _avatarIcon = `<svg viewBox="0 0 24 24" fill="currentColor" width="36" height="36" aria-hidden="true"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>`;
    const _chevron = `<svg class="cp-menu-chevron" viewBox="0 0 24 24" fill="currentColor" width="18" height="18" aria-hidden="true"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>`;
    const _back    = `<button type="button" class="cp-panel-back" data-profile-tab="info" aria-label="Volver a Cuenta">
        <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" aria-hidden="true"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
        Cuenta
    </button>`;

    modal.innerHTML = profile
        ? `
            <div class="cp-wrap" role="main" aria-label="Perfil de cuenta">

                <!-- Tabs ocultos para mantener el sistema de activación JS -->
                <div hidden aria-hidden="true" style="display:none!important">
                    <button class="customer-profile-tab is-active" data-profile-tab="info" aria-selected="true">Info</button>
                    <button class="customer-profile-tab" data-profile-tab="pedidos" aria-selected="false">Pedidos</button>
                    <button class="customer-profile-tab" data-profile-tab="mensajes" aria-selected="false">Mensajes</button>
                </div>

                <!-- Panel principal: menú de cuenta -->
                <div class="customer-profile-panel" data-profile-panel="info">
                    <!-- Hero -->
                    <div class="cp-hero liquid-glass">
                        <div class="cp-avatar">${_avatarIcon}</div>
                        <div class="cp-hero-info">
                            <span class="cp-hero-name">${_name}</span>
                            ${_phone ? `<span class="cp-hero-phone">${_phone}</span>` : ''}
                        </div>
                    </div>

                    <!-- Lista de opciones -->
                    <div class="cp-menu-card liquid-glass">
                        <button type="button" class="cp-menu-item" data-profile-tab="pedidos">
                            <span class="cp-menu-icon" aria-hidden="true">
                                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-5 14H7v-2h6v2zm3-4H7v-2h9v2zm0-4H7V6h9v2z"/></svg>
                            </span>
                            <span class="cp-menu-label">Mis pedidos</span>
                            ${_chevron}
                        </button>
                        <button type="button" class="cp-menu-item" id="customerEditProfileButtonAlt">
                            <span class="cp-menu-icon" aria-hidden="true">
                                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                            </span>
                            <span class="cp-menu-label">Editar perfil</span>
                            ${_chevron}
                        </button>
                        <button type="button" class="cp-menu-item" id="customerReviewAddressesButton">
                            <span class="cp-menu-icon" aria-hidden="true">
                                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                            </span>
                            <span class="cp-menu-label">Mis direcciones</span>
                            ${_chevron}
                        </button>
                        <button type="button" class="cp-menu-item" data-profile-tab="mensajes">
                            <span class="cp-menu-icon" aria-hidden="true">
                                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/></svg>
                            </span>
                            <span class="cp-menu-label">Mensajes</span>
                            ${_chevron}
                        </button>
                        <button type="button" class="cp-menu-item" id="customerReviewConsentButton">
                            <span class="cp-menu-icon" aria-hidden="true">
                                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg>
                            </span>
                            <span class="cp-menu-label">Tratamiento de datos${!hasConsent ? ' <span style="color:#f59e0b;font-size:0.72rem;font-weight:700;">● Pendiente</span>' : ''}</span>
                            ${_chevron}
                        </button>
                    </div>

                    <!-- Cerrar sesión -->
                    <div class="cp-menu-card liquid-glass">
                        <button type="button" class="cp-menu-item cp-menu-item--danger" id="customerLogoutButton">
                            <span class="cp-menu-icon" aria-hidden="true">
                                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg>
                            </span>
                            <span class="cp-menu-label">Cerrar sesión</span>
                        </button>
                    </div>

                    <button type="button" class="cp-delete-link" id="customerDeleteAccountButton">Eliminar cuenta</button>
                    <p class="support-feedback" id="customerAuthFeedback"></p>
                </div>

                <!-- Panel: Mis pedidos -->
                <div class="customer-profile-panel" data-profile-panel="pedidos" hidden>
                    ${_back}
                    <div class="customer-profile-section-title">
                        <strong>Pedido en curso</strong>
                        <span>Seguimiento en tiempo real segun los movimientos del admin.</span>
                    </div>
                    <div id="customerOrdersCurrent"></div>
                    <div class="customer-profile-section-title">
                        <strong>Historial de pedidos</strong>
                        <span>Aqui ves todos tus pedidos con el detalle principal.</span>
                    </div>
                    <div class="customer-order-history-list" id="customerOrdersHistory"></div>
                </div>

                <!-- Panel: Mensajes -->
                <div class="customer-profile-panel" data-profile-panel="mensajes" hidden>
                    ${_back}
                    <div class="customer-chat-panel">
                        <div class="customer-chat-header">
                            <div class="customer-chat-avatar">R</div>
                            <div class="customer-chat-header-info">
                                <div class="customer-chat-header-name">ROAL BURGER</div>
                                <div class="customer-chat-header-status">Respondemos por aquí y por WhatsApp</div>
                            </div>
                        </div>
                        <div class="customer-messages-thread" id="customerMessagesThread"></div>
                        <p class="customer-chat-feedback" id="customerMessageFeedback"></p>
                        <div class="customer-chat-reply-bar">
                            <textarea class="customer-chat-input" id="customerMessageInput" rows="1" placeholder="Escribe un mensaje…" maxlength="500"></textarea>
                            <button type="button" class="customer-chat-send-btn" id="customerSendMessageButton" title="Enviar">➤</button>
                        </div>
                    </div>
                </div>

            </div>
        `
        : `
            <div class="support-modal-card liquid-glass" role="dialog" aria-modal="true" aria-label="Iniciar sesion o registrarte">
                <p class="support-modal-kicker">Mi cuenta</p>
                <h3 class="support-modal-title">Inicia sesion</h3>
                <p class="support-modal-text">Escribe tu numero de WhatsApp y tu contrasena de 6 digitos para abrir tu perfil.</p>
                <label class="support-field">
                    <span>Ingresar con WhatsApp</span>
                    <input type="tel" id="customerLookupPhone" placeholder="Escribe tu numero de WhatsApp">
                </label>
                <label class="support-field">
                    <span>Contrasena de 6 digitos</span>
                    <input type="password" id="customerLookupPin" inputmode="numeric" maxlength="6" placeholder="Escribe tu contrasena">
                </label>
                <p class="support-feedback" id="customerAuthFeedback" role="alert" aria-live="polite"></p>
                <div class="support-actions stack">
                    <button type="button" class="support-send-btn" id="customerLookupButton">Entrar</button>
                    <div class="support-actions split">
                        <button type="button" class="support-secondary-btn" id="customerForgotPasswordButton">Olvido contrasena</button>
                        <button type="button" class="support-secondary-btn" id="customerRegisterToggle">Registrarse</button>
                    </div>
                </div>
            </div>
        `;

    customerAuthUI = {
        modal: screen,
        close: null,
        feedback: modal.querySelector('#customerAuthFeedback'),
        lookupPhone: modal.querySelector('#customerLookupPhone'),
        lookupPin: modal.querySelector('#customerLookupPin'),
        lookupButton: modal.querySelector('#customerLookupButton'),
        forgotPasswordButton: modal.querySelector('#customerForgotPasswordButton'),
        registerToggle: modal.querySelector('#customerRegisterToggle'),
        reviewConsentButton: modal.querySelector('#customerReviewConsentButton'),
        editProfileButton: modal.querySelector('#customerEditProfileButton'),
        editProfileButtonAlt: modal.querySelector('#customerEditProfileButtonAlt'),
        reviewAddressesButton: modal.querySelector('#customerReviewAddressesButton'),
        deleteAccountButton: modal.querySelector('#customerDeleteAccountButton'),
        tabButtons: Array.from(modal.querySelectorAll('[data-profile-tab]')),
        tabPanels: Array.from(modal.querySelectorAll('[data-profile-panel]')),
        ordersCurrent: modal.querySelector('#customerOrdersCurrent'),
        ordersHistory: modal.querySelector('#customerOrdersHistory'),
        messagesThread: modal.querySelector('#customerMessagesThread'),
        messageInput: modal.querySelector('#customerMessageInput'),
        sendMessageButton: modal.querySelector('#customerSendMessageButton'),
        messageFeedback: modal.querySelector('#customerMessageFeedback'),
        logout: modal.querySelector('#customerLogoutButton'),
        hasPreviousConsent: hasConsent,
        consentViewed: hasConsent
    };

    // El botón de cierre es perfilCloseBtn en el cds-header, wired en el init
    customerAuthUI.lookupButton?.addEventListener('click', submitCustomerLookup);
    customerAuthUI.forgotPasswordButton?.addEventListener('click', requestCustomerPasswordReset);
    customerAuthUI.registerToggle?.addEventListener('click', () => openCustomerRegisterModal({ customerPhone: customerAuthUI.lookupPhone?.value || '' }));
    customerAuthUI.reviewConsentButton?.addEventListener('click', openCustomerConsentDocument);
    const openEditProfile = () => {
        const currentProfile = activeCustomerProfile ? { ...activeCustomerProfile } : {};
        closeCustomerAuthModal();
        openCustomerRegisterModal(currentProfile, {
            title: 'Editar perfil',
            description: 'Actualiza tu nombre, direccion, WhatsApp y contrasena desde esta pantalla.',
            saveLabel: 'Guardar perfil'
        });
    };
    customerAuthUI.editProfileButton?.addEventListener('click', openEditProfile);
    customerAuthUI.editProfileButtonAlt?.addEventListener('click', openEditProfile);
    customerAuthUI.reviewAddressesButton?.addEventListener('click', openEditProfile);
    customerAuthUI.deleteAccountButton?.addEventListener('click', openCustomerDeleteAccountModal);
    customerAuthUI.sendMessageButton?.addEventListener('click', submitCustomerDirectMessage);
    customerAuthUI.tabButtons?.forEach((button) => {
        button.addEventListener('click', () => activateCustomerProfileTab(button.dataset.profileTab || 'info'));
    });
    customerAuthUI.logout?.addEventListener('click', () => {
        clearActiveCustomerProfile();
        closeCustomerAuthModal();
    });
    bindCustomerPinField(customerAuthUI.lookupPin);
    attachPasswordToggle(customerAuthUI.lookupPin);

    // Enter en cualquiera de los dos campos dispara el login
    const _onLoginEnter = (e) => { if (e.key === 'Enter') { e.preventDefault(); submitCustomerLookup(); } };
    customerAuthUI.lookupPhone?.addEventListener('keydown', _onLoginEnter);
    customerAuthUI.lookupPin?.addEventListener('keydown', _onLoginEnter);

    // Pantalla completa — sin handler de clic-fuera

    syncBodyScrollLock();
    if (profile) {
        activateCustomerProfileTab('info');
        renderCustomerOrdersPanel();
        renderCustomerMessagesPanel();
    }
    // Foco inicial: campo de teléfono si no hay sesión, nada si ya hay perfil (evita teclado inesperado en mobile)
    if (!profile) {
        setTimeout(() => customerAuthUI?.lookupPhone?.focus(), 80);
    }
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
    control.classList.toggle('is-ordering-closed', !availability.isOpen);
    control.title = availability.isOpen ? '' : availability.statusLabel;

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
const RECOMMENDED_DAY_SERIAL_KEY = 'roalburger-recommended-day-serial';
const RECOMMENDED_DAY_EXCLUDED_CATEGORY_PARTS = ['bebidas y adicionales', 'adicionales', 'bebidas', 'nuestras salsas', 'entradas'];
const MANUAL_IMAGE_BASE_PRICES = {
    './burgerpremium/burgercaracas.png': 26000,
    './burgerpremium/burgercordillera.png': 34000,
    './burgerpremium/burgerpapuda.png': 20000,
    './burgerpremium/burgerplus.png': 30000,
    './burgerpremium/burgerranchera.png': 30000,
    './burgerpremium/burgertriplete.png': 29000,
    './burgerclasicas/burgersuper.png': 19000,
    './burgerclasicas/burgernormal.png': 17000,
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

    if (/^(https?:)?\/\//i.test(normalized) || normalized.startsWith('data:') || normalized.startsWith('blob:')) {
        return normalized;
    }

    if (normalized.startsWith('/')) {
        return normalized;
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

let deferredInstallPrompt = null;

function getOfficialMenuUrl() {
    return document.querySelector('link[rel="canonical"]')?.href || window.location.href;
}

function isMobileDevice() {
    return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '');
}

function isIOSDevice() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent || '') || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function updateShortcutInstallUI() {
    const button = document.getElementById('installShortcutButton');
    const text = document.getElementById('installShortcutButtonText');
    const hint = document.getElementById('installShortcutHint');
    if (!button || !text || !hint) {
        return;
    }

    hint.hidden = true;

    if (deferredInstallPrompt) {
        text.textContent = 'Instalar acceso directo';
        return;
    }

    if (isMobileDevice()) {
        text.textContent = 'Guardar en tu movil';
        return;
    }

    text.textContent = 'Descargar acceso directo';
}

function downloadDesktopShortcut() {
    const url = getOfficialMenuUrl();
    const iconUrl = new URL('/isotipo.png', url).href;
    const shortcutContent = `[InternetShortcut]\r\nURL=${url}\r\nIconFile=${iconUrl}\r\nIconIndex=0\r\n`;
    const blob = new Blob([shortcutContent], { type: 'application/internet-shortcut' });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = 'ROAL BURGER.url';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
}

async function handleShortcutInstall() {
    const url = getOfficialMenuUrl();

    if (deferredInstallPrompt) {
        deferredInstallPrompt.prompt();
        const choiceResult = await deferredInstallPrompt.userChoice.catch(() => null);
        deferredInstallPrompt = null;
        updateShortcutInstallUI();
        if (choiceResult?.outcome === 'accepted') {
            await requestPublicNotificationPermission();
        }
        return;
    }

    if (!isMobileDevice()) {
        downloadDesktopShortcut();
        await requestPublicNotificationPermission();
        return;
    }

    if (navigator.share) {
        try {
            await navigator.share({
                title: 'ROAL BURGER',
                text: 'Guarda el enlace oficial de ROAL BURGER.',
                url
            });
            return;
        } catch (error) {
            // Continua con el siguiente fallback si el navegador cancela la accion.
        }
    }

    if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url).catch(() => null);
    }

    window.alert(isIOSDevice()
        ? 'El enlace oficial ya esta listo. En iPhone o iPad abre Compartir y luego Anadir a pantalla de inicio.'
        : 'El enlace oficial ya esta listo. Si tu navegador no ofrece instalar, abre el menu del navegador y elige Anadir a pantalla de inicio.');

    await requestPublicNotificationPermission();
}

function initShortcutInstallUI() {
    const button = document.getElementById('installShortcutButton');
    if (!button || button.dataset.shortcutReady === '1') {
        updateShortcutInstallUI();
        return;
    }

    button.dataset.shortcutReady = '1';
    button.addEventListener('click', handleShortcutInstall);
    updateShortcutInstallUI();
}

window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    updateShortcutInstallUI();
});

window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    updateShortcutInstallUI();
});

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
    const supportModal = supportUI?.modal || document.getElementById('supportModal');
    const isMenuOpen = Boolean(menuModal && menuModal.style.display === 'block');
    const isCartOpen = Boolean(cartUI && cartUI.drawer.classList.contains('is-open'));
    const isSupportOpen = Boolean(supportModal && supportModal.classList.contains('is-open'));
    const isCheckoutOpen = Boolean(checkoutInfoUI && checkoutInfoUI.modal.classList.contains('is-open'));
    const isPaymentFlowOpen = Boolean(paymentFlowUI && paymentFlowUI.modal.classList.contains('is-open'));
    const isOrderSentOpen = Boolean(orderSentConfirmationUI && orderSentConfirmationUI.modal.classList.contains('is-open'));
    const isCustomerAuthOpen = Boolean(customerAuthUI && customerAuthUI.modal.classList.contains('is-open'));
    const isCustomerRegisterOpen = Boolean(customerRegisterUI && customerRegisterUI.modal.classList.contains('is-open'));
    const isCustomerConsentOpen = Boolean(customerConsentDocumentUI && customerConsentDocumentUI.modal.classList.contains('is-open'));
    const isCustomerDeleteOpen = Boolean(customerDeleteAccountUI && customerDeleteAccountUI.modal.classList.contains('is-open'));
    const isCustomerPasswordResetOpen = Boolean(customerPasswordResetUI && customerPasswordResetUI.modal.classList.contains('is-open'));
    document.body.style.overflow = isMenuOpen || isCartOpen || isSupportOpen || isCheckoutOpen || isPaymentFlowOpen || isOrderSentOpen || isCustomerAuthOpen || isCustomerRegisterOpen || isCustomerConsentOpen || isCustomerDeleteOpen || isCustomerPasswordResetOpen ? 'hidden' : 'auto';
}

function normalizeOrderOptions(orderOptions = { type: 'solo' }) {
    const rawStatic = Number(orderOptions.staticPrice);
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
        allowClosedOrder: orderOptions.allowClosedOrder === true,
        staticPrice: Number.isFinite(rawStatic) && rawStatic > 0 ? rawStatic : null,
        promoLabel: String(orderOptions.promoLabel || '').trim(),
        promo2x1: orderOptions.promo2x1 === true
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
        allowClosedOrder: normalized.allowClosedOrder,
        promoLabel: normalized.promoLabel
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
    checkAndPurgeStaleRecommendedCartItems();
}

function checkAndPurgeStaleRecommendedCartItems() {
    try {
        const { year, month, day } = getCurrentBogotaDateParts();
        const todaySerial = Math.floor(Date.UTC(year, month - 1, day) / 86400000);
        const storedSerial = Number(window.localStorage.getItem(RECOMMENDED_DAY_SERIAL_KEY) || 0);

        if (storedSerial && storedSerial !== todaySerial) {
            const before = shoppingCart.length;
            shoppingCart = shoppingCart.filter((item) => !(item.orderOptions && item.orderOptions.recommendedDiscount));
            if (shoppingCart.length < before) {
                saveCartState();
                setTimeout(() => {
                    showCartAddedToast('Carrito actualizado', 'El recomendado del día anterior fue removido');
                }, 2500);
            }
        }

        window.localStorage.setItem(RECOMMENDED_DAY_SERIAL_KEY, String(todaySerial));
    } catch (_e) {}
}

function saveCartState() {
    try {
        window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(shoppingCart));
    } catch (error) {
        // Ignorar si el navegador bloquea storage.
    }
}

function playCartAddSound() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) {
            return;
        }

        if (!window.__roalBurgerCartAudioContext) {
            window.__roalBurgerCartAudioContext = new AudioContext();
        }

        const audioContext = window.__roalBurgerCartAudioContext;
        if (audioContext.state === 'suspended') {
            audioContext.resume().catch(() => {});
        }

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.12, audioContext.currentTime);

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.08);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.08);
    } catch (error) {
        // Silence fallback for browsers without Web Audio support.
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

// Extrae el precio numérico de un objeto producto de forma segura.
// Usa parseLocalizedPrice para manejar strings colombianos ("17.000", "17,000").
// Combos con papas: usa COMBOS_CON_PAPAS_IMAGE_PRICES por imagen (precio 1 persona).
function resolveProductDisplayPrice(product) {
    const imgPath = normalizeImageAssetPath(product.image_url || product.imageUrl || '');
    if (imgPath) {
        const imgKey = imgPath.toLowerCase();
        for (const [k, v] of Object.entries(COMBOS_CON_PAPAS_IMAGE_PRICES)) {
            if (normalizeImageAssetPath(k).toLowerCase() === imgKey) {
                return v[1] || 0;
            }
        }
        const manualKey = Object.keys(MANUAL_IMAGE_BASE_PRICES).find(
            (k) => normalizeImageAssetPath(k).toLowerCase() === imgKey
        );
        if (manualKey) return MANUAL_IMAGE_BASE_PRICES[manualKey];
    }

    const raw = product.precio ?? product.price ?? null;
    return raw !== null ? parseLocalizedPrice(raw) : 0;
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
        const fallback = options[0];
        return parseLocalizedPrice((matched || fallback)?.price ?? null);
    }

    if (normalizedCategoryName.includes('bebidas') || normalizedCategoryName.includes('adicionales')) {
        const options = getBebidasYAdicionalesOptions(productName);
        const matched = options.find((item) => normalizedProductName.includes(normalizeCategoryKey(item.label)));
        return matched ? parseLocalizedPrice(matched.price) : null;
    }

    if (normalizedCategoryName.includes('burger clasicas')) {
        const options = getBurgerClasicasOptions(productName);
        if (options.length) {
            const matched = options.find((item) => normalizedProductName.includes(normalizeCategoryKey(item.label)));
            if (matched) return parseLocalizedPrice(matched.price);
        }
        return null;
    }

    if (normalizedCategoryName.includes('salchipapa')) {
        const options = getSalchipapaOptions(productName);
        if (options.length) {
            const matched = options.find((item) => normalizedProductName.includes(normalizeCategoryKey(item.label)));
            if (matched) return parseLocalizedPrice(matched.price);
        }
        return null;
    }

    return null;
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
    let imagePath = normalizedOptions.imagePath;
    if (!imagePath) {
        return null;
    }

    // Firebase Storage URLs (https://firebasestorage.googleapis.com/…/o/path%2Ffile.png?…)
    // must be resolved to their local-relative path so map lookups work.
    if (/^https?:\/\//i.test(imagePath)) {
        try {
            const oMatch = imagePath.match(/\/o\/([^?#]+)/i);
            if (oMatch) imagePath = decodeURIComponent(oMatch[1]);
        } catch (_) {}
    }

    const normalizedProductName = normalizeCategoryKey(productName);
    // Normalize to forward-slash lowercase for all map lookups
    const normalizedPath = normalizeImageAssetPath(imagePath).toLowerCase();

    const papaKey = Object.keys(COMBOS_CON_PAPAS_IMAGE_PRICES).find(
        (k) => normalizeImageAssetPath(k).toLowerCase() === normalizedPath
    );
    if (papaKey) {
        const peopleCount = Number(normalizedOptions.peopleCount || 0);
        const comboPrice = COMBOS_CON_PAPAS_IMAGE_PRICES[papaKey][peopleCount];
        return comboPrice === undefined ? null : Number(comboPrice);
    }

    if (normalizedOptions.type === 'combo-meal' && normalizedOptions.peopleCount > 0) {
        const normName = normalizeAssetLookup(normalizedProductName);
        let comboKey = null;
        if (normName.includes('papuda')) {
            comboKey = './combosconpapasybebidas/comboburgerpapuda.png';
        } else if (normName.includes('super')) {
            comboKey = './combosconpapasybebidas/comboburgersuper.png';
        } else if (normName.includes('perro')) {
            comboKey = './combosconpapasybebidas/comboperronormal.png';
        } else if (normName.includes('burger') || normName.includes('normal')) {
            comboKey = './combosconpapasybebidas/comboburgernormal.png';
        }
        if (comboKey) {
            const comboPrice = COMBOS_CON_PAPAS_IMAGE_PRICES[comboKey][normalizedOptions.peopleCount];
            if (comboPrice !== undefined) return Number(comboPrice);
        }
    }

    if (normalizedPath === normalizeImageAssetPath('./burgerclasicas/burgernormal.png').toLowerCase()) {
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

    if (normalizedPath === normalizeImageAssetPath('./salchipapas/salchisuper.png').toLowerCase()) {
        if (normalizedProductName.includes('grande')) {
            return 34000;
        }
        return 19000;
    }

    const manualKey = Object.keys(MANUAL_IMAGE_BASE_PRICES).find(
        (k) => normalizeImageAssetPath(k).toLowerCase() === normalizedPath
    );
    if (manualKey) return Number(MANUAL_IMAGE_BASE_PRICES[manualKey]);

    return null;
}

function resolveCartUnitPrice(productName, categoryName, orderOptions = { type: 'solo' }) {
    const normalizedOptions = normalizeOrderOptions(orderOptions);
    const applyDiscount = (price) => {
        if (normalizedOptions.promo2x1) {
            return Math.round(Number(price || 0) * 0.5);
        }
        if (!normalizedOptions.recommendedDiscount) {
            return price;
        }
        const discountRate = normalizedOptions.discountRate || RECOMMENDED_DAY_DISCOUNT_RATE;
        return Math.round(Number(price || 0) * (1 - discountRate));
    };

    if (normalizedOptions.staticPrice !== null) {
        return applyDiscount(normalizedOptions.staticPrice);
    }

    const manualImagePrice = resolveManualImagePrice(productName, normalizedOptions);

    if (manualImagePrice !== null && manualImagePrice !== undefined) {
        const resolvedPrice = normalizedOptions.type === 'combo' ? manualImagePrice + COMBO_EXTRA_PRICE : manualImagePrice;
        return applyDiscount(resolvedPrice);
    }

    // Name-based fallback for combos mixtos (when imagePath is a Storage URL or missing)
    if (isCombosMixtosCategory(categoryName)) {
        const normName = normalizeCategoryKey(productName);
        if (normName.includes('de la casa') || normName.includes('delacasa')) return applyDiscount(49000);
        if (normName.includes('emparejados')) return applyDiscount(45000);
        if (normName.includes('familiar') && (normName.includes('3') || normName.includes('tres'))) return applyDiscount(48000);
        if (normName.includes('familiar') && (normName.includes('4') || normName.includes('cuatro'))) return applyDiscount(44000);
    }

    const staticOptionPrice = resolveStaticOptionPrice(productName, categoryName);
    if (staticOptionPrice !== null && staticOptionPrice !== undefined) {
        return applyDiscount(staticOptionPrice);
    }

    const basePrice = findLatestProductPrice(productName, categoryName);

    if (normalizedOptions.type === 'combo') {
        return applyDiscount(basePrice + COMBO_EXTRA_PRICE);
    }

    return applyDiscount(basePrice);
}

function getCartItemUnitPrice(item) {
    const hasStoredPrice = item && item.unitPrice !== null && item.unitPrice !== undefined && item.unitPrice !== '';
    const storedPrice = Number(item?.unitPrice ?? 0);
    if (hasStoredPrice && storedPrice > 0 && Number.isFinite(storedPrice)) {
        return storedPrice;
    }

    const recalculated = resolveCartUnitPrice(item?.productName, item?.categoryName, item?.orderOptions);
    // Heal items stored with price=0 (e.g. before price resolution was fixed)
    if (item && recalculated > 0) {
        item.unitPrice = recalculated;
        item.subtotal = recalculated * Number(item.quantity || 1);
        saveCartState();
    }
    return recalculated;
}

function getCartItemOriginalUnitPrice(item) {
    const normalizedOptions = normalizeOrderOptions(item?.orderOptions);
    if (normalizedOptions.promo2x1) {
        return resolveCartUnitPrice(item?.productName, item?.categoryName, {
            ...normalizedOptions,
            promo2x1: false
        });
    }
    if (!normalizedOptions.recommendedDiscount) {
        return getCartItemUnitPrice(item);
    }
    return resolveCartUnitPrice(item?.productName, item?.categoryName, {
        ...normalizedOptions,
        recommendedDiscount: false,
        discountRate: 0
    });
}

function getCartItemDiscountAmount(item) {
    const quantity = Number(item?.quantity || 0);
    const originalUnitPrice = getCartItemOriginalUnitPrice(item);
    const currentUnitPrice = getCartItemUnitPrice(item);
    return Math.max(0, (originalUnitPrice - currentUnitPrice) * quantity);
}

function getCartDiscountTotalAmount() {
    return shoppingCart.reduce((total, item) => total + getCartItemDiscountAmount(item), 0);
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

    if (normalized.promoLabel) {
        optionLabel = `🏷 ${normalized.promoLabel} | ${optionLabel}`;
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
    const fulfillmentType = getCheckoutFulfillmentType(customerInfo.fulfillmentType);
    const deliveryFee = Number.isFinite(Number(customerInfo.deliveryFee)) ? Number(customerInfo.deliveryFee) : getCheckoutDeliveryFee(fulfillmentType);
    const discountAmount = getCheckoutDiscountAmount();
    const paymentMethod = String(customerInfo.paymentMethod || '').trim().toLowerCase();
    const cashChangeRequired = customerInfo.cashChangeRequired === true;
    const cashTenderAmount = Number(customerInfo.cashTenderAmount || 0);
    const orderTotal = getCartTotalAmount() + deliveryFee;
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
        `Entrega: ${fulfillmentType === 'delivery' ? 'Domicilio' : fulfillmentType === 'mesa' ? 'Comer en el local' : 'Recoger en el restaurante'}`,
        deliveryAddress ? `Direccion: ${deliveryAddress}` : '',
        customerInfo.deliveryZone ? `Zona: ${customerInfo.deliveryZone}` : '',
        paymentMethod && paymentMethod !== 'pendiente' ? (() => {
            if (paymentMethod === 'efectivo') {
                return `Pago: Efectivo${cashChangeRequired && cashTenderAmount > 0 ? ` | Paga con: ${formatCurrency(cashTenderAmount)}` : ' | Lleva completo'}`;
            }
            const pmDef = (_customerPaymentMethods || []).find((m) => m.id === paymentMethod);
            const pmLabel = pmDef ? pmDef.label : paymentMethod;
            return `Pago: ${pmLabel}`;
        })() : ''
    ].filter(Boolean);

    const domicilioLine = fulfillmentType === 'delivery'
        ? (customerInfo.deliveryFeePending ? '\nDomicilio: Por confirmar (asesor contactará)' : `\nDomicilio: ${formatCurrency(deliveryFee)}`)
        : '';
    const totalDisplay = fulfillmentType === 'delivery' && customerInfo.deliveryFeePending
        ? `${formatCurrency(getCartTotalAmount())} + domicilio por confirmar`
        : formatCurrency(orderTotal);
    return `${header}\n${customerDetails.join('\n')}${customerDetails.length ? '\n' : ''}\n${lines.join('\n\n')}\n\nTotal items: ${getCartProductCount()}\nSubtotal: ${formatCurrency(getCartTotalAmount())}${discountAmount > 0 ? `\nDescuento: ${formatCurrency(discountAmount)}` : ''}${domicilioLine}\nTotal: ${totalDisplay}`;
}

function buildCartOrderItems() {
    return shoppingCart.map((item, index) => {
        const quantity = Number(item.quantity || 0);
        const unitPrice = getCartItemUnitPrice(item);
        const originalUnitPrice = getCartItemOriginalUnitPrice(item);
        const optionLabel = getCartOptionLabel(item.categoryName, item.orderOptions, { includeComment: false });
        const note = String(item.orderOptions?.comment || '').trim();
        const discountAmount = Math.max(0, (originalUnitPrice - unitPrice) * quantity);

        return {
            index: index + 1,
            itemKey: item.itemKey,
            productName: String(item.productName || '').trim(),
            categoryName: String(item.categoryName || '').trim(),
            quantity,
            unitPrice,
            originalUnitPrice: originalUnitPrice !== unitPrice ? originalUnitPrice : null,
            subtotal: unitPrice * quantity,
            discountAmount: discountAmount > 0 ? discountAmount : null,
            optionLabel,
            note,
            orderOptions: normalizeOrderOptions(item.orderOptions)
        };
    });
}

async function createOrderFromCart(customerInfo = {}) {
    const db = getPublicFirebaseDb();
    const orderRef = db.collection(ORDERS_COLLECTION).doc();
    const items = buildCartOrderItems();
    const subtotal = getCartTotalAmount();
    const totalItems = getCartProductCount();
    const customerName = String(customerInfo.name || '').trim();
    const fulfillmentType = getCheckoutFulfillmentType(customerInfo.fulfillmentType);
    let deliveryFee = Number.isFinite(Number(customerInfo.deliveryFee)) ? Number(customerInfo.deliveryFee) : getCheckoutDeliveryFee(fulfillmentType);
    // Recalcular y verificar tarifa (simulación server-side): si hay coordenadas, determinamos la zona esperada
    const deliveryLatitude = Number.isFinite(Number(customerInfo.deliveryLatitude)) ? Number(customerInfo.deliveryLatitude) : null;
    const deliveryLongitude = Number.isFinite(Number(customerInfo.deliveryLongitude)) ? Number(customerInfo.deliveryLongitude) : null;
    let deliveryFeeVerified = false;
    let deliveryFeeExpected = deliveryFee;
    if (fulfillmentType === 'delivery' && Number.isFinite(Number(deliveryLatitude)) && Number.isFinite(Number(deliveryLongitude))) {
        const expectedZone = findDeliveryZoneForLocation({ latitude: deliveryLatitude, longitude: deliveryLongitude });
        deliveryFeeExpected = expectedZone ? expectedZone.fee : DELIVERY_FEE_AMOUNT;
        if (Number(deliveryFee) !== Number(deliveryFeeExpected)) {
            // Sobre-escribir la tarifa con la esperada (calculada según zona GPS) para evitar manipulacion cliente
            console.warn('Delivery fee mismatch: overriding client value.', { client: deliveryFee, expected: deliveryFeeExpected, zone: expectedZone?.name || 'fuera de zona' });
            deliveryFee = Number(deliveryFeeExpected);
        }
        deliveryFeeVerified = true;
    }

    const total = subtotal + deliveryFee;
    const deliveryAddress = String(customerInfo.address || '').trim();
    const customerPhone = String(customerInfo.phone || '').trim();
    const customerPhoneDigits = customerPhone.replace(/\D+/g, '');
    const paymentMethod = String(customerInfo.paymentMethod || '').trim().toLowerCase();
    const cashChangeRequired = customerInfo.cashChangeRequired === true;
    const cashTenderAmount = cashChangeRequired ? Number(customerInfo.cashTenderAmount || 0) : null;
    const profileAddress = String(customerInfo.profileAddress || '').trim();
    const savedAddresses = normalizeCustomerSavedAddresses(customerInfo.savedAddresses || [], profileAddress || deliveryAddress);

    const orderCode = await reserveNextOrderCode(db, orderRef, {
        status: 'pendiente',
        customerName,
        customerPhone,
        customerPhoneDigits,
        fulfillmentType,
        deliveryAddress,
        items,
        itemCount: items.length,
        totalItems,
        subtotal,
        deliveryFee,
        costoDomicilio: deliveryFee,
        total,
        paymentMethod,
        cashChangeRequired,
        cashTenderAmount: Number.isFinite(cashTenderAmount) ? cashTenderAmount : null,
        deliveryZone: String(customerInfo.deliveryZone || '').trim() || null,
        deliveryLatitude: Number.isFinite(Number(customerInfo.deliveryLatitude)) ? Number(customerInfo.deliveryLatitude) : null,
        deliveryLongitude: Number.isFinite(Number(customerInfo.deliveryLongitude)) ? Number(customerInfo.deliveryLongitude) : null,
        deliveryFeeVerified: Boolean(deliveryFeeVerified),
        deliveryFeeExpected: Number.isFinite(Number(deliveryFeeExpected)) ? Number(deliveryFeeExpected) : 0,
        deliveryFeeOverridden: Number.isFinite(Number(customerInfo.deliveryFee)) ? (Number(customerInfo.deliveryFee) !== Number(deliveryFee)) : false,
        currency: 'COP',
        source: 'web',
        createdAt: getPublicServerTimestamp(),
        updatedAt: getPublicServerTimestamp(),
        summaryMessage: buildCartCheckoutMessage({
            name: customerName,
            fulfillmentType,
            address: deliveryAddress,
            paymentMethod,
            cashChangeRequired,
            cashTenderAmount,
            deliveryZone: customerInfo.deliveryZone || null,
            deliveryFee
        })
    });

    // Profile update is non-critical: order is already saved; don't let quota/network errors here surface as order failure
    try {
        await upsertClientProfile(db, {
            customerName,
            customerPhone,
            customerPhoneDigits,
            deliveryAddress,
            profileAddress: profileAddress || deliveryAddress,
            savedAddresses,
            fulfillmentType
        }, {
            id: orderRef.id,
            code: orderCode,
            total
        });
    } catch (_profileErr) {
        // Silently ignore — order was already saved successfully
    }

    if (activeCustomerProfile && activeCustomerProfile.customerPhoneDigits === customerPhoneDigits) {
        setActiveCustomerProfile({
            ...activeCustomerProfile,
            customerName,
            customerPhone,
            customerPhoneDigits,
            address: profileAddress || activeCustomerProfile.address,
            savedAddresses,
            lastOrderCode: orderCode,
            lastOrderId: orderRef.id,
            lastOrderTotal: total,
            totalOrders: Number(activeCustomerProfile.totalOrders || 0) + 1,
            totalSpent: Number(activeCustomerProfile.totalSpent || 0) + total
        });
    }

    return {
        id: orderRef.id,
        code: orderCode,
        customerName,
        total
    };
}

function openCartDrawer() {
    if (!cartUI) {
        initCartUI();
        if (!cartUI) {
            return;
        }
    }
    cartUI.drawer.classList.add('is-open');
    cartUI.overlay.classList.add('is-open');
    _pushModalState();
    syncBodyScrollLock();
}

function closeCartDrawer() {
    if (!cartUI) {
        return;
    }
    cartUI.drawer.classList.remove('is-open');
    cartUI.overlay.classList.remove('is-open');
    if (!_closingByBackBtn) _popModalState();
    syncBodyScrollLock();
}

function updateCartItemQuantity(itemKey, delta) {
    const item = shoppingCart.find((entry) => entry.itemKey === itemKey);
    if (!item) {
        return;
    }

    let newQty = Number(item.quantity || 0) + delta;
    if (item.orderOptions?.promo2x1 && newQty > 0 && newQty % 2 !== 0) {
        newQty = delta > 0 ? newQty + 1 : newQty - 1;
    }
    item.quantity = newQty;
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

function closePaymentFlowModal() {
    if (!paymentFlowUI) {
        return;
    }

    paymentFlowUI.modal.remove();
    paymentFlowUI = null;
    if (!_closingByBackBtn) _popModalState();
    syncBodyScrollLock();
}

function formatDeliveryZoneMessage(zone) {
    if (!zone) {
        return 'Sin tarifa calculada. Usa tu ubicación para definir el costo de domicilio.';
    }
    const icons = { amarilla: '🟡', azul: '🔵', roja: '🔴', negra: '⬛' };
    const icon = icons[zone.name] || '📍';
    return `${icon} ${zone.label} — Domicilio: ${formatCurrency(zone.fee)}`;
}

function setCheckoutDeliveryLocation(latitude, longitude) {
    if (!checkoutInfoUI) {
        return;
    }

    checkoutDeliveryLocation = {
        latitude: Number(latitude),
        longitude: Number(longitude)
    };

    const zone = findDeliveryZoneForLocation(checkoutDeliveryLocation);
    checkoutDeliveryZone = zone?.name || null;
    checkoutDeliveryFeeAmount = zone ? zone.fee : 0;
    checkoutDeliveryFeePending = !zone;
    checkoutInfoUI.deliveryZone = checkoutDeliveryZone;
    checkoutInfoUI.deliveryLatitude = checkoutDeliveryLocation.latitude;
    checkoutInfoUI.deliveryLongitude = checkoutDeliveryLocation.longitude;

    const selectedSavedAddressEntry = getSelectedCheckoutSavedAddress();
    const selectedSavedAddressLabel = getCustomerSavedAddressLabel(selectedSavedAddressEntry);
    const needsSavedAddressCoords = selectedSavedAddressEntry
        && (selectedSavedAddressEntry.latitude == null || !Number.isFinite(Number(selectedSavedAddressEntry.latitude)))
        && (selectedSavedAddressEntry.longitude == null || !Number.isFinite(Number(selectedSavedAddressEntry.longitude)))
        && selectedSavedAddressLabel;

    if (needsSavedAddressCoords) {
        selectedSavedAddressEntry.latitude = checkoutDeliveryLocation.latitude;
        selectedSavedAddressEntry.longitude = checkoutDeliveryLocation.longitude;
        if (activeCustomerProfile) {
            setActiveCustomerProfile({
                ...activeCustomerProfile,
                savedAddresses: checkoutInfoUI.savedAddresses || getCustomerSavedAddresses(activeCustomerProfile)
            });
        }
    }

    if (checkoutInfoUI.deliveryFeeValue) {
        checkoutInfoUI.deliveryFeeValue.textContent = zone ? formatCurrency(checkoutDeliveryFeeAmount) : 'Por confirmar';
    }

    if (checkoutInfoUI.deliveryZoneStatus) {
        checkoutInfoUI.deliveryZoneStatus.textContent = zone
            ? formatDeliveryZoneMessage(zone)
            : '📋 Tu dirección está fuera de nuestra zona de cobertura. Puedes enviar el pedido y uno de nuestros asesores te confirmará el valor del domicilio.';
        checkoutInfoUI.deliveryZoneStatus.classList.toggle('is-outside-zone', !zone);
    }

    if (checkoutInfoUI.deliveryMapMarker) {
        checkoutInfoUI.deliveryMapMarker.setLatLng([checkoutDeliveryLocation.latitude, checkoutDeliveryLocation.longitude]);
    }

    if (checkoutInfoUI.deliveryMap) {
        checkoutInfoUI.deliveryMap.setView([checkoutDeliveryLocation.latitude, checkoutDeliveryLocation.longitude], 15);
    }

    if (checkoutInfoUI.confirmLocationButton) {
        checkoutInfoUI.confirmLocationButton.hidden = false;
    }

    if (checkoutInfoUI.requestQuoteButton) {
        checkoutInfoUI.requestQuoteButton.style.display = 'none';
    }

}

function initializeCheckoutDeliveryMap() {
    if (!checkoutInfoUI || !window.L) {
        return;
    }

    if (checkoutInfoUI.deliveryMap) {
        // Si el mapa ya existe, invalidar tamaño para que Leaflet recalcule las dimensiones del contenedor
        setTimeout(() => {
            checkoutInfoUI.deliveryMap.invalidateSize();
        }, 50);
        return;
    }

    const map = L.map('deliveryMap', {
        zoomControl: false,
        attributionControl: false
    }).setView(DELIVERY_CENTER_COORDINATES, 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    DELIVERY_GEOFENCE_ZONES.forEach((zone) => {
        L.polygon(zone.polygon, {
            color: zone.color,
            fillColor: zone.color,
            fillOpacity: 0.15,
            weight: 2
        }).addTo(map);
    });

    const marker = L.marker(DELIVERY_CENTER_COORDINATES, {
        draggable: true,
        title: 'Arrastra para ajustar tu direccion'
    }).addTo(map);

    marker.on('dragend', () => {
        const latlng = marker.getLatLng();
        setCheckoutDeliveryLocation(latlng.lat, latlng.lng);
    });

    map.on('click', (event) => {
        setCheckoutDeliveryLocation(event.latlng.lat, event.latlng.lng);
    });

    checkoutInfoUI.deliveryMap = map;
    checkoutInfoUI.deliveryMapMarker = marker;

    // Si ya hay coordenadas pre-calculadas (dirección guardada), colocar el pin allí
    if (checkoutDeliveryLocation && Number.isFinite(checkoutDeliveryLocation.latitude) && Number.isFinite(checkoutDeliveryLocation.longitude)) {
        marker.setLatLng([checkoutDeliveryLocation.latitude, checkoutDeliveryLocation.longitude]);
        map.setView([checkoutDeliveryLocation.latitude, checkoutDeliveryLocation.longitude], 16);
        if (checkoutInfoUI.confirmLocationButton) checkoutInfoUI.confirmLocationButton.hidden = false;
    }

    // Invalidar tamaño después de que el mapa se haya agregado al DOM visible
    setTimeout(() => {
        map.invalidateSize();
        if (checkoutDeliveryLocation && Number.isFinite(checkoutDeliveryLocation.latitude)) {
            map.setView([checkoutDeliveryLocation.latitude, checkoutDeliveryLocation.longitude], 16);
        }
    }, 100);
}

function requestCheckoutGeolocation() {
    if (!checkoutInfoUI) {
        return;
    }

    if (!navigator.geolocation) {
        checkoutInfoUI.deliveryZoneStatus.textContent = 'Tu navegador no soporta geolocalizacion. Usa el mapa para ubicar tu pedido manualmente.';
        return;
    }

    checkoutInfoUI.deliveryZoneStatus.textContent = 'Obteniendo tu ubicacion...';
    navigator.geolocation.getCurrentPosition(
        (position) => {
            setCheckoutDeliveryLocation(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
            checkoutInfoUI.deliveryZoneStatus.textContent = 'No se pudo obtener la ubicacion. Usa el mapa para ajustar el punto de entrega.';
        },
        {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 60000
        }
    );
}

function updatePaymentFlowState() {
    if (!paymentFlowUI) {
        return;
    }

    const paymentMethod = String(paymentFlowUI.method.value || '').trim().toLowerCase();
    const cashChoice = String(paymentFlowUI.cashChoice.value || '').trim().toLowerCase();
    const needsCashChoice = paymentMethod === 'efectivo';
    const needsTenderAmount = needsCashChoice && cashChoice === 'cambio';

    paymentFlowUI.cashOptions.hidden = !needsCashChoice;
    paymentFlowUI.cashChoice.required = needsCashChoice;
    paymentFlowUI.tenderField.hidden = !needsTenderAmount;
    paymentFlowUI.tenderAmount.required = needsTenderAmount;
    paymentFlowUI.tenderAmount.disabled = !needsTenderAmount;

    if (!needsCashChoice) {
        paymentFlowUI.cashChoice.value = '';
    }

    if (!needsTenderAmount) {
        paymentFlowUI.tenderAmount.value = '';
    }
}

async function submitPaymentFlow() {
    if (!paymentFlowUI) {
        return;
    }

    const paymentMethod = String(paymentFlowUI.method.value || '').trim().toLowerCase();
    const cashChoice = String(paymentFlowUI.cashChoice.value || '').trim().toLowerCase();
    const orderTotal = Number(paymentFlowUI.orderData.total || 0);
    const tenderAmountValue = String(paymentFlowUI.tenderAmount.value || '').trim();
    const tenderAmount = Number(tenderAmountValue.replace(/\D+/g, ''));

    if (!paymentMethod) {
        paymentFlowUI.feedback.textContent = 'Escoge el medio de pago para continuar.';
        paymentFlowUI.method.focus();
        return;
    }

    if (paymentMethod === 'efectivo' && !cashChoice) {
        paymentFlowUI.feedback.textContent = `Indica si tienes los ${formatCurrency(orderTotal)} completos o si necesitas cambio.`;
        paymentFlowUI.cashChoice.focus();
        return;
    }

    if (paymentMethod === 'efectivo' && cashChoice === 'cambio') {
        if (!Number.isFinite(tenderAmount) || tenderAmount <= 0) {
            paymentFlowUI.feedback.textContent = 'Escribe la cantidad con la que vas a pagar.';
            paymentFlowUI.tenderAmount.focus();
            return;
        }

        if (tenderAmount < orderTotal) {
            paymentFlowUI.feedback.textContent = `La cantidad debe ser igual o mayor a ${formatCurrency(orderTotal)}.`;
            paymentFlowUI.tenderAmount.focus();
            return;
        }
    }

    paymentFlowUI.feedback.textContent = '';
    paymentFlowUI.send.disabled = true;
    paymentFlowUI.send.textContent = 'Guardando pedido...';

    try {
        const capturedItems = buildCartOrderItems();
        const capturedSubtotal = getCartTotalAmount();
        const capturedOrderData = paymentFlowUI.orderData;

        const savedOrder = await createOrderFromCart({
            ...capturedOrderData,
            paymentMethod,
            cashChangeRequired: paymentMethod === 'efectivo' ? cashChoice === 'cambio' : false,
            cashTenderAmount: paymentMethod === 'efectivo' && cashChoice === 'cambio' ? tenderAmount : null
        });

        paymentFlowUI.send.textContent = 'Pedido recibido...';

        closePaymentFlowModal();
        clearCart();
        closeCartDrawer();

        showOrderConfirmScreen({
            ...savedOrder,
            items: capturedItems,
            subtotal: capturedSubtotal,
            deliveryFee: Number(capturedOrderData.deliveryFee || 0),
            fulfillmentType: capturedOrderData.fulfillmentType || '',
            address: capturedOrderData.address || '',
            paymentMethod
        });
    } catch (error) {
        const isNetworkOrQuota = /quota|network|offline|failed to fetch|unavailable/i.test(error.message || '');
        paymentFlowUI.feedback.textContent = isNetworkOrQuota
            ? 'No se pudo conectar al servidor. Verifica tu conexión e intenta de nuevo.'
            : `No se pudo enviar el pedido: ${error.message || 'error inesperado.'}`;
        paymentFlowUI.send.disabled = false;
        paymentFlowUI.send.textContent = 'Confirmar pedido';
    }
}

function openPaymentFlowModal(orderData) {
    closePaymentFlowModal();

    const total = Number(orderData?.total || 0);
    const _pmList = _customerPaymentMethods?.length ? _customerPaymentMethods : [
        { id: 'efectivo',    label: 'Efectivo',    icon: '💵' },
        { id: 'bancolombia', label: 'Bancolombia', icon: '🏦' },
        { id: 'nequi',       label: 'Nequi',       icon: '💜' },
        { id: 'bold',        label: 'Bold',        icon: '💳' },
    ];
    const _pmOptionsHtml = _pmList.map((m) => `<option value="${m.id}">${m.icon ? m.icon + ' ' : ''}${m.label}</option>`).join('');
    const modal = document.createElement('div');
    modal.id = 'paymentFlowModal';
    modal.className = 'support-modal';
    modal.classList.add('is-open');
    modal.innerHTML = `
        <div class="support-modal-card liquid-glass" role="dialog" aria-modal="true" aria-label="Medio de pago">
            <button type="button" class="support-modal-close" aria-label="Cerrar medio de pago">&times;</button>
            <p class="support-modal-kicker">Medio de pago</p>
            <h3 class="support-modal-title">Como vas a pagar tu pedido</h3>
            <p class="support-modal-text">Total a pagar: ${formatCurrency(total)}</p>
            <label class="support-field">
                <span>Selecciona el medio de pago</span>
                <select id="paymentMethodSelect">
                    <option value="" selected disabled>Escoge aca tu medio de pago</option>
                    ${_pmOptionsHtml}
                </select>
            </label>
            <div class="support-field" id="paymentCashOptions" hidden>
                <span>Pago en efectivo</span>
                <select id="paymentCashChoice">
                    <option value="" selected disabled>Escoge una opcion</option>
                    <option value="completo">Tengo completo</option>
                    <option value="cambio">Necesito cambio</option>
                </select>
            </div>
            <label class="support-field" id="paymentTenderField" hidden>
                <span>Con cuanto vas a pagar</span>
                <input type="text" id="paymentTenderAmount" inputmode="numeric" placeholder="Escribe el valor con el que pagas">
            </label>
            <p class="support-feedback" id="paymentFlowFeedback"></p>
            <div class="support-actions">
                <button type="button" class="support-send-btn">Confirmar pedido</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    _pushModalState();

    paymentFlowUI = {
        modal,
        orderData,
        close: modal.querySelector('.support-modal-close'),
        method: modal.querySelector('#paymentMethodSelect'),
        cashOptions: modal.querySelector('#paymentCashOptions'),
        cashChoice: modal.querySelector('#paymentCashChoice'),
        tenderField: modal.querySelector('#paymentTenderField'),
        tenderAmount: modal.querySelector('#paymentTenderAmount'),
        feedback: modal.querySelector('#paymentFlowFeedback'),
        send: modal.querySelector('.support-send-btn')
    };

    paymentFlowUI.close.addEventListener('click', closePaymentFlowModal);
    paymentFlowUI.method.addEventListener('change', updatePaymentFlowState);
    paymentFlowUI.cashChoice.addEventListener('change', updatePaymentFlowState);
    paymentFlowUI.send.addEventListener('click', submitPaymentFlow);

    modal.addEventListener('click', (event) => {
        if (event.target === modal && _lastMousedownTarget === modal) {
            closePaymentFlowModal();
        }
    });

    syncBodyScrollLock();
    updatePaymentFlowState();
    paymentFlowUI.method.focus();
}

async function submitCheckoutInfo() {
    if (!checkoutInfoUI) {
        return;
    }

    if (!canPlaceOrdersNow()) {
        checkoutInfoUI.feedback.textContent = ORDERING_SCHEDULE.closedMessage;
        showOrderingClosedMessage();
        return;
    }

    const profile = activeCustomerProfile;
    const customerName = profile ? String(profile.customerName || '').trim() : String(checkoutInfoUI.name?.value || '').trim();
    const fulfillmentType = getCheckoutFulfillmentType(checkoutInfoUI.fulfillmentType.value);
    const savedAddresses = profile ? getCustomerSavedAddresses(profile) : [];
    const selectedAddressOption = String(checkoutInfoUI.savedAddressChoice?.value || (savedAddresses.length ? 'saved:0' : 'new')).trim();
    const selectedAddressIndex = selectedAddressOption.startsWith('saved:') ? Number(selectedAddressOption.split(':')[1]) : -1;
    const selectedSavedAddressEntry = selectedAddressIndex >= 0 ? savedAddresses[selectedAddressIndex] || null : null;
    const savedAddressValue = selectedSavedAddressEntry ? getCustomerSavedAddressLabel(selectedSavedAddressEntry) : '';
    const typedDeliveryAddress = String(checkoutInfoUI.address.value || '').trim();
    const deliveryAddress = fulfillmentType === 'delivery'
        ? (savedAddressValue || typedDeliveryAddress)
        : '';
    const shouldSaveNewAddress = Boolean(
        profile
        && fulfillmentType === 'delivery'
        && !savedAddressValue
        && typedDeliveryAddress
        && checkoutInfoUI.saveAddressToggle?.checked
        && savedAddresses.length < MAX_CUSTOMER_SAVED_ADDRESSES
    );
    const customerPhone = profile ? String(profile.customerPhone || '').trim() : String(checkoutInfoUI.phone?.value || '').trim();
    const phoneDigits = normalizePhoneDigits(customerPhone);

    if (!customerName) {
        checkoutInfoUI.feedback.textContent = 'Escribe el nombre de quien recibe el pedido.';
        checkoutInfoUI.name?.focus();
        return;
    }

    if (!fulfillmentType) {
        checkoutInfoUI.feedback.textContent = 'Escoge como deseas recibir tu pedido.';
        checkoutInfoUI.fulfillmentType.focus();
        return;
    }

    if (fulfillmentType === 'delivery' && !deliveryAddress) {
        checkoutInfoUI.feedback.textContent = 'Escoge una direccion guardada o escribe una nueva para el domicilio.';
        (checkoutInfoUI.savedAddressChoice || checkoutInfoUI.address)?.focus();
        return;
    }

    if (fulfillmentType === 'delivery' && !checkoutDeliveryLocationConfirmed) {
        checkoutInfoUI.feedback.textContent = 'Confirma tu ubicación en el mapa antes de enviar el pedido.';
        checkoutInfoUI.confirmLocationButton?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }

    if (phoneDigits.length < 10) {
        checkoutInfoUI.feedback.textContent = 'Escribe un telefono valido para confirmar el pedido.';
        checkoutInfoUI.phone?.focus();
        return;
    }

    checkoutInfoUI.feedback.textContent = '';
    checkoutInfoUI.send.disabled = true;
    checkoutInfoUI.send.textContent = 'Enviando pedido...';

    try {
        trackButtonClick('btn-cart-checkout', 'Checkout carrito');
        const newSavedAddressEntry = {
            address: typedDeliveryAddress,
            latitude: Number.isFinite(Number(checkoutInfoUI.deliveryLatitude)) ? Number(checkoutInfoUI.deliveryLatitude) : null,
            longitude: Number.isFinite(Number(checkoutInfoUI.deliveryLongitude)) ? Number(checkoutInfoUI.deliveryLongitude) : null
        };

        const orderData = {
            name: customerName,
            fulfillmentType,
            address: fulfillmentType === 'delivery' ? deliveryAddress : '',
            phone: customerPhone,
            profileAddress: profile?.address || '',
            savedAddresses: shouldSaveNewAddress
                ? appendCustomerSavedAddress(savedAddresses, newSavedAddressEntry)
                : savedAddresses,
            deliveryZone: checkoutInfoUI.deliveryZone || null,
            deliveryLatitude: checkoutInfoUI.deliveryLatitude || null,
            deliveryLongitude: checkoutInfoUI.deliveryLongitude || null,
            deliveryFee: getCheckoutDeliveryFee(fulfillmentType),
            deliveryFeePending: fulfillmentType === 'delivery' ? checkoutDeliveryFeePending : false
        };

        if (profile && shouldSaveNewAddress) {
            setActiveCustomerProfile({
                ...profile,
                savedAddresses: appendCustomerSavedAddress(savedAddresses, newSavedAddressEntry)
            });
        }

        closeCheckoutInfoModal();
        openPaymentFlowModal({
            ...orderData,
            total: getCheckoutOrderTotal(fulfillmentType)
        });
    } catch (error) {
        checkoutInfoUI.feedback.textContent = `No se pudo enviar el pedido: ${error.message || 'error inesperado.'}`;
        checkoutInfoUI.send.disabled = false;
        checkoutInfoUI.send.textContent = 'Enviar pedido';
    }
}

function geocodeAddress(addressText) {
    if (!checkoutInfoUI) {
        return Promise.resolve(null);
    }

    const address = String(addressText || '').trim();
    if (!address || address.length < 5) {
        return Promise.resolve(null);
    }

    // Agregar contexto de Armenia, Quindio para mejorar resultados
    const searchQuery = `${address}, Armenia, Quindio, Colombia`;
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`;

    if (checkoutInfoUI.deliveryZoneStatus) {
        checkoutInfoUI.deliveryZoneStatus.textContent = 'Cotizando valor de domicilio...';
    }

    return fetch(url, {
        headers: {
            'Accept-Language': 'es',
            'User-Agent': 'RoalBurgerApp/1.0'
        }
    })
    .then((response) => {
        if (!response.ok) {
            throw new Error('Error al geocodificar');
        }
        return response.json();
    })
    .then((data) => {
        if (!Array.isArray(data) || data.length === 0) {
            if (checkoutInfoUI.deliveryZoneStatus) {
                checkoutInfoUI.deliveryZoneStatus.textContent = '📍 No reconocimos la dirección. Por favor arrastra el punto en el mapa hasta tu ubicación y confirma.';
            }
            return null;
        }

        const result = data[0];
        const latitude = parseFloat(result.lat);
        const longitude = parseFloat(result.lon);

        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
            return null;
        }

        // Una vez tenemos coordenadas, actualizar ubicación y zona
        setCheckoutDeliveryLocation(latitude, longitude);

        // Marcar como confirmada automáticamente
        checkoutDeliveryLocationConfirmed = true;

        // Actualizar todo el estado del modal (total, mapa, botones, etc.)
        updateCheckoutInfoModalState();

        return { latitude, longitude, displayName: result.display_name };
    })
    .catch(() => {
        if (checkoutInfoUI.deliveryZoneStatus) {
            checkoutInfoUI.deliveryZoneStatus.textContent = '📍 No reconocimos la dirección. Por favor arrastra el punto en el mapa hasta tu ubicación y confirma.';
        }
        return null;
    });
}

let geocodeDebounceTimer = null;

function handleCheckoutAddressInput() {
    if (!checkoutInfoUI) {
        return;
    }

    if (geocodeDebounceTimer) {
        clearTimeout(geocodeDebounceTimer);
    }

    const address = String(checkoutInfoUI.address?.value || '').trim();
    if (address.length < 8) {
        return;
    }

    if (checkoutInfoUI.deliveryZoneStatus) {
        checkoutInfoUI.deliveryZoneStatus.textContent = 'Cotizando valor de domicilio...';
    }

    geocodeDebounceTimer = setTimeout(() => {
        geocodeAddress(address);
    }, 1200);
}

function updateCheckoutInfoModalState() {
    if (!checkoutInfoUI) {
        return;
    }

    const fulfillmentType = getCheckoutFulfillmentType(checkoutInfoUI.fulfillmentType.value);
    const isDineIn = fulfillmentType === 'mesa';
    const requiresAddress = fulfillmentType === 'delivery';
    
    if (fulfillmentType !== 'delivery') {
        checkoutDeliveryLocationConfirmed = false;
        checkoutDeliveryLocation = null;
        checkoutDeliveryZone = null;
        checkoutDeliveryFeeAmount = 0;
        checkoutDeliveryFeePending = false;
    }
    const savedAddresses = Array.isArray(checkoutInfoUI.savedAddresses) ? checkoutInfoUI.savedAddresses : [];
    const hasSavedAddresses = savedAddresses.length > 0;
    const selectedAddressOption = String(checkoutInfoUI.savedAddressChoice?.value || (hasSavedAddresses ? 'saved:0' : 'new')).trim();
    const usingSavedAddress = requiresAddress && hasSavedAddresses && selectedAddressOption.startsWith('saved:');
    const selectedSavedAddressEntry = usingSavedAddress ? getSelectedCheckoutSavedAddress() : null;
    const addressHasLocation = selectedSavedAddressEntry && selectedSavedAddressEntry.latitude != null && selectedSavedAddressEntry.longitude != null && Number.isFinite(Number(selectedSavedAddressEntry.latitude)) && Number.isFinite(Number(selectedSavedAddressEntry.longitude));
    const discountAmount = getCheckoutDiscountAmount();

    if (checkoutInfoUI.savedAddressField) {
        checkoutInfoUI.savedAddressField.hidden = !requiresAddress || !hasSavedAddresses;
    }

    checkoutInfoUI.addressField.hidden = !requiresAddress || usingSavedAddress;
    checkoutInfoUI.address.required = requiresAddress && !usingSavedAddress;
    checkoutInfoUI.address.disabled = !requiresAddress || usingSavedAddress;

    if (usingSavedAddress) {
        checkoutInfoUI.address.value = '';
    }

    if (usingSavedAddress && addressHasLocation) {
        // Dirección guardada CON coordenadas: precalcular zona para mostrar en mapa, pero requerir confirmación explícita
        const lat = selectedSavedAddressEntry.latitude;
        const lng = selectedSavedAddressEntry.longitude;
        const zone = findDeliveryZoneForLocation({ latitude: lat, longitude: lng });
        checkoutDeliveryZone = zone?.name || null;
        checkoutDeliveryFeeAmount = zone ? zone.fee : 0;
        checkoutDeliveryFeePending = !zone;
        checkoutDeliveryLocation = { latitude: lat, longitude: lng };
        checkoutInfoUI.deliveryZone = checkoutDeliveryZone;
        checkoutInfoUI.deliveryLatitude = lat;
        checkoutInfoUI.deliveryLongitude = lng;
        if (checkoutInfoUI.deliveryZoneStatus) {
            checkoutInfoUI.deliveryZoneStatus.textContent = zone
                ? `📍 Tu pin está en ${zone.label} — ${formatCurrency(zone.fee)}. ¿Es correcta tu ubicación? Confirma o ajusta el pin.`
                : '📋 Tu pin está fuera de nuestra zona de cobertura. Ajusta el pin si crees que hay un error y confirma.';
        }
    }

    if (usingSavedAddress && !addressHasLocation) {
        // Dirección guardada SIN coordenadas: mostrar mapa y solicitar ubicación
        checkoutDeliveryLocation = null;
        checkoutDeliveryZone = null;
        checkoutDeliveryFeeAmount = 0;
        checkoutDeliveryFeePending = false;
        checkoutInfoUI.deliveryZone = null;
        checkoutInfoUI.deliveryLatitude = null;
        checkoutInfoUI.deliveryLongitude = null;
        if (checkoutInfoUI.deliveryZoneStatus) {
            checkoutInfoUI.deliveryZoneStatus.textContent = '📍 Para calcular el domicilio necesitamos tu ubicación. Usa el botón "Usar mi ubicación actual" o mueve el punto en el mapa hasta tu dirección y confirma.';
        }
    }

    // Recalcular deliveryFee y orderTotal después de actualizar checkoutDeliveryFeeAmount
    const deliveryFee = getCheckoutDeliveryFee(fulfillmentType);
    const orderTotal = getCheckoutOrderTotal(fulfillmentType);

    // Mapa siempre visible para domicilio — el cliente siempre verifica su pin
    const shouldShowDeliveryMap = requiresAddress;

    if (checkoutInfoUI.deliveryMapPanel) {
        checkoutInfoUI.deliveryMapPanel.hidden = !shouldShowDeliveryMap;
        if (shouldShowDeliveryMap) {
            window.setTimeout(initializeCheckoutDeliveryMap, 0);
        }
    }

    if (checkoutInfoUI.confirmLocationButton) {
        checkoutInfoUI.confirmLocationButton.hidden = !shouldShowDeliveryMap || !checkoutDeliveryLocation;
    }

    if (checkoutInfoUI.saveAddressField && checkoutInfoUI.saveAddressToggle && checkoutInfoUI.addressBookHint) {
        const canSaveMoreAddresses = savedAddresses.length < MAX_CUSTOMER_SAVED_ADDRESSES;
        const selectedNewAddress = requiresAddress && (!hasSavedAddresses || selectedAddressOption === 'new');
        const showSaveOption = selectedNewAddress && Boolean(activeCustomerProfile) && canSaveMoreAddresses;
        checkoutInfoUI.saveAddressField.hidden = !showSaveOption;
        checkoutInfoUI.saveAddressToggle.checked = showSaveOption ? checkoutInfoUI.saveAddressToggle.checked : false;
        checkoutInfoUI.saveAddressToggle.disabled = !showSaveOption;
        checkoutInfoUI.addressBookHint.hidden = !selectedNewAddress;
        checkoutInfoUI.addressBookHint.textContent = canSaveMoreAddresses
            ? `Puedes guardar esta direccion en tu perfil. Te quedan ${MAX_CUSTOMER_SAVED_ADDRESSES - savedAddresses.length} espacio(s).`
            : 'Ya completaste tus 5 direcciones guardadas. Esta direccion solo se usara en este pedido.';
    }

    if (checkoutInfoUI.deliveryFeeRow) {
        checkoutInfoUI.deliveryFeeRow.hidden = !requiresAddress || !checkoutDeliveryLocationConfirmed;
    }

    if (checkoutInfoUI.deliveryFeeValue && checkoutDeliveryLocationConfirmed) {
        checkoutInfoUI.deliveryFeeValue.textContent = checkoutDeliveryFeePending ? 'Por confirmar' : formatCurrency(deliveryFee);
    }

    if (checkoutInfoUI.discountRow && checkoutInfoUI.discountValue) {
        checkoutInfoUI.discountRow.hidden = discountAmount <= 0;
        checkoutInfoUI.discountValue.textContent = formatCurrency(discountAmount);
    }

    if (checkoutInfoUI.orderTotalValue) {
        const displayTotal = (requiresAddress && !checkoutDeliveryLocationConfirmed)
            ? getCartTotalAmount()
            : (requiresAddress && checkoutDeliveryFeePending ? getCartTotalAmount() : orderTotal);
        checkoutInfoUI.orderTotalValue.textContent = formatCurrency(displayTotal);
    }
}

async function _persistSavedAddressCoords(profile, savedAddresses) {
    try {
        const db = getPublicFirebaseDb();
        const phoneDigits = normalizePhoneDigits(String(profile.customerPhone || ''));
        if (!phoneDigits || phoneDigits.length < 10) return;
        await db.collection(CLIENTS_COLLECTION).doc(`phone_${phoneDigits}`).update({ savedAddresses });
        // Reflejar en el perfil local también
        setActiveCustomerProfile({ ...profile, savedAddresses });
    } catch (_e) {
        // Silent — coords ya quedaron en localStorage
    }
}

function openCheckoutInfoModal() {
    closeCheckoutInfoModal();

    checkoutDeliveryZone = null;
    checkoutDeliveryFeeAmount = 0;
    checkoutDeliveryLocation = null;
    checkoutDeliveryLocationConfirmed = false;
    checkoutDeliveryFeePending = false;

    const profile = activeCustomerProfile;
    const savedAddresses = profile ? getCustomerSavedAddresses(profile) : [];
    const profileSummaryMarkup = profile
        ? `
            <div class="customer-profile-summary">
                <strong>${escapeHtml(profile.customerName)}</strong>
                <span>WhatsApp: ${escapeHtml(profile.customerPhone)}</span>
            </div>
        `
        : '';
    const introText = profile
        ? ''
        : 'Selecciona cómo deseas recibir tu pedido y completa tus datos de contacto.';

    const modal = document.createElement('div');
    modal.id = 'checkout-info-modal';
    modal.className = 'support-modal';
    modal.classList.add('is-open');
    modal.innerHTML = `
        <div class="support-modal-card liquid-glass" role="dialog" aria-modal="true" aria-label="Confirmar pedido">
            <button type="button" class="support-modal-close" aria-label="Cerrar confirmación de pedido">&times;</button>
            <p class="support-modal-kicker">Confirma tu pedido</p>
            <h3 class="support-modal-title">Finaliza tu pedido</h3>
            ${introText ? `<p class="support-modal-text">${introText}</p>` : ''}
            ${profileSummaryMarkup}
            ${profile ? '' : `
            <label class="support-field">
                <span>Nombre de quien recibe</span>
                <input type="text" id="checkoutCustomerName" placeholder="Escribe el nombre">
            </label>`}
            <label class="support-field">
                <span>Como deseas recibir tu pedido</span>
                <select id="checkoutFulfillmentType">
                    <option value="delivery">🛵 Domicilio</option>
                    <option value="pickup">🥡 Recoger en el restaurante</option>
                    <option value="dine_in">🍽️ Comer en el local</option>
                </select>
            </label>
            ${profile && savedAddresses.length ? `
            <label class="support-field" id="checkoutSavedAddressField" hidden>
                <span>Elegir dirección</span>
                <select id="checkoutSavedAddressChoice">
                    ${savedAddresses.map((entry, index) => `<option value="saved:${index}">Direccion ${index + 1}: ${escapeHtml(getCustomerSavedAddressLabel(entry))}</option>`).join('')}
                    <option value="new">Agregar direccion nueva</option>
                </select>
                <p class="support-field-hint">Puedes usar una direccion guardada o escribir una nueva solo para este pedido.</p>
            </label>` : ''}
            <label class="support-field" id="checkoutDeliveryAddressField" hidden>
                <span>${profile ? 'Direccion de entrega' : 'Direccion de entrega'}</span>
                <textarea id="checkoutDeliveryAddress" rows="4" placeholder="Escribe la direccion completa"></textarea>
            </label>
            <div class="checkout-map-panel" id="checkoutDeliveryMapPanel" hidden>
                <div class="checkout-map-actions">
                    <button type="button" id="checkoutUseLocationButton" class="support-send-btn checkout-map-button">📍 Usar mi ubicación actual</button>
                    <span id="checkoutDeliveryZoneStatus" class="checkout-zone-status">Activa tu ubicación para calcular la tarifa de domicilio.</span>
                    <button type="button" id="checkoutRequestQuoteButton" class="checkout-map-button" style="display:none;">📩 Solicitar cotización</button>
                    <button type="button" id="checkoutConfirmLocationButton" class="support-send-btn checkout-map-button" hidden>✓ Confirmar ubicación</button>
                </div>
                <div id="deliveryMap" class="checkout-map-area"></div>
            </div>
            ${profile ? `
            <label class="support-check" id="checkoutSaveAddressField" hidden>
                <input type="checkbox" id="checkoutSaveAddressToggle">
                <span>Guardar esta direccion en mi perfil para usarla mas adelante.</span>
            </label>
            <p class="support-field-hint" id="checkoutAddressBookHint" hidden></p>` : ''}
            ${profile ? '' : `
            <label class="support-field">
                <span>Telefono</span>
                <input type="tel" id="checkoutCustomerPhone" placeholder="Escribe el telefono de contacto">
            </label>`}
            <div class="customer-profile-summary customer-profile-summary-grid checkout-summary-grid">
                <div id="checkoutDeliveryFeeRow" hidden>
                    <span>Costo de envío</span>
                    <strong id="checkoutDeliveryFeeValue">${formatCurrency(checkoutDeliveryFeeAmount)}</strong>
                </div>
                <div id="checkoutDiscountRow" hidden>
                    <span>Descuento</span>
                    <strong id="checkoutDiscountValue">${formatCurrency(getCheckoutDiscountAmount())}</strong>
                </div>
                <div>
                    <span>Total</span>
                    <strong id="checkoutOrderTotalValue">${formatCurrency(getCheckoutOrderTotal('pickup'))}</strong>
                </div>
            </div>
            <p class="support-feedback" id="checkoutInfoFeedback"></p>
            <div class="support-actions">
                <button type="button" class="support-send-btn" id="checkoutSubmitButton">Finalizar pedido</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    checkoutInfoUI = {
        modal,
        close: modal.querySelector('.support-modal-close'),
        name: modal.querySelector('#checkoutCustomerName'),
        fulfillmentType: modal.querySelector('#checkoutFulfillmentType'),
        savedAddressField: modal.querySelector('#checkoutSavedAddressField'),
        savedAddressChoice: modal.querySelector('#checkoutSavedAddressChoice'),
        addressField: modal.querySelector('#checkoutDeliveryAddressField'),
        address: modal.querySelector('#checkoutDeliveryAddress'),
        saveAddressField: modal.querySelector('#checkoutSaveAddressField'),
        saveAddressToggle: modal.querySelector('#checkoutSaveAddressToggle'),
        addressBookHint: modal.querySelector('#checkoutAddressBookHint'),
        phone: modal.querySelector('#checkoutCustomerPhone'),
        deliveryMapPanel: modal.querySelector('#checkoutDeliveryMapPanel'),
        useLocationButton: modal.querySelector('#checkoutUseLocationButton'),
        confirmLocationButton: modal.querySelector('#checkoutConfirmLocationButton'),
        deliveryZoneStatus: modal.querySelector('#checkoutDeliveryZoneStatus'),
        requestQuoteButton: modal.querySelector('#checkoutRequestQuoteButton'),
        deliveryFeeRow: modal.querySelector('#checkoutDeliveryFeeRow'),
        deliveryFeeValue: modal.querySelector('#checkoutDeliveryFeeValue'),
        discountRow: modal.querySelector('#checkoutDiscountRow'),
        discountValue: modal.querySelector('#checkoutDiscountValue'),
        orderTotalValue: modal.querySelector('#checkoutOrderTotalValue'),
        feedback: modal.querySelector('#checkoutInfoFeedback'),
        send: modal.querySelector('#checkoutSubmitButton'),
        savedAddresses,
        deliveryMap: null,
        deliveryMapMarker: null,
        deliveryZone: null,
        deliveryLatitude: null,
        deliveryLongitude: null
    };

    checkoutInfoUI.close.addEventListener('click', closeCheckoutInfoModal);
    checkoutInfoUI.send.addEventListener('click', submitCheckoutInfo);
    checkoutInfoUI.fulfillmentType.addEventListener('change', (event) => {
        updateCheckoutInfoModalState();
        if (getCheckoutFulfillmentType(event.target.value) === 'delivery') {
            initializeCheckoutDeliveryMap();
        }
    });
    checkoutInfoUI.savedAddressChoice?.addEventListener('change', () => {
        checkoutDeliveryLocationConfirmed = false;
        updateCheckoutInfoModalState();
    });
    checkoutInfoUI.useLocationButton?.addEventListener('click', () => {
        initializeCheckoutDeliveryMap();
        requestCheckoutGeolocation();
    });
    checkoutInfoUI.confirmLocationButton?.addEventListener('click', async () => {
        checkoutDeliveryLocationConfirmed = true;
        // Guardar coordenadas en Firestore si la dirección guardada no las tenía
        if (activeCustomerProfile && checkoutDeliveryLocation && Array.isArray(checkoutInfoUI.savedAddresses)) {
            await _persistSavedAddressCoords(activeCustomerProfile, checkoutInfoUI.savedAddresses);
        }
        updateCheckoutInfoModalState();
    });
    checkoutInfoUI.requestQuoteButton?.addEventListener('click', requestDeliveryQuote);
    // Geocodificación automática al escribir la dirección
    checkoutInfoUI.address?.addEventListener('input', handleCheckoutAddressInput);

    modal.addEventListener('click', (event) => {
        if (event.target === modal && _lastMousedownTarget === modal) {
            closeCheckoutInfoModal();
        }
    });

    syncBodyScrollLock();
    if (profile && checkoutInfoUI.address && !savedAddresses.length) {
        checkoutInfoUI.address.value = profile.address || '';
    }
    if (checkoutInfoUI.fulfillmentType) {
        checkoutInfoUI.fulfillmentType.value = 'delivery';
    }
    updateCheckoutInfoModalState();
    initializeCheckoutDeliveryMap();
    (checkoutInfoUI.address || checkoutInfoUI.name)?.focus();
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

function addItemToCart(productName, categoryName, orderOptions = { type: 'solo' }, buttonId, initialQuantity = 1) {
    // Interceptar para mostrar upgrades si corresponde
    const upgradeExtra = Number(orderOptions?.upgradeExtra || 0);
    const upgradeHandled = !!(orderOptions?.upgradeHandled);
    if (!upgradeHandled) {
        const cfg = publicUpgradesConfig;
        // 1. Nivel producto: acompañantes configurados específicamente para este producto
        const productData = _getCartItemProductData(productName);
        const prodAcomp = productData?.acompanantes;
        if (prodAcomp?.activo && Array.isArray(prodAcomp.ids) && prodAcomp.ids.length > 0 && cfg) {
            const filteredOpts = (cfg.opciones || [])
                .filter((o) => o.activo && o.activo_menu !== false && prodAcomp.ids.includes(o.id))
                .sort((a, b) => (a.orden || 99) - (b.orden || 99));
            if (filteredOpts.length > 0) {
                _publicUpgradePending = { productName, categoryName, orderOptions, buttonId, filteredOpts };
                openPublicUpgradeSheet();
                return;
            }
        }
        // 2. Nivel categoría: todas las opciones activas si la categoría está habilitada
        if (_shouldShowPublicUpgrade(categoryName)) {
            _publicUpgradePending = { productName, categoryName, orderOptions, buttonId };
            openPublicUpgradeSheet();
            return;
        }
    }

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
    const unitPrice = resolveCartUnitPrice(safeProductName, safeCategoryName, normalizedOptions) + upgradeExtra;
    const itemKey = getCartItemKey(safeProductName, safeCategoryName, normalizedOptions);
    const existingItem = shoppingCart.find((item) => item.itemKey === itemKey);

    const qty = Math.max(1, Number(initialQuantity) || 1);
    if (existingItem) {
        existingItem.quantity = Number(existingItem.quantity || 0) + qty;
        existingItem.unitPrice = unitPrice;
    } else {
        shoppingCart.push({
            itemKey,
            productName: safeProductName,
            categoryName: safeCategoryName,
            orderOptions: normalizedOptions,
            unitPrice,
            quantity: qty
        });
    }

    saveCartState();
    renderCartUI();
    openCartDrawer();
    playCartAddSound();
    showCartAddedToast(safeCategoryName, safeProductName);
}

function renderCartUI() {
    if (!cartUI) {
        initCartUI();
        if (!cartUI) {
            return;
        }
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
        const originalUnitPrice = getCartItemOriginalUnitPrice(item);
        const subtotal = unitPrice * Number(item.quantity || 0);
        const discountAmount = getCartItemDiscountAmount(item);
        const row = document.createElement('div');
        row.className = 'cart-item';

        const info = document.createElement('div');
        info.className = 'cart-item-info';

        const title = document.createElement('strong');
        title.textContent = item.productName;
        title.className = 'cart-item-title-editable';
        title.title = 'Toca para editar';
        title.addEventListener('click', () => openCartItemEditor(item.itemKey));

        const normalizedType = normalizeOrderOptions(item.orderOptions).type;
        const optionText = getCartOptionLabel(item.categoryName, item.orderOptions, { includeComment: false });
        const option = document.createElement('p');
        option.className = 'cart-item-option';
        if (normalizedType !== 'solo') {
            option.textContent = optionText;
        }

        const price = document.createElement('div');
        price.className = 'cart-item-price-row';
        if (discountAmount > 0) {
            const origSubtotal = originalUnitPrice * Number(item.quantity || 0);
            const discountPct = Math.round((1 - unitPrice / originalUnitPrice) * 100);
            price.innerHTML = `
                <s class="cart-item-orig-price">${formatCurrency(origSubtotal)}</s>
                <span class="cart-item-discount-pill">-${discountPct}%</span>
                <span class="cart-item-final-price">${formatCurrency(subtotal)}</span>
                <span class="cart-item-savings">Ahorras ${formatCurrency(discountAmount)}</span>`;
        } else {
            price.innerHTML = `<span class="cart-item-final-price">${formatCurrency(unitPrice)} × ${item.quantity} = ${formatCurrency(subtotal)}</span>`;
        }

        const existingComment = String(item.orderOptions?.comment || '').trim();
        const commentBadge = document.createElement('p');
        commentBadge.className = 'cart-item-comment-badge';
        if (existingComment) {
            commentBadge.textContent = `💬 ${existingComment}`;
        } else {
            commentBadge.textContent = '✏️ Agregar nota…';
            commentBadge.classList.add('cart-item-comment-empty');
        }
        commentBadge.addEventListener('click', () => openCartItemEditor(item.itemKey));

        info.appendChild(title);

        const promoLabel = String(item.orderOptions?.promoLabel || '').trim();
        if (promoLabel) {
            const promoBadge = document.createElement('span');
            promoBadge.className = 'cart-item-promo-badge';
            promoBadge.textContent = `🏷 ${promoLabel}`;
            info.appendChild(promoBadge);
        }

        if (normalizedType !== 'solo') info.appendChild(option);
        info.appendChild(price);
        info.appendChild(commentBadge);

        const controls = document.createElement('div');
        controls.className = 'cart-item-controls';

        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'cart-remove-btn';
        remove.setAttribute('aria-label', 'Quitar producto');
        remove.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>`;
        remove.addEventListener('click', () => {
            updateCartItemQuantity(item.itemKey, -Number(item.quantity || 1));
        });

        const qtyRow = document.createElement('div');
        qtyRow.className = 'cart-qty-row';

        const is2x1 = item.orderOptions?.promo2x1 === true;
        const qtyStep = is2x1 ? 2 : 1;

        const minus = document.createElement('button');
        minus.type = 'button';
        minus.className = 'cart-qty-btn';
        minus.textContent = '-';
        minus.addEventListener('click', () => {
            if (is2x1 && Number(item.quantity || 0) <= 2) {
                updateCartItemQuantity(item.itemKey, -Number(item.quantity || 2));
            } else {
                updateCartItemQuantity(item.itemKey, -qtyStep);
            }
        });

        const quantitySpan = document.createElement('span');
        quantitySpan.className = 'cart-qty-value';
        quantitySpan.textContent = String(item.quantity);

        const plus = document.createElement('button');
        plus.type = 'button';
        plus.className = 'cart-qty-btn';
        plus.textContent = '+';
        plus.addEventListener('click', () => {
            updateCartItemQuantity(item.itemKey, qtyStep);
        });

        qtyRow.appendChild(minus);
        qtyRow.appendChild(quantitySpan);
        qtyRow.appendChild(plus);

        controls.appendChild(remove);
        controls.appendChild(qtyRow);

        row.appendChild(info);
        row.appendChild(controls);
        cartUI.list.appendChild(row);
    });

    const cartDiscountTotal = getCartDiscountTotalAmount();
    cartUI.summary.textContent = `${shoppingCart.length} referencia${shoppingCart.length === 1 ? '' : 's'} | ${totalItems} producto${totalItems === 1 ? '' : 's'}${cartDiscountTotal > 0 ? ` | Descuento ${formatCurrency(cartDiscountTotal)}` : ''} | Total ${formatCurrency(getCartTotalAmount())}`;
    cartUI.checkout.disabled = !shoppingCart.length;
    cartUI.clear.disabled = false;
    syncOrderingAvailabilityUI();
}

/* ===== EDITOR DE ITEM DEL CARRITO ===== */

function _getCartItemProductData(productName) {
    const baseName = String(productName || '').split('+')[0].trim().toLowerCase();
    return (latestProducts || []).find(p =>
        String(p.nombre || p.name || '').trim().toLowerCase() === baseName
    ) || null;
}

function openCartItemEditor(itemKey) {
    const item = shoppingCart.find(e => e.itemKey === itemKey);
    if (!item) return;

    const productData = _getCartItemProductData(item.productName);
    const prodAcomp = productData && productData.acompanantes;
    const hasAcomp = prodAcomp && prodAcomp.activo && Array.isArray(prodAcomp.ids) && prodAcomp.ids.length > 0;

    // Obtener opciones de acompañantes disponibles para este producto
    let acompOptions = [];
    if (hasAcomp) {
        const cfg = publicUpgradesConfig || null;
        if (cfg && Array.isArray(cfg.opciones)) {
            acompOptions = cfg.opciones.filter(o => o.activo && prodAcomp.ids.includes(o.id));
        }
    }

    // Eliminar sheet previo si existe
    const existing = document.getElementById('cartItemEditorSheet');
    if (existing) existing.remove();

    const currentComment = String(item.orderOptions?.comment || '').trim();

    // Detectar acompañante actualmente seleccionado (si el nombre contiene "+")
    const currentUpgradeNote = item.productName.includes('+')
        ? item.productName.split('+').slice(1).join('+').trim()
        : '';

    const sheet = document.createElement('div');
    sheet.id = 'cartItemEditorSheet';
    sheet.className = 'cie-overlay';
    sheet.innerHTML = `
        <div class="cie-sheet">
            <div class="cie-header">
                <span class="cie-product-name">${String(item.productName || '').split('+')[0].trim()}</span>
                <button type="button" class="cie-close-btn" id="cieCloseBtn">✕</button>
            </div>
            <div class="cie-body">
                ${acompOptions.length > 0 ? `
                <div class="cie-section">
                    <p class="cie-section-label">Acompañante</p>
                    <div class="cie-acomp-list" id="cieAcompList">
                        <label class="cie-acomp-item ${!currentUpgradeNote ? 'is-selected' : ''}">
                            <input type="radio" name="cieAcomp" value="" ${!currentUpgradeNote ? 'checked' : ''}>
                            <span class="cie-acomp-name">Sin acompañante</span>
                            <span class="cie-acomp-price">—</span>
                        </label>
                        ${acompOptions.map(o => {
                            const sel = currentUpgradeNote && currentUpgradeNote.toLowerCase().includes(String(o.nombre || '').toLowerCase());
                            return `<label class="cie-acomp-item ${sel ? 'is-selected' : ''}">
                                <input type="radio" name="cieAcomp" value="${o.id}" data-nombre="${o.nombre}" data-precio="${o.precio || 0}" ${sel ? 'checked' : ''}>
                                <span class="cie-acomp-name">${o.nombre}</span>
                                <span class="cie-acomp-price">${Number(o.precio || 0) > 0 ? '+' + formatCurrency(Number(o.precio)) : 'Incluido'}</span>
                            </label>`;
                        }).join('')}
                    </div>
                </div>` : ''}
                <div class="cie-section">
                    <p class="cie-section-label">Nota para cocina <span style="font-weight:400;opacity:0.6;">(opcional)</span></p>
                    <textarea id="cieCommentTA" class="cie-comment-ta" maxlength="120" placeholder="Ej: sin cebolla, extra picante, bien cocido…">${currentComment}</textarea>
                    <p class="cie-char-count" id="cieCharCount">${currentComment.length}/120</p>
                </div>
            </div>
            <div class="cie-footer">
                <button type="button" class="cie-save-btn" id="cieSaveBtn">Guardar cambios</button>
            </div>
        </div>
    `;

    document.body.appendChild(sheet);
    requestAnimationFrame(() => sheet.classList.add('is-open'));

    // Highlight radio seleccionado al cambiar
    sheet.querySelectorAll('input[name="cieAcomp"]').forEach(radio => {
        radio.addEventListener('change', () => {
            sheet.querySelectorAll('.cie-acomp-item').forEach(el => el.classList.remove('is-selected'));
            radio.closest('.cie-acomp-item').classList.add('is-selected');
        });
    });

    // Contador de caracteres
    const ta = sheet.querySelector('#cieCommentTA');
    const charCount = sheet.querySelector('#cieCharCount');
    if (ta && charCount) {
        ta.addEventListener('input', () => { charCount.textContent = `${ta.value.length}/120`; });
    }

    // Cerrar
    const closeSheet = () => {
        sheet.classList.remove('is-open');
        setTimeout(() => sheet.remove(), 280);
    };
    sheet.querySelector('#cieCloseBtn').addEventListener('click', closeSheet);
    sheet.addEventListener('click', e => { if (e.target === sheet) closeSheet(); });

    // Guardar
    sheet.querySelector('#cieSaveBtn').addEventListener('click', () => {
        const newComment = ta ? ta.value.trim() : '';
        const selectedRadio = sheet.querySelector('input[name="cieAcomp"]:checked');
        const newAcompId = selectedRadio ? selectedRadio.value : '';
        const newAcompNombre = selectedRadio ? (selectedRadio.dataset.nombre || '') : '';
        const newAcompPrecio = selectedRadio ? Number(selectedRadio.dataset.precio || 0) : 0;

        _saveCartItemEdit(itemKey, newComment, newAcompId, newAcompNombre, newAcompPrecio);
        closeSheet();
    });
}

function _saveCartItemEdit(itemKey, newComment, newAcompId, newAcompNombre, newAcompPrecio) {
    const idx = shoppingCart.findIndex(e => e.itemKey === itemKey);
    if (idx === -1) return;
    const item = shoppingCart[idx];
    const savedQty = Number(item.quantity || 1);

    // Reconstruir nombre base (sin acompañante previo)
    const baseName = String(item.productName || '').split('+')[0].trim();
    const newProductName = newAcompId && newAcompNombre
        ? `${baseName} + ${newAcompNombre}`
        : baseName;

    const newOptions = {
        ...item.orderOptions,
        comment: newComment,
        upgradeHandled: Boolean(newAcompId),
        upgradeExtra: newAcompPrecio
    };

    const baseUnitPrice = resolveCartUnitPrice(baseName, item.categoryName, newOptions);
    const newUnitPrice = baseUnitPrice + newAcompPrecio;
    const newKey = getCartItemKey(newProductName, item.categoryName, newOptions);

    // Verificar si ya existe un item con la misma clave (evitar duplicado)
    const existingDup = shoppingCart.find((e, i) => e.itemKey === newKey && i !== idx);
    if (existingDup) {
        existingDup.quantity = Number(existingDup.quantity || 0) + savedQty;
        shoppingCart.splice(idx, 1);
    } else {
        shoppingCart[idx] = {
            ...item,
            itemKey: newKey,
            productName: newProductName,
            orderOptions: newOptions,
            unitPrice: newUnitPrice
        };
    }

    saveCartState();
    renderCartUI();
}

/* ===== FIN EDITOR DE ITEM DEL CARRITO ===== */

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
            </div>
            <button type="button" class="cart-close-btn" aria-label="Cerrar carrito">&times;</button>
        </div>
        <div class="cart-items" id="cartItems"></div>
        <div class="cart-drawer-footer">
            <p class="cart-summary" id="cartSummary"></p>
            <div class="cart-action-bar">
                <button type="button" class="cart-continue-btn" id="cartContinueBtn">
                    <svg class="cbtn-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                    <span class="cbtn-lbl">Menú</span>
                </button>
                <button type="button" class="cart-checkout-btn" id="cartCheckoutBtn">
                    <svg class="cbtn-ico" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.115.549 4.1 1.51 5.833L0 24l6.334-1.494A11.927 11.927 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/></svg>
                    <span class="cbtn-lbl">Enviar pedido</span>
                </button>
                <button type="button" class="cart-clear-btn" id="cartClearBtn">
                    <svg class="cbtn-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                    <span class="cbtn-lbl">Vaciar</span>
                </button>
            </div>
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
    if (!_closingByBackBtn) _popModalState();
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
    _pushModalState();
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
        if (event.target === modal && _lastMousedownTarget === modal) {
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
                staticPrice: parseLocalizedPrice(optionItem.price),
                comment: commentField.textarea.value
            }, buttonId);
        });
        optionButtons.appendChild(button);
    });

    modal.addEventListener('click', (event) => {
        if (event.target === modal && _lastMousedownTarget === modal) {
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
        if (event.target === modal && _lastMousedownTarget === modal) {
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
        if (event.target === modal && _lastMousedownTarget === modal) {
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
        if (event.target === modal && _lastMousedownTarget === modal) {
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
        if (event.target === modal && _lastMousedownTarget === modal) {
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

            const normName = normalizeAssetLookup(normalizeCategoryKey(productName));
            let comboKey = './combosconpapasybebidas/comboburgernormal.png';
            if (normName.includes('papuda')) comboKey = './combosconpapasybebidas/comboburgerpapuda.png';
            else if (normName.includes('super')) comboKey = './combosconpapasybebidas/comboburgersuper.png';
            else if (normName.includes('perro')) comboKey = './combosconpapasybebidas/comboperronormal.png';
            const comboPrices = COMBOS_CON_PAPAS_IMAGE_PRICES[comboKey];
            const comboStaticPrice = comboPrices && comboPrices[count] !== undefined ? comboPrices[count] : null;

            closeComboChoiceModal();
            addItemToCart(productName, categoryName, {
                ...extraOptions,
                type: 'combo-meal',
                peopleCount: count,
                drinks: drinkValues,
                staticPrice: comboStaticPrice,
                comment: commentField.textarea.value
            }, buttonId);
        };
    }

    drinksWrap.appendChild(drinksTitle);
    drinksWrap.appendChild(drinkSelectsContainer);
    drinksWrap.appendChild(commentField.wrap);
    drinksWrap.appendChild(confirmButton);

    modal.addEventListener('click', (event) => {
        if (event.target === modal && _lastMousedownTarget === modal) {
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
        if (event.target === modal && _lastMousedownTarget === modal) {
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

// Carrusel continuo del home screen
let _homeComboRAF = null;
let _homeComboLastTs = 0;
let _homeComboEl = null;

function _homeComboTick(ts) {
    if (!_homeComboEl) return;
    if (!_homeComboLastTs) _homeComboLastTs = ts;
    const dt = Math.min((ts - _homeComboLastTs) / 1000, 0.1);
    _homeComboLastTs = ts;
    _homeComboEl.scrollLeft += 32 * dt;
    const half = _homeComboEl.scrollWidth / 2;
    if (half > 0 && _homeComboEl.scrollLeft >= half) {
        _homeComboEl.scrollLeft -= half;
    }
    _homeComboRAF = requestAnimationFrame(_homeComboTick);
}

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
    { key: 'salchipapas', name: 'SALCHIPAPAS' }
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

const HIDDEN_PRODUCT_KEYS = new Set(['empanadas', 'empanada']);
const HIDDEN_PRODUCT_NAME_PARTS = [];

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
    // Prioridad 1: image_url configurada desde el admin en Firestore
    const remote = String(product?.image_url || '').trim();
    if (remote) {
        return remote;
    }

    // Prioridad 2: mapa local de imágenes por nombre de producto
    const productName = String(product?.nombre || product?.name || '').trim();
    const normalizedProductName = normalizeAssetLookup(productName);
    const localMatch = LOCAL_PRODUCT_IMAGE_MAP.get(normalizedProductName);
    if (localMatch) {
        return localMatch;
    }

    return 'logo.png';
}

function resolveCategoryImage(categoryName) {
    const normalizedCategory = normalizeAssetLookup(categoryName);
    const remoteCategory = (Array.isArray(activeCategoryMeta) ? activeCategoryMeta : [])
        .concat(Array.isArray(allCategoryMeta) ? allCategoryMeta : [])
        .find((category) => normalizeCategoryKey(category?.name) === normalizeCategory);
    const remoteImage = String(remoteCategory?.image_url || '').trim();

    if (remoteImage) {
        return remoteImage;
    }

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
        const precio = resolveProductDisplayPrice(product);
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
            estado: product.estado || (product.paused ? 'paused' : 'active'),
            order: product.order != null ? Number(product.order) : undefined
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

            const visibleProducts = data.products
                .filter((product) => product.estado !== 'paused')
                .sort((a, b) => {
                    const oa = a.order ?? 9999;
                    const ob = b.order ?? 9999;
                    if (oa !== ob) return oa - ob;
                    return String(a.nombre || '').localeCompare(String(b.nombre || ''), 'es');
                });

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
                    price.textContent = `$ ${resolveProductDisplayPrice(product).toLocaleString('es-CO')}`;
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
        // Si no se pasan items, usar productos con es_destacado:true de Firestore
        let effectiveItems = items;
        if (!Array.isArray(effectiveItems) || !effectiveItems.length) {
            const firestoreFeatured = (Array.isArray(latestProducts) ? latestProducts : [])
                .filter((p) => p.es_destacado === true && p.estado !== 'paused' && !isExcludedRecommendedCategory(p.categoria || p.category || ''))
                .sort((a, b) => {
                    const oa = a.order ?? 9999;
                    const ob = b.order ?? 9999;
                    if (oa !== ob) return oa - ob;
                    return String(a.nombre || '').localeCompare(String(b.nombre || ''), 'es');
                });
            if (firestoreFeatured.length) effectiveItems = firestoreFeatured;
        }

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
        const rawItems = Array.isArray(effectiveItems) && effectiveItems.length ? effectiveItems : featuredFallbackItems;
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

        const deltaSeconds = Math.max(0, Math.min((timestamp - featuredCarouselLastTimestamp) / 1000, 0.1));
        featuredCarouselLastTimestamp = timestamp;

        // Solo escribir scrollLeft si el desplazamiento es perceptible (≥0.5px)
        // — evita forzar layout en frames donde el delta es mínimo
        const delta = speedPxPerSecond * deltaSeconds;
        if (delta >= 0.5) {
            const next = carousel.scrollLeft + delta;
            carousel.scrollLeft = next >= segmentWidth * 2 ? next - segmentWidth : next;
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

    // Build order map from Firestore category data
    const firestoreOrderMap = new Map();
    sourceCategories.forEach((item) => {
        const key = normalizeCategoryKey(String(item?.name || '').trim());
        if (key && item.order != null) firestoreOrderMap.set(key, Number(item.order));
    });

    sourceCategories.forEach((item) => {
        const name = item?.name;
        const cleanName = String(name || '').trim();
        const key = normalizeCategoryKey(cleanName);
        if (!cleanName || !key || keys.has(key) || EXCLUDE_KEYS.has(key)) {
            return;
        }
        keys.add(key);
        uniqueMap.set(key, { name: cleanName, key, order: item.order });
    });

    latestProducts.forEach((product) => {
        const name = product.categoria || product.category || '';
        const cleanName = String(name || '').trim();
        const key = normalizeCategoryKey(cleanName);
        if (!cleanName || !key || keys.has(key) || EXCLUDE_KEYS.has(key)) {
            return;
        }
        keys.add(key);
        uniqueMap.set(key, { name: cleanName, key, order: firestoreOrderMap.get(key) });
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

        uniqueMap.set(key, { key, name, order: firestoreOrderMap.get(key) });
    });

    // Merge entries that share matchKeys (e.g. 'perros calientes' + 'perros y salchipapas' → one entry)
    // Also attach matchKeys so getCategoryProducts can find products by any alias
    PINNED_CATEGORY_BUTTONS.forEach((pinned) => {
        const canonicalKey = normalizeCategoryKey(pinned.key);
        const allMatchKeys = (pinned.matchKeys || [pinned.key]).map((mk) => normalizeCategoryKey(mk));
        let canonicalEntry = uniqueMap.get(canonicalKey);
        allMatchKeys.forEach((mk) => {
            if (mk === canonicalKey) return;
            const dup = uniqueMap.get(mk);
            if (!dup) return;
            if (!canonicalEntry) {
                canonicalEntry = { key: canonicalKey, name: pinned.name || dup.name, order: dup.order };
                uniqueMap.set(canonicalKey, canonicalEntry);
            } else if (dup.order != null && (canonicalEntry.order == null || dup.order < canonicalEntry.order)) {
                canonicalEntry.order = dup.order;
            }
            uniqueMap.delete(mk);
        });
        if (canonicalEntry) canonicalEntry.matchKeys = allMatchKeys;
    });

    const priorityIndex = new Map(CATEGORY_BUTTON_PRIORITY.map((item, index) => [item, index]));

    const sorted = Array.from(uniqueMap.values()).sort((a, b) => {
        const aOrder = a.order ?? null;
        const bOrder = b.order ?? null;
        if (aOrder !== null && bOrder !== null) return aOrder - bOrder;
        if (aOrder !== null) return -1;
        if (bOrder !== null) return 1;
        const aPriority = priorityIndex.has(a.key) ? priorityIndex.get(a.key) : 999;
        const bPriority = priorityIndex.has(b.key) ? priorityIndex.get(b.key) : 999;
        if (aPriority !== bPriority) return aPriority - bPriority;
        return a.name.localeCompare(b.name, 'es');
    });

    // Inject bebidas virtual category when any active bebida has mostrar_categoria: true
    const hasBebidasCat = _latestBebidas.some((b) => b.estado === 'active' && b.mostrar_categoria);
    if (hasBebidasCat && !uniqueMap.has('bebidas')) {
        sorted.push({ key: 'bebidas', name: 'Bebidas', order: undefined });
    }

    return sorted;
}

function ensureForcedExplorerCategories(categories) {
    const byKey = new Map(categories.map((item) => [normalizeCategoryKey(item.key), item]));

    const COMBO_EXCLUDE = new Set([
        'combos de temporada', 'combos de temporadas', 'combos temporada',
        'combos familiares', 'combo familiar',
        'combos perros', 'combos de perros', 'combos perros y express', 'combos de perros y express', 'combos express',
        'combos burger', 'combo burger', 'combos de burger'
    ]);

    FORCED_CATEGORY_BUTTONS.forEach((item) => {
        const key = normalizeCategoryKey(item.key);
        const name = String(item.name || '').trim();
        if (!key || !name || !isCategoryAllowed(name) || COMBO_EXCLUDE.has(key)) return;
        if (!byKey.has(key)) byKey.set(key, { key, name });
    });

    const hasFirestoreOrder = Array.from(byKey.values()).some((c) => c.order != null);
    if (hasFirestoreOrder) {
        return Array.from(byKey.values()).sort((a, b) => {
            const oa = a.order ?? 9999;
            const ob = b.order ?? 9999;
            if (oa !== ob) return oa - ob;
            return String(a.name || '').localeCompare(String(b.name || ''), 'es');
        });
    }

    const priorityIndex = new Map(CATEGORY_BUTTON_PRIORITY.map((item, index) => [normalizeCategoryKey(item), index]));
    return Array.from(byKey.values()).sort((a, b) => {
        const aKey = normalizeCategoryKey(a.key);
        const bKey = normalizeCategoryKey(b.key);
        const aPriority = priorityIndex.has(aKey) ? priorityIndex.get(aKey) : 999;
        const bPriority = priorityIndex.has(bKey) ? priorityIndex.get(bKey) : 999;
        if (aPriority !== bPriority) return aPriority - bPriority;
        return a.name.localeCompare(b.name, 'es');
    });
}

function ensurePinnedExplorerCategories(categories) {
    const hasFirestoreOrder = (categories || []).some((c) => c.order != null);
    if (hasFirestoreOrder) {
        return (categories || []).sort((a, b) => {
            const oa = a.order ?? 9999;
            const ob = b.order ?? 9999;
            if (oa !== ob) return oa - ob;
            return String(a.name || '').localeCompare(String(b.name || ''), 'es');
        });
    }

    const inputMap = new Map((categories || []).map((item) => [normalizeCategoryKey(item.key), item]));
    const pinnedList = [];

    const COMBO_EXCLUDE = new Set([
        'combos de temporada', 'combos de temporadas', 'combos temporada',
        'combos familiares', 'combo familiar',
        'combos perros', 'combos de perros', 'combos perros y express', 'combos de perros y express', 'combos express',
        'combos burger', 'combo burger', 'combos de burger'
    ]);

    PINNED_CATEGORY_BUTTONS.forEach((item) => {
        const key = normalizeCategoryKey(item.key);
        if (!key || COMBO_EXCLUDE.has(key)) return;
        const existing = inputMap.get(key);
        pinnedList.push({
            key,
            name: existing?.name || item.name,
            matchKeys: (item.matchKeys || [item.key]).map((value) => normalizeCategoryKey(value))
        });
    });

    const pinnedKeys = new Set(pinnedList.map((item) => normalizeCategoryKey(item.key)));
    const pinnedMatchKeys = new Set();
    pinnedList.forEach((item) => {
        (item.matchKeys || []).forEach((mk) => pinnedMatchKeys.add(normalizeCategoryKey(mk)));
    });

    const dynamicRemainder = Array.from(inputMap.values())
        .filter((item) => {
            const k = normalizeCategoryKey(item.key);
            return !pinnedKeys.has(k) && !pinnedMatchKeys.has(k);
        })
        .sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'es'));

    return [...pinnedList, ...dynamicRemainder];
}

function getCategoryProducts(category, options = {}) {
    const includePaused = options.includePaused === true;
    const selectedKeys = new Set((category?.matchKeys || [category?.key || '']).map((value) => normalizeCategoryKey(value)).filter(Boolean));

    return latestProducts
        .map((product) => {
            const nombre = product.nombre || product.name || 'Producto';
            const precio = resolveProductDisplayPrice(product);
            const estado = String(product.estado || (product.paused ? 'paused' : 'active')).toLowerCase();
            const categoria = String(product.categoria || product.category || '').trim();
            return {
                nombre,
                precio,
                categoria,
                image_url: resolveProductImage(product),
                estado,
                order: product.order != null ? Number(product.order) : undefined
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
        .sort((a, b) => {
            const oa = a.order ?? 9999;
            const ob = b.order ?? 9999;
            if (oa !== ob) return oa - ob;
            return a.nombre.localeCompare(b.nombre, 'es');
        });
}

function renderManualCategoryGallery(panel, categoryName, _cards, visibleProducts, allProducts) {
    if (!panel || !categoryName) {
        return false;
    }

    const hasCatalogProducts = Array.isArray(allProducts) && allProducts.length > 0;

    if (hasCatalogProducts && !(visibleProducts || []).length) {
        panel.innerHTML = '<p class="category-empty">No hay productos cargados en esta categoria.</p>';
        return true;
    }

    // Renderizar directamente desde los productos de Firestore (fuente de verdad: el admin)
    const finalCards = (visibleProducts || []).map((product) => ({
        name: product.nombre,
        image: product.image_url || 'logo.png',
        orderImagePath: product.image_url || 'logo.png',
        fallbackImage: 'logo.png'
    }));

    if (!finalCards.length) {
        return false;
    }

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
        image.src = card.image;
        image.alt = card.name;
        image.style.width = '100%';
        image.style.borderRadius = '8px';
        image.addEventListener('error', () => {
            if (image.src !== window.location.origin + '/logo.png') {
                image.src = 'logo.png';
            }
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
    const focusProductsPanel = () => {
        if (!options.fromUserClick) {
            return;
        }

        panel.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        panel.classList.remove('focus-highlight');
        void panel.offsetWidth;
        panel.classList.add('focus-highlight');
    };

    // Custom renderer for the bebidas collection
    if (normalizeCategoryKey(selectedCategory.key) === 'bebidas') {
        renderBebidasPublicPanel(panel);
        focusProductsPanel();
        syncOrderingAvailabilityUI();
        return;
    }

    const rendered = renderManualCategoryGallery(
        panel,
        selectedCategory.name,
        [],
        products,
        allCategoryProducts
    );

    if (!rendered) {
        panel.innerHTML = '<p class="category-empty">No hay productos cargados en esta categoria.</p>';
    }

    focusProductsPanel();

    syncOrderingAvailabilityUI();
}
// --- BEBIDAS COLLECTION — PUBLIC MENU ---

function renderBebidasPublicPanel(panel) {
    if (!panel) return;
    panel.innerHTML = '';

    const activeBebidas = _latestBebidas.filter((b) => b.estado === 'active' && b.mostrar_categoria);

    if (!activeBebidas.length) {
        panel.innerHTML = '<p class="category-empty">No hay bebidas disponibles por ahora.</p>';
        return;
    }

    const gallery = document.createElement('div');
    gallery.className = 'bebidas-gallery-grid';
    gallery.style.display = 'grid';
    gallery.style.gridTemplateColumns = activeBebidas.length === 1 ? '1fr' : '1fr 1fr';
    gallery.style.gap = '15px';
    gallery.style.padding = '20px';
    if (activeBebidas.length === 1) {
        gallery.style.maxWidth = '420px';
        gallery.style.margin = '0 auto';
    }

    activeBebidas.forEach((bev) => {
        const item = document.createElement('div');
        item.className = 'card-pequena';
        item.style.cursor = 'pointer';
        item.addEventListener('click', () => openBebidaPublicPickerModal(bev));

        const img = document.createElement('img');
        img.src = bev.image_url || 'logo.png';
        img.alt = bev.marca;
        img.style.width = '100%';
        img.style.borderRadius = '8px';
        img.addEventListener('error', () => {
            if (img.src !== window.location.origin + '/logo.png') img.src = 'logo.png';
        });

        const label = document.createElement('p');
        label.textContent = bev.marca;
        label.style.textAlign = 'center';
        label.style.fontWeight = 'bold';
        label.style.marginTop = '5px';
        label.style.color = '#000';

        item.appendChild(img);
        item.appendChild(label);
        gallery.appendChild(item);
    });

    panel.appendChild(gallery);
}

function openBebidaPublicPickerModal(bev) {
    const prev = document.getElementById('bebida-pub-picker-modal');
    if (prev) prev.remove();

    const overlay = document.createElement('div');
    overlay.id = 'bebida-pub-picker-modal';
    overlay.className = 'bebidas-modal-overlay';

    const card = document.createElement('div');
    card.className = 'bebidas-modal-card liquid-glass';
    card.style.maxWidth = '360px';
    card.style.width = '92vw';

    // Header
    const img = document.createElement('img');
    img.className = 'bebidas-modal-image';
    img.src = bev.image_url || 'logo.png';
    img.alt = bev.marca;
    img.addEventListener('error', () => { if (img.src !== window.location.origin + '/logo.png') img.src = 'logo.png'; });

    const title = document.createElement('div');
    title.className = 'bebidas-modal-title';
    title.textContent = bev.marca;

    // Presentación label
    const presLabel = document.createElement('p');
    presLabel.style.cssText = 'margin:14px 0 6px;font-size:0.82rem;color:rgba(255,255,255,0.6);text-align:left;width:100%;padding:0 4px;';
    presLabel.textContent = 'Elige tu presentación:';

    // Presentación chips
    const presChips = document.createElement('div');
    presChips.className = 'combo-sabor-chips';
    presChips.style.justifyContent = 'flex-start';

    // Sabor section (hidden until presentación chosen)
    const saborSection = document.createElement('div');
    saborSection.style.cssText = 'width:100%;display:none;';

    const saborLabel = document.createElement('p');
    saborLabel.style.cssText = 'margin:14px 0 6px;font-size:0.82rem;color:rgba(255,255,255,0.6);text-align:left;padding:0 4px;';
    saborLabel.textContent = 'Elige el sabor:';

    const saborChips = document.createElement('div');
    saborChips.className = 'combo-sabor-chips';
    saborChips.style.justifyContent = 'flex-start';

    saborSection.appendChild(saborLabel);
    saborSection.appendChild(saborChips);

    let selectedPres = null;
    let selectedSabor = null;

    const renderSaborChips = () => {
        saborChips.innerHTML = '';
        if (!selectedPres || !selectedPres.sabores.length) {
            saborSection.style.display = 'none';
            return;
        }
        saborSection.style.display = '';
        selectedPres.sabores.forEach((sabor) => {
            const chip = document.createElement('button');
            chip.type = 'button';
            chip.className = 'combo-sabor-chip' + (selectedSabor === sabor ? ' active' : '');
            chip.textContent = sabor;
            chip.addEventListener('click', () => {
                selectedSabor = sabor;
                renderSaborChips();
            });
            saborChips.appendChild(chip);
        });
    };

    const renderPresChips = () => {
        presChips.innerHTML = '';
        bev.presentaciones.forEach((pres) => {
            const chip = document.createElement('button');
            chip.type = 'button';
            chip.className = 'combo-sabor-chip' + (selectedPres?.id === pres.id ? ' active' : '');
            const precioFmt = pres.precio ? ` — $${pres.precio.toLocaleString('es-CO')}` : '';
            chip.textContent = `${pres.nombre}${precioFmt}`;
            chip.addEventListener('click', () => {
                selectedPres = pres;
                selectedSabor = null;
                renderPresChips();
                renderSaborChips();
            });
            presChips.appendChild(chip);
        });
    };

    renderPresChips();

    // Actions
    const actions = document.createElement('div');
    actions.className = 'bebidas-modal-actions';
    actions.style.marginTop = '18px';

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'bebidas-modal-btn bebidas-modal-btn-secondary';
    closeBtn.textContent = 'Regresar';
    closeBtn.addEventListener('click', () => overlay.remove());

    const orderBtn = document.createElement('button');
    orderBtn.type = 'button';
    orderBtn.className = 'bebidas-modal-btn bebidas-modal-btn-primary';
    orderBtn.textContent = 'Agregar al pedido';
    orderBtn.addEventListener('click', () => {
        if (!selectedPres) {
            presChips.classList.add('combo-sabor-shake');
            presChips.addEventListener('animationend', () => presChips.classList.remove('combo-sabor-shake'), { once: true });
            return;
        }
        if (selectedPres.sabores.length && !selectedSabor) {
            saborChips.classList.add('combo-sabor-shake');
            saborChips.addEventListener('animationend', () => saborChips.classList.remove('combo-sabor-shake'), { once: true });
            return;
        }
        overlay.remove();
        let itemName = bev.marca;
        if (selectedPres) itemName += ` ${selectedPres.nombre}`;
        if (selectedSabor) itemName += ` (${selectedSabor})`;
        const price = selectedPres ? selectedPres.precio : 0;
        addItemToCart(itemName, 'Bebidas', { type: 'solo', staticPrice: price, upgradeHandled: true }, null);
    });

    actions.appendChild(closeBtn);
    actions.appendChild(orderBtn);

    card.appendChild(img);
    card.appendChild(title);
    card.appendChild(presLabel);
    card.appendChild(presChips);
    card.appendChild(saborSection);
    card.appendChild(actions);
    overlay.appendChild(card);

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay && _lastMousedownTarget === overlay) overlay.remove();
    });

    document.body.appendChild(overlay);
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
        if (event.target === modal && _lastMousedownTarget === modal) {
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

    const carouselTitleEl = document.querySelector('.home-section-title');
    if (carouselTitleEl && configRaw && configRaw.carousel_title) {
        carouselTitleEl.textContent = configRaw.carousel_title;
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
        _promoProductsReady = true;
        renderDynamicCategorySections();
        renderFeaturedCards(carousel);
        renderCategoryExplorer();
        updatePromoModalContent();
        renderExtraPromoCards();
        if (_promoModalPendingOpen) {
            _promoModalPendingOpen = false;
            openPromoScreen();
        }
        renderHomeScreen();
    });

    categoriesUnsubscribe = firebaseDb.collection('categorias').onSnapshot((snapshot) => {
        const catSort = (a, b) => {
            const oa = a.order ?? 9999;
            const ob = b.order ?? 9999;
            if (oa !== ob) return oa - ob;
            return String(a.name || '').localeCompare(String(b.name || ''), 'es');
        };

        allCategoryMeta = snapshot.docs
            .map((doc) => doc.data())
            .map((category) => ({
                name: category.name,
                key: normalizeCategoryKey(category.name),
                image_url: String(category.image_url || '').trim(),
                order: category.order != null ? Number(category.order) : undefined
            }))
            .filter((category) => category.name && category.key)
            .sort(catSort);

        const active = snapshot.docs
            .map((doc) => doc.data())
            .filter((category) => category.active !== false)
            .map((category) => ({
                name: category.name,
                key: normalizeCategoryKey(category.name),
                image_url: String(category.image_url || '').trim(),
                order: category.order != null ? Number(category.order) : undefined
            }))
            .sort(catSort);

        activeCategoryMeta = active;
        activeCategories = new Set(active.map((item) => item.key));
        applyCategoryVisibility();
        renderDynamicCategorySections();
        renderFeaturedCards(carousel);
        renderCategoryExplorer();
        updatePromoModalContent();
        renderHomeScreen();
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

    recomendadoOverrideUnsubscribe = firebaseDb.collection('configuracion').doc('recomendado_dia').onSnapshot((doc) => {
        recomendadoOverride = doc.exists ? doc.data() : null;
        if (_promoProductsReady) updatePromoModalContent();
    });

    firebaseDb.collection('promociones').onSnapshot((snap) => {
        _promosData = snap.docs
            .map((doc) => ({ id: doc.id, ...doc.data() }))
            .filter((p) => p.activo !== false)
            .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
        renderExtraPromoCards();
    });

    firebaseDb.collection('combos_especiales').onSnapshot((snap) => {
        _combosEspecialesData = snap.docs
            .map((doc) => ({ id: doc.id, ...doc.data() }))
            .filter((c) => c.activo !== false)
            .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
        renderCombosEspeciales();
    });

    firebaseDb.collection('promos_2x1').onSnapshot((snap) => {
        _promos2x1Data = snap.docs
            .map((doc) => ({ id: doc.id, ...doc.data() }))
            .filter((p) => p.activo !== false)
            .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
        render2x1Cards();
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
let recomendadoOverride = null;
let _promoProductsReady = false;
let _promoModalPendingOpen = false;
let _promosData = [];
let _combosEspecialesData = [];
let _promos2x1Data = [];

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
    const raw = latestProducts.find((p) =>
        String(p.nombre || p.name || '').trim().toLowerCase() === RECOMMENDED_DAY_FALLBACK_PRODUCT.nombre.toLowerCase()
    );
    return {
        nombre: RECOMMENDED_DAY_FALLBACK_PRODUCT.nombre,
        categoria: RECOMMENDED_DAY_FALLBACK_PRODUCT.categoria,
        image_url: normalizeImageAssetPath(RECOMMENDED_DAY_FALLBACK_PRODUCT.image_url),
        precio: raw ? resolveProductDisplayPrice(raw) : parseLocalizedPrice(RECOMMENDED_DAY_FALLBACK_PRODUCT.precio ?? 0),
        estado: 'active'
    };
}

function getEligibleRecommendedProducts() {
    // Incluye productos pausados — el pool debe ser estable independiente del estado
    const eligibleProducts = latestProducts
        .map((product) => {
            const nombre = String(product.nombre || product.name || '').trim();
            const categoria = String(product.categoria || product.category || '').trim();
            const estado = String(product.estado || (product.paused ? 'paused' : 'active')).toLowerCase();
            return {
                nombre,
                categoria,
                estado,
                precio: resolveProductDisplayPrice(product),
                image_url: normalizeImageAssetPath(resolveProductImage(product))
            };
        })
        .filter((product) => {
            if (!product.nombre || !product.categoria) return false;
            if (shouldHideProductByName(product.nombre)) return false;
            if (isExcludedRecommendedCategory(product.categoria)) return false;
            if (!isCategoryAllowed(product.categoria)) return false;
            return Boolean(product.image_url);
        });

    const uniqueEligibleProducts = [];
    const seenRecommendedProducts = new Set();

    eligibleProducts.forEach((product) => {
        const signature = getRecommendedProductSignature(product);
        if (!signature || seenRecommendedProducts.has(signature)) return;
        seenRecommendedProducts.add(signature);
        uniqueEligibleProducts.push(product);
    });

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

function _hashProductDay(key, daySerial) {
    // Hash determinístico: resultado estable sin importar cuántos productos haya en el pool
    let h = ((daySerial * 2654435761) >>> 0);
    for (let i = 0; i < key.length; i++) {
        h = (Math.imul(h ^ key.charCodeAt(i), 2246822519) >>> 0);
        h = (Math.imul(h ^ (h >>> 13), 3266489917) >>> 0);
    }
    return h >>> 0;
}

function getRecommendedProductOfDay(now = new Date()) {
    if (recomendadoOverride && recomendadoOverride.activo && recomendadoOverride.producto_id) {
        const overrideRaw = latestProducts.find((p) => p.id === recomendadoOverride.producto_id);
        if (overrideRaw) {
            return {
                nombre: String(overrideRaw.nombre || overrideRaw.name || '').trim(),
                categoria: String(overrideRaw.categoria || overrideRaw.category || '').trim(),
                estado: String(overrideRaw.estado || (overrideRaw.paused ? 'paused' : 'active')).toLowerCase(),
                precio: resolveProductDisplayPrice(overrideRaw),
                image_url: normalizeImageAssetPath(resolveProductImage(overrideRaw))
            };
        }
    }

    const pool = getEligibleRecommendedProducts();
    if (!pool.length) return getRecommendedFallbackProduct();

    const { year, month, day } = getCurrentBogotaDateParts(now);
    const daySerial = Math.floor(Date.UTC(year, month - 1, day) / 86400000);

    // El producto con menor hash gana hoy — estable aunque cambien otros productos del catálogo
    let selected = pool[0];
    let minHash = _hashProductDay(`${pool[0].nombre}::${pool[0].categoria}`, daySerial);
    for (let i = 1; i < pool.length; i++) {
        const h = _hashProductDay(`${pool[i].nombre}::${pool[i].categoria}`, daySerial);
        if (h < minHash) {
            minHash = h;
            selected = pool[i];
        }
    }
    return selected;
}

function updatePromoModalContent() {
    const recommendedProduct = getRecommendedProductOfDay();
    currentRecommendedProduct = recommendedProduct;

    const screen = document.getElementById('promoScreen');
    const image = document.getElementById('promoModalImage');
    const kicker = document.getElementById('promoModalKicker');
    const title = document.getElementById('promoModalTitle');
    const orderButton = document.getElementById('promoOrderButton');
    const agotadoOverlay = document.getElementById('promoAgotadoOverlay');
    const badge = screen ? screen.querySelector('.promo-modal-badge') : null;
    const origPriceEl = document.getElementById('promoModalOrigPrice');
    const discountPriceEl = document.getElementById('promoModalDiscountPrice');

    const isSoldOut = recommendedProduct.estado === 'paused';

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

    if (agotadoOverlay) {
        agotadoOverlay.hidden = !isSoldOut;
    }

    if (badge) {
        badge.style.display = isSoldOut ? 'none' : '';
    }

    if (origPriceEl || discountPriceEl) {
        const raw = resolveProductDisplayPrice(recommendedProduct);
        const discounted = Math.round(raw * (1 - RECOMMENDED_DAY_DISCOUNT_RATE));
        if (origPriceEl) origPriceEl.textContent = raw > discounted ? `$${raw.toLocaleString('es-CO')}` : '';
        if (discountPriceEl) discountPriceEl.textContent = `$${discounted.toLocaleString('es-CO')}`;
    }

    if (orderButton) {
        if (isSoldOut) {
            orderButton.textContent = 'Agotado por hoy';
            orderButton.disabled = true;
            orderButton.style.opacity = '0.45';
            orderButton.style.cursor = 'not-allowed';
        } else {
            orderButton.textContent = '¡Lo Quiero! 🔥';
            orderButton.disabled = false;
            orderButton.style.opacity = '';
            orderButton.style.cursor = '';
        }
    }
}

function _applyPromoCarousel(container) {
    const items = [...container.children];
    if (items.length <= 1) return;

    container.innerHTML = '';

    const carousel = document.createElement('div');
    carousel.className = 'promo-carousel';

    const track = document.createElement('div');
    track.className = 'promo-carousel-track';

    items.forEach((item) => {
        const slide = document.createElement('div');
        slide.className = 'promo-carousel-slide';
        slide.appendChild(item);
        track.appendChild(slide);
    });

    const dotsEl = document.createElement('div');
    dotsEl.className = 'promo-carousel-dots';
    let activeIdx = 0;

    const dotBtns = items.map((_, i) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'promo-carousel-dot' + (i === 0 ? ' active' : '');
        btn.setAttribute('aria-label', `Slide ${i + 1}`);
        btn.addEventListener('click', () => {
            const slides = [...track.children];
            if (slides[i]) track.scrollTo({ left: slides[i].offsetLeft, behavior: 'smooth' });
        });
        dotsEl.appendChild(btn);
        return btn;
    });

    track.addEventListener('scroll', () => {
        const w = track.clientWidth;
        if (!w) return;
        const idx = Math.min(Math.round(track.scrollLeft / w), items.length - 1);
        if (idx !== activeIdx) {
            dotBtns[activeIdx]?.classList.remove('active');
            dotBtns[idx]?.classList.add('active');
            activeIdx = idx;
        }
    }, { passive: true });

    carousel.appendChild(track);
    carousel.appendChild(dotsEl);
    container.appendChild(carousel);
}

function renderExtraPromoCards() {
    const container = document.getElementById('extraPromoCards');
    if (!container) return;

    container.innerHTML = '';

    _promosData.forEach((promo) => {
        const product = latestProducts.find((p) => p.id === promo.producto_id);
        if (!product) return;

        const raw = resolveProductDisplayPrice(product);
        const rate = Math.min(Math.max(Number(promo.descuento || 0), 0), 100) / 100;
        const discounted = rate > 0 ? Math.round(raw * (1 - rate)) : raw;
        const img = product.image_url || 'logo.png';
        const nombre = product.nombre || promo.producto_nombre || '';
        const kicker = promo.kicker || 'Promo Especial';
        const badge = promo.badge || '';

        const section = document.createElement('section');
        section.className = 'home-rec-banner';
        section.setAttribute('aria-label', nombre);

        const origPriceHTML = raw > discounted
            ? `<div class="home-rec-price-block">
                   <span class="home-rec-price-tag">Normal</span>
                   <span class="home-rec-price-orig">$${raw.toLocaleString('es-CO')}</span>
               </div>`
            : '';

        section.innerHTML = `
            <div class="home-rec-top-bar">
                <span class="home-rec-kicker">${kicker}</span>
                <span class="home-rec-discount-badge">${badge}</span>
            </div>
            <div class="home-rec-content">
                <div class="home-rec-img-wrap">
                    <img class="home-rec-img" src="${img}" alt="${nombre}" loading="lazy" onerror="this.src='logo.png'">
                </div>
                <div class="home-rec-body">
                    <strong class="home-rec-name"></strong>
                    <div class="home-rec-price-row">
                        ${origPriceHTML}
                        <div class="home-rec-price-block home-rec-price-block--hot">
                            <span class="home-rec-price-tag">Hoy</span>
                            <span class="home-rec-price">$${discounted.toLocaleString('es-CO')}</span>
                        </div>
                    </div>
                    <button class="home-rec-btn promo-btn-order" type="button">¡Lo Quiero! 🔥</button>
                </div>
            </div>`;

        section.querySelector('.home-rec-name').textContent = nombre;

        const btn = section.querySelector('.promo-btn-order');
        btn.addEventListener('click', () => {
            if (!activeCustomerProfile) {
                closePromoScreen();
                openPromoRegistrationPrompt();
                return;
            }
            closePromoScreen();
            addItemToCart(nombre, product.categoria || '', {
                type: 'solo',
                imagePath: img,
                recommendedDiscount: rate > 0,
                discountRate: rate
            }, `btn-promo-extra-${promo.id}`);
        });

        container.appendChild(section);
    });

    _applyPromoCarousel(container);
}

// ===== PROMOCIONES 2x1 (MENÚ PÚBLICO) =====

function render2x1Cards() {
    const container = document.getElementById('promos2x1Cards');
    if (!container) return;
    container.innerHTML = '';

    if (!_promos2x1Data.length) return;

    _promos2x1Data.forEach((promo) => {
        const product = latestProducts.find((p) => p.id === promo.producto_id);
        if (!product) return;

        const img = product.image_url || 'logo.png';
        const nombre = product.nombre || promo.producto_nombre || '';
        const kicker = promo.kicker || '¡Oferta Especial!';
        const descripcion = promo.descripcion || '¡Lleva 2 por el precio de 1!';

        const section = document.createElement('section');
        section.className = 'home-rec-banner home-rec-banner--2x1';
        section.setAttribute('aria-label', nombre + ' 2x1');

        section.innerHTML = `
            <div class="home-rec-top-bar">
                <span class="home-rec-kicker">${kicker}</span>
                <span class="home-rec-discount-badge promo-2x1-badge">2×1</span>
            </div>
            <div class="home-rec-content">
                <div class="home-rec-img-wrap">
                    <img class="home-rec-img" src="${img}" alt="${nombre}" loading="lazy" onerror="this.src='logo.png'">
                </div>
                <div class="home-rec-body">
                    <strong class="home-rec-name"></strong>
                    <p class="promo-2x1-desc"></p>
                    <button class="home-rec-btn promo-btn-order" type="button">¡Lo Quiero! 🔥</button>
                </div>
            </div>`;

        section.querySelector('.home-rec-name').textContent = nombre;
        section.querySelector('.promo-2x1-desc').textContent = descripcion;

        section.querySelector('.promo-btn-order').addEventListener('click', () => {
            if (!activeCustomerProfile) {
                closePromoScreen();
                openPromoRegistrationPrompt();
                return;
            }
            closePromoScreen();
            addItemToCart(nombre, product.categoria || '', {
                type: 'solo',
                imagePath: img,
                promoLabel: `PROMO 2×1 — ${promo.kicker || nombre}`,
                promo2x1: true
            }, `btn-2x1-${promo.id}`, 2);
        });

        container.appendChild(section);
    });

    _applyPromoCarousel(container);
}

// ===== COMBOS ESPECIALES (MENÚ PÚBLICO) =====

function _isComboActivoAhora(horario) {
    if (!horario || horario.tipo === 'siempre') return true;
    const now = new Date();
    const { year, month, day } = getCurrentBogotaDateParts(now);
    const tz = (typeof ORDERING_SCHEDULE !== 'undefined' && ORDERING_SCHEDULE.timeZone) || 'America/Bogota';
    const timeParts = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', weekday: 'short', hour12: false }).formatToParts(now);
    const hour = Number(timeParts.find((p) => p.type === 'hour')?.value || 0);
    const minute = Number(timeParts.find((p) => p.type === 'minute')?.value || 0);
    const weekdayStr = timeParts.find((p) => p.type === 'weekday')?.value || 'Sun';
    const DOW_MAP = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    const dow = DOW_MAP[weekdayStr] ?? now.getDay();

    if (horario.tipo === 'rango_fechas') {
        const todayStr = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
        const desde = horario.fecha_inicio || '';
        const hasta = horario.fecha_fin || '';
        return (!desde || todayStr >= desde) && (!hasta || todayStr <= hasta);
    }
    if (horario.tipo === 'dias_horas') {
        const dias = horario.dias || [];
        if (dias.length && !dias.map(Number).includes(dow)) return false;
        const nowMin = hour * 60 + minute;
        const [ih, im] = (horario.hora_inicio || '00:00').split(':').map(Number);
        const [fh, fm] = (horario.hora_fin || '23:59').split(':').map(Number);
        return nowMin >= ih * 60 + im && nowMin <= fh * 60 + fm;
    }
    return true;
}

function renderCombosEspeciales() {
    const container = document.getElementById('combosEspecialesCards');
    if (!container) return;
    container.innerHTML = '';

    const activos = _combosEspecialesData.filter((c) => _isComboActivoAhora(c.horario));
    if (!activos.length) return;

    activos.forEach((combo) => {
        const productos = combo.productos || [];
        const precioOrig = combo.precio_original || productos.reduce((s, p) => s + Number(p.precio || 0), 0);
        const precioCombo = combo.precio_combo || precioOrig;
        const descuento = combo.descuento || 0;

        const iconsHTML = productos.slice(0, 5).map((p) => `
            <button type="button" class="combo-public-icon-btn" data-product-id="${p.id}" title="${escapeXml(p.nombre || '')}">
                <img src="${escapeXml(p.imagen || 'logo.png')}" alt="${escapeXml(p.nombre || '')}" onerror="this.src='logo.png'">
                <span>${escapeXml(p.nombre || '')}</span>
            </button>`).join('');

        const nombresHTML = productos.map((p) => `<span>${escapeXml(p.nombre || '')}</span>`).join('<span class="combo-plus">+</span>');

        const section = document.createElement('section');
        section.className = 'combo-especial-banner';
        section.setAttribute('aria-label', combo.titulo || 'Combo especial');

        const discountRate = precioOrig > 0 ? Math.max(0, Math.min(1, 1 - precioCombo / precioOrig)) : 0;

        section.innerHTML = `
            <div class="combo-especial-header">
                <span class="combo-especial-badge">🎁 ${escapeXml(combo.titulo || 'Combo Especial')}</span>
                ${descuento > 0 ? `<span class="combo-especial-pct">-${descuento}%</span>` : ''}
            </div>
            <div class="combo-especial-icons">${iconsHTML}</div>
            <div class="combo-especial-names">${nombresHTML}</div>
            <div class="combo-especial-price-row">
                ${precioOrig > precioCombo ? `<span class="combo-especial-orig">$${precioOrig.toLocaleString('es-CO')}</span>` : ''}
                <span class="combo-especial-price">$${precioCombo.toLocaleString('es-CO')}</span>
            </div>
            <button type="button" class="combo-order-btn">¡Lo Quiero! 🔥</button>`;

        section.querySelectorAll('.combo-public-icon-btn').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const pid = btn.dataset.productId;
                const prod = latestProducts.find((p) => p.id === pid);
                if (prod) {
                    closePromoScreen();
                    setTimeout(() => handleProductClick(prod), 220);
                }
            });
        });

        section.querySelector('.combo-order-btn').addEventListener('click', () => {
            if (!activeCustomerProfile) {
                closePromoScreen();
                openPromoRegistrationPrompt();
                return;
            }
            closePromoScreen();
            productos.forEach((p, i) => {
                const prod = latestProducts.find((x) => x.id === p.id);
                if (!prod) return;
                setTimeout(() => {
                    addItemToCart(prod.nombre, prod.categoria || '', {
                        type: 'solo',
                        imagePath: prod.image_url || 'logo.png',
                        recommendedDiscount: discountRate > 0,
                        discountRate,
                        upgradeHandled: true
                    }, `btn-combo-${combo.id}-${i}`);
                }, i * 60);
            });
        });

        container.appendChild(section);
    });

    _applyPromoCarousel(container);
}

function escapeXml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ===== SEGUNDA PANTALLA: HOME SCREEN =====

function setPublicTopbarVisible(visible) {
    const topbar = document.querySelector('.public-topbar');
    if (topbar) topbar.style.display = visible ? '' : 'none';
    const chatFab = document.getElementById('publicChatFab');
    if (chatFab && activeCustomerProfile) {
        chatFab.style.display = visible ? '' : 'none';
    }
}

function showHomeScreen() {
    _SECONDARY_SCREENS.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.hidden = true;
    });
    document.getElementById('navCategoriesScreen')?.removeAttribute('data-hidden-by-detail');
    const hs = document.getElementById('homeScreen');
    if (hs) { hs.hidden = false; renderHomeScreen(); }
    setPublicTopbarVisible(true);
    _setNavCurrent(null);
    if (_screenHistoryPushed && !_closingByBackBtn) {
        _screenHistoryPushed = false;
        _skipNextPopstate = true;
        history.back();
    } else {
        _screenHistoryPushed = false;
    }
}

function renderHomeScreen() {
    renderHomeRecBanner();
    renderHomeComboCarousel();
    renderHomeCategoryCards();
}

function renderHomeRecBanner() {
    const img    = document.getElementById('homeRecImg');
    const name   = document.getElementById('homeRecName');
    const price  = document.getElementById('homeRecPrice');
    const btn    = document.getElementById('homeRecBtn');
    if (!img) return;

    const product = getRecommendedProductOfDay();
    // Si no hay datos aún pero el banner ya tiene contenido, no lo borrar
    if (!product) {
        if (name && name.textContent && name.textContent !== '...') return;
        return;
    }

    img.src = String(product.image_url || product.imageUrl || '');
    img.alt = String(product.nombre || product.name || 'Recomendado del dia');
    if (name)  name.textContent  = String(product.nombre || product.name || 'Recomendado del dia');
    const origPriceEl = document.getElementById('homeRecOrigPrice');
    if (price || origPriceEl) {
        const raw = resolveProductDisplayPrice(product);
        const discounted = Math.round(raw * 0.80);
        if (price) price.textContent = `$${discounted.toLocaleString('es-CO')}`;
        if (origPriceEl) origPriceEl.textContent = raw > discounted ? `$${raw.toLocaleString('es-CO')}` : '';
    }
    if (btn) {
        btn.onclick = () => {
            if (!activeCustomerProfile) {
                openPromoRegistrationPrompt();
                return;
            }
            startProductOrderFlow(
                String(product.nombre || product.name || ''),
                String(product.categoria || product.category || ''),
                'home-rec-btn',
                {
                    recommendedDiscount: true,
                    discountRate: RECOMMENDED_DAY_DISCOUNT_RATE,
                    imagePath: product.image_url
                }
            );
        };
    }
}

function renderHomeComboCarousel() {
    const carousel = document.getElementById('home-combos-carousel');
    if (!carousel) return;

    if (_homeComboRAF) { cancelAnimationFrame(_homeComboRAF); _homeComboRAF = null; }
    _homeComboEl = carousel;
    _homeComboLastTs = 0;

    const ITEMS = [
        { nombre: 'Combo Burger Normal', image_url: 'losmaspedidos/comboburgernormal.png', categoria: 'COMBOS CON PAPAS Y BEBIDA' },
        { nombre: 'Combo Burger Papuda', image_url: 'losmaspedidos/comboburgerpapuda.png', categoria: 'COMBOS CON PAPAS Y BEBIDA' },
        { nombre: 'Combo Burger Super',  image_url: 'losmaspedidos/comboburgersuper.png',  categoria: 'COMBOS CON PAPAS Y BEBIDA' },
        { nombre: 'Combo Perro Normal',  image_url: 'losmaspedidos/comboperronormal.png',  categoria: 'COMBOS CON PAPAS Y BEBIDA' },
        { nombre: 'De La Casa',          image_url: 'losmaspedidos/combodelacasa.png',      categoria: 'COMBOS MIXTOS' },
        { nombre: 'Emparejados',         image_url: 'losmaspedidos/comboemparejados.png',   categoria: 'COMBOS MIXTOS' },
        { nombre: 'Familiar 3',          image_url: 'losmaspedidos/combofamiliar3.png',     categoria: 'COMBOS MIXTOS' },
        { nombre: 'Familiar 4',          image_url: 'losmaspedidos/combofamiliar4.png',     categoria: 'COMBOS MIXTOS' }
    ];

    const makeCard = (item) => {
        const card = document.createElement('div');
        card.className = 'product-card-mobile';
        const wrap = document.createElement('div');
        wrap.className = 'card-image-wrapper';
        const img = document.createElement('img');
        img.className = 'product-image-mobile';
        img.src = item.image_url;
        img.alt = item.nombre;
        img.loading = 'lazy';
        wrap.appendChild(img);
        const btn = document.createElement('button');
        btn.className = 'mobile-order-btn';
        btn.type = 'button';
        btn.textContent = '¡Lo Quiero!';
        btn.addEventListener('click', () => startProductOrderFlow(item.nombre, item.categoria, 'home-combo-btn'));
        card.appendChild(wrap);
        card.appendChild(btn);
        return card;
    };

    carousel.innerHTML = '';
    ITEMS.forEach(it => carousel.appendChild(makeCard(it)));
    ITEMS.forEach(it => carousel.appendChild(makeCard(it)));
    carousel.scrollLeft = 0;
    syncOrderingAvailabilityUI();

    // Pause on touch
    if (!carousel.dataset.homeScroll) {
        carousel.addEventListener('touchstart', () => {
            if (_homeComboRAF) { cancelAnimationFrame(_homeComboRAF); _homeComboRAF = null; }
            _homeComboLastTs = 0;
        }, { passive: true });
        carousel.addEventListener('touchend', () => {
            if (_homeComboEl && !_homeComboRAF) {
                _homeComboLastTs = 0;
                _homeComboRAF = requestAnimationFrame(_homeComboTick);
            }
        }, { passive: true });
        carousel.dataset.homeScroll = '1';
    }

    setTimeout(() => {
        if (_homeComboEl === carousel) _homeComboRAF = requestAnimationFrame(_homeComboTick);
    }, 80);
}

function renderHomeCategoryCards() {
    const grid = document.getElementById('homeCategoriesGrid');
    if (!grid) return;

    const categories = activeCategoryMeta;
    if (!categories || categories.length === 0) {
        // Solo mostrar "Cargando" si todavía no hay cards renderizadas
        if (!grid.querySelector('.home-cat-card')) {
            grid.innerHTML = '<p class="home-loading-msg">Cargando categorias...</p>';
        }
        return;
    }

    grid.innerHTML = '';
    categories.forEach(cat => {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'home-cat-card';

        const imgEl = document.createElement('img');
        imgEl.className = 'home-cat-img';
        imgEl.src = cat.image_url || '';
        imgEl.alt = cat.name;
        imgEl.loading = 'lazy';
        imgEl.onerror = () => { imgEl.style.display = 'none'; };

        const labelEl = document.createElement('span');
        labelEl.className = 'home-cat-label';
        labelEl.textContent = cat.name;

        card.appendChild(imgEl);
        card.appendChild(labelEl);
        card.addEventListener('click', () => openCategoryDetail(cat));
        grid.appendChild(card);
    });
}

function openCategoryDetail(cat) {
    const screen = document.getElementById('categoryDetailScreen');
    const title  = document.getElementById('cdsTitle');
    const grid   = document.getElementById('cdsProductsGrid');
    if (!screen || !title || !grid) return; // no ocultar home si faltan elementos

    // Ocultar navCategoriesScreen si estaba visible (quedaría detrás al ser transparente)
    const navScreen = document.getElementById('navCategoriesScreen');
    if (navScreen) {
        navScreen.dataset.hiddenByDetail = navScreen.hidden ? '0' : '1';
        navScreen.hidden = true;
    }

    _enterScreen('categoryDetailScreen');

    title.textContent = cat.name;

    const catKey = cat.key || normalizeCategoryKey(cat.name);
    const products = latestProducts
        .filter(p => normalizeCategoryKey(String(p.categoria || p.category || '')) === catKey
                  && String(p.estado || '').trim() !== 'paused')
        .sort((a, b) => {
            const oa = a.order ?? 9999;
            const ob = b.order ?? 9999;
            if (oa !== ob) return oa - ob;
            return String(a.nombre || a.name || '').localeCompare(String(b.nombre || b.name || ''), 'es');
        });

    if (products.length === 0) {
        grid.innerHTML = '<p class="cds-empty-msg">No hay productos disponibles en esta categoria.</p>';
    } else {
        grid.innerHTML = '';
        products.forEach((product, idx) => {
            const nombre = String(product.nombre || product.name || 'Producto').trim();
            const precio = resolveProductDisplayPrice(product);
            const imgSrc = String(product.image_url || product.imageUrl || '');
            const btnId  = `btn-cds-${idx}`;

            const card = document.createElement('div');
            card.className = 'cds-product-card';

            const imgWrap = document.createElement('div');
            imgWrap.className = 'cds-product-img-wrap';
            const imgEl = document.createElement('img');
            imgEl.className = 'cds-product-img';
            imgEl.src = imgSrc;
            imgEl.alt = nombre;
            imgEl.loading = 'lazy';
            imgEl.onerror = () => { imgEl.style.display = 'none'; };
            imgEl.addEventListener('click', () => startProductOrderFlow(nombre, cat.name, btnId));
            imgWrap.appendChild(imgEl);

            const info = document.createElement('div');
            info.className = 'cds-product-info';

            const nameEl = document.createElement('span');
            nameEl.className = 'cds-product-name';
            nameEl.textContent = nombre;

            const priceEl = document.createElement('span');
            priceEl.className = 'cds-product-price';
            priceEl.textContent = `$${precio.toLocaleString('es-CO')}`;
            info.appendChild(nameEl);
            info.appendChild(priceEl);

            const orderBtn = document.createElement('button');
            orderBtn.type = 'button';
            orderBtn.id = btnId;
            orderBtn.className = 'cds-product-btn';
            orderBtn.textContent = '¡Lo Quiero!';
            orderBtn.addEventListener('click', () => startProductOrderFlow(nombre, cat.name, btnId));
            info.appendChild(orderBtn);

            card.appendChild(imgWrap);
            card.appendChild(info);
            grid.appendChild(card);
        });
    }

    screen.hidden = false;
    screen.scrollTop = 0;
}

function closeCategoryDetail() {
    const screen = document.getElementById('categoryDetailScreen');
    if (screen) screen.hidden = true;
    // Restaurar navCategoriesScreen si estaba abierta antes de entrar al detalle
    const navScreen = document.getElementById('navCategoriesScreen');
    if (navScreen && navScreen.dataset.hiddenByDetail === '1') {
        navScreen.hidden = false;
        navScreen.removeAttribute('data-hidden-by-detail');
    }
    _exitScreen();
}

// ===== FIN HOME SCREEN =====

function openNavCategoriesScreen(title, filterFn) {
    const screen  = document.getElementById('navCategoriesScreen');
    const titleEl = document.getElementById('ncsTitle');
    const grid    = document.getElementById('ncsCategoriesGrid');
    if (!screen || !titleEl || !grid) return; // no ocultar home si faltan elementos

    _enterScreen('navCategoriesScreen');

    titleEl.textContent = title;

    const categories = filterFn
        ? (activeCategoryMeta || []).filter(filterFn)
        : (activeCategoryMeta || []);

    grid.innerHTML = '';
    if (categories.length === 0) {
        grid.innerHTML = '<p class="home-loading-msg">No hay categorias disponibles.</p>';
    } else {
        categories.forEach(cat => {
            const card = document.createElement('button');
            card.type = 'button';
            card.className = 'home-cat-card';
            const imgEl = document.createElement('img');
            imgEl.className = 'home-cat-img';
            imgEl.src = cat.image_url || '';
            imgEl.alt = cat.name;
            imgEl.loading = 'lazy';
            imgEl.onerror = () => { imgEl.style.display = 'none'; };
            const labelEl = document.createElement('span');
            labelEl.className = 'home-cat-label';
            labelEl.textContent = cat.name;
            card.appendChild(imgEl);
            card.appendChild(labelEl);
            card.addEventListener('click', () => openCategoryDetail(cat));
            grid.appendChild(card);
        });
    }

    screen.hidden = false;
    screen.scrollTop = 0;
}

function closeNavCategoriesScreen() {
    const screen = document.getElementById('navCategoriesScreen');
    if (screen) screen.hidden = true;
    _exitScreen();
}

function openSearchScreen() {
    const screen = document.getElementById('searchScreen');
    if (!screen || !screen.hidden) return; // no-op si ya está abierto

    _enterScreen('searchScreen');
    screen.hidden = false;
    screen.scrollTop = 0;

    const input = document.getElementById('searchInput');
    if (input) {
        input.value = '';
        renderSearchResults('');
        setTimeout(() => input.focus(), 150);
    }
}

function closeSearchScreen() {
    const screen = document.getElementById('searchScreen');
    if (screen) screen.hidden = true;
    _exitScreen();
}

// ── Buscador inteligente: normalización, sinónimos y coincidencia difusa ──
function _searchNorm(s) {
    return String(s || '').toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}

const _SEARCH_SYNS = {
    burger:     ['hamburguesa', 'hamburger'],
    hamburger:  ['hamburguesa', 'burger'],
    refresco:   ['bebida', 'gaseosa', 'cola'],
    soda:       ['bebida', 'gaseosa', 'refresco'],
    gaseosa:    ['bebida', 'refresco', 'cola'],
    fries:      ['papas', 'fritas'],
    chicken:    ['pollo'],
    cheese:     ['queso'],
    shake:      ['malteada', 'milkshake'],
    malteada:   ['shake', 'milkshake'],
    juice:      ['jugo'],
    water:      ['agua'],
    double:     ['doble'],
    doble:      ['double'],
    combo:      ['especial', 'combinado'],
};

function _editDist(a, b) {
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;
    const row = [...Array(b.length + 1).keys()];
    for (let i = 0; i < a.length; i++) {
        let prev = row[0];
        row[0] = i + 1;
        for (let j = 0; j < b.length; j++) {
            const tmp = row[j + 1];
            row[j + 1] = a[i] === b[j] ? prev : 1 + Math.min(prev, row[j], row[j + 1]);
            prev = tmp;
        }
    }
    return row[b.length];
}

function _matchQWord(qw, tokens) {
    for (const t of tokens) if (t === qw || t.includes(qw) || qw.includes(t)) return 3;
    if (qw.length >= 3) for (const t of tokens) if (t.startsWith(qw) || qw.startsWith(t)) return 2;
    if (qw.length >= 4) {
        const maxD = qw.length >= 6 ? 2 : 1;
        for (const t of tokens)
            if (Math.abs(t.length - qw.length) <= maxD + 1 && _editDist(qw, t) <= maxD) return 1;
    }
    return 0;
}

function _scoreProduct(rawQ, p) {
    const q = _searchNorm(rawQ);
    if (!q) return 0;
    const name   = _searchNorm(p.nombre);
    const cat    = _searchNorm(p.categoria);
    const desc   = _searchNorm(p.descripcion || p.description || '');
    const full   = `${name} ${cat} ${desc}`;

    // Coincidencia exacta de frase → máxima prioridad
    if (name.includes(q)) return 1000;
    if (full.includes(q)) return 900;

    const tokens = full.split(' ').filter(Boolean);
    const qWords = q.split(' ').filter(Boolean);

    // Sinónimos por cada palabra de la consulta
    const syns = new Set();
    for (const w of qWords) for (const s of (_SEARCH_SYNS[w] || [])) syns.add(s);
    const synWords = [...syns].filter(s => !qWords.includes(s));

    let score = 0;
    let hits  = 0;
    for (const w of qWords) {
        const ms = _matchQWord(w, tokens);
        if (ms) hits++;
        score += ms * 10;
    }
    for (const w of synWords) score += _matchQWord(w, tokens) * 5;
    if (hits === qWords.length && qWords.length > 0) score += 30;
    return score;
}

function renderSearchResults(query) {
    const grid = document.getElementById('searchResultsGrid');
    if (!grid) return;

    const q = query.trim();

    if (!q) {
        grid.innerHTML = '<p class="search-hint-msg">Escribe el nombre de un producto para buscarlo...</p>';
        return;
    }

    const scored = (latestProducts || [])
        .filter(p => String(p.estado || '').trim() !== 'paused')
        .map(p => ({ p, score: _scoreProduct(q, p) }))
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score ||
            String(a.p.nombre || '').localeCompare(String(b.p.nombre || ''), 'es'));

    if (scored.length === 0) {
        grid.innerHTML = '<p class="search-hint-msg">No encontramos &ldquo;<strong>' +
            query.trim().replace(/</g, '&lt;') + '</strong>&rdquo; en nuestro menú.</p>';
        return;
    }

    grid.innerHTML = '';
    scored.forEach(({ p }) => {
        const card = document.createElement('div');
        card.className = 'cds-product-card';

        const imgWrap = document.createElement('div');
        imgWrap.className = 'cds-product-img-wrap';
        const img = document.createElement('img');
        img.className = 'cds-product-img';
        img.src = String(p.image_url || p.imageUrl || '');
        img.alt = String(p.nombre || '');
        img.loading = 'lazy';
        img.onerror = () => { imgWrap.style.display = 'none'; };
        imgWrap.appendChild(img);

        const info = document.createElement('div');
        info.className = 'cds-product-info';

        const badge = document.createElement('span');
        badge.className = 'search-cat-badge';
        badge.textContent = String(p.categoria || '');

        const name = document.createElement('span');
        name.className = 'cds-product-name';
        name.textContent = String(p.nombre || '');

        const raw = resolveProductDisplayPrice(p);
        const price = document.createElement('span');
        price.className = 'cds-product-price';
        price.textContent = '$' + raw.toLocaleString('es-CO');

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'cds-product-btn';
        btn.textContent = 'Pedir';
        btn.addEventListener('click', () => {
            if (!activeCustomerProfile) { openPromoRegistrationPrompt(); return; }
            startProductOrderFlow(String(p.nombre || ''), String(p.categoria || ''), 'search-result-btn');
        });

        info.appendChild(badge);
        info.appendChild(name);
        info.appendChild(price);
        info.appendChild(btn);
        card.appendChild(imgWrap);
        card.appendChild(info);
        grid.appendChild(card);
    });
}

// Oculta home y TODAS las demás pantallas secundarias, marca el nav activo y empuja historial
function _enterScreen(screenId) {
    // Cerrar todas las demás pantallas secundarias abiertas para evitar que se vean detrás
    // (son transparentes, si quedan visibles sangran a través de la nueva pantalla)
    _SECONDARY_SCREENS.forEach(id => {
        if (id !== screenId) {
            const el = document.getElementById(id);
            if (el) el.hidden = true;
        }
    });
    // Si no abrimos el detalle de categoría, limpiar el tracking de navCategoriesScreen
    if (screenId !== 'categoryDetailScreen') {
        document.getElementById('navCategoriesScreen')?.removeAttribute('data-hidden-by-detail');
    }
    const hs = document.getElementById('homeScreen');
    if (hs) hs.hidden = true;
    setPublicTopbarVisible(false);
    _setNavCurrent(screenId);
    if (!_screenHistoryPushed && !_closingByBackBtn) {
        history.pushState({ roalMenuScreen: true }, '');
        _screenHistoryPushed = true;
    }
}

// Si ya no hay ninguna pantalla secundaria visible, restaura el home y el topbar
function _exitScreen() {
    const anyOpen = _SECONDARY_SCREENS.some(id => {
        const el = document.getElementById(id);
        return el && !el.hidden;
    });
    if (!anyOpen) {
        const hs = document.getElementById('homeScreen');
        if (hs) { hs.hidden = false; renderHomeScreen(); }
        setPublicTopbarVisible(true);
        _setNavCurrent(null);
        if (_screenHistoryPushed && !_closingByBackBtn) {
            _screenHistoryPushed = false;
            _skipNextPopstate = true;
            history.back();
        } else {
            _screenHistoryPushed = false;
        }
    } else {
        const openId = _SECONDARY_SCREENS.find(id => {
            const el = document.getElementById(id);
            return el && !el.hidden;
        });
        _setNavCurrent(openId || null);
    }
}

// Marca el ítem de la barra de navegación correspondiente a la pantalla activa
function _setNavCurrent(screenId) {
    const navMap = {
        navCategoriesScreen: 'bnavMenu',
        categoryDetailScreen: 'bnavMenu',
        promoScreen: 'bnavPromo',
        searchScreen: 'bnavBuscador',
        perfilScreen: 'bnavPerfil',
        ayudaScreen: 'bnavAyuda',
    };
    document.querySelectorAll('.ban-item').forEach(btn => btn.classList.remove('is-current'));
    const btnId = screenId ? navMap[screenId] : 'bnavInicio';
    if (btnId) document.getElementById(btnId)?.classList.add('is-current');
}

function openPromoScreen() {
    const screen = document.getElementById('promoScreen');
    if (!screen) return;

    _enterScreen('promoScreen');
    if (_promoProductsReady) updatePromoModalContent();
    screen.hidden = false;
    screen.scrollTop = 0;
}

function closePromoScreen() {
    const screen = document.getElementById('promoScreen');
    if (screen) screen.hidden = true;
    _exitScreen();
}

function initPromoModal() {
    if (IS_ADMIN_PREVIEW) {
        return;
    }

    setTimeout(function () {
        if (_promoProductsReady) {
            openPromoScreen();
        } else {
            _promoModalPendingOpen = true;
        }
    }, 2000);
}

function openPromoRegistrationPrompt() {
    const existing = document.getElementById('promoRegistrationPrompt');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'promoRegistrationPrompt';
    modal.className = 'support-modal is-open';
    modal.innerHTML = `
        <div class="support-modal-card liquid-glass promo-reg-card" role="dialog" aria-modal="true" aria-label="Registrate para promos exclusivas">
            <button type="button" class="support-modal-close" id="promoRegClose" aria-label="Cerrar">&times;</button>
            <p class="support-modal-kicker">Promos exclusivas</p>
            <h3 class="support-modal-title">Esta oferta es solo para miembros</h3>
            <p class="support-modal-text">Para disfrutar de <strong>esta y todas nuestras promos exclusivas</strong> necesitas tener cuenta en la app de ROAL BURGER. ¡Tambien puedes descargarla directo en tu dispositivo!</p>
            <div class="promo-reg-actions">
                <button type="button" class="promo-reg-btn promo-reg-btn--download" id="promoRegDownload">
                    <span class="promo-reg-btn-icon">&#8659;</span> Descargar app
                </button>
                <button type="button" class="promo-reg-btn promo-reg-btn--register" id="promoRegRegister">
                    <span class="promo-reg-btn-icon">&#9788;</span> Registrarse
                </button>
                <button type="button" class="promo-reg-btn promo-reg-btn--guest" id="promoRegGuest">
                    Continuar como visitante
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    syncBodyScrollLock();

    modal.addEventListener('click', (e) => { if (e.target === modal) closePromoRegistrationPrompt(); });
    document.getElementById('promoRegClose')?.addEventListener('click', closePromoRegistrationPrompt);
    document.getElementById('promoRegDownload')?.addEventListener('click', () => { handleShortcutInstall(); });
    document.getElementById('promoRegRegister')?.addEventListener('click', () => {
        closePromoRegistrationPrompt();
        openCustomerRegisterModal();
    });
    document.getElementById('promoRegGuest')?.addEventListener('click', closePromoRegistrationPrompt);
}

function closePromoRegistrationPrompt() {
    const modal = document.getElementById('promoRegistrationPrompt');
    if (modal) { modal.remove(); syncBodyScrollLock(); }
}

function orderDailyRecommendation() {
    if (!canPlaceOrdersNow()) {
        showOrderingClosedMessage();
        return;
    }

    if (!activeCustomerProfile) {
        closePromoScreen();
        openPromoRegistrationPrompt();
        return;
    }

    const recommendedProduct = currentRecommendedProduct || getRecommendedProductOfDay();
    if (recommendedProduct.estado === 'paused') return;

    trackButtonClick('btn-promo-dia-order', `${PROMO_DAY_NAME} - ${recommendedProduct.nombre}`);
    closePromoScreen();
    addItemToCart(recommendedProduct.nombre, recommendedProduct.categoria, {
        type: 'solo',
        imagePath: recommendedProduct.image_url,
        recommendedDiscount: true,
        discountRate: RECOMMENDED_DAY_DISCOUNT_RATE
    }, 'btn-promo-dia-order');
}
document.addEventListener('click', function(event) {
    const menuModal = document.getElementById('menuModal');
    if (event.target === menuModal) {
        closeMenuModal();
    }
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        closeMenuModal();
        closePromoScreen();
        closeSupportModal();
        closeCustomerAuthModal();
    }
});

window.addEventListener('beforeunload', () => {
    if (typeof featuredProductsUnsubscribe === 'function') featuredProductsUnsubscribe();
    if (typeof categoriesUnsubscribe === 'function') categoriesUnsubscribe();
    if (typeof buttonsUnsubscribe === 'function') buttonsUnsubscribe();
    if (typeof brandingUnsubscribe === 'function') brandingUnsubscribe();
    unsubscribeCustomerProfileStreams();
});

// ── Public Upgrade Sheet ──────────────────────────────────────────────────
function openPublicUpgradeSheet() {
    const overlay = document.getElementById('publicUpgradeOverlay');
    if (!overlay || !_publicUpgradePending) return;
    overlay.hidden = false;
    overlay.style.display = 'flex';
    _pushModalState();
    renderPublicUpgradeStep1();
}

function closePublicUpgradeSheet() {
    const overlay = document.getElementById('publicUpgradeOverlay');
    if (overlay) { overlay.hidden = true; overlay.style.display = 'none'; }
    _publicUpgradePending = null;
    if (!_closingByBackBtn) _popModalState();
}

function _pubUpgBody() { return document.getElementById('publicUpgradeBody'); }
function _pubUpgTitle() { return document.getElementById('publicUpgradeTitle'); }

function renderPublicUpgradeStep1() {
    const body = _pubUpgBody(); const titleEl = _pubUpgTitle();
    if (!body || !_publicUpgradePending) return;
    if (titleEl) titleEl.textContent = '¿Quieres acompañarlo?';
    const cfg = publicUpgradesConfig;
    // Usar opciones filtradas por producto si existen, o todas las activas de menú
    const activeOpts = _publicUpgradePending.filteredOpts ||
        (cfg?.opciones || [])
            .filter((o) => o.activo && o.activo_menu !== false)
            .sort((a, b) => (a.orden || 99) - (b.orden || 99));

    const priceLabel = (opt) => {
        if (opt.tiene_variantes && (opt.variantes || []).length > 0) {
            const min = Math.min(...opt.variantes.map((v) => Number(v.precio_extra || 0)));
            return `desde +$${min.toLocaleString('es-CO')}`;
        }
        return Number(opt.precio || 0) > 0 ? `+$${Number(opt.precio).toLocaleString('es-CO')}` : 'incluido';
    };

    body.innerHTML = `
        <div class="pub-upgrade-product">${_publicUpgradePending.productName}</div>
        <div class="pub-upgrade-opts">
            <button type="button" class="pub-upgrade-opt pub-upgrade-solo" id="pubUpgradeSolo">
                <span class="pub-upgrade-opt-name">Solo el producto</span>
                <span class="pub-upgrade-opt-price muted">sin añadir</span>
            </button>
            ${activeOpts.map((opt) => `
            <button type="button" class="pub-upgrade-opt" data-opt-id="${opt.id}">
                <div>
                    <span class="pub-upgrade-opt-name">${opt.nombre}</span>
                    ${opt.detalle ? `<span class="pub-upgrade-opt-detail">${opt.detalle}</span>` : ''}
                </div>
                <span class="pub-upgrade-opt-price">${priceLabel(opt)}</span>
            </button>`).join('')}
        </div>`;

    body.querySelector('#pubUpgradeSolo')?.addEventListener('click', () => {
        const { productName, categoryName, orderOptions, buttonId } = _publicUpgradePending;
        _publicUpgradePending = null;
        addItemToCart(productName, categoryName, { ...orderOptions, upgradeHandled: true }, buttonId);
        closePublicUpgradeSheet();
    });
    body.querySelectorAll('.pub-upgrade-opt[data-opt-id]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const opt = (cfg?.opciones || []).find((o) => o.id === btn.dataset.optId);
            if (!opt) return;
            if (opt.tiene_variantes && (opt.variantes || []).length > 0) {
                renderPublicUpgradeStep2(opt);
            } else {
                _applyPublicUpgrade(opt.nombre, Number(opt.precio || 0));
            }
        });
    });
}

function renderPublicUpgradeStep2(opt) {
    const body = _pubUpgBody(); const titleEl = _pubUpgTitle();
    if (!body) return;
    if (titleEl) titleEl.textContent = `${opt.nombre} — ¿Qué tamaño?`;
    body.innerHTML = `
        <div class="pub-upgrade-opts">
            ${(opt.variantes || []).map((v) => `
            <button type="button" class="pub-upgrade-opt" data-v-id="${v.id}">
                <span class="pub-upgrade-opt-name">${v.nombre}</span>
                <span class="pub-upgrade-opt-price">+$${Number(v.precio_extra || 0).toLocaleString('es-CO')}</span>
            </button>`).join('')}
        </div>
        <button type="button" class="pub-upgrade-back" id="pubUpgradeBack">← Volver</button>`;
    body.querySelectorAll('.pub-upgrade-opt[data-v-id]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const variant = (opt.variantes || []).find((v) => v.id === btn.dataset.vId);
            if (!variant) return;
            if ((variant.sub_variantes || []).length > 0) {
                renderPublicUpgradeStep3(opt, variant);
            } else {
                _applyPublicUpgrade(`${opt.nombre} – ${variant.nombre}`,
                    Number(opt.precio || 0) + Number(variant.precio_extra || 0));
            }
        });
    });
    body.querySelector('#pubUpgradeBack')?.addEventListener('click', renderPublicUpgradeStep1);
}

function renderPublicUpgradeStep3(opt, variant) {
    const body = _pubUpgBody(); const titleEl = _pubUpgTitle();
    if (!body) return;
    if (titleEl) titleEl.textContent = `${variant.nombre} — ¿Qué sabor?`;
    body.innerHTML = `
        <div class="pub-flavors-grid">
            ${(variant.sub_variantes || []).map((s) => `
            <button type="button" class="pub-flavor-btn" data-sub="${s}">${s}</button>`).join('')}
        </div>
        <button type="button" class="pub-upgrade-back" id="pubUpgradeBack">← Volver</button>`;
    body.querySelectorAll('.pub-flavor-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            const sub = btn.dataset.sub;
            const note = sub === 'Sin bebida'
                ? `${opt.nombre} – ${variant.nombre}`
                : `${opt.nombre} – ${variant.nombre} (${sub})`;
            _applyPublicUpgrade(note, Number(opt.precio || 0) + Number(variant.precio_extra || 0));
        });
    });
    body.querySelector('#pubUpgradeBack')?.addEventListener('click', () => renderPublicUpgradeStep2(opt));
}

function _applyPublicUpgrade(upgradeNote, upgradeExtra) {
    if (!_publicUpgradePending) return;
    const { productName, categoryName, orderOptions, buttonId } = _publicUpgradePending;
    const finalName = `${productName} + ${upgradeNote}`;
    _publicUpgradePending = null;
    closePublicUpgradeSheet();
    addItemToCart(finalName, categoryName, { ...orderOptions, upgradeHandled: true, upgradeExtra }, buttonId);
}

function showTempClosureBanner() {
    if (!TEMP_CLOSURE_ACTIVE || document.getElementById('temp-closure-banner')) return;

    const style = document.createElement('style');
    style.textContent = `
        #temp-closure-banner {
            position: fixed;
            top: 0; left: 0; right: 0;
            z-index: 99998;
            background: linear-gradient(135deg, #7a1a1a 0%, #b02020 100%);
            color: #fff7f0;
            padding: 13px 20px 11px;
            text-align: center;
            font-family: 'Oswald', 'Roboto', sans-serif;
            letter-spacing: 0.03em;
            line-height: 1.45;
            box-shadow: 0 3px 16px rgba(80,0,0,0.35);
        }
        #temp-closure-banner .tcb-title {
            display: block;
            font-size: 1.05rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.1em;
        }
        #temp-closure-banner .tcb-sub {
            display: block;
            font-family: 'Roboto', sans-serif;
            font-size: 0.88rem;
            opacity: 0.88;
            margin-top: 2px;
        }
    `;
    document.head.appendChild(style);

    const banner = document.createElement('div');
    banner.id = 'temp-closure-banner';
    banner.setAttribute('role', 'alert');
    banner.innerHTML = `
        <span class="tcb-title">Cerrado momentáneamente</span>
        <span class="tcb-sub">Adecuaciones en el local &mdash; ¡Pronto volvemos con todo!</span>
    `;
    document.body.insertBefore(banner, document.body.firstChild);

    window.requestAnimationFrame(() => {
        const h = banner.offsetHeight;
        if (h > 0) document.body.style.paddingTop = h + 'px';
    });
}

document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('has-auth-nav');
    setActiveCustomerProfile(loadStoredCustomerProfile());

    // Garantía: cualquier ruta que cierre el splash también muestra el homeScreen.
    // IMPORTANTE: el timer de 12s en el inline script llama __roalHideSplash aunque el
    // usuario ya esté navegando. Verificamos que el splash todavía sea visible antes de
    // llamar showHomeScreen(), para no interrumpir la navegación en curso.
    const _origHideSplash = window.__roalHideSplash;
    window.__roalHideSplash = function () {
        const splashEl = document.getElementById('splashScreen');
        const splashIsVisible = Boolean(splashEl && !splashEl.dataset.hidden);
        if (_origHideSplash) _origHideSplash();
        if (splashIsVisible) showHomeScreen();
    };
    document.getElementById('customerSessionButton')?.addEventListener('click', openCustomerAuthModal);
    document.getElementById('publicChatFab')?.addEventListener('click', openPublicChatTab);
    document.getElementById('guestRegisterBannerBtn')?.addEventListener('click', () => openCustomerRegisterModal());

    // Barra de navegación inferior — acciones
    document.getElementById('bnavInicio')?.addEventListener('click', () => {
        window.__roalHideSplash?.(); // oculta splash si todavía está visible
        showHomeScreen();            // siempre navega al home (el wrapper no lo hace si splash ya cerró)
    });
    document.getElementById('bnavMenu')?.addEventListener('click', () => openNavCategoriesScreen('Nuestro Menu', null));
    document.getElementById('bnavCombos')?.addEventListener('click', () => {
        openNavCategoriesScreen('Combos', cat => normalizeCategoryKey(cat.name || '').includes('combo'));
    });
    document.getElementById('bnavPromo')?.addEventListener('click', () => openPromoScreen());
    document.getElementById('bnavBuscador')?.addEventListener('click', () => openSearchScreen());
    document.getElementById('bnavPerfil')?.addEventListener('click', () => openCustomerAuthModal());
    document.getElementById('bnavAyuda')?.addEventListener('click', () => openAyudaScreen());
    document.getElementById('ncsCloseBtn')?.addEventListener('click', () => closeNavCategoriesScreen());
    document.getElementById('searchCloseBtn')?.addEventListener('click', () => closeSearchScreen());
    document.getElementById('promoCloseBtn')?.addEventListener('click', () => closePromoScreen());
    document.getElementById('perfilCloseBtn')?.addEventListener('click', () => closeCustomerAuthModal());
    document.getElementById('ayudaCloseBtn')?.addEventListener('click', () => closeAyudaScreen());

    // Botón enviar de la pantalla Ayuda
    document.getElementById('ayudaWaSendBtn')?.addEventListener('click', function () {
        const textarea = document.getElementById('ayudaWaTextarea');
        const feedback = document.getElementById('ayudaWaFeedback');
        const msg = (textarea?.value || '').trim();
        if (!msg) { textarea?.focus(); if (textarea) textarea.style.borderColor = 'rgba(255,96,0,0.75)'; return; }
        if (textarea) textarea.style.borderColor = '';
        const waText = msg + '\n\n_(Enviado desde el menú digital de ROAL BURGER)_';
        window.open(WHATSAPP_BASE_URL + '?text=' + encodeURIComponent(waText), '_blank', 'noopener,noreferrer');
        this.disabled = true; this.style.opacity = '0.6';
        if (feedback) { feedback.textContent = '¡Mensaje enviado! Será atendido a la brevedad posible.'; feedback.hidden = false; }
        setTimeout(() => closeAyudaScreen(), 3000);
    });
    document.getElementById('searchInput')?.addEventListener('input', e => renderSearchResults(e.target.value));

    // Botones de la pantalla splash
    document.getElementById('splashContinueBtn')?.addEventListener('click', () => {
        document.activeElement?.blur();
        window.__roalHideSplash?.();
    });
    document.getElementById('splashGuestBtn')?.addEventListener('click', () => {
        document.activeElement?.blur();
        window.__roalHideSplash?.();
    });
    document.getElementById('splashSignInBtn')?.addEventListener('click', () => {
        document.activeElement?.blur();
        _promoModalPendingOpen = false;
        window.__roalHideSplash?.();
        setTimeout(() => openCustomerAuthModal(), 350);
    });

    // Botón volver en pantalla detalle de categoría
    document.getElementById('cdsBackBtn')?.addEventListener('click', () => closeCategoryDetail());

    initCartUI();
    initSupportModal();
    // initPromoModal(); — desactivado: el recomendado se muestra fijo en el banner del home screen
    initShortcutInstallUI();
    setupMenuNavigation();
    updateDynamicWhatsAppLink(activeMenuSection);
    showTempClosureBanner();
    syncOrderingAvailabilityUI();
    // Pausar el interval cuando el tab está en segundo plano (ahorra batería y CPU)
    let _syncInterval = window.setInterval(syncOrderingAvailabilityUI, 60000);
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            clearInterval(_syncInterval);
        } else {
            syncOrderingAvailabilityUI();
            _syncInterval = window.setInterval(syncOrderingAvailabilityUI, 60000);
        }
    }, { once: false });
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
    loadPublicUpgradesConfig();
    loadHorarioConfig();
    loadBebidasPublic();
    loadCustomerPaymentMethods();

    // Cerrar upgrade sheet público
    document.getElementById('publicUpgradeOverlay')?.addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closePublicUpgradeSheet();
    });
    document.getElementById('publicUpgradeCloseBtn')?.addEventListener('click', closePublicUpgradeSheet);

    // ── Botón ATRÁS de Android: cierra el overlay activo en vez de salir de la app ──
    window.addEventListener('popstate', () => {
        if (_skipNextPopstate) { _skipNextPopstate = false; return; }
        if (_modalHistoryDepth > 0) {
            // Modales tienen mayor prioridad (z-index superior)
            _modalHistoryDepth--;
            _closingByBackBtn = true;
            try {
                if (paymentFlowUI) { closePaymentFlowModal(); return; }
                const upgradeOverlay = document.getElementById('publicUpgradeOverlay');
                if (upgradeOverlay && !upgradeOverlay.hidden) { closePublicUpgradeSheet(); return; }
                if (supportUI?.modal?.classList.contains('is-open')) { closeSupportModal(); return; }
                if (cartUI?.drawer.classList.contains('is-open')) { closeCartDrawer(); return; }
            } finally {
                _closingByBackBtn = false;
            }
        } else if (_screenHistoryPushed) {
            // Pantallas de menú (búsqueda, categorías, promos, detalle)
            _screenHistoryPushed = false;
            _closingByBackBtn = true;
            try {
                // Cierra de más anidado a menos anidado
                if (!document.getElementById('categoryDetailScreen')?.hidden) {
                    closeCategoryDetail();
                    // Si navCategoriesScreen fue restaurada, re-empujar estado para permitir otro «atrás»
                    if (!document.getElementById('navCategoriesScreen')?.hidden) {
                        history.pushState({ roalMenuScreen: true }, '');
                        _screenHistoryPushed = true;
                    }
                    return;
                }
                if (!document.getElementById('searchScreen')?.hidden)        { closeSearchScreen();        return; }
                if (!document.getElementById('navCategoriesScreen')?.hidden) { closeNavCategoriesScreen(); return; }
                if (!document.getElementById('promoScreen')?.hidden)         { closePromoScreen();         return; }
                showHomeScreen();
            } finally {
                _closingByBackBtn = false;
            }
        }
    });

    // Re-render del home cuando el tab vuelve a primer plano tras inactividad
    let _lastHiddenAt = 0;
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            _lastHiddenAt = Date.now();
        } else if (document.visibilityState === 'visible') {
            const hiddenMs = Date.now() - _lastHiddenAt;
            const homeScreen = document.getElementById('homeScreen');
            // Si el homeScreen está oculto y la splash ya no existe, mostrarlo
            // — pero solo si no hay ninguna pantalla secundaria abierta
            if (homeScreen && homeScreen.hidden && !document.getElementById('splashScreen')) {
                const _secondaryIds = ['categoryDetailScreen', 'navCategoriesScreen', 'promoScreen', 'searchScreen'];
                const _anySecondaryOpen = _secondaryIds.some(id => { const el = document.getElementById(id); return el && !el.hidden; });
                if (!_anySecondaryOpen) showHomeScreen();
                return;
            }
            // Si estuvo oculto más de 30 segundos, forzar re-render del home
            if (_lastHiddenAt > 0 && hiddenMs > 30000) {
                if (homeScreen && !homeScreen.hidden && homeScreen.style.display !== 'none') {
                    renderHomeScreen();
                }
            }
        }
    });
});

/* ===== PANTALLA AYUDA / CONTACTO WHATSAPP ===== */
function openAyudaScreen() {
    const screen   = document.getElementById('ayudaScreen');
    const textarea = document.getElementById('ayudaWaTextarea');
    const feedback = document.getElementById('ayudaWaFeedback');
    const sendBtn  = document.getElementById('ayudaWaSendBtn');
    if (!screen) return;

    _enterScreen('ayudaScreen');
    screen.hidden = false;

    if (textarea) { textarea.value = ''; textarea.style.borderColor = ''; }
    if (feedback) feedback.hidden = true;
    if (sendBtn)  { sendBtn.disabled = false; sendBtn.style.opacity = ''; }

    requestAnimationFrame(() => textarea?.focus());
}

function closeAyudaScreen() {
    const screen = document.getElementById('ayudaScreen');
    if (screen) screen.hidden = true;
    _exitScreen();
}

// Alias para compatibilidad con código existente
function openAyudaModal() { openAyudaScreen(); }

