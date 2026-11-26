/**
 * Esquema de la base local (vista de datos, ADR-012). Cada migración sube
 * `PRAGMA user_version` en uno. La primera crea el esquema completo de la
 * versión 1, incluidas las tablas de uso que llena CU-02.
 */
export const MIGRACIONES: readonly string[] = [
  `
  CREATE TABLE IF NOT EXISTS carga (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    estado TEXT NOT NULL CHECK (estado IN ('sin_datos', 'vigente', 'vencida')),
    cargado_en TEXT,
    expira_en TEXT,
    modelo_embedding TEXT,
    dimensiones INTEGER,
    total_documentos INTEGER NOT NULL DEFAULT 0,
    total_fragmentos INTEGER NOT NULL DEFAULT 0,
    url_backend TEXT
  );
  INSERT OR IGNORE INTO carga (id, estado) VALUES (1, 'sin_datos');

  CREATE TABLE IF NOT EXISTS documento (
    id INTEGER PRIMARY KEY,
    nombre TEXT NOT NULL,
    version INTEGER NOT NULL,
    archivo TEXT NOT NULL,
    paginas INTEGER NOT NULL,
    num_fragmentos INTEGER NOT NULL,
    sha256 TEXT NOT NULL,
    creado_en TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS fragmento (
    id INTEGER PRIMARY KEY,
    documento_id INTEGER NOT NULL REFERENCES documento (id),
    indice INTEGER NOT NULL,
    pagina INTEGER NOT NULL,
    texto TEXT NOT NULL,
    caracteres INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS fragmento_documento ON fragmento (documento_id);

  CREATE VIRTUAL TABLE IF NOT EXISTS vec_fragmento USING vec0 (
    fragmento_id INTEGER PRIMARY KEY,
    embedding float[384] distance_metric=cosine
  );

  CREATE TABLE IF NOT EXISTS conversacion (
    id TEXT PRIMARY KEY,
    iniciada_en TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS mensaje (
    id TEXT PRIMARY KEY,
    conversacion_id TEXT NOT NULL REFERENCES conversacion (id),
    rol TEXT NOT NULL CHECK (rol IN ('usuario', 'asistente')),
    texto TEXT NOT NULL,
    banda TEXT CHECK (banda IN ('ALTA', 'MEDIA', 'BAJA')),
    estado TEXT NOT NULL CHECK (estado IN ('generando', 'completo', 'detenido', 'error')),
    ttft_ms INTEGER,
    creado_en TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS mensaje_conversacion ON mensaje (conversacion_id, creado_en);

  CREATE TABLE IF NOT EXISTS cita (
    mensaje_id TEXT NOT NULL REFERENCES mensaje (id),
    fragmento_id INTEGER NOT NULL REFERENCES fragmento (id),
    orden INTEGER NOT NULL,
    similitud REAL NOT NULL,
    PRIMARY KEY (mensaje_id, orden)
  );
  `,
];

/** Orden de borrado del grupo Uso y del grupo Conocimiento (vista de datos, sección 3). */
export const SQL_BORRAR_TODO = `
  DELETE FROM cita;
  DELETE FROM mensaje;
  DELETE FROM conversacion;
  DELETE FROM vec_fragmento;
  DELETE FROM fragmento;
  DELETE FROM documento;
`;
