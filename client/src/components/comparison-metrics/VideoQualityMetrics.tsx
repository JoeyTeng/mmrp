import { useVideoMetrics } from "@/contexts/VideoMetricsContext";
import { Box } from "@mui/material";
import { useMemo } from "react";

const VideoQualityMetrics = () => {
  const { metrics, currentFrame } = useVideoMetrics();
  const currentFrameMetrics = metrics[currentFrame];

  // Get the first message from any frame (assumes ordered list)
  const firstMessage = useMemo(() => {
    return metrics.find((m) => m?.message)?.message;
  }, [metrics]);

  if (firstMessage) {
    return (
      <Box className="w-full h-full">
        <Box className="flex flex-col text-center h-full">{firstMessage}</Box>
      </Box>
    );
  }

  if (!currentFrameMetrics) return null;

  return (
    <Box className="w-full h-full">
      <Box className="flex flex-col text-center h-full">
        <Box className="flex-1 flex items-center justify-between">
          <span className="text-sm font-medium">PSNR</span>
          <span className="text-sm text-gray-600">
            {currentFrameMetrics.psnr?.toFixed(2)} dB
          </span>
        </Box>
        <Box className="flex-1 flex items-center justify-between">
          <span className="text-sm font-medium">SSIM</span>
          <span className="text-sm text-gray-600">
            {currentFrameMetrics.ssim?.toFixed(4)}
          </span>
        </Box>
      </Box>
    </Box>
  );
};

export default VideoQualityMetrics;
