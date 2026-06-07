const MAX_FEATURED = 5;

const PUBLIC_CATEGORY_CATALOG = [
    { id: 'burger-premium', name: 'BURGER PREMIUM', active: true, image_url: './burgerpremium/burgerranchera.png' },
    { id: 'burger-clasicas', name: 'BURGER CLASICAS', active: true, image_url: './burgerclasicas/burgernormal.png' },
    { id: 'pepitos-venezolanos', name: 'PEPITOS VENEZOLANOS', active: true, image_url: './pepitosvenezolanos/pepitoranchero.png' },
    { id: 'perros-calientes', name: 'PERROS CALIENTES', active: true, image_url: './perroscalientes/perroespecial.png' },
    { id: 'entradas', name: 'ENTRADAS', active: true, image_url: './entradas/papas.png' },
    { id: 'salchipapas', name: 'SALCHIPAPAS', active: true, image_url: './salchipapas/salchinormal.png' },
    { id: 'combos-papas-bebida', name: 'COMBOS CON PAPAS Y BEBIDA', active: true, image_url: './combosconpapasybebidas/comboburgernormal.png' },
    { id: 'combos-mixtos', name: 'COMBOS MIXTOS', active: true, image_url: './combosmixtos/delacasa.png' },
    { id: 'nuestras-salsas', name: 'NUESTRAS SALSAS', active: true, image_url: './nuestrassalsas/salsasdelacasa.png' },
    { id: 'bebidas-adicionales', name: 'BEBIDAS Y ADICIONALES', active: true, image_url: './bebidasyadicionales/bebidas.png' }
];

const PUBLIC_PRODUCT_CATALOG = [
    { id: 'burger-clasicas-normal', nombre: 'Normal', precio: 17000, categoria: 'BURGER CLASICAS', estado: 'active', es_destacado: false, image_url: './burgerclasicas/burgernormal.png' },
    { id: 'burger-clasicas-super', nombre: 'Super', precio: 19000, categoria: 'BURGER CLASICAS', estado: 'active', es_destacado: false, image_url: './burgerclasicas/burgersuper.png' },
    { id: 'burger-premium-caracas', nombre: 'Caracas', precio: 26000, categoria: 'BURGER PREMIUM', estado: 'active', es_destacado: false, image_url: './burgerpremium/burgercaracas.png' },
    { id: 'burger-premium-cordillera', nombre: 'Cordillera', precio: 34000, categoria: 'BURGER PREMIUM', estado: 'active', es_destacado: false, image_url: './burgerpremium/burgercordillera.png' },
    { id: 'burger-premium-papuda', nombre: 'Papuda', precio: 20000, categoria: 'BURGER PREMIUM', estado: 'active', es_destacado: false, image_url: './burgerpremium/burgerpapuda.png' },
    { id: 'burger-premium-plus', nombre: 'Plus', precio: 30000, categoria: 'BURGER PREMIUM', estado: 'active', es_destacado: false, image_url: './burgerpremium/burgerplus.png' },
    { id: 'burger-premium-ranchera', nombre: 'Ranchera', precio: 30000, categoria: 'BURGER PREMIUM', estado: 'active', es_destacado: false, image_url: './burgerpremium/burgerranchera.png' },
    { id: 'burger-premium-triplete', nombre: 'Triplete', precio: 29000, categoria: 'BURGER PREMIUM', estado: 'active', es_destacado: false, image_url: './burgerpremium/burgertriplete.png' },
    { id: 'pepitos-mix', nombre: 'Mix', precio: 29000, categoria: 'PEPITOS VENEZOLANOS', estado: 'active', es_destacado: false, image_url: './pepitosvenezolanos/pepitomix.png' },
    { id: 'pepitos-plus', nombre: 'Plus', precio: 36000, categoria: 'PEPITOS VENEZOLANOS', estado: 'active', es_destacado: false, image_url: './pepitosvenezolanos/pepitoplus.png' },
    { id: 'pepitos-ranchero', nombre: 'Ranchero', precio: 34000, categoria: 'PEPITOS VENEZOLANOS', estado: 'active', es_destacado: false, image_url: './pepitosvenezolanos/pepitoranchero.png' },
    { id: 'pepitos-urbano', nombre: 'Urbano', precio: 30000, categoria: 'PEPITOS VENEZOLANOS', estado: 'active', es_destacado: false, image_url: './pepitosvenezolanos/pepitourbano.png' },
    { id: 'perros-especial', nombre: 'Especial', precio: 15000, categoria: 'PERROS CALIENTES', estado: 'active', es_destacado: false, image_url: './perroscalientes/perroespecial.png' },
    { id: 'perros-normal', nombre: 'Normal', precio: 12000, categoria: 'PERROS CALIENTES', estado: 'active', es_destacado: false, image_url: './perroscalientes/perronormal.png' },
    { id: 'perros-super', nombre: 'Super', precio: 16000, categoria: 'PERROS CALIENTES', estado: 'active', es_destacado: false, image_url: './perroscalientes/perrosuper.png' },
    { id: 'entradas-papas-francesa', nombre: 'Papas a la Francesa', precio: 8000, categoria: 'ENTRADAS', estado: 'active', es_destacado: false, image_url: './entradas/papas.png' },
    { id: 'entradas-tequenos', nombre: 'Tequenos', precio: 8000, categoria: 'ENTRADAS', estado: 'active', es_destacado: false, image_url: './entradas/tequenos.png' },
    { id: 'salchipapas-normal', nombre: 'Salchi Normal', precio: 12000, categoria: 'SALCHIPAPAS', estado: 'active', es_destacado: false, image_url: './salchipapas/salchinormal.png' },
    { id: 'salchipapas-super', nombre: 'Salchi Super', precio: 19000, categoria: 'SALCHIPAPAS', estado: 'active', es_destacado: false, image_url: './salchipapas/salchisuper.png' },
    { id: 'combos-papas-burger-normal', nombre: 'Combo Burger Normal', precio: 21000, categoria: 'COMBOS CON PAPAS Y BEBIDA', estado: 'active', es_destacado: false, image_url: './combosconpapasybebidas/comboburgernormal.png' },
    { id: 'combos-papas-burger-papuda', nombre: 'Combo Burger Papuda', precio: 27000, categoria: 'COMBOS CON PAPAS Y BEBIDA', estado: 'active', es_destacado: false, image_url: './combosconpapasybebidas/comboburgerpapuda.png' },
    { id: 'combos-papas-burger-super', nombre: 'Combo Burger Super', precio: 26000, categoria: 'COMBOS CON PAPAS Y BEBIDA', estado: 'active', es_destacado: false, image_url: './combosconpapasybebidas/comboburgersuper.png' },
    { id: 'combos-papas-perro-normal', nombre: 'Combo Perro Normal', precio: 17000, categoria: 'COMBOS CON PAPAS Y BEBIDA', estado: 'active', es_destacado: false, image_url: './combosconpapasybebidas/comboperronormal.png' },
    { id: 'combos-mixtos-de-la-casa', nombre: 'De La Casa', precio: 49000, categoria: 'COMBOS MIXTOS', estado: 'active', es_destacado: false, image_url: './combosmixtos/delacasa.png' },
    { id: 'combos-mixtos-emparejados', nombre: 'Emparejados', precio: 45000, categoria: 'COMBOS MIXTOS', estado: 'active', es_destacado: false, image_url: './combosmixtos/emparejados.png' },
    { id: 'combos-mixtos-familiar-3', nombre: 'Familiar 3', precio: 48000, categoria: 'COMBOS MIXTOS', estado: 'active', es_destacado: false, image_url: './combosmixtos/familiar3.png' },
    { id: 'combos-mixtos-familiar-4', nombre: 'Familiar 4', precio: 44000, categoria: 'COMBOS MIXTOS', estado: 'active', es_destacado: false, image_url: './combosmixtos/familiar4.png' },
    { id: 'bebidas-adicionales-adicionales', nombre: 'Adicionales', precio: 2000, categoria: 'BEBIDAS Y ADICIONALES', estado: 'active', es_destacado: false, image_url: './bebidasyadicionales/adiciones.png' },
    { id: 'bebidas-adicionales-bebidas', nombre: 'Bebidas', precio: 3500, categoria: 'BEBIDAS Y ADICIONALES', estado: 'active', es_destacado: false, image_url: './bebidasyadicionales/bebidas.png' },
    { id: 'nuestras-salsas-salsas-casa', nombre: 'Salsas de la Casa', precio: 1000, categoria: 'NUESTRAS SALSAS', estado: 'active', es_destacado: false, image_url: './nuestrassalsas/salsasdelacasa.png' }
];

const seedCategories = PUBLIC_CATEGORY_CATALOG;

const seedProducts = PUBLIC_PRODUCT_CATALOG;

