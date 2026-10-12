# Diseño: migrar `cierres_caja` / `gastos_caja` / `admin_estado` a Cloud Functions callable

**Estado:** propuesta para revisión. Cero código de implementación todavía.
**Patrón de referencia:** `submitPublicOrder` (`functions/index.js` + `functions/pricing.js`) para el
shape general de la función callable, y `adjustLoyaltyPointsTransaction` (`functions/index.js:1861`)
para el patrón exacto de "leer dentro de la transacción + escribir el cambio + escribir su propio
registro de auditoría en la misma transacción" — es el análogo más cercano que ya existe en este
mismo repo a lo que necesita `ajustarSaldo`.

---

## 0. Corrección de alcance encontrada durante el diseño

El punto 6 del encargo dice "admin_estado" pierde `write: if isAdmin()`. Verifiqué exactamente qué
documento gatea "hay una jornada abierta" y **no es un documento de `admin_estado`**:

```js
// src/js/admin.js:206
const CAJA_ESTADO_DOC_ID = 'estado_caja';
// src/js/admin.js:21676
await firebaseDb.collection(CONFIG_COLLECTION).doc(CAJA_ESTADO_DOC_ID)   // CONFIG_COLLECTION = 'configuracion'
    .set({ aperturaAt: ts, ...extra }, { merge: true });
```

`aperturaAt` / `aperturaBy` / `fondoInicial` / `cerrada` viven en **`configuracion/estado_caja`**,
no en `admin_estado`. `admin_estado` sí existe y tiene dos documentos reales (los leí en la
auditoría anterior):

- `admin_estado/jornada_ventas_actual` — el estado del banner (`openedAt`/`status`/`lastClosedAt`).
  **Sí** lo escribe `cerrarCaja` hoy y **sí** debe pasar a `write: false`.
- `admin_estado/caja_chica_actual` — el conteo de billetes/monedas en vivo (el que arreglé ayer
  por el bug del tabulador). No tiene ningún invariante financiero que proteger — es un borrador de
  conteo físico que el cajero edita en tiempo real, y su valor solo se **lee** como insumo cuando
  `abrirCaja`/`ajustarSaldo` corren (la función lo vuelve a leer de Firestore, nunca confía en lo
  que el cliente diga que contó). Recomiendo **dejarlo como está** (`isAdmin()` write) — bloquearlo
  obligaría a que cada tecla del conteo pase por una Cloud Function, matando la UX que se acaba de
  arreglar, sin ganar ninguna protección real.

Esto cambia el diff de reglas: **`configuracion/estado_caja` necesita su propio bloque `match`**,
con el mismo patrón que ya existe en el archivo para `configuracion/supervisor_pin` (exclusión
explícita del wildcard `configuracion/{doc}`, porque las reglas de Firestore son aditivas). Lo
muestro completo en la sección 6.

---

## 1. `abrirCaja`

```js
exports.abrirCaja = onCall({ region: 'us-central1', cors: ALLOWED_ORIGINS }, async (request) => {
```

**Input:** `{ nombre: string, fondoInicial: number }`
**Output:** `{ aperturaAt: number }` (epoch ms, para que el cliente no tenga que esperar el `onSnapshot`)

**Validación de entrada:**
- `request.auth?.uid` existe y `admins/{uid}` existe (mismo `requireAdmin` que `adminAdjustLoyaltyPoints:1900-1907` — lo extraigo a un helper compartido, no lo repito 4 veces).
- `nombre`: string no vacía, ≤ 120 caracteres (misma cota que ya usa `pedidos.customerName` en las rules). Mayúscula por palabra server-side también (barato, y así el dato queda bien aunque alguien llame la función sin pasar por el modal).
- `fondoInicial`: número finito ≥ 0.

**Invariante (dentro de `runTransaction`):**
1. Lee `configuracion/estado_caja`.
2. Si el doc existe y `cerrada === false` → `HttpsError('failed-precondition', 'Ya hay una jornada abierta.')`. Esto es lo que cierra la carrera real: dos dispositivos que abren caja casi al mismo tiempo — el segundo pierde, con un mensaje claro, en vez de pisar silenciosamente al primero.
3. Si pasa: `transaction.set('configuracion/estado_caja', { aperturaAt: FieldValue.serverTimestamp(), aperturaBy: nombre, aperturaByUid: request.auth.uid, fondoInicial, cerrada: false }, { merge: true })`.
4. `transaction.set('admin_estado/jornada_ventas_actual', { openedAt: FieldValue.serverTimestamp(), status: 'active' }, { merge: true })`.

