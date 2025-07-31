"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from "react";
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
  const [videoInfo, setVideoInfo] = useState<
    Record<"left" | "right", { url: string; size: number }>
  >({ left: { url: "", size: 0 }, right: { url: "", size: 0 } });

  const { setMetrics, setCurrentFrame } = useVideoMetrics();

  const getLatestVideoInfo = (video: "right" | "left") => {
    return videoInfo[video];
  };
  const setLatestVideoInfo = useCallback(
    (video: "left" | "right", url: string, size?: number) => {
      setVideoInfo((prev) => {
        const oldUrl = prev[video].url;
        if (oldUrl && oldUrl !== url) {
          URL.revokeObjectURL(oldUrl);
        }
        return { ...prev, [video]: { ...prev[video], url, size: size ?? 0 } };
      });
    },
    [],
  );

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
