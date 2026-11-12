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

---
---

# PARTE 8 — Fase 2: menú principal de 8 grupos (hecha, subida con interruptor al menú anterior)

## 33. Qué se hizo
Solo cambia la **navegación**. Cada elemento del menú nuevo pulsa el botón de siempre (`data-accordion-target`) y, si hace falta, la pestaña interna
de siempre (`data-section-tab`). **Ningún panel, dato ni cálculo cambia.** Los 16 botones viejos siguen en la página, ocultos, porque FODI, los avisos, el cobro y
otros ~12 flujos los pulsan por código.

| Grupo | Elementos (→ panel de siempre) |
|---|---|
| **POS** | POS → `pedidos` |
| **Caja** | Caja de hoy → Informes/Caja Diaria · Gastos → Informes/Gastos · Movimientos → Informes/Libro Contable · Cierres → Informes/Historial de Cajas · **Pagos digitales** → `banco` (antes «Pagos Bancolombia») |
| **Informes** | Ventas → Informes/Tickets · Métricas → `metricas` · Resultado → `finanzas` (antes «Finanzas») |
| **Catálogo** | Artículos → `menu` · Costos y recetas → `costos` |
| **Clientes** | Clientes → `clientes` · Feedback → `feedback` · Fuera del Menú → `cuponpana` |
| **Comunicación** | Mensajes → `mensajes` · Chat Roal → `chatroal` · Redes → `redes` |
| **FODI** | Asistente → `asistente` |
| **Configuración** | Configuración → `configuracion` (sus 9 pestañas internas se reordenan en la Fase 6) |

- Las 5 pestañas internas de Informes pasan al menú (la barra interna se oculta para no duplicar).
- **Interruptor:** botón «Ver menú anterior / Ver menú nuevo» en el pie, o `?menu=clasico` / `?menu=nuevo` en la dirección. Se recuerda en el navegador.
- **Insignias de "sin leer"** (mensajes, pedidos, chats): las siguen poniendo los botones viejos; el menú nuevo las copia al elemento y las **suma en el grupo**.
- **Si otro código cambia de pestaña** (FODI, «Ir a Caja Diaria»…), el menú resalta el elemento correcto.
- **Celular:** tocar un grupo lo abre/cierra sin cerrar el menú; tocar un elemento navega y cierra.
- Etiquetas con tildes; un nombre por función (no por proveedor).

## 34. Verificación
- `tests/admin-nav2.test.js` (9 pruebas): exactamente 8 grupos; **ningún botón viejo queda sin cubrir** (no se pierde ninguna pestaña); las 5 pestañas de Informes están cada una una sola vez; todo destino existe en `admin.html`; los botones nuevos no se mezclan con los viejos.
- `tests/admin-nav2.e2e.mjs` (18 comprobaciones en **Chromium real** con el HTML y los estilos reales del panel): navegación de cada grupo, Cierres abre el Historial, resaltado cuando otro código cambia de pestaña, insignia 3 en Mensajes y en el grupo, interruptor al menú anterior, celular, sin errores de JavaScript.
- 123 pruebas de las que exige el despliegue, todas en verde. No se tocó ningún dato (la foto del dinero no puede cambiar: es solo navegación).
- **No verificado con datos reales:** el panel completo con tu sesión (la prueba usa el HTML real pero sin Firebase).

## 35. Pendiente de esta fase → siguientes
- Fase 3: gasto único («solo con caja abierta» + recordatorio) — cambia datos nuevos, requiere su propia prueba.
- Fase 6: reordenar las pestañas internas de Configuración (Horario+Barrios, Meseros+Seguridad, mover Categorías de Gastos a Caja).

---
---

# PARTE 9 — Fase 3: gasto único, solo con la caja abierta, con recordatorios (hecha)

## 36. Qué cambia para el usuario
- **Con la caja abierta:** el gasto se registra igual que siempre (mismo formulario) y queda en la jornada abierta (`tipo:'caja'`) → entra al cierre de ese día.
- **Con la caja cerrada:** el botón de gasto (Caja de hoy o Caja › Gastos) ya no abre el formulario: muestra «🔒 La caja está cerrada» con dos salidas:
  **Dejar recordatorio** (descripción + monto opcional) o **Abrir la caja ahora**.
- **Al abrir la siguiente caja:** aparece un aviso en pantalla y una franja amarilla «🔔 Tienes N gastos pendientes por registrar» en Caja de hoy.
  «Ver» lista los recordatorios; **Registrar** abre el formulario ya lleno (descripción y monto) y, al guardarse el gasto, el recordatorio se quita; **✕** lo descarta (con confirmación).
- Si la caja se cierra desde otro equipo mientras se llena el formulario, el gasto **no** se guarda huérfano: se avisa y se ofrece dejarlo como recordatorio.

## 37. Qué se quitó (y por qué no pierde nada)
- El botón **«Gastos» del Historial de Cajas** (guardaba gastos «externo» sin caja).
- El camino **«gasto olvidado dentro de un cierre ya cerrado»** (`openCierreGastoModal`), el **único** que reescribía un cierre. Su botón ya no existía en pantalla; se eliminó también el código.
- Desde ahora **no se crean más gastos `externo`**. Los que ya existen (560 en la foto) se siguen leyendo, sumando y mostrando exactamente igual: no se tocó ningún documento.

## 38. Datos nuevos (solo ese)
`admin_estado/gastos_pendientes` → `{ items: [{ id, descripcion, monto, creadoAt, creadoPor }], updatedAt }`. Se escribe con **transacción** (dos equipos a la vez no se pisan).
No está en `gastos_caja` ni en `cierres_caja`, así que **no cuenta en ningún saldo ni total** hasta que se registra como gasto. Las reglas de Firestore ya permitían a un admin leer/escribir `admin_estado`: no hubo que cambiarlas.

## 39. FODI y métricas (regla del dueño: toda función nueva)
- Herramienta nueva de FODI **`gastos_pendientes`** (solo lectura, `functions/fodiGastosPendientes.js`): cuántos hay, de qué, por cuánto y quién los dejó.
- La métrica es el propio conteo/monto del recordatorio (franja del panel + FODI).

## 40. Además (zona horaria, mismo criterio de la Fase 1b)
Los filtros «desde / hasta» de **Tickets** y de **Gastos** usaban medianoche en la zona del navegador; ahora son el día completo en hora de Colombia.

