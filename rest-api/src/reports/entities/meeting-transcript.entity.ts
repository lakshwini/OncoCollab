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

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
