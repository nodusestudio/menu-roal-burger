// FODI · pantalla de TV del local (/tv). Solo LECTURA: qué productos están en la rotación (con su etiqueta y lo que
// muestran), cuáles quedaron fuera y por qué, cuánto dura una vuelta y cuántas veces se abrió el Modo TV desde el admin.
// Mismas reglas que src/js/tv.js (construirLista): si cambian allá, cambiar aquí.

const FESTIVAL_HASTA = Date.parse('2026-11-08T23:59:59-05:00'); // igual que FESTIVAL_TRIFASICA_HASTA en script-v2.js
const ROTACION_S = 8;
const DIA_MS = 86400000;

const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
const lista = async (db, col) => (await db.collection(col).get()).docs.map((d) => ({ id: d.id, ...d.data() }));
const diaBogota = (ms) => new Date(ms).toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
const limpiarNombre = (n) => String(n || '').replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim();
const fmt = (n) => '$' + Number(n).toLocaleString('es-CO');

async function pantallaTv(db, ahora = Date.now()) {
    const [productos, categorias, promos, modoDoc] = await Promise.all([
        lista(db, 'productos'), lista(db, 'categorias'), lista(db, 'promos_2x1'),
        db.collection('configuracion').doc('tv_modo').get()
    ]);
    const festivalActivo = ahora <= FESTIVAL_HASTA;
    const categoriaInactiva = (cat) => {
        const k = norm(cat);
        const c = k ? categorias.find((x) => norm(x.name) === k) : null;
        return !!c && c.active === false;
    };

    const dentro = [], fuera = [];
    for (const p of productos) {
        const nombre = limpiarNombre(p.nombre) || String(p.id);
        const clave = norm(p.nombre);
        const img = String(p.image_url || '').trim();
        if (String(p.estado || 'active').toLowerCase() === 'paused') { fuera.push({ nombre, motivo: 'pausado en el menú' }); continue; }
        if (!img || /(^|\/)(logo|isotipo|fondo|portada)\.[a-z]+$/i.test(img)) { fuera.push({ nombre, motivo: 'sin foto del producto' }); continue; }
        if (categoriaInactiva(p.categoria)) { fuera.push({ nombre, motivo: 'su categoría está inactiva' }); continue; }
        if (!clave || clave === 'empanadas' || clave === 'empanada') { fuera.push({ nombre, motivo: 'oculto en el menú' }); continue; }

        const es2x1 = (p.promo2x1 && p.promo2x1.activo === true) || promos.some((q) => q.activo !== false && q.producto_id === p.id);
        const esFestival = festivalActivo && clave.includes('trifasica') && !clave.includes('mini');
        let etiqueta = '';
        if (esFestival) etiqueta = es2x1 ? 'Sabe a Quindío · 2×1' : 'Sabe a Quindío';
        else if (es2x1) etiqueta = 'Promo 2×1';
        else if (p.es_destacado === true) etiqueta = 'Los más pedidos';
        const precio = Number(p.precio) || 0;
        dentro.push({
            nombre, etiqueta: etiqueta || null, festival: esFestival,
            muestra: es2x1 ? '2×1' : (precio > 0 ? fmt(precio) : 'sin precio'),
            sin_ingredientes: !String(p.descripcion || '').trim()
        });
    }

    // Durante el festival su producto sale al inicio y otra vez a mitad de cada vuelta (ver tv.js).
    const festivales = dentro.filter((x) => x.festival).length;
    const turnos = dentro.length + festivales;
    const vuelta = turnos * ROTACION_S;

    const aperturas = (modoDoc.exists ? modoDoc.data().aperturas : null) || {};
    const suma = (desdeMs) => Object.entries(aperturas).reduce((s, [d, n]) => (Date.parse(d + 'T12:00:00-05:00') >= desdeMs ? s + (Number(n) || 0) : s), 0);
    const md = modoDoc.exists ? modoDoc.data() : {};
    const ultima = md.ultimaApertura && typeof md.ultimaApertura.toDate === 'function' ? md.ultimaApertura.toDate().toISOString() : null;

    return {
        enlace: 'https://roalburger.com/tv',
        segundos_por_producto: ROTACION_S,
        en_rotacion: dentro.length,
        duracion_de_una_vuelta_segundos: vuelta,
        duracion_de_una_vuelta_minutos: Math.round((vuelta / 60) * 10) / 10,
        festival_sabe_a_quindio: { activo: festivalActivo, hasta: '2026-11-08', sale_dos_veces_por_vuelta: festivales > 0 },
        productos: dentro.slice(0, 60).map(({ nombre, etiqueta, muestra }) => ({ nombre, etiqueta, muestra })),
        sin_ingredientes_en_pantalla: dentro.filter((x) => x.sin_ingredientes).map((x) => x.nombre).slice(0, 30),
        fuera_de_rotacion: fuera.slice(0, 40),
        modo_tv_abierto_desde_el_admin: {
            total: Number(md.total) || 0,
            hoy: Number(aperturas[diaBogota(ahora)]) || 0,
            ultimos_7_dias: suma(ahora - 7 * DIA_MS),
            ultima_vez: ultima
        },
        nota: 'Solo cuenta las veces que se pulsó "Modo TV" en el admin (la TV es una página pública y no reporta cuánto tiempo está encendida). El orden sigue el campo "order" de cada producto. Para abrirla, propón proponer_accion tipo "abrir_tv".'
    };
}

const TOOL = {
    name: 'pantalla_tv',
    description: 'PANTALLA DE TV del local (/tv): qué productos salen en la rotación (con su etiqueta y si muestran precio o 2×1), cuáles quedaron fuera y por qué (pausados, sin foto, categoría inactiva), cuáles no muestran ingredientes, cuánto dura una vuelta, y cuántas veces se abrió el Modo TV desde el admin. Úsala para "¿qué sale en la TV?", "¿por qué no sale X?", "¿está bien la pantalla?". Para abrirla propón proponer_accion tipo "abrir_tv".',
    input_schema: { type: 'object', properties: {} }
};

module.exports = { pantallaTv, TOOL };
