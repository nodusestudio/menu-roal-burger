# Auditoría de coherencia — ROAL BURGER / FODEXA (2026-11-10)

Alcance: revisión de solo lectura. No se cambió código. El código fuente real está en `src/js/*` y `functions/*`;
los `admin.js`, `script-v2.js` y `style.css` de la raíz son salida del build.

Tamaño auditado: `src/js/admin.js` 40.183 líneas, `src/js/script-v2.js` 14.291, `admin.html` 17.591,
`functions/index.js` 4.145, más pricing, agente y módulos FODI.

**Límite honesto:** con ~110.000 líneas no se leyó cada una. Se midió con búsquedas sobre toda la base y se leyeron
a fondo los caminos del dinero. Cada hallazgo dice si está **verificado** o **por confirmar**.

---

## 1. Lo que está bien (conservar)

- El **servidor es la autoridad del precio** (`functions/pricing.js`): recalcula piso de línea, domicilio por GPS,
  barrio especial, empaque 2×1 y canje de puntos. El cliente no puede bajar el total.
- Las **zonas de domicilio tienen una sola fuente** (`script-v2.js`) y se regeneran hacia agente y admin en el build
  (`scripts/extract-agent-constants.js`). Ese es el patrón correcto y hay que repetirlo.
- `getOrderDisplayTotal` y `computeDomicilioGastoVirtual` ya viven en un módulo probado (`src/js/caja/calculos.js`).
- Avisos: `showNotice` (636 usos) y **cero** `alert()`. Consistente.
- Hay tests de paridad (`agent-order-logic-parity`, `barrio-especial-fee`, `conciliacion-banco`).

---

## 2. Cálculos duplicados u ocultos (lo que más te importa)

### 2.1 Constantes de dinero copiadas a mano — VERIFICADO
| Constante | Dónde vive hoy |
|---|---|
| Empaque 2×1 `$2.000` | `script-v2.js:27`, `admin.js:172`, `functions/pricing.js:201` |
| Extra de combo `$7.000` | `script-v2.js:4479`, `functions/pricing.js:200` |
| Valor del punto (10 COP = 100 pts → $1.000) | `script-v2.js:1240`, `functions/pricing.js:23` |
| Tarifa de domicilio base | `script-v2.js:26` → JSON generado (bien) |

Hay **47 marcadores `SYNC`** en el código: cada uno es una copia consciente que depende de que alguien se acuerde.
Peor: los comentarios de `pricing.js` apuntan a líneas de `script-v2.js` que **ya no son esas**
(dice `script-v2.js:17`, hoy es la 27; dice `:3638`, hoy es la 4479; otros dicen `:8091`, `:6800`, `:4222`).
Quien siga esa pista llega a código equivocado.

**Arreglo:** extender el mecanismo que ya existe para las zonas: un `constantes-negocio.json` generado en el build
que lean cliente, POS, servidor y agente. Una constante, un lugar.

### 2.2 La fórmula del total está en 4 sitios — VERIFICADO (hoy coinciden)
`subtotal + domicilio + empaque − puntos` se escribe en:
1. `script-v2.js:1231` (checkout web)
2. `admin.js:604` (`PosCart.getTotals`, POS)
3. `functions/pricing.js` (`computeServerPricedOrder`, autoridad)
4. `functions/agent/orderLogic.js:537` (agente WhatsApp; deja el empaque en 0 a propósito)

Hoy dan igual, pero no hay una prueba que los obligue a seguir igual salvo la del agente.
**Arreglo:** una función pura `calcularTotalPedido()` con prueba de paridad que cubra los cuatro.

### 2.3 Dos criterios de "pedido pagado" — VERIFICADO
- `isOrderPaid` (20 usos) **cuenta** los pedidos "por cobrar" como pagados.
- `isOrderPaidReal` (`admin.js:19212`) los excluye, pero solo se usa **4 veces** (impresión del ticket).
- La exclusión se escribe a mano como `!isOrderPaid(o) || esPorCobrar(o)` en `admin.js:15872`, `29087`, `29941`
  (y una variante con `'cobrada'` en `13501`). Es exactamente `!isOrderPaidReal(o)`, pero copiado.
- Sitios que usan `isOrderPaid` **sin** excluirlo, a revisar uno por uno (**por confirmar** cuáles están mal):
  `29766` (qué pedidos archiva el cierre), `31949` (pestaña Tickets), `25786`, `15193`, `15435`, `15454`, `15468`.

Riesgo real: un pedido por cobrar entrando a una suma de caja donde no debería ("sumar de más").

### 2.4 Cuatro formas de leer "cuánto vale un pedido" — VERIFICADO
- `getOrderDisplayTotal(o)` — 40 usos (la correcta: respeta `$0` real).
- `Number(o.total || 0)` — ~16 usos (`13700`, `13782`, `13784`, `13919`, `11522`…).
- `Number(x.total) || Number(x.subtotal)` — `19157` (si el total es 0 cae al subtotal: otro resultado).
- `reduce` sobre `item.subtotal` en `605`, `5323`.

### 2.5 Métricas no usa el mismo filtro que Caja — VERIFICADO
- Métricas > POS (`admin.js:13775`) filtra "medio de pago ≠ pendiente", **sin** excluir por cobrar.
- `_periodStats` (`11514`) suma `o.total` de **todos** los pedidos del periodo, sin filtrar anulados ni cobrados.
- Caja Diaria / Cierres usan `isOrderPaid` + `voided`.
Resultado: los KPIs de Métricas pueden no cuadrar con Caja y con el Cierre, aunque ninguno esté "mal" por sí solo.

### 2.6 `anulado` y `voided` son dos banderas para lo mismo — VERIFICADO
25 lecturas de `.anulado`, 40 de `.voided`, y solo 19 líneas miran las dos juntas. Un pedido marcado con una sola
puede contarse en unos reportes y en otros no.
**Arreglo:** un `isOrderVoided(o)` único; y escribir siempre ambas banderas al anular.

### 2.7 Día "de hoy" del cierre en UTC — POR CONFIRMAR
`admin.js:~29765`: `new Date(ms).toISOString().split('T')[0]` es fecha UTC. Colombia es UTC−5: desde las 7 pm la
fecha UTC ya es la de mañana. Solo afecta cuando no hay `_aperturaAnterior`. Coincide con tu nota previa de que
las fechas de cierres corren un día.

