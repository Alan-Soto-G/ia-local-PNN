/** Clasificación de la mejor similitud (ADR-016). La decide el código, no el modelo. */
export type Banda = 'ALTA' | 'MEDIA' | 'BAJA';

export interface UmbralesBanda {
  /** Similitud mínima de ALTA (inicial 0,55, DT-01). */
  readonly alta: number;
  /** Similitud mínima de MEDIA (inicial 0,40, DT-01). */
  readonly media: number;
}

/** Banda según la mejor similitud; sin fragmentos es BAJA. */
export function clasificarBanda(mejorSimilitud: number | null, umbrales: UmbralesBanda): Banda {
  if (mejorSimilitud === null || Number.isNaN(mejorSimilitud)) return 'BAJA';
  if (mejorSimilitud >= umbrales.alta) return 'ALTA';
  if (mejorSimilitud >= umbrales.media) return 'MEDIA';
  return 'BAJA';
}
