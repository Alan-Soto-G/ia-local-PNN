# Drivers arquitectónicos: Asistente de interpretación ambiental offline (PNN Los Nevados)

> **Enunciado.** Partiendo de [vision.md](vision.md), se extraen los drivers que moldean la arquitectura de la **versión 1** ([ADR-017](adr/ADR-017-alcance-version-1.md)): casos de uso primarios, escenarios de atributos de calidad, restricciones y preocupaciones arquitectónicas, más la matriz de priorización y la tabla de escenarios (+1). Lo pospuesto está en la sección 7.

## 1. Casos de uso y casos de uso primarios

| ID | Caso de uso | Actor | ¿Primario? | Justificación | Se especifica en |
|----|-------------|-------|------------|---------------|------------------|
| **CU-01** | Actualizar información: cargar los PDF vectorizados desde el backend | Visitante / Guía | Sí | Sin esta carga no hay chat. Es el único caso de uso con red (RT-01); debe ser todo o nada (EAC-03), verificar que el modelo de embeddings coincida y mostrar un mensaje amigable si no hay backend. Inicia la vigencia de 24 h (RN-02) | [specs/001-actualizar-informacion](../specs/001-actualizar-informacion/spec.md) |
| **CU-02** | Consultar al asistente por texto con respuesta en streaming y citas | Visitante / Guía | Sí | Corazón del sistema; ligado a EAC-01, EAC-02 y EAC-05. Define la recuperación local por bandas de similitud y el prompt del sistema (ADR-016) | |
| **CU-03** | Vencer la vigencia: borrar la información, bloquear el chat, notificar y ofrecer desinstalar | Sistema (al cumplirse 24 h) / Visitante | Sí | Requisito de negocio RN-02; riesgo de que el chat siga disponible o de dejar datos (EAC-08). Toca notificaciones y desinstalación de Android (ADR-015) | |

Este catálogo es la lista de funcionalidades de la versión 1. Cada caso de uso se especifica en la carpeta de `specs/` con su mismo número (CU-01 → `specs/001-actualizar-informacion/`, CU-02 → `specs/002-consultar-texto/`, CU-03 → `specs/003-vencer-vigencia/`); un caso de uso sin enlace en "Se especifica en" todavía no está especificado.

### Flujo resumido

1. El usuario instala el APK. En el primer arranque se preparan los modelos que trae el APK (ADR-013).
2. Sin carga vigente, la pantalla principal solo ofrece **Actualizar información** (el chat está bloqueado).
3. CU-01: si el backend no responde, se muestra un mensaje amigable; si la carga sale completa, se guarda y empieza la vigencia de 24 h.
4. CU-02: con la carga vigente, el usuario chatea sin conexión.
5. CU-03: a las 24 h llega una notificación; el chat queda bloqueado y la app pregunta "¿Deseas desinstalar la aplicación?". **Sí** → se abre el diálogo de desinstalación de Android. **No** → se borra la información de los PDF y la app vuelve al paso 2.

## 2. Escenarios de atributos de calidad

### EAC-01: Eficiencia de desempeño (comportamiento temporal)

| Parte | Pregunta | Contenido |
|-------|----------|-----------|
| **1. Fuente del estímulo** | ¿Quién o qué lo provoca? | Un visitante en el sendero |
| **2. Estímulo** | ¿Qué ocurre? | Envía una pregunta de texto cuya respuesta está en los documentos (banda ALTA) |
| **3. Artefacto** | ¿Sobre qué parte? | Módulo Consulta, Buscador vectorial y Motor de inferencia local |
| **4. Entorno** | ¿En qué condiciones? | Modo avión, carga vigente, modelos ya preparados, dispositivo de referencia (Android 11+, gama media; DT-08) |
| **5. Respuesta** | ¿Qué debe hacer el sistema? | Recupera los fragmentos y muestra la respuesta token a token, con opción de detenerla |
| **6. Medida de respuesta** | ¿Cómo se verifica? | **Primer texto visible en 3 s o menos en el 90% de las consultas; al menos 8 tokens por segundo sostenidos; detener responde en menos de 500 ms; respuestas MEDIA y BAJA visibles en ≤ 1 s** |

**Escenario redactado.** En modo avión, un visitante pregunta por el frailejón. El asistente busca en los fragmentos locales y empieza a mostrar la respuesta en 3 s o menos en el 90% de los casos, a no menos de 8 tokens por segundo, y la detiene en menos de medio segundo si se lo piden.

