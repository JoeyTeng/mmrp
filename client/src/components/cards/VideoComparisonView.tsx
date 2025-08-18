// components/comparison-view/VideoComparisonView.tsx
"use client";

import { useEffect, useState } from "react";
import SideBySide from "@/components/comparison-view/SideBySide";
import InterleavingFrames from "@/components/comparison-view/InterleavingFrames";
import MenuDropdown from "@/components/comparison-view/MenuDropdown";
import { Box, Typography } from "@mui/material";
import {
  MenuSelection,
  VideoType,
  ViewOptions,
} from "@/components/comparison-view/types";
import { useVideo } from "@/contexts/VideoContext";

const VideoComparisonView = () => {
  const [selection, setSelection] = useState<MenuSelection>({
    view: ViewOptions.SideBySide,
    type: VideoType.Video,
  });
  const { videos, isLoading, error, loadVideo } = useVideo();

  useEffect(() => {
    if (!videos.left) {
      loadVideo("left", "example-video.mp4", false);
    }
  }, [videos, loadVideo]);

  return (
    <Box className="flex h-full w-full items-center justify-center m-0.5">
      <Box className="flex flex-col h-full w-full max-w-[900px] border border-primary bg-primary overflow-hidden rounded-md">
        <Box className="flex items-center gap-2 p-1.5">
          <MenuDropdown onSelect={setSelection} />
          <Typography variant="subtitle1">
            {selection.view} View - {selection.type}
          </Typography>
        </Box>
        <Box className="flex-1 flex overflow-hidden">
          {selection.view === ViewOptions.SideBySide && (
            <SideBySide
              key={`${selection.view}-${selection.type}`}
              type={selection.type}
              isLoading={isLoading}
              error={error}
            />
          )}
          {selection.view === ViewOptions.Interleaving && (
            <InterleavingFrames
              key={`${selection.view}-${selection.type}`}
              type={selection.type}
              isLoading={isLoading}
              error={error}
            />
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default VideoComparisonView;
