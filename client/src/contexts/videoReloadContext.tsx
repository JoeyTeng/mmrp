"use client";

import { createContext, useContext, useState, ReactNode, useRef } from "react";
import type { PipelineResponse } from "@/types/pipeline";
import { useVideoMetrics } from "./VideoMetricsContext";

type VideoReloadContextType = {
  triggerReload: (res: PipelineResponse) => void;
  latestResponse: PipelineResponse | null;
  isProcessing: boolean;
  setIsProcessing: (value: boolean) => void;
  isProcessingError: boolean;
  setError: (value: boolean) => void;
  getLatestVideoUrl: (video: "left" | "right") => string | undefined;
  setLatestVideoUrl: (video: "left" | "right", url: string) => void;
};

const VideoReloadContext = createContext<VideoReloadContextType | undefined>(
  undefined,
);

export const useVideoReload = () => {
  const ctx = useContext(VideoReloadContext);
  if (!ctx) throw new Error("VideoReloadContext missing");
  return ctx;
};

export const VideoReloadProvider = ({ children }: { children: ReactNode }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isProcessingError, setError] = useState(false);
  const [latestResponse, setLatestResponse] = useState<PipelineResponse | null>(
    null,
  );
  const { setMetrics, setCurrentFrame } = useVideoMetrics();

  const latestVideoUrlsRef = useRef<Partial<Record<"left" | "right", string>>>(
    {},
  );
  const getLatestVideoUrl = (video: "right" | "left") => {
    return latestVideoUrlsRef.current[video];
  };

  const setLatestVideoUrl = (video: "left" | "right", url: string) => {
    const oldUrl = latestVideoUrlsRef.current[video];
    if (oldUrl && oldUrl !== url) {
      URL.revokeObjectURL(oldUrl);
    }
    latestVideoUrlsRef.current[video] = url;
    console.info(getLatestVideoUrl("left"));
  };

  const triggerReload = (res: PipelineResponse) => {
    setLatestResponse(res);
    setCurrentFrame(0);
    setMetrics(res.metrics);
  };

  return (
    <VideoReloadContext
      value={{
        triggerReload,
        latestResponse,
        isProcessing,
        setIsProcessing,
        isProcessingError,
        setError,
        getLatestVideoUrl,
        setLatestVideoUrl,
      }}
    >
      {children}
    </VideoReloadContext>
  );
};
