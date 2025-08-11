/** Function that gets a single initial value for a param**/

import { Edge, Node } from "@xyflow/react";
import { NodePort, NodeData } from "./types";
import {
  NodeType,
  ParamValueType,
  ParameterDefinition,
  FormatDefinition,
} from "@/types/module";
import { toast } from "react-toastify/unstyled";
import { ExamplePipeline } from "@/types/pipeline";

export function getInitialNodeParamValue(
  parameters: ParameterDefinition[],
): Record<string, ParamValueType> {
  return parameters.reduce(
    (initialParams, p) => {
      const paramMetaData = p.metadata;
      let val: ParamValueType;

      // 1) pick explicit default if there is one
      if (
        paramMetaData.constraints.default != null &&
        paramMetaData.constraints.default != undefined
      ) {
        val = paramMetaData.constraints.default as ParamValueType;
      }
      // 2) else pick the first constraints entry (if any)
      else if (
        paramMetaData.constraints.options != undefined &&
        paramMetaData.constraints.options.length > 0
      ) {
        val = paramMetaData.constraints.options[0] as ParamValueType;
      }
      // 3) else pick the min value (if any)
      else if (
        paramMetaData.constraints.min != null &&
        paramMetaData.constraints.min != undefined
      ) {
        val = paramMetaData.constraints.min as ParamValueType;
      }
      // 4) final fallback
      else {
        val = paramMetaData.type === "bool" ? false : ""; // safety val for type int and float is empty string
      }

      // 5) additional check to make sure default is in [min,max] range
      if (
        paramMetaData.constraints.min != null &&
        paramMetaData.constraints.max != null &&
        typeof val === "number"
      ) {
        const [min, max] = [
          paramMetaData.constraints.min,
          paramMetaData.constraints.max,
        ];
        val = Math.min(Math.max(val, min), max);
      }

      initialParams[p.name] = val;
      return initialParams;
    },
    {} as Record<string, ParamValueType>,
  );
}

export function makePorts(
  formats: FormatDefinition[],
  prefix: "input" | "output",
): NodePort[] {
  return formats.map((fmt, i) => ({
    id: `${prefix}-${i}`,
    formats: fmt,
  })) as NodePort[];
}

export function checkPipeline(
  nodes: Node<NodeData, NodeType>[],
  edges: Edge[],
): boolean {
  // no nodes, empty canvas
  if (nodes.length === 0) {
    toast.error("Pipeline is empty. Add some modules first.");
    return false;
  }

  //  Find the one source
  const sources: Node[] = nodes.filter((n) => n.type === NodeType.InputNode);
  if (sources.length !== 1) {
    toast.error("Exactly one connected source node required.");
    return false;
  }

  //  Find the results
  const results = nodes.filter((n) => n.type === NodeType.OutputNode);
  if (results.length > 2 || results.length == 0) {
    toast.error("The pipeline needs only one or two result nodes.");
    return false;
  }
  // only one source exists
  const source = sources[0];

  for (const r of results) {
    if (edges.some((e) => e.source === source.id && e.target === r.id)) {
      toast.error(
        "Source cannot connect directly to Result. Add at least one processing module in between.",
      );
      return false;
    }
  }

  // Player assignment rules
  const specified_player = new Set<string>();
  for (const result of results) {
    const params = result.data.params as { video_player: string; path: string };
    if (results.length == 1) {
      // if there is only one result node, it must be displayed on the right
      if (!(params.video_player === "right")) {
        toast.error("Your result must be displayed in the right player.");
        return false;
      }
    } else {
      // if there are two result nodes, they must have different video players specified
      if (specified_player.size === 0) {
        specified_player.add(params.video_player);
      } else if (specified_player.has(params.video_player)) {
        toast.error("Your results must be displayed in two different players.");
        return false;
      }
    }
  }

  const outMap = new Map<string, string[]>();
  const inMap = new Map<string, string[]>();
  nodes.forEach((n) => {
    outMap.set(n.id, []);
    inMap.set(n.id, []);
  });
  edges.forEach((e) => {
    outMap.get(e.source)!.push(e.target);
    inMap.get(e.target)!.push(e.source);
  });

  // Forward DFS from source
  const reachableFromSource = new Set<string>();
  function dfsFwd(nodeId: string) {
    if (reachableFromSource.has(nodeId)) return;
    reachableFromSource.add(nodeId);
    outMap.get(nodeId)!.forEach(dfsFwd);
  }
  dfsFwd(source.id);

  // Backward DFS from each result
  const reachableToResult = new Set<string>();
  function dfsBwd(nodeId: string) {
    if (reachableToResult.has(nodeId)) return;
    reachableToResult.add(nodeId);
    inMap.get(nodeId)!.forEach(dfsBwd);
  }
  results.forEach((r) => dfsBwd(r.id));

  // Intersection check: every node must be in both sets
  for (const n of nodes) {
    if (!reachableFromSource.has(n.id)) {
      toast.error(
        `Node “${n.data.name}” is not reachable from the video source node.`,
      );
      return false;
    }
    if (!reachableToResult.has(n.id)) {
      toast.error(
        `Node “${n.data.name}” does not lead to any output. Every branch must terminate in a video output node.`,
      );
      return false;
    }
  }

  return true;
}

// will be deleted after frontend and backend schemas are unified

export function mapBackendToFrontend(p: ExamplePipeline): {
  nodes: Node<NodeData, NodeType>[];
  edges: Edge[];
} {
  const nodes = p.nodes.map((mod) => ({
    id: mod.id,
    type: mod.type as NodeType,
    position: mod.position,
    data: {
      name: mod.name,
      moduleClass: mod.moduleClass,
      params: Object.fromEntries(
        (mod.data.parameters ?? []).map((param) => [
          param.name,
          param.metadata.value,
        ]),
      ),
      inputFormats: (mod.data.inputFormats ?? []).map((format, i) => ({
        id: `in-${i}`,
        formats: format,
      })),
      outputFormats: (mod.data.outputFormats ?? []).map((format, i) => ({
        id: `out-${i}`,
        formats: format,
      })),
    },
  }));

  const edges = p.edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    sourceHandle: e.sourceHandle ?? "out-0",
    targetHandle: e.targetHandle ?? "in-0",
  }));

  return { nodes, edges };
}
