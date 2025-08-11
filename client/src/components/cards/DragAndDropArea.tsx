"use client";

import FlowCanvas from "@/components/drag-and-drop/FlowCanvas";
import { type Node } from "@xyflow/react";

import { NodeData } from "../drag-and-drop/types";
import { NodeType } from "@/types/module";
import ParameterConfigurationDrawer from "@/components/drag-and-drop/parameter-configuration/ParameterConfigurationDrawer";
import { useState } from "react";
import { Box } from "@mui/material";

export default function DragAndDropArea() {
  const [editingNode, setEditingNode] = useState<Node<
    NodeData,
    NodeType
  > | null>(null);

  return (
    <Box
      sx={{
        display: "flex",
        flex: 1,
        height: "100%",
        width: "100%",
      }}
    >
      <FlowCanvas editingNode={editingNode} onEditNode={setEditingNode} />
      {editingNode && (
        <ParameterConfigurationDrawer
          editingNode={editingNode}
          clearEditingNode={() => setEditingNode(null)}
        />
      )}
    </Box>
  );
}
