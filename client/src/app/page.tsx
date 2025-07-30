import DragAndDropArea from "@/components/cards/DragAndDropArea";
import AppLayout from "@/components/layout/AppLayout";
import { VideoReloadProvider } from "@/contexts/videoReloadContext";
import { Box } from "@mui/material";
import { ToastContainer } from "react-toastify/unstyled";
import "react-toastify/ReactToastify.css";
import { VideoMetricsProvider } from "@/contexts/VideoMetricsContext";
import VideoComparisonView from "@/components/cards/VideoComparisonView";
import { WebSocketProvider } from "@/contexts/WebSocketContext";

export default function Home() {
  return (
    <VideoMetricsProvider>
      <AppLayout>
        <Box className="flex flex-col h-full gap-2">
          {/* Wrap Comparison View and drag-and-drop area with video provider to register pipeline processing */}
          <VideoReloadProvider>
            <WebSocketProvider>
              {/* Video Comparison View - Fixed height with min-height */}
              <Box className="h-1/3 min-h-[350px]">
                <VideoComparisonView />
              </Box>
              {/* Flow Canvas - Takes remaining space with min-height */}
              <Box className="h-2/3 flex-1">
                <DragAndDropArea />
              </Box>
            </WebSocketProvider>
          </VideoReloadProvider>
        </Box>
        <ToastContainer />
      </AppLayout>
    </VideoMetricsProvider>
  );
}
