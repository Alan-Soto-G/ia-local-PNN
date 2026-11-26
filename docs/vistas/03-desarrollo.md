# Vista de desarrollo: diagrama de componentes

> Nivel 3 de C4 (componentes): se abre la App móvil y se hace zoom, sus bloques internos y responsabilidades. Se dibuja como diagrama UML de paquetes, un paquete por capa, para que las dependencias se lean de arriba hacia abajo. Diagrama: [03-desarrollo.puml](../diagramas/03-desarrollo.puml). Para programadores. Incluye las capas de Clean Architecture y la vista de usos sin ciclos.

## 1. Presentación principal

Diagrama de componentes del contenedor App móvil (ADR-008). De arriba hacia abajo: las pantallas de Expo Router, los módulos de casos de uso, los puertos de `src/aplicacion/puertos/`, los adaptadores que los implementan y las librerías nativas o sistemas externos que estos usan. `src/dominio/` no se dibuja porque todos los módulos lo usan; su contenido es el de la [vista lógica](01-logica.md).

Diagrama: [diagramas/03-desarrollo.puml](../diagramas/03-desarrollo.puml)

### Estructura de carpetas

```text
src/
  app/              Rutas de Expo Router: solo pantallas y _layout.tsx (regla de AGENTS.md)
  components/       Componentes de UI reutilizables (burbuja de chat, botón de hablar, tarjeta de especie)
  hooks/            Hooks de React que exponen los casos de uso a las pantallas
  constants/        Tema visual (colores de montaña y páramo), tamaños táctiles
  dominio/          Entidades, objetos de valor y reglas puras. Sin React, React Native ni Expo
  aplicacion/
    casos-uso/      Un subdirectorio por módulo (consulta/, identificacion/, voz/, ...)
    puertos/        Interfaces TypeScript que los casos de uso necesitan
  infraestructura/
    ia/             Adaptadores llama.rn, ONNX, whisper.rn
    voz/            Adaptador expo-speech y grabación de audio
    persistencia/   Adaptador SQLite, migraciones del esquema y consultas vectoriales
    red/            Adaptador HTTP de sincronización y adaptador de descargas
    dispositivo/    RAM, espacio libre, estado de red (expo-device, expo-network)
  composicion/      Contenedor de dependencias: lo único que conoce todas las capas
```

### Vista de usos (quién necesita a quién)

```text
Módulo Identificación ──usa (genera la respuesta con los candidatos)──> Módulo Consulta
Módulo Voz ──usa (envía la transcripción)──> Módulo Consulta
Módulo Consulta ──usa (perfil e idioma)──> Módulo Preferencias
Módulos Consulta, Identificación y Voz ──usan (modelo cargado)──> Gestor de modelos
Gestor de modelos ──usa (qué paquetes están listos)──> Módulo Paquetes
Módulo Sincronización ──usa (reseñas pendientes)──> Módulo Reseñas
Módulo Conocimiento ──usa──> solo dominio y puertos
Todos los módulos ──usan──> dominio
Prohibido: cualquier ciclo (por ejemplo, Módulo Consulta usando Módulo Voz, o Módulo Paquetes usando el Gestor de modelos)
```

- Incrementos: dominio, Paquetes, Gestor de modelos y Consulta primero; Identificación y Voz se montan sobre Consulta; Sincronización y Reseñas pueden ir al final, porque el primer paquete de conocimiento puede venir en el manifest (ADR-007).
- Impacto: un cambio en Consulta obliga a revisar Identificación y Voz. Por eso su interfaz se mantiene pequeña: recibe texto, adjuntos opcionales y candidatos, y devuelve un flujo de tokens.
- Los ciclos están prohibidos: son deuda técnica arquitectónica.

### Vista de capas (solo hacia adentro)

