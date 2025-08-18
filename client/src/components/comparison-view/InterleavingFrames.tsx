"use client";

import { useEffect, useRef, useState } from "react";
import { loadVideo } from "@/services/videoService";
import { Box } from "@mui/material";
import UnifiedPlayer from "./UnifiedPlayer";
import { PlayerHandle } from "./VideoPlayer";
import { VideoType, ViewOptions } from "./types";
import { useVideoMetrics } from "@/contexts/VideoMetricsContext";
import { useVideoReload } from "@/contexts/VideoReloadContext";

type Props = {
  type: VideoType;
};

const InterleavingFrames = ({ type }: Props) => {
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
  const playerRef = useRef<PlayerHandle>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Group all loading and error states
  const isAnyLoading = isLoading || isProcessing;
  const isAnyError = error != "" || isProcessingError;

  const { setMetrics, setCurrentFrame } = useVideoMetrics();

  // Load initial video
  useEffect(() => {
    if (type === VideoType.Stream) {
      return () => {};
    }

    const loadInitialVideo = async () => {
      try {
        setIsLoading(true);
        setError("");
        const videoInfo = await loadVideo("example-video.mp4", false, videoRef);
        setLatestVideoInfo("interleaved", videoInfo.url, videoInfo.size);
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
        if (latestResponse!.interleaved !== "") {
          const videoInfo = await loadVideo(
            latestResponse!.interleaved,
            true,
            videoRef,
          );
          setLatestVideoInfo("interleaved", videoInfo.url, videoInfo.size);
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
      <Box
        className={
          "relative flex-1 flex justify-center items-center overflow-hidden"
        }
      >
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
        {type === VideoType.Video && videoRef && (
          <>
            <Box
              component="video"
              ref={videoRef}
              className={`h-full w-auto object-contain`}
              onTimeUpdate={() => playerRef.current?.handleTimeUpdate()}
              onLoadStart={() => setIsLoading(true)}
              onCanPlay={() => setIsLoading(false)}
              onError={() => setError("Failed to load video")}
              controls={false}
            />
          </>
        )}
        {type === VideoType.Stream && (
          <>
            <Box
              component="canvas"
              ref={canvasRef}
              className={`h-full w-auto object-contain`}
            />
          </>
        )}
      </Box>
      <UnifiedPlayer
        key={type}
        view={ViewOptions.Interleaving}
        type={type}
        videoRefs={[videoRef]}
        canvasRefs={[canvasRef]}
        showSource
        getSourceLabel={(frame) => (frame % 2 === 0 ? "Video A" : "Video B")}
        containerRef={containerRef}
        ref={playerRef}
        onFirstFrame={() => setIsLoading(false)}
      />
    </Box>
  );
};

export default InterleavingFrames;
