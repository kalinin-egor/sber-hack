import { GraphNode } from '../../domain/entities/GraphNode';
import { Position } from '../../domain/value-objects/Position';
import { GraphData, GraphRepository } from '../../domain/repositories/GraphRepository';

export class UpdateGraphLayoutUseCase {
  constructor(
    private readonly graphRepository: GraphRepository
  ) {}

  async execute(input: UpdateGraphLayoutInput): Promise<GraphData> {
    const currentGraph = await this.graphRepository.loadGraph();
    
    let updatedNodes = currentGraph.nodes;

    if (input.randomizePositions) {
      updatedNodes = currentGraph.nodes.map(node => 
        node.withPosition(Position.random(input.canvasWidth || 800, input.canvasHeight || 600))
      );
    } else if (input.nodePositions) {
      updatedNodes = currentGraph.nodes.map(node => {
        const newPosition = input.nodePositions![node.id];
        return newPosition ? node.withPosition(newPosition) : node;
      });
    }

    const updatedGraph: GraphData = {
      nodes: updatedNodes,
      links: currentGraph.links
    };

    await this.graphRepository.saveGraph(updatedGraph);
    return updatedGraph;
  }
}

export interface UpdateGraphLayoutInput {
  randomizePositions?: boolean;
  nodePositions?: Record<string, Position>;
  canvasWidth?: number;
  canvasHeight?: number;
}
