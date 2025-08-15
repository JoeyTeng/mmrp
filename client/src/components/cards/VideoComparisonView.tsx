"use client";

import SideBySide from "@/components/comparison-view/SideBySide";
import InterleavingFrames from "@/components/comparison-view/InterleavingFrames";
import MenuDropdown from "@/components/comparison-view/MenuDropdown";
import { Box, Checkbox, FormControlLabel, Typography } from "@mui/material";
import { VideoType, ViewOptions } from "@/components/comparison-view/types";
import { useVideoReload } from "@/contexts/VideoReloadContext";
import { useState } from "react";

const VideoComparisonView = () => {
  const [view, setView] = useState(ViewOptions.SideBySide);
  const {
    selectedVideoType,
    setSelectedVideoType,
    activeVideoType,
    isProcessing,
  } = useVideoReload();

  const handleStreamCheckboxToggle = (checked: boolean) => {
    setSelectedVideoType(checked ? VideoType.Stream : VideoType.Video);
  };

  return (
    <Box className="flex h-full w-full items-center justify-center m-0.5">
      <Box className="flex flex-col h-full w-full max-w-[900px] border border-primary bg-primary overflow-hidden rounded-md">
        <Box className="flex items-center gap-2 p-1.5">
          <MenuDropdown onSelect={setView} />

          <Typography variant="subtitle1">{view} View</Typography>
          <FormControlLabel
            control={
              <Checkbox
                checked={selectedVideoType === VideoType.Stream}
                onChange={(e) => handleStreamCheckboxToggle(e.target.checked)}
                disabled={isProcessing}
                disableRipple
                sx={{
                  padding: 0.5,
                  color: "#fff",
                  "&.Mui-checked": {
                    color: "#fff",
                  },
                }}
              />
            }
            label="Stream of frames - Run the pipeline to apply the change"
            labelPlacement="end"
            sx={{
              marginLeft: "auto",
              ".MuiFormControlLabel-label": {
                color: "#fff",
              },
            }}
          />
        </Box>
        <Box className="flex-1 flex overflow-hidden">
          {view === ViewOptions.SideBySide && (
            <SideBySide key={`${view}`} type={activeVideoType} />
          )}
          {view === ViewOptions.Interleaving && (
            <InterleavingFrames key={`${view}`} type={activeVideoType} />
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default VideoComparisonView;
