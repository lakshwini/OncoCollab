/**
 * SpeechCore Service
 * Gère la connexion WebSocket avec SpeechCore pour la transcription temps réel
 * Fallback: Web Speech API si SpeechCore n'est pas accessible
 */

import { speechCoreFallbackService } from './speechcore-fallback.service';

export interface TranscriptionMessage {
  type: 'status' | 'result' | 'error' | 'chunk';
  message?: string;
  transcription_complete?: string;
  transcription_avec_locuteurs?: string;
  stats?: {
    nombre_mots: number;
    nombre_locuteurs: number;
    nombre_segments?: number;
    langue_detectee?: string;
  };
  locution_separee?: Array<{ locuteur: string; texte: string }>;
}

export interface SpeechCoreConfig {
  engine: 'whisper' | 'vosk' | 'gladia' | 'groq';
  config_whisper?: 'cpu_rapide' | 'cpu_qualite' | 'gpu_equilibre';
  methode_bruit?: 'false' | 'noisereduce' | 'silero';
  type_environnement?: '1' | '2' | '3' | '4';
  nb_locuteurs?: number;
  initial_prompt?: string;
}

class SpeechCoreService {
  private ws: WebSocket | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioContext: AudioContext | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private stream: MediaStream | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000;
  private useFallback = false;
  private fallbackAvailable = false;

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

  constructor(private apiUrl: string = 'http://localhost:8000') {}

  /**
   * Enregistre les listeners pour les événements WebSocket
   */
  on(
    event: 'message' | 'error' | 'open' | 'close',
    callback: (data: any) => void,
  ): void {
    // Si on utilise le fallback, déléguer au fallback service
    if (this.useFallback) {
      speechCoreFallbackService.on(event, callback);
      return;
    }

    // Sinon, utiliser les listeners normaux
    if (event === 'message') this.listeners.onMessage = callback;
    if (event === 'error') this.listeners.onError = callback;
    if (event === 'open') this.listeners.onOpen = callback;
    if (event === 'close') this.listeners.onClose = callback;
  }

