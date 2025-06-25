"use client";

import React, {
  useState,
  useImperativeHandle,
  forwardRef,
  useEffect,
} from "react";
import PlayerControls from "./PlayerControls";

type Props = {
  videoRefs: React.RefObject<HTMLVideoElement | null>[];
  containerRef: React.RefObject<HTMLDivElement | null>;
  showSource?: boolean;
  getSourceLabel?: (frame: number) => string;
  frameRate?: number;
};

export type PlayerHandle = {
  handleTimeUpdate: () => void;
};

const VideoPlayer = forwardRef<PlayerHandle, Props>(
  (
    {
      videoRefs,
      containerRef,
      showSource = false,
      getSourceLabel,
      frameRate = 30,
    },
    ref,
  ) => {
    const FRAME_DURATION = 1 / frameRate;
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    const mainVideo = videoRefs[0]?.current;

    useImperativeHandle(ref, () => ({
      handleTimeUpdate,
    }));

    useEffect(() => {
      if (!mainVideo) return;
      const onEnded = () => setIsPlaying(false);
      mainVideo.addEventListener("ended", onEnded);
      return () => {
        mainVideo.removeEventListener("ended", onEnded);
      };
    }, [videoRefs]);

    const handleTimeUpdate = () => {
      const mainVideo = videoRefs[0].current;
      if (mainVideo) {
        setCurrentTime(mainVideo.currentTime);
        setDuration(mainVideo.duration || 0);
      }
    };

    const handlePlayPause = () => {
      if (isPlaying) {
        videoRefs.forEach((ref) => ref.current?.pause());
        setIsPlaying(false);
      } else {
        videoRefs.forEach((ref) => {
          const video = ref.current;
          if (!video) return;
          const playPromise = video.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => setIsPlaying(true))
              .catch((error) => {
                console.warn("Play was interrupted:", error);
                setIsPlaying(false);
              });
          } else {
            setIsPlaying(!video.paused && !video.ended && video.readyState > 2);
          }
        });
      }
    };

    const handleMuteToggle = () => {
      if (mainVideo) {
        mainVideo.muted = !isMuted;
        setIsMuted(!isMuted);
      }
    };

    const handleStepFrame = (direction: number) => {
      if (!mainVideo) return;
      videoRefs.forEach((ref) => ref.current?.pause());
      const nextTime = Math.max(
        0,
        Math.min(duration, currentTime + direction * FRAME_DURATION),
      );
      videoRefs.forEach((ref) => {
        const video = ref.current;
        if (video) video.currentTime = nextTime;
      });
      setCurrentTime(nextTime);
      setIsPlaying(false);
    };

    const handleSliderChange = (value: number) => {
      videoRefs.forEach((ref) => {
        if (ref.current) {
          ref.current.currentTime = value;
        }
      });
      setCurrentTime(value);
    };

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

    const currentFrame = Math.floor(currentTime * frameRate);
    const totalFrames = Math.floor(duration * frameRate);
    const sourceLabel = getSourceLabel?.(currentFrame);

    return (
      <PlayerControls
        currentFrame={currentFrame}
        totalFrames={totalFrames}
        isPlaying={isPlaying}
        showMute={true}
        isMuted={isMuted}
        onPlayPause={handlePlayPause}
        onStepFrame={handleStepFrame}
        onMuteToggle={handleMuteToggle}
        onSliderChange={handleSliderChange}
        onFullscreen={handleFullscreen}
        showSource={showSource}
        sourceLabel={sourceLabel}
        sliderValue={currentTime}
        sliderMax={duration}
        sliderStep={FRAME_DURATION}
      />
    );
  },
);
VideoPlayer.displayName = "Player";

export default VideoPlayer;
