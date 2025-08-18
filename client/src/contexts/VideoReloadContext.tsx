"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useEffect,
} from "react";
import type { PipelineResponse } from "@/types/pipeline";
import { useVideoMetrics } from "./VideoMetricsContext";
import { VideoInfo, VideoMap, VideoRecordMap } from "@/types/video";
import { useVideo } from "./VideoContext";
import { useModules } from "@/hooks/useModule";
import { useReactFlow } from "@xyflow/react";
import { ModuleClass, ModuleParameterName } from "@/types/module";

type VideoReloadContextType = {
  triggerReload: (res: PipelineResponse) => void;
  latestResponse: PipelineResponse | null;
  isProcessing: boolean;
  setIsProcessing: (value: boolean) => void;
  isProcessingError: boolean;
  setError: (value: boolean) => void;
  getLatestVideoInfo: (video: VideoMap) => {
    name: string;
    url: string;
    size: number;
  };
  setLatestVideoInfo: (videos: VideoRecordMap | null) => void;
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
  const [latestResponse, setPipelineResponse] =
    useState<PipelineResponse | null>(null);
  const [videoInfo, setVideoInfo] = useState<Record<VideoMap, VideoInfo>>({
    left: { url: "", name: "", size: 0 },
    right: { url: "", name: "", size: 0 },
  });
  const { setNodes } = useReactFlow();

  const { videos, loadVideo } = useVideo();
  const { setMetrics, setCurrentFrame } = useVideoMetrics();
  const { modules } = useModules();

  useEffect(() => {
    if (latestResponse?.right) {
      const loadProcessedVideo = async () => {
        await loadVideo("right", latestResponse.right, true);
      };
      loadProcessedVideo();
    }
  }, [latestResponse, loadVideo]);

  const getLatestVideoInfo = useCallback(
    (video: VideoMap) => {
      return videoInfo[video];
    },
    [videoInfo],
  );

  const setLatestVideoInfo = useCallback((videos: VideoRecordMap | null) => {
    if (!videos) return;

    (Object.entries(videos) as [VideoMap, VideoInfo][]).forEach(
      ([side, info]) => {
        if (!info) return;

        setVideoInfo((prev) => {
          const oldUrl = prev[side]?.url;
          if (oldUrl && oldUrl !== info.url) {
            URL.revokeObjectURL(oldUrl);
          }
          return {
            ...prev,
            [side]: {
              ...prev[side],
              name: info.name,
              url: info.url,
              size: info.size ?? 0,
            },
          };
        });
      },
    );
  }, []);

  const syncModules = useCallback(() => {
    setNodes((prevNodes) =>
      prevNodes.map((node) => {
        if (node.data?.moduleClass === ModuleClass.VIDEO_SOURCE) {
          const updatedModule = modules.find(
            (m) => m.data.moduleClass === node.data.moduleClass,
          );
          if (!updatedModule) return node;

          return {
            ...node,
            data: {
              ...node.data,
              parameters: updatedModule.data.parameters.map((param) =>
                param.name === ModuleParameterName.VIDEO_SOURCE_PATH
                  ? {
                      ...param,
                      metadata: {
                        ...param.metadata,
                        value: videos.left?.name,
                      },
                    }
                  : param,
              ),
            },
          };
        }
        return node;
      }),
    );
  }, [modules, videos, setNodes]);

  useEffect(() => {
    setLatestVideoInfo(videos);
    syncModules();
  }, [videos, setLatestVideoInfo, syncModules]);

  const triggerReload = (res: PipelineResponse) => {
    setPipelineResponse(res);
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
