/** Trozo de un documento con su página y su vector: unidad de recuperación (vista lógica). */
export interface Fragmento {
  /** Identificador del backend. */
  readonly id: number;
  readonly documentoId: number;
  readonly indice: number;
  /** Página del PDF, desde 1; un fragmento nunca cruza páginas. */
  readonly pagina: number;
  readonly texto: string;
  readonly caracteres: number;
  /** Vector normalizado calculado por el backend. */
  readonly vector: Float32Array;
}

/** El vector tiene exactamente las dimensiones esperadas y solo valores finitos. */
export function vectorValido(vector: ArrayLike<number>, dimensiones: number): boolean {
  if (vector.length !== dimensiones) return false;
  for (let i = 0; i < vector.length; i++) {
    if (!Number.isFinite(vector[i])) return false;
  }
  return true;
}
