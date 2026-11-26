/** Una versión de un PDF vectorizado en el backend (vista lógica). */
export interface Documento {
  /** Identificador del backend. */
  readonly id: number;
  /** Nombre base, sin extensión ni sufijo de versión (`Fauna`). */
  readonly nombre: string;
  readonly version: number;
  /** Nombre del archivo (`Fauna_v2.pdf`); es el que se cita. */
  readonly archivo: string;
  readonly paginas: number;
  readonly numFragmentos: number;
  readonly sha256: string;
  /** ISO-8601 UTC. */
  readonly creadoEn: string;
}

/**
 * De cada nombre se guarda solo la versión más alta (DT-09), para no responder
 * con información reemplazada. Conserva el orden de la primera aparición.
 */
export function quedarseConVersionMasAlta(documentos: readonly Documento[]): Documento[] {
  const porNombre = new Map<string, Documento>();
  for (const documento of documentos) {
    const actual = porNombre.get(documento.nombre);
    if (actual === undefined || documento.version > actual.version) {
      porNombre.set(documento.nombre, documento);
    }
  }
  return [...porNombre.values()];
}
