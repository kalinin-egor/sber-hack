import { AudioFile } from '../value-objects/AudioFile';
import { TranscriptionResult } from '../value-objects/TranscriptionResult';
import { AnalysisStatus } from '../value-objects/AnalysisStatus';

export class AudioAnalysis {
  constructor(
    public readonly id: string,
    public readonly audioFile: AudioFile | null,
    public readonly recordedAudio: Blob | null,
    public readonly transcription: TranscriptionResult | null,
    public readonly status: AnalysisStatus,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static create(audioFile?: AudioFile, recordedAudio?: Blob): AudioAnalysis {
    return new AudioAnalysis(
      crypto.randomUUID(),
      audioFile || null,
      recordedAudio || null,
      null,
      AnalysisStatus.PENDING,
      new Date(),
      new Date()
    );
  }

  withTranscription(transcription: TranscriptionResult): AudioAnalysis {
    return new AudioAnalysis(
      this.id,
      this.audioFile,
      this.recordedAudio,
      transcription,
      AnalysisStatus.COMPLETED,
      this.createdAt,
      new Date()
    );
  }

  withStatus(status: AnalysisStatus): AudioAnalysis {
    return new AudioAnalysis(
      this.id,
      this.audioFile,
      this.recordedAudio,
      this.transcription,
      status,
      this.createdAt,
      new Date()
    );
  }

  hasAudioSource(): boolean {
    return this.audioFile !== null || this.recordedAudio !== null;
  }

  isCompleted(): boolean {
    return this.status === AnalysisStatus.COMPLETED && this.transcription !== null;
  }

  isProcessing(): boolean {
    return this.status === AnalysisStatus.PROCESSING;
  }
}
