"use client";

import { useEffect, useRef, useState } from "react";
import Player, { PlayerHandle } from "./Player";

const InterleavingFrames = () => {
  const playerRef = useRef<PlayerHandle>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative w-full flex flex-col ${isFullscreen ? "h-screen bg-black" : "h-full"}`}
    >
      <div
        className={`flex justify-center items-center w-full ${isFullscreen ? "h-[calc(100vh-50px)]" : "h-full"}`}
      >
        <video
          ref={videoRef}
          src="/example-video.mp4"
          className={`object-contain bg-black ${
            isFullscreen ? "w-full h-full" : "w-1/2 h-full"
          }`}
          onTimeUpdate={() => playerRef.current?.handleTimeUpdate()}
          controls={false}
        />
      </div>

      <Player
        ref={playerRef}
        videoRefs={[videoRef]}
        showSource
        getSourceLabel={(frame) => (frame % 2 === 0 ? "Video A" : "Video B")}
        containerRef={containerRef}
      />
    </div>
  );
};

export default InterleavingFrames;
