"use client";

import { useReactFlow } from "@xyflow/react";
import { ExamplePipeline } from "@/types/pipeline";
import { Settings } from "@mui/icons-material";
import { useExamplePipelinesContext } from "@/contexts/ExamplePipelinesContext";
import { Box } from "@mui/material";
import { showUndoToast } from "@/utils/UndoToast";

export default function ExamplePipelines() {
  const { pipelines } = useExamplePipelinesContext();

  const instance = useReactFlow();

  const handleLoad = (pipeline: ExamplePipeline) => {
    const previousNodes = instance.getNodes();
    const previousEdges = instance.getEdges();
    const { nodes, edges } = pipeline;
    instance.setNodes(nodes);
    instance.setEdges(edges);
    instance.fitView();

    showUndoToast(
      `Pipeline ${pipeline.name} loaded successfully!`,
      "Previous Pipeline Restored",
      true,
      () => {
        instance.setNodes(previousNodes);
        instance.setEdges(previousEdges);
        instance.fitView();
      },
    );
  };

  if (!pipelines)
    return (
      <Box className="flex items-center justify-center h-full text-gray-500">
        Loading Example Pipelines…
      </Box>
    );

  return (
    <Box className="space-y-2">
      {pipelines.map((p) => (
        <Box
          key={p.id}
          onClick={() => handleLoad(p)}
          className="w-full flex items-center gap-3 rounded-lg
                   bg-white hover:bg-gray-100 px-3 py-2
                   transition-all duration-200 border border-gray-300
                   shadow-sm hover:shadow-md cursor-pointer"
        >
          <Box className="flex items-center justify-center w-9 h-9 rounded-md bg-gray-200 group-hover:bg-gray-300">
            <Settings className="text-gray-700" />
          </Box>

          <span className="text-sm font-medium text-gray-800 truncate">
            {p.name}
          </span>
        </Box>
      ))}
    </Box>
  );
}
