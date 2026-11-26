# Validación: 001 Actualizar información

Fecha: 2026-11-26. Entorno disponible: Windows 11, Node 26.12, sin teléfono ni emulador ARM64 conectado y sin backend en ejecución.

Evidencia usada:
- **P**: pruebas de lógica con adaptadores falsos, `npx tsc -p pruebas && node --test .pruebas/pruebas/` → `tests 16, pass 16, fail 0` ([pruebas/001-actualizar-informacion.test.ts](../../pruebas/001-actualizar-informacion.test.ts)).
- **C**: lectura del código (archivo:línea).
- **X**: `npx expo export --platform android`: el bundle de Hermes compila (3,1 MB). `npx expo config --type introspect`: el manifiesto lleva `android:networkSecurityConfig="@xml/network_security_config"` y gradle lleva `reactNativeArchitectures=arm64-v8a` y `expo.sqlite.withSQLiteVecExtension=true`.

"No verificado" quiere decir que hace falta un development build en un Android ARM64 real (ADR-011) y el backend del computador administrador. No se da por cumplido.

## Validación funcional

| Escenario | Resultado | Evidencia |
|-----------|-----------|-----------|
| Flujo básico, primera carga exitosa | Cumple (lógica). No verificado en el dispositivo | P "B": guarda solo `Fauna_v2.pdf` y `Flora_v1.pdf`, 3 fragmentos, `vigente`, +24 h, texto "Información lista. Disponible hasta mañana a las 15:04.", aviso programado en `expira_en`. C `ActualizarInformacion.ts:68`, `:92`, `:98` |
| Progreso visible durante la carga | Cumple (lógica). No verificado en pantalla | P "PR" y "B": "Descargando documento 2 de 5…". C `ActualizarInformacion.ts:70`, `progreso-carga.tsx`; botón deshabilitado mientras carga `index.tsx:52`; sin cancelar |
| Nueva carga con la información todavía vigente | Cumple (lógica) | P "NV": conversaciones en 0, nueva `expira_en`, 1 cancelación y aviso nuevo |
| Excepción, backend no disponible | Cumple (lógica). No verificado en modo avión | P "SB/NL": base intacta, solo se llamó a `salud`. C `ClienteBackendHttp.ts:112` (abort a los 5 s), `use-actualizacion.ts` (texto) |
| Excepción, backend responde pero no está listo (503 / status ≠ ok) | Cumple (lógica) | C `ClienteBackendHttp.ts:59`; P "SB/NL" |
| Excepción, backend sin tablas | Cumple (lógica) | P "ST": `SinDocumentosEnBackend`, sin pedir `/documents`. C `ActualizarInformacion.ts:113` |
| Excepción, modelo de embeddings incompatible | Cumple (lógica) | P "MI/E7": nombre distinto o 768 dimensiones → rechazo; solo se llamó a `salud`; vigencia intacta |
| Excepción, sin documentos | Cumple (lógica) | P "SD". C `ActualizarInformacion.ts:66` |
| Excepción, corte de conexión a mitad | Cumple (lógica). No verificado con un corte real | P "CC": `CargaIncompleta(habiaInformacionAnterior = true)`, 2 documentos y `expira_en` iguales, aviso sin tocar. Límite de 30 s: `carga.ts:7` |
| Excepción, incompleta sin información previa | Cumple (lógica) | P "CS" (red y escritura): sigue `sin_datos` |
| Excepción, datos inconsistentes | Cumple (lógica) | P "DI": 1 de 2 fragmentos o vector de 383 → rechazo. C `ActualizarInformacion.ts:72` |
| Excepción, la app se cierra durante la escritura | No verificado | C `RepositorioConocimientoSqlite.ts:63`: una sola transacción SQLite (journal WAL), que hace rollback al reabrir. Falta matar el proceso en el dispositivo |
| Permiso de notificaciones tras la primera carga | Cumple (lógica). No verificado en Android 13+ | C `use-actualizacion.ts:52` (solo si `sin_decidir`), `explicacion-permiso.tsx`, textos en `textos.ts`; un fallo del aviso no invalida la carga: `ModuloVigencia.iniciar` |
| EAC-03, 0 cargas a medias en 10 cortes | Cumple (lógica). No verificado con cortes de red reales | P "E3a": 10 de 10 intactas |
| EAC-03, mensaje sin backend en ≤ 5 s | No verificado (cronómetro en el dispositivo) | C `carga.ts:4` (5.000 ms) y `ClienteBackendHttp.ts:112` |
| EAC-02, la red solo se usa al actualizar | Cumple (código) | C: el único `fetch` de `src/` está en `ClienteBackendHttp.ts:114`, con `method: 'GET'` (`:115`), y solo lo usa `ActualizarInformacion`. Falta un registro de tráfico en el dispositivo |
| EAC-06, uso en campo | Cumple en parte | Botón de 64 dp (`theme.ts:59`, `boton-grande.tsx:58`); contraste ≥ 7:1 (tabla de abajo); letrero visible con carga vigente (`index.tsx:27`). La prueba con usuarios (90%) no está hecha |
| EAC-07, la carga se valida contra el modelo que declara el APK | Cumple (lógica) | P "E7": cambiar solo `GestorModelos`/la constante provoca el rechazo; el modelo esperado sale de `configuracion/modelos.ts` |

