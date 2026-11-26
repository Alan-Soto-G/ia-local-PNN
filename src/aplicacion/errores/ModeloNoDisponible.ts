import { ErrorAplicacion } from './ErrorAplicacion';

/** Un modelo no se pudo copiar, su sha256 no coincide o no se pudo cargar (ADR-013, ADR-014). */
export class ModeloNoDisponible extends ErrorAplicacion {
  readonly codigo = 'ModeloNoDisponible';
}
