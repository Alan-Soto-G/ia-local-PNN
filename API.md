# API del backend — RAG Ambiental (computador administrador)

API REST en FastAPI que recibe PDFs, los fragmenta, los vectoriza en **384 dimensiones** y sirve la base de
conocimiento a la interfaz del administrador y a los dispositivos conectados al punto de acceso. Funciona sin Internet.

- Formato: JSON (UTF-8). La carga de archivos usa `multipart/form-data`.
- Sin autenticación. Las operaciones de escritura están limitadas por **origen de red** (ver [Acceso](#acceso)).
- Documentación interactiva (Swagger): `GET /docs` · Esquema OpenAPI: `GET /openapi.json`

## Direcciones

| Desde | URL base |
|---|---|
| El propio computador administrador | `http://127.0.0.1:8000/api` |
| Dispositivos conectados al punto de acceso móvil (IP fija) | `http://192.168.137.1:8000/api` |
| Ídem, dominio propio | `http://rag.home.arpa:8000/api` |
| Ídem, dominio automático de Windows | `http://juak.mshome.net:8000/api` (`<nombre del equipo>.mshome.net`) |

`192.168.137.1` es la IP **fija** que Windows asigna al computador cuando comparte conexión (Zona con cobertura
inalámbrica móvil). Los dos dominios apuntan a esa IP y los resuelve el DNS del propio punto de acceso:
`rag.home.arpa` lo registra `start.bat` en la configuración única y `<equipo>.mshome.net` lo crea Windows solo.
Si un celular tiene "DNS privado" configurado con un proveedor concreto, no verá los dominios: usar la IP.

El backend escucha solo en `127.0.0.1` y en la IP del punto de acceso, no en otras redes del equipo (Wi-Fi externo, VPN).
El puerto se cambia con `start.ps1 -BackendPort <n>`.

## Acceso

| Operación | Desde el computador (`127.0.0.1`) | Desde la red del punto de acceso |
|---|---|---|
| Lectura (`GET`) | Sí | Sí |
| Escritura: `POST /documents/upload`, `POST /tables/create` | Sí | No: `403` |

Se puede desactivar con `ADMIN_LOCAL_ONLY=false` en `backend/.env`, aunque no se recomienda: cualquier visitante podría
cargar documentos.

CORS: solo se aceptan los orígenes del frontend (`http://localhost:5500`, `http://127.0.0.1:5500`, configurable con
`CORS_ORIGINS`). Una app Android nativa no está sujeta a CORS.

## Resumen de endpoints

| Método | Ruta | Descripción | Acceso |
|---|---|---|---|
| GET | [`/health`](#get-health) | La API responde | Todos |
| GET | [`/health/db`](#get-healthdb) | Estado de la base vectorial y del modelo | Todos |
| POST | [`/tables/create`](#post-tablescreate) | Crea las tablas que falten | Solo local |
| POST | [`/documents/upload`](#post-documentsupload) | Carga y vectoriza 1..N PDFs | Solo local |
| GET | [`/documents`](#get-documents) | Lista de documentos vectorizados | Todos |
| GET | [`/documents/{id}`](#get-documentsid) | Un documento | Todos |
| GET | [`/documents/{id}/chunks`](#get-documentsidchunks) | Fragmentos de un documento (y sus vectores) | Todos |

Todas las rutas llevan el prefijo `/api`.

---

## Salud

### `GET /health`

Indica si la API está en marcha.

**200**
```json
{ "status": "ok" }
```

### `GET /health/db`

Comprueba la conexión a SQLite, que la extensión sqlite-vec esté cargada, que existan las tablas y que el modelo de
embeddings esté descargado.

**200**
```json
{
  "status": "ok",
  "database": "reachable",
  "database_path": "C:\\...\\backend\\data\\knowledge.db",
  "sqlite_version": "3.45.3",
  "vec_version": "v0.1.9",
  "tables_ready": true,
  "embedding_model": "paraphrase-multilingual-MiniLM-L12-v2",
  "embedding_model_ready": true,
  "dimensions": 384,
  "latency_ms": 0.74
}
```

| Campo | Significado |
|---|---|
| `tables_ready` | Existen `documents`, `chunks` y `vec_chunks` |
| `embedding_model_ready` | El modelo está en `backend/models/`; si es `false`, `/documents/upload` responde `503` |

**503**: la base de datos no se puede abrir.
```json
{ "status": "error", "database": "unreachable", "detail": "<motivo>" }
```

---

## Tablas

### `POST /tables/create`

Crea las tablas `documents`, `chunks` y `vec_chunks` **solo si no existen**. Es idempotente y además se ejecuta
automáticamente al arrancar el backend, así que normalmente no hace falta llamarlo.

**200**
```json
{ "status": "ok", "created": [], "already_existed": ["documents", "chunks", "vec_chunks"] }
```

| Código | Cuándo |
|---|---|
| 403 | La petición no viene del propio computador |
| 500 | Error de SQLite al crear |

---

## Documentos

### Objeto `Document`

Lo devuelven `/documents/upload`, `/documents` y `/documents/{id}`.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | int | Identificador del documento (de esta versión) |
| `name` | string | Nombre base, sin extensión ni sufijo `_vN` (`Fauna`) |
| `version` | int | Versión del documento: 1, 2, 3… |
| `filename` | string | Nombre con el que se guardó: `<name>_v<version>.pdf` |
| `original_filename` | string | Nombre del archivo tal como se cargó |
| `sha256` | string | Hash del contenido; detecta duplicados |
| `size_bytes` | int | Tamaño del PDF |
| `pages` | int | Páginas del PDF |
| `num_chunks` | int | Fragmentos vectorizados |
| `embedding_model` | string | Modelo usado para los vectores |
| `dimensions` | int | Dimensiones de cada vector (384) |
| `chunk_size` | int | Tamaño máximo de fragmento, en caracteres |
| `chunk_overlap` | int | Caracteres compartidos entre fragmentos consecutivos |
| `processing_ms` | int | Tiempo de extracción, fragmentación y vectorización |
| `created_at` | string | Fecha ISO 8601 en UTC (`2026-11-26T15:04:05Z`) |
| `status` | string | `processed`, `duplicate` o `error` |
| `detail` | string \| null | Motivo, cuando `status` no es `processed` |

Cuando `status` es `error`, solo vienen `original_filename`, `status` y `detail`; el resto de campos es `null`.

### `POST /documents/upload`

Carga uno o varios PDFs y los vectoriza. Devuelve **un objeto `Document` por archivo, en el mismo orden**. Si un archivo
falla, los demás se procesan igual; por eso la respuesta es `200` aunque haya errores individuales: revisa `status` en
cada objeto.

**Petición**: `multipart/form-data`, campo `files` repetido una vez por archivo.

```bash
curl.exe -X POST http://127.0.0.1:8000/api/documents/upload ^
  -F "files=@Fauna.pdf;type=application/pdf" ^
  -F "files=@Flora.pdf;type=application/pdf"
```

```js
const form = new FormData();
for (const file of input.files) form.append('files', file, file.name);
const results = await fetch('http://127.0.0.1:8000/api/documents/upload', { method: 'POST', body: form })
  .then((r) => r.json());
```

**200**
```json
[
  {
    "id": 1, "name": "Fauna", "version": 1, "filename": "Fauna_v1.pdf", "original_filename": "Fauna.pdf",
    "sha256": "9f2c…", "size_bytes": 1884, "pages": 2, "num_chunks": 4,
    "embedding_model": "paraphrase-multilingual-MiniLM-L12-v2", "dimensions": 384,
    "chunk_size": 500, "chunk_overlap": 80, "processing_ms": 412,
    "created_at": "2026-11-26T15:04:05Z", "status": "processed", "detail": null
  },
  {
    "id": 1, "name": "Fauna", "version": 1, "filename": "Fauna_v1.pdf", "original_filename": "Fauna.pdf",
    "…": "…", "status": "duplicate", "detail": "Este contenido ya está vectorizado como Fauna_v1.pdf"
  },
  {
    "id": null, "name": null, "…": null, "original_filename": "escaneado.pdf",
    "status": "error", "detail": "PDF sin texto extraíble (posible escaneado, requiere OCR)"
  }
]
```

**Estados por archivo**

| `status` | Cuándo | ¿Se guarda? |
|---|---|---|
| `processed` | Vectorizado correctamente | Sí, como nueva versión |
| `duplicate` | Ya existe un documento con el mismo `sha256` | No; devuelve el existente |
| `error` | Ver tabla siguiente | No |

| `detail` cuando hay `error` | Causa |
|---|---|
| `El archivo no tiene extensión .pdf` | El nombre no termina en `.pdf` |
| `El contenido no es un PDF válido` | El contenido no empieza con `%PDF-` |
| `Supera el tamaño máximo de 50 MB` | Límite configurable con `MAX_UPLOAD_MB` |
| `No se pudo leer el PDF: …` | PDF dañado o protegido con contraseña |
| `PDF sin texto extraíble (posible escaneado, requiere OCR)` | El PDF son solo imágenes |
| `Error generando embeddings: …` / `Error guardando en la base de datos: …` | Fallo interno; no queda nada a medias |

**Versionado**: el nombre base es el nombre del archivo sin el sufijo `_vN`. Si se carga `Fauna.pdf` (o `Fauna_v3.pdf`) con
contenido distinto al ya guardado, se crea la siguiente versión: `Fauna_v2.pdf`. Las versiones anteriores se conservan.

**Errores de la petición completa**

| Código | Cuándo |
|---|---|
| 403 | La petición no viene del propio computador |
| 422 | No se envió el campo `files` |
| 503 | El modelo de embeddings no está descargado |

Es una petición **síncrona**: responde cuando terminan todos los archivos. Un PDF de decenas de páginas tarda unos segundos.

### `GET /documents`

Lista todos los documentos vectorizados (todas las versiones), del más reciente al más antiguo. `status` es siempre
`processed`.

**200**
```json
[
  { "id": 3, "name": "Fauna", "version": 2, "filename": "Fauna_v2.pdf", "pages": 1, "num_chunks": 1, "dimensions": 384, "…": "…" },
  { "id": 2, "name": "Flora", "version": 1, "filename": "Flora_v1.pdf", "pages": 1, "num_chunks": 2, "dimensions": 384, "…": "…" },
  { "id": 1, "name": "Fauna", "version": 1, "filename": "Fauna_v1.pdf", "pages": 2, "num_chunks": 4, "dimensions": 384, "…": "…" }
]
```

Lista vacía `[]` si aún no hay documentos.

### `GET /documents/{id}`

Un documento concreto.

**200**: objeto `Document`. **404**: `{ "detail": "Documento no encontrado" }`

### `GET /documents/{id}/chunks`

Fragmentos de un documento en orden, con su página. Opcionalmente incluye el vector de cada uno: es la forma de llevarse
la base de conocimiento a otro dispositivo.

| Query | Tipo | Defecto | Descripción |
|---|---|---|---|
| `include_embeddings` | bool | `false` | Incluir el vector de 384 floats de cada fragmento |

```
GET /api/documents/1/chunks?include_embeddings=true
```

**200**
```json
[
  {
    "id": 1,
    "chunk_index": 0,
    "page": 1,
    "text": "El zorro rojo (Vulpes vulpes) es un mamífero carnívoro de la familia Canidae. …",
    "char_count": 418,
    "embedding": [0.0213, -0.0871, 0.0442, "… 384 valores"]
  }
]
```

| Campo | Descripción |
|---|---|
| `chunk_index` | Posición del fragmento dentro del documento, desde 0 |
| `page` | Página del PDF de la que sale (desde 1); un fragmento nunca cruza páginas |
| `embedding` | Solo con `include_embeddings=true`. Vector **normalizado** (norma 1) en float32: la similitud coseno es el producto punto |

**404**: el documento no existe.

Para buscar con estos vectores en otro dispositivo, hay que vectorizar la pregunta con el **mismo modelo**
(`paraphrase-multilingual-MiniLM-L12-v2`, normalizado) y ordenar por producto punto.

---

## Almacenamiento (referencia)

Un solo archivo SQLite: `backend/data/knowledge.db`. Los PDFs originales se guardan en `backend/storage/<name>_v<version>.pdf`.

| Tabla | Contenido |
|---|---|
| `documents` | Un registro por versión de PDF (campos del objeto `Document`) |
| `chunks` | `id`, `document_id`, `chunk_index`, `page`, `text`, `char_count` |
| `vec_chunks` | Tabla virtual sqlite-vec: `chunk_id` (= `chunks.id`), `embedding float[384]`, distancia coseno |

Búsqueda KNN directa en SQLite (con la extensión sqlite-vec cargada):
```sql
SELECT c.text, c.page, v.distance
FROM vec_chunks v JOIN chunks c ON c.id = v.chunk_id
WHERE v.embedding MATCH :vector_float32_le AND k = 5
ORDER BY v.distance;
```
