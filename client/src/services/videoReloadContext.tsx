"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type VideoReloadContextType = {
  triggerReload: () => void;
  reloadKey: number;
  isProcessing: boolean;
  setIsProcessing: (value: boolean) => void;
  isProcessingError: boolean;
  setError: (value: boolean) => void;
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
  const [reloadKey, setReloadKey] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isProcessingError, setError] = useState(false);

  const triggerReload = () => setReloadKey(Date.now());

  return (
    <VideoReloadContext.Provider
      value={{
        reloadKey,
        triggerReload,
        isProcessing,
        setIsProcessing,
        isProcessingError,
        setError,
      }}
    >
      {children}
    </VideoReloadContext.Provider>
  );
};
