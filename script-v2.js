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
let featuredCarouselResumeTimer = null;
let featuredCarouselUserPaused = false;

function getSelectedCategoryName() {
    const categories = ensurePinnedExplorerCategories(ensureForcedExplorerCategories(getExplorerCategories()));
    const selectedCategory = categories.find((item) => item.key === selectedCategoryKey);
    return selectedCategory?.name || 'NUESTROS PRODUCTOS';
}

function buildProductWhatsAppUrl(productName, categoryName) {
    const safeProductName = String(productName || 'producto').trim() || 'producto';
    const safeCategoryName = String(categoryName || getSelectedCategoryName()).trim() || 'NUESTROS PRODUCTOS';
    return `${WHATSAPP_BASE_URL}?text=${encodeURIComponent(`Hola ROAL BURGER! Quiero pedir de la categoria ${safeCategoryName} el producto ${safeProductName}`)}`;
}

const COMBO_EXTRA_PRICE = 7000;
const COMBO_DRINK_OPTIONS = ['Pepsi Zero', 'Colombia', 'Manzana'];
const COMBO_MEAL_SMALL_DRINK_OPTIONS = ['Pepsi Zero', 'Colombia', 'Manzana'];
const COMBO_MEAL_LARGE_DRINK_OPTIONS = ['Pepsi Zero', 'Colombia', 'Manzana', 'Naranja', 'Uva', 'Toronja', 'Pepsi Original'];

function isCombosConPapasCategory(categoryName) {
    const normalizedCategory = normalizeCategoryKey(categoryName);
    return normalizedCategory.includes('combos con papas y bebida');
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

    if (orderOptions.type === 'combo-meal') {
        const peopleCount = Number(orderOptions.peopleCount || 1);
        const drinkSize = peopleCount >= 3 ? '1 litro' : '250 ml';
        const drinkLabels = Array.isArray(orderOptions.drinks) ? orderOptions.drinks.filter(Boolean) : [];
        const drinksText = drinkLabels.join(', ');
        return `Hola ROAL BURGER! Quiero pedir de la categoria ${safeCategoryName} el producto ${safeProductName} para ${peopleCount} persona${peopleCount === 1 ? '' : 's'} con ${peopleCount >= 3 ? 'una bebida de 1 litro' : `${peopleCount} bebida${peopleCount === 1 ? '' : 's'} de 250 ml`} sabor ${drinksText} y su descripcion completa del combo.`;
    }

    if (orderOptions.type !== 'combo') {
        return `Hola ROAL BURGER! Quiero pedir de la categoria ${safeCategoryName} el producto ${safeProductName}.`;
    }

    const safeDrink = String(orderOptions.drink || COMBO_DRINK_OPTIONS[0]).trim() || COMBO_DRINK_OPTIONS[0];
    return `Hola ROAL BURGER! Quiero pedir de la categoria ${safeCategoryName} el producto ${safeProductName} en combo (+$${COMBO_EXTRA_PRICE.toLocaleString('es-CO')}) con bebida ${safeDrink}.`;
}

