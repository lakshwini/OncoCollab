import { io, Socket } from 'socket.io-client';
import { ClientToServerEvents, ServerToClientEvents, ParticipantPayload } from '../types/video';
import { API_CONFIG } from '../config/api.config';

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export interface VideoServiceConfig {
  serverUrl?: string;
  authToken: string;
  roomId: string;
  iceServers?: RTCConfiguration;
  onStreamAdded?: (peerId: string, stream: MediaStream) => void;
  onStreamRemoved?: (peerId: string) => void;
  onUserJoined?: (userId: string) => void;
  onUserLeft?: (userId: string) => void;
  onChatMessage?: (message: { content: string; senderId: string; timestamp: Date }) => void;
  onMessageHistory?: (messages: any[]) => void;
  onConnectionStatusChange?: (status: 'connecting' | 'connected' | 'disconnected' | 'error') => void;
}

/**
 * Service de gestion des connexions vidéo WebRTC et WebSocket
 * Encapsule toute la logique de signalisation, gestion des peers et des streams
 */
export class VideoService {
  private socket: AppSocket | null = null;
  private localStream: MediaStream | null = null;
  private peers: Map<string, RTCPeerConnection> = new Map();
  private config: VideoServiceConfig;
  private isConnected = false;

  constructor(config: VideoServiceConfig) {
    this.config = {
      serverUrl: API_CONFIG.WEBSOCKET_URL,
      iceServers: API_CONFIG.ICE_SERVERS,
      ...config,
    };
  }

  /**
   * Initialise le service et se connecte au serveur
   */
  async connect(localStream: MediaStream): Promise<void> {
    this.localStream = localStream;
    this.updateStatus('connecting');

    try {
      // Créer la connexion Socket.IO
      this.socket = io(this.config.serverUrl!, {
        ...API_CONFIG.SOCKET_CONFIG,
        auth: { token: this.config.authToken },
      }) as AppSocket;

      this.setupSocketListeners();

      // Attendre la connexion
      await new Promise<void>((resolve, reject) => {
        this.socket!.on('connect', () => {
          this.isConnected = true;
          this.updateStatus('connected');
          resolve();
        });

        this.socket!.on('connect_error', (error) => {
          this.updateStatus('error');
          reject(error);
        });

        // Timeout de 10 secondes
        setTimeout(() => reject(new Error('Connection timeout')), 10000);
      });

      // Rejoindre la room
      this.socket.emit('join-room', { roomId: this.config.roomId, micEnabled: true, videoEnabled: true });

    } catch (error) {
      this.updateStatus('error');
      throw error;
    }
  }

  /**
   * Configure les écouteurs d'événements du socket
   */
  private setupSocketListeners(): void {
    if (!this.socket) return;

    // Utilisateurs existants dans la room
    this.socket.on('get-existing-users', async (users: ParticipantPayload[]) => {
      const normalized = users || [];
      console.log('[VideoService] Utilisateurs existants:', normalized.map(u => u.socketId));
      for (const user of normalized) {
        const userId = user.socketId;
        await this.createPeerConnection(userId, true);
      }
    });

    // Nouvel utilisateur rejoint
    this.socket.on('user-joined', async (participant: ParticipantPayload) => {
      const userId = participant.socketId;
      console.log('[VideoService] Utilisateur rejoint:', userId);
      this.config.onUserJoined?.(userId);
      await this.createPeerConnection(userId, true);
    });

    // Utilisateur quitte
    this.socket.on('user-left', (userId: string) => {
      console.log('[VideoService] Utilisateur parti:', userId);
      this.removePeerConnection(userId);
      this.config.onUserLeft?.(userId);
      this.config.onStreamRemoved?.(userId);
    });

    // Réception d'une offre
    this.socket.on('receiving-offer', async (offer: RTCSessionDescriptionInit, fromId: string) => {
      console.log('[VideoService] Offre reçue de:', fromId);
      await this.handleReceivingOffer(offer, fromId);
    });

    // Réception d'une réponse
    this.socket.on('receiving-answer', async (answer: RTCSessionDescriptionInit, fromId: string) => {
      console.log('[VideoService] Réponse reçue de:', fromId);
      await this.handleReceivingAnswer(answer, fromId);
    });

    // Réception d'un ICE candidate
    this.socket.on('receiving-ice-candidate', async (candidate: RTCIceCandidateInit, fromId: string) => {
      await this.handleReceivingIceCandidate(candidate, fromId);
    });

    // Messages du chat
    this.socket.on('receive-chat-message', (content: string, senderId: string, timestamp: Date) => {
      this.config.onChatMessage?.({ content, senderId, timestamp });
    });

    // Historique des messages
    this.socket.on('message-history', (messages: any[]) => {
      this.config.onMessageHistory?.(messages);
    });

    // Déconnexion
    this.socket.on('disconnect', () => {
      this.isConnected = false;
      this.updateStatus('disconnected');
    });
  }

