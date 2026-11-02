// Reglas de /pedidos: listar ya no es publico. Requiere el emulador:
//   firebase emulators:exec --only firestore "node --test tests/pedidos-rules.test.js"
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { initializeTestEnvironment, assertSucceeds, assertFails } = require('@firebase/rules-unit-testing');

test('pedidos: get publico, list solo admin/mesero/dueno', async () => {
    const env = await initializeTestEnvironment({
        projectId: 'demo-roal',
        firestore: { rules: fs.readFileSync(path.join(__dirname, '..', 'firestore.rules'), 'utf8') }
    });
    try {
        await env.withSecurityRulesDisabled(async (ctx) => {
            const db = ctx.firestore();
            await db.doc('admins/adm1').set({ ok: true });
            await db.doc('meseros/tok1').set({ nombre: 'm' });
            await db.doc('pedidos/p1').set({ customerPhoneDigits: '3001112222', total: 1 });
            await db.doc('pedidos/p2').set({ customerPhoneDigits: '3009998888', total: 1 });
        });
        const anon = env.unauthenticatedContext().firestore();
        await assertSucceeds(anon.doc('pedidos/p1').get());
        await assertFails(anon.collection('pedidos').get());
        await assertFails(anon.collection('pedidos').where('customerPhoneDigits', '==', '3001112222').get());

        const dueno = env.authenticatedContext('phone_3001112222').firestore();
        await assertSucceeds(dueno.collection('pedidos').where('customerPhoneDigits', '==', '3001112222').get());
        await assertFails(dueno.collection('pedidos').where('customerPhoneDigits', '==', '3009998888').get());
        await assertFails(dueno.collection('pedidos').get());

        const otro = env.authenticatedContext('phone_3005550000').firestore();
        await assertFails(otro.collection('pedidos').where('customerPhoneDigits', '==', '3001112222').get());

        const admin = env.authenticatedContext('adm1').firestore();
        await assertSucceeds(admin.collection('pedidos').get());

        const mesero = env.authenticatedContext('mesero_tok1', { mesero: true, meseroToken: 'tok1' }).firestore();
        await assertSucceeds(mesero.collection('pedidos').get());
        const falso = env.authenticatedContext('x', { mesero: true, meseroToken: 'borrado' }).firestore();
        await assertFails(falso.collection('pedidos').get());

        // configuracion interna y contador
        await env.withSecurityRulesDisabled(async (ctx) => {
            await ctx.firestore().doc('configuracion/costos_fijos').set({ a: 1 });
            await ctx.firestore().doc('configuracion/config_horario').set({ a: 1 });
        });
        await assertFails(anon.doc('configuracion/costos_fijos').get());
        await assertSucceeds(anon.doc('configuracion/config_horario').get());
        await assertSucceeds(admin.doc('configuracion/costos_fijos').get());
        await assertFails(anon.doc('pedidos/_meta_order_sequence').set({ metaType: 'order_sequence', current: 5 }));
        await assertSucceeds(admin.doc('pedidos/_meta_order_sequence').set({ metaType: 'order_sequence', current: 5 }));
        await assertSucceeds(mesero.doc('pedidos/_meta_order_sequence').set({ metaType: 'order_sequence', current: 6 }));
    } finally {
        await env.cleanup();
    }
});
