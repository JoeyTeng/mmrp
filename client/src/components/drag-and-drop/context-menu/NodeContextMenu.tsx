import { useCallback, useImperativeHandle, useRef, useState } from "react";
import { NODE_CONTEXT_MENU, NodeAction } from "./NodeContextMenuConfig";
import ContextMenu from "../../util/ContextMenu";
import { useNodeActions } from "./useNodeActions";
import { Node } from "@xyflow/react";
import { ModuleData, ModuleType } from "@/types/module";
import Modal from "@/components/util/Modal";
import { CANVAS_MODAL_OPTIONS, CanvasModalAction } from "./CanvasModal";

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
  const { handleNodeAction, isBreakingChangeOnDelete, getNodeName } =
    useNodeActions(onEditNode);

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
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
      if (actionId === "delete") {
        if (isBreakingChangeOnDelete(nodeIdRef.current)) {
          setIsModalOpen(true);
          return;
        }
      }
      handleNodeAction(actionId as NodeAction, nodeIdRef.current);
    },
    [handleNodeAction, isBreakingChangeOnDelete],
  );

  const handleCloseModal = () => setIsModalOpen(false);

  const handleModalAction = useCallback(
    (actionId: CanvasModalAction) => {
      handleCloseMenu();
      switch (actionId) {
        case "cancel": {
          handleCloseModal();
          return;
        }
        case "delete": {
          if (!nodeIdRef.current) {
            console.error(
              `Tried to execute NodeAction "${actionId}" with no NodeID.`,
            );
            return;
          }
          handleNodeAction("delete" as NodeAction, nodeIdRef.current);
          handleCloseModal();
          return;
        }
      }
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
    <>
      <ContextMenu
        open={isOpen}
        dense
        position={menuPositionRef.current}
        items={NODE_CONTEXT_MENU}
        onAction={handleAction}
        onClose={handleCloseMenu}
      />
      <Modal
        open={isModalOpen}
        title={
          nodeIdRef.current ? `Delete "${getNodeName(nodeIdRef.current)}"?` : ""
        }
        description={[
          "Deleting this module will break one or more pipeline flows.",
          "Are you sure you want to delete this module?",
        ]}
        options={CANVAS_MODAL_OPTIONS}
        onAction={handleModalAction}
        onClose={handleCloseModal}
      />
    </>
  );
};

export default NodeContextMenu;
