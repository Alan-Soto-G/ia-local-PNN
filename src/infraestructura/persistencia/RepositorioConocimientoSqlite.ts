import type { SQLiteDatabase } from 'expo-sqlite';

import type { RepositorioConocimiento } from '../../aplicacion/puertos/RepositorioConocimiento';
import { CARGA_SIN_DATOS, type Carga } from '../../dominio/Carga';
import type { Documento } from '../../dominio/Documento';
import type { EstadoCargaPersistido } from '../../dominio/EstadoCarga';
import type { Fragmento } from '../../dominio/Fragmento';
import { Vigencia } from '../../dominio/Vigencia';
import { SQL_BORRAR_TODO } from './migraciones';

interface FilaCarga {
  estado: EstadoCargaPersistido;
  cargado_en: string | null;
  expira_en: string | null;
  modelo_embedding: string | null;
  dimensiones: number | null;
  total_documentos: number;
  total_fragmentos: number;
  url_backend: string | null;
}

/** Vector float32 como blob binario, el formato de sqlite-vec (vista de datos). */
export function vectorABlob(vector: Float32Array): Uint8Array {
  return new Uint8Array(vector.buffer, vector.byteOffset, vector.byteLength);
}

/**
 * Adaptador SQLite del grupo Conocimiento (ADR-012). La carga se escribe en una
 * transacción: si algo falla, SQLite hace rollback y la base anterior queda igual
 * (EAC-03), también si la app se cierra a mitad de la escritura.
 *
 * Se usa `withTransactionAsync` y no `withExclusiveTransactionAsync` porque esta
 * última abre otra conexión sin la extensión sqlite-vec cargada. Mientras corre
 * la carga no hay otras escrituras: la pantalla deshabilita el botón y el chat
 * no está activo.
 */
export class RepositorioConocimientoSqlite implements RepositorioConocimiento {
  constructor(private readonly obtenerBase: () => Promise<SQLiteDatabase>) {}

  async leerCarga(): Promise<Carga> {
    const db = await this.obtenerBase();
    const fila = await db.getFirstAsync<FilaCarga>('SELECT * FROM carga WHERE id = 1');
    if (fila === null || fila.estado === 'sin_datos' || !fila.cargado_en || !fila.expira_en) {
      return CARGA_SIN_DATOS;
    }
    return {
      estado: fila.estado,
      vigencia: Vigencia.reconstruir(new Date(fila.cargado_en), new Date(fila.expira_en)),
      modeloEmbedding: fila.modelo_embedding,
      dimensiones: fila.dimensiones,
      totalDocumentos: fila.total_documentos,
      totalFragmentos: fila.total_fragmentos,
      urlBackend: fila.url_backend,
    };
  }

  async reemplazarTodo(
    carga: Carga,
    documentos: readonly Documento[],
    fragmentos: readonly Fragmento[],
  ): Promise<void> {
    const db = await this.obtenerBase();
    await db.withTransactionAsync(async () => {
      await db.execAsync(SQL_BORRAR_TODO);

      const insertarDocumento = await db.prepareAsync(
        `INSERT INTO documento (id, nombre, version, archivo, paginas, num_fragmentos, sha256, creado_en)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      );
      try {
        for (const d of documentos) {
          await insertarDocumento.executeAsync(
            d.id, d.nombre, d.version, d.archivo, d.paginas, d.numFragmentos, d.sha256, d.creadoEn,
          );
        }
      } finally {
        await insertarDocumento.finalizeAsync();
      }

      const insertarFragmento = await db.prepareAsync(
        `INSERT INTO fragmento (id, documento_id, indice, pagina, texto, caracteres) VALUES (?, ?, ?, ?, ?, ?)`,
      );
      const insertarVector = await db.prepareAsync(
        'INSERT INTO vec_fragmento (fragmento_id, embedding) VALUES (?, ?)',
      );
      try {
        for (const f of fragmentos) {
          await insertarFragmento.executeAsync(f.id, f.documentoId, f.indice, f.pagina, f.texto, f.caracteres);
          await insertarVector.executeAsync(f.id, vectorABlob(f.vector));
        }
      } finally {
        await insertarFragmento.finalizeAsync();
        await insertarVector.finalizeAsync();
      }

      await db.runAsync(
        `UPDATE carga SET estado = ?, cargado_en = ?, expira_en = ?, modelo_embedding = ?, dimensiones = ?,
           total_documentos = ?, total_fragmentos = ?, url_backend = ? WHERE id = 1`,
        carga.estado,
        carga.vigencia?.cargadoEn.toISOString() ?? null,
        carga.vigencia?.expiraEn.toISOString() ?? null,
        carga.modeloEmbedding,
        carga.dimensiones,
        carga.totalDocumentos,
        carga.totalFragmentos,
        carga.urlBackend,
      );
    });
  }

  async borrarTodo(): Promise<void> {
    const db = await this.obtenerBase();
    await db.withTransactionAsync(async () => {
      await db.execAsync(SQL_BORRAR_TODO);
      await db.runAsync(
        `UPDATE carga SET estado = 'sin_datos', cargado_en = NULL, expira_en = NULL, modelo_embedding = NULL,
           dimensiones = NULL, total_documentos = 0, total_fragmentos = 0, url_backend = NULL WHERE id = 1`,
      );
    });
  }
}
