"use client";

import { useCallback, useEffect, useState } from "react";
import { Node } from "@xyflow/react";
import { AppDrawer } from "@/components/sidebar/AppDrawer";
import { NodeData, NodeType, ParamValueType } from "../types";
import ParameterConfiguration from "./ParameterConfiguration";
import { Box, Button } from "@mui/material";

interface ParameterConfigurationDrawerProps {
  editingNode: Node<NodeData, NodeType> | null;
  onConfirm: (node: Node<NodeData, NodeType>) => void;
  onCancel: () => void;
}

export default function ParameterConfigurationDrawer({
  editingNode,
  onConfirm,
  onCancel,
}: ParameterConfigurationDrawerProps) {
  const [tempNode, setTempNode] = useState<Node<NodeData, NodeType> | null>(
    null,
  );

  useEffect(() => {
    setTempNode(editingNode);
  }, [editingNode]);

  const handleParamChange = useCallback(
    (key: string, value: ParamValueType) => {
      setTempNode((prev) => {
        if (!prev) return null;

        return {
          ...prev,
          data: {
            ...prev.data,
            params: {
              ...prev.data.params,
              [key]: value,
            },
          },
        };
      });
    },
    [],
  );

  const handleConfirm = useCallback(() => {
    if (!tempNode) return;
    onConfirm(tempNode);
    setTempNode(null);
  }, [tempNode, onConfirm]);

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
            variant="contained"
            onClick={handleConfirm}
            disabled={!editingNode}
          >
            Confirm
          </Button>
        </Box>
      </Box>
    </AppDrawer>
  );
}
