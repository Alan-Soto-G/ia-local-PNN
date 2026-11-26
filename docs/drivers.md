# Drivers arquitectónicos: Asistente de interpretación ambiental offline (PNN Los Nevados)

> **Enunciado.** Partiendo de [vision.md](vision.md), se extraen los drivers que moldean la arquitectura: casos de uso primarios, escenarios de atributos de calidad, restricciones y preocupaciones arquitectónicas, más la matriz de priorización y la tabla de escenarios (+1).

## 1. Casos de uso y casos de uso primarios

| ID | Caso de uso | Actor | ¿Primario? | Justificación | Se especifica en |
|----|-------------|-------|------------|---------------|------------------|
| **CU-01** | Consultar al asistente por texto con respuesta en streaming | Guía / Visitante | Sí | Corazón del sistema y uso más frecuente; ligado a OB-01, EAC-01, EAC-02 y EAC-05. Define el flujo de recuperación local (RAG) que reutilizan CU-02, CU-03 y CU-07 | |
| **CU-02** | Identificar una especie o rasgo del paisaje por foto | Guía / Visitante | Sí | Riesgo y complejidad: imagen de cámara, embeddings de imagen y modelo multimodal en el mismo teléfono (EAC-04); riesgo de identificación errónea (R-02, EAC-05) | |
| **CU-03** | Consultar al asistente por voz | Guía / Visitante | Sí | Mitiga R-04 (escribir con frío, lluvia o guantes); obliga a convivir con un segundo modelo en memoria (EAC-04, EAC-06) | |
| **CU-04** | Escuchar la respuesta en voz alta | Guía / Visitante | No | Opción de preferencia; la voz del sistema Android lee la respuesta por frases sobre el streaming de CU-01 (ADR-003) | |
| **CU-05** | Descargar modelos y paquetes de conocimiento | Guía | Sí | Sin esta descarga no hay sistema (RT-05, S-02); varios GB por Wi-Fi que pueden cortarse (EAC-03) | |
| **CU-06** | Sincronizar la base de conocimiento con el backend | Sistema (al detectar conexión) / Guía | Sí | Mantiene el contenido validado al día (RN-01) y sube las reseñas de OB-02; riesgo de dejar la base local inconsistente (EAC-03) | |
| **CU-07** | Generar un guion interpretativo según perfil e idioma | Guía | No | Importante para OB-04, pero reutiliza el flujo de CU-01 con una plantilla de perfil (infantil, general, especializado) | |
| **CU-08** | Explorar rutas y las especies de cada ruta | Guía / Visitante | No | Consulta sobre datos ya sincronizados (sendero, alta montaña, ciclomontañismo, cicloturismo) | |
| **CU-09** | Ver la ficha de una especie y su documento fuente | Guía / Visitante / Biólogo | No | Lectura de datos locales; la trazabilidad a la fuente se cubre con EAC-05 | |
| **CU-10** | Registrar una reseña de la experiencia y del asistente | Visitante / Guía | No | Formulario local que se sube después por CU-06; alimenta OB-02 | |
| **CU-11** | Traducir mensajes clave español ↔ inglés | Guía | No | Variante de CU-01 con instrucción de traducción; sin modelo adicional | |
| **CU-12** | Consultar y borrar el historial de conversaciones | Guía / Visitante | No | CRUD local | |
| **CU-13** | Configurar preferencias (voz, idioma, perfil, modelo) | Guía / Visitante | No | Datos locales; la elección de modelo se apoya en ADR-001 y ADR-009 | |

Este catálogo es la lista de funcionalidades del sistema. Cada caso de uso se especifica en la carpeta de `specs/` con su mismo número (CU-01 → `specs/001-...`); un caso de uso sin enlace en "Se especifica en" todavía no está especificado.

## 2. Escenarios de atributos de calidad

### EAC-01: Eficiencia de desempeño (comportamiento temporal)

