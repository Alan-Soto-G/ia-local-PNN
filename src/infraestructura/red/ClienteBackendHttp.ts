import type { ClienteBackend, SaludBackend } from '../../aplicacion/puertos/ClienteBackend';
import { BackendNoDisponible } from '../../aplicacion/errores/BackendNoDisponible';
import type { Documento } from '../../dominio/Documento';
import type { Fragmento } from '../../dominio/Fragmento';

/** Respuesta de `GET /health/db` (API.md). */
interface SaludDbDto {
  status?: string;
  tables_ready?: boolean;
  embedding_model?: string;
  dimensions?: number;
}

/** Objeto `Document` (API.md). */
interface DocumentoDto {
  id: number;
  name: string;
  version: number;
  filename: string;
  pages: number;
  num_chunks: number;
  sha256: string;
  created_at: string;
  status: string;
}

/** Fragmento de `GET /documents/{id}/chunks?include_embeddings=true` (API.md). */
interface FragmentoDto {
  id: number;
  chunk_index: number;
  page: number;
  text: string;
  char_count: number;
  embedding?: number[];
}

/**
 * Adaptador HTTP del backend RAG (ADR-012). Es el único adaptador con red y solo
 * lo usa el Módulo Actualización (RT-01, EAC-02). Solo hace GET.
 */
export class ClienteBackendHttp implements ClienteBackend {
  readonly urlBase: string;

  constructor(
    urlBase: string,
    private readonly limiteSaludMs: number,
    private readonly limiteDescargaMs: number,
  ) {
    this.urlBase = urlBase.replace(/\/+$/, '');
  }

  async salud(): Promise<SaludBackend> {
    let dto: SaludDbDto;
    try {
      dto = await this.obtenerJson<SaludDbDto>('/health/db', this.limiteSaludMs);
    } catch (error) {
      throw new BackendNoDisponible('El backend no respondió', { cause: error });
    }
    if (dto.status !== 'ok') {
      throw new BackendNoDisponible(`Estado del backend: ${String(dto.status)}`);
    }
    return {
      tablasListas: dto.tables_ready === true,
      modeloEmbedding: String(dto.embedding_model ?? ''),
      dimensiones: Number(dto.dimensions ?? 0),
    };
  }

  async documentos(): Promise<Documento[]> {
    const lista = await this.obtenerJson<DocumentoDto[]>('/documents', this.limiteDescargaMs);
    if (!Array.isArray(lista)) {
      throw new Error('La lista de documentos no es un arreglo');
    }
    return lista.map((dto) => {
      if (dto.status !== 'processed') {
        throw new Error(`Documento ${dto.id} con estado ${dto.status}`);
      }
      return {
        id: dto.id,
        nombre: dto.name,
        version: dto.version,
        archivo: dto.filename,
        paginas: dto.pages,
        numFragmentos: dto.num_chunks,
        sha256: dto.sha256,
        creadoEn: dto.created_at,
      };
    });
  }

  async fragmentos(documentoId: number): Promise<Fragmento[]> {
    const lista = await this.obtenerJson<FragmentoDto[]>(
      `/documents/${documentoId}/chunks?include_embeddings=true`,
      this.limiteDescargaMs,
    );
    if (!Array.isArray(lista)) {
      throw new Error('La lista de fragmentos no es un arreglo');
    }
    return lista.map((dto) => ({
      id: dto.id,
      documentoId,
      indice: dto.chunk_index,
      pagina: dto.page,
      texto: dto.text,
      caracteres: dto.char_count,
      vector: Float32Array.from(dto.embedding ?? []),
    }));
  }

  private async obtenerJson<T>(ruta: string, limiteMs: number): Promise<T> {
    const controlador = new AbortController();
    const temporizador = setTimeout(() => controlador.abort(), limiteMs);
    try {
      const respuesta = await fetch(`${this.urlBase}${ruta}`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controlador.signal,
      });
      if (!respuesta.ok) {
        // /health/db responde 503 con cuerpo JSON cuando la base no abre (API.md).
        if (ruta === '/health/db') return (await respuesta.json()) as T;
        throw new Error(`HTTP ${respuesta.status} en ${ruta}`);
      }
      return (await respuesta.json()) as T;
    } finally {
      clearTimeout(temporizador);
    }
  }
}
