/**
 * Pruebas de lógica de CU-01 con adaptadores falsos (spec 001).
 * Ejecutar: npx tsc -p pruebas && node --test .pruebas/pruebas/
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { ActualizarInformacion } from '../src/aplicacion/casos-uso/actualizacion/ActualizarInformacion';
import { GestorModelos } from '../src/aplicacion/casos-uso/modelos/GestorModelos';
import { ModuloVigencia } from '../src/aplicacion/casos-uso/vigencia/ModuloVigencia';
import { DURACION_VIGENCIA_MS } from '../src/aplicacion/configuracion/carga';
import { MODELO_EMBEDDING } from '../src/aplicacion/configuracion/modelos';
import { textoCargaLista, textoDisponibleHasta, textoProgreso } from '../src/aplicacion/configuracion/textos';
import { BackendNoDisponible } from '../src/aplicacion/errores/BackendNoDisponible';
import { CargaIncompleta } from '../src/aplicacion/errores/CargaIncompleta';
import { ModeloEmbeddingIncompatible } from '../src/aplicacion/errores/ModeloEmbeddingIncompatible';
import { SinDocumentosEnBackend } from '../src/aplicacion/errores/SinDocumentosEnBackend';
import type { ClienteBackend, SaludBackend } from '../src/aplicacion/puertos/ClienteBackend';
import type { EstadoPermiso, Notificador } from '../src/aplicacion/puertos/Notificador';
import type { RepositorioConocimiento } from '../src/aplicacion/puertos/RepositorioConocimiento';
import { CARGA_SIN_DATOS, type Carga } from '../src/dominio/Carga';
import type { Documento } from '../src/dominio/Documento';
import type { Fragmento } from '../src/dominio/Fragmento';
import { Vigencia } from '../src/dominio/Vigencia';

// ---------- Datos del spec ----------

function doc(id: number, nombre: string, version: number, numFragmentos: number): Documento {
  return {
    id,
    nombre,
    version,
    archivo: `${nombre}_v${version}.pdf`,
    paginas: 1,
    numFragmentos,
    sha256: `sha-${id}`,
    creadoEn: '2026-11-26T15:04:05Z',
  };
}

function frags(documentoId: number, n: number, dims = 384): Fragmento[] {
  return Array.from({ length: n }, (_, i) => ({
    id: documentoId * 100 + i,
    documentoId,
    indice: i,
    pagina: 1,
    texto: `texto ${documentoId}-${i}`,
    caracteres: 10,
    vector: new Float32Array(dims).fill(1 / Math.sqrt(dims)),
  }));
}

const SALUD_OK: SaludBackend = {
  tablasListas: true,
  modeloEmbedding: 'paraphrase-multilingual-MiniLM-L12-v2',
  dimensiones: 384,
};

// ---------- Adaptadores falsos ----------

class BackendFalso implements ClienteBackend {
  readonly urlBase = 'http://192.168.137.1:8000/api';
  llamadas: string[] = [];
  salud_: SaludBackend | Error = SALUD_OK;
  documentos_: Documento[] = [doc(1, 'Fauna', 1, 4), doc(2, 'Flora', 1, 2), doc(3, 'Fauna', 2, 1)];
  fragmentos_ = new Map<number, Fragmento[]>([
    [1, frags(1, 4)],
    [2, frags(2, 2)],
    [3, frags(3, 1)],
  ]);
  /** Falla al pedir los fragmentos del documento con este índice de llamada (1 = primero). */
  cortarEnLlamada: number | null = null;
  private llamadasFragmentos = 0;

  async salud(): Promise<SaludBackend> {
    this.llamadas.push('salud');
    if (this.salud_ instanceof Error) throw this.salud_;
    return this.salud_;
  }
  async documentos(): Promise<Documento[]> {
    this.llamadas.push('documentos');
    return this.documentos_;
  }
  async fragmentos(id: number): Promise<Fragmento[]> {
    this.llamadas.push(`fragmentos:${id}`);
    this.llamadasFragmentos++;
    if (this.cortarEnLlamada === this.llamadasFragmentos) throw new Error('Network request failed');
    return this.fragmentos_.get(id) ?? [];
  }
}