const defaultButtons = [
    {
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
    {
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
    {
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
    {
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
    {
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
];

const BRAND_TEMPLATES = {
    fodexa: { primaryColor: '#2f6fdd', secondaryColor: '#5f95ea', accentColor: '#43c09c', bgColor: '#0e1420', buttonBorderColor: '#8ca9da' },
    slate: { primaryColor: '#334155', secondaryColor: '#64748b', accentColor: '#22c55e', bgColor: '#0b1220', buttonBorderColor: '#95a4bc' },
    ivory: { primaryColor: '#b89b63', secondaryColor: '#d8c29a', accentColor: '#6d4d2e', bgColor: '#f3efe6', buttonBorderColor: '#c5b188' },
    cobalt: { primaryColor: '#1d4f99', secondaryColor: '#2f72cb', accentColor: '#39b5f2', bgColor: '#081a33', buttonBorderColor: '#6a9fe8' },
    ember: { primaryColor: '#8a2b1d', secondaryColor: '#c94f36', accentColor: '#f2ab4b', bgColor: '#1b0e0d', buttonBorderColor: '#ce826f' },
    mono: { primaryColor: '#3a3a3a', secondaryColor: '#626262', accentColor: '#b8b8b8', bgColor: '#101010', buttonBorderColor: '#8a8a8a' }
};

const defaultBranding = {
    restaurantName: 'ROAL BURGER',
    slogan: 'Comida rapida con acento venezolano',
    logoUrl: 'logo.png',
    whatsappNumber: '573144689509',
    whatsappLink: 'https://wa.me/573144689509?text=Hola%20ROAL%20BURGER!%20Quisiera%20realizar%20un%20pedido%20por%20favor',
    businessHours: 'Lunes a Domingo: 4:00 P.M. a 10:00 P.M.',
    address: 'Cl. 22 #29-59, Armenia, Quindio. Barrio Las Americas.',
    locationLink: 'https://maps.google.com/?q=Cl.+22+%2329-59,+Armenia,+Quindio',
    instagramLink: 'https://www.instagram.com/roalburgerarmenia?igsh=cWE2eGRyNnlxaXgy&utm_source=qr',
    tiktokLink: 'https://www.tiktok.com/@roalburger',
    facebookLink: 'https://www.facebook.com/share/17ukpFaQz3/?mibextid=wwXIfr',
    primaryColor: '#2f6fdd',
    secondaryColor: '#5f95ea',
    accentColor: '#43c09c',
    template: 'fodexa',
    bgColor: '#0e1420',
    buttonBorderColor: '#8ca9da',
    fontFamily: 'Roboto, sans-serif',
    fontSizeBase: 16,
    interactionVolume: 0.1,
    animationSpeed: 1,
    updated_at: null
};

const CONFIG_COLLECTION = 'configuracion';
const CONFIG_DOC_ID = 'config_landing';
const UPGRADES_CONFIG_DOC_ID = 'acompañamientos';
const ORDERS_COLLECTION = 'pedidos';
const CLIENTS_COLLECTION = 'clientes';
const MESSAGES_COLLECTION = 'mensajes';
const SALES_SUMMARY_COLLECTION = 'resumen_ventas';
const SALES_DAY_STATE_COLLECTION = 'admin_estado';
const SALES_DAY_STATE_DOC_ID = 'jornada_ventas_actual';

const adminAuthForm = document.getElementById('adminAuthForm');
const authUsernameInput = document.getElementById('authUsername');
const authPasswordInput = document.getElementById('authPassword');
const authRememberDeviceInput = document.getElementById('authRememberDevice');
const authError = document.getElementById('authError');
const authForgotBtn = document.getElementById('authForgotBtn');
const authRegisterBtn = document.getElementById('authRegisterBtn');
const authPasswordToggle = document.getElementById('authPasswordToggle');
const adminSignOutBtn = document.getElementById('adminSignOutBtn');

const categoryForm = document.getElementById('categoryForm');
const categoryList = document.getElementById('categoryList');
const openCreateCategoryBtn = document.getElementById('openCreateCategoryBtn');
const openCreateProductBtn = document.getElementById('openCreateProductBtn');
const notice = document.getElementById('adminNotice');
const totalClicksEl = document.getElementById('totalClicks');
const topProductEl = document.getElementById('topProduct');
const metricsChartList = document.getElementById('metricsChartList');
const metricsCategoryList = document.getElementById('metricsCategoryList');
const metricsInsightsList = document.getElementById('metricsInsightsList');
const metricActiveProductsEl = document.getElementById('metricActiveProducts');
const metricPausedProductsEl = document.getElementById('metricPausedProducts');
const metricFeaturedProductsEl = document.getElementById('metricFeaturedProducts');
const metricActiveCategoriesEl = document.getElementById('metricActiveCategories');
const metricAveragePriceEl = document.getElementById('metricAveragePrice');
const metricWhatsappClicksEl = document.getElementById('metricWhatsappClicks');
const metricDailyVisitorsEl = document.getElementById('metricDailyVisitors');
const openCreateClientBtn = document.getElementById('openCreateClientBtn');
const exportClientsBtn = document.getElementById('exportClientsBtn');
const clientsExportFormat = document.getElementById('clientsExportFormat');
const clientsExportScope = document.getElementById('clientsExportScope');
const clientsSearchInput = document.getElementById('clientsSearchInput');
const clientsList = document.getElementById('clientsList');
const clientsCount = document.getElementById('clientsCount');
const messagesList = document.getElementById('messagesList');
const messagesCount = document.getElementById('messagesCount');
const adminPublicLink = document.getElementById('adminPublicLink');
const ordersBoard = document.getElementById('ordersBoard');
const ordersColumnUnread = document.getElementById('ordersColumnUnread');
const ordersColumnTakeaway = document.getElementById('ordersColumnTakeaway');
const ordersColumnDelivery = document.getElementById('ordersColumnDelivery');
const ordersCountUnread = document.getElementById('ordersCountUnread');
const ordersCountTakeaway = document.getElementById('ordersCountTakeaway');
const ordersCountDelivery = document.getElementById('ordersCountDelivery');
const ordersMobileTabs = document.getElementById('ordersMobileTabs');
const orderTicketPanel = document.getElementById('orderTicketPanel');
const orderTicketBody = document.getElementById('orderTicketBody');
const mobileTicketCloseBtn = document.getElementById('mobileTicketCloseBtn');
const mobileTicketBackdrop = document.getElementById('mobileTicketBackdrop');
const closeSalesDayBtn = document.getElementById('closeSalesDayBtn');
const salesDayStatusLabel = document.getElementById('salesDayStatusLabel');
const salesDayStatusMeta = document.getElementById('salesDayStatusMeta');
const salesDayDeliveredCount = document.getElementById('salesDayDeliveredCount');
const salesDayDeliveredTotal = document.getElementById('salesDayDeliveredTotal');
const openCreateInternalOrderBtn = document.getElementById('openCreateInternalOrderBtn');
const internalOrderModal = document.getElementById('posView');
const internalOrderCloseBtn = document.getElementById('posCloseBtn');
const internalOrderForm = document.getElementById('internalOrderForm');
const internalOrderClientSelect = null; // replaced by posClientSearchInput
const internalOrderClientAddressField = document.getElementById('internalOrderClientAddressField');
const internalOrderClientAddressSelect = document.getElementById('internalOrderClientAddressSelect');
const internalOrderUseNewClientCheckbox = null;
const internalOrderNewClientFields = document.getElementById('internalOrderNewClientFields');
const internalOrderNewClientNameInput = document.getElementById('internalOrderNewClientName');
const internalOrderNewClientPhoneInput = document.getElementById('internalOrderNewClientPhone');
const internalOrderNewClientAddressInput = document.getElementById('internalOrderNewClientAddress');
const internalOrderTypeSelect = document.getElementById('internalOrderType');
const internalOrderDeliveryAddressField = document.getElementById('internalOrderDeliveryAddressField');
const internalOrderDeliveryAddressInput = document.getElementById('internalOrderDeliveryAddress');
const internalOrderPaymentMethodSelect = document.getElementById('internalOrderPaymentMethod');
const internalOrderProductCategorySelect = document.getElementById('internalOrderProductCategory');
const internalOrderProductGrid = document.getElementById('internalOrderProductGrid');
const internalOrderProductSelect = document.getElementById('internalOrderProductSelect');
const internalOrderProductQuantityInput = document.getElementById('internalOrderProductQuantity');
const internalOrderAddProductBtn = document.getElementById('internalOrderAddProductBtn');
const internalOrderItemsSummary = document.getElementById('internalOrderItemsSummary');
const internalOrderNotesInput = document.getElementById('internalOrderNotes');
const internalOrderDiscount = document.getElementById('internalOrderDiscount');
const internalOrderFeedback = document.getElementById('internalOrderFeedback');
const internalOrderSaveBtn = document.getElementById('internalOrderSaveBtn');
const salesSummaryDateFrom = document.getElementById('salesSummaryDateFrom');
const salesSummaryDateTo = document.getElementById('salesSummaryDateTo');
const salesSummaryFilterType = document.getElementById('salesSummaryFilterType');
const salesSummaryFilterValue = document.getElementById('salesSummaryFilterValue');
const salesSummaryList = document.getElementById('salesSummaryList');
const salesSummaryTotalAmount = document.getElementById('salesSummaryTotalAmount');
const salesSummaryTotalOrders = document.getElementById('salesSummaryTotalOrders');
const salesSummaryTotalDays = document.getElementById('salesSummaryTotalDays');
const ledgerBookDateFrom = document.getElementById('ledgerBookDateFrom');
const ledgerBookDateTo = document.getElementById('ledgerBookDateTo');
const ledgerBookList = document.getElementById('ledgerBookList');
const ledgerBookTotalIncome = document.getElementById('ledgerBookTotalIncome');
const ledgerBookTotalEntries = document.getElementById('ledgerBookTotalEntries');
const ledgerBookAverageIncome = document.getElementById('ledgerBookAverageIncome');
const exportLedgerExcelBtn = document.getElementById('exportLedgerExcelBtn');
const exportLedgerPdfBtn = document.getElementById('exportLedgerPdfBtn');
const previewRefreshBtn = document.getElementById('previewRefreshBtn');
const liveMenuPreview = document.getElementById('liveMenuPreview');
const previewViewportControls = document.getElementById('previewViewportControls');
const previewViewportWrap = document.getElementById('previewViewportWrap');
const advancedSettingsToggle = document.getElementById('advancedSettingsToggle');
const advancedSettingsPanel = document.getElementById('advancedSettingsPanel');

const categoryProductsModal = document.getElementById('categoryProductsModal');
const categoryProductsModalTitle = document.getElementById('categoryProductsModalTitle');
const categoryProductsModalMeta = document.getElementById('categoryProductsModalMeta');
const categoryProductsModalBody = document.getElementById('categoryProductsModalBody');
const categoryProductsModalCloseBtn = document.getElementById('categoryProductsModalCloseBtn');

const categoryCreateModal = document.getElementById('categoryCreateModal');
const categoryCreateForm = document.getElementById('categoryCreateForm');
const categoryCreateCloseBtn = document.getElementById('categoryCreateCloseBtn');
const modalCategoryNameInput = document.getElementById('modalCategoryName');
const categoryCreateSaveBtn = document.getElementById('categoryCreateSaveBtn');
const categoryCreateFeedback = document.getElementById('categoryCreateFeedback');

const productCreateModal = document.getElementById('productCreateModal');
const productCreateForm = document.getElementById('productCreateForm');
const productCreateCloseBtn = document.getElementById('productCreateCloseBtn');
const createProductNameInput = document.getElementById('createProductName');
const createProductPriceInput = document.getElementById('createProductPrice');
const createProductCategorySelect = document.getElementById('createProductCategory');
const createProductStateSelect = document.getElementById('createProductState');
const createProductFeaturedSelect = document.getElementById('createProductFeatured');
const createProductImageFileInput = document.getElementById('createProductImageFile');
const createProductImageUrlInput = document.getElementById('createProductImageUrl');
const productCreateSaveBtn = document.getElementById('productCreateSaveBtn');
const productCreateFeedback = document.getElementById('productCreateFeedback');

const productEditModal = document.getElementById('productEditModal');
const productEditForm = document.getElementById('productEditForm');
const productEditCloseBtn = document.getElementById('productEditCloseBtn');
const editProductIdInput = document.getElementById('editProductId');
const editProductNameInput = document.getElementById('editProductName');
const editProductPriceInput = document.getElementById('editProductPrice');
const editProductCategorySelect = document.getElementById('editProductCategory');
const editProductStateSelect = document.getElementById('editProductState');
const editProductFeaturedSelect = document.getElementById('editProductFeatured');
const editProductImageFileInput = document.getElementById('editProductImageFile');
const editProductImageUrlInput = document.getElementById('editProductImageUrl');
const productEditSaveBtn = document.getElementById('productEditSaveBtn');

const clientEditModal = document.getElementById('clientEditModal');
const clientEditForm = document.getElementById('clientEditForm');
const clientEditCloseBtn = document.getElementById('clientEditCloseBtn');
const clientModalTitle = document.getElementById('clientModalTitle');
const clientEditIdInput = document.getElementById('clientEditId');
const clientEditNameInput = document.getElementById('clientEditName');
const clientEditPhoneInput = document.getElementById('clientEditPhone');
const clientEditAddressInput = document.getElementById('clientEditAddress');
const clientEditSavedAddressesInput = document.getElementById('clientEditSavedAddresses');
const clientEditFeedback = document.getElementById('clientEditFeedback');
const clientEditSaveBtn = document.getElementById('clientEditSaveBtn');

const buttonConfigForm = document.getElementById('buttonConfigForm');
const buttonConfigList = document.getElementById('buttonConfigList');
const buttonVolumeInput = document.getElementById('buttonVolume');
const buttonVolumeOut = document.getElementById('buttonVolumeOut');
const buttonEditIdInput = document.getElementById('buttonEditId');
const buttonSaveBtn = document.getElementById('buttonSaveBtn');

const brandingForm = document.getElementById('brandingForm');
const templateGrid = document.getElementById('templateGrid');
const previewName = document.getElementById('previewName');
const previewSlogan = document.getElementById('previewSlogan');
const brandingPreview = document.getElementById('brandingPreview');
const previewWhatsapp = document.getElementById('previewWhatsapp');
const previewBusinessHours = document.getElementById('previewBusinessHours');
const previewAddress = document.getElementById('previewAddress');
const previewLocation = document.getElementById('previewLocation');
const previewSocials = document.getElementById('previewSocials');
const designFontSizeInput = document.getElementById('designFontSize');
const designFontSizeOut = document.getElementById('designFontSizeOut');
const interactionVolumeInput = document.getElementById('interactionVolume');
const interactionVolumeOut = document.getElementById('interactionVolumeOut');
const animationSpeedInput = document.getElementById('animationSpeed');
const animationSpeedOut = document.getElementById('animationSpeedOut');

let firebaseDb;
let firebaseStorage;
let firebaseAuth;
let productsState = [];
let categoriesState = [];
let buttonsState = [];
let brandingState = { ...defaultBranding };
let ordersState = [];
let clientsState = [];
let messagesState = [];
let salesSummariesState = [];
let salesDayState = null;
let selectedOrderId = null;
let knownOrderIds = new Set();
let hasLoadedOrdersOnce = false;
let knownMessageIds = new Set();
let hasLoadedMessagesOnce = false;
let activeAccordionSection = 'categorias';
let orderAnnouncementQueue = Promise.resolve();
let orderBellAudioContext = null;
let editingCategoryContextId = null;
let activeCategoryModalId = null;
let activeClientEditId = null;
let internalOrderItems = [];
let internalOrderUseNewClient = false;
let posSelectedCategory = null;
let posCurrentClient = null;
let posSelectedClientData = null;
let posTickets = [];
let posActiveTicketId = null;
let menuUpgradesConfig = null;
let _posUpgradePending = null;
let clientsSearchTerm = '';
let expandedClientAddressIds = new Set();
let productClicksState = [];
let liveSubscriptions = [];
let previewRefreshTimer = null;
let ordersRealtimeTimer = null;
let clipboardToastTimer = null;
let activeMobileOrdersLane = 'takeaway';
let adminTitleBlinkTimer = null;
let adminTitleBlinkState = false;
const adminBaseTitle = document.title || 'ROAL BURGER | Admin';
let metricsEventsState = {
    total: 0,
    whatsapp: 0,
    menu: 0,
    social: 0,
    products: 0,
    dailyVisitors: 0
};

function normalizeClientSavedAddresses(rawAddresses = [], primaryAddress = '') {
    const normalizedAddresses = [];
    const seen = new Set();

    const appendAddress = (value) => {
        const safeValue = String(value || '').trim();
        const normalizedKey = safeValue.toLowerCase();
        if (!safeValue || seen.has(normalizedKey)) {
            return;
        }

        seen.add(normalizedKey);
        normalizedAddresses.push(safeValue);
    };

    appendAddress(primaryAddress);

    if (Array.isArray(rawAddresses)) {
        rawAddresses.forEach((entry) => {
            if (typeof entry === 'string') {
                appendAddress(entry);
                return;
            }

            if (entry && typeof entry === 'object') {
                appendAddress(entry.address || entry.value || entry.label || '');
            }
        });
    }

    return normalizedAddresses.slice(0, 5);
}

function parseClientSavedAddressesInput(rawValue = '', primaryAddress = '') {
    const lines = String(rawValue || '')
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

    return normalizeClientSavedAddresses(lines, primaryAddress);
}

function showNotice(text, type = 'ok') {
    if (!notice) {
        return;
    }
    notice.textContent = text;
    notice.className = `notice show ${type}`;
}

function hideNotice() {
    if (!notice) {
        return;
    }
    notice.className = 'notice';
    notice.textContent = '';
}

function showClipboardToast(message = 'Copiado') {
    let toast = document.getElementById('clipboardToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'clipboardToast';
        toast.className = 'clipboard-toast';
        document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.add('show');

    if (clipboardToastTimer) {
        window.clearTimeout(clipboardToastTimer);
    }

    clipboardToastTimer = window.setTimeout(() => {
        toast.classList.remove('show');
    }, 1400);
}

function getSharedFirebaseConfig() {
    return window.FIREBASE_CONFIG && typeof window.FIREBASE_CONFIG === 'object'
        ? window.FIREBASE_CONFIG
        : null;
}

function getFirebaseStorageFolder() {
    return typeof window.FIREBASE_STORAGE_FOLDER === 'string' && window.FIREBASE_STORAGE_FOLDER.trim()
        ? window.FIREBASE_STORAGE_FOLDER.trim()
        : 'product-images';
}

function getAdminRuntimeConfig() {
    return window.ROAL_ADMIN_RUNTIME_CONFIG && typeof window.ROAL_ADMIN_RUNTIME_CONFIG === 'object'
        ? window.ROAL_ADMIN_RUNTIME_CONFIG
        : {};
}

function isMobileAdminViewport() {
    return window.matchMedia('(max-width: 768px)').matches;
}

function applyMobileOrdersLane() {
    const nextLane = ['unread', 'takeaway', 'delivery'].includes(activeMobileOrdersLane)
        ? activeMobileOrdersLane
        : 'takeaway';

    document.querySelectorAll('.orders-lane[data-mobile-lane]').forEach((lane) => {
        const laneKey = String(lane.getAttribute('data-mobile-lane') || '').trim();
        if (!isMobileAdminViewport()) {
            lane.classList.remove('is-mobile-active');
            return;
        }

        lane.classList.toggle('is-mobile-active', laneKey === nextLane);
    });

    document.querySelectorAll('[data-mobile-orders-tab]').forEach((tab) => {
        const tabKey = String(tab.getAttribute('data-mobile-orders-tab') || '').trim();
        const isActive = tabKey === nextLane;
        tab.classList.toggle('active', isActive);
        tab.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
}

function openMobileTicketPanel() {
    if (!isMobileAdminViewport()) {
        return;
    }

    orderTicketPanel?.classList.add('is-mobile-open');
    mobileTicketBackdrop?.classList.add('is-visible');
    document.body.classList.add('ticket-mobile-open');
}

function closeMobileTicketPanel(options = {}) {
    const shouldClearSelection = options.clearSelection === true;

    orderTicketPanel?.classList.remove('is-mobile-open');
    mobileTicketBackdrop?.classList.remove('is-visible');
    document.body.classList.remove('ticket-mobile-open');

    if (shouldClearSelection && selectedOrderId) {
        selectedOrderId = null;
    }
}

function syncResponsiveAdminState() {
    applyMobileOrdersLane();

    if (!isMobileAdminViewport()) {
        closeMobileTicketPanel();
    }
}

function resolvePublicAppUrl() {
    const runtimeConfig = getAdminRuntimeConfig();
    if (typeof runtimeConfig.publicAppUrl === 'string' && runtimeConfig.publicAppUrl.trim()) {
        return runtimeConfig.publicAppUrl.trim();
    }

    return '/';
}

function applyAdminRuntimeLinks() {
    if (adminPublicLink) {
        adminPublicLink.href = resolvePublicAppUrl();
    }
}

function showModalFeedback(element, text, type = 'ok') {
    if (!element) {
        return;
    }

    element.textContent = text;
    element.className = `modal-feedback show ${type}`;
}

function hideModalFeedback(element) {
    if (!element) {
        return;
    }

    element.textContent = '';
    element.className = 'modal-feedback';
}

function waitForUiDelay(delayMs = 700) {
    return new Promise((resolve) => {
        window.setTimeout(resolve, delayMs);
    });
}

function slugify(text) {
    return String(text || '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

function normalizeCategoryKey(value) {
    return String(value || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
}

function firestoreNow() {
    return firebase.firestore.FieldValue.serverTimestamp();
}

function normalizePhoneDigits(value) {
    return String(value || '').replace(/\D+/g, '');
}

function buildAdminClientDocumentId(client = {}) {
    const phoneDigits = normalizePhoneDigits(client.customerPhoneDigits || client.customerPhone);
    if (phoneDigits) {
        return `phone_${phoneDigits}`;
    }

    const nameKey = normalizeCategoryKey(client.customerName || 'cliente').replace(/[^a-z0-9]+/g, '_');
    const addressKey = normalizeCategoryKey(client.address || 'sin_direccion').replace(/[^a-z0-9]+/g, '_');
    return `client_${nameKey}_${addressKey}`.replace(/_+/g, '_');
}

function getSafeCustomerAnnouncementName(value) {
    const normalized = String(value || '').trim().replace(/\s+/g, ' ');
    return normalized || 'cliente sin nombre';
}

function getOrderBellAudioContext() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
        return null;
    }

    if (!orderBellAudioContext) {
        orderBellAudioContext = new AudioContextClass();
    }

    return orderBellAudioContext;
}

function playOrderBell() {
    const audioContext = getOrderBellAudioContext();
    if (!audioContext) {
        return Promise.resolve();
    }

    if (audioContext.state === 'suspended') {
        return audioContext.resume()
            .catch(() => undefined)
            .then(() => playOrderBell());
    }

    return new Promise((resolve) => {
        const startAt = audioContext.currentTime + 0.02;
        const playWhistleBurst = (burstStart) => {
            const masterGain = audioContext.createGain();
            const bandpassFilter = audioContext.createBiquadFilter();
            const oscillatorA = audioContext.createOscillator();
            const oscillatorB = audioContext.createOscillator();

            bandpassFilter.type = 'bandpass';
            bandpassFilter.frequency.setValueAtTime(2200, burstStart);
            bandpassFilter.Q.setValueAtTime(8, burstStart);

            oscillatorA.type = 'square';
            oscillatorA.frequency.setValueAtTime(1850, burstStart);
            oscillatorA.frequency.linearRampToValueAtTime(2050, burstStart + 0.08);
            oscillatorA.frequency.linearRampToValueAtTime(1800, burstStart + 0.2);

            oscillatorB.type = 'sawtooth';
            oscillatorB.frequency.setValueAtTime(925, burstStart);
            oscillatorB.frequency.linearRampToValueAtTime(1025, burstStart + 0.08);
            oscillatorB.frequency.linearRampToValueAtTime(900, burstStart + 0.2);

            masterGain.gain.setValueAtTime(0.0001, burstStart);
            masterGain.gain.exponentialRampToValueAtTime(0.28, burstStart + 0.02);
            masterGain.gain.exponentialRampToValueAtTime(0.22, burstStart + 0.12);
            masterGain.gain.exponentialRampToValueAtTime(0.0001, burstStart + 0.24);

            oscillatorA.connect(bandpassFilter);
            oscillatorB.connect(bandpassFilter);
            bandpassFilter.connect(masterGain);
            masterGain.connect(audioContext.destination);

            oscillatorA.start(burstStart);
            oscillatorB.start(burstStart);
            oscillatorA.stop(burstStart + 0.26);
            oscillatorB.stop(burstStart + 0.26);
        };

        playWhistleBurst(startAt);
        playWhistleBurst(startAt + 0.32);

        window.setTimeout(resolve, 720);
    });
}

function playMessageAlertTone() {
    const audioContext = getOrderBellAudioContext();
    if (!audioContext) {
        return Promise.resolve();
    }

    if (audioContext.state === 'suspended') {
        return audioContext.resume()
            .catch(() => undefined)
            .then(() => playMessageAlertTone());
    }

    return new Promise((resolve) => {
        const startAt = audioContext.currentTime + 0.02;
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(1180, startAt);
        oscillator.frequency.linearRampToValueAtTime(1380, startAt + 0.07);
        oscillator.frequency.linearRampToValueAtTime(980, startAt + 0.18);

        gainNode.gain.setValueAtTime(0.0001, startAt);
        gainNode.gain.exponentialRampToValueAtTime(0.16, startAt + 0.03);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.22);

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.start(startAt);
        oscillator.stop(startAt + 0.24);

        window.setTimeout(resolve, 260);
    });
}

function getCurrentAdminIdentity() {
    const currentUser = firebaseAuth?.currentUser;
    if (currentUser?.email) {
        return String(currentUser.email).trim();
    }

    const rawInput = String(authUsernameInput?.value || '').trim();
    return rawInput || 'admin';
}

function speakOrderAnnouncement(customerName) {
    if (!('speechSynthesis' in window) || typeof window.SpeechSynthesisUtterance !== 'function') {
        return;
    }

    const utterance = new window.SpeechSynthesisUtterance(`Nuevo pedido de ${getSafeCustomerAnnouncementName(customerName)}`);
    utterance.lang = 'es-CO';
    utterance.rate = 0.96;
    utterance.pitch = 1;
    utterance.volume = 1;

    orderAnnouncementQueue = orderAnnouncementQueue
        .catch(() => undefined)
        .then(() => playOrderBell())
        .then(() => new Promise((resolve) => {
            utterance.onend = () => resolve();
            utterance.onerror = () => resolve();
            window.speechSynthesis.speak(utterance);
        }));
}

function announceNewOrders(orders) {
    const currentOrderIds = new Set(orders.map((order) => order.id));

    if (!hasLoadedOrdersOnce) {
        knownOrderIds = currentOrderIds;
        hasLoadedOrdersOnce = true;
        updateOrdersAttentionState();
        return;
    }

    const newOrders = orders.filter((order) => !knownOrderIds.has(order.id));
    knownOrderIds = currentOrderIds;
    updateOrdersAttentionState();

    if (!newOrders.length) {
        return;
    }

    if (isMobileAdminViewport()) {
        activeMobileOrdersLane = 'unread';
    }

    newOrders
        .slice()
        .reverse()
        .forEach((order) => {
            speakOrderAnnouncement(order.customerName);
            notifyNewOrder(order);
            showNotice(`Nuevo pedido de ${order.customerName || 'cliente'}.`, 'ok');
        });
}

function getUnreadOrders() {
    return ordersState.filter((order) => order.status === 'pendiente');
}

function updateAdminDocumentTitle(unreadCount = getUnreadOrders().length) {
    if (unreadCount <= 0) {
        if (adminTitleBlinkTimer) {
            window.clearInterval(adminTitleBlinkTimer);
            adminTitleBlinkTimer = null;
        }
        adminTitleBlinkState = false;
        document.title = adminBaseTitle;
        return;
    }

    if (!adminTitleBlinkTimer) {
        adminTitleBlinkTimer = window.setInterval(() => {
            const currentUnreadCount = getUnreadOrders().length;
            const currentUnreadLabel = currentUnreadCount > 99 ? '99+' : String(currentUnreadCount);

            if (currentUnreadCount <= 0) {
                updateAdminDocumentTitle(0);
                return;
            }

            adminTitleBlinkState = !adminTitleBlinkState;
            document.title = adminTitleBlinkState
                ? `(${currentUnreadLabel}) NUEVO PEDIDO`
                : adminBaseTitle;
        }, 900);
    }

    const unreadLabel = unreadCount > 99 ? '99+' : String(unreadCount);
    document.title = `(${unreadLabel}) NUEVO PEDIDO`;
}

function updateOrdersAttentionState() {
    const ordersTabButton = document.querySelector('.admin-accordion-trigger[data-accordion-target="pedidos"]');
    const unreadCount = getUnreadOrders().length;

    if (ordersTabButton instanceof HTMLButtonElement) {
        ordersTabButton.classList.toggle('has-unread', unreadCount > 0);
        ordersTabButton.classList.toggle('is-blinking', unreadCount > 0);
        ordersTabButton.dataset.unreadCount = unreadCount > 99 ? '99+' : String(unreadCount || '');

        if (unreadCount <= 0) {
            ordersTabButton.removeAttribute('data-unread-count');
        }
    }

    updateAdminDocumentTitle(unreadCount);
}

function notifyNewOrder(order) {
    if (!order || typeof Notification === 'undefined' || Notification.permission !== 'granted') {
        return;
    }

    const notification = new Notification('Nuevo pedido en ROAL BURGER', {
        body: `${order.customerName || 'Cliente'} | ${getOrderTypeLabel(order)} | ${formatMoney(getOrderDisplayTotal(order))}`,
        icon: 'isotipo.png',
        badge: 'isotipo.png',
        tag: `roal-order-${order.id}`,
        renotify: true,
        requireInteraction: true
    });

    notification.onclick = () => {
        window.focus();
        const ordersTabButton = document.querySelector('.admin-accordion-trigger[data-accordion-target="pedidos"]');
        ordersTabButton?.click();
        selectedOrderId = order.id;
        renderOrders();
        notification.close();
    };
}

function getUnreadMessages() {
    return messagesState.filter((message) => !message.readAt);
}

function updateMessagesAttentionState() {
    const messagesTabButton = document.querySelector('.admin-accordion-trigger[data-accordion-target="mensajes"]');
    if (!(messagesTabButton instanceof HTMLButtonElement)) {
        return;
    }

    const unreadCount = getUnreadMessages().length;
    messagesTabButton.classList.toggle('has-unread', unreadCount > 0);
    messagesTabButton.classList.toggle('is-blinking', unreadCount > 0 && activeAccordionSection !== 'mensajes');
    messagesTabButton.dataset.unreadCount = unreadCount > 99 ? '99+' : String(unreadCount || '');

    if (unreadCount <= 0) {
        messagesTabButton.removeAttribute('data-unread-count');
    }
}

function notifyNewMessage(message) {
    if (!message || typeof Notification === 'undefined' || Notification.permission !== 'granted') {
        return;
    }

    const notification = new Notification('Nuevo mensaje en ROAL BURGER Admin', {
        body: `${message.customerName}: ${message.subject}`,
        tag: `roal-message-${message.id}`,
        renotify: true
    });

    notification.onclick = () => {
        window.focus();
        const messagesTabButton = document.querySelector('.admin-accordion-trigger[data-accordion-target="mensajes"]');
        messagesTabButton?.click();
        notification.close();
    };
}

function announceNewMessages(messages) {
    const currentMessageIds = new Set(messages.map((message) => message.id));

    if (!hasLoadedMessagesOnce) {
        knownMessageIds = currentMessageIds;
        hasLoadedMessagesOnce = true;
        updateMessagesAttentionState();
        return;
    }

    const newMessages = messages.filter((message) => !knownMessageIds.has(message.id));
    knownMessageIds = currentMessageIds;
    updateMessagesAttentionState();

    if (!newMessages.length) {
        return;
    }

    newMessages
        .slice()
        .reverse()
        .forEach((message) => {
            playMessageAlertTone();
            notifyNewMessage(message);
            showNotice(`Nuevo mensaje de ${message.customerName}.`, 'ok');
        });
}

function requestAdminNotificationPermission() {
    if (typeof Notification === 'undefined' || Notification.permission !== 'default') {
        return;
    }

    Notification.requestPermission().catch(() => undefined);
}

function markMessagesAsRead() {
    if (!firebaseDb) {
        return;
    }

    const unreadMessages = getUnreadMessages();
    if (!unreadMessages.length) {
        updateMessagesAttentionState();
        return;
    }

    const adminIdentity = getCurrentAdminIdentity();

    unreadMessages.forEach((message) => {
        firebaseDb.collection(MESSAGES_COLLECTION).doc(message.id).set({
            readAt: firestoreNow(),
            readBy: adminIdentity,
            updatedAt: firestoreNow()
        }, { merge: true }).catch(() => undefined);
    });

    messagesState = messagesState.map((message) => (
        unreadMessages.some((entry) => entry.id === message.id)
            ? { ...message, readAt: new Date(), readBy: adminIdentity }
            : message
    ));
    updateMessagesAttentionState();
}

function setupAccordion() {
    const nav = document.getElementById('adminAccordionNav');
    if (!nav) {
        return;
    }

    const buttons = Array.from(nav.querySelectorAll('.admin-accordion-trigger'));
    const panels = Array.from(document.querySelectorAll('.admin-tab-panel'));
    const groupMap = {
        menu: ['menu'],
        diseno: ['configuracion', 'botones'],
        pedidos: ['pedidos'],
        'resumen-ventas': ['resumen-ventas'],
        libro: ['libro'],
        clientes: ['clientes'],
        mensajes: ['mensajes'],
        metricas: ['metricas']
    };

    function activateAccordion(target) {
        activeAccordionSection = target;
        const visiblePanels = groupMap[target] || [];
        buttons.forEach((button) => {
            button.classList.toggle('active', button.dataset.accordionTarget === target);
        });

        panels.forEach((panel) => {
            panel.classList.toggle('active', visiblePanels.includes(panel.dataset.tabPanel));
        });

        if (target === 'mensajes') {
            markMessagesAsRead();
        } else {
            updateMessagesAttentionState();
        }
    }

    buttons.forEach((button) => {
        button.addEventListener('click', () => activateAccordion(button.dataset.accordionTarget));
    });

    activateAccordion('categorias');
}

function setupAdvancedSettingsPanel() {
    if (!advancedSettingsToggle || !advancedSettingsPanel) {
        return;
    }

    advancedSettingsToggle.addEventListener('click', () => {
        const collapsed = advancedSettingsPanel.classList.toggle('collapsed');
        advancedSettingsToggle.setAttribute('aria-expanded', String(!collapsed));
    });
}

function setupPreviewViewportControls() {
    if (!previewViewportControls || !previewViewportWrap) {
        return;
    }

    previewViewportControls.addEventListener('click', (event) => {
        const target = event.target;
        if (!(target instanceof HTMLButtonElement)) {
            return;
        }

        const mode = String(target.dataset.previewSize || '').trim().toLowerCase();
        if (!mode) {
            return;
        }

        previewViewportWrap.classList.remove('mobile', 'tablet', 'desktop');
        previewViewportWrap.classList.add(mode);

        Array.from(previewViewportControls.querySelectorAll('.viewport-btn')).forEach((button) => {
            button.classList.toggle('active', button === target);
        });
    });
}

function setupCardCollapse() {
    const buttons = document.querySelectorAll('.card-collapse-btn');
    const alwaysExpandedTargets = new Set(
        Array.from(buttons)
            .map((button) => String(button.dataset.collapseTarget || '').trim())
            .filter(Boolean)
    );

    // Start with all panels collapsed so users explicitly expand what they need.
    buttons.forEach((button) => {
        const targetId = button.dataset.collapseTarget;
        if (!targetId) {
            return;
        }

        const body = document.getElementById(targetId);
        if (!body) {
            return;
        }

        if (alwaysExpandedTargets.has(targetId)) {
            body.classList.remove('collapsed');
            button.textContent = 'Siempre visible';
            button.setAttribute('aria-expanded', 'true');
            button.hidden = true;
            return;
        }

        body.classList.add('collapsed');
        button.textContent = 'Desplegar';
        button.setAttribute('aria-expanded', 'false');
    });

    buttons.forEach((button) => {
        button.addEventListener('click', () => {
            const targetId = button.dataset.collapseTarget;
            if (!targetId) {
                return;
            }

            if (alwaysExpandedTargets.has(targetId)) {
                return;
            }

            const body = document.getElementById(targetId);
            if (!body) {
                return;
            }

            body.classList.toggle('collapsed');
            const expanded = !body.classList.contains('collapsed');
            button.textContent = expanded ? 'Retraer' : 'Desplegar';
            button.setAttribute('aria-expanded', String(expanded));
        });
    });
}

function setupSectionSaveButtons() {
    document.addEventListener('click', async (event) => {
        const target = event.target;
        if (!(target instanceof HTMLButtonElement)) {
            return;
        }

        const section = String(target.dataset.sectionSave || '').trim().toLowerCase();
        if (!section) {
            return;
        }

        if (section === 'categorias' && categoryForm) {
            categoryForm.requestSubmit();
            return;
        }

        if (section === 'configuracion' && brandingForm) {
            brandingForm.requestSubmit();
            return;
        }

        if (section === 'botones' && buttonConfigForm) {
            buttonConfigForm.requestSubmit();
            return;
        }

        if (section === 'metricas') {
            await reloadDataAndRender();
            showNotice('Metricas actualizadas.', 'ok');
            return;
        }

        if (section === 'pedidos') {
            await reloadDataAndRender();
            showNotice('Pedidos actualizados.', 'ok');
            return;
        }

        if (section === 'resumen-ventas') {
            await reloadDataAndRender();
            showNotice('Resumen de ventas actualizado.', 'ok');
            return;
        }

        if (section === 'libro') {
            await reloadDataAndRender();
            showNotice('Libro contable actualizado.', 'ok');
        }
    });
}

async function ensureAdminAuth() {
    if (!firebaseAuth) {
        throw new Error('Firebase Auth no esta disponible en este panel.');
    }

    document.body.classList.add('admin-locked');
    document.body.classList.remove('admin-unlocked');

    if (authError) {
        authError.classList.remove('show');
        authError.textContent = '';
    }

    if (firebaseAuth.currentUser) {
        document.body.classList.remove('admin-locked');
        document.body.classList.add('admin-unlocked');
        return firebaseAuth.currentUser;
    }

    if (authUsernameInput) {
        authUsernameInput.focus();
    }

    await new Promise((resolve, reject) => {
        if (!adminAuthForm) {
            reject(new Error('No se encontro el formulario de autenticacion.'));
            return;
        }

        let settled = false;

        const mapAuthError = (error) => {
            switch (error?.code) {
                case 'auth/invalid-email':
                    return 'El correo no tiene un formato valido.';
                case 'auth/invalid-credential':
                case 'auth/wrong-password':
                case 'auth/user-not-found':
                    return 'Credenciales incorrectas o cuenta no registrada en Firebase Auth.';
                case 'auth/too-many-requests':
                    return 'Demasiados intentos. Espera un momento antes de reintentar.';
                case 'auth/network-request-failed':
                    return 'No se pudo conectar con Firebase. Revisa tu conexion.';
                case 'auth/configuration-not-found':
                case 'auth/operation-not-allowed':
                    return 'Firebase Auth no tiene habilitado el acceso por correo y contrasena para este proyecto.';
                default:
                    return error?.message || 'No se pudo iniciar sesion en Firebase Auth.';
            }
        };

        const showAuthFailure = (message) => {
            if (authError) {
                authError.textContent = message;
                authError.classList.add('show');
            }

            if (authPasswordInput) {
                authPasswordInput.focus();
                authPasswordInput.select();
            }
        };

        const finishUnlock = (user) => {
            if (settled) {
                return;
            }

            settled = true;

            if (authError) {
                authError.classList.remove('show');
                authError.textContent = '';
            }

            document.body.classList.remove('admin-locked');
            document.body.classList.add('admin-unlocked');

            if (window.history && typeof window.history.replaceState === 'function') {
                window.history.replaceState({}, document.title, window.location.pathname);
            }

            adminAuthForm.removeEventListener('submit', onSubmit);
            unsubscribe();
            resolve(user);
        };

        const unsubscribe = firebaseAuth.onAuthStateChanged((user) => {
            if (user) {
                finishUnlock(user);
            }
        }, (error) => {
            if (settled) {
                return;
            }

            settled = true;
            adminAuthForm.removeEventListener('submit', onSubmit);
            reject(error);
        });

        const onSubmit = async (event) => {
            event.preventDefault();

            const username = String(authUsernameInput?.value || '').trim();
            const password = String(authPasswordInput?.value || '');

            if (!username || !password) {
                showAuthFailure('Ingresa el correo y la contrasena de tu cuenta admin en Firebase Auth.');
                return;
            }

            try {
                const persistence = authRememberDeviceInput && authRememberDeviceInput.checked
                    ? firebase.auth.Auth.Persistence.LOCAL
                    : firebase.auth.Auth.Persistence.SESSION;

                await firebaseAuth.setPersistence(persistence);
                await firebaseAuth.signInWithEmailAndPassword(username, password);
            } catch (error) {
                showAuthFailure(mapAuthError(error));
            }
        };

        adminAuthForm.addEventListener('submit', onSubmit);
    });
}

if (authPasswordToggle && authPasswordInput) {
    authPasswordToggle.addEventListener('click', () => {
        const isHidden = authPasswordInput.type === 'password';
        authPasswordInput.type = isHidden ? 'text' : 'password';
        authPasswordToggle.textContent = isHidden ? 'Ocultar' : 'Mostrar';
        authPasswordToggle.setAttribute('aria-pressed', String(isHidden));
    });
}

function normalizeProduct(raw) {
    const estado = raw.estado || (raw.paused ? 'paused' : 'active');
    return {
        id: raw.id,
        nombre: raw.nombre || raw.name || 'Producto',
        precio: Number(raw.precio ?? raw.price ?? 0),
        categoria: raw.categoria || raw.category || '',
        estado: estado === 'paused' ? 'paused' : 'active',
        es_destacado: raw.es_destacado === true || raw.featured === true,
        image_url: raw.image_url || 'logo.png',
        created_at: raw.created_at,
        updated_at: raw.updated_at
    };
}

function normalizeCategory(raw) {
    return {
        id: String(raw.id || '').trim(),
        name: String(raw.name || raw.nombre || '').trim(),
        image_url: String(raw.image_url || '').trim(),
        active: raw.active !== false,
        created_at: raw.created_at || null,
        updated_at: raw.updated_at || null
    };
}

function normalizeButton(raw) {
    return {
        id: String(raw.id || '').trim(),
        label: String(raw.label || 'Boton').trim(),
        icon: String(raw.icon || '🔗').trim(),
        actionType: raw.actionType === 'menu-modal' ? 'menu-modal' : 'external',
        link: String(raw.link || '').trim(),
        buttonType: ['neon', 'solid', 'glass', 'minimal'].includes(raw.buttonType) ? raw.buttonType : 'neon',
        color: String(raw.color || '#ff6000'),
        size: ['sm', 'md', 'lg', 'xl'].includes(raw.size) ? raw.size : 'md',
        soundEnabled: raw.soundEnabled !== false,
        volume: Number.isFinite(Number(raw.volume)) ? Math.max(0, Math.min(1, Number(raw.volume))) : 0.1,
        estado: raw.estado === 'paused' ? 'paused' : 'active',
        visible: raw.visible !== false,
        order: Number.isFinite(Number(raw.order)) ? Number(raw.order) : 99,
        updated_at: raw.updated_at || null
    };
}

function normalizeBranding(raw) {
    const templateName = BRAND_TEMPLATES[raw.template] ? raw.template : defaultBranding.template;
    const templateConfig = BRAND_TEMPLATES[templateName] || BRAND_TEMPLATES.fodexa;
    const normalizedFontSize = Number(raw.fontSizeBase);
    const normalizedInteraction = Number(raw.interactionVolume);
    const normalizedSpeed = Number(raw.animationSpeed);

    return {
        restaurantName: String(raw.restaurantName || defaultBranding.restaurantName),
        slogan: String(raw.slogan || defaultBranding.slogan),
        logoUrl: String(raw.logoUrl || defaultBranding.logoUrl),
        whatsappNumber: String(raw.whatsappNumber || defaultBranding.whatsappNumber),
        whatsappLink: String(raw.whatsappLink || defaultBranding.whatsappLink),
        businessHours: String(raw.businessHours || defaultBranding.businessHours),
        address: String(raw.address || defaultBranding.address),
        locationLink: String(raw.locationLink || defaultBranding.locationLink),
        instagramLink: String(raw.instagramLink || defaultBranding.instagramLink),
        tiktokLink: String(raw.tiktokLink || defaultBranding.tiktokLink),
        facebookLink: String(raw.facebookLink || defaultBranding.facebookLink),
        primaryColor: String(raw.primaryColor || templateConfig.primaryColor || defaultBranding.primaryColor),
        secondaryColor: String(raw.secondaryColor || templateConfig.secondaryColor || defaultBranding.secondaryColor),
        accentColor: String(raw.accentColor || templateConfig.accentColor || defaultBranding.accentColor),
        template: templateName,
        bgColor: String(raw.bgColor || templateConfig.bgColor || defaultBranding.bgColor),
        buttonBorderColor: String(raw.buttonBorderColor || templateConfig.buttonBorderColor || defaultBranding.buttonBorderColor),
        fontFamily: String(raw.fontFamily || defaultBranding.fontFamily),
        fontSizeBase: Number.isFinite(normalizedFontSize) ? Math.max(14, Math.min(22, normalizedFontSize)) : defaultBranding.fontSizeBase,
        interactionVolume: Number.isFinite(normalizedInteraction) ? Math.max(0, Math.min(1, normalizedInteraction)) : defaultBranding.interactionVolume,
        animationSpeed: Number.isFinite(normalizedSpeed) ? Math.max(0.6, Math.min(1.8, normalizedSpeed)) : defaultBranding.animationSpeed,
        updated_at: raw.updated_at || null
    };
}

function normalizeOrderItem(raw, index = 0) {
    return {
        index: Number(raw.index || index + 1),
        itemKey: String(raw.itemKey || `item-${index + 1}`),
        productName: String(raw.productName || raw.nombre || 'Producto').trim(),
        categoryName: String(raw.categoryName || raw.categoria || '').trim(),
        quantity: Number(raw.quantity || 0),
        unitPrice: Number(raw.unitPrice ?? raw.precio ?? 0),
        subtotal: Number(raw.subtotal ?? ((Number(raw.quantity || 0)) * Number(raw.unitPrice ?? raw.precio ?? 0))),
        optionLabel: String(raw.optionLabel || '').trim(),
        note: String(raw.note || raw.comment || '').trim()
    };
}

function normalizeOrder(raw) {
    const items = Array.isArray(raw.items) ? raw.items.map((item, index) => normalizeOrderItem(item, index)) : [];
    const subtotal = Number(raw.subtotal ?? 0);
    const parsedDeliveryFee = raw.deliveryFee === null || raw.deliveryFee === undefined || raw.deliveryFee === ''
        ? null
        : Number(raw.deliveryFee);
    const deliveryFee = Number.isFinite(parsedDeliveryFee) ? Math.max(0, parsedDeliveryFee) : null;
    const rawTotal = raw.total === null || raw.total === undefined || raw.total === '' ? null : Number(raw.total);
    const total = Number.isFinite(rawTotal) ? rawTotal : (deliveryFee !== null ? subtotal + deliveryFee : null);
    const rawStatus = String(raw.status || '').trim().toLowerCase();
    let status = 'pendiente';
    if (rawStatus === 'esperando_domiciliario' || rawStatus === 'esperando domiciliario') {
        status = 'esperando_domiciliario';
    } else if (rawStatus === 'listo_recoger' || rawStatus === 'pedido_listo' || rawStatus === 'pedido listo' || rawStatus === 'listo para recoger') {
        status = 'listo_recoger';
    } else if (rawStatus === 'preparacion' || rawStatus === 'confirmado' || rawStatus === 'cocina' || rawStatus === 'en_cocina') {
        status = 'preparacion';
    } else if (rawStatus === 'camino' || rawStatus === 'en_camino') {
        status = 'camino';
    } else if (rawStatus === 'entregado' || rawStatus === 'cancelado') {
        status = 'entregado';
    }

    const rawOrderType = String(raw.orderType || raw.tipo || '').trim().toLowerCase();
    const address = String(raw.deliveryAddress || '').trim();
    const isTakeaway = ['retiro', 'llevar', 'local', 'recoger', 'pickup', 'takeaway'].some((value) => rawOrderType.includes(value));
    const isDelivery = ['domicilio', 'delivery', 'entrega', 'casa', 'home'].some((value) => rawOrderType.includes(value));
    const orderType = isTakeaway
        ? 'retiro'
        : (isDelivery || address ? 'domicilio' : 'retiro');

    return {
        id: String(raw.id || '').trim(),
        code: String(raw.code || `RB-${String(raw.id || '').slice(-6).toUpperCase()}`).trim(),
        customerName: String(raw.customerName || '').trim(),
        customerPhone: String(raw.customerPhone || '').trim(),
        customerPhoneDigits: String(raw.customerPhoneDigits || '').trim(),
        customerAddress: String(raw.customerAddress || '').trim(),
        profileAddress: String(raw.profileAddress || '').trim(),
        paymentMethod: String(raw.paymentMethod || '').trim().toLowerCase(),
        cashChangeRequired: raw.cashChangeRequired === true,
        cashTenderAmount: Number.isFinite(Number(raw.cashTenderAmount)) ? Number(raw.cashTenderAmount) : null,
        deliveryAddress: address,
        items,
        itemCount: Number(raw.itemCount || items.length),
        totalItems: Number(raw.totalItems || items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)),
        subtotal,
        deliveryFee,
        total,
        currency: String(raw.currency || 'COP'),
        source: String(raw.source || 'web').trim(),
        orderType,
        status,
        summaryMessage: String(raw.summaryMessage || '').trim(),
        courierRequestedAt: raw.courierRequestedAt || raw.courier_requested_at || null,
        readyForPickupAt: raw.readyForPickupAt || raw.ready_for_pickup_at || null,
        deliveredAt: raw.deliveredAt || raw.delivered_at || null,
        createdAt: raw.createdAt || raw.created_at || null,
        updatedAt: raw.updatedAt || raw.updated_at || null
    };
}

function normalizeSalesBreakdownEntry(raw = {}) {
    return {
        name: String(raw.name || raw.categoryName || raw.productName || 'Sin nombre').trim() || 'Sin nombre',
        categoryName: String(raw.categoryName || raw.category || '').trim(),
        amount: Number(raw.amount || 0),
        quantity: Number(raw.quantity || 0),
        orderCount: Number(raw.orderCount || raw.orders || 0)
    };
}

function normalizeSalesSummary(raw) {
    return {
        id: String(raw.id || '').trim(),
        openedAt: raw.openedAt || raw.createdAt || null,
        closedAt: raw.closedAt || raw.updatedAt || null,
        totalSales: Number(raw.totalSales || 0),
        totalOrders: Number(raw.totalOrders || 0),
        totalItems: Number(raw.totalItems || 0),
        takeawaySales: Number(raw.takeawaySales || 0),
        deliverySales: Number(raw.deliverySales || 0),
        categories: Array.isArray(raw.categories) ? raw.categories.map((entry) => normalizeSalesBreakdownEntry(entry)) : [],
        products: Array.isArray(raw.products) ? raw.products.map((entry) => normalizeSalesBreakdownEntry(entry)) : [],
        orders: Array.isArray(raw.orders) ? raw.orders : []
    };
}

function normalizeSalesDayState(raw) {
    return {
        openedAt: raw.openedAt || raw.updatedAt || null,
        lastClosedAt: raw.lastClosedAt || null,
        lastClosureId: String(raw.lastClosureId || '').trim(),
        status: 'active'
    };
}

function ensureOrdersRealtimeTicker() {
    if (ordersRealtimeTimer || !ordersBoard) {
        return;
    }

    ordersRealtimeTimer = window.setInterval(() => {
        if (!ordersState.some((order) => order.status === 'esperando_domiciliario' || order.status === 'entregado')) {
            return;
        }

        renderOrders();
    }, 1000);
}

function isOrderSequenceMeta(raw) {
    return String(raw.metaType || '').trim().toLowerCase() === 'order_sequence';
}

async function fetchCategories() {
    const snapshot = await firebaseDb.collection('categorias').get();
    categoriesState = snapshot.docs
        .map((doc) => normalizeCategory({ id: doc.id, ...doc.data() }))
        .sort((a, b) => String(a.name).localeCompare(String(b.name), 'es'));
}

async function fetchProducts() {
    const snapshot = await firebaseDb.collection('productos').get();
    productsState = snapshot.docs
        .map((doc) => normalizeProduct({ id: doc.id, ...doc.data() }))
        .sort((a, b) => {
            const aTs = a.created_at && typeof a.created_at.toMillis === 'function' ? a.created_at.toMillis() : 0;
            const bTs = b.created_at && typeof b.created_at.toMillis === 'function' ? b.created_at.toMillis() : 0;
            return aTs - bTs;
        });
}

async function fetchButtons() {
    const snapshot = await firebaseDb.collection('botones').get();
    buttonsState = snapshot.docs
        .map((doc) => normalizeButton({ id: doc.id, ...doc.data() }))
        .sort((a, b) => a.order - b.order);
}

async function fetchBranding() {
    const doc = await firebaseDb.collection(CONFIG_COLLECTION).doc(CONFIG_DOC_ID).get();
    if (!doc.exists) {
        brandingState = { ...defaultBranding };
        return;
    }

    brandingState = normalizeBranding(doc.data());
}

async function fetchOrders() {
    const snapshot = await firebaseDb.collection(ORDERS_COLLECTION).get();
    ordersState = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((raw) => !isOrderSequenceMeta(raw))
        .map((raw) => normalizeOrder(raw))
        .sort((a, b) => {
            const aTs = a.createdAt && typeof a.createdAt.toMillis === 'function' ? a.createdAt.toMillis() : 0;
            const bTs = b.createdAt && typeof b.createdAt.toMillis === 'function' ? b.createdAt.toMillis() : 0;
            return bTs - aTs;
        });
}

async function fetchSalesSummaries() {
    const snapshot = await firebaseDb.collection(SALES_SUMMARY_COLLECTION).get();
    salesSummariesState = snapshot.docs
        .map((doc) => normalizeSalesSummary({ id: doc.id, ...doc.data() }))
        .sort((a, b) => {
            const tsOf = (v) => v && typeof v.toMillis === 'function' ? v.toMillis() : (Number.isFinite(Number(v)) ? Number(v) : 0);
            return tsOf(b.closedAt) - tsOf(a.closedAt);
        });
}

async function fetchSalesDayState() {
    const doc = await firebaseDb.collection(SALES_DAY_STATE_COLLECTION).doc(SALES_DAY_STATE_DOC_ID).get();
    salesDayState = doc.exists ? normalizeSalesDayState(doc.data()) : null;
}

async function fetchClients() {
    const snapshot = await firebaseDb.collection(CLIENTS_COLLECTION).get();
    clientsState = snapshot.docs
        .map((doc) => ({
            id: doc.id,
            ...doc.data()
        }))
        .map((raw) => {
            const savedAddresses = normalizeClientSavedAddresses(raw.savedAddresses || raw.addresses || [], raw.address || raw.deliveryAddress || '');
            return {
                id: String(raw.id || '').trim(),
                customerName: String(raw.customerName || '').trim() || 'Cliente sin nombre',
                customerPhone: String(raw.customerPhone || '').trim() || 'No registrado',
                customerPhoneDigits: String(raw.customerPhoneDigits || '').trim(),
                address: savedAddresses[0] || String(raw.address || '').trim() || 'Sin direccion registrada',
                savedAddresses,
                firstOrderAt: raw.firstOrderAt || raw.createdAt || null,
                lastOrderCode: String(raw.lastOrderCode || '').trim(),
                lastOrderId: String(raw.lastOrderId || '').trim(),
                lastOrderTotal: Number(raw.lastOrderTotal || 0),
                totalOrders: Number(raw.totalOrders || 0),
                totalSpent: Number(raw.totalSpent || 0),
                lastOrderAt: raw.lastOrderAt || raw.updatedAt || raw.createdAt || null,
                createdAt: raw.createdAt || null,
                updatedAt: raw.updatedAt || null
            };
        })
        .sort((a, b) => {
            const aTs = a.lastOrderAt && typeof a.lastOrderAt.toMillis === 'function' ? a.lastOrderAt.toMillis() : 0;
            const bTs = b.lastOrderAt && typeof b.lastOrderAt.toMillis === 'function' ? b.lastOrderAt.toMillis() : 0;
            return bTs - aTs;
        });
}

/* ═══════════════════════════════════════════════════════════
   ACOMPAÑAMIENTOS — Config Firestore
   ═══════════════════════════════════════════════════════════ */

const DEFAULT_UPGRADES_CONFIG = {
    activo: true,
    categorias_aplica: ['BURGER CLASICAS', 'BURGER PREMIUM', 'PEPITOS VENEZOLANOS', 'PERROS CALIENTES', 'SALCHIPAPAS'],
    opciones: [
        { id: 'combo', nombre: 'Combo', detalle: 'Papas a la Francesa + Bebida', precio: 5000, activo: true, orden: 1, incluye_bebida: true },
        { id: 'papas', nombre: 'Papas a la Francesa', detalle: '', precio: 3000, activo: true, orden: 2, incluye_bebida: false },
        { id: 'bebida', nombre: 'Bebida', detalle: '', precio: 2000, activo: true, orden: 3, incluye_bebida: true }
    ],
    sabores_bebida: ['Coca-Cola', 'Pepsi', 'Jugo Natural', 'Agua', 'Sin bebida']
};

async function fetchMenuUpgradesConfig() {
    try {
        const doc = await firebaseDb.collection(CONFIG_COLLECTION).doc(UPGRADES_CONFIG_DOC_ID).get();
        menuUpgradesConfig = doc.exists
            ? { ...DEFAULT_UPGRADES_CONFIG, ...doc.data() }
            : { ...DEFAULT_UPGRADES_CONFIG };
    } catch (_e) {
        menuUpgradesConfig = { ...DEFAULT_UPGRADES_CONFIG };
    }
}

async function saveMenuUpgradesConfig(config) {
    await firebaseDb.collection(CONFIG_COLLECTION).doc(UPGRADES_CONFIG_DOC_ID).set(config);
    menuUpgradesConfig = config;
}

function renderMenuUpgradesAdmin() {
    const cfg = menuUpgradesConfig || DEFAULT_UPGRADES_CONFIG;

    const activeChk = document.getElementById('upgradesActive');
    if (activeChk) activeChk.checked = !!cfg.activo;

    // Categorías
    const catList = document.getElementById('upgradeCategoriesList');
    if (catList) {
        catList.innerHTML = (cfg.categorias_aplica || []).map((cat) => `
            <span class="upgrade-category-chip">
                ${escapeHtml(cat)}
                <button type="button" class="upgrade-category-remove" data-category="${escapeHtml(cat)}" aria-label="Quitar">&#215;</button>
            </span>`).join('') +
            '<button type="button" class="ghost-button" id="addUpgradeCategoryBtn" style="font-size:0.78rem;padding:4px 10px;">+ Categoría</button>';

        catList.querySelectorAll('.upgrade-category-remove').forEach((btn) => {
            btn.addEventListener('click', () => {
                menuUpgradesConfig.categorias_aplica = (menuUpgradesConfig.categorias_aplica || [])
                    .filter((c) => c !== btn.dataset.category);
                renderMenuUpgradesAdmin();
            });
        });
        catList.querySelector('#addUpgradeCategoryBtn')?.addEventListener('click', () => {
            const name = prompt('Nombre exacto de la categoría del catálogo (ej: BURGER PREMIUM)');
            if (name && name.trim()) {
                if (!menuUpgradesConfig) menuUpgradesConfig = { ...DEFAULT_UPGRADES_CONFIG };
                menuUpgradesConfig.categorias_aplica = [
                    ...(menuUpgradesConfig.categorias_aplica || []),
                    name.trim().toUpperCase()
                ];
                renderMenuUpgradesAdmin();
            }
        });
    }

    // Opciones
    const optsList = document.getElementById('upgradeOptionsList');
    if (optsList) {
        const opts = (cfg.opciones || []).sort((a, b) => (a.orden || 99) - (b.orden || 99));
        optsList.innerHTML = opts.map((opt, i) => `
            <div class="upgrade-option-row" data-idx="${i}">
                <div class="upgrade-opt-toggle">
                    <input type="checkbox" class="upgrade-opt-active" ${opt.activo ? 'checked' : ''} data-idx="${i}" title="Activo">
                </div>
                <div class="upgrade-opt-details">
                    <input type="text" class="admin-input upgrade-opt-name" value="${escapeHtml(opt.nombre)}" placeholder="Nombre" data-idx="${i}" data-field="nombre">
                    <input type="text" class="admin-input upgrade-opt-detail" value="${escapeHtml(opt.detalle || '')}" placeholder="Detalle (opcional)" data-idx="${i}" data-field="detalle">
                </div>
                <div class="upgrade-opt-price-wrap">
                    <span class="upgrade-opt-price-label">+$</span>
                    <input type="number" class="admin-input" style="width:75px;text-align:right;" value="${Number(opt.precio || 0)}" min="0" step="100" data-idx="${i}" data-field="precio">
                </div>
                <label class="upgrade-opt-bev-label" title="¿Incluye selección de bebida?">
                    <input type="checkbox" ${opt.incluye_bebida ? 'checked' : ''} data-idx="${i}" data-field="incluye_bebida"> Bebida
                </label>
                <button type="button" class="upgrade-opt-delete" data-idx="${i}" title="Eliminar">🗑</button>
            </div>`).join('');

        optsList.querySelectorAll('.upgrade-opt-active').forEach((chk) => {
            chk.addEventListener('change', (e) => {
                const idx = Number(e.target.dataset.idx);
                menuUpgradesConfig.opciones[idx].activo = e.target.checked;
            });
        });
        optsList.querySelectorAll('input[data-field]').forEach((input) => {
            input.addEventListener('input', (e) => {
                const idx = Number(e.target.dataset.idx);
                const field = e.target.dataset.field;
                if (!field || idx == null) return;
                if (field === 'precio') {
                    menuUpgradesConfig.opciones[idx].precio = Number(e.target.value || 0);
                } else if (field === 'incluye_bebida') {
                    menuUpgradesConfig.opciones[idx].incluye_bebida = e.target.checked;
                } else {
                    menuUpgradesConfig.opciones[idx][field] = e.target.value;
                }
            });
        });
        optsList.querySelectorAll('input[type="checkbox"][data-field="incluye_bebida"]').forEach((chk) => {
            chk.addEventListener('change', (e) => {
                const idx = Number(e.target.dataset.idx);
                menuUpgradesConfig.opciones[idx].incluye_bebida = e.target.checked;
            });
        });
        optsList.querySelectorAll('.upgrade-opt-delete').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                const idx = Number(e.target.closest('[data-idx]').dataset.idx);
                menuUpgradesConfig.opciones.splice(idx, 1);
                menuUpgradesConfig.opciones.forEach((o, i) => { o.orden = i + 1; });
                renderMenuUpgradesAdmin();
            });
        });
    }

    // Sabores
    const flavorsList = document.getElementById('upgradeFlavorsListAdmin');
    if (flavorsList) {
        flavorsList.innerHTML = (cfg.sabores_bebida || []).map((f, i) => `
            <span class="upgrade-flavor-chip">
                ${escapeHtml(f)}
                <button type="button" class="upgrade-flavor-remove" data-idx="${i}" aria-label="Quitar">&#215;</button>
            </span>`).join('');
        flavorsList.querySelectorAll('.upgrade-flavor-remove').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                const idx = Number(e.target.dataset.idx);
                menuUpgradesConfig.sabores_bebida.splice(idx, 1);
                renderMenuUpgradesAdmin();
            });
        });
    }
}



