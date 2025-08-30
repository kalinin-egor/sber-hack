import { NodeType } from '../value-objects/NodeType';
import { NodeMetadata } from '../value-objects/NodeMetadata';
import { Position } from '../value-objects/Position';

export class GraphNode {
  constructor(
    public readonly id: string,
    public readonly label: string,
    public readonly type: NodeType,
    public readonly size: number,
    public readonly color: string,
    public readonly position: Position,
    public readonly connections: string[],
    public readonly metadata: NodeMetadata
  ) {}

  static create(
    id: string,
    label: string,
    type: NodeType,
    position: Position,
    metadata?: Partial<NodeMetadata>
  ): GraphNode {
    const defaultSize = type === NodeType.TEXT ? 40 : 
                      type === NodeType.TOPIC ? 35 : 
                      type === NodeType.KEYWORD ? 25 : 20;

    const defaultColor = type === NodeType.TEXT ? '#3b82f6' :
                        type === NodeType.KEYWORD ? '#10b981' :
                        type === NodeType.EMOTION ? '#f59e0b' :
                        type === NodeType.TOPIC ? '#8b5cf6' : '#6b7280';

    return new GraphNode(
      id,
      label,
      type,
      defaultSize,
      defaultColor,
      position,
      [],
      new NodeMetadata(
        metadata?.confidence || 0,
        metadata?.frequency || 0,
        metadata?.sentiment || null
      )
    );
  }

  withConnection(connectionId: string): GraphNode {
    if (this.connections.includes(connectionId)) {
      return this;
    }

    return new GraphNode(
      this.id,
      this.label,
      this.type,
      this.size,
      this.color,
      this.position,
      [...this.connections, connectionId],
      this.metadata
    );
  }

  withPosition(position: Position): GraphNode {
    return new GraphNode(
      this.id,
      this.label,
      this.type,
      this.size,
      this.color,
      position,
      this.connections,
      this.metadata
    );
  }

  getTypeIcon(): string {
    switch (this.type) {
      case NodeType.TEXT: return '📄';
      case NodeType.KEYWORD: return '🔑';
      case NodeType.EMOTION: return '😊';
      case NodeType.TOPIC: return '📂';
      default: return '⚪';
    }
  }
}
