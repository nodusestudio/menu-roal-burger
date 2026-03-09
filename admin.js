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

let firebaseDb;
let firebaseStorage;
let firebaseAuth;
let productsState = [];
let categoriesState = [];

const ADMIN_USERNAME = 'roalburger';
const ADMIN_PASSWORD = 'Roalburger*2019';

async function ensureAdminAuth() {
    const username = (window.prompt('Acceso administrador: usuario') || '').trim();
    if (!username) {
        window.location.href = 'index.html';
        throw new Error('Acceso cancelado.');
    }

    const password = window.prompt('Acceso administrador: contrasena');
    if (!password) {
        window.location.href = 'index.html';
        throw new Error('Acceso cancelado.');
    }

    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
        window.location.href = 'index.html';
        throw new Error('Credenciales invalidas.');
    }
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

function showNotice(text, type = 'ok') {
    notice.textContent = text;
    notice.className = `notice show ${type}`;
}

function hideNotice() {
    notice.className = 'notice';
    notice.textContent = '';
}

function slugify(text) {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

function firestoreNow() {
    return firebase.firestore.FieldValue.serverTimestamp();
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
    await Promise.all([fetchCategories(), fetchProducts()]);
    renderCategories();
    renderFeaturedProducts();
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

async function initAdmin() {
    try {
        const services = initFirebaseServices();
        firebaseDb = services.db;
        firebaseStorage = services.storage;
        firebaseAuth = services.auth;

        await ensureAdminAuth();

        await seedDataIfNeeded();
        await reloadDataAndRender();
        setupCardCollapse();
    } catch (error) {
        showNotice(`Error de conexion con Firebase: ${error.message || 'revisa la configuracion.'}`, 'error');
    }
}

initAdmin();
