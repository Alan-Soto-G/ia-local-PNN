/**
 * Base de los errores de aplicación (arquitectura, sección 6): los adaptadores
 * traducen las fallas técnicas a estas clases y la pantalla dice qué hacer.
 */
export abstract class ErrorAplicacion extends Error {
  abstract readonly codigo: string;

  constructor(mensaje: string, options?: { cause?: unknown }) {
    super(mensaje, options);
    this.name = new.target.name;
  }
}
