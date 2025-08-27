import { Edge, getOutgoers, Node } from "@xyflow/react";
import {
  FormatDefinition,
  ModuleData,
  ModuleFormat,
  ModuleParameter,
  ModuleType,
  ParamValueType,
} from "@/types/module";
import { displayError } from "@/utils/sharedFunctionality";

export function checkPipeline(
  nodes: Node<ModuleData, ModuleType>[],
  edges: Edge[],
): boolean {
  // no nodes, empty canvas
  if (nodes.length === 0) {
    displayError("Pipeline is empty. Add some modules first.");
    return false;
  }

  // check if there are any invalid edges on the canvas
  const invalidEdges = edges.some((e) => e.animated === true);
  if (invalidEdges) {
    displayError(
      "Please rectify all invalid connections before submitting the pipeline",
    );
    return false;
  }

  //  Find the one source
  const sources: Node[] = nodes.filter((n) => n.type === ModuleType.InputNode);
  if (sources.length !== 1) {
    displayError("Exactly one connected source node required.");
    return false;
  }

  //  Find the results
  const results = nodes.filter((n) => n.type === ModuleType.OutputNode);
  if (results.length > 2 || results.length == 0) {
    displayError("The pipeline needs only one or two result nodes.");
    return false;
  }
  // only one source exists
  const source = sources[0];

  for (const r of results) {
    if (edges.some((e) => e.source === source.id && e.target === r.id)) {
      displayError(
        "Source cannot connect directly to Result. Add at least one processing module in between.",
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
        displayError("Your result must be displayed in the right player.");
        return false;
      }
    } else {
      // if there are two result nodes, they must have different video players specified
      if (specified_player.size === 0) {
        specified_player.add(params[0].metadata.value as string);
      } else if (specified_player.has(params[0].metadata.value as string)) {
        displayError(
          "Your results must be displayed in two different players.",
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
      displayError(
        `Node “${n.data.name}” is not reachable from the video source node.`,
      );
      return false;
    }
    if (!reachableToResult.has(n.id)) {
      displayError(
        `Node “${n.data.name}” does not lead to any output. Every branch must terminate in a video output node.`,
      );
      return false;
    }
  }

  return true;
}

function intersect(a?: string[], b?: string[]): boolean {
  if (!a || !b) return true; // treat unspecified as wildcard
  return a.some((x) => b.includes(x));
}

function formatsCompatible(o: FormatDefinition, i: FormatDefinition): boolean {
  if (!intersect(o.pixelFormat, i.pixelFormat)) return false;
  if (!intersect(o.colorSpace, i.colorSpace)) return false;
  if (o.frameRate && i.frameRate && o.frameRate !== i.frameRate) return false;
  if (o.width && i.width && o.width !== i.width) return false;
  if (o.height && i.height && o.height !== i.height) return false;
  return true;
}

export function compatibleFormats(
  outs: FormatDefinition[] = [],
  ins: FormatDefinition[] = [],
): boolean {
  return outs.some((o) => ins.some((i) => formatsCompatible(o, i)));
}

export const evaluateFormula = (
  formula: string,
  params: Record<string, ParamValueType>,
): ParamValueType => {
  try {
    let expression = formula;

    expression = expression.replace(/params\.(\w+)/g, (match, paramName) => {
      return params[paramName]?.toString() || "0";
    });

    const result = new Function(`return ${expression}`)();

    return typeof result === "number" ? Math.round(result) : result;
  } catch (error) {
    console.warn("Formula evaluation failed:", formula, error);
    return formula;
  }
};

function getFormatData(format: ModuleFormat): FormatDefinition {
  const d = format.default || {};
  return {
    width: d.width,
    height: d.height,
    frameRate: d.frameRate,
    pixelFormat: Array.isArray(d.pixelFormat)
      ? d.pixelFormat
      : d.pixelFormat
      ? [d.pixelFormat]
      : [],
    colorSpace: Array.isArray(d.colorSpace)
      ? d.colorSpace
      : d.colorSpace
      ? [d.colorSpace]
      : [],
  };
}

/** Build a new ModuleFormat, filling missing fields from inherited */
function buildFormat(
  base: ModuleFormat | undefined,
  inherited: FormatDefinition,
  formula?: string
): ModuleFormat {
  const b = base?.default || {};
  return {
    default: {
      width: b.width ?? inherited.width ,
      height: b.height ?? inherited.height,
      frameRate: b.frameRate ?? inherited.frameRate ,
      pixelFormat: b.pixelFormat ?? inherited.pixelFormat ,
      colorSpace: b.colorSpace ?? inherited.colorSpace ,
    },
    // optional metadata you can store; rename/remove if you don't use it
    formula: formula ?? (base as any)?.formula ?? "inherited",
  };
}

/** True if any key piece is missing/empty */
function isFormatIncomplete(format: ModuleFormat): boolean {
  const d = format.default || {};
  return (
    !d.width ||
    !d.height ||
    !d.frameRate ||
    !Array.isArray(d.pixelFormat) || d.pixelFormat.length === 0 ||
    !Array.isArray(d.colorSpace) || d.colorSpace.length === 0
  );
}

/** DFS that propagates formats downstream */
export function runFormatPropagation(
  nodes: Node<ModuleData, ModuleType>[],
  edges: Edge[],
  startNodeId?: string
): {updatedNodes: Node<ModuleData,ModuleType>[], reachedEndNodes:string[]} {
  const nodeMap = new Map(nodes.map((n) => [n.id, { ...n }]));
  const visited = new Set<string>();
  const reachedEndNodes: string[] = [];

  const start =
    (startNodeId ? nodeMap.get(startNodeId) : undefined) ||
    nodes.find((n) => n.type === ModuleType.InputNode);

  if (!start) {
    return { reachedEndNodes, updatedNodes: nodes };
  }

  const dfs = (nodeId: string, inherited: FormatDefinition = {}) => {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);

    const node = nodeMap.get(nodeId);
    if (!node) return;

    const children = getOutgoers(node, Array.from(nodeMap.values()), edges);
    const isEnd = node.type === ModuleType.OutputNode || children.length === 0;
    if (isEnd) reachedEndNodes.push(nodeId);

    const data: ModuleData = { ...(node.data as ModuleData) };
    let changed = false;

    //fill inputs
    if (data.inputFormats?.length && node.type !== ModuleType.OutputNode) {
      data.inputFormats = data.inputFormats.map((fmt, idx) =>
        isFormatIncomplete(fmt)
          ? ((changed = true), buildFormat(fmt, inherited, `input-${idx}`))
          : fmt
      );
    }
  
    // fill outputs or create one if missing
    if (data.outputFormats?.length) {
      data.outputFormats = data.outputFormats.map((fmt, idx) =>
        isFormatIncomplete(fmt)
          ? ((changed = true), buildFormat(fmt, inherited, `output-${idx}`))
          : fmt
      );
    } else if (Object.keys(inherited).length && node.type !== ModuleType.InputNode) {
      data.outputFormats = [buildFormat(undefined, inherited, "auto")];
      changed = true;
    }

    if (changed) {
      nodeMap.set(nodeId, { ...node, data });
    }

    // pass first output format downstream (contains full arrays)
    let next: FormatDefinition = inherited;
    if (data.outputFormats?.length) {
      next = getFormatData(data.outputFormats[0]);
    }

    children.forEach((child) => dfs(child.id, next));
  };

  dfs(start.id);

  return {
    reachedEndNodes,updatedNodes: Array.from(nodeMap.values()),
  };
}

export const updateDownstreamInputFormats = (
  nodes: Node<ModuleData, ModuleType>[],
  edges: Edge[],
  startNodeId: string
): Node<ModuleData, ModuleType>[] => {
  
  return nodes.map(node => {
    // Find all edges that connect TO this node (making this node a target)
    const incomingEdges = edges.filter(edge => edge.target === node.id);
    
    if (incomingEdges.length === 0) {
      return node; // No incoming connections, nothing to update
    }
    
    // For each incoming edge, update this node's inputFormats to match the source's outputFormats
    let updatedNode = { ...node };
    
    incomingEdges.forEach(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      if (sourceNode && sourceNode.data.outputFormats) {
        // Update inputFormats to match the connected source's outputFormats
        updatedNode = {
          ...updatedNode,
          data: {
            ...updatedNode.data,
            inputFormats: sourceNode.data.outputFormats.map(outputFormat => ({
              ...outputFormat,
              // Copy the computed default values from source output to target input
              default: { ...outputFormat.default }
            }))
          }
        };
      }
    });
    
    return updatedNode;
  });
};
