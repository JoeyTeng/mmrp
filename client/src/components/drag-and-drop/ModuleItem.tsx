"use client";
import { Box } from "@mui/material";

type ModuleItemProps = {
  id: string;
  name: string;
  moduleClass: string;
};

export default function ModuleItem({ id, name, moduleClass }: ModuleItemProps) {
  const onDragStart = (event: React.DragEvent) => {
    const nodeData = JSON.stringify({ id, name, moduleClass });
    event.dataTransfer.setData("application/reactflow", nodeData);
    event.dataTransfer.effectAllowed = "copy";
  };

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
