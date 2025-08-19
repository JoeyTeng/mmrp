"use client";

import { useEffect, useRef } from "react";
import { Box } from "@mui/material";
import UnifiedPlayer from "./UnifiedPlayer";
import { PlayerHandle } from "./VideoPlayer";
import { VideoType, VideoViews, ViewOptions } from "./types";
import { useVideoMetrics } from "@/contexts/VideoMetricsContext";
import { useVideo } from "@/contexts/VideoContext";

const InterleavingFrames = ({ type, isLoading, error }: VideoViews) => {
  const { videos } = useVideo();

  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<PlayerHandle>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { setMetrics, setCurrentFrame } = useVideoMetrics();

  useEffect(() => {
    setMetrics([]);
    setCurrentFrame(0);

    if (type === VideoType.Stream) {
      return () => { };
    }
  }, [type, setMetrics, setCurrentFrame]);

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
        {type === VideoType.Video && (
          <>
            {videos.left?.url && (
              <Box
                component="video"
                ref={videoRef}
                src={videos.left.url}
                className={`h-full w-auto object-contain`}
                onTimeUpdate={() => playerRef.current?.handleTimeUpdate()}
                controls={false}
              />
            )}
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
      />
    </Box>
  );
};

export default InterleavingFrames;
