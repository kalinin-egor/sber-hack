import { TranscriptionResult } from '../value-objects/TranscriptionResult';
import { AudioFile } from '../value-objects/AudioFile';

export interface AudioProcessingRepository {
  transcribeAudio(audioFile: AudioFile): Promise<TranscriptionResult>;
  transcribeRecording(audioBlob: Blob): Promise<TranscriptionResult>;
  isProcessingSupported(): boolean;
  getSupportedFormats(): string[];
}
