import { clasificarBanda } from '../../../dominio/Banda';
import type { Cita } from '../../../dominio/Cita';
import type { Mensaje } from '../../../dominio/Mensaje';
import { armarTurno, PROMPT_SISTEMA, TEXTO_BAJA, TEXTO_MEDIA } from '../../configuracion/prompt';
import {
  MAX_TOKENS_INSTRUCCION,
  MAX_TOKENS_NUEVOS,
  TEMPERATURA,
  TOP_K,
  UMBRALES_BANDA,
} from '../../configuracion/rag';
import { TEXTOS } from '../../configuracion/textos';
import { MemoriaInsuficiente } from '../../errores/MemoriaInsuficiente';
import { SinCargaVigente } from '../../errores/SinCargaVigente';
import type { BuscadorVectorial, FragmentoRecuperado } from '../../puertos/BuscadorVectorial';
import type { MotorInferencia } from '../../puertos/MotorInferencia';
import type { Reloj } from '../../puertos/Reloj';
import type { RepositorioConversaciones } from '../../puertos/RepositorioConversaciones';
import type { GestorModelos } from '../modelos/GestorModelos';
import type { ModuloVigencia } from '../vigencia/ModuloVigencia';

export type AlActualizar = (mensaje: Mensaje) => void;

/**
 * CU-02 Consultar al asistente por texto (ADR-004, ADR-016): comprueba la
 * vigencia, vectoriza la pregunta, busca los k vecinos, decide la banda y
 * responde con el texto fijo o en streaming con citas. Sin red (EAC-02).
 */
export class ConsultarAsistente {
  private enCurso = false;
  private motorActivo: MotorInferencia | null = null;

  constructor(
    private readonly vigencia: ModuloVigencia,
    private readonly gestorModelos: GestorModelos,
    private readonly buscador: BuscadorVectorial,
    private readonly conversaciones: RepositorioConversaciones,
    private readonly reloj: Reloj,
  ) {}

  /** Mensajes de la conversación de la carga vigente (spec 002, conversación al volver). */
  async historial(): Promise<Mensaje[]> {
    const { estado } = await this.vigencia.estado(this.reloj.ahora());
    if (estado !== 'vigente') return [];
    const conversacion = await this.conversaciones.conversacionActual();
    return this.conversaciones.mensajes(conversacion.id);
  }

  /** `alActualizar` recibe el mensaje del usuario y cada versión del mensaje del asistente. */
  async consultar(pregunta: string, alActualizar: AlActualizar): Promise<Mensaje> {
    const texto = pregunta.trim();
    if (texto.length === 0) throw new Error('La pregunta está vacía');
    if (this.enCurso) throw new Error('Ya hay una respuesta en curso');
    this.enCurso = true;
    try {
      return await this.responder(texto, alActualizar);
    } finally {
      this.enCurso = false;
    }
  }

  private async responder(texto: string, alActualizar: AlActualizar): Promise<Mensaje> {
    const inicio = this.reloj.ahora().getTime();
    const { estado } = await this.vigencia.estado(this.reloj.ahora());
    if (estado !== 'vigente') throw new SinCargaVigente(estado);

    const conversacion = await this.conversaciones.conversacionActual();
    const usuario = this.nuevoMensaje(conversacion.id, 'usuario', texto, 'completo');
    await this.conversaciones.guardarMensaje(usuario);
    alActualizar(usuario);

    let respuesta = this.nuevoMensaje(conversacion.id, 'asistente', '', 'generando');
    let guardada = false;
    try {
      const { motor, codificador } = await this.gestorModelos.asegurarListos();
      const vector = await codificador.vectorizar(texto);
      const resultados = await this.buscador.buscar(vector, TOP_K);
      const banda = clasificarBanda(resultados[0]?.similitud ?? null, UMBRALES_BANDA);

      if (banda !== 'ALTA') {
        respuesta = { ...respuesta, banda, estado: 'completo', texto: banda === 'MEDIA' ? TEXTO_MEDIA : TEXTO_BAJA };
        await this.conversaciones.guardarMensaje(respuesta);
        alActualizar(respuesta);
        return respuesta;
      }

      const fragmentos = await this.dentroDelPresupuesto(
        motor,
        resultados.filter((r) => r.similitud >= UMBRALES_BANDA.media).slice(0, TOP_K),
        texto,
      );
      respuesta = { ...respuesta, banda };
      await this.conversaciones.guardarMensaje(respuesta);
      guardada = true;
      alActualizar(respuesta);

      this.motorActivo = motor;
      let acumulado = '';
      let ttftMs: number | null = null;
      const resultado = await motor.generar(
        PROMPT_SISTEMA,
        armarTurno(fragmentos, texto),
        { temperatura: TEMPERATURA, maxTokensNuevos: MAX_TOKENS_NUEVOS },
        (trozo) => {
          if (ttftMs === null && trozo.length > 0) ttftMs = this.reloj.ahora().getTime() - inicio;
          acumulado += trozo;
          alActualizar({ ...respuesta, texto: acumulado, ttftMs });
        },
      );
      respuesta = {
        ...respuesta,
        texto: (resultado.texto || acumulado).trim(),
        estado: resultado.detenido ? 'detenido' : 'completo',
        ttftMs,
        citas: fragmentos.map(aCita),
      };
    } catch (error) {
      console.warn('Consulta fallida', error);
      respuesta = {
        ...respuesta,
        estado: 'error',
        texto: error instanceof MemoriaInsuficiente ? TEXTOS.memoriaInsuficiente : TEXTOS.errorGeneracion,
      };
    } finally {
      this.motorActivo = null;
    }
    try {
      if (guardada) await this.conversaciones.actualizarMensaje(respuesta);
      else await this.conversaciones.guardarMensaje(respuesta);
    } catch (error) {
      console.warn('No se pudo guardar la respuesta', error);
    }
    alActualizar(respuesta);
    return respuesta;
  }

  /** Detiene la generación en curso (EAC-01: < 500 ms). */
  async detener(): Promise<void> {
    await this.motorActivo?.detener();
  }

  /** Sistema + turno ≤ 1.500 tokens: se quita el fragmento de menor similitud (prompt-sistema.md). */
  private async dentroDelPresupuesto(
    motor: MotorInferencia,
    fragmentos: FragmentoRecuperado[],
    pregunta: string,
  ): Promise<FragmentoRecuperado[]> {
    const tokensSistema = await motor.contarTokens(PROMPT_SISTEMA);
    const seleccion = [...fragmentos];
    while (seleccion.length > 1) {
      const tokensTurno = await motor.contarTokens(armarTurno(seleccion, pregunta));
      if (tokensSistema + tokensTurno <= MAX_TOKENS_INSTRUCCION) break;
      seleccion.pop();
    }
    return seleccion;
  }

  private nuevoMensaje(
    conversacionId: string,
    rol: Mensaje['rol'],
    texto: string,
    estado: Mensaje['estado'],
  ): Mensaje {
    return {
      id: this.conversaciones.nuevoId(),
      conversacionId,
      rol,
      texto,
      banda: null,
      estado,
      ttftMs: null,
      creadoEn: this.reloj.ahora().toISOString(),
      citas: [],
    };
  }
}

function aCita(fragmento: FragmentoRecuperado, i: number): Cita {
  return {
    fragmentoId: fragmento.fragmentoId,
    archivo: fragmento.archivo,
    pagina: fragmento.pagina,
    similitud: fragmento.similitud,
    orden: i + 1,
  };
}
