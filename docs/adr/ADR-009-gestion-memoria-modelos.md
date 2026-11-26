# ADR-009: Gestión de memoria y ciclo de vida de los modelos

## Estado

Reemplazado por [ADR-014](ADR-014-motor-local-lfm-minilm.md) (2026-11-26)

## Contexto

Pueden convivir hasta cuatro modelos: lenguaje + mmproj, transcriptor, embeddings de texto y embeddings de imagen. La app no debe pasar de 4 GB de RAM ([RT-02](../drivers.md#3-restricciones), [EAC-04](../drivers.md#eac-04-eficiencia-de-desempeño-utilización-de-recursos)) ni cerrarse por falta de memoria. Los teléfonos de los guías varían mucho ([R-03](../vision.md)), la inferencia gasta batería y calienta el equipo ([R-01](../vision.md)), y el primer token debe llegar en 3 s o menos ([RT-03](../drivers.md#3-restricciones)). Preocupación: [PA-02](../drivers.md#4-preocupaciones-arquitectónicas).

## Alternativas consideradas

- **A) Cargar todo al abrir la app.** Menor latencia, pero excede la RAM en equipos de 6 GB.
- **B) Cargar y liberar en cada consulta.** Memoria mínima, pero cargar el modelo de lenguaje tarda varios segundos e incumple RT-03.
- **C) Un Gestor de modelos con política por tipo.** Decide qué modelo usar según la RAM del equipo y mantiene residente lo que se usa seguido.

## Decisión

Se elige la opción C. Un único Gestor de modelos (servicio de aplicación) es el único que carga y libera modelos.

| Modelo | Política |
|--------|----------|
| Lenguaje + mmproj | Se carga al abrir el chat y queda residente mientras el chat esté en primer plano; se libera al pasar la app a segundo plano por más de 2 minutos o ante una alerta de memoria del sistema |
| Embeddings de texto | Residente junto al de lenguaje (es pequeño); con llama.rn puede ser un segundo contexto |
| Transcriptor | Se carga al empezar a grabar y se libera al terminar de transcribir |
| Embeddings de imagen | Se carga al tomar la foto y se libera después de la búsqueda |

- Elección de tamaño por la RAM total (expo-device), según la tabla de ADR-001; el usuario puede bajar de tamaño en Ajustes.
- Contexto del modelo acotado (2048 a 4096 tokens) y historial corto en la instrucción (ADR-010).
- Los errores de memoria se traducen a `MemoriaInsuficiente`, y la app propone un modelo más pequeño en lugar de cerrarse.
- Uso de GPU (Vulkan u OpenCL) solo si el equipo lo soporta y mejora el rendimiento medido; si no, CPU.

## Consecuencias

### Positivas

- Memoria predecible y sin cierres (EAC-04).
- TTFT bajo porque el modelo de lenguaje ya está cargado (EAC-01).

### Negativas y costos aceptados

- La primera consulta después de abrir el chat espera la carga del modelo (varios segundos); se muestra un indicador.
- La primera consulta por voz o por foto suma la carga de su modelo.

### Riesgos asumidos

- R-01: sesiones largas calientan el equipo. Mitigación: liberar en segundo plano, limitar la longitud de la respuesta y registrar tokens por segundo para detectar la caída de rendimiento por temperatura.

### Vistas que modifica

[Desarrollo](../vistas/03-desarrollo.md) (Gestor de modelos), [Física](../vistas/04-fisica.md) (perfiles por RAM) y las secuencias [CU-02](../diagramas/secuencia/historico/cu02-identificar-foto.puml) y [CU-03](../diagramas/secuencia/historico/cu03-consultar-voz.puml).
