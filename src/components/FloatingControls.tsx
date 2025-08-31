import { Pause, Play, LogOut, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface FloatingControlsProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onExit: () => void;
  onTimerUpdate?: (seconds: number) => void;
  disabled?: boolean;
}

const FloatingControls: React.FC<FloatingControlsProps> = ({
  isPlaying,
  onTogglePlay,
  onExit,
  onTimerUpdate,
  disabled = false,
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPlaying) {
      interval = setInterval(() => {
        setElapsedSeconds(prev => {
          const newValue = prev + 1;
          // Use setTimeout to avoid calling onTimerUpdate during render
          setTimeout(() => onTimerUpdate?.(newValue), 0);
          return newValue;
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isPlaying, onTimerUpdate]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed bottom-4 sm:bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-glass-primary backdrop-blur-glass border border-border/50 shadow-glass">
        {/* Timer */}
        <div className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-glass-secondary">
          <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-glow-primary" />
          <span className="text-xs sm:text-sm font-mono text-foreground font-medium">
            {formatTime(elapsedSeconds)}
          </span>
        </div>

        {/* Divider */}
        <div className="w-px h-6 sm:h-8 bg-border/50" />

        {/* Play/Pause Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onTogglePlay}
          disabled={disabled}
          className={cn(
            "p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all duration-300",
            "hover:scale-105 hover:shadow-glow",
            disabled && "opacity-50 cursor-not-allowed",
            isPlaying
              ? "bg-glow-primary/20 text-glow-primary border border-glow-primary/30"
              : "bg-glass-secondary text-foreground-muted hover:text-foreground"
          )}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 sm:w-5 sm:h-5" />
          ) : (
            <Play className="w-4 h-4 sm:w-5 sm:h-5 ml-0.5" />
          )}
        </Button>

        {/* Divider */}
        <div className="w-px h-6 sm:h-8 bg-border/50" />

        {/* Exit Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onExit}
          className={cn(
            "p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all duration-300",
            "text-destructive/80 hover:text-destructive",
            "hover:bg-destructive/10 hover:scale-105 hover:shadow-glow-accent",
            "border border-transparent hover:border-destructive/30"
          )}
        >
          <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
        </Button>
      </div>

      {/* Floating background glow */}
      <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-glow opacity-20 animate-glow-pulse -z-10" />
    </div>
  );
};

export default FloatingControls;