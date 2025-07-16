import { useCallback } from "react";
import { CanvasContextAction } from "./CanvasContextMenuConfig";
import { useReactFlow } from "@xyflow/react";

export const useCanvasActions = () => {
  const { getNodes, deleteElements } = useReactFlow();
  const handleCanvasAction = useCallback(
    (action: CanvasContextAction) => {
      switch (action) {
        case "clear": {
          deleteElements({
            nodes: getNodes().map((node) => ({ id: node.id })),
          });
          return;
        }
        case "export":
          return;
        case "run":
          return;
        case "add_node":
          return;
        default:
          return;
      }
    },
    [deleteElements, getNodes],
  );

  return { handleCanvasAction };
};
