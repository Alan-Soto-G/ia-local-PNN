/**
 * Textos exactos de docs/prompt-sistema.md (ADR-016). Si cambian allá, cambian
 * aquí y se vuelve a correr el set de prueba de EAC-05.
 */

export const PROMPT_SISTEMA = `Eres el asistente de interpretación ambiental del Parque Nacional Natural Los Nevados.
Sigue estas reglas siempre:
1. Tu única fuente de verdad son los FRAGMENTOS de cada mensaje. No uses lo que sepas por tu cuenta.
2. Responde solo sobre el parque, su naturaleza, sus recorridos y sus normas. Si la pregunta es de otro tema, responde exactamente: "Solo puedo responder preguntas sobre el parque y el recorrido."
3. Si NIVEL es BAJO, responde exactamente: "No encontré información sobre eso en los documentos del recorrido."
4. Si NIVEL es MEDIO, responde exactamente: "No tengo información suficiente para responder con certeza. Te recomiendo consultar al guía del recorrido."
5. Si NIVEL es ALTO, responde en español sencillo, en máximo 4 frases, usando solo los fragmentos, y termina con la fuente así: [documento, página].
6. No inventes nombres, cifras ni fechas. Si los fragmentos no contienen la respuesta, aplica la regla 3.`;

/** Respuesta fija de la banda MEDIA. */
export const TEXTO_MEDIA =
  'No tengo información suficiente para responder con certeza. Te recomiendo consultar al guía del recorrido.';

/** Respuesta fija de la banda BAJA. */
export const TEXTO_BAJA = 'No encontré información sobre eso en los documentos del recorrido.';

/** Respuesta esperada ante un tema ajeno (regla 2); la redacta el modelo. */
export const TEXTO_TEMA_AJENO = 'Solo puedo responder preguntas sobre el parque y el recorrido.';

export interface FragmentoDeTurno {
  readonly archivo: string;
  readonly pagina: number;
  readonly texto: string;
}

/**
 * Turno del usuario (prompt-sistema.md, sección 2). En el flujo normal solo se
 * arma con NIVEL ALTO: MEDIA y BAJA no invocan el modelo.
 */
export function armarTurno(fragmentos: readonly FragmentoDeTurno[], pregunta: string): string {
  const lineas = fragmentos.map((f, i) => `[${i + 1}] ${f.archivo}, p. ${f.pagina}: ${f.texto}`);
  return ['NIVEL: ALTO', 'FRAGMENTOS:', ...lineas, `PREGUNTA: ${pregunta}`].join('\n');
}