## 41. Verificación
- `tests/gastos-pendientes.test.js` (11): reglas puras de los recordatorios + garantías de código (con la caja cerrada no se muestra el formulario, todo gasto nuevo es `tipo:'caja'`, ningún código escribe `externo`, nadie edita un cierre ya hecho, el recordatorio no toca `gastos_caja` ni `cierres_caja`).
- `tests/gastos-pendientes.e2e.mjs` (19 comprobaciones en **Chromium real**, con el código real del panel y una base simulada): guardar el recordatorio, que quede quién lo dejó, que no toque saldos, «Abrir la caja ahora», aviso al abrir (sin repetirse), «Ver → Registrar» con los datos, quitar al registrar, descartar con confirmación y dos recordatorios simultáneos sin perder ninguno.
- `tests/fodi-gastos-pendientes.test.js` (4). Total de las pruebas que exige el despliegue: **138 en verde**.
- Foto del dinero antes/después: **idéntica** (no se escribió nada del dinero).
- **No verificado con datos reales:** el flujo completo con tu sesión (abrir/cerrar caja real, registrar un gasto real).

---
---

# PARTE 10 — Fase 4: un solo Total Neto en Movimientos (Libro Contable) y Cierres (hecha)

## 42. El problema (decisión 1 del dueño: «el saldo real es el del Historial»)
Con los mismos datos, el **Historial de Cajas** mostraba **$1.602.025** y el **Libro Contable** **−$402.220**. La diferencia, **$2.004.245**, eran exactamente los 2 Ajustes de saldo (efectivo +869.100, Bancolombia +1.035.145, Nequi +100.000), que el Libro Contable ignoraba.

## 43. Qué se hizo
- El Libro Contable (ahora titulado **Movimientos**) incluye los Ajustes de saldo en su cuenta, igual que el Historial: el **Total Neto del pie = suma de los días = Total Neto del Historial**.
- Línea propia visible **«⚖️ AJUSTES DE SALDO +$2.004.245»** en el pie, para que se vea de dónde sale y que **no es ingreso ni egreso**: Ingresos ($76.832.900) y Egresos (−$77.235.120) **no cambian**.
- Cada ajuste aparece en el detalle de su día («⚖️ Ajuste de saldo · hora», con lo que movió cada método).
- **Candado en vivo:** el Libro Contable compara su Total Neto con el del módulo puro (`saldos.js`); si algún día difieren, aviso en consola.
- **Un nombre por pantalla** (el del menú = el del título): Caja de hoy · Movimientos · Cierres · Ventas (antes «Caja Diaria», «Libro Contable», «Historial de Cajas», «Tickets cobrados»).

## 44. Verificación
- `tests/libro-contable.e2e.mjs` (9 comprobaciones en **Chromium real** con el código real de `_renderLcTable`): casos de reglas y, con la **foto real del dinero**, Total Neto **$1.602.025**, Ajustes **+$2.004.245**, Ingresos **$76.832.900**, Egresos **−$77.235.120**, y el candado sin avisos.
- 138 pruebas del despliegue + las de navegador (menú 18, gastos 19) + `saldos` y `dias` en verde. Foto del dinero antes/después **idéntica** (solo cambia lo que se muestra).

## 45. Lo que se dejó para después
- **Una sola lista** que mezcle ventas cerradas, gastos, traslados y ajustes con filtro por tipo (hoy Movimientos y Gastos son dos vistas del mismo dinero, ambas ya cuadradas con Cierres). Es una mejora de comodidad, no de exactitud; conviene decidirla con el uso real.
- Fases 5 (botones, modales, formato) y 6 (Configuración) siguen pendientes.

---
---

# PARTE 11 — Fase 5 (primera entrega): botones por rol, ventanas propias y formato de dinero único

## 46. Botones por rol (empezando por Caja)
Clase base `informes-action-btn` + modificadores de **rol**: normal = secundario · `--primary` = la acción principal de la pantalla ·
`--danger-solid` = acción delicada · `--danger` = peligro suave · `--ghost` = discreto.
- **Caja de hoy:** [↺ Actualizar] · [**💸 Registrar gasto**] (principal, naranja) · [**🔒 Cerrar caja**] (delicada, roja). Se quitaron los estilos pegados a mano; el «Cerrar caja» de la vista previa y «Reimprimir» usan los mismos roles.
- **Cierres:** de **5 botones sueltos** (Excel, PDF, Traslado, Ajustar saldos + Actualizar, cada uno de otro color) a **3 controles**: [↺ Actualizar] · [⬇ Exportar ▾ → Excel, PDF] · [🔄 Mover dinero ▾ → Traslado entre cuentas, Ajustar saldos]. Los ids de los botones no cambiaron, así que los manejadores siguen funcionando.
- **Gastos:** el botón es el mismo «💸 Registrar gasto» (un nombre por acción).
- El panel de Cierres reserva altura para que el menú desplegable no quede recortado por la tarjeta cuando hay pocos cierres.

## 47. Tarjetas del Historial (lo visto en la captura)
**Total Neto primero y grande**, luego Ingresos, Egresos y los métodos; los métodos con saldo **$0 se atenúan** (antes Nequi $0 y Otro $0 ocupaban primera fila y el Total Neto quedaba escondido y pequeño).

## 48. Ventanas propias, nada nativo
Las **8 ventanas nativas** del navegador (`confirm`/`prompt`) de las pestañas más nuevas (Fuera del Menú, Costos, FODI memoria/base, Pagos digitales) pasaron a `showConfirmModal` / `showPromptModal`. El panel ya no usa ninguna (prueba automática lo vigila).

## 49. Formato de dinero único
26 cifras armadas a mano (`$${Number(x).toLocaleString('es-CO')}` → «$1.000») pasaron a `formatMoney` («**$ 1.000**»): una sola forma de escribir dinero en el panel (prueba automática).

## 50. Verificación
- `tests/caja-botones.e2e.mjs` (15 en **Chromium real**, estilos reales): roles, menús Exportar/Mover dinero (abrir, elegir cierra, tocar fuera cierra, abrir uno cierra el otro), ids conservados. Capturas revisadas.
- `tests/caja-presentacion.test.js` (6) · **144** pruebas del despliegue + menú (18) + gastos (19) + Libro Contable (9) + saldos/días, todas en verde. Foto del dinero **idéntica**.

## 51. Pendiente de la Fase 5 (segunda entrega)
Los demás modales (6 estructuras distintas), los botones del resto de pestañas (Informes/Clientes/Catálogo…), íconos emoji → un juego lineal, y el `formatCurrency`/`formatCurrencyCOP` del menú público y del agente (otros archivos: cambian lo que ve el cliente, van aparte).

