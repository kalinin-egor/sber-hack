import React, { useState, useEffect, useCallback } from 'react';
import { container, AUDIO_RECORDING_SERVICE } from '../../shared/container';
import { AudioRecordingService, RecordingState } from '../../infrastructure/services/AudioRecordingService';

export interface UseAudioRecordingResult {
  recordingState: RecordingState;
  isSupported: boolean;
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<Blob>;
  clearError: () => void;
}

export function useAudioRecording(): UseAudioRecordingResult {
  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    duration: 0,
    audioLevel: 0
  });
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioRecordingService = container.resolve<AudioRecordingService>(AUDIO_RECORDING_SERVICE);

  useEffect(() => {
    // Check if audio recording is supported
    setIsSupported(!!navigator.mediaDevices && !!navigator.mediaDevices.getUserMedia);

    // Setup state change callback
    audioRecordingService.setStateChangeCallback(setRecordingState);

    return () => {
      audioRecordingService.dispose();
    };
  }, [audioRecordingService]);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      await audioRecordingService.startRecording();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start recording');
    }
  }, [audioRecordingService]);

  const stopRecording = useCallback(async (): Promise<Blob> => {
    try {
      setError(null);
      return await audioRecordingService.stopRecording();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop recording');
      throw err;
    }
  }, [audioRecordingService]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    recordingState,
    isSupported,
    error,
    startRecording,
    stopRecording,
    clearError
  };
}
