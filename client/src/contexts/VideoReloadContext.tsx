"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from "react";
import type { PipelineRequest, PipelineResponse } from "@/types/pipeline";
import { useVideoMetrics } from "./VideoMetricsContext";
import { VideoType, ViewOptions } from "@/components/comparison-view/types";

type VideoReloadContextType = {
  triggerReload: (res: PipelineResponse) => void;
  triggerWebSocketConnection: (req: PipelineRequest) => void;
  latestResponse: PipelineResponse | null;
  latestRequest: PipelineRequest | null;
  isProcessing: boolean;
  setIsProcessing: (value: boolean) => void;
  isProcessingError: boolean;
  setError: (value: boolean) => void;
  getLatestVideoInfo: (video: "left" | "right" | "interleaved") => {
    url: string;
    size: number;
  };
  setLatestVideoInfo: (
    video: "left" | "right" | "interleaved",
    url: string,
    size?: number,
  ) => void;
  activeVideoType: VideoType;
  selectedVideoType: VideoType;
  setSelectedVideoType: React.Dispatch<React.SetStateAction<VideoType>>;
  view: ViewOptions;
  setView: React.Dispatch<React.SetStateAction<ViewOptions>>;
  handlePipelineRun: () => void;
  isPipelineRun: boolean;
  videoShapesMismatch: boolean;
  setVideoShapesMismatch: React.Dispatch<React.SetStateAction<boolean>>;
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
  const [latestRequest, setLatestRequest] = useState<PipelineRequest | null>(
    null,
  );
  const [videoInfo, setVideoInfo] = useState<
    Record<"left" | "right" | "interleaved", { url: string; size: number }>
  >({
    left: { url: "", size: 0 },
    right: { url: "", size: 0 },
    interleaved: { url: "", size: 0 },
  });
  const [isPipelineRun, setIsPipelineRun] = useState(false);

  const { setMetrics, setCurrentFrame } = useVideoMetrics();

  const getLatestVideoInfo = (video: "right" | "left" | "interleaved") => {
    return videoInfo[video];
  };
  const setLatestVideoInfo = useCallback(
    (video: "left" | "right" | "interleaved", url: string, size?: number) => {
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
  const [view, setView] = useState(ViewOptions.SideBySide);
  const [selectedVideoType, setSelectedVideoType] = useState(VideoType.Video);
  const [activeVideoType, setActiveVideoType] = useState(VideoType.Video);
  const [videoShapesMismatch, setVideoShapesMismatch] = useState(false);

  const triggerReload = (res: PipelineResponse) => {
    setLatestResponse(res);
    setCurrentFrame(0);
    setMetrics(res.metrics);
    console.log(res);
    if (res.interleaved === "") {
      setVideoShapesMismatch(true);
      setView(ViewOptions.SideBySide);
    }
  };

  const triggerWebSocketConnection = (req: PipelineRequest) => {
    setLatestRequest(req);
  };

  const handlePipelineRun = () => {
    setMetrics([]);
    setActiveVideoType(selectedVideoType);
    setIsPipelineRun(true);
    setVideoShapesMismatch(false);
  };

  return (
    <VideoReloadContext
      value={{
        triggerReload,
        triggerWebSocketConnection,
        latestResponse,
        latestRequest,
        isProcessing,
        setIsProcessing,
        isProcessingError,
        setError,
        getLatestVideoInfo,
        setLatestVideoInfo,
        activeVideoType,
        selectedVideoType,
        setSelectedVideoType,
        view,
        setView,
        handlePipelineRun,
        isPipelineRun,
        videoShapesMismatch,
        setVideoShapesMismatch,
      }}
    >
      {children}
    </VideoReloadContext>
  );
};
