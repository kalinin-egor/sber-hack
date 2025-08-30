import { AudioProcessingRepository } from '../../domain/repositories/AudioProcessingRepository';
import { TranscriptionResult } from '../../domain/value-objects/TranscriptionResult';
import { AudioFile } from '../../domain/value-objects/AudioFile';

export class MockAudioProcessingAdapter implements AudioProcessingRepository {
  private readonly supportedFormats = [
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'audio/mp4',
    'audio/webm'
  ];

  async transcribeAudio(audioFile: AudioFile): Promise<TranscriptionResult> {
    // Simulate processing delay
    await this.simulateProcessingDelay();

    const mockText = `Анализ загруженного файла "${audioFile.name}": Это пример транскрипции аудио. Система обработала ваш файл и извлекла текст с высокой точностью. Благодарим за использование нашего сервиса анализа аудио.`;
    
    return TranscriptionResult.create(
      mockText,
      0.95,
      Math.random() * 60 + 30, // Random duration between 30-90 seconds
      'ru-RU'
    );
  }

  async transcribeRecording(audioBlob: Blob): Promise<TranscriptionResult> {
    // Simulate processing delay
    await this.simulateProcessingDelay();

    const mockText = "Анализ записанного аудио: Привет! Это тестовая запись, которая была обработана нашей системой анализа речи. Качество записи хорошее, текст распознан успешно.";
    
    return TranscriptionResult.create(
      mockText,
      0.92,
      15, // 15 seconds duration
      'ru-RU'
    );
  }

  isProcessingSupported(): boolean {
    return true;
  }

  getSupportedFormats(): string[] {
    return [...this.supportedFormats];
  }

  private async simulateProcessingDelay(): Promise<void> {
    // Simulate realistic processing time (3-5 seconds)
    const delay = Math.random() * 2000 + 3000;
    await new Promise(resolve => setTimeout(resolve, delay));
  }
}
