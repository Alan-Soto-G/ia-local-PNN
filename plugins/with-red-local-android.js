// Config plugin local (ADR-011, ADR-012). Sin librerías nuevas: usa expo/config-plugins.
// 1. Permite HTTP en claro solo hacia el backend del punto de acceso (Android 9+ lo bloquea por defecto).
// 2. Compila solo para arm64-v8a (RT-04).
const fs = require('fs');
const path = require('path');
const { withAndroidManifest, withDangerousMod, withGradleProperties } = require('expo/config-plugins');

const DOMINIOS_POR_DEFECTO = ['192.168.137.1', 'rag.home.arpa', 'mshome.net'];

function dominios() {
  const lista = new Set(DOMINIOS_POR_DEFECTO);
  const url = process.env.EXPO_PUBLIC_BACKEND_URL;
  if (url) {
    try {
      lista.add(new URL(url).hostname);
    } catch {
      // URL inválida: se queda con los dominios por defecto.
    }
  }
  return [...lista];
}

function xmlSeguridadRed() {
  const entradas = dominios()
    .map((d) => `    <domain includeSubdomains="true">${d}</domain>`)
    .join('\n');
  return `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
  <base-config cleartextTrafficPermitted="false" />
  <domain-config cleartextTrafficPermitted="true">
${entradas}
  </domain-config>
</network-security-config>
`;
}

const withSeguridadRed = (config) =>
  withDangerousMod(config, [
    'android',
    async (cfg) => {
      const carpeta = path.join(cfg.modRequest.platformProjectRoot, 'app/src/main/res/xml');
      fs.mkdirSync(carpeta, { recursive: true });
      fs.writeFileSync(path.join(carpeta, 'network_security_config.xml'), xmlSeguridadRed());
      return cfg;
    },
  ]);

const withManifestSeguridadRed = (config) =>
  withAndroidManifest(config, (cfg) => {
    const app = cfg.modResults.manifest.application?.[0];
    if (app) {
      app.$['android:networkSecurityConfig'] = '@xml/network_security_config';
    }
    return cfg;
  });

const withSoloArm64 = (config) =>
  withGradleProperties(config, (cfg) => {
    const clave = 'reactNativeArchitectures';
    cfg.modResults = cfg.modResults.filter((p) => !(p.type === 'property' && p.key === clave));
    cfg.modResults.push({ type: 'property', key: clave, value: 'arm64-v8a' });
    return cfg;
  });

module.exports = function withRedLocalAndroid(config) {
  return withSoloArm64(withManifestSeguridadRed(withSeguridadRed(config)));
};
