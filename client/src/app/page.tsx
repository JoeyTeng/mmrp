import VideoPlayer from "@/components/layout/VideoPlayer";
import DragAndDropArea from "@/components/cards/DragAndDropArea";
import AppLayout from "@/components/layout/AppLayout";
import { Box } from "@mui/material";
import { ToastContainer } from "react-toastify/unstyled";
import "react-toastify/ReactToastify.css";

export default function Home() {
  return (
    <AppLayout>
      <Box className="flex flex-col h-full gap-2">
        {/* Video Player - Fixed height with min-height */}
        <Box className="h-1/3 min-h-[350px]">
          <VideoPlayer />
        </Box>
        {/* Flow Canvas - Takes remaining space with min-height */}
        <Box className="h-2/3 flex-1">
          <DragAndDropArea />
        </Box>
      </Box>
      <ToastContainer />
    </AppLayout>
  );
}
