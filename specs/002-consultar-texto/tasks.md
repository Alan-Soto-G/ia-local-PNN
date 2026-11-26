# Tareas: 002 Consultar al asistente por texto

Escenarios abreviados de [spec.md](spec.md): **B** ALTA con citas, **M** MEDIA, **BJ** BAJA, **TA** tema ajeno, **TU** turno del modelo, **DT** detener, **PU** primer uso, **MN** modelo no disponible, **MI** memoria insuficiente, **EG** error al generar, **V** vigencia vencida, **SD** sin carga, **CV** conversación al volver, **E1** EAC-01, **E2** modo avión, **E4** memoria, **E4L** liberar en segundo plano, **E5** veracidad, **E6** campo, **TX** textos del chat, **E7** cambio de modelo, **PR** privacidad.

- [x] T-01 Banda
      Archivos: src/dominio/Banda.ts
      Escenarios: B, M, BJ
      Depende de: ninguna
- [x] T-02 Cita
      Archivos: src/dominio/Cita.ts
      Escenarios: B, E5
      Depende de: ninguna
- [x] T-03 Mensaje
      Archivos: src/dominio/Mensaje.ts
      Escenarios: B, M, BJ, DT, MI, EG
      Depende de: T-01, T-02
- [x] T-04 Conversación
      Archivos: src/dominio/Conversacion.ts
      Escenarios: CV
      Depende de: ninguna
- [x] T-05 ModeloLocal
      Archivos: src/dominio/ModeloLocal.ts
      Escenarios: PU, MN, E7
      Depende de: ninguna
- [x] T-06 Constantes de RAG
      Archivos: src/aplicacion/configuracion/rag.ts
      Escenarios: B, M, BJ, TU, E4L
      Depende de: ninguna
- [x] T-07 Prompt del sistema y turno
      Archivos: src/aplicacion/configuracion/prompt.ts
      Escenarios: M, BJ, TA, TU
      Depende de: T-01
- [x] T-08 Constante de modelos (lenguaje y archivos)
      Archivos: src/aplicacion/configuracion/modelos.ts
      Escenarios: PU, MN, E7
      Depende de: T-05
- [x] T-09 Textos del chat
      Archivos: src/aplicacion/configuracion/textos.ts
      Escenarios: PU, MN, MI, EG, TX
      Depende de: ninguna
- [x] T-10 Errores ModeloNoDisponible, MemoriaInsuficiente, SinCargaVigente
      Archivos: src/aplicacion/errores/ModeloNoDisponible.ts, MemoriaInsuficiente.ts, SinCargaVigente.ts
      Escenarios: MN, MI, V
      Depende de: ninguna
- [x] T-11 Puertos MotorInferencia y CodificadorTexto
      Archivos: src/aplicacion/puertos/MotorInferencia.ts, src/aplicacion/puertos/CodificadorTexto.ts
      Escenarios: B, TU, DT, E1, E7
      Depende de: ninguna
- [x] T-12 Puertos PreparadorModelos y BuscadorVectorial
      Archivos: src/aplicacion/puertos/PreparadorModelos.ts, src/aplicacion/puertos/BuscadorVectorial.ts
      Escenarios: PU, MN, B
      Depende de: T-05
- [x] T-13 Puerto RepositorioConversaciones
      Archivos: src/aplicacion/puertos/RepositorioConversaciones.ts
      Escenarios: B, CV, PR
      Depende de: T-03, T-04
- [x] T-14 Gestor de modelos completo
      Archivos: src/aplicacion/casos-uso/modelos/GestorModelos.ts
      Escenarios: PU, MN, MI, E4, E4L
      Depende de: T-08, T-10, T-11, T-12
- [x] T-15 Caso de uso Consultar al asistente
      Archivos: src/aplicacion/casos-uso/consulta/ConsultarAsistente.ts
      Escenarios: B, M, BJ, TA, TU, DT, MI, EG, V, CV, E2
      Depende de: T-06, T-07, T-13, T-14
- [x] T-16 Adaptador llama.rn: motor
      Archivos: src/infraestructura/ia/MotorLlama.ts, src/infraestructura/ia/errores-llama.ts, package.json (llama.rn), app.json (plugins llama.rn y expo-asset)
      Escenarios: B, TU, DT, MI, EG, E1
      Depende de: T-11
- [x] T-17 Adaptador llama.rn: codificador
      Archivos: src/infraestructura/ia/CodificadorLlama.ts
      Escenarios: B, MI
      Depende de: T-11
- [x] T-18 Assets de los modelos
      Archivos: src/infraestructura/ia/assets-modelos.ts, assets/modelos/*.gguf (vacíos), metro.config.js
      Escenarios: PU, MN
      Depende de: T-08
- [x] T-19 Adaptador de preparación de modelos
      Archivos: src/infraestructura/ia/PreparadorModelosExpo.ts, package.json (expo-file-system, expo-asset)
      Escenarios: PU, MN
      Depende de: T-12, T-18
- [x] T-20 Buscador vectorial SQLite
      Archivos: src/infraestructura/persistencia/BuscadorVectorialSqlite.ts
      Escenarios: B, M, BJ, E2
      Depende de: T-12
- [x] T-21 Repositorio de conversaciones SQLite
      Archivos: src/infraestructura/persistencia/RepositorioConversacionesSqlite.ts, package.json (expo-crypto)
      Escenarios: B, CV, PR
      Depende de: T-13
- [x] T-22 Contenedor
      Archivos: src/composicion/contenedor.ts
      Escenarios: B
      Depende de: T-14 a T-21
- [x] T-23 Hook de modelos
      Archivos: src/hooks/use-modelos.ts
      Escenarios: PU, MN, E4L
      Depende de: T-22
- [x] T-24 Hook de chat
      Archivos: src/hooks/use-chat.ts
      Escenarios: B, M, BJ, DT, MI, EG, V, CV, E1
      Depende de: T-22
- [x] T-25 Componente CitaFuente
      Archivos: src/components/cita-fuente.tsx
      Escenarios: B, E5
      Depende de: ninguna
- [x] T-26 Componente BurbujaMensaje
      Archivos: src/components/burbuja-mensaje.tsx
      Escenarios: B, M, BJ, DT, MI, EG, E6
      Depende de: T-25
- [x] T-27 Componente BarraPregunta
      Archivos: src/components/barra-pregunta.tsx
      Escenarios: DT, TX, E6
      Depende de: ninguna
- [x] T-28 Componente PreparandoAsistente
      Archivos: src/components/preparando-asistente.tsx
      Escenarios: PU, MN
      Depende de: ninguna
- [x] T-29 Letrero de vigencia compacto
      Archivos: src/components/letrero-vigencia.tsx
      Escenarios: E6
      Depende de: ninguna
- [x] T-30 Pantalla de chat
      Archivos: src/app/chat.tsx
      Escenarios: B, M, BJ, DT, PU, MN, V, CV, E6, TX
      Depende de: T-23, T-24, T-26 a T-29
- [x] T-31 Acceso al chat desde Inicio
      Archivos: src/app/index.tsx
      Escenarios: SD, TX
      Depende de: T-30
- [x] T-32 Pruebas de lógica con adaptadores falsos
      Archivos: pruebas/002-consultar-texto.test.ts, pruebas/001-actualizar-informacion.test.ts (constructor del Gestor)
      Escenarios: B, M, BJ, TU, DT, MN, MI, EG, V, CV, E7
      Depende de: T-15
- [x] T-33 Validación
      Archivos: specs/002-consultar-texto/validacion.md
      Escenarios: todos
      Depende de: T-01 a T-32
