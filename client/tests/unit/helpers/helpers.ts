import type { Node } from "@xyflow/react";
import type { NodeData } from "@/components/drag-and-drop/types";
import { Position } from "@xyflow/react";

export function makeNode(
  id: string,
  data: Partial<NodeData> = {},
): Node<NodeData> {
  return {
    id,
    type: "processNode",
    position: { x: 0, y: 0 },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    data: {
      name: "",
      params: {},
      inputFormats: [],
      outputFormats: [],
      ...data,
    },
  };
}
