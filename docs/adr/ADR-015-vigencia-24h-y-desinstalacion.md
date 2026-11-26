# ADR-015: Vigencia de 24 horas, notificación y opción de desinstalar

## Estado

Aceptado (2026-11-26)

## Contexto

La información recibida es temporal ([CONTEXT.md](../../CONTEXT.md), sección 5.5): 24 horas después de una carga exitosa se borran los documentos vectorizados, se restringe el chat hasta una nueva carga y se avisa al usuario que ya no tiene acceso, preguntándole si desea desinstalar la app. Si responde que sí, la app debe desinstalarse; si responde que no, solo se borra la información y la app queda esperando otra carga. Casos de uso: [CU-03](../drivers.md#1-casos-de-uso-y-casos-de-uso-primarios); drivers: RN-02, EAC-08, PA-08.

Restricciones de Android que condicionan la decisión:

- Una app no puede ejecutar código con exactitud a una hora dada si está cerrada, pero sí puede **programar una notificación local** que el sistema muestra aunque la app no esté abierta.
- Una app **no puede desinstalarse sola en silencio**. Puede abrir el diálogo de desinstalación del sistema (`android.intent.action.DELETE` con `package:<id de la app>`, permiso `REQUEST_DELETE_PACKAGES`); el usuario confirma ahí.

## Alternativas consideradas

- **A) Temporizador en memoria.** Se pierde al cerrar la app.
- **B) Tarea en segundo plano que borra a la hora exacta.** Android no garantiza la hora y exige librerías adicionales.
- **C) Fecha de vencimiento persistida + notificación programada + verificación al usar.** Se guarda `expira_en`; se programa una notificación para esa hora; toda operación que usa los documentos comprueba la vigencia contra el reloj, y el borrado se ejecuta al abrir la app o al volver a primer plano después de `expira_en`.

## Decisión

Se elige la opción C.

- **Inicio**: al terminar una carga exitosa (ADR-012) se guarda `expira_en = cargado_en + 24 h` y se programa, con **expo-notifications**, una notificación local para `expira_en`: "Tu acceso a la información del recorrido terminó. Abre la app para cargarla de nuevo o desinstalarla." Una carga nueva durante la vigencia cancela la notificación anterior, reemplaza la base y reinicia las 24 h.
- **Bloqueo**: el Módulo Vigencia responde `vigente | vencida | sin_datos`. El chat y el Módulo Consulta solo funcionan con `vigente`; en cualquier otro caso la pantalla muestra el botón "Actualizar información". El bloqueo vale desde el instante `expira_en`, aunque el borrado todavía no se haya ejecutado.
- **Al vencer** (al abrir la app, volver a primer plano o tocar la notificación con `ahora ≥ expira_en`): se muestra el diálogo "Ya no tienes acceso a la información del recorrido. ¿Deseas desinstalar la aplicación?".
  - **Sí**: se borran los datos (como en "No") y se abre el diálogo de desinstalación de Android con **expo-intent-launcher**; el usuario confirma en él. Si lo cancela, la app queda como en "No".
  - **No**: se borran en una transacción documentos, fragmentos, vectores, conversaciones, mensajes y citas; se libera el motor; la Carga pasa a `sin_datos` y la app queda esperando "Actualizar información".
- Los modelos no se borran (ADR-013).
- Permisos en `app.json`: `POST_NOTIFICATIONS` (Android 13+, se pide después de la primera carga exitosa) y `REQUEST_DELETE_PACKAGES`. Si el usuario niega las notificaciones, el vencimiento funciona igual al abrir la app.
- El reloj se lee a través del puerto `Reloj`, para poder probar el vencimiento sin esperar 24 h.

## Consecuencias

### Positivas

- El vencimiento no depende de que la app esté abierta.
- El acceso queda bloqueado a la hora exacta, aunque el borrado ocurra al abrir la app.
- Lógica probable con un reloj falso.

### Negativas y costos aceptados

- Si el usuario nunca abre la app, los datos siguen en el almacenamiento hasta la siguiente apertura (bloqueados).
- Cambiar la hora del teléfono podría alargar la vigencia (DT-05).
- Algunos fabricantes retrasan o silencian notificaciones con el ahorro de batería (DT-06).
- La desinstalación siempre pide una confirmación del sistema.
- Dos librerías nuevas de Expo: expo-notifications y expo-intent-launcher (necesitan development build nuevo, ADR-011).

### Vistas que modifica

[Lógica](../vistas/01-logica.md) (ciclo de vida de la Carga), [Procesos](../vistas/02-procesos.md) (Notificaciones e Instalador de paquetes de Android), [Desarrollo](../vistas/03-desarrollo.md) (Módulo Vigencia, puertos Reloj, Notificador y Desinstalador), [Datos](../vistas/05-datos.md) (tabla `carga`) y la secuencia [CU-03](../diagramas/secuencia/cu03-vencer-vigencia.puml).
