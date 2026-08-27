/**
 * SpeechCore Fallback Service
 * Utilise Web Speech API comme fallback quand SpeechCore n'est pas disponible
 */

export interface TranscriptionMessage {
  type: 'status' | 'result' | 'error';
  message?: string;
  transcription_complete?: string;
}

class SpeechCoreFallbackService {
  private recognition: any = null;
  private isListening = false;
  private interimTranscript = '';

  private listeners: {
    onMessage: (msg: TranscriptionMessage) => void;
    onError: (err: Error) => void;
    onOpen: () => void;
    onClose: () => void;
  } = {
    onMessage: () => {},
    onError: () => {},
    onOpen: () => {},
    onClose: () => {},
  };

  constructor() {
    // Initialiser Web Speech API
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'fr-FR';

        this.recognition.onstart = () => {
          console.log('[SpeechCore Fallback] 🎤 Listening...');
          this.listeners.onOpen();
        };

        this.recognition.onresult = (event: any) => {
          this.interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              this.interimTranscript += transcript;
            }
          }

          const fullText = finalTranscript || this.interimTranscript;
          if (fullText) {
            console.log('[SpeechCore Fallback] 📝 Transcribed:', fullText);
            this.listeners.onMessage({
              type: 'result',
              transcription_complete: fullText,
            });
          }
        };

        this.recognition.onerror = (event: any) => {
          console.error('[SpeechCore Fallback] ❌ Error:', event.error);
          this.listeners.onError(
            new Error(`Speech recognition error: ${event.error}`),
          );
        };

        this.recognition.onend = () => {
          console.log('[SpeechCore Fallback] ⏹️ Stopped');
          this.isListening = false;
          this.listeners.onClose();
        };

        console.log('[SpeechCore Fallback] ✅ Web Speech API initialized');
      } catch (err) {
        console.error('[SpeechCore Fallback] ❌ Initialization error:', err);
        this.recognition = null;
      }
    } else {
      console.warn('[SpeechCore Fallback] ⚠️ Web Speech API not supported');
    }
  }

  on(
    event: 'message' | 'error' | 'open' | 'close',
    callback: (data: any) => void,
  ): void {
    if (event === 'message') this.listeners.onMessage = callback;
    if (event === 'error') this.listeners.onError = callback;
    if (event === 'open') this.listeners.onOpen = callback;
    if (event === 'close') this.listeners.onClose = callback;
  }

  async startTranscription(): Promise<void> {
    if (!this.recognition) {
      throw new Error('Web Speech API not supported in this browser');
    }
    try {
      this.isListening = true;
      this.interimTranscript = '';
      this.recognition.start();
    } catch (err) {
      console.error('[SpeechCore Fallback] ❌ Start error:', err);
      throw err;
    }
  }

  stop(): void {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
        this.isListening = false;
      } catch (err) {
        console.error('[SpeechCore Fallback] ❌ Stop error:', err);
      }
    }
  }

  isConnected(): boolean {
    return this.isListening;
  }
}

export const speechCoreFallbackService = new SpeechCoreFallbackService();
