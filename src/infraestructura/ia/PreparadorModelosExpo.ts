import { Asset } from 'expo-asset';
import { Directory, File, Paths } from 'expo-file-system';

import { ModeloNoDisponible } from '../../aplicacion/errores/ModeloNoDisponible';
import type { PreparadorModelos } from '../../aplicacion/puertos/PreparadorModelos';
import { coincideSha256, SHA256_PENDIENTE, type ModeloLocal } from '../../dominio/ModeloLocal';
import { ASSETS_MODELOS } from './assets-modelos';

/**
 * Adaptador de preparación de modelos (ADR-013): copia el GGUF del APK a
 * `documentos/modelos/` y verifica su sha256. Guarda junto al modelo un archivo
 * `.verificado` con el sha256 y el tamaño, para no recalcular el hash en cada
 * arranque mientras el archivo no cambie.
 */
export class PreparadorModelosExpo implements PreparadorModelos {
  private readonly carpeta = new Directory(Paths.document, 'modelos');

  async preparar(modelo: ModeloLocal): Promise<string> {
    if (modelo.sha256 === SHA256_PENDIENTE) {
      throw new ModeloNoDisponible(`${modelo.archivo}: sha256 PENDIENTE (falta el GGUF real)`);
    }
    try {
      if (!this.carpeta.exists) this.carpeta.create({ intermediates: true, idempotent: true });
      const destino = new File(this.carpeta, modelo.archivo);
      const marca = new File(this.carpeta, `${modelo.archivo}.verificado`);

      if (destino.exists && marca.exists && (await marca.text()) === firma(modelo, destino.size)) {
        return destino.uri;
      }

      if (!destino.exists) await this.copiarDesdeApk(modelo, destino);
      if (!coincideSha256(modelo, await destino.digest('SHA-256'))) {
        // Copia dañada o de otra versión: se rehace una vez desde el APK.
        destino.delete();
        await this.copiarDesdeApk(modelo, destino);
        if (!coincideSha256(modelo, await destino.digest('SHA-256'))) {
          destino.delete();
          throw new Error('sha256 distinto al declarado');
        }
      }
      await marca.write(firma(modelo, destino.size));
      return destino.uri;
    } catch (error) {
      throw error instanceof ModeloNoDisponible
        ? error
        : new ModeloNoDisponible(`${modelo.archivo}: ${String(error)}`, { cause: error });
    }
  }

  private async copiarDesdeApk(modelo: ModeloLocal, destino: File): Promise<void> {
    const modulo = ASSETS_MODELOS[modelo.archivo];
    if (modulo === undefined) throw new Error(`No hay asset para ${modelo.archivo}`);
    const asset = await Asset.fromModule(modulo).downloadAsync();
    if (asset.localUri === null) throw new Error(`No se pudo leer el asset ${modelo.archivo}`);
    // downloadAsync deja el archivo en caché (el sistema puede borrarlo): se mueve al almacenamiento interno.
    await new File(asset.localUri).move(destino);
  }
}

function firma(modelo: ModeloLocal, tamano: number): string {
  return `${modelo.sha256}:${tamano}`;
}
