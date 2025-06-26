import VideoComparisonView from "@/components/cards/VideoComparisonView";
import { Box } from "@mui/material";

const VideoPlayer = () => {
  return (
    <Box className="h-full w-full flex justify-center items-center">
      <Box className="w-full h-full flex items-center justify-center max-w-md md:max-w-xl lg:max-w-3xl xl:max-w-4xl 2xl:max-w-5xl">
        <VideoComparisonView />
      </Box>
    </Box>
  );
};

export default VideoPlayer;
