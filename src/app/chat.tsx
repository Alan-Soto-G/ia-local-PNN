import { router } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import { FlatList, KeyboardAvoidingView, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { textoDisponibleHasta, TEXTOS } from '@/aplicacion/configuracion/textos';
import { BarraPregunta } from '@/components/barra-pregunta';
import { BurbujaMensaje } from '@/components/burbuja-mensaje';
import { LetreroVigencia } from '@/components/letrero-vigencia';
import { PreparandoAsistente } from '@/components/preparando-asistente';
import { Colores, Espacio, Radio, Tipo, Toque } from '@/constants/theme';
import type { Mensaje } from '@/dominio/Mensaje';
import { useChat } from '@/hooks/use-chat';
import { useModelos } from '@/hooks/use-modelos';
import { useVigencia } from '@/hooks/use-vigencia';

/** Chat (CU-02): conversación con respuestas en streaming y citas. */
export default function Chat() {
  const vigencia = useVigencia();
  const modelos = useModelos();
  // En 002 la pantalla vuelve a Inicio al perder la vigencia; 003 abre el diálogo de vencimiento.
  const alPerderVigencia = useCallback(() => router.replace('/'), []);
  const chat = useChat(alPerderVigencia);
  const lista = useRef<FlatList<Mensaje>>(null);

  useEffect(() => {
    if (!vigencia.leyendo && vigencia.estado !== 'vigente') alPerderVigencia();
  }, [vigencia.leyendo, vigencia.estado, alPerderVigencia]);

  const listo = modelos.estado.tipo === 'listo';

  return (
    <SafeAreaView style={estilos.pantalla} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={estilos.pantalla} behavior="height">
        <View style={estilos.cabecera}>
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
            accessibilityRole="button"
            accessibilityLabel={TEXTOS.volver}
            style={({ pressed }) => [estilos.volver, pressed && { backgroundColor: Colores.pista }]}
          >
            <Text style={estilos.volverTexto}>‹ {TEXTOS.volver}</Text>
          </Pressable>
          {vigencia.expiraEn !== null && vigencia.estado === 'vigente' ? (
            <LetreroVigencia compacto texto={textoDisponibleHasta(vigencia.expiraEn, new Date())} />
          ) : null}
        </View>

        {modelos.estado.tipo !== 'listo' ? (
          <PreparandoAsistente
            texto={modelos.estado.tipo === 'error' ? modelos.estado.texto : TEXTOS.preparandoAsistente}
            error={modelos.estado.tipo === 'error'}
            etiquetaReintentar={TEXTOS.reintentar}
            onReintentar={modelos.reintentar}
          />
        ) : null}

        <FlatList
          ref={lista}
          style={estilos.lista}
          contentContainerStyle={estilos.contenidoLista}
          data={chat.mensajes}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => <BurbujaMensaje mensaje={item} />}
          onContentSizeChange={() => lista.current?.scrollToEnd({ animated: true })}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            listo ? (
              <View style={estilos.vacio}>
                <View style={estilos.vacioMarca} accessibilityElementsHidden importantForAccessibility="no" />
                <Text style={estilos.vacioTexto}>{TEXTOS.chatVacio}</Text>
              </View>
            ) : undefined
          }
        />

        <BarraPregunta
          indicacion={TEXTOS.campoPregunta}
          etiquetaEnviar={TEXTOS.enviar}
          etiquetaDetener={TEXTOS.detener}
          generando={chat.generando}
          habilitada={listo}
          onEnviar={(p) => void chat.enviar(p)}
          onDetener={chat.detener}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: Colores.fondo,
  },
  cabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacio.m,
    paddingHorizontal: Espacio.m,
    paddingVertical: Espacio.s,
    backgroundColor: Colores.cielo,
    borderBottomWidth: 3,
    borderBottomColor: Colores.montanaCercana,
  },
  volver: {
    minHeight: Toque.minimo,
    minWidth: Toque.minimo,
    justifyContent: 'center',
    paddingHorizontal: Espacio.s,
    borderRadius: Radio.s,
  },
  volverTexto: {
    ...Tipo.subtitulo,
    color: Colores.primario,
  },
  lista: {
    flex: 1,
  },
  contenidoLista: {
    padding: Espacio.m,
    flexGrow: 1,
  },
  vacio: {
    flex: 1,
    justifyContent: 'center',
    gap: Espacio.m,
    paddingHorizontal: Espacio.m,
  },
  vacioMarca: {
    width: 0,
    height: 0,
    alignSelf: 'center',
    borderLeftWidth: 36,
    borderRightWidth: 36,
    borderBottomWidth: 44,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: Colores.montanaMedia,
  },
  vacioTexto: {
    ...Tipo.cuerpo,
    color: Colores.textoSecundario,
    textAlign: 'center',
  },
});
