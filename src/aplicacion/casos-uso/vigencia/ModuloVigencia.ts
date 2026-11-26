import { estaVigente } from '../../../dominio/Carga';
import type { EstadoCargaPersistido } from '../../../dominio/EstadoCarga';
import { Vigencia } from '../../../dominio/Vigencia';
import type { Desinstalador } from '../../puertos/Desinstalador';
import type { Notificador } from '../../puertos/Notificador';
import type { RepositorioConocimiento } from '../../puertos/RepositorioConocimiento';

export interface EstadoVigencia {
  readonly estado: EstadoCargaPersistido;
  readonly expiraEn: Date | null;
}

/** Respuesta a "¿Deseas desinstalar la aplicación?". */
export type DecisionVencimiento = 'si' | 'no';

/** Lo único que Vigencia necesita del Gestor de modelos (vista de usos). */
export interface LiberadorModelos {
  liberar(): Promise<void>;
}

/**
 * Módulo Vigencia (CU-03, ADR-015). Interfaz mínima: `estado(ahora)`,
 * `iniciar(...)` y `vencer(decision)`. No usa Consulta ni Actualización.
 */
export class ModuloVigencia {
  constructor(
    private readonly repositorio: RepositorioConocimiento,
    private readonly notificador: Notificador,
    private readonly duracionMs: number,
    private readonly modelos: LiberadorModelos,
    private readonly desinstalador: Desinstalador,
  ) {}

  /** Calcula la vigencia de una carga nueva: `expira_en = cargado_en + 24 h`. */
  calcular(cargadoEn: Date): Vigencia {
    return Vigencia.desde(cargadoEn, this.duracionMs);
  }

  /** `vencida` desde el instante `expira_en`, aunque el borrado no se haya hecho (ADR-015). */
  async estado(ahora: Date): Promise<EstadoVigencia> {
    const carga = await this.repositorio.leerCarga();
    if (carga.estado === 'sin_datos' || carga.vigencia === null) {
      return { estado: 'sin_datos', expiraEn: null };
    }
    return {
      estado: estaVigente(carga, ahora) ? 'vigente' : 'vencida',
      expiraEn: carga.vigencia.expiraEn,
    };
  }

  /**
   * Programa el aviso de la carga recién confirmada, reemplazando el anterior.
   * Un fallo del aviso no invalida la carga: el bloqueo no depende de él (DT-06).
   */
  async iniciar(vigencia: Vigencia): Promise<void> {
    try {
      await this.notificador.cancelarVencimiento();
      await this.notificador.programarVencimiento(vigencia.expiraEn);
    } catch (error) {
      console.warn('No se pudo programar el aviso de vencimiento', error);
    }
  }

  /**
   * "No": libera los modelos y borra documentos, fragmentos, vectores y
   * conversaciones en una transacción; la Carga queda en `sin_datos`.
   * "Sí": lo mismo y luego abre el diálogo de desinstalación de Android.
   * Los modelos GGUF copiados no se borran (ADR-013).
   */
  async vencer(decision: DecisionVencimiento, ahora: Date): Promise<void> {
    const { estado } = await this.estado(ahora);
    if (estado === 'vigente') {
      throw new Error('La carga sigue vigente: no se puede vencer');
    }
    await this.modelos.liberar();
    await this.repositorio.borrarTodo();
    await this.notificador.cancelarVencimiento().catch(() => undefined);
    if (decision === 'si') {
      await this.desinstalador.abrirDesinstalacion();
    }
  }
}
