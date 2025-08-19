import { Box, Divider, InputAdornment, Stack, TextField } from "@mui/material";
import { useMemo, useState } from "react";
import { useModulesContext } from "@/contexts/ModulesContext";
import { SearchOutlined } from "@mui/icons-material";
import Fuse from "fuse.js";
import ModuleItemGroup from "./ModuleItemGroup";
import { ModuleType } from "@/types/module";

export default function Modules() {
  const [searchQuery, setSearchQuery] = useState("");
  const searchQueryTrimmed = searchQuery.trim();

  const { modules } = useModulesContext();
  const modulesSorted = useMemo(() => {
    return [...modules].sort((a, b) => a.data.name.localeCompare(b.data.name));
  }, [modules]);

  type GroupType = Record<
    string,
    { modules: typeof modules; minScore: number }
  >;

  const fuse = useMemo(() => {
    return new Fuse(modulesSorted, {
      keys: [
        { name: "data.name", weight: 0.6 },
        { name: "type", weight: 0.3 },
        { name: "data.parameters.name", weight: 0.1 },
      ],
      includeScore: true,
      threshold: 0.3,
    });
  }, [modulesSorted]);

  const groupedModules = useMemo(() => {
    const results = searchQueryTrimmed
      ? fuse.search(searchQueryTrimmed)
      : modulesSorted.map((module) => ({ item: module, score: 1 }));
    const grouped = results.reduce((accumulator, currentValue) => {
      const key =
        currentValue.item.type === ModuleType.InputNode ||
        currentValue.item.type === ModuleType.OutputNode
          ? "Input and Output"
          : currentValue.item.data.name.charAt(0).toUpperCase();
      if (!accumulator[key]) {
        accumulator[key] = {
          modules: [currentValue.item],
          minScore: currentValue.score ?? 1,
        };
      } else {
        accumulator[key].modules.push(currentValue.item);
        accumulator[key].minScore = Math.min(
          accumulator[key].minScore,
          currentValue.score ?? 1,
        );
      }
      return accumulator;
    }, {} as GroupType);

    return grouped;
  }, [fuse, modulesSorted, searchQueryTrimmed]);

  if (!modules) return;
  return (
    <Box className="flex flex-col h-full">
      <Box mb={2} mt={1} className="shrink-0">
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
      <Stack spacing={1} width={"100%"} className="overflow-y-auto flex-1">
        {Object.entries(groupedModules)
          .sort(([aKey, aVal], [bKey, bVal]) => {
            if (!searchQueryTrimmed) {
              if (aKey === "Input and Output") return -1;
              if (bKey === "Input and Output") return 1;
            }
            return aVal.minScore - bVal.minScore;
          })
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
