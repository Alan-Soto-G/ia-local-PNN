import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { textoCita } from '@/aplicacion/configuracion/textos';
import { Colores, Espacio, Radio, Tipo } from '@/constants/theme';

interface Props {
  archivo: string;
  pagina: number;
}

/** Ficha de fuente bajo una respuesta ALTA (EAC-05): "Fauna_v1.pdf · página 1". */
export const CitaFuente = memo(function CitaFuente({ archivo, pagina }: Props) {
  const texto = textoCita(archivo, pagina);
  return (
    <View style={estilos.ficha} accessibilityLabel={`Fuente: ${texto}`}>
      <View style={estilos.flor} accessibilityElementsHidden importantForAccessibility="no" />
      <Text style={estilos.texto}>{texto}</Text>
    </View>
  );
});

const estilos = StyleSheet.create({
  ficha: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Espacio.s,
    paddingVertical: Espacio.xs + 2,
    paddingHorizontal: Espacio.m - 4,
    borderRadius: Radio.s,
    borderWidth: 1,
    borderColor: Colores.borde,
    backgroundColor: Colores.fondo,
  },
  flor: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colores.ambar,
    borderWidth: 1,
    borderColor: Colores.madera,
  },
  texto: {
    ...Tipo.etiqueta,
    color: Colores.texto,
  },
});
