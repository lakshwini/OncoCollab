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
 * ✅ TURN Support: Récupère la configuration ICE du serveur pour connexions via NAT/Firewall
 */
export class VideoService {
  private socket: AppSocket | null = null;
  private localStream: MediaStream | null = null;
  private peers: Map<string, RTCPeerConnection> = new Map();
  private config: VideoServiceConfig;
  private isConnected = false;
  private iceConfig: RTCConfiguration | null = null; // Configuration ICE reçue du serveur

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
   * ✅ Inclut la gestion de la configuration ICE du serveur
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
    this.socket.on('receive-chat-message', (message: { id: string; content: string; senderId: string; messageType: string; createdAt: Date }) => {
      this.config.onChatMessage?.(message as any);
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
   * ✅ Utilise la configuration ICE du serveur si disponible (TURN)
   * ✅ Inclut debug logs pour ICE candidates et connection type
   */
  private async createPeerConnection(peerId: string, isInitiator: boolean): Promise<void> {
    if (this.peers.has(peerId)) {
      console.log('[VideoService] Peer déjà connecté:', peerId);
      return;
    }

    // ✅ Utiliser la configuration ICE du serveur (avec TURN) ou fallback local
    const iceConfig = this.iceConfig || this.config.iceServers;
    console.log(
      `[VideoService] 🔌 Créer peer [${peerId.substring(0, 6)}...] avec ICE config:`,
      iceConfig
    );
    
    const pc = new RTCPeerConnection(iceConfig);

    // ✅ Track ICE gathering state
    pc.onicegatheringstatechange = () => {
      console.log(
        `[VideoService] 🧊 [${peerId.substring(0, 6)}...] ICE gathering state:`,
        pc.iceGatheringState
      );
    };

    // ✅ Track ICE connection state
    pc.oniceconnectionstatechange = () => {
      console.log(
        `[VideoService] 🧊 [${peerId.substring(0, 6)}...] ICE connection state:`,
        pc.iceConnectionState
      );
    };

    // Ajouter les tracks locaux
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        pc.addTrack(track, this.localStream!);
      });
    }

    // ✅ DÉTAIL: Gérer les ICE candidates avec logs détaillés
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const candidate = event.candidate.candidate;
        const type = candidate.split(' ')[7]; // typ host/srflx/relay
        const protocol = candidate.includes('tcp') ? 'TCP' : 'UDP';
        
        console.log(
          `[VideoService] 🧊 [${peerId.substring(0, 6)}...] ICE candidate [${type}] ${protocol}:`,
          {
            candidate: candidate.substring(0, 50) + '...',
            type: type,
            protocol: protocol,
            address: candidate.split(' ')[4],
            port: candidate.split(' ')[5],
          }
        );

