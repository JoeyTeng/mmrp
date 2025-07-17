import { useCallback, useImperativeHandle, useRef, useState } from "react";
import { useCanvasActions } from "./useCanvasActions";
import {
  CANVAS_CONTEXT_MENU,
  CanvasContextAction,
} from "./CanvasContextMenuConfig";
import ContextMenu from "../../util/ContextMenu";
import Modal from "@/components/util/Modal";
import { CANVAS_MODAL_OPTIONS, CanvasModalAction } from "./CanvasModal";

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

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const menuPositionRef = useRef<{ x: number; y: number }>(null);

  const handleCloseMenu = () => setIsOpen(false);

  const handleAction = useCallback(
    (actionId: CanvasContextAction) => {
      if (actionId === "clear") {
        console.info(isEmpty);
        if (!isEmpty) {
          setIsModalOpen(true);
        }
        handleCloseMenu();
        return;
      }
      handleCloseMenu();
      handleCanvasAction(actionId as CanvasContextAction);
    },
    [handleCanvasAction, isEmpty],
  );

  const handleCloseModal = () => setIsModalOpen(false);

  const handleModalAction = useCallback(
    (actionId: CanvasModalAction) => {
      handleCloseMenu();
      switch (actionId) {
        case "cancel":
          handleCloseModal();
          return;
        case "delete": {
          handleCanvasAction("clear" as CanvasContextAction);
          handleCloseModal();
          return;
        }
      }
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
        handleAction("clear" as CanvasContextAction);
      },
    };
  });

  return (
    <>
      <ContextMenu
        open={isOpen}
        dense
        position={menuPositionRef.current}
        items={CANVAS_CONTEXT_MENU}
        onAction={handleAction}
        onClose={handleCloseMenu}
      />
      <Modal
        open={isModalOpen}
        title="Delete all modules?"
        description={[
          "Are you sure you want to permanently delete all modules in the pipeline?",
          "This action cannot be undone.",
        ]}
        options={CANVAS_MODAL_OPTIONS}
        onAction={handleModalAction}
        onClose={handleCloseModal}
      />
    </>
  );
};

export default CanvasContextMenu;
