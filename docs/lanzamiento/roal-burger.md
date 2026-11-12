# Estado de lanzamiento — ROAL BURGER / FODEXA

Revisión: 2026-11-04 (primera corrida del skill `lanzamiento`). Leyenda: ✅ hecho · 🟡 parcial · ⬜ pendiente · ❓ no verificable desde aquí.

| Fase | Punto | Estado | Evidencia / nota |
|---|---|---|---|
| 1 Localhost | Producción en Vercel, HTTPS | ✅ | `roalburger.com` 200; HSTS 1 año; `/fodexa`, `/cupon`, `/avisos`, `/tv` responden 200 |
| 1 | Rama sincronizada | ✅ | 0 commits sin subir; solo archivos modificados por `npm run dev` |
| 2 Identidad | Dominio propio, www → apex | ✅ | `www` redirige a `roalburger.com`; canonical apex |
| 2 | Imagen al compartir | ✅ | `og-compartir.jpg` 200 (146 KB, vía `/api/og`) |
| 2 | Favicon, manifest, lang=es | ✅ | presentes en `index.html` |
| 3 Descubrimiento | sitemap + robots | ✅ | 3 URLs (`/`, política de datos, términos); sin desplegar |
| 3 | Datos estructurados (JSON-LD Restaurant) | ✅ | Agregado 2026-11-04 en `index.html` (sin horario: los días son configurables); sin desplegar |
| 3 | Analítica | ✅ | GA (gtag) + tracking propio de visitas por origen |
| 3 | Microsoft Clarity | 🟡 | `tracking.js` lo usa, pero no se detectó el script en el HTML público |
| 3 | Google Business / mapas | ❓ | No verificable desde el código |
| 4 Redes | Historias IG automáticas | 🟡 | Desplegado; depende de que la app de Meta y el token estén conectados |
| 4 | WhatsApp Cloud API | ⬜ | Pendiente consciente (hoy UltraMsg) |
| 4 | Mensajes/DMs de Instagram | ⬜ | Pendiente consciente (analizar semana del 2026-10-19) |
| 4 | Píxel de Meta (Facebook) | ⬜ | No se detectó `fbq`; falta el ID del píxel (lo da el usuario desde Meta) y ampliar el CSP de vercel.json (connect.facebook.net) |
| 5 Embudo | Registro, puntos, código del día, cupones | ✅ | En producción |
| 5 | Medición del embudo completo | 🟡 | Visitas por origen existen; falta vista única visita → pedido → recompra |
| 6 Operación | Reglas Firestore/Storage desplegadas | ✅ | Blindaje del 2026-11-02 |
| 6 | Cabeceras de seguridad (CSP, nosniff, frame) | ✅ | Presentes |
| 6 | Alertas (push celular, vigilancia del banco) | 🟡 | Desplegado; falta probar en el celular y con pago real |
| 6 | Tests | ✅ | Suite en `tests/` (no se corrió en esta revisión) |
| 7 Pendientes | App Google Play del admin | ⬜ | Pendiente consciente |
| 7 | Probar QR con valor / pago real pequeño | ⬜ | Pendiente |
| 7 | Rotar serviceAccountKey + reset-movimientos.js | 🟡 | 2026-11-12: `reset-movimientos.js` ya no usa archivo de llave y por defecto solo cuenta (borrar exige `--ejecutar` + escribir «BORRAR TODO»). Falta (lo hace el dueño): borrar las 2 llaves USER_MANAGED de `firebase-adminsdk-fbsvc` (`8debef80…`, `9f46224e…`) en Google Cloud y el archivo local `functions/serviceAccountKey.json`. Nada del repo ni de Vercel las usa. |

## Recomendación

Lo más valioso y barato: **JSON-LD de Restaurant + ampliar el sitemap + píxel de Meta** (una sola tanda de cambios en `index.html`). Luego cerrar WhatsApp Cloud API, que es lo que más impacta las ventas.
