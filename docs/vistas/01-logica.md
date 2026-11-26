# Vista lógica: modelo de dominio

> Las abstracciones clave del Asistente de interpretación ambiental. Diagrama: [01-logica.puml](../diagramas/01-logica.puml). Para usuarios finales, biólogos y analistas. Notación: UML (C4 no tiene un diagrama para esta vista). El modelo físico de tablas está en la [vista de datos](05-datos.md).

## 1. Presentación principal

Muestra los conceptos del negocio y cómo se relacionan, no las clases del código. Son pocas clases, solo con sus atributos clave, sin métodos ni tipos. Se agrupan en tres paquetes según de dónde vienen los datos:

- **Conocimiento**: lo valida el biólogo en el backend y llega al teléfono por sincronización (ADR-006). En el teléfono es de solo lectura.
- **Uso en campo**: nace y muere en el teléfono; nunca sale de él (PA-08).
- **Retroalimentación**: nace en el teléfono y se sube cuando hay conexión (OB-02).

Estas abstracciones viven en `src/dominio/` (entidades de Clean Architecture, ADR-008).

Diagrama: [diagramas/01-logica.puml](../diagramas/01-logica.puml)

## 2. Catálogo de elementos

| Entidad | Qué representa | Atributos clave | Regla del negocio |
|---------|----------------|-----------------|-------------------|
| GrupoTaxonomico | Clase, orden o familia (aves, mamíferos, asteráceas…) | rango, nombre | Jerárquico: cada grupo puede tener un padre |
| Especie | Animal, planta u hongo del parque | nombre científico, nombres comunes es/en, grupo, estado de conservación, endémica, rango altitudinal, descripción | Solo existen especies validadas (RN-01); toda especie se sustenta en al menos un DocumentoFuente |
| FichaFauna | Datos propios de los animales | dieta, comportamiento, actividad (diurna, nocturna) | Solo para especies de fauna; una por especie |
| FichaFlora | Datos propios de las plantas | forma de crecimiento, floración | Solo para especies de flora; una por especie |
| ImagenEspecie | Foto de referencia de una especie | descripción, autor, licencia, modelo de embedding, vector | El vector lo calcula el backend con el mismo modelo que tiene el teléfono (ADR-002); si cambia el modelo, el vector se recalcula |
| Ecosistema | Bosque altoandino, páramo, superpáramo, glaciar, humedal | nombre, piso altitudinal | Relaciona especies y rutas |
| Ruta | Recorrido del parque | nombre, tipo (sendero, alta montaña, ciclomontañismo, cicloturismo, vehicular), sector, dificultad, distancia, altitud mínima y máxima, estado (abierta o cerrada) | Una ruta cerrada se muestra, pero se avisa que no está habilitada |
| PuntoInteres | Mirador, laguna, glaciar, refugio, punto de control | nombre, tipo, ubicación y altitud, orden | Pertenece a una ruta y tiene un orden dentro de ella |
| PresenciaEnRuta | Qué especie se ve en qué ruta | frecuencia (común, ocasional, rara), temporada | Responde "qué animales y plantas hay en esta ruta"; puede ubicarse cerca de un PuntoInteres |
| DocumentoFuente | PDF que es fuente de verdad (plan de manejo, guía de campo, normativa) | título, entidad, año, tipo, validado por | Solo se distribuye si un especialista lo validó (RN-01) |
| FragmentoDocumento | Trozo de un PDF que el asistente puede citar | página, texto, vector | Es la unidad de recuperación del RAG (ADR-010) |
| Protocolo | Regla de mínimo impacto o de seguridad | tipo, texto | Siempre se prioriza en respuestas sobre comportamiento en el parque |
| Conversacion | Una sesión de chat | inicio, perfil del público (infantil, general, especializado), idioma | Solo local; el usuario puede borrarla (CU-12) |
| Mensaje | Turno del usuario o del asistente | rol, texto, adjunto (foto o audio), estado (generando, completo, detenido, error) | La foto y el audio quedan en el teléfono; el texto del asistente crece mientras se genera (ADR-004) |
| Cita | Fuente que respalda una respuesta | similitud | Un mensaje del asistente sobre una especie del catálogo debe tener al menos una Cita (EAC-05) |
| PaqueteModelo | Modelo o paquete descargable | tipo (lenguaje, proyector de visión, voz, embeddings de texto, embeddings de imagen), versión, tamaño, sha256, estado de descarga | No se usa hasta que su sha256 coincide con el manifest (ADR-007) |
| Resena | Opinión sobre la experiencia y el asistente | calificación de utilidad, comprensión, rendimiento percibido, comentario, métricas del dispositivo (con consentimiento), estado de envío | Se crea sin conexión y se envía una sola vez (idempotente, ADR-006) |

