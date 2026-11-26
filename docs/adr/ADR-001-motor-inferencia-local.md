# ADR-001: Motor de inferencia local con llama.rn y Qwen3.5 en GGUF

## Estado

Reemplazado por [ADR-014](ADR-014-motor-local-lfm-minilm.md) (2026-11-26)

## Contexto

El asistente debe razonar, ver imágenes y responder en streaming sin conexión ([RT-01](../drivers.md#3-restricciones)), dentro de 4 GB de RAM ([RT-02](../drivers.md#3-restricciones)) y con el primer token en 3 s o menos ([EAC-01](../drivers.md#eac-01-eficiencia-de-desempeño-comportamiento-temporal)). La app es Expo SDK 58 / React Native, solo para Android ([RT-04](../drivers.md#3-restricciones)). Se eligió la familia Qwen3.5 (0.8B, 2B, 4B y 9B), multimodal nativa y publicada en Hugging Face en formato GGUF con un proyector de visión (mmproj) aparte. Casos de uso: CU-01, CU-02, CU-07, CU-11.

## Alternativas consideradas

- **A) Llamatik.** Librería Kotlin Multiplatform sobre llama.cpp y whisper.cpp, con streaming y embeddings. No es una librería de React Native: habría que escribir y mantener un módulo nativo con la Expo Modules API que la envuelva. Además, en su documentación no se encontró soporte de entrada de imágenes (mmproj).
- **B) llama.rn.** Binding de React Native sobre llama.cpp, con New Architecture. Carga GGUF, inicializa el proyector multimodal (`initMultimodal` con la ruta del mmproj), genera con callback por token, detiene la generación y calcula embeddings. Se instala como dependencia y se usa en un development build.
- **C) Escribir un módulo nativo propio sobre llama.cpp.** Control total, pero es el mayor costo de construcción y de mantenimiento, sin ventaja funcional frente a B.

## Decisión

Se elige la opción B, porque cubre en una sola librería, sin código nativo propio, los tres usos del motor: generación en streaming, visión y embeddings de texto. La app queda detrás del puerto `MotorInferencia` (y `CodificadorTexto`), así que cambiar de librería no toca el dominio ([EAC-07](../drivers.md#eac-07-mantenibilidad-modificabilidad-del-modelo)).

Tamaños de modelo según la RAM del equipo (los decide el Gestor de modelos, ADR-009):

| RAM del equipo | Modelo por defecto | Cuantización |
|----------------|--------------------|--------------|
| Menos de 6 GB | Qwen3.5-0.8B + mmproj | Q4_K_M |
| 6 a 8 GB (referencia) | Qwen3.5-2B + mmproj | Q4_K_M |
| 8 GB o más | Qwen3.5-2B por defecto; 4B opcional en Ajustes | Q4_K_M |

El modo de razonamiento extendido (thinking) se desactiva por defecto para cumplir el TTFT; puede activarse para preguntas largas desde Ajustes. Se verifica en cada repositorio de Hugging Face si el mmproj viene aparte o embebido; el manifest lista los archivos exactos (ADR-007).

## Consecuencias

### Positivas

- Sin módulo nativo propio: menos riesgo y menos mantenimiento.
- Un solo runtime (llama.cpp) para generar, ver y vectorizar texto.
- El modelo se cambia por el manifest, sin publicar un APK nuevo.

### Negativas y costos aceptados

- llama.rn exige New Architecture y no funciona en Expo Go: se necesita un development build (ADR-011).
- Dependemos del ritmo de llama.rn para soportar modelos nuevos de Qwen.
- El modelo 0.8B razona peor; en equipos con poca RAM la calidad baja.

### Riesgos asumidos

- R-03: en equipos de gama baja el TTFT puede pasar de 3 s. Mitigación: el modelo 0.8B, contexto acotado (ADR-010) y precarga al abrir el chat (ADR-009).

### Vistas que modifica

[Procesos](../vistas/02-procesos.md) (Motor de inferencia), [Desarrollo](../vistas/03-desarrollo.md) (Adaptador llama.rn), [Física](../vistas/04-fisica.md) (tamaños por RAM).
