import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  /**
   * Crée un nouveau message
   * POST /messages
   * SÉCURITÉ: senderId est extrait du JWT, pas du body
   */
  @Post()
  create(@Body() createMessageDto: CreateMessageDto, @Request() req: any) {
    const doctorId = req.user.doctorID || req.user.sub;
    // Forcer le senderId depuis le JWT (ignorer ce qui vient du body)
    return this.messagesService.create({
      ...createMessageDto,
      senderId: doctorId,
    });
  }

  /**
   * Récupère tous les messages d'une réunion
   * GET /messages/meeting/:meetingId
   * SÉCURITÉ: Vérifie que l'utilisateur est participant à la réunion
   */
  @Get('meeting/:meetingId')
  async getMessagesByMeeting(@Param('meetingId') meetingId: string, @Request() req: any) {
    const doctorId = req.user.doctorID || req.user.sub;
    const isParticipant = await this.messagesService.checkUserParticipation(meetingId, doctorId);
    if (!isParticipant) {
      throw new ForbiddenException('Vous n\'êtes pas participant à cette réunion');
    }
    return this.messagesService.getMessagesByMeetingId(meetingId);
  }

  /**
   * Récupère tous les messages d'une room
   * GET /messages/room/:roomId
   * SÉCURITÉ: Vérifie que l'utilisateur est participant
   */
  @Get('room/:roomId')
  async getMessagesByRoom(@Param('roomId') roomId: string, @Request() req: any) {
    const doctorId = req.user.doctorID || req.user.sub;
    // roomId = meetingId dans notre architecture
    const isParticipant = await this.messagesService.checkUserParticipation(roomId, doctorId);
    if (!isParticipant) {
      throw new ForbiddenException('Vous n\'êtes pas participant à cette room');
    }
    return this.messagesService.getMessagesByRoomId(roomId);
  }

  /**
   * Crée un message système
   * POST /messages/system
   * Body: { meetingId, roomId, content }
   */
  @Post('system')
  createSystemMessage(
    @Body() body: { meetingId: string; roomId: string; content: string },
  ) {
    const { meetingId, roomId, content } = body;
    return this.messagesService.createSystemMessage(meetingId, roomId, content);
  }

  /**
   * Supprime un message
   * DELETE /messages/:id
   */
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.messagesService.remove(id);
  }
}
