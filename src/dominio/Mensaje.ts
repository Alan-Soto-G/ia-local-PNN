import type { Banda } from './Banda';
import type { Cita } from './Cita';

export type RolMensaje = 'usuario' | 'asistente';

/** Ciclo de vida del mensaje del asistente (vista lógica). */
export type EstadoMensaje = 'generando' | 'completo' | 'detenido' | 'error';

/** Turno del usuario o del asistente. */
export interface Mensaje {
  readonly id: string;
  readonly conversacionId: string;
  readonly rol: RolMensaje;
  readonly texto: string;
  /** Nula en los mensajes del usuario. */
  readonly banda: Banda | null;
  readonly estado: EstadoMensaje;
  /** Tiempo hasta el primer token visible; solo en respuestas generadas. */
  readonly ttftMs: number | null;
  /** ISO-8601 UTC. */
  readonly creadoEn: string;
  readonly citas: readonly Cita[];
}

/** Estados finales: el mensaje ya no cambia. */
export function esFinal(estado: EstadoMensaje): boolean {
  return estado !== 'generando';
}
