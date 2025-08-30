export class NodeMetadata {
  constructor(
    public readonly confidence: number,
    public readonly frequency: number,
    public readonly sentiment: string | null
  ) {
    this.validateMetadata();
  }

  static create(
    confidence: number = 0,
    frequency: number = 0,
    sentiment: string | null = null
  ): NodeMetadata {
    return new NodeMetadata(confidence, frequency, sentiment);
  }

  private validateMetadata(): void {
    if (this.confidence < 0 || this.confidence > 1) {
      throw new Error('Confidence must be between 0 and 1');
    }
    
    if (this.frequency < 0) {
      throw new Error('Frequency must be non-negative');
    }
  }

  getConfidencePercentage(): number {
    return Math.round(this.confidence * 100);
  }

  hasHighConfidence(): boolean {
    return this.confidence >= 0.8;
  }

  hasMediumConfidence(): boolean {
    return this.confidence >= 0.6 && this.confidence < 0.8;
  }

  hasLowConfidence(): boolean {
    return this.confidence < 0.6;
  }

  isFrequent(): boolean {
    return this.frequency >= 10;
  }

  getSentimentIcon(): string {
    if (!this.sentiment) return '😐';
    
    switch (this.sentiment.toLowerCase()) {
      case 'positive':
        return '😊';
      case 'negative':
        return '😞';
      case 'neutral':
        return '😐';
      default:
        return '😐';
    }
  }
}
