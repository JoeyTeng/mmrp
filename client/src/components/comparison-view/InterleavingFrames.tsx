"use client";

import { useEffect, useRef, useState } from "react";
import { loadVideo } from "@/services/videoService";
import { Box } from "@mui/material";
import UnifiedPlayer from "./UnifiedPlayer";
import { PlayerHandle } from "./VideoPlayer";
import { FrameData, VideoType } from "./types";
import {
  closeVideoWebSocket,
  createVideoWebSocket,
} from "@/services/webSocketClient";

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
  const [frames, setFrames] = useState<FrameData[]>([]);
  const currentFpsRef = useRef(30);
  const currentMimeRef = useRef("image/webp");
  const wsRef = useRef<WebSocket | null>(null);
  const [isStreamActive, setIsStreamActive] = useState(true);

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

  useEffect(() => {
    let expectedFrames = 1;
    let frameBuffer: Blob[] = [];

    const ws = createVideoWebSocket(
      (data) => {
        if (data instanceof ArrayBuffer) {
          const blob = new Blob([data], { type: currentMimeRef.current });
          frameBuffer.push(blob);

          if (frameBuffer.length === expectedFrames) {
            const [original] = frameBuffer;
            setFrames((prev) => [
              ...prev,
              {
                blob: [original],
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
      () => {
        setIsStreamActive(false);
      },
      { mode: "single" },
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
        type={type}
        videoRefs={[videoRef]}
        canvasRefs={[canvasRef]}
        frames={frames}
        showSource
        getSourceLabel={(frame) => (frame % 2 === 0 ? "Video A" : "Video B")}
        containerRef={containerRef}
        ref={playerRef}
        isStreamActive={isStreamActive}
      />
    </Box>
  );
};

export default InterleavingFrames;
