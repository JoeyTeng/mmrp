import type { Node, Edge } from "@xyflow/react";

export type ParamValueType = string | number | boolean;
export type NodeParamValue = ParamValueType | string[];

export interface ParameterDefinition {
  name: string;
  type: "int" | "float" | "str" | "bool";
  description?: string | null;
  default?: ParamValueType;
  constraints?: ParamValueType[] | [number, number] | undefined;
  required: boolean;
}

export type ModuleParamLookupType = Record<string, ParameterDefinition>;

export interface FormatDefinition {
  pixelFormat?: string;
  colorSpace?: string;
  width?: number | string;
  height?: number | string;
  frameRate?: number; //fps
}

export interface NodePort {
  id: string;
  formats: FormatDefinition;
}

export type NodeData = {
  label: string;
  params: Record<string, ParamValueType>; // constraint to ensure there's only one value
  inputFormats: NodePort[];
  outputFormats: NodePort[];
};

export enum NodeType {
  InputNode = "inputNode",
  ProcessNode = "processNode",
  OutputNode = "outputNode",
}

export type FlowCanvasProps = {
  defaultNodes: Node<NodeData, NodeType>[];
  defaultEdges: Edge[];
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
