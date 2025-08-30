# Система авторизации с JWT

Система авторизации добавлена в frontend приложение с поддержкой JWT токенов.

## Возможности

- ✅ Регистрация пользователей с подтверждением по email
- ✅ Авторизация с получением JWT токенов
- ✅ Автоматическое обновление токенов
- ✅ Защищенные роуты
- ✅ Красивый UI с анимациями
- ✅ Управление состоянием через React Context

## Структура файлов

```
src/
├── shared/types/
│   └── auth.ts                     # Типы для авторизации
├── application/services/
│   └── AuthService.ts              # Сервис для работы с API
├── presentation/
│   ├── stores/
│   │   └── AuthContext.tsx         # Context для управления состоянием
│   └── components/
│       ├── auth/
│       │   ├── LoginForm.tsx       # Форма входа
│       │   ├── RegisterForm.tsx    # Форма регистрации
│       │   ├── ConfirmationForm.tsx# Форма подтверждения email
│       │   ├── AuthPage.tsx        # Страница авторизации
│       │   ├── ProtectedRoute.tsx  # Компонент защиты роутов
│       │   └── index.ts           # Экспорты
│       └── AppWithRouter.tsx       # Главный компонент с роутингом
```

## API эндпоинты

Система работает с API по адресу **https://api.sber-gitverse-hackathon.ru/** со следующими эндпоинтами:

- `POST /v1/auth/register` - Регистрация пользователя
- `POST /v1/auth/confirm-registration` - Подтверждение регистрации
- `POST /v1/auth/login` - Вход в систему
- `POST /v1/auth/refresh-token` - Обновление токена

## Использование

### 1. Обертывание приложения в AuthProvider

```tsx
import { AuthProvider } from './presentation/stores/AuthContext';

function App() {
  return (
    <AuthProvider>
      {/* Ваше приложение */}
    </AuthProvider>
  );
}
```

### 2. Использование хука useAuth

```tsx
import { useAuth } from './presentation/stores/AuthContext';

function MyComponent() {
  const { state, login, logout, register } = useAuth();

  // state.isAuthenticated - статус авторизации
  // state.user - данные пользователя
  // state.isLoading - состояние загрузки
  // state.error - ошибки
}
```

### 3. Защищенные роуты

```tsx
import { ProtectedRoute } from './presentation/components/auth';

<ProtectedRoute requireAuth={true}>
  <YourProtectedComponent />
</ProtectedRoute>
```

## Роуты

- `/auth` - Страница авторизации (доступна только неавторизованным)
- `/` - Главная страница (защищена, требует авторизации)

## Конфигурация

Базовый URL для API настроен на `https://api.sber-gitverse-hackathon.ru/` и может быть изменен в файле `src/shared/constants/api.ts`:

```tsx
export const API_CONFIG = {
  BASE_URL: 'https://api.sber-gitverse-hackathon.ru',
  // ...
};
```

Или можно передать другой URL при создании сервиса:

```tsx
const authService = new AuthService('https://your-custom-api-url');
```

## Хранение токенов

Токены автоматически сохраняются в `localStorage` и восстанавливаются при перезагрузке страницы.

## Безопасность

- Токены проверяются на валидность (срок действия)
- Автоматическая очистка при выходе
- Защита роутов от неавторизованного доступа
- Перенаправление после успешной авторизации

## Стилизация

Все компоненты используют:
- Tailwind CSS для стилей
- Radix UI для базовых компонентов
- Framer Motion для анимаций
- Lucide React для иконок

## Запуск

1. Установите зависимости:
```bash
npm install react-router-dom @types/react-router-dom
```

2. Запустите приложение:
```bash
npm run dev
```

3. Перейдите на `http://localhost:5173`

Если пользователь не авторизован, он будет автоматически перенаправлен на `/auth`.