---
---

# PARTE 12 — Fase 6: Configuración ordenada dentro del menú (hecha)

## 52. Decisión de diseño
En vez de fusionar paneles (riesgo sin necesidad), **cada pestaña interna de Configuración pasa a ser un elemento del menú**, con orden lógico y nombre claro, igual que ya se hizo con Informes. Los 9 paneles y sus datos no se tocan.

| Antes (pestaña interna) | Ahora |
|---|---|
| Negocio | Configuración › **Negocio** |
| Horario | Configuración › **Horario y cierres** (incluye cierres programados e historias de días cerrados) |
| Barrios especiales | Configuración › **Barrios especiales** |
| Tipos de Pago | Configuración › **Formas de pago** |
| Meseros | Configuración › **Meseros** |
| Impresora | Configuración › **Impresora** |
| Botones (ambiguo) | Configuración › **Menú público** |
| Seguridad | Configuración › **Seguridad** (al final) |
| **Categorías de Gastos** | **Caja › Categorías de gastos**, junto a Gastos |

- Menú lateral sigue en 8 grupos; **Caja = 6 elementos** (Caja de hoy · Gastos · Categorías de gastos · Movimientos · Cierres · Pagos digitales), **Configuración = 8**.
- La barra interna de pestañas de Configuración se oculta en el menú nuevo (como la de Informes).
- Títulos de los paneles alineados con el menú: «Formas de pago», «Menú público», «Categorías de gastos».
- Si otro código abre una pestaña (p. ej. Seguridad), el menú resalta el elemento correcto; «Categorías de gastos» se resalta en **Caja**, no en Configuración.

## 53. Verificación
- `tests/admin-nav2.test.js` (11): las **9** pestañas de Configuración cubiertas exactamente una vez (Categorías en Caja), nombres y conteos.
- `tests/admin-nav2.e2e.mjs` (**26** comprobaciones en Chromium real): se añadió Configuración (abrir, 8 elementos, Horario abre su panel, barra interna oculta, Caja › Categorías abre el panel de Configuración y resalta Caja, resaltado cuando otro código abre Seguridad). Capturas revisadas.
- **146** pruebas del despliegue + gastos (19) + Libro Contable (9) + botones (15) + saldos/días, en verde. No cambia ningún dato.

---
---

# PARTE 13 — Cálculos duplicados: constantes con una sola fuente, paridad de precios y lectura única del total (hecha)

## 54. Constantes de dinero: una sola fuente
Antes, el empaque del 2×1 ($2.000), el extra de combo ($7.000) y el valor del punto (10 COP) estaban **escritos a mano** en 2 o 3 archivos, con comentarios «SYNC» que apuntaban a **números de línea ya obsoletos**.
Ahora la **única fuente es `src/js/script-v2.js`**; en cada build `scripts/extract-agent-constants.js` las copia a `functions/agent/geofence-data.json` (de donde las lee `functions/pricing.js`) y sincroniza `PROMO_2X1_INCREMENTO_AMOUNT` dentro de `admin.js` (igual que ya se hacía con las zonas de domicilio). Valores sin cambio: 2000 · 7000 · 10 · domicilio base 6000.
Los 9 comentarios `SYNC: script-v2.js:NNNN` de `pricing.js` ahora nombran la **función** equivalente, y el servidor exporta sus ayudantes para la prueba de paridad.

## 55. Paridad de precios cliente ↔ servidor (nueva prueba, `tests/precios-paridad.test.js`, 10)
Carga las funciones **reales** del menú público y del servidor y exige que den **exactamente lo mismo**: `normalizeCategoryKey`, la tabla de combos con papas por imagen, las opciones de Entradas / Bebidas y adicionales / Burger clásicas / Salchipapa, y `resolveStaticOptionPrice` en **372 combinaciones** producto × categoría. Resultado: **idénticas**, con **una sola diferencia deliberada** (ENTRADAS sin ninguna opción: el cliente devuelve 0 y el servidor `null` = «no sé el piso», no recorta), que la prueba permite y limita. Si alguien cambia un precio en un lado y no en el otro, la prueba falla.

## 56. El total de un pedido, leído de una sola forma
Se midió con los **1.298 pedidos reales** (72 activos + 1.226 archivados): `getOrderDisplayTotal` y `Number(total||0)` dan **la misma suma, $63.998.200** (1 pedido sin total numérico, que da 0 en ambas). Con esa prueba en la mano, las 5 sumas del panel (Métricas POS, ticket promedio, ingresos, por teléfono, Hoy/Semana/Mes) pasaron a `getOrderDisplayTotal`. **Queda a propósito:** `_posAjustesResumen` (copia exacta de `functions/fodiAjustes.js`; la prueba `fodi-ajustes` las compara) y la cuenta de cobro (`Number(total)||Number(subtotal)`, para no alterar montos de cuentas ya emitidas).

## 57. Verificación
157 pruebas del despliegue (todas en verde) + menú (26) + gastos (19) + Libro Contable (9) + botones (15) + saldos/días. Foto del dinero **idéntica**. Las 4 pruebas `barrio-especial-fee` necesitan el emulador de Firestore (`PERMISSION_DENIED`, ya fallaban antes: ambientales, no de este cambio).

---
---

# PARTE 14 — Fase 5b: las familias de botones del resto del panel, unificadas por rol

## 58. Qué se hizo
Las familias más usadas (`section-action-btn` 30 en HTML + 51 en JS, `admin-button` 12, `section-save-btn`, `preview-refresh-btn`, `cat-new-save-btn`) tenían **cada una su forma**: píldora, rectángulo, tipografía Oswald en mayúsculas, verde, azul… Ahora comparten **un solo bloque de roles** (mismo radio 9 px, tipografía Space Grotesk 700, sin mayúsculas forzadas):
- **Secundario** (por defecto): Actualizar, Exportar, Limpiar, Unir duplicados, Importar…
- **Principal** (naranja): `+ Agregar cliente`, `+ Nuevo costo`, `Guardar`, `Crear producto`… (`.primary`, `.admin-button`, y el **«Guardar» que era verde**).
- **Delicado** (rojo): Cerrar caja (de la Fase 5).

