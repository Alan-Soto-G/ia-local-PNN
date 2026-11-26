# Fase 4: Implementar

Entrada: `AGENTS.md`, `docs/arquitectura.md`, `spec.md`, `plan.md`, `tasks.md` y el ID de la tarea indicada (T-NN).

Reglas:
- Implementar solo la tarea T-NN. No tocar archivos que la tarea no menciona.
- Respetar la regla de dependencia: `src/dominio/` no importa `react`, `react-native`, `expo-*` ni `src/infraestructura/`.
- No agregar librerías que ningún ADR haya aprobado. Instalar siempre con `npx expo install <paquete>`.
- Antes de usar una API de Expo o React Native, leer la documentación de la versión del proyecto (`https://docs.expo.dev/versions/v58.0.0/`), no la memoria.
- No crear ni editar `android/` ni `ios/`: la configuración nativa va en `app.json` y config plugins.
- Ningún caso de uso de campo hace llamadas de red (EAC-02).
- Si hay una ambigüedad, preguntar; no resolverla por cuenta propia.
- Antes de cerrar la tarea, ejecutar `npx expo lint` y `npx tsc --noEmit` y que no den errores.
- Al terminar: marcar la casilla en `tasks.md`, listar los archivos cambiados y detenerse.

La persona lee el cambio completo, confirma con un commit que lleva el ID de la tarea en el mensaje y pide la siguiente.
