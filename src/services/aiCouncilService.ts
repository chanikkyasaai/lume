// AI Council Service - Integrates Cerebras LLM and Murf TTS
import { v4 as uuidv4 } from 'uuid';
import { saveSession, type CouncilSession as HistorySession } from '@/lib/history';

export type SessionType = 'discussion' | 'debate' | 'interview';
export type SessionMode = 'auto' | 'live';

export interface CouncilPanelist {
  id: number;
  name: string;
  role: string;
  avatar: "bot" | "brain" | "cpu" | "zap";
  voiceId: string;
  persona: string;
  stance: string;
}

export interface CouncilMessage {
  panelistId: number;
  message: string;
  audioBase64?: string;
  timestamp: number;
  isUserMessage?: boolean;
}

export interface CouncilSession {
  id: string;
  topic: string;
  duration: number;
  sessionType: SessionType;
  sessionMode: SessionMode;
  interviewContent?: string;
  panelists: CouncilPanelist[];
  messages: CouncilMessage[];
  isActive: boolean;
  createdAt: number;
  actualDuration?: number;
  firstPlayedAt?: number;
  currentRound: number;
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
  }>;
}

// Selected voices for diverse representation - all clear and strong
const COUNCIL_VOICES = {
  1: "en-US-natalie",    // Female - Strategic, authoritative (clear)
  2: "en-US-wayne",      // Male - Creative, inspirational (clear)  
  3: "en-US-marcus",     // Male - Analytical, deep voice (clear & strong)
  4: "en-US-alicia"      // Female - Ethical, professional (clear & strong)
};

// Debate and Interview specific voices
const DEBATE_VOICE = "en-US-marcus";      // Strong male voice for debate opponent
const INTERVIEW_VOICE = "en-US-alicia";   // Professional female voice for interviewer

// Dynamic persona assignment based on topic for discussion mode
const generateDiscussionPersonas = (topic: string): Record<number, { persona: string; stance: string }> => {
  const topicLower = topic.toLowerCase();
  
  // Determine context for better persona assignment
  const isBusinessTopic = /business|market|finance|economy|startup|revenue|profit/.test(topicLower);
  const isTechTopic = /technology|ai|software|digital|innovation|automation/.test(topicLower);
  const isEthicalTopic = /ethics|moral|rights|privacy|society|impact/.test(topicLower);
  const isCreativeTopic = /design|art|creative|brand|marketing|content/.test(topicLower);

  return {
    1: {
      persona: `You are Athena, the Strategic Advisor. You approach ${topic} with analytical precision and strategic thinking. You focus on long-term implications, risk assessment, and systematic solutions. You speak with authority and provide structured insights.`,
      stance: isBusinessTopic ? "pro-growth" : isTechTopic ? "cautiously optimistic" : "analytical"
    },
    2: {
      persona: `You are Apollo, the Creative Director. You bring innovative and out-of-the-box thinking to ${topic}. You focus on creative solutions, user experience, and breakthrough approaches. You speak with enthusiasm and inspire new perspectives.`,
      stance: isCreativeTopic ? "highly supportive" : isTechTopic ? "innovation-focused" : "creative-solution oriented"
    },
    3: {
      persona: `You are Hermes, the Data Analyst. You approach ${topic} through data-driven insights and quantitative analysis. You provide facts, metrics, and evidence-based recommendations. You speak precisely and back everything with data.`,
      stance: "neutral-analytical"
    },
    4: {
      persona: `You are Artemis, the Ethics Reviewer. You examine ${topic} from ethical, social, and human impact perspectives. You ensure responsible approaches and consider all stakeholders. You speak thoughtfully about implications and values.`,
      stance: isEthicalTopic ? "ethically concerned" : isTechTopic ? "human-centered" : "socially conscious"
    }
  };
};

// Generate debate persona
const generateDebatePersona = (topic: string): { persona: string; stance: string } => {
  return {
    persona: `You are Marcus, an expert debater. You will debate the topic "${topic}" with the user. You are knowledgeable, articulate, and present well-reasoned arguments. You engage constructively but challenge the user's points thoughtfully. You maintain a respectful but competitive debate style. Keep your responses concise and focused - aim for 2-3 strong points per response.`,
    stance: "opposing-constructive"
  };
};

