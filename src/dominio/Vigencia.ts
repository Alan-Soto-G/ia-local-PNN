/**
 * Objeto de valor Vigencia (RN-02, ADR-015): las horas durante las que la
 * información de una Carga está disponible. La duración llega desde la
 * configuración para que el dominio no esconda constantes.
 */
export class Vigencia {
  private constructor(
    readonly cargadoEn: Date,
    readonly expiraEn: Date,
  ) {}

  static desde(cargadoEn: Date, duracionMs: number): Vigencia {
    if (duracionMs <= 0) {
      throw new Error('La duración de la vigencia debe ser positiva');
    }
    return new Vigencia(cargadoEn, new Date(cargadoEn.getTime() + duracionMs));
  }

  static reconstruir(cargadoEn: Date, expiraEn: Date): Vigencia {
    return new Vigencia(cargadoEn, expiraEn);
  }

  /** La consulta está permitida solo si `ahora < expiraEn` (bloqueo exacto, ADR-015). */
  contiene(ahora: Date): boolean {
    return ahora.getTime() < this.expiraEn.getTime();
  }
}
