import type { EstadoModeloLocal, ModeloLocal } from '../../../dominio/ModeloLocal';
import type { DatosModeloEmbedding } from '../../configuracion/modelos';
import { ErrorAplicacion } from '../../errores/ErrorAplicacion';
import { ModeloNoDisponible } from '../../errores/ModeloNoDisponible';
import type { CodificadorTexto } from '../../puertos/CodificadorTexto';
import type { MotorInferencia } from '../../puertos/MotorInferencia';
import type { PreparadorModelos } from '../../puertos/PreparadorModelos';

export interface DependenciasGestorModelos {
  readonly modeloEmbedding: DatosModeloEmbedding;
  readonly lenguaje: ModeloLocal;
  readonly embeddings: ModeloLocal;
  readonly preparador: PreparadorModelos;
  readonly motor: MotorInferencia;
  readonly codificador: CodificadorTexto;
}

export interface ModelosListos {
  readonly motor: MotorInferencia;
  readonly codificador: CodificadorTexto;
}

type Oyente = (estado: EstadoModeloLocal) => void;

/**
 * Gestor de modelos (ADR-013, ADR-014): único responsable de preparar, cargar y
 * liberar los dos modelos. Ningún otro módulo llama a `cargar` o `liberar`.
 */
export class GestorModelos {
  private estadoActual: EstadoModeloLocal = 'sin_preparar';
  private rutas: Promise<{ lenguaje: string; embeddings: string }> | null = null;
  private carga: Promise<ModelosListos> | null = null;
  private temporizador: ReturnType<typeof setTimeout> | null = null;
  private readonly oyentes = new Set<Oyente>();

  constructor(private readonly d: DependenciasGestorModelos) {}

  /** Modelo con el que el backend debe haber vectorizado (CU-01). */
  modeloEmbeddingEsperado(): DatosModeloEmbedding {
    return this.d.modeloEmbedding;
  }

  estado(): EstadoModeloLocal {
    return this.estadoActual;
  }

  alCambiarEstado(oyente: Oyente): () => void {
    this.oyentes.add(oyente);
    return () => this.oyentes.delete(oyente);
  }

  /** Copia y verifica los dos GGUF una sola vez; tras un error se puede reintentar. */
  preparar(): Promise<{ lenguaje: string; embeddings: string }> {
    this.rutas ??= this.prepararAmbos().catch((error: unknown) => {
      this.rutas = null;
      this.cambiar('error');
      throw error instanceof ErrorAplicacion
        ? error
        : new ModeloNoDisponible('No se pudieron preparar los modelos', { cause: error });
    });
    return this.rutas;
  }

  /** Prepara y deja cargados los dos modelos (precarga al abrir el chat, RT-03). */
  asegurarListos(): Promise<ModelosListos> {
    this.cancelarLiberacion();
    if (this.carga !== null && this.d.motor.estaCargado() && this.d.codificador.estaCargado()) {
      return this.carga;
    }
    this.carga = this.cargarAmbos().catch((error: unknown) => {
      this.carga = null;
      throw error;
    });
    return this.carga;
  }

  /** Libera los dos modelos (segundo plano o vencimiento, ADR-014 y ADR-015). */
  async liberar(): Promise<void> {
    this.cancelarLiberacion();
    this.carga = null;
    await Promise.allSettled([this.d.motor.liberar(), this.d.codificador.liberar()]);
  }

  /** Programa la liberación tras `ms` en segundo plano (5 min, spec 002). */
  programarLiberacion(ms: number): void {
    this.cancelarLiberacion();
    this.temporizador = setTimeout(() => {
      this.temporizador = null;
      void this.liberar();
    }, ms);
  }

  cancelarLiberacion(): void {
    if (this.temporizador !== null) {
      clearTimeout(this.temporizador);
      this.temporizador = null;
    }
  }

  private async prepararAmbos(): Promise<{ lenguaje: string; embeddings: string }> {
    this.cambiar('preparando');
    const embeddings = await this.d.preparador.preparar(this.d.embeddings);
    const lenguaje = await this.d.preparador.preparar(this.d.lenguaje);
    this.cambiar('listo');
    return { lenguaje, embeddings };
  }

  private async cargarAmbos(): Promise<ModelosListos> {
    const rutas = await this.preparar();
    try {
      if (!this.d.codificador.estaCargado()) await this.d.codificador.cargar(rutas.embeddings);
      if (!this.d.motor.estaCargado()) await this.d.motor.cargar(rutas.lenguaje);
    } catch (error) {
      throw error instanceof ErrorAplicacion
        ? error
        : new ModeloNoDisponible('No se pudo cargar un modelo', { cause: error });
    }
    return { motor: this.d.motor, codificador: this.d.codificador };
  }

  private cambiar(estado: EstadoModeloLocal): void {
    this.estadoActual = estado;
    for (const oyente of this.oyentes) oyente(estado);
  }
}
