# Vista física: diagrama de despliegue

> Dónde se ejecuta cada contenedor. Diagrama: [04-fisica.puml](../diagramas/04-fisica.puml). Para desarrolladores móviles y para quien prepare el computador administrador. Notación: diagrama UML de despliegue (nodos, componentes y conexiones).

## 1. Presentación principal

La app corre en un único nodo: el teléfono Android del visitante o del guía. Dentro del proceso de la app viven la App móvil y el motor nativo llama.rn. En el almacenamiento interno de la app viven la base local y la copia de los modelos. Fuera del teléfono está el computador administrador, al que solo se llega conectándose a su punto de acceso Wi-Fi, sin Internet, antes del recorrido.

Diagrama: [diagramas/04-fisica.puml](../diagramas/04-fisica.puml)

## 2. Catálogo de elementos

| Nodo | Contenedores que aloja | Características | Conexiones |
|------|------------------------|-----------------|------------|
| Teléfono Android | Todos los contenedores de la app | Android 11+, ARM64 (RT-04). Referencia: gama media (DT-08) | Wi-Fi hacia el punto de acceso, solo en CU-01 |
| Proceso de la app | App móvil (Hermes) y Motor de inferencia | APK generado con EAS Build, New Architecture (ADR-011). llama.cpp usa CPU y, si el equipo lo soporta, GPU | Puente nativo dentro del proceso |
| Almacenamiento interno de la app | Base local, carpeta `modelos/` | Privado de la app. Unos 0,5 GB de modelos copiados (más los del APK) y unos pocos MB de base | Solo el proceso de la app |
| Servicios de Android | Notificaciones e instalador de paquetes | Del sistema; funcionan sin red (ADR-015) | App móvil |
| Computador administrador (externo) | Backend RAG: FastAPI + SQLite + sqlite-vec ([API.md](../../API.md)) | Windows con "Zona con cobertura inalámbrica móvil" activa; IP fija `192.168.137.1`, puerto 8000; escucha solo en `127.0.0.1` y en la IP del punto de acceso | Teléfonos conectados a su punto de acceso, HTTP |
| Red del punto de acceso | — | Wi-Fi local generado por el computador; no requiere Internet. Resuelve `rag.home.arpa` y `<equipo>.mshome.net` | Teléfono ↔ computador |

Tamaños aproximados que se deben medir antes de fijarlos (DT-02 y DT-03 en [arquitectura.md](../arquitectura.md#9-riesgos-y-deuda-técnica)):

| Elemento | Tamaño aproximado |
|----------|-------------------|
| LFM2.5-350M en GGUF (Q4_K_M a Q8_0) | 0,25 a 0,4 GB |
| paraphrase-multilingual-MiniLM-L12-v2 en GGUF (Q8_0 a F16) | 0,12 a 0,24 GB |
| APK total (código + modelos) | 0,4 a 0,7 GB |
| RAM de la app con los dos modelos cargados | menos de 1,5 GB (EAC-04) |
| Base local (unos pocos PDF) | 1 a 20 MB |

## 3. Justificación

- RT-01 y EAC-02: no hay nodo de servidor en el camino de una consulta; el teléfono es autosuficiente.
- RT-02 y EAC-04: los modelos elegidos quedan muy por debajo de 3,5 GB y 4 GB.
- RT-04 y ADR-011: un solo tipo de nodo móvil, Android ARM64.
- RT-05 y ADR-013: el APK trae los modelos; solo el conocimiento viaja por la red del punto de acceso.
- ADR-012: la red del punto de acceso no tiene TLS; la app permite HTTP solo hacia el backend.
- PA-08: nada del usuario viaja al computador.

## 4. Comportamiento

La secuencia de [CU-01](../diagramas/secuencia/cu01-actualizar-informacion.puml) cruza la red del punto de acceso hacia el computador administrador. Las de [CU-02](../diagramas/secuencia/cu02-consultar-texto.puml) y [CU-03](../diagramas/secuencia/cu03-vencer-vigencia.puml) no salen del teléfono.

## 5. Vistas relacionadas

- [Procesos](02-procesos.md): cada contenedor de esa vista aparece en un nodo de esta.
- [Contexto](../contexto.md): cada sistema externo aparece con su protocolo.
- [Datos](05-datos.md): qué hay dentro de la Base local.
