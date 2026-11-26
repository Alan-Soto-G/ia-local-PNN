# ADR-011: Build solo para Android con EAS y development build

## Estado

Aceptado (2026-11-26)

## Contexto

La primera versión es un APK para Android 11+ ARM64 ([RT-04](../drivers.md#3-restricciones)). llama.rn, whisper.rn y onnxruntime-react-native son módulos nativos que no vienen en Expo Go, y llama.rn exige New Architecture. AGENTS.md prohíbe editar `android/` a mano (Continuous Native Generation). Preocupación: [PA-09](../drivers.md#4-preocupaciones-arquitectónicas).

## Alternativas consideradas

- **A) Expo Go.** No incluye los módulos nativos de IA: no sirve.
- **B) Proyecto nativo con `android/` versionado.** Control total, pero se pierde CNG y cada actualización de SDK es manual.
- **C) CNG + development build + EAS Build.** La configuración nativa vive en `app.json` y en config plugins; `android/` se genera. Se desarrolla con un development build y se distribuye un APK generado por EAS.

## Decisión

Se elige la opción C.

- Perfiles de EAS: `development` (development build para probar en un teléfono real) y `preview` (APK instalable para la prueba de campo con guías).
- Solo ARM64 (`arm64-v8a`) para reducir el tamaño del APK.
- Permisos en `app.json`: cámara, micrófono e internet (solo para descargar y sincronizar).
- sqlite-vec se activa con el config plugin de expo-sqlite (ADR-005).
- La variable `EXPO_PUBLIC_BACKEND_URL` se define en `.env` para desarrollo local y como variable de entorno de EAS para los builds, porque `.env` está ignorado en git y EAS no lo sube.
- iOS no se configura en esta etapa.

## Consecuencias

### Positivas

- Sin mantener `android/` a mano; las actualizaciones de SDK siguen el camino de Expo.
- Un APK liviano, sin modelos (ADR-007).

### Negativas y costos aceptados

- Cada librería nativa nueva exige un development build nuevo.
- Las pruebas de rendimiento solo valen en un teléfono real o en un emulador ARM64.

### Vistas que modifica

[Física](../vistas/04-fisica.md) (APK generado con EAS Build) y [Desarrollo](../vistas/03-desarrollo.md).