function renderPosCategoriesPanel() {
    const select = document.getElementById('posCatSelect');
    if (!select) return;

    const categories = [...new Set(PUBLIC_PRODUCT_CATALOG.map((p) => String(p.categoria || 'Sin categoria').trim()))].sort();

    if (select.dataset.listenerAttached !== 'true') {
        select.addEventListener('change', () => {
            posSelectedCategory = select.value;
            renderPosProductsPanel();
        });
        select.dataset.listenerAttached = 'true';
    }

    select.innerHTML = categories.map((cat) => {
        const count = PUBLIC_PRODUCT_CATALOG.filter(
            (p) => String(p.categoria || '').trim() === cat && String(p.estado || 'active').trim() === 'active'
        ).length;
        return `<option value="${escapeHtml(cat)}">${escapeHtml(cat)} (${count})</option>`;
    }).join('');

    if (posSelectedCategory && categories.includes(posSelectedCategory)) {
        select.value = posSelectedCategory;
    } else if (categories.length > 0) {
        posSelectedCategory = categories[0];
        select.value = categories[0];
    }

    renderPosProductsPanel();
}

function renderPosProductsPanel() {
    const grid = document.getElementById('posProductGridV2');
    if (!grid) return;

    if (!posSelectedCategory) {
        grid.innerHTML = '<p style="color:rgba(255,255,255,0.4);text-align:center;padding:24px;grid-column:1/-1;">Selecciona una categoría</p>';
        return;
    }

    const categoryProducts = PUBLIC_PRODUCT_CATALOG
        .filter((p) => String(p.categoria || '').trim() === posSelectedCategory && String(p.estado || 'active').trim() === 'active')
        .sort((a, b) => String(a.nombre || '').localeCompare(String(b.nombre || ''), 'es'));

    grid.innerHTML = '';

    if (!categoryProducts.length) {
        grid.innerHTML = '<p style="color:rgba(255,255,255,0.4);text-align:center;padding:24px;grid-column:1/-1;">Sin productos disponibles</p>';
        return;
    }

    categoryProducts.forEach((product) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'pos-product-btn';
        btn.innerHTML = `<span class="pos-product-btn-name">${escapeHtml(product.nombre)}</span><span class="pos-product-btn-price">${formatMoney(Number(product.precio || 0))}</span>`;
        btn.addEventListener('click', () => {
            handlePosProductAdd(String(product.id || ''), String(product.nombre || ''), Number(product.precio || 0));
        });
        grid.appendChild(btn);
    });
}

function handlePosProductAdd(productId, productName, productPrice) {
    const selectedCategory = String(posSelectedCategory || '').trim();

    // Combos siguen con su modal propio
    if (isComboCategory(selectedCategory)) {
        openComboBeverageModal(productId, productName, productPrice, selectedCategory);
        return;
    }

    // Verificar si esta categoría activa el upgrade sheet de acompañamientos
    const cfg = menuUpgradesConfig || DEFAULT_UPGRADES_CONFIG;
    const activeOpts = (cfg.opciones || []).filter((o) => o.activo);
    const appliesTo = (cfg.categorias_aplica || []).map((c) => c.toUpperCase());
    if (cfg.activo && activeOpts.length > 0 && appliesTo.includes(selectedCategory.toUpperCase())) {
        openPosUpgradeSheet(productId, productName, productPrice);
        return;
    }

    addProductToPosOrder(productId, productName, productPrice);
}

function isComboCategory(categoryName) {
    return String(categoryName || '').toLowerCase().includes('combo');
}

function getBeverageOptions() {
    return PUBLIC_PRODUCT_CATALOG
        .filter((item) => String(item.categoria || '').trim().toLowerCase().includes('bebidas'))
        .filter((item) => String(item.estado || 'active').trim() === 'active');
}

function openComboBeverageModal(productId, productName, productPrice, categoryName) {
    const beverageOptions = getBeverageOptions();
    let selectedBeverage = null;

    const overlay = document.createElement('div');
    overlay.className = 'combo-modal-overlay';

    const card = document.createElement('div');
    card.className = 'combo-modal-card';

    // Header
    const header = document.createElement('div');
    header.className = 'combo-modal-header';
    const headerText = document.createElement('div');
    headerText.innerHTML = `<h4>${escapeHtml(productName)}</h4><p class="combo-modal-subtitle">${escapeHtml(categoryName || 'Combo')}</p>`;
    const closeX = document.createElement('button');
    closeX.type = 'button';
    closeX.className = 'combo-modal-close-x';
    closeX.setAttribute('aria-label', 'Cerrar');
    closeX.textContent = '×';
    closeX.addEventListener('click', () => overlay.remove());
    header.appendChild(headerText);
    header.appendChild(closeX);

    // Beverages label
    const secLabel = document.createElement('div');
    secLabel.className = 'combo-modal-section-label';
    secLabel.textContent = 'Bebida incluida';

    // Beverage grid
    const bevGrid = document.createElement('div');
    bevGrid.className = 'combo-bev-grid';

    const makeBevCard = (option) => {
        const bevCard = document.createElement('div');
        bevCard.className = 'combo-bev-card';

        if (!option) {
            const noImg = document.createElement('div');
            noImg.className = 'combo-bev-no-img';
            noImg.textContent = '—';
            const label = document.createElement('span');
            label.textContent = 'Sin bebida';
            bevCard.appendChild(noImg);
            bevCard.appendChild(label);
            bevCard.classList.add('selected');
        } else {
            const img = document.createElement('img');
            img.src = option.image_url || 'logo.png';
            img.alt = option.nombre;
            img.loading = 'lazy';
            img.addEventListener('error', () => { img.src = 'logo.png'; });
            const label = document.createElement('span');
            label.textContent = option.nombre;
            bevCard.appendChild(img);
            bevCard.appendChild(label);
        }

        bevCard.addEventListener('click', () => {
            bevGrid.querySelectorAll('.combo-bev-card').forEach((c) => c.classList.remove('selected'));
            bevCard.classList.add('selected');
            selectedBeverage = option;
        });
        return bevCard;
    };

    bevGrid.appendChild(makeBevCard(null));
    beverageOptions.forEach((bev) => bevGrid.appendChild(makeBevCard(bev)));

    // Note field
    const noteRow = document.createElement('div');
    noteRow.className = 'combo-modal-note-row';
    const noteLabel = document.createElement('label');
    noteLabel.className = 'combo-modal-note-label';
    noteLabel.textContent = 'Nota (opcional)';
    const noteInput = document.createElement('input');
    noteInput.type = 'text';
    noteInput.className = 'combo-modal-note-input';
    noteInput.placeholder = 'Ej: sin hielo, con limón...';
    noteRow.appendChild(noteLabel);
    noteRow.appendChild(noteInput);

    // Footer: cancel + confirm
    const footer = document.createElement('div');
    footer.className = 'combo-modal-footer';
    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'combo-modal-cancel-btn';
    cancelBtn.textContent = 'Cancelar';
    cancelBtn.addEventListener('click', () => overlay.remove());

    const confirmBtn = document.createElement('button');
    confirmBtn.type = 'button';
    confirmBtn.className = 'combo-modal-confirm-btn';
    confirmBtn.textContent = 'Agregar al pedido';
    confirmBtn.addEventListener('click', () => {
        const note = noteInput.value.trim();
        const beverageId = selectedBeverage ? String(selectedBeverage.id || selectedBeverage.nombre || '').trim() : 'none';
        const beverageName = selectedBeverage ? selectedBeverage.nombre : null;
        const orderName = beverageName ? `${productName} + ${beverageName}` : productName;
        const itemKey = `${String(productId).trim()}::${beverageId}`;
        addProductToPosOrder(itemKey, orderName, productPrice, note);
        overlay.remove();
    });

    footer.appendChild(cancelBtn);
    footer.appendChild(confirmBtn);

    card.appendChild(header);
    card.appendChild(secLabel);
    card.appendChild(bevGrid);
    card.appendChild(noteRow);
    card.appendChild(footer);
    overlay.appendChild(card);

    overlay.addEventListener('click', (event) => {
        if (event.target === overlay) overlay.remove();
    });

    document.body.appendChild(overlay);
}

function addProductToPosOrder(productId, productName, productPrice, note = '') {
    productId = String(productId || '').trim();
    productName = String(productName || 'Producto').trim();
    productPrice = Number(productPrice || 0);
    note = String(note || '').trim();

    if (!productId) return;

    const category = posSelectedCategory || 'Sin categoria';
    // Items with a note are always added as new entries (not merged)
    const existing = !note && internalOrderItems.find((item) => item.itemKey === productId && !item.note);

    if (existing) {
        existing.quantity = Number(existing.quantity || 0) + 1;
        existing.subtotal = Number(existing.quantity) * existing.unitPrice;
    } else {
        internalOrderItems.push({
            itemKey: note ? `${productId}::${Date.now()}` : productId,
            productId,
            productName,
            categoryName: category,
            quantity: 1,
            unitPrice: productPrice,
            subtotal: productPrice,
            note,
            optionLabel: note || ''
        });
    }

    renderPosOrderItems();
    renderPosTotals();
    renderPosBottomBar();
}

function renderPosBottomBar() {
    const bottomBar = document.getElementById('posBottomBar');
    const qtyElem = document.getElementById('posBottomQty');
    const scrollArea = document.getElementById('posProductsScroll');

    const totalQty = internalOrderItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

    if (bottomBar) bottomBar.hidden = totalQty === 0;
    if (scrollArea) scrollArea.style.paddingBottom = totalQty > 0 ? '64px' : '10px';
    if (qtyElem) qtyElem.textContent = `${totalQty} ${totalQty === 1 ? 'item' : 'items'}`;
}

function renderPosOrderItems() {
    const itemsContainer = document.getElementById('internalOrderItemsSummary');
    if (!itemsContainer) {
        return;
    }

    if (!internalOrderItems.length) {
            itemsContainer.innerHTML = '<div class="kanban-empty">Carrito vacio</div>';
        return;
    }

    itemsContainer.innerHTML = internalOrderItems
        .map((item) => `
            <div class="pos-item-row" data-item-key="${escapeHtml(item.itemKey)}">
                <div class="pos-item-name">
                    ${escapeHtml(item.productName)}
                    ${item.note ? `<span class="pos-item-note">${escapeHtml(item.note)}</span>` : ''}
                </div>
                <div class="pos-item-qty-price">
                    <div class="pos-item-qty">
                        <button type="button" class="pos-qty-minus" data-item-key="${escapeHtml(item.itemKey)}">−</button>
                        <input type="number" class="pos-qty-input" value="${item.quantity}" data-item-key="${escapeHtml(item.itemKey)}" min="1" />
                        <button type="button" class="pos-qty-plus" data-item-key="${escapeHtml(item.itemKey)}">+</button>
                    </div>
                    <div class="pos-item-price">${formatMoney(Number(item.subtotal || 0))}</div>
                    <button type="button" class="pos-item-remove" data-item-key="${escapeHtml(item.itemKey)}">&times;</button>
                </div>
            </div>
        `)
        .join('');

    if (itemsContainer.dataset.listenerAttached !== 'true') {
        itemsContainer.addEventListener('click', (event) => {
            const minusBtn = event.target.closest('.pos-qty-minus');
            const plusBtn = event.target.closest('.pos-qty-plus');
            const removeBtn = event.target.closest('.pos-item-remove');
            const itemKey = (minusBtn || plusBtn || removeBtn)?.dataset.itemKey;
            const item = internalOrderItems.find((i) => i.itemKey === itemKey);

            if (minusBtn && item) {
                if (item.quantity > 1) {
                    item.quantity--;
                    item.subtotal = item.quantity * item.unitPrice;
                } else {
                    internalOrderItems = internalOrderItems.filter((i) => i.itemKey !== itemKey);
                }
                renderPosOrderItems();
                renderPosTotals();
                renderPosBottomBar();
                return;
            }

            if (plusBtn && item) {
                item.quantity++;
                item.subtotal = item.quantity * item.unitPrice;
                renderPosOrderItems();
                renderPosTotals();
                renderPosBottomBar();
                return;
            }

            if (removeBtn && itemKey) {
                internalOrderItems = internalOrderItems.filter((i) => i.itemKey !== itemKey);
                renderPosOrderItems();
                renderPosTotals();
                renderPosBottomBar();
            }
        });

        itemsContainer.addEventListener('change', (event) => {
            const input = event.target.closest('.pos-qty-input');
            if (!input) return;
            const itemKey = input.dataset.itemKey;
            const quantity = Math.max(1, Number(input.value || 1));
            const item = internalOrderItems.find((i) => i.itemKey === itemKey);
            if (item) {
                item.quantity = quantity;
                item.subtotal = quantity * item.unitPrice;
                renderPosOrderItems();
                renderPosTotals();
                renderPosBottomBar();
            }
        });

        itemsContainer.dataset.listenerAttached = 'true';
    }
}

function renderPosTotals() {
    const subtotalElem = document.getElementById('posTotalSubtotal');
    const totalElem = document.getElementById('posTotalFinal');
    const discountInput = document.getElementById('internalOrderDiscount');
    const cobrarAmount = document.getElementById('posCobrarAmount');
    const paymentTotal = document.getElementById('posPaymentTotalDisplay');
    const bottomTotal = document.getElementById('posBottomTotalAmt');
    const drawerTotal = document.getElementById('posDrawerCobrarTotal');

    const subtotal = internalOrderItems.reduce((sum, item) => sum + Number(item.subtotal || 0), 0);
    const discount = Number(discountInput?.value || 0);
    const total = Math.max(0, subtotal - discount);

    if (subtotalElem) subtotalElem.textContent = formatMoney(subtotal);
    if (totalElem) totalElem.textContent = formatMoney(total);
    if (cobrarAmount) cobrarAmount.textContent = formatMoney(total);
    if (paymentTotal) paymentTotal.textContent = formatMoney(total);
    if (bottomTotal) bottomTotal.textContent = formatMoney(total);
    if (drawerTotal) drawerTotal.textContent = formatMoney(total);
}

/* ─── POS v2: Upgrade sheet (acompañamientos) ─── */

function openPosUpgradeSheet(productId, productName, productPrice) {
    _posUpgradePending = { productId, productName, productPrice };
    const overlay = document.getElementById('posUpgradeOverlay');
    if (!overlay) return;
    overlay.hidden = false;
    overlay.style.display = 'flex';
    renderPosUpgradeStep1();
}

function closePosUpgradeSheet() {
    const overlay = document.getElementById('posUpgradeOverlay');
    if (overlay) { overlay.hidden = true; overlay.style.display = 'none'; }
    _posUpgradePending = null;
}

function renderPosUpgradeStep1() {
    const body = document.getElementById('posUpgradeBody');
    const titleEl = document.getElementById('posUpgradeTitle');
    const nameEl = document.getElementById('posUpgradeProductName');
    if (!body || !_posUpgradePending) return;

    if (titleEl) titleEl.textContent = '¿Cómo lo quieres?';
    if (nameEl) nameEl.textContent = _posUpgradePending.productName;

    const cfg = menuUpgradesConfig || DEFAULT_UPGRADES_CONFIG;
    const activeOpts = (cfg.opciones || [])
        .filter((o) => o.activo)
        .sort((a, b) => (a.orden || 99) - (b.orden || 99));

    body.innerHTML = `
        <div class="pos-upgrade-label">Elige cómo acompañar tu pedido</div>
        <div class="pos-upgrade-options">
            <button type="button" class="pos-upgrade-opt no-upgrade" id="posUpgradeSolo">
                <div>
                    <div class="pos-upgrade-opt-name">Solo el producto</div>
                    <div class="pos-upgrade-opt-detail">Sin acompañamiento</div>
                </div>
                <span class="pos-upgrade-opt-price" style="color:var(--admin-muted);font-weight:400;">incluido</span>
            </button>
            ${activeOpts.map((opt) => `
            <button type="button" class="pos-upgrade-opt" data-opt-id="${escapeHtml(opt.id)}">
                <div>
                    <div class="pos-upgrade-opt-name">${escapeHtml(opt.nombre)}</div>
                    ${opt.detalle ? `<div class="pos-upgrade-opt-detail">${escapeHtml(opt.detalle)}</div>` : ''}
                </div>
                <span class="pos-upgrade-opt-price">+${formatMoney(Number(opt.precio || 0))}</span>
            </button>`).join('')}
        </div>`;

    body.querySelector('#posUpgradeSolo')?.addEventListener('click', () => {
        const { productId, productName, productPrice } = _posUpgradePending;
        addProductToPosOrder(productId, productName, productPrice);
        closePosUpgradeSheet();
    });

    body.querySelectorAll('.pos-upgrade-opt[data-opt-id]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const opt = (cfg.opciones || []).find((o) => o.id === btn.dataset.optId);
            if (!opt) return;
            if (opt.incluye_bebida) {
                renderPosUpgradeStep2(opt);
            } else {
                const { productId, productName, productPrice } = _posUpgradePending;
                addProductToPosOrder(productId, productName, productPrice + Number(opt.precio || 0), opt.nombre);
                closePosUpgradeSheet();
            }
        });
    });
}

function renderPosUpgradeStep2(selectedOpt) {
    const body = document.getElementById('posUpgradeBody');
    const titleEl = document.getElementById('posUpgradeTitle');
    if (!body) return;

    if (titleEl) titleEl.textContent = '¿Qué bebida quieres?';

    const cfg = menuUpgradesConfig || DEFAULT_UPGRADES_CONFIG;
    const sabores = Array.isArray(cfg.sabores_bebida) ? cfg.sabores_bebida : [];

    body.innerHTML = `
        <div class="pos-upgrade-label">${escapeHtml(selectedOpt.nombre)}: elige tu bebida</div>
        <div class="pos-flavors-grid">
            ${sabores.map((s) => `
            <button type="button" class="pos-flavor-btn" data-flavor="${escapeHtml(s)}">${escapeHtml(s)}</button>
            `).join('')}
        </div>
        <button type="button" class="pos-upgrade-back-btn" id="posUpgradeBackBtn">← Volver</button>`;

    body.querySelectorAll('.pos-flavor-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            const { productId, productName, productPrice } = _posUpgradePending;
            const flavor = btn.dataset.flavor;
            const note = flavor === 'Sin bebida' ? selectedOpt.nombre : `${selectedOpt.nombre} (${flavor})`;
            addProductToPosOrder(productId, productName, productPrice + Number(selectedOpt.precio || 0), note);
            closePosUpgradeSheet();
        });
    });

    body.querySelector('#posUpgradeBackBtn')?.addEventListener('click', renderPosUpgradeStep1);
}

/* ─── POS v2: Gestión de tickets múltiples ─── */

function createNewPosTicket() {
    const ticketNumber = posTickets.length + 1;
    const ticket = { id: `ticket-${Date.now()}`, label: `Pedido ${ticketNumber}`, items: [] };
    posTickets.push(ticket);
    posActiveTicketId = ticket.id;
    internalOrderItems = ticket.items;
    renderPosTicketsBadge();
    const label = document.getElementById('posActiveTicketLabel');
    if (label) label.textContent = ticket.label;
    return ticket;
}

function switchPosTicket(ticketId) {
    const current = posTickets.find((t) => t.id === posActiveTicketId);
    if (current) current.items = internalOrderItems;
    const ticket = posTickets.find((t) => t.id === ticketId);
    if (!ticket) return;
    posActiveTicketId = ticketId;
    internalOrderItems = ticket.items;
    const label = document.getElementById('posActiveTicketLabel');
    if (label) label.textContent = ticket.label;
    renderPosOrderItems();
    renderPosTotals();
    renderPosBottomBar();
    showPosScreen('main');
}

function renderPosTicketsBadge() {
    const badge = document.getElementById('posTicketsCountBadge');
    if (badge) badge.textContent = posTickets.length;
}

function renderPosTicketsList() {
    const list = document.getElementById('posTicketsList');
    if (!list) return;
    if (!posTickets.length) {
        list.innerHTML = '<p style="text-align:center;color:#b8c8e8;padding:32px 16px;font-size:0.95rem;">No hay tickets abiertos</p>';
        return;
    }
    list.innerHTML = posTickets.map((ticket) => {
        const subtotal = ticket.items.reduce((sum, item) => sum + Number(item.subtotal || 0), 0);
        const itemCount = ticket.items.reduce((sum, i) => sum + Number(i.quantity || 0), 0);
        const isActive = ticket.id === posActiveTicketId;
        return `<div class="pos-ticket-item ${isActive ? 'active-ticket' : ''}" data-ticket-id="${escapeHtml(ticket.id)}">
            <div class="pos-ticket-check">${isActive ? '✓' : ''}</div>
            <div class="pos-ticket-info">
                <div class="pos-ticket-name">${escapeHtml(ticket.label)}</div>
                <div class="pos-ticket-meta">${itemCount} ${itemCount === 1 ? 'item' : 'items'}</div>
            </div>
            <div class="pos-ticket-total">${formatMoney(subtotal)}</div>
        </div>`;
    }).join('');
    list.querySelectorAll('.pos-ticket-item').forEach((item) => {
        item.addEventListener('click', () => switchPosTicket(item.dataset.ticketId));
    });
}

function showPosScreen(screen) {
    const main = document.getElementById('posScreenMain');
    const payment = document.getElementById('posScreenPayment');
    const tickets = document.getElementById('posScreenTickets');
    const cartDrawer = document.getElementById('posCartDrawer');

    if (main) { main.hidden = screen !== 'main'; main.style.display = screen === 'main' ? 'flex' : 'none'; }
    if (payment) { payment.hidden = screen !== 'payment'; payment.style.display = screen === 'payment' ? 'flex' : 'none'; }
    if (tickets) { tickets.hidden = screen !== 'tickets'; tickets.style.display = screen === 'tickets' ? 'flex' : 'none'; }
    if (cartDrawer && screen !== 'main') { cartDrawer.hidden = true; cartDrawer.style.display = 'none'; }

    if (screen === 'payment') {
        renderPosTotals();
        initPosClientSearch();
    }
    if (screen === 'tickets') {
        renderPosTicketsList();
    }
}

function populateInternalOrderClientSelect() {
    if (!internalOrderClientSelect) {
        return;
    }

    internalOrderClientSelect.innerHTML = '<option value="">Nuevo cliente</option>';
    clientsState.forEach((client) => {
        const option = document.createElement('option');
        option.value = client.id;
        option.textContent = `${client.customerName} · ${client.customerPhone}`;
        internalOrderClientSelect.appendChild(option);
    });
}

function renderInternalOrderClientAddressOptions() {
    if (!internalOrderClientSelect || !internalOrderClientAddressField || !internalOrderClientAddressSelect) {
        return;
    }

    const selectedClientId = String(internalOrderClientSelect.value || '').trim();
    const selectedClient = clientsState.find((client) => client.id === selectedClientId);

    if (!selectedClient) {
        internalOrderClientAddressField.hidden = true;
        internalOrderClientAddressSelect.innerHTML = '';
        return;
    }

    const addresses = Array.isArray(selectedClient.savedAddresses) ? selectedClient.savedAddresses.filter((a) => String(a || '').trim()) : [];

    if (!addresses.length) {
        internalOrderClientAddressField.hidden = true;
        internalOrderClientAddressSelect.innerHTML = '';
        return;
    }

    internalOrderClientAddressSelect.innerHTML = addresses
        .map((address) => `<option value="${escapeHtml(address)}">${escapeHtml(address)}</option>`)
        .join('');
    internalOrderClientAddressField.hidden = false;
}

/* ─── Buscador de clientes POS ─── */

function initPosClientSearch() {
    const searchInput = document.getElementById('posClientSearchInput');
    const clearBtn = document.getElementById('posClientClearBtn');

    if (searchInput && !searchInput.dataset.listenerAttached) {
        searchInput.addEventListener('input', () => {
            const query = searchInput.value.trim().toLowerCase();
            if (!query) {
                hidePosClientResults();
                return;
            }
            const matches = clientsState
                .filter((c) => {
                    const name = String(c.customerName || '').toLowerCase();
                    const phone = String(c.customerPhone || '').toLowerCase();
                    return name.includes(query) || phone.includes(query);
                })
                .slice(0, 6);
            showPosClientResults(matches);
        });
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') hidePosClientResults();
        });
        searchInput.dataset.listenerAttached = 'true';
    }

    if (clearBtn && !clearBtn.dataset.listenerAttached) {
        clearBtn.addEventListener('click', clearPosClient);
        clearBtn.dataset.listenerAttached = 'true';
    }

    document.addEventListener('click', (e) => {
        const wrap = document.querySelector('.pos-client-search-wrap');
        if (wrap && !wrap.contains(e.target)) hidePosClientResults();
    }, { capture: false });
}

function showPosClientResults(matches) {
    const resultsEl = document.getElementById('posClientResults');
    if (!resultsEl) return;

    if (!matches.length) {
        resultsEl.innerHTML = `<div class="pos-client-result-empty">Sin resultados — <button type="button" class="pos-client-new-btn" id="posClientNewBtn">Crear nuevo</button></div>`;
        resultsEl.querySelector('#posClientNewBtn')?.addEventListener('click', () => {
            hidePosClientResults();
            if (internalOrderNewClientFields) internalOrderNewClientFields.hidden = false;
            if (internalOrderNewClientNameInput) internalOrderNewClientNameInput.focus();
        });
    } else {
        resultsEl.innerHTML = matches.map((client) => `
            <div class="pos-client-result-item" data-client-id="${escapeHtml(client.id)}">
                <strong>${escapeHtml(client.customerName || 'Sin nombre')}</strong>
                <span>${escapeHtml(client.customerPhone || '')}</span>
            </div>
        `).join('');
        resultsEl.querySelectorAll('.pos-client-result-item').forEach((item) => {
            item.addEventListener('click', () => {
                const client = clientsState.find((c) => c.id === item.dataset.clientId);
                if (client) selectPosClient(client);
            });
        });
    }
    resultsEl.hidden = false;
}

function hidePosClientResults() {
    const resultsEl = document.getElementById('posClientResults');
    if (resultsEl) resultsEl.hidden = true;
}

