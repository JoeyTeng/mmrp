"use client";

import React, { useEffect, useRef, useState } from "react";
import PlayerControls from "./PlayerControls";

type Props = {
  containerRef: React.RefObject<HTMLDivElement | null>;
  showSource?: boolean;
  getSourceLabel?: (frame: number) => string;
  isFullscreen?: boolean;
};

const FrameStreamPlayer = ({
  containerRef,
  showSource,
  getSourceLabel,
  isFullscreen,
}: Props) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [frameBlobs, setFrameBlobs] = useState<Blob[]>([]);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [dynamicFps, setDynamicFps] = useState(30);
  const playbackTimer = useRef<NodeJS.Timeout | null>(null);

  const renderFrame = (index: number) => {
    if (!canvasRef.current || index >= frameBlobs.length) return;
    const ctx = canvasRef.current.getContext("2d");
    const blob = frameBlobs[index];
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      canvasRef.current!.width = img.width;
      canvasRef.current!.height = img.height;
      ctx?.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      if (currentFrame >= frameBlobs.length - 1) {
        setCurrentFrame(0);
        renderFrame(0);
      }
      setIsPlaying(true);
    }
  };

  const stepFrame = (delta: number) => {
    const next = Math.min(
      Math.max(currentFrame + delta, 0),
      frameBlobs.length - 1,
    );
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
    const ws = new WebSocket("ws://localhost:8000/ws/video");
    ws.binaryType = "arraybuffer";
    wsRef.current = ws;

    let expectingImage = false;

    ws.onmessage = (event) => {
      if (typeof event.data === "string") {
        try {
          const meta = JSON.parse(event.data);
          if (meta.fps) setDynamicFps(meta.fps);
          expectingImage = true;
        } catch (e) {
          console.error("Invalid metadata", e);
        }
      } else if (expectingImage) {
        //TODO: get MIME type along with the metadata to render the correct format
        const blob = new Blob([event.data], { type: "image/jpeg" });
        setFrameBlobs((prev) => [...prev, blob]);
        expectingImage = false;
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    if (!isPlaying) {
      if (playbackTimer.current) clearInterval(playbackTimer.current);
      return;
    }

    const interval = setInterval(() => {
      setCurrentFrame((prev) => {
        const next = prev + 1;
        if (next < frameBlobs.length) {
          renderFrame(next);
          return next;
        } else {
          setIsPlaying(false);
          return prev;
        }
      });
    }, 1000 / dynamicFps);

    playbackTimer.current = interval;
    return () => clearInterval(interval);
  }, [isPlaying, frameBlobs.length, dynamicFps]);

  useEffect(() => {
    if (frameBlobs.length > 0 && currentFrame === 0) {
      renderFrame(0);
    }
  }, [frameBlobs]);

  const sourceLabel = getSourceLabel?.(currentFrame);

  return (
    <div className="w-full">
      <div
        className={`flex justify-center items-center w-full ${isFullscreen ? "h-[calc(100vh-50px)]" : "h-full"}`}
      >
        <canvas
          ref={canvasRef}
          className={`object-contain bg-black ${isFullscreen ? "w-full h-full" : "w-1/2 h-full"}`}
        />
      </div>
      <PlayerControls
        currentFrame={currentFrame + 1}
        totalFrames={frameBlobs.length}
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
        sliderMax={frameBlobs.length - 1}
        sliderStep={1}
      />
    </div>
  );
};

export default FrameStreamPlayer;
