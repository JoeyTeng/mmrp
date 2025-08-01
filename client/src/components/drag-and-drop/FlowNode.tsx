"use client";

import { Handle, Node, NodeProps, Position } from "@xyflow/react";
import { MoreVertOutlined as MenuIcon } from "@mui/icons-material";

import { NodeData, NodePort } from "./types";
import { NodeType } from "@/types/module";
import { IconButton } from "@mui/material";
import { Tooltip } from "@mui/material";

type CustomNode = Node<NodeData>;

export interface FlowNodeProps extends NodeProps<CustomNode> {
  onOpenMenu?: (e: React.MouseEvent, nodeId: string) => void;
}

export default function FlowNode({
  id,
  type,
  data: { name, params, inputFormats = [], outputFormats = [] },
  selected,
  onOpenMenu,
}: FlowNodeProps) {
  const MAX_VISIBLE = 4; //default no of params visible in node

  function tooltip(port: NodePort) {
    const { width, height, frameRate, pixelFormat, colorSpace } = port.formats;
    return [
      width && height && `Resolution: ${width}×${height}`,
      frameRate && `Frame rate: ${frameRate}fps`,
      pixelFormat && `Pixel format: ${pixelFormat}`,
      colorSpace && `Colorspace: ${colorSpace}`,
    ]
      .filter(Boolean)
      .join("\n");
  }

  return (
    <div
      className={`w-40 bg-white rounded-lg overflow-hidden text-sm border ${selected ? "border-black-100" : "border-gray-300"}`}
    >
      <div className="pl-3 pr-1 py-1 font-semibold text-gray-800 flex justify-between items-center">
        {name}
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
      {type !== NodeType.InputNode
        ? inputFormats.map((port, index) => (
            <Tooltip
              key={port.id}
              title={
                <span style={{ whiteSpace: "pre-line" }}>{tooltip(port)}</span>
              }
            >
              <Handle
                key={port.id}
                id={port.id}
                type="target"
                position={Position.Left}
                style={{
                  top: `${((index + 1) / (inputFormats.length + 1)) * 100}%`,
                }}
              />
            </Tooltip>
          ))
        : null}

      {type !== NodeType.OutputNode
        ? outputFormats.map((port, index) => (
            <Tooltip
              key={port.id}
              title={
                <span style={{ whiteSpace: "pre-line" }}>{tooltip(port)}</span>
              }
            >
              <Handle
                key={port.id}
                id={port.id}
                type="source"
                position={Position.Right}
                style={{
                  top: `${((index + 1) / (outputFormats.length + 1)) * 100}%`,
                }}
              />
            </Tooltip>
          ))
        : null}
    </div>
  );
}
