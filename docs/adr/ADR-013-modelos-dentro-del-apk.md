# ADR-013: Modelos de IA empaquetados dentro del APK

## Estado

Aceptado (2026-11-26). Reemplaza a [ADR-007](ADR-007-descarga-post-instalacion.md) y a la restricción RT-05 original.

## Contexto

ADR-007 descargaba los modelos (varios GB) desde Hugging Face después de instalar. Con el cambio de modelos (ADR-014) el conjunto es pequeño: LFM2.5-350M y paraphrase-multilingual-MiniLM-L12-v2 suman unos 0,4 a 0,5 GB cuantizados. Además, el visitante puede no tener Internet nunca: solo el punto de acceso del computador administrador, que no sirve modelos ([API.md](../../API.md)). Drivers: RT-01, RT-02, RT-05 (nueva redacción), EAC-02, EAC-07.

## Alternativas consideradas

- **A) Descargar de Hugging Face (ADR-007).** Exige Internet al menos una vez; el visitante puede no tenerlo.
- **B) Servirlos desde el computador administrador.** El backend no tiene ese endpoint; habría que construirlo y mantener un manifest.
- **C) Dentro del APK.** Los archivos GGUF viajan como assets del APK.

## Decisión

Se elige la opción C.

- Los dos GGUF (LFM2.5-350M y MiniLM, ADR-014) se incluyen como assets del APK, con su sha256 y versión declarados en una constante versionada del código.
- llama.rn necesita una ruta de archivo: en el primer arranque (o si el archivo falta o su tamaño no coincide), el Gestor de modelos copia cada asset al almacenamiento interno de la app y verifica su sha256 antes de usarlo. Durante la copia la pantalla muestra "Preparando el asistente…".
- El APK se compila solo para `arm64-v8a` (ADR-011).
- Cambiar de modelo implica publicar un APK nuevo; el cambio toca solo los assets, el adaptador y la constante, no `dominio/` ni `aplicacion/` (EAC-07).
- Al vencer la vigencia (ADR-015) los modelos **no** se borran: son parte de la instalación.

## Consecuencias

### Positivas

- La app funciona sin Internet desde el primer minuto; solo necesita el punto de acceso para cargar los documentos.
- Desaparecen el manifest, el gestor de descargas reanudables y su ciclo de vida.

### Negativas y costos aceptados

- APK de unos 0,5 GB (a medir, DT-03); se distribuye por instalación directa, no por una tienda con límite de tamaño.
- El primer arranque ocupa el doble de espacio por un momento (asset + copia) y tarda unos segundos.
- Actualizar el modelo requiere reinstalar.

### Vistas que modifica

[Lógica](../vistas/01-logica.md) (ModeloLocal), [Desarrollo](../vistas/03-desarrollo.md) (Gestor de modelos, adaptador de preparación de modelos), [Física](../vistas/04-fisica.md) (tamaños).
