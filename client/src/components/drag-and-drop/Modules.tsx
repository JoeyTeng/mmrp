import { Box, Divider, InputAdornment, Stack, TextField } from "@mui/material";
import { useContext, useMemo, useState } from "react";
import { ModulesContext } from "@/contexts/ModulesContext";
import { SearchOutlined } from "@mui/icons-material";
import Fuse from "fuse.js";
import ModuleItemGroup from "./ModuleItemGroup";

export default function Modules() {
  const [searchQuery, setSearchQuery] = useState("");

  const modules = useContext(ModulesContext).sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  type GroupType = Record<
    string,
    { modules: typeof modules; minScore: number }
  >;

  const fuse = useMemo(
    () =>
      new Fuse(modules, {
        keys: [
          { name: "name", weight: 0.6 },
          { name: "type", weight: 0.3 },
          { name: "data.parameters.name", weight: 0.1 },
        ],
        includeScore: true,
        threshold: 0.3,
      }),
    [modules],
  );

  const filteredModules = useMemo(() => {
    if (!searchQuery)
      return modules.map((module) => ({ item: module, score: 1 }));
    return fuse.search(searchQuery);
  }, [fuse, modules, searchQuery]);

  const groupedModules = useMemo(() => {
    const grouped = filteredModules.reduce((accumulator, currentValue) => {
      const key = currentValue.item.name.charAt(0).toUpperCase();
      if (!accumulator[key]) {
        accumulator[key] = {
          modules: [currentValue.item],
          minScore: currentValue.score ?? 1,
        };
      } else {
        accumulator[key].modules.push(currentValue.item);
        accumulator[key].minScore = Math.max(
          accumulator[key].minScore,
          currentValue.score ?? 1,
        );
      }
      return accumulator;
    }, {} as GroupType);

    console.log(grouped);
    return grouped;
  }, [filteredModules]);
  console.log(modules);

  if (!modules) return;
  return (
    <Box>
      {/* <Box className="flex overflow-hidden h-full w-full flex-col"> */}
      <Box mb={2} mt={1}>
        <TextField
          autoFocus
          fullWidth
          size="small"
          label="Search"
          variant="outlined"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <SearchOutlined />
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>
      <Divider variant="fullWidth" className="mb-4" aria-hidden="true" />
      {/* <Box className="flex flex-wrap gap-2"> */}
      <Stack spacing={1} width={"100%"}>
        {/* {filteredModules.map((item) => (
          <ModuleItem
            key={item.id}
            id={item.id}
            name={item.name}
            moduleClass={item.moduleClass}
            parameters={item.data.parameters}
          />
        ))} */}
        {Object.entries(groupedModules)
          .sort((a, b) => a[1].minScore - b[1].minScore)
          .map(([title, moduleGroup]) => (
            <ModuleItemGroup
              key={title}
              title={title}
              modules={moduleGroup.modules}
            />
          ))}
      </Stack>
    </Box>
  );
}
