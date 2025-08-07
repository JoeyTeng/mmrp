"use client";

import FlowCanvas from "@/components/drag-and-drop/FlowCanvas";
import { type Node, type Edge } from "@xyflow/react";

import { ModuleData, ModuleType } from "@/types/module";
import ParameterConfigurationDrawer from "@/components/drag-and-drop/parameter-configuration/ParameterConfigurationDrawer";
import { useState } from "react";
import { Box } from "@mui/material";

const initialNodes: Node<ModuleData, ModuleType>[] = [];
const initialEdges: Edge[] = [];

export default function DragAndDropArea() {
  const [editingNode, setEditingNode] = useState<Node<
    ModuleData,
    ModuleType
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
      <FlowCanvas
        defaultNodes={initialNodes}
        defaultEdges={initialEdges}
        editingNode={editingNode}
        onEditNode={setEditingNode}
      />
      {editingNode && (
        <ParameterConfigurationDrawer
          editingNode={editingNode}
          clearEditingNode={() => setEditingNode(null)}
        />
      )}
    </Box>
  );
}
