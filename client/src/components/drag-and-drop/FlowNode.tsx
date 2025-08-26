"use client";

import { Handle, Node, NodeProps, Position } from "@xyflow/react";
import { MoreVertOutlined as MenuIcon } from "@mui/icons-material";

import { ModuleData, ModuleFormat, ModuleType } from "@/types/module";
import { Box, IconButton } from "@mui/material";
import { Tooltip } from "@mui/material";

type CustomNode = Node<ModuleData>;

export interface FlowNodeProps extends NodeProps<CustomNode> {
  onOpenMenu?: (e: React.MouseEvent, nodeId: string) => void;
}

export default function FlowNode({
  id,
  type,
  data,
  selected,
  onOpenMenu,
}: FlowNodeProps) {
  const MAX_VISIBLE = 3; //default no of params visible in node
  const { name, parameters, inputFormats, outputFormats } = data;

  const visibleParams =
    parameters.length > MAX_VISIBLE && MAX_VISIBLE > 0
      ? parameters.slice(0, MAX_VISIBLE - 1)
      : parameters.slice(0, MAX_VISIBLE);

  function tooltip(format: ModuleFormat) {
    const { width, height, frameRate, pixelFormat, colorSpace } =
      format.default;
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
    <Box
      className={`w-40 bg-white rounded-lg overflow-hidden text-sm border ${selected ? "border-black-100" : "border-gray-300"}`}
    >
      <Box className="pl-3 pr-1 py-1 font-semibold text-gray-800 flex justify-between items-center">
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
      </Box>
      <div className="border-t border-gray-300" />
      <Box className="px-3 py-1 space-y-1">
        {visibleParams.map(({ name, metadata }) => (
          <div key={name} className="flex justify-between gap-3">
            <span className="font-medium text-gray-500 truncate text-pretty break-keep flex-1">
              {name}
            </span>
            <span className="text-gray-600 max-w-[65%] truncate break-normal">
              {String(metadata.value)}
            </span>
          </div>
        ))}
        {parameters.length > MAX_VISIBLE && (
          <div className="text-left text-gray-400">{`+ ${parameters.length - visibleParams.length} more`}</div>
        )}
      </Box>
      {type !== ModuleType.InputNode
        ? inputFormats.map((port, index) => (
            <Tooltip
              key={`input-${index}`}
              title={
                <span style={{ whiteSpace: "pre-line" }}>{tooltip(port)}</span>
              }
            >
              <Handle
                id={`input-${index}-handle`}
                key={`input-${index}-handle`}
                type="target"
                position={Position.Left}
                style={{
                  top: `${((index + 1) / (inputFormats.length + 1)) * 100}%`,
                }}
              />
            </Tooltip>
          ))
        : null}
      {type !== ModuleType.OutputNode
        ? outputFormats.map((port, index) => (
            <Tooltip
              key={`output-${index}`}
              title={
                <span style={{ whiteSpace: "pre-line" }}>{tooltip(port)}</span>
              }
            >
              <Handle
                id={`output-${index}-handle`}
                key={`output-${index}-handle`}
                type="source"
                position={Position.Right}
                style={{
                  top: `${((index + 1) / (outputFormats.length + 1)) * 100}%`,
                }}
              />
            </Tooltip>
          ))
        : null}
    </Box>
  );
}
