import { memo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { TEXTOS } from '@/aplicacion/configuracion/textos';
import { CitaFuente } from '@/components/cita-fuente';
import { Colores, Espacio, Radio, Tipo } from '@/constants/theme';
import type { Mensaje } from '@/dominio/Mensaje';

interface Props {
  mensaje: Mensaje;
}

/**
 * Burbuja de la conversación. El usuario va a la derecha (musgo); el asistente
 * a la izquierda, sobre papel claro con un hito de sendero. Memoizada: durante
 * el streaming solo se vuelve a pintar la burbuja que crece (ADR-004).
 */
export const BurbujaMensaje = memo(function BurbujaMensaje({ mensaje }: Props) {
  if (mensaje.rol === 'usuario') {
    return (
      <View style={[estilos.fila, estilos.filaUsuario]}>
        <View style={[estilos.burbuja, estilos.usuario]}>
          <Text style={[estilos.texto, { color: Colores.sobrePrimario }]}>{mensaje.texto}</Text>
        </View>
      </View>
    );
  }

  const error = mensaje.estado === 'error';
  const esperando = mensaje.estado === 'generando' && mensaje.texto.length === 0;
  return (
    <View style={estilos.fila}>
      <View style={[estilos.hito, error && estilos.hitoError]} accessibilityElementsHidden importantForAccessibility="no" />
      <View
        style={[estilos.burbuja, estilos.asistente, error && estilos.asistenteError]}
        accessibilityLiveRegion={mensaje.estado === 'generando' ? 'none' : 'polite'}
      >
        {esperando ? (
          <ActivityIndicator color={Colores.primario} accessibilityLabel={TEXTOS.preparandoAsistente} />
        ) : (
          <Text style={[estilos.texto, { color: error ? Colores.textoError : Colores.texto }]}>
            {error ? `! ${mensaje.texto}` : mensaje.texto}
          </Text>
        )}
        {mensaje.estado === 'detenido' ? <Text style={estilos.nota}>{TEXTOS.respuestaDetenida}</Text> : null}
        {mensaje.citas.length > 0 && mensaje.estado !== 'generando' ? (
          <View style={estilos.citas}>
            {mensaje.citas.map((c) => (
              <CitaFuente key={c.orden} archivo={c.archivo} pagina={c.pagina} />
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
});

const estilos = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Espacio.s,
    marginBottom: Espacio.m,
  },
  filaUsuario: {
    justifyContent: 'flex-end',
    paddingLeft: Espacio.xxl,
  },
  burbuja: {
    paddingVertical: Espacio.m - 4,
    paddingHorizontal: Espacio.m,
    borderRadius: Radio.l,
    gap: Espacio.s,
    flexShrink: 1,
  },
  usuario: {
    backgroundColor: Colores.primario,
    borderBottomRightRadius: Radio.s,
  },
  asistente: {
    backgroundColor: Colores.superficie,
    borderWidth: 1,
    borderColor: Colores.borde,
    borderTopLeftRadius: Radio.s,
    marginRight: Espacio.l,
  },
  asistenteError: {
    backgroundColor: Colores.fondoError,
    borderColor: Colores.error,
  },
  hito: {
    width: 12,
    height: 28,
    marginTop: Espacio.s,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    backgroundColor: Colores.madera,
  },
  hitoError: {
    backgroundColor: Colores.error,
  },
  texto: {
    ...Tipo.cuerpo,
  },
  nota: {
    ...Tipo.etiqueta,
    color: Colores.textoSecundario,
    fontStyle: 'italic',
  },
  citas: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Espacio.s,
  },
});
