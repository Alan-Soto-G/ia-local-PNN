import type { DatosModeloEmbedding } from '../../configuracion/modelos';

/**
 * Gestor de modelos (ADR-013, ADR-014): único responsable de preparar, cargar y
 * liberar los modelos. En CU-01 solo informa el modelo de embeddings esperado.
 */
export class GestorModelos {
  constructor(private readonly modeloEmbedding: DatosModeloEmbedding) {}

  modeloEmbeddingEsperado(): DatosModeloEmbedding {
    return this.modeloEmbedding;
  }
}
