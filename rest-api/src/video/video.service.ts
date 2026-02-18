import { Injectable, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { RoomsService } from '../rooms/rooms.service';

/**
 * Service de gestion des flux vidéo et des connexions WebRTC
 * Gère les rooms, les participants, les peer connections et évite les doublons
 *
 * Structure:
 * - socketRooms: Map<socketId, roomId>
 * - roomParticipants: Map<roomId, Set<socketId>>
 * - socketDoctors: Map<socketId, doctorId> pour tracker qui est qui
 * - doctorRoomSockets: Map<roomId#doctorId, socketId> pour éviter les doublons
 */
@Injectable()
export class VideoService {
  private readonly logger = new Logger(VideoService.name);

  // Map pour tracker les sockets dans les rooms
  private socketRooms: Map<string, string> = new Map();

  // Map pour tracker les participants par room
  private roomParticipants: Map<string, Set<string>> = new Map();

  // Map pour tracker quel doctorId utilise quel socket
  private socketDoctors: Map<string, string> = new Map();

  // Map pour éviter les doublons: "roomId#doctorId" → socketId précédent
  private doctorRoomSockets: Map<string, string> = new Map();

  constructor(private readonly roomsService: RoomsService) {}

  /**
   * Ajoute un socket à une room et track le docteur
   * Retourne l'ancien socketId s'il existe (pour cleanup)
   */
  addSocketToRoom(socketId: string, roomId: string, doctorId?: string): string | undefined {
    // Tracker le docteur pour ce socket
    if (doctorId) {
      this.socketDoctors.set(socketId, doctorId);

      // Vérifier s'il y a déjà une connexion active du même docteur dans cette room
      const existingKey = `${roomId}#${doctorId}`;
      const existingSocketId = this.doctorRoomSockets.get(existingKey);

      if (existingSocketId && existingSocketId !== socketId) {
        this.logger.warn(
          `[DOUBLON] Docteur ${doctorId} a déjà une connexion active (${existingSocketId}) dans room ${roomId}. Nouvelle: ${socketId}`
        );
        // Retourner l'ancien socketId pour le nettoyer
        return existingSocketId;
      }

      // Tracker cette nouvelle connexion
      this.doctorRoomSockets.set(existingKey, socketId);
    }

    // Ajouter à la room
    this.socketRooms.set(socketId, roomId);

    if (!this.roomParticipants.has(roomId)) {
      this.roomParticipants.set(roomId, new Set());
    }
    this.roomParticipants.get(roomId)!.add(socketId);

    this.logger.log(`✅ Socket ${socketId} (docteur: ${doctorId || 'inconnu'}) ajouté à room ${roomId} (${this.roomParticipants.get(roomId)!.size} participants)`);

    return undefined;
  }

  /**
   * Retire un socket d'une room et nettoie les références
   */
  removeSocketFromRoom(socketId: string): string | undefined {
    const roomId = this.socketRooms.get(socketId);
    const doctorId = this.socketDoctors.get(socketId);

    if (roomId) {
      this.socketRooms.delete(socketId);
      this.roomParticipants.get(roomId)?.delete(socketId);

      // Nettoyer la map de doctor->socket
      if (doctorId) {
        const key = `${roomId}#${doctorId}`;
        if (this.doctorRoomSockets.get(key) === socketId) {
          this.doctorRoomSockets.delete(key);
        }
      }

      // Nettoyer la map socket->doctor
      this.socketDoctors.delete(socketId);

      // Nettoyer la room si elle est vide
      if (this.roomParticipants.get(roomId)?.size === 0) {
        this.roomParticipants.delete(roomId);
        this.logger.log(`🧹 Room ${roomId} supprimée (vide)`);
      }

      this.logger.log(
        `❌ Socket ${socketId} (docteur: ${doctorId || 'inconnu'}) retiré de room ${roomId} (${this.roomParticipants.get(roomId)?.size || 0} participants restants)`
      );
    }

    return roomId;
  }

  /**
   * Récupère la room d'un socket
   */
  getSocketRoom(socketId: string): string | undefined {
    return this.socketRooms.get(socketId);
  }

  /**
   * Récupère tous les participants d'une room
   */
  getRoomParticipants(roomId: string): string[] {
    return Array.from(this.roomParticipants.get(roomId) || []);
  }

  /**
   * Récupère le nombre de participants dans une room
   */
  getRoomParticipantCount(roomId: string): number {
    return this.roomParticipants.get(roomId)?.size || 0;
  }

  /**
   * Vérifie si une room existe et est active
   */
  async ensureRoomExists(roomId: string, name?: string): Promise<boolean> {
    try {
      await this.roomsService.findOrCreateByRoomId(roomId, name);
      return true;
    } catch (error) {
      this.logger.error(`Erreur lors de la vérification de la room ${roomId}:`, error);
      return false;
    }
  }

  /**
   * Récupère les statistiques d'une room
   */
  getRoomStats(roomId: string) {
    const participants = this.getRoomParticipants(roomId);
    return {
      roomId,
      participantCount: participants.length,
      participants,
      isActive: participants.length > 0,
    };
  }

  /**
   * Récupère toutes les rooms actives
   */
  getActiveRooms() {
    const rooms = Array.from(this.roomParticipants.entries()).map(([roomId, participants]) => ({
      roomId,
      participantCount: participants.size,
      participants: Array.from(participants),
    }));

    return rooms.filter(room => room.participantCount > 0);
  }

  /**
   * Récupère le doctorId d'un socket
   */
  getDoctorForSocket(socketId: string): string | undefined {
    return this.socketDoctors.get(socketId);
  }

  /**
   * Récupère le socketId actif d'un docteur dans une room
   */
  getSocketForDoctorInRoom(roomId: string, doctorId: string): string | undefined {
    const key = `${roomId}#${doctorId}`;
    return this.doctorRoomSockets.get(key);
  }

  /**
   * Nettoie toutes les références orphelines (debug)
   */
  cleanupOrphanedReferences(): number {
    let cleaned = 0;

    // Nettoyer les sockets qui n'existent plus dans socketRooms
    this.socketDoctors.forEach((doctorId, socketId) => {
      if (!this.socketRooms.has(socketId)) {
        this.socketDoctors.delete(socketId);
        cleaned++;
      }
    });

    // Nettoyer les références doctor->socket orphelines
    this.doctorRoomSockets.forEach((socketId, key) => {
      if (!this.socketRooms.has(socketId)) {
        this.doctorRoomSockets.delete(key);
        cleaned++;
      }
    });

    if (cleaned > 0) {
      this.logger.log(`🧹 ${cleaned} références orphelines nettoyées`);
    }

    return cleaned;
  }
}
