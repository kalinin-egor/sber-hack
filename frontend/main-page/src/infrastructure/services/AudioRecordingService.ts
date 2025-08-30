export interface AudioRecordingConfig {
  sampleRate?: number;
  channels?: number;
  bitDepth?: number;
}

export interface RecordingState {
  isRecording: boolean;
  duration: number;
  audioLevel: number;
}

export class AudioRecordingService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private stream: MediaStream | null = null;
  private chunks: Blob[] = [];
  private animationFrame: number | null = null;
  
  private onStateChange?: (state: RecordingState) => void;
  private recordingStartTime: number = 0;
  private currentState: RecordingState = {
    isRecording: false,
    duration: 0,
    audioLevel: 0
  };

  constructor(config?: AudioRecordingConfig) {
    // Configuration can be used for future enhancements
  }

  setStateChangeCallback(callback: (state: RecordingState) => void): void {
    this.onStateChange = callback;
  }

  async startRecording(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Setup audio analysis for visualization
      this.audioContext = new AudioContext();
      this.analyser = this.audioContext.createAnalyser();
      const source = this.audioContext.createMediaStreamSource(this.stream);
      source.connect(this.analyser);
      this.analyser.fftSize = 256;

      // Setup media recorder
      this.mediaRecorder = new MediaRecorder(this.stream);
      this.chunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.chunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        this.stopAudioAnalysis();
      };

      this.mediaRecorder.start();
      this.recordingStartTime = Date.now();
      
      this.currentState.isRecording = true;
      this.updateAudioLevel();
      this.notifyStateChange();

    } catch (error) {
      console.error('Error starting recording:', error);
      throw new Error('Failed to start audio recording. Please check microphone permissions.');
    }
  }

  async stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || this.mediaRecorder.state !== 'recording') {
        reject(new Error('No active recording to stop'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.chunks, { type: 'audio/wav' });
        this.cleanup();
        resolve(audioBlob);
      };

      this.mediaRecorder.stop();
      this.currentState.isRecording = false;
      this.notifyStateChange();
    });
  }

  getCurrentState(): RecordingState {
    return { ...this.currentState };
  }

  private updateAudioLevel(): void {
    if (!this.analyser || !this.currentState.isRecording) {
      return;
    }

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);
    const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
    
    this.currentState.audioLevel = average / 255;
    this.currentState.duration = (Date.now() - this.recordingStartTime) / 1000;
    
    this.notifyStateChange();

    if (this.currentState.isRecording) {
      this.animationFrame = requestAnimationFrame(() => this.updateAudioLevel());
    }
  }

  private stopAudioAnalysis(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.analyser = null;
  }

  private cleanup(): void {
    this.stopAudioAnalysis();

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    this.mediaRecorder = null;
    this.chunks = [];
    
    this.currentState = {
      isRecording: false,
      duration: 0,
      audioLevel: 0
    };
    
    this.notifyStateChange();
  }

  private notifyStateChange(): void {
    if (this.onStateChange) {
      this.onStateChange({ ...this.currentState });
    }
  }

  dispose(): void {
    if (this.currentState.isRecording) {
      this.stopRecording().catch(console.error);
    }
    this.cleanup();
  }
}
