import { API_CONFIG } from '../../shared/constants/api';
import { AuthService } from './AuthService';

export interface Animal {
  id: number;
  animal: string;
  name: string;
}

export interface AnimalCreateRequest {
  animal: string;
  name: string;
}

export interface AnimalUpdateRequest {
  animal?: string;
  name?: string;
}

export interface TranscriptionCreateRequest {
  animal_id: number;
  behavior_state?: string;
  measurements?: object;
  feeding_details?: object;
  relationships?: object;
}

export interface Transcription {
  id: number;
  animal_id: number;
  behavior_state?: string;
  measurements?: object;
  feeding_details?: object;
  relationships?: object;
  created_at: string;
}

export interface ResponseSchema<T = any> {
  exception: number | null;
  data: T | null;
  message: string | null;
}

export class AnimalsService {
  private readonly baseUrl: string;
  private readonly authService: AuthService;

  constructor(baseUrl: string = API_CONFIG.BASE_URL) {
    this.baseUrl = baseUrl;
    this.authService = new AuthService();
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const authHeaders = this.authService.getAuthHeader();
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ResponseSchema<T> = await response.json();
    
    if (result.exception !== null && result.exception !== 0) {
      throw new Error(result.message || 'API request failed');
    }

    return result.data as T;
  }

  /**
   * Создание нового животного
   */
  async createAnimal(data: AnimalCreateRequest): Promise<Animal> {
    return this.makeRequest<Animal>('/v1/animals/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Получение списка всех животных
   */
  async getAllAnimals(
    page: number = 1,
    pageSize: number = 50,
    animalType?: string
  ): Promise<Animal[]> {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    });

    if (animalType) {
      params.append('animal_type', animalType);
    }

    const result = await this.makeRequest<{animals: Animal[], total: number, page: number, page_size: number}>(`/v1/animals/?${params.toString()}`);
    return result.animals || [];
  }

  /**
   * Получение животного по ID
   */
  async getAnimalById(animalId: number): Promise<Animal> {
    return this.makeRequest<Animal>(`/v1/animals/${animalId}`);
  }

  /**
   * Обновление информации о животном
   */
  async updateAnimal(animalId: number, data: AnimalUpdateRequest): Promise<Animal> {
    return this.makeRequest<Animal>(`/v1/animals/${animalId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Удаление животного
   */
  async deleteAnimal(animalId: number): Promise<void> {
    await this.makeRequest<void>(`/v1/animals/${animalId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Получение животного со всеми транскрипциями
   */
  async getAnimalWithTranscriptions(animalId: number): Promise<{
    animal: Animal;
    transcriptions: Transcription[];
  }> {
    return this.makeRequest<{
      animal: Animal;
      transcriptions: Transcription[];
    }>(`/v1/animals/${animalId}/transcriptions`);
  }

  /**
   * Создание новой транскрипции
   */
  async createTranscription(data: TranscriptionCreateRequest): Promise<Transcription> {
    return this.makeRequest<Transcription>('/v1/animals/transcriptions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Обработка аудио файла и создание транскрипции
   */
  async processAudio(
    audioFile: File,
    animalId: number,
    description?: string
  ): Promise<Transcription> {
    const authHeaders = this.authService.getAuthHeader();
    
    const formData = new FormData();
    formData.append('audio_file', audioFile);
    formData.append('animal_id', animalId.toString());
    if (description) {
      formData.append('description', description);
    }

    const response = await fetch(`${this.baseUrl}/v1/animals/audio/process`, {
      method: 'POST',
      headers: {
        ...authHeaders,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ResponseSchema<Transcription> = await response.json();
    
    if (result.exception !== null && result.exception !== 0) {
      throw new Error(result.message || 'Audio processing failed');
    }

    return result.data as Transcription;
  }

  /**
   * Получение списка всех типов животных
   */
  async getAnimalTypes(): Promise<string[]> {
    const result = await this.makeRequest<{animal_types: string[], total_types: number}>('/v1/animals/types/list');
    return result.animal_types;
  }

  /**
   * Поиск животных по имени
   */
  async searchAnimalsByName(name: string): Promise<Animal[]> {
    const params = new URLSearchParams({ name });
    return this.makeRequest<Animal[]>(`/v1/animals/search/by-name?${params.toString()}`);
  }
}
