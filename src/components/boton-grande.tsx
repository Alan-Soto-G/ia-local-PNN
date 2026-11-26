import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Colores, Espacio, Radio, Tipo, Toque } from '@/constants/theme';

type Variante = 'primario' | 'laguna' | 'contorno';

interface Props {
  etiqueta: string;
  onPress: () => void;
  variante?: Variante;
  deshabilitado?: boolean;
  ocupado?: boolean;
  pista?: string;
}

const FONDO: Record<Variante, { normal: string; presionado: string; texto: string }> = {
  primario: { normal: Colores.primario, presionado: Colores.primarioPresionado, texto: Colores.sobrePrimario },
  laguna: { normal: Colores.laguna, presionado: Colores.primarioPresionado, texto: Colores.sobreLaguna },
  contorno: { normal: Colores.superficie, presionado: Colores.pista, texto: Colores.primario },
};

/**
 * Botón para una mano en campo (EAC-06): 64 dp de alto, ancho completo,
 * respuesta al toque sin mover el diseño y estados claros.
 */
export function BotonGrande({ etiqueta, onPress, variante = 'primario', deshabilitado, ocupado, pista }: Props) {
  const inactivo = deshabilitado === true || ocupado === true;
  const colores = FONDO[variante];
  return (
    <Pressable
      onPress={onPress}
      disabled={inactivo}
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      accessibilityHint={pista}
      accessibilityState={{ disabled: inactivo, busy: ocupado === true }}
      android_ripple={{ color: Colores.primarioPresionado }}
      style={({ pressed }) => [
        estilos.boton,
        variante === 'contorno' && estilos.contorno,
        {
          backgroundColor: inactivo ? Colores.deshabilitado : pressed ? colores.presionado : colores.normal,
        },
      ]}
    >
      <View style={estilos.contenido}>
        {ocupado ? <ActivityIndicator color={Colores.sobreDeshabilitado} /> : null}
        <Text style={[estilos.texto, { color: inactivo ? Colores.sobreDeshabilitado : colores.texto }]}>
          {etiqueta}
        </Text>
      </View>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  boton: {
    minHeight: Toque.botonAlto,
    borderRadius: Radio.l,
    paddingHorizontal: Espacio.l,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  contorno: {
    borderWidth: 2,
    borderColor: Colores.primario,
  },
  contenido: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Espacio.s,
  },
  texto: {
    ...Tipo.boton,
    textAlign: 'center',
  },
});
