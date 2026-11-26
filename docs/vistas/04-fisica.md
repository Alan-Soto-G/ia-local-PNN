# Vista física: diagrama de despliegue

> Dónde se ejecuta cada contenedor. Diagrama: [04-fisica.puml](../diagramas/04-fisica.puml). Para desarrolladores móviles y para quien prepare los teléfonos de los guías. Notación: diagrama UML de despliegue (nodos, componentes y conexiones).

## 1. Presentación principal

Todo el sistema corre en un único nodo: el teléfono Android del guía. Dentro del proceso de la app viven la App móvil y los tres motores nativos de IA. En el almacenamiento interno de la app viven la base local, los modelos y los archivos multimedia. Fuera del teléfono solo hay redes Wi-Fi que se usan antes de salir a campo, y los dos sistemas externos a los que se llega por ellas.

Diagrama: [diagramas/04-fisica.puml](../diagramas/04-fisica.puml)

## 2. Catálogo de elementos

| Nodo | Contenedores que aloja | Características | Conexiones |
|------|------------------------|-----------------|------------|
| Teléfono Android del guía | Todos los contenedores del sistema | Android 11+, ARM64 (RT-04). Referencia: 6 GB de RAM y gama media; con menos de 6 GB se usa el modelo 0.8B, con 8 GB o más se puede elegir el 4B (ADR-001, ADR-009) | Wi-Fi solo para CU-05 y CU-06 |
| Proceso de la app | App móvil (Hermes), Motor de inferencia, Transcriptor, Codificador de imagen | APK generado con EAS Build, New Architecture (ADR-011). Los motores nativos usan CPU y, si el equipo lo soporta, GPU (Vulkan u OpenCL en llama.cpp) o NNAPI (ONNX) | Puente nativo dentro del proceso |
| Almacenamiento interno de la app | Base local, carpeta `modelos/`, carpeta `media/` | Privado de la app. Presupuesto ≤ 3,5 GB en total (RT-02): APK de menos de 100 MB, modelos de 1,5 a 3 GB según el tamaño elegido, base y medios de unos 300 MB | Solo el proceso de la app |
| Motor de voz de Android | Síntesis de voz | Del sistema. Funciona sin red si las voces es-CO / es-ES / en-US están instaladas; la app avisa si no lo están (ADR-003) | App móvil a través de expo-speech |
| Wi-Fi (fuera de campo) | — | Alojamiento, oficina o centro de visitantes del parque. Las descargas grandes se bloquean con datos móviles (ADR-007) | Hugging Face Hub y Backend |
| Hugging Face Hub (externo) | Archivos de modelos | Descarga HTTPS con rango de bytes para reanudar | Teléfono |
| Backend de conocimiento (externo) | Cambios, manifest, recepción de reseñas | No definido; propio o Supabase ([qué se espera](../backend-esperado.md)) | Teléfono, JSON / HTTPS |

Tamaños aproximados que se deben medir en el dispositivo de referencia antes de fijarlos (DT-02 en [arquitectura.md](../arquitectura.md#9-riesgos-y-deuda-técnica)):

| Paquete | Tamaño aproximado |
|---------|-------------------|
| Qwen3.5-2B Q4 + mmproj | 1,5 a 2 GB |
| Qwen3.5-0.8B Q4 + mmproj | 0,6 a 0,9 GB |
| Qwen3.5-4B Q4 + mmproj | 2,8 a 3,2 GB |
| Whisper base o small cuantizado | 60 a 200 MB |
| Embeddings de texto (GGUF) | 50 a 350 MB |
| Embeddings de imagen (ONNX) | 50 a 200 MB |

## 3. Justificación

- RT-01 y EAC-02: no hay nodo de servidor en el camino de una consulta; la caja del teléfono es autosuficiente.
- RT-02 y EAC-04: el presupuesto de almacenamiento y de RAM se resuelve eligiendo el tamaño de modelo según el equipo.
- RT-04 y ADR-011: un solo tipo de nodo, Android ARM64.
- RT-05 y ADR-007: el APK no lleva modelos; la carpeta `modelos/` se llena por Wi-Fi.
- PA-08: fotos, audios y conversaciones quedan en el almacenamiento privado de la app.
- ADR-003: la voz de salida no suma tamaño ni RAM, porque es del sistema.

## 4. Comportamiento

La secuencia de [CU-01](../diagramas/secuencia/cu01-consultar-texto.puml) no sale del teléfono. La de [CU-05](../diagramas/secuencia/cu05-descargar-paquetes.puml) cruza el Wi-Fi hacia Hugging Face y la de [CU-06](../diagramas/secuencia/cu06-sincronizar.puml) hacia el backend.

## 5. Vistas relacionadas

- [Procesos](02-procesos.md): cada contenedor de esa vista aparece en un nodo de esta.
- [Contexto](../contexto.md): cada sistema externo aparece con su protocolo.
- [Datos](05-datos.md): qué hay dentro de la Base local.
