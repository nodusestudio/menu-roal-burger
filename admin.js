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
const HORARIO_DOC_ID = 'config_horario';
const RECOMENDADO_DIA_DOC_ID = 'recomendado_dia';
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
const categoryDetailPanel = document.getElementById('categoryDetailPanel');
const carruselTabPanel = document.getElementById('carruselTabPanel');
const openCreateCategoryBtn = document.getElementById('openCreateCategoryBtn');
const openCreateProductBtn = document.getElementById('openCreateProductBtn');
let _selectedCategoryId = null;
let _editingProductId = null;
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
const editProductAcompActivo = document.getElementById('editProductAcompActivo');
const editProductAcompList = document.getElementById('editProductAcompList');

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
let posTicketConfig = null; // { orderType, mesaNumber, customerName, customerPhone }
let posTickets = [];
let posActiveTicketId = null;
let _editingOrderData = null; // set when editing an existing order, cleared after save

const POS_TICKETS_COLLECTION = 'pos_tickets';
let posTicketsUnsubscribe = null;

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
            const firestoreTickets = snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
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
        }, (err) => {
            console.error('[POS] Error en listener pos_tickets:', err);
        });
}
let _posSelectedTicketIds = new Set();
let menuUpgradesConfig = null;
let _posUpgradePending = null;
let clientsSearchTerm = '';
let expandedClientAddressIds = new Set();
let productClicksState = [];
let liveSubscriptions = [];
let recomendadoDiaState = null;

// ── Bluetooth printer state ──
let _btPrinterDevice = null;
let _btPrinterCharacteristic = null;
const _BT_SERVICES = [
    '000018f0-0000-1000-8000-00805f9b34fb',
    'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
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
let clipboardToastTimer = null;
let activeMobileOrdersLane = 'pedidos';
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
    const nextLane = ['unread', 'pedidos', 'mesa'].includes(activeMobileOrdersLane)
        ? activeMobileOrdersLane
        : 'pedidos';

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
                    overlay.style.cssText = 'position:fixed;inset:54px 0 0 0;z-index:198;background:rgba(0,0,0,0.45);';
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

        // Cerrar el menu hamburguesa en mobile al seleccionar panel
        if (window.innerWidth < 1024) closeMobileNav();

        if (target === 'mensajes') {
            markMessagesAsRead();
        } else {
            updateMessagesAttentionState();
        }
    }

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
        order: raw.order != null ? Number(raw.order) : undefined,
        descripcion: raw.descripcion || '',
        visible_pos: raw.visible_pos !== false,
        acompanantes: raw.acompanantes || null,
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
        order: raw.order != null ? Number(raw.order) : undefined,
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
    } else if (rawStatus === 'servido') {
        status = 'servido';
    } else if (rawStatus === 'entregado' || rawStatus === 'cancelado') {
        status = 'entregado';
    }

    const rawOrderType = String(raw.orderType || raw.tipo || raw.fulfillmentType || '').trim().toLowerCase();
    const address = String(raw.deliveryAddress || '').trim();
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
        customerAddress: String(raw.customerAddress || '').trim(),
        profileAddress: String(raw.profileAddress || '').trim(),
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
        voidedAt: raw.voidedAt || null
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
    const categoryOrder = {};
    categoriesState.forEach((c, i) => { categoryOrder[c.name.trim()] = i; });
    const categories = [...new Set(catalog.map((p) => String(p.categoria || 'Sin categoria').trim()))]
        .sort((a, b) => (categoryOrder[a] ?? 999) - (categoryOrder[b] ?? 999));

    if (select.dataset.listenerAttached !== 'true') {
        select.addEventListener('change', () => {
            posSelectedCategory = select.value;
            renderPosProductsPanel();
        });
        select.dataset.listenerAttached = 'true';
    }

    select.innerHTML = categories.map((cat) => {
        const count = catalog.filter(
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

    const catalog = productsState.length ? productsState : PUBLIC_PRODUCT_CATALOG;
    const categoryProducts = catalog
        .filter((p) => String(p.categoria || '').trim() === posSelectedCategory && String(p.estado || 'active').trim() === 'active')
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

    // Combos con papas y bebidas → selector de personas con precios fijos
    if (normCat.includes('papas')) {
        openComboConPapasPosModal(productId, productName, selectedCategory);
        return;
    }

    // Burger Clásica Normal → opciones de tamaño y cantidad de carne
    if (normCat.includes('burger clasicas') && normalizeCategoryKey(productName).includes('normal')) {
        openBurgerClasicasPosModal(productId, productName);
        return;
    }

    // Otros combos siguen con su modal propio
    if (isComboCategory(selectedCategory)) {
        openComboBeverageModal(productId, productName, productPrice, selectedCategory);
        return;
    }

    // Verificar acompañantes: primero a nivel de producto, luego por categoría
    const cfg = menuUpgradesConfig || DEFAULT_UPGRADES_CONFIG;
    {
        const catalog = productsState.length ? productsState : PUBLIC_PRODUCT_CATALOG;
        const productData = catalog.find((p) => p.id === productId);
        const prodAcomp = productData && productData.acompanantes;

        if (prodAcomp && prodAcomp.activo && Array.isArray(prodAcomp.ids) && prodAcomp.ids.length > 0) {
            // Nivel producto: filtrar sólo los acompañantes activados para este producto
            const filteredOpts = (cfg.opciones || []).filter((o) => o.activo && prodAcomp.ids.includes(o.id));
            if (filteredOpts.length > 0) {
                openPosUpgradeSheet(productId, productName, productPrice, filteredOpts);
                return;
            }
        } else {
            // Nivel categoría: usar IDs específicos de la categoría si están configurados
            const appliesTo = (cfg.categorias_aplica || []).map((c) => c.toUpperCase());
            if (appliesTo.includes(selectedCategory.toUpperCase())) {
                const catIdsMap = cfg.categorias_ids || {};
                const catIds = catIdsMap[selectedCategory] || catIdsMap[selectedCategory.toUpperCase()] || [];
                const filteredOpts = (cfg.opciones || []).filter(
                    (o) => o.activo && (catIds.length === 0 || catIds.includes(o.id))
                );
                if (filteredOpts.length > 0) {
                    openPosUpgradeSheet(productId, productName, productPrice, filteredOpts);
                    return;
                }
            }
        }
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
            addProductToPosOrder(
                `${String(productId).trim()}::${opt.label.replace(/\s+/g, '_')}`,
                `${productName} - ${opt.label}`,
                opt.price,
                note
            );
            overlay.remove();
        });
        optGrid.appendChild(btn);
    });

    card.appendChild(header);
    card.appendChild(secLabel);
    card.appendChild(optGrid);
    card.appendChild(noteRow);
    overlay.appendChild(card);

    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
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

    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
}

