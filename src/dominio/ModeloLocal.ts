export type TipoModelo = 'lenguaje' | 'embeddings';

/** Ciclo de vida del ModeloLocal (vista lógica). */
export type EstadoModeloLocal = 'sin_preparar' | 'preparando' | 'listo' | 'error';

/** Valor de `sha256` mientras el archivo real no está en el APK. */
export const SHA256_PENDIENTE = 'PENDIENTE';

/** Modelo GGUF incluido en el APK (ADR-013). */
export interface ModeloLocal {
  readonly tipo: TipoModelo;
  readonly nombre: string;
  readonly version: string;
  /** Nombre del archivo en los assets y en el almacenamiento interno. */
  readonly archivo: string;
  /** sha256 en hexadecimal minúscula. */
  readonly sha256: string;
}

/** Un modelo solo se usa si su copia coincide con el sha256 declarado (ADR-013). */
export function coincideSha256(modelo: ModeloLocal, calculado: string): boolean {
  return modelo.sha256 !== SHA256_PENDIENTE && modelo.sha256.toLowerCase() === calculado.toLowerCase();
}
