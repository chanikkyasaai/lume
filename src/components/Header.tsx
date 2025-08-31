import { Clock, Users, MessageSquare, Briefcase, User } from "lucide-react";
import SettingsModal from "./SettingsModal";

interface HeaderProps {
  topic?: string;
  duration?: number;
  currentMessage?: number;
  totalMessages?: number;
  sessionType?: 'discussion' | 'debate' | 'interview';
  sessionMode?: 'auto' | 'live';
  isLiveMode?: boolean;
  isUserTurn?: boolean;
  onConfigurationChange?: (isValid: boolean) => void;
}

const Header = ({ 
  topic, 
  duration, 
  currentMessage, 
  totalMessages, 
  sessionType = 'discussion',
  sessionMode = 'auto',
  isLiveMode = false,
  isUserTurn = false,
  onConfigurationChange
}: HeaderProps) => {
  
  const getSessionIcon = () => {
    switch (sessionType) {
      case 'debate':
        return MessageSquare;
      case 'interview':
        return Briefcase;
      default:
        return Users;
    }
  };

  const getSessionTitle = () => {
    // If no topic is provided, this is the main page
    if (!topic) {
      return "Murf Coding Challenge 4";
    }
    
    const baseTitle = sessionType.charAt(0).toUpperCase() + sessionType.slice(1);
    if (isLiveMode) {
      return `${baseTitle} - Live Mode`;
    }
    // For discussions, don't mention "Auto Mode" since it's the only mode
    if (sessionType === 'discussion') {
      return baseTitle;
    }
    return `${baseTitle} - Auto Mode`;
  };

  const SessionIcon = getSessionIcon();
  const isMainPage = !topic;
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16">
      {/* Glass background with grain texture */}
      <div className="absolute inset-0 bg-glass-primary backdrop-blur-glass border-b border-border">
        {/* Grain texture overlay */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3Ccircle cx='27' cy='7' r='1'/%3E%3Ccircle cx='47' cy='7' r='1'/%3E%3Ccircle cx='17' cy='27' r='1'/%3E%3Ccircle cx='37' cy='27' r='1'/%3E%3Ccircle cx='7' cy='47' r='1'/%3E%3Ccircle cx='27' cy='47' r='1'/%3E%3Ccircle cx='47' cy='47' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        />
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-glow-primary/10 via-transparent to-glow-secondary/10" />
      </div>

      {/* Content */}
      <div className="relative flex items-center justify-between h-full px-3 sm:px-6">
        <div className="flex items-center space-x-2 sm:space-x-4">
          <div>
            <h1 className="text-lg sm:text-2xl font-clash font-semibold text-foreground">
              Lume
              <span className="text-xs sm:text-sm font-author align-super ml-1 text-foreground-muted">
                by chane
              </span>
            </h1>
            {/* Session Type and Mode Indicator - only show on council pages */}
            {!isMainPage && (
              <div className="flex items-center space-x-2">
                <SessionIcon className="w-3 h-3 text-glow-primary" />
                <span className="text-[10px] sm:text-xs text-foreground-muted font-author">
                  {getSessionTitle()}
                </span>
                {isLiveMode && isUserTurn && (
                  <>
                    <span className="text-[10px] text-foreground-muted">•</span>
                    <User className="w-3 h-3 text-glow-accent" />
                    <span className="text-[10px] text-glow-accent font-author">Your Turn</span>
                  </>
                )}
              </div>
            )}
            {/* Main page subtitle */}
            {isMainPage && (
              <div className="flex items-center space-x-2">
                <span className="text-[10px] sm:text-xs text-foreground-muted font-author">
                  {getSessionTitle()}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4">
          <div className="hidden sm:flex items-center space-x-4">
            <div className="text-right">
              {topic ? (
                <>
                  <h2 className="text-lg font-quicksand font-medium text-foreground">
                    {sessionType === 'discussion' ? 'Council Discussion' :
                     sessionType === 'debate' ? 'AI Debate' :
                     'AI Interview'}
                  </h2>
                  <p className="text-xs font-britney text-foreground-subtle">
                    "{topic}"
                    {!isLiveMode && duration && (
                      <span> • {duration} minutes</span>
                    )}
                    {currentMessage && totalMessages && !isLiveMode && (
                      <span className="ml-2">• Progress: {currentMessage}/{totalMessages}</span>
                    )}
                    {isLiveMode && (
                      <span> • Interactive Session</span>
                    )}
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-lg font-quicksand font-medium text-foreground">
                    {getSessionTitle()}
                  </h2>
                  <p className="text-xs font-britney text-foreground-subtle">
                    {sessionType === 'discussion' ? 'Council in session • 4 members active' :
                     sessionType === 'debate' ? 'One-on-one debate session' :
                     'AI interview in progress'}
                  </p>
                </>
              )}
            </div>
            <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-glass-secondary border border-border/50">
              <div className="w-2 h-2 rounded-full bg-glow-accent animate-pulse" />
              <span className="text-sm font-author text-foreground-muted">Online</span>
            </div>
            {/* Settings Modal - only show on main page */}
            {isMainPage && (
              <SettingsModal onConfigurationChange={onConfigurationChange} />
            )}
          </div>
          
          {/* Mobile version */}
          <div className="sm:hidden flex items-center space-x-2">
            {topic && (
              <div className="text-right mr-2">
                <p className="text-xs font-quicksand font-medium text-foreground truncate max-w-32">
                  {topic.length > 20 ? topic.substring(0, 20) + "..." : topic}
                </p>
                <p className="text-[10px] font-britney text-foreground-subtle">
                  {duration}m {currentMessage && totalMessages && `• ${currentMessage}/${totalMessages}`}
                </p>
              </div>
            )}
            <div className="flex items-center space-x-1 px-2 py-1 rounded-full bg-glass-secondary border border-border/50">
              <div className="w-1.5 h-1.5 rounded-full bg-glow-accent animate-pulse" />
              <span className="text-xs font-author text-foreground-muted">Online</span>
            </div>
            {/* Settings Modal - only show on main page (mobile) */}
            {isMainPage && (
              <SettingsModal onConfigurationChange={onConfigurationChange} />
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;