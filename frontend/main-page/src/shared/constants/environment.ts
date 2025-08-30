// Конфигурация окружения
export const ENV = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'https://api.sber-gitverse-hackathon.ru',
  API_TIMEOUT: Number(import.meta.env.VITE_API_TIMEOUT) || 10000,
  NODE_ENV: import.meta.env.MODE || 'development',
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD,
} as const;

export default ENV;
