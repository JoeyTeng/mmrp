import type { Node, Edge, OnNodesChange, OnEdgesChange } from "@xyflow/react";

export type ParamValueType = string | number | boolean;
export type NodeParamValue = ParamValueType | string[];
export type ConstraintsLookupType = Record<
  string,
  ParamValueType[] | [number, number] | undefined
>;

export interface ParameterDefinition {
  name: string;
  type: "int" | "float" | "str" | "bool";
  description?: string | null;
  default?: ParamValueType;
  constraints?: ParamValueType[] | [number, number];
  required: boolean;
}

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
  nodes: Node<NodeData, NodeType>[];
  edges: Edge[];
  onNodesChange: OnNodesChange<Node<NodeData, NodeType>>;
  onEdgesChange: OnEdgesChange;
  setNodes: React.Dispatch<React.SetStateAction<Node<NodeData, NodeType>[]>>;
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  onEditNode: (node: Node<NodeData, NodeType>) => void;
};

export interface ParameterConfigurationDrawerProps {
  editingNode: Node<NodeData, NodeType>;
  onConfirm: (node: Node<NodeData, NodeType>) => void;
  onCancel: () => void;
}

export type ParameterConfigurationProps = {
  node: Node<NodeData, NodeType>;
  onParamChange: (key: string, value: ParamValueType) => void;
};
