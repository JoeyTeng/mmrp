import type { Node, Edge } from "@xyflow/react";
import { ParamValueType, ModuleType, ModuleData } from "@/types/module";

export type NodeParamValue = ParamValueType | string[];

export type FlowCanvasProps = {
  defaultNodes: Node<ModuleData, ModuleType>[];
  defaultEdges: Edge[];
  editingNode: Node<ModuleData, ModuleType> | null;
  onEditNode: (node: Node<ModuleData, ModuleType>) => void;
};

export interface ParameterConfigurationDrawerProps {
  editingNode: Node<ModuleData, ModuleType>;
  clearEditingNode: () => void;
}

export type ParameterConfigurationProps = {
  node: Node<ModuleData, ModuleType>;
  onParamChange: (key: string, value: ParamValueType) => void;
  searchQuery: string;
};
