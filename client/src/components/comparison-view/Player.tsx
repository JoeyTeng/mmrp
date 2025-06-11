'use client'

import React, { useState, useImperativeHandle, forwardRef } from 'react';
import { PauseIcon, PlayIcon, StepBack, StepForward, Volume2, VolumeX, Maximize } from 'lucide-react';

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

const Player = forwardRef<PlayerHandle, Props>(({
  videoRefs,
  containerRef,
  showSource = false,
  getSourceLabel,
  frameRate = 30,
}, ref) => {
  const FRAME_DURATION = 1 / frameRate;
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useImperativeHandle(ref, () => ({
    handleTimeUpdate,
  }));

  const handleTimeUpdate = () => {
    const mainVideo = videoRefs[0].current;
    if (mainVideo) {
      setCurrentTime(mainVideo.currentTime);
      setDuration(mainVideo.duration || 0);
    }
  };

  const handlePlayPause = () => {
    videoRefs.forEach((ref) => {
      const video = ref.current;
      if (!video) return;
      isPlaying ? video.pause() : video.play();
    });
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    const mainVideo = videoRefs[0].current;
    if (mainVideo) mainVideo.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const stepFrame = (direction: number) => {
    videoRefs.forEach((ref) => ref.current?.pause());
    const nextTime = Math.max(0, Math.min(duration, currentTime + direction * FRAME_DURATION));
    videoRefs.forEach((ref) => {
      const video = ref.current;
      if (video) video.currentTime = nextTime;
    });
    setCurrentTime(nextTime);
    setIsPlaying(false);
  };

  const onSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    videoRefs.forEach((ref) => {
      const video = ref.current;
      if (video) video.currentTime = time;
    });
    setCurrentTime(time);
  };

  const handleFullscreen = () => {
    const elem = containerRef.current;
    if (!elem) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      elem.requestFullscreen().catch((err) => {
        console.error('Failed to enter fullscreen:', err);
      });
    }
  };

  const currentFrame = Math.floor(currentTime * frameRate);
  const totalFrames = Math.floor(duration * frameRate);
  const sourceLabel = getSourceLabel?.(currentFrame);

  return (
    <div className='w-full flex flex-col'>
      <div className='flex items-center justify-between bg-white px-4 py-3 border-t border-gray-300 w-full'>
        <div className='flex items-center'>
          <button onClick={() => stepFrame(-1)} className='text-gray-800 hover:text-black cursor-pointer px-2'><StepBack size={24} /></button>
          <button onClick={handlePlayPause} className='text-gray-800 hover:text-black cursor-pointer px-2'>
            {isPlaying ? <PauseIcon size={24} /> : <PlayIcon size={24} />}
          </button>
          <button onClick={() => stepFrame(1)} className='text-gray-800 hover:text-black cursor-pointer px-2'><StepForward size={24} /></button>
          <button onClick={toggleMute} className='text-gray-800 hover:text-black cursor-pointer px-2' title={isMuted ? 'Unmute' : 'Mute'}>
            {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
          </button>
        </div>
        <input
          type='range'
          min={0}
          max={duration}
          step={FRAME_DURATION}
          value={currentTime}
          onChange={onSliderChange}
          className='flex-1 mx-4 accent-gray-700 cursor-pointer'
        />
        <span className='text-sm text-gray-600 w-50 text-center'>
          Frame: {currentFrame} / {totalFrames}
        </span>
        {showSource && sourceLabel && (
          <span className='text-sm text-gray-600 w-30 px-2'>
            Source: {sourceLabel}
          </span>
        )}
        <button onClick={handleFullscreen} className='ml-4 text-gray-800 hover:text-black cursor-pointer'>
          <Maximize size={22} />
        </button>
      </div>
    </div>
  );
});

export default Player;