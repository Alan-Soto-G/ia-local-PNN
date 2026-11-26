# Vista de datos: modelo entidad-relación

> Cómo se guardan las entidades de la [vista lógica](01-logica.md) en la Base local (SQLite + sqlite-vec) y en su espejo en el backend (PostgreSQL + pgvector). Diagrama: [05-er.puml](../diagramas/05-er.puml). Para desarrolladores y para quien construya el backend. Notación: ER de ingeniería de la información (pata de gallo). Esta vista no es parte de 4+1: complementa la vista lógica con el modelo físico (ADR-005, ADR-006).

## 1. Presentación principal

Las tablas se dividen en cuatro grupos según la dirección en que viajan los datos:

| Grupo | Dirección | Quién escribe | Tablas |
|-------|-----------|---------------|--------|
| **Espejo** | backend → teléfono | Solo el Sincronizador (CU-06) | `grupo_taxonomico`, `especie`, `ficha_fauna`, `ficha_flora`, `imagen_especie`, `ecosistema`, `especie_ecosistema`, `ruta`, `ruta_ecosistema`, `punto_interes`, `especie_ruta`, `documento_fuente`, `fragmento_documento`, `fuente_especie`, `protocolo` |
| **Vectores e índices** | se calculan en el backend o se derivan en el teléfono | El Sincronizador | `vec_imagen_especie`, `vec_fragmento` (sqlite-vec) y `fts_fragmento` (FTS5, solo en el teléfono) |
| **Subida** | teléfono → backend | La app (CU-10) | `resena`, más `cola_salida` (solo local) |
| **Solo local** | no sale del teléfono (PA-08) | La app | `conversacion`, `mensaje`, `cita`, `paquete_modelo`, `estado_sync`, `preferencia` |

Toda tabla espejo lleva tres columnas de control además de las del diagrama: `seq` (número de cambio global que asigna el backend), `actualizado_en` (ISO-8601) y `eliminado` (0/1, borrado lógico). Los `id` son UUID generados en el backend, así que un registro tiene el mismo id en las dos bases.

Diagrama: [diagramas/05-er.puml](../diagramas/05-er.puml)

## 2. Catálogo de elementos

| Tabla | Qué guarda | Notas |
|-------|-----------|-------|
| `grupo_taxonomico` | Clase, orden o familia, jerárquico por `padre_id` | Permite preguntar "¿qué aves hay en esta ruta?" |
| `especie` | Supertipo de animales, plantas y hongos (`reino`) | Datos comunes a todas las especies |
| `ficha_fauna` / `ficha_flora` | Especialización 1:1 según el reino | Separa lo que solo aplica a animales o a plantas |
| `imagen_especie` + `vec_imagen_especie` | Foto de referencia: descripción en texto plano y vector | Ver sección 3 |
| `ecosistema`, `especie_ecosistema`, `ruta_ecosistema` | Páramo, bosque altoandino, superpáramo, glaciar, humedal | Relaciona especies y rutas sin pasar por un avistamiento |
| `ruta` | Recorrido con `tipo` (sendero, alta montaña, ciclomontañismo, cicloturismo, vehicular), sector, dificultad, altitudes y estado | El trazado va como GeoJSON en texto; no se usa para navegar (fuera de alcance de la visión), solo para mostrar el recorrido |
| `punto_interes` | Mirador, laguna, glaciar, refugio, punto de control, ordenados dentro de la ruta | Da contexto a los guiones de CU-07 |
| `especie_ruta` | Qué especie aparece en qué ruta, con frecuencia y temporada | Responde "en qué ruta aparecen qué animales y qué plantas"; opcionalmente cerca de un punto de interés |
| `documento_fuente` | PDF que es fuente de verdad, con quién lo validó y cuándo (RN-01) | El PDF completo es opcional en el teléfono (`ruta_local`); los fragmentos siempre están |
| `fragmento_documento` + `vec_fragmento` + `fts_fragmento` | Trozos de los PDF con su vector y su índice de texto | Unidad de recuperación del RAG; búsqueda híbrida: vector + palabras (ADR-010) |
| `fuente_especie` | De qué documento y página sale cada ficha | Trazabilidad de EAC-05 |
| `protocolo` | Reglas de mínimo impacto y de seguridad | Se recuperan siempre que la pregunta trate de comportamiento en el parque |
| `resena` | Reseña del visitante o del guía, más métricas del dispositivo si hubo consentimiento | Su `id` lo genera el teléfono: hace idempotente el envío (ADR-006). Mide OB-02 y el rendimiento real del asistente |
| `cola_salida` | Qué falta por subir y cuántos intentos lleva | Patrón outbox |
| `conversacion`, `mensaje`, `cita` | Historial del chat y las fuentes de cada respuesta | Nunca se suben |
| `paquete_modelo` | Estado de cada modelo o paquete del manifest | Ciclo de vida en la [vista lógica](01-logica.md) |
| `estado_sync` | Último `seq` aplicado y modelos de embedding vigentes | Si el backend anuncia otro modelo de embedding, se vuelven a bajar los vectores |
| `preferencia` | Clave–valor: voz activada, idioma, perfil, modelo elegido | — |

