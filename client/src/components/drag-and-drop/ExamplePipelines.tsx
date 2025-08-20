"use client";

import { useContext } from "react";
import { useReactFlow } from "@xyflow/react";
import { ExamplePipeline } from "@/types/pipeline";
import { Settings } from "@mui/icons-material";
import { ExamplePipelinesContext } from "@/contexts/ExamplePipelinesContext";
import { Box, Button } from "@mui/material";
import { toast } from "react-toastify/unstyled";

export default function ExamplePipelines() {
  const { pipelines } = useContext(ExamplePipelinesContext);

  const instance = useReactFlow();

  const handleLoad = (pipeline: ExamplePipeline) => {
    const previousNodes = instance.getNodes();
    const previousEdges = instance.getEdges();
    const { nodes, edges } = pipeline;
    instance.setNodes(nodes);
    instance.setEdges(edges);
    instance.fitView();

    toast.success(
      ({ closeToast }) => (
        <Box sx={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <span>Pipeline loaded successfully!</span>
          <Button
            onClick={() => {
              closeToast();
              // Restore previous state
              instance.setNodes(previousNodes);
              instance.setEdges(previousEdges);
              instance.fitView();
              toast.info("Previous Changes Restored");
            }}
            size="small"
            sx={{ border: "1px solid" }}
          >
            Undo
          </Button>
        </Box>
      ),
      {
        autoClose: false,
        closeOnClick: false,
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
