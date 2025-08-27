"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import PlayerControls from "./PlayerControls";
import { ViewOptions } from "./types";
import { useVideoMetrics } from "@/contexts/VideoMetricsContext";
import { useFrames } from "@/contexts/FramesContext";

type Props = {
  view: ViewOptions;
  canvasRefs: React.RefObject<HTMLCanvasElement | null>[];
  showSource?: boolean;
  getSourceLabel?: (frame: number) => string;
  onFullscreen: () => void;
  onFirstFrame?: () => void;
};

const FrameStreamPlayer = ({
  view,
  canvasRefs,
  showSource,
  getSourceLabel,
  onFullscreen,
  onFirstFrame,
}: Props) => {
  const playbackTimer = useRef<NodeJS.Timeout | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isUserPaused, setIsUserPaused] = useState(true);
  const hasCalledFirstFrame = useRef(false);
  const { currentFrame, setCurrentFrame } = useVideoMetrics(); // currentFrame is frame index in range [0, frames.length)
  const { frames, isStreamActive } = useFrames();
  const effectiveFrameCount =
    view === ViewOptions.Interleaving ? frames.length * 2 : frames.length;
  const [index, setIndex] = useState(0); // index [0, frames.length) in Side-by-side, [0, 2 * frames.length) in Interleaving frames

  // Trigger onFirstFrame callback once first frame is received
  useEffect(() => {
    if (!hasCalledFirstFrame.current && frames.length > 0) {
      onFirstFrame?.();
      hasCalledFirstFrame.current = true;
    }
  }, [frames.length, onFirstFrame]);

  // Render frame at given index
  const renderFrame = useCallback(
    (index: number) => {
      if (index >= effectiveFrameCount) return;

      const blobIndex = view === ViewOptions.Interleaving ? index % 2 : null;

      const frame = frames[currentFrame];
      if (!frame) return;

      if (view === ViewOptions.SideBySide) {
        frame.blob.forEach((blob, i) => {
          const canvas = canvasRefs[i]?.current;
          if (!canvas || !blob) return;

          const img = new Image();
          const url = URL.createObjectURL(blob);
          img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            ctx?.clearRect(0, 0, canvas.width, canvas.height);
            ctx?.drawImage(img, 0, 0);
            URL.revokeObjectURL(url);
          };
          img.src = url;
        });
      } else {
        const blob = frame.blob[blobIndex!];
        const canvas = canvasRefs[0]?.current;
        if (!canvas || !blob) return;

        const img = new Image();
        const url = URL.createObjectURL(blob);
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
    [effectiveFrameCount, view, frames, currentFrame, canvasRefs],
  );

  // Handle play/pause
  const handlePlayPause = () => {
    if (!isUserPaused) {
      setIsPlaying(false);
      setIsUserPaused(true);
    } else {
      if (currentFrame >= frames.length - 1 && frames.length > 0) {
        setCurrentFrame(0);
        setIndex(0);
      }
      setIsPlaying(true);
      setIsUserPaused(false);
    }
  };

  // Step forward/backward by delta frames
  const stepFrame = (delta: number) => {
    const newIndex = Math.min(
      Math.max(index + delta, 0),
      effectiveFrameCount - 1,
    );
    const newFrameIndex =
      view === ViewOptions.Interleaving ? Math.floor(newIndex / 2) : newIndex;

    setCurrentFrame(newFrameIndex);
    setIndex(newIndex);
    setIsPlaying(false);
    setIsUserPaused(true);
  };

  // Handle slider movement
  const onSliderChange = (value: number) => {
    const newFrameIndex =
      view === ViewOptions.Interleaving ? Math.floor(value / 2) : value;

    setCurrentFrame(newFrameIndex);
    setIndex(value);
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

    if (index >= effectiveFrameCount) {
      setIndex(effectiveFrameCount - 1);
      setIsPlaying(false);
      if (!isStreamActive) {
        setIsUserPaused(true);
      }
      return;
    }

    renderFrame(index);

    const fps = frames[currentFrame]?.fps || 30;
    const delay = 1000 / fps;

    playbackTimer.current = setTimeout(() => {
      setIndex((prev) => prev + 1);
      setCurrentFrame(
        view === ViewOptions.Interleaving ? Math.floor(index / 2) : index,
      );
    }, delay);

    return () => {
      if (playbackTimer.current) {
        clearTimeout(playbackTimer.current);
        playbackTimer.current = null;
      }
    };
  }, [
    isPlaying,
    currentFrame,
    frames,
    renderFrame,
    view,
    isStreamActive,
    effectiveFrameCount,
    setCurrentFrame,
    index,
  ]);

  // When virtualFrame changes and playback is paused, render frame immediately
  useEffect(() => {
    if (!isPlaying && frames.length > 0) {
      renderFrame(index);
    }
  }, [isPlaying, frames, renderFrame, index]);

  // Auto-resuming playback
  useEffect(() => {
    if (!isPlaying && !isUserPaused && frames.length > currentFrame) {
      setIsPlaying(true);
    }
  }, [frames, isPlaying, isUserPaused, currentFrame]);

  const sourceLabel = getSourceLabel?.(index);

  return (
    <PlayerControls
      currentFrame={currentFrame + 1}
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
      sliderValue={index}
      sliderMax={effectiveFrameCount - 1}
      sliderStep={1}
    />
  );
};

export default FrameStreamPlayer;
