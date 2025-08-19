import { useMemo } from "react";
import { useVideoReload } from "@/contexts/VideoReloadContext";
import { toast } from "react-toastify/unstyled";
import { useReactFlow } from "@xyflow/react";
import { useCallback } from "react";
import {
  createProtectedExport,
  verifyImport,
} from "@/utils/sharedFunctionality";
import { useVideo } from "@/contexts/VideoContext";
import { Module, ModuleClass, ModuleParameterName } from "@/types/module";

export function useVideoUtils() {
  const { getLatestVideoInfo, latestResponse } = useVideoReload();
  const { loadVideo, uploadVideo } = useVideo();

  const downloadSize = useMemo(() => {
    const leftVideoBytes = latestResponse?.left
      ? getLatestVideoInfo("left").size
      : 0;
    const rightVideoBytes = latestResponse?.right
      ? getLatestVideoInfo("right").size
      : 0;
    const totalBytes = leftVideoBytes + rightVideoBytes;

    if (totalBytes === 0) return "";

    const units = ["bytes", "KB", "MB", "GB"];
    const base = Math.log(totalBytes) / Math.log(1024);
    const unitIndex = Math.floor(base);
    const formattedSize = Math.pow(1024, base - unitIndex).toFixed(1);

    return `${formattedSize} ${units[unitIndex]}`;
  }, [getLatestVideoInfo, latestResponse]);

  function handleDownload() {
    if (!latestResponse?.left && !latestResponse?.right) {
      toast.warn(
        "Please run the pipeline first to download a processed video.",
      );
      return;
    }

    const links: { id: "left" | "right"; filename: string }[] = [];

    if (latestResponse.left) {
      const videoInfo = getLatestVideoInfo("left");
      if (videoInfo.url) {
        links.push({ id: "left", filename: latestResponse.left });
      }
    }

    if (latestResponse.right) {
      const videoInfo = getLatestVideoInfo("right");
      if (videoInfo.url) {
        links.push({ id: "right", filename: latestResponse.right });
      }
    }

    links.forEach(({ id, filename }) => {
      const videoInfo = getLatestVideoInfo(id);
      if (videoInfo.url) {
        const a = document.createElement("a");
        a.href = videoInfo.url;
        a.download = filename;
        a.click();
        toast.success(`Video download started (${downloadSize})`);
        a.remove();
      }
    });
  }

  // Upload Video
  const handleUploadVideo = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "video/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        await uploadVideo(file);
      } catch (err) {
        console.error(err);
        toast.error("Video upload failed");
      }
    };
    input.click();
  }, [loadVideo, uploadVideo]);

  return { handleDownload, downloadSize, handleUploadVideo };
}

export function usePipelineExport() {
  const INPUT_TYPE = "file";
  const INPUT_ACCEPT = ".json";
  const FILE_NAME = "pipeline";

  const { getNodes, getEdges, setNodes, setEdges, deleteElements } =
    useReactFlow();
  const { getLatestVideoInfo } = useVideoReload();

  const updateVideoSourcePath = useCallback(
    (nodes: Module[]) => {
      const currentVideoName = getLatestVideoInfo("left").name;

      if (!currentVideoName) return nodes;

      return nodes.map((node) => {
        if (node.data?.moduleClass === ModuleClass.VIDEO_SOURCE) {
          return {
            ...node,
            data: {
              ...node.data,
              parameters: node.data.parameters.map((param) =>
                param.name === ModuleParameterName.VIDEO_SOURCE_PATH
                  ? {
                      ...param,
                      metadata: {
                        ...param.metadata,
                        value: currentVideoName,
                      },
                    }
                  : param,
              ),
            },
          };
        }
        return node;
      });
    },
    [getLatestVideoInfo],
  );

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
      console.error("Export error:", e);
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

        const typedNodes = nodes as Module[];
        const updatedNodes = updateVideoSourcePath(typedNodes);
        // Set new pipeline
        setNodes(updatedNodes);
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
  }, [
    getNodes,
    getEdges,
    deleteElements,
    setEdges,
    setNodes,
    updateVideoSourcePath,
  ]);
  return { handleExportPipeline, handleImportPipeline };
}
