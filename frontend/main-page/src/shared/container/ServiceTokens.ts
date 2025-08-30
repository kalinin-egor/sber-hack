// Repository tokens
export const AUDIO_ANALYSIS_REPOSITORY = Symbol('AudioAnalysisRepository');
export const GRAPH_REPOSITORY = Symbol('GraphRepository');
export const AUDIO_PROCESSING_REPOSITORY = Symbol('AudioProcessingRepository');

// Use case tokens
export const CREATE_AUDIO_ANALYSIS_USE_CASE = Symbol('CreateAudioAnalysisUseCase');
export const PROCESS_AUDIO_ANALYSIS_USE_CASE = Symbol('ProcessAudioAnalysisUseCase');
export const GET_AUDIO_ANALYSIS_HISTORY_USE_CASE = Symbol('GetAudioAnalysisHistoryUseCase');
export const GENERATE_GRAPH_VISUALIZATION_USE_CASE = Symbol('GenerateGraphVisualizationUseCase');
export const UPDATE_GRAPH_LAYOUT_USE_CASE = Symbol('UpdateGraphLayoutUseCase');

// Service tokens
export const AUDIO_ANALYSIS_SERVICE = Symbol('AudioAnalysisService');
export const GRAPH_VISUALIZATION_SERVICE = Symbol('GraphVisualizationService');
export const AUDIO_RECORDING_SERVICE = Symbol('AudioRecordingService');