### 2.8 Programa de puntos — POR CONFIRMAR con el dueño
`script-v2.js:1245` tiene `LOYALTY_UI_VISIBLE = false` (puntos ocultos para el cliente, siguen acumulando), pero la
memoria del proyecto dice "visible/canjeable en checkout". Confirmar cuál es la intención actual.

### 2.9 Piso de precio sin verificar — DECISIÓN CONSCIENTE, solo documentar
Si una línea no se puede verificar contra catálogo (`floor === null`), el servidor confía en el precio del cliente
y solo lo deja en el log. Está documentado en el código; conviene una alerta cuando pase.

---

## 3. Formato de dinero y números — VERIFICADO
- `formatMoney` (admin, **301 usos**) → `$ 1.000` (con espacio).
- `formatCurrency` (menú público) → `$ 1.000`.
- `formatCurrencyCOP` (agente/WhatsApp) → `$1.000` (sin espacio).
- **67** `toLocaleString('es-CO')` sueltos en admin, con el `$` pegado cada vez de forma distinta.
- 10 `toLocaleString()` **sin idioma** (`admin.js:33611-33909`, importador): en un navegador con otro idioma saldrían
  con otro separador de miles. Bajo riesgo, pero es la misma regla rota.

**Arreglo:** un solo formateador (`formatCOP`) compartido; reemplazar los sueltos por pestaña.

---

## 4. Botones — VERIFICADO
- 326 botones en `admin.html` + 449 en plantillas de `admin.js`; **24 y 79 con `style=` inline**.
- ~158 clases de botón distintas en uso (98 definidas en CSS). Familias paralelas:
  `section-action-btn`, `admin-button`, `informes-action-btn`, `preview-refresh-btn`, `icm-btn`, `pm-icon-btn`,
  `pos-cart-action-btn`, `tpv-action-btn`, `caja-chica-btn`…
- Solo `informes-action-btn` (`--danger`, `--accent`) e `icm-btn` (`--primary`) tienen variantes de rol.
  No existe una regla única "primario / secundario / peligro / fantasma".

**Arreglo propuesto:** 4 roles × 3 tamaños (`.btn--primary|secondary|danger|ghost`, `--sm|--md|--lg`) y migrar
**una pestaña por vez** (empezando por Informes, que ya es la más cercana).

## 5. Modales y confirmaciones — VERIFICADO
- Al menos **6 estructuras de modal** distintas: `product-edit-modal`, `modal-feedback`, `pts-modal`,
  `pos-upgrade-overlay`, `cc-modal-*`, `category-products-modal-*`. (Ya figura "unificar modales POS" como pendiente.)
- Confirmaciones: `showConfirmModal` (52 usos) **vs** `confirm()` nativo en `admin.js:35070`, `38768`, `39455`,
  `39494`, `39647`, `39656`, `39703` y `prompt()` en `34347`. Todas en las pestañas más nuevas (Fuera del Menú,
  FODI, Pagos Bancolombia).

## 6. Fechas, filtros y buscadores — PARCIAL
- Helpers estándar existen: `rangoMs` (10 usos), `applyInnerTabs` (8), `smartMatch` (14).
- Hay **27** `<input type="date">` (16 en HTML + 11 en plantillas JS) y 18 grupos de `date-preset-btn`.
  **Por confirmar:** cuáles de esos 27 no pasan por `rangoMs` (incumplen la regla del selector estándar).

## 7. Organización del panel — VERIFICADO / criterio
- Menú lateral con **15 entradas**. El dinero está repartido en 5 lugares:
  Informes (caja, historial, tickets, libro contable, gastos), Métricas, Finanzas, Pagos Bancolombia, Costos y recetas.
- Etiquetas sin tilde junto a otras con tilde: "Articulos", "Metricas", "Configuracion", "Cerrar sesion",
  "Ir a Publico" vs "Fuera del Menú".
- Agrupación sugerida (como lo hacen los POS maduros): **Operación** (POS) · **Dinero** (Informes, Finanzas,
  Pagos Bancolombia) · **Catálogo** (Artículos, Costos y recetas) · **Clientes** (Clientes, Feedback, Fuera del Menú) ·
  **Comunicación** (Mensajes, Chat Roal, Redes) · **FODI** (Asistente) · **Configuración**.
- `admin.js` es un único archivo de 40k líneas; solo `caja/calculos.js` se ha extraído. Cada cálculo nuevo que se
  queda ahí aumenta las copias de la sección 2.
- Higiene de raíz (por revisar): `Claude Setup.exe`, `firestore-debug.log`, `_qa-shots/`.

---

## 8. Orden recomendado

| # | Trabajo | Riesgo si no se hace | Esfuerzo |
|---|---|---|---|
| 1 | `isOrderPaidReal` + `isOrderVoided` únicos; revisar los 7 sitios de 2.3 y unificar métricas (2.4–2.6) | Cifras que no cuadran entre pantallas | Medio |
| 2 | Constantes de negocio generadas en el build (2.1) y corregir referencias de línea viejas | Cambiar un precio en un lado y no en otro | Bajo |
| 3 | `calcularTotalPedido()` único + prueba de paridad (2.2) | Total distinto entre POS, web y agente | Medio |
| 4 | `formatCOP` único (3) | Inconsistencia visual | Bajo |
| 5 | Sistema de botones por roles, pestaña por pestaña (4) | Cada pestaña se ve distinta | Alto, incremental |
| 6 | Un solo modal y `showConfirmModal` en las 8 llamadas nativas (5) | UX irregular | Medio |
| 7 | Reagrupar el menú lateral y corregir tildes (7) | Difícil de encontrar cosas | Bajo |

Cada paso se puede entregar y probar solo; los pasos 1–3 son los que atacan "que no sume de más ni de menos".

---
---

# PARTE 2 — Diseño, orden y facilidad de uso (ronda del mismo día)

Decisiones del dueño en esta ronda:
- **Puntos de lealtad:** ocultos a propósito (`LOYALTY_UI_VISIBLE = false`); no se están usando ni terminados. Se deja así.
- **Cierre en UTC:** se revisó (sección 9). Hay que corregirlo, pero el alcance real es más acotado de lo que parecía.
- **Antes de tocar código:** revisar orden, redundancias y experiencia de uso (esta parte).

**Límite honesto:** el panel exige iniciar sesión, así que esta parte sale de leer la estructura (`admin.html` y los
manejadores de `admin.js`), no de verlo en pantalla. Colores, espacios, lectura en celular y tamaño de los toques
**no están evaluados**; eso requiere una pasada con capturas pantalla por pantalla.

## 9. El cierre en UTC — resultado de la revisión

