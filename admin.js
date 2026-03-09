const MAX_FEATURED = 5;

const seedCategories = [
    { id: 'burger-clasicas', name: 'Burger Clasicas', active: true },
    { id: 'burger-premium', name: 'Burger Premium', active: true },
    { id: 'perros-salchipapas', name: 'Perros y Salchipapas', active: true },
    { id: 'entradas', name: 'Entradas', active: true },
    { id: 'combos', name: 'Combos', active: true },
    { id: 'adicionales', name: 'Adicionales', active: true }
];

const seedProducts = [
    {
        id: 'plus',
        nombre: 'PLUS',
        precio: 21900,
        categoria: 'Adicionales',
        estado: 'active',
        es_destacado: true,
        image_url: 'PLUS.png'
    },
    {
        id: 'emparejados',
        nombre: 'EMPAREJADOS',
        precio: 19900,
        categoria: 'Combos',
        estado: 'active',
        es_destacado: true,
        image_url: 'EMPAREJADOS.jpeg'
    },
    {
        id: 'empanadas',
        nombre: 'EMPANADAS',
        precio: 11900,
        categoria: 'Entradas',
        estado: 'active',
        es_destacado: true,
        image_url: 'empanadas.png'
    }
];

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
    flame: { primaryColor: '#ff6000', secondaryColor: '#ff8533', accentColor: '#25d366' },
    ocean: { primaryColor: '#0f4c81', secondaryColor: '#46c3ff', accentColor: '#19c7c0' },
    forest: { primaryColor: '#0f5132', secondaryColor: '#55d38d', accentColor: '#b3ff7a' },
    midnight: { primaryColor: '#20274e', secondaryColor: '#5f7cff', accentColor: '#f9c94a' },
    sunset: { primaryColor: '#a33a2f', secondaryColor: '#ff9f68', accentColor: '#ffd166' }
};

const defaultBranding = {
    restaurantName: 'ROAL BURGER',
    slogan: 'Comida rapida con acento venezolano',
    logoUrl: 'logo.png',
    primaryColor: '#ff6000',
    secondaryColor: '#ff8533',
    accentColor: '#25d366',
    template: 'flame',
    updated_at: null
};

const ADMIN_USERNAME = 'roalburger';
const ADMIN_PASSWORD = 'Roalburger*2019';
const ADMIN_DEVICE_AUTH_KEY = 'roal_admin_device_auth';

const adminAuthForm = document.getElementById('adminAuthForm');
const authUsernameInput = document.getElementById('authUsername');
const authPasswordInput = document.getElementById('authPassword');
const authRememberDeviceInput = document.getElementById('authRememberDevice');
const authError = document.getElementById('authError');
const authForgotBtn = document.getElementById('authForgotBtn');
const authRegisterBtn = document.getElementById('authRegisterBtn');

const productForm = document.getElementById('productForm');
const featuredForm = document.getElementById('featuredForm');
const categoryForm = document.getElementById('categoryForm');
const productCategorySelect = document.getElementById('productCategory');
const featuredProductSelect = document.getElementById('featuredProductSelect');
const featuredList = document.getElementById('featuredList');
const categoryList = document.getElementById('categoryList');
const notice = document.getElementById('adminNotice');
const imageFileInput = document.getElementById('productImageFile');
const totalClicksEl = document.getElementById('totalClicks');
const topProductEl = document.getElementById('topProduct');

const buttonConfigForm = document.getElementById('buttonConfigForm');
const buttonConfigList = document.getElementById('buttonConfigList');
const buttonVolumeInput = document.getElementById('buttonVolume');
const buttonVolumeOut = document.getElementById('buttonVolumeOut');
const buttonEditIdInput = document.getElementById('buttonEditId');
const buttonSaveBtn = document.getElementById('buttonSaveBtn');

const brandingForm = document.getElementById('brandingForm');
const templateGrid = document.getElementById('templateGrid');
const previewLogo = document.getElementById('previewLogo');
const previewName = document.getElementById('previewName');
const previewSlogan = document.getElementById('previewSlogan');
const brandingPreview = document.getElementById('brandingPreview');

let firebaseDb;
let firebaseStorage;
let productsState = [];
let categoriesState = [];
let buttonsState = [];
let brandingState = { ...defaultBranding };

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

