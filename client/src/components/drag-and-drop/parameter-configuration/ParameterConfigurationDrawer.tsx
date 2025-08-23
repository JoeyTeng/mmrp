"use client";

import { useCallback, useEffect, useState } from "react";
import { Node, useReactFlow } from "@xyflow/react";
import { AppDrawer } from "@/components/sidebar/AppDrawer";
import { ParameterConfigurationDrawerProps } from "../types";
import { ModuleData, ModuleType, ParamValueType } from "@/types/module";
import ParameterConfiguration from "./ParameterConfiguration";
import {
  Box,
  Button,
  Divider,
  IconButton,
  InputAdornment,
  MenuItem,
  TextField,
} from "@mui/material";
import { Delete, SearchOutlined } from "@mui/icons-material";
import { usePersistTemplate } from "@/hooks/usePersistTemplate";
import { useMemo } from "react";

export default function ParameterConfigurationDrawer({
  editingNode,
  clearEditingNode,
}: ParameterConfigurationDrawerProps) {
  const {
    templates,
    addTemplate,
    removeTemplate,
    exportTemplate,
    importTemplate,
  } = usePersistTemplate();

  const [tempNode, setTempNode] =
    useState<Node<ModuleData, ModuleType>>(editingNode);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setTempNode(editingNode);
  }, [editingNode]);

  const { setNodes } = useReactFlow();

  const handleConfirm = useCallback(
    (updatedNode: Node<ModuleData, ModuleType>) => {
      setNodes((nodes) =>
        nodes.map((n) => (n.id === updatedNode.id ? updatedNode : n)),
      );
      clearEditingNode();
    },
    [setNodes, clearEditingNode],
  );

  const handleCancel = () => {
    clearEditingNode();
  };

  const handleParamChange = useCallback(
    (paramName: string, value: ParamValueType) => {
      setTempNode((prev) => {
        const updatedParameters = prev.data.parameters.map((param) =>
          param.name === paramName
            ? { ...param, metadata: { ...param.metadata, value } }
            : param,
        );

        return {
          ...prev,
          data: {
            ...prev.data,
            parameters: updatedParameters,
          },
        };
      });
    },
    [],
  );

  const currentTemplates = useMemo(
    () => templates.filter((t) => t.moduleClass === tempNode?.data.moduleClass),
    [templates, tempNode],
  );

  return (
    <AppDrawer
      open={Boolean(editingNode)}
      onClose={handleCancel}
      title={editingNode ? `Edit ${editingNode.data.name}` : "Edit Parameters"}
      width={400}
      anchor="right"
    >
      <Box display="flex" flexDirection="column" height="100%" width="100%">
        <Box sx={{ m: 2, mb: 0 }}>
          <TextField
            select
            fullWidth
            size="small"
            value=""
            label="Apply Template"
            onChange={(e) => {
              const selected = templates.find((t) => t.name === e.target.value);
              if (selected) {
                setTempNode((prev) => ({
                  ...prev,
                  data: {
                    ...prev.data,
                    parameters: prev.data.parameters.map((param) => ({
                      ...param,
                      metadata: {
                        ...param.metadata,
                        value:
                          selected.parameters[param.name] ??
                          param.metadata.value,
                      },
                    })),
                  },
                }));
              }
            }}
          >
            {currentTemplates.length === 0 ? (
              <MenuItem value="Apply Template" disabled>
                No Templates Available. Import or save one.
              </MenuItem>
            ) : (
              currentTemplates.map((t) => (
                <MenuItem
                  key={t.name}
                  value={t.name}
                  sx={{ display: "flex", justifyContent: "space-between" }}
                >
                  {t.name}
                  <IconButton
                    size="small"
                    edge="end"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeTemplate(t.name, t.moduleClass);
                    }}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </MenuItem>
              ))
            )}
          </TextField>
        </Box>
        <Box m={2}>
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
        <Divider variant="fullWidth" className="my-2 mx-4" aria-hidden="true" />
        <Box flex={1} overflow="auto">
          <ParameterConfiguration
            node={tempNode}
            onParamChange={handleParamChange}
            searchQuery={searchQuery.trim()}
          />
        </Box>
        <Box sx={{ mt: 2, display: "flex", gap: 2 }}>
          <Button
            fullWidth
            className="p-3 max-w-full border border-gray-300 bg-white rounded-lg font-semibold text-sm text-gray-800 shadow-sm text-pretty"
            sx={{ flex: 1, textTransform: "none" }}
            onClick={() => {
              setTempNode((prev) => {
                const updatedParameters = prev.data.parameters.map((param) => ({
                  ...param,
                  metadata: {
                    ...param.metadata,
                    value: param.metadata.constraints.default,
                  },
                }));
                return {
                  ...prev,
                  data: {
                    ...prev.data,
                    parameters: updatedParameters,
                  },
                };
              });
            }}
          >
            Reset to Defaults
          </Button>
          <Button
            fullWidth
            className="p-3 max-w-full border border-gray-300 bg-white rounded-lg font-semibold text-sm text-gray-800 shadow-sm text-pretty"
            sx={{ flex: 1, textTransform: "none" }}
            onClick={() => {
              if (!tempNode) return;
              const name = prompt("Enter a template name:");
              if (!name) return;
              addTemplate({
                name,
                moduleClass: tempNode.data.moduleClass,
                parameters: Object.fromEntries(
                  tempNode.data.parameters.map((p) => [
                    p.name,
                    p.metadata.value,
                  ]),
                ),
              });
            }}
          >
            Save as Template
          </Button>
        </Box>
        <Box sx={{ mt: 2, display: "flex", gap: 2 }}>
          <Button
            className="p-3 max-w-full border border-gray-300 bg-white rounded-lg font-semibold text-sm text-gray-800 shadow-sm text-pretty"
            sx={{ flex: 1, textTransform: "none" }}
            onClick={() => {
              if (tempNode) {
                exportTemplate({
                  name: tempNode.data.name || "template",
                  moduleClass: tempNode.data.moduleClass,
                  parameters: Object.fromEntries(
                    tempNode.data.parameters.map((p) => [
                      p.name,
                      p.metadata.value,
                    ]),
                  ),
                });
              }
            }}
          >
            Export Template
          </Button>
          <Button
            component="label"
            className="p-3 max-w-full border border-gray-300 bg-white rounded-lg font-semibold text-sm text-gray-800 shadow-sm text-pretty"
            sx={{ flex: 1, textTransform: "none" }}
          >
            Import Template
            <input
              type="file"
              accept="application/json"
              hidden
              onChange={(e) => {
                if (e.target.files?.[0] && tempNode) {
                  importTemplate(e.target.files[0], tempNode.data.moduleClass);
                }
                e.target.value = "";
              }}
            />
          </Button>
        </Box>
        <Box
          sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 2 }}
        >
          <Button variant="outlined" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            className="bg-primary"
            variant="contained"
            onClick={() => handleConfirm(tempNode)}
            disabled={!editingNode || !tempNode}
          >
            Confirm
          </Button>
        </Box>
      </Box>
    </AppDrawer>
  );
}
