import { ErrorAplicacion } from './ErrorAplicacion';

/** `/health/db` no respondió a tiempo o no dio `status: ok` (ADR-012). */
export class BackendNoDisponible extends ErrorAplicacion {
  readonly codigo = 'BackendNoDisponible';
}
