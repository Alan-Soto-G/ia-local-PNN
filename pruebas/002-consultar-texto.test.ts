/**
 * Pruebas de lógica de CU-02 con adaptadores falsos (spec 002).
 * Ejecutar: npx tsc -p pruebas && node --test .pruebas/pruebas/
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { ConsultarAsistente } from '../src/aplicacion/casos-uso/consulta/ConsultarAsistente';
import { GestorModelos } from '../src/aplicacion/casos-uso/modelos/GestorModelos';
import { ModuloVigencia } from '../src/aplicacion/casos-uso/vigencia/ModuloVigencia';
import { DURACION_VIGENCIA_MS } from '../src/aplicacion/configuracion/carga';
import {
  MODELO_EMBEDDING,
  MODELO_LOCAL_EMBEDDINGS,
  MODELO_LOCAL_LENGUAJE,
} from '../src/aplicacion/configuracion/modelos';
import { armarTurno, PROMPT_SISTEMA, TEXTO_BAJA, TEXTO_MEDIA } from '../src/aplicacion/configuracion/prompt';
import { MAX_TOKENS_INSTRUCCION } from '../src/aplicacion/configuracion/rag';
import { TEXTOS } from '../src/aplicacion/configuracion/textos';
import { MemoriaInsuficiente } from '../src/aplicacion/errores/MemoriaInsuficiente';
import { ModeloNoDisponible } from '../src/aplicacion/errores/ModeloNoDisponible';
import { SinCargaVigente } from '../src/aplicacion/errores/SinCargaVigente';
import type { BuscadorVectorial, FragmentoRecuperado } from '../src/aplicacion/puertos/BuscadorVectorial';
import type { CodificadorTexto } from '../src/aplicacion/puertos/CodificadorTexto';
import type {
  MotorInferencia,
  OpcionesGeneracion,
  ResultadoGeneracion,
} from '../src/aplicacion/puertos/MotorInferencia';
import type { Notificador } from '../src/aplicacion/puertos/Notificador';
import type { PreparadorModelos } from '../src/aplicacion/puertos/PreparadorModelos';
import type { RepositorioConocimiento } from '../src/aplicacion/puertos/RepositorioConocimiento';
import type { RepositorioConversaciones } from '../src/aplicacion/puertos/RepositorioConversaciones';
import { clasificarBanda } from '../src/dominio/Banda';
import type { Carga } from '../src/dominio/Carga';
import type { Conversacion } from '../src/dominio/Conversacion';
import type { Mensaje } from '../src/dominio/Mensaje';
import { coincideSha256, SHA256_PENDIENTE } from '../src/dominio/ModeloLocal';
import { Vigencia } from '../src/dominio/Vigencia';

// ---------- Adaptadores falsos ----------

class MotorFalso implements MotorInferencia {
  cargado = false;
  cargas = 0;
  llamadas: { sistema: string; turno: string; opciones: OpcionesGeneracion }[] = [];
  respuesta = 'El zorro rojo come pequeños mamíferos, aves e insectos. [Fauna_v1.pdf, página 1]';
  falloAlCargar: Error | null = null;
  falloAlGenerar: Error | null = null;
  /** Tokens por carácter, para probar el presupuesto. */
  tokensPorCaracter = 0.25;
  private detenido = false;

  async cargar() {
    if (this.falloAlCargar) throw this.falloAlCargar;
    this.cargas++;
    this.cargado = true;
  }
  async liberar() {
    this.cargado = false;
  }
  estaCargado() {
    return this.cargado;
  }
  async contarTokens(texto: string) {
    return Math.ceil(texto.length * this.tokensPorCaracter);
  }
  async generar(
    sistema: string,
    turno: string,
    opciones: OpcionesGeneracion,
    alToken: (t: string) => void,
  ): Promise<ResultadoGeneracion> {
    this.llamadas.push({ sistema, turno, opciones });
    if (this.falloAlGenerar) throw this.falloAlGenerar;
    this.detenido = false;
    let texto = '';
    for (const palabra of this.respuesta.split(/(?<= )/)) {
      if (this.detenido) break;
      texto += palabra;
      alToken(palabra);
      await new Promise((r) => setImmediate(r));
    }
    return { texto, detenido: this.detenido, tokensPorSegundo: 20 };
  }
  async detener() {
    this.detenido = true;
  }
}

class CodificadorFalso implements CodificadorTexto {
  cargado = false;
  async cargar() {
    this.cargado = true;
  }
  async liberar() {
    this.cargado = false;
  }
  estaCargado() {
    return this.cargado;
  }
  async vectorizar() {
    return new Float32Array(384).fill(1 / Math.sqrt(384));
  }
}

