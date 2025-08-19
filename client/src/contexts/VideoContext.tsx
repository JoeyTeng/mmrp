"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { VideoMap, VideoRecordMap } from "@/types/video";
import { useVideoService } from "@/services/videoService";
import axios from "axios";

type VideoContextType = {
  videos: VideoRecordMap;
  isLoading: boolean;
  error: string | null;
  loadVideo: (side: VideoMap, name: string, output: boolean) => Promise<void>;
  uploadVideo: (file: File) => Promise<void>;
  clearVideo: (side: VideoMap) => void;
};

const VideoContext = createContext<VideoContextType | undefined>(undefined);

export const useVideo = () => {
  const ctx = useContext(VideoContext);
  if (!ctx) throw new Error("VideoContext missing");
  return ctx;
};

export const VideoProvider = ({ children }: { children: ReactNode }) => {
  const [videos, setVideos] = useState<VideoRecordMap>({
    left: null,
    right: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { loadVideo: loadVideoService, uploadVideo: uploadVideoService } =
    useVideoService();

  const clearVideo = useCallback((side?: VideoMap) => {
    setVideos((prev) => {
      const newVideos = { ...prev };
      if (!side || side === "left") {
        if (newVideos.left?.url) URL.revokeObjectURL(newVideos.left.url);
        newVideos.left = null;
      }
      if (!side || side === "right") {
        if (newVideos.right?.url) URL.revokeObjectURL(newVideos.right.url);
        newVideos.right = null;
      }
      return newVideos;
    });
  }, []);

  const loadVideo = useCallback(
    async (side: VideoMap, name: string, output: boolean) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await loadVideoService({ name, output });
        setVideos((prev) => ({ ...prev, [side]: response }));
      } catch (e) {
        let errorMessage = `Failed to load video:${(e instanceof Error ? e.message : "Unknown error")}`;
        if (axios.isAxiosError(e)) {
          const data = e.response?.data;
          if (data instanceof Blob) {
            try {
              const text = await data.text();
              errorMessage = `Failed to load video: ${text}`;
              try {
                const json = JSON.parse(text);
                errorMessage = `Failed to load video: ${json?.detail || text}`;
              } catch {
                // If JSON parsing fails, we already have the text version
              }
            } catch {
              errorMessage = 'Failed to load video: Server returned invalid response';
            }
          }
        }
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [loadVideoService],
  );

  const uploadVideo = useCallback(
    async (file: File) => {
      try {
        setIsLoading(true);
        setError(null);
        // Clear right video before loading new one
        clearVideo("right");
        const response = await uploadVideoService(file);
        await loadVideo("left", response.filename, false);
      } catch (e) {
        setError(`Failed to load video:${(e instanceof Error ? e.message : "Unknown error")}`);
        throw e;
      } finally {
        setIsLoading(false);
      }
    },
    [uploadVideoService, loadVideo, clearVideo],
  );

  return (
    <VideoContext
      value={{
        videos,
        isLoading,
        error,
        loadVideo,
        uploadVideo,
        clearVideo,
      }}
    >
      {children}
    </VideoContext>
  );
};