| Parte | Pregunta | Contenido |
|-------|----------|-----------|
| **1. Fuente del estímulo** | ¿Quién o qué lo provoca? | Un guía en el sendero |
| **2. Estímulo** | ¿Qué ocurre? | Envía una pregunta de texto sobre una especie del catálogo |
| **3. Artefacto** | ¿Sobre qué parte? | Caso de uso Consultar, Buscador vectorial y Motor de inferencia local |
| **4. Entorno** | ¿En qué condiciones? | Modo avión, modelo por defecto cargado, dispositivo de referencia (Android 11+, 6 GB de RAM, gama media) |
| **5. Respuesta** | ¿Qué debe hacer el sistema? | Recupera el contexto local y muestra la respuesta token a token mientras se genera, con opción de detenerla |
| **6. Medida de respuesta** | ¿Cómo se verifica? | **Primer texto visible en 3 s o menos en el 90% de las consultas; al menos 8 tokens por segundo sostenidos; detener la generación responde en menos de 500 ms** |

**Escenario redactado.** En modo avión, con el modelo por defecto ya cargado, un guía pregunta por el frailejón. El asistente busca en la base local y empieza a mostrar la respuesta en 3 s o menos en el 90% de los casos, a no menos de 8 tokens por segundo, y la detiene en menos de medio segundo si el guía lo pide.

**Traza:** OB-01, RT-03, CU-01, CU-03

### EAC-02: Disponibilidad (operación sin conexión)

| Parte | Pregunta | Contenido |
|-------|----------|-----------|
| **1. Fuente del estímulo** | ¿Quién o qué lo provoca? | Un guía en una zona sin señal |
| **2. Estímulo** | ¿Qué ocurre? | Usa cualquier función de campo: chat, foto, voz, rutas, fichas o reseña |
| **3. Artefacto** | ¿Sobre qué parte? | La aplicación completa |
| **4. Entorno** | ¿En qué condiciones? | Sin red durante todo el recorrido, con los paquetes ya descargados |
| **5. Respuesta** | ¿Qué debe hacer el sistema? | Atiende la función sin intentar conexiones externas; lo que requiere red (sincronizar, subir reseñas) queda en espera sin bloquear |
| **6. Medida de respuesta** | ¿Cómo se verifica? | **100% de los casos de uso CU-01 a CU-04 y CU-07 a CU-13 funcionan en modo avión; 0 llamadas de red desde esos casos de uso** |

**Escenario redactado.** Un guía activa el modo avión y recorre la laguna del Otún usando el chat, la cámara, la voz, las fichas y la reseña. Todo funciona sin red, y la reseña queda pendiente para subirse después.

**Traza:** OB-03, RT-01, CU-01 a CU-04, CU-07 a CU-13

### EAC-03: Fiabilidad (recuperabilidad de descargas y sincronización)

| Parte | Pregunta | Contenido |
|-------|----------|-----------|
| **1. Fuente del estímulo** | ¿Quién o qué lo provoca? | La red Wi-Fi o el sistema operativo |
| **2. Estímulo** | ¿Qué ocurre? | Se corta la conexión o se cierra la app a mitad de la descarga de un modelo o de una sincronización |
| **3. Artefacto** | ¿Sobre qué parte? | Gestor de descargas, Sincronizador y base SQLite local |
| **4. Entorno** | ¿En qué condiciones? | Antes de salir a campo, con Wi-Fi inestable |
| **5. Respuesta** | ¿Qué debe hacer el sistema? | Retoma la descarga desde donde iba, verifica el archivo antes de usarlo y aplica cada página de cambios en una transacción |
| **6. Medida de respuesta** | ¿Cómo se verifica? | **0 modelos corruptos en uso (100% verificados con sha256); la descarga se retoma sin empezar de cero; la base local nunca queda con una página aplicada a medias; 0 reseñas perdidas o duplicadas** |

**Escenario redactado.** Mientras baja el modelo de 1,5 GB por el Wi-Fi del hotel, la señal se corta. Al volver, la descarga sigue desde donde quedó, el archivo se verifica antes de usarse, y la sincronización pendiente se aplica por páginas completas o no se aplica.

**Traza:** OB-03, RT-05, S-02, CU-05, CU-06, CU-10

### EAC-04: Eficiencia de desempeño (utilización de recursos)

