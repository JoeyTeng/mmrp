"use client";

import {
  PlayArrowOutlined as PlayIcon,
  PauseCircleOutline as PauseIcon,
  Fullscreen as Maximize,
  VolumeUpOutlined as Volume2,
  VolumeOffOutlined as VolumeX,
  ArrowLeftOutlined as StepBack,
  ArrowRightOutlined as StepForward,
} from "@mui/icons-material";

type Props = {
  currentFrame: number;
  totalFrames: number;
  isPlaying: boolean;
  showMute: boolean;
  isMuted: boolean;
  showSource?: boolean;
  sourceLabel?: string;
  sliderValue: number;
  sliderMax: number;
  sliderStep: number;
  onPlayPause: () => void;
  onStepFrame: (dir: number) => void;
  onMuteToggle: () => void;
  onSliderChange: (val: number) => void;
  onFullscreen: () => void;
};

const PlayerControls = ({
  currentFrame,
  totalFrames,
  isPlaying,
  showMute,
  isMuted,
  showSource,
  sourceLabel,
  sliderValue,
  sliderMax,
  sliderStep,
  onPlayPause,
  onStepFrame,
  onMuteToggle,
  onSliderChange,
  onFullscreen,
}: Props) => {
  return (
    <div className="flex items-center justify-between bg-white px-4 py-3 border-t border-gray-300 w-full">
      <div className="flex items-center">
        <button
          onClick={() => onStepFrame(-1)}
          className="text-gray-800 hover:text-black cursor-pointer px-2"
        >
          <StepBack />
        </button>
        <button
          onClick={onPlayPause}
          className="text-gray-800 hover:text-black cursor-pointer px-2"
        >
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>
        <button
          onClick={() => onStepFrame(1)}
          className="text-gray-800 hover:text-black cursor-pointer px-2"
        >
          <StepForward />
        </button>
        {showMute && (
          <button
            onClick={onMuteToggle}
            className="text-gray-800 hover:text-black cursor-pointer px-2"
          >
            {isMuted ? <VolumeX /> : <Volume2 />}
          </button>
        )}
      </div>
      <input
        type="range"
        min={0}
        max={sliderMax}
        step={sliderStep}
        value={sliderValue}
        onChange={(e) => onSliderChange(Number(e.target.value))}
        className="flex-1 mx-4 accent-gray-700 cursor-pointer"
      />
      <span className="text-sm text-gray-600 w-50 text-center">
        Frame: {currentFrame} / {totalFrames}
      </span>
      {showSource && sourceLabel && (
        <span className="text-sm text-gray-600 w-30 px-2">
          Source: {sourceLabel}
        </span>
      )}
      <button
        onClick={onFullscreen}
        className="ml-4 text-gray-800 hover:text-black cursor-pointer"
      >
        <Maximize />
      </button>
    </div>
  );
};

export default PlayerControls;
