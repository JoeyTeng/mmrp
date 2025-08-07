export type ParamValueType = string | number | boolean;
export type ParamConstraintsType = "str" | "int" | "select" | "bool";
export type FrameRate =
  | "23.976"
  | "24"
  | "25"
  | "29.97"
  | "30"
  | "48"
  | "50"
  | "59.94"
  | "60"
  | "120"
  | "240";

export interface Module {
  id: string;
  moduleClass: string;
  name: string;
  type: NodeType;
  position: {
    x: number;
    y: number;
  };
  data: ModuleData;
}

export interface ModuleData {
  parameters: ParameterDefinition[];
  inputFormats: FormatDefinition[];
  outputFormats: FormatDefinition[];
}

export interface ParameterDefinition {
  name: string;
  metadata: ParameterData;
}

export interface ParameterData {
  value: ParamValueType;
  type: ParamConstraintsType;
  constraints: ParameterConstraints;
}

export interface ParameterConstraints {
  type: ParamConstraintsType;
  default: ParamValueType;
  required: boolean;
  description: string | null;
  min?: number;
  max?: number;
  options?: ParamValueType[];
}

export interface FormatDefinition {
  pixelFormat?: string[];
  colorSpace?: string[];
  width?: number;
  height?: number;
  frameRate?: FrameRate; //fps
}

export enum NodeType {
  InputNode = "inputNode",
  ProcessNode = "processNode",
  OutputNode = "outputNode",
}
