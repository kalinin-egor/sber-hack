export class AudioFile {
  constructor(
    public readonly file: File,
    public readonly name: string,
    public readonly size: number,
    public readonly type: string,
    public readonly duration?: number
  ) {
    this.validateAudioFile();
  }

  static fromFile(file: File): AudioFile {
    return new AudioFile(
      file,
      file.name,
      file.size,
      file.type
    );
  }

  private validateAudioFile(): void {
    if (!this.type.startsWith('audio/')) {
      throw new Error('File must be an audio file');
    }
    
    if (this.size > 100 * 1024 * 1024) { // 100MB limit
      throw new Error('Audio file size must be less than 100MB');
    }
  }

  getSizeInMB(): number {
    return this.size / (1024 * 1024);
  }

  getSizeInKB(): number {
    return this.size / 1024;
  }

  getFormattedSize(): string {
    const sizeInMB = this.getSizeInMB();
    if (sizeInMB >= 1) {
      return `${sizeInMB.toFixed(2)} MB`;
    }
    return `${this.getSizeInKB().toFixed(1)} KB`;
  }

  isValidFormat(): boolean {
    const supportedFormats = [
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
      'audio/mp4',
      'audio/webm'
    ];
    return supportedFormats.includes(this.type);
  }
}
