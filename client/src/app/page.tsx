import DragAndDropArea from "@/components/cards/DragAndDropArea";
import AppLayout from "@/components/layout/AppLayout";
import { Box } from "@mui/material";
import VideoComparisonView from "@/components/cards/VideoComparisonView";
import AppProviders from "@/contexts/AppProviders";

export default function Home() {
  return (
    <AppProviders>
      <AppLayout>
        <Box className="flex flex-col h-full gap-2">
          {/* Video Comparison View - Fixed height with min-height */}
          <Box className="h-1/3 min-h-[350px]">
            <VideoComparisonView />
          </Box>
          {/* Flow Canvas - Takes remaining space with min-height */}
          <Box className="h-2/3 flex-1">
            <DragAndDropArea />
          </Box>
        </Box>
      </AppLayout>
    </AppProviders>
  );
}
