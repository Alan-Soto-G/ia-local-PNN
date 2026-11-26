# Validación: 003 Vencer la vigencia

Fecha: 2026-11-26. Entorno disponible: Windows 11 y Node 26.12. No hay teléfono ni emulador ARM64 ni development build.

Evidencia usada:
- **P**: pruebas de lógica con reloj de prueba y adaptadores falsos, `npx tsc -p pruebas && node --test .pruebas/pruebas/` → `tests 42, pass 42, fail 0`: 9 de CU-03 en [pruebas/003-vencer-vigencia.test.ts](../../pruebas/003-vencer-vigencia.test.ts) y las de CU-01 y CU-02 se siguen cumpliendo.
- **C**: lectura del código (archivo:línea).
- **X**: `npx expo export --platform android`: el bundle de Hermes compila (3,3 MB). `npx expo config --type introspect`: el manifiesto lleva `POST_NOTIFICATIONS`, `REQUEST_DELETE_PACKAGES` y `SCHEDULE_EXACT_ALARM`, el paquete es `co.pnnlosnevados.asistente`, y siguen `networkSecurityConfig`, `arm64-v8a` y sqlite-vec.

"No verificado" quiere decir que hace falta un development build en un Android ARM64 real. No se da por cumplido.

## Validación funcional

| Escenario | Resultado | Evidencia |
|-----------|-----------|-----------|
| Flujo básico, aviso y diálogo al vencer | Cumple (lógica y código). No verificado en el dispositivo | P "B": `vencida` desde `expira_en` sin haber borrado nada. C `use-vigilante-vencimiento.ts` revisa al abrir, al volver a primer plano, al llegar `expira_en` (temporizador) y al tocar el aviso (`alTocarAviso`, `abiertaDesdeAviso`); el texto del aviso y el del diálogo se comprueban en P "Textos del diálogo" |
| El usuario elige "No" | Cumple (lógica) | P "NO/E8c": libera los modelos, 0 filas en las 6 tablas, `sin_datos`, los modelos copiados quedan. C `ModuloVigencia.ts:75-76`; `use-vencimiento.ts` vuelve a Inicio y `use-vigencia` relee al ganar foco |
| El usuario elige "Sí" y confirma | Cumple (lógica). No verificado en Android | P "SI/E8d": el mismo borrado y luego `abrirDesinstalacion`. C `DesinstaladorAndroid.ts` (`android.intent.action.DELETE`, `package:co.pnnlosnevados.asistente`) |
| "Sí" pero cancela en Android | Cumple (lógica) | P "SC": al volver, `sin_datos`; `use-vencimiento.ts` lleva a Inicio |
| Vence con el chat abierto | Cumple (código). No verificado | `chat.tsx` con `vencida` → `solicitarRevisionVencimiento()` → el vigilante hace `router.replace('/vencimiento')`; `ConsultarAsistente` rechaza la consulta (P de 002 "V/EAC-08") |
| Sin permiso de notificaciones | Cumple (código) | El diálogo depende de `estado(ahora)` y no del aviso; `ModuloVigencia.iniciar` tolera fallos del aviso |
| Carga nueva antes de vencer | Cumple (lógica) | P "NC": cancela y vuelve a programar; `expira_en` = mañana a las 15:00 |
| "Atrás" en el diálogo | Cumple (código). No verificado | `vencimiento.tsx:17`: `hardwareBackPress` → `responder('no')`; gesto deshabilitado en `_layout.tsx:17` |
| EAC-08, 0 consultas tras `expira_en` | Cumple (lógica) | P "E8a": en `expira_en`, a +1 s y a +1 h, `SinCargaVigente` y 0 mensajes guardados |
| EAC-08, aviso a ±1 min con la app cerrada | No verificado | C `NotificadorExpo.ts:60` (`delivery: 'alarmClock'`) y `SCHEDULE_EXACT_ALARM` en el manifiesto. Hay que medirlo en el dispositivo de referencia (DT-08) |
| Sin permiso de alarma exacta | Cumple (código). No verificado | La app no pide el permiso; según la documentación instalada de expo-notifications, sin el permiso `alarmClock` se programa como `bestEffort` |
| EAC-08, 0 filas tras "No" | Cumple (lógica); C en SQL | P "NO/E8c". En la base real: `RepositorioConocimientoSqlite.borrarTodo` aplica `SQL_BORRAR_TODO` (6 `DELETE`) y deja `carga` en `sin_datos` dentro de `withTransactionAsync`. Falta contar las filas en el dispositivo |
| EAC-08, diálogo del sistema tras "Sí" | Cumple (lógica). No verificado | P "SI/E8d" |
| EAC-02, sin red | Cumple (código) | `ModuloVigencia` no recibe `ClienteBackend` (P "E2/PR"); el único `fetch` de `src/` sigue en `ClienteBackendHttp.ts` |
| Privacidad | Cumple (lógica) | P "E2/PR": 0 fragmentos, mensajes y citas tras vencer |