/** Repositorio en memoria con semántica de transacción: todo o nada. */
class RepositorioFalso implements RepositorioConocimiento {
  carga: Carga = CARGA_SIN_DATOS;
  documentos: Documento[] = [];
  fragmentos: Fragmento[] = [];
  conversaciones = 3;
  fallarEscritura = false;

  async leerCarga(): Promise<Carga> {
    return this.carga;
  }
  async reemplazarTodo(carga: Carga, documentos: readonly Documento[], fragmentos: readonly Fragmento[]) {
    if (this.fallarEscritura) throw new Error('SQLITE_FULL');
    this.carga = carga;
    this.documentos = [...documentos];
    this.fragmentos = [...fragmentos];
    this.conversaciones = 0;
  }
  async borrarTodo() {
    this.carga = CARGA_SIN_DATOS;
    this.documentos = [];
    this.fragmentos = [];
    this.conversaciones = 0;
  }
}

class NotificadorFalso implements Notificador {
  programada: Date | null = null;
  canceladas = 0;
  permiso: EstadoPermiso = 'sin_decidir';
  async estadoPermiso() {
    return this.permiso;
  }
  async pedirPermiso() {
    return this.permiso;
  }
  async programarVencimiento(fecha: Date) {
    this.programada = fecha;
  }
  async cancelarVencimiento() {
    this.canceladas++;
    this.programada = null;
  }
}

class RelojFalso {
  constructor(public t: Date) {}
  ahora() {
    return new Date(this.t);
  }
}

function montar(ahora = new Date('2026-11-26T15:04:00')) {
  const backend = new BackendFalso();
  const repo = new RepositorioFalso();
  const notificador = new NotificadorFalso();
  const reloj = new RelojFalso(ahora);
  const vigencia = new ModuloVigencia(repo, notificador, DURACION_VIGENCIA_MS);
  const caso = new ActualizarInformacion(backend, repo, new GestorModelos(MODELO_EMBEDDING), vigencia, reloj);
  return { backend, repo, notificador, reloj, vigencia, caso };
}

/** Deja el repositorio con una carga vigente de 2 documentos que vence mañana a las 09:00. */
function conCargaPrevia(repo: RepositorioFalso) {
  repo.carga = {
    estado: 'vigente',
    vigencia: Vigencia.reconstruir(new Date('2026-11-26T09:00:00'), new Date('2026-11-27T09:00:00')),
    modeloEmbedding: SALUD_OK.modeloEmbedding,
    dimensiones: 384,
    totalDocumentos: 2,
    totalFragmentos: 3,
    urlBackend: 'http://192.168.137.1:8000/api',
  };
  repo.documentos = [doc(10, 'Rutas', 1, 1), doc(11, 'Normas', 1, 2)];
  return { ...repo.carga, documentos: [...repo.documentos] };
}

// ---------- Escenarios ----------

