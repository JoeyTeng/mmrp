"use client";

import { FrameData } from "@/types/frame";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useVideoReload } from "./VideoReloadContext";
import { useWebSocket } from "./WebSocketContext";
import { useVideoMetrics } from "./VideoMetricsContext";
import { Metrics } from "@/types/metrics";

type FramesContextType = {
  frames: FrameData[];
  setFrames: React.Dispatch<React.SetStateAction<FrameData[]>>;
  resetFrames: () => void;
  isStreamActive: boolean;
  startStream: () => void;
};

const FramesContext = createContext<FramesContextType | undefined>(undefined);

export const FramesProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { createConnection, closeConnection } = useWebSocket();
  const { setMetrics, setCurrentFrame } = useVideoMetrics(); // currentFrame is frame index in range [0, frames.length)
  const { latestRequest } = useVideoReload();
  const [frames, setFrames] = useState<FrameData[]>([]);

  const resetFrames = () => setFrames([]);
  const [isStreamActive, setIsStreamActive] = useState(false);

  // keep a ref so multiple players can attach without restarting
  const hasStarted = useRef(false);
  const currentFpsRef = useRef(29.97);
  const currentMimeRef = useRef("image/webp");
  const latestMetricsRef = useRef<Partial<Metrics>>({});

  // close WebSocket and mark as stopped
  const stopStream = useCallback(() => {
    closeConnection();
    setIsStreamActive(false);
    hasStarted.current = false;
  }, [closeConnection]);

  // starts video frame stream via WebSocket
  const startStream = useCallback(() => {
    if (hasStarted.current || !latestRequest) return;
    hasStarted.current = true;

    const expectedFrames = 2;
    let frameBuffer: Blob[] = [];
    setMetrics([]);
    setFrames([]);
    setCurrentFrame(0);
    // setIndex(0);

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
        stopStream();
      },
      latestRequest,
    );
  }, [
    createConnection,
    latestRequest,
    setCurrentFrame,
    setMetrics,
    stopStream,
  ]);

  // restart stream whenever latestRequest changes
  useEffect(() => {
    if (!latestRequest) return;
    stopStream(); // ensure old WebSocket is closed to avoid races
    startStream(); // will no-op if already started
  }, [latestRequest, startStream, stopStream]);

  // cleanup on provider unmount
  useEffect(() => {
    return () => stopStream();
  }, [stopStream]);

  return (
    <FramesContext
      value={{ frames, setFrames, resetFrames, isStreamActive, startStream }}
    >
      {children}
    </FramesContext>
  );
};

export const useFrames = (): FramesContextType => {
  const context = useContext(FramesContext);
  if (!context)
    throw new Error("useFrames must be used within a FramesProvider");
  return context;
};
