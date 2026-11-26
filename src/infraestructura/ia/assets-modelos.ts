/**
 * Assets GGUF incluidos en el APK (ADR-013), por nombre de archivo. Los archivos
 * de `assets/modelos/` están vacíos hasta colocar los GGUF reales (DT-02).
 */
export const ASSETS_MODELOS: Readonly<Record<string, number>> = {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- asset GGUF (metro.config.js)
  'lfm2.5-350m-q4_k_m.gguf': require('../../../assets/modelos/lfm2.5-350m-q4_k_m.gguf'),
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- asset GGUF (metro.config.js)
  'paraphrase-multilingual-minilm-l12-v2-f16.gguf': require('../../../assets/modelos/paraphrase-multilingual-minilm-l12-v2-f16.gguf'),
};
