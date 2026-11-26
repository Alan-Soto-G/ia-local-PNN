import { StyleSheet, Text, View } from 'react-native';

import { Colores, Espacio, Tipo } from '@/constants/theme';

interface Pico {
  /** Posición del vértice en % del ancho. */
  x: number;
  ancho: number;
  alto: number;
  color: string;
  nieve?: boolean;
}

const LEJANAS: Pico[] = [
  { x: 18, ancho: 220, alto: 92, color: Colores.montanaLejana },
  { x: 62, ancho: 300, alto: 128, color: Colores.montanaLejana, nieve: true }, // el nevado
  { x: 96, ancho: 200, alto: 84, color: Colores.montanaLejana },
];
const MEDIAS: Pico[] = [
  { x: 4, ancho: 240, alto: 70, color: Colores.montanaMedia },
  { x: 44, ancho: 260, alto: 62, color: Colores.montanaMedia },
  { x: 84, ancho: 240, alto: 76, color: Colores.montanaMedia },
];

/** Triángulo dibujado con bordes: sin librerías de gráficos. */
function Montana({ x, ancho, alto, color, nieve }: Pico) {
  const mitad = ancho / 2;
  return (
    <View style={[estilos.pico, { left: `${x}%`, marginLeft: -mitad }]}>
      <View
        style={{
          borderLeftWidth: mitad,
          borderRightWidth: mitad,
          borderBottomWidth: alto,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: color,
        }}
      />
      {nieve ? (
        <View
          style={[
            estilos.nieve,
            {
              borderLeftWidth: mitad * 0.32,
              borderRightWidth: mitad * 0.32,
              borderBottomWidth: alto * 0.32,
              marginLeft: -mitad * 0.32,
            },
          ]}
        />
      ) : null}
    </View>
  );
}

/**
 * Cabecera con la cordillera en capas y el nevado. Las montañas son decorativas
 * y se ocultan a los lectores de pantalla; el texto queda sobre el cielo
 * (contraste 12,6:1).
 */
export function Cordillera() {
  return (
    <View style={estilos.contenedor}>
      <View style={estilos.textos}>
        <Text style={estilos.antetitulo}>PNN LOS NEVADOS</Text>
        <Text style={estilos.titulo} accessibilityRole="header">
          Asistente de interpretación ambiental
        </Text>
      </View>
      <View style={estilos.cordillera} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {LEJANAS.map((p) => (
          <Montana key={`l${p.x}`} {...p} />
        ))}
        {MEDIAS.map((p) => (
          <Montana key={`m${p.x}`} {...p} />
        ))}
        <View style={estilos.suelo} />
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    backgroundColor: Colores.cielo,
    overflow: 'hidden',
  },
  textos: {
    paddingHorizontal: Espacio.l,
    paddingTop: Espacio.l,
    paddingBottom: Espacio.s,
    gap: Espacio.xs,
  },
  antetitulo: {
    ...Tipo.etiqueta,
    color: Colores.primario,
  },
  titulo: {
    ...Tipo.titulo,
    color: Colores.texto,
    maxWidth: 320,
  },
  cordillera: {
    height: 140,
  },
  pico: {
    position: 'absolute',
    bottom: 18,
    alignItems: 'center',
  },
  nieve: {
    position: 'absolute',
    top: 0,
    left: '50%',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: Colores.nieve,
  },
  suelo: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 22,
    backgroundColor: Colores.montanaCercana,
    borderTopLeftRadius: 80,
    borderTopRightRadius: 120,
  },
});
