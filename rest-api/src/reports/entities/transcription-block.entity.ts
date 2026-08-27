import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';

/**
 * TranscriptionBlock
 * Représente un bloc de transcription vocale (une "prise de parole")
 * Utilisé dans les visioconférences pour tracker qui a parlé quoi et quand
 */
@Entity('transcription_blocks')
@Index(['meetingId', 'blockOrder'])
export class TranscriptionBlock {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'meeting_id' })
  meetingId: string;

  @Column({ type: 'uuid', name: 'speaker_id', nullable: true })
  speakerId: string;

  @Column({ type: 'varchar', length: 255, name: 'speaker_name', nullable: true })
  speakerName: string;

  @Column({ type: 'text' })
  text: string;

  @Column({ type: 'int', name: 'block_order' })
  blockOrder: number;

  @Column({ type: 'int', name: 'timestamp_seconds', nullable: true })
  timestampSeconds: number;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'speechcore',
    name: 'source'
  })
  source: 'speechcore' | 'whisper' | 'manual';

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
