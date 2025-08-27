import { Node, Edge, getOutgoers } from "@xyflow/react";
import {
  FormatDefinition,
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

export function hasExplicitInputSize(params?: ModuleParameter[]): boolean {
  if (!params?.length) return false;
  for (const p of params) {
    const f = p.flag?.toLowerCase();
    if (f && (IN_W.has(f) || IN_H.has(f))) return true;
  }
  return false;
}

export function differs(a?: FormatDefinition, b?: FormatDefinition): boolean {
  if (!a || !b) return false;
  if (a.width && b.width && a.width !== b.width) return true;
  if (a.height && b.height && a.height !== b.height) return true;
  if (a.frameRate && b.frameRate && a.frameRate !== b.frameRate) return true;
  if (a.pixelFormat?.length && b.pixelFormat?.length) {
    if (!a.pixelFormat.some((x) => b.pixelFormat!.includes(x))) return true;
  }
  if (a.colorSpace?.length && b.colorSpace?.length) {
    if (!a.colorSpace.some((x) => b.colorSpace!.includes(x))) return true;
  }
  return false;
}

export function recomputeIOFormatsFromParams(n: Node<ModuleData, ModuleType>) {
  let inW: number | undefined;
  let inH: number | undefined;
  let outW: number | undefined;
  let outH: number | undefined;

  if (n.type === ModuleType.OutputNode) return n;

  // 1) read by FLAGS first
  for (const p of n.data?.parameters ?? []) {
    const f = p.flag?.toLowerCase();
    if (!f) continue;
    const v = p.metadata?.value;
    const num = typeof v === "number" ? v : Number(v);
    if (!Number.isFinite(num)) continue;

    if (IN_W.has(f) && inW == null) inW = num;
    if (IN_H.has(f) && inH == null) inH = num;
    if (OUT_W.has(f) && outW == null) outW = num;
    if (OUT_H.has(f) && outH == null) outH = num;
  }

  // 2) fallback: read by PARAM NAMES if flags weren't present
  for (const p of n.data?.parameters ?? []) {
    const name = p.name?.toLowerCase();
    const v = p.metadata?.value;
    const num = typeof v === "number" ? v : Number(v);
    if (!Number.isFinite(num)) continue;

    if (
      inW == null &&
      (name === "width" || name === "in_width" || name === "input_width")
    )
      inW = num;
    if (
      inH == null &&
      (name === "height" || name === "in_height" || name === "input_height")
    )
      inH = num;
    if (
      outW == null &&
      (name === "wout" || name === "out_width" || name === "output_width")
    )
      outW = num;
    if (
      outH == null &&
      (name === "hout" || name === "out_height" || name === "output_height")
    )
      outH = num;
  }

  const setIn = (arr?: ModuleFormat[]) =>
    (arr ?? []).map((fmt) => ({
      ...fmt,
      default: {
        ...fmt.default,
        width: inW !== undefined ? inW : fmt.default?.width,
        height: inH !== undefined ? inH : fmt.default?.height,
      },
    }));

  const setOut = (arr?: ModuleFormat[]) =>
    (arr ?? []).map((fmt) => ({
      ...fmt,
      default: {
        ...fmt.default,
        width: outW !== undefined ? outW : fmt.default?.width,
        height: outH !== undefined ? outH : fmt.default?.height,
      },
    }));

  // If no output width/height params found, copy dimensions from input formats to output formats
  const updatedInputFormats = setIn(n.data?.inputFormats);
  let updatedOutputFormats = setOut(n.data?.outputFormats);

  if (
    outW === undefined &&
    outH === undefined &&
    updatedInputFormats.length > 0
  ) {
    updatedOutputFormats = updatedOutputFormats.map((outFmt) => ({
      ...outFmt,
      default: {
        ...outFmt.default,
        width: updatedInputFormats[0]?.default?.width ?? outFmt.default?.width,
        height:
          updatedInputFormats[0]?.default?.height ?? outFmt.default?.height,
      },
    }));
  }

  return {
    ...n,
    data: {
      ...n.data,
      inputFormats: updatedInputFormats,
      outputFormats: updatedOutputFormats,
    },
  };
}

function toNum(v: unknown): number | undefined {
  if (v == null || v === "") return undefined;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export function readSizeFromParams(params?: ModuleParameter[]): Size {
  if (!params?.length) return {};
  let w: number | undefined;
  let h: number | undefined;

  // prefer output width/height first
  for (const p of params) {
    const f = p.flag?.toLowerCase();
    if (!f) continue;
    if (w === undefined && OUT_W.has(f)) w = toNum(p.metadata?.value);
    if (h === undefined && OUT_H.has(f)) h = toNum(p.metadata?.value);
  }
  // then input width/height
  for (const p of params) {
    const f = p.flag?.toLowerCase();
    if (!f) continue;
    if (w === undefined && IN_W.has(f)) w = toNum(p.metadata?.value);
    if (h === undefined && IN_H.has(f)) h = toNum(p.metadata?.value);
  }

  return { width: w, height: h };
}

export function setSizeParams(
  params: ModuleParameter[] | undefined,
  size: { width?: number; height?: number },
): ModuleParameter[] | undefined {
  if (!params?.length) return params;
  let anyChanged = false;

  const next = params.map((p) => {
    const f = p.flag?.toLowerCase();
    if (!f) return p;

    const meta = { ...(p.metadata ?? {}) };
    let changed = false;

    if (
      size.width !== undefined &&
      (IN_W.has(f) || OUT_W.has(f)) &&
      meta.value !== size.width
    ) {
      meta.value = size.width;
      changed = true;
    }
    if (
      size.height !== undefined &&
      (IN_H.has(f) || OUT_H.has(f)) &&
      meta.value !== size.height
    ) {
      meta.value = size.height;
      changed = true;
    }

    if (changed) {
      anyChanged = true;
      return { ...p, metadata: meta };
    }
    return p;
  });

  return anyChanged ? next : params;
}

/**
 * ONE reusable propagator for width/height.
 * - If `seed` is omitted, it is read from the `startNodeId` params.
 * - By default, it does NOT overwrite the start node (includeStart=false).
 */
export function propagateSize(opts: {
  nodes: Node<ModuleData, ModuleType>[];
  edges: Edge[];
  startNodeId: string;
  seed?: Size; // optional explicit seed
  includeStart?: boolean; // default false
}): Node<ModuleData, ModuleType>[] {
  const { nodes, edges, startNodeId, includeStart = false } = opts;

  const map = new Map(nodes.map((n) => [n.id, { ...n }]));
  const start = map.get(startNodeId);
  if (!start) return nodes;

  // derive seed if not provided
  const seed: Size = opts.seed ?? readSizeFromParams(start.data?.parameters);
  if (seed.width === undefined && seed.height === undefined) return nodes;

  const visited = new Set<string>();
  const walk = (id: string) => {
    if (visited.has(id)) return;
    visited.add(id);

    const node = map.get(id);
    if (!node) return;

    const isProcess =
      (node as Node<ModuleData, ModuleType>).type === ModuleType.ProcessNode;

    // optionally skip overwriting the start node
    if (isProcess && (includeStart || id !== startNodeId)) {
      const updated = setSizeParams(node.data?.parameters, seed);
      if (updated && updated !== node.data?.parameters) {
        map.set(id, { ...node, data: { ...node.data, parameters: updated } });
      }
    }

    const kids = getOutgoers<Node<ModuleData, ModuleType>, Edge>(
      node,
      Array.from(map.values()),
      edges,
    );

    for (const k of kids) walk(k.id);
  };

  walk(startNodeId);
  return Array.from(map.values());
}

export const applyParamSizeOnConnect = (
  nodes: Node<ModuleData, ModuleType>[],
  edges: Edge[],
  startNodeId: string,
) => propagateSize({ nodes, edges, startNodeId, includeStart: false });

export const applyParamSizeFromNodeEdit = (
  nodes: Node<ModuleData, ModuleType>[],
  edges: Edge[],
  startNodeId: string,
) => propagateSize({ nodes, edges, startNodeId, includeStart: false });
