# Documento de arquitectura: Asistente de interpretación ambiental offline (PNN Los Nevados)

> Versión 2.0 (2026-11-26) | Estado: completo para la versión 1 (Actualizar información, chat de texto y vigencia de 24 h), hasta las vistas y los escenarios (+1). La sección 9 conserva la deuda técnica que se registre durante la implementación.

Este documento es el mapa del proyecto. Enlaza a los demás archivos y no los copia: un dato escrito en dos lugares termina diciendo dos cosas distintas. Su estructura es una adaptación de arc42.

## 1. Introducción y objetivos

El sistema completo ([CONTEXT.md](../CONTEXT.md)) tiene dos partes: un **computador administrador**, que carga los PDF y los fragmenta y vectoriza con un backend RAG propio ([API.md](../API.md)), y esta **app Android**, que funciona 100% sin conexión. La app no construye el RAG: lo consume. En la versión 1 hace tres cosas: **actualizar la información** (bajar los PDF vectorizados por el punto de acceso Wi-Fi del computador), **chatear por texto** con respuestas en streaming basadas solo en esos documentos, y **vencer la información a las 24 horas**, avisando al usuario y ofreciéndole desinstalar. Los modelos (LFM2.5-350M para redactar y paraphrase-multilingual-MiniLM-L12-v2 para vectorizar la pregunta) viajan dentro del APK. Los objetivos de negocio que mide esta versión son OB-01 y OB-03.

Detalle: [Visión](vision.md)

