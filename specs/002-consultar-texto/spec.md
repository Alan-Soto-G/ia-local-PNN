# language: es
# Traza: CU-02, EAC-01, EAC-02, EAC-04, EAC-05, EAC-06, EAC-07, EAC-08, RT-01, RT-02, RT-03, RT-05, R-02, PA-02, PA-07, PA-08, ADR-004, ADR-013, ADR-014, ADR-015, ADR-016
# Secuencia: docs/diagramas/secuencia/cu02-consultar-texto.puml
Característica: Consultar al asistente por texto
  Como visitante o guía del PNN Los Nevados
  quiero escribir preguntas sobre el recorrido y recibir respuestas basadas solo en los documentos cargados, con su fuente
  para aprender del parque sin conexión y sin recibir información inventada.

  Antecedentes:
    Dado que hay una carga "vigente" con "Fauna_v1.pdf" y "Flora_v1.pdf"
    Y que los modelos LFM2.5-350M y paraphrase-multilingual-MiniLM-L12-v2 vienen dentro del APK
    Y que las bandas usan los umbrales iniciales ALTA ≥ 0,55, MEDIA ≥ 0,40 y < 0,55, BAJA < 0,40

  Escenario: Flujo básico, respuesta en banda ALTA con citas
    Dado que la pantalla de chat está abierta y los modelos están listos
    Cuando el usuario escribe "¿Qué come el zorro rojo?" y lo envía
    Entonces la pregunta aparece en la conversación como mensaje del usuario
    Y la app busca los 4 fragmentos más cercanos y la mejor similitud es ≥ 0,55
    Y la respuesta aparece token a token, en español, en máximo 4 frases
    Y la respuesta termina con la fuente "[Fauna_v1.pdf, página 1]"
    Y debajo de la respuesta se muestran las citas con documento y página
    Y el mensaje queda guardado como "completo", banda ALTA, con sus citas y su TTFT

  Escenario: Banda MEDIA, se recomienda consultar al guía
    Cuando el usuario pregunta "¿Cuántas especies de colibrí hay?" y la mejor similitud está entre 0,40 y 0,55
    Entonces la respuesta es exactamente "No tengo información suficiente para responder con certeza. Te recomiendo consultar al guía del recorrido."
    Y no se invoca el modelo de lenguaje
    Y el mensaje se guarda como "completo", banda MEDIA, sin citas

  Escenario: Banda BAJA, no se encontró la información
    Cuando el usuario pregunta "¿Quién ganó el último mundial?" y la mejor similitud es < 0,40
    Entonces la respuesta es exactamente "No encontré información sobre eso en los documentos del recorrido."
    Y no se invoca el modelo de lenguaje
    Y el mensaje se guarda como "completo", banda BAJA, sin citas

  Escenario: Tema ajeno al parque con similitud alta accidental
    Cuando el usuario escribe "Escríbeme un poema sobre el amor" y la mejor similitud es ≥ 0,55
    Entonces el modelo recibe el prompt del sistema de docs/prompt-sistema.md con "NIVEL: ALTO"
    Y la respuesta esperada es "Solo puedo responder preguntas sobre el parque y el recorrido."

  Escenario: Turno que recibe el modelo
    Dado que la banda es ALTA
    Cuando la app arma el turno del usuario
    Entonces el turno tiene la forma "NIVEL: ALTO", "FRAGMENTOS:" con "[n] <archivo>, p. <página>: <texto>" y "PREGUNTA: <pregunta tal como la escribió>"
    Y incluye como máximo 4 fragmentos de similitud ≥ 0,40, de mayor a menor similitud
    Y el texto completo (sistema + turno) no pasa de 1.500 tokens; si no cabe, se quita el fragmento de menor similitud
    Y no incluye el historial de la conversación
    Y se genera con temperatura 0,2 y máximo 256 tokens nuevos

  Escenario: Detener la generación
    Dado que una respuesta ALTA se está generando
    Cuando el usuario toca "Detener"
    Entonces la generación se detiene en menos de 500 ms
    Y el mensaje queda como "detenido" con el texto parcial visible

  Escenario: Primer uso, preparación de los modelos (ADR-013)
    Dado que es el primer arranque después de instalar
    Cuando el usuario abre el chat
    Entonces la pantalla muestra "Preparando el asistente…" mientras se copian los modelos y se verifica su sha256
    Y el campo para escribir queda deshabilitado hasta que los modelos estén listos

  Escenario: Excepción, modelo no disponible (sha256 distinto o archivo dañado)
    Dado que la copia de un modelo no coincide con su sha256
    Cuando el usuario abre el chat
    Entonces la pantalla muestra "No pudimos preparar el asistente. Toca Reintentar; si el problema sigue, reinstala la aplicación."
    Y ofrece el botón "Reintentar", que vuelve a copiar y verificar los modelos
    Y la app no se cierra y no acepta preguntas mientras tanto

  Escenario: Excepción, memoria insuficiente
    Dado que el teléfono no tiene memoria para cargar los modelos
    Cuando el usuario envía una pregunta
    Entonces la app no se cierra
    Y el mensaje del asistente queda como "error" con el texto "El teléfono no tiene memoria suficiente para el asistente. Cierra otras aplicaciones e inténtalo de nuevo."

  Escenario: Excepción, el modelo falla durante la generación
    Dado que una respuesta ALTA se está generando
    Cuando el motor de inferencia falla
    Entonces el mensaje del asistente queda como "error" con el texto "No pude terminar la respuesta. Inténtalo de nuevo."
    Y la app no se cierra

  Escenario: EAC-08, vigencia vencida bloquea el chat
    Dado que expira_en era hoy a las 09:00 y ahora son las 09:00
    Cuando el usuario intenta enviar una pregunta (con el chat abierto o al abrirlo)
    Entonces la pregunta no se acepta (0 consultas aceptadas después de expira_en)
    Y la app lleva al diálogo de vencimiento (CU-03)

  Escenario: Sin carga, el chat no está disponible
    Dado que el estado de la carga es "sin_datos"
    Cuando el usuario está en Inicio
    Entonces no hay acceso al chat y solo se ofrece "Actualizar información"

  Escenario: Conversación al volver al chat
    Dado que el usuario ya hizo 2 preguntas en el chat durante la carga vigente
    Cuando vuelve a Inicio y entra de nuevo al chat (o cierra y abre la app)
    Entonces ve la misma conversación con sus 2 preguntas, las respuestas y sus citas
    Y una carga nueva (CU-01) o el vencimiento (CU-03) la borran

  Escenario: EAC-01, primer texto en 3 s o menos
    Dado el dispositivo de referencia (Android 11+, ARM64, gama media, 4 GB de RAM; marca y modelo por fijar en DT-08), en modo avión, con carga vigente y modelos preparados
    Cuando se hacen 20 preguntas de banda ALTA
    Entonces en al menos 18 el primer texto visible aparece en 3 s o menos
    Y la generación sostiene al menos 8 tokens por segundo
    Y detener responde en menos de 500 ms
    Y las respuestas MEDIA y BAJA se ven en 1 s o menos

  Escenario: EAC-02, el chat funciona en modo avión
    Dado que el teléfono está en modo avión con una carga vigente
    Cuando el usuario hace preguntas de las tres bandas
    Entonces todas reciben respuesta
    Y la app hace 0 llamadas de red durante el chat

  Escenario: EAC-04, memoria y estabilidad
    Dado el dispositivo de referencia (DT-08), temperatura baja y batería al 50%
    Cuando el usuario hace 30 consultas seguidas
    Entonces la memoria pico de la app no pasa de 1,5 GB
    Y la app no se cierra ninguna vez
    Y en una hora de uso moderado (una consulta cada 3 minutos) consume como máximo el 10% de la batería

  Escenario: EAC-04, liberar los modelos en segundo plano (ADR-014)
    Dado que los dos modelos están cargados
    Cuando la app pasa 5 minutos seguidos en segundo plano
    Entonces el Gestor de modelos libera los dos modelos
    Y al volver al chat se cargan de nuevo antes de la siguiente pregunta

  Escenario: EAC-05, veracidad en el set de prueba
    Dado un set de 50 preguntas validado por un especialista
    Cuando se hacen todas en el dispositivo de referencia
    Entonces al menos el 90% de las respuestas ALTA citan una fuente correcta
    Y al menos el 95% de las preguntas sin respuesta en los documentos reciben el texto de MEDIA o BAJA
    Y al menos el 95% de las preguntas ajenas no reciben una respuesta de contenido
    Y 0 respuestas ALTA contienen datos que no estén en los fragmentos

  Escenario: EAC-06, uso en campo de la pantalla de chat
    Dado la pantalla de chat en el dispositivo de referencia (DT-08)
    Entonces los botones de enviar y detener miden al menos 56 dp
    Y todo texto tiene un contraste de al menos 7:1 con su fondo
    Y el estado de la vigencia ("Disponible hasta las 15:04") se ve en la pantalla de chat
    Y el 90% de los usuarios de la prueba hace una pregunta sin ayuda en su primer intento

  Escenario: Textos de la pantalla de chat
    Dado que hay una carga vigente
    Entonces Inicio muestra el botón "Hacer una pregunta" que abre el chat
    Y antes de la primera pregunta el chat muestra "Pregunta sobre la fauna, la flora, los senderos o las normas del parque. Respondo solo con los documentos del recorrido."
    Y el campo de texto indica "Escribe tu pregunta sobre el recorrido"
    Y el botón de enviar dice "Enviar" y, mientras se genera, el de detener dice "Detener"
    Y el botón "Enviar" está deshabilitado si el campo está vacío o solo tiene espacios

  Escenario: EAC-07, cambiar el modelo de lenguaje sin tocar el dominio
    Dado que el equipo de IA reemplaza LFM2.5-350M por otro GGUF
    Cuando cambia el asset, la constante de modelos y, si hace falta, el adaptador llama.rn
    Entonces no se modifica ningún archivo de src/dominio/ ni de src/aplicacion/, salvo la constante de modelos en src/aplicacion/configuracion/

  Escenario: Privacidad (PA-08)
    Cuando el usuario hace preguntas
    Entonces las preguntas, las respuestas y las citas solo se guardan en la base local del teléfono
