import {
  AndroidImportance,
  cancelScheduledNotificationAsync,
  getPermissionsAsync,
  requestPermissionsAsync,
  scheduleNotificationAsync,
  SchedulableTriggerInputTypes,
  setNotificationChannelAsync,
  setNotificationHandler,
  type NotificationPermissionsStatus,
} from 'expo-notifications';

import type { EstadoPermiso, Notificador } from '../../aplicacion/puertos/Notificador';

const CANAL = 'vencimiento';
const ID_AVISO = 'vencimiento-carga';

/** Adaptador de notificaciones locales con expo-notifications (ADR-015). */
export class NotificadorExpo implements Notificador {
  private canalListo: Promise<void> | null = null;

  constructor(
    private readonly nombreCanal: string,
    private readonly textoAviso: string,
  ) {
    setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  }

  async estadoPermiso(): Promise<EstadoPermiso> {
    await this.asegurarCanal();
    return traducir(await getPermissionsAsync());
  }

  async pedirPermiso(): Promise<EstadoPermiso> {
    // El canal debe existir antes del diálogo de Android 13+.
    await this.asegurarCanal();
    return traducir(await requestPermissionsAsync());
  }

  async programarVencimiento(fecha: Date): Promise<void> {
    await this.asegurarCanal();
    await scheduleNotificationAsync({
      identifier: ID_AVISO,
      content: { body: this.textoAviso },
      trigger: {
        type: SchedulableTriggerInputTypes.DATE,
        date: fecha,
        channelId: CANAL,
      },
    });
  }

  async cancelarVencimiento(): Promise<void> {
    await cancelScheduledNotificationAsync(ID_AVISO);
  }

  private asegurarCanal(): Promise<void> {
    this.canalListo ??= setNotificationChannelAsync(CANAL, {
      name: this.nombreCanal,
      importance: AndroidImportance.HIGH,
    }).then(() => undefined);
    return this.canalListo;
  }
}

function traducir(permiso: NotificationPermissionsStatus): EstadoPermiso {
  if (permiso.granted) return 'concedido';
  return permiso.canAskAgain ? 'sin_decidir' : 'denegado';
}