function addProductToPosOrder(productId, productName, productPrice, note = '') {
    productId = String(productId || '').trim();
    productName = String(productName || 'Producto').trim();
    productPrice = Number(productPrice || 0);
    note = String(note || '').trim();

    if (!productId) return;

    const category = posSelectedCategory || 'Sin categoria';

    // itemKey determinístico por (productId + nota) → ítems con misma nota se fusionan,
    // ítems con nota diferente (ej. "Combo" vs "Solo") quedan separados automáticamente.
    const itemKey = note ? `${productId}::${note}` : productId;
    const existing = internalOrderItems.find((item) => item.itemKey === itemKey);

    if (existing) {
        existing.quantity = Number(existing.quantity || 0) + 1;
        existing.subtotal = Number(existing.quantity) * existing.unitPrice;
    } else {
        internalOrderItems.push({
            itemKey,
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

    itemsContainer.innerHTML = internalOrderItems
        .map((item) => `
            <div class="pos-item-row" data-item-key="${escapeHtml(item.itemKey)}">
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
                    <div class="pos-item-price">${formatMoney(Number(item.subtotal || 0))}</div>
                    <button type="button" class="pos-item-remove" data-item-key="${escapeHtml(item.itemKey)}">&times;</button>
                </div>
            </div>
        `)
        .join('');

    if (itemsContainer.dataset.listenerAttached !== 'true') {
        itemsContainer.addEventListener('click', (event) => {
            const commentBtn = event.target.closest('.pos-item-comment-btn');
            if (commentBtn) {
                const key = commentBtn.dataset.itemKey;
                const item = internalOrderItems.find((i) => i.itemKey === key);
                if (item) _openPosNoteModal(item, key, itemsContainer);
                return;
            }

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

function _posAddWithComment(productId, productName, price, note) {
    const comment = String(document.getElementById('posUpgradeComment')?.value || '').trim();
    const fullNote = [note, comment].filter(Boolean).join(' — ');
    addProductToPosOrder(productId, productName, price, fullNote || undefined);
}

function openPosUpgradeSheet(productId, productName, productPrice, filteredOpts = null) {
    _posUpgradePending = { productId, productName, productPrice, filteredOpts };
    const overlay = document.getElementById('posUpgradeOverlay');
    if (!overlay) return;
    const commentInput = document.getElementById('posUpgradeComment');
    if (commentInput) commentInput.value = '';
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
    const activeOpts = (_posUpgradePending && _posUpgradePending.filteredOpts
        ? _posUpgradePending.filteredOpts.filter((o) => o.activo_pos !== false)
        : (cfg.opciones || []).filter((o) => o.activo && o.activo_pos !== false)
    ).sort((a, b) => (a.orden || 99) - (b.orden || 99));

    const priceLabel = (opt) => {
        if (opt.tiene_variantes && (opt.variantes || []).length > 0) {
            const min = Math.min(...opt.variantes.map((v) => Number(v.precio_extra || 0)));
            return `desde +${formatMoney(min)}`;
        }
        return `+${formatMoney(Number(opt.precio || 0))}`;
    };

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
                <span class="pos-upgrade-opt-price">${priceLabel(opt)}</span>
            </button>`).join('')}
        </div>`;

    body.querySelector('#posUpgradeSolo')?.addEventListener('click', () => {
        const { productId, productName, productPrice } = _posUpgradePending;
        _posAddWithComment(productId, productName, productPrice);
        closePosUpgradeSheet();
    });

    body.querySelectorAll('.pos-upgrade-opt[data-opt-id]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const opt = (cfg.opciones || []).find((o) => o.id === btn.dataset.optId);
            if (!opt) return;
            if (opt.tiene_variantes && (opt.variantes || []).length > 0) {
                renderPosUpgradeStep2(opt);
            } else if (opt.incluye_bebida && (cfg.sabores_bebida || []).length > 0) {
                // compatibilidad con datos legados
                _renderPosLegacyFlavors(opt, cfg.sabores_bebida);
            } else {
                const { productId, productName, productPrice } = _posUpgradePending;
                _posAddWithComment(productId, productName, productPrice + Number(opt.precio || 0), opt.nombre);
                closePosUpgradeSheet();
            }
        });
    });
}

function renderPosUpgradeStep2(selectedOpt) {
    const body = document.getElementById('posUpgradeBody');
    const titleEl = document.getElementById('posUpgradeTitle');
    if (!body) return;
    if (titleEl) titleEl.textContent = `${escapeHtml(selectedOpt.nombre)} — ¿Qué tamaño?`;

    const variantes = (selectedOpt.variantes || []);
    body.innerHTML = `
        <div class="pos-upgrade-label">${escapeHtml(selectedOpt.nombre)}: elige la variante</div>
        <div class="pos-upgrade-options">
            ${variantes.map((v) => `
            <button type="button" class="pos-upgrade-opt" data-v-id="${escapeHtml(v.id)}">
                <div>
                    <div class="pos-upgrade-opt-name">${escapeHtml(v.nombre)}</div>
                </div>
                <span class="pos-upgrade-opt-price">+${formatMoney(Number(v.precio_extra || 0))}</span>
            </button>`).join('')}
        </div>
        <button type="button" class="pos-upgrade-back-btn" id="posUpgradeBackBtn">← Volver</button>`;

    body.querySelectorAll('.pos-upgrade-opt[data-v-id]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const variant = variantes.find((v) => v.id === btn.dataset.vId);
            if (!variant) return;
            if ((variant.sub_variantes || []).length > 0) {
                renderPosUpgradeStep3(selectedOpt, variant);
            } else {
                const { productId, productName, productPrice } = _posUpgradePending;
                const extra = Number(selectedOpt.precio || 0) + Number(variant.precio_extra || 0);
                const note = `${selectedOpt.nombre} – ${variant.nombre}`;
                _posAddWithComment(productId, productName, productPrice + extra, note);
                closePosUpgradeSheet();
            }
        });
    });
    body.querySelector('#posUpgradeBackBtn')?.addEventListener('click', renderPosUpgradeStep1);
}

function renderPosUpgradeStep3(selectedOpt, selectedVariant) {
    const body = document.getElementById('posUpgradeBody');
    const titleEl = document.getElementById('posUpgradeTitle');
    if (!body) return;
    if (titleEl) titleEl.textContent = `${escapeHtml(selectedVariant.nombre)} — ¿Qué sabor?`;

    const subs = selectedVariant.sub_variantes || [];
    body.innerHTML = `
        <div class="pos-upgrade-label">${escapeHtml(selectedOpt.nombre)} · ${escapeHtml(selectedVariant.nombre)}: elige el sabor</div>
        <div class="pos-flavors-grid">
            ${subs.map((s) => `
            <button type="button" class="pos-flavor-btn" data-sub="${escapeHtml(s)}">${escapeHtml(s)}</button>`).join('')}
        </div>
        <button type="button" class="pos-upgrade-back-btn" id="posUpgradeBackBtn">← Volver</button>`;

    body.querySelectorAll('.pos-flavor-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            const { productId, productName, productPrice } = _posUpgradePending;
            const sub = btn.dataset.sub;
            const extra = Number(selectedOpt.precio || 0) + Number(selectedVariant.precio_extra || 0);
            const note = sub === 'Sin bebida'
                ? `${selectedOpt.nombre} – ${selectedVariant.nombre}`
                : `${selectedOpt.nombre} – ${selectedVariant.nombre} (${sub})`;
            _posAddWithComment(productId, productName, productPrice + extra, note);
            closePosUpgradeSheet();
        });
    });
    body.querySelector('#posUpgradeBackBtn')?.addEventListener('click', () => renderPosUpgradeStep2(selectedOpt));
}

function _renderPosLegacyFlavors(selectedOpt, sabores) {
    const body = document.getElementById('posUpgradeBody');
    const titleEl = document.getElementById('posUpgradeTitle');
    if (!body) return;
    if (titleEl) titleEl.textContent = '¿Qué bebida quieres?';
    body.innerHTML = `
        <div class="pos-upgrade-label">${escapeHtml(selectedOpt.nombre)}: elige tu bebida</div>
        <div class="pos-flavors-grid">
            ${sabores.map((s) => `
            <button type="button" class="pos-flavor-btn" data-flavor="${escapeHtml(s)}">${escapeHtml(s)}</button>`).join('')}
        </div>
        <button type="button" class="pos-upgrade-back-btn" id="posUpgradeBackBtn">← Volver</button>`;
    body.querySelectorAll('.pos-flavor-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            const { productId, productName, productPrice } = _posUpgradePending;
            const f = btn.dataset.flavor;
            const note = f === 'Sin bebida' ? selectedOpt.nombre : `${selectedOpt.nombre} (${f})`;
            _posAddWithComment(productId, productName, productPrice + Number(selectedOpt.precio || 0), note);
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

function renderPosTicketsList() {
    const list = document.getElementById('posTicketsList');
    if (!list) return;
    // Solo mostrar tickets con items — los tickets vacíos (en edición) no aparecen en la lista
    const visibleTickets = posTickets.filter((t) => t.items?.length > 0);
    if (!visibleTickets.length) {
        list.innerHTML = '<p style="text-align:center;color:#b8c8e8;padding:32px 16px;font-size:0.95rem;">Sin tickets guardados por el momento</p>';
        _posSelectedTicketIds.clear();
        _refreshTicketActionBar();
        return;
    }
    list.innerHTML = visibleTickets.map((ticket) => {
        const subtotal = ticket.items.reduce((sum, item) => sum + Number(item.subtotal || 0), 0);
        const itemCount = ticket.items.reduce((sum, i) => sum + Number(i.quantity || 0), 0);
        const isActive = ticket.id === posActiveTicketId;
        const isSelected = _posSelectedTicketIds.has(ticket.id);
        const typeLabels = { mesa: '&#9632; Mesa', retiro: '&#8599; Recoger', domicilio: '&#8962; Domicilio' };
        const typeBadge = ticket.orderType ? `<span class="pos-ticket-type-badge">${typeLabels[ticket.orderType] || ticket.orderType}</span>` : '';
        const classes = ['pos-ticket-item', isActive ? 'active-ticket' : '', isSelected ? 'selected-ticket' : ''].filter(Boolean).join(' ');
        return `<div class="${classes}" data-ticket-id="${escapeHtml(ticket.id)}">
            <div class="pos-ticket-check" data-check-id="${escapeHtml(ticket.id)}">&#10003;</div>
            <div class="pos-ticket-info">
                <div class="pos-ticket-name">${escapeHtml(ticket.label)}${typeBadge}</div>
                <div class="pos-ticket-meta">${itemCount} ${itemCount === 1 ? 'item' : 'items'}</div>
            </div>
            <div class="pos-ticket-total">${formatMoney(subtotal)}</div>
            <button type="button" class="pos-ticket-edit-inline" data-edit-ticket-id="${escapeHtml(ticket.id)}" title="Editar tipo de pedido">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
            </button>
            <button type="button" class="pos-ticket-send-inline" data-send-ticket-id="${escapeHtml(ticket.id)}" title="Enviar a recepción">Enviar</button>
            <button type="button" class="pos-ticket-del-inline" data-del-ticket-id="${escapeHtml(ticket.id)}" title="Eliminar ticket">🗑</button>
        </div>`;
    }).join('');

    list.querySelectorAll('.pos-ticket-item').forEach((item) => {
        // Click en el check → seleccionar/deseleccionar
        const checkEl = item.querySelector('.pos-ticket-check');
        checkEl?.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = checkEl.dataset.checkId;
            if (_posSelectedTicketIds.has(id)) {
                _posSelectedTicketIds.delete(id);
                item.classList.remove('selected-ticket');
            } else {
                _posSelectedTicketIds.add(id);
                item.classList.add('selected-ticket');
            }
            _refreshTicketActionBar();
        });
        // Botón editar inline → cambiar tipo/mesa del ticket
        const editBtn = item.querySelector('.pos-ticket-edit-inline');
        editBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = editBtn.dataset.editTicketId;
            switchPosTicket(id);
            openPosTicketSetupModal(true);
        });

        // Botón enviar inline → pasar directamente a recepción de pedidos
        const sendBtn = item.querySelector('.pos-ticket-send-inline');
        sendBtn?.addEventListener('click', async (e) => {
            e.stopPropagation();
            const id = sendBtn.dataset.sendTicketId;
            const ticket = posTickets.find((t) => t.id === id);
            if (!ticket) return;
            // Guardar items del ticket activo actual antes de cambiar
            const current = posTickets.find((t) => t.id === posActiveTicketId);
            if (current) current.items = [...internalOrderItems];
            // Activar el ticket a enviar
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
        });

        // Botón eliminar inline → confirmar y borrar sin necesidad de seleccionar
        const delBtn = item.querySelector('.pos-ticket-del-inline');
        delBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = delBtn.dataset.delTicketId;
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
        });

        // Click en la tarjeta → abrir ticket (solo si no hay selección activa)
        item.addEventListener('click', (e) => {
            if (e.target.closest('.pos-ticket-check') || e.target.closest('.pos-ticket-del-inline') || e.target.closest('.pos-ticket-edit-inline') || e.target.closest('.pos-ticket-send-inline')) return;
            if (_posSelectedTicketIds.size > 0) {
                // En modo selección, el click en la tarjeta también selecciona/deselecciona
                const id = item.dataset.ticketId;
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
            switchPosTicket(item.dataset.ticketId);
        });
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

async function saveAdminOrderQuick(config = {}) {
    if (!internalOrderItems.length) {
        showNotice('Agrega al menos un producto al pedido.', 'error');
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
                subtotal: Number(item.subtotal || 0)
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

        // Recarga solo pedidos (no todas las colecciones) para no saturar Firestore
        await fetchOrders();
        renderOrders();
        renderSalesSummaries();

        // Eliminar el ticket procesado de Firestore y cerrar POS
        const _processedTicketId = posActiveTicketId;
        deletePosTicketFromFirestore(_processedTicketId);
        posTickets = posTickets.filter((t) => t.id !== _processedTicketId);
        closeInternalOrderModal();
        showNotice(isEditing ? 'Pedido actualizado.' : 'Pedido enviado a recepción.', 'ok');
    } catch (error) {
        showNotice(`Error al guardar: ${error.message || 'error'}`, 'error');
    } finally {
        if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'ENVIAR TICKET'; }
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
            subtotal: Number(item.subtotal || 0)
        }));

        // Preserve original order data so saveAdminOrderQuick can update in-place
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

        // Pre-fill ticket config so save goes straight through without opening the setup modal
        posTicketConfig = {
            orderType: order.orderType,
            mesaNumber: order.mesaNumber || null,
            customerName: order.customerName || '',
            customerPhone: order.customerPhone || '',
            deliveryAddress: order.deliveryAddress || order.customerAddress || '',
            deliveryFee: order.deliveryFee ?? null
        };

        if (selectedOrderId === order.id) selectedOrderId = null;

        openInternalOrderModal();

        internalOrderItems = posItems;
        const currentTicket = posTickets.find((t) => t.id === posActiveTicketId);
        if (currentTicket) {
            currentTicket.items = posItems;
            currentTicket.label = `Editando #${order.code}`;
        }
        const labelEl = document.getElementById('posActiveTicketLabel');
        if (labelEl) labelEl.textContent = `Editando #${order.code}`;

        renderPosOrderItems();
        renderPosTotals();
        renderPosBottomBar();
        showNotice(`Pedido #${order.code} cargado para edición.`, 'ok');
    } catch (error) {
        showNotice(`Error al cargar el pedido: ${error.message || 'error'}`, 'error');
    }
}

