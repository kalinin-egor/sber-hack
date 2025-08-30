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
    ANIMALS: {
      CREATE: '/v1/animals/',
      GET_ALL: '/v1/animals/',
      GET_BY_ID: '/v1/animals',
      UPDATE: '/v1/animals',
      DELETE: '/v1/animals',
      GET_WITH_TRANSCRIPTIONS: '/v1/animals',
      CREATE_TRANSCRIPTION: '/v1/animals/transcriptions',
      PROCESS_AUDIO: '/v1/animals/audio/process',
      GET_TYPES: '/v1/animals/types/list',
      SEARCH_BY_NAME: '/v1/animals/search/by-name',
    },
    HEALTH: '/health',
  },
  TIMEOUT: ENV.API_TIMEOUT,
} as const;

export default API_CONFIG;
