import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { BotonGrande } from '@/components/boton-grande';
import { Colores, Espacio, Radio, Tipo } from '@/constants/theme';

interface Props {
  /** Texto de preparación o del error. */
  texto: string;
  error: boolean;
  etiquetaReintentar: string;
  onReintentar: () => void;
}

/** "Preparando el asistente…" (ADR-013) o el error de ModeloNoDisponible con "Reintentar". */
export function PreparandoAsistente({ texto, error, etiquetaReintentar, onReintentar }: Props) {
  return (
    <View
      style={[estilos.tarjeta, error && estilos.tarjetaError]}
      accessibilityRole={error ? 'alert' : 'progressbar'}
      accessibilityLiveRegion="polite"
    >
      {error ? null : <ActivityIndicator size="large" color={Colores.primario} />}
      <Text style={[estilos.texto, error && { color: Colores.textoError }]}>{texto}</Text>
      {error ? <BotonGrande etiqueta={etiquetaReintentar} onPress={onReintentar} /> : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    margin: Espacio.l,
    padding: Espacio.l,
    gap: Espacio.m,
    alignItems: 'stretch',
    borderRadius: Radio.m,
    backgroundColor: Colores.superficie,
    borderWidth: 1,
    borderColor: Colores.borde,
  },
  tarjetaError: {
    backgroundColor: Colores.fondoError,
    borderColor: Colores.error,
  },
  texto: {
    ...Tipo.cuerpo,
    color: Colores.texto,
    textAlign: 'center',
  },
});