12 sitios toman "hoy" con `toISOString().split('T')[0]` (fecha UTC; Colombia es UTC−5, así que desde las 7 pm ya es "mañana"):

| Sitio | Qué es | ¿Se nota? |
|---|---|---|
| `admin.js:27350` | contar cobros desde la apertura | Solo si la caja **no** está abierta |
| `admin.js:28173` | gastos de la jornada | Solo si la caja **no** está abierta |
| `admin.js:29764` | pedidos a archivar al cerrar | Solo si no hay apertura registrada |
| `admin.js:29937` | preparar el cierre | Solo si la caja **no** está abierta |
| `admin.js:11552-11592` | **Métricas: "hoy", últimos 7/14/30 días** | **Sí, todas las noches** (probable; falta ver cómo agrupa cada pedido) |
| `admin.js:20237`, `32168` | otras fechas "de hoy" | Por revisar |

- Con la caja abierta (lo normal) el cierre usa la hora exacta de apertura, no la fecha UTC → **no se afecta**.
- Lo que sí se nota: las gráficas de Métricas. Después de las 7 pm el "hoy" salta al día siguiente y las ventas de la noche
  (la franja fuerte del negocio) se cuentan en otro día. Esto explica por qué "los días se corren".
- Ya existe la forma correcta en el propio código (`admin.js:34001`, `34239`: restan 5 h antes de tomar la fecha).
- **Arreglo:** una sola función `diaColombia(ms)` y reemplazar los 12 sitios. Cambio pequeño, con prueba.

## 10. Redundancias reales (verificadas en el código)

### 10.1 Gastos: un mismo botón, tres sitios, dos significados
- El botón **"💸 Gastos"** aparece en *Caja Diaria* (`#gastosBtn`) y en *Historial de Cajas* (`#gastosHistorialBtn`), y en
  *Informes > Gastos* hay un tercero "+ Nuevo gasto". Los tres abren **el mismo modal** (`openGastoModal`).
- Pero los dos últimos activan una bandera oculta (`_gastoFromHistorial`) y el gasto se guarda como **"externo"**
  (no ligado a la caja abierta), mientras que el de Caja Diaria es **gasto de la jornada**. Al usuario no se le dice
  nada: mismo rótulo, mismo formulario, resultado contable distinto. Esto es justo el tipo de cosa que hace que
  los saldos cambien "solos".
- Los gastos se **ven** en cinco lugares: Caja Diaria, columna del Historial, Libro Contable, Informes > Gastos y
  (como costos fijos) en Finanzas. Las **Categorías de Gastos** están lejos, en Configuración.
- Hay cuatro clases internas (jornada, externo, traslado, ajuste) más el "gasto virtual" de domicilios. El usuario solo
  ve "Gastos", "Traslado" y "Ajustar saldos", sin explicación de cuándo usar cada uno.

### 10.2 "Cajas": seis cosas con "caja" o con la misma plata
- **Caja Diaria** (la jornada) · **Historial de Cajas** (los cierres) · **Libro Contable** (movimientos por día) ·
  **Caja Chica** (el fondo: botón en el POS + resumen dentro de Caja Diaria + su modal) · **Tickets cobrados**
  (lista de ventas, no es caja) · **Pagos Bancolombia** (menú aparte, también es plata).
- Caja Diaria, Libro Contable e Historial son **tres vistas del mismo dinero** con botones repetidos
  (Actualizar en cada una, Gastos en dos).
- "Caja Chica" y "Caja Diaria" suenan a lo mismo; el fondo de caja chica no se explica.
- El botón de **cuentas por cobrar** en el POS es solo un ícono "🧾" sin texto.

### 10.3 Dos "Finanzas" distintas con el mismo nombre
- **Finanzas** (menú lateral): costos fijos, margen mínimo, "este mes en vivo".
- **Métricas > "💰 Finanzas"** (`renderMetricasSqFin`): reparto de sueldos y reserva por día del festival Sabe a Quindío.
  Otro contenido con el mismo nombre; además "Sabe a Quindío" y su "Finanzas" están dentro de Métricas aunque son del festival.

### 10.4 Configuración mezclada
Nueve pestañas: Negocio, Horario, Tipos de Pago, Barrios especiales, Meseros, Categorías de Gastos, Botones, Seguridad,
Impresora. Problemas:
- "Horario" y "Barrios especiales" son del **domicilio/atención**, pero están separados.
- "Categorías de Gastos" pertenece al módulo de gastos.
- "Botones" es ambiguo: son los **botones del menú público**.
- "Tipos de Pago" (rótulo) vs `metodos_pago` (código): dos nombres para lo mismo.
- Otras configuraciones viven en otras pestañas (Fuera del Menú, TV, Redes, Costos), así que "dónde se cambia X" no tiene regla.

### 10.5 Dos componentes de pestañas
Informes/Configuración/Artículos usan `menu-inner-tab`; Métricas usa `metrics-tab-btn`. Ya existe `applyInnerTabs`
(tarea de reglas de interfaz); falta que Métricas lo use. Las secciones internas se ocultan con `hidden` + `style="display:none"`
escritos a mano.

### 10.6 Botones críticos hechos a mano
"Cerrar Caja" (`admin.html:14581` y `14619`) y "Registrar gasto" (`17265`) llevan degradado, tamaño y color
**inline**, distintos de `informes-action-btn--danger`. Las acciones más delicadas son las menos consistentes.

### 10.7 Nombres e idioma
- El menú lateral usa **"POS"** pero el panel interno se llama `pedidos`; "Artículos" es `menu`; "Fuera del Menú" es `cuponpana`.
  El usuario ve un nombre, el código otro, y la memoria del proyecto un tercero.
- Rótulos sin tilde ("Articulos", "Metricas", "Configuracion", "Cerrar sesion").
- Entradas ocultas (`tv`) y botones duplicados entre barra lateral y celular (`admin-nav-extra`).

## 11. Organización propuesta (para acordar antes de programar)

Menú lateral de **15 → 8** entradas, agrupando por la pregunta que se hace el dueño:

