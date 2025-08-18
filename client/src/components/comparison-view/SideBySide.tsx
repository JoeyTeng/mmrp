"use client";

import { useState, useRef, useEffect } from "react";
import UnifiedPlayer from "./UnifiedPlayer";
import { PlayerHandle } from "./VideoPlayer";
import { Box } from "@mui/material";
import { loadVideo } from "@/services/videoService";
import { useVideoReload } from "@/contexts/VideoReloadContext";
import { VideoType, ViewOptions } from "./types";
import { useVideoMetrics } from "@/contexts/VideoMetricsContext";

type Props = {
  type: VideoType;
};

const SideBySide = ({ type }: Props) => {
  // Initialise error and loading states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const {
    latestResponse,
    isProcessing,
    isProcessingError,
    setLatestVideoInfo,
  } = useVideoReload();

  // Initialise video and player references
  const videoARef = useRef<HTMLVideoElement>(null);
  const videoBRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<PlayerHandle>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasARef = useRef<HTMLCanvasElement>(null);
  const canvasBRef = useRef<HTMLCanvasElement>(null);

  // Group all loading and error states
  const isAnyLoading = isLoading || isProcessing;
  const isAnyError = error != "" || isProcessingError;

  const { setMetrics, setCurrentFrame } = useVideoMetrics();

  // Load initial video
  useEffect(() => {
    if (type === VideoType.Stream) {
      return;
    }

    const loadInitialVideo = async () => {
      try {
        setIsLoading(true);
        setError("");
        const videoInfo = await loadVideo(
          "example-video.mp4",
          false,
          videoARef,
        );
        setLatestVideoInfo("left", videoInfo.url, videoInfo.size);
      } catch (e) {
        setError("Failed to load videos. Please try again. " + e);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialVideo();
  }, [setCurrentFrame, setLatestVideoInfo, setMetrics, type]);

  // When reload is triggered, load processed video(s)
  useEffect(() => {
    setCurrentFrame(0);

    if (type === VideoType.Stream) {
      return;
    }

    const loadOutputVideos = async () => {
      try {
        setIsLoading(true);
        if (latestResponse!.left !== "") {
          const leftVideoInfo = await loadVideo(
            latestResponse!.left,
            true,
            videoARef,
          );
          setLatestVideoInfo("left", leftVideoInfo.url, leftVideoInfo.size);
        }
        if (latestResponse!.right !== "") {
          const rightVideoInfo = await loadVideo(
            latestResponse!.right,
            true,
            videoBRef,
          );
          setLatestVideoInfo("right", rightVideoInfo.url, rightVideoInfo.size);
        }
      } catch (e) {
        setError("Failed to load output video: " + e);
      } finally {
        setIsLoading(false);
      }
    };

    if (latestResponse != null) {
      loadOutputVideos();
    }
  }, [latestResponse, setCurrentFrame, setLatestVideoInfo, type]);

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
        {type === VideoType.Video && (
          <>
            {/* Left Video */}
            <Box
              component="video"
              ref={videoARef}
              className="w-1/2 h-full object-contain"
              onTimeUpdate={() => playerRef.current?.handleTimeUpdate()}
              onLoadStart={() => setIsLoading(true)}
              onCanPlay={() => setIsLoading(false)}
              onError={() => setError("Failed to load original video")}
            />
            {/* Right Video */}
            <Box
              component="video"
              ref={videoBRef}
              className="w-1/2 h-full object-contain"
              muted
              onError={() => setError("Failed to load filtered video")}
            />
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
        key={type}
        view={ViewOptions.SideBySide}
        type={type}
        videoRefs={[videoARef, videoBRef]}
        canvasRefs={[canvasARef, canvasBRef]}
        containerRef={containerRef}
        ref={playerRef}
        onFirstFrame={() => setIsLoading(false)}
      />
    </Box>
  );
};

export default SideBySide;
