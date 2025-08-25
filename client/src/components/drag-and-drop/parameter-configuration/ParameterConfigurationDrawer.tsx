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
import { Box, Button, Divider, InputAdornment, TextField } from "@mui/material";
import { SearchOutlined } from "@mui/icons-material";
import { compatibleFormats, evaluateFormula } from "../util";
import { toast } from "react-toastify/unstyled";

export default function ParameterConfigurationDrawer({
  editingNode,
  clearEditingNode,
}: ParameterConfigurationDrawerProps) {
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

        // Check validity BEFORE the update
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

        // Check validity AFTER the update
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

  return (
    <AppDrawer
      open={Boolean(editingNode)}
      onClose={handleCancel}
      title={editingNode ? `Edit ${editingNode.data.name}` : "Edit Parameters"}
      width={400}
      anchor="right"
    >
      <Box display="flex" flexDirection="column" height="100%" width="100%">
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
