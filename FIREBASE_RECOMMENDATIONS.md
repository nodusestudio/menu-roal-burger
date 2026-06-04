Recomendaciones de seguridad y configuración para Firestore / Storage

1) Reglas de Firestore (ejemplo mínimo):

service cloud.firestore {
  match /databases/{database}/documents {
    // Configuración pública de lectura para contenido de menú
    match /{document=**} {
      allow read: if request.auth == null && (resource.data.public == true || resource.id in ["config_landing"]);
      allow read: if request.auth != null; // usuarios autenticados pueden leer todo
      allow write: if request.auth != null && request.auth.token.email_verified == true && request.auth.token.admin == true;
    }
  }
}

Explicación: evita escrituras públicas y limita updates a cuentas autenticadas y marcadas como admin (claims).

2) Reglas de Storage (ejemplo):

service firebase.storage {
  match /b/{bucket}/o {
    match /product-images/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
  }
}

3) Recomendaciones operativas:
- Añadir custom claim `admin=true` para cuentas de administradores via Admin SDK (servidor).
- Reforzar validación de tamaños y tipos al subir imágenes (limitar a image/jpeg|png y 2-4 MB).
- Revisar reglas de CORS y origin en hosting si aplica.
- Migrar en el futuro a SDK modular (v9+) para mejorar tree-shaking y menor bundle.

4) Pasos rápidos para comprobar:
- En Firebase Console -> Firestore -> Rules, revisar y aplicar reglas de escritura segura.
- En Storage -> Rules, restringir write a admins.
- Probar con usuarios no autenticados para confirmar lectura pública limitada.

Si quiere, puedo generar versiones de reglas exactas para copiar/pegar en Firebase Console y un pequeño script Node.js para asignar `admin` claim a una cuenta.