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
import { useReactFlow } from "@xyflow/react";
import { Module, ModuleClass, ModuleParameterName } from "@/types/module";
import { useModulesContext } from "./ModulesContext";

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
  syncModules: () => void;
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
  const { setModules } = useModulesContext();

  useEffect(() => {
    if (latestResponse?.right) {
      const loadProcessedVideo = async () => {
        await loadVideo("right", latestResponse.right, true);
      };
      loadProcessedVideo();
    }
  }, [latestResponse, loadVideo]);

  const updateModuleParam = useCallback(
    (modules: Module[]): Module[] => {
      const currentVideoName = videos.left?.name;
      if (!currentVideoName) return modules;

      return modules.map((module) => {
        if (module.data?.moduleClass === ModuleClass.VIDEO_SOURCE) {
          return {
            ...module,
            data: {
              ...module.data,
              parameters: module.data.parameters.map((param) =>
                param.name === ModuleParameterName.VIDEO_SOURCE_PATH
                  ? {
                      ...param,
                      metadata: {
                        ...param.metadata,
                        value: currentVideoName,
                      },
                    }
                  : param,
              ),
            },
          };
        }
        return module;
      });
    },
    [videos.left?.name],
  );

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
    const currentVideoName = videos.left?.name;
    if (!currentVideoName) return;

    setNodes((prevNodes) => {
      const typNodes = prevNodes as Module[];
      return updateModuleParam(typNodes);
    });

    setModules((prevModules) => updateModuleParam(prevModules));
  }, [videos, updateModuleParam, setModules, setNodes]);

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
        syncModules,
      }}
    >
      {children}
    </VideoReloadContext>
  );
};
