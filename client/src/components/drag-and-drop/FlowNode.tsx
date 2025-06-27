"use client";
import { Handle, Node, NodeProps, Position, useReactFlow } from "@xyflow/react";
import { MoreVertOutlined as MenuIcon } from "@mui/icons-material";

import { NodeAction, NodeData, NodeType } from "./types";
import { IconButton } from "@mui/material";
import { useState } from "react";
import NodeContextMenu from "./NodeContextMenu";
import DeleteModal from "./DeleteModal";

type CustomNode = Node<NodeData>;

export default function FlowNode({
  id,
  type,
  data: { label, params },
  selected,
}: NodeProps<CustomNode>) {
  const { deleteElements, setNodes, getNodeConnections } = useReactFlow();

  const [contextMenuPos, setContextMenuPos] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const isBreakingChange = getNodeConnections({ nodeId: id }).length > 0;

  const setNodeSelected = (selected: boolean) => {
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === id
          ? { ...node, selected: selected }
          : { ...node, selected: false },
      ),
    );
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    if (contextMenuPos) {
      setContextMenuPos(null);
      return;
    }

    e.preventDefault();
    setNodeSelected(true);
    setContextMenuPos({
      x: e.clientX,
      y: e.clientY,
    });
  };

  const handleCloseMenu = () => setContextMenuPos(null);

  const handleNodeAction = (action: NodeAction) => {
    switch (action) {
      case NodeAction.Delete:
        setIsDeleteModalOpen(true);
        break;

      default:
        break;
    }
  }; // will implement other context menu actions here

  const MAX_VISIBLE = 4; //default no of params visible in node

  return (
    <div onContextMenu={handleContextMenu}>
      <div
        className={`w-40 bg-white rounded-lg overflow-hidden text-sm ${selected ? "border border-black-100" : "border border-gray-300"}`}
      >
        <div className="pl-3 pr-1 py-1 font-semibold text-gray-800 flex justify-between items-center">
          {label}
          <IconButton
            onClick={(e) => {
              // e.stopPropagation();
              setNodeSelected(true);
              setContextMenuPos({ x: e.clientX, y: e.clientY });
            }}
            size="small"
            aria-label="Module options"
            sx={{
              padding: 0,
            }}
          >
            <MenuIcon />
          </IconButton>
        </div>
        <div className="border-t border-gray-300" />
        <div className="px-3 py-1 space-y-1">
          {/* by default show the first 4 params */}
          {Object.entries(params)
            .slice(0, MAX_VISIBLE)
            .map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="font-medium text-gray-500">{key}</span>
                <span className="text-gray-600 max-w-[55%] truncate break-words">
                  {String(value)}
                </span>
              </div>
            ))}
          {Object.entries(params).length > MAX_VISIBLE && (
            <div className="text-left text-gray-400">…</div>
          )}
        </div>
        {type !== NodeType.InputNode ? (
          <Handle type="target" position={Position.Left} />
        ) : null}

        {type !== NodeType.OutputNode ? (
          <Handle type="source" position={Position.Right} />
        ) : null}
      </div>
      <NodeContextMenu
        position={contextMenuPos}
        onClose={handleCloseMenu}
        onAction={handleNodeAction}
        open={!!contextMenuPos}
      />
      {isDeleteModalOpen && (
        <DeleteModal
          moduleTitle={label}
          isBreakingChange={isBreakingChange}
          onCancel={() => setIsDeleteModalOpen(false)}
          onDelete={() => deleteElements({ nodes: [{ id }] })}
        />
      )}
    </div>
  );
}
