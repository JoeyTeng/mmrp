"use client";
import { Handle, Node, NodeProps, Position } from "@xyflow/react";
import { MoreVertOutlined as MenuIcon } from "@mui/icons-material";

import { NodeData, NodeType } from "./types";
import { IconButton } from "@mui/material";

type CustomNode = Node<NodeData>;

export interface FlowNodeProps extends NodeProps<CustomNode> {
  onOpenMenu?: (e: React.MouseEvent, nodeId: string) => void;
}

export default function FlowNode({
  id,
  type,
  data: { label, params },
  selected,
  onOpenMenu,
}: FlowNodeProps) {
  const MAX_VISIBLE = 4; //default no of params visible in node

  return (
    <div>
      <div
        className={`w-40 bg-white rounded-lg overflow-hidden text-sm border ${selected ? "border-black-100" : "border-gray-300"}`}
      >
        <div className="pl-3 pr-1 py-1 font-semibold text-gray-800 flex justify-between items-center">
          {label}
          <IconButton
            onClick={(e) => {
              e.preventDefault();
              onOpenMenu?.(e, id);
            }}
            size="small"
            aria-label="Module options"
            sx={{ padding: 0 }}
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
    </div>
  );
}
