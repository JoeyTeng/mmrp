"use client";

import { useState, useRef, useEffect, RefObject } from "react";
import Player, { PlayerHandle } from "./Player";
import { apiClient } from "@/services/apiClient";
import { Box } from "@mui/material";

const SideBySide = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const videoARef = useRef<HTMLVideoElement>(null);
  const videoBRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<PlayerHandle>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const loadVideo = async (
    videoName: string,
    ref: RefObject<HTMLVideoElement | null>,
  ) => {
    try {
      const response = await apiClient.get(
        `/video/${encodeURIComponent(videoName)}`,
        {
          responseType: "blob",
          timeout: 30000,
        },
      );
      const url = URL.createObjectURL(response.data);
      if (ref.current) {
        ref.current.src = url;
      }
      return url;
    } catch (e) {
      console.error(`Error loading video ${videoName}`);
      throw e;
    }
  };

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
      className="relative w-full h-full bg-primary"
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        width: "100vw",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Loading Spinner Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-primary bg-opacity-60">
          <div className="h-10 w-10 border-4 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Error Message Overlay */}
      {error && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-primary bg-opacity-60 text-white">
          {error}
        </div>
      )}

      {/* Videos Container */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          width: "100%",
          minHeight: 0,
        }}
      >
        <Box
          sx={{
            flex: 1,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <video
            ref={videoARef}
            className="w-full h-full object-contain"
            onTimeUpdate={() => playerRef.current?.handleTimeUpdate()}
            onLoadedData={() => setIsLoading(false)}
            onError={() => setError("Error playing original video")}
          />
        </Box>
        <Box
          sx={{
            flex: 1,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <video
            ref={videoBRef}
            className="w-full h-full object-contain"
            muted
            onError={() => setError("Error playing filtered video")}
          />
        </Box>
      </Box>

      {/* Player Container */}
      <Box
        className="w-full"
        sx={{
          overflow: "hidden",
          position: "relative",
        }}
      >
        <Player
          ref={playerRef}
          videoRefs={[videoARef, videoBRef]}
          containerRef={containerRef}
        />
      </Box>
    </Box>
  );
};

export default SideBySide;
