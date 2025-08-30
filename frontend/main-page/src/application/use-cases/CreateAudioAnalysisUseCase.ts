import { AudioAnalysis } from '../../domain/entities/AudioAnalysis';
import { AudioFile } from '../../domain/value-objects/AudioFile';
import { AudioAnalysisRepository } from '../../domain/repositories/AudioAnalysisRepository';

export class CreateAudioAnalysisUseCase {
  constructor(
    private readonly audioAnalysisRepository: AudioAnalysisRepository
  ) {}

  async execute(input: CreateAudioAnalysisInput): Promise<AudioAnalysis> {
    const analysis = input.audioFile 
      ? AudioAnalysis.create(input.audioFile)
      : AudioAnalysis.create(undefined, input.recordedAudio);

    return await this.audioAnalysisRepository.save(analysis);
  }
}

export interface CreateAudioAnalysisInput {
  audioFile?: AudioFile;
  recordedAudio?: Blob;
}
