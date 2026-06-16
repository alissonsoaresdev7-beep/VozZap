import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { cn, formatDuration } from '@/lib/utils';

interface AudioPlayerProps {
  src: string;
  title?: string;
  duration?: number;
  compact?: boolean;
  className?: string;
  onPlay?: () => void;
}

export function AudioPlayer({ src, title, duration = 0, compact = false, className, onPlay }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setTotalDuration(audio.duration || duration);
    const handleEnded = () => setIsPlaying(false);
    const handleWaiting = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [duration]);

  const togglePlay = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      try {
        setIsLoading(true);
        await audio.play();
        setIsPlaying(true);
        onPlay?.();
      } catch {
        setIsPlaying(false);
      } finally {
        setIsLoading(false);
      }
    }
  }, [isPlaying, onPlay]);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  }, [isMuted]);

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const bar = progressRef.current;
    const audio = audioRef.current;
    if (!bar || !audio) return;
    const rect = bar.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    audio.currentTime = ratio * (audio.duration || 0);
  }, []);

  const progress = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  if (compact) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <audio ref={audioRef} src={src} preload="metadata" />
        <button
          onClick={togglePlay}
          className="flex-shrink-0 w-8 h-8 rounded-full bg-[#25D366] flex items-center justify-center text-white hover:bg-[#1db954] transition-colors"
          aria-label={isPlaying ? 'Pausar áudio' : 'Reproduzir áudio'}
          disabled={isLoading}
        >
          {isLoading ? (
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : isPlaying ? (
            <Pause size={14} />
          ) : (
            <Play size={14} className="ml-0.5" />
          )}
        </button>
        <div className="flex-1 flex flex-col gap-1 min-w-0">
          {title && <span className="text-xs font-medium truncate text-foreground">{title}</span>}
          <div
            ref={progressRef}
            className="h-1.5 bg-muted rounded-full cursor-pointer relative overflow-hidden"
            onClick={handleProgressClick}
            role="slider"
            aria-label="Progresso do áudio"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress)}
          >
            <div
              className="absolute left-0 top-0 h-full bg-[#25D366] rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
          {formatDuration(currentTime)} / {formatDuration(totalDuration)}
        </span>
      </div>
    );
  }

  return (
    <div className={cn('bg-muted rounded-xl p-4', className)}>
      <audio ref={audioRef} src={src} preload="metadata" />

      <div className="flex items-center gap-4">
        {/* Botão Play/Pause */}
        <button
          onClick={togglePlay}
          disabled={isLoading}
          className={cn(
            'flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-white transition-all',
            'bg-[#25D366] hover:bg-[#1db954] active:scale-95 shadow-md',
            isLoading && 'opacity-70'
          )}
          aria-label={isPlaying ? 'Pausar áudio' : 'Reproduzir áudio'}
        >
          {isLoading ? (
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : isPlaying ? (
            <Pause size={20} />
          ) : (
            <Play size={20} className="ml-1" />
          )}
        </button>

        {/* Controles centrais */}
        <div className="flex-1 min-w-0">
          {/* Barra de progresso */}
          <div
            ref={progressRef}
            className="h-2 bg-border rounded-full cursor-pointer relative overflow-hidden group"
            onClick={handleProgressClick}
            role="slider"
            aria-label="Progresso do áudio"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress)}
          >
            <div
              className="absolute left-0 top-0 h-full bg-[#25D366] rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
            {/* Indicador de posição */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#25D366] shadow border-2 border-white opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: `calc(${progress}% - 6px)` }}
            />
          </div>
          {/* Tempos */}
          <div className="flex justify-between mt-1">
            <span className="text-xs text-muted-foreground tabular-nums">{formatDuration(currentTime)}</span>
            <span className="text-xs text-muted-foreground tabular-nums">{formatDuration(totalDuration)}</span>
          </div>
        </div>

        {/* Botão mudo */}
        <button
          onClick={toggleMute}
          className="flex-shrink-0 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-border transition-colors"
          aria-label={isMuted ? 'Ativar som' : 'Silenciar'}
        >
          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
      </div>

      {/* Ondas de áudio animadas quando tocando */}
      {isPlaying && (
        <div className="flex items-center justify-center gap-0.5 mt-3 h-4" aria-hidden="true">
          {Array.from({ length: 20 }).map((_, i) => {
            // Gera altura consistente baseada no índice usando seeded "random"
            const seed = (i * 12.9898) % 1;
            const pseudoRandom = Math.sin(seed) * 0.5 + 0.5;
            const height = 20 + pseudoRandom * 80; // Entre 20% e 100%
            return (
              <div
                key={`wave-${i}`}
                className="w-0.5 bg-[#25D366] rounded-full animate-pulse-green"
                style={{
                  height: `${height}%`,
                  animationDelay: `${i * 0.05}s`,
                  minHeight: '4px',
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
