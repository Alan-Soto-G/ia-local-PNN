import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import type { EstadoVigencia } from '@/aplicacion/casos-uso/vigencia/ModuloVigencia';
import { useDependencias } from '@/composicion/ProveedorDependencias';

export interface Vigencia extends EstadoVigencia {
  /** `true` hasta la primera lectura de la base. */
  readonly leyendo: boolean;
  refrescar: () => Promise<void>;
}

/**
 * Estado de la vigencia para las pantallas. Se vuelve a leer al volver a primer
 * plano y justo al llegar `expira_en`, para que el bloqueo sea exacto (ADR-015).
 */
export function useVigencia(): Vigencia {
  const { vigencia, reloj } = useDependencias();
  const [estado, setEstado] = useState<EstadoVigencia>({ estado: 'sin_datos', expiraEn: null });
  const [leyendo, setLeyendo] = useState(true);

  const leer = useCallback(
    () =>
      vigencia
        .estado(reloj.ahora())
        .then(setEstado)
        .catch((error: unknown) => console.warn('No se pudo leer la vigencia', error))
        .finally(() => setLeyendo(false)),
    [vigencia, reloj],
  );

  useEffect(() => {
    void leer();
    const suscripcion = AppState.addEventListener('change', (siguiente) => {
      if (siguiente === 'active') void leer();
    });
    return () => suscripcion.remove();
  }, [leer]);

  useEffect(() => {
    if (estado.estado !== 'vigente' || estado.expiraEn === null) return;
    const restante = estado.expiraEn.getTime() - reloj.ahora().getTime();
    // setTimeout admite hasta ~24,8 días; la vigencia es de 24 h.
    const temporizador = setTimeout(() => void leer(), Math.max(restante, 0) + 250);
    return () => clearTimeout(temporizador);
  }, [estado, reloj, leer]);

  return { ...estado, leyendo, refrescar: leer };
}
