/** Constantes versionadas de CU-01 y de la vigencia (PA-06). */

/** Límite para `/health/db` (ADR-012, EAC-03: mensaje en ≤ 5 s). */
export const LIMITE_SALUD_MS = 5_000;

/** Límite de cada petición a `/documents` y `/documents/{id}/chunks` (spec 001, escenario de corte). */
export const LIMITE_DESCARGA_MS = 30_000;

/** Duración de la vigencia de una carga (RN-02, ADR-015). */
export const DURACION_VIGENCIA_MS = 24 * 60 * 60 * 1000;