**Sobre `aperturaBy` vs. `aperturaByUid` — una distinción que hay que mantener, no fusionar:**
`aperturaBy` (el nombre que escribe el cajero, con el autocompletado que ya existe) sigue siendo
texto libre — es el nombre que sale en el ticket impreso, y no hay forma de que deje de serlo sin
romper la UX de ayer. `aperturaByUid` es el campo NUEVO, y es el único con valor de auditoría real:
sale exclusivamente de `request.auth.uid`, nunca de `request.data`.

**Aviso importante, no un detalle menor:** si Iliana y el dueño usan **la misma cuenta de Firebase Auth**
para entrar al panel (un solo login compartido), `aperturaByUid` va a ser idéntico sin importar quién
esté al mando — no distingue mejor que el campo de texto libre. La protección real de "quién hizo
qué" que pide el punto 3 del encargo solo funciona si cada persona que opera caja tiene su **propia**
cuenta. Antes de invertir en esto vale la pena confirmar: ¿hay una cuenta de Firebase Auth por
persona, o se comparte una sola? Si se comparte, sugiero agregarlo como tarea complementaria (no
bloqueante para esta migración).

---

## 2. `registrarGasto`

```js
exports.registrarGasto = onCall({ region: 'us-central1', cors: ALLOWED_ORIGINS }, async (request) => {
```

**Input:** `{ categoria, subcategoria, descripcion, monto, paymentMethod, tipo: 'caja' | 'externo' }`
**Output:** `{ gastoId }`

**Hallazgo mientras diseñaba esto, no pedido pero relevante:** hoy `saveGasto()` (`admin.js:20560`)
es un `.set()` sin ninguna validación de servidor. Un `monto` negativo se guarda igual — un gasto
negativo es, en la práctica, un ingreso encubierto. Esto no es solo un problema de "falta
transacción", es una ventana de fraude real que esta migración cierra gratis con solo validar.

**Validación de entrada:**
- `requireAdmin`.
- `monto`: número finito, **estrictamente > 0**. Rechaza NaN, negativos, cero.
- `categoria`/`descripcion`: strings, longitudes razonables (≤ 120 / ≤ 200).
- `paymentMethod`: debe existir en la lista real de métodos configurados (lee `configuracion/payment_methods`
  server-side) **o** ser el literal `'otro'`. No confía en que el cliente mande un id válido.
- `tipo`: solo acepta `'caja'` o `'externo'` — **nunca** `'ajuste'` ni `'traslado'` (esos tienen sus
  propias funciones). Esto cierra otra cosa que hoy es posible: nada impide hoy que el cliente llame
  `saveGasto({tipo:'ajuste', ...})` a mano sin pasar por el modal de Ajustar Saldos.

**Invariante:**
- Si `tipo === 'caja'`: lee `configuracion/estado_caja` — debe existir y `cerrada === false`, si no
  → `failed-precondition`, "No hay una jornada abierta." `cajaAperturaAt` sale de ese documento leído
  en el servidor, **no** del valor que el cliente ya manda hoy (`cajaAperturaAt: cajaAperturaAt || 0`,
  que es puro dato del cliente sin verificar).
- Si `tipo === 'externo'`: sin este requisito, igual que hoy.

**Escritura:** `db.collection('gastos_caja').doc().set({ ...datos validados, tipo, cajaAperturaAt (si aplica), creadoPor: request.auth.uid, registradoAt: FieldValue.serverTimestamp() })`. No necesita transacción por sí sola — es un documento nuevo, sin lectura-antes-de-escribir que proteger — **salvo que se adopte la recomendación de saldo corriente de la sección 7**, en cuyo caso sí pasa a estar dentro de una transacción (incrementa el saldo corriente en el mismo commit).

**Pregunta abierta, no la resolví por mi cuenta:** ¿debería `registrarGasto` rechazar un gasto que
deja el saldo del método en negativo? Hoy el modal de Traslado sí valida saldo disponible antes de
mover plata; el de Gastos, no — es inconsistente. Bloquearlo con más rigor tiene un costo: si el
sistema calculó mal el saldo (como pasó la semana pasada) y la plata física sí está, un bloqueo
duro te impide registrar el gasto real hasta arreglar el cálculo. Lo dejo como decisión tuya, no
como parte "obvia" del diseño.

