/**
 * Datos de los modelos que trae el APK (ADR-013, ADR-014). Cambiar de modelo
 * solo toca esta constante, los assets y el adaptador (EAC-07).
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
