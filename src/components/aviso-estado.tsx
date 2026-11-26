import { StyleSheet, Text, View } from 'react-native';

import { Colores, Espacio, Radio, Tipo } from '@/constants/theme';

interface Props {
  tipo: 'exito' | 'error';
  texto: string;
}

/**
 * Resultado de una acción. El tipo se distingue por forma y símbolo además del
 * color (no solo color), y se anuncia a los lectores de pantalla.
 */
export function AvisoEstado({ tipo, texto }: Props) {
  const exito = tipo === 'exito';
  return (
    <View
      style={[estilos.contenedor, exito ? estilos.exito : estilos.error]}
      accessibilityRole={exito ? 'text' : 'alert'}
      accessibilityLiveRegion="polite"
    >
      <View style={[estilos.marca, exito ? estilos.marcaExito : estilos.marcaError]}>
        <Text style={estilos.simbolo} accessibilityElementsHidden importantForAccessibility="no">
          {exito ? '✓' : '!'}
        </Text>
      </View>
      <Text style={[estilos.texto, { color: exito ? Colores.textoExito : Colores.textoError }]}>{texto}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Espacio.m,
    padding: Espacio.m,
    borderRadius: Radio.m,
    borderLeftWidth: 6,
    marginBottom: Espacio.m,
  },
  exito: {
    backgroundColor: Colores.fondoExito,
    borderLeftColor: Colores.primario,
  },
  error: {
    backgroundColor: Colores.fondoError,
    borderLeftColor: Colores.error,
  },
  marca: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  marcaExito: {
    borderRadius: 16,
    backgroundColor: Colores.primario,
  },
  marcaError: {
    borderRadius: 4,
    transform: [{ rotate: '45deg' }],
    backgroundColor: Colores.error,
  },
  simbolo: {
    ...Tipo.subtitulo,
    color: Colores.sobrePrimario,
  },
  texto: {
    ...Tipo.cuerpo,
    flex: 1,
  },
});
