'use client';

import { PauseIcon, PlayIcon, StepBack, StepForward, Volume2, VolumeX } from 'lucide-react';
import React, { useRef, useState } from 'react';

const FRAME_RATE = 30;
const FRAME_DURATION = 1 / FRAME_RATE;

const InterleavingFrames = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const handlePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const stepFrame = (direction = 1) => {
    const video = videoRef.current;
    if (!video) return;

    video.pause();
    const nextTime = Math.max(0, Math.min(duration, video.currentTime + direction * FRAME_DURATION));
    video.currentTime = nextTime;
    setCurrentTime(nextTime);
    setIsPlaying(false);
  };

  const onSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const time = parseFloat(e.target.value);
    video.currentTime = time;
    setCurrentTime(time);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
    setDuration(videoRef.current.duration || 0);
  };

  const currentFrame = Math.floor(currentTime * FRAME_RATE);
  const currentSource = currentFrame % 2 === 0 ? 'Video A' : 'Video B';
  const totalFrames = Math.floor(duration * FRAME_RATE);

  return (
    <div className='relative h-full w-full flex flex-col'>
      <div className='absolute top-2 left-3 text-sm text-gray-600 px-2 py-1 rounded z-10'>
        Source: {currentSource}
      </div>

      <div className='flex flex-1 justify-center items-center w-full'>
        <video
          ref={videoRef}
          src='/example-video.mp4'
          className='w-1/2 h-full object-contain bg-red'
          onTimeUpdate={handleTimeUpdate}
          controls={false}
        />
      </div>

      <div className='flex items-center justify-between bg-white px-4 py-3 border-t border-gray-300 w-full'>
        <div className='flex items-center justify-between bg-white'>
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
      </div>
    </div>
  );
};

export default InterleavingFrames;