/**
 * Pruebas de lógica de CU-03 con adaptadores falsos y reloj de prueba (spec 003).
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
import { TEXTOS } from '../src/aplicacion/configuracion/textos';
import { SinCargaVigente } from '../src/aplicacion/errores/SinCargaVigente';
import type { Notificador } from '../src/aplicacion/puertos/Notificador';
import type { RepositorioConocimiento } from '../src/aplicacion/puertos/RepositorioConocimiento';
import type { RepositorioConversaciones } from '../src/aplicacion/puertos/RepositorioConversaciones';
import { CARGA_SIN_DATOS, type Carga } from '../src/dominio/Carga';
import { Vigencia } from '../src/dominio/Vigencia';

/** Base en memoria con las 7 tablas de la vista de datos; `borrarTodo` es atómico. */
class BaseFalsa implements RepositorioConocimiento {
  carga: Carga = {
    estado: 'vigente',
    vigencia: Vigencia.reconstruir(new Date('2026-11-26T09:00:00'), new Date('2026-11-27T09:00:00')),
    modeloEmbedding: MODELO_EMBEDDING.nombre,
    dimensiones: 384,
    totalDocumentos: 2,
    totalFragmentos: 3,
    urlBackend: 'http://192.168.137.1:8000/api',
  };
  filas = { documento: 2, fragmento: 3, vec_fragmento: 3, conversacion: 1, mensaje: 4, cita: 1 };
  modelosCopiados = 2;
  async leerCarga() {
    return this.carga;
  }
  async reemplazarTodo() {}
  async borrarTodo() {
    this.filas = { documento: 0, fragmento: 0, vec_fragmento: 0, conversacion: 0, mensaje: 0, cita: 0 };
    this.carga = CARGA_SIN_DATOS;
  }
}

function montar(ahora: Date) {
  const base = new BaseFalsa();
  const eventos: string[] = [];
  const notificador: Notificador = {
    estadoPermiso: async () => 'denegado',
    pedirPermiso: async () => 'denegado',
    programarVencimiento: async () => {
      eventos.push('programar');
    },
    cancelarVencimiento: async () => {
      eventos.push('cancelar');
    },
    abiertaDesdeAviso: async () => false,
    alTocarAviso: () => () => {},
  };
  const modelos = {
    liberar: async () => {
      eventos.push('liberar');
    },
  };
  const desinstalador = {
    abrirDesinstalacion: async () => {
      eventos.push('desinstalar');
    },
  };
  const vigencia = new ModuloVigencia(base, notificador, DURACION_VIGENCIA_MS, modelos, desinstalador);
  return { base, vigencia, eventos, reloj: { ahora: () => new Date(ahora) } };
}

const VENCE = new Date('2026-11-27T09:00:00');

