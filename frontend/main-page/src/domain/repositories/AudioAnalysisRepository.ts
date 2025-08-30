import { AudioAnalysis } from '../entities/AudioAnalysis';

export interface AudioAnalysisRepository {
  save(analysis: AudioAnalysis): Promise<AudioAnalysis>;
  findById(id: string): Promise<AudioAnalysis | null>;
  findAll(): Promise<AudioAnalysis[]>;
  findRecent(limit?: number): Promise<AudioAnalysis[]>;
  delete(id: string): Promise<void>;
  deleteAll(): Promise<void>;
}
