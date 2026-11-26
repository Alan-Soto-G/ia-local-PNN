# Sistema de interpretación ambiental mediante RAG local y procesamiento multimodal

## 1. Descripción general

El proyecto consiste en el desarrollo de un sistema de inteligencia artificial basado en Retrieval-Augmented Generation (RAG), diseñado para ofrecer información, respuestas y acompañamiento educativo a visitantes durante recorridos ambientales.

El sistema estará compuesto por un computador portátil encargado de administrar, procesar, actualizar y distribuir el conocimiento ambiental, y una aplicación móvil Android que permitirá a los visitantes interactuar con dicho conocimiento de manera autónoma, sin necesidad de una conexión a Internet.

La información del sistema será construida a partir de uno o varios documentos PDF, los cuales podrán contener información científica, ecológica, histórica y educativa relacionada con el recorrido. Estos documentos serán procesados localmente desde el computador, generando una base de conocimiento textual y visual que posteriormente podrá ser distribuida a los dispositivos de los visitantes.

El propósito principal es ofrecer una herramienta de interpretación ambiental accesible, offline, eficiente y adaptable a las necesidades de cada recorrido, procurando que la inteligencia artificial no sustituya al guía, sino que complemente su labor educativa.

## 2. Objetivo general

Desarrollar un sistema de interpretación ambiental basado en inteligencia artificial y recuperación aumentada de generación (RAG), que permita procesar, organizar, distribuir y consultar información textual y visual de manera local, facilitando a los visitantes el acceso a conocimientos relacionados con el ecosistema, las especies, los procesos naturales y las características del recorrido.

## 3. Arquitectura general del sistema

El sistema estará dividido en dos componentes principales:

- **Computador administrador:** encargado de gestionar los documentos, procesar el conocimiento, generar los recursos necesarios para el RAG, actualizar versiones y distribuir la información.
- **Aplicación móvil del visitante:** encargada de recibir la base de conocimiento, realizar consultas textuales y visuales, recuperar información relevante y generar respuestas mediante un modelo de inteligencia artificial local.

Ambos componentes se comunicarán mediante una red local generada por el computador administrador, sin requerir acceso a Internet.

## 4. Computador administrador

El computador portátil funcionará como el centro de administración, procesamiento y distribución del conocimiento ambiental.

Contará con una interfaz que permitirá al administrador gestionar los documentos que conformarán la base de conocimiento del sistema.

### 4.1. Gestión de documentos PDF

El administrador podrá cargar uno o varios archivos PDF, los cuales serán utilizados como fuentes principales de información para el sistema RAG.

La interfaz permitirá:

- Cargar documentos PDF.
- Consultar los documentos incorporados.
- Editar, reemplazar o actualizar la información fuente.
- Procesar nuevamente los documentos cuando se realicen modificaciones.
- Administrar las versiones de los documentos.

Cada modificación o actualización de un documento generará una nueva versión, permitiendo conservar una identificación clara del contenido distribuido.

Por ejemplo:

- `Fauna_v1.pdf`
- `Fauna_v2.pdf`
- `Fauna_v3.pdf`

Esto permitirá identificar las actualizaciones realizadas y mantener un control sobre el contenido que se distribuye a los visitantes.

### 4.2. Procesamiento y vectorización de la información

Una vez incorporados los documentos, el computador realizará el procesamiento de la información necesaria para construir el sistema RAG.

Este proceso incluirá:

1. Extracción del texto contenido en los PDF.
2. Organización y fragmentación de la información en segmentos relevantes.
3. Generación de embeddings textuales.
4. Procesamiento de imágenes incorporadas al conocimiento.
5. Generación de embeddings visuales, cuando el modelo seleccionado lo permita.
6. Organización de los recursos en una base de conocimiento preparada para su distribución.

El procesamiento se realizará en el computador administrador, evitando que cada visitante tenga que procesar nuevamente los documentos completos desde su dispositivo móvil.

### 4.3. Recuperación multimodal

El sistema contará con mecanismos de recuperación que permitirán relacionar consultas textuales con información textual y visual previamente procesada.

