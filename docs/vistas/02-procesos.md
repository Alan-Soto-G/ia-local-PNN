# Vista de procesos: diagrama de contenedores

> Nivel 2 de C4: se abre la caja y se hace zoom, qué se ejecuta y cómo se comunica. Diagrama: [02-procesos.puml](../diagramas/02-procesos.puml). Para integradores del sistema. En este contexto un contenedor no es Docker: es cualquier cosa que se ejecuta o guarda datos por separado. Aquí todos viven dentro del mismo APK, pero el motor nativo tiene su propio ciclo de vida y su propia memoria.

## 1. Presentación principal

La App móvil (JavaScript) orquesta un motor nativo de IA (llama.rn, con dos modelos), una base SQLite con vectores y el almacenamiento de archivos, donde quedan los modelos copiados desde el APK. Hacia afuera hay una sola conexión de red, opcional y solo en CU-01: el backend RAG del computador administrador, por su punto de acceso. Dentro del teléfono, la app usa dos servicios de Android: notificaciones y el instalador de paquetes.

Diagrama: [diagramas/02-procesos.puml](../diagramas/02-procesos.puml)

## 2. Catálogo de elementos

| Elemento | Responsabilidad | Tecnología | Se comunica con |
|----------|-----------------|------------|-----------------|
| App móvil | Pantallas (inicio con "Actualizar información", chat, diálogo de vencimiento), casos de uso, Gestor de modelos (ADR-008) | Expo SDK 58, React Native 0.88, TypeScript, Expo Router | Todos los demás contenedores; el backend solo en CU-01 |
| Motor de inferencia | Genera texto en streaming con LFM2.5-350M y calcula el embedding de la pregunta con MiniLM multilingüe (ADR-004, ADR-014) | llama.rn sobre llama.cpp | App móvil (puente nativo); Archivos locales (carga los modelos) |
| Base local | Carga, documentos, fragmentos, vectores, conversaciones, mensajes y citas (ADR-012) | expo-sqlite con la extensión sqlite-vec | App móvil |
| Archivos locales | Copia de los modelos GGUF que trae el APK (ADR-013) | Almacenamiento interno de la app (expo-file-system, expo-asset) | App móvil y Motor de inferencia |
| Notificaciones de Android (externo) | Muestra el aviso de vencimiento a la hora programada (ADR-015) | expo-notifications | App móvil |
| Instalador de paquetes de Android (externo) | Diálogo de desinstalación (ADR-015) | expo-intent-launcher (`android.intent.action.DELETE`) | App móvil |
| Backend RAG (externo) | Entrega documentos, fragmentos y vectores ([API.md](../../API.md)) | FastAPI + SQLite + sqlite-vec en el computador administrador | App móvil, por HTTP en la red local |

## 3. Justificación

- RT-01 y EAC-02: todo lo que necesita una consulta (motor, base y archivos) está en el teléfono; la flecha de red no participa en CU-02 ni en CU-03.
- ADR-014: llama.rn da en una sola librería generación en streaming y embeddings de texto.
- ADR-013: los modelos llegan con el APK y se copian a Archivos locales en el primer arranque.
- ADR-012: sqlite-vec permite la búsqueda kNN en la misma base SQLite, sin otro proceso; el backend usa el mismo formato.
- ADR-015: la notificación la muestra Android aunque la app esté cerrada.

## 4. Comportamiento

- [cu01-actualizar-informacion.puml](../diagramas/secuencia/cu01-actualizar-informacion.puml): App móvil → Backend RAG → Base local; programa la notificación.
- [cu02-consultar-texto.puml](../diagramas/secuencia/cu02-consultar-texto.puml): App móvil → Motor (embedding) → Base local (kNN) → Motor (generación en streaming).
- [cu03-vencer-vigencia.puml](../diagramas/secuencia/cu03-vencer-vigencia.puml): Notificaciones de Android → App móvil → Base local (borrado) o Instalador de paquetes.

## 5. Vistas relacionadas

- [Contexto](../contexto.md): de dónde vienen los actores y los sistemas externos.
- [Física](04-fisica.md): en qué nodo corre cada contenedor.
- [Desarrollo](03-desarrollo.md): cómo se organiza por dentro la App móvil.
- [Datos](05-datos.md): el esquema de la Base local.
