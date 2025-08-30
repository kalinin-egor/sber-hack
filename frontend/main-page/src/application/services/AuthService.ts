import {
  UserRegisterSchema,
  UserLoginSchema,
  ConfirmRegisterSchema,
  ResponseSchema,
  LoginResponse,
  RegisterResponse,
  AuthTokens
} from '../../shared/types/auth';
import { API_CONFIG } from '../../shared/constants/api';
import { extractErrorMessage, translateErrorMessage } from '../../shared/utils/errorHandler';

export class AuthService {
  private readonly baseUrl: string;

  constructor(baseUrl: string = API_CONFIG.BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Регистрация нового пользователя
   */
  async register(data: UserRegisterSchema): Promise<RegisterResponse> {
    const response = await fetch(`${this.baseUrl}${API_CONFIG.ENDPOINTS.AUTH.REGISTER}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorMessage = await extractErrorMessage(response);
      throw new Error(translateErrorMessage(errorMessage));
    }

    const result = await response.json();
    
    // Проверяем разные форматы ответа
    if (result.exception !== null && result.exception !== undefined && result.exception !== 0) {
      throw new Error(result.message || 'Registration failed');
    }

    // Если данные в формате ResponseSchema
    if (result.data) {
      return result.data;
    }
    
    // Если данные напрямую в ответе
    return result;
  }

  /**
   * Подтверждение регистрации
   */
  async confirmRegistration(data: ConfirmRegisterSchema): Promise<void> {
    const response = await fetch(`${this.baseUrl}${API_CONFIG.ENDPOINTS.AUTH.CONFIRM_REGISTRATION}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorMessage = await extractErrorMessage(response);
      throw new Error(translateErrorMessage(errorMessage));
    }

    const result = await response.json();
    
    // Проверяем разные форматы ответа
    if (result.exception !== null && result.exception !== undefined && result.exception !== 0) {
      throw new Error(result.message || 'Confirmation failed');
    }
  }

  /**
   * Авторизация пользователя
   */
  async login(data: UserLoginSchema): Promise<LoginResponse> {
    const response = await fetch(`${this.baseUrl}${API_CONFIG.ENDPOINTS.AUTH.LOGIN}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorMessage = await extractErrorMessage(response);
      throw new Error(translateErrorMessage(errorMessage));
    }

    const result = await response.json();
    
    // Проверяем разные форматы ответа
    if (result.exception !== null && result.exception !== undefined && result.exception !== 0) {
      throw new Error(result.message || 'Login failed');
    }

    // Если данные в формате ResponseSchema
    if (result.data) {
      // Преобразуем данные в ожидаемый формат LoginResponse
      const loginData = result.data;
      return {
        access_token: loginData.access_token,
        refresh_token: loginData.refresh_token,
        user: loginData.user
      };
    }
    
    // Если данные напрямую в ответе
    return result;
  }

  /**
   * Обновление токена
   */
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    const response = await fetch(`${this.baseUrl}${API_CONFIG.ENDPOINTS.AUTH.REFRESH_TOKEN}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${refreshToken}`,
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.statusText}`);
    }

    const result: ResponseSchema<AuthTokens> = await response.json();
    
    if (result.exception !== null) {
      throw new Error(result.message || 'Token refresh failed');
    }

    return result.data!;
  }

  /**
   * Выход из системы
   */
  async logout(): Promise<void> {
    // Здесь может быть логика для отзыва токенов на сервере
    // Пока просто очищаем локальное хранилище
    this.clearTokens();
  }

  /**
   * Сохранение токенов в localStorage
   */
  saveTokens(tokens: AuthTokens): void {
    localStorage.setItem('auth_tokens', JSON.stringify(tokens));
  }

  /**
   * Получение токенов из localStorage
   */
  getTokens(): AuthTokens | null {
    const tokens = localStorage.getItem('auth_tokens');
    return tokens ? JSON.parse(tokens) : null;
  }

  /**
   * Очистка токенов из localStorage
   */
  clearTokens(): void {
    localStorage.removeItem('auth_tokens');
  }

  /**
   * Проверка валидности токена
   */
  isTokenValid(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Date.now() / 1000;
      return payload.exp > now;
    } catch {
      return false;
    }
  }

  /**
   * Получение заголовка авторизации
   */
  getAuthHeader(): { Authorization: string } | {} {
    const tokens = this.getTokens();
    if (tokens && this.isTokenValid(tokens.access_token)) {
      return { Authorization: `Bearer ${tokens.access_token}` };
    }
    return {};
  }
}
