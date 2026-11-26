# Vista de procesos: diagrama de contenedores

> Nivel 2 de C4: se abre la caja y se hace zoom, qué se ejecuta y cómo se comunica. Diagrama: [02-procesos.puml](../diagramas/02-procesos.puml). Para integradores del sistema. En este contexto un contenedor no es Docker: es cualquier cosa que se ejecuta o guarda datos por separado. Aquí todos viven dentro del mismo APK, pero cada motor nativo tiene su propio ciclo de vida y su propia memoria.

## 1. Presentación principal

Diagrama de contenedores del Asistente: la App móvil (JavaScript) orquesta tres motores nativos de IA (inferencia, transcripción y codificación de imagen), una base SQLite con vectores y el almacenamiento de archivos. Hacia afuera solo hay dos conexiones de red, y las dos son opcionales y fuera de campo: el backend para sincronizar y Hugging Face para descargar modelos. La voz de salida la pone Android.

Diagrama: [diagramas/02-procesos.puml](../diagramas/02-procesos.puml)

## 2. Catálogo de elementos

| Elemento | Responsabilidad | Tecnología | Se comunica con |
|----------|-----------------|------------|-----------------|
| App móvil | Pantallas (chat, rutas, fichas, descargas, reseñas, ajustes), casos de uso, sincronizador y gestor de descargas (ADR-008) | Expo SDK 58, React Native 0.88, TypeScript, Expo Router | Todos los demás contenedores; backend y Hugging Face solo con conexión |
| Motor de inferencia | Genera texto en streaming con Qwen3.5 (0.8B, 2B o 4B en Q4), recibe imágenes por el proyector de visión (mmproj) y calcula embeddings de texto con un modelo GGUF de embeddings (ADR-001, ADR-004, ADR-010) | llama.rn sobre llama.cpp | App móvil (puente nativo); Archivos locales (carga el modelo) |
| Transcriptor | Convierte el audio grabado en texto en español o inglés (ADR-003) | whisper.rn sobre whisper.cpp | App móvil; Archivos locales |
| Codificador de imagen | Calcula el vector de la foto con el mismo modelo que usa el backend para las imágenes de referencia (ADR-002) | onnxruntime-react-native con MobileCLIP o SigLIP en ONNX | App móvil; Archivos locales |
| Base local | Espejo del conocimiento validado, tablas vectoriales, conversaciones, reseñas, cola de salida, estado de sincronización y de descargas (ADR-005) | expo-sqlite con la extensión sqlite-vec | App móvil |
| Archivos locales | Modelos, miniaturas de especies, PDF fuente, fotos y audios del usuario | Almacenamiento interno de la app (expo-file-system) | App móvil y motores nativos |
| Motor de voz de Android (externo) | Lee las respuestas en voz alta (ADR-003) | expo-speech sobre el TTS del sistema | App móvil |
| Backend de conocimiento (externo) | Publica cambios, manifest de paquetes y recibe reseñas ([qué se espera](../backend-esperado.md)) | No definido (propio o Supabase) | App móvil, por HTTPS |
| Hugging Face Hub (externo) | Sirve los archivos de modelos | HTTPS con rango de bytes | App móvil, solo por Wi-Fi |

## 3. Justificación

- RT-01 y EAC-02: todo lo que necesita una consulta (motores, base y archivos) está dentro del APK; las flechas de red no participan en CU-01 a CU-04.
- RT-02, EAC-04 y ADR-009: cada motor nativo se carga y libera por separado; el Transcriptor solo vive mientras transcribe.
- ADR-001: llama.rn da en una sola librería generación en streaming, visión (mmproj) y embeddings de texto.
- ADR-002: la búsqueda por foto necesita un vector comparable con los del backend; Qwen3.5 no lo da, por eso hay un Codificador de imagen aparte.
- ADR-003: whisper.rn cubre la entrada de voz; la salida usa el motor de Android y no ocupa memoria de la app.
- ADR-005: sqlite-vec permite la búsqueda kNN en la misma base SQLite, sin otro proceso.
- RT-05 y ADR-007: los modelos vienen de Hugging Face después de instalar, nunca dentro del APK.

## 4. Comportamiento

- [cu01-consultar-texto.puml](../diagramas/secuencia/cu01-consultar-texto.puml): App móvil → Motor (embedding) → Base local (kNN) → Motor (completion en streaming).
- [cu02-identificar-foto.puml](../diagramas/secuencia/cu02-identificar-foto.puml): App móvil → Codificador de imagen → Base local → Motor con la imagen.
- [cu03-consultar-voz.puml](../diagramas/secuencia/cu03-consultar-voz.puml): Transcriptor, luego el flujo de CU-01 y el motor de voz de Android.
- [cu05-descargar-paquetes.puml](../diagramas/secuencia/cu05-descargar-paquetes.puml): App móvil → Hugging Face → Archivos locales.
- [cu06-sincronizar.puml](../diagramas/secuencia/cu06-sincronizar.puml): App móvil ↔ Backend → Base local.

## 5. Vistas relacionadas

- [Contexto](../contexto.md): de dónde vienen los actores y los sistemas externos.
- [Física](04-fisica.md): en qué nodo corre cada contenedor.
- [Desarrollo](03-desarrollo.md): cómo se organiza por dentro la App móvil.
- [Datos](05-datos.md): el esquema de la Base local.