  /**
   * Lance la transcription WebSocket en temps réel
   * Fallback vers Web Speech API si SpeechCore n'est pas accessible
   */
  async startTranscription(config: SpeechCoreConfig): Promise<void> {
    try {
      console.log('[SpeechCore] 🚀 Tentative démarrage transcription...');

      // D'abord, essayer SpeechCore avec timeout
      try {
        await this.testSpeechCoreConnection();
        console.log('[SpeechCore] ✅ SpeechCore accessible, utilisation directe');

        // Accéder au microphone
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.stream = stream;

        // Capturer l'audio en WAV 16kHz
        const audioBlob = await this.captureAudioAsWav(stream);
        const base64Audio = await this.blobToBase64(audioBlob);

        // Ouvrir WebSocket
        this.connectWebSocket();

        // Envoyer les données une fois connecté
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(
            JSON.stringify({
              engine: config.engine,
              audio: base64Audio,
              nb_locuteurs: config.nb_locuteurs || 2,
              config_whisper: config.config_whisper || 'cpu_rapide',
              methode_bruit: config.methode_bruit || 'false',
              type_environnement: config.type_environnement || '2',
              initial_prompt: config.initial_prompt || '',
            }),
          );
        }
      } catch (speechCoreErr) {
        // SpeechCore n'est pas accessible - utiliser fallback
        console.warn(
          '[SpeechCore] ⚠️ SpeechCore indisponible, utilisation Web Speech API fallback',
          speechCoreErr,
        );
        this.useFallback = true;
        await speechCoreFallbackService.startTranscription();
      }
    } catch (err) {
      const error = new Error(
        `Erreur démarrage transcription: ${(err as Error).message}`,
      );
      this.listeners.onError(error);
      throw error;
    }
  }

  /**
   * Teste la connexion à SpeechCore avec timeout
   */
  private testSpeechCoreConnection(timeout: number = 3000): Promise<void> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('SpeechCore connection timeout'));
      }, timeout);

      try {
        const wsUrl = `${this.apiUrl.replace('http', 'ws')}/ws/transcribe`;
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          clearTimeout(timer);
          console.log('[SpeechCore] 🔌 Test connexion réussi');
          ws.close();
          resolve();
        };

        ws.onerror = () => {
          clearTimeout(timer);
          reject(new Error('WebSocket error'));
        };

        ws.onclose = () => {
          clearTimeout(timer);
        };
      } catch (err) {
        clearTimeout(timer);
        reject(err);
      }
    });
  }

  /**
   * Lance la transcription depuis un fichier audio (alternative)
   */
  async startTranscriptionFromFile(
    audioFile: Blob,
    config: SpeechCoreConfig,
  ): Promise<void> {
    try {
      const base64Audio = await this.blobToBase64(audioFile);

      this.connectWebSocket();

      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(
          JSON.stringify({
            engine: config.engine,
            audio: base64Audio,
            nb_locuteurs: config.nb_locuteurs || 2,
            config_whisper: config.config_whisper || 'cpu_rapide',
            methode_bruit: config.methode_bruit || 'false',
            type_environnement: config.type_environnement || '2',
          }),
        );
      }
    } catch (err) {
      const error = new Error(`Erreur démarrage transcription: ${(err as Error).message}`);
      this.listeners.onError(error);
      throw error;
    }
  }

  /**
   * Connecte au WebSocket
   */
  private connectWebSocket(): void {
    try {
      const wsUrl = `${this.apiUrl.replace('http', 'ws')}/ws/transcribe`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('[SpeechCore] ✅ WebSocket connecté');
        this.reconnectAttempts = 0;
        this.listeners.onOpen();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as TranscriptionMessage;
          console.log('[SpeechCore] 📨 Message reçu:', data.type);
          this.listeners.onMessage(data);
        } catch (err) {
          console.error('[SpeechCore] ❌ Erreur parsing message:', err);
        }
      };

      this.ws.onerror = (err) => {
        const error = new Error('Erreur WebSocket SpeechCore');
        console.error('[SpeechCore] ❌ Erreur:', err);
        this.listeners.onError(error);
      };

      this.ws.onclose = () => {
        console.log('[SpeechCore] 🔌 WebSocket fermé');
        this.listeners.onClose();
        this.attemptReconnect();
      };
    } catch (err) {
      const error = new Error(`Erreur connexion WebSocket: ${(err as Error).message}`);
      this.listeners.onError(error);
      throw error;
    }
  }

  /**
   * Tentative de reconnexion automatique
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(
        `[SpeechCore] 🔄 Tentative reconnexion ${this.reconnectAttempts}/${this.maxReconnectAttempts}`,
      );
      setTimeout(() => this.connectWebSocket(), this.reconnectDelay);
    }
  }

  /**
   * Capture l'audio du microphone en format WAV 16kHz mono
   */
  private async captureAudioAsWav(stream: MediaStream): Promise<Blob> {
    return new Promise((resolve) => {
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      const audioChunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: mimeType });
        resolve(audioBlob);
      };

      mediaRecorder.start();
      this.mediaRecorder = mediaRecorder;

      // Arrêter après 60 secondes (timeout de sécurité)
      setTimeout(() => {
        if (mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop();
        }
      }, 60000);
    });
  }

  /**
   * Convertit un Blob en base64
   */
  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Arrête la transcription et ferme le WebSocket
   */
  stop(): void {
    console.log('[SpeechCore] 🛑 Arrêt transcription');

    if (this.useFallback) {
      console.log('[SpeechCore] ⏹️ Arrêt fallback Web Speech API');
      speechCoreFallbackService.stop();
      return;
    }

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }

    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.close();
    }
  }

  /**
   * Vérifie si la connexion WebSocket est active
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Envoie un message au serveur SpeechCore
   */
  send(data: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      throw new Error('WebSocket non connecté');
    }
  }
}

// Singleton
export const speechCoreService = new SpeechCoreService(
  import.meta.env.VITE_SPEECHCORE_API_URL || 'http://localhost:8000',
);
