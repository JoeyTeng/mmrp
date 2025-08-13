"use client";

import { FrameData } from "@/types/frame";
import React, { createContext, useContext, useState } from "react";

type FramesContextType = {
  frames: FrameData[];
  setFrames: React.Dispatch<React.SetStateAction<FrameData[]>>;
  resetFrames: () => void;
};

const FramesContext = createContext<FramesContextType | undefined>(undefined);

export const FramesProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [frames, setFrames] = useState<FrameData[]>([]);

  const resetFrames = () => setFrames([]);

  return (
    <FramesContext value={{ frames, setFrames, resetFrames }}>
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
