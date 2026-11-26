/** Fragmento devuelto por la búsqueda, con su documento y su similitud. */
export interface FragmentoRecuperado {
  readonly fragmentoId: number;
  readonly archivo: string;
  readonly pagina: number;
  readonly texto: string;
  /** 1 − distancia coseno. */
  readonly similitud: number;
}

/** k fragmentos más cercanos a un vector, de mayor a menor similitud (ADR-016). */
export interface BuscadorVectorial {
  buscar(vector: Float32Array, k: number): Promise<FragmentoRecuperado[]>;
}
