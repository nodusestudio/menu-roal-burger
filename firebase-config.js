window.FIREBASE_CONFIG = {
    apiKey: 'AIzaSyCinNZVhxL4ijOoZGsvoIvCgR7bHzsl668',
    authDomain: 'roal-burger-menu.firebaseapp.com',
    projectId: 'roal-burger-menu',
    storageBucket: 'roal-burger-menu.firebasestorage.app',
    messagingSenderId: '659635134153',
    appId: '1:659635134153:web:b7056d7487c26127497718'
};

window.FIREBASE_STORAGE_FOLDER = 'product-images';
window.ROAL_ADMIN_RUNTIME_CONFIG = window.ROAL_ADMIN_RUNTIME_CONFIG || {
    publicAppUrl: '/'
};

function initFirebaseServices() {
    if (!window.firebase) {
        throw new Error('Falta cargar el SDK de Firebase.');
    }

    if (!window.FIREBASE_CONFIG.projectId || window.FIREBASE_CONFIG.projectId === 'TU_PROJECT_ID') {
        throw new Error('Configura FIREBASE_CONFIG en firebase-config.js');
    }

    if (!firebase.apps.length) {
        firebase.initializeApp(window.FIREBASE_CONFIG);
    }

    // Emuladores locales (solo cuando el sitio se sirve desde localhost/127.0.0.1, ej. con
    // `firebase emulators:start`) — nunca se activa en producción (roalburger.com / Vercel).
    const isLocalHost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
    if (isLocalHost && !window._firebaseEmulatorsConnected) {
        window._firebaseEmulatorsConnected = true;
        try { firebase.firestore().useEmulator('localhost', 8080); } catch (_e) {}
        try { if (typeof firebase.functions === 'function') firebase.functions().useEmulator('localhost', 5001); } catch (_e) {}
    }

    const db = firebase.firestore();

    // Persistencia offline solo en el menu publico (no en admin).
    // En admin siempre se necesitan datos frescos y la persistencia
    // puede generar conflictos de lock entre pestañas.
    const isAdmin = window.location.pathname.toLowerCase().includes('admin');
    if (!isAdmin && !window._firestorePersistenceEnabled) {
        window._firestorePersistenceEnabled = true;
        db.enablePersistence().catch(() => {});
    }

    return {
        db,
        storage: typeof firebase.storage === 'function' ? firebase.storage() : null,
        auth: typeof firebase.auth === 'function' ? firebase.auth() : null,
        functions: typeof firebase.functions === 'function' ? firebase.functions() : null
    };
}
