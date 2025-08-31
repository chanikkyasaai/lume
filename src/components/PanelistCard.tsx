import { cn } from "@/lib/utils";

// Import the 3D avatars
import athenaAvatar from "@/assets/avatar-athena.png";
import apolloAvatar from "@/assets/avatar-apollo.png";
import hermesAvatar from "@/assets/avatar-hermes.png";
import artemisAvatar from "@/assets/avatar-artemis.png";

interface PanelistCardProps {
  id: number;
  name: string;
  role: string;
  avatar: "bot" | "brain" | "cpu" | "zap";
  isSpeaking: boolean;
  isDimmed: boolean;
  transcript?: string;
}

const avatarImages = {
  brain: athenaAvatar,  // Athena - Strategic Advisor
  zap: apolloAvatar,    // Apollo - Creative Director
  cpu: hermesAvatar,    // Hermes - Data Analyst
  bot: artemisAvatar,   // Artemis - Ethics Reviewer
};

const WaveformAnimation = () => (
  <div className="flex items-end space-x-1">
    {[...Array(5)].map((_, i) => (
      <div
        key={i}
        className="w-[2px] bg-gradient-to-t from-glow-primary to-glow-secondary rounded-full animate-waveform opacity-80"
        style={{
          height: Math.random() * 12 + 6 + 'px',
          animationDelay: `${i * 0.1}s`,
          animationDuration: '1.2s'
        }}
      />
    ))}
  </div>
);

const SpeakingIndicator = () => (
  <div className="flex items-center justify-center space-x-2 sm:space-x-3 lg:space-x-4 px-2 sm:px-3 lg:px-4 py-1 sm:py-2 rounded-full bg-glass-secondary/60 backdrop-blur-sm border border-glow-primary/25">
    <div className="relative">
      <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-glow-primary rounded-full animate-pulse shadow-sm" />
      <div className="absolute inset-0 bg-glow-primary/40 rounded-full animate-ping" />
    </div>
    <WaveformAnimation />
    <span className="text-[10px] sm:text-xs font-britney text-glow-primary/90 animate-pulse tracking-wide">Speaking</span>
  </div>
);

