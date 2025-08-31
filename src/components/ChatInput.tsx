import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Mic, MicOff, Send, Square } from 'lucide-react';
import AssemblyAIStreamingService, { type StreamingTranscriptionResult } from '@/services/assemblyAIStreamingService';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  isAIGenerating?: boolean;
  onStopAI?: () => void;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  disabled = false,
  placeholder = "Type your message or click the mic to record...",
  isAIGenerating = false,
  onStopAI
}) => {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [assemblyAI] = useState(() => new AssemblyAIStreamingService());
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [message]);

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startRecording = async () => {
    try {
      console.log('Starting recording...');
      setIsRecording(true);
      setMessage(''); // Clear any existing text
      
      await assemblyAI.startRecording(handleTranscription);
      console.log('Recording started successfully');
    } catch (error) {
      console.error('Failed to start recording:', error);
      setIsRecording(false);
      // Show user-friendly error
      alert('Failed to start recording. Please check microphone permissions and try again.');
    }
  };

  const stopRecording = async () => {
    try {
      console.log('Stopping recording...');
      setIsRecording(false);
      setIsTranscribing(true);
      
      await assemblyAI.stopRecording();
      
      // The transcription will come via the callback when processing is complete
      // No need for timeout here since the callback handles completion
    } catch (error) {
      console.error('Failed to stop recording:', error);
      setIsRecording(false);
      setIsTranscribing(false);
    }
  };

  const handleTranscription = (result: StreamingTranscriptionResult) => {
    console.log('Transcription received:', result);
    
    // When we get the final result from the simple API
    if (result.is_final) {
      setIsTranscribing(false);
      
      if (result.text && result.text.trim()) {
        // Auto-send the transcription immediately without user editing
        console.log('Auto-sending transcription:', result.text.trim());
        onSendMessage(result.text.trim());
        setMessage(''); // Keep message field clear
      } else {
        // Handle case where no transcription was generated
        console.log('No transcription text received');
        alert('No speech detected. Please try recording again.');
      }
    }
  };

  const toggleRecording = () => {
    console.log('Toggle recording clicked, current state:', isRecording);
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const canSend = message.trim().length > 0 && !disabled && !isRecording && !isTranscribing;

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* AI Generation Overlay */}
      {isAIGenerating && (
        <div className="mb-4 p-4 rounded-xl bg-glass-primary backdrop-blur-glass border border-border/50 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 rounded-full border-2 border-glow-primary/30 border-t-glow-primary animate-spin" />
            <span className="font-author text-foreground-muted">AI is responding...</span>
          </div>
          {onStopAI && (
            <Button
              onClick={onStopAI}
              variant="outline"
              size="sm"
              className="bg-glass-secondary border-border/50 hover:bg-glass-primary"
            >
              <Square className="w-4 h-4 mr-2" />
              Stop
            </Button>
          )}
        </div>
      )}

      {/* Chat Input */}
      <div className="relative">
        <div className="flex items-end space-x-3 p-4 rounded-2xl bg-glass-primary backdrop-blur-glass border border-border/50 shadow-glass focus-within:shadow-glow-lg focus-within:border-glow-primary/50 transition-all duration-300">
          
          {/* Text Input */}
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                isRecording 
                  ? "Recording... Click the mic to stop and send"
                  : isTranscribing
                  ? "Transcribing and sending your message..."
                  : placeholder
              }
              disabled={disabled || isRecording || isTranscribing}
              className="min-h-[44px] max-h-32 resize-none border-0 bg-transparent focus:ring-0 focus:outline-none text-foreground placeholder:text-foreground-subtle font-author text-base p-0"
              rows={1}
            />
            
            {/* Recording indicator */}
            {isRecording && (
              <div className="absolute top-2 right-2 flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-xs text-red-500 font-author">REC</span>
              </div>
            )}
          </div>

          {/* Voice Recording Button */}
          <Button
            onClick={toggleRecording}
            disabled={disabled || isTranscribing}
            variant="ghost"
            size="sm"
            className={`p-2 rounded-xl transition-all duration-300 ${
              isRecording 
                ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' 
                : 'hover:bg-glass-secondary'
            }`}
          >
            {isRecording ? (
              <MicOff className="w-5 h-5" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </Button>

          {/* Send Button */}
          <Button
            onClick={handleSend}
            disabled={!canSend}
            className={`p-2 rounded-xl transition-all duration-300 ${
              canSend
                ? 'bg-gradient-primary hover:shadow-glow text-white'
                : 'bg-glass-secondary text-foreground-muted cursor-not-allowed'
            }`}
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>

        {/* Status indicators */}
        <div className="flex justify-between items-center mt-2 px-2">
          <div className="flex items-center space-x-4 text-xs text-foreground-subtle font-author">
            {isRecording && (
              <span className="text-red-500">🔴 Recording - say "done" to finish</span>
            )}
            {isTranscribing && (
              <span className="text-glow-primary">Processing recording...</span>
            )}
            {!isRecording && !isTranscribing && (
              <span>Press Shift+Enter for new line</span>
            )}
          </div>
          
          <div className="text-xs text-foreground-subtle font-author">
            {message.length}/1000
          </div>
        </div>

        {/* Input glow effect */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-glow opacity-20 animate-glow-pulse -z-10" />
      </div>
    </div>
  );
};

export default ChatInput;