| Parte | Pregunta | Contenido |
|-------|----------|-----------|
| **1. Fuente del estímulo** | ¿Quién o qué lo provoca? | Un guía |
| **2. Estímulo** | ¿Qué ocurre? | Hace una consulta por voz y, enseguida, una por foto |
| **3. Artefacto** | ¿Sobre qué parte? | Gestor de modelos: Motor de inferencia, Transcriptor y Codificador de imagen |
| **4. Entorno** | ¿En qué condiciones? | Dispositivo de referencia, temperatura baja, batería al 50% |
| **5. Respuesta** | ¿Qué debe hacer el sistema? | Mantiene en memoria solo los modelos necesarios, libera el transcriptor después de usarlo y elige el tamaño de modelo según la RAM del equipo |
| **6. Medida de respuesta** | ¿Cómo se verifica? | **Memoria pico de la app ≤ 4 GB (RT-02); 0 cierres por falta de memoria en una sesión de prueba de 30 consultas mixtas; consumo ≤ 15% de batería por hora de uso moderado (una consulta cada 3 minutos)** |

**Escenario redactado.** En el dispositivo de referencia, un guía hace 30 consultas seguidas entre voz, foto y texto. La app no pasa de 4 GB de memoria, no se cierra, y en una hora de uso moderado gasta como máximo el 15% de la batería.

**Traza:** RT-02, R-01, R-03, CU-02, CU-03

### EAC-05: Adecuación funcional (veracidad de las respuestas)

| Parte | Pregunta | Contenido |
|-------|----------|-----------|
| **1. Fuente del estímulo** | ¿Quién o qué lo provoca? | Un visitante |
| **2. Estímulo** | ¿Qué ocurre? | Pregunta por una especie o un dato que no está en la base local, o envía la foto de una planta que no está en el catálogo |
| **3. Artefacto** | ¿Sobre qué parte? | Caso de uso Consultar, Buscador vectorial y plantilla de instrucciones del modelo |
| **4. Entorno** | ¿En qué condiciones? | Operación normal sin conexión |
| **5. Respuesta** | ¿Qué debe hacer el sistema? | Responde solo con el contexto recuperado y cita la ficha o el documento fuente; si la similitud no supera el umbral, dice que no lo encontró en la base validada en lugar de inventar |
| **6. Medida de respuesta** | ¿Cómo se verifica? | **En el set de prueba de 50 preguntas validado por el biólogo: ≥ 90% de las respuestas dentro del catálogo citan su fuente; ≥ 95% de las preguntas fuera del catálogo reciben la respuesta "no encontrado"; en identificación por foto, el 100% de las especies propuestas existen en el catálogo** |

**Escenario redactado.** Un visitante pregunta por una especie que no existe en el parque. El asistente responde que no la encuentra en la información validada, en lugar de inventar datos. Cuando la especie sí está, la respuesta cita su ficha o el documento del que sale.

**Traza:** R-02, RN-01, CU-01, CU-02, CU-09

### EAC-06: Capacidad de interacción (operabilidad en campo)

| Parte | Pregunta | Contenido |
|-------|----------|-----------|
| **1. Fuente del estímulo** | ¿Quién o qué lo provoca? | Un guía con guantes, bajo sol intenso o llovizna |
| **2. Estímulo** | ¿Qué ocurre? | Quiere preguntar algo sin escribir |
| **3. Artefacto** | ¿Sobre qué parte? | Pantalla de chat, Transcriptor y Sintetizador |
| **4. Entorno** | ¿En qué condiciones? | Campo, una mano ocupada |
| **5. Respuesta** | ¿Qué debe hacer el sistema? | Ofrece un botón grande de "mantener para hablar", muestra la transcripción antes de enviarla y puede leer la respuesta en voz alta |
| **6. Medida de respuesta** | ¿Cómo se verifica? | **Transcripción de 10 s de audio en ≤ 3 s; botones de al menos 56 dp; contraste de texto ≥ 7:1 (WCAG AAA); el 90% de los guías de la prueba hace una consulta por voz sin ayuda en su primer intento** |

