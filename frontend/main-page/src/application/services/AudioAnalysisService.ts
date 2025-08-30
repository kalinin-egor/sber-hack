import { AudioAnalysisDto } from '../dto/AudioAnalysisDto';
import { CreateAudioAnalysisUseCase } from '../use-cases/CreateAudioAnalysisUseCase';
import { ProcessAudioAnalysisUseCase } from '../use-cases/ProcessAudioAnalysisUseCase';
import { GetAudioAnalysisHistoryUseCase } from '../use-cases/GetAudioAnalysisHistoryUseCase';
import { AudioFile } from '../../domain/value-objects/AudioFile';
import { AudioAnalysis } from '../../domain/entities/AudioAnalysis';

export class AudioAnalysisService {
  constructor(
    private readonly createAudioAnalysisUseCase: CreateAudioAnalysisUseCase,
    private readonly processAudioAnalysisUseCase: ProcessAudioAnalysisUseCase,
    private readonly getAudioAnalysisHistoryUseCase: GetAudioAnalysisHistoryUseCase
  ) {}

  async createFromFile(file: File): Promise<AudioAnalysisDto> {
    const audioFile = AudioFile.fromFile(file);
    const analysis = await this.createAudioAnalysisUseCase.execute({ audioFile });
    return this.toDto(analysis);
  }

  async createFromRecording(audioBlob: Blob): Promise<AudioAnalysisDto> {
    const analysis = await this.createAudioAnalysisUseCase.execute({ recordedAudio: audioBlob });
    return this.toDto(analysis);
  }

  async processAnalysis(analysisId: string): Promise<AudioAnalysisDto> {
    const analysis = await this.processAudioAnalysisUseCase.execute(analysisId);
    return this.toDto(analysis);
  }

  async getHistory(limit?: number): Promise<AudioAnalysisDto[]> {
    const analyses = await this.getAudioAnalysisHistoryUseCase.execute({ limit });
    return analyses.map(analysis => this.toDto(analysis));
  }

  private toDto(analysis: AudioAnalysis): AudioAnalysisDto {
    return {
      id: analysis.id,
      audioFileName: analysis.audioFile?.name,
      audioFileSize: analysis.audioFile?.size,
      hasRecordedAudio: analysis.recordedAudio !== null,
      transcription: analysis.transcription ? {
        text: analysis.transcription.text,
        confidence: analysis.transcription.confidence,
        timestamp: analysis.transcription.timestamp,
        duration: analysis.transcription.duration,
        language: analysis.transcription.language
      } : undefined,
      status: analysis.status,
      createdAt: analysis.createdAt.toISOString(),
      updatedAt: analysis.updatedAt.toISOString()
    };
  }
}
