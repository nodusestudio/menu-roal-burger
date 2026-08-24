// Motor de validación server-side del precio de un pedido del checkout web público
// (submitPublicOrder, ver index.js). Reutiliza lo que ya existe y está probado en producción
// para el agente de IA (agent/tools.js, agent/orderLogic.js) y agrega las piezas que le faltan
// — sobre todo tablas de precio que en src/js/script-v2.js están escritas a mano en el JS, sin
// ningún respaldo en Firestore, así que no hay forma de leerlas: hay que portarlas tal cual.
//
// SYNC: si cambia la lógica de precio equivalente en src/js/script-v2.js, actualizar también
// aquí. Referencias de línea abajo apuntan a la versión de script-v2.js vigente al portar esto.
//
// Política de corrección (elegida explícitamente por el negocio): NUNCA rechazar un pedido por
// una discrepancia de precio. Para cada línea del carrito, el servidor calcula un precio "piso"
// verificado contra el catálogo real; el precio final de esa línea es el MAYOR entre lo que
// mandó el navegador y ese piso (nunca se cobra de menos de lo verificado, nunca se le exige de
// más a un cliente que ya venía pagando correctamente — incluye extras de upgrade que el
// navegador ya sumó al unitPrice y que el servidor no puede reconstruir por separado, ver nota
// en resolveServerLinePrice). Mismatches grandes quedan en el log para revisión manual.
'use strict';

const { fetchAllSellableItems, findProductByName } = require('./agent/tools');
const orderLogic = require('./agent/orderLogic');

const MISMATCH_LOG_TOLERANCE = 50; // COP — por debajo de esto, solo redondeos, no se loguea
const RECOMMENDED_DAY_DISCOUNT_RATE = 0.2; // SYNC: script-v2.js:3648
const LOYALTY_POINT_VALUE_COP = 10; // 100 puntos = $1.000 COP — tasa de canje de puntos de lealtad

// SYNC: script-v2.js:8091-8097
function normalizeCategoryKey(value) {
    return String(value || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
}

function normalizeImagePathForCompare(value) {
    return String(value || '').trim().replace(/\\/g, '/').toLowerCase();
}

function parseLocalizedPrice(value) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    const digits = String(value || '').replace(/[^\d]/g, '');
    return digits ? Number(digits) : 0;
}

// ── Tablas de precio hardcodeadas en script-v2.js, sin respaldo en Firestore ────────────────
// El texto de cada `label` es el que el cliente concatena al productName al agregar al carrito
// (`${productName} - ${optionItem.label}`, ver script-v2.js:7135) — por eso el match es por
// "el productName normalizado INCLUYE el label normalizado", no una igualdad exacta.

// SYNC: script-v2.js:6800-6819
function getEntradaOptions(productName) {
    const n = normalizeCategoryKey(productName);
    if (n.includes('papas')) {
        return [
            { label: 'Pequena (150 gr.)', price: '7.000' },
            { label: 'Mediana (300 gr.)', price: '11.000' },
            { label: 'Grande (450 gr.)', price: '16.000' }
        ];
    }
    if (n.includes('teque')) {
        return [
            { label: 'X5 unidades', price: '11.000' },
            { label: 'X10 unidades', price: '20.000' }
        ];
    }
    return [];
}

