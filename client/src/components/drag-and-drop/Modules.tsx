import ModuleItem from "@/components/drag-and-drop/ModuleItem";
import { Box } from "@mui/material";
import { mapRoleToNodeType } from "./types";
import { useContext } from "react";
import { ModulesContext } from "@/contexts/ModulesContext";

export default function Modules() {
  const modules = useContext(ModulesContext);
  if (!modules) return;

  return (
    <Box className="flex overflow-hidden h-full w-full flex-col">
      <Box className="flex flex-wrap gap-2">
        {modules.map((item) => (
          <ModuleItem
            key={item.name}
            label={item.name}
            type={mapRoleToNodeType(item.role)}
          />
        ))}
      </Box>
    </Box>
  );
}
