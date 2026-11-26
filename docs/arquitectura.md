# Documento de arquitectura: Asistente de interpretación ambiental offline (PNN Los Nevados)

> Versión 1.0 | Estado: completo hasta las vistas y los escenarios (+1). La sección 9 conserva la deuda técnica que se registre durante la implementación.

Este documento es el mapa del proyecto. Enlaza a los demás archivos y no los copia: un dato escrito en dos lugares termina diciendo dos cosas distintas. Su estructura es una adaptación de arc42.

## 1. Introducción y objetivos

El sistema es una app Android que funciona 100% sin conexión y sirve de guía de interpretación ambiental en alta montaña, empezando por el PNN Los Nevados. Es un chat multimodal: recibe texto, fotos y voz, responde en streaming y, si el usuario quiere, en voz alta. Identifica plantas, animales y rasgos del paisaje contra un catálogo validado, conoce las rutas del parque (senderos, alta montaña, ciclomontañismo y cicloturismo) y adapta el lenguaje al público y al idioma. Los modelos y paquetes se descargan después de instalar, y la base local se actualiza desde un backend cuando hay conexión. Los cuatro objetivos de negocio (OB-01 a OB-04) buscan reducir el tiempo de consulta en campo, mejorar la satisfacción de los visitantes, garantizar la operación sin señal y reducir la preparación de guiones.

Detalle: [Visión](vision.md)

