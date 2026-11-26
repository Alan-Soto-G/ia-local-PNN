import type { EstadoCargaPersistido } from '../../dominio/EstadoCarga';
import { ErrorAplicacion } from './ErrorAplicacion';

/** Se intentó consultar con la carga vencida o sin datos (ADR-015, EAC-08). */
export class SinCargaVigente extends ErrorAplicacion {
  readonly codigo = 'SinCargaVigente';

  constructor(readonly estado: Exclude<EstadoCargaPersistido, 'vigente'>) {
    super(`No hay carga vigente (${estado})`);
  }
}