## Validación de calidad

| EAC | Medida esperada | Medida obtenida | Dispositivo |
|-----|-----------------|-----------------|-------------|
| EAC-08 | 0 consultas aceptadas después de `expira_en` | 0 de 3 (en `expira_en`, +1 s y +1 h) | Node 26 con reloj de prueba |
| EAC-08 | Aviso a ±1 min con la app cerrada | Sin medir | Pendiente: dispositivo de referencia (DT-08) |
| EAC-08 | 0 filas tras "No" | 0 en las 6 tablas (base falsa) | Node 26; falta SQLite en el dispositivo |
| EAC-08 | Diálogo del sistema tras "Sí" | `startActivityAsync` con `DELETE` y el paquete | Falta el dispositivo |
| EAC-06 | Contraste ≥ 7:1 en el diálogo | Crema/madera 11,18; musgo/superficie (botón "No") ≥ 9,9; blanco/rojo (botón "Sí") 9,28; blanco/rojo presionado 10,75 | Cálculo WCAG |

## Validación arquitectónica

- Regla de dependencia: 0 imports prohibidos en `src/dominio/` y `src/aplicacion/`; pantallas, hooks y componentes no importan infraestructura, `expo-notifications` ni `expo-intent-launcher`.
- Vista de usos sin ciclos: `ModuloVigencia` usa el Gestor de modelos a través de `LiberadorModelos` (solo `liberar()`) y no importa Consulta ni Actualización.
- `src/app/` solo tiene `_layout.tsx`, `index.tsx`, `chat.tsx` y `vencimiento.tsx`; el vigilante es un componente de `src/components/`.
- ADR del plan en el código: ADR-015 (`ModuloVigencia.vencer`, `DesinstaladorAndroid`, `NotificadorExpo`, permisos), ADR-013 (no se borran los GGUF), ADR-014 (`liberar()` al vencer).
- Librerías: `expo-intent-launcher` (ADR-015), instalada con `npx expo install`. El paquete se lee de `app.json`, sin librerías nuevas.
- `npx expo lint` y `npx tsc --noEmit` terminan con código 0; `npx tsc -p pruebas` sin errores.

## Hallazgos (se informan, no se corrigen en esta fase)

1. `vencer(decision, ahora)` recibe la hora además de la decisión (la vista dice `vencer(decision)`): el Módulo Vigencia no tiene reloj propio y así se prueba con un reloj falso.
2. La tabla `carga` nunca guarda `vencida`: el estado se calcula con el reloj (ADR-015: "el bloqueo vale desde `expira_en`"). La vista de datos admite `vencida` en el `CHECK`, pero no se usa.
3. DT-05 (cambiar la hora del teléfono alarga la vigencia) sigue aceptado en la versión 1.
4. `SCHEDULE_EXACT_ALARM` está declarado, pero en Android 14 recién instalado viene negado: allí el aviso usa `bestEffort` y puede llegar tarde (DT-06). El bloqueo no depende del aviso.
