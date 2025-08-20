"use client";

import { useEffect, useRef, useState } from "react";
import { loadVideo } from "@/services/videoService";
import { Box } from "@mui/material";
import UnifiedPlayer from "./UnifiedPlayer";
import { PlayerHandle } from "./VideoPlayer";
import { VideoType, ViewOptions } from "./types";
import { useVideoMetrics } from "@/contexts/VideoMetricsContext";

type Props = {
  type: VideoType;
};

const InterleavingFrames = ({ type }: Props) => {
  const playerRef = useRef<PlayerHandle>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const { setMetrics, setCurrentFrame } = useVideoMetrics();

  useEffect(() => {
    setMetrics([]);
    setCurrentFrame(0);

    if (type === VideoType.Stream) {
      return () => {};
    }

    let url: string = videoRef.current?.src || "";

    const initializeVideos = async () => {
      try {
        setIsLoading(true);
        setError("");

        const videoInfo = await loadVideo("example-video.mp4", false, videoRef);
        url = videoInfo.url;
      } catch (e) {
        setError(
          "Failed to load video: " +
            (e instanceof Error ? e.message : "Unknown error"),
        );
      } finally {
        setIsLoading(false);
      }
    };

    initializeVideos();

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [setCurrentFrame, setMetrics, type]);

  return (
    <Box
      ref={containerRef}
      className="relative h-full w-full flex flex-col bg-black"
    >
      <Box
        className={`relative flex-1 flex justify-center items-center overflow-hidden`}
      >
        {(isLoading || error) && (
          <Box className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 text-white p-4 text-center">
            {isLoading ? (
              <Box className="h-10 w-10 border-4 border-white border-t-transparent rounded-full animate-spin" />
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
        key={`${type}-${ViewOptions.Interleaving}`}
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
