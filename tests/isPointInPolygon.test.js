function isPointInPolygon(point, polygon = []) {
    const [lat, lng] = point;
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const [yi, xi] = polygon[i];
        const [yj, xj] = polygon[j];
        const intersect = ((yi > lat) !== (yj > lat)) && (lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi);
        if (intersect) {
            inside = !inside;
        }
    }
    return inside;
}

function assert(condition, message) {
    if (!condition) {
        console.error('Assertion failed:', message);
        process.exit(1);
    }
}

// Simple square polygon
const square = [
    [0, 0],
    [0, 10],
    [10, 10],
    [10, 0]
];

assert(isPointInPolygon([5,5], square) === true, 'Point inside square should be true');
// Un vertice exacto es un caso degenerado para ray-casting: el resultado depende del orden de
// los vertices y no hay una respuesta "correcta" universal. Para ESTE poligono y ESTA
// implementacion el resultado deterministico es true (verificado con node -e); no es una
// inestabilidad de plataforma/Node — el mismo calculo de punto flotante da el mismo resultado
// siempre. Ver tests/agent-order-logic-parity.test.js para la comparacion contra la copia de
// functions/agent/orderLogic.js (misma logica, sin depender de un valor fijo).
assert(isPointInPolygon([0,0], square) === true, 'Point on this vertex is deterministically true for this implementation');
assert(isPointInPolygon([10,5], square) === false, 'Point on edge should be false by this implementation');
assert(isPointInPolygon([-1,5], square) === false, 'Point outside should be false');

// Concave polygon
const concave = [
    [0,0], [5,0], [5,5], [3,2], [0,5]
];
assert(isPointInPolygon([2,2], concave) === true, 'Point inside concave should be true');
assert(isPointInPolygon([4,1], concave) === true, 'Point inside concave arm should be true');
assert(isPointInPolygon([5.5,2], concave) === false, 'Point outside concave should be false');

console.log('All isPointInPolygon tests passed');
process.exit(0);
