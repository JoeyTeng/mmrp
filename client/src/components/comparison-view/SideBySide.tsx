"use client";

import { useState, useRef } from "react";
import Player, { PlayerHandle } from "./Player";

const SideBySide = () => {
  const [isLoading, setIsLoading] = useState(true);

  const videoARef = useRef<HTMLVideoElement>(null);
  const videoBRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<PlayerHandle>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const getVideo = (name: string) => {
    return `/${encodeURIComponent(name)}.mp4`;
  };

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full flex flex-col bg-black"
    >
      <div className="relative flex flex-1 justify-center items-center">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black bg-opacity-60">
            <div className="h-10 w-10 border-4 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <video
          ref={videoARef}
          src={getVideo("example-video.mp4")}
          className="w-1/2 h-full object-contain"
          onTimeUpdate={() => playerRef.current?.handleTimeUpdate()}
          onLoadStart={() => setIsLoading(true)}
          onCanPlay={() => setIsLoading(false)}
        />
        <video
          ref={videoBRef}
          src={getVideo("example-video-filter.mp4")}
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