function slugify(text) {
    return String(text || '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

function firestoreNow() {
    return firebase.firestore.FieldValue.serverTimestamp();
}

function setupTabs() {
    const nav = document.getElementById('adminTabNav');
    if (!nav) {
        return;
    }

    const buttons = Array.from(nav.querySelectorAll('.admin-tab-btn'));
    const panels = Array.from(document.querySelectorAll('.admin-tab-panel'));

    function activateTab(target) {
        buttons.forEach((button) => {
            button.classList.toggle('active', button.dataset.tabTarget === target);
        });

        panels.forEach((panel) => {
            panel.classList.toggle('active', panel.dataset.tabPanel === target);
        });
    }

    buttons.forEach((button) => {
        button.addEventListener('click', () => activateTab(button.dataset.tabTarget));
    });
}

function setupCardCollapse() {
    const buttons = document.querySelectorAll('.card-collapse-btn');
    buttons.forEach((button) => {
        button.addEventListener('click', () => {
            const targetId = button.dataset.collapseTarget;
            if (!targetId) {
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

async function ensureAdminAuth() {
    try {
        if (window.localStorage.getItem(ADMIN_DEVICE_AUTH_KEY) === 'true') {
            document.body.classList.remove('admin-locked');
            document.body.classList.add('admin-unlocked');
            return;
        }
    } catch (error) {
        // Ignore storage restrictions in private mode.
    }

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

        const onSubmit = (event) => {
            event.preventDefault();

            const username = String(authUsernameInput?.value || '').trim();
            const password = String(authPasswordInput?.value || '');

            if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
                if (authError) {
                    authError.textContent = 'Credenciales incorrectas. Verifica usuario y contrasena.';
                    authError.classList.add('show');
                }

                try {
                    window.localStorage.removeItem(ADMIN_DEVICE_AUTH_KEY);
                } catch (error) {
                    // Ignore storage restrictions in private mode.
                }
                return;
            }

            if (authError) {
                authError.classList.remove('show');
                authError.textContent = '';
            }

            try {
                if (authRememberDeviceInput && authRememberDeviceInput.checked) {
                    window.localStorage.setItem(ADMIN_DEVICE_AUTH_KEY, 'true');
                } else {
                    window.localStorage.removeItem(ADMIN_DEVICE_AUTH_KEY);
                }
            } catch (error) {
                // Ignore storage restrictions in private mode.
            }

            document.body.classList.remove('admin-locked');
            document.body.classList.add('admin-unlocked');

            adminAuthForm.removeEventListener('submit', onSubmit);
            resolve();
        };

        adminAuthForm.addEventListener('submit', onSubmit);
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
    return {
        restaurantName: String(raw.restaurantName || defaultBranding.restaurantName),
        slogan: String(raw.slogan || defaultBranding.slogan),
        logoUrl: String(raw.logoUrl || defaultBranding.logoUrl),
        primaryColor: String(raw.primaryColor || defaultBranding.primaryColor),
        secondaryColor: String(raw.secondaryColor || defaultBranding.secondaryColor),
        accentColor: String(raw.accentColor || defaultBranding.accentColor),
        template: BRAND_TEMPLATES[raw.template] ? raw.template : defaultBranding.template,
        updated_at: raw.updated_at || null
    };
}

async function fetchCategories() {
    const snapshot = await firebaseDb.collection('categorias').get();
    categoriesState = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .map((category) => ({
            ...category,
            active: category.active !== false
        }))
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
    const doc = await firebaseDb.collection('configuracion').doc('marca').get();
    if (!doc.exists) {
        brandingState = { ...defaultBranding };
        return;
    }

    brandingState = normalizeBranding(doc.data());
}

async function seedDataIfNeeded() {
    const categoriesCheck = await firebaseDb.collection('categorias').limit(1).get();
    if (categoriesCheck.empty) {
        const batch = firebaseDb.batch();
        seedCategories.forEach((category) => {
            const ref = firebaseDb.collection('categorias').doc(category.id);
            batch.set(ref, {
                name: category.name,
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

    const brandingCheck = await firebaseDb.collection('configuracion').doc('marca').get();
    if (!brandingCheck.exists) {
        await firebaseDb.collection('configuracion').doc('marca').set({
            ...defaultBranding,
            created_at: firestoreNow(),
            updated_at: firestoreNow()
        });
    }
}

function renderCategorySelect() {
    const activeCategories = categoriesState.filter((category) => category.active);
    const previousValue = productCategorySelect.value;

    productCategorySelect.innerHTML = '<option value="">Seleccionar</option>';
    activeCategories.forEach((category) => {
        const option = document.createElement('option');
        option.value = category.name;
        option.textContent = category.name;
        productCategorySelect.appendChild(option);
    });

    if (activeCategories.some((category) => category.name === previousValue)) {
        productCategorySelect.value = previousValue;
    }
}

function createCategoryRow(category) {
    const wrapper = document.createElement('div');
    const row = document.createElement('div');
    row.className = 'list-item';

    const stateClass = category.active ? 'active' : 'inactive';
    const stateText = category.active ? 'Activa' : 'Inactiva';
    const toggleText = category.active ? 'Desactivar' : 'Activar';

    row.innerHTML = `
        <div class="product-main"><span>${category.name}</span></div>
        <div class="muted">Categoria del menu</div>
        <span class="state-pill ${stateClass}">${stateText}</span>
        <button class="mini-btn" data-category-id="${category.id}" data-action="toggle-category">${toggleText}</button>
        <button class="mini-btn remove" data-category-id="${category.id}" data-action="delete-category">Eliminar</button>
        <button class="mini-btn remove" data-category-id="${category.id}" data-action="view-category">Ver mas</button>
    `;

    const inline = document.createElement('div');
    inline.className = 'category-products-inline';
    inline.id = `category-products-${category.id}`;

    wrapper.appendChild(row);
    wrapper.appendChild(inline);
    return wrapper;
}

function renderCategories() {
    categoryList.innerHTML = '';
    categoriesState.forEach((category) => {
        categoryList.appendChild(createCategoryRow(category));
    });
    renderCategorySelect();
}

function renderCategoryProductsInline(container, category, isVisible) {
    if (!container || !category) {
        return;
    }

    container.innerHTML = '';
    if (!isVisible) {
        container.classList.remove('show');
        return;
    }

    const products = productsState.filter((product) => product.categoria === category.name);
    container.classList.add('show');

    const title = document.createElement('h3');
    title.textContent = `Productos en ${category.name}`;
    container.appendChild(title);

    if (!products.length) {
        const empty = document.createElement('p');
        empty.className = 'muted';
        empty.textContent = 'No hay productos agregados en esta categoria.';
        container.appendChild(empty);
        return;
    }

    const list = document.createElement('div');
    list.className = 'category-product-list';

    products.forEach((product) => {
        const item = document.createElement('div');
        item.className = 'category-product-item';
        const pausedTag = product.estado === 'paused' ? '<span class="product-state-tag">Pausado</span>' : '';

        item.innerHTML = `
            <div>
                <span>${product.nombre}</span>${pausedTag}
                <div class="muted">$ ${Number(product.precio).toLocaleString('es-CO')}</div>
            </div>
            <button class="mini-btn" data-action="edit-product" data-product-id="${product.id}" data-category-id="${category.id}">Editar</button>
            <button class="mini-btn remove" data-action="delete-product" data-product-id="${product.id}" data-category-id="${category.id}">Eliminar</button>
            <button class="mini-btn" data-action="pause-product" data-product-id="${product.id}" data-category-id="${category.id}">${product.estado === 'paused' ? 'Reanudar' : 'Pausar'}</button>
        `;

        list.appendChild(item);
    });

    container.appendChild(list);
}

function getInlineContainerByCategoryId(categoryId) {
    return document.getElementById(`category-products-${categoryId}`);
}

function renderFeaturedSelect() {
    const notFeatured = productsState.filter((product) => !product.es_destacado);
    featuredProductSelect.innerHTML = '';

    if (!notFeatured.length) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'No hay productos disponibles';
        featuredProductSelect.appendChild(option);
        return;
    }

    notFeatured.forEach((product) => {
        const option = document.createElement('option');
        option.value = product.id;
        option.textContent = `${product.nombre} (${product.categoria})`;
        featuredProductSelect.appendChild(option);
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

function renderFeaturedProducts() {
    const featured = productsState.filter((product) => product.es_destacado).slice(0, MAX_FEATURED);
    featuredList.innerHTML = '';

    if (!featured.length) {
        const empty = document.createElement('p');
        empty.className = 'muted';
        empty.textContent = 'Todavia no hay productos en Los mas pedidos.';
        featuredList.appendChild(empty);
    } else {
        featured.forEach((product) => {
            featuredList.appendChild(createFeaturedRow(product));
        });
    }

    renderFeaturedSelect();
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
    brandingForm.restaurantLogo.value = brandingState.logoUrl;
    brandingForm.brandPrimaryColor.value = brandingState.primaryColor;
    brandingForm.brandSecondaryColor.value = brandingState.secondaryColor;
    brandingForm.brandAccentColor.value = brandingState.accentColor;
    brandingForm.brandTemplate.value = brandingState.template;

    renderBrandingPreview();
}

function renderBrandingPreview() {
    if (!brandingForm || !previewName || !previewSlogan || !brandingPreview || !previewLogo) {
        return;
    }

    const name = String(brandingForm.restaurantName.value || '').trim() || defaultBranding.restaurantName;
    const slogan = String(brandingForm.restaurantSlogan.value || '').trim() || defaultBranding.slogan;
    const logo = String(brandingForm.restaurantLogo.value || '').trim() || defaultBranding.logoUrl;
    const primary = String(brandingForm.brandPrimaryColor.value || defaultBranding.primaryColor);
    const secondary = String(brandingForm.brandSecondaryColor.value || defaultBranding.secondaryColor);

    previewName.textContent = name;
    previewSlogan.textContent = slogan;
    previewLogo.src = logo;
    previewLogo.alt = `Logo ${name}`;

    brandingPreview.style.borderColor = `${primary}77`;
    brandingPreview.style.background = `linear-gradient(135deg, ${primary}22, ${secondary}16)`;
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
    renderBrandingPreview();
}

async function uploadImageToFirebase(file, productName) {
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const safeName = slugify(productName) || 'producto';
    const path = `${FIREBASE_STORAGE_FOLDER}/${safeName}-${Date.now()}.${ext}`;

    const storageRef = firebaseStorage.ref().child(path);
    await storageRef.put(file);
    return storageRef.getDownloadURL();
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

        totalClicksEl.textContent = clicksData && clicksData.value_number != null
            ? Number(clicksData.value_number).toLocaleString('es-CO')
            : '--';

        topProductEl.textContent = (topProductData && topProductData.value_text) || '--';
    } catch (error) {
        totalClicksEl.textContent = '--';
        topProductEl.textContent = '--';
    }
}

async function reloadDataAndRender() {
    await Promise.all([
        fetchCategories(),
        fetchProducts(),
        fetchButtons(),
        fetchBranding()
    ]);

    renderCategories();
    renderFeaturedProducts();
    renderButtonsList();
    renderBrandingForm();
    await syncStats();
}

productForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    hideNotice();

    const formData = new FormData(productForm);
    const nombre = String(formData.get('name') || '').trim();
    const precio = Number(formData.get('price'));
    const categoria = String(formData.get('category') || '').trim();
    const imageUrl = String(formData.get('imageUrl') || '').trim();
    const imageFile = imageFileInput.files && imageFileInput.files[0] ? imageFileInput.files[0] : null;

    if (!nombre || !precio || !categoria) {
        showNotice('Completa nombre, precio y categoria.', 'error');
        return;
    }

    if (!imageFile && !imageUrl) {
        showNotice('Debes subir una imagen o indicar una ruta/URL.', 'error');
        return;
    }

    if (imageFile && imageFile.size > 20 * 1024 * 1024) {
        showNotice('La imagen supera 20 MB. Reduce el tamano para continuar.', 'error');
        return;
    }

    try {
        let finalImageUrl = imageUrl;
        if (imageFile) {
            finalImageUrl = await uploadImageToFirebase(imageFile, nombre);
        }

        const id = `${slugify(nombre)}-${Date.now()}`;
        await firebaseDb.collection('productos').doc(id).set({
            nombre,
            precio,
            categoria,
            estado: 'active',
            es_destacado: false,
            image_url: finalImageUrl,
            created_at: firestoreNow(),
            updated_at: firestoreNow()
        });

        productForm.reset();
        await reloadDataAndRender();
        showNotice('Producto agregado correctamente en Firebase.', 'ok');
    } catch (error) {
        showNotice(`No se pudo guardar el producto: ${error.message || 'Error inesperado.'}`, 'error');
    }
});

featuredForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    hideNotice();

    const selectedId = featuredProductSelect.value;
    if (!selectedId) {
        showNotice('No hay productos disponibles para agregar.', 'error');
        return;
    }

    const featuredCount = productsState.filter((product) => product.es_destacado).length;
    if (featuredCount >= MAX_FEATURED) {
        showNotice('Solo puedes tener 5 productos en Los mas pedidos.', 'error');
        return;
    }

    try {
        await firebaseDb.collection('productos').doc(selectedId).update({
            es_destacado: true,
            estado: 'active',
            updated_at: firestoreNow()
        });

        await reloadDataAndRender();
        showNotice('Producto agregado a Los mas pedidos.', 'ok');
    } catch (error) {
        showNotice(`No se pudo actualizar: ${error.message || 'Error inesperado.'}`, 'error');
    }
});

featuredList.addEventListener('click', async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) {
        return;
    }

    const productId = target.dataset.productId;
    const action = target.dataset.action;
    if (!productId || !action) {
        return;
    }

    const product = productsState.find((item) => item.id === productId);
    if (!product) {
        showNotice('Producto no encontrado.', 'error');
        return;
    }

    try {
        if (action === 'toggle-featured-state') {
            const estado = product.estado === 'active' ? 'paused' : 'active';
            await firebaseDb.collection('productos').doc(productId).update({
                estado,
                updated_at: firestoreNow()
            });
            await reloadDataAndRender();
            showNotice(`Estado actualizado para ${product.nombre}.`, 'ok');
        }

        if (action === 'remove-featured') {
            await firebaseDb.collection('productos').doc(productId).update({
                es_destacado: false,
                updated_at: firestoreNow()
            });
            await reloadDataAndRender();
            showNotice(`${product.nombre} ya no esta en Los mas pedidos.`, 'ok');
        }
    } catch (error) {
        showNotice(`No se pudo actualizar: ${error.message || 'Error inesperado.'}`, 'error');
    }
});

categoryForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    hideNotice();

    const formData = new FormData(categoryForm);
    const name = String(formData.get('categoryName') || '').trim();
    if (!name) {
        showNotice('Escribe un nombre de categoria valido.', 'error');
        return;
    }

    const exists = categoriesState.some((category) => category.name.toLowerCase() === name.toLowerCase());
    if (exists) {
        showNotice('Esa categoria ya existe.', 'error');
        return;
    }

    try {
        const id = `${slugify(name)}-${Date.now()}`;
        await firebaseDb.collection('categorias').doc(id).set({
            name,
            active: true,
            created_at: firestoreNow(),
            updated_at: firestoreNow()
        });

        categoryForm.reset();
        await reloadDataAndRender();
        showNotice('Categoria creada y activada.', 'ok');
    } catch (error) {
        showNotice(`No se pudo crear la categoria: ${error.message || 'Error inesperado.'}`, 'error');
    }
});

categoryList.addEventListener('click', async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) {
        return;
    }

    const categoryId = target.dataset.categoryId;
    const action = target.dataset.action;
    if (!categoryId || !action) {
        return;
    }

    if (action === 'view-category') {
        const category = categoriesState.find((item) => item.id === categoryId);
        if (!category) {
            showNotice('Categoria no encontrada.', 'error');
            return;
        }

        const inline = getInlineContainerByCategoryId(categoryId);
        const shouldShow = !(inline && inline.classList.contains('show'));
        renderCategoryProductsInline(inline, category, shouldShow);
        return;
    }

    if (action === 'delete-category') {
        const category = categoriesState.find((item) => item.id === categoryId);
        if (!category) {
            showNotice('Categoria no encontrada.', 'error');
            return;
        }

        const hasProducts = productsState.some((product) => product.categoria === category.name);
        if (hasProducts) {
            showNotice('No puedes eliminar la categoria porque tiene productos asociados.', 'error');
            return;
        }

        const confirmed = window.confirm(`Eliminar categoria ${category.name}?`);
        if (!confirmed) {
            return;
        }

        try {
            await firebaseDb.collection('categorias').doc(categoryId).delete();
            await reloadDataAndRender();
            showNotice('Categoria eliminada.', 'ok');
        } catch (error) {
            showNotice(`No se pudo eliminar la categoria: ${error.message || 'Error inesperado.'}`, 'error');
        }
        return;
    }

    if (action !== 'toggle-category') {
        return;
    }

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
        showNotice(`Categoria ${category.name}: ${!category.active ? 'activada' : 'desactivada'}.`, 'ok');
    } catch (error) {
        showNotice(`No se pudo actualizar la categoria: ${error.message || 'Error inesperado.'}`, 'error');
    }
});

categoryList.addEventListener('click', async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) {
        return;
    }

    const action = target.dataset.action;
    const productId = target.dataset.productId;
    const categoryId = target.dataset.categoryId;

    if (!action || !productId || !categoryId) {
        return;
    }

    if (action !== 'edit-product' && action !== 'delete-product' && action !== 'pause-product') {
        return;
    }

    const product = productsState.find((item) => item.id === productId);
    if (!product) {
        showNotice('Producto no encontrado.', 'error');
        return;
    }

    try {
        if (action === 'edit-product') {
            const nextName = window.prompt('Nuevo nombre del producto:', product.nombre);
            if (nextName === null) {
                return;
            }

            const trimmedName = nextName.trim();
            if (!trimmedName) {
                showNotice('El nombre no puede estar vacio.', 'error');
                return;
            }

            const nextPriceRaw = window.prompt('Nuevo precio del producto:', String(product.precio));
            if (nextPriceRaw === null) {
                return;
            }

            const nextPrice = Number(nextPriceRaw);
            if (!Number.isFinite(nextPrice) || nextPrice <= 0) {
                showNotice('Precio invalido.', 'error');
                return;
            }

            await firebaseDb.collection('productos').doc(productId).update({
                nombre: trimmedName,
                precio: nextPrice,
                updated_at: firestoreNow()
            });

            await reloadDataAndRender();
            const category = categoriesState.find((item) => item.id === categoryId);
            if (category) {
                renderCategoryProductsInline(getInlineContainerByCategoryId(categoryId), category, true);
            }
            showNotice('Producto editado correctamente.', 'ok');
            return;
        }

        if (action === 'delete-product') {
            const confirmed = window.confirm(`Eliminar ${product.nombre}?`);
            if (!confirmed) {
                return;
            }

            await firebaseDb.collection('productos').doc(productId).delete();

            await reloadDataAndRender();
            const category = categoriesState.find((item) => item.id === categoryId);
            if (category) {
                renderCategoryProductsInline(getInlineContainerByCategoryId(categoryId), category, true);
            }
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
            const category = categoriesState.find((item) => item.id === categoryId);
            if (category) {
                renderCategoryProductsInline(getInlineContainerByCategoryId(categoryId), category, true);
            }
            showNotice(`Producto ${estado === 'paused' ? 'pausado' : 'reanudado'}.`, 'ok');
        }
    } catch (error) {
        showNotice(`No se pudo actualizar el producto: ${error.message || 'Error inesperado.'}`, 'error');
    }
});

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
        logoUrl: String(formData.get('restaurantLogo') || '').trim(),
        primaryColor: String(formData.get('brandPrimaryColor') || '#ff6000').trim(),
        secondaryColor: String(formData.get('brandSecondaryColor') || '#ff8533').trim(),
        accentColor: String(formData.get('brandAccentColor') || '#25d366').trim(),
        template: String(formData.get('brandTemplate') || 'flame').trim()
    });

    try {
        await firebaseDb.collection('configuracion').doc('marca').set({
            ...payload,
            updated_at: firestoreNow()
        }, { merge: true });

        brandingState = payload;
        renderBrandingForm();
        showNotice('Configuracion de marca guardada.', 'ok');
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

if (authForgotBtn) {
    authForgotBtn.addEventListener('click', () => {
        window.alert('Para recuperar el acceso, contacta al administrador principal para cambio de contrasena.');
    });
}

if (authRegisterBtn) {
    authRegisterBtn.addEventListener('click', () => {
        window.alert('El registro de nuevos administradores se gestiona de forma interna por seguridad.');
    });
}

async function initAdmin() {
    try {
        const services = initFirebaseServices();
        firebaseDb = services.db;
        firebaseStorage = services.storage;

        await ensureAdminAuth();

        setupTabs();
        setupCardCollapse();
        resetButtonForm();

        await seedDataIfNeeded();
        await reloadDataAndRender();
    } catch (error) {
        document.body.classList.add('admin-locked');
        document.body.classList.remove('admin-unlocked');
        showNotice(`Error de conexion con Firebase: ${error.message || 'revisa la configuracion.'}`, 'error');
    }
}

initAdmin();
