# ADR-008: Clean Architecture dentro de la app Expo

## Estado

Aceptado (2026-11-26)

## Contexto

La app combina pantallas de Expo Router con tres motores nativos de IA, SQLite y red. Las librerías de IA cambian rápido ([EAC-07](../drivers.md#eac-07-mantenibilidad-modificabilidad-del-modelo)) y no funcionan en Expo Go ni en pruebas unitarias. AGENTS.md exige que `src/app/` tenga solo rutas. Preocupación: [PA-01](../drivers.md#4-preocupaciones-arquitectónicas).

## Alternativas consideradas

- **A) Lógica en las pantallas y hooks.** Rápido al empezar, pero las pantallas quedan acopladas a llama.rn y SQLite, y cambiar de motor toca toda la UI.
- **B) Clean Architecture con puertos y adaptadores.** `src/dominio/` (reglas puras), `src/aplicacion/` (casos de uso y puertos), `src/infraestructura/` (adaptadores), `src/composicion/` (cableado) y las pantallas en `src/app/` y `src/components/`.

## Decisión

Se elige la opción B, con la estructura y la vista de usos de la [vista de desarrollo](../vistas/03-desarrollo.md).

- Regla de dependencia: pantallas → aplicacion → dominio; infraestructura → aplicacion (implementa puertos). `src/dominio/` no importa `react`, `react-native`, `expo-*` ni `src/infraestructura/`.
- Las pantallas usan los casos de uso a través de hooks y de un proveedor de React que arma `src/composicion/`.
- Un módulo por grupo de casos de uso; sin ciclos entre módulos.
- Una librería nativa nueva solo entra con un ADR que la apruebe.

## Consecuencias

### Positivas

- Cambiar de motor de IA toca un adaptador (EAC-07).
- El dominio y los casos de uso se prueban sin teléfono, con adaptadores falsos.

### Negativas y costos aceptados

- Más archivos y más indirección que una app Expo típica.

### Vistas que modifica

[Desarrollo](../vistas/03-desarrollo.md) y [Lógica](../vistas/01-logica.md) (las entidades viven en `src/dominio/`).