function selectPosClient(client) {
    posSelectedClientData = client;
    hidePosClientResults();

    const searchInput = document.getElementById('posClientSearchInput');
    const posClientCard = document.getElementById('posClientCard');
    const posClientCardName = document.getElementById('posClientCardName');
    const posClientCardPhone = document.getElementById('posClientCardPhone');

    if (searchInput) searchInput.value = '';
    if (posClientCard) posClientCard.hidden = false;
    if (posClientCardName) posClientCardName.textContent = client.customerName || 'Sin nombre';
    if (posClientCardPhone) posClientCardPhone.textContent = client.customerPhone || '';
    if (internalOrderNewClientFields) internalOrderNewClientFields.hidden = true;

    const addresses = Array.isArray(client.savedAddresses) ? client.savedAddresses.filter(Boolean) : [];
    if (addresses.length && internalOrderClientAddressField && internalOrderClientAddressSelect) {
        internalOrderClientAddressSelect.innerHTML = addresses
            .map((addr) => `<option value="${escapeHtml(addr)}">${escapeHtml(addr)}</option>`)
            .join('');
        internalOrderClientAddressField.hidden = false;
    } else {
        if (internalOrderClientAddressField) internalOrderClientAddressField.hidden = true;
    }
}

function clearPosClient() {
    posSelectedClientData = null;
    const searchInput = document.getElementById('posClientSearchInput');
    const posClientCard = document.getElementById('posClientCard');
    if (posClientCard) posClientCard.hidden = true;
    if (searchInput) { searchInput.value = ''; searchInput.focus(); }
    if (internalOrderClientAddressField) internalOrderClientAddressField.hidden = true;
    if (internalOrderNewClientFields) internalOrderNewClientFields.hidden = true;
}

function openInternalOrderModal() {
    if (!internalOrderModal) return;

    // Crear primer ticket si no hay ninguno
    if (!posTickets.length) {
        createNewPosTicket();
    } else {
        internalOrderItems = posTickets.find((t) => t.id === posActiveTicketId)?.items || internalOrderItems;
    }

    posSelectedClientData = null;
    internalOrderUseNewClient = false;

    // Reset UI de cliente
    const posClientCard = document.getElementById('posClientCard');
    const posClientSearchInput = document.getElementById('posClientSearchInput');
    const posClientResults = document.getElementById('posClientResults');
    if (posClientCard) posClientCard.hidden = true;
    if (posClientSearchInput) posClientSearchInput.value = '';
    if (posClientResults) posClientResults.hidden = true;
    if (internalOrderClientAddressField) internalOrderClientAddressField.hidden = true;
    if (internalOrderNewClientFields) internalOrderNewClientFields.hidden = true;

    // Reset pantalla de pago
    if (internalOrderTypeSelect) internalOrderTypeSelect.value = 'retiro';
    if (internalOrderDeliveryAddressField) internalOrderDeliveryAddressField.hidden = true;
    if (internalOrderPaymentMethodSelect) internalOrderPaymentMethodSelect.value = 'efectivo';
    if (internalOrderNotesInput) internalOrderNotesInput.value = '';
    if (internalOrderDiscount) internalOrderDiscount.value = '0';
    const cashAmountInput = document.getElementById('posCashAmount');
    if (cashAmountInput) cashAmountInput.value = '';
    if (internalOrderNewClientNameInput) internalOrderNewClientNameInput.value = '';
    if (internalOrderNewClientPhoneInput) internalOrderNewClientPhoneInput.value = '';
    if (internalOrderNewClientAddressInput) internalOrderNewClientAddressInput.value = '';

    document.querySelectorAll('.pos-type-btn').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.type === 'retiro');
    });
    document.querySelectorAll('.pos-pay-method-btn').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.method === 'efectivo');
    });
    const cashSection = document.getElementById('posCashSection');
    if (cashSection) cashSection.hidden = false;

    initPosClientSearch();
    renderPosCategoriesPanel();
    renderPosOrderItems();
    renderPosTotals();
    renderPosBottomBar();
    renderPosTicketsBadge();
    hideModalFeedback(internalOrderFeedback);

    showPosScreen('main');
    internalOrderModal.classList.add('is-open');
    internalOrderModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
}

function closeInternalOrderModal(clearCurrentTicket = false) {
    if (!internalOrderModal) return;

    if (clearCurrentTicket) {
        posTickets = posTickets.filter((t) => t.id !== posActiveTicketId);
        if (posTickets.length > 0) {
            posActiveTicketId = posTickets[0].id;
            internalOrderItems = posTickets[0].items;
            renderPosOrderItems();
            renderPosTotals();
            renderPosBottomBar();
            renderPosTicketsBadge();
            const label = document.getElementById('posActiveTicketLabel');
            if (label) label.textContent = posTickets[0].label;
            showPosScreen('main');
            return;
        }
    }

    posTickets = [];
    posActiveTicketId = null;
    internalOrderItems = [];
    const cartDrawer = document.getElementById('posCartDrawer');
    if (cartDrawer) cartDrawer.hidden = true;
    internalOrderModal.classList.remove('is-open');
    internalOrderModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
}

async function submitInternalOrderForm(event) {
    event.preventDefault();
    hideNotice();
    hideModalFeedback(internalOrderFeedback);

    const useNewClient = !posSelectedClientData;
    const selectedClientId = posSelectedClientData?.id || '';
    const selectedClient = posSelectedClientData || null;

    const customerName = useNewClient
        ? String(internalOrderNewClientNameInput?.value || '').trim()
        : selectedClient?.customerName || '';
    const customerPhone = useNewClient
        ? String(internalOrderNewClientPhoneInput?.value || '').trim()
        : selectedClient?.customerPhone || '';
    const selectedClientAddress = !useNewClient && internalOrderClientAddressSelect
        ? String(internalOrderClientAddressSelect.value || selectedClient?.address || '').trim()
        : '';
    const customerAddress = useNewClient
        ? String(internalOrderNewClientAddressInput?.value || '').trim()
        : selectedClientAddress || selectedClient?.address || '';
    const orderType = String(internalOrderTypeSelect?.value || 'retiro').trim();
    const deliveryAddress = orderType === 'domicilio'
        ? String(internalOrderDeliveryAddressInput?.value || '').trim() || customerAddress
        : customerAddress;
    const paymentMethod = String(internalOrderPaymentMethodSelect?.value || 'efectivo').trim();
    const discount = Number(internalOrderDiscount?.value || 0);

    if (!customerName) {
        showModalFeedback(internalOrderFeedback, 'Ingresa el nombre del cliente.', 'error');
        return;
    }
    if (!customerPhone) {
        showModalFeedback(internalOrderFeedback, 'Ingresa el telefono del cliente.', 'error');
        return;
    }
    if (orderType === 'domicilio' && !deliveryAddress) {
        showModalFeedback(internalOrderFeedback, 'Ingresa la direccion de entrega.', 'error');
        return;
    }
    if (!internalOrderItems.length) {
        showModalFeedback(internalOrderFeedback, 'Agrega al menos un producto al pedido.', 'error');
        return;
    }

    try {
        if (internalOrderSaveBtn) {
            internalOrderSaveBtn.disabled = true;
            internalOrderSaveBtn.textContent = 'Creando...';
        }

        const orderId = firebaseDb.collection(ORDERS_COLLECTION).doc().id;
        const orderCode = `RB-${String(orderId || '').slice(-6).toUpperCase()}`;
        const subtotal = internalOrderItems.reduce((sum, item) => sum + Number(item.subtotal || 0), 0);
        const deliveryFee = orderType === 'domicilio' ? 0 : null;
        const total = Math.max(0, (deliveryFee !== null ? subtotal + Number(deliveryFee) : subtotal) - discount);
        const customerPhoneDigits = normalizePhoneDigits(customerPhone);
        const clientId = useNewClient
            ? buildAdminClientDocumentId({ customerName, customerPhone, address: customerAddress })
            : selectedClientId;
        const currentClient = clientsState.find((client) => client.id === clientId);
        const clientTotalOrders = Number(currentClient?.totalOrders || 0) + 1;
        const clientTotalSpent = Number(currentClient?.totalSpent || 0) + total;

        const cashGiven = paymentMethod === 'efectivo' ? Number(document.getElementById('posCashAmount')?.value || 0) : 0;
        const cashChangeRequired = cashGiven > 0 && cashGiven > total;
        const cashTenderAmount = cashGiven > 0 ? cashGiven : null;

        await firebaseDb.collection(ORDERS_COLLECTION).doc(orderId).set({
            id: orderId,
            code: orderCode,
            customerName,
            customerPhone,
            customerPhoneDigits,
            customerAddress,
            deliveryAddress,
            profileAddress: customerAddress,
            paymentMethod,
            cashChangeRequired,
            cashTenderAmount,
            orderType,
            source: 'admin_panel',
            status: 'pendiente',
            items: internalOrderItems.map((item, index) => ({
                index: index + 1,
                itemKey: item.itemKey,
                productId: item.productId,
                productName: item.productName,
                categoryName: item.categoryName,
                optionLabel: item.note || '',
                note: item.note || '',
                quantity: Number(item.quantity || 0),
                unitPrice: Number(item.unitPrice || 0),
                subtotal: Number(item.subtotal || 0)
            })),
            itemCount: internalOrderItems.length,
            totalItems: internalOrderItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
            subtotal,
            discount,
            deliveryFee,
            total,
            currency: 'COP',
            summaryMessage: String(internalOrderNotesInput?.value || '').trim(),
            createdAt: firestoreNow(),
            updatedAt: firestoreNow()
        });

        await firebaseDb.collection(CLIENTS_COLLECTION).doc(clientId).set({
            customerName,
            customerPhone,
            customerPhoneDigits,
            address: customerAddress,
            savedAddresses: [customerAddress],
            totalOrders: clientTotalOrders,
            totalSpent: clientTotalSpent,
            lastOrderCode: orderCode,
            lastOrderId: orderId,
            lastOrderTotal: total,
            firstOrderAt: currentClient?.firstOrderAt || firestoreNow(),
            lastOrderAt: firestoreNow(),
            source: currentClient?.source || 'admin_panel',
            createdAt: currentClient?.createdAt || firestoreNow(),
            updatedAt: firestoreNow()
        }, { merge: true });

        await reloadDataAndRender();
        closeInternalOrderModal(true);
        showNotice('Pedido creado correctamente.', 'ok');
    } catch (error) {
        showModalFeedback(internalOrderFeedback, `Error: ${error.message || 'error'}`, 'error');
    } finally {
        if (internalOrderSaveBtn) {
            internalOrderSaveBtn.disabled = false;
            internalOrderSaveBtn.textContent = 'CREAR PEDIDO';
        }
    }
}

async function fetchMessages() {
    const snapshot = await firebaseDb.collection(MESSAGES_COLLECTION).get();
    messagesState = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .map((raw) => ({
            id: String(raw.id || '').trim(),
            type: String(raw.type || 'general').trim(),
            status: String(raw.status || 'pending').trim().toLowerCase() === 'resolved' ? 'resolved' : 'pending',
            customerName: String(raw.customerName || '').trim() || 'Cliente sin nombre',
            customerPhone: String(raw.customerPhone || '').trim() || 'No registrado',
            customerPhoneDigits: normalizePhoneDigits(raw.customerPhoneDigits || raw.customerPhone),
            customerAddress: String(raw.customerAddress || '').trim(),
            subject: String(raw.subject || '').trim() || 'Solicitud del sitio web',
            body: String(raw.body || '').trim(),
            source: String(raw.source || 'public_web').trim(),
            createdAt: raw.createdAt || raw.updatedAt || null,
            updatedAt: raw.updatedAt || raw.createdAt || null,
            resolvedAt: raw.resolvedAt || null,
            resolvedBy: String(raw.resolvedBy || '').trim(),
            readAt: raw.readAt || null,
            readBy: String(raw.readBy || '').trim(),
            adminAction: String(raw.adminAction || '').trim()
        }))
        .sort((a, b) => {
            const aTs = a.createdAt && typeof a.createdAt.toMillis === 'function' ? a.createdAt.toMillis() : 0;
            const bTs = b.createdAt && typeof b.createdAt.toMillis === 'function' ? b.createdAt.toMillis() : 0;
            return bTs - aTs;
        });
}

async function seedDataIfNeeded() {
    const categoriesCheck = await firebaseDb.collection('categorias').limit(1).get();
    if (categoriesCheck.empty) {
        const batch = firebaseDb.batch();
        seedCategories.forEach((category) => {
            const ref = firebaseDb.collection('categorias').doc(category.id);
            batch.set(ref, {
                name: category.name,
                image_url: category.image_url || '',
                active: category.active,
                created_at: firestoreNow(),
                updated_at: firestoreNow()
            });
        });
        await batch.commit();
    }

    const productsCheck = await firebaseDb.collection('productos').limit(1).get();
    if (productsCheck.empty) {
        const batch = firebaseDb.batch();
        seedProducts.forEach((product) => {
            const ref = firebaseDb.collection('productos').doc(product.id);
            batch.set(ref, {
                nombre: product.nombre,
                precio: product.precio,
                categoria: product.categoria,
                estado: product.estado,
                es_destacado: product.es_destacado,
                image_url: product.image_url,
                created_at: firestoreNow(),
                updated_at: firestoreNow()
            });
        });
        await batch.commit();
    }

    const buttonsCheck = await firebaseDb.collection('botones').limit(1).get();
    if (buttonsCheck.empty) {
        const batch = firebaseDb.batch();
        defaultButtons.forEach((button) => {
            const ref = firebaseDb.collection('botones').doc(button.id);
            batch.set(ref, {
                ...button,
                created_at: firestoreNow(),
                updated_at: firestoreNow()
            });
        });
        await batch.commit();
    }

    const brandingCheck = await firebaseDb.collection(CONFIG_COLLECTION).doc(CONFIG_DOC_ID).get();
    if (!brandingCheck.exists) {
        await firebaseDb.collection(CONFIG_COLLECTION).doc(CONFIG_DOC_ID).set({
            ...defaultBranding,
            created_at: firestoreNow(),
            updated_at: firestoreNow()
        });
    }
}

async function syncPublicCatalogToFirestore() {
    if (!firebaseDb) {
        throw new Error('Firestore no esta listo en el panel.');
    }

    const now = firestoreNow();
    const existingCategories = new Map(categoriesState.map((category) => [category.id, category]));
    const existingProducts = new Map(productsState.map((product) => [product.id, product]));
    const batch = firebaseDb.batch();

    PUBLIC_CATEGORY_CATALOG.forEach((category) => {
        const current = existingCategories.get(category.id);
        const ref = firebaseDb.collection('categorias').doc(category.id);

        batch.set(ref, {
            name: category.name,
            image_url: category.image_url || '',
            active: current ? current.active !== false : category.active,
            created_at: current?.created_at || now,
            updated_at: now
        }, { merge: true });
    });

    PUBLIC_PRODUCT_CATALOG.forEach((product) => {
        const current = existingProducts.get(product.id);
        const ref = firebaseDb.collection('productos').doc(product.id);

        batch.set(ref, {
            nombre: product.nombre,
            precio: product.precio,
            categoria: product.categoria,
            estado: current?.estado === 'paused' ? 'paused' : product.estado,
            es_destacado: current?.es_destacado === true || product.es_destacado === true,
            image_url: product.image_url,
            source: 'public_catalog',
            created_at: current?.created_at || now,
            updated_at: now
        }, { merge: true });
    });

    await batch.commit();
}

function renderEditProductCategorySelect(selectedCategoryName) {
    if (!editProductCategorySelect) {
        return;
    }

    renderCategoryOptions(editProductCategorySelect, selectedCategoryName);
}

function renderCategoryOptions(selectElement, selectedCategoryName) {
    if (!selectElement) {
        return;
    }

    selectElement.innerHTML = '';
    categoriesState.forEach((category) => {
        const option = document.createElement('option');
        option.value = category.name;
        option.textContent = `${category.name}${category.active ? '' : ' (inactiva)'}`;
        selectElement.appendChild(option);
    });

    if (selectedCategoryName) {
        selectElement.value = selectedCategoryName;
    }
}

function closeCategoryCreateModal() {
    if (!categoryCreateModal || !categoryCreateForm) {
        return;
    }

    categoryCreateModal.classList.remove('show');
    categoryCreateModal.setAttribute('aria-hidden', 'true');
    categoryCreateForm.reset();
    hideModalFeedback(categoryCreateFeedback);

    if (categoryCreateSaveBtn) {
        categoryCreateSaveBtn.disabled = false;
        categoryCreateSaveBtn.textContent = 'Crear categoria';
    }
}

function openCategoryCreateModal() {
    if (!categoryCreateModal) {
        return;
    }

    hideModalFeedback(categoryCreateFeedback);
    categoryCreateModal.classList.add('show');
    categoryCreateModal.setAttribute('aria-hidden', 'false');
    if (modalCategoryNameInput) {
        modalCategoryNameInput.focus();
    }
}

function closeProductCreateModal() {
    if (!productCreateModal || !productCreateForm) {
        return;
    }

    productCreateModal.classList.remove('show');
    productCreateModal.setAttribute('aria-hidden', 'true');
    productCreateForm.reset();
    hideModalFeedback(productCreateFeedback);

    if (productCreateSaveBtn) {
        productCreateSaveBtn.disabled = false;
        productCreateSaveBtn.textContent = 'Crear producto';
    }
}

function openProductCreateModal(preselectedCategoryName = '') {
    if (!productCreateModal) {
        return;
    }

    hideModalFeedback(productCreateFeedback);
    renderCategoryOptions(createProductCategorySelect, preselectedCategoryName);
    if (createProductStateSelect) {
        createProductStateSelect.value = 'active';
    }
    if (createProductFeaturedSelect) {
        createProductFeaturedSelect.value = 'false';
    }

    productCreateModal.classList.add('show');
    productCreateModal.setAttribute('aria-hidden', 'false');
    if (createProductNameInput) {
        createProductNameInput.focus();
    }
}

function buildDefaultProductImage(nombre, categoria) {
    const matchedByName = productsState.find((product) => normalizeCategoryKey(product.nombre) === normalizeCategoryKey(nombre));
    if (matchedByName?.image_url) {
        return matchedByName.image_url;
    }

    const matchedByCategory = categoriesState.find((category) => normalizeCategoryKey(category.name) === normalizeCategoryKey(categoria));
    if (matchedByCategory?.image_url) {
        return matchedByCategory.image_url;
    }

    return 'logo.png';
}

async function createCategoryByName(rawName) {
    const name = String(rawName || '').trim();

    if (!name) {
        showNotice('Debes escribir el nombre de la categoria.', 'error');
        return false;
    }

    const exists = categoriesState.some((category) => category.name.toLowerCase() === name.toLowerCase());
    if (exists) {
        showNotice('Esa categoria ya existe.', 'error');
        return false;
    }

    const id = `${slugify(name)}-${Date.now()}`;
    await firebaseDb.collection('categorias').doc(id).set({
        name,
        image_url: '',
        active: true,
        created_at: firestoreNow(),
        updated_at: firestoreNow()
    });

    await reloadDataAndRender();
    showNotice('Categoria creada y activada.', 'ok');
    return true;
}

function closeProductEditModal() {
    if (!productEditModal || !productEditForm) {
        return;
    }

    productEditModal.classList.remove('show');
    productEditModal.setAttribute('aria-hidden', 'true');
    productEditForm.reset();
    editingCategoryContextId = null;

    if (productEditSaveBtn) {
        productEditSaveBtn.disabled = false;
        productEditSaveBtn.textContent = 'Guardar cambios';
    }
}

function openProductEditModal(product, categoryId) {
    if (!productEditModal || !productEditForm || !product) {
        return;
    }

    editingCategoryContextId = categoryId;
    editProductIdInput.value = product.id;
    editProductNameInput.value = product.nombre;
    editProductPriceInput.value = String(Number(product.precio || 0));
    renderEditProductCategorySelect(product.categoria);
    editProductStateSelect.value = product.estado === 'paused' ? 'paused' : 'active';
    editProductFeaturedSelect.value = product.es_destacado ? 'true' : 'false';
    editProductImageUrlInput.value = product.image_url || '';

    productEditModal.classList.add('show');
    productEditModal.setAttribute('aria-hidden', 'false');
    editProductNameInput.focus();
}

function closeCategoryProductsModal() {
    if (!categoryProductsModal || !categoryProductsModalBody || !categoryProductsModalMeta) {
        return;
    }

    categoryProductsModal.classList.remove('show');
    categoryProductsModal.setAttribute('aria-hidden', 'true');
    categoryProductsModalBody.innerHTML = '';
    categoryProductsModalMeta.innerHTML = '';
    activeCategoryModalId = null;
}

function renderCategoryProductsModal(category) {
    if (!categoryProductsModalTitle || !categoryProductsModalMeta || !categoryProductsModalBody || !category) {
        return;
    }

    const products = productsState
        .filter((product) => product.categoria === category.name)
        .sort((left, right) => left.nombre.localeCompare(right.nombre, 'es', { sensitivity: 'base' }));

    categoryProductsModalTitle.textContent = category.name;
    categoryProductsModalMeta.innerHTML = `
        <span class="category-modal-chip">${products.length} producto${products.length === 1 ? '' : 's'}</span>
        <span class="category-modal-chip">${category.active ? 'Visible en publico' : 'Oculta en publico'}</span>
    `;

    if (!products.length) {
        categoryProductsModalBody.innerHTML = '<div class="category-modal-empty">Esta categoria todavia no tiene productos cargados.</div>';
        return;
    }

    const list = document.createElement('div');
    list.className = 'category-modal-list';

    products.forEach((product) => {
        const item = document.createElement('div');
        item.className = 'category-modal-product';
        const isPaused = product.estado === 'paused';
        const stateClass = isPaused ? 'paused' : 'active';
        const stateText = isPaused ? 'Pausado' : 'Activo';
        const featuredTag = product.es_destacado ? '<span class="category-modal-chip">Destacado</span>' : '';
        const imageSrc = product.image_url || category.image_url || 'logo.png';

        item.innerHTML = `
            <img class="category-modal-product-image" src="${imageSrc}" alt="${product.nombre}">
            <div class="category-modal-product-copy">
                <div class="category-modal-product-head">
                    <strong class="category-modal-product-name">${product.nombre}</strong>
                    <span class="product-state-tag ${stateClass}">${stateText}</span>
                    ${featuredTag}
                </div>
                <div class="category-modal-product-meta">
                    <span class="category-price-chip">${formatMoney(product.precio)}</span>
                    <span class="category-modal-chip">${category.name}</span>
                </div>
            </div>
            <div class="category-modal-product-actions">
                <button class="mini-btn" data-action="edit-product" data-product-id="${product.id}" data-category-id="${category.id}">Editar</button>
                <button class="mini-btn" data-action="pause-product" data-product-id="${product.id}" data-category-id="${category.id}">${isPaused ? 'Reanudar' : 'Pausar'}</button>
                <button class="mini-btn remove" data-action="delete-product" data-product-id="${product.id}" data-category-id="${category.id}">Eliminar</button>
            </div>
        `;

        list.appendChild(item);
    });

    categoryProductsModalBody.innerHTML = '';
    categoryProductsModalBody.appendChild(list);
}

function openCategoryProductsModal(categoryId) {
    if (!categoryProductsModal) {
        return;
    }

    const category = categoriesState.find((item) => item.id === categoryId);
    if (!category) {
        showNotice('Categoria no encontrada.', 'error');
        return;
    }

    activeCategoryModalId = categoryId;
    renderCategoryProductsModal(category);
    categoryProductsModal.classList.add('show');
    categoryProductsModal.setAttribute('aria-hidden', 'false');
}

async function handleCategoryProductAction(action, productId, categoryId) {
    const product = productsState.find((item) => item.id === productId);
    if (!product) {
        showNotice('Producto no encontrado.', 'error');
        return;
    }

    try {
        if (action === 'edit-product') {
            openProductEditModal(product, categoryId);
            return;
        }

        if (action === 'delete-product') {
            const confirmed = window.confirm(`Eliminar ${product.nombre}?`);
            if (!confirmed) {
                return;
            }

            await firebaseDb.collection('productos').doc(productId).delete();
            await reloadDataAndRender();
            showNotice('Producto eliminado.', 'ok');
            return;
        }

        if (action === 'pause-product') {
            const estado = product.estado === 'paused' ? 'active' : 'paused';
            await firebaseDb.collection('productos').doc(productId).update({
                estado,
                updated_at: firestoreNow()
            });

            await reloadDataAndRender();
            showNotice(`Producto ${estado === 'paused' ? 'pausado' : 'reanudado'}.`, 'ok');
        }
    } catch (error) {
        showNotice(`No se pudo actualizar el producto: ${error.message || 'Error inesperado.'}`, 'error');
    }
}

function createCategoryRow(category) {
    const wrapper = document.createElement('div');
    const row = document.createElement('div');
    row.className = 'list-item category-list-item';

    const stateClass = category.active ? 'active' : 'inactive';
    const stateText = category.active ? 'Activa' : 'Inactiva';
    const toggleText = category.active ? 'Desactivar' : 'Activar';
    const productsCount = productsState.filter((product) => product.categoria === category.name).length;
    const categoryThumb = category.image_url || 'logo.png';

    row.innerHTML = `
        <button type="button" class="category-trigger" data-category-id="${category.id}" data-action="view-category">
            <div class="category-trigger-main">
                <img class="category-trigger-thumb" src="${categoryThumb}" alt="${category.name}">
                <div class="category-trigger-copy">
                    <span class="category-trigger-name">${category.name}</span>
                    <span class="category-trigger-subtitle">Toca para ver y controlar los productos de esta categoria.</span>
                    <div class="category-meta-row">
                        <span class="state-pill ${stateClass}">${stateText}</span>
                    </div>
                </div>
            </div>
            <div class="category-trigger-meta">
                <div class="category-trigger-count">
                    <strong>${productsCount}</strong>
                    <span>Productos</span>
                </div>
            </div>
        </button>
        <div class="category-actions">
            <button class="mini-btn" data-category-id="${category.id}" data-action="toggle-category">${toggleText}</button>
            <button class="mini-btn remove" data-category-id="${category.id}" data-action="delete-category">Eliminar</button>
        </div>
    `;

    wrapper.appendChild(row);
    return wrapper;
}

function renderCategories() {
    categoryList.innerHTML = '';
    categoriesState.forEach((category) => {
        categoryList.appendChild(createCategoryRow(category));
    });
}

function createFeaturedRow(product) {
    const row = document.createElement('div');
    row.className = 'list-item';

    const stateClass = product.estado === 'active' ? 'visible' : 'hidden';
    const stateText = product.estado === 'active' ? 'Activo' : 'Pausado';
    const toggleText = product.estado === 'active' ? 'Pausar' : 'Reanudar';

    row.innerHTML = `
        <div class="product-main">
            <img src="${product.image_url || 'logo.png'}" alt="${product.nombre}">
            <span>${product.nombre}</span>
        </div>
        <div class="muted">$ ${Number(product.precio).toLocaleString('es-CO')} - ${product.categoria}</div>
        <span class="state-pill ${stateClass}">${stateText}</span>
        <button class="mini-btn" data-product-id="${product.id}" data-action="toggle-featured-state">${toggleText}</button>
        <button class="mini-btn remove" data-product-id="${product.id}" data-action="remove-featured">Quitar</button>
    `;

    return row;
}

function renderMetricsChart() {
    if (!metricsChartList) {
        return;
    }

    metricsChartList.innerHTML = '';
    if (!productClicksState.length) {
        const empty = document.createElement('p');
        empty.className = 'muted';
        empty.textContent = 'Sin datos de clics por producto aun.';
        metricsChartList.appendChild(empty);
        return;
    }

    const maxValue = Math.max(...productClicksState.map((item) => item.clicks), 1);
    productClicksState
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 12)
        .forEach((item) => {
            const row = document.createElement('div');
            row.className = 'metrics-row';

            const label = document.createElement('span');
            label.className = 'muted';
            label.textContent = item.product;

            const track = document.createElement('div');
            track.className = 'metrics-bar-track';

            const fill = document.createElement('div');
            fill.className = 'metrics-bar-fill';
            fill.style.width = `${Math.max(6, (item.clicks / maxValue) * 100)}%`;

            const value = document.createElement('strong');
            value.textContent = String(item.clicks);

            track.appendChild(fill);
            row.appendChild(label);
            row.appendChild(track);
            row.appendChild(value);
            metricsChartList.appendChild(row);
        });
}

function formatMoney(value) {
    return `$ ${Number(value || 0).toLocaleString('es-CO')}`;
}

function formatOrderTime(value) {
    if (!value) {
        return '--:--';
    }

    const date = typeof value.toDate === 'function' ? value.toDate() : new Date(value);
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
        return '--:--';
    }

    return new Intl.DateTimeFormat('es-CO', {
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

function formatDateTime(value) {
    if (!value) {
        return 'Sin registro';
    }

    return `${formatOrderDate(value)} ${formatOrderTime(value)}`;
}

function formatElapsedTime(value) {
    if (!value) {
        return 'just now';
    }

    const date = typeof value.toDate === 'function' ? value.toDate() : new Date(value);
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
        return 'just now';
    }

    const elapsedMs = Date.now() - date.getTime();
    const elapsedSeconds = Math.max(0, Math.round(elapsedMs / 1000));

    if (elapsedSeconds < 60) {
        return 'just now';
    }

    const elapsedMinutes = Math.floor(elapsedSeconds / 60);
    if (elapsedMinutes < 60) {
        return `${elapsedMinutes}m ago`;
    }

    const elapsedHours = Math.floor(elapsedMinutes / 60);
    if (elapsedHours < 24) {
        return `${elapsedHours}h ago`;
    }

    const elapsedDays = Math.floor(elapsedHours / 24);
    return `${elapsedDays}d ago`;
}

function formatLiveDuration(value) {
    if (!value) {
        return 'hace 0s';
    }

    const date = typeof value.toDate === 'function' ? value.toDate() : new Date(value);

    function getTimestampMillis(value) {
        if (!value) {
            return 0;
        }

        if (typeof value.toMillis === 'function') {
            return value.toMillis();
        }

        const parsed = new Date(value).getTime();
        return Number.isFinite(parsed) ? parsed : 0;
    }
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
        return 'hace 0s';
    }

    const elapsedMs = Math.max(0, Date.now() - date.getTime());
    const totalSeconds = Math.floor(elapsedMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
        return `hace ${hours}h ${minutes}m`;
    }

    if (minutes > 0) {
        return `hace ${minutes}m ${seconds}s`;
    }

    return `hace ${seconds}s`;
}

function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function formatOrderDate(value) {
    if (!value) {
        return 'Sin fecha';
    }

    const date = typeof value.toDate === 'function' ? value.toDate() : new Date(value);
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
        return 'Sin fecha';
    }

    return new Intl.DateTimeFormat('es-CO', {
        dateStyle: 'medium'
    }).format(date);
}

function getOrderStatusMeta(status) {
    switch (status) {
        case 'esperando_domiciliario':
            return { label: 'Esperando domiciliario', className: 'awaiting-delivery' };
        case 'listo_recoger':
            return { label: 'Pedido listo', className: 'ready-pickup' };
        case 'preparacion':
            return { label: 'En cocina', className: 'processing' };
        case 'camino':
            return { label: 'En camino', className: 'processing' };
        case 'entregado':
            return { label: 'Entregado', className: 'success' };
        default:
            return { label: 'Nuevo', className: 'pending' };
    }
}

function getOrderColumnKey(order) {
    if (order.status === 'pendiente') {
        return 'unread';
    }

    return order.orderType === 'domicilio' ? 'delivery' : 'takeaway';
}

function getOrderTypeLabel(order) {
    return order.orderType === 'retiro' ? 'Llevar' : 'Domicilio';
}

function getOrderDisplayTotal(order) {
    if (Number.isFinite(Number(order.total))) {
        return Number(order.total);
    }

    return Number(order.subtotal || 0) + Number(order.deliveryFee || 0);
}

function getDeliveredOrdersForCurrentDay() {
    return ordersState.filter((order) => order.status === 'entregado');
}

function buildSalesSummaryPayload(deliveredOrders, openedAt, closedAt) {
    const categoriesMap = new Map();
    const productsMap = new Map();

    let totalSales = 0;
    let totalItems = 0;
    let takeawaySales = 0;
    let deliverySales = 0;

    const orders = deliveredOrders.map((order) => {
        const orderTotal = Number(getOrderDisplayTotal(order) || 0);
        totalSales += orderTotal;
        totalItems += Number(order.totalItems || order.itemCount || 0);
        if (order.orderType === 'domicilio') {
            deliverySales += orderTotal;
        } else {
            takeawaySales += orderTotal;
        }

        order.items.forEach((item) => {
            const categoryName = String(item.categoryName || 'Sin categoria').trim() || 'Sin categoria';
            const productName = String(item.productName || 'Producto').trim() || 'Producto';
            const quantity = Number(item.quantity || 0);
            const amount = Number(item.subtotal || ((Number(item.unitPrice || 0)) * quantity) || 0);

            const categoryEntry = categoriesMap.get(categoryName) || {
                name: categoryName,
                amount: 0,
                quantity: 0,
                orderIds: new Set()
            };
            categoryEntry.amount += amount;
            categoryEntry.quantity += quantity;
            categoryEntry.orderIds.add(order.id);
            categoriesMap.set(categoryName, categoryEntry);

            const productKey = `${categoryName}__${productName}`;
            const productEntry = productsMap.get(productKey) || {
                name: productName,
                categoryName,
                amount: 0,
                quantity: 0,
                orderIds: new Set()
            };
            productEntry.amount += amount;
            productEntry.quantity += quantity;
            productEntry.orderIds.add(order.id);
            productsMap.set(productKey, productEntry);
        });

        return {
            id: order.id,
            code: order.code,
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            orderType: order.orderType,
            paymentMethod: order.paymentMethod,
            subtotal: Number(order.subtotal || 0),
            deliveryFee: Number(order.deliveryFee || 0),
            total: orderTotal,
            createdAt: order.createdAt || null,
            deliveredAt: order.deliveredAt || order.updatedAt || null,
            items: order.items.map((item) => ({
                productName: item.productName,
                categoryName: item.categoryName,
                quantity: Number(item.quantity || 0),
                unitPrice: Number(item.unitPrice || 0),
                subtotal: Number(item.subtotal || 0),
                optionLabel: item.optionLabel,
                note: item.note
            }))
        };
    });

    const categories = Array.from(categoriesMap.values())
        .map((entry) => ({
            name: entry.name,
            amount: entry.amount,
            quantity: entry.quantity,
            orderCount: entry.orderIds.size
        }))
        .sort((a, b) => b.amount - a.amount);

    const products = Array.from(productsMap.values())
        .map((entry) => ({
            name: entry.name,
            categoryName: entry.categoryName,
            amount: entry.amount,
            quantity: entry.quantity,
            orderCount: entry.orderIds.size
        }))
        .sort((a, b) => b.amount - a.amount);

    return {
        openedAt,
        closedAt,
        totalSales,
        totalOrders: deliveredOrders.length,
        totalItems,
        takeawaySales,
        deliverySales,
        categories,
        products,
        orders,
        createdAt: closedAt,
        updatedAt: closedAt
    };
}

