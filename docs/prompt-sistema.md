# Prompt del sistema del asistente

> Texto exacto que el Módulo Consulta le pasa a LFM2.5-350M (ADR-014) y reglas de cómo se usa ([ADR-016](adr/ADR-016-rag-por-bandas-y-prompt.md)). El código copia estos textos como constantes versionadas; si se cambian aquí, se cambian allá y se vuelve a correr el set de prueba de EAC-05.

## 1. Mensaje del sistema

Es corto a propósito: un modelo de 350M sigue mejor pocas reglas, numeradas y con frases fijas.

```text
Eres el asistente de interpretación ambiental del Parque Nacional Natural Los Nevados.
Sigue estas reglas siempre:
1. Tu única fuente de verdad son los FRAGMENTOS de cada mensaje. No uses lo que sepas por tu cuenta.
2. Responde solo sobre el parque, su naturaleza, sus recorridos y sus normas. Si la pregunta es de otro tema, responde exactamente: "Solo puedo responder preguntas sobre el parque y el recorrido."
3. Si NIVEL es BAJO, responde exactamente: "No encontré información sobre eso en los documentos del recorrido."
4. Si NIVEL es MEDIO, responde exactamente: "No tengo información suficiente para responder con certeza. Te recomiendo consultar al guía del recorrido."
5. Si NIVEL es ALTO, responde en español sencillo, en máximo 4 frases, usando solo los fragmentos, y termina con la fuente así: [documento, página].
6. No inventes nombres, cifras ni fechas. Si los fragmentos no contienen la respuesta, aplica la regla 3.
```

## 2. Turno del usuario

El caso de uso arma este texto; el usuario nunca lo ve.

```text
NIVEL: ALTO
FRAGMENTOS:
[1] Fauna_v2.pdf, p. 3: <texto del fragmento>
[2] Flora_v1.pdf, p. 1: <texto del fragmento>
PREGUNTA: <pregunta del usuario, tal como la escribió>
```

- `NIVEL` sale de la banda calculada por el código (sección 3).
- Cada fragmento lleva el `filename` y la `page` que entrega el backend ([API.md](../API.md)).
- Máximo 4 fragmentos, de mayor a menor similitud; todo el texto (sistema + turno) ≤ 1.500 tokens. Si no cabe, se recorta el fragmento de menor similitud.
- No se incluye el historial de la conversación en esta versión.

## 3. Bandas y textos fijos

| Banda | Mejor similitud (valores iniciales a calibrar, DT-01) | ¿Se invoca el modelo? | Respuesta |
|-------|------------------------------------------------------|-----------------------|-----------|
| ALTA | ≥ 0,55 | Sí, en streaming | La redacta el modelo con las reglas 1, 2, 5 y 6; se guardan las citas |
| MEDIA | ≥ 0,40 y < 0,55 | No | "No tengo información suficiente para responder con certeza. Te recomiendo consultar al guía del recorrido." |
| BAJA | < 0,40 | No | "No encontré información sobre eso en los documentos del recorrido." |

Las reglas 3 y 4 del mensaje del sistema son una segunda barrera: en el flujo normal el modelo solo recibe `NIVEL: ALTO`, pero si se cambiara esa decisión el modelo seguiría respondiendo los mismos textos.

## 4. Parámetros de generación

| Parámetro | Valor inicial |
|-----------|---------------|
| Temperatura | 0,2 |
| Máximo de tokens nuevos | 256 |
| Detener en | fin de turno del modelo |

## 5. Ejemplos para el set de prueba

| Pregunta | Banda esperada | Respuesta esperada |
|----------|----------------|--------------------|
| "¿Qué come el zorro rojo?" (está en Fauna.pdf) | ALTA | Respuesta de 1 a 4 frases que termina en `[Fauna_v1.pdf, página 1]` |
| "¿Cuántas especies de colibrí hay?" (tema cercano, sin dato) | MEDIA | Texto fijo de MEDIA |
| "¿Quién ganó el último mundial?" | BAJA | Texto fijo de BAJA |
| "Escríbeme un poema sobre el amor" con similitud alta accidental | ALTA | "Solo puedo responder preguntas sobre el parque y el recorrido." |
