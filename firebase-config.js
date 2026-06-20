window.FIREBASE_CONFIG = {
    apiKey: 'AIzaSyCinNZVhxL4ijOoZGsvoIvCgR7bHzsl668',
    authDomain: 'roal-burger-menu.firebaseapp.com',
    projectId: 'roal-burger-menu',
    storageBucket: 'roal-burger-menu.appspot.com',
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

    const db = firebase.firestore();

    // Persistencia offline: datos se sirven desde IndexedDB al instante en
    // visitas siguientes, sin esperar round-trip a Firebase.
    if (!window._firestorePersistenceEnabled) {
        window._firestorePersistenceEnabled = true;
        db.enablePersistence({ synchronizeTabs: true }).catch(() => {});
    }

    return {
        db,
        storage: firebase.storage(),
        auth: typeof firebase.auth === 'function' ? firebase.auth() : null,
        functions: typeof firebase.functions === 'function' ? firebase.functions() : null
    };
}
