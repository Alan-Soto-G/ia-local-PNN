/** Sesión de chat; hay una por carga vigente y se borra al vencer (vista lógica). */
export interface Conversacion {
  readonly id: string;
  /** ISO-8601 UTC. */
  readonly iniciadaEn: string;
}