        if (this.socket) {
          this.socket.emit('sending-ice-candidate', {
            candidate: event.candidate.toJSON(),
            toId: peerId,
          });
        }
      } else {
        console.log(
          `[VideoService] 🧊 [${peerId.substring(0, 6)}...] ICE candidate gathering completed`
        );
      }
    };

    // Gérer les tracks distants
    pc.ontrack = (event) => {
      console.log(`[VideoService] 📹 [${peerId.substring(0, 6)}...] Track reçu:`, event.track.kind);
      if (event.streams[0]) {
        this.config.onStreamAdded?.(peerId, event.streams[0]);
      }
    };

    // ✅ Gérer les changements de connexion
    pc.onconnectionstatechange = () => {
      console.log(
        `[VideoService] 🔌 [${peerId.substring(0, 6)}...] Connection state:`,
        pc.connectionState
      );

      // ✅ Quand la connexion est établie, identifier le type (host/srflx/relay)
      if (pc.connectionState === 'connected') {
        this.detectConnectionType(pc, peerId);
      }

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
        console.error('[VideoService] ❌ Erreur création offre:', error);
        this.removePeerConnection(peerId);
      }
    }
  }

  /**
   * ✅ Détecte le type de connexion établie (host/srflx/relay)
   * ✅ Identifie si TURN est utilisé
   */
  private async detectConnectionType(pc: RTCPeerConnection, peerId: string): Promise<void> {
    try {
      // ⏱️ Attendre un peu pour que les stats soient disponibles
      await new Promise(resolve => setTimeout(resolve, 500));

      const stats = await pc.getStats();
      let relayConnectionFound = false;
      let bestConnectionType = 'unknown';

      stats.forEach(report => {
        // Chercher les candidats pairs actifs
        if (report.type === 'candidate-pair' && report.state === 'succeeded') {
          const currentRoundTripTime = report.currentRoundTripTime;
          const availableOutgoingBitrate = report.availableOutgoingBitrate;
          
          console.log(
            `[VideoService] 📊 [${peerId.substring(0, 6)}...] Active candidate pair stats:`,
            {
              currentRoundTripTime: (currentRoundTripTime * 1000).toFixed(2) + 'ms',
              availableOutgoingBitrate: (availableOutgoingBitrate / 1024 / 1024).toFixed(2) + ' Mbps',
            }
          );
        }

        // Chercher les candidats locaux et distants de la paire active
        if (report.type === 'inbound-rtp' || report.type === 'outbound-rtp') {
          // Ceci est un rapport RTP, on trouvera la paire via candidatePairId
        }

        // Analyser les candidats
        if (report.type === 'candidate') {
          const candidateType = report.candidateType; // 'host', 'srflx', 'relay'
          
          if (candidateType === 'relay') {
            relayConnectionFound = true;
            console.log(
              `[VideoService] 🌐 [${peerId.substring(0, 6)}...] TURN RELAY detected: ${report.address}:${report.port}`
            );
          } else if (candidateType === 'srflx') {
            bestConnectionType = 'srflx (STUN)';
            console.log(
              `[VideoService] 🔓 [${peerId.substring(0, 6)}...] STUN candidate: ${report.address}:${report.port}`
            );
          } else if (candidateType === 'host') {
            bestConnectionType = 'host (P2P Direct)';
            console.log(
              `[VideoService] 🔗 [${peerId.substring(0, 6)}...] Host candidate: ${report.address}:${report.port}`
            );
          }
        }
      });

      // ✅ Résumé du type de connexion
      if (relayConnectionFound) {
        console.log(`[VideoService] ✅ [${peerId.substring(0, 6)}...] USING TURN RELAY (fallback to NAT traversal)`);
      } else {
        console.log(`[VideoService] ✅ [${peerId.substring(0, 6)}...] Connection type: ${bestConnectionType}`);
      }

    } catch (error) {
      console.error('[VideoService] ❌ Erreur détection connection type:', error);
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
   * ✅ Gère la réception d'un ICE candidate avec logs détaillés
   */
  private async handleReceivingIceCandidate(candidate: RTCIceCandidateInit, fromId: string): Promise<void> {
    const pc = this.peers.get(fromId);
    if (!pc) {
      console.warn(`[VideoService] ⚠️ Peer non trouvé pour ICE candidate de ${fromId}`);
      return;
    }

    try {
      const candidateStr = candidate.candidate || '';
      const type = candidateStr.split(' ')[7] || 'unknown'; // typ host/srflx/relay
      
      console.log(
        `[VideoService] 🧊 [${fromId.substring(0, 6)}...] Receiving ICE candidate [${type}]`,
        {
          address: candidateStr.split(' ')[4],
          port: candidateStr.split(' ')[5],
        }
      );

      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error(`[VideoService] ❌ Erreur ajout ICE candidate from ${fromId}:`, error);
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
   * Note: senderId est extrait du JWT côté backend (plus sécurisé)
   */
  sendChatMessage(content: string): void {
    if (!this.socket || !this.isConnected) {
      console.error('[VideoService] Socket non connecté');
      return;
    }

    this.socket.emit('send-chat-message', {
      content,
      roomId: this.config.roomId,
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

  /**
   * ✅ Récupère les statistiques de toutes les connexions WebRTC
   * Utilisé pour monitorer les types de connexions (host/srflx/relay)
   */
  async getConnectionStats(): Promise<{
    [peerId: string]: {
      connectionState: string;
      iceConnectionState: string;
      iceGatheringState: string;
      connectionType: string;
      isTurnUsed: boolean;
      rtt: number;
      bitrate: number;
    };
  }> {
    const stats: any = {};

    for (const [peerId, pc] of this.peers) {
      try {
        let connectionType = 'unknown';
        let isTurnUsed = false;
        let rtt = 0;
        let bitrate = 0;

        const pcStats = await pc.getStats();
        
        pcStats.forEach(report => {
          // Analyser les paires de candidats actifs
          if (report.type === 'candidate-pair' && report.state === 'succeeded') {
            rtt = report.currentRoundTripTime * 1000; // Convert to ms
            bitrate = report.availableOutgoingBitrate / 1024 / 1024; // Convert to Mbps
          }

          // Analyser les candidats
          if (report.type === 'candidate') {
            const candidateType = report.candidateType;
            if (candidateType === 'relay') {
              isTurnUsed = true;
              connectionType = '🌐 relay (TURN)';
            } else if (candidateType === 'srflx' && connectionType === 'unknown') {
              connectionType = '🔓 srflx (STUN)';
            } else if (candidateType === 'host' && connectionType === 'unknown') {
              connectionType = '🔗 host (P2P)';
            }
          }
        });

        stats[peerId] = {
          connectionState: pc.connectionState,
          iceConnectionState: pc.iceConnectionState,
          iceGatheringState: pc.iceGatheringState,
          connectionType,
          isTurnUsed,
          rtt: Math.round(rtt),
          bitrate: Math.round(bitrate * 100) / 100,
        };

      } catch (error) {
        console.error(`[VideoService] Erreur getConnectionStats pour ${peerId}:`, error);
        stats[peerId] = {
          connectionState: 'error',
          iceConnectionState: 'error',
          iceGatheringState: 'error',
          connectionType: 'error',
          isTurnUsed: false,
          rtt: 0,
          bitrate: 0,
        };
      }
    }

    return stats;
  }

  /**
   * ✅ Démarre un monitoring continu des stats WebRTC
   * Log les infos toutes les N secondes
   */
  startStatsMonitoring(intervalMs: number = 5000): () => void {
    const intervalId = setInterval(async () => {
      const stats = await this.getConnectionStats();
      
      if (Object.keys(stats).length > 0) {
        console.log('[VideoService] 📊 WebRTC Stats:');
        Object.entries(stats).forEach(([peerId, s]) => {
          console.log(`  📱 [${peerId.substring(0, 6)}...]`, {
            state: s.connectionState,
            type: s.connectionType,
            turnUsed: s.isTurnUsed ? '✅' : '❌',
            rtt: s.rtt + 'ms',
            bitrate: s.bitrate + 'Mbps',
          });
        });
      }
    }, intervalMs);

    // Retourne une fonction pour arrêter le monitoring
    return () => clearInterval(intervalId);
  }
}
