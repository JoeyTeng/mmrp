"use client";

import { useState } from "react";
import SideBySide from "@/components/comparison-view/SideBySide";
import InterleavingFrames from "@/components/comparison-view/InterleavingFrames";
import MenuDropdown from "@/components/comparison-view/MenuDropdown";
import { Box, Typography } from "@mui/material";
import { ViewOptions } from "@/components/comparison-view/types";

const VideoComparisonView = () => {
  const [view, setView] = useState(ViewOptions.SideBySide);

  return (
    <Box className="flex flex-col h-full w-full border border-primary bg-primary overflow-hidden rounded-md">
      <Box className="flex items-center gap-2 p-1.5">
        <MenuDropdown onSelect={setView} />
        <Typography variant="subtitle1">{view} View</Typography>
      </Box>
      <Box className="flex-1 flex overflow-hidden">
        {view === ViewOptions.SideBySide && <SideBySide />}
        {view === ViewOptions.Interleaving && <InterleavingFrames />}
      </Box>
    </Box>
  );
};

export default VideoComparisonView;
