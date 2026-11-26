# Validación: 002 Consultar al asistente por texto

Fecha: 2026-11-26. Entorno disponible: Windows 11 y Node 26.12. No hay teléfono ni emulador ARM64, ni GGUF reales (sha256 `PENDIENTE`), ni development build.

Evidencia usada:
- **P**: pruebas de lógica con adaptadores falsos, `npx tsc -p pruebas && node --test .pruebas/pruebas/` → `tests 33, pass 33, fail 0`: 17 de CU-02 en [pruebas/002-consultar-texto.test.ts](../../pruebas/002-consultar-texto.test.ts) y las 16 de CU-01 se siguen cumpliendo.
- **C**: lectura del código (archivo:línea).
- **X**: `npx expo export --platform android`: el bundle de Hermes compila (3,3 MB) e incluye el asset `.gguf`.

"No verificado" quiere decir que hace falta un development build en un Android ARM64 con los GGUF reales. No se da por cumplido.

## Validación funcional

| Escenario | Resultado | Evidencia |
|-----------|-----------|-----------|
| Flujo básico, ALTA con citas | Cumple (lógica). No verificado con LFM2.5 real | P "B": versión del usuario primero, versiones parciales (streaming), "completo", banda ALTA, termina en `[Fauna_v1.pdf, página 1]` (texto del motor falso), citas Fauna p. 1 y Flora p. 2, TTFT registrado. C `ConsultarAsistente.ts:77`, `:78`, `:100`, `:115` |
| Banda MEDIA | Cumple (lógica) | P "M": texto fijo exacto, 0 llamadas al modelo, sin citas, guardado |
| Banda BAJA | Cumple (lógica) | P "BJ" (también sin fragmentos) |
| Tema ajeno con similitud alta | Cumple en parte | P "TA/TU": el modelo recibe `PROMPT_SISTEMA` con la regla 2 exacta. Que LFM2.5 responda el texto fijo solo se ve con el modelo real (set de EAC-05) |
| Turno que recibe el modelo | Cumple (lógica) | P "TA/TU" y "armarTurno": plantilla exacta, ≤ 4 fragmentos ≥ 0,40, sin historial, temperatura 0,2 y 256 tokens. P "TU": con 4 fragmentos largos se quita el de menor similitud hasta ≤ 1.500 tokens |
| Detener la generación | Cumple (lógica). No verificado < 500 ms | P "DT": "detenido" con el texto parcial. C `MotorLlama.ts` → `stopCompletion()` |
| Primer uso, preparación de los modelos | Cumple (código). No verificado | C `PreparadorModelosExpo.ts` (copia desde el APK, `digest('SHA-256')`, marca `.verificado`); `chat.tsx` muestra "Preparando el asistente…" y la barra queda deshabilitada (`habilitada={listo}`) |
| Modelo no disponible | Cumple (lógica) | P "MN": el Gestor pasa a `error` y permite reintentar; con sha256 `PENDIENTE` nunca coincide. UI: texto y "Reintentar" en `preparando-asistente.tsx` |
| Memoria insuficiente | Cumple (lógica) | P "MI": estado "error" con el texto de memoria, guardado. C `errores-llama.ts` (se reconoce por el mensaje: llama.rn no documenta un código) |
| El modelo falla al generar | Cumple (lógica) | P "EG" |
| EAC-08, vigencia vencida | Cumple (lógica) | P "V/EAC-08": a las 09:00 (= `expira_en`), `SinCargaVigente`, 0 mensajes guardados, 0 llamadas al modelo, historial vacío. C `ConsultarAsistente.ts:65`; `chat.tsx` sale al perder la vigencia y `use-vigencia` relee justo en `expira_en` |
| Sin carga, el chat no está disponible | Cumple (código) | C `index.tsx`: "Hacer una pregunta" solo con `vigente`; `chat.tsx` vuelve a Inicio si no está vigente |
| Conversación al volver | Cumple (lógica) | P "CV": misma conversación con sus 4 mensajes. C `RepositorioConversacionesSqlite.conversacionActual` |
| Textos de la pantalla de chat | Cumple (código) | `textos.ts` (CU-02) usados en `chat.tsx`, `index.tsx` y `barra-pregunta.tsx`; "Enviar" deshabilitado con el campo vacío o solo con espacios (`vacia = texto.trim().length === 0`) |
| EAC-01, TTFT ≤ 3 s, ≥ 8 tokens/s, detener < 500 ms, MEDIA/BAJA ≤ 1 s | No verificado | Falta el dispositivo de referencia (DT-08) y los GGUF. El TTFT se guarda en `mensaje.ttft_ms` y los tokens/s en `ResultadoGeneracion.tokensPorSegundo` para medirlos |
| EAC-02, modo avión | Cumple (código). No verificado en el dispositivo | El único `fetch` de `src/` sigue siendo `ClienteBackendHttp.ts:114`; `ConsultarAsistente` no depende de `ClienteBackend` |
| EAC-04, memoria y estabilidad | No verificado | Requiere perfilar 30 consultas en el dispositivo |
| EAC-04, liberar en segundo plano | Cumple (lógica) | P "E4L": se libera al cumplirse el tiempo, se recarga después, y volver a primer plano cancela la liberación. C `use-modelos.ts:46` con `LIBERAR_EN_SEGUNDO_PLANO_MS` = 5 min |
| EAC-05, set de 50 preguntas | No verificado | Requiere el set validado por un especialista, los PDF reales y los modelos |
| EAC-06, uso en campo del chat | Cumple en parte | Enviar/Detener y Volver ≥ 56 dp (`Toque.minimo`); letrero compacto en la cabecera; contrastes abajo. La prueba con usuarios no está hecha |
| EAC-07, cambio de modelo | Cumple (código) | El modelo de lenguaje solo aparece en `configuracion/modelos.ts` (constante), `assets-modelos.ts` y `MotorLlama.ts`; `dominio/` no lo nombra |
| Privacidad | Cumple (código) | Mensajes y citas solo en SQLite (`RepositorioConversacionesSqlite`); ningún adaptador de red los recibe |

