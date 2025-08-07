import type { Node } from "@xyflow/react";
import { Position } from "@xyflow/react";
import { ModuleData, ModuleParameter } from "@/types/module";

export function makeNode(
  id: string,
  name: string,
  parameters: ModuleParameter[] = [],
): Node<ModuleData> {
  return {
    id,
    type: "processNode",
    position: { x: 0, y: 0 },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    data: {
      name,
      moduleClass: "",
      parameters,
      inputFormats: [],
      outputFormats: [],
    },
  };
}
