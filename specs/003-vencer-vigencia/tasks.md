# Tareas: 003 Vencer la vigencia

Escenarios abreviados de [spec.md](spec.md): **B** aviso y diálogo, **NO** elige "No", **SI** elige "Sí" y confirma, **SC** "Sí" y cancela, **CA** vence con el chat abierto, **SP** sin permiso de notificaciones, **NC** carga nueva antes de vencer, **AT** "atrás", **E8a** 0 consultas, **E8b** aviso a ±1 min, **AE** sin alarma exacta, **E8c** 0 filas tras "No", **E8d** diálogo del sistema tras "Sí", **E2** sin red, **PR** privacidad.

- [x] T-01 Puerto Desinstalador
      Archivos: src/aplicacion/puertos/Desinstalador.ts
      Escenarios: SI, SC, E8d
      Depende de: ninguna
- [x] T-02 Notificador: aviso tocado
      Archivos: src/aplicacion/puertos/Notificador.ts
      Escenarios: B
      Depende de: ninguna
- [x] T-03 Textos del diálogo
      Archivos: src/aplicacion/configuracion/textos.ts
      Escenarios: B
      Depende de: ninguna
- [x] T-04 Módulo Vigencia: vencer
      Archivos: src/aplicacion/casos-uso/vigencia/ModuloVigencia.ts
      Escenarios: NO, SI, SC, AT, E8c, E8d, PR
      Depende de: T-01, T-02
- [x] T-05 Adaptador de desinstalación
      Archivos: src/infraestructura/sistema/DesinstaladorAndroid.ts, package.json (expo-intent-launcher)
      Escenarios: SI, SC, E8d
      Depende de: T-01
- [x] T-06 Adaptador de notificaciones: alarma exacta y aviso tocado
      Archivos: src/infraestructura/sistema/NotificadorExpo.ts
      Escenarios: B, E8b, AE
      Depende de: T-02
- [x] T-07 Configuración de la app
      Archivos: app.json
      Escenarios: E8b, E8d
      Depende de: T-05, T-06
- [x] T-08 Contenedor
      Archivos: src/composicion/contenedor.ts
      Escenarios: B, NO, SI
      Depende de: T-04, T-05, T-06
- [x] T-09 Hook vigilante del vencimiento
      Archivos: src/hooks/use-vigilante-vencimiento.ts
      Escenarios: B, CA, SP, NC
      Depende de: T-08
- [x] T-10 Hook del diálogo
      Archivos: src/hooks/use-vencimiento.ts
      Escenarios: NO, SI, SC, AT
      Depende de: T-08
- [x] T-11 Variante de peligro del botón
      Archivos: src/components/boton-grande.tsx
      Escenarios: SI
      Depende de: ninguna
- [x] T-12 Componente DialogoVencimiento
      Archivos: src/components/dialogo-vencimiento.tsx, src/constants/theme.ts (tokens de noche)
      Escenarios: B, NO, SI
      Depende de: T-11
- [x] T-13 Pantalla de vencimiento
      Archivos: src/app/vencimiento.tsx
      Escenarios: B, NO, SI, SC, AT
      Depende de: T-10, T-12
- [x] T-14 Layout raíz con el vigilante
      Archivos: src/app/_layout.tsx, src/components/vigilante-vencimiento.tsx, src/hooks/use-vigencia.ts (relee al ganar foco)
      Escenarios: B, CA, SP
      Depende de: T-09, T-13
- [x] T-15 Chat: ir al diálogo al vencer
      Archivos: src/app/chat.tsx
      Escenarios: CA
      Depende de: T-13
- [x] T-16 Pruebas de lógica con adaptadores falsos
      Archivos: pruebas/003-vencer-vigencia.test.ts, pruebas/001-actualizar-informacion.test.ts, pruebas/002-consultar-texto.test.ts (constructor del Módulo Vigencia)
      Escenarios: NO, SI, SC, AT, NC, E8a, E8c, E8d, E2, PR
      Depende de: T-04
- [x] T-17 Validación
      Archivos: specs/003-vencer-vigencia/validacion.md
      Escenarios: todos
      Depende de: T-01 a T-16
