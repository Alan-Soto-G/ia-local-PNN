import { ErrorAplicacion } from './ErrorAplicacion';

/**
 * La descarga o la escritura fallaron a mitad de camino; no se aplicó nada (EAC-03).
 * `habiaInformacionAnterior` decide si se dice que la anterior sigue disponible.
 */
export class CargaIncompleta extends ErrorAplicacion {
  readonly codigo = 'CargaIncompleta';

  constructor(
    readonly habiaInformacionAnterior: boolean,
    options?: { cause?: unknown },
  ) {
    super('La carga no se completó', options);
  }
}