## 59. Dos arreglos de fondo
- **Etiquetas que parecían botones:** «Clientes guardados en Firebase» y «Sincronizado en tiempo real» (×2) eran `<button disabled>`. Ahora son `status-chip` (punto verde, no clicables).
- **Campo blanco puro:** el % de «Margen mínimo» en Finanzas no tenía estilo y salía blanco (regla del dueño: nunca blanco puro). Ahora usa `admin-input`.
- «Importar» (índigo, rol aparte) pasó a secundario.

## 60. Verificación
Capturas de Clientes, Configuración, Finanzas y Cupones con los estilos reales; `tests/caja-presentacion.test.js` (10) vigila que no haya etiquetas disfrazadas de botón, que las familias compartan el bloque de roles y que ningún «guardar» sea verde. 160 pruebas del despliegue + navegador (menú 26, gastos 19, Libro Contable 9, botones 15) + saldos/días, todas en verde. Solo CSS/HTML: no toca datos.

## 61. Lo que sigue pendiente de la Fase 5
Los 6 modales con estructura propia (gasto, traslado, ajustar saldos, caja chica, abrir caja, categorías) y los botones con estilos pegados a mano dentro de plantillas JS (~79); un solo juego de íconos; formato de dinero del menú público y del agente.

---
---

# PARTE 15 — Fase 5c: ventanas de dinero con una sola estructura

## 62. Qué se hizo
**Traslado**, **Ajustar saldos**, **«La caja está cerrada»** y **«Gastos pendientes»** se construían cada una con ~12 estilos pegados a mano (anchos 360/380/440 px, paddings y botones de colores distintos: índigo, ámbar). Ahora comparten **una estructura**: `vd-overlay` (fondo) → `vd-card` (tarjeta de esquinas 20 px, fondo oscuro) → `vd-x` (×) → `vd-title` → `vd-text` → campos `vd-input` con su `vd-label` → botón de confirmar con el **rol principal (naranja)** y los secundarios en gris.
- Se conservan **todos los ids** (`trasladoFrom/To/Monto/ConfirmBtn/CloseBtn`, `ajusteSaldosClose/Confirm/Nota`, `data-ajuste-method`, `gcDesc/gcMonto`, `data-gc/data-gp`…): los manejadores y los cálculos no se tocaron.
- Traslado ahora explica en una línea que «el total no cambia: solo cambia dónde está». Los campos tienen su etiqueta asociada (clic en la etiqueta enfoca el campo).
- Los botones desactivados se ven desactivados (`opacity .5`) con una regla común, en vez de manejar la opacidad en JS.

## 63. Verificación
`tests/ventanas-dinero.e2e.mjs` (**24** comprobaciones en Chromium real con el **código real** de las 4 ventanas): estructura común, esquinas/fondo idénticos y sin estilos pegados, se cierran con × y tocando fuera, ids conservados, roles de botón, y el cálculo en vivo de «Ajustar saldos» (+$ 21.300 de ejemplo). Capturas revisadas. `tests/caja-presentacion.test.js` (11) vigila la estructura. 161 pruebas del despliegue + navegador (menú 26, gastos 19, Libro Contable 9, botones 15) + saldos/días, en verde. Foto del dinero **idéntica**.

## 64. Pendiente de la Fase 5
Los 3 modales de dinero con diseño propio de «pago» (**gasto** — 2 pasos, **caja chica** y **abrir caja**), ~79 botones con estilo en línea en plantillas JS, un solo juego de íconos, y el formato de dinero del menú público y del agente.

---
---

# PARTE 16 — Una sola cuenta de saldos (la última copia, eliminada)

## 65. El problema
El saldo por método se calculaba en **tres** lugares: el bucle del **Historial de Cajas**, `_computeHistoricoSumMethod` (la usan **Traslado** y **Ajustar saldos**) y el módulo puro `saldos.js` (solo vigilaba). Si una regla se cambiaba en una y no en las otras, la pantalla de cierres y la ventana donde se **escriben ajustes de dinero** podían discrepar.

## 66. Qué se hizo
- **`saldos.js` es ahora la única cuenta.** Dos opciones nuevas cubren los dos usos reales: `todosLosCierres` (para que un Historial filtrado por fechas no cuente dos veces un traslado ya horneado en un cierre) y `trasladosDesdeMsExcluidos` (el modal de Traslado ignora los de la jornada abierta, que ya cuentan en Caja de hoy).
- `_computeHistoricoSumMethod` (Traslado, Ajustar saldos) y `renderLibroCierres` (Historial) **delegan** en ella. El bucle del Historial solo agrupa los días para pintar; ya no suma saldos.
- **Si el módulo no carga, se falla en voz alta** («recarga la página») en lugar de mostrar saldos en cero: un ajuste hecho sobre ceros falsos habría escrito un dato incorrecto.
- El **filtro de fechas del Historial** (desde/hasta) usaba medianoche en la zona del navegador; ahora son días completos en hora de Colombia.
- El «candado en vivo» del Historial se quitó (ya no hay dos cuentas que comparar); el del **Libro Contable** sigue, porque esa pantalla suma por su cuenta.

## 67. Prueba de que NO cambió nada (la más fuerte hasta ahora)
- **Lo pintado por el Historial es byte a byte idéntico antes y después** (24.527 caracteres: historia completa + rango de agosto), con los 129 cierres y 824 movimientos reales, ejecutando el `renderLibroCierres` **real** en un navegador (`tests/historial-cierres.e2e.mjs`, 11 comprobaciones: tarjetas, pie TOTALES, orden de tarjetas, filtro por fechas).
- La función vieja y el módulo nuevo dan **lo mismo en 10 casos** (5 aperturas de caja × con/sin jornada abierta) con los 14 traslados reales.
- `saldos.test.js` (+4 casos de las opciones nuevas). Foto del dinero **idéntica**. 161 pruebas del despliegue + navegador (menú 26, gastos 19, Libro Contable 9, botones 15, ventanas 24, Historial 11), todas en verde.

## 68. Cálculos de dinero que quedan duplicados (conocidos y vigilados)
- **Libro Contable** suma por su cuenta (por días) y compara con `saldos.js` en vivo y en `tests/libro-contable.e2e.mjs`.
- **Caja de hoy** (`_cajaDiariaSumMethod`) calcula la jornada abierta: es otro concepto (aún no hay cierre), y se hornea en el cierre al cerrar.
- **Cuenta de cobro / conciliación bancaria**: copias SYNC con servidor y FODI, comparadas por sus propias pruebas.

---
---

# PARTE 17 — Fase 5d: los modales de pago (gasto, caja chica, abrir caja) alineados

