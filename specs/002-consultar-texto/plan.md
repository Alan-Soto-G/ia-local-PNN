# Plan: 002 Consultar al asistente por texto

Entrada: [spec.md](spec.md) (sin marcas pendientes), [AGENTS.md](../../AGENTS.md), [arquitectura](../../docs/arquitectura.md), [vista de desarrollo](../../docs/vistas/03-desarrollo.md), [prompt-sistema.md](../../docs/prompt-sistema.md). Reutiliza lo construido en [001](../001-actualizar-informacion/plan.md).

## Decisiones que aplican

| ID | Cómo se aterriza |
|----|------------------|
| ADR-016 | k = 4; similitud = 1 − distancia coseno; banda según la mejor similitud (0,55 / 0,40, constantes versionadas, DT-01); el modelo solo se invoca en ALTA, con los fragmentos ≥ 0,40; MEDIA y BAJA usan los textos fijos; ≤ 1.500 tokens (sistema + turno), quitando el fragmento de menor similitud; sin historial; citas en ALTA |
| ADR-004 | `MotorInferencia.generar` entrega los tokens por callback y se puede detener; el hook agrupa los tokens y pinta cada ~50 ms; solo la burbuja que crece se vuelve a pintar; TTFT en `mensaje.ttft_ms` |
| ADR-014 | llama.rn para los dos modelos: LFM2.5-350M (`n_ctx` 4.096, temperatura 0,2, 256 tokens nuevos) y MiniLM (`embedding: true`, `pooling_type: 'mean'`, normalización L2). El Gestor de modelos es el único que carga y libera; los dos quedan residentes con el chat abierto y se liberan tras 5 min en segundo plano (aclarado en spec); traduce las fallas a `ModeloNoDisponible` y `MemoriaInsuficiente` |
| ADR-013 | Los GGUF van como assets (`assets/modelos/`); el Adaptador de preparación los copia a `Paths.document/modelos/` si faltan o cambia su tamaño y verifica el sha256 antes de usarlos; "Preparando el asistente…" |
| ADR-015 | El Módulo Consulta pregunta `estado(ahora)` antes de cada consulta; con `vencida` o `sin_datos` lanza `SinCargaVigente` |
| ADR-008 | Puertos de la vista 03: MotorInferencia, CodificadorTexto, PreparadorModelos, BuscadorVectorial, RepositorioConversaciones |
| ADR-011 | llama.rn exige New Architecture (la trae por defecto Expo SDK 58) y código nativo: **hace falta un development build nuevo** |
| Vista de datos | `conversacion`, `mensaje`, `cita` (ya creadas por la migración de 001); una conversación por carga vigente (aclarado en spec) |

Librerías nuevas (todas con código nativo, development build nuevo):
- `llama.rn` **0.13.0-rc.12**, versión exacta (ADR-014). Es la versión que resolvió `npx expo install`; es *release candidate*. Su `postinstall` baja los binarios nativos y npm lo bloqueó (`allowScripts`): antes del build hay que aprobarlo (`npm install-scripts approve llama.rn`).
- `expo-file-system`, `expo-asset` y `expo-crypto`: las nombra la vista de desarrollo para el Adaptador de preparación de modelos (ADR-013). `expo-crypto` se usa para `randomUUID()` de conversaciones y mensajes; el sha256 de los GGUF se calcula en nativo con `File.digest('SHA-256')`.
- `metro.config.js`: agrega `gguf` a `assetExts` (patrón de la documentación de expo-sqlite para `.wasm`).

GGUF (aclarado en spec): todavía no están en el repositorio. Se crean archivos vacíos en `assets/modelos/` con el nombre previsto y sha256 `PENDIENTE`; mientras el sha256 sea `PENDIENTE` el preparador responde `ModeloNoDisponible`. Colocar los archivos reales y su sha256 es un paso manual (DT-02, DT-03, DT-04).

## Componentes

Dominio (`src/dominio/`):
- `Banda.ts`: tipo `ALTA | MEDIA | BAJA` y `clasificarBanda(mejorSimilitud, umbrales)`.
- `Conversacion.ts`, `Mensaje.ts` (rol, texto, banda, estado `generando | completo | detenido | error`, `ttftMs`, citas), `Cita.ts` (fragmento, archivo, página, similitud, orden).
- `ModeloLocal.ts`: tipo (`lenguaje | embeddings`), nombre, versión, archivo, sha256; estado `sin_preparar | preparando | listo | error`.

