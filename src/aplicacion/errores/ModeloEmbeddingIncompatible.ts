import { ErrorAplicacion } from './ErrorAplicacion';

/** El backend vectorizó con otro modelo o con otras dimensiones (ADR-012, ADR-014). */
export class ModeloEmbeddingIncompatible extends ErrorAplicacion {
  readonly codigo = 'ModeloEmbeddingIncompatible';

  constructor(
    readonly informado: { nombre: string; dimensiones: number },
    readonly esperado: { nombre: string; dimensiones: number },
  ) {
    super(
      `Modelo del backend ${informado.nombre}/${informado.dimensiones}; se esperaba ${esperado.nombre}/${esperado.dimensiones}`,
    );
  }
}
