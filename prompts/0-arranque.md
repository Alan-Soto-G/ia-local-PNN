# Mensaje de arranque

Se copia al inicio de cada sesión. Conviene una sesión nueva por fase o por tarea: en conversaciones largas el agente olvida lo que leyó al inicio.

```text
Antes de hacer cualquier cosa, lee estos archivos:
1. AGENTS.md
2. docs/arquitectura.md
3. docs/vistas/03-desarrollo.md

Resume en tres líneas las reglas que vas a respetar.

Después ejecuta prompts/1-especificar.md para specs/001-actualizar-informacion/ y detente al terminar.
```

Para otra fase o funcionalidad se cambia solo la última línea: el archivo de `prompts/` y la carpeta de `specs/`. El número de la carpeta es el del caso de uso en el catálogo de `docs/drivers.md` (CU-01 → `001`).

Orden de la versión 1: `specs/001-actualizar-informacion/` (CU-01), `specs/002-consultar-texto/` (CU-02) y `specs/003-vencer-vigencia/` (CU-03). Cada uno pasa por las fases 1 a 5 antes de empezar el siguiente.
