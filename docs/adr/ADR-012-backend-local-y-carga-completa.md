# ADR-012: Carga completa desde el backend local del computador administrador

## Estado

Aceptado (2026-11-26). Reemplaza a [ADR-005](ADR-005-persistencia-local.md) y [ADR-006](ADR-006-sincronizacion.md).

## Contexto

El plan cambió ([CONTEXT.md](../../CONTEXT.md)): ya no hay un backend en la nube con PostgreSQL ni sincronización incremental. El RAG lo construye un backend FastAPI que corre en el **computador administrador** y se sirve por su punto de acceso Wi-Fi, sin Internet ([API.md](../../API.md)). Ese backend ya fragmenta y vectoriza los PDF (384 dimensiones, `paraphrase-multilingual-MiniLM-L12-v2`, vectores normalizados) y los entrega por HTTP. La app no implementa el RAG del lado del servidor: solo lo consume. Casos de uso: [CU-01](../drivers.md#1-casos-de-uso-y-casos-de-uso-primarios); drivers: RT-01, EAC-02, EAC-03, PA-03, PA-04.

## Alternativas consideradas

- **A) Mantener la sincronización incremental por `seq` (ADR-006).** El backend no expone `seq` ni borrados lógicos; además la base vence a las 24 h (ADR-015), así que no hay nada que actualizar de forma incremental.
- **B) Consultar al backend en cada pregunta.** Rompe RT-01: el chat debe funcionar sin red.
- **C) Carga completa.** Al pulsar "Actualizar información", la app baja todos los documentos con sus fragmentos y vectores, y reemplaza la base local en una sola transacción.

## Decisión

Se elige la opción C.

- **Orden de llamadas** (todas `GET`, prefijo `/api`):
  1. `/health/db`: si no responde en 5 s o no da `status: ok`, se muestra un mensaje amigable ("No encontramos el punto de información del parque. Conéctate a su red Wi-Fi e inténtalo de nuevo.") y no se toca la base.
  2. Se comparan `embedding_model` y `dimensions` con el modelo de embeddings que trae el APK (ADR-014). Si no coinciden, la carga se rechaza con un mensaje que lo explica: los vectores no serían comparables.
  3. `/documents`: lista de documentos. Si viene vacía, se informa "aún no hay documentos cargados en el punto de información".
  4. `/documents/{id}/chunks?include_embeddings=true` por cada documento.
- **Todo o nada**: lo descargado se escribe en una transacción que borra la base de conocimiento anterior e inserta la nueva. Si cualquier paso falla, se hace rollback y la base anterior (y su vigencia) siguen intactas (EAC-03).
- **Al terminar con éxito** se registra la Carga (`cargado_en`, `expira_en = cargado_en + 24 h`, modelo, totales) y se entrega a ADR-015 para programar el vencimiento.
- **Persistencia local**: expo-sqlite con la extensión sqlite-vec. Tablas `documento`, `fragmento`, `vec_fragmento` (`float[384]`, distancia coseno), `carga`, `conversacion`, `mensaje`, `cita` ([vista de datos](../vistas/05-datos.md)). No hay FTS5 ni tablas espejo de especies o rutas.
- **Red**: solo el Módulo Actualización tiene un adaptador de red (`ClienteBackend`). La URL sale de `process.env.EXPO_PUBLIC_BACKEND_URL` (por defecto `http://192.168.137.1:8000/api`).
- **HTTP sin TLS**: el backend sirve HTTP en la red local. Android 9+ bloquea el tráfico en claro por defecto, así que se permite solo para la dirección del backend mediante configuración en `app.json` / config plugin (nunca editando `android/`, ADR-011).
- La app nunca llama a los endpoints de escritura (`POST /documents/upload`, `POST /tables/create`).

## Consecuencias

### Positivas

- Lógica simple: una carga es una foto completa del backend.
- El teléfono no puede quedar con una base mezclada o a medias.
- El backend ya usa SQLite + sqlite-vec, así que el formato de los vectores es el mismo en ambos lados.

### Negativas y costos aceptados

- Cada actualización vuelve a bajar todo (aceptable: unos pocos PDF, 384 floats por fragmento).
- Mientras dura la transacción se necesita espacio para la base vieja y la nueva.
- El tráfico va sin cifrar dentro de la red local del parque; no transporta datos del usuario (PA-08).

### Vistas que modifica

[Lógica](../vistas/01-logica.md) (Documento, Fragmento, Carga), [Procesos](../vistas/02-procesos.md), [Desarrollo](../vistas/03-desarrollo.md) (Módulo Actualización, ClienteBackend), [Física](../vistas/04-fisica.md) (Computador administrador), [Datos](../vistas/05-datos.md) y la secuencia [CU-01](../diagramas/secuencia/cu01-actualizar-informacion.puml).
