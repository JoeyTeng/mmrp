import { useVideoMetrics } from "@/contexts/VideoMetricsContext";
import { Box } from "@mui/material";

const VideoQualityMetrics = () => {
  const { metrics, currentFrame } = useVideoMetrics();
  const currentFrameMetrics = metrics[currentFrame];

  if (!currentFrameMetrics) return null;

  return (
    <Box className="w-full h-full">
      <Box className="flex flex-col text-center h-full">
        <Box className="flex-1 flex items-center justify-between">
          <span className="text-sm font-medium">PSNR</span>
          <span className="text-sm text-gray-600">
            {currentFrameMetrics.psnr.toFixed(2)} dB
          </span>
        </Box>
        <Box className="flex-1 flex items-center justify-between">
          <span className="text-sm font-medium">SSIM</span>
          <span className="text-sm text-gray-600">
            {currentFrameMetrics.ssim.toFixed(4)}
          </span>
        </Box>
      </Box>
    </Box>
  );
};

export default VideoQualityMetrics;
