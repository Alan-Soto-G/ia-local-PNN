import { initLlama, type LlamaContext } from 'llama.rn';

import type { CodificadorTexto } from '../../aplicacion/puertos/CodificadorTexto';
import { traducirErrorLlama } from './errores-llama';

/** Normalización euclídea (L2) en llama.cpp. */
const NORMALIZACION_L2 = 2;

/**
 * Adaptador llama.rn del modelo de embeddings (MiniLM multilingüe, ADR-014):
 * pooling `mean` y normalización L2, como sentence-transformers en el backend.
 */
export class CodificadorLlama implements CodificadorTexto {
  private contexto: LlamaContext | null = null;

  constructor(private readonly dimensiones: number) {}

  async cargar(rutaModelo: string): Promise<void> {
    if (this.contexto !== null) return;
    try {
      this.contexto = await initLlama({
        model: rutaModelo,
        embedding: true,
        pooling_type: 'mean',
        n_ctx: 512,
        use_mlock: false,
      });
    } catch (error) {
      throw traducirErrorLlama(error, 'Cargar el modelo de embeddings');
    }
  }

  async liberar(): Promise<void> {
    const contexto = this.contexto;
    this.contexto = null;
    await contexto?.release();
  }

  estaCargado(): boolean {
    return this.contexto !== null;
  }

  async vectorizar(texto: string): Promise<Float32Array> {
    if (this.contexto === null) throw traducirErrorLlama(new Error('Modelo no cargado'), 'Vectorizar');
    let embedding: number[];
    try {
      ({ embedding } = await this.contexto.embedding(texto, { embd_normalize: NORMALIZACION_L2 }));
    } catch (error) {
      throw traducirErrorLlama(error, 'Vectorizar la pregunta');
    }
    if (embedding.length !== this.dimensiones) {
      throw traducirErrorLlama(
        new Error(`El vector tiene ${embedding.length} valores; se esperaban ${this.dimensiones}`),
        'Vectorizar',
      );
    }
    return normalizar(Float32Array.from(embedding));
  }
}

/** Asegura norma 1 aunque el motor ya normalice: la similitud es el producto punto. */
function normalizar(vector: Float32Array): Float32Array {
  let suma = 0;
  for (const v of vector) suma += v * v;
  const norma = Math.sqrt(suma);
  if (norma === 0) return vector;
  return vector.map((v) => v / norma);
}
