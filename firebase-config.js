const FIREBASE_CONFIG = {
    apiKey: 'AIzaSyCinNZVhxL4ijOoZGsvoIvCgR7bHzsl668',
    authDomain: 'roal-burger-menu.firebaseapp.com',
    projectId: 'roal-burger-menu',
    storageBucket: 'roal-burger-menu.firebasestorage.app',
    messagingSenderId: '659635134153',
    appId: '1:659635134153:web:b7056d7487c26127497718'
};

const FIREBASE_STORAGE_FOLDER = 'product-images';

function initFirebaseServices() {
    if (!window.firebase) {
        throw new Error('Falta cargar el SDK de Firebase.');
    }

    if (!FIREBASE_CONFIG.projectId || FIREBASE_CONFIG.projectId === 'TU_PROJECT_ID') {
        throw new Error('Configura FIREBASE_CONFIG en firebase-config.js');
    }

    if (!firebase.apps.length) {
        firebase.initializeApp(FIREBASE_CONFIG);
    }

    return {
        db: firebase.firestore(),
        storage: firebase.storage(),
        auth: typeof firebase.auth === 'function' ? firebase.auth() : null
    };
}
