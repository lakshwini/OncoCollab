import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Message } from './entities/message.entity';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Vérifie si un utilisateur participe à une réunion
   */
  async checkUserParticipation(meetingId: string, senderId: string): Promise<boolean> {
    const query = `
      SELECT COUNT(*) as count
      FROM meeting_participants
      WHERE meeting_id = $1 AND doctor_id = $2
    `;

    const result = await this.dataSource.query(query, [meetingId, senderId]);
    return parseInt(result[0].count) > 0;
  }

  /**
   * Crée un nouveau message
   * Vérifie que l'utilisateur participe à la réunion avant d'insérer
   */
  async create(createMessageDto: CreateMessageDto): Promise<Message> {
    const { meetingId, senderId, roomId, content, messageType = 'text' } = createMessageDto;

    // Vérifier que l'utilisateur participe à la réunion
    const isParticipant = await this.checkUserParticipation(meetingId, senderId);
    if (!isParticipant) {
      throw new ForbiddenException(
        "Vous ne pouvez pas envoyer de message car vous ne participez pas à cette réunion"
      );
    }

    // Créer et sauvegarder le message
    const newMessage = this.messageRepository.create({
      meetingId,
      roomId,
      senderId,
      content,
      messageType,
    });

    return await this.messageRepository.save(newMessage);
  }

  /**
   * Récupère tous les messages d'une réunion
   * Triés par date croissante
   */
  async getMessagesByMeetingId(meetingId: string): Promise<Message[]> {
    return await this.messageRepository.find({
      where: { meetingId },
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Récupère tous les messages d'une room
   * Triés par date croissante
   */
  async getMessagesByRoomId(roomId: string): Promise<Message[]> {
    return await this.messageRepository.find({
      where: { roomId },
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Crée un message système
   * Ex: "Réunion reportée par l'organisateur"
   */
  async createSystemMessage(
    meetingId: string,
    roomId: string,
    content: string,
  ): Promise<Message> {
    // Pour les messages système, on utilise l'ID du créateur de la réunion ou NULL
    // On va utiliser l'UUID nil (00000000-0000-0000-0000-000000000000) pour les messages système
    const systemSenderId = '00000000-0000-0000-0000-000000000000';

    const systemMessage = this.messageRepository.create({
      meetingId,
      roomId,
      senderId: systemSenderId,
      content,
      messageType: 'system',
    });

    return await this.messageRepository.save(systemMessage);
  }

  /**
   * Sauvegarde un message (utilisé par le WebSocket Gateway)
   */
  async saveMessage(
    meetingId: string,
    roomId: string,
    senderId: string,
    content: string,
  ): Promise<Message> {
    return await this.create({
      meetingId,
      roomId,
      senderId,
      content,
      messageType: 'text',
    });
  }

  /**
   * Récupère l'historique des messages pour une room
   * Alias pour compatibilité avec le VideoGateway
   */
  async getMessagesForRoom(roomId: string): Promise<Message[]> {
    return await this.getMessagesByRoomId(roomId);
  }

  /**
   * Recherche l'ID de meeting à partir du roomId
   * Utile pour le WebSocket qui n'a que le roomId
   */
  async getMeetingIdByRoomId(roomId: string): Promise<string | null> {
    // Chercher dans les meetings en supposant que roomId = meeting.id
    // ou dans une table de mapping room_id -> meeting_id si nécessaire
    const query = `
      SELECT id as meeting_id
      FROM meetings
      WHERE id = $1
    `;

    const result = await this.dataSource.query(query, [roomId]);
    return result[0]?.meeting_id || null;
  }

  /**
   * Récupère tous les messages (admin)
   */
  async findAll(): Promise<Message[]> {
    return await this.messageRepository.find({
      order: { createdAt: 'DESC' },
      take: 100, // Limiter à 100 messages pour performance
    });
  }

  /**
   * Supprime un message
   */
  async remove(id: string): Promise<void> {
    const result = await this.messageRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Message avec l'ID ${id} introuvable`);
    }
  }
}