Funcionalidades: [catálogo de casos de uso](drivers.md#1-casos-de-uso-y-casos-de-uso-primarios) (CU-01 a CU-13), cada uno enlazado a su carpeta de `specs/` cuando se especifique.

## 2. Restricciones

Seis restricciones: inferencia 100% local (RT-01), ≤ 3,5 GB y ≤ 4 GB de RAM (RT-02), primer token en ≤ 3 s (RT-03), solo Android 11+ ARM64 (RT-04), modelos descargados después de instalar (RT-05) y contenido validado por especialistas (RN-01).

Detalle: [Restricciones](drivers.md#3-restricciones)

## 3. Contexto del sistema

El sistema se relaciona con cuatro personas (Guía, Visitante, Biólogo/Curador y Administrador del área protegida; los dos últimos a través del backend) y tres sistemas externos (Backend de conocimiento PNN, Hugging Face Hub y el motor de voz de Android).

Detalle: [Contexto](contexto.md). Lo que se espera del backend: [backend-esperado.md](backend-esperado.md).

## 4. Estrategia de solución

| Driver | Enfoque | ADR |
|--------|---------|-----|
| RT-01, RT-02, RT-03, CU-01, EAC-01 | llama.rn con Qwen3.5 GGUF + mmproj; tamaño de modelo según la RAM | [ADR-001](adr/ADR-001-motor-inferencia-local.md) |
| CU-02, EAC-05, RN-01 | Imagen cruda a Qwen3.5 y embeddings de imagen aparte (ONNX), los mismos que el backend, para buscar candidatos | [ADR-002](adr/ADR-002-imagenes-e-identificacion.md) |
| CU-03, CU-04, EAC-06, R-04 | whisper.rn para voz a texto; expo-speech (voz del sistema) por frases | [ADR-003](adr/ADR-003-voz-entrada-salida.md) |
| EAC-01, RT-03 | Respuesta en streaming con actualización agrupada y opción de detener | [ADR-004](adr/ADR-004-respuesta-streaming.md) |
| PA-03, RT-01 | SQLite con sqlite-vec y FTS5, espejo de PostgreSQL + pgvector | [ADR-005](adr/ADR-005-persistencia-local.md) |
| CU-06, CU-10, EAC-03, RN-01 | Pull incremental por `seq` con borrado lógico; outbox de reseñas idempotente | [ADR-006](adr/ADR-006-sincronizacion.md) |
| CU-05, RT-05, EAC-03, EAC-07 | Manifest de paquetes; descargas por Wi-Fi reanudables con sha256 | [ADR-007](adr/ADR-007-descarga-post-instalacion.md) |
| PA-01, EAC-07 | Clean Architecture en `src/` con puertos para cada motor | [ADR-008](adr/ADR-008-estructura-general.md) |
| PA-02, EAC-04, RT-02, R-01, R-03 | Gestor de modelos: un modelo pesado residente; transcriptor y codificador bajo demanda | [ADR-009](adr/ADR-009-gestion-memoria-modelos.md) |
| EAC-05, R-02, PA-07 | RAG híbrido local, fuentes citadas, umbral y respuesta "no encontrado" | [ADR-010](adr/ADR-010-rag-y-veracidad.md) |
| RT-04, PA-09 | CNG + development build + APK con EAS, solo ARM64 | [ADR-011](adr/ADR-011-build-android.md) |

## 5. Vistas (4+1)

[Lógica](vistas/01-logica.md) | [Procesos](vistas/02-procesos.md) | [Desarrollo](vistas/03-desarrollo.md) | [Física](vistas/04-fisica.md) | [Datos (ER)](vistas/05-datos.md)

Escenarios (+1): [diagramas/secuencia/](diagramas/secuencia/) y la tabla de escenarios en [drivers.md](drivers.md#6-escenarios-1).

### Matriz de cobertura: drivers y ADR por vista

Ninguna fila vacía: todo driver y todo ADR se ven en al menos una vista.

| Driver o ADR | Contexto (marco) | Lógica | Procesos | Desarrollo | Física | Datos |
|--------------|:----------------:|:------:|:--------:|:----------:|:------:|:-----:|
| CU-01, CU-02, CU-03, CU-05, CU-06 (primarios) | ✓ | ✓ | ✓ | ✓ | | ✓ |
| EAC-01: primer texto en ≤ 3 s | | ✓ | ✓ | ✓ | | |
| EAC-02: 100% en modo avión | ✓ | | ✓ | | ✓ | |
| EAC-03: descargas y sync recuperables | | ✓ | ✓ | | | ✓ |
| EAC-04: RAM ≤ 4 GB, sin cierres | | | ✓ | ✓ | ✓ | |
| EAC-05: respuestas con fuente | | ✓ | | ✓ | | ✓ |
| EAC-06: voz y uso con guantes | | | ✓ | ✓ | | |
| EAC-07: cambiar modelo sin tocar el dominio | | ✓ | | ✓ | | ✓ |
| RT-01: 100% local | ✓ | | ✓ | | ✓ | |
| RT-02: almacenamiento y RAM | | | ✓ | | ✓ | |
| RT-03: TTFT ≤ 3 s | | | ✓ | ✓ | | |
| RT-04: solo Android | | | | ✓ | ✓ | |
| RT-05: descargas después de instalar | ✓ | ✓ | ✓ | | ✓ | |
| RN-01: contenido validado | ✓ | ✓ | | | | ✓ |
| ADR-001 Motor de inferencia | | | ✓ | ✓ | ✓ | |
| ADR-002 Imágenes e identificación | | ✓ | ✓ | ✓ | | ✓ |
| ADR-003 Voz | ✓ | | ✓ | ✓ | ✓ | |
| ADR-004 Streaming | | ✓ | | ✓ | | |
| ADR-005 Persistencia local | | | ✓ | ✓ | ✓ | ✓ |
| ADR-006 Sincronización | ✓ | | ✓ | ✓ | | ✓ |
| ADR-007 Descargas | | ✓ | ✓ | ✓ | ✓ | |
| ADR-008 Estructura | | ✓ | | ✓ | | |
| ADR-009 Memoria | | | ✓ | ✓ | ✓ | |
| ADR-010 RAG y veracidad | | ✓ | | ✓ | | ✓ |
| ADR-011 Build Android | | | | ✓ | ✓ | |

Nota: EAC-01, EAC-02 y EAC-05 también se ven en el escenario [CU-01](diagramas/secuencia/cu01-consultar-texto.puml); EAC-04 en [CU-02](diagramas/secuencia/cu02-identificar-foto.puml) y [CU-03](diagramas/secuencia/cu03-consultar-voz.puml); EAC-06 en [CU-03](diagramas/secuencia/cu03-consultar-voz.puml); EAC-03 en [CU-05](diagramas/secuencia/cu05-descargar-paquetes.puml) y [CU-06](diagramas/secuencia/cu06-sincronizar.puml).

## 6. Conceptos transversales

| Concepto | Cómo se resuelve | Dónde se ve |
|----------|------------------|-------------|
| Operación sin conexión | Ningún caso de uso de campo usa la red; solo Paquetes y Sincronización tienen adaptadores de red | [ADR-006](adr/ADR-006-sincronizacion.md), [ADR-007](adr/ADR-007-descarga-post-instalacion.md), [Procesos](vistas/02-procesos.md) |
| Gestión de modelos | Un único Gestor de modelos carga y libera según la RAM | [ADR-009](adr/ADR-009-gestion-memoria-modelos.md) |
| Veracidad y trazabilidad | RAG local, umbral de similitud, citas por mensaje, `validado_por` en los documentos | [ADR-010](adr/ADR-010-rag-y-veracidad.md), [Datos](vistas/05-datos.md) |
| Manejo de errores | Los adaptadores traducen fallas a errores de aplicación (`ModeloNoDisponible`, `MemoriaInsuficiente`, `PermisoDenegado`, `DescargaCorrupta`, `SinConexion`) y la pantalla dice qué hacer; la app nunca se cierra por ellos | [Desarrollo](vistas/03-desarrollo.md) |
| Configuración | `.env` con `EXPO_PUBLIC_BACKEND_URL` (ignorado en git; plantilla en `.env.example`); manifest para modelos; umbrales como constantes versionadas | [backend-esperado.md](backend-esperado.md), [ADR-007](adr/ADR-007-descarga-post-instalacion.md) |
| Privacidad | Fotos, audio y conversaciones solo en el almacenamiento privado de la app; las métricas de la reseña requieren consentimiento | [Datos](vistas/05-datos.md), [Física](vistas/04-fisica.md) |
| Experiencia en campo | Botones grandes, alto contraste, mantener para hablar, lectura en voz alta, tema visual de montaña y páramo | EAC-06, [ADR-003](adr/ADR-003-voz-entrada-salida.md) |
| Estructura general | Clean Architecture; `src/app/` solo rutas | [ADR-008](adr/ADR-008-estructura-general.md) |
| Construcción | CNG, development build y APK con EAS | [ADR-011](adr/ADR-011-build-android.md) |

## 7. Decisiones de diseño

| ADR | Decisión | Estado | Drivers |
|-----|----------|--------|---------|
| [ADR-001](adr/ADR-001-motor-inferencia-local.md) | llama.rn + Qwen3.5 GGUF + mmproj | Aceptado | RT-01, RT-02, RT-03, EAC-01, EAC-07 |
| [ADR-002](adr/ADR-002-imagenes-e-identificacion.md) | Imagen cruda a Qwen + embeddings de imagen aparte | Aceptado | CU-02, EAC-05, RN-01, PA-08 |
| [ADR-003](adr/ADR-003-voz-entrada-salida.md) | whisper.rn + expo-speech | Aceptado | CU-03, CU-04, EAC-06, R-04 |
| [ADR-004](adr/ADR-004-respuesta-streaming.md) | Streaming con actualización agrupada | Aceptado | EAC-01, RT-03 |
| [ADR-005](adr/ADR-005-persistencia-local.md) | SQLite + sqlite-vec, espejo de PostgreSQL | Aceptado | PA-03, RT-01, EAC-03 |
| [ADR-006](adr/ADR-006-sincronizacion.md) | Pull por cursor + outbox de reseñas | Aceptado | CU-06, CU-10, EAC-03, RN-01 |
| [ADR-007](adr/ADR-007-descarga-post-instalacion.md) | Manifest + descargas reanudables verificadas | Aceptado | CU-05, RT-05, EAC-03, EAC-07 |
| [ADR-008](adr/ADR-008-estructura-general.md) | Clean Architecture en la app | Aceptado | PA-01, EAC-07 |
| [ADR-009](adr/ADR-009-gestion-memoria-modelos.md) | Gestor de modelos por RAM | Aceptado | PA-02, EAC-04, RT-02, R-01, R-03 |
| [ADR-010](adr/ADR-010-rag-y-veracidad.md) | RAG local con citas y "no encontrado" | Aceptado | EAC-05, R-02, PA-07 |
| [ADR-011](adr/ADR-011-build-android.md) | Build Android con EAS | Aceptado | RT-04, PA-09 |

Todos los drivers de [drivers.md](drivers.md) quedan cubiertos por al menos un ADR. PA-05 (errores), PA-06 (configuración) y PA-08 (privacidad) se resuelven como conceptos transversales en la sección 6.

## 8. Requisitos de calidad

| EAC | Atributo | Prioridad | ADR | Se verifica en |
|-----|----------|-----------|-----|----------------|
| EAC-01 | Eficiencia de desempeño (tiempo) | Alta | ADR-001, ADR-004, ADR-009, ADR-010 | Spec de CU-01; medición de TTFT y tokens/s en el dispositivo de referencia |
| EAC-02 | Disponibilidad sin conexión | Alta | ADR-006, ADR-007 | Specs de CU-01 a CU-04 en modo avión |
| EAC-03 | Fiabilidad | Alta | ADR-006, ADR-007 | Specs de CU-05 y CU-06; prueba de corte de red |
| EAC-04 | Eficiencia de desempeño (recursos) | Alta | ADR-001, ADR-009 | Specs de CU-02 y CU-03; sesión de 30 consultas con perfilado de memoria |
| EAC-05 | Adecuación funcional (veracidad) | Alta | ADR-002, ADR-010 | Specs de CU-01 y CU-02; set de prueba de 50 preguntas validado por el biólogo |
| EAC-06 | Capacidad de interacción | Media | ADR-003 | Spec de CU-03; prueba con guías |
| EAC-07 | Mantenibilidad | Media | ADR-001, ADR-007, ADR-008 | Revisión del cambio de modelo: solo manifest y adaptador |

## 9. Riesgos y deuda técnica

| ID | Riesgo o deuda | Origen | Impacto | Respuesta |
|----|----------------|--------|---------|-----------|
| R-01 | Batería y temperatura por inferencia continua | [vision.md](vision.md) | Equipos que se apagan o bajan el rendimiento en frío | Liberar modelos en segundo plano, limitar la longitud de las respuestas y medir tokens/s (ADR-009) |
| R-02 | Alucinaciones del modelo pequeño | [vision.md](vision.md) | Datos erróneos sobre especies o seguridad | RAG con umbral y citas (ADR-010); candidatos del catálogo en la identificación (ADR-002) |
| R-03 | Fragmentación de hardware | [vision.md](vision.md) | Lentitud o cierres en gama baja | Tamaño de modelo según la RAM (ADR-001, ADR-009) |
| R-04 | Baja adopción si hay que escribir mucho en campo | [vision.md](vision.md) | Menor uso (OB-01) | Voz de entrada y salida (ADR-003), EAC-06 |
| R-05 | Voces de TTS no instaladas en algunos equipos | ADR-003 | Sin lectura en voz alta | Aviso y guía para instalarlas; la respuesta sigue en texto |
| DT-01 | El backend no está definido (propio o Supabase) | [backend-esperado.md](backend-esperado.md) | Sin datos reales para sincronizar | El puerto `ClienteSync` aísla la decisión; el paquete inicial de conocimiento del manifest permite arrancar |
| DT-02 | Tamaños, TTFT y RAM de los modelos son estimaciones | [Física](vistas/04-fisica.md) | La tabla de modelos por RAM puede cambiar | Medirlos en el dispositivo de referencia antes de fijar el manifest |
| DT-03 | El modelo exacto de embeddings de imagen (MobileCLIP o SigLIP) no está elegido | ADR-002 | Bloquea la carga de vectores en el backend | Comparar precisión y tamaño con fotos reales del parque |
| DT-04 | El modelo de embeddings de texto multilingüe (GGUF) no está elegido | ADR-010 | Bloquea la vectorización de los PDF | Comparar 2 o 3 candidatos con el set de prueba de EAC-05 |
| DT-05 | El dispositivo de referencia no está fijado (marca y modelo) | EAC-01, EAC-04 | Las medidas no son comparables | Acordarlo con los guías y el operador |
| DT-06 | sqlite-vec es pre-1.0 | ADR-005 | Cambios de API | Aislado en el Adaptador SQLite |

## 10. Glosario

| Término | Definición | Nombre en el código |
|---------|------------|---------------------|
| Especie | Animal, planta u hongo del catálogo validado | `Especie` |
| Ficha de fauna / de flora | Datos propios de animales o de plantas | `FichaFauna`, `FichaFlora` |
| Grupo taxonómico | Clase, orden o familia | `GrupoTaxonomico` |
| Imagen de especie | Foto de referencia con descripción y vector | `ImagenEspecie` |
| Ecosistema | Páramo, bosque altoandino, superpáramo, glaciar, humedal | `Ecosistema` |
| Ruta | Recorrido del parque: sendero, alta montaña, ciclomontañismo, cicloturismo o vehicular | `Ruta`, `TipoRuta` |
| Punto de interés | Mirador, laguna, glaciar, refugio o control dentro de una ruta | `PuntoInteres` |
| Presencia en ruta | Qué especie aparece en qué ruta, con frecuencia y temporada | `PresenciaEnRuta` |
| Documento fuente | PDF validado que es fuente de verdad | `DocumentoFuente` |
| Fragmento | Trozo de un documento fuente que se puede citar | `FragmentoDocumento` |
| Protocolo | Regla de mínimo impacto o de seguridad | `Protocolo` |
| Conversación / Mensaje | Sesión de chat y cada turno | `Conversacion`, `Mensaje` |
| Cita | Fuente que respalda una respuesta | `Cita` |
| Perfil del público | Infantil, general o especializado | `PerfilPublico` |
| Reseña | Opinión del visitante o del guía con métricas opcionales | `Resena` |
| Paquete de modelo | Modelo o paquete descargable del manifest | `PaqueteModelo` |
| Manifest | Lista de paquetes con URL, tamaño, sha256 y versión | `Manifest` |
| TTFT | Tiempo hasta el primer token visible | `ttftMs` |
| mmproj | Proyector de visión de Qwen3.5 que codifica la imagen | — |
| Embedding | Vector numérico que representa un texto o una imagen | — |
| Motor de inferencia | Puerto para generar texto y ver imágenes | `MotorInferencia` |
| Codificador de texto / imagen | Puertos para calcular embeddings | `CodificadorTexto`, `CodificadorImagen` |
| Transcriptor / Sintetizador | Puertos de voz a texto y de texto a voz | `Transcriptor`, `Sintetizador` |
| Buscador vectorial | Puerto para buscar los k vecinos más cercanos | `BuscadorVectorial` |
| Gestor de modelos | Servicio que carga y libera modelos según la RAM | `GestorModelos` |
| Cliente de sincronización | Puerto para hablar con el backend | `ClienteSync` |
| Cola de salida | Lo que falta por subir (outbox) | `cola_salida` |
| Secuencia de cambios | Número global creciente de cada cambio en el backend | `seq` |
