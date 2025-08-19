import { useCallback, useImperativeHandle, useRef, useState } from "react";
import { useCanvasActions } from "./useCanvasActions";
import {
  getCanvasContextMenu,
  CanvasContextAction,
} from "./CanvasContextMenuConfig";
import ContextMenu from "../../util/ContextMenu";
import { useVideoReload } from "@/contexts/VideoReloadContext";

export type CanvasContextMenuHandle = {
  open: (position: { x: number; y: number }) => void;
  close: () => void;
  clearAll: () => void;
};

interface CanvasContextMenuProps {
  ref: React.RefObject<CanvasContextMenuHandle | null>;
  onRun: () => void;
}

const CanvasContextMenu = ({ ref, onRun }: CanvasContextMenuProps) => {
  const { handleCanvasAction, isEmpty } = useCanvasActions(onRun);
  const { isProcessing } = useVideoReload();

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const menuPositionRef = useRef<{ x: number; y: number }>(null);

  const handleCloseMenu = () => setIsOpen(false);

  const handleAction = useCallback(
    (actionId: CanvasContextAction) => {
      handleCloseMenu();
      if (actionId === "clear") {
        if (isEmpty()) {
          return;
        }
      }
      handleCanvasAction(actionId as CanvasContextAction);
    },
    [handleCanvasAction, isEmpty],
  );

  useImperativeHandle(ref, () => {
    return {
      open(position: { x: number; y: number }) {
        menuPositionRef.current = position;
        setIsOpen(true);
      },
      close() {
        handleCloseMenu();
      },
      clearAll() {
        handleAction("clear" as CanvasContextAction);
      },
    };
  });

  return (
    <ContextMenu
      open={isOpen}
      dense
      position={menuPositionRef.current}
      items={getCanvasContextMenu(isProcessing)}
      onAction={handleAction}
      onClose={handleCloseMenu}
    />
  );
};

export default CanvasContextMenu;
