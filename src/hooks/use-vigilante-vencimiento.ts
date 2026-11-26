import { router, usePathname } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { useDependencias } from '@/composicion/ProveedorDependencias';

const RUTA_VENCIMIENTO = '/vencimiento';

const solicitudes = new Set<() => void>();

/**
 * Pide al vigilante que revise la vigencia ya (por ejemplo, el chat recibió
 * `SinCargaVigente`). Así solo el vigilante navega al diálogo.
 */
export function solicitarRevisionVencimiento(): void {
  for (const revisar of solicitudes) revisar();
}

/**
 * Vigilante del vencimiento (CU-03, ADR-015), montado en el layout raíz. Revisa
 * al abrir, al volver a primer plano, al llegar `expira_en` y al tocar el aviso;
 * con `vencida` lleva al diálogo de vencimiento.
 */
export function useVigilanteVencimiento(): void {
  const { vigencia, reloj, notificador } = useDependencias();
  const ruta = usePathname();
  const rutaActual = useRef(ruta);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);
  const revisarRef = useRef<() => void>(() => {});

  useEffect(() => {
    rutaActual.current = ruta;
  }, [ruta]);

  const revisar = useCallback(() => {
    vigencia
      .estado(reloj.ahora())
      .then(({ estado, expiraEn }) => {
        if (temporizador.current !== null) clearTimeout(temporizador.current);
        temporizador.current = null;
        if (estado === 'vencida') {
          if (rutaActual.current === RUTA_VENCIMIENTO) return;
          if (rutaActual.current === '/chat') router.replace(RUTA_VENCIMIENTO);
          else router.push(RUTA_VENCIMIENTO);
          return;
        }
        if (estado === 'vigente' && expiraEn !== null) {
          // setTimeout admite hasta ~24,8 días; la vigencia es de 24 h.
          const restante = Math.max(expiraEn.getTime() - reloj.ahora().getTime(), 0);
          temporizador.current = setTimeout(() => revisarRef.current(), restante + 250);
        }
      })
      .catch((error: unknown) => console.warn('No se pudo revisar la vigencia', error));
  }, [vigencia, reloj]);

  useEffect(() => {
    revisarRef.current = revisar;
    solicitudes.add(revisar);
    revisar();
    void notificador
      .abiertaDesdeAviso()
      .then((desdeAviso) => {
        if (desdeAviso) revisar();
      })
      .catch(() => undefined);
    const dejarDeEscuchar = notificador.alTocarAviso(revisar);
    const suscripcion = AppState.addEventListener('change', (siguiente) => {
      if (siguiente === 'active') revisar();
    });
    return () => {
      solicitudes.delete(revisar);
      dejarDeEscuchar();
      suscripcion.remove();
      if (temporizador.current !== null) clearTimeout(temporizador.current);
    };
  }, [revisar, notificador]);

  // Una carga nueva cambia expira_en: se vuelve a programar al cambiar de pantalla.
  useEffect(() => {
    revisar();
  }, [ruta, revisar]);
}
