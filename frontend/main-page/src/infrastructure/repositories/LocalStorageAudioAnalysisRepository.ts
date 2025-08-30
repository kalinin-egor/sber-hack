import { AudioAnalysis } from '../../domain/entities/AudioAnalysis';
import { AudioAnalysisRepository } from '../../domain/repositories/AudioAnalysisRepository';
import { AudioFile } from '../../domain/value-objects/AudioFile';
import { TranscriptionResult } from '../../domain/value-objects/TranscriptionResult';
import { AnalysisStatus } from '../../domain/value-objects/AnalysisStatus';

interface StoredAudioAnalysis {
  id: string;
  audioFileName?: string;
  audioFileSize?: number;
  audioFileType?: string;
  hasRecordedAudio: boolean;
  transcription?: {
    text: string;
    confidence: number;
    timestamp: string;
    duration: number;
    language: string;
  };
  status: AnalysisStatus;
  createdAt: string;
  updatedAt: string;
}

export class LocalStorageAudioAnalysisRepository implements AudioAnalysisRepository {
  private readonly storageKey = 'audioAnalyses';

  async save(analysis: AudioAnalysis): Promise<AudioAnalysis> {
    const stored = this.getStoredAnalyses();
    const existingIndex = stored.findIndex(a => a.id === analysis.id);
    
    const storedAnalysis: StoredAudioAnalysis = {
      id: analysis.id,
      audioFileName: analysis.audioFile?.name,
      audioFileSize: analysis.audioFile?.size,
      audioFileType: analysis.audioFile?.type,
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

    if (existingIndex >= 0) {
      stored[existingIndex] = storedAnalysis;
    } else {
      stored.push(storedAnalysis);
    }

    localStorage.setItem(this.storageKey, JSON.stringify(stored));
    return analysis;
  }

  async findById(id: string): Promise<AudioAnalysis | null> {
    const stored = this.getStoredAnalyses();
    const found = stored.find(a => a.id === id);
    
    if (!found) return null;
    
    return this.fromStored(found);
  }

  async findAll(): Promise<AudioAnalysis[]> {
    const stored = this.getStoredAnalyses();
    return stored.map(s => this.fromStored(s));
  }

  async findRecent(limit: number = 10): Promise<AudioAnalysis[]> {
    const stored = this.getStoredAnalyses();
    const sorted = stored
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, limit);
    
    return sorted.map(s => this.fromStored(s));
  }

  async delete(id: string): Promise<void> {
    const stored = this.getStoredAnalyses();
    const filtered = stored.filter(a => a.id !== id);
    localStorage.setItem(this.storageKey, JSON.stringify(filtered));
  }

  async deleteAll(): Promise<void> {
    localStorage.removeItem(this.storageKey);
  }

  private getStoredAnalyses(): StoredAudioAnalysis[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private fromStored(stored: StoredAudioAnalysis): AudioAnalysis {
    let audioFile: AudioFile | null = null;
    if (stored.audioFileName && stored.audioFileSize && stored.audioFileType) {
      // Create a mock File object for stored file info
      const file = new File([], stored.audioFileName, { type: stored.audioFileType });
      Object.defineProperty(file, 'size', { value: stored.audioFileSize });
      audioFile = AudioFile.fromFile(file);
    }

    let transcription: TranscriptionResult | null = null;
    if (stored.transcription) {
      transcription = TranscriptionResult.create(
        stored.transcription.text,
        stored.transcription.confidence,
        stored.transcription.duration,
        stored.transcription.language
      );
    }

    return new AudioAnalysis(
      stored.id,
      audioFile,
      stored.hasRecordedAudio ? new Blob() : null, // Blob data is not persisted
      transcription,
      stored.status,
      new Date(stored.createdAt),
      new Date(stored.updatedAt)
    );
  }
}
