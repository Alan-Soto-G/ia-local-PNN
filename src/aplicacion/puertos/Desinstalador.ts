/**
 * Diálogo de desinstalación del sistema (ADR-015). Una app no puede
 * desinstalarse sola: el usuario confirma en el diálogo de Android. La promesa
 * se resuelve cuando el usuario vuelve a la app (porque canceló).
 */
export interface Desinstalador {
  abrirDesinstalacion(): Promise<void>;
}
