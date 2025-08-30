export enum NodeType {
  TEXT = 'text',
  KEYWORD = 'keyword',
  EMOTION = 'emotion',
  TOPIC = 'topic'
}

export class NodeTypeHelper {
  static getDisplayName(type: NodeType): string {
    switch (type) {
      case NodeType.TEXT:
        return 'Текст';
      case NodeType.KEYWORD:
        return 'Ключевое слово';
      case NodeType.EMOTION:
        return 'Эмоция';
      case NodeType.TOPIC:
        return 'Тема';
      default:
        return 'Неизвестно';
    }
  }

  static getIcon(type: NodeType): string {
    switch (type) {
      case NodeType.TEXT:
        return '📄';
      case NodeType.KEYWORD:
        return '🔑';
      case NodeType.EMOTION:
        return '😊';
      case NodeType.TOPIC:
        return '📂';
      default:
        return '⚪';
    }
  }

  static getColor(type: NodeType): string {
    switch (type) {
      case NodeType.TEXT:
        return '#3b82f6';
      case NodeType.KEYWORD:
        return '#10b981';
      case NodeType.EMOTION:
        return '#f59e0b';
      case NodeType.TOPIC:
        return '#8b5cf6';
      default:
        return '#6b7280';
    }
  }

  static getDefaultSize(type: NodeType): number {
    switch (type) {
      case NodeType.TEXT:
        return 40;
      case NodeType.TOPIC:
        return 35;
      case NodeType.KEYWORD:
        return 25;
      case NodeType.EMOTION:
        return 20;
      default:
        return 20;
    }
  }
}
