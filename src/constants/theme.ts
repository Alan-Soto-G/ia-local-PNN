/**
 * Tema "páramo" (EAC-06): niebla, roca, musgo de frailejón, laguna y madera de
 * letrero de sendero. Solo tema claro: es el más legible bajo el sol.
 * Cada par texto/fondo se comprobó con contraste ≥ 7:1 (WCAG AAA); ver
 * specs/001-actualizar-informacion/validacion.md.
 */
export const Colores = {
  fondo: '#F4F1E6', // niebla del páramo
  superficie: '#FFFDF7',
  cielo: '#DCE6E0',
  texto: '#16241B', // roca
  textoSecundario: '#33433A',
  borde: '#B9B29C',

  primario: '#234A31', // musgo de frailejón
  primarioPresionado: '#183623',
  sobrePrimario: '#FFFFFF',

  laguna: '#0B4A57',
  sobreLaguna: '#FFFFFF',

  madera: '#4A2E1C', // letrero de sendero
  sobreMadera: '#FFF3D1',

  ambar: '#F2B43A', // flor del frailejón; solo como relleno con texto roca
  sobreAmbar: '#16241B',

  error: '#8A1C1C',
  sobreError: '#FFFFFF',
  fondoError: '#FBE9E6',
  textoError: '#7A1616',

  fondoExito: '#E3EFDF',
  textoExito: '#163A22',

  deshabilitado: '#D9D4C3',
  sobreDeshabilitado: '#2A332D',
  pista: '#E7E1CF',

  // Noche del páramo: diálogo de vencimiento (crema sobre noche 13,4:1)
  noche: '#1F2A24',
  sobreNoche: '#FFF3D1',

  // Cordillera (decorativa, sin texto encima)
  montanaLejana: '#8FA39C',
  montanaMedia: '#4E7A5C',
  montanaCercana: '#234A31',
  nieve: '#FFFFFF',
} as const;

/** Escala de 8 dp (ui-ux-pro-max, spacing-scale). */
export const Espacio = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 48,
} as const;

/** Tamaños táctiles (EAC-06: botones de al menos 56 dp). */
export const Toque = {
  botonAlto: 64,
  minimo: 56,
} as const;

/** Tipografía del sistema (Roboto); nunca menos de 16. */
export const Tipo = {
  titulo: { fontSize: 28, lineHeight: 34, fontWeight: '700' },
  subtitulo: { fontSize: 20, lineHeight: 26, fontWeight: '700' },
  cuerpo: { fontSize: 18, lineHeight: 27, fontWeight: '400' },
  etiqueta: { fontSize: 16, lineHeight: 22, fontWeight: '600', letterSpacing: 0.4 },
  boton: { fontSize: 20, lineHeight: 26, fontWeight: '700' },
} as const;

export const Radio = {
  s: 8,
  m: 14,
  l: 22,
} as const;
