import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { textoDisponibleHasta, TEXTOS } from '@/aplicacion/configuracion/textos';
import { AvisoEstado } from '@/components/aviso-estado';
import { BotonGrande } from '@/components/boton-grande';
import { Cordillera } from '@/components/cordillera';
import { ExplicacionPermiso } from '@/components/explicacion-permiso';
import { LetreroVigencia } from '@/components/letrero-vigencia';
import { ProgresoCarga } from '@/components/progreso-carga';
import { Colores, Espacio } from '@/constants/theme';
import { useActualizacion } from '@/hooks/use-actualizacion';
import { useVigencia } from '@/hooks/use-vigencia';

/** Inicio (CU-01): actualizar la información y ver hasta cuándo está disponible. */
export default function Inicio() {
  const vigencia = useVigencia();
  const { estado, pedirPermiso, actualizar, permitirAvisos, ahoraNo } = useActualizacion(vigencia.refrescar);
  const cargando = estado.tipo === 'cargando';

  return (
    <SafeAreaView style={estilos.pantalla} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={estilos.contenido} bounces={false}>
        <Cordillera />
        <View style={estilos.cuerpo}>
          {vigencia.estado === 'vigente' && vigencia.expiraEn !== null ? (
            <LetreroVigencia texto={textoDisponibleHasta(vigencia.expiraEn, new Date())} />
          ) : null}

          {estado.tipo === 'cargando' && estado.texto !== null ? (
            <ProgresoCarga texto={estado.texto} actual={estado.actual} total={estado.total} />
          ) : null}
          {estado.tipo === 'exito' ? <AvisoEstado tipo="exito" texto={estado.texto} /> : null}
          {estado.tipo === 'error' ? <AvisoEstado tipo="error" texto={estado.texto} /> : null}

          {pedirPermiso ? (
            <ExplicacionPermiso
              texto={TEXTOS.explicacionPermiso}
              etiquetaPermitir={TEXTOS.permitirAvisos}
              etiquetaAhoraNo={TEXTOS.ahoraNo}
              onPermitir={() => void permitirAvisos()}
              onAhoraNo={ahoraNo}
            />
          ) : null}
        </View>
      </ScrollView>

      <View style={estilos.acciones}>
        {vigencia.estado === 'vigente' ? (
          <BotonGrande
            etiqueta={TEXTOS.hacerPregunta}
            onPress={() => router.push('/chat')}
            variante="laguna"
            deshabilitado={cargando}
          />
        ) : null}
        <BotonGrande
          etiqueta={TEXTOS.actualizar}
          onPress={() => void actualizar()}
          ocupado={cargando}
          deshabilitado={vigencia.leyendo}
          variante={vigencia.estado === 'vigente' ? 'contorno' : 'primario'}
        />
      </View>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: Colores.fondo,
  },
  contenido: {
    flexGrow: 1,
  },
  cuerpo: {
    padding: Espacio.l,
  },
  acciones: {
    paddingHorizontal: Espacio.l,
    paddingTop: Espacio.s,
    paddingBottom: Espacio.m,
    gap: Espacio.s,
    backgroundColor: Colores.fondo,
    borderTopWidth: 1,
    borderTopColor: Colores.borde,
  },
});
