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
  type: ModuleType;
  position: {
    x: number;
    y: number;
  };
  data: ModuleData;
}

export type ModuleData = {
  moduleClass: string;
  name: string;
  parameters: ModuleParameter[];
  inputFormats: FormatDefinition[];
  outputFormats: FormatDefinition[];
};

export interface ModuleParameter {
  name: string;
  metadata: ParameterMetadata;
}

export interface ParameterMetadata {
  value: ParamValueType;
  type: ParamConstraintsType;
  constraints: ParameterConstraint;
}

export interface ParameterConstraint {
  type: ParamConstraintsType;
  default: ParamValueType;
  min?: number;
  max?: number;
  options?: string[];
  required: boolean;
  description: string;
}

export interface FormatDefinition {
  pixelFormat?: string[];
  colorSpace?: string[];
  width?: number;
  height?: number;
  frameRate?: FrameRate; //fps
}

export enum ModuleType {
  InputNode = "inputNode",
  ProcessNode = "processNode",
  OutputNode = "outputNode",
}
