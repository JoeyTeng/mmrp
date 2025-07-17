import { useCallback, useImperativeHandle, useRef, useState } from "react";
import { useCanvasActions } from "./useCanvasActions";
import {
  CANVAS_CONTEXT_MENU,
  CanvasContextAction,
} from "./CanvasContextMenuConfig";
import ContextMenu from "../../util/ContextMenu";

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
  const { handleCanvasAction } = useCanvasActions(onRun);

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const menuPositionRef = useRef<{ x: number; y: number }>(null);

  const handleCloseMenu = () => setIsOpen(false);

  const handleAction = useCallback(
    (actionId: CanvasContextAction) => {
      handleCloseMenu();
      handleCanvasAction(actionId as CanvasContextAction);
    },
    [handleCanvasAction],
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
        handleCanvasAction("clear" as CanvasContextAction);
      },
    };
  });

  return (
    <ContextMenu
      open={isOpen}
      dense
      position={menuPositionRef.current}
      items={CANVAS_CONTEXT_MENU}
      onAction={handleAction}
      onClose={handleCloseMenu}
    />
  );
};

export default CanvasContextMenu;
