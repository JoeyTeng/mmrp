"use client";

import React, {
  useState,
  useImperativeHandle,
  forwardRef,
  useEffect,
} from "react";
import PlayerControls from "./PlayerControls";
import { useVideoMetrics } from "@/contexts/VideoMetricsContext";
import { ViewOptions } from "./types";

type Props = {
  view: ViewOptions;
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
      view,
      videoRefs,
      showSource = false,
      getSourceLabel,
      frameRate = 29.97,
      onFullscreen,
    },
    ref,
  ) => {
    const FRAME_DURATION = 1 / frameRate;
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [index, setIndex] = useState(0); // index [0, frames.length) in Side-by-side, [0, 2 * frames.length) in Interleaving frames

    const mainVideo = videoRefs[0]?.current;
    const { setCurrentFrame, currentFrame } = useVideoMetrics(); // Frame index in range [0, frames.length)

    useImperativeHandle(ref, () => ({
      handleTimeUpdate,
    }));

    // Sync duration and pause state when video metadata or end event fires
    useEffect(() => {
      if (!mainVideo) return;
      const onEnded = () => setIsPlaying(false);

      const handleLoadedMetadata = () => {
        setDuration(mainVideo.duration || 0);
      };

      mainVideo.addEventListener("ended", onEnded);
      mainVideo.addEventListener("loadedmetadata", handleLoadedMetadata);

      return () => {
        mainVideo.removeEventListener("ended", onEnded);
        mainVideo.removeEventListener("loadedmetadata", handleLoadedMetadata);
      };
    }, [mainVideo]);

    // Update time and corresponding frame based on playback
    const updateTimeAndFrame = (time: number) => {
      setCurrentTime(time);
      setCurrentFrame(
        view === ViewOptions.Interleaving
          ? Math.floor(Math.floor(time * frameRate) / 2)
          : Math.floor(time * frameRate),
      );
      setIndex(Math.floor(time * frameRate));
    };

    // Handle time update triggered externally
    const handleTimeUpdate = () => {
      const mainVideo = videoRefs[0].current;
      if (mainVideo) {
        updateTimeAndFrame(mainVideo.currentTime);
        setDuration(mainVideo.duration || 0);
      }
    };

    // Snap playback to the middle of the frame
    const snapToFrameMiddleTime = (time: number) => {
      const frameIndex = Math.floor(time * frameRate);
      const middleTime = frameIndex / frameRate + FRAME_DURATION / 2;

      videoRefs.forEach((ref) => {
        if (ref.current) {
          ref.current.currentTime = middleTime;
        }
      });

      updateTimeAndFrame(middleTime);
      return middleTime;
    };

    // Handle play/pause
    const handlePlayPause = () => {
      if (isPlaying) {
        videoRefs.forEach((ref) => ref.current?.pause());
        setIsPlaying(false);
        snapToFrameMiddleTime(currentTime);
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
      snapToFrameMiddleTime(nextTime);
      setIsPlaying(false);
    };

    // Handle slider movement
    const handleSliderChange = (value: number) => {
      snapToFrameMiddleTime(value);
    };

    const totalFrames =
      view === ViewOptions.Interleaving
        ? Math.floor(Math.floor(duration * frameRate) / 2)
        : Math.floor(duration * frameRate);
    const sourceLabel = getSourceLabel?.(index);

    return (
      <PlayerControls
        currentFrame={currentFrame + 1}
        totalFrames={totalFrames + 1}
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
