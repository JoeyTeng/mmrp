import { useCallback, useImperativeHandle, useReducer } from "react";
import {
  contextMenuReducer,
  initialNodeContextMenuState,
  NodeContextMenuActionPayload,
} from "./contextMenuReducer";
import { NODE_CONTEXT_MENU, NodeAction } from "./NodeContextMenuConfig";
import ContextMenu from "./ContextMenu";
import { useNodeActions } from "./useNodeActions";
import { Node } from "@xyflow/react";
import { NodeData, NodeType } from "../types";

export type NodeContextMenuHandle = {
  open: (payload: NodeContextMenuActionPayload) => void;
  close: () => void;
};

interface NodeContextMenuProps {
  ref: React.RefObject<NodeContextMenuHandle | null>;
  onEditNode: (node: Node<NodeData, NodeType>) => void;
}

const NodeContextMenu = ({ ref, onEditNode }: NodeContextMenuProps) => {
  const { handleNodeAction } = useNodeActions(onEditNode);

  const [contextMenuState, dispatchContextMenuState] = useReducer(
    contextMenuReducer,
    initialNodeContextMenuState,
  );

  const handleCloseMenu = () => dispatchContextMenuState({ type: "close" });

  const handleAction = useCallback(
    (actionId: NodeAction) => {
      if (!contextMenuState.nodeId) {
        console.error(
          `Tried to execute NodeAction "${actionId}" with no NodeID.`,
        );
        return;
      }
      handleCloseMenu();
      handleNodeAction(actionId as NodeAction, contextMenuState.nodeId);
    },
    [contextMenuState.nodeId, handleNodeAction],
  );

  useImperativeHandle(ref, () => {
    return {
      open(payload: NodeContextMenuActionPayload) {
        dispatchContextMenuState({ type: "open", payload: payload });
      },
      close() {
        handleCloseMenu();
      },
    };
  });

  return (
    <ContextMenu
      open={contextMenuState.open}
      dense
      position={contextMenuState.position}
      items={NODE_CONTEXT_MENU}
      onAction={handleAction}
      onClose={handleCloseMenu}
    />
  );
};

export default NodeContextMenu;