---

## 3. `cerrarCaja`

```js
exports.cerrarCaja = onCall({ region: 'us-central1', cors: ALLOWED_ORIGINS }, async (request) => {
```

**Input:** `{}` — deliberadamente vacío. Ningún número que hoy calcula el navegador (`ingresosMethod`,
`gastosTotal`, `grandTotal`...) se le vuelve a confiar al cliente. Todo se recalcula del lado del
servidor contra `pedidos` y `gastos_caja` reales.
**Output:** `{ closureId, closureDoc }` — el cierre real ya guardado, para que el cliente imprima el
ticket con los números que de verdad quedaron grabados (no con su propia cuenta previa).

Esto es el cambio más grande de los cuatro: hoy `cerrarCaja()` en `admin.js` **es** el cálculo
completo (líneas 22155-22300, filtra `ordersState` en memoria del navegador, suma, arma `methodTotals`).
Ese cálculo se porta a una función compartida en el backend — sugiero `functions/caja.js`, con el
mismo rol que `functions/pricing.js` tiene para pedidos — para no reescribir la lógica de negocio
desde cero (el riesgo real de "inventar un patrón nuevo" no es la forma de la función, es reescribir
mal la aritmética que ya funciona).

**Invariante y transacción:**
1. `requireAdmin`.
2. **Fuera** de la transacción (lectura no transaccional, para no encarecer/contender la transacción
   con cientos de documentos): consulta `pedidos` con `paidAt >= aperturaAt` (leído de
   `configuracion/estado_caja`, no del cliente) más el resto de la lógica de `isOrderPaid` / filtro
   de anulados, y `gastos_caja` con `tipo == 'caja'` de esa misma jornada. Con esto arma el mismo
   `closureDoc` que arma hoy el navegador.
3. **Dentro** de `runTransaction`:
   - Vuelve a leer `configuracion/estado_caja`: si `cerrada !== false` → `failed-precondition`,
     "No hay una jornada abierta para cerrar." (protege contra la carrera: alguien más ya cerró
     entre el paso 2 y este).
   - `closureId = 'cierre_' + todayStr` (**sin** el sufijo `_${Date.now()}` que tiene hoy — ese
     sufijo es justo lo que permitía que dos cierres del mismo día coexistieran como documentos
     distintos, duplicando esa jornada en todos los reportes).
   - `transaction.get('cierres_caja/' + closureId)`: si existe → `HttpsError('already-exists', 'Ya existe un cierre para hoy (' + todayStr + ').')`. Esta es la protección explícita contra doble cierre que pide el punto 4.
   - `transaction.create('cierres_caja/' + closureId, { ...closureDoc, cerradoPor: request.auth.uid, status: 'cerrado' })` — uso `create()`, no `set()`: si por una carrera extrema el `get()` de arriba y el `create()` cayeran en lados distintos de otra transacción concurrente, `create()` sigue rechazando el duplicado a nivel de Firestore, no solo a nivel de mi propio chequeo.
   - `transaction.set('configuracion/estado_caja', { aperturaAt: null, aperturaBy: '', fondoInicial: 0, cerrada: true }, { merge: true })`.
   - `transaction.set('admin_estado/jornada_ventas_actual', { openedAt: null, status: 'idle', lastClosedAt: FieldValue.serverTimestamp(), lastClosureId: closureId }, { merge: true })`.
   - Si aplica el gasto automático de domicilios: hoy se escribe con un `saveGasto()` **aparte**, antes del `.set(closureDoc)`, sin transacción — un fallo entre esos dos pasos deja domicilios cobrado pero sin cierre, o viceversa. Lo meto dentro de la misma transacción (`transaction.set('gastos_caja/gasto_domicilios_' + closureId, {...})`), así los dos casos de "quedó a medias" que existen hoy desaparecen solos.

**Cambio de comportamiento que señalo explícitamente, no lo decido por mi cuenta:** hoy, si no hubo
ningún cobro en la jornada, `cerrarCaja()` **no crea ningún documento de cierre** — solo resetea el
estado (rama "sin ventas" en `admin.js:22173-22194`). Eso deja un hueco de auditoría: se puede abrir
y "cerrar y resetear" una jornada vacía cuantas veces se quiera, sin ningún rastro de cuándo pasó.
Propongo que `cerrarCaja` **siempre** cree un `cierre_YYYY-MM-DD`, incluso con `transactionCount: 0`
y todos los montos en cero — coherente con el punto 5 (append-only real). Si prefieres mantener el
comportamiento actual (sin cierre cuando no hubo ventas), dímelo y lo dejo así.

