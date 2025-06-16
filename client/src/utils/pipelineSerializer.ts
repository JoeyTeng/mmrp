import { Node, Edge } from "@xyflow/react";
import { ParamValueType } from "@/components/modules/modulesRegistry";
import {
  PipelineModule,
  PipelineParameter,
  PipelineRequest,
} from "@/types/pipeline";

type NodeData = {
  label: string;
  params: Record<string, ParamValueType>;
};

export function dumpPipelineToJson(
  nodes: Node<NodeData>[],
  edges: Edge[],
): PipelineRequest {
  const nodeIdMap = new Map<string, number>();
  let currentId = 1;

  nodes.forEach((node) => {
    nodeIdMap.set(node.id, currentId++);
  });

  const sourceMap = new Map<string, string[]>();
  edges.forEach((edge) => {
    if (!sourceMap.has(edge.target)) {
      sourceMap.set(edge.target, []);
    }
    sourceMap.get(edge.target)!.push(edge.source);
  });

  const modules: PipelineModule[] = nodes.map((node) => {
    const numericId = nodeIdMap.get(node.id)!;
    const upstreamIds = (sourceMap.get(node.id) || []).map(
      (srcId) => nodeIdMap.get(srcId)!,
    );

    const parameters: PipelineParameter[] = Object.entries(
      node.data.params,
    ).map(([key, value]) => ({
      [key]: value,
    }));

    return {
      id: numericId,
      name: node.data.label,
      source: upstreamIds.length > 0 ? upstreamIds : null,
      parameters,
    };
  });

  return {
    source: "./file",
    modules,
  };
}