| Entrada | Contiene (pestañas internas) | Sale de |
|---|---|---|
| **POS** | Pedidos, Mesas, Cuentas por cobrar | POS |
| **Dinero** | **Caja de hoy** (abrir/cerrar, caja chica, gastos del día, traslados) · **Movimientos** (Libro Contable + Gastos + Traslados + Ajustes, un solo libro con filtro por tipo y categorías de gastos) · **Cierres** (Historial de Cajas) · **Ventas** (Tickets) · **Bancolombia** (pagos, voz, conciliación) · **Resultado** (Finanzas: costos fijos, margen, mes en vivo) | Informes, Finanzas, Pagos Bancolombia, Categorías de Gastos |
| **Catálogo** | Artículos · Costos y recetas | Artículos, Costos y recetas |
| **Clientes** | Clientes · Feedback · Fuera del Menú (cupones y fidelización) | Clientes, Feedback, Fuera del Menú |
| **Comunicación** | Mensajes · Chat Roal · Redes | Mensajes, Chat Roal, Redes |
| **Métricas** | Ventas POS · APP · Productos · Festival (Sabe a Quindío + su reparto, renombrado) | Métricas |
| **FODI** | Asistente | Asistente |
| **Configuración** | Negocio · Atención y domicilio (Horario + Barrios) · Pagos · Equipo (Meseros + Seguridad) · Impresión · Menú público (Botones) | Configuración |

Reglas que lo sostienen:
1. **Un solo botón "Registrar gasto"**, con una pregunta visible: *¿Sale de la caja de hoy o es de otro día/cuenta?*
   (por defecto "caja de hoy" si hay caja abierta). Se acaba la bandera oculta.
2. **Una sola vista de dinero por pregunta**: "¿cómo va hoy?" (Caja de hoy), "¿qué pasó?" (Movimientos),
   "¿cuánto cerré?" (Cierres), "¿gané?" (Resultado).
3. Un solo componente de pestañas, un solo juego de botones por roles, un solo modal y un solo formateador de dinero
   (ver secciones 3-5).
4. Todo rótulo en español con tilde, un nombre por cosa (el del menú = el del código = el de la documentación).
5. Los botones de ícono llevan texto (o tooltip visible): "Cuentas por cobrar", "Caja chica".

## 12. Siguiente paso sugerido
1. Acordar contigo este orden (puede cambiar: es tu negocio y tu forma de trabajar).
2. Una pasada visual con capturas por pantalla (escritorio y celular) para completar lo que aquí no se pudo medir.
3. Recién ahí ejecutar, en este orden: cálculos (sección 8 pasos 1-3) → `diaColombia` → gasto único → reorganización del menú
   → botones y modales.

---
---

# PARTE 3 — Plano de ejecución con candados de dinero

Autorización del dueño: total para ejecutar. Prioridad dicha por el dueño: **que los totales se mantengan y que se
conserven los historiales de todos los movimientos.** Este plano se diseñó alrededor de esas dos promesas.

## 13. Promesas inviolables

1. **Cero migraciones de datos.** No se renombra, mueve, borra ni reescribe ningún documento ni campo existente en Firestore.
   Colecciones intactas: `pedidos`, `pedidos_archivados`, `cierres_caja`, `gastos_caja`, `admin_estado/estado_caja`,
   `configuracion/caja_chica_actual`, `configuracion/metodos_pago`, `clientes`.
2. **Los cierres son libro cerrado.** Su `methodTotals`, `grandTotal` y fechas se leen tal cual. `cierres_caja.date` (UTC) no se
   reescribe: el día correcto se **deriva** de `closedAt` al mostrarlo.
3. **Mover ≠ cambiar el cálculo.** Todo cambio se etiqueta **(M)** *mover/rotular* (los números salen de la misma función)
   o **(C)** *cambiar cálculo* (exige prueba antes/después). Las fases (M) no pueden alterar un total por construcción.
4. **Foto antes y después.** `herramientas/baseline-dinero.mjs` (solo lectura, ya creado) saca totales por método y una
   **huella sha256** de cierres, gastos, traslados, ajustes, caja chica y estado de caja. Huella igual = historial intacto.
   `node herramientas/baseline-dinero.mjs comparar antes.json despues.json` lista cualquier diferencia.
5. **Reversible.** Cada fase en commits propios; el menú nuevo convive con el clásico (`?menu=clasico`) hasta que el dueño lo apruebe.
6. Lo que no se toca: tickets impresos y recibos, numeración de cuentas de cobro, puntos de lealtad, agente de WhatsApp,
   reglas de Firestore, las funciones de pago y el pricing del servidor.

## 14. Cómo se calcula hoy el dinero (necesario para no romperlo)

**Fuentes** (todas se conservan): `cierres_caja` (cada cierre guarda `methodTotals`, `ingresosMethod`, `gastosMethod`,
`grandTotal`), `gastos_caja` con 6 formas distintas, `configuracion/caja_chica_actual`, y los pedidos de la jornada abierta.

| Forma en `gastos_caja` | Quién la escribe | Cómo entra al saldo |
|---|---|---|
| `tipo:'caja'` | botón Gastos de Caja Diaria | Se hornea en el cierre al cerrar la caja |
| `tipo:'externo'` | Gastos del Historial / Informes > Gastos | Resta directo al saldo del método |
| `tipo:'traslado'` | modal Traslado | Mueve entre métodos; si cae dentro de un cierre, ya está horneado |
| `tipo:'ajuste'` | Ajustar saldos | Mueve el saldo, no es ingreso ni gasto |
| *(sin tipo)* + `cierreId` | "gasto olvidado" desde una fila del Historial | **Además edita el cierre** (`methodTotals`, `grandTotal`, `gastosMethod`…): es el único lugar que reescribe un cierre cerrado |
| *(sin tipo)* + `subcategoria:'Domicilios'` | al cerrar la caja | Gasto de domicilios, horneado en el cierre |

**El saldo no se guarda: se calcula en el navegador, y hoy hay tres versiones.**
- `_computeHistoricoSumMethod` (`admin.js:~30681`) → alimenta Traslado y Ajustar saldos.
- `renderLibroCierres`, PASO 1 (`admin.js:~30941`) → tarjetas y totales del Historial de Cajas.
- `_renderLcTable` (`admin.js:~31403`) → Libro Contable.

**Diferencias reales hoy (verificadas leyendo el código, magnitud por medir con la foto):**
1. El **Libro Contable ignora los Ajustes de saldo** y el descuadre interno de cierres; el Historial los incluye.
   Con algún ajuste registrado, los dos "Total Neto" difieren.
2. Los traslados dentro de un cierre se excluyen con una ventana `[aperturaAt, closedAt]`; los cierres antiguos sin
   `aperturaAt` usan "mismo día de calendario" (aproximación).
3. Cuatro botones distintos escriben gastos con formas distintas (tabla de arriba).

Por eso la **Fase 0** primero congela lo que hoy se muestra, y recién después se unifica.

## 15. Mapa exacto antes → después

