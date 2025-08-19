"use client";

import { useContext } from "react";
import { useReactFlow } from "@xyflow/react";
import { ExamplePipeline } from "@/types/pipeline";
import { Settings } from "@mui/icons-material";
import { ExamplePipelinesContext } from "@/contexts/ExamplePipelinesContext";
import { Box } from "@mui/material";

export default function ExamplePipelines() {
  const pipelines = useContext(ExamplePipelinesContext);

  const instance = useReactFlow();

  const handleLoad = (pipeline: ExamplePipeline) => {
    const confirmed = window.confirm(
      "Loading this pipeline will replace your canvas, current changes will be lost. Export the existing pipeline if needed. Continue?",
    );
    if (!confirmed) return;
    const { nodes, edges } = pipeline;
    instance.setNodes(nodes);
    instance.setEdges(edges);
    instance.fitView();
  };

  if (!pipelines)
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Loading Example Pipelines…
      </div>
    );

  return (
    <div className="space-y-2">
      {pipelines.map((p) => (
        <Box
          key={p.id}
          onClick={() => handleLoad(p)}
          className="w-full flex items-center gap-3 rounded-lg 
                   bg-white hover:bg-gray-100 px-3 py-2 
                   transition-all duration-200 border border-gray-300
                   shadow-sm hover:shadow-md cursor-pointer"
        >
          <div className="flex items-center justify-center w-9 h-9 rounded-md bg-gray-200 group-hover:bg-gray-300">
            <Settings className="text-gray-700" />
          </div>

          <span className="text-sm font-medium text-gray-800 truncate">
            {p.name}
          </span>
        </Box>
      ))}
    </div>
  );
}