## Validación de calidad

| EAC | Medida esperada | Medida obtenida | Dispositivo |
|-----|-----------------|-----------------|-------------|
| EAC-01 | TTFT ≤ 3 s en 18 de 20; ≥ 8 tokens/s; detener < 500 ms; MEDIA/BAJA ≤ 1 s | Sin medir | Pendiente: dispositivo de referencia (DT-08), development build y GGUF reales |
| EAC-02 | 0 llamadas de red en el chat | 0 `fetch` en el camino de CU-02 (análisis estático) | Falta el dispositivo en modo avión |
| EAC-04 | ≤ 1,5 GB, 0 cierres en 30 consultas, ≤ 10% de batería por hora | Sin medir | Pendiente |
| EAC-05 | ≥ 90% / ≥ 95% / ≥ 95% / 0 | Sin medir | Pendiente: set de 50 preguntas |
| EAC-06 | ≥ 56 dp; ≥ 7:1 | 56 dp (barra, Volver); contrastes nuevos: musgo/cielo 7,85, musgo/pista 7,67, blanco/musgo presionado 13,20, texto secundario/fondo de error 8,93; los de 001 se mantienen | Cálculo WCAG con `theme.ts` |

## Validación arquitectónica

- Regla de dependencia: imports de `react`, `react-native`, `expo*`, `llama.rn` o `infraestructura` en `src/dominio/` → 0; en `src/aplicacion/` → 0. Pantallas, hooks y componentes → 0 imports de infraestructura o de llama.rn.
- Gestor de modelos único (ADR-014): `initLlama` solo aparece en `MotorLlama.ts` y `CodificadorLlama.ts`, y `.cargar(` solo se llama desde `GestorModelos.ts:111-112`.
- `src/app/` solo tiene `_layout.tsx`, `index.tsx` y `chat.tsx`.
- ADR del plan en el código: ADR-016 (`rag.ts`, `prompt.ts`, `ConsultarAsistente`), ADR-004 (callback de tokens, agrupado de 50 ms en `use-chat.ts:8`, `BurbujaMensaje` memoizada), ADR-014 (`MotorLlama`, `CodificadorLlama` con `pooling_type: 'mean'` y L2), ADR-013 (`PreparadorModelosExpo`, `metro.config.js`), ADR-015 (`SinCargaVigente`).
- Librerías: `llama.rn` (ADR-014) y `expo-file-system`, `expo-asset`, `expo-crypto` (vista de desarrollo, Adaptador de preparación de modelos, ADR-013), instaladas con `npx expo install`.
- `npx expo lint`, `npx tsc --noEmit` y `npx tsc -p pruebas`: sin errores.

## Hallazgos (se informan, no se corrigen en esta fase)

1. **GGUF pendientes**: `assets/modelos/*.gguf` están vacíos y su sha256 es `PENDIENTE`, así que el chat muestra "No pudimos preparar el asistente…" hasta que se coloquen los modelos reales y su sha256 en `src/aplicacion/configuracion/modelos.ts`. Los archivos de 0,4 a 0,7 GB probablemente necesiten Git LFS.
2. **llama.rn 0.13.0-rc.12** es *release candidate* y su `postinstall` (descarga de binarios nativos) quedó bloqueado por npm. Antes del development build hay que correr `npm install-scripts approve llama.rn` y luego `npm rebuild llama.rn`.
3. **Paridad de MiniLM (DT-04)**: `CodificadorLlama` normaliza con L2 en llama.cpp y otra vez en JS; falta comparar los vectores con los del backend (coseno ≥ 0,99).
4. La falta de memoria se reconoce por el texto del error de llama.rn (no hay un código documentado); hay que comprobarlo en el dispositivo.
5. Texto agregado que no está en el spec: la nota "Respuesta detenida" bajo un mensaje detenido, para que el estado no dependa solo del texto cortado. Hay que confirmarlo o quitarlo en la revisión.
6. Si la vigencia vence con el chat abierto, en 002 se vuelve a Inicio; 003 lo cambia por el diálogo de vencimiento.
