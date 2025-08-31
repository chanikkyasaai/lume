import { User } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserCardProps {
  isSpeaking: boolean;
  isDimmed: boolean;
  transcript?: string;
  className?: string;
}

const UserCard = ({ isSpeaking, isDimmed, transcript, className }: UserCardProps) => {
  return (
    <div className={cn(
      "bg-glass-primary backdrop-blur-glass border border-border rounded-2xl p-4 sm:p-6 transition-all duration-500",
      "hover:shadow-glow hover:border-glow-primary/50",
      isDimmed && "opacity-40 scale-95",
      isSpeaking && "ring-2 ring-glow-accent/50 shadow-glow-accent",
      className
    )}>
      {/* User Avatar */}
      <div className="flex items-center justify-center mb-4">
        <div className={cn(
          "relative w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 transition-all duration-300",
          "bg-gradient-to-br from-glow-accent/20 to-glow-primary/20 border-glow-accent/30",
          isSpeaking && "border-glow-accent shadow-lg shadow-glow-accent/30"
        )}>
          <div className="absolute inset-2 rounded-full bg-glass-secondary/60 backdrop-blur-sm flex items-center justify-center">
            <User className={cn(
              "w-6 h-6 sm:w-8 sm:h-8 transition-colors duration-300",
              isSpeaking ? "text-glow-accent" : "text-foreground-muted"
            )} />
          </div>
          
          {/* Speaking indicator ring */}
          {isSpeaking && (
            <div className="absolute -inset-1 rounded-full border-2 border-glow-accent/40 animate-pulse" />
          )}
        </div>
      </div>

      {/* User Info */}
      <div className="text-center mb-4">
        <h3 className="text-lg sm:text-xl font-quicksand font-semibold text-foreground mb-1">
          You
        </h3>
        <p className="text-xs sm:text-sm text-foreground-muted font-author">
          Participant
        </p>
      </div>

      {/* Speaking Status */}
      <div className="h-6 flex items-center justify-center mb-4">
        {isSpeaking ? (
          <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-glow-accent/20 border border-glow-accent/30">
            <div className="w-2 h-2 bg-glow-accent rounded-full animate-pulse" />
            <span className="text-xs font-author text-glow-accent">Speaking</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-glass-secondary/40">
            <div className="w-2 h-2 bg-foreground-muted/50 rounded-full" />
            <span className="text-xs font-author text-foreground-muted">Listening</span>
          </div>
        )}
      </div>

      {/* Previous Speech/Transcript */}
      {transcript && (
        <div className="bg-glass-secondary/30 rounded-lg p-3 border border-border/50">
          <p className="text-xs font-author text-foreground-muted mb-1">Previous response:</p>
          <p className="text-sm font-quicksand text-foreground leading-relaxed">
            "{transcript}"
          </p>
        </div>
      )}
    </div>
  );
};

export default UserCard;
