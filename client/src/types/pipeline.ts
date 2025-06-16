import { ParamValueType } from "@/components/modules/modulesRegistry";

export type PipelineParameter = {
  [key: string]: ParamValueType;
};

export type PipelineModule = {
  id: number | string;
  name: string;
  source: number[] | null;
  parameters: PipelineParameter[];
};

export type PipelineRequest = {
  source: string;
  modules: PipelineModule[];
};
