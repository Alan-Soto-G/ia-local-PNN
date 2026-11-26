import type { ModeloLocal } from '../../dominio/ModeloLocal';

/**
 * Copia un asset GGUF del APK al almacenamiento interno, si falta o cambió su
 * tamaño, y verifica su sha256 (ADR-013). Devuelve la ruta lista para el motor;
 * lanza `ModeloNoDisponible` si no coincide.
 */
export interface PreparadorModelos {
  preparar(modelo: ModeloLocal): Promise<string>;
}