async function ensureActiveSalesDay() {
    if (!firebaseDb || salesDayState?.openedAt) {
        return false;
    }

    const now = firestoreNow();
    await firebaseDb.collection(SALES_DAY_STATE_COLLECTION).doc(SALES_DAY_STATE_DOC_ID).set({
        openedAt: now,
        status: 'active',
        updatedAt: now,
        lastClosedAt: null,
        lastClosureId: ''
    }, { merge: true });
    return true;
}

function getSalesSummaryFilterOptions(type) {
    const values = new Set();
    if (type === 'category') {
        salesSummariesState.forEach((summary) => {
            summary.categories.forEach((entry) => values.add(entry.name));
        });
    } else if (type === 'product') {
        salesSummariesState.forEach((summary) => {
            summary.products.forEach((entry) => values.add(entry.name));
        });
    }

    return Array.from(values).sort((a, b) => a.localeCompare(b, 'es'));
}

function getSalesSummaryDateKey(value) {
    if (!value) {
        return '';
    }

    const date = typeof value.toDate === 'function' ? value.toDate() : new Date(value);
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
        return '';
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function syncSalesSummaryFilterOptions() {
    if (!salesSummaryFilterType || !salesSummaryFilterValue) {
        return;
    }

    const type = String(salesSummaryFilterType.value || 'all');
    const options = getSalesSummaryFilterOptions(type);
    const previousValue = String(salesSummaryFilterValue.value || '');

    if (type === 'all') {
        salesSummaryFilterValue.innerHTML = '<option value="">Selecciona un filtro</option>';
        salesSummaryFilterValue.disabled = true;
        salesSummaryFilterValue.value = '';
        return;
    }

    salesSummaryFilterValue.disabled = false;
    salesSummaryFilterValue.innerHTML = `
        <option value="">Todas</option>
        ${options.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join('')}
    `;
    salesSummaryFilterValue.value = options.includes(previousValue) ? previousValue : '';
}

function summaryMatchesFilter(summary, type, value) {
    if (type === 'category' && value) {
        return summary.categories.some((entry) => entry.name === value);
    }

    if (type === 'product' && value) {
        return summary.products.some((entry) => entry.name === value);
    }

    return true;
}

function summaryMatchesDateRange(summary) {
    return summaryMatchesDateRangeForInputs(summary, salesSummaryDateFrom, salesSummaryDateTo);
}

function summaryMatchesDateRangeForInputs(summary, fromInput, toInput) {
    const summaryDate = getSalesSummaryDateKey(summary.closedAt);
    if (!summaryDate) {
        return false;
    }

    const fromValue = String(fromInput?.value || '').trim();
    const toValue = String(toInput?.value || '').trim();

    if (fromValue && summaryDate < fromValue) {
        return false;
    }

    if (toValue && summaryDate > toValue) {
        return false;
    }

    return true;
}

function getFilteredLedgerEntries() {
    const tsOf = (v) => v && typeof v.toMillis === 'function' ? v.toMillis() : (Number.isFinite(Number(v)) ? Number(v) : 0);
    return [...salesSummariesState]
        .filter((summary) => summaryMatchesDateRangeForInputs(summary, ledgerBookDateFrom, ledgerBookDateTo))
        .sort((a, b) => tsOf(b.closedAt) - tsOf(a.closedAt));
}

function getSalesSummaryBreakdown(summary, type, value) {
    if (type === 'category' && value) {
        return {
            categories: summary.categories.filter((entry) => entry.name === value),
            products: summary.products.filter((entry) => entry.categoryName === value)
        };
    }

    if (type === 'product' && value) {
        const productEntries = summary.products.filter((entry) => entry.name === value);
        const categories = productEntries.length
            ? summary.categories.filter((entry) => entry.name === productEntries[0].categoryName)
            : [];
        return {
            categories,
            products: productEntries
        };
    }

    return {
        categories: summary.categories.slice(0, 5),
        products: summary.products.slice(0, 5)
    };
}

function buildSalesBreakdownMarkup(entries, emptyLabel, includeCategory = false) {
    if (!entries.length) {
        return `<div class="sales-summary-breakdown-note">${escapeHtml(emptyLabel)}</div>`;
    }

    return `
        <div class="sales-summary-breakdown-list">
            ${entries.map((entry) => `
                <div class="sales-summary-breakdown-row">
                    <div>
                        <strong>${escapeHtml(entry.name)}</strong>
                        <span>${escapeHtml(`${entry.quantity} uds · ${entry.orderCount} pedido(s)${includeCategory && entry.categoryName ? ` · ${entry.categoryName}` : ''}`)}</span>
                    </div>
                    <em>${escapeHtml(formatMoney(entry.amount))}</em>
                </div>
            `).join('')}
        </div>
    `;
}

function buildOrderWhatsAppLink(order) {
    const digits = String(order.customerPhoneDigits || order.customerPhone || '').replace(/\D+/g, '');
    if (!digits) {
        return '';
    }

    const message = encodeURIComponent(`Hola ${order.customerName || ''}, te escribimos desde ROAL BURGER por tu pedido ${order.code}.`);
    return `https://wa.me/${digits}?text=${message}`;
}

async function copyTextToClipboard(text) {
    const normalizedText = String(text || '');
    if (!normalizedText) {
        return false;
    }

    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(normalizedText);
        showClipboardToast('Copiado');
        return true;
    }

    const textarea = document.createElement('textarea');
    textarea.value = normalizedText;
    textarea.setAttribute('readonly', 'true');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    textarea.style.pointerEvents = 'none';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    try {
        const copied = document.execCommand('copy');
        if (copied) {
            showClipboardToast('Copiado');
        }
        return copied;
    } finally {
        textarea.remove();
    }
}

function buildCourierRequestMessage(order) {
    const address = String(order.deliveryAddress || 'sin direccion registrada').trim();
    return `Buenas, me mandas un domiciliario porfavor, va para ${address}`;
}

function buildOrderItemSummary(order) {
    if (!Array.isArray(order.items) || !order.items.length) {
        return 'Sin productos registrados';
    }

    return order.items.map((item) => {
        const parts = [`${Number(item.quantity || 0)} x ${String(item.productName || 'Producto').trim()}`];
        if (item.categoryName) {
            parts.push(`Categoria: ${String(item.categoryName).trim()}`);
        }
        if (item.optionLabel) {
            parts.push(`Detalle: ${String(item.optionLabel).trim()}`);
        }
        if (item.note) {
            parts.push(`Nota: ${String(item.note).trim()}`);
        }
        return `- ${parts.join(' | ')}`;
    }).join('\n');
}

function getOrderPaymentLabel(order) {
    if (order.paymentMethod === 'transferencia') {
        return 'Transferencia llave / breve';
    }

    if (order.paymentMethod === 'efectivo') {
        if (order.cashChangeRequired && Number.isFinite(Number(order.cashTenderAmount))) {
            return `Efectivo | Paga con ${formatMoney(order.cashTenderAmount)}`;
        }

        return 'Efectivo | Tiene completo';
    }

    return 'Sin medio de pago registrado';
}

function buildReceivedOrderMessage(order) {
    const customerName = String(order.customerName || 'cliente').trim() || 'cliente';
    const deliveryLabel = order.orderType === 'domicilio'
        ? (String(order.deliveryAddress || 'Sin direccion registrada').trim() || 'Sin direccion registrada')
        : 'Recoge en el local';
    const phoneLabel = String(order.customerPhone || 'No registrado').trim() || 'No registrado';
    const itemsLabel = buildOrderItemSummary(order);
    const totalLabel = formatMoney(getOrderDisplayTotal(order));
    const paymentLabel = getOrderPaymentLabel(order);

    return `Hola ${customerName} soy Johan Rojas tu asesor del dia de hoy, me confirmas que este todo correcto por favor.

Nombre: ${customerName}
Direccion: ${deliveryLabel}
Telefono: ${phoneLabel}
Pedido:
${itemsLabel}
Total a pagar: ${totalLabel}
Medio de pago: ${paymentLabel}

Quedo atento para poder procesar tu pedido.`;
}

function buildDeliveredOrderMessage(order) {
    const customerName = String(order.customerName || 'cliente').trim() || 'cliente';
    return `Hola ${customerName} tu pedido ya va en camino, que tengas muy buen provecho, te agradecemos por preferirnos, te esperamos pronto.

📲 Síguenos en nuestras redes sociales y entérate de promociones, nuevos productos y contenido brutal 🔥🍔

TikTok:
https://www.tiktok.com/@roalburger?_r=1&_t=ZS-94kgEkN4aEH

Instagram:
https://www.instagram.com/roalburgerarmenia?igsh=cWE2eGRyNnlxaXgy&utm_source=qr

Facebook:
https://www.facebook.com/share/1B9MGGXh6h/?mibextid=wwXIfr

ROAL Burger
Comida rápida con acento venezolano 🇻🇪🔥`;
}

function buildPickupReadyMessage(order) {
    const customerName = String(order.customerName || 'cliente').trim() || 'cliente';
    return `Hola ${customerName} tu pedido ya se encuentra listo para recoger.`;
}

function buildTicketAddressLines(order) {
    if (order.orderType !== 'domicilio') {
        return ['Retira en el local ROAL BURGER'];
    }

    return String(order.deliveryAddress || 'Sin direccion registrada')
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean);
}

function buildTicketCopyButton(label, value, options = {}) {
    const safeValue = String(value || '').trim();
    const safeLabel = escapeHtml(label);
    const safeDisplay = escapeHtml(options.displayValue || safeValue || 'No registrado');
    const safeCopyValue = escapeHtml(safeValue || 'No registrado');
    const className = options.className ? ` ${escapeHtml(options.className)}` : '';

    return `<button type="button" class="ticket-copy-btn${className}" data-order-ticket-action="copy" data-copy-label="${safeLabel}" data-copy-value="${safeCopyValue}">${safeDisplay}</button>`;
}

function escapeVCardValue(value) {
    return String(value || '')
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\r?\n/g, '\\n');
}

function getOrderContactAddress(order) {
    return [
        order.deliveryAddress,
        order.customerAddress,
        order.profileAddress
    ].map((value) => String(value || '').trim()).find(Boolean) || '';
}

function buildOrderContactVCard(order) {
    const customerName = String(order.customerName || 'Cliente ROAL BURGER').trim() || 'Cliente ROAL BURGER';
    const phoneDigits = normalizePhoneDigits(order.customerPhoneDigits || order.customerPhone || '');
    const displayPhone = phoneDigits ? `+${phoneDigits.startsWith('57') ? phoneDigits : `57${phoneDigits}`}` : String(order.customerPhone || '').trim();
    const address = getOrderContactAddress(order);
    const orderCode = String(order.code || '').trim();
    const paymentLabel = getOrderPaymentLabel(order);
    const noteParts = [
        'Cliente ROAL BURGER',
        orderCode ? `Pedido ${orderCode}` : '',
        paymentLabel || '',
        displayPhone ? `Telefono ${displayPhone}` : '',
        address ? `Direccion ${address}` : ''
    ].filter(Boolean);

    return [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `FN:${escapeVCardValue(customerName)}`,
        `N:${escapeVCardValue(customerName)};;;;`,
        `ORG:${escapeVCardValue('ROAL BURGER')}`,
        displayPhone ? `TEL;TYPE=CELL:${escapeVCardValue(displayPhone)}` : '',
        address ? `ADR;TYPE=HOME:;;${escapeVCardValue(address)};;;;` : '',
        `NOTE:${escapeVCardValue(noteParts.join(' | '))}`,
        'END:VCARD'
    ].filter(Boolean).join('\r\n');
}

function isMobileContactImportContext() {
    const userAgent = navigator.userAgent || '';
    return /Android|iPhone|iPad|iPod/i.test(userAgent) || window.matchMedia('(max-width: 768px)').matches;
}

function openOrderContactCard(orderId) {
    const order = ordersState.find((entry) => entry.id === orderId);
    if (!order) {
        throw new Error('No se encontro el pedido para crear el contacto.');
    }

    const vcard = buildOrderContactVCard(order);
    const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const customerSlug = normalizePhoneDigits(order.customerPhoneDigits || order.customerPhone || '') || order.id;

    link.href = blobUrl;
    link.rel = 'noopener';

    if (!isMobileContactImportContext()) {
        link.download = `contacto-${customerSlug}.vcf`;
    }

    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(blobUrl), 30000);
}

function buildThermalTicketMarkup(order, options = {}) {
    const printMode = options.printMode === true;
    const whatsappLink = buildOrderWhatsAppLink(order);
    const statusMeta = getOrderStatusMeta(order.status);
    const totalAmount = getOrderDisplayTotal(order);
    const deliveryText = formatMoney(order.deliveryFee != null ? order.deliveryFee : 0);
    const totalText = formatMoney(totalAmount);
    const restaurantName = escapeHtml(brandingState.restaurantName || 'ROAL BURGER');
    const orderDate = escapeHtml(formatOrderDate(order.createdAt));
    const orderHour = escapeHtml(formatOrderTime(order.createdAt));
    const elapsed = escapeHtml(formatElapsedTime(order.createdAt));
    const paymentLabel = getOrderPaymentLabel(order);
    const [paymentMethod, paymentDetail] = paymentLabel.split(' | ');
    const cashGiven = Number(order.cashTenderAmount || 0);
    const changeAmount = order.cashChangeRequired && cashGiven > totalAmount ? cashGiven - totalAmount : null;

    const addressLines = buildTicketAddressLines(order)
        .map((line) => `<div class="ticket-address-text">${buildTicketCopyButton('Direccion', line, {})}</div>`)
        .join('');

    const rows = order.items.map((item) => {
        const detailParts = [
            item.categoryName,
            item.optionLabel,
            item.note ? `Nota: ${item.note}` : '',
            Number(item.unitPrice || 0) > 0 ? `Unit ${formatMoney(item.unitPrice)}` : ''
        ].filter(Boolean);

        return `
            <tr>
                <td>
                    <strong>${escapeHtml(`${item.quantity} x ${item.productName}`)}</strong>
                    ${detailParts.map((p) => `<span class="ticket-line-meta">${escapeHtml(p)}</span>`).join('')}
                </td>
                <td>${escapeHtml(formatMoney(item.subtotal))}</td>
            </tr>
        `;
    }).join('');

    return `
        <div class="ticket-paper-wrap">
            <article class="ticket-paper" data-ticket-print-root="true">
                <div class="ticket-brand">
                    <div class="ticket-brand-name">${restaurantName}</div>
                    <div class="ticket-brand-copy">Ticket de recepcion</div>
                    <div class="ticket-order-meta">
                        <span>${escapeHtml(order.code)}</span>
                        <span>${orderHour}</span>
                    </div>
                    <div class="ticket-order-meta">
                        <span>${orderDate}</span>
                        <span>${elapsed}</span>
                    </div>
                </div>

                <section class="ticket-section">
                    <div class="ticket-section-title">Cliente</div>
                    <div class="ticket-customer-card">
                        ${buildTicketCopyButton('Cliente', order.customerName || 'Cliente sin nombre', { displayValue: order.customerName || 'Cliente sin nombre', className: 'ticket-copy-btn-name' })}
                        <div class="ticket-customer-row">
                            <span>Telefono</span>
                            ${buildTicketCopyButton('Telefono', order.customerPhone || 'No registrado', { className: 'ticket-copy-btn-inline' })}
                        </div>
                        <div class="ticket-customer-row">
                            <span>Tipo</span>
                            <span>${escapeHtml(getOrderTypeLabel(order))}</span>
                        </div>
                        <div class="ticket-customer-row">
                            <span>Estado</span>
                            <span class="state-pill ${escapeHtml(statusMeta.className)}">${escapeHtml(statusMeta.label)}</span>
                        </div>
                        <div class="ticket-customer-row">
                            <span>Pago</span>
                            <span>${escapeHtml(paymentMethod)}${paymentDetail ? `<span class="ticket-line-meta">${escapeHtml(paymentDetail)}</span>` : ''}</span>
                        </div>
                    </div>
                </section>

                <section class="ticket-section">
                    <div class="ticket-section-title">${order.orderType === 'domicilio' ? 'Direccion de entrega' : 'Retiro en local'}</div>
                    <div class="ticket-address-block">
                        ${addressLines}
                        ${whatsappLink ? `<a class="ticket-wa-btn" href="${whatsappLink}" target="_blank" rel="noopener noreferrer">💬 Abrir WhatsApp</a>` : ''}
                    </div>
                </section>

                <section class="ticket-section">
                    <div class="ticket-section-title">Detalle del pedido</div>
                    <table class="ticket-table">
                        <thead>
                            <tr>
                                <th>Producto</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                </section>

                <section class="ticket-total">
                    <div class="ticket-summary-line ticket-total-row">
                        <span>Subtotal</span>
                        <strong>${escapeHtml(formatMoney(order.subtotal))}</strong>
                    </div>
                    ${order.orderType === 'domicilio' ? `
                    <div class="ticket-summary-line ticket-total-row">
                        <span>Domicilio</span>
                        <strong>${escapeHtml(deliveryText)}</strong>
                    </div>
                    ` : ''}
                    <div class="ticket-summary-line ticket-total-row is-grand-total">
                        <span>Total</span>
                        <strong>${escapeHtml(totalText)}</strong>
                    </div>
                    ${changeAmount !== null ? `
                    <div class="ticket-summary-line ticket-total-row ticket-change-row">
                        <span>Cambio</span>
                        <strong>${escapeHtml(formatMoney(changeAmount))}</strong>
                    </div>
                    ` : ''}
                </section>

                <div class="ticket-footer-copy">
                    <span>Gracias por elegir ${restaurantName}</span>
                    <span>${escapeHtml(brandingState.address || 'ROAL BURGER')}</span>
                </div>
            </article>
            ${printMode ? '' : `
                <div class="ticket-print-row">
                    <button type="button" class="ticket-print-btn ticket-action-btn" data-order-ticket-action="print" data-order-id="${order.id}">Imprimir</button>
                    <button type="button" class="ticket-contact-btn ticket-action-btn" data-order-ticket-action="contact" data-order-id="${order.id}">Agregar contacto</button>
                </div>
            `}
        </div>
    `;
}

function renderEmptyOrderTicket() {
    if (!orderTicketBody) {
        return;
    }

    orderTicketBody.innerHTML = `
        <div class="ticket-empty">
            <div>
                <strong>Selecciona un pedido</strong>
                <p>La orden cargada aqui se convertira en un ticket termico listo para la impresora del negocio.</p>
            </div>
        </div>
    `;
}

function renderOrderTicket(order, options = {}) {
    if (!orderTicketBody) {
        return;
    }

    if (!order) {
        renderEmptyOrderTicket();
        return;
    }

    orderTicketBody.innerHTML = buildThermalTicketMarkup(order);

    if (options.openMobile === true) {
        openMobileTicketPanel();
    }
}

function renderKanbanEmptyState(container) {
    if (!container) {
        return;
    }

    container.innerHTML = '<div class="kanban-empty">Sin pedidos</div>';
}

function createOrderCard(order) {
    const card = document.createElement('article');
    card.className = 'kanban-order-card';
    const statusMeta = getOrderStatusMeta(order.status);
    if (order.status === 'pendiente' || order.status === 'esperando_domiciliario') {
        card.classList.add('is-attention');
    }
    if (order.id === selectedOrderId) {
        card.classList.add('is-selected');
    }

    card.dataset.orderId = order.id;

    if (order.status === 'entregado') {
        card.classList.add('kanban-order-card-compact');
        card.innerHTML = `
            <div class="kanban-order-compact-row">
                <span class="kanban-order-name">${escapeHtml(order.customerName || 'Cliente sin nombre')}</span>
                <span class="order-wait-timer">${escapeHtml(formatLiveDuration(order.deliveredAt || order.updatedAt || order.createdAt))}</span>
                <button type="button" class="order-action-btn order-action-btn-view" data-order-card-action="view_ticket" data-order-id="${order.id}">Ver ticket</button>
            </div>
        `;
        return card;
    }

    const isDeliveryOrder = order.orderType === 'domicilio';
    const isPickupOrder = order.orderType === 'retiro';
    const isUnreadOrder = order.status === 'pendiente';
    const showReceiveAction = isUnreadOrder;
    const showDeliveryAction = !isUnreadOrder && isDeliveryOrder && order.status !== 'esperando_domiciliario' && order.status !== 'camino' && order.status !== 'entregado';
    const showPickupReadyAction = !isUnreadOrder && isPickupOrder && order.status !== 'listo_recoger' && order.status !== 'entregado';
    const showDeliveredAction = !isUnreadOrder && order.status !== 'entregado';
    const showDeleteAction = order.status !== 'entregado';
    const waitingBadge = order.status === 'esperando_domiciliario'
        ? `
            <div class="kanban-order-status-row">
                <span class="state-pill ${statusMeta.className}">${escapeHtml(statusMeta.label)}</span>
                <span class="order-wait-timer">${escapeHtml(formatLiveDuration(order.courierRequestedAt || order.updatedAt || order.createdAt))}</span>
            </div>
        `
        : (order.status === 'listo_recoger'
            ? `
                <div class="kanban-order-status-row">
                    <span class="state-pill ${statusMeta.className}">${escapeHtml(statusMeta.label)}</span>
                </div>
            `
            : '');
    const showViewTicketAction = isMobileAdminViewport();
    const actionsMarkup = order.id === selectedOrderId
        ? `
            <div class="kanban-order-actions">
                ${showViewTicketAction ? `<button type="button" class="order-action-btn order-action-btn-view" data-order-card-action="view_ticket" data-order-id="${order.id}">Ver ticket</button>` : ''}
                ${showReceiveAction ? `<button type="button" class="order-action-btn order-action-btn-receive" data-order-card-action="recibir_pedido" data-order-id="${order.id}">Recibir pedido</button>` : ''}
                ${showPickupReadyAction ? `<button type="button" class="order-action-btn order-action-btn-ready" data-order-card-action="listo_recoger" data-order-id="${order.id}">Pedido listo</button>` : ''}
                ${showDeliveryAction ? `<button type="button" class="order-action-btn" data-order-card-action="esperando_domiciliario" data-order-id="${order.id}">Pedir domiciliario</button>` : ''}
                ${showDeliveredAction ? `<button type="button" class="order-action-btn order-action-btn-delivered" data-order-card-action="entregado" data-order-id="${order.id}">Pedido entregado</button>` : ''}
                ${showDeleteAction ? `<button type="button" class="order-action-btn order-action-btn-delete" data-order-card-action="eliminar" data-order-id="${order.id}">Eliminar pedido</button>` : ''}
            </div>
        `
        : '';

    card.innerHTML = `
        <div class="kanban-order-top">
            <strong class="kanban-order-code">#Pedido ${escapeHtml(order.code)}</strong>
            <span class="kanban-order-time">${escapeHtml(formatElapsedTime(order.createdAt))}</span>
        </div>
        <div class="kanban-order-name">${escapeHtml(order.customerName || 'Cliente sin nombre')}</div>
        <div class="kanban-order-bottom">
            <span class="kanban-order-type">${escapeHtml(getOrderTypeLabel(order))}</span>
            <span class="kanban-order-total">${escapeHtml(formatMoney(getOrderDisplayTotal(order)))}</span>
        </div>
        ${waitingBadge}
        ${actionsMarkup}
    `;

    return card;
}

function renderOrders() {
    if (!ordersBoard) {
        return;
    }

    const columns = {
        unread: { container: ordersColumnUnread, count: ordersCountUnread, items: [] },
        takeaway: { container: ordersColumnTakeaway, count: ordersCountTakeaway, items: [] },
        delivery: { container: ordersColumnDelivery, count: ordersCountDelivery, items: [] }
    };

    ordersState.forEach((order) => {
        columns[getOrderColumnKey(order)].items.push(order);
    });

    Object.values(columns).forEach((column) => {
        if (column.count) {
            column.count.textContent = Number(column.items.length).toLocaleString('es-CO');
        }

        if (!column.container) {
            return;
        }

        column.container.innerHTML = '';
        if (!column.items.length) {
            renderKanbanEmptyState(column.container);
            return;
        }

        column.items.forEach((order) => {
            column.container.appendChild(createOrderCard(order));
        });
    });

    const selectedOrder = ordersState.find((order) => order.id === selectedOrderId) || null;
    if (!selectedOrder) {
        selectedOrderId = null;
        closeMobileTicketPanel();
    }

    renderOrderTicket(selectedOrder);
    applyMobileOrdersLane();
    updateOrdersAttentionState();
    renderSalesDayBanner();
}

function renderSalesDayBanner() {
    const deliveredOrders = getDeliveredOrdersForCurrentDay();
    const deliveredTotal = deliveredOrders.reduce((sum, order) => sum + Number(getOrderDisplayTotal(order) || 0), 0);

    if (salesDayStatusLabel) {
        salesDayStatusLabel.textContent = salesDayState?.openedAt ? 'Jornada activa' : 'Jornada en preparacion';
    }

    if (salesDayStatusMeta) {
        salesDayStatusMeta.textContent = salesDayState?.openedAt
            ? `Apertura: ${formatDateTime(salesDayState.openedAt)}`
            : 'Se abrira automaticamente al sincronizar.';
    }

    if (salesDayDeliveredCount) {
        salesDayDeliveredCount.textContent = `${deliveredOrders.length} entregados`;
    }

    if (salesDayDeliveredTotal) {
        salesDayDeliveredTotal.textContent = formatMoney(deliveredTotal);
    }

    if (closeSalesDayBtn) {
        closeSalesDayBtn.disabled = deliveredOrders.length === 0;
        closeSalesDayBtn.textContent = deliveredOrders.length
            ? `Cierre del dia (${deliveredOrders.length})`
            : 'Cierre del dia';
    }
}

function renderSalesSummaries() {
    syncSalesSummaryFilterOptions();

    const type = String(salesSummaryFilterType?.value || 'all');
    const value = String(salesSummaryFilterValue?.value || '');
    const filteredSummaries = salesSummariesState.filter((summary) => summaryMatchesDateRange(summary) && summaryMatchesFilter(summary, type, value));

    const totalAmount = filteredSummaries.reduce((sum, summary) => sum + Number(summary.totalSales || 0), 0);
    const totalOrders = filteredSummaries.reduce((sum, summary) => sum + Number(summary.totalOrders || 0), 0);

    if (salesSummaryTotalAmount) {
        salesSummaryTotalAmount.textContent = formatMoney(totalAmount);
    }

    if (salesSummaryTotalOrders) {
        salesSummaryTotalOrders.textContent = Number(totalOrders).toLocaleString('es-CO');
    }

    if (salesSummaryTotalDays) {
        salesSummaryTotalDays.textContent = Number(filteredSummaries.length).toLocaleString('es-CO');
    }

    if (!salesSummaryList) {
        return;
    }

    if (!filteredSummaries.length) {
        salesSummaryList.innerHTML = '<div class="sales-summary-empty">No hay cierres del dia que coincidan con ese filtro.</div>';
        return;
    }

    salesSummaryList.innerHTML = filteredSummaries.map((summary, index) => {
        const breakdown = getSalesSummaryBreakdown(summary, type, value);
        const title = `Cierre ${filteredSummaries.length - index}`;
        return `
            <article class="sales-summary-card">
                <div class="sales-summary-card-head">
                    <div>
                        <strong>${escapeHtml(title)}</strong>
                        <p>${escapeHtml(`${formatOrderDate(summary.closedAt)} · Apertura ${formatOrderTime(summary.openedAt)} · Cierre ${formatOrderTime(summary.closedAt)}`)}</p>
                    </div>
                    <span class="sales-summary-badge">${escapeHtml(formatMoney(summary.totalSales))}</span>
                </div>
                <div class="sales-summary-meta">
                    <span>${escapeHtml(`Abierto: ${formatDateTime(summary.openedAt)}`)}</span>
                    <span>${escapeHtml(`Cerrado: ${formatDateTime(summary.closedAt)}`)}</span>
                </div>
                <div class="sales-summary-metrics">
                    <div class="sales-summary-metric">
                        <span>Pedidos</span>
                        <strong>${escapeHtml(String(summary.totalOrders))}</strong>
                    </div>
                    <div class="sales-summary-metric">
                        <span>Items</span>
                        <strong>${escapeHtml(String(summary.totalItems))}</strong>
                    </div>
                    <div class="sales-summary-metric">
                        <span>Llevar</span>
                        <strong>${escapeHtml(formatMoney(summary.takeawaySales))}</strong>
                    </div>
                    <div class="sales-summary-metric">
                        <span>Domicilios</span>
                        <strong>${escapeHtml(formatMoney(summary.deliverySales))}</strong>
                    </div>
                </div>
                <div class="sales-summary-breakdown">
                    <section class="sales-summary-panel">
                        <h3>Categorias</h3>
                        ${buildSalesBreakdownMarkup(breakdown.categories, 'No hubo ventas para esta categoria en el cierre.', false)}
                    </section>
                    <section class="sales-summary-panel">
                        <h3>Productos</h3>
                        ${buildSalesBreakdownMarkup(breakdown.products, 'No hubo ventas para este producto en el cierre.', true)}
                    </section>
                </div>
            </article>
        `;
    }).join('');
}

function renderLedgerBook() {
    const entries = getFilteredLedgerEntries();
    const totalIncome = entries.reduce((sum, entry) => sum + Number(entry.totalSales || 0), 0);
    const totalEntries = entries.length;
    const averageIncome = totalEntries ? totalIncome / totalEntries : 0;

    if (ledgerBookTotalIncome) {
        ledgerBookTotalIncome.textContent = formatMoney(totalIncome);
    }

    if (ledgerBookTotalEntries) {
        ledgerBookTotalEntries.textContent = Number(totalEntries).toLocaleString('es-CO');
    }

    if (ledgerBookAverageIncome) {
        ledgerBookAverageIncome.textContent = formatMoney(averageIncome);
    }

    if (!ledgerBookList) {
        return;
    }

    if (!entries.length) {
        ledgerBookList.innerHTML = '<tr><td class="client-empty-row" colspan="4">No hay cierres disponibles para el libro contable.</td></tr>';
        return;
    }

    ledgerBookList.innerHTML = entries.map((entry) => {
        return `
            <tr>
                <td>${escapeHtml(formatDateTime(entry.closedAt))}</td>
                <td>${escapeHtml(String(entry.totalOrders || 0))}</td>
                <td>${escapeHtml(String(entry.totalItems || 0))}</td>
                <td><strong>${escapeHtml(formatMoney(entry.totalSales || 0))}</strong></td>
            </tr>
        `;
    }).join('');
}

function getLedgerExportColumns() {
    return [
        { key: 'fecha', label: 'Fecha' },
        { key: 'pedidos', label: 'Pedidos' },
        { key: 'items', label: 'Items' },
        { key: 'ventas_total', label: 'Ventas total' }
    ];
}

function buildLedgerExportRows(entries) {
    return entries.map((entry) => ({
        fecha: formatExportDate(entry.closedAt),
        pedidos: Number(entry.totalOrders || 0),
        items: Number(entry.totalItems || 0),
        ventas_total: Number(entry.totalSales || 0)
    }));
}