// Generate interview persona
const generateInterviewPersona = (topic: string, interviewContent: string): { persona: string; stance: string; shouldRequestMore: boolean } => {
  // Check if content seems sufficient (basic heuristic)
  const words = interviewContent.split(/\s+/).length;
  const hasJDKeywords = /job|position|role|responsibilities|requirements|qualifications|skills|experience/.test(interviewContent.toLowerCase());
  const hasResumeKeywords = /experience|education|skills|work|university|company|project|achievement/.test(interviewContent.toLowerCase());
  
  const shouldRequestMore = words < 50 || !hasJDKeywords || !hasResumeKeywords;
  
  if (shouldRequestMore) {
    return {
      persona: `You are Alicia, a professional interviewer. The user is applying for "${topic}" but the provided job description and resume content seems insufficient for a proper interview. Politely ask them to provide more details about the job requirements and their background. Be encouraging and specific about what information would be helpful.`,
      stance: "requesting-more-info",
      shouldRequestMore: true
    };
  }
  
  return {
    persona: `You are Alicia, a senior technical interviewer at a top tech company. You're interviewing for a JavaScript/Full-Stack Developer position: "${topic}". 

Based on the job description and candidate background: "${interviewContent}".

INTERVIEW STYLE:
- Ask technical JavaScript questions ranging from fundamentals to advanced concepts
- Don't be afraid to challenge the candidate and point out flaws in their reasoning
- Follow up with probing questions when answers seem incomplete or wrong
- Mix behavioral and technical questions realistically
- Be slightly skeptical - good interviewers test confidence and knowledge depth
- If they give a surface-level answer, push deeper: "That's a start, but can you explain WHY that happens?"
- Challenge assumptions: "Are you sure about that? What would happen if..."
- Test problem-solving under pressure

TOPICS TO COVER:
- JavaScript fundamentals (closures, prototypes, async/await, event loop)
- React/Frontend frameworks and best practices
- System design for web applications
- Code quality, testing, and debugging approaches
- Past project challenges and technical decisions

Be professional but not overly friendly. A good interviewer finds gaps in knowledge and tests how candidates handle being challenged. Don't just accept vague answers - demand specifics and examples.`,
    stance: "challenging-technical-interviewer",
    shouldRequestMore: false
  };
};

class AICouncilService {
  private apiKey: string;
  private murfApiKey: string;
  private session: CouncilSession | null = null;
  private currentRound = 0;
  private isGeneratingNextRound = false;

  constructor() {
    // Get API keys from localStorage only (client-side configuration)
    this.apiKey = localStorage.getItem('cerebras_api_key') || '';
    this.murfApiKey = localStorage.getItem('murf_api_key') || '';
    
    console.log('API Keys loaded:', {
      cerebras: this.apiKey ? 'Present' : 'Missing',
      murf: this.murfApiKey ? 'Present' : 'Missing'
    });
    
    if (!this.apiKey) {
      console.warn('Cerebras API key not found. Please configure it using the settings modal.');
    }
    if (!this.murfApiKey) {
      console.warn('Murf API key not found. Please configure it using the settings modal.');
    }
  }

  // Method to update API keys at runtime
  updateApiKeys(cerebrasKey?: string, murfKey?: string) {
    if (cerebrasKey) {
      this.apiKey = cerebrasKey;
      localStorage.setItem('cerebras_api_key', cerebrasKey);
    }
    if (murfKey) {
      this.murfApiKey = murfKey;
      localStorage.setItem('murf_api_key', murfKey);
    }
    console.log('API Keys updated:', {
      cerebras: this.apiKey ? 'Present' : 'Missing',
      murf: this.murfApiKey ? 'Present' : 'Missing'
    });
  }

  // Method to refresh API keys from localStorage
  refreshApiKeys() {
    this.apiKey = localStorage.getItem('cerebras_api_key') || '';
    this.murfApiKey = localStorage.getItem('murf_api_key') || '';
    
    console.log('API Keys refreshed:', {
      cerebras: this.apiKey ? 'Present' : 'Missing',
      murf: this.murfApiKey ? 'Present' : 'Missing'
    });
  }

  // Method to check if API keys are configured
  hasValidApiKeys(): boolean {
    return !!(this.apiKey && this.murfApiKey);
  }

  // Initialize a new council session
  async initializeSession(
    topic: string, 
    duration: number, 
    sessionType: SessionType, 
    sessionMode: SessionMode, 
    interviewContent?: string
  ): Promise<CouncilSession> {
    // Refresh API keys from localStorage before starting
    this.refreshApiKeys();
    
    if (!this.hasValidApiKeys()) {
      throw new Error('API keys not configured. Please configure them in the settings.');
    }
    
    let panelists: CouncilPanelist[] = [];
    
    if (sessionType === 'discussion') {
      const personas = generateDiscussionPersonas(topic);
      
      panelists = [
        {
          id: 1,
          name: "Athena",
          role: "Strategic Advisor",
          avatar: "brain",
          voiceId: COUNCIL_VOICES[1],
          persona: personas[1].persona,
          stance: personas[1].stance
        },
        {
          id: 2,
          name: "Apollo",
          role: "Creative Director",
          avatar: "zap",
          voiceId: COUNCIL_VOICES[2],
          persona: personas[2].persona,
          stance: personas[2].stance
        },
        {
          id: 3,
          name: "Hermes",
          role: "Data Analyst",
          avatar: "cpu",
          voiceId: COUNCIL_VOICES[3],
          persona: personas[3].persona,
          stance: personas[3].stance
        },
        {
          id: 4,
          name: "Artemis",
          role: "Ethics Reviewer",
          avatar: "bot",
          voiceId: COUNCIL_VOICES[4],
          persona: personas[4].persona,
          stance: personas[4].stance
        }
      ];
    } else if (sessionType === 'debate') {
      const persona = generateDebatePersona(topic);
      
      panelists = [
        {
          id: 1,
          name: "Marcus",
          role: "Debate Opponent",
          avatar: "zap", // Apollo - male avatar for male voice
          voiceId: DEBATE_VOICE,
          persona: persona.persona,
          stance: persona.stance
        }
      ];
    } else if (sessionType === 'interview') {
      const persona = generateInterviewPersona(topic, interviewContent || '');
      
      panelists = [
        {
          id: 1,
          name: "Alicia",
          role: "Professional Interviewer",
          avatar: "brain", // Athena - female avatar for female voice
          voiceId: INTERVIEW_VOICE,
          persona: persona.persona,
          stance: persona.stance
        }
      ];
    }

    this.session = {
      id: uuidv4(),
      topic,
      duration,
      sessionType,
      sessionMode,
      interviewContent,
      panelists,
      messages: [],
      isActive: true,
      createdAt: Date.now(),
      currentRound: 0,
      conversationHistory: []
    };

    return this.session;
  }

