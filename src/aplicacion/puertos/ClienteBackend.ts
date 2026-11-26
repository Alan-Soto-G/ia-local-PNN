import type { Documento } from '../../dominio/Documento';
import type { Fragmento } from '../../dominio/Fragmento';

export interface SaludBackend {
  readonly tablasListas: boolean;
  readonly modeloEmbedding: string;
  readonly dimensiones: number;
}

/**
 * Backend RAG del computador administrador (backend-esperado.md). Solo GET.
 * `salud()` lanza `BackendNoDisponible` si no responde a tiempo o no da `status: ok`.
 */
export interface ClienteBackend {
  /** Dirección base, para registrarla en la Carga. */
  readonly urlBase: string;
  salud(): Promise<SaludBackend>;
  documentos(): Promise<Documento[]>;
  fragmentos(documentoId: number): Promise<Fragmento[]>;
}
