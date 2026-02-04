import {
  WebSocketGateway,
  SubscribeMessage,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect
} from '@nestjs/websockets';
import { UseGuards, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ClientToServerEvents, ServerToClientEvents } from './websocket.types';
import { MessagesService } from '../messages/messages.service';
import { VideoService } from './video.service';
import { JwtWsGuard } from '../auth/jwt-ws.guard';
import { JwtService } from '@nestjs/jwt';

type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

/**
 * Gateway WebSocket pour la gestion des flux vidéo et de la signalisation WebRTC
 * Gère les connexions, les rooms, et le relai des messages de signalisation (SDP, ICE)
 */
@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class VideoGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server<ClientToServerEvents, ServerToClientEvents>;

  private readonly logger = new Logger(VideoGateway.name);

  constructor(
    private readonly messagesService: MessagesService,
    private readonly videoService: VideoService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Gère la connexion d'un nouveau client
   * Vérifie l'authentification JWT
   */
  handleConnection(client: AppSocket) {
    // Vérifier l'authentification JWT à la connexion
    const token = client.handshake.auth?.token || client.handshake.query?.token;

    if (!token) {
      this.logger.warn(`[CONNEXION REFUSÉE] Pas de token JWT fourni pour ${client.id}`);
      client.disconnect();
      return;
    }

    try {
      const payload = this.jwtService.verify(token as string);
      client.data.user = payload; // Stocker les infos utilisateur dans client.data
      this.logger.log(`[CONNEXION] Utilisateur authentifié: ${client.id} (${payload.email})`);
    } catch (error) {
      this.logger.warn(`[CONNEXION REFUSÉE] Token JWT invalide pour ${client.id}`);
      client.disconnect();
      return;
    }
  }

  /**
   * Gère la déconnexion d'un client
   * Nettoie les ressources et notifie les autres participants
   */
  handleDisconnect(client: AppSocket) {
    const roomId = this.videoService.removeSocketFromRoom(client.id);
    this.logger.log(`[DECONNEXION] Utilisateur: ${client.id}, room: ${roomId || 'aucune'}`);

    if (roomId) {
      // Notifier tous les autres participants que cet utilisateur est parti
      client.broadcast.to(roomId).emit('user-left', client.id);
    }
  }

  /**
   * Gère l'entrée d'un utilisateur dans une room
   */
  @UseGuards(JwtWsGuard)
  @SubscribeMessage('join-room')
  async handleJoinRoom(client: AppSocket, roomId: string) {
    const user = client.data.user;
    this.logger.log(`[ROOM] ${client.id} (${user?.email}) rejoint la room ${roomId}`);

    // Vérifier/créer la room dans la base de données
    await this.videoService.ensureRoomExists(roomId);

    // Joindre la room Socket.IO
    client.join(roomId);
    this.videoService.addSocketToRoom(client.id, roomId);

    // Récupérer la liste des utilisateurs déjà connectés
    const activeUsers: string[] = [];
    const room = this.server.sockets.adapter.rooms.get(roomId);

    if (room) {
      room.forEach((socketId) => {
        if (socketId !== client.id) {
          activeUsers.push(socketId);
        }
      });
    }

    this.logger.log(`[ROOM] Utilisateurs actifs dans ${roomId}:`, activeUsers);

    // Envoyer la liste des utilisateurs existants au nouveau participant
    client.emit('get-existing-users', activeUsers);

    // Récupérer l'historique des messages du chat
    const messages = await this.messagesService.getMessagesForRoom(roomId);
    if (messages && messages.length > 0) {
      client.emit('message-history', messages);
    }

    // Notifier tous les autres participants qu'un nouvel utilisateur a rejoint
    client.broadcast.to(roomId).emit('user-joined', client.id);
  }

  /**
   * Relai de l'offre SDP (Session Description Protocol) pour établir la connexion WebRTC
   */
  @UseGuards(JwtWsGuard)
  @SubscribeMessage('sending-offer')
  handleSendingOffer(client: AppSocket, payload: { offer: RTCSessionDescriptionInit; toId: string }) {
    const user = client.data.user;
    this.logger.debug(`[SIGNALING] Offer de ${client.id} (${user?.email}) vers ${payload.toId}`);
    client.to(payload.toId).emit('receiving-offer', payload.offer, client.id);
  }

  /**
   * Relai de la réponse SDP pour compléter la négociation WebRTC
   */
  @UseGuards(JwtWsGuard)
  @SubscribeMessage('sending-answer')
  handleSendingAnswer(client: AppSocket, payload: { answer: RTCSessionDescriptionInit; toId: string }) {
    const user = client.data.user;
    this.logger.debug(`[SIGNALING] Answer de ${client.id} (${user?.email}) vers ${payload.toId}`);
    client.to(payload.toId).emit('receiving-answer', payload.answer, client.id);
  }

  /**
   * Relai des ICE candidates pour établir la meilleure route réseau entre pairs
   */
  @UseGuards(JwtWsGuard)
  @SubscribeMessage('sending-ice-candidate')
  handleSendingIceCandidate(client: AppSocket, payload: { candidate: RTCIceCandidateInit; toId: string }) {
    const user = client.data.user;
    this.logger.debug(`[SIGNALING] ICE Candidate de ${client.id} (${user?.email}) vers ${payload.toId}`);
    client.to(payload.toId).emit('receiving-ice-candidate', payload.candidate, client.id);
  }

  /**
   * Gère l'envoi d'un message de chat dans une room
   */
  @UseGuards(JwtWsGuard)
  @SubscribeMessage('send-chat-message')
  async handleSendChatMessage(client: AppSocket, payload: { content: string; roomId: string; senderId: string }) {
    const user = client.data.user;
    this.logger.log(`[CHAT] Message de ${user?.email} dans room ${payload.roomId}: ${payload.content}`);

    // Sauvegarder le message dans la base de données
    await this.messagesService.saveMessage(payload.content, payload.senderId, payload.roomId);

    // Diffuser le message à tous les autres participants de la room
    client.broadcast.to(payload.roomId).emit('receive-chat-message', payload.content, payload.senderId, new Date());
  }
}
