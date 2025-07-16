import { useCallback, useImperativeHandle, useReducer } from "react";
import {
  ContextMenuActionPayload,
  contextMenuReducer,
  initialContextMenuState,
} from "./contextMenuReducer";
import { useCanvasActions } from "./useCanvasActions";
import {
  CANVAS_CONTEXT_MENU,
  CanvasContextAction,
} from "./CanvasContextMenuConfig";
import ContextMenu from "./ContextMenu";

export type CanvasContextMenuHandle = {
  open: (payload: ContextMenuActionPayload) => void;
  close: () => void;
  clearAll: () => void;
};

interface CanvasContextMenuProps {
  ref: React.RefObject<CanvasContextMenuHandle | null>;
  onRun: () => void;
}

const CanvasContextMenu = ({ ref, onRun }: CanvasContextMenuProps) => {
  const { handleCanvasAction } = useCanvasActions(onRun);

  const [contextMenuState, dispatchContextMenuState] = useReducer(
    contextMenuReducer,
    initialContextMenuState,
  );

  const handleCloseMenu = () => dispatchContextMenuState({ type: "close" });

  const handleAction = useCallback(
    (actionId: CanvasContextAction) => {
      handleCloseMenu();
      handleCanvasAction(actionId as CanvasContextAction);
    },
    [handleCanvasAction],
  );

  useImperativeHandle(ref, () => {
    return {
      open(payload: ContextMenuActionPayload) {
        dispatchContextMenuState({ type: "open", payload: payload });
      },
      close() {
        handleCloseMenu();
      },
      clearAll() {
        handleCanvasAction("clear" as CanvasContextAction);
      },
    };
  });

  return (
    <ContextMenu
      open={contextMenuState.open}
      dense
      position={contextMenuState.position}
      items={CANVAS_CONTEXT_MENU}
      onAction={handleAction}
      onClose={handleCloseMenu}
    />
  );
};

export default CanvasContextMenu;
