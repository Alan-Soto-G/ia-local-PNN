import type { Reloj } from '../../aplicacion/puertos/Reloj';

/** Reloj del teléfono (ADR-015). */
export class RelojSistema implements Reloj {
  ahora(): Date {
    return new Date(Date.now());
  }
}
