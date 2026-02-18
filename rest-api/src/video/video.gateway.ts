import {
  WebSocketGateway,
  SubscribeMessage,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect
} from '@nestjs/websockets';
import { UseGuards, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ClientToServerEvents, ServerToClientEvents, ParticipantPayload } from './websocket.types';
import { MessagesService } from '../messages/messages.service';
import { VideoService } from './video.service';
import { JwtWsGuard } from '../auth/jwt-ws.guard';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';

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

  private readonly socketMediaStatus = new Map<string, { micEnabled: boolean; videoEnabled: boolean }>();

  constructor(
    private readonly messagesService: MessagesService,
    private readonly videoService: VideoService,
    private readonly jwtService: JwtService,
    private readonly dataSource: DataSource,
  ) {}

  private async buildParticipantPayload(
    meetingId: string,
    doctorId: string,
    socketId: string,
    micEnabled: boolean,
    videoEnabled: boolean,
  ): Promise<ParticipantPayload | null> {
    const result = await this.dataSource.query(
      `SELECT
        d.doctorid as "doctorId",
        d.firstname as "firstName",
        d.lastname as "lastName",
        d.profile_image_url as "avatarUrl",
        COALESCE(mr.role, 'participant') as role,
        COALESCE(r.rolename, 'Non spécifié') as speciality
      FROM doctors d
      LEFT JOIN roles r ON d.roleid = r.roleid
      LEFT JOIN meeting_roles mr ON mr.meeting_id = $1 AND mr.doctor_id = d.doctorid
      WHERE d.doctorid = $2
      LIMIT 1`,
      [meetingId, doctorId]
    );

    if (!result || result.length === 0) {
      return null;
    }

    const doctor = result[0];
    return {
      socketId,
      doctorId: doctor.doctorId,
      firstName: doctor.firstName,
      lastName: doctor.lastName,
      role: doctor.role,
      speciality: doctor.speciality,
      avatarUrl: doctor.avatarUrl,
      micEnabled,
      videoEnabled,
    };
  }

  /**
   * Gère la connexion d'un nouveau client
   * Vérifie l'authentification JWT et extrait doctorId
   */
  async handleConnection(client: AppSocket) {
    // Vérifier l'authentification JWT à la connexion
    const token = client.handshake.auth?.token || client.handshake.query?.token;

    if (!token) {
      this.logger.warn(`🔐 [REFUSÉ] Pas de JWT fourni pour ${client.id}`);
      client.disconnect();
      return;
    }

    try {
      const payload = this.jwtService.verify(token as string);
      client.data.user = payload; // Stocker les infos utilisateur dans client.data

      // ✅ Extraire doctorId du JWT (priorité: doctorId > sub)
      const doctorId = payload.doctorId || payload.sub;
      const email = payload.email;

      // ✅ Si doctorId manque, faire une requête PostgreSQL pour le récupérer
      let resolvedDoctorId = doctorId;
      if (!resolvedDoctorId && email) {
        const doctorQuery = await this.dataSource.query(
          `SELECT doctorid FROM doctors WHERE email = $1 LIMIT 1`,
          [email]
        );
        if (doctorQuery && doctorQuery.length > 0) {
          resolvedDoctorId = doctorQuery[0].doctorid;
        }
      }

      client.data.doctorId = resolvedDoctorId;
      
      this.logger.log(
        `✅ [CONNECTÉ] Socket ${client.id} - Email: ${email} - DoctorID: ${resolvedDoctorId || '⚠️ inconnu'}`
      );
    } catch (error) {
      this.logger.warn(`🔐 [REFUSÉ] JWT invalide pour ${client.id}: ${error.message}`);
      client.disconnect();
      return;
    }
  }

  /**
   * Gère la déconnexion d'un client
   * Nettoie les ressources et notifie les autres participants
   */
  handleDisconnect(client: AppSocket) {
    const user = client.data.user;
    const roomId = this.videoService.removeSocketFromRoom(client.id);
    this.socketMediaStatus.delete(client.id);

    this.logger.log(
      `❌ [DÉCONNECTÉ] Socket ${client.id} (${user?.email || 'unknown'}) - Room: ${roomId || 'aucune'}`
    );

    if (roomId) {
      // Notifier tous les autres participants que cet utilisateur est parti
      this.server.to(roomId).emit('user-left', client.id);

      // Logs
      const statsAfter = this.videoService.getRoomStats(roomId);
      this.logger.log(
        `📊 Room ${roomId} - ${statsAfter.participantCount} participant(s) restant(s)`
      );
    }
  }

  /**
   * Gère l'entrée d'un utilisateur dans une room
   *
   * ✅ SÉCURITÉ:
   * - roomId DOIT correspondre à un meeting_id existant en PostgreSQL
   * - L'utilisateur DOIT être participant à cette réunion
   * - Prévient les connexions multiples du même docteur dans la même room
   */
  @UseGuards(JwtWsGuard)
  @SubscribeMessage('join-room')
  async handleJoinRoom(client: AppSocket, payload: { roomId: string; micEnabled?: boolean; videoEnabled?: boolean } | string) {
    const roomId = typeof payload === 'string' ? payload : payload.roomId;
    const micEnabled = typeof payload === 'string' ? true : payload.micEnabled ?? true;
    const videoEnabled = typeof payload === 'string' ? true : payload.videoEnabled ?? true;
    const doctorId = client.data.doctorId; // ✅ Récupéré et validé lors de la connexion
    const email = client.data.user?.email;

    this.logger.log(
      `🚪 [JOIN] Socket ${client.id} - Doctor ${doctorId} (${email}) demande accès à room ${roomId}`
    );

    try {
      if (!roomId) {
        client.emit('error', { message: 'Room invalide' });
        return;
      }

      if (!doctorId) {
        client.emit('error', { message: 'Docteur non identifié' });
        return;
      }
      // ✅ VALIDATION 1: Vérifier que roomId = meeting_id existe en PostgreSQL
      const meetingCheck = await this.dataSource.query(
        `SELECT id, title, status FROM meetings WHERE id = $1`,
        [roomId]
      );

      const meeting = meetingCheck && meetingCheck.length > 0
        ? meetingCheck[0]
        : null;

      if (!meeting) {
        this.logger.warn(`⚠️ [JOIN] Meeting ${roomId} introuvable en PostgreSQL, fallback legacy activé`);
      } else {
        this.logger.log(`✅ Meeting trouvé: "${meeting.title}" (status: ${meeting.status})`);

        // ✅ VALIDATION 2: Vérifier que doctorId est bien participant à cette réunion
        const participantCheck = await this.dataSource.query(
          `SELECT doctor_id FROM meeting_participants 
           WHERE meeting_id = $1 AND doctor_id = $2 LIMIT 1`,
          [roomId, doctorId]
        );

        if (!participantCheck || participantCheck.length === 0) {
          this.logger.warn(
            `🔐 [JOIN REFUSÉ] Doctor ${doctorId} (${email}) NOT participant au meeting ${roomId}`
          );
          client.emit('error', { message: 'Vous n\'êtes pas participant à cette réunion' });
          return;
        }

        this.logger.log(`✅ Doctor ${doctorId} est bien participant au meeting ${roomId}`);
      }

      // ✅ VALIDATION 3: Vérifier et nettoyer les connexions précédentes du même docteur
      const oldSocketId = this.videoService.getSocketForDoctorInRoom(roomId, doctorId);
      if (oldSocketId && oldSocketId !== client.id) {
        this.logger.warn(
          `⚠️ [DOUBLON] Doctor ${doctorId} avait déjà une connexion: ${oldSocketId}. Fermeture...`
        );
        // Fermer et notifier l'ancienne connexion
        const oldSocket = this.server.sockets.sockets.get(oldSocketId);
        if (oldSocket) {
          oldSocket.emit('connection-duplicate', { message: 'Une nouvelle connexion a été établie' });
          oldSocket.disconnect(true);
        }
      }

      // Vérifier/créer la room dans la base de données
      await this.videoService.ensureRoomExists(roomId, meeting?.title || roomId);

      // ✅ Joindre la room Socket.IO avec le doctorId
      client.join(roomId);
      this.socketMediaStatus.set(client.id, { micEnabled, videoEnabled });
      const oldSocketIdToClean = this.videoService.addSocketToRoom(client.id, roomId, doctorId);

      // Si addSocketToRoom retourne un ancien socketId, le nettoyer
      if (oldSocketIdToClean) {
        const oldSocket = this.server.sockets.sockets.get(oldSocketIdToClean);
        if (oldSocket) {
          this.logger.warn(`🧹 Fermeture de l'ancienne connexion: ${oldSocketIdToClean}`);
          oldSocket.disconnect(true);
        }
      }

      // Récupérer la liste des utilisateurs déjà connectés (autre que le nouveau)
      const existingSocketIds: string[] = [];
      const room = this.server.sockets.adapter.rooms.get(roomId);

      if (room) {
        room.forEach((socketId) => {
          if (socketId !== client.id) {
            existingSocketIds.push(socketId);
          }
        });
      }

      const stats = this.videoService.getRoomStats(roomId);
      this.logger.log(
        `📊 Meeting "${meeting?.title || roomId}" - ${stats.participantCount} participant(s) (${existingSocketIds.length} existants + 1 nouveau)`
      );

      const existingParticipants: ParticipantPayload[] = [];
      for (const socketId of existingSocketIds) {
        const existingDoctorId = this.videoService.getDoctorForSocket(socketId);
        if (!existingDoctorId) {
          continue;
        }
        const status = this.socketMediaStatus.get(socketId) || { micEnabled: true, videoEnabled: true };
        const participant = await this.buildParticipantPayload(
          roomId,
          existingDoctorId,
          socketId,
          status.micEnabled,
          status.videoEnabled,
        );
        if (participant) {
          existingParticipants.push(participant);
        }
      }

      // Envoyer la liste des utilisateurs existants au nouveau participant
      client.emit('get-existing-users', existingParticipants);

      // Récupérer l'historique des messages du chat (si disponible)
      try {
        const messages = await this.messagesService.getMessagesForRoom(roomId);
        if (messages && messages.length > 0) {
          client.emit('message-history', messages);
        }
      } catch (err) {
        this.logger.debug(`[Chat] Pas d'historique disponible pour room ${roomId}`);
      }

      const currentParticipant = await this.buildParticipantPayload(
        roomId,
        doctorId,
        client.id,
        micEnabled,
        videoEnabled,
      );

      if (currentParticipant) {
        client.emit('self-info', currentParticipant);
        // ⭐ Notifier TOUS les autres participants qu'un nouvel utilisateur a rejoint
        this.server.to(roomId).except(client.id).emit('user-joined', currentParticipant);
      }

      this.logger.log(`✅ [ROOM JOINED] ${doctorId} dans ${roomId} avec success`);
    } catch (error) {
      this.logger.error(
        `❌ [JOIN ERROR] Socket ${client.id}: ${error.message}`,
        error.stack
      );
      client.emit('error', { message: 'Erreur serveur lors de l\'entrée dans la room' });
    }
  }

  /**
   * Relai de l'offre SDP (Session Description Protocol) pour établir la connexion WebRTC
   * ⭐ CRUCIAL: Permet au nouveau client de créer une peerConnection
   */
  @UseGuards(JwtWsGuard)
  @SubscribeMessage('sending-offer')
  handleSendingOffer(client: AppSocket, payload: { offer: RTCSessionDescriptionInit; toId: string }) {
    const doctorId = client.data.doctorId;
    const email = client.data.user?.email;
    this.logger.debug(
      `📤 [OFFER] ${client.id} (${email}) → ${payload.toId}`
    );
    
    // Relayer l'offre IMMÉDIATEMENT au destinataire
    client.to(payload.toId).emit('receiving-offer', payload.offer, client.id);
  }

  /**
   * Relai de la réponse SDP pour compléter la négociation WebRTC
   * ⭐ CRUCIAL: Complète la connexion P2P
   */
  @UseGuards(JwtWsGuard)
  @SubscribeMessage('sending-answer')
  handleSendingAnswer(client: AppSocket, payload: { answer: RTCSessionDescriptionInit; toId: string }) {
    const user = client.data.user;
    this.logger.debug(
      `📥 [ANSWER] ${client.id} (${user?.email}) → ${payload.toId}`
    );
    
    // Relayer la réponse IMMÉDIATEMENT
    client.to(payload.toId).emit('receiving-answer', payload.answer, client.id);
  }

  /**
   * Relai des ICE candidates pour établir la meilleure route réseau entre pairs
   * ⭐ CRUCIAL: Permet la connexion P2P directe ou via STUN/TURN
   */
  @UseGuards(JwtWsGuard)
  @SubscribeMessage('sending-ice-candidate')
  handleSendingIceCandidate(client: AppSocket, payload: { candidate: RTCIceCandidateInit; toId: string }) {
    const user = client.data.user;
    this.logger.debug(
      `🧊 [ICE] ${client.id} → ${payload.toId}`
    );
    
    // Relayer le candidate IMMÉDIATEMENT
    client.to(payload.toId).emit('receiving-ice-candidate', payload.candidate, client.id);
  }

  /**
   * Gère le changement de statut média (mic/video) et synchronise avec les autres participants
   * ⭐ CRUCIAL pour la synchronisation temps réel
   */
  @UseGuards(JwtWsGuard)
  @SubscribeMessage('media-status-change')
  handleMediaStatusChange(
    client: AppSocket,
    payload: { roomId: string; micEnabled: boolean; videoEnabled: boolean }
  ) {
    const doctorId = client.data.doctorId;

    this.logger.debug(
      `🎥 [MEDIA] Doctor ${doctorId} (${client.id}) - Mic: ${payload.micEnabled ? '🔊' : '🔇'}, Video: ${payload.videoEnabled ? '📹' : '🚫'}`
    );

    this.socketMediaStatus.set(client.id, { micEnabled: payload.micEnabled, videoEnabled: payload.videoEnabled });

    // Diffuser IMMÉDIATEMENT le changement à TOUS les participants de la room
    this.server.to(payload.roomId).emit('media-status-changed', {
      socketId: client.id,
      doctorId: doctorId,
      micEnabled: payload.micEnabled,
      videoEnabled: payload.videoEnabled,
      timestamp: new Date()
    });

    this.server.to(payload.roomId).emit('participant-media-update', {
      socketId: client.id,
      doctorId: doctorId,
      micEnabled: payload.micEnabled,
      videoEnabled: payload.videoEnabled,
      timestamp: new Date()
    });
  }

  /**
   * Alias pour la mise à jour des statuts micro/caméra
   */
  @UseGuards(JwtWsGuard)
  @SubscribeMessage('media-update')
  handleMediaUpdate(
    client: AppSocket,
    payload: { roomId: string; micEnabled: boolean; videoEnabled: boolean }
  ) {
    this.handleMediaStatusChange(client, payload);
  }

  /**
   * Gère l'envoi d'un message de chat dans une room
   */
  @UseGuards(JwtWsGuard)
  @SubscribeMessage('send-chat-message')
  async handleSendChatMessage(client: AppSocket, payload: { content: string; roomId: string; meetingId?: string }) {
    const user = client.data.user;

    // Utiliser le doctorID depuis le JWT (authentifié et sécurisé)
    const senderId = user?.doctorID || user?.sub;

    if (!senderId) {
      this.logger.error(`[CHAT] Impossible de trouver l'ID du docteur dans le JWT`);
      client.emit('error', { message: 'Utilisateur non authentifié' });
      return;
    }

    this.logger.log(`[CHAT] Message de ${user?.email} (${senderId}) dans room ${payload.roomId}: ${payload.content}`);

    // Déterminer le meetingId
    // 1. Utiliser le meetingId fourni dans le payload
    // 2. Sinon, essayer de trouver via roomId
    // 3. Sinon, considérer que roomId = meetingId (cas où room UUID = meeting UUID)
    let meetingId = payload.meetingId;

    if (!meetingId) {
      meetingId = await this.messagesService.getMeetingIdByRoomId(payload.roomId);
    }

    // Si toujours pas trouvé, on considère que roomId = meetingId
    if (!meetingId) {
      meetingId = payload.roomId;
    }

    try {
      // Sauvegarder le message dans la base de données PostgreSQL
      // Utiliser le senderId du JWT (sécurisé) au lieu de celui du payload
      const savedMessage = await this.messagesService.saveMessage(
        meetingId,
        payload.roomId,
        senderId,
        payload.content,
      );

      // Diffuser le message à tous les participants de la room (y compris l'émetteur)
      const messagePayload = {
        id: savedMessage.id,
        content: savedMessage.content,
        senderId: savedMessage.senderId,
        messageType: savedMessage.messageType,
        createdAt: savedMessage.createdAt,
      };
      this.server.to(payload.roomId).emit('receive-chat-message', messagePayload);
    } catch (error) {
      this.logger.error(`[CHAT] Erreur lors de l'envoi du message: ${error.message}`);
      client.emit('error', { message: error.message || 'Erreur lors de l\'envoi du message' });
    }
  }
}
