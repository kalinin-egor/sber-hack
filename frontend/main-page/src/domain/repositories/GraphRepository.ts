import { GraphNode } from '../entities/GraphNode';
import { GraphLink } from '../entities/GraphLink';

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface GraphRepository {
  saveGraph(data: GraphData): Promise<void>;
  loadGraph(): Promise<GraphData>;
  generateFromTranscription(transcriptionId: string): Promise<GraphData>;
  clearGraph(): Promise<void>;
}