class BuscadorFalso implements BuscadorVectorial {
  resultados: FragmentoRecuperado[] = [];
  async buscar(_v: Float32Array, k: number) {
    return this.resultados.slice(0, k);
  }
}

class ConversacionesFalsas implements RepositorioConversaciones {
  conversacion: Conversacion | null = null;
  guardados = new Map<string, Mensaje>();
  private n = 0;
  nuevoId() {
    return `id-${++this.n}`;
  }
  async conversacionActual() {
    this.conversacion ??= { id: 'conv-1', iniciadaEn: new Date().toISOString() };
    return this.conversacion;
  }
  async mensajes(conversacionId: string) {
    return [...this.guardados.values()].filter((m) => m.conversacionId === conversacionId);
  }
  async guardarMensaje(m: Mensaje) {
    this.guardados.set(m.id, m);
  }
  async actualizarMensaje(m: Mensaje) {
    if (this.guardados.has(m.id)) this.guardados.set(m.id, m);
  }
  async borrarTodo() {
    this.guardados.clear();
    this.conversacion = null;
  }
}

const notificadorNulo: Notificador = {
  estadoPermiso: async () => 'concedido',
  pedirPermiso: async () => 'concedido',
  programarVencimiento: async () => {},
  cancelarVencimiento: async () => {},
};

function repoCon(carga: Carga): RepositorioConocimiento {
  return { leerCarga: async () => carga, reemplazarTodo: async () => {}, borrarTodo: async () => {} };
}

const CARGA_VIGENTE: Carga = {
  estado: 'vigente',
  vigencia: Vigencia.reconstruir(new Date('2026-11-26T09:00:00'), new Date('2026-11-27T09:00:00')),
  modeloEmbedding: MODELO_EMBEDDING.nombre,
  dimensiones: 384,
  totalDocumentos: 2,
  totalFragmentos: 6,
  urlBackend: 'http://192.168.137.1:8000/api',
};

function frag(id: number, similitud: number, archivo = 'Fauna_v1.pdf', pagina = 1, texto = 'El zorro rojo come…') {
  return { fragmentoId: id, archivo, pagina, texto, similitud };
}

function montar(opciones: { ahora?: Date; prepararFalla?: boolean } = {}) {
  const ahora = opciones.ahora ?? new Date('2026-11-26T15:04:00');
  const reloj = { t: ahora, ahora() { return new Date(this.t); } };
  const motor = new MotorFalso();
  const codificador = new CodificadorFalso();
  const preparador: PreparadorModelos = {
    preparar: async (m) => {
      if (opciones.prepararFalla) throw new ModeloNoDisponible(`${m.archivo}: sha256 PENDIENTE`);
      return `file:///modelos/${m.archivo}`;
    },
  };
  const gestor = new GestorModelos({
    modeloEmbedding: MODELO_EMBEDDING,
    lenguaje: MODELO_LOCAL_LENGUAJE,
    embeddings: MODELO_LOCAL_EMBEDDINGS,
    preparador,
    motor,
    codificador,
  });
  const vigencia = new ModuloVigencia(repoCon(CARGA_VIGENTE), notificadorNulo, DURACION_VIGENCIA_MS);
  const buscador = new BuscadorFalso();
  const conversaciones = new ConversacionesFalsas();
  const caso = new ConsultarAsistente(vigencia, gestor, buscador, conversaciones, reloj);
  return { caso, motor, codificador, buscador, conversaciones, gestor, reloj };
}

// ---------- Escenarios ----------

