"use client";

import React from "react";
import VideoPlayer, { PlayerHandle } from "./VideoPlayer";
import FrameStreamPlayer from "./FrameStreamPlayer";
import { VideoType } from "./types";

type UnifiedPlayerProps = {
  type: VideoType;
  videoRefs?: React.RefObject<HTMLVideoElement | null>[];
  containerRef: React.RefObject<HTMLDivElement | null>;
  showSource?: boolean;
  getSourceLabel?: (frame: number) => string;
  ref?: React.RefObject<PlayerHandle | null>;
  isFullscreen?: boolean;
};

const UnifiedPlayer = ({
  type,
  videoRefs,
  containerRef,
  showSource,
  getSourceLabel,
  ref,
  isFullscreen,
}: UnifiedPlayerProps) => {
  if (type === VideoType.Video && videoRefs) {
    return (
      <VideoPlayer
        videoRefs={videoRefs}
        containerRef={containerRef}
        showSource={showSource}
        getSourceLabel={getSourceLabel}
        ref={ref}
      />
    );
  }

  return (
    <FrameStreamPlayer
      containerRef={containerRef}
      showSource={showSource}
      getSourceLabel={getSourceLabel}
      isFullscreen={isFullscreen}
    />
  );
};

export default UnifiedPlayer;
