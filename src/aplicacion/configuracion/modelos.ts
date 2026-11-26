import { SHA256_PENDIENTE, type ModeloLocal } from '../../dominio/ModeloLocal';

/**
 * Datos de los modelos que trae el APK (ADR-013, ADR-014). Cambiar de modelo
 * solo toca esta constante, los assets y el adaptador (EAC-07).
 *
 * Los GGUF reales todavía no están en `assets/modelos/` (DT-02, DT-03): el
 * sha256 queda en PENDIENTE y el preparador responde ModeloNoDisponible hasta
 * que se coloquen los archivos y se escriba aquí su sha256.
 */
export interface DatosModeloEmbedding {
  /** Nombre que informa el backend en `/health/db` → `embedding_model`. */
  readonly nombre: string;
  readonly dimensiones: number;
}

export const MODELO_EMBEDDING: DatosModeloEmbedding = {
  nombre: 'paraphrase-multilingual-MiniLM-L12-v2',
  dimensiones: 384,
};

export const MODELO_LOCAL_LENGUAJE: ModeloLocal = {
  tipo: 'lenguaje',
  nombre: 'LFM2.5-350M',
  version: 'Q4_K_M',
  archivo: 'lfm2.5-350m-q4_k_m.gguf',
  sha256: SHA256_PENDIENTE,
};

export const MODELO_LOCAL_EMBEDDINGS: ModeloLocal = {
  tipo: 'embeddings',
  nombre: MODELO_EMBEDDING.nombre,
  version: 'F16',
  archivo: 'paraphrase-multilingual-minilm-l12-v2-f16.gguf',
  sha256: SHA256_PENDIENTE,
};