**Escenario redactado.** Con guantes y bajo el sol, un guía mantiene presionado el botón grande, pregunta por voz, ve la transcripción en menos de 3 s, la envía y escucha la respuesta. El 90% de los guías de la prueba lo logra al primer intento.

**Traza:** R-04, OB-01, CU-03, CU-04

### EAC-07: Mantenibilidad (modificabilidad del modelo)

| Parte | Pregunta | Contenido |
|-------|----------|-----------|
| **1. Fuente del estímulo** | ¿Quién o qué lo provoca? | El equipo de IA |
| **2. Estímulo** | ¿Qué ocurre? | Sale una versión mejor de un modelo (otro GGUF de Qwen o un modelo de embeddings nuevo) |
| **3. Artefacto** | ¿Sobre qué parte? | Manifest de paquetes, adaptadores de los puertos de IA |
| **4. Entorno** | ¿En qué condiciones? | Con la app instalada en los teléfonos de los guías |
| **5. Respuesta** | ¿Qué debe hacer el sistema? | Admite el cambio como una entrada nueva del manifest, sin tocar `dominio/` ni los casos de uso |
| **6. Medida de respuesta** | ¿Cómo se verifica? | **Cambio del modelo de lenguaje sin publicar un APK nuevo y sin tocar `dominio/` ni `aplicacion/`; cambio de modelo de embeddings con re-sincronización de vectores marcada por `modelo_embedding`** |

**Escenario redactado.** El equipo de IA publica un GGUF mejor. Los guías lo descargan desde la app como un paquete nuevo, sin actualizar el APK, y el cambio no toca el dominio ni los casos de uso.

**Traza:** RT-05, CU-05, CU-13, stakeholder Ingeniero de IA

## 3. Restricciones

| ID | Restricción | Tipo | Origen | Impacto arquitectónico esperado |
|----|-------------|------|--------|---------------------------------|
| **RT-01** | Inferencia y consulta 100% locales; sin APIs en la nube durante la guianza | Técnica | Arquitectura de Software | Obliga a llevar en el teléfono el modelo de lenguaje, el transcriptor, los embeddings y la base vectorial (ADR-001, ADR-002, ADR-005); la red solo se usa para descargar y sincronizar (ADR-006, ADR-007) |
| **RT-02** | Paquete total ≤ 3,5 GB y ≤ 4 GB de RAM | Técnica | Ingeniería de IA y Desarrollo Móvil | Modelos cuantizados (Q4), un solo modelo pesado en memoria a la vez y tamaño de modelo según la RAM (ADR-001, ADR-009) |
| **RT-03** | Latencia hasta el primer token ≤ 3 s | Técnica | Operaciones de campo y UX | Respuesta en streaming, contexto recuperado acotado y modelo precargado al abrir el chat (ADR-004, ADR-009, ADR-010) |
| **RT-04** | Solo Android 11+ ARM64 (APK) | Técnica | Equipo del proyecto | Librerías nativas solo para Android; build con EAS; sin iOS en las vistas (ADR-011) |
| **RT-05** | Modelos y paquetes se descargan después de instalar el APK | Técnica | Equipo del proyecto | APK liviano; manifest de paquetes, gestor de descargas reanudables con verificación (ADR-007) |
| **RN-01** | Todo contenido debe estar validado por especialistas antes de distribuirse | Negocio | Administración del área protegida | El móvil solo recibe contenido publicado como validado; cada ficha y fragmento conserva su fuente (ADR-006, ADR-010) |

## 4. Preocupaciones arquitectónicas

