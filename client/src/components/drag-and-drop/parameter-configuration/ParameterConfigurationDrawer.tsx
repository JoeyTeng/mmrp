"use client";

import { useCallback, useEffect, useState } from "react";
import { Node } from "@xyflow/react";
import { AppDrawer } from "@/components/sidebar/AppDrawer";
import {
  NodeData,
  NodeType,
  ParamValueType,
  ParameterConfigurationDrawerProps,
} from "../types";
import ParameterConfiguration from "./ParameterConfiguration";
import { Box, Button } from "@mui/material";

export default function ParameterConfigurationDrawer({
  editingNode,
  onConfirm,
  onCancel,
}: ParameterConfigurationDrawerProps) {
  const [tempNode, setTempNode] =
    useState<Node<NodeData, NodeType>>(editingNode);

  useEffect(() => {
    setTempNode(editingNode);
  }, [editingNode]);

  const handleParamChange = useCallback(
    (key: string, value: ParamValueType) => {
      setTempNode((prev) => ({
        ...prev,
        data: {
          ...prev.data,
          params: {
            ...prev.data.params,
            [key]: value,
          },
        },
      }));
    },
    [],
  );

  return (
    <AppDrawer
      open={Boolean(editingNode)}
      onClose={onCancel}
      title={editingNode ? `Edit ${editingNode.data.label}` : "Edit Parameters"}
      width={400}
      anchor="right"
    >
      <Box display="flex" flexDirection="column" height="100%">
        <Box flex={1} overflow="auto">
          <ParameterConfiguration
            node={tempNode}
            onParamChange={handleParamChange}
          />
        </Box>
        <Box
          sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 2 }}
        >
          <Button variant="outlined" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            className="bg-primary"
            variant="contained"
            onClick={() => onConfirm(tempNode)}
            disabled={!editingNode || !tempNode}
          >
            Confirm
          </Button>
        </Box>
      </Box>
    </AppDrawer>
  );
}
