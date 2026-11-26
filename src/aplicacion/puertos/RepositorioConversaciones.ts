import type { Conversacion } from '../../dominio/Conversacion';
import type { Mensaje } from '../../dominio/Mensaje';

/** Grupo Uso de la base local: nunca sale del teléfono (PA-08). */
export interface RepositorioConversaciones {
  /** La conversación de la carga vigente; la crea si no existe. */
  conversacionActual(): Promise<Conversacion>;
  /** Mensajes en orden de creación, con sus citas. */
  mensajes(conversacionId: string): Promise<Mensaje[]>;
  guardarMensaje(mensaje: Mensaje): Promise<void>;
  /** Actualiza texto, estado y TTFT de un mensaje, y guarda sus citas. */
  actualizarMensaje(mensaje: Mensaje): Promise<void>;
  nuevoId(): string;
  borrarTodo(): Promise<void>;
}
