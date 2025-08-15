"use client";

import { useContext } from "react";
import { useReactFlow } from "@xyflow/react";
import { ExamplePipeline } from "@/types/pipeline";
import { Settings } from "@mui/icons-material";
import { ExamplePipelinesContext } from "@/contexts/ExamplePipelinesContext";

export default function DefaultPipelines() {
  const pipelines = useContext(ExamplePipelinesContext);

  const instance = useReactFlow();

  const handleLoad = (pipeline: ExamplePipeline) => {
    // This will change once the modules schema are refactored to match the backend
    const { nodes, edges } = pipeline;
    instance.setNodes(nodes);
    instance.setEdges(edges);
    instance.fitView();
  };

  if (!pipelines) return;

  return (
    <div className="space-y-2">
      {pipelines.map((p) => (
        <button
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
        </button>
      ))}
    </div>
  );
}
