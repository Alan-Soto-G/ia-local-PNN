# Plan: 003 Vencer la vigencia

Entrada: [spec.md](spec.md) (sin marcas pendientes), [AGENTS.md](../../AGENTS.md), [arquitectura](../../docs/arquitectura.md), [vista de desarrollo](../../docs/vistas/03-desarrollo.md). Completa el Módulo Vigencia de [001](../001-actualizar-informacion/plan.md) y la salida del chat de [002](../002-consultar-texto/plan.md).

## Decisiones que aplican

| ID | Cómo se aterriza |
|----|------------------|
| ADR-015 | `expira_en` persistido (001); el bloqueo vale desde `expira_en` (`ModuloVigencia.estado`, 001/002); notificación programada con expo-notifications; al abrir, volver a primer plano o tocar el aviso con `ahora ≥ expira_en` → diálogo; "No" → borrado en una transacción, liberar el motor, `sin_datos`; "Sí" → el mismo borrado y el diálogo de desinstalación con expo-intent-launcher (`android.intent.action.DELETE`, `package:<id>`); permisos `POST_NOTIFICATIONS` y `REQUEST_DELETE_PACKAGES` |
| ADR-013 | Los modelos copiados no se borran al vencer |
| ADR-014 | Al vencer, el Módulo Vigencia pide al Gestor de modelos que libere los dos modelos |
| ADR-008 | Puerto `Desinstalador` y ampliación de `Notificador` ("saber si se abrió la app desde ella"), como dice la vista 03 |
| Vista de usos | Vigencia → Gestor de modelos; Vigencia no usa Consulta ni Actualización (sin ciclos) |
| Vista de datos | El borrado reutiliza `RepositorioConocimiento.borrarTodo()` (001), que en una sola transacción vacía los grupos Conocimiento y Uso y deja `carga` en `sin_datos` |

Aclaraciones del spec: paquete Android `co.pnnlosnevados.asistente`; aviso con `delivery: 'alarmClock'` y el permiso `SCHEDULE_EXACT_ALARM` declarado, sin pedirlo aparte (sin el permiso, expo-notifications lo programa como `bestEffort`); "atrás" en el diálogo equivale a "No".

Librerías:
- `expo-intent-launcher` (ADR-015): código nativo, **hace falta un development build nuevo**.
- El identificador del paquete se lee de `app.json` (`expo.android.package`) en la composición, así no hace falta otra librería.

## Componentes

Aplicación:
- `puertos/Desinstalador.ts`: `abrirDesinstalacion()`.
- `puertos/Notificador.ts`: se agregan `abiertaDesdeAviso()` y `alTocarAviso(oyente)`.
- `casos-uso/vigencia/ModuloVigencia.ts`: se agrega `vencer(decision: 'si' | 'no')`, que libera los modelos, cancela el aviso, borra todo y, con "Sí", abre la desinstalación. Recibe el Gestor de modelos y el Desinstalador.
- `configuracion/textos.ts`: textos del diálogo.

Infraestructura:
- `sistema/DesinstaladorAndroid.ts`: `startActivityAsync('android.intent.action.DELETE', { data: 'package:<id>' })`.
- `sistema/NotificadorExpo.ts`: `delivery: 'alarmClock'`; `getLastNotificationResponseAsync` y `addNotificationResponseReceivedListener` para saber si se tocó el aviso.

Composición: `contenedor.ts` crea el Gestor de modelos antes del Módulo Vigencia y le pasa el Desinstalador con el paquete de `app.json`.

Hooks:
- `use-vigilante-vencimiento.ts`: en el layout raíz; con `vencida` (al abrir, al volver a primer plano, al llegar `expira_en` o al tocar el aviso) lleva a `/vencimiento`.
- `use-vencimiento.ts`: acciones "Sí" y "No" del diálogo.

Configuración nativa: `app.json` con `android.package`, permisos `REQUEST_DELETE_PACKAGES` y `SCHEDULE_EXACT_ALARM`.

## Pantallas

- `src/app/vencimiento.tsx`: pantalla completa, sin gesto de volver; noche de páramo (fondo madera oscura con la cordillera en silueta), el texto del diálogo y dos botones grandes: "No" (musgo, acción principal y segura) y "Sí" (rojo de peligro, separado). "Atrás" de Android → "No".
- `src/app/_layout.tsx`: registra `vencimiento` sin gesto ni encabezado y monta el vigilante.
- `src/app/chat.tsx`: al perder la vigencia va a `/vencimiento` en lugar de Inicio.
- `src/components/dialogo-vencimiento.tsx` (presentación) y la variante `peligro` de `boton-grande.tsx`.

## Flujo

[cu03-vencer-vigencia.puml](../../docs/diagramas/secuencia/cu03-vencer-vigencia.puml): aviso de Android a la hora `expira_en` → al abrir, volver o tocar: `ModuloVigencia.estado(ahora) = vencida` → diálogo → "No": `vencer('no')` → `GestorModelos.liberar` → `borrarTodo` (transacción) → `sin_datos` → Inicio · "Sí": `vencer('si')` → el mismo borrado → `Desinstalador.abrirDesinstalacion` → Android confirma o cancela → Inicio.

## Fuera de alcance

- Detectar cambios de la hora del teléfono (DT-05, aceptado en la versión 1).
- Pedir el permiso de alarma exacta en los ajustes de Android (aclarado en spec: no se pide).
- Medir la puntualidad del aviso con la app cerrada en el dispositivo (se registra en validacion.md).
