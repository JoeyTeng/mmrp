import { useReactFlow, Node } from "@xyflow/react";
import { NodeAction } from "./NodeContextMenuConfig";
import { useCallback } from "react";
import { ModuleData, ModuleType } from "@/types/module";

export const useNodeActions = (
  onEditNode: (node: Node<ModuleData, ModuleType>) => void,
) => {
  const { getNode, deleteElements } = useReactFlow();

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
          const node = getNode(nodeId) as Node<ModuleData, ModuleType>;
          if (node) onEditNode(node);
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
    [deleteElements, getNode, onEditNode],
  );
  return { handleNodeAction };
};
