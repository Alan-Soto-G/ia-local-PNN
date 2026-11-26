# ADR-006: Sincronización incremental por cursor y envío de reseñas con outbox

## Estado

Aceptado (2026-11-26)

## Contexto

Los biólogos agregan y corrigen contenido en el backend (PostgreSQL). El teléfono debe bajar esos cambios cuando tiene conexión (CU-06), sin quedar inconsistente si la red se corta ([EAC-03](../drivers.md#eac-03-fiabilidad-recuperabilidad-de-descargas-y-sincronización)), y solo con contenido validado ([RN-01](../drivers.md#3-restricciones)). Las reseñas creadas sin señal deben subir una sola vez (CU-10, OB-02). El backend aún no está definido: puede ser propio o Supabase ([qué se espera](../backend-esperado.md)).

## Alternativas consideradas

- **A) Bajar la base completa cada vez.** Simple, pero mueve cientos de MB de vectores en cada sincronización.
- **B) Pull incremental por cursor + outbox.** El backend asigna un `seq` creciente a cada cambio; el teléfono pide "cambios desde mi último `seq`" por páginas, incluidas las filas borradas lógicamente, y aplica cada página en una transacción. Las reseñas van a una cola local y se envían en lotes con un UUID generado en el teléfono.
- **C) Replicación bidireccional con resolución de conflictos.** Innecesaria: el conocimiento es de solo lectura en el teléfono y las reseñas son de solo subida.

## Decisión

Se elige la opción B, porque los datos solo viajan en una dirección por grupo y no hay conflictos que resolver.

- Bajada: cambios paginados desde `estado_sync.ultimo_seq`. Cada página trae filas espejo, borrados lógicos y los vectores ya calculados por el backend. Se aplica en `BEGIN … COMMIT` y se actualiza `ultimo_seq` en la misma transacción.
- Los vectores los calcula siempre el backend, con los mismos modelos y versiones que tiene el teléfono (ADR-002). Si el backend anuncia otro modelo, el teléfono pide descargarlo (CU-05) antes de usar la búsqueda.
- Miniaturas y PDF se bajan después, como archivos, sin bloquear la sincronización de datos.
- Subida: `resena` + `cola_salida`. Un envío repetido con el mismo UUID se ignora en el backend (idempotente). Si falla, se suma un intento y se reintenta en la próxima sincronización.
- Disparo: al abrir la app o volver a primer plano con conexión, y con un botón "Actualizar". Nunca durante una consulta.
- La URL base se lee de `process.env.EXPO_PUBLIC_BACKEND_URL` (`.env`, ignorado en git). El puerto `ClienteSync` no depende de si el backend es propio o Supabase.

## Consecuencias

### Positivas

- Sincronizaciones cortas, que se pueden cortar y retomar (EAC-03).
- 0 reseñas perdidas o duplicadas.
- Los borrados del backend también llegan al teléfono.

### Negativas y costos aceptados

- El backend debe mantener `seq` y borrado lógico en todas las tablas publicadas.
- Si el teléfono pasa mucho tiempo sin sincronizar, la primera sincronización es larga.

### Vistas que modifica

[Contexto](../contexto.md), [Procesos](../vistas/02-procesos.md), [Desarrollo](../vistas/03-desarrollo.md) (Módulo Sincronización, Adaptador HTTP), [Datos](../vistas/05-datos.md) y la secuencia [CU-06](../diagramas/secuencia/cu06-sincronizar.puml).
