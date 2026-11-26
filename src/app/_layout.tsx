import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { VigilanteVencimiento } from '@/components/vigilante-vencimiento';
import { ProveedorDependencias } from '@/composicion/ProveedorDependencias';
import { Colores } from '@/constants/theme';

export default function LayoutRaiz() {
  return (
    <SafeAreaProvider>
      <ProveedorDependencias>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colores.fondo } }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="chat" />
          <Stack.Screen name="vencimiento" options={{ gestureEnabled: false, animation: 'fade' }} />
        </Stack>
        <VigilanteVencimiento />
      </ProveedorDependencias>
    </SafeAreaProvider>
  );
}
