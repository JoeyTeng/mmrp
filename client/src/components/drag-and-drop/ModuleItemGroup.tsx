import { Box, Divider } from "@mui/material";
import ModuleItem from "./ModuleItem";
import { Module } from "@/types/module";

type ModuleItemGroupProps = {
  title: string;
  modules: Module[];
};

const ModuleItemGroup = ({ title, modules }: ModuleItemGroupProps) => {
  return (
    <Box>
      <Box className="font-light text-sm text-gray-500 sticky top-0 z-10 bg-white shadow-xs">
        {title}
        <Divider className="mb-4" />
      </Box>
      <Box>
        {modules.map((module) => (
          <ModuleItem key={module.id} module={module} />
        ))}
      </Box>
    </Box>
  );
};

export default ModuleItemGroup;