## 69. Qué se hizo (sin tocar su lógica)
- **Registrar gasto** (2 pasos) y **Caja chica** se veían distintos (tarjeta con otro color, títulos en otra tipografía, botones en MAYÚSCULAS). Se alinearon con **solo CSS**: misma tarjeta oscura con borde, título Space Grotesk, **Cancelar** secundario y **Registrar gasto / Guardar** con el rol principal (naranja). El «Registrar gasto» **ya no es rojo** (era un estilo pegado a mano); el cobro del POS no se tocó.
- **Caja chica:** el botón «✕ Cerrar» (estilo de otra familia) pasó a la × común; el guardar es naranja principal.
- **Abrir caja:** pasó a `vd-overlay` / `vd-card`, la × común y los roles de botón (los dos botones dorado y verde con estilo en línea ahora son principal naranja / secundario gris). **Sigue sin cerrarse al tocar fuera** (a propósito: se está contando plata y un toque accidental no debe perder el conteo; solo la ×) y la prueba lo vigila.
- Todos los ids de botones y campos se conservaron: los manejadores y los cálculos no se tocaron.

## 70. Verificación
`tests/ventanas-dinero.e2e.mjs` ahora cubre **5 ventanas** (Traslado, Ajustar saldos, Abrir caja, Caja cerrada, Gastos pendientes) con **29** comprobaciones en Chromium real; capturas de Gasto, Caja chica y Abrir caja revisadas. `tests/caja-presentacion.test.js` (12). **162** pruebas del despliegue + navegador (menú 26, gastos 19, Libro Contable 9, botones 15, ventanas 29, Historial 11) + saldos/días, en verde. Foto del dinero **idéntica**.

## 71. Pendiente de la Fase 5
~79 botones con estilos en línea dentro de plantillas JS (lista de clientes, catálogo, tarjetas), un solo juego de íconos, y el formato de dinero del menú público y del agente.

---
---

# PARTE 18 — ☰ en cada tarjeta de pedido (acceso inmediato)

## 72. Qué se hizo
El menú ☰ «Acciones del pedido» solo existía dentro del ticket (había que seleccionar el pedido primero). Ahora **cada tarjeta lleva su ☰** (Domicilios, Para llevar y las mesas), con **el mismo menú**: mensajes al cliente (copiar / WhatsApp), agregar o editar productos, nombre, teléfono, dirección, cambiar cliente o mesa, **pedir domiciliario**, medio de pago, agregar contacto y cuenta de cobro.
- **Una sola definición de las acciones** (`buildOrderActionsMenuHtml`): el ticket y las tarjetas usan la misma función, así que no pueden diferir.
- **Compacto, sin montarse:** el ☰ (24 px) va en la fila del nombre y el total de la tarjeta (en el escritorio la cabecera de la tarjeta está oculta, así que no agrega una fila nueva); en la mesa ocupada va en la fila de iconos de la esquina. La prueba mide que queda dentro de la tarjeta y que no choca con el nombre ni el total.
- **El desplegable flota junto al botón** (no lo recorta la columna ni la tarjeta), se acomoda dentro de la pantalla (hacia arriba si abajo no cabe), se cierra con Escape, tocando fuera, al desplazar la lista o al tocar el mismo ☰.
- **Las ediciones se ejecutan con la lógica de siempre:** al elegir una, se selecciona ese pedido y se pulsa la misma opción del ticket (cero lógica de edición duplicada). Copiar mensaje y «Pedir domiciliario» funcionan igual que en el ticket. Tocar el ☰ **no** selecciona la tarjeta.
- Un mesero no ve el ☰ de pedidos ajenos.

## 73. Verificación
`tests/menu-tarjeta.e2e.mjs` (**22** comprobaciones en Chromium real con el código real de `createOrderCard`, del menú y del desplegable; estable en 3 corridas seguidas): ☰ en cada tarjeta, dentro y sin chocar, compacto, menú completo, dentro de la pantalla, no selecciona, Escape, editar productos y teléfono llegan al ticket con su campo, copiar mensaje, «Pedir domiciliario» solo en domicilios, «Cambiar mesa» solo en mesas. Capturas revisadas. No verificado con tu sesión real: la mesa ocupada del mapa (solo se comprobó su código) y el comportamiento en celular.

---
---

# PARTE 19 — «¿De dónde sale la plata?» al registrar un gasto

## 74. El problema (captura del dueño, 10-nov)
Se registró un gasto de $10.209 por **Bancolombia** y en Caja de hoy salió −$10.209 en esa columna **sin que hoy hubiera entrado nada por Bancolombia**. El formulario no decía de dónde salía esa plata. (Contablemente es correcto —el saldo de Bancolombia es lo de hoy más lo de días anteriores—, pero no se veía ni se avisaba.)
## 75. Qué se hizo
- Cada método del formulario muestra lo **disponible** (hoy + saldo de días anteriores), p. ej. «Bancolombia · Disp. $ 723.325».
- Al elegir método y monto aparece un aviso que **dice de dónde sale**: 💵 *de lo que entró hoy* (verde) · 📅 *mixto: una parte de hoy y el resto del saldo de días anteriores* (azul) · 📅 *«Hoy no ha entrado plata por Bancolombia: este gasto sale del saldo de días anteriores ($ 723.325)»* (azul) · ⚠️ *«No alcanza… quedaría en −$X»* (ámbar). También en pago dividido (una línea por método).
- Si **no alcanza**, antes de registrar se pide confirmación («El saldo no alcanza… ¿Registrar de todos modos?»).
- El gasto guarda **`origen`** (`hoy` / `mixto` / `saldo_anterior`) y `desdeSaldoAnterior` (y `saldoInsuficiente`): campos **solo informativos y nuevos**; el monto, el método, el tipo `caja` y todos los saldos son exactamente los de siempre.
- En **Caja de hoy**, la fila del gasto lleva la marca «📅 saldo anterior $X» cuando salió (en todo o en parte) del saldo de días anteriores.
- Los saldos se refrescan en segundo plano al abrir el formulario, para que «Disp.» y el aviso usen datos al día.
## 76. Verificación
`tests/gasto-origen.test.js` (9: el caso real, hoy alcanza, mixto, hoy en negativo, no alcanza, entradas raras, solo informativo, confirmación) y `tests/gasto-origen.e2e.mjs` (**11** en Chromium real con los números reales: hoy efectivo $19.000 / Bancolombia $0, saldo anterior efectivo $878.700 / Bancolombia $723.325). Capturas revisadas. Todas las pruebas del despliegue y de navegador en verde. No cambia ningún saldo ni total.

