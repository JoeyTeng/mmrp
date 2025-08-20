import type { Node, Edge } from "@xyflow/react";
import { ParamValueType, ModuleType, ModuleData } from "@/types/module";

export type NodeParamValue = ParamValueType | string[];

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

export type NodeTemplate = {
  name: string;
  moduleClass: string;
  parameters: Record<string, ParamValueType>;
};
