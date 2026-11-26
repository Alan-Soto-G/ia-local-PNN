import type { EstadoCargaPersistido } from './EstadoCarga';
import { Vigencia } from './Vigencia';

/**
 * Carga: una actualización exitosa de la información (vista lógica).
 * Hay como máximo una Carga activa.
 */
export interface Carga {
  readonly estado: EstadoCargaPersistido;
  /** Nula cuando el estado es `sin_datos`. */
  readonly vigencia: Vigencia | null;
  readonly modeloEmbedding: string | null;
  readonly dimensiones: number | null;
  readonly totalDocumentos: number;
  readonly totalFragmentos: number;
  readonly urlBackend: string | null;
}

export const CARGA_SIN_DATOS: Carga = {
  estado: 'sin_datos',
  vigencia: null,
  modeloEmbedding: null,
  dimensiones: null,
  totalDocumentos: 0,
  totalFragmentos: 0,
  urlBackend: null,
};

/** Solo con estado `vigente` y `ahora < expiraEn` se puede consultar (vista lógica). */
export function estaVigente(carga: Carga, ahora: Date): boolean {
  return carga.estado === 'vigente' && carga.vigencia !== null && carga.vigencia.contiene(ahora);
}
