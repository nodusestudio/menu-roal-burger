// Extrae constantes puras de src/js/script-v2.js (zonas de domicilio, tarifa plana, centro)
// hacia functions/agent/geofence-data.json, para que el agente de IA (Cloud Functions) use
// exactamente los mismos polígonos que el checkout del cliente sin tener que copiarlos a mano.
// Se ejecuta como parte de `npm run build` / `npm run dev` — si cambian las zonas en
// script-v2.js, este archivo se regenera automáticamente en el siguiente build.
'use strict';

const fs = require('fs');
const path = require('path');

const SOURCE_FILE = path.join(__dirname, '..', 'src', 'js', 'script-v2.js');
const OUTPUT_FILE = path.join(__dirname, '..', 'functions', 'agent', 'geofence-data.json');
const ADMIN_FILE = path.join(__dirname, '..', 'src', 'js', 'admin.js');

function extractLiteral(source, constName) {
    const marker = `const ${constName} = `;
    const start = source.indexOf(marker);
    if (start === -1) {
        throw new Error(`No se encontró "${marker}" en ${SOURCE_FILE}`);
    }
    const valueStart = start + marker.length;
    const semicolonIndex = findStatementEnd(source, valueStart);
    const literalText = source.slice(valueStart, semicolonIndex);
    // El literal es JS estático de solo datos (arrays/objetos/números) — eval en función
    // aislada, nunca datos externos ni de usuario.
    // eslint-disable-next-line no-new-func
    return new Function(`return (${literalText});`)();
}

function findStatementEnd(source, fromIndex) {
    let depth = 0;
    for (let i = fromIndex; i < source.length; i++) {
        const ch = source[i];
        if (ch === '[' || ch === '{' || ch === '(') depth++;
        else if (ch === ']' || ch === '}' || ch === ')') depth--;
        else if (ch === ';' && depth === 0) return i;
    }
    throw new Error('No se encontró el fin del literal (";" a nivel 0).');
}

// Reemplaza el literal de un const existente en `source` por `newValueJs` (texto JS ya
// serializado), preservando todo lo demás del archivo tal cual.
function replaceLiteral(source, constName, newValueJs) {
    const marker = `const ${constName} = `;
    const start = source.indexOf(marker);
    if (start === -1) {
        throw new Error(`No se encontró "${marker}" en el archivo a actualizar.`);
    }
    const valueStart = start + marker.length;
    const semicolonIndex = findStatementEnd(source, valueStart);
    return source.slice(0, valueStart) + newValueJs + source.slice(semicolonIndex);
}

function main() {
    const source = fs.readFileSync(SOURCE_FILE, 'utf8');

    const data = {
        DELIVERY_CENTER_COORDINATES: extractLiteral(source, 'DELIVERY_CENTER_COORDINATES'),
        DELIVERY_GEOFENCE_ZONES: extractLiteral(source, 'DELIVERY_GEOFENCE_ZONES'),
        DELIVERY_FEE_AMOUNT: extractLiteral(source, 'DELIVERY_FEE_AMOUNT')
    };

    if (!Array.isArray(data.DELIVERY_GEOFENCE_ZONES) || !data.DELIVERY_GEOFENCE_ZONES.length) {
        throw new Error('DELIVERY_GEOFENCE_ZONES extraído está vacío o no es un array — revisar el parseo.');
    }

    fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2) + '\n', 'utf8');
    console.log(`Zonas de domicilio extraídas: ${data.DELIVERY_GEOFENCE_ZONES.length} zonas -> ${path.relative(process.cwd(), OUTPUT_FILE)}`);

    // src/js/admin.js tenía su propia copia a mano de estas mismas zonas (ADMIN_DELIVERY_ZONES,
    // sin el campo "color" que solo usa el mapa Leaflet del cliente) -- dos archivos con los
    // mismos polígonos escritos por separado, sin ninguna fuente única de verdad: un cambio de
    // tarifa hecho en uno no llegaba al otro. Ahora se deriva del mismo DELIVERY_GEOFENCE_ZONES
    // en cada build, igual que ya se hacía para el agente.
    const adminZones = data.DELIVERY_GEOFENCE_ZONES.map(({ name, fee, label, polygon }) => ({ name, fee, label, polygon }));
    const adminSource = fs.readFileSync(ADMIN_FILE, 'utf8');
    const adminSourceUpdated = replaceLiteral(adminSource, 'ADMIN_DELIVERY_ZONES', JSON.stringify(adminZones));
    if (adminSourceUpdated !== adminSource) {
        fs.writeFileSync(ADMIN_FILE, adminSourceUpdated, 'utf8');
        console.log(`admin.js: ADMIN_DELIVERY_ZONES sincronizado (${adminZones.length} zonas).`);
    }
}

main();
