import { estaVigente } from '../../../dominio/Carga';
import type { EstadoCargaPersistido } from '../../../dominio/EstadoCarga';
import { Vigencia } from '../../../dominio/Vigencia';
import type { Notificador } from '../../puertos/Notificador';
import type { RepositorioConocimiento } from '../../puertos/RepositorioConocimiento';

export interface EstadoVigencia {
  readonly estado: EstadoCargaPersistido;
  readonly expiraEn: Date | null;
}

/**
 * Módulo Vigencia (CU-03, ADR-015). Interfaz mínima: `estado(ahora)`,
 * `iniciar(...)` y, en CU-03, `vencer(decision)`.
 */
export class ModuloVigencia {
  constructor(
    private readonly repositorio: RepositorioConocimiento,
    private readonly notificador: Notificador,
    private readonly duracionMs: number,
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
}