  /**
   * Crée une connexion peer-to-peer avec un utilisateur
   */
  private async createPeerConnection(peerId: string, isInitiator: boolean): Promise<void> {
    if (this.peers.has(peerId)) {
      console.log('[VideoService] Peer déjà connecté:', peerId);
      return;
    }

    const pc = new RTCPeerConnection(this.config.iceServers);

    // Ajouter les tracks locaux
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        pc.addTrack(track, this.localStream!);
      });
    }

    // Gérer les ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && this.socket) {
        this.socket.emit('sending-ice-candidate', {
          candidate: event.candidate.toJSON(),
          toId: peerId,
        });
      }
    };

    // Gérer les tracks distants
    pc.ontrack = (event) => {
      console.log('[VideoService] Track reçu de:', peerId);
      if (event.streams[0]) {
        this.config.onStreamAdded?.(peerId, event.streams[0]);
      }
    };

    // Gérer les changements de connexion
    pc.onconnectionstatechange = () => {
      console.log(`[VideoService] État de connexion avec ${peerId}:`, pc.connectionState);
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        this.removePeerConnection(peerId);
      }
    };

    this.peers.set(peerId, pc);

    // Si on est l'initiateur, créer et envoyer une offre
    if (isInitiator) {
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        if (this.socket) {
          this.socket.emit('sending-offer', {
            offer: pc.localDescription!,
            toId: peerId,
          });
        }
      } catch (error) {
        console.error('[VideoService] Erreur création offre:', error);
        this.removePeerConnection(peerId);
      }
    }
  }

  /**
   * Gère la réception d'une offre
   */
  private async handleReceivingOffer(offer: RTCSessionDescriptionInit, fromId: string): Promise<void> {
    let pc = this.peers.get(fromId);

    if (!pc) {
      await this.createPeerConnection(fromId, false);
      pc = this.peers.get(fromId);
    }

    if (!pc) return;

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      if (this.socket) {
        this.socket.emit('sending-answer', {
          answer: pc.localDescription!,
          toId: fromId,
        });
      }
    } catch (error) {
      console.error('[VideoService] Erreur traitement offre:', error);
    }
  }

  /**
   * Gère la réception d'une réponse
   */
  private async handleReceivingAnswer(answer: RTCSessionDescriptionInit, fromId: string): Promise<void> {
    const pc = this.peers.get(fromId);
    if (!pc) return;

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (error) {
      console.error('[VideoService] Erreur traitement réponse:', error);
    }
  }

  /**
   * Gère la réception d'un ICE candidate
   */
  private async handleReceivingIceCandidate(candidate: RTCIceCandidateInit, fromId: string): Promise<void> {
    const pc = this.peers.get(fromId);
    if (!pc) return;

    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('[VideoService] Erreur ajout ICE candidate:', error);
    }
  }

  /**
   * Supprime une connexion peer
   */
  private removePeerConnection(peerId: string): void {
    const pc = this.peers.get(peerId);
    if (pc) {
      pc.close();
      this.peers.delete(peerId);
    }
  }

  /**
   * Envoie un message de chat
   */
  sendChatMessage(content: string, senderId: string): void {
    if (!this.socket || !this.isConnected) {
      console.error('[VideoService] Socket non connecté');
      return;
    }

    this.socket.emit('send-chat-message', {
      content,
      roomId: this.config.roomId,
      senderId,
    });
  }

  /**
   * Ferme toutes les connexions
   */
  disconnect(): void {
    // Fermer toutes les connexions peer
    this.peers.forEach(pc => pc.close());
    this.peers.clear();

    // Déconnecter le socket
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.isConnected = false;
    this.updateStatus('disconnected');
  }

  /**
   * Met à jour le statut de connexion
   */
  private updateStatus(status: 'connecting' | 'connected' | 'disconnected' | 'error'): void {
    this.config.onConnectionStatusChange?.(status);
  }

  /**
   * Remplace le stream local (changement de caméra/micro)
   */
  replaceLocalStream(newStream: MediaStream): void {
    this.localStream = newStream;

    // Remplacer les tracks dans toutes les connexions peer
    this.peers.forEach(pc => {
      const senders = pc.getSenders();
      newStream.getTracks().forEach(track => {
        const sender = senders.find(s => s.track?.kind === track.kind);
        if (sender) {
          sender.replaceTrack(track);
        }
      });
    });
  }

  /**
   * Récupère l'ID du socket
   */
  getSocketId(): string | null {
    return this.socket?.id || null;
  }

  /**
   * Vérifie si le service est connecté
   */
  isServiceConnected(): boolean {
    return this.isConnected;
  }
}
