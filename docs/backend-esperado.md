# Qué usa la app del backend RAG

> El backend existe y no es parte de este proyecto: es la API FastAPI del computador administrador, documentada en [API.md](../API.md). Este documento dice qué parte de esa API consume la app y qué espera de ella. La decisión está en [ADR-012](adr/ADR-012-backend-local-y-carga-completa.md).

## 1. Para qué existe

El administrador carga los PDF en el computador; el backend los fragmenta, los vectoriza (384 dimensiones, `paraphrase-multilingual-MiniLM-L12-v2`, normalizados) y los sirve por el punto de acceso Wi-Fi del computador, sin Internet. Es la única fuente de verdad del asistente. El teléfono solo le habla durante CU-01 (Actualizar información); el chat nunca lo consulta (RT-01).

## 2. Qué endpoints usa la app

Todos son `GET` y llevan el prefijo `/api`. La app nunca llama a los de escritura.

| Orden | Endpoint | Para qué | Qué valida la app |
|-------|----------|----------|-------------------|
| 1 | `/health/db` | Saber si el backend está y con qué modelo vectorizó | Responde en ≤ 5 s; `status = ok`; `tables_ready = true`; `embedding_model` y `dimensions` iguales a los del modelo que trae el APK (ADR-014) |
| 2 | `/documents` | Lista de documentos vigentes | Lista no vacía; cada documento con `status = processed` |
| 3 | `/documents/{id}/chunks?include_embeddings=true` | Fragmentos con texto, página y vector | `embedding` con 384 valores en cada fragmento; cantidad igual a `num_chunks` del documento |

Si cualquier validación falla, la carga se cancela y la base anterior queda igual (EAC-03).

## 3. Versiones de documentos

`/documents` devuelve **todas** las versiones (`Fauna_v1.pdf`, `Fauna_v2.pdf`…). La app guarda solo la versión más alta de cada `name`, para no responder con información reemplazada.

## 4. Qué no hace la app

- No sube documentos ni crea tablas.
- No envía preguntas, fotos, audio ni conversaciones (PA-08).
- No consulta al backend durante el chat.

## 5. Lo que la app necesita que el backend mantenga

- Que el modelo de embeddings siga siendo `paraphrase-multilingual-MiniLM-L12-v2` normalizado. Si cambia, hay que publicar un APK con el mismo modelo (ADR-013); mientras tanto la app rechaza la carga.
- Que `/health/db` siga informando `embedding_model` y `dimensions`.

## 6. Configuración en la app

| Variable | Valor por defecto | Notas |
|----------|-------------------|-------|
| `EXPO_PUBLIC_BACKEND_URL` | `http://192.168.137.1:8000/api` | IP fija del punto de acceso de Windows. Alternativas: `http://rag.home.arpa:8000/api` o `http://<equipo>.mshome.net:8000/api`; si el teléfono tiene "DNS privado" activo, usar la IP |

Se define en `.env` (ignorado en git, plantilla en `.env.example`) y como variable de entorno de EAS para los builds (ADR-011). No es un secreto. El tráfico es HTTP en la red local: la app lo permite solo para esa dirección (ADR-012).