Regla técnica que lo hace seguro: **todos los paneles conservan su `data-tab-panel` y sus manejadores.** Solo cambia la
barra de navegación (una capa nueva encima de `activateAccordion`). Cualquier código que hoy haga
`click()` sobre `data-accordion-target="X"` (FODI, avisos, cobros, 12 sitios) sigue funcionando porque X sigue existiendo;
un mapa de alias resuelve "X → grupo + pestaña".

| Hoy (menú lateral) | Pasa a (grupo → pestaña) | Panel que se reutiliza | Tipo |
|---|---|---|---|
| POS | **POS** → Pedidos | `pedidos` (sin cambios) | M |
| Informes › Caja Diaria | **Dinero → Caja de hoy** | `informes`/`caja-diaria` | M |
| Informes › Historial de Cajas | **Dinero → Cierres** | `informes`/`historial` | M |
| Informes › Libro Contable | **Dinero → Movimientos › Por día** | `informes`/`libro-contable` | M |
| Informes › Gastos | **Dinero → Movimientos › Gastos** | `informes`/`gastos` | M |
| Informes › Tickets | **Dinero → Ventas** | `informes`/`tickets` | M |
| Pagos Bancolombia | **Dinero → Bancolombia** | `banco` | M |
| Finanzas | **Dinero → Resultado** | `finanzas` | M |
| Artículos | **Catálogo → Artículos** | `menu` | M |
| Costos y recetas | **Catálogo → Costos y recetas** | `costos` | M |
| Clientes | **Clientes → Clientes** | `clientes` | M |
| Feedback | **Clientes → Feedback** | `feedback` | M |
| Fuera del Menú | **Clientes → Fuera del Menú** | `cuponpana` | M |
| Mensajes | **Comunicación → Mensajes** | `mensajes` | M |
| Chat Roal | **Comunicación → Chat Roal** | `chatroal` | M |
| Redes | **Comunicación → Redes** | `redes` | M |
| Métricas (+ "💰 Finanzas" interna) | **Métricas** (la interna se llama **Reparto del festival**) | `metricas` | M |
| Asistente | **FODI → Asistente** | `asistente` | M |
| Configuración › Negocio | **Configuración → Negocio** | `configuracion`/`negocio` | M |
| › Horario + Barrios especiales | **→ Atención y domicilio** | mismos dos paneles, una pestaña | M |
| › Tipos de Pago | **→ Pagos** (se llama igual en pantalla y código) | `metodos_pago` | M |
| › Meseros + Seguridad | **→ Equipo y seguridad** | mismos dos paneles | M |
| › Impresora | **→ Impresión** | `impresora` | M |
| › Botones | **→ Menú público** | `botones` | M |
| › Categorías de Gastos | **Dinero → Movimientos › Categorías** | `categorias_gastos` | M |
| Modo TV (oculto) | se mantiene como acceso del pie | `tv` | M |

Total de entradas del menú lateral: **15 → 8** (POS, Dinero, Catálogo, Clientes, Comunicación, Métricas, FODI, Configuración).
En celular el mismo árbol: el grupo abre una fila de pestañas deslizable, sin cambiar el tamaño de toque actual.

## 16. Lo que contiene "Dinero", pestaña por pestaña

| Pestaña | Responde a | Contenido (de dónde sale) | Botones |
|---|---|---|---|
| **Caja de hoy** | ¿Cómo va hoy? | Caja Diaria tal cual: ventas por método, gastos del día, caja chica (resumen) | Abrir / Cerrar caja · **Registrar gasto** · Traslado · Caja chica · Actualizar |
| **Movimientos** | ¿Qué pasó? | Por día (Libro Contable) · Gastos · Categorías. Filtro por tipo, rango de fechas estándar, buscador | Registrar gasto · Exportar |
| **Cierres** | ¿Cuánto cerré / cuánto tengo? | Historial de Cajas: tarjetas de saldo por método, detalle por día | Excel · PDF · Traslado · Ajustar saldos · *Agregar gasto olvidado a este cierre* (por fila) |
| **Ventas** | ¿Qué vendí? | Tickets cobrados | Buscar · reimprimir |
| **Bancolombia** | ¿Qué entró al banco? | Pagos, voz, conciliación | los actuales |
| **Resultado** | ¿Gané? | Costos fijos, margen mínimo, "este mes en vivo" | los actuales |

Se eliminan solo **botones duplicados** (los dos "💸 Gastos" extra y el "Actualizar" repetido por pestaña). Ningún dato se elimina.

## 17. Un solo "Registrar gasto" (sin cambiar lo que se guarda)

Hoy hay 4 caminos silenciosamente distintos. Pasa a haber **un** modal con la pregunta visible **"¿De dónde sale?"**:

| Opción | Se guarda exactamente como hoy | Cuándo aparece |
|---|---|---|
| **Caja de hoy** | `tipo:'caja'`, `cajaAperturaAt` = apertura actual | Por defecto si hay caja abierta |
| **Fuera de la caja** (otro día/cuenta) | `tipo:'externo'`, `cajaAperturaAt:null` | Por defecto si la caja está cerrada |
| **Olvidado de un cierre pasado** | Igual que hoy: gasto con `cierreId` **y** actualización del cierre | Solo desde la fila del cierre en *Cierres*, con confirmación: «Esto modifica el cierre del DD/MM» |

La prueba automática comprueba que cada opción escribe **los mismos campos con los mismos valores** que el código actual.

## 18. Fases, candados y orden

| Fase | Qué se hace | Tipo | Candado antes de seguir |
|---|---|---|---|
| **0 · Red de seguridad** | Foto del dinero (hecho) · extraer a funciones puras los 3 cálculos de saldo (`caja/saldos.js`) y probarlos con los números actuales *sin corregirlos* (golden master) | M | Foto A guardada; las 3 versiones reproducen lo que hoy muestran las pantallas |
| **1 · Una sola verdad (cálculo)** | `isOrderPaidReal`/`isOrderVoided` únicos · `diaColombia` en los 12 sitios · `getOrderDisplayTotal` en todas las lecturas · constantes de negocio compartidas · un `formatCOP` | C | Foto igual (nada histórico cambia). Los cambios esperados solo se ven en **vistas derivadas**: Métricas después de las 7 pm, y cualquier suma que hoy contaba un "por cobrar" de más. Cada diferencia se lista con su causa |
| **2 · Menú nuevo** | Navegación 15→8 con alias · `?menu=clasico` | M | Foto igual · los 12 recorridos de la lista de abajo |
| **3 · Gasto único** | El modal de la sección 17 | C ligera | Pruebas de campos idénticos · foto igual tras registrar un gasto de prueba y borrarlo |
| **4 · Movimientos unificados** | Libro Contable y Gastos en una vista; fila de conciliación con Cierres. Aquí se resuelve la diferencia de la §14.1 con los números reales de la foto | C | El dueño aprueba cuál total es la verdad; la conciliación debe dar $0 de diferencia explicada |
| **5 · Botones, modales, formato** | Roles de botón, un modal, `showConfirmModal` en las 8 llamadas nativas, tildes. Primero dentro de Dinero | M | Captura antes/después por pantalla |
| **6 · Configuración y nombres** | Las agrupaciones de la §15 y un nombre por cosa | M | Foto igual |