**Traza:** OB-01, RT-03, CU-02

### EAC-02: Disponibilidad (operación sin conexión)

| Parte | Pregunta | Contenido |
|-------|----------|-----------|
| **1. Fuente del estímulo** | ¿Quién o qué lo provoca? | Un visitante en una zona sin señal |
| **2. Estímulo** | ¿Qué ocurre? | Usa el chat |
| **3. Artefacto** | ¿Sobre qué parte? | La aplicación completa |
| **4. Entorno** | ¿En qué condiciones? | Sin red durante todo el recorrido, con una carga vigente |
| **5. Respuesta** | ¿Qué debe hacer el sistema? | Atiende el chat sin intentar conexiones; el vencimiento (CU-03) también funciona sin red |
| **6. Medida de respuesta** | ¿Cómo se verifica? | **CU-02 y CU-03 funcionan al 100% en modo avión; 0 llamadas de red fuera de CU-01** |

**Escenario redactado.** Un visitante activa el modo avión y recorre la laguna del Otún usando el chat. Todo funciona sin red; ninguna pantalla intenta conectarse salvo cuando pulsa "Actualizar información".

**Traza:** OB-03, RT-01, CU-02, CU-03

### EAC-03: Fiabilidad (carga recuperable)

| Parte | Pregunta | Contenido |
|-------|----------|-----------|
| **1. Fuente del estímulo** | ¿Quién o qué lo provoca? | La red del punto de acceso o el sistema operativo |
| **2. Estímulo** | ¿Qué ocurre? | El backend no responde, informa otro modelo de embeddings, o la conexión se corta o la app se cierra a mitad de la carga |
| **3. Artefacto** | ¿Sobre qué parte? | Módulo Actualización, ClienteBackend y base SQLite local |
| **4. Entorno** | ¿En qué condiciones? | Antes del recorrido, conectado (o no) al punto de acceso del computador |
| **5. Respuesta** | ¿Qué debe hacer el sistema? | Muestra un mensaje amigable que dice qué hacer; aplica la carga completa o no aplica nada; conserva la base y la vigencia anteriores si la carga falla |
| **6. Medida de respuesta** | ¿Cómo se verifica? | **Sin backend, el mensaje aparece en ≤ 5 s; 0 cargas aplicadas a medias en 10 cortes provocados; tras un fallo, los documentos y `expira_en` anteriores no cambian; 0 cargas aceptadas con un modelo de embeddings distinto** |

**Escenario redactado.** Mientras baja los fragmentos, el visitante sale del alcance del punto de acceso. La app avisa que no pudo completar la carga, y la información que ya tenía sigue igual, con la misma hora de vencimiento.

**Traza:** OB-03, RT-05, S-02, CU-01

### EAC-04: Eficiencia de desempeño (utilización de recursos)

| Parte | Pregunta | Contenido |
|-------|----------|-----------|
| **1. Fuente del estímulo** | ¿Quién o qué lo provoca? | Un visitante |
| **2. Estímulo** | ¿Qué ocurre? | Hace 30 consultas seguidas |
| **3. Artefacto** | ¿Sobre qué parte? | Gestor de modelos, Motor de inferencia y base local |
| **4. Entorno** | ¿En qué condiciones? | Dispositivo de referencia, temperatura baja, batería al 50% |
| **5. Respuesta** | ¿Qué debe hacer el sistema? | Mantiene los dos modelos residentes sin crecer en memoria y los libera en segundo plano |
| **6. Medida de respuesta** | ¿Cómo se verifica? | **Memoria pico de la app ≤ 1,5 GB (valor a confirmar con la medición de DT-02); 0 cierres en 30 consultas; consumo ≤ 10% de batería por hora de uso moderado (una consulta cada 3 minutos)** |

**Escenario redactado.** En el dispositivo de referencia, un visitante hace 30 consultas seguidas. La app no pasa de 1,5 GB de memoria, no se cierra y en una hora de uso moderado gasta como máximo el 10% de la batería.

**Traza:** RT-02, R-01, R-03, CU-02

### EAC-05: Adecuación funcional (veracidad de las respuestas)

