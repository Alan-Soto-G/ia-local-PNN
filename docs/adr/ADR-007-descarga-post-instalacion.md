# ADR-007: Descarga de modelos y paquetes después de instalar, guiada por un manifest

## Estado

Aceptado (2026-11-26)

## Contexto

Los modelos suman entre 1 y 3,5 GB ([RT-02](../drivers.md#3-restricciones)). El APK no debe incluirlos ([RT-05](../drivers.md#3-restricciones)): se descargan después de instalar, por Wi-Fi y antes de salir a campo (S-02). Las redes de alojamientos y oficinas del parque son inestables ([EAC-03](../drivers.md#eac-03-fiabilidad-recuperabilidad-de-descargas-y-sincronización)). Además, el modelo debe poder cambiarse sin publicar otro APK ([EAC-07](../drivers.md#eac-07-mantenibilidad-modificabilidad-del-modelo)). Caso de uso: CU-05.

## Alternativas consideradas

- **A) Modelos dentro del APK.** Funciona desde la instalación, pero el APK pasa de 2 GB, cada cambio de modelo exige una versión nueva e incumple RT-05.
- **B) URLs de modelos escritas en el código.** Simple, pero cambiar de modelo exige un APK nuevo.
- **C) Manifest + descargas reanudables verificadas.** Un manifest (JSON) lista cada paquete: tipo, nombre, versión, URL de cada archivo, tamaño, sha256 y RAM mínima. La app lo obtiene del backend cuando hay conexión, lo guarda y descarga lo elegido.

## Decisión

Se elige la opción C.

- Paquetes del manifest: modelo de lenguaje + mmproj (por tamaño), transcriptor, embeddings de texto, embeddings de imagen y paquete inicial de conocimiento (un volcado de la base para no depender de una primera sincronización larga).
- Los archivos de modelos se descargan directamente de Hugging Face (u otra URL que diga el manifest), con peticiones por rango de bytes para reanudar.
- Solo con Wi-Fi (expo-network) y con espacio libre suficiente, comprobado antes de empezar.
- Se verifica el sha256 de cada archivo (expo-crypto) antes de marcarlo "listo". Un archivo corrupto se borra y se vuelve a descargar.
- Los archivos van al almacenamiento interno de la app (expo-file-system), en `modelos/`.
- Mientras no haya modelo, el chat muestra qué descargar; las rutas y fichas ya sincronizadas siguen disponibles.
- Si el backend no está disponible, la app trae un manifest por defecto como constante versionada, para poder empezar.

## Consecuencias

### Positivas

- APK liviano; el modelo se cambia publicando un manifest nuevo.
- Las descargas se retoman y nunca se usa un archivo corrupto (EAC-03).

### Negativas y costos aceptados

- La primera experiencia exige Wi-Fi y unos minutos de espera; hay que comunicarlo bien en la pantalla de bienvenida.
- Se depende de la disponibilidad de Hugging Face al descargar.

### Vistas que modifica

[Lógica](../vistas/01-logica.md) (ciclo de vida del PaqueteModelo), [Procesos](../vistas/02-procesos.md), [Física](../vistas/04-fisica.md) y la secuencia [CU-05](../diagramas/secuencia/cu05-descargar-paquetes.puml).