function exportLedgerBook(format) {
    const entries = getFilteredLedgerEntries();
    if (!entries.length) {
        showNotice('No hay cierres en el libro para exportar con el filtro actual.', 'error');
        return;
    }

    const rows = buildLedgerExportRows(entries);
    const columns = getLedgerExportColumns();
    const headers = columns.map((column) => column.key);
    const headerLabels = columns.map((column) => column.label);
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    const formatKey = String(format || 'csv').trim().toLowerCase();
    const fromLabel = String(ledgerBookDateFrom?.value || '').trim();
    const toLabel = String(ledgerBookDateTo?.value || '').trim();
    const subtitle = fromLabel || toLabel
        ? `Periodo filtrado: ${fromLabel || 'inicio'} a ${toLabel || 'hoy'}.`
        : 'Periodo: todos los cierres registrados.';

    if (formatKey === 'pdf') {
        const printableHtml = buildClientExportHtmlDocument(rows, columns, {
            title: 'Libro contable',
            subtitle: `${subtitle} Usa Guardar como PDF en la ventana de impresion.`
        });
        printClientExportPdf(printableHtml);
        showNotice(`Vista lista para exportar ${rows.length} cierres en PDF.`, 'ok');
        return;
    }

    const csvContent = [
        headerLabels.join(','),
        ...rows.map((row) => headers.map((header) => {
            const rawValue = String(row[header] ?? '');
            return `"${rawValue.replace(/"/g, '""')}"`;
        }).join(','))
    ].join('\r\n');

    downloadExportFile(`libro-contable-${stamp}.csv`, csvContent, 'text/csv;charset=utf-8');
    showNotice(`Libro contable exportado en Excel/CSV (${rows.length}).`, 'ok');
}

async function closeCurrentSalesDay() {
    if (!firebaseDb) {
        throw new Error('Firestore no esta listo en el panel.');
    }

    const deliveredOrders = getDeliveredOrdersForCurrentDay();
    if (!deliveredOrders.length) {
        throw new Error('No hay pedidos entregados para cerrar en la jornada actual.');
    }

    if (!salesDayState?.openedAt) {
        await ensureActiveSalesDay();
        await fetchSalesDayState();
    }

    const closedAt = firestoreNow();
    const openedAt = salesDayState?.openedAt || closedAt;
    const closureId = `cierre_${Date.now()}`;
    const totalSales = deliveredOrders.reduce((sum, order) => sum + Number(getOrderDisplayTotal(order) || 0), 0);
    const confirmed = window.confirm(`Vas a cerrar el dia con ${deliveredOrders.length} pedido(s) entregado(s) por ${formatMoney(totalSales)}. Esta accion movera esas ventas al resumen y abrira una nueva jornada. Deseas continuar?`);
    if (!confirmed) {
        return false;
    }

    const batch = firebaseDb.batch();
    batch.set(
        firebaseDb.collection(SALES_SUMMARY_COLLECTION).doc(closureId),
        buildSalesSummaryPayload(deliveredOrders, openedAt, closedAt)
    );

    deliveredOrders.forEach((order) => {
        batch.delete(firebaseDb.collection(ORDERS_COLLECTION).doc(order.id));
    });

    batch.set(
        firebaseDb.collection(SALES_DAY_STATE_COLLECTION).doc(SALES_DAY_STATE_DOC_ID),
        {
            openedAt: closedAt,
            status: 'active',
            updatedAt: closedAt,
            lastClosedAt: closedAt,
            lastClosureId: closureId
        },
        { merge: true }
    );

    await batch.commit();
    return true;
}

function renderClients() {
    if (!clientsList) {
        return;
    }

    if (clientsCount) {
        clientsCount.textContent = Number(clientsState.length).toLocaleString('es-CO');
    }

    const filteredClients = getFilteredClients();

    clientsList.innerHTML = '';

    if (!filteredClients.length) {
        clientsList.innerHTML = '<tr><td class="client-empty-row" colspan="9">No hay clientes que coincidan con la busqueda actual.</td></tr>';
        return;
    }

    filteredClients.forEach((client) => {
        const row = document.createElement('tr');
        row.className = 'client-row';
        const extraAddresses = client.savedAddresses.slice(1);
        const hasExpandedAddresses = expandedClientAddressIds.has(client.id);
        row.innerHTML = `
            <td>
                <div class="client-name-cell">
                    <strong>${escapeHtml(client.customerName)}</strong>
                    <span>${escapeHtml(client.id)}</span>
                </div>
            </td>
            <td>${escapeHtml(client.customerPhone)}</td>
            <td class="client-address-cell">
                <strong class="client-address-primary">${escapeHtml(client.address)}</strong>
                ${extraAddresses.length ? `
                    <button type="button" class="client-address-toggle" data-client-toggle-addresses="${escapeHtml(client.id)}" aria-expanded="${hasExpandedAddresses ? 'true' : 'false'}">
                        ${hasExpandedAddresses ? 'Ocultar direcciones' : `Ver ${extraAddresses.length} direccion(es) mas`}
                    </button>
                ` : '<span class="client-address-muted">Solo direccion principal</span>'}
            </td>
            <td>${escapeHtml(formatOrderDate(client.firstOrderAt))}</td>
            <td>${escapeHtml(formatOrderDate(client.lastOrderAt))}</td>
            <td><span class="client-metric-chip">${escapeHtml(String(client.totalOrders))}</span></td>
            <td>${escapeHtml(formatMoney(client.totalSpent))}</td>
            <td>
                <div class="client-name-cell">
                    <strong>${escapeHtml(client.lastOrderCode || 'Sin codigo')}</strong>
                    <span>${escapeHtml(formatMoney(client.lastOrderTotal || 0))}</span>
                </div>
            </td>
            <td>
                <div class="client-actions">
                    <button type="button" class="client-action-btn" data-client-action="edit" data-client-id="${escapeHtml(client.id)}">Editar</button>
                    <button type="button" class="client-action-btn delete" data-client-action="delete" data-client-id="${escapeHtml(client.id)}">Eliminar</button>
                </div>
            </td>
        `;
        clientsList.appendChild(row);

        if (extraAddresses.length && hasExpandedAddresses) {
            const detailRow = document.createElement('tr');
            detailRow.className = 'client-address-detail-row';
            detailRow.innerHTML = `
                <td colspan="9">
                    <div class="client-address-detail-box">
                        <strong>Direcciones guardadas</strong>
                        <div class="client-address-detail-list">
                            ${client.savedAddresses.map((address, index) => `
                                <span class="client-address-detail-chip${index === 0 ? ' is-primary' : ''}">
                                    ${escapeHtml(index === 0 ? `Principal: ${address}` : address)}
                                </span>
                            `).join('')}
                        </div>
                    </div>
                </td>
            `;
            clientsList.appendChild(detailRow);
        }
    });
}

function renderMessages() {
    if (!messagesList) {
        return;
    }

    if (messagesCount) {
        messagesCount.textContent = Number(messagesState.length).toLocaleString('es-CO');
    }

    messagesList.innerHTML = '';

    if (!messagesState.length) {
        messagesList.innerHTML = `
            <div class="message-request-card">
                <div class="message-request-body">
                    <p>Aun no hay mensajes o solicitudes registrados.</p>
                </div>
            </div>
        `;
        return;
    }

    messagesState.forEach((message) => {
        const isResolved = message.status === 'resolved';
        const canResetPassword = message.type === 'password_reset_request' && message.customerPhoneDigits;
        const canReply = Boolean(message.customerPhoneDigits) && message.type !== 'admin_direct_reply';
        const card = document.createElement('div');
        card.className = `message-request-card${isResolved ? ' is-resolved' : ''}`;
        card.innerHTML = `
            <div class="message-request-head">
                <div>
                    <strong>${escapeHtml(message.subject)}</strong>
                    <span>${escapeHtml(message.customerName)} · ${escapeHtml(message.customerPhone)}</span>
                </div>
                <span class="message-status-chip ${isResolved ? 'resolved' : 'pending'}">${escapeHtml(isResolved ? 'Atendido' : 'Pendiente')}</span>
            </div>
            <div class="message-request-meta">
                <span>Tipo: ${escapeHtml(message.type)}</span>
                <span>Fecha: ${escapeHtml(formatOrderDate(message.createdAt))}</span>
                <span>Origen: ${escapeHtml(message.source)}</span>
                ${message.customerAddress ? `<span>Direccion: ${escapeHtml(message.customerAddress)}</span>` : ''}
                ${message.readBy ? `<span>Leido por: ${escapeHtml(message.readBy)}</span>` : ''}
                ${message.resolvedBy ? `<span>Atendido por: ${escapeHtml(message.resolvedBy)}</span>` : ''}
            </div>
            <div class="message-request-body">
                <p>${escapeHtml(message.body || 'Sin detalle adicional.')}</p>
            </div>
            <div class="message-request-actions">
                <button type="button" class="message-request-btn" data-message-action="copy" data-message-id="${escapeHtml(message.id)}">Copiar mensaje</button>
                <button type="button" class="message-request-btn primary" data-message-action="whatsapp" data-message-id="${escapeHtml(message.id)}">Abrir WhatsApp</button>
                ${canReply ? `<button type="button" class="message-request-btn" data-message-action="reply" data-message-id="${escapeHtml(message.id)}">Responder</button>` : ''}
                ${canResetPassword ? `<button type="button" class="message-request-btn primary" data-message-action="reset-password" data-message-id="${escapeHtml(message.id)}">Resetear contrasena</button>` : ''}
                <button type="button" class="message-request-btn success" data-message-action="resolve" data-message-id="${escapeHtml(message.id)}">${isResolved ? 'Marcar pendiente' : 'Marcar atendido'}</button>
                <button type="button" class="message-request-btn delete" data-message-action="delete" data-message-id="${escapeHtml(message.id)}">Eliminar</button>
            </div>
        `;
        messagesList.appendChild(card);
    });
}

function getFilteredClients() {
    return clientsState.filter((client) => {
        if (!clientsSearchTerm) {
            return true;
        }

        const haystack = [
            client.customerName,
            client.customerPhone,
            client.address,
            client.lastOrderCode
        ].join(' | ');

        return normalizeCategoryKey(haystack).includes(clientsSearchTerm);
    });
}

function formatExportDate(value) {
    if (!value) {
        return '';
    }

    const date = typeof value.toDate === 'function' ? value.toDate() : new Date(value);
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
        return '';
    }

    return date.toISOString();
}

function buildCustomerContactWhatsAppUrl(name, phoneDigits, messageText) {
    if (!phoneDigits) {
        return '';
    }

    const greeting = String(messageText || `Hola ${name || 'cliente'}, te escribimos desde ROAL BURGER sobre tu solicitud.`).trim();
    return `https://wa.me/${phoneDigits}?text=${encodeURIComponent(greeting)}`;
}

function escapeXml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function getClientExportColumns() {
    return [
        { key: 'id', label: 'ID Cliente' },
        { key: 'nombre', label: 'Nombre' },
        { key: 'telefono', label: 'Telefono' },
        { key: 'telefono_digitos', label: 'Telefono Digitos' },
        { key: 'direccion', label: 'Direccion' },
        { key: 'primera_visita', label: 'Primera Visita' },
        { key: 'ultima_visita', label: 'Ultima Visita' },
        { key: 'total_pedidos', label: 'Total Pedidos' },
        { key: 'gasto_total', label: 'Gasto Total' },
        { key: 'ultimo_pedido_codigo', label: 'Ultimo Pedido Codigo' },
        { key: 'ultimo_pedido_total', label: 'Ultimo Pedido Total' },
        { key: 'creado_en', label: 'Creado En' },
        { key: 'actualizado_en', label: 'Actualizado En' }
    ];
}

function buildClientExportRows(clients) {
    return clients.map((client) => ({
        id: client.id,
        nombre: client.customerName,
        telefono: client.customerPhone,
        telefono_digitos: client.customerPhoneDigits,
        direccion: client.address,
        primera_visita: formatExportDate(client.firstOrderAt),
        ultima_visita: formatExportDate(client.lastOrderAt),
        total_pedidos: Number(client.totalOrders || 0),
        gasto_total: Number(client.totalSpent || 0),
        ultimo_pedido_codigo: client.lastOrderCode || '',
        ultimo_pedido_total: Number(client.lastOrderTotal || 0),
        creado_en: formatExportDate(client.createdAt),
        actualizado_en: formatExportDate(client.updatedAt)
    }));
}

function downloadExportFile(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
}

function buildClientExportHtmlDocument(rows, columns, options = {}) {
    const title = String(options.title || 'Clientes exportados').trim() || 'Clientes exportados';
    const subtitle = String(options.subtitle || '').trim();
    const generatedAt = new Intl.DateTimeFormat('es-CO', {
        dateStyle: 'medium',
        timeStyle: 'short'
    }).format(new Date());
    const tableRows = rows.map((row) => `
            <tr>${columns.map((column) => `<td>${escapeHtml(String(row[column.key] ?? ''))}</td>`).join('')}</tr>
        `).join('');

    return `<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <title>${escapeHtml(title)}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 24px; color: #111827; }
        h1 { margin-bottom: 8px; }
        p { margin: 4px 0 12px; color: #4b5563; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #d0d7de; padding: 8px; text-align: left; vertical-align: top; }
        th { background: #f3f4f6; }
        @media print {
            body { margin: 12mm; }
            h1 { font-size: 18pt; }
            table { font-size: 9pt; }
        }
    </style>
</head>
<body>
    <h1>${escapeHtml(title)}</h1>
    <p>Total: ${rows.length}</p>
    <p>Generado: ${escapeHtml(generatedAt)}</p>
    ${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ''}
    <table>
        <thead><tr>${columns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join('')}</tr></thead>
        <tbody>${tableRows}</tbody>
    </table>
</body>
</html>`;
}

function printClientExportPdf(htmlContent) {
    const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=1080,height=760');
    if (!printWindow) {
        throw new Error('El navegador bloqueo la ventana de impresion.');
    }

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    window.setTimeout(() => {
        printWindow.print();
    }, 250);
}

function exportClients(format, scope = 'filtered') {
    const scopeKey = String(scope || 'filtered').trim().toLowerCase();
    const selectedClients = scopeKey === 'all' ? [...clientsState] : getFilteredClients();
    if (!selectedClients.length) {
        showNotice(
            scopeKey === 'all'
                ? 'No hay clientes para exportar.'
                : 'No hay clientes para exportar con el filtro actual.',
            'error'
        );
        return;
    }

    const rows = buildClientExportRows(selectedClients);
    const columns = getClientExportColumns();
    const headers = columns.map((column) => column.key);
    const headerLabels = columns.map((column) => column.label);
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    const formatKey = String(format || 'csv').trim().toLowerCase();
    const scopeLabel = scopeKey === 'all' ? 'todos los clientes' : 'los clientes filtrados';

    if (formatKey === 'json') {
        downloadExportFile(`clientes-${stamp}.json`, JSON.stringify(rows, null, 2), 'application/json;charset=utf-8');
        showNotice(`Clientes exportados en JSON (${rows.length}).`, 'ok');
        return;
    }

    if (formatKey === 'txt') {
        const content = rows.map((row, index) => {
            return [
                `Cliente ${index + 1}`,
                ...headers.map((header) => `${header}: ${row[header] ?? ''}`)
            ].join('\r\n');
        }).join('\r\n\r\n');
        downloadExportFile(`clientes-${stamp}.txt`, content, 'text/plain;charset=utf-8');
        showNotice(`Clientes exportados en TXT (${rows.length}).`, 'ok');
        return;
    }

    if (formatKey === 'html') {
        const content = buildClientExportHtmlDocument(rows, columns, {
            title: 'Clientes exportados',
            subtitle: `Se exportaron ${scopeLabel}.`
        });
        downloadExportFile(`clientes-${stamp}.html`, content, 'text/html;charset=utf-8');
        showNotice(`Clientes exportados en HTML (${rows.length}).`, 'ok');
        return;
    }

    if (formatKey === 'xml') {
        const content = `<?xml version="1.0" encoding="UTF-8"?>\n<clientes>${rows.map((row) => `\n  <cliente>${headers.map((header) => `\n    <${header}>${escapeXml(row[header] ?? '')}</${header}>`).join('')}\n  </cliente>`).join('')}\n</clientes>\n`;
        downloadExportFile(`clientes-${stamp}.xml`, content, 'application/xml;charset=utf-8');
        showNotice(`Clientes exportados en XML (${rows.length}).`, 'ok');
        return;
    }

    if (formatKey === 'pdf') {
        const printableHtml = buildClientExportHtmlDocument(rows, columns, {
            title: 'Clientes exportados en PDF',
            subtitle: `Se exportaron ${scopeLabel}. Usa Guardar como PDF en la ventana de impresion.`
        });
        printClientExportPdf(printableHtml);
        showNotice(`Vista lista para exportar ${rows.length} clientes en PDF.`, 'ok');
        return;
    }

    const separator = formatKey === 'tsv' ? '\t' : ',';
    const extension = formatKey === 'tsv' ? 'tsv' : 'csv';
    const mimeType = formatKey === 'tsv' ? 'text/tab-separated-values;charset=utf-8' : 'text/csv;charset=utf-8';
    const csvContent = [
        headerLabels.join(separator),
        ...rows.map((row) => headers.map((header) => {
            const rawValue = String(row[header] ?? '');
            const escapedValue = rawValue.replace(/"/g, '""');
            return formatKey === 'tsv' ? escapedValue : `"${escapedValue}"`;
        }).join(separator))
    ].join('\r\n');

    downloadExportFile(`clientes-${stamp}.${extension}`, csvContent, mimeType);
    showNotice(`Clientes exportados en ${extension.toUpperCase()} (${rows.length}).`, 'ok');
}

function closeClientEditModal() {
    if (!clientEditModal || !clientEditForm) {
        return;
    }

    clientEditModal.classList.remove('show');
    clientEditModal.setAttribute('aria-hidden', 'true');
    clientEditForm.reset();
    activeClientEditId = null;
    hideModalFeedback(clientEditFeedback);

    if (clientEditSaveBtn) {
        clientEditSaveBtn.disabled = false;
        clientEditSaveBtn.textContent = 'Guardar cliente';
    }
}

function openCreateClientModal() {
    if (!clientEditModal) {
        return;
    }

    activeClientEditId = null;
    clientEditForm?.reset();
    hideModalFeedback(clientEditFeedback);
    if (clientModalTitle) {
        clientModalTitle.textContent = 'Agregar cliente';
    }
    if (clientEditSaveBtn) {
        clientEditSaveBtn.textContent = 'Guardar cliente';
        clientEditSaveBtn.disabled = false;
    }
    if (clientEditSavedAddressesInput) {
        clientEditSavedAddressesInput.value = '';
    }
    clientEditModal.classList.add('show');
    clientEditModal.setAttribute('aria-hidden', 'false');
    clientEditNameInput?.focus();
}

function openEditClientModal(client) {
    if (!clientEditModal || !client || !clientEditForm) {
        return;
    }

    activeClientEditId = client.id;
    hideModalFeedback(clientEditFeedback);
    if (clientModalTitle) {
        clientModalTitle.textContent = 'Editar cliente';
    }
    if (clientEditIdInput) {
        clientEditIdInput.value = client.id;
    }
    if (clientEditNameInput) {
        clientEditNameInput.value = client.customerName;
    }
    if (clientEditPhoneInput) {
        clientEditPhoneInput.value = client.customerPhone;
    }
    if (clientEditAddressInput) {
        clientEditAddressInput.value = client.address;
    }
    if (clientEditSavedAddressesInput) {
        clientEditSavedAddressesInput.value = client.savedAddresses.join('\n');
    }
    if (clientEditSaveBtn) {
        clientEditSaveBtn.textContent = 'Guardar cambios';
        clientEditSaveBtn.disabled = false;
    }

    clientEditModal.classList.add('show');
    clientEditModal.setAttribute('aria-hidden', 'false');
    clientEditNameInput?.focus();
}

async function deleteClient(clientId) {
    await firebaseDb.collection(CLIENTS_COLLECTION).doc(clientId).delete();
}

async function resetClientPasswordByPhone(phoneDigits) {
    const normalizedPhone = normalizePhoneDigits(phoneDigits);
    if (!normalizedPhone) {
        throw new Error('No se encontro un numero valido para resetear la contrasena.');
    }

    await firebaseDb.collection(CLIENTS_COLLECTION).doc(`phone_${normalizedPhone}`).set({
        passwordHash: '',
        updatedAt: firestoreNow()
    }, { merge: true });
}

function buildCustomerPasswordResetClipboardMessage(message = {}) {
    const customerName = String(message.customerName || 'cliente').trim();
    const customerPhone = String(message.customerPhone || message.customerPhoneDigits || '').trim();
    return [
        `Hola ${customerName}, tu contrasena de ROAL BURGER ya fue restablecida.`,
        `Vuelve a pulsar "Olvido contrasena" e ingresa nuevamente tu numero de WhatsApp ${customerPhone}.`,
        'La app te mostrara la pantalla para crear tu nueva contrasena.'
    ].join('\n');
}

async function createAdminDirectReply(message = {}, body = '') {
    const replyBody = String(body || '').trim();
    if (!replyBody) {
        throw new Error('Escribe una respuesta antes de enviarla.');
    }

    const adminIdentity = getCurrentAdminIdentity();
    await firebaseDb.collection(MESSAGES_COLLECTION).add({
        type: 'admin_direct_reply',
        status: 'resolved',
        subject: `Respuesta de ROAL BURGER para ${String(message.customerName || 'cliente').trim() || 'cliente'}`,
        body: replyBody,
        customerName: String(message.customerName || '').trim() || 'Cliente',
        customerPhone: String(message.customerPhone || message.customerPhoneDigits || '').trim(),
        customerPhoneDigits: String(message.customerPhoneDigits || '').trim(),
        customerAddress: String(message.customerAddress || '').trim(),
        source: 'admin_panel',
        createdAt: firestoreNow(),
        updatedAt: firestoreNow(),
        resolvedAt: firestoreNow(),
        resolvedBy: adminIdentity,
        readBy: adminIdentity,
        adminAction: 'direct_reply_sent'
    });
}

async function updateMessageRequest(messageId, updates) {
    await firebaseDb.collection(MESSAGES_COLLECTION).doc(messageId).set({
        ...updates,
        updatedAt: firestoreNow()
    }, { merge: true });
}

async function deleteMessageRequest(messageId) {
    await firebaseDb.collection(MESSAGES_COLLECTION).doc(messageId).delete();
}

async function updateOrder(orderId, updates) {
    await firebaseDb.collection(ORDERS_COLLECTION).doc(orderId).set({
        ...updates,
        updatedAt: firestoreNow()
    }, { merge: true });
}

async function deleteOrder(orderId) {
    await firebaseDb.collection(ORDERS_COLLECTION).doc(orderId).delete();
}

function openOrderPrintTicket(orderId) {
    const order = ordersState.find((entry) => entry.id === orderId);
    if (!order) {
        showNotice('No se encontro el pedido para imprimir.', 'error');
        return;
    }

    const printWindow = window.open('', '_blank', 'width=420,height=720');
    if (!printWindow) {
        showNotice('El navegador bloqueo la ventana de impresion.', 'error');
        return;
    }

    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <title>Ticket ${escapeHtml(order.code)}</title>
            <style>
                @page { margin: 8mm; }
                * { box-sizing: border-box; }
                body {
                    margin: 0;
                    background: #ffffff;
                    color: #171717;
                    font-family: 'Courier New', monospace;
                    padding: 0;
                }
                .ticket-paper-wrap {
                    width: 80mm;
                    margin: 0 auto;
                    display: block;
                }
                .ticket-paper {
                    position: relative;
                    background: #fff;
                    color: #171717;
                    border-radius: 0;
                    padding: 18px 14px 14px;
                    box-shadow: none;
                    overflow: hidden;
                }
                .ticket-paper::before,
                .ticket-paper::after {
                    content: '';
                    position: absolute;
                    left: 0;
                    width: 100%;
                    height: 12px;
                    background: radial-gradient(circle at 6px 6px, transparent 6px, #fff 6.5px);
                    background-size: 12px 12px;
                }
                .ticket-paper::before { top: -6px; }
                .ticket-paper::after { bottom: -6px; transform: rotate(180deg); }
                .ticket-brand {
                    text-align: center;
                    display: grid;
                    gap: 6px;
                    padding-bottom: 12px;
                    border-bottom: 1px dashed rgba(0, 0, 0, 0.3);
                }
                .ticket-brand-name {
                    font-size: 20px;
                    font-weight: 700;
                    letter-spacing: 1.2px;
                    text-transform: uppercase;
                }
                .ticket-brand-copy,
                .ticket-order-meta,
                .ticket-copy-muted,
                .ticket-line-meta,
                .ticket-footer-copy {
                    font-size: 11px;
                    color: #555;
                }
                .ticket-order-meta,
                .ticket-customer-row,
                .ticket-summary-line {
                    display: flex;
                    justify-content: space-between;
                    gap: 10px;
                }
                .ticket-section,
                .ticket-total {
                    display: grid;
                    gap: 7px;
                    padding-top: 12px;
                    border-top: 1px dashed rgba(0, 0, 0, 0.2);
                }
                .ticket-section-title {
                    font-size: 10px;
                    color: #666;
                    font-weight: 700;
                    letter-spacing: 1px;
                    text-transform: uppercase;
                }
                .ticket-customer-card {
                    display: grid;
                    gap: 8px;
                }
                .ticket-customer-name,
                .ticket-total-row.is-grand-total {
                    color: #111;
                    font-weight: 700;
                }
                .ticket-table {
                    width: 100%;
                    border-collapse: collapse;
                }
                .ticket-table th,
                .ticket-table td {
                    padding: 7px 0;
                    border-bottom: 1px dashed rgba(0, 0, 0, 0.18);
                    text-align: left;
                    vertical-align: top;
                    font-size: 12px;
                }
                .ticket-table th:last-child,
                .ticket-table td:last-child {
                    text-align: right;
                }
                .ticket-table th {
                    font-size: 10px;
                    color: #666;
                    text-transform: uppercase;
                    letter-spacing: 0.8px;
                }
                .ticket-line-meta {
                    display: block;
                    margin-top: 3px;
                }
                .ticket-contact-link,
                .ticket-print-row {
                    display: none !important;
                }
                .ticket-footer-copy {
                    text-align: center;
                    padding-top: 12px;
                    border-top: 1px dashed rgba(0, 0, 0, 0.2);
                    display: grid;
                    gap: 4px;
                }
            </style>
        </head>
        <body>
            ${buildThermalTicketMarkup(order, { printMode: true })}
            <script>
                window.addEventListener('load', function () {
                    window.print();
                });
            <\/script>
        </body>
        </html>
    `);

    printWindow.document.close();
    printWindow.focus();
}

function getMatchedProductForMetric(metricProductName) {
    const metricKey = normalizeCategoryKey(metricProductName);
    if (!metricKey) {
        return null;
    }

    const exact = productsState.find((product) => normalizeCategoryKey(product.nombre) === metricKey);
    if (exact) {
        return exact;
    }

    return productsState.find((product) => {
        const productKey = normalizeCategoryKey(product.nombre);
        return productKey.includes(metricKey) || metricKey.includes(productKey);
    }) || null;
}

function renderMiniRows(container, rows, emptyText) {
    if (!container) {
        return;
    }

    container.innerHTML = '';
    if (!rows.length) {
        const empty = document.createElement('p');
        empty.className = 'muted';
        empty.textContent = emptyText;
        container.appendChild(empty);
        return;
    }

    rows.forEach((rowData) => {
        const row = document.createElement('div');
        row.className = 'metrics-mini-row';

        const label = document.createElement('span');
        label.textContent = rowData.label;

        const value = document.createElement('strong');
        value.textContent = rowData.value;

        row.appendChild(label);
        row.appendChild(value);
        container.appendChild(row);
    });
}

function renderMetricsOverview() {
    const totalProducts = productsState.length;
    const activeProducts = productsState.filter((product) => product.estado === 'active').length;
    const pausedProducts = Math.max(0, totalProducts - activeProducts);
    const featuredProducts = productsState.filter((product) => product.es_destacado && product.estado === 'active').length;
    const activeCategories = categoriesState.filter((category) => category.active !== false).length;

    const pricedProducts = productsState.filter((product) => Number(product.precio) > 0);
    const averagePrice = pricedProducts.length
        ? pricedProducts.reduce((sum, product) => sum + Number(product.precio || 0), 0) / pricedProducts.length
        : 0;

    if (metricActiveProductsEl) {
        metricActiveProductsEl.textContent = Number(activeProducts).toLocaleString('es-CO');
    }
    if (metricPausedProductsEl) {
        metricPausedProductsEl.textContent = Number(pausedProducts).toLocaleString('es-CO');
    }
    if (metricFeaturedProductsEl) {
        metricFeaturedProductsEl.textContent = Number(featuredProducts).toLocaleString('es-CO');
    }
    if (metricActiveCategoriesEl) {
        metricActiveCategoriesEl.textContent = Number(activeCategories).toLocaleString('es-CO');
    }
    if (metricAveragePriceEl) {
        metricAveragePriceEl.textContent = averagePrice > 0 ? formatMoney(Math.round(averagePrice)) : '--';
    }
    if (metricWhatsappClicksEl) {
        metricWhatsappClicksEl.textContent = Number(metricsEventsState.whatsapp || 0).toLocaleString('es-CO');
    }
    if (metricDailyVisitorsEl) {
        metricDailyVisitorsEl.textContent = metricsEventsState.dailyVisitors > 0
            ? Number(metricsEventsState.dailyVisitors).toLocaleString('es-CO')
            : '--';
    }

    const clicksByCategory = new Map();
    productClicksState.forEach((item) => {
        const matched = getMatchedProductForMetric(item.product);
        const categoryName = matched?.categoria || 'Sin categoria';
        const key = normalizeCategoryKey(categoryName) || 'sin-categoria';
        const current = clicksByCategory.get(key) || { name: categoryName, clicks: 0 };
        current.clicks += Number(item.clicks || 0);
        clicksByCategory.set(key, current);
    });

    const categoryRows = Array.from(clicksByCategory.values())
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 6)
        .map((item) => ({
            label: item.name,
            value: Number(item.clicks).toLocaleString('es-CO')
        }));

    renderMiniRows(metricsCategoryList, categoryRows, 'Sin suficiente data por categoria.');

    const productsWithClicks = new Set(productClicksState.map((item) => normalizeCategoryKey(item.product))).size;
    const activeShare = totalProducts > 0 ? Math.round((activeProducts / totalProducts) * 100) : 0;
    const featuredShare = activeProducts > 0 ? Math.round((featuredProducts / activeProducts) * 100) : 0;
    const insights = [
        { label: 'Catalogo activo', value: `${activeShare}%` },
        { label: 'Destacados sobre activos', value: `${featuredShare}%` },
        { label: 'Productos con data de clics', value: Number(productsWithClicks).toLocaleString('es-CO') },
        { label: 'Eventos medidos', value: Number(metricsEventsState.total || 0).toLocaleString('es-CO') }
    ];

    renderMiniRows(metricsInsightsList, insights, 'Sin indicadores disponibles por ahora.');
}

function refreshLivePreview() {
    if (!liveMenuPreview) {
        return;
    }

    const currentUrl = new URL(liveMenuPreview.src, window.location.href);
    currentUrl.searchParams.set('adminPreview', '1');
    currentUrl.searchParams.set('t', String(Date.now()));
    liveMenuPreview.src = currentUrl.toString();
}

function queueLivePreviewRefresh() {
    if (previewRefreshTimer) {
        clearTimeout(previewRefreshTimer);
    }

    previewRefreshTimer = setTimeout(() => {
        refreshLivePreview();
    }, 450);
}

function setupLiveFirebaseSync() {
    if (!firebaseDb) {
        return;
    }

    liveSubscriptions.forEach((unsubscribe) => unsubscribe());
    liveSubscriptions = [];

    const collections = ['productos', 'categorias', 'botones', ORDERS_COLLECTION, CLIENTS_COLLECTION, MESSAGES_COLLECTION, SALES_SUMMARY_COLLECTION, SALES_DAY_STATE_COLLECTION];
    collections.forEach((collectionName) => {
        const unsubscribe = firebaseDb.collection(collectionName).onSnapshot(() => {
            reloadDataAndRender();
            queueLivePreviewRefresh();
        });
        liveSubscriptions.push(unsubscribe);
    });

    const configUnsubscribe = firebaseDb.collection(CONFIG_COLLECTION).doc(CONFIG_DOC_ID).onSnapshot(() => {
        reloadDataAndRender();
        queueLivePreviewRefresh();
    });
    liveSubscriptions.push(configUnsubscribe);
}

function renderButtonsList() {
    if (!buttonConfigList) {
        return;
    }

    buttonConfigList.innerHTML = '';
    const rows = [...buttonsState].sort((a, b) => a.order - b.order);

    rows.forEach((button) => {
        const row = document.createElement('div');
        row.className = 'list-item';

        const stateClass = button.estado === 'active' ? 'visible' : 'hidden';
        const stateText = button.estado === 'active' ? 'Activo' : 'Pausado';

        row.innerHTML = `
            <div class="product-main"><span>${button.icon} ${button.label}</span></div>
            <div class="muted">${button.id} | ${button.actionType === 'menu-modal' ? 'Menu modal' : 'Enlace'} | ${button.buttonType} | ${button.size}</div>
            <span class="state-pill ${stateClass}">${stateText}</span>
            <button class="mini-btn" data-action="edit-button" data-button-id="${button.id}">Editar</button>
            <button class="mini-btn" data-action="toggle-button" data-button-id="${button.id}">${button.estado === 'active' ? 'Pausar' : 'Activar'}</button>
            <button class="mini-btn remove" data-action="toggle-visible" data-button-id="${button.id}">${button.visible ? 'Ocultar' : 'Mostrar'}</button>
            <button class="mini-btn remove" data-action="delete-button" data-button-id="${button.id}">Eliminar</button>
        `;

        buttonConfigList.appendChild(row);
    });
}

function resetButtonForm() {
    if (!buttonConfigForm) {
        return;
    }
    buttonConfigForm.reset();
    buttonEditIdInput.value = '';
    if (buttonSaveBtn) {
        buttonSaveBtn.textContent = 'Guardar boton';
    }
    if (buttonVolumeOut && buttonVolumeInput) {
        buttonVolumeOut.textContent = Number(buttonVolumeInput.value).toFixed(2);
    }
}

function setButtonForm(button) {
    if (!buttonConfigForm) {
        return;
    }

    buttonConfigForm.buttonId.value = button.id;
    buttonConfigForm.buttonLabel.value = button.label;
    buttonConfigForm.buttonIcon.value = button.icon;
    buttonConfigForm.buttonActionType.value = button.actionType;
    buttonConfigForm.buttonLink.value = button.link;
    buttonConfigForm.buttonType.value = button.buttonType;
    buttonConfigForm.buttonColor.value = button.color;
    buttonConfigForm.buttonSize.value = button.size;
    buttonConfigForm.buttonOrder.value = String(button.order);
    buttonConfigForm.buttonState.value = button.estado;
    buttonConfigForm.buttonVisible.value = button.visible ? 'true' : 'false';
    buttonConfigForm.buttonVolume.value = String(button.volume);
    buttonConfigForm.buttonSoundEnabled.checked = button.soundEnabled;

    buttonEditIdInput.value = button.id;
    if (buttonSaveBtn) {
        buttonSaveBtn.textContent = 'Actualizar boton';
    }
    if (buttonVolumeOut) {
        buttonVolumeOut.textContent = Number(button.volume).toFixed(2);
    }
}

function renderBrandingForm() {
    if (!brandingForm) {
        return;
    }

    brandingForm.restaurantName.value = brandingState.restaurantName;
    brandingForm.restaurantSlogan.value = brandingState.slogan;
    brandingForm.restaurantWhatsappNumber.value = brandingState.whatsappNumber;
    brandingForm.restaurantWhatsappLink.value = brandingState.whatsappLink;
    brandingForm.restaurantBusinessHours.value = brandingState.businessHours;
    brandingForm.restaurantAddress.value = brandingState.address;
    brandingForm.restaurantLocationLink.value = brandingState.locationLink;
    brandingForm.restaurantInstagramLink.value = brandingState.instagramLink;
    brandingForm.restaurantTiktokLink.value = brandingState.tiktokLink;
    brandingForm.restaurantFacebookLink.value = brandingState.facebookLink;

    renderBrandingPreview();
}

function renderBrandingPreview() {
    if (!brandingForm || !previewName || !previewSlogan || !brandingPreview) {
        return;
    }

    const name = String(brandingForm.restaurantName.value || '').trim() || defaultBranding.restaurantName;
    const slogan = String(brandingForm.restaurantSlogan.value || '').trim() || defaultBranding.slogan;
    const whatsappNumber = String(brandingForm.restaurantWhatsappNumber.value || '').trim() || defaultBranding.whatsappNumber;
    const businessHours = String(brandingForm.restaurantBusinessHours.value || '').trim() || defaultBranding.businessHours;
    const address = String(brandingForm.restaurantAddress.value || '').trim() || defaultBranding.address;
    const locationLink = String(brandingForm.restaurantLocationLink.value || '').trim() || defaultBranding.locationLink;
    const socialLabels = [
        String(brandingForm.restaurantInstagramLink.value || '').trim() ? 'Instagram' : '',
        String(brandingForm.restaurantTiktokLink.value || '').trim() ? 'TikTok' : '',
        String(brandingForm.restaurantFacebookLink.value || '').trim() ? 'Facebook' : ''
    ].filter(Boolean);

    previewName.textContent = name;
    previewSlogan.textContent = slogan;
    brandingPreview.style.borderColor = `${brandingState.primaryColor}55`;
    brandingPreview.style.background = `linear-gradient(135deg, ${brandingState.bgColor}, ${brandingState.secondaryColor}16)`;
    brandingPreview.style.fontFamily = brandingState.fontFamily;

    if (previewWhatsapp) {
        previewWhatsapp.textContent = `WhatsApp: ${whatsappNumber}`;
    }
    if (previewBusinessHours) {
        previewBusinessHours.textContent = businessHours;
    }
    if (previewAddress) {
        previewAddress.textContent = address;
    }
    if (previewLocation) {
        previewLocation.textContent = locationLink ? `Ubicacion: ${locationLink}` : 'Ubicacion no configurada';
    }
    if (previewSocials) {
        previewSocials.textContent = socialLabels.length
            ? `Redes configuradas: ${socialLabels.join(' · ')}`
            : 'Redes sociales no configuradas';
    }

    applyDesignToPreviewFrame(brandingState);
}

function buildWhatsAppButtonLink(number, customLink) {
    const directLink = String(customLink || '').trim();
    if (directLink) {
        return directLink;
    }

    const normalizedNumber = String(number || '').replace(/\D+/g, '');
    if (!normalizedNumber) {
        return '';
    }

    return `https://wa.me/${normalizedNumber}?text=${encodeURIComponent('Hola ROAL BURGER! Quisiera realizar un pedido por favor')}`;
}

async function syncBrandingLinksToButtons(brandingConfig) {
    if (!firebaseDb) {
        return;
    }

    const buttonDefinitions = [
        {
            id: 'btn-whatsapp-main',
            fallback: defaultButtons.find((button) => button.id === 'btn-whatsapp-main'),
            link: buildWhatsAppButtonLink(brandingConfig.whatsappNumber, brandingConfig.whatsappLink),
            visible: true
        },
        {
            id: 'btn-instagram',
            fallback: defaultButtons.find((button) => button.id === 'btn-instagram'),
            link: String(brandingConfig.instagramLink || '').trim(),
            visible: Boolean(String(brandingConfig.instagramLink || '').trim())
        },
        {
            id: 'btn-tiktok',
            fallback: defaultButtons.find((button) => button.id === 'btn-tiktok'),
            link: String(brandingConfig.tiktokLink || '').trim(),
            visible: Boolean(String(brandingConfig.tiktokLink || '').trim())
        },
        {
            id: 'btn-facebook',
            fallback: defaultButtons.find((button) => button.id === 'btn-facebook'),
            link: String(brandingConfig.facebookLink || '').trim(),
            visible: Boolean(String(brandingConfig.facebookLink || '').trim())
        }
    ];

    const batch = firebaseDb.batch();
    buttonDefinitions.forEach((definition) => {
        if (!definition.fallback) {
            return;
        }

        batch.set(firebaseDb.collection('botones').doc(definition.id), {
            ...definition.fallback,
            link: definition.link,
            visible: definition.visible,
            updated_at: firestoreNow()
        }, { merge: true });
    });

    await batch.commit();
}

function applyDesignToPreviewFrame(config) {
    if (!liveMenuPreview || !liveMenuPreview.contentDocument) {
        return;
    }

    const previewDoc = liveMenuPreview.contentDocument;
    const previewBody = previewDoc.body;
    if (!previewBody) {
        return;
    }

    previewBody.dataset.theme = config.template || defaultBranding.template;

    const previewRoot = previewDoc.documentElement;
    previewRoot.style.setProperty('--brand-primary', config.primaryColor || defaultBranding.primaryColor);
    previewRoot.style.setProperty('--brand-secondary', config.secondaryColor || defaultBranding.secondaryColor);
    previewRoot.style.setProperty('--brand-accent', config.accentColor || defaultBranding.accentColor);
    previewRoot.style.setProperty('--landing-bg-color', config.bgColor || defaultBranding.bgColor);
    previewRoot.style.setProperty('--landing-button-border-color', config.buttonBorderColor || defaultBranding.buttonBorderColor);
    previewRoot.style.setProperty('--landing-font-family', config.fontFamily || defaultBranding.fontFamily);
    previewRoot.style.setProperty('--landing-font-size-base', `${config.fontSizeBase || defaultBranding.fontSizeBase}px`);
    previewRoot.style.setProperty('--landing-animation-speed', String(config.animationSpeed || defaultBranding.animationSpeed));

    ensurePreviewGoogleFont(previewDoc, config.fontFamily || defaultBranding.fontFamily);
}

function ensurePreviewGoogleFont(previewDoc, fontFamily) {
    const family = String(fontFamily || '').toLowerCase();
    const familyParamMap = {
        roboto: 'Roboto:wght@300;400;500;700',
        manrope: 'Manrope:wght@400;500;700;800',
        'plus jakarta sans': 'Plus+Jakarta+Sans:wght@400;600;700',
        'space grotesk': 'Space+Grotesk:wght@400;500;700'
    };

    const key = Object.keys(familyParamMap).find((item) => family.includes(item));
    if (!key || !previewDoc.head) {
        return;
    }

    let link = previewDoc.getElementById('dynamicLandingFont');
    if (!link) {
        link = previewDoc.createElement('link');
        link.id = 'dynamicLandingFont';
        link.rel = 'stylesheet';
        previewDoc.head.appendChild(link);
    }

    link.href = `https://fonts.googleapis.com/css2?family=${familyParamMap[key]}&display=swap`;
}

function applyTemplateToForm(templateName) {
    if (!brandingForm || !BRAND_TEMPLATES[templateName]) {
        return;
    }

    const template = BRAND_TEMPLATES[templateName];
    brandingForm.brandTemplate.value = templateName;
    brandingForm.brandPrimaryColor.value = template.primaryColor;
    brandingForm.brandSecondaryColor.value = template.secondaryColor;
    brandingForm.brandAccentColor.value = template.accentColor;
    brandingForm.designBgColor.value = template.bgColor;
    brandingForm.designButtonBorderColor.value = template.buttonBorderColor;
    renderBrandingPreview();
}

function withTimeout(promise, timeoutMs, timeoutMessage) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new Error(timeoutMessage));
        }, timeoutMs);

        promise
            .then((value) => {
                clearTimeout(timer);
                resolve(value);
            })
            .catch((error) => {
                clearTimeout(timer);
                reject(error);
            });
    });
}

