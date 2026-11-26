# language: es
# Traza: CU-01, EAC-02, EAC-03, EAC-06, EAC-07, RT-01, RT-05, RN-02, PA-04, PA-05, ADR-012, ADR-013, ADR-014, ADR-015
# Secuencia: docs/diagramas/secuencia/cu01-actualizar-informacion.puml
Característica: Actualizar información
  Como visitante o guía del PNN Los Nevados
  quiero bajar los documentos vectorizados del punto de información del parque
  para poder usar el asistente sin conexión durante las 24 horas siguientes.

  Antecedentes:
    Dado que la app trae el modelo de embeddings "paraphrase-multilingual-MiniLM-L12-v2" de 384 dimensiones
    Y que la dirección del backend es la de EXPO_PUBLIC_BACKEND_URL ("http://192.168.137.1:8000/api" por defecto)

  Escenario: Flujo básico, primera carga exitosa
    Dado que la app no tiene información (estado "sin_datos")
    Y que el teléfono está conectado al punto de acceso del computador administrador
    Y que "/health/db" responde status "ok", tables_ready true, embedding_model "paraphrase-multilingual-MiniLM-L12-v2" y dimensions 384
    Y que "/documents" devuelve "Fauna_v1.pdf" (id 1, 4 fragmentos), "Flora_v1.pdf" (id 2, 2 fragmentos) y "Fauna_v2.pdf" (id 3, 1 fragmento)
    Y que cada "/documents/{id}/chunks?include_embeddings=true" devuelve tantos fragmentos como su num_chunks, cada uno con 384 valores
    Cuando el usuario toca "Actualizar información" a las 15:04
    Entonces la app guarda solo "Fauna_v2.pdf" y "Flora_v1.pdf" (la versión más alta de cada nombre)
    Y guarda 3 fragmentos con su vector, su página y su texto
    Y la carga queda "vigente" con expira_en igual a cargado_en + 24 h
    Y la pantalla muestra "Información lista. Disponible hasta mañana a las 15:04."
    Y el acceso al chat queda habilitado
    Y se programa la notificación de vencimiento para expira_en

  Escenario: Progreso visible durante la carga
    Dado que la carga está en curso (estado "cargando")
    Y que "/documents" devolvió 5 documentos después de filtrar versiones
    Cuando la app baja los fragmentos del segundo documento
    Entonces la pantalla muestra "Descargando documento 2 de 5…" y una barra de progreso al 40%
    Y no hay opción de cancelar la carga
    Y el botón "Actualizar información" no se puede volver a tocar hasta que termine

  Escenario: Nueva carga con la información todavía vigente
    Dado que hay una carga "vigente" que vence mañana a las 09:00
    Cuando el usuario toca "Actualizar información" hoy a las 15:04 y la carga sale completa
    Entonces la base anterior se reemplaza por la nueva
    Y las conversaciones anteriores se borran
    Y expira_en pasa a ser mañana a las 15:04
    Y la notificación programada para las 09:00 se cancela y se programa otra para las 15:04

  Escenario: Excepción, backend no disponible (EAC-03, EAC-02)
    Dado que el teléfono no está conectado al punto de acceso (o está en modo avión)
    Cuando el usuario toca "Actualizar información"
    Entonces en 5 s o menos la pantalla muestra "No encontramos el punto de información del parque. Conéctate a su red Wi-Fi e inténtalo de nuevo."
    Y los documentos, los fragmentos y expira_en que hubiera antes no cambian
    Y la app no se cierra

  Escenario: Excepción, backend responde pero no está listo
    Dado que "/health/db" responde 503 o status distinto de "ok"
    Cuando el usuario toca "Actualizar información"
    Entonces la pantalla muestra "No encontramos el punto de información del parque. Conéctate a su red Wi-Fi e inténtalo de nuevo."
    Y la base anterior no cambia

  Escenario: Excepción, backend sin tablas creadas
    Dado que "/health/db" responde status "ok" pero tables_ready false
    Cuando el usuario toca "Actualizar información"
    Entonces la pantalla muestra "Aún no hay documentos cargados en el punto de información."
    Y la app no pide "/documents"
    Y la base anterior no cambia

  Escenario: Excepción, modelo de embeddings incompatible (EAC-03, EAC-07)
    Dado que "/health/db" informa embedding_model "multilingual-e5-small" (o dimensions distinto de 384)
    Cuando el usuario toca "Actualizar información"
    Entonces la pantalla muestra "La información del punto no es compatible con esta versión de la app."
    Y la app no pide "/documents" ni ningún fragmento
    Y la base anterior y su expira_en no cambian

  Escenario: Excepción, el punto de información no tiene documentos
    Dado que "/health/db" es correcto y "/documents" devuelve una lista vacía
    Cuando el usuario toca "Actualizar información"
    Entonces la pantalla muestra "Aún no hay documentos cargados en el punto de información."
    Y la base anterior no cambia

  Escenario: Excepción, se corta la conexión a mitad de la carga (EAC-03)
    Dado que hay una carga "vigente" con 2 documentos que vence mañana a las 09:00
    Y que "/documents" devolvió 3 documentos
    Cuando la conexión se corta después de bajar los fragmentos del segundo documento
    Y la petición de fragmentos del tercero no responde en 30 s (límite de cada petición a "/documents" y "/chunks")
    Entonces la pantalla muestra "No se pudo completar la carga. Tu información anterior sigue disponible."
    Y la base sigue con los mismos 2 documentos y la misma expira_en (mañana a las 09:00)
    Y la notificación programada no cambia

  Escenario: Excepción, carga incompleta sin información previa
    Dado que la app no tiene información (estado "sin_datos")
    Cuando la carga falla a mitad de camino por red o por escritura
    Entonces la pantalla muestra "No se pudo completar la carga."
    Y el estado sigue siendo "sin_datos" y el chat sigue bloqueado

  Escenario: Excepción, datos recibidos inconsistentes (EAC-03)
    Dado que "/documents/2/chunks" devuelve 1 fragmento cuando num_chunks es 2, o un fragmento trae un vector de 383 valores
    Cuando el usuario toca "Actualizar información"
    Entonces la carga se rechaza como incompleta y la base anterior no cambia

  Escenario: Excepción, la app se cierra durante la escritura (EAC-03)
    Dado que hay una carga "vigente"
    Cuando la app se cierra mientras se escribe la carga nueva en la base
    Entonces al volver a abrirla la base tiene exactamente los documentos y la expira_en anteriores

  Escenario: Permiso de notificaciones tras la primera carga (ADR-015, R-06)
    Dado que es la primera carga exitosa y Android 13 o superior
    Cuando termina la carga
    Entonces la app muestra "Te avisaremos cuando termine tu acceso a la información del recorrido, dentro de 24 horas." con los botones "Permitir avisos" y "Ahora no"
    Y con "Permitir avisos" se abre el diálogo de permiso de notificaciones de Android
    Y con "Ahora no" no se abre el diálogo de Android
    Y en cargas posteriores la explicación solo se vuelve a mostrar si el permiso sigue sin conceder y Android todavía permite pedirlo
    Y si el usuario lo niega, la carga sigue vigente igual y la app no vuelve a cerrarse ni a fallar

  Escenario: EAC-03, cero cargas aplicadas a medias en 10 cortes provocados
    Dado una carga "vigente" con documentos y expira_en conocidos
    Cuando se provocan 10 cortes de red en distintos momentos de la descarga
    Entonces en los 10 casos los documentos y expira_en son idénticos a los de antes
    Y en 0 casos queda una mezcla de la base vieja y la nueva

  Escenario: EAC-03, sin backend el mensaje aparece en 5 s o menos
    Dado que el backend no responde
    Cuando el usuario toca "Actualizar información"
    Entonces el mensaje de backend no disponible aparece en 5 s o menos medidos desde el toque

  Escenario: EAC-02, la red solo se usa al actualizar
    Dado que la app está abierta en la pantalla de inicio
    Cuando el usuario no toca "Actualizar información"
    Entonces la app hace 0 llamadas de red
    Y todas las llamadas de CU-01 van solo a la dirección de EXPO_PUBLIC_BACKEND_URL y solo con GET

  Escenario: EAC-06, uso en campo de la pantalla de inicio
    Dado la pantalla de inicio en el dispositivo de referencia (Android 11+, ARM64, gama media, 4 GB de RAM; marca y modelo por fijar en DT-08)
    Cuando se mide la interfaz
    Entonces el botón "Actualizar información" mide al menos 56 dp de alto
    Y todo texto tiene un contraste de al menos 7:1 con su fondo
    Y el estado de la vigencia ("Disponible hasta las 15:04") se ve siempre que haya carga vigente
    Y el 90% de los usuarios de la prueba carga la información sin ayuda en su primer intento

  Escenario: EAC-07, la carga se valida contra el modelo que declara el APK
    Dado que el equipo de IA cambia el modelo de embeddings en la constante de modelos
    Cuando el backend sigue informando "paraphrase-multilingual-MiniLM-L12-v2"
    Entonces la carga se rechaza con "La información del punto no es compatible con esta versión de la app."
    Y el cambio no modificó archivos de src/dominio/ ni de src/aplicacion/, salvo la constante de modelos en src/aplicacion/configuracion/