function closeInternalOrderModal(clearCurrentTicket = false) {
    if (!internalOrderModal) return;

    if (clearCurrentTicket) {
        // Ticket procesado: eliminar de Firestore y activar el siguiente
        const processedId = posActiveTicketId;
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
            updatedAt: firestoreNow(),
            paidAt: firestoreNow()
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
    editProductImageUrlInput.value = product.image_url || '';

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
                            <div style="display:flex;gap:16px;margin-top:10px;flex-wrap:wrap;">
                                <label style="display:flex;align-items:center;gap:6px;font-size:0.78rem;color:#eef4ff;cursor:pointer;">
                                    <input type="checkbox" id="cpefActiveMenu" ${ep.estado !== 'paused' ? 'checked' : ''}> Activo en menú
                                </label>
                                <label style="display:flex;align-items:center;gap:6px;font-size:0.78rem;color:#eef4ff;cursor:pointer;">
                                    <input type="checkbox" id="cpefActivePos" ${ep.visible_pos !== false ? 'checked' : ''}> Activo en POS
                                </label>
                            </div>
                            ${_buildCpefAcompHtml(ep)}
                            <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;">
                                <button type="button" class="section-save-btn" id="cpefSaveBtn">Guardar</button>
                                <button type="button" class="ghost-button" id="cpefCancelBtn">Cancelar</button>
                            </div>
                        </div>`;
                    })() : ''}`
                    : '<p style="font-size:0.8rem;color:var(--admin-muted);margin:4px 0;">Sin productos aún</p>'}
            </div>
            ${_buildCatAcompHtml(category)}
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px;">
                <button type="button" class="section-save-btn" id="catDetailSaveBtn">Guardar</button>
            </div>
        </div>
    `;

    categoryDetailPanel.querySelector('#catAcompActivo')?.addEventListener('change', (e) => {
        const list = categoryDetailPanel.querySelector('#catAcompList');
        if (list) list.style.display = e.target.checked ? 'block' : 'none';
    });

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

    // Toggle show/hide lista de acompañantes
    const acompToggle = categoryDetailPanel.querySelector('#cpefAcompActivo');
    const acompList = categoryDetailPanel.querySelector('#cpefAcompList');
    if (acompToggle && acompList) {
        acompToggle.addEventListener('change', () => {
            acompList.style.display = acompToggle.checked ? 'block' : 'none';
        });
    }
}

async function _saveCategoryFromDetail(categoryId) {
    const nameInput = document.getElementById('catDetailName');
    const activeInput = document.getElementById('catDetailActive');
    const acompActivoInput = document.getElementById('catAcompActivo');
    const newName = nameInput ? nameInput.value.trim() : '';
    if (!newName) { showNotice('El nombre no puede estar vacío.', 'error'); return; }
    try {
        const existing = categoriesState.find((c) => c.id === categoryId);
        const oldName = existing ? existing.name : newName;
        await firebaseDb.collection('categorias').doc(categoryId).update({
            name: newName,
            image_url: existing ? (existing.image_url || '') : '',
            active: activeInput ? activeInput.checked : true,
            updated_at: firestoreNow()
        });

        // Guardar config de acompañantes para esta categoría
        if (acompActivoInput !== null && menuUpgradesConfig) {
            const acompActivo = acompActivoInput.checked;
            const catAcompList = document.getElementById('catAcompList');
            const selectedIds = catAcompList
                ? Array.from(catAcompList.querySelectorAll('input[name="catAcompId"]:checked')).map((c) => c.value)
                : [];

            // Actualizar categorias_aplica
            const aplica = (menuUpgradesConfig.categorias_aplica || []).filter(
                (c) => c.toUpperCase() !== oldName.toUpperCase() && c.toUpperCase() !== newName.toUpperCase()
            );
            if (acompActivo) aplica.push(newName);
            menuUpgradesConfig.categorias_aplica = aplica;

            // Actualizar categorias_ids
            if (!menuUpgradesConfig.categorias_ids) menuUpgradesConfig.categorias_ids = {};
            if (oldName !== newName) delete menuUpgradesConfig.categorias_ids[oldName];
            if (acompActivo) {
                menuUpgradesConfig.categorias_ids[newName] = selectedIds;
            } else {
                delete menuUpgradesConfig.categorias_ids[newName];
            }

            await saveMenuUpgradesConfig(menuUpgradesConfig);
        }

        _selectedCategoryId = categoryId;
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
        <p style="margin:0 0 8px;font-size:0.78rem;font-weight:600;color:var(--admin-muted);text-transform:uppercase;letter-spacing:.5px;">Acompañantes (POS)</p>
        <label style="display:flex;align-items:center;justify-content:space-between;padding:9px 12px;background:rgba(255,122,26,0.08);border:1px solid rgba(255,122,26,0.22);border-radius:10px;cursor:pointer;margin-bottom:6px;">
            <span style="font-size:0.82rem;font-weight:600;color:#eef4ff;">Activar acompañantes para esta categoría</span>
            <input type="checkbox" id="catAcompActivo" ${isActive ? 'checked' : ''} style="width:17px;height:17px;accent-color:#ff7a00;cursor:pointer;">
        </label>
        <div id="catAcompList" style="display:${isActive ? 'block' : 'none'};border:1px solid rgba(255,122,26,0.22);border-radius:10px;overflow:hidden;">${items}</div>
    </div>`;
}

function _buildCpefAcompHtml(ep) {
    const cfg = menuUpgradesConfig || DEFAULT_UPGRADES_CONFIG;
    const opciones = (cfg.opciones || []).filter((o) => o.id && o.nombre);
    if (opciones.length === 0) return '';

    const savedAcomp = ep.acompanantes || {};
    const acompActivo = savedAcomp.activo === true;
    const savedIds = Array.isArray(savedAcomp.ids) ? savedAcomp.ids : [];

    const listStyle = `display:${acompActivo ? 'block' : 'none'};margin-top:8px;border:1px solid rgba(255,122,26,0.22);border-radius:10px;overflow:hidden;`;

    const items = opciones.map((opt) => {
        const checked = savedIds.includes(opt.id) ? 'checked' : '';
        const precioLabel = opt.precio > 0 ? `+$${Number(opt.precio).toLocaleString('es-CO')}` : 'Incluido';
        const detalle = opt.detalle ? `<span style="font-size:0.72rem;color:rgba(200,210,230,0.5);margin-top:1px;display:block;">${opt.detalle}</span>` : '';
        return `<label style="display:flex;align-items:center;gap:10px;padding:9px 12px;border-bottom:1px solid rgba(255,255,255,0.06);cursor:pointer;background:rgba(255,255,255,0.02);">
            <input type="checkbox" name="cpefAcompId" value="${opt.id}" ${checked} style="width:16px;height:16px;accent-color:#ff7a00;flex-shrink:0;cursor:pointer;">
            <div style="flex:1;min-width:0;">
                <span style="font-size:0.85rem;font-weight:600;color:#eef4ff;">${opt.nombre}</span>
                ${detalle}
            </div>
            <span style="font-size:0.80rem;font-weight:700;color:#ff7a00;white-space:nowrap;">${precioLabel}</span>
        </label>`;
    }).join('');

    return `<div style="margin-top:12px;">
        <label style="display:flex;align-items:center;justify-content:space-between;padding:9px 12px;background:rgba(255,122,26,0.08);border:1px solid rgba(255,122,26,0.22);border-radius:10px;cursor:pointer;">
            <span style="font-size:0.82rem;font-weight:600;color:#eef4ff;">Activar acompañantes</span>
            <input type="checkbox" id="cpefAcompActivo" ${acompActivo ? 'checked' : ''} style="width:17px;height:17px;accent-color:#ff7a00;cursor:pointer;">
        </label>
        <div id="cpefAcompList" style="${listStyle}">${items}</div>
    </div>`;
}