# Parte 20 — «¿Con qué se pagó?»: efectivo = cajón, cuentas = banco (Fase 7a)
Modelo tomado de Square, Toast y Loyverse: el cajón del turno maneja solo **efectivo** (se paga con la caja abierta); lo que sale del banco, Nequi o Bold se registra contra la **cuenta** en cualquier momento y no mueve el cajón.
- El formulario de gasto se abre aunque la caja esté cerrada. Métodos en dos grupos: «💵 Del cajón» y «🏦 Desde una cuenta».
- Caja cerrada → el efectivo se bloquea («Caja cerrada») y se ofrece «Dejar recordatorio»; las cuentas siguen disponibles.
- El tipo del gasto sale del método: efectivo → `caja` (entra al cierre); resto → `externo` (resta del saldo de esa cuenta). Pagos divididos: cada parte con su tipo.
- Al guardar se re-valida el efectivo contra la caja (por si se cerró desde otro equipo).
- Verificación: `gasto-origen.test.js` + `gastos-pendientes.test.js` (21), e2e gasto-origen (18), resto de e2e en verde. La foto del dinero solo difiere por un gasto real nuevo registrado en producción entre corridas; el código no altera saldos.
- Siguiente: Caja de hoy como turno de efectivo (efectivo esperado) y conteo al cierre con diferencia.

# Parte 21 — Turno de efectivo: esperado y conteo al cierre (Fase 7b)
- **Caja de hoy** muestra «💵 Efectivo que debe haber en el cajón» = fondo de apertura + efectivo neto de la jornada (ventas − gastos ± traslados). Lo digital se muestra aparte, como informativo.
- **Al confirmar el cierre** se pide contar el efectivo (se puede omitir). Se guarda en el cierre `efectivoEsperado`, `efectivoContado` y `diferenciaEfectivo` (negativo = faltó, positivo = sobró). Son campos nuevos: no cambian `methodTotals`, `grandTotal` ni ningún saldo.
- Verificación: `tests/efectivo-esperado.test.js` (5), `tests/efectivo-esperado.e2e.mjs` (8, Chromium), resto de e2e en verde; foto del dinero idéntica.
- Pendiente: mostrar la diferencia en el Historial de Cajas y en el ticket de cierre.
- (Parte 21, cierre) La diferencia del conteo ahora se ve en el ticket de cierre (vista previa y ESC/POS) y en el detalle del cierre del Historial de Cajas (esperado / contado / «Faltaron» o «Sobraron» o «Cuadra exacto»). Cierres sin conteo se ven igual que antes. Tests: `efectivo-esperado.test.js` (7).

# Parte 22 — Regla única de interfaz + Configuración compacta
- **Regla (bloque «REGLA ÚNICA DE INTERFAZ» en `admin.html`)**: un solo botón (alto 32 px, relleno 14, radio 9, Space Grotesk .8rem/700) para TODAS las familias (`informes-action-btn`, `section-action-btn`, `admin-button`, `ghost-button`, `biz-*`, `cat-new-save-btn`, `ticket-bt-btn`, y los de mesero/subcategoría en Configuración). El rol decide el color: secundario · principal (naranja) · delicado (rojo sólido) · peligro suave · discreto. Variables de espacio `--ui-gap 8`, `--ui-pad 14`, `--ui-sec 12`, `--ui-field-h 34`.
- **Vista**: tarjeta → encabezado → descripción corta (`.card-desc`) → campos en rejilla adaptable → acciones a la izquierda, nunca a todo el ancho.
- **Configuración** (9 pestañas): tarjetas de 14 px, campos de 34 px, secciones de 12 px, descripciones de 0.76rem; Negocio pasa de ~1000 a ~480 px de alto; el aviso vacío del horario ya no ocupa espacio; los botones «+ Agregar…» ya no ocupan todo el ancho.
- Se quitaron 20 botones con estilos en línea (relleno, tamaño, ancho) de `admin.js` y 6 párrafos con estilos en línea del HTML.
- Pruebas: `tests/regla-interfaz.test.js` (6) y `tests/regla-interfaz.e2e.mjs` (7, Chromium: 14 familias de botones miden y se ven igual). Herramienta `herramientas/captura-config.mjs` para capturar las pestañas.
- Pendiente de la regla: aplicar el mismo recorrido a las demás secciones (Catálogo, Clientes, Comunicación, Informes) y a los botones con estilos en línea restantes (~40).
- (Parte 22, ronda 2) La compactación de tarjetas (14 px), encabezados, descripciones y campos (34 px) ahora aplica a TODAS las secciones del admin, no solo a Configuración. Un solo tamaño pequeño de botón (`mini-btn`, `card-collapse-btn`: 24–26 px) para acciones dentro de tablas y listas; se quitaron los tamaños en línea de esos botones y los de la ventana del ticket de gasto pasaron a roles. Tests: `regla-interfaz.test.js` (9), `regla-interfaz.e2e.mjs` (9). Herramienta `herramientas/captura-tarjetas.mjs` para revisar tarjetas de todo el admin.
- Pendiente: botones con estilos en línea que son de layout (flex, márgenes) y las pantallas con diseño propio (POS, FODI flotante, cobro QR).

# Parte 23 — Configuración en modo lectura / edición
Patrón tomado de Stripe (botón «Editar» por sección), Square, Atlassian (inline edit: vista de lectura → edición) y PatternFly (Guardar o Cancelar devuelven a solo lectura).
- **Negocio** y **Horario** se abren BLOQUEADOS: valores como texto, vacío = «Sin definir», estado «🔒 Guardado» y un botón «✏️ Editar».
- Al editar: «Cancelar» (o Esc) descarta y «Guardar cambios» (deshabilitado hasta que haya un cambio) guarda; en ambos casos vuelve al modo guardado.
- Se retiró la barra flotante de «cambios sin guardar» de Negocio y el botón «Guardar horario» suelto.
- Función única `initFormBloqueado` (bloque `SYNC:form-bloqueado`) reutilizable para cualquier formulario futuro.
- Pruebas: `tests/form-bloqueado.e2e.mjs` (11, Chromium) + `regla-interfaz.test.js` (10).
- Pendiente: aplicar el mismo patrón a otros formularios fijos si el dueño lo pide (Seguridad, Menú público).
- (Parte 23, ronda 2) **Seguridad**: contraseña y PIN se ven como resumen («••••••••», «•••• (configurado)») con botón «Cambiar»; los campos aparecen solo al cambiar y se esconden y vacían al guardar, cancelar o Esc; el correo vinculado queda como texto. **Menú público**: la lista de botones va primero; el formulario aparece solo tras «+ Agregar botón» o «Editar» y se esconde al guardar o cancelar. Función `initSecCambiar` (`SYNC:sec-cambiar`). Tests: `seguridad-menu.e2e.mjs` (8) + `regla-interfaz.test.js` (11).

