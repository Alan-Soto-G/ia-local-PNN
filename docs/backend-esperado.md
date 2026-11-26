# Qué se espera del backend de conocimiento

> El backend todavía no existe y su diseño no es parte de este proyecto. Este documento dice qué necesita la app móvil de él, para que quien lo construya sepa qué entregar. Puede ser un backend propio o Supabase. Lo que la app hace de su lado está en [ADR-006](adr/ADR-006-sincronizacion.md), [ADR-007](adr/ADR-007-descarga-post-instalacion.md) y la [vista de datos](vistas/05-datos.md).

## 1. Para qué existe

Es la única fuente de verdad del conocimiento del PNN Los Nevados. Los biólogos y curadores cargan y validan contenido allí, y los teléfonos lo bajan cuando tienen conexión. El móvil nunca le consulta nada durante un recorrido (RT-01).

## 2. Qué debe hacer

| # | Responsabilidad | Por qué lo necesita la app |
|---|-----------------|----------------------------|
| 1 | Permitir que un curador cargue especies (con ficha de fauna o flora), imágenes con su descripción, rutas con sus puntos de interés, ecosistemas, presencia de especies por ruta, protocolos y documentos PDF fuente | Es el contenido de las tablas espejo de la [vista de datos](vistas/05-datos.md) |
| 2 | Manejar un estado editorial (borrador, en revisión, validado, publicado) y registrar quién validó y cuándo | RN-01: el teléfono solo recibe lo publicado |
| 3 | Guardar todo en PostgreSQL con pgvector, con los mismos ids (UUID) y columnas que las tablas espejo del teléfono | La sincronización es un upsert por id |
| 4 | Vectorizar cada imagen de referencia con el **mismo modelo de embeddings de imagen, en la misma versión**, que usa el teléfono, y guardar el nombre y la versión del modelo en cada fila | La foto del usuario se vectoriza en el teléfono y debe ser comparable (ADR-002) |
| 5 | Partir cada PDF en fragmentos (con su página), vectorizarlos con el mismo modelo de embeddings de texto del teléfono y guardarlos | Es la base de la recuperación local (ADR-010) |
| 6 | Guardar los originales (imágenes y PDF) en un almacenamiento de archivos y generar miniaturas livianas | El teléfono solo baja miniaturas y, si se pide, el PDF |
| 7 | Asignar a cada cambio un número de secuencia global creciente (`seq`) y usar borrado lógico | El teléfono pide "cambios desde mi último `seq`" (ADR-006) |
| 8 | Entregar los cambios por páginas: filas nuevas, modificadas y borradas, con sus vectores | Cada página se aplica completa o no se aplica (EAC-03) |
| 9 | Publicar un manifest de paquetes: modelos (lenguaje, mmproj, transcriptor, embeddings), sus URL, tamaño, sha256, versión y RAM mínima, más un paquete inicial de conocimiento | La app descarga después de instalar según el manifest (ADR-007) |
| 10 | Anunciar en el manifest qué modelos de embedding están vigentes; si cambian, recalcular todos los vectores | El teléfono sabe cuándo debe volver a bajar vectores |
| 11 | Recibir reseñas en lote, ignorar las repetidas por su UUID y confirmar cuáles recibió | 0 reseñas perdidas o duplicadas (EAC-03, OB-02) |
| 12 | Mostrar al administrador del parque las reseñas y las métricas del asistente | Medir OB-02 |

## 3. Qué no debe hacer

- No responder consultas del chat ni identificar fotos: eso ocurre solo en el teléfono.
- No recibir fotos, audios ni conversaciones de los usuarios (PA-08).
- No guardar secretos en la app: lo que el teléfono conoce (URL y, con Supabase, la anon key) es público.

## 4. Backend propio o Supabase

| Necesidad | Backend propio | Supabase |
|-----------|----------------|----------|
| PostgreSQL + pgvector | Se instala y opera | Incluido |
| API para bajar cambios y subir reseñas | Se programa | API REST automática sobre las tablas; los permisos se definen con reglas por fila (RLS): lectura de lo publicado e inserción de reseñas |
| Archivos (imágenes, PDF, miniaturas) | Se configura un almacenamiento de objetos | Storage incluido |
| Vectorizar imágenes y PDF con el modelo correcto | Se programa | **También hay que programarlo** (Edge Function o un proceso aparte), porque debe usar el mismo modelo que el teléfono |
| Panel del curador | Se programa | Se puede empezar con el panel de Supabase |

La decisión queda abierta. La app no depende de ella: habla con el backend a través del puerto `ClienteSync` (ADR-006).

## 5. Configuración en la app

La app lee la dirección del backend de variables de entorno públicas, definidas en `.env` (ignorado en git) a partir de `.env.example`:

| Variable | Cuándo |
|----------|--------|
| `EXPO_PUBLIC_BACKEND_URL` | Backend propio |
| `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Si se elige Supabase |

Las variables `EXPO_PUBLIC_` quedan en texto plano dentro del APK, así que nunca deben contener secretos. Para los builds de EAS se definen como variables de entorno de EAS (ADR-011).
