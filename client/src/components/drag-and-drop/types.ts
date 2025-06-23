import { ParamValueType } from "@/components/modules/modulesRegistry";

export type NodeData = {
  label: string;
  params: Record<string, ParamValueType>; // constraint to ensure there's only one value
};

export enum NodeType {
  InputNode = "inputNode",
  ProcessNode = "processNode",
  OutputNode = "outputNode",
}
