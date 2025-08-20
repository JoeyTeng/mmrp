import { Edge, Node } from "@xyflow/react";
import { ModuleData, ModuleParameter, ModuleType } from "@/types/module";
import { toast } from "react-toastify/unstyled";
import { CopyableToast } from "@/utils/CopyableToast";
import React from "react";

export function checkPipeline(
  nodes: Node<ModuleData, ModuleType>[],
  edges: Edge[],
): boolean {
  // no nodes, empty canvas
  if (nodes.length === 0) {
    toast.error(
      React.createElement(CopyableToast, {
        message: "Pipeline is empty. Add some modules first.",
      }),
    );
    return false;
  }

  //  Find the one source
  const sources: Node[] = nodes.filter((n) => n.type === ModuleType.InputNode);
  if (sources.length !== 1) {
    toast.error(
      React.createElement(CopyableToast, {
        message: "Exactly one connected source node required.",
      }),
    );
    return false;
  }

  //  Find the results
  const results = nodes.filter((n) => n.type === ModuleType.OutputNode);
  if (results.length > 2 || results.length == 0) {
    toast.error("The pipeline needs only one or two result nodes.");
    return false;
  }
  // only one source exists
  const source = sources[0];

  for (const r of results) {
    if (edges.some((e) => e.source === source.id && e.target === r.id)) {
      toast.error(
        React.createElement(CopyableToast, {
          message:
            "Source cannot connect directly to Result. Add at least one processing module in between.",
        }),
      );
      return false;
    }
  }

  // Player assignment rules
  const specified_player = new Set<string>();
  for (const result of results) {
    const params = result.data.parameters as ModuleParameter[];

    if (results.length == 1) {
      // if there is only one result node, it must be displayed on the right
      if (!(params[0].metadata.value === "right")) {
        toast.error(
          React.createElement(CopyableToast, {
            message: "Your result must be displayed in the right player.",
          }),
        );
        return false;
      }
    } else {
      // if there are two result nodes, they must have different video players specified
      if (specified_player.size === 0) {
        specified_player.add(params[0].metadata.value as string);
      } else if (specified_player.has(params[0].metadata.value as string)) {
        toast.error(
          React.createElement(CopyableToast, {
            message: "Your results must be displayed in two different players.",
          }),
        );
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
        React.createElement(CopyableToast, {
          message: `Node “${n.data.name}” is not reachable from the video source node.`,
        }),
      );
      return false;
    }
    if (!reachableToResult.has(n.id)) {
      toast.error(
        React.createElement(CopyableToast, {
          message: `Node “${n.data.name}” does not lead to any output. Every branch must terminate in a video output node.`,
        }),
      );
      return false;
    }
  }

  return true;
}
