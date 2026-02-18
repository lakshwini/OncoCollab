import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

export type MessageType = 'text' | 'system';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'meeting_id' })
  meetingId: string;

  @Column({ type: 'uuid', name: 'room_id' })
  roomId: string;

  @Column({ type: 'uuid', name: 'sender_id' })
  senderId: string;

  @Column({ type: 'text' })
  content: string;

  @Column({
    type: 'varchar',
    length: 20,
    name: 'message_type',
    default: 'text'
  })
  messageType: MessageType;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
