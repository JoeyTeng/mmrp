import { Node, Edge, getOutgoers } from "@xyflow/react";
import {
  ModuleData,
  ModuleFormat,
  ModuleParameter,
  ModuleType,
} from "@/types/module";

type Size = { width?: number; height?: number };

const IN_W = new Set(["-w", "-win", "--win"]);
const IN_H = new Set(["-h", "-hin", "--hin"]);
const OUT_W = new Set(["-wout", "--wout"]);
const OUT_H = new Set(["-hout", "--hout"]);

function readSize(params?: ModuleParameter[]): Size {
  if (!params) return {};
  let w: number | undefined;
  let h: number | undefined;

  // Prefer output flags first
  for (const p of params) {
    const f = p.flag?.toLowerCase();
    if (!f) continue;
    const num =
      typeof p.metadata?.value === "number"
        ? p.metadata.value
        : Number(p.metadata?.value);
    if (!Number.isFinite(num)) continue;

    if (OUT_W.has(f)) w = num;
    if (OUT_H.has(f)) h = num;
  }

  //  Only if not found, fallback to input flags
  if (w === undefined || h === undefined) {
    for (const p of params) {
      const f = p.flag?.toLowerCase();
      if (!f) continue;
      const num =
        typeof p.metadata?.value === "number"
          ? p.metadata.value
          : Number(p.metadata?.value);
      if (!Number.isFinite(num)) continue;

      if (w === undefined && IN_W.has(f)) w = num;
      if (h === undefined && IN_H.has(f)) h = num;
    }
  }

  return { width: w, height: h };
}

function writeSize(
  params: ModuleParameter[] | undefined,
  size: Size,
): ModuleParameter[] {
  if (!params) return [];
  return params.map((p) => {
    const f = p.flag?.toLowerCase();
    if (!f) return p;

    const meta = { ...(p.metadata ?? {}) };
    if (size.width !== undefined && (IN_W.has(f) || OUT_W.has(f))) {
      return { ...p, metadata: { ...meta, value: size.width } };
    }
    if (size.height !== undefined && (IN_H.has(f) || OUT_H.has(f))) {
      return { ...p, metadata: { ...meta, value: size.height } };
    }
    return p;
  });
}

export function propagateSize(
  nodes: Node<ModuleData, ModuleType>[],
  edges: Edge[],
  startNodeId: string,
): Node<ModuleData, ModuleType>[] {
  const map = new Map(nodes.map((n) => [n.id, { ...n }]));
  const start = map.get(startNodeId);
  if (!start) return nodes;

  const seed = readSize(start.data.parameters);
  if (seed.width === undefined && seed.height === undefined) return nodes;

  const visited = new Set<string>();
  const walk = (id: string) => {
    if (visited.has(id)) return;
    visited.add(id);
    const node = map.get(id);
    if (!node) return;

    if (node.type === ModuleType.ProcessNode && id !== startNodeId) {
      map.set(node.id, {
        ...node,
        data: {
          ...node.data,
          parameters: writeSize(node.data.parameters, seed),
        },
      });
    }

    for (const kid of getOutgoers(node, Array.from(map.values()), edges)) {
      walk(kid.id);
    }
  };

  walk(startNodeId);
  return Array.from(map.values());
}

export function recomputeIOFormatsFromParams(n: Node<ModuleData, ModuleType>) {
  let inW: number | undefined;
  let inH: number | undefined;
  let outW: number | undefined;
  let outH: number | undefined;

  for (const p of n.data?.parameters ?? []) {
    const flag = p.flag?.toLowerCase();
    const val = p.metadata?.value;
    const num = typeof val === "number" ? val : Number(val);
    if (!Number.isFinite(num)) continue;

    if (flag === "-win" || flag === "--win" || flag === "-w") inW = num;
    if (flag === "-hin" || flag === "--hin" || flag === "-h") inH = num;
    if (flag === "-wout" || flag === "--wout") outW = num;
    if (flag === "-hout" || flag === "--hout") outH = num;
  }

  const update = (arr?: ModuleFormat[], w?: number, h?: number) =>
    (arr ?? []).map((fmt) => ({
      ...fmt,
      default: {
        ...fmt.default,
        width: w ?? fmt.default?.width,
        height: h ?? fmt.default?.height,
      },
    }));

  const updatedInputs = update(n.data?.inputFormats, inW, inH);
  let updatedOutputs = update(n.data?.outputFormats, outW, outH);

  if (outW === undefined && outH === undefined && updatedInputs.length > 0) {
    updatedOutputs = updatedOutputs.map((fmt, i) => ({
      ...fmt,
      default: {
        ...fmt.default,
        width: updatedInputs[i]?.default?.width ?? fmt.default?.width,
        height: updatedInputs[i]?.default?.height ?? fmt.default?.height,
      },
    }));
  }

  return {
    ...n,
    data: {
      ...n.data,
      inputFormats: updatedInputs,
      outputFormats: updatedOutputs,
    },
  };
}
