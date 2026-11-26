# Plan: 001 Actualizar información

Entrada: [spec.md](spec.md) (sin marcas pendientes), [AGENTS.md](../../AGENTS.md), [arquitectura](../../docs/arquitectura.md), [vista de desarrollo](../../docs/vistas/03-desarrollo.md).

## Decisiones que aplican

| ID | Cómo se aterriza en esta funcionalidad |
|----|-----------------------------------------|
| ADR-008 | Capas `dominio → aplicacion → infraestructura → composicion → hooks/pantallas`; la pantalla de Inicio usa los casos de uso a través de hooks |
| ADR-012 | Orden `/health/db` (5 s) → `/documents` → `/documents/{id}/chunks?include_embeddings=true` (30 s por petición, aclarado en spec); todo a memoria; una transacción que borra conocimiento y uso e inserta lo nuevo; rollback ante cualquier falla; solo `GET` a `EXPO_PUBLIC_BACKEND_URL`; tráfico en claro permitido solo hacia el host de esa URL |
| ADR-013 / ADR-014 | El modelo de embeddings esperado (nombre y dimensiones) lo informa el Gestor de modelos a partir de la constante de modelos de `aplicacion/configuracion/`; en esta funcionalidad no se carga ningún modelo |
| ADR-015 | Al confirmar la carga, el Módulo Vigencia calcula `expira_en = cargado_en + 24 h`, cancela la notificación anterior y programa una nueva; tras la carga se ofrece la explicación del permiso de notificaciones |
| ADR-011 | Solo `arm64-v8a`; configuración nativa en `app.json` y un config plugin local, nunca en `android/` |
| ADR-017 | Solo Android; nada de foto ni voz |
| Vista de datos | Tablas `carga`, `documento`, `fragmento`, `vec_fragmento` (vec0, `float[384]`, coseno), `conversacion`, `mensaje`, `cita`; migración inicial completa para que 002 y 003 no cambien el esquema |
| Vista lógica | Ciclo de vida de la Carga: `sin_datos → cargando → vigente`; falla → estado anterior |

Librerías:
- `expo-sqlite` con `withSQLiteVecExtension: true` (ADR-012) y `expo-notifications` (ADR-015). Ambas con código nativo: **hace falta un development build nuevo (ADR-011)**; Expo Go no sirve.
- El tráfico en claro hacia el backend y el ABI `arm64-v8a` se configuran con un **config plugin local** (`plugins/with-red-local-android.js`) escrito con `@expo/config-plugins`, que ya viene con `expo`; no se agrega `expo-build-properties` (no tiene ADR).
- Sin librerías de íconos ni fuentes: la UI usa la tipografía del sistema (Roboto) y formas dibujadas con `View`.

## Componentes

Dominio (`src/dominio/`, sin React ni Expo):
- `EstadoCarga.ts`: tipo `sin_datos | cargando | vigente | vencida`.
- `Carga.ts`: entidad y regla `estaVigente(ahora)`.
- `Vigencia.ts`: objeto de valor; `calcularExpiracion(cargadoEn)` (+24 h, desde la constante) y `contiene(ahora)`.
- `Documento.ts`: entidad y regla `quedarseConVersionMasAlta(documentos)`.
- `Fragmento.ts`: entidad con `vector: Float32Array` de 384 valores.

Aplicación (`src/aplicacion/`):
- `configuracion/modelos.ts`: datos de los modelos (embeddings: `paraphrase-multilingual-MiniLM-L12-v2`, 384).
- `configuracion/carga.ts`: límites de 5 s y 30 s; duración de la vigencia, 24 h.
- `configuracion/textos.ts`: textos de pantalla del spec (mensajes de error, de éxito, de progreso, de permiso y de notificación).
- `errores/ErrorAplicacion.ts` y uno por archivo: `BackendNoDisponible.ts`, `ModeloEmbeddingIncompatible.ts`, `SinDocumentosEnBackend.ts`, `CargaIncompleta.ts`.
- `puertos/ClienteBackend.ts`: `salud()`, `documentos()`, `fragmentos(id)`.
- `puertos/RepositorioConocimiento.ts`: `leerCarga()`, `reemplazarTodo(nuevaCarga, documentos, fragmentos)`, `borrarTodo()` (este último se usa en 003).
- `puertos/Reloj.ts`, `puertos/Notificador.ts` (`estadoPermiso()`, `pedirPermiso()`, `programarVencimiento(fecha)`, `cancelarVencimiento()`).
- `casos-uso/modelos/GestorModelos.ts`: en esta funcionalidad solo `modeloEmbeddingEsperado()`; 002 agrega la preparación y la carga.
- `casos-uso/vigencia/ModuloVigencia.ts`: `estado(ahora)`, `iniciar(cargadoEn)`; 003 agrega `vencer(decision)`.
- `casos-uso/actualizacion/ActualizarInformacion.ts`: CU-01 completo, con un callback de progreso `(actual, total)`.

