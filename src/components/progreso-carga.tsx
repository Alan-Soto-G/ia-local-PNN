import { StyleSheet, Text, View } from 'react-native';

import { Colores, Espacio, Radio, Tipo } from '@/constants/theme';

interface Props {
  texto: string;
  actual: number;
  total: number;
}

/** "Descargando documento 2 de 5…" con barra determinada (spec 001, progreso). */
export function ProgresoCarga({ texto, actual, total }: Props) {
  const fraccion = total > 0 ? Math.min(actual / total, 1) : 0;
  return (
    <View
      style={estilos.contenedor}
      accessibilityRole="progressbar"
      accessibilityLabel={texto}
      accessibilityValue={{ min: 0, max: total, now: actual }}
      accessibilityLiveRegion="polite"
    >
      <Text style={estilos.texto}>{texto}</Text>
      <View style={estilos.pista}>
        <View style={[estilos.relleno, { width: `${fraccion * 100}%` }]} />
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    gap: Espacio.s,
    marginBottom: Espacio.m,
  },
  texto: {
    ...Tipo.cuerpo,
    color: Colores.texto,
  },
  pista: {
    height: 14,
    borderRadius: Radio.s,
    backgroundColor: Colores.pista,
    borderWidth: 1,
    borderColor: Colores.borde,
    overflow: 'hidden',
  },
  relleno: {
    height: '100%',
    backgroundColor: Colores.primario,
  },
});
