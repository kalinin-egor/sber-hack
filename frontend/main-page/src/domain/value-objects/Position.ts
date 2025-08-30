export class Position {
  constructor(
    public readonly x: number,
    public readonly y: number
  ) {
    this.validatePosition();
  }

  static create(x: number, y: number): Position {
    return new Position(x, y);
  }

  static random(maxX: number, maxY: number, padding: number = 50): Position {
    return new Position(
      Math.random() * (maxX - padding * 2) + padding,
      Math.random() * (maxY - padding * 2) + padding
    );
  }

  static center(width: number, height: number): Position {
    return new Position(width / 2, height / 2);
  }

  private validatePosition(): void {
    if (!Number.isFinite(this.x) || !Number.isFinite(this.y)) {
      throw new Error('Position coordinates must be finite numbers');
    }
  }

  distanceTo(other: Position): number {
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  add(other: Position): Position {
    return new Position(this.x + other.x, this.y + other.y);
  }

  subtract(other: Position): Position {
    return new Position(this.x - other.x, this.y - other.y);
  }

  multiply(scalar: number): Position {
    return new Position(this.x * scalar, this.y * scalar);
  }

  normalize(): Position {
    const magnitude = Math.sqrt(this.x * this.x + this.y * this.y);
    if (magnitude === 0) return new Position(0, 0);
    return new Position(this.x / magnitude, this.y / magnitude);
  }

  isWithinBounds(width: number, height: number, margin: number = 0): boolean {
    return this.x >= margin && 
           this.x <= width - margin && 
           this.y >= margin && 
           this.y <= height - margin;
  }
}
