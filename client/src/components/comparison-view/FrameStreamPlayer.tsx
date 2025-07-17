"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import PlayerControls from "./PlayerControls";
import { FrameData, ViewOptions } from "./types";
import {
  closeVideoWebSocket,
  createVideoWebSocket,
} from "@/services/webSocketClient";

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
  const [currentFrame, setCurrentFrame] = useState(0); // Frame index in range [0, frames.length)
  const [isUserPaused, setIsUserPaused] = useState(true);
  const [frames, setFrames] = useState<FrameData[]>([]);
  const currentFpsRef = useRef(30);
  const currentMimeRef = useRef("image/webp");
  const [isStreamActive, setIsStreamActive] = useState(false);
  const [filenames] = useState([
    "example-video.mp4",
    "example-video-filter.mp4",
  ]);
  const hasCalledFirstFrame = useRef(false);

  useEffect(() => {
    if (!hasCalledFirstFrame.current && frames.length > 0) {
      onFirstFrame?.();
      hasCalledFirstFrame.current = true;
    }
  }, [frames.length, onFirstFrame]);

  // Establish WebSocket connection to receive video frame data
  useEffect(() => {
    const expectedFrames = 2;
    let frameBuffer: Blob[] = [];

    createVideoWebSocket(
      (data) => {
        if (data instanceof ArrayBuffer) {
          const blob = new Blob([data], { type: currentMimeRef.current });
          frameBuffer.push(blob);

          if (frameBuffer.length === expectedFrames) {
            const commonFrameData = {
              fps: currentFpsRef.current,
              mime: currentMimeRef.current,
            };

            if (view === ViewOptions.SideBySide) {
              const newFrame = {
                blob: [frameBuffer[0], frameBuffer[1]],
                ...commonFrameData,
              };
              setFrames((prev) => [...prev, newFrame]);
            } else {
              const [original, filtered] = frameBuffer;

              const newFrames = [
                { blob: [original], ...commonFrameData },
                { blob: [filtered], ...commonFrameData },
              ];

              setFrames((prev) => [...prev, ...newFrames]);
            }

            frameBuffer = [];
          }
        } else {
          if (data.fps) currentFpsRef.current = data.fps;
          if (data.mime) currentMimeRef.current = data.mime;
        }
      },
      () => {
        setIsStreamActive(true);
      },
      undefined,
      () => {
        setIsStreamActive(false);
      },
      { filenames },
    );

    return () => {
      closeVideoWebSocket();
    };
  }, [filenames, view]);

  // Render frame at given index
  const renderFrame = useCallback(
    (index: number): void => {
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

  // Handle play/pause
  const handlePlayPause = () => {
    if (!isUserPaused) {
      setIsPlaying(false);
      setIsUserPaused(true);
    } else {
      if (currentFrame >= frames.length - 1 && frames.length > 0) {
        setCurrentFrame(0);
      }
      setIsPlaying(true);
      setIsUserPaused(false);
    }
  };

  // Step forward/backward by delta frames
  const stepFrame = (delta: number) => {
    const next = Math.min(Math.max(currentFrame + delta, 0), frames.length - 1);
    setCurrentFrame(next);
    setIsPlaying(false);
    setIsUserPaused(true);
  };

  // Handle slider movement
  const onSliderChange = (value: number) => {
    setCurrentFrame(Math.min(value, frames.length - 1));
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

    if (currentFrame >= frames.length - 1) {
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

  // Frame label in range [1, frames.length]
  const currentFrameLabel =
    view === ViewOptions.SideBySide
      ? currentFrame + 1
      : Math.ceil((currentFrame + 1) / 2);

  const totalFramesLabel =
    view === ViewOptions.SideBySide
      ? frames.length
      : Math.ceil(frames.length / 2);

  return (
    <PlayerControls
      currentFrame={currentFrameLabel}
      totalFrames={totalFramesLabel}
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
      sliderMax={frames.length - 1}
      sliderStep={1}
    />
  );
};

export default FrameStreamPlayer;