async function _saveProductInline(productId, categoryId) {
    const nameInput = document.getElementById('cpefName');
    const priceInput = document.getElementById('cpefPrice');
    const descInput = document.getElementById('cpefDesc');
    const activeMenuInput = document.getElementById('cpefActiveMenu');
    const activePosInput = document.getElementById('cpefActivePos');
    const fileInput = document.getElementById('cpefFileInput');
    const acompActivoInput = document.getElementById('cpefAcompActivo');
    const acompListEl = document.getElementById('cpefAcompList');

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

        const acompActivo = acompActivoInput ? acompActivoInput.checked : false;
        const acompIds = acompListEl
            ? Array.from(acompListEl.querySelectorAll('input[name="cpefAcompId"]:checked')).map((cb) => cb.value)
            : [];
        const acompanantes = { activo: acompActivo, ids: acompIds };

        await firebaseDb.collection('productos').doc(productId).update({
            nombre: name,
            precio,
            descripcion,
            estado,
            visible_pos: visiblePos,
            image_url: imageUrl,
            acompanantes,
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

function renderMetricsUsers() {
    const list = document.getElementById('metricsUsersList');
    if (!list) return;

    const users = (clientsState || []).slice().sort((a, b) =>
        (b.totalOrders || 0) - (a.totalOrders || 0)
    );

    // KPIs de resumen
    const withOrders = users.filter((u) => (u.totalOrders || 0) > 0);
    const avgOrders = users.length
        ? (users.reduce((s, u) => s + (u.totalOrders || 0), 0) / users.length).toFixed(1)
        : '0';
    const totalSpent = users.reduce((s, u) => s + (u.lastOrderTotal || 0), 0);

    const setKpi = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setKpi('metricsUserCount', users.length.toLocaleString('es-CO'));
    setKpi('metricsUserWithOrders', withOrders.length.toLocaleString('es-CO'));
    setKpi('metricsUserAvgOrders', avgOrders);
    setKpi('metricsUserTotalSpent', formatMoney(totalSpent));

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

    list.innerHTML = users.map((u) => {
        const orders = u.totalOrders || 0;
        const since = u.firstOrderAt
            ? new Date(u.firstOrderAt.seconds ? u.firstOrderAt.seconds * 1000 : u.firstOrderAt).toLocaleDateString('es-CO', { year: 'numeric', month: 'short' })
            : '—';
        const orderChip = orders > 0
            ? `<span class="metrics-chip hi">${orders} compra${orders !== 1 ? 's' : ''}</span>`
            : `<span class="metrics-chip">Sin compras</span>`;
        const addrCount = (u.savedAddresses || []).length;
        const addrChip = addrCount > 0 ? `<span class="metrics-chip">${addrCount} dirección${addrCount !== 1 ? 'es' : ''}</span>` : '';
        return `
        <div class="metrics-user-row" data-user-phone="${escapeHtml(u.customerPhone || '')}" data-user-id="${escapeHtml(u.id || '')}">
            <div class="metrics-user-main">
                <div class="metrics-user-name">${escapeHtml(u.customerName || 'Sin nombre')}</div>
                <div class="metrics-user-phone">${escapeHtml(u.customerPhone || '—')}</div>
                <div class="metrics-user-chips">${orderChip}${addrChip}</div>
            </div>
            <div class="metrics-user-side">
                <div class="metrics-user-total">${u.lastOrderTotal ? formatMoney(u.lastOrderTotal) : '—'}</div>
                <div class="metrics-user-since">desde ${since}</div>
            </div>
        </div>
        <div class="metrics-user-detail" id="metricsDetail_${escapeHtml(u.id || u.customerPhone || '')}" hidden></div>`;
    }).join('');

    // Click para expandir detalle
    list.querySelectorAll('.metrics-user-row').forEach((row) => {
        row.addEventListener('click', () => _toggleMetricsUserDetail(row));
    });
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
    document.querySelectorAll('.metrics-user-row').forEach((r) => r.classList.remove('is-expanded'));

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
    </div>`;
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
    if (order.status === 'pendiente') {
        return 'unread';
    }

    if (order.orderType === 'mesa') {
        return 'mesa';
    }

    return order.orderType === 'domicilio' ? 'delivery' : 'takeaway';
}

function getOrderTypeLabel(order) {
    if (order.orderType === 'domicilio') return 'Domicilio';
    if (order.orderType === 'mesa') return order.mesaNumber ? `Mesa ${order.mesaNumber}` : 'Mesa';
    return 'Llevar';
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
    const method = String(order.paymentMethod || '').toLowerCase();
    const sub = String(order.paymentSubMethod || '').toLowerCase();

    const subLabels = { nequi: 'Nequi', bold: 'Bold', bancolombia: 'Bancolombia' };
    const subStr = subLabels[sub] || '';

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
                    <div class="ticket-section-title">${order.orderType === 'domicilio' ? 'Direccion de entrega' : order.orderType === 'mesa' ? `Mesa ${order.mesaNumber || ''}`.trim() : 'Retiro en local'}</div>
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
        card.innerHTML = `
            <div class="koc-body">
                <span class="koc-name">${escapeHtml(order.customerName || 'Sin nombre')}</span>
                <span class="koc-total">${escapeHtml(formatMoney(getOrderDisplayTotal(order)))}</span>
            </div>
            <div class="koc-header">
                <strong class="koc-code">#${escapeHtml(order.code)}</strong>
                <span class="koc-time">${escapeHtml(formatOrderTime(order.deliveredAt || order.updatedAt || order.createdAt))}</span>
            </div>
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
                <span class="order-wait-timer">${escapeHtml(formatLiveDuration(order.courierRequestedAt || order.updatedAt || order.createdAt))}</span>
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

    if (isMesaOrder && !isUnreadOrder && order.status !== 'entregado') {
        // Layout mesa: [ Servido/Cobrar | ✎ | 🗑 ]
        const mainLabel = order.status === 'servido' ? 'Cobrar pedido' : 'Pedido servido';
        const mainAction = order.status === 'servido' ? 'entregado' : 'servido';
        const mainClass = order.status === 'servido' ? 'order-action-btn-receive' : 'order-action-btn-delivered';
        const editBtn = isPosAdminOrder
            ? `<button type="button" class="order-action-btn order-action-btn-edit koa-icon-btn" data-order-card-action="editar_pos" data-order-id="${order.id}" title="Editar pedido">&#9998;</button>`
            : '';
        actionsMarkup = `<div class="kanban-order-actions kanban-order-actions--mesa">
            <button type="button" class="order-action-btn ${mainClass} koa-mesa-main" data-order-card-action="${mainAction}" data-order-id="${order.id}">${mainLabel}</button>
            <div class="koa-mesa-icons">
                ${editBtn}
                <button type="button" class="order-action-btn order-action-btn-delete koa-icon-btn" data-order-card-action="eliminar" data-order-id="${order.id}" title="Eliminar pedido">&#128465;</button>
            </div>
        </div>`;
    } else if (isDeliveryOrder && !isUnreadOrder && order.status !== 'entregado') {
        // Layout domicilio: [ Pedir domiciliario → Pedido entregado | 💰? | ✎ | 🗑 ]
        const canRequestCourier = order.status !== 'esperando_domiciliario' && order.status !== 'camino';
        const mainLabel = canRequestCourier ? 'Pedir domiciliario' : 'Pedido entregado';
        const mainAction = canRequestCourier ? 'esperando_domiciliario' : 'entregado';
        const mainClass = canRequestCourier ? '' : 'order-action-btn-delivered';
        const isPaid = order.paymentMethod && order.paymentMethod !== 'pendiente';
        const cobrarBtn = !isPaid
            ? `<button type="button" class="order-action-btn order-action-btn-receive koa-icon-btn" data-order-card-action="cobrar_domicilio" data-order-id="${order.id}" title="Cobrar pedido">&#128176;</button>`
            : '';
        const editBtn = isPosAdminOrder
            ? `<button type="button" class="order-action-btn order-action-btn-edit koa-icon-btn" data-order-card-action="editar_pos" data-order-id="${order.id}" title="Editar pedido">&#9998;</button>`
            : '';
        actionsMarkup = `<div class="kanban-order-actions kanban-order-actions--mesa">
            <button type="button" class="order-action-btn ${mainClass} koa-mesa-main" data-order-card-action="${mainAction}" data-order-id="${order.id}">${mainLabel}</button>
            <div class="koa-mesa-icons">
                ${cobrarBtn}${editBtn}
                <button type="button" class="order-action-btn order-action-btn-delete koa-icon-btn" data-order-card-action="eliminar" data-order-id="${order.id}" title="Eliminar pedido">&#128465;</button>
            </div>
        </div>`;
    } else if (isPickupOrder && !isUnreadOrder && order.status !== 'entregado') {
        // Layout para llevar: [ Pedido listo → Pedido entregado | ✎ | 🗑 ]
        const isReady = order.status === 'listo_recoger';
        const mainLabel = isReady ? 'Pedido entregado' : 'Pedido listo';
        const mainAction = isReady ? 'entregado' : 'listo_recoger';
        const mainClass = isReady ? 'order-action-btn-delivered' : 'order-action-btn-ready';
        const editBtn = isPosAdminOrder
            ? `<button type="button" class="order-action-btn order-action-btn-edit koa-icon-btn" data-order-card-action="editar_pos" data-order-id="${order.id}" title="Editar pedido">&#9998;</button>`
            : '';
        actionsMarkup = `<div class="kanban-order-actions kanban-order-actions--mesa">
            <button type="button" class="order-action-btn ${mainClass} koa-mesa-main" data-order-card-action="${mainAction}" data-order-id="${order.id}">${mainLabel}</button>
            <div class="koa-mesa-icons">
                ${editBtn}
                <button type="button" class="order-action-btn order-action-btn-delete koa-icon-btn" data-order-card-action="eliminar" data-order-id="${order.id}" title="Eliminar pedido">&#128465;</button>
            </div>
        </div>`;
    } else {
        // Layout compacto para pedidos pendientes: [ Cobrar pedido (flex) | ✎ | 🗑 ]
        const receiveLabel = '💰 Cobrar pedido';
        const editBtn = showEditPosAction
            ? `<button type="button" class="order-action-btn order-action-btn-edit koa-icon-btn" data-order-card-action="editar_pos" data-order-id="${order.id}" title="Editar pedido">&#9998;</button>`
            : '';
        const viewBtn = showViewTicketAction
            ? `<button type="button" class="order-action-btn order-action-btn-view koa-icon-btn" data-order-card-action="view_ticket" data-order-id="${order.id}" title="Ver ticket">&#128196;</button>`
            : '';
        actionsMarkup = `<div class="kanban-order-actions kanban-order-actions--mesa">
            <button type="button" class="order-action-btn order-action-btn-receive koa-mesa-main" data-order-card-action="recibir_pedido" data-order-id="${order.id}">${receiveLabel}</button>
            <div class="koa-mesa-icons">
                ${viewBtn}${editBtn}
                <button type="button" class="order-action-btn order-action-btn-delete koa-icon-btn" data-order-card-action="eliminar" data-order-id="${order.id}" title="Eliminar pedido">&#128465;</button>
            </div>
        </div>`;
    }

    card.innerHTML = `
        <div class="koc-header">
            <strong class="koc-code">#${escapeHtml(order.code)}</strong>
            <span class="koc-type-badge ${typeClass}">${escapeHtml(getOrderTypeLabel(order))}</span>
            <span class="koc-time">${escapeHtml(formatElapsedTime(order.createdAt))}</span>
        </div>
        <div class="koc-body">
            <span class="koc-name">${escapeHtml(order.customerName || 'Sin nombre')}</span>
            <span class="koc-total">${escapeHtml(formatMoney(getOrderDisplayTotal(order)))}</span>
        </div>
        ${statusRow}
        ${actionsMarkup}
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
        const processedOrders = column.items.filter((o) => o.status === 'entregado');

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

    renderOrderTicket(selectedOrder);
    applyMobileOrdersLane();
    updateOrdersAttentionState();
    renderSalesDayBanner();
    _ptsMarkOccupiedMesas();
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
            _btPrinterDevice = null;
            _btPrinterCharacteristic = null;
            renderBtPrinterStatus('disconnected');
            showNotice('Impresora Bluetooth desconectada.', 'error');
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

function _escNormalize(str) {
    return String(str || '')
        .replace(/[áàâã]/g, 'a').replace(/[ÁÀÂÃ]/g, 'A')
        .replace(/[éèê]/g, 'e').replace(/[ÉÈÊ]/g, 'E')
        .replace(/[íìî]/g, 'i').replace(/[ÍÌÎ]/g, 'I')
        .replace(/[óòôõ]/g, 'o').replace(/[ÓÒÔÕ]/g, 'O')
        .replace(/[úùûü]/g, 'u').replace(/[ÚÙÛÜ]/g, 'U')
        .replace(/ñ/g, 'n').replace(/Ñ/g, 'N')
        .replace(/[¿¡]/g, '');
}

function buildESCPOSData(order) {
    const ESC = 0x1B; const GS = 0x1D; const LF = 0x0A;
    const COLS = 32;
    const bytes = [];
    const pb = (...a) => bytes.push(...a);

    function wl(str) {
        const s = _escNormalize(str).substring(0, COLS);
        for (let i = 0; i < s.length; i++) pb(s.charCodeAt(i) & 0xFF);
        pb(LF);
    }
    function wc(left, right) {
        const l = _escNormalize(left); const r = _escNormalize(right);
        const pad = Math.max(1, COLS - l.substring(0, COLS - r.length - 1).length - r.length);
        wl(l.substring(0, COLS - r.length - 1) + ' '.repeat(pad) + r);
    }
    function sep() { wl('-'.repeat(COLS)); }

    // Init
    pb(ESC, 0x40);
    // Brand — center, bold, double size
    pb(ESC, 0x61, 0x01, ESC, 0x45, 0x01, ESC, 0x21, 0x30);
    wl(brandingState.restaurantName || 'ROAL BURGER');
    pb(ESC, 0x21, 0x00, ESC, 0x45, 0x00);
    wl('Ticket de recepcion');
    pb(ESC, 0x61, 0x00);

    sep();
    wl('Pedido : ' + (order.code || ''));
    wl('Fecha  : ' + formatOrderDate(order.createdAt));
    wl('Hora   : ' + formatOrderTime(order.createdAt));

    sep();
    wl('Cliente: ' + (order.customerName || 'N/A'));
    wl('Tel    : ' + (order.customerPhone || 'N/A'));
    wl('Tipo   : ' + getOrderTypeLabel(order));
    if (order.orderType === 'domicilio' && order.deliveryAddress) {
        wl('Dir: ' + order.deliveryAddress);
    }

    sep();
    pb(ESC, 0x45, 0x01); wc('Producto', 'Total'); pb(ESC, 0x45, 0x00);
    sep();
    for (const item of (order.items || [])) {
        wc(`${item.quantity}x ${item.productName}`, formatMoney(item.subtotal));
        if (item.optionLabel) wl('  ' + item.optionLabel);
        if (item.note) wl('  Nota: ' + item.note);
    }

    sep();
    wc('Subtotal', formatMoney(order.subtotal || 0));
    if (order.orderType === 'domicilio') wc('Domicilio', formatMoney(order.deliveryFee || 0));
    sep();
    pb(ESC, 0x45, 0x01, ESC, 0x21, 0x10);
    wc('TOTAL', formatMoney(getOrderDisplayTotal(order)));
    pb(ESC, 0x21, 0x00, ESC, 0x45, 0x00);

    const cashGiven = Number(order.cashTenderAmount || 0);
    const totalAmt = getOrderDisplayTotal(order);
    if (order.paymentMethod === 'efectivo' && cashGiven > 0) {
        sep();
        wc('Pago con', formatMoney(cashGiven));
        if (cashGiven > totalAmt) wc('Cambio', formatMoney(Number(order.cashChangeAmount || (cashGiven - totalAmt))));
    } else if (order.cashChangeRequired && cashGiven > totalAmt) {
        sep();
        wc('Pago con', formatMoney(cashGiven));
        wc('Cambio', formatMoney(cashGiven - totalAmt));
    }

    pb(ESC, 0x61, 0x01, LF);
    wl('Gracias por elegirnos!');
    if (brandingState.address) wl(brandingState.address);
    pb(LF, LF, LF);
    // Corte completo
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
    if (!_btPrinterCharacteristic) return false;
    const data = buildESCPOSData(order);
    const CHUNK = 20; // MTU BLE mínimo seguro (BLE default es 23 - 3 = 20 bytes de payload)
    try {
        for (let i = 0; i < data.length; i += CHUNK) {
            await _btWriteChunk(_btPrinterCharacteristic, data.slice(i, i + CHUNK));
            await new Promise((r) => setTimeout(r, 80));
        }
        return true;
    } catch (err) {
        showNotice(`Error al imprimir por Bluetooth: ${err.message || 'error desconocido'}`, 'error');
        return false;
    }
}

function openOrderPrintTicket(orderId) {
    const order = ordersState.find((entry) => entry.id === orderId);
    if (!order) {
        showNotice('No se encontro el pedido para imprimir.', 'error');
        return;
    }

    if (_btPrinterCharacteristic) {
        printViaBluetoothESCPOS(order).then((ok) => {
            if (ok) showNotice('Ticket enviado a la impresora.', 'ok');
        });
        return;
    }

    const printArea = document.getElementById('thermalPrintArea');
    if (!printArea) {
        showNotice('Error interno: area de impresion no encontrada.', 'error');
        return;
    }

    printArea.innerHTML = buildThermalTicketMarkup(order, { printMode: true });
    window.print();
    printArea.innerHTML = '';
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
    // reservado para futuras métricas
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
        fetchMenuUpgradesConfig(),
        fetchRecomendadoDiaConfig(),
        fetchHorarioConfig()
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
    renderHorarioForm();
    renderRecomendadoDiaPanel();
    renderOrders();
    renderSalesSummaries();
    renderLedgerBook();
    renderCajaDiaria();
    renderClients();
    renderMessages();
    updateMessagesAttentionState();
    renderMetricsUsers();
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

function openPosTicketSetupModal(configOnly = false) {
    const modal = document.getElementById('posTicketSetupModal');
    if (!modal) return;

    _ptsConfigOnly = configOnly;

    // Pre-poblar desde el ticket activo si existe metadata
    const activeTicket = posTickets.find((t) => t.id === posActiveTicketId);
    const prefill = configOnly && activeTicket ? activeTicket : null;

    // Reset estado
    _ptsSelectedType = prefill?.orderType || null;
    _ptsSelectedMesa = prefill?.mesaNumber || null;
    _ptsSelectedClient = prefill?.customerName ? { name: prefill.customerName, phone: prefill.customerPhone || '' } : null;
    // Si hay cliente prefill, usar tab 'quick' para mostrar los datos
    _ptsActiveTab = (_ptsSelectedClient && configOnly) ? 'quick' : 'none';

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
        else if (configOnly) confirmBtn.textContent = 'Guardar configuración';
        else confirmBtn.textContent = 'Guardar pedido';
    }

    _ptsUpdateConfirmBtn();
    modal.removeAttribute('hidden');
    _ptsMarkOccupiedMesas();
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

    container.innerHTML = matches.map((c) => `
        <div class="pts-result-item" data-pts-client-id="${escapeHtml(c.id || '')}" data-pts-client-name="${escapeHtml(c.customerName || '')}" data-pts-client-phone="${escapeHtml(c.customerPhone || '')}">
            <div class="pts-result-name">${escapeHtml(c.customerName || 'Sin nombre')}</div>
            <div class="pts-result-phone">${escapeHtml(c.customerPhone || '')}</div>
        </div>
    `).join('');
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

// Auto-rellena la sección de dirección según las direcciones guardadas del cliente
function _ptsFillClientAddress(client) {
    const activeTypeBtn = document.querySelector('#posTicketSetupModal .pts-type-btn.active');
    const resolvedType  = activeTypeBtn?.dataset?.ptsType || _ptsSelectedType;
    if (resolvedType !== 'domicilio') return;

    const addresses = Array.isArray(client.savedAddresses)
        ? client.savedAddresses.filter((a) => String(a || '').trim())
        : [];

    const addrInput   = document.getElementById('ptsDeliveryAddress');
    const addrPicker  = document.getElementById('ptsAddressPicker');
    if (!addrInput || !addrPicker) return;

    if (addresses.length === 0) {
        addrPicker.setAttribute('hidden', '');
        addrInput.value = '';
        addrInput.removeAttribute('hidden');
        return;
    }

    if (addresses.length === 1) {
        addrPicker.setAttribute('hidden', '');
        addrInput.removeAttribute('hidden');
        addrInput.value = addresses[0];
        _ptsToggleFeeWrap(true);
        _ptsSuggestDeliveryFee(addresses[0]);
        return;
    }

    // Múltiples direcciones → mostrar picker, ocultar input de texto libre
    addrInput.setAttribute('hidden', '');
    addrInput.value = addresses[0];
    addrPicker.removeAttribute('hidden');
    addrPicker.innerHTML = `
        <p class="pts-addr-picker-label">Selecciona dirección guardada</p>
        ${addresses.map((addr, i) => `
            <div class="pts-addr-chip${i === 0 ? ' active' : ''}" data-addr="${escapeHtml(addr)}">
                ${escapeHtml(addr)}
            </div>
        `).join('')}
    `;

    // Pre-sugerir para la primera dirección y mostrar fee wrap
    _ptsToggleFeeWrap(true);
    _ptsSuggestDeliveryFee(addresses[0]);

    addrPicker.querySelectorAll('.pts-addr-chip').forEach((chip) => {
        chip.addEventListener('click', () => {
            addrPicker.querySelectorAll('.pts-addr-chip').forEach((c) => c.classList.remove('active'));
            chip.classList.add('active');
            addrInput.value = chip.dataset.addr || '';
            document.getElementById('ptsDeliveryFee').value = '';
            _ptsToggleFeeWrap(true);
            _ptsSuggestDeliveryFee(chip.dataset.addr || '');
        });
    });
}

// ── Listeners directos del modal (más robustos que delegación global) ──────────
document.getElementById('ptsCancelBtn')?.addEventListener('click', () => {
    _ptsSaveAndNew = false;
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
        saveAdminOrderQuick(posTicketConfig);
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

// ── Sugerencia de precio de domicilio basada en pedidos anteriores ──────────
const _PTS_FEE_STOPWORDS = new Set(['con','del','los','las','una','por','mas','sin','que','muy','bien','este','ese','esa','esos']);

function _ptsSuggestDeliveryFee(addressText) {
    const addr = String(addressText || '').trim().toLowerCase();
    if (addr.length < 4) { _ptsHideFeeSuggestion(); return; }

    // Tokenizar: palabras de 3+ chars sin stopwords
    const tokens = addr
        .split(/[\s,#\-\/\.]+/)
        .filter((t) => t.length >= 3 && !_PTS_FEE_STOPWORDS.has(t));

    if (!tokens.length) { _ptsHideFeeSuggestion(); return; }

    // Buscar en pedidos de domicilio con deliveryFee > 0
    const candidates = (ordersState || []).filter((o) =>
        o.orderType === 'domicilio' &&
        o.deliveryFee !== null && o.deliveryFee > 0 &&
        o.deliveryAddress
    );
    if (!candidates.length) { _ptsHideFeeSuggestion(); return; }

    // Puntuar cada candidato
    let best = null;
    let bestScore = 0;
    candidates.forEach((o) => {
        const oAddr = o.deliveryAddress.toLowerCase();
        let score = 0;
        tokens.forEach((t) => { if (oAddr.includes(t)) score++; });
        const ts = o.createdAt && typeof o.createdAt.toMillis === 'function' ? o.createdAt.toMillis() : 0;
        const bestTs = best?.createdAt && typeof best.createdAt.toMillis === 'function' ? best.createdAt.toMillis() : 0;
        if (score > bestScore || (score === bestScore && score > 0 && ts > bestTs)) {
            bestScore = score;
            best = o;
        }
    });

    if (!best || bestScore === 0) { _ptsHideFeeSuggestion(); return; }

    _ptsShowFeeSuggestion(best.deliveryFee);
}

// Muestra/oculta el campo de domicilio según si hay dirección escrita
function _ptsToggleFeeWrap(hasAddress) {
    const wrap = document.getElementById('ptsDeliveryFeeWrap');
    if (!wrap) return;
    if (hasAddress) wrap.removeAttribute('hidden');
    else { wrap.setAttribute('hidden', ''); document.getElementById('ptsDeliveryFee').value = ''; }
}

// Rellena el campo de fee solo si está vacío (no sobreescribe lo que ya escribió el usuario)
function _ptsApplyFeeSuggestion(fee) {
    const feeInput = document.getElementById('ptsDeliveryFee');
    if (!feeInput) return;
    if (!feeInput.value || Number(feeInput.value) === 0) {
        feeInput.value = fee;
    }
}

function _ptsShowFeeSuggestion(fee) {
    _ptsApplyFeeSuggestion(fee);
}

function _ptsHideFeeSuggestion() { /* no-op: el campo se mantiene editable */ }

// Listener con debounce en el campo de dirección
let _ptsFeeSearchTimer = null;
document.getElementById('ptsDeliveryAddress')?.addEventListener('input', (e) => {
    const val = e.target.value.trim();
    _ptsToggleFeeWrap(val.length > 0);
    if (val.length > 0) {
        clearTimeout(_ptsFeeSearchTimer);
        _ptsFeeSearchTimer = setTimeout(() => _ptsSuggestDeliveryFee(val), 380);
    }
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

// Guardar ticket activo y abrir uno nuevo en blanco
document.getElementById('posGuardarTicketBtn')?.addEventListener('click', () => {
    if (!internalOrderItems.length) {
        showNotice('Agrega al menos un producto al pedido.', 'warn');
        return;
    }
    const current = posTickets.find((t) => t.id === posActiveTicketId);
    if (current) current.items = internalOrderItems;

    // Si el ticket ya tiene tipo de pedido configurado, guardar en Firestore y cerrar POS
    if (current?.orderType) {
        savePosTicketToFirestore(current);
        closeInternalOrderModal();
        return;
    }

    _ptsSaveAndNew = true;
    openPosTicketSetupModal(true);
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

// ── Menu: pestañas internas (Categorías / Acompañantes / Carrusel / Recomendado)
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
                if (!activeSubTab || activeSubTab.dataset.cajasTab === 'caja-diaria') renderCajaDiaria();
                else renderLibroCierres();
            }
            if (target === 'tickets') _autoLoadTicketsTab();
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
    });
});

if (clientsSearchInput) {
    clientsSearchInput.addEventListener('input', () => {
        clientsSearchTerm = normalizeCategoryKey(clientsSearchInput.value || '');
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
            const ref = await firebaseDb.collection('mensajes').add(newDoc);
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

        activeMobileOrdersLane = String(tab.dataset.mobileOrdersTab || 'pedidos').trim() || 'pedidos';
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
                    // Todos los tipos de pedido pasan por el modal de cobro antes de procesarse
                    openDeliveryPaymentModal(order, true);
                    actionButton.disabled = false;
                    return;
                }

                if (nextStatus === 'cobrar_domicilio') {
                    openDeliveryPaymentModal(order, false);
                    actionButton.disabled = false;
                    return;
                }

                if (nextStatus === 'editar_pos') {
                    await editAdminPosOrder(order);
                    return;
                }

                if (nextStatus === 'eliminar') {
                    const confirmed = window.confirm(`Eliminar el pedido ${order.code}? Esta accion no se puede deshacer.`);
                    if (!confirmed) {
                        return;
                    }

                    await deleteOrder(orderId);
                    await reloadDataAndRender();
                    if (selectedOrderId === orderId) {
                        selectedOrderId = null;
                    }
                    showNotice('Pedido eliminado correctamente.', 'ok');
                    closeUnreadTray();
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

                if (nextStatus === 'servido') {
                    await updateOrder(orderId, { status: 'servido', servidoAt: firestoreNow() });
                    await reloadDataAndRender();
                    showNotice('Pedido marcado como servido.', 'ok');
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
        brandingDirty.markClean();
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
let _dpmOrderTotal = 0;
let _dpmReceiveOrder = false;

function getPaymentMethods() {
    return _paymentMethods.length ? _paymentMethods : DPM_DEFAULT_METHODS;
}

function getEnabledPaymentMethods() {
    return getPaymentMethods().filter((m) => m.enabled !== false);
}

async function loadPaymentMethods() {
    try {
        const doc = await firebaseDb.collection(CONFIG_COLLECTION).doc(PAYMENT_METHODS_DOC_ID).get();
        _paymentMethods = (doc.exists && Array.isArray(doc.data()?.methods))
            ? doc.data().methods
            : [...DPM_DEFAULT_METHODS];
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
        const cashInput = document.getElementById('dpmCashInput');
        if (cashInput) { cashInput.value = ''; cashInput.focus(); }
        document.getElementById('dpmChangeRow')?.setAttribute('hidden', '');
        _dpmCashTender = 0;
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

function _dpmUpdateConfirmState() {
    const btn = document.getElementById('dpmConfirmBtn');
    if (!btn || !_dpmSelectedMethod) { if (btn) btn.disabled = true; return; }
    if (_dpmSelectedMethod === 'efectivo') {
        btn.disabled = !(_dpmCashTender > 0);
    } else {
        const method = getPaymentMethods().find((m) => m.id === _dpmSelectedMethod);
        btn.disabled = method && method.subs.length > 0 ? !_dpmSubMethod : false;
    }
}

function openDeliveryPaymentModal(order, receiveOrder = true) {
    _dpmCurrentOrderId = order.id;
    _dpmOrderTotal = getOrderDisplayTotal(order);
    _dpmSelectedMethod = null;
    _dpmSubMethod = null;
    _dpmCashTender = 0;
    _dpmReceiveOrder = receiveOrder;

    const modal = document.getElementById('deliveryPaymentModal');
    if (!modal) return;

    const _codeEl = document.getElementById('dpmCode');
    if (_codeEl) _codeEl.textContent = `#${order.code || '---'}`;

    const summaryEl = document.getElementById('dpmTicketSummary');
    if (summaryEl) summaryEl.innerHTML = buildThermalTicketMarkup(order, { printMode: true });

    document.getElementById('dpmSubSection')?.setAttribute('hidden', '');
    document.getElementById('dpmSubEfectivo')?.setAttribute('hidden', '');
    document.getElementById('dpmSubChips')?.setAttribute('hidden', '');
    document.getElementById('dpmChangeRow')?.setAttribute('hidden', '');

    const confirmBtn = document.getElementById('dpmConfirmBtn');
    if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.textContent = receiveOrder ? 'Recibir pedido' : 'Registrar pago';
    }

    renderDpmMethodButtons();
    modal.querySelectorAll('.dpm-method-btn').forEach((b) => b.classList.remove('active'));
    modal.removeAttribute('hidden');
}

function closeDeliveryPaymentModal() {
    document.getElementById('deliveryPaymentModal')?.setAttribute('hidden', '');
    _dpmCurrentOrderId = null;
    _dpmSelectedMethod = null;
    _dpmSubMethod = null;
    _dpmCashTender = 0;
    _dpmReceiveOrder = false;
}

document.getElementById('deliveryPaymentModal')?.addEventListener('click', async (e) => {
    if (e.target.closest('#dpmCancelBtn')) { closeDeliveryPaymentModal(); return; }

    // Selección de método principal
    const methodBtn = e.target.closest('[data-dpm-method]');
    if (methodBtn) {
        _dpmSelectedMethod = methodBtn.dataset.dpmMethod;
        document.querySelectorAll('#dpmMethodsGrid .dpm-method-btn').forEach((b) =>
            b.classList.toggle('active', b === methodBtn)
        );
        _dpmShowSubSection(_dpmSelectedMethod);
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
    if (confirmBtn && !confirmBtn.disabled && _dpmCurrentOrderId && _dpmSelectedMethod) {
        confirmBtn.disabled = true;
        const orderId = _dpmCurrentOrderId;
        const method = _dpmSelectedMethod;
        const subMethod = _dpmSubMethod;
        const cashTender = _dpmCashTender;
        const orderTotal = _dpmOrderTotal;
        const receiveOrder = _dpmReceiveOrder;
        const order = ordersState.find((o) => o.id === orderId);
        closeDeliveryPaymentModal();

        if (order) {
            const paymentUpdate = {
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

                if (receiveOrder) {
                    const copied = await copyTextToClipboard(buildReceivedOrderMessage({ ...order, ...paymentUpdate }));
                    await updateOrder(orderId, { status: 'preparacion', receivedAt: firestoreNow(), ...paymentUpdate });
                    await reloadDataAndRender();
                    showNotice(
                        copied ? 'Pedido recibido, movido a preparación y mensaje copiado.' : 'Pedido recibido y movido a preparación.',
                        copied ? 'ok' : 'error'
                    );
                    closeUnreadTray();
                } else {
                    await updateOrder(orderId, paymentUpdate);
                    await reloadDataAndRender();
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

// ── Caja Diaria ───────────────────────────────────────────────────────────────
function _cajaDiariaTypeHtml(type) {
    if (type === 'mesa')      return '<span class="caja-type-badge caja-type-mesa">Mesa</span>';
    if (type === 'domicilio') return '<span class="caja-type-badge caja-type-domicilio">Domicilio</span>';
    return '<span class="caja-type-badge caja-type-retiro">Para llevar</span>';
}

function _cajaDiariaMethodLabel(order) {
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
        } else {
            fechaEl.textContent = new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
        }
    }

    // Filtrar cobros a partir de la apertura; si no hubo cierre previo, mostrar los del día actual
    const allPaid = ordersState.filter((o) => {
        if (!o.paymentMethod || o.paymentMethod === 'pendiente') return false;
        const paidMs = o.paidAt?.toMillis ? o.paidAt.toMillis() : Number(o.paidAt || 0);
        if (cajaAperturaAt) return paidMs >= cajaAperturaAt;
        // Sin cierre previo: solo cobros del día actual
        const todayStr = new Date().toISOString().split('T')[0];
        return new Date(paidMs).toISOString().split('T')[0] === todayStr;
    });

    const methods = getPaymentMethods();
    const methodKeys = methods.map((m) => m.id);

    // Detectar cobros con métodos que ya no existen en la configuración actual (datos históricos)
    const hasUnmatched = allPaid.some((o) => !methodKeys.includes(o.paymentMethod));
    const totalCols = 2 + methodKeys.length + (hasUnmatched ? 1 : 0) + 1;

    if (allPaid.length === 0) {
        if (headEl) headEl.innerHTML = '';
        bodyEl.innerHTML = `<tr><td class="caja-empty" colspan="${totalCols}">No hay cobros registrados en esta jornada.</td></tr>`;
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

    // Ordenar por hora de cobro
    const sorted = [...allPaid].sort((a, b) => {
        const ta = a.paidAt?.toDate ? a.paidAt.toDate() : new Date(a.paidAt || 0);
        const tb = b.paidAt?.toDate ? b.paidAt.toDate() : new Date(b.paidAt || 0);
        return ta - tb;
    });

    // Acumuladores por método (positivo = entrada, negativo si hay anulados netos)
    const sumMethod = {};
    methodKeys.forEach((k) => { sumMethod[k] = 0; });
    let sumOtro = 0;
    let grandTotal = 0;

    const rows = [];
    sorted.forEach((o) => {
        const ts   = o.paidAt || o.createdAt;
        const hora = formatOrderTime(ts);
        const amt  = getOrderDisplayTotal(o);
        const baseDesc = `<strong>${escapeHtml(o.code)}</strong> · ${escapeHtml(o.customerName || '—')} · ${escapeHtml(getOrderTypeLabel(o))}`;
        const isKnown = methodKeys.includes(o.paymentMethod);

        // Fila 1: ingreso original
        if (isKnown) { sumMethod[o.paymentMethod] += amt; } else { sumOtro += amt; }
        grandTotal += amt;
        const mCellsIn = methodKeys.map((k) =>
            k === o.paymentMethod
                ? `<td style="color:#6ee7b7;font-weight:700;">${formatMoney(amt)}</td>`
                : '<td></td>'
        ).join('');
        const otroCellIn = hasUnmatched
            ? (!isKnown ? `<td style="color:#6ee7b7;font-weight:700;" title="${escapeHtml(o.paymentMethod || '')}">${formatMoney(amt)}</td>` : '<td></td>')
            : '';
        rows.push(`<tr>
            <td class="col-left">${hora}</td>
            <td class="col-left">${baseDesc}</td>
            ${mCellsIn}${otroCellIn}
            <td style="color:#6ee7b7;font-weight:800;">${formatMoney(amt)}</td>
        </tr>`);

        // Fila 2 (solo si anulado): devolución en rojo
        if (o.voided) {
            if (isKnown) { sumMethod[o.paymentMethod] -= amt; } else { sumOtro -= amt; }
            grandTotal -= amt;
            const voidedTs = o.voidedAt || ts;
            const horaVoid = formatOrderTime(voidedTs);
            const mCellsOut = methodKeys.map((k) =>
                k === o.paymentMethod
                    ? `<td style="color:#fca5a5;font-weight:700;">−${formatMoney(amt)}</td>`
                    : '<td></td>'
            ).join('');
            const otroCellOut = hasUnmatched
                ? (!isKnown ? `<td style="color:#fca5a5;font-weight:700;">−${formatMoney(amt)}</td>` : '<td></td>')
                : '';
            const voidDesc = `<span style="color:#fca5a5;">↩ ANULADO</span> · ${escapeHtml(o.code)} · ${escapeHtml(o.customerName || '—')}`;
            rows.push(`<tr class="row-voided">
                <td class="col-left" style="color:#fca5a5;">${horaVoid}</td>
                <td class="col-left">${voidDesc}</td>
                ${mCellsOut}${otroCellOut}
                <td style="color:#fca5a5;font-weight:800;">−${formatMoney(amt)}</td>
            </tr>`);
        }
    });
    bodyEl.innerHTML = rows.join('');

    // Totales al pie
    if (footEl) {
        const mFootCells = methodKeys.map((k) => {
            const v = sumMethod[k];
            if (v === 0) return '<td>—</td>';
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

document.getElementById('refreshCajaDiariaBtn')?.addEventListener('click', renderCajaDiaria);

// ── Apertura de caja: timestamp desde el último cierre ───────────────────────
const CAJA_APERTURA_STORAGE_KEY = 'roalburger-caja-apertura';
let cajaAperturaAt = Number(localStorage.getItem(CAJA_APERTURA_STORAGE_KEY) || 0);

// ── Auto-apertura Caja Diaria al primer cobro ─────────────────────────────────
let _cajaDiariaAutoOpened = false;

function _navigateToCajaDiaria() {
    const accordionBtn = document.querySelector('.admin-accordion-trigger[data-accordion-target="informes"]');
    if (accordionBtn) {
        const panel = document.getElementById('informes');
        if (panel && !panel.classList.contains('accordion-open')) {
            accordionBtn.click();
        }
    }
    setTimeout(() => {
        // Abrir el tab "Cajas" dentro de Informes
        const cajasTab = document.querySelector('[data-section-tab="cajas"][data-section-scope="informes"]');
        cajasTab?.click();
        // Asegurar que el sub-tab "Caja Diaria" esté activo
        setTimeout(() => {
            const subTab = document.querySelector('[data-cajas-tab="caja-diaria"]');
            if (subTab && !subTab.classList.contains('active')) subTab.click();
        }, 100);
    }, 180);
}

// ── Panel lateral cierre de caja ──────────────────────────────────────────────
let _cierrePrintHtml = '';
let _pendingCierreDoc = null;

function openCierreSidePanel(ticketHtml, title) {
    const panel = document.getElementById('cierreSidePanel');
    const body  = document.getElementById('cierreSidePanelBody');
    const titleEl = document.getElementById('cierreSidePanelTitle');
    if (!panel || !body) return;
    if (titleEl) titleEl.textContent = title || 'Vista previa del cierre';
    body.innerHTML = ticketHtml;
    _cierrePrintHtml = ticketHtml;
    panel.removeAttribute('hidden');
}

function _printCierreTicket(html) {
    const win = window.open('', '_blank', 'width=420,height=680,scrollbars=yes');
    if (win) {
        win.document.write(`<!DOCTYPE html><html><head><title>Cierre de Caja</title></head><body style="margin:0;background:#fff;">${html}<div style="text-align:center;margin:16px;"><button onclick="window.print()" style="padding:8px 24px;font-size:14px;cursor:pointer;">Imprimir</button></div></body></html>`);
        win.document.close();
    }
}

document.getElementById('cierreSidePanelClose')?.addEventListener('click', () => {
    document.getElementById('cierreSidePanel')?.setAttribute('hidden', '');
    _pendingCierreDoc = null;
});

document.getElementById('cierreCajaConfirmBtn')?.addEventListener('click', async () => {
    if (!_pendingCierreDoc) return;
    const { closureDoc, closureId, ticketHtml, dateStr } = _pendingCierreDoc;

    const imprimir = confirm('¿Desea imprimir el ticket de cierre?');
    if (imprimir) _printCierreTicket(ticketHtml);

    const confirmBtn = document.getElementById('cierreCajaConfirmBtn');
    if (confirmBtn) { confirmBtn.disabled = true; confirmBtn.textContent = 'Guardando...'; }
    try {
        await firebaseDb.collection(CIERRES_CAJA_COLLECTION).doc(closureId).set(closureDoc);

        cajaAperturaAt = Date.now();
        try { localStorage.setItem(CAJA_APERTURA_STORAGE_KEY, String(cajaAperturaAt)); } catch {}

        _pendingCierreDoc = null;
        document.getElementById('cierreSidePanel')?.setAttribute('hidden', '');

        renderCajaDiaria();
        _cajaDiariaAutoOpened = false;
        showNotice('Caja cerrada y guardada en historial.', 'ok');
        _navigateToCajaDiaria();
        await renderLibroCierres();
    } catch (err) {
        showNotice(`Error al guardar cierre: ${err.message || 'error inesperado.'}`, 'error');
    } finally {
        if (confirmBtn) { confirmBtn.disabled = false; confirmBtn.textContent = '🔒 Cerrar Caja'; }
    }
});

function _buildCierreTicketHtml(c, dateStr, timeStr) {
    const methods = c.methodTotals || {};
    const nonZeroMethods = Object.entries(methods).filter(([, v]) => Number(v) !== 0);
    const cobradas = Number(c.transactionCount || 0) - Number(c.voidedCount || 0);
    const methodRows = nonZeroMethods.map(([k, v]) => {
        const m = getPaymentMethods().find((x) => x.id === k) || { icon: '', label: k };
        return `<tr>
            <td style="padding:3px 0;color:#c8c0b8;">${m.icon} ${escapeHtml(m.label)}</td>
            <td style="padding:3px 0;text-align:right;color:#f0ead8;font-weight:700;">${formatMoney(Number(v))}</td>
        </tr>`;
    }).join('');

    return `<div style="font-family:'Courier New',monospace;font-size:13px;line-height:1.6;color:#f0ead8;background:#1a1412;padding:18px 20px;border-radius:8px;border:1px solid #3a2e26;">
        <div style="text-align:center;margin-bottom:10px;">
            <div style="font-weight:700;font-size:16px;letter-spacing:2px;color:#ff9540;">${escapeHtml(c.businessName || 'ROAL BURGER')}</div>
            ${c.businessAddress ? `<div style="color:#c8c0b8;font-size:12px;">${escapeHtml(c.businessAddress)}</div>` : ''}
            ${c.businessPhone ? `<div style="color:#c8c0b8;font-size:12px;">Tel: ${escapeHtml(c.businessPhone)}</div>` : ''}
            ${c.businessNit ? `<div style="color:#c8c0b8;font-size:12px;">NIT/RUT: ${escapeHtml(c.businessNit)}</div>` : ''}
        </div>
        <div style="border-top:1px dashed #5a4a3a;border-bottom:1px dashed #5a4a3a;text-align:center;padding:5px 0;margin-bottom:10px;font-weight:700;font-size:14px;color:#ff9540;letter-spacing:2px;">
            CIERRE DE CAJA
        </div>
        <table style="width:100%;border-collapse:collapse;">
            <tr><td style="color:#c8c0b8;">Fecha</td><td style="text-align:right;color:#f0ead8;">${dateStr}</td></tr>
            <tr><td style="color:#c8c0b8;">Hora cierre</td><td style="text-align:right;color:#f0ead8;">${timeStr}</td></tr>
            <tr><td style="color:#c8c0b8;">Transacciones cobradas</td><td style="text-align:right;color:#f0ead8;font-weight:700;">${cobradas}</td></tr>
            ${c.voidedCount ? `<tr><td style="color:#fca5a5;">Anulados (excluidos)</td><td style="text-align:right;color:#fca5a5;">${Number(c.voidedCount)}</td></tr>` : ''}
        </table>
        <div style="border-top:1px dashed #5a4a3a;margin:10px 0 6px;padding-top:8px;font-weight:700;color:#ff9540;letter-spacing:1px;font-size:12px;">DESGLOSE POR MÉTODO</div>
        <table style="width:100%;border-collapse:collapse;">
            ${methodRows || '<tr><td colspan="2" style="color:#c8c0b8;text-align:center;">Sin movimientos</td></tr>'}
        </table>
        <div style="border-top:2px solid #ff9540;margin-top:12px;padding-top:10px;">
            <table style="width:100%;border-collapse:collapse;">
                <tr>
                    <td style="font-weight:700;font-size:15px;color:#ff9540;">TOTAL NETO</td>
                    <td style="text-align:right;font-weight:700;font-size:15px;color:#ff9540;">${formatMoney(Number(c.grandTotal || 0))}</td>
                </tr>
            </table>
        </div>
        <div style="text-align:center;margin-top:14px;font-size:11px;color:#7a6a5a;border-top:1px dashed #3a2e26;padding-top:8px;">
            *** Cierre de caja válido ***<br>Generado por sistema POS
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

        // Usar el mismo filtro que renderCajaDiaria: desde cajaAperturaAt o desde hoy
        const paid = ordersState.filter((o) => {
            if (!o.paidAt || !o.paymentMethod || o.paymentMethod === 'pendiente') return false;
            const ms = o.paidAt?.toMillis ? o.paidAt.toMillis() : Number(o.paidAt);
            if (cajaAperturaAt) return ms >= cajaAperturaAt;
            return new Date(ms).toISOString().split('T')[0] === todayStr;
        });

        if (!paid.length) {
            showNotice('No hay cobros en la jornada actual para cerrar la caja.', 'error');
            return;
        }

        // Los anulados se cuentan pero NO afectan los totales netos
        const sumMethod = {};
        let grandTotal = 0;
        let voidedCount = 0;

        paid.forEach((o) => {
            if (o.voided) { voidedCount++; return; }
            const mk = o.paymentMethod;
            const amt = Number(o.total || o.subtotal || 0);
            if (!sumMethod[mk]) sumMethod[mk] = 0;
            sumMethod[mk] += amt;
            grandTotal += amt;
        });

        const cfg = await firebaseDb.collection('configuracion').doc('negocio').get().then(s => s.exists ? s.data() : {});

        const closedAt = firestoreNow();
        const closureId = `cierre_${todayStr}_${Date.now()}`;

        const closureDoc = {
            id: closureId,
            closedAt,
            date: todayStr,
            transactionCount: paid.length,
            voidedCount,
            methodTotals: sumMethod,
            grandTotal,
            businessName: cfg.nombre || cfg.name || 'ROAL BURGER',
            businessAddress: cfg.direccion || cfg.address || '',
            businessPhone: cfg.telefono || cfg.phone || '',
            businessNit: cfg.nit || cfg.rut || '',
        };

        const dateStr = today.toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });
        const timeStr = today.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const ticketHtml = _buildCierreTicketHtml(closureDoc, dateStr, timeStr);

        // Guardar datos pendientes y mostrar preview — el usuario confirma el cierre desde el panel
        _pendingCierreDoc = { closureDoc, closureId, ticketHtml, dateStr };
        openCierreSidePanel(ticketHtml, `Vista previa · ${dateStr}`);

    } catch (err) {
        showNotice(`Error al preparar cierre: ${err.message || 'error inesperado.'}`, 'error');
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = '🔒 Cerrar Caja'; }
    }
}

document.getElementById('cerrarCajaBtn')?.addEventListener('click', cerrarCaja);

// ── Libro Contable: historial de cierres de caja ──────────────────────────────
let _cierresCajaState = [];

async function loadCierresCaja() {
    const snap = await firebaseDb.collection(CIERRES_CAJA_COLLECTION)
        .orderBy('closedAt', 'desc')
        .limit(100)
        .get();
    _cierresCajaState = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return _cierresCajaState;
}

async function renderLibroCierres() {
    const tbody = document.getElementById('libroCierresList');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:12px;color:var(--admin-muted);">Cargando…</td></tr>';
    try {
        const cierres = await loadCierresCaja();
        if (!cierres.length) {
            tbody.innerHTML = '<tr><td class="caja-empty" colspan="9">No hay cierres de caja registrados.</td></tr>';
            return;
        }
        tbody.innerHTML = cierres.map((c) => {
            const tsMs = c.closedAt && typeof c.closedAt.toMillis === 'function' ? c.closedAt.toMillis() : Number(c.closedAt || 0);
            const d = tsMs ? new Date(tsMs) : null;
            const fechaStr = d ? d.toLocaleString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : c.date || '—';
            const methods = c.methodTotals || {};
            const methodCells = ['efectivo','tarjeta','transferencia','link'].map((k) => {
                const v = methods[k];
                if (!v && v !== 0) return '<td style="color:var(--admin-muted);">—</td>';
                const color = v < 0 ? '#fca5a5' : '#6ee7b7';
                return `<td style="color:${color};font-weight:600;">${formatMoney(Math.abs(v))}</td>`;
            }).join('');
            const gtColor = (c.grandTotal || 0) >= 0 ? 'var(--admin-accent,#ff9540)' : '#fca5a5';
            return `<tr>
                <td>${escapeHtml(fechaStr)}</td>
                <td style="text-align:center;">${Number(c.transactionCount || 0)}</td>
                <td style="text-align:center;">${Number(c.voidedCount || 0)}</td>
                ${methodCells}
                <td style="color:${gtColor};font-weight:700;">${formatMoney(c.grandTotal || 0)}</td>
                <td style="text-align:center;"><button class="btn-reimprimir-cierre" data-cierre-id="${escapeHtml(c.id)}" style="font-size:0.75rem;padding:3px 10px;background:var(--admin-accent,#ff9540);color:#111;border:none;border-radius:6px;cursor:pointer;font-weight:600;">🖨️ Reimprimir</button></td>
            </tr>`;
        }).join('');
    } catch (err) {
        tbody.innerHTML = `<tr><td class="caja-empty" colspan="9">Error al cargar: ${escapeHtml(err.message || 'error')}</td></tr>`;
    }
}

document.getElementById('refreshLibroCierresBtn')?.addEventListener('click', renderLibroCierres);

document.getElementById('libroCierresList')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-reimprimir-cierre');
    if (!btn) return;
    const cid = btn.dataset.cierreId;
    const c = _cierresCajaState.find((x) => x.id === cid);
    if (!c) return;
    const tsMs = c.closedAt && typeof c.closedAt.toMillis === 'function' ? c.closedAt.toMillis() : Number(c.closedAt || 0);
    const d = tsMs ? new Date(tsMs) : new Date();
    const dateStr = d.toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });
    const timeStr = d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const ticketHtml = _buildCierreTicketHtml(c, dateStr, timeStr);
    // Navegar a Caja Diaria y mostrar en el panel lateral
    _navigateToCajaDiaria();
    setTimeout(() => openCierreSidePanel(ticketHtml, `Cierre ${dateStr}`), 250);
});

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

// ── Modal vista previa de ticket ──────────────────────────────────────────────
function openTicketPreviewModal(order) {
    const modal    = document.getElementById('ticketPreviewModal');
    const content  = document.getElementById('ticketPreviewContent');
    const voidBadge = document.getElementById('ticketPreviewVoidedBadge');
    if (!modal || !content) return;
    content.innerHTML = buildThermalTicketMarkup(order);
    if (voidBadge) {
        if (order.voided) voidBadge.removeAttribute('hidden');
        else voidBadge.setAttribute('hidden', '');
    }
    modal.removeAttribute('hidden');
}

function closeTicketPreviewModal() {
    document.getElementById('ticketPreviewModal')?.setAttribute('hidden', '');
}

document.getElementById('ticketPreviewCloseBtn')?.addEventListener('click', closeTicketPreviewModal);
document.getElementById('ticketPreviewModal')?.addEventListener('click', (e) => {
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

initAdmin();
loadPaymentMethods();
