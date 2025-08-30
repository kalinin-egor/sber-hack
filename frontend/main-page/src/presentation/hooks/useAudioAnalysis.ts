import { useState, useCallback } from 'react';
import { container, AUDIO_ANALYSIS_SERVICE } from '../../shared/container';
import { AudioAnalysisService } from '../../application/services/AudioAnalysisService';
import { AudioAnalysisDto } from '../../application/dto/AudioAnalysisDto';

export interface UseAudioAnalysisResult {
  analyses: AudioAnalysisDto[];
  currentAnalysis: AudioAnalysisDto | null;
  isLoading: boolean;
  error: string | null;
  createFromFile: (file: File) => Promise<void>;
  createFromRecording: (audioBlob: Blob) => Promise<void>;
  processAnalysis: (analysisId: string) => Promise<void>;
  loadHistory: (limit?: number) => Promise<void>;
  clearError: () => void;
}

export function useAudioAnalysis(): UseAudioAnalysisResult {
  const [analyses, setAnalyses] = useState<AudioAnalysisDto[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState<AudioAnalysisDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioAnalysisService = container.resolve<AudioAnalysisService>(AUDIO_ANALYSIS_SERVICE);

  const createFromFile = useCallback(async (file: File) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const analysis = await audioAnalysisService.createFromFile(file);
      setCurrentAnalysis(analysis);
      setAnalyses(prev => [analysis, ...prev]);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create analysis from file');
    } finally {
      setIsLoading(false);
    }
  }, [audioAnalysisService]);

  const createFromRecording = useCallback(async (audioBlob: Blob) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const analysis = await audioAnalysisService.createFromRecording(audioBlob);
      setCurrentAnalysis(analysis);
      setAnalyses(prev => [analysis, ...prev]);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create analysis from recording');
    } finally {
      setIsLoading(false);
    }
  }, [audioAnalysisService]);

  const processAnalysis = useCallback(async (analysisId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const updatedAnalysis = await audioAnalysisService.processAnalysis(analysisId);
      
      setCurrentAnalysis(prev => 
        prev?.id === analysisId ? updatedAnalysis : prev
      );
      
      setAnalyses(prev => 
        prev.map(analysis => 
          analysis.id === analysisId ? updatedAnalysis : analysis
        )
      );
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process analysis');
    } finally {
      setIsLoading(false);
    }
  }, [audioAnalysisService]);

  const loadHistory = useCallback(async (limit?: number) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const history = await audioAnalysisService.getHistory(limit);
      setAnalyses(history);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setIsLoading(false);
    }
  }, [audioAnalysisService]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    analyses,
    currentAnalysis,
    isLoading,
    error,
    createFromFile,
    createFromRecording,
    processAnalysis,
    loadHistory,
    clearError
  };
}
