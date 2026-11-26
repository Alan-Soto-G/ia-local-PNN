/**
 * Estado de la Carga (vista lógica, ciclo de vida de la Carga).
 * `cargando` solo existe en memoria mientras corre la transacción (vista de datos).
 */
export type EstadoCarga = 'sin_datos' | 'cargando' | 'vigente' | 'vencida';

/** Estados que se guardan en la tabla `carga`. */
export type EstadoCargaPersistido = Exclude<EstadoCarga, 'cargando'>;
