export type ParamValueType = string | number | boolean;

export interface ParameterDefinition {
  name: string;
  type: "int" | "float" | "str" | "bool";
  description?: string | null;
  default?: ParamValueType;
  validValues?: ParamValueType[] | [number, number];
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
  onSelectNode: (id: string | null) => void;
};

export type ParameterConfigurationProps = {
  node?: Node<{ label: string; params: Record<string, NodeParamValue> }> | null;
};

export type ParameterConfigurationRef = {
  getTempNode: () => Node<{
    label: string;
    params: Record<string, NodeParamValue>;
  }> | null;
};