describe('CU-01 Actualizar información', () => {
  it('B: primera carga, solo la versión más alta y vigencia de 24 h', async () => {
    const { caso, repo, notificador } = montar();
    const progreso: string[] = [];
    const r = await caso.ejecutar((a, t) => progreso.push(textoProgreso(a, t)));

    assert.deepEqual(repo.documentos.map((d) => d.archivo).sort(), ['Fauna_v2.pdf', 'Flora_v1.pdf']);
    assert.equal(repo.fragmentos.length, 3);
    assert.equal(repo.carga.estado, 'vigente');
    assert.equal(r.vigencia.expiraEn.getTime() - r.vigencia.cargadoEn.getTime(), 24 * 3600 * 1000);
    assert.equal(
      textoCargaLista(r.vigencia.expiraEn, new Date('2026-11-26T15:04:00')),
      'Información lista. Disponible hasta mañana a las 15:04.',
    );
    assert.equal(notificador.programada?.getTime(), r.vigencia.expiraEn.getTime());
    assert.deepEqual(progreso, ['Descargando documento 1 de 2…', 'Descargando documento 2 de 2…']);
  });

  it('PR: texto de progreso del spec', () => {
    assert.equal(textoProgreso(2, 5), 'Descargando documento 2 de 5…');
  });

  it('NV: nueva carga vigente reemplaza base, borra conversaciones y reprograma el aviso', async () => {
    const { caso, repo, notificador } = montar();
    conCargaPrevia(repo);
    notificador.programada = new Date('2026-11-27T09:00:00');
    const r = await caso.ejecutar();
    assert.equal(repo.conversaciones, 0);
    assert.equal(repo.carga.vigencia?.expiraEn.getTime(), new Date('2026-11-27T15:04:00').getTime());
    assert.equal(notificador.canceladas, 1);
    assert.equal(notificador.programada?.getTime(), r.vigencia.expiraEn.getTime());
  });

  it('SB/NL: backend no disponible no toca la base', async () => {
    const { caso, repo, backend } = montar();
    const antes = conCargaPrevia(repo);
    backend.salud_ = new BackendNoDisponible('timeout');
    await assert.rejects(caso.ejecutar(), BackendNoDisponible);
    assert.deepEqual(repo.documentos, antes.documentos);
    assert.equal(repo.carga.vigencia, antes.vigencia);
    assert.deepEqual(backend.llamadas, ['salud']);
  });

  it('SB: una falla desconocida en la salud se traduce a BackendNoDisponible', async () => {
    const { caso, backend } = montar();
    backend.salud_ = new Error('Network request failed');
    await assert.rejects(caso.ejecutar(), BackendNoDisponible);
  });

  it('ST: tables_ready false → sin documentos, sin pedir /documents', async () => {
    const { caso, backend } = montar();
    backend.salud_ = { ...SALUD_OK, tablasListas: false };
    await assert.rejects(caso.ejecutar(), SinDocumentosEnBackend);
    assert.deepEqual(backend.llamadas, ['salud']);
  });

  it('MI/E7: otro modelo u otras dimensiones → rechazo antes de /documents', async () => {
    for (const salud of [
      { ...SALUD_OK, modeloEmbedding: 'multilingual-e5-small' },
      { ...SALUD_OK, dimensiones: 768 },
    ]) {
      const { caso, backend, repo } = montar();
      const antes = conCargaPrevia(repo);
      backend.salud_ = salud;
      await assert.rejects(caso.ejecutar(), ModeloEmbeddingIncompatible);
      assert.deepEqual(backend.llamadas, ['salud']);
      assert.equal(repo.carga.vigencia, antes.vigencia);
    }
  });

  it('E7: el modelo esperado sale de la constante del APK', async () => {
    const backend = new BackendFalso();
    const repo = new RepositorioFalso();
    const notificador = new NotificadorFalso();
    const reloj = new RelojFalso(new Date());
    const caso = new ActualizarInformacion(
      backend,
      repo,
      new GestorModelos({ nombre: 'otro-modelo', dimensiones: 384 }),
      new ModuloVigencia(repo, notificador, DURACION_VIGENCIA_MS),
      reloj,
    );
    await assert.rejects(caso.ejecutar(), ModeloEmbeddingIncompatible);
  });

  it('SD: lista vacía → sin documentos', async () => {
    const { caso, backend, repo } = montar();
    const antes = conCargaPrevia(repo);
    backend.documentos_ = [];
    await assert.rejects(caso.ejecutar(), SinDocumentosEnBackend);
    assert.deepEqual(repo.documentos, antes.documentos);
  });

  it('CC: corte a mitad → CargaIncompleta con información anterior intacta', async () => {
    const { caso, backend, repo, notificador } = montar();
    const antes = conCargaPrevia(repo);
    notificador.programada = new Date('2026-11-27T09:00:00');
    backend.cortarEnLlamada = 2;
    await assert.rejects(caso.ejecutar(), (e: unknown) => e instanceof CargaIncompleta && e.habiaInformacionAnterior);
    assert.deepEqual(repo.documentos, antes.documentos);
    assert.equal(repo.carga.vigencia?.expiraEn.getTime(), new Date('2026-11-27T09:00:00').getTime());
    assert.equal(notificador.canceladas, 0);
    assert.equal(notificador.programada.getTime(), new Date('2026-11-27T09:00:00').getTime());
  });

  it('CS: falla sin información previa → sigue sin_datos', async () => {
    const { caso, backend, repo } = montar();
    backend.cortarEnLlamada = 1;
    await assert.rejects(caso.ejecutar(), (e: unknown) => e instanceof CargaIncompleta && !e.habiaInformacionAnterior);
    assert.equal(repo.carga.estado, 'sin_datos');
  });

  it('CS: falla de escritura → CargaIncompleta y nada aplicado', async () => {
    const { caso, repo } = montar();
    const antes = conCargaPrevia(repo);
    repo.fallarEscritura = true;
    await assert.rejects(caso.ejecutar(), CargaIncompleta);
    assert.deepEqual(repo.documentos, antes.documentos);
  });

  it('DI: cantidad distinta a num_chunks o vector de 383 valores → rechazo', async () => {
    const a = montar();
    a.backend.fragmentos_.set(2, frags(2, 1));
    await assert.rejects(a.caso.ejecutar(), CargaIncompleta);
    assert.equal(a.repo.carga.estado, 'sin_datos');

    const b = montar();
    b.backend.fragmentos_.set(2, frags(2, 2, 383));
    await assert.rejects(b.caso.ejecutar(), CargaIncompleta);
    assert.equal(b.repo.carga.estado, 'sin_datos');
  });

  it('E3a: 10 cortes provocados en distintos momentos → 0 cargas a medias', async () => {
    let intactas = 0;
    for (let corte = 1; corte <= 10; corte++) {
      const { caso, backend, repo } = montar();
      const antes = conCargaPrevia(repo);
      // 10 documentos distintos: el corte cae en un punto distinto de la descarga cada vez.
      backend.documentos_ = Array.from({ length: 10 }, (_, i) => doc(i + 1, `Doc${i}`, 1, 1));
      backend.fragmentos_ = new Map(Array.from({ length: 10 }, (_, i) => [i + 1, frags(i + 1, 1)]));
      backend.cortarEnLlamada = corte;
      await assert.rejects(caso.ejecutar(), CargaIncompleta);
      if (
        JSON.stringify(repo.documentos) === JSON.stringify(antes.documentos) &&
        repo.carga.vigencia === antes.vigencia
      ) {
        intactas++;
      }
    }
    assert.equal(intactas, 10);
  });

  it('Vigencia: el estado pasa a vencida en el instante expira_en', async () => {
    const { repo, vigencia } = montar();
    conCargaPrevia(repo);
    assert.equal((await vigencia.estado(new Date('2026-11-27T08:59:59'))).estado, 'vigente');
    assert.equal((await vigencia.estado(new Date('2026-11-27T09:00:00'))).estado, 'vencida');
  });

  it('E6: letrero de vigencia', () => {
    const ahora = new Date('2026-11-26T09:00:00');
    assert.equal(textoDisponibleHasta(new Date('2026-11-26T15:04:00'), ahora), 'Disponible hasta las 15:04');
    assert.equal(
      textoDisponibleHasta(new Date('2026-11-27T15:04:00'), ahora),
      'Disponible hasta mañana a las 15:04',
    );
  });
});
