import { ParamValueType } from "@/components/modules/modulesRegistry";

export type PipelineParameter = {
  [key: string]: ParamValueType;
};

export type PipelineModule = {
  id: number;
  name: string;
  source: number[];
  parameters: PipelineParameter[];
};

export type PipelineRequest = {
  video: string;
  modules: PipelineModule[];
};
