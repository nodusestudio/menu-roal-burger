// Test de la IA de publicaciones de Instagram (functions/instagramIA.js) contra el emulador de Firestore.
// Claude se simula con un cliente falso: no sale nada a la red. Cubre: configuración, planificación de
// días y horas, elección de productos, validación del texto (sin precios ni promos, hashtags solo de la
// lista), generación de borradores (NUNCA quedan programados), regenerar y aprobar.
//
// Requiere el emulador de Firestore corriendo:
//   firebase emulators:exec --only firestore "node --test tests/instagram-ia.test.js"

const path = require('node:path');
const { test, before, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const sharp = require('sharp');

const FUNCTIONS_DIR = path.join(__dirname, '..', 'functions');

const { getFirestore } = require(require.resolve('firebase-admin/firestore', { paths: [FUNCTIONS_DIR] }));
require(path.join(FUNCTIONS_DIR, 'index.js')); // inicializa firebase-admin igual que en producción
const cd = require(path.join(FUNCTIONS_DIR, 'codigoDia.js'));
const posts = require(path.join(FUNCTIONS_DIR, 'instagramPosts.js'));
const ia = require(path.join(FUNCTIONS_DIR, 'instagramIA.js'));

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const LUNES = '2026-10-12';
const AHORA = cd.dateKeyToMs(LUNES) + 8 * HOUR; // lunes 8 a. m. Bogotá

let db;

async function borrarColeccion(nombre) {
    const snap = await db.collection(nombre).get();
    await Promise.all(snap.docs.map((d) => d.ref.delete()));
}

const PRODUCTOS = {
    p1: { nombre: 'Burger Plus', categoria: 'BURGER PREMIUM', precio: 30000, image_url: 'https://x/burger-plus.jpg', estado: 'active', descripcion: 'Carne, queso y salsa de la casa' },
    p2: { nombre: 'Perro Especial', categoria: 'PERROS CALIENTES', precio: 15000, image_url: 'https://x/perro.jpg', estado: 'active' },
    p3: { nombre: 'Salchipapa Grande', categoria: 'SALCHIPAPAS', precio: 21000, image_url: 'https://x/salchi.jpg', estado: 'active' },
    p4: { nombre: 'Pepito Mix', categoria: 'PEPITOS VENEZOLANOS', precio: 29000, image_url: 'https://x/pepito.jpg', estado: 'active' },
    sinFoto: { nombre: 'Sin Foto', categoria: 'BURGER PREMIUM', precio: 10000, image_url: '', estado: 'active' },
    pausado: { nombre: 'Pausado', categoria: 'BURGER PREMIUM', precio: 10000, image_url: 'https://x/p.jpg', estado: 'paused' },
    gaseosa: { nombre: 'Gaseosa', categoria: 'BEBIDAS', precio: 4000, image_url: 'https://x/g.jpg', estado: 'active' }
};

// Claude falso: responde según el producto que lee en el mensaje. `respuesta(nombre, n)` puede devolver texto o lanzar.
function clienteFalso({ respuesta } = {}) {
    const llamadas = [];
    const porDefecto = (nombre) => JSON.stringify({
        caption: `¿Antojo de ${nombre}? Aquí lo tienes, bien preparado y con ese sabor que te encanta. Pídelo en roalburger.com 🍔`,
        hashtags: ['RoalBurger', 'armenia', 'inventado', 'hamburguesas', 'quindio', 'comidarapida', 'antojo']
    });
    return {
        llamadas,
        messages: {
            create: async (req) => {
                const user = req.messages[req.messages.length - 1].content;
                const nombre = /Producto: (.+)/.exec(user)?.[1] || '';
                llamadas.push({ nombre, req });
                const n = llamadas.filter((l) => l.nombre === nombre).length;
                const texto = (respuesta ? respuesta(nombre, n, user) : null) ?? porDefecto(nombre);
                return { content: [{ type: 'text', text: texto }] };
            }
        }
    };
}

async function jpeg(ancho = 1080, alto = 1350) {
    return sharp({ create: { width: ancho, height: alto, channels: 3, background: '#ff6a00' } }).jpeg().toBuffer();
}

before(() => { db = getFirestore(); });

beforeEach(async () => {
    await Promise.all([
        borrarColeccion('productos'), borrarColeccion(posts.POSTS_COLLECTION), borrarColeccion(posts.POSTS_IMG_COLLECTION),
        borrarColeccion(ia.CONFIG_COLLECTION), borrarColeccion(cd.CONFIG_COLLECTION)
    ]);
    await Promise.all(Object.entries(PRODUCTOS).map(([id, p]) => db.collection('productos').doc(id).set(p)));
});

// ── Configuración ────────────────────────────────────────────────────────────

test('configuración: valores por defecto, límites y limpieza de hashtags y horarios', () => {
    const d = ia.sanitizeConfig({});
    assert.deepEqual([d.postsPorSemana, d.noRepetirDias, d.maxHashtags, d.horarios], [3, 14, 12, ['12:30', '19:00']]);
    assert.ok(d.hashtagsMarca.includes('roalburger'));
    assert.deepEqual(d.hashtagsPorCategoria['PERROS CALIENTES'], ['perroscalientes', 'hotdog']);
    const c = ia.sanitizeConfig({
        postsPorSemana: 99, noRepetirDias: -5, maxHashtags: 100, horarios: ['9:05', '25:00', 'tarde', '18:30'], hashtagsMarca: '#Uno, dos  #UNO',
        hashtagsPorCategoria: { 'salchipapas': '#salchi #papas' }, categoriasExcluidas: ['bebidas'], productosExcluidos: ['x', '']
    });
    assert.deepEqual([c.postsPorSemana, c.noRepetirDias, c.maxHashtags], [14, 0, 30]);
    assert.deepEqual(c.horarios, ['09:05', '18:30']);
    assert.deepEqual(c.hashtagsMarca, ['Uno', 'dos']);
    assert.deepEqual(c.hashtagsPorCategoria, { SALCHIPAPAS: ['salchi', 'papas'] });
    assert.deepEqual([c.categoriasExcluidas, c.productosExcluidos], [['BEBIDAS'], ['x']]);
    assert.deepEqual(ia.sanitizeConfig({ horarios: ['mal'] }).horarios, ['12:30', '19:00'], 'sin horarios válidos vuelve al defecto');
});

test('configuración: se guarda y se vuelve a leer', async () => {
    assert.equal((await ia.leerConfigContenido(db)).postsPorSemana, 3);
    await ia.guardarConfigContenido(db, { postsPorSemana: 5, tono: 'Muy formal', llamadoAccion: '' }, 'admin');
    const c = await ia.leerConfigContenido(db);
    assert.deepEqual([c.postsPorSemana, c.tono, c.llamadoAccion], [5, 'Muy formal', '']);
});

// ── Planificación ────────────────────────────────────────────────────────────

test('planificar: porSemana por semana, repartidos, sin miércoles, sin días ocupados, horarios rotando y siempre a futuro', () => {
    const base = { desde: LUNES, dias: 14, porSemana: 3, horarios: ['12:30', '19:00'], diasCerrados: [3], nowMs: AHORA };
    const slots = ia.planificarSlots(base);
    assert.equal(slots.length, 6);
    assert.ok(slots.every((s) => cd.dowDe(s.fecha) !== 3), 'ninguno cae miércoles');
    assert.ok(slots.every((s) => s.ms >= AHORA + HOUR));
    assert.deepEqual(slots.map((s) => s.ms), [...slots.map((s) => s.ms)].sort((a, b) => a - b));
    assert.deepEqual(slots.map((s) => s.hora).slice(0, 4), ['12:30', '19:00', '12:30', '19:00']);
    const semana1 = slots.filter((s) => s.fecha <= '2026-10-18');
    assert.equal(semana1.length, 3);
    assert.equal(new Set(slots.map((s) => s.fecha)).size, 6, 'un hueco por día');
    // Un día ocupado no se usa.
    const ocupado = new Set([slots[0].fecha]);
    const sin = ia.planificarSlots({ ...base, ocupados: ocupado });
    assert.ok(!sin.some((s) => ocupado.has(s.fecha)));
    // Pocos días disponibles: no inventa más huecos de los que caben.
    assert.equal(ia.planificarSlots({ ...base, dias: 3, porSemana: 7 }).length, 2, 'lun y mar (el miércoles descansa)');
    // Hoy solo si falta más de 1 hora.
    const tarde = ia.planificarSlots({ ...base, dias: 1, porSemana: 1, nowMs: cd.dateKeyToMs(LUNES) + 12 * HOUR });
    assert.equal(tarde.length, 0, 'a las 12:00 ya no cabe el hueco de las 12:30 (falta menos de 1 h)');
    assert.equal(ia.planificarSlots({ ...base, desde: '2020-01-01', dias: 2, porSemana: 2 })[0].fecha >= LUNES, true, 'una fecha pasada se corrige a hoy');
});

// ── Elección de productos ────────────────────────────────────────────────────

test('elegir productos: solo con foto, activos y de categorías permitidas; los menos recientes primero y alternando categoría', () => {
    const productos = Object.entries(PRODUCTOS).map(([id, p]) => ({ id, ...p }));
    const base = { cantidad: 4, nowMs: AHORA, categoriasExcluidas: ['BEBIDAS'], rng: () => 0 };
    const e = ia.elegirProductos(productos, base);
    assert.deepEqual(e.map((p) => p.id).sort(), ['p1', 'p2', 'p3', 'p4'], 'sin foto, pausado ni bebidas');
    // El que se publicó hace poco va al final; el que nunca se publicó, primero.
    const recientes = new Map([['p1', AHORA - DAY], ['p2', AHORA - 20 * DAY], ['p3', AHORA - 40 * DAY]]);
    const orden = ia.elegirProductos(productos, { ...base, recientes, noRepetirMs: 14 * DAY }).map((p) => p.id);
    assert.equal(orden[0], 'p4', 'el que nunca se publicó');
    assert.ok(!orden.slice(0, 3).includes('p1'), 'p1 (de ayer) no entra antes que los demás');
    // Alterna categorías: nunca dos seguidos de la misma si hay otra opción.
    const dos = Object.values({ a: { id: 'a1', nombre: 'A1', categoria: 'X', image_url: 'u' }, b: { id: 'a2', nombre: 'A2', categoria: 'X', image_url: 'u' }, c: { id: 'b1', nombre: 'B1', categoria: 'Y', image_url: 'u' }, d: { id: 'b2', nombre: 'B2', categoria: 'Y', image_url: 'u' } });
    const alt = ia.elegirProductos(dos, { cantidad: 4, nowMs: AHORA, rng: () => 0 });
    for (let i = 1; i < alt.length; i++) assert.notEqual(alt[i].categoria, alt[i - 1].categoria);
    // Excluidos por id y por categoría; si piden más de los que hay, da otra vuelta sin romper.
    assert.ok(!ia.elegirProductos(productos, { ...base, excluidosIds: ['p1'] }).some((p) => p.id === 'p1'));
    assert.equal(ia.elegirProductos(productos, { ...base, cantidad: 9 }).length, 9);
    assert.deepEqual(ia.elegirProductos([], base), []);
});

// ── Texto de la IA ───────────────────────────────────────────────────────────

test('validar texto: rechaza precios, descuentos, promociones y "gratis"; los hashtags salen solo de la lista, con su mayúscula', () => {
    const config = ia.sanitizeConfig({});
    const banco = ia.bancoDeHashtags(config, 'PERROS CALIENTES');
    const bueno = 'Un perro caliente que te va a robar el antojo, calientico y lleno de sabor. Pídelo en roalburger.com 🌭';
    const r = ia.validarCopy({ caption: bueno, hashtags: ['PerrosCalientes', 'ARMENIA', 'inventadoPorLaIA', 'perroscalientes', 'hotdog'] }, banco, config);
    assert.deepEqual(r.hashtags.slice(0, 3), ['perroscalientes', 'armenia', 'hotdog'], 'respeta la lista, sin repetir ni inventar');
    assert.ok(!r.hashtags.includes('inventadoPorLaIA'));
    assert.ok(r.hashtags.length >= 6, 'se completa con los de marca');
    for (const mal of ['Hoy a solo $12.000 el perro más rico del barrio, ven por el tuyo ya mismo', 'Llévate el 20% de descuento en tu perro favorito de hoy mismo', 'Perro caliente 2x1 todo el día, no te lo pierdas bien rico', 'Pide tu promoción favorita y disfruta un perro caliente delicioso', 'Hoy te regalamos un perro, es gratis para ti ven por él ya', 'Usa el código del día y llévate tu perro caliente favorito bien rico']) {
        assert.throws(() => ia.validarCopy({ caption: mal, hashtags: [] }, banco, config), /precios|promociones|descuentos/i, mal.slice(0, 30));
    }
    assert.throws(() => ia.validarCopy({ caption: 'Corto', hashtags: [] }, banco, config), /muy corto/);
    assert.throws(() => ia.validarCopy({ caption: 'a'.repeat(901), hashtags: [] }, banco, config), /largo/);
    const tope = ia.validarCopy({ caption: bueno, hashtags: banco }, banco, { ...config, maxHashtags: 4 });
    assert.equal(tope.hashtags.length, 4);
    assert.deepEqual(ia.extraerJson('```json\n{"caption":"hola","hashtags":[]}\n```'), { caption: 'hola', hashtags: [] });
    assert.throws(() => ia.extraerJson('sin json'), /JSON/);
});

test('el prompt lleva el producto, la lista de hashtags, las reglas (sin precios) y el llamado a la acción', () => {
    const config = ia.sanitizeConfig({});
    const { system, user, banco } = ia.construirPrompt({ nombre: 'Burger Plus', categoria: 'BURGER PREMIUM', descripcion: 'Carne y queso' }, config);
    assert.match(user, /Producto: Burger Plus/);
    assert.match(user, /Descripción: Carne y queso/);
    assert.ok(banco.includes('hamburguesagourmet') && banco.includes('roalburger'));
    assert.match(system, /NO escribas precios, descuentos, promociones/);
    assert.match(system, /Pídelo en roalburger.com/);
    assert.match(system, /SOLO de la lista/);
    assert.match(ia.construirPrompt({ nombre: 'X', categoria: 'Y' }, config, { variacion: 2 }).user, /versión 3/);
    assert.match(ia.construirPrompt({ nombre: 'X', categoria: 'Y' }, config).user, /sin descripción/);
});

test('generar texto: reintenta una vez si la primera respuesta rompe las reglas; si falla dos veces, devuelve el error', async () => {
    const config = ia.sanitizeConfig({});
    const producto = { id: 'p2', ...PRODUCTOS.p2 };
    const cliente = clienteFalso({ respuesta: (nombre, n) => (n === 1
        ? JSON.stringify({ caption: 'Perro Especial a solo $15.000, ven por el tuyo hoy mismo y disfruta', hashtags: [] })
        : JSON.stringify({ caption: 'Perro Especial: crujiente, jugoso y listo para antojarte hoy. Pídelo en roalburger.com 🌭', hashtags: ['perroscalientes'] })) });
    const r = await ia.generarCopy(cliente, producto, config);
    assert.match(r.caption, /Perro Especial/);
    assert.equal(cliente.llamadas.length, 2);
    assert.match(cliente.llamadas[1].req.messages[0].content, /no cumplió las reglas/);
    const malo = clienteFalso({ respuesta: () => 'esto no es json' });
    await assert.rejects(ia.generarCopy(malo, producto, config), /JSON/);
    assert.equal(malo.llamadas.length, 2);
});

// ── Borradores ───────────────────────────────────────────────────────────────

test('generar: crea BORRADORES con la hora propuesta, producto, texto y hashtags de la lista; nunca programa nada', async () => {
    const cliente = clienteFalso();
    const r = await ia.generarBorradores(db, { desde: LUNES, dias: 14, porSemana: 3, cliente }, 'admin', { nowMs: AHORA });
    assert.equal(r.fallidos.length, 0);
    assert.equal(r.creados.length, 6);
    const docs = (await db.collection(posts.POSTS_COLLECTION).get()).docs.map((d) => d.data());
    assert.equal(docs.length, 6);
    for (const p of docs) {
        assert.equal(p.estado, 'borrador', 'la IA nunca deja algo programado');
        assert.equal(p.origen, 'ia');
        assert.equal(p.tipo, 'foto');
        assert.ok(p.programadaAtMs >= AHORA + HOUR);
        assert.ok(p.productoId && p.caption.length >= 20 && p.imagenes.length === 0);
        assert.match(p.notaIA, /^IA · /);
        assert.ok(!p.hashtags.includes('inventado'), 'solo hashtags de la lista');
        assert.ok(p.hashtags.length >= 6 && p.hashtags.length <= 12);
        assert.ok(!['sinFoto', 'pausado', 'gaseosa'].includes(p.productoId));
    }
    assert.equal(new Set(docs.map((p) => p.productoId)).size >= 4, true, 'rota entre los productos disponibles');
    assert.equal((await db.collection(posts.POSTS_COLLECTION).where('estado', '==', 'programada').get()).size, 0);
    assert.equal(cliente.llamadas.length, 6);
});

test('generar: respeta días ocupados y los días de descanso de la configuración; y no repite producto reciente', async () => {
    await db.collection(cd.CONFIG_COLLECTION).doc(cd.CONFIG_DOC).set({ diasCerrados: [3, 0] }); // miércoles y domingo
    const { id } = await posts.crearBorrador(db, { tipo: 'foto', caption: 'Ya hay una', productoId: 'p1', programadaAtMs: cd.dateKeyToMs('2026-10-13') + 19 * HOUR }, 'a', { nowMs: AHORA });
    assert.ok(id);
    const r = await ia.generarBorradores(db, { desde: LUNES, dias: 7, porSemana: 3, cliente: clienteFalso() }, 'admin', { nowMs: AHORA });
    const nuevos = (await db.collection(posts.POSTS_COLLECTION).get()).docs.filter((d) => d.id !== id).map((d) => d.data());
    for (const p of nuevos) {
        const fecha = cd.bogotaParts(p.programadaAtMs).dateKey;
        assert.ok(![0, 3].includes(cd.dowDe(fecha)), `${fecha} es día de descanso`);
        assert.notEqual(fecha, '2026-10-13', 'ese día ya tenía una publicación');
        assert.notEqual(p.productoId, 'p1', 'p1 se usó hace poco y hay otras opciones');
    }
    assert.equal(r.creados.length, nuevos.length);
});

test('generar: si la IA falla en un producto, los demás se crean y el fallo se informa; sin huecos o sin productos, mensajes claros', async () => {
    const cliente = clienteFalso({ respuesta: (nombre) => (nombre === 'Perro Especial' ? 'sin json' : null) });
    const r = await ia.generarBorradores(db, { desde: LUNES, dias: 7, porSemana: 4, cliente }, 'admin', { nowMs: AHORA });
    assert.ok(r.fallidos.length >= 1);
    assert.ok(r.fallidos.every((f) => f.producto === 'Perro Especial' && /JSON/.test(f.error)));
    assert.ok(r.creados.length >= 1);
    assert.equal((await db.collection(posts.POSTS_COLLECTION).get()).size, r.creados.length);

    await borrarColeccion(posts.POSTS_COLLECTION);
    await db.collection(cd.CONFIG_COLLECTION).doc(cd.CONFIG_DOC).set({ diasCerrados: [0, 1, 2, 3, 4, 5, 6] });
    const vacio = await ia.generarBorradores(db, { desde: LUNES, dias: 7, cliente: clienteFalso() }, 'a', { nowMs: AHORA });
    assert.deepEqual(vacio.creados, []);
    assert.match(vacio.mensaje, /No hay días libres/);

    await db.collection(cd.CONFIG_COLLECTION).doc(cd.CONFIG_DOC).set({ diasCerrados: [3] });
    await borrarColeccion('productos');
    await assert.rejects(ia.generarBorradores(db, { desde: LUNES, dias: 7, cliente: clienteFalso() }, 'a', { nowMs: AHORA }), /No hay productos/);
    await assert.rejects(ia.generarBorradores(db, { desde: LUNES, dias: 7 }, 'a', { nowMs: AHORA }), /IA no está configurada/);
});

// ── Regenerar y aprobar ──────────────────────────────────────────────────────

async function borradorIA(extra = {}) {
    const { id } = await posts.crearBorrador(db, {
        tipo: 'foto', origen: 'ia', caption: 'Texto original de la IA para este producto, bien antojador. Pídelo en roalburger.com', hashtags: ['roalburger', 'armenia'],
        productoId: 'p1', programadaAtMs: AHORA + 3 * HOUR, ...extra
    }, 'admin', { nowMs: AHORA });
    return id;
}

test('regenerar: cambia el texto y los hashtags de ese borrador (otra versión), una programada vuelve a borrador; no toca lo publicado ni lo sin producto', async () => {
    const id = await borradorIA();
    const cliente = clienteFalso({ respuesta: (nombre, n, user) => JSON.stringify({ caption: `Versión nueva de ${nombre}: más jugosa, más rica, más tuya hoy. Pídelo en roalburger.com 🍔 [${/versión (\d)/.exec(user)?.[1]}]`, hashtags: ['hamburguesas'] }) });
    const r = await ia.regenerarCopy(db, { id, cliente }, 'admin', { nowMs: AHORA });
    assert.match(r.caption, /Versión nueva de Burger Plus/);
    assert.match(r.caption, /\[2\]/, 'pidió la versión 2');
    let p = (await db.collection(posts.POSTS_COLLECTION).doc(id).get()).data();
    assert.deepEqual([p.regeneraciones, p.estado], [1, 'borrador']);
    assert.ok(p.hashtags.includes('hamburguesas'));
    await ia.regenerarCopy(db, { id, cliente }, 'admin', { nowMs: AHORA });
    assert.equal((await db.collection(posts.POSTS_COLLECTION).doc(id).get()).data().regeneraciones, 2);

    await db.collection(posts.POSTS_COLLECTION).doc(id).set({ estado: 'programada' }, { merge: true });
    await ia.regenerarCopy(db, { id, cliente }, 'admin', { nowMs: AHORA });
    assert.equal((await db.collection(posts.POSTS_COLLECTION).doc(id).get()).data().estado, 'borrador');

    await db.collection(posts.POSTS_COLLECTION).doc(id).set({ estado: 'publicada' }, { merge: true });
    await assert.rejects(ia.regenerarCopy(db, { id, cliente }, 'a', { nowMs: AHORA }), /ya salió/);
    const manual = (await posts.crearBorrador(db, { tipo: 'foto', caption: 'Manual', origen: 'manual' }, 'a', { nowMs: AHORA })).id;
    await assert.rejects(ia.regenerarCopy(db, { id: manual, cliente }, 'a', { nowMs: AHORA }), /no tiene producto/);
    await assert.rejects(ia.regenerarCopy(db, { id: 'noexiste', cliente }, 'a', { nowMs: AHORA }), /no existe/);
});

test('aprobar: exige imagen y una hora futura; con ambas queda programada a la hora propuesta; aprobarVarios informa uno por uno', async () => {
    const sinImagen = await borradorIA();
    await assert.rejects(ia.aprobarPost(db, { id: sinImagen }, 'a', { nowMs: AHORA }), /exactamente 1 imagen/);
    const listo = await borradorIA({ caption: 'Listo para aprobar: antojo de burger bien servida. Pídelo en roalburger.com' });
    await posts.guardarImagen(db, { id: listo, jpeg: await jpeg() }, 'a', { nowMs: AHORA });
    const r = await ia.aprobarPost(db, { id: listo }, 'admin', { nowMs: AHORA });
    assert.equal(r.programadaAtMs, AHORA + 3 * HOUR);
    const p = (await db.collection(posts.POSTS_COLLECTION).doc(listo).get()).data();
    assert.deepEqual([p.estado, p.programadaAtMs], ['programada', AHORA + 3 * HOUR]);

    const pasada = await borradorIA({ programadaAtMs: AHORA - HOUR });
    await posts.guardarImagen(db, { id: pasada, jpeg: await jpeg() }, 'a', { nowMs: AHORA });
    await assert.rejects(ia.aprobarPost(db, { id: pasada }, 'a', { nowMs: AHORA }), /ya pasó/);
    const sinHora = await borradorIA({ programadaAtMs: null });
    await assert.rejects(ia.aprobarPost(db, { id: sinHora }, 'a', { nowMs: AHORA }), /fecha y hora/);

    const otra = await borradorIA({ caption: 'Otra lista para aprobar: perro caliente crujiente. Pídelo en roalburger.com' });
    await posts.guardarImagen(db, { id: otra, jpeg: await jpeg() }, 'a', { nowMs: AHORA });
    const lote = await ia.aprobarVarios(db, { ids: [otra, sinImagen, pasada, 'noexiste'] }, 'admin', { nowMs: AHORA });
    assert.equal(lote.aprobadas, 1);
    assert.deepEqual(lote.resultados.map((x) => x.ok), [true, false, false, false]);
    assert.equal((await db.collection(posts.POSTS_COLLECTION).doc(otra).get()).data().estado, 'programada');
    assert.deepEqual((await ia.aprobarVarios(db, { ids: 'nada' }, 'a')).resultados, []);
});


// ── Texto de una publicación con instrucciones propias (escribirCopy) ───────────────────────────

function clienteLibre(respuestas) {
    const llamadas = [];
    return {
        llamadas,
        messages: {
            create: async (req) => {
                llamadas.push({ system: req.system, user: req.messages[req.messages.length - 1].content });
                const r = respuestas[Math.min(llamadas.length - 1, respuestas.length - 1)];
                return { content: [{ type: 'text', text: typeof r === 'string' ? r : JSON.stringify(r) }] };
            }
        }
    };
}
const COPY_OK = { caption: 'Este sábado te esperamos hasta las 12 de la noche, con la salsa de la casa. Pídelo en roalburger.com 🍔', hashtags: ['RoalBurger', 'Halloween', 'inventado', 'armenia'] };

test('escribirCopy: el prompt lleva marca, tono, llamado a la acción, instrucciones, producto y el tipo (reel)', async () => {
    const c = clienteLibre([COPY_OK]);
    const r = await ia.escribirCopy(db, { instrucciones: 'anuncia que el sábado abrimos hasta las 12 de la noche', tipo: 'reel', productoId: 'p1', cliente: c });
    assert.equal(r.ok, true);
    const { system, user } = c.llamadas[0];
    assert.match(system, /Roal Burger/);
    assert.match(system, /Tono: Cercano, alegre/);
    assert.match(system, /un reel \(video corto\)/);
    assert.match(system, /Pídelo en roalburger\.com/);
    assert.match(system, /NO escribas precios, descuentos/);
    assert.match(user, /Producto: Burger Plus \(BURGER PREMIUM\) — Carne, queso y salsa de la casa/);
    assert.match(user, /Instrucciones para esta publicación: anuncia que el sábado abrimos hasta las 12 de la noche/);
});

test('escribirCopy: hashtags solo del banco de la marca o los que la persona pidió; los inventados se descartan', async () => {
    const c = clienteLibre([COPY_OK]);
    const r = await ia.escribirCopy(db, { instrucciones: 'usa el hashtag #Halloween', tipo: 'foto', cliente: c });
    assert.ok(r.hashtags.includes('Halloween'), 'el pedido en las instrucciones vale');
    assert.ok(!r.hashtags.includes('inventado'));
    assert.ok(r.hashtags.includes('RoalBurger') || r.hashtags.includes('roalburger'));
    assert.ok(r.hashtags.length >= 4, 'se completa con los de la marca');
    const sin = await ia.escribirCopy(db, { instrucciones: 'algo divertido', tipo: 'foto', cliente: clienteLibre([COPY_OK]) });
    assert.ok(!sin.hashtags.includes('Halloween'), 'sin pedirlo no entra');
});

test('escribirCopy: precios y promos solo si las instrucciones los traen; si no, se rechazan y se reintenta', async () => {
    const conPrecio = { caption: 'Hoy la Burger Plus a $25.000, solo hoy. Pídela en roalburger.com 🍔', hashtags: ['roalburger'] };
    const c = clienteLibre([conPrecio, COPY_OK]);
    const r = await ia.escribirCopy(db, { instrucciones: 'cuenta algo antojador', tipo: 'foto', cliente: c });
    assert.equal(c.llamadas.length, 2);
    assert.match(c.llamadas[1].user, /mencionaba precios/);
    assert.doesNotMatch(r.caption, /\$/);
    const pedido = clienteLibre([conPrecio]);
    const ok = await ia.escribirCopy(db, { instrucciones: 'anuncia la Burger Plus a $25.000 solo hoy', tipo: 'foto', cliente: pedido });
    assert.match(ok.caption, /\$25\.000/);
    assert.match(pedido.llamadas[0].system, /SOLO tal como aparecen en las instrucciones/);
    assert.equal(pedido.llamadas.length, 1);
});

test('escribirCopy: si ya hay un texto, la IA lo recibe para mejorarlo; la versión sube la variación', async () => {
    const c = clienteLibre([COPY_OK]);
    await ia.escribirCopy(db, { instrucciones: 'hazlo más corto', caption: 'Texto viejo de la publicación', variacion: 2, tipo: 'carrusel', cliente: c });
    assert.match(c.llamadas[0].user, /Texto actual \(mejóralo o reescríbelo según las instrucciones\): Texto viejo de la publicación/);
    assert.match(c.llamadas[0].user, /versión 3/);
    assert.match(c.llamadas[0].system, /un carrusel/);
});

test('escribirCopy: pide algo de contexto, valida el producto, la IA debe estar configurada y falla con claridad', async () => {
    await assert.rejects(ia.escribirCopy(db, { cliente: clienteLibre([COPY_OK]) }), /de qué trata/);
    await assert.rejects(ia.escribirCopy(db, { instrucciones: 'x', productoId: 'no-existe', cliente: clienteLibre([COPY_OK]) }), /ya no existe/);
    await assert.rejects(ia.escribirCopy(db, { instrucciones: 'x' }), /no está configurada/);
    await assert.rejects(ia.escribirCopy(db, { instrucciones: 'algo', cliente: clienteLibre(['esto no es json']) }), /no pudo escribir el texto/);
});
