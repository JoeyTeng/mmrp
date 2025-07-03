import { ParamValueType, Port } from "@/components/modules/modulesRegistry";

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
