import VideoPlayer from "@/components/layout/VideoPlayer";
import DragAndDropArea from "@/components/cards/DragAndDropArea";
import AppLayout from "@/components/layout/AppLayout";
import { VideoReloadProvider } from "@/contexts/videoReloadContext";
import { Box } from "@mui/material";
import { ToastContainer } from "react-toastify/unstyled";
import "react-toastify/ReactToastify.css";

export default function Home() {
  return (
    <AppLayout>
      <Box className="flex flex-col h-full gap-2">
        {/* Wrap video player and drag-and-drop area with video provider to register pipeline processing */}
        <VideoReloadProvider>
          {/* Video Player - Fixed height with min-height */}
          <Box className="h-1/3 min-h-[350px]">
            <VideoPlayer />
          </Box>
          {/* Flow Canvas - Takes remaining space with min-height */}
          <Box className="h-2/3 flex-1">
            <DragAndDropArea />
          </Box>
        </VideoReloadProvider>
      </Box>
      <ToastContainer />
    </AppLayout>
  );
}
