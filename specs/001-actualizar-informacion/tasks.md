# Tareas: 001 Actualizar información

Escenarios abreviados de [spec.md](spec.md): **B** flujo básico, **PR** progreso, **NV** nueva carga vigente, **SB** sin backend, **NL** backend no listo, **ST** sin tablas, **MI** modelo incompatible, **SD** sin documentos, **CC** corte de conexión, **CS** incompleta sin datos previos, **DI** datos inconsistentes, **CA** app cerrada en la escritura, **PN** permiso de notificaciones, **E3a** 10 cortes, **E3b** ≤ 5 s, **E2** red solo al actualizar, **E6** uso en campo, **E7** modelo declarado en el APK.

- [x] T-01 Estado de la carga
      Archivos: src/dominio/EstadoCarga.ts
      Escenarios: B, CS
      Depende de: ninguna
- [x] T-02 Vigencia (objeto de valor)
      Archivos: src/dominio/Vigencia.ts
      Escenarios: B, NV
      Depende de: ninguna
- [x] T-03 Carga
      Archivos: src/dominio/Carga.ts
      Escenarios: B, NV, CS
      Depende de: T-01, T-02
- [x] T-04 Documento y regla de versión más alta
      Archivos: src/dominio/Documento.ts
      Escenarios: B
      Depende de: ninguna
- [x] T-05 Fragmento
      Archivos: src/dominio/Fragmento.ts
      Escenarios: B, DI
      Depende de: ninguna
- [x] T-06 Constante de modelos
      Archivos: src/aplicacion/configuracion/modelos.ts
      Escenarios: MI, E7
      Depende de: ninguna
- [x] T-07 Constantes de carga (5 s, 30 s, 24 h)
      Archivos: src/aplicacion/configuracion/carga.ts
      Escenarios: SB, CC, E3b, B
      Depende de: ninguna
- [x] T-08 Textos de pantalla y notificación
      Archivos: src/aplicacion/configuracion/textos.ts
      Escenarios: B, PR, SB, NL, ST, MI, SD, CC, CS, PN
      Depende de: ninguna
- [x] T-09 Errores de aplicación
      Archivos: src/aplicacion/errores/ErrorAplicacion.ts, BackendNoDisponible.ts, ModeloEmbeddingIncompatible.ts, SinDocumentosEnBackend.ts, CargaIncompleta.ts (una clase por archivo)
      Escenarios: SB, NL, ST, MI, SD, CC, CS, DI
      Depende de: ninguna
- [x] T-10 Puerto ClienteBackend
      Archivos: src/aplicacion/puertos/ClienteBackend.ts
      Escenarios: B, SB, ST, SD
      Depende de: T-04, T-05
- [x] T-11 Puerto RepositorioConocimiento
      Archivos: src/aplicacion/puertos/RepositorioConocimiento.ts
      Escenarios: B, NV, CC, CA
      Depende de: T-03, T-04, T-05
- [x] T-12 Puertos Reloj y Notificador
      Archivos: src/aplicacion/puertos/Reloj.ts, src/aplicacion/puertos/Notificador.ts
      Escenarios: B, NV, PN
      Depende de: ninguna
- [x] T-13 Gestor de modelos (modelo de embeddings esperado)
      Archivos: src/aplicacion/casos-uso/modelos/GestorModelos.ts
      Escenarios: MI, E7
      Depende de: T-06
- [x] T-14 Módulo Vigencia (estado e iniciar)
      Archivos: src/aplicacion/casos-uso/vigencia/ModuloVigencia.ts
      Escenarios: B, NV, CC
      Depende de: T-03, T-11, T-12
- [x] T-15 Caso de uso Actualizar información
      Archivos: src/aplicacion/casos-uso/actualizacion/ActualizarInformacion.ts
      Escenarios: B, PR, NV, SB, NL, ST, MI, SD, CC, CS, DI, E3a
      Depende de: T-09, T-10, T-11, T-13, T-14
- [x] T-16 Adaptador HTTP del backend
      Archivos: src/infraestructura/red/ClienteBackendHttp.ts
      Escenarios: SB, NL, ST, CC, E3b, E2
      Depende de: T-07, T-09, T-10
