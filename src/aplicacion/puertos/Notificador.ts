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
}
