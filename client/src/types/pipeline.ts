import { ParamValueType } from "@/components/drag-and-drop/types";
import { Metrics } from "./metrics";

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
  modules: PipelineModule[];
};

export type PipelineResponse = {
  left: string;
  right: string;
  metrics: Metrics[];
};
