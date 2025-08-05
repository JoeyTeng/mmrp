import { useReactFlow } from "@xyflow/react";
import { useCallback } from "react";
import { toast } from "react-toastify/unstyled";
import {
  createProtectedExport,
  verifyImport,
} from "@/utils/shareFunctionality";

export const useSidebarActions = () => {
  const INPUT_TYPE = "file";
  const INPUT_ACCEPT = ".json";
  const FILE_NAME = "pipeline";

  const { getNodes, getEdges, setNodes, setEdges, deleteElements } =
    useReactFlow();

  // Export Pipeline
  const handleExportPipeline = useCallback(() => {
    const nodes = getNodes();
    const edges = getEdges();

    if (!nodes.length && !edges.length) {
      toast.info("Pipeline is empty");
      return;
    }

    try {
      const protectedExport = createProtectedExport({ nodes, edges });
      const blob = new Blob([JSON.stringify(protectedExport, null, 2)], {
        type: "application/json",
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${FILE_NAME}-${new Date().toISOString()}${INPUT_ACCEPT}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Import error:", e);
      toast.error(
        `Export failed: ${e instanceof Error ? e.message : "Unknown error"}`,
      );
    }
  }, [getNodes, getEdges]);

  // Import Pipeline
  const handleImportPipeline = useCallback(() => {
    const currentNodes = getNodes();
    const currentEdges = getEdges();

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

        const { nodes, edges } = verifyImport(parsedExport);

        // Delete Flowcanvas elements
        deleteElements({
          nodes: currentNodes,
          edges: currentEdges,
        });

        // Set new pipeline
        setNodes(nodes);
        setEdges(edges);

        toast.success("Pipeline imported successfully");
      } catch (error) {
        console.error("Import error:", error);
        toast.error(
          `Import failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    };
    input.click();
  }, [getNodes, getEdges, deleteElements, setEdges, setNodes]);
  return { handleExportPipeline, handleImportPipeline };
};