| Parte | Pregunta | Contenido |
|-------|----------|-----------|
| **1. Fuente del estímulo** | ¿Quién o qué lo provoca? | Un visitante |
| **2. Estímulo** | ¿Qué ocurre? | Pregunta algo que está en los documentos, algo cercano pero sin dato, algo ajeno al parque |
| **3. Artefacto** | ¿Sobre qué parte? | Módulo Consulta, Buscador vectorial y prompt del sistema ([prompt-sistema.md](prompt-sistema.md)) |
| **4. Entorno** | ¿En qué condiciones? | Operación normal sin conexión, carga vigente |
| **5. Respuesta** | ¿Qué debe hacer el sistema? | Banda ALTA: responde solo con los fragmentos y cita documento y página. Banda MEDIA: recomienda consultar al guía. Banda BAJA: dice que no encontró la información. Tema ajeno: dice que solo responde sobre el parque |
| **6. Medida de respuesta** | ¿Cómo se verifica? | **En un set de prueba de 50 preguntas validado por un especialista: ≥ 90% de las respuestas ALTA citan una fuente correcta; ≥ 95% de las preguntas sin respuesta en los documentos reciben el texto de MEDIA o BAJA; ≥ 95% de las preguntas ajenas no reciben una respuesta de contenido; 0 respuestas ALTA con datos que no estén en los fragmentos** |

**Escenario redactado.** Un visitante pregunta quién ganó el último mundial. El asistente responde que no encontró esa información en los documentos del recorrido. Cuando pregunta qué come el zorro rojo, responde en pocas frases y cita `Fauna_v1.pdf, página 1`.

**Traza:** R-02, RN-01, CU-02

### EAC-06: Capacidad de interacción (operabilidad en campo)

| Parte | Pregunta | Contenido |
|-------|----------|-----------|
| **1. Fuente del estímulo** | ¿Quién o qué lo provoca? | Un visitante bajo sol intenso o llovizna |
| **2. Estímulo** | ¿Qué ocurre? | Quiere actualizar la información o hacer una pregunta |
| **3. Artefacto** | ¿Sobre qué parte? | Pantallas de inicio y de chat |
| **4. Entorno** | ¿En qué condiciones? | Campo, una mano ocupada |
| **5. Respuesta** | ¿Qué debe hacer el sistema? | Botones grandes, texto legible al sol, estado de la vigencia siempre visible ("Disponible hasta las 15:04") |
| **6. Medida de respuesta** | ¿Cómo se verifica? | **Botones de al menos 56 dp; contraste de texto ≥ 7:1 (WCAG AAA); el 90% de los usuarios de la prueba carga la información y hace una pregunta sin ayuda en su primer intento** |

**Escenario redactado.** Bajo el sol, un visitante pulsa el botón grande "Actualizar información", ve hasta qué hora estará disponible el asistente y hace su primera pregunta sin ayuda.

**Traza:** R-04, OB-01, CU-01, CU-02

### EAC-07: Mantenibilidad (modificabilidad del modelo)

| Parte | Pregunta | Contenido |
|-------|----------|-----------|
| **1. Fuente del estímulo** | ¿Quién o qué lo provoca? | El equipo de IA |
| **2. Estímulo** | ¿Qué ocurre? | Sale una versión mejor del modelo de lenguaje, o el backend cambia de modelo de embeddings |
| **3. Artefacto** | ¿Sobre qué parte? | Assets del APK, constante de modelos, Adaptador llama.rn |
| **4. Entorno** | ¿En qué condiciones? | Desarrollo |
| **5. Respuesta** | ¿Qué debe hacer el sistema? | Admite el cambio reemplazando el GGUF, la constante de modelos y, si hace falta, el adaptador, sin tocar `dominio/` ni `aplicacion/` |
| **6. Medida de respuesta** | ¿Cómo se verifica? | **El cambio de modelo no modifica archivos de `src/dominio/` ni de `src/aplicacion/`; un APK con modelo de embeddings distinto al del backend rechaza la carga (EAC-03)** |

**Escenario redactado.** El equipo de IA cambia LFM2.5-350M por una versión nueva. El cambio solo toca el asset, la constante y el adaptador, y se publica en un APK nuevo.

**Traza:** RT-05, CU-01, CU-02, stakeholder Ingeniero de IA

### EAC-08: Seguridad de la información (vigencia de 24 horas)