async function uploadImageToFirebase(file, productName) {
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const safeName = slugify(productName) || 'producto';
    const path = `${getFirebaseStorageFolder()}/${safeName}-${Date.now()}.${ext}`;

    const storageRef = firebaseStorage.ref().child(path);
    await withTimeout(
        storageRef.put(file),
        12000,
        'La subida de imagen tardo demasiado. Verifica Firebase Storage/CORS.'
    );

    return withTimeout(
        storageRef.getDownloadURL(),
        7000,
        'No se pudo obtener la URL de la imagen desde Firebase Storage.'
    );
}

function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            resolve(String(reader.result || ''));
        };
        reader.onerror = () => {
            reject(new Error('No se pudo leer la imagen local.'));
        };
        reader.readAsDataURL(file);
    });
}

function loadImageElementFromFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = () => reject(new Error('No se pudo procesar la imagen seleccionada.'));
            image.src = String(reader.result || '');
        };
        reader.onerror = () => reject(new Error('No se pudo leer la imagen local.'));
        reader.readAsDataURL(file);
    });
}

async function compressImageToDataUrl(file, options = {}) {
    const {
        maxWidth = 1280,
        maxHeight = 1280,
        mimeType = 'image/jpeg',
        startQuality = 0.82,
        minQuality = 0.45,
        maxLength = 900000
    } = options;

    const image = await loadImageElementFromFile(file);
    let width = image.naturalWidth || image.width;
    let height = image.naturalHeight || image.height;

    const scale = Math.min(1, maxWidth / Math.max(width, 1), maxHeight / Math.max(height, 1));
    width = Math.max(1, Math.round(width * scale));
    height = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) {
        throw new Error('No se pudo preparar la imagen para guardarla.');
    }

    context.drawImage(image, 0, 0, width, height);

    let quality = startQuality;
    let dataUrl = canvas.toDataURL(mimeType, quality);

    while (dataUrl.length > maxLength && quality > minQuality) {
        quality = Math.max(minQuality, quality - 0.08);
        dataUrl = canvas.toDataURL(mimeType, quality);
    }

    if (dataUrl.length > maxLength) {
        throw new Error('La imagen sigue siendo demasiado pesada para guardarla localmente. Reduce su tamano o usa una imagen mas ligera.');
    }

    return dataUrl;
}

async function resolveProductImageUpload(file, productName) {
    try {
        return await uploadImageToFirebase(file, productName);
    } catch (uploadError) {
        return compressImageToDataUrl(file);
    }
}

async function getStatDocument(metric) {
    const byId = await firebaseDb.collection('estadisticas').doc(metric).get();
    if (byId.exists) {
        return byId.data();
    }

    const query = await firebaseDb.collection('estadisticas').where('metric', '==', metric).limit(1).get();
    if (query.empty) {
        return null;
    }

    return query.docs[0].data();
}

async function syncStats() {
    try {
        const [clicksData, topProductData] = await Promise.all([
            getStatDocument('total_clicks'),
            getStatDocument('top_product')
        ]);

        const derivedTotal = productClicksState.reduce((sum, item) => sum + Number(item.clicks || 0), 0);
        const topFromClicks = [...productClicksState].sort((a, b) => b.clicks - a.clicks)[0];

        totalClicksEl.textContent = clicksData && clicksData.value_number != null
            ? Number(clicksData.value_number).toLocaleString('es-CO')
            : (derivedTotal > 0 ? Number(derivedTotal).toLocaleString('es-CO') : '--');

        topProductEl.textContent = (topProductData && topProductData.value_text) || topFromClicks?.product || '--';
    } catch (error) {
        const derivedTotal = productClicksState.reduce((sum, item) => sum + Number(item.clicks || 0), 0);
        const topFromClicks = [...productClicksState].sort((a, b) => b.clicks - a.clicks)[0];
        totalClicksEl.textContent = derivedTotal > 0 ? Number(derivedTotal).toLocaleString('es-CO') : '--';
        topProductEl.textContent = topFromClicks?.product || '--';
    }
}

async function fetchProductClickMetrics() {
    try {
        const snapshot = await firebaseDb.collection('estadisticas').get();
        const parsed = [];
        const events = {
            total: 0,
            whatsapp: 0,
            menu: 0,
            social: 0,
            products: 0
        };

        snapshot.docs.forEach((doc) => {
            const data = doc.data() || {};
            const metricName = String(data.metric || doc.id || '').toLowerCase();
            const metricValue = Number(data.value_number ?? data.clicks ?? 0);
            if (Number.isFinite(metricValue) && metricValue > 0) {
                events.total += metricValue;
            }

            if (metricName.includes('whatsapp')) {
                events.whatsapp += Number.isFinite(metricValue) ? Math.max(0, metricValue) : 0;
            }
            if (metricName.includes('menu')) {
                events.menu += Number.isFinite(metricValue) ? Math.max(0, metricValue) : 0;
            }
            if (metricName.includes('instagram') || metricName.includes('facebook') || metricName.includes('tiktok') || metricName.includes('social')) {
                events.social += Number.isFinite(metricValue) ? Math.max(0, metricValue) : 0;
            }

            const recognizedDailyVisitorsMetric = [
                'personas',
                'personas_por_dia',
                'personas-dia',
                'personas_dia',
                'visitantes',
                'visitas',
                'visitas_por_dia',
                'ingresos',
                'entradas',
                'daily_visitors',
                'daily_visits'
            ].some((key) => metricName.includes(key));

            if (recognizedDailyVisitorsMetric) {
                events.dailyVisitors = Math.max(events.dailyVisitors, Number.isFinite(metricValue) ? Math.max(0, metricValue) : 0);
            }

            const isProductMetric = metricName.includes('product') || metricName.includes('producto');
            if (!isProductMetric) {
                return;
            }

            const clicks = metricValue;
            if (!Number.isFinite(clicks) || clicks <= 0) {
                return;
            }

            const product = String(data.value_text || data.product || data.product_name || metricName.replace(/[_-]/g, ' ')).trim();
            parsed.push({ product: product || 'Producto', clicks });
            events.products += clicks;
        });

        productClicksState = parsed;
        metricsEventsState = events;
    } catch (error) {
        productClicksState = [];
        metricsEventsState = { total: 0, whatsapp: 0, menu: 0, social: 0, products: 0 };
    }
}

async function reloadDataAndRender() {
    await Promise.all([
        fetchCategories(),
        fetchProducts(),
        fetchButtons(),
        fetchBranding(),
        fetchOrders(),
        fetchSalesSummaries(),
        fetchSalesDayState(),
        fetchClients(),
        fetchMessages(),
        fetchProductClickMetrics(),
        fetchMenuUpgradesConfig()
    ]);

    const createdSalesDay = await ensureActiveSalesDay();
    if (createdSalesDay) {
        await fetchSalesDayState();
    }

    announceNewOrders(ordersState);
    announceNewMessages(messagesState);

    renderCategories();
    renderMenuUpgradesAdmin();
    renderButtonsList();
    renderBrandingForm();
    renderOrders();
    renderSalesSummaries();
    renderLedgerBook();
    renderClients();
    renderMessages();
    updateMessagesAttentionState();
    renderMetricsChart();
    await syncStats();
    renderMetricsOverview();

    if (activeCategoryModalId) {
        const activeCategory = categoriesState.find((category) => category.id === activeCategoryModalId);
        if (activeCategory) {
            openCategoryProductsModal(activeCategoryModalId);
        } else {
            closeCategoryProductsModal();
        }
    }
}

categoryForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    hideNotice();

    const formData = new FormData(categoryForm);
    const name = String(formData.get('categoryName') || '').trim();

    try {
        const created = await createCategoryByName(name);
        if (created) {
            categoryForm.reset();
        }
    } catch (error) {
        showNotice(`No se pudo crear la categoria: ${error.message || 'Error inesperado.'}`, 'error');
    }
});

categoryList.addEventListener('click', async (event) => {
    const target = event.target;
    if (!(target instanceof Element)) {
        return;
    }

    const actionButton = target.closest('button[data-action]');
    if (!(actionButton instanceof HTMLButtonElement)) {
        return;
    }

    const action = actionButton.dataset.action;
    const categoryId = actionButton.dataset.categoryId;

    if (!action) {
        return;
    }

    if (categoryId && !actionButton.dataset.productId) {
        if (action === 'view-category') {
            openCategoryProductsModal(categoryId);
            return;
        }

        if (action === 'delete-category') {
            const category = categoriesState.find((item) => item.id === categoryId);
            if (!category) {
                showNotice('Categoria no encontrada.', 'error');
                return;
            }

            const relatedProducts = productsState.filter((product) => product.categoria === category.name);
            const confirmed = window.confirm(
                relatedProducts.length
                    ? `Eliminar la categoria ${category.name} y sus ${relatedProducts.length} producto${relatedProducts.length === 1 ? '' : 's'} asociados? Esta accion no se puede deshacer.`
                    : `Eliminar la categoria ${category.name}? Esta accion no se puede deshacer.`
            );
            if (!confirmed) {
                return;
            }

            try {
                const batch = firebaseDb.batch();
                batch.delete(firebaseDb.collection('categorias').doc(categoryId));

                relatedProducts.forEach((product) => {
                    batch.delete(firebaseDb.collection('productos').doc(product.id));
                });

                await batch.commit();
                await reloadDataAndRender();
                showNotice(
                    relatedProducts.length
                        ? `Categoria eliminada junto con ${relatedProducts.length} producto${relatedProducts.length === 1 ? '' : 's'}.`
                        : 'Categoria eliminada.',
                    'ok'
                );
            } catch (error) {
                showNotice(`No se pudo eliminar la categoria: ${error.message || 'Error inesperado.'}`, 'error');
            }
            return;
        }

        if (action === 'toggle-category') {
            const category = categoriesState.find((item) => item.id === categoryId);
            if (!category) {
                showNotice('Categoria no encontrada.', 'error');
                return;
            }

            try {
                await firebaseDb.collection('categorias').doc(categoryId).update({
                    active: !category.active,
                    updated_at: firestoreNow()
                });
                await reloadDataAndRender();
                showNotice(`Categoria ${category.active ? 'desactivada' : 'activada'}.`, 'ok');
            } catch (error) {
                showNotice(`No se pudo actualizar la categoria: ${error.message || 'Error inesperado.'}`, 'error');
            }
            return;
        }
    }

    const productId = actionButton.dataset.productId;
    if (!productId || !categoryId) {
        return;
    }

    if (action !== 'edit-product' && action !== 'delete-product' && action !== 'pause-product') {
        return;
    }

    await handleCategoryProductAction(action, productId, categoryId);
});

if (categoryProductsModalCloseBtn) {
    categoryProductsModalCloseBtn.addEventListener('click', () => {
        closeCategoryProductsModal();
    });
}

if (categoryProductsModal) {
    categoryProductsModal.addEventListener('click', async (event) => {
        if (event.target === categoryProductsModal) {
            closeCategoryProductsModal();
            return;
        }

        const target = event.target;
        if (!(target instanceof Element)) {
            return;
        }

        const actionButton = target.closest('button[data-action]');
        if (!(actionButton instanceof HTMLButtonElement)) {
            return;
        }

        const action = actionButton.dataset.action;
        const productId = actionButton.dataset.productId;
        const categoryId = actionButton.dataset.categoryId;

        if (!action || !productId || !categoryId) {
            return;
        }

        if (action !== 'edit-product' && action !== 'delete-product' && action !== 'pause-product') {
            return;
        }

        await handleCategoryProductAction(action, productId, categoryId);
    });
}

if (openCreateCategoryBtn) {
    openCreateCategoryBtn.addEventListener('click', () => {
        openCategoryCreateModal();
    });
}

if (openCreateProductBtn) {
    openCreateProductBtn.addEventListener('click', () => {
        const preselectedCategoryName = activeCategoryModalId
            ? (categoriesState.find((category) => category.id === activeCategoryModalId)?.name || '')
            : '';
        openProductCreateModal(preselectedCategoryName);
    });
}

if (categoryCreateCloseBtn) {
    categoryCreateCloseBtn.addEventListener('click', () => {
        closeCategoryCreateModal();
    });
}

if (categoryCreateModal) {
    categoryCreateModal.addEventListener('click', (event) => {
        if (event.target === categoryCreateModal) {
            closeCategoryCreateModal();
        }
    });
}

if (productCreateCloseBtn) {
    productCreateCloseBtn.addEventListener('click', () => {
        closeProductCreateModal();
    });
}

if (productCreateModal) {
    productCreateModal.addEventListener('click', (event) => {
        if (event.target === productCreateModal) {
            closeProductCreateModal();
        }
    });
}

if (productEditCloseBtn) {
    productEditCloseBtn.addEventListener('click', () => {
        closeProductEditModal();
    });
}

if (productEditModal) {
    productEditModal.addEventListener('click', (event) => {
        if (event.target === productEditModal) {
            closeProductEditModal();
        }
    });
}

if (clientEditCloseBtn) {
    clientEditCloseBtn.addEventListener('click', () => {
        closeClientEditModal();
    });
}

if (clientEditModal) {
    clientEditModal.addEventListener('click', (event) => {
        if (event.target === clientEditModal) {
            closeClientEditModal();
        }
    });
}

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && productEditModal && productEditModal.classList.contains('show')) {
        closeProductEditModal();
        return;
    }

    if (event.key === 'Escape' && productCreateModal && productCreateModal.classList.contains('show')) {
        closeProductCreateModal();
        return;
    }

    if (event.key === 'Escape' && categoryCreateModal && categoryCreateModal.classList.contains('show')) {
        closeCategoryCreateModal();
        return;
    }

    if (event.key === 'Escape' && categoryProductsModal && categoryProductsModal.classList.contains('show')) {
        closeCategoryProductsModal();
        return;
    }

    if (event.key === 'Escape' && clientEditModal && clientEditModal.classList.contains('show')) {
        closeClientEditModal();
    }
});

if (openCreateClientBtn) {
    openCreateClientBtn.addEventListener('click', () => {
        openCreateClientModal();
    });
}

if (openCreateInternalOrderBtn) {
    openCreateInternalOrderBtn.addEventListener('click', () => {
        openInternalOrderModal();
    });
}

/* ─── POS v2: Event listeners ─── */

// Cerrar POS (botón atrás)
if (internalOrderCloseBtn) {
    internalOrderCloseBtn.addEventListener('click', () => closeInternalOrderModal());
}

// Envío del formulario de pago
if (internalOrderForm) {
    internalOrderForm.addEventListener('submit', submitInternalOrderForm);
}

// Botón COBRAR (barra de acción)
document.getElementById('posCobrarBtn')?.addEventListener('click', () => {
    if (!internalOrderItems.length) { showNotice('Agrega productos al pedido primero.', 'warn'); return; }
    showPosScreen('payment');
});

// Botón TICKETS ABIERTOS
document.getElementById('posOpenTicketsBtn')?.addEventListener('click', () => showPosScreen('tickets'));

// Toggle carrito (barra inferior)
document.getElementById('posCartToggleBtn')?.addEventListener('click', () => {
    const drawer = document.getElementById('posCartDrawer');
    if (drawer) drawer.hidden = false;
});

// Cerrar drawer del carrito
document.getElementById('posCartDrawerCloseBtn')?.addEventListener('click', () => {
    const drawer = document.getElementById('posCartDrawer');
    if (drawer) drawer.hidden = true;
});

// Backdrop del carrito
document.getElementById('posCartBackdrop')?.addEventListener('click', () => {
    const drawer = document.getElementById('posCartDrawer');
    if (drawer) drawer.hidden = true;
});

// COBRAR desde el drawer
document.getElementById('posDrawerCobrarBtn')?.addEventListener('click', () => {
    const drawer = document.getElementById('posCartDrawer');
    if (drawer) drawer.hidden = true;
    if (!internalOrderItems.length) return;
    showPosScreen('payment');
});

// Volver desde pantalla de pago
document.getElementById('posPaymentBackBtn')?.addEventListener('click', () => showPosScreen('main'));

// Cerrar lista de tickets
document.getElementById('posTicketsCloseBtn')?.addEventListener('click', () => showPosScreen('main'));

// Nuevo ticket
document.getElementById('posNewTicketBtn')?.addEventListener('click', () => {
    createNewPosTicket();
    renderPosOrderItems();
    renderPosTotals();
    renderPosBottomBar();
    showPosScreen('main');
});

// Botón cliente en topbar principal
document.getElementById('posAddClientBtn')?.addEventListener('click', () => {
    if (!internalOrderItems.length) { showNotice('Agrega productos al pedido primero.', 'warn'); return; }
    showPosScreen('payment');
    setTimeout(() => document.getElementById('posClientSearchInput')?.focus(), 150);
});

// Botones de tipo de pedido (Retiro / Domicilio / Mesa)
document.addEventListener('click', (event) => {
    const typeBtn = event.target.closest('.pos-type-btn');
    if (typeBtn && document.getElementById('posView')?.classList.contains('is-open')) {
        document.querySelectorAll('.pos-type-btn').forEach((b) => b.classList.remove('active'));
        typeBtn.classList.add('active');
        if (internalOrderTypeSelect) internalOrderTypeSelect.value = typeBtn.dataset.type;
        if (internalOrderDeliveryAddressField) {
            internalOrderDeliveryAddressField.hidden = typeBtn.dataset.type !== 'domicilio';
        }
    }

    const methodBtn = event.target.closest('.pos-pay-method-btn');
    if (methodBtn && document.getElementById('posView')?.classList.contains('is-open')) {
        document.querySelectorAll('.pos-pay-method-btn').forEach((b) => b.classList.remove('active'));
        methodBtn.classList.add('active');
        if (internalOrderPaymentMethodSelect) internalOrderPaymentMethodSelect.value = methodBtn.dataset.method;
        const cashSection = document.getElementById('posCashSection');
        if (cashSection) cashSection.hidden = methodBtn.dataset.method !== 'efectivo';
    }
});

// Descuento → actualizar totales
document.getElementById('internalOrderDiscount')?.addEventListener('input', renderPosTotals);

// ── Cerrar upgrade sheet
document.getElementById('posUpgradeCloseBtn')?.addEventListener('click', closePosUpgradeSheet);

// ── Admin: toggle global de acompañamientos
document.getElementById('upgradesActive')?.addEventListener('change', (e) => {
    if (!menuUpgradesConfig) menuUpgradesConfig = { ...DEFAULT_UPGRADES_CONFIG };
    menuUpgradesConfig.activo = e.target.checked;
});

// ── Admin: agregar nueva opción de acompañamiento
document.getElementById('addUpgradeOptionBtn')?.addEventListener('click', () => {
    if (!menuUpgradesConfig) menuUpgradesConfig = { ...DEFAULT_UPGRADES_CONFIG };
    if (!Array.isArray(menuUpgradesConfig.opciones)) menuUpgradesConfig.opciones = [];
    menuUpgradesConfig.opciones.push({
        id: `opt-${Date.now()}`,
        nombre: 'Nueva opcion',
        detalle: '',
        precio: 0,
        activo: true,
        orden: menuUpgradesConfig.opciones.length + 1,
        incluye_bebida: false
    });
    renderMenuUpgradesAdmin();
});

// ── Admin: agregar sabor de bebida
document.getElementById('addFlavorBtn')?.addEventListener('click', () => {
    const input = document.getElementById('newFlavorInput');
    const val = String(input?.value || '').trim();
    if (!val) return;
    if (!menuUpgradesConfig) menuUpgradesConfig = { ...DEFAULT_UPGRADES_CONFIG };
    if (!Array.isArray(menuUpgradesConfig.sabores_bebida)) menuUpgradesConfig.sabores_bebida = [];
    menuUpgradesConfig.sabores_bebida.push(val);
    if (input) input.value = '';
    renderMenuUpgradesAdmin();
});

// ── Admin: guardar config de acompañamientos
document.getElementById('saveUpgradesConfigBtn')?.addEventListener('click', async () => {
    if (!menuUpgradesConfig) return;
    const btn = document.getElementById('saveUpgradesConfigBtn');
    if (btn) { btn.disabled = true; btn.textContent = 'Guardando...'; }
    try {
        await saveMenuUpgradesConfig(menuUpgradesConfig);
        showNotice('Acompañamientos guardados correctamente.', 'ok');
    } catch (e) {
        showNotice('Error al guardar: ' + (e.message || 'revisa la conexion'), 'error');
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Guardar Acompañamientos'; }
    }
});

// ── Menu: pestañas internas (Categorías / Acompañantes)
document.querySelectorAll('.menu-inner-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
        const target = tab.dataset.menuTab;
        document.querySelectorAll('.menu-inner-tab').forEach((t) => {
            const isActive = t.dataset.menuTab === target;
            t.classList.toggle('active', isActive);
            t.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });
        document.querySelectorAll('.menu-inner-panel').forEach((panel) => {
            const isActive = panel.dataset.menuPanel === target;
            panel.classList.toggle('active', isActive);
            panel.hidden = !isActive;
            panel.style.display = isActive ? 'flex' : 'none';
        });
    });
});

if (clientsSearchInput) {
    clientsSearchInput.addEventListener('input', () => {
        clientsSearchTerm = normalizeCategoryKey(clientsSearchInput.value || '');
        renderClients();
    });
}

if (salesSummaryFilterType) {
    salesSummaryFilterType.addEventListener('change', () => {
        syncSalesSummaryFilterOptions();
        renderSalesSummaries();
    });
}

if (salesSummaryFilterValue) {
    salesSummaryFilterValue.addEventListener('change', () => {
        renderSalesSummaries();
    });
}

if (salesSummaryDateFrom) {
    salesSummaryDateFrom.addEventListener('change', () => {
        renderSalesSummaries();
    });
}

if (salesSummaryDateTo) {
    salesSummaryDateTo.addEventListener('change', () => {
        renderSalesSummaries();
    });
}

if (ledgerBookDateFrom) {
    ledgerBookDateFrom.addEventListener('change', () => {
        renderLedgerBook();
    });
}

if (ledgerBookDateTo) {
    ledgerBookDateTo.addEventListener('change', () => {
        renderLedgerBook();
    });
}

if (exportLedgerExcelBtn) {
    exportLedgerExcelBtn.addEventListener('click', () => {
        try {
            exportLedgerBook('csv');
        } catch (error) {
            showNotice(`No se pudo exportar el libro en Excel: ${error.message || 'error inesperado.'}`, 'error');
        }
    });
}

if (exportLedgerPdfBtn) {
    exportLedgerPdfBtn.addEventListener('click', () => {
        try {
            exportLedgerBook('pdf');
        } catch (error) {
            showNotice(`No se pudo exportar el libro en PDF: ${error.message || 'error inesperado.'}`, 'error');
        }
    });
}

if (closeSalesDayBtn) {
    closeSalesDayBtn.addEventListener('click', async () => {
        closeSalesDayBtn.disabled = true;
        try {
            const closed = await closeCurrentSalesDay();
            if (!closed) {
                return;
            }
            showNotice('Cierre del dia guardado y nueva jornada abierta.', 'ok');
            await reloadDataAndRender();
        } catch (error) {
            showNotice(`No se pudo cerrar el dia: ${error.message || 'error inesperado.'}`, 'error');
        } finally {
            renderSalesDayBanner();
        }
    });
}