# Parte 24 — Corrección: tarjetas retraídas y listas de Configuración (ventanas medianas)
El dueño veía todo "gigante": su pantalla trabaja a ~1280 px CSS (zoom), donde las reglas de pantallas medianas del admin (`!important`) estiraban las filas. Causa: probé a 1440 px.
- Tarjeta retraída ("Desplegar"): de ~90 a ~42 px (relleno 8/14, sin márgenes ni espacio vacío).
- Filas de lista (Menú público y todo `.list-item` de Configuración): UNA fila de ~38 px con botones pequeños de 24 px a la derecha (antes: bloque de 3 líneas con botones a todo el ancho).
- Tarjetas de formas de pago, meseros y categorías de gastos: relleno 8–12, campos de 34 px.
- Pruebas en `regla-interfaz.e2e.mjs` ahora a 1280 px (fila ≤ 44, botón ≤ 26 de alto, tarjeta retraída ≤ 56). `herramientas/captura-config.mjs <carpeta> <ancho>` captura a cualquier ancho con filas de muestra.
- (Parte 24, ronda 2) Revisión de todas las tarjetas del admin a ~1180 px: se unificaron a la familia única los botones que seguían sueltos: Filtrar/Todo de Gastos, Cerrar y Eliminar de las campañas «Fuera del Menú», Guardar del margen mínimo, de «Editar campo del pedido» y de la configuración de adicionales. Test estático nuevo en `regla-interfaz.test.js` (12).

# Parte 25 — POS: tres tamaños de botón
El POS es táctil y de prisa, así que NO se encoge todo: la regla queda en **tres tamaños**: normal 32 px (todos los botones de texto), compacto 24 px (listas y tablas) y táctil (fichas de producto, «Nueva mesa / Para llevar / Domicilio» y las acciones sobre la tarjeta de un pedido: grandes a propósito).
- A la familia única pasaron los secundarios del POS: `ticket-action-btn` (con sus roles vista previa/anular/restaurar), `pos-note-cancel-btn`, `pos-note-save-btn` (principal naranja), `client-action-btn` y `cd-btn` (ventana de cobro).
- Se respetan las acciones sobre la tarjeta de un pedido (`order-action-btn`, ☰) y las fichas táctiles. Si el dueño quiere más compacto algo de ahí, decidirlo con el cajero real.
- Tests: `regla-interfaz.e2e.mjs` mide 19 familias; `regla-interfaz.test.js` (13).

# Parte 26 — Forma única (botones, pestañas, menús, animaciones) y auditoría de los dos cierres
**Cierres:** `herramientas/auditar-cierre.mjs <id>` (solo lectura) compara un cierre con sus pedidos uno por uno. Los dos que parecían descuadrados (jornadas con etiqueta 31-jul y 6-nov, en realidad 30-jul y 5-nov) **cuadran a $0**: la diferencia venía de comparar por la fecha UTC de la etiqueta, ya corregida (día = apertura, hora Bogotá). No queda ningún cierre descuadrado.
**Forma única:** antes había 15 radios distintos (0, 4, 6, 7, 8, 9, 10, 11, 12, 13, 14, 16, 20, 999 px y 50 %) y animaciones de 0,12 a 0,2 s. Ahora: radio 9 px para todo lo que se toca (botón, pestaña, filtro, icono) y 14 px para fichas grandes y tarjetas; píldoras y círculos solo en etiquetas de estado; una animación de 0,15 s con leve hundimiento al pulsar. Pestañas (`menu-inner-tab`, métricas, campañas, ticket, pedidos, filtros de fecha) y menú lateral con la misma tipografía (Space Grotesk, sin mayúsculas). Excepción: el FODI flotante (mascota). Verificado en Chromium: 324 botones a 9 px y 24 fichas a 14 px.

# Parte 27 — Márgenes: una escala
Medido antes: separación entre tarjetas de 0, 8 y 16 px (más un margen propio de 8 px sumado al `gap` de 14 px del panel → 22 px reales en Configuración); margen del título de 8 y 12 px; relleno de panel de 18/16 px.
Ahora (una sola escala 4 · 8 · 12 · 14 · 24): **12 px entre tarjetas**, puesto por el contenedor (`gap`) y nunca por el margen de la tarjeta; **14 px** de relleno en tarjetas y paneles; **8 px** entre título y contenido y entre filas de lista; 24 px entre bloques grandes. Probado en Chromium (`regla-interfaz.e2e.mjs`: 12 px entre tarjetas, panel 14, título 8).

# Parte 28 — Vista única (títulos, tablas, ventanas, etiquetas, campos)
Medido antes: títulos de tarjeta de 16 y 16,8 px; cabeceras de tabla con dos tipografías (una sin estilo, «Times New Roman»); ventanas con esquinas de 16, 18, 20, 22, 26 y 28 px y fondos de .65 a .88; etiquetas de estado con radios 8, 10, 20 y 999 px; campos con radios 0, 8, 9, 10 y 12 px.
Ahora: título de tarjeta Space Grotesk 1rem/700; tablas con la misma tipografía (cabecera .7rem en mayúsculas); todas las ventanas con radio 14 px y el mismo fondo oscuro (.72); una sola etiqueta de estado (píldora 999 px, .72rem); todos los campos de texto con radio 9 px; vacíos con el mismo color y centrado. Excepción: el login (fondo .88) y el FODI flotante. Probado en Chromium (`regla-interfaz.e2e.mjs`, 20 comprobaciones); `ventanas-dinero.e2e.mjs` actualizado a 14 px.

