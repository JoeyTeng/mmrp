"use client";

import { useState, useRef, useEffect } from "react";
import UnifiedPlayer from "./UnifiedPlayer";
import { PlayerHandle } from "./VideoPlayer";
import { Box } from "@mui/material";
import { loadVideo } from "@/services/videoService";
import { FrameData, VideoType } from "./types";
import {
  closeVideoWebSocket,
  createVideoWebSocket,
} from "@/services/webSocketClient";

type Props = {
  type: VideoType;
};

const SideBySide = ({ type }: Props) => {
  const videoARef = useRef<HTMLVideoElement>(null);
  const videoBRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<PlayerHandle>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasARef = useRef<HTMLCanvasElement>(null);
  const canvasBRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [frames, setFrames] = useState<FrameData[]>([]);
  const currentFpsRef = useRef(30);
  const currentMimeRef = useRef("image/webp");
  const wsRef = useRef<WebSocket | null>(null);

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

  useEffect(() => {
    let expectedFrames = 1;
    let frameBuffer: Blob[] = [];

    const ws = createVideoWebSocket(
      (data) => {
        if (data instanceof ArrayBuffer) {
          const blob = new Blob([data], { type: currentMimeRef.current });
          frameBuffer.push(blob);

          if (frameBuffer.length === expectedFrames) {
            const [original, filtered] = frameBuffer;
            setFrames((prev) => [
              ...prev,
              {
                blob: [original, filtered],
                fps: currentFpsRef.current,
                mime: currentMimeRef.current,
                count: expectedFrames,
              },
            ]);
            frameBuffer = [];
          }
        } else {
          if (data.fps) currentFpsRef.current = data.fps;
          if (data.mime) currentMimeRef.current = data.mime;
          if (data.count) expectedFrames = data.count;
        }
      },
      undefined,
      undefined,
      undefined,
      { mode: "dual" },
    );

    wsRef.current = ws;

    return () => {
      closeVideoWebSocket();
    };
  }, []);

  return (
    <Box
      ref={containerRef}
      className="relative h-full w-full flex flex-col bg-black"
    >
      {/* Video Container */}
      <Box className="relative flex flex-1">
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
            <canvas
              ref={canvasARef}
              className="w-1/2 h-full bg-black object-contain"
            />
            <canvas
              ref={canvasBRef}
              className="w-1/2 h-full bg-black object-contain"
            />
          </>
        )}
      </Box>

      <UnifiedPlayer
        type={type}
        videoRefs={[videoARef, videoBRef]}
        canvasRefs={[canvasARef, canvasBRef]}
        frames={frames}
        containerRef={containerRef}
        ref={playerRef}
      />
    </Box>
  );
};

export default SideBySide;
