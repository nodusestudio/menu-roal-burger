// Siembra datos mínimos de prueba en el emulador de Firestore para poder probar el menú y el
// agente de IA localmente sin tocar la base de datos real de producción.
// Requiere el emulador de Firestore corriendo (firebase emulators:start) en el puerto 8080.
// Uso: node scripts/seed-emulator.js
'use strict';

const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');

const PROJECT_ID = 'roal-burger-menu';
const FIRESTORE_PORT = 8080;

async function main() {
    const testEnv = await initializeTestEnvironment({
        projectId: PROJECT_ID,
        firestore: { host: '127.0.0.1', port: FIRESTORE_PORT }
    });

    await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore();

        await db.collection('categorias').doc('burger-clasicas').set({
            name: 'BURGER CLASICAS',
            active: true,
            order: 1,
            bebidas_menu: false,
            acompanantes_menu: false,
            combos_menu: false
        });
        await db.collection('categorias').doc('salchipapas').set({
            name: 'SALCHIPAPAS',
            active: true,
            order: 2,
            bebidas_menu: false,
            acompanantes_menu: false,
            combos_menu: false
        });

        const productos = [
            { id: 'burger-clasica', nombre: 'Burger Clasica', precio: 15000, categoria: 'burger clasicas', estado: 'active' },
            { id: 'burger-doble', nombre: 'Burger Doble', precio: 20000, categoria: 'burger clasicas', estado: 'active' },
            { id: 'salchipapa', nombre: 'Salchipapa', precio: 12000, categoria: 'salchipapas', estado: 'active' }
        ];
        for (const p of productos) {
            const { id, ...data } = p;
            await db.collection('productos').doc(id).set(data);
        }

        // Horario abierto 24h para no bloquear las pruebas por el reloj real.
        await db.collection('configuracion').doc('config_horario').set({
            aperturaHora: 0, aperturaMinuto: 0, cierreHora: 23, cierreMinuto: 59
        });

        await db.collection('configuracion').doc('metodos_pago').set({
            methods: [
                { id: 'efectivo', label: 'Efectivo', enabled: true },
                { id: 'transferencia', label: 'Transferencia', enabled: true }
            ]
        });

        await db.collection('acompanantes').doc('huevos-codorniz').set({
            nombre: 'Huevos de codorniz', cantidad: 'x6', precio: 4000, activo_menu: true, estado: 'active', orden: 1
        });
        await db.collection('acompanantes').doc('extra-queso').set({
            nombre: 'Extra queso', cantidad: '', precio: 3000, activo_menu: true, estado: 'active', orden: 2
        });

        await db.collection('bebidas').doc('coca-cola').set({
            marca: 'Coca-Cola', estado: 'active', orden: 1,
            presentaciones: [
                { id: 'p1', nombre: '350ml', precio: 4000, sabores: [] },
                { id: 'p2', nombre: '1.5L', precio: 8000, sabores: [] }
            ]
        });
        await db.collection('bebidas').doc('jugo-hit').set({
            marca: 'Hit', estado: 'active', orden: 2,
            presentaciones: [
                { id: 'p1', nombre: '300ml', precio: 3500, sabores: ['Mango', 'Mora', 'Maracuyá'] }
            ]
        });

        await db.collection('combospacks').doc('combo-clasico').set({
            nombre: 'Combo Clásico', papas: 'Papas medianas', bebida_nombre: 'Gaseosa', bebida_sabores: ['Coca-Cola', 'Sprite'],
            valor: 8000, activo_menu: true, estado: 'active', orden: 1
        });

        await db.collection('combos_especiales').doc('combo-pareja').set({
            titulo: 'Combo Pareja', activo: true,
            productos: [{ id: 'burger-clasica', nombre: 'Burger Clasica', precio: 15000 }, { id: 'salchipapa', nombre: 'Salchipapa', precio: 12000 }],
            precio_original: 27000, precio_combo: 22000, descuento: 18,
            horario: { tipo: 'siempre' }
        });
    });

    await testEnv.cleanup();
    console.log(`✔ Datos de prueba sembrados en el emulador de Firestore (proyecto ${PROJECT_ID}): 3 productos, 2 acompañamientos, 2 bebidas, 1 combo pack, 1 combo especial, 2 categorías, horario 24h, 2 métodos de pago.`);
}

main().catch((err) => {
    console.error('Error sembrando datos de prueba:', err);
    process.exit(1);
});
