import { StyleSheet, Text, View } from 'react-native';

import { BotonGrande } from '@/components/boton-grande';
import { Colores, Espacio, Radio, Tipo } from '@/constants/theme';

interface Props {
  pregunta: string;
  etiquetaSi: string;
  etiquetaNo: string;
  procesando: boolean;
  onSi: () => void;
  onNo: () => void;
}

const ESTRELLAS = [
  { top: 18, left: '12%' },
  { top: 42, left: '30%' },
  { top: 12, left: '55%' },
  { top: 58, left: '72%' },
  { top: 26, left: '88%' },
] as const;

/**
 * Diálogo de vencimiento (ADR-015) como noche en el páramo: la jornada terminó.
 * "No" es la acción principal y segura; "Sí" va aparte, en rojo de peligro.
 */
export function DialogoVencimiento({ pregunta, etiquetaSi, etiquetaNo, procesando, onSi, onNo }: Props) {
  return (
    <View style={estilos.fondo}>
      <View style={estilos.cielo} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {ESTRELLAS.map((e) => (
          <View key={`${e.top}-${e.left}`} style={[estilos.estrella, { top: e.top, left: e.left }]} />
        ))}
        <View style={estilos.luna} />
        <View style={[estilos.cerro, estilos.cerroLejano]} />
        <View style={[estilos.cerro, estilos.cerroCercano]} />
      </View>

      <View style={estilos.contenido}>
        <View style={estilos.letrero}>
          <Text style={estilos.pregunta} accessibilityRole="header">
            {pregunta}
          </Text>
        </View>

        <View style={estilos.acciones}>
          <BotonGrande etiqueta={etiquetaNo} onPress={onNo} variante="contorno" ocupado={procesando} />
          <View style={estilos.separador} />
          <BotonGrande etiqueta={etiquetaSi} onPress={onSi} variante="peligro" deshabilitado={procesando} />
        </View>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  fondo: {
    flex: 1,
    backgroundColor: Colores.noche,
  },
  cielo: {
    height: 220,
    overflow: 'hidden',
  },
  estrella: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colores.sobreNoche,
  },
  luna: {
    position: 'absolute',
    top: 36,
    right: 48,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colores.sobreNoche,
  },
  cerro: {
    position: 'absolute',
    bottom: -120,
    width: 360,
    height: 260,
    transform: [{ rotate: '45deg' }],
    borderRadius: 24,
  },
  cerroLejano: {
    left: -40,
    backgroundColor: Colores.montanaMedia,
  },
  cerroCercano: {
    right: -110,
    bottom: -150,
    backgroundColor: Colores.montanaCercana,
  },
  contenido: {
    flex: 1,
    justifyContent: 'space-between',
    padding: Espacio.l,
    backgroundColor: Colores.montanaCercana,
  },
  letrero: {
    padding: Espacio.l,
    borderRadius: Radio.m,
    borderWidth: 2,
    borderColor: Colores.sobreMadera,
    backgroundColor: Colores.madera,
  },
  pregunta: {
    ...Tipo.subtitulo,
    fontSize: 24,
    lineHeight: 32,
    color: Colores.sobreMadera,
  },
  acciones: {
    gap: Espacio.s,
  },
  separador: {
    height: Espacio.l,
  },
});
