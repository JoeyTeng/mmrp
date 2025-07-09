"use client";

import React from "react";
import VideoPlayer, { PlayerHandle } from "./VideoPlayer";
import FrameStreamPlayer from "./FrameStreamPlayer";
import { FrameData, VideoType } from "./types";

type UnifiedPlayerProps = {
  type: VideoType;
  videoRefs?: React.RefObject<HTMLVideoElement | null>[];
  canvasRefs?: React.RefObject<HTMLCanvasElement | null>[];
  frames: FrameData[];
  containerRef: React.RefObject<HTMLDivElement | null>;
  showSource?: boolean;
  getSourceLabel?: (frame: number) => string;
  ref?: React.RefObject<PlayerHandle | null>;
  isStreamActive?: boolean;
};

const UnifiedPlayer = ({
  type,
  videoRefs,
  canvasRefs,
  frames,
  containerRef,
  showSource,
  getSourceLabel,
  ref,
  isStreamActive,
}: UnifiedPlayerProps) => {
  const handleFullscreen = () => {
    const elem = containerRef.current;
    if (!elem) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      elem.requestFullscreen().catch((err) => {
        console.error("Failed to enter fullscreen:", err);
      });
    }
  };

  if (type === VideoType.Video && videoRefs) {
    return (
      <VideoPlayer
        videoRefs={videoRefs}
        showSource={showSource}
        getSourceLabel={getSourceLabel}
        onFullscreen={handleFullscreen}
        ref={ref}
      />
    );
  }

  return (
    <FrameStreamPlayer
      canvasRefs={canvasRefs!}
      frames={frames}
      showSource={showSource}
      getSourceLabel={getSourceLabel}
      onFullscreen={handleFullscreen}
      isStreamActive={isStreamActive}
    />
  );
};

export default UnifiedPlayer;
