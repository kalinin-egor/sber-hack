import { NodeType } from '../../domain/value-objects/NodeType';
import { LinkType } from '../../domain/value-objects/LinkType';

export interface GraphDto {
  nodes: GraphNodeDto[];
  links: GraphLinkDto[];
}

export interface GraphNodeDto {
  id: string;
  label: string;
  type: NodeType;
  size: number;
  color: string;
  x: number;
  y: number;
  connections: string[];
  metadata: NodeMetadataDto;
}

export interface NodeMetadataDto {
  confidence: number;
  frequency: number;
  sentiment: string | null;
}

export interface GraphLinkDto {
  id: string;
  sourceId: string;
  targetId: string;
  strength: number;
  type: LinkType;
}
