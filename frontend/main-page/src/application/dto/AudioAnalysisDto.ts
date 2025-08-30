import { AnalysisStatus } from '../../domain/value-objects/AnalysisStatus';

export interface AudioAnalysisDto {
  id: string;
  audioFileName?: string;
  audioFileSize?: number;
  hasRecordedAudio: boolean;
  transcription?: TranscriptionDto;
  status: AnalysisStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TranscriptionDto {
  text: string;
  confidence: number;
  timestamp: string;
  duration: number;
  language: string;
}