| Parte | Pregunta | Contenido |
|-------|----------|-----------|
| **1. Fuente del estímulo** | ¿Quién o qué lo provoca? | El paso del tiempo |
| **2. Estímulo** | ¿Qué ocurre? | Se cumplen 24 h desde la última carga exitosa |
| **3. Artefacto** | ¿Sobre qué parte? | Módulo Vigencia, Notificador, Desinstalador y base local |
| **4. Entorno** | ¿En qué condiciones? | App abierta, en segundo plano o cerrada; con o sin red |
| **5. Respuesta** | ¿Qué debe hacer el sistema? | Muestra una notificación, bloquea el chat, pregunta si desea desinstalar; con "Sí" abre el diálogo de desinstalación de Android; con "No" borra documentos y conversaciones y vuelve a pedir una carga |
| **6. Medida de respuesta** | ¿Cómo se verifica? | **Con un reloj de prueba: 0 consultas aceptadas después de `expira_en`; la notificación se muestra a ±1 minuto de `expira_en` con la app cerrada (con permiso de notificaciones); tras "No", 0 filas en `documento`, `fragmento`, `vec_fragmento`, `conversacion`, `mensaje` y `cita`; tras "Sí", se abre el diálogo de desinstalación del sistema** |

**Escenario redactado.** Un visitante cargó la información a las 9:00. Al día siguiente a las 9:00 recibe una notificación. Abre la app: el chat ya no está disponible y la app le pregunta si quiere desinstalarla. Responde que no; la información se borra y la app le ofrece volver a cargarla.

**Traza:** RN-02, CU-03, PA-08

## 3. Restricciones

| ID | Restricción | Tipo | Origen | Impacto arquitectónico esperado |
|----|-------------|------|--------|---------------------------------|
| **RT-01** | Inferencia y consulta 100% locales; sin APIs en la nube durante el recorrido | Técnica | Arquitectura de Software | Los dos modelos y la base vectorial van en el teléfono (ADR-012, ADR-014); la red solo se usa en CU-01 contra el backend local |
| **RT-02** | Paquete total ≤ 3,5 GB y ≤ 4 GB de RAM | Técnica | Ingeniería de IA y Desarrollo Móvil | Con LFM2.5-350M y MiniLM queda holgada; EAC-04 fija una meta más estricta (ADR-014) |
| **RT-03** | Latencia hasta el primer token ≤ 3 s | Técnica | Operaciones de campo y UX | Streaming, contexto ≤ 1.500 tokens y modelos precargados al abrir el chat (ADR-004, ADR-014, ADR-016) |
| **RT-04** | Solo Android 11+ ARM64 (APK) | Técnica | Equipo del proyecto | Librerías nativas solo para Android; build con EAS (ADR-011) |
| **RT-05** | Los modelos viajan dentro del APK; el conocimiento se carga desde el backend local después de instalar | Técnica | Equipo del proyecto | Assets GGUF copiados al almacenamiento interno en el primer arranque (ADR-013); reemplaza la redacción original de descargar modelos por Wi-Fi |
| **RN-01** | Todo contenido debe estar validado por especialistas antes de distribuirse | Negocio | Administración del área protegida | El administrador solo carga en el backend PDF validados; cada fragmento conserva documento y página (ADR-016) |
| **RN-02** | La información recibida vence 24 h después de la última carga exitosa | Negocio | [CONTEXT.md](../CONTEXT.md), sección 5.5 | Fecha de vencimiento persistida, notificación programada, bloqueo del chat, borrado y opción de desinstalar (ADR-015) |

## 4. Preocupaciones arquitectónicas

