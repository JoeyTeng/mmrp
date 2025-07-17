/** Function that gets a single initial value for a param**/

import { Edge, getOutgoers, Node } from "@xyflow/react";
import {
  FormatDefinition,
  ParameterDefinition,
  ParamValueType,
  NodePort,
  NodeType,
  NodeData,
} from "./types";
import { toast } from "react-toastify/unstyled";

export function getInitialNodeParamValue(
  parameters: ParameterDefinition[],
): Record<string, ParamValueType> {
  return parameters.reduce(
    (initialParams, p) => {
      let val: ParamValueType;

      // 1) pick explicit default if there is one
      if (p.default != null || p.default != undefined) {
        val = p.default as ParamValueType;
      }
      // 2) else pick the first constraints entry (if any)
      else if (Array.isArray(p.constraints) && p.constraints.length > 0) {
        val = p.constraints[0] as ParamValueType;
      }
      // 3) final fallback
      else {
        val = p.type === "bool" ? false : ""; // safety val for type int and float is empty string
      }

      // 4) additional check if default is in [min,max] range
      if (
        Array.isArray(p.constraints) &&
        p.constraints.length === 2 &&
        (p.type === "int" || p.type === "float")
      ) {
        const [min, max] = p.constraints as [number, number];
        if (typeof val !== "number") {
          val = min;
        } else {
          val = Math.min(Math.max(val, min), max);
        }
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
  const results: Node[] = nodes.filter((n) => n.type === NodeType.OutputNode);
  if (results.length > 2 || results.length == 0) {
    toast.error("Only one or two result nodes are allowed.");
    return false;
  }

  // only one source exists
  const source = sources[0];

  //  DFS from source
  const visited = new Set<string>();
  const dfs = (n: Node) => {
    if (visited.has(n.id)) return;
    visited.add(n.id);
    getOutgoers(n, nodes, edges).forEach(dfs);
  };
  dfs(source);

  // validate result nodes
  const specified_player = new Set<string>();

  for (const result of results) {
    // check if source is directly connected to result
    const directConn = edges.some(
      (e) => e.source === source.id && e.target === result.id,
    );
    if (directConn) {
      toast.error(
        "Source cannot connect directly to Result. Add at least one processing module in between.",
      );
      return false;
    }
    // Check that result was reached
    if (!visited.has(result.id)) {
      toast.error("Result node is not reachable from source node.");
      return false;
    }
    // check that the specified video player is okay
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

  // All nodes should be part of the chain
  const orphan = nodes.find((n) => !visited.has(n.id));
  if (orphan) {
    toast.error("Orphaned node detected.");
    return false;
  }

  return true;
}
