// Configuración global de Jest para tests del módulo móvil.
// AsyncStorage requiere su mock oficial en entornos de prueba (sin runtime nativo).
// Ver: https://react-native-async-storage.github.io/async-storage/docs/advanced/jest
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);