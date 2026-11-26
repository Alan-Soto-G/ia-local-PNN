# ADR-003: Voz a texto con whisper.rn y lectura en voz alta con expo-speech

## Estado

Pospuesto por [ADR-017](ADR-017-alcance-version-1.md) (2026-11-26)

## Contexto

En campo, escribir con frío, guantes o lluvia es difícil ([R-04](../vision.md), [EAC-06](../drivers.md#eac-06-capacidad-de-interacción-operabilidad-en-campo)). El usuario debe poder hablar (CU-03) y, si lo desea, escuchar la respuesta (CU-04), sin conexión ([RT-01](../drivers.md#3-restricciones)). Qwen3.5 no transcribe audio ni sintetiza voz, así que hacen falta otras piezas que quepan en la RAM y en el almacenamiento disponibles ([RT-02](../drivers.md#3-restricciones)).

## Alternativas consideradas

- **Entrada de voz**
  - **A1) Reconocimiento de voz de Android.** No ocupa espacio, pero sin conexión depende del equipo y del paquete de idioma, y en muchos equipos no funciona offline.
  - **A2) whisper.rn (whisper.cpp).** Modelo propio cuantizado (base o small, de 60 a 200 MB), offline garantizado, español e inglés.
- **Salida de voz**
  - **B1) expo-speech (TTS del sistema).** No descarga nada ni ocupa RAM de la app. Funciona sin red si el equipo tiene voces instaladas, cosa que en Android casi siempre ocurre con la voz de Google.
  - **B2) Modelo TTS propio (Piper, Kokoro u OuteTTS con el vocoder de llama.rn).** Voz uniforme en todos los equipos, pero suma de 80 a 300 MB, RAM y batería.

## Decisión

Se eligen **A2 + B1**. Para la entrada, whisper.rn, porque garantiza el funcionamiento offline en cualquier equipo. Para la salida, expo-speech, porque no suma memoria ni descarga y la voz del sistema es suficiente para leer respuestas.

- El Transcriptor se carga al empezar a grabar y se libera al terminar de transcribir (ADR-009).
- La transcripción se muestra antes de enviarla para que el usuario la corrija.
- La lectura en voz alta va por frases: se acumulan tokens del streaming (ADR-004) hasta un fin de frase y se envía esa frase a `Speech.speak`. Así se empieza a escuchar antes de que termine la generación.
- Si no hay voz instalada para el idioma, la app lo avisa y explica cómo instalarla; la respuesta sigue en texto.
- Los audios se graban en el almacenamiento privado de la app y no salen del teléfono (PA-08).

## Consecuencias

### Positivas

- Voz offline en cualquier equipo, sin nube.
- La salida de voz no ocupa RAM de la app ni espacio de descarga.

### Negativas y costos aceptados

- La calidad y el acento de la voz de salida dependen del equipo.
- whisper suma un modelo más al paquete y un pico de RAM mientras transcribe.

### Riesgos asumidos

- Viento fuerte en el páramo degrada la transcripción. Mitigación: mostrar el texto para corregir y sugerir acercar el micrófono.

### Vistas que modifica

[Procesos](../vistas/02-procesos.md) (Transcriptor, Motor de voz de Android), [Desarrollo](../vistas/03-desarrollo.md) (Módulo Voz y sus adaptadores) y la secuencia [CU-03](../diagramas/secuencia/historico/cu03-consultar-voz.puml).