| ID | Preocupación | Qué hay que decidir | Por qué importa en este sistema |
|----|--------------|---------------------|---------------------------------|
| **PA-01** | Estructura general | Cómo se divide el código de la app y cómo se aíslan las librerías nativas de IA | Las librerías de IA cambian rápido (EAC-07); el dominio no debe depender de ellas |
| **PA-02** | Memoria y ciclo de vida de los modelos | Qué modelos se cargan, cuándo se liberan y cuál se elige según el equipo | RT-02, EAC-04, R-01, R-03 |
| **PA-03** | Persistencia local y vectores | Dónde se guardan datos, vectores, imágenes y PDF en el teléfono | Búsqueda por similitud sin servidor (RT-01); espejo del PostgreSQL externo |
| **PA-04** | Sincronización | Cómo se bajan los cambios y se suben las reseñas sin perder ni duplicar | EAC-03, OB-02, RN-01 |
| **PA-05** | Manejo de errores | Estrategia ante modelo no descargado, memoria insuficiente, permiso de micrófono o cámara negado, descarga corrupta | La app no debe cerrarse en campo (EAC-02, EAC-04) |
| **PA-06** | Configuración | Dónde viven la URL del backend, el catálogo de modelos y los umbrales de similitud | `.env` para la URL; manifest para los modelos (EAC-07) |
| **PA-07** | Trazabilidad de fuentes | Cómo cada respuesta queda ligada a la ficha o al PDF del que sale | EAC-05, RN-01 |
| **PA-08** | Privacidad | Qué datos salen del teléfono | Fotos, audio y conversaciones no salen del dispositivo; solo las reseñas, con consentimiento |
| **PA-09** | Construcción y distribución | Cómo se compila el APK con módulos nativos | Expo Go no incluye llama.rn ni whisper.rn: se necesita development build (RT-04) |

## 5. Matriz de priorización

### Alta importancia, alta dificultad: atender primero

CU-01, CU-02, CU-05, EAC-01, EAC-04, EAC-05, RT-01, RT-02, RT-03, PA-02, PA-03

### Alta importancia, baja dificultad: hacer ya

CU-03, CU-06, EAC-02, EAC-03, EAC-06, RT-04, RT-05, RN-01, PA-01, PA-04, PA-07, PA-08, PA-09

### Baja importancia, baja dificultad: hacer si sobra tiempo

CU-04, CU-08, CU-09, CU-10, CU-12, CU-13, PA-05, PA-06

### Baja importancia, alta dificultad: cuestionar

CU-07, CU-11, EAC-07

## 6. Escenarios (+1)

Inventario de escenarios que se diagraman. Un escenario sin caso de uso primario o EAC detrás no se diagrama.

| ID | Escenario | Origen | Por qué es escenario | Archivo en secuencia/ |
|----|-----------|--------|----------------------|------------------------|
| **ESC-01** | Consultar por texto | CU-01 | Caso de uso primario. Muestra la recuperación local, el streaming y la respuesta "no encontrado": cubre EAC-01, EAC-02 y EAC-05 | [cu01-consultar-texto.puml](diagramas/secuencia/cu01-consultar-texto.puml) |
| **ESC-02** | Identificar por foto | CU-02 | Caso de uso primario. Embedding de imagen, búsqueda kNN y modelo multimodal con candidatos del catálogo (ADR-002): cubre EAC-04 y EAC-05 | [cu02-identificar-foto.puml](diagramas/secuencia/cu02-identificar-foto.puml) |
| **ESC-03** | Consultar por voz | CU-03, CU-04 | Caso de uso primario. Transcripción, liberación del transcriptor y lectura por frases (ADR-003, ADR-009): cubre EAC-04 y EAC-06 | [cu03-consultar-voz.puml](diagramas/secuencia/cu03-consultar-voz.puml) |
| **ESC-04** | Descargar paquetes | CU-05 | Caso de uso primario. Descarga reanudable con verificación sha256 solo por Wi-Fi (ADR-007): cubre EAC-03 | [cu05-descargar-paquetes.puml](diagramas/secuencia/cu05-descargar-paquetes.puml) |
| **ESC-05** | Sincronizar | CU-06, CU-10 | Caso de uso primario. Pull paginado por cursor y envío idempotente de reseñas (ADR-006): cubre EAC-03 | [cu06-sincronizar.puml](diagramas/secuencia/cu06-sincronizar.puml) |

EAC-01 a EAC-06 quedan dentro de los cinco escenarios. EAC-07 (modificabilidad) no tiene comportamiento en ejecución: se verifica revisando que el cambio de modelo solo agregue una entrada al manifest y no toque `dominio/` ni `aplicacion/`.
