# Fase 5: Validar

Entrada: `AGENTS.md`, `docs/arquitectura.md`, `spec.md`, `plan.md`, `tasks.md` y el código de `src/`.

Produce `validacion.md` con:

```text
## Validación funcional
| Escenario | Resultado (Cumple o No cumple) | Evidencia |

## Validación de calidad
| EAC | Medida esperada | Medida obtenida | Dispositivo |

## Validación arquitectónica
- Regla de dependencia: ningún import de react, react-native, expo-* ni infraestructura/ dentro de src/dominio/.
- src/app/ solo tiene rutas y _layout.tsx.
- Cada ADR citado en el plan se ve en el código.
- Ninguna librería sin ADR que la apruebe.
- npx expo lint y npx tsc --noEmit sin errores.
- Se cumplen las convenciones de AGENTS.md.
```

Reglas:
- Un resultado por cada escenario de `spec.md`, con evidencia concreta (salida de ejecución, captura, archivo y línea).
- Las medidas de desempeño y recursos (TTFT, tokens/s, RAM) se toman en un teléfono Android real o en un emulador ARM64, con un development build; indicar cuál.
- Los escenarios offline se verifican en modo avión.
- No dar un escenario por cumplido sin evidencia.
- Si algo no coincide, informarlo; no corregirlo en esta fase.
- Al terminar, detenerse: la persona verifica la evidencia.
