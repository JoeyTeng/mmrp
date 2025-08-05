import type { Node, Edge } from "@xyflow/react";
import { ParamValueType, NodeType, FormatDefinition } from "@/types/module";

export type NodeParamValue = ParamValueType | string[];

export type NodeData = {
  name: string;
  moduleClass: string;
  parameters: ModuleParameter[]; // constraint to ensure there's only one value
  inputFormats: FormatDefinition[];
  outputFormats: FormatDefinition[];
};

export interface ModuleParameter {
  name: string;
  metadata: ParameterMetadata;
}

export interface ParameterMetadata {
  value: ParamValueType;
  type: string;
  constraints: ParameterConstraint;
}

export interface ParameterConstraint {
  type: string;
  default: ParamValueType;
  min?: number;
  max?: number;
  options?: string[];
  required: boolean;
  description?: string;
}

export type ContextMenuItem<ActionType extends string> = {
  id: ActionType;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  dividerAfter?: boolean;
  submenu?: ContextMenuItem<ActionType>[];
  danger?: boolean;
};

export type FlowCanvasProps = {
  defaultNodes: Node<NodeData, NodeType>[];
  defaultEdges: Edge[];
  editingNode: Node<NodeData, NodeType> | null;
  onEditNode: (node: Node<NodeData, NodeType>) => void;
};

export interface ParameterConfigurationDrawerProps {
  editingNode: Node<NodeData, NodeType>;
  clearEditingNode: () => void;
}

export type ParameterConfigurationProps = {
  node: Node<NodeData, NodeType>;
  onParamChange: (key: string, value: ParamValueType) => void;
  searchQuery: string;
};
