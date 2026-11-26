# Vista de desarrollo: diagrama de componentes

> Nivel 3 de C4 (componentes): se abre la App móvil y se hace zoom, sus bloques internos y responsabilidades. Se dibuja como diagrama UML de paquetes, un paquete por capa, para que las dependencias se lean de arriba hacia abajo. Diagrama: [03-desarrollo.puml](../diagramas/03-desarrollo.puml). Para programadores. Incluye las capas de Clean Architecture y la vista de usos sin ciclos.

## 1. Presentación principal

Diagrama de componentes del contenedor App móvil (ADR-008), versión 1. De arriba hacia abajo: las pantallas de Expo Router, los módulos de casos de uso, los puertos de `src/aplicacion/puertos/`, los adaptadores que los implementan y las librerías nativas o sistemas externos que estos usan. `src/dominio/` no se dibuja porque todos los módulos lo usan; su contenido es el de la [vista lógica](01-logica.md).

Diagrama: [diagramas/03-desarrollo.puml](../diagramas/03-desarrollo.puml)

### Estructura de carpetas

```text
src/
  app/              Rutas de Expo Router: solo pantallas y _layout.tsx (regla de AGENTS.md)
  components/       Componentes de UI reutilizables (burbuja de chat, botón grande, aviso de vigencia, cita)
  hooks/            Hooks de React que exponen los casos de uso a las pantallas
  constants/        Tema visual (colores de montaña y páramo), tamaños táctiles
  dominio/          Entidades, objetos de valor y reglas puras (Carga, Vigencia, Banda...). Sin React, React Native ni Expo
  aplicacion/
    casos-uso/      Un subdirectorio por módulo: actualizacion/, consulta/, vigencia/, modelos/
    puertos/        Interfaces TypeScript que los casos de uso necesitan
    configuracion/  Constantes versionadas: umbrales, top-k, 24 h, datos de los modelos, textos del prompt
  infraestructura/
    ia/             Adaptador llama.rn y preparación de modelos desde los assets
    persistencia/   Adaptador SQLite, migraciones del esquema y consultas vectoriales
    red/            Adaptador HTTP del backend
    sistema/        Reloj, notificaciones (expo-notifications) y desinstalación (expo-intent-launcher)
  composicion/      Contenedor de dependencias: lo único que conoce todas las capas
```

### Vista de usos (quién necesita a quién)

```text
Módulo Consulta ──usa (¿hay carga vigente?)──> Módulo Vigencia
Módulo Actualización ──usa (iniciar la vigencia de la carga nueva)──> Módulo Vigencia
Módulos Consulta y Actualización ──usan (modelo listo, modelo de embeddings esperado)──> Gestor de modelos
Módulo Vigencia ──usa (liberar modelos al vencer)──> Gestor de modelos
Todos los módulos ──usan──> dominio
Prohibido: cualquier ciclo (por ejemplo, Módulo Vigencia usando Módulo Consulta o Módulo Actualización)
```

- Incrementos, en el orden del catálogo: dominio y Módulo Vigencia básico (estado de la carga) → Módulo Actualización (CU-01) → Gestor de modelos y Módulo Consulta (CU-02) → vencimiento completo con notificación y desinstalación (CU-03).
- Impacto: un cambio en Vigencia obliga a revisar Consulta y Actualización. Por eso su interfaz es mínima: `estado(ahora)`, `iniciar(carga)`, `vencer(decision)`.
- Los ciclos están prohibidos: son deuda técnica arquitectónica.

### Vista de capas (solo hacia adentro)

| Capa | Contenido | Puede usar |
|------|-----------|------------|
| pantallas (`src/app`, `src/components`, `src/hooks`) | Rutas, componentes y hooks | aplicacion y dominio; nunca infraestructura directamente |
| infraestructura | Adaptadores de llama.rn, SQLite, HTTP, notificaciones, desinstalación, reloj y preparación de modelos | aplicacion (implementa los puertos) y dominio |
| aplicacion | Módulos de casos de uso, Gestor de modelos, puertos y constantes | dominio |
| dominio | Entidades y reglas: Carga, Vigencia, Banda, Documento, Fragmento, Mensaje, Cita, ModeloLocal | nada externo |

`src/composicion/` conecta las capas y entrega los casos de uso a las pantallas mediante un proveedor de React: es lo único que las conoce todas. Si `src/dominio/` importa algo de `react-native`, `expo-*` o `src/infraestructura/`, la arquitectura está rota.

## 2. Catálogo de elementos

