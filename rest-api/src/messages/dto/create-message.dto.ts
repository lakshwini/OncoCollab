import { IsString, IsNotEmpty, IsUUID, IsEnum, IsOptional } from 'class-validator';
import type { MessageType } from '../entities/message.entity';

export class CreateMessageDto {
  @IsUUID()
  @IsNotEmpty()
  meetingId: string;

  @IsUUID()
  @IsNotEmpty()
  roomId: string;

  @IsUUID()
  @IsNotEmpty()
  senderId: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsEnum(['text', 'system'])
  @IsOptional()
  messageType?: MessageType;
}
