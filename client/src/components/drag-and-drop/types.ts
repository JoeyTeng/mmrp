import { ParamValueType, Port } from "@/components/modules/modulesRegistry";
import { ModuleRole } from "@/hooks/useModule";

export type NodeData = {
  label: string;
  params: Record<string, ParamValueType>; // constraint to ensure there's only one value
  inputFormats: Port[];
  outputFormats: Port[];
};

export enum NodeType {
  InputNode = "inputNode",
  ProcessNode = "processNode",
  OutputNode = "outputNode",
}

export function mapRoleToNodeType(role: ModuleRole): NodeType {
  switch (role) {
    case ModuleRole.InputNode:
      return NodeType.InputNode;
    case ModuleRole.OutputNode:
      return NodeType.OutputNode;
    default:
      return NodeType.ProcessNode;
  }
}
