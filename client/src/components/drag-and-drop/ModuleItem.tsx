"use client";
import { ParameterDefinition } from "@/types/module";
import { Box, Tooltip } from "@mui/material";

export type ModuleItemProps = {
  id: string;
  name: string;
  moduleClass: string;
  parameters: ParameterDefinition[];
};

export default function ModuleItem({
  id,
  name,
  moduleClass,
  parameters,
}: ModuleItemProps) {
  const onDragStart = (event: React.DragEvent) => {
    const nodeData = JSON.stringify({ id, moduleClass });
    event.dataTransfer.setData("application/reactflow", nodeData);
    event.dataTransfer.effectAllowed = "copy";
  };

  return (
    <Tooltip
      title={`+ ${parameters.length} parameters`}
      arrow
      placement="right"
      slotProps={{
        popper: {
          modifiers: [{ name: "offset", options: { offset: [0, -8] } }],
        },
      }}
    >
      <Box
        draggable
        onDragStart={onDragStart}
        className="p-3 max-w-full mb-2 border border-gray-300 bg-white rounded-lg font-semibold text-sm text-gray-800 cursor-grab shadow-sm text-pretty"
      >
        {name}
      </Box>
    </Tooltip>
  );
}
