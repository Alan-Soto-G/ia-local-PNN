# ADR-014: Motor local con llama.rn: LFM2.5-350M para el chat y MiniLM multilingüe para vectorizar

## Estado

Aceptado (2026-11-26). Reemplaza a [ADR-001](ADR-001-motor-inferencia-local.md) y [ADR-009](ADR-009-gestion-memoria-modelos.md).

## Contexto

La versión 1 solo tiene chat de texto con RAG (ADR-017). Hacen falta dos modelos en el teléfono:

- Un modelo de lenguaje pequeño que redacte la respuesta a partir de los fragmentos: **LFM2.5-350M** (Liquid AI).
- Un modelo de embeddings de texto que vectorice la pregunta **con el mismo modelo que usó el backend** para los fragmentos: **paraphrase-multilingual-MiniLM-L12-v2**, 384 dimensiones, vectores normalizados ([API.md](../../API.md)). Si el teléfono usara otro modelo (por ejemplo multilingual-e5-small, también de 384 dimensiones) los vectores no serían comparables.

Drivers: RT-01, RT-02, RT-03, EAC-01, EAC-04, EAC-07, PA-02.

## Alternativas consideradas

- **A) llama.rn para generar y onnxruntime-react-native para los embeddings.** Dos motores nativos, dos formas de cargar y de liberar.
- **B) llama.rn para los dos.** llama.cpp soporta LFM2 y modelos BERT de embeddings (pooling `mean` y normalización), en GGUF.

## Decisión

Se elige la opción B.

- **Generación**: LFM2.5-350M en GGUF (cuantización Q8_0 o Q4_K_M según la medición de DT-02), contexto de 4.096 tokens, temperatura baja (0,2 a 0,3), máximo unos 256 tokens por respuesta, en streaming (ADR-004).
- **Embeddings**: paraphrase-multilingual-MiniLM-L12-v2 convertido a GGUF (F16 o Q8_0), contexto `embedding: true`, pooling `mean` y normalización L2, para reproducir lo que hace sentence-transformers en el backend. La similitud es el producto punto.
- **Paridad**: antes de dar por buena la conversión, se vectoriza en el teléfono una muestra de fragmentos y se compara con los vectores del backend; la similitud coseno debe ser ≥ 0,99 en todos (DT-04).
- **Gestor de modelos**: sigue siendo el único que carga y libera modelos (AGENTS.md). Como los dos son pequeños, ambos quedan residentes mientras el chat esté disponible; se liberan al pasar la app a segundo plano por más de unos minutos y al vencer la vigencia. Traduce las fallas a `ModeloNoDisponible` y `MemoriaInsuficiente`.
- Ya no se elige el tamaño del modelo según la RAM del equipo.

## Consecuencias

### Positivas

- Una sola librería nativa de IA (llama.rn); onnxruntime-react-native y whisper.rn salen de esta versión.
- Memoria total esperada de la app bastante por debajo de 1,5 GB (a medir, EAC-04).
- TTFT bajo por el tamaño del modelo (EAC-01).

### Negativas y costos aceptados

- Un modelo de 350M sigue reglas con menos fiabilidad que uno grande: por eso la decisión de "no sé" o "consulta al guía" la toma el código, no el modelo (ADR-016).
- Hay que convertir y verificar MiniLM a GGUF; si la paridad falla, se escribirá un ADR nuevo para usar ONNX.

### Vistas que modifica

[Procesos](../vistas/02-procesos.md) (Motor de inferencia), [Desarrollo](../vistas/03-desarrollo.md) (Adaptador llama.rn, Gestor de modelos), [Física](../vistas/04-fisica.md) (tamaños y RAM).