| Capa | Contenido | Puede usar |
|------|-----------|------------|
| pantallas (`src/app`, `src/components`, `src/hooks`) | Rutas, componentes y hooks | aplicacion y dominio; nunca infraestructura directamente |
| infraestructura | Adaptadores de llama.rn, ONNX, whisper.rn, expo-speech, SQLite, HTTP, descargas y dispositivo | aplicacion (implementa los puertos) y dominio |
| aplicacion | Módulos de casos de uso, Gestor de modelos y puertos | dominio |
| dominio | Entidades y reglas: Especie, Ruta, DocumentoFuente, Mensaje, Cita, PaqueteModelo, Resena, entre otras | nada externo |

`src/composicion/` conecta las capas y entrega los casos de uso a las pantallas mediante un proveedor de React: es lo único que las conoce todas. Si `src/dominio/` importa algo de `react-native`, `expo-*` o `src/infraestructura/`, la arquitectura está rota.

## 2. Catálogo de elementos

| Componente | Tipo | Responsabilidad | Depende de |
|------------|------|-----------------|------------|
| Chat | Pantalla | Conversación, adjuntar foto, mantener para hablar, detener la generación, activar lectura en voz alta | Módulos Consulta, Identificación y Voz |
| Rutas y fichas | Pantalla | Lista de rutas por tipo, especies por ruta, ficha de especie, visor del PDF fuente | Módulo Conocimiento |
| Paquetes | Pantalla | Lista del manifest, progreso, pausar y reanudar, espacio libre | Módulo Paquetes |
| Reseña | Pantalla | Formulario de reseña con consentimiento para métricas | Módulo Reseñas |
| Ajustes e historial | Pantalla | Voz, idioma, perfil del público, modelo; historial y borrado | Módulo Preferencias |
| Módulo Consulta | Caso de uso | CU-01, CU-07 y CU-11: arma la pregunta, recupera contexto (ADR-010), genera en streaming (ADR-004) y guarda Mensaje y Citas | Puertos CodificadorTexto, BuscadorVectorial y RepositorioLocal; Módulo Preferencias; Gestor de modelos |
| Módulo Identificación | Caso de uso | CU-02: vectoriza la foto, busca los k vecinos, filtra por umbral y pasa candidatos e imagen a Consulta (ADR-002) | Puerto BuscadorVectorial; Gestor de modelos; Módulo Consulta |
| Módulo Voz | Caso de uso | CU-03 y CU-04: transcribe, entrega el texto a Consulta y lee la respuesta por frases (ADR-003) | Puerto Sintetizador; Gestor de modelos; Módulo Consulta |
| Módulo Conocimiento | Caso de uso | CU-08 y CU-09: rutas, especies por ruta, fichas y documentos | Puerto RepositorioConocimiento |
| Módulo Paquetes | Caso de uso | CU-05: lee el manifest, descarga solo con Wi-Fi y espacio suficiente, verifica sha256 (ADR-007) | Puertos Descargador, EstadoDispositivo y RepositorioLocal |
| Módulo Sincronización | Caso de uso | CU-06: baja cambios por cursor, los aplica por página en una transacción y sube reseñas (ADR-006) | Puertos ClienteSync, RepositorioConocimiento y RepositorioLocal; Módulo Reseñas |
| Módulo Reseñas | Caso de uso | CU-10: crea la reseña y la deja en la cola de salida | Puerto RepositorioLocal |
| Módulo Preferencias | Caso de uso | CU-12 y CU-13 | Puerto RepositorioLocal |
| Gestor de modelos | Servicio de aplicación | Decide qué modelo cargar según la RAM, mantiene uno pesado a la vez y libera el Transcriptor (ADR-009) | Puertos MotorInferencia, Transcriptor, CodificadorImagen y EstadoDispositivo; Módulo Paquetes |
| MotorInferencia | Puerto | Cargar y liberar el modelo, `generar(mensajes, imagen?) → flujo de tokens`, detener | — |
| CodificadorTexto | Puerto | Vector de un texto (pregunta) con el mismo modelo que usó el backend | — |
| CodificadorImagen | Puerto | Vector de una imagen | — |
| Transcriptor | Puerto | Audio → texto con idioma | — |
| Sintetizador | Puerto | Leer una frase, detener, saber si hay voz instalada | — |
| BuscadorVectorial | Puerto | k vecinos más cercanos de un vector en fragmentos o imágenes | — |
| RepositorioConocimiento | Puerto | Lectura del conocimiento y aplicación de páginas de cambios | — |
| RepositorioLocal | Puerto | Conversaciones, mensajes, reseñas, cola de salida, preferencias, estado de paquetes y de sync | — |
| ClienteSync | Puerto | Pedir cambios desde un cursor, pedir el manifest, enviar reseñas | — |
| Descargador | Puerto | Descarga reanudable con progreso y verificación | — |
| EstadoDispositivo | Puerto | RAM total, espacio libre, tipo de red | — |
| Adaptador llama.rn | Adaptador | Implementa MotorInferencia y CodificadorTexto; traduce la falta de memoria a `MemoriaInsuficiente` | llama.rn |
| Adaptador ONNX | Adaptador | Implementa CodificadorImagen: redimensiona, normaliza y ejecuta el modelo | onnxruntime-react-native |
| Adaptador whisper.rn | Adaptador | Implementa Transcriptor | whisper.rn |
| Adaptador expo-speech | Adaptador | Implementa Sintetizador | expo-speech |
| Adaptador SQLite | Adaptador | Implementa BuscadorVectorial, RepositorioConocimiento y RepositorioLocal; aplica migraciones | expo-sqlite + sqlite-vec |
| Adaptador HTTP de sync | Adaptador | Implementa ClienteSync con la URL de `process.env.EXPO_PUBLIC_BACKEND_URL` | fetch / HTTPS |
| Adaptador de descargas | Adaptador | Implementa Descargador con descargas reanudables y sha256 | expo-file-system, expo-crypto |
| Adaptador de dispositivo | Adaptador | Implementa EstadoDispositivo | expo-device, expo-network |

