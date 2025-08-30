import { GraphData, GraphRepository } from '../../domain/repositories/GraphRepository';
import { AudioAnalysisRepository } from '../../domain/repositories/AudioAnalysisRepository';

export class GenerateGraphVisualizationUseCase {
  constructor(
    private readonly graphRepository: GraphRepository,
    private readonly audioAnalysisRepository: AudioAnalysisRepository
  ) {}

  async execute(input: GenerateGraphVisualizationInput): Promise<GraphData> {
    if (input.transcriptionIds && input.transcriptionIds.length > 0) {
      // Generate graph from specific transcriptions
      const graphData: GraphData = { nodes: [], links: [] };
      
      for (const transcriptionId of input.transcriptionIds) {
        const transcriptionGraph = await this.graphRepository.generateFromTranscription(transcriptionId);
        graphData.nodes.push(...transcriptionGraph.nodes);
        graphData.links.push(...transcriptionGraph.links);
      }
      
      return graphData;
    }

    if (input.useAllTranscriptions) {
      // Generate graph from all available transcriptions
      const allAnalyses = await this.audioAnalysisRepository.findAll();
      const completedAnalyses = allAnalyses.filter(analysis => analysis.isCompleted());
      
      const graphData: GraphData = { nodes: [], links: [] };
      
      for (const analysis of completedAnalyses) {
        const transcriptionGraph = await this.graphRepository.generateFromTranscription(analysis.id);
        graphData.nodes.push(...transcriptionGraph.nodes);
        graphData.links.push(...transcriptionGraph.links);
      }
      
      return graphData;
    }

    // Return existing graph or empty graph
    return await this.graphRepository.loadGraph();
  }
}

export interface GenerateGraphVisualizationInput {
  transcriptionIds?: string[];
  useAllTranscriptions?: boolean;
}
