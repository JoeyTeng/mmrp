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
import {
  compatibleFormats,
  evaluateFormula,
  runFormatPropagation,
} from "../util";
import {
  applyParamSizeOnConnect,
  recomputeIOFormatsFromParams,
} from "@/components/util/paramPropogation";

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
    // include BOTH name and flag (stripped) so formulas like params.width or params.w work
    const params: Record<string, ParamValueType> = {};
    for (const p of node.data.parameters ?? []) {
      const val = p.metadata?.value ?? p.metadata?.constraints?.default;
      if (p.name) params[p.name] = val;
      if (p.flag) params[p.flag.replace(/^--?/, "")] = val; // "-w" -> "w"
    }

    return (node.data.outputFormats ?? []).map((spec) => {
      if (!spec.formula) return spec;
      const nextDefault = { ...spec.default } as Record<string, unknown>;
      for (const [field, expr] of Object.entries(spec.formula)) {
        const v = evaluateFormula(String(expr), params);
        if (v !== undefined) nextDefault[field] = v;
      }
      return { ...spec, default: nextDefault as typeof spec.default };
    });
  }

  const { setNodes, getEdges, setEdges, getNodes } = useReactFlow();

  const handleConfirm = useCallback(
    (updatedNode: Node<ModuleData, ModuleType>) => {
      const edgesNow = getEdges();

      // 1) compute this node's outputs from its params
      const nodeWithComputedOutputs: Node<ModuleData, ModuleType> = {
        ...updatedNode,
        data: {
          ...updatedNode.data,
          outputFormats: updateOutputFormatDefaults(updatedNode),
        },
      };

      // 2) apply into current nodes
      let workingNodes = (getNodes() as Node<ModuleData, ModuleType>[]).map(
        (n) =>
          n.id === nodeWithComputedOutputs.id ? nodeWithComputedOutputs : n,
      );

      // 3) propagate width/height flags to ALL downstream nodes (params only)
      workingNodes = applyParamSizeOnConnect(
        workingNodes,
        edgesNow,
        nodeWithComputedOutputs.id,
      );

      // 3.5) make formats reflect params (flags OR names like "width"/"height")
      workingNodes = workingNodes.map(recomputeIOFormatsFromParams);

      // 4) fill any remaining missing pieces using DFS propagation
      const { updatedNodes } = runFormatPropagation(
        workingNodes,
        edgesNow,
        nodeWithComputedOutputs.id,
      );

      // 4.5) recompute formats again after propagation to handle input->output copying
      const finalNodes = updatedNodes.map(recomputeIOFormatsFromParams);

      // 5) restyle only edges connected to this node using UPDATED nodes
      const byId = new Map(finalNodes.map((n) => [n.id, n]));
      const updatedEdges = edgesNow.map((edge) => {
        if (
          edge.source !== nodeWithComputedOutputs.id &&
          edge.target !== nodeWithComputedOutputs.id
        ) {
          return edge;
        }
        const s = byId.get(edge.source);
        const t = byId.get(edge.target);
        if (!s || !t) return edge;

        const outs: FormatDefinition[] = (s.data?.outputFormats ?? []).map(
          (f) => f.default,
        );
        const ins: FormatDefinition[] = (t.data?.inputFormats ?? []).map(
          (f) => f.default,
        );
        const isValid = compatibleFormats(outs, ins);

        return {
          ...edge,
          style: isValid
            ? undefined
            : { stroke: "#ef4444", strokeDasharray: "4 4" },
          animated: !isValid,
        };
      });

      // 6) commit once
      setNodes(finalNodes);
      setEdges(updatedEdges);
      clearEditingNode();
    },
    [getEdges, getNodes, setNodes, setEdges, clearEditingNode],
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
