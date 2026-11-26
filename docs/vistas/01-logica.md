# Vista lógica: modelo de dominio

> Las abstracciones clave del Asistente de interpretación ambiental, versión 1. Diagrama: [01-logica.puml](../diagramas/01-logica.puml). Para usuarios, especialistas y analistas. Notación: UML (C4 no tiene un diagrama para esta vista). El modelo físico de tablas está en la [vista de datos](05-datos.md).

## 1. Presentación principal

Muestra los conceptos del negocio y cómo se relacionan, no las clases del código. Son pocas clases, solo con sus atributos clave, sin métodos ni tipos. Se agrupan en tres paquetes:

- **Conocimiento**: llega del backend en una Carga (ADR-012), es de solo lectura en el teléfono y se borra al vencer (ADR-015).
- **Uso**: nace en el teléfono y nunca sale de él (PA-08); también se borra al vencer.
- **Instalación**: los modelos que trae el APK (ADR-013); no se borran al vencer.

Estas abstracciones viven en `src/dominio/` (entidades de Clean Architecture, ADR-008).

Diagrama: [diagramas/01-logica.puml](../diagramas/01-logica.puml)

## 2. Catálogo de elementos

| Entidad | Paquete | Qué representa | Atributos clave | Regla del negocio |
|---------|---------|----------------|-----------------|-------------------|
| Carga | Conocimiento | Una actualización de la información | estado, cargado en, expira en, modelo de embedding, dimensiones, total de documentos y fragmentos | Hay como máximo una Carga activa. `expira en = cargado en + 24 h` (RN-02). Solo con estado `vigente` y `ahora < expira en` se puede consultar |
| Documento | Conocimiento | Una versión de un PDF vectorizado en el backend | id del backend, nombre, versión, archivo, páginas, número de fragmentos | De cada nombre se guarda solo la versión más alta (DT-09) |
| Fragmento | Conocimiento | Trozo de un documento | índice, página, texto, vector (384) | Es la unidad de recuperación (ADR-016); su vector lo calculó el backend con el mismo modelo que tiene el teléfono (ADR-014) |
| Conversacion | Uso | Una sesión de chat | inicio | Se borra al vencer la Carga |
| Mensaje | Uso | Turno del usuario o del asistente | rol, texto, banda, estado (generando, completo, detenido, error), TTFT | El texto del asistente crece mientras se genera (ADR-004). Banda MEDIA y BAJA usan los textos fijos de [prompt-sistema.md](../prompt-sistema.md) |
| Cita | Uso | Fragmento que respalda una respuesta | similitud | Todo Mensaje del asistente en banda ALTA tiene al menos una Cita (EAC-05) |
| ModeloLocal | Instalación | Modelo GGUF incluido en el APK | tipo (lenguaje, embeddings), nombre, versión, sha256, estado | No se usa hasta que su copia en el almacenamiento interno coincide con el sha256 (ADR-013) |

Objetos de valor: **Banda** (ALTA, MEDIA, BAJA, con sus umbrales), **Vigencia** (cálculo de `expira en` y de si una hora dada está dentro).

Ciclo de vida de la Carga:

| Estado | Significado | Transiciones válidas |
|--------|-------------|----------------------|
| sin_datos | No hay información (primer uso o después de vencer) | cargando |
| cargando | CU-01 está bajando y validando | vigente (éxito), sin_datos (falla y no había carga previa) |
| vigente | Hay información y no han pasado 24 h | cargando (nueva carga; si falla, vuelve a vigente con la base anterior), vencida |
| vencida | Pasaron 24 h; el chat está bloqueado, los datos aún no se han borrado | sin_datos (al borrar, con "Sí" o con "No") |

Ciclo de vida del Mensaje del asistente:

| Estado | Significado | Transiciones válidas |
|--------|-------------|----------------------|
| generando | El modelo está produciendo tokens y el texto crece en pantalla | completo, detenido, error |
| completo | Terminó la generación (o se usó un texto fijo); tiene sus citas si es banda ALTA | (final) |
| detenido | El usuario detuvo la generación; se conserva el texto parcial | (final) |
| error | Falló el modelo; se muestra qué hacer | (final) |

Ciclo de vida del ModeloLocal:

| Estado | Significado | Transiciones válidas |
|--------|-------------|----------------------|
| sin_preparar | El asset está en el APK pero no en el almacenamiento interno | preparando |
| preparando | Se copia y se verifica el sha256 | listo, error |
| listo | Se puede cargar | sin_preparar (si el archivo desaparece) |
| error | Falló la copia o el sha256 no coincide | preparando (reintento) |

## 3. Justificación

- CU-01 y ADR-012: Carga, Documento y Fragmento salen de lo que entrega el backend ([API.md](../../API.md)).
- CU-02 y ADR-016: Conversacion, Mensaje, Cita y Banda.
- CU-03, RN-02 y ADR-015: el ciclo de vida de la Carga y la Vigencia como objeto de valor del dominio, sin depender de Expo.
- RT-05 y ADR-013: ModeloLocal y su preparación.
- EAC-05 y PA-07: Cita liga cada respuesta con su documento y página.
- EAC-07: el modelo de embedding es un dato de la Carga y del ModeloLocal, no una constante escondida en un adaptador.

## 4. Comportamiento

[CU-01](../diagramas/secuencia/cu01-actualizar-informacion.puml) lleva la Carga de `sin_datos` o `vigente` a `cargando` y de ahí a `vigente`. [CU-02](../diagramas/secuencia/cu02-consultar-texto.puml) crea Mensajes y Citas. [CU-03](../diagramas/secuencia/cu03-vencer-vigencia.puml) lleva la Carga a `vencida` y luego a `sin_datos`, borrando Documentos, Fragmentos y el paquete Uso.

## 5. Vistas relacionadas

- [Datos](05-datos.md): cómo se guardan estas entidades en SQLite.
- [Desarrollo](03-desarrollo.md): estas entidades viven en `src/dominio/` y los casos de uso las usan.
- [Procesos](02-procesos.md): qué contenedor lee y escribe cada grupo.

## Diferencia con el diagrama de clases del diseño

El modelo de dominio muestra conceptos del negocio con atributos clave, sin tipos ni métodos, y lo entiende cualquier stakeholder. El diagrama de clases del diseño se hace al programar e incluye tipos de TypeScript, métodos y los puertos de `src/aplicacion/puertos/`.
