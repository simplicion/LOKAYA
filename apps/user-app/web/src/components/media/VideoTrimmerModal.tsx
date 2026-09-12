'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Play, Pause, Scissors, Check, RotateCcw, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoTrimmerModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoFile: File;
  maxDurationSeconds?: number;
  onTrimComplete: (params: { startTime: number; endTime: number; duration: number; thumbnailDataUrl?: string }) => void;
}

export function VideoTrimmerModal({
  isOpen,
  onClose,
  videoFile,
  maxDurationSeconds = 90,
  onTrimComplete,
}: VideoTrimmerModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [totalDuration, setTotalDuration] = useState<number>(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  useEffect(() => {
    if (!videoFile) return;
    const url = URL.createObjectURL(videoFile);
    setVideoUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [videoFile]);

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    const dur = videoRef.current.duration || 1;
    setTotalDuration(dur);
    setStartTime(0);
    const initialEnd = Math.min(dur, maxDurationSeconds);
    setEndTime(initialEnd);
    setCurrentTime(0);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const curr = videoRef.current.currentTime;
    setCurrentTime(curr);

    // Loop within trimmed boundary
    if (curr >= endTime) {
      videoRef.current.currentTime = startTime;
      if (!isPlaying) {
        videoRef.current.pause();
      }
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      if (videoRef.current.currentTime >= endTime || videoRef.current.currentTime < startTime) {
        videoRef.current.currentTime = startTime;
      }
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleStartChange = (val: number) => {
    const newStart = Math.min(val, endTime - 1);
    const maxEnd = Math.min(totalDuration, newStart + maxDurationSeconds);
    setStartTime(newStart);
    if (endTime > maxEnd) {
      setEndTime(maxEnd);
    }
    if (videoRef.current) {
      videoRef.current.currentTime = newStart;
    }
  };

  const handleEndChange = (val: number) => {
    const minEnd = startTime + 1;
    const maxEnd = startTime + maxDurationSeconds;
    const newEnd = Math.min(Math.max(val, minEnd), Math.min(totalDuration, maxEnd));
    setEndTime(newEnd);
    if (videoRef.current) {
      videoRef.current.currentTime = newEnd;
    }
  };

  const handleApplyPreset = (durationSecs: number) => {
    const newEnd = Math.min(totalDuration, startTime + durationSecs);
    setEndTime(newEnd);
    if (videoRef.current) {
      videoRef.current.currentTime = startTime;
    }
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleSave = () => {
    // Generate a thumbnail frame from the trimmed start point
    if (videoRef.current) {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth || 640;
        canvas.height = videoRef.current.videoHeight || 1136;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          const thumbDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          onTrimComplete({
            startTime,
            endTime,
            duration: Math.round(endTime - startTime),
            thumbnailDataUrl: thumbDataUrl
          });
          onClose();
          return;
        }
      } catch (err) {
        console.warn('Trim thumbnail notice:', err);
      }
    }

    onTrimComplete({
      startTime,
      endTime,
      duration: Math.round(endTime - startTime),
    });
    onClose();
  };

  if (!isOpen) return null;

  const trimmedLength = Math.max(0, endTime - startTime);
  const isOverRecommended = trimmedLength > maxDurationSeconds;

  return (
    <div className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#171717] text-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh] border border-white/10 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#FF5A36]/20 flex items-center justify-center text-[#FF5A36]">
              <Scissors className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Trim & Crop Video</h3>
              <p className="text-[11px] text-gray-400">Max recommended: {maxDurationSeconds}s</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full bg-white/10 text-gray-400 hover:text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Player */}
        <div className="p-4 flex-1 flex flex-col items-center justify-center">
          <div className="relative w-full aspect-[9/16] max-h-[340px] bg-black rounded-2xl overflow-hidden flex items-center justify-center border border-white/10 shadow-lg">
            {videoUrl && (
              <video
                ref={videoRef}
                src={videoUrl}
                playsInline
                muted
                onLoadedMetadata={handleLoadedMetadata}
                onTimeUpdate={handleTimeUpdate}
                className="w-full h-full object-cover"
              />
            )}

            {/* Play / Pause overlay */}
            <button
              onClick={togglePlay}
              className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-transform"
            >
              {isPlaying ? <Pause className="w-6 h-6 fill-white" /> : <Play className="w-6 h-6 fill-white ml-0.5" />}
            </button>

            {/* Live timestamp overlay */}
            <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-bold text-white border border-white/10">
              {formatSeconds(currentTime)} / {formatSeconds(endTime)}
            </div>
          </div>
        </div>

        {/* Trimmer Controls */}
        <div className="px-5 pb-5 flex flex-col gap-4">
          {/* Quick Presets */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-medium">Quick Trim:</span>
            {[30, 60, maxDurationSeconds].map((presetSec) => (
              <button
                key={presetSec}
                onClick={() => handleApplyPreset(presetSec)}
                className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-xs font-semibold text-white/90 border border-white/10 transition-colors"
              >
                {presetSec}s
              </button>
            ))}
          </div>

          {/* Range Sliders */}
          <div className="flex flex-col gap-2 bg-white/5 p-3.5 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-gray-300">Start: {formatSeconds(startTime)}</span>
              <span className={cn(
                "px-2 py-0.5 rounded-full text-[11px]",
                isOverRecommended ? "bg-red-500/20 text-red-400" : "bg-emerald-500/20 text-emerald-400"
              )}>
                Length: {formatSeconds(trimmedLength)}
              </span>
              <span className="text-gray-300">End: {formatSeconds(endTime)}</span>
            </div>

            {/* Start Slider */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[10px] text-gray-400">
                <span>Start Point</span>
                <span>{formatSeconds(startTime)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={Math.max(1, totalDuration - 1)}
                step={0.5}
                value={startTime}
                onChange={(e) => handleStartChange(parseFloat(e.target.value))}
                className="w-full accent-[#FF5A36] h-1.5 bg-white/20 rounded-lg cursor-pointer"
              />
            </div>

            {/* End Slider */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[10px] text-gray-400">
                <span>End Point</span>
                <span>{formatSeconds(endTime)}</span>
              </div>
              <input
                type="range"
                min={1}
                max={Math.max(1, totalDuration)}
                step={0.5}
                value={endTime}
                onChange={(e) => handleEndChange(parseFloat(e.target.value))}
                className="w-full accent-[#FF5A36] h-1.5 bg-white/20 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl font-bold text-sm bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-[#FF5A36] to-[#FF8C66] text-white shadow-lg hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Use Trimmed Video</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
