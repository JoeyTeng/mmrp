import { useCallback, useImperativeHandle, useRef, useState } from "react";
import { NODE_CONTEXT_MENU, NodeAction } from "./NodeContextMenuConfig";
import ContextMenu from "../../util/ContextMenu";
import { useNodeActions } from "./useNodeActions";
import { Node } from "@xyflow/react";
import { ModuleData, ModuleType } from "@/types/module";

type MenuPayload = {
  position: { x: number; y: number };
  nodeId: string;
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
  const menuPositionRef = useRef<{ x: number; y: number }>(null);
  const nodeIdRef = useRef<string>(null);

  const handleCloseMenu = () => setIsOpen(false);

  const handleAction = useCallback(
    (actionId: NodeAction) => {
      if (!nodeIdRef.current) {
        console.error(
          `Tried to execute NodeAction "${actionId}" with no NodeID.`,
        );
        return;
      }
      handleCloseMenu();
      handleNodeAction(actionId as NodeAction, nodeIdRef.current);
    },
    [handleNodeAction],
  );

  useImperativeHandle(ref, () => {
    return {
      open(payload: MenuPayload) {
        menuPositionRef.current = payload.position;
        nodeIdRef.current = payload.nodeId;
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
      items={NODE_CONTEXT_MENU}
      onAction={handleAction}
      onClose={handleCloseMenu}
    />
  );
};

export default NodeContextMenu;