Despliegue: commit local por fase; `git push` (Vercel) cuando la fase esté verificada, agrupando para respetar el límite de
despliegues. Las funciones de Firebase **solo** si cambia `adminAsistente.js` (alias de navegación de FODI), siempre por nombre
y por tandas (incidente de cuota 2026-11-08).

## 19. Recorridos de verificación (cada fase)
1. Abrir caja con billetes y nombre · 2. Venta en efectivo · 3. Venta con pago dividido · 4. Venta por cobrar y cobrarla ·
5. Gasto de la caja de hoy · 6. Gasto fuera de caja · 7. Traslado entre dos métodos · 8. Cerrar caja y reimprimir el cierre ·
9. Historial: tarjetas de saldo = foto · 10. Excel y PDF de cierres con los mismos totales · 11. Caja chica abrir/contar ·
12. FODI "llévame a Finanzas / a Costos" · 13. Modo mesero sin acceso a Dinero.
Se hacen en el navegador integrado con la sesión del dueño; los datos de prueba se crean y se anulan con su trazo en historial
(nunca se borran movimientos reales).

## 20. Decisiones que necesito del dueño
1. **¿Cuál es el Total Neto correcto cuando hay Ajustes de saldo?** Hoy Historial los suma y Libro Contable no. Propuesta: el del
   Historial (el saldo real), y el Libro Contable muestra una línea «Ajustes de saldo» para que cuadre.
2. **Gasto olvidado de un cierre pasado:** mantener que edite el cierre (como hoy, con confirmación y etiqueta) o registrarlo
   como movimiento aparte. Propuesta: mantener hoy, solo etiquetarlo.
3. **Nombre del grupo:** «Dinero» (propuesto) o «Caja».
4. **Menú clásico** disponible dos semanas tras el cambio, con interruptor, para volver atrás sin código.

---
---

# PARTE 4 — Lo que muestra la captura real de Historial de Cajas (10 nov 2026)

## 21. Los números (comprobados con la aritmética de la propia pantalla)
- Saldos por método: Efectivo $878.700 + Bancolombia/Breve $723.325 + Nequi $0 + Otro $0 = **$1.602.025** = Total Neto. ✔ cuadra.
- Día martes 10: ingresos $213.000 − egresos $1.289.000 = **−$1.076.000** = total del día. ✔ cuadra.
  Egresos del día: $12.000 del cierre + $1.277.000 de gastos externos (900.000 efectivo + 150.000 Bancolombia + 227.000 Nequi). ✔ cuadra.
- **Pero Ingresos $76.832.900 − Egresos $77.235.120 = −$402.220, y el Total Neto muestra +$1.602.025.**
  Diferencia de **$2.004.245**: es lo que aportan los **Ajustes de saldo** (por eso el ícono ⚖️ junto a "Total Neto").
  Es exactamente la discrepancia de la §14.1: el **Libro Contable (ingresos − egresos) mostraría −$402.220** mientras que
  el Historial muestra +$1.602.025. No es un error de suma, es que dos pantallas definen "total" distinto. Ya no es una sospecha: está en tu pantalla.
- Egresos acumulados ($77,2 M) casi igualan a ingresos ($76,8 M): se registra casi todo lo que sale, así que el saldo depende
  mucho de los ajustes. Con más razón el ajuste debe verse como una **línea propia y visible** en cualquier total.

## 22. Hallazgo nuevo: el negocio cierra pasada la medianoche
El cierre del martes es a las **03:56 a. m.** Todas las pantallas agrupan por día de **calendario**, así que las ventas del lunes
en la noche aparecen bajo "martes" y un mismo turno se parte en dos días en Métricas y en cualquier gráfica.
Corregir solo el UTC (`diaColombia`) **no basta**: pasaría el corte de las 7 p. m. a la medianoche, pero el turno sigue partido.
Lo que usan los POS maduros es el **día operativo**: un día va de una hora de corte (p. ej. 5:00 a. m.) a la siguiente.
Propuesta: una sola configuración **"hora de corte del día"** (por defecto 5:00 a. m.), usada por Métricas, Libro Contable y
reportes. Solo cambia vistas derivadas; ningún documento guardado se toca. Por defecto, cada cierre se asocia al día en que
**empezó** su jornada (`aperturaAt`), no al día en que terminó.

## 22-bis. CORRECCIÓN a la §22 — regla del día decidida por el dueño (sustituye la "hora de corte")
El dueño aclaró: la hora de cierre varía (10 p. m., 11 p. m., o se olvida y se cierra al otro día al mediodía) y aun así
**esa caja pertenece al día en que se vendió**. Por tanto **no hay hora de corte fija**. La regla es:

> **Cada jornada pertenece al día (hora Bogotá, UTC−5) en que se ABRIÓ la caja, sin importar cuándo se cierre.**

- Cierre con `aperturaAt` → día = día Bogotá de `aperturaAt`.
- Cierre antiguo sin `aperturaAt` → día = día Bogotá del primer pedido cobrado que contiene; si no se puede saber, el de `closedAt` (se marca "aprox.").
- Pedidos y gastos sueltos sin caja → día Bogotá de su propia hora (`paidAt` / `registradoAt`).
- Toda hora mostrada o agrupada usa `America/Bogota`, nunca la zona del navegador ni UTC.
- Solo cambia cómo se **agrupan y muestran** los datos. No se reescribe `cierres_caja.date` ni ningún documento.

## 23. Observaciones de diseño de esta pantalla (las primeras evidencias visuales)
1. **Cantidades negativas que se parten en dos líneas** ("−$" arriba, "227.000" abajo; "−$" / "1.076.000"): columnas demasiado
   angostas para el dinero. Un número de dinero nunca debe partirse (`white-space:nowrap`, ancho mínimo).
