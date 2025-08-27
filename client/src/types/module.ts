export type ParamValueType = string | number | boolean;
export type ParamConstraintsType = "str" | "int" | "select" | "bool";
export const ALLOWED_FRAME_RATES = [
  "23.976",
  "24",
  "25",
  "29.97",
  "30",
  "48",
  "50",
  "59.94",
  "60",
  "120",
  "240",
] as const;

export type FrameRate = (typeof ALLOWED_FRAME_RATES)[number];

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
  name: string;
  moduleClass: string;
  parameters: ModuleParameter[];
  inputFormats: ModuleFormat[];
  outputFormats: ModuleFormat[];
};

export interface ModuleParameter {
  name: string;
  flag?: string;
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
export type FormulaMap = Record<string, string>;

export interface ModuleFormat {
  default: FormatDefinition;
  formula?: FormulaMap;
}

export interface IOFormat {
  type: string;
  formats: FormatDefinition;
}

export enum ModuleType {
  InputNode = "inputNode",
  ProcessNode = "processNode",
  OutputNode = "outputNode",
}
