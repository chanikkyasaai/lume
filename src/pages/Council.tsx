import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "@/components/Header";
import PanelistCard from "@/components/PanelistCard";
import UserCard from "@/components/UserCard";
import FloatingControls from "@/components/FloatingControls";
import ExitConfirmationModal from "@/components/ExitConfirmationModal";
import ChatInput from "@/components/ChatInput";
import { DiscussionEndedModal } from "@/components/DiscussionEndedModal";
import { aiCouncilService, type CouncilSession, type CouncilMessage, type SessionType, type SessionMode } from "@/services/aiCouncilService";
import { type CouncilSession as HistorySession } from "@/lib/history";

const Council = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Get session data from route state, or replay session data
  const { 
    topic, 
    duration, 
    sessionType = 'discussion', 
    sessionMode = 'auto', 
    interviewContent,
    replaySession 
  } = location.state || { 
    topic: "AI in modern society", 
    duration: 5, 
    sessionType: 'discussion' as SessionType, 
    sessionMode: 'auto' as SessionMode 
  };
  
  const [session, setSession] = useState<CouncilSession | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeSpeaker, setActiveSpeaker] = useState<number | null>(null);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [transcripts, setTranscripts] = useState<Record<number, string>>({});
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [actualDuration, setActualDuration] = useState(0);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  
  // Live mode specific states
  const [isLiveMode, setIsLiveMode] = useState(sessionMode === 'live');
  const [isUserTurn, setIsUserTurn] = useState(false);
  const [isAIGenerating, setIsAIGenerating] = useState(false);
  const [conversationStarted, setConversationStarted] = useState(false);
  const [userLastMessage, setUserLastMessage] = useState<string>('');

  // Initialize the AI council session
  useEffect(() => {
    const initializeCouncil = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        let councilSession: CouncilSession;
        
        if (replaySession) {
          // Load existing session for replay
          councilSession = await aiCouncilService.replaySession(replaySession as HistorySession);
          setIsLiveMode(false); // Replays are always in auto mode
        } else {
          // Create new session with new parameters
          councilSession = await aiCouncilService.initializeSession(
            topic, 
            duration, 
            sessionType, 
            sessionMode, 
            interviewContent
          );
          
          if (sessionMode === 'live') {
            // Generate initial content for live mode
            const initialMessages = await aiCouncilService.generateInitialLiveContent();
            councilSession.messages = initialMessages;
            
            // Generate audio for initial messages
            for (const message of initialMessages) {
              await aiCouncilService.generateMessageAudio(message);
            }
          } else {
            // Generate full content for auto mode (existing behavior)
            await aiCouncilService.startCouncil(topic, duration);
            councilSession = aiCouncilService.getCurrentSession()!;
          }
        }
        
        setSession(councilSession);
        setIsLoading(false);
        
        // Auto-start the discussion after initialization
        setTimeout(() => {
          setIsPlaying(true);
          setSessionStartTime(Date.now());
        }, 1000);
      } catch (err) {
        console.error('Failed to initialize council:', err);
        setError('Failed to initialize AI council. Please try again.');
        setIsLoading(false);
      }
    };

    initializeCouncil();
  }, [topic, duration, replaySession, sessionType, sessionMode, interviewContent]);

  // Handle user message submission
  const handleUserMessage = async (userInput: string) => {
    if (!session || !isLiveMode) return;

    setIsUserTurn(false);
    setIsAIGenerating(true);
    setUserLastMessage(userInput); // Track user's message

    try {
      // Add user message to session
      aiCouncilService.addUserMessage(userInput);
      
      // Update local state to show user message
      const userMessage = {
        panelistId: 999,
        message: userInput,
        timestamp: Date.now(),
        isUserMessage: true
      };
      
      setSession(prev => prev ? {
        ...prev,
        messages: [...prev.messages, userMessage]
      } : null);

      // Generate AI response
      const aiResponse = await aiCouncilService.generateLiveResponse();
      
      if (aiResponse) {
        // Update session with AI response
        setSession(prev => prev ? {
          ...prev,
          messages: [...prev.messages, aiResponse]
        } : null);

        // Generate audio for AI response
        await aiCouncilService.generateMessageAudio(aiResponse);
        
        setIsAIGenerating(false);
        
        // Play AI response
        setCurrentMessageIndex(session.messages.length); // Point to new AI message
        setActiveSpeaker(aiResponse.panelistId);
        
        setTranscripts(prev => ({
          ...prev,
          [aiResponse.panelistId]: aiResponse.message
        }));

        if (aiResponse.audioBase64) {
          playAudio(aiResponse.audioBase64);
        } else {
          setTimeout(() => {
            onAudioEnded();
          }, calculateSpeakingDuration(aiResponse.message));
        }
      } else {
        setIsAIGenerating(false);
        setIsUserTurn(true);
      }
    } catch (error) {
      console.error('Error handling user message:', error);
      setIsAIGenerating(false);
      setIsUserTurn(true);
    }
  };

  // Handle stopping AI generation/speech
  const handleStopAI = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsAIGenerating(false);
    setIsPlaying(false);
    setActiveSpeaker(null);
    if (isLiveMode) {
      setIsUserTurn(true);
    }
  };

  // Audio ended handler
  const onAudioEnded = () => {
    setActiveSpeaker(null);
    if (isLiveMode) {
      setIsUserTurn(true);
    } else {
      setCurrentMessageIndex(prev => prev + 1);
    }
  };

  // Play audio function
  const playAudio = (audioBase64: string) => {
    try {
      const audioBlob = new Blob([Uint8Array.from(atob(audioBase64), c => c.charCodeAt(0))], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.onended = () => {
          URL.revokeObjectURL(audioUrl);
          onAudioEnded();
        };
        audioRef.current.onerror = (error) => {
          console.error('Audio error:', error);
          URL.revokeObjectURL(audioUrl);
          // If audio fails, move to next after calculated duration
          const currentMessage = session?.messages[currentMessageIndex];
          if (currentMessage) {
            const speakingDuration = calculateSpeakingDuration(currentMessage.message);
            setTimeout(() => {
              onAudioEnded();
            }, speakingDuration);
          }
        };
        audioRef.current.play();
      }
    } catch (error) {
      console.error('Error processing audio:', error);
    }
  };

  // Play next AI message in live mode
  const playNextAIMessage = () => {
    if (!session || isUserTurn) return;

    const nextMessage = session.messages.find((msg, index) => 
      index >= currentMessageIndex && !msg.isUserMessage
    );

    if (nextMessage) {
      const messageIndex = session.messages.indexOf(nextMessage);
      setCurrentMessageIndex(messageIndex);
      setActiveSpeaker(nextMessage.panelistId);
      
      setTranscripts(prev => ({
        ...prev,
        [nextMessage.panelistId]: nextMessage.message
      }));

      if (nextMessage.audioBase64) {
        playAudio(nextMessage.audioBase64);
      }
    }
  };

  // Handle live mode flow
  const handleLiveModeFlow = () => {
    if (!session) return;

    // Start conversation with initial AI content
    if (!conversationStarted && session.messages.length > 0 && !isPlaying) {
      setConversationStarted(true);
      setIsPlaying(true);
      playNextAIMessage();
    }
  };

  // Manage the discussion flow
  useEffect(() => {
    // Handle live mode differently
    if (isLiveMode) {
      handleLiveModeFlow();
      return;
    }

    // Original auto mode logic
    if (!isPlaying || !session || currentMessageIndex >= session.messages.length) {
      // Check if discussion is complete
      if (session && currentMessageIndex >= session.messages.length && currentMessageIndex > 0) {
        setIsPlaying(false);
        setShowEndModal(true);
        
        // Update session metrics
        if (sessionStartTime) {
          const finalDuration = Math.floor((Date.now() - sessionStartTime) / 1000);
          setActualDuration(finalDuration);
          aiCouncilService.updateSessionMetrics(finalDuration, sessionStartTime);
        }
      }
      return;
    }

    const currentMessage = session.messages[currentMessageIndex];
    if (!currentMessage) return;

    // Set active speaker
    setActiveSpeaker(currentMessage.panelistId);
    
    // Check if we need to generate next round in background (only for auto mode)
    if (!isLiveMode) {
      aiCouncilService.checkAndGenerateNextRound(currentMessageIndex);
    }
    
    // Update transcript
    setTranscripts(prev => ({
      ...prev,
      [currentMessage.panelistId]: currentMessage.message
    }));

    // Play audio if available from hybrid generation, or generate on-demand as fallback
    if (currentMessage.audioBase64) {
      console.log(`Playing pre-generated audio for ${currentMessage.panelistId}: ${currentMessage.message.substring(0, 30)}...`);
      playAudio(currentMessage.audioBase64);
    } else {
      console.log(`Audio not ready, generating on-demand for message: ${currentMessage.message.substring(0, 30)}...`);
      setIsGeneratingAudio(true);
      // Generate audio on-demand as fallback
      aiCouncilService.generateAudioForMessage(currentMessageIndex).then(() => {
        setIsGeneratingAudio(false);
        // Get the updated message after audio generation
        const updatedMessage = session.messages[currentMessageIndex];
        if (updatedMessage && updatedMessage.audioBase64) {
          console.log(`Audio generated successfully, now playing for ${updatedMessage.panelistId}`);
          playAudio(updatedMessage.audioBase64);
        } else {
          console.log(`Audio generation failed for ${currentMessage.panelistId}, using fallback timing`);
          // If audio generation failed, move to next after calculated duration
          const speakingDuration = calculateSpeakingDuration(currentMessage.message);
          setTimeout(() => {
            onAudioEnded();
          }, speakingDuration);
        }
      }).catch((error) => {
        setIsGeneratingAudio(false);
        console.error(`Audio generation error for ${currentMessage.panelistId}:`, error);
        // If audio generation failed, move to next after calculated duration
        const speakingDuration = calculateSpeakingDuration(currentMessage.message);
        setTimeout(() => {
          onAudioEnded();
        }, speakingDuration);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, session, currentMessageIndex, sessionStartTime, isLiveMode, conversationStarted]);

  // Calculate speaking duration based on text length
  const calculateSpeakingDuration = (text: string): number => {
    // Average speaking rate: ~150 words per minute = 2.5 words per second
    const words = text.split(/\s+/).length;
    const baseDuration = (words / 2.5) * 1000; // Convert to milliseconds
    return Math.max(baseDuration, 2000) + 500; // Add 500ms buffer
  };

  const handleTogglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleTimerUpdate = (seconds: number) => {
    setActualDuration(seconds);
  };

  const handleDiscussionEnd = () => {
    setShowEndModal(false);
    navigate("/");
  };

  const handleExit = () => {
    setShowExitModal(true);
    // Stop any playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    // Stop the AI service
    aiCouncilService.stopSession();
    
    // Update final metrics if session was running
    if (sessionStartTime && actualDuration > 0) {
      aiCouncilService.updateSessionMetrics(actualDuration, sessionStartTime);
    }
  };

  const handleConfirmExit = () => {
    navigate("/");
  };

  // Loading state
  if (isLoading) {
    const getLoadingText = () => {
      switch (sessionType) {
        case 'discussion':
          return {
            title: "Initializing AI Council...",
            subtitle: `Preparing ${session?.panelists.length || 4} AI experts for your topic`
          };
        case 'debate':
          return {
            title: "Preparing AI Debate...",
            subtitle: "Setting up your AI opponent for intellectual combat"
          };
        case 'interview':
          return {
            title: "Initializing AI Interview...",
            subtitle: "Preparing your AI interviewer with challenging questions"
          };
        default:
          return {
            title: "Initializing AI Council...",
            subtitle: `Preparing ${session?.panelists.length || 4} AI experts for your topic`
          };
      }
    };

    const loadingText = getLoadingText();

    return (
      <div className="council-page min-h-screen bg-gradient-modern grain-overlay flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-glow-primary/30 border-t-glow-primary rounded-full animate-spin mx-auto" />
          <h2 className="text-xl font-quicksand text-foreground">{loadingText.title}</h2>
          <p className="text-foreground-muted font-author">{loadingText.subtitle}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="council-page min-h-screen bg-gradient-modern grain-overlay flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <h2 className="text-xl font-quicksand text-foreground">Initialization Failed</h2>
          <p className="text-foreground-muted font-author">{error}</p>
          <button 
            onClick={() => navigate("/")}
            className="px-6 py-3 bg-gradient-primary rounded-xl text-white font-quicksand hover:shadow-glow-lg transition-all duration-300"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="council-page min-h-screen bg-gradient-modern grain-overlay flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-quicksand text-foreground">No active session</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="council-page min-h-screen bg-gradient-modern grain-overlay relative overflow-hidden">
      
      {/* Glass overlay gradient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-grain opacity-30" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-glow-primary/4 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-glow-secondary/6 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-2/3 left-1/2 w-72 h-72 bg-glow-accent/3 rounded-full blur-2xl animate-float" style={{ animationDelay: '3s' }} />
      </div>

      <Header 
        topic={topic}
        duration={duration}
        currentMessage={currentMessageIndex}
        totalMessages={session?.messages.length}
        sessionType={sessionType}
        sessionMode={sessionMode}
        isLiveMode={isLiveMode}
        isUserTurn={isUserTurn}
      />

      <main className="pt-16 pb-20 px-2 sm:px-6 lg:px-8 overflow-hidden">
        <div className="w-full sm:max-w-8xl sm:mx-auto h-[calc(100vh-140px)] sm:h-[85vh]">
          {/* Discussion: 2x2 Grid | Debate/Interview: AI left, User right */}
          {sessionType === 'discussion' ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 lg:gap-6 h-full">
              {session.panelists.map((panelist) => (
                <div 
                  key={panelist.id}
                  className="w-full h-full min-h-[42vh] sm:min-h-0"
                >
                  <PanelistCard
                    id={panelist.id}
                    name={panelist.name}
                    role={panelist.role}
                    avatar={panelist.avatar}
                    isSpeaking={activeSpeaker === panelist.id}
                    isDimmed={activeSpeaker !== null && activeSpeaker !== panelist.id}
                    transcript={transcripts[panelist.id]}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8 h-full">
              {/* AI Panelist */}
              <div className="w-full h-full">
                <PanelistCard
                  id={session.panelists[0].id}
                  name={session.panelists[0].name}
                  role={session.panelists[0].role}
                  avatar={session.panelists[0].avatar}
                  isSpeaking={activeSpeaker === session.panelists[0].id}
                  isDimmed={activeSpeaker !== null && activeSpeaker !== session.panelists[0].id}
                  transcript={transcripts[session.panelists[0].id]}
                />
              </div>
              
              {/* User Card */}
              <div className="w-full h-full">
                <UserCard
                  isSpeaking={isUserTurn}
                  isDimmed={activeSpeaker !== null && !isUserTurn}
                  transcript={userLastMessage}
                />
              </div>
            </div>
          )}
        </div>

        {/* Hidden audio element for playing TTS */}
        <audio ref={audioRef} className="hidden" />

        {/* Live Mode Chat Input */}
        {isLiveMode && (
          <div className="fixed bottom-4 left-4 right-4 z-10">
            <ChatInput
              onSendMessage={handleUserMessage}
              disabled={!isUserTurn || isLoading}
              placeholder={
                sessionType === 'discussion'
                  ? "Share your thoughts on the discussion..."
                  : sessionType === 'debate'
                  ? "Present your argument..."
                  : "Answer the interviewer's question..."
              }
              isAIGenerating={isAIGenerating}
              onStopAI={handleStopAI}
            />
          </div>
        )}
      </main>

      {/* Floating Controls */}
      <FloatingControls
        isPlaying={isPlaying}
        onTogglePlay={handleTogglePlay}
        onExit={handleExit}
        onTimerUpdate={handleTimerUpdate}
        disabled={isLiveMode && isUserTurn} // Disable controls during user turn
      />

      {/* Exit Confirmation Modal */}
      <ExitConfirmationModal
        isOpen={showExitModal}
        onClose={() => setShowExitModal(false)}
        onConfirmExit={handleConfirmExit}
      />

      {/* Discussion Ended Modal */}
      <DiscussionEndedModal
        isOpen={showEndModal}
        onDone={handleDiscussionEnd}
        duration={actualDuration}
      />
    </div>
  );
};

export default Council;