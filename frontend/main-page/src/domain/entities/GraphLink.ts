import { LinkType } from '../value-objects/LinkType';

export class GraphLink {
  constructor(
    public readonly id: string,
    public readonly sourceId: string,
    public readonly targetId: string,
    public readonly strength: number,
    public readonly type: LinkType,
    public readonly createdAt: Date
  ) {}

  static create(
    sourceId: string,
    targetId: string,
    strength: number,
    type: LinkType
  ): GraphLink {
    return new GraphLink(
      `${sourceId}-${targetId}`,
      sourceId,
      targetId,
      Math.max(0, Math.min(1, strength)), // Ensure strength is between 0 and 1
      type,
      new Date()
    );
  }

  withStrength(strength: number): GraphLink {
    return new GraphLink(
      this.id,
      this.sourceId,
      this.targetId,
      Math.max(0, Math.min(1, strength)),
      this.type,
      this.createdAt
    );
  }

  isStrongConnection(): boolean {
    return this.strength >= 0.7;
  }

  isMediumConnection(): boolean {
    return this.strength >= 0.4 && this.strength < 0.7;
  }

  isWeakConnection(): boolean {
    return this.strength < 0.4;
  }
}