| ID | Preocupación | Qué hay que decidir | Por qué importa en este sistema |
|----|--------------|---------------------|---------------------------------|
| **PA-01** | Estructura general | Cómo se divide el código y cómo se aíslan las librerías nativas | Los modelos cambian (EAC-07); el dominio no debe depender de ellos |
| **PA-02** | Memoria y ciclo de vida de los modelos | Cuándo se preparan, cargan y liberan | EAC-04, R-01 |
| **PA-03** | Persistencia local y vectores | Cómo se guardan documentos, fragmentos y vectores | Búsqueda por similitud sin servidor (RT-01) |
| **PA-04** | Carga desde el backend | Cómo se baja todo sin dejar la base a medias y con el modelo correcto | EAC-03 |
| **PA-05** | Manejo de errores | Backend ausente, modelo distinto, modelo no preparado, memoria insuficiente, notificaciones denegadas | La app no debe cerrarse y debe decir qué hacer |
| **PA-06** | Configuración | Dónde viven la URL del backend, los umbrales y la duración de la vigencia | `.env` para la URL; constantes versionadas para umbrales y 24 h |
| **PA-07** | Trazabilidad de fuentes | Cómo cada respuesta queda ligada al documento y la página | EAC-05, RN-01 |
| **PA-08** | Privacidad | Qué datos salen del teléfono y cuándo se borran | Nada sale del teléfono; todo lo recibido se borra al vencer (RN-02) |
| **PA-09** | Construcción y distribución | Cómo se compila el APK con módulos nativos y modelos incluidos | Expo Go no incluye llama.rn (ADR-011, ADR-013) |
| **PA-10** | Vigencia | Cómo se garantiza el bloqueo a las 24 h con la app cerrada | EAC-08, RN-02 |

## 5. Matriz de priorización

### Alta importancia, alta dificultad: atender primero

CU-02, EAC-01, EAC-05, EAC-08, RT-01, RT-03, PA-02, PA-03, PA-10

### Alta importancia, baja dificultad: hacer ya

CU-01, CU-03, EAC-02, EAC-03, RT-04, RT-05, RN-01, RN-02, PA-01, PA-04, PA-07, PA-08, PA-09

### Baja importancia, baja dificultad: hacer si sobra tiempo

EAC-06, PA-05, PA-06

### Baja importancia, alta dificultad: cuestionar

EAC-04 (la meta de batería), EAC-07

## 6. Escenarios (+1)

Inventario de escenarios que se diagraman. Un escenario sin caso de uso primario o EAC detrás no se diagrama.

| ID | Escenario | Origen | Por qué es escenario | Archivo en secuencia/ |
|----|-----------|--------|----------------------|------------------------|
| **ESC-01** | Actualizar información | CU-01 | Caso de uso primario. Verificación del backend y del modelo, descarga y transacción todo o nada, inicio de la vigencia: cubre EAC-03 | [cu01-actualizar-informacion.puml](diagramas/secuencia/cu01-actualizar-informacion.puml) |
| **ESC-02** | Consultar por texto | CU-02 | Caso de uso primario. Recuperación local, bandas, streaming y citas: cubre EAC-01, EAC-02 y EAC-05 | [cu02-consultar-texto.puml](diagramas/secuencia/cu02-consultar-texto.puml) |
| **ESC-03** | Vencer la vigencia | CU-03 | Caso de uso primario. Notificación, bloqueo, borrado y desinstalación: cubre EAC-08 | [cu03-vencer-vigencia.puml](diagramas/secuencia/cu03-vencer-vigencia.puml) |

EAC-01 a EAC-03, EAC-05 y EAC-08 quedan dentro de los tres escenarios. EAC-04 se mide con la sesión de 30 consultas de ESC-02. EAC-06 se verifica con la prueba de usuarios. EAC-07 no tiene comportamiento en ejecución: se verifica revisando que el cambio de modelo no toque `dominio/` ni `aplicacion/`.

## 7. Versiones futuras

No se especifican ni se implementan en la versión 1 ([ADR-017](adr/ADR-017-alcance-version-1.md)). No tienen número de caso de uso para no ocupar carpetas de `specs/`; se numerarán cuando entren al alcance.

| Funcionalidad | Notas para cuando se retome |
|---------------|-----------------------------|
| Consulta por foto (imagen→imagen, texto→imagen) | Modelo elegido: **MobileCLIP2**. Requiere que el backend vectorice imágenes y las entregue; decisión anterior en [ADR-002](adr/ADR-002-imagenes-e-identificacion.md) (pospuesto) |
| Consulta por voz y lectura en voz alta | [ADR-003](adr/ADR-003-voz-entrada-salida.md) (pospuesto): whisper.rn y expo-speech |
| Reformulación de preguntas largas antes de vectorizar | [CONTEXT.md](../CONTEXT.md), sección 5.3 |
| Respuestas en inglés y traducción español–inglés | — |
| Historial de conversaciones navegable | En la versión 1 los mensajes se guardan solo durante la vigencia |
| Rutas, fichas de especies, reseñas, guiones por perfil | Visión original ([vision.md](vision.md)); OB-02 y OB-04 |
