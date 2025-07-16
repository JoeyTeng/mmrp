import { useReactFlow } from "@xyflow/react";
import { NodeAction } from "./NodeContextMenuConfig";
import { useCallback } from "react";

export const useNodeActions = (onConfigure: (nodeId: string) => void) => {
  const { deleteElements } = useReactFlow();

  const handleNodeAction = useCallback(
    (action: NodeAction, nodeId: string) => {
      switch (action) {
        case "expand": {
          console.log("expand");
          return;
        }
        case "duplicate": {
          console.log("duplicate");
          return;
        }
        case "rename": {
          console.log("rename");
          return;
        }
        case "color": {
          console.log("color");
          return;
        }
        case "configure": {
          onConfigure(nodeId);
          return;
        }
        case "export": {
          console.log("export");
          return;
        }
        case "delete": {
          deleteElements({ nodes: [{ id: nodeId }] });
          return;
        }
        default:
          return;
      }
    },
    [deleteElements, onConfigure],
  );
  return { handleNodeAction };
};
