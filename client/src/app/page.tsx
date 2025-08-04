"use client";

import DragAndDropArea from "@/components/cards/DragAndDropArea";
import AppLayout from "@/components/layout/AppLayout";
import { Box } from "@mui/material";
import { ToastContainer } from "react-toastify/unstyled";
import "react-toastify/ReactToastify.css";
import VideoComparisonView from "@/components/cards/VideoComparisonView";
import AppProviders from "@/contexts/AppProviders";
import { VideoType } from "@/components/comparison-view/types";
import { useState } from "react";

export default function Home() {
  const [videoType, setVideoType] = useState(VideoType.Video);

  return (
    <AppProviders>
      <AppLayout>
        <Box className="flex flex-col h-full gap-2">
          {/* Video Comparison View - Fixed height with min-height */}
          <Box className="h-1/3 min-h-[350px]">
            <VideoComparisonView
              videoType={videoType}
              setVideoType={setVideoType}
            />
          </Box>
          {/* Flow Canvas - Takes remaining space with min-height */}
          <Box className="h-2/3 flex-1">
            <DragAndDropArea videoType={videoType} />
          </Box>
        </Box>
        <ToastContainer />
      </AppLayout>
    </AppProviders>
  );
}
