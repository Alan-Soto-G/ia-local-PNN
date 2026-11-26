import type { SQLiteDatabase } from 'expo-sqlite';

import type { BuscadorVectorial, FragmentoRecuperado } from '../../aplicacion/puertos/BuscadorVectorial';
import { vectorABlob } from './RepositorioConocimientoSqlite';

interface FilaVecino {
  fragmento_id: number;
  archivo: string;
  pagina: number;
  texto: string;
  distancia: number;
}

/**
 * kNN en `vec_fragmento` con sqlite-vec (ADR-012, ADR-016). La tabla usa
 * distancia coseno: similitud = 1 − distancia.
 */
export class BuscadorVectorialSqlite implements BuscadorVectorial {
  constructor(private readonly obtenerBase: () => Promise<SQLiteDatabase>) {}

  async buscar(vector: Float32Array, k: number): Promise<FragmentoRecuperado[]> {
    const db = await this.obtenerBase();
    const filas = await db.getAllAsync<FilaVecino>(
      `SELECT v.fragmento_id AS fragmento_id, d.archivo AS archivo, f.pagina AS pagina, f.texto AS texto,
              v.distance AS distancia
         FROM vec_fragmento v
         JOIN fragmento f ON f.id = v.fragmento_id
         JOIN documento d ON d.id = f.documento_id
        WHERE v.embedding MATCH ? AND k = ?
        ORDER BY v.distance`,
      vectorABlob(vector),
      k,
    );
    return filas.map((f) => ({
      fragmentoId: f.fragmento_id,
      archivo: f.archivo,
      pagina: f.pagina,
      texto: f.texto,
      similitud: 1 - f.distancia,
    }));
  }
}
