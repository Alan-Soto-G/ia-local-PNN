import { randomUUID } from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';

import type { RepositorioConversaciones } from '../../aplicacion/puertos/RepositorioConversaciones';
import type { Banda } from '../../dominio/Banda';
import type { Cita } from '../../dominio/Cita';
import type { Conversacion } from '../../dominio/Conversacion';
import type { EstadoMensaje, Mensaje, RolMensaje } from '../../dominio/Mensaje';

interface FilaMensaje {
  id: string;
  conversacion_id: string;
  rol: RolMensaje;
  texto: string;
  banda: Banda | null;
  estado: EstadoMensaje;
  ttft_ms: number | null;
  creado_en: string;
}

interface FilaCita {
  mensaje_id: string;
  fragmento_id: number;
  orden: number;
  similitud: number;
  archivo: string;
  pagina: number;
}

/** Adaptador SQLite del grupo Uso (vista de datos). Nada sale del teléfono (PA-08). */
export class RepositorioConversacionesSqlite implements RepositorioConversaciones {
  constructor(
    private readonly obtenerBase: () => Promise<SQLiteDatabase>,
    private readonly ahora: () => Date,
  ) {}

  nuevoId(): string {
    return randomUUID();
  }

  /** Una conversación por carga vigente: una carga nueva o el vencimiento la borran. */
  async conversacionActual(): Promise<Conversacion> {
    const db = await this.obtenerBase();
    const fila = await db.getFirstAsync<{ id: string; iniciada_en: string }>(
      'SELECT id, iniciada_en FROM conversacion ORDER BY iniciada_en LIMIT 1',
    );
    if (fila !== null) return { id: fila.id, iniciadaEn: fila.iniciada_en };
    const nueva = { id: this.nuevoId(), iniciadaEn: this.ahora().toISOString() };
    await db.runAsync('INSERT INTO conversacion (id, iniciada_en) VALUES (?, ?)', nueva.id, nueva.iniciadaEn);
    return nueva;
  }

  async mensajes(conversacionId: string): Promise<Mensaje[]> {
    const db = await this.obtenerBase();
    const filas = await db.getAllAsync<FilaMensaje>(
      'SELECT * FROM mensaje WHERE conversacion_id = ? ORDER BY creado_en, rowid',
      conversacionId,
    );
    const citas = await db.getAllAsync<FilaCita>(
      `SELECT c.mensaje_id, c.fragmento_id, c.orden, c.similitud, d.archivo, f.pagina
         FROM cita c
         JOIN mensaje m ON m.id = c.mensaje_id
         JOIN fragmento f ON f.id = c.fragmento_id
         JOIN documento d ON d.id = f.documento_id
        WHERE m.conversacion_id = ?
        ORDER BY c.mensaje_id, c.orden`,
      conversacionId,
    );
    const porMensaje = new Map<string, Cita[]>();
    for (const c of citas) {
      const lista = porMensaje.get(c.mensaje_id) ?? [];
      lista.push({
        fragmentoId: c.fragmento_id,
        archivo: c.archivo,
        pagina: c.pagina,
        similitud: c.similitud,
        orden: c.orden,
      });
      porMensaje.set(c.mensaje_id, lista);
    }
    return filas.map((f) => ({
      id: f.id,
      conversacionId: f.conversacion_id,
      rol: f.rol,
      texto: f.texto,
      banda: f.banda,
      estado: f.estado,
      ttftMs: f.ttft_ms,
      creadoEn: f.creado_en,
      citas: porMensaje.get(f.id) ?? [],
    }));
  }

  async guardarMensaje(m: Mensaje): Promise<void> {
    const db = await this.obtenerBase();
    await db.withTransactionAsync(async () => {
      await db.runAsync(
        `INSERT INTO mensaje (id, conversacion_id, rol, texto, banda, estado, ttft_ms, creado_en)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        m.id, m.conversacionId, m.rol, m.texto, m.banda, m.estado, m.ttftMs, m.creadoEn,
      );
      await this.escribirCitas(db, m);
    });
  }

  async actualizarMensaje(m: Mensaje): Promise<void> {
    const db = await this.obtenerBase();
    await db.withTransactionAsync(async () => {
      await db.runAsync(
        'UPDATE mensaje SET texto = ?, banda = ?, estado = ?, ttft_ms = ? WHERE id = ?',
        m.texto, m.banda, m.estado, m.ttftMs, m.id,
      );
      await db.runAsync('DELETE FROM cita WHERE mensaje_id = ?', m.id);
      await this.escribirCitas(db, m);
    });
  }

  async borrarTodo(): Promise<void> {
    const db = await this.obtenerBase();
    await db.execAsync('DELETE FROM cita; DELETE FROM mensaje; DELETE FROM conversacion;');
  }

  private async escribirCitas(db: SQLiteDatabase, m: Mensaje): Promise<void> {
    for (const c of m.citas) {
      await db.runAsync(
        'INSERT INTO cita (mensaje_id, fragmento_id, orden, similitud) VALUES (?, ?, ?, ?)',
        m.id, c.fragmentoId, c.orden, c.similitud,
      );
    }
  }
}
