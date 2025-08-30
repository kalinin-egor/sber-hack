import { ApiErrorResponse } from '../types/auth';

/**
 * Обрабатывает ошибки API и возвращает читаемое сообщение
 */
export function handleApiError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'Произошла неизвестная ошибка';
}

/**
 * Извлекает сообщение об ошибке из ответа API
 */
export async function extractErrorMessage(response: Response): Promise<string> {
  try {
    const errorData: ApiErrorResponse = await response.json();
    
    if (errorData.detail) {
      return errorData.detail;
    }
    
    if (errorData.message) {
      return errorData.message;
    }
    
    if (errorData.errors && errorData.errors.length > 0) {
      return errorData.errors.map(err => err.msg).join(', ');
    }
    
    return `HTTP ${response.status}: ${response.statusText}`;
  } catch {
    return `HTTP ${response.status}: ${response.statusText}`;
  }
}

/**
 * Переводит сообщения об ошибках на русский язык
 */
export function translateErrorMessage(message: string): string {
  const translations: Record<string, string> = {
    'User with this email already exists': 'Пользователь с таким email уже существует',
    'Invalid email or password': 'Неверный email или пароль',
    'Email not verified': 'Email не подтвержден',
    'Invalid confirmation code': 'Неверный код подтверждения',
    'Confirmation code expired': 'Код подтверждения истек',
    'User not found': 'Пользователь не найден',
    'Token expired': 'Токен истек',
    'Invalid token': 'Неверный токен',
    'Access denied': 'Доступ запрещен',
    'Request timeout': 'Превышено время ожидания запроса',
    'Network error': 'Ошибка сети',
    'Server error': 'Ошибка сервера',
  };

  return translations[message] || message;
}