if (exportClientsBtn) {
    exportClientsBtn.addEventListener('click', () => {
        try {
            exportClients(clientsExportFormat?.value || 'csv', clientsExportScope?.value || 'filtered');
        } catch (error) {
            showNotice(`No se pudo exportar clientes: ${error.message || 'error inesperado.'}`, 'error');
        }
    });
}

if (ordersMobileTabs) {
    ordersMobileTabs.addEventListener('click', (event) => {
        const target = event.target;
        if (!(target instanceof Element)) {
            return;
        }

        const tab = target.closest('[data-mobile-orders-tab]');
        if (!(tab instanceof HTMLButtonElement)) {
            return;
        }

        activeMobileOrdersLane = String(tab.dataset.mobileOrdersTab || 'takeaway').trim() || 'takeaway';
        applyMobileOrdersLane();
    });
}

mobileTicketCloseBtn?.addEventListener('click', () => {
    closeMobileTicketPanel({ clearSelection: true });
    renderOrders();
});

mobileTicketBackdrop?.addEventListener('click', () => {
    closeMobileTicketPanel({ clearSelection: true });
    renderOrders();
});

window.addEventListener('resize', () => {
    syncResponsiveAdminState();
});

if (clientsList) {
    clientsList.addEventListener('click', async (event) => {
        const target = event.target;
        if (!(target instanceof Element)) {
            return;
        }

        const addressToggle = target.closest('button[data-client-toggle-addresses]');
        if (addressToggle instanceof HTMLButtonElement) {
            const clientId = String(addressToggle.dataset.clientToggleAddresses || '').trim();
            if (!clientId) {
                return;
            }

            if (expandedClientAddressIds.has(clientId)) {
                expandedClientAddressIds.delete(clientId);
            } else {
                expandedClientAddressIds.add(clientId);
            }

            renderClients();
            return;
        }

        const actionButton = target.closest('button[data-client-action]');
        if (!(actionButton instanceof HTMLButtonElement)) {
            return;
        }

        const action = String(actionButton.dataset.clientAction || '').trim();
        const clientId = String(actionButton.dataset.clientId || '').trim();
        if (!action || !clientId) {
            return;
        }

        const client = clientsState.find((entry) => entry.id === clientId);
        if (!client) {
            showNotice('No se encontro el cliente seleccionado.', 'error');
            return;
        }

        if (action === 'edit') {
            openEditClientModal(client);
            return;
        }

        if (action === 'delete') {
            const confirmed = window.confirm(`Eliminar el cliente ${client.customerName}? Esta accion no se puede deshacer.`);
            if (!confirmed) {
                return;
            }

            try {
                await deleteClient(clientId);
                showNotice('Cliente eliminado correctamente.', 'ok');
            } catch (error) {
                showNotice(`No se pudo eliminar el cliente: ${error.message || 'error inesperado.'}`, 'error');
            }
        }
    });
}

if (messagesList) {
    messagesList.addEventListener('click', async (event) => {
        const target = event.target;
        if (!(target instanceof Element)) {
            return;
        }

        const actionButton = target.closest('button[data-message-action]');
        if (!(actionButton instanceof HTMLButtonElement)) {
            return;
        }

        const action = String(actionButton.dataset.messageAction || '').trim();
        const messageId = String(actionButton.dataset.messageId || '').trim();
        if (!action || !messageId) {
            return;
        }

        const message = messagesState.find((entry) => entry.id === messageId);
        if (!message) {
            showNotice('No se encontro la solicitud seleccionada.', 'error');
            return;
        }

        if (action === 'copy') {
            try {
                await copyTextToClipboard([
                    message.subject,
                    message.body,
                    `Cliente: ${message.customerName}`,
                    `WhatsApp: ${message.customerPhone}`
                ].join('\n'));
                showClipboardToast('Solicitud copiada');
            } catch (error) {
                showNotice(`No se pudo copiar la solicitud: ${error.message || 'error inesperado.'}`, 'error');
            }
            return;
        }

        if (action === 'whatsapp') {
            const whatsappMessage = message.type === 'customer_direct_message'
                ? `Hola ${message.customerName}, vimos tu mensaje en ROAL BURGER y queremos ayudarte.`
                : `Hola ${message.customerName}, te escribimos desde ROAL BURGER sobre tu solicitud de reinicio de contrasena.`;
            const whatsappUrl = buildCustomerContactWhatsAppUrl(
                message.customerName,
                message.customerPhoneDigits,
                whatsappMessage
            );

            if (!whatsappUrl) {
                showNotice('La solicitud no tiene un numero de WhatsApp valido.', 'error');
                return;
            }

            window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
            return;
        }

        if (action === 'reset-password') {
            const confirmed = window.confirm(`Resetear la contrasena del cliente ${message.customerName}? El cliente debera crear una nueva contrasena al volver a entrar.`);
            if (!confirmed) {
                return;
            }

            try {
                const adminIdentity = getCurrentAdminIdentity();
                await resetClientPasswordByPhone(message.customerPhoneDigits);
                let copied = false;
                try {
                    copied = await copyTextToClipboard(buildCustomerPasswordResetClipboardMessage(message));
                } catch (clipboardError) {
                    copied = false;
                }
                await updateMessageRequest(messageId, {
                    status: 'resolved',
                    resolvedAt: firestoreNow(),
                    resolvedBy: adminIdentity,
                    adminAction: 'password_reset_completed'
                });
                if (copied) {
                    showClipboardToast('Mensaje de restablecimiento copiado');
                }
                showNotice('Contrasena reseteada. El cliente ya puede crear una nueva.', 'ok');
            } catch (error) {
                showNotice(`No se pudo resetear la contrasena: ${error.message || 'error inesperado.'}`, 'error');
            }
            return;
        }

        if (action === 'reply') {
            const replyBody = window.prompt(`Respuesta para ${message.customerName}:`, 'Hola, te escribimos desde ROAL BURGER para ayudarte con tu solicitud.');
            if (replyBody === null) {
                return;
            }

            try {
                const adminIdentity = getCurrentAdminIdentity();
                await createAdminDirectReply(message, replyBody);
                await updateMessageRequest(messageId, {
                    status: 'resolved',
                    resolvedAt: firestoreNow(),
                    resolvedBy: adminIdentity,
                    adminAction: 'direct_reply_sent'
                });
                showNotice('Respuesta enviada al perfil del cliente.', 'ok');
            } catch (error) {
                showNotice(`No se pudo enviar la respuesta: ${error.message || 'error inesperado.'}`, 'error');
            }
            return;
        }

        if (action === 'resolve') {
            try {
                const nextResolved = message.status !== 'resolved';
                const adminIdentity = getCurrentAdminIdentity();
                await updateMessageRequest(messageId, {
                    status: nextResolved ? 'resolved' : 'pending',
                    resolvedAt: nextResolved ? firestoreNow() : null,
                    resolvedBy: nextResolved ? adminIdentity : '',
                    adminAction: nextResolved ? 'request_attended' : 'request_reopened'
                });
                showNotice(nextResolved ? 'Solicitud marcada como atendida.' : 'Solicitud marcada nuevamente como pendiente.', 'ok');
            } catch (error) {
                showNotice(`No se pudo actualizar la solicitud: ${error.message || 'error inesperado.'}`, 'error');
            }
            return;
        }

        if (action === 'delete') {
            const confirmed = window.confirm(`Eliminar la solicitud de ${message.customerName}? Esta accion no se puede deshacer.`);
            if (!confirmed) {
                return;
            }

            try {
                await deleteMessageRequest(messageId);
                showNotice('Solicitud eliminada correctamente.', 'ok');
            } catch (error) {
                showNotice(`No se pudo eliminar la solicitud: ${error.message || 'error inesperado.'}`, 'error');
            }
        }
    });
}

if (clientEditForm) {
    clientEditForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        hideNotice();
        hideModalFeedback(clientEditFeedback);

        const customerName = String(clientEditNameInput?.value || '').trim();
        const customerPhone = String(clientEditPhoneInput?.value || '').trim();
        const address = String(clientEditAddressInput?.value || '').trim();
        const savedAddresses = parseClientSavedAddressesInput(clientEditSavedAddressesInput?.value || '', address);
        const customerPhoneDigits = normalizePhoneDigits(customerPhone);

        if (!customerName || !customerPhone || !address) {
            showModalFeedback(clientEditFeedback, 'Completa nombre, telefono y direccion.', 'error');
            return;
        }

        const duplicatedClient = clientsState.find((client) => {
            if (activeClientEditId && client.id === activeClientEditId) {
                return false;
            }

            return customerPhoneDigits && normalizePhoneDigits(client.customerPhoneDigits || client.customerPhone) === customerPhoneDigits;
        });

        if (duplicatedClient) {
            showModalFeedback(clientEditFeedback, 'Ya existe un cliente con ese telefono.', 'error');
            return;
        }

        if (clientEditSaveBtn) {
            clientEditSaveBtn.disabled = true;
            clientEditSaveBtn.textContent = 'Guardando...';
        }

        try {
            const clientId = activeClientEditId || buildAdminClientDocumentId({
                customerName,
                customerPhone,
                address
            });
            const currentClient = clientsState.find((client) => client.id === clientId);

            await firebaseDb.collection(CLIENTS_COLLECTION).doc(clientId).set({
                customerName,
                customerPhone,
                customerPhoneDigits,
                address: savedAddresses[0] || address,
                savedAddresses,
                totalOrders: Number(currentClient?.totalOrders || 0),
                totalSpent: Number(currentClient?.totalSpent || 0),
                lastOrderCode: String(currentClient?.lastOrderCode || '').trim(),
                lastOrderId: String(currentClient?.lastOrderId || '').trim(),
                lastOrderTotal: Number(currentClient?.lastOrderTotal || 0),
                firstOrderAt: currentClient?.firstOrderAt || firestoreNow(),
                lastOrderAt: currentClient?.lastOrderAt || null,
                source: activeClientEditId ? (currentClient?.source || 'admin_panel') : 'admin_panel',
                createdAt: currentClient?.createdAt || firestoreNow(),
                updatedAt: firestoreNow()
            }, { merge: true });

            await reloadDataAndRender();
            closeClientEditModal();
            showNotice(activeClientEditId ? 'Cliente actualizado correctamente.' : 'Cliente creado correctamente.', 'ok');
        } catch (error) {
            showModalFeedback(clientEditFeedback, `No se pudo guardar el cliente: ${error.message || 'error inesperado.'}`, 'error');
            if (clientEditSaveBtn) {
                clientEditSaveBtn.disabled = false;
                clientEditSaveBtn.textContent = activeClientEditId ? 'Guardar cambios' : 'Guardar cliente';
            }
        }
    });
}

if (ordersBoard) {
    ordersBoard.addEventListener('click', async (event) => {
        const target = event.target;
        if (!(target instanceof Element)) {
            return;
        }

        const actionButton = target.closest('button[data-order-card-action]');
        if (actionButton instanceof HTMLButtonElement) {
            const orderId = String(actionButton.dataset.orderId || '').trim();
            const nextStatus = String(actionButton.dataset.orderCardAction || '').trim();
            if (!orderId || !nextStatus) {
                return;
            }

            if (nextStatus === 'view') {
                selectedOrderId = orderId;
                renderOrders();
                return;
            }

            if (nextStatus === 'view_ticket') {
                const order = ordersState.find((entry) => entry.id === orderId);
                if (!order) {
                    return;
                }

                selectedOrderId = orderId;
                renderOrders();
                renderOrderTicket(order, { openMobile: true });
                return;
            }

            const order = ordersState.find((entry) => entry.id === orderId);
            if (!order) {
                return;
            }

            actionButton.disabled = true;
            try {
                if (nextStatus === 'recibir_pedido') {
                    const copied = await copyTextToClipboard(buildReceivedOrderMessage(order));
                    await updateOrder(orderId, { status: 'preparacion', receivedAt: firestoreNow() });
                    showNotice(
                        copied
                            ? 'Pedido recibido, movido a su columna y mensaje copiado.'
                            : 'Pedido recibido y movido a su columna. No se pudo copiar el mensaje automaticamente.',
                        copied ? 'ok' : 'error'
                    );
                    return;
                }

                if (nextStatus === 'eliminar') {
                    const confirmed = window.confirm(`Eliminar el pedido ${order.code}? Esta accion no se puede deshacer.`);
                    if (!confirmed) {
                        return;
                    }

                    await deleteOrder(orderId);
                    if (selectedOrderId === orderId) {
                        selectedOrderId = null;
                    }
                    showNotice('Pedido eliminado correctamente.', 'ok');
                    return;
                }

                if (nextStatus === 'esperando_domiciliario') {
                    const copied = await copyTextToClipboard(buildCourierRequestMessage(order));
                    await updateOrder(orderId, { status: nextStatus, courierRequestedAt: firestoreNow() });
                    showNotice(
                        copied
                            ? 'Mensaje para domiciliario copiado y pedido en espera.'
                            : 'Pedido en espera de domiciliario. No se pudo copiar el mensaje automaticamente.',
                        copied ? 'ok' : 'error'
                    );
                    return;
                }

                if (nextStatus === 'listo_recoger') {
                    const copied = await copyTextToClipboard(buildPickupReadyMessage(order));
                    await updateOrder(orderId, { status: nextStatus, readyForPickupAt: firestoreNow() });
                    showNotice(
                        copied
                            ? 'Mensaje de pedido listo copiado y pedido marcado para recoger.'
                            : 'Pedido marcado para recoger. No se pudo copiar el mensaje automaticamente.',
                        copied ? 'ok' : 'error'
                    );
                    return;
                }

                const copied = await copyTextToClipboard(buildDeliveredOrderMessage(order));
                await updateOrder(orderId, { status: nextStatus, deliveredAt: firestoreNow() });
                showNotice(
                    copied
                        ? 'Mensaje de pedido entregado copiado y pedido cerrado.'
                        : 'Pedido cerrado. No se pudo copiar el mensaje automaticamente.',
                    copied ? 'ok' : 'error'
                );
            } catch (error) {
                showNotice(`No se pudo actualizar el pedido: ${error.message || 'error inesperado.'}`, 'error');
            } finally {
                actionButton.disabled = false;
            }
            return;
        }

        const card = target.closest('.kanban-order-card');
        if (!(card instanceof HTMLElement)) {
            return;
        }

        const orderId = String(card.dataset.orderId || '').trim();
        if (!orderId) {
            return;
        }

        selectedOrderId = selectedOrderId === orderId ? null : orderId;
        renderOrders();
    });
}

if (orderTicketPanel) {
    orderTicketPanel.addEventListener('click', async (event) => {
        const target = event.target;
        if (!(target instanceof Element)) {
            return;
        }

        const actionButton = target.closest('button[data-order-ticket-action]');
        if (!(actionButton instanceof HTMLButtonElement)) {
            return;
        }

        if (actionButton.dataset.orderTicketAction === 'copy') {
            const copyValue = String(actionButton.dataset.copyValue || '').trim();
            const copyLabel = String(actionButton.dataset.copyLabel || 'Dato').trim();

            try {
                const copied = await copyTextToClipboard(copyValue);
                if (!copied) {
                    showNotice(`No se pudo copiar ${copyLabel.toLowerCase()} automaticamente.`, 'error');
                }
            } catch (error) {
                showNotice(`No se pudo copiar ${copyLabel.toLowerCase()}: ${error.message || 'error inesperado.'}`, 'error');
            }
            return;
        }

        const orderId = String(actionButton.dataset.orderId || '').trim();
        if (!orderId) {
            return;
        }

        if (actionButton.dataset.orderTicketAction === 'print') {
            try {
                openOrderPrintTicket(orderId);
            } catch (error) {
                showNotice(`No se pudo abrir la impresion: ${error.message || 'error inesperado.'}`, 'error');
            }
            return;
        }

        if (actionButton.dataset.orderTicketAction === 'contact') {
            try {
                openOrderContactCard(orderId);
                showNotice(isMobileContactImportContext() ? 'Abriendo el contacto del cliente.' : 'Contacto del cliente descargado en formato VCF.', 'ok');
            } catch (error) {
                showNotice(`No se pudo crear el contacto: ${error.message || 'error inesperado.'}`, 'error');
            }
        }
    });
}

if (categoryCreateForm) {
    categoryCreateForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        hideNotice();
        hideModalFeedback(categoryCreateFeedback);

        const name = String(modalCategoryNameInput?.value || '').trim();

        if (!name) {
            showModalFeedback(categoryCreateFeedback, 'Debes escribir el nombre de la categoria.', 'error');
            return;
        }

        if (categoryCreateSaveBtn) {
            categoryCreateSaveBtn.disabled = true;
            categoryCreateSaveBtn.textContent = 'Creando...';
        }

        try {
            const created = await createCategoryByName(name);
            if (created) {
                showModalFeedback(categoryCreateFeedback, 'Categoria creada correctamente.', 'ok');
                await waitForUiDelay(650);
                closeCategoryCreateModal();
            }
        } catch (error) {
            showNotice(`No se pudo crear la categoria: ${error.message || 'Error inesperado.'}`, 'error');
            showModalFeedback(categoryCreateFeedback, `No se pudo crear la categoria: ${error.message || 'Error inesperado.'}`, 'error');
            if (categoryCreateSaveBtn) {
                categoryCreateSaveBtn.disabled = false;
                categoryCreateSaveBtn.textContent = 'Crear categoria';
            }
        }
    });
}

if (productCreateForm) {
    productCreateForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        hideNotice();
        hideModalFeedback(productCreateFeedback);

        const nombre = String(createProductNameInput?.value || '').trim();
        const precio = Number(createProductPriceInput?.value || 0);
        const categoria = String(createProductCategorySelect?.value || '').trim();
        const estado = createProductStateSelect?.value === 'paused' ? 'paused' : 'active';
        const esDestacado = createProductFeaturedSelect?.value === 'true';
        const imageUrlInput = String(createProductImageUrlInput?.value || '').trim();
        const imageFile = createProductImageFileInput && createProductImageFileInput.files
            ? createProductImageFileInput.files[0]
            : null;

        if (!categoriesState.length) {
            showNotice('Primero crea o sincroniza al menos una categoria.', 'error');
            showModalFeedback(productCreateFeedback, 'Primero crea o sincroniza al menos una categoria.', 'error');
            return;
        }

        if (!nombre || !categoria) {
            showNotice('Completa nombre y categoria del producto.', 'error');
            showModalFeedback(productCreateFeedback, 'Completa nombre y categoria del producto.', 'error');
            return;
        }

        if (!Number.isFinite(precio) || precio < 0) {
            showNotice('Precio invalido.', 'error');
            showModalFeedback(productCreateFeedback, 'Precio invalido.', 'error');
            return;
        }

        const categoryExists = categoriesState.some((category) => normalizeCategoryKey(category.name) === normalizeCategoryKey(categoria));
        if (!categoryExists) {
            showNotice('La categoria seleccionada no existe o no esta cargada.', 'error');
            showModalFeedback(productCreateFeedback, 'La categoria seleccionada no existe o no esta cargada.', 'error');
            return;
        }

        if (imageFile && imageFile.size > 20 * 1024 * 1024) {
            showNotice('La imagen supera 20 MB. Reduce el tamano para continuar.', 'error');
            showModalFeedback(productCreateFeedback, 'La imagen supera 20 MB. Reduce el tamano para continuar.', 'error');
            return;
        }

        const duplicatedProduct = productsState.some((product) => {
            return normalizeCategoryKey(product.nombre) === normalizeCategoryKey(nombre)
                && normalizeCategoryKey(product.categoria) === normalizeCategoryKey(categoria);
        });

        if (duplicatedProduct) {
            showNotice('Ese producto ya existe en la categoria seleccionada.', 'error');
            showModalFeedback(productCreateFeedback, 'Ese producto ya existe en la categoria seleccionada.', 'error');
            return;
        }

        if (productCreateSaveBtn) {
            productCreateSaveBtn.disabled = true;
            productCreateSaveBtn.textContent = 'Creando...';
        }

        try {
            let finalImageUrl = imageUrlInput || buildDefaultProductImage(nombre, categoria);
            if (imageFile) {
                finalImageUrl = await resolveProductImageUpload(imageFile, nombre);
            }

            const safeSlug = slugify(nombre) || `producto-${Date.now()}`;
            const productId = `${safeSlug}-${Date.now()}`;
            await firebaseDb.collection('productos').doc(productId).set({
                id: productId,
                nombre,
                precio,
                categoria,
                estado,
                es_destacado: esDestacado,
                image_url: finalImageUrl,
                source: 'admin_panel',
                created_at: firestoreNow(),
                updated_at: firestoreNow()
            });

            await reloadDataAndRender();
            showModalFeedback(productCreateFeedback, 'Producto creado correctamente.', 'ok');
            await waitForUiDelay(650);
            closeProductCreateModal();

            const createdCategory = categoriesState.find((category) => category.name === categoria);
            if (createdCategory) {
                openCategoryProductsModal(createdCategory.id);
            }

            showNotice('Producto creado correctamente.', 'ok');
        } catch (error) {
            showNotice(`No se pudo crear el producto: ${error.message || 'Error inesperado.'}`, 'error');
            showModalFeedback(productCreateFeedback, `No se pudo crear el producto: ${error.message || 'Error inesperado.'}`, 'error');
            if (productCreateSaveBtn) {
                productCreateSaveBtn.disabled = false;
                productCreateSaveBtn.textContent = 'Crear producto';
            }
        }
    });
}

if (productEditForm) {
    productEditForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        hideNotice();

        const productId = String(editProductIdInput?.value || '').trim();
        const nombre = String(editProductNameInput?.value || '').trim();
        const precio = Number(editProductPriceInput?.value || 0);
        const categoria = String(editProductCategorySelect?.value || '').trim();
        const estado = editProductStateSelect?.value === 'paused' ? 'paused' : 'active';
        const esDestacado = editProductFeaturedSelect?.value === 'true';
        const imageUrlInput = String(editProductImageUrlInput?.value || '').trim();
        const imageFile = editProductImageFileInput && editProductImageFileInput.files
            ? editProductImageFileInput.files[0]
            : null;

        if (!productId || !nombre || !categoria) {
            showNotice('Completa nombre y categoria del producto.', 'error');
            return;
        }

        if (!Number.isFinite(precio) || precio < 0) {
            showNotice('Precio invalido.', 'error');
            return;
        }

        if (!imageFile && !imageUrlInput) {
            showNotice('Debes mantener imagen actual o cargar una nueva.', 'error');
            return;
        }

        if (imageFile && imageFile.size > 20 * 1024 * 1024) {
            showNotice('La imagen supera 20 MB. Reduce el tamano para continuar.', 'error');
            return;
        }

        if (productEditSaveBtn) {
            productEditSaveBtn.disabled = true;
            productEditSaveBtn.textContent = 'Guardando...';
        }

        try {
            let finalImageUrl = imageUrlInput;
            if (imageFile) {
                finalImageUrl = await resolveProductImageUpload(imageFile, nombre);
            }

            await firebaseDb.collection('productos').doc(productId).update({
                nombre,
                precio,
                categoria,
                estado,
                es_destacado: esDestacado,
                image_url: finalImageUrl,
                updated_at: firestoreNow()
            });

            await reloadDataAndRender();

            closeProductEditModal();
            showNotice('Producto editado correctamente.', 'ok');
        } catch (error) {
            showNotice(`No se pudo actualizar el producto: ${error.message || 'Error inesperado.'}`, 'error');
            if (productEditSaveBtn) {
                productEditSaveBtn.disabled = false;
                productEditSaveBtn.textContent = 'Guardar cambios';
            }
        }
    });
}

if (buttonConfigForm) {
    buttonConfigForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        hideNotice();

        const formData = new FormData(buttonConfigForm);
        const payload = normalizeButton({
            id: String(formData.get('buttonId') || '').trim(),
            label: String(formData.get('buttonLabel') || '').trim(),
            icon: String(formData.get('buttonIcon') || '🔗').trim(),
            actionType: String(formData.get('buttonActionType') || 'external').trim(),
            link: String(formData.get('buttonLink') || '').trim(),
            buttonType: String(formData.get('buttonType') || 'neon').trim(),
            color: String(formData.get('buttonColor') || '#ff6000').trim(),
            size: String(formData.get('buttonSize') || 'md').trim(),
            soundEnabled: formData.get('buttonSoundEnabled') === 'on',
            volume: Number(formData.get('buttonVolume') || 0.1),
            estado: String(formData.get('buttonState') || 'active').trim(),
            visible: String(formData.get('buttonVisible') || 'true') === 'true',
            order: Number(formData.get('buttonOrder') || 99)
        });

        if (!payload.id || !payload.label) {
            showNotice('Debes completar ID y texto del boton.', 'error');
            return;
        }

        if (payload.actionType === 'external' && !payload.link) {
            showNotice('Los botones externos deben tener enlace.', 'error');
            return;
        }

        try {
            await firebaseDb.collection('botones').doc(payload.id).set({
                ...payload,
                updated_at: firestoreNow()
            }, { merge: true });

            await reloadDataAndRender();
            resetButtonForm();
            showNotice('Boton guardado correctamente.', 'ok');
        } catch (error) {
            showNotice(`No se pudo guardar el boton: ${error.message || 'Error inesperado.'}`, 'error');
        }
    });
}

if (buttonConfigList) {
    buttonConfigList.addEventListener('click', async (event) => {
        const target = event.target;
        if (!(target instanceof HTMLButtonElement)) {
            return;
        }

        const action = target.dataset.action;
        const buttonId = target.dataset.buttonId;
        if (!action || !buttonId) {
            return;
        }

        const selected = buttonsState.find((item) => item.id === buttonId);
        if (!selected) {
            showNotice('Boton no encontrado.', 'error');
            return;
        }

        try {
            if (action === 'edit-button') {
                setButtonForm(selected);
                showNotice(`Editando ${selected.id}.`, 'ok');
                return;
            }

            if (action === 'toggle-button') {
                const estado = selected.estado === 'active' ? 'paused' : 'active';
                await firebaseDb.collection('botones').doc(buttonId).update({
                    estado,
                    updated_at: firestoreNow()
                });
                await reloadDataAndRender();
                showNotice(`Boton ${buttonId}: ${estado === 'active' ? 'activado' : 'pausado'}.`, 'ok');
                return;
            }

            if (action === 'toggle-visible') {
                await firebaseDb.collection('botones').doc(buttonId).update({
                    visible: !selected.visible,
                    updated_at: firestoreNow()
                });
                await reloadDataAndRender();
                showNotice(`Boton ${buttonId}: ${selected.visible ? 'oculto' : 'visible'}.`, 'ok');
                return;
            }

            if (action === 'delete-button') {
                const confirmed = window.confirm(`Eliminar boton ${buttonId}?`);
                if (!confirmed) {
                    return;
                }

                await firebaseDb.collection('botones').doc(buttonId).delete();
                await reloadDataAndRender();
                resetButtonForm();
                showNotice(`Boton ${buttonId} eliminado.`, 'ok');
            }
        } catch (error) {
            showNotice(`No se pudo actualizar el boton: ${error.message || 'Error inesperado.'}`, 'error');
        }
    });
}

brandingForm.addEventListener('input', () => {
    renderBrandingPreview();
});

brandingForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    hideNotice();

    const formData = new FormData(brandingForm);
    const payload = normalizeBranding({
        restaurantName: String(formData.get('restaurantName') || '').trim(),
        slogan: String(formData.get('restaurantSlogan') || '').trim(),
        logoUrl: brandingState.logoUrl,
        whatsappNumber: String(formData.get('restaurantWhatsappNumber') || '').trim(),
        whatsappLink: String(formData.get('restaurantWhatsappLink') || '').trim(),
        businessHours: String(formData.get('restaurantBusinessHours') || '').trim(),
        address: String(formData.get('restaurantAddress') || '').trim(),
        locationLink: String(formData.get('restaurantLocationLink') || '').trim(),
        instagramLink: String(formData.get('restaurantInstagramLink') || '').trim(),
        tiktokLink: String(formData.get('restaurantTiktokLink') || '').trim(),
        facebookLink: String(formData.get('restaurantFacebookLink') || '').trim(),
        primaryColor: brandingState.primaryColor,
        secondaryColor: brandingState.secondaryColor,
        accentColor: brandingState.accentColor,
        template: brandingState.template,
        bgColor: brandingState.bgColor,
        buttonBorderColor: brandingState.buttonBorderColor,
        fontFamily: brandingState.fontFamily,
        fontSizeBase: brandingState.fontSizeBase,
        interactionVolume: brandingState.interactionVolume,
        animationSpeed: brandingState.animationSpeed
    });

    try {
        await firebaseDb.collection(CONFIG_COLLECTION).doc(CONFIG_DOC_ID).set({
            ...payload,
            updated_at: firestoreNow()
        }, { merge: true });

        await syncBrandingLinksToButtons(payload);
        brandingState = payload;
        renderBrandingForm();
        showNotice('Informacion del negocio guardada.', 'ok');
    } catch (error) {
        showNotice(`No se pudo guardar la configuracion: ${error.message || 'Error inesperado.'}`, 'error');
    }
});

if (templateGrid) {
    templateGrid.addEventListener('click', (event) => {
        const target = event.target;
        if (!(target instanceof HTMLButtonElement)) {
            return;
        }

        const template = target.dataset.template;
        if (!template) {
            return;
        }

        applyTemplateToForm(template);
    });
}

if (buttonVolumeInput && buttonVolumeOut) {
    buttonVolumeInput.addEventListener('input', () => {
        buttonVolumeOut.textContent = Number(buttonVolumeInput.value).toFixed(2);
    });
}

if (designFontSizeInput && designFontSizeOut) {
    designFontSizeInput.addEventListener('input', () => {
        designFontSizeOut.textContent = `${Math.round(Number(designFontSizeInput.value || 16))}px`;
        renderBrandingPreview();
    });
}

if (interactionVolumeInput && interactionVolumeOut) {
    interactionVolumeInput.addEventListener('input', () => {
        interactionVolumeOut.textContent = Number(interactionVolumeInput.value || 0.1).toFixed(2);
        renderBrandingPreview();
    });
}

if (animationSpeedInput && animationSpeedOut) {
    animationSpeedInput.addEventListener('input', () => {
        animationSpeedOut.textContent = `${Number(animationSpeedInput.value || 1).toFixed(1)}x`;
        renderBrandingPreview();
    });
}

if (liveMenuPreview) {
    liveMenuPreview.addEventListener('load', () => {
        renderBrandingPreview();
    });
}

if (previewRefreshBtn) {
    previewRefreshBtn.addEventListener('click', () => {
        refreshLivePreview();
    });
}

if (authForgotBtn) {
    authForgotBtn.addEventListener('click', async () => {
        const email = String(authUsernameInput?.value || '').trim();

        if (!firebaseAuth) {
            window.alert('Firebase Auth no esta disponible en este momento.');
            return;
        }

        if (!email) {
            window.alert('Ingresa primero el correo administrador para enviar el enlace de recuperacion.');
            authUsernameInput?.focus();
            return;
        }

        try {
            await firebaseAuth.sendPasswordResetEmail(email);
            window.alert('Se envio un correo de recuperacion si la cuenta existe en Firebase Auth.');
        } catch (error) {
            window.alert(`No se pudo enviar el correo de recuperacion: ${error.message || 'error inesperado.'}`);
        }
    });
}

if (authRegisterBtn) {
    authRegisterBtn.addEventListener('click', () => {
        window.alert('El alta de administradores debe hacerse desde Firebase Console o una herramienta interna segura.');
    });
}

if (adminSignOutBtn) {
    adminSignOutBtn.addEventListener('click', async () => {
        if (!firebaseAuth) {
            return;
        }

        try {
            await firebaseAuth.signOut();
            document.body.classList.add('admin-locked');
            document.body.classList.remove('admin-unlocked');

            if (authPasswordInput) {
                authPasswordInput.value = '';
            }

            if (authError) {
                authError.classList.remove('show');
                authError.textContent = '';
            }

            authUsernameInput?.focus();
            showNotice('Sesion cerrada.', 'ok');
        } catch (error) {
            showNotice(`No se pudo cerrar sesion: ${error.message || 'error inesperado.'}`, 'error');
        }
    });
}

async function initAdmin() {
    try {
        if (!getSharedFirebaseConfig()) {
            throw new Error('No se encontro FIREBASE_CONFIG compartido.');
        }

        const services = initFirebaseServices();
        firebaseDb = services.db;
        firebaseStorage = services.storage;
        firebaseAuth = services.auth;

        applyAdminRuntimeLinks();
        syncResponsiveAdminState();

        await ensureAdminAuth();
        requestAdminNotificationPermission();

        setupAccordion();
        setupAdvancedSettingsPanel();
        setupPreviewViewportControls();
        setupCardCollapse();
        setupSectionSaveButtons();
        resetButtonForm();

        await seedDataIfNeeded();
        await reloadDataAndRender();
        ensureOrdersRealtimeTicker();
        setupLiveFirebaseSync();
    } catch (error) {
        if (!document.body.classList.contains('admin-unlocked')) {
            document.body.classList.add('admin-locked');
            document.body.classList.remove('admin-unlocked');
        }

        showNotice(`Error de conexion con Firebase: ${error.message || 'revisa la configuracion.'}`, 'error');
    }
}

initAdmin();
