# ADR-005: Persistencia local en SQLite con sqlite-vec, espejo de PostgreSQL

## Estado

Reemplazado por [ADR-012](ADR-012-backend-local-y-carga-completa.md) (2026-11-26)

## Contexto

El teléfono debe guardar el conocimiento validado (especies, rutas, documentos), sus vectores, el historial de chat y las reseñas, y buscar por similitud sin conexión ([RT-01](../drivers.md#3-restricciones)). Ese conocimiento es una réplica de una base PostgreSQL externa que actualiza el backend ([qué se espera del backend](../backend-esperado.md)). Preocupación: [PA-03](../drivers.md#4-preocupaciones-arquitectónicas).

## Alternativas consideradas

- **A) Archivos JSON.** Simple, pero sin consultas, sin transacciones y con búsqueda vectorial en JavaScript sobre todo el catálogo.
- **B) SQLite (expo-sqlite) con sqlite-vec.** Base relacional con transacciones, FTS5 para texto y tablas virtuales `vec0` para kNN, todo en el mismo archivo `.db`. expo-sqlite trae sqlite-vec como extensión incluida (opción `withSQLiteVecExtension` del config plugin).
- **C) Base vectorial embebida aparte.** Más funciones de búsqueda, pero otro motor nativo y dos almacenes que mantener consistentes.

## Decisión

Se elige la opción B.

- Un archivo SQLite con el esquema de la [vista de datos](../vistas/05-datos.md). Las tablas espejo tienen los mismos ids (UUID) y columnas que en PostgreSQL, más `seq`, `actualizado_en` y `eliminado`.
- Vectores en tablas `vec0` de sqlite-vec (`vec_imagen_especie`, `vec_fragmento`) como float32, unidas por id. En PostgreSQL los mismos vectores van en columnas `vector(D)` de pgvector.
- Las descripciones van en texto plano; las imágenes y los PDF van como archivos en el almacenamiento de la app, y la base guarda su ruta (no BLOB).
- `fts_fragmento` (FTS5) complementa la búsqueda vectorial con palabras exactas, como los nombres científicos (ADR-010).
- Migraciones versionadas del esquema, aplicadas al abrir la app.
- Un solo adaptador (Adaptador SQLite) conoce SQL y sqlite-vec.
- sqlite-vec se activa en `app.json` con el config plugin de expo-sqlite; antes de configurarlo se verifica la opción en la doc de Expo v58.

## Consecuencias

### Positivas

- Búsqueda kNN, texto y relacional en un solo archivo, con transacciones (EAC-03).
- Mismo modelo de datos que el backend: la sincronización es un upsert por id.

### Negativas y costos aceptados

- sqlite-vec es pre-1.0: su API puede cambiar.
- La búsqueda en `vec0` es exacta (fuerza bruta). Con miles de fragmentos es suficiente; si el catálogo crece mucho, habrá que revisar.

### Vistas que modifica

[Procesos](../vistas/02-procesos.md) (Base local), [Desarrollo](../vistas/03-desarrollo.md) (Adaptador SQLite), [Datos](../vistas/05-datos.md).
