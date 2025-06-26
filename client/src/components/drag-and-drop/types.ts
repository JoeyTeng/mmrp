import { ParamValueType, PortType } from "@/components/modules/modulesRegistry";

export type NodeData = {
  label: string;
  params: Record<string, ParamValueType>; // constraint to ensure there's only one value
  inputPorts: PortType[];
  outputPorts: PortType[];
};

export enum NodeType {
  InputNode = "inputNode",
  ProcessNode = "processNode",
  OutputNode = "outputNode",
}
