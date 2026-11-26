/**
 * Textos que ve el usuario, copiados de los spec.md de specs/, de los ADR y de
 * las secuencias. Si cambian allá, cambian aquí. Los del modelo están en prompt.ts.
 */
export const TEXTOS = {
  actualizar: 'Actualizar información',
  backendNoDisponible:
    'No encontramos el punto de información del parque. Conéctate a su red Wi-Fi e inténtalo de nuevo.',
  modeloIncompatible: 'La información del punto no es compatible con esta versión de la app.',
  sinDocumentos: 'Aún no hay documentos cargados en el punto de información.',
  cargaIncompleta: 'No se pudo completar la carga.',
  cargaIncompletaConAnterior: 'No se pudo completar la carga. Tu información anterior sigue disponible.',
  explicacionPermiso:
    'Te avisaremos cuando termine tu acceso a la información del recorrido, dentro de 24 horas.',
  permitirAvisos: 'Permitir avisos',
  ahoraNo: 'Ahora no',
  notificacionVencimiento:
    'Tu acceso a la información del recorrido terminó. Abre la app para cargarla de nuevo o desinstalarla.',

  // CU-02 (specs/002-consultar-texto/spec.md, ADR-013)
  hacerPregunta: 'Hacer una pregunta',
  volver: 'Volver',
  chatVacio:
    'Pregunta sobre la fauna, la flora, los senderos o las normas del parque. Respondo solo con los documentos del recorrido.',
  campoPregunta: 'Escribe tu pregunta sobre el recorrido',
  enviar: 'Enviar',
  detener: 'Detener',
  preparandoAsistente: 'Preparando el asistente…',
  modeloNoDisponible: 'No pudimos preparar el asistente. Toca Reintentar; si el problema sigue, reinstala la aplicación.',
  reintentar: 'Reintentar',
  memoriaInsuficiente:
    'El teléfono no tiene memoria suficiente para el asistente. Cierra otras aplicaciones e inténtalo de nuevo.',
  errorGeneracion: 'No pude terminar la respuesta. Inténtalo de nuevo.',
  respuestaDetenida: 'Respuesta detenida',

  // CU-03 (specs/003-vencer-vigencia/spec.md, ADR-015)
  vencimientoPregunta: 'Ya no tienes acceso a la información del recorrido. ¿Deseas desinstalar la aplicación?',
  si: 'Sí',
  no: 'No',
} as const;

function hora(fecha: Date): string {
  const hh = String(fecha.getHours()).padStart(2, '0');
  const mm = String(fecha.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function mismoDia(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  );
}

/** "hasta las 15:04" o "hasta mañana a las 15:04", según el día de `ahora`. */
function hasta(expiraEn: Date, ahora: Date): string {
  return mismoDia(expiraEn, ahora) ? `hasta las ${hora(expiraEn)}` : `hasta mañana a las ${hora(expiraEn)}`;
}

/** "Información lista. Disponible hasta mañana a las 15:04." */
export function textoCargaLista(expiraEn: Date, ahora: Date): string {
  return `Información lista. Disponible ${hasta(expiraEn, ahora)}.`;
}

/** Letrero de vigencia: "Disponible hasta las 15:04" (EAC-06). */
export function textoDisponibleHasta(expiraEn: Date, ahora: Date): string {
  return `Disponible ${hasta(expiraEn, ahora)}`;
}

/** Ficha de una cita: "Fauna_v1.pdf · página 1". */
export function textoCita(archivo: string, pagina: number): string {
  return `${archivo} · página ${pagina}`;
}

/** "Descargando documento 2 de 5…" */
export function textoProgreso(actual: number, total: number): string {
  return `Descargando documento ${actual} de ${total}…`;
}
