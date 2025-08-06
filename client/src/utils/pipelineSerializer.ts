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
    const id = node.id;
    const upstreamIds = (sourceMap.get(node.id) || []).map((srcId) => srcId);

    const parameters: PipelineParameter[] = Object.entries(
      node.data.params,
    ).map(([key, value]) => ({
      key,
      value: value,
    }));

    return {
      id: id,
      name: node.data.name,
      module_class: node.data.moduleClass,
      source: upstreamIds,
      parameters,
    };
  });

  return {
    modules,
  };
}
