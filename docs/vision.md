# Asistente de guía para la interpretación ambiental en alta montaña

## 1. Problema u oportunidad

Actualmente, personas del común, los guías ambientales, guardaparques y operadores ecoturísticos que realizan recorridos en ecosistemas de alta montaña (como bosques altoandinos, páramos y zonas glaciares) dependen de manuales impresos pesados, documentos PDF estáticos o conocimientos memorizados para reconocer la biodiversidad, geología, hidrología y normativa de conservacións. Esta situación resulta insuficiente en campo porque la ausencia total o intermitente de cobertura celular y datos móviles en zonas de alta montaña impide el uso de asistentes de inteligencia artificial basados en la nube o herramientas de consulta en línea. Asimismo, los guías enfrentan dificultades para adaptar rápidamente información científica compleja a distintos perfiles de público (niños, turistas generales, investigadores) (así como los turistas pueden no comprender esta información científica), superar barreras idiomáticas con visitantes extranjeros y responder con precisión preguntas espontáneas sin interrumpir la dinámica del recorrido.

La oportunidad consiste en desarrollar un asistente de inteligencia artificial móvil ejecutado 100% de forma local (offline), que permita a guías y turistas consultar conocimiento ecológico validado, generar guiones interpretativos contextualizados y traducir mensajes clave directamente en el sendero sin depender de conectividad a internet.

El primer territorio es el **Parque Nacional Natural Los Nevados (PNN Los Nevados)**: bosque altoandino, páramo, superpáramo y glaciares, recorridos por senderos de caminata, rutas de alta montaña y rutas de ciclomontañismo y cicloturismo, organizados por sectores. Por eso la base de conocimiento se organiza también por **rutas**: qué especies, ecosistemas y puntos de interés aparecen en cada una.

## 2. Objetivos de negocio

- **OB-01:** Reducir en un 70% el tiempo promedio de consulta de información técnica sobre flora, fauna, geología y normativa ambiental durante los recorridos en campo frente al uso de guías físicas o archivos estáticos, durante los primeros 3 meses de operación.
- **OB-02:** Incrementar en un 35% el índice de satisfacción y comprensión ambiental (este se puede verificar con reseñas que se almacenen local hasta que tengan conexión a internet y se puedan subir) reportado por los visitantes (nacionales y extranjeros) respecto a la calidad narrativa y educativa de la guianza al finalizar el primer semestre de uso.
- **OB-03:** Garantizar una disponibilidad operativa del 100% de las funciones de interpretación ambiental y consulta de protocolos de conservación en zonas sin señal celular desde el lanzamiento de la primera versión.
- **OB-04:** Disminuir en un 50% el tiempo invertido por los guías en la preparación previa de guiones interpretativos personalizados (según perfil del grupo e idioma).

## 3. Alcance

El sistema **SÍ** incluye:

- Motor de inferencia de Inteligencia Artificial ejecutado 100% de forma local (offline) en el dispositivo móvil del usuario, sin requerir conexión a internet durante el recorrido.
- Base de conocimiento local estructurada (recuperación documental offline) sobre especies endémicas de flora y fauna, dinámica hídrica, geología de alta montaña y reglas de mínimo impacto ambiental.
- Generación y adaptación de narrativas de interpretación ambiental según el perfil del visitante (infantil, turístico general, especializado) y los puntos de interés de la ruta.
- Asistente conversacional que recibe texto, imágenes y voz, y responde con texto que aparece a medida que se genera (streaming) y, si el usuario lo activa, leído en voz alta, para resolver inquietudes espontáneas de los turistas en tiempo real durante la caminata.
- Identificación asistida por foto de plantas, animales y rasgos del paisaje, ejecutada en el dispositivo y contrastada contra el catálogo local de especies validadas.
- Consulta de rutas del parque (senderos, alta montaña, ciclomontañismo y cicloturismo) con las especies, ecosistemas y puntos de interés de cada una.
- Traducción local de términos técnicos y mensajes clave de interpretación y seguridad ambiental (español - inglés) para atención a visitantes extranjeros.
- Módulo de gestión y descarga de paquetes regionales (modelos cuantizados y fichas ecológicas) **después de instalar la aplicación**, cuando el dispositivo disponga de conexión Wi-Fi antes de salir a campo.
- Actualización de la base de conocimiento local desde un backend externo cuando haya conexión, y envío posterior de las reseñas registradas sin señal.

El sistema **NO** incluye:

- Identificación taxonómica mediante modelos pesados de visión por computadora o análisis de imágenes conectado a servidores en la nube.
- Versión para iOS en esta etapa: la primera versión es un APK de Android.
- Navegación GPS satelital avanzada, rastreo continuo de telemetría ni reemplazo de dispositivos de rescate o comunicación satelital de emergencia.
- Gestión de reservas turísticas, pasarelas de pago, boletería o trámites administrativos de permisos de ingreso a parques naturales.
- Entrenamiento o ajuste fino (fine-tuning) de modelos de lenguaje directamente en el teléfono móvil del usuario.

## 4. Stakeholders