describe('CU-02 Consultar al asistente por texto', () => {
  it('Bandas con los umbrales iniciales', () => {
    const u = { alta: 0.55, media: 0.4 };
    assert.equal(clasificarBanda(0.55, u), 'ALTA');
    assert.equal(clasificarBanda(0.5499, u), 'MEDIA');
    assert.equal(clasificarBanda(0.4, u), 'MEDIA');
    assert.equal(clasificarBanda(0.3999, u), 'BAJA');
    assert.equal(clasificarBanda(null, u), 'BAJA');
  });

  it('B: ALTA responde en streaming, con citas, TTFT y estado completo', async () => {
    const { caso, buscador, motor } = montar();
    buscador.resultados = [frag(1, 0.81), frag(2, 0.47, 'Flora_v1.pdf', 2), frag(3, 0.31)];
    const versiones: Mensaje[] = [];
    const final = await caso.consultar('¿Qué come el zorro rojo?', (m) => versiones.push(m));

    assert.equal(versiones[0].rol, 'usuario');
    assert.equal(versiones[0].texto, '¿Qué come el zorro rojo?');
    const parciales = versiones.filter((m) => m.rol === 'asistente' && m.estado === 'generando');
    assert.ok(parciales.length > 2, 'hay versiones parciales (streaming)');
    assert.equal(final.estado, 'completo');
    assert.equal(final.banda, 'ALTA');
    assert.ok(final.texto.endsWith('[Fauna_v1.pdf, página 1]'));
    assert.deepEqual(
      final.citas.map((c) => [c.archivo, c.pagina, c.orden]),
      [
        ['Fauna_v1.pdf', 1, 1],
        ['Flora_v1.pdf', 2, 2],
      ],
    );
    assert.notEqual(final.ttftMs, null);
    assert.equal(motor.llamadas.length, 1);
  });

  it('M: MEDIA usa el texto fijo sin invocar el modelo', async () => {
    const { caso, buscador, motor, conversaciones } = montar();
    buscador.resultados = [frag(1, 0.47)];
    const final = await caso.consultar('¿Cuántas especies de colibrí hay?', () => {});
    assert.equal(final.texto, TEXTO_MEDIA);
    assert.equal(final.banda, 'MEDIA');
    assert.equal(final.estado, 'completo');
    assert.equal(final.citas.length, 0);
    assert.equal(motor.llamadas.length, 0);
    assert.equal(conversaciones.guardados.get(final.id)?.texto, TEXTO_MEDIA);
  });

  it('BJ: BAJA usa el texto fijo sin invocar el modelo', async () => {
    const { caso, buscador, motor } = montar();
    buscador.resultados = [frag(1, 0.12)];
    const final = await caso.consultar('¿Quién ganó el último mundial?', () => {});
    assert.equal(final.texto, TEXTO_BAJA);
    assert.equal(final.banda, 'BAJA');
    assert.equal(motor.llamadas.length, 0);
  });

  it('BJ: base sin fragmentos → BAJA', async () => {
    const { caso } = montar();
    assert.equal((await caso.consultar('hola', () => {})).texto, TEXTO_BAJA);
  });

  it('TA/TU: el modelo recibe el prompt exacto, NIVEL ALTO, máx. 4 fragmentos ≥ 0,40 y sin historial', async () => {
    const { caso, buscador, motor } = montar();
    buscador.resultados = [frag(1, 0.9), frag(2, 0.6), frag(3, 0.41), frag(4, 0.39), frag(5, 0.38)];
    await caso.consultar('Primera pregunta', () => {});
    await caso.consultar('Escríbeme un poema sobre el amor', () => {});
    const { sistema, turno, opciones } = motor.llamadas[1];
    assert.equal(sistema, PROMPT_SISTEMA);
    assert.ok(sistema.includes('"Solo puedo responder preguntas sobre el parque y el recorrido."'));
    assert.ok(turno.startsWith('NIVEL: ALTO\nFRAGMENTOS:\n[1] Fauna_v1.pdf, p. 1: '));
    assert.ok(turno.endsWith('PREGUNTA: Escríbeme un poema sobre el amor'));
    assert.equal((turno.match(/^\[\d\]/gm) ?? []).length, 3, 'solo los 3 fragmentos ≥ 0,40');
    assert.ok(!turno.includes('Primera pregunta'), 'sin historial');
    assert.deepEqual(opciones, { temperatura: 0.2, maxTokensNuevos: 256 });
  });

  it('TU: si no cabe en 1.500 tokens se quita el fragmento de menor similitud', async () => {
    const { caso, buscador, motor } = montar();
    const largo = 'x'.repeat(1600);
    buscador.resultados = [frag(1, 0.9, 'A.pdf', 1, largo), frag(2, 0.8, 'B.pdf', 1, largo), frag(3, 0.7, 'C.pdf', 1, largo), frag(4, 0.6, 'D.pdf', 1, largo)];
    const final = await caso.consultar('pregunta', () => {});
    const { sistema, turno } = motor.llamadas[0];
    const total = (await motor.contarTokens(sistema)) + (await motor.contarTokens(turno));
    assert.ok(total <= MAX_TOKENS_INSTRUCCION, `total ${total}`);
    assert.ok(turno.includes('A.pdf') && !turno.includes('D.pdf'));
    assert.deepEqual(final.citas.map((c) => c.archivo), ['A.pdf', 'B.pdf', 'C.pdf']);
  });

  it('armarTurno sigue la plantilla de prompt-sistema.md', () => {
    assert.equal(
      armarTurno([{ archivo: 'Fauna_v2.pdf', pagina: 3, texto: 'T1' }, { archivo: 'Flora_v1.pdf', pagina: 1, texto: 'T2' }], '¿P?'),
      'NIVEL: ALTO\nFRAGMENTOS:\n[1] Fauna_v2.pdf, p. 3: T1\n[2] Flora_v1.pdf, p. 1: T2\nPREGUNTA: ¿P?',
    );
  });

  it('DT: detener deja el mensaje "detenido" con el texto parcial', async () => {
    const { caso, buscador, motor } = montar();
    buscador.resultados = [frag(1, 0.9)];
    motor.respuesta = 'uno dos tres cuatro cinco seis siete ocho nueve diez';
    let parciales = 0;
    const final = await caso.consultar('?', (m) => {
      if (m.rol === 'asistente' && m.estado === 'generando' && m.texto.length > 0 && ++parciales === 3) {
        void caso.detener();
      }
    });
    assert.equal(final.estado, 'detenido');
    assert.ok(final.texto.length > 0 && final.texto.length < motor.respuesta.length);
  });

  it('MN: modelo no disponible → mensaje de error, sin cerrar', async () => {
    const { caso, buscador } = montar({ prepararFalla: true });
    buscador.resultados = [frag(1, 0.9)];
    const final = await caso.consultar('?', () => {});
    assert.equal(final.estado, 'error');
    assert.equal(final.texto, TEXTOS.errorGeneracion);
  });

  it('MN: el Gestor de modelos informa ModeloNoDisponible y permite reintentar', async () => {
    const a = montar({ prepararFalla: true });
    await assert.rejects(a.gestor.asegurarListos(), ModeloNoDisponible);
    assert.equal(a.gestor.estado(), 'error');
    assert.equal(coincideSha256(MODELO_LOCAL_LENGUAJE, 'abc'), false, 'PENDIENTE nunca coincide');
    assert.equal(MODELO_LOCAL_LENGUAJE.sha256, SHA256_PENDIENTE);
  });

  it('MI: memoria insuficiente → texto de memoria y estado error, y se guarda', async () => {
    const { caso, buscador, motor, conversaciones } = montar();
    buscador.resultados = [frag(1, 0.9)];
    motor.falloAlCargar = new MemoriaInsuficiente('oom');
    const final = await caso.consultar('?', () => {});
    assert.equal(final.estado, 'error');
    assert.equal(final.texto, TEXTOS.memoriaInsuficiente);
    assert.equal(conversaciones.guardados.get(final.id)?.estado, 'error');
  });

  it('EG: el motor falla al generar → texto de error', async () => {
    const { caso, buscador, motor, conversaciones } = montar();
    buscador.resultados = [frag(1, 0.9)];
    motor.falloAlGenerar = new Error('decode failed');
    const final = await caso.consultar('?', () => {});
    assert.equal(final.estado, 'error');
    assert.equal(final.texto, TEXTOS.errorGeneracion);
    assert.equal(conversaciones.guardados.get(final.id)?.texto, TEXTOS.errorGeneracion);
  });

  it('V/EAC-08: después de expira_en no se acepta ninguna consulta', async () => {
    const { caso, conversaciones, motor } = montar({ ahora: new Date('2026-11-27T09:00:00') });
    await assert.rejects(caso.consultar('¿Qué come el zorro rojo?', () => {}), SinCargaVigente);
    assert.equal(conversaciones.guardados.size, 0);
    assert.equal(motor.llamadas.length, 0);
    assert.deepEqual(await caso.historial(), []);
  });

  it('CV: al volver se ve la misma conversación', async () => {
    const { caso, buscador } = montar();
    buscador.resultados = [frag(1, 0.47)];
    await caso.consultar('uno', () => {});
    await caso.consultar('dos', () => {});
    const historial = await caso.historial();
    assert.deepEqual(historial.filter((m) => m.rol === 'usuario').map((m) => m.texto), ['uno', 'dos']);
    assert.equal(historial.length, 4);
  });

  it('E4L: el Gestor libera los modelos tras el tiempo programado y los recarga', async () => {
    const { gestor, motor, codificador } = montar();
    await gestor.asegurarListos();
    gestor.programarLiberacion(10);
    await new Promise((r) => setTimeout(r, 30));
    assert.equal(motor.estaCargado(), false);
    assert.equal(codificador.estaCargado(), false);
    await gestor.asegurarListos();
    assert.equal(motor.cargas, 2);
  });

  it('E4L: volver a primer plano cancela la liberación', async () => {
    const { gestor, motor } = montar();
    await gestor.asegurarListos();
    gestor.programarLiberacion(10);
    gestor.cancelarLiberacion();
    await new Promise((r) => setTimeout(r, 30));
    assert.equal(motor.estaCargado(), true);
  });
});
