This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md

---

# Proyecto: Asistente de interpretación ambiental offline (PNN Los Nevados)

App Android que funciona 100% sin conexión: un chat de texto que responde preguntas sobre el recorrido usando solo documentos PDF ya vectorizados. Versión 1 (ADR-017): (1) **Actualizar información**, que baja los PDF vectorizados del backend RAG del computador administrador por su punto de acceso Wi-Fi; (2) **chat** con respuesta en streaming y citas (LFM2.5-350M + MiniLM multilingüe, dentro del APK); (3) **vigencia de 24 h**, al cabo de la cual se borran los documentos, se bloquea el chat, se avisa con una notificación y se ofrece desinstalar. Estas reglas son permanentes y se leen al inicio de cada sesión junto con `docs/arquitectura.md`. El archivo es corto: enlaza a `docs/` en lugar de copiar su contenido.

## Fuentes de verdad

- `CONTEXT.md`: descripción general del sistema (computador administrador + app). `API.md`: la API del backend RAG que la app consume; lo que la app usa de ella está en `docs/backend-esperado.md`.
- `docs/arquitectura.md`: mapa de visión, drivers, ADR, vistas y glosario.
- `docs/drivers.md`, sección 1: catálogo de casos de uso. Es la lista de funcionalidades del sistema.
- `docs/vistas/03-desarrollo.md`: estructura de `src/`, módulos, puertos y adaptadores.
- `docs/vistas/05-datos.md`: esquema de la base local.
- `docs/prompt-sistema.md`: texto exacto del prompt del sistema y de las respuestas fijas.
- `specs/`: una carpeta por caso de uso del catálogo, con el mismo número (CU-01 → `specs/001-...`), con `spec.md`, `plan.md`, `tasks.md` y `validacion.md`.
- `prompts/`: las fases del flujo SDD (0-arranque, 1-especificar, 2-planear, 3-descomponer, 4-implementar, 5-validar).
- Si el código contradice una especificación, gana la especificación. Si la especificación parece incorrecta, detenerse y preguntar.
- Los ADR no se editan: una decisión nueva se escribe como ADR nuevo que reemplaza al anterior.

## Reglas del proyecto

- **Solo Android** (APK, Android 11+, ARM64; RT-04). La compatibilidad multiplataforma de arriba no aplica a iOS en esta etapa.
- **Offline primero** (RT-01): el chat no hace llamadas de red. La red solo la usa el Módulo Actualización (CU-01), y solo contra `EXPO_PUBLIC_BACKEND_URL` (ADR-012).
- **Modelos dentro del APK** (RT-05, ADR-013): LFM2.5-350M y paraphrase-multilingual-MiniLM-L12-v2 en GGUF viajan como assets; no se descarga nada de Internet.
- **Mismo modelo de embeddings que el backend** (ADR-014): la pregunta se vectoriza con `paraphrase-multilingual-MiniLM-L12-v2` normalizado; si `/health/db` informa otro modelo, la carga se rechaza.
- **Vigencia de 24 h** (RN-02, ADR-015): el chat solo funciona con una carga vigente; al vencer se borran documentos y conversaciones (no los modelos) y se ofrece desinstalar.
- **Librerías aprobadas**: llama.rn (ADR-014), expo-sqlite con sqlite-vec (ADR-012), expo-notifications y expo-intent-launcher (ADR-015). onnxruntime-react-native, whisper.rn y expo-speech están pospuestas (ADR-017). Cualquier otra librería necesita un ADR.
- **Carga de modelos solo a través del Gestor de modelos** (ADR-014); ningún módulo carga un modelo por su cuenta.
- **Respuestas con fuente** (ADR-016): la banda de similitud la decide el código; ALTA responde con citas, MEDIA remite al guía, BAJA dice que no encontró la información; nada fuera del parque. Los textos están en `docs/prompt-sistema.md`.
- **Privacidad** (PA-08): preguntas y conversaciones no salen del teléfono.

## Arquitectura

- Clean Architecture dentro de la app (ADR-008): `src/dominio/`, `src/aplicacion/` (casos de uso y `puertos/`), `src/infraestructura/` (adaptadores), `src/composicion/` (cableado). Pantallas en `src/app/` (solo rutas), `src/components/` y `src/hooks/`.
- `src/dominio/` no importa `react`, `react-native`, `expo-*` ni `src/infraestructura/`.
- Los puertos son interfaces TypeScript en `src/aplicacion/puertos/`; los define el caso de uso y los implementa `src/infraestructura/`.
- Las pantallas usan los casos de uso a través de hooks; nunca importan adaptadores directamente.

## Convenciones de código

- TypeScript estricto; un componente, clase o caso de uso por archivo.
- Nombres de dominio en español, según el glosario (sección 10 de `docs/arquitectura.md`).
- Configuración pública en `.env` (ignorado en git; plantilla en `.env.example`), leída como `process.env.EXPO_PUBLIC_X`, con notación de punto. Nunca secretos en variables `EXPO_PUBLIC_`: quedan dentro del APK.
- UI pensada para campo: botones de al menos 56 dp, alto contraste y tema visual de montaña y páramo (EAC-06).

## Forma de trabajar

- Seguir las fases de `prompts/` en orden; una tarea de `tasks.md` a la vez.
- Al terminar: marcar la tarea, listar los archivos cambiados y detenerse.
- No inventar requisitos: lo que no esté en los documentos se marca en `spec.md` con `# [NECESITA ACLARACIÓN: <pregunta>]` o se pregunta.
- Un commit por tarea, con el ID de la tarea en el mensaje.
