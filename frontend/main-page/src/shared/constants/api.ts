import { ENV } from './environment';

// API конфигурация
export const API_CONFIG = {
  BASE_URL: ENV.API_BASE_URL,
  ENDPOINTS: {
    AUTH: {
      REGISTER: '/v1/auth/register',
      CONFIRM_REGISTRATION: '/v1/auth/confirm-registration',
      LOGIN: '/v1/auth/login',
      REFRESH_TOKEN: '/v1/auth/refresh-token',
    },
    HEALTH: '/health',
  },
  TIMEOUT: ENV.API_TIMEOUT,
} as const;

export default API_CONFIG;
