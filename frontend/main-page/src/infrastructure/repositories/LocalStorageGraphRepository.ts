import { GraphData, GraphRepository } from '../../domain/repositories/GraphRepository';
import { GraphNode } from '../../domain/entities/GraphNode';
import { GraphLink } from '../../domain/entities/GraphLink';
import { NodeType } from '../../domain/value-objects/NodeType';
import { LinkType } from '../../domain/value-objects/LinkType';
import { Position } from '../../domain/value-objects/Position';
import { NodeMetadata } from '../../domain/value-objects/NodeMetadata';

interface StoredGraphData {
  nodes: StoredGraphNode[];
  links: StoredGraphLink[];
}

interface StoredGraphNode {
  id: string;
  label: string;
  type: NodeType;
  size: number;
  color: string;
  x: number;
  y: number;
  connections: string[];
  metadata: {
    confidence: number;
    frequency: number;
    sentiment: string | null;
  };
}

interface StoredGraphLink {
  id: string;
  sourceId: string;
  targetId: string;
  strength: number;
  type: LinkType;
  createdAt: string;
}

export class LocalStorageGraphRepository implements GraphRepository {
  private readonly storageKey = 'graphData';

  async saveGraph(data: GraphData): Promise<void> {
    const storedData: StoredGraphData = {
      nodes: data.nodes.map(node => ({
        id: node.id,
        label: node.label,
        type: node.type,
        size: node.size,
        color: node.color,
        x: node.position.x,
        y: node.position.y,
        connections: node.connections,
        metadata: {
          confidence: node.metadata.confidence,
          frequency: node.metadata.frequency,
          sentiment: node.metadata.sentiment
        }
      })),
      links: data.links.map(link => ({
        id: link.id,
        sourceId: link.sourceId,
        targetId: link.targetId,
        strength: link.strength,
        type: link.type,
        createdAt: link.createdAt.toISOString()
      }))
    };

    localStorage.setItem(this.storageKey, JSON.stringify(storedData));
  }

  async loadGraph(): Promise<GraphData> {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return this.getDefaultGraph();

      const data: StoredGraphData = JSON.parse(stored);
      
      const nodes = data.nodes.map(node => new GraphNode(
        node.id,
        node.label,
        node.type,
        node.size,
        node.color,
        Position.create(node.x, node.y),
        node.connections,
        new NodeMetadata(
          node.metadata.confidence,
          node.metadata.frequency,
          node.metadata.sentiment
        )
      ));

      const links = data.links.map(link => new GraphLink(
        link.id,
        link.sourceId,
        link.targetId,
        link.strength,
        link.type,
        new Date(link.createdAt)
      ));

      return { nodes, links };
    } catch {
      return this.getDefaultGraph();
    }
  }

  async generateFromTranscription(transcriptionId: string): Promise<GraphData> {
    // This is a mock implementation that generates sample graph data
    // In a real implementation, this would analyze the transcription text
    // and extract keywords, topics, emotions, etc.
    
    const sampleNodes = [
      GraphNode.create(
        `text-${transcriptionId}`,
        'Анализ аудио',
        NodeType.TEXT,
        Position.create(400, 300),
        { confidence: 0.95 }
      ),
      GraphNode.create(
        `keyword1-${transcriptionId}`,
        'Качество',
        NodeType.KEYWORD,
        Position.create(200, 200),
        { frequency: 12, confidence: 0.87 }
      ),
      GraphNode.create(
        `emotion1-${transcriptionId}`,
        'Позитивное',
        NodeType.EMOTION,
        Position.create(300, 450),
        { sentiment: 'positive', confidence: 0.82 }
      ),
      GraphNode.create(
        `topic1-${transcriptionId}`,
        'Технологии',
        NodeType.TOPIC,
        Position.create(150, 100),
        { confidence: 0.89 }
      )
    ];

    const sampleLinks = [
      GraphLink.create(`text-${transcriptionId}`, `keyword1-${transcriptionId}`, 0.9, LinkType.CONTAINS),
      GraphLink.create(`text-${transcriptionId}`, `emotion1-${transcriptionId}`, 0.7, LinkType.EXPRESSES),
      GraphLink.create(`keyword1-${transcriptionId}`, `topic1-${transcriptionId}`, 0.6, LinkType.BELONGS_TO)
    ];

    return { nodes: sampleNodes, links: sampleLinks };
  }

  async clearGraph(): Promise<void> {
    localStorage.removeItem(this.storageKey);
  }

  private getDefaultGraph(): GraphData {
    const sampleNodes = [
      GraphNode.create(
        'text1',
        'Анализ аудио',
        NodeType.TEXT,
        Position.create(400, 300),
        { confidence: 0.95 }
      ),
      GraphNode.create(
        'keyword1',
        'Качество',
        NodeType.KEYWORD,
        Position.create(200, 200),
        { frequency: 12, confidence: 0.87 }
      ),
      GraphNode.create(
        'keyword2',
        'Система',
        NodeType.KEYWORD,
        Position.create(600, 200),
        { frequency: 18, confidence: 0.92 }
      ),
      GraphNode.create(
        'emotion1',
        'Позитивное',
        NodeType.EMOTION,
        Position.create(300, 450),
        { sentiment: 'positive', confidence: 0.82 }
      ),
      GraphNode.create(
        'topic1',
        'Технологии',
        NodeType.TOPIC,
        Position.create(150, 100),
        { confidence: 0.89 }
      ),
      GraphNode.create(
        'topic2',
        'Анализ данных',
        NodeType.TOPIC,
        Position.create(650, 100),
        { confidence: 0.91 }
      )
    ];

    const sampleLinks = [
      GraphLink.create('text1', 'keyword1', 0.9, LinkType.CONTAINS),
      GraphLink.create('text1', 'keyword2', 0.8, LinkType.CONTAINS),
      GraphLink.create('text1', 'emotion1', 0.7, LinkType.EXPRESSES),
      GraphLink.create('keyword1', 'topic1', 0.6, LinkType.BELONGS_TO),
      GraphLink.create('keyword2', 'topic2', 0.7, LinkType.BELONGS_TO)
    ];

    return { nodes: sampleNodes, links: sampleLinks };
  }
}