# Parte 29 — Estado vacío y menú lateral
- **Estado vacío**: había 13 clases distintas (`caja-empty`, `inbox-empty`, `met-empty-note`…) y 40 mensajes con estilos en línea, cada uno con su tamaño, color y relleno. Ahora todos son `.empty-state` (centrado, .85rem, color atenuado, 16 px de relleno); las clases viejas comparten la misma regla. El ticket impreso conserva sus estilos (se imprime sin hoja de estilos del admin).
- **Menú lateral**: la flecha queda siempre fija a la derecha y la insignia de pendientes a su izquierda y centrada (antes la flecha se movía según hubiera insignia); «Ir a público» pasó a ser un botón más de la familia (32 px, 9 px de radio) y se corrigieron las tildes de «Ir a público» y «Cerrar sesión».
- Tests: `regla-interfaz.e2e.mjs` (24) y `regla-interfaz.test.js` (18).

# Parte 30 — Configuración plana y FODI unificado
Con las capturas reales del dueño (≈1280 px, zoom): Configuración tenía una **tarjeta grande con tarjetas dentro** (`.menu-section-card` envolviendo los paneles) y una lista de títulos con «Desplegar» guardados como retraídos; el submenú lateral eran cajas pesadas.
- Se aplanó: el recuadro envolvente de Configuración e Informes queda transparente (solo las tarjetas de cada panel dan fondo); en Configuración **no hay Retraer/Desplegar** y todo se ve abierto (aunque venga guardado retraído).
- Submenú lateral: filas planas, sin cajas, el activo con barra naranja.
- **FODI**: ventanas (chat flotante, «Responder a un cliente», respuestas rápidas, decir en voz alta) con radio 14 px y el mismo fondo; botones y campo de escribir con radio 9 px (ya no redondos ni píldora), iconos de 40×40; enviar en el rol principal (naranja) y el resto secundarios; burbujas y tarjetas del asistente con 14 px. La mascota conserva su cara.
- Tests: `regla-interfaz.test.js` (20) y `regla-interfaz.e2e.mjs` (29).
- (Parte 30, ronda 2) `herramientas/captura-config-datos.mjs <carpeta> [ancho]` dibuja las listas de Configuración (formas de pago, barrios, meseros, categorías) con las funciones REALES del admin y datos de muestra. Con eso se vio y corrigió: títulos de fila en tres tipografías (Oswald, Roboto, Space Grotesk → una sola) y botones «+ Agregar» unos arriba en naranja y otros abajo en gris (todos en rol principal).

# Parte 31 — Lista de clientes en una línea y ventanas con scroll propio
- **Clientes**: cada cliente era una fila de ~300 px (11 columnas, textos en varias líneas y 5 botones apilados, con las acciones fuera de pantalla). Ahora es **una línea de 38 px**: Cliente (nombre + celular), Dirección (con «+N» si hay más), Última visita, Pedidos, Gasto total, Puntos, Último pedido y «Editar» + menú «⋯» (tarjeta de contacto, ajustar puntos, historial de ajustes, eliminar). El menú flota sin recortarse (se corrige el desfase que provoca el `backdrop-filter` de la tarjeta). Primera visita y puntos acumulados pasaron a texto emergente.
- **Ventana «Unir duplicados»**: no tenía alto máximo ni desplazamiento propio, y la rueda movía la página de atrás. Ahora su lista se desplaza por dentro (`cxc-cuerpo`), la caja cabe en pantalla y, con una ventana abierta, la página no se mueve (`body:has(.pos-note-modal-overlay)`, `overscroll-behavior: contain`).
- Tests: `tests/clientes-linea.e2e.mjs` (9, con la función real `renderClients`).

# Parte 32 — «Unir todos» los clientes repetidos
Unir duplicados era de uno en uno (cada unión espera al servidor). Ahora la ventana tiene **«🧩 Unir todos (N grupos)»**: pide una confirmación con el conteo (por mismo teléfono / «posibles» por mismo nombre y cuántas fichas se borran) y une todo; en cada grupo la **base es la ficha con MÁS pedidos** (desempata: celular canónico, luego más puntos). Los grupos van de a 4 en paralelo y, dentro de un grupo, una unión tras otra; muestra «Uniendo 3 de 25…»; si un grupo falla, los demás siguen y el fallo se avisa (queda en la lista). No cambia la función del servidor (`adminUnirClientes`), así que no requiere desplegar functions. Tests: `tests/unir-todos.test.js` (6).
- (Parte 32, ajuste) Por indicación del dueño la ventana de unir clientes trabaja **solo por número de teléfono**: los grupos «mismo nombre, otro teléfono» ya no aparecen ni se unen (`_gruposPorTelefono`). La detección por nombre sigue existiendo en `_clientesDuplicados` pero la ventana la filtra.
- (Parte 31, ajuste) Clientes: la lista salía vacía con el mensaje «No hay clientes que coincidan» aunque la base tiene 4.681 clientes (verificado en Firestore: datos íntegros, 3 grupos unidos por teléfono). Una carga que falla no dejaba rastro. Ahora la lista distingue «⏳ Cargando clientes…», «⚠️ No se pudieron cargar los clientes (<código>: <motivo>) [Reintentar]» y «No hay clientes que coincidan» (sin coincidencias reales). Test en `clientes-linea.e2e.mjs` (12). Causa de fondo de la carga fallida: por confirmar con el mensaje que muestre.
- (Parte 31, causa probable) Con la persistencia local de Firestore activada (`enablePersistence`), `get()` sin `source` devuelve EN SILENCIO la copia local si la conexión al servidor falla: una copia vacía = lista de clientes vacía sin error (la consola del dueño no mostró errores de Firestore). Ahora la carga de clientes usa `get({ source: 'server' })`: o llega del servidor o falla con un mensaje visible y «Reintentar». El dueño no puede escribir en la consola del navegador, así que el diagnóstico va dentro de la propia aplicación.

# Parte 33 — Filtros y órdenes de la lista de clientes
Fila de chips sobre la lista (un solo filtro activo, combinado con la búsqueda, y la exportación «Solo filtrados» usa la misma lista): **Todos · 🆕 Últimos registrados · 🕒 Compraron hace poco · 🏆 Más compras (desempata por gasto) · 💰 Más gasto · ⭐ Más puntos · 1️⃣ Una sola compra · 🔁 Recurrentes (3 o más) · 😴 Inactivos (+30 días) · 🚫 Sin compras**. Los filtros muestran cuántos clientes hay en cada uno. Lógica pura en `clientesAplicarFiltro` (`SYNC:clientes-filtros`). Tests: `tests/clientes-filtros.test.js` (11) y `clientes-linea.e2e.mjs` (16, con el código real). El tooltip de «Unir duplicados» ahora dice «mismo número de teléfono».
