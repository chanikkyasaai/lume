export interface StreamingTranscriptionResult {
  text: string;
  confidence?: number;
  is_final?: boolean;
}

class AssemblyAIStreamingService {
  private apiKey: string;
  private mediaRecorder: MediaRecorder | null = null;
  private audioStream: MediaStream | null = null;
  private audioChunks: Blob[] = [];
  private isRecording = false;
  private transcriptionCallback: ((result: StreamingTranscriptionResult) => void) | null = null;

  constructor() {
    this.apiKey = localStorage.getItem('assembly_api_key') || '';
    
    if (!this.apiKey) {
      console.warn('Assembly AI API key not found. Please configure it using the settings modal.');
    }
  }

  // Method to refresh API key from localStorage
  refreshApiKey() {
    this.apiKey = localStorage.getItem('assembly_api_key') || '';
    console.log('Assembly AI API key refreshed:', this.apiKey ? 'Present' : 'Missing');
  }

  async startRecording(onTranscription: (result: StreamingTranscriptionResult) => void): Promise<void> {
    // Refresh API key before starting recording
    this.refreshApiKey();
    
    if (!this.apiKey) {
      throw new Error('Assembly AI API key not configured. Please set it up in the settings.');
    }

    console.log('Starting simple recording...');
    this.transcriptionCallback = onTranscription;
    this.audioChunks = [];

    try {
      // Get audio stream
      console.log('Requesting microphone access...');
      this.audioStream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });
      console.log('Microphone access granted');

      // Setup MediaRecorder to collect audio data - try different formats
      let mimeType = '';
      const supportedTypes = [
        'audio/webm;codecs=opus',
        'audio/ogg;codecs=opus', 
        'audio/webm',
        'audio/ogg',
        'audio/mp4',
        'audio/wav'
      ];
      
