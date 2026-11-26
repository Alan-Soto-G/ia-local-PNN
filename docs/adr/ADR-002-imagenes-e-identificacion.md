# ADR-002: Imagen cruda al modelo multimodal y embeddings de imagen aparte para identificar

## Estado

Aceptado (2026-11-26)

## Contexto

El usuario fotografía una planta o un animal y pregunta qué es (CU-02). La respuesta debe salir del catálogo validado ([RN-01](../drivers.md#3-restricciones), [EAC-05](../drivers.md#eac-05-adecuación-funcional-veracidad-de-las-respuestas)) y sin conexión ([RT-01](../drivers.md#3-restricciones)). El backend guarda imágenes de referencia de cada especie con su descripción y quiere vectorizarlas.

La pregunta abierta era: ¿Qwen3.5 vectoriza las imágenes o hay que pasárselas vectorizadas?

- Qwen3.5 **recibe la imagen cruda** (bytes o ruta) y la codifica internamente con su encoder de visión (el archivo mmproj). Esos vectores internos son tokens para el modelo de lenguaje: no se pueden extraer de forma útil para buscar por similitud, y el modelo **no acepta** vectores calculados por otro modelo.
- Para buscar "¿a qué imagen del catálogo se parece esta foto?" se necesita un **modelo de embeddings de imagen** que dé un vector comparable, y que sea **el mismo** en el backend (imágenes de referencia) y en el teléfono (foto del usuario, que en campo no puede ir al backend).

## Alternativas consideradas

- **A) Solo Qwen3.5.** Pasar la foto y pedir que nombre la especie. Sin búsqueda en el catálogo: el modelo puede nombrar especies que no están en el parque (incumple EAC-05).
- **B) Describir y luego buscar.** Qwen describe la foto en texto, se vectoriza el texto y se buscan fichas. No agrega ningún modelo, pero pierde los rasgos visuales finos y depende de la calidad de la descripción.
- **C) Embeddings de imagen + Qwen como juez.** Un codificador de imagen (MobileCLIP o SigLIP en ONNX) vectoriza la foto, se buscan los k vecinos en `vec_imagen_especie`, y Qwen recibe la **imagen cruda** junto con las **fichas de los candidatos** y elige solo entre ellos o dice que no la encuentra.

## Decisión

Se elige la opción C, porque es la única que ata la respuesta al catálogo validado y, a la vez, aprovecha la visión de Qwen para elegir entre candidatos parecidos.

- Codificador: un modelo de embeddings de imagen ligero en ONNX (MobileCLIP-S o SigLIP base), ejecutado con `onnxruntime-react-native` detrás del puerto `CodificadorImagen`. El modelo exacto se fija con una medición en el dispositivo de referencia (DT-03).
- El backend usa **el mismo archivo de modelo y la misma versión** para vectorizar las imágenes de referencia; cada fila guarda `modelo_embedding` (ver la [vista de datos](../vistas/05-datos.md#3-cómo-se-guardan-las-imágenes)).
- En las dos bases se guarda la **descripción en texto plano** y el **vector en un tipo nativo** (pgvector / sqlite-vec), no como texto. La imagen original queda solo en el backend; al teléfono llega una miniatura.
- Umbral de similitud configurable: por debajo, la respuesta es "no la encuentro en el catálogo" con una descripción de rasgos.
- Fallback: si el codificador no está descargado, se usa la opción B y se avisa que la identificación es menos precisa.

## Consecuencias

### Positivas

- Las especies propuestas siempre existen en el catálogo (EAC-05).
- La foto nunca sale del teléfono (PA-08).
- Agregar una especie es solo agregar imágenes en el backend: el teléfono la reconoce después de sincronizar.

### Negativas y costos aceptados

- Un tercer runtime nativo (ONNX Runtime) y un modelo más, de 50 a 200 MB (RT-02).
- Cambiar el modelo de embeddings obliga a recalcular todos los vectores en el backend y a volver a bajarlos.

### Riesgos asumidos

- Fotos lejanas, movidas o de animales pequeños dan baja similitud. Mitigación: pedir otra foto o una más cercana y mostrar los candidatos con su miniatura para que el guía confirme.

### Vistas que modifica

[Procesos](../vistas/02-procesos.md) (Codificador de imagen), [Desarrollo](../vistas/03-desarrollo.md) (Módulo Identificación, Adaptador ONNX), [Datos](../vistas/05-datos.md) (`vec_imagen_especie`) y la secuencia [CU-02](../diagramas/secuencia/cu02-identificar-foto.puml).
