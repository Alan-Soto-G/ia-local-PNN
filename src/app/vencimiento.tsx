import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { BackHandler, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TEXTOS } from '@/aplicacion/configuracion/textos';
import { DialogoVencimiento } from '@/components/dialogo-vencimiento';
import { Colores } from '@/constants/theme';
import { useVencimiento } from '@/hooks/use-vencimiento';

/** Diálogo de vencimiento (CU-03). "Atrás" de Android equivale a "No" (spec 003). */
export default function Vencimiento() {
  const { procesando, responder } = useVencimiento();

  useFocusEffect(
    useCallback(() => {
      const suscripcion = BackHandler.addEventListener('hardwareBackPress', () => {
        responder('no');
        return true;
      });
      return () => suscripcion.remove();
    }, [responder]),
  );

  return (
    <SafeAreaView style={estilos.pantalla} edges={['top', 'bottom']}>
      <DialogoVencimiento
        pregunta={TEXTOS.vencimientoPregunta}
        etiquetaSi={TEXTOS.si}
        etiquetaNo={TEXTOS.no}
        procesando={procesando}
        onSi={() => responder('si')}
        onNo={() => responder('no')}
      />
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: Colores.montanaCercana,
  },
});
