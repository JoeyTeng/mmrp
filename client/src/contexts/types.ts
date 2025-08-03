import type { ReactFlowInstance, Node, Edge } from "@xyflow/react";
import type { NodeType } from "@/types/module";
import type { NodeData } from "@/components/drag-and-drop/types";

export type SidebarContextType = {
  flowInstance: ReactFlowInstance<Node<NodeData, NodeType>, Edge> | null;
  setFlowInstance: (
    instance: ReactFlowInstance<Node<NodeData, NodeType>, Edge>,
  ) => void;
  handleExportPipeline: () => void;
  handleImportPipeline: () => void;
};
