"use client";
import { Box } from "@mui/material";
import { Module } from "@/types/module";
type ModuleItemProps = {
  module: Module;
};

export default function ModuleItem({ module }: ModuleItemProps) {
  const onDragStart = (event: React.DragEvent) => {
    const nodeData = JSON.stringify({ ...module });
    event.dataTransfer.setData("application/reactflow", nodeData);
    event.dataTransfer.effectAllowed = "copy";
  };

  const { name } = module;

  return (
    <Box
      draggable
      onDragStart={onDragStart}
      className="p-2 mb-1 border border-gray-300 bg-gray-50 rounded cursor-grab"
    >
      {name}
    </Box>
  );
}
