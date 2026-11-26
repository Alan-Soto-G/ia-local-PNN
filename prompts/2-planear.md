# Fase 2: Planear

Entrada: `AGENTS.md`, `docs/arquitectura.md`, `docs/vistas/03-desarrollo.md` y el `spec.md` de la funcionalidad indicada.

Produce `plan.md` con estas secciones:

```text
# Plan: NNN <nombre>
## Decisiones que aplican   (ADR y vistas, con su ID)
## Componentes              (rutas de archivos en src/ según vistas/03-desarrollo.md)
## Pantallas                (rutas de src/app/ y componentes de src/components/)
## Flujo                    (diagrama de secuencia de docs/diagramas/secuencia/)
## Fuera de alcance
```

Reglas:
- Si `spec.md` todavía tiene marcas `[NECESITA ACLARACIÓN]`, no planear: avisar y detenerse.
- El plan no rehace la arquitectura: la aterriza en la funcionalidad.
- No inventar componentes, puertos ni módulos que no estén en las vistas.
- Si el plan necesita una librería que ningún ADR aprueba, o una decisión que no existe, detenerse: primero se escribe el ADR.
- Si el plan agrega una librería con código nativo, indicarlo: hace falta un development build nuevo (ADR-011).
- Al terminar, detenerse y esperar revisión de la persona.
