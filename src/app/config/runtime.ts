export const isProductionBuild = import.meta.env.PROD;

export const allowMockData =
  import.meta.env.DEV && import.meta.env.VITE_ENABLE_MOCKS !== 'false';
