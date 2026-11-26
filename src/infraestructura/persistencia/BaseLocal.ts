import * as SQLite from 'expo-sqlite';

import { MIGRACIONES } from './migraciones';

const NOMBRE_BASE = 'pnn-los-nevados.db';

let base: Promise<SQLite.SQLiteDatabase> | null = null;

/**
 * Abre la base local una sola vez, carga sqlite-vec (requiere
 * `withSQLiteVecExtension` en app.json) y aplica las migraciones pendientes.
 */
export function obtenerBaseLocal(): Promise<SQLite.SQLiteDatabase> {
  base ??= abrir().catch((error: unknown) => {
    base = null;
    throw error;
  });
  return base;
}

async function abrir(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(NOMBRE_BASE);
  const vec = SQLite.bundledExtensions['sqlite-vec'];
  if (vec === undefined) {
    throw new Error('sqlite-vec no está incluido en el build (withSQLiteVecExtension)');
  }
  await db.loadExtensionAsync(vec.libPath, vec.entryPoint);
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  await migrar(db);
  return db;
}

async function migrar(db: SQLite.SQLiteDatabase): Promise<void> {
  const fila = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const actual = fila?.user_version ?? 0;
  for (let version = actual; version < MIGRACIONES.length; version++) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(MIGRACIONES[version]);
      await db.execAsync(`PRAGMA user_version = ${version + 1}`);
    });
  }
}
