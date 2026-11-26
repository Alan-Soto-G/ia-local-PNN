import { startActivityAsync } from 'expo-intent-launcher';

import type { Desinstalador } from '../../aplicacion/puertos/Desinstalador';

/** `android.intent.action.DELETE` no tiene miembro en `ActivityAction`: se pasa el literal. */
const ACCION_DESINSTALAR = 'android.intent.action.DELETE';

/**
 * Abre el diálogo de desinstalación del sistema para esta app (ADR-015).
 * Requiere `REQUEST_DELETE_PACKAGES` en app.json.
 */
export class DesinstaladorAndroid implements Desinstalador {
  constructor(private readonly paquete: string) {}

  async abrirDesinstalacion(): Promise<void> {
    await startActivityAsync(ACCION_DESINSTALAR, { data: `package:${this.paquete}` });
  }
}
