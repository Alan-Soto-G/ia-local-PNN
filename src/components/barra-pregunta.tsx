import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Colores, Espacio, Radio, Tipo, Toque } from '@/constants/theme';

interface Props {
  indicacion: string;
  etiquetaEnviar: string;
  etiquetaDetener: string;
  generando: boolean;
  /** Falso mientras los modelos no están listos. */
  habilitada: boolean;
  onEnviar: (pregunta: string) => void;
  onDetener: () => void;
}

/** Campo y botón "Enviar" / "Detener" de 56 dp (EAC-06). */
export function BarraPregunta({
  indicacion,
  etiquetaEnviar,
  etiquetaDetener,
  generando,
  habilitada,
  onEnviar,
  onDetener,
}: Props) {
  const [texto, setTexto] = useState('');
  const vacia = texto.trim().length === 0;
  const puedeEnviar = habilitada && !generando && !vacia;

  const enviar = () => {
    if (!puedeEnviar) return;
    onEnviar(texto.trim());
    setTexto('');
  };

  const inactivo = !generando && !puedeEnviar;
  return (
    <View style={estilos.barra}>
      <TextInput
        value={texto}
        onChangeText={setTexto}
        placeholder={indicacion}
        placeholderTextColor={Colores.textoSecundario}
        accessibilityLabel={indicacion}
        editable={habilitada && !generando}
        multiline
        maxLength={500}
        style={estilos.campo}
        returnKeyType="send"
        submitBehavior="blurAndSubmit"
        onSubmitEditing={enviar}
      />
      <Pressable
        onPress={generando ? onDetener : enviar}
        disabled={inactivo}
        accessibilityRole="button"
        accessibilityLabel={generando ? etiquetaDetener : etiquetaEnviar}
        accessibilityState={{ disabled: inactivo }}
        style={({ pressed }) => [
          estilos.boton,
          {
            backgroundColor: inactivo
              ? Colores.deshabilitado
              : generando
                ? Colores.error
                : pressed
                  ? Colores.primarioPresionado
                  : Colores.primario,
          },
        ]}
      >
        {generando ? <View style={estilos.cuadro} /> : null}
        <Text style={[estilos.etiqueta, { color: inactivo ? Colores.sobreDeshabilitado : Colores.sobrePrimario }]}>
          {generando ? etiquetaDetener : etiquetaEnviar}
        </Text>
      </Pressable>
    </View>
  );
}

const estilos = StyleSheet.create({
  barra: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Espacio.s,
    paddingHorizontal: Espacio.m,
    paddingTop: Espacio.s,
    paddingBottom: Espacio.m,
    borderTopWidth: 1,
    borderTopColor: Colores.borde,
    backgroundColor: Colores.fondo,
  },
  campo: {
    ...Tipo.cuerpo,
    flex: 1,
    minHeight: Toque.minimo,
    maxHeight: 140,
    paddingHorizontal: Espacio.m,
    paddingVertical: Espacio.m - 2,
    borderRadius: Radio.m,
    borderWidth: 2,
    borderColor: Colores.primario,
    backgroundColor: Colores.superficie,
    color: Colores.texto,
  },
  boton: {
    minHeight: Toque.minimo,
    minWidth: 104,
    paddingHorizontal: Espacio.m,
    borderRadius: Radio.m,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Espacio.s,
  },
  cuadro: {
    width: 12,
    height: 12,
    borderRadius: 2,
    backgroundColor: Colores.sobreError,
  },
  etiqueta: {
    ...Tipo.boton,
  },
});
