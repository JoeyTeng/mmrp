// types.ts (or shareFunctionality.ts)
import type { Node, Edge } from "@xyflow/react";

export type PipelineData = {
  nodes: Node[];
  edges: Edge[];
};

export type ExportMetadata = {
  version: string;
  timestamp: string;
};

export type ProtectedExport = {
  metadata: ExportMetadata;
  data: PipelineData;
  _integrity?: string;
};
