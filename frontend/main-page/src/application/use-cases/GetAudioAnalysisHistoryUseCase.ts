import { AudioAnalysis } from '../../domain/entities/AudioAnalysis';
import { AudioAnalysisRepository } from '../../domain/repositories/AudioAnalysisRepository';

export class GetAudioAnalysisHistoryUseCase {
  constructor(
    private readonly audioAnalysisRepository: AudioAnalysisRepository
  ) {}

  async execute(input?: GetAudioAnalysisHistoryInput): Promise<AudioAnalysis[]> {
    if (input?.limit) {
      return await this.audioAnalysisRepository.findRecent(input.limit);
    }
    
    return await this.audioAnalysisRepository.findAll();
  }
}

export interface GetAudioAnalysisHistoryInput {
  limit?: number;
}
