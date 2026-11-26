import { StyleSheet, Text, View } from 'react-native';

import { Colores, Espacio, Radio, Tipo } from '@/constants/theme';

interface Props {
  texto: string;
}

/**
 * Vigencia como letrero de sendero de madera (EAC-06: siempre visible con carga
 * vigente). Crema sobre madera: contraste 11,2:1.
 */
export function LetreroVigencia({ texto }: Props) {
  return (
    <View style={estilos.contenedor} accessibilityRole="summary" accessibilityLabel={texto}>
      <View style={estilos.tabla}>
        <View style={estilos.clavo} />
        <Text style={estilos.texto}>{texto}</Text>
        <View style={estilos.clavo} />
      </View>
      <View style={estilos.punta} />
      <View style={estilos.postes} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <View style={estilos.poste} />
      </View>
    </View>
  );
}

const ALTO = 60;

const estilos = StyleSheet.create({
  contenedor: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: Espacio.m,
  },
  tabla: {
    minHeight: ALTO,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacio.s,
    backgroundColor: Colores.madera,
    paddingHorizontal: Espacio.m,
    paddingVertical: Espacio.s,
    borderTopLeftRadius: Radio.s,
    borderBottomLeftRadius: Radio.s,
    borderWidth: 2,
    borderRightWidth: 0,
    borderColor: Colores.sobreMadera,
    flexShrink: 1,
  },
  texto: {
    ...Tipo.subtitulo,
    color: Colores.sobreMadera,
    flexShrink: 1,
  },
  clavo: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colores.sobreMadera,
  },
  punta: {
    width: 0,
    height: 0,
    borderTopWidth: ALTO / 2,
    borderBottomWidth: ALTO / 2,
    borderLeftWidth: 26,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: Colores.madera,
  },
  postes: {
    position: 'absolute',
    left: 28,
    bottom: -Espacio.m,
  },
  poste: {
    width: 10,
    height: Espacio.m,
    backgroundColor: Colores.madera,
  },
});
