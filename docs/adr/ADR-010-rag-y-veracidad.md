# ADR-010: Recuperación local (RAG) con fuentes citadas y respuesta de "no encontrado"

## Estado

Aceptado (2026-11-26)

## Contexto

Un modelo pequeño inventa datos cuando no sabe ([R-02](../vision.md)). Toda la información debe venir de contenido validado ([RN-01](../drivers.md#3-restricciones)) y cada respuesta debe poder rastrearse a su fuente ([EAC-05](../drivers.md#eac-05-adecuación-funcional-veracidad-de-las-respuestas), [PA-07](../drivers.md#4-preocupaciones-arquitectónicas)). Además, el contexto que se le pasa al modelo afecta el TTFT ([RT-03](../drivers.md#3-restricciones)). Casos de uso: CU-01, CU-02, CU-07, CU-11.

## Alternativas consideradas

- **A) Solo el conocimiento del modelo.** Sin trazabilidad y con alucinaciones.
- **B) Ajuste fino (fine-tuning) con los documentos del parque.** Fuera de alcance según la visión, y no da citas.
- **C) RAG local.** Recuperar fragmentos y fichas de la base local y pasarlos en la instrucción, con la orden de responder solo con ellos y citarlos.

## Decisión

Se elige la opción C.

- Búsqueda híbrida: kNN en `vec_fragmento` (vector de la pregunta, mismo modelo de embeddings que el backend) + FTS5 en `fts_fragmento` (nombres científicos y comunes) + protocolos de mínimo impacto y seguridad cuando la pregunta trata de comportamiento en el parque.
- Se pasan como máximo k fragmentos (de 4 a 6) y un historial corto, para que la instrucción no supere unos 1.500 tokens.
- Instrucción del sistema: responder solo con el contexto, adaptar el lenguaje al perfil (infantil, general, especializado) y al idioma, citar las fuentes por su número, y si el contexto no alcanza decir "no lo encontré en la información validada del parque".
- Umbral de similitud: si ningún resultado lo supera, no se llama al modelo para inventar; se responde "no encontrado" (EAC-05).
- Cada respuesta guarda sus Citas (fragmento o especie, con su similitud), que la pantalla muestra con enlace a la ficha o al PDF.
- El set de prueba de 50 preguntas validado por el biólogo mide EAC-05 en cada cambio de modelo o de instrucción.

## Consecuencias

### Positivas

- Respuestas trazables y acotadas al catálogo.
- Agregar conocimiento es agregar documentos en el backend, sin tocar el modelo.

### Negativas y costos aceptados

- La calidad depende de cómo el backend parta los PDF en fragmentos.
- Las preguntas generales fuera del catálogo reciben "no encontrado" aunque el modelo pudiera responderlas.

### Vistas que modifica

[Lógica](../vistas/01-logica.md) (Cita), [Datos](../vistas/05-datos.md) (`vec_fragmento`, `fts_fragmento`, `fuente_especie`), [Desarrollo](../vistas/03-desarrollo.md) (Módulo Consulta) y la secuencia [CU-01](../diagramas/secuencia/cu01-consultar-texto.puml).
