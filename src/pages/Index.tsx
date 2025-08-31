import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Clock, Users, MessageSquare, Briefcase, Mic, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import Sidebar from "@/components/AppSidebar";
import { ReplaySessionModal } from "@/components/ReplaySessionModal";
import { type CouncilSession } from "@/lib/history";

type SessionType = 'discussion' | 'debate' | 'interview';
type SessionMode = 'auto' | 'live';

const Index = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [interviewContent, setInterviewContent] = useState("");
  const [duration, setDuration] = useState("5");
  const [sessionType, setSessionType] = useState<SessionType>('discussion');
  const [sessionMode, setSessionMode] = useState<SessionMode>('auto');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSession, setSelectedSession] = useState<CouncilSession | null>(null);
  const [showReplayModal, setShowReplayModal] = useState(false);
  const [hasValidApiKeys, setHasValidApiKeys] = useState(false);

  const handleSummonCouncil = async () => {
    if (!query.trim()) return;
    if (sessionType === 'interview' && !interviewContent.trim()) return;
    
    setIsLoading(true);
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Pass the session data to the council page
    navigate("/council", { 
      state: { 
        topic: query.trim(),
        duration: parseInt(duration),
        sessionType,
        sessionMode,
        interviewContent: sessionType === 'interview' ? interviewContent.trim() : undefined
      }
    });
  };

  const handleSessionSelect = (session: CouncilSession) => {
    setSelectedSession(session);
    setShowReplayModal(true);
  };

  const handleReplaySession = (session: CouncilSession) => {
    setShowReplayModal(false);
    navigate("/council", {
      state: {
        topic: session.topic,
        duration: session.selectedDuration,
        replaySession: session
      }
    });
  };

  const handleNewSession = () => {
    // Just close any modals and stay on home page
    setShowReplayModal(false);
    setSelectedSession(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSummonCouncil();
    }
  };

  const getSessionTypeInfo = () => {
    switch (sessionType) {
      case 'discussion':
        return {
          title: 'Discussion',
          description: '4 AI experts collaborate on your topic',
          icon: Users,
          modes: ['auto']
        };
      case 'debate':
        return {
          title: 'Debate',
          description: '1-on-1 debate with an AI opponent',
          icon: MessageSquare,
          modes: ['live']
        };
      case 'interview':
        return {
          title: 'Interview',
          description: 'AI interviewer based on job description',
          icon: Briefcase,
          modes: ['live']
        };
    }
  };

  const isValidSubmission = () => {
    if (!query.trim()) return false;
    if (sessionType === 'interview' && !interviewContent.trim()) return false;
    return true;
  };

  return (
    <div className="min-h-screen bg-gradient-modern grain-overlay relative overflow-hidden">
      
      {/* Sidebar */}
      <Sidebar 
        onSessionSelect={handleSessionSelect}
        onNewSession={handleNewSession}
      />

      {/* Main Content - with left margin to account for collapsed sidebar on desktop only */}
      <div className="flex flex-col items-center justify-center px-4 md:px-8 lg:px-12 relative min-h-screen ml-0 md:ml-12">
        
        {/* Glass overlay effects */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-grain opacity-40" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-glow-primary/6 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-glow-secondary/8 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-glow-accent/5 rounded-full blur-2xl animate-float" style={{ animationDelay: '4s' }} />
        </div>

        <Header onConfigurationChange={setHasValidApiKeys} />

      <main className="flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 pt-16">
        <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in">
          
          {/* Hero Section */}
          <div className="space-y-6">
            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-clash font-semibold text-foreground leading-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-glow-primary via-glow-accent to-glow-secondary">
                Lume
              </span>
              <span className="text-sm font-author align-super ml-2 text-foreground-muted">
                by chane
              </span>
              <br />
              <span className="text-foreground-muted text-2xl sm:text-4xl lg:text-5xl font-quicksand font-medium">
                AI Collective Intelligence
              </span>
            </h1>

            <p className="text-lg sm:text-xl font-author text-foreground-subtle max-w-2xl mx-auto leading-relaxed">
              Harness the power of multiple AI perspectives. Choose your session type and engage with specialized AI advisors.
            </p>
          </div>

          {/* Session Type Selection */}
          <div className="space-y-6 animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <div className="max-w-3xl mx-auto">
              <Label className="text-lg font-quicksand text-foreground mb-4 block">Choose Session Type</Label>
              <RadioGroup 
                value={sessionType} 
                onValueChange={(value) => {
                  setSessionType(value as SessionType);
                  // Reset mode for debate/interview (only live mode available)
                  if (value === 'debate' || value === 'interview') {
                    setSessionMode('live');
                  }
                }}
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
              >
                {(['discussion', 'debate', 'interview'] as SessionType[]).map((type) => {
                  const info = getSessionTypeInfo();
                  const typeInfo = type === 'discussion' 
                    ? { title: 'Discussion', description: '4 AI experts collaborate on your topic', icon: Users }
                    : type === 'debate'
                    ? { title: 'Debate', description: '1-on-1 debate with an AI opponent', icon: MessageSquare }
                    : { title: 'Interview', description: 'AI interviewer based on job description', icon: Briefcase };
                  
                  const Icon = typeInfo.icon;
                  
                  return (
                    <div key={type} className="relative">
                      <RadioGroupItem value={type} id={type} className="peer sr-only" />
                      <Label
                        htmlFor={type}
                        className={`flex flex-col items-center p-6 rounded-2xl border-2 transition-all duration-300 cursor-pointer hover:scale-105 ${
                          sessionType === type
                            ? 'border-glow-primary bg-glass-primary backdrop-blur-glass shadow-glow'
                            : 'border-border/30 bg-glass-secondary backdrop-blur-subtle hover:border-border/50'
                        }`}
                      >
                        <Icon className={`w-8 h-8 mb-3 ${sessionType === type ? 'text-glow-primary' : 'text-foreground-muted'}`} />
                        <span className={`text-lg font-quicksand font-medium mb-2 ${sessionType === type ? 'text-foreground' : 'text-foreground-muted'}`}>
                          {typeInfo.title}
                        </span>
                        <span className={`text-sm font-author text-center ${sessionType === type ? 'text-foreground-subtle' : 'text-foreground-subtle/70'}`}>
                          {typeInfo.description}
                        </span>
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>
            </div>
          </div>

          {/* Input Section */}
          <div className="space-y-6 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <div className="max-w-2xl mx-auto space-y-4">
              {/* Main Topic Input */}
              <div className="relative">
                <Input
                  type="text"
                  placeholder={
                    sessionType === 'discussion' 
                      ? "What challenge would you like the council to address?"
                      : sessionType === 'debate'
                      ? "What topic would you like to debate?"
                      : "What position are you applying for?"
                  }
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full h-16 px-6 text-lg font-author rounded-2xl bg-glass-primary backdrop-blur-glass border border-border/50 text-foreground placeholder:text-foreground-subtle shadow-glass focus:shadow-glow-lg focus:border-glow-primary/50 transition-all duration-300"
                />
                
                {/* Input glow effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-glow opacity-20 animate-glow-pulse -z-10" />
              </div>

              {/* Interview Content Input */}
              {sessionType === 'interview' && (
                <div className="relative">
                  <Textarea
                    placeholder="Paste your job description and resume content here..."
                    value={interviewContent}
                    onChange={(e) => setInterviewContent(e.target.value)}
                    className="w-full min-h-32 p-4 text-base font-author rounded-2xl bg-glass-primary backdrop-blur-glass border border-border/50 text-foreground placeholder:text-foreground-subtle shadow-glass focus:shadow-glow-lg focus:border-glow-primary/50 transition-all duration-300 resize-none"
                  />
                  
                  {/* Input glow effect */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-glow opacity-20 animate-glow-pulse -z-10" />
                </div>
              )}
            </div>

            {/* Duration Selection (only for discussions) */}
            {sessionType === 'discussion' && (
              <div className="flex justify-center">
                <div className="flex items-center space-x-4 px-6 py-3 rounded-xl bg-glass-secondary backdrop-blur-subtle border border-border/30">
                  <Clock className="w-5 h-5 text-glow-primary" />
                  <span className="font-author text-foreground-muted">Council Duration:</span>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger className="w-24 h-10 bg-glass-primary border-border/50 text-foreground font-quicksand">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-glass-primary backdrop-blur-glass border-border/50">
                      <SelectItem value="2" className="font-quicksand">2 min</SelectItem>
                      <SelectItem value="5" className="font-quicksand">5 min</SelectItem>
                      <SelectItem value="10" className="font-quicksand">10 min</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Start Button */}
            <Button
              onClick={handleSummonCouncil}
              disabled={!isValidSubmission() || isLoading || !hasValidApiKeys}
              className="group relative h-14 px-8 text-lg font-quicksand font-medium rounded-2xl bg-gradient-primary hover:shadow-glow-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed shadow-glow"
            >
              <span className="flex items-center space-x-3">
                {isLoading ? (
                  <>
                    <div className="w-6 h-6 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    <span>Starting Session...</span>
                  </>
                ) : (
                  <>
                    <span>
                      {sessionType === 'discussion' 
                        ? 'Summon Council'
                        : sessionType === 'debate'
                        ? 'Start Debate'
                        : 'Start Interview'
                      }
                    </span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                  </>
                )}
              </span>
              
              {/* Button glow effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-glow opacity-30 animate-glow-pulse group-hover:opacity-50 transition-opacity duration-300 -z-10" />
            </Button>
          </div>

          {/* Feature Pills */}
          <div className="flex flex-wrap justify-center gap-4 mt-12 animate-slide-up" style={{ animationDelay: "0.4s" }}>
            {sessionType === 'discussion' && [
              { text: "4 AI Specialists" },
              { text: "Real-time Discussion" },
              { text: "Collective Wisdom" }
            ].map(({ text }) => (
              <div 
                key={text}
                className="px-6 py-3 rounded-full bg-glass-secondary backdrop-blur-subtle border border-border/30 text-foreground-muted hover:text-foreground transition-all duration-300 hover:scale-105"
              >
                <span className="font-britney text-sm">{text}</span>
              </div>
            ))}
            
            {sessionType === 'debate' && [
              { text: "1-on-1 Debate" },
              { text: "Voice & Text Input" },
              { text: "AI Opponent" }
            ].map(({ text }) => (
              <div 
                key={text}
                className="px-6 py-3 rounded-full bg-glass-secondary backdrop-blur-subtle border border-border/30 text-foreground-muted hover:text-foreground transition-all duration-300 hover:scale-105"
              >
                <span className="font-britney text-sm">{text}</span>
              </div>
            ))}
            
            {sessionType === 'interview' && [
              { text: "AI Interviewer" },
              { text: "Job-Specific Questions" },
              { text: "Practice Interview" }
            ].map(({ text }) => (
              <div 
                key={text}
                className="px-6 py-3 rounded-full bg-glass-secondary backdrop-blur-subtle border border-border/30 text-foreground-muted hover:text-foreground transition-all duration-300 hover:scale-105"
              >
                <span className="font-britney text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Replay Session Modal */}
      <ReplaySessionModal
        isOpen={showReplayModal}
        session={selectedSession}
        onClose={() => setShowReplayModal(false)}
        onReplay={handleReplaySession}
      />
    </div>
  </div>
  );
};

export default Index;
