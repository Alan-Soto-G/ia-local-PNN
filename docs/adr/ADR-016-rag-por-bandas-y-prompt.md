# ADR-016: Recuperación por bandas de similitud y prompt del sistema

## Estado

Aceptado (2026-11-26). Reemplaza a [ADR-010](ADR-010-rag-y-veracidad.md).

## Contexto

La única fuente de verdad son los documentos vectorizados que llegan del backend (ADR-012). El modelo de lenguaje es muy pequeño (LFM2.5-350M, ADR-014) y tiende a inventar ([R-02](../arquitectura.md#9-riesgos-y-deuda-técnica)). Se pidió que el asistente:

- diga que no sabe cuando la similitud con la fuente es muy baja;
- remita a consultar al guía cuando la similitud es media;
- no responda nada fuera del contexto del parque y del recorrido.

Casos de uso: [CU-02](../drivers.md#1-casos-de-uso-y-casos-de-uso-primarios); drivers: EAC-01, EAC-05, PA-07, RN-01.

## Alternativas consideradas

- **A) Dejar todo en el prompt del sistema.** Un modelo de 350M no sigue umbrales numéricos con fiabilidad.
- **B) Decidir la banda en el código y usar el prompt como segunda barrera.** El caso de uso calcula la banda con la mejor similitud; solo invoca al modelo cuando hay contexto suficiente.

## Decisión

Se elige la opción B.

- **Recuperación**: se vectoriza la pregunta con MiniLM (ADR-014) y se buscan los k = 4 vecinos más cercanos en `vec_fragmento`. Similitud = 1 − distancia coseno (vectores normalizados).
- **Bandas** según la mejor similitud `s` (constantes versionadas en el código; valores iniciales a calibrar, DT-01):

  | Banda | Condición inicial | Comportamiento |
  |-------|-------------------|----------------|
  | ALTA | `s ≥ 0,55` | Se invoca el modelo con los fragmentos de similitud ≥ 0,40 (máximo 4) y se responde en streaming con citas |
  | MEDIA | `0,40 ≤ s < 0,55` | Texto fijo: "No tengo información suficiente para responder con certeza. Te recomiendo consultar al guía del recorrido." Sin invocar el modelo |
  | BAJA | `s < 0,40` | Texto fijo: "No encontré información sobre eso en los documentos del recorrido." Sin invocar el modelo |

- **Prompt del sistema**: el texto exacto, la plantilla del turno y los textos fijos viven en [docs/prompt-sistema.md](../prompt-sistema.md); el código los copia como constantes. Repite las reglas de las bandas y agrega la de rechazar temas ajenos, que el código no puede detectar solo con la similitud.
- **Presupuesto**: instrucción completa (sistema + fragmentos + pregunta) ≤ 1.500 tokens; sin historial de conversación en esta versión, para no mezclar temas en un modelo pequeño.
- **Citas**: toda respuesta en banda ALTA guarda sus Citas (fragmento, documento, página, similitud) y la pantalla las muestra. Las respuestas MEDIA y BAJA se guardan sin citas.
- El set de prueba (preguntas dentro y fuera de los documentos) mide EAC-05 en cada cambio de umbral, de prompt o de modelo.

## Consecuencias

### Positivas

- "No sé" y "consulta al guía" son deterministas y rápidos, sin gastar inferencia.
- El modelo solo trabaja cuando hay contexto relevante.

### Negativas y costos aceptados

- Los umbrales dependen del modelo de embeddings y de cómo el backend parte los PDF; hay que calibrarlos con datos reales.
- Una pregunta ajena con alta similitud accidental depende de la regla del prompt.

### Vistas que modifica

[Lógica](../vistas/01-logica.md) (Cita, Banda), [Desarrollo](../vistas/03-desarrollo.md) (Módulo Consulta), [Datos](../vistas/05-datos.md) (`cita`) y la secuencia [CU-02](../diagramas/secuencia/cu02-consultar-texto.puml).
