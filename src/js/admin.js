const MAX_FEATURED = 5;

const PUBLIC_CATEGORY_CATALOG = [
    { id: 'burger-premium', name: 'BURGER PREMIUM', active: true, image_url: '' },
    { id: 'burger-clasicas', name: 'BURGER CLASICAS', active: true, image_url: '' },
    { id: 'pepitos-venezolanos', name: 'PEPITOS VENEZOLANOS', active: true, image_url: '' },
    { id: 'perros-calientes', name: 'PERROS CALIENTES', active: true, image_url: '' },
    { id: 'entradas', name: 'ENTRADAS', active: true, image_url: '' },
    { id: 'salchipapas', name: 'SALCHIPAPAS', active: true, image_url: '' },
    { id: 'combos-papas-bebida', name: 'COMBOS CON PAPAS Y BEBIDA', active: true, image_url: '' },
    { id: 'combos-mixtos', name: 'COMBOS MIXTOS', active: true, image_url: '' },
    { id: 'nuestras-salsas', name: 'NUESTRAS SALSAS', active: true, image_url: '' },
    { id: 'bebidas-adicionales', name: 'BEBIDAS Y ADICIONALES', active: true, image_url: '' },
    { id: 'bebidas', name: 'BEBIDAS', active: true, image_url: '' }
];

const PUBLIC_PRODUCT_CATALOG = [
    { id: 'burger-clasicas-normal', nombre: 'Normal', precio: 17000, categoria: 'BURGER CLASICAS', estado: 'active', es_destacado: false, image_url: '' },
    { id: 'burger-clasicas-super', nombre: 'Super', precio: 19000, categoria: 'BURGER CLASICAS', estado: 'active', es_destacado: false, image_url: '' },
    { id: 'burger-premium-caracas', nombre: 'Caracas', precio: 26000, categoria: 'BURGER PREMIUM', estado: 'active', es_destacado: false, image_url: '' },
    { id: 'burger-premium-cordillera', nombre: 'Cordillera', precio: 34000, categoria: 'BURGER PREMIUM', estado: 'active', es_destacado: false, image_url: '' },
    { id: 'burger-premium-papuda', nombre: 'Papuda', precio: 20000, categoria: 'BURGER PREMIUM', estado: 'active', es_destacado: false, image_url: '' },
    { id: 'burger-premium-plus', nombre: 'Plus', precio: 30000, categoria: 'BURGER PREMIUM', estado: 'active', es_destacado: false, image_url: '' },
    { id: 'burger-premium-ranchera', nombre: 'Ranchera', precio: 30000, categoria: 'BURGER PREMIUM', estado: 'active', es_destacado: false, image_url: '' },
    { id: 'burger-premium-triplete', nombre: 'Triplete', precio: 29000, categoria: 'BURGER PREMIUM', estado: 'active', es_destacado: false, image_url: '' },
    { id: 'pepitos-mix', nombre: 'Mix', precio: 29000, categoria: 'PEPITOS VENEZOLANOS', estado: 'active', es_destacado: false, image_url: '' },
    { id: 'pepitos-plus', nombre: 'Plus', precio: 36000, categoria: 'PEPITOS VENEZOLANOS', estado: 'active', es_destacado: false, image_url: '' },
    { id: 'pepitos-ranchero', nombre: 'Ranchero', precio: 34000, categoria: 'PEPITOS VENEZOLANOS', estado: 'active', es_destacado: false, image_url: '' },
    { id: 'pepitos-urbano', nombre: 'Urbano', precio: 30000, categoria: 'PEPITOS VENEZOLANOS', estado: 'active', es_destacado: false, image_url: '' },
    { id: 'perros-especial', nombre: 'Especial', precio: 15000, categoria: 'PERROS CALIENTES', estado: 'active', es_destacado: false, image_url: '' },
    { id: 'perros-normal', nombre: 'Normal', precio: 12000, categoria: 'PERROS CALIENTES', estado: 'active', es_destacado: false, image_url: '' },
    { id: 'perros-super', nombre: 'Super', precio: 16000, categoria: 'PERROS CALIENTES', estado: 'active', es_destacado: false, image_url: '' },
    { id: 'entradas-papas-francesa', nombre: 'Papas a la Francesa', precio: 8000, categoria: 'ENTRADAS', estado: 'active', es_destacado: false, image_url: '' },
    { id: 'entradas-tequenos', nombre: 'Tequenos', precio: 8000, categoria: 'ENTRADAS', estado: 'active', es_destacado: false, image_url: '' },
    { id: 'salchipapas-normal', nombre: 'Salchi Normal', precio: 12000, categoria: 'SALCHIPAPAS', estado: 'active', es_destacado: false, image_url: '' },
    { id: 'salchipapas-super', nombre: 'Salchi Super', precio: 19000, categoria: 'SALCHIPAPAS', estado: 'active', es_destacado: false, image_url: '' },
    { id: 'combos-papas-burger-normal', nombre: 'Combo Burger Normal', precio: 21000, categoria: 'COMBOS CON PAPAS Y BEBIDA', estado: 'active', es_destacado: false, image_url: '' },
    { id: 'combos-papas-burger-papuda', nombre: 'Combo Burger Papuda', precio: 27000, categoria: 'COMBOS CON PAPAS Y BEBIDA', estado: 'active', es_destacado: false, image_url: '' },
    { id: 'combos-papas-burger-super', nombre: 'Combo Burger Super', precio: 26000, categoria: 'COMBOS CON PAPAS Y BEBIDA', estado: 'active', es_destacado: false, image_url: '' },
    { id: 'combos-papas-perro-normal', nombre: 'Combo Perro Normal', precio: 17000, categoria: 'COMBOS CON PAPAS Y BEBIDA', estado: 'active', es_destacado: false, image_url: '' },
    { id: 'combos-mixtos-de-la-casa', nombre: 'De La Casa', precio: 49000, categoria: 'COMBOS MIXTOS', estado: 'active', es_destacado: false, image_url: '' },
    { id: 'combos-mixtos-emparejados', nombre: 'Emparejados', precio: 45000, categoria: 'COMBOS MIXTOS', estado: 'active', es_destacado: false, image_url: '' },
    { id: 'combos-mixtos-familiar-3', nombre: 'Familiar 3', precio: 48000, categoria: 'COMBOS MIXTOS', estado: 'active', es_destacado: false, image_url: '' },
    { id: 'combos-mixtos-familiar-4', nombre: 'Familiar 4', precio: 44000, categoria: 'COMBOS MIXTOS', estado: 'active', es_destacado: false, image_url: '' },
    { id: 'bebidas-adicionales-adicionales', nombre: 'Adicionales', precio: 2000, categoria: 'BEBIDAS Y ADICIONALES', estado: 'active', es_destacado: false, image_url: '' },
    { id: 'bebidas-adicionales-bebidas', nombre: 'Bebidas', precio: 3500, categoria: 'BEBIDAS Y ADICIONALES', estado: 'active', es_destacado: false, image_url: '' },
    { id: 'nuestras-salsas-salsas-casa', nombre: 'Salsas de la Casa', precio: 1000, categoria: 'NUESTRAS SALSAS', estado: 'active', es_destacado: false, image_url: '' }
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
    restaurantName: 'Roal Burger',
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
const HORARIO_DOC_ID = 'config_horario';
const RECOMENDADO_DIA_DOC_ID = 'recomendado_dia';
const PROMOCIONES_COLLECTION = 'promociones';
const COMBOS_ESPECIALES_COLLECTION = 'combos_especiales';
const PROMOS_2X1_COLLECTION = 'promos_2x1';
const UPGRADES_CONFIG_DOC_ID = 'acompañamientos';
const DEFAULT_HORARIO = {
    aperturaHora: 16, aperturaMinuto: 0,
    cierreHora: 22, cierreMinuto: 0,
    etiquetaHorario: 'Lunes a Domingo: 4:00 P.M. a 10:00 P.M.',
    mensajeCierre: 'Disculpa, en este momento estamos cerrados. Nuestro horario de pedidos es de 4:00 P.M. a 10:00 P.M.'
};
let horarioState = { ...DEFAULT_HORARIO };
let horarioForm = null;
const ORDERS_COLLECTION = 'pedidos';
const CLIENTS_COLLECTION = 'clientes';
const MESSAGES_COLLECTION = 'mensajes';
const ORDER_SEQUENCE_DOC_ID = '_meta_order_sequence';
const ORDER_CODE_PREFIX = 'RB';
const ORDER_CODE_START = 2026;
const SALES_SUMMARY_COLLECTION = 'resumen_ventas';
const SALES_DAY_STATE_COLLECTION = 'admin_estado';
const SALES_DAY_STATE_DOC_ID = 'jornada_ventas_actual';
const CIERRES_CAJA_COLLECTION = 'cierres_caja';
const CAJA_ESTADO_DOC_ID = 'estado_caja';

const adminAuthForm = document.getElementById('adminAuthForm');
const authUsernameInput = document.getElementById('authUsername');
const authPasswordInput = document.getElementById('authPassword');
const authRememberDeviceInput = document.getElementById('authRememberDevice');
const authError = document.getElementById('authError');
const authSubmitBtn = document.getElementById('authSubmitBtn');
const authForgotBtn = document.getElementById('authForgotBtn');
const authRegisterBtn = document.getElementById('authRegisterBtn');
const authPasswordToggle = document.getElementById('authPasswordToggle');
const adminSignOutBtn = document.getElementById('adminSignOutBtn');

// ─── Login rate-limiter ────────────────────────────────────────────────────────
const AUTH_MAX_ATTEMPTS = 5;
const AUTH_LOCK_MS      = 30_000; // 30 segundos de bloqueo

// reCAPTCHA v3 invisible — para activarlo:
// 1. Registra tu dominio en https://www.google.com/recaptcha/admin (tipo: v3)
// 2. Pega aquí la Site Key pública (la privada va en tu Cloud Function de verificación)
const RECAPTCHA_SITE_KEY = '6LdVXSotAAAAADkwGbDpxT8P8b24MEv62xTcAlu0';

let _loginAttempts    = 0;
let _loginLockedUntil = 0;
let _loginLockTimer   = null;

if (RECAPTCHA_SITE_KEY) {
    const _rcScript    = document.createElement('script');
    _rcScript.src      = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
    _rcScript.async    = true;
    document.head.appendChild(_rcScript);
}

const categoryForm = document.getElementById('categoryForm');
const categoryList = document.getElementById('categoryList');
const categoryDetailPanel = document.getElementById('categoryDetailPanel');
const carruselTabPanel = document.getElementById('carruselTabPanel');
const openCreateCategoryBtn = document.getElementById('openCreateCategoryBtn');
const openCreateProductBtn = document.getElementById('openCreateProductBtn');
let _selectedCategoryId = null;
let _editingProductId = null;
let _cpefVariantes = [];
let _cpefBebidaIncluida = {};
const notice = document.getElementById('adminNotice');
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
const unreadTrayBtn = document.getElementById('unreadTrayBtn');
const unreadTray = document.getElementById('unreadTray');
const unreadTrayCloseBtn = document.getElementById('unreadTrayCloseBtn');
const ordersColumnUnread = document.getElementById('ordersColumnUnread');
const ordersColumnTakeaway = document.getElementById('ordersColumnTakeaway');
const ordersColumnDelivery = document.getElementById('ordersColumnDelivery');
const ordersColumnMesa = document.getElementById('ordersColumnMesa');
const ordersCountUnread = document.getElementById('ordersCountUnread');
const ordersCountTakeaway = document.getElementById('ordersCountTakeaway');
const ordersCountDelivery = document.getElementById('ordersCountDelivery');
const ordersCountMesa = document.getElementById('ordersCountMesa');
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
const salesDayGrandTotal     = document.getElementById('salesDayGrandTotal');
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
const productEditSaveBtn = document.getElementById('productEditSaveBtn');

// Estado de imagen para formularios de producto
let _createProductImgUrl    = ''; // URL subida en crear (vacío = sin imagen nueva)
let _editProductImgUrl      = ''; // URL subida en editar (vacío = sin imagen nueva)
let _editProductExistingUrl = ''; // URL de imagen existente al abrir editar
const editProductAcompActivo = document.getElementById('editProductAcompActivo');
const editProductAcompList = document.getElementById('editProductAcompList');

let bebidasState = [];
let acompanantesState = [];
let combosPackState = [];
let catalogoVisibilidad = { bebidas_pos: true, bebidas_menu: true, acompanantes_pos: true, acompanantes_menu: true };

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
let viewedOrderIds = new Set(); // pedidos abiertos en el ticket — dejan de tintiliar aunque sigan pendiente
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
let _posClientEditPending = false; // true when edit modal opened from POS card
let posTicketConfig = null; // { orderType, mesaNumber, customerName, customerPhone }
let posTickets = [];
let posActiveTicketId = null;
let _editingOrderData = null; // set when editing an existing order, cleared after save

const POS_TICKETS_COLLECTION = 'pos_tickets';
let posTicketsUnsubscribe = null;
const _sentToReceptionIds = new Set(); // IDs de tickets enviados a recepción, pendientes de eliminar en Firestore

async function savePosTicketToFirestore(ticket) {
    if (!ticket || !firebaseDb) return;
    try {
        const data = { ...ticket };
        if (!data.createdAt) data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        data.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
        await firebaseDb.collection(POS_TICKETS_COLLECTION).doc(ticket.id).set(data, { merge: true });
    } catch (err) {
        console.error('[POS] Error guardando ticket en Firestore:', err);
    }
}

async function deletePosTicketFromFirestore(ticketId) {
    if (!ticketId || !firebaseDb) return;
    try {
        await firebaseDb.collection(POS_TICKETS_COLLECTION).doc(ticketId).delete();
    } catch (err) {
        console.error('[POS] Error eliminando ticket de Firestore:', err);
    }
}

function subscribePosTickets() {
    if (!firebaseDb) return;
    if (posTicketsUnsubscribe) posTicketsUnsubscribe();
    posTicketsUnsubscribe = firebaseDb.collection(POS_TICKETS_COLLECTION)
        .orderBy('createdAt', 'asc')
        .onSnapshot((snapshot) => {
            const firestoreTickets = snapshot.docs
                .map((doc) => ({ ...doc.data(), id: doc.id }))
                .filter((t) => !_sentToReceptionIds.has(t.id)); // Ocultar tickets ya enviados a recepción
            // Limpiar IDs que ya no están en Firestore (eliminación completada)
            _sentToReceptionIds.forEach((id) => {
                if (!snapshot.docs.find((d) => d.id === id)) _sentToReceptionIds.delete(id);
            });
            // Preservar solo el ticket local activo si aún no fue guardado en Firestore
            // (descartar tickets vacíos locales que no están activos para evitar acumulación)
            const localOnlyTickets = posTickets.filter(
                (t) => !firestoreTickets.find((ft) => ft.id === t.id) &&
                    (t.id === posActiveTicketId || (t.items && t.items.length > 0))
            );
            const merged = [...firestoreTickets, ...localOnlyTickets];
            posTickets = merged.map((ft) =>
                ft.id === posActiveTicketId ? { ...ft, items: internalOrderItems } : ft
            );
            // Si el ticket activo fue eliminado por otro usuario, cambiar al primero disponible
            if (posActiveTicketId && !posTickets.find((t) => t.id === posActiveTicketId)) {
                if (posTickets.length) {
                    const first = posTickets[0];
                    posActiveTicketId = first.id;
                    internalOrderItems = first.items || [];
                    posTicketConfig = first.orderType ? {
                        orderType: first.orderType, mesaNumber: first.mesaNumber || null,
                        customerName: first.customerName || '', customerPhone: first.customerPhone || '',
                        deliveryAddress: first.deliveryAddress || '', deliveryFee: first.deliveryFee ?? null
                    } : null;
                } else {
                    posActiveTicketId = null;
                    internalOrderItems = [];
                    posTicketConfig = null;
                }
            }
            clearTimeout(_posTicketsRenderTimer);
            _posTicketsRenderTimer = setTimeout(() => {
                renderPosTicketsBadge();
                _ptsMarkOccupiedMesas();
                const ticketsScreen = document.getElementById('posScreenTickets');
                if (ticketsScreen && !ticketsScreen.hidden) renderPosTicketsList();
                const modal = document.getElementById('internalOrderModal');
                if (modal?.classList.contains('is-open')) {
                    const activeTicket = posTickets.find((t) => t.id === posActiveTicketId);
                    const labelEl = document.getElementById('posActiveTicketLabel');
                    if (labelEl && activeTicket) labelEl.textContent = activeTicket.label;
                    renderPosOrderItems();
                    renderPosTotals();
                    renderPosBottomBar();
                }
            }, 80);
        }, (err) => {
            console.error('[POS] Error en listener pos_tickets:', err);
        });
}
let _posSelectedTicketIds = new Set();
let menuUpgradesConfig = null;
let _posUpgradePending = null;
let clientsSearchTerm = '';
let _clientsPage = 0;
const CLIENTS_PAGE_SIZE = 50;
let expandedClientAddressIds = new Set();
let productClicksState = [];
let liveSubscriptions = [];
let recomendadoDiaState = null;
let promosState = [];
let _promoEditingId = null;
let _promoFormProductId = null;
let combosEspecialesState = [];
let _comboEditingId = null;
let promos2x1State = [];
let _promo2x1EditingId = null;
let _promo2x1FormProductId = null;
let _comboFormProducts = [];  // [{id, nombre, precio, imagen}]
let _comboDiasSeleccionados = [];
let _comboHorarioTipo = 'siempre';

// ── Bluetooth printer state ──
let _btPrinterDevice = null;
let _btPrinterCharacteristic = null;
const _BT_SERVICES = [
    '000018f0-0000-1000-8000-00805f9b34fb',
    'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
    '49535343-fe7d-4158-b166-31a325542a27',
    '49535343-fe7d-4ae5-8fa9-9fafd205e455',
];
const _BT_TX_CHARS = [
    '00002af1-0000-1000-8000-00805f9b34fb',
    'bef8d6c9-9c21-4c9e-b632-bd58c1009f9f',
    '49535343-1e4d-4bd9-ba61-23c647249616',
];
let _recomendadoSelectedProductId = null;
const _processedAccordionExpanded = new Set();
let previewRefreshTimer = null;
let ordersRealtimeTimer = null;
let _liveReloadTimer = null;
let _posTicketsRenderTimer = null;
let clipboardToastTimer = null;
let activeMobileOrdersLane = '';
let adminTitleBlinkTimer = null;
let adminTitleBlinkState = false;
const adminBaseTitle = document.title || 'FODEXA | Admin';
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
                let addrStr = entry.address ?? entry.value ?? entry.label ?? '';
                if (typeof addrStr === 'object' && addrStr !== null) {
                    addrStr = addrStr.address ?? addrStr.label ?? addrStr.street ?? addrStr.text ?? '';
                }
                appendAddress(addrStr);
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

function renderClientAddrChips(addresses) {
    const list = document.getElementById('clientEditAddressList');
    if (!list) return;
    list.innerHTML = addresses.filter(Boolean).map((addr) =>
        `<div class="client-addr-chip" data-addr="${escapeHtml(addr)}">
            <span class="client-addr-text">${escapeHtml(addr)}</span>
            <button type="button" class="client-addr-del" aria-label="Eliminar direccion">&times;</button>
        </div>`
    ).join('');
}

function getClientAddrChips() {
    const list = document.getElementById('clientEditAddressList');
    if (!list) return [];
    return Array.from(list.querySelectorAll('.client-addr-chip'))
        .map((chip) => String(chip.dataset.addr || '').trim())
        .filter(Boolean);
}

let _mobToastTimer = null;
function _bindOverlayClose(overlay, closeFn) {
    let _downOnOverlay = false;
    overlay.addEventListener('mousedown', (e) => { _downOnOverlay = e.target === overlay; });
    overlay.addEventListener('click', (e) => { if (_downOnOverlay && e.target === overlay) closeFn(); });
}

function showNotice(text, type = 'ok') {
    if (!notice) {
        return;
    }
    notice.textContent = text;
    notice.className = `notice show ${type}`;

    if (isMobileAdminViewport()) {
        let toast = document.getElementById('adminMobileToast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'adminMobileToast';
            document.body.appendChild(toast);
        }
        toast.textContent = text;
        toast.className = `mob-toast--${type} mob-toast--visible`;
        if (_mobToastTimer) clearTimeout(_mobToastTimer);
        _mobToastTimer = setTimeout(() => {
            toast.classList.remove('mob-toast--visible');
        }, 3000);
    }
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
    const validLanes = ['unread', 'mesa', 'domicilios', 'recoger'];
    const nextLane = validLanes.includes(activeMobileOrdersLane) ? activeMobileOrdersLane : '';

    document.querySelectorAll('.orders-lane[data-mobile-lane]').forEach((lane) => {
        const laneKey = String(lane.getAttribute('data-mobile-lane') || '').trim();
        if (!isMobileAdminViewport()) {
            lane.classList.remove('is-mobile-active');
            return;
        }
        lane.classList.toggle('is-mobile-active', nextLane !== '' && laneKey === nextLane);
    });

    document.querySelectorAll('[data-mobile-orders-tab]').forEach((tab) => {
        const tabKey = String(tab.getAttribute('data-mobile-orders-tab') || '').trim();
        const isActive = nextLane !== '' && tabKey === nextLane;
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

async function getNextAdminOrderCode() {
    const sequenceRef = firebaseDb.collection(ORDERS_COLLECTION).doc(ORDER_SEQUENCE_DOC_ID);
    const fallback = () => `${ORDER_CODE_PREFIX}-${String(Date.now() % 100000).padStart(5, '0')}`;
    try {
        // Race: transacción vs timeout de 4s para no bloquear el botón en caso de cuota 429
        let code = '';
        const txPromise = firebaseDb.runTransaction(async (tx) => {
            const snap = await tx.get(sequenceRef);
            const current = Number(snap.exists ? snap.data()?.current : ORDER_CODE_START - 1);
            const next = Number.isFinite(current)
                ? Math.max(current + 1, ORDER_CODE_START)
                : ORDER_CODE_START;
            code = `${ORDER_CODE_PREFIX}-${String(next).padStart(4, '0')}`;
            tx.set(sequenceRef, { metaType: 'order_sequence', current: next, updatedAt: firestoreNow() }, { merge: true });
        });
        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 4000));
        await Promise.race([txPromise, timeout]);
        return code || fallback();
    } catch (_e) {
        return fallback();
    }
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
        // Al cargar la app, marcar todos los pedidos pendientes existentes como "vistos"
        // para que no disparen parpadeos ni badges — solo los que lleguen después son nuevos.
        orders.filter((o) => o.status === 'pendiente').forEach((o) => viewedOrderIds.add(o.id));
        updateOrdersAttentionState();
        return;
    }

    // Solo son "nuevos" los pedidos que no existían antes Y que llegaron en los últimos 10 min.
    // El filtro de tiempo evita re-anunciar pedidos viejos si knownOrderIds quedó desincronizado.
    const DIEZ_MIN = 10 * 60 * 1000;
    const newOrders = orders.filter((order) => {
        if (knownOrderIds.has(order.id)) return false;
        const createdMs = order.createdAt?.toMillis?.() || Number(order.createdAt || 0);
        return createdMs > 0 && (Date.now() - createdMs) < DIEZ_MIN;
    });
    knownOrderIds = currentOrderIds;

    // Limpiar IDs vistos que ya no son pendiente (procesados, entregados, etc.)
    const pendienteIds = new Set(orders.filter((o) => o.status === 'pendiente').map((o) => o.id));
    for (const id of viewedOrderIds) { if (!pendienteIds.has(id)) viewedOrderIds.delete(id); }

    updateOrdersAttentionState();

    if (!newOrders.length) {
        return;
    }

    if (isMobileAdminViewport() && !activeMobileOrdersLane) {
        activeMobileOrdersLane = 'domicilios';
    }

    // Desktop: auto-seleccionar el último pedido entrante en el panel de ticket
    if (!isMobileAdminViewport() && newOrders.length) {
        const latest = newOrders.reduce((a, b) =>
            (b.createdAt?.toMillis?.() || 0) > (a.createdAt?.toMillis?.() || 0) ? b : a
        );
        selectedOrderId = latest.id;
    }

    // Vibración — funciona aunque la pantalla esté apagada en Android
    if (newOrders.length && navigator.vibrate) {
        navigator.vibrate([400, 150, 400, 150, 400]);
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
    return ordersState.filter((order) => order.status === 'pendiente' && !viewedOrderIds.has(order.id));
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

function openUnreadTray() {
    if (!unreadTray || !unreadTrayBtn) return;
    unreadTray.hidden = false;
    unreadTrayBtn.setAttribute('aria-expanded', 'true');
    unreadTrayBtn.classList.add('tray-is-open');
}

function closeUnreadTray() {
    if (!unreadTray || !unreadTrayBtn) return;
    unreadTray.hidden = true;
    unreadTrayBtn.setAttribute('aria-expanded', 'false');
    unreadTrayBtn.classList.remove('tray-is-open');
}

function toggleUnreadTray() {
    if (!unreadTray) return;
    if (unreadTray.hidden) {
        openUnreadTray();
    } else {
        closeUnreadTray();
    }
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

    if (unreadTrayBtn) {
        unreadTrayBtn.classList.toggle('has-orders', unreadCount > 0);
        if (unreadCount <= 0 && unreadTray && !unreadTray.hidden) {
            closeUnreadTray();
        }
    }

    updateAdminDocumentTitle(unreadCount);
}

function notifyNewOrder(order) {
    if (!order || typeof Notification === 'undefined' || Notification.permission !== 'granted') {
        return;
    }

    // Solo mostrar notificación del sistema cuando la pestaña está en segundo plano.
    // Si el admin ya está viendo el panel, el banner showNotice es suficiente.
    if (!document.hidden) {
        return;
    }

    const notification = new Notification(`Nuevo pedido en ${brandingState.restaurantName || 'Roal Burger'}`, {
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

    const notification = new Notification(`Nuevo mensaje en ${brandingState.restaurantName || 'Roal Burger'} Admin`, {
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

// Clave pública VAPID — obtenerla en Firebase Console → Project Settings →
// Cloud Messaging → Web Push certificates → Generate key pair
const FCM_VAPID_KEY = 'REEMPLAZAR_CON_TU_CLAVE_VAPID';
const FCM_TOKENS_COLLECTION = 'admin_fcm_tokens';

async function requestAdminNotificationPermission() {
    if (typeof Notification === 'undefined') return;

    let permission = Notification.permission;
    if (permission === 'default') {
        permission = await Notification.requestPermission().catch(() => 'denied');
    }
    if (permission !== 'granted') return;

    // Registrar token FCM para push cuando el celular esté bloqueado
    _registerFCMToken().catch(() => undefined);
}

async function _registerFCMToken() {
    if (FCM_VAPID_KEY === 'REEMPLAZAR_CON_TU_CLAVE_VAPID') return; // pendiente configurar
    if (!firebase?.messaging || !firebaseAuth?.currentUser) return;

    try {
        const messaging = firebase.messaging();
        const token = await messaging.getToken({ vapidKey: FCM_VAPID_KEY });
        if (!token) return;

        const uid = firebaseAuth.currentUser.uid;
        await firebaseDb.collection(FCM_TOKENS_COLLECTION).doc(uid).set({
            token,
            uid,
            updatedAt: firestoreNow()
        }, { merge: true });
    } catch {
        // Falla silenciosamente si FCM no está configurado aún
    }
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

    const sidebar = document.querySelector('.admin-sidebar');
    const hamburgerBtn = document.getElementById('adminNavToggleBtn');

    function closeMobileNav() {
        if (!sidebar || !hamburgerBtn) return;
        sidebar.classList.remove('nav-open');
        hamburgerBtn.setAttribute('aria-expanded', 'false');
        hamburgerBtn.innerHTML = '&#9776;';
        const overlay = document.getElementById('_navMobileOverlay');
        if (overlay) overlay.remove();
    }

    // Toggle del menu hamburguesa en mobile
    if (hamburgerBtn && sidebar) {
        hamburgerBtn.addEventListener('click', () => {
            const isOpen = sidebar.classList.toggle('nav-open');
            hamburgerBtn.setAttribute('aria-expanded', String(isOpen));
            hamburgerBtn.innerHTML = isOpen ? '&#10005;' : '&#9776;';

            // Overlay transparente para cerrar al tocar fuera del nav
            let overlay = document.getElementById('_navMobileOverlay');
            if (isOpen) {
                if (!overlay) {
                    overlay = document.createElement('div');
                    overlay.id = '_navMobileOverlay';
                    overlay.style.cssText = 'position:fixed;inset:0;z-index:198;background:rgba(0,0,0,0.52);-webkit-backdrop-filter:blur(2px);backdrop-filter:blur(2px);';
                    document.body.appendChild(overlay);
                    overlay.addEventListener('click', closeMobileNav);
                }
            } else if (overlay) {
                overlay.remove();
            }
        });
    }

    const buttons = Array.from(nav.querySelectorAll('.admin-accordion-trigger'));
    const panels = Array.from(document.querySelectorAll('.admin-tab-panel'));
    const groupMap = {
        menu: ['menu'],
        informes: ['informes'],
        configuracion: ['configuracion'],
        pedidos: ['pedidos'],
        clientes: ['clientes'],
        gastos: ['gastos'],
        mensajes: ['mensajes'],
        metricas: ['metricas']
    };

    const _sectionLabels = { pedidos:'POS', menu:'Artículos', informes:'Informes', configuracion:'Config', clientes:'Clientes', gastos:'Gastos', mensajes:'Mensajes', metricas:'Métricas' };

    function activateAccordion(target) {
        activeAccordionSection = target;
        const visiblePanels = groupMap[target] || [];
        buttons.forEach((button) => {
            button.classList.toggle('active', button.dataset.accordionTarget === target);
        });
        const topbarLabel = document.getElementById('adminTopbarSection');
        if (topbarLabel) topbarLabel.textContent = _sectionLabels[target] || target;

        panels.forEach((panel) => {
            panel.classList.toggle('active', visiblePanels.includes(panel.dataset.tabPanel));
        });

        // Barra inferior mobile: visible solo en pestaña pedidos
        const mobBar = document.getElementById('mobPosBottomBar');
        if (mobBar) mobBar.style.display = target === 'pedidos' ? '' : 'none';

        // Cerrar el menu hamburguesa en mobile al seleccionar panel
        if (window.innerWidth < 1024) closeMobileNav();

        // Ajustar padding-top de la página según altura real de las barras fijas
        if (window.innerWidth <= 768) _adjustPagePadding();

        if (target === 'mensajes') {
            markMessagesAsRead();
        } else {
            updateMessagesAttentionState();
        }

        if (target === 'gastos') {
            loadCategoriasGastos().then(renderCategoriasGastosPanel);
        }
    }

    // Ajusta padding-top del admin-page según altura real de barras fijas en mobile
    function _adjustPagePadding() {
        if (window.innerWidth > 768) return;
        const page = document.querySelector('.admin-page');
        if (!page) return;
        const topbar = document.querySelector('.admin-sidebar');
        const toolbar = document.querySelector('[data-tab-panel="pedidos"] .section-toolbar');
        const topbarH = topbar ? topbar.getBoundingClientRect().height : 48;
        const toolbarH = (toolbar && getComputedStyle(toolbar).position === 'fixed')
            ? toolbar.getBoundingClientRect().height : 0;
        page.style.paddingTop = (topbarH + toolbarH) + 'px';
    }
    _adjustPagePadding();
    window.addEventListener('resize', _adjustPagePadding);

    buttons.forEach((button) => {
        button.addEventListener('click', () => activateAccordion(button.dataset.accordionTarget));
    });

    activateAccordion('pedidos');
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

        if (section === 'configuracion') {
            if (brandingForm) brandingForm.requestSubmit();
            return;
        }

        if (section === 'horario') {
            if (horarioFormEl) horarioFormEl.requestSubmit();
            return;
        }

        if (section === 'botones' && buttonConfigForm) {
            buttonConfigForm.requestSubmit();
            return;
        }

        if (section === 'metricas') {
            await reloadDataAndRender();
            showNotice('Métricas actualizadas.', 'ok');
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

    if (authError) {
        authError.classList.remove('show');
        authError.textContent = '';
    }

    // Wait for Firebase to resolve the persisted session BEFORE showing any UI.
    // currentUser is null synchronously on page load even with a saved session;
    // onAuthStateChanged is the authoritative first-resolution event.
    const _initialUser = await new Promise((resolve) => {
        const _unsub = firebaseAuth.onAuthStateChanged((u) => { _unsub(); resolve(u); });
    });

    if (_initialUser) {
        document.body.classList.remove('admin-loading');
        document.body.classList.remove('admin-locked');
        document.body.classList.add('admin-unlocked');
        return _initialUser;
    }

    // No persisted session — now reveal the login form.
    document.body.classList.remove('admin-loading');
    document.body.classList.add('admin-locked');
    document.body.classList.remove('admin-unlocked');

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
                case 'auth/invalid-credential':
                case 'auth/wrong-password':
                case 'auth/user-not-found':
                    return 'Credenciales incorrectas.';
                case 'auth/too-many-requests':
                    return 'Acceso bloqueado por el servidor. Intenta mas tarde.';
                case 'auth/network-request-failed':
                    return 'Sin conexion. Revisa tu internet e intenta de nuevo.';
                case 'auth/configuration-not-found':
                case 'auth/operation-not-allowed':
                    return 'El metodo de acceso no esta habilitado para este proyecto.';
                default:
                    return 'No se pudo iniciar sesion. Intenta de nuevo.';
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

            // Bloqueo activo: ignorar submit durante el cooldown
            if (Date.now() < _loginLockedUntil) return;

            const username = String(authUsernameInput?.value || '').trim();
            const password = String(authPasswordInput?.value || '');

            if (!username || !password) {
                showAuthFailure('Ingresa tu correo y contrasena para continuar.');
                return;
            }

            if (authSubmitBtn) { authSubmitBtn.disabled = true; authSubmitBtn.textContent = 'Verificando...'; }

            // reCAPTCHA v3 invisible — verifica score en servidor antes de autenticar
            if (RECAPTCHA_SITE_KEY && window.grecaptcha) {
                try {
                    await new Promise((res) => window.grecaptcha.ready(res));
                    const rcToken  = await window.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: 'admin_login' });
                    const verifyFn = firebase.functions().httpsCallable('verifyRecaptcha');
                    await verifyFn({ token: rcToken });
                } catch (err) {
                    if (authSubmitBtn) { authSubmitBtn.disabled = false; authSubmitBtn.textContent = 'Ingresar'; }
                    showAuthFailure(err?.code === 'functions/failed-precondition'
                        ? 'Verificacion de seguridad fallida. Intenta de nuevo.'
                        : 'No se pudo completar la verificacion. Revisa tu conexion.');
                    return;
                }
            }

            try {
                const persistence = authRememberDeviceInput && authRememberDeviceInput.checked
                    ? firebase.auth.Auth.Persistence.LOCAL
                    : firebase.auth.Auth.Persistence.SESSION;

                await firebaseAuth.setPersistence(persistence);
                await firebaseAuth.signInWithEmailAndPassword(username, password);
                // finishUnlock() se activa desde onAuthStateChanged
            } catch (error) {
                if (authSubmitBtn) { authSubmitBtn.disabled = false; authSubmitBtn.textContent = 'Ingresar'; }

                _loginAttempts++;

                if (_loginAttempts >= AUTH_MAX_ATTEMPTS) {
                    // Activar bloqueo de 30 segundos con countdown visible
                    _loginLockedUntil = Date.now() + AUTH_LOCK_MS;
                    _loginAttempts    = 0;
                    if (_loginLockTimer) clearInterval(_loginLockTimer);

                    const tick = () => {
                        const rem = Math.ceil((_loginLockedUntil - Date.now()) / 1000);
                        if (rem <= 0) {
                            clearInterval(_loginLockTimer);
                            _loginLockTimer = null;
                            if (authSubmitBtn) { authSubmitBtn.disabled = false; authSubmitBtn.textContent = 'Ingresar'; }
                            if (authError) { authError.classList.remove('show'); authError.textContent = ''; }
                            return;
                        }
                        if (authSubmitBtn) {
                            authSubmitBtn.disabled    = true;
                            authSubmitBtn.textContent = `Bloqueado (${rem}s)`;
                        }
                        if (authError) {
                            authError.textContent = `Demasiados intentos fallidos. Espera ${rem} segundo${rem !== 1 ? 's' : ''} para reintentar.`;
                            authError.classList.add('show');
                        }
                    };
                    tick();
                    _loginLockTimer = setInterval(tick, 1000);
                } else {
                    const rem  = AUTH_MAX_ATTEMPTS - _loginAttempts;
                    const nota = rem === 1 ? '1 intento restante.' : `${rem} intentos restantes.`;
                    showAuthFailure(`${mapAuthError(error)} ${nota}`);
                }
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
    const rawSabores = raw.sabores;
    const sabores = Array.isArray(rawSabores)
        ? rawSabores.map((s) => String(s).trim()).filter(Boolean)
        : (typeof rawSabores === 'string' && rawSabores.trim()
            ? rawSabores.split(',').map((s) => s.trim()).filter(Boolean)
            : []);
    return {
        id: raw.id,
        nombre: raw.nombre || raw.name || 'Producto',
        precio: Number(raw.precio ?? raw.price ?? 0),
        categoria: raw.categoria || raw.category || '',
        estado: estado === 'paused' ? 'paused' : 'active',
        es_destacado: raw.es_destacado === true || raw.featured === true,
        image_url: raw.image_url || 'logo.png',
        order: raw.order != null ? Number(raw.order) : undefined,
        descripcion: raw.descripcion || '',
        visible_pos: raw.visible_pos !== false,
        acompanantes: raw.acompanantes || null,
        marca: raw.marca ? String(raw.marca).trim() : '',
        ml: raw.ml ? Number(raw.ml) : null,
        sabores,
        variantes: Array.isArray(raw.variantes) ? raw.variantes : [],
        bebida_incluida: raw.bebida_incluida ? { ...raw.bebida_incluida } : { activo: false, bebida_ref_id: null, bebida_pres_id: null, bebida_nombre: '', cantidad: 1 },
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
        tipo_pos: ['acompanantes'].includes(raw.tipo_pos) ? raw.tipo_pos : null,
        order: raw.order != null ? Number(raw.order) : undefined,
        bebidas_pos: raw.bebidas_pos !== false,
        bebidas_menu: raw.bebidas_menu !== false,
        acompanantes_pos: raw.acompanantes_pos !== false,
        acompanantes_menu: raw.acompanantes_menu !== false,
        combos_pos: raw.combos_pos !== false,
        combos_menu: raw.combos_menu !== false,
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

function extractAddressString(value) {
    if (!value) return '';
    if (typeof value === 'string') return value.trim();
    if (typeof value === 'object') {
        // Campos comunes en objetos de dirección del menú público
        const str = value.address || value.street || value.direccion || value.text
            || value.formatted || value.fullAddress || value.label || value.description || '';
        if (str) return String(str).trim();
        // Último recurso: unir todos los valores string del objeto
        return Object.values(value).filter(v => typeof v === 'string' && v.trim()).join(', ').trim();
    }
    return String(value).trim();
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
    } else if (rawStatus === 'servido') {
        status = 'servido';
    } else if (rawStatus === 'entregado' || rawStatus === 'cancelado') {
        status = 'entregado';
    }

    const rawOrderType = String(raw.orderType || raw.tipo || raw.fulfillmentType || '').trim().toLowerCase();
    const address = extractAddressString(raw.deliveryAddress || raw.customerAddress || '');
    const isMesa = rawOrderType === 'mesa';
    const isTakeaway = !isMesa && ['retiro', 'llevar', 'local', 'recoger', 'pickup', 'takeaway'].some((value) => rawOrderType.includes(value));
    const isDelivery = !isMesa && ['domicilio', 'delivery', 'entrega', 'casa', 'home'].some((value) => rawOrderType.includes(value));
    const orderType = isMesa
        ? 'mesa'
        : (isTakeaway ? 'retiro' : (isDelivery || address ? 'domicilio' : 'retiro'));

    return {
        id: String(raw.id || '').trim(),
        code: String(raw.code || `RB-${String(raw.id || '').slice(-6).toUpperCase()}`).trim(),
        customerName: String(raw.customerName || '').trim(),
        customerPhone: String(raw.customerPhone || '').trim(),
        customerPhoneDigits: String(raw.customerPhoneDigits || '').trim(),
        customerAddress: extractAddressString(raw.customerAddress || ''),
        profileAddress: extractAddressString(raw.profileAddress || ''),
        paymentMethod: String(raw.paymentMethod || '').trim().toLowerCase(),
        paymentSubMethod: String(raw.paymentSubMethod || '').trim().toLowerCase(),
        cashChangeRequired: raw.cashChangeRequired === true,
        cashTenderAmount: Number.isFinite(Number(raw.cashTenderAmount)) ? Number(raw.cashTenderAmount) : null,
        cashChangeAmount: Number.isFinite(Number(raw.cashChangeAmount)) ? Number(raw.cashChangeAmount) : null,
        deliveryAddress: address,
        items,
        itemCount: Number(raw.itemCount || items.length),
        totalItems: Number(raw.totalItems || items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)),
        subtotal,
        deliveryFee,
        total,
        currency: String(raw.currency || 'COP'),
        source: String(raw.source || 'web').trim(),
        isAdminOrder: raw.isAdminOrder === true,
        orderType,
        fulfillmentType: String(raw.fulfillmentType || '').trim().toLowerCase(),
        mesaNumber: raw.mesaNumber ? Number(raw.mesaNumber) : null,
        status,
        summaryMessage: String(raw.summaryMessage || '').trim(),
        courierRequestedAt: raw.courierRequestedAt || raw.courier_requested_at || null,
        readyForPickupAt: raw.readyForPickupAt || raw.ready_for_pickup_at || null,
        deliveredAt: raw.deliveredAt || raw.delivered_at || null,
        createdAt: raw.createdAt || raw.created_at || null,
        updatedAt: raw.updatedAt || raw.updated_at || null,
        paidAt: raw.paidAt || raw.receivedAt || null,
        voided: raw.voided === true,
        voidedAt: raw.voidedAt || null,
        anulado: raw.anulado === true,
        anuladoAt: raw.anuladoAt || null,
        paymentSplit: Array.isArray(raw.paymentSplit) ? raw.paymentSplit : null,
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
        const els = document.querySelectorAll('.order-wait-timer[data-order-id], .koc-courier-time[data-order-id]');
        if (!els.length) return;
        // Map O(1) lookup en vez de .find() O(n) por cada elemento
        const orderMap = new Map(ordersState.map((o) => [o.id, o]));
        els.forEach((el) => {
            const order = orderMap.get(el.dataset.orderId);
            if (!order) return;
            if (el.classList.contains('koc-courier-time')) {
                el.textContent = el.dataset.courierRef === 'created'
                    ? formatElapsedTime(order.createdAt)
                    : formatLiveDuration(order.courierRequestedAt || order.updatedAt || order.createdAt);
            } else {
                el.textContent = formatLiveDuration(order.courierRequestedAt || order.updatedAt || order.createdAt);
            }
        });
    }, 2000);
}

function isOrderSequenceMeta(raw) {
    return String(raw.metaType || '').trim().toLowerCase() === 'order_sequence';
}

async function fetchCategories() {
    const snapshot = await firebaseDb.collection('categorias').get();
    categoriesState = snapshot.docs
        .map((doc) => normalizeCategory({ id: doc.id, ...doc.data() }))
        .sort((a, b) => {
            const oa = a.order ?? 9999;
            const ob = b.order ?? 9999;
            if (oa !== ob) return oa - ob;
            return String(a.name || '').localeCompare(String(b.name || ''), 'es');
        });
}

async function fetchProducts() {
    const snapshot = await firebaseDb.collection('productos').get();
    productsState = snapshot.docs
        .map((doc) => normalizeProduct({ id: doc.id, ...doc.data() }))
        .sort((a, b) => {
            const oa = a.order ?? 9999;
            const ob = b.order ?? 9999;
            if (oa !== ob) return oa - ob;
            return String(a.nombre || '').localeCompare(String(b.nombre || ''), 'es');
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
        window._adminBrandingSnapshot = { ...defaultBranding };
        return;
    }

    brandingState = normalizeBranding(doc.data());
    window._adminBrandingSnapshot = doc.data();
}

async function fetchHorarioConfig() {
    try {
        const doc = await firebaseDb.collection(CONFIG_COLLECTION).doc(HORARIO_DOC_ID).get();
        horarioState = doc.exists ? { ...DEFAULT_HORARIO, ...doc.data() } : { ...DEFAULT_HORARIO };
    } catch (_) {
        horarioState = { ...DEFAULT_HORARIO };
    }
}

function _ordersCutoff() {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d;
}

const _ACTIVE_STATUSES = ['pendiente', 'en_preparacion', 'listo', 'listo_recoger', 'esperando_domiciliario', 'en_camino'];

async function fetchOrders() {
    // Consulta principal: últimos 30 días con createdAt Timestamp correcto
    // Consulta secundaria: pedidos activos sin filtro de fecha (rescata orders con createdAt mal formado)
    const [recentSnap, activeSnap] = await Promise.all([
        firebaseDb.collection(ORDERS_COLLECTION)
            .where('createdAt', '>=', _ordersCutoff())
            .orderBy('createdAt', 'desc')
            .get(),
        firebaseDb.collection(ORDERS_COLLECTION)
            .where('status', 'in', _ACTIVE_STATUSES)
            .get()
    ]);
    const seen = new Set();
    const raw = [];
    for (const snap of [recentSnap, activeSnap]) {
        for (const doc of snap.docs) {
            if (!seen.has(doc.id)) { seen.add(doc.id); raw.push({ id: doc.id, ...doc.data() }); }
        }
    }
    ordersState = raw
        .filter((r) => !isOrderSequenceMeta(r))
        .map((r) => normalizeOrder(r))
        .sort((a, b) => {
            const aTs = a.createdAt && typeof a.createdAt.toMillis === 'function' ? a.createdAt.toMillis() : 0;
            const bTs = b.createdAt && typeof b.createdAt.toMillis === 'function' ? b.createdAt.toMillis() : 0;
            return bTs - aTs;
        });
}

async function fetchSalesSummaries() {
    const snapshot = await firebaseDb.collection(SALES_SUMMARY_COLLECTION)
        .orderBy('closedAt', 'desc')
        .limit(180)
        .get();
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
    const BATCH_SIZE = 500;
    const allDocs = [];
    let lastVisible = null;
    do {
        let q = firebaseDb.collection(CLIENTS_COLLECTION).limit(BATCH_SIZE);
        if (lastVisible) q = q.startAfter(lastVisible);
        const snapshot = await q.get();
        allDocs.push(...snapshot.docs);
        lastVisible = snapshot.docs.length === BATCH_SIZE
            ? snapshot.docs[snapshot.docs.length - 1]
            : null;
    } while (lastVisible);

    clientsState = allDocs
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
                updatedAt: raw.updatedAt || null,
                source: String(raw.source || '').trim(),
                passwordHash: String(raw.passwordHash || '').trim()
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
        {
            id: 'combo', nombre: 'Combo', detalle: 'Papas a la Francesa + Bebida',
            precio: 5000, activo: true, activo_pos: true, activo_menu: true,
            orden: 1, tiene_variantes: false, variantes: []
        },
        {
            id: 'papas', nombre: 'Papas a la Francesa', detalle: '',
            precio: 3000, activo: true, activo_pos: true, activo_menu: true,
            orden: 2, tiene_variantes: false, variantes: []
        },
        {
            id: 'bebida', nombre: 'Bebida', detalle: '',
            precio: 0, activo: true, activo_pos: true, activo_menu: true,
            orden: 3, tiene_variantes: true,
            variantes: [
                {
                    id: 'v-personal', nombre: 'Personal (300 ml)', precio_extra: 2000,
                    sub_variantes: ['Coca-Cola', 'Pepsi', 'Jugo Natural', 'Agua', 'Sin bebida']
                },
                {
                    id: 'v-grande', nombre: 'Grande (400 ml)', precio_extra: 3000,
                    sub_variantes: ['Coca-Cola', 'Pepsi', 'Postobon 400 ml.']
                }
            ]
        }
    ]
};

async function fetchMenuUpgradesConfig() {
    try {
        const doc = await firebaseDb.collection(CONFIG_COLLECTION).doc(UPGRADES_CONFIG_DOC_ID).get();
        const raw = doc.exists
            ? { ...DEFAULT_UPGRADES_CONFIG, ...doc.data() }
            : { ...DEFAULT_UPGRADES_CONFIG };
        // Migrar opciones antiguas al nuevo formato
        raw.opciones = (raw.opciones || []).map((opt) => ({
            tiene_variantes: false,
            variantes: [],
            activo_pos: true,
            activo_menu: true,
            ...opt,
        }));
        menuUpgradesConfig = raw;
    } catch (_e) {
        menuUpgradesConfig = { ...DEFAULT_UPGRADES_CONFIG };
    }
}

async function saveMenuUpgradesConfig(config) {
    await firebaseDb.collection(CONFIG_COLLECTION).doc(UPGRADES_CONFIG_DOC_ID).set(config);
    menuUpgradesConfig = config;
}

let _upgradeSelectedOptId = null;

function renderMenuUpgradesAdmin() {
    const cfg = menuUpgradesConfig || DEFAULT_UPGRADES_CONFIG;
    _renderUpgradesMasterList(cfg);
    _renderUpgradesDetailPanel(_upgradeSelectedOptId);
}

function _renderUpgradeCategoryToggles(cfg) {
    const container = document.getElementById('upgradeCategoryToggles');
    if (!container) return;
    const aplica = (cfg.categorias_aplica || []).map((c) => c.toUpperCase());
    const categories = categoriesState.filter((c) => c.active !== false);
    if (!categories.length) {
        container.innerHTML = '<p style="color:var(--admin-muted);font-size:0.8rem;">No hay categorías disponibles aún.</p>';
        return;
    }
    container.innerHTML = categories.map((cat) => {
        const checked = aplica.includes(cat.name.toUpperCase());
        return `
        <label class="upgrade-cat-toggle-row">
            <input type="checkbox" class="upgrade-cat-toggle-chk"
                   data-cat-name="${escapeHtml(cat.name)}" ${checked ? 'checked' : ''}>
            <span class="upgrade-cat-toggle-name">${escapeHtml(cat.name)}</span>
        </label>`;
    }).join('');
    container.querySelectorAll('.upgrade-cat-toggle-chk').forEach((chk) => {
        chk.addEventListener('change', () => {
            if (!menuUpgradesConfig) menuUpgradesConfig = { ...DEFAULT_UPGRADES_CONFIG };
            menuUpgradesConfig.categorias_aplica = Array.from(
                container.querySelectorAll('.upgrade-cat-toggle-chk:checked')
            ).map((c) => c.dataset.catName);
        });
    });
}

function _renderUpgradesMasterList(cfg) {
    const list = document.getElementById('upgradeOptionsList');
    if (!list) return;
    const opts = (cfg.opciones || []).sort((a, b) => (a.orden || 99) - (b.orden || 99));
    list.innerHTML = opts.map((opt) => {
        const posOn = opt.activo_pos !== false;
        const menuOn = opt.activo_menu !== false;
        return `
        <div class="upgrades-master-item${_upgradeSelectedOptId === opt.id ? ' selected' : ''}"
             data-opt-id="${escapeHtml(opt.id)}" role="button" tabindex="0">
            <input type="checkbox" class="upgrades-master-item-check"
                   ${opt.activo ? 'checked' : ''} data-opt-id="${escapeHtml(opt.id)}" title="Activo">
            <span class="upgrades-master-item-name" title="${escapeHtml(opt.nombre)}">${escapeHtml(opt.nombre)}</span>
            <span class="upgrades-master-badges">
                <span class="upgrades-badge${posOn ? '' : ' off'}" title="POS">P</span>
                <span class="upgrades-badge${menuOn ? '' : ' off'}" title="Menú">M</span>
            </span>
            <span class="upgrades-master-item-arrow">›</span>
            <button type="button" class="upgrades-master-item-del" data-opt-id="${escapeHtml(opt.id)}" title="Eliminar">🗑</button>
        </div>`;
    }).join('');

    list.querySelectorAll('.upgrades-master-item').forEach((item) => {
        item.addEventListener('click', (e) => {
            if (e.target.classList.contains('upgrades-master-item-check') ||
                e.target.classList.contains('upgrades-master-item-del')) return;
            _upgradeSelectedOptId = item.dataset.optId;
            list.querySelectorAll('.upgrades-master-item').forEach((i2) =>
                i2.classList.toggle('selected', i2.dataset.optId === _upgradeSelectedOptId));
            _renderUpgradesDetailPanel(_upgradeSelectedOptId);
        });
        item.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); item.click(); }
        });
    });
    list.querySelectorAll('.upgrades-master-item-check').forEach((chk) => {
        chk.addEventListener('change', (e) => {
            e.stopPropagation();
            const opt = (menuUpgradesConfig?.opciones || []).find((o) => o.id === chk.dataset.optId);
            if (opt) {
                opt.activo = chk.checked;
                const dot = chk.closest('.upgrades-master-item')?.querySelector('.upgrades-master-item-dot');
                if (dot) dot.classList.toggle('off', !chk.checked);
                // sync detail panel toggle if open
                const detailChk = document.getElementById('detailOptActive');
                if (detailChk && _upgradeSelectedOptId === chk.dataset.optId) detailChk.checked = chk.checked;
            }
        });
    });
    list.querySelectorAll('.upgrades-master-item-del').forEach((btn) => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const idx = (menuUpgradesConfig?.opciones || []).findIndex((o) => o.id === btn.dataset.optId);
            if (idx >= 0) {
                menuUpgradesConfig.opciones.splice(idx, 1);
                menuUpgradesConfig.opciones.forEach((o, i) => { o.orden = i + 1; });
                if (_upgradeSelectedOptId === btn.dataset.optId) _upgradeSelectedOptId = null;
                renderMenuUpgradesAdmin();
            }
        });
    });
}

function _buildVariantesHTML(opt) {
    return (opt.variantes || []).map((v, vi) => `
        <div class="upgrades-variant-card" data-v-idx="${vi}">
            <div class="upgrades-variant-head" data-v-idx="${vi}">
                <span class="upgrades-variant-head-name">${escapeHtml(v.nombre || 'Sin nombre')}</span>
                <span class="upgrades-variant-head-price">+${formatMoney(Number(v.precio_extra || 0))}</span>
                <button type="button" class="upgrades-variant-chevron" data-v-idx="${vi}" title="Expandir">▼</button>
                <button type="button" class="upgrades-variant-del" data-v-idx="${vi}" title="Eliminar">🗑</button>
            </div>
            <div class="upgrades-variant-body" data-v-body="${vi}" hidden style="display:none;">
                <div class="upgrades-detail-row">
                    <div class="upgrades-detail-field">
                        <label>Nombre de la variante</label>
                        <input type="text" class="admin-input variant-nombre" value="${escapeHtml(v.nombre || '')}" placeholder="Ej: 300 ml" data-v-idx="${vi}">
                    </div>
                    <div class="upgrades-detail-field shrink">
                        <label>+$ Precio</label>
                        <input type="number" class="admin-input variant-precio" value="${Number(v.precio_extra || 0)}" min="0" step="100" data-v-idx="${vi}">
                    </div>
                </div>
                <div class="upgrades-subs-label">Sub-variantes (sabores / detalles)</div>
                <div class="upgrades-subs-list" data-subs-vi="${vi}">
                    ${(v.sub_variantes || []).map((s, si) => `
                        <span class="upgrades-sub-chip">
                            ${escapeHtml(s)}
                            <button type="button" class="upgrades-sub-remove" data-v-idx="${vi}" data-s-idx="${si}">&#215;</button>
                        </span>`).join('')}
                </div>
                <div class="upgrades-add-sub-row">
                    <input type="text" class="admin-input upgrade-add-sub-input" placeholder="Ej: Coca-Cola" data-v-idx="${vi}">
                    <button type="button" class="ghost-button upgrade-add-sub-btn" data-v-idx="${vi}" style="font-size:0.78rem;padding:5px 10px;white-space:nowrap;">+ Agregar</button>
                </div>
                <div class="upgrades-copy-subs-wrap" data-copy-vi="${vi}">
                    <button type="button" class="upgrades-copy-subs-toggle ghost-button" data-v-idx="${vi}" style="font-size:0.74rem;padding:3px 8px;opacity:0.7;">⬇ Copiar de otros</button>
                    <div class="upgrades-copy-subs-picker" data-v-idx="${vi}" hidden style="display:none;flex-wrap:wrap;gap:5px;margin-top:6px;"></div>
                </div>
            </div>
        </div>`).join('');
}

function _wireVariantInteractions(panel, optIdx) {
    panel.querySelectorAll('.upgrades-variant-head').forEach((head) => {
        head.addEventListener('click', (e) => {
            if (e.target.closest('.upgrades-variant-del') || e.target.closest('.upgrades-variant-chevron')) return;
            const card = head.closest('.upgrades-variant-card');
            _toggleVariantBody(card);
        });
    });
    panel.querySelectorAll('.upgrades-variant-chevron').forEach((btn) => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const card = btn.closest('.upgrades-variant-card');
            _toggleVariantBody(card);
        });
    });
    panel.querySelectorAll('.variant-nombre').forEach((inp) => {
        inp.addEventListener('input', (e) => {
            const vi = Number(e.target.dataset.vIdx);
            menuUpgradesConfig.opciones[optIdx].variantes[vi].nombre = e.target.value;
            const card = e.target.closest('.upgrades-variant-card');
            const el = card?.querySelector('.upgrades-variant-head-name');
            if (el) el.textContent = e.target.value || 'Sin nombre';
        });
    });
    panel.querySelectorAll('.variant-precio').forEach((inp) => {
        inp.addEventListener('input', (e) => {
            const vi = Number(e.target.dataset.vIdx);
            const p = Number(e.target.value || 0);
            menuUpgradesConfig.opciones[optIdx].variantes[vi].precio_extra = p;
            const card = e.target.closest('.upgrades-variant-card');
            const el = card?.querySelector('.upgrades-variant-head-price');
            if (el) el.textContent = '+' + formatMoney(p);
        });
    });
    panel.querySelectorAll('.upgrades-variant-del').forEach((btn) => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const vi = Number(btn.dataset.vIdx);
            menuUpgradesConfig.opciones[optIdx].variantes.splice(vi, 1);
            _renderUpgradesDetailPanel(_upgradeSelectedOptId);
        });
    });
    panel.querySelectorAll('.upgrade-add-sub-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            const vi = Number(btn.dataset.vIdx);
            const inp = panel.querySelector(`.upgrade-add-sub-input[data-v-idx="${vi}"]`);
            if (!inp?.value.trim()) return;
            if (!Array.isArray(menuUpgradesConfig.opciones[optIdx].variantes[vi].sub_variantes))
                menuUpgradesConfig.opciones[optIdx].variantes[vi].sub_variantes = [];
            menuUpgradesConfig.opciones[optIdx].variantes[vi].sub_variantes.push(inp.value.trim());
            inp.value = '';
            _renderUpgradesDetailPanel(_upgradeSelectedOptId);
        });
    });
    panel.querySelectorAll('.upgrade-add-sub-input').forEach((inp) => {
        inp.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                panel.querySelector(`.upgrade-add-sub-btn[data-v-idx="${inp.dataset.vIdx}"]`)?.click();
            }
        });
    });
    panel.querySelectorAll('.upgrades-sub-remove').forEach((btn) => {
        btn.addEventListener('click', () => {
            const vi = Number(btn.dataset.vIdx);
            const si = Number(btn.dataset.sIdx);
            menuUpgradesConfig.opciones[optIdx].variantes[vi].sub_variantes.splice(si, 1);
            _renderUpgradesDetailPanel(_upgradeSelectedOptId);
        });
    });

    // Copiar sub-variantes de otros
    panel.querySelectorAll('.upgrades-copy-subs-toggle').forEach((btn) => {
        btn.addEventListener('click', () => {
            const vi = Number(btn.dataset.vIdx);
            const picker = panel.querySelector(`.upgrades-copy-subs-picker[data-v-idx="${vi}"]`);
            if (!picker) return;
            const isHidden = picker.hidden;
            if (isHidden) {
                // Build available subs from all other variants
                const currentOpt = menuUpgradesConfig.opciones[optIdx];
                const existing = new Set(currentOpt.variantes[vi].sub_variantes || []);
                const available = new Set();
                (menuUpgradesConfig.opciones || []).forEach((o) => {
                    (o.variantes || []).forEach((v, vi2) => {
                        if (o.id === currentOpt.id && vi2 === vi) return;
                        (v.sub_variantes || []).forEach((s) => { if (!existing.has(s)) available.add(s); });
                    });
                });
                if (!available.size) {
                    picker.innerHTML = '<span style="font-size:0.75rem;color:var(--admin-muted);">Sin sub-variantes disponibles en otros productos.</span>';
                } else {
                    picker.innerHTML = [...available].map((s) =>
                        `<button type="button" class="upgrades-sub-chip upgrades-copy-sub-pick" data-sub="${escapeHtml(s)}" data-v-idx="${vi}" style="cursor:pointer;">${escapeHtml(s)} +</button>`
                    ).join('');
                    picker.querySelectorAll('.upgrades-copy-sub-pick').forEach((chip) => {
                        chip.addEventListener('click', () => {
                            const vi2 = Number(chip.dataset.vIdx);
                            if (!Array.isArray(menuUpgradesConfig.opciones[optIdx].variantes[vi2].sub_variantes))
                                menuUpgradesConfig.opciones[optIdx].variantes[vi2].sub_variantes = [];
                            menuUpgradesConfig.opciones[optIdx].variantes[vi2].sub_variantes.push(chip.dataset.sub);
                            _renderUpgradesDetailPanel(_upgradeSelectedOptId);
                        });
                    });
                }
                picker.hidden = false;
                picker.style.display = 'flex';
            } else {
                picker.hidden = true;
                picker.style.display = 'none';
            }
        });
    });
}

function _toggleVariantBody(card) {
    if (!card) return;
    const body = card.querySelector('[data-v-body]');
    const chevron = card.querySelector('.upgrades-variant-chevron');
    if (!body) return;
    const open = body.hidden;
    body.hidden = !open;
    body.style.display = open ? 'flex' : 'none';
    if (chevron) chevron.classList.toggle('open', open);
}

function _syncMasterBadge(optId) {
    const opt = (menuUpgradesConfig?.opciones || []).find((o) => o.id === optId);
    if (!opt) return;
    const item = document.querySelector(`.upgrades-master-item[data-opt-id="${optId}"]`);
    if (!item) return;
    const badges = item.querySelectorAll('.upgrades-badge');
    if (badges[0]) badges[0].classList.toggle('off', opt.activo_pos === false);
    if (badges[1]) badges[1].classList.toggle('off', opt.activo_menu === false);
}

function _renderUpgradesDetailPanel(optId) {
    const panel = document.getElementById('upgradesDetailPanel');
    if (!panel) return;
    if (!optId) {
        panel.innerHTML = `<div class="upgrades-detail-empty">← Selecciona un acompañamiento para configurar</div>`;
        return;
    }
    const cfg = menuUpgradesConfig || DEFAULT_UPGRADES_CONFIG;
    const opt = (cfg.opciones || []).find((o) => o.id === optId);
    if (!opt) { panel.innerHTML = `<div class="upgrades-detail-empty">Acompañamiento no encontrado</div>`; return; }
    const optIdx = (cfg.opciones || []).findIndex((o) => o.id === optId);

    panel.innerHTML = `
        <div class="upgrades-detail-topbar">
            <span class="upgrades-detail-title">${escapeHtml(opt.nombre)}</span>
            <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
                <label class="upgrades-toggle-label">
                    <input type="checkbox" id="detailOptActivoPos" ${opt.activo_pos !== false ? 'checked' : ''}> POS
                </label>
                <label class="upgrades-toggle-label">
                    <input type="checkbox" id="detailOptActivoMenu" ${opt.activo_menu !== false ? 'checked' : ''}> Menú público
                </label>
            </div>
        </div>
        <div class="upgrades-detail-fields">
            <div class="upgrades-detail-row">
                <div class="upgrades-detail-field">
                    <label>Nombre</label>
                    <input type="text" class="admin-input" id="detailOptNombre" value="${escapeHtml(opt.nombre)}" placeholder="Ej: Combo">
                </div>
                <div class="upgrades-detail-field shrink">
                    <label>Precio base +$</label>
                    <input type="number" class="admin-input" id="detailOptPrecio" value="${Number(opt.precio || 0)}" min="0" step="100">
                </div>
            </div>
            <div class="upgrades-detail-field">
                <label>Descripción (opcional)</label>
                <input type="text" class="admin-input" id="detailOptDetalle" value="${escapeHtml(opt.detalle || '')}" placeholder="Ej: Papas + Bebida">
            </div>
        </div>
        <div class="upgrades-variants-section">
            <div class="upgrades-variants-header">
                <span class="upgrades-variants-title">Variantes</span>
                <label class="upgrades-toggle-label" style="font-size:0.75rem;">
                    <input type="checkbox" id="detailOptTieneVariantes" ${opt.tiene_variantes ? 'checked' : ''}> Activar variantes
                </label>
                <button type="button" class="ghost-button" id="addVariantBtn" style="font-size:0.76rem;padding:4px 9px;">+ Agregar</button>
            </div>
            <div id="upgradesVariantsList">
                ${opt.tiene_variantes
                    ? ((opt.variantes || []).length > 0
                        ? _buildVariantesHTML(opt)
                        : '<p style="font-size:0.81rem;color:var(--admin-muted);margin:0;">Sin variantes. Usa "+ Agregar".</p>')
                    : ''}
            </div>
        </div>`;

    // Wire fields
    panel.querySelector('#detailOptActivoPos')?.addEventListener('change', (e) => {
        if (optIdx >= 0) {
            menuUpgradesConfig.opciones[optIdx].activo_pos = e.target.checked;
            _syncMasterBadge(optId);
        }
    });
    panel.querySelector('#detailOptActivoMenu')?.addEventListener('change', (e) => {
        if (optIdx >= 0) {
            menuUpgradesConfig.opciones[optIdx].activo_menu = e.target.checked;
            _syncMasterBadge(optId);
        }
    });
    panel.querySelector('#detailOptNombre')?.addEventListener('input', (e) => {
        if (optIdx >= 0) {
            menuUpgradesConfig.opciones[optIdx].nombre = e.target.value;
            const nameEl = document.querySelector(`.upgrades-master-item[data-opt-id="${optId}"] .upgrades-master-item-name`);
            if (nameEl) nameEl.textContent = e.target.value;
            const titleEl = panel.querySelector('.upgrades-detail-title');
            if (titleEl) titleEl.textContent = e.target.value;
        }
    });
    panel.querySelector('#detailOptPrecio')?.addEventListener('input', (e) => {
        if (optIdx >= 0) menuUpgradesConfig.opciones[optIdx].precio = Number(e.target.value || 0);
    });
    panel.querySelector('#detailOptDetalle')?.addEventListener('input', (e) => {
        if (optIdx >= 0) menuUpgradesConfig.opciones[optIdx].detalle = e.target.value;
    });
    panel.querySelector('#detailOptTieneVariantes')?.addEventListener('change', (e) => {
        if (optIdx >= 0) {
            menuUpgradesConfig.opciones[optIdx].tiene_variantes = e.target.checked;
            _renderUpgradesDetailPanel(optId);
        }
    });
    panel.querySelector('#addVariantBtn')?.addEventListener('click', () => {
        if (optIdx < 0) return;
        if (!Array.isArray(menuUpgradesConfig.opciones[optIdx].variantes))
            menuUpgradesConfig.opciones[optIdx].variantes = [];
        menuUpgradesConfig.opciones[optIdx].variantes.push({
            id: `v-${Date.now()}`, nombre: 'Nueva variante',
            precio_extra: 0, sub_variantes: []
        });
        menuUpgradesConfig.opciones[optIdx].tiene_variantes = true;
        _renderUpgradesDetailPanel(optId);
    });
    if (opt.tiene_variantes) _wireVariantInteractions(panel, optIdx);
}



function renderPosCategoriesPanel() {
    const select = document.getElementById('posCatSelect');
    if (!select) return;

    const catalog = productsState.length ? productsState : PUBLIC_PRODUCT_CATALOG;

    // Usar categoriesState como fuente de verdad: orden correcto y respeto al campo active
    const categories = categoriesState.length
        ? categoriesState.filter((c) => c.active !== false).map((c) => c.name.trim())
        : [...new Set(catalog.map((p) => String(p.categoria || 'Sin categoria').trim()))];

    if (select.dataset.listenerAttached !== 'true') {
        select.addEventListener('change', () => {
            posSelectedCategory = select.value;
            renderPosProductsPanel();
        });
        select.dataset.listenerAttached = 'true';
    }

    const promoOption       = `<option value="__POS_PROMOCIONES__">🏷️ PROMOCIONES</option>`;
    const cobroExtraOption  = `<option value="__POS_COBRO_EXTRA__">➕ COBRO EXTRA</option>`;
    const descuentoOption   = `<option value="__POS_DESCUENTO__">🏷 DESCUENTO</option>`;
    const bebidasCatOption  = catalogoVisibilidad.bebidas_pos && bebidasState.some((b) => b.estado === 'active' && b.mostrar_categoria)
        ? `<option value="__POS_BEBIDAS__">🥤 Bebidas (${bebidasState.filter((b) => b.estado === 'active' && b.mostrar_categoria).length})</option>`
        : '';
    const acompCatOption    = catalogoVisibilidad.acompanantes_pos && acompanantesState.some((a) => a.estado === 'active' && a.activo_pos)
        ? `<option value="__POS_ACOMPANANTES__">🥗 Acompañantes (${acompanantesState.filter((a) => a.estado === 'active' && a.activo_pos).length})</option>`
        : '';
    select.innerHTML = promoOption + cobroExtraOption + descuentoOption + bebidasCatOption + acompCatOption + categories.map((cat) => {
        const count = catalog.filter(
            (p) => String(p.categoria || '').trim() === cat && p.visible_pos !== false
        ).length;
        return `<option value="${escapeHtml(cat)}">${escapeHtml(cat)} (${count})</option>`;
    }).join('');

    const specialKeys = ['__POS_PROMOCIONES__', '__POS_COBRO_EXTRA__', '__POS_DESCUENTO__', '__POS_BEBIDAS__', '__POS_ACOMPANANTES__'];
    if (posSelectedCategory && (specialKeys.includes(posSelectedCategory) || categories.includes(posSelectedCategory))) {
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

    grid.style.display = ''; // reset override aplicado por renderPosPromocionesPanel

    if (!posSelectedCategory) {
        grid.innerHTML = '<p style="color:rgba(255,255,255,0.4);text-align:center;padding:24px;grid-column:1/-1;">Selecciona una categoría</p>';
        return;
    }

    // Panel especial de Promociones
    if (posSelectedCategory === '__POS_PROMOCIONES__') {
        renderPosPromocionesPanel(grid);
        return;
    }

    // Panel especial de Cobro Extra
    if (posSelectedCategory === '__POS_COBRO_EXTRA__') {
        renderPosCobroExtraPanel(grid);
        return;
    }

    // Panel especial de Descuento por monto
    if (posSelectedCategory === '__POS_DESCUENTO__') {
        renderPosDescuentoPanel(grid);
        return;
    }

    // Panel especial de Bebidas (colección propia)
    if (posSelectedCategory === '__POS_BEBIDAS__') {
        renderPosBebidasPanel(grid);
        return;
    }

    // Panel especial de Acompañantes (colección propia)
    if (posSelectedCategory === '__POS_ACOMPANANTES__') {
        renderPosAcompanantesNewPanel(grid);
        return;
    }

    // Verificar si la categoría tiene tipo_pos = 'acompanantes'
    const categoryMeta = categoriesState.find((c) => c.name.trim() === posSelectedCategory);
    if (categoryMeta && categoryMeta.tipo_pos === 'acompanantes') {
        renderPosAcompanantesPanel(grid);
        return;
    }

    const catalog = productsState.length ? productsState : PUBLIC_PRODUCT_CATALOG;
    const categoryProducts = catalog
        .filter((p) => String(p.categoria || '').trim() === posSelectedCategory && p.visible_pos !== false)
        .sort((a, b) => {
            const oa = a.order ?? 9999;
            const ob = b.order ?? 9999;
            if (oa !== ob) return oa - ob;
            return String(a.nombre || '').localeCompare(String(b.nombre || ''), 'es');
        });

    grid.innerHTML = '';

    if (!categoryProducts.length) {
        grid.innerHTML = '<p style="color:rgba(255,255,255,0.4);text-align:center;padding:24px;grid-column:1/-1;">Sin productos disponibles</p>';
        return;
    }

    categoryProducts.forEach((product) => {
        const card = document.createElement('div');
        card.className = 'pos-product-card';

        const btn = document.createElement('button');
        btn.type = 'button';
        const imgUrl = String(product.image_url || '').trim();

        if (imgUrl) {
            btn.className = 'pos-product-btn has-image';
            btn.innerHTML = `<img class="pos-product-btn-img" src="${escapeHtml(imgUrl)}" alt="" loading="lazy" onerror="this.style.display='none'">`;
            const label = document.createElement('div');
            label.className = 'pos-product-label';
            label.innerHTML = `<span class="pos-product-btn-name">${escapeHtml(product.nombre)}</span><span class="pos-product-btn-price">${formatMoney(Number(product.precio || 0))}</span>`;
            card.appendChild(btn);
            card.appendChild(label);
        } else {
            btn.className = 'pos-product-btn';
            btn.innerHTML = `<span class="pos-product-btn-name">${escapeHtml(product.nombre)}</span><span class="pos-product-btn-price">${formatMoney(Number(product.precio || 0))}</span>`;
            card.appendChild(btn);
        }

        card.addEventListener('click', () => {
            handlePosProductAdd(String(product.id || ''), String(product.nombre || ''), Number(product.precio || 0));
        });
        grid.appendChild(card);
    });
}

function renderPosAcompanantesNewPanel(grid) {
    grid.innerHTML = '';
    const activos = acompanantesState.filter((a) => a.estado === 'active' && a.activo_pos);
    if (!activos.length) {
        grid.innerHTML = '<p style="color:rgba(255,255,255,0.4);text-align:center;padding:24px;grid-column:1/-1;">Sin acompañantes disponibles</p>';
        return;
    }
    activos.forEach((acomp) => {
        const card = document.createElement('div');
        card.className = 'pos-product-card';

        const btn = document.createElement('button');
        btn.type = 'button';
        if (acomp.imagen_url) {
            btn.className = 'pos-product-btn has-image';
            btn.innerHTML = `<img class="pos-product-btn-img" src="${escapeHtml(acomp.imagen_url)}" alt="" loading="lazy" onerror="this.style.display='none'">`;
            const label = document.createElement('div');
            label.className = 'pos-product-label';
            label.innerHTML = `<span class="pos-product-btn-name">${escapeHtml(acomp.nombre)}</span><span class="pos-product-btn-price">${formatMoney(acomp.precio)}</span>`;
            card.appendChild(btn);
            card.appendChild(label);
        } else {
            btn.className = 'pos-product-btn';
            btn.innerHTML = `<span class="pos-product-btn-name">${escapeHtml(acomp.nombre)}</span><span class="pos-product-btn-price">${formatMoney(acomp.precio)}</span>`;
            card.appendChild(btn);
        }

        card.addEventListener('click', () => {
            const itemId = `acomp::${acomp.id}`;
            const itemName = acomp.cantidad ? `${acomp.nombre} (${acomp.cantidad})` : acomp.nombre;
            addProductToPosOrder(itemId, itemName, acomp.precio);
        });
        grid.appendChild(card);
    });
}

function renderPosBebidasPanel(grid) {
    grid.innerHTML = '';
    const activas = bebidasState.filter((b) => b.estado === 'active' && b.mostrar_categoria);
    if (!activas.length) {
        grid.innerHTML = '<p style="color:rgba(255,255,255,0.4);text-align:center;padding:24px;grid-column:1/-1;">Sin bebidas disponibles</p>';
        return;
    }
    activas.forEach((bev) => {
        const minPrecio = bev.presentaciones.length
            ? Math.min(...bev.presentaciones.map((p) => p.precio))
            : 0;
        const card = document.createElement('div');
        card.className = 'pos-product-card';

        const btn = document.createElement('button');
        btn.type = 'button';
        if (bev.image_url) {
            btn.className = 'pos-product-btn has-image';
            btn.innerHTML = `<img class="pos-product-btn-img" src="${escapeHtml(bev.image_url)}" alt="" loading="lazy" onerror="this.style.display='none'">`;
            const label = document.createElement('div');
            label.className = 'pos-product-label';
            label.innerHTML = `<span class="pos-product-btn-name">${escapeHtml(bev.marca)}</span><span class="pos-product-btn-price">${bev.presentaciones.length > 1 ? 'Desde ' : ''}${formatMoney(minPrecio)}</span>`;
            card.appendChild(btn);
            card.appendChild(label);
        } else {
            btn.className = 'pos-product-btn';
            btn.innerHTML = `<span class="pos-product-btn-name">${escapeHtml(bev.marca)}</span><span class="pos-product-btn-price">${bev.presentaciones.length > 1 ? 'Desde ' : ''}${formatMoney(minPrecio)}</span>`;
            card.appendChild(btn);
        }

        card.addEventListener('click', () => openPosBebidaPickerModal(bev));
        grid.appendChild(card);
    });
}

function openPosBebidaPickerModal(bev) {
    const prev = document.getElementById('pos-bebida-picker-modal');
    if (prev) prev.remove();

    const overlay = document.createElement('div');
    overlay.className = 'combo-modal-overlay';
    overlay.style.zIndex = '11000';

    const card = document.createElement('div');
    card.className = 'combo-modal-card';
    card.style.maxWidth = '380px';

    const header = document.createElement('div');
    header.className = 'combo-modal-header';
    const htitle = document.createElement('div');
    htitle.innerHTML = `<h4>🥤 ${escapeHtml(bev.marca)}</h4>`;
    const closeX = document.createElement('button');
    closeX.type = 'button';
    closeX.className = 'combo-modal-close-x';
    closeX.textContent = '×';
    closeX.addEventListener('click', () => overlay.remove());
    header.appendChild(htitle);
    header.appendChild(closeX);

    const body = document.createElement('div');
    body.style.cssText = 'padding:12px 16px;display:flex;flex-direction:column;gap:14px;';

    let selectedPres = bev.presentaciones.length === 1 ? bev.presentaciones[0] : null;
    let selectedSabor = null;

    // ── Presentaciones ──
    const presLabel = document.createElement('div');
    presLabel.className = 'combo-modal-section-label';
    presLabel.textContent = 'Presentación';
    body.appendChild(presLabel);

    const presChips = document.createElement('div');
    presChips.className = 'combo-sabor-chips';
    presChips.style.justifyContent = 'flex-start';

    // ── Sabores ──
    const saborSection = document.createElement('div');
    saborSection.style.display = 'none';
    const saborLabel = document.createElement('div');
    saborLabel.className = 'combo-modal-section-label';
    saborLabel.textContent = 'Sabor';
    const saborChips = document.createElement('div');
    saborChips.className = 'combo-sabor-chips';
    saborChips.style.justifyContent = 'flex-start';
    saborSection.appendChild(saborLabel);
    saborSection.appendChild(saborChips);

    const renderSaborChips = () => {
        saborChips.innerHTML = '';
        if (!selectedPres || !selectedPres.sabores.length) { saborSection.style.display = 'none'; return; }
        saborSection.style.display = '';
        selectedPres.sabores.forEach((sabor) => {
            const chip = document.createElement('button');
            chip.type = 'button';
            chip.className = 'combo-sabor-chip' + (selectedSabor === sabor ? ' selected' : '');
            chip.textContent = sabor;
            chip.addEventListener('click', () => { selectedSabor = sabor; renderSaborChips(); });
            saborChips.appendChild(chip);
        });
    };

    const renderPresChips = () => {
        presChips.innerHTML = '';
        bev.presentaciones.forEach((pres) => {
            const chip = document.createElement('button');
            chip.type = 'button';
            chip.className = 'combo-sabor-chip' + (selectedPres?.id === pres.id ? ' selected' : '');
            chip.textContent = `${pres.nombre} — ${formatMoney(pres.precio)}`;
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
    renderSaborChips();

    body.appendChild(presChips);
    body.appendChild(saborSection);

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
    confirmBtn.textContent = 'Agregar';
    confirmBtn.addEventListener('click', () => {
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
        let itemName = bev.marca + ' ' + selectedPres.nombre;
        if (selectedSabor) itemName += ` (${selectedSabor})`;
        const itemId = `bebida::${bev.id}::${selectedPres.id}${selectedSabor ? '::' + selectedSabor : ''}`;
        addProductToPosOrder(itemId, itemName, selectedPres.precio);
    });

    footer.appendChild(cancelBtn);
    footer.appendChild(confirmBtn);
    card.appendChild(header);
    card.appendChild(body);
    card.appendChild(footer);
    overlay.appendChild(card);
    _bindOverlayClose(overlay, () => overlay.remove());
    document.body.appendChild(overlay);
    overlay.id = 'pos-bebida-picker-modal';
}

function renderPosAcompanantesPanel(grid) {
    const cfg = menuUpgradesConfig || DEFAULT_UPGRADES_CONFIG;

    // Respetar los checkboxes por categoría: usar categorias_ids con búsqueda case-insensitive
    const catIdsMap = cfg.categorias_ids || {};
    const catNorm = (posSelectedCategory || '').trim().toUpperCase();
    const catIdsKey = Object.keys(catIdsMap).find((k) => k.trim().toUpperCase() === catNorm);
    const catIds = catIdsKey ? (catIdsMap[catIdsKey] || []) : [];

    // Verificar si esta categoría está en categorias_aplica (tiene config de acompañantes activa)
    const aplica = (cfg.categorias_aplica || []).map((c) => c.trim().toUpperCase());
    const catEnAplica = aplica.includes(catNorm);

    let opciones = (cfg.opciones || []).filter((o) => o.activo && o.activo_pos !== false);

    if (catEnAplica) {
        // Categoría configurada: si tiene IDs específicos filtrar a esos, si no mostrar todos
        if (catIds.length > 0) {
            opciones = opciones.filter((o) => catIds.includes(o.id));
        }
        // catIds vacío + catEnAplica = "todos seleccionados" (igual que la UI de checkboxes)
    }
    // catEnAplica = false → categoría sin config de acompañantes: mostrar todos activos

    opciones = opciones.sort((a, b) => (a.orden || 99) - (b.orden || 99));

    grid.innerHTML = '';

    if (!opciones.length) {
        grid.innerHTML = '<p style="color:rgba(255,255,255,0.4);text-align:center;padding:24px;grid-column:1/-1;">Sin acompañantes activos configurados</p>';
        return;
    }

    opciones.forEach((opt) => {
        const card = document.createElement('div');
        card.className = 'pos-product-card';

        const btn = document.createElement('button');
        btn.type = 'button';
        const nombreCompleto = opt.detalle ? `${opt.nombre} (${opt.detalle})` : opt.nombre;

        if (opt.tiene_variantes && Array.isArray(opt.variantes) && opt.variantes.length) {
            // Con variantes: abrir modal de selección
            btn.className = 'pos-product-btn';
            btn.innerHTML = `<span class="pos-product-btn-name">${escapeHtml(opt.nombre)}</span><span class="pos-product-btn-price">+ variantes</span>`;
            card.appendChild(btn);
            card.addEventListener('click', () => openPosUpgradeSheet(
                `acomp-${opt.id}`, opt.nombre, opt.precio,
                [opt]
            ));
        } else {
            btn.className = 'pos-product-btn';
            btn.innerHTML = `<span class="pos-product-btn-name">${escapeHtml(nombreCompleto)}</span><span class="pos-product-btn-price">${opt.precio > 0 ? formatMoney(opt.precio) : 'Incluido'}</span>`;
            card.appendChild(btn);
            card.addEventListener('click', () => addProductToPosOrder(`acomp-${opt.id}`, nombreCompleto, opt.precio));
        }

        grid.appendChild(card);
    });
}

function renderPosCobroExtraPanel(grid) {
    grid.style.display = 'block';
    grid.innerHTML = '';

    const PRESETS = [1000, 2000, 3000, 5000, 8000, 10000];

    const wrap = document.createElement('div');
    wrap.className = 'pos-cobro-extra-panel';
    wrap.innerHTML = `
        <div class="pos-cobro-extra-header">
            <span class="pos-cobro-extra-icon">➕</span>
            <span>Cobro extra al ticket</span>
        </div>
        <div class="pos-cobro-extra-fields">
            <div class="pos-cobro-extra-field">
                <label for="cobroExtraConcepto">Concepto</label>
                <input id="cobroExtraConcepto" type="text" placeholder="Ej: Domicilio, Empaque, Servicio..." maxlength="60" autocomplete="off">
            </div>
            <div class="pos-cobro-extra-field">
                <label for="cobroExtraMonto">Monto $</label>
                <input id="cobroExtraMonto" type="number" placeholder="0" min="0" step="100" inputmode="numeric">
            </div>
        </div>
        <div class="pos-cobro-extra-presets">
            ${PRESETS.map((v) => `<button type="button" class="pos-cobro-preset-btn" data-value="${v}">${formatMoney(v)}</button>`).join('')}
        </div>
        <button type="button" id="cobroExtraAddBtn" class="pos-cobro-extra-add-btn">➕ Agregar al ticket</button>
    `;

    // Presets rellenan el monto
    wrap.querySelectorAll('.pos-cobro-preset-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            const input = wrap.querySelector('#cobroExtraMonto');
            if (input) { input.value = btn.dataset.value; input.focus(); }
        });
    });

    // Agregar al ticket
    wrap.querySelector('#cobroExtraAddBtn').addEventListener('click', () => {
        const conceptoInput = wrap.querySelector('#cobroExtraConcepto');
        const montoInput    = wrap.querySelector('#cobroExtraMonto');
        const concepto = String(conceptoInput?.value || '').trim() || 'Cobro extra';
        const monto    = Number(montoInput?.value || 0);

        if (!monto || monto <= 0) {
            montoInput?.focus();
            showNotice('Ingresa un monto mayor a $0.', 'error');
            return;
        }

        addProductToPosOrder(`cobro-extra::${concepto}`, concepto, monto, '', null);
        showNotice(`${concepto} — ${formatMoney(monto)} agregado al ticket.`, 'ok');

        // Limpiar campos tras agregar
        if (conceptoInput) conceptoInput.value = '';
        if (montoInput)    montoInput.value    = '';
        conceptoInput?.focus();
    });

    // Enter en monto dispara el botón de agregar
    wrap.querySelector('#cobroExtraMonto').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') wrap.querySelector('#cobroExtraAddBtn')?.click();
    });

    grid.appendChild(wrap);
}

function renderPosDescuentoPanel(grid) {
    grid.style.display = 'block';
    grid.innerHTML = '';

    const PRESETS = [1000, 2000, 3000, 5000, 8000, 10000];

    const wrap = document.createElement('div');
    wrap.className = 'pos-cobro-extra-panel';
    wrap.innerHTML = `
        <div class="pos-cobro-extra-header" style="color:#f87171;">
            <span class="pos-cobro-extra-icon">🏷</span>
            <span>Descuento al ticket</span>
        </div>
        <div class="pos-cobro-extra-fields">
            <div class="pos-cobro-extra-field">
                <label for="descuentoConcepto">Concepto</label>
                <input id="descuentoConcepto" type="text" placeholder="Ej: Descuento cliente, Cortesía..." maxlength="60" autocomplete="off">
            </div>
            <div class="pos-cobro-extra-field">
                <label for="descuentoMonto">Monto a descontar $</label>
                <input id="descuentoMonto" type="number" placeholder="0" min="0" step="100" inputmode="numeric">
            </div>
        </div>
        <div class="pos-cobro-extra-presets">
            ${PRESETS.map((v) => `<button type="button" class="pos-cobro-preset-btn pos-desc-preset-btn" data-value="${v}">${formatMoney(v)}</button>`).join('')}
        </div>
        <button type="button" id="descuentoAddBtn" class="pos-cobro-extra-add-btn" style="background:linear-gradient(135deg,#c0392b,#e74c3c);">🏷 Aplicar descuento</button>
    `;

    wrap.querySelectorAll('.pos-cobro-preset-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            const input = wrap.querySelector('#descuentoMonto');
            if (input) { input.value = btn.dataset.value; input.focus(); }
        });
    });

    wrap.querySelector('#descuentoAddBtn').addEventListener('click', () => {
        const conceptoInput = wrap.querySelector('#descuentoConcepto');
        const montoInput    = wrap.querySelector('#descuentoMonto');
        const concepto = String(conceptoInput?.value || '').trim() || 'Descuento';
        const monto    = Number(montoInput?.value || 0);

        if (!monto || monto <= 0) {
            montoInput?.focus();
            showNotice('Ingresa un monto mayor a $0.', 'error');
            return;
        }

        // Precio negativo = descuento
        addProductToPosOrder(`descuento::${concepto}`, concepto, -monto, '', null);
        showNotice(`${concepto} — -${formatMoney(monto)} aplicado al ticket.`, 'ok');

        if (conceptoInput) conceptoInput.value = '';
        if (montoInput)    montoInput.value    = '';
        conceptoInput?.focus();
    });

    wrap.querySelector('#descuentoMonto').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') wrap.querySelector('#descuentoAddBtn')?.click();
    });

    grid.appendChild(wrap);
}

function renderPosPromocionesPanel(grid) {
    grid.style.display = 'block';
    grid.innerHTML = '';

    const wrap = document.createElement('div');
    wrap.className = 'pos-promo-panel';

    // ── Helpers ──────────────────────────────────────────────────────────────
    function buildSection(title, btns) {
        if (!btns.length) return null;
        const section = document.createElement('div');
        section.className = 'pos-promo-section';
        const h4 = document.createElement('h4');
        h4.className = 'pos-promo-section-title';
        h4.textContent = title;
        section.appendChild(h4);
        const items = document.createElement('div');
        items.className = 'pos-promo-section-items';
        btns.forEach((b) => items.appendChild(b));
        section.appendChild(items);
        return section;
    }

    // Estructura unificada para todos los botones:
    // [badge] [nombre] [precio]     ← fila principal (pos-promo-btn-row)
    // [detalle opcional]            ← pos-promo-btn-detail
    function makeBtn({ badgeText, badgeColor, nombre, precioFinal, precioOrig = null, detalle = null, onClick }) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'pos-promo-btn';

        const origHTML = precioOrig && precioOrig > precioFinal
            ? `<s class="pos-promo-orig">${formatMoney(precioOrig)}</s>`
            : '';

        btn.innerHTML = `
            <span class="pos-promo-badge" style="background:${badgeColor};">${escapeHtml(badgeText)}</span>
            <span class="pos-promo-btn-name">${escapeHtml(nombre)}</span>
            <span class="pos-promo-btn-price">${origHTML}${formatMoney(precioFinal)}</span>
            ${detalle ? `<span class="pos-promo-btn-detail">${detalle}</span>` : ''}`;

        btn.addEventListener('click', onClick);
        return btn;
    }

    // ── Hash diario — algoritmo IDÉNTICO al menú público (_hashProductDay) ──
    function hashDay(key, day) {
        let h = ((day * 2654435761) >>> 0);
        for (let i = 0; i < key.length; i++) {
            h = (Math.imul(h ^ key.charCodeAt(i), 2246822519) >>> 0);
            h = (Math.imul(h ^ (h >>> 13), 3266489917) >>> 0);
        }
        return h >>> 0;
    }

    // Categorías excluidas del recomendado — igual que menú público
    const _REC_EXCL = ['bebidas y adicionales', 'adicionales', 'bebidas', 'nuestras salsas', 'entradas'];
    function _recCatExcluida(cat) {
        const k = String(cat || '').toLowerCase().trim();
        if (k.includes('combo')) return true;
        return _REC_EXCL.some((p) => k.includes(p));
    }

    let hasAny = false;

    // ── 1. RECOMENDADO DEL DÍA ───────────────────────────────────────────────
    let _recProd = null;
    if (recomendadoDiaState && recomendadoDiaState.activo && recomendadoDiaState.producto_id) {
        _recProd = productsState.find((p) => p.id === recomendadoDiaState.producto_id) || null;
    } else {
        // Pool incluye pausados (igual que menú) para que el hash sea estable sin importar estado
        const rawPool = productsState.filter((p) =>
            String(p.image_url || '').trim() && !_recCatExcluida(p.categoria)
        );
        // Deduplicar por nombre+categoría (igual que menú)
        const _recSeen = new Set();
        const pool = [];
        rawPool.forEach((p) => {
            const sig = `${String(p.categoria || '').toLowerCase().trim()}::${String(p.nombre || '').toLowerCase().trim()}`;
            if (sig && !_recSeen.has(sig)) { _recSeen.add(sig); pool.push(p); }
        });

        if (pool.length) {
            // daySerial en hora Bogotá (idéntico al menú público)
            const now = new Date();
            const _bp = new Intl.DateTimeFormat('en-CA', {
                timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit'
            }).formatToParts(now);
            const _by = Number(_bp.find((x) => x.type === 'year')?.value  || 0);
            const _bm = Number(_bp.find((x) => x.type === 'month')?.value || 1);
            const _bd = Number(_bp.find((x) => x.type === 'day')?.value   || 1);
            const daySerial = Math.floor(Date.UTC(_by, _bm - 1, _bd) / 86400000);

            let best = pool[0];
            let minH = hashDay(`${best.nombre}::${best.categoria}`, daySerial);
            for (let i = 1; i < pool.length; i++) {
                const h = hashDay(`${pool[i].nombre}::${pool[i].categoria}`, daySerial);
                if (h < minH) { minH = h; best = pool[i]; }
            }
            // Solo mostrar en POS si el producto está activo
            if (String(best.estado || 'active').trim() === 'active') _recProd = best;
        }
    }

    const recBtns = [];
    if (_recProd) {
        const precioOrig = Number(_recProd.precio || 0);
        const precioFinal = Math.round(precioOrig * 0.8);
        recBtns.push(makeBtn({
            badgeText: '⭐ -20%', badgeColor: '#c07000',
            nombre: _recProd.nombre, precioFinal, precioOrig,
            onClick: () => addProductToPosOrder(_recProd.id, _recProd.nombre, precioFinal, 'Recomendado del Día', precioOrig)
        }));
    }
    const recSection = buildSection('⭐ Recomendado del Día', recBtns);
    if (recSection) { wrap.appendChild(recSection); hasAny = true; }

    // ── 2. DESCUENTOS ────────────────────────────────────────────────────────
    const descBtns = [];
    promosState.filter((p) => p.activo !== false && p.producto_id).forEach((promo) => {
        const prod = productsState.find((p) => p.id === promo.producto_id);
        if (!prod) return;
        const desc = Number(promo.descuento || 0);
        const precioOrig = Number(prod.precio || 0);
        const precioFinal = desc > 0 ? Math.round(precioOrig * (1 - desc / 100)) : precioOrig;
        descBtns.push(makeBtn({
            badgeText: desc > 0 ? `-${desc}%` : (promo.badge || '🏷️'),
            badgeColor: '#b52a2a',
            nombre: prod.nombre,
            precioFinal,
            precioOrig: desc > 0 ? precioOrig : null,
            onClick: () => addProductToPosOrder(prod.id, prod.nombre, precioFinal, `Desc. ${desc}%`, desc > 0 ? precioOrig : null)
        }));
    });
    const descSection = buildSection('🏷️ Descuentos', descBtns);
    if (descSection) { wrap.appendChild(descSection); hasAny = true; }

    // ── 3. 2×1 ───────────────────────────────────────────────────────────────
    const dosX1Btns = [];
    promos2x1State.filter((p) => p.activo !== false && p.producto_id).forEach((promo) => {
        const prod = productsState.find((p) => p.id === promo.producto_id);
        if (!prod) return;
        const price = Number(prod.precio || 0);
        dosX1Btns.push(makeBtn({
            badgeText: '2×1', badgeColor: '#1a7a42',
            nombre: prod.nombre,
            precioFinal: price,
            detalle: 'Llevas 2 por el precio de 1',
            onClick: () => {
                addProductToPosOrder(prod.id, prod.nombre, price, '2×1', null, {
                    promoLabel: `PROMO 2×1 — ${promo.kicker || prod.nombre} (incluye 2)`,
                    promo2x1: true,
                    initialQuantity: 1
                });
            }
        }));
    });
    const dosX1Section = buildSection('2×1', dosX1Btns);
    if (dosX1Section) { wrap.appendChild(dosX1Section); hasAny = true; }

    // ── 4. COMBOS ────────────────────────────────────────────────────────────
    const comboBtns = [];
    combosEspecialesState.filter((c) => c.activo !== false && Array.isArray(c.productos) && c.productos.length).forEach((combo) => {
        const rate = Math.min(Math.max(Number(combo.descuento || 0), 0), 80) / 100;
        const precioOrig = combo.productos.reduce((sum, p) => {
            const found = productsState.find((x) => x.id === p.id);
            return sum + (found ? Number(found.precio || 0) * Number(p.cantidad || 1) : 0);
        }, 0);
        const precioCombo = precioOrig > 0 && rate > 0 ? Math.round(precioOrig * (1 - rate)) : precioOrig;
        const itemNames = combo.productos.map((p) => escapeHtml(p.nombre || '')).join(' + ');
        comboBtns.push(makeBtn({
            badgeText: combo.descuento > 0 ? `-${combo.descuento}%` : '🎁',
            badgeColor: '#7b3fa0',
            nombre: combo.nombre || 'Combo',
            precioFinal: precioCombo,
            precioOrig: rate > 0 && precioOrig > precioCombo ? precioOrig : null,
            detalle: itemNames,
            onClick: () => {
                combo.productos.forEach((p, i) => {
                    const found = productsState.find((x) => x.id === p.id);
                    if (!found) return;
                    const qty = Number(p.cantidad || 1);
                    const unitOrig = Number(found.precio || 0);
                    const unitAdj = precioOrig > 0 && rate > 0 ? Math.round(unitOrig * (1 - rate)) : unitOrig;
                    setTimeout(() => {
                        for (let q = 0; q < qty; q++) {
                            addProductToPosOrder(found.id, found.nombre, unitAdj, `Combo: ${combo.nombre || ''}`, rate > 0 ? unitOrig : null);
                        }
                    }, i * 60);
                });
            }
        }));
    });
    const comboSection = buildSection('🎁 Combos', comboBtns);
    if (comboSection) { wrap.appendChild(comboSection); hasAny = true; }

    if (!hasAny) {
        wrap.innerHTML = '<p style="color:rgba(255,255,255,0.4);text-align:center;padding:24px;">Sin promociones activas configuradas</p>';
    }

    grid.appendChild(wrap);
}

const POS_COMBOS_CON_PAPAS_PRICES = {
    comboburgerpapuda: { 1: 27000, 2: 48000, 3: 70000, 4: 91000 },
    comboburgersuper:  { 1: 26000, 2: 46000, 3: 68000, 4: 87000 },
    comboperronormal:  { 1: 17000, 2: 25000, 3: 38000, 4: 49000 },
    comboburgernormal: { 1: 21000, 2: 38000, 3: 57000, 4: 73000 }
};
const POS_BURGER_CLASICAS_OPTIONS = [
    { label: 'Pequeña | 1 carne', price: 14000 },
    { label: 'Pequeña | 2 carne', price: 18000 },
    { label: 'Mediana | 1 carne', price: 17000 },
    { label: 'Mediana | 2 carne', price: 22000 }
];

function handlePosProductAdd(productId, productName, productPrice) {
    const selectedCategory = String(posSelectedCategory || '').trim();
    const normCat = normalizeCategoryKey(selectedCategory);

    // Si el producto tiene variantes configuradas, usar el nuevo modal de variantes
    const prodEntry = productsState.find((p) => p.id === productId);
    if (prodEntry && Array.isArray(prodEntry.variantes) && prodEntry.variantes.length > 0) {
        openProductVariantesModal(productId, productName, selectedCategory, prodEntry.variantes);
        return;
    }

    // Bebida incluida → pedir sabor directo
    if (prodEntry?.bebida_incluida?.activo && prodEntry.bebida_incluida.bebida_ref_id) {
        openPosBebidaModal(productId, productName, productPrice, prodEntry.bebida_incluida);
        return;
    }

    // Combos Mixtos → pedir sabor de bebida desde bebidasState (1L preferido, cualquiera con sabores como fallback)
    if (normCat.includes('combos mixtos')) {
        let _cmBeb = null, _cmPres = null;
        for (const b of bebidasState) {
            if (b.estado !== 'active') continue;
            const p1L = (b.presentaciones || []).find((pr) => /1\s*l(itro)?/i.test(pr.nombre) && Array.isArray(pr.sabores) && pr.sabores.length > 0);
            if (p1L) { _cmBeb = b; _cmPres = p1L; break; }
        }
        if (!_cmBeb) {
            for (const b of bebidasState) {
                if (b.estado !== 'active') continue;
                const pAny = (b.presentaciones || []).find((pr) => Array.isArray(pr.sabores) && pr.sabores.length > 0);
                if (pAny) { _cmBeb = b; _cmPres = pAny; break; }
            }
        }
        if (_cmBeb && _cmPres) {
            openPosBebidaModal(productId, productName, productPrice, {
                activo: true,
                bebida_ref_id: _cmBeb.id,
                bebida_pres_id: _cmPres.id,
                bebida_nombre: `${_cmBeb.marca} ${_cmPres.nombre}`,
                cantidad: 1
            });
            return;
        }
    }

    // Burger Clásica Normal → opciones de tamaño y cantidad de carne
    if (normCat.includes('burger clasicas') && normalizeCategoryKey(productName).includes('normal')) {
        openBurgerClasicasPosModal(productId, productName);
        return;
    }

    // Verificar acompañantes/bebidas/combos por categoría
    const catData = categoriesState.find((c) => c.name.trim().toUpperCase() === selectedCategory.toUpperCase());
    const catAcompPos  = catData ? catData.acompanantes_pos !== false : false;
    const catBebPos    = catData ? catData.bebidas_pos      !== false : false;
    const catCombosPos = catData ? catData.combos_pos       !== false : false;

    const hayAcomp  = catAcompPos  && acompanantesState.some((a) => a.estado === 'active' && a.activo_pos);
    const hayBebida = catBebPos    && bebidasState.some((b) => b.estado === 'active' && b.mostrar_acompanante);
    const hayCombos = catCombosPos && combosPackState.some((c) => c.estado !== 'paused' && c.activo_pos !== false);

    if (hayAcomp || hayBebida || hayCombos) {
        openPosUpgradeSheet(productId, productName, productPrice);
        return;
    }

    addProductToPosOrder(productId, productName, productPrice);
}

function isComboCategory(categoryName) {
    return String(categoryName || '').toLowerCase().includes('combo');
}

// ═══════════════════════════════════════════════════════════════════
//  SISTEMA BEBIDAS — colección `bebidas` independiente de `productos`
// ═══════════════════════════════════════════════════════════════════

function normalizeBebida(raw) {
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
        orden: raw.orden != null ? Number(raw.orden) : 99,
        created_at: raw.created_at,
        updated_at: raw.updated_at
    };
}

async function fetchBebidas() {
    try {
        const snap = await firebaseDb.collection('bebidas').get();
        bebidasState = snap.docs
            .map((doc) => normalizeBebida({ id: doc.id, ...doc.data() }))
            .sort((a, b) => a.orden - b.orden || a.marca.localeCompare(b.marca, 'es'));
    } catch (_) {
        bebidasState = [];
    }
}

function getBeverageOptions() {
    return bebidasState.filter((b) => b.estado === 'active' && b.mostrar_acompanante);
}

function _isBebidaCategory(catName) {
    return String(catName || '').toLowerCase().trim() === 'bebidas';
}

function renderBebidasPanel() {
    const container = document.getElementById('bebidasTabPanel');
    if (!container) return;
    container.innerHTML = '';

    const toolbar = document.createElement('div');
    toolbar.className = 'section-toolbar';
    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'section-action-btn primary';
    addBtn.textContent = '+ Crear bebida';
    addBtn.addEventListener('click', () => openBebidaModal());
    toolbar.appendChild(addBtn);
    container.appendChild(toolbar);

    if (!bebidasState.length) {
        const empty = document.createElement('div');
        empty.className = 'bebidas-panel-empty';
        empty.innerHTML = '<p>🥤</p><p>No hay bebidas configuradas. Crea la primera.</p>';
        container.appendChild(empty);
        return;
    }

    const list = document.createElement('div');
    list.className = 'bebidas-panel-grid';

    bebidasState.forEach((bev) => {
        const card = document.createElement('div');
        card.className = `bebidas-panel-card${bev.estado === 'paused' ? ' paused' : ''}`;

        const img = document.createElement('img');
        img.className = 'bebidas-panel-img';
        img.src = bev.image_url || 'logo.png';
        img.alt = bev.marca;
        img.loading = 'lazy';
        img.addEventListener('error', () => { img.src = 'logo.png'; });

        const info = document.createElement('div');
        info.className = 'bebidas-panel-info';

        const nomEl = document.createElement('div');
        nomEl.className = 'bebidas-panel-nombre';
        nomEl.textContent = bev.marca;
        info.appendChild(nomEl);

        const badges = document.createElement('div');
        badges.className = 'bebidas-panel-badges';
        if (bev.mostrar_categoria) {
            const b1 = document.createElement('span');
            b1.className = 'bebidas-badge bebidas-badge--cat';
            b1.textContent = 'Categoría';
            badges.appendChild(b1);
        }
        if (bev.mostrar_acompanante) {
            const b2 = document.createElement('span');
            b2.className = 'bebidas-badge bebidas-badge--acomp';
            b2.textContent = 'Acompañante';
            badges.appendChild(b2);
        }
        if (badges.firstChild) info.appendChild(badges);

        const presList = document.createElement('div');
        presList.className = 'bebidas-panel-pres-list';
        bev.presentaciones.forEach((p) => {
            const row = document.createElement('div');
            row.className = 'bebidas-panel-pres-item';
            const n = document.createElement('span');
            n.className = 'bebidas-pres-nombre';
            n.textContent = p.nombre;
            const price = document.createElement('span');
            price.className = 'bebidas-pres-precio';
            price.textContent = formatMoney(p.precio);
            row.appendChild(n);
            row.appendChild(price);
            if (p.sabores.length) {
                const sab = document.createElement('span');
                sab.className = 'bebidas-pres-sabores';
                sab.textContent = p.sabores.join(', ');
                row.appendChild(sab);
            }
            presList.appendChild(row);
        });
        if (bev.presentaciones.length) info.appendChild(presList);

        const actions = document.createElement('div');
        actions.className = 'bebidas-panel-actions';

        const editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.className = 'mini-btn';
        editBtn.textContent = 'Editar';
        editBtn.addEventListener('click', () => openBebidaModal(bev));

        const pauseBtn = document.createElement('button');
        pauseBtn.type = 'button';
        pauseBtn.className = 'mini-btn';
        pauseBtn.textContent = bev.estado === 'paused' ? 'Reanudar' : 'Pausar';
        pauseBtn.addEventListener('click', async () => {
            const nuevoEstado = bev.estado === 'paused' ? 'active' : 'paused';
            try {
                await firebaseDb.collection('bebidas').doc(bev.id).update({ estado: nuevoEstado, updated_at: firestoreNow() });
                await reloadDataAndRender();
            } catch (e) { showNotice(`Error: ${e.message}`, 'error'); }
        });

        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.className = 'mini-btn remove';
        delBtn.textContent = 'Eliminar';
        delBtn.addEventListener('click', async () => {
            if (!window.confirm(`¿Eliminar "${bev.marca}"?`)) return;
            try {
                await firebaseDb.collection('bebidas').doc(bev.id).delete();
                await reloadDataAndRender();
                showNotice('Bebida eliminada.', 'ok');
            } catch (e) { showNotice(`Error: ${e.message}`, 'error'); }
        });

        actions.appendChild(editBtn);
        actions.appendChild(pauseBtn);
        actions.appendChild(delBtn);
        card.appendChild(img);
        card.appendChild(info);
        card.appendChild(actions);
        list.appendChild(card);
    });

    container.appendChild(list);
}

function _renderBebidasLegacy_UNUSED() {
    const bebidas = productsState
        .filter((p) => _isBebidaCategory(p.categoria))
        .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));

    container.innerHTML = '';

    const toolbar = document.createElement('div');
    toolbar.className = 'section-toolbar bebidas-panel-toolbar';
    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'section-action-btn primary';
    addBtn.textContent = '+ Crear bebida';
    addBtn.addEventListener('click', () => openProductCreateModal('BEBIDAS'));
    toolbar.appendChild(addBtn);
    container.appendChild(toolbar);

    if (!bebidas.length) {
        const empty = document.createElement('div');
        empty.className = 'bebidas-panel-empty';
        empty.innerHTML = '<p>🥤</p><p>Todavía no hay bebidas. Crea la primera.</p>';
        container.appendChild(empty);
        return;
    }

    const grid = document.createElement('div');
    grid.className = 'bebidas-panel-grid';

    bebidas.forEach((bev) => {
        const card = document.createElement('div');
        card.className = `bebidas-panel-card${bev.estado === 'paused' ? ' paused' : ''}`;

        const img = document.createElement('img');
        img.className = 'bebidas-panel-img';
        img.src = bev.image_url || 'logo.png';
        img.alt = bev.nombre;
        img.loading = 'lazy';
        img.addEventListener('error', () => { img.src = 'logo.png'; });

        const info = document.createElement('div');
        info.className = 'bebidas-panel-info';

        const nombre = document.createElement('div');
        nombre.className = 'bebidas-panel-nombre';
        nombre.textContent = bev.nombre;
        info.appendChild(nombre);

        const metaParts = [];
        if (bev.marca) metaParts.push(bev.marca);
        if (bev.ml) metaParts.push(`${bev.ml}ml`);
        if (metaParts.length) {
            const meta = document.createElement('div');
            meta.className = 'bebidas-panel-meta';
            meta.textContent = metaParts.join(' · ');
            info.appendChild(meta);
        }

        const price = document.createElement('div');
        price.className = 'bebidas-panel-price';
        price.textContent = formatMoney(bev.precio);
        info.appendChild(price);

        if (bev.sabores && bev.sabores.length) {
            const saboresWrap = document.createElement('div');
            saboresWrap.className = 'bebidas-panel-sabores';
            bev.sabores.forEach((s) => {
                const chip = document.createElement('span');
                chip.className = 'bebidas-sabor-chip';
                chip.textContent = s;
                saboresWrap.appendChild(chip);
            });
            info.appendChild(saboresWrap);
        }

        const actions = document.createElement('div');
        actions.className = 'bebidas-panel-actions';

        const editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.className = 'mini-btn';
        editBtn.textContent = 'Editar';
        editBtn.addEventListener('click', () => {
            const cat = categoriesState.find((c) => _isBebidaCategory(c.name));
            openProductEditModal(bev, cat?.id || '');
        });

        const pauseBtn = document.createElement('button');
        pauseBtn.type = 'button';
        pauseBtn.className = 'mini-btn';
        pauseBtn.textContent = bev.estado === 'paused' ? 'Reanudar' : 'Pausar';
        pauseBtn.addEventListener('click', async () => {
            const newEstado = bev.estado === 'paused' ? 'active' : 'paused';
            try {
                await firebaseDb.collection('productos').doc(bev.id).update({ estado: newEstado, updated_at: firestoreNow() });
                await reloadDataAndRender();
            } catch (e) {
                showNotice(`No se pudo cambiar estado: ${e.message}`, 'error');
            }
        });

        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.className = 'mini-btn remove';
        delBtn.textContent = 'Eliminar';
        delBtn.addEventListener('click', async () => {
            if (!window.confirm(`¿Eliminar "${bev.nombre}"?`)) return;
            try {
                await firebaseDb.collection('productos').doc(bev.id).delete();
                await reloadDataAndRender();
                showNotice('Bebida eliminada.', 'ok');
            } catch (e) {
                showNotice(`No se pudo eliminar: ${e.message}`, 'error');
            }
        });

        actions.appendChild(editBtn);
        actions.appendChild(pauseBtn);
        actions.appendChild(delBtn);

        card.appendChild(img);
        card.appendChild(info);
        card.appendChild(actions);
        grid.appendChild(card);
    });

    container.appendChild(grid);
}

// ─────────────────────────────────────────
//  ACOMPAÑANTES — Colección propia Firestore
// ─────────────────────────────────────────

// ─── Visibilidad global catálogo ───────────────
async function fetchCatalogoVisibilidad() {
    try {
        const doc = await firebaseDb.collection('configuracion').doc('visibilidad_catalogo').get();
        if (doc.exists) {
            const d = doc.data();
            catalogoVisibilidad = {
                bebidas_pos: d.bebidas_pos !== false,
                bebidas_menu: d.bebidas_menu !== false,
                acompanantes_pos: d.acompanantes_pos !== false,
                acompanantes_menu: d.acompanantes_menu !== false
            };
        }
    } catch (_) {}
}

async function _saveCatalogoVisibilidad() {
    await firebaseDb.collection('configuracion').doc('visibilidad_catalogo').set(catalogoVisibilidad, { merge: true });
}


function normalizeAcompanante(raw) {
    return {
        id: raw.id,
        nombre: String(raw.nombre || '').trim(),
        cantidad: String(raw.cantidad || '').trim(),
        precio: Number(raw.precio) || 0,
        imagen_url: String(raw.imagen_url || '').trim(),
        activo_pos: raw.activo_pos !== false,
        activo_menu: raw.activo_menu !== false,
        estado: raw.estado === 'paused' ? 'paused' : 'active',
        orden: raw.orden != null ? Number(raw.orden) : 99,
        created_at: raw.created_at,
        updated_at: raw.updated_at
    };
}

async function fetchAcompanantes() {
    try {
        const snap = await firebaseDb.collection('acompanantes').get();
        acompanantesState = snap.docs
            .map((doc) => normalizeAcompanante({ id: doc.id, ...doc.data() }))
            .sort((a, b) => a.orden - b.orden || a.nombre.localeCompare(b.nombre, 'es'));
    } catch (_) {
        acompanantesState = [];
    }
}

function renderAcompanantesPanel() {
    const container = document.getElementById('acompanantesTabPanel');
    if (!container) return;

    container.innerHTML = '';
    const wrapper = document.createElement('article');
    wrapper.className = 'admin-card';

    const toolbar = document.createElement('div');
    toolbar.className = 'acomp-panel-toolbar';
    const createBtn = document.createElement('button');
    createBtn.type = 'button';
    createBtn.className = 'ghost-button';
    createBtn.style.cssText = 'font-size:0.82rem;padding:6px 14px;';
    createBtn.textContent = '+ Crear acompañante';
    createBtn.addEventListener('click', () => openAcompananteModal());
    toolbar.appendChild(createBtn);

    const list = document.createElement('div');
    list.className = 'acomp-panel-list';

    if (!acompanantesState.length) {
        const empty = document.createElement('p');
        empty.style.cssText = 'color:rgba(255,255,255,0.35);text-align:center;padding:28px 0;';
        empty.textContent = 'No hay acompañantes. Crea el primero.';
        list.appendChild(empty);
    } else {
        acompanantesState.forEach((acomp) => {
            const card = document.createElement('div');
            card.className = 'acomp-panel-card' + (acomp.estado === 'paused' ? ' paused' : '');

            if (acomp.imagen_url) {
                const img = document.createElement('img');
                img.className = 'acomp-panel-img';
                img.src = acomp.imagen_url;
                img.alt = acomp.nombre;
                img.addEventListener('error', () => { img.style.display = 'none'; });
                card.appendChild(img);
            } else {
                const ph = document.createElement('div');
                ph.className = 'acomp-panel-img-placeholder';
                ph.textContent = '🥗';
                card.appendChild(ph);
            }

            const info = document.createElement('div');
            info.className = 'acomp-panel-info';

            const nombre = document.createElement('div');
            nombre.className = 'acomp-panel-nombre';
            nombre.textContent = acomp.nombre;

            const meta = document.createElement('div');
            meta.className = 'acomp-panel-meta';
            meta.textContent = acomp.cantidad || '—';

            const precio = document.createElement('div');
            precio.className = 'acomp-panel-precio';
            precio.textContent = formatMoney(acomp.precio);

            const badges = document.createElement('div');
            badges.className = 'acomp-panel-badges';
            if (acomp.activo_pos)  badges.innerHTML += '<span class="acomp-badge acomp-badge--pos">POS</span>';
            if (acomp.activo_menu) badges.innerHTML += '<span class="acomp-badge acomp-badge--menu">Menú</span>';

            info.appendChild(nombre);
            info.appendChild(meta);
            info.appendChild(precio);
            info.appendChild(badges);

            const actions = document.createElement('div');
            actions.className = 'acomp-panel-actions';

            const editBtn = document.createElement('button');
            editBtn.type = 'button';
            editBtn.className = 'acomp-action-btn';
            editBtn.textContent = 'Editar';
            editBtn.addEventListener('click', () => openAcompananteModal(acomp));

            const pauseBtn = document.createElement('button');
            pauseBtn.type = 'button';
            pauseBtn.className = 'acomp-action-btn';
            pauseBtn.textContent = acomp.estado === 'paused' ? 'Reanudar' : 'Pausar';
            pauseBtn.addEventListener('click', async () => {
                const newEstado = acomp.estado === 'paused' ? 'active' : 'paused';
                await firebaseDb.collection('acompanantes').doc(acomp.id).update({ estado: newEstado, updated_at: firestoreNow() });
                await reloadDataAndRender();
            });

            const delBtn = document.createElement('button');
            delBtn.type = 'button';
            delBtn.className = 'acomp-action-btn danger';
            delBtn.textContent = 'Eliminar';
            delBtn.addEventListener('click', async () => {
                if (!confirm(`¿Eliminar "${acomp.nombre}"?`)) return;
                await firebaseDb.collection('acompanantes').doc(acomp.id).delete();
                await reloadDataAndRender();
            });

            actions.appendChild(editBtn);
            actions.appendChild(pauseBtn);
            actions.appendChild(delBtn);

            card.appendChild(info);
            card.appendChild(actions);
            list.appendChild(card);
        });
    }

    wrapper.appendChild(toolbar);
    wrapper.appendChild(list);
    container.appendChild(wrapper);
}

function openAcompananteModal(acomp = null) {
    const isEdit = !!acomp;
    let _pendingImageFile = null;
    let _resolvedImageUrl = acomp?.imagen_url || '';

    const overlay = document.createElement('div');
    overlay.className = 'combo-modal-overlay';
    overlay.style.zIndex = '8500';

    const card = document.createElement('div');
    card.className = 'combo-modal-card acomp-form-card';

    const header = document.createElement('div');
    header.className = 'combo-modal-header';
    const htitle = document.createElement('div');
    htitle.innerHTML = `<h4>${isEdit ? 'Editar acompañante' : 'Nuevo acompañante'}</h4>`;
    const closeX = document.createElement('button');
    closeX.type = 'button';
    closeX.className = 'combo-modal-close-x';
    closeX.textContent = '×';
    closeX.addEventListener('click', () => overlay.remove());
    header.appendChild(htitle);
    header.appendChild(closeX);

    const body = document.createElement('div');
    body.className = 'acomp-form-body';

    // Nombre
    const nombreLabel = document.createElement('div');
    nombreLabel.className = 'combo-modal-section-label';
    nombreLabel.textContent = 'Nombre del acompañante';
    const nombreInput = document.createElement('input');
    nombreInput.type = 'text';
    nombreInput.className = 'acomp-form-input';
    nombreInput.placeholder = 'Ej: Papas Fritas, Ensalada...';
    nombreInput.value = acomp?.nombre || '';
    body.appendChild(nombreLabel);
    body.appendChild(nombreInput);

    // Cantidad + Precio en la misma fila
    const rowLabel = document.createElement('div');
    rowLabel.style.cssText = 'display:grid;grid-template-columns:1fr 100px;gap:8px;font-size:0.65rem;font-weight:700;color:rgba(160,185,220,0.5);text-transform:uppercase;letter-spacing:0.6px;';
    rowLabel.innerHTML = '<span>Cantidad / Medida</span><span>Precio</span>';
    const row = document.createElement('div');
    row.className = 'acomp-form-row';

    const cantidadInput = document.createElement('input');
    cantidadInput.type = 'text';
    cantidadInput.className = 'acomp-form-input';
    cantidadInput.placeholder = 'Ej: Porción, 250ml, Unidad...';
    cantidadInput.value = acomp?.cantidad || '';

    const precioInput = document.createElement('input');
    precioInput.type = 'number';
    precioInput.className = 'acomp-form-input';
    precioInput.placeholder = 'Precio';
    precioInput.min = '0';
    precioInput.step = '100';
    precioInput.value = acomp?.precio || '';
    precioInput.style.textAlign = 'right';

    row.appendChild(cantidadInput);
    row.appendChild(precioInput);
    body.appendChild(rowLabel);
    body.appendChild(row);

    // Imagen (opcional)
    const imgLabel = document.createElement('div');
    imgLabel.className = 'combo-modal-section-label';
    imgLabel.textContent = 'Imagen (opcional)';
    body.appendChild(imgLabel);

    const imgRow = document.createElement('div');
    imgRow.style.cssText = 'display:flex;align-items:center;gap:10px;';

    const imgPreview = document.createElement('img');
    imgPreview.style.cssText = 'width:52px;height:52px;object-fit:cover;border-radius:8px;border:1px solid rgba(255,255,255,0.12);display:' + (_resolvedImageUrl ? 'block' : 'none') + ';flex-shrink:0;';
    imgPreview.src = _resolvedImageUrl || '';
    imgPreview.alt = 'preview';
    imgPreview.addEventListener('error', () => { imgPreview.style.display = 'none'; });

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';

    const uploadBtn = document.createElement('button');
    uploadBtn.type = 'button';
    uploadBtn.className = 'ghost-button';
    uploadBtn.style.cssText = 'font-size:0.8rem;padding:6px 12px;';
    uploadBtn.textContent = _resolvedImageUrl ? '📷 Cambiar imagen' : '📷 Cargar imagen';

    const removeImgBtn = document.createElement('button');
    removeImgBtn.type = 'button';
    removeImgBtn.className = 'ghost-button';
    removeImgBtn.style.cssText = 'font-size:0.78rem;padding:4px 8px;color:rgba(255,100,100,0.85);display:' + (_resolvedImageUrl ? 'inline-flex' : 'none') + ';';
    removeImgBtn.textContent = '✕ Quitar';

    fileInput.addEventListener('change', () => {
        const file = fileInput.files[0];
        if (!file) return;
        _pendingImageFile = file;
        const reader = new FileReader();
        reader.onload = () => {
            imgPreview.src = String(reader.result);
            imgPreview.style.display = 'block';
            uploadBtn.textContent = '📷 Cambiar imagen';
            removeImgBtn.style.display = 'inline-flex';
        };
        reader.readAsDataURL(file);
    });
    uploadBtn.addEventListener('click', () => fileInput.click());
    removeImgBtn.addEventListener('click', () => {
        _pendingImageFile = null;
        _resolvedImageUrl = '';
        imgPreview.src = '';
        imgPreview.style.display = 'none';
        uploadBtn.textContent = '📷 Cargar imagen';
        removeImgBtn.style.display = 'none';
        fileInput.value = '';
    });

    imgRow.appendChild(imgPreview);
    imgRow.appendChild(uploadBtn);
    imgRow.appendChild(removeImgBtn);
    imgRow.appendChild(fileInput);
    body.appendChild(imgRow);

    // Toggles visibilidad
    const visLabel = document.createElement('div');
    visLabel.className = 'combo-modal-section-label';
    visLabel.textContent = 'Visibilidad';
    body.appendChild(visLabel);

    const visRow = document.createElement('div');
    visRow.className = 'acomp-form-vis-row';
    const makeTgl = (text, checked) => {
        const wrap = document.createElement('label');
        wrap.className = 'acomp-form-tgl';
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = checked;
        const span = document.createElement('span');
        span.textContent = text;
        wrap.appendChild(cb);
        wrap.appendChild(span);
        return { wrap, cb };
    };
    const { wrap: posWrap, cb: posCb } = makeTgl('Activar como acompañante en categorías', acomp ? acomp.activo_pos : true);
    const { wrap: menuWrap, cb: menuCb } = makeTgl('Activar como categoría en el menú', acomp ? acomp.activo_menu : true);
    visRow.appendChild(posWrap);
    visRow.appendChild(menuWrap);
    body.appendChild(visRow);

    const feedback = document.createElement('div');
    feedback.className = 'modal-feedback';
    body.appendChild(feedback);

    const footer = document.createElement('div');
    footer.className = 'combo-modal-footer';

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'combo-modal-cancel-btn';
    cancelBtn.textContent = 'Cancelar';
    cancelBtn.addEventListener('click', () => overlay.remove());

    const saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.className = 'combo-modal-confirm-btn';
    saveBtn.textContent = isEdit ? 'Guardar cambios' : 'Crear acompañante';
    saveBtn.addEventListener('click', async () => {
        const nombre = nombreInput.value.trim();
        if (!nombre) { showModalFeedback(feedback, 'Escribe el nombre del acompañante.', 'error'); return; }

        saveBtn.disabled = true;
        saveBtn.textContent = isEdit ? 'Guardando...' : 'Creando...';

        let finalImageUrl = _resolvedImageUrl;
        if (_pendingImageFile) {
            try {
                showModalFeedback(feedback, 'Subiendo imagen...', 'info');
                finalImageUrl = await resolveProductImageUpload(_pendingImageFile, nombre);
            } catch (imgErr) {
                showModalFeedback(feedback, `Error al subir imagen: ${imgErr.message || 'intenta de nuevo'}`, 'error');
                saveBtn.disabled = false;
                saveBtn.textContent = isEdit ? 'Guardar cambios' : 'Crear acompañante';
                return;
            }
        }

        const payload = {
            nombre,
            cantidad: cantidadInput.value.trim(),
            precio: Number(precioInput.value) || 0,
            imagen_url: finalImageUrl,
            activo_pos: posCb.checked,
            activo_menu: menuCb.checked,
            estado: acomp?.estado || 'active',
            updated_at: firestoreNow()
        };

        try {
            if (isEdit) {
                await firebaseDb.collection('acompanantes').doc(acomp.id).update(payload);
            } else {
                payload.orden = acompanantesState.length;
                payload.created_at = firestoreNow();
                await firebaseDb.collection('acompanantes').add(payload);
            }
            await reloadDataAndRender();
            overlay.remove();
            showNotice(isEdit ? 'Acompañante actualizado.' : 'Acompañante creado.', 'ok');
        } catch (e) {
            showModalFeedback(feedback, `Error: ${e.message || 'No se pudo guardar.'}`, 'error');
            saveBtn.disabled = false;
            saveBtn.textContent = isEdit ? 'Guardar cambios' : 'Crear acompañante';
        }
    });

    footer.appendChild(cancelBtn);
    footer.appendChild(saveBtn);
    card.appendChild(header);
    card.appendChild(body);
    card.appendChild(footer);
    overlay.appendChild(card);
    _bindOverlayClose(overlay, () => overlay.remove());
    document.body.appendChild(overlay);
    setTimeout(() => nombreInput.focus(), 80);
}

// ── Combos (papas + bebida) ─────────────────────────────────────────────────

function normalizeCombosPack(raw) {
    return {
        id: raw.id,
        nombre: String(raw.nombre || '').trim(),
        papas: String(raw.papas || '').trim(),
        bebida_ref_id: String(raw.bebida_ref_id || '').trim(),
        bebida_pres_id: String(raw.bebida_pres_id || '').trim(),
        bebida_nombre: String(raw.bebida_nombre || '').trim(),
        bebida_sabores: Array.isArray(raw.bebida_sabores)
            ? raw.bebida_sabores.map((s) => String(s).trim()).filter(Boolean)
            : (typeof raw.bebida_sabores === 'string'
                ? raw.bebida_sabores.split(',').map((s) => s.trim()).filter(Boolean)
                : []),
        valor: Number(raw.valor) || 0,
        activo_pos: raw.activo_pos !== false,
        activo_menu: raw.activo_menu !== false,
        estado: raw.estado === 'paused' ? 'paused' : 'active',
        orden: raw.orden != null ? Number(raw.orden) : 99
    };
}

async function fetchCombosPack() {
    try {
        const snap = await firebaseDb.collection('combospacks').get();
        combosPackState = snap.docs
            .map((doc) => normalizeCombosPack({ id: doc.id, ...doc.data() }))
            .sort((a, b) => a.orden - b.orden || a.nombre.localeCompare(b.nombre, 'es'));
    } catch (_) {
        combosPackState = [];
    }
}

function renderCombosPackPanel() {
    const container = document.getElementById('combosPacksTabPanel');
    if (!container) return;

    container.innerHTML = '';
    const wrapper = document.createElement('article');
    wrapper.className = 'admin-card';

    const toolbar = document.createElement('div');
    toolbar.className = 'acomp-panel-toolbar';
    const createBtn = document.createElement('button');
    createBtn.type = 'button';
    createBtn.className = 'ghost-button';
    createBtn.style.cssText = 'font-size:0.82rem;padding:6px 14px;';
    createBtn.textContent = '+ Crear combo';
    createBtn.addEventListener('click', () => openComboPackModal());
    toolbar.appendChild(createBtn);

    const list = document.createElement('div');
    list.className = 'acomp-panel-list';

    if (!combosPackState.length) {
        const empty = document.createElement('p');
        empty.style.cssText = 'color:rgba(255,255,255,0.35);text-align:center;padding:28px 0;';
        empty.textContent = 'No hay combos. Crea el primero.';
        list.appendChild(empty);
    } else {
        combosPackState.forEach((combo) => {
            const card = document.createElement('div');
            card.className = 'acomp-panel-card' + (combo.estado === 'paused' ? ' paused' : '');

            const ph = document.createElement('div');
            ph.className = 'acomp-panel-img-placeholder';
            ph.textContent = '🍔';
            card.appendChild(ph);

            const info = document.createElement('div');
            info.className = 'acomp-panel-info';

            const nombre = document.createElement('div');
            nombre.className = 'acomp-panel-nombre';
            nombre.textContent = combo.nombre;

            const meta = document.createElement('div');
            meta.className = 'acomp-panel-meta';
            const parts = [];
            if (combo.papas) parts.push(`🍟 ${combo.papas}`);
            if (combo.bebida_nombre) parts.push(`🥤 ${combo.bebida_nombre}`);
            if (combo.bebida_sabores.length) parts.push(combo.bebida_sabores.slice(0, 3).join(' · '));
            meta.textContent = parts.join('  ·  ') || '—';

            const precio = document.createElement('div');
            precio.className = 'acomp-panel-precio';
            precio.textContent = formatMoney(combo.valor);

            const badges = document.createElement('div');
            badges.className = 'acomp-panel-badges';
            if (combo.activo_pos)  badges.innerHTML += '<span class="acomp-badge acomp-badge--pos">POS</span>';
            if (combo.activo_menu) badges.innerHTML += '<span class="acomp-badge acomp-badge--menu">Menú</span>';

            info.appendChild(nombre);
            info.appendChild(meta);
            info.appendChild(precio);
            info.appendChild(badges);

            const actions = document.createElement('div');
            actions.className = 'acomp-panel-actions';

            const editBtn = document.createElement('button');
            editBtn.type = 'button';
            editBtn.className = 'acomp-action-btn';
            editBtn.textContent = 'Editar';
            editBtn.addEventListener('click', () => openComboPackModal(combo));

            const pauseBtn = document.createElement('button');
            pauseBtn.type = 'button';
            pauseBtn.className = 'acomp-action-btn';
            pauseBtn.textContent = combo.estado === 'paused' ? 'Reanudar' : 'Pausar';
            pauseBtn.addEventListener('click', async () => {
                const newEstado = combo.estado === 'paused' ? 'active' : 'paused';
                await firebaseDb.collection('combospacks').doc(combo.id).update({ estado: newEstado, updated_at: firestoreNow() });
                await reloadDataAndRender();
            });

            const delBtn = document.createElement('button');
            delBtn.type = 'button';
            delBtn.className = 'acomp-action-btn danger';
            delBtn.textContent = 'Eliminar';
            delBtn.addEventListener('click', async () => {
                if (!confirm(`¿Eliminar "${combo.nombre}"?`)) return;
                await firebaseDb.collection('combospacks').doc(combo.id).delete();
                await reloadDataAndRender();
            });

            actions.appendChild(editBtn);
            actions.appendChild(pauseBtn);
            actions.appendChild(delBtn);

            card.appendChild(info);
            card.appendChild(actions);
            list.appendChild(card);
        });
    }

    wrapper.appendChild(toolbar);
    wrapper.appendChild(list);
    container.appendChild(wrapper);
}

function openComboPackModal(combo = null) {
    const isEdit = !!combo;
    let sabores = combo ? [...(combo.bebida_sabores || [])] : [];

    const overlay = document.createElement('div');
    overlay.className = 'combo-modal-overlay';
    overlay.style.zIndex = '8500';

    const card = document.createElement('div');
    card.className = 'combo-modal-card acomp-form-card';

    const header = document.createElement('div');
    header.className = 'combo-modal-header';
    const htitle = document.createElement('div');
    htitle.innerHTML = `<h4>${isEdit ? 'Editar combo' : 'Nuevo combo'}</h4>`;
    const closeX = document.createElement('button');
    closeX.type = 'button';
    closeX.className = 'combo-modal-close-x';
    closeX.textContent = '×';
    closeX.addEventListener('click', () => overlay.remove());
    header.appendChild(htitle);
    header.appendChild(closeX);

    const body = document.createElement('div');
    body.className = 'acomp-form-body';

    // ── Nombre ──
    const lblNombre = document.createElement('div');
    lblNombre.className = 'combo-modal-section-label';
    lblNombre.textContent = 'Nombre del combo';
    const nombreInput = document.createElement('input');
    nombreInput.type = 'text';
    nombreInput.className = 'acomp-form-input';
    nombreInput.placeholder = 'Ej: Combo Clásico, Combo Familiar...';
    nombreInput.value = combo?.nombre || '';
    body.appendChild(lblNombre);
    body.appendChild(nombreInput);

    // ── Papas ──
    const lblPapas = document.createElement('div');
    lblPapas.className = 'combo-modal-section-label';
    lblPapas.style.marginTop = '10px';
    lblPapas.textContent = 'Papas — gramaje';
    const papasInput = document.createElement('input');
    papasInput.type = 'text';
    papasInput.className = 'acomp-form-input';
    papasInput.placeholder = 'Ej: 150g, Porción grande, 300g...';
    papasInput.value = combo?.papas || '';
    body.appendChild(lblPapas);
    body.appendChild(papasInput);

    // ── Bebida desde bebidasState ──
    const lblBebida = document.createElement('div');
    lblBebida.className = 'combo-modal-section-label';
    lblBebida.style.marginTop = '10px';
    lblBebida.textContent = 'Bebida — presentación';
    body.appendChild(lblBebida);

    const bebidaSelect = document.createElement('select');
    bebidaSelect.className = 'acomp-form-input';
    bebidaSelect.style.cursor = 'pointer';

    const optBlank = document.createElement('option');
    optBlank.value = '';
    optBlank.textContent = '— Selecciona una bebida —';
    bebidaSelect.appendChild(optBlank);

    const activeBebidas = bebidasState.filter((b) => b.estado === 'active');
    activeBebidas.forEach((b) => {
        b.presentaciones.forEach((p) => {
            const opt = document.createElement('option');
            opt.value = `${b.id}::${p.id}`;
            opt.textContent = `${b.marca} · ${p.nombre}  (+$${Number(p.precio || 0).toLocaleString('es-CO')})`;
            opt.dataset.sabores = JSON.stringify(p.sabores || []);
            if (combo?.bebida_ref_id === b.id && combo?.bebida_pres_id === p.id) opt.selected = true;
            bebidaSelect.appendChild(opt);
        });
    });
    body.appendChild(bebidaSelect);

    // ── Sabores (auto desde la presentación seleccionada) ──
    const lblSabores = document.createElement('div');
    lblSabores.className = 'combo-modal-section-label';
    lblSabores.style.marginTop = '8px';
    lblSabores.textContent = 'Sabores disponibles';
    body.appendChild(lblSabores);

    const saboresPreview = document.createElement('div');
    saboresPreview.className = 'bebida-sabores-area';
    saboresPreview.style.minHeight = '28px';
    body.appendChild(saboresPreview);

    const renderSaboresPreview = () => {
        saboresPreview.innerHTML = '';
        const sel = bebidaSelect.options[bebidaSelect.selectedIndex];
        const saboresList = sel?.dataset?.sabores ? JSON.parse(sel.dataset.sabores) : [];
        sabores = saboresList;
        if (!saboresList.length) {
            const empty = document.createElement('span');
            empty.style.cssText = 'font-size:0.75rem;color:rgba(180,200,230,0.4);';
            empty.textContent = 'Sin sabores registrados';
            saboresPreview.appendChild(empty);
            return;
        }
        saboresList.forEach((s) => {
            const chip = document.createElement('span');
            chip.className = 'bebida-sabor-chip';
            chip.style.cursor = 'default';
            chip.textContent = s;
            saboresPreview.appendChild(chip);
        });
    };
    renderSaboresPreview();
    bebidaSelect.addEventListener('change', renderSaboresPreview);

    // ── Valor ──
    const lblValor = document.createElement('div');
    lblValor.className = 'combo-modal-section-label';
    lblValor.style.marginTop = '10px';
    lblValor.textContent = 'Valor del combo';
    const valorInput = document.createElement('input');
    valorInput.type = 'number';
    valorInput.className = 'acomp-form-input';
    valorInput.placeholder = 'Precio';
    valorInput.min = '0';
    valorInput.step = '100';
    valorInput.value = combo?.valor || '';
    valorInput.style.textAlign = 'right';
    body.appendChild(lblValor);
    body.appendChild(valorInput);

    // ── Visibilidad ──
    const lblVis = document.createElement('div');
    lblVis.className = 'combo-modal-section-label';
    lblVis.style.marginTop = '10px';
    lblVis.textContent = 'Visibilidad';
    body.appendChild(lblVis);

    const visRow = document.createElement('div');
    visRow.className = 'acomp-form-vis-row';
    const makeTgl = (text, checked) => {
        const wrap = document.createElement('label');
        wrap.className = 'acomp-form-tgl';
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = checked;
        const span = document.createElement('span');
        span.textContent = text;
        wrap.appendChild(cb);
        wrap.appendChild(span);
        return { wrap, cb };
    };
    const { wrap: posWrap, cb: posCb } = makeTgl('Activar en POS', combo ? combo.activo_pos : true);
    const { wrap: menuWrap, cb: menuCb } = makeTgl('Activar en Menú', combo ? combo.activo_menu : true);
    visRow.appendChild(posWrap);
    visRow.appendChild(menuWrap);
    body.appendChild(visRow);

    const feedback = document.createElement('div');
    feedback.className = 'modal-feedback';
    body.appendChild(feedback);

    // ── Footer ──
    const footer = document.createElement('div');
    footer.className = 'combo-modal-footer';

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'combo-modal-cancel-btn';
    cancelBtn.textContent = 'Cancelar';
    cancelBtn.addEventListener('click', () => overlay.remove());

    const saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.className = 'combo-modal-confirm-btn';
    saveBtn.textContent = isEdit ? 'Guardar cambios' : 'Crear combo';
    saveBtn.addEventListener('click', async () => {
        const nombre = nombreInput.value.trim();
        if (!nombre) { showModalFeedback(feedback, 'Escribe el nombre del combo.', 'error'); return; }

        saveBtn.disabled = true;
        saveBtn.textContent = isEdit ? 'Guardando...' : 'Creando...';

        const selOpt = bebidaSelect.options[bebidaSelect.selectedIndex];
        const [bebRefId = '', bebPresId = ''] = (bebidaSelect.value || '').split('::');
        const bebidaNombre = selOpt?.value ? selOpt.textContent.split('  ')[0].trim() : '';
        const payload = {
            nombre,
            papas: papasInput.value.trim(),
            bebida_ref_id: bebRefId,
            bebida_pres_id: bebPresId,
            bebida_nombre: bebidaNombre,
            bebida_sabores: sabores,
            valor: Number(valorInput.value) || 0,
            activo_pos: posCb.checked,
            activo_menu: menuCb.checked,
            estado: combo?.estado || 'active',
            updated_at: firestoreNow()
        };

        try {
            if (isEdit) {
                await firebaseDb.collection('combospacks').doc(combo.id).update(payload);
            } else {
                payload.orden = combosPackState.length;
                payload.created_at = firestoreNow();
                await firebaseDb.collection('combospacks').add(payload);
            }
            await reloadDataAndRender();
            overlay.remove();
            showNotice(isEdit ? 'Combo actualizado.' : 'Combo creado.', 'ok');
        } catch (e) {
            showModalFeedback(feedback, `Error: ${e.message || 'No se pudo guardar.'}`, 'error');
            saveBtn.disabled = false;
            saveBtn.textContent = isEdit ? 'Guardar cambios' : 'Crear combo';
        }
    });

    footer.appendChild(cancelBtn);
    footer.appendChild(saveBtn);
    card.appendChild(header);
    card.appendChild(body);
    card.appendChild(footer);
    overlay.appendChild(card);
    _bindOverlayClose(overlay, () => overlay.remove());
    document.body.appendChild(overlay);
    setTimeout(() => nombreInput.focus(), 80);
}

function openBebidaModal(bebida = null) {
    const isEdit = !!bebida;
    let presentaciones = isEdit
        ? bebida.presentaciones.map((p) => ({ ...p, sabores: [...(p.sabores || [])] }))
        : [{ id: `p${Date.now()}`, nombre: '', precio: 0, sabores: [] }];

    let _pendingImageFile = null;
    let _resolvedImageUrl = bebida?.image_url || '';

    const overlay = document.createElement('div');
    overlay.className = 'combo-modal-overlay';
    overlay.style.zIndex = '8500';

    const card = document.createElement('div');
    card.className = 'combo-modal-card bebida-form-card';

    const header = document.createElement('div');
    header.className = 'combo-modal-header';
    const htitle = document.createElement('div');
    htitle.innerHTML = `<h4>${isEdit ? 'Editar bebida' : 'Nueva bebida'}</h4>`;
    const closeX = document.createElement('button');
    closeX.type = 'button';
    closeX.className = 'combo-modal-close-x';
    closeX.textContent = '×';
    closeX.addEventListener('click', () => overlay.remove());
    header.appendChild(htitle);
    header.appendChild(closeX);

    const body = document.createElement('div');
    body.className = 'bebida-form-body';

    const marcaLabel = document.createElement('div');
    marcaLabel.className = 'combo-modal-section-label';
    marcaLabel.textContent = 'Marca de bebida';
    const marcaInput = document.createElement('input');
    marcaInput.type = 'text';
    marcaInput.className = 'bebida-form-input';
    marcaInput.placeholder = 'Ej: Coca-Cola, Pony Malta...';
    marcaInput.value = bebida?.marca || '';
    body.appendChild(marcaLabel);
    body.appendChild(marcaInput);

    // ── Imagen: botón de carga (opcional) ──
    const imgLabel = document.createElement('div');
    imgLabel.className = 'combo-modal-section-label';
    imgLabel.style.marginTop = '10px';
    imgLabel.textContent = 'Imagen (opcional)';
    body.appendChild(imgLabel);

    const imgRow = document.createElement('div');
    imgRow.style.cssText = 'display:flex;align-items:center;gap:10px;margin-top:4px;';

    const imgPreview = document.createElement('img');
    imgPreview.style.cssText = 'width:52px;height:52px;object-fit:cover;border-radius:8px;border:1px solid rgba(255,255,255,0.12);display:' + (_resolvedImageUrl ? 'block' : 'none') + ';flex-shrink:0;';
    imgPreview.src = _resolvedImageUrl || '';
    imgPreview.alt = 'preview';
    imgPreview.addEventListener('error', () => { imgPreview.style.display = 'none'; });

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';

    const uploadBtn = document.createElement('button');
    uploadBtn.type = 'button';
    uploadBtn.className = 'ghost-button';
    uploadBtn.style.cssText = 'font-size:0.8rem;padding:6px 12px;';
    uploadBtn.textContent = _resolvedImageUrl ? '📷 Cambiar imagen' : '📷 Cargar imagen';

    const removeImgBtn = document.createElement('button');
    removeImgBtn.type = 'button';
    removeImgBtn.className = 'ghost-button';
    removeImgBtn.style.cssText = 'font-size:0.78rem;padding:4px 8px;color:rgba(255,100,100,0.85);display:' + (_resolvedImageUrl ? 'inline-flex' : 'none') + ';';
    removeImgBtn.textContent = '✕ Quitar';

    fileInput.addEventListener('change', () => {
        const file = fileInput.files[0];
        if (!file) return;
        _pendingImageFile = file;
        const reader = new FileReader();
        reader.onload = () => {
            imgPreview.src = String(reader.result);
            imgPreview.style.display = 'block';
            uploadBtn.textContent = '📷 Cambiar imagen';
            removeImgBtn.style.display = 'inline-flex';
        };
        reader.readAsDataURL(file);
    });

    uploadBtn.addEventListener('click', () => fileInput.click());

    removeImgBtn.addEventListener('click', () => {
        _pendingImageFile = null;
        _resolvedImageUrl = '';
        imgPreview.src = '';
        imgPreview.style.display = 'none';
        uploadBtn.textContent = '📷 Cargar imagen';
        removeImgBtn.style.display = 'none';
        fileInput.value = '';
    });

    imgRow.appendChild(imgPreview);
    imgRow.appendChild(uploadBtn);
    imgRow.appendChild(removeImgBtn);
    imgRow.appendChild(fileInput);
    body.appendChild(imgRow);

    const visRow = document.createElement('div');
    visRow.className = 'bebida-form-vis-row';
    const makeTgl = (label, checked) => {
        const wrap = document.createElement('label');
        wrap.className = 'bebida-form-tgl';
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = checked;
        const txt = document.createElement('span');
        txt.textContent = label;
        wrap.appendChild(cb);
        wrap.appendChild(txt);
        return { wrap, cb };
    };
    const { wrap: catWrap, cb: catCb } = makeTgl('Activar como categoría en el menú', bebida ? bebida.mostrar_categoria : true);
    const { wrap: acompWrap, cb: acompCb } = makeTgl('Activar como acompañante en categorías', bebida ? bebida.mostrar_acompanante : true);
    visRow.appendChild(catWrap);
    visRow.appendChild(acompWrap);
    body.appendChild(visRow);

    const presSecHeader = document.createElement('div');
    presSecHeader.className = 'bebida-form-pres-header';
    const presSecLabel = document.createElement('div');
    presSecLabel.className = 'combo-modal-section-label';
    presSecLabel.style.marginTop = '12px';
    presSecLabel.textContent = 'Presentaciones';
    const addPresBtn = document.createElement('button');
    addPresBtn.type = 'button';
    addPresBtn.className = 'ghost-button';
    addPresBtn.style.cssText = 'font-size:0.78rem;padding:4px 10px;margin-top:12px;';
    addPresBtn.textContent = '+ Presentación';
    presSecHeader.appendChild(presSecLabel);
    presSecHeader.appendChild(addPresBtn);
    body.appendChild(presSecHeader);

    const presColHead = document.createElement('div');
    presColHead.className = 'bebida-pres-col-head';
    presColHead.innerHTML = '<span>Presentación</span><span>Precio</span><span></span>';
    body.appendChild(presColHead);

    const presList = document.createElement('div');
    presList.className = 'bebida-form-pres-list';
    body.appendChild(presList);

    const renderPresRows = () => {
        presList.innerHTML = '';
        presentaciones.forEach((pres, idx) => {
            const row = document.createElement('div');
            row.className = 'bebida-pres-row';

            // ── top: nombre | precio | delete ──
            const rowTop = document.createElement('div');
            rowTop.className = 'bebida-pres-row-top';

            const nInput = document.createElement('input');
            nInput.type = 'text';
            nInput.className = 'bebida-form-input bebida-pres-nombre';
            nInput.placeholder = 'Ej: 250, 400ml, Litro...';
            nInput.value = pres.nombre;
            nInput.addEventListener('input', () => { presentaciones[idx].nombre = nInput.value.trim(); });
            nInput.addEventListener('blur', () => {
                const v = nInput.value.trim();
                if (/^\d+(\.\d+)?$/.test(v)) {
                    nInput.value = v + 'ml';
                    presentaciones[idx].nombre = nInput.value;
                }
            });

            const pInput = document.createElement('input');
            pInput.type = 'number';
            pInput.className = 'bebida-form-input bebida-pres-precio';
            pInput.placeholder = 'Precio';
            pInput.min = '0';
            pInput.step = '100';
            pInput.value = pres.precio || '';
            pInput.addEventListener('input', () => { presentaciones[idx].precio = Number(pInput.value) || 0; });

            const delBtn2 = document.createElement('button');
            delBtn2.type = 'button';
            delBtn2.className = 'bebida-pres-del';
            delBtn2.textContent = '×';
            delBtn2.addEventListener('click', () => {
                if (presentaciones.length === 1) return;
                presentaciones.splice(idx, 1);
                renderPresRows();
            });

            rowTop.appendChild(nInput);
            rowTop.appendChild(pInput);
            rowTop.appendChild(delBtn2);

            // ── sabores: chips individuales + add ──
            const saboresArea = document.createElement('div');
            saboresArea.className = 'bebida-sabores-area';

            const renderSabores = () => {
                saboresArea.innerHTML = '';
                (presentaciones[idx].sabores || []).forEach((sabor, si) => {
                    const chip = document.createElement('span');
                    chip.className = 'bebida-sabor-chip';
                    const chipText = document.createTextNode(sabor);
                    const chipDel = document.createElement('button');
                    chipDel.type = 'button';
                    chipDel.className = 'bebida-sabor-chip-del';
                    chipDel.textContent = '×';
                    chipDel.title = 'Quitar sabor';
                    chipDel.addEventListener('click', () => {
                        presentaciones[idx].sabores.splice(si, 1);
                        renderSabores();
                    });
                    chip.appendChild(chipText);
                    chip.appendChild(chipDel);
                    saboresArea.appendChild(chip);
                });

                const addBtn = document.createElement('button');
                addBtn.type = 'button';
                addBtn.className = 'bebida-add-sabor-btn';
                addBtn.textContent = '+ Sabor';
                addBtn.addEventListener('click', () => {
                    addBtn.style.display = 'none';
                    const inp = document.createElement('input');
                    inp.type = 'text';
                    inp.className = 'bebida-sabor-new-input';
                    inp.placeholder = 'Nombre del sabor';
                    saboresArea.appendChild(inp);
                    inp.focus();
                    const commit = () => {
                        const val = inp.value.trim();
                        if (val) {
                            if (!Array.isArray(presentaciones[idx].sabores)) presentaciones[idx].sabores = [];
                            presentaciones[idx].sabores.push(val);
                        }
                        renderSabores();
                    };
                    inp.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter') { e.preventDefault(); commit(); }
                        if (e.key === 'Escape') renderSabores();
                    });
                    inp.addEventListener('blur', commit);
                });
                saboresArea.appendChild(addBtn);
            };
            renderSabores();

            row.appendChild(rowTop);
            row.appendChild(saboresArea);
            presList.appendChild(row);
        });
    };
    renderPresRows();

    addPresBtn.addEventListener('click', () => {
        presentaciones.push({ id: `p${Date.now()}`, nombre: '', precio: 0, sabores: [] });
        renderPresRows();
    });

    const feedback = document.createElement('div');
    feedback.className = 'modal-feedback';
    feedback.style.marginTop = '8px';
    body.appendChild(feedback);

    const footer = document.createElement('div');
    footer.className = 'combo-modal-footer';
    const cancelBtn2 = document.createElement('button');
    cancelBtn2.type = 'button';
    cancelBtn2.className = 'combo-modal-cancel-btn';
    cancelBtn2.textContent = 'Cancelar';
    cancelBtn2.addEventListener('click', () => overlay.remove());

    const saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.className = 'combo-modal-confirm-btn';
    saveBtn.textContent = isEdit ? 'Guardar cambios' : 'Crear bebida';
    saveBtn.addEventListener('click', async () => {
        const marca = marcaInput.value.trim();
        if (!marca) { showModalFeedback(feedback, 'Escribe la marca de la bebida.', 'error'); return; }
        const validPres = presentaciones.filter((p) => p.nombre);
        if (!validPres.length) { showModalFeedback(feedback, 'Agrega al menos una presentación con nombre.', 'error'); return; }

        saveBtn.disabled = true;
        saveBtn.textContent = isEdit ? 'Guardando...' : 'Creando...';

        let finalImageUrl = _resolvedImageUrl;
        if (_pendingImageFile) {
            try {
                showModalFeedback(feedback, 'Subiendo imagen...', 'info');
                finalImageUrl = await resolveProductImageUpload(_pendingImageFile, marca);
            } catch (imgErr) {
                showModalFeedback(feedback, `Error al subir imagen: ${imgErr.message || 'intenta de nuevo'}`, 'error');
                saveBtn.disabled = false;
                saveBtn.textContent = isEdit ? 'Guardar cambios' : 'Crear bebida';
                return;
            }
        }

        const payload = {
            marca,
            image_url: finalImageUrl,
            presentaciones: validPres,
            mostrar_categoria: catCb.checked,
            mostrar_acompanante: acompCb.checked,
            estado: bebida?.estado || 'active',
            updated_at: firestoreNow()
        };
        try {
            if (isEdit) {
                await firebaseDb.collection('bebidas').doc(bebida.id).update(payload);
            } else {
                payload.orden = bebidasState.length;
                payload.created_at = firestoreNow();
                await firebaseDb.collection('bebidas').add(payload);
            }
            await reloadDataAndRender();
            overlay.remove();
            showNotice(isEdit ? 'Bebida actualizada.' : 'Bebida creada.', 'ok');
        } catch (e) {
            showModalFeedback(feedback, `Error: ${e.message || 'No se pudo guardar.'}`, 'error');
            saveBtn.disabled = false;
            saveBtn.textContent = isEdit ? 'Guardar cambios' : 'Crear bebida';
        }
    });

    footer.appendChild(cancelBtn2);
    footer.appendChild(saveBtn);
    card.appendChild(header);
    card.appendChild(body);
    card.appendChild(footer);
    overlay.appendChild(card);
    _bindOverlayClose(overlay, () => overlay.remove());
    document.body.appendChild(overlay);
    setTimeout(() => marcaInput.focus(), 80);
}

// Modal POS: Marca → Presentación → Sabor
function openComboBeverageModal(productId, productName, productPrice, categoryName) {
    const beverageOptions = getBeverageOptions();
    let selectedBebida = null;
    let selectedPres = null;
    let selectedSabor = null;

    const overlay = document.createElement('div');
    overlay.className = 'combo-modal-overlay';
    const card = document.createElement('div');
    card.className = 'combo-modal-card';

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

    const secLabel = document.createElement('div');
    secLabel.className = 'combo-modal-section-label';
    secLabel.textContent = 'Bebida incluida';

    const bevGrid = document.createElement('div');
    bevGrid.className = 'combo-bev-grid';

    // Paso 2: presentaciones (aparece al seleccionar marca)
    const presRow = document.createElement('div');
    presRow.className = 'combo-sabor-row';
    presRow.style.display = 'none';
    const presLabel = document.createElement('div');
    presLabel.className = 'combo-modal-section-label combo-sabor-label';
    presLabel.textContent = 'Presentación';
    const presChips = document.createElement('div');
    presChips.className = 'combo-sabor-chips';
    presRow.appendChild(presLabel);
    presRow.appendChild(presChips);

    // Paso 3: sabores (aparece al seleccionar presentación con sabores)
    const saborRow = document.createElement('div');
    saborRow.className = 'combo-sabor-row';
    saborRow.style.display = 'none';
    const saborLabel = document.createElement('div');
    saborLabel.className = 'combo-modal-section-label combo-sabor-label';
    saborLabel.textContent = 'Sabor';
    const saborChips = document.createElement('div');
    saborChips.className = 'combo-sabor-chips';
    saborRow.appendChild(saborLabel);
    saborRow.appendChild(saborChips);

    const showSaborRow = (sabores) => {
        selectedSabor = null;
        saborChips.innerHTML = '';
        if (!sabores || !sabores.length) { saborRow.style.display = 'none'; return; }
        sabores.forEach((sabor) => {
            const chip = document.createElement('button');
            chip.type = 'button';
            chip.className = 'combo-sabor-chip';
            chip.textContent = sabor;
            chip.addEventListener('click', () => {
                saborChips.querySelectorAll('.combo-sabor-chip').forEach((c) => c.classList.remove('selected'));
                chip.classList.add('selected');
                selectedSabor = sabor;
                saborLabel.style.color = '';
            });
            saborChips.appendChild(chip);
        });
        saborRow.style.display = '';
    };

    const showPresRow = (bebida) => {
        selectedPres = null;
        selectedSabor = null;
        presChips.innerHTML = '';
        saborRow.style.display = 'none';
        if (!bebida || !bebida.presentaciones.length) { presRow.style.display = 'none'; return; }
        bebida.presentaciones.forEach((pres) => {
            const chip = document.createElement('button');
            chip.type = 'button';
            chip.className = 'combo-sabor-chip';
            chip.textContent = `${pres.nombre} — ${formatMoney(pres.precio)}`;
            chip.addEventListener('click', () => {
                presChips.querySelectorAll('.combo-sabor-chip').forEach((c) => c.classList.remove('selected'));
                chip.classList.add('selected');
                selectedPres = pres;
                presLabel.style.color = '';
                showSaborRow(pres.sabores);
            });
            presChips.appendChild(chip);
        });
        presRow.style.display = '';
    };

    const makeBevCard = (bebida) => {
        const bevCard = document.createElement('div');
        bevCard.className = 'combo-bev-card';
        if (!bebida) {
            const noImg = document.createElement('div');
            noImg.className = 'combo-bev-no-img';
            noImg.textContent = '—';
            const lbl = document.createElement('span');
            lbl.textContent = 'Sin bebida';
            bevCard.appendChild(noImg);
            bevCard.appendChild(lbl);
            bevCard.classList.add('selected');
        } else {
            const img = document.createElement('img');
            img.src = bebida.image_url || 'logo.png';
            img.alt = bebida.marca;
            img.loading = 'lazy';
            img.addEventListener('error', () => { img.src = 'logo.png'; });
            const lbl = document.createElement('span');
            lbl.textContent = bebida.marca;
            bevCard.appendChild(img);
            bevCard.appendChild(lbl);
        }
        bevCard.addEventListener('click', () => {
            bevGrid.querySelectorAll('.combo-bev-card').forEach((c) => c.classList.remove('selected'));
            bevCard.classList.add('selected');
            selectedBebida = bebida;
            selectedPres = null;
            selectedSabor = null;
            showPresRow(bebida);
        });
        return bevCard;
    };

    bevGrid.appendChild(makeBevCard(null));
    beverageOptions.forEach((bev) => bevGrid.appendChild(makeBevCard(bev)));

    const noteRow = document.createElement('div');
    noteRow.className = 'combo-modal-note-row';
    const noteLbl = document.createElement('label');
    noteLbl.className = 'combo-modal-note-label';
    noteLbl.textContent = 'Nota (opcional)';
    const noteInput = document.createElement('input');
    noteInput.type = 'text';
    noteInput.className = 'combo-modal-note-input';
    noteInput.placeholder = 'Ej: sin hielo, con limón...';
    noteRow.appendChild(noteLbl);
    noteRow.appendChild(noteInput);

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
        if (selectedBebida && !selectedPres) {
            presLabel.style.color = '#ff6b6b';
            presChips.classList.add('combo-sabor-shake');
            presChips.addEventListener('animationend', () => presChips.classList.remove('combo-sabor-shake'), { once: true });
            return;
        }
        if (selectedPres && selectedPres.sabores.length > 0 && !selectedSabor) {
            saborLabel.style.color = '#ff6b6b';
            saborChips.classList.add('combo-sabor-shake');
            saborChips.addEventListener('animationend', () => saborChips.classList.remove('combo-sabor-shake'), { once: true });
            return;
        }
        const note = noteInput.value.trim();
        const bevId = selectedBebida ? String(selectedBebida.id || '').trim() : 'none';
        let orderName = selectedBebida ? `${productName} + ${selectedBebida.marca}` : productName;
        if (selectedPres) orderName += ` ${selectedPres.nombre}`;
        if (selectedSabor) orderName += ` (${selectedSabor})`;
        const itemKey = `${String(productId).trim()}::${bevId}`;
        addProductToPosOrder(itemKey, orderName, productPrice, note);
        overlay.remove();
    });

    footer.appendChild(cancelBtn);
    footer.appendChild(confirmBtn);
    card.appendChild(header);
    card.appendChild(secLabel);
    card.appendChild(bevGrid);
    card.appendChild(presRow);
    card.appendChild(saborRow);
    card.appendChild(noteRow);
    card.appendChild(footer);
    overlay.appendChild(card);
    _bindOverlayClose(overlay, () => overlay.remove());
    document.body.appendChild(overlay);
}

function openBurgerClasicasPosModal(productId, productName) {
    const overlay = document.createElement('div');
    overlay.className = 'combo-modal-overlay';

    const card = document.createElement('div');
    card.className = 'combo-modal-card';

    const header = document.createElement('div');
    header.className = 'combo-modal-header';
    const headerText = document.createElement('div');
    headerText.innerHTML = `<h4>${escapeHtml(productName)}</h4><p class="combo-modal-subtitle">Selecciona tamano y cantidad de carne</p>`;
    const closeX = document.createElement('button');
    closeX.type = 'button';
    closeX.className = 'combo-modal-close-x';
    closeX.setAttribute('aria-label', 'Cerrar');
    closeX.textContent = '×';
    closeX.addEventListener('click', () => overlay.remove());
    header.appendChild(headerText);
    header.appendChild(closeX);

    const secLabel = document.createElement('div');
    secLabel.className = 'combo-modal-section-label';
    secLabel.textContent = 'Elige una opcion';

    const optGrid = document.createElement('div');
    optGrid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:4px;';

    const noteRow = document.createElement('div');
    noteRow.className = 'combo-modal-note-row';
    const noteLabel = document.createElement('label');
    noteLabel.className = 'combo-modal-note-label';
    noteLabel.textContent = 'Nota (opcional)';
    const noteInput = document.createElement('input');
    noteInput.type = 'text';
    noteInput.className = 'combo-modal-note-input';
    noteInput.placeholder = 'Ej: sin cebolla, bien tostada...';
    noteRow.appendChild(noteLabel);
    noteRow.appendChild(noteInput);

    POS_BURGER_CLASICAS_OPTIONS.forEach((opt) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.style.cssText = 'padding:12px 8px;border-radius:10px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.07);color:inherit;cursor:pointer;text-align:center;font-size:0.88rem;line-height:1.35;';
        btn.innerHTML = `<strong style="display:block;font-size:0.9rem;">${escapeHtml(opt.label)}</strong><span style="color:var(--admin-accent,#e76f00);font-weight:700;">$${opt.price.toLocaleString('es-CO')}</span>`;
        btn.addEventListener('click', () => {
            const note = noteInput.value.trim();
            const finalId   = `${String(productId).trim()}::${opt.label.replace(/\s+/g, '_')}`;
            const finalName = `${productName} - ${opt.label}`;

            const selCat  = String(posSelectedCategory || '').trim();
            const catData = categoriesState.find((c) => c.name.trim().toUpperCase() === selCat.toUpperCase());
            const catAcompPos  = catData ? catData.acompanantes_pos !== false : false;
            const catBebPos    = catData ? catData.bebidas_pos !== false : false;
            const catCombosPos = catData ? catData.combos_pos !== false : false;
            const hayAcomp  = catAcompPos  && acompanantesState.some((a) => a.estado === 'active' && a.activo_pos);
            const hayBebida = catBebPos    && bebidasState.some((b) => b.estado === 'active' && b.mostrar_acompanante);
            const hayCombos = catCombosPos && combosPackState.some((c) => c.estado !== 'paused' && c.activo_pos !== false);

            overlay.remove();

            if (hayAcomp || hayBebida || hayCombos) {
                openPosUpgradeSheet(finalId, finalName, opt.price);
                const commentInput = document.getElementById('posUpgradeComment');
                if (commentInput && note) commentInput.value = note;
            } else {
                addProductToPosOrder(finalId, finalName, opt.price, note);
            }
        });
        optGrid.appendChild(btn);
    });

    card.appendChild(header);
    card.appendChild(secLabel);
    card.appendChild(optGrid);
    card.appendChild(noteRow);
    overlay.appendChild(card);

    _bindOverlayClose(overlay, () => overlay.remove());
    document.body.appendChild(overlay);
}

function openProductVariantesModal(productId, productName, categoryName, variantes, replaceItemKey = null) {
    let selectedVariante = null;
    let selectedSabores = []; // array de largo cantidad_bebidas, cada slot es null o string

    const overlay = document.createElement('div');
    overlay.className = 'combo-modal-overlay';

    const card = document.createElement('div');
    card.className = 'combo-modal-card';

    // Header
    const header = document.createElement('div');
    header.className = 'combo-modal-header';
    const headerText = document.createElement('div');
    headerText.innerHTML = `<h4>${escapeHtml(productName)}</h4><p class="combo-modal-subtitle">${escapeHtml(categoryName)}</p>`;
    const closeX = document.createElement('button');
    closeX.type = 'button';
    closeX.className = 'combo-modal-close-x';
    closeX.setAttribute('aria-label', 'Cerrar');
    closeX.textContent = '×';
    closeX.addEventListener('click', () => overlay.remove());
    header.appendChild(headerText);
    header.appendChild(closeX);

    // Etiqueta variantes
    const secLabel = document.createElement('div');
    secLabel.className = 'combo-modal-section-label';
    secLabel.textContent = 'Selecciona una opción';

    // Grid de variantes
    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:4px;';

    // Sección sabor (oculta hasta que se elija variante con bebida y sabores)
    const saborSection = document.createElement('div');
    saborSection.hidden = true;
    const saborLabel = document.createElement('div');
    saborLabel.className = 'combo-modal-section-label';
    saborLabel.textContent = 'Sabor de la bebida';
    const saborGrid = document.createElement('div');
    saborGrid.style.cssText = 'display:flex;flex-direction:column;gap:7px;';
    saborSection.appendChild(saborLabel);
    saborSection.appendChild(saborGrid);

    // Nota
    const noteRow = document.createElement('div');
    noteRow.className = 'combo-modal-note-row';
    const noteLabel = document.createElement('label');
    noteLabel.className = 'combo-modal-note-label';
    noteLabel.textContent = 'Nota (opcional)';
    const noteInput = document.createElement('input');
    noteInput.type = 'text';
    noteInput.className = 'combo-modal-note-input';
    noteInput.placeholder = 'Ej: sin papas extras, sin hielo...';
    noteRow.appendChild(noteLabel);
    noteRow.appendChild(noteInput);

    // Botón confirmar
    const confirmBtn = document.createElement('button');
    confirmBtn.type = 'button';
    confirmBtn.className = 'combo-modal-confirm-btn';
    confirmBtn.textContent = 'Selecciona una opción';
    confirmBtn.disabled = true;
    confirmBtn.style.opacity = '0.45';

    // Helper: actualizar estado del botón confirmar
    function refreshConfirm() {
        if (!selectedVariante) { confirmBtn.disabled = true; confirmBtn.style.opacity = '0.45'; return; }
        const sabores = _getVarianteSabores(selectedVariante);
        const needsSabor = sabores.length > 0;
        const filled = selectedSabores.filter((s) => s !== null).length;
        const total = selectedSabores.length;
        const ready = !needsSabor || (total > 0 && filled === total);
        confirmBtn.disabled = !ready;
        confirmBtn.style.opacity = ready ? '1' : '0.45';
        confirmBtn.textContent = ready
            ? `Agregar — $${Number(selectedVariante.precio || 0).toLocaleString('es-CO')}`
            : (total > 1 ? `Selecciona sabores (${filled}/${total})` : 'Selecciona el sabor');
    }

    // Helper: obtener sabores de la bebida de una variante
    function _getVarianteSabores(v) {
        if (!v.con_bebida || !v.bebida_ref_id || !v.bebida_pres_id) return [];
        const beb = bebidasState.find((b) => b.id === v.bebida_ref_id);
        const pres = beb?.presentaciones?.find((p) => p.id === v.bebida_pres_id);
        return pres?.sabores || [];
    }

    // Helper: mostrar/ocultar y poblar sección de sabores (una fila horizontal por bebida)
    function renderSaborSection(v) {
        const sabores = _getVarianteSabores(v);
        saborSection.hidden = !sabores.length;
        saborGrid.innerHTML = '';
        if (!sabores.length) return;
        const cant = Math.max(1, Number(v.cantidad_bebidas) || 1);
        selectedSabores = new Array(cant).fill(null);
        saborGrid.style.cssText = 'display:flex;flex-direction:column;gap:7px;';
        for (let i = 0; i < cant; i++) {
            const row = document.createElement('div');
            row.style.cssText = 'display:flex;align-items:center;gap:7px;';
            if (cant > 1) {
                const lbl = document.createElement('span');
                lbl.style.cssText = 'font-size:0.68rem;color:rgba(200,200,220,0.45);min-width:20px;text-align:right;flex-shrink:0;';
                lbl.textContent = `${i + 1}.`;
                row.appendChild(lbl);
            }
            const chips = document.createElement('div');
            chips.style.cssText = 'display:flex;flex-wrap:wrap;gap:5px;flex:1;';
            const slotIdx = i;
            const slotBtns = [];
            sabores.forEach((s) => {
                const sb = document.createElement('button');
                sb.type = 'button';
                sb.style.cssText = 'padding:7px 11px;border-radius:8px;border:1px solid rgba(255,255,255,0.14);background:rgba(255,255,255,0.07);color:inherit;cursor:pointer;font-size:0.81rem;transition:background 0.15s;white-space:nowrap;';
                sb.textContent = s;
                sb.addEventListener('click', () => {
                    selectedSabores[slotIdx] = s;
                    slotBtns.forEach((b) => { b.style.background = 'rgba(255,255,255,0.07)'; b.style.borderColor = 'rgba(255,255,255,0.14)'; });
                    sb.style.background = 'rgba(231,111,0,0.25)';
                    sb.style.borderColor = 'var(--admin-accent,#e76f00)';
                    refreshConfirm();
                });
                slotBtns.push(sb);
                chips.appendChild(sb);
            });
            row.appendChild(chips);
            saborGrid.appendChild(row);
        }
    }

    // Construir botones de variantes
    const varBtns = [];
    variantes.forEach((v) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.style.cssText = 'padding:12px 8px;border-radius:10px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.07);color:inherit;cursor:pointer;text-align:center;font-size:0.87rem;line-height:1.45;transition:background 0.15s;';
        const bebidaLine = v.con_bebida && v.bebida_nombre
            ? `<span style="display:block;font-size:0.72rem;color:rgba(200,200,220,0.65);margin-top:2px;">🥤 ${escapeHtml(v.bebida_nombre)}${v.cantidad_bebidas > 1 ? ` ×${v.cantidad_bebidas}` : ''}</span>`
            : '';
        btn.innerHTML = `<strong style="display:block;">${escapeHtml(v.nombre || 'Opción')}</strong><span style="color:var(--admin-accent,#e76f00);font-weight:700;">$${Number(v.precio || 0).toLocaleString('es-CO')}</span>${bebidaLine}`;
        btn.addEventListener('click', () => {
            selectedVariante = v;
            selectedSabores = [];
            varBtns.forEach((b) => { b.style.background = 'rgba(255,255,255,0.07)'; b.style.borderColor = 'rgba(255,255,255,0.15)'; });
            btn.style.background = 'rgba(231,111,0,0.25)';
            btn.style.borderColor = 'var(--admin-accent,#e76f00)';
            renderSaborSection(v);
            refreshConfirm();
        });
        varBtns.push(btn);
        grid.appendChild(btn);
    });

    // Footer
    const footer = document.createElement('div');
    footer.className = 'combo-modal-footer';
    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'combo-modal-cancel-btn';
    cancelBtn.textContent = 'Cancelar';
    cancelBtn.addEventListener('click', () => overlay.remove());

    confirmBtn.addEventListener('click', () => {
        if (!selectedVariante) return;
        const note = noteInput.value.trim();
        const saboresDisp = _getVarianteSabores(selectedVariante);
        if (saboresDisp.length > 0 && selectedSabores.some((s) => !s)) return;
        const saboresLabel = selectedSabores.filter(Boolean).length
            ? selectedSabores.filter(Boolean).join(', ')
            : '';
        const cant = Number(selectedVariante.cantidad_bebidas) || 0;
        const bebInfo = selectedVariante.con_bebida && selectedVariante.bebida_nombre
            ? ` + ${selectedVariante.bebida_nombre}${saboresLabel ? ` (${saboresLabel})` : ''}${cant > 1 ? ` ×${cant}` : ''}`
            : '';
        const optLabel = `${selectedVariante.nombre}${bebInfo}${note ? ` | ${note}` : ''}`;
        if (replaceItemKey) {
            internalOrderItems = internalOrderItems.filter(
                (i) => i.itemKey !== replaceItemKey && i.parentKey !== replaceItemKey
            );
        }
        addProductToPosOrder(
            `${String(productId).trim()}::${selectedVariante.id}`,
            productName,
            Number(selectedVariante.precio || 0),
            optLabel
        );
        overlay.remove();
    });

    footer.appendChild(cancelBtn);
    footer.appendChild(confirmBtn);

    card.appendChild(header);
    card.appendChild(secLabel);
    card.appendChild(grid);
    card.appendChild(saborSection);
    card.appendChild(noteRow);
    card.appendChild(footer);
    overlay.appendChild(card);

    _bindOverlayClose(overlay, () => overlay.remove());
    document.body.appendChild(overlay);
}

function openComboConPapasPosModal(productId, productName, categoryName) {
    const normProd = normalizeCategoryKey(productName).replace(/[^a-z0-9]/g, '');
    let prices;
    if (normProd.includes('papuda')) prices = POS_COMBOS_CON_PAPAS_PRICES.comboburgerpapuda;
    else if (normProd.includes('super')) prices = POS_COMBOS_CON_PAPAS_PRICES.comboburgersuper;
    else if (normProd.includes('perro')) prices = POS_COMBOS_CON_PAPAS_PRICES.comboperronormal;
    else prices = POS_COMBOS_CON_PAPAS_PRICES.comboburgernormal;

    let selectedCount = 0;

    const overlay = document.createElement('div');
    overlay.className = 'combo-modal-overlay';

    const card = document.createElement('div');
    card.className = 'combo-modal-card';

    const header = document.createElement('div');
    header.className = 'combo-modal-header';
    const headerText = document.createElement('div');
    headerText.innerHTML = `<h4>${escapeHtml(productName)}</h4><p class="combo-modal-subtitle">${escapeHtml(categoryName)}</p>`;
    const closeX = document.createElement('button');
    closeX.type = 'button';
    closeX.className = 'combo-modal-close-x';
    closeX.setAttribute('aria-label', 'Cerrar');
    closeX.textContent = '×';
    closeX.addEventListener('click', () => overlay.remove());
    header.appendChild(headerText);
    header.appendChild(closeX);

    const secLabel = document.createElement('div');
    secLabel.className = 'combo-modal-section-label';
    secLabel.textContent = 'Para cuantas personas';

    const peopleGrid = document.createElement('div');
    peopleGrid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:4px;';

    const confirmBtn = document.createElement('button');
    confirmBtn.type = 'button';
    confirmBtn.className = 'combo-modal-confirm-btn';
    confirmBtn.textContent = 'Selecciona personas';
    confirmBtn.disabled = true;
    confirmBtn.style.opacity = '0.45';

    const countBtns = [];
    [1, 2, 3, 4].forEach((count) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.style.cssText = 'padding:12px 8px;border-radius:10px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.07);color:inherit;cursor:pointer;text-align:center;font-size:0.88rem;line-height:1.4;transition:background 0.15s;';
        btn.innerHTML = `<strong style="display:block;">${count} PERSONA${count > 1 ? 'S' : ''}</strong><span style="color:var(--admin-accent,#e76f00);font-weight:700;">$${prices[count].toLocaleString('es-CO')}</span>`;
        btn.addEventListener('click', () => {
            selectedCount = count;
            countBtns.forEach((b) => {
                b.style.background = 'rgba(255,255,255,0.07)';
                b.style.borderColor = 'rgba(255,255,255,0.15)';
            });
            btn.style.background = 'rgba(231,111,0,0.25)';
            btn.style.borderColor = 'var(--admin-accent,#e76f00)';
            confirmBtn.disabled = false;
            confirmBtn.style.opacity = '1';
            confirmBtn.textContent = `Agregar — $${prices[count].toLocaleString('es-CO')}`;
        });
        countBtns.push(btn);
        peopleGrid.appendChild(btn);
    });

    const noteRow = document.createElement('div');
    noteRow.className = 'combo-modal-note-row';
    const noteLabel = document.createElement('label');
    noteLabel.className = 'combo-modal-note-label';
    noteLabel.textContent = 'Nota (opcional)';
    const noteInput = document.createElement('input');
    noteInput.type = 'text';
    noteInput.className = 'combo-modal-note-input';
    noteInput.placeholder = 'Ej: sin papas fritas extras, sin hielo...';
    noteRow.appendChild(noteLabel);
    noteRow.appendChild(noteInput);

    const footer = document.createElement('div');
    footer.className = 'combo-modal-footer';
    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'combo-modal-cancel-btn';
    cancelBtn.textContent = 'Cancelar';
    cancelBtn.addEventListener('click', () => overlay.remove());

    confirmBtn.addEventListener('click', () => {
        if (!selectedCount) return;
        const note = noteInput.value.trim();
        const optLabel = `${selectedCount} persona${selectedCount > 1 ? 's' : ''}${note ? ` | ${note}` : ''}`;
        addProductToPosOrder(
            `${String(productId).trim()}::${selectedCount}p`,
            productName,
            prices[selectedCount],
            optLabel
        );
        overlay.remove();
    });

    footer.appendChild(cancelBtn);
    footer.appendChild(confirmBtn);

    card.appendChild(header);
    card.appendChild(secLabel);
    card.appendChild(peopleGrid);
    card.appendChild(noteRow);
    card.appendChild(footer);
    overlay.appendChild(card);

    _bindOverlayClose(overlay, () => overlay.remove());
    document.body.appendChild(overlay);
}

function openPosBebidaModal(productId, productName, productPrice, bebidaConfig, replaceItemKey = null) {
    const beb = bebidasState.find((b) => b.id === bebidaConfig.bebida_ref_id);
    const pres = beb?.presentaciones?.find((p) => p.id === bebidaConfig.bebida_pres_id);
    const saboresDisp = pres?.sabores || [];
    const cant = Math.max(1, Number(bebidaConfig.cantidad) || 1);

    if (!saboresDisp.length) {
        const note = bebidaConfig.bebida_nombre ? `🥤 ${bebidaConfig.bebida_nombre}` : '';
        if (replaceItemKey) internalOrderItems = internalOrderItems.filter(
            (i) => i.itemKey !== replaceItemKey && i.parentKey !== replaceItemKey
        );
        addProductToPosOrder(productId, productName, productPrice, note);
        return;
    }

    let selectedSabores = new Array(cant).fill(null);

    const overlay = document.createElement('div');
    overlay.className = 'combo-modal-overlay';
    const card = document.createElement('div');
    card.className = 'combo-modal-card';

    const header = document.createElement('div');
    header.className = 'combo-modal-header';
    const headerText = document.createElement('div');
    headerText.innerHTML = `<h4>${escapeHtml(productName)}</h4><p class="combo-modal-subtitle">🥤 ${escapeHtml(bebidaConfig.bebida_nombre || 'Bebida incluida')}</p>`;
    const closeX = document.createElement('button');
    closeX.type = 'button';
    closeX.className = 'combo-modal-close-x';
    closeX.setAttribute('aria-label', 'Cerrar');
    closeX.textContent = '×';
    closeX.addEventListener('click', () => overlay.remove());
    header.appendChild(headerText);
    header.appendChild(closeX);

    const saborLabel = document.createElement('div');
    saborLabel.className = 'combo-modal-section-label';
    saborLabel.textContent = cant > 1 ? `Elige ${cant} sabores` : 'Sabor de la bebida';

    const saborGrid = document.createElement('div');
    saborGrid.style.cssText = 'display:flex;flex-direction:column;gap:7px;';

    const confirmBtn = document.createElement('button');
    confirmBtn.type = 'button';
    confirmBtn.className = 'combo-modal-confirm-btn';
    confirmBtn.disabled = true;
    confirmBtn.style.opacity = '0.45';
    confirmBtn.textContent = cant > 1 ? `Selecciona sabores (0/${cant})` : 'Selecciona el sabor';

    function refreshConfirm() {
        const filled = selectedSabores.filter((s) => s !== null).length;
        const ready = filled === cant;
        confirmBtn.disabled = !ready;
        confirmBtn.style.opacity = ready ? '1' : '0.45';
        confirmBtn.textContent = ready
            ? `Agregar — $${Number(productPrice).toLocaleString('es-CO')}`
            : (cant > 1 ? `Selecciona sabores (${filled}/${cant})` : 'Selecciona el sabor');
    }

    for (let i = 0; i < cant; i++) {
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;align-items:center;gap:7px;';
        if (cant > 1) {
            const lbl = document.createElement('span');
            lbl.style.cssText = 'font-size:0.68rem;color:rgba(200,200,220,0.45);min-width:20px;text-align:right;flex-shrink:0;';
            lbl.textContent = `${i + 1}.`;
            row.appendChild(lbl);
        }
        const chips = document.createElement('div');
        chips.style.cssText = 'display:flex;flex-wrap:wrap;gap:5px;flex:1;';
        const slotIdx = i;
        const slotBtns = [];
        saboresDisp.forEach((s) => {
            const sb = document.createElement('button');
            sb.type = 'button';
            sb.style.cssText = 'padding:7px 11px;border-radius:8px;border:1px solid rgba(255,255,255,0.14);background:rgba(255,255,255,0.07);color:inherit;cursor:pointer;font-size:0.81rem;transition:background 0.15s;white-space:nowrap;';
            sb.textContent = s;
            sb.addEventListener('click', () => {
                selectedSabores[slotIdx] = s;
                slotBtns.forEach((b) => { b.style.background = 'rgba(255,255,255,0.07)'; b.style.borderColor = 'rgba(255,255,255,0.14)'; });
                sb.style.background = 'rgba(231,111,0,0.25)';
                sb.style.borderColor = 'var(--admin-accent,#e76f00)';
                refreshConfirm();
            });
            slotBtns.push(sb);
            chips.appendChild(sb);
        });
        row.appendChild(chips);
        saborGrid.appendChild(row);
    }

    confirmBtn.addEventListener('click', () => {
        const saborNote = selectedSabores.filter(Boolean).join(', ');
        const note = `🥤 ${bebidaConfig.bebida_nombre}${saborNote ? ' — ' + saborNote : ''}`;
        overlay.remove();
        if (replaceItemKey) internalOrderItems = internalOrderItems.filter(
            (i) => i.itemKey !== replaceItemKey && i.parentKey !== replaceItemKey
        );
        addProductToPosOrder(productId, productName, productPrice, note);
    });

    card.appendChild(header);
    card.appendChild(saborLabel);
    card.appendChild(saborGrid);
    card.appendChild(confirmBtn);
    overlay.appendChild(card);
    _bindOverlayClose(overlay, () => overlay.remove());
    document.body.appendChild(overlay);
}

function addProductToPosOrder(productId, productName, productPrice, note = '', originalUnitPrice = null, opts = {}) {
    productId = String(productId || '').trim();
    productName = String(productName || 'Producto').trim();
    productPrice = Number(productPrice || 0);
    note = String(note || '').trim();
    originalUnitPrice = originalUnitPrice !== null ? Number(originalUnitPrice) : null;

    if (!productId) return;

    const category = posSelectedCategory || 'Sin categoria';
    const promoLabel = String(opts.promoLabel || '').trim();
    const promo2x1 = opts.promo2x1 === true;
    const initialQuantity = Math.max(1, Number(opts.initialQuantity) || 1);
    const qtyStep = 1;

    // itemKey determinístico por (productId + nota) → ítems con misma nota se fusionan.
    // opts.forcedKey fuerza una clave única (ej. items con combo) para evitar fusión.
    const itemKey = opts.forcedKey || (note ? `${productId}::${note}` : productId);
    const existing = internalOrderItems.find((item) => item.itemKey === itemKey);

    if (existing) {
        existing.quantity = Number(existing.quantity || 0) + qtyStep;
        existing.subtotal = Number(existing.quantity) * existing.unitPrice;
    } else {
        internalOrderItems.push({
            itemKey,
            productId,
            productName,
            categoryName: category,
            quantity: initialQuantity,
            unitPrice: productPrice,
            originalUnitPrice: originalUnitPrice !== null && originalUnitPrice > productPrice ? originalUnitPrice : null,
            subtotal: productPrice * initialQuantity,
            note,
            optionLabel: note || '',
            promoLabel,
            promo2x1,
            parentKey: opts.parentKey || null
        });
    }

    renderPosOrderItems();
    renderPosTotals();
    renderPosBottomBar();
}

function isPosDesktop() {
    return window.innerWidth >= 1024;
}

function renderPosBottomBar() {
    const bottomBar = document.getElementById('posBottomBar');
    const qtyElem = document.getElementById('posBottomQty');
    const scrollArea = document.getElementById('posProductsScroll');

    const totalQty = internalOrderItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

    if (isPosDesktop()) {
        if (bottomBar) bottomBar.hidden = true;
        if (scrollArea) scrollArea.style.paddingBottom = '';
    } else {
        if (bottomBar) bottomBar.hidden = totalQty === 0;
        if (scrollArea) scrollArea.style.paddingBottom = totalQty > 0 ? '106px' : '10px';
    }
    if (qtyElem) qtyElem.textContent = `${totalQty} ${totalQty === 1 ? 'item' : 'items'}`;
}

function _openPosNoteModal(item, itemKey, container) {
    const existing = document.getElementById('posNoteModal');
    if (existing) existing.remove();
    const modal = document.createElement('div');
    modal.id = 'posNoteModal';
    modal.className = 'pos-note-modal-overlay';
    modal.innerHTML = `
        <div class="pos-note-modal-box">
            <p class="pos-note-modal-title">Nota para <strong>${escapeHtml(item.productName)}</strong></p>
            <textarea class="pos-note-modal-input" maxlength="120" placeholder="Ej: sin cebolla, extra picante…">${escapeHtml(item.note || '')}</textarea>
            <div class="pos-note-modal-actions">
                <button type="button" class="pos-note-cancel-btn">Cancelar</button>
                <button type="button" class="pos-note-save-btn">Guardar</button>
            </div>
        </div>`;

    const applyNote = (note) => {
        item.note = note;
        const row = container.querySelector(`.pos-item-row[data-item-key="${itemKey}"]`);
        if (row) {
            const nameEl = row.querySelector('.pos-item-name');
            const commentBtn = row.querySelector('.pos-item-comment-btn');
            let noteSpan = nameEl?.querySelector('.pos-item-note');
            if (note) {
                if (!noteSpan) {
                    noteSpan = document.createElement('span');
                    noteSpan.className = 'pos-item-note';
                    nameEl.appendChild(noteSpan);
                }
                noteSpan.textContent = note;
            } else if (noteSpan) {
                noteSpan.remove();
            }
            if (commentBtn) commentBtn.classList.toggle('has-note', !!note);
        }
        modal.remove();
    };

    modal.querySelector('.pos-note-cancel-btn').addEventListener('click', () => modal.remove());
    modal.querySelector('.pos-note-save-btn').addEventListener('click', () => {
        applyNote(modal.querySelector('.pos-note-modal-input').value.trim());
    });
    modal.querySelector('.pos-note-modal-input').addEventListener('keydown', (e) => {
        if (e.key === 'Escape') modal.remove();
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            applyNote(modal.querySelector('.pos-note-modal-input').value.trim());
        }
    });
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
    document.body.appendChild(modal);
    const ta = modal.querySelector('.pos-note-modal-input');
    ta.focus();
    ta.setSelectionRange(ta.value.length, ta.value.length);
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

    const topItems = internalOrderItems.filter((i) => !i.parentKey);
    const subItemsOf = (key) => internalOrderItems.filter((i) => i.parentKey === key);

    const renderTopItem = (item) => {
        const subtotal = Number(item.subtotal || 0);
        const origUnit = item.originalUnitPrice != null ? Number(item.originalUnitPrice) : null;
        const hasDiscount = origUnit !== null && origUnit > item.unitPrice;
        const origSubtotal = hasDiscount ? origUnit * Number(item.quantity || 1) : null;
        const priceHTML = hasDiscount
            ? `<div class="pos-item-price"><s class="pos-item-orig-price">${formatMoney(origSubtotal)}</s><span class="pos-item-final-price">${subtotal === 0 ? '<span class="pos-item-free">GRATIS</span>' : formatMoney(subtotal)}</span></div>`
            : `<div class="pos-item-price">${formatMoney(subtotal)}</div>`;
        return `<div class="pos-item-row" data-item-key="${escapeHtml(item.itemKey)}">
            <div class="pos-item-name">
                ${escapeHtml(item.productName)}
                ${item.note ? `<span class="pos-item-note">${escapeHtml(item.note)}</span>` : ''}
            </div>
            <div class="pos-item-qty-price">
                <button type="button" class="pos-item-comment-btn${item.note ? ' has-note' : ''}" data-item-key="${escapeHtml(item.itemKey)}" title="Agregar nota">✎</button>
                <div class="pos-item-qty">
                    <button type="button" class="pos-qty-minus" data-item-key="${escapeHtml(item.itemKey)}">−</button>
                    <input type="number" class="pos-qty-input" value="${item.quantity}" data-item-key="${escapeHtml(item.itemKey)}" min="1" />
                    <button type="button" class="pos-qty-plus" data-item-key="${escapeHtml(item.itemKey)}">+</button>
                </div>
                ${priceHTML}
                <button type="button" class="pos-item-remove" data-item-key="${escapeHtml(item.itemKey)}">&times;</button>
            </div>
        </div>`;
    };

    const renderSubItem = (item) => `
        <div class="pos-extra-chip">
            <span class="pos-extra-chip-name">${escapeHtml(item.productName)}</span>
            ${item.unitPrice > 0
                ? `<span class="pos-extra-chip-price">+${formatMoney(item.unitPrice)}</span>`
                : `<span class="pos-extra-chip-incl">incl.</span>`}
            <button type="button" class="pos-item-remove pos-extra-chip-del" data-item-key="${escapeHtml(item.itemKey)}" aria-label="Quitar">&times;</button>
        </div>`;

    const renderGroup = (item) => {
        const subs = subItemsOf(item.itemKey);
        const extrasRow = subs.length
            ? `<div class="pos-extras-chips">${subs.map(renderSubItem).join('')}</div>`
            : '';
        return `<div class="pos-item-group">${renderTopItem(item)}${extrasRow}</div>`;
    };

    itemsContainer.innerHTML = topItems.map(renderGroup).join('');

    if (itemsContainer.dataset.listenerAttached !== 'true') {
        itemsContainer.addEventListener('click', (event) => {
            const commentBtn = event.target.closest('.pos-item-comment-btn');
            if (commentBtn) {
                const key = commentBtn.dataset.itemKey;
                const item = internalOrderItems.find((i) => i.itemKey === key);
                if (item) {
                    const baseProductId = String(item.productId || '').split('::')[0];
                    const prod = productsState.find((p) => p.id === baseProductId);
                    if (prod && Array.isArray(prod.variantes) && prod.variantes.length > 0) {
                        openProductVariantesModal(baseProductId, item.productName, item.categoryName, prod.variantes, key);
                    } else if (prod?.bebida_incluida?.activo && prod.bebida_incluida.bebida_ref_id) {
                        openPosBebidaModal(baseProductId, item.productName, item.unitPrice, prod.bebida_incluida, key);
                    } else {
                        const _editCat = String(item.categoryName || '').trim();
                        const _catD = categoriesState.find((c) => c.name.trim().toUpperCase() === _editCat.toUpperCase());
                        const _hayA = _catD && _catD.acompanantes_pos !== false && acompanantesState.some((a) => a.estado === 'active' && a.activo_pos);
                        const _hayB = _catD && _catD.bebidas_pos !== false && bebidasState.some((b) => b.estado === 'active' && b.mostrar_acompanante);
                        const _hayC = _catD && _catD.combos_pos !== false && combosPackState.some((c) => c.estado !== 'paused' && c.activo_pos !== false);
                        if (_hayA || _hayB || _hayC) {
                            const _prevNote = item.note || '';
                            const _prevExtras = internalOrderItems
                                .filter((i) => i.parentKey === key)
                                .map((i) => ({ id: i.productId, name: i.productName, price: i.unitPrice }));
                            // Si tiene más de 1 unidad SIN extras propios, solo quitar 1 (el resto queda en carrito)
                            if (item.quantity > 1 && !_prevExtras.length) {
                                item.quantity -= 1;
                                item.subtotal = item.quantity * item.unitPrice;
                            } else {
                                internalOrderItems = internalOrderItems.filter((i) => i.itemKey !== key && i.parentKey !== key);
                            }
                            renderPosOrderItems();
                            renderPosTotals();
                            posSelectedCategory = _editCat;
                            openPosUpgradeSheet(item.productId, item.productName, item.unitPrice);
                            if (_prevExtras.length && _posUpgradePending) {
                                _posUpgradePending.extras = _prevExtras;
                                renderPosUpgradeStep1();
                            }
                            const _ci = document.getElementById('posUpgradeComment');
                            if (_ci && _prevNote) _ci.value = _prevNote;
                        } else {
                            _openPosNoteModal(item, key, itemsContainer);
                        }
                    }
                }
                return;
            }

            const minusBtn = event.target.closest('.pos-qty-minus');
            const plusBtn = event.target.closest('.pos-qty-plus');
            const removeBtn = event.target.closest('.pos-item-remove');
            const itemKey = (minusBtn || plusBtn || removeBtn)?.dataset.itemKey;
            const item = internalOrderItems.find((i) => i.itemKey === itemKey);

            if (minusBtn && item) {
                if (item.quantity > 1) {
                    item.quantity -= 1;
                    item.subtotal = item.quantity * item.unitPrice;
                    renderPosOrderItems();
                    renderPosTotals();
                    renderPosBottomBar();
                }
                // qty=1 es el mínimo — usar × para eliminar
                return;
            }

            if (plusBtn && item) {
                item.quantity += 1;
                item.subtotal = item.quantity * item.unitPrice;
                renderPosOrderItems();
                renderPosTotals();
                renderPosBottomBar();
                return;
            }

            if (removeBtn && itemKey) {
                // Borrar el ítem y sus hijos si es un padre
                internalOrderItems = internalOrderItems.filter((i) => i.itemKey !== itemKey && i.parentKey !== itemKey);
                renderPosOrderItems();
                renderPosTotals();
                renderPosBottomBar();
            }
        });

        itemsContainer.addEventListener('change', (event) => {
            const input = event.target.closest('.pos-qty-input');
            if (!input) return;
            const itemKey = input.dataset.itemKey;
            const item = internalOrderItems.find((i) => i.itemKey === itemKey);
            let quantity = Math.max(1, Number(input.value || 1));
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
    const subtotalElem     = document.getElementById('posTotalSubtotal');
    const totalElem        = document.getElementById('posTotalFinal');
    const deliveryRow      = document.getElementById('posTotalDeliveryRow');
    const deliveryElem     = document.getElementById('posTotalDelivery');
    const discountInput    = document.getElementById('internalOrderDiscount');
    const cobrarAmount     = document.getElementById('posCobrarAmount');
    const paymentTotal     = document.getElementById('posPaymentTotalDisplay');
    const bottomTotal      = document.getElementById('posBottomTotalAmt');
    const subtotal  = internalOrderItems.reduce((sum, item) => sum + Number(item.subtotal || 0), 0);
    const discount  = Number(discountInput?.value || 0);
    const fee       = (posTicketConfig?.orderType === 'domicilio' && posTicketConfig?.deliveryFee != null)
                        ? Number(posTicketConfig.deliveryFee)
                        : 0;
    const total     = Math.max(0, subtotal - discount + fee);

    if (subtotalElem) subtotalElem.textContent = formatMoney(subtotal);
    if (deliveryRow) deliveryRow.hidden = fee <= 0;
    if (deliveryElem) deliveryElem.textContent = formatMoney(fee);
    if (totalElem) totalElem.textContent = formatMoney(total);
    if (cobrarAmount) cobrarAmount.textContent = formatMoney(total);
    if (paymentTotal) paymentTotal.textContent = formatMoney(total);
    if (bottomTotal) bottomTotal.textContent = formatMoney(total);
}

/* ─── POS v2: Upgrade sheet (acompañamientos) ─── */

function _setPosUpgradeAddBtnState(enabled) {
    const btn = document.getElementById('posUpgradeAddBtn');
    if (!btn) return;
    btn.disabled = !enabled;
    btn.style.opacity = enabled ? '1' : '0.45';
    btn.style.cursor = enabled ? '' : 'not-allowed';
}

function openPosUpgradeSheet(productId, productName, productPrice) {
    _posUpgradePending = { productId, productName, productPrice, extras: [], qty: 1 };
    const overlay = document.getElementById('posUpgradeOverlay');
    if (!overlay) return;
    const commentInput = document.getElementById('posUpgradeComment');
    if (commentInput) commentInput.value = '';
    const qtyVal = document.getElementById('posUpgradeQtyVal');
    if (qtyVal) qtyVal.textContent = '1';
    overlay.hidden = false;
    overlay.style.display = 'flex';

    // Botón AGREGAR AL CARRITO
    const addBtn = document.getElementById('posUpgradeAddBtn');
    if (addBtn) {
        addBtn.onclick = () => {
            const { productId: pid, productName: pname, productPrice: pprice, extras, qty = 1 } = _posUpgradePending;
            const comment = String(document.getElementById('posUpgradeComment')?.value || '').trim();
            const ts = Date.now();
            if (extras.length > 0) {
                // Cada unidad necesita su propio item padre con clave única (para vincular extras independientes)
                for (let i = 0; i < qty; i++) {
                    const mainKey = comment ? `${pid}::u${ts}_${i}::${comment}` : `${pid}::u${ts}_${i}`;
                    addProductToPosOrder(pid, pname, pprice, comment || '', null, { forcedKey: mainKey });
                    extras.forEach((e) => addProductToPosOrder(e.id, e.name, e.price, '', null, { parentKey: mainKey }));
                }
            } else {
                // Sin extras: fusión normal (se suman al item existente del mismo producto/nota)
                for (let i = 0; i < qty; i++) {
                    addProductToPosOrder(pid, pname, pprice, comment || '');
                }
            }
            closePosUpgradeSheet();
        };
    }

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
    _setPosUpgradeAddBtnState(true);

    const selectedCategory = String(posSelectedCategory || '').trim();
    const catData = categoriesState.find((c) => c.name.trim().toUpperCase() === selectedCategory.toUpperCase());
    const hayAcomp  = catData && catData.acompanantes_pos !== false && acompanantesState.some((a) => a.estado === 'active' && a.activo_pos);
    const hayBebida = catData && catData.bebidas_pos !== false && bebidasState.some((b) => b.estado === 'active' && b.mostrar_acompanante);

    const extras = _posUpgradePending.extras || [];
    const yaHayCombo  = extras.some((e) => e.id.startsWith('combo-pack-'));
    const yaHayBebida = extras.some((e) => e.id.startsWith('bev-'));

    const extrasHtml = extras.length ? `
        <div class="pus-section-label">Agregado</div>
        <div class="pus-extras-list">
            ${extras.map((e, i) => `
            <div class="pus-extra-row">
                <span class="pus-extra-name">${escapeHtml(e.name)}</span>
                <span class="pus-extra-price">${e.price > 0 ? '+' + formatMoney(e.price) : 'incluido'}</span>
                <button type="button" class="pus-extra-del" data-extra-idx="${i}">×</button>
            </div>`).join('')}
        </div>` : '';

    const catCombosPos = catData ? catData.combos_pos !== false : false;
    const combosDisponibles = catCombosPos ? combosPackState.filter((c) => c.estado !== 'paused' && c.activo_pos !== false) : [];
    const hayComboMenu = combosDisponibles.length > 0;
    const mostrarBebida = hayBebida;

    body.innerHTML = `
        <div class="pus-home-btns">
            ${hayComboMenu  ? `<button type="button" class="pus-cat-btn combo${yaHayCombo ? ' is-change' : ''}" id="pusGoCombo">${yaHayCombo ? '🔄 Cambiar combo' : '🍔 Agregar combo'}</button>` : ''}
            ${hayAcomp      ? `<button type="button" class="pus-cat-btn adicional" id="pusGoAdicional">🥗 Adicionales</button>` : ''}
            ${mostrarBebida ? `<button type="button" class="pus-cat-btn bebida${yaHayBebida ? ' is-change' : ''}" id="pusGoBebida">${yaHayBebida ? '🔄 Cambiar bebida' : '🥤 Solo bebida'}</button>` : ''}
        </div>
        ${extrasHtml}`;

    body.querySelector('#pusGoCombo')?.addEventListener('click', () => {
        if (yaHayCombo) _posUpgradePending.extras = _posUpgradePending.extras.filter((e) => !e.id.startsWith('combo-pack-'));
        _renderPosUpgradeCombosPack(combosDisponibles);
    });
    body.querySelector('#pusGoAdicional')?.addEventListener('click', () => _renderPosUpgradeAdicionales());
    body.querySelector('#pusGoBebida')?.addEventListener('click', () => {
        if (yaHayBebida) _posUpgradePending.extras = _posUpgradePending.extras.filter((e) => !e.id.startsWith('bev-'));
        _renderPosUpgradeBebidas();
    });

    body.querySelectorAll('.pus-extra-del').forEach((btn) => {
        btn.addEventListener('click', () => {
            _posUpgradePending.extras.splice(Number(btn.dataset.extraIdx), 1);
            renderPosUpgradeStep1();
        });
    });
}

// Combos de papas+bebida desde combosPackState (Artículos > COMBOS tab)
function _renderPosUpgradeCombosPack(combos) {
    const body = document.getElementById('posUpgradeBody');
    const titleEl = document.getElementById('posUpgradeTitle');
    if (!body) return;
    _setPosUpgradeAddBtnState(false);
    if (titleEl) titleEl.textContent = 'Agregar Combo';

    if (!combos.length) {
        body.innerHTML = `<p style="color:rgba(255,255,255,0.4);text-align:center;padding:24px;">Sin combos activos configurados</p>
            <button type="button" class="pos-upgrade-back-btn" id="posUpgradeBackBtn">← Volver</button>`;
        body.querySelector('#posUpgradeBackBtn')?.addEventListener('click', renderPosUpgradeStep1);
        return;
    }

    const detalle = (c) => {
        const parts = [];
        if (c.papas)         parts.push(c.papas);
        if (c.bebida_nombre) parts.push(c.bebida_nombre);
        return parts.join(' + ');
    };

    body.innerHTML = `
        <div class="pos-upgrade-options">
            ${combos.map((c) => {
                const precio  = Number(c.valor || 0);
                const nombre  = String(c.nombre || 'Combo');
                const desc    = detalle(c);
                return `<button type="button" class="pos-upgrade-opt" data-pack-id="${c.id}">
                    <div>
                        <div class="pos-upgrade-opt-name">${nombre}</div>
                        ${desc ? `<div class="pos-upgrade-opt-detail">${desc}</div>` : ''}
                    </div>
                    <span class="pos-upgrade-opt-price">${precio > 0 ? '+' + formatMoney(precio) : 'incluido'}</span>
                </button>`;
            }).join('')}
        </div>
        <button type="button" class="pos-upgrade-back-btn" id="posUpgradeBackBtn">← Volver</button>`;

    body.querySelectorAll('.pos-upgrade-opt[data-pack-id]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const c = combos.find((x) => x.id === btn.dataset.packId);
            if (!c) return;
            const sabores = Array.isArray(c.bebida_sabores) ? c.bebida_sabores.filter(Boolean) : [];
            if (sabores.length > 1) {
                _renderPosUpgradePackSabor(c, sabores);
            } else {
                const precio = Number(c.valor || 0);
                const saborSuffix = sabores.length === 1 ? `-${sabores[0]}` : '';
                const nombre = sabores.length === 1
                    ? `${String(c.nombre || 'Combo')} (${sabores[0]})`
                    : String(c.nombre || 'Combo');
                _posUpgradePending.extras.push({ id: `combo-pack-${c.id}${saborSuffix}`, name: nombre, price: precio });
                renderPosUpgradeStep1();
            }
        });
    });
    body.querySelector('#posUpgradeBackBtn')?.addEventListener('click', renderPosUpgradeStep1);
}

function _renderPosUpgradePackSabor(combo, sabores) {
    const body = document.getElementById('posUpgradeBody');
    const titleEl = document.getElementById('posUpgradeTitle');
    if (!body) return;
    _setPosUpgradeAddBtnState(false);
    if (titleEl) titleEl.textContent = 'Elige sabor de bebida';

    body.innerHTML = `
        <div class="pos-upgrade-options">
            ${sabores.map((s) => `
            <button type="button" class="pos-upgrade-opt" data-sabor="${s}">
                <div><div class="pos-upgrade-opt-name">${s}</div></div>
            </button>`).join('')}
        </div>
        <button type="button" class="pos-upgrade-back-btn" id="posUpgradeBackBtn">← Volver</button>`;

    body.querySelectorAll('.pos-upgrade-opt[data-sabor]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const nombre = `${combo.nombre} (${btn.dataset.sabor})`;
            const precio = Number(combo.valor || 0);
            _posUpgradePending.extras.push({ id: `combo-pack-${combo.id}-${btn.dataset.sabor}`, name: nombre, price: precio });
            renderPosUpgradeStep1();
        });
    });
    body.querySelector('#posUpgradeBackBtn')?.addEventListener('click', () => {
        const activos = combosPackState.filter((c) => c.estado !== 'paused' && c.activo_pos !== false);
        _renderPosUpgradeCombosPack(activos);
    });
}

// Flujo Combo legacy (ya no usado, se mantiene por compatibilidad)
function _renderPosUpgradeCombo() {
    const body = document.getElementById('posUpgradeBody');
    const titleEl = document.getElementById('posUpgradeTitle');
    if (!body) return;
    _setPosUpgradeAddBtnState(false);
    if (titleEl) titleEl.textContent = 'Combo — Elige adicional';

    const activos = acompanantesState.filter((a) => a.estado === 'active' && a.activo_pos).sort((a, b) => a.orden - b.orden);

    body.innerHTML = `
        <div class="pos-upgrade-options">
            ${activos.map((a) => `
            <button type="button" class="pos-upgrade-opt" data-acomp-id="${escapeHtml(a.id)}">
                <div>
                    <div class="pos-upgrade-opt-name">${escapeHtml(a.nombre)}</div>
                    ${a.cantidad ? `<div class="pos-upgrade-opt-detail">${escapeHtml(a.cantidad)}</div>` : ''}
                </div>
                <span class="pos-upgrade-opt-price">${a.precio > 0 ? '+' + formatMoney(a.precio) : 'incluido'}</span>
            </button>`).join('')}
        </div>
        <button type="button" class="pos-upgrade-back-btn" id="posUpgradeBackBtn">← Volver</button>`;

    body.querySelectorAll('.pos-upgrade-opt[data-acomp-id]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const acomp = acompanantesState.find((a) => a.id === btn.dataset.acompId);
            if (!acomp) return;
            _posUpgradePending.extras.push({ id: `acomp-${acomp.id}`, name: acomp.nombre, price: acomp.precio });
            // Continuar al paso de bebida
            _renderPosUpgradeCombo_Bebida();
        });
    });
    body.querySelector('#posUpgradeBackBtn')?.addEventListener('click', renderPosUpgradeStep1);
}

function _renderPosUpgradeCombo_Bebida() {
    const body = document.getElementById('posUpgradeBody');
    const titleEl = document.getElementById('posUpgradeTitle');
    if (!body) return;
    _setPosUpgradeAddBtnState(false);
    if (titleEl) titleEl.textContent = 'Combo — Elige bebida';

    const activas = bebidasState.filter((b) => b.estado === 'active' && b.mostrar_acompanante).sort((a, b) => a.orden - b.orden);

    body.innerHTML = `
        <div class="pos-upgrade-options">
            ${activas.map((b) => {
                const min = b.presentaciones.length > 0 ? Math.min(...b.presentaciones.map((p) => p.precio)) : 0;
                const det = b.presentaciones.length > 1 ? `${b.presentaciones.length} presentaciones` : (b.presentaciones[0]?.nombre || '');
                return `<button type="button" class="pos-upgrade-opt" data-bebida-id="${escapeHtml(b.id)}">
                    <div>
                        <div class="pos-upgrade-opt-name">${escapeHtml(b.marca)}</div>
                        ${det ? `<div class="pos-upgrade-opt-detail">${escapeHtml(det)}</div>` : ''}
                    </div>
                    <span class="pos-upgrade-opt-price">${b.presentaciones.length > 0 ? 'desde +' + formatMoney(min) : ''}</span>
                </button>`;
            }).join('')}
        </div>
        <button type="button" class="pos-upgrade-back-btn" id="posUpgradeBackBtn">← Cambiar adicional</button>`;

    body.querySelectorAll('.pos-upgrade-opt[data-bebida-id]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const bev = bebidasState.find((b) => b.id === btn.dataset.bebidaId);
            if (!bev) return;
            if (bev.presentaciones.length === 1 && bev.presentaciones[0].sabores.length === 0) {
                const pres = bev.presentaciones[0];
                _posUpgradePending.extras.push({ id: `bev-${bev.id}-${pres.id}`, name: `${bev.marca} ${pres.nombre}`, price: pres.precio });
                renderPosUpgradeStep1();
            } else {
                _renderPosUpgradeCombo_BebidaPres(bev);
            }
        });
    });
    // Volver = deshacer el acompañante recién agregado y volver al paso 1 del combo
    body.querySelector('#posUpgradeBackBtn')?.addEventListener('click', () => {
        _posUpgradePending.extras.pop();
        _renderPosUpgradeCombo();
    });
}

function _renderPosUpgradeCombo_BebidaPres(bebida) {
    const body = document.getElementById('posUpgradeBody');
    const titleEl = document.getElementById('posUpgradeTitle');
    if (!body) return;
    _setPosUpgradeAddBtnState(false);
    if (titleEl) titleEl.textContent = `Combo — ${escapeHtml(bebida.marca)}`;

    body.innerHTML = `
        <div class="pos-upgrade-options">
            ${bebida.presentaciones.map((p) => `
            <button type="button" class="pos-upgrade-opt" data-pres-id="${escapeHtml(p.id)}">
                <div><div class="pos-upgrade-opt-name">${escapeHtml(p.nombre)}</div></div>
                <span class="pos-upgrade-opt-price">+${formatMoney(p.precio)}</span>
            </button>`).join('')}
        </div>
        <button type="button" class="pos-upgrade-back-btn" id="posUpgradeBackBtn">← Volver</button>`;

    body.querySelectorAll('.pos-upgrade-opt[data-pres-id]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const pres = bebida.presentaciones.find((p) => p.id === btn.dataset.presId);
            if (!pres) return;
            if (pres.sabores.length > 0) {
                _renderPosUpgradeCombo_Sabores(bebida, pres);
            } else {
                _posUpgradePending.extras.push({ id: `bev-${bebida.id}-${pres.id}`, name: `${bebida.marca} ${pres.nombre}`, price: pres.precio });
                renderPosUpgradeStep1();
            }
        });
    });
    body.querySelector('#posUpgradeBackBtn')?.addEventListener('click', () => _renderPosUpgradeCombo_Bebida());
}

function _renderPosUpgradeCombo_Sabores(bebida, presentacion) {
    const body = document.getElementById('posUpgradeBody');
    const titleEl = document.getElementById('posUpgradeTitle');
    if (!body) return;
    _setPosUpgradeAddBtnState(false);
    if (titleEl) titleEl.textContent = `Combo — ${escapeHtml(bebida.marca)} sabor`;

    body.innerHTML = `
        <div class="pos-flavors-grid">
            ${presentacion.sabores.map((s) => `
            <button type="button" class="pos-flavor-btn" data-sabor="${escapeHtml(s)}">${escapeHtml(s)}</button>`).join('')}
        </div>
        <button type="button" class="pos-upgrade-back-btn" id="posUpgradeBackBtn">← Volver</button>`;

    body.querySelectorAll('.pos-flavor-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            const name = `${bebida.marca} ${presentacion.nombre} (${btn.dataset.sabor})`;
            _posUpgradePending.extras.push({ id: `bev-${bebida.id}-${presentacion.id}`, name, price: presentacion.precio });
            renderPosUpgradeStep1();
        });
    });
    body.querySelector('#posUpgradeBackBtn')?.addEventListener('click', () => _renderPosUpgradeCombo_BebidaPres(bebida));
}

function _renderPosUpgradeAdicionales(onBack = renderPosUpgradeStep1) {
    const body = document.getElementById('posUpgradeBody');
    const titleEl = document.getElementById('posUpgradeTitle');
    if (!body) return;
    _setPosUpgradeAddBtnState(false);
    if (titleEl) titleEl.textContent = 'Adicionales';

    const activos = acompanantesState.filter((a) => a.estado === 'active' && a.activo_pos).sort((a, b) => a.orden - b.orden);

    body.innerHTML = `
        <div class="pos-upgrade-options">
            ${activos.map((a) => `
            <button type="button" class="pos-upgrade-opt" data-acomp-id="${escapeHtml(a.id)}">
                <div>
                    <div class="pos-upgrade-opt-name">${escapeHtml(a.nombre)}</div>
                    ${a.cantidad ? `<div class="pos-upgrade-opt-detail">${escapeHtml(a.cantidad)}</div>` : ''}
                </div>
                <span class="pos-upgrade-opt-price">${a.precio > 0 ? '+' + formatMoney(a.precio) : 'incluido'}</span>
            </button>`).join('')}
        </div>
        <button type="button" class="pos-upgrade-back-btn" id="posUpgradeBackBtn">← Volver</button>`;

    body.querySelectorAll('.pos-upgrade-opt[data-acomp-id]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const acomp = acompanantesState.find((a) => a.id === btn.dataset.acompId);
            if (!acomp) return;
            _posUpgradePending.extras.push({ id: `acomp-${acomp.id}`, name: acomp.nombre, price: acomp.precio });
            onBack();
        });
    });
    body.querySelector('#posUpgradeBackBtn')?.addEventListener('click', onBack);
}

function _renderPosUpgradeBebidas(onBack = renderPosUpgradeStep1) {
    const body = document.getElementById('posUpgradeBody');
    const titleEl = document.getElementById('posUpgradeTitle');
    if (!body) return;
    _setPosUpgradeAddBtnState(false);
    if (titleEl) titleEl.textContent = 'Bebidas';

    const activas = bebidasState.filter((b) => b.estado === 'active' && b.mostrar_acompanante).sort((a, b) => a.orden - b.orden);

    body.innerHTML = `
        <div class="pos-upgrade-options">
            ${activas.map((b) => {
                const min = b.presentaciones.length > 0 ? Math.min(...b.presentaciones.map((p) => p.precio)) : 0;
                const det = b.presentaciones.length > 1 ? `${b.presentaciones.length} presentaciones` : (b.presentaciones[0]?.nombre || '');
                return `<button type="button" class="pos-upgrade-opt" data-bebida-id="${escapeHtml(b.id)}">
                    <div>
                        <div class="pos-upgrade-opt-name">${escapeHtml(b.marca)}</div>
                        ${det ? `<div class="pos-upgrade-opt-detail">${escapeHtml(det)}</div>` : ''}
                    </div>
                    <span class="pos-upgrade-opt-price">${b.presentaciones.length > 0 ? 'desde +' + formatMoney(min) : ''}</span>
                </button>`;
            }).join('')}
        </div>
        <button type="button" class="pos-upgrade-back-btn" id="posUpgradeBackBtn">← Volver</button>`;

    body.querySelectorAll('.pos-upgrade-opt[data-bebida-id]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const bev = bebidasState.find((b) => b.id === btn.dataset.bebidaId);
            if (!bev) return;
            if (bev.presentaciones.length === 1 && bev.presentaciones[0].sabores.length === 0) {
                const pres = bev.presentaciones[0];
                _posUpgradePending.extras.push({ id: `bev-${bev.id}-${pres.id}`, name: `${bev.marca} ${pres.nombre}`, price: pres.precio });
                onBack();
            } else {
                _renderPosUpgradeBebidaPresentaciones(bev, onBack);
            }
        });
    });
    body.querySelector('#posUpgradeBackBtn')?.addEventListener('click', onBack);
}

function _renderPosUpgradeBebidaPresentaciones(bebida, onBack = renderPosUpgradeStep1) {
    const body = document.getElementById('posUpgradeBody');
    const titleEl = document.getElementById('posUpgradeTitle');
    if (!body) return;
    _setPosUpgradeAddBtnState(false);
    if (titleEl) titleEl.textContent = escapeHtml(bebida.marca);

    body.innerHTML = `
        <div class="pos-upgrade-options">
            ${bebida.presentaciones.map((p) => `
            <button type="button" class="pos-upgrade-opt" data-pres-id="${escapeHtml(p.id)}">
                <div><div class="pos-upgrade-opt-name">${escapeHtml(p.nombre)}</div></div>
                <span class="pos-upgrade-opt-price">+${formatMoney(p.precio)}</span>
            </button>`).join('')}
        </div>
        <button type="button" class="pos-upgrade-back-btn" id="posUpgradeBackBtn">← Volver</button>`;

    body.querySelectorAll('.pos-upgrade-opt[data-pres-id]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const pres = bebida.presentaciones.find((p) => p.id === btn.dataset.presId);
            if (!pres) return;
            if (pres.sabores.length > 0) {
                _renderPosUpgradeBebidaSabores(bebida, pres, onBack);
            } else {
                _posUpgradePending.extras.push({ id: `bev-${bebida.id}-${pres.id}`, name: `${bebida.marca} ${pres.nombre}`, price: pres.precio });
                onBack();
            }
        });
    });
    body.querySelector('#posUpgradeBackBtn')?.addEventListener('click', () => _renderPosUpgradeBebidas(onBack));
}

function _renderPosUpgradeBebidaSabores(bebida, presentacion, onBack = renderPosUpgradeStep1) {
    const body = document.getElementById('posUpgradeBody');
    const titleEl = document.getElementById('posUpgradeTitle');
    if (!body) return;
    _setPosUpgradeAddBtnState(false);
    if (titleEl) titleEl.textContent = `${escapeHtml(bebida.marca)} — sabor`;

    body.innerHTML = `
        <div class="pos-flavors-grid">
            ${presentacion.sabores.map((s) => `
            <button type="button" class="pos-flavor-btn" data-sabor="${escapeHtml(s)}">${escapeHtml(s)}</button>`).join('')}
        </div>
        <button type="button" class="pos-upgrade-back-btn" id="posUpgradeBackBtn">← Volver</button>`;

    body.querySelectorAll('.pos-flavor-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            const name = `${bebida.marca} ${presentacion.nombre} (${btn.dataset.sabor})`;
            _posUpgradePending.extras.push({ id: `bev-${bebida.id}-${presentacion.id}`, name, price: presentacion.precio });
            onBack();
        });
    });
    body.querySelector('#posUpgradeBackBtn')?.addEventListener('click', () => _renderPosUpgradeBebidaPresentaciones(bebida, onBack));
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
    // No guardar en Firestore hasta que tenga items (GUARDAR TICKET / ENVIAR TICKET)
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
    // Restaurar metadata del ticket al carrito
    if (ticket.orderType) {
        posTicketConfig = {
            orderType: ticket.orderType,
            mesaNumber: ticket.mesaNumber || null,
            customerName: ticket.customerName || '',
            customerPhone: ticket.customerPhone || '',
            deliveryAddress: ticket.deliveryAddress || '',
            deliveryFee: ticket.deliveryFee !== undefined ? ticket.deliveryFee : null
        };
    } else {
        posTicketConfig = null;
    }
    renderPosCartTicketInfo();
    renderPosOrderItems();
    renderPosTotals();
    renderPosBottomBar();
    showPosScreen('main');
}

function renderPosTicketsBadge() {
    const savedCount = posTickets.filter((t) => t.items?.length > 0).length;
    const badge = document.getElementById('posTicketsCountBadge');
    if (badge) badge.textContent = savedCount;
    const adminBadge = document.getElementById('adminTicketsCountBadge');
    if (adminBadge) {
        adminBadge.textContent = savedCount;
        adminBadge.style.display = savedCount > 0 ? 'inline-block' : 'none';
    }
}

function _refreshTicketActionBar() {
    const bar = document.getElementById('posTicketActionBar');
    const countBadge = document.getElementById('posTicketSelectionCount');
    const changeTypeBtn = document.getElementById('posTicketChangeTypeBtn');
    const n = _posSelectedTicketIds.size;
    if (bar) bar.hidden = n === 0;
    if (countBadge) { countBadge.style.display = n > 0 ? '' : 'none'; countBadge.textContent = n; }
    if (changeTypeBtn) changeTypeBtn.disabled = n !== 1;
}

function _initPosTicketsListDelegation(list) {
    if (list.dataset.delegationReady) return;
    list.dataset.delegationReady = '1';
    list.addEventListener('click', (e) => {
        const item = e.target.closest('.pos-ticket-item[data-ticket-id]');
        if (!item) return;
        const id = item.dataset.ticketId;

        if (e.target.closest('.pos-ticket-check')) {
            e.stopPropagation();
            if (_posSelectedTicketIds.has(id)) {
                _posSelectedTicketIds.delete(id);
                item.classList.remove('selected-ticket');
            } else {
                _posSelectedTicketIds.add(id);
                item.classList.add('selected-ticket');
            }
            _refreshTicketActionBar();
            return;
        }
        if (e.target.closest('.pos-ticket-edit-inline')) {
            e.stopPropagation();
            switchPosTicket(id);
            openPosTicketSetupModal(true);
            return;
        }
        if (e.target.closest('.pos-ticket-send-inline')) {
            e.stopPropagation();
            _posTicketSendInline(id);
            return;
        }
        if (e.target.closest('.pos-ticket-del-inline')) {
            e.stopPropagation();
            _posTicketDeleteInline(id);
            return;
        }
        if (_posSelectedTicketIds.size > 0) {
            if (_posSelectedTicketIds.has(id)) {
                _posSelectedTicketIds.delete(id);
                item.classList.remove('selected-ticket');
            } else {
                _posSelectedTicketIds.add(id);
                item.classList.add('selected-ticket');
            }
            _refreshTicketActionBar();
            return;
        }
        switchPosTicket(id);
    });
}

async function _posTicketSendInline(id) {
    const ticket = posTickets.find((t) => t.id === id);
    if (!ticket) return;
    const current = posTickets.find((t) => t.id === posActiveTicketId);
    if (current) current.items = [...internalOrderItems];
    posActiveTicketId = id;
    internalOrderItems = [...(ticket.items || [])];
    posTicketConfig = ticket.orderType ? {
        orderType: ticket.orderType,
        mesaNumber: ticket.mesaNumber || null,
        customerName: ticket.customerName || '',
        customerPhone: ticket.customerPhone || '',
        deliveryAddress: ticket.deliveryAddress || '',
        deliveryFee: ticket.deliveryFee !== undefined ? ticket.deliveryFee : null
    } : null;
    await saveAdminOrderQuick(posTicketConfig || {});
}

function _posTicketDeleteInline(id) {
    if (!confirm('¿Eliminar este ticket?')) return;
    deletePosTicketFromFirestore(id);
    posTickets = posTickets.filter((t) => t.id !== id);
    _posSelectedTicketIds.delete(id);
    if (!posTickets.find((t) => t.id === posActiveTicketId)) {
        if (posTickets.length) {
            posActiveTicketId = posTickets[0].id;
            internalOrderItems = posTickets[0].items;
            posTicketConfig = null;
        } else {
            createNewPosTicket();
        }
    }
    renderPosTicketsList();
    renderPosTicketsBadge();
    renderPosCartTicketInfo();
    renderPosOrderItems();
    renderPosTotals();
    renderPosBottomBar();
}

function renderPosTicketsList() {
    const list = document.getElementById('posTicketsList');
    if (!list) return;

    _initPosTicketsListDelegation(list);

    const visibleTickets = posTickets.filter((t) => t.items?.length > 0);
    if (!visibleTickets.length) {
        list.innerHTML = '<p style="text-align:center;color:#b8c8e8;padding:32px 16px;font-size:0.95rem;">Sin tickets guardados por el momento</p>';
        _posSelectedTicketIds.clear();
        _refreshTicketActionBar();
        return;
    }

    const typeLabels = { mesa: '&#9632; Mesa', retiro: '&#8599; Recoger', domicilio: '&#8962; Domicilio' };
    const presentIds = new Set(visibleTickets.map((t) => t.id));

    // Eliminar elementos que ya no existen
    Array.from(list.children).forEach((el) => {
        if (el.dataset.ticketId && !presentIds.has(el.dataset.ticketId)) el.remove();
    });

    // Actualizar o crear cada ticket en su posición correcta
    visibleTickets.forEach((ticket, idx) => {
        const subtotal = ticket.items.reduce((sum, item) => sum + Number(item.subtotal || 0), 0);
        const itemCount = ticket.items.reduce((sum, i) => sum + Number(i.quantity || 0), 0);
        const isActive = ticket.id === posActiveTicketId;
        const isSelected = _posSelectedTicketIds.has(ticket.id);
        const typeBadge = ticket.orderType ? `<span class="pos-ticket-type-badge">${typeLabels[ticket.orderType] || ticket.orderType}</span>` : '';
        const classes = ['pos-ticket-item', isActive ? 'active-ticket' : '', isSelected ? 'selected-ticket' : ''].filter(Boolean).join(' ');

        let el = null;
        for (const child of list.children) {
            if (child.dataset?.ticketId === ticket.id) { el = child; break; }
        }

        if (!el) {
            el = document.createElement('div');
            el.dataset.ticketId = ticket.id;
            el.innerHTML = `<div class="pos-ticket-check" data-check-id="${escapeHtml(ticket.id)}">&#10003;</div>
                <div class="pos-ticket-info">
                    <div class="pos-ticket-name">${escapeHtml(ticket.label)}${typeBadge}</div>
                    <div class="pos-ticket-meta">${itemCount} ${itemCount === 1 ? 'item' : 'items'}</div>
                </div>
                <div class="pos-ticket-total">${formatMoney(subtotal)}</div>
                <button type="button" class="pos-ticket-edit-inline" data-edit-ticket-id="${escapeHtml(ticket.id)}" title="Editar tipo de pedido">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                </button>
                <button type="button" class="pos-ticket-send-inline" data-send-ticket-id="${escapeHtml(ticket.id)}" title="Enviar a recepción">Enviar</button>
                <button type="button" class="pos-ticket-del-inline" data-del-ticket-id="${escapeHtml(ticket.id)}" title="Eliminar ticket">🗑</button>`;
            el.className = classes;
            const sibling = list.children[idx];
            if (sibling) list.insertBefore(el, sibling);
            else list.appendChild(el);
        } else {
            // Solo actualizar lo que cambió
            if (el.className !== classes) el.className = classes;
            const nameEl = el.querySelector('.pos-ticket-name');
            if (nameEl) nameEl.innerHTML = escapeHtml(ticket.label) + typeBadge;
            const metaEl = el.querySelector('.pos-ticket-meta');
            if (metaEl) metaEl.textContent = `${itemCount} ${itemCount === 1 ? 'item' : 'items'}`;
            const totalEl = el.querySelector('.pos-ticket-total');
            if (totalEl) totalEl.textContent = formatMoney(subtotal);
            // Corregir posición en el DOM si el orden cambió
            const expectedSibling = list.children[idx];
            if (expectedSibling && expectedSibling !== el) list.insertBefore(el, expectedSibling);
        }
    });

    _refreshTicketActionBar();
}

function showPosScreen(screen) {
    const main = document.getElementById('posScreenMain');
    const payment = document.getElementById('posScreenPayment');
    const tickets = document.getElementById('posScreenTickets');
    const cartDrawer = document.getElementById('posCartDrawer');

    // En escritorio, cuando se muestran los tickets, el main se mantiene en el flujo flex
    // para que el carrito (30% derecho) conserve su posición; los tickets lo cubren como overlay.
    const desktopTickets = isPosDesktop() && screen === 'tickets';
    if (main) {
        const showMain = screen === 'main' || desktopTickets;
        main.hidden = !showMain;
        main.style.display = showMain ? 'flex' : 'none';
    }
    if (payment) { payment.hidden = screen !== 'payment'; payment.style.display = screen === 'payment' ? 'flex' : 'none'; }
    if (tickets) { tickets.hidden = screen !== 'tickets'; tickets.style.display = screen === 'tickets' ? 'flex' : 'none'; }

    if (cartDrawer) {
        if (isPosDesktop() && screen !== 'payment') {
            // En desktop el carrito es un panel fijo siempre visible (main y tickets)
            cartDrawer.hidden = false;
            cartDrawer.style.display = '';
        } else if (!isPosDesktop() && screen !== 'main') {
            cartDrawer.hidden = true;
            cartDrawer.style.display = 'none';
        } else if (screen === 'payment') {
            cartDrawer.hidden = true;
            cartDrawer.style.display = 'none';
        }
    }

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

    const editBtn = document.getElementById('posClientEditBtn');
    if (editBtn && !editBtn.dataset.listenerAttached) {
        editBtn.addEventListener('click', () => {
            if (posSelectedClientData) {
                _posClientEditPending = true;
                openEditClientModal(posSelectedClientData);
            }
        });
        editBtn.dataset.listenerAttached = 'true';
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

    // Restaurar o activar ticket (Firestore es la fuente de verdad via subscribePosTickets)
    if (!posActiveTicketId) {
        if (posTickets.length) {
            const first = posTickets[0];
            posActiveTicketId = first.id;
            internalOrderItems = first.items || [];
        } else {
            createNewPosTicket();
        }
    } else {
        internalOrderItems = posTickets.find((t) => t.id === posActiveTicketId)?.items || internalOrderItems;
    }
    // Reconstruir posTicketConfig desde el ticket activo si es necesario
    const _restoredTicket = posTickets.find((t) => t.id === posActiveTicketId);
    if (_restoredTicket?.orderType && !posTicketConfig) {
        posTicketConfig = {
            orderType: _restoredTicket.orderType,
            mesaNumber: _restoredTicket.mesaNumber || null,
            customerName: _restoredTicket.customerName || '',
            customerPhone: _restoredTicket.customerPhone || '',
            deliveryAddress: _restoredTicket.deliveryAddress || '',
            deliveryFee: _restoredTicket.deliveryFee ?? null
        };
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
    document.body.classList.add('pos-is-open');
    document.body.style.overflow = 'hidden';
}

async function saveAdminOrderQuick(config = {}, opts = {}) {
    if (!internalOrderItems.length) {
        showNotice('Agrega al menos un producto al pedido.', 'error');
        return;
    }
    const _checkTotal = internalOrderItems.reduce((s, i) => s + Number(i.subtotal || 0), 0);
    if (_checkTotal <= 0) {
        showNotice('El total del pedido no puede ser $0. Revisa los precios de los productos.', 'error');
        return;
    }

    const orderType = config.orderType || _editingOrderData?.orderType || 'retiro';
    if (orderType === 'domicilio') {
        const fee = config.deliveryFee ?? _editingOrderData?.deliveryFee;
        if (fee === undefined || fee === null || fee === '' || String(fee).trim() === '') {
            showNotice('Debes asignar un valor de domicilio antes de enviar.', 'error');
            return;
        }
    }

    const isEditing = _editingOrderData !== null;
    const editData = _editingOrderData;

    const saveBtn = document.getElementById('posDrawerSaveBtn');
    const mesaNumber = config.mesaNumber || editData?.mesaNumber || null;
    const defaultName = orderType === 'mesa' && mesaNumber ? `Mesa ${mesaNumber}` : 'Pedido Admin';
    const customerName = String(config.customerName || editData?.customerName || '').trim() || defaultName;
    const customerPhone = String(config.customerPhone || editData?.customerPhone || '').trim();

    try {
        if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Guardando...'; }

        const orderId = isEditing ? editData.id : firebaseDb.collection(ORDERS_COLLECTION).doc().id;
        const orderCode = isEditing ? editData.code : await getNextAdminOrderCode();
        const orderStatus = isEditing ? editData.status : 'pendiente';
        const deliveryFeeVal = config.deliveryFee !== undefined && config.deliveryFee !== null
            ? Number(config.deliveryFee)
            : (editData?.deliveryFee != null ? Number(editData.deliveryFee) : 0);
        const subtotal = internalOrderItems.reduce((sum, item) => sum + Number(item.subtotal || 0), 0);

        const orderDoc = {
            id: orderId,
            code: orderCode,
            customerName,
            customerPhone,
            customerPhoneDigits: normalizePhoneDigits ? normalizePhoneDigits(customerPhone) : customerPhone,
            customerAddress: isEditing ? (editData.deliveryAddress || '') : '',
            deliveryAddress: orderType === 'domicilio'
                ? (config.deliveryAddress || editData?.deliveryAddress || '')
                : '',
            profileAddress: '',
            paymentMethod: editData?.paymentMethod || 'pendiente',
            cashChangeRequired: false,
            cashTenderAmount: null,
            orderType,
            source: 'admin_pos',
            isAdminOrder: true,
            status: orderStatus,
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
                subtotal: Number(item.subtotal || 0),
                ...(item.promoLabel ? { orderOptions: { promoLabel: item.promoLabel } } : {})
            })),
            itemCount: internalOrderItems.length,
            totalItems: internalOrderItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
            subtotal,
            discount: 0,
            deliveryFee: orderType === 'domicilio' ? deliveryFeeVal : null,
            total: orderType === 'domicilio' ? subtotal + deliveryFeeVal : subtotal,
            currency: 'COP',
            summaryMessage: '',
            createdAt: isEditing ? editData.createdAt : firestoreNow(),
            updatedAt: firestoreNow()
        };

        if (mesaNumber) {
            orderDoc.mesaNumber = mesaNumber;
        }

        await firebaseDb.collection(ORDERS_COLLECTION).doc(orderId).set(orderDoc);
        _editingOrderData = null;

        // onSnapshot actualiza ordersState y re-renderiza en ~600 ms
        renderOrders();
        renderSalesSummaries();

        // Eliminar el ticket procesado de Firestore y cerrar POS
        const _processedTicketId = posActiveTicketId;
        _sentToReceptionIds.add(_processedTicketId);
        deletePosTicketFromFirestore(_processedTicketId);
        posTickets = posTickets.filter((t) => t.id !== _processedTicketId);
        closeInternalOrderModal();
        if (isMobileAdminViewport()) {
            const _laneMap = { mesa: 'mesa', domicilio: 'domicilios', retiro: 'recoger' };
            activeMobileOrdersLane = _laneMap[orderType] || 'domicilios';
            applyMobileOrdersLane();
            closeMobileTicketPanel({ clearSelection: true });
        }
        if (isEditing) {
            const editLabel = customerName !== defaultName ? customerName : getOrderTypeLabel({ orderType, mesaNumber });
            showNotice(`Pedido de ${editLabel} modificado.`, 'ok');
            if ('speechSynthesis' in window && typeof window.SpeechSynthesisUtterance === 'function') {
                const u = new window.SpeechSynthesisUtterance(`Pedido de ${editLabel} modificado`);
                u.lang = 'es-CO';
                u.rate = 0.96;
                u.pitch = 1;
                u.volume = 1;
                window.speechSynthesis.cancel();
                window.speechSynthesis.speak(u);
            }
        } else {
            showNotice('Pedido enviado a recepción.', 'ok');
        }

        if (opts.cobrarAfter && !isEditing) {
            setTimeout(() => _triggerTicketCobro(orderDoc), 350);
        }
    } catch (error) {
        showNotice(`Error al guardar: ${error.message || 'error'}`, 'error');
    } finally {
        if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'GUARDAR'; }
    }
}

async function editAdminPosOrder(order) {
    try {
        const posItems = (order.items || []).map((item) => ({
            itemKey: item.itemKey || `${item.productId || 'p'}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            productId: String(item.productId || ''),
            productName: String(item.productName || ''),
            categoryName: String(item.categoryName || ''),
            note: String(item.note || item.optionLabel || ''),
            quantity: Number(item.quantity || 1),
            unitPrice: Number(item.unitPrice || 0),
            originalUnitPrice: item.originalUnitPrice != null ? Number(item.originalUnitPrice) : null,
            subtotal: Number(item.subtotal || 0),
            promoLabel: String(item.orderOptions?.promoLabel || item.promoLabel || ''),
            promo2x1: item.orderOptions?.promo2x1 === true || item.promo2x1 === true
        }));

        _editingOrderData = {
            id: order.id,
            code: order.code,
            status: order.status,
            createdAt: order.createdAt,
            orderType: order.orderType,
            mesaNumber: order.mesaNumber || null,
            customerName: order.customerName || '',
            customerPhone: order.customerPhone || '',
            deliveryAddress: order.deliveryAddress || order.customerAddress || '',
            deliveryFee: order.deliveryFee ?? null,
            paymentMethod: order.paymentMethod || 'pendiente'
        };

        // No pre-set posTicketConfig — setup modal will ask user to confirm/edit
        posTicketConfig = null;

        if (selectedOrderId === order.id) selectedOrderId = null;

        openInternalOrderModal();

        internalOrderItems = posItems;
        const currentTicket = posTickets.find((t) => t.id === posActiveTicketId);
        if (currentTicket) {
            currentTicket.items = posItems;
            currentTicket.label = `Editando #${order.code}`;
            // Store order metadata so setup modal can pre-fill all fields
            currentTicket.orderType = order.orderType;
            currentTicket.mesaNumber = order.mesaNumber || null;
            currentTicket.customerName = order.customerName || '';
            currentTicket.customerPhone = order.customerPhone || '';
            currentTicket.deliveryAddress = order.deliveryAddress || order.customerAddress || '';
            currentTicket.deliveryFee = order.deliveryFee ?? null;
        }
        const labelEl = document.getElementById('posActiveTicketLabel');
        if (labelEl) labelEl.textContent = `Editando #${order.code}`;

        renderPosOrderItems();
        renderPosTotals();
        renderPosBottomBar();

        // Open setup modal immediately so user can see/edit type and customer
        setTimeout(() => openPosTicketSetupModal(true), 120);
    } catch (error) {
        showNotice(`Error al cargar el pedido: ${error.message || 'error'}`, 'error');
    }
}

function closeInternalOrderModal(clearCurrentTicket = false) {
    if (!internalOrderModal) return;

    if (clearCurrentTicket) {
        // Ticket procesado: eliminar de Firestore y activar el siguiente
        const processedId = posActiveTicketId;
        _sentToReceptionIds.add(processedId);
        deletePosTicketFromFirestore(processedId);
        posTickets = posTickets.filter((t) => t.id !== processedId);
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
    } else {
        // Cerrar sin procesar: guardar en Firestore solo si tiene items
        const current = posTickets.find((t) => t.id === posActiveTicketId);
        if (current && internalOrderItems.length > 0) {
            current.items = [...internalOrderItems];
            savePosTicketToFirestore(current);
        }
    }

    // Limpiar estado de sesión (posTickets se mantiene; Firestore es la fuente de verdad)
    posActiveTicketId = null;
    posTicketConfig = null;
    _editingOrderData = null;
    internalOrderItems = [];
    renderPosCartTicketInfo();
    const cartDrawer = document.getElementById('posCartDrawer');
    if (cartDrawer) cartDrawer.hidden = true;
    internalOrderModal.classList.remove('is-open');
    internalOrderModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('pos-is-open');
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
        const orderCode = await getNextAdminOrderCode();
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

        await Promise.all([
            firebaseDb.collection(ORDERS_COLLECTION).doc(orderId).set({
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
                    subtotal: Number(item.subtotal || 0),
                    ...(item.promoLabel ? { orderOptions: { promoLabel: item.promoLabel } } : {})
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
                updatedAt: firestoreNow(),
                paidAt: firestoreNow()
            }),
            firebaseDb.collection(CLIENTS_COLLECTION).doc(clientId).set({
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
            }, { merge: true })
        ]);

        closeInternalOrderModal(true);
        showNotice('Pedido creado correctamente.', 'ok');
        // Actualiza clientes en segundo plano; los pedidos los maneja onSnapshot
        fetchClients().then(() => renderClients()).catch(() => {});
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
    const snapshot = await firebaseDb.collection(MESSAGES_COLLECTION)
        .orderBy('createdAt', 'desc')
        .limit(200)
        .get();
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

    if (categoryCreateModal.contains(document.activeElement)) {
        document.activeElement.blur();
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

function renderProductAcompList(savedAcomp) {
    if (!editProductAcompActivo || !editProductAcompList) return;

    const cfg = menuUpgradesConfig || DEFAULT_UPGRADES_CONFIG;
    const opciones = (cfg.opciones || []).filter((o) => o.id && o.nombre);

    const savedActivo = savedAcomp && savedAcomp.activo === true;
    const savedIds = Array.isArray(savedAcomp && savedAcomp.ids) ? savedAcomp.ids : [];

    editProductAcompActivo.checked = savedActivo;
    editProductAcompList.style.display = savedActivo ? '' : 'none';

    if (opciones.length === 0) {
        editProductAcompList.innerHTML = '<p class="pedit-acomp-empty">No hay acompañantes configurados aún.</p>';
        return;
    }

    editProductAcompList.innerHTML = opciones.map((opt) => {
        const checked = savedIds.includes(opt.id) ? 'checked' : '';
        const precioLabel = opt.precio > 0 ? `+$${Number(opt.precio).toLocaleString('es-CO')}` : 'Incluido';
        const detalle = opt.detalle ? `<span class="pedit-acomp-item-detail">${opt.detalle}</span>` : '';
        return `
            <label class="pedit-acomp-item">
                <input type="checkbox" name="acompId" value="${opt.id}" ${checked}>
                <div class="pedit-acomp-item-body">
                    <span class="pedit-acomp-item-name">${opt.nombre}</span>
                    ${detalle}
                </div>
                <span class="pedit-acomp-item-price">${precioLabel}</span>
            </label>`;
    }).join('');

    editProductAcompActivo.removeEventListener('change', _onAcompToggle);
    editProductAcompActivo.addEventListener('change', _onAcompToggle);
}

function _onAcompToggle() {
    if (editProductAcompList) {
        editProductAcompList.style.display = editProductAcompActivo.checked ? '' : 'none';
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

    // Resetear estado de imagen y mostrar la actual
    _editProductImgUrl      = '';
    _editProductExistingUrl = product.image_url || '';
    if (editProductImageFileInput) editProductImageFileInput.value = '';
    const _epImgEl = document.getElementById('editProductImgPreview');
    if (_epImgEl) {
        _epImgEl.src          = _editProductExistingUrl;
        _epImgEl.style.display = _editProductExistingUrl ? 'block' : 'none';
        _epImgEl.onerror      = () => { _epImgEl.style.display = 'none'; };
    }
    const _epStatusEl = document.getElementById('editProductImgStatus');
    if (_epStatusEl) _epStatusEl.textContent = '';

    renderProductAcompList(product.acompanantes || null);

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

function createCategoryMasterItem(category) {
    const count = productsState.filter((p) => p.categoria === category.name).length;
    const isActive = category.active !== false;
    const div = document.createElement('div');
    div.className = `upgrades-master-item${_selectedCategoryId === category.id ? ' selected' : ''}`;
    div.dataset.categoryId = category.id;
    div.dataset.action = 'select-category';
    div.innerHTML = `
        <span class="upgrades-master-item-name">${category.name}</span>
        <div class="upgrades-master-badges">
            <span class="upgrades-badge${isActive ? '' : ' off'}" title="${count} productos">${count}</span>
        </div>
    `;
    return div;
}

function renderCategories() {
    if (!categoryList) return;
    categoryList.innerHTML = '';

    categoriesState.forEach((category) => {
        categoryList.appendChild(createCategoryMasterItem(category));
    });

    _renderCarouselPanel();

    if (_selectedCategoryId) {
        const still = categoriesState.find((c) => c.id === _selectedCategoryId);
        if (still) {
            _renderCategoryDetailPanel(_selectedCategoryId);
        } else {
            _selectedCategoryId = null;
            if (categoryDetailPanel) categoryDetailPanel.innerHTML = '<div class="upgrades-detail-empty">← Selecciona una categoría</div>';
        }
    } else {
        if (categoryDetailPanel) categoryDetailPanel.innerHTML = '<div class="upgrades-detail-empty">← Selecciona una categoría</div>';
    }

    // Auto-initialize order in Firestore if any category lacks it
    const needsOrder = categoriesState.some((c) => c.order == null);
    if (needsOrder) {
        const batch = firebaseDb.batch();
        categoriesState.forEach((cat, i) => {
            batch.update(firebaseDb.collection('categorias').doc(cat.id), { order: i });
        });
        batch.commit().catch(() => {});
    }

    if (typeof Sortable !== 'undefined') {
        Sortable.create(categoryList, {
            animation: 150,
            ghostClass: 'sortable-ghost',
            chosenClass: 'sortable-chosen',
            draggable: '.upgrades-master-item',
            onEnd: async (evt) => {
                const allItems = Array.from(categoryList.querySelectorAll('.upgrades-master-item'));
                const ordered = allItems.map((el) => categoriesState.find((c) => c.id === el.dataset.categoryId)).filter(Boolean);
                if (!ordered.length) return;
                try {
                    const batch = firebaseDb.batch();
                    ordered.forEach((cat, i) => {
                        batch.update(firebaseDb.collection('categorias').doc(cat.id), { order: i });
                    });
                    await batch.commit();
                    await reloadDataAndRender();
                } catch (err) {
                    showNotice(`Error al reordenar: ${err.message || 'Error inesperado.'}`, 'error');
                }
            }
        });
    }
}

function _renderCarouselPanel() {
    const panel = carruselTabPanel || categoryDetailPanel;
    if (!panel) return;

    // Primera vez: si nada está marcado, activar automáticamente los que están en el carrusel hardcodeado
    const anyMarked = productsState.some((p) => p.es_destacado === true);
    if (!anyMarked) {
        const defaultNames = new Set([
            'combo burger normal', 'combo burger papuda', 'combo burger super', 'combo perro normal',
            'de la casa', 'emparejados', 'familiar 3', 'familiar 4'
        ]);
        const toMark = productsState.filter((p) => defaultNames.has(String(p.nombre || '').trim().toLowerCase()));
        if (toMark.length) {
            const batch = firebaseDb.batch();
            toMark.forEach((p) => batch.update(firebaseDb.collection('productos').doc(p.id), { es_destacado: true, updated_at: firestoreNow() }));
            batch.commit()
                .then(() => reloadDataAndRender())
                .catch((err) => showNotice(`Error activando carrusel: ${err.message || 'Error inesperado.'}`, 'error'));
            panel.innerHTML = '<div class="upgrades-detail-empty" style="padding:24px;text-align:center;font-size:0.85rem;color:var(--admin-muted);">Activando carrusel inicial…</div>';
            return;
        }
    }

    const carouselCount = productsState.filter((p) => p.es_destacado).length;

    // Agrupar por categoría respetando el orden de categoriesState
    const catOrder = categoriesState.map((c) => c.name);
    const grouped = new Map();
    productsState
        .slice()
        .sort((a, b) => {
            const ia = catOrder.indexOf(a.categoria);
            const ib = catOrder.indexOf(b.categoria);
            const catCmp = (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
            if (catCmp !== 0) return catCmp;
            const oa = a.order ?? 9999, ob = b.order ?? 9999;
            if (oa !== ob) return oa - ob;
            return String(a.nombre || '').localeCompare(String(b.nombre || ''), 'es');
        })
        .forEach((p) => {
            const cat = p.categoria || 'Sin categoría';
            if (!grouped.has(cat)) grouped.set(cat, []);
            grouped.get(cat).push(p);
        });

    const groupEntries = Array.from(grouped.entries());

    const currentCarouselTitle = (() => {
        try { return window._adminBrandingSnapshot && window._adminBrandingSnapshot.carousel_title ? window._adminBrandingSnapshot.carousel_title : ''; } catch { return ''; }
    })();

    panel.innerHTML = `
        <div class="upgrades-detail-topbar">
            <span class="upgrades-detail-topbar-title" style="display:flex;align-items:center;gap:8px;"><span>🎠</span> Carrusel del menú digital</span>
            <span style="background:rgba(255,122,26,0.25);color:#ff9a50;padding:4px 12px;border-radius:8px;font-size:0.75rem;font-weight:600;flex-shrink:0;">${carouselCount} activo${carouselCount !== 1 ? 's' : ''}</span>
        </div>
        <div class="upgrades-detail-body" style="padding-top:10px;">
            <div style="background:rgba(255,122,26,0.07);border:1.5px solid rgba(255,122,26,0.22);border-radius:12px;padding:12px 14px;margin-bottom:14px;">
                <p style="font-size:0.72rem;font-weight:700;color:#ff9a50;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 7px;">Título de sección</p>
                <div style="display:flex;gap:8px;align-items:center;">
                    <input id="carouselTitleInput" type="text" value="${currentCarouselTitle.replace(/"/g, '&quot;')}" placeholder="Ej: Combos Futboleros" style="flex:1;background:rgba(0,0,0,0.30);border:1.5px solid rgba(255,122,26,0.30);border-radius:8px;padding:8px 12px;color:#eef4ff;font-size:0.85rem;outline:none;" maxlength="60">
                    <button id="carouselTitleSaveBtn" type="button" style="padding:8px 16px;background:linear-gradient(135deg,#ff7a00,#e84800);border:none;border-radius:8px;color:#fff;font-size:0.78rem;font-weight:700;cursor:pointer;white-space:nowrap;">Guardar</button>
                </div>
                <p style="font-size:0.68rem;color:var(--admin-muted);margin:5px 0 0;">Se muestra encima del carrusel en el menú digital.</p>
            </div>
            <p style="font-size:0.78rem;color:var(--admin-muted);margin:0 0 12px;line-height:1.5;">Activa los productos que aparecerán en el carrusel del menú digital. Los cambios se ven en tiempo real.</p>
            ${groupEntries.length ? `<div style="display:flex;flex-direction:column;gap:7px;">
                ${groupEntries.map(([cat, prods], idx) => {
                    const catActive = prods.filter((p) => p.es_destacado).length;
                    const expanded = catActive > 0;
                    return `<div style="border:1.5px solid rgba(${catActive > 0 ? '255,122,26,0.35' : '255,255,255,0.08'});border-radius:12px;overflow:hidden;">
                        <button type="button" data-action="toggle-group" data-gidx="${idx}" style="width:100%;display:flex;align-items:center;gap:8px;padding:10px 12px;background:rgba(${catActive > 0 ? '255,122,26,0.07' : '0,0,0,0.18'});border:none;cursor:pointer;color:#eef4ff;text-align:left;">
                            <span style="flex:1;font-size:0.82rem;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${cat}</span>
                            ${catActive
                                ? `<span style="background:rgba(255,122,26,0.22);color:#ff9a50;padding:2px 8px;border-radius:6px;font-size:0.68rem;flex-shrink:0;">${catActive} en carrusel</span>`
                                : `<span style="font-size:0.68rem;color:var(--admin-muted);flex-shrink:0;">${prods.length} prod.</span>`}
                            <span data-arrow="${idx}" style="font-size:0.65rem;color:var(--admin-muted);flex-shrink:0;display:inline-block;transform:${expanded ? 'rotate(0deg)' : 'rotate(-90deg)'};">▼</span>
                        </button>
                        <div data-group="${idx}" style="display:${expanded ? 'flex' : 'none'};flex-direction:column;gap:5px;padding:6px 8px 8px;">
                            ${prods.map((p) => {
                                const img = p.image_url || '';
                                const inCarousel = p.es_destacado === true;
                                const isPaused = p.estado === 'paused';
                                return `<div style="display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:9px;border:1.5px solid rgba(${inCarousel ? '255,122,26,0.4' : '255,255,255,0.06'});background:rgba(${inCarousel ? '255,122,26,0.06' : '0,0,0,0.2'});${isPaused ? 'opacity:0.55;' : ''}">
                                    <div style="width:42px;height:42px;border-radius:7px;overflow:hidden;flex-shrink:0;background:rgba(0,0,0,0.4);">
                                        ${img ? `<img src="${img}" alt="${p.nombre}" style="width:100%;height:100%;object-fit:cover;">` : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:1rem;opacity:0.2;">🍔</div>`}
                                    </div>
                                    <div style="flex:1;min-width:0;">
                                        <p style="margin:0;font-size:0.78rem;color:#eef4ff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${p.nombre}</p>
                                        ${isPaused ? `<span style="font-size:0.62rem;color:#ff6b6b;">Pausado · no aparece en carrusel</span>` : ''}
                                    </div>
                                    <label style="display:flex;align-items:center;gap:6px;cursor:pointer;flex-shrink:0;">
                                        <span style="font-size:0.68rem;color:${inCarousel ? '#ff9a50' : 'var(--admin-muted)'};">${inCarousel ? 'Activo' : 'Activar'}</span>
                                        <input type="checkbox" data-action="toggle-carousel" data-product-id="${p.id}" ${inCarousel ? 'checked' : ''} style="width:16px;height:16px;accent-color:#ff7a1a;cursor:pointer;">
                                    </label>
                                </div>`;
                            }).join('')}
                        </div>
                    </div>`;
                }).join('')}
            </div>` : '<p style="font-size:0.8rem;color:var(--admin-muted);">No hay productos en Firestore aún.</p>'}
        </div>
    `;

    // Guardar título del carrusel
    const carouselTitleSaveBtn = panel.querySelector('#carouselTitleSaveBtn');
    if (carouselTitleSaveBtn) {
        carouselTitleSaveBtn.addEventListener('click', async () => {
            const input = panel.querySelector('#carouselTitleInput');
            const value = (input ? input.value.trim() : '') || '';
            carouselTitleSaveBtn.disabled = true;
            carouselTitleSaveBtn.textContent = 'Guardando…';
            try {
                await firebaseDb.collection(CONFIG_COLLECTION).doc(CONFIG_DOC_ID).update({ carousel_title: value, updated_at: firestoreNow() });
                if (window._adminBrandingSnapshot) window._adminBrandingSnapshot.carousel_title = value;
                carouselTitleSaveBtn.textContent = '✓ Guardado';
                setTimeout(() => { carouselTitleSaveBtn.disabled = false; carouselTitleSaveBtn.textContent = 'Guardar'; }, 2000);
            } catch (err) {
                showNotice(`Error al guardar título: ${err.message || 'Error inesperado.'}`, 'error');
                carouselTitleSaveBtn.disabled = false;
                carouselTitleSaveBtn.textContent = 'Guardar';
            }
        });
    }

    // Colapsar / expandir grupo
    panel.querySelectorAll('[data-action="toggle-group"]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const idx = btn.dataset.gidx;
            const body = panel.querySelector(`[data-group="${idx}"]`);
            const arrow = panel.querySelector(`[data-arrow="${idx}"]`);
            if (!body) return;
            const opening = body.style.display === 'none';
            body.style.display = opening ? 'flex' : 'none';
            if (arrow) arrow.style.transform = opening ? 'rotate(0deg)' : 'rotate(-90deg)';
        });
    });

    // Toggle en carrusel
    panel.querySelectorAll('[data-action="toggle-carousel"]').forEach((checkbox) => {
        checkbox.addEventListener('change', async () => {
            const pid = checkbox.dataset.productId;
            const newValue = checkbox.checked;
            try {
                await firebaseDb.collection('productos').doc(pid).update({ es_destacado: newValue, updated_at: firestoreNow() });
                await reloadDataAndRender();
            } catch (err) {
                showNotice(`Error al actualizar carrusel: ${err.message || 'Error inesperado.'}`, 'error');
                checkbox.checked = !newValue;
            }
        });
    });
}

function _cpefRenderBebidaConfig() {
    const container = categoryDetailPanel?.querySelector('#cpefBebidaConfig');
    if (!container) return;
    if (!_cpefBebidaIncluida.activo) { container.innerHTML = ''; return; }
    const bebOpts = bebidasState.flatMap((b) =>
        (b.presentaciones || []).map((p) => `<option value="${b.id}::${p.id}" ${_cpefBebidaIncluida.bebida_ref_id === b.id && _cpefBebidaIncluida.bebida_pres_id === p.id ? 'selected' : ''}>${escapeHtml(b.marca)} — ${escapeHtml(p.nombre)}</option>`)
    ).join('');
    container.innerHTML = `<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:4px;">
        <select id="cpefBebidaSel" style="flex:1;min-width:150px;background:rgba(0,0,0,0.35);color:#eef4ff;border:1px solid rgba(255,255,255,0.15);border-radius:7px;padding:5px 8px;font-size:0.78rem;">
            <option value="">— Selecciona bebida —</option>${bebOpts}
        </select>
        <label style="font-size:0.75rem;color:rgba(200,200,220,0.6);flex-shrink:0;display:flex;align-items:center;gap:4px;">Cant.
            <input type="number" id="cpefBebidaCant" value="${_cpefBebidaIncluida.cantidad || 1}" min="1" max="8"
                style="width:48px;background:rgba(0,0,0,0.35);color:#eef4ff;border:1px solid rgba(255,255,255,0.15);border-radius:7px;padding:4px 6px;font-size:0.78rem;">
        </label>
    </div>`;
    container.querySelector('#cpefBebidaSel').addEventListener('change', (e) => {
        const [refId, presId] = (e.target.value || '').split('::');
        _cpefBebidaIncluida.bebida_ref_id = refId || null;
        _cpefBebidaIncluida.bebida_pres_id = presId || null;
        const beb = bebidasState.find((b) => b.id === refId);
        const pres = beb?.presentaciones?.find((p) => p.id === presId);
        _cpefBebidaIncluida.bebida_nombre = beb && pres ? `${beb.marca} ${pres.nombre}` : '';
    });
    container.querySelector('#cpefBebidaCant').addEventListener('input', (e) => {
        _cpefBebidaIncluida.cantidad = Math.max(1, Number(e.target.value) || 1);
    });
}

function _cpefRenderVariantesList() {
    const list = categoryDetailPanel?.querySelector('#cpefVariantesList');
    if (!list) return;
    list.innerHTML = '';

    if (_cpefVariantes.length === 0) {
        list.innerHTML = '<p style="font-size:0.75rem;color:var(--admin-muted);margin:4px 0 0;">Sin variantes. Usa &quot;+ Agregar&quot;.</p>';
        return;
    }

    _cpefVariantes.forEach((v, idx) => {
        const card = document.createElement('div');
        card.style.cssText = 'background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:10px;margin-bottom:7px;';

        const bebOpts = bebidasState
            .filter((b) => b.estado === 'active')
            .flatMap((b) => (b.presentaciones || []).map((p) => ({
                value: `${b.id}::${p.id}`,
                label: `${b.marca} · ${p.nombre} (+$${Number(p.precio || 0).toLocaleString('es-CO')})`,
                selected: v.bebida_ref_id === b.id && v.bebida_pres_id === p.id
            })));

        const bebSelectOpts = [`<option value="">Selecciona bebida...</option>`,
            ...bebOpts.map((o) => `<option value="${escapeHtml(o.value)}"${o.selected ? ' selected' : ''}>${escapeHtml(o.label)}</option>`)
        ].join('');

        card.innerHTML = `
            <div style="display:flex;gap:7px;align-items:center;margin-bottom:${v.con_bebida ? '8px' : '0'};">
                <input type="text" class="admin-input cpef-var-nombre" value="${escapeHtml(v.nombre || '')}" placeholder="Ej: Para 1 persona" style="flex:1;min-width:0;font-size:0.78rem;padding:6px 10px;">
                <input type="number" class="admin-input cpef-var-precio" value="${v.precio || ''}" min="0" step="1000" placeholder="Precio" style="width:90px;font-size:0.78rem;padding:6px 8px;">
                <label style="display:flex;align-items:center;gap:4px;font-size:0.75rem;color:#eef4ff;white-space:nowrap;cursor:pointer;flex-shrink:0;">
                    <input type="checkbox" class="cpef-var-con-bebida"${v.con_bebida ? ' checked' : ''}> 🥤
                </label>
                <button type="button" class="cpef-var-del" style="background:rgba(180,30,30,0.55);border:none;border-radius:6px;color:#fff;width:24px;height:24px;cursor:pointer;font-size:0.7rem;flex-shrink:0;">✕</button>
            </div>
            ${v.con_bebida ? `
            <div style="display:flex;gap:7px;align-items:center;">
                <select class="admin-input cpef-var-bebida-sel" style="flex:1;min-width:0;font-size:0.78rem;padding:6px 10px;">${bebSelectOpts}</select>
                <label style="display:flex;align-items:center;gap:4px;font-size:0.75rem;color:#eef4ff;white-space:nowrap;flex-shrink:0;">
                    Cant.
                    <input type="number" class="admin-input cpef-var-cant-beb" value="${v.cantidad_bebidas || 1}" min="1" max="20" style="width:52px;font-size:0.78rem;padding:6px 8px;">
                </label>
            </div>` : ''}`;

        card.querySelector('.cpef-var-nombre').addEventListener('input', (e) => {
            _cpefVariantes[idx].nombre = e.target.value;
        });
        card.querySelector('.cpef-var-precio').addEventListener('input', (e) => {
            _cpefVariantes[idx].precio = Number(e.target.value) || 0;
        });
        card.querySelector('.cpef-var-con-bebida').addEventListener('change', (e) => {
            _cpefVariantes[idx].con_bebida = e.target.checked;
            if (!e.target.checked) {
                _cpefVariantes[idx].bebida_ref_id = null;
                _cpefVariantes[idx].bebida_pres_id = null;
                _cpefVariantes[idx].bebida_nombre = '';
                _cpefVariantes[idx].cantidad_bebidas = 0;
            } else {
                _cpefVariantes[idx].cantidad_bebidas = _cpefVariantes[idx].cantidad_bebidas || 1;
            }
            _cpefRenderVariantesList();
        });
        if (v.con_bebida) {
            card.querySelector('.cpef-var-bebida-sel')?.addEventListener('change', (e) => {
                const [refId, presId] = e.target.value.split('::');
                _cpefVariantes[idx].bebida_ref_id = refId || null;
                _cpefVariantes[idx].bebida_pres_id = presId || null;
                const beb = bebidasState.find((b) => b.id === refId);
                const pres = beb?.presentaciones?.find((p) => p.id === presId);
                _cpefVariantes[idx].bebida_nombre = beb && pres ? `${beb.marca} ${pres.nombre}` : '';
            });
            card.querySelector('.cpef-var-cant-beb')?.addEventListener('input', (e) => {
                _cpefVariantes[idx].cantidad_bebidas = Number(e.target.value) || 1;
            });
        }
        card.querySelector('.cpef-var-del').addEventListener('click', () => {
            _cpefVariantes.splice(idx, 1);
            _cpefRenderVariantesList();
        });

        list.appendChild(card);
    });
}

function _renderCategoryDetailPanel(categoryId) {
    if (!categoryDetailPanel) return;
    const category = categoriesState.find((c) => c.id === categoryId);
    if (!category) {
        categoryDetailPanel.innerHTML = '<div class="upgrades-detail-empty">← Selecciona una categoría</div>';
        return;
    }
    const products = productsState
        .filter((p) => p.categoria === category.name)
        .sort((a, b) => {
            const oa = a.order ?? 9999;
            const ob = b.order ?? 9999;
            if (oa !== ob) return oa - ob;
            return String(a.nombre || '').localeCompare(String(b.nombre || ''), 'es');
        });

    // Auto-initialize order in Firestore if any product in this category lacks it
    if (products.some((p) => p.order == null)) {
        const batch = firebaseDb.batch();
        products.forEach((p, i) => {
            batch.update(firebaseDb.collection('productos').doc(p.id), { order: i });
        });
        batch.commit().catch(() => {});
    }
    const isActive = category.active !== false;
    const imageUrl = category.image_url || '';
    const catBebPOS    = category.bebidas_pos       !== false;
    const catBebMenu   = category.bebidas_menu      !== false;
    const catAcoPOS    = category.acompanantes_pos  !== false;
    const catAcoMenu   = category.acompanantes_menu !== false;
    const catComboPOS  = category.combos_pos        !== false;
    const catComboMenu = category.combos_menu       !== false;

    categoryDetailPanel.innerHTML = `
        <div class="upgrades-detail-topbar">
            <span class="upgrades-detail-topbar-title">${category.name}</span>
            <div style="display:flex;gap:8px;align-items:center;flex-shrink:0;">
                <label class="upgrades-toggle-label">
                    <input type="checkbox" id="catDetailActive" ${isActive ? 'checked' : ''}>
                    Activa
                </label>
                <button type="button" class="mini-btn remove" id="catDetailDeleteBtn">Eliminar</button>
            </div>
        </div>
        <div class="upgrades-detail-body">
            <div style="display:flex;gap:8px;align-items:center;margin-bottom:12px;">
                <input type="text" class="admin-input" id="catDetailName" value="${category.name}" placeholder="Nombre categoría" style="flex:1;min-width:0;">
                <button type="button" class="section-action-btn primary" id="catDetailAddProductBtn" style="flex-shrink:0;white-space:nowrap;">+ Agregar</button>
            </div>
            <div class="cat-vis-panel">
                <div class="cat-vis-panel-label">Activar en esta categoría</div>
                <div class="cat-vis-panel-row">
                    <span class="cat-vis-panel-name">🥤 Bebidas</span>
                    <div style="display:flex;gap:5px;">
                        <button type="button" class="cat-vis-btn${catBebPOS ? ' on' : ''}" data-cat-vis="bebidas_pos">POS</button>
                        <button type="button" class="cat-vis-btn${catBebMenu ? ' on' : ''}" data-cat-vis="bebidas_menu">Menú</button>
                    </div>
                </div>
                <div class="cat-vis-panel-row">
                    <span class="cat-vis-panel-name">🥗 Acompañantes</span>
                    <div style="display:flex;gap:5px;">
                        <button type="button" class="cat-vis-btn${catAcoPOS ? ' on' : ''}" data-cat-vis="acompanantes_pos">POS</button>
                        <button type="button" class="cat-vis-btn${catAcoMenu ? ' on' : ''}" data-cat-vis="acompanantes_menu">Menú</button>
                    </div>
                </div>
                <div class="cat-vis-panel-row">
                    <span class="cat-vis-panel-name">🍔 Combos</span>
                    <div style="display:flex;gap:5px;">
                        <button type="button" class="cat-vis-btn${catComboPOS ? ' on' : ''}" data-cat-vis="combos_pos">POS</button>
                        <button type="button" class="cat-vis-btn${catComboMenu ? ' on' : ''}" data-cat-vis="combos_menu">Menú</button>
                    </div>
                </div>
            </div>
            <div class="upgrades-section" style="margin-top:10px;">
                <h4 style="margin:0 0 8px;font-size:0.78rem;color:var(--admin-muted);text-transform:uppercase;letter-spacing:.5px;">Productos (${products.length})</h4>
                ${products.length
                    ? `<div data-drag-grid style="display:grid;grid-template-columns:repeat(auto-fill,minmax(80px,1fr));gap:8px;">
                        ${products.map((p) => {
                            const img = p.image_url || '';
                            const isPaused = p.estado === 'paused';
                            const isEditing = p.id === _editingProductId;
                            return `<div data-drag-product-id="${p.id}" style="border-radius:10px;overflow:hidden;border:1.5px solid rgba(${isEditing ? '255,122,26,0.7' : isPaused ? '255,255,255,0.06' : '255,255,255,0.12'});background:rgba(0,0,0,0.3);opacity:${isPaused && !isEditing ? '0.55' : '1'};position:relative;">
                                <div style="width:100%;aspect-ratio:1;background:rgba(0,0,0,0.4);overflow:hidden;">
                                    ${img ? `<img src="${img}" alt="${p.nombre}" style="width:100%;height:100%;object-fit:cover;pointer-events:none;">` : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:1.4rem;opacity:0.2;pointer-events:none;">🍔</div>`}
                                </div>
                                <button type="button" data-action="edit-product-inline" data-product-id="${p.id}" style="position:absolute;top:4px;right:4px;width:22px;height:22px;border-radius:6px;border:none;background:rgba(0,0,0,0.65);color:#fff;font-size:0.7rem;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;" title="Editar">✏️</button>
                                <button type="button" data-action="delete-product-inline" data-product-id="${p.id}" data-product-name="${p.nombre}" style="position:absolute;top:4px;left:4px;width:22px;height:22px;border-radius:6px;border:none;background:rgba(180,30,30,0.75);color:#fff;font-size:0.75rem;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;" title="Eliminar">✕</button>
                                <div style="padding:4px 5px;">
                                    <p style="margin:0;font-size:0.65rem;color:#eef4ff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${p.nombre}">${p.nombre}</p>
                                    <span style="font-size:0.6rem;color:${isPaused ? '#ff6b6b' : '#4ade80'};">${isPaused ? 'Pausado' : 'Activo'}</span>
                                </div>
                            </div>`;
                        }).join('')}
                    </div>
                    ${_editingProductId && products.find((p) => p.id === _editingProductId) ? (() => {
                        const ep = products.find((p) => p.id === _editingProductId);
                        const eImg = ep.image_url || '';
                        return `<div id="cpefForm" style="margin-top:12px;background:rgba(255,122,26,0.07);border:1.5px solid rgba(255,122,26,0.25);border-radius:12px;padding:14px;">
                            <div style="display:flex;gap:12px;margin-bottom:12px;align-items:flex-start;">
                                <div id="cpefImgPreview" style="width:70px;height:70px;border-radius:10px;overflow:hidden;flex-shrink:0;border:1.5px solid rgba(255,255,255,0.15);background:rgba(0,0,0,0.4);">
                                    ${eImg ? `<img id="cpefImgTag" src="${eImg}" style="width:100%;height:100%;object-fit:cover;">` : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:1.6rem;opacity:0.25;">📷</div>`}
                                </div>
                                <label style="display:inline-flex;align-items:center;gap:6px;padding:7px 12px;border-radius:8px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.14);font-size:0.75rem;color:#eef4ff;cursor:pointer;align-self:center;">
                                    📷 Cargar foto
                                    <input type="file" id="cpefFileInput" accept="image/*" style="display:none;">
                                </label>
                            </div>
                            <div style="display:grid;gap:8px;">
                                <div>
                                    <label style="font-size:0.7rem;color:var(--admin-muted);display:block;margin-bottom:3px;">Nombre *</label>
                                    <input type="text" id="cpefName" class="admin-input" value="${ep.nombre}" required style="width:100%;box-sizing:border-box;">
                                </div>
                                <div>
                                    <label style="font-size:0.7rem;color:var(--admin-muted);display:block;margin-bottom:3px;">Precio</label>
                                    <input type="number" id="cpefPrice" class="admin-input" value="${ep.precio || ''}" placeholder="0" min="0" style="width:100%;box-sizing:border-box;">
                                </div>
                                <div>
                                    <label style="font-size:0.7rem;color:var(--admin-muted);display:block;margin-bottom:3px;">Descripción</label>
                                    <textarea id="cpefDesc" class="admin-input" rows="2" placeholder="Descripción opcional..." style="width:100%;box-sizing:border-box;resize:vertical;">${ep.descripcion || ''}</textarea>
                                </div>
                            </div>
                            <div style="margin-top:10px;">
                                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                                    <label style="font-size:0.7rem;color:var(--admin-muted);text-transform:uppercase;letter-spacing:.4px;">Variantes de precio</label>
                                    <button type="button" id="cpefAddVarianteBtn" style="font-size:0.7rem;padding:3px 10px;border-radius:6px;border:1px solid rgba(255,255,255,0.18);background:rgba(255,255,255,0.07);color:#eef4ff;cursor:pointer;">+ Agregar</button>
                                </div>
                                <div id="cpefVariantesList"></div>
                            </div>
                            <div style="margin-top:10px;">
                                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                                    <label style="font-size:0.7rem;color:var(--admin-muted);text-transform:uppercase;letter-spacing:.4px;">Bebida incluida</label>
                                    <label style="display:flex;align-items:center;gap:5px;font-size:0.75rem;color:#eef4ff;cursor:pointer;">
                                        <input type="checkbox" id="cpefBebidaActiva" ${ep.bebida_incluida?.activo ? 'checked' : ''}> Incluye bebida
                                    </label>
                                </div>
                                <div id="cpefBebidaConfig"></div>
                            </div>
                            <div style="display:flex;gap:16px;margin-top:10px;flex-wrap:wrap;">
                                <label style="display:flex;align-items:center;gap:6px;font-size:0.78rem;color:#eef4ff;cursor:pointer;">
                                    <input type="checkbox" id="cpefActiveMenu" ${ep.estado !== 'paused' ? 'checked' : ''}> Activo en menú
                                </label>
                                <label style="display:flex;align-items:center;gap:6px;font-size:0.78rem;color:#eef4ff;cursor:pointer;">
                                    <input type="checkbox" id="cpefActivePos" ${ep.visible_pos !== false ? 'checked' : ''}> Activo en POS
                                </label>
                            </div>
                            <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;">
                                <button type="button" class="section-save-btn" id="cpefSaveBtn">Guardar</button>
                                <button type="button" class="ghost-button" id="cpefCancelBtn">Cancelar</button>
                            </div>
                        </div>`;
                    })() : ''}`
                    : '<p style="font-size:0.8rem;color:var(--admin-muted);margin:4px 0;">Sin productos aún</p>'}
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px;">
                <button type="button" class="section-save-btn" id="catDetailSaveBtn">Guardar</button>
            </div>
        </div>
    `;

    categoryDetailPanel.querySelector('#catDetailSaveBtn')?.addEventListener('click', () => _saveCategoryFromDetail(categoryId));
    categoryDetailPanel.querySelector('#catDetailAddProductBtn')?.addEventListener('click', () => openProductCreateModal(category.name));
    categoryDetailPanel.querySelector('#catDetailDeleteBtn')?.addEventListener('click', async () => {
        const related = productsState.filter((p) => p.categoria === category.name);
        const msg = related.length
            ? `¿Eliminar "${category.name}" y sus ${related.length} producto(s)? No se puede deshacer.`
            : `¿Eliminar "${category.name}"? No se puede deshacer.`;
        if (!window.confirm(msg)) return;
        try {
            const batch = firebaseDb.batch();
            batch.delete(firebaseDb.collection('categorias').doc(categoryId));
            related.forEach((p) => batch.delete(firebaseDb.collection('productos').doc(p.id)));
            await batch.commit();
            _selectedCategoryId = null;
            categoryDetailPanel.innerHTML = '<div class="upgrades-detail-empty">← Selecciona una categoría</div>';
            await reloadDataAndRender();
            showNotice(related.length ? `Categoría eliminada con ${related.length} producto(s).` : 'Categoría eliminada.', 'ok');
        } catch (e) {
            showNotice(`Error al eliminar: ${e.message || 'Error inesperado.'}`, 'error');
        }
    });

    const dragGrid = categoryDetailPanel.querySelector('[data-drag-grid]');
    if (dragGrid && typeof Sortable !== 'undefined') {
        Sortable.create(dragGrid, {
            animation: 150,
            ghostClass: 'sortable-ghost',
            chosenClass: 'sortable-chosen',
            dragClass: 'sortable-drag',
            onEnd: async (evt) => {
                const { oldIndex, newIndex } = evt;
                if (oldIndex === newIndex) return;
                const ordered = products.slice();
                const [moved] = ordered.splice(oldIndex, 1);
                ordered.splice(newIndex, 0, moved);
                try {
                    const batch = firebaseDb.batch();
                    ordered.forEach((p, i) => {
                        batch.update(firebaseDb.collection('productos').doc(p.id), { order: i });
                    });
                    await batch.commit();
                    await reloadDataAndRender();
                } catch (err) {
                    showNotice(`Error al reordenar: ${err.message || 'Error inesperado.'}`, 'error');
                }
            }
        });
    }

    categoryDetailPanel.querySelectorAll('[data-action="edit-product-inline"]').forEach((btn) => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const pid = btn.dataset.productId;
            _editingProductId = _editingProductId === pid ? null : pid;
            _renderCategoryDetailPanel(categoryId);
        });
    });

    categoryDetailPanel.querySelectorAll('[data-action="delete-product-inline"]').forEach((btn) => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const pid = btn.dataset.productId;
            const pname = btn.dataset.productName || 'este producto';
            if (!window.confirm(`¿Eliminar "${pname}"? No se puede deshacer.`)) return;
            try {
                await firebaseDb.collection('productos').doc(pid).delete();
                if (_editingProductId === pid) _editingProductId = null;
                await reloadDataAndRender();
                showNotice('Producto eliminado.', 'ok');
            } catch (e2) {
                showNotice(`Error al eliminar: ${e2.message || 'Error inesperado.'}`, 'error');
            }
        });
    });

    const cpefFileInput = categoryDetailPanel.querySelector('#cpefFileInput');
    if (cpefFileInput) {
        cpefFileInput.addEventListener('change', () => {
            const file = cpefFileInput.files && cpefFileInput.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => {
                const preview = categoryDetailPanel.querySelector('#cpefImgPreview');
                if (preview) preview.innerHTML = `<img src="${reader.result}" style="width:100%;height:100%;object-fit:cover;">`;
            };
            reader.readAsDataURL(file);
        });
    }

    categoryDetailPanel.querySelector('#cpefSaveBtn')?.addEventListener('click', () => {
        if (_editingProductId) _saveProductInline(_editingProductId, categoryId);
    });

    categoryDetailPanel.querySelector('#cpefCancelBtn')?.addEventListener('click', () => {
        _editingProductId = null;
        _renderCategoryDetailPanel(categoryId);
    });

    // Variantes de producto
    if (_editingProductId) {
        const epV = products.find((p) => p.id === _editingProductId);
        if (epV) {
            _cpefVariantes = (epV.variantes || []).map((v) => ({ ...v }));
            _cpefRenderVariantesList();
            categoryDetailPanel.querySelector('#cpefAddVarianteBtn')?.addEventListener('click', () => {
                _cpefVariantes.push({
                    id: 'v-' + Date.now(),
                    nombre: '',
                    precio: 0,
                    con_bebida: false,
                    bebida_ref_id: null,
                    bebida_pres_id: null,
                    bebida_nombre: '',
                    cantidad_bebidas: 1
                });
                _cpefRenderVariantesList();
            });

            // Bebida incluida
            _cpefBebidaIncluida = epV.bebida_incluida ? { ...epV.bebida_incluida } : { activo: false, bebida_ref_id: null, bebida_pres_id: null, bebida_nombre: '', cantidad: 1 };
            _cpefRenderBebidaConfig();
            categoryDetailPanel.querySelector('#cpefBebidaActiva')?.addEventListener('change', (e) => {
                _cpefBebidaIncluida.activo = e.target.checked;
                _cpefRenderBebidaConfig();
            });
        }
    }

    // Toggles bebidas/acompañantes por categoría
    categoryDetailPanel.querySelectorAll('[data-cat-vis]').forEach((btn) => {
        btn.addEventListener('click', async () => {
            const key = btn.dataset.catVis;
            const current = category[key] !== false;
            const next = !current;
            btn.classList.toggle('on', next);
            try {
                await firebaseDb.collection('categorias').doc(categoryId).update({ [key]: next });
                const cat = categoriesState.find((c) => c.id === categoryId);
                if (cat) cat[key] = next;
                renderPosCategoriesPanel();
            } catch (e) {
                btn.classList.toggle('on', current);
                showNotice('Error al guardar visibilidad.', 'error');
            }
        });
    });
}

async function _saveCategoryFromDetail(categoryId) {
    const nameInput = document.getElementById('catDetailName');
    const activeInput = document.getElementById('catDetailActive');
    const newName = nameInput ? nameInput.value.trim() : '';
    if (!newName) { showNotice('El nombre no puede estar vacío.', 'error'); return; }
    try {
        const existing = categoriesState.find((c) => c.id === categoryId);
        await firebaseDb.collection('categorias').doc(categoryId).update({
            name: newName,
            image_url: existing ? (existing.image_url || '') : '',
            active: activeInput ? activeInput.checked : true,
            updated_at: firestoreNow()
        });
        _selectedCategoryId = null;
        await reloadDataAndRender();
        showNotice('Categoría guardada.', 'ok');
    } catch (e) {
        showNotice(`Error al guardar: ${e.message || 'Error inesperado.'}`, 'error');
    }
}

function _buildCatAcompHtml(category) {
    const cfg = menuUpgradesConfig || DEFAULT_UPGRADES_CONFIG;
    const opciones = (cfg.opciones || []).filter((o) => o.id && o.nombre);
    if (opciones.length === 0) return '';

    const catName = category.name || '';
    const aplica = (cfg.categorias_aplica || []).map((c) => c.toUpperCase());
    const isActive = aplica.includes(catName.toUpperCase());
    const catIdsMap = cfg.categorias_ids || {};
    const savedIds = catIdsMap[catName] || catIdsMap[catName.toUpperCase()] || [];

    const items = opciones.map((opt) => {
        const checked = isActive && (savedIds.length === 0 || savedIds.includes(opt.id)) ? 'checked' : '';
        const precioLabel = opt.precio > 0 ? `+$${Number(opt.precio).toLocaleString('es-CO')}` : 'Incluido';
        const detalle = opt.detalle ? `<span style="font-size:0.72rem;color:rgba(200,210,230,0.5);margin-top:1px;display:block;">${escapeHtml(opt.detalle)}</span>` : '';
        return `<label style="display:flex;align-items:center;gap:10px;padding:9px 12px;border-bottom:1px solid rgba(255,255,255,0.06);cursor:pointer;background:rgba(255,255,255,0.02);">
            <input type="checkbox" name="catAcompId" value="${escapeHtml(opt.id)}" ${checked} style="width:16px;height:16px;accent-color:#ff7a00;flex-shrink:0;cursor:pointer;">
            <div style="flex:1;min-width:0;">
                <span style="font-size:0.85rem;font-weight:600;color:#eef4ff;">${escapeHtml(opt.nombre)}</span>
                ${detalle}
            </div>
            <span style="font-size:0.80rem;font-weight:700;color:#ff7a00;white-space:nowrap;">${precioLabel}</span>
        </label>`;
    }).join('');

    return `<div style="margin-top:14px;border-top:1px solid rgba(255,255,255,0.08);padding-top:14px;">
        <button type="button" id="catAcompToggleBtn" style="width:100%;display:flex;align-items:center;justify-content:space-between;padding:9px 12px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:10px;cursor:pointer;color:inherit;text-align:left;gap:8px;">
            <span style="font-size:0.78rem;font-weight:600;color:var(--admin-muted);text-transform:uppercase;letter-spacing:.5px;">Acompañantes (POS)${isActive ? ' ✓' : ''}</span>
            <span id="catAcompArrow" style="font-size:0.72rem;color:var(--admin-muted);flex-shrink:0;transition:transform 0.18s;">▼</span>
        </button>
        <div id="catAcompBody" style="display:none;margin-top:6px;">
            <label style="display:flex;align-items:center;justify-content:space-between;padding:9px 12px;background:rgba(255,122,26,0.08);border:1px solid rgba(255,122,26,0.22);border-radius:10px;cursor:pointer;margin-bottom:6px;">
                <span style="font-size:0.82rem;font-weight:600;color:#eef4ff;">Activar acompañantes para esta categoría</span>
                <input type="checkbox" id="catAcompActivo" ${isActive ? 'checked' : ''} style="width:17px;height:17px;accent-color:#ff7a00;cursor:pointer;">
            </label>
            <div id="catAcompList" style="display:${isActive ? 'block' : 'none'};border:1px solid rgba(255,122,26,0.22);border-radius:10px;overflow:hidden;">${items}</div>
        </div>
    </div>`;
}


async function _saveProductInline(productId, categoryId) {
    const nameInput = document.getElementById('cpefName');
    const priceInput = document.getElementById('cpefPrice');
    const descInput = document.getElementById('cpefDesc');
    const activeMenuInput = document.getElementById('cpefActiveMenu');
    const activePosInput = document.getElementById('cpefActivePos');
    const fileInput = document.getElementById('cpefFileInput');
    const name = nameInput ? nameInput.value.trim() : '';
    if (!name) { showNotice('El nombre es obligatorio.', 'error'); return; }

    const saveBtn = document.getElementById('cpefSaveBtn');
    if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Guardando…'; }

    try {
        const product = productsState.find((p) => p.id === productId);
        let imageUrl = product ? (product.image_url || '') : '';

        const file = fileInput && fileInput.files && fileInput.files[0];
        if (file) {
            imageUrl = await resolveProductImageUpload(file, name);
        }

        const estado = activeMenuInput && !activeMenuInput.checked ? 'paused' : 'active';
        const visiblePos = activePosInput ? activePosInput.checked : true;
        const precio = priceInput ? Number(priceInput.value) || 0 : 0;
        const descripcion = descInput ? descInput.value.trim() : '';

        await firebaseDb.collection('productos').doc(productId).update({
            nombre: name,
            precio,
            descripcion,
            estado,
            visible_pos: visiblePos,
            image_url: imageUrl,
            variantes: _cpefVariantes.map((v) => ({
                id: v.id || ('v-' + Date.now()),
                nombre: String(v.nombre || '').trim(),
                precio: Number(v.precio) || 0,
                con_bebida: v.con_bebida === true,
                bebida_ref_id: v.bebida_ref_id || null,
                bebida_pres_id: v.bebida_pres_id || null,
                bebida_nombre: String(v.bebida_nombre || '').trim(),
                cantidad_bebidas: Number(v.cantidad_bebidas) || 0
            })),
            bebida_incluida: {
                activo: _cpefBebidaIncluida.activo === true,
                bebida_ref_id: _cpefBebidaIncluida.bebida_ref_id || null,
                bebida_pres_id: _cpefBebidaIncluida.bebida_pres_id || null,
                bebida_nombre: String(_cpefBebidaIncluida.bebida_nombre || '').trim(),
                cantidad: Number(_cpefBebidaIncluida.cantidad) || 1
            },
            updated_at: firestoreNow()
        });

        _editingProductId = null;
        await reloadDataAndRender();
        showNotice('Producto guardado.', 'ok');
    } catch (e) {
        showNotice(`Error al guardar: ${e.message || 'Error inesperado.'}`, 'error');
        if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Guardar'; }
    }
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

// ── Métricas: Pestaña Usuarios ────────────────────────────────────────────────

let _metricsUsersFiltered = [];
let _metricsPosFiltered = [];
let _prodMetricsPeriod = 'all';

// ── helper: mini bar chart ─────────────────────────────────────────────────
function _renderBarChart(containerId, data, color) {
    const el = document.getElementById(containerId);
    if (!el) return;
    if (!data || !data.length) { el.innerHTML = '<p class="met-empty-note">Sin datos suficientes.</p>'; return; }
    const max = Math.max(...data.map(d => d.val), 1);
    el.innerHTML = data.map(d => {
        const pct = Math.round((d.val / max) * 100);
        return `<div class="met-bar-item">
            <span class="met-bar-label">${escapeHtml(String(d.label))}</span>
            <div class="met-bar-track"><div class="met-bar-fill" style="width:${pct}%;background:${color}"></div></div>
            <span class="met-bar-val">${d.val}</span>
        </div>`;
    }).join('');
}

// ── helper: stats por período ──────────────────────────────────────────────
function _periodStats(orders, unit) {
    const now = new Date();
    const start = new Date(now);
    if (unit === 'today')      { start.setHours(0,0,0,0); }
    else if (unit === 'week')  { start.setDate(start.getDate() - start.getDay()); start.setHours(0,0,0,0); }
    else if (unit === 'month') { start.setDate(1); start.setHours(0,0,0,0); }
    const filtered = orders.filter(o => {
        if (!o.createdAt) return false;
        const ts = o.createdAt.seconds ? o.createdAt.seconds * 1000 : Number(o.createdAt);
        return ts >= start.getTime();
    });
    return { count: filtered.length, revenue: filtered.reduce((s,o) => s + Number(o.total||0), 0) };
}

// ── helper: extraer hora/día de una orden ──────────────────────────────────
function _orderTs(o) {
    if (!o.createdAt) return null;
    return o.createdAt.seconds ? o.createdAt.seconds * 1000 : Number(o.createdAt);
}

async function renderMetricasTrafico() {
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    if (!firebaseDb) { set('trafKpi30d','—'); return; }

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const d30 = new Date(now); d30.setDate(d30.getDate() - 29);
    const d30Str = d30.toISOString().slice(0, 10);

    try {
        const snap = await firebaseDb.collection('visitas')
            .where('date', '>=', d30Str)
            .where('date', '<=', todayStr)
            .get();

        const docs = snap.docs.map(d => d.data());

        // KPIs
        const d7Str = new Date(now.getTime() - 6 * 86400000).toISOString().slice(0, 10);
        const total30 = docs.length;
        const total7  = docs.filter(d => d.date >= d7Str).length;
        const totalHoy = docs.filter(d => d.date === todayStr).length;

        set('trafKpi30d',  total30);
        set('trafKpi7d',   total7);
        set('trafKpiHoy',  totalHoy);

        const lbl = document.getElementById('trafPeriodLbl');
        if (lbl) lbl.textContent = `datos desde ${d30Str}`;

        // Fuente principal
        const srcMap = {};
        docs.forEach(d => { const s = d.source || 'directo'; srcMap[s] = (srcMap[s] || 0) + 1; });
        const sortedSrc = Object.entries(srcMap).sort((a,b) => b[1]-a[1]);
        const srcLabels = { directo:'Directo', instagram:'Instagram', facebook:'Facebook', tiktok:'TikTok', whatsapp:'WhatsApp', google:'Google', otro:'Otro' };
        set('trafKpiSource', sortedSrc.length ? (srcLabels[sortedSrc[0][0]] || sortedSrc[0][0]) : '—');

        // Gráfico diario — últimos 14 días
        const d14Str = new Date(now.getTime() - 13 * 86400000).toISOString().slice(0, 10);
        const dayMap14 = {};
        for (let i = 0; i < 14; i++) {
            const d = new Date(now.getTime() - (13 - i) * 86400000);
            dayMap14[d.toISOString().slice(0, 10)] = 0;
        }
        docs.filter(d => d.date >= d14Str).forEach(d => {
            if (dayMap14[d.date] !== undefined) dayMap14[d.date]++;
        });
        _renderBarChart('trafDayChart',
            Object.entries(dayMap14).map(([date, val]) => ({ label: date.slice(5), val })),
            '#60a5fa');

        // Gráfico de fuentes
        _renderBarChart('trafSourceChart',
            sortedSrc.slice(0, 6).map(([s, v]) => ({ label: srcLabels[s] || s, val: v })),
            '#a78bfa');

    } catch(e) {
        console.warn('renderMetricasTrafico error:', e);
    }
}

function renderMetricasProductos(period) {
    if (period !== undefined) _prodMetricsPeriod = period;
    const ranking = document.getElementById('prodMetricsRanking');
    if (!ranking) return;

    // Límite temporal según período
    const now = new Date();
    const startOf = (unit) => {
        const d = new Date(now);
        if (unit === 'today') { d.setHours(0, 0, 0, 0); }
        else if (unit === 'week') { d.setDate(d.getDate() - d.getDay()); d.setHours(0, 0, 0, 0); }
        else if (unit === 'month') { d.setDate(1); d.setHours(0, 0, 0, 0); }
        return d;
    };
    const cutoff = _prodMetricsPeriod !== 'all' ? startOf(_prodMetricsPeriod) : null;

    // Agregar por producto
    const map = new Map();
    for (const order of ordersState) {
        const ts = order.createdAt
            ? (typeof order.createdAt.toDate === 'function' ? order.createdAt.toDate() : new Date(order.createdAt))
            : null;
        if (cutoff && ts && ts < cutoff) continue;

        for (const item of (order.items || [])) {
            const name = String(item.productName || '').trim();
            if (!name) continue;
            const qty = Number(item.quantity || 0);
            const rev = Number(item.subtotal || 0);
            if (!map.has(name)) map.set(name, { qty: 0, revenue: 0 });
            const e = map.get(name);
            e.qty += qty;
            e.revenue += rev;
        }
    }

    const sorted = [...map.entries()]
        .map(([name, d]) => ({ name, ...d }))
        .filter((p) => p.qty > 0)
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 20);

    // KPIs
    const totalUnits = sorted.reduce((s, p) => s + p.qty, 0);
    const totalRev   = sorted.reduce((s, p) => s + p.revenue, 0);
    const setKpi = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setKpi('prodMetricUnits',    totalUnits.toLocaleString('es-CO'));
    setKpi('prodMetricRevenue',  formatMoney(totalRev));
    setKpi('prodMetricDistinct', map.size.toLocaleString('es-CO'));
    setKpi('prodMetricStar',     sorted.length ? sorted[0].name : '—');

    if (!sorted.length) {
        ranking.innerHTML = '<p class="prod-rank-empty">Sin pedidos en este período.</p>';
        return;
    }

    const maxQty = sorted[0].qty;
    const listEl = document.createElement('div');
    listEl.className = 'prod-rank-list';
    sorted.forEach((p, i) => {
        const item = document.createElement('div');
        item.className = 'prod-rank-item';
        const barPct = Math.round((p.qty / maxQty) * 100);
        item.innerHTML = `
            <span class="prod-rank-pos${i < 3 ? ' top3' : ''}">${i + 1}</span>
            <div class="prod-rank-body">
                <div class="prod-rank-name-row">
                    <span class="prod-rank-name"></span>
                    <span class="prod-rank-qty">${p.qty.toLocaleString('es-CO')} uds</span>
                    <span class="prod-rank-rev">${formatMoney(p.revenue)}</span>
                </div>
                <div class="prod-rank-bar-wrap">
                    <div class="prod-rank-bar" style="width:${barPct}%"></div>
                </div>
            </div>`;
        item.querySelector('.prod-rank-name').textContent = p.name;
        listEl.appendChild(item);
    });
    ranking.innerHTML = '';
    ranking.appendChild(listEl);
}

function renderMetricsUsers() {
    const list = document.getElementById('metricsUsersList');
    if (!list) return;

    const users = (clientsState || [])
        .filter(c => Boolean(c.passwordHash))
        .slice().sort((a, b) => (b.totalOrders || 0) - (a.totalOrders || 0));

    const withOrders   = users.filter(u => (u.totalOrders || 0) > 0);
    const totalSpent   = users.reduce((s, u) => s + (u.totalSpent || 0), 0);
    const totalOrders  = users.reduce((s, u) => s + (u.totalOrders || 0), 0);
    const convRate     = users.length ? Math.round((withOrders.length / users.length) * 100) : 0;
    const ltv          = withOrders.length ? Math.round(totalSpent / withOrders.length) : 0;
    const avgTicket    = totalOrders ? Math.round(totalSpent / totalOrders) : 0;
    const retained     = withOrders.filter(u => (u.totalOrders || 0) >= 2).length;
    const retRate      = withOrders.length ? Math.round((retained / withOrders.length) * 100) : 0;

    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('appKpiTotal',      users.length);
    set('appKpiConversion', `${convRate}%`);
    set('appKpiConvSub',    `${withOrders.length} de ${users.length} compraron`);
    set('appKpiLtv',        formatMoney(ltv));
    set('appKpiTicket',     formatMoney(avgTicket));
    set('appKpiRetention',  `${retRate}%`);

    // Segmentación
    const pct = n => withOrders.length ? `${Math.round((n / withOrders.length) * 100)}% de compradores` : '';
    const segNew  = withOrders.filter(u => u.totalOrders === 1).length;
    const segRec  = withOrders.filter(u => u.totalOrders >= 2 && u.totalOrders <= 4).length;
    const segFrec = withOrders.filter(u => u.totalOrders >= 5 && u.totalOrders <= 9).length;
    const segVip  = withOrders.filter(u => u.totalOrders >= 10).length;
    set('appSegNew',  segNew);  set('appSegNewPct',  pct(segNew));
    set('appSegRec',  segRec);  set('appSegRecPct',  pct(segRec));
    set('appSegFrec', segFrec); set('appSegFrecPct', pct(segFrec));
    set('appSegVip',  segVip);  set('appSegVipPct',  pct(segVip));

    // Comportamiento — todos los pedidos para análisis de patrones
    const appOrders = ordersState || [];

    const hourMap = new Map();
    const dayMap  = new Array(7).fill(0);
    const payMap  = new Map();
    const typeMap = new Map();
    const dayNames = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
    const typeLabels = { delivery:'Domicilio', takeaway:'Para llevar', dineIn:'En local' };

    appOrders.forEach(o => {
        const ts = _orderTs(o);
        if (ts) {
            const d = new Date(ts);
            hourMap.set(d.getHours(), (hourMap.get(d.getHours()) || 0) + 1);
            dayMap[d.getDay()]++;
        }
        const m = o.paymentMethod || 'otro';
        payMap.set(m, (payMap.get(m) || 0) + 1);
        const t = typeLabels[o.orderType] || o.orderType || 'Otro';
        typeMap.set(t, (typeMap.get(t) || 0) + 1);
    });

    _renderBarChart('appHourChart',
        [...hourMap.entries()].sort((a,b)=>b[1]-a[1]).slice(0,5).map(([h,c])=>({label:`${String(h).padStart(2,'0')}:00`,val:c})),
        '#ff7b45');
    _renderBarChart('appDayChart',
        dayNames.map((n,i)=>({label:n,val:dayMap[i]})).filter(d=>d.val>0).sort((a,b)=>b.val-a.val).slice(0,5),
        '#60a5fa');
    _renderBarChart('appPayChart',
        [...payMap.entries()].sort((a,b)=>b[1]-a[1]).slice(0,4).map(([m,c])=>({label:m.charAt(0).toUpperCase()+m.slice(1),val:c})),
        '#4ade80');
    _renderBarChart('appTypeChart',
        [...typeMap.entries()].sort((a,b)=>b[1]-a[1]).map(([l,v])=>({label:l,val:v})),
        '#a78bfa');

    _metricsUsersFiltered = users;
    _renderMetricsUserRows(users);
}

function _renderMetricsUserRows(users) {
    const list = document.getElementById('metricsUsersList');
    const countLabel = document.getElementById('metricsUsersCountLabel');
    if (!list) return;
    if (countLabel) countLabel.textContent = `${users.length} usuario${users.length !== 1 ? 's' : ''}`;

    if (!users.length) {
        list.innerHTML = '<p class="muted" style="padding:24px 16px;text-align:center;">Sin usuarios registrados.</p>';
        return;
    }

    const getBadge = u => {
        const n = u.totalOrders || 0;
        if (n === 0)  return ['Sin compras', 'sin'];
        if (n === 1)  return ['Nuevo',       'nuevo'];
        if (n <= 4)   return ['Recurrente',  'rec'];
        if (n <= 9)   return ['Frecuente',   'frec'];
        return              ['VIP',          'vip'];
    };

    list.innerHTML = users.map(u => {
        const [bl, bc] = getBadge(u);
        const initials = (u.customerName || '?').split(' ').map(w => w[0] || '').slice(0, 2).join('').toUpperCase() || '?';
        const lastTs = u.lastOrderAt ? (u.lastOrderAt.seconds ? u.lastOrderAt.seconds * 1000 : u.lastOrderAt) : null;
        const lastStr = lastTs ? new Date(lastTs).toLocaleDateString('es-CO', { day:'numeric', month:'short', year:'numeric' }) : '—';
        return `
        <div class="met-user-row-v2" data-user-phone="${escapeHtml(u.customerPhone || '')}" data-user-id="${escapeHtml(u.id || '')}">
            <div class="met-avatar">${escapeHtml(initials)}</div>
            <div class="met-user-info-v2">
                <div class="met-user-name-v2">${escapeHtml(u.customerName || 'Sin nombre')}</div>
                <div class="met-user-meta-v2">${escapeHtml(u.customerPhone || '—')} · Último: ${lastStr}</div>
            </div>
            <span class="met-badge met-badge--${bc}">${bl}</span>
            <div class="met-user-stat">
                <div class="met-user-stat-val">${u.totalSpent ? formatMoney(u.totalSpent) : '—'}</div>
                <div class="met-user-stat-sub">${u.totalOrders || 0} compras</div>
            </div>
        </div>
        <div class="metrics-user-detail" id="metricsDetail_${escapeHtml(u.id || u.customerPhone || '')}" hidden></div>`;
    }).join('');

    list.querySelectorAll('.met-user-row-v2').forEach(row => {
        row.addEventListener('click', () => _toggleMetricsUserDetail(row));
    });
}

function renderMetricsPos() {
    const list = document.getElementById('metricsPosList');
    if (!list) return;

    const posOrders  = (ordersState || []).filter(o => o.isAdminOrder || o.source === 'admin_pos');
    const posClients = (clientsState || []).slice().sort((a, b) => (b.totalOrders || 0) - (a.totalOrders || 0));

    const totalRev   = posOrders.reduce((s, o) => s + Number(o.total || 0), 0);
    const avgTicket  = posOrders.length ? Math.round(totalRev / posOrders.length) : 0;
    const maxTicket  = posOrders.length ? Math.max(...posOrders.map(o => Number(o.total || 0))) : 0;
    const uniqueClients = new Set(posOrders.map(o => o.customerPhone).filter(Boolean)).size || posClients.length;

    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('posKpiOrders',  posOrders.length.toLocaleString('es-CO'));
    set('posKpiClients', uniqueClients.toLocaleString('es-CO'));
    set('posKpiRevenue', formatMoney(totalRev));
    set('posKpiTicket',  formatMoney(avgTicket));
    set('posKpiMax',     formatMoney(maxTicket));

    // Períodos
    const pT = _periodStats(posOrders, 'today');
    const pW = _periodStats(posOrders, 'week');
    const pM = _periodStats(posOrders, 'month');
    set('posPeriodTodayRev',  formatMoney(pT.revenue)); set('posPeriodTodayOrds',  `${pT.count} pedido${pT.count!==1?'s':''}`);
    set('posPeriodWeekRev',   formatMoney(pW.revenue)); set('posPeriodWeekOrds',   `${pW.count} pedido${pW.count!==1?'s':''}`);
    set('posPeriodMonthRev',  formatMoney(pM.revenue)); set('posPeriodMonthOrds',  `${pM.count} pedido${pM.count!==1?'s':''}`);

    // Comportamiento POS
    const hourMap = new Map(); const dayMap = new Array(7).fill(0);
    const payMap = new Map(); const typeMap = new Map();
    const dayNames = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
    const typeLabels = { delivery:'Domicilio', takeaway:'Para llevar', dineIn:'En local' };

    posOrders.forEach(o => {
        const ts = _orderTs(o);
        if (ts) { const d = new Date(ts); hourMap.set(d.getHours(),(hourMap.get(d.getHours())||0)+1); dayMap[d.getDay()]++; }
        const m = o.paymentMethod || 'otro';
        payMap.set(m, (payMap.get(m)||0)+1);
        const t = typeLabels[o.orderType] || o.orderType || 'Otro';
        typeMap.set(t, (typeMap.get(t)||0)+1);
    });

    _renderBarChart('posHourChart',
        [...hourMap.entries()].sort((a,b)=>b[1]-a[1]).slice(0,5).map(([h,c])=>({label:`${String(h).padStart(2,'0')}:00`,val:c})), '#ff7b45');
    _renderBarChart('posDayChart',
        dayNames.map((n,i)=>({label:n,val:dayMap[i]})).filter(d=>d.val>0).sort((a,b)=>b.val-a.val).slice(0,5), '#60a5fa');
    _renderBarChart('posPayChart',
        [...payMap.entries()].sort((a,b)=>b[1]-a[1]).slice(0,4).map(([m,c])=>({label:m.charAt(0).toUpperCase()+m.slice(1),val:c})), '#4ade80');
    _renderBarChart('posTypeChart',
        [...typeMap.entries()].sort((a,b)=>b[1]-a[1]).map(([l,v])=>({label:l,val:v})), '#a78bfa');

    _metricsPosFiltered = posClients;
    _renderMetricsPosRows(posClients);
}

function _renderMetricsPosRows(clients) {
    const list = document.getElementById('metricsPosList');
    const countLbl = document.getElementById('metricsPosCountLbl');
    if (!list) return;
    if (countLbl) countLbl.textContent = `${clients.length} cliente${clients.length !== 1 ? 's' : ''}`;

    if (!clients.length) {
        list.innerHTML = '<p class="muted" style="padding:24px 16px;text-align:center;">Sin clientes POS registrados.</p>';
        return;
    }

    const getBadge = u => {
        const n = u.totalOrders || 0;
        if (n === 0) return ['Sin pedidos', 'sin'];
        if (n === 1) return ['Nuevo',       'nuevo'];
        if (n <= 4)  return ['Recurrente',  'rec'];
        if (n <= 9)  return ['Frecuente',   'frec'];
        return             ['VIP',          'vip'];
    };

    list.innerHTML = clients.map(u => {
        const [bl, bc] = getBadge(u);
        const initials = (u.customerName || '?').split(' ').map(w => w[0] || '').slice(0, 2).join('').toUpperCase() || '?';
        const lastTs = u.lastOrderAt ? (u.lastOrderAt.seconds ? u.lastOrderAt.seconds * 1000 : u.lastOrderAt) : null;
        const lastStr = lastTs ? new Date(lastTs).toLocaleDateString('es-CO', { day:'numeric', month:'short', year:'numeric' }) : '—';
        return `
        <div class="met-user-row-v2">
            <div class="met-avatar">${escapeHtml(initials)}</div>
            <div class="met-user-info-v2">
                <div class="met-user-name-v2">${escapeHtml(u.customerName || 'Sin nombre')}</div>
                <div class="met-user-meta-v2">${escapeHtml(u.customerPhone || '—')} · Último: ${lastStr}</div>
            </div>
            <span class="met-badge met-badge--${bc}">${bl}</span>
            <div class="met-user-stat">
                <div class="met-user-stat-val">${u.totalSpent ? formatMoney(u.totalSpent) : '—'}</div>
                <div class="met-user-stat-sub">${u.totalOrders || 0} pedidos</div>
            </div>
        </div>`;
    }).join('');
}

async function _toggleMetricsUserDetail(row) {
    const phone = row.dataset.userPhone;
    const userId = row.dataset.userId;
    const detailId = `metricsDetail_${userId || phone}`;
    const detail = document.getElementById(detailId);
    if (!detail) return;

    const isOpen = !detail.hidden;
    // Cerrar todos los detalles abiertos
    document.querySelectorAll('.metrics-user-detail').forEach((d) => { d.hidden = true; });
    document.querySelectorAll('.metrics-user-row, .met-user-row-v2').forEach((r) => r.classList.remove('is-expanded'));

    if (isOpen) return; // si ya estaba abierto, solo cerramos

    row.classList.add('is-expanded');
    detail.hidden = false;
    detail.innerHTML = '<p class="metrics-detail-loading">Cargando historial...</p>';

    try {
        const snap = await firebaseDb.collection(ORDERS_COLLECTION)
            .where('customerPhone', '==', phone)
            .orderBy('createdAt', 'desc')
            .limit(100)
            .get();

        const orders = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        _renderMetricsUserDetail(detail, orders, phone);
    } catch (e) {
        detail.innerHTML = '<p class="metrics-detail-loading">No se pudo cargar el historial.</p>';
    }
}

function _renderMetricsUserDetail(container, orders, phone) {
    if (!orders.length) {
        container.innerHTML = '<p class="metrics-detail-loading">Este usuario no tiene pedidos registrados.</p>';
        return;
    }

    const total = orders.reduce((s, o) => s + Number(o.total || 0), 0);
    const firstDate = orders.length
        ? new Date(orders[orders.length - 1]?.createdAt?.seconds
            ? orders[orders.length - 1].createdAt.seconds * 1000
            : orders[orders.length - 1].createdAt)
            .toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
        : '—';
    const lastDate = new Date(orders[0]?.createdAt?.seconds
        ? orders[0].createdAt.seconds * 1000
        : orders[0].createdAt)
        .toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
    const avg = orders.length ? formatMoney(Math.round(total / orders.length)) : '—';

    // Productos más pedidos
    const itemMap = new Map();
    orders.forEach((o) => {
        (o.items || []).forEach((item) => {
            const name = item.productName || item.nombre || '?';
            const qty = Number(item.quantity || item.cantidad || 1);
            itemMap.set(name, (itemMap.get(name) || 0) + qty);
        });
    });
    const topItems = [...itemMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

    // Horario preferido
    const hourMap = new Map();
    orders.forEach((o) => {
        if (!o.createdAt) return;
        const ts = o.createdAt.seconds ? o.createdAt.seconds * 1000 : Number(o.createdAt);
        const h = new Date(ts).getHours();
        hourMap.set(h, (hourMap.get(h) || 0) + 1);
    });
    const topHours = [...hourMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3)
        .map(([h, c]) => ({ h: `${String(h).padStart(2, '0')}:00`, c }));

    // Métodos de pago
    const payMap = new Map();
    orders.forEach((o) => {
        const m = o.paymentMethod || 'desconocido';
        payMap.set(m, (payMap.get(m) || 0) + 1);
    });
    const payRows = [...payMap.entries()].sort((a, b) => b[1] - a[1]);

    const makeCard = (title, rows) => `
        <div class="metrics-detail-card">
            <div class="metrics-detail-title">${title}</div>
            <div class="metrics-detail-rows">
                ${rows.map(([label, val]) => `
                    <div class="metrics-detail-row">
                        <span>${escapeHtml(String(label))}</span>
                        <strong>${escapeHtml(String(val))}</strong>
                    </div>`).join('')}
            </div>
        </div>`;

    container.innerHTML = `<div class="metrics-detail-grid">
        ${makeCard('Resumen', [
            ['Primer pedido', firstDate],
            ['Último pedido', lastDate],
            ['Total pedidos', orders.length],
            ['Gastado en total', formatMoney(total)],
            ['Ticket promedio', avg]
        ])}
        ${topItems.length ? makeCard('Productos favoritos', topItems.map(([n, q]) => [n, `×${q}`])) : ''}
        ${topHours.length ? makeCard('Horario de compra', topHours.map(({ h, c }) => [h, `${c} pedido${c !== 1 ? 's' : ''}`])) : ''}
        ${payRows.length ? makeCard('Métodos de pago', payRows.map(([m, c]) => [m, `${c}×`])) : ''}
    </div>
    <div class="metrics-orders-section">
        <div class="metrics-orders-title">Pedidos recientes</div>
        ${orders.slice(0, 10).map((o) => {
            const ts = o.createdAt?.seconds ? o.createdAt.seconds * 1000 : Number(o.createdAt || 0);
            const dateStr = ts ? new Date(ts).toLocaleString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
            const productsSummary = (o.items || []).map((i) => {
                const n = String(i.productName || i.nombre || '');
                const q = Number(i.quantity || i.cantidad || 1);
                return q > 1 ? `${q}× ${n}` : n;
            }).join(', ') || '—';
            const total = formatMoney(o.total || 0);
            const itemsJson = escapeHtml(JSON.stringify(o.items || []));
            return `<div class="metrics-order-item">
                <div class="metrics-order-meta">
                    <div class="metrics-order-date">${escapeHtml(dateStr)}</div>
                    <div class="metrics-order-products" title="${escapeHtml(productsSummary)}">${escapeHtml(productsSummary)}</div>
                </div>
                <span class="metrics-order-total">${total}</span>
                <button class="metrics-order-repeat-btn" data-repeat-items="${itemsJson}" title="Cargar en POS">↺ Repetir</button>
            </div>`;
        }).join('')}
    </div>`;

    // Listeners de "Repetir en POS"
    container.querySelectorAll('.metrics-order-repeat-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            try {
                const items = JSON.parse(btn.dataset.repeatItems || '[]');
                _repeatOrderInPos(items);
            } catch { /* noop */ }
        });
    });
}

function _repeatOrderInPos(pastItems) {
    if (!pastItems || !pastItems.length) {
        showNotice('Este pedido no tiene productos para cargar.', 'error');
        return;
    }

    const ticket = createNewPosTicket();

    pastItems.forEach((item, idx) => {
        const name     = String(item.productName || item.nombre || '').trim();
        if (!name) return;
        const qty      = Number(item.quantity || item.cantidad || 1);
        const unit     = Number(item.unitPrice || item.price || 0) || (qty ? Math.round(Number(item.subtotal || 0) / qty) : 0);
        const subtotal = unit * qty;
        const note     = String(item.note || item.optionLabel || item.nota || '');
        const key      = `repeat_${ticket.id}_${idx}`;

        internalOrderItems.push({
            itemKey: key,
            productId: item.productId || null,
            productName: name,
            categoryName: item.categoryName || '',
            quantity: qty,
            unitPrice: unit,
            originalUnitPrice: null,
            subtotal,
            note,
            optionLabel: note,
            promoLabel: null,
            promo2x1: false,
            parentKey: null
        });
    });

    ticket.items = internalOrderItems;

    openInternalOrderModal();
    showNotice(`${pastItems.length} producto${pastItems.length !== 1 ? 's' : ''} cargado${pastItems.length !== 1 ? 's' : ''} en POS.`, 'success');
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
        return 'ahora mismo';
    }

    const date = typeof value.toDate === 'function' ? value.toDate() : new Date(value);
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
        return 'ahora mismo';
    }

    const elapsedMs = Date.now() - date.getTime();
    const elapsedSeconds = Math.max(0, Math.round(elapsedMs / 1000));

    if (elapsedSeconds < 60) {
        return 'ahora mismo';
    }

    const elapsedMinutes = Math.floor(elapsedSeconds / 60);
    if (elapsedMinutes < 60) {
        return `hace ${elapsedMinutes}min`;
    }

    const elapsedHours = Math.floor(elapsedMinutes / 60);
    if (elapsedHours < 24) {
        return `hace ${elapsedHours}h`;
    }

    const elapsedDays = Math.floor(elapsedHours / 24);
    return `hace ${elapsedDays}d`;
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
        case 'servido':
            return { label: 'Servido', className: 'ready-pickup' };
        case 'entregado':
            return { label: 'Entregado', className: 'success' };
        default:
            return { label: 'Nuevo', className: 'pending' };
    }
}

function getOrderColumnKey(order) {
    if (order.orderType === 'mesa') return 'mesa';
    return order.orderType === 'domicilio' ? 'delivery' : 'takeaway';
}

function getOrderTypeLabel(order) {
    if (order.orderType === 'domicilio') return 'Domicilio';
    if (order.orderType === 'mesa') return order.mesaNumber ? `Mesa ${order.mesaNumber}` : 'Mesa';
    return 'Recoger';
}

function getOrderDisplayTotal(order) {
    if (Number.isFinite(Number(order.total))) {
        return Number(order.total);
    }

    return Number(order.subtotal || 0) + Number(order.deliveryFee || 0);
}

function getDeliveredOrdersForCurrentDay() {
    return ordersState.filter((order) => {
        if (order.status !== 'entregado') return false;
        if (!cajaAperturaAt) return true;
        const ts = order.deliveredAt || order.paidAt;
        const ms = ts?.toMillis ? ts.toMillis() : Number(ts || 0);
        return ms >= cajaAperturaAt;
    });
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

    const message = encodeURIComponent(`Hola ${order.customerName || ''}, te escribimos desde ${brandingState.restaurantName || 'Roal Burger'} por tu pedido ${order.code}.`);
    return `https://wa.me/${digits}?text=${message}`;
}

async function copyTextToClipboard(text) {
    const normalizedText = String(text || '');
    if (!normalizedText) {
        return false;
    }

    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        try {
            await navigator.clipboard.writeText(normalizedText);
            showClipboardToast('Copiado');
            return true;
        } catch (_) {
            // Clipboard API falló (sin permiso en móvil) — cae al fallback execCommand
        }
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
    const method = String(order.paymentMethod || '').toLowerCase();
    const sub = String(order.paymentSubMethod || '').toLowerCase();

    const subLabels = { nequi: 'Nequi', bold: 'Bold', bancolombia: 'Bancolombia' };
    const subStr = subLabels[sub] || '';

    if (method === 'split' && Array.isArray(order.paymentSplit) && order.paymentSplit.length) {
        const parts = order.paymentSplit.map((s) => {
            const pm = getPaymentMethods().find((x) => x.id === s.method);
            const label = pm ? pm.label : s.method;
            return `${label} ${formatMoney(Number(s.amount))}`;
        });
        return `Dividido | ${parts.join(' + ')}`;
    }

    if (method === 'efectivo') {
        const tender = Number(order.cashTenderAmount || 0);
        const change = Number(order.cashChangeAmount || 0);
        if (order.cashChangeRequired && tender > 0) {
            return `Efectivo | Paga con ${formatMoney(tender)} — Cambio ${formatMoney(change)}`;
        }
        return 'Efectivo | Tiene completo';
    }

    if (method === 'tarjeta')       return subStr ? `Tarjeta (${subStr})` : 'Tarjeta';
    if (method === 'transferencia') return subStr ? `Transferencia (${subStr})` : 'Transferencia';
    if (method === 'link_pago')     return subStr ? `Link de pago (${subStr})` : 'Link de pago';

    const pm = getPaymentMethods().find((x) => x.id === method);
    if (pm) return pm.label;

    return 'Sin medio de pago';
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

${brandingState.restaurantName || 'Roal Burger'}
Comida rápida con acento venezolano 🇻🇪🔥`;
}

function buildPickupReadyMessage(order) {
    const customerName = String(order.customerName || 'cliente').trim() || 'cliente';
    return `Hola ${customerName} tu pedido ya se encuentra listo para recoger.`;
}

function buildTicketAddressLines(order) {
    if (order.orderType !== 'domicilio') {
        return [`Retira en el local ${brandingState.restaurantName || 'Roal Burger'}`];
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
    const customerName = String(order.customerName || 'Cliente').trim() || 'Cliente';
    const phoneDigits = normalizePhoneDigits(order.customerPhoneDigits || order.customerPhone || '');
    const displayPhone = phoneDigits ? `+${phoneDigits.startsWith('57') ? phoneDigits : `57${phoneDigits}`}` : String(order.customerPhone || '').trim();
    const address = getOrderContactAddress(order);
    const orderCode = String(order.code || '').trim();
    const paymentLabel = getOrderPaymentLabel(order);
    const noteParts = [
        `Cliente ${brandingState.restaurantName || 'Roal Burger'}`,
        orderCode ? `Pedido ${orderCode}` : '',
        paymentLabel || '',
        displayPhone ? `Telefono ${displayPhone}` : '',
        address ? `Direccion ${address}` : ''
    ].filter(Boolean);

    return [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `FN:${escapeVCardValue(customerName)}`,
        `N:${escapeVCardValue(address)};${escapeVCardValue(customerName)};;;`,
        `ORG:${escapeVCardValue(brandingState.restaurantName || 'Roal Burger')}`,
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
    const restaurantName = escapeHtml(brandingState.restaurantName || 'Roal Burger');
    const orderDate = escapeHtml(formatOrderDate(order.createdAt));
    const orderHour = escapeHtml(formatOrderTime(order.createdAt));
    const elapsed = escapeHtml(formatElapsedTime(order.createdAt));
    const paymentLabel = getOrderPaymentLabel(order);
    const [paymentMethod, paymentDetail] = paymentLabel.split(' | ');
    const cashGiven = Number(order.cashTenderAmount || 0);
    const changeAmount = order.cashChangeRequired
        ? (order.cashChangeAmount != null ? Number(order.cashChangeAmount) : (cashGiven > totalAmount ? cashGiven - totalAmount : null))
        : null;

    const addressLines = buildTicketAddressLines(order)
        .map((line) => `<div class="ticket-address-text">${buildTicketCopyButton('Direccion', line, {})}</div>`)
        .join('');

    const ticketDiscountTotal = (order.items || []).reduce((sum, item) => {
        const orig = item.originalUnitPrice != null ? Number(item.originalUnitPrice) : null;
        if (orig !== null && orig > Number(item.unitPrice || 0)) {
            return sum + (orig - Number(item.unitPrice || 0)) * Number(item.quantity || 1);
        }
        return sum;
    }, 0);

    const rows = order.items.map((item) => {
        const origUnit = item.originalUnitPrice != null ? Number(item.originalUnitPrice) : null;
        const hasItemDiscount = origUnit !== null && origUnit > Number(item.unitPrice || 0);
        const origSubtotal = hasItemDiscount ? origUnit * Number(item.quantity || 1) : null;
        const subtotal = Number(item.subtotal || 0);

        const detailParts = [
            item.categoryName,
            item.optionLabel,
            item.note && item.note !== item.optionLabel ? `Nota: ${item.note}` : '',
        ].filter(Boolean);

        const priceCell = hasItemDiscount
            ? `<s style="color:#aaa;font-size:0.78em;">${escapeHtml(formatMoney(origSubtotal))}</s><br><strong>${subtotal === 0 ? 'GRATIS' : escapeHtml(formatMoney(subtotal))}</strong>`
            : escapeHtml(formatMoney(subtotal));

        return `
            <tr>
                <td>
                    <strong>${escapeHtml(`${item.quantity} x ${item.productName}`)}</strong>
                    ${detailParts.map((p) => `<span class="ticket-line-meta">${escapeHtml(p)}</span>`).join('')}
                </td>
                <td style="text-align:right;">${priceCell}</td>
            </tr>
        `;
    }).join('');

    // Build payment rows for totals section
    const _ticketPaymentMethod = String(order.paymentMethod || '').toLowerCase();
    let _ticketPaymentRows = '';
    if (_ticketPaymentMethod === 'efectivo') {
        if (cashGiven > 0) {
            _ticketPaymentRows += `
                    <div class="ticket-summary-line ticket-total-row">
                        <span>Recibe</span>
                        <strong>${escapeHtml(formatMoney(cashGiven))}</strong>
                    </div>`;
        }
        if (changeAmount !== null && changeAmount > 0) {
            _ticketPaymentRows += `
                    <div class="ticket-summary-line ticket-total-row ticket-change-row">
                        <span>Cambio</span>
                        <strong>${escapeHtml(formatMoney(changeAmount))}</strong>
                    </div>`;
        } else if (cashGiven > 0) {
            _ticketPaymentRows += `
                    <div class="ticket-summary-line ticket-total-row">
                        <span></span><span style="font-style:italic;font-size:0.85em;">Monto exacto</span>
                    </div>`;
        }
    } else if (_ticketPaymentMethod && _ticketPaymentMethod !== 'pendiente' && _ticketPaymentMethod !== 'split') {
        _ticketPaymentRows = `
                    <div class="ticket-summary-line ticket-total-row ticket-paid-row">
                        <span>✓ Pagado</span>
                        <strong>${escapeHtml(paymentMethod)}</strong>
                    </div>`;
    }

    // Pago row in client card
    let _ticketPagoRowDetail = '';
    if (_ticketPaymentMethod === 'split' && paymentDetail) {
        _ticketPagoRowDetail = `<span class="ticket-line-meta">${escapeHtml(paymentDetail)}</span>`;
    } else if (_ticketPaymentMethod && _ticketPaymentMethod !== 'pendiente' && _ticketPaymentMethod !== 'efectivo') {
        _ticketPagoRowDetail = `<span class="ticket-line-meta">✓ Pagado</span>`;
    }

    const _ticketPromoTags = _getOrderPromoTags(order);
    const _ticketPromoBanner = _ticketPromoTags.length ? `
        <div class="ticket-promo-banner">
            <span class="ticket-promo-icon">🏷</span>
            <div class="ticket-promo-info">
                <div class="ticket-promo-title">PROMOCIÓN ACTIVA</div>
                ${_ticketPromoTags.map(t => `<div class="ticket-promo-label">${escapeHtml(t)}</div>`).join('')}
            </div>
        </div>` : '';

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

                ${_ticketPromoBanner}

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
                            <span>${escapeHtml(paymentMethod)}${_ticketPagoRowDetail}</span>
                        </div>
                    </div>
                </section>

                <section class="ticket-section">
                    <div class="ticket-section-title">${order.orderType === 'domicilio' ? 'Direccion de entrega' : order.orderType === 'mesa' ? (order.mesaNumber ? `Mesa ${order.mesaNumber}` : '⚠️ Sin mesa asignada') : 'Retiro en local'}</div>
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
                    ${ticketDiscountTotal > 0 ? `
                    <div class="ticket-summary-line ticket-total-row ticket-discount-row">
                        <span>🎉 Ahorro en promos</span>
                        <strong style="color:#1a7a42;">-${escapeHtml(formatMoney(ticketDiscountTotal))}</strong>
                    </div>` : ''}
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
                    ${order.paymentMethod === 'split' && Array.isArray(order.paymentSplit) && order.paymentSplit.length ? `
                    <div class="ticket-summary-line ticket-split-header">
                        <span>Pago dividido</span>
                    </div>
                    ${order.paymentSplit.map((s) => {
                        const pm = getPaymentMethods().find((x) => x.id === s.method);
                        const lbl = pm ? pm.label : s.method;
                        return `<div class="ticket-summary-line ticket-split-line">
                            <span>${escapeHtml(lbl)}</span>
                            <strong>${escapeHtml(formatMoney(Number(s.amount)))}</strong>
                        </div>`;
                    }).join('')}
                    ` : ''}
                    ${_ticketPaymentRows}
                </section>

                <div class="ticket-footer-copy">
                    <span>Gracias por elegir ${restaurantName}</span>
                    <span>${escapeHtml(brandingState.address || '')}</span>
                </div>
            </article>
            ${printMode ? '' : (() => {
                const _isPaid = order.paymentMethod && order.paymentMethod !== 'pendiente';
                const _hasType = !!order.orderType;
                const _cobrarDisabled = (_isPaid || !_hasType) ? 'disabled' : '';
                const _cobrarTitle = _isPaid
                    ? 'Pedido ya cobrado'
                    : !_hasType
                        ? 'Asigna tipo de pedido (mesa / recoger / domicilio) primero'
                        : 'Cobrar este pedido';
                return `
                <div class="ticket-print-row">
                    <button type="button" class="ticket-print-btn ticket-action-btn" data-order-ticket-action="print" data-order-id="${order.id}">Imprimir</button>
                    <button type="button" class="ticket-cobrar-btn ticket-action-btn" data-order-ticket-action="cobrar" data-order-id="${order.id}" ${_cobrarDisabled} title="${_cobrarTitle}">💰 Cobrar</button>
                    <button type="button" class="ticket-contact-btn ticket-action-btn" data-order-ticket-action="contact" data-order-id="${order.id}">Agregar contacto</button>
                </div>`;
            })()}
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

let _ticketRenderKey = null;

function renderOrderTicket(order, options = {}) {
    if (!orderTicketBody) {
        return;
    }

    if (!order) {
        _ticketRenderKey = null;
        renderEmptyOrderTicket();
        return;
    }

    // Evitar reconstrucción si es el mismo pedido sin cambios (llamada desde renderOrders)
    const renderKey = `${order.id}|${order.updatedAt?.toMillis?.() ?? order.createdAt?.toMillis?.() ?? 0}|${order.status}`;
    if (!options.openMobile && !options.force && renderKey === _ticketRenderKey) {
        return;
    }
    _ticketRenderKey = renderKey;

    // Marcar como leído: deja de tintiliar el botón POS aunque siga pendiente
    if (order.status === 'pendiente' && !viewedOrderIds.has(order.id)) {
        viewedOrderIds.add(order.id);
        updateOrdersAttentionState();
    }

    orderTicketBody.innerHTML = buildThermalTicketMarkup(order);

    const ticketPaper = orderTicketBody.querySelector('.ticket-paper');
    if (ticketPaper) {
        ticketPaper.style.position = 'relative';
        const floatDiv = document.createElement('div');
        floatDiv.className = 'ticket-float-actions';
        floatDiv.innerHTML = `<button type="button" class="tpv-action-btn tpv-edit-btn" data-order-ticket-action="editar_pos" title="Editar pedido en POS">✎ Editar</button>`;
        floatDiv.innerHTML += `<button type="button" class="tpv-action-btn tpv-delete-btn" data-order-ticket-action="eliminar" title="Eliminar pedido">🗑</button>`;
        ticketPaper.appendChild(floatDiv);
    }

    // Prompt de asignación para pedidos de mesa sin número de mesa
    if (order.orderType === 'mesa' && !order.mesaNumber) {
        const assignPanel = document.createElement('div');
        assignPanel.className = 'ticket-assign-mesa-panel';
        assignPanel.innerHTML = `
            <p class="ticket-assign-mesa-title">⚠️ ¿A qué mesa asignas este pedido?</p>
            <div class="ticket-assign-mesa-form">
                <input type="number" id="ticketMesaNumberInput" class="ticket-mesa-input" placeholder="Nº" min="1" max="99">
                <button type="button" id="ticketAssignMesaBtn" class="ticket-assign-mesa-btn">Asignar mesa</button>
            </div>
        `;
        orderTicketBody.insertBefore(assignPanel, orderTicketBody.firstChild);

        const assignBtn = assignPanel.querySelector('#ticketAssignMesaBtn');
        const mesaInput = assignPanel.querySelector('#ticketMesaNumberInput');
        mesaInput.focus();
        assignBtn.addEventListener('click', async () => {
            const num = Number(mesaInput.value);
            if (!num || num < 1) { mesaInput.focus(); return; }
            assignBtn.disabled = true;
            assignBtn.textContent = 'Guardando...';
            try {
                await updateOrder(order.id, { mesaNumber: num, orderType: 'mesa' });
                showNotice(`Mesa ${num} asignada.`, 'ok');
            } catch (_e) {
                showNotice('No se pudo asignar la mesa.', 'error');
                assignBtn.disabled = false;
                assignBtn.textContent = 'Asignar mesa';
            }
        });
    }

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

function _getOrderPromoTags(order) {
    const tags = new Set();
    (order.items || []).forEach((item) => {
        const pl = String(item.orderOptions?.promoLabel || '').trim();
        if (pl) { tags.add(pl); return; }
        const m = String(item.optionLabel || '').match(/PROMO\s+2[×x]1[^|]*/i);
        if (m) tags.add(m[0].replace(/^🏷\s*/, '').trim());
    });
    return [...tags];
}

function createOrderCard(order) {
    const card = document.createElement('article');
    card.className = 'kanban-order-card';
    if (order.status === 'pendiente' || order.status === 'esperando_domiciliario') {
        card.classList.add('is-attention');
    }
    if (order.id === selectedOrderId) {
        card.classList.add('is-selected');
    }
    if (order.isAdminOrder || order.source === 'admin_pos') {
        card.classList.add('kanban-order-card--admin');
    }
    card.dataset.orderId = order.id;

    if (order.status === 'entregado') {
        card.classList.add('kanban-order-card-compact');
        const isAnulado = order.anulado === true || order.voided === true;
        if (isAnulado) card.classList.add('kanban-order-card--anulado');
        card.innerHTML = `
            <div class="koc-compact-main">
                <div class="koc-compact-info">
                    <span class="koc-name">${escapeHtml(order.customerName || 'Sin nombre')}</span>
                    <span class="koc-code">#${escapeHtml(order.code)}</span>
                </div>
                <div class="koc-compact-right">
                    <span class="koc-total">${escapeHtml(formatMoney(getOrderDisplayTotal(order)))}</span>
                    <span class="koc-time">${escapeHtml(formatOrderTime(order.anuladoAt || order.voidedAt || order.deliveredAt || order.updatedAt || order.createdAt))}</span>
                </div>
                <button type="button" class="koc-compact-del" data-order-card-action="eliminar" data-order-id="${escapeHtml(order.id)}" title="Eliminar permanentemente">&#128465;</button>
            </div>
            ${isAnulado ? '<div class="koc-anulado-stamp">ANULADO</div>' : ''}
        `;
        return card;
    }

    const typeClass = order.orderType === 'domicilio' ? 'koc-type--domicilio'
        : order.orderType === 'mesa' ? 'koc-type--mesa' : 'koc-type--retiro';

    let statusRow = '';
    if (order.status === 'esperando_domiciliario') {
        statusRow = `
            <div class="koc-status">
                <span class="koc-status-badge">Esperando domiciliario</span>
                <span class="order-wait-timer" data-order-id="${order.id}">${escapeHtml(formatLiveDuration(order.courierRequestedAt || order.updatedAt || order.createdAt))}</span>
            </div>`;
    } else if (order.status === 'listo_recoger') {
        statusRow = `
            <div class="koc-status koc-status--ready">
                <span class="koc-status-badge">Listo para recoger</span>
            </div>`;
    }

    const isUnreadOrder = order.status === 'pendiente';
    const isDeliveryOrder = order.orderType === 'domicilio';
    const isPickupOrder = order.orderType === 'retiro';
    const isMesaOrder = order.orderType === 'mesa';
    const showReceiveAction = isUnreadOrder;
    const showPickupReadyAction = !isUnreadOrder && isPickupOrder && order.status !== 'listo_recoger' && order.status !== 'entregado';
    const showDeliveredAction = !isMesaOrder && !isDeliveryOrder && !isUnreadOrder && order.status !== 'entregado';
    const showDeleteAction = order.status !== 'entregado';
    const showViewTicketAction = isMobileAdminViewport();
    const isPosAdminOrder = order.isAdminOrder || order.source === 'admin_pos';
    const showEditPosAction = isPosAdminOrder && order.status === 'pendiente';

    let actionsMarkup = '';

    if (isMesaOrder && order.status !== 'entregado') {
        // Layout mesa: [ Servido/Cobrar | 💰? ]
        const isPaid = order.paymentMethod && order.paymentMethod !== 'pendiente';
        const isServido = order.status === 'servido';
        const mainLabel = isServido ? (isPaid ? 'Entregado' : '💰 Cobrar') : (order.status === 'pendiente' ? 'Servido' : 'Servido');
        const mainAction = isServido ? (isPaid ? 'entregado' : 'cobrar_mesa') : 'servido';
        const mainClass = isServido ? (isPaid ? 'order-action-btn-delivered' : 'order-action-btn-receive') : 'order-action-btn-delivered';
        const cobrarMesaBtn = !isServido && !isPaid
            ? `<button type="button" class="order-action-btn order-action-btn-cobrar koa-icon-btn" data-order-card-action="cobrar_mesa" data-order-id="${order.id}" title="Cobrar pedido">💰</button>`
            : '';
        actionsMarkup = `<div class="kanban-order-actions kanban-order-actions--mesa">
            <button type="button" class="order-action-btn ${mainClass} koa-mesa-main" data-order-card-action="${mainAction}" data-order-id="${order.id}">${mainLabel}</button>
            <div class="koa-mesa-icons">${cobrarMesaBtn}</div>
        </div>`;
    } else if (isDeliveryOrder && order.status !== 'entregado') {
        // Layout domicilio: [ Pedir domiciliario → Entregado | 💰? ]
        const canRequestCourier = order.status !== 'esperando_domiciliario' && order.status !== 'camino';
        const mainLabel = canRequestCourier ? 'Pedir domiciliario' : 'Entregado';
        const mainAction = canRequestCourier ? 'esperando_domiciliario' : 'entregado';
        const mainClass = canRequestCourier ? '' : 'order-action-btn-delivered';
        const isPaid = order.paymentMethod && order.paymentMethod !== 'pendiente';
        const cobrarBtn = !isPaid
            ? `<button type="button" class="order-action-btn order-action-btn-receive koa-icon-btn" data-order-card-action="cobrar_domicilio" data-order-id="${order.id}" title="Cobrar pedido">💰</button>`
            : '';
        actionsMarkup = `<div class="kanban-order-actions kanban-order-actions--mesa">
            <button type="button" class="order-action-btn ${mainClass} koa-mesa-main" data-order-card-action="${mainAction}" data-order-id="${order.id}">${mainLabel}</button>
            <div class="koa-mesa-icons">${cobrarBtn}</div>
        </div>`;
    } else if (isPickupOrder && order.status !== 'entregado') {
        // Layout para recoger: [ Listo → Entregado | 💰? ]
        const isReady = order.status === 'listo_recoger';
        const mainLabel = isReady ? 'Entregado' : 'Listo';
        const mainAction = isReady ? 'entregado' : 'listo_recoger';
        const mainClass = isReady ? 'order-action-btn-delivered' : 'order-action-btn-ready';
        const isPaid = order.paymentMethod && order.paymentMethod !== 'pendiente';
        const cobrarRetiroBtn = !isPaid
            ? `<button type="button" class="order-action-btn order-action-btn-receive koa-icon-btn" data-order-card-action="cobrar_retiro" data-order-id="${order.id}" title="Cobrar pedido">💰</button>`
            : '';
        actionsMarkup = `<div class="kanban-order-actions kanban-order-actions--mesa">
            <button type="button" class="order-action-btn ${mainClass} koa-mesa-main" data-order-card-action="${mainAction}" data-order-id="${order.id}">${mainLabel}</button>
            <div class="koa-mesa-icons">${cobrarRetiroBtn}</div>
        </div>`;
    }

    const promoTags = _getOrderPromoTags(order);
    const promoHeaderBadge = promoTags.length
        ? `<span class="koc-promo-2x1-badge">🏷 2×1</span>`
        : '';
    const promoItemsRow = promoTags.length
        ? `<div class="koc-promo-row">${promoTags.map(t => `<span class="koc-promo-item-label">${escapeHtml(t)}</span>`).join('')}</div>`
        : '';

    const isAnuladoActive = order.anulado === true || order.voided === true;
    const anuladoStamp = isAnuladoActive ? '<div class="koc-anulado-stamp">ANULADO</div>' : '';

    const deliveryAddress = String(order.deliveryAddress || order.customerAddress || '').trim();
    const deliveryRow = isDeliveryOrder && deliveryAddress
        ? `<div class="koc-delivery-address"><span class="koc-delivery-icon">📍</span>${escapeHtml(deliveryAddress)}</div>`
        : '';

    const sinMesaBadge = isMesaOrder && !order.mesaNumber
        ? `<span class="koc-sin-mesa-badge">⚠️ Sin mesa</span>`
        : '';

    let courierChip = '';
    if (isDeliveryOrder && order.status !== 'entregado' && !isAnuladoActive) {
        const courierCalled = !!order.courierRequestedAt;
        const isTransit = order.status === 'en_camino';
        if (!courierCalled) {
            card.classList.add('koc-delivery-pending');
            courierChip = `<div class="koc-courier-chip koc-courier-pending">⚠️ Sin domiciliario · <span class="koc-courier-time" data-order-id="${escapeHtml(order.id)}" data-courier-ref="created">${escapeHtml(formatElapsedTime(order.createdAt))}</span></div>`;
        } else if (isTransit) {
            card.classList.add('koc-delivery-transit');
            courierChip = `<div class="koc-courier-chip koc-courier-transit">🛵 En camino · <span class="koc-courier-time" data-order-id="${escapeHtml(order.id)}" data-courier-ref="requested">${escapeHtml(formatLiveDuration(order.courierRequestedAt))}</span></div>`;
        } else {
            card.classList.add('koc-delivery-waiting');
            courierChip = `<div class="koc-courier-chip koc-courier-waiting">📞 Dom. llamado · <span class="koc-courier-time" data-order-id="${escapeHtml(order.id)}" data-courier-ref="requested">${escapeHtml(formatLiveDuration(order.courierRequestedAt))}</span></div>`;
        }
    }

    // Chip de liquidación: cuánto cobrar o pagar al domiciliario
    let paymentChip = '';
    const payMethod = String(order.paymentMethod || 'pendiente').toLowerCase();
    if (isDeliveryOrder && !isAnuladoActive && order.status !== 'entregado' && payMethod !== 'pendiente') {
        const dFee = Number(order.deliveryFee || 0);
        const orderTotal = getOrderDisplayTotal(order);

        // cashPaid = efectivo que el cliente paga al domiciliario directamente
        let cashPaid = 0;
        if (payMethod === 'efectivo') {
            cashPaid = orderTotal;
        } else if (payMethod === 'split' && Array.isArray(order.paymentSplit)) {
            cashPaid = order.paymentSplit
                .filter((s) => String(s.method || '').toLowerCase() === 'efectivo')
                .reduce((acc, s) => acc + Number(s.amount || 0), 0);
        }
        // transferencia / tarjeta / link_pago: cashPaid = 0

        const balance = dFee - cashPaid;

        if (balance < 0) {
            paymentChip = `<div class="koc-payment-chip koc-pay-collect">💰 Cobra <strong>${escapeHtml(formatMoney(Math.abs(balance)))}</strong></div>`;
        } else if (balance > 0) {
            paymentChip = `<div class="koc-payment-chip koc-pay-give">✅ Paga <strong>${escapeHtml(formatMoney(balance))}</strong></div>`;
        } else {
            paymentChip = `<div class="koc-payment-chip koc-pay-settled">✅ Saldado</div>`;
        }
    }

    card.innerHTML = `
        <div class="koc-header">
            <strong class="koc-code">#${escapeHtml(order.code)}</strong>
            <span class="koc-type-badge ${typeClass}">${escapeHtml(getOrderTypeLabel(order))}</span>
            ${sinMesaBadge}
            ${promoHeaderBadge}
            <span class="koc-time">${escapeHtml(formatElapsedTime(order.createdAt))}</span>
        </div>
        ${courierChip}
        ${paymentChip}
        <div class="koc-body">
            <span class="koc-name">${escapeHtml(order.customerName || 'Sin nombre')}</span>
            <span class="koc-total">${escapeHtml(formatMoney(getOrderDisplayTotal(order)))}</span>
        </div>
        ${deliveryRow}
        ${promoItemsRow}
        ${statusRow}
        ${actionsMarkup}
        ${anuladoStamp}
    `;

    return card;
}

function renderOrders() {
    if (!ordersBoard) {
        return;
    }

    const columns = {
        unread:   { container: ordersColumnUnread,    count: ordersCountUnread,    key: 'unread',    items: [] },
        takeaway: { container: ordersColumnTakeaway,  count: ordersCountTakeaway,  key: 'takeaway',  items: [] },
        delivery: { container: ordersColumnDelivery,  count: ordersCountDelivery,  key: 'delivery',  items: [] },
        mesa:     { container: ordersColumnMesa,      count: ordersCountMesa,      key: 'mesa',      items: [] }
    };

    ordersState.forEach((order) => {
        columns[getOrderColumnKey(order)].items.push(order);
    });

    Object.values(columns).forEach((column) => {
        const activeOrders    = column.items.filter((o) => o.status !== 'entregado');
        const processedOrders = column.items.filter((o) => {
            if (o.status !== 'entregado') return false;
            if (o.voided || o.anulado) return false; // anulados solo visibles en Informes/Tickets
            if (!cajaAperturaAt) return true;
            const ts = o.deliveredAt || o.paidAt;
            const ms = ts?.toMillis ? ts.toMillis() : Number(ts || 0);
            return ms >= cajaAperturaAt;
        });

        if (column.count) {
            column.count.textContent = Number(activeOrders.length).toLocaleString('es-CO');
        }

        if (!column.container) return;

        column.container.innerHTML = '';

        if (!activeOrders.length && !processedOrders.length) {
            renderKanbanEmptyState(column.container);
        }

        activeOrders.forEach((order) => {
            column.container.appendChild(createOrderCard(order));
        });

        // Acordeon de procesados — siempre al fondo
        if (processedOrders.length > 0) {
            const isExpanded = _processedAccordionExpanded.has(column.key);

            const toggle = document.createElement('button');
            toggle.type = 'button';
            toggle.className = 'kanban-processed-toggle' + (isExpanded ? ' is-open' : '');
            toggle.dataset.processedCol = column.key;
            toggle.innerHTML = `
                <span class="kanban-processed-count-badge">${processedOrders.length}</span>
                <span>Procesados</span>
                <span class="kanban-processed-arrow">▼</span>`;
            column.container.appendChild(toggle);

            const section = document.createElement('div');
            section.className = 'kanban-processed-section';
            section.dataset.processedSection = column.key;
            section.hidden = !isExpanded;
            section.style.display = isExpanded ? '' : 'none';
            processedOrders.forEach((order) => {
                section.appendChild(createOrderCard(order));
            });
            column.container.appendChild(section);
        }
    });

    const selectedOrder = ordersState.find((order) => order.id === selectedOrderId) || null;
    if (!selectedOrder) {
        selectedOrderId = null;
        closeMobileTicketPanel();
    }

    renderOrderTicket(selectedOrder || null);
    applyMobileOrdersLane();
    updateOrdersAttentionState();
    renderSalesDayBanner();
    _ptsMarkOccupiedMesas();
}

function renderSalesDayBanner() {
    const todayStr = new Date().toISOString().split('T')[0];

    // Todos los pedidos cobrados en la jornada (pagados, sin importar si ya fueron entregados)
    const paidOrders = ordersState.filter((o) => {
        if (o.voided || o.anulado) return false;
        if (!o.paymentMethod || o.paymentMethod === 'pendiente') return false;
        const paidMs = o.paidAt?.toMillis ? o.paidAt.toMillis() : Number(o.paidAt || 0);
        if (!paidMs) return false;
        if (cajaAperturaAt) return paidMs >= cajaAperturaAt;
        return new Date(paidMs).toISOString().split('T')[0] === todayStr;
    });

    // Efectivo vs digital
    const efectivoTotal = paidOrders
        .filter((o) => {
            if (o.paymentMethod === 'split') return false; // split se cuenta aparte
            return o.paymentMethod === 'efectivo';
        })
        .reduce((sum, o) => sum + Number(getOrderDisplayTotal(o) || 0), 0);

    const digitalTotal = paidOrders
        .filter((o) => {
            if (o.paymentMethod === 'split') return true;
            return o.paymentMethod && o.paymentMethod !== 'efectivo' && o.paymentMethod !== 'pendiente';
        })
        .reduce((sum, o) => sum + Number(getOrderDisplayTotal(o) || 0), 0);

    const grandTotal = paidOrders
        .reduce((sum, o) => sum + Number(getOrderDisplayTotal(o) || 0), 0);

    const deliveryFeesTotal = paidOrders
        .filter((o) => o.orderType === 'domicilio' && Number(o.deliveryFee) > 0)
        .reduce((sum, o) => sum + Number(o.deliveryFee || 0), 0);

    if (salesDayStatusLabel) {
        salesDayStatusLabel.textContent = salesDayState?.openedAt ? 'Jornada activa' : 'Jornada en preparacion';
    }

    if (salesDayStatusMeta) {
        salesDayStatusMeta.textContent = salesDayState?.openedAt
            ? `Apertura: ${formatDateTime(salesDayState.openedAt)}`
            : 'Se abrira automaticamente al sincronizar.';
    }

    if (salesDayDeliveredTotal) {
        salesDayDeliveredTotal.textContent = `💵 ${formatMoney(efectivoTotal)}`;
    }

    if (salesDayGrandTotal) {
        salesDayGrandTotal.textContent = `💳 ${formatMoney(digitalTotal)}`;
    }

    const totalChip = document.getElementById('salesDayTotalChip');
    if (totalChip) {
        totalChip.textContent = `= ${formatMoney(grandTotal)}`;
    }

    const deliveryFeesChip = document.getElementById('salesDayDeliveryFeesChip');
    if (deliveryFeesChip) {
        if (deliveryFeesTotal > 0) {
            deliveryFeesChip.textContent = `🛵 ${formatMoney(deliveryFeesTotal)}`;
            deliveryFeesChip.hidden = false;
        } else {
            deliveryFeesChip.hidden = true;
        }
    }

    // El botón de cierre sigue basado en pedidos entregados (no en pagados)
    const deliveredOrders = getDeliveredOrdersForCurrentDay();
    const validDelivered  = deliveredOrders.filter((o) => !o.anulado && !o.voided);
    if (closeSalesDayBtn) {
        closeSalesDayBtn.disabled = validDelivered.length === 0;
        closeSalesDayBtn.textContent = validDelivered.length
            ? `Cierre del dia (${validDelivered.length})`
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

    const filteredClients = getFilteredClients();
    const totalPages = Math.max(1, Math.ceil(filteredClients.length / CLIENTS_PAGE_SIZE));
    if (_clientsPage >= totalPages) _clientsPage = totalPages - 1;

    if (clientsCount) {
        clientsCount.textContent = Number(clientsState.length).toLocaleString('es-CO');
    }

    clientsList.innerHTML = '';

    if (!filteredClients.length) {
        clientsList.innerHTML = '<tr><td class="client-empty-row" colspan="9">No hay clientes que coincidan con la busqueda actual.</td></tr>';
        _renderClientsPagination(0, 1);
        return;
    }

    const pageClients = filteredClients.slice(
        _clientsPage * CLIENTS_PAGE_SIZE,
        (_clientsPage + 1) * CLIENTS_PAGE_SIZE
    );

    pageClients.forEach((client) => {
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

    _renderClientsPagination(_clientsPage, totalPages, filteredClients.length);
}

function _renderClientsPagination(page, totalPages, total) {
    const el = document.getElementById('clientsPagination');
    if (!el) return;
    if (totalPages <= 1) { el.hidden = true; return; }
    el.hidden = false;
    const from = page * CLIENTS_PAGE_SIZE + 1;
    const to   = Math.min((page + 1) * CLIENTS_PAGE_SIZE, total);
    el.innerHTML = `
        <button class="clients-page-btn" id="clientsPagePrev" ${page === 0 ? 'disabled' : ''}>&#8592; Anterior</button>
        <span class="clients-page-info">${from}–${to} de ${total.toLocaleString('es-CO')}</span>
        <button class="clients-page-btn" id="clientsPageNext" ${page >= totalPages - 1 ? 'disabled' : ''}>Siguiente &#8594;</button>
    `;
    el.querySelector('#clientsPagePrev')?.addEventListener('click', () => {
        if (_clientsPage > 0) { _clientsPage--; renderClients(); }
    });
    el.querySelector('#clientsPageNext')?.addEventListener('click', () => {
        if (_clientsPage < totalPages - 1) { _clientsPage++; renderClients(); }
    });
}

let _inboxActiveId = null;

function _inboxGetTypeLabel(type) {
    const map = {
        password_reset_request: '🔑 Reset contraseña',
        customer_direct_message: '💬 Mensaje directo',
        admin_direct_reply: '↩️ Respuesta admin',
        support_request: '🛠️ Soporte',
        order_status_update: '📦 Estado pedido'
    };
    return map[type] || type;
}

function _inboxInitial(name) {
    return String(name || '?').trim().charAt(0).toUpperCase();
}

function renderMessages() {
    if (!messagesList) return;

    const pendingCount = messagesState.filter(m => m.status !== 'resolved').length;
    const messagesCountEl = document.getElementById('messagesCount');
    if (messagesCountEl) messagesCountEl.textContent = pendingCount || messagesState.length;

    // Actualizar badge del FAB
    const fab = document.getElementById('adminChatFabBadge');
    if (fab) {
        if (pendingCount > 0) { fab.textContent = pendingCount; fab.removeAttribute('hidden'); }
        else fab.setAttribute('hidden', '');
    }

    const searchTerm = (document.getElementById('inboxSearch')?.value || '').trim().toLowerCase();

    let filtered = messagesState;
    if (searchTerm) {
        filtered = messagesState.filter(m =>
            String(m.customerName || '').toLowerCase().includes(searchTerm) ||
            String(m.subject || '').toLowerCase().includes(searchTerm) ||
            String(m.body || '').toLowerCase().includes(searchTerm)
        );
    }

    messagesList.innerHTML = '';

    if (!filtered.length) {
        messagesList.innerHTML = '<p class="inbox-empty">Sin mensajes aún</p>';
        return;
    }

    filtered.forEach(msg => {
        const isActive = msg.id === _inboxActiveId;
        const isPending = msg.status !== 'resolved';
        const item = document.createElement('div');
        item.className = `inbox-thread-item${isActive ? ' is-active' : ''}`;
        item.dataset.msgId = msg.id;
        item.innerHTML = `
            <div class="inbox-thread-avatar">${_inboxInitial(msg.customerName)}</div>
            <div class="inbox-thread-info">
                <div class="inbox-thread-name">${escapeHtml(msg.customerName || 'Sin nombre')}</div>
                <div class="inbox-thread-preview">${escapeHtml(String(msg.body || msg.subject || '').substring(0, 50))}</div>
            </div>
            <div class="inbox-thread-meta">
                <span class="inbox-thread-time">${_inboxFormatTime(msg.createdAt)}</span>
                ${isPending ? '<span class="inbox-thread-unread"></span>' : '<span class="inbox-thread-status-dot"></span>'}
            </div>
        `;
        item.addEventListener('click', () => openInboxDetail(msg.id));
        messagesList.appendChild(item);
    });

    // Mantener el detalle si hay uno activo
    if (_inboxActiveId) openInboxDetail(_inboxActiveId, false);
}

function _inboxFormatTime(ts) {
    if (!ts) return '';
    try {
        const d = typeof ts.toDate === 'function' ? ts.toDate() : new Date(ts);
        const now = new Date();
        const diffMs = now - d;
        if (diffMs < 86400000) {
            return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
        }
        return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
    } catch { return ''; }
}

function openInboxDetail(messageId, scroll = true) {
    _inboxActiveId = messageId;
    const msg = messagesState.find(m => m.id === messageId);
    const detail = document.getElementById('inboxDetail');
    if (!detail) return;

    // Marcar activo en la lista
    document.querySelectorAll('.inbox-thread-item').forEach(el => {
        el.classList.toggle('is-active', el.dataset.msgId === messageId);
    });

    if (!msg) {
        detail.innerHTML = '<div class="inbox-detail-empty"><span>⚠️</span><p>Mensaje no encontrado</p></div>';
        return;
    }

    const isResolved = msg.status === 'resolved';
    const canResetPassword = msg.type === 'password_reset_request' && msg.customerPhoneDigits;
    const canReply = Boolean(msg.customerPhoneDigits) && msg.type !== 'admin_direct_reply';
    const canWhatsApp = Boolean(msg.customerPhoneDigits);

    detail.innerHTML = `
        <div class="inbox-detail-head">
            <div class="inbox-detail-avatar">${_inboxInitial(msg.customerName)}</div>
            <div class="inbox-detail-head-info">
                <div class="inbox-detail-head-name">${escapeHtml(msg.customerName || 'Sin nombre')}</div>
                <div class="inbox-detail-head-sub">${escapeHtml(msg.customerPhone || '')}${msg.customerAddress ? ' · ' + escapeHtml(msg.customerAddress) : ''}</div>
            </div>
            <div class="inbox-detail-head-actions">
                ${canWhatsApp ? `<button class="inbox-head-btn blue" data-message-action="whatsapp" data-message-id="${escapeHtml(msg.id)}">📲 WhatsApp</button>` : ''}
                ${canResetPassword ? `<button class="inbox-head-btn blue" data-message-action="reset-password" data-message-id="${escapeHtml(msg.id)}">🔑 Reset</button>` : ''}
                <button class="inbox-head-btn ${isResolved ? '' : 'green'}" data-message-action="resolve" data-message-id="${escapeHtml(msg.id)}">${isResolved ? '↩ Reabrir' : '✓ Atendido'}</button>
                <button class="inbox-head-btn red" data-message-action="delete" data-message-id="${escapeHtml(msg.id)}">🗑</button>
            </div>
        </div>
        <div class="inbox-messages-scroll" id="inboxMsgScroll">
            <span class="inbox-msg-info-chip">${_inboxGetTypeLabel(msg.type)} · ${escapeHtml(formatOrderDate(msg.createdAt))} · ${escapeHtml(msg.source || 'app')}</span>
            <div class="inbox-msg-group">
                <div class="inbox-bubble from-user">${escapeHtml(msg.subject || '')}</div>
                ${msg.body && msg.body !== msg.subject ? `<div class="inbox-bubble from-user">${escapeHtml(msg.body)}</div>` : ''}
                <span class="inbox-bubble-meta">${escapeHtml(_inboxFormatTime(msg.createdAt))}</span>
            </div>
            ${msg.adminReply ? `<div class="inbox-msg-group">
                <div class="inbox-bubble from-admin">${escapeHtml(msg.adminReply)}</div>
                <span class="inbox-bubble-meta">Admin · ${isResolved ? escapeHtml(_inboxFormatTime(msg.resolvedAt)) : ''}</span>
            </div>` : ''}
        </div>
        ${canReply ? `<div class="inbox-reply-bar">
            <textarea class="inbox-reply-input" id="inboxReplyInput" placeholder="Escribe una respuesta…" rows="1"></textarea>
            <button class="inbox-reply-send" data-message-action="reply" data-message-id="${escapeHtml(msg.id)}" title="Enviar">➤</button>
        </div>` : ''}
    `;

    if (scroll) {
        const scrollEl = detail.querySelector('#inboxMsgScroll');
        if (scrollEl) setTimeout(() => { scrollEl.scrollTop = scrollEl.scrollHeight; }, 50);
    }
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

    const greeting = String(messageText || `Hola ${name || 'cliente'}, te escribimos desde ${brandingState.restaurantName || 'Roal Burger'} sobre tu solicitud.`).trim();
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

    if (_posClientEditPending && posSelectedClientData) {
        _posClientEditPending = false;
        const refreshedClient = clientsState.find((c) => c.id === posSelectedClientData.id);
        if (refreshedClient) selectPosClient(refreshedClient);
    } else {
        _posClientEditPending = false;
    }

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
    renderClientAddrChips([]);
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
    renderClientAddrChips(client.savedAddresses || []);
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
        `Hola ${customerName}, tu contrasena de ${brandingState.restaurantName || 'Roal Burger'} ya fue restablecida.`,
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
        subject: `Respuesta de ${brandingState.restaurantName || 'Roal Burger'} para ${String(message.customerName || 'cliente').trim() || 'cliente'}`,
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

async function anularOrder(orderId) {
    await updateOrder(orderId, {
        anulado: true,
        anuladoAt: firestoreNow(),
        status: 'entregado',
        deliveredAt: firestoreNow()
    });
}

function renderBtPrinterStatus(status, deviceName) {
    const dot = document.getElementById('ticketBtDot');
    const label = document.getElementById('ticketBtLabel');
    const btn = document.getElementById('ticketBtBtn');
    if (!dot || !label || !btn) return;
    dot.dataset.status = status;
    if (status === 'connected') {
        label.textContent = `BT: ${deviceName || 'impresora'}`;
        btn.textContent = 'Desconectar';
        btn.dataset.btAction = 'disconnect';
    } else if (status === 'connecting') {
        label.textContent = 'Conectando...';
        btn.textContent = 'Cancelar';
        btn.dataset.btAction = '';
    } else {
        label.textContent = 'Sin impresora BT';
        btn.textContent = 'Buscar';
        btn.dataset.btAction = 'connect';
    }
}

async function connectBluetoothPrinter() {
    if (!navigator.bluetooth) {
        showNotice('Web Bluetooth no esta disponible en este navegador. Usa Chrome o Brave.', 'error');
        return;
    }
    try {
        renderBtPrinterStatus('connecting');
        const device = await navigator.bluetooth.requestDevice({
            acceptAllDevices: true,
            optionalServices: _BT_SERVICES,
        });
        const server = await device.gatt.connect();
        let char = null;

        // Intenta descubrir todos los servicios disponibles y busca una característica escribible
        for (const svcUuid of _BT_SERVICES) {
            if (char) break;
            try {
                const svc = await server.getPrimaryService(svcUuid);
                let chars = [];
                try { chars = await svc.getCharacteristics(); } catch (_) { /* ignorar */ }
                // Primero busca por UUID conocido
                for (const charUuid of _BT_TX_CHARS) {
                    try {
                        const c = await svc.getCharacteristic(charUuid);
                        if (c.properties.write || c.properties.writeWithoutResponse) { char = c; break; }
                    } catch (_) { /* siguiente */ }
                }
                // Si no encontró por UUID, toma la primera característica escribible descubierta
                if (!char) {
                    for (const c of chars) {
                        if (c.properties.write || c.properties.writeWithoutResponse) { char = c; break; }
                    }
                }
            } catch (_) { /* servicio no disponible */ }
        }

        if (!char) {
            showNotice('Impresora conectada pero no se encontro caracteristica de escritura. Verifica que sea la impresora correcta.', 'error');
            renderBtPrinterStatus('disconnected');
            return;
        }
        _btPrinterDevice = device;
        _btPrinterCharacteristic = char;
        device.addEventListener('gattserverdisconnected', () => {
            _btPrinterCharacteristic = null;
            renderBtPrinterStatus('connecting');
            setTimeout(() => {
                _btAutoReconnect().then((ok) => {
                    if (ok) { showNotice('Impresora Bluetooth reconectada.', 'ok'); }
                    else { renderBtPrinterStatus('disconnected'); showNotice('No se pudo reconectar la impresora BT.', 'error'); }
                });
            }, 2000);
        });
        renderBtPrinterStatus('connected', device.name || '');
        showNotice(`Impresora "${device.name || 'BT'}" conectada. Ya puedes imprimir.`, 'ok');
    } catch (err) {
        if (err.name !== 'NotFoundError') {
            showNotice(`Error Bluetooth: ${err.message || 'desconocido'}`, 'error');
        }
        renderBtPrinterStatus('disconnected');
    }
}

function disconnectBluetoothPrinter() {
    try { if (_btPrinterDevice?.gatt?.connected) _btPrinterDevice.gatt.disconnect(); } catch (_) { /* ignorar */ }
    _btPrinterDevice = null;
    _btPrinterCharacteristic = null;
    renderBtPrinterStatus('disconnected');
    showNotice('Impresora Bluetooth desconectada.', 'ok');
}

async function _btAutoReconnect() {
    if (!_btPrinterDevice) return false;
    try {
        const server = await _btPrinterDevice.gatt.connect();
        let char = null;
        for (const svcUuid of _BT_SERVICES) {
            if (char) break;
            try {
                const svc = await server.getPrimaryService(svcUuid);
                let chars = [];
                try { chars = await svc.getCharacteristics(); } catch (_) { /* ignorar */ }
                for (const charUuid of _BT_TX_CHARS) {
                    try {
                        const c = await svc.getCharacteristic(charUuid);
                        if (c.properties.write || c.properties.writeWithoutResponse) { char = c; break; }
                    } catch (_) { /* siguiente */ }
                }
                if (!char) {
                    for (const c of chars) {
                        if (c.properties.write || c.properties.writeWithoutResponse) { char = c; break; }
                    }
                }
            } catch (_) { /* servicio no disponible */ }
        }
        if (char) {
            _btPrinterCharacteristic = char;
            renderBtPrinterStatus('connected', _btPrinterDevice.name || '');
            return true;
        }
    } catch (_) { /* reconexion fallida */ }
    return false;
}

async function _btEnsureConnected() {
    if (_btPrinterDevice?.gatt?.connected && _btPrinterCharacteristic) return _btPrinterCharacteristic;
    if (_btPrinterDevice) {
        const ok = await _btAutoReconnect();
        if (ok) return _btPrinterCharacteristic;
    }
    return null;
}

function _escNormalize(str) {
    return String(str || '')
        .replace(/[áàâã]/g, 'a').replace(/[ÁÀÂÃ]/g, 'A')
        .replace(/[éèê]/g, 'e').replace(/[ÉÈÊ]/g, 'E')
        .replace(/[íìî]/g, 'i').replace(/[ÍÌÎ]/g, 'I')
        .replace(/[óòôõ]/g, 'o').replace(/[ÓÒÔÕ]/g, 'O')
        .replace(/[úùûü]/g, 'u').replace(/[ÚÙÛÜ]/g, 'U')
        .replace(/ñ/g, 'n').replace(/Ñ/g, 'N')
        .replace(/[¿¡]/g, '')
        .replace(/[—–]/g, '-')   // guion largo/corto → hyphen seguro
        .replace(/×/g, 'x')      // signo multiplicacion → x
        .replace(/[^\x20-\x7E]/g, ''); // elimina emojis y cualquier char fuera de ASCII imprimible
}

function buildESCPOSData(order) {
    const ESC = 0x1B; const GS = 0x1D; const LF = 0x0A;
    const COLS = 32;
    const bytes = [];
    const pb = (...a) => bytes.push(...a);

    // Emite una sola línea ya ajustada (uso interno de ww/wc)
    function _emit(line) {
        const s = _escNormalize(line);
        for (let i = 0; i < s.length; i++) pb(s.charCodeAt(i) & 0xFF);
        pb(LF);
    }
    // Imprime texto envolviéndolo por palabras — nunca corta
    function ww(str, prefix) {
        const pfx = _escNormalize(prefix || '');
        const s = _escNormalize(str);
        const contPfx = ' '.repeat(pfx.length);
        let firstLine = true;
        function emit(line) { _emit(line); firstLine = false; }
        const words = s.split(/\s+/).filter(Boolean);
        if (!words.length) return;
        let current = '';
        for (const word of words) {
            const lp = firstLine ? pfx : contPfx;
            const avail = COLS - lp.length;
            if (!current) {
                if (word.length > avail) {
                    let rem = word;
                    while (rem.length) {
                        const lp2 = firstLine ? pfx : contPfx;
                        const a2 = COLS - lp2.length;
                        emit(lp2 + rem.substring(0, a2));
                        rem = rem.substring(a2);
                    }
                } else { current = word; }
            } else {
                const test = current + ' ' + word;
                if (test.length <= avail) { current = test; }
                else { emit(lp + current); current = word; }
            }
        }
        if (current) emit((firstLine ? pfx : contPfx) + current);
    }
    // wl: envuelve si el texto supera COLS, nunca trunca
    function wl(str) { ww(str, ''); }
    function wc(left, right) {
        const l = _escNormalize(left); const r = _escNormalize(right);
        const maxLeft = COLS - r.length - 1;
        if (l.length <= maxLeft) {
            const pad = Math.max(1, COLS - l.length - r.length);
            _emit(l + ' '.repeat(pad) + r);
        } else {
            ww(l, '');
            const pad = Math.max(0, COLS - r.length);
            _emit(' '.repeat(pad) + r);
        }
    }
    function sep()  { _emit('-'.repeat(COLS)); }
    function sep2() { _emit('='.repeat(COLS)); }

    // ── ENCABEZADO ──────────────────────────────────────────────────────────
    pb(ESC, 0x40);
    pb(ESC, 0x61, 0x01);                        // centrar
    pb(ESC, 0x45, 0x01, ESC, 0x21, 0x30);       // negrita + doble tamaño
    wl(brandingState.restaurantName || 'ROAL BURGER');
    pb(ESC, 0x21, 0x00, ESC, 0x45, 0x00);       // normal
    wl('Ticket de Recepcion');
    pb(ESC, 0x61, 0x00);                        // alinear izquierda
    sep2();

    // ── DATOS DEL PEDIDO ────────────────────────────────────────────────────
    wl('Pedido : ' + (order.code || 'N/A'));
    wl('Fecha  : ' + formatOrderDate(order.createdAt));
    wl('Hora   : ' + formatOrderTime(order.createdAt));
    sep();

    // ── CLIENTE ─────────────────────────────────────────────────────────────
    pb(ESC, 0x45, 0x01); wl('CLIENTE'); pb(ESC, 0x45, 0x00);
    wl('  Nombre : ' + (order.customerName || 'N/A'));
    if (order.customerPhone) wl('  Tel    : ' + order.customerPhone);
    wl('  Tipo   : ' + getOrderTypeLabel(order));
    if (order.orderType === 'domicilio' && order.deliveryAddress) {
        ww(order.deliveryAddress, '  Dir    : ');
    }
    sep2();

    // ── PRODUCTOS ───────────────────────────────────────────────────────────
    pb(ESC, 0x45, 0x01);
    wc('  CANT  DESCRIPCION', 'TOTAL');
    pb(ESC, 0x45, 0x00);
    sep();
    for (const item of (order.items || [])) {
        const qty = String(item.quantity).padStart(2);
        wc(`  ${qty}   ${item.productName}`, formatMoney(item.subtotal));
        if (item.optionLabel) ww('> ' + item.optionLabel, '       ');
        if (item.note && item.note !== item.optionLabel) {
            const isBebNota = /^\s*[\uD800-\uDFFF\u{1F300}-\u{1FFFF}]/u.test(item.note);
            const notaText = item.note.replace(/^[\s\uD800-\uDFFF\u{1F300}-\u{1FFFF}]+/u, '').trim();
            ww((isBebNota ? 'Beb: ' : 'Nota: ') + notaText, '       ');
        }
    }
    sep2();

    // ── TOTALES ─────────────────────────────────────────────────────────────
    wc('  Subtotal', formatMoney(order.subtotal || 0));
    if (order.orderType === 'domicilio') wc('  Domicilio', formatMoney(order.deliveryFee || 0));
    sep();
    pb(ESC, 0x45, 0x01, ESC, 0x21, 0x10);       // negrita + doble alto
    wc('  TOTAL', formatMoney(getOrderDisplayTotal(order)));
    pb(ESC, 0x21, 0x00, ESC, 0x45, 0x00);
    sep2();

    // ── PAGO ────────────────────────────────────────────────────────────────
    const _cashGiven  = Number(order.cashTenderAmount || 0);
    const _totalAmt   = getOrderDisplayTotal(order);
    const _changeAmt  = order.cashChangeRequired
        ? (order.cashChangeAmount != null ? Number(order.cashChangeAmount) : (_cashGiven > _totalAmt ? _cashGiven - _totalAmt : 0))
        : 0;
    const _payLabel   = getOrderPaymentLabel(order);
    const [_payMethod] = _payLabel.split(' | ');

    pb(ESC, 0x45, 0x01); wl('PAGO'); pb(ESC, 0x45, 0x00);
    if (order.paymentMethod === 'split' && Array.isArray(order.paymentSplit) && order.paymentSplit.length) {
        wl('  Pago dividido:');
        for (const s of order.paymentSplit) {
            const pm = getPaymentMethods().find((x) => x.id === s.method);
            wc('    ' + (pm ? pm.label : s.method), formatMoney(Number(s.amount)));
        }
    } else if (order.paymentMethod === 'efectivo') {
        wl('  Metodo  : Efectivo');
        if (_cashGiven > 0) {
            wc('  Recibe', formatMoney(_cashGiven));
            wc('  Cambio', _changeAmt > 0 ? formatMoney(_changeAmt) : 'Exacto');
        }
    } else {
        wl('  Metodo  : ' + _payMethod);
        if (order.paymentMethod && order.paymentMethod !== 'pendiente') {
            pb(ESC, 0x45, 0x01); wl('  ** PAGADO **'); pb(ESC, 0x45, 0x00);
        }
    }
    sep2();

    // ── PIE DE PAGINA ───────────────────────────────────────────────────────
    pb(ESC, 0x61, 0x01);
    pb(ESC, 0x45, 0x01); wl('Gracias por elegirnos!'); pb(ESC, 0x45, 0x00);
    if (brandingState.address) wl(brandingState.address);
    pb(LF, LF, LF);
    pb(GS, 0x56, 0x00);

    return new Uint8Array(bytes);
}

async function _btWriteChunk(char, slice) {
    // Intenta sin respuesta primero (más común en impresoras térmicas), luego con respuesta
    if (char.properties?.writeWithoutResponse) {
        try { await char.writeValueWithoutResponse(slice); return; } catch (_) { /* fallback */ }
    }
    await char.writeValue(slice);
}

async function printViaBluetoothESCPOS(order) {
    const char = await _btEnsureConnected();
    if (!char) return false;
    const data = buildESCPOSData(order);
    const CHUNK = 20;
    try {
        for (let i = 0; i < data.length; i += CHUNK) {
            await _btWriteChunk(char, data.slice(i, i + CHUNK));
            await new Promise((r) => setTimeout(r, 80));
        }
        return true;
    } catch (err) {
        showNotice(`Error Bluetooth: ${err.message || 'desconocido'}. Imprimiendo por navegador…`, 'error');
        return false;
    }
}

async function openOrderPrintTicket(orderId) {
    const order = ordersState.find((entry) => entry.id === orderId);
    if (!order) {
        showNotice('No se encontro el pedido para imprimir.', 'error');
        return;
    }

    // Solo usa BT si ya hay una impresora emparejada en esta sesión
    if (_btPrinterDevice) {
        const ok = await printViaBluetoothESCPOS(order);
        if (ok) { showNotice('Ticket enviado a la impresora.', 'ok'); return; }
    }

    // Sin BT activo → diálogo de impresión del navegador (Android/PC)
    _printOrderViaBrowser(order);
}

function _printOrderViaBrowser(order) {
    const markup = buildThermalTicketMarkup(order, { printMode: true });

    // CSS inline completo para que el documento sea autónomo (PrintHand no ejecuta JS ni carga hojas externas)
    const css = [
        '*{box-sizing:border-box;margin:0;padding:0}',
        '@page{size:58mm auto;margin:2mm 3mm}',
        'html,body{width:58mm;max-width:58mm;margin:0;padding:0;background:#fff;color:#000;font-family:"Courier New",Courier,monospace;font-size:9pt;line-height:1.35}',
        '.ticket-paper-wrap,.ticket-paper{width:52mm;margin:0 auto;background:#fff;color:#000;font-family:"Courier New",Courier,monospace;font-size:9pt;line-height:1.35;overflow:visible}',
        '.ticket-brand{text-align:center;padding-bottom:4px;border-bottom:1px dashed #000;margin-bottom:5px}',
        '.ticket-brand-name{font-size:13pt;font-weight:700;letter-spacing:1px;text-transform:uppercase;line-height:1.2;color:#000}',
        '.ticket-brand-copy{font-size:7.5pt;color:#444}',
        '.ticket-order-meta{display:flex;justify-content:space-between;font-size:7.5pt;color:#444;margin-bottom:3px}',
        '.ticket-section{margin-top:5px;padding-top:5px;border-top:1px dashed #ccc;page-break-inside:avoid}',
        '.ticket-section-title{font-size:7pt;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#555;margin-bottom:3px}',
        '.ticket-customer-card{font-size:8pt}',
        '.ticket-customer-row{display:flex;justify-content:space-between;gap:4px;font-size:8pt;margin-bottom:1px}',
        '.ticket-copy-btn-name{font-size:8.5pt;font-weight:700;display:block;margin-bottom:2px}',
        '.ticket-copy-btn-inline{font-size:8pt}',
        '.ticket-copy-btn{background:none;border:none;padding:0;font:inherit;color:inherit;cursor:default;display:inline}',
        '.ticket-address-block{font-size:8pt}',
        '.ticket-address-text{white-space:normal;word-break:break-word;overflow-wrap:break-word;font-size:8pt}',
        '.ticket-table{width:100%;border-collapse:collapse;font-size:8.5pt}',
        '.ticket-table th{font-size:7pt;text-transform:uppercase;font-weight:700;text-align:left;border-bottom:1px solid #000;padding-bottom:2px}',
        '.ticket-table th:last-child,.ticket-table td:last-child{text-align:right}',
        '.ticket-table td{padding:1px 0;vertical-align:top}',
        '.ticket-table td strong{display:block}',
        '.ticket-line-meta{display:block;font-size:7.5pt;color:#555;padding-left:4px}',
        '.ticket-total{margin-top:5px;padding-top:5px;border-top:1px dashed #ccc}',
        '.ticket-summary-line,.ticket-total-row{display:flex;justify-content:space-between;font-size:8.5pt;gap:4px;color:#000}',
        '.ticket-total-row.is-grand-total{font-size:11pt;font-weight:700;border-top:1px solid #000;padding-top:3px;margin-top:2px}',
        '.ticket-footer-copy{margin-top:6px;padding-top:5px;border-top:1px dashed #ccc;text-align:center;font-size:7.5pt;color:#444;line-height:1.4;display:flex;flex-direction:column;gap:1px}',
        '.ticket-promo-banner{display:flex;align-items:flex-start;gap:6px;margin:4px 0;padding:4px 6px;border:1px dashed #888;font-size:7.5pt}',
        '.ticket-promo-title{font-weight:700;font-size:7pt;text-transform:uppercase}',
        '.ticket-promo-label{font-size:7.5pt}',
        '.ticket-print-row,.ticket-print-btn,.ticket-action-btn,.ticket-cobrar-btn,.ticket-contact-btn,.ticket-wa-btn,.ticket-kitchen-btn,.ticket-bt-bar,.state-pill{display:none!important}',
        '._ph-btn{display:block;width:100%;margin:16px 0 8px;padding:12px;background:#ff7a1a;color:#fff;border:0;border-radius:8px;font-size:15px;font-weight:700;cursor:pointer;letter-spacing:.5px;text-align:center}',
        '@media print{._ph-btn{display:none!important}}',
    ].join('');

    const html = '<!DOCTYPE html><html lang="es"><head>' +
        '<meta charset="UTF-8">' +
        '<meta name="viewport" content="width=device-width,initial-scale=1">' +
        '<title>Ticket #' + (order.code || '') + '</title>' +
        '<style>' + css + '</style>' +
        '</head><body>' +
        markup +
        '<div style="padding:12px 0 24px;">' +
        '<button class="_ph-btn" onclick="window.print()">Imprimir ticket</button>' +
        '<p style="text-align:center;font-size:11px;color:#888;margin-top:8px;">Verifica el ticket y toca el boton para imprimir</p>' +
        '</div>' +
        '</body></html>';

    showNotice('Selecciona tu impresora en el dialogo de Chrome.', 'ok');

    try {
        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const win = window.open(url, '_blank');
        if (win) {
            setTimeout(() => { URL.revokeObjectURL(url); }, 60000);
            return;
        }
        URL.revokeObjectURL(url);
    } catch (_) { /* fallback si Blob falla */ }

    // Fallback: imprimir en la misma página si la ventana fue bloqueada
    const printArea = document.getElementById('thermalPrintArea');
    if (!printArea) { showNotice('Error interno: area de impresion no encontrada.', 'error'); return; }
    printArea.innerHTML = markup;
    const cleanup = () => { printArea.innerHTML = ''; window.removeEventListener('afterprint', cleanup); };
    window.addEventListener('afterprint', cleanup);
    setTimeout(() => { window.print(); }, 150);
}

function buildKitchenTicketHtml(order) {
    const restaurantName = escapeHtml(brandingState.restaurantName || 'Roal Burger');
    const orderCode      = escapeHtml(order.code || '');
    const orderHour      = escapeHtml(formatOrderTime(order.createdAt));

    const orderTypeLabel = order.orderType === 'mesa'
        ? `MESA ${order.mesaNumber || '?'}`
        : order.orderType === 'domicilio' ? 'DOMICILIO' : 'RECOGER';

    const _rawAddr    = String(order.deliveryAddress || '').trim();
    const _shortAddr  = _rawAddr.length > 55 ? _rawAddr.slice(0, 52) + '…' : _rawAddr;
    const addressLine = (order.orderType === 'domicilio' && _rawAddr)
        ? `<div class="k-address" title="${escapeHtml(_rawAddr)}">${escapeHtml(_shortAddr)}</div>`
        : '';

    const products = (order.items || []).map((item) => {
        const details = [item.categoryName, item.optionLabel]
            .filter(Boolean)
            .map((p) => `<div class="k-detail">${escapeHtml(p)}</div>`)
            .join('');
        const note = item.note ? `<div class="k-note">⚠ ${escapeHtml(item.note)}</div>` : '';
        return `<div class="k-product">
            <div class="k-qty-name">${escapeHtml(String(item.quantity))}x ${escapeHtml(item.productName)}</div>
            ${details}${note}
        </div>`;
    }).join('');

    return `
        <div class="ticket-paper-wrap">
            <article class="ticket-paper k-paper">
                <div class="k-header">
                    <div class="k-brand">${restaurantName}</div>
                    <div class="k-order-code">#${orderCode}</div>
                    <div class="k-time">${orderHour}</div>
                </div>
                <div class="k-type-badge">${escapeHtml(orderTypeLabel)}</div>
                ${addressLine}
                <div class="k-products">${products}</div>
                <div class="k-footer">— Ticket de Cocina —</div>
            </article>
        </div>`;
}

function openKitchenPrintTicket(orderId) {
    const order = ordersState.find((e) => e.id === orderId);
    if (!order) { showNotice('Pedido no encontrado.', 'error'); return; }

    const printArea = document.getElementById('thermalPrintArea');
    if (!printArea) { showNotice('Error interno: área de impresión no encontrada.', 'error'); return; }

    // Sobrescribir @page a 80mm solo durante esta impresión
    const pageStyle = document.createElement('style');
    pageStyle.textContent = '@media print { @page { size: 80mm auto; margin: 3mm 5mm; } }';
    document.head.appendChild(pageStyle);

    printArea.innerHTML = buildKitchenTicketHtml(order);
    printArea.classList.add('kitchen-mode');
    showNotice('Abriendo dialogo de impresion — selecciona tu impresora.', 'ok');

    const cleanup = () => {
        printArea.innerHTML = '';
        printArea.classList.remove('kitchen-mode');
        pageStyle.remove();
        window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);

    setTimeout(() => { window.print(); }, 150);
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

function _scheduleLiveReload() {
    clearTimeout(_liveReloadTimer);
    _liveReloadTimer = setTimeout(async () => {
        await reloadDataAndRender();
        queueLivePreviewRefresh();
    }, 1500);
}

function _makeDebouncedHandler(fn, delay) {
    let t = null;
    return () => { clearTimeout(t); t = setTimeout(fn, delay); };
}

function setupLiveFirebaseSync() {
    if (!firebaseDb) return;

    liveSubscriptions.forEach((u) => u());
    liveSubscriptions = [];

    const onErr = (name) => (err) => console.warn(`[ADMIN] ${name} listener error:`, err.code || err.message);

    // Pedidos: solo últimos 30 días para reducir lecturas Firestore
    liveSubscriptions.push(
        firebaseDb.collection(ORDERS_COLLECTION)
            .where('createdAt', '>=', _ordersCutoff())
            .orderBy('createdAt', 'desc')
            .onSnapshot(
                _makeDebouncedHandler(async () => {
                    await fetchOrders();
                    announceNewOrders(ordersState);
                    renderOrders();
                }, 600),
                onErr('pedidos')
            )
    );

    // Mensajes: últimos 200, ordenados por fecha
    liveSubscriptions.push(
        firebaseDb.collection(MESSAGES_COLLECTION)
            .orderBy('createdAt', 'desc')
            .limit(200)
            .onSnapshot(
                _makeDebouncedHandler(async () => {
                    await fetchMessages();
                    renderMessages();
                    updateMessagesAttentionState();
                }, 700),
                onErr('mensajes')
            )
    );

    // Ventas/resumen: solo recarga resúmenes
    const salesHandler = _makeDebouncedHandler(async () => {
        await Promise.all([fetchSalesSummaries(), fetchSalesDayState()]);
        renderSalesSummaries();
        renderCajaDiaria();
        renderSalesDayBanner();
    }, 800);
    liveSubscriptions.push(
        firebaseDb.collection(SALES_SUMMARY_COLLECTION)
            .orderBy('closedAt', 'desc')
            .limit(180)
            .onSnapshot(salesHandler, onErr('ventas'))
    );
    liveSubscriptions.push(
        firebaseDb.collection(SALES_DAY_STATE_COLLECTION).onSnapshot(salesHandler, onErr('caja-dia'))
    );

    // Config general: recarga completa (afecta todo el UI)
    // Catálogo (productos/categorías/botones/promos) NO tiene listener en tiempo real —
    // se recarga automáticamente después de cada acción de guardado del admin.
    liveSubscriptions.push(
        firebaseDb.collection(CONFIG_COLLECTION).doc(CONFIG_DOC_ID).onSnapshot(
            _scheduleLiveReload,
            onErr('config')
        )
    );
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

function renderHorarioForm() {
    if (!horarioForm) horarioForm = document.getElementById('horarioForm');
    if (!horarioForm) return;
    const pad = (n) => String(Number(n) || 0).padStart(2, '0');
    horarioForm.elements['horarioApertura'].value = `${pad(horarioState.aperturaHora)}:${pad(horarioState.aperturaMinuto)}`;
    horarioForm.elements['horarioCierre'].value = `${pad(horarioState.cierreHora)}:${pad(horarioState.cierreMinuto)}`;
    horarioForm.elements['horarioEtiqueta'].value = horarioState.etiquetaHorario || '';
    horarioForm.elements['horarioMensajeCierre'].value = horarioState.mensajeCierre || '';

    const estadoEl = document.getElementById('horarioEstadoActual');
    if (estadoEl) {
        const now = new Date();
        const parts = new Intl.DateTimeFormat('en-GB', {
            timeZone: 'America/Bogota', hour: '2-digit', minute: '2-digit', hour12: false
        }).formatToParts(now);
        const h = Number(parts.find((p) => p.type === 'hour')?.value || 0);
        const m = Number(parts.find((p) => p.type === 'minute')?.value || 0);
        const mins = h * 60 + m;
        const isOpen = mins >= horarioState.aperturaHora * 60 + horarioState.aperturaMinuto &&
                       mins < horarioState.cierreHora * 60 + horarioState.cierreMinuto;
        estadoEl.innerHTML = `Estado actual (hora Colombia): <strong style="color:${isOpen ? '#4cda64' : '#ff6b6b'}">${isOpen ? 'ABIERTO' : 'CERRADO'}</strong>`;
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

    const bizEmailEl = document.getElementById('bizCurrentEmail');
    if (bizEmailEl && firebaseAuth?.currentUser?.email) {
        bizEmailEl.value = firebaseAuth.currentUser.email;
    }

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

async function fetchRecomendadoDiaConfig() {
    try {
        const doc = await firebaseDb.collection(CONFIG_COLLECTION).doc(RECOMENDADO_DIA_DOC_ID).get();
        recomendadoDiaState = doc.exists ? doc.data() : null;
    } catch (error) {
        recomendadoDiaState = null;
    }
}

async function fetchPromos() {
    try {
        const snap = await firebaseDb.collection(PROMOCIONES_COLLECTION).get();
        promosState = snap.docs
            .map((doc) => ({ id: doc.id, ...doc.data() }))
            .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
    } catch (_) {
        promosState = [];
    }
}

async function fetchCombosEspeciales() {
    try {
        const snap = await firebaseDb.collection(COMBOS_ESPECIALES_COLLECTION).get();
        combosEspecialesState = snap.docs
            .map((doc) => ({ id: doc.id, ...doc.data() }))
            .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
    } catch (_) {
        combosEspecialesState = [];
    }
}

async function fetchPromos2x1() {
    try {
        const snap = await firebaseDb.collection(PROMOS_2X1_COLLECTION).get();
        promos2x1State = snap.docs
            .map((doc) => ({ id: doc.id, ...doc.data() }))
            .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
    } catch (_) {
        promos2x1State = [];
    }
}

function renderRecomendadoDiaPanel() {
    const autoRadio = document.getElementById('recomendadoModeAuto');
    const manualRadio = document.getElementById('recomendadoModeManual');
    const manualPanel = document.getElementById('recomendadoManualPanel');
    const currentBox = document.getElementById('recomendadoCurrentBox');
    const saveBtn = document.getElementById('saveRecomendadoDiaBtn');
    if (!autoRadio || !manualRadio) return;

    const isManual = recomendadoDiaState && recomendadoDiaState.activo;
    autoRadio.checked = !isManual;
    manualRadio.checked = !!isManual;

    if (manualPanel) manualPanel.hidden = !isManual;
    if (saveBtn) saveBtn.disabled = false;

    if (isManual && recomendadoDiaState.producto_id) {
        _recomendadoSelectedProductId = recomendadoDiaState.producto_id;
        const product = productsState.find((p) => p.id === recomendadoDiaState.producto_id);
        renderRecomendadoCurrentBox(product || null);
    } else {
        _recomendadoSelectedProductId = null;
        if (currentBox) currentBox.hidden = true;
    }
}

function renderRecomendadoCurrentBox(product) {
    const currentBox = document.getElementById('recomendadoCurrentBox');
    if (!currentBox) return;
    if (!product) {
        currentBox.hidden = true;
        return;
    }
    const img = String(product.image_url || '').trim() || 'logo.png';
    const nombre = String(product.nombre || product.name || '').trim();
    const categoria = String(product.categoria || product.category || '').trim();
    currentBox.innerHTML = `
        <img src="${img}" alt="${nombre}" onerror="this.src='logo.png'">
        <div class="recomendado-current-info">
            <span class="recomendado-current-label">Seleccionado</span>
            <span class="recomendado-current-name">${nombre}</span>
            <span class="recomendado-current-cat">${categoria}</span>
        </div>`;
    currentBox.hidden = false;
}

function _renderRecomendadoSearchResults(term) {
    const resultsEl = document.getElementById('recomendadoSearchResults');
    if (!resultsEl) return;
    const q = String(term || '').trim().toLowerCase();
    if (!q) {
        resultsEl.hidden = true;
        resultsEl.innerHTML = '';
        return;
    }
    const matches = productsState
        .filter((p) => {
            const nombre = String(p.nombre || p.name || '').toLowerCase();
            return nombre.includes(q);
        })
        .slice(0, 8);
    if (!matches.length) {
        resultsEl.innerHTML = '<li style="padding:10px 14px;color:var(--admin-muted)">Sin resultados</li>';
        resultsEl.hidden = false;
        return;
    }
    resultsEl.innerHTML = matches.map((p) => {
        const img = String(p.image_url || '').trim() || 'logo.png';
        const nombre = String(p.nombre || p.name || '').trim();
        const categoria = String(p.categoria || p.category || '').trim();
        const isSelected = p.id === _recomendadoSelectedProductId ? ' is-selected' : '';
        return `<li class="recomendado-result-item${isSelected}" data-recomendado-product-id="${p.id}">
            <img src="${img}" alt="${nombre}" onerror="this.src='logo.png'">
            <div class="recomendado-result-info">
                <span class="recomendado-result-name">${nombre}</span>
                <span class="recomendado-result-cat">${categoria}</span>
            </div>
        </li>`;
    }).join('');
    resultsEl.hidden = false;
}

async function saveRecomendadoDiaConfig() {
    const saveBtn = document.getElementById('saveRecomendadoDiaBtn');
    const manualRadio = document.getElementById('recomendadoModeManual');
    if (!manualRadio) return;
    const isManual = manualRadio.checked;

    if (isManual && !_recomendadoSelectedProductId) {
        showNotice('Selecciona un producto para el modo manual.', 'error');
        return;
    }

    if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Guardando...'; }

    try {
        const selectedProduct = _recomendadoSelectedProductId
            ? productsState.find((p) => p.id === _recomendadoSelectedProductId)
            : null;

        const payload = {
            activo: isManual,
            producto_id: isManual && selectedProduct ? selectedProduct.id : null,
            producto_nombre: isManual && selectedProduct ? String(selectedProduct.nombre || '').trim() : null,
            producto_categoria: isManual && selectedProduct ? String(selectedProduct.categoria || '').trim() : null,
            updated_at: firestoreNow()
        };

        await firebaseDb.collection(CONFIG_COLLECTION).doc(RECOMENDADO_DIA_DOC_ID).set(payload, { merge: true });
        recomendadoDiaState = payload;
        showNotice(isManual ? 'Recomendado manual guardado.' : 'Recomendado automatico activado.', 'ok');
    } catch (error) {
        showNotice(`No se pudo guardar: ${error.message || 'Error inesperado.'}`, 'error');
    } finally {
        if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Guardar'; }
    }
}

// ===== PANEL PROMOCIONES ADMIN =====

function renderPromosTabPanel() {
    const container = document.getElementById('promosTabPanel');
    if (!container) return;

    const isFormOpen = _promoEditingId !== null;

    container.innerHTML = `
        <div style="padding:16px 0;">
            <p class="admin-hint">Las promociones adicionales aparecen en la pantalla Promociones del menú público, debajo del Recomendado del Día. Cada una es totalmente configurable.</p>
            ${!isFormOpen ? `<button type="button" class="admin-button" id="addPromoBtn" style="margin-top:14px;">+ Agregar Promoción</button>` : _buildPromoFormHTML()}
            <div class="promo-admin-list" id="promoAdminList" style="margin-top:18px;">
                ${promosState.length === 0 && !isFormOpen
                    ? '<p class="admin-hint" style="text-align:center;margin-top:24px;">Sin promociones aún. Usa el botón de arriba para crear una.</p>'
                    : promosState.map(_buildPromoAdminCardHTML).join('')}
            </div>
        </div>`;

    document.getElementById('addPromoBtn')?.addEventListener('click', () => {
        _promoEditingId = 'new';
        _promoFormProductId = null;
        renderPromosTabPanel();
    });

    if (isFormOpen) {
        const searchInput = document.getElementById('promoFormProductSearch');
        searchInput?.addEventListener('input', (e) => _renderPromoFormSearchResults(e.target.value));
        document.getElementById('promoFormSaveBtn')?.addEventListener('click', savePromo);
        document.getElementById('promoFormCancelBtn')?.addEventListener('click', () => {
            _promoEditingId = null;
            _promoFormProductId = null;
            renderPromosTabPanel();
        });
    }

    container.querySelectorAll('[data-promo-action]').forEach((btn) => {
        btn.addEventListener('click', async () => {
            const action = btn.dataset.promoAction;
            const id = btn.dataset.promoId;
            if (action === 'edit') {
                _promoEditingId = id;
                const promo = promosState.find((p) => p.id === id);
                _promoFormProductId = promo?.producto_id || null;
                renderPromosTabPanel();
            } else if (action === 'delete') {
                deleteAdminPromo(id);
            } else if (action === 'toggle') {
                const promo = promosState.find((p) => p.id === id);
                if (promo) {
                    await firebaseDb.collection(PROMOCIONES_COLLECTION).doc(id).update({ activo: !promo.activo, updated_at: firestoreNow() });
                }
            }
        });
    });
}

function _buildPromoAdminCardHTML(promo) {
    const product = productsState.find((p) => p.id === promo.producto_id);
    const img = product?.image_url || 'logo.png';
    const nombre = promo.producto_nombre || 'Sin producto';
    const badge = promo.badge || '';
    const descuento = promo.descuento || 0;
    const activo = promo.activo !== false;
    return `
        <div class="promo-admin-card">
            <img class="promo-admin-card__img" src="${escapeHtml(img)}" alt="${escapeHtml(nombre)}" onerror="this.src='logo.png'">
            <div class="promo-admin-card__info">
                <span class="promo-admin-card__badge">${escapeHtml(badge)}</span>
                <strong class="promo-admin-card__name">${escapeHtml(nombre)}</strong>
                <span class="promo-admin-card__desc">${escapeHtml(promo.kicker || '')}${descuento ? ` · -${descuento}%` : ''}</span>
            </div>
            <div class="promo-admin-card__actions">
                <button type="button" class="promo-toggle-btn ${activo ? 'is-active' : ''}" data-promo-action="toggle" data-promo-id="${promo.id}">${activo ? '● Activo' : '○ Inactivo'}</button>
                <button type="button" class="ghost-button" data-promo-action="edit" data-promo-id="${promo.id}" style="padding:4px 10px;font-size:0.78rem;">Editar</button>
                <button type="button" class="ghost-button danger" data-promo-action="delete" data-promo-id="${promo.id}" style="padding:4px 10px;font-size:0.78rem;">Eliminar</button>
            </div>
        </div>`;
}

function _buildPromoFormHTML() {
    const isEditing = _promoEditingId && _promoEditingId !== 'new';
    const promo = isEditing ? promosState.find((p) => p.id === _promoEditingId) : null;
    const product = _promoFormProductId ? productsState.find((p) => p.id === _promoFormProductId) : null;
    const productBoxHTML = product ? `
        <div class="recomendado-current-box" id="promoFormCurrentBox" style="margin-top:6px;margin-bottom:4px;">
            <img src="${escapeHtml(product.image_url || 'logo.png')}" alt="${escapeHtml(product.nombre || '')}" onerror="this.src='logo.png'">
            <div class="recomendado-current-info">
                <span class="recomendado-current-label">Seleccionado</span>
                <span class="recomendado-current-name">${escapeHtml(product.nombre || '')}</span>
                <span class="recomendado-current-cat">${escapeHtml(product.categoria || '')}</span>
            </div>
        </div>` : '';
    return `
        <div class="promo-admin-form" style="margin-top:16px;">
            <h4 style="margin:0 0 14px;font-family:'Oswald',sans-serif;font-size:1rem;text-transform:uppercase;letter-spacing:.08em;color:var(--admin-accent);">${isEditing ? 'Editar promoción' : 'Nueva promoción'}</h4>
            <div class="admin-field full" style="position:relative;">
                <label for="promoFormProductSearch">Producto</label>
                <input type="search" id="promoFormProductSearch" class="admin-input" placeholder="Buscar producto..." autocomplete="off" value="${product ? escapeHtml(product.nombre || '') : ''}">
                <ul id="promoFormSearchResults" class="recomendado-results" hidden></ul>
            </div>
            ${productBoxHTML}
            <div class="admin-field" style="margin-top:10px;">
                <label for="promoFormKicker">Etiqueta (kicker)</label>
                <input type="text" id="promoFormKicker" class="admin-input" placeholder="Ej: Promo Especial" value="${escapeHtml(promo?.kicker || 'Promo Especial')}">
            </div>
            <div class="admin-field" style="margin-top:10px;">
                <label for="promoFormBadge">Badge de descuento</label>
                <input type="text" id="promoFormBadge" class="admin-input" placeholder="Ej: -15% HOY" value="${escapeHtml(promo?.badge || '')}">
            </div>
            <div class="admin-field" style="margin-top:10px;">
                <label for="promoFormDescuento">Descuento (%)</label>
                <input type="number" id="promoFormDescuento" class="admin-input" min="0" max="100" placeholder="15" value="${promo?.descuento ?? ''}">
            </div>
            <div style="display:flex;gap:10px;margin-top:16px;">
                <button type="button" class="admin-button" id="promoFormSaveBtn">Guardar</button>
                <button type="button" class="ghost-button" id="promoFormCancelBtn" style="padding:8px 16px;">Cancelar</button>
            </div>
        </div>`;
}

function _renderPromoFormSearchResults(query) {
    const resultsEl = document.getElementById('promoFormSearchResults');
    if (!resultsEl) return;
    const q = (query || '').trim().toLowerCase();
    if (!q) { resultsEl.hidden = true; resultsEl.innerHTML = ''; return; }

    const matches = productsState
        .filter((p) => (p.nombre || '').toLowerCase().includes(q))
        .slice(0, 8);

    if (!matches.length) { resultsEl.hidden = true; return; }

    resultsEl.hidden = false;
    resultsEl.innerHTML = matches.map((p) => `
        <li class="recomendado-result-item ${_promoFormProductId === p.id ? 'is-selected' : ''}" data-promo-product-id="${p.id}">
            <img src="${escapeHtml(p.image_url || 'logo.png')}" alt="" width="32" height="32" style="border-radius:6px;object-fit:cover;flex-shrink:0;" onerror="this.src='logo.png'">
            <div class="recomendado-result-info">
                <span class="recomendado-result-name">${escapeHtml(p.nombre || '')}</span>
                <span class="recomendado-result-cat">${escapeHtml(p.categoria || '')}</span>
            </div>
        </li>`).join('');

    resultsEl.querySelectorAll('[data-promo-product-id]').forEach((li) => {
        li.addEventListener('click', () => {
            _promoFormProductId = li.dataset.promoProductId;
            const selected = productsState.find((p) => p.id === _promoFormProductId);
            const searchInput = document.getElementById('promoFormProductSearch');
            if (searchInput && selected) searchInput.value = selected.nombre || '';
            resultsEl.hidden = true;

            // Actualiza la caja del producto seleccionado sin re-renderizar todo
            const existingBox = document.getElementById('promoFormCurrentBox');
            const img = selected?.image_url || 'logo.png';
            const boxHTML = `
                <img src="${escapeHtml(img)}" alt="${escapeHtml(selected?.nombre || '')}" onerror="this.src='logo.png'">
                <div class="recomendado-current-info">
                    <span class="recomendado-current-label">Seleccionado</span>
                    <span class="recomendado-current-name">${escapeHtml(selected?.nombre || '')}</span>
                    <span class="recomendado-current-cat">${escapeHtml(selected?.categoria || '')}</span>
                </div>`;
            if (existingBox) {
                existingBox.innerHTML = boxHTML;
                existingBox.hidden = false;
            } else {
                const newBox = document.createElement('div');
                newBox.className = 'recomendado-current-box';
                newBox.id = 'promoFormCurrentBox';
                newBox.style.marginTop = '6px';
                newBox.style.marginBottom = '4px';
                newBox.innerHTML = boxHTML;
                const fieldEl = document.getElementById('promoFormProductSearch')?.closest('.admin-field');
                if (fieldEl) fieldEl.insertAdjacentElement('afterend', newBox);
            }
        });
    });
}

async function savePromo() {
    const kicker = (document.getElementById('promoFormKicker')?.value || '').trim();
    const badge  = (document.getElementById('promoFormBadge')?.value || '').trim();
    const descuento = Number(document.getElementById('promoFormDescuento')?.value || 0);

    if (!_promoFormProductId) { showNotice('Selecciona un producto para la promoción.', 'error'); return; }
    if (!badge)               { showNotice('El badge de descuento es obligatorio. Ej: -15% HOY', 'error'); return; }

    const product = productsState.find((p) => p.id === _promoFormProductId);
    const payload = {
        kicker:              kicker || 'Promo Especial',
        badge,
        descuento,
        producto_id:         _promoFormProductId,
        producto_nombre:     product?.nombre || '',
        producto_categoria:  product?.categoria || '',
        activo:              true,
        updated_at:          firestoreNow()
    };

    const saveBtn = document.getElementById('promoFormSaveBtn');
    if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Guardando...'; }

    try {
        if (_promoEditingId && _promoEditingId !== 'new') {
            await firebaseDb.collection(PROMOCIONES_COLLECTION).doc(_promoEditingId).update(payload);
        } else {
            const maxOrden = promosState.reduce((m, p) => Math.max(m, p.orden ?? 0), 0);
            await firebaseDb.collection(PROMOCIONES_COLLECTION).add({ ...payload, orden: maxOrden + 1, created_at: firestoreNow() });
        }
        _promoEditingId = null;
        _promoFormProductId = null;
        await reloadDataAndRender();
        renderPromosTabPanel();
        showNotice('Promoción guardada.', 'ok');
    } catch (err) {
        showNotice('Error al guardar la promoción.', 'error');
        if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Guardar'; }
    }
}

async function deleteAdminPromo(id) {
    const promo = promosState.find((p) => p.id === id);
    if (!window.confirm(`¿Eliminar la promoción "${promo?.badge || promo?.producto_nombre || ''}"?`)) return;
    try {
        await firebaseDb.collection(PROMOCIONES_COLLECTION).doc(id).delete();
        showNotice('Promoción eliminada.', 'ok');
    } catch (err) {
        showNotice('Error al eliminar la promoción.', 'error');
    }
}

// ===== FIN PANEL PROMOCIONES ADMIN =====

// ===== PANEL 2x1 ADMIN =====

function render2x1TabPanel() {
    const container = document.getElementById('promos2x1TabPanel');
    if (!container) return;

    const isFormOpen = _promo2x1EditingId !== null;

    container.innerHTML = `
        <div style="padding:16px 0;">
            <p class="admin-hint">Las ofertas 2×1 aparecen en la pantalla Promociones del menú público, debajo del Recomendado del Día. Cada oferta muestra un producto con el badge verde "2×1".</p>
            ${!isFormOpen
                ? `<button type="button" class="admin-button" id="add2x1Btn" style="margin-top:14px;">+ Agregar oferta 2×1</button>`
                : _build2x1FormHTML()
            }
            <div class="promo-admin-list" id="promo2x1AdminList" style="margin-top:18px;">
                ${promos2x1State.length === 0 && !isFormOpen
                    ? '<p class="admin-hint" style="text-align:center;margin-top:24px;">Sin ofertas 2×1 aún. Usa el botón de arriba para crear una.</p>'
                    : promos2x1State.map(_build2x1AdminCardHTML).join('')}
            </div>
        </div>`;

    document.getElementById('add2x1Btn')?.addEventListener('click', () => {
        _promo2x1EditingId = 'new';
        _promo2x1FormProductId = null;
        render2x1TabPanel();
    });

    if (isFormOpen) {
        document.getElementById('promo2x1FormProductSearch')?.addEventListener('input', (e) => _render2x1FormSearchResults(e.target.value));
        document.getElementById('promo2x1FormSaveBtn')?.addEventListener('click', savePromo2x1);
        document.getElementById('promo2x1FormCancelBtn')?.addEventListener('click', () => {
            _promo2x1EditingId = null;
            _promo2x1FormProductId = null;
            render2x1TabPanel();
        });
    }

    container.querySelectorAll('[data-2x1-action]').forEach((btn) => {
        btn.addEventListener('click', async () => {
            const action = btn.getAttribute('data-2x1-action');
            const id = btn.getAttribute('data-2x1-id');
            if (action === 'edit') {
                _promo2x1EditingId = id;
                const p = promos2x1State.find((x) => x.id === id);
                _promo2x1FormProductId = p?.producto_id || null;
                render2x1TabPanel();
            } else if (action === 'delete') {
                deleteAdminPromo2x1(id);
            } else if (action === 'toggle') {
                const p = promos2x1State.find((x) => x.id === id);
                if (p) {
                    const currentActivo = p.activo !== false; // undefined/true → activo
                    const newActivo = !currentActivo;
                    btn.disabled = true;
                    try {
                        await firebaseDb.collection(PROMOS_2X1_COLLECTION).doc(id).update({ activo: newActivo, updated_at: firestoreNow() });
                        p.activo = newActivo;
                        render2x1TabPanel();
                        showNotice(newActivo ? '✅ Promo 2×1 activada.' : '⏸ Promo 2×1 pausada.', 'ok');
                    } catch (err) {
                        showNotice('No se pudo actualizar la promo.', 'error');
                        btn.disabled = false;
                    }
                }
            }
        });
    });
}

function _build2x1AdminCardHTML(promo) {
    const product = productsState.find((p) => p.id === promo.producto_id);
    const img = product?.image_url || 'logo.png';
    const nombre = promo.producto_nombre || 'Sin producto';
    const activo = promo.activo !== false;
    return `
        <div class="promo-admin-card${activo ? '' : ' is-paused'}">
            <img class="promo-admin-card__img" src="${escapeHtml(img)}" alt="${escapeHtml(nombre)}" onerror="this.src='logo.png'">
            <div class="promo-admin-card__info">
                <span class="promo-admin-card__badge" style="background:#1a7a42;">2×1</span>
                <strong class="promo-admin-card__name">${escapeHtml(nombre)}</strong>
                <span class="promo-admin-card__desc">${escapeHtml(promo.kicker || '')}</span>
            </div>
            <div class="promo-admin-card__actions">
                <button type="button" class="promo-toggle-btn ${activo ? 'is-active' : ''}" data-2x1-action="toggle" data-2x1-id="${promo.id}">${activo ? '● Activo' : '○ Inactivo'}</button>
                <button type="button" class="ghost-button" data-2x1-action="edit" data-2x1-id="${promo.id}" style="padding:4px 10px;font-size:0.78rem;">Editar</button>
                <button type="button" class="ghost-button danger" data-2x1-action="delete" data-2x1-id="${promo.id}" style="padding:4px 10px;font-size:0.78rem;">Eliminar</button>
            </div>
        </div>`;
}

function _build2x1FormHTML() {
    const isEditing = _promo2x1EditingId && _promo2x1EditingId !== 'new';
    const promo = isEditing ? promos2x1State.find((p) => p.id === _promo2x1EditingId) : null;
    const product = _promo2x1FormProductId ? productsState.find((p) => p.id === _promo2x1FormProductId) : null;
    const productBoxHTML = product ? `
        <div class="recomendado-current-box" id="promo2x1FormCurrentBox" style="margin-top:6px;margin-bottom:4px;">
            <img src="${escapeHtml(product.image_url || 'logo.png')}" alt="${escapeHtml(product.nombre || '')}" onerror="this.src='logo.png'">
            <div class="recomendado-current-info">
                <span class="recomendado-current-label">Seleccionado</span>
                <span class="recomendado-current-name">${escapeHtml(product.nombre || '')}</span>
                <span class="recomendado-current-cat">${escapeHtml(product.categoria || '')}</span>
            </div>
        </div>` : '';
    return `
        <div class="promo-admin-form" style="margin-top:16px;">
            <h4 style="margin:0 0 14px;font-family:'Oswald',sans-serif;font-size:1rem;text-transform:uppercase;letter-spacing:.08em;color:var(--admin-accent);">${isEditing ? 'Editar oferta 2×1' : 'Nueva oferta 2×1'}</h4>
            <div class="admin-field full" style="position:relative;">
                <label for="promo2x1FormProductSearch">Producto</label>
                <input type="search" id="promo2x1FormProductSearch" class="admin-input" placeholder="Buscar producto..." autocomplete="off" value="${product ? escapeHtml(product.nombre || '') : ''}">
                <ul id="promo2x1FormSearchResults" class="recomendado-results" hidden></ul>
            </div>
            ${productBoxHTML}
            <div class="admin-field" style="margin-top:10px;">
                <label for="promo2x1FormKicker">Etiqueta (kicker)</label>
                <input type="text" id="promo2x1FormKicker" class="admin-input" placeholder="Ej: ¡Oferta Especial!" value="${escapeHtml(promo?.kicker || '¡Oferta Especial!')}">
            </div>
            <div class="admin-field" style="margin-top:10px;">
                <label for="promo2x1FormDesc">Descripción (subtítulo)</label>
                <input type="text" id="promo2x1FormDesc" class="admin-input" placeholder="Ej: ¡Lleva 2 por el precio de 1!" value="${escapeHtml(promo?.descripcion || '¡Lleva 2 por el precio de 1!')}">
            </div>
            <div style="display:flex;gap:10px;margin-top:16px;">
                <button type="button" class="admin-button" id="promo2x1FormSaveBtn">Guardar</button>
                <button type="button" class="ghost-button" id="promo2x1FormCancelBtn" style="padding:8px 16px;">Cancelar</button>
            </div>
        </div>`;
}

function _render2x1FormSearchResults(query) {
    const resultsEl = document.getElementById('promo2x1FormSearchResults');
    if (!resultsEl) return;
    const q = (query || '').trim().toLowerCase();
    if (!q) { resultsEl.hidden = true; resultsEl.innerHTML = ''; return; }

    const matches = productsState.filter((p) => (p.nombre || '').toLowerCase().includes(q)).slice(0, 8);
    if (!matches.length) { resultsEl.hidden = true; return; }

    resultsEl.hidden = false;
    resultsEl.innerHTML = matches.map((p) => `
        <li class="recomendado-result-item ${_promo2x1FormProductId === p.id ? 'is-selected' : ''}" data-2x1-product-id="${p.id}">
            <img src="${escapeHtml(p.image_url || 'logo.png')}" alt="" width="32" height="32" style="border-radius:6px;object-fit:cover;flex-shrink:0;" onerror="this.src='logo.png'">
            <div class="recomendado-result-info">
                <span class="recomendado-result-name">${escapeHtml(p.nombre || '')}</span>
                <span class="recomendado-result-cat">${escapeHtml(p.categoria || '')}</span>
            </div>
        </li>`).join('');

    resultsEl.querySelectorAll('[data-2x1-product-id]').forEach((li) => {
        li.addEventListener('click', () => {
            _promo2x1FormProductId = li.dataset['2x1ProductId'];
            const selected = productsState.find((p) => p.id === _promo2x1FormProductId);
            const searchInput = document.getElementById('promo2x1FormProductSearch');
            if (searchInput && selected) searchInput.value = selected.nombre || '';
            resultsEl.hidden = true;

            const existingBox = document.getElementById('promo2x1FormCurrentBox');
            const img = selected?.image_url || 'logo.png';
            const boxHTML = `
                <img src="${escapeHtml(img)}" alt="${escapeHtml(selected?.nombre || '')}" onerror="this.src='logo.png'">
                <div class="recomendado-current-info">
                    <span class="recomendado-current-label">Seleccionado</span>
                    <span class="recomendado-current-name">${escapeHtml(selected?.nombre || '')}</span>
                    <span class="recomendado-current-cat">${escapeHtml(selected?.categoria || '')}</span>
                </div>`;
            if (existingBox) {
                existingBox.innerHTML = boxHTML;
                existingBox.hidden = false;
            } else {
                const newBox = document.createElement('div');
                newBox.className = 'recomendado-current-box';
                newBox.id = 'promo2x1FormCurrentBox';
                newBox.style.marginTop = '6px';
                newBox.style.marginBottom = '4px';
                newBox.innerHTML = boxHTML;
                document.getElementById('promo2x1FormProductSearch')?.closest('.admin-field')?.insertAdjacentElement('afterend', newBox);
            }
        });
    });
}

async function savePromo2x1() {
    const kicker = (document.getElementById('promo2x1FormKicker')?.value || '').trim();
    const descripcion = (document.getElementById('promo2x1FormDesc')?.value || '').trim();

    if (!_promo2x1FormProductId) { showNotice('Selecciona un producto para la oferta 2×1.', 'error'); return; }

    const product = productsState.find((p) => p.id === _promo2x1FormProductId);
    const payload = {
        kicker:             kicker || '¡Oferta Especial!',
        descripcion:        descripcion || '¡Lleva 2 por el precio de 1!',
        producto_id:        _promo2x1FormProductId,
        producto_nombre:    product?.nombre || '',
        producto_categoria: product?.categoria || '',
        activo:             true,
        updated_at:         firestoreNow()
    };

    const saveBtn = document.getElementById('promo2x1FormSaveBtn');
    if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Guardando...'; }

    try {
        if (_promo2x1EditingId && _promo2x1EditingId !== 'new') {
            await firebaseDb.collection(PROMOS_2X1_COLLECTION).doc(_promo2x1EditingId).update(payload);
        } else {
            const maxOrden = promos2x1State.reduce((m, p) => Math.max(m, p.orden ?? 0), 0);
            await firebaseDb.collection(PROMOS_2X1_COLLECTION).add({ ...payload, orden: maxOrden + 1, created_at: firestoreNow() });
        }
        _promo2x1EditingId = null;
        _promo2x1FormProductId = null;
        await reloadDataAndRender();
        render2x1TabPanel();
        showNotice('Oferta 2×1 guardada.', 'ok');
    } catch (err) {
        showNotice('Error al guardar la oferta 2×1.', 'error');
        if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Guardar'; }
    }
}

async function deleteAdminPromo2x1(id) {
    const p = promos2x1State.find((x) => x.id === id);
    if (!window.confirm(`¿Eliminar la oferta 2×1 "${p?.producto_nombre || ''}"?`)) return;
    try {
        await firebaseDb.collection(PROMOS_2X1_COLLECTION).doc(id).delete();
        showNotice('Oferta 2×1 eliminada.', 'ok');
    } catch (err) {
        showNotice('Error al eliminar la oferta 2×1.', 'error');
    }
}

// ===== FIN PANEL 2x1 ADMIN =====

// ===== PANEL COMBOS ESPECIALES ADMIN =====

function renderCombosTabPanel() {
    const container = document.getElementById('combosTabPanel');
    if (!container) return;

    const isFormOpen = _comboEditingId !== null;

    container.innerHTML = `
        <div style="padding:16px 0;">
            <p class="admin-hint">Los combos especiales aparecen en la pantalla de Promociones del menú público, debajo del Recomendado del Día. Arma paquetes con varios productos, porcentaje de descuento y horario de disponibilidad.</p>
            ${!isFormOpen
                ? `<button type="button" class="admin-button" id="addComboBtn" style="margin-top:14px;">+ Nuevo combo</button>`
                : _buildComboFormHTML()
            }
            <div class="combo-admin-list" id="comboAdminList" style="margin-top:18px;">
                ${combosEspecialesState.length === 0 && !isFormOpen
                    ? '<p class="admin-hint" style="text-align:center;margin-top:24px;">Sin combos aún. Usa el botón de arriba para crear uno.</p>'
                    : combosEspecialesState.map(_buildComboAdminCardHTML).join('')
                }
            </div>
        </div>`;

    document.getElementById('addComboBtn')?.addEventListener('click', () => {
        _comboEditingId = 'new';
        _comboFormProducts = [];
        _comboDiasSeleccionados = [];
        _comboHorarioTipo = 'siempre';
        renderCombosTabPanel();
    });

    if (isFormOpen) {
        _wireComboFormListeners();
    }

    container.querySelectorAll('[data-combo-action]').forEach((btn) => {
        btn.addEventListener('click', async () => {
            const action = btn.dataset.comboAction;
            const id = btn.dataset.comboId;
            if (action === 'edit') {
                const combo = combosEspecialesState.find((c) => c.id === id);
                if (!combo) return;
                _comboEditingId = id;
                _comboFormProducts = (combo.productos || []).map((p) => ({ ...p }));
                _comboDiasSeleccionados = (combo.horario?.dias || []).map(Number);
                _comboHorarioTipo = combo.horario?.tipo || 'siempre';
                renderCombosTabPanel();
            } else if (action === 'toggle') {
                const combo = combosEspecialesState.find((c) => c.id === id);
                if (!combo) return;
                await firebaseDb.collection(COMBOS_ESPECIALES_COLLECTION).doc(id).update({ activo: !combo.activo });
                await reloadDataAndRender();
                renderCombosTabPanel();
            } else if (action === 'delete') {
                const combo = combosEspecialesState.find((c) => c.id === id);
                if (!window.confirm(`¿Eliminar el combo "${combo?.titulo || ''}"?`)) return;
                await firebaseDb.collection(COMBOS_ESPECIALES_COLLECTION).doc(id).delete();
                await reloadDataAndRender();
                renderCombosTabPanel();
                showNotice('Combo eliminado.', 'ok');
            }
        });
    });
}

function _buildComboFormHTML() {
    const editingCombo = _comboEditingId && _comboEditingId !== 'new'
        ? combosEspecialesState.find((c) => c.id === _comboEditingId)
        : null;

    const titulo = editingCombo?.titulo || '';
    const descuento = editingCombo?.descuento ?? 10;
    const h = editingCombo?.horario || {};
    const tipo = _comboHorarioTipo;
    const fechaInicio = h.fecha_inicio || '';
    const fechaFin = h.fecha_fin || '';
    const horaInicio = h.hora_inicio || '12:00';
    const horaFin = h.hora_fin || '22:00';
    const dias = _comboDiasSeleccionados;

    const DIAS_LABELS = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

    const chipsHTML = _comboFormProducts.map((p, i) => `
        <span class="combo-form__product-chip" data-chip-idx="${i}">
            <img src="${escapeHtml(p.imagen || 'logo.png')}" alt="" onerror="this.src='logo.png'">
            ${escapeHtml(p.nombre)}
            <button type="button" class="combo-form__product-chip-remove" data-remove-idx="${i}" title="Quitar">✕</button>
        </span>`).join('');

    return `<div class="combo-form" id="comboFormWrap">
        <h4 style="margin:0 0 14px;font-size:0.9rem;color:#eef4ff;">${_comboEditingId === 'new' ? 'Nuevo combo especial' : 'Editar combo'}</h4>
        <div style="display:grid;gap:10px;">
            <div class="admin-field full">
                <label>Título del combo *</label>
                <input type="text" id="comboFormTitulo" class="admin-input" placeholder="Ej: Combo Familiar Ranchero" value="${escapeHtml(titulo)}">
            </div>
            <div class="admin-field full">
                <label>Descuento (%)</label>
                <input type="number" id="comboFormDescuento" class="admin-input" min="0" max="80" value="${descuento}" placeholder="10">
            </div>
            <div class="admin-field full">
                <label>Productos del combo (mín. 2)</label>
                <div style="display:flex;gap:6px;margin-bottom:6px;">
                    <input type="search" id="comboFormProductSearch" class="admin-input" placeholder="Buscar producto..." autocomplete="off" style="flex:1;">
                </div>
                <ul id="comboFormSearchResults" style="list-style:none;margin:0;padding:0;max-height:180px;overflow-y:auto;border-radius:8px;background:rgba(0,0,0,0.3);"></ul>
                <div class="combo-form__product-chips" id="comboFormChips">${chipsHTML || '<span style="color:var(--admin-muted);font-size:0.78rem;">Ningún producto agregado</span>'}</div>
            </div>
            <div class="admin-field full">
                <label>Disponibilidad</label>
                <div class="combo-horario-block">
                    <label><input type="radio" name="comboHorarioTipo" value="siempre" ${tipo === 'siempre' ? 'checked' : ''}> Siempre activo</label>
                    <label><input type="radio" name="comboHorarioTipo" value="rango_fechas" ${tipo === 'rango_fechas' ? 'checked' : ''}> Rango de fechas</label>
                    <label><input type="radio" name="comboHorarioTipo" value="dias_horas" ${tipo === 'dias_horas' ? 'checked' : ''}> Días y horas específicos</label>
                    <div id="comboHorarioRangoFechas" style="display:${tipo === 'rango_fechas' ? 'grid' : 'none'};grid-template-columns:1fr 1fr;gap:8px;margin-top:8px;">
                        <div><label style="font-size:0.72rem;color:var(--admin-muted);">Desde</label><input type="date" id="comboFechaInicio" class="admin-input" value="${fechaInicio}"></div>
                        <div><label style="font-size:0.72rem;color:var(--admin-muted);">Hasta</label><input type="date" id="comboFechaFin" class="admin-input" value="${fechaFin}"></div>
                    </div>
                    <div id="comboHorarioDiasHoras" style="display:${tipo === 'dias_horas' ? 'block' : 'none'};margin-top:8px;">
                        <p style="font-size:0.72rem;color:var(--admin-muted);margin:0 0 6px;">Días activos:</p>
                        <div class="combo-horario-days">
                            ${DIAS_LABELS.map((d, i) => `<button type="button" class="combo-horario-day-btn${dias.includes(i) ? ' active' : ''}" data-day="${i}">${d}</button>`).join('')}
                        </div>
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px;">
                            <div><label style="font-size:0.72rem;color:var(--admin-muted);">Hora inicio</label><input type="time" id="comboHoraInicio" class="admin-input" value="${horaInicio}"></div>
                            <div><label style="font-size:0.72rem;color:var(--admin-muted);">Hora fin</label><input type="time" id="comboHoraFin" class="admin-input" value="${horaFin}"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap;">
            <button type="button" class="section-save-btn" id="comboFormSaveBtn">Guardar combo</button>
            <button type="button" class="ghost-button" id="comboFormCancelBtn" style="padding:8px 16px;">Cancelar</button>
        </div>
    </div>`;
}

function _wireComboFormListeners() {
    const container = document.getElementById('combosTabPanel');
    if (!container) return;

    // Horario tipo toggle
    container.querySelectorAll('input[name="comboHorarioTipo"]').forEach((radio) => {
        radio.addEventListener('change', (e) => {
            _comboHorarioTipo = e.target.value;
            const rangoEl = document.getElementById('comboHorarioRangoFechas');
            const diasEl = document.getElementById('comboHorarioDiasHoras');
            if (rangoEl) rangoEl.style.display = _comboHorarioTipo === 'rango_fechas' ? 'grid' : 'none';
            if (diasEl) diasEl.style.display = _comboHorarioTipo === 'dias_horas' ? 'block' : 'none';
        });
    });

    // Días toggle
    container.querySelectorAll('.combo-horario-day-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            const day = Number(btn.dataset.day);
            if (_comboDiasSeleccionados.includes(day)) {
                _comboDiasSeleccionados = _comboDiasSeleccionados.filter((d) => d !== day);
                btn.classList.remove('active');
            } else {
                _comboDiasSeleccionados.push(day);
                btn.classList.add('active');
            }
        });
    });

    // Quitar producto chip
    container.querySelectorAll('.combo-form__product-chip-remove').forEach((btn) => {
        btn.addEventListener('click', () => {
            const idx = Number(btn.dataset.removeIdx);
            _comboFormProducts.splice(idx, 1);
            _refreshComboChips();
        });
    });

    // Búsqueda de producto
    const searchInput = document.getElementById('comboFormProductSearch');
    const resultsEl = document.getElementById('comboFormSearchResults');
    if (searchInput && resultsEl) {
        searchInput.addEventListener('input', (e) => {
            const q = e.target.value.trim().toLowerCase();
            if (!q) { resultsEl.innerHTML = ''; return; }
            const catalog = productsState.length ? productsState : PUBLIC_PRODUCT_CATALOG;
            const matches = catalog
                .filter((p) => String(p.estado || 'active') === 'active' && String(p.nombre || '').toLowerCase().includes(q))
                .slice(0, 8);
            resultsEl.innerHTML = matches.map((p) => {
                const alreadyAdded = _comboFormProducts.some((x) => x.id === p.id);
                return `<li data-combo-product-id="${p.id}" style="display:flex;align-items:center;gap:8px;padding:8px 10px;cursor:${alreadyAdded ? 'default' : 'pointer'};opacity:${alreadyAdded ? '0.4' : '1'};border-bottom:1px solid rgba(255,255,255,0.06);">
                    <img src="${escapeHtml(p.image_url || 'logo.png')}" style="width:28px;height:28px;border-radius:6px;object-fit:cover;" onerror="this.src='logo.png'">
                    <span style="flex:1;font-size:0.82rem;">${escapeHtml(p.nombre)}</span>
                    <span style="font-size:0.75rem;color:var(--admin-accent);">${formatMoney(p.precio || 0)}</span>
                    ${alreadyAdded ? '<span style="font-size:0.7rem;color:var(--admin-muted);">Ya agregado</span>' : ''}
                </li>`;
            }).join('');

            resultsEl.querySelectorAll('li[data-combo-product-id]').forEach((li) => {
                li.addEventListener('click', () => {
                    const pid = li.dataset.comboProductId;
                    if (_comboFormProducts.some((x) => x.id === pid)) return;
                    const p = catalog.find((x) => x.id === pid);
                    if (!p) return;
                    _comboFormProducts.push({ id: p.id, nombre: p.nombre, precio: p.precio || 0, imagen: p.image_url || '' });
                    resultsEl.innerHTML = '';
                    searchInput.value = '';
                    _refreshComboChips();
                });
            });
        });
    }

    document.getElementById('comboFormSaveBtn')?.addEventListener('click', saveComboEspecial);
    document.getElementById('comboFormCancelBtn')?.addEventListener('click', () => {
        _comboEditingId = null;
        _comboFormProducts = [];
        renderCombosTabPanel();
    });
}

function _refreshComboChips() {
    const wrap = document.getElementById('comboFormChips');
    if (!wrap) return;
    if (!_comboFormProducts.length) {
        wrap.innerHTML = '<span style="color:var(--admin-muted);font-size:0.78rem;">Ningún producto agregado</span>';
        return;
    }
    wrap.innerHTML = _comboFormProducts.map((p, i) => `
        <span class="combo-form__product-chip" data-chip-idx="${i}">
            <img src="${escapeHtml(p.imagen || 'logo.png')}" alt="" onerror="this.src='logo.png'">
            ${escapeHtml(p.nombre)}
            <button type="button" class="combo-form__product-chip-remove" data-remove-idx="${i}" title="Quitar">✕</button>
        </span>`).join('');
    wrap.querySelectorAll('.combo-form__product-chip-remove').forEach((btn) => {
        btn.addEventListener('click', () => {
            _comboFormProducts.splice(Number(btn.dataset.removeIdx), 1);
            _refreshComboChips();
        });
    });
}

async function saveComboEspecial() {
    const titulo = (document.getElementById('comboFormTitulo')?.value || '').trim();
    const descuento = Number(document.getElementById('comboFormDescuento')?.value || 0);

    if (!titulo) { showNotice('El título del combo es obligatorio.', 'error'); return; }
    if (_comboFormProducts.length < 2) { showNotice('Debes agregar al menos 2 productos al combo.', 'error'); return; }

    const horario = { tipo: _comboHorarioTipo, dias: _comboDiasSeleccionados };
    if (_comboHorarioTipo === 'rango_fechas') {
        horario.fecha_inicio = document.getElementById('comboFechaInicio')?.value || null;
        horario.fecha_fin = document.getElementById('comboFechaFin')?.value || null;
    } else if (_comboHorarioTipo === 'dias_horas') {
        horario.hora_inicio = document.getElementById('comboHoraInicio')?.value || '12:00';
        horario.hora_fin = document.getElementById('comboHoraFin')?.value || '22:00';
    }

    const precioOriginal = _comboFormProducts.reduce((s, p) => s + Number(p.precio || 0), 0);
    const rate = Math.min(Math.max(descuento, 0), 80) / 100;
    const precioCombo = Math.round(precioOriginal * (1 - rate));

    const payload = {
        titulo,
        productos: _comboFormProducts,
        descuento,
        precio_original: precioOriginal,
        precio_combo: precioCombo,
        horario,
        activo: true,
        updated_at: firestoreNow()
    };

    const saveBtn = document.getElementById('comboFormSaveBtn');
    if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Guardando...'; }

    try {
        if (_comboEditingId && _comboEditingId !== 'new') {
            await firebaseDb.collection(COMBOS_ESPECIALES_COLLECTION).doc(_comboEditingId).update(payload);
        } else {
            const maxOrden = combosEspecialesState.reduce((m, c) => Math.max(m, c.orden ?? 0), 0);
            await firebaseDb.collection(COMBOS_ESPECIALES_COLLECTION).add({ ...payload, orden: maxOrden + 1, created_at: firestoreNow() });
        }
        _comboEditingId = null;
        _comboFormProducts = [];
        await reloadDataAndRender();
        renderCombosTabPanel();
        showNotice('Combo guardado.', 'ok');
    } catch (err) {
        showNotice('Error al guardar el combo.', 'error');
        if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Guardar combo'; }
    }
}

function _buildComboAdminCardHTML(combo) {
    const iconsHTML = (combo.productos || []).slice(0, 5).map((p) =>
        `<img class="combo-admin-card__icon" src="${escapeHtml(p.imagen || 'logo.png')}" alt="${escapeHtml(p.nombre)}" onerror="this.src='logo.png'" title="${escapeHtml(p.nombre)}">`
    ).join('');

    const nombresProductos = (combo.productos || []).map((p) => p.nombre).join(' + ');
    const isActivo = combo.activo !== false;
    const rate = Math.min(Math.max(Number(combo.descuento || 0), 0), 80) / 100;
    const precioOrig = formatMoney(combo.precio_original || 0);
    const precioCombo = formatMoney(combo.precio_combo || 0);
    const horarioLabel = _comboHorarioLabel(combo.horario);

    return `<div class="combo-admin-card" style="opacity:${isActivo ? '1' : '0.55'};">
        <div class="combo-admin-card__icons">${iconsHTML}</div>
        <div class="combo-admin-card__info">
            <strong class="combo-admin-card__title">${escapeHtml(combo.titulo || 'Sin título')}</strong>
            <span class="combo-admin-card__products">${escapeHtml(nombresProductos)}</span>
            <span class="combo-admin-card__price">${precioCombo} <span style="text-decoration:line-through;font-weight:400;font-size:0.75rem;color:var(--admin-muted);">${precioOrig}</span> · -${combo.descuento || 0}%</span>
            <span class="combo-admin-card__schedule">🕐 ${escapeHtml(horarioLabel)}</span>
        </div>
        <div class="combo-admin-card__actions">
            <button class="promo-toggle-btn${isActivo ? ' is-active' : ''}" data-combo-action="toggle" data-combo-id="${combo.id}">${isActivo ? 'Activo' : 'Inactivo'}</button>
            <button class="mini-btn" data-combo-action="edit" data-combo-id="${combo.id}">Editar</button>
            <button class="mini-btn remove" data-combo-action="delete" data-combo-id="${combo.id}">Eliminar</button>
        </div>
    </div>`;
}

function _comboHorarioLabel(horario) {
    if (!horario || horario.tipo === 'siempre') return 'Siempre activo';
    if (horario.tipo === 'rango_fechas') {
        const desde = horario.fecha_inicio || '?';
        const hasta = horario.fecha_fin || '?';
        return `Desde ${desde} hasta ${hasta}`;
    }
    if (horario.tipo === 'dias_horas') {
        const DIAS = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
        const dias = (horario.dias || []).map((d) => DIAS[d] || '').filter(Boolean).join(', ') || 'Todos';
        return `${dias} · ${horario.hora_inicio || ''} – ${horario.hora_fin || ''}`;
    }
    return 'Configurado';
}

// ===== FIN PANEL COMBOS ESPECIALES ADMIN =====

function buildWhatsAppButtonLink(number, customLink) {
    const directLink = String(customLink || '').trim();
    if (directLink) {
        return directLink;
    }

    const normalizedNumber = String(number || '').replace(/\D+/g, '');
    if (!normalizedNumber) {
        return '';
    }

    return `https://wa.me/${normalizedNumber}?text=${encodeURIComponent(`Hola ${brandingState.restaurantName || 'Roal Burger'}! Quisiera realizar un pedido por favor`)}`;
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

async function _uploadProductImageToStorage(file, productName) {
    const ext      = (file.name.split('.').pop() || 'jpg').toLowerCase().replace('jpeg', 'jpg');
    const safeName = slugify(productName?.trim() || 'producto') || `prod-${Date.now()}`;
    const path     = `productos/${safeName}.${ext}`;
    const ref      = firebaseStorage.ref().child(path);
    await withTimeout(ref.put(file), 20_000, 'La subida tardo demasiado. Revisa tu conexion.');
    return withTimeout(ref.getDownloadURL(), 7_000, 'No se pudo obtener la URL de descarga.');
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
    // reservado para futuras métricas
}


async function _migrateCategoryFlags() {
    try {
        const snap = await firebaseDb.collection('categorias').get();
        const batch = firebaseDb.batch();
        let changes = 0;
        snap.docs.forEach((doc) => {
            const d = doc.data();
            const name = normalizeCategoryKey(String(d.name || d.nombre || ''));
            const updates = {};
            // Burgers → combos_menu ON
            if (name.includes('burger') || name.includes('clasica') || name.includes('pepito') || name.includes('premium')) {
                if (d.combos_menu === false) { updates.combos_menu = true; }
            }
            // Combos mixtos → bebidas ON (POS + menú)
            if (name.includes('combos mixtos') || name.includes('combo mixto')) {
                if (d.bebidas_menu === false) { updates.bebidas_menu = true; }
                if (d.bebidas_pos === false)   { updates.bebidas_pos  = true; }
            }
            if (Object.keys(updates).length > 0) {
                batch.update(doc.ref, updates);
                changes++;
            }
        });
        if (changes > 0) await batch.commit();
    } catch (_) {}
}

async function reloadDataAndRender() {
    await Promise.all([
        fetchCategories(),
        fetchProducts(),
        fetchBebidas(),
        fetchAcompanantes(),
        fetchCombosPack(),
        fetchCatalogoVisibilidad(),
        fetchButtons(),
        fetchBranding(),
        fetchOrders(),
        fetchSalesSummaries(),
        fetchSalesDayState(),
        fetchClients(),
        fetchMessages(),
        fetchMenuUpgradesConfig(),
        fetchRecomendadoDiaConfig(),
        fetchHorarioConfig(),
        fetchPromos(),
        fetchCombosEspeciales(),
        fetchPromos2x1()
    ]);

    const createdSalesDay = await ensureActiveSalesDay();
    if (createdSalesDay) {
        await fetchSalesDayState();
    }

    announceNewOrders(ordersState);
    announceNewMessages(messagesState);

    renderCategories();
    renderBebidasPanel();
    renderAcompanantesPanel();
    renderCombosPackPanel();
    renderPosCategoriesPanel();
    renderMenuUpgradesAdmin();
    renderButtonsList();
    renderBrandingForm();
    renderHorarioForm();
    renderRecomendadoDiaPanel();
    renderPromosTabPanel();
    renderCombosTabPanel();
    render2x1TabPanel();
    renderOrders();
    renderSalesSummaries();
    renderLedgerBook();
    renderCajaDiaria();
    renderClients();
    renderMessages();
    updateMessagesAttentionState();
    renderMetricsPos();
    renderMetricsUsers();
    renderMetricasProductos();
    renderMetricasTrafico();
    await syncStats();

    if (activeCategoryModalId) {
        const activeCategory = categoriesState.find((category) => category.id === activeCategoryModalId);
        if (activeCategory) {
            openCategoryProductsModal(activeCategoryModalId);
        } else {
            closeCategoryProductsModal();
        }
    }
}

if (categoryForm) {
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
}

categoryList.addEventListener('click', async (event) => {
    const target = event.target;
    if (!(target instanceof Element)) {
        return;
    }

    const actionEl = target.closest('[data-action]');
    if (!actionEl) {
        return;
    }

    const action = actionEl.dataset.action;
    const categoryId = actionEl.dataset.categoryId;

    if (!action) {
        return;
    }

    if (action === 'select-category' && categoryId) {
        _selectedCategoryId = categoryId;
        categoryList.querySelectorAll('.upgrades-master-item').forEach((el) => el.classList.remove('selected'));
        actionEl.classList.add('selected');
        _renderCategoryDetailPanel(categoryId);
        return;
    }

    const actionButton = actionEl instanceof HTMLButtonElement ? actionEl : actionEl.querySelector('button[data-action]');

    if (categoryId && !actionEl.dataset.productId) {
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
        // Siempre crear un ticket en blanco — nunca reanudar uno existente
        posActiveTicketId = null;
        posTicketConfig = null;
        internalOrderItems = [];
        createNewPosTicket();
        openInternalOrderModal();
    });
}

// Botón "Tickets Abiertos" — abre el POS directo en la pantalla de tickets
document.getElementById('openAdminTicketsViewBtn')?.addEventListener('click', () => {
    openInternalOrderModal();
    showPosScreen('tickets');
});

if (unreadTrayBtn) {
    unreadTrayBtn.addEventListener('click', toggleUnreadTray);
}

if (unreadTrayCloseBtn) {
    unreadTrayCloseBtn.addEventListener('click', closeUnreadTray);
}

document.addEventListener('click', (e) => {
    if (!unreadTray || unreadTray.hidden) return;
    if (!unreadTray.contains(e.target) && e.target !== unreadTrayBtn && !unreadTrayBtn?.contains(e.target)) {
        closeUnreadTray();
    }
});

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
// Botón TICKETS ABIERTOS
document.getElementById('posOpenTicketsBtn')?.addEventListener('click', () => showPosScreen('tickets'));

// Toggle carrito (barra inferior)
document.getElementById('posCartToggleBtn')?.addEventListener('click', () => {
    const drawer = document.getElementById('posCartDrawer');
    if (drawer) drawer.hidden = false;
});

// Botones de acción en la barra inferior móvil (delegan a sus equivalentes del drawer)
document.getElementById('posBottomSaveOrderBtn')?.addEventListener('click', () => {
    document.getElementById('posDrawerSaveBtn')?.click();
});
document.getElementById('posBottomGuardarTicketBtn')?.addEventListener('click', () => {
    document.getElementById('posGuardarTicketBtn')?.click();
});

// Cerrar drawer del carrito
document.getElementById('posCartDrawerCloseBtn')?.addEventListener('click', () => {
    const drawer = document.getElementById('posCartDrawer');
    if (drawer) drawer.hidden = true;
});

// Acceso rápido: Personalizar ticket desde el carrito (solo guarda config, no envía)
document.getElementById('posCartCustomizeBtn')?.addEventListener('click', () => {
    openPosTicketSetupModal(true);
});

// Vaciar carrito
document.getElementById('posClearCartBtn')?.addEventListener('click', () => {
    if (!internalOrderItems.length && !posTicketConfig) return;
    if (!confirm('¿Vaciar el pedido actual?')) return;
    internalOrderItems = [];
    posTicketConfig = null;
    const currentTicket = posTickets.find((t) => t.id === posActiveTicketId);
    if (currentTicket) {
        currentTicket.items = [];
        currentTicket.customerName = '';
        currentTicket.customerPhone = '';
        currentTicket.orderType = null;
        currentTicket.mesaNumber = null;
        currentTicket.deliveryAddress = '';
        currentTicket.deliveryFee = null;
    }
    renderPosOrderItems();
    renderPosCartTicketInfo();
    renderPosTotals();
    renderPosBottomBar();
});

// Backdrop del carrito
document.getElementById('posCartBackdrop')?.addEventListener('click', () => {
    const drawer = document.getElementById('posCartDrawer');
    if (drawer) drawer.hidden = true;
});

// GUARDAR PEDIDO desde el drawer → usa config guardada o abre modal
document.getElementById('posDrawerSaveBtn')?.addEventListener('click', () => {
    if (!internalOrderItems.length) {
        showNotice('Agrega al menos un producto al pedido.', 'error');
        return;
    }
    if (posTicketConfig) {
        saveAdminOrderQuick(posTicketConfig);
        posTicketConfig = null;
        renderPosCartTicketInfo();
        return;
    }
    openPosTicketSetupModal();
});

// ── Modal: Personalizar ticket ────────────────────────────────────────────────
let _ptsSelectedType = null;
let _ptsSelectedMesa = null;
let _ptsSelectedClient = null; // { name, phone }
let _ptsActiveTab = 'none';
let _ptsConfigOnly = false; // true = abierto desde ✎, solo guarda config sin enviar
let _ptsSaveAndNew = false; // true = guardar ticket con nombre y abrir uno nuevo en blanco
let _ptsCobrarAfterSave = false; // true = crear pedido y cobrar inmediatamente

function renderPosCartTicketInfo() {
    const el = document.getElementById('posCartTicketInfo');
    if (!el) return;
    if (!posTicketConfig) {
        el.hidden = true;
        el.innerHTML = '';
        return;
    }
    const typeLabels = { mesa: 'Mesa', retiro: 'Recoger', domicilio: 'Domicilio' };
    const typeLabel = typeLabels[posTicketConfig.orderType] || posTicketConfig.orderType;
    const typeValue = posTicketConfig.orderType === 'mesa' && posTicketConfig.mesaNumber
        ? `Mesa ${posTicketConfig.mesaNumber}`
        : typeLabel;
    const clientValue = posTicketConfig.customerName || '';
    const phoneValue = posTicketConfig.customerPhone || '';
    const addressValue = posTicketConfig.deliveryAddress || '';
    el.innerHTML = `
        <div class="pos-ticket-info-row">
            <span class="pos-ticket-info-label">TIPO</span>
            <span class="pos-ticket-info-value">${escapeHtml(typeValue)}</span>
        </div>
        ${clientValue ? `<div class="pos-ticket-info-row">
            <span class="pos-ticket-info-label">CLIENTE</span>
            <span class="pos-ticket-info-value">${escapeHtml(clientValue)}</span>
        </div>` : ''}
        ${phoneValue ? `<div class="pos-ticket-info-row">
            <span class="pos-ticket-info-label">TEL</span>
            <span class="pos-ticket-info-value">${escapeHtml(phoneValue)}</span>
        </div>` : ''}
        ${addressValue ? `<div class="pos-ticket-info-row">
            <span class="pos-ticket-info-label">DIR</span>
            <span class="pos-ticket-info-value">${escapeHtml(addressValue)}</span>
        </div>` : ''}
    `;
    el.hidden = false;
    // Recalcular totales para reflejar el domicilio
    renderPosTotals();
}

function _ptsMarkOccupiedMesas() {
    const occupiedFromTickets = posTickets
        .filter((t) => t.id !== posActiveTicketId && t.orderType === 'mesa' && t.mesaNumber)
        .map((t) => t.mesaNumber);
    // También bloquear mesas de pedidos activos en Firestore
    const occupiedFromOrders = (ordersState || [])
        .filter((o) => o.orderType === 'mesa' && o.mesaNumber && !['entregado', 'cancelado'].includes(o.status))
        .map((o) => Number(o.mesaNumber));
    const allOccupied = [...new Set([...occupiedFromTickets, ...occupiedFromOrders])];
    document.querySelectorAll('.pts-mesa-btn').forEach((btn) => {
        const num = Number(btn.dataset.ptsMesa);
        const occupied = allOccupied.includes(num);
        btn.classList.toggle('occupied', occupied);
        btn.disabled = occupied;
        if (occupied) btn.title = `Mesa ${num} en uso`;
        else if (!btn.classList.contains('active')) btn.title = '';
    });
}

function openPosTicketSetupModal(configOnly = false, presetType = null) {
    const modal = document.getElementById('posTicketSetupModal');
    if (!modal) return;

    _ptsConfigOnly = configOnly;

    // Pre-poblar desde el ticket activo si existe metadata
    const activeTicket = posTickets.find((t) => t.id === posActiveTicketId);
    const prefill = configOnly && activeTicket ? activeTicket : null;

    // Reset estado
    _ptsSelectedType = presetType || prefill?.orderType || null;
    _ptsSelectedMesa = prefill?.mesaNumber || null;
    _ptsSelectedClient = prefill?.customerName ? { name: prefill.customerName, phone: prefill.customerPhone || '' } : null;
    // Si hay cliente prefill, usar tab 'quick' para mostrar los datos
    _ptsActiveTab = (_ptsSelectedClient && configOnly) ? 'quick' : 'none';
    // Atajo rápido de columna: abrir directo en tab búsqueda (no para mesa)
    if (presetType && presetType !== 'mesa') _ptsActiveTab = 'search';

    // Reset UI — tipo
    modal.querySelectorAll('.pts-type-btn').forEach((b) => {
        b.classList.toggle('active', b.dataset.ptsType === _ptsSelectedType);
    });
    const mesaGrid = document.getElementById('ptsMesaGrid');
    if (mesaGrid) {
        if (_ptsSelectedType === 'mesa') mesaGrid.removeAttribute('hidden');
        else mesaGrid.setAttribute('hidden', '');
    }
    modal.querySelectorAll('.pts-mesa-btn').forEach((b) => {
        b.classList.toggle('active', Number(b.dataset.ptsMesa) === _ptsSelectedMesa);
    });

    // Pre-llenar cliente
    modal.querySelectorAll('[data-pts-tab]').forEach((t) => t.classList.toggle('active', t.dataset.ptsTab === _ptsActiveTab));
    modal.querySelectorAll('.pts-client-panel').forEach((p) => p.setAttribute('hidden', ''));
    const quickName = document.getElementById('ptsQuickName');
    const quickPhone = document.getElementById('ptsQuickPhone');
    if (_ptsActiveTab === 'quick') {
        const quickPanel = document.getElementById('ptsPanelQuick');
        if (quickPanel) quickPanel.removeAttribute('hidden');
        if (quickName) quickName.value = _ptsSelectedClient?.name || '';
        if (quickPhone) quickPhone.value = _ptsSelectedClient?.phone || '';
    } else {
        if (quickName) quickName.value = '';
        if (quickPhone) quickPhone.value = '';
        if (_ptsActiveTab === 'search') {
            document.getElementById('ptsPanelSearch')?.removeAttribute('hidden');
        }
    }
    const searchInput = document.getElementById('ptsSearchInput');
    if (searchInput) { searchInput.value = ''; searchInput.removeAttribute('hidden'); }
    const searchResults = document.getElementById('ptsSearchResults');
    if (searchResults) searchResults.innerHTML = '';
    const selectedChip = document.getElementById('ptsSelectedChip');
    const selectedChipLabel = document.getElementById('ptsSelectedChipLabel');
    if (selectedChipLabel) selectedChipLabel.textContent = '';
    if (selectedChip) selectedChip.classList.remove('is-visible');

    // Pre-llenar dirección (domicilio)
    const domicilioSection = document.getElementById('ptsDomicilioSection');
    const addrInput = document.getElementById('ptsDeliveryAddress');
    const addrPicker = document.getElementById('ptsAddressPicker');
    if (addrPicker) addrPicker.setAttribute('hidden', '');
    document.getElementById('ptsAddrActions')?.setAttribute('hidden', '');
    document.getElementById('ptsSaveAddrConfirm')?.setAttribute('hidden', '');
    _ptsUnlockAddrInput();
    _ptsPendingConfirmFn = null;
    _ptsHideFeeSuggestion();
    const feeWrap = document.getElementById('ptsDeliveryFeeWrap');
    if (feeWrap) feeWrap.setAttribute('hidden', '');
    _ptsRefreshDomicilioSection();
    if (addrInput) addrInput.value = (configOnly && prefill?.deliveryAddress) ? prefill.deliveryAddress : '';
    const feeInput = document.getElementById('ptsDeliveryFee');
    if (feeInput) {
        const prefillFee = configOnly && prefill?.deliveryFee !== undefined && prefill.deliveryFee !== null
            ? prefill.deliveryFee
            : '';
        feeInput.value = prefillFee;
    }
    // Si ya tiene dirección pre-rellenada, mostrar fee y buscar sugerencia
    if (configOnly && prefill?.deliveryAddress && _ptsSelectedType === 'domicilio') {
        _ptsToggleFeeWrap(true);
        if (!prefill.deliveryFee) _ptsSuggestDeliveryFee(prefill.deliveryAddress);
    }

    // Cambiar label del botón según modo
    const confirmBtn = document.getElementById('ptsConfirmBtn');
    if (confirmBtn) {
        if (_ptsSaveAndNew) confirmBtn.textContent = 'Guardar ticket';
        else if (configOnly && _editingOrderData) confirmBtn.textContent = 'Confirmar edición';
        else if (configOnly) confirmBtn.textContent = 'Guardar configuración';
        else confirmBtn.textContent = 'Guardar pedido';
    }

    _ptsUpdateConfirmBtn();
    modal.removeAttribute('hidden');
    _ptsMarkOccupiedMesas();
    if (presetType && presetType !== 'mesa') {
        setTimeout(() => document.getElementById('ptsSearchInput')?.focus(), 80);
    }
}

function closePosTicketSetupModal() {
    document.getElementById('posTicketSetupModal')?.setAttribute('hidden', '');
}

// La sección de domicilio (dirección + tarifa) solo se muestra cuando hay cliente asignado.
// 'quick' cuenta como cliente asignado (el cajero está ingresando datos).
// 'none' (sin nombre) nunca muestra la sección.
// 'search'/'new' muestran la sección solo cuando _ptsSelectedClient !== null.
function _ptsShouldShowDomicilioSection() {
    if (_ptsSelectedType !== 'domicilio') return false;
    if (_ptsActiveTab === 'none') return false;
    if (_ptsActiveTab === 'quick') return true;
    return _ptsSelectedClient !== null;
}

function _ptsRefreshDomicilioSection() {
    const section = document.getElementById('ptsDomicilioSection');
    if (!section) return;
    if (_ptsShouldShowDomicilioSection()) {
        section.removeAttribute('hidden');
        if (_ptsSelectedClient) {
            _ptsFillClientAddress(_ptsSelectedClient);
        } else {
            // Tab 'quick' sin cliente: input visible y tarifa siempre accesible
            const addrPicker = document.getElementById('ptsAddressPicker');
            if (addrPicker) { addrPicker.setAttribute('hidden', ''); addrPicker.innerHTML = ''; }
            const addrInput = document.getElementById('ptsDeliveryAddress');
            if (addrInput) addrInput.removeAttribute('hidden');
            _ptsToggleFeeWrap(true);
        }
    } else {
        section.setAttribute('hidden', '');
        document.getElementById('ptsAddrActions')?.setAttribute('hidden', '');
        document.getElementById('ptsSaveAddrConfirm')?.setAttribute('hidden', '');
        _ptsUnlockAddrInput();
        const addrPicker = document.getElementById('ptsAddressPicker');
        if (addrPicker) { addrPicker.setAttribute('hidden', ''); addrPicker.innerHTML = ''; }
        const addrInput = document.getElementById('ptsDeliveryAddress');
        if (addrInput) { addrInput.value = ''; addrInput.removeAttribute('hidden'); }
        _ptsToggleFeeWrap(false);
    }
}

function _ptsUpdateConfirmBtn() {
    const btn = document.getElementById('ptsConfirmBtn');
    if (!btn) return;
    const ready = !!_ptsSelectedType && (_ptsSelectedType !== 'mesa' || !!_ptsSelectedMesa);
    btn.disabled = !ready;
}

function _ptsRenderSearchResults(query) {
    const container = document.getElementById('ptsSearchResults');
    if (!container) return;
    const q = String(query || '').trim().toLowerCase();
    if (!q) { container.innerHTML = ''; return; }

    const qDigits = q.replace(/\D/g, '');
    const matches = (clientsState || []).filter((c) => {
        const name = String(c.customerName || '').toLowerCase();
        const phone = String(c.customerPhone || '').replace(/\D/g, '');
        return name.includes(q) || (qDigits && phone.includes(qDigits));
    }).slice(0, 6);

    if (!matches.length) {
        container.innerHTML = '<p class="pts-no-results">Sin resultados</p>';
        return;
    }

    container.innerHTML = matches.map((c) => {
        const rawAddrs = Array.isArray(c.savedAddresses) ? c.savedAddresses : [];
        const addrTexts = rawAddrs.map((a) => {
            if (!a) return '';
            return typeof a === 'string' ? a.trim() : String(a.address || a.value || a.label || '').trim();
        }).filter(Boolean);
        const addrsHtml = addrTexts.length
            ? `<div class="pts-result-addrs">${addrTexts.map((t) => `<span class="pts-result-addr-chip">${escapeHtml(t)}</span>`).join('')}</div>`
            : '';
        return `
        <div class="pts-result-item" data-pts-client-id="${escapeHtml(c.id || '')}" data-pts-client-name="${escapeHtml(c.customerName || '')}" data-pts-client-phone="${escapeHtml(c.customerPhone || '')}">
            <div class="pts-result-name">${escapeHtml(c.customerName || 'Sin nombre')}</div>
            <div class="pts-result-phone">${escapeHtml(c.customerPhone || '')}</div>
            ${addrsHtml}
        </div>`;
    }).join('');
}

// Muestra el chip de cliente seleccionado y oculta el input de búsqueda
function _ptsShowSelectedClientChip(client) {
    if (!client?.name) return;
    const searchInput  = document.getElementById('ptsSearchInput');
    const results      = document.getElementById('ptsSearchResults');
    const chip         = document.getElementById('ptsSelectedChip');
    const chipLabel    = document.getElementById('ptsSelectedChipLabel');
    if (searchInput) searchInput.setAttribute('hidden', '');
    if (results) results.innerHTML = '';
    if (chip && chipLabel) {
        chipLabel.textContent = `✓ ${client.name}${client.phone ? '  ·  ' + client.phone : ''}`;
        chip.classList.add('is-visible');
    }
}

function _ptsHideSelectedClientChip() {
    const searchInput = document.getElementById('ptsSearchInput');
    const chip        = document.getElementById('ptsSelectedChip');
    const chipLabel   = document.getElementById('ptsSelectedChipLabel');
    if (searchInput) { searchInput.removeAttribute('hidden'); searchInput.value = ''; searchInput.focus(); }
    if (chipLabel) chipLabel.textContent = '';
    if (chip) chip.classList.remove('is-visible');
}

// Auto-rellena la sección de dirección según las direcciones guardadas del cliente.
// savedAddresses puede ser string[] (formato viejo) u objetos {address, latitude, longitude, primary}.
function _ptsFillClientAddress(client) {
    const activeTypeBtn = document.querySelector('#posTicketSetupModal .pts-type-btn.active');
    const resolvedType  = activeTypeBtn?.dataset?.ptsType || _ptsSelectedType;
    if (resolvedType !== 'domicilio') return;

    // Normalizar cada entrada a { text, lat, lon }
    const rawList = Array.isArray(client.savedAddresses) ? client.savedAddresses : [];
    const addresses = rawList.map((a) => {
        if (!a) return null;
        const text = typeof a === 'string'
            ? a.trim()
            : String(a.address || a.value || a.label || '').trim();
        if (!text) return null;
        return {
            text,
            lat: Number.isFinite(Number(a.latitude))  ? Number(a.latitude)  : null,
            lon: Number.isFinite(Number(a.longitude)) ? Number(a.longitude) : null,
        };
    }).filter(Boolean);

    const addrInput  = document.getElementById('ptsDeliveryAddress');
    const addrPicker = document.getElementById('ptsAddressPicker');
    if (!addrInput || !addrPicker) return;

    if (addresses.length === 0) {
        addrPicker.setAttribute('hidden', '');
        addrInput.value = '';
        addrInput.removeAttribute('hidden');
        return;
    }

    // Aplica una entrada: rellena el input bloqueado y sugiere/detecta tarifa
    function _applyEntry(entry) {
        _ptsLockAddrInput(entry.text);
        _ptsToggleFeeWrap(true);
        // Si tenemos coordenadas exactas, detectar zona sin geocodificar
        if (entry.lat !== null && entry.lon !== null) {
            const zone = _adminDetectZone(entry.lat, entry.lon);
            const feeInput = document.getElementById('ptsDeliveryFee');
            if (zone) {
                if (feeInput && (!feeInput.value || Number(feeInput.value) === 0)) {
                    feeInput.value = zone.fee;
                }
                const colors = { amarilla: '#f6d743', azul: '#4aa1ff', roja: '#d32f2f', negra: '#aaa' };
                _ptsSetZoneBadge(
                    `✓ ${zone.label} — $${zone.fee.toLocaleString('es-CO')} (auto-detectado)`,
                    colors[zone.name] || '#6ee7b7'
                );
            } else {
                _ptsSuggestDeliveryFee(entry.text);
            }
        } else {
            _ptsSuggestDeliveryFee(entry.text);
        }
    }

    if (addresses.length === 1) {
        addrPicker.setAttribute('hidden', '');
        addrInput.removeAttribute('hidden');
        _applyEntry(addresses[0]);
        return;
    }

    // Múltiples direcciones → picker de chips, ocultar input libre
    addrInput.setAttribute('hidden', '');
    addrInput.value = addresses[0].text;
    addrPicker.removeAttribute('hidden');
    addrPicker.innerHTML = `
        <p class="pts-addr-picker-label">Selecciona dirección guardada</p>
        ${addresses.map((entry, i) => `
            <div class="pts-addr-chip${i === 0 ? ' active' : ''}"
                data-addr="${escapeHtml(entry.text)}"
                data-lat="${entry.lat ?? ''}"
                data-lon="${entry.lon ?? ''}">
                ${escapeHtml(entry.text)}
            </div>
        `).join('')}
    `;

    _ptsToggleFeeWrap(true);
    _applyEntry(addresses[0]);

    addrPicker.querySelectorAll('.pts-addr-chip').forEach((chip) => {
        chip.addEventListener('click', () => {
            addrPicker.querySelectorAll('.pts-addr-chip').forEach((c) => c.classList.remove('active'));
            chip.classList.add('active');
            document.getElementById('ptsDeliveryFee').value = '';
            _applyEntry({
                text: chip.dataset.addr || '',
                lat: chip.dataset.lat !== '' ? Number(chip.dataset.lat) : null,
                lon: chip.dataset.lon !== '' ? Number(chip.dataset.lon) : null,
            });
        });
    });
}

// ── Listeners directos del modal (más robustos que delegación global) ──────────
document.getElementById('ptsCancelBtn')?.addEventListener('click', () => {
    _ptsSaveAndNew = false;
    _ptsCobrarAfterSave = false;
    closePosTicketSetupModal();
});

function _ptsShowFeedback(msg) {
    const el = document.getElementById('ptsFeedbackMsg');
    if (!el) return;
    el.textContent = msg;
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; el.textContent = ''; }, 3500);
}

document.getElementById('ptsConfirmBtn')?.addEventListener('click', () => {
    // Si el panel de confirmación de dirección está visible, ignorar (esperando respuesta)
    if (!document.getElementById('ptsSaveAddrConfirm')?.hasAttribute('hidden')) return;

    // Leer estado desde DOM como fuente de verdad (evita problemas de caché/closure)
    const activeTypeBtn = document.querySelector('#posTicketSetupModal .pts-type-btn.active');
    const activeMesaBtn = document.querySelector('#posTicketSetupModal .pts-mesa-btn.active');
    const resolvedType = (activeTypeBtn?.dataset?.ptsType) || _ptsSelectedType;
    const resolvedMesa = activeMesaBtn ? Number(activeMesaBtn.dataset.ptsMesa) : _ptsSelectedMesa;

    if (!resolvedType) return;

    // Validar tarifa de domicilio obligatoria
    if (resolvedType === 'domicilio') {
        const feeRaw = String(document.getElementById('ptsDeliveryFee')?.value ?? '').trim();
        if (!feeRaw) {
            _ptsShowFeedback('Debes asignar un valor de domicilio.');
            document.getElementById('ptsDeliveryFee')?.focus();
            return;
        }
    }

    // Verificar si la dirección es nueva para ofrecer guardarla en el perfil
    if (resolvedType === 'domicilio' && _ptsActiveTab === 'search' && _ptsSelectedClient?.id) {
        const addrVal = String(document.getElementById('ptsDeliveryAddress')?.value || '').trim();
        if (addrVal && _ptsIsAddrNew(addrVal)) {
            const panel = document.getElementById('ptsSaveAddrConfirm');
            if (panel) {
                panel.removeAttribute('hidden');
                // Guardar la función de continuación para cuando el usuario responda
                _ptsPendingConfirmFn = () => document.getElementById('ptsConfirmBtn')?.click();
                return;
            }
        }
    }

    let customerName = '';
    let customerPhone = '';
    if (_ptsActiveTab === 'quick') {
        customerName = String(document.getElementById('ptsQuickName')?.value || '').trim();
        customerPhone = String(document.getElementById('ptsQuickPhone')?.value || '').trim();
    } else if (_ptsActiveTab === 'search' && _ptsSelectedClient) {
        customerName = _ptsSelectedClient.name;
        customerPhone = _ptsSelectedClient.phone;
    }
    const deliveryAddress = resolvedType === 'domicilio'
        ? String(document.getElementById('ptsDeliveryAddress')?.value || '').trim()
        : '';
    const rawFee = resolvedType === 'domicilio'
        ? Number(document.getElementById('ptsDeliveryFee')?.value || 0)
        : null;
    const deliveryFee = resolvedType === 'domicilio' ? (Number.isFinite(rawFee) && rawFee >= 0 ? rawFee : 0) : null;
    closePosTicketSetupModal();

    if (_ptsConfigOnly) {
        // Modo configuración: actualizar el ticket activo con la metadata y mostrar en carrito
        const activeTicket = posTickets.find((t) => t.id === posActiveTicketId);
        if (activeTicket) {
            activeTicket.orderType = resolvedType;
            activeTicket.mesaNumber = resolvedMesa || null;
            activeTicket.customerName = customerName;
            activeTicket.customerPhone = customerPhone;
            activeTicket.deliveryAddress = deliveryAddress;
            activeTicket.deliveryFee = deliveryFee;
            // Actualizar label del ticket
            const typeLabels = { mesa: 'Mesa', retiro: 'Recoger', domicilio: 'Domicilio' };
            if (resolvedType === 'mesa' && resolvedMesa) {
                activeTicket.label = customerName ? `Mesa ${resolvedMesa} · ${customerName}` : `Mesa ${resolvedMesa}`;
            } else if (customerName) {
                activeTicket.label = `${customerName} (${typeLabels[resolvedType] || resolvedType})`;
            } else {
                activeTicket.label = typeLabels[resolvedType] || resolvedType;
            }
            const labelEl = document.getElementById('posActiveTicketLabel');
            if (labelEl) labelEl.textContent = activeTicket.label;
        }
        posTicketConfig = { orderType: resolvedType, mesaNumber: resolvedMesa, customerName, customerPhone, deliveryAddress, deliveryFee };
        renderPosCartTicketInfo();

        // Modo GUARDAR TICKET: guardar ticket configurado en Firestore y cerrar POS
        if (_ptsSaveAndNew) {
            _ptsSaveAndNew = false;
            if (activeTicket) savePosTicketToFirestore(activeTicket);
            closeInternalOrderModal();
        }
        return;
    }

    // Modo guardar pedido: enviar a Firestore
    posTicketConfig = { orderType: resolvedType, mesaNumber: resolvedMesa, customerName, customerPhone, deliveryAddress, deliveryFee };
    renderPosCartTicketInfo();
    if (internalOrderItems.length) {
        const cobrar = _ptsCobrarAfterSave;
        _ptsCobrarAfterSave = false;
        saveAdminOrderQuick(posTicketConfig, { cobrarAfter: cobrar });
        posTicketConfig = null;
        renderPosCartTicketInfo();
    }
});

// Delegación a nivel de modal para tipo/mesa/tabs/resultados
document.getElementById('posTicketSetupModal')?.addEventListener('click', (e) => {
    // Tipo de pedido
    const typeBtn = e.target.closest('[data-pts-type]');
    if (typeBtn) {
        _ptsSelectedType = typeBtn.dataset.ptsType;
        _ptsSelectedMesa = null;
        document.querySelectorAll('.pts-type-btn').forEach((b) => b.classList.toggle('active', b === typeBtn));
        document.querySelectorAll('.pts-mesa-btn').forEach((b) => b.classList.remove('active'));
        const mesaGrid = document.getElementById('ptsMesaGrid');
        if (mesaGrid) {
            if (_ptsSelectedType === 'mesa') mesaGrid.removeAttribute('hidden');
            else mesaGrid.setAttribute('hidden', '');
        }
        _ptsRefreshDomicilioSection();
        _ptsUpdateConfirmBtn();
        return;
    }

    // Número de mesa
    const mesaBtn = e.target.closest('[data-pts-mesa]');
    if (mesaBtn) {
        if (mesaBtn.disabled || mesaBtn.classList.contains('occupied')) return;
        _ptsSelectedMesa = Number(mesaBtn.dataset.ptsMesa);
        document.querySelectorAll('.pts-mesa-btn').forEach((b) => b.classList.toggle('active', b === mesaBtn));
        _ptsUpdateConfirmBtn();
        return;
    }

    // Tabs de cliente
    const tab = e.target.closest('[data-pts-tab]');
    if (tab) {
        _ptsActiveTab = tab.dataset.ptsTab;
        _ptsSelectedClient = null;
        document.querySelectorAll('[data-pts-tab]').forEach((t) => t.classList.toggle('active', t === tab));
        const panelQuick = document.getElementById('ptsPanelQuick');
        const panelSearch = document.getElementById('ptsPanelSearch');
        const panelNew = document.getElementById('ptsPanelNew');
        if (panelQuick) panelQuick.toggleAttribute('hidden', _ptsActiveTab !== 'quick');
        if (panelSearch) panelSearch.toggleAttribute('hidden', _ptsActiveTab !== 'search');
        if (panelNew) panelNew.toggleAttribute('hidden', _ptsActiveTab !== 'new');
        if (_ptsActiveTab === 'search') {
            // Resetear chip y campo de búsqueda al activar el tab
            const chip = document.getElementById('ptsSelectedChip');
            const chipLabel = document.getElementById('ptsSelectedChipLabel');
            if (chip) chip.classList.remove('is-visible');
            if (chipLabel) chipLabel.textContent = '';
            const searchInput = document.getElementById('ptsSearchInput');
            if (searchInput) { searchInput.removeAttribute('hidden'); searchInput.value = ''; }
        } else {
            const searchResults = document.getElementById('ptsSearchResults');
            if (searchResults) searchResults.innerHTML = '';
        }
        if (_ptsActiveTab !== 'new') {
            const n = document.getElementById('ptsNewTabName');
            const p = document.getElementById('ptsNewTabPhone');
            const a = document.getElementById('ptsNewTabAddr');
            if (n) n.value = '';
            if (p) p.value = '';
            if (a) a.value = '';
        }
        // Al cambiar de tab se pierde el cliente — limpiar sección de domicilio
        _ptsHideSelectedClientChip();
        _ptsRefreshDomicilioSection();
        return;
    }

    // Seleccionar cliente desde resultados
    const resultItem = e.target.closest('.pts-result-item');
    if (resultItem) {
        const clientId = resultItem.dataset.ptsClientId || '';
        const fullClient = clientsState.find((c) => c.id === clientId) || null;
        _ptsSelectedClient = {
            id: clientId,
            name: resultItem.dataset.ptsClientName || '',
            phone: resultItem.dataset.ptsClientPhone || '',
            savedAddresses: fullClient?.savedAddresses || []
        };
        _ptsShowSelectedClientChip(_ptsSelectedClient);
        _ptsRefreshDomicilioSection();
        _ptsUpdateConfirmBtn();
        return;
    }

    // Deseleccionar cliente
    if (e.target.closest('#ptsDeselectBtn')) {
        _ptsSelectedClient = null;
        _ptsHideSelectedClientChip();
        _ptsRefreshDomicilioSection();
        _ptsUpdateConfirmBtn();
        return;
    }
});

// Input de búsqueda de cliente
document.getElementById('ptsSearchInput')?.addEventListener('input', (e) => {
    _ptsRenderSearchResults(e.target.value);
});

// ── Detección automática de zona de domicilio en POS (geocodificación) ──────
function _ptsToggleFeeWrap(hasAddress) {
    const wrap = document.getElementById('ptsDeliveryFeeWrap');
    if (!wrap) return;
    if (hasAddress) wrap.removeAttribute('hidden');
    else {
        wrap.setAttribute('hidden', '');
        const feeInput = document.getElementById('ptsDeliveryFee');
        if (feeInput) feeInput.value = '';
        _ptsClearZoneBadge();
    }
}

function _ptsClearZoneBadge() {
    const badge = document.getElementById('ptsFeeZoneBadge');
    if (badge) { badge.style.display = 'none'; badge.textContent = ''; }
}

function _ptsSetZoneBadge(text, color) {
    const badge = document.getElementById('ptsFeeZoneBadge');
    if (!badge) return;
    badge.textContent = text;
    badge.style.color = color || '#aaa';
    badge.style.display = 'block';
}

async function _ptsSuggestDeliveryFee(addressText) {
    const val = String(addressText || '').trim();
    if (val.length < 4) { _ptsClearZoneBadge(); return; }

    _ptsSetZoneBadge('🔍 Calculando tarifa...', '#aaa');

    try {
        const variants = _adminQueryVariants(val);
        let result = null;
        for (const q of variants) {
            result = await _adminGeocode(q);
            if (result) break;
        }

        if (!result) {
            _ptsSetZoneBadge('❓ Dirección no encontrada — ingresa el valor manualmente', '#ff9a50');
            return;
        }

        const zone = _adminDetectZone(result.lat, result.lon);
        const feeInput = document.getElementById('ptsDeliveryFee');

        if (zone) {
            if (feeInput && (!feeInput.value || Number(feeInput.value) === 0)) {
                feeInput.value = zone.fee;
            }
            const colors = { amarilla: '#f6d743', azul: '#4aa1ff', roja: '#d32f2f', negra: '#aaa' };
            _ptsSetZoneBadge(`✓ ${zone.label} — $${zone.fee.toLocaleString('es-CO')} (auto-detectado)`, colors[zone.name] || '#6ee7b7');
        } else {
            _ptsSetZoneBadge('⚠️ Fuera de cobertura — ingresa el valor manualmente', '#fca5a5');
        }
    } catch (_e) {
        _ptsClearZoneBadge();
    }
}

function _ptsHideFeeSuggestion() { _ptsClearZoneBadge(); }

// Listener con debounce en el campo de dirección
let _ptsFeeSearchTimer = null;
document.getElementById('ptsDeliveryAddress')?.addEventListener('input', (e) => {
    const val = e.target.value.trim();
    _ptsToggleFeeWrap(val.length > 0);
    if (val.length > 0) {
        clearTimeout(_ptsFeeSearchTimer);
        _ptsFeeSearchTimer = setTimeout(() => _ptsSuggestDeliveryFee(val), 600);
    } else {
        clearTimeout(_ptsFeeSearchTimer);
        _ptsClearZoneBadge();
    }
    // Ocultar el panel de confirmación si el usuario edita la dirección
    document.getElementById('ptsSaveAddrConfirm')?.setAttribute('hidden', '');
});

// ── Lógica de bloqueo/desbloqueo del input de dirección ──────────────────────
function _ptsLockAddrInput(text) {
    const input = document.getElementById('ptsDeliveryAddress');
    if (input) { input.value = text; input.readOnly = true; input.style.opacity = '0.75'; }
    document.getElementById('ptsAddrActions')?.removeAttribute('hidden');
}
function _ptsUnlockAddrInput() {
    const input = document.getElementById('ptsDeliveryAddress');
    if (input) { input.readOnly = false; input.style.opacity = ''; input.focus(); }
    document.getElementById('ptsAddrActions')?.setAttribute('hidden', '');
    document.getElementById('ptsSaveAddrConfirm')?.setAttribute('hidden', '');
}

// Botón ✏️ Editar — desbloquea el input para corregir la dirección
document.getElementById('ptsEditAddrBtn')?.addEventListener('click', () => {
    _ptsUnlockAddrInput();
});

// Botón + Nueva dirección — borra el input y desbloquea para escribir una dirección adicional
document.getElementById('ptsAddNewAddrBtn')?.addEventListener('click', () => {
    const input = document.getElementById('ptsDeliveryAddress');
    if (input) { input.value = ''; }
    _ptsUnlockAddrInput();
    _ptsToggleFeeWrap(false);
    _ptsClearZoneBadge();
    // También mostrar el input si estaba oculto por el chip picker
    document.getElementById('ptsAddressPicker')?.setAttribute('hidden', '');
    input?.removeAttribute('hidden');
});

// ── Dato pendiente mientras se espera respuesta del panel de confirmación ─────
let _ptsPendingConfirmFn = null;

function _ptsIsAddrNew(text) {
    if (!text || !_ptsSelectedClient?.id) return false;
    const list = Array.isArray(_ptsSelectedClient.savedAddresses) ? _ptsSelectedClient.savedAddresses : [];
    return !list.some((a) => {
        const t = typeof a === 'string' ? a : String(a?.address || '');
        return t.trim().toLowerCase() === text.trim().toLowerCase();
    });
}

async function _ptsSaveAddrToProfile(text) {
    if (!text || !_ptsSelectedClient?.id) return;
    const existing = Array.isArray(_ptsSelectedClient.savedAddresses) ? _ptsSelectedClient.savedAddresses : [];
    const newEntry = { address: text, latitude: null, longitude: null, primary: existing.length === 0 };
    const updatedList = [...existing, newEntry];
    try {
        await firebaseDb.collection(CLIENTS_COLLECTION).doc(_ptsSelectedClient.id).update({
            savedAddresses: updatedList,
            updatedAt: firestoreNow()
        });
        _ptsSelectedClient.savedAddresses = updatedList;
        const stateClient = clientsState.find((c) => c.id === _ptsSelectedClient.id);
        if (stateClient) stateClient.savedAddresses = updatedList;
    } catch (_) { /* silencioso — no bloquear el pedido por esto */ }
}

// Botones del panel de confirmación
document.getElementById('ptsSaveAddrYes')?.addEventListener('click', async () => {
    document.getElementById('ptsSaveAddrConfirm')?.setAttribute('hidden', '');
    const addrText = String(document.getElementById('ptsDeliveryAddress')?.value || '').trim();
    await _ptsSaveAddrToProfile(addrText);
    if (typeof _ptsPendingConfirmFn === 'function') { _ptsPendingConfirmFn(); _ptsPendingConfirmFn = null; }
});

document.getElementById('ptsSaveAddrNo')?.addEventListener('click', () => {
    document.getElementById('ptsSaveAddrConfirm')?.setAttribute('hidden', '');
    if (typeof _ptsPendingConfirmFn === 'function') { _ptsPendingConfirmFn(); _ptsPendingConfirmFn = null; }
});

// ── Crear nuevo cliente desde el modal POS ──────────────────────────────────
(function initPtsNewClient() {
    const newClientBtn  = document.getElementById('ptsNewClientBtn');
    const newClientForm = document.getElementById('ptsNewClientForm');
    const saveBtn       = document.getElementById('ptsNewClientSaveBtn');
    const nameInput     = document.getElementById('ptsNewClientName');
    const phoneInput    = document.getElementById('ptsNewClientPhone');
    const addrInput     = document.getElementById('ptsNewClientAddr');
    if (!newClientBtn || !newClientForm || !saveBtn) return;

    function resetForm() {
        if (nameInput) nameInput.value = '';
        if (phoneInput) phoneInput.value = '';
        if (addrInput) addrInput.value = '';
        newClientForm.setAttribute('hidden', '');
        newClientBtn.removeAttribute('hidden');
    }

    newClientBtn.addEventListener('click', () => {
        newClientBtn.setAttribute('hidden', '');
        newClientForm.removeAttribute('hidden');
        nameInput?.focus();
    });

    saveBtn.addEventListener('click', async () => {
        const name  = String(nameInput?.value || '').trim();
        const phone = String(phoneInput?.value || '').trim();
        const addr  = String(addrInput?.value || '').trim();

        if (!name || !phone) {
            showNotice('Nombre y teléfono son requeridos.', 'error');
            return;
        }

        saveBtn.disabled = true;
        saveBtn.textContent = 'Guardando…';

        try {
            const phoneDigits = normalizePhoneDigits ? normalizePhoneDigits(phone) : phone;
            const clientId = buildAdminClientDocumentId
                ? buildAdminClientDocumentId({ customerName: name, customerPhone: phone, address: addr })
                : `${phoneDigits}_${name.toLowerCase().replace(/\s+/g, '_')}`;

            const savedAddresses = addr ? [addr] : [];
            await firebaseDb.collection(CLIENTS_COLLECTION).doc(clientId).set({
                customerName: name,
                customerPhone: phone,
                customerPhoneDigits: phoneDigits,
                address: addr,
                savedAddresses,
                totalOrders: 0,
                totalSpent: 0,
                createdAt: firestoreNow(),
                source: 'admin_pos'
            }, { merge: true });

            // Recargar clientsState
            await fetchClients();

            // Seleccionar el cliente recién creado
            _ptsSelectedClient = { name, phone, savedAddresses };
            _ptsShowSelectedClientChip(_ptsSelectedClient);
            _ptsRefreshDomicilioSection();
            _ptsUpdateConfirmBtn();
            resetForm();
        } catch (err) {
            console.error('[POS] Error creando cliente:', err);
            showNotice('No se pudo guardar el cliente.', 'error');
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = 'Guardar y seleccionar';
        }
    });
})();

(function initPtsNewClientTab() {
    const saveBtn    = document.getElementById('ptsNewTabSaveBtn');
    const nameInput  = document.getElementById('ptsNewTabName');
    const phoneInput = document.getElementById('ptsNewTabPhone');
    const addrInput  = document.getElementById('ptsNewTabAddr');
    if (!saveBtn) return;

    saveBtn.addEventListener('click', async () => {
        const name  = String(nameInput?.value || '').trim();
        const phone = String(phoneInput?.value || '').trim();
        const addr  = String(addrInput?.value || '').trim();

        if (!name || !phone) {
            showNotice('Nombre y teléfono son requeridos.', 'error');
            return;
        }

        saveBtn.disabled = true;
        saveBtn.textContent = 'Guardando…';

        try {
            const phoneDigits = normalizePhoneDigits ? normalizePhoneDigits(phone) : phone;
            const clientId = buildAdminClientDocumentId
                ? buildAdminClientDocumentId({ customerName: name, customerPhone: phone, address: addr })
                : `${phoneDigits}_${name.toLowerCase().replace(/\s+/g, '_')}`;

            const savedAddresses = addr ? [addr] : [];
            await firebaseDb.collection(CLIENTS_COLLECTION).doc(clientId).set({
                customerName: name,
                customerPhone: phone,
                customerPhoneDigits: phoneDigits,
                address: addr,
                savedAddresses,
                totalOrders: 0,
                totalSpent: 0,
                createdAt: firestoreNow(),
                source: 'admin_pos'
            }, { merge: true });

            await fetchClients();

            _ptsSelectedClient = { name, phone, savedAddresses };
            _ptsShowSelectedClientChip(_ptsSelectedClient);
            _ptsUpdateConfirmBtn();

            // Limpiar campos
            if (nameInput) nameInput.value = '';
            if (phoneInput) phoneInput.value = '';
            if (addrInput) addrInput.value = '';

            // Actualizar sección de domicilio ahora que el cliente está asignado
            _ptsRefreshDomicilioSection();

            // Cambiar tab visualmente a "search" sin disparar el handler que limpiaría el cliente
            _ptsActiveTab = 'search';
            document.querySelectorAll('[data-pts-tab]').forEach((t) => {
                t.classList.toggle('active', t.dataset.ptsTab === 'search');
            });
            const panelQuick = document.getElementById('ptsPanelQuick');
            const panelSearch = document.getElementById('ptsPanelSearch');
            const panelNew = document.getElementById('ptsPanelNew');
            if (panelQuick) panelQuick.setAttribute('hidden', '');
            if (panelSearch) panelSearch.removeAttribute('hidden');
            if (panelNew) panelNew.setAttribute('hidden', '');

            showNotice(`Cliente "${name}" creado y seleccionado.`, 'success');
        } catch (err) {
            console.error('[POS] Error creando cliente desde pestaña Nuevo:', err);
            showNotice('No se pudo guardar el cliente.', 'error');
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = 'Guardar y seleccionar';
        }
    });
})();

// COBRAR: crear pedido y abrir flujo de pago inmediatamente
document.getElementById('posGuardarTicketBtn')?.addEventListener('click', () => {
    if (!internalOrderItems.length) {
        showNotice('Agrega al menos un producto al pedido.', 'warn');
        return;
    }
    if (posTicketConfig) {
        saveAdminOrderQuick(posTicketConfig, { cobrarAfter: true });
        posTicketConfig = null;
        renderPosCartTicketInfo();
        return;
    }
    _ptsCobrarAfterSave = true;
    openPosTicketSetupModal();
});

// Volver desde pantalla de pago
document.getElementById('posPaymentBackBtn')?.addEventListener('click', () => showPosScreen('main'));

// Buscador de usuarios en métricas
document.getElementById('metricsUserSearch')?.addEventListener('input', (e) => {
    const q = e.target.value.trim().toLowerCase();
    if (!q) {
        _renderMetricsUserRows(_metricsUsersFiltered);
        return;
    }
    const filtered = _metricsUsersFiltered.filter((u) => {
        const name = String(u.customerName || '').toLowerCase();
        const phone = String(u.customerPhone || '');
        return name.includes(q) || phone.includes(q);
    });
    _renderMetricsUserRows(filtered);
});

// Buscador de clientes POS en métricas
document.getElementById('metricsPosSrch')?.addEventListener('input', (e) => {
    const q = e.target.value.trim().toLowerCase();
    const filtered = q ? _metricsPosFiltered.filter((u) => {
        const name = String(u.customerName || '').toLowerCase();
        const phone = String(u.customerPhone || '');
        return name.includes(q) || phone.includes(q);
    }) : _metricsPosFiltered;
    _renderMetricsPosRows(filtered);
});

// Tabs de métricas (POS / APP / Productos)
document.querySelectorAll('.metrics-tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
        const tab = btn.dataset.metricsTab;
        document.querySelectorAll('.metrics-tab-btn').forEach((b) => b.classList.toggle('active', b === btn));
        document.querySelectorAll('.metrics-panel').forEach((p) => p.classList.toggle('active', p.id === `metricsPanel${tab.charAt(0).toUpperCase()}${tab.slice(1)}`));
        if (tab === 'pos') renderMetricsPos();
        if (tab === 'app') { renderMetricsUsers(); renderMetricasTrafico(); }
        if (tab === 'productos') renderMetricasProductos();
    });
});

// Filtro de período en métricas de productos
document.querySelectorAll('.prod-period-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.prod-period-btn').forEach((b) => b.classList.toggle('active', b === btn));
        renderMetricasProductos(btn.dataset.prodPeriod);
    });
});

// Cerrar lista de tickets
document.getElementById('posTicketsCloseBtn')?.addEventListener('click', () => {
    _posSelectedTicketIds.clear();
    showPosScreen('main');
});

// Eliminar tickets seleccionados
document.getElementById('posTicketDeleteBtn')?.addEventListener('click', () => {
    if (!_posSelectedTicketIds.size) return;
    const count = _posSelectedTicketIds.size;
    if (!confirm(`¿Eliminar ${count} ticket${count > 1 ? 's' : ''}?`)) return;
    const toDelete = [..._posSelectedTicketIds];
    toDelete.forEach((id) => deletePosTicketFromFirestore(id));
    posTickets = posTickets.filter((t) => !_posSelectedTicketIds.has(t.id));
    _posSelectedTicketIds.clear();
    // Si se eliminó el ticket activo, activar el primero que quede
    if (!posTickets.find((t) => t.id === posActiveTicketId)) {
        if (posTickets.length) {
            posActiveTicketId = posTickets[0].id;
            internalOrderItems = posTickets[0].items;
            posTicketConfig = null;
        } else {
            createNewPosTicket();
        }
    }
    renderPosTicketsList();
    renderPosTicketsBadge();
    renderPosCartTicketInfo();
    renderPosOrderItems();
    renderPosTotals();
    renderPosBottomBar();
});

// Cambiar tipo de pedido del ticket seleccionado
document.getElementById('posTicketChangeTypeBtn')?.addEventListener('click', () => {
    if (_posSelectedTicketIds.size !== 1) return;
    const [selectedId] = _posSelectedTicketIds;
    // Activar ese ticket y abrir el modal de configuración
    switchPosTicket(selectedId);
    _posSelectedTicketIds.clear();
    openPosTicketSetupModal(true);
});

// Nuevo ticket
document.getElementById('posNewTicketBtn')?.addEventListener('click', () => {
    posTicketConfig = null;
    internalOrderItems = [];
    createNewPosTicket();
    renderPosOrderItems();
    renderPosTotals();
    renderPosBottomBar();
    showPosScreen('main');
});

// Atajo rápido desde encabezados de columna del tablero de pedidos
document.getElementById('ordersBoard')?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-quick-type]');
    if (!btn) return;
    const type = btn.dataset.quickType;
    posTicketConfig = null;
    internalOrderItems = [];
    createNewPosTicket();
    if (!internalOrderModal?.classList.contains('is-open')) {
        openInternalOrderModal();
    } else {
        renderPosOrderItems();
        renderPosTotals();
        renderPosBottomBar();
        showPosScreen('main');
    }
    setTimeout(() => openPosTicketSetupModal(true, type), 60);
});

// Botón cliente en topbar principal

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

// ── Contador de cantidad en upgrade sheet ────────────────────────────────────
document.getElementById('posUpgradeQtyMinus')?.addEventListener('click', () => {
    if (!_posUpgradePending) return;
    _posUpgradePending.qty = Math.max(1, (_posUpgradePending.qty || 1) - 1);
    const el = document.getElementById('posUpgradeQtyVal');
    if (el) el.textContent = _posUpgradePending.qty;
});
document.getElementById('posUpgradeQtyPlus')?.addEventListener('click', () => {
    if (!_posUpgradePending) return;
    _posUpgradePending.qty = (_posUpgradePending.qty || 1) + 1;
    const el = document.getElementById('posUpgradeQtyVal');
    if (el) el.textContent = _posUpgradePending.qty;
});

// ── Admin: agregar nueva opción de acompañamiento
document.getElementById('addUpgradeOptionBtn')?.addEventListener('click', () => {
    if (!menuUpgradesConfig) menuUpgradesConfig = { ...DEFAULT_UPGRADES_CONFIG };
    if (!Array.isArray(menuUpgradesConfig.opciones)) menuUpgradesConfig.opciones = [];
    const newId = `opt-${Date.now()}`;
    menuUpgradesConfig.opciones.push({
        id: newId,
        nombre: 'Nueva opción',
        detalle: '',
        precio: 0,
        activo: true,
        orden: menuUpgradesConfig.opciones.length + 1,
        tiene_variantes: false,
        variantes: []
    });
    _upgradeSelectedOptId = newId;
    renderMenuUpgradesAdmin();
});

// (addFlavorBtn / newFlavorInput removidos — sabores ahora viven en sub-variantes de cada variante)

// ── Admin: guardar config de acompañamientos
document.getElementById('saveUpgradesConfigBtn')?.addEventListener('click', async () => {
    if (!menuUpgradesConfig) return;
    const btn = document.getElementById('saveUpgradesConfigBtn');
    if (btn) { btn.disabled = true; btn.textContent = 'Guardando...'; }
    try {
        menuUpgradesConfig.activo = true;
        await saveMenuUpgradesConfig(menuUpgradesConfig);
        showNotice('Acompañamientos guardados correctamente.', 'ok');
        _upgradeSelectedOptId = null;
        renderMenuUpgradesAdmin();
    } catch (e) {
        showNotice('Error al guardar: ' + (e.message || 'revisa la conexion'), 'error');
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Guardar Acompañamientos'; }
    }
});

// ── Menu: pestañas internas (Categorías / Acompañantes / Carrusel / Promociones)
document.querySelectorAll('.menu-inner-tab[data-menu-tab]').forEach((tab) => {
    tab.addEventListener('click', () => {
        const target = tab.dataset.menuTab;
        document.querySelectorAll('.menu-inner-tab[data-menu-tab]').forEach((t) => {
            const isActive = t.dataset.menuTab === target;
            t.classList.toggle('active', isActive);
            t.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });
        document.querySelectorAll('.menu-inner-panel[data-menu-panel]').forEach((panel) => {
            const isActive = panel.dataset.menuPanel === target;
            panel.classList.toggle('active', isActive);
            panel.hidden = !isActive;
            panel.style.display = isActive ? 'flex' : 'none';
        });
    });
});

// ── Sub-pestañas de Promociones (Promociones / Combos / 2x1 / Recomendado)
document.querySelectorAll('.promo-sub-tab[data-promo-tab]').forEach((tab) => {
    tab.addEventListener('click', () => {
        const target = tab.dataset.promoTab;
        document.querySelectorAll('.promo-sub-tab[data-promo-tab]').forEach((t) => {
            const isActive = t.dataset.promoTab === target;
            t.classList.toggle('active', isActive);
            t.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });
        document.querySelectorAll('.promo-sub-panel[data-promo-panel]').forEach((panel) => {
            const isActive = panel.dataset.promoPanel === target;
            panel.hidden = !isActive;
            panel.style.display = isActive ? '' : 'none';
        });
    });
});

// ── Pestañas de sección genéricas con scope (Informes, Configuracion, etc.)
document.querySelectorAll('[data-section-tab]').forEach((tab) => {
    tab.addEventListener('click', () => {
        const scope = tab.dataset.sectionScope;
        const target = tab.dataset.sectionTab;
        document.querySelectorAll(`[data-section-tab][data-section-scope="${scope}"]`).forEach((t) => {
            const isActive = t.dataset.sectionTab === target;
            t.classList.toggle('active', isActive);
            t.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });
        document.querySelectorAll(`[data-section-panel][data-section-scope="${scope}"]`).forEach((panel) => {
            const isActive = panel.dataset.sectionPanel === target;
            panel.classList.toggle('active', isActive);
            panel.hidden = !isActive;
            panel.style.display = isActive ? 'flex' : 'none';
        });
        // Auto-cargar al abrir pestañas de Informes
        if (scope === 'informes') {
            if (target === 'cajas') {
                const activeSubTab = document.querySelector('[data-cajas-tab].active');
                const subTarget = activeSubTab?.dataset?.cajasTab || 'caja-diaria';
                if (subTarget === 'caja-diaria') renderCajaDiaria();
                else if (subTarget === 'historial') renderLibroCierres();
                else if (subTarget === 'libro-contable') renderLibroContable();
            }
            if (target === 'tickets') _autoLoadTicketsTab();
            if (target === 'gastos') renderGastosInformes();
        }
    });
});

// ── Sub-tabs de Cajas (Caja Diaria / Historial de Cajas) ─────────────────────
document.querySelectorAll('[data-cajas-tab]').forEach((tab) => {
    tab.addEventListener('click', () => {
        const target = tab.dataset.cajasTab;
        document.querySelectorAll('[data-cajas-tab]').forEach((t) => {
            const isActive = t.dataset.cajasTab === target;
            t.classList.toggle('active', isActive);
            t.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });
        document.querySelectorAll('[data-cajas-panel]').forEach((panel) => {
            const isActive = panel.dataset.cajasPanel === target;
            panel.hidden = !isActive;
            panel.style.display = isActive ? '' : 'none';
        });
        if (target === 'caja-diaria') renderCajaDiaria();
        if (target === 'historial') renderLibroCierres();
        if (target === 'libro-contable') renderLibroContable();
    });
});

if (clientsSearchInput) {
    clientsSearchInput.addEventListener('input', () => {
        clientsSearchTerm = normalizeCategoryKey(clientsSearchInput.value || '');
        _clientsPage = 0;
        renderClients();
    });
}

// Inbox search
document.getElementById('inboxSearch')?.addEventListener('input', () => renderMessages());

// ── Inbox compose (nuevo mensaje a cliente registrado) ──────────────────────
(function initInboxCompose() {
    const composeBtn    = document.getElementById('inboxComposeBtn');
    const composePanel  = document.getElementById('inboxComposePanel');
    const cancelBtn     = document.getElementById('inboxComposeCancelBtn');
    const clientSearch  = document.getElementById('inboxClientSearch');
    const clientResults = document.getElementById('inboxClientResults');

    if (!composeBtn || !composePanel) return;

    function showComposePanel(visible) {
        if (visible) {
            composePanel.removeAttribute('hidden');
            clientSearch.value = '';
            renderClientResults('');
            clientSearch.focus();
        } else {
            composePanel.setAttribute('hidden', '');
        }
    }

    function renderClientResults(term) {
        if (!clientsState || clientsState.length === 0) {
            clientResults.innerHTML = '<p class="inbox-empty">No hay clientes registrados aún</p>';
            return;
        }
        const q = term.trim().toLowerCase();
        const matches = q
            ? clientsState.filter(c =>
                String(c.customerName || '').toLowerCase().includes(q) ||
                String(c.customerPhone || '').toLowerCase().includes(q)
              )
            : clientsState.slice(0, 20);

        if (!matches.length) {
            clientResults.innerHTML = '<p class="inbox-empty">Sin resultados</p>';
            return;
        }

        clientResults.innerHTML = '';
        matches.forEach(client => {
            const initial = (client.customerName || client.customerPhone || '?').charAt(0).toUpperCase();
            const item = document.createElement('div');
            item.className = 'inbox-client-result-item';
            item.innerHTML = `
                <div class="inbox-client-avatar">${initial}</div>
                <div class="inbox-client-info">
                    <div class="inbox-client-name">${escapeHtml(client.customerName || 'Sin nombre')}</div>
                    <div class="inbox-client-phone">${escapeHtml(client.customerPhone || '')}</div>
                </div>
            `;
            item.addEventListener('click', () => openOrCreateConversation(client));
            clientResults.appendChild(item);
        });
    }

    async function openOrCreateConversation(client) {
        showComposePanel(false);

        // Buscar conversación existente de este cliente
        const existing = messagesState.find(m =>
            m.customerPhone === client.customerPhone ||
            m.customerId === client.id
        );
        if (existing) {
            openInboxDetail(existing.id);
            return;
        }

        // Crear nuevo hilo en Firestore
        try {
            const newDoc = {
                customerName: client.customerName || 'Cliente',
                customerPhone: client.customerPhone || '',
                customerId: client.id || '',
                subject: 'Mensaje directo',
                body: '',
                type: 'admin_direct_message',
                source: 'admin_panel',
                status: 'pending',
                replies: [],
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            const ref = await firebaseDb.collection(MESSAGES_COLLECTION).add(newDoc);
            // Esperar a que onSnapshot lo incorpore y luego abrir
            // Como respaldo, abrimos por id inmediatamente
            setTimeout(() => openInboxDetail(ref.id), 400);
        } catch (err) {
            console.error('[Inbox] Error creando conversación:', err);
        }
    }

    composeBtn.addEventListener('click', () => {
        const isVisible = !composePanel.hasAttribute('hidden');
        showComposePanel(!isVisible);
    });

    cancelBtn?.addEventListener('click', () => showComposePanel(false));

    clientSearch?.addEventListener('input', () => {
        renderClientResults(clientSearch.value);
    });
})();

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

        const tapped = String(tab.dataset.mobileOrdersTab || '').trim();
        activeMobileOrdersLane = activeMobileOrdersLane === tapped ? '' : tapped;
        applyMobileOrdersLane();
    });
}

mobileTicketCloseBtn?.addEventListener('click', () => {
    closeMobileTicketPanel({ clearSelection: true });
    renderOrders();
});

document.getElementById('ticketBtBtn')?.addEventListener('click', () => {
    const btn = document.getElementById('ticketBtBtn');
    if (btn?.dataset.btAction === 'disconnect') {
        disconnectBluetoothPrinter();
    } else {
        connectBluetoothPrinter();
    }
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

// Delegación de acciones de mensajes en todo el panel de mensajes (sidebar + detail)
document.addEventListener('click', async (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    // FAB chat → ir a mensajes
    if (target.closest('#adminChatFab')) {
        const mensajesBtn = document.querySelector('[data-accordion-target="mensajes"]');
        if (mensajesBtn) mensajesBtn.click();
        return;
    }

    const actionButton = target.closest('button[data-message-action]');
    if (!(actionButton instanceof HTMLButtonElement)) return;

    const action = String(actionButton.dataset.messageAction || '').trim();
    const messageId = String(actionButton.dataset.messageId || '').trim();
    if (!action || !messageId) return;

    // Para reply desde el input inline
    if (action === 'reply') {
        const inputEl = document.getElementById('inboxReplyInput');
        const replyBody = inputEl ? inputEl.value.trim() : '';
        if (!replyBody) { showNotice('Escribe un mensaje primero.', 'warn'); return; }
        const message = messagesState.find(e => e.id === messageId);
        if (!message) return;
        try {
            const adminIdentity = getCurrentAdminIdentity();
            await createAdminDirectReply(message, replyBody);
            await updateMessageRequest(messageId, { status: 'resolved', resolvedAt: firestoreNow(), resolvedBy: adminIdentity, adminAction: 'direct_reply_sent', adminReply: replyBody });
            showNotice('Respuesta enviada.', 'ok');
        } catch (err) { showNotice(`Error: ${err.message || 'error inesperado.'}`, 'error'); }
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
            ? `Hola ${message.customerName}, vimos tu mensaje en ${brandingState.restaurantName || 'Roal Burger'} y queremos ayudarte.`
            : `Hola ${message.customerName}, te escribimos desde ${brandingState.restaurantName || 'Roal Burger'} sobre tu solicitud de reinicio de contrasena.`;
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
        if (!confirmed) return;
        try {
            const adminIdentity = getCurrentAdminIdentity();
            await resetClientPasswordByPhone(message.customerPhoneDigits);
            let copied = false;
            try { copied = await copyTextToClipboard(buildCustomerPasswordResetClipboardMessage(message)); } catch (_) {}
            await updateMessageRequest(messageId, { status: 'resolved', resolvedAt: firestoreNow(), resolvedBy: adminIdentity, adminAction: 'password_reset_completed' });
            if (copied) showClipboardToast('Mensaje de restablecimiento copiado');
            showNotice('Contrasena reseteada. El cliente ya puede crear una nueva.', 'ok');
        } catch (error) {
            showNotice(`No se pudo resetear la contrasena: ${error.message || 'error inesperado.'}`, 'error');
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
        if (!confirmed) return;
        try {
            if (_inboxActiveId === messageId) {
                _inboxActiveId = null;
                const detail = document.getElementById('inboxDetail');
                if (detail) detail.innerHTML = '<div class="inbox-detail-empty"><span>💬</span><p>Selecciona una conversación</p></div>';
            }
            await deleteMessageRequest(messageId);
            showNotice('Solicitud eliminada correctamente.', 'ok');
        } catch (error) {
            showNotice(`No se pudo eliminar la solicitud: ${error.message || 'error inesperado.'}`, 'error');
        }
    }
});

// ── Chips de direcciones: agregar y eliminar ──
document.getElementById('clientEditAddAddressBtn')?.addEventListener('click', () => {
    const input = document.getElementById('clientEditNewAddress');
    const val = String(input?.value || '').trim();
    if (!val) return;
    const current = getClientAddrChips();
    if (current.some((a) => a.toLowerCase() === val.toLowerCase())) return;
    renderClientAddrChips([...current, val]);
    if (input) input.value = '';
    input?.focus();
});

document.getElementById('clientEditNewAddress')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); document.getElementById('clientEditAddAddressBtn')?.click(); }
});

document.getElementById('clientEditAddressList')?.addEventListener('click', (e) => {
    const del = e.target.closest('.client-addr-del');
    if (!del) return;
    const chip = del.closest('.client-addr-chip');
    if (!chip) return;
    const current = getClientAddrChips().filter((a) => a !== chip.dataset.addr);
    renderClientAddrChips(current);
});

if (clientEditForm) {
    clientEditForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        hideNotice();
        hideModalFeedback(clientEditFeedback);

        const customerName = String(clientEditNameInput?.value || '').trim();
        const customerPhone = String(clientEditPhoneInput?.value || '').trim();
        const address = String(clientEditAddressInput?.value || '').trim();
        const savedAddresses = normalizeClientSavedAddresses(getClientAddrChips(), address);
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

const ordersActionRoot = document;
if (ordersActionRoot) {
    ordersActionRoot.addEventListener('click', async (event) => {
        const target = event.target;
        if (!(target instanceof Element)) {
            return;
        }

        // Acordeon de pedidos procesados
        const processedToggle = target.closest('[data-processed-col]');
        if (processedToggle instanceof HTMLButtonElement) {
            const colKey = processedToggle.dataset.processedCol;
            const section = ordersBoard.querySelector(`[data-processed-section="${colKey}"]`);
            if (_processedAccordionExpanded.has(colKey)) {
                _processedAccordionExpanded.delete(colKey);
                processedToggle.classList.remove('is-open');
                if (section) {
                    section.hidden = true;
                    section.style.display = 'none';
                }
            } else {
                _processedAccordionExpanded.add(colKey);
                processedToggle.classList.add('is-open');
                if (section) {
                    section.hidden = false;
                    section.style.display = '';
                }
            }
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
                requestAnimationFrame(() => {
                    document.querySelector(`article[data-order-id="${orderId}"]`)
                        ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                });
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
                requestAnimationFrame(() => {
                    document.querySelector(`article[data-order-id="${orderId}"]`)
                        ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                });
                return;
            }

            const order = ordersState.find((entry) => entry.id === orderId);
            if (!order) {
                return;
            }

            actionButton.disabled = true;
            try {
                if (nextStatus === 'recibir_pedido') {
                    const isDeliveryOrder = order.orderType === 'domicilio' || order.fulfillmentType === 'delivery';
                    if (isDeliveryOrder) {
                        openDeliveryPaymentModal(order, true);
                        actionButton.disabled = false;
                        return;
                    }
                    // Mesa / para recoger: recibir directamente sin cobro
                    const copied = await copyTextToClipboard(buildReceivedOrderMessage(order));
                    await updateOrder(orderId, { status: 'preparacion', receivedAt: firestoreNow() });
                    await reloadDataAndRender();
                    showNotice(
                        copied ? 'Pedido recibido, movido a su columna y mensaje copiado.' : 'Pedido recibido y movido a su columna.',
                        copied ? 'ok' : 'error'
                    );
                    closeUnreadTray();
                    return;
                }

                if (nextStatus === 'cobrar_pendiente') {
                    // Cobrar desde "por confirmar": siempre registra pago y mueve a preparación
                    openDeliveryPaymentModal(order, true);
                    actionButton.disabled = false;
                    return;
                }

                if (nextStatus === 'recibir_sin_cobro') {
                    // Recibir sin cobrar: mueve a preparación sin registrar pago
                    const copied = await copyTextToClipboard(buildReceivedOrderMessage(order));
                    await updateOrder(orderId, { status: 'preparacion', receivedAt: firestoreNow() });
                    await reloadDataAndRender();
                    showNotice(
                        copied ? 'Pedido recibido sin cobro y movido a preparación.' : 'Pedido recibido.',
                        'ok'
                    );
                    closeUnreadTray();
                    return;
                }

                if (nextStatus === 'cobrar_mesa') {
                    // Si ya fue cobrado con un método principal conocido, cerrar directo sin volver a cobrar
                    const _knownMethodIds = getPaymentMethods().map((m) => m.id);
                    if (order.paymentMethod && order.paymentMethod !== 'pendiente' && _knownMethodIds.includes(order.paymentMethod)) {
                        await updateOrder(orderId, { status: 'entregado', deliveredAt: firestoreNow() });
                        await reloadDataAndRender();
                        showNotice('Pedido cerrado.', 'ok');
                        return;
                    }
                    openDeliveryPaymentModal(order, 'mesa');
                    actionButton.disabled = false;
                    return;
                }

                if (nextStatus === 'cobrar_domicilio') {
                    openDeliveryPaymentModal(order, false);
                    actionButton.disabled = false;
                    return;
                }

                if (nextStatus === 'cobrar_retiro') {
                    openDeliveryPaymentModal(order, 'mesa');
                    actionButton.disabled = false;
                    return;
                }

                if (nextStatus === 'editar_pos') {
                    await editAdminPosOrder(order);
                    return;
                }

                if (nextStatus === 'eliminar') {
                    if (order.status === 'entregado') {
                        // Orden ya procesada: eliminar permanentemente del sistema
                        const confirmed = window.confirm(`¿Eliminar definitivamente el pedido #${order.code}?\nEsta acción no se puede deshacer.`);
                        if (!confirmed) return;
                        await deleteOrder(orderId);
                        if (selectedOrderId === orderId) selectedOrderId = null;
                        await fetchOrders();
                        renderOrders();
                        showNotice('Pedido eliminado permanentemente.', 'ok');
                    } else {
                        // Orden activa: anular (queda registrada como ANULADO)
                        const confirmed = window.confirm(`¿Anular el pedido #${order.code}?\nQuedará registrado como ANULADO en Procesados.`);
                        if (!confirmed) return;
                        await anularOrder(orderId);
                        if (selectedOrderId === orderId) selectedOrderId = null;
                        showNotice('Pedido anulado. Aparece en Procesados con sello ANULADO.', 'ok');
                        closeUnreadTray();
                    }
                    return;
                }

                if (nextStatus === 'esperando_domiciliario') {
                    const pm = String(order.paymentMethod || 'pendiente').toLowerCase();
                    if (pm === 'pendiente') {
                        showNotice('Procesa el pago antes de pedir domiciliario.', 'error');
                        return;
                    }
                    // Actualizar estado primero para que falle del portapapeles no bloquee la operación
                    const courierMsg = buildCourierRequestMessage(order);
                    await updateOrder(orderId, { status: nextStatus, courierRequestedAt: firestoreNow() });
                    const copied = await copyTextToClipboard(courierMsg);
                    showNotice(
                        copied
                            ? 'Mensaje para domiciliario copiado y pedido en espera.'
                            : 'Pedido en espera de domiciliario.',
                        'ok'
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

                if (nextStatus === 'servido') {
                    await updateOrder(orderId, { status: 'servido', servidoAt: firestoreNow() });
                    await reloadDataAndRender();
                    showNotice('Pedido marcado como servido.', 'ok');
                    return;
                }

                if (nextStatus === 'entregado' && (!order.paymentMethod || order.paymentMethod === 'pendiente')) {
                    const isDomicilio = order.orderType === 'domicilio';
                    openDeliveryPaymentModal(order, isDomicilio ? false : 'mesa');
                    actionButton.disabled = false;
                    return;
                }

                const copied = await copyTextToClipboard(buildDeliveredOrderMessage(order));
                await updateOrder(orderId, { status: nextStatus, deliveredAt: firestoreNow(), paidAt: firestoreNow() });
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

        if (selectedOrderId) {
            const selectedOrder = ordersState.find((entry) => entry.id === selectedOrderId) || null;
            renderOrderTicket(selectedOrder, { openMobile: isMobileAdminViewport() });
        }
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

        // Acciones que usan selectedOrderId (botones inyectados sin data-order-id)
        if (actionButton.dataset.orderTicketAction === 'editar_pos') {
            const order = ordersState.find(o => o.id === selectedOrderId);
            if (!order) { showNotice('Pedido no encontrado.', 'error'); return; }
            editAdminPosOrder(order);
            return;
        }

        if (actionButton.dataset.orderTicketAction === 'eliminar') {
            const order = ordersState.find(o => o.id === selectedOrderId);
            if (!order) { showNotice('Pedido no encontrado.', 'error'); return; }
            if (confirm(`¿Eliminar el pedido #${order.code}?`)) {
                selectedOrderId = null;
                await deleteOrder(order.id);
                showNotice(`Pedido #${order.code} eliminado.`, 'ok');
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

        if (actionButton.dataset.orderTicketAction === 'kitchen') {
            try {
                openKitchenPrintTicket(orderId);
            } catch (error) {
                showNotice(`No se pudo imprimir ticket de cocina: ${error.message || 'error inesperado.'}`, 'error');
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
            return;
        }

        if (actionButton.dataset.orderTicketAction === 'cobrar') {
            const order = ordersState.find(o => o.id === orderId);
            if (!order) { showNotice('Pedido no encontrado.', 'error'); return; }
            _triggerTicketCobro(order);
            return;
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
        const hasImageFile = (createProductImageFileInput?.files?.length ?? 0) > 0;

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
            if (hasImageFile && !_createProductImgUrl) {
                showModalFeedback(productCreateFeedback, 'La imagen no se pudo subir. Seleccionala de nuevo.', 'error');
                if (productCreateSaveBtn) { productCreateSaveBtn.disabled = false; productCreateSaveBtn.textContent = 'Crear producto'; }
                return;
            }
            const finalImageUrl = _createProductImgUrl || buildDefaultProductImage(nombre, categoria);

            const safeSlug = slugify(nombre) || `producto-${Date.now()}`;
            const productId = `${safeSlug}-${Date.now()}`;
            const productPayload = {
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
            };
            await firebaseDb.collection('productos').doc(productId).set(productPayload);

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
        const hasImageFile = (editProductImageFileInput?.files?.length ?? 0) > 0;

        const acompActivo = editProductAcompActivo ? editProductAcompActivo.checked : false;
        const acompIds = editProductAcompList
            ? Array.from(editProductAcompList.querySelectorAll('input[name="acompId"]:checked')).map((cb) => cb.value)
            : [];
        const acompanantes = { activo: acompActivo, ids: acompIds };

        if (!productId || !nombre || !categoria) {
            showNotice('Completa nombre y categoria del producto.', 'error');
            return;
        }

        if (!Number.isFinite(precio) || precio < 0) {
            showNotice('Precio invalido.', 'error');
            return;
        }

        if (productEditSaveBtn) {
            productEditSaveBtn.disabled = true;
            productEditSaveBtn.textContent = 'Guardando...';
        }

        try {
            if (hasImageFile && !_editProductImgUrl) {
                showNotice('La imagen no se pudo subir. Seleccionala de nuevo.', 'error');
                if (productEditSaveBtn) { productEditSaveBtn.disabled = false; productEditSaveBtn.textContent = 'Guardar cambios'; }
                return;
            }
            const finalImageUrl = hasImageFile ? _editProductImgUrl : _editProductExistingUrl;

            await firebaseDb.collection('productos').doc(productId).update({
                nombre,
                precio,
                categoria,
                estado,
                es_destacado: esDestacado,
                image_url: finalImageUrl,
                acompanantes,
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

// ── Vista previa y subida anticipada de imagen (crear / editar producto) ───────
if (createProductImageFileInput) {
    createProductImageFileInput.addEventListener('change', async () => {
        const file       = createProductImageFileInput.files[0];
        const previewImg = document.getElementById('createProductImgPreview');
        const previewWrap = document.getElementById('createProductImgPreviewWrap');
        const statusEl   = document.getElementById('createProductImgStatus');
        _createProductImgUrl = '';

        if (!file) {
            if (previewWrap) previewWrap.style.display = 'none';
            return;
        }

        // Preview local inmediata
        const objUrl = URL.createObjectURL(file);
        if (previewImg)  { previewImg.src = objUrl; previewImg.onload = () => URL.revokeObjectURL(objUrl); }
        if (previewWrap) previewWrap.style.display = '';

        // Subida a Storage (desactiva guardar mientras dura)
        if (productCreateSaveBtn) productCreateSaveBtn.disabled = true;
        if (statusEl) statusEl.textContent = 'Subiendo imagen...';

        try {
            const nombre = createProductNameInput?.value?.trim()
                || file.name.replace(/\.[^.]+$/, '');
            _createProductImgUrl = await _uploadProductImageToStorage(file, nombre);
            if (statusEl) statusEl.textContent = '✓ Imagen lista.';
        } catch (err) {
            _createProductImgUrl = '';
            if (statusEl) statusEl.textContent = `Error al subir: ${err.message || 'intenta de nuevo'}`;
        } finally {
            if (productCreateSaveBtn) productCreateSaveBtn.disabled = false;
        }
    });
}

if (editProductImageFileInput) {
    editProductImageFileInput.addEventListener('change', async () => {
        const file      = editProductImageFileInput.files[0];
        const previewImg = document.getElementById('editProductImgPreview');
        const statusEl  = document.getElementById('editProductImgStatus');
        _editProductImgUrl = '';

        if (!file) {
            if (previewImg) {
                previewImg.src          = _editProductExistingUrl;
                previewImg.style.display = _editProductExistingUrl ? 'block' : 'none';
            }
            return;
        }

        // Preview local inmediata
        const objUrl = URL.createObjectURL(file);
        if (previewImg) {
            previewImg.src          = objUrl;
            previewImg.style.display = 'block';
            previewImg.onload       = () => URL.revokeObjectURL(objUrl);
        }

        // Subida a Storage
        if (productEditSaveBtn) productEditSaveBtn.disabled = true;
        if (statusEl) statusEl.textContent = 'Subiendo imagen...';

        try {
            const nombre = editProductNameInput?.value?.trim()
                || file.name.replace(/\.[^.]+$/, '');
            _editProductImgUrl = await _uploadProductImageToStorage(file, nombre);
            if (statusEl) statusEl.textContent = '✓ Imagen lista.';
        } catch (err) {
            _editProductImgUrl = '';
            if (statusEl) statusEl.textContent = `Error al subir: ${err.message || 'intenta de nuevo'}`;
        } finally {
            if (productEditSaveBtn) productEditSaveBtn.disabled = false;
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

// ── Dirty tracking: habilita el botón de guardar solo cuando hay cambios ──
function initDirtyForm(formEl, saveBtnId) {
    const btn = saveBtnId ? document.getElementById(saveBtnId) : formEl?.querySelector('[type="submit"]');
    if (!formEl || !btn) return { markClean: () => {}, markDirty: () => {} };
    function markClean() { btn.disabled = true; }
    function markDirty() { btn.disabled = false; }
    formEl.addEventListener('input', markDirty);
    formEl.addEventListener('change', markDirty);
    markClean();
    return { markClean, markDirty };
}

const brandingDirty = initDirtyForm(brandingForm, 'brandingSaveBtn');

// ── Save bar del panel Negocio ─────────────────────────────────────────────
const _bizSaveBar = document.getElementById('bizSaveBar');
const _bizSaveBarBtn = document.getElementById('bizSaveBarBtn');
function _bizShowSaveBar() { if (_bizSaveBar) _bizSaveBar.hidden = false; }
function _bizHideSaveBar() { if (_bizSaveBar) _bizSaveBar.hidden = true; }
brandingForm.addEventListener('input', _bizShowSaveBar);
brandingForm.addEventListener('change', _bizShowSaveBar);
if (_bizSaveBarBtn) _bizSaveBarBtn.addEventListener('click', () => brandingForm.requestSubmit());

// ── Cambio de contraseña (Firebase Auth) ───────────────────────────────────
document.getElementById('bizChangePasswordBtn')?.addEventListener('click', async () => {
    const statusEl = document.getElementById('bizPasswordStatus');
    const btn = document.getElementById('bizChangePasswordBtn');
    const currentPwd = document.getElementById('bizCurrentPassword')?.value?.trim() || '';
    const newPwd     = document.getElementById('bizNewPassword')?.value?.trim() || '';
    const confirmPwd = document.getElementById('bizConfirmPassword')?.value?.trim() || '';

    const showPassStatus = (msg, type) => {
        if (!statusEl) return;
        statusEl.textContent = msg;
        statusEl.className = `biz-pass-status ${type}`;
        statusEl.hidden = false;
    };

    if (!currentPwd || !newPwd || !confirmPwd) {
        showPassStatus('Completa todos los campos de contraseña.', 'error'); return;
    }
    if (newPwd !== confirmPwd) {
        showPassStatus('Las contraseñas nuevas no coinciden.', 'error'); return;
    }
    if (newPwd.length < 6) {
        showPassStatus('La nueva contraseña debe tener al menos 6 caracteres.', 'error'); return;
    }
    if (newPwd === currentPwd) {
        showPassStatus('La nueva contraseña debe ser diferente a la actual.', 'error'); return;
    }

    const user = firebaseAuth?.currentUser;
    if (!user || !user.email) {
        showPassStatus('No hay sesión activa. Recarga la página.', 'error'); return;
    }

    if (btn) { btn.disabled = true; btn.textContent = 'Actualizando...'; }
    try {
        const credential = firebase.auth.EmailAuthProvider.credential(user.email, currentPwd);
        await user.reauthenticateWithCredential(credential);
        await user.updatePassword(newPwd);
        showPassStatus('Contraseña actualizada correctamente.', 'ok');
        document.getElementById('bizCurrentPassword').value = '';
        document.getElementById('bizNewPassword').value = '';
        document.getElementById('bizConfirmPassword').value = '';
    } catch (err) {
        const msg = err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential'
            ? 'La contraseña actual es incorrecta.'
            : err.code === 'auth/too-many-requests'
            ? 'Demasiados intentos. Espera un momento.'
            : `Error: ${err.message || 'intenta de nuevo.'}`;
        showPassStatus(msg, 'error');
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Actualizar contraseña'; }
    }
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
        brandingDirty.markClean();
        _bizHideSaveBar();
        showNotice('Informacion del negocio guardada.', 'ok');
    } catch (error) {
        showNotice(`No se pudo guardar la configuracion: ${error.message || 'Error inesperado.'}`, 'error');
    }
});

const horarioFormEl = document.getElementById('horarioForm');
const horarioDirty = initDirtyForm(horarioFormEl, 'horarioSaveBtn');
if (horarioFormEl) {
    horarioFormEl.addEventListener('submit', async (event) => {
        event.preventDefault();
        hideNotice();
        const fd = new FormData(horarioFormEl);
        const [aH, aM] = (fd.get('horarioApertura') || '16:00').split(':').map(Number);
        const [cH, cM] = (fd.get('horarioCierre') || '22:00').split(':').map(Number);
        const payload = {
            aperturaHora: Number.isFinite(aH) ? aH : 16,
            aperturaMinuto: Number.isFinite(aM) ? aM : 0,
            cierreHora: Number.isFinite(cH) ? cH : 22,
            cierreMinuto: Number.isFinite(cM) ? cM : 0,
            etiquetaHorario: String(fd.get('horarioEtiqueta') || DEFAULT_HORARIO.etiquetaHorario).trim(),
            mensajeCierre: String(fd.get('horarioMensajeCierre') || DEFAULT_HORARIO.mensajeCierre).trim(),
            updatedAt: firestoreNow()
        };
        try {
            await firebaseDb.collection(CONFIG_COLLECTION).doc(HORARIO_DOC_ID).set(payload, { merge: true });
            horarioState = { ...horarioState, ...payload };
            renderHorarioForm();
            horarioDirty.markClean();
            showNotice('Horario guardado correctamente.', 'ok');
        } catch (error) {
            showNotice(`No se pudo guardar el horario: ${error.message || 'Error inesperado.'}`, 'error');
        }
    });
}

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

// ---- Recomendado del dia event listeners ----
document.querySelectorAll('input[name="recomendadoMode"]').forEach((radio) => {
    radio.addEventListener('change', () => {
        const manualPanel = document.getElementById('recomendadoManualPanel');
        const currentBox = document.getElementById('recomendadoCurrentBox');
        const isManual = document.getElementById('recomendadoModeManual')?.checked;
        if (manualPanel) manualPanel.hidden = !isManual;
        if (!isManual) {
            _recomendadoSelectedProductId = null;
            if (currentBox) currentBox.hidden = true;
        } else if (_recomendadoSelectedProductId) {
            const product = productsState.find((p) => p.id === _recomendadoSelectedProductId);
            renderRecomendadoCurrentBox(product || null);
        }
    });
});

const recomendadoSearchInput = document.getElementById('recomendadoProductSearch');
if (recomendadoSearchInput) {
    recomendadoSearchInput.addEventListener('input', (e) => {
        _renderRecomendadoSearchResults(e.target.value);
    });
}

const recomendadoResultsEl = document.getElementById('recomendadoSearchResults');
if (recomendadoResultsEl) {
    recomendadoResultsEl.addEventListener('click', (e) => {
        const item = e.target.closest('[data-recomendado-product-id]');
        if (!item) return;
        _recomendadoSelectedProductId = item.dataset.recomendadoProductId;
        const product = productsState.find((p) => p.id === _recomendadoSelectedProductId);
        renderRecomendadoCurrentBox(product || null);
        recomendadoResultsEl.hidden = true;
        if (recomendadoSearchInput) recomendadoSearchInput.value = '';
    });
}

const saveRecomendadoDiaBtn = document.getElementById('saveRecomendadoDiaBtn');
if (saveRecomendadoDiaBtn) {
    saveRecomendadoDiaBtn.addEventListener('click', saveRecomendadoDiaConfig);
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
        initCajaAperturaSync();
        ensureOrdersRealtimeTicker();
        setupLiveFirebaseSync();
        subscribePosTickets();
    } catch (error) {
        if (!document.body.classList.contains('admin-unlocked')) {
            document.body.classList.add('admin-locked');
            document.body.classList.remove('admin-unlocked');
        }

        showNotice(`Error de conexion con Firebase: ${error.message || 'revisa la configuracion.'}`, 'error');
    }
}

// ── Modal cobro domicilio ──────────────────────────────────────────────────
const PAYMENT_METHODS_DOC_ID = 'metodos_pago';

const DPM_DEFAULT_METHODS = [
    { id: 'efectivo',    label: 'Efectivo',    icon: '💵', enabled: true, subs: [] },
    { id: 'bancolombia', label: 'Bancolombia', icon: '🏦', enabled: true, subs: ['transferencia', 'tarjeta'] },
    { id: 'nequi',       label: 'Nequi',       icon: '💜', enabled: true, subs: ['transferencia', 'tarjeta'] },
    { id: 'bold',        label: 'Bold',        icon: '💳', enabled: true, subs: ['transferencia', 'tarjeta'] },
];

let _paymentMethods = [];
let _dpmCurrentOrderId = null;
let _dpmSelectedMethod = null;
let _dpmSubMethod = null;
let _dpmCashTender = 0;
let _dpmCashMode = null; // 'exacto' | 'cambio'
let _dpmOrderTotal = 0;
let _dpmReceiveOrder = false;
let _dpmSplitMode = false;
let _dpmSplitParts = []; // [{method: string|null, amount: number|null}]

function getPaymentMethods() {
    return _paymentMethods.length ? _paymentMethods : DPM_DEFAULT_METHODS;
}

function getEnabledPaymentMethods() {
    return getPaymentMethods().filter((m) => m.enabled !== false);
}

function _normalizePaymentMethodId(rawId) {
    if (!rawId) return rawId;
    const methods = getPaymentMethods();
    if (methods.find((m) => m.id === rawId)) return rawId;
    const parent = methods.find((m) => Array.isArray(m.subs) && m.subs.includes(rawId));
    return parent ? parent.id : rawId;
}

async function loadPaymentMethods() {
    try {
        const doc = await firebaseDb.collection(CONFIG_COLLECTION).doc(PAYMENT_METHODS_DOC_ID).get();
        if (doc.exists && Array.isArray(doc.data()?.methods)) {
            _paymentMethods = doc.data().methods;
        } else {
            // Primera vez: guardar los defaults en Firestore para que persistan
            _paymentMethods = [...DPM_DEFAULT_METHODS];
            await firebaseDb.collection(CONFIG_COLLECTION).doc(PAYMENT_METHODS_DOC_ID)
                .set({ methods: _paymentMethods });
        }
    } catch (_) {
        _paymentMethods = [...DPM_DEFAULT_METHODS];
    }
    renderPaymentConfigPanel();
}

async function savePaymentMethods(methods) {
    await firebaseDb.collection(CONFIG_COLLECTION).doc(PAYMENT_METHODS_DOC_ID).set({ methods });
    _paymentMethods = methods;
}

function renderDpmMethodButtons() {
    const grid = document.getElementById('dpmMethodsGrid');
    if (!grid) return;
    grid.innerHTML = getEnabledPaymentMethods().map((m) =>
        `<button type="button" class="dpm-method-btn" data-dpm-method="${m.id}">
            <span class="dpm-method-icon">${m.icon}</span>
            <span>${m.label}</span>
        </button>`
    ).join('');
}

function _dpmShowSubSection(methodKey) {
    const subSection = document.getElementById('dpmSubSection');
    const panelEfectivo = document.getElementById('dpmSubEfectivo');
    const panelChips = document.getElementById('dpmSubChips');
    if (!subSection) return;
    [panelEfectivo, panelChips].forEach((p) => p?.setAttribute('hidden', ''));
    _dpmSubMethod = null;

    const method = getPaymentMethods().find((m) => m.id === methodKey);

    if (methodKey === 'efectivo') {
        panelEfectivo?.removeAttribute('hidden');
        subSection.removeAttribute('hidden');
        _dpmCashMode = null;
        _dpmCashTender = 0;
        document.querySelectorAll('#dpmCashModeChips .dpm-sub-chip').forEach((b) => b.classList.remove('active'));
        document.getElementById('dpmCashWrap')?.setAttribute('hidden', '');
        document.getElementById('dpmChangeRow')?.setAttribute('hidden', '');
        const cashInput = document.getElementById('dpmCashInput');
        if (cashInput) cashInput.value = '';
        return;
    }

    if (!method || method.subs.length === 0) {
        subSection.setAttribute('hidden', '');
        return;
    }

    const SUB_LABELS = { transferencia: 'Transferencia', tarjeta: 'Tarjeta' };
    const chipsLabel = document.getElementById('dpmSubChipsLabel');
    const chipsContainer = document.getElementById('dpmSubChipsContainer');
    if (chipsLabel) chipsLabel.textContent = `¿Cómo pagó con ${method.label}?`;
    if (chipsContainer) {
        chipsContainer.innerHTML = method.subs.map((k) =>
            `<button type="button" class="dpm-sub-chip" data-dpm-sub="${k}">${SUB_LABELS[k] || k}</button>`
        ).join('');
    }
    panelChips?.removeAttribute('hidden');
    subSection.removeAttribute('hidden');
}

function _dpmSplitAssignedTotal() {
    return _dpmSplitParts.reduce((s, p) => s + (Number(p.amount) > 0 ? Number(p.amount) : 0), 0);
}

function _dpmSplitRemainder() {
    return _dpmOrderTotal - _dpmSplitAssignedTotal();
}

function _dpmSplitIsValid() {
    if (_dpmSplitParts.length < 2) return false;
    if (_dpmSplitParts.some((p) => !p.method)) return false;
    const noAmount = _dpmSplitParts.filter((p) => !(Number(p.amount) > 0));
    if (noAmount.length === 0) return Math.abs(_dpmSplitAssignedTotal() - _dpmOrderTotal) <= 1;
    if (noAmount.length === 1) return _dpmSplitRemainder() > 0;
    return false;
}

function _dpmGetSplitData() {
    const remainder = _dpmSplitRemainder();
    return _dpmSplitParts
        .map((p) => ({ method: p.method, amount: Number(p.amount) > 0 ? Number(p.amount) : Math.max(0, remainder) }))
        .filter((p) => p.method && p.amount > 0);
}

function _dpmUpdateSplitBalance() {
    const balanceEl = document.getElementById('dpmSplitBalance');
    const balanceAmt = document.getElementById('dpmSplitBalanceAmt');
    const remainder = _dpmSplitRemainder();
    const assigned = _dpmSplitAssignedTotal();
    const noAmountCount = _dpmSplitParts.filter((p) => !(Number(p.amount) > 0)).length;
    if (balanceAmt) {
        if (assigned === 0) {
            balanceAmt.textContent = formatMoney(_dpmOrderTotal);
            balanceEl?.setAttribute('class', 'dpm-split-balance');
        } else if (noAmountCount === 1 || Math.abs(remainder) <= 1) {
            balanceAmt.textContent = `✓ ${formatMoney(_dpmOrderTotal)}`;
            balanceEl?.setAttribute('class', 'dpm-split-balance ok');
        } else if (remainder < -1) {
            balanceAmt.textContent = `Excede ${formatMoney(Math.abs(remainder))} — Total: ${formatMoney(_dpmOrderTotal)}`;
            balanceEl?.setAttribute('class', 'dpm-split-balance over');
        } else {
            balanceAmt.textContent = `Faltan ${formatMoney(remainder)} — Total: ${formatMoney(_dpmOrderTotal)}`;
            balanceEl?.setAttribute('class', 'dpm-split-balance partial');
        }
    }
    const confirmBtn = document.getElementById('dpmConfirmBtn');
    if (confirmBtn && _dpmSplitMode) confirmBtn.disabled = !_dpmSplitIsValid();
}

function _dpmUpdateAutoRemainder() {
    // Solo hay una parte "Restante": la única sin monto cuando emptyAmountCount === 1
    const remainder = Math.max(0, _dpmSplitRemainder());
    const emptyCount = _dpmSplitParts.filter((p) => !(Number(p.amount) > 0)).length;
    if (emptyCount !== 1) return;
    _dpmSplitParts.forEach((part, idx) => {
        if (!(Number(part.amount) > 0)) {
            const row = document.querySelector(`.dpm-part-row[data-part-idx="${idx}"]`);
            if (!row) return;
            const tag = row.querySelector('.dpm-part-remainder-tag');
            if (tag) tag.textContent = `Restante: ${formatMoney(remainder)}`;
        }
    });
}

function _dpmRenderSplitParts() {
    const container = document.getElementById('dpmSplitParts');
    if (!container) return;
    const methods = getEnabledPaymentMethods();
    const remainder = _dpmSplitRemainder();
    const canAdd = _dpmSplitParts.length < methods.length;

    const emptyAmountCount = _dpmSplitParts.filter((p) => !(Number(p.amount) > 0)).length;

    container.innerHTML = _dpmSplitParts.map((part, idx) => {
        // "Restante" solo cuando es la ÚNICA fila sin monto → las demás siempre muestran input
        const isAutoRemainder = !(Number(part.amount) > 0) && emptyAmountCount === 1;
        const canRemove = _dpmSplitParts.length > 2;
        const methodInfo = part.method ? methods.find((m) => m.id === part.method) : null;

        const amountHtml = isAutoRemainder
            ? `<span class="dpm-part-remainder-tag">Restante: ${formatMoney(Math.max(0, remainder))}</span>`
            : `<input type="number" class="dpm-part-amount-input${Number(part.amount) > 0 ? ' filled' : ''}"
                data-part-amount="${idx}" placeholder="$ 0" min="0" step="1000" inputmode="numeric"
                value="${Number(part.amount) > 0 ? part.amount : ''}">`;

        const labelHtml = methodInfo
            ? `<span class="dpm-part-method-label">${methodInfo.icon} ${escapeHtml(methodInfo.label)}</span>`
            : `<span class="dpm-part-method-label empty">Selecciona un método ↑</span>`;

        return `<div class="dpm-part-row${part.method ? ' has-method' : ''}" data-part-idx="${idx}">
            <div class="dpm-part-top">
                <div class="dpm-part-method-chips">
                    ${methods.map((m) => `<button type="button" class="dpm-part-method-chip${part.method === m.id ? ' selected' : ''}"
                        data-part-method="${m.id}" data-part-idx="${idx}" title="${escapeHtml(m.label)}">${m.icon}</button>`).join('')}
                </div>
                ${canRemove ? `<button type="button" class="dpm-part-remove-btn" data-part-remove="${idx}">×</button>` : ''}
            </div>
            <div class="dpm-part-bottom">
                ${labelHtml}
                ${amountHtml}
            </div>
        </div>`;
    }).join('');

    const addBtn = document.getElementById('dpmSplitAddBtn');
    if (addBtn) addBtn.style.display = canAdd ? '' : 'none';

    _dpmUpdateSplitBalance();
}

function _dpmEnterSplitMode() {
    _dpmSplitMode = true;
    _dpmSplitParts = [{ method: null, amount: null }, { method: null, amount: null }];
    _dpmSelectedMethod = null;
    _dpmSubMethod = null;
    _dpmCashMode = null;
    document.getElementById('dpmMethodsGrid')?.setAttribute('hidden', '');
    document.getElementById('dpmSubSection')?.setAttribute('hidden', '');
    document.getElementById('dpmSplitWrap')?.removeAttribute('hidden');
    const toggleBtn = document.getElementById('dpmSplitToggleBtn');
    if (toggleBtn) { toggleBtn.classList.add('active'); toggleBtn.textContent = '× Solo'; }
    _dpmRenderSplitParts();
    const confirmBtn = document.getElementById('dpmConfirmBtn');
    if (confirmBtn) confirmBtn.disabled = true;
}

function _dpmExitSplitMode() {
    _dpmSplitMode = false;
    _dpmSplitParts = [];
    document.getElementById('dpmMethodsGrid')?.removeAttribute('hidden');
    document.getElementById('dpmSplitWrap')?.setAttribute('hidden', '');
    const toggleBtn = document.getElementById('dpmSplitToggleBtn');
    if (toggleBtn) { toggleBtn.classList.remove('active'); toggleBtn.textContent = '+ Multi'; }
    _dpmSelectedMethod = null;
    document.querySelectorAll('#dpmMethodsGrid .dpm-method-btn').forEach((b) => b.classList.remove('active'));
    _dpmUpdateConfirmState();
}

function _dpmUpdateConfirmState() {
    if (_dpmSplitMode) { _dpmRenderSplitParts(); return; }
    const btn = document.getElementById('dpmConfirmBtn');
    if (!btn || !_dpmSelectedMethod) { if (btn) btn.disabled = true; return; }
    if (_dpmSelectedMethod === 'efectivo') {
        btn.disabled = !(_dpmCashMode === 'exacto' || (_dpmCashMode === 'cambio' && _dpmCashTender > 0));
    } else {
        const method = getPaymentMethods().find((m) => m.id === _dpmSelectedMethod);
        btn.disabled = method && method.subs.length > 0 ? !_dpmSubMethod : false;
    }
}

// ── Payment Flow (flujo de cobro simplificado en 2 pasos) ─────────────────
let _pfOrder = null;
let _pfReceiveOrder = false;
let _pfSelectedMethod = null;
let _pfOrderTotal = 0;

function _pfParseCash(val) {
    return parseInt(String(val || '').replace(/\D/g, ''), 10) || 0;
}

function _pfFormatCash(num) {
    return num > 0 ? num.toLocaleString('es-CO') : '';
}

function _pfHandleViewport() {
    const vv = window.visualViewport;
    const overlay = document.getElementById('pfOverlay');
    if (!overlay || overlay.hasAttribute('hidden')) return;
    if (vv) {
        overlay.style.top    = `${vv.offsetTop}px`;
        overlay.style.left   = `${vv.offsetLeft}px`;
        overlay.style.width  = `${vv.width}px`;
        overlay.style.height = `${vv.height}px`;
    }
}

function _pfResetViewport() {
    const overlay = document.getElementById('pfOverlay');
    if (!overlay) return;
    overlay.style.top = '';
    overlay.style.left = '';
    overlay.style.width = '';
    overlay.style.height = '';
}

function _pfClose() {
    window.visualViewport?.removeEventListener('resize', _pfHandleViewport);
    window.visualViewport?.removeEventListener('scroll', _pfHandleViewport);
    _pfResetViewport();
    document.getElementById('pfOverlay')?.setAttribute('hidden', '');
    _pfOrder = null;
    _pfReceiveOrder = false;
    _pfSelectedMethod = null;
    _pfOrderTotal = 0;
}

function _pfShowStep(stepId) {
    ['pfStep1', 'pfStep2Cash', 'pfStep2Digital'].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.hidden = id !== stepId;
    });
    const backBtn = document.getElementById('pfBackBtn');
    if (backBtn) backBtn.hidden = stepId === 'pfStep1';
}

async function _pfProcessPayment(method, subMethod, cashTender) {
    const order = _pfOrder;
    const receiveOrder = _pfReceiveOrder;
    const total = _pfOrderTotal;
    if (!order) return;
    _pfClose();

    const paymentUpdate = {
        paymentMethod: method,
        paymentSubMethod: subMethod || '',
        cashTenderAmount: method === 'efectivo' ? cashTender : null,
        cashChangeRequired: method === 'efectivo' && cashTender > total,
        cashChangeAmount: method === 'efectivo' && cashTender > total ? cashTender - total : null,
        paidAt: firestoreNow(),
    };

    try {
        const todayStr = new Date().toISOString().split('T')[0];
        const paidSinceApertura = ordersState.filter((o) => {
            if (!o.paidAt) return false;
            const ms = typeof o.paidAt.toMillis === 'function' ? o.paidAt.toMillis() : Number(o.paidAt);
            if (cajaAperturaAt) return ms >= cajaAperturaAt;
            return new Date(ms).toISOString().split('T')[0] === todayStr;
        }).length;

        if (receiveOrder === 'mesa') {
            await updateOrder(order.id, { status: 'entregado', deliveredAt: firestoreNow(), ...paymentUpdate });
            await reloadDataAndRender();
            if (isMobileAdminViewport()) closeMobileTicketPanel({ clearSelection: true });
            showNotice('Pago registrado y pedido cerrado.', 'ok');
        } else if (receiveOrder) {
            const copied = await copyTextToClipboard(buildReceivedOrderMessage({ ...order, ...paymentUpdate }));
            await updateOrder(order.id, { status: 'preparacion', receivedAt: firestoreNow(), ...paymentUpdate });
            await reloadDataAndRender();
            if (isMobileAdminViewport()) closeMobileTicketPanel({ clearSelection: true });
            showNotice(
                copied ? 'Pedido recibido, movido a preparación y mensaje copiado.' : 'Pedido recibido y movido a preparación.',
                copied ? 'ok' : 'error'
            );
            closeUnreadTray();
        } else {
            await updateOrder(order.id, paymentUpdate);
            await reloadDataAndRender();
            if (isMobileAdminViewport()) closeMobileTicketPanel({ clearSelection: true });
            showNotice('Pago registrado correctamente.', 'ok');
        }

        if (!_cajaDiariaAutoOpened && paidSinceApertura === 0) {
            _cajaDiariaAutoOpened = true;
            _navigateToCajaDiaria();
        }
    } catch (err) {
        showNotice(`No se pudo procesar el pedido: ${err.message || 'error inesperado.'}`, 'error');
    }
}

function openDeliveryPaymentModal(order, receiveOrder = true) {
    _pfOrder = order;
    _pfReceiveOrder = receiveOrder;
    _pfSelectedMethod = null;
    _pfOrderTotal = getOrderDisplayTotal(order);

    const nameEl = document.getElementById('pfCustomerName');
    const totalEl = document.getElementById('pfTotalDisplay');
    const titleEl = document.getElementById('pfTitle');
    if (nameEl) nameEl.textContent = order.customerName || '';
    if (totalEl) totalEl.textContent = formatMoney(_pfOrderTotal);
    if (titleEl) titleEl.textContent = receiveOrder ? 'Cobrar pedido' : 'Registrar pago';

    _pfShowStep('pfStep1');
    document.getElementById('pfOverlay')?.removeAttribute('hidden');
    window.visualViewport?.addEventListener('resize', _pfHandleViewport);
    window.visualViewport?.addEventListener('scroll', _pfHandleViewport);
    _pfHandleViewport();
}

function closeDeliveryPaymentModal() {
    _pfClose();
}

document.getElementById('deliveryPaymentModal')?.addEventListener('click', async (e) => {
    if (e.target.closest('#dpmCancelBtn')) { closeDeliveryPaymentModal(); return; }

    // Toggle modo multi
    if (e.target.closest('#dpmSplitToggleBtn')) {
        if (_dpmSplitMode) { _dpmExitSplitMode(); } else { _dpmEnterSplitMode(); }
        return;
    }

    // Agregar parte en modo multi
    if (e.target.closest('#dpmSplitAddBtn') && _dpmSplitMode) {
        _dpmSplitParts.push({ method: null, amount: null });
        _dpmRenderSplitParts();
        return;
    }

    // Eliminar parte en modo multi
    const removeBtn = e.target.closest('[data-part-remove]');
    if (removeBtn && _dpmSplitMode) {
        const idx = Number(removeBtn.dataset.partRemove);
        _dpmSplitParts.splice(idx, 1);
        _dpmRenderSplitParts();
        return;
    }

    // Selección de método en una parte (modo multi)
    const partMethodBtn = e.target.closest('[data-part-method][data-part-idx]');
    if (partMethodBtn && _dpmSplitMode) {
        const idx = Number(partMethodBtn.dataset.partIdx);
        _dpmSplitParts[idx].method = partMethodBtn.dataset.partMethod;
        _dpmRenderSplitParts();
        const inputs = document.querySelectorAll(`[data-part-amount="${idx}"]`);
        if (inputs.length) inputs[0].focus();
        return;
    }

    // Selección de método principal (solo en modo normal)
    const methodBtn = e.target.closest('[data-dpm-method]');
    if (methodBtn && !_dpmSplitMode) {
        _dpmSelectedMethod = methodBtn.dataset.dpmMethod;
        document.querySelectorAll('#dpmMethodsGrid .dpm-method-btn').forEach((b) =>
            b.classList.toggle('active', b === methodBtn)
        );
        _dpmShowSubSection(_dpmSelectedMethod);
        _dpmUpdateConfirmState();
        return;
    }

    // Selección de modo efectivo (monto exacto / con cambio)
    const cashModeBtn = e.target.closest('[data-dpm-cash-mode]');
    if (cashModeBtn) {
        _dpmCashMode = cashModeBtn.dataset.dpmCashMode;
        document.querySelectorAll('#dpmCashModeChips .dpm-sub-chip').forEach((b) =>
            b.classList.toggle('active', b === cashModeBtn)
        );
        const cashWrap = document.getElementById('dpmCashWrap');
        if (_dpmCashMode === 'exacto') {
            _dpmCashTender = _dpmOrderTotal;
            cashWrap?.setAttribute('hidden', '');
        } else {
            _dpmCashTender = 0;
            cashWrap?.removeAttribute('hidden');
            const cashInput = document.getElementById('dpmCashInput');
            if (cashInput) { cashInput.value = ''; cashInput.focus(); }
            document.getElementById('dpmChangeRow')?.setAttribute('hidden', '');
        }
        _dpmUpdateConfirmState();
        return;
    }

    // Selección de sub-método (chip)
    const subChip = e.target.closest('[data-dpm-sub]');
    if (subChip) {
        _dpmSubMethod = subChip.dataset.dpmSub;
        document.querySelectorAll('#dpmSubChipsContainer .dpm-sub-chip').forEach((c) =>
            c.classList.toggle('active', c === subChip)
        );
        _dpmUpdateConfirmState();
        return;
    }

    // Confirmar
    const confirmBtn = e.target.closest('#dpmConfirmBtn');
    if (confirmBtn && !confirmBtn.disabled && _dpmCurrentOrderId && (_dpmSelectedMethod || _dpmSplitMode)) {
        confirmBtn.disabled = true;
        const orderId      = _dpmCurrentOrderId;
        const method       = _dpmSelectedMethod;
        const subMethod    = _dpmSubMethod;
        const cashTender   = _dpmCashTender;
        const orderTotal   = _dpmOrderTotal;
        const receiveOrder = _dpmReceiveOrder;
        const isSplit      = _dpmSplitMode;
        const splitData    = _dpmGetSplitData();
        const order = ordersState.find((o) => o.id === orderId);
        closeDeliveryPaymentModal();

        if (order) {
            const paymentUpdate = isSplit
                ? {
                    paymentMethod: 'split',
                    paymentSplit: splitData,
                    paymentSubMethod: '',
                    cashTenderAmount: null,
                    cashChangeRequired: false,
                    cashChangeAmount: null,
                    paidAt: firestoreNow(),
                }
                : {
                    paymentMethod: method,
                    paymentSubMethod: subMethod || '',
                    cashTenderAmount: method === 'efectivo' ? cashTender : null,
                    cashChangeRequired: method === 'efectivo' && cashTender > orderTotal,
                    cashChangeAmount: method === 'efectivo' && cashTender > orderTotal ? cashTender - orderTotal : null,
                    paidAt: firestoreNow(),
                };
            try {
                const todayStr = new Date().toISOString().split('T')[0];
                const paidSinceApertura = ordersState.filter((o) => {
                    if (!o.paidAt) return false;
                    const ms = typeof o.paidAt.toMillis === 'function' ? o.paidAt.toMillis() : Number(o.paidAt);
                    if (cajaAperturaAt) return ms >= cajaAperturaAt;
                    return new Date(ms).toISOString().split('T')[0] === todayStr;
                }).length;

                if (receiveOrder === 'mesa') {
                    await updateOrder(orderId, { status: 'entregado', deliveredAt: firestoreNow(), ...paymentUpdate });
                    await reloadDataAndRender();
                    if (isMobileAdminViewport()) closeMobileTicketPanel({ clearSelection: true });
                    showNotice('Pago registrado y pedido cerrado.', 'ok');
                } else if (receiveOrder) {
                    const copied = await copyTextToClipboard(buildReceivedOrderMessage({ ...order, ...paymentUpdate }));
                    await updateOrder(orderId, { status: 'preparacion', receivedAt: firestoreNow(), ...paymentUpdate });
                    await reloadDataAndRender();
                    if (isMobileAdminViewport()) closeMobileTicketPanel({ clearSelection: true });
                    showNotice(
                        copied ? 'Pedido recibido, movido a preparación y mensaje copiado.' : 'Pedido recibido y movido a preparación.',
                        copied ? 'ok' : 'error'
                    );
                    closeUnreadTray();
                } else {
                    await updateOrder(orderId, paymentUpdate);
                    await reloadDataAndRender();
                    if (isMobileAdminViewport()) closeMobileTicketPanel({ clearSelection: true });
                    showNotice('Pago registrado correctamente.', 'ok');
                }

                if (!_cajaDiariaAutoOpened && paidSinceApertura === 0) {
                    _cajaDiariaAutoOpened = true;
                    _navigateToCajaDiaria();
                }
            } catch (err) {
                showNotice(`No se pudo procesar el pedido: ${err.message || 'error inesperado.'}`, 'error');
            }
        }
    }
});

// Inputs de monto en modo multi — solo actualiza balance, sin re-render completo
document.getElementById('dpmSplitWrap')?.addEventListener('input', (e) => {
    const inp = e.target.closest('[data-part-amount]');
    if (!inp) return;
    const idx = Number(inp.dataset.partAmount);
    if (_dpmSplitParts[idx]) {
        _dpmSplitParts[idx].amount = Number(inp.value) > 0 ? Number(inp.value) : null;
        inp.classList.toggle('filled', Number(inp.value) > 0);
    }
    _dpmUpdateSplitBalance();
    // Si hay una parte sin monto (último como restante), actualizar su etiqueta
    _dpmUpdateAutoRemainder();
});

// Input de efectivo: calcular cambio en tiempo real
document.getElementById('dpmCashInput')?.addEventListener('input', (e) => {
    _dpmCashTender = Number(e.target.value) || 0;
    const changeRow = document.getElementById('dpmChangeRow');
    const changeEl = document.getElementById('dpmChangeAmount');
    if (_dpmCashTender > 0 && _dpmOrderTotal > 0) {
        const change = _dpmCashTender - _dpmOrderTotal;
        if (changeRow) changeRow.removeAttribute('hidden');
        if (changeEl) changeEl.textContent = change >= 0 ? formatMoney(change) : `— (faltan ${formatMoney(Math.abs(change))})`;
        if (changeEl) changeEl.style.color = change >= 0 ? '#6dd294' : '#ff7b7b';
    } else {
        changeRow?.setAttribute('hidden', '');
    }
    _dpmUpdateConfirmState();
});

// ── Payment Flow — event handlers ─────────────────────────────────────────
document.getElementById('pfOverlay')?.addEventListener('click', async (e) => {
    if (e.target === document.getElementById('pfOverlay')) { _pfClose(); return; }
    if (e.target.closest('#pfCloseBtn')) { _pfClose(); return; }

    if (e.target.closest('#pfBackBtn')) {
        const titleEl = document.getElementById('pfTitle');
        if (titleEl) titleEl.textContent = _pfReceiveOrder ? 'Cobrar pedido' : 'Registrar pago';
        _pfShowStep('pfStep1');
        return;
    }

    const methodBtn = e.target.closest('[data-pf-method]');
    if (methodBtn) {
        const method = methodBtn.dataset.pfMethod;
        _pfSelectedMethod = method;

        if (method === 'efectivo') {
            const titleEl = document.getElementById('pfTitle');
            if (titleEl) titleEl.textContent = 'Pago en efectivo';
            const totalEl = document.getElementById('pfCashOrderTotal');
            if (totalEl) totalEl.textContent = formatMoney(_pfOrderTotal);
            const cashInput = document.getElementById('pfCashInput');
            if (cashInput) { cashInput.value = ''; cashInput.removeAttribute('readonly'); }
            const changeLine = document.getElementById('pfChangeLine');
            if (changeLine) changeLine.hidden = true;
            const confirmBtn = document.getElementById('pfCashConfirmBtn');
            if (confirmBtn) confirmBtn.disabled = true;
            _pfShowStep('pfStep2Cash');
            setTimeout(() => document.getElementById('pfCashInput')?.focus(), 120);
        } else {
            const names = { bancolombia: 'Bancolombia', nequi: 'Nequi', bold: 'Bold' };
            const label = names[method] || method;
            const titleEl = document.getElementById('pfTitle');
            if (titleEl) titleEl.textContent = label;
            const labelEl = document.getElementById('pfDigitalLabel');
            if (labelEl) labelEl.textContent = `¿Cómo pagó con ${label}?`;
            _pfShowStep('pfStep2Digital');
        }
        return;
    }

    const submethodBtn = e.target.closest('[data-pf-submethod]');
    if (submethodBtn) {
        await _pfProcessPayment(_pfSelectedMethod, submethodBtn.dataset.pfSubmethod, null);
        return;
    }

    if (e.target.closest('#pfSinCambioBtn')) {
        await _pfProcessPayment('efectivo', '', _pfOrderTotal);
        return;
    }

    const confirmBtn = e.target.closest('#pfCashConfirmBtn');
    if (confirmBtn && !confirmBtn.disabled) {
        const cashTender = _pfParseCash(document.getElementById('pfCashInput')?.value || '');
        await _pfProcessPayment('efectivo', '', cashTender);
        return;
    }
});

document.getElementById('pfCashInput')?.addEventListener('input', (e) => {
    const rawNum = _pfParseCash(e.target.value);
    const formatted = _pfFormatCash(rawNum);
    if (e.target.value !== formatted) e.target.value = formatted;

    const total = _pfOrderTotal;
    const changeLine = document.getElementById('pfChangeLine');
    const changeVal = document.getElementById('pfChangeVal');
    const confirmBtn = document.getElementById('pfCashConfirmBtn');

    if (rawNum <= 0) {
        if (changeLine) changeLine.hidden = true;
        if (confirmBtn) confirmBtn.disabled = true;
        return;
    }

    const change = rawNum - total;
    if (changeLine) changeLine.hidden = false;
    if (change >= 0) {
        if (changeVal) { changeVal.textContent = formatMoney(change); changeVal.className = ''; }
        if (confirmBtn) confirmBtn.disabled = false;
    } else {
        if (changeVal) { changeVal.textContent = `Faltan ${formatMoney(Math.abs(change))}`; changeVal.className = 'insufficient'; }
        if (confirmBtn) confirmBtn.disabled = true;
    }
});

// ── Configuración de métodos de pago (CRUD) ────────────────────────────────
let _pmEditingId = null;

const _PM_SUB_LABELS = { transferencia: 'Transferencia', tarjeta: 'Tarjeta' };

function renderPaymentConfigPanel() {
    const panel = document.getElementById('paymentConfigPanel');
    if (!panel) return;
    const methods = getPaymentMethods();
    panel.innerHTML = `
        <div class="pm-list" id="pmMethodsList">
            ${methods.map((m) => `
                <div class="pm-method-card" data-pm-id="${m.id}">
                    <div class="pm-method-header">
                        <span class="pm-method-name">
                            <span class="pm-method-icon">${escapeHtml(m.icon)}</span>${escapeHtml(m.label)}
                            ${m.subs.length > 0 ? `<span class="pm-subs-badges">${m.subs.map((s) => `<span class="pm-sub-badge">${_PM_SUB_LABELS[s] || s}</span>`).join('')}</span>` : ''}
                        </span>
                        <div class="pm-method-actions">
                            <label class="pm-toggle" title="${m.enabled !== false ? 'Activo' : 'Inactivo'}">
                                <input type="checkbox" data-pm-toggle="${escapeHtml(m.id)}" ${m.enabled !== false ? 'checked' : ''}>
                                <span class="pm-toggle-slider"></span>
                            </label>
                            <button type="button" class="pm-icon-btn" data-pm-edit="${escapeHtml(m.id)}" title="Editar">✏️</button>
                            <button type="button" class="pm-icon-btn pm-icon-btn--del" data-pm-delete="${escapeHtml(m.id)}" title="Eliminar">🗑️</button>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
        <div class="pm-method-form-wrap" id="pmMethodFormWrap" hidden>
            <div class="pm-method-form">
                <div class="pm-form-row">
                    <label class="pm-form-label">Nombre</label>
                    <input type="text" id="pmFormLabel" class="pm-form-input" placeholder="ej: Daviplata" maxlength="30">
                </div>
                <div class="pm-form-row">
                    <label class="pm-form-label">Icono (emoji)</label>
                    <input type="text" id="pmFormIcon" class="pm-form-input pm-form-icon-input" placeholder="💳" maxlength="4">
                </div>
                <div class="pm-form-row">
                    <label class="pm-form-label">Sub-opciones de pago</label>
                    <div class="pm-sub-checks">
                        <label class="pm-sub-option-toggle">
                            <input type="checkbox" id="pmFormSubTransferencia">
                            <span>Transferencia</span>
                        </label>
                        <label class="pm-sub-option-toggle">
                            <input type="checkbox" id="pmFormSubTarjeta">
                            <span>Tarjeta</span>
                        </label>
                    </div>
                </div>
                <div class="pm-form-actions">
                    <button type="button" class="admin-button" id="pmFormSaveBtn" style="grid-column:auto;">Guardar</button>
                    <button type="button" class="ghost-button" id="pmFormCancelBtn">Cancelar</button>
                </div>
            </div>
        </div>
        <button type="button" class="ghost-button" id="pmAddBtn" style="margin-top:14px;width:100%;">+ Agregar método</button>
    `;

    panel.querySelectorAll('[data-pm-toggle]').forEach((cb) => {
        cb.addEventListener('change', async () => {
            const id = cb.dataset.pmToggle;
            const updated = getPaymentMethods().map((m) => m.id === id ? { ...m, enabled: cb.checked } : m);
            await _pmSaveAndRefresh(updated, `Método ${cb.checked ? 'activado' : 'desactivado'}.`);
        });
    });

    panel.querySelectorAll('[data-pm-edit]').forEach((btn) => {
        btn.addEventListener('click', () => _pmOpenForm(btn.dataset.pmEdit));
    });

    panel.querySelectorAll('[data-pm-delete]').forEach((btn) => {
        btn.addEventListener('click', async () => {
            const id = btn.dataset.pmDelete;
            const method = getPaymentMethods().find((m) => m.id === id);
            if (!method) return;
            if (!confirm(`¿Eliminar el método "${method.label}"?`)) return;
            const updated = getPaymentMethods().filter((m) => m.id !== id);
            await _pmSaveAndRefresh(updated, `Método "${method.label}" eliminado.`);
        });
    });

    panel.querySelector('#pmAddBtn')?.addEventListener('click', () => _pmOpenForm(null));
    panel.querySelector('#pmFormSaveBtn')?.addEventListener('click', _pmFormSave);
    panel.querySelector('#pmFormCancelBtn')?.addEventListener('click', () => {
        document.getElementById('pmMethodFormWrap')?.setAttribute('hidden', '');
        _pmEditingId = null;
    });
}

function _pmOpenForm(editId) {
    _pmEditingId = editId || null;
    const wrap = document.getElementById('pmMethodFormWrap');
    if (!wrap) return;
    const labelInput  = document.getElementById('pmFormLabel');
    const iconInput   = document.getElementById('pmFormIcon');
    const subTrans    = document.getElementById('pmFormSubTransferencia');
    const subTarjeta  = document.getElementById('pmFormSubTarjeta');
    if (editId) {
        const m = getPaymentMethods().find((m) => m.id === editId);
        if (!m) return;
        if (labelInput) labelInput.value = m.label;
        if (iconInput)  iconInput.value  = m.icon;
        if (subTrans)   subTrans.checked   = m.subs.includes('transferencia');
        if (subTarjeta) subTarjeta.checked = m.subs.includes('tarjeta');
    } else {
        if (labelInput) labelInput.value = '';
        if (iconInput)  iconInput.value  = '';
        if (subTrans)   subTrans.checked   = false;
        if (subTarjeta) subTarjeta.checked = false;
    }
    wrap.removeAttribute('hidden');
    labelInput?.focus();
}

async function _pmFormSave() {
    const label = document.getElementById('pmFormLabel')?.value?.trim();
    const icon  = document.getElementById('pmFormIcon')?.value?.trim() || '💳';
    if (!label) { showNotice('El nombre del método es requerido.', 'error'); return; }
    const subs = [];
    if (document.getElementById('pmFormSubTransferencia')?.checked) subs.push('transferencia');
    if (document.getElementById('pmFormSubTarjeta')?.checked) subs.push('tarjeta');

    const editingId = _pmEditingId;
    let updated;
    if (editingId) {
        updated = getPaymentMethods().map((m) => m.id === editingId ? { ...m, label, icon, subs } : m);
    } else {
        const id = label.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
        if (!id) { showNotice('Nombre inválido.', 'error'); return; }
        if (getPaymentMethods().some((m) => m.id === id)) {
            showNotice('Ya existe un método con ese nombre.', 'error'); return;
        }
        updated = [...getPaymentMethods(), { id, label, icon, enabled: true, subs }];
    }
    document.getElementById('pmMethodFormWrap')?.setAttribute('hidden', '');
    _pmEditingId = null;
    await _pmSaveAndRefresh(updated, editingId ? 'Método actualizado.' : 'Método agregado.');
}

async function _pmSaveAndRefresh(methods, successMsg) {
    try {
        await savePaymentMethods(methods);
        renderPaymentConfigPanel();
        if (successMsg) showNotice(successMsg, 'ok');
    } catch (e) {
        showNotice('Error al guardar: ' + (e.message || 'error'), 'error');
    }
}

// ── Categorías de Gastos ──────────────────────────────────────────────────────
const CATEGORIAS_GASTOS_DOC_ID = 'categorias_gastos';
const DEFAULT_CATEGORIAS_GASTOS = [
    { id: 'proveedor',  nombre: 'Proveedor',  icon: '🏭', subs: [] },
    { id: 'salarios',   nombre: 'Salarios',   icon: '👷', subs: [] },
    { id: 'impuestos',  nombre: 'Impuestos',  icon: '🏛️', subs: [] },
    { id: 'publicidad', nombre: 'Publicidad', icon: '📢', subs: [] },
    { id: 'mobiliario', nombre: 'Mobiliario', icon: '🪑', subs: [] },
    { id: 'otros',      nombre: 'Otros',      icon: '📦', subs: [] },
];
let _categoriasGastosState = DEFAULT_CATEGORIAS_GASTOS.map((c) => ({ ...c, subs: [...(c.subs || [])] }));

async function loadCategoriasGastos() {
    try {
        const doc = await firebaseDb.collection(CONFIG_COLLECTION).doc(CATEGORIAS_GASTOS_DOC_ID).get();
        if (doc.exists && Array.isArray(doc.data()?.categorias) && doc.data().categorias.length) {
            _categoriasGastosState = doc.data().categorias;
        }
    } catch (_) {}
}

async function saveCategoriasGastos() {
    await firebaseDb.collection(CONFIG_COLLECTION).doc(CATEGORIAS_GASTOS_DOC_ID).set({ categorias: _categoriasGastosState });
}

function getCategoriasGastos() {
    return _categoriasGastosState.length ? _categoriasGastosState : DEFAULT_CATEGORIAS_GASTOS;
}

// ── Gastos de Caja ────────────────────────────────────────────────────────────
const GASTOS_CAJA_COLLECTION = 'gastos_caja';
let _gastosCajaState = [];
let _gastoSelectedMethod = null;
let _gastoCategoriaId = null;
let _gastoSubcategoria = null;
let _gastoFromHistorial = false;

async function loadGastosCaja() {
    try {
        const snap = await firebaseDb.collection(GASTOS_CAJA_COLLECTION)
            .orderBy('registradoAt', 'desc')
            .limit(200)
            .get();
        // Excluir gastos externos (tipo:'externo') — esos pertenecen al historial
        _gastosCajaState = snap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .filter((g) => g.tipo !== 'externo');
    } catch (_) {
        _gastosCajaState = [];
    }
}

async function saveGasto(gasto) {
    const docRef = firebaseDb.collection(GASTOS_CAJA_COLLECTION).doc(gasto.id);
    await docRef.set({ ...gasto, registradoAt: firestoreNow() });
}

function renderGastoMethodButtons() {
    const grid = document.getElementById('gastoMethodsGrid');
    if (!grid) return;
    grid.innerHTML = getEnabledPaymentMethods().map((m) =>
        `<button type="button" class="dpm-method-btn" data-gasto-method="${m.id}">
            <span class="dpm-method-icon">${m.icon}</span>
            <span>${m.label}</span>
        </button>`
    ).join('');
}

function _updateGastoConfirmState() {
    const btn = document.getElementById('gastoRegistrarBtn');
    if (!btn) return;
    const monto = Number((document.getElementById('gastoMonto')?.value || '').replace(/\./g, '') || 0);
    btn.disabled = !(monto > 0 && _gastoSelectedMethod);
}

function _gastoShowStep1() {
    const title   = document.getElementById('gastoModalTitle');
    const backBtn = document.getElementById('gastoBackBtn');
    const step1   = document.getElementById('gastoStep1');
    const step2   = document.getElementById('gastoStep2');
    const regBtn  = document.getElementById('gastoRegistrarBtn');
    if (title)   title.textContent = 'Tipo de gasto';
    if (backBtn) backBtn.setAttribute('hidden', '');
    if (step1)   step1.removeAttribute('hidden');
    if (step2)   step2.setAttribute('hidden', '');
    if (regBtn)  regBtn.setAttribute('hidden', '');

    const grid = document.getElementById('gastoCatGrid');
    if (grid) {
        grid.innerHTML = getCategoriasGastos().map((cat) =>
            `<button type="button" class="gasto-cat-btn" data-gasto-cat="${escapeHtml(cat.id)}">
                <span class="gasto-cat-icon">${cat.icon}</span>
                <span>${escapeHtml(cat.nombre)}</span>
            </button>`
        ).join('');
    }
}

function _gastoShowStep2(catId) {
    const cat = getCategoriasGastos().find((c) => c.id === catId);
    if (!cat) return;
    _gastoCategoriaId = catId;
    _gastoSubcategoria = null;

    const title   = document.getElementById('gastoModalTitle');
    const backBtn = document.getElementById('gastoBackBtn');
    const step1   = document.getElementById('gastoStep1');
    const step2   = document.getElementById('gastoStep2');
    const regBtn  = document.getElementById('gastoRegistrarBtn');
    if (title)   title.textContent = `${cat.icon} ${cat.nombre}`;
    if (backBtn) backBtn.removeAttribute('hidden');
    if (step1)   step1.setAttribute('hidden', '');
    if (step2)   step2.removeAttribute('hidden');
    if (regBtn)  regBtn.removeAttribute('hidden');

    const subSection = document.getElementById('gastoSubSection');
    const subGrid = document.getElementById('gastoSubGrid');
    if (subSection && subGrid) {
        if (cat.subs && cat.subs.length > 0) {
            subGrid.innerHTML = cat.subs.map((s) =>
                `<button type="button" class="gasto-sub-chip" data-gasto-sub="${escapeHtml(s)}">${escapeHtml(s)}</button>`
            ).join('');
            subSection.removeAttribute('hidden');
        } else {
            subSection.setAttribute('hidden', '');
        }
    }

    const descEl   = document.getElementById('gastoDescripcion');
    const montoEl  = document.getElementById('gastoMonto');
    if (descEl)  descEl.value  = '';
    if (montoEl) montoEl.value = '';
    _gastoSelectedMethod = null;
    document.querySelectorAll('#gastoMethodsGrid .dpm-method-btn').forEach((b) => b.classList.remove('dpm-method-btn--active'));
    renderGastoMethodButtons();
    _updateGastoConfirmState();
    descEl?.focus();
}

function openGastoModal() {
    _gastoSelectedMethod = null;
    _gastoCategoriaId = null;
    _gastoSubcategoria = null;
    const modal = document.getElementById('gastoModal');
    if (!modal) return;
    _gastoShowStep1();
    modal.removeAttribute('hidden');
}

function closeGastoModal() {
    document.getElementById('gastoModal')?.setAttribute('hidden', '');
    _gastoSelectedMethod = null;
    _gastoCategoriaId = null;
    _gastoSubcategoria = null;
    _gastoFromHistorial = false;
}

function openTrasladoModal(existingData = null, existingId = null) {
    const existing = document.getElementById('trasladoMetodoModal');
    if (existing) existing.remove();

    const isEdit = Boolean(existingData && existingId);
    const methods = getPaymentMethods();
    const optHtml = methods.map((m) =>
        `<option value="${escapeHtml(m.id)}" style="background:#14172a;color:#fff;">${m.icon} ${escapeHtml(m.label)}</option>`
    ).join('');

    const overlay = document.createElement('div');
    overlay.id = 'trasladoMetodoModal';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.72);display:flex;align-items:center;justify-content:center;padding:1rem;';
    overlay.innerHTML = `<div style="background:#14172a;border:1.5px solid rgba(255,255,255,0.12);border-radius:20px;padding:1.75rem;max-width:360px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,0.65);position:relative;">
        <button type="button" id="trasladoCloseBtn" style="position:absolute;top:10px;right:14px;background:none;border:none;color:rgba(255,255,255,0.55);font-size:1.5rem;cursor:pointer;line-height:1;" aria-label="Cerrar">×</button>
        <h3 style="margin:0 0 20px;font-size:1rem;font-weight:700;color:#fff;">🔄 ${isEdit ? 'Editar traslado' : 'Traslado entre cuentas'}</h3>
        <div style="display:flex;flex-direction:column;gap:10px;">
            <label style="font-size:0.78rem;color:rgba(255,255,255,0.5);">Desde (origen)</label>
            <select id="trasladoFrom" style="background:#1e2235;border:1px solid rgba(255,255,255,0.14);border-radius:8px;color:#fff;padding:8px 10px;font-size:0.85rem;outline:none;">${optHtml}</select>
            <div id="trasladoFromBalance" style="font-size:0.74rem;color:rgba(255,255,255,0.4);margin-top:-6px;padding-left:2px;"></div>
            <label style="font-size:0.78rem;color:rgba(255,255,255,0.5);">Monto a trasladar</label>
            <input id="trasladoMonto" type="text" inputmode="numeric" placeholder="500.000"
                style="background:#1e2235;border:1px solid rgba(255,255,255,0.14);border-radius:8px;color:#fff;padding:8px 10px;font-size:0.85rem;outline:none;">
            <label style="font-size:0.78rem;color:rgba(255,255,255,0.5);">Hacia (destino)</label>
            <select id="trasladoTo" style="background:#1e2235;border:1px solid rgba(255,255,255,0.14);border-radius:8px;color:#fff;padding:8px 10px;font-size:0.85rem;outline:none;">${optHtml}</select>
            <button type="button" id="trasladoConfirmBtn"
                style="margin-top:8px;padding:10px;background:rgba(99,102,241,0.22);color:#a5b4fc;border:1px solid rgba(99,102,241,0.45);border-radius:10px;font-size:0.88rem;font-weight:700;cursor:pointer;">
                Confirmar traslado
            </button>
        </div>
    </div>`;
    document.body.appendChild(overlay);

    // Pre-llenar si es edición; si no, seleccionar segundo método por defecto
    const fromSel = document.getElementById('trasladoFrom');
    const toSel   = document.getElementById('trasladoTo');
    const montoEl = document.getElementById('trasladoMonto');
    const confirmBtn = document.getElementById('trasladoConfirmBtn');
    if (isEdit && existingData) {
        if (fromSel) fromSel.value = existingData.methodFrom || '';
        if (toSel)   toSel.value   = existingData.methodTo   || '';
        if (montoEl) { const v = Number(existingData.monto || 0); montoEl.value = v > 0 ? v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') : ''; }
        if (confirmBtn) confirmBtn.textContent = 'Guardar cambios';
    } else {
        if (toSel && toSel.options.length > 1) toSel.selectedIndex = 1;
    }

    document.getElementById('trasladoCloseBtn')?.addEventListener('click', () => overlay.remove());
    _bindOverlayClose(overlay, () => overlay.remove());

    const balanceEl = document.getElementById('trasladoFromBalance');
    const _updateBalanceHint = () => {
        if (!balanceEl || !fromSel) return;
        const fromId = fromSel.value;
        const bal = _cierresSumTotals[fromId] || 0;
        const m = methods.find((x) => x.id === fromId);
        const label = m ? `${m.icon ? m.icon + ' ' : ''}${m.label}` : fromId;
        const color = bal > 0 ? '#6ee7b7' : bal < 0 ? '#fca5a5' : 'rgba(255,255,255,0.35)';
        balanceEl.innerHTML = `Disponible en ${label}: <span style="color:${color};font-weight:700;">${bal < 0 ? '−' : ''}${bal === 0 ? '$0' : formatMoney(Math.abs(bal))}</span>`;
    };
    fromSel?.addEventListener('change', _updateBalanceHint);
    _updateBalanceHint();

    montoEl?.addEventListener('input', () => {
        const raw = (montoEl.value || '').replace(/\D/g, '');
        montoEl.value = raw === '' ? '' : parseInt(raw, 10).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    });

    confirmBtn?.addEventListener('click', async () => {
        const from  = fromSel?.value;
        const to    = toSel?.value;
        const monto = Number((montoEl?.value || '').replace(/\./g, '') || 0);
        if (!from || !to || from === to) { showNotice('Seleccione métodos distintos.', 'error'); return; }
        if (monto <= 0) { showNotice('Ingrese un monto válido.', 'error'); return; }
        const available = _cierresSumTotals[from] || 0;
        if (monto > available) {
            const m = methods.find((x) => x.id === from);
            const lbl = m ? `${m.icon ? m.icon + ' ' : ''}${m.label}` : from;
            showNotice(`Saldo insuficiente en ${lbl}: disponible ${formatMoney(Math.max(0, available))}`, 'error');
            return;
        }
        try {
            if (isEdit) {
                await firebaseDb.collection(GASTOS_CAJA_COLLECTION).doc(existingId)
                    .update({ methodFrom: from, methodTo: to, monto, paymentMethod: from });
                overlay.remove();
                showNotice('Traslado actualizado.', 'ok');
            } else {
                const id = `traslado_${Date.now()}`;
                await saveGasto({ id, tipo: 'traslado', methodFrom: from, methodTo: to, monto, paymentMethod: from, descripcion: '', categoria: '' });
                overlay.remove();
                showNotice('Traslado registrado.', 'ok');
            }
            await renderLibroCierres();
        } catch (_) {
            showNotice('Error al guardar traslado.', 'error');
        }
    });
}

document.getElementById('gastosBtn')?.addEventListener('click', openGastoModal);
document.getElementById('trasladoHistorialBtn')?.addEventListener('click', openTrasladoModal);
document.getElementById('gastoCancelBtn')?.addEventListener('click', closeGastoModal);
document.getElementById('gastoModal')?.addEventListener('click', (e) => {
    if (e.target === document.getElementById('gastoModal')) closeGastoModal();
});

document.getElementById('gastoModal')?.addEventListener('click', (e) => {
    const catBtn = e.target.closest('[data-gasto-cat]');
    if (catBtn) { _gastoShowStep2(catBtn.dataset.gastoCat); return; }

    const subBtn = e.target.closest('[data-gasto-sub]');
    if (subBtn) {
        document.querySelectorAll('[data-gasto-sub]').forEach((b) => b.classList.remove('active'));
        subBtn.classList.add('active');
        _gastoSubcategoria = subBtn.dataset.gastoSub;
        return;
    }

    const backBtn = e.target.closest('#gastoBackBtn');
    if (backBtn) { _gastoShowStep1(); return; }

    const methodBtn = e.target.closest('[data-gasto-method]');
    if (methodBtn) {
        document.querySelectorAll('[data-gasto-method]').forEach((b) => b.classList.remove('dpm-method-btn--active'));
        methodBtn.classList.add('dpm-method-btn--active');
        _gastoSelectedMethod = methodBtn.dataset.gastoMethod;
        _updateGastoConfirmState();
        return;
    }
});

document.getElementById('gastoMonto')?.addEventListener('input', (e) => {
    const input = e.target;
    const raw = input.value.replace(/\D/g, '');
    if (raw === '') { input.value = ''; } else {
        const num = parseInt(raw, 10);
        input.value = num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }
    _updateGastoConfirmState();
});

document.getElementById('gastoRegistrarBtn')?.addEventListener('click', async () => {
    const descripcion = document.getElementById('gastoDescripcion')?.value?.trim() || '';
    const monto = Number((document.getElementById('gastoMonto')?.value || '').replace(/\./g, '') || 0);
    if (!monto || monto <= 0 || !_gastoSelectedMethod) return;

    const registrarBtn = document.getElementById('gastoRegistrarBtn');
    if (registrarBtn) { registrarBtn.disabled = true; registrarBtn.textContent = 'Guardando...'; }

    try {
        const gastoId = `gasto_${Date.now()}`;
        const fromHistorial = _gastoFromHistorial;
        const gasto = {
            id: gastoId,
            categoria: _gastoCategoriaId || 'otros',
            subcategoria: _gastoSubcategoria || '',
            descripcion,
            monto,
            paymentMethod: _gastoSelectedMethod,
            registradoAt: Date.now(),
            cajaAperturaAt: fromHistorial ? null : (cajaAperturaAt || 0),
            tipo: fromHistorial ? 'externo' : 'caja',
        };
        await saveGasto(gasto);
        if (!fromHistorial) _gastosCajaState = [gasto, ..._gastosCajaState];
        closeGastoModal();
        if (fromHistorial) {
            await renderLibroCierres();
        } else {
            renderCajaDiaria();
        }
        showNotice('Gasto registrado.', 'ok');
    } catch (err) {
        showNotice('Error al registrar gasto: ' + (err.message || 'error'), 'error');
    } finally {
        if (registrarBtn) { registrarBtn.disabled = false; registrarBtn.textContent = 'Registrar gasto'; }
    }
});

// ── Caja Diaria ───────────────────────────────────────────────────────────────
function _cajaDiariaTypeHtml(type) {
    if (type === 'mesa')      return '<span class="caja-type-badge caja-type-mesa">Mesa</span>';
    if (type === 'domicilio') return '<span class="caja-type-badge caja-type-domicilio">Domicilio</span>';
    return '<span class="caja-type-badge caja-type-retiro">Para recoger</span>';
}

function _cajaDiariaMethodLabel(order) {
    if (order.paymentMethod === 'split' && Array.isArray(order.paymentSplit)) {
        return order.paymentSplit.map((s) => {
            const m = getPaymentMethods().find((x) => x.id === s.method);
            return m ? `${m.icon} ${formatMoney(s.amount)}` : formatMoney(s.amount);
        }).join(' + ');
    }
    const method = getPaymentMethods().find((m) => m.id === order.paymentMethod);
    if (!method) return order.paymentMethod || '—';
    const sub = order.paymentSubMethod;
    const subLabel = _PM_SUB_LABELS[sub];
    return subLabel ? `${method.icon} ${method.label} · ${subLabel}` : `${method.icon} ${method.label}`;
}

function renderCajaDiaria() {
    const headEl  = document.getElementById('cajaDiariaHead');
    const bodyEl  = document.getElementById('cajaDiariaBody');
    const footEl  = document.getElementById('cajaDiariaFoot');
    const fechaEl = document.getElementById('cajaDiariaFechaLabel');
    if (!bodyEl) return;

    // Etiqueta de apertura en el encabezado
    if (fechaEl) {
        if (cajaAperturaAt) {
            const ap = new Date(cajaAperturaAt);
            fechaEl.textContent = 'Abierta desde ' + ap.toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
            fechaEl.style.color = '';
        } else {
            fechaEl.textContent = '🔒 Caja cerrada — presiona "Abrir Caja" para comenzar la jornada';
            fechaEl.style.color = 'rgba(252,165,165,0.85)';
        }
    }

    if (!cajaAperturaAt) {
        if (headEl) headEl.innerHTML = '';
        bodyEl.innerHTML = `<tr><td class="caja-empty" colspan="6" style="padding:2rem;color:rgba(252,165,165,0.7);">La caja está cerrada. Abre la caja para registrar movimientos.</td></tr>`;
        if (footEl) footEl.innerHTML = '';
        return;
    }

    // Filtrar cobros de la jornada actual; usa deliveredAt como fallback de timestamp
    const allPaid = ordersState.filter((o) => {
        if (!o.paymentMethod || o.paymentMethod === 'pendiente') return false;
        const ts = o.paidAt || o.deliveredAt || o.createdAt;
        const paidMs = ts?.toMillis ? ts.toMillis() : Number(ts || 0);
        if (!paidMs) return false;
        if (cajaAperturaAt) return paidMs >= cajaAperturaAt;
        const todayStr = new Date().toISOString().split('T')[0];
        return new Date(paidMs).toISOString().split('T')[0] === todayStr;
    });

    // Filtrar gastos de la jornada actual (excluir gastos externos del historial)
    const _allGastosJornada = _gastosCajaState.filter((g) => {
        if (g.tipo === 'externo') return false;
        const ms = g.registradoAt?.toMillis ? g.registradoAt.toMillis() : Number(g.registradoAt || 0);
        if (cajaAperturaAt) return ms >= cajaAperturaAt;
        const todayStr = new Date().toISOString().split('T')[0];
        return new Date(ms).toISOString().split('T')[0] === todayStr;
    });
    const allGastos    = _allGastosJornada.filter((g) => g.tipo !== 'traslado');
    const allTraslados = _allGastosJornada.filter((g) => g.tipo === 'traslado');

    const methods = getPaymentMethods();
    const methodKeys = methods.map((m) => m.id);

    // Detectar cobros con métodos históricos no reconocidos (split: verificar cada parte)
    const hasUnmatched = allPaid.some((o) => {
        if (o.paymentMethod === 'split') {
            return Array.isArray(o.paymentSplit) && o.paymentSplit.some((s) => !methodKeys.includes(s.method));
        }
        return !methodKeys.includes(o.paymentMethod);
    });
    const totalCols = 2 + methodKeys.length + (hasUnmatched ? 1 : 0) + 1;

    if (allPaid.length === 0 && allGastos.length === 0 && allTraslados.length === 0) {
        if (headEl) headEl.innerHTML = '';
        bodyEl.innerHTML = `<tr><td class="caja-empty" colspan="${totalCols}">No hay movimientos registrados en esta jornada.</td></tr>`;
        if (footEl) footEl.innerHTML = '';
        return;
    }

    // Cabecera
    if (headEl) {
        headEl.innerHTML = `<tr>
            <th class="col-left">Hora</th>
            <th class="col-left" style="min-width:200px;">Descripción</th>
            ${methods.map((m) => `<th>${m.icon} ${escapeHtml(m.label)}</th>`).join('')}
            ${hasUnmatched ? '<th title="Métodos de pago anteriores no reconocidos">Otro</th>' : ''}
            <th>Total</th>
        </tr>`;
    }

    // Unificar y ordenar cobros + gastos por timestamp
    const _tsOf = (o) => o.paidAt?.toDate ? o.paidAt.toDate().getTime() : new Date(o.paidAt || 0).getTime();
    const _tsGasto = (g) => g.registradoAt?.toMillis ? g.registradoAt.toMillis() : Number(g.registradoAt || 0);

    // Gasto virtual de domicilios: se muestra si no existe ya el gasto real del cierre
    const hasDomicilioGastoReal = allGastos.some((g) => String(g.id || '').startsWith('gasto_domicilios_'));
    const deliveryPaid = allPaid.filter((o) => o.orderType === 'domicilio' || o.fulfillmentType === 'delivery');
    const domicilioFeeSum = deliveryPaid.reduce((s, o) => s + Number(o.deliveryFee || 0), 0);
    const virtualDomicilioGasto = (!hasDomicilioGastoReal && domicilioFeeSum > 0)
        ? [{
            _type: 'gasto',
            _ms: Date.now(),
            data: {
                id: '__virtual_domicilios__',
                categoria: 'otros',
                subcategoria: 'Domicilios',
                proveedor: 'Domiciliario',
                descripcion: `Domicilios (${deliveryPaid.length} pedido${deliveryPaid.length !== 1 ? 's' : ''})`,
                monto: domicilioFeeSum,
                paymentMethod: 'efectivo',
                registradoAt: Date.now(),
                _virtual: true,
            },
        }]
        : [];

    const allEntries = [
        ...allPaid.map((o) => ({ _type: 'order', _ms: _tsOf(o), data: o })),
        ...allGastos.map((g) => ({ _type: 'gasto', _ms: _tsGasto(g), data: g })),
        ...allTraslados.map((t) => ({ _type: 'traslado', _ms: _tsGasto(t), data: t })),
    ].sort((a, b) => a._ms - b._ms);

    // Acumuladores
    const sumMethod = {};
    methodKeys.forEach((k) => { sumMethod[k] = 0; });
    let sumOtro = 0;
    let grandTotal = 0;

    // ── Fila fija de domicilios (procesada primero para acumuladores) ──────────
    let pinnedDomicilioRow = '';
    if (virtualDomicilioGasto.length > 0) {
        const g = virtualDomicilioGasto[0].data;
        const amt = Number(g.monto || 0);
        const isKnown = methodKeys.includes(g.paymentMethod);
        if (isKnown) { sumMethod[g.paymentMethod] -= amt; } else { sumOtro -= amt; }
        grandTotal -= amt;
        const mCells = methodKeys.map((k) =>
            k === g.paymentMethod
                ? `<td style="color:#fca5a5;font-weight:700;">−${formatMoney(amt)}</td>`
                : '<td></td>'
        ).join('');
        const otroCell = hasUnmatched ? '<td></td>' : '';
        const pedStr = `${deliveryPaid.length} pedido${deliveryPaid.length !== 1 ? 's' : ''}`;
        pinnedDomicilioRow = `<tr style="background:rgba(252,165,165,0.06);border-bottom:1px solid rgba(252,165,165,0.18);">
            <td class="col-left" style="color:#fca5a5;font-size:0.72rem;white-space:nowrap;">🛵 FIJO</td>
            <td class="col-left">
                <span style="color:#fca5a5;font-weight:700;">🛵 Gasto domicilios</span>
                <span style="color:var(--admin-muted);font-size:0.78rem;"> · ${pedStr}</span>
                <span style="font-size:0.68rem;opacity:0.55;"> · se registra al cerrar caja</span>
            </td>
            ${mCells}${otroCell}
            <td style="color:#fca5a5;font-weight:800;">−${formatMoney(amt)}</td>
        </tr>`;
    }

    const rows = [];
    allEntries.forEach((entry) => {
        if (entry._type === 'order') {
            const o = entry.data;
            const ts   = o.paidAt || o.createdAt;
            const hora = formatOrderTime(ts);
            const amt  = getOrderDisplayTotal(o);
            const baseDesc = `<strong>${escapeHtml(o.code)}</strong> · ${escapeHtml(o.customerName || '—')} · ${escapeHtml(getOrderTypeLabel(o))}`;
            const isSplitOrder = o.paymentMethod === 'split' && Array.isArray(o.paymentSplit);
            const isKnown = isSplitOrder ? true : methodKeys.includes(o.paymentMethod);

            if (isSplitOrder) {
                o.paymentSplit.forEach(({ method: m, amount: a }) => {
                    if (methodKeys.includes(m)) sumMethod[m] += Number(a);
                    else sumOtro += Number(a);
                });
            } else if (isKnown) {
                sumMethod[o.paymentMethod] += amt;
            } else {
                sumOtro += amt;
            }
            grandTotal += amt;

            let mCellsIn, otroCellIn;
            if (isSplitOrder) {
                mCellsIn = methodKeys.map((k) => {
                    const part = o.paymentSplit.find((s) => s.method === k);
                    return part && Number(part.amount) > 0
                        ? `<td style="color:#6ee7b7;font-weight:700;">${formatMoney(Number(part.amount))}</td>`
                        : '<td></td>';
                }).join('');
                otroCellIn = hasUnmatched ? '<td></td>' : '';
            } else {
                mCellsIn = methodKeys.map((k) =>
                    k === o.paymentMethod
                        ? `<td style="color:#6ee7b7;font-weight:700;">${formatMoney(amt)}</td>`
                        : '<td></td>'
                ).join('');
                otroCellIn = hasUnmatched
                    ? (!isKnown ? `<td style="color:#6ee7b7;font-weight:700;" title="${escapeHtml(o.paymentMethod || '')}">${formatMoney(amt)}</td>` : '<td></td>')
                    : '';
            }
            const splitBadge = isSplitOrder ? ' <span style="font-size:0.68rem;background:rgba(251,191,36,0.2);color:#fbbf24;padding:1px 5px;border-radius:4px;font-weight:600;">÷ DIVIDIDO</span>' : '';
            rows.push(`<tr>
                <td class="col-left">${hora}</td>
                <td class="col-left">${baseDesc}${splitBadge}</td>
                ${mCellsIn}${otroCellIn}
                <td style="color:#6ee7b7;font-weight:800;">${formatMoney(amt)}</td>
            </tr>`);

            if (o.voided) {
                if (isSplitOrder) {
                    o.paymentSplit.forEach(({ method: m, amount: a }) => {
                        if (methodKeys.includes(m)) sumMethod[m] -= Number(a);
                        else sumOtro -= Number(a);
                    });
                } else if (isKnown) {
                    sumMethod[o.paymentMethod] -= amt;
                } else {
                    sumOtro -= amt;
                }
                grandTotal -= amt;
                const horaVoid = formatOrderTime(o.voidedAt || ts);
                const mCellsOut = isSplitOrder
                    ? methodKeys.map((k) => {
                        const part = o.paymentSplit.find((s) => s.method === k);
                        return part && Number(part.amount) > 0
                            ? `<td style="color:#fca5a5;font-weight:700;">−${formatMoney(Number(part.amount))}</td>`
                            : '<td></td>';
                    }).join('')
                    : methodKeys.map((k) =>
                        k === o.paymentMethod
                            ? `<td style="color:#fca5a5;font-weight:700;">−${formatMoney(amt)}</td>`
                            : '<td></td>'
                    ).join('');
                const otroCellOut = hasUnmatched
                    ? (!isKnown && !isSplitOrder ? `<td style="color:#fca5a5;font-weight:700;">−${formatMoney(amt)}</td>` : '<td></td>')
                    : '';
                const voidDesc = `<span style="color:#fca5a5;">↩ ANULADO</span> · ${escapeHtml(o.code)} · ${escapeHtml(o.customerName || '—')}`;
                rows.push(`<tr class="row-voided">
                    <td class="col-left" style="color:#fca5a5;">${horaVoid}</td>
                    <td class="col-left">${voidDesc}</td>
                    ${mCellsOut}${otroCellOut}
                    <td style="color:#fca5a5;font-weight:800;">−${formatMoney(amt)}</td>
                </tr>`);
            }
        } else if (entry._type === 'gasto') {
            // Fila de gasto real (roja, resta del método y del total)
            const g = entry.data;
            const hora = formatOrderTime(g.registradoAt);
            const amt = Number(g.monto || 0);
            const isKnown = methodKeys.includes(g.paymentMethod);

            if (isKnown) { sumMethod[g.paymentMethod] -= amt; } else { sumOtro -= amt; }
            grandTotal -= amt;

            const mGastoCells = methodKeys.map((k) =>
                k === g.paymentMethod
                    ? `<td style="color:#fca5a5;font-weight:700;">−${formatMoney(amt)}</td>`
                    : '<td></td>'
            ).join('');
            const otroGastoCell = hasUnmatched
                ? (!isKnown ? `<td style="color:#fca5a5;font-weight:700;">−${formatMoney(amt)}</td>` : '<td></td>')
                : '';

            const cat = getCategoriasGastos().find((c) => c.id === g.categoria);
            const catStr = cat ? ` · ${cat.icon} ${escapeHtml(cat.nombre)}` : '';
            const provStr = g.proveedor ? ` · ${escapeHtml(g.proveedor)}` : '';
            const descStr = g.descripcion ? ` · ${escapeHtml(g.descripcion)}` : '';
            const gastoDesc = `<span style="color:#fca5a5;font-weight:700;">💸 Gasto${catStr}</span>${provStr}${descStr}`;

            rows.push(`<tr>
                <td class="col-left" style="color:#fca5a5;">${hora}</td>
                <td class="col-left">${gastoDesc}</td>
                ${mGastoCells}${otroGastoCell}
                <td style="color:#fca5a5;font-weight:800;">−${formatMoney(amt)}</td>
            </tr>`);
        } else {
            // Traslado entre métodos (índigo; mueve saldo sin afectar el total neto)
            const t = entry.data;
            const hora = formatOrderTime(t.registradoAt);
            const amt = Number(t.monto || 0);
            const fromM = methods.find((m) => m.id === t.methodFrom);
            const toM   = methods.find((m) => m.id === t.methodTo);
            const fromLabel = fromM ? `${fromM.icon} ${fromM.label}` : (t.methodFrom || '?');
            const toLabel   = toM   ? `${toM.icon} ${toM.label}`     : (t.methodTo   || '?');

            if (methodKeys.includes(t.methodFrom)) sumMethod[t.methodFrom] -= amt;
            if (methodKeys.includes(t.methodTo))   sumMethod[t.methodTo]   += amt;
            // grandTotal no cambia (traslado interno)

            const mTrasladoCells = methodKeys.map((k) => {
                if (k === t.methodFrom) return `<td style="color:#a5b4fc;font-weight:700;">−${formatMoney(amt)}</td>`;
                if (k === t.methodTo)   return `<td style="color:#a5b4fc;font-weight:700;">+${formatMoney(amt)}</td>`;
                return '<td></td>';
            }).join('');
            const otroTrasladoCell = hasUnmatched ? '<td></td>' : '';

            rows.push(`<tr style="background:rgba(99,102,241,0.06);border-left:3px solid rgba(99,102,241,0.3);">
                <td class="col-left" style="color:#a5b4fc;">${hora}</td>
                <td class="col-left"><span style="color:#a5b4fc;font-weight:700;">🔄 Traslado</span> · ${fromLabel} → ${toLabel}</td>
                ${mTrasladoCells}${otroTrasladoCell}
                <td style="color:rgba(165,180,252,0.45);font-size:0.8rem;">$0</td>
            </tr>`);
        }
    });
    bodyEl.innerHTML = pinnedDomicilioRow + rows.join('');

    // Totales al pie
    if (footEl) {
        const mFootCells = methodKeys.map((k) => {
            const v = sumMethod[k];
            if (v === 0) return '<td style="color:var(--admin-muted,#6b7280);">$0</td>';
            const c = v > 0 ? '#6ee7b7' : '#fca5a5';
            const s = v < 0 ? '−' : '';
            return `<td style="color:${c};"><strong>${s}${formatMoney(Math.abs(v))}</strong></td>`;
        }).join('');
        const otroFootCell = hasUnmatched
            ? (sumOtro === 0 ? '<td>—</td>' : `<td style="color:${sumOtro > 0 ? '#6ee7b7' : '#fca5a5'};"><strong>${sumOtro < 0 ? '−' : ''}${formatMoney(Math.abs(sumOtro))}</strong></td>`)
            : '';
        const gtColor = grandTotal >= 0 ? 'var(--admin-accent,#ff9540)' : '#fca5a5';
        const gtSign  = grandTotal < 0 ? '−' : '';
        footEl.innerHTML = `<tr>
            <td class="col-left" colspan="2">TOTALES</td>
            ${mFootCells}${otroFootCell}
            <td class="foot-total" style="color:${gtColor};">${gtSign}${formatMoney(Math.abs(grandTotal))}</td>
        </tr>`;
    }
}

document.getElementById('refreshCajaDiariaBtn')?.addEventListener('click', async () => {
    await loadGastosCaja();
    renderCajaDiaria();
});

// ── Apertura de caja: sincronizada en Firestore (multi-dispositivo) ──────────
const CAJA_APERTURA_STORAGE_KEY = 'roalburger-caja-apertura';
// Inicializar desde localStorage como caché rápida; Firestore es la fuente de verdad
let cajaAperturaAt = Number(localStorage.getItem(CAJA_APERTURA_STORAGE_KEY) || 0);
let _cajaAperturaBy = '';
let _cajaFondoInicial = 0;

async function saveCajaAperturaToFirestore(ts, extra = {}) {
    try {
        await firebaseDb.collection(CONFIG_COLLECTION).doc(CAJA_ESTADO_DOC_ID)
            .set({ aperturaAt: ts, ...extra }, { merge: true });
        try { localStorage.setItem(CAJA_APERTURA_STORAGE_KEY, String(ts)); } catch {}
    } catch (_) {}
}

async function loadCajaAperturaFromFirestore() {
    try {
        const snap = await firebaseDb.collection(CONFIG_COLLECTION).doc(CAJA_ESTADO_DOC_ID).get();
        const d = snap.exists ? snap.data() : null;
        if (d && d.aperturaAt && d.cerrada === false) {
            cajaAperturaAt = Number(d.aperturaAt);
            _cajaAperturaBy = d.aperturaBy || '';
            _cajaFondoInicial = Number(d.fondoInicial || 0);
            try { localStorage.setItem(CAJA_APERTURA_STORAGE_KEY, String(cajaAperturaAt)); } catch {}
        } else {
            cajaAperturaAt = 0;
            try { localStorage.removeItem(CAJA_APERTURA_STORAGE_KEY); } catch {}
        }
        renderCajaDiaria();
        _updateCajaEstadoUI();
    } catch (_) {}
}

function initCajaAperturaSync() {
    loadCajaAperturaFromFirestore();
    firebaseDb.collection(CONFIG_COLLECTION).doc(CAJA_ESTADO_DOC_ID).onSnapshot((snap) => {
        if (!snap.exists) return;
        const data = snap.data();
        const remoteTs = Number(data.aperturaAt || 0);
        const remoteCerrada = data.cerrada !== false;
        if (remoteCerrada) {
            if (cajaAperturaAt !== 0) {
                cajaAperturaAt = 0;
                _cajaAperturaBy = '';
                _cajaFondoInicial = 0;
                try { localStorage.removeItem(CAJA_APERTURA_STORAGE_KEY); } catch {}
                renderCajaDiaria();
                renderOrders();
                _updateCajaEstadoUI();
            }
        } else if (remoteTs && remoteTs !== cajaAperturaAt) {
            cajaAperturaAt = remoteTs;
            _cajaAperturaBy = data.aperturaBy || '';
            _cajaFondoInicial = Number(data.fondoInicial || 0);
            try { localStorage.setItem(CAJA_APERTURA_STORAGE_KEY, String(remoteTs)); } catch {}
            renderCajaDiaria();
            renderOrders();
            _updateCajaEstadoUI();
        }
    });
}

// ── Auto-apertura Caja Diaria al primer cobro ─────────────────────────────────
let _cajaDiariaAutoOpened = false;

function _navigateToCajaDiaria() {
    // Cerrar POS si está abierto
    if (internalOrderModal?.classList.contains('is-open')) {
        closeInternalOrderModal();
    }
    const accordionBtn = document.querySelector('.admin-accordion-trigger[data-accordion-target="informes"]');
    if (accordionBtn) {
        const panel = document.getElementById('informes');
        if (panel && !panel.classList.contains('accordion-open')) {
            accordionBtn.click();
        }
    }
    setTimeout(() => {
        const cajasTab = document.querySelector('[data-section-tab="cajas"][data-section-scope="informes"]');
        cajasTab?.click();
        setTimeout(() => {
            const subTab = document.querySelector('[data-cajas-tab="caja-diaria"]');
            if (subTab && !subTab.classList.contains('active')) subTab.click();
        }, 100);
    }, 180);
}

// ── Panel lateral cierre de caja ──────────────────────────────────────────────
let _cierrePrintHtml = '';
let _pendingCierreDoc = null;
let _cierrePrintData = null; // {c, dateStr, timeStr} para reimpresión BT

function buildCierreESCPOSData(c, dateStr, timeStr) {
    const ESC = 0x1B; const GS = 0x1D; const LF = 0x0A;
    const COLS = 32;
    const bytes = [];
    const pb = (...a) => bytes.push(...a);

    function _emit(line) {
        const s = _escNormalize(line);
        for (let i = 0; i < s.length; i++) pb(s.charCodeAt(i) & 0xFF);
        pb(LF);
    }
    function ww(str, prefix) {
        const pfx = _escNormalize(prefix || '');
        const s = _escNormalize(str);
        const contPfx = ' '.repeat(pfx.length);
        let firstLine = true;
        function emit(line) { _emit(line); firstLine = false; }
        const words = s.split(/\s+/).filter(Boolean);
        if (!words.length) return;
        let current = '';
        for (const word of words) {
            const lp = firstLine ? pfx : contPfx;
            const avail = COLS - lp.length;
            if (!current) {
                if (word.length > avail) { let rem = word; while (rem.length) { const lp2 = firstLine ? pfx : contPfx; const a2 = COLS - lp2.length; emit(lp2 + rem.substring(0, a2)); rem = rem.substring(a2); } }
                else { current = word; }
            } else {
                const test = current + ' ' + word;
                if (test.length <= avail) { current = test; } else { emit(lp + current); current = word; }
            }
        }
        if (current) emit((firstLine ? pfx : contPfx) + current);
    }
    function wl(str) { ww(str, ''); }
    function wc(left, right) {
        const l = _escNormalize(left); const r = _escNormalize(right);
        const maxLeft = COLS - r.length - 1;
        if (l.length <= maxLeft) {
            const pad = Math.max(1, COLS - l.length - r.length);
            _emit(l + ' '.repeat(pad) + r);
            return;
        }
        ww(l, '');
        const pad = Math.max(0, COLS - r.length);
        _emit(' '.repeat(pad) + r);
    }
    function sep()  { _emit('-'.repeat(COLS)); }
    function sep2() { _emit('='.repeat(COLS)); }

    const ingresosMethod = c.ingresosMethod || c.methodTotals || {};
    const gastosMethod   = c.gastosMethod   || {};
    const gastosDetalle  = c.gastosDetalle  || [];
    const ingresosTotal  = Number(c.ingresosTotal  ?? c.grandTotal ?? 0);
    const gastosTotal    = Number(c.gastosTotal    || 0);
    const grandTotal     = Number(c.grandTotal     || 0);
    const cobradas       = Number(c.transactionCount || 0) - Number(c.voidedCount || 0);

    const allMethodIds = [...new Set([
        ...Object.keys(ingresosMethod),
        ...Object.keys(gastosMethod),
    ])].filter((k) => k !== 'split');

    // Init + encabezado
    pb(ESC, 0x40);
    pb(ESC, 0x61, 0x01, ESC, 0x45, 0x01, ESC, 0x21, 0x10);
    wl(brandingState.restaurantName || 'ROAL BURGER');
    pb(ESC, 0x21, 0x00, ESC, 0x45, 0x00);
    pb(ESC, 0x61, 0x00);

    sep2();
    pb(ESC, 0x61, 0x01); wl('CIERRE DE CAJA'); pb(ESC, 0x61, 0x00);
    sep2();

    wc('Fecha', dateStr);
    if (c.aperturaAt) {
        const aperturaTime = new Date(Number(c.aperturaAt)).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
        wc('Apertura', aperturaTime);
    }
    if (c.aperturaBy) wc('Abierta por', String(c.aperturaBy));
    if (Number(c.fondoInicial) > 0) wc('Fondo inicial', formatMoney(Number(c.fondoInicial)));
    wc('Cierre', timeStr);
    wc('Transacciones', String(cobradas));
    if (c.voidedCount) wc('Anulados (excl.)', String(Number(c.voidedCount)));

    // Ingresos
    sep();
    pb(ESC, 0x45, 0x01); wl('INGRESOS'); pb(ESC, 0x45, 0x00);
    sep();
    const ingFiltered = allMethodIds.filter((k) => Number(ingresosMethod[k] || 0) > 0);
    if (ingFiltered.length) {
        ingFiltered.forEach((k) => {
            const m = getPaymentMethods().find((x) => x.id === k);
            wc('  ' + (m ? m.label : k), formatMoney(Number(ingresosMethod[k])));
        });
    } else {
        wl('  Sin movimientos');
    }
    sep();
    pb(ESC, 0x45, 0x01); wc('TOTAL INGRESOS', formatMoney(ingresosTotal)); pb(ESC, 0x45, 0x00);

    // Gastos (si los hay)
    if (gastosDetalle.length) {
        sep();
        pb(ESC, 0x45, 0x01); wl('GASTOS'); pb(ESC, 0x45, 0x00);
        sep();
        gastosDetalle.forEach((g) => {
            const m = getPaymentMethods().find((x) => x.id === g.paymentMethod);
            const desc = [g.proveedor, g.descripcion].filter(Boolean).join(' ');
            wc('  ' + _escNormalize(desc || 'Gasto'), '-' + formatMoney(Number(g.monto || 0)));
            if (m) wl('    ' + m.label);
        });
        sep();
        pb(ESC, 0x45, 0x01); wc('TOTAL GASTOS', '-' + formatMoney(gastosTotal)); pb(ESC, 0x45, 0x00);
    }

    // Arqueo por método
    const arqueoLines = allMethodIds.map((k) => {
        const ing = Number(ingresosMethod[k] || 0);
        const gas = Number(gastosMethod[k]   || 0);
        const net = ing - gas;
        if (ing === 0 && gas === 0) return null;
        const m = getPaymentMethods().find((x) => x.id === k);
        return { label: m ? m.label : k, net, ing, gas };
    }).filter(Boolean);

    if (arqueoLines.length) {
        sep();
        pb(ESC, 0x45, 0x01); wl('ARQUEO POR METODO'); pb(ESC, 0x45, 0x00);
        sep();
        arqueoLines.forEach(({ label, net, ing, gas }) => {
            wc('  ' + label, (net < 0 ? '-' : '') + formatMoney(Math.abs(net)));
            if (gas > 0) wl('  Ing: ' + formatMoney(ing) + ' Gas: ' + formatMoney(gas));
        });
    }

    // Saldo neto
    sep2();
    pb(ESC, 0x45, 0x01, ESC, 0x21, 0x10);
    wc('SALDO NETO CAJA', (grandTotal < 0 ? '-' : '') + formatMoney(Math.abs(grandTotal)));
    pb(ESC, 0x21, 0x00, ESC, 0x45, 0x00);
    sep2();

    pb(ESC, 0x61, 0x01, LF);
    wl('DOCUMENTO INTERNO - NO FISCAL');
    if (brandingState.address) wl(brandingState.address);
    pb(LF, LF, LF);
    pb(GS, 0x56, 0x00);

    return new Uint8Array(bytes);
}

async function printCierreViaBluetooth(c, dateStr, timeStr) {
    const char = await _btEnsureConnected();
    if (!char) return false;
    const data = buildCierreESCPOSData(c, dateStr, timeStr);
    const CHUNK = 20;
    try {
        for (let i = 0; i < data.length; i += CHUNK) {
            await _btWriteChunk(char, data.slice(i, i + CHUNK));
            await new Promise((r) => setTimeout(r, 80));
        }
        return true;
    } catch (err) {
        showNotice(`Error Bluetooth: ${err.message || 'desconocido'}. Imprimiendo por navegador...`, 'error');
        return false;
    }
}

function openCierreSidePanel(ticketHtml, title, viewOnly = false) {
    const panel = document.getElementById('cierreSidePanel');
    const body  = document.getElementById('cierreSidePanelBody');
    const titleEl = document.getElementById('cierreSidePanelTitle');
    const closeBtn = document.getElementById('cierreSidePanelClose');
    const confirmBtn = document.getElementById('cierreCajaConfirmBtn');
    const reprintBtn = document.getElementById('cierreReprintBtn');
    if (!panel || !body) return;
    if (titleEl) titleEl.textContent = title || 'Vista previa del cierre';
    if (closeBtn) closeBtn.textContent = viewOnly ? '✕ Cerrar' : '✕ Cancelar';
    if (confirmBtn) confirmBtn.style.display = viewOnly ? 'none' : '';
    if (reprintBtn) reprintBtn.style.display = viewOnly ? '' : 'none';
    body.innerHTML = ticketHtml;
    _cierrePrintHtml = ticketHtml;
    panel.removeAttribute('hidden');
}

function _printCierreBrowser(html) {
    const win = window.open('', '_blank', 'width=420,height=680,scrollbars=yes');
    if (win) {
        win.document.write(`<!DOCTYPE html><html><head><title>Cierre de Caja</title></head><body style="margin:0;background:#fff;">${html}<div style="text-align:center;margin:16px;"><button onclick="window.print()" style="padding:8px 24px;font-size:14px;cursor:pointer;">Imprimir</button></div></body></html>`);
        win.document.close();
    }
}

async function _printCierreTicket(html) {
    // Asegurar conexión BT: auto-reconecta si es posible, o abre picker si no
    if (navigator.bluetooth) {
        const char = await _btEnsureConnected();
        if (!char) await connectBluetoothPrinter();
    }
    if (_btPrinterDevice && _cierrePrintData) {
        const { c, dateStr, timeStr } = _cierrePrintData;
        const ok = await printCierreViaBluetooth(c, dateStr, timeStr);
        if (ok) { showNotice('Cierre enviado a la impresora Bluetooth.', 'ok'); return; }
    }
    _printCierreBrowser(html);
}

document.getElementById('cierreSidePanelClose')?.addEventListener('click', () => {
    document.getElementById('cierreSidePanel')?.setAttribute('hidden', '');
    _pendingCierreDoc = null;
});

document.getElementById('cierreReprintBtn')?.addEventListener('click', async () => {
    if (_cierrePrintHtml) await _printCierreTicket(_cierrePrintHtml);  // _cierrePrintData ya está seteado
});

document.getElementById('cierreCajaConfirmBtn')?.addEventListener('click', async () => {
    if (!_pendingCierreDoc) return;
    const { closureDoc, closureId, ticketHtml, dateStr, timeStr } = _pendingCierreDoc;

    // Deshabilitar primero para evitar doble clic mientras se abre selector BT o se imprime
    const confirmBtn = document.getElementById('cierreCajaConfirmBtn');
    if (confirmBtn) { confirmBtn.disabled = true; confirmBtn.textContent = 'Imprimiendo...'; }

    const imprimir = confirm('¿Desea imprimir el ticket de cierre?');
    if (imprimir) {
        _cierrePrintData = { c: closureDoc, dateStr, timeStr };
        await _printCierreTicket(ticketHtml);
    }

    if (confirmBtn) confirmBtn.textContent = 'Guardando...';
    try {
        // Gasto automático de domicilios en efectivo
        const domicilioFeeTotal = getDeliveredOrdersForCurrentDay()
            .filter((o) => o.orderType === 'domicilio' || o.fulfillmentType === 'delivery')
            .reduce((s, o) => s + Number(o.deliveryFee || 0), 0);
        if (domicilioFeeTotal > 0) {
            const gastoId = `gasto_domicilios_${Date.now()}`;
            const gastoDom = {
                id: gastoId,
                categoria: 'otros',
                subcategoria: 'Domicilios',
                proveedor: 'Domiciliario',
                descripcion: 'Gastos de domicilios',
                monto: domicilioFeeTotal,
                paymentMethod: 'efectivo',
                registradoAt: Date.now(),
                cajaAperturaAt: cajaAperturaAt || 0,
            };
            await saveGasto(gastoDom);
            _gastosCajaState = [gastoDom, ..._gastosCajaState];
        }

        await firebaseDb.collection(CIERRES_CAJA_COLLECTION).doc(closureId).set(closureDoc);

        // Guardar apertura original antes de resetearla, para poder filtrar pedidos de esta jornada
        const _aperturaAnterior = cajaAperturaAt;
        cajaAperturaAt = 0;
        _cajaAperturaBy = '';
        _cajaFondoInicial = 0;
        await saveCajaAperturaToFirestore(0, { aperturaBy: '', fondoInicial: 0, cerrada: true });
        renderCajaDiaria();
        _updateCajaEstadoUI();

        _pendingCierreDoc = null;
        document.getElementById('cierreSidePanel')?.setAttribute('hidden', '');

        // Re-derivar pedidos pagados de la jornada cerrada para eliminar los procesados
        const _todayStr2 = new Date().toISOString().split('T')[0];
        const paid = ordersState.filter((o) => {
            if (!o.paymentMethod || o.paymentMethod === 'pendiente') return false;
            const ts = o.paidAt || o.deliveredAt || o.createdAt;
            const ms = ts?.toMillis ? ts.toMillis() : Number(ts || 0);
            if (!ms) return false;
            if (_aperturaAnterior) return ms >= _aperturaAnterior;
            return new Date(ms).toISOString().split('T')[0] === _todayStr2;
        });

        // Eliminar pedidos procesados de la jornada cerrada para reiniciar la recepción
        // (los activos/no entregados permanecen para la nueva jornada)
        const procesadosIds = paid
            .filter((o) => o.status === 'entregado' || o.status === 'cancelado' || o.anulado || o.voided)
            .map((o) => o.id);
        if (procesadosIds.length) {
            const batch = firebaseDb.batch();
            procesadosIds.forEach((id) => {
                batch.delete(firebaseDb.collection(ORDERS_COLLECTION).doc(id));
            });
            await batch.commit();
        }

        // La caja chica se mantiene — no se resetea entre jornadas
        renderOrders();
        renderCajaDiaria();
        _cajaDiariaAutoOpened = false;
        showNotice('Caja cerrada. Recepción de pedidos reiniciada.', 'ok');
        _navigateToCajaDiaria();
        await renderLibroCierres();
        setTimeout(() => _showAbrirCajaModal(), 700);
    } catch (err) {
        showNotice(`Error al guardar cierre: ${err.message || 'error inesperado.'}`, 'error');
    } finally {
        if (confirmBtn) { confirmBtn.disabled = false; confirmBtn.textContent = '🔒 Cerrar Caja'; }
    }
});

function _buildCierreTicketHtml(c, dateStr, timeStr) {
    const cobradas = Number(c.transactionCount || 0) - Number(c.voidedCount || 0);
    const ingresosMethod = c.ingresosMethod || c.methodTotals || {};
    const gastosMethod   = c.gastosMethod   || {};
    const gastosDetalle  = c.gastosDetalle  || [];
    const ingresosTotal  = Number(c.ingresosTotal  ?? c.grandTotal ?? 0);
    const gastosTotal    = Number(c.gastosTotal    || 0);
    const grandTotal     = Number(c.grandTotal     || 0);

    const allMethodIds = [...new Set([
        ...Object.keys(ingresosMethod),
        ...Object.keys(gastosMethod),
    ])];

    const S  = (txt) => `<span style="color:#c8c0b8;">${txt}</span>`;
    const SV = (txt, color='#f0ead8') => `<span style="color:${color};font-weight:700;">${txt}</span>`;
    const ROW = (label, value, valColor='#f0ead8') =>
        `<tr><td style="padding:2px 0;word-break:break-word;">${S(label)}</td><td style="text-align:right;padding:2px 0 2px 8px;white-space:nowrap;">${SV(value, valColor)}</td></tr>`;
    const DIV = (label, color='#ff9540') =>
        `<div style="border-top:1px dashed #4a3a2a;margin:8px 0 5px;padding-top:6px;font-weight:700;font-size:11px;letter-spacing:1.5px;color:${color};">${label}</div>`;
    const LINE = () => `<tr><td colspan="2" style="border-top:1px dashed #3a2e26;padding:2px 0;"></td></tr>`;

    // ── INGRESOS por método
    const ingresosRows = allMethodIds
        .filter((k) => k !== 'split' && Number(ingresosMethod[k] || 0) > 0)
        .map((k) => {
            const m = getPaymentMethods().find((x) => x.id === k) || { icon: '', label: k };
            return ROW(`  ${m.icon} ${m.label}`, formatMoney(Number(ingresosMethod[k])), '#6ee7b7');
        }).join('');

    // ── EGRESOS detalle
    const egresosRows = gastosDetalle.map((g) => {
        const m = getPaymentMethods().find((x) => x.id === g.paymentMethod) || { icon: '', label: g.paymentMethod || '' };
        const desc = [g.proveedor, g.descripcion].filter(Boolean).join(' · ') || 'Gasto';
        return `<tr>
            <td style="padding:2px 0 0;">${S('  ' + escapeHtml(desc))}<br>
                ${S('  ' + m.icon + ' ' + escapeHtml(m.label))}</td>
            <td style="text-align:right;padding:2px 0 0 8px;vertical-align:top;white-space:nowrap;">${SV('−' + formatMoney(Number(g.monto || 0)), '#fca5a5')}</td>
        </tr>`;
    }).join('');

    // ── ARQUEO por método (neto = ingreso − gasto)
    const arqueoRows = allMethodIds.filter((k) => k !== 'split').map((k) => {
        const ing = Number(ingresosMethod[k] || 0);
        const gas = Number(gastosMethod[k]   || 0);
        const net = ing - gas;
        if (ing === 0 && gas === 0) return '';
        const m = getPaymentMethods().find((x) => x.id === k) || { icon: '', label: k };
        const netColor = net >= 0 ? '#f0ead8' : '#fca5a5';
        let detail = '';
        if (gas > 0) {
            detail = `<br>${S('  Ingresó: ' + formatMoney(ing) + '  Gastó: ' + formatMoney(gas))}`;
        }
        return `<tr>
            <td style="padding:2px 0;">${S('  ' + m.icon + ' ' + escapeHtml(m.label))}${detail}</td>
            <td style="text-align:right;padding:2px 0 2px 8px;vertical-align:top;white-space:nowrap;">${SV((net < 0 ? '−' : '') + formatMoney(Math.abs(net)), netColor)}</td>
        </tr>`;
    }).filter(Boolean).join('');

    const egresosSection = gastosDetalle.length ? `
        ${DIV('EGRESOS / GASTOS', '#fca5a5')}
        <table style="width:100%;border-collapse:collapse;font-size:12px;">
            ${egresosRows}
            ${LINE()}
            ${ROW('  TOTAL EGRESOS', '−' + formatMoney(gastosTotal), '#fca5a5')}
        </table>` : '';

    return `<div style="font-family:'Courier New',monospace;font-size:13px;line-height:1.65;color:#f0ead8;background:#1a1412;padding:20px;border-radius:8px;border:1px solid #3a2e26;max-width:340px;">

        <div style="text-align:center;margin-bottom:12px;">
            <div style="font-weight:700;font-size:17px;letter-spacing:3px;color:#ff9540;">${escapeHtml(c.businessName || 'Roal Burger')}</div>
            ${c.businessAddress ? `<div style="color:#c8c0b8;font-size:11px;margin-top:2px;">${escapeHtml(c.businessAddress)}</div>` : ''}
            ${c.businessPhone  ? `<div style="color:#c8c0b8;font-size:11px;">Tel: ${escapeHtml(c.businessPhone)}</div>` : ''}
            ${c.businessNit    ? `<div style="color:#c8c0b8;font-size:11px;">NIT: ${escapeHtml(c.businessNit)}</div>` : ''}
        </div>

        <div style="border-top:2px solid #ff9540;border-bottom:2px solid #ff9540;text-align:center;padding:5px 0;margin-bottom:12px;font-weight:700;font-size:13px;color:#ff9540;letter-spacing:3px;">
            ★  CIERRE DE CAJA  ★
        </div>

        <table style="width:100%;border-collapse:collapse;font-size:12px;">
            ${ROW('Fecha', dateStr)}
            ${c.aperturaAt ? ROW('Hora apertura', new Date(Number(c.aperturaAt)).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })) : ''}
            ${c.aperturaBy ? ROW('Abierta por', escapeHtml(String(c.aperturaBy))) : ''}
            ${Number(c.fondoInicial) > 0 ? ROW('Fondo inicial', formatMoney(Number(c.fondoInicial)), '#f3c56a') : ''}
            ${ROW('Hora cierre', timeStr)}
            ${ROW('Transacciones', String(cobradas))}
            ${c.voidedCount ? ROW('Anulados (excluidos)', String(Number(c.voidedCount)), '#fca5a5') : ''}
        </table>

        ${DIV('INGRESOS', '#6ee7b7')}
        <table style="width:100%;border-collapse:collapse;font-size:12px;">
            ${ingresosRows || `<tr><td colspan="2" style="color:#c8c0b8;font-size:11px;">Sin movimientos</td></tr>`}
            ${LINE()}
            ${ROW('  TOTAL INGRESOS', formatMoney(ingresosTotal), '#6ee7b7')}
        </table>

        ${egresosSection}

        ${DIV('ARQUEO DE CAJA', '#fff')}
        <table style="width:100%;border-collapse:collapse;font-size:12px;">
            ${arqueoRows || `<tr><td colspan="2" style="color:#c8c0b8;font-size:11px;">Sin movimientos</td></tr>`}
        </table>

        <div style="border-top:2px solid #ff9540;margin-top:12px;padding-top:10px;">
            <table style="width:100%;border-collapse:collapse;">
                <tr>
                    <td style="font-weight:700;font-size:14px;color:#ff9540;letter-spacing:1px;">SALDO NETO CAJA</td>
                    <td style="text-align:right;font-weight:700;font-size:15px;color:${grandTotal >= 0 ? '#ff9540' : '#fca5a5'};">${grandTotal < 0 ? '−' : ''}${formatMoney(Math.abs(grandTotal))}</td>
                </tr>
            </table>
        </div>

        <div style="text-align:center;margin-top:14px;font-size:10px;color:#6a5a4a;border-top:1px dashed #3a2e26;padding-top:8px;letter-spacing:0.5px;">
            DOCUMENTO INTERNO — NO FISCAL<br>
            Generado por Sistema POS ${escapeHtml(brandingState.restaurantName || 'Roal Burger')}
        </div>
    </div>`;
}

// ── Cerrar Caja ───────────────────────────────────────────────────────────────
async function cerrarCaja() {
    const btn = document.getElementById('cerrarCajaBtn');
    if (btn) { btn.disabled = true; btn.textContent = 'Preparando...'; }

    try {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];

        // Mismo filtro que renderCajaDiaria; usa deliveredAt como fallback de timestamp
        const paid = ordersState.filter((o) => {
            if (!o.paymentMethod || o.paymentMethod === 'pendiente') return false;
            const ts = o.paidAt || o.deliveredAt || o.createdAt;
            const ms = ts?.toMillis ? ts.toMillis() : Number(ts || 0);
            if (!ms) return false;
            if (cajaAperturaAt) return ms >= cajaAperturaAt;
            return new Date(ms).toISOString().split('T')[0] === todayStr;
        });

        if (!paid.length) {
            showNotice('No hay cobros en la jornada actual para cerrar la caja.', 'error');
            return;
        }

        // Los anulados se cuentan pero NO afectan los totales netos
        const ingresosMethod = {};
        let ingresosTotal = 0;
        let voidedCount = 0;

        paid.forEach((o) => {
            if (o.voided) { voidedCount++; return; }
            const amt = Number(o.total || o.subtotal || 0);
            // Desglosar pagos divididos por su método real
            if (o.paymentMethod === 'split' && Array.isArray(o.paymentSplit) && o.paymentSplit.length) {
                o.paymentSplit.forEach(({ method: m, amount: a }) => {
                    if (!m) return;
                    const mk = _normalizePaymentMethodId(m);
                    if (!ingresosMethod[mk]) ingresosMethod[mk] = 0;
                    ingresosMethod[mk] += Number(a);
                });
            } else {
                const mk = _normalizePaymentMethodId(o.paymentMethod);
                if (!ingresosMethod[mk]) ingresosMethod[mk] = 0;
                ingresosMethod[mk] += amt;
            }
            ingresosTotal += amt;
        });

        // Incluir gastos de la jornada actual (excluir traslados internos del cálculo de egresos)
        const _allJornadaGastos = _gastosCajaState.filter((g) => {
            const ms = g.registradoAt?.toMillis ? g.registradoAt.toMillis() : Number(g.registradoAt || 0);
            if (cajaAperturaAt) return ms >= cajaAperturaAt;
            return new Date(ms).toISOString().split('T')[0] === todayStr;
        });
        const gastosFiltered   = _allJornadaGastos.filter((g) => g.tipo !== 'traslado');
        const trasladosInternos = _allJornadaGastos.filter((g) => g.tipo === 'traslado');

        // Incluir gasto virtual de domicilios si aún no fue registrado como gasto real
        const hasDomicilioGastoReal = gastosFiltered.some((g) => String(g.id || '').startsWith('gasto_domicilios_'));
        if (!hasDomicilioGastoReal) {
            const deliveryPaid = paid.filter((o) => !o.voided && (o.orderType === 'domicilio' || o.fulfillmentType === 'delivery'));
            const domicilioFeeSum = deliveryPaid.reduce((s, o) => s + Number(o.deliveryFee || 0), 0);
            if (domicilioFeeSum > 0) {
                gastosFiltered.push({
                    categoria: 'otros',
                    subcategoria: 'Domicilios',
                    proveedor: 'Domiciliario',
                    descripcion: `Gastos de domicilios (${deliveryPaid.length} pedido${deliveryPaid.length !== 1 ? 's' : ''})`,
                    monto: domicilioFeeSum,
                    paymentMethod: 'efectivo',
                });
            }
        }

        const gastosMethod = {};
        let gastosTotal = 0;
        gastosFiltered.forEach((g) => {
            const mk = g.paymentMethod;
            const amt = Number(g.monto || 0);
            if (!mk || !amt) return;
            if (!gastosMethod[mk]) gastosMethod[mk] = 0;
            gastosMethod[mk] += amt;
            gastosTotal += amt;
        });

        // Totales netos por método = ingresos − gastos
        const sumMethod = { ...ingresosMethod };
        Object.entries(gastosMethod).forEach(([mk, amt]) => {
            if (!sumMethod[mk]) sumMethod[mk] = 0;
            sumMethod[mk] -= amt;
        });
        // Traslados internos: reubican saldo entre métodos sin afectar el total neto
        trasladosInternos.forEach((t) => {
            const from = t.methodFrom; const to = t.methodTo;
            const amt = Number(t.monto || 0);
            if (!from || !to || !amt) return;
            if (!sumMethod[from]) sumMethod[from] = 0;
            if (!sumMethod[to])   sumMethod[to]   = 0;
            sumMethod[from] -= amt;
            sumMethod[to]   += amt;
        });
        const grandTotal = ingresosTotal - gastosTotal;

        const cfg = brandingState || {};

        const closedAt = firestoreNow();
        const closureId = `cierre_${todayStr}_${Date.now()}`;

        const closureDoc = {
            id: closureId,
            closedAt,
            date: todayStr,
            aperturaAt: cajaAperturaAt || null,
            aperturaBy: _cajaAperturaBy || '',
            fondoInicial: _cajaFondoInicial || 0,
            transactionCount: paid.length,
            voidedCount,
            ingresosMethod,
            ingresosTotal,
            gastosMethod,
            gastosTotal,
            gastosDetalle: gastosFiltered.map((g) => ({
                categoria: g.categoria || '',
                subcategoria: g.subcategoria || '',
                proveedor: g.proveedor || '',
                descripcion: g.descripcion || '',
                monto: Number(g.monto || 0),
                paymentMethod: g.paymentMethod || '',
            })),
            methodTotals: sumMethod,
            grandTotal,
            businessName: cfg.restaurantName || 'Roal Burger',
            businessAddress: cfg.address || '',
            businessPhone: cfg.whatsappNumber || '',
            businessNit: cfg.nit || '',
        };

        const dateStr = today.toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });
        const timeStr = today.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const ticketHtml = _buildCierreTicketHtml(closureDoc, dateStr, timeStr);

        // Guardar datos pendientes y mostrar preview — el usuario confirma el cierre desde el panel
        _pendingCierreDoc = { closureDoc, closureId, ticketHtml, dateStr, timeStr };
        openCierreSidePanel(ticketHtml, `Vista previa · ${dateStr}`);
        _navigateToCajaDiaria();

    } catch (err) {
        showNotice(`Error al preparar cierre: ${err.message || 'error inesperado.'}`, 'error');
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = '🔒 Cerrar Caja'; }
    }
}

function _showCerrarCajaConfirm(onAccept) {
    const now = new Date();
    const fechaHora = now.toLocaleString('es-CO', {
        weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
    });

    const existing = document.getElementById('_cerrarCajaConfirmOverlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = '_cerrarCajaConfirmOverlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.65);display:flex;align-items:center;justify-content:center;padding:1rem;';

    overlay.innerHTML = `
        <div style="background:#1e1e2e;border:1.5px solid rgba(255,255,255,0.12);border-radius:18px;padding:2rem 1.75rem;max-width:380px;width:100%;box-shadow:0 8px 40px rgba(0,0,0,0.55);text-align:center;">
            <div style="font-size:2rem;margin-bottom:0.75rem;">🔒</div>
            <h3 style="margin:0 0 0.5rem;color:#fff;font-size:1.1rem;font-weight:700;">¿Cerrar la caja?</h3>
            <p style="margin:0 0 0.5rem;color:rgba(255,255,255,0.65);font-size:0.88rem;line-height:1.5;">
                Esta acción cierra la jornada actual y no se puede deshacer.
            </p>
            <p style="margin:0 0 1.25rem;color:rgba(255,255,255,0.4);font-size:0.78rem;">${fechaHora}</p>
            <div style="display:flex;gap:0.75rem;">
                <button id="_cerrarCajaCancelBtn" style="flex:1;padding:0.7rem;border-radius:10px;border:1.5px solid rgba(255,255,255,0.18);background:transparent;color:rgba(255,255,255,0.7);font-size:0.9rem;cursor:pointer;">Cancelar</button>
                <button id="_cerrarCajaAcceptBtn" style="flex:1;padding:0.7rem;border-radius:10px;border:none;background:#e53935;color:#fff;font-size:0.9rem;font-weight:700;cursor:pointer;">Sí, cerrar caja</button>
            </div>
        </div>`;

    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    _bindOverlayClose(overlay, close);
    document.getElementById('_cerrarCajaCancelBtn').addEventListener('click', close);
    document.getElementById('_cerrarCajaAcceptBtn').addEventListener('click', () => {
        close();
        onAccept();
    });
}

document.getElementById('cerrarCajaBtn')?.addEventListener('click', () => {
    _showCerrarCajaConfirm(() => cerrarCaja());
});
document.getElementById('cerrarCajaBtnPos')?.addEventListener('click', () => {
    _showCerrarCajaConfirm(() => {
        _navigateToCajaDiaria();
        cerrarCaja();
    });
});

// ── Apertura de Caja ──────────────────────────────────────────────────────────
function _showAbrirCajaModal() {
    document.getElementById('_abrirCajaOverlay')?.remove();
    _ccLoad();
    const savedTotal = _ccTotal();

    const now = new Date();
    const fechaStr = now.toLocaleString('es-CO', {
        weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });

    const overlay = document.createElement('div');
    overlay.id = '_abrirCajaOverlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.72);display:flex;align-items:center;justify-content:center;padding:1rem;';

    overlay.innerHTML = `
        <div style="background:#14172a;border:1.5px solid rgba(255,255,255,0.12);border-radius:20px;padding:1.75rem;max-width:420px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,0.65);max-height:90vh;overflow-y:auto;position:relative;">

            <div id="_acHeader" style="text-align:center;margin-bottom:1.25rem;position:relative;">
                <button type="button" id="_acCloseBtn" style="position:absolute;top:-4px;right:-4px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:50%;color:#fff;font-size:1.1rem;cursor:pointer;line-height:1;width:28px;height:28px;display:flex;align-items:center;justify-content:center;" aria-label="Cerrar">×</button>
                <div style="font-size:2rem;margin-bottom:0.3rem;">📂</div>
                <h3 style="margin:0;color:#fff;font-size:1.1rem;font-weight:700;">Apertura de Caja</h3>
                <p style="margin:4px 0 0;color:rgba(255,255,255,0.4);font-size:0.76rem;">${fechaStr}</p>
            </div>

            <label style="display:block;color:rgba(255,255,255,0.65);font-size:0.82rem;margin-bottom:5px;">👤 ¿Quién abre la caja?</label>
            <input id="_acNombreInput" type="text" placeholder="Nombre del responsable" autocomplete="off"
                style="width:100%;box-sizing:border-box;background:#0c0e18;border:1.5px solid rgba(255,255,255,0.18);border-radius:10px;color:#fff;padding:10px 12px;font-size:0.9rem;margin-bottom:1.1rem;outline:none;">

            <div id="_acStep1">
                <div style="background:rgba(243,197,106,0.08);border:1px solid rgba(243,197,106,0.25);border-radius:12px;padding:0.9rem 1rem;margin-bottom:1rem;display:flex;justify-content:space-between;align-items:center;">
                    <span style="color:rgba(255,255,255,0.6);font-size:0.83rem;">💰 Caja chica guardada</span>
                    <span style="color:#f3c56a;font-weight:700;font-size:1.1rem;">${formatMoney(savedTotal)}</span>
                </div>
                <div style="display:flex;flex-direction:column;gap:0.6rem;">
                    <button id="_acUsarGuardadoBtn" type="button"
                        style="padding:0.8rem;border-radius:12px;border:none;background:linear-gradient(135deg,#f3c56a,#c8962a);color:#000;font-size:0.88rem;font-weight:700;cursor:pointer;letter-spacing:0.3px;">
                        ✓ Iniciar con caja chica guardada
                    </button>
                    <button id="_acRecontarBtn" type="button"
                        style="padding:0.75rem;border-radius:12px;border:1.5px solid rgba(255,255,255,0.18);background:transparent;color:rgba(255,255,255,0.7);font-size:0.85rem;cursor:pointer;">
                        🔄 Volver a contar
                    </button>
                </div>
            </div>

            <div id="_acStep2" hidden>
                <button id="_acBackBtn" type="button"
                    style="background:none;border:none;color:rgba(255,255,255,0.55);font-size:0.82rem;cursor:pointer;padding:0;margin-bottom:0.75rem;display:flex;align-items:center;gap:4px;">
                    ‹ Volver
                </button>
                <div style="color:#f3c56a;font-size:0.75rem;font-weight:700;letter-spacing:1.2px;margin-bottom:6px;">BILLETES</div>
                <div id="_acBilletesGrid" style="margin-bottom:10px;"></div>
                <div style="color:#f3c56a;font-size:0.75rem;font-weight:700;letter-spacing:1.2px;margin-bottom:6px;">MONEDAS</div>
                <div id="_acMonedasGrid" style="margin-bottom:12px;"></div>
                <div style="color:#94a3b8;font-size:0.75rem;font-weight:700;letter-spacing:1.2px;margin-bottom:6px;">GUARDADOS (caja fuerte / sobre)</div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;">
                    <div>
                        <label style="display:block;color:rgba(255,255,255,0.45);font-size:0.72rem;margin-bottom:3px;">Billetes guardados</label>
                        <input id="_acGuardadosBilletes" type="number" min="0" step="1000" inputmode="numeric" placeholder="0"
                            value="${_ccGuardadosBilletes > 0 ? _ccGuardadosBilletes : ''}"
                            style="width:100%;box-sizing:border-box;background:#0c0e18;border:1.5px solid rgba(255,255,255,0.14);border-radius:8px;color:#f3c56a;padding:7px 9px;font-size:0.88rem;font-weight:700;outline:none;">
                    </div>
                    <div>
                        <label style="display:block;color:rgba(255,255,255,0.45);font-size:0.72rem;margin-bottom:3px;">Monedas guardadas</label>
                        <input id="_acGuardadasMonedas" type="number" min="0" step="100" inputmode="numeric" placeholder="0"
                            value="${_ccGuardadasMonedas > 0 ? _ccGuardadasMonedas : ''}"
                            style="width:100%;box-sizing:border-box;background:#0c0e18;border:1.5px solid rgba(255,255,255,0.14);border-radius:8px;color:#f3c56a;padding:7px 9px;font-size:0.88rem;font-weight:700;outline:none;">
                    </div>
                </div>
                <div style="display:flex;justify-content:space-between;align-items:center;padding:0.75rem 0;border-top:1px dashed rgba(255,255,255,0.14);">
                    <span style="color:rgba(255,255,255,0.6);font-size:0.85rem;">Total contado:</span>
                    <span id="_acCountedTotal" style="color:#f3c56a;font-weight:700;font-size:1.05rem;">${formatMoney(0)}</span>
                </div>
                <button id="_acConfirmCountBtn" type="button"
                    style="width:100%;padding:0.8rem;border-radius:12px;border:none;background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff;font-size:0.88rem;font-weight:700;cursor:pointer;margin-top:2px;">
                    ✓ Permanecer con este conteo y abrir caja
                </button>
            </div>

        </div>`;

    document.body.appendChild(overlay);

    const countedBilletes = { ..._ccBilletes };
    const countedMonedas  = { ..._ccMonedas };
    let countedGuardadosBilletes = _ccGuardadosBilletes;
    let countedGuardadasMonedas  = _ccGuardadasMonedas;

    function _acSubB2() { return CC_BILLETES.reduce((s, d) => s + d * (Number(countedBilletes[d] || 0)), 0); }
    function _acSubM2() { return CC_MONEDAS.reduce((s, d)  => s + d * (Number(countedMonedas[d]  || 0)), 0); }
    function _acTotal2() { return _acSubB2() + _acSubM2() + countedGuardadosBilletes + countedGuardadasMonedas; }

    function _acRenderGrid2(containerId, denoms, state) {
        const el = document.getElementById(containerId);
        if (!el) return;
        el.innerHTML = denoms.map((d) => {
            const count = Number(state[d] || 0);
            const sub = d * count;
            return `<div style="display:flex;align-items:center;gap:8px;margin:4px 0;">
                <span style="color:#888;min-width:75px;font-size:0.82rem;">${formatMoney(d)}</span>
                <input type="number" data-ac-denom="${d}" value="${count || ''}" placeholder="0" min="0" step="1" inputmode="numeric"
                    style="width:62px;background:#0c0e18;border:1.5px solid rgba(255,255,255,0.14);border-radius:8px;color:#fff;padding:5px 6px;font-size:0.85rem;text-align:center;">
                <span data-ac-sub="${d}" style="color:#f3c56a;font-size:0.82rem;min-width:72px;text-align:right;font-weight:${sub > 0 ? 700 : 400};">${sub > 0 ? formatMoney(sub) : '—'}</span>
            </div>`;
        }).join('');
    }

    function _acRefreshCountedTotal2() {
        const el = document.getElementById('_acCountedTotal');
        if (el) el.textContent = formatMoney(_acTotal2());
    }

    function _acValidateNombre() {
        const inp = document.getElementById('_acNombreInput');
        const nombre = (inp?.value || '').trim();
        if (!nombre) {
            if (inp) { inp.style.borderColor = '#ef4444'; inp.focus(); }
            document.getElementById('_acStep1').hidden = false;
            document.getElementById('_acStep2').hidden = true;
            return '';
        }
        if (inp) inp.style.borderColor = 'rgba(255,255,255,0.18)';
        return nombre;
    }

    function _acConfirm2(fondoUsado, recounted) {
        const nombre = _acValidateNombre();
        if (!nombre) return;
        const ts = Date.now();
        cajaAperturaAt = ts;
        _cajaAperturaBy = nombre;
        _cajaFondoInicial = fondoUsado;
        try { localStorage.setItem(CAJA_APERTURA_STORAGE_KEY, String(ts)); } catch {}
        if (recounted) {
            _ccBilletes = { ...countedBilletes };
            _ccMonedas  = { ...countedMonedas };
            _ccGuardadosBilletes = countedGuardadosBilletes;
            _ccGuardadasMonedas  = countedGuardadasMonedas;
            _ccSave();
            _ccRefreshTotals();
        }
        saveCajaAperturaToFirestore(ts, { aperturaBy: nombre, fondoInicial: fondoUsado, cerrada: false });
        overlay.remove();
        renderCajaDiaria();
        _updateCajaEstadoUI();
        showNotice(`Caja abierta por ${nombre} · Fondo: ${formatMoney(fondoUsado)}`, 'ok');
    }

    document.getElementById('_acUsarGuardadoBtn')?.addEventListener('click', () => {
        _acConfirm2(savedTotal, false);
    });

    document.getElementById('_acRecontarBtn')?.addEventListener('click', () => {
        document.getElementById('_acStep1').hidden = true;
        document.getElementById('_acStep2').hidden = false;
        _acRenderGrid2('_acBilletesGrid', CC_BILLETES, countedBilletes);
        _acRenderGrid2('_acMonedasGrid', CC_MONEDAS, countedMonedas);
        _acRefreshCountedTotal2();
    });

    document.getElementById('_acBackBtn')?.addEventListener('click', () => {
        document.getElementById('_acStep1').hidden = false;
        document.getElementById('_acStep2').hidden = true;
    });

    document.getElementById('_acStep2')?.addEventListener('input', (e) => {
        if (e.target.id === '_acGuardadosBilletes') {
            countedGuardadosBilletes = Number(e.target.value) || 0;
            _acRefreshCountedTotal2();
            return;
        }
        if (e.target.id === '_acGuardadasMonedas') {
            countedGuardadasMonedas = Number(e.target.value) || 0;
            _acRefreshCountedTotal2();
            return;
        }
        const inp = e.target.closest('[data-ac-denom]');
        if (!inp) return;
        const d = Number(inp.dataset.acDenom);
        const count = Number(inp.value) || 0;
        if (CC_BILLETES.includes(d)) countedBilletes[d] = count;
        else countedMonedas[d] = count;
        const sub = d * count;
        const subEl = inp.closest('div')?.querySelector(`[data-ac-sub="${d}"]`);
        if (subEl) {
            subEl.textContent = sub > 0 ? formatMoney(sub) : '—';
            subEl.style.fontWeight = sub > 0 ? '700' : '400';
        }
        _acRefreshCountedTotal2();
    });

    document.getElementById('_acConfirmCountBtn')?.addEventListener('click', () => {
        _acConfirm2(_acTotal2(), true);
    });

    document.getElementById('_acCloseBtn')?.addEventListener('click', () => overlay.remove());

    setTimeout(() => document.getElementById('_acNombreInput')?.focus(), 120);
}

document.getElementById('abrirCajaBtnPos')?.addEventListener('click', () => {
    _showAbrirCajaModal();
});

// ── Estado visual de la caja (abierta / cerrada) ─────────────────────────────
function _updateCajaEstadoUI() {
    const abierta = cajaAperturaAt > 0;
    const abrirBtn   = document.getElementById('abrirCajaBtnPos');
    const cerrarBtn  = document.getElementById('cerrarCajaBtnPos');
    const newTickBtn = document.getElementById('posNewTicketBtn');
    const posCard    = document.getElementById('posOrdersCard');

    // "Abrir Caja": solo visible cuando está cerrada
    if (abrirBtn) abrirBtn.style.display = abierta ? 'none' : '';

    // "Cerrar Caja": siempre visible, opaco e inactivo cuando está cerrada
    if (cerrarBtn) {
        cerrarBtn.disabled       = !abierta;
        cerrarBtn.style.opacity  = abierta ? '' : '0.35';
        cerrarBtn.style.cursor   = abierta ? '' : 'not-allowed';
        cerrarBtn.style.filter   = abierta ? '' : 'grayscale(0.5)';
    }

    // Botón "+" nuevo ticket: deshabilitado cuando está cerrada
    if (newTickBtn) {
        newTickBtn.disabled      = !abierta;
        newTickBtn.style.opacity = abierta ? '' : '0.35';
        newTickBtn.style.cursor  = abierta ? '' : 'not-allowed';
    }

    // Bloqueador visual sobre el panel de recepción de pedidos
    let blocker = document.getElementById('_posCajaBlocker');
    if (!abierta) {
        if (!blocker && posCard) {
            blocker = document.createElement('div');
            blocker.id = '_posCajaBlocker';
            blocker.style.cssText = 'position:absolute;inset:0;z-index:20;background:rgba(8,10,22,0.78);border-radius:inherit;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:10px;backdrop-filter:blur(3px);pointer-events:all;';
            blocker.innerHTML = `
                <div style="font-size:2.8rem;line-height:1;">🔒</div>
                <p style="color:#fff;font-size:1.05rem;font-weight:700;margin:0;">Caja cerrada</p>
                <p style="color:rgba(255,255,255,0.45);font-size:0.82rem;margin:0;text-align:center;max-width:260px;">Presiona <strong style="color:#86efac;">Abrir Caja</strong> en la barra superior para comenzar la jornada</p>`;
            posCard.appendChild(blocker);
        }
    } else {
        if (blocker) blocker.remove();
    }
}

// ── Buscador de precio de domicilio (admin toolbar) ───────────────────────────
(function () {
    const ADMIN_DELIVERY_ZONES = [
        { name: 'amarilla', fee: 5000, label: '🟡 Zona Amarilla', polygon: [[4.5443,-75.6838],[4.5435,-75.6821],[4.5424,-75.6821],[4.5421,-75.6808],[4.5423,-75.6798],[4.5416,-75.6790],[4.5411,-75.6797],[4.5410,-75.6824],[4.5404,-75.6830],[4.5405,-75.6841],[4.5409,-75.6852],[4.5410,-75.6858],[4.5423,-75.6858],[4.5425,-75.6861],[4.5423,-75.6868],[4.5429,-75.6879],[4.5443,-75.6879],[4.5448,-75.6867]] },
        { name: 'azul',     fee: 6000, label: '🔵 Zona Azul',     polygon: [[4.5544,-75.6831],[4.5538,-75.6716],[4.5526,-75.6671],[4.5509,-75.6652],[4.5502,-75.6669],[4.5467,-75.6667],[4.5456,-75.6620],[4.5476,-75.6576],[4.5376,-75.6635],[4.5254,-75.6777],[4.5268,-75.6800],[4.5243,-75.6828],[4.5213,-75.6836],[4.5216,-75.6857],[4.5200,-75.6873],[4.5194,-75.6881],[4.5175,-75.6900],[4.5179,-75.6911],[4.5199,-75.6917],[4.5198,-75.6944],[4.5192,-75.6957],[4.5199,-75.6966],[4.5192,-75.6981],[4.5190,-75.7007],[4.5214,-75.7007],[4.5228,-75.6986],[4.5259,-75.6981],[4.5283,-75.7000],[4.5302,-75.7030],[4.5324,-75.7026],[4.5330,-75.7064],[4.5335,-75.7086],[4.5348,-75.7100],[4.5386,-75.7094],[4.5407,-75.7086],[4.5436,-75.7093],[4.5446,-75.6951],[4.5482,-75.6883]] },
        { name: 'roja',     fee: 7000, label: '🔴 Zona Roja',     polygon: [[4.5568,-75.6839],[4.5558,-75.6741],[4.5606,-75.6667],[4.5614,-75.6603],[4.5687,-75.6552],[4.5712,-75.6517],[4.5730,-75.6494],[4.5754,-75.6476],[4.5767,-75.6501],[4.5798,-75.6497],[4.5762,-75.6365],[4.5699,-75.6401],[4.5678,-75.6412],[4.5647,-75.6421],[4.5632,-75.6429],[4.5584,-75.6452],[4.5553,-75.6482],[4.5498,-75.6499],[4.5443,-75.6534],[4.5388,-75.6586],[4.5346,-75.6614],[4.5304,-75.6656],[4.5279,-75.6670],[4.5283,-75.6706],[4.5301,-75.6704],[4.5282,-75.6728],[4.5262,-75.6748],[4.5249,-75.6767],[4.5254,-75.6787],[4.5247,-75.6810],[4.5232,-75.6826],[4.5207,-75.6825],[4.5203,-75.6842],[4.5203,-75.6858],[4.5173,-75.6878],[4.5132,-75.6864],[4.5108,-75.6873],[4.5069,-75.6887],[4.5052,-75.6900],[4.5045,-75.6915],[4.5024,-75.6929],[4.5024,-75.6940],[4.5024,-75.6955],[4.5023,-75.6959],[4.5020,-75.6972],[4.4994,-75.6988],[4.5001,-75.6997],[4.5034,-75.6990],[4.5038,-75.7008],[4.5050,-75.7014],[4.5050,-75.7014],[4.5056,-75.7017],[4.5067,-75.6983],[4.5088,-75.6981],[4.5103,-75.6960],[4.5109,-75.6998],[4.5095,-75.7020],[4.5093,-75.7038],[4.5097,-75.7042],[4.5097,-75.7052],[4.5094,-75.7055],[4.5113,-75.7025],[4.5120,-75.7044],[4.5128,-75.7087],[4.5132,-75.7115],[4.5134,-75.7131],[4.5117,-75.7137],[4.5112,-75.7164],[4.5136,-75.7173],[4.5122,-75.7193],[4.5137,-75.7216],[4.5244,-75.7190],[4.5260,-75.7171],[4.5285,-75.7168],[4.5290,-75.7182],[4.5317,-75.7178],[4.5338,-75.7177],[4.5350,-75.7165],[4.5380,-75.7119],[4.5485,-75.7106]] },
        { name: 'negra',    fee: 8000, label: '⬛ Zona Negra',    polygon: [[4.5638,-75.6656],[4.5739,-75.6533],[4.5828,-75.6527],[4.5856,-75.6440],[4.5815,-75.6299],[4.5504,-75.6464],[4.5352,-75.6566],[4.5268,-75.6672],[4.5226,-75.6758],[4.5104,-75.6851],[4.5021,-75.6890],[4.4966,-75.6922],[4.4982,-75.6949],[4.4944,-75.7042],[4.5038,-75.7072],[4.5043,-75.7135],[4.5090,-75.7124],[4.5090,-75.7187],[4.5129,-75.7232],[4.5134,-75.7282],[4.5144,-75.7286],[4.5163,-75.7282],[4.5172,-75.7250],[4.5182,-75.7217],[4.5250,-75.7219],[4.5309,-75.7211],[4.5381,-75.7156],[4.5491,-75.7142]] }
    ];

    function _adminZoneForPoint(lat, lng) {
        return ADMIN_DELIVERY_ZONES.find(({ polygon }) => {
            let inside = false;
            for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
                const xi = polygon[i][0], yi = polygon[i][1];
                const xj = polygon[j][0], yj = polygon[j][1];
                if (((yi > lng) !== (yj > lng)) && (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi)) inside = !inside;
            }
            return inside;
        }) || null;
    }

    function _adminFormatFee(n) {
        return '$ ' + Number(n).toLocaleString('es-CO');
    }

    // Normaliza abreviaturas y errores ortográficos comunes en direcciones colombianas
    function _adminNormalizeAddress(raw) {
        return raw
            .normalize('NFD').replace(/[̀-ͯ]/g, '') // quitar tildes
            .toLowerCase()
            .replace(/\bcra?\.?\s*/g, 'carrera ')
            .replace(/\bcl\.?\s*/g, 'calle ')
            .replace(/\bav\.?\s*/g, 'avenida ')
            .replace(/\bdg\.?\s*/g, 'diagonal ')
            .replace(/\btr\.?\s*/g, 'transversal ')
            .replace(/\bkr\.?\s*/g, 'carrera ')
            .replace(/\bn[oº°]\.?\s*/g, 'numero ')
            .replace(/\s{2,}/g, ' ')
            .trim();
    }

    // Genera variantes del query para tolerar errores tipográficos
    function _adminQueryVariants(val) {
        const base = _adminNormalizeAddress(val);
        const original = val.trim();
        const variants = [original, base];
        // variante: solo primeras palabras (por si hay número de casa extra)
        const words = base.split(' ');
        if (words.length > 2) variants.push(words.slice(0, 3).join(' '));
        return [...new Set(variants)];
    }

    async function _adminGeocode(val) {
        const variants = _adminQueryVariants(val);
        for (const variant of variants) {
            const q = encodeURIComponent(`${variant}, Armenia, Quindio, Colombia`);
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${q}&limit=3&countrycodes=co`, {
                    headers: { 'Accept-Language': 'es', 'User-Agent': 'RoalBurgerAdmin/1.0' }
                });
                const data = await res.json();
                if (Array.isArray(data) && data.length) return data[0];
            } catch (_) { /* siguiente variante */ }
        }
        return null;
    }

    let _adminGeoTimer = null;
    const input  = document.getElementById('adminDomicilioInput');
    const result = document.getElementById('adminDomicilioResult');
    if (!input || !result) return;

    function setResult(text, cls) {
        result.textContent = text;
        result.className = 'admin-domicilio-result' + (cls ? ' ' + cls : '');
    }

    input.addEventListener('input', () => {
        clearTimeout(_adminGeoTimer);
        const val = input.value.trim();
        if (!val || val.length < 4) { setResult('', ''); return; }
        setResult('Buscando...', '');
        _adminGeoTimer = setTimeout(async () => {
            try {
                const hit = await _adminGeocode(val);
                if (!hit) { setResult('Sin coincidencias', 'result-error'); return; }
                const lat = parseFloat(hit.lat), lng = parseFloat(hit.lon);
                const zone = _adminZoneForPoint(lat, lng);
                if (zone) {
                    setResult(_adminFormatFee(zone.fee), 'result-found');
                } else {
                    setResult('Fuera de zona · Consultar', 'result-outside');
                }
            } catch (_) {
                setResult('Error al buscar', 'result-error');
            }
        }, 800);
    });

    // Exponer funciones para uso desde el POS
    window._adminDetectZone = _adminZoneForPoint;
    window._adminGeocode = _adminGeocode;
    window._adminQueryVariants = _adminQueryVariants;
})();

// ── Libro Contable: historial de cierres de caja ──────────────────────────────
let _cierresCajaState = [];
let _cierresSumTotals = {};
let _gastosExternosState = []; // gastos tipo:'externo' añadidos desde el historial

async function loadCierresCaja() {
    const snap = await firebaseDb.collection(CIERRES_CAJA_COLLECTION)
        .orderBy('closedAt', 'desc')
        .limit(100)
        .get();
    _cierresCajaState = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    // Cargar gastos externos (registrados desde Historial, fuera de cualquier cierre)
    try {
        const gSnap = await firebaseDb.collection(GASTOS_CAJA_COLLECTION)
            .orderBy('registradoAt', 'desc')
            .limit(500)
            .get();
        _gastosExternosState = gSnap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .filter((g) => g.tipo === 'externo');
    } catch (_) { _gastosExternosState = []; }

    return _cierresCajaState;
}

function _getCierresFilterRange() {
    const fromVal = document.getElementById('cierresDateFrom')?.value || '';
    const toVal   = document.getElementById('cierresDateTo')?.value   || '';
    const from = fromVal ? new Date(`${fromVal}T00:00:00`) : null;
    // Si solo hay inicio, muestra ese único día (fin = mismo día)
    const to = toVal ? new Date(`${toVal}T23:59:59`) : from ? new Date(`${fromVal}T23:59:59`) : null;
    return { from, to };
}

function _updateCierreDrp() {
    const from = document.getElementById('cierresDateFrom')?.value || '';
    const to   = document.getElementById('cierresDateTo')?.value   || '';
    const btn  = document.getElementById('cierreDrpBtn');
    const lbl  = document.getElementById('cierreDrpLabel');
    const fmt  = (s) => new Date(s + 'T12:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: '2-digit' });
    if (!from && !to) {
        if (lbl) lbl.textContent = 'Todas las fechas';
        btn?.classList.remove('active');
    } else if (from && (!to || from === to)) {
        if (lbl) lbl.textContent = fmt(from);
        btn?.classList.add('active');
    } else {
        if (lbl) lbl.textContent = `${fmt(from)} → ${fmt(to)}`;
        btn?.classList.add('active');
    }
    renderLibroCierres();
}

async function renderLibroCierres() {
    const headEl = document.getElementById('libroCierresHead');
    const tbody  = document.getElementById('libroCierresList');
    const footEl = document.getElementById('libroCierresFoot');
    if (!tbody) return;

    const methods = getPaymentMethods();
    const methodKeys = methods.map((m) => m.id);
    // cols: día + fecha + métodos (neto) + egresos + total neto + ver
    const totalCols = 2 + methodKeys.length + 3;

    tbody.innerHTML = `<tr><td colspan="${totalCols}" style="text-align:center;padding:12px;color:var(--admin-muted);">Cargando…</td></tr>`;

    // Cabecera dinámica
    if (headEl) {
        headEl.innerHTML = `<tr>
            <th class="col-left">Día</th>
            <th class="col-left">Fecha cierre</th>
            ${methods.map((m) => `<th>${m.icon} ${escapeHtml(m.label)}</th>`).join('')}
            <th style="color:#fca5a5;">💸 Egresos</th>
            <th>Total neto</th>
            <th style="text-align:center;"></th>
        </tr>`;
    }

    try {
        let cierres = await loadCierresCaja();

        // Cargar gastos externos y traslados (registrados desde el historial)
        let gastosExternos = [];
        let trasladosHistorial = [];
        try {
            const gSnap = await firebaseDb.collection(GASTOS_CAJA_COLLECTION)
                .orderBy('registradoAt', 'desc')
                .limit(500)
                .get();
            const _gDocs = gSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
            gastosExternos     = _gDocs.filter((g) => g.tipo === 'externo');
            trasladosHistorial = _gDocs.filter((g) => g.tipo === 'traslado');
        } catch (_) { gastosExternos = []; trasladosHistorial = []; }

        // Filtrar por rango de fechas si hay alguno activo
        const { from, to } = _getCierresFilterRange();
        const _inRange = (ms) => {
            if (!ms) return false;
            const d = new Date(ms);
            if (from && d < from) return false;
            if (to   && d > to)   return false;
            return true;
        };
        if (from || to) {
            cierres = cierres.filter((c) => _inRange(c.closedAt?.toMillis ? c.closedAt.toMillis() : Number(c.closedAt || 0)));
            gastosExternos = gastosExternos.filter((g) => _inRange(g.registradoAt?.toMillis ? g.registradoAt.toMillis() : Number(g.registradoAt || 0)));
            trasladosHistorial = trasladosHistorial.filter((t) => _inRange(t.registradoAt?.toMillis ? t.registradoAt.toMillis() : Number(t.registradoAt || 0)));
        }
        if (!cierres.length && !gastosExternos.length && !trasladosHistorial.length) {
            const emptyMsg = (from || to)
                ? 'Sin movimientos en el rango de fechas seleccionado.'
                : 'No hay cierres de caja registrados.';
            tbody.innerHTML = `<tr><td class="caja-empty" colspan="${totalCols}">${emptyMsg}</td></tr>`;
            if (footEl) footEl.innerHTML = '';
            const _kpi = document.getElementById('cierresKpiGrid');
            if (_kpi) _kpi.innerHTML = '';
            return;
        }

        const DIAS = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];

        // Acumuladores
        const sumTotals = {};
        methodKeys.forEach((k) => { sumTotals[k] = 0; });
        let grandSumTotal = 0;
        let grandSumEgresos = 0;
        let grandSumIngresos = 0;

        // Agrupar gastos externos por día de calendario
        const _gasByDay = {};
        gastosExternos.forEach((g) => {
            const ms = g.registradoAt?.toMillis ? g.registradoAt.toMillis() : Number(g.registradoAt || 0);
            const dayKey = ms ? new Date(ms).toISOString().split('T')[0] : '_nd';
            if (!_gasByDay[dayKey]) _gasByDay[dayKey] = [];
            _gasByDay[dayKey].push({ ...g, _ts: ms });
        });
        const _gastoGroups = Object.values(_gasByDay).map((items) => {
            const latestTs = Math.max(...items.map((i) => i._ts));
            const totByMethod = {};
            let totalAmt = 0;
            items.forEach((g) => {
                const mk = g.paymentMethod || '';
                const amt = Number(g.monto || 0);
                if (mk && amt) { totByMethod[mk] = (totByMethod[mk] || 0) + amt; totalAmt += amt; }
            });
            const dObj = new Date(latestTs);
            return { _tipo: 'gastos_dia', _ts: latestTs, _items: items, _totByMethod: totByMethod, _totalAmt: totalAmt, _d: dObj, _diaStr: DIAS[dObj.getDay()] };
        });

        const allEntries = [
            ...cierres.map((c) => ({ ...c, _tipo: 'cierre' })),
            ..._gastoGroups,
            ...trasladosHistorial.map((t) => {
                const ms = t.registradoAt?.toMillis ? t.registradoAt.toMillis() : Number(t.registradoAt || 0);
                return { _tipo: 'traslado', _ts: ms, _data: t };
            }),
        ].sort((a, b) => {
            const tsA = a._tipo === 'cierre' ? (a.closedAt?.toMillis ? a.closedAt.toMillis() : Number(a.closedAt || 0)) : a._ts;
            const tsB = b._tipo === 'cierre' ? (b.closedAt?.toMillis ? b.closedAt.toMillis() : Number(b.closedAt || 0)) : b._ts;
            return tsB - tsA;
        });

        const _dayOf = (ms) => { const d = new Date(ms); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };

        // ── PASO 1: Agrupar entradas por día y acumular totales globales ──
        const _dayGroups = {};
        const _dayOrder  = [];
        allEntries.forEach((entry) => {
            const ms = entry._tipo === 'cierre'
                ? (entry.closedAt?.toMillis ? entry.closedAt.toMillis() : Number(entry.closedAt || 0))
                : (entry._ts || 0);
            const dk = ms ? _dayOf(ms) : '_nd';
            if (!_dayGroups[dk]) {
                const dg0 = { dk, ms, entries: [], ingM: {}, gasM: {}, ingT: 0, gasT: 0, net: 0 };
                methodKeys.forEach((k) => { dg0.ingM[k] = 0; dg0.gasM[k] = 0; });
                _dayGroups[dk] = dg0;
                _dayOrder.push(dk);
            }
            const dg = _dayGroups[dk];
            if (ms > dg.ms) dg.ms = ms;
            dg.entries.push({ ...entry, _ms: ms });

            if (entry._tipo === 'cierre') {
                const iM = entry.ingresosMethod || entry.methodTotals || {};
                const gM = entry.gastosMethod || {};
                const nM = entry.methodTotals || {};
                methodKeys.forEach((k) => {
                    dg.ingM[k] += Number(iM[k] || 0);
                    dg.gasM[k] += Number(gM[k] || 0);
                    sumTotals[k] += Number(nM[k] || 0);
                });
                const gT = Number(entry.gastosTotal || 0);
                const gNet = Number(entry.grandTotal || 0);
                const ingT = Number(entry.ingresosTotal ?? entry.grandTotal ?? 0);
                dg.ingT += ingT;
                dg.gasT += gT;
                dg.net  += gNet;
                grandSumIngresos += ingT;
                grandSumEgresos  += gT;
                grandSumTotal    += gNet;
            } else if (entry._tipo === 'gastos_dia') {
                methodKeys.forEach((k) => { dg.gasM[k] += Number(entry._totByMethod[k] || 0); });
                const amt = entry._totalAmt;
                dg.gasT += amt;
                dg.net  -= amt;
                Object.entries(entry._totByMethod).forEach(([k, a]) => { sumTotals[k] = (sumTotals[k] || 0) - a; });
                grandSumEgresos += amt;
                grandSumTotal   -= amt;
            } else if (entry._tipo === 'traslado') {
                const t = entry._data;
                const tAmt = Number(t.monto || 0);
                if (methodKeys.includes(t.methodFrom)) sumTotals[t.methodFrom] = (sumTotals[t.methodFrom] || 0) - tAmt;
                if (methodKeys.includes(t.methodTo))   sumTotals[t.methodTo]   = (sumTotals[t.methodTo]   || 0) + tAmt;
            }
        });

        // ── PASO 2: Renderizar por grupo de día ──
        tbody.innerHTML = _dayOrder.map((dk) => {
            const dg = _dayGroups[dk];
            const groupId = `dayg_${dk.replace(/-/g, '')}`;
            const dayMs = dg.ms;
            const diaStr = dayMs ? DIAS[new Date(dayMs).getDay()] : '—';
            const dl = dayMs ? new Date(dayMs).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : dk;

            const daySepRow = `<tr style="background:rgba(255,255,255,0.022);border-top:2px solid rgba(255,255,255,0.1);"><td colspan="${totalCols}" style="padding:5px 14px 4px;font-size:0.65rem;text-transform:uppercase;letter-spacing:1px;color:rgba(255,255,255,0.32);font-weight:700;">${dl}</td></tr>`;

            // Fila resumen ingresos
            const ingCells = methodKeys.map((k) => {
                const v = dg.ingM[k] || 0;
                return v === 0 ? '<td style="color:var(--admin-muted);">—</td>'
                    : `<td style="color:#6ee7b7;font-weight:600;">+${formatMoney(v)}</td>`;
            }).join('');
            // Fila resumen egresos
            const gasCells = methodKeys.map((k) => {
                const v = dg.gasM[k] || 0;
                return v === 0 ? '<td style="color:var(--admin-muted);">—</td>'
                    : `<td style="color:#fca5a5;font-weight:600;">−${formatMoney(v)}</td>`;
            }).join('');

            const netColor = dg.net >= 0 ? 'var(--admin-accent,#ff9540)' : '#fca5a5';
            const toggleBtn = `<button class="toggle-day-detail" data-group="${groupId}"
                style="font-size:0.72rem;padding:3px 10px;background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.5);border:1px solid rgba(255,255,255,0.12);border-radius:6px;cursor:pointer;white-space:nowrap;">
                ▶ Detalle
            </button>`;

            const summaryRows = `
            <tr style="border-top:1px solid rgba(255,255,255,0.06);">
                <td class="col-left" style="font-weight:700;vertical-align:middle;" rowspan="2">${escapeHtml(diaStr)}</td>
                <td class="col-left" style="vertical-align:middle;" rowspan="2">
                    <span style="font-size:0.7rem;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:0.5px;">Resumen del día</span>
                </td>
                ${ingCells}
                <td style="color:var(--admin-muted);">—</td>
                <td style="color:#6ee7b7;font-weight:700;">${dg.ingT > 0 ? '+' + formatMoney(dg.ingT) : '—'}</td>
                <td style="text-align:center;vertical-align:middle;" rowspan="2">${toggleBtn}</td>
            </tr>
            <tr style="background:rgba(252,165,165,0.04);border-bottom:2px solid rgba(255,255,255,0.08);">
                ${gasCells}
                <td style="color:${dg.gasT > 0 ? '#fca5a5' : 'var(--admin-muted)'};font-weight:${dg.gasT > 0 ? '600' : '400'};">${dg.gasT > 0 ? '−' + formatMoney(dg.gasT) : '—'}</td>
                <td style="color:${netColor};font-weight:700;">${dg.net < 0 ? '−' : ''}${formatMoney(Math.abs(dg.net))}</td>
            </tr>`;

            // ── Ticket de detalle (oculto) ──
            const ticketCards = dg.entries.map((entry) => {
                if (entry._tipo === 'cierre') {
                    const c   = entry;
                    const hora = new Date(entry._ms).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
                    const iM  = c.ingresosMethod || c.methodTotals || {};
                    const gM  = c.gastosMethod || {};
                    const iT  = Number(c.ingresosTotal ?? c.grandTotal ?? 0);
                    const gT  = Number(c.gastosTotal || 0);
                    const net = Number(c.grandTotal ?? iT - gT);
                    const netC = net >= 0 ? '#ff9540' : '#fca5a5';
                    const ingLines = methods.filter((m) => Number(iM[m.id] || 0) > 0)
                        .map((m) => `<div class="ht-line"><span>${m.icon} ${escapeHtml(m.label)}</span><span class="ht-ing">${formatMoney(Number(iM[m.id]))}</span></div>`).join('');
                    const egrLines = methods.filter((m) => Number(gM[m.id] || 0) > 0)
                        .map((m) => `<div class="ht-line"><span>${m.icon} ${escapeHtml(m.label)}</span><span class="ht-egr">−${formatMoney(Number(gM[m.id]))}</span></div>`).join('');
                    const cid = escapeHtml(c.id);
                    return `<div class="ht-card">
                        <div class="ht-card-hdr">🧾 Cierre de caja · ${hora}
                            <button class="btn-ver-cierre" data-cierre-id="${cid}" style="float:right;font-size:0.68rem;padding:2px 8px;background:rgba(255,255,255,0.08);color:#e2d9f3;border:1px solid rgba(255,255,255,0.14);border-radius:5px;cursor:pointer;">👁 Ver</button>
                        </div>
                        <div class="ht-cols">
                            <div class="ht-col">
                                <div class="ht-col-title">📥 Ingresos</div>
                                ${ingLines || '<div class="ht-line ht-muted">Sin ingresos</div>'}
                                <div class="ht-line ht-sep"><span>Total ingresos</span><span class="ht-ing">${formatMoney(iT)}</span></div>
                            </div>
                            ${gT > 0 ? `<div class="ht-col">
                                <div class="ht-col-title">📤 Egresos del cierre</div>
                                ${egrLines || '<div class="ht-line ht-muted">—</div>'}
                                <div class="ht-line ht-sep"><span>Total egresos</span><span class="ht-egr">−${formatMoney(gT)}</span></div>
                            </div>` : ''}
                        </div>
                        <div class="ht-net"><span>💰 Total neto</span><span style="color:${netC};">${net < 0 ? '−' : ''}${formatMoney(Math.abs(net))}</span></div>
                    </div>`;
                }
                if (entry._tipo === 'gastos_dia') {
                    const items = [...entry._items].sort((a, b) => (b._ts || 0) - (a._ts || 0));
                    const gastoLines = items.map((item) => {
                        const catObj = getCategoriasGastos().find((cat) => cat.id === item.categoria);
                        const parts  = [
                            catObj ? (catObj.icon + ' ' + catObj.nombre) : '💸',
                            item.subcategoria || '', item.proveedor || '', item.descripcion || '',
                        ].map((s) => s.trim()).filter(Boolean);
                        const desc = parts.map(escapeHtml).join(' · ');
                        const hora = item._ts ? new Date(item._ts).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : '';
                        const mObj = methods.find((m) => m.id === item.paymentMethod);
                        return `<div class="ht-line">
                            <span>${desc}${hora ? ` <span class="ht-muted">· ${hora}</span>` : ''}${mObj ? ` <span class="ht-muted">${mObj.icon}</span>` : ''}</span>
                            <span class="ht-egr">−${formatMoney(Number(item.monto || 0))}</span>
                        </div>`;
                    }).join('');
                    return `<div class="ht-card ht-card-egr">
                        <div class="ht-card-hdr">💸 Gastos externos del día</div>
                        ${gastoLines}
                        <div class="ht-line ht-sep"><span>Total gastos externos</span><span class="ht-egr">−${formatMoney(entry._totalAmt)}</span></div>
                    </div>`;
                }
                if (entry._tipo === 'traslado') {
                    const t    = entry._data;
                    const hora = entry._ms ? new Date(entry._ms).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : '';
                    const fM   = methods.find((m) => m.id === t.methodFrom);
                    const tM   = methods.find((m) => m.id === t.methodTo);
                    const fromLbl = fM ? `${fM.icon} ${escapeHtml(fM.label)}` : escapeHtml(t.methodFrom || '?');
                    const toLbl   = tM ? `${tM.icon} ${escapeHtml(tM.label)}` : escapeHtml(t.methodTo   || '?');
                    const amt  = Number(t.monto || 0);
                    const tid  = escapeHtml(t.id || '');
                    return `<div class="ht-card ht-card-tras">
                        <div class="ht-card-hdr">🔄 Traslado${hora ? ' · ' + hora : ''}
                            <span style="float:right;white-space:nowrap;">
                                <button type="button" class="mini-btn" data-traslado-edit="${tid}" style="font-size:0.65rem;padding:1px 6px;margin-right:2px;">✏️</button>
                                <button type="button" class="mini-btn remove" data-traslado-del="${tid}" style="font-size:0.65rem;padding:1px 6px;">🗑️</button>
                            </span>
                        </div>
                        <div class="ht-line">
                            <span>${fromLbl} <span class="ht-muted">→</span> ${toLbl}</span>
                            <span class="ht-tras">${formatMoney(amt)}</span>
                        </div>
                    </div>`;
                }
                return '';
            }).join('');

            const detailRow = `<tr class="day-detail-row" data-day-parent="${groupId}" style="display:none;">
                <td colspan="${totalCols}" style="padding:0 10px 14px;">
                    <div class="hist-ticket">${ticketCards}</div>
                </td>
            </tr>`;

            return daySepRow + summaryRows + detailRow;
        }).join('');

        // Toggle ticket de detalle del día
        if (!tbody.dataset.dayToggle) {
            tbody.dataset.dayToggle = '1';
            tbody.addEventListener('click', (e) => {
                const btn = e.target.closest('.toggle-day-detail');
                if (!btn) return;
                const gid    = btn.dataset.group;
                const isOpen = btn.dataset.open === '1';
                const row    = tbody.querySelector(`.day-detail-row[data-day-parent="${gid}"]`);
                if (row) row.style.display = isOpen ? 'none' : '';
                btn.dataset.open = isOpen ? '0' : '1';
                btn.innerHTML    = isOpen ? '▶ Detalle' : '▼ Ocultar';
                btn.style.color  = isOpen ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.85)';
            });
        }

        // Listeners delegados para editar/eliminar traslados
        if (!tbody.dataset.trasladoListener) {
            tbody.dataset.trasladoListener = '1';
            tbody.addEventListener('click', async (e) => {
                const delBtn = e.target.closest('[data-traslado-del]');
                if (delBtn) {
                    if (!confirm('¿Eliminar este traslado?')) return;
                    try {
                        await firebaseDb.collection(GASTOS_CAJA_COLLECTION).doc(delBtn.dataset.trasladoDel).delete();
                        showNotice('Traslado eliminado.', 'ok');
                        await renderLibroCierres();
                    } catch (_) { showNotice('Error al eliminar traslado.', 'error'); }
                    return;
                }
                const editBtn = e.target.closest('[data-traslado-edit]');
                if (editBtn) {
                    const tid = editBtn.dataset.trasladoEdit;
                    try {
                        const snap = await firebaseDb.collection(GASTOS_CAJA_COLLECTION).doc(tid).get();
                        if (snap.exists) openTrasladoModal(snap.data(), tid);
                    } catch (_) { showNotice('Error al cargar traslado.', 'error'); }
                }
            });
        }

        // Fila de totales
        if (footEl) {
            const footMethodCells = methodKeys.map((k) => {
                const v = sumTotals[k];
                if (v === 0) return '<td style="color:var(--admin-muted,#6b7280);">$0</td>';
                const color = v > 0 ? '#6ee7b7' : '#fca5a5';
                return `<td style="color:${color};"><strong>${v < 0 ? '−' : ''}${formatMoney(Math.abs(v))}</strong></td>`;
            }).join('');
            const gtTotalColor = grandSumTotal >= 0 ? 'var(--admin-accent,#ff9540)' : '#fca5a5';
            footEl.innerHTML = `<tr>
                <td class="col-left" colspan="2" style="font-weight:700;font-size:0.8rem;text-transform:uppercase;letter-spacing:0.5px;">TOTALES</td>
                ${footMethodCells}
                <td style="color:${grandSumEgresos > 0 ? '#fca5a5' : 'var(--admin-muted,#6b7280)'};">${grandSumEgresos > 0 ? `<strong>−${formatMoney(grandSumEgresos)}</strong>` : '$0'}</td>
                <td style="color:${gtTotalColor};"><strong>${grandSumTotal < 0 ? '−' : ''}${formatMoney(Math.abs(grandSumTotal))}</strong></td>
                <td></td>
            </tr>`;
        }

        // Publicar sumTotals al scope de módulo para validación de traslados
        _cierresSumTotals = { ...sumTotals };

        // Resumen de totales por columna en la cabecera
        const kpiEl = document.getElementById('cierresKpiGrid');
        if (kpiEl) {
            const chipMethod = methodKeys.map((k) => {
                const m = methods.find((x) => x.id === k) || { label: k, icon: '' };
                const v = sumTotals[k] || 0;
                const color = v > 0 ? '#6ee7b7' : v < 0 ? '#fca5a5' : 'rgba(255,255,255,0.35)';
                return `<div style="display:flex;flex-direction:column;gap:2px;padding:8px 14px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:10px;min-width:110px;">
                    <span style="font-size:0.68rem;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:0.8px;">${m.icon ? m.icon + ' ' : ''}${m.label}</span>
                    <span style="font-size:1rem;font-weight:700;color:${color};">${v < 0 ? '−' : ''}${v === 0 ? '$0' : formatMoney(Math.abs(v))}</span>
                </div>`;
            }).join('');

            const chipIng = grandSumIngresos > 0 ? `<div style="display:flex;flex-direction:column;gap:2px;padding:8px 14px;background:rgba(110,231,183,0.06);border:1px solid rgba(110,231,183,0.18);border-radius:10px;min-width:110px;">
                <span style="font-size:0.68rem;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:0.8px;">📥 Ingresos</span>
                <span style="font-size:1rem;font-weight:700;color:#6ee7b7;">${formatMoney(grandSumIngresos)}</span>
            </div>` : '';

            const egColor = grandSumEgresos > 0 ? '#fca5a5' : 'rgba(255,255,255,0.35)';
            const chipEgr = grandSumEgresos > 0 ? `<div style="display:flex;flex-direction:column;gap:2px;padding:8px 14px;background:rgba(252,165,165,0.06);border:1px solid rgba(252,165,165,0.18);border-radius:10px;min-width:110px;">
                <span style="font-size:0.68rem;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:0.8px;">📤 Egresos</span>
                <span style="font-size:1rem;font-weight:700;color:${egColor};">−${formatMoney(grandSumEgresos)}</span>
            </div>` : '';

            const ntColor = grandSumTotal >= 0 ? '#ff9540' : '#fca5a5';
            const chipNet = `<div style="display:flex;flex-direction:column;gap:2px;padding:8px 14px;background:rgba(255,149,64,0.07);border:1px solid rgba(255,149,64,0.22);border-radius:10px;min-width:110px;">
                <span style="font-size:0.68rem;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:0.8px;">💰 Total Neto</span>
                <span style="font-size:1rem;font-weight:700;color:${ntColor};">${grandSumTotal < 0 ? '−' : ''}${formatMoney(Math.abs(grandSumTotal))}</span>
            </div>`;

            kpiEl.innerHTML = `<div style="grid-column:1/-1;display:flex;flex-direction:row;flex-wrap:wrap;gap:8px;padding:10px 2px 12px;">${chipMethod}${chipIng}${chipEgr}${chipNet}</div>`;
        }
    } catch (err) {
        tbody.innerHTML = `<tr><td class="caja-empty" colspan="${totalCols}">Error al cargar: ${escapeHtml(err.message || 'error')}</td></tr>`;
    }
}

document.getElementById('refreshLibroCierresBtn')?.addEventListener('click', renderLibroCierres);
document.getElementById('cierresDateFrom')?.addEventListener('change', _updateCierreDrp);
document.getElementById('cierresDateTo')?.addEventListener('change', _updateCierreDrp);

// Toggle panel del date-range picker
document.getElementById('cierreDrpBtn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    const panel = document.getElementById('cierreDrpPanel');
    if (panel) panel.style.display = panel.style.display === 'none' ? '' : 'none';
});
document.addEventListener('click', (e) => {
    if (!e.target.closest('#cierreDrpWrap')) {
        const panel = document.getElementById('cierreDrpPanel');
        if (panel) panel.style.display = 'none';
    }
});
document.getElementById('cierreDrpClear')?.addEventListener('click', (e) => {
    e.stopPropagation();
    const f = document.getElementById('cierresDateFrom');
    const t = document.getElementById('cierresDateTo');
    if (f) f.value = '';
    if (t) t.value = '';
    _updateCierreDrp();
});
document.getElementById('gastosHistorialBtn')?.addEventListener('click', () => {
    _gastoFromHistorial = true;
    openGastoModal();
});

// ── Libro Contable ────────────────────────────────────────────────────────────
let _lcActivePeriod = 'diario';

function renderLibroContable() {
    _renderLcTable();
}

function _renderLcTable() {
    const lcHead = document.getElementById('lcHead');
    const lcBody = document.getElementById('lcBody');
    const lcFoot = document.getElementById('lcFoot');
    if (!lcBody) return;

    const getMs  = (c) => c.closedAt?.toMillis ? c.closedAt.toMillis() : Number(c.closedAt || 0);
    const getIng = (c) => Number(c.ingresosTotal ?? 0);
    const getEgr = (c) => Number(c.gastosTotal   ?? 0);

    const DIAS = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
    const dayOf = (ms) => {
        const d = new Date(ms);
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    };

    // Agrupar por día de calendario
    const dayGroups = {};
    const dayOrder  = [];
    const addDay = (dk, ms) => {
        if (!dayGroups[dk]) { dayGroups[dk] = { dk, ms, cierres: [], extGastos: [], ingT: 0, gasT: 0, netT: 0 }; dayOrder.push(dk); }
        if (ms > dayGroups[dk].ms) dayGroups[dk].ms = ms;
        return dayGroups[dk];
    };

    _cierresCajaState.forEach((c) => {
        const ms = getMs(c); if (!ms) return;
        const dg = addDay(dayOf(ms), ms);
        dg.cierres.push(c);
        dg.ingT += getIng(c);
        dg.gasT += getEgr(c);
        dg.netT += Number(c.grandTotal ?? getIng(c) - getEgr(c));
    });

    _gastosExternosState.forEach((g) => {
        const ms = g.registradoAt?.toMillis ? g.registradoAt.toMillis() : Number(g.registradoAt || 0);
        if (!ms) return;
        const dg = addDay(dayOf(ms), ms);
        dg.extGastos.push({ ...g, _ms: ms });
        const amt = Number(g.monto || 0);
        dg.gasT += amt;
        dg.netT -= amt;
    });

    dayOrder.sort((a, b) => dayGroups[b].ms - dayGroups[a].ms);

    const totalIng = dayOrder.reduce((s, dk) => s + dayGroups[dk].ingT, 0);
    const totalEgr = dayOrder.reduce((s, dk) => s + dayGroups[dk].gasT, 0);
    const totalNet = totalIng - totalEgr;

    if (lcHead) lcHead.innerHTML = `<tr>
        <th class="col-left">Fecha</th>
        <th class="col-entrada">Ingresos</th>
        <th class="col-salida">Egresos</th>
        <th>Total Neto</th>
        <th style="width:60px;text-align:center;"></th>
    </tr>`;

    if (!dayOrder.length) {
        lcBody.innerHTML = `<tr><td class="caja-empty" colspan="5">Sin registros.</td></tr>`;
        if (lcFoot) lcFoot.innerHTML = '';
        return;
    }

    lcBody.innerHTML = dayOrder.map((dk) => {
        const dg = dayGroups[dk];
        const d  = new Date(dg.ms);
        const diaStr = DIAS[d.getDay()];
        const fecha  = d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const gid    = `lcday_${dk.replace(/-/g, '')}`;
        const netC   = dg.netT >= 0 ? '#ff9540' : '#fca5a5';

        const mainRow = `<tr style="border-top:1px solid rgba(255,255,255,0.06);">
            <td class="col-left" style="font-weight:700;white-space:nowrap;">
                <span style="font-size:0.7rem;color:var(--admin-muted);display:block;text-transform:uppercase;letter-spacing:0.04em;">${diaStr}</span>
                ${fecha}
            </td>
            <td class="caja-cell-entrada">${dg.ingT > 0 ? formatMoney(dg.ingT) : '<span style="color:var(--admin-muted);">—</span>'}</td>
            <td>${dg.gasT > 0 ? `<span class="caja-cell-salida">−${formatMoney(dg.gasT)}</span>` : '<span style="color:var(--admin-muted);">—</span>'}</td>
            <td style="color:${netC};font-weight:800;">${dg.netT < 0 ? '−' : ''}${formatMoney(Math.abs(dg.netT))}</td>
            <td style="text-align:center;">
                <button class="lc-toggle-detail" data-gid="${gid}"
                    style="font-size:0.72rem;padding:3px 10px;background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.5);border:1px solid rgba(255,255,255,0.12);border-radius:6px;cursor:pointer;white-space:nowrap;">
                    ▶ Ver
                </button>
            </td>
        </tr>`;

        const detailRows = [
            ...dg.cierres.map((c) => {
                const cMs  = getMs(c);
                const hora = new Date(cMs).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
                const ing  = getIng(c), egr = getEgr(c), net = Number(c.grandTotal ?? ing - egr);
                const nc   = net >= 0 ? '#ff9540' : '#fca5a5';
                return `<tr class="lc-det-row" data-gid="${gid}" style="display:none;background:rgba(255,255,255,0.015);font-size:0.82rem;">
                    <td class="col-left" style="padding-left:24px;color:rgba(255,255,255,0.55);">
                        <span style="font-size:0.68rem;color:var(--admin-muted);display:block;">Cierre de caja · ${hora}</span>
                    </td>
                    <td style="color:#6ee7b7;">${ing > 0 ? formatMoney(ing) : '—'}</td>
                    <td style="color:#fca5a5;">${egr > 0 ? '−'+formatMoney(egr) : '—'}</td>
                    <td style="color:${nc};font-weight:700;">${net < 0 ? '−' : ''}${formatMoney(Math.abs(net))}</td>
                    <td></td>
                </tr>`;
            }),
            ...dg.extGastos.map((g) => {
                const hora = new Date(g._ms).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
                const amt  = Number(g.monto || 0);
                const cat  = getCategoriasGastos().find((c) => c.id === g.categoria);
                const parts = [
                    cat ? (cat.icon + ' ' + cat.nombre) : '',
                    g.subcategoria || '',
                    g.proveedor    || '',
                    g.descripcion  || '',
                ].map((s) => s.trim()).filter(Boolean);
                const desc = parts.length ? parts.map(escapeHtml).join(' · ') : 'Sin descripción';
                return `<tr class="lc-det-row" data-gid="${gid}" style="display:none;background:rgba(252,165,165,0.04);font-size:0.82rem;">
                    <td class="col-left" style="padding-left:24px;color:rgba(255,255,255,0.55);">
                        <span style="font-size:0.68rem;color:#fca5a5;display:block;">Gasto externo · ${hora}</span>
                        ${desc}
                    </td>
                    <td style="color:var(--admin-muted);">—</td>
                    <td style="color:#fca5a5;">−${formatMoney(amt)}</td>
                    <td style="color:#fca5a5;font-weight:700;">−${formatMoney(amt)}</td>
                    <td></td>
                </tr>`;
            }),
        ].join('');

        return mainRow + detailRows;
    }).join('');

    if (lcFoot) lcFoot.innerHTML = `<tr>
        <td class="col-left foot-label">TOTAL HISTÓRICO</td>
        <td class="foot-entrada">${formatMoney(totalIng)}</td>
        <td class="foot-salida">${totalEgr > 0 ? `−${formatMoney(totalEgr)}` : '$0'}</td>
        <td class="foot-total">${totalNet < 0 ? '−' : ''}${formatMoney(Math.abs(totalNet))}</td>
        <td></td>
    </tr>`;
}

// Toggle detalle por día en libro contable
document.addEventListener('click', (e) => {
    const btn = e.target.closest('.lc-toggle-detail');
    if (!btn) return;
    const gid  = btn.dataset.gid;
    const rows = document.querySelectorAll(`.lc-det-row[data-gid="${gid}"]`);
    const open = btn.textContent.trim().startsWith('▶');
    rows.forEach((r) => { r.style.display = open ? '' : 'none'; });
    btn.textContent = open ? '▼ Ocultar' : '▶ Ver';
});

document.getElementById('refreshLibroContableBtn')?.addEventListener('click', async () => {
    await loadCierresCaja();
    renderLibroContable();
    const wrap = document.getElementById('lcMovimientosWrap');
    if (wrap && wrap.style.display !== 'none') _renderLcTable();
});

document.getElementById('libroCierresList')?.addEventListener('click', (e) => {
    const verBtn = e.target.closest('.btn-ver-cierre');
    if (verBtn) {
        const cid = verBtn.dataset.cierreId;
        const c = _cierresCajaState.find((x) => x.id === cid);
        if (c) _openCierreDetalleModal(c);
        return;
    }
    const gastoBtn = e.target.closest('.btn-gasto-cierre');
    if (gastoBtn) {
        const cid = gastoBtn.dataset.cierreId;
        const c = _cierresCajaState.find((x) => x.id === cid);
        if (c) openCierreGastoModal(c);
    }
});

function _openCierreDetalleModal(c) {
    const existing = document.getElementById('cierreDetalleModal');
    if (existing) existing.remove();

    const tsMs = c.closedAt?.toMillis ? c.closedAt.toMillis() : Number(c.closedAt || 0);
    const d = tsMs ? new Date(tsMs) : new Date();
    const fechaLarga = d.toLocaleDateString('es-CO', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
    const horaApertura = c.aperturaAt ? new Date(Number(c.aperturaAt)).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : null;
    const horaCierre  = d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

    const methods       = getPaymentMethods();
    const ingresosMethod = c.ingresosMethod || c.methodTotals || {};
    const gastosMethod   = c.gastosMethod   || {};
    const gastosDetalle  = c.gastosDetalle  || [];
    const ingresosTotal  = Number(c.ingresosTotal  ?? c.grandTotal ?? 0);
    const gastosTotal    = Number(c.gastosTotal    || 0);
    const grandTotal     = Number(c.grandTotal     || 0);
    const cobradas       = Number(c.transactionCount || 0) - Number(c.voidedCount || 0);

    // Sección INGRESOS
    const ingRows = methods
        .filter((m) => Number(ingresosMethod[m.id] || 0) > 0)
        .map((m) => {
            const v = Number(ingresosMethod[m.id]);
            return `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:rgba(110,231,183,0.06);border-radius:8px;margin-bottom:4px;">
                <span style="font-size:0.85rem;color:rgba(255,255,255,0.7);">${m.icon ? m.icon + ' ' : ''}${escapeHtml(m.label)}</span>
                <span style="font-size:0.9rem;font-weight:700;color:#6ee7b7;">+${formatMoney(v)}</span>
            </div>`;
        }).join('') || `<div style="font-size:0.8rem;color:rgba(255,255,255,0.35);padding:6px 0;">Sin movimientos</div>`;

    const ingTotalRow = `<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:rgba(110,231,183,0.1);border-radius:8px;border:1px solid rgba(110,231,183,0.2);margin-top:6px;">
        <span style="font-size:0.85rem;font-weight:700;color:rgba(255,255,255,0.85);">TOTAL INGRESOS</span>
        <span style="font-size:1rem;font-weight:700;color:#6ee7b7;">+${formatMoney(ingresosTotal)}</span>
    </div>`;

    // Sección EGRESOS
    const gasRows = gastosDetalle.length
        ? gastosDetalle.map((g) => {
            const mG = methods.find((m) => m.id === g.paymentMethod) || { icon: '', label: g.paymentMethod || '' };
            const catObj = getCategoriasGastos().find((cat) => cat.id === g.categoria);
            const catIcon = catObj ? catObj.icon : '💸';
            const catLabel = (catObj ? catObj.nombre : (g.categoria || 'Gasto')) + (g.subcategoria ? ' · ' + g.subcategoria : '');
            const desc = [g.proveedor, g.descripcion].filter(Boolean).join(' · ');
            return `<div style="display:flex;justify-content:space-between;align-items:flex-start;padding:8px 12px;background:rgba(252,165,165,0.06);border-radius:8px;margin-bottom:4px;gap:8px;">
                <div style="flex:1;min-width:0;">
                    <div style="font-size:0.82rem;font-weight:600;color:#fca5a5;">${catIcon} ${escapeHtml(catLabel)}</div>
                    ${desc ? `<div style="font-size:0.75rem;color:rgba(255,255,255,0.45);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(desc)}</div>` : ''}
                    <div style="font-size:0.72rem;color:rgba(255,255,255,0.3);margin-top:1px;">${mG.icon ? mG.icon + ' ' : ''}${escapeHtml(mG.label)}</div>
                </div>
                <span style="font-size:0.9rem;font-weight:700;color:#fca5a5;white-space:nowrap;">−${formatMoney(Number(g.monto || 0))}</span>
            </div>`;
        }).join('')
        : `<div style="font-size:0.8rem;color:rgba(255,255,255,0.35);padding:6px 0;">Sin egresos</div>`;

    const gasTotalRow = gastosTotal > 0 ? `<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:rgba(252,165,165,0.1);border-radius:8px;border:1px solid rgba(252,165,165,0.2);margin-top:6px;">
        <span style="font-size:0.85rem;font-weight:700;color:rgba(255,255,255,0.85);">TOTAL EGRESOS</span>
        <span style="font-size:1rem;font-weight:700;color:#fca5a5;">−${formatMoney(gastosTotal)}</span>
    </div>` : '';

    // Sección ARQUEO
    const allMethodIds = [...new Set([...Object.keys(ingresosMethod), ...Object.keys(gastosMethod)])].filter((k) => k !== 'split');
    const arqueoRows = allMethodIds.map((k) => {
        const ing = Number(ingresosMethod[k] || 0);
        const gas = Number(gastosMethod[k]   || 0);
        const net = ing - gas;
        if (ing === 0 && gas === 0) return '';
        const m = methods.find((x) => x.id === k) || { icon: '', label: k };
        const netColor = net > 0 ? '#6ee7b7' : net < 0 ? '#fca5a5' : 'rgba(255,255,255,0.4)';
        return `<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 12px;border-radius:8px;margin-bottom:3px;background:rgba(255,255,255,0.03);">
            <span style="font-size:0.82rem;color:rgba(255,255,255,0.6);">${m.icon ? m.icon + ' ' : ''}${escapeHtml(m.label)}</span>
            <span style="font-size:0.85rem;font-weight:700;color:${netColor};">${net < 0 ? '−' : ''}${net === 0 ? '$0' : formatMoney(Math.abs(net))}</span>
        </div>`;
    }).filter(Boolean).join('');

    const netColor = grandTotal >= 0 ? '#ff9540' : '#fca5a5';

    const overlay = document.createElement('div');
    overlay.id = 'cierreDetalleModal';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:15000;background:rgba(0,0,0,0.78);display:flex;align-items:center;justify-content:center;padding:1rem;';
    overlay.innerHTML = `
    <div style="background:#14172a;border:1.5px solid rgba(255,255,255,0.1);border-radius:20px;width:100%;max-width:480px;max-height:90vh;display:flex;flex-direction:column;box-shadow:0 24px 80px rgba(0,0,0,0.7);overflow:hidden;">
        <!-- Header -->
        <div style="padding:18px 20px 14px;border-bottom:1px solid rgba(255,255,255,0.08);display:flex;justify-content:space-between;align-items:flex-start;flex-shrink:0;">
            <div>
                <div style="font-size:0.65rem;text-transform:uppercase;letter-spacing:1.2px;color:rgba(255,255,255,0.35);margin-bottom:3px;">Cierre de Caja</div>
                <div style="font-size:1rem;font-weight:700;color:#fff;text-transform:capitalize;">${escapeHtml(fechaLarga)}</div>
                <div style="display:flex;gap:16px;margin-top:6px;flex-wrap:wrap;">
                    ${horaApertura ? `<span style="font-size:0.75rem;color:rgba(255,255,255,0.4);">Apertura: <strong style="color:rgba(255,255,255,0.6);">${horaApertura}</strong></span>` : ''}
                    <span style="font-size:0.75rem;color:rgba(255,255,255,0.4);">Cierre: <strong style="color:rgba(255,255,255,0.6);">${horaCierre}</strong></span>
                    <span style="font-size:0.75rem;color:rgba(255,255,255,0.4);">Transacciones: <strong style="color:rgba(255,255,255,0.6);">${cobradas}</strong></span>
                    ${Number(c.fondoInicial) > 0 ? `<span style="font-size:0.75rem;color:rgba(255,255,255,0.4);">Fondo inicial: <strong style="color:#f3c56a;">${formatMoney(Number(c.fondoInicial))}</strong></span>` : ''}
                    ${c.aperturaBy ? `<span style="font-size:0.75rem;color:rgba(255,255,255,0.4);">Cajero: <strong style="color:rgba(255,255,255,0.6);">${escapeHtml(String(c.aperturaBy))}</strong></span>` : ''}
                </div>
            </div>
            <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;">
                <button id="_cierreDetalleCerrar" style="background:none;border:none;color:rgba(255,255,255,0.4);font-size:1.5rem;cursor:pointer;line-height:1;" aria-label="Cerrar">×</button>
                <button id="_cierreDetallePrint" style="background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.14);border-radius:8px;color:rgba(255,255,255,0.65);font-size:0.72rem;font-weight:600;cursor:pointer;padding:4px 10px;white-space:nowrap;">🖨️ Imprimir</button>
            </div>
        </div>
        <!-- Scrollable body -->
        <div style="overflow-y:auto;flex:1;padding:16px 20px 20px;display:flex;flex-direction:column;gap:16px;">
            <!-- Ingresos -->
            <div>
                <div style="font-size:0.68rem;text-transform:uppercase;letter-spacing:1px;color:#6ee7b7;font-weight:700;margin-bottom:8px;">📥 Ingresos por método</div>
                ${ingRows}
                ${ingTotalRow}
            </div>
            <!-- Egresos -->
            <div>
                <div style="font-size:0.68rem;text-transform:uppercase;letter-spacing:1px;color:#fca5a5;font-weight:700;margin-bottom:8px;">📤 Egresos / Gastos</div>
                ${gasRows}
                ${gasTotalRow}
            </div>
            <!-- Arqueo -->
            <div>
                <div style="font-size:0.68rem;text-transform:uppercase;letter-spacing:1px;color:rgba(255,255,255,0.5);font-weight:700;margin-bottom:8px;">🗂 Arqueo de caja (neto por método)</div>
                ${arqueoRows || `<div style="font-size:0.8rem;color:rgba(255,255,255,0.35);padding:6px 0;">Sin movimientos</div>`}
            </div>
        </div>
        <!-- Footer total neto -->
        <div style="padding:14px 20px;border-top:1px solid rgba(255,255,255,0.08);display:flex;justify-content:space-between;align-items:center;flex-shrink:0;background:rgba(255,149,64,0.05);">
            <span style="font-size:0.9rem;font-weight:700;color:rgba(255,255,255,0.8);text-transform:uppercase;letter-spacing:0.5px;">💰 Saldo Neto Caja</span>
            <span style="font-size:1.25rem;font-weight:800;color:${netColor};">${grandTotal < 0 ? '−' : ''}${formatMoney(Math.abs(grandTotal))}</span>
        </div>
    </div>`;

    document.body.appendChild(overlay);
    document.getElementById('_cierreDetalleCerrar')?.addEventListener('click', () => overlay.remove());
    _bindOverlayClose(overlay, () => overlay.remove());

    document.getElementById('_cierreDetallePrint')?.addEventListener('click', async () => {
        const dateStr    = d.toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });
        const timeStr    = d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const ticketHtml = _buildCierreTicketHtml(c, dateStr, timeStr);
        _cierrePrintData = { c, dateStr, timeStr };
        await _printCierreTicket(ticketHtml);
    });
}

function openCierreGastoModal(cierre) {
    const existing = document.getElementById('cierreGastoModal');
    if (existing) existing.remove();

    const methods = getEnabledPaymentMethods();
    const tsMs = cierre.closedAt?.toMillis ? cierre.closedAt.toMillis() : Number(cierre.closedAt || 0);
    const fechaStr = tsMs ? new Date(tsMs).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' }) : cierre.date || '';

    // Saldos disponibles por método (ingresos netos ya descontados gastos anteriores)
    const methodTotals = cierre.methodTotals || {};
    const saldosHtml = methods
        .map((m) => {
            const v = Number(methodTotals[m.id] || 0);
            if (v <= 0) return '';
            return `<div style="display:flex;justify-content:space-between;font-size:0.82rem;padding:3px 0;">
                <span style="color:rgba(200,200,220,0.7);">${m.icon} ${escapeHtml(m.label)}</span>
                <span style="color:#6ee7b7;font-weight:700;">${formatMoney(v)}</span>
            </div>`;
        }).filter(Boolean).join('') || `<div style="font-size:0.8rem;color:rgba(200,200,220,0.5);">Sin saldo disponible</div>`;

    const methodOptions = methods.map((m) =>
        `<option value="${escapeHtml(m.id)}">${m.icon} ${escapeHtml(m.label)}</option>`
    ).join('');

    const overlay = document.createElement('div');
    overlay.id = 'cierreGastoModal';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:12000;display:flex;align-items:center;justify-content:center;background:rgba(10,6,3,0.88);padding:16px;';

    overlay.innerHTML = `
        <div style="background:#1c1410;border:1.5px solid rgba(255,255,255,0.12);border-radius:18px;padding:22px 20px 18px;width:100%;max-width:380px;display:flex;flex-direction:column;gap:14px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div>
                    <div style="font-weight:700;font-size:1rem;color:#fff;">💸 Registrar Gasto</div>
                    <div style="font-size:0.75rem;color:rgba(200,180,150,0.6);margin-top:2px;">Cierre · ${escapeHtml(fechaStr)}</div>
                </div>
                <button id="cgmClose" style="background:none;border:none;color:rgba(255,255,255,0.4);font-size:1.6rem;cursor:pointer;line-height:1;padding:0 4px;">×</button>
            </div>

            <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:10px 12px;">
                <div style="font-size:0.68rem;color:rgba(200,200,220,0.45);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px;">Saldos disponibles</div>
                ${saldosHtml}
            </div>

            <div style="display:flex;flex-direction:column;gap:10px;">
                <div>
                    <label style="font-size:0.72rem;color:rgba(200,200,220,0.55);text-transform:uppercase;letter-spacing:.4px;display:block;margin-bottom:4px;">Descripción</label>
                    <input id="cgmDesc" type="text" placeholder="Ej: Mercado, nómina, servicios..." maxlength="120"
                        style="width:100%;box-sizing:border-box;background:rgba(0,0,0,0.35);color:#eef4ff;border:1px solid rgba(255,255,255,0.15);border-radius:8px;padding:8px 10px;font-size:0.85rem;">
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                    <div>
                        <label style="font-size:0.72rem;color:rgba(200,200,220,0.55);text-transform:uppercase;letter-spacing:.4px;display:block;margin-bottom:4px;">Monto</label>
                        <input id="cgmMonto" type="number" min="0" placeholder="0"
                            style="width:100%;box-sizing:border-box;background:rgba(0,0,0,0.35);color:#eef4ff;border:1px solid rgba(255,255,255,0.15);border-radius:8px;padding:8px 10px;font-size:0.85rem;">
                    </div>
                    <div>
                        <label style="font-size:0.72rem;color:rgba(200,200,220,0.55);text-transform:uppercase;letter-spacing:.4px;display:block;margin-bottom:4px;">Método</label>
                        <select id="cgmMethod"
                            style="width:100%;box-sizing:border-box;background:rgba(0,0,0,0.35);color:#eef4ff;border:1px solid rgba(255,255,255,0.15);border-radius:8px;padding:8px 10px;font-size:0.85rem;">
                            <option value="">— Método —</option>
                            ${methodOptions}
                        </select>
                    </div>
                </div>
            </div>

            <button id="cgmSave" style="width:100%;padding:12px;border-radius:10px;border:none;background:#e76f00;color:#fff;font-weight:700;font-size:0.95rem;cursor:pointer;transition:opacity .15s;">Registrar gasto</button>
        </div>`;

    document.body.appendChild(overlay);

    overlay.querySelector('#cgmClose').addEventListener('click', () => overlay.remove());
    _bindOverlayClose(overlay, () => overlay.remove());

    overlay.querySelector('#cgmSave').addEventListener('click', async () => {
        const desc   = overlay.querySelector('#cgmDesc').value.trim();
        const monto  = Number(overlay.querySelector('#cgmMonto').value) || 0;
        const method = overlay.querySelector('#cgmMethod').value;

        if (!desc)   { showNotice('Ingresa una descripción.', 'error'); return; }
        if (monto <= 0) { showNotice('El monto debe ser mayor a 0.', 'error'); return; }
        if (!method) { showNotice('Selecciona un método de pago.', 'error'); return; }

        const saveBtn = overlay.querySelector('#cgmSave');
        saveBtn.disabled = true;
        saveBtn.textContent = 'Guardando…';

        try {
            // Crear gasto en gastos_caja
            const gastoId = `gasto_cierre_${Date.now()}`;
            const gastoDoc = {
                id: gastoId,
                categoria: 'otros',
                subcategoria: 'Gasto de caja',
                proveedor: '',
                descripcion: desc,
                monto,
                paymentMethod: method,
                registradoAt: firestoreNow(),
                cierreId: cierre.id,
                cajaAperturaAt: cierre.cajaAperturaAt || 0
            };
            await firebaseDb.collection(GASTOS_CAJA_COLLECTION).doc(gastoId).set(gastoDoc);

            // Actualizar cierre en Firestore
            const nuevosGastosDetalle = [...(cierre.gastosDetalle || []), {
                descripcion: desc,
                monto,
                paymentMethod: method,
                registradoAt: Date.now()
            }];
            const nuevoGastosMethod = { ...(cierre.gastosMethod || {}) };
            nuevoGastosMethod[method] = (nuevoGastosMethod[method] || 0) + monto;
            const nuevoGastosTotal = (Number(cierre.gastosTotal) || 0) + monto;

            const nuevoMethodTotals = { ...(cierre.methodTotals || {}) };
            nuevoMethodTotals[method] = (nuevoMethodTotals[method] || 0) - monto;
            const nuevoGrandTotal = (Number(cierre.grandTotal) || 0) - monto;

            await firebaseDb.collection(CIERRES_CAJA_COLLECTION).doc(cierre.id).update({
                gastosDetalle: nuevosGastosDetalle,
                gastosMethod: nuevoGastosMethod,
                gastosTotal: nuevoGastosTotal,
                methodTotals: nuevoMethodTotals,
                grandTotal: nuevoGrandTotal
            });

            // Actualizar estado local
            cierre.gastosDetalle = nuevosGastosDetalle;
            cierre.gastosMethod  = nuevoGastosMethod;
            cierre.gastosTotal   = nuevoGastosTotal;
            cierre.methodTotals  = nuevoMethodTotals;
            cierre.grandTotal    = nuevoGrandTotal;

            overlay.remove();
            showNotice('Gasto registrado y saldo actualizado.', 'ok');
            renderLibroCierres();
        } catch (err) {
            showNotice(`Error: ${err.message || 'No se pudo guardar.'}`, 'error');
            saveBtn.disabled = false;
            saveBtn.textContent = 'Registrar gasto';
        }
    });
}

// ── Tickets (Informes) ────────────────────────────────────────────────────────
let _ticketsData = [];

function _ticketRowHtml(o) {
    const fecha = (() => {
        const ts = o.paidAt || o.createdAt;
        if (!ts) return '—';
        const d = typeof ts.toDate === 'function' ? ts.toDate() : new Date(ts);
        return new Intl.DateTimeFormat('es-CO', { dateStyle: 'short', timeStyle: 'short' }).format(d);
    })();
    const code   = escapeHtml(o.code || o.id.slice(-6));
    const name   = escapeHtml(o.customerName || '—');
    const tipo   = _cajaDiariaTypeHtml(o.orderType);
    const method = _cajaDiariaMethodLabel(o);
    const total  = formatMoney(getOrderDisplayTotal(o));
    const voidedClass = o.voided ? ' class="ticket-voided"' : '';
    const voidedBadge = o.voided ? '<span class="ticket-voided-inline">ANULADO</span>' : '';
    const actionBtn = o.voided
        ? `<button type="button" class="ticket-action-btn restore" data-ticket-action="restore" data-ticket-id="${o.id}">↩ Restaurar</button>`
        : `<button type="button" class="ticket-action-btn void" data-ticket-action="void" data-ticket-id="${o.id}">🚫 Anular</button>`;
    return `<tr${voidedClass} data-ticket-id="${o.id}">
        <td>${fecha}</td>
        <td><strong>${code}</strong>${voidedBadge}</td>
        <td>${name}</td>
        <td>${tipo}</td>
        <td><span class="caja-method-badge">${method}</span></td>
        <td class="caja-total-cell">${total}</td>
        <td style="text-align:center;white-space:nowrap;">
            <button type="button" class="ticket-action-btn preview" data-ticket-action="preview" data-ticket-id="${o.id}">👁 Ver</button>
            ${actionBtn}
        </td>
    </tr>`;
}

function renderTicketsTable(orders) {
    const bodyEl = document.getElementById('ticketsTableBody');
    if (!bodyEl) return;
    if (!orders || orders.length === 0) {
        bodyEl.innerHTML = '<tr><td class="caja-empty" colspan="7">No se encontraron tickets para el período seleccionado.</td></tr>';
        return;
    }
    bodyEl.innerHTML = orders.map(_ticketRowHtml).join('');
}

async function loadTicketsReport(fromDate, toDate) {
    const start = firebase.firestore.Timestamp.fromDate(new Date(fromDate + 'T00:00:00'));
    const end   = firebase.firestore.Timestamp.fromDate(new Date(toDate + 'T23:59:59'));
    const snap  = await firebaseDb.collection(ORDERS_COLLECTION)
        .where('createdAt', '>=', start)
        .where('createdAt', '<=', end)
        .orderBy('createdAt', 'desc')
        .get();
    const orders = snap.docs.map((d) => normalizeOrder({ id: d.id, ...d.data() }));
    _ticketsData = orders.filter((o) => o.paymentMethod && o.paymentMethod !== 'pendiente');
    return _ticketsData;
}

// Tickets search button
document.getElementById('ticketsSearchBtn')?.addEventListener('click', async () => {
    const fromEl = document.getElementById('ticketsDateFrom');
    const toEl   = document.getElementById('ticketsDateTo');
    const btn    = document.getElementById('ticketsSearchBtn');
    const from   = fromEl?.value;
    const to     = toEl?.value;
    if (!from || !to) { showNotice('Selecciona un rango de fechas.', 'error'); return; }
    if (from > to)    { showNotice('La fecha de inicio debe ser menor o igual a la fecha final.', 'error'); return; }
    if (btn) { btn.disabled = true; btn.textContent = 'Buscando...'; }
    try {
        const orders = await loadTicketsReport(from, to);
        renderTicketsTable(orders);
    } catch (err) {
        showNotice('Error al buscar tickets: ' + (err.message || 'error'), 'error');
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Buscar'; }
    }
});

// Tickets table actions (preview / void)
document.getElementById('ticketsTableBody')?.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-ticket-action]');
    if (!btn) return;
    const action = btn.dataset.ticketAction;
    const id     = btn.dataset.ticketId;
    const order  = _ticketsData.find((o) => o.id === id);
    if (!order) return;

    if (action === 'preview') {
        if (window.innerWidth >= 960) {
            openTicketSidePanel(order);
        } else {
            openTicketPreviewModal(order);
        }
        return;
    }

    if (action === 'void') {
        if (!window.confirm(`¿Anular el ticket ${order.code}? Se eliminará de la Caja Diaria.`)) return;
        btn.disabled = true;
        try {
            await updateOrder(id, { voided: true, voidedAt: firestoreNow() });
            const idx = _ticketsData.findIndex((o) => o.id === id);
            if (idx !== -1) { _ticketsData[idx] = { ..._ticketsData[idx], voided: true }; }
            renderTicketsTable(_ticketsData);
            renderCajaDiaria();
            const sidePanel = document.getElementById('ticketsSidePanel');
            if (sidePanel && !sidePanel.hidden && idx !== -1) openTicketSidePanel(_ticketsData[idx]);
            showNotice(`Ticket ${order.code} anulado.`, 'ok');
        } catch (err) {
            showNotice('Error al anular: ' + (err.message || 'error'), 'error');
            btn.disabled = false;
        }
        return;
    }

    if (action === 'restore') {
        if (!window.confirm(`¿Restaurar el ticket ${order.code}? Volverá a aparecer en la Caja Diaria.`)) return;
        btn.disabled = true;
        try {
            await updateOrder(id, { voided: false, voidedAt: null });
            const idx = _ticketsData.findIndex((o) => o.id === id);
            if (idx !== -1) { _ticketsData[idx] = { ..._ticketsData[idx], voided: false }; }
            renderTicketsTable(_ticketsData);
            renderCajaDiaria();
            const sidePanel = document.getElementById('ticketsSidePanel');
            if (sidePanel && !sidePanel.hidden && idx !== -1) openTicketSidePanel(_ticketsData[idx]);
            showNotice(`Ticket ${order.code} restaurado.`, 'ok');
        } catch (err) {
            showNotice('Error al restaurar: ' + (err.message || 'error'), 'error');
            btn.disabled = false;
        }
    }
});

// ── Panel lateral de ticket (escritorio) ──────────────────────────────────────
function openTicketSidePanel(order) {
    const panel  = document.getElementById('ticketsSidePanel');
    const body   = document.getElementById('ticketsSidePanelBody');
    const title  = document.getElementById('ticketsSidePanelTitle');
    if (!panel || !body) return;
    if (title) title.textContent = order.voided ? `🚫 ${order.code} — Anulado` : `Ticket ${order.code}`;
    body.innerHTML = buildThermalTicketMarkup(order, { printMode: true });
    panel.removeAttribute('hidden');
    panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function closeTicketSidePanel() {
    document.getElementById('ticketsSidePanel')?.setAttribute('hidden', '');
}

document.getElementById('ticketsSidePanelClose')?.addEventListener('click', closeTicketSidePanel);

// ── Cobro desde ticket (panel POS y modal histórico) ─────────────────────────
function _triggerTicketCobro(order) {
    const ot = String(order.orderType || '').toLowerCase();
    if (!ot) { showNotice('Asigna el tipo de pedido (mesa / recoger / domicilio) primero.', 'error'); return; }
    if (ot === 'domicilio') openDeliveryPaymentModal(order, false);
    else openDeliveryPaymentModal(order, 'mesa'); // mesa y retiro
}

// ── Modal vista previa de ticket ──────────────────────────────────────────────
let _ticketPreviewCurrentOrder = null;

function openTicketPreviewModal(order) {
    const modal    = document.getElementById('ticketPreviewModal');
    const content  = document.getElementById('ticketPreviewContent');
    const voidBadge = document.getElementById('ticketPreviewVoidedBadge');
    const editBtn  = document.getElementById('ticketPreviewEditBtn');
    const delBtn   = document.getElementById('ticketPreviewDeleteBtn');
    if (!modal || !content) return;
    _ticketPreviewCurrentOrder = order;
    content.innerHTML = buildThermalTicketMarkup(order);
    if (voidBadge) {
        if (order.voided) voidBadge.removeAttribute('hidden');
        else voidBadge.setAttribute('hidden', '');
    }
    const isPosOrder = order.isAdminOrder || order.source === 'admin_pos';
    if (editBtn) editBtn.hidden = !isPosOrder;
    if (delBtn) delBtn.hidden = false;
    modal.removeAttribute('hidden');
}

function closeTicketPreviewModal() {
    document.getElementById('ticketPreviewModal')?.setAttribute('hidden', '');
    _ticketPreviewCurrentOrder = null;
}

document.getElementById('ticketPreviewCloseBtn')?.addEventListener('click', closeTicketPreviewModal);
document.getElementById('ticketPreviewModal')?.addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-order-ticket-action]');
    if (btn) {
        const action = btn.dataset.orderTicketAction;
        const order = _ticketPreviewCurrentOrder;
        if (action === 'print') {
            const orderId = String(btn.dataset.orderId || '').trim();
            if (orderId) openOrderPrintTicket(orderId);
        } else if (action === 'cobrar' && order) {
            _triggerTicketCobro(order);
        } else if (action === 'contact') {
            const orderId = String(btn.dataset.orderId || '').trim();
            if (orderId) {
                openOrderContactCard(orderId);
                showNotice(isMobileContactImportContext() ? 'Abriendo el contacto del cliente.' : 'Contacto descargado en formato VCF.', 'ok');
            }
        } else if (action === 'editar_pos' && order) {
            closeTicketPreviewModal();
            editAdminPosOrder(order);
        } else if (action === 'eliminar' && order) {
            closeTicketPreviewModal();
            if (confirm(`¿Eliminar el pedido #${order.code}?`)) {
                await deleteOrder(order.id);
                showNotice(`Pedido #${order.code} eliminado.`, 'ok');
            }
        }
        return;
    }
    if (e.target === document.getElementById('ticketPreviewModal')) closeTicketPreviewModal();
});

// Pre-load today in date filters and auto-load on tab open
(function initTicketsDateDefaults() {
    const today = new Date().toISOString().slice(0, 10);
    const fromEl = document.getElementById('ticketsDateFrom');
    const toEl   = document.getElementById('ticketsDateTo');
    if (fromEl && !fromEl.value) fromEl.value = today;
    if (toEl && !toEl.value)     toEl.value   = today;
})();

async function _autoLoadTicketsTab() {
    const fromEl = document.getElementById('ticketsDateFrom');
    const toEl   = document.getElementById('ticketsDateTo');
    const btn    = document.getElementById('ticketsSearchBtn');
    const from   = fromEl?.value;
    const to     = toEl?.value;
    if (!from || !to) return;
    if (btn) { btn.disabled = true; btn.textContent = 'Cargando...'; }
    try {
        const orders = await loadTicketsReport(from, to);
        renderTicketsTable(orders);
    } catch (_) { /* silencioso */ }
    finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Buscar'; }
    }
}

// ── Proveedores ───────────────────────────────────────────────────────────────
const PROVEEDORES_COLLECTION = 'proveedores';
let _proveedoresState = [];
let _proveedorEditingId = null;

async function loadProveedores() {
    try {
        const snap = await firebaseDb.collection(PROVEEDORES_COLLECTION).orderBy('nombre').get();
        _proveedoresState = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch {
        _proveedoresState = [];
    }
    _updateProveedorDatalist();
    return _proveedoresState;
}

async function saveProveedor(data) {
    const id = data.id || `prov_${Date.now()}`;
    await firebaseDb.collection(PROVEEDORES_COLLECTION).doc(id).set({ ...data, id }, { merge: true });
    return id;
}

async function deleteProveedor(id) {
    await firebaseDb.collection(PROVEEDORES_COLLECTION).doc(id).delete();
}

function _updateProveedorDatalist() {
    const dl = document.getElementById('proveedoresList');
    if (!dl) return;
    dl.innerHTML = _proveedoresState.map((p) =>
        `<option value="${escapeHtml(p.nombre || '')}"></option>`
    ).join('');
}

function renderProveedoresPanel() {
    const wrap = document.getElementById('proveedoresPanelWrap');
    if (!wrap) return;

    const rows = _proveedoresState.map((p) => `
        <div class="pm-method-item" data-prov-id="${escapeHtml(p.id)}">
            <div class="pm-method-info">
                <span class="pm-method-name">🏭 ${escapeHtml(p.nombre || '—')}</span>
                <span class="pm-method-meta">${[p.telefono, p.direccion, p.pagina].filter(Boolean).map(escapeHtml).join(' · ') || 'Sin datos adicionales'}</span>
            </div>
            <div class="pm-method-actions">
                <button type="button" class="pm-icon-btn" data-prov-edit="${escapeHtml(p.id)}" title="Editar">✎</button>
                <button type="button" class="pm-icon-btn pm-icon-btn--del" data-prov-del="${escapeHtml(p.id)}" title="Eliminar">🗑</button>
            </div>
        </div>`).join('') || `<p style="color:var(--admin-muted);font-size:0.85rem;padding:8px 0;">No hay proveedores registrados.</p>`;

    wrap.innerHTML = `
        <div id="proveedoresListWrap">${rows}</div>
        <div id="proveedorFormWrap" style="display:none;"></div>`;

    wrap.querySelectorAll('[data-prov-edit]').forEach((btn) => {
        btn.addEventListener('click', () => _proveedorOpenForm(btn.dataset.provEdit));
    });
    wrap.querySelectorAll('[data-prov-del]').forEach((btn) => {
        btn.addEventListener('click', async () => {
            if (!confirm('¿Eliminar este proveedor?')) return;
            await deleteProveedor(btn.dataset.provDel);
            await loadProveedores();
            renderProveedoresPanel();
            showNotice('Proveedor eliminado.', 'ok');
        });
    });
}

function _proveedorOpenForm(editId = null) {
    _proveedorEditingId = editId;
    const existing = editId ? _proveedoresState.find((p) => p.id === editId) : null;
    const wrap = document.getElementById('proveedorFormWrap');
    const listWrap = document.getElementById('proveedoresListWrap');
    if (!wrap) return;
    if (listWrap) listWrap.style.display = 'none';

    wrap.style.display = '';
    wrap.innerHTML = `
        <div class="pm-method-form-wrap">
            <div class="pm-method-form">
                <div class="pm-form-row">
                    <label class="pm-form-label">Nombre *</label>
                    <input class="pm-form-input" id="provFormNombre" type="text" maxlength="80" placeholder="Ej: Frigorífico Central" value="${escapeHtml(existing?.nombre || '')}">
                </div>
                <div class="pm-form-row">
                    <label class="pm-form-label">Teléfono</label>
                    <input class="pm-form-input" id="provFormTelefono" type="tel" maxlength="20" placeholder="Ej: 3001234567" value="${escapeHtml(existing?.telefono || '')}">
                </div>
                <div class="pm-form-row">
                    <label class="pm-form-label">Dirección</label>
                    <input class="pm-form-input" id="provFormDireccion" type="text" maxlength="100" placeholder="Ej: Calle 10 # 5-20" value="${escapeHtml(existing?.direccion || '')}">
                </div>
                <div class="pm-form-row">
                    <label class="pm-form-label">Página web</label>
                    <input class="pm-form-input" id="provFormPagina" type="url" maxlength="120" placeholder="Ej: https://proveedor.com" value="${escapeHtml(existing?.pagina || '')}">
                </div>
                <div class="pm-form-actions">
                    <button type="button" class="admin-button" id="provFormSaveBtn">${editId ? 'Guardar cambios' : 'Agregar proveedor'}</button>
                    <button type="button" class="pm-icon-btn" id="provFormCancelBtn">Cancelar</button>
                </div>
            </div>
        </div>`;

    wrap.querySelector('#provFormSaveBtn')?.addEventListener('click', _proveedorFormSave);
    wrap.querySelector('#provFormCancelBtn')?.addEventListener('click', () => {
        _proveedorEditingId = null;
        if (listWrap) listWrap.style.display = '';
        wrap.style.display = 'none';
    });
}

async function _proveedorFormSave() {
    const nombre = document.getElementById('provFormNombre')?.value.trim() || '';
    if (!nombre) { showNotice('El nombre del proveedor es requerido.', 'error'); return; }
    const btn = document.getElementById('provFormSaveBtn');
    if (btn) { btn.disabled = true; btn.textContent = 'Guardando...'; }
    try {
        const isEditing = Boolean(_proveedorEditingId);
        const data = {
            nombre,
            telefono: document.getElementById('provFormTelefono')?.value.trim() || '',
            direccion: document.getElementById('provFormDireccion')?.value.trim() || '',
            pagina: document.getElementById('provFormPagina')?.value.trim() || '',
        };
        if (_proveedorEditingId) data.id = _proveedorEditingId;
        await saveProveedor(data);
        await loadProveedores();
        _proveedorEditingId = null;
        renderProveedoresPanel();
        showNotice(isEditing ? 'Proveedor actualizado.' : 'Proveedor agregado.', 'ok');
    } catch (err) {
        showNotice(`Error al guardar: ${err.message || 'error inesperado.'}`, 'error');
        if (btn) { btn.disabled = false; btn.textContent = 'Guardar'; }
    }
}

// Botón "Agregar proveedor"
document.getElementById('addProveedorBtn')?.addEventListener('click', () => {
    _proveedorOpenForm(null);
});

// ── Categorías Gastos — Panel CRUD ────────────────────────────────────────────
let _catGastosPanelBound = false;

function _catExpandItem(catId) {
    const wrap = document.getElementById('categoriasGastosPanelWrap');
    if (!wrap) return;
    const item = wrap.querySelector(`.cat-gasto-item[data-cat-id="${catId}"]`);
    if (!item) return;
    const subs  = item.querySelector('.cat-gasto-subs');
    const arrow = item.querySelector('.cat-toggle-arrow');
    if (subs) { subs.removeAttribute('hidden'); }
    if (arrow) { arrow.textContent = '▾'; }
    item.querySelector('.cat-sub-input')?.focus();
}

function renderCategoriasGastosPanel() {
    const wrap = document.getElementById('categoriasGastosPanelWrap');
    if (!wrap) return;
    const cats = getCategoriasGastos();

    wrap.innerHTML = cats.map((cat) => {
        const subCount = (cat.subs || []).length;
        const subLabel = subCount > 0 ? `<span class="cat-sub-count">${subCount}</span>` : '';
        return `
        <div class="cat-gasto-item" data-cat-id="${escapeHtml(cat.id)}">
            <div class="cat-gasto-header" data-cat-toggle="${escapeHtml(cat.id)}" style="cursor:pointer;">
                <span class="cat-gasto-icon">${cat.icon}</span>
                <span class="cat-gasto-name">${escapeHtml(cat.nombre)}</span>
                ${subLabel}
                <span class="cat-toggle-arrow">▸</span>
                <div class="cat-gasto-actions" onclick="event.stopPropagation()">
                    <button type="button" class="pm-icon-btn pm-icon-btn--del" data-cat-del="${escapeHtml(cat.id)}" title="Eliminar categoría">🗑</button>
                </div>
            </div>
            <div class="cat-gasto-subs" hidden>
                ${(cat.subs || []).map((s, i) => `
                    <span class="cat-sub-chip">
                        ${escapeHtml(s)}
                        <button type="button" data-cat-del-sub="${escapeHtml(cat.id)}" data-sub-idx="${i}" title="Quitar">×</button>
                    </span>`).join('')}
                <div class="cat-sub-add-wrap">
                    <input type="text" class="cat-sub-input" data-cat-sub-input="${escapeHtml(cat.id)}" placeholder="Nueva subcategoría…" maxlength="40">
                    <button type="button" class="cat-sub-add-btn" data-cat-add-sub="${escapeHtml(cat.id)}">+ Agregar</button>
                </div>
            </div>
        </div>`;
    }).join('') || `<p style="color:var(--admin-muted);font-size:0.85rem;padding:8px 0;">No hay categorías. Agrega una nueva.</p>`;

    // Delegación de eventos — un solo listener en el contenedor
    if (!_catGastosPanelBound) {
        _catGastosPanelBound = true;

        wrap.addEventListener('click', async (e) => {
            // Toggle expand/collapse
            const toggleHeader = e.target.closest('[data-cat-toggle]');
            if (toggleHeader && !e.target.closest('[data-cat-del]')) {
                const item  = toggleHeader.closest('.cat-gasto-item');
                const subs  = item?.querySelector('.cat-gasto-subs');
                const arrow = item?.querySelector('.cat-toggle-arrow');
                if (!subs) return;
                const open = subs.hasAttribute('hidden');
                subs.toggleAttribute('hidden', !open);
                if (arrow) arrow.textContent = open ? '▾' : '▸';
                if (open) item?.querySelector('.cat-sub-input')?.focus();
                return;
            }

            // Eliminar categoría
            const delCat = e.target.closest('[data-cat-del]');
            if (delCat) {
                const catId = delCat.dataset.catDel;
                const cat = _categoriasGastosState.find((c) => c.id === catId);
                if (!confirm(`¿Eliminar la categoría "${cat?.nombre || catId}"?`)) return;
                _categoriasGastosState = _categoriasGastosState.filter((c) => c.id !== catId);
                try { await saveCategoriasGastos(); } catch (err) { showNotice('Error al guardar.', 'error'); return; }
                renderCategoriasGastosPanel();
                showNotice('Categoría eliminada.', 'ok');
                return;
            }

            // Quitar subcategoría
            const delSub = e.target.closest('[data-cat-del-sub]');
            if (delSub) {
                const catId = delSub.dataset.catDelSub;
                const idx   = Number(delSub.dataset.subIdx);
                const cat   = _categoriasGastosState.find((c) => c.id === catId);
                if (!cat) return;
                cat.subs = (cat.subs || []).filter((_, i) => i !== idx);
                try { await saveCategoriasGastos(); } catch (err) { showNotice('Error al guardar.', 'error'); return; }
                renderCategoriasGastosPanel();
                _catExpandItem(catId);
                return;
            }

            // Agregar subcategoría
            const addSub = e.target.closest('[data-cat-add-sub]');
            if (addSub) {
                const catId   = addSub.dataset.catAddSub;
                const item    = addSub.closest('.cat-gasto-item');
                const inputEl = item?.querySelector('.cat-sub-input');
                const value   = inputEl?.value?.trim() || '';
                if (!value) { inputEl?.focus(); return; }
                const cat = _categoriasGastosState.find((c) => c.id === catId);
                if (!cat) return;
                cat.subs = [...(cat.subs || []), value];
                addSub.disabled = true;
                try {
                    await saveCategoriasGastos();
                    renderCategoriasGastosPanel();
                    _catExpandItem(catId);
                } catch (err) {
                    cat.subs = cat.subs.filter((s) => s !== value);
                    showNotice('Error al guardar subcategoría.', 'error');
                    addSub.disabled = false;
                }
                return;
            }
        });

        wrap.addEventListener('keydown', (e) => {
            if (e.key !== 'Enter') return;
            const input = e.target.closest('.cat-sub-input');
            if (!input) return;
            e.preventDefault();
            const item   = input.closest('.cat-gasto-item');
            const addBtn = item?.querySelector('[data-cat-add-sub]');
            addBtn?.click();
        });
    }
}

document.getElementById('addCategoriaGastoBtn')?.addEventListener('click', () => {
    const formWrap = document.getElementById('newCatGastoFormWrap');
    if (!formWrap) return;
    formWrap.style.display = 'flex';
    document.getElementById('newCatGastoNombre')?.focus();
});

document.getElementById('newCatGastoSaveBtn')?.addEventListener('click', async () => {
    const iconEl  = document.getElementById('newCatGastoIcon');
    const nameEl  = document.getElementById('newCatGastoNombre');
    const nombre  = nameEl?.value?.trim() || '';
    const icon    = iconEl?.value?.trim() || '📦';
    if (!nombre) { showNotice('Escribe un nombre para la categoría.', 'error'); return; }
    const id = nombre.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') + '_' + Date.now();
    _categoriasGastosState = [..._categoriasGastosState, { id, nombre, icon, subs: [] }];
    await saveCategoriasGastos();
    if (iconEl) iconEl.value = '';
    if (nameEl) nameEl.value = '';
    const formWrap = document.getElementById('newCatGastoFormWrap');
    if (formWrap) formWrap.style.display = 'none';
    renderCategoriasGastosPanel();
    showNotice('Categoría agregada.', 'ok');
});

document.getElementById('newCatGastoCancelBtn')?.addEventListener('click', () => {
    const formWrap = document.getElementById('newCatGastoFormWrap');
    if (formWrap) formWrap.style.display = 'none';
});

// ── Gastos — Informes ─────────────────────────────────────────────────────────
function renderGastosInformes() {
    const container = document.getElementById('gastosInformesBody');
    if (!container) return;

    const desdeVal = document.getElementById('gastosDesde')?.value;
    const hastaVal = document.getElementById('gastosHasta')?.value;

    let gastos = [..._gastosCajaState];

    if (desdeVal) {
        const desdeMs = new Date(desdeVal).getTime();
        gastos = gastos.filter((g) => {
            const ms = g.registradoAt?.toMillis ? g.registradoAt.toMillis() : Number(g.registradoAt || 0);
            return ms >= desdeMs;
        });
    }
    if (hastaVal) {
        const hastaMs = new Date(hastaVal + 'T23:59:59').getTime();
        gastos = gastos.filter((g) => {
            const ms = g.registradoAt?.toMillis ? g.registradoAt.toMillis() : Number(g.registradoAt || 0);
            return ms <= hastaMs;
        });
    }

    const cats = getCategoriasGastos();
    const byCategory = {};
    cats.forEach((c) => { byCategory[c.id] = { cat: c, gastos: [], total: 0 }; });
    byCategory['sin_cat'] = { cat: { id: 'sin_cat', nombre: 'Sin categoría', icon: '📦' }, gastos: [], total: 0 };

    gastos.forEach((g) => {
        const key = g.categoria && byCategory[g.categoria] ? g.categoria : 'sin_cat';
        byCategory[key].gastos.push(g);
        byCategory[key].total += Number(g.monto || 0);
    });

    const grandTotal = gastos.reduce((s, g) => s + Number(g.monto || 0), 0);
    const grandCount = gastos.length;

    const summaryCards = Object.values(byCategory)
        .filter((b) => b.gastos.length > 0)
        .map((b) => `
            <div class="gi-cat-card">
                <span class="gi-cat-icon">${b.cat.icon}</span>
                <span class="gi-cat-name">${escapeHtml(b.cat.nombre)}</span>
                <strong class="gi-cat-total">${formatMoney(b.total)}</strong>
                <span class="gi-cat-count">${b.gastos.length} registro${b.gastos.length !== 1 ? 's' : ''}</span>
            </div>`).join('');

    const methods = getPaymentMethods();
    const sortedGastos = [...gastos].sort((a, b) => {
        const msA = a.registradoAt?.toMillis ? a.registradoAt.toMillis() : Number(a.registradoAt || 0);
        const msB = b.registradoAt?.toMillis ? b.registradoAt.toMillis() : Number(b.registradoAt || 0);
        return msB - msA;
    });

    const tableRows = sortedGastos.map((g) => {
        const ms = g.registradoAt?.toMillis ? g.registradoAt.toMillis() : Number(g.registradoAt || 0);
        const fecha = ms ? new Date(ms).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';
        const cat = cats.find((c) => c.id === g.categoria);
        const method = methods.find((m) => m.id === g.paymentMethod);
        return `<tr>
            <td>${fecha}</td>
            <td>${cat ? `${cat.icon} ${escapeHtml(cat.nombre)}` : '—'}</td>
            <td>${escapeHtml(g.subcategoria || '—')}</td>
            <td>${escapeHtml(g.descripcion || '—')}</td>
            <td>${escapeHtml(g.proveedor || '—')}</td>
            <td><span class="caja-method-badge">${method ? `${method.icon} ${escapeHtml(method.label)}` : escapeHtml(g.paymentMethod || '—')}</span></td>
            <td style="color:#fca5a5;font-weight:700;">${formatMoney(Number(g.monto || 0))}</td>
        </tr>`;
    }).join('');

    container.innerHTML = `
        <div class="gi-summary-grid">${summaryCards || '<span style="color:var(--admin-muted);font-size:0.82rem;">Sin registros para el período.</span>'}</div>
        <div class="gi-totals-bar">
            <span>${grandCount} gasto${grandCount !== 1 ? 's' : ''} · Promedio: ${grandCount ? formatMoney(grandTotal / grandCount) : '$0'}</span>
            <strong>Total: ${formatMoney(grandTotal)}</strong>
        </div>
        ${gastos.length === 0 ? '<p class="caja-empty">No hay gastos registrados para el período seleccionado.</p>' : `
        <div class="caja-ledger-wrap" style="margin-top:12px;">
            <table class="caja-ledger-table gi-table">
                <thead><tr>
                    <th class="col-left">Fecha</th>
                    <th class="col-left">Categoría</th>
                    <th class="col-left">Subcategoría</th>
                    <th class="col-left">Descripción</th>
                    <th class="col-left">Proveedor</th>
                    <th>Método</th>
                    <th>Monto</th>
                </tr></thead>
                <tbody>${tableRows}</tbody>
                <tfoot><tr>
                    <td class="col-left" colspan="6" style="font-size:0.72rem;text-transform:uppercase;color:var(--admin-muted);">TOTAL</td>
                    <td style="color:#fca5a5;font-weight:800;">${formatMoney(grandTotal)}</td>
                </tr></tfoot>
            </table>
        </div>`}
    `;
}

document.getElementById('gastosFilterBtn')?.addEventListener('click', renderGastosInformes);
document.getElementById('gastosClearFilterBtn')?.addEventListener('click', () => {
    const desdeEl = document.getElementById('gastosDesde');
    const hastaEl = document.getElementById('gastosHasta');
    if (desdeEl) desdeEl.value = '';
    if (hastaEl) hastaEl.value = '';
    renderGastosInformes();
});

// ── Caja Chica ────────────────────────────────────────────────────────────────
const CC_BILLETES = [2000, 5000, 10000, 20000, 50000, 100000];
const CC_MONEDAS  = [50, 100, 200, 500, 1000];
const CC_STORAGE_KEY = 'roalburger-caja-chica';

let _ccBilletes = {};
let _ccMonedas  = {};
let _ccGuardadosBilletes = 0;
let _ccGuardadasMonedas  = 0;

function _ccLoad() {
    try {
        const raw = JSON.parse(localStorage.getItem(CC_STORAGE_KEY) || '{}');
        _ccBilletes = raw.billetes || {};
        _ccMonedas  = raw.monedas  || {};
        _ccGuardadosBilletes = Number(raw.guardadosBilletes || 0);
        _ccGuardadasMonedas  = Number(raw.guardadasMonedas  || 0);
    } catch (_) {}
}

function _ccSave() {
    localStorage.setItem(CC_STORAGE_KEY, JSON.stringify({
        billetes: _ccBilletes, monedas: _ccMonedas,
        guardadosBilletes: _ccGuardadosBilletes, guardadasMonedas: _ccGuardadasMonedas,
    }));
}

function _ccSubB() { return CC_BILLETES.reduce((s, d) => s + d * (Number(_ccBilletes[d] || 0)), 0); }
function _ccSubM() { return CC_MONEDAS.reduce((s, d)  => s + d * (Number(_ccMonedas[d]  || 0)), 0); }
function _ccTotal() { return _ccSubB() + _ccSubM() + _ccGuardadosBilletes + _ccGuardadasMonedas; }

function _ccRenderGrid(containerId, denoms, state) {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = denoms.map((d) => {
        const count = Number(state[d] || 0);
        const sub = d * count;
        return `<div class="cc-denom-row">
            <span class="cc-denom-label">${formatMoney(d)}</span>
            <input type="number" class="cc-denom-input" data-cc-denom="${d}" value="${count > 0 ? count : ''}" placeholder="0" min="0" step="1" inputmode="numeric">
            <span class="cc-denom-sub${sub > 0 ? ' has-value' : ''}" data-cc-sub="${d}">${sub > 0 ? formatMoney(sub) : '—'}</span>
        </div>`;
    }).join('');
}

function _ccRefreshTotals() {
    const subB = _ccSubB();
    const subM = _ccSubM();
    const total = subB + subM + _ccGuardadosBilletes + _ccGuardadasMonedas;
    const elSB = document.getElementById('ccSubtotalBilletes');
    const elSM = document.getElementById('ccSubtotalMonedas');
    const elT  = document.getElementById('ccTotalFinal');
    if (elSB) elSB.textContent = formatMoney(subB);
    if (elSM) elSM.textContent = formatMoney(subM);
    if (elT)  elT.textContent  = formatMoney(total);
    // Botón guardar sticky
    const saveBtn = document.getElementById('ccSaveBtn');
    if (saveBtn) saveBtn.textContent = `💾 ${formatMoney(total)}`;
    // Botón del banner
    const bannerBtn = document.getElementById('cajaChicaBtn');
    if (bannerBtn) bannerBtn.textContent = total > 0 ? `💰 ${formatMoney(total)}` : '💰 Caja Chica';
    // Resumen en Caja Diaria
    const wrapper = document.getElementById('ccCajaDiariaSummary');
    const amtEl   = wrapper?.querySelector('[data-cc-summary-amount]');
    if (wrapper) wrapper.hidden = total <= 0;
    if (amtEl)   amtEl.textContent = formatMoney(total);
}

function openCajaChicaModal() {
    _ccLoad();
    _ccRenderGrid('ccBilletesGrid', CC_BILLETES, _ccBilletes);
    _ccRenderGrid('ccMonedasGrid',  CC_MONEDAS,  _ccMonedas);
    const gbEl = document.getElementById('ccGuardadosBilletes');
    const gmEl = document.getElementById('ccGuardadasMonedas');
    if (gbEl) gbEl.value = _ccGuardadosBilletes > 0 ? _ccGuardadosBilletes : '';
    if (gmEl) gmEl.value = _ccGuardadasMonedas  > 0 ? _ccGuardadasMonedas  : '';
    _ccRefreshTotals();
    document.getElementById('cajaChicaModal')?.removeAttribute('hidden');
}

function closeCajaChicaModal() {
    document.getElementById('cajaChicaModal')?.setAttribute('hidden', '');
}

document.getElementById('cajaChicaModal')?.addEventListener('input', (e) => {
    const denomInput = e.target.closest('[data-cc-denom]');
    if (denomInput) {
        const d = Number(denomInput.dataset.ccDenom);
        const count = Number(denomInput.value) || 0;
        if (CC_BILLETES.includes(d)) { _ccBilletes[d] = count; } else { _ccMonedas[d] = count; }
        const sub = d * count;
        const subEl = denomInput.closest('.cc-denom-row')?.querySelector(`[data-cc-sub="${d}"]`);
        if (subEl) { subEl.textContent = sub > 0 ? formatMoney(sub) : '—'; subEl.classList.toggle('has-value', sub > 0); }
        _ccSave(); _ccRefreshTotals(); return;
    }
    if (e.target.id === 'ccGuardadosBilletes') { _ccGuardadosBilletes = Number(e.target.value) || 0; _ccSave(); _ccRefreshTotals(); }
    if (e.target.id === 'ccGuardadasMonedas')  { _ccGuardadasMonedas  = Number(e.target.value) || 0; _ccSave(); _ccRefreshTotals(); }
});

document.getElementById('ccSaveBtn')?.addEventListener('click', () => {
    _ccSave();
    const total = _ccTotal();
    closeCajaChicaModal();
    showNotice(`Caja chica guardada: ${formatMoney(total)}`, 'ok');
});
document.getElementById('cajaChicaCloseBtn')?.addEventListener('click', closeCajaChicaModal);
document.getElementById('cajaChicaModal')?.addEventListener('click', (e) => {
    if (e.target === document.getElementById('cajaChicaModal')) closeCajaChicaModal();
});
document.getElementById('cajaChicaBtn')?.addEventListener('click', openCajaChicaModal);
document.getElementById('ccCajaDiariaSummaryInner')?.addEventListener('click', openCajaChicaModal);

// Cargar al inicio
_ccLoad();
_ccRefreshTotals();

// ═══════════════════════════════════════════════════════════════════════════
// ── IMPORTAR CLIENTES — Lógica completa ─────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

/* ── Aliases inteligentes de columnas ──────────────────────────────────── */
const ICM_FIELD_ALIASES = {
    customerName:  ['nombre del cliente','nombre cliente','name','nombre','razon social','razón social','nombres','full name','fullname','customer name','first name','firstname','primer nombre'],
    lastName:      ['apellido','apellidos','last name','lastname','surname','segundo nombre'],
    customerPhone: ['numero de telefono','número de teléfono','telefono','teléfono','phone number','phone','cel','celular','movil','móvil','tel','whatsapp','contacto','fono','numero','celular principal'],
    email:         ['email','correo','mail','e-mail','correo electronico','correo electrónico'],
    address:       ['direccion','dirección','address','domicilio','dir','ubicacion','ubicación','calle'],
    notes:         ['notas','notes','comentarios','observaciones','nota','memo','obs','etiquetas','tags'],
    totalOrders:   ['total de visitas','visitas','visits','numero de visitas','orders count','pedidos','pedidos totales','num pedidos','cantidad de pedidos'],
    totalSpent:    ['gasto total','gasto','spent','total gastado','total spent','consumo','consumo total','ingresos cliente'],
};
const ICM_FIELD_LABELS = {
    customerName: 'Nombre', lastName: 'Apellido', customerPhone: 'Teléfono',
    email: 'Email', address: 'Dirección', notes: 'Notas',
    totalOrders: 'Total visitas', totalSpent: 'Gasto total',
    _skip: '— Ignorar —',
};

let _icmParsedRows   = [];   // array de objetos {col: value}
let _icmRawHeaders   = [];   // headers originales del archivo
let _icmColMap       = {};   // { srcHeader -> fieldKey | '_skip' }
let _icmTotalRows    = 0;
let _icmValidRows    = [];   // filas que pasan validación
let _icmInvalidRows  = [];   // [{ rowNum, errors: [{field, problem, value}] }]

/* ── Helpers dinámicos de librería ────────────────────────────────────── */
function _icmLoadScript(src) {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
        const s = document.createElement('script');
        s.src = src; s.onload = resolve; s.onerror = reject;
        document.head.appendChild(s);
    });
}
async function _icmEnsureSheetJS() {
    if (!window.XLSX) await _icmLoadScript('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js');
    return window.XLSX;
}
async function _icmEnsurePDFJS() {
    if (!window.pdfjsLib) {
        await _icmLoadScript('https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js');
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
            'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
    }
    return window.pdfjsLib;
}

/* ── Parsers ───────────────────────────────────────────────────────────── */
function _icmParseCSV(text, sep = null) {
    // Auto-detectar separador
    if (!sep) {
        const line1 = text.slice(0, 2000);
        const counts = { ',': 0, ';': 0, '\t': 0, '|': 0 };
        for (const c of line1) if (c in counts) counts[c]++;
        sep = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
    }
    const rows = [];
    let cur = '', inQ = false, cols = [], lineRow = [];
    for (let i = 0; i < text.length; i++) {
        const ch = text[i], next = text[i + 1];
        if (ch === '"') {
            if (inQ && next === '"') { cur += '"'; i++; }
            else inQ = !inQ;
        } else if (ch === sep && !inQ) {
            cols.push(cur); cur = '';
        } else if ((ch === '\n' || ch === '\r') && !inQ) {
            cols.push(cur); cur = '';
            if (ch === '\r' && next === '\n') i++;
            rows.push(cols); cols = [];
        } else {
            cur += ch;
        }
    }
    if (cur || cols.length) { cols.push(cur); rows.push(cols); }
    // Filtrar filas vacías
    const clean = rows.filter(r => r.some(c => c.trim()));
    if (!clean.length) return { headers: [], rows: [] };
    const headers = clean[0].map(h => h.trim());
    const dataRows = clean.slice(1).map(r => {
        const obj = {};
        headers.forEach((h, i) => { obj[h] = (r[i] || '').trim(); });
        return obj;
    });
    return { headers, rows: dataRows };
}

function _icmParseJSON(text) {
    const data = JSON.parse(text);
    const arr = Array.isArray(data) ? data : (data.clientes || data.clients || data.data || Object.values(data));
    if (!arr.length) return { headers: [], rows: [] };
    const headers = Object.keys(arr[0]);
    const rows = arr.map(item => {
        const obj = {};
        headers.forEach(h => { obj[h] = String(item[h] ?? '').trim(); });
        return obj;
    });
    return { headers, rows };
}

async function _icmParseXLSX(buffer) {
    const XLSX = await _icmEnsureSheetJS();
    const wb = XLSX.read(buffer, { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    if (!raw.length) return { headers: [], rows: [] };
    const headers = raw[0].map(h => String(h).trim());
    const rows = raw.slice(1)
        .filter(r => r.some(c => String(c).trim()))
        .map(r => {
            const obj = {};
            headers.forEach((h, i) => { obj[h] = String(r[i] ?? '').trim(); });
            return obj;
        });
    return { headers, rows };
}

async function _icmParsePDF(buffer) {
    const pdfjsLib = await _icmEnsurePDFJS();
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
    let allText = '';
    for (let p = 1; p <= pdf.numPages; p++) {
        const page = await pdf.getPage(p);
        const content = await page.getTextContent();
        allText += content.items.map(i => i.str).join(' ') + '\n';
    }
    // Intentar parsear como CSV/TSV el texto extraído
    const { headers, rows } = _icmParseCSV(allText);
    if (headers.length > 1) return { headers, rows };
    // Fallback: cada línea como registro con columna única
    const lines = allText.split('\n').map(l => l.trim()).filter(Boolean);
    return { headers: ['texto'], rows: lines.map(l => ({ texto: l })) };
}

async function _icmReadFile(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext === 'json') {
        const text = await file.text();
        return _icmParseJSON(text);
    }
    if (ext === 'csv' || ext === 'tsv' || ext === 'txt') {
        const text = await file.text();
        return _icmParseCSV(text, ext === 'tsv' ? '\t' : null);
    }
    if (ext === 'xlsx' || ext === 'xls') {
        const buf = await file.arrayBuffer();
        return _icmParseXLSX(new Uint8Array(buf));
    }
    if (ext === 'pdf') {
        const buf = await file.arrayBuffer();
        return _icmParsePDF(new Uint8Array(buf));
    }
    // Intentar como texto plano
    const text = await file.text();
    return _icmParseCSV(text);
}

/* ── Auto-detección de columnas ───────────────────────────────────────── */
function _icmDetectColumns(headers) {
    const map = {};
    const normalize = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
    const used = new Set();
    headers.forEach(h => {
        const hn = normalize(h);
        let matched = '_skip';
        for (const [field, aliases] of Object.entries(ICM_FIELD_ALIASES)) {
            if (!used.has(field) && aliases.some(a => hn === a || hn.includes(a) || a.includes(hn))) {
                matched = field; used.add(field); break;
            }
        }
        map[h] = matched;
    });
    return map;
}

/* ── UI helpers ────────────────────────────────────────────────────────── */
function _icmShowPhase(n) {
    [1,2,3,4].forEach(i => {
        const el = document.getElementById(`icmPhase${i}`);
        if (el) el.hidden = (i !== n);
    });
}

function _icmRenderColMap() {
    const grid = document.getElementById('icmColMapRows');
    if (!grid) return;
    const opts = Object.entries(ICM_FIELD_LABELS)
        .map(([k, l]) => `<option value="${k}">${l}</option>`).join('');
    grid.innerHTML = _icmRawHeaders.map(h => {
        const cur = _icmColMap[h] || '_skip';
        return `
        <span class="icm-colmap-src" title="${escapeHtml(h)}">${escapeHtml(h)}</span>
        <span class="icm-colmap-arrow">→</span>
        <select class="icm-colmap-select" data-src-col="${escapeHtml(h)}">
            ${opts.replace(`value="${cur}"`, `value="${cur}" selected`)}
        </select>`;
    }).join('');
    grid.querySelectorAll('.icm-colmap-select').forEach(sel => {
        sel.addEventListener('change', () => {
            _icmColMap[sel.dataset.srcCol] = sel.value;
            _icmRunValidation();
        });
    });
}

function _icmRenderPreview() {
    const wrap = document.getElementById('icmPreviewTable');
    if (!wrap) return;
    const sample = _icmParsedRows.slice(0, 5);
    if (!sample.length) { wrap.innerHTML = '<p style="color:#64748b;padding:10px">Sin datos.</p>'; return; }
    const ths = _icmRawHeaders.map(h => `<th>${escapeHtml(h)}</th>`).join('');
    const trs = sample.map(row =>
        `<tr>${_icmRawHeaders.map(h => `<td>${escapeHtml(String(row[h] ?? ''))}</td>`).join('')}</tr>`
    ).join('');
    wrap.innerHTML = `<table><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`;
}

/* ── Validación de filas ───────────────────────────────────────────────── */
function _icmValidate() {
    const nameIsMapped  = Object.values(_icmColMap).includes('customerName');
    const phoneIsMapped = Object.values(_icmColMap).includes('customerPhone');
    _icmValidRows   = [];
    _icmInvalidRows = [];

    _icmParsedRows.forEach((row, idx) => {
        const client = _icmMapRow(row);
        const hasData = Boolean(client.customerName) || Boolean(client.customerPhoneDigits)
                     || Boolean(client.email)         || Boolean(client.address);
        if (!hasData) return; // fila vacía → ignorar silenciosamente

        const errs = [];

        if (nameIsMapped && !client.customerName.trim()) {
            const srcKey = Object.entries(_icmColMap).find(([, v]) => v === 'customerName')?.[0];
            const raw    = srcKey ? String(row[srcKey] || '') : '';
            errs.push({ field: 'Nombre', problem: 'vacío', value: raw || '(vacío)' });
        }

        if (phoneIsMapped) {
            const digits = client.customerPhoneDigits;
            if (!digits) {
                const srcKey = Object.entries(_icmColMap).find(([, v]) => v === 'customerPhone')?.[0];
                const raw    = srcKey ? String(row[srcKey] || '') : '';
                errs.push({ field: 'Teléfono', problem: 'vacío', value: raw || '(vacío)' });
            } else if (digits.length !== 10) {
                errs.push({
                    field:   'Teléfono',
                    problem: `${digits.length} dígito${digits.length !== 1 ? 's' : ''} (se esperan 10)`,
                    value:   client.customerPhone,
                });
            }
        }

        if (errs.length) {
            _icmInvalidRows.push({ rowNum: idx + 2, errors: errs });
        } else {
            _icmValidRows.push(row);
        }
    });
}

function _icmRenderValidation() {
    const wrapEl    = document.getElementById('icmValidationWrap');
    const listEl    = document.getElementById('icmValidationList');
    const summaryEl = document.getElementById('icmValidationSummary');
    const countEl   = document.getElementById('icmImportCount');
    const btn       = document.getElementById('icmStartImportBtn');

    if (countEl) countEl.textContent = _icmValidRows.length.toLocaleString();
    if (btn) btn.disabled = _icmValidRows.length === 0;

    if (!wrapEl) return;
    if (!_icmInvalidRows.length) { wrapEl.hidden = true; return; }

    wrapEl.hidden = false;
    if (summaryEl) {
        const n = _icmInvalidRows.length;
        summaryEl.textContent = `— ${n.toLocaleString()} registro${n !== 1 ? 's' : ''} con errores · no se importarán`;
    }

    if (!listEl) return;
    const MAX_SHOWN = 100;
    listEl.innerHTML = _icmInvalidRows.slice(0, MAX_SHOWN).map(({ rowNum, errors }) =>
        errors.map(e =>
            `<div class="icm-val-row">` +
            `<span class="icm-val-rownum">Fila ${rowNum}</span>` +
            `<span class="icm-val-field">${escapeHtml(e.field)}</span>` +
            `<span class="icm-val-problem">${escapeHtml(e.problem)}</span>` +
            `<span class="icm-val-value" title="${escapeHtml(e.value)}">${escapeHtml(e.value.length > 36 ? e.value.slice(0, 36) + '…' : e.value)}</span>` +
            `</div>`
        ).join('')
    ).join('');

    if (_icmInvalidRows.length > MAX_SHOWN) {
        listEl.innerHTML += `<div class="icm-val-more">... y ${(_icmInvalidRows.length - MAX_SHOWN).toLocaleString()} registros más con errores</div>`;
    }
}

function _icmRunValidation() {
    _icmValidate();
    _icmRenderValidation();
}

function _icmUpdateProgress(done, total) {
    const pct = total ? Math.round((done / total) * 100) : 0;
    const fill = document.getElementById('icmProgressFill');
    const count = document.getElementById('icmProgressCount');
    const label = document.getElementById('icmProgressLabel');
    if (fill) fill.style.width = `${pct}%`;
    if (count) count.textContent = `${done.toLocaleString()} / ${total.toLocaleString()}`;
    if (label) label.textContent = `Importando… ${pct}%`;
}

/* ── Mapeador de fila → cliente ────────────────────────────────────────── */
function _icmMapRow(row) {
    const get = (field) => {
        const srcKey = Object.entries(_icmColMap).find(([, v]) => v === field)?.[0];
        return srcKey ? String(row[srcKey] || '').trim() : '';
    };
    const isMapped = (field) => Object.values(_icmColMap).includes(field);

    const firstName = get('customerName');
    const lastName  = get('lastName');
    const fullName  = [firstName, lastName].filter(Boolean).join(' ').trim();

    const rawPhone = get('customerPhone');
    const phone    = rawPhone.replace(/\D/g, '');

    const result = {
        customerName:        fullName || '',
        customerPhone:       rawPhone,
        customerPhoneDigits: phone,
        address:             get('address') || '',
        email:               get('email') || '',
        notes:               get('notes') || '',
    };

    // Solo incluir stats si el usuario mapeó esas columnas explícitamente
    if (isMapped('totalOrders')) {
        const n = parseInt(get('totalOrders').replace(/\D/g, ''), 10);
        result.totalOrders = isNaN(n) ? 0 : n;
    }
    if (isMapped('totalSpent')) {
        const raw = get('totalSpent').replace(/[^\d.,]/g, '').replace(',', '.');
        const n = parseFloat(raw);
        result.totalSpent = isNaN(n) ? 0 : n;
    }

    return result;
}

/* ── Importador por lotes con yield ────────────────────────────────────── */
async function _icmRunImport(rows) {
    const BATCH_SIZE = 200;
    let imported = 0, skipped = 0, errors = 0;
    const total = rows.length;
    _icmUpdateProgress(0, total);

    for (let i = 0; i < total; i += BATCH_SIZE) {
        const chunk = rows.slice(i, i + BATCH_SIZE);
        const batch = firebaseDb.batch();
        let batchHasOps = false;

        for (const row of chunk) {
            try {
                const client = _icmMapRow(row);
                if (!client.customerName && !client.customerPhone) { skipped++; continue; }
                const docId = buildAdminClientDocumentId(client);
                const ref = firebaseDb.collection(CLIENTS_COLLECTION).doc(docId);
                const data = {
                    customerName:        client.customerName,
                    customerPhone:       client.customerPhone,
                    customerPhoneDigits: client.customerPhoneDigits,
                    address:             client.address,
                    savedAddresses:      client.address ? [client.address] : [],
                    importedAt:          firestoreNow(),
                    updatedAt:           firestoreNow(),
                };
                if (client.email)  data.email = client.email;
                if (client.notes)  data.notes = client.notes;
                // Solo sobreescribir stats si el usuario los mapeó explícitamente
                if ('totalOrders' in client) data.totalOrders = client.totalOrders;
                if ('totalSpent'  in client) data.totalSpent  = client.totalSpent;
                // merge: true preserva totalOrders/totalSpent si ya existe
                batch.set(ref, data, { merge: true });
                batchHasOps = true;
                imported++;
            } catch (_e) {
                errors++;
            }
        }

        if (batchHasOps) {
            try { await batch.commit(); }
            catch (_e) { errors += chunk.length - (chunk.length - (batchHasOps ? 1 : 0)); }
        }

        _icmUpdateProgress(i + chunk.length, total);
        // yield para que el navegador respire
        await new Promise(r => setTimeout(r, 0));
    }

    return { imported, skipped, errors };
}

/* ── Modal controller ──────────────────────────────────────────────────── */
function openImportClientsModal() {
    _icmParsedRows = []; _icmRawHeaders = []; _icmColMap = {}; _icmTotalRows = 0;
    _icmValidRows = []; _icmInvalidRows = [];
    const modal = document.getElementById('importClientsModal');
    if (modal) modal.hidden = false;
    _icmShowPhase(1);
    const fileInput = document.getElementById('importFileInput');
    if (fileInput) fileInput.value = '';
}

function closeImportClientsModal() {
    const modal = document.getElementById('importClientsModal');
    if (modal) modal.hidden = true;
}

/* ── Evento: archivo seleccionado / soltado ────────────────────────────── */
async function _icmHandleFile(file) {
    if (!file) return;
    const dropzone = document.getElementById('importDropzone');
    if (dropzone) dropzone.style.opacity = '0.5';

    try {
        const { headers, rows } = await _icmReadFile(file);
        _icmRawHeaders   = headers;
        _icmParsedRows   = rows;
        _icmTotalRows    = rows.length;
        _icmColMap       = _icmDetectColumns(headers);

        // Actualizar info bar
        const fname = document.getElementById('icmFileName');
        const rcount = document.getElementById('icmRowCount');
        const icount = document.getElementById('icmImportCount');
        if (fname)  fname.textContent  = file.name;
        if (rcount) rcount.textContent = `${rows.length.toLocaleString()} filas detectadas`;
        if (icount) icount.textContent = rows.length.toLocaleString();

        // Duplicados estimados (por teléfono)
        const existingPhones = new Set(clientsState.map(c => c.customerPhoneDigits || c.customerPhone).filter(Boolean));
        let dupCount = 0;
        rows.forEach(r => {
            const src = Object.entries(_icmColMap).find(([,v]) => v === 'customerPhone')?.[0];
            const raw = src ? String(r[src] || '') : '';
            const digits = raw.replace(/\D/g, '');
            if (digits && existingPhones.has(digits)) dupCount++;
        });
        const dupWarn = document.getElementById('icmDupWarning');
        if (dupWarn) {
            dupWarn.textContent = dupCount > 0
                ? `⚠ ${dupCount} posibles duplicados (se actualizarán sin borrar datos)`
                : '';
        }

        _icmRenderColMap();
        _icmRenderPreview();
        _icmShowPhase(2);
        _icmRunValidation();
    } catch (err) {
        showNotice(`Error al leer el archivo: ${err.message}`, 'error');
    } finally {
        if (dropzone) dropzone.style.opacity = '';
    }
}

/* ── Wire-up de eventos del modal ──────────────────────────────────────── */
(function _icmWireEvents() {
    // Abrir modal
    document.getElementById('openImportClientsBtn')?.addEventListener('click', openImportClientsModal);

    // Cerrar
    document.getElementById('importClientsCloseBtn')?.addEventListener('click', closeImportClientsModal);
    document.getElementById('icmDoneCloseBtn')?.addEventListener('click', () => {
        closeImportClientsModal();
        fetchClients().then(() => renderClients());
    });

    // Backdrop click cierra
    document.getElementById('importClientsModal')?.addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeImportClientsModal();
    });

    // Click sobre drop zone → abrir file picker
    const dropzone = document.getElementById('importDropzone');
    const fileInput = document.getElementById('importFileInput');
    dropzone?.addEventListener('click', () => fileInput?.click());
    document.getElementById('icmDropLink')?.addEventListener('click', (e) => {
        e.stopPropagation(); fileInput?.click();
    });

    // Selección de archivo
    fileInput?.addEventListener('change', () => {
        if (fileInput.files?.[0]) _icmHandleFile(fileInput.files[0]);
    });

    // Drag & Drop
    dropzone?.addEventListener('dragover', (e) => {
        e.preventDefault(); dropzone.classList.add('drag-over');
    });
    dropzone?.addEventListener('dragleave', () => dropzone.classList.remove('drag-over'));
    dropzone?.addEventListener('drop', (e) => {
        e.preventDefault(); dropzone.classList.remove('drag-over');
        const file = e.dataTransfer?.files?.[0];
        if (file) _icmHandleFile(file);
    });

    // Volver a fase 1
    document.getElementById('icmBackBtn')?.addEventListener('click', () => _icmShowPhase(1));

    // Iniciar importación
    document.getElementById('icmStartImportBtn')?.addEventListener('click', async () => {
        const rowsToImport = _icmValidRows.length ? _icmValidRows : _icmParsedRows;
        if (!rowsToImport.length) return;
        _icmShowPhase(3);
        try {
            const { imported, skipped, errors } = await _icmRunImport(rowsToImport);
            // Mostrar resumen
            const statsEl    = document.getElementById('icmDoneStats');
            const invalidCnt = _icmInvalidRows.length;
            if (statsEl) {
                statsEl.innerHTML = `
                    <div class="icm-done-stat">
                        <span class="icm-done-stat-num icm-done-stat-num--ok">${imported.toLocaleString()}</span>
                        <span class="icm-done-stat-label">Importados</span>
                    </div>
                    ${invalidCnt ? `<div class="icm-done-stat">
                        <span class="icm-done-stat-num icm-done-stat-num--skip">${invalidCnt.toLocaleString()}</span>
                        <span class="icm-done-stat-label">Inválidos</span>
                    </div>` : ''}
                    <div class="icm-done-stat">
                        <span class="icm-done-stat-num icm-done-stat-num--skip">${skipped.toLocaleString()}</span>
                        <span class="icm-done-stat-label">Omitidos</span>
                    </div>
                    <div class="icm-done-stat">
                        <span class="icm-done-stat-num icm-done-stat-num--err">${errors.toLocaleString()}</span>
                        <span class="icm-done-stat-label">Errores</span>
                    </div>`;
            }
            const icon = document.getElementById('icmProgIcon');
            if (icon) { icon.textContent = '✅'; icon.style.animation = 'none'; }
            _icmShowPhase(4);
        } catch (err) {
            showNotice(`Error durante la importación: ${err.message}`, 'error');
            _icmShowPhase(2);
        }
    });
})();

// ═══════════════════════════════════════════════════════════════════════════

// ── Keep-alive del AudioContext + re-alerta al volver a primer plano ──────
(function _setupAdminAudioResilience() {
    let _keepAliveTimer = null;

    function _silentPing() {
        const ctx = getOrderBellAudioContext();
        if (!ctx || ctx.state === 'closed') return;
        if (ctx.state === 'suspended') { ctx.resume().catch(() => {}); return; }
        // Buffer de 1 muestra silencioso para mantener el contexto activo
        try {
            const buf = ctx.createBuffer(1, 1, 22050);
            const src = ctx.createBufferSource();
            src.buffer = buf;
            src.connect(ctx.destination);
            src.start();
        } catch (_) {}
    }

    function _startKeepAlive() {
        if (_keepAliveTimer) return;
        _keepAliveTimer = setInterval(_silentPing, 20000);
    }

    // Iniciar keep-alive tras primera interacción del usuario (requisito del browser)
    document.addEventListener('click', _startKeepAlive, { once: true });
    document.addEventListener('keydown', _startKeepAlive, { once: true });

    // Cuando el admin vuelve a primer plano, re-alertar si hay pedidos pendientes
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState !== 'visible') return;
        const unread = getUnreadOrders();
        if (!unread.length) return;
        if (navigator.vibrate) navigator.vibrate([300, 100, 300]);
        playOrderBell().catch(() => {});
        updateAdminDocumentTitle(unread.length);
    });
})();

initAdmin();
loadPaymentMethods();
loadGastosCaja();
loadCategoriasGastos();
loadProveedores();
