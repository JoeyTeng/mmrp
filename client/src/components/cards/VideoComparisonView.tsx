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
    <Box className="flex flex-1 flex-col relative border-1 border-primary bg-primary overflow-hidden rounded-md">
      <Box className="flex items-center borde gap-0.5 p-1">
        <MenuDropdown onSelect={setView} />
        <Typography variant="subtitle1">{view} View</Typography>
      </Box>
      <Box>
        {view === ViewOptions.SideBySide && <SideBySide />}
        {view === ViewOptions.Interleaving && <InterleavingFrames />}
      </Box>
    </Box>
  );
};

export default VideoComparisonView;
