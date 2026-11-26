import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { LIBERAR_EN_SEGUNDO_PLANO_MS } from '@/aplicacion/configuracion/rag';
import { TEXTOS } from '@/aplicacion/configuracion/textos';
import { MemoriaInsuficiente } from '@/aplicacion/errores/MemoriaInsuficiente';
import { useDependencias } from '@/composicion/ProveedorDependencias';

export type EstadoModelos =
  | { readonly tipo: 'preparando' }
  | { readonly tipo: 'listo' }
  | { readonly tipo: 'error'; readonly texto: string };

export interface Modelos {
  readonly estado: EstadoModelos;
  reintentar: () => void;
}

/**
 * Precarga los modelos al abrir el chat (RT-03) a través del Gestor de modelos,
 * y los libera tras 5 minutos en segundo plano (ADR-014, spec 002).
 */
export function useModelos(): Modelos {
  const { gestorModelos } = useDependencias();
  const [estado, setEstado] = useState<EstadoModelos>({ tipo: 'preparando' });

  const cargar = useCallback(
    () =>
      gestorModelos
        .asegurarListos()
        .then(() => setEstado({ tipo: 'listo' }))
        .catch((error: unknown) => {
          console.warn('Modelos no disponibles', error);
          setEstado({
            tipo: 'error',
            texto: error instanceof MemoriaInsuficiente ? TEXTOS.memoriaInsuficiente : TEXTOS.modeloNoDisponible,
          });
        }),
    [gestorModelos],
  );

  useEffect(() => {
    void cargar();
    const suscripcion = AppState.addEventListener('change', (siguiente) => {
      if (siguiente === 'background') {
        gestorModelos.programarLiberacion(LIBERAR_EN_SEGUNDO_PLANO_MS);
      } else if (siguiente === 'active') {
        gestorModelos.cancelarLiberacion();
        void cargar();
      }
    });
    return () => {
      suscripcion.remove();
      // Al salir del chat los modelos quedan residentes; se liberan si la app pasa a segundo plano.
    };
  }, [cargar, gestorModelos]);

  const reintentar = useCallback(() => {
    setEstado({ tipo: 'preparando' });
    void cargar();
  }, [cargar]);

  return { estado, reintentar };
}
