"use client";

import { useRef } from "react";
import Player, { PlayerHandle } from "./Player";

const SideBySide = () => {
  const videoARef = useRef<HTMLVideoElement>(null);
  const videoBRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<PlayerHandle>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full flex flex-col bg-black"
    >
      <div className="flex flex-1 justify-center items-center">
        <video
          ref={videoARef}
          src="/example-video.mp4"
          className="w-1/2 h-full object-contain"
          onTimeUpdate={() => playerRef.current?.handleTimeUpdate()}
        />
        <video
          ref={videoBRef}
          src="/example-video-filter.mp4"
          className="w-1/2 h-full object-contain"
          muted
        />
      </div>
      <Player
        ref={playerRef}
        videoRefs={[videoARef, videoBRef]}
        containerRef={containerRef}
      />
    </div>
  );
};

export default SideBySide;
