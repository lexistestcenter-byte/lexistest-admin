"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Play, Pause, Square, Volume2 } from "lucide-react";

interface AudioPlayerProps {
  src: string;
  variant?: "compact" | "default";
  autoPlay?: boolean;
  className?: string;
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function AudioPlayer({
  src,
  variant = "default",
  autoPlay = false,
  className,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Reset state when src changes
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setIsLoaded(false);
    setHasError(false);
  }, [src]);

  // Bind audio element events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoaded(true);
    };
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onEnded = () => setIsPlaying(false);
    const onError = () => {
      setHasError(true);
      setIsPlaying(false);
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);

    // 메타데이터가 이미 로드된 경우 (캐시 등) 즉시 처리
    if (audio.readyState >= 1) {
      onLoadedMetadata();
    }

    return () => {
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
    };
  }, [src]);

  // autoPlay 처리: isLoaded 되면 자동 재생
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !autoPlay || !isLoaded) return;
    audio.play().catch(() => {/* 브라우저 autoplay 정책에 의해 차단될 수 있음 */});
  }, [autoPlay, isLoaded]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
  }, [isPlaying]);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    setCurrentTime(0);
    setIsPlaying(false);
  }, []);

  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const audio = audioRef.current;
      if (!audio || !isLoaded) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const newTime = ratio * duration;
      audio.currentTime = newTime;
      setCurrentTime(newTime);
    },
    [isLoaded, duration]
  );

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const isCompact = variant === "compact";

  if (hasError) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-md bg-red-50 text-red-500 text-xs",
          isCompact ? "h-8 px-3" : "h-10 px-4",
          className
        )}
      >
        오디오를 불러올 수 없습니다.
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md",
        isCompact ? "h-8" : "h-10",
        className
      )}
    >
      {/* Hidden audio element */}
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Volume icon — default variant only */}
      {!isCompact && (
        <Volume2 className="h-4 w-4 text-sky-600 flex-shrink-0" />
      )}

      {/* Play / Pause */}
      <Button
        type="button"
        variant="ghost"
        size={isCompact ? "icon-xs" : "icon-sm"}
        onClick={togglePlay}
        disabled={!isLoaded}
        className="flex-shrink-0"
      >
        {isPlaying ? (
          <Pause className={isCompact ? "h-3 w-3" : "h-4 w-4"} />
        ) : (
          <Play className={isCompact ? "h-3 w-3" : "h-4 w-4"} />
        )}
      </Button>

      {/* Stop */}
      <Button
        type="button"
        variant="ghost"
        size={isCompact ? "icon-xs" : "icon-sm"}
        onClick={stop}
        disabled={!isLoaded}
        className="flex-shrink-0"
      >
        <Square className={isCompact ? "h-3 w-3" : "h-3.5 w-3.5"} />
      </Button>

      {/* Seek bar */}
      <div
        className="flex-1 h-1.5 bg-primary/20 rounded-full cursor-pointer relative group"
        onClick={handleSeek}
      >
        <div
          className="absolute inset-y-0 left-0 bg-primary rounded-full transition-[width] duration-100"
          style={{ width: `${progress}%` }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 h-3 w-3 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ left: `calc(${progress}% - 6px)` }}
        />
      </div>

      {/* Time display */}
      <span
        className={cn(
          "tabular-nums text-muted-foreground flex-shrink-0 whitespace-nowrap",
          isCompact ? "text-[10px]" : "text-xs"
        )}
      >
        {formatTime(currentTime)}{isCompact ? "/" : " / "}{formatTime(duration)}
      </span>
    </div>
  );
}
