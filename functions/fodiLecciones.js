// FODI · LECCIONES: lo que aprendió al programar y al ser corregido (cómo es este código, qué rechazó el dueño,
// qué preferencias tiene, qué errores no repetir). Se inyectan al prompt en cada consulta, así FODI mejora con el uso.
// Colección privada `fodi_lecciones` (solo el servidor; las reglas de Firestore no la exponen al cliente).
//   node --test --test-concurrency=1 tests/fodi-lecciones.test.js

const COL = 'fodi_lecciones';
const MAX_LECCIONES = 150;
const MAX_TEXTO = 320;
const TIPOS = ['codigo', 'correccion', 'preferencia', 'error'];

const slug = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 50);
const hoy = () => new Date(Date.now() - 5 * 3600e3).toISOString().slice(0, 10);

async function registrarLeccion(db, args = {}) {
    const id = slug(args.tema);
    const leccion = String(args.leccion || '').trim().slice(0, MAX_TEXTO);
    if (!id) return { error: 'Falta el tema de la lección (corto).' };
    if (leccion.length < 10) return { error: 'La lección debe explicar algo concreto (mín. 10 caracteres).' };
    if (/pin|clave|contrase|token|secret/i.test(`${args.tema} ${leccion}`)) return { error: 'No guardes claves, PIN ni tokens como lección.' };
    const tipo = TIPOS.includes(args.tipo) ? args.tipo : 'codigo';
    const ref = db.collection(COL).doc(id);
    const previo = await ref.get();
    if (!previo.exists) {
        const todas = await db.collection(COL).get();
        if (todas.size >= MAX_LECCIONES) {
            const vieja = todas.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => String(a.actualizado).localeCompare(String(b.actualizado)))[0];
            if (vieja) await db.collection(COL).doc(vieja.id).delete();
        }
    }
    await ref.set({ tema: String(args.tema).slice(0, 60), leccion, tipo, actualizado: hoy(), veces: ((previo.data() || {}).veces || 0) + 1 });
    return { ok: true, guardada: id, reemplaza_anterior: previo.exists };
}

async function olvidarLeccion(db, args = {}) {
    const id = slug(args.tema);
    if (!id) return { error: 'Falta el tema.' };
    const ref = db.collection(COL).doc(id);
    if (!(await ref.get()).exists) return { error: `No hay una lección "${args.tema}".` };
    await ref.delete();
    return { ok: true, olvidada: id };
}

async function listarLecciones(db) {
    const sn = await db.collection(COL).get();
    return sn.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => String(b.actualizado).localeCompare(String(a.actualizado)) || (b.veces || 0) - (a.veces || 0));
}

// Texto que se agrega al prompt (acotado para no gastar de más).
async function bloqueLecciones(db, { max = 30, maxChars = 4200 } = {}) {
    const todas = await listarLecciones(db).catch(() => []);
    if (!todas.length) return '';
    let out = 'LECCIONES APRENDIDAS (de tus cambios de código y de las correcciones del dueño; aplícalas y no repitas esos errores):\n';
    for (const l of todas.slice(0, max)) {
        const linea = `- [${l.tipo}] ${l.tema}: ${l.leccion}\n`;
        if (out.length + linea.length > maxChars) break;
        out += linea;
    }
    return out;
}

async function lecciones(db, args = {}) {
    if (args.accion === 'registrar') return registrarLeccion(db, args);
    if (args.accion === 'olvidar') return olvidarLeccion(db, args);
    if (args.accion === 'listar') return { lecciones: (await listarLecciones(db)).map((l) => ({ tipo: l.tipo, tema: l.tema, leccion: l.leccion, fecha: l.actualizado })) };
    return { error: 'accion debe ser registrar, olvidar o listar.' };
}

const TOOL = {
    name: 'lecciones',
    description: 'APRENDE: guarda una LECCIÓN duradera para no repetir errores y mejorar con el uso. Regístrala (accion "registrar") cuando: el dueño te corrija o rechace algo ("no, así no"); veas con codigo_fuente mis_cambios/ver_cambio que un PR fue rechazado o comentado; descubras algo del código que costó encontrar (dónde vive una función, cómo se llaman las cosas, convenciones); o aprendas una preferencia de cómo quiere las cosas. tipo: codigo | correccion | preferencia | error. tema = etiqueta corta; leccion = una regla concreta y accionable (máx. 320 caracteres), no un resumen de la conversación. Mismo tema = se actualiza. "olvidar" borra una lección que quedó falsa; "listar" las muestra. Nunca guardes claves, PIN ni tokens.',
    input_schema: { type: 'object', properties: {
        accion: { type: 'string', enum: ['registrar', 'olvidar', 'listar'] },
        tipo: { type: 'string', enum: TIPOS },
        tema: { type: 'string', description: 'Etiqueta corta, ej. "botones del panel" o "tarifa de domicilio".' },
        leccion: { type: 'string', description: 'La regla concreta aprendida.' }
    }, required: ['accion'] }
};

module.exports = { lecciones, registrarLeccion, olvidarLeccion, listarLecciones, bloqueLecciones, TOOL, TIPOS };
