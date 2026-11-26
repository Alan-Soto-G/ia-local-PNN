export interface OpcionesGeneracion {
  readonly temperatura: number;
  readonly maxTokensNuevos: number;
}

export interface ResultadoGeneracion {
  readonly texto: string;
  /** `true` si terminó por `detener()`. */
  readonly detenido: boolean;
  /** Tokens por segundo de la generación, si el motor lo informa (EAC-01). */
  readonly tokensPorSegundo: number | null;
}

/**
 * Modelo de lenguaje local (ADR-004, ADR-014). Solo el Gestor de modelos llama
 * a `cargar` y `liberar`.
 */
export interface MotorInferencia {
  cargar(rutaModelo: string): Promise<void>;
  liberar(): Promise<void>;
  estaCargado(): boolean;
  contarTokens(texto: string): Promise<number>;
  /** Genera en streaming: llama a `alToken` con cada trozo de texto. */
  generar(
    sistema: string,
    turno: string,
    opciones: OpcionesGeneracion,
    alToken: (trozo: string) => void,
  ): Promise<ResultadoGeneracion>;
  detener(): Promise<void>;
}