## Validación de calidad

| EAC | Medida esperada | Medida obtenida | Dispositivo |
|-----|-----------------|-----------------|-------------|
| EAC-03 | Mensaje sin backend en ≤ 5 s | Límite configurado: 5.000 ms. Sin medir | Pendiente: dispositivo de referencia (DT-08) con development build |
| EAC-03 | 0 cargas a medias en 10 cortes | 10/10 intactas con adaptadores falsos | Node 26 (lógica); falta el dispositivo |
| EAC-02 | 0 llamadas de red fuera de CU-01 | 1 solo `fetch` en `src/` (análisis estático) | Falta el dispositivo |
| EAC-06 | Botones ≥ 56 dp | 64 dp | Código; falta medir en el dispositivo |
| EAC-06 | Contraste ≥ 7:1 | Texto/niebla 14,26; texto secundario 9,26; blanco/musgo 10,02; crema/madera 11,18; roca/ámbar 8,73; blanco/laguna 9,85; error 9,16; éxito 10,63; texto/cielo 12,62; deshabilitado 8,79 | Cálculo WCAG con los tokens de `theme.ts` |
| EAC-06 | 90% sin ayuda en el primer intento | Sin medir | Prueba con usuarios pendiente |

## Validación arquitectónica

- Regla de dependencia: `grep` de imports de `react`, `react-native`, `expo*` o `infraestructura` en `src/dominio/` → 0 coincidencias; en `src/aplicacion/` → 0.
- `src/app/` solo tiene `_layout.tsx` e `index.tsx`. Las pantallas, hooks y componentes no importan `infraestructura` (0 coincidencias).
- ADR del plan en el código: ADR-012 (`ClienteBackendHttp`, `RepositorioConocimientoSqlite`, `migraciones.ts` con `vec0` coseno de 384); ADR-013/014 (`GestorModelos.modeloEmbeddingEsperado`, `configuracion/modelos.ts`); ADR-015 (`ModuloVigencia.calcular/iniciar`, `NotificadorExpo`); ADR-011 (`plugins/with-red-local-android.js`: solo `arm64-v8a`); ADR-008 (capas y `composicion/`).
- Librerías: `expo-sqlite` (ADR-012) y `expo-notifications` (ADR-015), instaladas con `npx expo install`. `eslint` y `eslint-config-expo` los instaló `npx expo lint` (herramienta de desarrollo que exige AGENTS.md). No se agregó `expo-build-properties`: el plugin local usa `expo/config-plugins`.
- `npx expo lint`: sin errores. `npx tsc --noEmit`: sin errores. `npx tsc -p pruebas`: sin errores.
- Convenciones de AGENTS.md: TypeScript estricto, una clase por archivo, nombres de dominio en español según el glosario, `process.env.EXPO_PUBLIC_BACKEND_URL` con notación de punto, sin secretos.

## Hallazgos (se informan, no se corrigen en esta fase)

1. `expo-doctor` informa 6 paquetes de la plantilla (`expo-router`, `expo-splash-screen`, `expo-image`, `expo-glass-effect`…) con un parche de retraso. Son anteriores a esta funcionalidad. Sugerencia: `npx expo install --check`.
2. La transacción usa `withTransactionAsync` y no `withExclusiveTransactionAsync`: la exclusiva abre otra conexión sin sqlite-vec cargado (`RepositorioConocimientoSqlite.ts:32`). Es seguro mientras ninguna otra escritura corra durante la carga; 002 debe respetarlo (el chat no escribe mientras se actualiza).
3. El escenario de 10 cortes con red real y el de la app cerrada durante la escritura necesitan el dispositivo y el backend.
4. La notificación usa la entrega `bestEffort` por defecto. La precisión de ±1 minuto de EAC-08 se trata en 003 (posible `SCHEDULE_EXACT_ALARM`).