**Sobre la vista previa (el ticket que se muestra antes de confirmar):** hoy es dos pasos —
`cerrarCaja()` arma un preview local y `cierreCajaConfirmBtn` confirma y escribe. Propongo mantener
el preview **en el cliente**, sin tocarlo — es solo para que el cajero revise antes de confirmar, no
tiene valor de verdad hasta que el servidor lo procesa. Lo que sí cambia: el ticket que se **imprime**
debe construirse con el `closureDoc` que devuelve la función, no con el cálculo previo del navegador
— si algo se cobró en los segundos entre "Cerrar Caja" y "Confirmar", el número real (el del
servidor) es el que debe quedar impreso.

---

## 4. `ajustarSaldo` — unifica dos funcionalidades de hoy en una sola

El encargo pide convertir "Ajustar saldos" y además rediseñar `openCierreGastoModal` (el "🧾
Registrar Gasto" sobre un cierre ya cerrado) para que deje de reescribirlo. Encontré que la forma
más limpia de hacer ambas cosas es la misma que ya sugiere el punto 5: **unificarlas en una sola
función**, porque un "gasto registrado sobre un cierre cerrado" y un "ajuste de saldo" son
exactamente el mismo tipo de operación (un movimiento que corrige el saldo sin ser ni venta ni gasto
operativo del día) una vez que se les quita la costumbre de reescribir el cierre original.

```js
exports.ajustarSaldo = onCall({ region: 'us-central1', cors: ALLOWED_ORIGINS }, async (request) => {
```

**Input:** `{ porMetodo: { [methodId]: number }, nota?: string, cierreId?: string }`
**Output:** `{ ajusteId }`

**Validación:**
- `requireAdmin`.
- `porMetodo`: objeto con al menos una clave, cada clave debe ser un método de pago real configurado
  o `'otro'`, cada valor un número finito distinto de cero.
- `nota`: opcional, ≤ 200 caracteres.
- `cierreId` (opcional — presente cuando viene del flujo "Registrar Gasto sobre un cierre"): si se
  manda, `cierres_caja/{cierreId}` debe existir y tener `status === 'cerrado'`, si no →
  `not-found`/`failed-precondition`.

**Hallazgo sobre mi propio diseño anterior, autocrítica honesta:** el `ajustarSaldo` que ya existe
hoy en `admin.js` (`openAjusteSaldosModal`, que yo mismo diseñé hace dos días) tiene el mismo defecto
que esta tarea está corrigiendo en todo lo demás: `creadoPor` sale de
`firebase.auth().currentUser?.email` **leído y enviado por el cliente**, no verificado por el
servidor. Un cliente manipulado podría mandar cualquier email ahí. Esta migración lo cierra: `creadoPor`
pasa a salir siempre de `request.auth.uid`, igual que el resto.

**Bug real que encontré revisando `openCierreGastoModal` para este rediseño — hay que corregirlo, no
solo "quitar el `.update()`":** el gasto que esa función crea hoy **no tiene campo `tipo`**:
```js
// admin.js:23953-23964 — SIN tipo:
const gastoDoc = { id: gastoId, categoria: 'otros', subcategoria: 'Gasto de caja', proveedor: '',
    descripcion: desc, monto, paymentMethod: method, registradoAt: firestoreNow(),
    cierreId: cierre.id, cajaAperturaAt: cierre.cajaAperturaAt || 0 };
```
`_splitGastosDeJornada()` (lo que decide qué gastos "cuentan") filtra por `tipo === 'externo'` para
excluir, y por `cajaAperturaAt` para lo demás — un documento sin `tipo` y con un `cajaAperturaAt` de
una jornada ya cerrada hace rato **no calza en ningún filtro de agregación**. Hoy ese gasto solo
"existe" contablemente porque además reescribe el cierre a mano. **Si simplemente se quita el
`.update()` sin arreglar esto, el gasto post-cierre desaparece de todos los totales** — sería una
regresión real, no una limpieza. La corrección: el nuevo doc que crea `ajustarSaldo` lleva siempre
`tipo: 'ajuste'`, exactamente como ya funciona hoy para los ajustes de saldo generales — así entra
por el mismo camino de agregación que ya está probado (`_ajustesSaldoState`, sumado en
`_computeHistoricoSumMethod` y en las tarjetas de Historial).

**Escritura (sin necesidad de transacción salvo por la sección 7):**
```js
db.collection('gastos_caja').doc('ajuste_' + Date.now()).set({
    tipo: 'ajuste',
    monto: 0,
    porMetodo,
    saldoAntes,   // ver nota abajo
    saldoDespues, // ver nota abajo
    nota: nota || '',
    cierreId: cierreId || null,
    creadoPor: request.auth.uid,
    registradoAt: FieldValue.serverTimestamp(),
});
```

**Sobre `saldoAntes`/`saldoDespues` — el punto donde este diseño se topa con el límite de la
arquitectura actual:** hoy esos dos campos se calculan en el navegador llamando
`_computeHistoricoSumMethod()`, que suma **toda** la colección `gastos_caja` (el mismo patrón que
causó el bug del `limit(500)`). Moverlo al servidor sin cambiar nada más significa que `ajustarSaldo`
tendría que hacer esa misma suma completa, cada vez, dentro de la función — correcto (ya no confía en
el cliente), pero no barato, y no resuelve el problema estructural de fondo. Ver sección 7: esto es
exactamente el caso que motiva la recomendación de un saldo corriente mantenido con
`FieldValue.increment()`.

**`cierres_caja` nunca se toca desde aquí.** Punto 5 cumplido para las dos funcionalidades de origen.

---

## 5. `cierres_caja` append-only — confirmación del alcance

Con las cuatro funciones arriba:
- El único `create` sobre `cierres_caja` es `cerrarCaja`, con ID determinístico, protegido contra
  duplicado.
- Ningún `update` sobre `cierres_caja` queda en ningún camino — `ajustarSaldo` (que absorbe lo que
  hacía `openCierreGastoModal`) solo lee `cierres_caja` para validar que `cierreId` existe, nunca
  escribe ahí.
- Las reglas lo hacen cumplir además de la disciplina del código: `write: if false` en la sección 6.

---

## 6. Diff conceptual de `firestore.rules`

```diff
+    match /configuracion/estado_caja {
+      // Antes vivía bajo el wildcard /configuracion/{doc} de abajo (lectura publica, escritura
+      // isAdmin()). Se restringe la lectura a isAdmin() porque expone quien tiene la caja abierta
+      // y el fondo inicial; la escritura pasa a ser exclusiva de abrirCaja/cerrarCaja (Admin SDK).
+      allow read: if isAdmin();
+      allow write: if false;
+    }
     match /configuracion/{doc} {
-      allow read: if doc != 'supervisor_pin';
+      // Mismo patron aditivo que ya exige supervisor_pin: un match especifico no revoca lo que
+      // concede el wildcard, asi que estado_caja tiene que excluirse aca tambien.
+      allow read: if doc != 'supervisor_pin' && doc != 'estado_caja';
       allow write: if isAdmin();
     }

     match /admin_estado/{doc} {
-      allow read, write: if isAdmin();
+      // caja_chica_actual (conteo de billetes/monedas en vivo) sigue editable a mano -- no protege
+      // ningun invariante financiero, y las funciones lo vuelven a leer de Firestore como insumo,
+      // nunca confian en lo que el cliente diga que contó.
+      allow read: if isAdmin();
+      allow write: if isAdmin();
     }
+    match /admin_estado/jornada_ventas_actual {
+      allow read: if isAdmin();
+      allow write: if false; // exclusivo de abrirCaja/cerrarCaja
+    }

     match /cierres_caja/{doc} {
-      allow read, write: if isAdmin();
+      allow read: if isAdmin();
+      allow write: if false; // exclusivo de cerrarCaja (create) — append-only real
     }

     match /gastos_caja/{doc} {
-      allow read, write: if isAdmin();
+      allow read: if isAdmin();
+      allow write: if false; // exclusivo de registrarGasto / ajustarSaldo
     }
```

Nota sobre el orden: en el archivo real, `match /admin_estado/jornada_ventas_actual` debe declararse
**antes** de `match /admin_estado/{doc}` para que la lectura sea consistente con el patrón de
`supervisor_pin` (aunque en Firestore rules el orden de declaración no afecta la evaluación —son
aditivas siempre—, mantengo el mismo orden que usa el archivo hoy por legibilidad).

---

## 7. Recomendación adicional — no pedida, pero surge directo de este mismo diseño

Cada una de las cuatro funciones, al no tener un saldo corriente que consultar, o (a) confía en la
suma completa del cliente (lo que ya falló una vez) o (b) tiene que sumar la colección entera del
lado del servidor cada vez que necesita saber "cuánto hay en Efectivo ahora" (`ajustarSaldo`, y
cualquier validación de saldo insuficiente que se le quiera agregar a `registrarGasto`).

El propio código ya resuelve exactamente este problema para puntos de lealtad, con la misma
herramienta: `FieldValue.increment()` sobre un documento de saldo (`clientes/{id}.puntosDisponibles`).
Propongo el mismo patrón para caja: un documento `admin_estado/saldos_actuales` con
`{ efectivo: N, bancolombia: N, nequi: N, otro: N }`, mantenido **exclusivamente** vía
`FieldValue.increment()` dentro de la transacción de cada una de las cuatro funciones (cada `create`/
`set` de un movimiento va acompañado de un `increment()` sobre el método correspondiente, en el mismo
commit atómico). Con esto:

- `ajustarSaldo` deja de necesitar sumar la colección completa para saber `saldoAntes` — es una
  lectura de un documento.
- El modal de Traslado (no incluido en esta tarea, ver más abajo) podría validar saldo disponible
  con una lectura barata en vez de `_historicoSumMethod` + `_cajaDiariaSumMethod` calculados en el
  cliente.
- Estructuralmente, deja de ser posible que un límite de consulta (como el `limit(500)` que causó el
  incidente) vuelva a desalinear un saldo, porque el saldo ya no se recalcula sumando documentos —
  se mantiene solo.

Esto es una ampliación real del alcance, no un simple detalle de implementación — lo marco aparte a
propósito para que se decida por separado, no como parte implícita de las 4 funciones pedidas.

---

## 8. Fuera de alcance en esta pasada (para que no se pierda de vista)

**Traslado entre métodos** (`openTrasladoModal`, hoy `admin.js:20770-20820`, también sobre
`gastos_caja` con `tipo:'traslado'`) tiene exactamente el mismo perfil de riesgo que las cuatro
funciones de arriba — `.set()`/`.update()` sin transacción, sin `creadoPor` verificado — pero no
estaba en la lista de esta tarea, así que no lo diseño en detalle acá. Cuando se aborde, es
`trasladarSaldo({ methodFrom, methodTo, monto })`, mismo patrón exacto que `ajustarSaldo`
(un solo movimiento append-only, `porMetodo: {[from]: -monto, [to]: +monto}` — de hecho, con la
recomendación de la sección 7, `trasladarSaldo` podría ser literalmente un caso particular de
`ajustarSaldo` con dos entradas en `porMetodo` en vez de una).

---

## 9. Plan de despliegue — esto es dinero real en uso diario, no se puede desplegar de un tiro

1. **Escribir y desplegar las 4 Cloud Functions**, sin tocar `firestore.rules` todavía. El código
   viejo de `admin.js` sigue escribiendo directo, sin interrupción — las funciones nuevas existen
   pero nada las llama aún.
2. **Actualizar `admin.js`** para llamar a las 4 funciones en vez de escribir directo, desplegar el
   cliente. Las reglas *siguen* permitiendo escritura directa como red de seguridad temporal — si algo
   sale mal con las funciones, no se cae el POS.
3. Verificar en producción con uso real (abrir caja, registrar un gasto, cerrar caja) que los números
   coinciden con lo que salía antes, el ticket imprime igual, nada se rompió.
4. **Recién ahí**, cambiar `firestore.rules` a `write: if false` para las tres colecciones. Este paso
   sí es de un solo sentido — hacerlo en un momento de poco movimiento (justo después de un cierre,
   antes de abrir la siguiente jornada), y probar de inmediato: abrir caja, un gasto de prueba,
   cerrar. Una pestaña vieja sin refrescar, corriendo el `admin.js` anterior, empezará a fallar en
   ese momento — vale la pena avisar a quien esté de turno.

Nada de este documento se implementó. Es la propuesta completa, lista para tu revisión.