- [x] T-17 Migraciones del esquema
      Archivos: src/infraestructura/persistencia/migraciones.ts
      Escenarios: B, CA
      Depende de: ninguna
- [x] T-18 Base local (sqlite-vec)
      Archivos: src/infraestructura/persistencia/BaseLocal.ts, package.json (expo-sqlite)
      Escenarios: B, CA
      Depende de: T-17
- [x] T-19 Adaptador SQLite de conocimiento
      Archivos: src/infraestructura/persistencia/RepositorioConocimientoSqlite.ts
      Escenarios: B, NV, CC, CA, E3a
      Depende de: T-11, T-18
- [x] T-20 Reloj del sistema
      Archivos: src/infraestructura/sistema/RelojSistema.ts
      Escenarios: B
      Depende de: T-12
- [x] T-21 Adaptador de notificaciones
      Archivos: src/infraestructura/sistema/NotificadorExpo.ts, package.json (expo-notifications)
      Escenarios: B, NV, PN
      Depende de: T-08, T-12
- [x] T-22 Config plugin de red local y ARM64
      Archivos: plugins/with-red-local-android.js
      Escenarios: SB, E2
      Depende de: ninguna
- [x] T-23 Configuración de la app
      Archivos: app.json
      Escenarios: B, E2, E6
      Depende de: T-18, T-21, T-22
- [x] T-24 Contenedor de dependencias
      Archivos: src/composicion/contenedor.ts
      Escenarios: B
      Depende de: T-15, T-16, T-19, T-20, T-21
- [x] T-25 Proveedor de dependencias
      Archivos: src/composicion/ProveedorDependencias.tsx
      Escenarios: B
      Depende de: T-24
- [x] T-26 Hook de vigencia
      Archivos: src/hooks/use-vigencia.ts
      Escenarios: B, NV, E6
      Depende de: T-25
- [x] T-27 Hook de actualización
      Archivos: src/hooks/use-actualizacion.ts
      Escenarios: B, PR, SB, NL, ST, MI, SD, CC, CS, PN
      Depende de: T-25
- [x] T-28 Tema páramo
      Archivos: src/constants/theme.ts
      Escenarios: E6
      Depende de: ninguna
- [x] T-29 Componente Cordillera
      Archivos: src/components/cordillera.tsx
      Escenarios: E6
      Depende de: T-28
- [x] T-30 Componente BotonGrande
      Archivos: src/components/boton-grande.tsx
      Escenarios: B, PR, E6
      Depende de: T-28
- [x] T-31 Componente LetreroVigencia
      Archivos: src/components/letrero-vigencia.tsx
      Escenarios: B, E6
      Depende de: T-28
- [x] T-32 Componente ProgresoCarga
      Archivos: src/components/progreso-carga.tsx
      Escenarios: PR
      Depende de: T-28
- [x] T-33 Componente AvisoEstado
      Archivos: src/components/aviso-estado.tsx
      Escenarios: B, SB, NL, ST, MI, SD, CC, CS
      Depende de: T-28
- [x] T-34 Componente ExplicacionPermiso
      Archivos: src/components/explicacion-permiso.tsx
      Escenarios: PN
      Depende de: T-30
- [x] T-35 Layout raíz y limpieza de la plantilla
      Archivos: src/app/_layout.tsx; se borran src/app/explore.tsx, plantilla de src/components/, src/hooks/use-color-scheme*.ts, src/hooks/use-theme.ts, src/global.css
      Escenarios: B
      Depende de: T-25, T-28
- [x] T-36 Pantalla de Inicio
      Archivos: src/app/index.tsx
      Escenarios: B, PR, NV, SB, NL, ST, MI, SD, CC, CS, PN, E6
      Depende de: T-26, T-27, T-29 a T-35
- [x] T-37 Pruebas de lógica con adaptadores falsos
      Archivos: pruebas/001-actualizar-informacion.test.ts, pruebas/tsconfig.json, .gitignore, tsconfig.json (excluye pruebas/)
      Escenarios: B, NV, SB, NL, ST, MI, SD, CC, CS, DI, E3a, E7
      Depende de: T-15
- [x] T-38 Validación
      Archivos: specs/001-actualizar-informacion/validacion.md
      Escenarios: todos
      Depende de: T-01 a T-37
