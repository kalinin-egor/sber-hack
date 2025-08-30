import { DIContainer } from './DIContainer';
import * as Tokens from './ServiceTokens';

// Domain
import { AudioAnalysisRepository } from '../../domain/repositories/AudioAnalysisRepository';
import { GraphRepository } from '../../domain/repositories/GraphRepository';
import { AudioProcessingRepository } from '../../domain/repositories/AudioProcessingRepository';

// Application
import { CreateAudioAnalysisUseCase } from '../../application/use-cases/CreateAudioAnalysisUseCase';
import { ProcessAudioAnalysisUseCase } from '../../application/use-cases/ProcessAudioAnalysisUseCase';
import { GetAudioAnalysisHistoryUseCase } from '../../application/use-cases/GetAudioAnalysisHistoryUseCase';
import { GenerateGraphVisualizationUseCase } from '../../application/use-cases/GenerateGraphVisualizationUseCase';
import { UpdateGraphLayoutUseCase } from '../../application/use-cases/UpdateGraphLayoutUseCase';
import { AudioAnalysisService } from '../../application/services/AudioAnalysisService';
import { GraphVisualizationService } from '../../application/services/GraphVisualizationService';

// Infrastructure
import { LocalStorageAudioAnalysisRepository } from '../../infrastructure/repositories/LocalStorageAudioAnalysisRepository';
import { LocalStorageGraphRepository } from '../../infrastructure/repositories/LocalStorageGraphRepository';
import { MockAudioProcessingAdapter } from '../../infrastructure/adapters/MockAudioProcessingAdapter';
import { AudioRecordingService } from '../../infrastructure/services/AudioRecordingService';

export function configureContainer(): DIContainer {
  const container = new DIContainer();

  // Register repositories (singletons)
  container.register<AudioAnalysisRepository>(
    Tokens.AUDIO_ANALYSIS_REPOSITORY,
    LocalStorageAudioAnalysisRepository,
    { singleton: true }
  );

  container.register<GraphRepository>(
    Tokens.GRAPH_REPOSITORY,
    LocalStorageGraphRepository,
    { singleton: true }
  );

  container.register<AudioProcessingRepository>(
    Tokens.AUDIO_PROCESSING_REPOSITORY,
    MockAudioProcessingAdapter,
    { singleton: true }
  );

  // Register use cases
  container.register(
    Tokens.CREATE_AUDIO_ANALYSIS_USE_CASE,
    () => new CreateAudioAnalysisUseCase(
      container.resolve<AudioAnalysisRepository>(Tokens.AUDIO_ANALYSIS_REPOSITORY)
    )
  );

  container.register(
    Tokens.PROCESS_AUDIO_ANALYSIS_USE_CASE,
    () => new ProcessAudioAnalysisUseCase(
      container.resolve<AudioAnalysisRepository>(Tokens.AUDIO_ANALYSIS_REPOSITORY),
      container.resolve<AudioProcessingRepository>(Tokens.AUDIO_PROCESSING_REPOSITORY)
    )
  );

  container.register(
    Tokens.GET_AUDIO_ANALYSIS_HISTORY_USE_CASE,
    () => new GetAudioAnalysisHistoryUseCase(
      container.resolve<AudioAnalysisRepository>(Tokens.AUDIO_ANALYSIS_REPOSITORY)
    )
  );

  container.register(
    Tokens.GENERATE_GRAPH_VISUALIZATION_USE_CASE,
    () => new GenerateGraphVisualizationUseCase(
      container.resolve<GraphRepository>(Tokens.GRAPH_REPOSITORY),
      container.resolve<AudioAnalysisRepository>(Tokens.AUDIO_ANALYSIS_REPOSITORY)
    )
  );

  container.register(
    Tokens.UPDATE_GRAPH_LAYOUT_USE_CASE,
    () => new UpdateGraphLayoutUseCase(
      container.resolve<GraphRepository>(Tokens.GRAPH_REPOSITORY)
    )
  );

  // Register application services (singletons)
  container.register(
    Tokens.AUDIO_ANALYSIS_SERVICE,
    () => new AudioAnalysisService(
      container.resolve<CreateAudioAnalysisUseCase>(Tokens.CREATE_AUDIO_ANALYSIS_USE_CASE),
      container.resolve<ProcessAudioAnalysisUseCase>(Tokens.PROCESS_AUDIO_ANALYSIS_USE_CASE),
      container.resolve<GetAudioAnalysisHistoryUseCase>(Tokens.GET_AUDIO_ANALYSIS_HISTORY_USE_CASE)
    ),
    { singleton: true }
  );

  container.register(
    Tokens.GRAPH_VISUALIZATION_SERVICE,
    () => new GraphVisualizationService(
      container.resolve<GenerateGraphVisualizationUseCase>(Tokens.GENERATE_GRAPH_VISUALIZATION_USE_CASE),
      container.resolve<UpdateGraphLayoutUseCase>(Tokens.UPDATE_GRAPH_LAYOUT_USE_CASE)
    ),
    { singleton: true }
  );

  container.register(
    Tokens.AUDIO_RECORDING_SERVICE,
    AudioRecordingService,
    { singleton: true }
  );

  return container;
}