Ciclo de vida del Mensaje del asistente:

| Estado | Significado | Transiciones válidas |
|--------|-------------|----------------------|
| generando | El modelo está produciendo tokens y el texto crece en pantalla | completo, detenido, error |
| completo | Terminó la generación; tiene sus citas | (final) |
| detenido | El usuario detuvo la generación; se conserva el texto parcial | (final) |
| error | Falló el modelo (memoria, modelo ausente); se muestra qué hacer | (final) |

Ciclo de vida del PaqueteModelo:

| Estado | Significado | Transiciones válidas |
|--------|-------------|----------------------|
| disponible | Está en el manifest y no se ha descargado | descargando |
| descargando | Se está bajando por Wi-Fi | pausado, verificando |
| pausado | Se cortó la red o el usuario pausó; conserva lo descargado | descargando |
| verificando | Se calcula el sha256 | listo, corrupto |
| listo | Se puede cargar | obsoleto |
| corrupto | El hash no coincide; se borra y vuelve a disponible | disponible |
| obsoleto | Hay una versión nueva en el manifest | disponible (la nueva) |

## 3. Justificación

- CU-01, CU-02 y CU-03: de ellos salen Conversacion, Mensaje y Cita.
- CU-02 y ADR-002: ImagenEspecie lleva el vector y el modelo de embedding con el que se calculó.
- CU-05 y ADR-007: PaqueteModelo y su ciclo de vida cubren EAC-03.
- CU-06, CU-10 y ADR-006: el paquete Retroalimentación es lo único que sale del teléfono (PA-08).
- CU-08: Ruta, PuntoInteres y PresenciaEnRuta modelan los recorridos del PNN Los Nevados, incluidas las rutas para ciclistas.
- EAC-05, RN-01 y ADR-010: DocumentoFuente, FragmentoDocumento y Cita hacen que cada respuesta sea trazable a una fuente validada.
- EAC-07: el modelo de embedding es un dato de ImagenEspecie y de PaqueteModelo, no una constante del código.

## 4. Comportamiento

[CU-01](../diagramas/secuencia/cu01-consultar-texto.puml) crea un Mensaje en estado "generando" y lo lleva a "completo" con sus Citas. [CU-02](../diagramas/secuencia/cu02-identificar-foto.puml) compara la foto contra ImagenEspecie. [CU-05](../diagramas/secuencia/cu05-descargar-paquetes.puml) recorre el ciclo de vida del PaqueteModelo. [CU-06](../diagramas/secuencia/cu06-sincronizar.puml) actualiza el paquete Conocimiento y envía las Resenas pendientes.

## 5. Vistas relacionadas

- [Datos](05-datos.md): cómo se guardan estas entidades en SQLite y en PostgreSQL.
- [Desarrollo](03-desarrollo.md): estas entidades viven en `src/dominio/` y los casos de uso las usan.
- [Procesos](02-procesos.md): qué contenedor lee y escribe cada grupo.

## Diferencia con el diagrama de clases del diseño

El modelo de dominio muestra conceptos del negocio con atributos clave, sin tipos ni métodos, y lo entiende cualquier stakeholder, incluido el biólogo. El diagrama de clases del diseño se hace al programar e incluye tipos de TypeScript, métodos y los puertos de `src/aplicacion/puertos/`.
