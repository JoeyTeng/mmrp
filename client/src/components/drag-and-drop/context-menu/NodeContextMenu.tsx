import {
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  NODE_CONTEXT_MENU,
  NODE_SELECTION_CONTEXT_MENU,
  NodeAction,
} from "./NodeContextMenuConfig";
import ContextMenu from "../../util/ContextMenu";
import { useNodeActions } from "./useNodeActions";
import { Node } from "@xyflow/react";
import { ModuleData, ModuleType } from "@/types/module";

type MenuPayload =
  | {
      position: { x: number; y: number };
      type: "single";
      nodeId: string;
    }
  | {
      position: { x: number; y: number };
      type: "multi";
      nodeIds: string[];
    };

export type NodeContextMenuHandle = {
  open: (payload: MenuPayload) => void;
  close: () => void;
};

interface NodeContextMenuProps {
  ref: React.RefObject<NodeContextMenuHandle | null>;
  onEditNode: (node: Node<ModuleData, ModuleType>) => void;
}

const NodeContextMenu = ({ ref, onEditNode }: NodeContextMenuProps) => {
  const { handleNodeAction } = useNodeActions(onEditNode);

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [menuType, setMenuType] = useState<"multi" | "single" | null>(null);
  const menuPositionRef = useRef<{ x: number; y: number }>(null);
  const nodeIdsRef = useRef<string[] | null>(null);

  const menuItems = useMemo(() => {
    switch (menuType) {
      case "multi":
        return NODE_SELECTION_CONTEXT_MENU;
      case "single":
        return NODE_CONTEXT_MENU;
      default:
        return [];
    }
  }, [menuType]);

  const handleCloseMenu = () => setIsOpen(false);

  const handleAction = useCallback(
    (actionId: NodeAction) => {
      if (!nodeIdsRef.current) {
        console.error(
          `Tried to execute NodeAction "${actionId}" with no NodeID(s).`,
        );
        return;
      }
      handleCloseMenu();
      handleNodeAction(actionId as NodeAction, nodeIdsRef.current);
    },
    [handleNodeAction],
  );

  useImperativeHandle(ref, () => {
    return {
      open(payload: MenuPayload) {
        menuPositionRef.current = payload.position;

        if (payload.type === "single") nodeIdsRef.current = [payload.nodeId];
        else nodeIdsRef.current = payload.nodeIds;

        setMenuType(payload.type);
        setIsOpen(true);
      },
      close() {
        handleCloseMenu();
      },
    };
  });

  return (
    <ContextMenu
      open={isOpen}
      dense
      position={menuPositionRef.current}
      items={menuItems}
      onAction={handleAction}
      onClose={handleCloseMenu}
    />
  );
};

export default NodeContextMenu;
