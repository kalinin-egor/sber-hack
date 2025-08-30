# Clean Architecture - Анализатор аудио

Этот проект реализует принципы чистой архитектуры (Clean Architecture) для frontend приложения анализа аудио.

## Структура архитектуры

### 📁 Слои архитектуры

```
src/
├── domain/                    # Доменный слой
│   ├── entities/             # Сущности
│   ├── value-objects/        # Объекты-значения
│   └── repositories/         # Интерфейсы репозиториев
├── application/              # Слой приложения
│   ├── use-cases/           # Случаи использования
│   ├── services/            # Сервисы приложения
│   └── dto/                 # Объекты передачи данных
├── infrastructure/          # Инфраструктурный слой
│   ├── repositories/        # Реализации репозиториев
│   ├── adapters/           # Адаптеры
│   └── services/           # Инфраструктурные сервисы
├── presentation/           # Слой представления
│   ├── components/         # React компоненты
│   ├── hooks/             # React хуки
│   └── stores/            # Состояние (если нужно)
└── shared/                # Общие утилиты
    ├── container/         # Dependency Injection
    ├── utils/            # Утилиты
    ├── constants/        # Константы
    └── types/            # Общие типы
```

## 🎯 Принципы

### 1. Dependency Rule
Зависимости направлены внутрь к доменному слою:
- **Domain** ← Application ← Infrastructure
- **Domain** ← Application ← Presentation
- Внешние слои зависят от внутренних, но не наоборот

### 2. Separation of Concerns
Каждый слой имеет свою ответственность:
- **Domain**: Бизнес-логика и правила
- **Application**: Оркестрация и случаи использования
- **Infrastructure**: Внешние зависимости и адаптеры
- **Presentation**: UI и взаимодействие с пользователем

## 📋 Компоненты архитектуры

### Domain Layer (Доменный слой)

#### Entities (Сущности)
- `AudioAnalysis` - Основная сущность анализа аудио
- `GraphNode` - Узел графа визуализации
- `GraphLink` - Связь между узлами графа

#### Value Objects (Объекты-значения)
- `AudioFile` - Представление аудио файла
- `TranscriptionResult` - Результат транскрипции
- `AnalysisStatus` - Статус анализа
- `Position` - Позиция на графе
- `NodeMetadata` - Метаданные узла

#### Repository Interfaces (Интерфейсы репозиториев)
- `AudioAnalysisRepository` - Управление анализами
- `GraphRepository` - Управление графом
- `AudioProcessingRepository` - Обработка аудио

### Application Layer (Слой приложения)

#### Use Cases (Случаи использования)
- `CreateAudioAnalysisUseCase` - Создание анализа
- `ProcessAudioAnalysisUseCase` - Обработка анализа
- `GetAudioAnalysisHistoryUseCase` - Получение истории
- `GenerateGraphVisualizationUseCase` - Генерация графа
- `UpdateGraphLayoutUseCase` - Обновление компоновки графа

#### Services (Сервисы)
- `AudioAnalysisService` - Сервис анализа аудио
- `GraphVisualizationService` - Сервис визуализации графа

#### DTOs (Объекты передачи данных)
- `AudioAnalysisDto` - DTO анализа
- `GraphDto` - DTO графа

### Infrastructure Layer (Инфраструктурный слой)

#### Repositories (Реализации репозиториев)
- `LocalStorageAudioAnalysisRepository` - Хранение в localStorage
- `LocalStorageGraphRepository` - Хранение графа в localStorage

#### Adapters (Адаптеры)
- `MockAudioProcessingAdapter` - Мок для обработки аудио

#### Services (Инфраструктурные сервисы)
- `AudioRecordingService` - Запись аудио

### Presentation Layer (Слой представления)

#### Components (Компоненты)
- `App` - Главный компонент
- `AudioAnalyzer` - Компонент анализа аудио
- `GraphVisualization` - Компонент визуализации графа

#### Hooks (Хуки)
- `useAudioAnalysis` - Хук для работы с анализом
- `useGraphVisualization` - Хук для работы с графом
- `useAudioRecording` - Хук для записи аудио

## 🔧 Dependency Injection

Проект использует собственный DI контейнер для управления зависимостями:

```typescript
// Регистрация зависимостей
container.register(AUDIO_ANALYSIS_REPOSITORY, LocalStorageAudioAnalysisRepository);
container.register(AUDIO_ANALYSIS_SERVICE, () => new AudioAnalysisService(...));

// Использование
const service = container.resolve<AudioAnalysisService>(AUDIO_ANALYSIS_SERVICE);
```

## 🚀 Преимущества архитектуры

### 1. Тестируемость
- Легко мокать зависимости
- Изолированное тестирование слоев
- Независимые unit-тесты

### 2. Гибкость
- Легко менять реализации (localStorage → API)
- Добавление новых функций без изменения существующего кода
- Поддержка разных UI фреймворков

### 3. Поддерживаемость
- Четкое разделение ответственности
- Понятная структура проекта
- Легко находить и исправлять баги

### 4. Масштабируемость
- Легко добавлять новые use cases
- Расширение функциональности
- Поддержка команды разработчиков

## 🔄 Поток данных

```
User Interaction → Hook → Service → Use Case → Repository → Infrastructure
                    ↓
UI Component ← DTO ← Service ← Entity ← Use Case ← Repository
```

## 📝 Примеры использования

### Создание анализа аудио
```typescript
// В компоненте
const { createFromFile } = useAudioAnalysis();
await createFromFile(file);

// Поток: Hook → Service → Use Case → Repository → Infrastructure
```

### Обновление графа
```typescript
// В компоненте  
const { randomizeLayout } = useGraphVisualization();
await randomizeLayout(800, 600);

// Поток: Hook → Service → Use Case → Repository → Domain
```

## 🎨 Дизайн-паттерны

### Repository Pattern
Абстрагирует доступ к данным от бизнес-логики.

### Use Case Pattern
Инкапсулирует бизнес-логику в отдельные случаи использования.

### Adapter Pattern
Адаптирует внешние API к внутренним интерфейсам.

### Dependency Injection
Управляет зависимостями и их жизненным циклом.

## 🛠 Расширение архитектуры

### Добавление нового Use Case
1. Создать интерфейс в `application/use-cases/`
2. Реализовать бизнес-логику
3. Зарегистрировать в DI контейнере
4. Использовать в сервисе

### Добавление нового Repository
1. Создать интерфейс в `domain/repositories/`
2. Реализовать в `infrastructure/repositories/`
3. Зарегистрировать в DI контейнере

### Смена хранилища данных
1. Создать новую реализацию Repository
2. Обновить конфигурацию DI контейнера
3. Вся остальная логика остается без изменений

## 🧪 Тестирование

Архитектура позволяет легко тестировать каждый слой изолированно:

```typescript
// Тест Use Case
const mockRepository = createMock<AudioAnalysisRepository>();
const useCase = new CreateAudioAnalysisUseCase(mockRepository);

// Тест Service  
const mockUseCase = createMock<CreateAudioAnalysisUseCase>();
const service = new AudioAnalysisService(mockUseCase, ...);

// Тест Component
const mockHook = createMock<UseAudioAnalysisResult>();
render(<AudioAnalyzer />, { mockHook });
```

Эта архитектура обеспечивает чистый, поддерживаемый и масштабируемый код для frontend приложения.
