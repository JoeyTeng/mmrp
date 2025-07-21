"use client";
import { Metrics } from "@/types/metrics";
import React, { createContext, useContext, useState } from "react";

type VideoMetricsContextType = {
  metrics: Metrics[];
  currentFrame: number;
  setMetrics: React.Dispatch<React.SetStateAction<Metrics[]>>;
  setCurrentFrame: React.Dispatch<React.SetStateAction<number>>;
};

const VideoMetricsContext = createContext<VideoMetricsContextType | undefined>(
  undefined,
);

export const useVideoMetrics = () => {
  const context = useContext(VideoMetricsContext);
  if (!context)
    throw new Error("useVideoMetrics must be used within VideoMetricsProvider");
  return context;
};

export const VideoMetricsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [metrics, setMetrics] = useState<Metrics[]>([]);
  const [currentFrame, setCurrentFrame] = useState(0);

  return (
    <VideoMetricsContext.Provider
      value={{ metrics, currentFrame, setMetrics, setCurrentFrame }}
    >
      {children}
    </VideoMetricsContext.Provider>
  );
};
