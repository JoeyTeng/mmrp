"use client";

import { Handle, Node, NodeProps, Position } from "@xyflow/react";
import { MoreVertOutlined as MenuIcon } from "@mui/icons-material";

import { NodeData, NodePort } from "./types";
import { NodeType } from "@/types/module";
import { IconButton } from "@mui/material";
import { Tooltip } from "@mui/material";
import {
  isFrameworkHandledParameter,
  stringSanitizer,
} from "@/utils/sharedFunctionality";

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
  const MAX_VISIBLE = 3; //default no of params visible in node

  const paramEntries = Object.entries(params);

  const visibleParams =
    paramEntries.length > MAX_VISIBLE && MAX_VISIBLE > 0
      ? paramEntries
          .filter(([key]) => !isFrameworkHandledParameter(key))
          .slice(0, MAX_VISIBLE - 1)
      : paramEntries
          .filter(([key]) => !isFrameworkHandledParameter(key))
          .slice(0, MAX_VISIBLE);

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
        {stringSanitizer(name)}
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
        {visibleParams.map(([key, value]) => (
          <div key={key} className="flex justify-between gap-3">
            <span className="font-medium text-gray-500 truncate text-pretty break-keep flex-1">
              {key}
            </span>
            <span className="text-gray-600 max-w-[65%] truncate break-normal">
              {String(value)}
            </span>
          </div>
        ))}
        {paramEntries.length > MAX_VISIBLE && (
          <div className="text-left text-gray-400">{`+ ${paramEntries.length - visibleParams.length} more`}</div>
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
