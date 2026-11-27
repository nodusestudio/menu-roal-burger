# Análisis del sistema de Redes (FODEXA + conector de Claude) — 2026-11-27

Alcance: lectura del código (functions/*.js). NO se leyó la base de datos de producción (ver "Pendiente de verificar").

## 1. Cómo está armado hoy

Una sola base de datos de publicaciones (`instagram_posts`) con tres "puertas":

| Puerta | Qué puede hacer |
|---|---|
| Panel FODEXA → Redes | Todo (incluye borrar, quitar/ordenar imágenes, duplicar, publicar ahora) |
| Conector de Claude (`fodexaMcp.js`, 21 herramientas) | Crear/programar/editar/cancelar posts, carruseles, historias y reels; series, semana fija, cola |
| FODI (`fodiReels.js`, `redes_sociales`) | Reels (listar/estado/programar/editar/cancelar), series solo lectura, ranking de publicaciones |

Motor: cron `publicarPostsProgramados` cada 10 min (IG + FB) → `instagramPosts.publicarPost` (reserva con transacción, 3 reintentos, aviso push si falla). Métricas: cron cada 30 min (IG y FB); posts/reels se miden 14 días, historias 24 h.

Lo bueno (verificado): reserva anti-doble publicación, límite 95/24 h bajo el de Meta, validación de video antes de programar, avisos push de fallos y de token por vencer, series con semana fija que se re-calculan solas, tests (series, reels, mcp, facebook).

## 2. Hallazgos — lo que NO cumple lo que pides

### A. Claude no puede ver "cuál pegó" bien (el más importante)
1. Las métricas de **Facebook no llegan al conector**: `reelsApi.vista` solo lee `instagram_metricas`. FODI sí las tiene (`facebook_metricas`), Claude no.
2. No hay herramienta de **ranking/comparativo**. Claude tiene que listar reel por reel (máx. 50, sin filtro de fechas) y comparar a mano. FODI ya tiene `topPublicaciones` (cruzado con ventas) que el conector no usa.
3. No expone **seguidores por día** ni **métricas de historias** (navegación, salidas, toques); solo alcance/vistas/likes/comentarios/compartidos/guardados.
4. No hay métrica **por serie** (¿qué serie rinde más?) ni por **hora/día**, que es justo lo que sirve para "seguir trabajando lo que funciona".
5. Una publicación solo se mide 14 días y la serie guarda 60 puntos; después queda congelada. Para el análisis semanal alcanza, para tendencias de meses no (no hay histórico consolidado).

### B. Claude no tiene control total (lo que el panel sí hace y el conector no)
Existe en `instagramPosts.js` pero NO está en el conector:
- Quitar / reordenar / reemplazar imágenes de un carrusel ya creado (solo puede agregar).
- Reemplazar el video de un reel.
- Desprogramar (volver a borrador) una publicación suelta.
- Duplicar una publicación (reusar lo que pegó).
- "Publicar ahora".
- Borrar de verdad: `cancelar_*` deja el documento (y se acumula).
- Reintentar una publicación en error.
- Facebook: sin herramientas propias (solo la casilla `facebook` al crear).
- No ve ni controla lo automático: historias del Código del día, de apertura/cierre de caja y de días cerrados (viven en `codigo_dia_historias`/`historiaCierre`, no en `instagram_posts`), aunque SÍ gastan el cupo de 95/24 h. Claude no sabe qué más va a salir ese día.

### C. Desorden / duplicación (lo que describes como "cosas por un lado y por otro")
1. **Tres puertas con capacidades distintas** (tabla de arriba). FODI no maneja posts/carruseles/historias ni escribe series; el conector no tiene ranking ni Facebook.
2. **Dos caminos de subida de video**: troceado desde el panel (`reels.subirParte/finalizarVideo`) y PUT directo del conector (`prepararSubida` + `reelVideoSubido`). Ambos funcionan; es doble mantenimiento.
3. **Dos nombres para lo mismo**: herramientas `*_reel` y `*_publicacion` hacen casi lo mismo (el conector tiene 21 herramientas; ~8 se solapan). Consume contexto de Claude y confunde la elección.
4. **Código heredado**: `series.js` aún lee el doc `configuracion/cola_reels` (cola vieja) para migrar; `sembrarIniciales` corre en cada mantenimiento.
5. **Telegram, DMs/comentarios de IG y chats** son módulos aparte (`telegramCanal`, `instagramChats`, `instagramMensajes`) sin ninguna herramienta en el conector; los DMs siguen pendientes.
6. **Estado en varios sitios**: la verdad de una publicación está repartida en `instagram_posts` + `instagram_publicaciones` (bitácora) + `instagram_metricas` + `facebook_metricas` + `series`. Se reconcilian por convención, no por una vista única.

### D. Robustez / eficiencia
1. `mantenimiento` y `listar` leen **toda** la colección de reels en cada pasada (cada 10 min y cada consulta). Hoy es poco; crece linealmente y cuesta lecturas de Firestore.
2. `listar` además intenta ensamblar videos pendientes por cada reel listado (efecto secundario en una lectura).
3. Si Meta/FODEXA se cae más de 1 h, el reel pasa a error ("muy tarde") y hay que reprogramarlo a mano; no se reprograma solo al siguiente horario libre de su serie.
4. Publicación con hasta 10 min de retraso (cron cada 10). Aceptable; se puede bajar a 5.
5. Las historias automáticas y los reels compiten por el mismo cupo y por la misma ventana de cron sin una vista conjunta.
6. Hay avisos push de fallos, pero ningún **resumen semanal de redes** automático (FODI tiene informe semanal general; no específico de redes).

## 3. Plan propuesto (en este orden; cada fase se puede desplegar sola)

**Fase 1 — Que Claude vea todo (analítica)** · lo que más valor da
- Herramienta `rendimiento`: rango de fechas → ranking de publicaciones (IG+FB unidos) por alcance/interacción/guardados/compartidos, con tipo, serie, día y hora.
- Herramienta `resumen_series`: promedio por serie y por día/hora → "qué serie, día y hora funcionan".
- Herramienta `crecimiento`: seguidores IG/FB por día + historias (alcance, salidas).
- Reusar `topPublicaciones` de FODI; no escribir un segundo motor.
- Guardar un **histórico consolidado semanal** (colección `redes_resumen_semanal`) para que las métricas no se pierdan a los 14 días.

**Fase 2 — Que Claude controle todo (paridad con el panel)**
- Exponer: quitar/ordenar/reemplazar imagen, reemplazar video, desprogramar, duplicar, publicar ahora, reintentar, borrar definitivo.
- `ver_agenda`: todo lo que va a salir (reels, posts, historias automáticas, cierres) con el cupo restante de 24 h.
- Herramientas de Facebook (publicar/estado/métricas).

**Fase 3 — Ordenar y simplificar**
- Fusionar `*_reel` dentro de `*_publicacion` (misma firma con `tipo`), dejando alias por compatibilidad; bajar de 21 a ~14 herramientas.
- Una sola vía de subida de video (la PUT directa) y retirar el troceado si el panel puede usarla.
- Quitar el código de migración de la cola vieja una vez confirmado que ya no existe `cola_reels`.
- FODI y conector llamando al mismo módulo (ya comparten `reelsApi`/`series`); completar lo que falta a FODI.

**Fase 4 — Optimizar y blindar**
- Índices/consultas por `estado` y rango de fechas en lugar de leer toda la colección.
- Auto-reprogramación de un reel que cayó en "muy tarde" al siguiente horario de su serie.
- Cron de publicación a 5 min.
- Resumen semanal de redes (push + disponible para Claude) y alerta si una serie se queda sin videos en 3 días.
- Tests para lo nuevo; actualizar `instructions` del conector.

## 4. Pendiente de verificar (no se hizo en este análisis)
Lectura de producción (el clasificador la bloquea; la corre el dueño): cuántas publicaciones hay por estado, cuántas en `error`/`publicando` atascadas, borradores huérfanos, tamaño real de `instagram_posts`, y si `configuracion/cola_reels` ya no existe. Se puede dejar un script de solo lectura para ejecutar.

Notas de honestidad: los hallazgos A–D salen de leer el código, no de ejecutar el sistema; la utilidad real de cada métrica depende de que Meta devuelva datos (historias con menos de ~5 espectadores no devuelven nada).
