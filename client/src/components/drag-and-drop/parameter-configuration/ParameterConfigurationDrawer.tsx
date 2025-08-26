"use client";

import { useCallback, useEffect, useState } from "react";
import { Node, useReactFlow } from "@xyflow/react";
import { AppDrawer } from "@/components/sidebar/AppDrawer";
import { ParameterConfigurationDrawerProps } from "../types";
import {
  FormatDefinition,
  ModuleData,
  ModuleType,
  ParamValueType,
} from "@/types/module";
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
import { usePersistPreset } from "@/hooks/usePersistPreset";
import { useMemo } from "react";
import { compatibleFormats, evaluateFormula } from "../util";
import { toast } from "react-toastify/unstyled";

export default function ParameterConfigurationDrawer({
  editingNode,
  clearEditingNode,
}: ParameterConfigurationDrawerProps) {
  const { presets, addPreset, removePreset, exportPreset, importPreset } =
    usePersistPreset();

  const [tempNode, setTempNode] =
    useState<Node<ModuleData, ModuleType>>(editingNode);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setTempNode(editingNode);
  }, [editingNode]);

  function updateOutputFormatDefaults(node: Node<ModuleData, ModuleType>) {
    const params = Object.fromEntries(
      (node.data.parameters ?? []).map((p) => [
        p.name,
        p.metadata?.value ?? p.metadata?.constraints?.default,
      ]),
    ) as Record<string, ParamValueType>;

    return (node.data.outputFormats ?? []).map((spec) => {
      if (!spec.formula) return spec;
      const nextDefault = { ...spec.default } as Record<string, unknown>;
      for (const [field, expr] of Object.entries(spec.formula)) {
        const v = evaluateFormula(expr, params);
        if (v !== undefined) nextDefault[field] = v;
      }
      return { ...spec, default: nextDefault as typeof spec.default };
    });
  }

  const { setNodes, getEdges, getNode, setEdges } = useReactFlow();
  const revalidateEdgesForNode = useCallback(
    (updated: Node<ModuleData, ModuleType>) => {
      const es = getEdges();
      const next = es.map((e) => {
        // only touch edges connected to this node
        if (e.source !== updated.id && e.target !== updated.id) return e;

        // Get the original node (before update) to check previous validity
        const originalNode = getNode(updated.id) as
          | Node<ModuleData, ModuleType>
          | undefined;
        if (!originalNode) return e;

        // Check validity before the update
        const srcBefore = (
          e.source === updated.id ? originalNode : getNode(e.source)
        ) as Node<ModuleData, ModuleType> | undefined;
        const tgtBefore = (
          e.target === updated.id ? originalNode : getNode(e.target)
        ) as Node<ModuleData, ModuleType> | undefined;

        let wasValid = true;
        if (srcBefore && tgtBefore) {
          const outsBefore: FormatDefinition[] = (
            srcBefore.data?.outputFormats ?? []
          ).map((f) => f.default);
          const insBefore: FormatDefinition[] = (
            tgtBefore.data?.inputFormats ?? []
          ).map((f) => f.default);
          wasValid = compatibleFormats(outsBefore, insBefore);
        }

        // Check validity after the update
        const srcAfter = (
          e.source === updated.id ? updated : getNode(e.source)
        ) as Node<ModuleData, ModuleType> | undefined;
        const tgtAfter = (
          e.target === updated.id ? updated : getNode(e.target)
        ) as Node<ModuleData, ModuleType> | undefined;
        if (!srcAfter || !tgtAfter) return e;

        const outsAfter: FormatDefinition[] = (
          srcAfter.data?.outputFormats ?? []
        ).map((f) => f.default);
        const insAfter: FormatDefinition[] = (
          tgtAfter.data?.inputFormats ?? []
        ).map((f) => f.default);
        const isValidAfter = compatibleFormats(outsAfter, insAfter);

        // Only toast if edge WAS valid but became invalid
        if (wasValid && !isValidAfter) {
          const srcName = srcAfter.data?.name ?? srcAfter.id;
          const tgtName = tgtAfter.data?.name ?? tgtAfter.id;
          toast.error(
            `Connection became invalid between ${srcName} and ${tgtName}`,
          );
        }

        return {
          ...e,
          style: isValidAfter
            ? undefined
            : { stroke: "#ef4444", strokeDasharray: "4 4" },
          animated: !isValidAfter,
        };
      });

      setEdges(next);
    },
    [getEdges, getNode, setEdges],
  );

  const handleConfirm = useCallback(
    (updatedNode: Node<ModuleData, ModuleType>) => {
      const nodeWithComputedFormats: Node<ModuleData, ModuleType> = {
        ...updatedNode,
        data: {
          ...updatedNode.data,
          outputFormats: updateOutputFormatDefaults(updatedNode),
        },
      };
      setNodes((nodes) =>
        nodes.map((n) =>
          n.id === nodeWithComputedFormats.id ? nodeWithComputedFormats : n,
        ),
      );
      revalidateEdgesForNode(nodeWithComputedFormats);
      clearEditingNode();
    },
    [setNodes, clearEditingNode, revalidateEdgesForNode],
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

  const currentPresets = useMemo(
    () => presets.filter((t) => t.moduleClass === tempNode?.data.moduleClass),
    [presets, tempNode],
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
            label="Apply Preset"
            onChange={(e) => {
              const selected = presets.find((t) => t.name === e.target.value);
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
            {currentPresets.length === 0 ? (
              <MenuItem value="Apply Preset" disabled>
                No Presets Available. Import or save one.
              </MenuItem>
            ) : (
              currentPresets.map((t) => (
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
                      removePreset(t.name, t.moduleClass);
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
              const name = prompt("Enter a preset name:");
              if (!name) return;
              addPreset({
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
            Save as Preset
          </Button>
        </Box>
        <Box sx={{ mt: 2, display: "flex", gap: 2 }}>
          <Button
            className="p-3 max-w-full border border-gray-300 bg-white rounded-lg font-semibold text-sm text-gray-800 shadow-sm text-pretty"
            sx={{ flex: 1, textTransform: "none" }}
            onClick={() => {
              if (tempNode) {
                exportPreset({
                  name: tempNode.data.name || "preset",
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
            Export Preset
          </Button>
          <Button
            component="label"
            className="p-3 max-w-full border border-gray-300 bg-white rounded-lg font-semibold text-sm text-gray-800 shadow-sm text-pretty"
            sx={{ flex: 1, textTransform: "none" }}
          >
            Import Preset
            <input
              type="file"
              accept="application/json"
              hidden
              onChange={(e) => {
                if (e.target.files?.[0] && tempNode) {
                  importPreset(e.target.files[0], tempNode.data.moduleClass);
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
