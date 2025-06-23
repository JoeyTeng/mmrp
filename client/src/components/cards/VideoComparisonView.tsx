"use client";

import { useState } from "react";
import SideBySide from "../comparison-view/SideBySide";
import InterleavingFrames from "../comparison-view/InterleavingFrames";
import MenuDropdown, { viewOptions } from "../comparison-view/MenuDropdown";
import { Box } from "@mui/material";

const VideoComparisonView = () => {
  const [view, setView] = useState(viewOptions.SideBySide);

  return (
    <Box className="flex flex-col flex-1 relative border border-gray-900 rounded-md overflow-hidden bg-gray-100">
      <Box className="flex items-center justify-between bg-gray-700 px-4 py-2 border-b border-gray-300 font-semibold text-white">
        <Box className="flex items-center gap-2">
          <MenuDropdown onSelect={setView} />
          <span>{view} View</span>
        </Box>
      </Box>

      {view === viewOptions.SideBySide && <SideBySide />}
      {view === viewOptions.Interleaving && <InterleavingFrames />}
    </Box>
  );
};

export default VideoComparisonView;