      for (const type of supportedTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          break;
        }
      }
      
      console.log('Using MIME type:', mimeType || 'default');
      
      this.mediaRecorder = mimeType ? 
        new MediaRecorder(this.audioStream, { mimeType }) :
        new MediaRecorder(this.audioStream);

      this.mediaRecorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      });

      this.mediaRecorder.addEventListener('stop', () => {
        this.processRecording();
      });

      // Start recording
      this.mediaRecorder.start();
      this.isRecording = true;
      console.log('Recording started');

    } catch (error) {
      console.error('Error starting recording:', error);
      throw error;
    }
  }

  async stopRecording(): Promise<void> {
    console.log('Stopping recording...');
    this.isRecording = false;

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }

    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => track.stop());
      this.audioStream = null;
    }
  }

  private async processRecording(): Promise<void> {
    if (this.audioChunks.length === 0) {
      console.log('No audio data recorded');
      return;
    }

    try {
      console.log('Processing recorded audio...');
      
      // Create audio blob with proper MIME type
      const mimeType = this.audioChunks[0].type || 'audio/webm';
      const audioBlob = new Blob(this.audioChunks, { type: mimeType });
      console.log('Audio blob size:', audioBlob.size, 'MIME type:', mimeType);

      // Convert to PCM WAV format for Assembly AI compatibility
      const pcmBlob = await this.convertToPCM(audioBlob);
      console.log('PCM blob size:', pcmBlob.size);

      // Upload audio to Assembly AI
      const uploadUrl = await this.uploadAudio(pcmBlob);
      console.log('Audio uploaded, URL:', uploadUrl);

      // Request transcription
      const transcription = await this.requestTranscription(uploadUrl);
      console.log('Transcription result:', transcription);

      // Call the callback with the result
      if (this.transcriptionCallback && transcription) {
        this.transcriptionCallback({
          text: transcription,
          confidence: 1.0,
          is_final: true
        });
      }

    } catch (error) {
      console.error('Error processing recording:', error);
      if (this.transcriptionCallback) {
        this.transcriptionCallback({
          text: '',
          confidence: 0,
          is_final: true
        });
      }
    }

    // Clean up
    this.audioChunks = [];
    this.transcriptionCallback = null;
  }

  private async convertToPCM(audioBlob: Blob): Promise<Blob> {
    try {
      console.log('Converting audio to PCM format...');
      
      // Create audio context
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000 // Assembly AI prefers 16kHz
      });
      
      // Convert blob to array buffer
      const arrayBuffer = await audioBlob.arrayBuffer();
      
      // Decode audio data
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      console.log('Audio decoded:', audioBuffer.length, 'samples,', audioBuffer.sampleRate, 'Hz');
      
      // Convert to mono 16-bit PCM WAV
      const wavBuffer = this.encodeWAV(audioBuffer);
      const wavBlob = new Blob([wavBuffer], { type: 'audio/wav' });
      
      // Close audio context to free resources
      await audioContext.close();
      
      return wavBlob;
    } catch (error) {
      console.warn('Audio conversion failed, using original blob:', error);
      // Fallback to original blob if conversion fails
      return audioBlob;
    }
  }

  private encodeWAV(audioBuffer: AudioBuffer): ArrayBuffer {
    const length = audioBuffer.length;
    const sampleRate = audioBuffer.sampleRate;
    
    // Convert to mono if stereo
    const audioData = audioBuffer.numberOfChannels === 1 
      ? audioBuffer.getChannelData(0)
      : this.mixChannels(audioBuffer);
    
    // Create WAV file
    const buffer = new ArrayBuffer(44 + length * 2);
    const view = new DataView(buffer);
    
    // WAV header
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + length * 2, true);
    this.writeString(view, 8, 'WAVE');
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // PCM format
    view.setUint16(20, 1, true);  // Linear PCM
    view.setUint16(22, 1, true);  // Mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true); // Byte rate
    view.setUint16(32, 2, true);  // Block align
    view.setUint16(34, 16, true); // 16-bit
    this.writeString(view, 36, 'data');
    view.setUint32(40, length * 2, true);
    
    // Convert float samples to 16-bit PCM
    let offset = 44;
    for (let i = 0; i < length; i++) {
      const sample = Math.max(-1, Math.min(1, audioData[i]));
      const value = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(offset, value, true);
      offset += 2;
    }
    
    return buffer;
  }

  private mixChannels(audioBuffer: AudioBuffer): Float32Array {
    const channels = audioBuffer.numberOfChannels;
    const length = audioBuffer.length;
    const mixed = new Float32Array(length);
    
    for (let i = 0; i < length; i++) {
      let sum = 0;
      for (let channel = 0; channel < channels; channel++) {
        sum += audioBuffer.getChannelData(channel)[i];
      }
      mixed[i] = sum / channels;
    }
    
    return mixed;
  }

  private writeString(view: DataView, offset: number, string: string): void {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  private async uploadAudio(audioBlob: Blob): Promise<string> {
    console.log('Uploading audio file: recording.wav Size:', audioBlob.size, 'Type:', audioBlob.type);

    // Convert blob to ArrayBuffer and send as raw data (like the official example)
    const audioBuffer = await audioBlob.arrayBuffer();

    const response = await fetch('https://api.assemblyai.com/v2/upload', {
      method: 'POST',
      headers: {
        'Authorization': this.apiKey,
        'Content-Type': 'application/octet-stream'
      },
      body: audioBuffer
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Upload response:', response.status, errorText);
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.upload_url;
  }

  private async requestTranscription(audioUrl: string): Promise<string> {
    console.log('Requesting transcription for URL:', audioUrl);
    
    // Request transcription
    const transcriptResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: {
        'Authorization': this.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        audio_url: audioUrl,
        language_detection: true
      })
    });

    if (!transcriptResponse.ok) {
      const errorText = await transcriptResponse.text();
      console.error('Transcription request failed:', transcriptResponse.status, errorText);
      throw new Error(`Transcription request failed: ${transcriptResponse.status} ${transcriptResponse.statusText}`);
    }

    const transcriptData = await transcriptResponse.json();
    const transcriptId = transcriptData.id;
    console.log('Transcription job created with ID:', transcriptId);

    // Poll for completion
    let attempts = 0;
    const maxAttempts = 60; // 60 seconds max wait

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      
      const statusResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
        headers: {
          'Authorization': this.apiKey
        }
      });

      if (!statusResponse.ok) {
        const errorText = await statusResponse.text();
        console.error('Status check failed:', statusResponse.status, errorText);
        throw new Error(`Status check failed: ${statusResponse.status} ${statusResponse.statusText}`);
      }

      const statusData = await statusResponse.json();
      console.log(`Transcription status (attempt ${attempts + 1}):`, statusData.status);
      
      if (statusData.status === 'completed') {
        console.log('Transcription completed successfully');
        return statusData.text || '';
      } else if (statusData.status === 'error') {
        console.error('Transcription error:', statusData.error);
        throw new Error(`Transcription failed: ${statusData.error}`);
      }

      attempts++;
    }

    throw new Error('Transcription timeout - took longer than 60 seconds');
  }

  static isEndPhrase(text: string): boolean {
    const endPhrases = ['done', 'finished', 'complete', 'end', 'stop'];
    const lowerText = text.toLowerCase().trim();
    return endPhrases.some(phrase => lowerText.includes(phrase));
  }

  getRecordingState(): boolean {
    return this.isRecording;
  }
}

export default AssemblyAIStreamingService;