  // Generate script using Cerebras API
  private async generateCouncilScript(topic: string, duration: number, panelists: CouncilPanelist[]): Promise<CouncilMessage[]> {
    // Calculate approximate word count based on duration (150 words per minute)
    const targetWordCount = duration * 150;
    const totalTurns = duration * 4; // Keep this for a rough turn count

    if (!this.apiKey) {
      console.warn('Cerebras API key not configured, using fallback script');
      return this.generateFallbackScript(topic, totalTurns, panelists);
    }

    const systemPrompt = `You are an expert scriptwriter for a realistic AI council debate on "${topic}". Your task is to generate a compelling and natural-flowing discussion that lasts approximately ${duration} minutes (around ${targetWordCount} words).

The council has 4 panelists:
${panelists.map(p => `- ${p.name} (${p.role}): ${p.persona}`).join('\n')}

CRITICAL REQUIREMENTS:
1.  **Conversational Flow**: This is a debate, not a Q&A. Panelists MUST react to, build upon, or counter the points made by the previous speaker. Use phrases like "That's an interesting point, but...", "I agree with Athena, and I'd add...", "The data doesn't fully support that, Hermes."
2.  **Script Length**: The total length of all messages combined should be approximately ${targetWordCount} words to simulate a ${duration}-minute discussion.
3.  **Speaking Order**: Follow the order: Athena → Apollo → Hermes → Artemis, and repeat. Ensure a balanced number of turns for each.
4.  **Realistic Pacing**: Vary the length of each turn. Some can be short reactions, others longer explanations.
5.  **Conclusion**: The final turns should bring the discussion to a natural summary or conclusion.

Format your response as a valid JSON array of objects, where each object has:
{
  "speaker": "panelist_name",
  "message": "what they say"
}`;

    try {
      console.log('Calling Cerebras API for script generation...');
      
      const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b',
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: `Generate the complete ${duration}-minute council discussion script about: ${topic}`
            }
          ],
          max_tokens: 4000,
          temperature: 0.85, // Slightly higher for more creative/natural conversation
          top_p: 0.9
        })
      });

      console.log('Cerebras API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Cerebras API error: ${response.status} - ${errorText}`);
        throw new Error(`Cerebras API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Cerebras API response received');
      
      let scriptText = data.choices[0].message.content;
      
      // Clean up the response - remove markdown code blocks if present
      scriptText = scriptText.replace(/```json\s*/, '').replace(/```\s*$/, '').trim();
      
      // Parse the JSON response
      let scriptArray;
      try {
        scriptArray = JSON.parse(scriptText);
      } catch (e) {
        console.error('Failed to parse script JSON:', e);
        console.log('Cleaned script text:', scriptText);
        // Fallback to sample script
        return this.generateFallbackScript(topic, totalTurns, panelists);
      }

      // Convert to CouncilMessage format
      const messages: CouncilMessage[] = scriptArray.map((item: { speaker: string; message: string }, index: number) => {
        const panelist = panelists.find(p => p.name === item.speaker) || panelists[0];
        return {
          panelistId: panelist.id,
          message: item.message,
          timestamp: Date.now() + (index * 3000) // Placeholder timestamp
        };
      });

      return messages;
    } catch (error) {
      console.error('Error generating script:', error);
      // Return fallback script
      return this.generateFallbackScript(topic, totalTurns, panelists);
    }
  }

  // Fallback script generator
  private generateFallbackScript(topic: string, totalTurns: number, panelists: CouncilPanelist[]): CouncilMessage[] {
    const topicLower = topic.toLowerCase();
    
    // Topic-specific opening messages
    const openingMessages = {
      athena: `Let me analyze ${topic} from a strategic perspective. We need to consider the long-term implications.`,
      apollo: `I see fascinating creative opportunities in ${topic}. We should think outside the box here.`,
      hermes: `The data surrounding ${topic} shows several interesting patterns. Let me share the key metrics.`,
      artemis: `From an ethical standpoint, ${topic} raises important questions about responsibility and impact.`
    };

    // Dynamic response templates based on topic
    const responses = {
      athena: [
        "Strategic analysis shows three critical pathways we must consider.",
        "The risk assessment reveals both opportunities and challenges ahead.",
        "We need a systematic approach to implementation and measurement.",
        "Long-term sustainability should be our primary consideration here.",
        "Market positioning will be crucial for success in this area."
      ],
      apollo: [
        "What if we approached this with a completely fresh perspective?",
        "I envision innovative solutions that could transform the landscape.",
        "Creative disruption might be exactly what this space needs.",
        "User experience should drive every decision we make here.",
        "Brand differentiation will set us apart from competitors."
      ],
      hermes: [
        "Current data shows 73% alignment with market trends.",
        "Statistical analysis indicates strong growth potential ahead.",
        "Quantitative modeling suggests three viable scenarios.",
        "Performance metrics exceed baseline expectations by 24%.",
        "Evidence-based recommendations point to optimal pathways."
      ],
      artemis: [
        "We must ensure all stakeholders are considered in this decision.",
        "Ethical frameworks demand responsible implementation practices.",
        "Human impact assessment reveals critical considerations.",
        "Social responsibility should guide our approach here.",
        "Values-based decision making is essential for sustainable success."
      ]
    };

    const messages: CouncilMessage[] = [];
    
    // Add opening statements
    panelists.forEach((panelist, index) => {
      const panelistKey = panelist.name.toLowerCase() as keyof typeof openingMessages;
      messages.push({
        panelistId: panelist.id,
        message: openingMessages[panelistKey],
        timestamp: Date.now() + (index * 3000)
      });
    });

    // Add discussion turns
    for (let i = 4; i < totalTurns; i++) {
      const panelistIndex = i % panelists.length;
      const panelist = panelists[panelistIndex];
      const panelistKey = panelist.name.toLowerCase() as keyof typeof responses;
      const responsePool = responses[panelistKey];
      const responseIndex = Math.floor((i - 4) / panelists.length) % responsePool.length;
      
      messages.push({
        panelistId: panelist.id,
        message: responsePool[responseIndex],
        timestamp: Date.now() + (i * 3000)
      });
    }

    console.log(`Generated fallback script with ${messages.length} messages for topic: ${topic}`);
    return messages;
  }

  // Convert text to speech using Murf WebSocket with retry logic
  private async convertToSpeech(text: string, voiceId: string): Promise<string | null> {
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`TTS attempt ${attempt}/${maxRetries} for voice ${voiceId}`);
        const result = await this.convertToSpeechSingle(text, voiceId);
        if (result) {
          console.log(`TTS success on attempt ${attempt} for voice ${voiceId}`);
          return result;
        }
      } catch (error) {
        lastError = error as Error;
        console.warn(`TTS attempt ${attempt} failed for voice ${voiceId}:`, error);
        
        if (attempt < maxRetries) {
          // Wait before retry, increasing delay each time
          const delay = attempt * 2000; // 2s, 4s, 6s
          console.log(`Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    console.error(`All ${maxRetries} TTS attempts failed for voice ${voiceId}:`, lastError);
    return null;
  }

  // Single attempt at text-to-speech conversion
  private async convertToSpeechSingle(text: string, voiceId: string): Promise<string | null> {
    if (!this.murfApiKey) {
      console.warn('Murf API key not configured, skipping TTS');
      return null;
    }

    try {
      const wsUrl = `wss://api.murf.ai/v1/speech/stream-input?api-key=${this.murfApiKey}&sample_rate=44100&channel_type=MONO&format=WAV`;
      
      return new Promise((resolve, reject) => {
        const ws = new WebSocket(wsUrl);
        const audioChunks: Uint8Array[] = [];
        const contextId = `council_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        let timeoutId: ReturnType<typeof setTimeout> | null = null;

        const cleanup = () => {
          if (timeoutId) clearTimeout(timeoutId);
          if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
            ws.close();
          }
        };

        // Timeout handler - increased from 30s to 60s
        timeoutId = setTimeout(() => {
          cleanup();
          reject(new Error('Murf TTS timeout'));
        }, 60000);

        ws.onopen = () => {
          try {
            // Send voice configuration
            ws.send(JSON.stringify({
              voice_config: {
                voiceId: voiceId,
                style: "Conversational",
                rate: 0,
                pitch: 0,
                variation: 1
              },
              context_id: contextId
            }));

            // Send text
            ws.send(JSON.stringify({
              text: text,
              context_id: contextId,
              end: true
            }));
          } catch (error) {
            cleanup();
            reject(error);
          }
        };

        ws.onmessage = (event) => {
          try {
            const response = JSON.parse(event.data);
            
            if (response.audio) {
              // Decode base64 audio chunk
              const binaryString = atob(response.audio);
              const chunk = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                chunk[i] = binaryString.charCodeAt(i);
              }
              audioChunks.push(chunk);
            }

            if (response.final) {
              // Combine all audio chunks
              const totalLength = audioChunks.reduce((sum, chunk) => sum + chunk.length, 0);
              const combinedAudio = new Uint8Array(totalLength);
              let offset = 0;
              
              for (const chunk of audioChunks) {
                combinedAudio.set(chunk, offset);
                offset += chunk.length;
              }

              // Convert to base64 safely to avoid stack overflow
              let binaryString = '';
              const CHUNK_SIZE = 0x8000; // 32k chunk size
              for (let i = 0; i < combinedAudio.length; i += CHUNK_SIZE) {
                binaryString += String.fromCharCode.apply(null, Array.from(combinedAudio.subarray(i, i + CHUNK_SIZE)));
              }
              const base64Audio = btoa(binaryString);
              
              cleanup();
              resolve(base64Audio);
            }
          } catch (error) {
            console.error('Error processing Murf response:', error);
            cleanup();
            reject(error);
          }
        };

        ws.onerror = (error) => {
          console.error('Murf WebSocket error:', error);
          cleanup();
          reject(error);
        };

        ws.onclose = (event) => {
          // Only treat it as an error if we haven't successfully received audio
          if (event.code !== 1000 && audioChunks.length === 0) {
            console.warn(`Murf WebSocket closed unexpectedly: ${event.code} ${event.reason || 'Unknown reason'}`);
            cleanup();
            reject(new Error(`WebSocket closed: ${event.code} ${event.reason || 'Connection lost'}`));
          } else if (audioChunks.length > 0) {
            // We got some audio, try to process it even if connection closed unexpectedly
            console.log(`Processing ${audioChunks.length} audio chunks despite connection close`);
            try {
              const totalLength = audioChunks.reduce((sum, chunk) => sum + chunk.length, 0);
              const combinedAudio = new Uint8Array(totalLength);
              let offset = 0;
              
              for (const chunk of audioChunks) {
                combinedAudio.set(chunk, offset);
                offset += chunk.length;
              }

              let binaryString = '';
              const CHUNK_SIZE = 0x8000;
              for (let i = 0; i < combinedAudio.length; i += CHUNK_SIZE) {
                binaryString += String.fromCharCode.apply(null, Array.from(combinedAudio.subarray(i, i + CHUNK_SIZE)));
              }
              const base64Audio = btoa(binaryString);
              
              cleanup();
              resolve(base64Audio);
            } catch (processError) {
              cleanup();
              reject(processError);
            }
          }
        };
      });
    } catch (error) {
      console.error('Error converting to speech:', error);
      return null;
    }
  }

  // Calculate how many panelists we have for round calculations
  private getRoundSize(): number {
    return this.session?.panelists.length || 4;
  }

  // Get messages for a specific round
  private getMessagesForRound(roundNumber: number): CouncilMessage[] {
    if (!this.session) return [];
    const roundSize = this.getRoundSize();
    const startIndex = roundNumber * roundSize;
    const endIndex = Math.min(startIndex + roundSize, this.session.messages.length);
    return this.session.messages.slice(startIndex, endIndex);
  }

  // Generate audio for an entire round (all panelists speak once)
  private async generateRoundAudio(roundNumber: number): Promise<void> {
    if (!this.session) return;
    
    const roundMessages = this.getMessagesForRound(roundNumber);
    console.log(`Generating audio for round ${roundNumber + 1} (${roundMessages.length} messages)`);
    
    // Generate audio for all messages in this round sequentially to avoid API overload
    for (let i = 0; i < roundMessages.length; i++) {
      const message = roundMessages[i];
      const panelist = this.session.panelists.find(p => p.id === message.panelistId);
      
      if (panelist && !message.audioBase64) {
        try {
          console.log(`Generating audio for ${panelist.name} (${i + 1}/${roundMessages.length}) in round ${roundNumber + 1}`);
          const audioBase64 = await this.convertToSpeech(message.message, panelist.voiceId);
          if (audioBase64) {
            message.audioBase64 = audioBase64;
            console.log(`Audio generated successfully for ${panelist.name} in round ${roundNumber + 1}`);
          } else {
            console.log(`Audio generation returned null for ${panelist.name} in round ${roundNumber + 1}`);
          }
        } catch (error) {
          console.error(`Failed to generate audio for ${panelist.name} in round ${roundNumber + 1}:`, error);
          // Don't fail the entire round if one voice fails
        }
        
        // Add small delay between requests to avoid overwhelming API
        if (i < roundMessages.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    console.log(`Round ${roundNumber + 1} audio generation completed - all voices ready`);
  }

  // Start hybrid audio generation - generate first round, then subsequent rounds in background
  private async startHybridAudioGeneration(): Promise<void> {
    if (!this.session) return;
    
    const totalRounds = Math.ceil(this.session.messages.length / this.getRoundSize());
    console.log(`Starting hybrid audio generation for ${totalRounds} rounds`);
    
    // Generate first round immediately and wait for completion
    if (totalRounds > 0) {
      console.log('Generating first round - session will start only after all voices are ready...');
      await this.generateRoundAudio(0);
      
      // Verify first round has audio
      const firstRoundMessages = this.getMessagesForRound(0);
      const readyCount = firstRoundMessages.filter(msg => msg.audioBase64).length;
      console.log(`First round ready: ${readyCount}/${firstRoundMessages.length} voices generated`);
      
      console.log('First round audio ready - session can start playing immediately');
    }
    
    // Generate subsequent rounds in background without blocking
    if (totalRounds > 1) {
      // Don't await this - let it run in background
      this.generateSubsequentRounds(1, totalRounds).catch(error => {
        console.error('Background audio generation failed:', error);
      });
    }
  }

  // Generate subsequent rounds in background
  private async generateSubsequentRounds(startRound: number, totalRounds: number): Promise<void> {
    for (let round = startRound; round < totalRounds; round++) {
      // Wait a bit to not overload the system
      await new Promise(resolve => setTimeout(resolve, 1000));
      await this.generateRoundAudio(round);
    }
  }

  // Check if we need to generate the next round while current round is playing
  async checkAndGenerateNextRound(currentMessageIndex: number): Promise<void> {
    if (!this.session || this.isGeneratingNextRound) return;
    
    const roundSize = this.getRoundSize();
    const currentRound = Math.floor(currentMessageIndex / roundSize);
    const nextRound = currentRound + 1;
    const totalRounds = Math.ceil(this.session.messages.length / roundSize);
    
    // If we're in the second half of current round and next round isn't generated yet
    const roundProgress = (currentMessageIndex % roundSize) / roundSize;
    if (roundProgress >= 0.5 && nextRound < totalRounds) {
      const nextRoundMessages = this.getMessagesForRound(nextRound);
      const hasAudio = nextRoundMessages.every(msg => msg.audioBase64);
      
      if (!hasAudio) {
        this.isGeneratingNextRound = true;
        console.log(`Pre-generating audio for upcoming round ${nextRound + 1}`);
        await this.generateRoundAudio(nextRound);
        this.isGeneratingNextRound = false;
      }
    }
  }

  // Start the council session
  async startCouncil(topic: string, duration: number): Promise<CouncilSession> {
    console.log(`Starting council session: "${topic}" for ${duration} minutes`);
    
    const session = await this.initializeSession(topic, duration, 'discussion', 'auto');
    
    // Generate the script
    const messages = await this.generateCouncilScript(topic, duration, session.panelists);
    
    session.messages = messages;
    this.session = session;
    
    // Use hybrid audio generation - generate first round, then subsequent rounds in background
    console.log('Starting hybrid audio generation...');
    await this.startHybridAudioGeneration();
    
    // Save to history
    this.saveSessionToHistory(session);
    
    console.log(`Council session initialized with ${messages.length} messages`);
    return session;
  }

  // Save session to history
  saveSessionToHistory(session: CouncilSession): void {
    // Create a copy of messages without audio data to save space
    const scriptWithoutAudio = session.messages.map(msg => ({
      panelistId: msg.panelistId,
      message: msg.message,
      timestamp: msg.timestamp
      // Exclude audioBase64 to prevent localStorage quota issues
    }));

    const historySession: HistorySession = {
      id: session.id,
      topic: session.topic,
      selectedDuration: session.duration,
      actualDuration: session.actualDuration || 0,
      script: scriptWithoutAudio,
      createdAt: session.createdAt,
      firstPlayedAt: session.firstPlayedAt
    };
    
    try {
      saveSession(historySession);
    } catch (error) {
      console.warn('Failed to save session to history:', error);
      // If storage fails, we can continue without saving to history
    }
  }

  // Update session with actual duration and first played time
  updateSessionMetrics(actualDuration: number, firstPlayedAt?: number): void {
    if (this.session) {
      this.session.actualDuration = actualDuration;
      if (firstPlayedAt && !this.session.firstPlayedAt) {
        this.session.firstPlayedAt = firstPlayedAt;
      }
      // Save updated session to history
      this.saveSessionToHistory(this.session);
    }
  }

  // Load and replay a session from history
  async replaySession(historySession: HistorySession): Promise<CouncilSession> {
    // Convert history session back to council session format
    const session: CouncilSession = {
      id: historySession.id,
      topic: historySession.topic,
      duration: historySession.selectedDuration,
      sessionType: 'discussion', // Default for replays
      sessionMode: 'auto', // Replays are always auto mode
      panelists: this.regeneratePanelists(historySession.topic),
      messages: historySession.script.map(msg => ({ ...msg })), // Copy the messages
      isActive: true,
      createdAt: historySession.createdAt,
      actualDuration: historySession.actualDuration,
      firstPlayedAt: historySession.firstPlayedAt,
      currentRound: 0,
      conversationHistory: []
    };

    this.session = session;
    
    // Use hybrid audio generation for replay too - generate first round, then subsequent rounds in background
    console.log('Starting hybrid audio generation for replay session...');
    await this.startHybridAudioGeneration();
    
    return session;
  }

  // Generate audio on-demand for a specific message (used during replay)
  async generateAudioForMessage(messageIndex: number): Promise<void> {
    if (!this.session || messageIndex >= this.session.messages.length) {
      return;
    }

    const message = this.session.messages[messageIndex];
    const panelist = this.session.panelists.find(p => p.id === message.panelistId);
    
    if (panelist && !message.audioBase64) {
      try {
        console.log(`Generating audio on-demand for ${panelist.name}: ${message.message.substring(0, 30)}...`);
        const audioBase64 = await this.convertToSpeech(message.message, panelist.voiceId);
        if (audioBase64) {
          message.audioBase64 = audioBase64;
          console.log(`Audio generation completed for ${panelist.name}`);
        } else {
          console.log(`Audio generation returned null for ${panelist.name}`);
        }
      } catch (error) {
        console.error(`Failed to generate audio for ${panelist.name}:`, error);
        throw error; // Re-throw to handle in Council component
      }
    }
  }

  // Regenerate panelists for a replay (since we don't store panelist data in history)
  private regeneratePanelists(topic: string): CouncilPanelist[] {
    const personas = generateDiscussionPersonas(topic);
    
    return [
      {
        id: 1,
        name: "Athena",
        role: "Strategic Advisor", 
        avatar: "brain",
        voiceId: COUNCIL_VOICES[1],
        persona: personas[1].persona,
        stance: personas[1].stance
      },
      {
        id: 2,
        name: "Apollo",
        role: "Creative Director",
        avatar: "zap",
        voiceId: COUNCIL_VOICES[2],
        persona: personas[2].persona,
        stance: personas[2].stance
      },
      {
        id: 3,
        name: "Hermes",
        role: "Data Analyst",
        avatar: "cpu",
        voiceId: COUNCIL_VOICES[3],
        persona: personas[3].persona,
        stance: personas[3].stance
      },
      {
        id: 4,
        name: "Artemis",
        role: "Ethics Reviewer",
        avatar: "bot",
        voiceId: COUNCIL_VOICES[4],
        persona: personas[4].persona,
        stance: personas[4].stance
      }
    ];
  }

  // Get current session
  getCurrentSession(): CouncilSession | null {
    return this.session;
  }

  // Stop the session
  stopSession(): void {
    if (this.session) {
      this.session.isActive = false;
    }
  }

  // Generate initial content for live mode sessions
  async generateInitialLiveContent(): Promise<CouncilMessage[]> {
    // Refresh API keys before making API calls
    this.refreshApiKeys();
    
    if (!this.hasValidApiKeys()) {
      throw new Error('API keys not configured. Please configure them in the settings.');
    }
    
    if (!this.session) return [];

    const { sessionType, topic, panelists, interviewContent } = this.session;
    
    if (sessionType === 'discussion') {
      // For discussion live mode, generate first round for all 4 panelists
      return await this.generateDiscussionFirstRound(topic, panelists);
    } else if (sessionType === 'debate') {
      // For debate live mode, generate opening statement from AI debater
      return await this.generateDebateOpening(topic, panelists[0]);
    } else if (sessionType === 'interview') {
      // For interview live mode, generate first question from interviewer
      return await this.generateInterviewOpening(topic, panelists[0], interviewContent);
    }

    return [];
  }

  // Add user message to conversation history
  addUserMessage(userInput: string): void {
    if (!this.session) return;

    // Add to conversation history
    this.session.conversationHistory.push({
      role: 'user',
      content: userInput,
      timestamp: Date.now()
    });

    // Add as message (with special user panelist ID)
    const userMessage: CouncilMessage = {
      panelistId: 999, // Special ID for user
      message: userInput,
      timestamp: Date.now(),
      isUserMessage: true
    };

    this.session.messages.push(userMessage);
    this.session.currentRound++;
  }

  // Generate AI response based on user input and session type
  async generateLiveResponse(): Promise<CouncilMessage | null> {
    // Refresh API keys before making API calls
    this.refreshApiKeys();
    
    if (!this.hasValidApiKeys()) {
      throw new Error('API keys not configured. Please configure them in the settings.');
    }
    
    if (!this.session) return null;

    const { sessionType, topic, panelists, conversationHistory } = this.session;
    
    try {
      let responseContent = '';
      const activePanelist = panelists[0]; // For debate/interview, always use the single AI panelist
      
      if (sessionType === 'discussion') {
        // For discussion, generate response from next panelist in rotation
        const panelistIndex = (this.session.currentRound - 1) % panelists.length;
        const respondingPanelist = panelists[panelistIndex];
        responseContent = await this.generateDiscussionResponse(topic, respondingPanelist, conversationHistory);
        
        const message: CouncilMessage = {
          panelistId: respondingPanelist.id,
          message: responseContent,
          timestamp: Date.now()
        };

        this.session.messages.push(message);
        this.session.conversationHistory.push({
          role: 'assistant',
          content: responseContent,
          timestamp: Date.now()
        });

        return message;
      } else if (sessionType === 'debate') {
        responseContent = await this.generateDebateResponse(topic, activePanelist, conversationHistory);
      } else if (sessionType === 'interview') {
        responseContent = await this.generateInterviewResponse(topic, activePanelist, conversationHistory);
      }

      const message: CouncilMessage = {
        panelistId: activePanelist.id,
        message: responseContent,
        timestamp: Date.now()
      };

      this.session.messages.push(message);
      this.session.conversationHistory.push({
        role: 'assistant',
        content: responseContent,
        timestamp: Date.now()
      });

      return message;
    } catch (error) {
      console.error('Error generating live response:', error);
      return null;
    }
  }

  // Generate first round for discussion live mode
  private async generateDiscussionFirstRound(topic: string, panelists: CouncilPanelist[]): Promise<CouncilMessage[]> {
    const systemPrompt = `Generate opening statements for a discussion about "${topic}". Each panelist should provide their initial perspective in 2-3 sentences. This is the start of a live discussion where a user will participate.

Panelists:
${panelists.map(p => `- ${p.name} (${p.role}): ${p.persona}`).join('\n')}

Format as JSON array with objects: {"speaker": "name", "message": "content"}`;

    const content = await this.callCerebrasAPI(systemPrompt, `Generate opening statements for discussion about: ${topic}`);
    return this.parseAndFormatMessages(content, panelists);
  }

  // Generate debate opening
  private async generateDebateOpening(topic: string, panelist: CouncilPanelist): Promise<CouncilMessage[]> {
    const systemPrompt = `${panelist.persona}

Generate a strong opening statement for a debate about "${topic}". This should be 2-3 sentences that clearly present your position and invite the user to respond. Be engaging and thought-provoking.`;

    const content = await this.callCerebrasAPI(systemPrompt, `Provide your opening statement for the debate about: ${topic}`);
    
    return [{
      panelistId: panelist.id,
      message: content,
      timestamp: Date.now()
    }];
  }

  // Generate interview opening
  private async generateInterviewOpening(topic: string, panelist: CouncilPanelist, interviewContent?: string): Promise<CouncilMessage[]> {
    // Check if we need more information first
    const interviewPersona = generateInterviewPersona(topic, interviewContent || '');
    
    const systemPrompt = `${panelist.persona}

${interviewPersona.shouldRequestMore ? 
  'Ask the candidate to provide more information about the job description and their background.' :
  `Start the interview with a professional greeting and the first question. Base your questions on the provided content: "${interviewContent}"`}`;

    const content = await this.callCerebrasAPI(systemPrompt, 
      interviewPersona.shouldRequestMore ? 
        'Request more information from the candidate' :
        `Begin the interview for the ${topic} position`
    );
    
    return [{
      panelistId: panelist.id,
      message: content,
      timestamp: Date.now()
    }];
  }

  // Generate discussion response in live mode
  private async generateDiscussionResponse(
    topic: string, 
    panelist: CouncilPanelist, 
    conversationHistory: Array<{role: 'user' | 'assistant'; content: string; timestamp: number}>
  ): Promise<string> {
    const recentHistory = conversationHistory.slice(-6); // Last 6 messages for context
    const historyText = recentHistory.map(h => `${h.role}: ${h.content}`).join('\n');
    
    const systemPrompt = `${panelist.persona}

You are participating in a live discussion about "${topic}". Respond to the user's input and the ongoing conversation. Keep your response to 2-3 sentences and engage naturally with what was just said.

Recent conversation:
${historyText}`;

    return await this.callCerebrasAPI(systemPrompt, 'Respond to the user\'s input in the discussion');
  }

  // Generate debate response
  private async generateDebateResponse(
    topic: string, 
    panelist: CouncilPanelist, 
    conversationHistory: Array<{role: 'user' | 'assistant'; content: string; timestamp: number}>
  ): Promise<string> {
    const recentHistory = conversationHistory.slice(-4); // Last 4 messages for context
    const historyText = recentHistory.map(h => `${h.role}: ${h.content}`).join('\n');
    
    const systemPrompt = `${panelist.persona}

Recent debate exchange:
${historyText}

Respond to the user's argument with a strong counter-argument or follow-up point. Be respectful but challenging. Keep it to 2-3 sentences.`;

    return await this.callCerebrasAPI(systemPrompt, 'Respond to the user\'s debate point');
  }

  // Generate interview response
  private async generateInterviewResponse(
    topic: string, 
    panelist: CouncilPanelist, 
    conversationHistory: Array<{role: 'user' | 'assistant'; content: string; timestamp: number}>
  ): Promise<string> {
    const recentHistory = conversationHistory.slice(-4); // Last 4 messages for context
    const historyText = recentHistory.map(h => `${h.role}: ${h.content}`).join('\n');
    
    const systemPrompt = `${panelist.persona}

Interview progress:
${historyText}

Ask a relevant follow-up question or provide feedback on their answer, then ask the next question. Keep it professional and engaging.`;

    return await this.callCerebrasAPI(systemPrompt, 'Continue the interview based on the candidate\'s response');
  }

  // Helper method to call Cerebras API
  private async callCerebrasAPI(systemPrompt: string, userPrompt: string): Promise<string> {
    if (!this.apiKey) {
      return "API key not configured. Please add your Cerebras API key to continue.";
    }

    try {
      const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          max_tokens: 500,
          temperature: 0.8,
          top_p: 0.9
        })
      });

      if (!response.ok) {
        throw new Error(`Cerebras API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content.trim();
    } catch (error) {
      console.error('Error calling Cerebras API:', error);
      return "I'm having trouble generating a response right now. Please try again.";
    }
  }

  // Helper method to parse and format messages
  private parseAndFormatMessages(content: string, panelists: CouncilPanelist[]): CouncilMessage[] {
    try {
      // Clean up the response
      const cleanContent = content.replace(/```json\s*/, '').replace(/```\s*$/, '').trim();
      const scriptArray = JSON.parse(cleanContent);
      
      return scriptArray.map((item: { speaker: string; message: string }) => {
        const panelist = panelists.find(p => p.name === item.speaker) || panelists[0];
        return {
          panelistId: panelist.id,
          message: item.message,
          timestamp: Date.now()
        };
      });
    } catch (error) {
      console.error('Error parsing messages:', error);
      // Return fallback message
      return [{
        panelistId: panelists[0].id,
        message: "Let me start our discussion with some initial thoughts on this topic.",
        timestamp: Date.now()
      }];
    }
  }

  // Generate audio for a single message (for live mode)
  async generateMessageAudio(message: CouncilMessage): Promise<void> {
    // Refresh API keys before making API calls
    this.refreshApiKeys();
    
    if (!this.session || message.audioBase64) return;
    
    const panelist = this.session.panelists.find(p => p.id === message.panelistId);
    if (!panelist) return;

    try {
      const audioBase64 = await this.convertToSpeech(message.message, panelist.voiceId);
      if (audioBase64) {
        message.audioBase64 = audioBase64;
      }
    } catch (error) {
      console.error('Error generating message audio:', error);
    }
  }
}

export const aiCouncilService = new AICouncilService();
