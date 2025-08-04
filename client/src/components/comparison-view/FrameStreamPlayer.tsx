"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import PlayerControls from "./PlayerControls";
import { FrameData, ViewOptions } from "./types";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { useVideoMetrics } from "@/contexts/VideoMetricsContext";
import { Metrics } from "@/types/metrics";
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
  const currentFpsRef = useRef(30);
  const currentMimeRef = useRef("image/webp");
  const latestMetricsRef = useRef<Partial<Metrics>>({});
  const [isStreamActive, setIsStreamActive] = useState(false);
  const hasCalledFirstFrame = useRef(false);
  const { setMetrics, currentFrame, setCurrentFrame } = useVideoMetrics(); // currentFrame is frame index in range [0, frames.length)
  const { createConnection, closeConnection } = useWebSocket();
  const { frames, setFrames } = useFrames();
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

  // Establish WebSocket connection to receive video frame data
  useEffect(() => {
    const expectedFrames = 2;
    let frameBuffer: Blob[] = [];
    setMetrics([]);
    setFrames([]);
    setCurrentFrame(0);
    setIndex(0);
    const pipelineRequest = {
      modules: [
        {
          id: "1",
          name: "source",
          module_class: "video_source",
          source: [],
          parameters: [{ key: "path", value: "example-video.mp4" }],
        },
        {
          id: "2",
          name: "blur",
          module_class: "blur",
          source: ["1"],
          parameters: [
            { key: "kernel_size", value: 5 },
            { key: "method", value: "gaussian" },
          ],
        },
        {
          id: "3",
          name: "result",
          module_class: "video_output",
          source: ["2"],
          parameters: [{ key: "video_player", value: "right" }],
        },
      ],
    };

    createConnection(
      (data) => {
        if (data instanceof ArrayBuffer) {
          const blob = new Blob([data], { type: currentMimeRef.current });
          frameBuffer.push(blob);

          if (frameBuffer.length === expectedFrames) {
            const commonFrameData = {
              fps: currentFpsRef.current,
              mime: currentMimeRef.current,
            };
            const metrics = {
              psnr: latestMetricsRef.current.psnr!,
              ssim: latestMetricsRef.current.ssim!,
            };

            const [original, filtered] = frameBuffer;
            const frame: FrameData = {
              blob: [original, filtered],
              ...commonFrameData,
            };
            setFrames((prev) => [...prev, frame]);
            setMetrics((prev) => [...prev, metrics]);

            frameBuffer = [];
            latestMetricsRef.current = {};
          }
        } else {
          if (data.fps) currentFpsRef.current = data.fps;
          if (data.mime) currentMimeRef.current = data.mime;
          if (data.metrics) {
            latestMetricsRef.current = {
              psnr: data.metrics.psnr,
              ssim: data.metrics.ssim,
            };
          }
        }
      },
      () => {
        setIsStreamActive(true);
      },
      undefined,
      () => {
        setIsStreamActive(false);
      },
      pipelineRequest,
    );

    return () => {
      closeConnection();
    };
  }, [
    closeConnection,
    createConnection,
    setCurrentFrame,
    setFrames,
    setMetrics,
    view,
  ]);

  // Render frame at given index
  const renderFrame = useCallback(
    (virtualIndex: number) => {
      if (virtualIndex >= effectiveFrameCount) return;

      const frameIndex =
        view === ViewOptions.Interleaving
          ? Math.floor(virtualIndex / 2)
          : virtualIndex;

      const blobIndex =
        view === ViewOptions.Interleaving ? virtualIndex % 2 : null;

      const frame = frames[frameIndex];
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
    [frames, view, canvasRefs, effectiveFrameCount],
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

    if (index >= effectiveFrameCount - 1) {
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
