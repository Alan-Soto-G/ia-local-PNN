import { createContext, useContext, useState, type ReactNode } from 'react';

import { crearContenedor, type Contenedor } from './contenedor';

const ContextoDependencias = createContext<Contenedor | null>(null);

/** Entrega el contenedor de casos de uso a los hooks (vista de desarrollo, sección 1). */
export function ProveedorDependencias({ children }: { children: ReactNode }) {
  const [contenedor] = useState(crearContenedor);
  return <ContextoDependencias.Provider value={contenedor}>{children}</ContextoDependencias.Provider>;
}

export function useDependencias(): Contenedor {
  const contenedor = useContext(ContextoDependencias);
  if (contenedor === null) {
    throw new Error('useDependencias debe usarse dentro de ProveedorDependencias');
  }
  return contenedor;
}