function openWhatsAppOrder(productName, categoryName, orderOptions = { type: 'solo' }) {
    const message = buildOrderMessage(productName, categoryName, orderOptions);
    window.open(`${WHATSAPP_BASE_URL}?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
}

const CART_STORAGE_KEY = 'roalburger-cart-v1';
let shoppingCart = [];
let cartUI = null;

function normalizeOrderOptions(orderOptions = { type: 'solo' }) {
    return {
        type: String(orderOptions.type || 'solo'),
        drink: String(orderOptions.drink || '').trim(),
        drinks: Array.isArray(orderOptions.drinks) ? orderOptions.drinks.map((item) => String(item || '').trim()).filter(Boolean) : [],
        peopleCount: Number(orderOptions.peopleCount || 0)
    };
}

function getCartItemKey(productName, categoryName, orderOptions = { type: 'solo' }) {
    const normalized = normalizeOrderOptions(orderOptions);
    return JSON.stringify({
        productName: String(productName || '').trim(),
        categoryName: String(categoryName || '').trim(),
        type: normalized.type,
        drink: normalized.drink,
        drinks: normalized.drinks,
        peopleCount: normalized.peopleCount
    });
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

function getCartOptionLabel(categoryName, orderOptions = { type: 'solo' }) {
    const normalized = normalizeOrderOptions(orderOptions);

    if (normalized.type === 'combo-meal') {
        const peopleCount = Number(normalized.peopleCount || 1);
        const drinkText = normalized.drinks.join(', ');
        return `${peopleCount} persona${peopleCount === 1 ? '' : 's'} | ${peopleCount >= 3 ? '1 bebida 1000ML' : `${peopleCount} bebida${peopleCount === 1 ? '' : 's'} 250ML`} | ${drinkText}`;
    }

    if (normalized.type === 'combo') {
        return `${getComboButtonCopy(categoryName).combo} | ${normalized.drink}`;
    }

    if (isComboCategory(categoryName)) {
        return getComboButtonCopy(categoryName).solo;
    }

    return 'Producto solo';
}

function buildCartCheckoutMessage() {
    const header = 'Hola ROAL BURGER! Quiero hacer este pedido:';
    const lines = shoppingCart.map((item, index) => {
        const details = [
            `${index + 1}. ${item.productName} (${item.categoryName})`,
            `   Opcion: ${getCartOptionLabel(item.categoryName, item.orderOptions)}`,
            `   Cantidad: ${item.quantity}`
        ];
        return details.join('\n');
    });

    return `${header}\n\n${lines.join('\n\n')}\n\nTotal de productos: ${getCartProductCount()}`;
}

function openCartDrawer() {
    if (!cartUI) {
        return;
    }
    cartUI.drawer.classList.add('is-open');
    cartUI.overlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
}

function closeCartDrawer() {
    if (!cartUI) {
        return;
    }
    cartUI.drawer.classList.remove('is-open');
    cartUI.overlay.classList.remove('is-open');
    document.body.style.overflow = 'auto';
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

    trackButtonClick('btn-cart-checkout', 'Checkout carrito');
    const message = buildCartCheckoutMessage();
    window.open(`${WHATSAPP_BASE_URL}?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
}

function addItemToCart(productName, categoryName, orderOptions = { type: 'solo' }, buttonId) {
    if (buttonId) {
        trackProductInterest(productName, buttonId);
    }

    const safeProductName = String(productName || 'producto').trim() || 'producto';
    const safeCategoryName = String(categoryName || getSelectedCategoryName()).trim() || 'NUESTROS PRODUCTOS';
    const normalizedOptions = normalizeOrderOptions(orderOptions);
    const itemKey = getCartItemKey(safeProductName, safeCategoryName, normalizedOptions);
    const existingItem = shoppingCart.find((item) => item.itemKey === itemKey);

    if (existingItem) {
        existingItem.quantity = Number(existingItem.quantity || 0) + 1;
    } else {
        shoppingCart.push({
            itemKey,
            productName: safeProductName,
            categoryName: safeCategoryName,
            orderOptions: normalizedOptions,
            quantity: 1
        });
    }

    saveCartState();
    renderCartUI();
    openCartDrawer();
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
        return;
    }

    shoppingCart.forEach((item) => {
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

        info.appendChild(title);
        info.appendChild(category);
        info.appendChild(option);

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

    cartUI.summary.textContent = `${shoppingCart.length} referencia${shoppingCart.length === 1 ? '' : 's'} | ${totalItems} producto${totalItems === 1 ? '' : 's'}`;
    cartUI.checkout.disabled = false;
    cartUI.clear.disabled = false;
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
        checkout: drawer.querySelector('#cartCheckoutBtn'),
        clear: drawer.querySelector('#cartClearBtn')
    };

    fab.addEventListener('click', openCartDrawer);
    overlay.addEventListener('click', closeCartDrawer);
    cartUI.close.addEventListener('click', closeCartDrawer);
    cartUI.checkout.addEventListener('click', checkoutCart);
    cartUI.clear.addEventListener('click', clearCart);

    renderCartUI();
}

function closeComboChoiceModal() {
    const modal = document.getElementById('combo-choice-modal');
    if (modal) {
        modal.remove();
    }
    document.body.style.overflow = 'auto';
}

function openCombosConPapasModal(productName, categoryName, buttonId) {
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

    const drinkSelectsContainer = document.createElement('div');
    drinkSelectsContainer.style.display = 'flex';
    drinkSelectsContainer.style.flexDirection = 'column';
    drinkSelectsContainer.style.gap = '10px';

    const confirmButton = document.createElement('button');
    confirmButton.type = 'button';
    confirmButton.textContent = 'Enviar pedido';
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
                type: 'combo-meal',
                peopleCount: count,
                drinks: drinkValues
            }, buttonId);
        };
    }

    drinksWrap.appendChild(drinksTitle);
    drinksWrap.appendChild(drinkSelectsContainer);
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

