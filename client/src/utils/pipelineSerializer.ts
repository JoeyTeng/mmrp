import { Node, Edge } from "@xyflow/react";
import {
  PipelineModule,
  PipelineParameter,
  PipelineRequest,
} from "@/types/pipeline";
import { NodeData } from "@/components/drag-and-drop/types";

export function dumpPipelineToJson(
  nodes: Node<NodeData>[],
  edges: Edge[],
): PipelineRequest {
  const sourceMap = new Map<string, string[]>();
  edges.forEach((edge) => {
    if (!sourceMap.has(edge.target)) {
      sourceMap.set(edge.target, []);
    }
    sourceMap.get(edge.target)!.push(edge.source);
  });

  const modules: PipelineModule[] = nodes.map((node) => {
    const numericId = Number.parseInt(node.id);
    const upstreamIds = (sourceMap.get(node.id) || []).map((srcId) =>
      Number.parseInt(srcId),
    );

    const parameters: PipelineParameter[] = Object.entries(
      node.data.params,
    ).map(([key, value]) => ({
      key,
      value: String(value),
    }));

    return {
      id: numericId,
      name: node.data.label,
      source: upstreamIds,
      parameters,
    };
  });

  return {
    video: "./file",
    modules,
  };
}
