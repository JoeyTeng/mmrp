"use client";
import { Box } from "@mui/material";
import { Module } from "@/types/module";
type ModuleItemProps = {
  module: Module;
};

export default function ModuleItem({ module }: ModuleItemProps) {
  const onDragStart = (event: React.DragEvent) => {
    const nodeData = JSON.stringify(module);
    event.dataTransfer.setData("application/reactflow", nodeData);
    event.dataTransfer.effectAllowed = "copy";
  };

  return (
    <Box
      draggable
      onDragStart={onDragStart}
      className="p-3 max-w-full mb-2 border border-gray-300 bg-white rounded-lg font-semibold text-sm text-gray-800 cursor-grab shadow-sm text-pretty"
    >
      {module.data.name}
    </Box>
  );
}