### Diferencias con el espejo en PostgreSQL

| Aspecto | SQLite (teléfono) | PostgreSQL (backend) |
|---------|-------------------|----------------------|
| Vectores | Tablas virtuales `vec0` de sqlite-vec (`vec_imagen_especie`, `vec_fragmento`), unidas por id | Columna `embedding vector(D)` de pgvector dentro de `imagen_especie` y `fragmento_documento`, con índice HNSW |
| Tipos | `TEXT`, `INTEGER`, `REAL`; fechas ISO-8601 en texto; booleanos 0/1 | `uuid`, `text`, `integer`, `numeric`, `timestamptz`, `boolean`, `jsonb` para el trazado |
| Contenido | Solo filas publicadas (`eliminado = 0` o borradas lógicamente) | También borradores y estado editorial (`borrador`, `en_revision`, `validado`, `publicado`), autor, historial |
| Archivos | Miniaturas y PDF descargados, con su ruta local | Originales en el almacenamiento de objetos, con su URL |
| `seq` | Se recibe y se guarda | Lo asigna una secuencia global en cada inserción o actualización |
| Tablas solo locales | Sí | No existen |
| `resena` | Origen | Destino; agrega `recibido_en` y el id anónimo del dispositivo |

## 3. Cómo se guardan las imágenes

Respuesta a la pregunta "¿en ambas bases se guarda lo ya vectorizado por el backend más su descripción, ambas en plano?":

- **La descripción, sí, en texto plano en las dos bases** (`imagen_especie.descripcion`). Es lo que se le pasa al modelo como contexto cuando la imagen sale como candidata.
- **El vector no se guarda como texto.** En PostgreSQL va en una columna `vector(D_IMG)` de pgvector. En SQLite va en la tabla virtual `vec_imagen_especie` de sqlite-vec, como float32 binario. Viaja en la sincronización como arreglo JSON o base64, y al llegar se inserta en `vec0`. Guardarlo como texto ocupa unas cuatro veces más e impide la búsqueda kNN.
- **La imagen original no se guarda en ninguna base.** En el backend vive en el almacenamiento de objetos y la tabla guarda su URL. En el teléfono solo se baja una miniatura (unos 50 KB en WebP) para mostrarla en la ficha y en el chat, y la tabla guarda su ruta.
- **La foto del usuario se vectoriza en el teléfono**, porque en campo no hay conexión con el backend. Por eso el teléfono tiene el **mismo modelo de embeddings de imagen, en la misma versión**, que usa el backend (ADR-002). Cada fila guarda `modelo_embedding`. Si el backend cambia de modelo, el teléfono descarga el nuevo modelo y los vectores nuevos antes de usar la identificación.
- Lo mismo aplica a los fragmentos de PDF: el texto va plano en `fragmento_documento.texto` y el vector en `vec_fragmento`, calculado con el modelo de embeddings de texto que también está en el teléfono para vectorizar la pregunta.

## 4. Justificación

- RT-01 y ADR-005: la búsqueda por similitud corre dentro de SQLite, sin servidor.
- ADR-006 y EAC-03: `seq` + `eliminado` permiten una sincronización incremental que también propaga borrados; el UUID del teléfono en `resena` evita duplicados.
- RN-01: el teléfono solo recibe filas publicadas, y `documento_fuente.validado_por` deja constancia de quién validó.
- EAC-05 y ADR-010: `fuente_especie` y `cita` hacen que cada respuesta apunte a un documento y una página.
- CU-08: `ruta.tipo` y `especie_ruta` modelan las rutas del PNN Los Nevados, incluidas las de ciclistas.
- PA-08: las tablas del grupo "solo local" no tienen contraparte en el backend.
- EAC-07: `modelo_embedding` y `estado_sync.modelo_emb_*` hacen explícito con qué modelo se calculó cada vector.

## 5. Comportamiento

[CU-06](../diagramas/secuencia/cu06-sincronizar.puml) aplica páginas de cambios sobre las tablas espejo y de vectores y vacía `cola_salida`. [CU-01](../diagramas/secuencia/cu01-consultar-texto.puml) consulta `vec_fragmento` y `fts_fragmento` y escribe `mensaje` y `cita`. [CU-02](../diagramas/secuencia/cu02-identificar-foto.puml) consulta `vec_imagen_especie`.

## 6. Vistas relacionadas

- [Lógica](01-logica.md): las entidades de negocio que estas tablas guardan.
- [Procesos](02-procesos.md): la Base local es un contenedor.
- [Qué se espera del backend](../backend-esperado.md): el otro lado del espejo.