function openComboChoiceModal(productName, categoryName, buttonId) {
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
        addItemToCart(productName, categoryName, { type: 'solo' }, buttonId);
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
    comboPanel.style.display = 'flex';
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
    comboConfirm.textContent = 'Enviar pedido en combo';
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
        addItemToCart(productName, categoryName, { type: 'combo', drink: comboSelect.value }, buttonId);
    });

    comboPanel.appendChild(comboLabel);
    comboPanel.appendChild(comboSelect);
    comboPanel.appendChild(comboHelp);
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
    card.appendChild(actionRow);
    card.appendChild(comboPanel);
    modal.appendChild(card);

    if (window.innerWidth <= 480) {
        actionRow.style.gridTemplateColumns = '1fr';
    }

    document.body.style.overflow = 'hidden';
    document.body.appendChild(modal);
}

function startProductOrderFlow(productName, categoryName, buttonId) {
    const safeCategoryName = String(categoryName || getSelectedCategoryName()).trim() || 'NUESTROS PRODUCTOS';
    if (isCombosConPapasCategory(safeCategoryName)) {
        openCombosConPapasModal(productName, safeCategoryName, buttonId);
        return;
    }

    if (!isComboCategory(safeCategoryName)) {
        addItemToCart(productName, safeCategoryName, { type: 'solo' }, buttonId);
        return;
    }

    openComboChoiceModal(productName, safeCategoryName, buttonId);
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
    'CORDILLERA.png',
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

const HIDDEN_PRODUCT_KEYS = new Set(['de la casa', 'plus', 'burger plus', 'empanadas', 'empanada']);
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
                img.src = imgSrc;
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
                    img.src = rutaImagen;
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
        // Renderiza solo las imágenes locales fijas de los más pedidos
        const localFeaturedImages = [
            { name: 'DE LA CASA', src: './losmaspedidos/delacasa.png.png' },
            { name: 'EMPAREJADOS', src: './losmaspedidos/emparejados.png.png' },
            { name: 'FAMILIAR 3', src: './losmaspedidos/familiar3.png.png' },
            { name: 'FAMILIAR 4', src: './losmaspedidos/familiar4.png.png' }
        ];
        carousel.innerHTML = '';
        localFeaturedImages.forEach((item, index) => {
            const safeName = item.name;
            const featuredCategoryName = 'LOS MAS PEDIDOS';
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
                abrirModalBebida(safeName, item.src, featuredCategoryName);
            });
            const button = document.createElement('button');
            button.className = 'mobile-order-btn';
            button.id = buttonId;
            button.type = 'button';
            button.textContent = '¡Lo Quiero!';
            button.addEventListener('click', (event) => {
                event.preventDefault();
                startProductOrderFlow(safeName, featuredCategoryName, buttonId);
            });
            imageWrap.appendChild(image);
            card.appendChild(imageWrap);
            card.appendChild(button);
            carousel.appendChild(card);
        });
        carousel.scrollLeft = 0;
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


    // Excluir combos de temporada, familiares, perros, burger y variantes
    const EXCLUDE_KEYS = new Set([
        'adicionales',
        'combos',
        'combos de temporada', 'combos de temporadas', 'combos temporada',
        'combos familiares', 'combo familiar',
        'combos perros', 'combos de perros', 'combos perros y express', 'combos de perros y express', 'combos express',
        'combos burger', 'combo burger', 'combos de burger'
    ]);

    allCategoryMeta.forEach((item) => {
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

function renderCategoryExplorer(nextKey, options = {}) {
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

    // --- INICIO LÓGICA MANUAL BEBIDAS Y ADICIONALES Y OTRAS ---
    if (selectedCategory.name) {
        const catNorm = selectedCategory.name.trim().toUpperCase();
        // BEBIDAS Y ADICIONALES
        if (catNorm.includes('BEBIDAS') || catNorm.includes('ADICIONALES')) {
            panel.innerHTML = "";
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
            panel.insertAdjacentHTML("beforeend", galeriaHTML);
            return;
        }
        // BURGER CLASICAS
        if (catNorm.includes('CLASICAS')) {
            panel.innerHTML = "";
            const galeriaHTML = `
                <div class="bebidas-gallery-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; padding: 20px;">
                    <div class="card-pequena" style="cursor: pointer;" onclick="abrirModalBebida('Normal', './burgerclasicas/burgernormal.png')">
                        <img src="./burgerclasicas/burgernormal.png" style="width: 100%; border-radius: 8px;" alt="Normal">
                        <p style="text-align: center; font-weight: bold; margin-top: 5px; color: #000;">Normal</p>
                    </div>
                    <div class="card-pequena" style="cursor: pointer;" onclick="abrirModalBebida('Super', './burgerclasicas/burgersuper.png')">
                        <img src="./burgerclasicas/burgersuper.png" style="width: 100%; border-radius: 8px;" alt="Super">
                        <p style="text-align: center; font-weight: bold; margin-top: 5px; color: #000;">Super</p>
                    </div>
                </div>
            `;
            panel.insertAdjacentHTML("beforeend", galeriaHTML);
            return;
        }
        // BURGER PREMIUM
        if (catNorm.includes('PREMIUM')) {
            panel.innerHTML = "";
            const galeriaHTML = `
                <div class="bebidas-gallery-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; padding: 20px;">
                    <div class="card-pequena" style="cursor: pointer;" onclick="abrirModalBebida('Caracas', './burgerpremium/burgercaracas.png')">
                        <img src="./burgerpremium/burgercaracas.png" style="width: 100%; border-radius: 8px;" alt="Caracas">
                        <p style="text-align: center; font-weight: bold; margin-top: 5px; color: #000;">Caracas</p>
                    </div>
                    <div class="card-pequena" style="cursor: pointer;" onclick="abrirModalBebida('Cordillera', './burgerpremium/burgercordillera.png')">
                        <img src="./burgerpremium/burgercordillera.png" style="width: 100%; border-radius: 8px;" alt="Cordillera">
                        <p style="text-align: center; font-weight: bold; margin-top: 5px; color: #000;">Cordillera</p>
                    </div>
                    <div class="card-pequena" style="cursor: pointer;" onclick="abrirModalBebida('Papuda', './burgerpremium/burgerpapuda.png')">
                        <img src="./burgerpremium/burgerpapuda.png" style="width: 100%; border-radius: 8px;" alt="Papuda">
                        <p style="text-align: center; font-weight: bold; margin-top: 5px; color: #000;">Papuda</p>
                    </div>
                    <div class="card-pequena" style="cursor: pointer;" onclick="abrirModalBebida('Plus', './burgerpremium/burgerplus.png')">
                        <img src="./burgerpremium/burgerplus.png" style="width: 100%; border-radius: 8px;" alt="Plus">
                        <p style="text-align: center; font-weight: bold; margin-top: 5px; color: #000;">Plus</p>
                    </div>
                    <div class="card-pequena" style="cursor: pointer;" onclick="abrirModalBebida('Ranchera', './burgerpremium/burgerranchera.png')">
                        <img src="./burgerpremium/burgerranchera.png" style="width: 100%; border-radius: 8px;" alt="Ranchera">
                        <p style="text-align: center; font-weight: bold; margin-top: 5px; color: #000;">Ranchera</p>
                    </div>
                    <div class="card-pequena" style="cursor: pointer;" onclick="abrirModalBebida('Triplete', './burgerpremium/burgertriplete.png')">
                        <img src="./burgerpremium/burgertriplete.png" style="width: 100%; border-radius: 8px;" alt="Triplete">
                        <p style="text-align: center; font-weight: bold; margin-top: 5px; color: #000;">Triplete</p>
                    </div>
                </div>
            `;
            panel.insertAdjacentHTML("beforeend", galeriaHTML);
            return;
        }
        // ENTRADAS
        if (catNorm.includes('ENTRADAS')) {
            panel.innerHTML = "";
            const galeriaHTML = `
                <div class="bebidas-gallery-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; padding: 20px;">
                    <div class="card-pequena" style="cursor: pointer;" onclick="abrirModalBebida('Papas a la Francesa', './entradas/papas.png')">
                        <img src="./entradas/papas.png" style="width: 100%; border-radius: 8px;" alt="Papas a la Francesa">
                        <p style="text-align: center; font-weight: bold; margin-top: 5px; color: #000;">Papas a la Francesa</p>
                    </div>
                    <div class="card-pequena" style="cursor: pointer;" onclick="abrirModalBebida('Tequeños', './entradas/tequenos.png')">
                        <img src="./entradas/tequenos.png" style="width: 100%; border-radius: 8px;" alt="Tequeños">
                        <p style="text-align: center; font-weight: bold; margin-top: 5px; color: #000;">Tequeños</p>
                    </div>
                </div>
            `;
            panel.insertAdjacentHTML("beforeend", galeriaHTML);
            return;
        }
        // PEPTIOS VENEZOLANOS
        if (catNorm.includes('PEPITOS')) {
            panel.innerHTML = "";
            const galeriaHTML = `
                <div class="bebidas-gallery-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; padding: 20px;">
                    <div class="card-pequena" style="cursor: pointer;" onclick="abrirModalBebida('Mix', './pepitosvenezolanos/pepitomix.png')">
                        <img src="./pepitosvenezolanos/pepitomix.png" style="width: 100%; border-radius: 8px;" alt="Mix">
                        <p style="text-align: center; font-weight: bold; margin-top: 5px; color: #000;">Mix</p>
                    </div>
                    <div class="card-pequena" style="cursor: pointer;" onclick="abrirModalBebida('Plus', './pepitosvenezolanos/pepitoplus.png')">
                        <img src="./pepitosvenezolanos/pepitoplus.png" style="width: 100%; border-radius: 8px;" alt="Plus">
                        <p style="text-align: center; font-weight: bold; margin-top: 5px; color: #000;">Plus</p>
                    </div>
                    <div class="card-pequena" style="cursor: pointer;" onclick="abrirModalBebida('Ranchero', './pepitosvenezolanos/pepitoranchero.png')">
                        <img src="./pepitosvenezolanos/pepitoranchero.png" style="width: 100%; border-radius: 8px;" alt="Ranchero">
                        <p style="text-align: center; font-weight: bold; margin-top: 5px; color: #000;">Ranchero</p>
                    </div>
                    <div class="card-pequena" style="cursor: pointer;" onclick="abrirModalBebida('Urbano', './pepitosvenezolanos/pepitourbano.png')">
                        <img src="./pepitosvenezolanos/pepitourbano.png" style="width: 100%; border-radius: 8px;" alt="Urbano">
                        <p style="text-align: center; font-weight: bold; margin-top: 5px; color: #000;">Urbano</p>
                    </div>
                </div>
            `;
            panel.insertAdjacentHTML("beforeend", galeriaHTML);
            return;
        }
        // SALCHIPAPAS
        if (catNorm.includes('SALCHIPAPA')) {
            panel.innerHTML = "";
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
            panel.insertAdjacentHTML("beforeend", galeriaHTML);
            return;
        }
        // PERROS CALIENTES
        if (catNorm.includes('PERROS') && !catNorm.includes('SALCHIPAPA')) {
            panel.innerHTML = "";
            const galeriaHTML = `
                <div class="bebidas-gallery-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; padding: 20px;">
                    <div class="card-pequena" style="cursor: pointer;" onclick="abrirModalBebida('Especial', './perroscalientes/perroespecial.png')">
                        <img src="./perroscalientes/perroespecial.png" style="width: 100%; border-radius: 8px;" alt="Especial">
                        <p style="text-align: center; font-weight: bold; margin-top: 5px; color: #000;">Especial</p>
                    </div>
                    <div class="card-pequena" style="cursor: pointer;" onclick="abrirModalBebida('Normal', './perroscalientes/perronormal.png')">
                        <img src="./perroscalientes/perronormal.png" style="width: 100%; border-radius: 8px;" alt="Normal">
                        <p style="text-align: center; font-weight: bold; margin-top: 5px; color: #000;">Normal</p>
                    </div>
                    <div class="card-pequena" style="cursor: pointer;" onclick="abrirModalBebida('Super', './perroscalientes/perrosuper.png')">
                        <img src="./perroscalientes/perrosuper.png" style="width: 100%; border-radius: 8px;" alt="Super">
                        <p style="text-align: center; font-weight: bold; margin-top: 5px; color: #000;">Super</p>
                    </div>
                </div>
            `;
            panel.insertAdjacentHTML("beforeend", galeriaHTML);
            return;
        }
        // COMBOS CON PAPAS Y BEBIDA
        if (catNorm.includes('COMBOS CON PAPAS Y BEBIDA')) {
            panel.innerHTML = "";
            const galeriaHTML = `
                <div class="bebidas-gallery-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; padding: 20px;">
                    <div class="card-pequena" style="cursor: pointer;" onclick="abrirModalBebida('Combo Burger Normal', './combosconpapasybebidas/comboburgernormal.png')">
                        <img src="./combosconpapasybebidas/comboburgernormal.png" style="width: 100%; border-radius: 8px;" alt="Combo Burger Normal">
                        <p style="text-align: center; font-weight: bold; margin-top: 5px; color: #000;">Combo Burger Normal</p>
                    </div>
                    <div class="card-pequena" style="cursor: pointer;" onclick="abrirModalBebida('Combo Burger Papuda', './combosconpapasybebidas/comboburgerpapuda.png')">
                        <img src="./combosconpapasybebidas/comboburgerpapuda.png" style="width: 100%; border-radius: 8px;" alt="Combo Burger Papuda">
                        <p style="text-align: center; font-weight: bold; margin-top: 5px; color: #000;">Combo Burger Papuda</p>
                    </div>
                    <div class="card-pequena" style="cursor: pointer;" onclick="abrirModalBebida('Combo Burger Super', './combosconpapasybebidas/comboburgersuper.png')">
                        <img src="./combosconpapasybebidas/comboburgersuper.png" style="width: 100%; border-radius: 8px;" alt="Combo Burger Super">
                        <p style="text-align: center; font-weight: bold; margin-top: 5px; color: #000;">Combo Burger Super</p>
                    </div>
                    <div class="card-pequena" style="cursor: pointer;" onclick="abrirModalBebida('Combo Perro Normal', './combosconpapasybebidas/comboperronormal.png')">
                        <img src="./combosconpapasybebidas/comboperronormal.png" style="width: 100%; border-radius: 8px;" alt="Combo Perro Normal">
                        <p style="text-align: center; font-weight: bold; margin-top: 5px; color: #000;">Combo Perro Normal</p>
                    </div>
                </div>
            `;
            panel.insertAdjacentHTML("beforeend", galeriaHTML);
            return;
        }
        // COMBOS MIXTOS
        if (catNorm.includes('COMBOS MIXTOS')) {
            panel.innerHTML = "";
            const galeriaHTML = `
                <div class="bebidas-gallery-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; padding: 20px;">
                    <div class="card-pequena" style="cursor: pointer;" onclick="abrirModalBebida('De La Casa', './combosmixtos/delacasa.png')">
                        <img src="./combosmixtos/delacasa.png" style="width: 100%; border-radius: 8px;" alt="De La Casa">
                        <p style="text-align: center; font-weight: bold; margin-top: 5px; color: #000;">De La Casa</p>
                    </div>
                    <div class="card-pequena" style="cursor: pointer;" onclick="abrirModalBebida('Emparejados', './combosmixtos/emparejados.png')">
                        <img src="./combosmixtos/emparejados.png" style="width: 100%; border-radius: 8px;" alt="Emparejados">
                        <p style="text-align: center; font-weight: bold; margin-top: 5px; color: #000;">Emparejados</p>
                    </div>
                    <div class="card-pequena" style="cursor: pointer;" onclick="abrirModalBebida('Familiar 3', './combosmixtos/familiar3.png')">
                        <img src="./combosmixtos/familiar3.png" style="width: 100%; border-radius: 8px;" alt="Familiar 3">
                        <p style="text-align: center; font-weight: bold; margin-top: 5px; color: #000;">Familiar 3</p>
                    </div>
                    <div class="card-pequena" style="cursor: pointer;" onclick="abrirModalBebida('Familiar 4', './combosmixtos/familiar4.png')">
                        <img src="./combosmixtos/familiar4.png" style="width: 100%; border-radius: 8px;" alt="Familiar 4">
                        <p style="text-align: center; font-weight: bold; margin-top: 5px; color: #000;">Familiar 4</p>
                    </div>
                </div>
            `;
            panel.insertAdjacentHTML("beforeend", galeriaHTML);
            return;
        }
        // NUESTRAS SALSAS
        if (catNorm.includes('NUESTRAS SALSAS')) {
            panel.innerHTML = "";
            const galeriaHTML = `
                <div class="bebidas-gallery-grid" style="display: grid; grid-template-columns: 1fr; gap: 15px; padding: 20px; max-width: 420px; margin: 0 auto;">
                    <div class="card-pequena" style="cursor: pointer;" onclick="abrirModalBebida('Salsas de la Casa', './nuestrassalsas/salsasdelacasa.png')">
                        <img src="./nuestrassalsas/salsasdelacasa.png" style="width: 100%; border-radius: 8px;" alt="Salsas de la Casa">
                        <p style="text-align: center; font-weight: bold; margin-top: 5px; color: #000;">Salsas de la Casa</p>
                    </div>
                </div>
            `;
            panel.insertAdjacentHTML("beforeend", galeriaHTML);
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

    const categoryOrderBtn = document.createElement('a');
    const categoryOrderBtnId = `btn-category-head-${selectedCategory.key || 'general'}`;
    categoryOrderBtn.className = 'category-hero-order-btn';
    categoryOrderBtn.href = `${WHATSAPP_BASE_URL}?text=${encodeURIComponent(`Hola ROAL BURGER! Quiero hacer un pedido de la categoria ${selectedCategory.name}`)}`;
    categoryOrderBtn.target = '_blank';
    categoryOrderBtn.rel = 'noopener noreferrer';
    categoryOrderBtn.textContent = 'Hacer pedido';
    categoryOrderBtn.addEventListener('click', () => {
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

    if (options.fromUserClick) {
        panel.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        panel.classList.remove('focus-highlight');
        void panel.offsetWidth;
        panel.classList.add('focus-highlight');
    }
}
// --- FUNCIÓN GLOBAL MODAL BEBIDAS ---
function abrirModalBebida(nombre, ruta, categoria) {
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
    const buttonId = `btn-modal-${normalizeAssetLookup(safeCategory)}-${normalizeAssetLookup(nombre)}`;
    orderButton.type = 'button';
    orderButton.className = 'bebidas-modal-btn bebidas-modal-btn-primary';
    orderButton.textContent = 'Pedir este producto';
    orderButton.addEventListener('click', () => {
        modal.remove();
        startProductOrderFlow(nombre, safeCategory, buttonId);
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



// ===== MODAL DE PROMOCIÓN =====
const PROMO_DAY_NAME = 'Hamburguesa del dia';

function resetPromoSelection() {
    const selector = document.getElementById('promoBurgerSelector');
    const orderButton = document.getElementById('promoOrderButton');
    if (selector) {
        selector.hidden = true;
    }
    if (orderButton) {
        orderButton.textContent = 'Pedir promo del dia';
    }
}

function initPromoModal() {
    setTimeout(function () {
        var modal = document.getElementById('promoModal');
        if (modal) {
            resetPromoSelection();
            modal.classList.add('is-open');
            document.body.style.overflow = 'hidden';
        }
    }, 2000);
}

function showPromoBurgerOptions() {
    const selector = document.getElementById('promoBurgerSelector');
    const orderButton = document.getElementById('promoOrderButton');
    if (selector) {
        selector.hidden = false;
    }
    if (orderButton) {
        orderButton.textContent = 'Elige tu burger';
    }
    trackButtonClick('btn-promo-dia', `${PROMO_DAY_NAME} - Elegir burger`);
}

function orderPromoBurger(burgerName) {
    const safeBurgerName = String(burgerName || '').trim() || 'Burger Ranchera';
    const message = `Hola ROAL BURGER, quiero pedir la promo del dia de la imagen: ${safeBurgerName}.`;
    trackButtonClick('btn-promo-dia-order', `${PROMO_DAY_NAME} - ${safeBurgerName}`);
    closePromoModal();
    window.open(`${WHATSAPP_BASE_URL}?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
}

function closePromoModal() {
    var modal = document.getElementById('promoModal');
    if (modal) {
        modal.classList.remove('is-open');
        document.body.style.overflow = 'auto';
        resetPromoSelection();
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
    }
});

document.addEventListener('DOMContentLoaded', () => {
    initCartUI();
    initPromoModal();
    setupMenuNavigation();
    updateDynamicWhatsAppLink(activeMenuSection);
    // Carrusel de destacados: fallback local inmediato, luego Firestore si responde
    const featuredCarousel = document.getElementById('featured-carousel-dynamic');
    // Array local con rutas en la raíz del proyecto
    const localFeatured = [
        { nombre: 'DE LA CASA', image_url: 'losmaspedidos/delacasa.png' },
        { nombre: 'EMPAREJADOS', image_url: 'losmaspedidos/emparejados.png' },
        { nombre: 'FAMILIAR 3', image_url: 'losmaspedidos/familiar3.png' },
        { nombre: 'FAMILIAR 4', image_url: 'losmaspedidos/familiar4.png' }
    ];
    if (featuredCarousel) {
        renderFeaturedCards(featuredCarousel, localFeatured);
        // Intentar cargar desde Firestore si está disponible
        if (typeof initFirebaseServices === 'function') {
            try {
                const firebaseDb = initFirebaseServices().db;
                firebaseDb.collection('productos').where('es_destacado', '==', true).get().then((snapshot) => {
                    const featuredFromDb = snapshot.docs.map((doc) => {
                        const data = doc.data();
                        return {
                            nombre: data.nombre || data.name || 'Producto',
                            image_url: data.image_url || ''
                        };
                    }).filter(item => item.image_url);
                    if (featuredFromDb.length > 0) {
                        renderFeaturedCards(featuredCarousel, featuredFromDb);
                    }
                }).catch(() => {/* fallback silencioso */});
            } catch (e) {/* fallback silencioso */}
        }
    }

    applyBrandingConfig(DEFAULT_BRANDING);
    buttonConfigsMap = new Map(
        Object.values(DEFAULT_PUBLIC_BUTTONS).map((button) => [button.id, { ...button }])
    );
    renderConfiguredButtons();
    renderCategoryExplorer();
});
