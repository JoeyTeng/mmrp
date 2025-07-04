"use client";

import { useState, useRef, useEffect } from "react";
import UnifiedPlayer from "./UnifiedPlayer";
import { PlayerHandle } from "./VideoPlayer";
import { Box } from "@mui/material";
import { loadVideo } from "@/services/videoService";
import { VideoType } from "./types";

type Props = {
  type: VideoType;
};

const SideBySide = ({ type }: Props) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const videoARef = useRef<HTMLVideoElement>(null);
  const videoBRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<PlayerHandle>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const urls: string[] = [];

    const initializeVideos = async () => {
      try {
        setIsLoading(true);
        setError("");

        const [originalUrl, filteredUrl] = await Promise.all([
          loadVideo("example-video.mp4", videoARef),
          loadVideo("example-video-filter.mp4", videoBRef),
        ]);

        urls.push(originalUrl, filteredUrl);
      } catch (e) {
        setError("Failed to load videos. Please try again. " + e);
      } finally {
        setIsLoading(false);
      }
    };

    initializeVideos();

    return () => {
      urls.forEach((url) => url && URL.revokeObjectURL(url));
    };
  }, []);

  return (
    <Box
      ref={containerRef}
      className="relative h-full w-full flex flex-col bg-black"
    >
      {/* Video Container */}
      <Box className="relative flex flex-1">
        {type === VideoType.Video && (
          <>
            {/* Status Overlay */}
            {(isLoading || error) && (
              <Box className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 text-white p-4 text-center">
                {isLoading ? (
                  <Box className="h-10 w-10 border-4 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  error
                )}
              </Box>
            )}
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
      </Box>

      <UnifiedPlayer
        type={type}
        videoRefs={[videoARef, videoBRef]}
        containerRef={containerRef}
        ref={playerRef}
      />
    </Box>
  );
};

export default SideBySide;
