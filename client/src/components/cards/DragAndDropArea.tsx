"use client";

import FlowCanvas from "@/components/drag-and-drop/FlowCanvas";
import { type Node, type Edge } from "@xyflow/react";

import { NodeData } from "../drag-and-drop/types";
import { NodeType } from "@/types/module";
import ParameterConfigurationDrawer from "@/components/drag-and-drop/parameter-configuration/ParameterConfigurationDrawer";
import { useState } from "react";
import { ReactFlowProvider } from "@xyflow/react";

const initialNodes: Node<NodeData, NodeType>[] = [];
const initialEdges: Edge[] = [];

export default function DragAndDropArea() {
  const [editingNode, setEditingNode] = useState<Node<
    NodeData,
    NodeType
  > | null>(null);

  return (
    <ReactFlowProvider>
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
    </ReactFlowProvider>
  );
}
