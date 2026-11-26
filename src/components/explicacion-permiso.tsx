import { StyleSheet, Text, View } from 'react-native';

import { BotonGrande } from '@/components/boton-grande';
import { Colores, Espacio, Radio, Tipo } from '@/constants/theme';

interface Props {
  texto: string;
  etiquetaPermitir: string;
  etiquetaAhoraNo: string;
  onPermitir: () => void;
  onAhoraNo: () => void;
}

/** Explica para qué es el aviso antes del diálogo de Android (ADR-015, R-06). */
export function ExplicacionPermiso({ texto, etiquetaPermitir, etiquetaAhoraNo, onPermitir, onAhoraNo }: Props) {
  return (
    <View style={estilos.tarjeta}>
      <View style={estilos.franja} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
      <Text style={estilos.texto}>{texto}</Text>
      <View style={estilos.acciones}>
        <BotonGrande etiqueta={etiquetaPermitir} onPress={onPermitir} variante="laguna" />
        <BotonGrande etiqueta={etiquetaAhoraNo} onPress={onAhoraNo} variante="contorno" />
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    backgroundColor: Colores.superficie,
    borderRadius: Radio.m,
    borderWidth: 1,
    borderColor: Colores.borde,
    padding: Espacio.m,
    paddingTop: Espacio.l,
    gap: Espacio.m,
    marginBottom: Espacio.m,
    overflow: 'hidden',
  },
  franja: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 8,
    backgroundColor: Colores.ambar,
  },
  texto: {
    ...Tipo.cuerpo,
    color: Colores.texto,
  },
  acciones: {
    gap: Espacio.s,
  },
});