Se contemplarán principalmente dos modalidades:

- **Text-to-text:** permite realizar consultas textuales y recuperar fragmentos de documentos relacionados semánticamente con la pregunta.
- **Text-to-image:** permite realizar consultas textuales para recuperar imágenes relacionadas con los conceptos, especies o elementos descritos en la base de conocimiento.

Adicionalmente, se contemplará la consulta a partir de imágenes proporcionadas por el visitante, utilizando un proceso de análisis visual y recuperación de información relacionada.

La implementación de estas funcionalidades dependerá de la compatibilidad y rendimiento de los modelos seleccionados.

### 4.4. Distribución local del conocimiento

El computador administrador generará un punto de conexión local que permitirá a los visitantes acceder al sistema y recibir los recursos necesarios para su funcionamiento.

Este punto de conexión podrá funcionar sin acceso a Internet, utilizando únicamente la infraestructura de comunicación local.

Mediante esta conexión, los dispositivos podrán recibir:

- Documentos procesados.
- Fragmentos de conocimiento.
- Embeddings textuales y visuales.
- Metadatos de los documentos.
- Información sobre las versiones distribuidas.
- Recursos adicionales necesarios para el funcionamiento de la aplicación.

La distribución se realizará de forma local, sin depender de servidores externos ni servicios en la nube durante el recorrido.

## 5. Aplicación móvil del visitante

La aplicación móvil será desarrollada para dispositivos Android y estará diseñada para ser ligera, sencilla y funcional.

Su propósito será permitir al visitante consultar información relacionada con el recorrido, utilizando una base de conocimiento previamente procesada y un modelo de inteligencia artificial ejecutado localmente.

### 5.1. Recepción de la información

El visitante instalará una aplicación móvil que inicialmente contará con una interfaz básica.

Al conectarse al punto de distribución local del computador administrador, la aplicación recibirá la información y los recursos correspondientes al recorrido.

Una vez completada la transferencia, la aplicación podrá operar de manera independiente, sin requerir una conexión permanente al computador ni a Internet.

### 5.2. Chatbot local

La aplicación incorporará un modelo de inteligencia artificial local que permitirá responder preguntas, explicar conceptos y resolver curiosidades relacionadas con la información del recorrido.

El chatbot utilizará la base de conocimiento recibida para recuperar fragmentos relevantes y construir respuestas contextualizadas.

Se buscará que las respuestas sean:

- Comprensibles para visitantes con diferentes niveles de conocimiento.
- Basadas prioritariamente en la información disponible en el RAG.
- Respetuosas, educativas y contextualizadas.
- Adaptadas a las características del recorrido.
- Prudentes cuando no exista información suficiente para responder.

Cuando una pregunta no esté relacionada con el recorrido, o cuando la información disponible no permita responder con suficiente certeza, el sistema indicará respetuosamente que es recomendable consultar al guía ambiental.

El chatbot no estará diseñado para reemplazar la interpretación humana, sino para complementar la experiencia del visitante.

### 5.3. Consultas textuales y búsqueda semántica

Cuando el visitante formule una pregunta, la aplicación realizará un proceso de recuperación semántica local.

Este proceso permitirá identificar los fragmentos de información que tengan mayor relación con la consulta, utilizando embeddings previamente generados y un modelo de embeddings ejecutado localmente.

En caso de que la pregunta sea extensa, informal o contenga información innecesaria, se podrá utilizar el modelo local para reformularla y conservar únicamente los elementos relevantes para la búsqueda.

Por ejemplo:

**Pregunta original:**

"Oye, hoy vi un zorro rojo y blanco, me pareció muy bonito y me dio curiosidad saber por qué tiene esos colores y cómo vive."

**Consulta reformulada:**

"Zorro rojo: características físicas, comportamiento y hábitat."

La consulta reformulada podrá ser vectorizada para realizar una búsqueda semántica más enfocada en el conocimiento disponible.

Este proceso buscará reducir la cantidad de información procesada durante la recuperación, facilitando el funcionamiento del sistema en dispositivos con recursos limitados.

La reformulación será contextual, de modo que no se eliminen elementos importantes de la intención del visitante.

