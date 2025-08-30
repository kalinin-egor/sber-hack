export enum AnalysisStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export class AnalysisStatusHelper {
  static getDisplayName(status: AnalysisStatus): string {
    switch (status) {
      case AnalysisStatus.PENDING:
        return 'Ожидает обработки';
      case AnalysisStatus.PROCESSING:
        return 'Обрабатывается';
      case AnalysisStatus.COMPLETED:
        return 'Завершено';
      case AnalysisStatus.FAILED:
        return 'Ошибка';
      case AnalysisStatus.CANCELLED:
        return 'Отменено';
      default:
        return 'Неизвестно';
    }
  }

  static getIcon(status: AnalysisStatus): string {
    switch (status) {
      case AnalysisStatus.PENDING:
        return '⏳';
      case AnalysisStatus.PROCESSING:
        return '⚙️';
      case AnalysisStatus.COMPLETED:
        return '✅';
      case AnalysisStatus.FAILED:
        return '❌';
      case AnalysisStatus.CANCELLED:
        return '🚫';
      default:
        return '❓';
    }
  }

  static getColor(status: AnalysisStatus): string {
    switch (status) {
      case AnalysisStatus.PENDING:
        return 'text-yellow-600';
      case AnalysisStatus.PROCESSING:
        return 'text-blue-600';
      case AnalysisStatus.COMPLETED:
        return 'text-green-600';
      case AnalysisStatus.FAILED:
        return 'text-red-600';
      case AnalysisStatus.CANCELLED:
        return 'text-gray-600';
      default:
        return 'text-gray-400';
    }
  }

  static canTransitionTo(from: AnalysisStatus, to: AnalysisStatus): boolean {
    const validTransitions: Record<AnalysisStatus, AnalysisStatus[]> = {
      [AnalysisStatus.PENDING]: [AnalysisStatus.PROCESSING, AnalysisStatus.CANCELLED],
      [AnalysisStatus.PROCESSING]: [AnalysisStatus.COMPLETED, AnalysisStatus.FAILED, AnalysisStatus.CANCELLED],
      [AnalysisStatus.COMPLETED]: [],
      [AnalysisStatus.FAILED]: [AnalysisStatus.PENDING],
      [AnalysisStatus.CANCELLED]: [AnalysisStatus.PENDING]
    };

    return validTransitions[from].includes(to);
  }
}