// SYNC: script-v2.js:6821-6857
function getBebidasYAdicionalesOptions(productName) {
    const n = normalizeCategoryKey(productName);
    if (n.includes('adicion')) {
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
    if (n.includes('bebida')) {
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

// SYNC: script-v2.js:4222-4235
function getBurgerClasicasOptions(productName) {
    const n = normalizeCategoryKey(productName);
    if (!n.includes('normal')) return [];
    return [
        { label: 'Pequena | 1 carne', price: '14.000' },
        { label: 'Pequena | 2 carne', price: '18.000' },
        { label: 'Mediana | 1 carne', price: '17.000' },
        { label: 'Mediana | 2 carne', price: '22.000' }
    ];
}

// SYNC: script-v2.js:4237-4248
function getSalchipapaOptions(productName) {
    const n = normalizeCategoryKey(productName);
    if (!n.includes('super')) return [];
    return [
        { label: 'Pequena', price: '19.000' },
        { label: 'Grande', price: '34.000' }
    ];
}

// SYNC: script-v2.js:4184-4220
function resolveStaticOptionPrice(productName, categoryName) {
    const normalizedCategoryName = normalizeCategoryKey(categoryName);
    const normalizedProductName = normalizeCategoryKey(productName);

    if (normalizedCategoryName.includes('entradas')) {
        const options = getEntradaOptions(productName);
        const matched = options.find((item) => normalizedProductName.includes(normalizeCategoryKey(item.label)));
        const fallback = options[0];
        return options.length ? parseLocalizedPrice((matched || fallback)?.price ?? null) : null;
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

// SYNC: script-v2.js:3651-3656
const COMBOS_CON_PAPAS_IMAGE_PRICES = {
    './combosconpapasybebidas/comboburgernormal.png': { 1: 21000, 2: 38000, 3: 57000, 4: 73000 },
    './combosconpapasybebidas/comboburgerpapuda.png': { 1: 27000, 2: 48000, 3: 70000, 4: 91000 },
    './combosconpapasybebidas/comboburgersuper.png': { 1: 26000, 2: 46000, 3: 68000, 4: 87000 },
    './combosconpapasybebidas/comboperronormal.png': { 1: 17000, 2: 25000, 3: 38000, 4: 49000 }
};
const COMBOS_CON_PAPAS_IMAGE_PRICES_NORMALIZED = Object.fromEntries(
    Object.entries(COMBOS_CON_PAPAS_IMAGE_PRICES).map(([k, v]) => [normalizeImagePathForCompare(k), v])
);

// SYNC: script-v2.js:4250-4318 (solo la rama de combo-con-papas por imagen; las ramas de
// URLs de Firebase Storage no aplican acá porque orderOptions.imagePath ya llega como el path
// local stripped, ver _stripHeavyImageForOrder en buildCartOrderItems)
function resolveManualImagePrice(orderOptions) {
    const imagePath = normalizeImagePathForCompare(orderOptions?.imagePath);
    if (!imagePath) return null;
    const table = COMBOS_CON_PAPAS_IMAGE_PRICES_NORMALIZED[imagePath];
    if (!table) return null;
    const peopleCount = Number(orderOptions?.peopleCount || 0);
    const price = table[peopleCount];
    return price === undefined ? null : Number(price);
}

// SYNC: script-v2.js:3919-3927 / 3904-3907 — combos mixtos hardcodeados por nombre
function resolveCombosMixtosPrice(productName, categoryName) {
    if (!normalizeCategoryKey(categoryName).includes('combos mixtos')) return null;
    const n = normalizeCategoryKey(productName);
    if (n.includes('de la casa') || n.includes('delacasa')) return 49000;
    if (n.includes('emparejados')) return 45000;
    if (n.includes('familiar') && (n.includes('3') || n.includes('tres'))) return 48000;
    if (n.includes('familiar') && (n.includes('4') || n.includes('cuatro'))) return 44000;
    return null;
}

const COMBO_EXTRA_PRICE = 7000; // SYNC: script-v2.js:3638

// Aplica el descuento de "Recomendado del día" usando SIEMPRE la constante del servidor — nunca
// el discountRate que venga del cliente, para no permitir que alguien se auto-asigne un
// porcentaje mayor al real (ver "Riesgos residuales aceptados" en el plan).
function applyServerDiscount(price, orderOptions) {
    if (!orderOptions?.recommendedDiscount) return price;
    return Math.round(Number(price || 0) * (1 - RECOMMENDED_DAY_DISCOUNT_RATE));
}

// Prefijos de couponId (ver script-v2.js normalizeOrderOptions) que sí tienen un descuento real
// verificable en precio -- 2x1 (2x1_/2x1p_) no entra: no reduce ningun numero, cobra el precio
// normal de 1 unidad y la "unidad extra gratis" es una promesa operativa que le llega a cocina
// por el mensaje de WhatsApp, no algo que este validador de precios pueda tocar.
const ENFORCED_COUPON_PREFIXES = ['desc_', 'ce_'];
function isEnforcedCouponId(couponId) {
    const id = String(couponId || '');
    return id.length > 0 && ENFORCED_COUPON_PREFIXES.some((p) => id.startsWith(p));
}

function isCouponLockActive(lock) {
    if (!lock) return false;
    const expiresAtMs = lock.expiresAt?.toMillis ? lock.expiresAt.toMillis() : new Date(lock.expiresAt).getTime();
    return Number.isFinite(expiresAtMs) && expiresAtMs > Date.now();
}

// El bloqueo de "un cupon cada 24h" antes vivia solo en localStorage (_RDM_LOCK_PREFIX,
// script-v2.js) -- el servidor recien se enteraba cuando el ADMIN procesaba el pedido anterior a
// mano, nunca en el momento de redimir. Cualquiera que cerrara sesion/borrara datos del navegador
// podia volver a redimir el mismo cupon sin esperar. Como redimir ya exige sesion real
// (activeCustomerProfile), reusamos el mismo campo que ya escribe el admin
// (clientes/{id}.cupones_bloqueados) para chequear Y fijar el bloqueo aqui mismo.
async function fetchCouponLocks(db, clientId) {
    if (!clientId) return {};
    const snap = await db.collection('clientes').doc(clientId).get();
    return snap.exists ? (snap.data()?.cupones_bloqueados || {}) : {};
}

// Misma lectura de clientes/{clientId} que fetchCouponLocks, pero para el saldo de puntos de
// lealtad -- se separa en su propia función (en vez de fusionar ambas en un solo fetch) para no
// tocar la firma/comportamiento ya probado de fetchCouponLocks; Firestore igual deduplica lecturas
// concurrentes del mismo doc dentro de un único Promise.all.
async function fetchLoyaltyPointsBalance(db, clientId) {
    if (!clientId) return 0;
    const snap = await db.collection('clientes').doc(clientId).get();
    return snap.exists ? Math.max(0, Number(snap.data()?.puntosDisponibles) || 0) : 0;
}

// Precio "piso" verificado de una línea del carrito — no incluye extras de upgrade (bebida/
// acompañante/combo-pack agregados desde el sheet de upsell), porque el navegador los suma al
// unitPrice ANTES de guardar el carrito y no deja rastro de cuál fue ni cuánto costaba (ver
// addItemToCart, script-v2.js:5896/5914) — no hay nada server-side contra qué verificarlos hoy.
// Por eso el precio final de la línea es max(unitPrice del cliente, este piso): nunca se cobra
// de menos de lo que el catálogo real dice que vale la línea sin extras, pero un extra legítimo
// (que sube el precio, nunca lo baja) se sigue respetando tal cual.
//
// forceNoDiscount: true cuando el couponId de esta linea ya esta bloqueado (redimido hace menos
// de 24h) -- el piso pasa a ser el precio SIN el descuento del cupon, ignorando cualquier
// discountRate/precio_combo que traiga.
function resolveServerLineFloor(item, catalog, combosEspeciales, forceNoDiscount = false) {
    const productName = String(item?.productName || '');
    const categoryName = String(item?.categoryName || '');
    const orderOptions = forceNoDiscount
        ? { ...(item?.orderOptions || {}), recommendedDiscount: false }
        : (item?.orderOptions || {});

    // Combo especial: nunca confiar en orderOptions.staticPrice (lo pone el cliente) — buscar el
    // doc real de combos_especiales por título.
    if (item?.isComboEspecial) {
        const match = findProductByName(combosEspeciales, productName);
        if (!match) return null; // no matcheó ningún combo especial activo — línea sin piso verificable
        return forceNoDiscount ? (Number(match.precioOriginal) || Number(match.precio) || 0) : (Number(match.precio) || 0);
    }

    const manualImagePrice = resolveManualImagePrice(orderOptions);
    if (manualImagePrice !== null) {
        const withCombo = orderOptions?.type === 'combo' ? manualImagePrice + COMBO_EXTRA_PRICE : manualImagePrice;
        return applyServerDiscount(withCombo, orderOptions);
    }

    const combosMixtosPrice = resolveCombosMixtosPrice(productName, categoryName);
    if (combosMixtosPrice !== null) {
        return applyServerDiscount(combosMixtosPrice, orderOptions);
    }

    const staticOptionPrice = resolveStaticOptionPrice(productName, categoryName);
    if (staticOptionPrice !== null) {
        return applyServerDiscount(staticOptionPrice, orderOptions);
    }

    const catalogMatch = findProductByName(catalog, productName);
    if (catalogMatch) {
        const base = Number(catalogMatch.precio) || 0;
        const withCombo = orderOptions?.type === 'combo' ? base + COMBO_EXTRA_PRICE : base;
        return applyServerDiscount(withCombo, orderOptions);
    }

    return null; // no se pudo verificar — ver política de "unresolved" en computeServerPricedOrder
}

async function computeServerPricedOrder(db, {
    items,
    fulfillmentType,
    deliveryLatitude,
    deliveryLongitude,
    deliveryFeeSubmitted,
    promo2x1IncrementoFeeExpected,
    clientId,
    pointsToRedeemRequested
}) {
    const [catalog, combosEspecialesSnapshot, couponLocks, puntosDisponibles] = await Promise.all([
        fetchAllSellableItems(db),
        db.collection('combos_especiales').get(),
        fetchCouponLocks(db, clientId),
        fetchLoyaltyPointsBalance(db, clientId)
    ]);

    const combosEspeciales = combosEspecialesSnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((c) => c.activo !== false && orderLogic.isComboActiveNow(c.horario))
        .map((c) => ({
            nombre: String(c.titulo || '').trim(),
            precio: Number(c.precio_combo || c.precio_original) || 0,
            precioOriginal: Number(c.precio_original) || Number(c.precio_combo) || 0
        }))
        .filter((c) => c.nombre && c.precio > 0);

    let subtotal = 0;
    let mismatchDetected = false;
    let mismatchDetails = [];
    const newlyRedeemedCouponIds = new Set();
    const pricedItems = (Array.isArray(items) ? items : []).map((item) => {
        const quantity = Math.max(0, Number(item.quantity || 0));
        const clientUnitPrice = Number(item.unitPrice || 0);
        const couponId = String(item?.orderOptions?.couponId || '');
        const enforceCoupon = isEnforcedCouponId(couponId);
        const couponLocked = enforceCoupon && isCouponLockActive(couponLocks[couponId]);
        const floor = resolveServerLineFloor(item, catalog, combosEspeciales, couponLocked);

        let finalUnitPrice;
        if (floor === null) {
            // No se pudo verificar contra ningún catálogo/tabla conocida — no bloquear, confiar
            // en el número del cliente para esta línea puntual, pero dejarlo visible en logs.
            finalUnitPrice = clientUnitPrice;
            mismatchDetails.push({ type: 'UNRESOLVED', productName: item.productName, categoryName: item.categoryName, clientUnitPrice });
        } else {
            finalUnitPrice = Math.max(clientUnitPrice, floor);
            if (finalUnitPrice !== clientUnitPrice && Math.abs(finalUnitPrice - clientUnitPrice) > MISMATCH_LOG_TOLERANCE) {
                mismatchDetected = true;
                mismatchDetails.push({
                    type: couponLocked ? 'COUPON_ALREADY_REDEEMED' : 'BELOW_FLOOR',
                    productName: item.productName, categoryName: item.categoryName, clientUnitPrice, floor, couponId: couponId || undefined
                });
            }
        }

        if (enforceCoupon && !couponLocked) {
            newlyRedeemedCouponIds.add(couponId);
        }

        subtotal += finalUnitPrice * quantity;
        return {
            ...item,
            unitPrice: finalUnitPrice,
            subtotal: finalUnitPrice * quantity,
            discountAmount: item.originalUnitPrice ? Math.max(0, (Number(item.originalUnitPrice) - finalUnitPrice) * quantity) : (item.discountAmount ?? null)
        };
    });

    // Tarifa de domicilio: con GPS, el servidor SÍ puede saber la zona real — se sobreescribe
    // directo en cualquier dirección (no es un "piso", es el valor correcto conocido). Sin GPS
    // no hay forma de verificar sin geocoding (misma limitación que ya existía client-side) —
    // se respeta lo enviado con el mismo piso de seguridad de siempre.
    let deliveryFee = Number(deliveryFeeSubmitted || 0);
    let deliveryFeeVerified = false;
    if (fulfillmentType === 'delivery') {
        if (Number.isFinite(Number(deliveryLatitude)) && Number.isFinite(Number(deliveryLongitude))) {
            const zone = orderLogic.findDeliveryZoneForLocation({ latitude: Number(deliveryLatitude), longitude: Number(deliveryLongitude) });
            const expected = zone ? zone.fee : orderLogic.DELIVERY_FEE_AMOUNT;
            if (Number(deliveryFee) !== Number(expected)) {
                mismatchDetected = true;
                mismatchDetails.push({ type: 'DELIVERY_FEE', clientFee: deliveryFee, expectedFee: expected });
            }
            deliveryFee = Number(expected);
            deliveryFeeVerified = true;
        }
        if (!(deliveryFee > 0)) {
            deliveryFee = orderLogic.DELIVERY_FEE_AMOUNT;
        }
    } else {
        deliveryFee = 0;
    }

    // Cargo de empaque del 2x1: constante fija conocida, no depende de ningún catálogo.
    const promo2x1IncrementoFee = Number(promo2x1IncrementoFeeExpected || 0);

    // Canje de puntos de lealtad: nunca se rechaza una solicitud fuera de rango, se clampa contra
    // la fuente de verdad del servidor (mismo espíritu que resolveServerLineFloor) -- el tope es
    // el saldo real disponible Y el subtotal (el domicilio nunca se paga con puntos, simétrico con
    // que los puntos tampoco se ganan sobre el domicilio, ver awardLoyaltyPoints en index.js).
    const maxPointsBySubtotal = Math.floor(subtotal / LOYALTY_POINT_VALUE_COP);
    const pointsRedeemed = Math.max(0, Math.min(
        Math.floor(Number(pointsToRedeemRequested) || 0),
        puntosDisponibles,
        maxPointsBySubtotal
    ));
    const pointsDiscountAmount = pointsRedeemed * LOYALTY_POINT_VALUE_COP;

    const total = subtotal + deliveryFee + promo2x1IncrementoFee - pointsDiscountAmount;

    return {
        items: pricedItems,
        subtotal,
        deliveryFee,
        deliveryFeeVerified,
        promo2x1IncrementoFee,
        pointsRedeemed,
        pointsDiscountAmount,
        total,
        mismatchDetected,
        mismatchDetails,
        newlyRedeemedCouponIds: Array.from(newlyRedeemedCouponIds)
    };
}

module.exports = {
    computeServerPricedOrder,
    LOYALTY_POINT_VALUE_COP
};
