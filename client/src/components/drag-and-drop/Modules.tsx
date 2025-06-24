import ModuleItem from "@/components/drag-and-drop/ModuleItem";
import { Box } from "@mui/material";
import { NodeType } from "./types";

export default function Modules() {
  const MODULE_ITEMS = [
    { label: "Source", type: NodeType.InputNode },
    { label: "Denoise", type: NodeType.ProcessNode },
    { label: "Encode", type: NodeType.ProcessNode },
    { label: "Decode", type: NodeType.ProcessNode },
    { label: "UpSample", type: NodeType.ProcessNode },
    { label: "DownSample", type: NodeType.ProcessNode },
    { label: "Result", type: NodeType.OutputNode },
  ] as const;

  return (
    <Box className="flex overflow-hidden h-full w-full flex-col">
      <Box className="flex flex-wrap gap-2">
        {MODULE_ITEMS.map((item) => (
          <ModuleItem key={item.label} label={item.label} type={item.type} />
        ))}
      </Box>
    </Box>
  );
}
