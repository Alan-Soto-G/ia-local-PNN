/**
 * Textos que ve el usuario, copiados de specs/001-actualizar-informacion/spec.md,
 * ADR-012, ADR-015 y la secuencia de CU-01. Si cambian allá, cambian aquí.
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

/** "Descargando documento 2 de 5…" */
export function textoProgreso(actual: number, total: number): string {
  return `Descargando documento ${actual} de ${total}…`;
}
