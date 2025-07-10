"use client";

import { useCallback, useRef } from "react";
import { Node } from "@xyflow/react";
import { AppDrawer } from "@/components/sidebar/AppDrawer";
import { NodeData, NodeType, ParameterConfigurationRef } from "../types";
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
  const paramsConfigRef = useRef<ParameterConfigurationRef>(null);

  const handleConfirm = useCallback(() => {
    const updatedNode = paramsConfigRef.current?.getTempNode();
    if (updatedNode) {
      const completeNode: Node<NodeData, NodeType> = {
        ...updatedNode,
        data: {
          ...updatedNode.data,
          inputFormats: editingNode?.data.inputFormats || [],
          outputFormats: editingNode?.data.outputFormats || [],
        },
      };
      onConfirm(completeNode);
    }
  }, [onConfirm, editingNode]);

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
          <ParameterConfiguration ref={paramsConfigRef} node={editingNode} />
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
