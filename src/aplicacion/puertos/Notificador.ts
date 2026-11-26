/**
 * `sin_decidir`: no concedido y Android todavía permite pedirlo.
 * `denegado`: no concedido y Android ya no muestra el diálogo.
 */
export type EstadoPermiso = 'concedido' | 'sin_decidir' | 'denegado';

/** Notificación local de vencimiento (ADR-015). */
export interface Notificador {
  estadoPermiso(): Promise<EstadoPermiso>;
  pedirPermiso(): Promise<EstadoPermiso>;
  /** Reemplaza cualquier aviso de vencimiento anterior. */
  programarVencimiento(fecha: Date): Promise<void>;
  cancelarVencimiento(): Promise<void>;
  /** `true` si la app se abrió tocando el aviso de vencimiento. */
  abiertaDesdeAviso(): Promise<boolean>;
  /** Avisa cada vez que el usuario toca el aviso con la app viva; devuelve cómo dejar de escuchar. */
  alTocarAviso(oyente: () => void): () => void;
}
