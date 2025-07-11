import { useCallback } from "react";
import { CanvasContextAction } from "./CanvasContextMenu";

export const useCanvasActions = () => {
  const handleCanvasAction = useCallback((action: CanvasContextAction) => {
    switch (action) {
      case "clear":
        return;
      case "export":
        return;
      case "run":
        return;
      case "add_node":
        return;
      default:
        return;
    }
  }, []);

  return { handleCanvasAction };
};