Funcionalidades: [catálogo de casos de uso](drivers.md#1-casos-de-uso-y-casos-de-uso-primarios) (CU-01 a CU-03), cada uno enlazado a su carpeta de `specs/` cuando se especifique. Lo pospuesto: [versiones futuras](drivers.md#7-versiones-futuras).

## 2. Restricciones

Siete restricciones: inferencia 100% local (RT-01), ≤ 3,5 GB y ≤ 4 GB de RAM (RT-02), primer token en ≤ 3 s (RT-03), solo Android 11+ ARM64 (RT-04), modelos dentro del APK y conocimiento desde el backend local (RT-05), contenido validado por especialistas (RN-01) y vigencia de 24 h (RN-02).

Detalle: [Restricciones](drivers.md#3-restricciones)

## 3. Contexto del sistema

La app se relaciona con dos personas (Visitante y Guía; el Administrador del computador trabaja en el backend) y tres sistemas externos: el Backend RAG del computador administrador, el sistema de notificaciones de Android y el instalador de paquetes de Android.

Detalle: [Contexto](contexto.md). Lo que la app usa del backend: [backend-esperado.md](backend-esperado.md). Texto del prompt: [prompt-sistema.md](prompt-sistema.md).

## 4. Estrategia de solución

| Driver | Enfoque | ADR |
|--------|---------|-----|
| CU-01, EAC-03, RT-01, PA-03, PA-04 | Carga completa desde el backend local (API.md) en una transacción; verificación del modelo de embeddings; SQLite + sqlite-vec | [ADR-012](adr/ADR-012-backend-local-y-carga-completa.md) |
| RT-05, EAC-02, EAC-07, PA-09 | Modelos GGUF dentro del APK, copiados y verificados en el primer arranque | [ADR-013](adr/ADR-013-modelos-dentro-del-apk.md) |
| RT-01, RT-02, RT-03, EAC-01, EAC-04, PA-02 | llama.rn con LFM2.5-350M (chat) y MiniLM multilingüe (embeddings); Gestor de modelos único | [ADR-014](adr/ADR-014-motor-local-lfm-minilm.md) |
| CU-03, RN-02, EAC-08, PA-10 | `expira_en` persistido, notificación local programada, bloqueo por reloj, borrado y diálogo de desinstalación | [ADR-015](adr/ADR-015-vigencia-24h-y-desinstalacion.md) |
| CU-02, EAC-05, R-02, PA-07 | Bandas de similitud decididas en el código, prompt del sistema y citas | [ADR-016](adr/ADR-016-rag-por-bandas-y-prompt.md) |
| EAC-01, RT-03 | Respuesta en streaming con actualización agrupada y opción de detener | [ADR-004](adr/ADR-004-respuesta-streaming.md) |
| PA-01, EAC-07 | Clean Architecture en `src/` con puertos para cada motor | [ADR-008](adr/ADR-008-estructura-general.md) |
| RT-04, PA-09 | CNG + development build + APK con EAS, solo ARM64 | [ADR-011](adr/ADR-011-build-android.md) |
| Alcance | Versión 1 reducida; foto (MobileCLIP2) y voz pospuestas | [ADR-017](adr/ADR-017-alcance-version-1.md) |

## 5. Vistas (4+1)

[Lógica](vistas/01-logica.md) | [Procesos](vistas/02-procesos.md) | [Desarrollo](vistas/03-desarrollo.md) | [Física](vistas/04-fisica.md) | [Datos (ER)](vistas/05-datos.md)

Escenarios (+1): [diagramas/secuencia/](diagramas/secuencia/) y la tabla de escenarios en [drivers.md](drivers.md#6-escenarios-1).

### Matriz de cobertura: drivers y ADR por vista

Ninguna fila vacía: todo driver y todo ADR vigente se ven en al menos una vista.

| Driver o ADR | Contexto (marco) | Lógica | Procesos | Desarrollo | Física | Datos |
|--------------|:----------------:|:------:|:--------:|:----------:|:------:|:-----:|
| CU-01, CU-02, CU-03 (primarios) | ✓ | ✓ | ✓ | ✓ | | ✓ |
| EAC-01: primer texto en ≤ 3 s | | | ✓ | ✓ | | |
| EAC-02: chat en modo avión | ✓ | | ✓ | ✓ | ✓ | |
| EAC-03: carga todo o nada | | ✓ | ✓ | ✓ | | ✓ |
| EAC-04: memoria y batería | | | ✓ | ✓ | ✓ | |
| EAC-05: respuestas con fuente | | ✓ | | ✓ | | ✓ |
| EAC-06: uso en campo | | | | ✓ | | |
| EAC-07: cambiar modelo sin tocar el dominio | | ✓ | | ✓ | | |
| EAC-08: vigencia de 24 h | ✓ | ✓ | ✓ | ✓ | | ✓ |
| RT-01: 100% local | ✓ | | ✓ | | ✓ | |
| RT-02: almacenamiento y RAM | | | ✓ | | ✓ | |
| RT-03: TTFT ≤ 3 s | | | ✓ | ✓ | | |
| RT-04: solo Android | | | | ✓ | ✓ | |
| RT-05: modelos en el APK | ✓ | ✓ | ✓ | ✓ | ✓ | |
| RN-01: contenido validado | ✓ | ✓ | | | | ✓ |
| RN-02: vigencia | ✓ | ✓ | ✓ | ✓ | | ✓ |
| ADR-004 Streaming | | ✓ | | ✓ | | |
| ADR-008 Estructura | | ✓ | | ✓ | | |
| ADR-011 Build Android | | | | ✓ | ✓ | |
| ADR-012 Backend local y carga | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| ADR-013 Modelos en el APK | | ✓ | ✓ | ✓ | ✓ | |
| ADR-014 Motor local | | | ✓ | ✓ | ✓ | |
| ADR-015 Vigencia | ✓ | ✓ | ✓ | ✓ | | ✓ |
| ADR-016 RAG por bandas | | ✓ | | ✓ | | ✓ |
| ADR-017 Alcance (todas las vistas describen solo la versión 1) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

Nota: EAC-01, EAC-02 y EAC-05 también se ven en el escenario [CU-02](diagramas/secuencia/cu02-consultar-texto.puml); EAC-03 en [CU-01](diagramas/secuencia/cu01-actualizar-informacion.puml); EAC-08 en [CU-03](diagramas/secuencia/cu03-vencer-vigencia.puml).

## 6. Conceptos transversales

| Concepto | Cómo se resuelve | Dónde se ve |
|----------|------------------|-------------|
| Operación sin conexión | Solo el Módulo Actualización tiene un adaptador de red (`ClienteBackend`); el chat y el vencimiento funcionan en modo avión | [ADR-012](adr/ADR-012-backend-local-y-carga-completa.md), [Procesos](vistas/02-procesos.md) |
| Red local sin Internet | El backend se alcanza por el punto de acceso de Windows (`192.168.137.1`), por HTTP; la app permite tráfico en claro solo hacia esa dirección | [backend-esperado.md](backend-esperado.md), [Física](vistas/04-fisica.md) |
| Gestión de modelos | Un único Gestor de modelos prepara (copia desde el APK), carga y libera los dos modelos | [ADR-013](adr/ADR-013-modelos-dentro-del-apk.md), [ADR-014](adr/ADR-014-motor-local-lfm-minilm.md) |
| Compatibilidad de vectores | La pregunta se vectoriza con el mismo modelo que el backend; la carga se rechaza si `/health/db` informa otro | [ADR-012](adr/ADR-012-backend-local-y-carga-completa.md), [ADR-014](adr/ADR-014-motor-local-lfm-minilm.md) |
| Veracidad y trazabilidad | Bandas ALTA / MEDIA / BAJA, prompt del sistema, citas con documento y página | [ADR-016](adr/ADR-016-rag-por-bandas-y-prompt.md), [prompt-sistema.md](prompt-sistema.md) |
| Vigencia | `expira_en` persistido; todo acceso a documentos pasa por el Módulo Vigencia; el reloj es un puerto | [ADR-015](adr/ADR-015-vigencia-24h-y-desinstalacion.md) |
| Manejo de errores | Los adaptadores traducen fallas a errores de aplicación (`BackendNoDisponible`, `ModeloEmbeddingIncompatible`, `CargaIncompleta`, `ModeloNoDisponible`, `MemoriaInsuficiente`, `SinCargaVigente`) y la pantalla dice qué hacer; la app nunca se cierra por ellos | [Desarrollo](vistas/03-desarrollo.md) |
| Configuración | `.env` con `EXPO_PUBLIC_BACKEND_URL` (ignorado en git; plantilla en `.env.example`); umbrales, top-k, 24 h y datos de los modelos como constantes versionadas | [backend-esperado.md](backend-esperado.md) |
| Privacidad | Nada sale del teléfono; documentos y conversaciones se borran al vencer | [Datos](vistas/05-datos.md), [ADR-015](adr/ADR-015-vigencia-24h-y-desinstalacion.md) |
| Experiencia en campo | Botones de 56 dp, alto contraste, vigencia siempre visible, tema de montaña y páramo | EAC-06 |
| Estructura general | Clean Architecture; `src/app/` solo rutas | [ADR-008](adr/ADR-008-estructura-general.md) |
| Construcción | CNG, development build y APK con EAS | [ADR-011](adr/ADR-011-build-android.md) |

## 7. Decisiones de diseño

| ADR | Decisión | Estado | Drivers |
|-----|----------|--------|---------|
| [ADR-001](adr/ADR-001-motor-inferencia-local.md) | llama.rn + Qwen3.5 GGUF + mmproj | Reemplazado por ADR-014 | — |
| [ADR-002](adr/ADR-002-imagenes-e-identificacion.md) | Imagen cruda a Qwen + embeddings de imagen aparte | Pospuesto por ADR-017 | — |
| [ADR-003](adr/ADR-003-voz-entrada-salida.md) | whisper.rn + expo-speech | Pospuesto por ADR-017 | — |
| [ADR-004](adr/ADR-004-respuesta-streaming.md) | Streaming con actualización agrupada | Aceptado | EAC-01, RT-03 |
| [ADR-005](adr/ADR-005-persistencia-local.md) | SQLite + sqlite-vec, espejo de PostgreSQL | Reemplazado por ADR-012 | — |
| [ADR-006](adr/ADR-006-sincronizacion.md) | Pull por cursor + outbox de reseñas | Reemplazado por ADR-012 | — |
| [ADR-007](adr/ADR-007-descarga-post-instalacion.md) | Manifest + descargas reanudables | Reemplazado por ADR-013 | — |
| [ADR-008](adr/ADR-008-estructura-general.md) | Clean Architecture en la app | Aceptado | PA-01, EAC-07 |
| [ADR-009](adr/ADR-009-gestion-memoria-modelos.md) | Gestor de modelos por RAM | Reemplazado por ADR-014 | — |
| [ADR-010](adr/ADR-010-rag-y-veracidad.md) | RAG híbrido con "no encontrado" | Reemplazado por ADR-016 | — |
| [ADR-011](adr/ADR-011-build-android.md) | Build Android con EAS | Aceptado | RT-04, PA-09 |
| [ADR-012](adr/ADR-012-backend-local-y-carga-completa.md) | Carga completa desde el backend local | Aceptado | CU-01, RT-01, EAC-03, PA-03, PA-04 |
| [ADR-013](adr/ADR-013-modelos-dentro-del-apk.md) | Modelos dentro del APK | Aceptado | RT-05, EAC-02, EAC-07, PA-09 |
| [ADR-014](adr/ADR-014-motor-local-lfm-minilm.md) | llama.rn con LFM2.5-350M y MiniLM | Aceptado | RT-01, RT-02, RT-03, EAC-01, EAC-04, PA-02 |
| [ADR-015](adr/ADR-015-vigencia-24h-y-desinstalacion.md) | Vigencia de 24 h, notificación y desinstalación | Aceptado | CU-03, RN-02, EAC-08, PA-10 |
| [ADR-016](adr/ADR-016-rag-por-bandas-y-prompt.md) | Bandas de similitud y prompt del sistema | Aceptado | CU-02, EAC-05, R-02, PA-07 |
| [ADR-017](adr/ADR-017-alcance-version-1.md) | Alcance de la versión 1 | Aceptado | Todos |

Todos los drivers de [drivers.md](drivers.md) quedan cubiertos por al menos un ADR vigente. PA-05 (errores), PA-06 (configuración) y PA-08 (privacidad) se resuelven como conceptos transversales en la sección 6.

## 8. Requisitos de calidad

| EAC | Atributo | Prioridad | ADR | Se verifica en |
|-----|----------|-----------|-----|----------------|
| EAC-01 | Eficiencia de desempeño (tiempo) | Alta | ADR-004, ADR-014, ADR-016 | Spec de CU-02; medición de TTFT y tokens/s en el dispositivo de referencia |
| EAC-02 | Disponibilidad sin conexión | Alta | ADR-012, ADR-013 | Specs de CU-02 y CU-03 en modo avión |
| EAC-03 | Fiabilidad de la carga | Alta | ADR-012 | Spec de CU-01; cortes de red provocados |
| EAC-04 | Eficiencia de desempeño (recursos) | Media | ADR-014 | Spec de CU-02; sesión de 30 consultas con perfilado de memoria |
| EAC-05 | Adecuación funcional (veracidad) | Alta | ADR-016 | Spec de CU-02; set de prueba de 50 preguntas |
| EAC-06 | Capacidad de interacción | Media | ADR-008 | Specs de CU-01 y CU-02; prueba con usuarios |
| EAC-07 | Mantenibilidad | Media | ADR-008, ADR-013, ADR-014 | Revisión del cambio de modelo |
| EAC-08 | Seguridad de la información (vigencia) | Alta | ADR-015 | Spec de CU-03; reloj de prueba y prueba con la app cerrada |

## 9. Riesgos y deuda técnica

| ID | Riesgo o deuda | Origen | Impacto | Respuesta |
|----|----------------|--------|---------|-----------|
| R-01 | Batería y temperatura por inferencia | [vision.md](vision.md) | Equipos que bajan el rendimiento en frío | Modelo pequeño, respuestas cortas, liberar modelos en segundo plano (ADR-014) |
| R-02 | Alucinaciones del modelo pequeño | [vision.md](vision.md) | Datos erróneos sobre especies o seguridad | Bandas decididas en el código, prompt estricto y citas (ADR-016) |
| R-03 | Fragmentación de hardware | [vision.md](vision.md) | Lentitud en gama baja | Modelos de 350M y 118M parámetros (ADR-014) |
| R-04 | Baja adopción si hay que escribir mucho en campo | [vision.md](vision.md) | Menor uso (OB-01) | Voz pospuesta (ADR-017); preguntas cortas, botones grandes (EAC-06) |
| R-06 | El usuario no da permiso de notificaciones | ADR-015 | No se entera del vencimiento hasta abrir la app | El bloqueo y el borrado funcionan igual al abrir; se pide el permiso tras la primera carga explicando para qué |
| DT-01 | Umbrales de las bandas (0,55 / 0,40) son valores iniciales | ADR-016 | Demasiados "consulta al guía" o respuestas con poco contexto | Calibrar con el set de prueba y los PDF reales antes de la prueba de campo |
| DT-02 | Tamaño, TTFT y RAM de LFM2.5-350M (Q4 o Q8) son estimaciones | [Física](vistas/04-fisica.md) | La cuantización elegida puede cambiar | Medir en el dispositivo de referencia |
| DT-03 | Tamaño final del APK con los modelos | ADR-013 | Instalación lenta o sin espacio | Medir el APK de `preview`; elegir la cuantización más pequeña que cumpla EAC-05 |
| DT-04 | Paridad de MiniLM en GGUF (llama.rn) con sentence-transformers del backend | ADR-014 | Vectores no comparables: recuperación mala | Comparar vectores de una muestra (coseno ≥ 0,99); si falla, ADR nuevo con ONNX |
| DT-05 | Cambiar la hora del teléfono alarga la vigencia | ADR-015 | La información dura más de 24 h | Aceptado en la versión 1; mitigación posible: guardar también el tiempo desde el arranque y detectar saltos |
| DT-06 | Ahorro de batería de algunos fabricantes retrasa notificaciones | ADR-015 | Aviso tardío | El bloqueo no depende de la notificación; medir en el dispositivo de referencia |
| DT-07 | sqlite-vec es pre-1.0 | ADR-012 | Cambios de API | Aislado en el Adaptador SQLite |
| DT-08 | El dispositivo de referencia no está fijado (marca y modelo) | EAC-01, EAC-04 | Las medidas no son comparables | Acordarlo con los guías y el operador |
| DT-09 | El backend no devuelve un endpoint "solo última versión" | [backend-esperado.md](backend-esperado.md) | La app debe filtrar versiones | La app guarda solo la versión más alta de cada `name` |

## 10. Glosario

| Término | Definición | Nombre en el código |
|---------|------------|---------------------|
| Computador administrador | Equipo donde corre el backend RAG y su punto de acceso Wi-Fi | — |
| Backend RAG | API FastAPI del computador administrador ([API.md](../API.md)) | — |
| Carga | Una actualización exitosa de la información: cuándo se hizo, cuándo vence y con qué modelo | `Carga` |
| Estado de la carga | `sin_datos`, `cargando`, `vigente`, `vencida` | `EstadoCarga` |
| Vigencia | Las 24 h durante las que la información está disponible | `Vigencia`, `expiraEn` |
| Documento | Una versión de un PDF vectorizado en el backend (`Fauna_v2.pdf`) | `Documento` |
| Fragmento | Trozo de un documento con su página y su vector; unidad de recuperación | `Fragmento` |
| Similitud | Producto punto entre el vector de la pregunta y el del fragmento (1 − distancia coseno) | `similitud` |
| Banda | Clasificación de la mejor similitud: ALTA, MEDIA o BAJA | `Banda` |
| Prompt del sistema | Instrucciones fijas que recibe el modelo ([prompt-sistema.md](prompt-sistema.md)) | `PROMPT_SISTEMA` |
| Conversación / Mensaje | Sesión de chat y cada turno | `Conversacion`, `Mensaje` |
| Cita | Fragmento que respalda una respuesta, con documento, página y similitud | `Cita` |
| Modelo local | Archivo GGUF que trae el APK y su estado de preparación | `ModeloLocal` |
| TTFT | Tiempo hasta el primer token visible | `ttftMs` |
| Embedding | Vector numérico de 384 valores que representa un texto | — |
| Motor de inferencia | Puerto para generar texto en streaming | `MotorInferencia` |
| Codificador de texto | Puerto para calcular el embedding de la pregunta | `CodificadorTexto` |
| Buscador vectorial | Puerto para buscar los k fragmentos más cercanos | `BuscadorVectorial` |
| Gestor de modelos | Servicio que prepara, carga y libera los modelos | `GestorModelos` |
| Cliente del backend | Puerto para hablar con el backend RAG | `ClienteBackend` |
| Reloj / Notificador / Desinstalador | Puertos de la hora actual, las notificaciones locales y el diálogo de desinstalación | `Reloj`, `Notificador`, `Desinstalador` |
