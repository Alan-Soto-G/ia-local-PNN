import { ActualizarInformacion } from '../aplicacion/casos-uso/actualizacion/ActualizarInformacion';
import { ConsultarAsistente } from '../aplicacion/casos-uso/consulta/ConsultarAsistente';
import { GestorModelos } from '../aplicacion/casos-uso/modelos/GestorModelos';
import { ModuloVigencia } from '../aplicacion/casos-uso/vigencia/ModuloVigencia';
import { DURACION_VIGENCIA_MS, LIMITE_DESCARGA_MS, LIMITE_SALUD_MS } from '../aplicacion/configuracion/carga';
import {
  MODELO_EMBEDDING,
  MODELO_LOCAL_EMBEDDINGS,
  MODELO_LOCAL_LENGUAJE,
} from '../aplicacion/configuracion/modelos';
import { CONTEXTO_LENGUAJE } from '../aplicacion/configuracion/rag';
import { TEXTOS } from '../aplicacion/configuracion/textos';
import type { Notificador } from '../aplicacion/puertos/Notificador';
import type { Reloj } from '../aplicacion/puertos/Reloj';
import { CodificadorLlama } from '../infraestructura/ia/CodificadorLlama';
import { MotorLlama } from '../infraestructura/ia/MotorLlama';
import { PreparadorModelosExpo } from '../infraestructura/ia/PreparadorModelosExpo';
import { obtenerBaseLocal } from '../infraestructura/persistencia/BaseLocal';
import { BuscadorVectorialSqlite } from '../infraestructura/persistencia/BuscadorVectorialSqlite';
import { RepositorioConocimientoSqlite } from '../infraestructura/persistencia/RepositorioConocimientoSqlite';
import { RepositorioConversacionesSqlite } from '../infraestructura/persistencia/RepositorioConversacionesSqlite';
import { ClienteBackendHttp } from '../infraestructura/red/ClienteBackendHttp';
import { NotificadorExpo } from '../infraestructura/sistema/NotificadorExpo';
import { RelojSistema } from '../infraestructura/sistema/RelojSistema';

const URL_BACKEND_POR_DEFECTO = 'http://192.168.137.1:8000/api';

/** Lo que las pantallas pueden usar, a través de los hooks. */
export interface Contenedor {
  readonly reloj: Reloj;
  readonly notificador: Notificador;
  readonly vigencia: ModuloVigencia;
  readonly gestorModelos: GestorModelos;
  readonly actualizarInformacion: ActualizarInformacion;
  readonly consultarAsistente: ConsultarAsistente;
}

/** Único lugar que conoce todas las capas (ADR-008). */
export function crearContenedor(): Contenedor {
  const reloj = new RelojSistema();
  const notificador = new NotificadorExpo('Vencimiento de la información', TEXTOS.notificacionVencimiento);
  const conocimiento = new RepositorioConocimientoSqlite(obtenerBaseLocal);
  const conversaciones = new RepositorioConversacionesSqlite(obtenerBaseLocal, () => reloj.ahora());
  const gestorModelos = new GestorModelos({
    modeloEmbedding: MODELO_EMBEDDING,
    lenguaje: MODELO_LOCAL_LENGUAJE,
    embeddings: MODELO_LOCAL_EMBEDDINGS,
    preparador: new PreparadorModelosExpo(),
    motor: new MotorLlama(CONTEXTO_LENGUAJE),
    codificador: new CodificadorLlama(MODELO_EMBEDDING.dimensiones),
  });
  const vigencia = new ModuloVigencia(conocimiento, notificador, DURACION_VIGENCIA_MS);
  const cliente = new ClienteBackendHttp(
    process.env.EXPO_PUBLIC_BACKEND_URL ?? URL_BACKEND_POR_DEFECTO,
    LIMITE_SALUD_MS,
    LIMITE_DESCARGA_MS,
  );
  const actualizarInformacion = new ActualizarInformacion(cliente, conocimiento, gestorModelos, vigencia, reloj);
  const consultarAsistente = new ConsultarAsistente(
    vigencia,
    gestorModelos,
    new BuscadorVectorialSqlite(obtenerBaseLocal),
    conversaciones,
    reloj,
  );
  return { reloj, notificador, vigencia, gestorModelos, actualizarInformacion, consultarAsistente };
}