| Rol | Tipo | Preocupaciones | Poder | Interés |
|---|---|---|---|---|
| Guía de Alta Montaña / Intérprete Ambiental | Negocio | Rapidez de respuesta en campo, bajo consumo de batería, legibilidad de pantalla bajo luz solar intensa y funcionamiento estable sin señal. | Medio | Alto |
| Administrador de Área Protegida / Operador Turístico | Negocio | Rigor científico del contenido entregado, cumplimiento de la normativa ambiental y mejora en la calidad del servicio turístico. | Alto | Alto |
| Biólogo / Especialista en Conservación | Negocio | Veracidad taxonómica y ecológica de los datos, control de respuestas imprecisas y facilidad para actualizar fichas técnicas. | Medio | Alto |
| Visitante / Turista | Negocio | Explicaciones claras, amenas y adaptadas a su nivel de conocimiento e idioma durante el recorrido. | Bajo | Medio |
| Arquitecto de Software | Técnico | Diseño offline-first desacoplado, gestión eficiente de memoria RAM y almacenamiento, y portabilidad del motor de inferencia local. | Alto | Alto |
| Ingeniero de IA / Machine Learning | Técnico | Cuantización óptima del modelo compacto, baja latencia de generación, precisión en la recuperación local de contexto y mitigación de alucinaciones. | Alto | Alto |
| Desarrollador Móvil | Técnico | Compatibilidad con dispositivos de gama media, control de temperatura y consumo energético, y usabilidad en condiciones climáticas adversas. | Medio | Alto |

## 5. Restricciones

- **RT-01:** Todas las capacidades de inferencia de IA y consulta de la base de conocimiento deben operar de manera 100% local (offline), prohibiendo dependencias de APIs externas en la nube durante la guianza en campo. *Origen:* Arquitectura de Software, debido a la inexistencia de conectividad celular en rutas de alta montaña.
- **RT-02:** El paquete completo de aplicación, modelo de lenguaje cuantizado y base documental local no debe exceder los 3.5 GB de almacenamiento ni requerir más de 4 GB de memoria RAM disponible para su ejecución estable. *Origen:* Ingeniería de IA y Desarrollo Móvil, para garantizar compatibilidad con teléfonos inteligentes de gama media utilizados por los guías.
- **RT-03:** El tiempo de respuesta inicial (latencia hasta el primer token) del asistente local no debe superar los 3 segundos en los dispositivos móviles de referencia definidos. *Origen:* Operaciones de Campo y Experiencia de Usuario, para evitar pausas incómodas durante la interacción presencial con los grupos.
- **RT-04:** La primera versión se distribuye solo como aplicación Android (APK) para Android 11 o superior en arquitectura ARM64. *Origen:* Equipo del proyecto, por el parque de dispositivos de los guías y el costo de mantener dos plataformas.
- **RT-05:** El APK no incluye modelos de IA ni paquetes de conocimiento: se descargan después de la instalación, por Wi-Fi y con confirmación del usuario. *Origen:* Equipo del proyecto, para mantener un instalador liviano y poder actualizar modelos sin publicar una nueva versión.
- **RN-01:** Toda información ecológica, normativa y de seguridad cargada en los paquetes de conocimiento debe contar con validación previa de especialistas ambientales antes de su distribución. *Origen:* Administración de Áreas Protegidas, para prevenir la difusión de datos erróneos que afecten la conservación del ecosistema o la seguridad del visitante.

## 6. Supuestos y riesgos iniciales

Supuestos:

- **S-01:** Se asume que los guías disponen de teléfonos móviles personales o institucionales con arquitectura ARM64 moderna (Android 11 o superior, idealmente con 6 GB de RAM o más) con capacidad suficiente para ejecutar modelos cuantizados localmente.
- **S-02:** Se asume que los guías descargarán la aplicación y los paquetes de conocimiento correspondientes a su ruta en zonas con acceso a Wi-Fi antes de iniciar la expedición.
- **S-03:** Se supone que los guías portan baterías externas (power banks) como parte de su equipamiento estándar de montaña para respaldar el consumo energético adicional del procesamiento local de IA.
- **S-04:** Se asume que las entidades ambientales o especialistas aliados suministrarán los inventarios de especies, guías de campo y normativas vigentes en formatos digitales estructurados para alimentar la base de conocimiento.

Riesgos iniciales:

- **R-01:** Drenaje acelerado de la batería y sobrecalentamiento del dispositivo móvil debido al uso intensivo de CPU/NPU durante la inferencia continua del modelo de IA en condiciones de baja temperatura ambiental.
- **R-02:** Generación de afirmaciones científicas inexactas (alucinaciones) por parte del modelo de lenguaje compacto cuando el guía formule preguntas muy específicas que excedan el contenido indexado localmente.
- **R-03:** Fragmentación de hardware entre los teléfonos de los guías (variaciones en capacidad de RAM, procesadores y aceleración gráfica), lo que podría provocar lentitud o cierres inesperados en equipos de menores prestaciones.
- **R-04:** Baja adopción de la herramienta durante el recorrido si la interacción depende exclusivamente de escritura extensa en pantalla bajo lluvia, frío intenso o alta radiación solar.