describe('CU-03 Vencer la vigencia', () => {
  it('B: desde expira_en el estado es vencida, aunque no se haya borrado nada', async () => {
    const { vigencia, base } = montar(VENCE);
    assert.equal((await vigencia.estado(new Date('2026-11-27T08:59:59.999'))).estado, 'vigente');
    assert.equal((await vigencia.estado(VENCE)).estado, 'vencida');
    assert.equal(base.filas.documento, 2, 'el bloqueo no depende del borrado');
  });

  it('NO/E8c: "No" libera los modelos, deja 0 filas y la carga en sin_datos; los modelos copiados quedan', async () => {
    const { vigencia, base, eventos } = montar(VENCE);
    await vigencia.vencer('no', VENCE);
    assert.deepEqual(Object.values(base.filas), [0, 0, 0, 0, 0, 0]);
    assert.equal(base.carga.estado, 'sin_datos');
    assert.equal(base.modelosCopiados, 2);
    assert.deepEqual(eventos, ['liberar', 'cancelar']);
    assert.equal((await vigencia.estado(VENCE)).estado, 'sin_datos');
  });

  it('SI/E8d: "Sí" borra lo mismo y luego abre la desinstalación', async () => {
    const { vigencia, base, eventos } = montar(VENCE);
    await vigencia.vencer('si', VENCE);
    assert.deepEqual(Object.values(base.filas), [0, 0, 0, 0, 0, 0]);
    assert.deepEqual(eventos, ['liberar', 'cancelar', 'desinstalar']);
  });

  it('SC: si el usuario cancela en Android, la app queda como con "No"', async () => {
    const { vigencia, base } = montar(VENCE);
    await vigencia.vencer('si', VENCE); // abrirDesinstalacion se resuelve: el usuario volvió
    assert.equal((await vigencia.estado(VENCE)).estado, 'sin_datos');
    assert.equal(base.filas.mensaje, 0);
  });

  it('No se puede vencer una carga vigente', async () => {
    const { vigencia, base } = montar(VENCE);
    await assert.rejects(vigencia.vencer('no', new Date('2026-11-27T08:00:00')));
    assert.equal(base.filas.documento, 2);
  });

  it('NC: una carga nueva cancela el aviso anterior y programa otro', async () => {
    const { vigencia, eventos } = montar(VENCE);
    await vigencia.iniciar(vigencia.calcular(new Date('2026-11-26T15:00:00')));
    assert.deepEqual(eventos, ['cancelar', 'programar']);
    assert.equal(
      vigencia.calcular(new Date('2026-11-26T15:00:00')).expiraEn.getTime(),
      new Date('2026-11-27T15:00:00').getTime(),
    );
  });

  it('E8a: 0 consultas aceptadas en expira_en, 1 s y 1 h después', async () => {
    for (const ahora of [VENCE, new Date(VENCE.getTime() + 1000), new Date(VENCE.getTime() + 3600_000)]) {
      const { vigencia, reloj } = montar(ahora);
      const sinUso = () => {
        throw new Error('no debería usarse');
      };
      const gestor = new GestorModelos({
        modeloEmbedding: MODELO_EMBEDDING,
        lenguaje: MODELO_LOCAL_LENGUAJE,
        embeddings: MODELO_LOCAL_EMBEDDINGS,
        preparador: { preparar: sinUso },
        motor: { cargar: sinUso, liberar: sinUso, estaCargado: () => false, contarTokens: sinUso, generar: sinUso, detener: sinUso },
        codificador: { cargar: sinUso, liberar: sinUso, estaCargado: () => false, vectorizar: sinUso },
      });
      let guardados = 0;
      const conversaciones: RepositorioConversaciones = {
        conversacionActual: async () => ({ id: 'c', iniciadaEn: '' }),
        mensajes: async () => [],
        guardarMensaje: async () => {
          guardados++;
        },
        actualizarMensaje: async () => {},
        nuevoId: () => 'id',
        borrarTodo: async () => {},
      };
      const caso = new ConsultarAsistente(vigencia, gestor, { buscar: sinUso }, conversaciones, reloj);
      await assert.rejects(caso.consultar('¿Qué come el zorro rojo?', () => {}), SinCargaVigente);
      assert.equal(guardados, 0);
    }
  });

  it('E2/PR: el vencimiento no usa red y no deja datos del recorrido', async () => {
    const { vigencia, base } = montar(VENCE);
    // El Módulo Vigencia no recibe ningún ClienteBackend: su constructor solo tiene base, aviso, modelos y desinstalador.
    assert.equal(ModuloVigencia.length, 5);
    await vigencia.vencer('no', VENCE);
    assert.equal(base.filas.fragmento + base.filas.mensaje + base.filas.cita, 0);
  });

  it('Textos del diálogo', () => {
    assert.equal(
      TEXTOS.vencimientoPregunta,
      'Ya no tienes acceso a la información del recorrido. ¿Deseas desinstalar la aplicación?',
    );
    assert.equal(TEXTOS.si, 'Sí');
    assert.equal(TEXTOS.no, 'No');
    assert.equal(
      TEXTOS.notificacionVencimiento,
      'Tu acceso a la información del recorrido terminó. Abre la app para cargarla de nuevo o desinstalarla.',
    );
  });
});
