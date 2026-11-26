import { estaVigente, type Carga } from '../../../dominio/Carga';
import { quedarseConVersionMasAlta, type Documento } from '../../../dominio/Documento';
import { vectorValido, type Fragmento } from '../../../dominio/Fragmento';
import type { Vigencia } from '../../../dominio/Vigencia';
import { BackendNoDisponible } from '../../errores/BackendNoDisponible';
import { CargaIncompleta } from '../../errores/CargaIncompleta';
import { ErrorAplicacion } from '../../errores/ErrorAplicacion';
import { ModeloEmbeddingIncompatible } from '../../errores/ModeloEmbeddingIncompatible';
import { SinDocumentosEnBackend } from '../../errores/SinDocumentosEnBackend';
import type { ClienteBackend, SaludBackend } from '../../puertos/ClienteBackend';
import type { Reloj } from '../../puertos/Reloj';
import type { RepositorioConocimiento } from '../../puertos/RepositorioConocimiento';
import type { GestorModelos } from '../modelos/GestorModelos';
import type { ModuloVigencia } from '../vigencia/ModuloVigencia';

export type AlProgresar = (actual: number, total: number) => void;

export interface ResultadoActualizacion {
  readonly vigencia: Vigencia;
  readonly totalDocumentos: number;
  readonly totalFragmentos: number;
}

/**
 * CU-01 Actualizar información (ADR-012): verifica el backend y el modelo de
 * embeddings, baja todo a memoria, lo valida y reemplaza la base en una
 * transacción; luego inicia la vigencia. Todo o nada (EAC-03).
 */
export class ActualizarInformacion {
  private enCurso = false;

  constructor(
    private readonly cliente: ClienteBackend,
    private readonly repositorio: RepositorioConocimiento,
    private readonly gestorModelos: GestorModelos,
    private readonly vigencia: ModuloVigencia,
    private readonly reloj: Reloj,
  ) {}

  async ejecutar(alProgresar: AlProgresar = () => {}): Promise<ResultadoActualizacion> {
    if (this.enCurso) {
      throw new Error('Ya hay una actualización en curso');
    }
    this.enCurso = true;
    try {
      return await this.actualizar(alProgresar);
    } finally {
      this.enCurso = false;
    }
  }

  private async actualizar(alProgresar: AlProgresar): Promise<ResultadoActualizacion> {
    const anterior = await this.repositorio.leerCarga();
    const habiaInformacion = estaVigente(anterior, this.reloj.ahora());

    // 1. Salud y modelo de embeddings: si fallan, no se pide nada más.
    const salud = await this.verificarSalud();
    const esperado = this.gestorModelos.modeloEmbeddingEsperado();

    // 2. Descarga completa a memoria y validación.
    let documentos: Documento[];
    const fragmentos: Fragmento[] = [];
    try {
      const todos = await this.cliente.documentos();
      if (todos.length === 0) {
        throw new SinDocumentosEnBackend('Lista de documentos vacía');
      }
      documentos = quedarseConVersionMasAlta(todos);
      for (const [i, documento] of documentos.entries()) {
        alProgresar(i + 1, documentos.length);
        const recibidos = await this.cliente.fragmentos(documento.id);
        validarFragmentos(documento, recibidos, esperado.dimensiones);
        fragmentos.push(...recibidos);
      }
    } catch (error) {
      if (error instanceof SinDocumentosEnBackend) throw error;
      throw new CargaIncompleta(habiaInformacion, { cause: error });
    }

    // 3. Escritura en una transacción.
    const vigencia = this.vigencia.calcular(this.reloj.ahora());
    const carga: Carga = {
      estado: 'vigente',
      vigencia,
      modeloEmbedding: salud.modeloEmbedding,
      dimensiones: salud.dimensiones,
      totalDocumentos: documentos.length,
      totalFragmentos: fragmentos.length,
      urlBackend: this.cliente.urlBase,
    };
    try {
      await this.repositorio.reemplazarTodo(carga, documentos, fragmentos);
    } catch (error) {
      throw new CargaIncompleta(habiaInformacion, { cause: error });
    }

    // 4. Vigencia nueva: cancela el aviso anterior y programa otro.
    await this.vigencia.iniciar(vigencia);

    return { vigencia, totalDocumentos: documentos.length, totalFragmentos: fragmentos.length };
  }

  private async verificarSalud(): Promise<SaludBackend> {
    let salud: SaludBackend;
    try {
      salud = await this.cliente.salud();
    } catch (error) {
      throw error instanceof ErrorAplicacion
        ? error
        : new BackendNoDisponible('Sin respuesta del backend', { cause: error });
    }
    if (!salud.tablasListas) {
      throw new SinDocumentosEnBackend('El backend no tiene tablas creadas');
    }
    const esperado = this.gestorModelos.modeloEmbeddingEsperado();
    if (salud.modeloEmbedding !== esperado.nombre || salud.dimensiones !== esperado.dimensiones) {
      throw new ModeloEmbeddingIncompatible(
        { nombre: salud.modeloEmbedding, dimensiones: salud.dimensiones },
        esperado,
      );
    }
    return salud;
  }
}

function validarFragmentos(
  documento: Documento,
  fragmentos: readonly Fragmento[],
  dimensiones: number,
): void {
  if (fragmentos.length !== documento.numFragmentos) {
    throw new Error(
      `${documento.archivo}: ${fragmentos.length} fragmentos recibidos, se esperaban ${documento.numFragmentos}`,
    );
  }
  for (const fragmento of fragmentos) {
    if (fragmento.documentoId !== documento.id || !vectorValido(fragmento.vector, dimensiones)) {
      throw new Error(`${documento.archivo}: fragmento ${fragmento.id} inválido`);
    }
  }
}
