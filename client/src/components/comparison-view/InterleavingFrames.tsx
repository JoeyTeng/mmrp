"use client";

import { useEffect, useRef, useState } from "react";
import { loadVideo } from "@/services/videoService";
import { Box } from "@mui/material";
import UnifiedPlayer from "./UnifiedPlayer";
import { PlayerHandle } from "./VideoPlayer";
import { VideoType } from "./types";

type Props = {
  type: VideoType;
};

const InterleavingFrames = ({ type }: Props) => {
  const playerRef = useRef<PlayerHandle>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, []);

  useEffect(() => {
    let url: string = videoRef.current?.src || "";

    const initializeVideos = async () => {
      try {
        setIsLoading(true);
        setError("");

        url = await loadVideo("example-video.mp4", videoRef);
      } catch (e) {
        setError("Failed to load video. Please try again. " + e);
      } finally {
        setIsLoading(false);
      }
    };

    initializeVideos();

    return () => {
      URL.revokeObjectURL(url);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative w-full flex flex-col ${isFullscreen ? "h-screen bg-black" : "h-full"}`}
    >
      <div
        className={`relative flex justify-center items-center w-full ${isFullscreen ? "h-[calc(100vh-50px)]" : "h-full"}`}
      >
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
        {type === VideoType.Video && videoRef && (
          <video
            ref={videoRef}
            className={`object-contain bg-black ${
              isFullscreen ? "w-full h-full" : "w-1/2 h-full"
            }`}
            onTimeUpdate={() => playerRef.current?.handleTimeUpdate()}
            onLoadStart={() => setIsLoading(true)}
            onCanPlay={() => setIsLoading(false)}
            onError={() => setError("Failed to load video")}
            controls={false}
          />
        )}
      </div>
      {type === VideoType.Stream && (
        <>{/* UnifiedPlayer will render canvas stream */}</>
      )}
      <UnifiedPlayer
        type={type}
        videoRefs={[videoRef]}
        showSource
        getSourceLabel={(frame) => (frame % 2 === 0 ? "Video A" : "Video B")}
        containerRef={containerRef}
        ref={playerRef}
        isFullscreen={isFullscreen}
      />
    </div>
  );
};

export default InterleavingFrames;
