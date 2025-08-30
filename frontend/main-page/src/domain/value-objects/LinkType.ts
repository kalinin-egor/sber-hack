export enum LinkType {
  CONTAINS = 'contains',
  EXPRESSES = 'expresses',
  BELONGS_TO = 'belongs_to',
  RELATES_TO = 'relates_to',
  SIMILAR_TO = 'similar_to'
}

export class LinkTypeHelper {
  static getDisplayName(type: LinkType): string {
    switch (type) {
      case LinkType.CONTAINS:
        return 'Содержит';
      case LinkType.EXPRESSES:
        return 'Выражает';
      case LinkType.BELONGS_TO:
        return 'Принадлежит';
      case LinkType.RELATES_TO:
        return 'Связано с';
      case LinkType.SIMILAR_TO:
        return 'Похоже на';
      default:
        return 'Неизвестно';
    }
  }

  static getColor(type: LinkType): string {
    switch (type) {
      case LinkType.CONTAINS:
        return '#3b82f6';
      case LinkType.EXPRESSES:
        return '#f59e0b';
      case LinkType.BELONGS_TO:
        return '#8b5cf6';
      case LinkType.RELATES_TO:
        return '#10b981';
      case LinkType.SIMILAR_TO:
        return '#ec4899';
      default:
        return '#6b7280';
    }
  }

  static getStrokeWidth(type: LinkType, baseWidth: number = 2): number {
    switch (type) {
      case LinkType.CONTAINS:
        return baseWidth * 1.5;
      case LinkType.EXPRESSES:
        return baseWidth * 1.2;
      case LinkType.BELONGS_TO:
        return baseWidth * 1.3;
      case LinkType.RELATES_TO:
        return baseWidth;
      case LinkType.SIMILAR_TO:
        return baseWidth * 0.8;
      default:
        return baseWidth;
    }
  }
}
