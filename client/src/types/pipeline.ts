import { ParamValueType } from "@/types/module";
import { Metrics } from "./metrics";
import { Edge } from "@xyflow/react";
import { Module } from "@/types/module";

export type PipelineParameter = {
  [key: string]: ParamValueType;
};

export type PipelineModule = {
  id: string;
  name: string;
  module_class: string;
  source: string[];
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

export type ExamplePipeline = {
  id: string;
  name: string;
  nodes: Module[];
  edges: Edge[];
};
