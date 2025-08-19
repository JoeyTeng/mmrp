"use client";

import { useRef, useEffect } from "react";
import UnifiedPlayer from "./UnifiedPlayer";
import { PlayerHandle } from "./VideoPlayer";
import { Box } from "@mui/material";
import { useVideo } from "@/contexts/VideoContext";
import { useVideoReload } from "@/contexts/VideoReloadContext";
import { VideoType, VideoViews, ViewOptions } from "./types";
import { useVideoMetrics } from "@/contexts/VideoMetricsContext";

const SideBySide = ({ type, isLoading, error }: VideoViews) => {
  const { videos } = useVideo();
  const { latestResponse, isProcessing, isProcessingError } = useVideoReload();

  // Initialise video and player references
  const videoARef = useRef<HTMLVideoElement>(null);
  const videoBRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<PlayerHandle>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasARef = useRef<HTMLCanvasElement>(null);
  const canvasBRef = useRef<HTMLCanvasElement>(null);

  // Group all loading and error states
  const isAnyLoading = isLoading || isProcessing;
  const isAnyError = !!error || isProcessingError;

  const { setMetrics, setCurrentFrame } = useVideoMetrics();

  // Reset metrics when video changes
  useEffect(() => {
    setMetrics([]);
    setCurrentFrame(0);

    if (type === VideoType.Stream) {
      return;
    }
  }, [latestResponse, setCurrentFrame, setMetrics, type]);

  return (
    <Box
      ref={containerRef}
      className="relative h-full w-full flex flex-col bg-black"
    >
      {/* Video Container */}
      <Box className="relative flex flex-1">
        {/* Status Overlay */}
        {(isAnyLoading || isAnyError) && (
          <Box className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 text-white p-4 text-center">
            {isLoading ? (
              <Box className="h-10 w-10 border-4 border-white border-t-transparent rounded-full animate-spin" />
            ) : isProcessing ? (
              <Box className="flex flex-col items-center justify-center">
                <Box className="h-10 w-10 border-4 border-white border-t-transparent rounded-full animate-spin" />
                <Box className="mt-4 text-lg font-medium">
                  Processing Pipeline...
                </Box>
                <Box className="text-sm text-gray-300 mt-1">
                  This might take some time.
                </Box>
              </Box>
            ) : isProcessingError ? (
              <Box className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 text-white p-4 text-center">
                {/* Error Icon */}
                <Box className="flex items-center justify-center h-10 w-10 rounded-full bg-red-600 mb-4">
                  <span className="text-3xl font-bold">!</span>
                </Box>
                {/* Error Text */}
                <Box className="text-lg font-semibold">
                  Error processing pipeline
                </Box>
                <Box className="text-sm text-gray-300 mt-1">
                  Please try again or check your pipeline.
                </Box>
              </Box>
            ) : (
              error
            )}
          </Box>
        )}
        {type === VideoType.Video && videos && (
          <>
            {/* Left Video */}
            {videos.left?.url && (
              <Box
                component="video"
                ref={videoARef}
                src={videos.left.url}
                className="w-1/2 h-full object-contain"
                onTimeUpdate={() => playerRef.current?.handleTimeUpdate()}
              />
            )}
            {/* Right Video */}
            {videos.right?.url && (
              <Box
                component="video"
                ref={videoBRef}
                src={videos.right.url}
                className="w-1/2 h-full object-contain"
                muted
              />
            )}
          </>
        )}
        {type === VideoType.Stream && (
          <>
            <Box
              component="canvas"
              ref={canvasARef}
              className="w-1/2 h-full bg-black object-contain"
            />
            <Box
              component="canvas"
              ref={canvasBRef}
              className="w-1/2 h-full bg-black object-contain"
            />
          </>
        )}
      </Box>

      {/* Player Controls */}
      <UnifiedPlayer
        key={`${type}-${ViewOptions.SideBySide}`}
        view={ViewOptions.SideBySide}
        type={type}
        videoRefs={[videoARef, videoBRef]}
        canvasRefs={[canvasARef, canvasBRef]}
        containerRef={containerRef}
        ref={playerRef}
      />
    </Box>
  );
};

export default SideBySide;
