/**
 * Fragmento que respalda una respuesta ALTA, con documento y página (EAC-05, PA-07).
 */
export interface Cita {
  readonly fragmentoId: number;
  /** Archivo del documento (`Fauna_v1.pdf`). */
  readonly archivo: string;
  readonly pagina: number;
  readonly similitud: number;
  /** Posición entre las citas del mensaje, desde 1. */
  readonly orden: number;
}
