import { useCallback, useEffect, useRef, useState } from 'react';

import { SinCargaVigente } from '@/aplicacion/errores/SinCargaVigente';
import { useDependencias } from '@/composicion/ProveedorDependencias';
import type { Mensaje } from '@/dominio/Mensaje';

/** Intervalo de pintado del texto en streaming (ADR-004). */
const INTERVALO_PINTADO_MS = 50;

export interface Chat {
  readonly mensajes: readonly Mensaje[];
  readonly generando: boolean;
  enviar: (pregunta: string) => Promise<void>;
  detener: () => void;
}

/**
 * CU-02 para la pantalla de chat. Agrupa los tokens y pinta cada ~50 ms;
 * `alPerderVigencia` se llama si la carga ya no está vigente (EAC-08).
 */
export function useChat(alPerderVigencia: () => void): Chat {
  const { consultarAsistente } = useDependencias();
  const [mensajes, setMensajes] = useState<readonly Mensaje[]>([]);
  const [generando, setGenerando] = useState(false);
  const pendiente = useRef<Mensaje | null>(null);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let activo = true;
    consultarAsistente
      .historial()
      .then((h) => {
        if (activo) setMensajes(h);
      })
      .catch((error: unknown) => console.warn('No se pudo leer la conversación', error));
    return () => {
      activo = false;
      if (temporizador.current !== null) clearTimeout(temporizador.current);
    };
  }, [consultarAsistente]);

  const aplicar = useCallback((mensaje: Mensaje) => {
    setMensajes((actuales) => {
      const i = actuales.findIndex((m) => m.id === mensaje.id);
      if (i === -1) return [...actuales, mensaje];
      const copia = actuales.slice();
      copia[i] = mensaje;
      return copia;
    });
  }, []);

  const alActualizar = useCallback(
    (mensaje: Mensaje) => {
      if (mensaje.estado !== 'generando') {
        // Mensajes nuevos o finales: se pintan de inmediato.
        if (temporizador.current !== null) clearTimeout(temporizador.current);
        temporizador.current = null;
        pendiente.current = null;
        aplicar(mensaje);
        return;
      }
      pendiente.current = mensaje;
      temporizador.current ??= setTimeout(() => {
        temporizador.current = null;
        if (pendiente.current !== null) aplicar(pendiente.current);
        pendiente.current = null;
      }, INTERVALO_PINTADO_MS);
    },
    [aplicar],
  );

  const enviar = useCallback(
    async (pregunta: string) => {
      if (pregunta.trim().length === 0) return;
      setGenerando(true);
      try {
        await consultarAsistente.consultar(pregunta, alActualizar);
      } catch (error) {
        if (error instanceof SinCargaVigente) alPerderVigencia();
        else console.warn('No se pudo consultar', error);
      } finally {
        setGenerando(false);
      }
    },
    [consultarAsistente, alActualizar, alPerderVigencia],
  );

  const detener = useCallback(() => {
    void consultarAsistente.detener();
  }, [consultarAsistente]);

  return { mensajes, generando, enviar, detener };
}
