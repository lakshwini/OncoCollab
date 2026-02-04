import { Injectable, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { RoomsService } from '../rooms/rooms.service';

/**
 * Service de gestion des flux vidéo et des connexions WebRTC
 * Gère les rooms, les participants et les streams
 */
@Injectable()
export class VideoService {
  private readonly logger = new Logger(VideoService.name);

  // Map pour tracker les sockets dans les rooms
  private socketRooms: Map<string, string> = new Map();

  // Map pour tracker les participants par room
  private roomParticipants: Map<string, Set<string>> = new Map();

  constructor(private readonly roomsService: RoomsService) {}

  /**
   * Ajoute un socket à une room
   */
  addSocketToRoom(socketId: string, roomId: string): void {
    this.socketRooms.set(socketId, roomId);

    if (!this.roomParticipants.has(roomId)) {
      this.roomParticipants.set(roomId, new Set());
    }
    this.roomParticipants.get(roomId)!.add(socketId);

    this.logger.log(`Socket ${socketId} ajouté à la room ${roomId}`);
  }

  /**
   * Retire un socket d'une room
   */
  removeSocketFromRoom(socketId: string): string | undefined {
    const roomId = this.socketRooms.get(socketId);

    if (roomId) {
      this.socketRooms.delete(socketId);
      this.roomParticipants.get(roomId)?.delete(socketId);

      // Nettoyer la room si elle est vide
      if (this.roomParticipants.get(roomId)?.size === 0) {
        this.roomParticipants.delete(roomId);
      }

      this.logger.log(`Socket ${socketId} retiré de la room ${roomId}`);
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
}
