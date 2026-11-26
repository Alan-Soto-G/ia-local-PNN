# ADR-017: Alcance de la versión 1 y funciones pospuestas

## Estado

Aceptado (2026-11-26). Pospone [ADR-002](ADR-002-imagenes-e-identificacion.md) y [ADR-003](ADR-003-voz-entrada-salida.md).

## Contexto

Se decidió que la primera versión tenga solo tres funciones: actualizar la información desde el backend local, chatear por texto con respuestas basadas en los documentos, y el vencimiento a las 24 horas. El resto de la visión original (foto, voz, rutas, fichas, reseñas, guiones, traducción) queda para después. Hay que dejar claro qué decisiones anteriores siguen vigentes, cuáles se posponen y qué modelo se eligió para la consulta por imagen futura.

## Decisión

- **Dentro de la versión 1**: [CU-01](../drivers.md#1-casos-de-uso-y-casos-de-uso-primarios) Actualizar información, CU-02 Consultar por texto, CU-03 Vencer la vigencia.
- **Siguen vigentes**: [ADR-004](ADR-004-respuesta-streaming.md) (streaming), [ADR-008](ADR-008-estructura-general.md) (Clean Architecture), [ADR-011](ADR-011-build-android.md) (build con EAS; los permisos de cámara y micrófono no se piden en esta versión).
- **Pospuestos**:
  - Consulta por foto (ADR-002). El modelo elegido para cuando se retome es **MobileCLIP2**, multimodal, para búsquedas imagen→imagen y texto→imagen. Requiere que el backend entregue embeddings de imagen, que hoy no expone ([API.md](../../API.md)), y un ADR nuevo con el motor (ONNX u otro).
  - Voz de entrada y lectura en voz alta (ADR-003: whisper.rn, expo-speech).
  - Rutas, fichas de especies, reseñas, historial navegable, guiones por perfil, traducción español–inglés y reformulación de la pregunta ([CONTEXT.md](../../CONTEXT.md), sección 5.3).
- Las librerías de los ADR pospuestos (onnxruntime-react-native, whisper.rn, expo-speech) no se instalan en esta versión.

## Consecuencias

### Positivas

- Una versión pequeña y verificable; una sola librería nativa de IA.
- MobileCLIP2 queda registrado para no repetir la elección.

### Negativas y costos aceptados

- OB-02 (reseñas) y OB-04 (guiones) no se miden en esta versión.
- Sin voz, el uso con guantes depende del teclado (R-04 sigue abierto).

### Vistas que modifica

Todas: las vistas describen solo la versión 1; lo pospuesto aparece en la tabla de versiones futuras de [drivers.md](../drivers.md#7-versiones-futuras).
