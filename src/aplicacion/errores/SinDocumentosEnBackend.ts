import { ErrorAplicacion } from './ErrorAplicacion';

/** El backend responde pero no tiene tablas o su lista de documentos está vacía. */
export class SinDocumentosEnBackend extends ErrorAplicacion {
  readonly codigo = 'SinDocumentosEnBackend';
}
