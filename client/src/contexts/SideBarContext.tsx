"use client";

import { createContext, useContext, useCallback, useState } from "react";
import type { ReactFlowInstance, Node, Edge } from "@xyflow/react";
import { toast } from "react-toastify/unstyled";
import {
  createProtectedExport,
  decryptImport,
} from "@/utils/shareFunctionality";
import type { NodeType } from "@/types/module";
import type { NodeData } from "@/components/drag-and-drop/types";
import { SidebarContextType } from "./types";

const SidebarContext = createContext<SidebarContextType | null>(null);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [flowInstance, setFlowInstance] = useState<ReactFlowInstance<
    Node<NodeData, NodeType>,
    Edge
  > | null>(null);
  const INPUT_TYPE = "file";
  const INPUT_ACCEPT = ".json";

  // Export Pipeline
  const handleExportPipeline = useCallback(() => {
    if (!flowInstance) return;

    const nodes = flowInstance.getNodes();
    const edges = flowInstance.getEdges();

    if (!nodes.length && !edges.length) {
      toast.info("Pipeline is empty");
      return;
    }

    const protectedExport = createProtectedExport({ nodes, edges });
    const blob = new Blob([JSON.stringify(protectedExport, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pipeline-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [flowInstance]);

  // Import Pipeline
  const handleImportPipeline = useCallback(() => {
    if (!flowInstance) {
      toast.error("Flow instance not available");
      return;
    }

    const currentNodes = flowInstance.getNodes();
    const currentEdges = flowInstance.getEdges();

    // Check if pipeline is not empty
    if (currentNodes.length > 0 || currentEdges.length > 0) {
      toast.warning(
        "Please save or clear the current pipeline before importing a new one.",
      );
      return;
    }

    const input = document.createElement("input");
    input.type = INPUT_TYPE;
    input.accept = INPUT_ACCEPT;

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const fileContent = await file.text();
        const parsedExport = JSON.parse(fileContent);
        const decryptedData = decryptImport(parsedExport);

        if (!decryptedData.data?.nodes || !decryptedData.data?.edges) {
          throw new Error("Invalid pipeline format");
        }

        flowInstance.deleteElements({
          nodes: flowInstance.getNodes(),
          edges: flowInstance.getEdges(),
        });

        flowInstance.setNodes(decryptedData.data.nodes);
        flowInstance.setEdges(decryptedData.data.edges);
        toast.success("Pipeline imported successfully");
      } catch (error) {
        toast.error(
          `Import failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    };

    input.click();
  }, [flowInstance]);

  return (
    <SidebarContext.Provider
      value={{
        flowInstance,
        setFlowInstance,
        handleExportPipeline,
        handleImportPipeline,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context)
    throw new Error("useSidebar must be used within SidebarProvider");
  return context;
}
