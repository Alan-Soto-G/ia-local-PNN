import { MemoriaInsuficiente } from '../../aplicacion/errores/MemoriaInsuficiente';
import { ModeloNoDisponible } from '../../aplicacion/errores/ModeloNoDisponible';

const PATRON_MEMORIA = /out of memory|\boom\b|failed to allocate|alloc|memory/i;

/**
 * Traduce un error de llama.rn al error de aplicación (ADR-014). llama.rn no
 * documenta un código para la falta de memoria: se reconoce por el mensaje.
 */
export function traducirErrorLlama(error: unknown, accion: string): Error {
  const mensaje = error instanceof Error ? error.message : String(error);
  if (PATRON_MEMORIA.test(mensaje)) {
    return new MemoriaInsuficiente(`${accion}: ${mensaje}`, { cause: error });
  }
  return new ModeloNoDisponible(`${accion}: ${mensaje}`, { cause: error });
}
