import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('meeting_transcripts')
export class MeetingTranscript {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'meeting_id' })
  meetingId: string;

  @Column({ type: 'text', name: 'raw_transcript' })
  rawTranscript: string;

  @Column({ type: 'varchar', length: 10, default: 'fr' })
  language: string;

  @Column({ type: 'int', name: 'duration_seconds', nullable: true })
  durationSeconds: number;

  @Column({ type: 'uuid', name: 'created_by', nullable: true })
  createdBy: string;

  @Column({ type: 'jsonb', name: 'speaker_blocks', nullable: true })
  speakerBlocks?: Array<{
    speakerId?: string;
    speakerName: string;
    text: string;
    blockOrder: number;
    timestampSeconds?: number;
  }>;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'whisper',
    name: 'transcription_source',
  })
  transcriptionSource: 'speechcore' | 'whisper' | 'manual';

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
