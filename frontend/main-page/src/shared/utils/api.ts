import { API_CONFIG } from '../constants/api';
import { ResponseSchema } from '../types/auth';

// Утилита для выполнения API запросов
export class ApiClient {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl: string = API_CONFIG.BASE_URL, timeout: number = API_CONFIG.TIMEOUT) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }

  /**
   * Выполняет HTTP запрос с обработкой ошибок
   */
  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ResponseSchema<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: ResponseSchema<T> = await response.json();
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout');
        }
        throw error;
      }
      
      throw new Error('Unknown error occurred');
    }
  }

  /**
   * GET запрос
   */
  async get<T>(endpoint: string, headers?: HeadersInit): Promise<ResponseSchema<T>> {
    return this.request<T>(endpoint, { method: 'GET', headers });
  }

  /**
   * POST запрос
   */
  async post<T>(
    endpoint: string, 
    data?: any, 
    headers?: HeadersInit
  ): Promise<ResponseSchema<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      headers,
    });
  }

  /**
   * PUT запрос
   */
  async put<T>(
    endpoint: string, 
    data?: any, 
    headers?: HeadersInit
  ): Promise<ResponseSchema<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      headers,
    });
  }

  /**
   * DELETE запрос
   */
  async delete<T>(endpoint: string, headers?: HeadersInit): Promise<ResponseSchema<T>> {
    return this.request<T>(endpoint, { method: 'DELETE', headers });
  }
}

// Экспортируем готовый экземпляр
export const apiClient = new ApiClient();
export default apiClient;
