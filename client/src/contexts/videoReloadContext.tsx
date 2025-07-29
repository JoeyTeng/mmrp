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
  getLatestVideoInfo: (video: "left" | "right") => {
    url: string;
    size: number;
  };
  setLatestVideoInfo: (
    video: "left" | "right",
    url: string,
    size?: number,
  ) => void;
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

  const latestVideoInfoRef = useRef<
    Record<"left" | "right", { url: string; size: number }>
  >({ left: { url: "", size: 0 }, right: { url: "", size: 0 } });
  const getLatestVideoInfo = (video: "right" | "left") => {
    return latestVideoInfoRef.current[video];
  };

  const setLatestVideoInfo = (
    video: "left" | "right",
    url: string,
    size?: number,
  ) => {
    const oldUrl = latestVideoInfoRef.current[video].url;
    if (oldUrl && oldUrl !== url) {
      URL.revokeObjectURL(oldUrl);
    }
    latestVideoInfoRef.current[video].url = url;
    if (size) {
      latestVideoInfoRef.current[video].size = size;
    } else {
      latestVideoInfoRef.current[video].size = 0;
    }
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
        getLatestVideoInfo,
        setLatestVideoInfo,
      }}
    >
      {children}
    </VideoReloadContext>
  );
};
