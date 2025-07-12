"use client";

import React from "react";
import VideoPlayer, { PlayerHandle } from "./VideoPlayer";
import FrameStreamPlayer from "./FrameStreamPlayer";
import { VideoType, ViewOptions } from "./types";

type UnifiedPlayerProps = {
  view: ViewOptions;
  type: VideoType;
  videoRefs?: React.RefObject<HTMLVideoElement | null>[];
  canvasRefs?: React.RefObject<HTMLCanvasElement | null>[];
  containerRef: React.RefObject<HTMLDivElement | null>;
  showSource?: boolean;
  getSourceLabel?: (frame: number) => string;
  ref?: React.RefObject<PlayerHandle | null>;
};

const UnifiedPlayer = ({
  view,
  type,
  videoRefs,
  canvasRefs,
  containerRef,
  showSource,
  getSourceLabel,
  ref,
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
      view={view}
      canvasRefs={canvasRefs!}
      showSource={showSource}
      getSourceLabel={getSourceLabel}
      onFullscreen={handleFullscreen}
    />
  );
};

export default UnifiedPlayer;
