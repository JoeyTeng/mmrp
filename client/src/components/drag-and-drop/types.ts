import type { Node, Edge } from "@xyflow/react";
import { ParamValueType, NodeType, FormatDefinition } from "@/types/module";

export type NodeParamValue = ParamValueType | string[];

export interface NodePort {
  id: string;
  formats: FormatDefinition;
}

export type NodeData = {
  name: string;
  params: Record<string, ParamValueType>; // constraint to ensure there's only one value
  inputFormats: NodePort[];
  outputFormats: NodePort[];
};

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
};

export type ParameterInfoToolTipProps = {
  description: string | null;
};
