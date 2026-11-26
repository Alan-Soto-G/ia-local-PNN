import { useCallback, useState } from 'react';

import { textoCargaLista, textoProgreso, TEXTOS } from '@/aplicacion/configuracion/textos';
import { BackendNoDisponible } from '@/aplicacion/errores/BackendNoDisponible';
import { CargaIncompleta } from '@/aplicacion/errores/CargaIncompleta';
import { ModeloEmbeddingIncompatible } from '@/aplicacion/errores/ModeloEmbeddingIncompatible';
import { SinDocumentosEnBackend } from '@/aplicacion/errores/SinDocumentosEnBackend';
import { useDependencias } from '@/composicion/ProveedorDependencias';

export type EstadoActualizacion =
  | { readonly tipo: 'inactivo' }
  | { readonly tipo: 'cargando'; readonly texto: string | null; readonly actual: number; readonly total: number }
  | { readonly tipo: 'exito'; readonly texto: string }
  | { readonly tipo: 'error'; readonly texto: string };

export interface Actualizacion {
  readonly estado: EstadoActualizacion;
  readonly pedirPermiso: boolean;
  actualizar: () => Promise<void>;
  permitirAvisos: () => Promise<void>;
  ahoraNo: () => void;
}

/** Texto de cada error de CU-01 (spec 001). */
function textoDeError(error: unknown): string {
  if (error instanceof BackendNoDisponible) return TEXTOS.backendNoDisponible;
  if (error instanceof ModeloEmbeddingIncompatible) return TEXTOS.modeloIncompatible;
  if (error instanceof SinDocumentosEnBackend) return TEXTOS.sinDocumentos;
  if (error instanceof CargaIncompleta && error.habiaInformacionAnterior) return TEXTOS.cargaIncompletaConAnterior;
  return TEXTOS.cargaIncompleta;
}

/**
 * CU-01 para la pantalla de Inicio. `alTerminar` se llama tras una carga exitosa
 * para refrescar la vigencia.
 */
export function useActualizacion(alTerminar: () => Promise<void>): Actualizacion {
  const { actualizarInformacion, notificador, reloj } = useDependencias();
  const [estado, setEstado] = useState<EstadoActualizacion>({ tipo: 'inactivo' });
  const [pedirPermiso, setPedirPermiso] = useState(false);

  const actualizar = useCallback(async () => {
    setPedirPermiso(false);
    setEstado({ tipo: 'cargando', texto: null, actual: 0, total: 0 });
    try {
      const resultado = await actualizarInformacion.ejecutar((actual, total) =>
        setEstado({ tipo: 'cargando', texto: textoProgreso(actual, total), actual, total }),
      );
      setEstado({ tipo: 'exito', texto: textoCargaLista(resultado.vigencia.expiraEn, reloj.ahora()) });
      await alTerminar();
      const permiso = await notificador.estadoPermiso().catch(() => 'concedido' as const);
      setPedirPermiso(permiso === 'sin_decidir');
    } catch (error) {
      console.warn('Actualización fallida', error);
      setEstado({ tipo: 'error', texto: textoDeError(error) });
      await alTerminar();
    }
  }, [actualizarInformacion, notificador, reloj, alTerminar]);

  const permitirAvisos = useCallback(async () => {
    setPedirPermiso(false);
    try {
      await notificador.pedirPermiso();
    } catch (error) {
      console.warn('No se pudo pedir el permiso de notificaciones', error);
    }
  }, [notificador]);

  const ahoraNo = useCallback(() => setPedirPermiso(false), []);

  return { estado, pedirPermiso, actualizar, permitirAvisos, ahoraNo };
}
