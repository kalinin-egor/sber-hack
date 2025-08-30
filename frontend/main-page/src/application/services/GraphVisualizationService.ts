import { GraphDto } from '../dto/GraphDto';
import { GenerateGraphVisualizationUseCase } from '../use-cases/GenerateGraphVisualizationUseCase';
import { UpdateGraphLayoutUseCase } from '../use-cases/UpdateGraphLayoutUseCase';
import { GraphData } from '../../domain/repositories/GraphRepository';
import { Position } from '../../domain/value-objects/Position';

export class GraphVisualizationService {
  constructor(
    private readonly generateGraphVisualizationUseCase: GenerateGraphVisualizationUseCase,
    private readonly updateGraphLayoutUseCase: UpdateGraphLayoutUseCase
  ) {}

  async generateGraph(transcriptionIds?: string[]): Promise<GraphDto> {
    const graphData = transcriptionIds && transcriptionIds.length > 0
      ? await this.generateGraphVisualizationUseCase.execute({ transcriptionIds })
      : await this.generateGraphVisualizationUseCase.execute({ useAllTranscriptions: true });
    
    return this.toDto(graphData);
  }

  async randomizeLayout(canvasWidth: number, canvasHeight: number): Promise<GraphDto> {
    const graphData = await this.updateGraphLayoutUseCase.execute({
      randomizePositions: true,
      canvasWidth,
      canvasHeight
    });
    
    return this.toDto(graphData);
  }

  async updateNodePositions(nodePositions: Record<string, { x: number; y: number }>): Promise<GraphDto> {
    const positions: Record<string, Position> = {};
    
    for (const [nodeId, pos] of Object.entries(nodePositions)) {
      positions[nodeId] = Position.create(pos.x, pos.y);
    }
    
    const graphData = await this.updateGraphLayoutUseCase.execute({ nodePositions: positions });
    return this.toDto(graphData);
  }

  private toDto(graphData: GraphData): GraphDto {
    return {
      nodes: graphData.nodes.map(node => ({
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
      links: graphData.links.map(link => ({
        id: link.id,
        sourceId: link.sourceId,
        targetId: link.targetId,
        strength: link.strength,
        type: link.type
      }))
    };
  }
}
