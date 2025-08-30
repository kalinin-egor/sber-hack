export class TranscriptionResult {
  constructor(
    public readonly text: string,
    public readonly confidence: number,
    public readonly timestamp: string,
    public readonly duration: number,
    public readonly language: string
  ) {
    this.validateTranscription();
  }

  static create(
    text: string,
    confidence: number,
    duration: number,
    language: string = 'ru-RU'
  ): TranscriptionResult {
    return new TranscriptionResult(
      text,
      confidence,
      new Date().toLocaleString('ru-RU'),
      duration,
      language
    );
  }

  private validateTranscription(): void {
    if (this.confidence < 0 || this.confidence > 1) {
      throw new Error('Confidence must be between 0 and 1');
    }
    
    if (this.duration < 0) {
      throw new Error('Duration must be positive');
    }
    
    if (this.text.trim().length === 0) {
      throw new Error('Transcription text cannot be empty');
    }
  }

  getConfidencePercentage(): number {
    return Math.round(this.confidence * 100);
  }

  getFormattedDuration(): string {
    if (this.duration < 60) {
      return `${this.duration.toFixed(1)}с`;
    }
    
    const minutes = Math.floor(this.duration / 60);
    const seconds = Math.floor(this.duration % 60);
    return `${minutes}м ${seconds}с`;
  }

  isHighConfidence(): boolean {
    return this.confidence >= 0.8;
  }

  isMediumConfidence(): boolean {
    return this.confidence >= 0.6 && this.confidence < 0.8;
  }

  isLowConfidence(): boolean {
    return this.confidence < 0.6;
  }

  getTruncatedText(maxLength: number = 200): string {
    if (this.text.length <= maxLength) {
      return this.text;
    }
    return this.text.substring(0, maxLength) + '...';
  }
}
