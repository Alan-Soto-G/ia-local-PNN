# language: es
# Traza: CU-03, EAC-02, EAC-08, RN-02, PA-08, PA-10, R-06, DT-05, DT-06, ADR-013, ADR-014, ADR-015
# Secuencia: docs/diagramas/secuencia/cu03-vencer-vigencia.puml
Característica: Vencer la vigencia
  Como administración del área protegida
  quiero que la información recibida deje de estar disponible 24 horas después de la última carga exitosa
  para que el visitante no use información vieja y no queden datos del recorrido en su teléfono.

  Antecedentes:
    Dado que el visitante cargó la información hoy a las 09:00 (expira_en = mañana a las 09:00)
    Y que la carga tiene 2 documentos y una conversación con 4 mensajes y 1 cita

  Escenario: Flujo básico, aviso y diálogo al vencer
    Dado que el visitante dio permiso de notificaciones
    Cuando llega mañana a las 09:00, con la app abierta, en segundo plano o cerrada
    Entonces Android muestra la notificación "Tu acceso a la información del recorrido terminó. Abre la app para cargarla de nuevo o desinstalarla."
    Y desde las 09:00 el chat no acepta preguntas, aunque el aviso se retrase
    Y al abrir la app, al volver a primer plano o al tocar la notificación, la app muestra "Ya no tienes acceso a la información del recorrido. ¿Deseas desinstalar la aplicación?" con los botones "Sí" y "No"

  Escenario: El usuario elige "No"
    Dado que se muestra el diálogo de vencimiento
    Cuando el usuario toca "No"
    Entonces en una transacción se borran documento, fragmento, vec_fragmento, conversacion, mensaje y cita
    Y la carga queda en "sin_datos"
    Y se liberan los modelos de la memoria
    Y los modelos GGUF copiados no se borran
    Y la app muestra Inicio con "Actualizar información" y el chat bloqueado

  Escenario: El usuario elige "Sí" y confirma la desinstalación
    Dado que se muestra el diálogo de vencimiento
    Cuando el usuario toca "Sí"
    Entonces se borran los mismos datos que con "No"
    Y se abre el diálogo de desinstalación de Android para esta app
    Y si el usuario acepta, Android desinstala la app

  Escenario: El usuario elige "Sí" pero cancela en Android
    Dado que el usuario tocó "Sí" y se abrió el diálogo de desinstalación de Android
    Cuando el usuario toca "Cancelar" en ese diálogo
    Entonces la app vuelve a Inicio con "Actualizar información", igual que con "No"

  Escenario: Vence con el chat abierto
    Dado que el usuario está en el chat a las 08:59
    Cuando llegan las 09:00
    Entonces el chat deja de aceptar preguntas
    Y la app muestra el diálogo de vencimiento

  Escenario: El usuario no da permiso de notificaciones (R-06)
    Dado que el usuario negó el permiso de notificaciones
    Cuando abre la app después de las 09:00 de mañana
    Entonces no hubo notificación
    Y el chat está bloqueado y se muestra el diálogo de vencimiento igual

  Escenario: Una carga nueva antes de vencer reinicia la vigencia
    Dado que hoy a las 15:00 el usuario hace una carga nueva exitosa
    Entonces la notificación de mañana a las 09:00 se cancela y se programa otra para mañana a las 15:00
    Y a las 09:00 de mañana no se muestra el diálogo de vencimiento

  Escenario: Diálogo de vencimiento sin salida accidental
    Dado que se muestra el diálogo de vencimiento
    Cuando el usuario usa el botón o el gesto "atrás" de Android
    Entonces la app hace lo mismo que con "No": borra la información y muestra Inicio
    Y el chat nunca queda accesible

  Escenario: EAC-08, cero consultas aceptadas después de expira_en
    Dado un reloj de prueba fijado en expira_en
    Cuando se intenta una consulta
    Entonces se aceptan 0 consultas
    Y lo mismo pasa con el reloj 1 segundo y 1 hora después de expira_en

  Escenario: EAC-08, la notificación llega a tiempo con la app cerrada
    Dado el dispositivo de referencia (Android 11+, ARM64, gama media, 4 GB de RAM; marca y modelo por fijar en DT-08), con permiso de notificaciones y la app cerrada
    Y que la app declara el permiso de alarma exacta (SCHEDULE_EXACT_ALARM) y programa el aviso como alarma exacta
    Cuando llega expira_en
    Entonces la notificación se muestra a ±1 minuto de expira_en

  Escenario: Sin permiso de alarma exacta
    Dado que Android no concedió la alarma exacta (por ejemplo, Android 14 recién instalado)
    Cuando se programa el aviso
    Entonces la app no pide ese permiso aparte
    Y el aviso se programa con la entrega normal, que algunos fabricantes pueden retrasar (DT-06)
    Y el bloqueo del chat sigue siendo exacto a las 09:00

  Escenario: EAC-08, cero filas después de "No"
    Dado que la carga venció
    Cuando el usuario toca "No"
    Entonces las tablas documento, fragmento, vec_fragmento, conversacion, mensaje y cita tienen 0 filas
    Y la tabla carga tiene su única fila en "sin_datos"

  Escenario: EAC-08, después de "Sí" se abre el diálogo del sistema
    Dado que la carga venció
    Cuando el usuario toca "Sí"
    Entonces se abre el diálogo de desinstalación del sistema para el paquete "co.pnnlosnevados.asistente"

  Escenario: EAC-02, el vencimiento funciona sin red
    Dado que el teléfono está en modo avión
    Cuando vence la vigencia y el usuario responde el diálogo
    Entonces la notificación, el bloqueo, el borrado y la desinstalación funcionan igual
    Y la app hace 0 llamadas de red

  Escenario: Privacidad (PA-08)
    Cuando vence la vigencia y el usuario responde "Sí" o "No"
    Entonces no quedan en el teléfono preguntas, respuestas ni fragmentos de los documentos
