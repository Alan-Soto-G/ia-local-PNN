import { useVigilanteVencimiento } from '@/hooks/use-vigilante-vencimiento';

/** Monta el vigilante del vencimiento dentro del proveedor de dependencias (CU-03). */
export function VigilanteVencimiento() {
  useVigilanteVencimiento();
  return null;
}
