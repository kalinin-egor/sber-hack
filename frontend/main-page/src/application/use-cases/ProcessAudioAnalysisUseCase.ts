import { AudioAnalysis } from '../../domain/entities/AudioAnalysis';
import { AnalysisStatus } from '../../domain/value-objects/AnalysisStatus';
import { AudioAnalysisRepository } from '../../domain/repositories/AudioAnalysisRepository';
import { AudioProcessingRepository } from '../../domain/repositories/AudioProcessingRepository';

export class ProcessAudioAnalysisUseCase {
  constructor(
    private readonly audioAnalysisRepository: AudioAnalysisRepository,
    private readonly audioProcessingRepository: AudioProcessingRepository
  ) {}

  async execute(analysisId: string): Promise<AudioAnalysis> {
    const analysis = await this.audioAnalysisRepository.findById(analysisId);
    if (!analysis) {
      throw new Error(`Audio analysis with id ${analysisId} not found`);
    }

    if (!analysis.hasAudioSource()) {
      throw new Error('Analysis must have an audio source to process');
    }

    // Update status to processing
    const processingAnalysis = analysis.withStatus(AnalysisStatus.PROCESSING);
    await this.audioAnalysisRepository.save(processingAnalysis);

    try {
      // Process the audio
      const transcription = analysis.audioFile
        ? await this.audioProcessingRepository.transcribeAudio(analysis.audioFile)
        : await this.audioProcessingRepository.transcribeRecording(analysis.recordedAudio!);

      // Update with transcription result
      const completedAnalysis = processingAnalysis.withTranscription(transcription);
      return await this.audioAnalysisRepository.save(completedAnalysis);

    } catch (error) {
      // Update status to failed
      const failedAnalysis = processingAnalysis.withStatus(AnalysisStatus.FAILED);
      await this.audioAnalysisRepository.save(failedAnalysis);
      throw error;
    }
  }
}