## 3. Justificación

- ADR-008 y PA-01: los motores de IA cambian rápido; quedan detrás de puertos y el dominio no los conoce (EAC-07).
- ADR-009 y EAC-04: un único Gestor de modelos decide qué se carga; ningún módulo carga un modelo por su cuenta.
- ADR-010 y EAC-05: la recuperación local y las citas viven en el Módulo Consulta, que reutilizan Identificación y Voz, así que toda respuesta pasa por el mismo control de fuentes.
- ADR-004 y EAC-01: `MotorInferencia.generar` devuelve un flujo de tokens; la pantalla los agrupa antes de pintarlos.
- ADR-005: un solo adaptador conoce SQL y sqlite-vec.
- ADR-006 y ADR-007: la red solo aparece en dos adaptadores, y solo los usan Sincronización y Paquetes (EAC-02).
- RT-04 y PA-09: llama.rn, whisper.rn y onnxruntime-react-native son módulos nativos; la app se prueba con un development build, no con Expo Go (ADR-011).

## 4. Comportamiento

- CU-01 dentro de la app: Chat, Módulo Consulta, Adaptador llama.rn y Adaptador SQLite ([cu01-consultar-texto.puml](../diagramas/secuencia/cu01-consultar-texto.puml)).
- CU-02 dentro de la app: Módulo Identificación, Adaptador ONNX, Adaptador SQLite y luego Módulo Consulta ([cu02-identificar-foto.puml](../diagramas/secuencia/cu02-identificar-foto.puml)).

## 5. Vistas relacionadas

- [Procesos](02-procesos.md): es el interior del contenedor App móvil.
- [Lógica](01-logica.md): los módulos operan sobre las entidades del modelo de dominio.
- [Datos](05-datos.md): lo que guarda el Adaptador SQLite.
