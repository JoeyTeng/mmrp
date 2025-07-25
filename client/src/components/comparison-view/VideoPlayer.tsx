"use client";

import React, {
  useState,
  useImperativeHandle,
  forwardRef,
  useEffect,
} from "react";
import PlayerControls from "./PlayerControls";
import { useVideoMetrics } from "@/contexts/VideoMetricsContext";

type Props = {
  videoRefs: React.RefObject<HTMLVideoElement | null>[];
  showSource?: boolean;
  getSourceLabel?: (frame: number) => string;
  frameRate?: number;
  onFullscreen: () => void;
};

export type PlayerHandle = {
  handleTimeUpdate: () => void;
};

const VideoPlayer = forwardRef<PlayerHandle, Props>(
  (
    {
      videoRefs,
      showSource = false,
      getSourceLabel,
      frameRate = 30,
      onFullscreen,
    },
    ref,
  ) => {
    const FRAME_DURATION = 1 / frameRate;
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    const mainVideo = videoRefs[0]?.current;
    const { setCurrentFrame, currentFrame } = useVideoMetrics(); // Frame index in range [0, frames.length)

    useImperativeHandle(ref, () => ({
      handleTimeUpdate,
    }));

    // Pause playback when main video ends
    useEffect(() => {
      if (!mainVideo) return;
      const onEnded = () => setIsPlaying(false);
      mainVideo.addEventListener("ended", onEnded);
      return () => {
        mainVideo.removeEventListener("ended", onEnded);
      };
    }, [mainVideo]);

    // Update time and corresponding frame based on playback
    const updateTimeAndFrame = (currentTime: number) => {
      setCurrentTime(currentTime);
      setCurrentFrame(Math.floor(currentTime * frameRate));
    };

    // Handle time update triggered externally
    const handleTimeUpdate = () => {
      const mainVideo = videoRefs[0].current;
      if (mainVideo) {
        updateTimeAndFrame(mainVideo.currentTime);
        setDuration(mainVideo.duration || 0);
      }
    };

    // Handle play/pause
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

    // Toggle mute state
    const handleMuteToggle = () => {
      if (mainVideo) {
        mainVideo.muted = !isMuted;
        setIsMuted(!isMuted);
      }
    };

    // Step forward/backward by delta frames
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
      updateTimeAndFrame(nextTime);
      setIsPlaying(false);
    };

    // Handle slider movement
    const handleSliderChange = (value: number) => {
      videoRefs.forEach((ref) => {
        if (ref.current) {
          ref.current.currentTime = value;
        }
      });
      updateTimeAndFrame(value);
    };

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
        onFullscreen={onFullscreen}
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