| Componente | Tipo | Responsabilidad | Depende de |
|------------|------|-----------------|------------|
| Inicio | Pantalla | Botón "Actualizar información", progreso y resultado de la carga, estado de la vigencia ("Disponible hasta las 15:04"), acceso al chat solo si está vigente | Módulos Actualización y Vigencia |
| Chat | Pantalla | Conversación, enviar, detener la generación, mostrar citas; si la vigencia vence mientras está abierto, se bloquea y lleva al diálogo de vencimiento | Módulos Consulta y Vigencia |
| Diálogo de vencimiento | Pantalla (modal) | "Ya no tienes acceso a la información del recorrido. ¿Deseas desinstalar la aplicación?" Sí / No | Módulo Vigencia |
| Módulo Actualización | Caso de uso | CU-01: verifica el backend y el modelo de embeddings, baja documentos y fragmentos, reemplaza la base en una transacción e inicia la vigencia (ADR-012) | Puertos ClienteBackend y RepositorioConocimiento; Gestor de modelos; Módulo Vigencia |
| Módulo Consulta | Caso de uso | CU-02: comprueba la vigencia, vectoriza la pregunta, busca los k vecinos, calcula la banda, genera en streaming o usa el texto fijo, guarda Mensaje y Citas (ADR-004, ADR-016) | Puertos CodificadorTexto, BuscadorVectorial, MotorInferencia y RepositorioConversaciones; Gestor de modelos; Módulo Vigencia |
| Módulo Vigencia | Caso de uso | CU-03: estado de la carga según el reloj, programa y cancela la notificación, borra la información y abre la desinstalación (ADR-015) | Puertos Reloj, Notificador, Desinstalador, RepositorioConocimiento y RepositorioConversaciones; Gestor de modelos |
| Gestor de modelos | Servicio de aplicación | Prepara los modelos desde el APK, los carga, los libera en segundo plano y al vencer; informa el modelo de embeddings esperado (ADR-013, ADR-014) | Puertos PreparadorModelos, MotorInferencia y CodificadorTexto |
| MotorInferencia | Puerto | Cargar y liberar el modelo de lenguaje, `generar(sistema, turno) → flujo de tokens`, detener | — |
| CodificadorTexto | Puerto | Cargar y liberar el modelo de embeddings; vector normalizado de 384 valores de un texto | — |
| PreparadorModelos | Puerto | Copiar un asset del APK al almacenamiento interno y verificar su sha256 | — |
| BuscadorVectorial | Puerto | k fragmentos más cercanos a un vector, con su similitud | — |
| RepositorioConocimiento | Puerto | Leer la Carga; reemplazar documentos, fragmentos y vectores en una transacción; borrar todo | — |
| RepositorioConversaciones | Puerto | Conversaciones, mensajes y citas; borrar todo | — |
| ClienteBackend | Puerto | `salud()`, `documentos()`, `fragmentos(id)` contra el backend RAG | — |
| Reloj | Puerto | Hora actual | — |
| Notificador | Puerto | Pedir permiso, programar y cancelar la notificación de vencimiento, saber si se abrió la app desde ella | — |
| Desinstalador | Puerto | Abrir el diálogo de desinstalación del sistema | — |
| Adaptador llama.rn | Adaptador | Implementa MotorInferencia y CodificadorTexto; traduce la falta de memoria a `MemoriaInsuficiente` | llama.rn |
| Adaptador de preparación de modelos | Adaptador | Implementa PreparadorModelos | expo-asset, expo-file-system, expo-crypto |
| Adaptador SQLite | Adaptador | Implementa BuscadorVectorial, RepositorioConocimiento y RepositorioConversaciones; aplica migraciones | expo-sqlite + sqlite-vec |
| Adaptador HTTP del backend | Adaptador | Implementa ClienteBackend con `process.env.EXPO_PUBLIC_BACKEND_URL`, tiempo límite de 5 s para la salud; traduce fallas a `BackendNoDisponible` | fetch |
| Adaptador de notificaciones | Adaptador | Implementa Notificador | expo-notifications |
| Adaptador de desinstalación | Adaptador | Implementa Desinstalador con `android.intent.action.DELETE` y `package:<id>` | expo-intent-launcher |
| Adaptador de reloj | Adaptador | Implementa Reloj con `Date.now()`; en pruebas se reemplaza por un reloj falso | — |

## 3. Justificación

- ADR-008 y PA-01: los motores de IA y los servicios de Android quedan detrás de puertos; el dominio no los conoce (EAC-07).
- ADR-014: un único Gestor de modelos decide qué se carga; ningún módulo carga un modelo por su cuenta.
- ADR-016 y EAC-05: la banda y las citas viven en el Módulo Consulta; los textos fijos vienen de `aplicacion/configuracion/`, copiados de [prompt-sistema.md](../prompt-sistema.md).
- ADR-004 y EAC-01: `MotorInferencia.generar` devuelve un flujo de tokens; la pantalla los agrupa antes de pintarlos.
- ADR-012 y EAC-02: la red solo aparece en el Adaptador HTTP del backend, y solo lo usa el Módulo Actualización.
- ADR-015 y EAC-08: el Reloj es un puerto, así el vencimiento se prueba sin esperar 24 h.
- RT-04 y PA-09: llama.rn, expo-notifications y expo-intent-launcher tienen código nativo; la app se prueba con un development build, no con Expo Go (ADR-011).

## 4. Comportamiento

- CU-01 dentro de la app: Inicio, Módulo Actualización, Adaptador HTTP, Adaptador SQLite y Módulo Vigencia ([cu01-actualizar-informacion.puml](../diagramas/secuencia/cu01-actualizar-informacion.puml)).
- CU-02 dentro de la app: Chat, Módulo Consulta, Adaptador llama.rn y Adaptador SQLite ([cu02-consultar-texto.puml](../diagramas/secuencia/cu02-consultar-texto.puml)).
- CU-03 dentro de la app: Módulo Vigencia, Adaptador de notificaciones, Adaptador SQLite y Adaptador de desinstalación ([cu03-vencer-vigencia.puml](../diagramas/secuencia/cu03-vencer-vigencia.puml)).

## 5. Vistas relacionadas

- [Procesos](02-procesos.md): es el interior del contenedor App móvil.
- [Lógica](01-logica.md): los módulos operan sobre las entidades del modelo de dominio.
- [Datos](05-datos.md): lo que guarda el Adaptador SQLite.
