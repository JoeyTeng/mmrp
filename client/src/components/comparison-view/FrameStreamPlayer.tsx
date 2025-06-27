"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import PlayerControls from "./PlayerControls";
import { config } from "@/utils/config";

type Props = {
  containerRef: React.RefObject<HTMLDivElement | null>;
  showSource?: boolean;
  getSourceLabel?: (frame: number) => string;
  isFullscreen?: boolean;
};

type FrameData = {
  blob: Blob;
  fps: number;
  mime: string;
};

const FrameStreamPlayer = ({
  containerRef,
  showSource,
  getSourceLabel,
  isFullscreen,
}: Props) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const playbackTimer = useRef<NodeJS.Timeout | null>(null);
  const currentFpsRef = useRef(30);
  const currentMimeRef = useRef("image/webp");

  const [isPlaying, setIsPlaying] = useState(false);
  const [frames, setFrames] = useState<FrameData[]>([]);
  const [currentFrame, setCurrentFrame] = useState(0);

  // Render frame at given index
  const renderFrame = useCallback(
    (index: number): Promise<void> => {
      return new Promise((resolve) => {
        if (!canvasRef.current || index >= frames.length) return resolve();
        const ctx = canvasRef.current.getContext("2d");
        const { blob } = frames[index];
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
          if (!canvasRef.current) return resolve();
          canvasRef.current.width = img.width;
          canvasRef.current.height = img.height;
          ctx?.drawImage(img, 0, 0);
          URL.revokeObjectURL(url);
          resolve();
        };
        img.src = url;
      });
    },
    [frames],
  );

  const handlePlayPause = () => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      if (currentFrame >= frames.length) {
        setCurrentFrame(0);
        renderFrame(0);
      }
      setIsPlaying(true);
    }
  };

  // Step forward/backward by delta frames
  const stepFrame = (delta: number) => {
    const next = Math.min(Math.max(currentFrame + delta, 0), frames.length - 1);
    setCurrentFrame(next);
    renderFrame(next);
    setIsPlaying(false);
  };

  const onSliderChange = (value: number) => {
    setCurrentFrame(value);
    renderFrame(value);
  };

  const handleFullscreen = () => {
    const elem = containerRef.current;
    if (!elem) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      elem.requestFullscreen();
    }
  };

  useEffect(() => {
    const ws = new WebSocket(`${config.apiBaseUrl}/ws/video`);
    ws.binaryType = "arraybuffer";
    wsRef.current = ws;

    ws.onmessage = (event) => {
      if (typeof event.data === "string") {
        try {
          const meta = JSON.parse(event.data);
          if (meta.fps) {
            currentFpsRef.current = meta.fps;
          }
          if (meta.mime) {
            currentMimeRef.current = meta.mime;
          }
        } catch (e) {
          console.error("Invalid metadata", e);
        }
      } else {
        const blob = new Blob([event.data], { type: currentMimeRef.current });
        setFrames((prev) => [
          ...prev,
          { blob, fps: currentFpsRef.current, mime: currentMimeRef.current },
        ]);
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  // Playback effect - dynamic frame timing by fps stored in each frame
  useEffect(() => {
    if (!isPlaying) {
      if (playbackTimer.current) {
        clearTimeout(playbackTimer.current);
        playbackTimer.current = null;
      }
      return;
    }

    if (currentFrame >= frames.length) {
      setIsPlaying(false);
      return;
    }

    // Render current frame
    renderFrame(currentFrame);

    // Schedule next frame
    const fps = frames[currentFrame]?.fps || 30;
    const delay = 1000 / fps;

    playbackTimer.current = setTimeout(() => {
      setCurrentFrame((prev) => prev + 1);
    }, delay);

    return () => {
      if (playbackTimer.current) {
        clearTimeout(playbackTimer.current);
        playbackTimer.current = null;
      }
    };
  }, [isPlaying, currentFrame, frames, renderFrame]);

  // When currentFrame changes and playback is paused, render frame immediately
  useEffect(() => {
    if (!isPlaying && frames.length > 0) {
      renderFrame(currentFrame);
    }
  }, [currentFrame, isPlaying, frames, renderFrame]);

  const sourceLabel = getSourceLabel?.(currentFrame);

  return (
    <div className="w-full">
      <div
        className={`flex justify-center items-center w-full ${
          isFullscreen ? "h-[calc(100vh-50px)]" : "h-full"
        }`}
      >
        <canvas
          ref={canvasRef}
          className={`object-contain bg-black ${isFullscreen ? "w-full h-full" : "w-1/2 h-full"}`}
        />
      </div>
      <PlayerControls
        currentFrame={Math.min(currentFrame + 1, frames.length)}
        totalFrames={frames.length}
        isPlaying={isPlaying}
        showMute={false}
        isMuted={true}
        onPlayPause={handlePlayPause}
        onMuteToggle={() => {}}
        onStepFrame={stepFrame}
        onSliderChange={onSliderChange}
        onFullscreen={handleFullscreen}
        showSource={showSource}
        sourceLabel={sourceLabel}
        sliderValue={currentFrame}
        sliderMax={frames.length - 1}
        sliderStep={1}
      />
    </div>
  );
};

export default FrameStreamPlayer;
