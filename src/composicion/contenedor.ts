import { ActualizarInformacion } from '../aplicacion/casos-uso/actualizacion/ActualizarInformacion';
import { GestorModelos } from '../aplicacion/casos-uso/modelos/GestorModelos';
import { ModuloVigencia } from '../aplicacion/casos-uso/vigencia/ModuloVigencia';
import { DURACION_VIGENCIA_MS, LIMITE_DESCARGA_MS, LIMITE_SALUD_MS } from '../aplicacion/configuracion/carga';
import { MODELO_EMBEDDING } from '../aplicacion/configuracion/modelos';
import { TEXTOS } from '../aplicacion/configuracion/textos';
import type { Notificador } from '../aplicacion/puertos/Notificador';
import type { Reloj } from '../aplicacion/puertos/Reloj';
import { obtenerBaseLocal } from '../infraestructura/persistencia/BaseLocal';
import { RepositorioConocimientoSqlite } from '../infraestructura/persistencia/RepositorioConocimientoSqlite';
import { ClienteBackendHttp } from '../infraestructura/red/ClienteBackendHttp';
import { NotificadorExpo } from '../infraestructura/sistema/NotificadorExpo';
import { RelojSistema } from '../infraestructura/sistema/RelojSistema';

const URL_BACKEND_POR_DEFECTO = 'http://192.168.137.1:8000/api';

/** Lo que las pantallas pueden usar, a través de los hooks. */
export interface Contenedor {
  readonly reloj: Reloj;
  readonly notificador: Notificador;
  readonly vigencia: ModuloVigencia;
  readonly actualizarInformacion: ActualizarInformacion;
}

/** Único lugar que conoce todas las capas (ADR-008). */
export function crearContenedor(): Contenedor {
  const reloj = new RelojSistema();
  const notificador = new NotificadorExpo('Vencimiento de la información', TEXTOS.notificacionVencimiento);
  const repositorio = new RepositorioConocimientoSqlite(obtenerBaseLocal);
  const gestorModelos = new GestorModelos(MODELO_EMBEDDING);
  const vigencia = new ModuloVigencia(repositorio, notificador, DURACION_VIGENCIA_MS);
  const cliente = new ClienteBackendHttp(
    process.env.EXPO_PUBLIC_BACKEND_URL ?? URL_BACKEND_POR_DEFECTO,
    LIMITE_SALUD_MS,
    LIMITE_DESCARGA_MS,
  );
  const actualizarInformacion = new ActualizarInformacion(cliente, repositorio, gestorModelos, vigencia, reloj);
  return { reloj, notificador, vigencia, actualizarInformacion };
}
