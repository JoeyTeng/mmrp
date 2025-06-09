'use client'

import { useRef, useState, useEffect } from 'react';
import { PlayIcon, PauseIcon, Maximize } from 'lucide-react';

const SideBySide = () => {
    const videoARef = useRef<HTMLVideoElement>(null);
    const videoBRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);

    // play/pause
    const handlePlayPause = () => {
    if (!videoARef.current || !videoBRef.current) return;

    if (isPlaying) {
        videoARef.current.pause();
        videoBRef.current.pause();
    } else {
        videoARef.current.play();
        videoBRef.current.play();
    }

    setIsPlaying(!isPlaying);
    };

    // Manual seek
    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoARef.current && videoBRef.current) {
        videoARef.current.currentTime = time;
        videoBRef.current.currentTime = time;
        setProgress(time);
    }
    };

    // Update timeline of video live
    useEffect(() => {
    const interval = setInterval(() => {
        if (videoARef.current && isPlaying) {
        setProgress(videoARef.current.currentTime);
        setDuration(videoARef.current.duration || 0);
        }
    }, 100);

    return () => clearInterval(interval);
    }, [isPlaying]);

    // Update full screen state to handle container height
    useEffect(() => {
    const onFullscreenChange = () => {
        setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => {
        document.removeEventListener('fullscreenchange', onFullscreenChange);
    };
    }, []);

    // Change full screen mode for videos
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

    return (
        <div
            ref={containerRef}
            className={`relative ${isFullscreen ? 'h-screen' : 'h-full'} w-full flex flex-col`}
        >
        <div className='flex flex-1 justify-center items-center'>
            <video
            ref={videoARef}
            src='/example-video.mp4'
            className='w-1/2 h-full object-contain bg-red'
            />
            <video
            ref={videoBRef}
            src='/example-video-filter.mp4'
            className='w-1/2 h-full object-contain bg-red'
            />
        </div>

        {/* Controls */}
        <div
            className={`${
                isFullscreen ? 'absolute bottom-0 left-0 z-50' : ''
            } flex items-center justify-between bg-white px-4 py-3 border-t border-gray-300 w-full`}
            >
            <button onClick={handlePlayPause} className='text-gray-800 hover:text-black cursor-pointer'>
            {isPlaying ? <PauseIcon size={24} /> : <PlayIcon size={24} />}
            </button>
            <input
            type='range'
            min={0}
            max={duration}
            step={0.01}
            value={progress}
            onChange={handleSeek}
            className='flex-1 mx-4 accent-gray-700 cursor-pointer'
            />
            <span className='text-sm text-gray-600 w-24 text-right'>
            {Math.floor(progress)}s / {Math.floor(duration)}s
            </span>
            <button onClick={handleFullscreen} className='ml-4 text-gray-800 hover:text-black cursor-pointer'>
            <Maximize size={22} />
            </button>
        </div>
      </div>
    );

};

export default SideBySide;