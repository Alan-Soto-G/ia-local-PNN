# Vista de datos: modelo entidad-relación

> Cómo se guardan las entidades de la [vista lógica](01-logica.md) en la Base local (SQLite + sqlite-vec) y de dónde sale cada columna en la API del backend ([API.md](../../API.md)). Diagrama: [05-er.puml](../diagramas/05-er.puml). Para desarrolladores. Notación: ER de ingeniería de la información (pata de gallo). Esta vista no es parte de 4+1: complementa la vista lógica con el modelo físico (ADR-012).

## 1. Presentación principal

Las tablas se dividen en dos grupos, según qué pasa con ellas al vencer la vigencia:

| Grupo | Origen | Quién escribe | Tablas | Al vencer (ADR-015) |
|-------|--------|---------------|--------|---------------------|
| **Conocimiento** | backend → teléfono (CU-01) | Solo el Módulo Actualización | `carga`, `documento`, `fragmento`, `vec_fragmento` | Se borran (`carga` queda en `sin_datos`) |
| **Uso** | teléfono (CU-02); nunca sale (PA-08) | Solo el Módulo Consulta | `conversacion`, `mensaje`, `cita` | Se borran |

El estado de preparación de los modelos (ADR-013) no se guarda en la base: se deduce comprobando el archivo copiado y su sha256.

Diagrama: [diagramas/05-er.puml](../diagramas/05-er.puml)

## 2. Catálogo de elementos

| Tabla | Qué guarda | Columnas | Notas |
|-------|-----------|----------|-------|
| `carga` | La carga activa (una sola fila, `id = 1`) | `estado` (`sin_datos`, `vigente`, `vencida`), `cargado_en`, `expira_en` (ISO-8601 UTC), `modelo_embedding`, `dimensiones`, `total_documentos`, `total_fragmentos`, `url_backend` | `cargando` no se guarda: es un estado en memoria mientras corre la transacción |
| `documento` | Documentos vectorizados (solo la versión más alta de cada `nombre`) | `id` (el del backend), `nombre`, `version`, `archivo`, `paginas`, `num_fragmentos`, `sha256`, `creado_en` | — |
| `fragmento` | Trozos de los PDF | `id` (el del backend), `documento_id`, `indice`, `pagina`, `texto`, `caracteres` | Nunca cruza páginas (lo garantiza el backend) |
| `vec_fragmento` | Vector de cada fragmento | `fragmento_id`, `embedding float[384]`, distancia coseno | Tabla virtual `vec0` de sqlite-vec; igual que `vec_chunks` en el backend |
| `conversacion` | Sesión de chat | `id` (UUID local), `iniciada_en` | — |
| `mensaje` | Turnos | `id`, `conversacion_id`, `rol`, `texto`, `banda`, `estado`, `ttft_ms`, `creado_en` | `banda` es nula en mensajes del usuario |
| `cita` | Fuentes de cada respuesta ALTA | `mensaje_id`, `fragmento_id`, `orden`, `similitud` | Se borra junto con los fragmentos |

### De la API a la base local

| API ([API.md](../../API.md)) | Base local |
|------------------------------|------------|
| `GET /health/db` → `embedding_model`, `dimensions` | `carga.modelo_embedding`, `carga.dimensiones` (y se validan contra el modelo del APK) |
| `Document.id`, `name`, `version`, `filename`, `pages`, `num_chunks`, `sha256`, `created_at` | `documento.id`, `nombre`, `version`, `archivo`, `paginas`, `num_fragmentos`, `sha256`, `creado_en` |
| chunk `id`, `chunk_index`, `page`, `text`, `char_count` | `fragmento.id`, `indice`, `pagina`, `texto`, `caracteres` |
| chunk `embedding` (384 floats normalizados) | `vec_fragmento.embedding` como float32 binario |

### Diferencias con la base del backend

| Aspecto | Teléfono | Backend |
|---------|----------|---------|
| Versiones | Solo la más alta de cada documento | Todas |
| PDF originales | No se guardan | En `backend/storage/` |
| Tablas de uso (`conversacion`, `mensaje`, `cita`) | Sí | No existen |
| Vida de los datos | 24 h desde la carga | Permanente |

## 3. Cómo se hace una carga

1. Se baja todo a memoria (CU-01).
2. En una sola transacción: `DELETE` de `cita`, `mensaje`, `conversacion`, `vec_fragmento`, `fragmento`, `documento`; `INSERT` de lo nuevo; `UPDATE carga` con `vigente`, `cargado_en` y `expira_en`.
3. Si algo falla, `ROLLBACK`: la base anterior queda igual (EAC-03).

Que una carga nueva borre también las conversaciones evita citas que apunten a fragmentos que ya no existen.

## 4. Justificación

- RT-01 y ADR-012: la búsqueda por similitud corre dentro de SQLite, sin servidor.
- EAC-03: la carga es una transacción única.
- RN-02, PA-08 y ADR-015: todo lo que no es el modelo se borra al vencer.
- EAC-05 y ADR-016: `cita` → `fragmento` → `documento` da documento y página de cada respuesta.
- EAC-07: `carga.modelo_embedding` hace explícito con qué modelo se calcularon los vectores.

## 5. Comportamiento

[CU-01](../diagramas/secuencia/cu01-actualizar-informacion.puml) reemplaza el grupo Conocimiento. [CU-02](../diagramas/secuencia/cu02-consultar-texto.puml) consulta `vec_fragmento` y escribe `mensaje` y `cita`. [CU-03](../diagramas/secuencia/cu03-vencer-vigencia.puml) borra los dos grupos.

## 6. Vistas relacionadas

- [Lógica](01-logica.md): las entidades de negocio que estas tablas guardan.
- [Procesos](02-procesos.md): la Base local es un contenedor.
- [Qué usa la app del backend](../backend-esperado.md): el otro lado de la carga.
