import type { UmbralesBanda } from '../../dominio/Banda';

/** Constantes versionadas de CU-02 (ADR-016, prompt-sistema.md). */

/** Valores iniciales a calibrar con el set de prueba (DT-01). */
export const UMBRALES_BANDA: UmbralesBanda = { alta: 0.55, media: 0.4 };

/** Fragmentos que se buscan y máximo que recibe el modelo. */
export const TOP_K = 4;

/** Sistema + turno, en tokens del modelo de lenguaje. */
export const MAX_TOKENS_INSTRUCCION = 1_500;

export const TEMPERATURA = 0.2;
export const MAX_TOKENS_NUEVOS = 256;

/** Tiempo en segundo plano antes de liberar los modelos (ADR-014; spec 002). */
export const LIBERAR_EN_SEGUNDO_PLANO_MS = 5 * 60 * 1000;

/** Contexto del modelo de lenguaje (ADR-014). */
export const CONTEXTO_LENGUAJE = 4_096;
