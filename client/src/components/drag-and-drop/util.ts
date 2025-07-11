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
import { toast } from "react-toastify";

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
      // 2) else pick the first validValues entry (if any)
      else if (Array.isArray(p.validValues) && p.validValues.length > 0) {
        val = p.validValues[0] as ParamValueType;
      }
      // 3) final fallback
      else {
        val = p.type === "bool" ? false : ""; // safety val for type int and float is empty string
      }

      // 4) additional check if default is in [min,max] range
      if (
        Array.isArray(p.validValues) &&
        p.validValues.length === 2 &&
        (p.type === "int" || p.type === "float")
      ) {
        const [min, max] = p.validValues as [number, number];
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

  //  Find the one result
  const results: Node[] = nodes.filter((n) => n.type === NodeType.OutputNode);
  if (results.length !== 1) {
    toast.error("Exactly one connected result node required.");
    return false;
  }

  const source = sources[0];
  const result = results[0];

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

  //  DFS from source
  const visited = new Set<string>();
  const dfs = (n: Node) => {
    if (visited.has(n.id)) return;
    visited.add(n.id);
    getOutgoers(n, nodes, edges).forEach(dfs);
  };
  dfs(source);

  // Check that result was reached
  if (!visited.has(result.id)) {
    toast.error("Result node is not reachable from source node.");
    return false;
  }

  // All nodes should be part of the chain
  const orphan = nodes.find((n) => !visited.has(n.id));
  if (orphan) {
    toast.error("Orphaned node detected.");
    return false;
  }

  return true;
}
