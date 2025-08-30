# Руководство по отладке проблем с аутентификацией

## Проблема: 401 Unauthorized при логине

Вы получаете ошибку `{detail: "Invalid credentials"}` при попытке войти в систему.

## Возможные причины и решения:

### 1. 🌐 Неправильный URL API

**Проблема**: Фронтенд отправляет запросы на `https://api.sber-gitverse-hackathon.ru`, но ваш бэкенд запущен локально на `http://localhost:8075`.

**Решение**: 
- ✅ **Уже исправлено**: Обновлен файл `environment.ts` для автоматического выбора URL
- В режиме разработки используется `http://localhost:8075`
- В продакшене используется `https://api.sber-gitverse-hackathon.ru`

### 2. 👤 Отсутствие тестового пользователя

**Проблема**: В базе данных нет пользователей для тестирования.

**Решение**: Создать тестового пользователя:

```bash
# В директории backend
python create_test_user.py
```

Это создаст пользователя:
- **Email**: `test@example.com`
- **Password**: `password123`

### 3. 🐳 Проблемы с Docker контейнером

**Проверьте статус**:
```bash
docker compose ps
docker compose logs -f
```

**Если контейнер не работает**:
```bash
docker compose down
docker compose up --build -d
```

### 4. 🔍 Проверка API напрямую

Протестируйте API с помощью curl:

```bash
# Проверка health
curl http://localhost:8075/health

# Тест регистрации
curl -X POST http://localhost:8075/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"testuser","password":"password123"}'

# Тест логина
curl -X POST http://localhost:8075/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### 5. 📊 Проверка базы данных

Убедитесь, что база данных работает:

```bash
# Проверка контейнеров
docker compose ps

# Логи PostgreSQL
docker compose logs postgres
```

### 6. 🔧 Отладка через Python скрипт

Используйте тестовый скрипт:

```bash
python test_auth_api.py
```

## Пошаговая диагностика:

### Шаг 1: Проверьте сервис
```bash
curl http://localhost:8075/health
```
**Ожидаемый ответ**: `{"status": "healthy"}`

### Шаг 2: Проверьте регистрацию
```bash
curl -X POST http://localhost:8075/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"testuser","password":"password123"}'
```

### Шаг 3: Проверьте логин
```bash
curl -X POST http://localhost:8075/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Шаг 4: Проверьте фронтенд
1. Убедитесь, что фронтенд пересобран с новыми настройками
2. Откройте DevTools → Network и проверьте, куда идут запросы
3. Должны идти на `http://localhost:8075`, а не на внешний API

## Логи для анализа:

### Backend логи:
```bash
docker compose logs backend -f
```

### Frontend логи:
Откройте браузер → DevTools → Console

## Быстрое решение:

1. **Пересоберите фронтенд** с новыми настройками:
   ```bash
   cd frontend/main-page
   npm run dev
   ```

2. **Создайте тестового пользователя**:
   ```bash
   cd backend
   python create_test_user.py
   ```

3. **Попробуйте войти** с данными:
   - Email: `test@example.com`
   - Password: `password123`

## Если проблема остается:

1. Проверьте логи: `docker compose logs -f`
2. Убедитесь, что порт 8075 не занят: `lsof -i :8075`
3. Проверьте, что база данных инициализирована
4. Убедитесь, что все миграции применены

## Контакты для помощи:

Если проблема не решается, предоставьте:
1. Логи backend: `docker compose logs backend`
2. Логи frontend из DevTools
3. Результат `curl http://localhost:8075/health`
