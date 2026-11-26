# Asistente de guía para la interpretación ambiental en alta montaña

> Versión 1 (2026-11-26). La visión de largo plazo se conserva en las secciones 1 y 2; el alcance de esta versión (sección 3) se redujo según [ADR-017](adr/ADR-017-alcance-version-1.md). La descripción del sistema completo, con el computador administrador, está en [CONTEXT.md](../CONTEXT.md).

## 1. Problema u oportunidad

Actualmente, personas del común, los guías ambientales, guardaparques y operadores ecoturísticos que realizan recorridos en ecosistemas de alta montaña (como bosques altoandinos, páramos y zonas glaciares) dependen de manuales impresos pesados, documentos PDF estáticos o conocimientos memorizados para reconocer la biodiversidad, geología, hidrología y normativa de conservacións. Esta situación resulta insuficiente en campo porque la ausencia total o intermitente de cobertura celular y datos móviles en zonas de alta montaña impide el uso de asistentes de inteligencia artificial basados en la nube o herramientas de consulta en línea. Asimismo, los guías enfrentan dificultades para adaptar rápidamente información científica compleja a distintos perfiles de público (niños, turistas generales, investigadores) (así como los turistas pueden no comprender esta información científica), superar barreras idiomáticas con visitantes extranjeros y responder con precisión preguntas espontáneas sin interrumpir la dinámica del recorrido.

La oportunidad consiste en desarrollar un asistente de inteligencia artificial móvil ejecutado 100% de forma local (offline), que permita a guías y turistas consultar conocimiento ecológico validado, generar guiones interpretativos contextualizados y traducir mensajes clave directamente en el sendero sin depender de conectividad a internet.

El primer territorio es el **Parque Nacional Natural Los Nevados (PNN Los Nevados)**: bosque altoandino, páramo, superpáramo y glaciares, recorridos por senderos de caminata, rutas de alta montaña y rutas de ciclomontañismo y cicloturismo, organizados por sectores. Por eso la base de conocimiento se organiza también por **rutas**: qué especies, ecosistemas y puntos de interés aparecen en cada una.

## 2. Objetivos de negocio

- **OB-01:** Reducir en un 70% el tiempo promedio de consulta de información técnica sobre flora, fauna, geología y normativa ambiental durante los recorridos en campo frente al uso de guías físicas o archivos estáticos, durante los primeros 3 meses de operación.
- **OB-02:** Incrementar en un 35% el índice de satisfacción y comprensión ambiental (este se puede verificar con reseñas que se almacenen local hasta que tengan conexión a internet y se puedan subir) reportado por los visitantes (nacionales y extranjeros) respecto a la calidad narrativa y educativa de la guianza al finalizar el primer semestre de uso. *No se mide en la versión 1: las reseñas están pospuestas.*
- **OB-03:** Garantizar una disponibilidad operativa del 100% de las funciones de interpretación ambiental y consulta de protocolos de conservación en zonas sin señal celular desde el lanzamiento de la primera versión.
- **OB-04:** Disminuir en un 50% el tiempo invertido por los guías en la preparación previa de guiones interpretativos personalizados (según perfil del grupo e idioma). *No se mide en la versión 1: los guiones están pospuestos.*

## 3. Alcance

La versión 1 **SÍ** incluye:

- **Actualizar información**: un botón que baja los PDF ya vectorizados desde el backend RAG del computador administrador, conectándose a su punto de acceso Wi-Fi (sin Internet). Si no hay conexión con el backend, se muestra un mensaje amigable.
- **Chat de texto** con respuesta en streaming, ejecutado 100% en el teléfono: LFM2.5-350M redacta y paraphrase-multilingual-MiniLM-L12-v2 vectoriza la pregunta para buscar en los fragmentos. Las respuestas se basan solo en los documentos y citan su fuente; con similitud media remiten al guía y con similitud baja dicen que no encontraron la información; no responden temas ajenos al parque.
- **Vigencia de 24 horas**: desde la última carga exitosa. Al vencer se borra la información de los PDF, se restringe el chat hasta una nueva carga, se avisa con una notificación y se pregunta si se desea desinstalar la aplicación.
- Modelos de IA incluidos en el APK: no hay descargas desde Internet.