2. **El dato más importante es el más escondido:** "Total Neto" quedó solo, más pequeño, en una segunda fila, mientras
   que Nequi $0 y Otro $0 ocupan sitio de primera fila. Propuesta: Total Neto grande y primero; métodos con saldo 0 se
   atenúan o se agrupan en "otros métodos".
3. **Barra de acciones sin jerarquía:** título + filtro de fechas + Actualizar + Excel + PDF + Gastos + Traslado en una
   línea, y **Ajustar saldos** cae a otra. Cada uno con color distinto (rojizo, azul, azul oscuro). Propuesta: filtros a la izquierda,
   *Exportar* (Excel/PDF) en un solo botón con menú, y las acciones que mueven dinero (Registrar gasto, Traslado, Ajustar)
   juntas y con un único estilo por rol.
4. **Iconos emoji grandes y de colores distintos** en pestañas y botones: ruido visual y tamaños irregulares entre
   pantallas. Propuesta: un solo juego de íconos lineales, del mismo peso.
5. **Barra inferior con 4 íconos sin texto** (corazón, altavoz, altavoz tachado en rojo, documento): no se entiende qué hacen
   sin pasar el cursor. Rótulo corto o tooltip permanente.
6. **El menú lateral se corta** ("Fuera del menú" medio oculto bajo la barra inferior): con 15 entradas ya no cabe en esta
   altura; es una razón práctica más para el menú de 8.
7. **Fila "Cierre de caja · 03:56 a. m."** con el botón *Ver* encima del título: se superpone con el texto en el borde derecho.

Todo lo anterior entra a la **Fase 5** (botones/formato), salvo el punto 1 (corte de números), que es un arreglo de una línea
de CSS y puede ir en la Fase 1.

---
---

# PARTE 5 — Decisiones del dueño (10 nov 2026) y estado de la Fase 0

## 24. Decisiones
1. **El saldo real es el del Historial de Cajas** ($1.602.025 hoy). El Libro Contable mostrará el mismo total, con una línea visible
   «Ajustes de saldo» (hoy +$2.004.245) para que se entienda de dónde sale.
2. **No se registran gastos con la caja cerrada.** Si se intenta, el sistema no lo guarda: ofrece **«Dejar un recordatorio»**, y al
   abrir la caja siguiente aparece el aviso «Tienes N gastos pendientes» con botón para registrarlos (formulario ya prellenado).
   Consecuencias de diseño:
   - Todo gasto nuevo es de la jornada abierta (`tipo:'caja'`) y se hornea en su cierre. Dejan de crearse gastos `externo` y
     el «gasto olvidado dentro de un cierre pasado» (el único camino que reescribía un cierre). Lo ya guardado se sigue leyendo igual.
   - El recordatorio es un dato **nuevo y aparte** (`admin_estado/gastos_pendientes`); no cuenta en ningún saldo hasta registrarse.
   - Traslados entre métodos y Ajustar saldos **no son gastos**: se mantienen disponibles con la caja cerrada (confirmar con el dueño).
   - El gasto de la mañana siguiente cae en la jornada del día en que se registra (aceptado por el dueño).
3. **Nombres.** Las apps con experiencia separan *operación de caja* de *reportes*: Toast usa «Cash Management» y «Reports»; Square «Caja»/«Reportes»;
   Loyverse «Turnos de caja» e «Informes». Propuesta (8 entradas): **POS · Caja · Informes · Catálogo · Clientes · Comunicación · FODI · Configuración**.
   - **Caja:** Caja de hoy · Gastos · Movimientos (Libro Contable) · Cierres · **Pagos digitales**.
   - **Informes:** Ventas (tickets) · Métricas · Resultado (Finanzas) · Reparto del festival.
   - «Bancolombia» pasa a llamarse **«Pagos digitales»**: la pestaña nació (2 nov) para recibir los avisos del banco por correo y anunciar
     el pago con voz; el banco es un detalle técnico, y la pantalla ya sirve también para conciliar contra Nequi/Bold. Un nombre por función, no por proveedor.
4. **Menú clásico:** sí, dos semanas con interruptor.

## 25. Fase 0 — hecha (sin cambios visibles en la app)
- `herramientas/baseline-dinero.mjs`: foto de solo lectura (totales + huellas) y, además, guarda los documentos crudos en una carpeta
  ignorada por git para las pruebas.
- `src/js/caja/saldos.js`: la cuenta de saldos del Historial en un módulo puro (copia exacta, sin correcciones).
- `src/js/caja/saldos.test.js`: 10 casos de reglas + **golden master contra el dinero real**: reproduce Efectivo $878.700, Bancolombia
  $723.325, Nequi $0, Otro $0, Total Neto $1.602.025, Ingresos $76.832.900, Egresos $77.235.120 y Libro Contable −$402.220. **Todo en verde.**
- Huellas de referencia (foto A, 2026-11-10): `cierres_caja 32fa6ec510c20196` · `gastos_caja 0a540331516ab8bd` ·
  `gastos_externos 8e07c5ce78388b3d` · `traslados ec70683c0a9e2251` · `ajustes 35aeb1d63d0d169b`.
  (Las de caja chica y estado de caja cambian a diario: no son de historial.)
- `admin.js` todavía no usa el módulo; pasa a delegar en él en la Fase 1.

---
---

# PARTE 6 — Fase 1 (una sola verdad de cálculo): hecha en código, sin desplegar

## 26. Correcciones a lo dicho antes (por honestidad)
- **§9 estaba equivocado en un punto:** las ventas de Métricas **no** sufren el corrimiento UTC (usan `rangoMs`, que ya es hora Bogotá).
  Las líneas `11552-11592` que cité son el **tráfico de visitas web**, que `tracking.js` guarda con fecha UTC y el panel lee con la misma
  (coherentes entre sí; solo hace que "visitas de hoy" se reinicie a las 7 p. m.). No toca dinero; se deja para una fase posterior.
- `20237` (`_cdAddDays`) usa `Date.UTC` a propósito para sumar días: no es un error.
- **Los sitios UTC que sí afectaban** eran 5: 4 en el flujo de caja (cobro, gastos de jornada, preparar cierre, archivar al cerrar) cuando
  la caja no está abierta, y el filtro por defecto de **Tickets** (después de las 7 p. m. mostraba "mañana", o sea vacío).