Infraestructura (`src/infraestructura/`):
- `red/ClienteBackendHttp.ts`: `fetch` con `AbortController` (5 s y 30 s); traduce las fallas a `BackendNoDisponible` (salud) o `CargaIncompleta` (documentos y fragmentos).
- `persistencia/BaseLocal.ts`: abre la base, carga sqlite-vec (`bundledExtensions['sqlite-vec']`) y aplica las migraciones.
- `persistencia/migraciones.ts`: esquema de la vista de datos y fila `carga` con `id = 1` en `sin_datos`.
- `persistencia/RepositorioConocimientoSqlite.ts`: `withExclusiveTransactionAsync`; los vectores se guardan como `Uint8Array` de float32.
- `sistema/RelojSistema.ts`: `Date.now()`.
- `sistema/NotificadorExpo.ts`: canal Android, disparador `DATE`, identificador fijo para poder cancelar.

Composición (`src/composicion/`):
- `contenedor.ts`: crea adaptadores y casos de uso.
- `ProveedorDependencias.tsx`: contexto de React que entrega el contenedor.

Hooks (`src/hooks/`): `use-actualizacion.ts` (estado de la UI de la carga: inactivo, cargando con progreso, éxito, error, explicación de permiso) y `use-vigencia.ts` (estado y `expiraEn`; se refresca al volver a primer plano).

Configuración nativa: `app.json` (plugins `expo-sqlite` con `withSQLiteVecExtension`, `expo-notifications` y el plugin local; `userInterfaceStyle: "light"`; colores del splash y del ícono adaptativo del tema) y `plugins/with-red-local-android.js` (`network_security_config.xml` con tráfico en claro solo para `192.168.137.1`, `rag.home.arpa` y `mshome.net`; `reactNativeArchitectures=arm64-v8a`).

## Pantallas

Diseño (skill ui-ux-pro-max; búsquedas de color y tipografía filtradas por "naturaleza/legible"; resultado adaptado a AAA):
- **Paleta "páramo"** (`src/constants/theme.ts`, tokens semánticos): fondo niebla `#F4F1E6`; texto roca `#16241B`; primario musgo de frailejón `#234A31` con texto blanco; acento laguna `#0B4A57`; señal de sendero madera `#4A2E1C` con texto crema `#FFF3D1`; flor de frailejón ámbar `#F2B43A` (solo como relleno con texto roca); error `#8A1C1C` con texto blanco. Todo par texto/fondo ≥ 7:1, comprobado con un script. Solo tema claro: es el más legible al sol (EAC-06).
- **Tipografía**: Roboto del sistema; título 28/34 bold, cuerpo 18/27, etiqueta de botón 20 bold; nunca menos de 16.
- **Firma visual**: cabecera con siluetas de cordillera en capas y un nevado (formas con `View` rotadas), y la vigencia como **letrero de sendero** de madera ("Disponible hasta las 15:04").

Archivos:
- `src/app/_layout.tsx`: Stack sin pestañas, envuelto en `ProveedorDependencias`.
- `src/app/index.tsx`: Inicio.
- `src/components/cordillera.tsx`: cabecera decorativa (oculta a lectores de pantalla).
- `src/components/boton-grande.tsx`: ≥ 64 dp, estados presionado y deshabilitado, `accessibilityRole="button"`.
- `src/components/letrero-vigencia.tsx`.
- `src/components/progreso-carga.tsx`: "Descargando documento 2 de 5…" y barra.
- `src/components/aviso-estado.tsx`: mensaje de éxito o error con forma y texto (no solo color), `accessibilityLiveRegion`.
- `src/components/explicacion-permiso.tsx`: texto y botones "Permitir avisos" y "Ahora no".
- Se borra la plantilla: `src/app/explore.tsx`, `src/components/{app-tabs*,animated-icon*,external-link,hint-row,web-badge,themed-*,ui/collapsible}.tsx`, `src/hooks/use-color-scheme*.ts`, `src/hooks/use-theme.ts`, `src/global.css`.
- El botón "Ir al chat" aparece solo con la carga vigente; la ruta `chat` llega con 002 (mientras tanto el botón queda oculto).

## Flujo

[cu01-actualizar-informacion.puml](../../docs/diagramas/secuencia/cu01-actualizar-informacion.puml): Inicio → `ActualizarInformacion` → `ClienteBackend.salud` → `GestorModelos.modeloEmbeddingEsperado` → `documentos` → `quedarseConVersionMasAlta` → `fragmentos` por documento (progreso) → validaciones (`num_chunks`, 384 valores) → `RepositorioConocimiento.reemplazarTodo` (transacción) → `ModuloVigencia.iniciar` → Notificador. Si es la primera carga y el permiso está sin decidir → explicación del permiso.

## Fuera de alcance

- Preparar o cargar los modelos GGUF y el chat (002).
- Vencimiento, diálogo de desinstalación y borrado al vencer (003); aquí solo se programa la notificación.
- Cancelar una carga en curso (spec: no hay cancelación).
- Cualquier llamada a los endpoints de escritura del backend.
