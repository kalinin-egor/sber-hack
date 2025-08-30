import React, { useState, useCallback } from 'react';
import { container, GRAPH_VISUALIZATION_SERVICE } from '../../shared/container';
import { GraphVisualizationService } from '../../application/services/GraphVisualizationService';
import { GraphDto } from '../../application/dto/GraphDto';

export interface UseGraphVisualizationResult {
  graphData: GraphDto | null;
  selectedNode: GraphDto['nodes'][0] | null;
  isLoading: boolean;
  error: string | null;
  generateGraph: (transcriptionIds?: string[]) => Promise<void>;
  randomizeLayout: (canvasWidth: number, canvasHeight: number) => Promise<void>;
  updateNodePositions: (nodePositions: Record<string, { x: number; y: number }>) => Promise<void>;
  selectNode: (node: GraphDto['nodes'][0] | null) => void;
  clearError: () => void;
}

export function useGraphVisualization(): UseGraphVisualizationResult {
  const [graphData, setGraphData] = useState<GraphDto | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphDto['nodes'][0] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const graphVisualizationService = container.resolve<GraphVisualizationService>(GRAPH_VISUALIZATION_SERVICE);

  const generateGraph = useCallback(async (transcriptionIds?: string[]) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const graph = await graphVisualizationService.generateGraph(transcriptionIds);
      setGraphData(graph);
      setSelectedNode(null);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate graph');
    } finally {
      setIsLoading(false);
    }
  }, [graphVisualizationService]);

  const randomizeLayout = useCallback(async (canvasWidth: number, canvasHeight: number) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const graph = await graphVisualizationService.randomizeLayout(canvasWidth, canvasHeight);
      setGraphData(graph);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to randomize layout');
    } finally {
      setIsLoading(false);
    }
  }, [graphVisualizationService]);

  const updateNodePositions = useCallback(async (nodePositions: Record<string, { x: number; y: number }>) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const graph = await graphVisualizationService.updateNodePositions(nodePositions);
      setGraphData(graph);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update node positions');
    } finally {
      setIsLoading(false);
    }
  }, [graphVisualizationService]);

  const selectNode = useCallback((node: GraphDto['nodes'][0] | null) => {
    setSelectedNode(node);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    graphData,
    selectedNode,
    isLoading,
    error,
    generateGraph,
    randomizeLayout,
    updateNodePositions,
    selectNode,
    clearError
  };
}