Aplicación:
- `configuracion/rag.ts`: umbrales, k, 1.500 tokens, temperatura, 256 tokens, 5 min.
- `configuracion/prompt.ts`: `PROMPT_SISTEMA`, `TEXTO_MEDIA`, `TEXTO_BAJA` (literales de prompt-sistema.md) y `armarTurno(fragmentos, pregunta)`.
- `configuracion/modelos.ts`: se agregan `MODELO_LENGUAJE` y los datos de archivo y sha256 de los dos `ModeloLocal`.
- `configuracion/textos.ts`: textos del chat del spec.
- `errores/ModeloNoDisponible.ts`, `errores/MemoriaInsuficiente.ts`, `errores/SinCargaVigente.ts`.
- `puertos/MotorInferencia.ts` (`cargar(ruta)`, `liberar()`, `contarTokens(texto)`, `generar(sistema, turno, opciones, alToken)`, `detener()`), `puertos/CodificadorTexto.ts` (`cargar(ruta)`, `liberar()`, `vectorizar(texto)`), `puertos/PreparadorModelos.ts` (`preparar(modelo) → ruta`), `puertos/BuscadorVectorial.ts` (`buscar(vector, k)`), `puertos/RepositorioConversaciones.ts` (conversación actual, mensajes con citas, guardar y actualizar mensaje, guardar citas, `borrarTodo()`).
- `casos-uso/modelos/GestorModelos.ts`: se agregan `preparar()`, `asegurarListos()`, `liberar()`, `programarLiberacion()` y `cancelarLiberacion()`.
- `casos-uso/consulta/ConsultarAsistente.ts`: CU-02 completo; `consultar(pregunta, alActualizar)` y `detener()`; `historial()`.

Infraestructura:
- `ia/MotorLlama.ts` (MotorInferencia) y `ia/CodificadorLlama.ts` (CodificadorTexto): una clase por archivo; traducen la falta de memoria a `MemoriaInsuficiente`.
- `ia/PreparadorModelosExpo.ts` y `ia/assets-modelos.ts` (los `require` de los GGUF).
- `persistencia/BuscadorVectorialSqlite.ts` (kNN `vec0`: `embedding MATCH ? AND k = ?`).
- `persistencia/RepositorioConversacionesSqlite.ts`.

Composición: `contenedor.ts` agrega los adaptadores, el Gestor de modelos completo y `consultarAsistente`.

Hooks: `use-modelos.ts` (preparar y cargar al abrir el chat, reintentar, liberar tras 5 min en segundo plano) y `use-chat.ts` (historial, enviar, detener, agrupado cada ~50 ms, `SinCargaVigente`).

## Pantallas

Siguen el tema páramo de 001 (`src/constants/theme.ts`, contraste ≥ 7:1):
- `src/app/chat.tsx`: cabecera compacta con "Volver" y el letrero de vigencia; lista de mensajes (`FlatList`, filas memoizadas); estado vacío; barra inferior con campo y botón "Enviar" / "Detener" de 56 dp.
- `src/app/index.tsx`: botón "Hacer una pregunta" (variante laguna) solo con carga vigente.
- `src/components/burbuja-mensaje.tsx`: usuario a la derecha (musgo con texto blanco), asistente a la izquierda (superficie clara con borde y un "hito" de piedra), estados "detenido" y "error" con texto y forma, citas debajo.
- `src/components/cita-fuente.tsx`: ficha "Fauna_v1.pdf · página 1", con el ámbar del frailejón como marca.
- `src/components/barra-pregunta.tsx`.
- `src/components/preparando-asistente.tsx`: "Preparando el asistente…" o el error con "Reintentar".
- `src/components/letrero-vigencia.tsx`: se agrega una variante compacta para la cabecera del chat.

Si la vigencia vence con el chat abierto, en 002 la pantalla vuelve a Inicio (`router.replace('/')`); 003 lo cambia por el diálogo de vencimiento.

## Flujo

[cu02-consultar-texto.puml](../../docs/diagramas/secuencia/cu02-consultar-texto.puml): Chat → `ConsultarAsistente.consultar` → `ModuloVigencia.estado` → `GestorModelos.asegurarListos` → guardar el Mensaje del usuario → `CodificadorTexto.vectorizar` → `BuscadorVectorial.buscar(k = 4)` → `clasificarBanda` → BAJA/MEDIA: texto fijo y Mensaje completo · ALTA: Mensaje "generando" → `armarTurno` dentro del presupuesto → `MotorInferencia.generar` (tokens → `alActualizar`) → "completo" + Citas + TTFT, o "detenido" / "error".

## Fuera de alcance

- Diálogo de vencimiento, borrado y desinstalación (003).
- Historial navegable de varias conversaciones, voz, foto y reformulación de preguntas (ADR-017).
- Medición de TTFT, tokens/s, RAM y batería, y el set de 50 preguntas: requieren el dispositivo y los GGUF reales (se registran en validacion.md).
