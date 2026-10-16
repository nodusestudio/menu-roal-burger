'use strict';
// Conocimiento académico de FODI por áreas. No se inyecta todo: `seleccionar` carga solo las áreas
// que la conversación toca (palabras clave), para no gastar tokens. Son marcos y criterios de consultoría,
// NO datos del negocio (esos salen de las herramientas). Lo legal/tributario es orientación: verificar con contador.

const AREAS = {
    gerencia: {
        titulo: 'Gerencia y estrategia',
        claves: /estrategi|competen|porter|okr|objetivo|meta|visi[oó]n|misi[oó]n|dofa|foda|swot|balanced|indicador|kpi|crecer|crecimiento|expandi|sucursal|franquicia|decisi[oó]n|prioridad|plan de negocio|modelo de negocio|canvas|propuesta de valor/i,
        texto: `- DOFA: cruza fortalezas/debilidades internas con oportunidades/amenazas externas y saca ACCIONES (FO: usar fortaleza para oportunidad; DA: defenderse). Una lista sin acciones no sirve.
- 5 fuerzas de Porter (restaurante): rivalidad (otras hamburgueserías y dark kitchens), nuevos entrantes (barrera baja), poder de proveedores (carne, pan), poder del cliente (cambia por precio/promos), sustitutos (pizza, pollo, comida casera). Diferenciarse = receta, velocidad, marca, experiencia, no solo precio.
- Propuesta de valor: qué problema resuelve y por qué elegirnos; si no cabe en una frase, no está clara.
- OKR: 1 objetivo cualitativo + 2-4 resultados clave medibles por trimestre (ej. "subir recompra": clientes con 2+ pedidos 35%→45%). Pocos y medibles.
- Balanced Scorecard: financiero (margen, ventas), cliente (recompra, reseñas), procesos (tiempo de entrega, mermas), aprendizaje (capacitación, rotación). Equilibrar los cuatro.
- Matriz de Eisenhower/Pareto: el 20% de causas explica ~80% del resultado (productos, clientes, costos); gerenciar primero lo importante, no lo urgente.
- Matriz de Ansoff para crecer: penetrar (más ventas a los mismos clientes con el mismo producto), nuevo mercado (otra zona), nuevo producto (línea nueva), diversificar (más riesgo). Empezar por penetración.
- Decidir con datos: define la métrica antes del cambio, prueba pequeño (piloto 2-4 semanas), compara contra el periodo anterior, y decide. Pocos datos = advertirlo.`
    },
    marketing: {
        titulo: 'Marketing',
        claves: /marketing|publicidad|campa[ñn]a|promoci[oó]n|promo|descuento|cup[oó]n|c[oó]digo del d[ií]a|redes|instagram|facebook|tiktok|whatsapp|contenido|historia|reel|seguidor|alcance|engagement|anuncio|ads|pauta|marca|branding|embudo|cac|ltv|fideli|recompra|influenc|rese[ñn]a|precio|combo|upsell|ticket/i,
        texto: `- Mezcla 4P/7P: producto, precio, plaza (domicilio/local/web), promoción + personas, procesos, evidencia física (empaque, ticket, fotos).
- Embudo: atención (alcance en redes) → interés (visita menú/perfil) → decisión (pide) → recompra → recomendación. Mide la conversión de cada paso y mejora el más débil.
- CAC (costo de adquirir un cliente) = gasto de marketing / clientes nuevos. LTV (valor de vida) = ticket promedio × margen × pedidos por año × años. Sano: LTV ≥ 3×CAC. Retener cuesta mucho menos que adquirir.
- Fidelización: puntos (ya existen), recompensa por frecuencia, segmentación RFM (recencia, frecuencia, monto): campeones, leales, en riesgo, dormidos. Reactiva dormidos con un mensaje personal y un incentivo pequeño, no un descuento general.
- Precios: precio psicológico (terminar en 900), anclaje (un plato caro que hace ver otros razonables), combos que suben el ticket, no competir solo por precio. Descuentos con tope y con propósito (llenar hora valle, no regalar margen).
- Promos: cada una debe tener objetivo (traer nuevos, subir ticket, mover hora valle, rotar inventario), vigencia, tope y métrica de éxito. Calcula siempre el margen DESPUÉS del descuento (un 2x1 puede tener margen negativo).
- Redes de restaurante: foto/video real del producto, formato corto (reel) con gancho en 2 s, historias diarias con llamado a la acción (código del día), horarios de publicación según cuándo piden tus clientes, responder rápido comentarios y DM, prueba social (reseñas, clientes reales). Constancia > perfección.
- Contenido: regla 70/20/10 (valor y entretenimiento / prueba social / venta directa). Medir: alcance, guardados, compartidos y pedidos atribuidos, no solo likes.
- Google Maps/Reseñas: pedir reseña tras entrega exitosa; responder todas, también las malas, con calma y solución.`
    },
    finanzas: {
        titulo: 'Finanzas y costos',
        claves: /costo|margen|utilidad|ganancia|p[eé]rdida|flujo|caja|punto de equilibrio|food ?cost|prime|inventario|merma|insumo|receta|gasto|presupuesto|capital|deuda|pr[eé]stamo|inversi[oó]n|roi|rentab|precio de venta|ebitda|n[oó]mina|arriendo/i,
        texto: `- Food cost % = costo de insumos del plato / precio de venta sin impuestos. Meta típica de hamburguesería 28-35%. Margen bruto = 1 − food cost. Si el food cost real es más alto que el teórico, hay merma, porciones mal servidas, robo o recetas desactualizadas.
- Prime cost = food cost + nómina (meta < 60-65% de las ventas). Es el indicador más importante de un restaurante.
- Precio sugerido = costo / food cost objetivo (ej. costo 6.000 con meta 32% → ~18.750). Revisar cuando suben los insumos (colchón por alzas).
- Punto de equilibrio mensual = costos fijos / margen de contribución %. Margen de contribución % = 1 − (costos variables / ventas). Dividir entre días de operación para la meta diaria.
- Estado de resultados simple: ventas − costo de ventas = utilidad bruta − gastos operativos (arriendo, nómina, servicios, marketing) = utilidad operativa − impuestos/intereses = utilidad neta. Mirar el % de cada línea sobre ventas.
- Flujo de caja ≠ utilidad: un negocio rentable puede quedarse sin caja (inventario, pagos a proveedores, quincena). Mantener colchón de 1-2 meses de costos fijos.
- Ingeniería de menú: clasificar platos por popularidad y margen: estrellas (alta/alta: promover), caballos (popular, margen bajo: subir precio o bajar costo), enigmas (margen alto, poco popular: reposicionar), perros (retirar o reformular).
- Mermas y control: inventario semanal de lo caro (carne, queso, tocineta), estandarizar porciones con gramaje, FIFO (primero en entrar, primero en salir), registrar desperdicio.
- Decisiones de inversión: payback = inversión / utilidad adicional mensual (meses para recuperar); aceptar si es corto y el riesgo bajo. ROI = (ganancia − inversión) / inversión.
- Descuentos y medios de pago: comisiones de datáfono/pasarela comen margen; considerar incentivos para pago directo o transferencia.`
    },
    operaciones: {
        titulo: 'Operaciones de cocina y servicio',
        claves: /operaci|cocina|servicio|tiempo de entrega|demora|domicili|despacho|mesa|mesero|pedido|fila|cola|turno|capacidad|hora pico|proceso|calidad|estandariz|higiene|bpm|sanitar|invima|empaque|plancha|freidora|domiciliario|log[ií]stica|ruta/i,
        texto: `- Teoría de restricciones: el cuello de botella (plancha, freidora, armado, empaque o domiciliarios) fija la capacidad total. Mejorar otra cosa no sube la capacidad. Identificar dónde se acumulan los pedidos.
- Horas pico: preparar mise en place (pre-porcionado, salsas listas) antes del pico; menú reducido en pico si hace falta; asignar roles fijos (plancha, armado, empaque).
- Tiempo de ciclo: desde que entra el pedido hasta que sale. Meta de domicilio razonable 25-40 min. Medir por franja y por plato; las demoras repetidas casi siempre son de proceso, no de personas.
- Estandarización: receta con gramajes, fotos del armado final, tiempos de cocción; el mismo resultado sin importar quién cocine. Una ficha técnica por plato.
- Domicilios: agrupar pedidos por zona, tarifa según distancia/zona (hay barrios especiales), empaque que conserve temperatura y evite derrames, verificar el pedido antes de salir (error de pedido = costo doble).
- Calidad y reclamos: registrar cada queja (causa, plato, hora). Recuperación rápida y amable (disculpa + solución) convierte un reclamo en cliente fiel. Pocas quejas repetidas = problema de proceso a corregir de raíz (5 porqués).
- Inocuidad: manejo de cadena de frío, separación crudo/cocido, manipulación higiénica, fechas y rotulado, limpieza con registro; cumplir BPM y concepto sanitario vigente (verificar normas locales).
- Mejora continua (Kaizen/PDCA): planear un cambio pequeño, hacerlo, medir, estandarizar si funcionó.`
    },
    personal: {
        titulo: 'Talento humano y nómina (Colombia)',
        claves: /empleado|personal|n[oó]mina|contrat|sueldo|salario|prima|cesant[ií]a|vacacion|recargo|dominical|festivo|horas extra|turno|capacit|rotaci[oó]n|motivaci[oó]n|despido|liquidaci[oó]n|propina|seguridad social|arl|eps|pensi[oó]n|reforma laboral|mesero|cajero|cocinero|domiciliario/i,
        texto: `- Costo real de un empleado ≈ salario + auxilio de transporte (si aplica) + seguridad social y parafiscales + prestaciones (prima, cesantías, intereses, vacaciones): suele sumar ~50-55% sobre el salario base. No presupuestar solo el sueldo.
- Recargos (orientativo, verificar con contador porque la reforma laboral Ley 2466/2025 cambia porcentajes por fechas): nocturno desde las 7 pm con recargo del 35%; dominicales/festivos con recargo escalonado (80% desde jul-2025, 90% jul-2026, 100% jul-2027); hora extra diurna 25%, nocturna 75%. Jornada máxima semanal vigente según la ley.
- Propinas: voluntarias (sugerida 10%); no son salario si son voluntarias del cliente; manejar un reparto claro y transparente.
- Motivación y retención: rotación alta en restaurantes es costosa (reclutar + capacitar + errores). Palancas: horarios previsibles, reconocimiento, metas con incentivo (ventas del turno, cero errores), capacitación y ruta de crecimiento.
- Capacitación: manual corto de funciones, inducción con acompañamiento de 1-3 turnos, checklist de apertura y cierre.
- Programación de turnos: con base en la demanda histórica por día y hora (herramienta ventas_por_dia_hora); reforzar picos y recortar valles para cuidar el prime cost.
- Productividad: ventas por hora-hombre; compararla por turno antes de contratar más.
- Documentar todo contrato, afiliación y liquidación; ante despidos o conflictos, asesoría legal. No dar asesoría jurídica definitiva.`
    },
    tributario: {
        titulo: 'Tributario y legal (Colombia)',
        claves: /impuesto|iva|inc\b|consumo|dian|factura|electr[oó]nica|r[eé]gimen|simple|retenci[oó]n|declaraci[oó]n|renta|rut|contador|c[aá]mara de comercio|matr[ií]cula|licencia|sayco|acinpro|datos personales|habeas|sic|protecci[oó]n de datos|t[eé]rminos|pol[ií]tica de privacidad|legal/i,
        texto: `- Impuesto Nacional al Consumo (INC) en restaurantes y bares: 8% (no es IVA) sobre el valor de la comida preparada; régimen aparte. Confirmar con el contador cómo se discrimina en cada factura/ticket.
- Régimen Simple de Tributación (RST): pago unificado anual con anticipos bimestrales; tarifa depende del grupo de actividad y de los ingresos; puede integrar el INC. Evaluar con contador si conviene frente al régimen ordinario.
- Factura electrónica: obligatoria para responsables según normativa DIAN; documento equivalente (tiquete POS electrónico) para ventas al consumidor final según corresponda. Conservar soportes.
- Obligaciones típicas: RUT actualizado, matrícula mercantil y renovación anual (antes del 31 de marzo), concepto sanitario, uso de suelos, bomberos, Sayco-Acinpro si se pone música, y registro de bases de datos si aplica.
- Datos personales (Ley 1581 de 2012, habeas data): pedir autorización para guardar datos de clientes (nombre, teléfono, dirección), política de privacidad visible, permitir consultar/corregir/eliminar, y no compartir sin consentimiento. Aplica a pedidos web, puntos de lealtad y listas de WhatsApp.
- WhatsApp y marketing: mensajes promocionales solo a quienes aceptaron recibirlos; ofrecer salida fácil ("responde SALIR").
- Retenciones y cruces de impuestos cambian cada año: todo número tributario es orientación, la decisión final es del contador. No inventar tarifas: si no estás seguro, dilo y recomienda verificar.`
    },
    clientes: {
        titulo: 'Servicio al cliente y fidelización',
        claves: /cliente|queja|reclamo|rese[ñn]a|opini[oó]n|nps|satisfacci[oó]n|fideli|puntos|recompra|dormid|vip|atenci[oó]n|trato|experiencia|whatsapp|mensaje|recuperar|perd[oó]n|compensa/i,
        texto: `- Recuperación de servicio: escuchar → disculparse sin excusas → resolver rápido → compensar de forma proporcional → hacer seguimiento. Un cliente bien recuperado suele ser más leal que uno que nunca falló.
- NPS: "¿qué tan probable es que nos recomiendes (0-10)?"; promotores 9-10, pasivos 7-8, detractores 0-6; NPS = %promotores − %detractores. Preguntar siempre el porqué.
- Segmentación RFM: campeones (compran seguido y reciente) → premiar y pedir recomendación; en riesgo (antes frecuentes, ahora no) → mensaje personal con incentivo; nuevos → segundo pedido rápido con beneficio de bienvenida; dormidos → reactivar o dejar ir.
- Tono de marca: cercano, cálido, colombiano, breve. Usar el nombre del cliente. Responder rápido por WhatsApp (minutos, no horas).
- Programa de puntos: simple de entender, con recompensas alcanzables pronto (primer canje en 2-3 pedidos) para crear hábito; medir % de clientes con puntos que recompran frente al resto.
- Momentos de verdad: primer pedido, primer reclamo, cumpleaños, regreso tras ausencia. Cuidarlos.
- Pedir reseñas y testimonios tras una experiencia buena; compartirlos (con permiso).`
    },
    liderazgo: {
        titulo: 'Liderazgo y productividad del dueño',
        claves: /lidera|equipo|delegar|prioriz|tiempo|estr[eé]s|agotad|organiz|rutina|h[aá]bito|reuni[oó]n|proceso|automatiz|sistema|manual|escalar|crecer sin|el negocio depende/i,
        texto: `- Trabajar EN el negocio vs. SOBRE el negocio: el dueño debe pasar de operar a dirigir; documentar procesos para que funcionen sin él.
- Delegar: define el resultado esperado, el plazo y los límites; revisa por métricas, no por supervisión constante.
- Rutinas gerenciales: revisión diaria breve (ventas de ayer, incidentes), semanal (indicadores, plan), mensual (resultados, precios, costos). Pocas reuniones, con agenda y acuerdos escritos.
- Priorización: lo que mueve ventas o margen primero; luego lo que evita errores caros; luego lo cosmético.
- Automatiza lo repetitivo (informes, recordatorios, mensajes), y deja el tiempo del dueño para decisiones y para el cliente.
- Cuida al dueño: si hay agotamiento, recomienda descansos y delegar; un negocio que depende de una sola persona es frágil.`
    }
};

/** Elige hasta `max` áreas relevantes según el texto reciente de la conversación. */
function seleccionar(textos, max = 3) {
    const t = (Array.isArray(textos) ? textos : [textos]).map((x) => String(x || '')).join(' \n ').slice(-3000);
    const puntaje = [];
    for (const [id, a] of Object.entries(AREAS)) {
        const m = t.match(new RegExp(a.claves.source, 'gi'));
        if (m && m.length) puntaje.push([id, m.length]);
    }
    puntaje.sort((x, y) => y[1] - x[1]);
    return puntaje.slice(0, max).map(([id]) => id);
}

/** Bloque de texto para el system prompt con las áreas elegidas (o '' si ninguna aplica). */
function bloque(ids) {
    if (!ids || !ids.length) return '';
    return 'CONOCIMIENTO ACADÉMICO DE APOYO (marcos y criterios; las cifras del negocio salen SIEMPRE de las herramientas; lo legal/tributario es orientación y se verifica con el contador):\n'
        + ids.filter((id) => AREAS[id]).map((id) => `## ${AREAS[id].titulo}\n${AREAS[id].texto}`).join('\n\n');
}

module.exports = { AREAS, seleccionar, bloque };