## 27. Qué se cambió (archivos: `src/js/admin.js`, `admin.html`, `src/css/style.css`, `src/js/caja/saldos.js`)
| # | Cambio | Efecto en el dinero |
|---|---|---|
| 1 | `_diaBogota(ms)`: única forma de obtener "el día" (hora Colombia). Reemplaza los 5 usos de `toISOString()` | Ninguno en totales; corrige el día con la caja cerrada y el filtro de Tickets |
| 2 | `_cierreDiaMs(c)`: el día de un cierre es el de su **apertura** (regla del dueño) | **Solo reagrupa**: Historial de Cajas, Libro Contable, filtro de fechas y exports por día |
| 3 | `isOrderVoided(o)` en los 3 sitios que miraban `voided` y `anulado` juntos | Igual que antes (mismo criterio exacto) |
| 4 | `!isOrderPaid(o) \|\| esPorCobrar(o)` → `!isOrderPaidReal(o)` (3 sitios) | Equivalencia exacta |
| 5 | Cierres **nuevos**: `date` e id del cierre usan el día de apertura en hora Colombia (antes UTC del cierre) | Solo etiqueta de documentos nuevos; los viejos no se tocan |
| 6 | Cifras de dinero de las tablas de caja con `white-space:nowrap` | Solo visual: ya no se parten en dos líneas |
| 7 | **Candado en vivo:** el Historial compara su propia suma con `saldos.js` y, si difieren, avisa en consola (F12) | Ninguno; no cambia lo que se ve |

## 28. Verificación hecha
- Foto del dinero después de los cambios vs antes: **idéntica** (huellas y totales). No se escribió nada en Firestore.
- Reagrupación medida con los 129 cierres reales: **20 cierres (15 %) cambian de día** (los que se abren un día y se cierran otro, p. ej. abierto 2-nov,
  cerrado 3-nov 11:56 a. m.). La suma total por día **antes = después = $65.889.870**; cambia el reparto entre días (36 días), no el total.
- `saldos.test.js` (19 comprobaciones) y `calculos.test.js` en verde. Pruebas que ya fallaban antes de tocar nada (`cupon-editor`, `cupon-pana`,
  `firestore.rules`, `loyalty-cancellation`, `mesero-auth`, `whatsapp-links`): **mismos conteos de falla antes y después** (necesitan emulador o ya estaban rotas).
- Compila con esbuild sin errores.
- **No verificado:** el panel en pantalla (exige iniciar sesión); falta comprobarlo con la sesión del dueño tras el despliegue.

## 29. Lo que queda de la Fase 1 (a propósito, por requerir datos o decisión)
- **Lecturas de total** (`Number(o.total||0)` ≈16 sitios vs `getOrderDisplayTotal`): difieren solo en pedidos sin `total`; se unifican cuando la foto confirme
  que ningún pedido real carece de `total` (si hay alguno, cambiaría una suma y se avisa antes).
- **Escritura de las dos banderas** (`anulado`/`voided`): hoy se lee con un solo criterio; escribir siempre ambas es un cambio de datos nuevos → decidir.
- **Constantes de negocio compartidas** ($2.000 empaque, $7.000 combo, valor del punto) y **un solo `formatCOP`**: tocan menú público, servidor y agente; van en su propio paso con pruebas de paridad.
- El módulo `saldos.js` **verifica** pero aún no **pinta**; pasará a pintar en la Fase 4 (Movimientos unificados).

---
---

# PARTE 7 — Fase 1b: la hora de Colombia en todo el panel (hallazgo de la captura 2)

## 30. CORRECCIÓN IMPORTANTE a la §22 (lo de "cierra pasada la medianoche" era una mala lectura mía)
El cierre que se veía "03:56 a. m." **no se hizo de madrugada**. En la base de datos se cerró el **9-nov a las 21:56 hora Colombia**
(abrió 15:06, cerró 21:56, neto $201.000). El panel lo mostraba "03:56 a. m. del martes 10" porque **el computador desde el que se mira está en otra
zona horaria (UTC+1)** y todo el panel usaba la zona del navegador. Eso explica por qué "los días se corrían". La regla del dueño (el día es el de la
apertura, en hora Bogotá) sigue siendo correcta y ahora además se cumple en pantalla: el cierre ya aparece como **Lunes 9 de noviembre**.

El panel suponía que el navegador estaba en Colombia (un comentario del código lo decía: «Usar fecha local (Colombia UTC-5)»).
Había ~35 sitios que dependían de eso, varios con dinero: «Ventas de hoy» del POS, «Hoy / Semana / Mes» de Métricas, el filtro Hoy/Ayer/Semana/Mes de los informes,
«Finanzas: este mes en vivo», y la caja diaria cuando no hay apertura.

## 31. Qué se corrigió
| # | Cambio | Dinero |
|---|---|---|
| 1 | **Error mío de la Fase 1:** la tarjeta del cierre mostraba la hora de **apertura** (3:06 p. m.) en vez de la de **cierre** (9:56 p. m.). Corregido | Solo etiqueta |
| 2 | Bloque `dias-bogota` (`_diaBogota`, `_horaBogota`, `_diaSemanaBogota`, `_inicioDiaBogotaMs`, `_sumarDiasKey`, `_primerDiaMesKey`): única forma de calcular día/hora/semana/mes | — |
| 3 | Parche `zona-colombia`: todo `toLocaleTimeString/DateString/String` e `Intl.DateTimeFormat` sin zona propia sale en hora de Colombia | Solo lo que se ve |
| 4 | Reemplazados los cálculos con la zona del navegador: banner de ventas de hoy, caja diaria sin apertura, `_periodStats` (Hoy/Semana/Mes), gráficas por hora y día de la semana, atajos Hoy/Ayer/Semana/Mes de los filtros, Finanzas «este mes en vivo», saludo, horario del chat | Solo cambia **qué instante** es «hoy / este mes» si el computador no estaba en Colombia; en un computador en Colombia da exactamente lo mismo que antes |
| 5 | `saldos.js` y `admin.js`: el traslado dentro de un cierre antiguo sin apertura se compara por día de Colombia | Igual |

Quedan sin tocar a propósito: `setDate(getDate()-30)` y `METRICS_ORDERS_LOOKBACK_DAYS` (ventanas de días, no dependen de la hora exacta) y `_metricsPeriodStart` (función sin ninguna llamada).

## 32. Verificación
- `src/js/caja/dias.test.js` simula **un computador en España** y reproduce el síntoma exacto («03:56 a. m.»); con los cambios da `09:56 p. m.`, día 9, hora 21, lunes (16 comprobaciones).
- `saldos.test.js` sigue en verde (reproduce las tarjetas de la pantalla al peso).
- Compila con esbuild sin errores. No se tocó ningún dato.
