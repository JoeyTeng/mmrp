"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import PlayerControls from "./PlayerControls";
import { FrameData } from "./types";

type Props = {
  canvasRefs: React.RefObject<HTMLCanvasElement | null>[];
  frames: FrameData[];
  showSource?: boolean;
  getSourceLabel?: (frame: number) => string;
  onFullscreen: () => void;
  isStreamActive?: boolean;
};

const FrameStreamPlayer = ({
  canvasRefs,
  frames,
  showSource,
  getSourceLabel,
  onFullscreen,
  isStreamActive = true,
}: Props) => {
  const playbackTimer = useRef<NodeJS.Timeout | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isUserPaused, setIsUserPaused] = useState(true);

  // Render frame at given index
  const renderFrame = useCallback(
    async (index: number): Promise<void> => {
      if (index >= frames.length) return;

      const frame = frames[index];

      for (let i = 0; i < canvasRefs.length; i++) {
        const canvas = canvasRefs[i]?.current;
        const blob = frame.blob[i]; // Match frame blob to canvas

        if (!canvas || !blob) continue;

        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          ctx?.clearRect(0, 0, canvas.width, canvas.height);
          ctx?.drawImage(img, 0, 0);
          URL.revokeObjectURL(url);
        };
        img.src = url;
      }
    },
    [frames, canvasRefs],
  );

  const handlePlayPause = () => {
    if (!isUserPaused) {
      setIsPlaying(false);
      setIsUserPaused(true);
    } else {
      if (currentFrame >= frames.length && frames.length > 0) {
        setCurrentFrame(0);
        renderFrame(0);
      }
      setIsPlaying(true);
      setIsUserPaused(false);
    }
  };

  // Step forward/backward by delta frames
  const stepFrame = (delta: number) => {
    const next = Math.min(Math.max(currentFrame + delta, 0), frames.length);
    setCurrentFrame(next);
    renderFrame(next);
    setIsPlaying(false);
    setIsUserPaused(true);
  };

  const onSliderChange = (value: number) => {
    setCurrentFrame(value);
    renderFrame(value);
    setIsPlaying(false);
    setIsUserPaused(true);
  };

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
      if (!isStreamActive) {
        setIsUserPaused(true);
      }
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
  }, [isPlaying, currentFrame, frames, renderFrame, isStreamActive]);

  // When currentFrame changes and playback is paused, render frame immediately
  useEffect(() => {
    if (!isPlaying && frames.length > 0) {
      renderFrame(currentFrame);
    }
  }, [currentFrame, isPlaying, frames, renderFrame]);

  // Auto-resuming playback
  useEffect(() => {
    if (!isPlaying && !isUserPaused && frames.length > currentFrame) {
      setIsPlaying(true);
    }
  }, [frames, isPlaying, isUserPaused, currentFrame]);

  const sourceLabel = getSourceLabel?.(currentFrame);

  return (
    <>
      <PlayerControls
        currentFrame={currentFrame}
        totalFrames={frames.length}
        isPlaying={!isUserPaused}
        showMute={false}
        isMuted={true}
        onPlayPause={handlePlayPause}
        onMuteToggle={() => {}}
        onStepFrame={stepFrame}
        onSliderChange={onSliderChange}
        onFullscreen={onFullscreen}
        showSource={showSource}
        sourceLabel={sourceLabel}
        sliderValue={currentFrame}
        sliderMax={frames.length}
        sliderStep={1}
      />
    </>
  );
};

export default FrameStreamPlayer;