### 5.4. Consulta mediante imágenes

La aplicación permitirá que el visitante tome una fotografía o seleccione una imagen de su dispositivo para consultar información relacionada con lo observado durante el recorrido.

El proceso se desarrollará de la siguiente manera:

1. El visitante proporciona una imagen.
2. El modelo multimodal local analiza la imagen.
3. El modelo genera una descripción breve de los elementos visuales identificados.
4. La descripción se utiliza para construir una consulta de recuperación.
5. La consulta se procesa mediante el modelo de embeddings.
6. Se realiza una búsqueda semántica en la base de conocimiento local.
7. Se recuperan los fragmentos de información más relevantes.
8. El modelo generativo utiliza el contexto recuperado para elaborar una respuesta.

Este mecanismo permitirá relacionar las fotografías tomadas por los visitantes con información científica y educativa previamente incorporada al sistema.

El proceso se realizará localmente, buscando reducir el consumo de recursos y evitar la dependencia de servicios externos de reconocimiento visual.

La identificación visual se tratará como una aproximación y no como una confirmación científica, especialmente cuando la imagen no permita distinguir con suficiente claridad el elemento observado.

### 5.5. Eliminación automática de la información

La aplicación tendrá un mecanismo de expiración temporal de la información recibida.

Se establecerá un periodo de 24 horas a partir de la recepción de los recursos, después del cual la aplicación eliminará automáticamente los documentos, bases de conocimiento, archivos, recursos descargados y demás información temporal asociada al recorrido.

Esta funcionalidad buscará:

- Evitar la acumulación innecesaria de información en los dispositivos.
- Mantener el carácter temporal de la aplicación.
- Reducir el almacenamiento utilizado.
- Facilitar la reutilización del sistema con nuevos visitantes y recorridos.

La expiración se implementará mediante un mecanismo local que permita verificar el tiempo transcurrido y ejecutar la limpieza de los recursos temporales.

## 6. Funcionamiento general del sistema

El flujo de funcionamiento estará compuesto por las siguientes etapas:

1. El administrador carga uno o varios PDF desde el computador.
2. El sistema extrae, organiza y procesa la información textual y visual.
3. Se generan los embeddings y los recursos necesarios para la recuperación semántica.
4. El administrador inicia el punto de distribución local.
5. El visitante conecta su dispositivo Android y recibe los recursos del recorrido.
6. La aplicación móvil almacena localmente la información.
7. El visitante realiza consultas textuales o mediante imágenes.
8. La aplicación recupera información relevante mediante búsqueda semántica local.
9. El modelo generativo local construye una respuesta contextualizada.
10. Al cumplirse las 24 horas establecidas, la aplicación elimina los recursos temporales recibidos.

## 7. Consideraciones técnicas

El proyecto priorizará el funcionamiento offline y la utilización eficiente de los recursos disponibles.

Por lo tanto, se contemplarán las siguientes consideraciones:

- Procesamiento de documentos desde el computador administrador.
- Uso de modelos cuantizados y compactos en dispositivos móviles.
- Almacenamiento local de los embeddings y la información recuperada.
- Separación entre el modelo de embeddings y el modelo generativo.
- Optimización de los recursos visuales.
- Compatibilidad con dispositivos Android de recursos limitados.
- Distribución mediante una red local sin Internet.
- Control de versiones de los documentos.
- Mecanismos de expiración y eliminación de información temporal.
- Respuestas fundamentadas en la información suministrada.
- Manejo de incertidumbre en consultas textuales y visuales.

## 8. Alcance esperado

El resultado esperado es un sistema funcional de interpretación ambiental que permita a los visitantes consultar información relacionada con el recorrido a través de una aplicación móvil autónoma.

El sistema permitirá gestionar, procesar y distribuir conocimiento ambiental desde un computador administrador, proporcionando a los visitantes una herramienta de consulta textual y visual que funcionará sin conexión a Internet.

La solución buscará facilitar el acceso a información ambiental, complementar el trabajo de los guías y ofrecer una experiencia educativa interactiva, adaptable y accesible mediante inteligencia artificial local.