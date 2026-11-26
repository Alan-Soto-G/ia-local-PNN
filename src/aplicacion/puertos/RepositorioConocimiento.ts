import type { Carga } from '../../dominio/Carga';
import type { Documento } from '../../dominio/Documento';
import type { Fragmento } from '../../dominio/Fragmento';

/** Grupo Conocimiento de la base local (vista de datos). */
export interface RepositorioConocimiento {
  leerCarga(): Promise<Carga>;
  /**
   * En una sola transacción borra conocimiento y conversaciones, inserta lo nuevo
   * y registra la Carga. Si algo falla no cambia nada (EAC-03).
   */
  reemplazarTodo(
    carga: Carga,
    documentos: readonly Documento[],
    fragmentos: readonly Fragmento[],
  ): Promise<void>;
  /** Borra conocimiento y conversaciones y deja la Carga en `sin_datos` (CU-03). */
  borrarTodo(): Promise<void>;
}