const PanelistCard: React.FC<PanelistCardProps> = ({
  id,
  name,
  role,
  avatar,
  isSpeaking,
  isDimmed,
  transcript = "Ready to provide insights...",
}) => {
  const avatarImage = avatarImages[avatar];

  return (
    <div
      className={cn(
        "h-full flex flex-col rounded-2xl transition-all duration-700 relative overflow-hidden group",
        "bg-gradient-to-br from-background-secondary/95 to-background-tertiary/90 backdrop-blur-glass",
        "border border-border/40 shadow-xl",
        isSpeaking && "scale-[1.02] shadow-glow-lg border-glow-primary/50 bg-gradient-to-br from-background-secondary/98 to-background-tertiary/95",
        isDimmed && "opacity-50 scale-[0.98] blur-[1px]",
        !isDimmed && !isSpeaking && "hover:scale-[1.01] hover:shadow-xl hover:border-border/60"
      )}
    >
      {/* Elegant background pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)`,
          backgroundSize: '20px 20px'
        }} />
      </div>

      {/* Subtle top accent line */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 h-[1px] transition-all duration-500",
          isSpeaking
            ? "bg-gradient-to-r from-transparent via-glow-primary to-transparent opacity-100"
            : "bg-gradient-to-r from-transparent via-border to-transparent opacity-40"
        )}
      />

      {/* Avatar Section - Mobile & Desktop Optimized */}
      <div className="flex-1 flex flex-col items-center justify-center p-3 sm:p-6 lg:p-8 relative">
        {/* Avatar Container - Responsive sizing */}
        <div
          className={cn(
            "relative mb-2 sm:mb-4 lg:mb-6 rounded-xl sm:rounded-2xl overflow-hidden transition-all duration-700",
            "w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32 xl:w-40 xl:h-40", // Responsive avatar sizes
            "ring-2 ring-border/20",
            isSpeaking && "ring-3 sm:ring-4 ring-glow-primary/30 shadow-glow-lg scale-105"
          )}
        >
          {/* Avatar image */}
          <img
            src={avatarImage}
            alt={`${name} avatar`}
            className={cn(
              "w-full h-full object-cover transition-all duration-500",
              "filter brightness-90 contrast-105 saturate-110",
              isSpeaking ? "brightness-100 contrast-110 saturate-120 scale-110" : "group-hover:brightness-95"
            )}
          />
          
          {/* Overlay */}
          <div 
            className={cn(
              "absolute inset-0 transition-opacity duration-500",
              "bg-gradient-to-t from-background-secondary/60 via-transparent to-background/20",
              isSpeaking && "from-glow-primary/20 via-transparent to-glow-secondary/10"
            )}
          />
          
          {/* Speaking indicator */}
          {isSpeaking && (
            <div className="absolute top-2 right-2">
              <div className="relative">
                <div className="w-2 h-2 bg-glow-primary rounded-full animate-pulse shadow-lg" />
                <div className="absolute inset-0 bg-glow-primary/50 rounded-full animate-ping" />
              </div>
            </div>
          )}
        </div>

        {/* Name and Role - Responsive typography */}
        <div className="text-center space-y-1 sm:space-y-2 lg:space-y-3 mb-2 sm:mb-3 lg:mb-4">
          <h3 className={cn(
            "text-sm sm:text-lg lg:text-2xl xl:text-3xl font-clash font-semibold transition-all duration-500 tracking-wide",
            isSpeaking ? "text-foreground text-shadow-glow" : "text-foreground-muted group-hover:text-foreground"
          )}>
            {name}
          </h3>
          <div className="relative">
            <p className="text-[10px] sm:text-xs lg:text-sm font-quicksand font-medium text-foreground-subtle tracking-wider uppercase">
              {role}
            </p>
            {/* Elegant underline */}
            <div className={cn(
              "absolute -bottom-0.5 sm:-bottom-1 left-1/2 transform -translate-x-1/2 h-[1px] transition-all duration-500",
              "bg-gradient-to-r from-transparent via-glow-primary to-transparent",
              isSpeaking ? "w-full opacity-60" : "w-0 opacity-0 group-hover:w-3/4 group-hover:opacity-40"
            )} />
          </div>
        </div>

        {/* Speaking animation - responsive */}
        {isSpeaking && (
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4 px-2 sm:px-3 lg:px-4 py-1 sm:py-2 rounded-full bg-background-secondary/60 backdrop-blur-sm border border-glow-primary/25">
              <div className="relative">
                <div className="w-1 sm:w-1.5 lg:w-2 h-1 sm:h-1.5 lg:h-2 bg-glow-primary rounded-full animate-pulse" />
                <div className="absolute inset-0 bg-glow-primary/40 rounded-full animate-ping" />
              </div>
              <div className="flex items-end space-x-0.5 sm:space-x-1">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="w-[1px] sm:w-[2px] bg-gradient-to-t from-glow-primary to-glow-secondary rounded-full animate-waveform opacity-80"
                    style={{
                      height: (Math.random() * 6 + 3) + 'px',
                      animationDelay: `${i * 0.1}s`,
                    }}
                  />
                ))}
              </div>
              <span className="text-[8px] sm:text-xs font-britney text-glow-primary/90 animate-pulse">Speaking</span>
            </div>
          </div>
        )}
      </div>

      {/* Transcript Section - Responsive optimization */}
      <div className="flex-1 p-2 sm:p-4 lg:p-6 pt-0">
        <div
          className={cn(
            "h-full rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 transition-all duration-500 relative overflow-hidden",
            "bg-gradient-to-br from-background-secondary/90 to-background-tertiary/85",
            "border border-border/30 backdrop-blur-sm",
            isSpeaking && "border-glow-primary/35 bg-gradient-to-br from-background-secondary/95 to-background-tertiary/90 shadow-inner"
          )}
        >
          {/* Transcript content - responsive text */}
          <div className="h-full flex items-start relative">
            <p
              className={cn(
                "text-[10px] sm:text-xs lg:text-sm font-author leading-relaxed transition-all duration-500",
                "text-foreground-muted line-clamp-6 relative z-10",
                isSpeaking && "text-foreground"
              )}
            >
              {transcript}
            </p>
          </div>

          {/* Typing indicator - responsive */}
          {isSpeaking && (
            <div className="absolute bottom-2 sm:bottom-3 lg:bottom-4 right-2 sm:right-3 lg:right-4 flex items-center space-x-0.5 sm:space-x-1">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 sm:w-1.5 h-1 sm:h-1.5 bg-glow-primary/80 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Enhanced glow effect for speaking */}
      {isSpeaking && (
        <div className="absolute inset-0 rounded-2xl bg-gradient-glow opacity-10 animate-glow-pulse pointer-events-none" />
      )}
    </div>
  );
};

export default PanelistCard;