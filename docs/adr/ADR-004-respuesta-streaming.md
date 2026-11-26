# ADR-004: Respuesta en streaming token a token

## Estado

Aceptado (2026-11-26)

## Contexto

Un modelo local en un teléfono genera a pocos tokens por segundo. Esperar la respuesta completa (de 10 a 30 s) rompe la conversación con el grupo. [RT-03](../drivers.md#3-restricciones) y [EAC-01](../drivers.md#eac-01-eficiencia-de-desempeño-comportamiento-temporal) piden el primer texto en 3 s o menos, y que el usuario pueda detener una respuesta que no le sirve. Casos de uso: CU-01, CU-02, CU-03, CU-07.

## Alternativas consideradas

- **A) Respuesta completa.** Simple, pero incumple EAC-01.
- **B) Re-render por cada token.** Cumple EAC-01, pero repintar la lista de mensajes 10 a 20 veces por segundo desde el puente nativo satura el hilo de JavaScript y la batería.
- **C) Streaming con agrupación.** El callback de `completion` de llama.rn entrega cada token; el caso de uso los acumula y la pantalla se actualiza en lotes (~50 ms), solo en la burbuja del mensaje en curso.

## Decisión

Se elige la opción C.

- `MotorInferencia.generar` devuelve un flujo de tokens (iterador asíncrono o callback) y permite detenerlo (`stopCompletion` en llama.rn).
- El Mensaje del asistente se crea en estado "generando" y su texto crece. Solo esa burbuja se vuelve a pintar; el resto de la lista está memoizado.
- Al detener, el mensaje queda en "detenido" con el texto parcial; al terminar, en "completo" con sus citas.
- Se mide el TTFT de cada mensaje (`mensaje.ttft_ms`) para verificar EAC-01 y alimentar las métricas de la reseña.
- La lectura en voz alta (ADR-003) consume el mismo flujo, por frases.

## Consecuencias

### Positivas

- El usuario ve texto en menos de 3 s y puede cortar la respuesta.
- Un solo flujo alimenta la pantalla y la voz.

### Negativas y costos aceptados

- El estado del mensaje es más complejo (cuatro estados en lugar de uno).
- Las citas solo se muestran al final, porque dependen de la respuesta completa.

### Vistas que modifica

[Lógica](../vistas/01-logica.md) (ciclo de vida del Mensaje), [Desarrollo](../vistas/03-desarrollo.md) (puerto MotorInferencia) y la secuencia [CU-02](../diagramas/secuencia/cu02-consultar-texto.puml).
