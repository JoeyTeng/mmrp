import VideoComparisonView from "@/components/cards/VideoComparisonView";
import { Box } from "@mui/material";

const VideoPlayer = () => {
  return (
    <Box className="h-full w-full flex items-center justify-center m-0.5">
      <Box className="w-full h-full" sx={{ maxWidth: "900px" }}>
        <VideoComparisonView />
      </Box>
    </Box>
  );
};

export default VideoPlayer;