La versión 1 **NO** incluye (pospuesto, ver [versiones futuras](drivers.md#7-versiones-futuras)):

- Consulta por foto (el modelo elegido para cuando se retome es MobileCLIP2: imagen→imagen y texto→imagen).
- Voz de entrada y lectura en voz alta.
- Rutas, fichas de especies, reseñas, historial navegable, guiones por perfil, traducción español–inglés y reformulación de la pregunta.

El sistema **NO** incluye en ninguna versión:

- Vectorización o fragmentación de PDF en el teléfono: la hace el backend del computador administrador.
- Versión para iOS en esta etapa: la primera versión es un APK de Android.
- Navegación GPS satelital avanzada, rastreo continuo de telemetría ni reemplazo de dispositivos de rescate o comunicación satelital de emergencia.
- Gestión de reservas turísticas, pasarelas de pago, boletería o trámites administrativos de permisos de ingreso a parques naturales.
- Entrenamiento o ajuste fino (fine-tuning) de modelos de lenguaje en el teléfono.

## 4. Stakeholders

| Rol | Tipo | Preocupaciones | Poder | Interés |
|---|---|---|---|---|
| Guía de Alta Montaña / Intérprete Ambiental | Negocio | Rapidez de respuesta en campo, bajo consumo de batería, legibilidad de pantalla bajo luz solar intensa y funcionamiento estable sin señal. | Medio | Alto |
| Administrador de Área Protegida / Operador Turístico | Negocio | Rigor científico del contenido entregado, cumplimiento de la normativa ambiental y mejora en la calidad del servicio turístico. | Alto | Alto |
| Biólogo / Especialista en Conservación | Negocio | Veracidad taxonómica y ecológica de los PDF que el administrador carga, y control de respuestas imprecisas. | Medio | Alto |
| Administrador del computador | Técnico-operativo | Cargar y versionar los PDF en el backend RAG y encender el punto de acceso antes del recorrido. | Medio | Alto |
| Visitante / Turista | Negocio | Explicaciones claras, amenas y adaptadas a su nivel de conocimiento e idioma durante el recorrido. | Bajo | Medio |
| Arquitecto de Software | Técnico | Diseño offline-first desacoplado, gestión eficiente de memoria RAM y almacenamiento, y portabilidad del motor de inferencia local. | Alto | Alto |
| Ingeniero de IA / Machine Learning | Técnico | Cuantización óptima del modelo compacto, baja latencia de generación, precisión en la recuperación local de contexto y mitigación de alucinaciones. | Alto | Alto |
| Desarrollador Móvil | Técnico | Compatibilidad con dispositivos de gama media, control de temperatura y consumo energético, y usabilidad en condiciones climáticas adversas. | Medio | Alto |

## 5. Restricciones

- **RT-01:** Todas las capacidades de inferencia de IA y consulta de la base de conocimiento deben operar de manera 100% local (offline), prohibiendo dependencias de APIs externas en la nube durante la guianza en campo. *Origen:* Arquitectura de Software, debido a la inexistencia de conectividad celular en rutas de alta montaña.
- **RT-02:** El paquete completo de aplicación, modelo de lenguaje cuantizado y base documental local no debe exceder los 3.5 GB de almacenamiento ni requerir más de 4 GB de memoria RAM disponible para su ejecución estable. *Origen:* Ingeniería de IA y Desarrollo Móvil, para garantizar compatibilidad con teléfonos inteligentes de gama media utilizados por los guías.
- **RT-03:** El tiempo de respuesta inicial (latencia hasta el primer token) del asistente local no debe superar los 3 segundos en los dispositivos móviles de referencia definidos. *Origen:* Operaciones de Campo y Experiencia de Usuario, para evitar pausas incómodas durante la interacción presencial con los grupos.
- **RT-04:** La primera versión se distribuye solo como aplicación Android (APK) para Android 11 o superior en arquitectura ARM64. *Origen:* Equipo del proyecto, por el parque de dispositivos de los guías y el costo de mantener dos plataformas.
- **RT-05:** Los modelos de IA viajan dentro del APK; la base de conocimiento se carga después de instalar, desde el backend del computador administrador por su punto de acceso local. *Origen:* Equipo del proyecto, porque el visitante puede no tener Internet ([ADR-013](adr/ADR-013-modelos-dentro-del-apk.md); reemplaza la redacción original, que descargaba los modelos por Wi-Fi).
- **RN-01:** Toda información ecológica, normativa y de seguridad cargada en los paquetes de conocimiento debe contar con validación previa de especialistas ambientales antes de su distribución. *Origen:* Administración de Áreas Protegidas, para prevenir la difusión de datos erróneos que afecten la conservación del ecosistema o la seguridad del visitante.
- **RN-02:** La información recibida en el teléfono es temporal: 24 horas después de la última carga exitosa se borra y el chat queda restringido hasta una nueva carga. *Origen:* Requisito del proyecto ([CONTEXT.md](../CONTEXT.md), sección 5.5), para mantener el carácter temporal de la app y no acumular información en los dispositivos.

## 6. Supuestos y riesgos iniciales

Supuestos:

- **S-01:** Se asume que los guías disponen de teléfonos móviles personales o institucionales con arquitectura ARM64 moderna (Android 11 o superior, idealmente con 6 GB de RAM o más) con capacidad suficiente para ejecutar modelos cuantizados localmente.
- **S-02:** Se asume que el visitante o el guía instala el APK y pulsa "Actualizar información" conectado al punto de acceso del computador administrador antes de iniciar el recorrido.
- **S-03:** Se supone que los guías portan baterías externas (power banks) como parte de su equipamiento estándar de montaña para respaldar el consumo energético adicional del procesamiento local de IA.
- **S-04:** Se asume que las entidades ambientales o especialistas aliados suministrarán los documentos en PDF con texto extraíble (no escaneados), ya validados, para que el administrador los cargue en el backend.

Riesgos iniciales:

- **R-01:** Drenaje acelerado de la batería y sobrecalentamiento del dispositivo móvil debido al uso intensivo de CPU/NPU durante la inferencia continua del modelo de IA en condiciones de baja temperatura ambiental.
- **R-02:** Generación de afirmaciones científicas inexactas (alucinaciones) por parte del modelo de lenguaje compacto cuando el guía formule preguntas muy específicas que excedan el contenido indexado localmente.
- **R-03:** Fragmentación de hardware entre los teléfonos de los guías (variaciones en capacidad de RAM, procesadores y aceleración gráfica), lo que podría provocar lentitud o cierres inesperados en equipos de menores prestaciones.
- **R-04:** Baja adopción de la herramienta durante el recorrido si la interacción depende exclusivamente de escritura extensa en pantalla bajo lluvia, frío intenso o alta radiación solar.