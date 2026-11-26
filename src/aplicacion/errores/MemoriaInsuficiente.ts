import { ErrorAplicacion } from './ErrorAplicacion';

/** El motor no pudo reservar memoria para un modelo (ADR-014). */
export class MemoriaInsuficiente extends ErrorAplicacion {
  readonly codigo = 'MemoriaInsuficiente';
}
