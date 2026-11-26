import { router } from 'expo-router';
import { useCallback, useState } from 'react';

import type { DecisionVencimiento } from '@/aplicacion/casos-uso/vigencia/ModuloVigencia';
import { useDependencias } from '@/composicion/ProveedorDependencias';

export interface Vencimiento {
  readonly procesando: boolean;
  responder: (decision: DecisionVencimiento) => void;
}

/**
 * Acciones del diálogo de vencimiento (CU-03). Con "Sí" la promesa termina
 * cuando el usuario vuelve del diálogo de Android (canceló); en ambos casos se
 * vuelve a Inicio con "Actualizar información".
 */
export function useVencimiento(): Vencimiento {
  const { vigencia, reloj } = useDependencias();
  const [procesando, setProcesando] = useState(false);

  const responder = useCallback(
    (decision: DecisionVencimiento) => {
      if (procesando) return;
      setProcesando(true);
      vigencia
        .vencer(decision, reloj.ahora())
        .catch((error: unknown) => console.warn('No se pudo completar el vencimiento', error))
        .finally(() => {
          setProcesando(false);
          if (router.canDismiss()) router.dismissTo('/');
          else router.replace('/');
        });
    },
    [procesando, vigencia, reloj],
  );

  return { procesando, responder };
}
