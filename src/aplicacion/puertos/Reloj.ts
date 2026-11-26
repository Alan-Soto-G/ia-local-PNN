/** Hora actual; en pruebas se reemplaza por un reloj falso (ADR-015). */
export interface Reloj {
  ahora(): Date;
}
