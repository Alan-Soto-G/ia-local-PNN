import { initLlama, type LlamaContext } from 'llama.rn';

import type {
  MotorInferencia,
  OpcionesGeneracion,
  ResultadoGeneracion,
} from '../../aplicacion/puertos/MotorInferencia';
import { traducirErrorLlama } from './errores-llama';

/**
 * Adaptador llama.rn del modelo de lenguaje (LFM2.5-350M, ADR-014). Genera en
 * streaming con la plantilla de chat del propio GGUF.
 */
export class MotorLlama implements MotorInferencia {
  private contexto: LlamaContext | null = null;
  private detenidoPorUsuario = false;

  constructor(private readonly contextoTokens: number) {}

  async cargar(rutaModelo: string): Promise<void> {
    if (this.contexto !== null) return;
    try {
      this.contexto = await initLlama({ model: rutaModelo, n_ctx: this.contextoTokens, use_mlock: false });
    } catch (error) {
      throw traducirErrorLlama(error, 'Cargar el modelo de lenguaje');
    }
  }

  async liberar(): Promise<void> {
    const contexto = this.contexto;
    this.contexto = null;
    await contexto?.release();
  }

  estaCargado(): boolean {
    return this.contexto !== null;
  }

  async contarTokens(texto: string): Promise<number> {
    const { tokens } = await this.requerir().tokenize(texto);
    return tokens.length;
  }

  async generar(
    sistema: string,
    turno: string,
    opciones: OpcionesGeneracion,
    alToken: (trozo: string) => void,
  ): Promise<ResultadoGeneracion> {
    const contexto = this.requerir();
    this.detenidoPorUsuario = false;
    try {
      const resultado = await contexto.completion(
        {
          messages: [
            { role: 'system', content: sistema },
            { role: 'user', content: turno },
          ],
          n_predict: opciones.maxTokensNuevos,
          temperature: opciones.temperatura,
        },
        (datos) => alToken(datos.token),
      );
      return {
        texto: resultado.content ?? resultado.text,
        detenido: this.detenidoPorUsuario,
        tokensPorSegundo: resultado.timings?.predicted_per_second ?? null,
      };
    } catch (error) {
      throw traducirErrorLlama(error, 'Generar la respuesta');
    }
  }

  async detener(): Promise<void> {
    this.detenidoPorUsuario = true;
    await this.contexto?.stopCompletion();
  }

  private requerir(): LlamaContext {
    if (this.contexto === null) throw traducirErrorLlama(new Error('Modelo no cargado'), 'Usar el motor');
    return this.contexto;
  }
}
