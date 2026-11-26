// Metro: los modelos GGUF viajan como assets del APK (ADR-013).
// Patrón de la documentación de expo-sqlite (SDK 58) para extensiones nuevas en assetExts.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push('gguf');

module.exports = config;
