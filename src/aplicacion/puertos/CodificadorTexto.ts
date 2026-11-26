/**
 * Modelo de embeddings local (ADR-014): el mismo que usó el backend, con vector
 * normalizado. Solo el Gestor de modelos llama a `cargar` y `liberar`.
 */
export interface CodificadorTexto {
  cargar(rutaModelo: string): Promise<void>;
  liberar(): Promise<void>;
  estaCargado(): boolean;
  vectorizar(texto: string): Promise<Float32Array>;
}
